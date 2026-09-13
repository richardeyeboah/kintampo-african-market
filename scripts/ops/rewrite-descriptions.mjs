/**
 * Rewrite product descriptions — unique per SKU, utility-first (no emotional fluff).
 *
 * Dry run:
 *   npx vercel env run -e production '--' node scripts/rewrite-descriptions.mjs
 * Apply:
 *   npx vercel env run -e production '--' node scripts/rewrite-descriptions.mjs --apply
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'

const APPLY = process.argv.includes('--apply')
const ONLY_DUPES_OR_EMPTY = process.argv.includes('--fix-bad')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!url || !key) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

function extractSize(name) {
  const m = name.match(
    /(\d+\.?\d*)\s*(kg|g|lb|lbs|oz|ml|l|litre|liter|cl|gallon|pcs|pack|ct|count)\b/i
  )
  if (!m) return null
  const unit = m[2].toLowerCase().replace(/lbs?/, 'lb').replace(/litre|liter/, 'L')
  return `${m[1]} ${unit}`
}

function extractPriceHint(name) {
  const m = name.match(/\$?\s*(\d+\.?\d*)\s*per\s*lb/i)
  if (m) return `$${m[1]}/lb`
  return null
}

function cleanDisplayName(name) {
  return name
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' — ')
    .trim()
}

/** Use-case hints keyed by product-name tokens (longest match wins). */
const USE_HINTS = [
  ['kenkey', 'Corn meal for Accra-style kenkey — ferment and steam per package directions.'],
  ['banku', 'Banku mix for a fermented corn-and-cassava swallow. Serve with soup, stew, or grilled fish.'],
  ['abalines', 'Balm for topical relief — follow pack directions.'],
  ['balm', 'Topical balm — follow pack directions for use.'],
  ['mackerel', 'Canned or fresh mackerel for stews, pepper soup, and rice dishes.'],
  ['palm cream', 'Palm cream / concentrate for soups and stews.'],
  ['fish', 'Fish for soups, stews, grilling, or frying — prep as labeled.'],
  ['leaves', 'Dried leaves for soups and stews — rinse and cook as needed.'],
  ['atta', 'Spice / leaf ingredient for traditional recipes.'],
  ['kineleba', 'Dried leaves used in traditional broths and herbal preparations.'],
  ['alligator', 'Alligator pepper — aromatic spice for soups and marinades.'],
  ['plantain fufu', 'Mix with hot water for a smooth plantain fufu swallow; serve with soup or stew.'],
  ['pounded yam', 'Poundo-style yam flour for a smooth swallow — add boiling water and stir.'],
  ['yam box', 'Whole Ghana yams packed by the box. Boil, fry, or roast.'],
  ['yam', 'Cooking yam for boiling, frying, or pounding.'],
  ['plantain', 'Use green for boiling/frying; riper fruit for sweet fried plantain.'],
  ['palm oil', 'Red palm oil for stews, soups, and jollof-style cooking.'],
  ['groundnut oil', 'High-heat cooking oil for frying and everyday sauces.'],
  ['coconut oil', 'Cooking and pantry oil with a light coconut note.'],
  ['olive oil', 'For salads, finishing, and light sautéing.'],
  ['egusi', 'Melon seeds for thick West African egusi soup.'],
  ['ogbono', 'Draw-soup seeds for ogbono / draw soup.'],
  ['stockfish', 'Dried stockfish for soups and stews — soak before cooking.'],
  ['crayfish', 'Dried crayfish seasoning for soups, stews, and rice.'],
  ['milo', 'Chocolate malt drink mix — stir into hot or cold milk.'],
  ['peak', 'Milk powder / evaporated milk for tea, porridge, and cooking.'],
  ['nido', 'Full-cream milk powder for drinks, porridge, and baking.'],
  ['malt', 'Non-alcoholic malt drink — serve chilled.'],
  ['ginger beer', 'Spicy ginger soda — serve cold.'],
  ['sobolo', 'Hibiscus house drink — serve chilled.'],
  ['amuduro', 'Herbal house drink — serve chilled.'],
  ['bitters', 'Herbal bitters — typically served chilled.'],
  ['shea butter', 'Unrefined shea for skin and hair moisture.'],
  ['black soap', 'African black soap for face and body cleansing.'],
  ['rice', 'Pantry rice for jollof, stews, and everyday meals.'],
  ['sardine', 'Canned sardines — ready protein for bread, yam, or rice.'],
  ['corned beef', 'Canned corned beef for stews, rice, and sandwiches.'],
  ['salted', 'Salted / cured meat — rinse and cook in soups or stews.'],
  ['pepper', 'Hot pepper for stews, soups, and marinades.'],
  ['spice', 'Seasoning for soups, stews, rice, and grilled meats.'],
  ['tea', 'Tea for hot or iced brewing.'],
  ['oil', 'Cooking oil for frying and everyday kitchen use.'],
  ['snack', 'Ready-to-eat snack.'],
  ['gel', 'Beauty / skin-care product — check label for use.'],
  ['lotion', 'Moisturizing lotion for body care.'],
  ['soap', 'Cleansing soap for daily use.'],
]

function hintFor(name) {
  const n = name.toLowerCase()
  const hit = USE_HINTS.find(([kw]) => n.includes(kw))
  return hit?.[1] ?? null
}

