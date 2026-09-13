# Admin Guide — Kintampo African Market

Staff dashboard for order fulfillment, catalog management, and reporting.

**URL:** `/admin/login`  
**Access:** Password set in `ADMIN_PASSWORD` (Vercel env). Session lasts 8 hours.

**Client handoff:** Give staff [CLIENT_OPS_MANUAL.md](CLIENT_OPS_MANUAL.md) (plain language).  
**Verification:** Use [TEST_CHECKLIST.md](TEST_CHECKLIST.md) after deploys or SQL migrations.

---

## Navigation

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Sales KPIs, needs-action, recent orders (unpaid phone orders excluded from gross) |
| **Products** | Add/edit products, stock, categories, images |
| **Orders** | All orders, filters, export, **New order** (phone desk) |
| **Announcements** | Storefront top bar messages |
| **Customers** | Registered shoppers and order history |
| **Shipping** | Shippo/USPS label provider + tracking webhook + ship-from |
| **Reviews** | Approve product reviews |

---

## Order workflow

### 1. New order arrives

- Email alert to merchant inbox
- Optional browser notification if admin is open
- Order status: **Ordered**
- Phone/WhatsApp/in-store orders may be **Unpaid** until you mark paid

### 2. Prepare the order

- Open **Orders → [order]**
- Pick and pack items
- Set status to **Processing** when packing starts
- Check **pickup window**, **substitution preference**, and **tip** if present

### 3. Fulfill — pickup vs local delivery vs ship

**Store pickup**

- When bags are ready: **Ready for pickup** (4-hour hold starts)
- Print bag ticket from print slip
- **Mark as picked up** when collected; resend ready notify / call as needed

**Local delivery**

- Use delivery run panel (en route → handed over / left at door)
- $25 merchandise minimum + optional driver tip at checkout

**Ship to customer**

| Method | Steps |
|--------|--------|
| **Print address slip** | Print → tape on box → USPS counter → paste tracking |
| **Shippo / USPS label** | Weight → rate → print label → tracking saved |

Then set status to **Shipped** (or auto-update when label / webhook applies).

### 4. Partial fulfillment

- Adjust fulfilled quantities on the order
- Stripe: automatic card refund; cash: hand money back; unpaid: collect less

### 5. Tracking

- Enter tracking if not auto-filled
- Customer email on status change (skipped if no real email)
- Customer timeline: `/track-order`

---

## Phone orders

**Orders → New order**

- Product search, fulfillment method, paid/unpaid, note
- Mark paid later from order detail

---

## Refunds

| Type | Where |
|------|--------|
| Stripe | Order → Refund |
| Cash / manual | Order → Manual refund (paid orders only) |

---

## Products

### Add product (grocery / general)

**Products → Add product**

- Name, price, category, description, image URL or upload
- **In stock** toggle controls visibility
- Optional grocery-ops fields via API: brand, stock quantity, unit amount/measure, pack label, variant group (requires `grocery-ops.sql`)

### Add fabric / lace

**Products → Add fabric / lace** (`/admin/products/fabrics/new`)

- Dedicated flow for wax, lace, headtie, kente, brocade, george
- Collects design name, colorway, brand/line, yardage, width, composition, origin, care, piece price, piece stock
- Auto-builds storefront name, pack label (`6 yd · 45″`), description, and `$/yd` unit pricing
- Photos: primary + detail shots
- Cross-link from standard Add product page
- Live on storefront at **`/fashion`** under African Prints, Lace, Headtie, Kente, or Brocade

### Bulk management

- Filter by category or stock status
- Quick stock toggle on list view

---

## Reports & export

**Dashboard**

- Date pills: Today, Yesterday, 7d, 30d, WTD, MTD, custom range
- Gross revenue excludes unpaid phone orders (note on KPI when unpaid exist)

**Export CSV**

- Includes payment status, paid at, order source when columns exist

Timezone: `America/New_York` (Columbus) unless overridden.

---

## Security notes

- Do not share admin password
- Log out on shared devices (**Logout** in admin header)
- Failed login lockouts apply when `ADMIN_ENFORCE_LOGIN_RATE_LIMIT=1`
- Admin is not indexed by search engines (`X-Robots-Tag: noindex`)

---

## Troubleshooting

| Problem | Check |
|---------|--------|
| Can't log in | `ADMIN_PASSWORD` in Vercel; redeploy after env change |
| Order missing after payment | Stripe webhook secret; Stripe Dashboard → Webhooks |
| Label won't print | Shippo/USPS credentials; Shipping page provider status |
| Customer didn't get email | Email transport env; phone orders may use placeholder email |
| New filters / tips missing | Run `supabase/grocery-ops.sql` |
| Tracking never auto-updates | Shipping → Connect tracking updates |

For full technical reference see [PROJECT.md](PROJECT.md).
