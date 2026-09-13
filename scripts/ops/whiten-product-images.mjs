/**
 * Normalize product photos onto a clean white square WITHOUT cutting the product.
 * Only edge-connected near-white / studio-gray pixels become pure white so
 * packaging colors stay intact (AI cutout was washing light products out).
 *
 * Usage:
 *   node --env-file=.env.local scripts/whiten-product-images.mjs
 *   node --env-file=.env.local scripts/whiten-product-images.mjs --limit=10
 *   node --env-file=.env.local scripts/whiten-product-images.mjs --force
 *   node --env-file=.env.local scripts/whiten-product-images.mjs --force --cutout
 *     (--cutout re-enables AI subject cutout — avoid unless you need it)
 */
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EXPORT_FILE = resolve(ROOT, 'data', 'products-export.json')

const SIZE = 1200
const PAD = Math.round(SIZE * 0.08)
const BUCKET = 'product-images'
const CONCURRENCY = 2

/** Edge flood: treat as studio background if bright enough and not strongly colored. */
const BG_LUMA_MIN = 210
const BG_CHROMA_MAX = 28

/** Prefer original export URLs so re-runs don't reprocess already-composited images. */
function loadOriginalUrls() {
  try {
    const rows = JSON.parse(readFileSync(EXPORT_FILE, 'utf8'))
    const map = new Map()
    for (const p of rows) {
      if (p?.id && p?.image_url) map.set(p.id, p.image_url)
    }
    return map
  } catch {
    return new Map()
  }
}

const args = new Set(process.argv.slice(2))
const force = args.has('--force')
const useCutout = args.has('--cutout')
const limitArg = [...args].find((a) => a.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, key)

async function ensureBucket() {
  const { data } = await sb.storage.listBuckets()
  if (data?.some((b) => b.name === BUCKET)) return
  const { error } = await sb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  })
  if (error && !/already exists/i.test(error.message)) throw error
}

async function fetchBuffer(imageUrl) {
  const clean = imageUrl.split('?')[0]
  const res = await fetch(clean, {
    headers: { 'User-Agent': 'KintampoImageWhiten/1.0' },
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function isStudioBackground(r, g, b) {
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  if (luma < BG_LUMA_MIN) return false
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min <= BG_CHROMA_MAX
}

/** Flood-fill from image edges: only near-white / gray studio pixels → pure white. */
async function whitenEdgeBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const count = width * height
  const seen = new Uint8Array(count)
  const queue = new Uint32Array(count)
  let read = 0
  let write = 0

  function enqueue(pixel) {
    if (seen[pixel]) return
    const o = pixel * 4
    if (!isStudioBackground(data[o], data[o + 1], data[o + 2])) return
    seen[pixel] = 1
    queue[write++] = pixel
  }

  for (let x = 0; x < width; x++) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (read < write) {
    const pixel = queue[read++]
    const x = pixel % width
    const y = Math.floor(pixel / width)
    if (x > 0) enqueue(pixel - 1)
    if (x + 1 < width) enqueue(pixel + 1)
    if (y > 0) enqueue(pixel - width)
    if (y + 1 < height) enqueue(pixel + width)
  }

  for (let pixel = 0; pixel < count; pixel++) {
    if (!seen[pixel]) continue
    const o = pixel * 4
    data[o] = 255
    data[o + 1] = 255
    data[o + 2] = 255
    data[o + 3] = 255
  }

  return sharp(data, { raw: info }).removeAlpha().jpeg({ quality: 92, mozjpeg: true }).toBuffer()
}

/** Place original on a white square; optionally AI-cut (legacy). */
async function toWhiteSquare(input) {
  let subject = input

  if (useCutout) {
    const { removeBackground } = await import('@imgly/background-removal-node')
    const jpegCopy = Buffer.from(input)
    const cutout = await removeBackground(new Blob([jpegCopy], { type: 'image/jpeg' }), {
      model: 'medium',
      output: { format: 'image/png', quality: 0.9 },
    })
    subject = Buffer.from(await cutout.arrayBuffer())
  }

  const inner = SIZE - PAD * 2
  const placed = await sharp(subject)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: useCutout ? 0 : 1 },
      withoutEnlargement: false,
    })
    .extend({
      top: PAD,
      bottom: PAD,
      left: PAD,
      right: PAD,
      background: { r: 255, g: 255, b: 255, alpha: useCutout ? 0 : 1 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()

  // Soft studio cleanup — keeps product colors; only edge-connected pale bg → #FFF
  return Buffer.from(await whitenEdgeBackground(placed))
}

function alreadyOurs(imageUrl) {
  return typeof imageUrl === 'string' && imageUrl.includes(`/storage/v1/object/public/${BUCKET}/`)
}

async function processOne(product, originals) {
  if (!product.image_url?.trim()) return { id: product.id, skipped: 'no image' }
  if (!force && alreadyOurs(product.image_url)) return { id: product.id, skipped: 'already whitened' }

  const sourceUrl = originals.get(product.id) || product.image_url
  const raw = await fetchBuffer(sourceUrl)
  const jpeg = await toWhiteSquare(raw)
  const uploadBody = Buffer.from(jpeg)
  const path = `${product.id}.jpg`

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, uploadBody, {
    contentType: 'image/jpeg',
    upsert: true,
    cacheControl: '31536000',
  })
  if (upErr) throw upErr

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = `${pub.publicUrl}?v=${Date.now()}`

  const { error: dbErr } = await sb
    .from('products')
    .update({ image_url: publicUrl })
    .eq('id', product.id)
  if (dbErr) throw dbErr

  return { id: product.id, ok: true, bytes: uploadBody.length }
}

async function mapPool(items, concurrency, fn) {
  const results = []
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      const name = items[idx].name?.slice(0, 40) ?? items[idx].id
      process.stdout.write(`\n[${idx + 1}/${items.length}] ${name} … `)
      try {
        results[idx] = await fn(items[idx])
        process.stdout.write(results[idx].ok ? 'ok' : results[idx].skipped || 'done')
      } catch (e) {
        results[idx] = { id: items[idx].id, error: e instanceof Error ? e.message : String(e) }
        process.stdout.write('FAIL ' + results[idx].error)
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return results
}

await ensureBucket()

const { data: products, error } = await sb
  .from('products')
  .select('id,name,image_url')
  .not('image_url', 'is', null)
  .order('created_at', { ascending: true })

if (error) {
  console.error(error.message)
  process.exit(1)
}

const list = (products ?? []).slice(0, Number.isFinite(limit) ? limit : undefined)
const originals = loadOriginalUrls()
console.log(
  `Whitening backgrounds (preserve product) for ${list.length} images → ${BUCKET}/ (originals: ${originals.size}, cutout=${useCutout})`
)

const results = await mapPool(list, CONCURRENCY, (p) => processOne(p, originals))
let ok = 0
let skipped = 0
let failed = 0
for (const r of results) {
  if (r?.ok) ok++
  else if (r?.skipped) skipped++
  else failed++
}

console.log(`\n\nDone — ok=${ok} skipped=${skipped} failed=${failed}`)
