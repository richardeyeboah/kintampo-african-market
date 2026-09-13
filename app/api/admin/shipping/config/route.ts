import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { getShippingLabelConfigPublic } from '@/lib/shipping/label-config'
import { getUspsConfigPublic } from '@/lib/shipping/usps-config'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ...getShippingLabelConfigPublic(),
    ...getUspsConfigPublic(),
  })
}
