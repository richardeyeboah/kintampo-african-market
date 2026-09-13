/**
 * Catalog hygiene for the live storefront:
 * - Hide payment/checkout test SKUs
 * - Fix obvious typos (YAEM, WWEIGH, …)
 * - Mark near-duplicate plantain-by-weight listings out of stock (keep one)
 *
 *   npx vercel env pull .env.vercel.production --environment=production --yes
 *   node --env-file=.env.vercel.production scripts/ops/catalog-hygiene.mjs
 *
 * Or: npx vercel env run -e production -- node scripts/ops/catalog-hygiene.mjs
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !key) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

const TYPO_REPLACEMENTS = [
  [/YAEM/gi, 'YAM'],
  [/WWEIGH/gi, 'WEIGHT'],
  [/Fufuf Mix/gi, 'Fufu Mix'],
  [/ALLIGTOR/gi, 'ALLIGATOR'],
]

function applyTypos(text) {
  if (!text) return text
  let out = text
  for (const [re, to] of TYPO_REPLACEMENTS) out = out.replace(re, to)
  return out
}

function isTestSku(name = '', description = '') {
  const n = (name ?? '').toLowerCase()
  const d = (description ?? '').toLowerCase()
  return (
    n.includes('payment test') ||
    n.includes('checkout test') ||
    n.includes('apple pay test') ||
    d.includes('live checkout test')
  )
}

function normalizePlantainKey(name = '') {
  const n = (name ?? '').toLowerCase()
  if (!n.includes('plantain')) return null
  // Group by-weight plantains; keep branded mixes separate
  if (n.includes('fufu') || n.includes('flour') || n.includes('chips') || n.includes('mix')) return null
  if (n.includes('per lb') || n.includes('sold by') || n.includes('weigh') || /1\.69/.test(n)) {
    return 'plantain-per-lb'
  }
  return null
}

const { data: products, error } = await supabase
  .from('products')
  .select('id,name,description,price,in_stock,created_at')
  .order('created_at', { ascending: false })

if (error) {
  console.error(error.message)
  process.exit(1)
}

let hiddenTests = 0
let typoFixes = 0
let plantainHidden = 0

const plantainGroups = new Map()

for (const p of products ?? []) {
  // Hide test SKUs
  if (isTestSku(p.name, p.description) && p.in_stock) {
    const { error: e } = await supabase.from('products').update({ in_stock: false }).eq('id', p.id)
    if (e) console.error('hide test', p.id, e.message)
    else {
      hiddenTests++
      console.log('Hidden test SKU:', p.name, p.id)
    }
    continue
  }

  // Typo fixes on name + description
  const nextName = applyTypos(p.name)
  const nextDesc = applyTypos(p.description)
  if (nextName !== p.name || nextDesc !== p.description) {
    const { error: e } = await supabase
      .from('products')
      .update({ name: nextName, description: nextDesc })
      .eq('id', p.id)
    if (e) console.error('typo', p.id, e.message)
    else {
      typoFixes++
      console.log('Typo fix:', p.name, '→', nextName)
    }
  }

  const key = normalizePlantainKey(p.name)
  if (key && p.in_stock) {
    if (!plantainGroups.has(key)) plantainGroups.set(key, [])
    plantainGroups.get(key).push({ ...p, name: nextName ?? p.name })
  }
}

// Keep newest plantain-per-lb; hide the rest
for (const [key, rows] of plantainGroups) {
  if (rows.length < 2) continue
  const [, ...dupes] = rows // already newest-first
  for (const d of dupes) {
    const { error: e } = await supabase.from('products').update({ in_stock: false }).eq('id', d.id)
    if (e) console.error('plantain dupe', d.id, e.message)
    else {
      plantainHidden++
      console.log(`Hidden duplicate (${key}):`, d.name, d.id)
    }
  }
  console.log(`Kept plantain listing:`, rows[0].name, rows[0].id)
}

console.log(
  JSON.stringify({ hiddenTests, typoFixes, plantainHidden, scanned: products?.length ?? 0 }, null, 2)
)
