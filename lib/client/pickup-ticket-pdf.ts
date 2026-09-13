/**
 * Pickup bag ticket as a true 4x6 PDF (288 x 432pt).
 *
 * Browser printing goes through the print dialog, where "fit to page" silently
 * rescales the sheet and thermal printers end up shrinking a Letter layout onto
 * a label. A PDF whose MediaBox already is the label prints at 100% with the
 * content where we put it, so this is the path staff should use.
 *
 * `buildTextLabelPdfFile` cannot be reused: it writes left-aligned 14pt lines
 * at a fixed offset with no measuring, so nothing can be centred or scaled.
 */

import { asPdfFile } from '@/lib/client/share-label-pdf'

export type PickupTicketPdfItem = {
  name: string
  quantity: number
}

export type PickupTicketPdfData = {
  orderLabel: string
  customerName: string
  phone?: string | null
  placedLabel: string
  holdLabel: string
  holdValue: string
  itemCount: number
  items: PickupTicketPdfItem[]
  /** Compact pickup-counter footer (store name / address / hours / phones). */
  storeName?: string | null
  storeAddress?: string | null
  storeHours?: string | null
  storePhones?: string | null
}

const PAGE_W = 288 // 4in
const PAGE_H = 432 // 6in
const MARGIN = 16
const BODY_W = PAGE_W - MARGIN * 2
const BODY_L = MARGIN
const BODY_R = PAGE_W - MARGIN

/** Adobe base-14 advance widths (1/1000 em) for ASCII 32-126. */
const W_REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
]

const W_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667,
  611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556,
  278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
]

function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00d7/g, 'x')
    .replace(/\u00b7/g, '|')
    .replace(/[\u2022\u2026]/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function textWidth(text: string, size: number, bold: boolean): number {
  const table = bold ? W_BOLD : W_REGULAR
  let units = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32
    units += table[code] ?? 500
  }
  return (units / 1000) * size
}

/** Largest size at or below `max` that keeps `text` inside `maxWidth`. */
function fitSize(text: string, maxWidth: number, bold: boolean, max: number, min: number): number {
  let size = max
  while (size > min && textWidth(text, size, bold) > maxWidth) size -= 0.5
  return size
}

function wrapToWidth(text: string, size: number, bold: boolean, maxWidth: number): string[] {
  if (textWidth(text, size, bold) <= maxWidth) return [text]
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (textWidth(candidate, size, bold) <= maxWidth) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    current = word
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}

function truncateToWidth(text: string, size: number, bold: boolean, maxWidth: number): string {
  if (textWidth(text, size, bold) <= maxWidth) return text
  let out = text
  while (out.length > 1 && textWidth(`${out}..`, size, bold) > maxWidth) {
    out = out.slice(0, -1)
  }
  return `${out}..`
}

class TicketCanvas {
  private ops: string[] = []

  text(raw: string, x: number, y: number, size: number, bold: boolean) {
    const text = escapePdfText(raw)
    this.ops.push(
      `BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${text}) Tj ET`
    )
  }

  /** Never lets text leave the label, even if it could not be scaled down enough. */
  centered(raw: string, y: number, size: number, bold: boolean) {
    const text = truncateToWidth(raw, size, bold, BODY_W)
    const x = MARGIN + (BODY_W - textWidth(text, size, bold)) / 2
    this.text(text, Math.max(MARGIN, x), y, size, bold)
  }

  right(raw: string, y: number, size: number, bold: boolean) {
    this.text(raw, BODY_R - textWidth(raw, size, bold), y, size, bold)
  }

  rect(x: number, y: number, w: number, h: number, lineWidth: number) {
    this.ops.push(
      `${lineWidth} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`
    )
  }

  rule(y: number, lineWidth = 0.7) {
    this.ops.push(
      `${lineWidth} w ${BODY_L} ${y.toFixed(2)} m ${BODY_R} ${y.toFixed(2)} l S`
    )
  }

  toStream(): string {
    return this.ops.join('\n')
  }
}

const EYEBROW_SIZE = 8.5
const PHONE_SIZE = 14
const META_LABEL_SIZE = 9.5
const META_VALUE_SIZE = 11
const HEADING_SIZE = 9
const ITEM_SIZE = 13
const FOOTER_TITLE_SIZE = 7.5
const FOOTER_LINE_SIZE = 8

