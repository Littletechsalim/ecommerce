-- Claims product stock inside the checkout transaction so two shoppers cannot
-- both buy the last unit, and adds release_order_stock() to hand the units back
-- when a Stripe Checkout Session expires unpaid.
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- (Safe to re-run: both functions are CREATE OR REPLACE.)

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
