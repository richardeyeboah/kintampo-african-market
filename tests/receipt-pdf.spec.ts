import { test, expect } from '@playwright/test'
import { buildReceiptModel, buildReceiptPdfLines } from '../lib/orders/receipt'
import { buildReceiptPdfBlob } from '../lib/client/receipt-pdf'

const ORDER = {
  id: '7e0a1111-2222-3333-4444-555566667777',
  order_number: 1007,
  created_at: '2026-07-27T16:57:09.000Z',
  status: 'ready_for_pickup',
  customer_name: 'Wilberforce Amaning',
  customer_email: 'buyer@example.com',
  customer_phone: '6143257385',
  subtotal_amount: 30,
  shipping_fee: 0,
  tax_amount: 0,
  total_amount: 30,
  refund_amount: 10,
  shipping_method: 'pickup',
  payment_method: 'stripe',
}

const ITEMS = [
  { id: 'a', product_name: 'Yam', product_price: 10, quantity: 3, subtotal: 30, fulfilled_quantity: 2 },
]

test.describe('receipt model', () => {
  test('reflects fulfilled quantities and the refund', () => {
    const model = buildReceiptModel(ORDER, ITEMS)
    expect(model.orderLabel).toBe('LQ-1007')
    expect(model.hasShortage).toBe(true)
    expect(model.lines[0].fulfilledQuantity).toBe(2)
    expect(model.lines[0].missingQuantity).toBe(1)
    expect(model.lines[0].lineTotal).toBe(20)
    expect(model.fulfilledSubtotal).toBe(20)
    expect(model.netPaid).toBe(20)
    expect(model.statusLabel).toBe('Ready for pickup')
  })

  test('treats a null fulfilled quantity as fully supplied', () => {
    const model = buildReceiptModel(
      { ...ORDER, refund_amount: 0 },
      [{ ...ITEMS[0], fulfilled_quantity: null }]
    )
    expect(model.hasShortage).toBe(false)
    expect(model.lines[0].fulfilledQuantity).toBe(3)
    expect(model.netPaid).toBe(30)
  })

  test('pickup receipts name the order for whoever collects it', () => {
    const lines = buildReceiptPdfLines(buildReceiptModel(ORDER, ITEMS))
    const text = lines.map((l) => l.text).join('\n')
    expect(text).toContain('LQ-1007')
    expect(text).toContain('1 unavailable')
    expect(text).toContain('Refunded: -$10.00')
    expect(text).toContain('Net paid: $20.00')
  })
})

test.describe('receipt pdf writer', () => {
  test('emits a structurally valid single-page pdf', async () => {
    const blob = buildReceiptPdfBlob([
      { text: 'Kintampo African Market', bold: true, size: 15 },
      { text: 'Order LQ-1007' },
    ])
    const pdf = Buffer.from(await blob.arrayBuffer()).toString('latin1')

    expect(blob.type).toBe('application/pdf')
    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(pdf).toContain('/Type /Catalog')
    expect(pdf).toContain('/Count 1')
    expect(pdf).toContain('/BaseFont /Helvetica-Bold')
    expect(pdf).toContain('(Order LQ-1007) Tj')
  })

  test('paginates long receipts and keeps the xref table aligned', async () => {
    const many = Array.from({ length: 300 }, (_, i) => ({ text: `Line item number ${i}` }))
    const blob = buildReceiptPdfBlob(many)
    const pdf = Buffer.from(await blob.arrayBuffer()).toString('latin1')

    const pageCount = Number(/\/Count (\d+)/.exec(pdf)?.[1])
    expect(pageCount).toBeGreaterThan(1)

    // Every object offset in the xref must point at that object's header.
    const objectCount = Number(/trailer\n<< \/Size (\d+)/.exec(pdf)?.[1]) - 1
    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]))
    expect(offsets).toHaveLength(objectCount)
    offsets.forEach((offset, index) => {
      expect(pdf.slice(offset, offset + 24)).toContain(`${index + 1} 0 obj`)
    })
  })

  test('escapes parentheses and drops characters the base font cannot draw', async () => {
    const blob = buildReceiptPdfBlob([{ text: 'Yam (large) \u2014 caf\u00e9 \u00d7 2' }])
    const pdf = Buffer.from(await blob.arrayBuffer()).toString('latin1')

    expect(pdf).toContain('\\(large\\)')
    expect(pdf).toContain('x 2')
    expect(pdf).not.toContain('\u2014')
  })
})
