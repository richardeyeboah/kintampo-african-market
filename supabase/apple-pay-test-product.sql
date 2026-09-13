-- $0.60 Snack test item for live checkout (no Ohio sales tax on Snack).
-- Run in Supabase → SQL Editor → Run once.

insert into public.products (name, description, price, category, image_url, in_stock)
values (
  'Payment test item ($0.60)',
  'Live checkout test — Snack category, no sales tax. Safe for payment verification.',
  0.6,
  'Snack',
  'https://images.unsplash.com/photo-1604719312497-c6fc196f51ec?auto=format&fit=crop&w=800&q=80',
  true
);

select id, name, price, category, in_stock, created_at
from public.products
where name = 'Payment test item ($0.60)'
order by created_at desc
limit 1;
