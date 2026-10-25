-- Test data for the oversell guard: put every product at exactly 1 unit so two
-- concurrent checkouts have to fight over the last one.
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Re-runnable. Run add_stock_reservation.sql FIRST, or nothing enforces this.

update public.products set stock = 1;

-- Any pending order placed before the stock guard existed still points at
-- units that were never deducted. Cancel them so they cannot be paid and so
-- release_order_stock() cannot later credit back stock that was never taken.
update public.orders set status = 'cancelled' where status = 'pending';

select name, stock from public.products order by name;
