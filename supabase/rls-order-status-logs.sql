-- ============================================================
-- Fix: "RLS Disabled in Public" on public.order_status_logs
-- Run once in Supabase SQL Editor (safe to re-run).
--
-- Status logs are only read/written by Next.js API routes using
-- the service role key (bypasses RLS). Browser clients must not
-- query this table directly.
-- ============================================================

alter table public.order_status_logs enable row level security;

drop policy if exists "service_role_only_order_status_logs" on public.order_status_logs;

create policy "service_role_only_order_status_logs"
  on public.order_status_logs
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on policy "service_role_only_order_status_logs" on public.order_status_logs is
  'Direct DB access only via service_role (server). Anon/auth blocked.';
