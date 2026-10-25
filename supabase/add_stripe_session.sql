-- Adds a column to track the Stripe Checkout Session behind each order.
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- (Run this once; it only needs to happen after the initial schema.sql.)

alter table public.orders
  add column if not exists stripe_session_id text unique;
