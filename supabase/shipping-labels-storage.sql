-- Public bucket for USPS label PDFs (admin-only upload via service role).
insert into storage.buckets (id, name, public)
values ('shipping-labels', 'shipping-labels', true)
on conflict (id) do nothing;

-- Service role uploads; public read for admin download links.
create policy "Public read shipping labels"
on storage.objects for select
using (bucket_id = 'shipping-labels');

create policy "Service role upload shipping labels"
on storage.objects for insert
with check (bucket_id = 'shipping-labels');

create policy "Service role update shipping labels"
on storage.objects for update
using (bucket_id = 'shipping-labels');
