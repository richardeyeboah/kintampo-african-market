import Link from 'next/link'
import { Truck } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { ShippoTrackingConnect } from '@/components/admin/ShippoTrackingConnect'
import { getShippingLabelConfigPublic } from '@/lib/shipping/label-config'
import { isShippoConfigured, isUspsLabelsLive } from '@/lib/shipping/admin-ship-methods'
import { isShippoTestMode } from '@/lib/shipping/shippo-client'
import { getShippoTrackWebhookUrl } from '@/lib/shipping/shippo-webhooks'
import { getUspsConfigPublic } from '@/lib/shipping/usps-config'

export default async function AdminShippingPage() {
  await requireAdminPage()
  const cfg = getShippingLabelConfigPublic()
  const usps = getUspsConfigPublic()
  const shippoReady = isShippoConfigured()
  const uspsReady = isUspsLabelsLive() && usps.uspsConfigured
  const activeProvider = shippoReady ? 'Shippo' : uspsReady ? 'USPS' : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-page-title flex items-center gap-2">
          <Truck className="h-7 w-7 text-brand-700" aria-hidden />
          Shipping
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-earth-600">
          Label printing and ship-from address for fulfillment.
        </p>
      </div>

      <section className="admin-card">
        <h2 className="admin-section-title">Label printing</h2>
        <p className="mt-2 text-sm text-earth-700">
          {activeProvider
            ? `Provider: ${activeProvider}`
            : 'Label printing is unavailable.'}
        </p>
      </section>

      {shippoReady ? (
        <ShippoTrackingConnect
          configured={shippoReady}
          testMode={isShippoTestMode()}
          webhookUrl={getShippoTrackWebhookUrl()}
        />
      ) : null}

      <section className="admin-card">
        <h2 className="admin-section-title">Ship-from address</h2>
        {cfg.shipFrom ? (
          <div className="mt-3 rounded-lg border border-earth-200 bg-earth-50 px-4 py-3 text-sm text-earth-700">
            <p>
              {cfg.shipFrom.name}
              <br />
              {cfg.shipFrom.street1}
              {cfg.shipFrom.street2 ? `, ${cfg.shipFrom.street2}` : ''}
              <br />
              {cfg.shipFrom.city}, {cfg.shipFrom.state} {cfg.shipFrom.zip}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-earth-600">Ship-from address is not set.</p>
        )}
        <p className="mt-4">
          <Link
            href="/admin/orders?queue=needs_action"
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 no-underline hover:underline"
          >
            Orders needing action →
          </Link>
        </p>
      </section>
    </div>
  )
}
