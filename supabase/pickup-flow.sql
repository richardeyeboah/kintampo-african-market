-- ============================================================
-- Store pickup upgrade
-- Adds a "who's collecting" contact and a ready-for-pickup step
-- so customers can send an Uber/DoorDash driver or a friend.
-- Run in Supabase SQL Editor.
-- ============================================================

alter table orders
  -- Optional: name of the person collecting (customer, a friend, or
  -- "Uber driver"). Helps staff hand the bag to the right person.
  add column if not exists pickup_contact_name text,
  -- Timestamp set when a pickup order is staged at the counter.
  add column if not exists ready_for_pickup_at timestamptz;

comment on column orders.status is
'ordered | processing | ready_for_pickup | shipped | out_for_delivery | delivered | cancelled';

comment on column orders.pickup_contact_name is
'Who is collecting a pickup order (customer, friend, or courier the customer sends).';
