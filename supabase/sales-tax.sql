-- Ohio sales tax on taxable categories (see lib/tax/sales-tax.ts)
alter table public.orders
  add column if not exists tax_amount numeric not null default 0;

comment on column public.orders.tax_amount is
  'Ohio sales tax collected at Columbus store rate on taxable line items (non-food categories).';
