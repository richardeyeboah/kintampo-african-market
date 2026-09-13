-- ============================================================
-- Shipping + Amazon-style order workflow upgrade
-- Run in Supabase SQL Editor
-- ============================================================

alter table orders
  add column if not exists subtotal_amount numeric(10,2) not null default 0,
  add column if not exists shipping_fee numeric(10,2) not null default 0,
  add column if not exists shipping_method text not null default 'standard',
  add column if not exists shipping_zone text,
  add column if not exists tracking_number text,
  add column if not exists ordered_at timestamptz,
  add column if not exists processing_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists out_for_delivery_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz;

-- Normalize legacy statuses
update orders
set status = 'ordered'
where status is null or status = 'pending';

-- Backfill ordered_at where missing
update orders
set ordered_at = created_at
where ordered_at is null;

comment on column orders.status is
'ordered | processing | shipped | out_for_delivery | delivered | cancelled';

comment on column orders.shipping_method is
'standard | express | pickup';

-- Audit log for every status transition
create table if not exists order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  changed_by text,
  note text
);

create index if not exists idx_order_status_logs_order_id
  on order_status_logs(order_id);

create index if not exists idx_order_status_logs_changed_at
  on order_status_logs(changed_at desc);

-- Seed one initial log for existing orders if none exists yet
insert into order_status_logs (order_id, from_status, to_status, changed_at, changed_by, note)
select
  o.id,
  null,
  o.status,
  coalesce(o.ordered_at, o.created_at),
  'migration',
  'Initial status log backfill'
from orders o
where not exists (
  select 1 from order_status_logs l where l.order_id = o.id
);

-- RLS: audit table is server-only via service role (same pattern as orders)
alter table public.order_status_logs enable row level security;

drop policy if exists "service_role_only_order_status_logs" on public.order_status_logs;

create policy "service_role_only_order_status_logs"
  on public.order_status_logs
  for all
  to anon, authenticated
  using (false)
  with check (false);
