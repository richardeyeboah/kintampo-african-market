import { STORE } from '@/lib/constants/store'
import { formatMoney } from '@/lib/utils'
import type { ReceiptModel } from '@/lib/orders/receipt'

export function ReceiptDocument({ model }: { model: ReceiptModel }) {
  return (
    <article className="receipt-doc rounded-2xl border border-earth-200 bg-white p-6 text-earth-900 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-earth-200 pb-5">
        <div>
          <p className="text-sm font-semibold">{STORE.name}</p>
          <p className="mt-0.5 text-xs text-earth-500">{STORE.address}</p>
          <p className="text-xs text-earth-500">{STORE.hours}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-earth-500">
            Receipt
          </p>
          <p className="font-mono text-2xl font-bold leading-tight">{model.orderLabel}</p>
          {model.placedAt && (
            <p className="mt-0.5 text-xs text-earth-500">
              {new Date(model.placedAt).toLocaleString()}
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-6 border-b border-earth-200 py-5 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-earth-500">
            Customer
          </p>
          <p className="mt-1 text-sm font-medium">{model.customerName}</p>
          {model.customerEmail && <p className="text-sm text-earth-600">{model.customerEmail}</p>}
          {model.customerPhone && <p className="text-sm text-earth-600">{model.customerPhone}</p>}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-earth-500">
            {model.isPickup ? 'Pick up at' : 'Deliver to'}
          </p>
          <div className="mt-1 text-sm text-earth-700">
            {model.destinationLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <p className="mt-2 text-sm">
            <span className="text-earth-500">Status: </span>
            <span className="font-medium">{model.statusLabel}</span>
          </p>
        </div>
      </div>

      <div className="py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-earth-500">Items</p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-earth-200 text-left text-xs text-earth-500">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 text-center font-medium">Qty</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {model.lines.map((line) => (
              <tr key={line.id} className="border-b border-earth-100 last:border-0">
                <td className="py-2.5 pr-3">
                  <span className="font-medium">{line.name}</span>
                  {line.missingQuantity > 0 && (
                    <span className="mt-0.5 block text-xs font-medium text-red-600">
                      {line.missingQuantity} unavailable — refunded
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-center tabular-nums">
                  {line.missingQuantity > 0 ? (
                    <span>
                      {line.fulfilledQuantity}
                      <span className="text-earth-400"> / {line.orderedQuantity}</span>
                    </span>
                  ) : (
                    line.fulfilledQuantity
                  )}
                </td>
                <td className="py-2.5 text-right tabular-nums">{formatMoney(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="space-y-2 border-t border-earth-200 pt-5 text-sm">
        <Row label="Subtotal" value={formatMoney(model.subtotal)} />
        {model.hasShortage && (
          <Row label="Items supplied" value={formatMoney(model.fulfilledSubtotal)} />
        )}
        <Row
          label={model.isPickup ? 'Pickup fee' : 'Shipping'}
          value={
            model.isPickup && model.shippingFee === 0 ? '—' : formatMoney(model.shippingFee)
          }
        />
        {model.tax > 0 && <Row label="Sales tax" value={formatMoney(model.tax)} />}
        <div className="flex justify-between gap-4 border-t border-earth-200 pt-2 text-base font-semibold">
          <dt>Order total</dt>
          <dd className="tabular-nums">{formatMoney(model.total)}</dd>
        </div>
        {model.refunded > 0 && (
          <>
            <Row label="Refunded" value={`−${formatMoney(model.refunded)}`} accent />
            <div className="flex justify-between gap-4 border-t border-earth-200 pt-2 text-base font-semibold">
              <dt>Net paid</dt>
              <dd className="tabular-nums">{formatMoney(model.netPaid)}</dd>
            </div>
          </>
        )}
      </dl>

      {model.isPickup && (
        <p className="mt-6 rounded-lg bg-accent-50 p-3 text-xs leading-relaxed text-earth-700">
          Show order <span className="font-mono font-semibold">{model.orderLabel}</span> at the
          counter to collect. Sending a friend or a delivery driver? This receipt is all they need.
        </p>
      )}
    </article>
  )
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-earth-500">{label}</dt>
      <dd className={`tabular-nums ${accent ? 'text-red-700' : 'text-earth-900'}`}>{value}</dd>
    </div>
  )
}
