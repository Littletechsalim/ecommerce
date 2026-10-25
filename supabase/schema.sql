-- ShopWave schema: profiles, products, cart_items, orders, order_items
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> New query -> Run.

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- auto-create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  category text,
  rating numeric(2,1),
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products: public read" on public.products
  for select using (true);
-- No insert/update/delete policy for authenticated/anon: only the
-- service_role (Supabase dashboard / server-side admin key) can write products.

-- cart_items
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

create policy "cart_items: owner select" on public.cart_items
  for select using (auth.uid() = user_id);
create policy "cart_items: owner insert" on public.cart_items
  for insert with check (auth.uid() = user_id);
create policy "cart_items: owner update" on public.cart_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cart_items: owner delete" on public.cart_items
  for delete using (auth.uid() = user_id);

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'fulfilled', 'cancelled')),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "orders: owner select" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders: owner insert" on public.orders
  for insert with check (auth.uid() = user_id);
-- No update/delete policy: a buyer cannot edit or cancel an order once placed.

-- order_items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

create policy "order_items: owner select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );
-- No insert/update/delete policy: rows are only ever written by the
-- SECURITY DEFINER place_order() function below, which bypasses RLS.

-- checkout: atomically turn the caller's cart into an order, claiming stock
create or replace function public.place_order()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_total numeric(10,2);
  v_short record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Serialize concurrent checkouts that want the same unit. Without this lock
  -- two carts both read stock = 1 under READ COMMITTED, both pass the check
  -- below, and both orders get placed. Ordered by product id so two carts that
  -- overlap on several products always take the locks in the same order and
  -- cannot deadlock against each other.
  perform p.id
  from public.products p
  join public.cart_items c on c.product_id = p.id
  where c.user_id = v_user_id
  order by p.id
  for update of p;

  -- First shortfall wins the message. Raising rolls back the whole function,
  -- so there is never a partial order or a partially applied decrement.
  select p.name, p.stock, c.quantity
    into v_short
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_user_id
    and p.stock < c.quantity
  limit 1;

  if found then
    raise exception 'Only % left of "%" - you asked for %',
      v_short.stock, v_short.name, v_short.quantity;
  end if;

  select coalesce(sum(p.price * c.quantity), 0)
    into v_total
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_user_id;

  if v_total = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into public.orders (user_id, status, total)
  values (v_user_id, 'pending', v_total)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantity, unit_price)
  select v_order_id, c.product_id, c.quantity, p.price
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_user_id;

  -- Claim the units while the locks above are still held. The pending order
  -- now holds the stock; release_order_stock() gives it back if the Stripe
  -- session expires unpaid. check (stock >= 0) is the last-resort backstop.
  update public.products p
     set stock = p.stock - c.quantity
  from public.cart_items c
  where c.product_id = p.id
    and c.user_id = v_user_id;

  delete from public.cart_items where user_id = v_user_id;

  return v_order_id;
end;
$$;

grant execute on function public.place_order() to authenticated;

-- Give back the stock held by an unpaid order. Called by the Stripe webhook
-- when a Checkout Session expires.
create or replace function public.release_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only a still-pending order holds stock. Flipping the status first, with
  -- the status in the WHERE clause, is the idempotency gate: a retried webhook
  -- delivery matches zero rows and skips the restock below, so units can never
  -- be credited back twice.
  update public.orders
     set status = 'cancelled'
   where id = p_order_id
     and status = 'pending';

  if not found then
    return false;
  end if;

  update public.products p
     set stock = p.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.product_id = p.id;

  return true;
end;
$$;

-- Postgres grants execute to `public` by default. This function is SECURITY
-- DEFINER and cancels orders, so the default grant would let any logged-in
-- buyer cancel and restock arbitrary orders over RPC. Only the service_role
-- key used by the webhook may call it.
revoke execute on function public.release_order_stock(uuid) from public, anon, authenticated;
grant execute on function public.release_order_stock(uuid) to service_role;


-- seed a few products so the storefront has something to show
insert into public.products (name, description, price, image_url, category, rating, stock) values
  ('Wireless Noise-Cancelling Headphones', 'Premium over-ear headphones with active noise cancellation and 30-hour battery life. Features foldable design, USB-C charging, and multipoint Bluetooth for seamless device switching.', 299.99, null, 'Electronics', 4.8, 42),
  ('Running Sneakers Pro', 'Lightweight responsive running shoes built for everyday training and race day. Breathable mesh upper with a cushioned midsole that returns energy with every stride.', 129.99, null, 'Footwear', 4.5, 78),
  ('Stainless Steel Water Bottle', 'Vacuum-insulated 32oz bottle keeps drinks cold for 24 hours or hot for 12. BPA-free, leak-proof lid, and a powder-coated exterior that won''t slip from your grip.', 34.99, null, 'Accessories', 4.7, 150);
