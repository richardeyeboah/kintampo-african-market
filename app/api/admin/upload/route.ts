import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { assertSameOrigin } from '@/lib/security/same-origin'

const BUCKET = 'product-images'

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

/** Below the ~4.5 MB serverless body cap. */
const MAX_BYTES = 4 * 1024 * 1024

const EXT_FOR_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function detectMimeFromBytes(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif'
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }

  // HEIC/AVIF — browser form should already convert; reject clearly if not.
  const header = String.fromCharCode(...bytes.slice(0, Math.min(bytes.length, 64)))
  const ftypAt = header.indexOf('ftyp')
  if (ftypAt >= 0) {
    const brands = header.slice(ftypAt + 4)
    if (/heic|heix|heim|heis|hevc|hevx|heif|avif|avis|mif1|msf1/i.test(brands)) {
      return 'heic-or-avif'
    }
  }

  return null
}

async function ensureProductImagesBucket(): Promise<string | null> {
  const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets()
  if (listErr) {
    return `Could not reach storage: ${listErr.message}`
  }
  if (buckets?.some((b) => b.name === BUCKET)) return null

  const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  })
  if (createErr && !/already exists|duplicate/i.test(createErr.message)) {
    return `Storage bucket missing (${createErr.message}). In Supabase → Storage, create a public bucket named "${BUCKET}".`
  }
  return null
}

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            'Image storage is not configured (missing Supabase URL or service role key). Check Vercel env vars.',
        },
        { status: 503 }
      )
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json(
        {
          error:
            'Photo was too large for the server to read. Use a smaller JPEG/PNG (under ~3 MB).',
        },
        { status: 413 }
      )
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.type && !ALLOWED_MIME.has(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only PNG, JPEG, WebP, or GIF images are allowed.' },
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
    const headerBytes = new Uint8Array(rawBuffer.slice(0, Math.min(rawBuffer.length, 64)))
    const detectedMime = detectMimeFromBytes(headerBytes)

    if (detectedMime === 'heic-or-avif') {
      return NextResponse.json(
        {
          error:
            'HEIC photos need to be JPEG/PNG. On iPhone: Settings → Camera → Formats → Most Compatible, then retake — or export as JPEG.',
        },
        { status: 415 }
      )
    }

    if (!detectedMime || !ALLOWED_MIME.has(detectedMime)) {
      return NextResponse.json(
        { error: 'That file is not a PNG, JPEG, WebP, or GIF photo.' },
        { status: 415 }
      )
    }

    const ext = EXT_FOR_MIME[detectedMime]
    const baseName =
      (file.name || 'upload')
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9\-_]/g, '-')
        .slice(0, 80) || 'upload'
    const fileName = `${Date.now()}-${baseName}.${ext}`

    const bucketErr = await ensureProductImagesBucket()
    if (bucketErr) {
      return NextResponse.json({ error: bucketErr }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin.storage.from(BUCKET).upload(fileName, rawBuffer, {
      contentType: detectedMime,
      upsert: false,
    })

    if (error) {
      return NextResponse.json({ error: `Storage rejected the photo: ${error.message}` }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.'
    console.error('Upload error:', err)
    if (/Missing NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return NextResponse.json(
        { error: 'Image storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY in Vercel.' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      {
        error:
          message.startsWith('Storage') || message.includes('bucket')
            ? message
            : 'Upload failed. Try a JPEG under 3 MB.',
      },
      { status: 500 }
    )
  }
}
