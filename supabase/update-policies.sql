-- ============================================================
-- Run this AFTER adding SUPABASE_SERVICE_ROLE_KEY to .env.local
-- It removes the permissive INSERT policies since orders are
-- now inserted server-side via the service role key.
-- ============================================================

-- Remove overly permissive INSERT policies
drop policy if exists "Anyone can place orders" on orders;
drop policy if exists "Anyone can insert order items" on order_items;

-- Orders and order_items can now only be written server-side
-- (via the service role key in /api/orders). No browser access needed.
--
-- Next steps (Supabase security linter):
-- 1) rls-orders-order-items.sql — deny anon/auth on orders + order_items
-- 2) rls-order-status-logs.sql — enable RLS + deny anon/auth on order_status_logs
--    (skip #2 if shipping-and-status.sql was already run with the RLS block at the end)
