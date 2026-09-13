/**
 * Dump product description audit to stdout (JSON summary + duplicate groups).
 *   npx vercel env run -e production '--' node scripts/audit-descriptions.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!url || !key) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const supabase = createClient(url, key)
const { data, error } = await supabase
  .from('products')
  .select('id,name,category,description,in_stock,price')
  .order('name')

if (error) {
  console.error(error.message)
  process.exit(1)
}

const products = data ?? []
const byDesc = new Map()
for (const p of products) {
  const d = (p.description || '').trim()
  if (!d) continue
  if (!byDesc.has(d)) byDesc.set(d, [])
  byDesc.get(d).push(p)
}

const dups = [...byDesc.entries()]
  .filter(([, rows]) => rows.length > 1)
  .sort((a, b) => b[1].length - a[1].length)

const empty = products.filter((p) => !p.description?.trim())
const summary = {
  total: products.length,
  withDesc: products.length - empty.length,
  empty: empty.length,
  duplicateGroups: dups.length,
  skusInDuplicateGroups: dups.reduce((n, [, rows]) => n + rows.length, 0),
  topDupes: dups.slice(0, 20).map(([desc, rows]) => ({
    count: rows.length,
    descPreview: desc.slice(0, 120),
    names: rows.map((r) => r.name),
  })),
}

writeFileSync('tmp/desc-audit.json', JSON.stringify({ summary, products }, null, 2))
console.log(JSON.stringify(summary, null, 2))
