-- Stripe Checkout: run in Supabase SQL Editor if these columns are missing.
-- Required for webhook fulfillment and checkout status polling.

alter table orders add column if not exists stripe_checkout_session_id text;
alter table orders add column if not exists stripe_payment_intent_id text;

create unique index if not exists orders_stripe_checkout_session_id_key
  on orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

comment on column orders.stripe_checkout_session_id is 'Stripe Checkout Session id (cs_...) — unique per paid order';
comment on column orders.stripe_payment_intent_id is 'Stripe PaymentIntent id (pi_...) after successful card payment';
