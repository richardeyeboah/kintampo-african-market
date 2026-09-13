import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { assertSameOrigin } from '@/lib/security/same-origin'

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  // iPhone camera default + AVIF — both converted to JPEG below.
  'image/heic',
  'image/heif',
  'image/avif',
])
/** Below the ~4.5 MB serverless body cap, so oversized files fail with our message. */
const MAX_BYTES = 4 * 1024 * 1024

// ---------------------------------------------------------------------------
// Magic-byte signatures — validate actual file content, not just browser MIME.
// A malicious client could send Content-Type: image/png with a script payload;
// we guard against this by inspecting the raw bytes.
// ---------------------------------------------------------------------------
function detectMimeFromBytes(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  // GIF: 47 49 46 38 (GIF8)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif'
  }
  // WebP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp'
  }

  // HEIC / HEIF / AVIF: ISO-BMFF box — bytes 4-7 = "ftyp", brand at 8-11.
  // Compatible brands can sit after the major brand; scan the first 32 bytes.
  const header = String.fromCharCode(...bytes.slice(0, Math.min(bytes.length, 32)))
  const ftypAt = header.indexOf('ftyp')
  if (ftypAt >= 0) {
    const brands = header.slice(ftypAt + 4)
    if (/heic|heix|heim|heis|hevc|hevx|heif/i.test(brands)) return 'image/heic'
    if (/avif|avis/i.test(brands)) return 'image/avif'
    if (/mif1|msf1/i.test(brands)) return 'image/heif'
  }

  return null
}

class UnsupportedImageError extends Error {}

/** Resize / re-encode so storefront can serve originals without multi‑MB phone photos. */
async function prepareImageUpload(
  buffer: Buffer,
  detectedMime: string
): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  try {
    // GIF: keep as-is (sharp would flatten animation).
    if (detectedMime === 'image/gif') {
      return { buffer, mime: detectedMime, ext: 'gif' }
    }

    const image = sharp(buffer, { failOn: 'none' }).rotate()
    const meta = await image.metadata()
    const maxEdge = 1600
    const needsResize =
      (meta.width != null && meta.width > maxEdge) ||
      (meta.height != null && meta.height > maxEdge)

    let pipeline = image
    if (needsResize) {
      pipeline = pipeline.resize({
        width: maxEdge,
        height: maxEdge,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    if (detectedMime === 'image/png' && meta.hasAlpha) {
      const out = await pipeline.png({ compressionLevel: 8 }).toBuffer()
      return { buffer: out, mime: 'image/png', ext: 'png' }
    }

    const out = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    return { buffer: out, mime: 'image/jpeg', ext: 'jpg' }
  } catch {
    // HEIC / AVIF have to be converted — storing the original would serve a file
    // no browser (or a `.bin` object) can render.
    if (
      detectedMime === 'image/heic' ||
      detectedMime === 'image/heif' ||
      detectedMime === 'image/avif'
    ) {
      throw new UnsupportedImageError(
        'This photo could not be converted. On an iPhone: Settings → Camera → Formats → Most Compatible, then retake — or export as JPEG first.'
      )
    }
    throw new UnsupportedImageError('That photo could not be processed. Try a JPEG or PNG.')
  }
}

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // Fast path on the browser-reported type. Phones often send an empty or
    // vendor-specific type for HEIC, so only reject types we know are wrong;
    // magic bytes below are the real gate.
    if (file.type && !ALLOWED_MIME.has(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only PNG, JPEG, WebP, GIF, or HEIC images are allowed.' },
        { status: 415 }
      )
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'File is empty.' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Photo is over 4 MB. Pick a smaller photo or let the form resize it.' },
        { status: 413 }
      )
    }

    const bytes = await file.arrayBuffer()
    const rawBuffer = Buffer.from(bytes)
    const headerBytes = new Uint8Array(rawBuffer.slice(0, 12))

    // Validate actual file content via magic bytes — prevents polyglot uploads.
    const detectedMime = detectMimeFromBytes(headerBytes)
    if (!detectedMime || !ALLOWED_MIME.has(detectedMime)) {
      return NextResponse.json(
        { error: 'That file is not a PNG, JPEG, WebP, GIF, or HEIC photo.' },
        { status: 415 }
      )
    }

    const prepared = await prepareImageUpload(rawBuffer, detectedMime)
    const baseName = (file.name || 'upload')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .slice(0, 80) || 'upload'
    const fileName = `${Date.now()}-${baseName}.${prepared.ext}`

    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, prepared.buffer, {
        contentType: prepared.mime,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: `Storage rejected the photo: ${error.message}` }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('product-images').getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    if (err instanceof UnsupportedImageError) {
      return NextResponse.json({ error: err.message }, { status: 415 })
    }
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
