import { redirect } from 'next/navigation'
import { createClientOptional } from '@/lib/supabase/server'
import { CheckoutClient, type SavedAddress } from './CheckoutClient'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const supabase = await createClientOptional()
  if (!supabase) {
    redirect('/login?next=/checkout&error=configuration')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <CheckoutClient
        isGuest
        initialAccount={{ email: '', fullName: '', phone: '' }}
        savedAddresses={[]}
      />
    )
  }

  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
    supabase
      .from('addresses')
      .select(
        'id, label, full_name, phone, line1, line2, city, state, country, postal_code, is_default'
      )
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false }),
  ])

  const savedAddresses = (addresses ?? []) as SavedAddress[]

  return (
    <CheckoutClient
      initialAccount={{
        email: user.email ?? '',
        fullName:
          profile?.full_name?.trim() ||
          String(user.user_metadata?.full_name ?? '').trim(),
        phone: profile?.phone?.trim() || '',
      }}
      savedAddresses={savedAddresses}
    />
  )
}