function categoryUse(category) {
  switch (category) {
    case 'Flours & Rice':
      return 'Dry pantry staple for swallows, rice dishes, and everyday cooking.'
    case 'Fresh Produce':
      return 'Fresh market item — cook soon after purchase.'
    case 'Beverages':
      return 'Ready to drink — chill when preferred.'
    case 'Meat and Seafood':
      return 'Protein for soups, stews, grilling, or frying.'
    case 'Spices':
      return 'Seasoning for soups, stews, rice, and marinades.'
    case 'Dairy And Tea':
      return 'For tea, porridge, baking, or everyday drinks.'
    case 'Cosmetics':
      return 'Beauty / personal care — follow pack directions.'
    case 'Snack':
      return 'Ready-to-eat snack.'
    case 'Canned':
      return 'Shelf-stable pantry item — ready when you need it.'
    case 'Bread':
      return 'Bread / baked good for meals and snacks.'
    case 'Motherland':
      return 'Traditional ingredient for recipes from the region.'
    case 'Non food':
      return 'Non-food store item — see pack for details.'
    default:
      return 'Available for store pickup or shipping.'
  }
}

function categoryCloser(category) {
  switch (category) {
    case 'Flours & Rice':
      return 'Store sealed in a cool, dry place.'
    case 'Fresh Produce':
      return 'Refrigerate after purchase when needed.'
    case 'Beverages':
      return 'Best served cold when applicable.'
    case 'Meat and Seafood':
      return 'Keep refrigerated or frozen until cooking.'
    case 'Spices':
      return 'Keep sealed away from heat and moisture.'
    case 'Dairy And Tea':
      return 'Store as labeled on the pack.'
    case 'Cosmetics':
      return 'For external use as directed.'
    case 'Snack':
      return 'Reseal after opening.'
    case 'Canned':
      return 'Refrigerate after opening.'
    case 'Motherland':
      return 'Use per your recipe.'
    default:
      return 'Pickup in Columbus or ship nationwide.'
  }
}

/**
 * Build a unique 1–2 sentence description that always mentions this SKU’s name
 * and size/price cues so duplicates can’t share identical copy.
 */
function buildDescription(product) {
  const name = cleanDisplayName(product.name)
  const size = extractSize(product.name)
  const perLb = extractPriceHint(product.name)
  const hint = hintFor(product.name)
  const cat = product.category || 'Grocery'

  const sizeBit = size ? `${size}` : null
  const priceBit = perLb ? `${perLb}` : null
  const meta = [sizeBit, priceBit].filter(Boolean).join(', ')

  const lead = meta ? `${name} (${meta}).` : `${name}.`
  const mid = hint ?? categoryUse(cat)
  const close = categoryCloser(cat)

  const text = `${lead} ${mid} ${close}`.replace(/\s+/g, ' ').trim()
  return text.slice(0, 420)
}

const KNOWN_BAD_SNIPPETS = [
  'ripe or unripe plantain, a caribbean and west african staple',
  'a pantry staple —',
  'a tasty snack —',
  'a trusted beauty product —',
  'reconnect with hometown flavors',
  'warm evenings gathered around the table',
]

function isBadDescription(desc, name) {
  const d = (desc || '').trim()
  if (!d) return true
  const lower = d.toLowerCase()
  if (KNOWN_BAD_SNIPPETS.some((s) => lower.includes(s))) return true
  // Template pattern: "A pantry staple — PRODUCTNAME."
  if (/^a (pantry staple|tasty snack|trusted beauty product|popular drink|quality|classic favourite)/i.test(d)) {
    return true
  }
  // Description doesn't include any meaningful token from the name
  const tokens = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 3 && !['with', 'from', 'sold', 'per'].includes(t))
  if (tokens.length >= 2 && !tokens.some((t) => lower.includes(t))) return true
  return false
}

const { data: products, error } = await supabase
  .from('products')
  .select('id,name,category,description,in_stock,price')
  .order('name')

if (error) {
  console.error(error.message)
  process.exit(1)
}

const all = products ?? []

// Detect shared descriptions (exact duplicates)
const byDesc = new Map()
for (const p of all) {
  const d = (p.description || '').trim()
  if (!d) continue
  if (!byDesc.has(d)) byDesc.set(d, [])
  byDesc.get(d).push(p.id)
}
const sharedIds = new Set()
for (const [, ids] of byDesc) {
  if (ids.length > 1) ids.forEach((id) => sharedIds.add(id))
}

const targets = all.filter((p) => {
  if (ONLY_DUPES_OR_EMPTY) {
    return (
      !p.description?.trim() ||
      sharedIds.has(p.id) ||
      isBadDescription(p.description, p.name)
    )
  }
  return true // rewrite all for consistency
})

const planned = targets.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  before: p.description,
  after: buildDescription(p),
}))

// Ensure uniqueness among planned after texts
const seen = new Map()
for (const row of planned) {
  let text = row.after
  if (seen.has(text)) {
    text = `${text} SKU: ${row.name}.`
    row.after = text.slice(0, 420)
  }
  seen.set(row.after, row.id)
}

writeFileSync('tmp/desc-rewrite-plan.json', JSON.stringify(planned, null, 2))

console.log(
  JSON.stringify(
    {
      total: all.length,
      rewriting: planned.length,
      mode: APPLY ? 'APPLY' : 'DRY_RUN',
      sample: planned.slice(0, 8).map((p) => ({ name: p.name, after: p.after })),
    },
    null,
    2
  )
)

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply to save.')
  process.exit(0)
}

let ok = 0
let fail = 0
for (const row of planned) {
  const { error: upErr } = await supabase
    .from('products')
    .update({ description: row.after })
    .eq('id', row.id)
  if (upErr) {
    fail++
    console.error('fail', row.name, upErr.message)
  } else {
    ok++
  }
}

console.log(JSON.stringify({ updated: ok, failed: fail }, null, 2))
