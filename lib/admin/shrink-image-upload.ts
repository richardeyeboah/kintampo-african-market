/**
 * Downscale photos in the browser before POSTing to /api/admin/upload.
 * Serverless request bodies are capped at ~4.5 MB, so a raw phone photo
 * (12 MP JPEG or HEIC) fails at the platform edge before our route runs.
 * Canvas re-encode also converts iPhone HEIC into JPEG on iOS Safari.
 */

const MAX_EDGE = 1600
const SHRINK_ABOVE_BYTES = 2 * 1024 * 1024

/** Hard ceiling for the POST body — below the serverless limit. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

const SERVER_READY = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

const HEIC_MESSAGE =
  'This iPhone HEIC photo could not be converted here. On the iPhone: Settings → Camera → Formats → Most Compatible, then retake — or export as JPEG first.'

export class ImagePrepareError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImagePrepareError'
  }
}

function looksHeic(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type)
}

function looksAvif(file: File): boolean {
  return /\.avif$/i.test(file.name) || file.type === 'image/avif'
}

async function decodeBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(file)
  }
}

export async function shrinkImageForUpload(file: File): Promise<File> {
  const heic = looksHeic(file)
  const avif = looksAvif(file)
  const emptyType = !file.type
  const isImage = file.type.startsWith('image/') || heic || avif || emptyType

  if (!isImage) return file
  // Animated GIFs would collapse to a single frame.
  if (file.type === 'image/gif') return file
  // Keep PNG alpha — the server path preserves it. Oversized PNGs fail with a size error.
  if (file.type === 'image/png' && !heic && !avif) return file

  const oversized = file.size > SHRINK_ABOVE_BYTES
  if (!oversized && !heic && !avif && !emptyType && SERVER_READY.has(file.type)) return file

  if (typeof window === 'undefined' || typeof createImageBitmap !== 'function') {
    if (heic || avif) throw new ImagePrepareError(HEIC_MESSAGE)
    return file
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await decodeBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      if (heic || avif) throw new ImagePrepareError(HEIC_MESSAGE)
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    )
    if (!blob) {
      if (heic || avif) throw new ImagePrepareError(HEIC_MESSAGE)
      return file
    }
    if (blob.size >= file.size && SERVER_READY.has(file.type) && !heic && !avif) return file

    const name = `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch (err) {
    if (err instanceof ImagePrepareError) throw err
    if (heic || avif) throw new ImagePrepareError(HEIC_MESSAGE)
    return file
  } finally {
    bitmap?.close()
  }
}
