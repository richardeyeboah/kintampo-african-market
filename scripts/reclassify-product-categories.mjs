import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { classifyStoreCategory } from './lib/classify-store-category.mjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODE = process.argv.includes('--apply') ? 'apply' : 'dry-run'
const OUT_DIR = path.resolve(process.cwd(), 'data')
const REPORT_PATH = path.join(OUT_DIR, 'category_reclassification_report.csv')

function titleLower(input) {
  return (input ?? '').toLowerCase().trim()
}

/** Legacy bucket fixes before full re-score */
function legacyFix(current, name) {
  const n = titleLower(name)
  if (current === 'Seafood') return 'Meat and Seafood'
  if (current === 'Fabrics') return 'Non food'
  if (current === 'Packaged Produce') {
    if (n.includes('hominy')) return 'Canned'
    return 'Flours & Rice'
  }
  return null
}

const { data: products, error } = await supabase
  .from('products')
  .select('id,name,category,description')
  .order('name', { ascending: true })

if (error) throw new Error(`Failed loading products: ${error.message}`)

const changes = []
for (const p of products ?? []) {
  const legacy = legacyFix(p.category, p.name)
  const { category: scored, confident } = classifyStoreCategory({
    name: p.name,
    description: p.description,
    sourceCategories: [],
  })
  const updated = legacy ?? (confident ? scored : p.category)
  if (updated !== p.category) {
    changes.push({
      id: p.id,
      name: p.name,
      from_category: p.category,
      to_category: updated,
    })
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true })
const csv = [
  'id,name,from_category,to_category',
  ...changes.map((r) => {
    const safeName = `"${String(r.name ?? '').replace(/"/g, '""')}"`
    return `${r.id},${safeName},${r.from_category},${r.to_category}`
  }),
].join('\n')
fs.writeFileSync(REPORT_PATH, csv, 'utf8')

const counts = {}
for (const p of products ?? []) {
  const legacy = legacyFix(p.category, p.name)
  const { category, confident } = classifyStoreCategory({ name: p.name, description: p.description })
  const final = legacy ?? (confident ? category : p.category)
  counts[final] = (counts[final] ?? 0) + 1
}

console.log(`[${MODE}] total products: ${products?.length ?? 0}`)
console.log(`[${MODE}] proposed changes: ${changes.length}`)
console.log(`[${MODE}] report: ${REPORT_PATH}`)
console.log('\nAfter reclassify distribution:')
for (const [cat, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${n}`)
}

if (changes.length === 0) {
  console.log('No category changes needed.')
  process.exit(0)
}

if (MODE !== 'apply') {
  for (const row of changes.slice(0, 40)) {
    console.log(`- ${row.name}: ${row.from_category} -> ${row.to_category}`)
  }
  if (changes.length > 40) {
    console.log(`...and ${changes.length - 40} more`)
  }
  process.exit(0)
}

let applied = 0
for (const row of changes) {
  const { error: updateError } = await supabase
    .from('products')
    .update({ category: row.to_category })
    .eq('id', row.id)

  if (updateError) {
    throw new Error(`Failed updating "${row.name}": ${updateError.message}`)
  }
  applied += 1
  if (applied % 50 === 0) console.log(`Applied ${applied}/${changes.length}`)
}

console.log(`Applied ${applied} category updates.`)
