# Test checklist — post grocery-ops / Tier 2–4

Run after `supabase/grocery-ops.sql` (and `phone-orders.sql` if not already).  
Mark each ☐ when verified on **production** (or staging).

## A. Database / admin basics

- [ ] Admin login works (`/admin/login`)
- [ ] Dashboard loads KPIs
- [ ] **Announcements** page lists messages; edit one → storefront top bar updates after refresh
- [ ] Orders list opens; unpaid badge appears on unpaid phone orders (if any)

## B. Phone order desk

- [ ] `/admin/orders/new` — search product, add line, create **pickup + unpaid** order
- [ ] Order detail shows Unpaid + source (Phone / WhatsApp / In store)
- [ ] **Mark paid** flips to Paid; Dashboard later includes it in gross
- [ ] Create **local delivery** phone order with address — fee + tax look right

## C. Checkout (storefront)

- [ ] Guest checkout pickup: must pick a **pickup window**
- [ ] Substitution preference saves (visible on admin order)
- [ ] Local delivery: under $25 → blocked with clear message
- [ ] Local delivery: tip presets add to total; Stripe charge matches total
- [ ] Standard ship still works; Apple/Google Pay if enabled

## D. Pickup workstation

- [ ] Ready for pickup → hold timer shows
- [ ] Print bag ticket / 4×6 PDF
- [ ] Mark as picked up one-click
- [ ] Resend ready notify — fails politely if placeholder email only

## E. Partial fulfillment

- [ ] Stripe order: reduce qty → refund amount → Stripe refund succeeds
- [ ] Unpaid phone order: reduce qty → “collect less” (no fake refund)
- [ ] Paid cash order: reduce qty → manual refund wording

## F. Local delivery run

- [ ] Delivery panel: en route / handed over / left at door
- [ ] Tip amount visible on admin order when tip > 0

## G. Catalog / search / home

- [ ] Product with `stock_quantity` 1–5 shows **Only X left**
- [ ] Product with unit_amount + unit_of_measure shows **$/lb** (or unit)
- [ ] Two products same `variant_group` → size chips on PDP
- [ ] Shop brand filter (after brands filled)
- [ ] Shop dietary filter (after tags filled)
- [ ] Search typo (e.g. close misspelling) still finds product (after SQL)
- [ ] Home: bestsellers and/or new arrivals sections appear
- [ ] Home kits row only if bundles exist with products

## H. Content pages

- [ ] `/faq` `/shipping` `/returns` `/about` load; About shows store photo + map
- [ ] `/recipes` lists recipes; detail page loads
- [ ] `/bundles` empty state OK if no kits; detail works when kit exists
- [ ] Footer links to FAQ / Shipping / Returns / About / Recipes / Bundles

## I. Shipping (Shippo) — only if you ship

- [ ] Admin → Shipping shows Provider: Shippo
- [ ] Ship-from address correct
- [ ] **Connect tracking updates** clicked once (or already connected)
- [ ] Test label on a real/test order (optional, costs money in live mode)

## J. Customer receipt / track

- [ ] After paid order: confirmation → Get receipt / track order
- [ ] Track page shows status; download receipt if available

---

### If something fails

1. Confirm SQL migration ran without errors in Supabase.
2. Hard refresh the page (Ctrl+Shift+R).
3. Check Vercel deploy finished for latest `main`.
4. Browser console / Vercel logs for API 4xx/5xx.
