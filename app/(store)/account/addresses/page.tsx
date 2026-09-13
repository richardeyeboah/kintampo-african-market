import { redirect } from 'next/navigation'
import { createClientOptional } from '@/lib/supabase/server'
import { AddressesManager, type AddressRow } from './AddressesManager'

export const dynamic = 'force-dynamic'

export default async function AddressesPage() {
  const supabase = await createClientOptional()
  if (!supabase) redirect('/login?next=/account/addresses&error=configuration')
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/addresses')

  const { data: addresses, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <>
      <p className="section-eyebrow">Settings</p>
      <h1 className="section-title mt-2">Saved addresses</h1>
      <p className="section-subtitle mt-2">Manage delivery locations for faster checkout.</p>
      {error && (
        <p className="error mt-6">
          Could not load addresses: {error.message}
        </p>
      )}
      <div className="mt-8">
        <AddressesManager userId={user.id} initial={(addresses ?? []) as AddressRow[]} />
      </div>
    </>
  )
}
