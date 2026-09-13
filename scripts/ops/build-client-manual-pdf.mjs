/**
 * Builds docs/Kintampo-Staff-Ops-Manual.pdf from the staff manual HTML.
 * Usage: node scripts/ops/build-client-manual-pdf.mjs
 */
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = path.join(root, 'docs')
const pdfPath = path.join(outDir, 'Kintampo-Staff-Ops-Manual.pdf')
const htmlPath = path.join(outDir, 'Kintampo-Staff-Ops-Manual.html')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Kintampo African Market — Staff Operations Manual</title>
<style>
  @page { size: letter; margin: 0.7in; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #1c1917;
    max-width: 7.5in;
    margin: 0 auto;
  }
  h1 {
    font-size: 20pt;
    font-weight: 700;
    margin: 0 0 6px;
    color: #0c0a09;
  }
  .sub {
    font-size: 10pt;
    color: #57534e;
    margin-bottom: 18px;
  }
  h2 {
    font-size: 13pt;
    font-weight: 700;
    margin: 22px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1.5px solid #e7e5e4;
    color: #0c0a09;
    page-break-after: avoid;
  }
  h3 {
    font-size: 11pt;
    font-weight: 700;
    margin: 14px 0 6px;
    color: #292524;
    page-break-after: avoid;
  }
  p, li { margin: 0 0 6px; }
  ul, ol { margin: 0 0 10px; padding-left: 1.25em; }
  a { color: #b91c1c; text-decoration: none; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 14px;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid #d6d3d1;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #f5f5f4; font-weight: 600; }
  .box {
    border: 1px solid #d6d3d1;
    background: #fafaf9;
    border-radius: 8px;
    padding: 10px 12px;
    margin: 10px 0 14px;
  }
  .warn {
    border-color: #fcd34d;
    background: #fffbeb;
  }
  .footer {
    margin-top: 28px;
    padding-top: 10px;
    border-top: 1px solid #e7e5e4;
    font-size: 9pt;
    color: #78716c;
  }
  .fill { letter-spacing: 0.05em; }
</style>
</head>
<body>
  <h1>Kintampo African Market</h1>
  <p class="sub"><strong>Staff Operations Manual</strong> · Keep passwords and API keys out of this document.</p>

  <div class="box">
    <p><strong>Admin login:</strong> <a href="https://kintampoafricanmarket.com/admin/login">kintampoafricanmarket.com/admin/login</a></p>
    <p style="margin:0"><strong>Storefront:</strong> <a href="https://kintampoafricanmarket.com">kintampoafricanmarket.com</a></p>
  </div>

  <h2>1. Daily checklist</h2>
  <ol>
    <li>Open <strong>Dashboard</strong> — check “Needs action” and “Ready for pickup” counts.</li>
    <li>Open <strong>Orders</strong> — today’s orders; unpaid phone orders show an <strong>Unpaid</strong> badge.</li>
    <li>Stage pickup bags → mark <strong>Ready for pickup</strong> → print bag ticket if needed.</li>
    <li>Local delivery: update status when you leave and when you hand over.</li>
    <li>Ship orders: print label or address slip, then mark shipped / enter tracking.</li>
  </ol>

  <h2>2. Orders — three fulfillment types</h2>

  <h3>A. Store pickup</h3>
  <ol>
    <li><strong>Orders →</strong> open the order.</li>
    <li>When packed: set <strong>Ready for pickup</strong> (email only if customer has a real email).</li>
    <li>Print the <strong>pickup / bag ticket</strong> (4×6 label or letter).</li>
    <li>Hold window is <strong>4 hours</strong> after ready — overdue shows on the pickup panel.</li>
    <li>When collected: <strong>Mark as picked up</strong>.</li>
    <li>Optional: resend ready notice, Call / SMS / WhatsApp from the phone number.</li>
  </ol>
  <p><strong>Customer may have chosen:</strong> pickup window (today ASAP, after 3pm, tomorrow) and substitution preference (refund / call / substitute). Follow those on the order.</p>

  <h3>B. Local delivery (you drive)</h3>
  <ol>
    <li>Confirm address is in range and order meets the <strong>$25 minimum</strong> (before delivery fee).</li>
    <li>Tip (if any) shows on the order — keep for the driver.</li>
    <li>Use the <strong>delivery run</strong> panel: en route → handed over / left at door.</li>
    <li>Call the customer from the order page if needed.</li>
  </ol>

  <h3>C. Ship (USPS / Shippo)</h3>
  <ol>
    <li>Print address slip or buy a Shippo/USPS label from the order.</li>
    <li>Mark <strong>Shipped</strong>; tracking email goes out when configured.</li>
    <li><strong>Admin → Shipping</strong>: confirm Shippo is connected. Click <strong>Connect tracking updates</strong> once if delivered never auto-updates.</li>
  </ol>

  <h2>3. Phone / WhatsApp / in-store orders</h2>
  <ol>
    <li><strong>Orders → New order</strong></li>
    <li>Search products, set qty, choose pickup / local delivery / ship.</li>
    <li>Name + reachable phone (email optional).</li>
    <li>Mark <strong>Paid</strong> or <strong>Unpaid</strong> (cash / Zelle / card at store).</li>
    <li>Save → opens the order. Collect later with <strong>Mark paid</strong>.</li>
  </ol>
  <p class="box warn">Unpaid orders do <strong>not</strong> count in Dashboard gross revenue until marked paid.</p>

  <h2>4. Short items / partial fulfillment</h2>
  <ol>
    <li>On the order, open items fulfillment.</li>
    <li>Set how many of each item you actually handed over.</li>
    <li>Confirm: Stripe → card refund; cash → hand back; unpaid → collect less.</li>
  </ol>

  <h2>5. Products</h2>
  <ol>
    <li><strong>Products → Add / Edit</strong></li>
    <li>Name, price, category, images, <strong>In stock</strong>.</li>
    <li>Optional: brand, stock quantity (“Only X left”), unit size for $/lb, variant group for size picker.</li>
  </ol>

  <h2>6. Announcements</h2>
  <p><strong>Admin → Announcements</strong> — edit top-bar messages, links, active/sort. Customers can dismiss the bar on their device.</p>

  <h2>7. Customer pages (share with shoppers)</h2>
  <table>
    <thead><tr><th>Page</th><th>Path</th></tr></thead>
    <tbody>
      <tr><td>Shop</td><td>/shop</td></tr>
      <tr><td>Track order</td><td>/track-order</td></tr>
      <tr><td>FAQ</td><td>/faq</td></tr>
      <tr><td>Shipping</td><td>/shipping</td></tr>
      <tr><td>Returns</td><td>/returns</td></tr>
      <tr><td>About / visit</td><td>/about</td></tr>
      <tr><td>Recipes</td><td>/recipes</td></tr>
      <tr><td>Kits</td><td>/bundles</td></tr>
    </tbody>
  </table>

  <h2>8. Refunds</h2>
  <table>
    <thead><tr><th>Payment</th><th>What to do</th></tr></thead>
    <tbody>
      <tr><td>Stripe (online card)</td><td>Order → Refund → amount → confirm</td></tr>
      <tr><td>Cash / Zelle / phone paid</td><td>Order → Manual refund after you returned money</td></tr>
      <tr><td>Unpaid phone order</td><td>No refund — cancel or adjust quantities</td></tr>
    </tbody>
  </table>

  <h2>9. Shipping setup (owner — once)</h2>
  <ol>
    <li><strong>Admin → Shipping</strong> — provider should show Shippo (or USPS).</li>
    <li>Ship-from address = store address.</li>
    <li>Click <strong>Connect tracking updates</strong> once so delivered packages auto-update.</li>
  </ol>
  <p>You do <strong>not</strong> need to change this page every day.</p>

  <h2>10. Security</h2>
  <ul>
    <li>Do not share the admin password.</li>
    <li>Log out on shared computers.</li>
    <li>Never paste webhook URLs or API keys into chats or social media.</li>
  </ul>

  <h2>11. Quick troubleshooting</h2>
  <table>
    <thead><tr><th>Issue</th><th>What to try</th></tr></thead>
    <tbody>
      <tr><td>Customer says no email</td><td>Phone orders may have no email — call/text instead</td></tr>
      <tr><td>Pickup ticket prints tiny</td><td>Use 4×6 / label PDF from print slip</td></tr>
      <tr><td>Local delivery blocked</td><td>Cart under $25 or address outside ~30 min drive</td></tr>
      <tr><td>Dashboard revenue looks low</td><td>Unpaid phone orders excluded until marked paid</td></tr>
      <tr><td>Brand filter empty</td><td>Fill brand on products in admin</td></tr>
    </tbody>
  </table>

  <h2>12. Who to call</h2>
  <div class="box">
    <p>Owner: <span class="fill">______________________________</span></p>
    <p>Tech contact: <span class="fill">______________________________</span></p>
    <p style="margin:0">Support email: <span class="fill">______________________________</span></p>
  </div>

  <p class="footer">Kintampo African Market · Staff Operations Manual · Generated for client handoff</p>
</body>
</html>`

await mkdir(outDir, { recursive: true })
await writeFile(htmlPath, html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'load' })
await page.pdf({
  path: pdfPath,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.65in', right: '0.65in', bottom: '0.65in', left: '0.65in' },
})
await browser.close()

console.log('Wrote', pdfPath)
console.log('Also wrote', htmlPath)
