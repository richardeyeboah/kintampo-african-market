-- ============================================================
-- Fix: "RLS enabled but no policies" on orders / order_items
-- Run once in Supabase SQL Editor (safe to re-run).
--
-- Intent: Block browser (anon) and logged-in Supabase users
-- (authenticated) from reading or writing orders data directly.
-- Your Next.js API uses the service role key, which bypasses RLS.
--
-- Also removes legacy permissive INSERT policies if they still exist
-- (must drop those first — otherwise PERMISSIVE policies OR together
-- and open inserts could remain allowed).
-- ============================================================

drop policy if exists "Anyone can place orders" on orders;
drop policy if exists "Anyone can insert order items" on order_items;

drop policy if exists "service_role_only_orders" on orders;
drop policy if exists "service_role_only_order_items" on order_items;

-- Deny all operations for anon + authenticated PostgREST roles.
-- USING (false) / WITH CHECK (false) = no rows pass; no inserts allowed.
create policy "service_role_only_orders"
  on orders
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "service_role_only_order_items"
  on order_items
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on policy "service_role_only_orders" on orders is
  'Direct DB access only via service_role (server). Anon/auth blocked.';

comment on policy "service_role_only_order_items" on order_items is
  'Direct DB access only via service_role (server). Anon/auth blocked.';
