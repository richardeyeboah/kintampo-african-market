-- Idempotent order creation from payment_intent.succeeded (optional if index missing)
create unique index if not exists orders_stripe_payment_intent_id_key
  on orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
