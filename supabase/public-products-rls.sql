-- Run in Supabase SQL Editor if /shop returns empty or permission errors for anonymous visitors.
-- Safe to run multiple times.

alter table public.products enable row level security;

drop policy if exists "Public can view products" on public.products;
create policy "Public can view products"
  on public.products
  for select
  to anon, authenticated
  using (true);
