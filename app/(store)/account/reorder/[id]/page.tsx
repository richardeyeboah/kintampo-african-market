import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClientOptional } from '@/lib/supabase/server'
import { ReorderClient } from './ReorderClient'

export const dynamic = 'force-dynamic'

export default async function ReorderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClientOptional()
  if (!supabase) redirect(`/login?next=/account/reorder/${id}&error=configuration`)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/account/reorder/${id}`)

  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_id, product_name, product_price, quantity')
    .eq('order_id', id)

  return (
    <div className="stack">
      <h2>Reorder</h2>
      <p className="muted">Order {id}</p>

      {error && <p className="error">{error.message}</p>}

      {(!items || items.length === 0) && !error && (
        <p>No items found on this order, or it does not belong to your account.</p>
      )}

      {items && items.length > 0 && (
        <ReorderClient items={items} />
      )}

      <p><Link href="/account">← Back to account</Link></p>
    </div>
  )
}
