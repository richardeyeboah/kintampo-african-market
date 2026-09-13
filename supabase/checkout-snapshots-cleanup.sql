-- Optional maintenance: remove old checkout_snapshots that never became orders (run manually or schedule).
-- Safe to re-run. Adjust the interval if your webhooks can be very delayed.

delete from checkout_snapshots c
where c.created_at < now() - interval '7 days'
  and (
    c.payment_intent_id is null
    or not exists (
      select 1
      from orders o
      where o.stripe_payment_intent_id = c.payment_intent_id
    )
  );
