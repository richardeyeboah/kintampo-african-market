-- ============================================================================
-- MVP RESET: hard-delete all products, insert 1 sample product.
-- Run in Supabase Studio → SQL editor.
-- ============================================================================

begin;

delete from public.products;

insert into public.products (id, name, description, price, category, in_stock, image_url, country)
values (
  gen_random_uuid(),
  'Sample Product',
  'This is a sample product used while features are being built. Replace later via /admin/products.',
  9.99,
  'Sample',
  true,
  null,
  'Ghana'
);

commit;

select id, name, price, in_stock from public.products;
