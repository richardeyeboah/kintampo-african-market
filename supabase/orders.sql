-- ============================================================
-- Kintampo African Market – Orders Tables
-- Run this in Supabase: SQL Editor → New Query
-- ============================================================

create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  address_line   text not null,
  city           text not null,
  state          text,
  country        text not null default 'Nigeria',
  postal_code    text,
  total_amount   numeric(10,2) not null,
  status         text not null default 'pending',
  payment_method text not null default 'cod',
  created_at     timestamptz not null default now()
);

create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references orders(id) on delete cascade,
  product_id    uuid references products(id),
  product_name  text not null,
  product_price numeric(10,2) not null,
  quantity      int not null,
  subtotal      numeric(10,2) not null
);

-- Enable Row Level Security
alter table orders enable row level security;
alter table order_items enable row level security;

-- Allow anyone (anon) to place a new order
create policy "Anyone can place orders"
  on orders for insert
  with check (true);

-- Allow anyone to insert order items
create policy "Anyone can insert order items"
  on order_items for insert
  with check (true);