/**
 * Base gaps between sections. Leftover label height is shared out between the
 * three flexible gaps and the item rows; `afterHeading` stays fixed so the
 * heading always hugs its list.
 */
const BASE_GAPS = { afterEyebrow: 10, afterHero: 14, beforeRule: 8, afterHeading: 6 }
const FLEX_GAPS = 3
const GAP_BONUS_CAP = 14
const ROW_BONUS_CAP = 8
/** Thermal printers clip near the edge, so never run the last row to the margin. */
const BOTTOM_CLEARANCE = 8
/** Reserved height for the pickup-counter footer (title + up to 4 lines + rule). */
const FOOTER_HEIGHT = 60

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function buildPickupTicketPdfBlob(data: PickupTicketPdfData): Blob {
  const canvas = new TicketCanvas()

  const orderLabel = sanitize(data.orderLabel) || 'ORDER'
  const customerName = sanitize(data.customerName)
  const phone = sanitize(data.phone ?? '')

  const numberSize = fitSize(orderLabel, BODY_W - 24, true, 58, 16)
  const nameSize = fitSize(customerName, BODY_W - 24, true, 20, 11)
  const nameLines = wrapToWidth(customerName, nameSize, true, BODY_W - 24).slice(0, 2)

  const metaRows: [string, string][] = [
    ['ITEMS', `${data.itemCount} item${data.itemCount === 1 ? '' : 's'}`],
    ['PLACED', sanitize(data.placedLabel)],
    [sanitize(data.holdLabel).toUpperCase(), sanitize(data.holdValue)],
  ]

  const heroHeight =
    16 + numberSize + 16 + nameLines.length * (nameSize + 4) + (phone ? PHONE_SIZE + 4 : 0) + 12
  const metaStep = META_VALUE_SIZE + 7
  const headingHeight = HEADING_SIZE + 12
  const baseItemStep = ITEM_SIZE + 6

  const storeName = sanitize(data.storeName ?? '')
  const storeAddress = sanitize(data.storeAddress ?? '')
  const storeHours = sanitize(data.storeHours ?? '')
  const storePhones = sanitize(data.storePhones ?? '')
  const hasFooter = Boolean(storeName || storeAddress || storeHours || storePhones)
  const footerReserve = hasFooter ? FOOTER_HEIGHT : BOTTOM_CLEARANCE

  const fixedHeight =
    EYEBROW_SIZE +
    BASE_GAPS.afterEyebrow +
    heroHeight +
    BASE_GAPS.afterHero +
    metaStep * metaRows.length +
    BASE_GAPS.beforeRule +
    headingHeight +
    BASE_GAPS.afterHeading +
    footerReserve

  // Decide how many item rows fit, then hand the unused height back to the
  // layout so a short order still reaches the bottom of the label instead of
  // floating in the top third.
  const itemSpace = PAGE_H - MARGIN * 2 - fixedHeight
  const maxRows = Math.max(1, Math.floor(itemSpace / baseItemStep))
  const overflows = data.items.length > maxRows
  const visible = overflows ? data.items.slice(0, Math.max(0, maxRows - 1)) : data.items
  const rowCount = visible.length + (overflows ? 1 : 0)

  const slack = Math.max(0, itemSpace - rowCount * baseItemStep)
  const rowBonus = rowCount ? clamp((slack * 0.6) / rowCount, 0, ROW_BONUS_CAP) : 0
  const gapBonus = clamp((slack - rowBonus * rowCount) / FLEX_GAPS, 0, GAP_BONUS_CAP)
  const itemStep = baseItemStep + rowBonus

  // --- Order number and who it belongs to, as large as the label allows.
  let y = PAGE_H - MARGIN - EYEBROW_SIZE
  canvas.centered('STORE PICKUP TICKET', y, EYEBROW_SIZE, true)

  const heroTop = y - BASE_GAPS.afterEyebrow - gapBonus
  const heroBottom = heroTop - heroHeight
  canvas.rect(BODY_L, heroBottom, BODY_W, heroHeight, 2)

  y = heroTop - 16
  canvas.centered('ORDER', y, EYEBROW_SIZE, true)
  y -= numberSize
  canvas.centered(orderLabel, y, numberSize, true)
  y -= 16
  for (const line of nameLines) {
    y -= nameSize
    canvas.centered(line, y, nameSize, true)
    y -= 4
  }
  if (phone) {
    y -= PHONE_SIZE
    canvas.centered(phone, y, PHONE_SIZE, false)
  }

  // --- Order facts. `y` tracks the current baseline from here down.
  y = heroBottom - BASE_GAPS.afterHero - gapBonus - META_VALUE_SIZE
  const valueWidth = BODY_W - 84
  metaRows.forEach(([label, value], index) => {
    if (index > 0) y -= metaStep
    canvas.text(label, BODY_L, y, META_LABEL_SIZE, true)
    canvas.right(
      truncateToWidth(value, META_VALUE_SIZE, false, valueWidth),
      y,
      META_VALUE_SIZE,
      false
    )
  })

  // --- Bag contents.
  y -= BASE_GAPS.beforeRule + gapBonus
  canvas.rule(y)
  y -= headingHeight
  canvas.text('BAG CONTENTS', BODY_L, y, HEADING_SIZE, true)
  y -= BASE_GAPS.afterHeading

  for (const item of visible) {
    y -= itemStep
    const qty = `x${item.quantity}`
    const qtyW = textWidth(qty, ITEM_SIZE, true)
    const name = truncateToWidth(sanitize(item.name), ITEM_SIZE, false, BODY_W - qtyW - 12)
    canvas.text(name, BODY_L, y, ITEM_SIZE, false)
    canvas.right(qty, y, ITEM_SIZE, true)
  }

  const remaining = data.items.length - visible.length
  if (remaining > 0) {
    y -= itemStep
    canvas.text(`+ ${remaining} more item${remaining === 1 ? '' : 's'}`, BODY_L, y, ITEM_SIZE, true)
  }

  // --- Pickup counter footer, pinned to the bottom of the label.
  if (hasFooter) {
    const footerTop = MARGIN + FOOTER_HEIGHT
    canvas.rule(footerTop, 0.6)
    let footY = footerTop - 10
    canvas.text('PICKUP COUNTER', BODY_L, footY, FOOTER_TITLE_SIZE, true)
    const footerLines: { text: string; bold: boolean }[] = []
    if (storeName) footerLines.push({ text: storeName, bold: true })
    if (storeAddress) footerLines.push({ text: storeAddress, bold: false })
    if (storeHours) footerLines.push({ text: storeHours, bold: false })
    if (storePhones) footerLines.push({ text: storePhones, bold: false })
    for (const line of footerLines) {
      footY -= FOOTER_LINE_SIZE + 2
      canvas.text(
        truncateToWidth(line.text, FOOTER_LINE_SIZE, line.bold, BODY_W),
        BODY_L,
        footY,
        FOOTER_LINE_SIZE,
        line.bold
      )
    }
  }

  return toPdfBlob(canvas.toStream())
}

function toPdfBlob(content: string): Blob {
  const enc = (s: string) => new TextEncoder().encode(s)

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      '/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `6 0 obj\n<< /Length ${enc(content).length} >>\nstream\n${content}\nendstream\nendobj\n`,
  ]

  const header = '%PDF-1.4\n'
  const parts: Uint8Array[] = [enc(header)]
  const offsets: number[] = [0]
  let offset = enc(header).length
  for (const obj of objects) {
    offsets.push(offset)
    const bytes = enc(obj)
    parts.push(bytes)
    offset += bytes.length
  }

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`
  parts.push(enc(xref))

  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let cursor = 0
  for (const part of parts) {
    out.set(part, cursor)
    cursor += part.length
  }
  return new Blob([out.slice()], { type: 'application/pdf' })
}

export function buildPickupTicketPdfFile(data: PickupTicketPdfData): File {
  const slug = data.orderLabel.replace(/[^a-zA-Z0-9_-]/g, '') || 'order'
  return asPdfFile(buildPickupTicketPdfBlob(data), `pickup-ticket-${slug}.pdf`)
}
