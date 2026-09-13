import { test, expect } from '@playwright/test'
import { buildPickupTicketPdfBlob, type PickupTicketPdfData } from '../lib/client/pickup-ticket-pdf'

const TICKET: PickupTicketPdfData = {
  orderLabel: 'LQ-1007',
  customerName: 'Wilberforce Amaning',
  phone: '(614) 325-7385',
  placedLabel: '7/27/2026, 12:57:09 PM',
  holdLabel: 'Hold (4h)',
  holdValue: 'until 7/27/2026, 4:57:09 PM',
  itemCount: 4,
  items: [{ name: 'Titus Sardine', quantity: 4 }],
  storeName: 'Kintampo African Market',
  storeAddress: '1668 E Dublin Granville Rd, Columbus, OH 43229',
  storeHours: 'Mon-Sat 9am-8pm | Sun 10am-6pm',
  storePhones: '(614) 377-8297 | (614) 325-7385',
}

async function render(data: PickupTicketPdfData) {
  const blob = buildPickupTicketPdfBlob(data)
  return {
    blob,
    pdf: Buffer.from(await blob.arrayBuffer()).toString('latin1'),
  }
}

/** Text placement operators, in the order they were written. */
function placements(pdf: string) {
  return [...pdf.matchAll(/\/(F1|F2) ([\d.]+) Tf 1 0 0 1 ([\d.]+) ([\d.]+) Tm \((.*?)\) Tj/g)].map(
    (m) => ({ font: m[1], size: Number(m[2]), x: Number(m[3]), y: Number(m[4]), text: m[5] })
  )
}

test.describe('pickup ticket pdf', () => {
  test('uses a true 4x6 media box so no dialog scaling is needed', async () => {
    const { blob, pdf } = await render(TICKET)

    expect(blob.type).toBe('application/pdf')
    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
    // 288 x 432pt == 4in x 6in == 100mm x 150mm label stock.
    expect(pdf).toContain('/MediaBox [0 0 288 432]')
    expect(pdf).toContain('/Count 1')
  })

  test('keeps the xref offsets pointing at their objects', async () => {
    const { pdf } = await render(TICKET)

    const objectCount = Number(/trailer\n<< \/Size (\d+)/.exec(pdf)?.[1]) - 1
    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]))
    expect(offsets).toHaveLength(objectCount)
    offsets.forEach((offset, index) => {
      expect(pdf.slice(offset, offset + 24)).toContain(`${index + 1} 0 obj`)
    })
  })

  test('centres the order number on the label', async () => {
    const { pdf } = await render(TICKET)
    const number = placements(pdf).find((p) => p.text === 'LQ-1007')

    expect(number).toBeTruthy()
    // Left inset and right inset must match within a rounding point.
    const width = 288 - number!.x * 2
    expect(Math.abs(288 - (number!.x + width + number!.x))).toBeLessThan(1)
    expect(number!.size).toBeGreaterThan(24)
  })

  test('shrinks a long order number instead of overflowing the label', async () => {
    const short = placements((await render(TICKET)).pdf).find((p) => p.text === 'LQ-1007')!
    const longLabel = 'LQ-1007-EXTRA-LONG-REFERENCE'
    const long = placements((await render({ ...TICKET, orderLabel: longLabel })).pdf).find((p) =>
      p.text.startsWith('LQ-1007-EXTRA')
    )!

    expect(long.size).toBeLessThan(short.size)
    // Must stay within the printable body no matter how long the reference is.
    expect(long.x).toBeGreaterThanOrEqual(16)
    expect(long.x).toBeLessThan(288 - 16)
  })

  test('lists every item when they fit and stays inside the label', async () => {
    const items = Array.from({ length: 3 }, (_, i) => ({ name: `Item ${i + 1}`, quantity: 1 }))
    const { pdf } = await render({ ...TICKET, items, itemCount: 3 })
    const placed = placements(pdf)

    items.forEach((item) => {
      expect(placed.some((p) => p.text === item.name)).toBe(true)
    })
    placed.forEach((p) => expect(p.y).toBeGreaterThan(0))
    expect(pdf).not.toContain('more item')
  })

  test('summarises the overflow rather than running off a long order', async () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ name: `Item ${i + 1}`, quantity: 2 }))
    const { pdf } = await render({ ...TICKET, items, itemCount: 80 })

    expect(pdf).toMatch(/\+ \d+ more items/)
    placements(pdf).forEach((p) => expect(p.y).toBeGreaterThan(0))
  })

  test('prints the pickup counter footer at the bottom of the label', async () => {
    const { pdf } = await render(TICKET)
    const placed = placements(pdf)

    expect(placed.some((p) => p.text === 'PICKUP COUNTER')).toBe(true)
    expect(placed.some((p) => p.text === 'Kintampo African Market')).toBe(true)
    expect(placed.some((p) => p.text.includes('Dublin Granville'))).toBe(true)

    const footer = placed.find((p) => p.text === 'PICKUP COUNTER')!
    const orderNumber = placed.find((p) => p.text === 'LQ-1007')!
    expect(footer.y).toBeLessThan(orderNumber.y)
    expect(footer.y).toBeGreaterThan(16)
  })

  test('escapes parentheses and drops glyphs the base font cannot draw', async () => {
    const { pdf } = await render({
      ...TICKET,
      items: [{ name: 'Yam (large) \u2014 caf\u00e9 \u00d7 2', quantity: 1 }],
    })

    expect(pdf).toContain('\\(large\\)')
    expect(pdf).not.toContain('\u2014')
  })
})
