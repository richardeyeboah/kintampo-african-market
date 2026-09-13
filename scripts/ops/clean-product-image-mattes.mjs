/**
 * Replaces dark, edge-connected matte pixels left by segmentation with white.
 * Product pixels are preserved because the flood fill only begins at the image edge.
 *
 * Usage: node --env-file=.env.local scripts/clean-product-image-mattes.mjs
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!url || !key) throw new Error('Missing Supabase environment variables')

const sb = createClient(url, key)
const BUCKET = 'product-images'
const DARK_THRESHOLD = 105

function isDark(data, pixel) {
  const offset = pixel * 4
  return (
    data[offset] <= DARK_THRESHOLD &&
    data[offset + 1] <= DARK_THRESHOLD &&
    data[offset + 2] <= DARK_THRESHOLD
  )
}

async function removeEdgeMatte(input) {
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
    if (seen[pixel] || !isDark(data, pixel)) return
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
    const offset = pixel * 4
    data[offset] = 255
    data[offset + 1] = 255
    data[offset + 2] = 255
    data[offset + 3] = 255
  }

  const output = await sharp(data, { raw: info })
    .removeAlpha()
    .jpeg({ quality: 91, mozjpeg: true })
    .toBuffer()

  return Buffer.from(output)
}

const { data: products, error } = await sb
  .from('products')
  .select('id,name,image_url')
  .not('image_url', 'is', null)

if (error) throw error

let cleaned = 0
for (const [index, product] of (products ?? []).entries()) {
  const response = await fetch(product.image_url.split('?')[0])
  if (!response.ok) {
    console.log(`[${index + 1}] skip ${product.name}: HTTP ${response.status}`)
    continue
  }

  const input = Buffer.from(await response.arrayBuffer())
  const output = await removeEdgeMatte(input)
  const path = `${product.id}.jpg`
  const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, output, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: true,
  })
  if (uploadError) throw uploadError

  const { data: publicData } = sb.storage.from(BUCKET).getPublicUrl(path)
  const imageUrl = `${publicData.publicUrl}?v=${Date.now()}`
  const { error: updateError } = await sb
    .from('products')
    .update({ image_url: imageUrl })
    .eq('id', product.id)
  if (updateError) throw updateError

  cleaned++
  console.log(`[${index + 1}/${products.length}] ${product.name}`)
}

console.log(`Cleaned ${cleaned} product image mattes.`)
