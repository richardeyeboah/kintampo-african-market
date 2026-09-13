-- ============================================================
-- Partial fulfillment + delivery proof
--
-- Lets staff hand over only the items actually on the shelf, refund the
-- shortfall, and record how a delivery ended (handed over vs left at door).
-- Run in Supabase SQL Editor.
-- ============================================================

alter table order_items
  -- How many of `quantity` were actually given to the customer.
  -- NULL means "not adjusted" and is treated as the full ordered quantity,
  -- so existing rows keep their current meaning.
  add column if not exists fulfilled_quantity int;

comment on column order_items.fulfilled_quantity is
'Units actually handed over. NULL = full quantity fulfilled (no shortage recorded).';

alter table orders
  -- 'handed' | 'left_at_door' — how the courier closed out the delivery.
  add column if not exists delivery_proof text,
  add column if not exists delivery_proof_note text,
  add column if not exists delivery_proof_at timestamptz,
  -- Running total refunded specifically for out-of-stock lines, so the
  -- shortfall refund never double-counts a goodwill refund issued by hand.
  add column if not exists shortfall_refund_amount numeric(10,2) not null default 0;

comment on column orders.delivery_proof is
'How the delivery ended: handed | left_at_door.';

comment on column orders.shortfall_refund_amount is
'Portion of refund_amount that was issued for unavailable items.';
