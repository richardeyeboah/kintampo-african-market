-- Server-side cart + address snapshot for embedded Payment Element (PaymentIntent) checkout.
-- Run in Supabase SQL Editor if this table is missing.

create table if not exists checkout_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  payment_intent_id text,
  created_at timestamptz not null default now()
);

create index if not exists checkout_snapshots_user_id_idx on checkout_snapshots (user_id);
create index if not exists checkout_snapshots_payment_intent_id_idx on checkout_snapshots (payment_intent_id);

comment on table checkout_snapshots is 'Temporary checkout payload keyed by PaymentIntent metadata for webhook fulfillment';
