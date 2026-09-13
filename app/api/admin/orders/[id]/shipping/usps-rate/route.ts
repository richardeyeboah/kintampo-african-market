import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { assertSameOrigin } from '@/lib/security/same-origin'
import { getDefaultParcel, getShipFromAddress } from '@/lib/shipping/label-config'
import { isShippoConfigured, getShippoDomesticRate } from '@/lib/shipping/shippo-client'
import { getUspsDomesticRate } from '@/lib/shipping/usps-client'
import { isUspsConfigured } from '@/lib/shipping/usps-config'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originCheck = assertSameOrigin(_req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const useShippo = isShippoConfigured()
  const useUsps = isUspsConfigured()

  if (!useShippo && !useUsps) {
    return NextResponse.json({ error: 'No shipping provider configured.' }, { status: 503 })
  }

  try {
    const { id } = await params
    const from = getShipFromAddress()!
    const body = await _req.json().catch(() => ({}))
    const defaultParcel = getDefaultParcel()
    // Allow per-request parcel override — clamp to USPS maximums
    function safeParcelNum(val: unknown, fallback: number, max: number): number {
      const n = Number(val)
      return Number.isFinite(n) && n > 0 && n <= max ? n : fallback
    }
    const parcel = {
      weightLb: safeParcelNum(body?.parcel?.weightLb, defaultParcel.weightLb, 70),
      lengthIn: safeParcelNum(body?.parcel?.lengthIn, defaultParcel.lengthIn, 108),
      widthIn:  safeParcelNum(body?.parcel?.widthIn,  defaultParcel.widthIn,  108),
      heightIn: safeParcelNum(body?.parcel?.heightIn, defaultParcel.heightIn, 108),
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, postal_code, shipping_method')
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    if (order.shipping_method === 'pickup') {
      return NextResponse.json({ error: 'Pickup order.' }, { status: 400 })
    }

    const rate = useShippo
      ? await getShippoDomesticRate({
          fromZip: from.zip,
          toZip: order.postal_code ?? '',
          parcel,
        })
      : await getUspsDomesticRate({
          fromZip: from.zip,
          toZip: order.postal_code ?? '',
          parcel,
        })

    if (!rate) {
      return NextResponse.json({ error: 'No rate returned for this package.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, parcel, provider: useShippo ? 'shippo' : 'usps', ...rate })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not fetch shipping rate.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
