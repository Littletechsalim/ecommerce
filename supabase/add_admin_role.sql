-- Add role column to profiles table if not present
alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

-- Update existing known admin profiles
update public.profiles
set role = 'admin'
where id in (
  select id from auth.users where email in ('slalturkmani@gmail.com', 'loualturkmani@gmail.com')
);

-- Index on role for fast lookups
create index if not exists idx_profiles_role on public.profiles(role);
