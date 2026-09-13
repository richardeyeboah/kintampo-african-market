-- Shipping label metadata (Shippo / USPS / UPS)
alter table public.orders add column if not exists shipping_label_url text;
alter table public.orders add column if not exists shipping_carrier text;
alter table public.orders add column if not exists shipping_service text;
alter table public.orders add column if not exists label_purchased_at timestamptz;

comment on column public.orders.shipping_label_url is 'PDF URL from Shippo after label purchase';
comment on column public.orders.shipping_carrier is 'USPS or UPS';
comment on column public.orders.shipping_service is 'Carrier service name e.g. Priority Mail';
