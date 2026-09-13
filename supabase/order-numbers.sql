-- ============================================================
-- Friendly order numbers (e.g. LQ-1001)
-- Run once in Supabase: SQL Editor → New Query → Run
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- 1. Dedicated sequence starting at 1001 so the first human order is LQ-1001.
create sequence if not exists orders_order_number_seq start 1001;

-- 2. Add the column. The default fills every existing row when added.
--    bigint so we never run out; not null since every order should have one.
alter table orders
  add column if not exists order_number bigint not null default nextval('orders_order_number_seq');

-- 3. Make sure no two orders ever share a number.
create unique index if not exists orders_order_number_unique on orders(order_number);

-- 4. Re-align the sequence to one past the highest current number
--    (covers re-runs / partial backfills).
select setval(
  'orders_order_number_seq',
  greatest(1000, (select coalesce(max(order_number), 1000) from orders))
);
