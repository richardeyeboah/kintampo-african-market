-- Applied via Supabase MCP on 2026-04-28.
-- Closes two findings from the Supabase security advisor.

-- 1. Lock down checkout_snapshots so PostgREST cannot expose it via the REST API.
-- The route handlers always use the service-role client (which bypasses RLS), so end users
-- have no need to query this table directly. Add an explicit deny-all policy + revoke all
-- direct grants so anon/authenticated cannot read/write via /rest/v1/checkout_snapshots.
revoke all on table public.checkout_snapshots from anon, authenticated;

create policy "deny all non-service-role access to checkout_snapshots"
  on public.checkout_snapshots
  for all
  to public
  using (false)
  with check (false);

-- 2. handle_new_user() is meant to run as the on_auth_user_created trigger only.
-- Revoke EXECUTE so it can no longer be invoked via /rest/v1/rpc/handle_new_user.
-- Triggers run as the function owner regardless of EXECUTE grants, so the trigger
-- on auth.users keeps working untouched.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
