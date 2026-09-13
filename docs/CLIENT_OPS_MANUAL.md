# Kintampo African Market — Staff Operations Manual

Hand this to store staff. Keep passwords and API keys out of this file.

**Admin login:** `https://kintampoafricanmarket.com/admin/login`  
**Storefront:** `https://kintampoafricanmarket.com`

---

## Daily checklist

1. Open **Dashboard** — check “Needs action” and “Ready for pickup” counts.
2. Open **Orders** — filter today’s orders; unpaid phone orders show an **Unpaid** badge.
3. Stage pickup bags → mark **Ready for pickup** → print bag ticket if needed.
4. For local delivery: set status / use delivery panel when you leave and when you hand over.
5. For ship orders: print label or address slip, then mark shipped / enter tracking.

---

## Orders — three fulfillment types

### A. Store pickup

1. **Orders →** open the order.
2. When packed: set **Ready for pickup** (customer gets email if they have a real email).
3. Print the **pickup / bag ticket** (4×6 label or letter from print slip).
4. Hold window is **4 hours** after ready — overdue shows on the pickup panel.
5. When customer collects: **Mark as picked up** (one-click) or set delivered/picked-up status.
6. Optional: **Resend ready notification**, Call / SMS / WhatsApp links on the phone number.

**Checkout extras customers may choose**

- Pickup window (today ASAP, after 3pm, tomorrow morning/afternoon) — shown on the order.
- Substitution preference (refund / call / substitute) — follow this if an item is short.

### B. Local delivery (you drive)

1. Confirm address is in range and order meets the **$25 minimum** (before delivery fee).
2. Tip (if any) shows on the order — keep for the driver.
3. Use the **delivery run** panel: en route → handed over / left at door.
4. Call the customer from the order page if needed (reachable phone is required).

### C. Ship (USPS / Shippo)

1. Use **Print address slip** or buy a **Shippo/USPS label** from the order.
2. Mark **Shipped**; tracking email goes to the customer when configured.
3. **Admin → Shipping**: confirm Shippo is connected; click **Connect tracking updates** once if delivered status never auto-updates.

---

## Phone / WhatsApp / in-store orders

1. **Orders → New order** (or `/admin/orders/new`).
2. Search products, set qty, choose pickup / local delivery / ship.
3. Enter name + reachable phone (email optional).
4. Mark **Paid** or **Unpaid** (cash / Zelle / card at store).
5. Save → opens the order detail page.
6. When cash is collected later: use **Mark paid** on the order.

Unpaid orders do **not** count in Dashboard gross revenue until marked paid.

---

## Short items / partial fulfillment

1. On the order, open the **items fulfillment** section.
2. Set how many of each item you actually handed over.
3. Confirm the refund amount (Stripe → card; cash → hand back; unpaid → collect less).
4. Customer with a real email gets a shortfall notice.

---

## Products

1. **Products → Add / Edit**
2. Name, price, category, images, **In stock**.
3. Optional (after SQL migration):  
   - **Brand** — shop filter  
   - **Stock quantity** — shows “Only X left” when low  
   - **Unit amount + unit** (e.g. 5 + lb) — shows $/lb  
   - **Variant group** — same slug on related sizes so the size picker appears  

### Fashion / fabric / hair

Storefront department: **`/fashion`** (same cart as groceries).

| Category | What goes here |
|----------|----------------|
| African Prints | Ankara, hollandais, george wrappers sold as fabric |
| Lace | Cord lace, guipure, net lace |
| Headtie | Gele, headtie, headwrap pieces |
| Kente | Kente cloth, Aso Oke / traditional weave |
| Brocade | Brocade, bazin, Swiss voile |
| Ready-to-wear | Clothes, dashiki, garments |
| Hair & Braiding | Wigs, braiding hair, extensions |

**Brand / line** (filter on `/fashion`): Hollandais, Vlisco-type, Supreme-style, Other wax, Unbranded — set when adding fabric.

**Fast path for fabric/lace:** Admin → **Products → Add fabric / lace** (`/admin/products/fabrics/new`).  
Pick fabric type + brand/line, then publish with **In stock** on — it appears on `/fashion`.

Ready-to-wear and Hair & Braiding: use normal **Add product** and pick that category.

---

## Announcements (top bar on the website)

**Admin → Announcements**

- Edit message text and optional link.
- Toggle active / sort order.
- Customers can dismiss the bar on their device.

---

## Kits & recipes (storefront)

- **Kits:** `/bundles` — create rows in Supabase (`product_bundles` + items) linking real product IDs.
- **Recipes:** `/recipes` — seeded recipes exist; link ingredients to products so “Add to cart” works.

Staff usually only need to know the URLs exist for customers; catalog linking is an admin/owner task.

---

## Customer-facing pages (share with shoppers)

| Page | URL |
|------|-----|
| Shop | `/shop` |
| Fashion | `/fashion` |
| Track order | `/track-order` |
| Receipt | from confirmation / track |
| FAQ | `/faq` |
| Shipping | `/shipping` |
| Returns | `/returns` |
| About / visit | `/about` |
| Recipes | `/recipes` |
| Kits | `/bundles` |
| Call / WhatsApp order | Cart, footer, checkout |

---

## Refunds

| Payment | What to do |
|---------|------------|
| Stripe (online card) | Order → **Refund** → amount → confirm |
| Cash / Zelle / phone paid | Order → **Manual refund** after you returned money |
| Unpaid phone order | No refund — just cancel or adjust quantities |

---

## Shipping setup (owner once)

**Admin → Shipping**

1. Provider should show **Shippo** (or USPS).
2. Ship-from address = store address.
3. Click **Connect tracking updates** once so delivered packages auto-update.

You do **not** need to change this page every day.

---

## Security

- Do not share the admin password.
- Log out on shared computers.
- Never paste webhook URLs or API keys into customer chats or social media.

---

## Quick troubleshooting

| Issue | What to try |
|-------|-------------|
| Customer says no email | Phone orders may have no email — call/text instead |
| Pickup ticket prints tiny | Use **4×6 / label** PDF download from print slip |
| Local delivery blocked | Cart under $25 or address outside ~30 min drive |
| Dashboard revenue looks low | Unpaid phone orders are excluded until marked paid |
| Deals / brand filter empty | Brands and stock fields not filled on products yet |

---

## Who to call for technical problems

Store owner / site developer (not listed here — fill in before handing to staff):

- Owner: ________________  
- Tech contact: ________________  
- Support email: ________________  
