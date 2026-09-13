-- Hardens the checkout_snapshots table so only the server (service_role) can
-- ever read/write it. The original `checkout-snapshots.sql` and
-- `lockdown-checkout-snapshots-and-handle-new-user.sql` did the REVOKE + policy
-- but never explicitly ran `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Without
-- RLS on, the policies are inert. This file is idempotent — safe to run anytime.

begin;

-- 1) Make sure RLS is actually enabled on the table.
alter table public.checkout_snapshots enable row level security;

-- 2) Revoke any direct grants to anon / authenticated. Service role bypasses RLS.
revoke all on table public.checkout_snapshots from anon, authenticated;

-- 3) Replace any prior deny-all policy so we end up with exactly one.
drop policy if exists "deny all non-service-role access to checkout_snapshots"
  on public.checkout_snapshots;

create policy "deny all non-service-role access to checkout_snapshots"
  on public.checkout_snapshots
  for all
  to public
  using (false)
  with check (false);

commit;

-- Verify (run separately if you want):
--   select tablename, rowsecurity from pg_tables where tablename = 'checkout_snapshots';
--   -- rowsecurity should be `true`
--   select policyname, qual from pg_policies where tablename = 'checkout_snapshots';
