-- Run in Supabase SQL Editor if `orders` already exists without `payment_method`.
alter table orders add column if not exists payment_method text not null default 'cod';

comment on column orders.payment_method is 'cod = cash on delivery; zelle; manual; stripe (future)';
