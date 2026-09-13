-- checkout_snapshots: required for Stripe Payment Element checkout.
-- Safe to re-run. Run in Supabase → SQL Editor if checkout fails with "Could not prepare checkout."

begin;

create table if not exists public.checkout_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  payment_intent_id text,
  created_at timestamptz not null default now()
);

create index if not exists checkout_snapshots_user_id_idx
  on public.checkout_snapshots (user_id);

create index if not exists checkout_snapshots_payment_intent_id_idx
  on public.checkout_snapshots (payment_intent_id);

comment on table public.checkout_snapshots is
  'Temporary checkout payload keyed by PaymentIntent metadata for webhook fulfillment';

alter table public.checkout_snapshots enable row level security;

revoke all on table public.checkout_snapshots from anon, authenticated;

drop policy if exists "deny all non-service-role access to checkout_snapshots"
  on public.checkout_snapshots;

create policy "deny all non-service-role access to checkout_snapshots"
  on public.checkout_snapshots
  for all
  to public
  using (false)
  with check (false);

commit;

select 'checkout_snapshots ok' as status,
  count(*) as row_count
from public.checkout_snapshots;
