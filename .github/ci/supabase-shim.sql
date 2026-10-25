-- Minimal stand-in for the pieces of a Supabase project that supabase/*.sql
-- leans on, so the schema and migrations can be applied to a plain Postgres
-- container in CI. This is NOT a Supabase replica: it only has to make the
-- files parse, resolve, and run. Never apply it to a real project.

-- Roles that GRANT/REVOKE statements in the migrations target.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

create schema if not exists auth;

-- public.profiles references auth.users(id), and handle_new_user() triggers off
-- inserts into it and reads email / raw_user_meta_data.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS policies call auth.uid(). In CI there is no JWT, so it reads an optional
-- session setting and otherwise returns NULL (the anonymous case).
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to anon, authenticated, service_role;
