import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { resolveRange, type RangeKey } from '@/lib/admin/date-range'
import { formatOrderNumber } from '@/lib/orders/order-number'
import { normalizeOrderStatus } from '@/lib/order-status'

export const runtime = 'nodejs'

const VALID_RANGES: RangeKey[] = [
  'today',
  'yesterday',
  '7d',
  '30d',
  'wtd',
  'mtd',
  'last_week',
  'last_month',
  'ytd',
  'all',
  'custom',
]

/**
 * Wraps a value in CSV-safe quoting:
 * - escapes any internal double-quote by doubling it
 * - always quotes since fields can contain commas / newlines / etc.
 * - serializes null/undefined as empty string
 */
function csv(v: unknown): string {
  if (v === null || v === undefined) return '""'
  const s = String(v)
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const rangeRaw = req.nextUrl.searchParams.get('range') ?? '30d'
  const rangeKey: RangeKey = (VALID_RANGES as string[]).includes(rangeRaw)
    ? (rangeRaw as RangeKey)
    : '30d'
  const from = req.nextUrl.searchParams.get('from') ?? undefined
  const to = req.nextUrl.searchParams.get('to') ?? undefined
  const range = resolveRange(rangeKey, from, to)

  const startIso = range.start?.toUTC().toISO() ?? null
  const endIso = range.end.toUTC().toISO()!

  const baseColumns =
    'id, order_number, created_at, customer_name, customer_email, customer_phone, address_line, city, state, country, postal_code, subtotal_amount, shipping_fee, tax_amount, total_amount, refund_amount, refunded_at, status, shipping_method, payment_method, tracking_number'

  const buildQuery = (columns: string) => {
    let q = supabaseAdmin
      .from('orders')
      .select(columns)
      .lt('created_at', endIso)
      .order('created_at', { ascending: false })
    if (startIso) q = q.gte('created_at', startIso)
    return q
  }

  // payment_status / paid_at / order_source need the phone-orders migration.
  let { data: orders, error } = await buildQuery(
    `${baseColumns}, payment_status, paid_at, order_source`
  )
  if (error && /payment_status|order_source|paid_at/i.test(error.message)) {
    ;({ data: orders, error } = await buildQuery(baseColumns))
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const header = [
    'Order #',
    'Order ID',
    'Placed (ISO)',
    'Status',
    'Customer name',
    'Email',
    'Phone',
    'Address',
    'City',
    'State',
    'Postal',
    'Country',
    'Subtotal',
    'Shipping',
    'Total',
    'Refund amount',
    'Refunded at',
    'Shipping method',
    'Payment method',
    'Payment status',
    'Paid at',
    'Source',
    'Tracking',
  ]
    .map(csv)
    .join(',')

  type ExportRow = Record<string, unknown>
  const rows = ((orders ?? []) as unknown as ExportRow[]).map((o) =>
    [
      formatOrderNumber(o.order_number as number | null) || '',
      o.id,
      o.created_at,
      normalizeOrderStatus(o.status as string | null),
      o.customer_name ?? '',
      o.customer_email ?? '',
      o.customer_phone ?? '',
      o.address_line ?? '',
      o.city ?? '',
      o.state ?? '',
      o.postal_code ?? '',
      o.country ?? '',
      o.subtotal_amount ?? '',
      o.shipping_fee ?? '',
      o.tax_amount ?? '',
      o.total_amount ?? '',
      o.refund_amount ?? '',
      o.refunded_at ?? '',
      o.shipping_method ?? '',
      o.payment_method ?? '',
      o.payment_status ?? 'paid',
      o.paid_at ?? '',
      o.order_source ?? 'online',
      o.tracking_number ?? '',
    ]
      .map(csv)
      .join(',')
  )

  const csvBody = [header, ...rows].join('\n')
  // Prepend UTF-8 BOM so Excel detects encoding correctly.
  const body = '\uFEFF' + csvBody

  const filename = `orders-${range.key}-${range.end.toFormat('yyyyLLdd')}.csv`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
