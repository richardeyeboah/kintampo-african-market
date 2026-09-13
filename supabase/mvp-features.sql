-- ============================================================================
-- MVP feature schema: addresses, tracking number, status notes, audit log.
-- Safe to re-run.
-- ============================================================================

-- 1) Customer addresses ------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  country text not null default 'United States',
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses(user_id);
create unique index if not exists addresses_user_default_unique
  on public.addresses(user_id) where is_default = true;

alter table public.addresses enable row level security;
drop policy if exists "addresses_owner_select" on public.addresses;
create policy "addresses_owner_select" on public.addresses
  for select using (auth.uid() = user_id);
drop policy if exists "addresses_owner_insert" on public.addresses;
create policy "addresses_owner_insert" on public.addresses
  for insert with check (auth.uid() = user_id);
drop policy if exists "addresses_owner_update" on public.addresses;
create policy "addresses_owner_update" on public.addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "addresses_owner_delete" on public.addresses;
create policy "addresses_owner_delete" on public.addresses
  for delete using (auth.uid() = user_id);

-- 2) Profile extra fields (idempotent) ---------------------------------------
alter table public.profiles add column if not exists marketing_opt_in boolean default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- 3) Order tracking number + admin notes -------------------------------------
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists admin_note text;
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists refund_amount numeric;
alter table public.orders add column if not exists refund_stripe_id text;

-- 4) Order status log audit table --------------------------------------------
create table if not exists public.order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  changed_by text,
  note text
);
create index if not exists order_status_logs_order_idx
  on public.order_status_logs(order_id, changed_at desc);

alter table public.order_status_logs enable row level security;
drop policy if exists "logs_owner_select" on public.order_status_logs;
create policy "logs_owner_select" on public.order_status_logs
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_logs.order_id and o.user_id = auth.uid()
    )
  );

-- 5) Customer-side change-password helper ------------------------------------
-- (Handled fully in client: supabase.auth.updateUser({ password }))

-- 6) Verify ------------------------------------------------------------------
select 'addresses' as object, count(*) from public.addresses
union all
select 'profiles' as object, count(*) from public.profiles
union all
select 'orders' as object, count(*) from public.orders
union all
select 'order_status_logs' as object, count(*) from public.order_status_logs;
