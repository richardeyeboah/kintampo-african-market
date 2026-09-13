import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!url || !key) {
  console.error('missing supabase env')
  process.exit(1)
}

const supabase = createClient(url, key)
const GUEST = '00000000-0000-0000-0000-000000000001'

const payload = {
  items: [{ productId: '0cd4d413-8278-4baa-b655-388e291ef0e3', quantity: 1 }],
  customer_name: 'Test',
  customer_phone: '6145550100',
  address_line: 'Store pickup',
  city: 'Columbus',
  state: 'OH',
  country: 'united states',
  postal_code: null,
  shipping_method: 'pickup',
  shipping_zone: 'local',
  account_email: 'test@example.com',
  pickup_contact_name: null,
}

const { data, error } = await supabase
  .from('checkout_snapshots')
  .insert({ user_id: GUEST, payload })
  .select('id')
  .single()

if (error) {
  console.error('INSERT FAILED:', error.code, error.message, error.details, error.hint)
  process.exit(1)
}

console.log('INSERT OK:', data.id)
await supabase.from('checkout_snapshots').delete().eq('id', data.id)
console.log('cleaned up test row')
