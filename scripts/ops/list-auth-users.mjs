import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const raw of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const line = raw.trim()
  if (!line || line.startsWith('#')) continue
  const i = line.indexOf('=')
  if (i < 0) continue
  let k = line.slice(0, i)
  let v = line.slice(i + 1)
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (v && !process.env[k]) process.env[k] = v
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 })
if (error) {
  console.error(error)
  process.exit(1)
}
console.log('users', data.users.length)
for (const u of data.users) {
  console.log('-', u.email, 'confirmed=', Boolean(u.email_confirmed_at), 'id=', u.id.slice(0, 8))
}
