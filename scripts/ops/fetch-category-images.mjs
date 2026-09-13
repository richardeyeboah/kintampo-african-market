/**
 * One-off: download realistic category tile photos from Unsplash (free tier).
 * Run: node scripts/fetch-category-images.mjs
 */
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'public', 'images', 'categories')

/** Verified Unsplash CDN ids — real grocery / market photography */
const REMOTE = {
  canned: 'photo-1601598704991-eef6114775e0',
  'caribbean-product': 'photo-1617631716600-6a454b430367',
  cosmetics: 'photo-1556228720-195a672e8a03',
  'dairy-and-tea': 'photo-1552593050-477020c5af3f',
  'flours-rice': 'photo-1686820740687-426a7b9b2043',
  'fresh-produce': 'photo-1607349913338-fca6f7fc42d0',
  'frozen-foods': 'photo-1601599967100-f16100982063',
  'meat-seafood': 'photo-1754587489041-9fc8301f4c98',
  motherland: 'photo-1740439225991-ab26e8f6da9d',
  'non-food': 'photo-1631856954655-966f97d809de',
  snack: 'photo-1604719312497-c6fc196f51ec',
  spices: 'photo-1596040033229-a9821ebd058d',
}

fs.mkdirSync(OUT, { recursive: true })

for (const [slug, id] of Object.entries(REMOTE)) {
  const url = `https://images.unsplash.com/${id}?w=1200&h=1200&fit=crop&q=92&auto=format&fm=jpg`
  const dest = path.join(OUT, `${slug}.jpg`)
  if (fs.existsSync(dest) && fs.statSync(dest).size > 30_000) {
    console.log(`skip ${slug} (exists)`)
    continue
  }
  process.stdout.write(`fetch ${slug}… `)
  const res = await fetch(url)
  if (!res.ok) {
    console.log(`FAIL ${res.status}`)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  console.log(`${buf.length} bytes`)
}
