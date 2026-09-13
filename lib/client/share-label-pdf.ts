/**
 * Share label PDFs with FlashLabel Pro.
 * FlashLabel on Android expects a public https PDF link ("no available pdf link"
 * means it did not receive a fetchable .pdf URL).
 */

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException
    ? err.name === 'AbortError'
    : err instanceof Error && err.name === 'AbortError'
}

export function asPdfFile(blob: Blob, filename: string): File {
  const name = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
  return new File([blob], name, { type: 'application/pdf' })
}

function bytesToPdfBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy], { type: 'application/pdf' })
}

export async function pdfFileFromUrl(url: string, filename: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load label PDF.')
  return asPdfFile(await res.blob(), filename)
}

export async function pdfFileFromBase64(base64: string, filename: string): Promise<File> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return asPdfFile(bytesToPdfBlob(bytes), filename)
}

export function isPublicPdfUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && /\.pdf(\?|$)/i.test(u.pathname + u.search)
  } catch {
    return false
  }
}

/**
 * Prefer sharing a public https://…pdf URL (FlashLabel Pro).
 * Fall back to sharing the file bytes.
 */
export async function sharePdfWithFlashLabel(opts: {
  file: File
  publicUrl?: string | null
}): Promise<'shared-url' | 'shared-file' | 'unsupported'> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unsupported'
  }

  const publicUrl = (opts.publicUrl ?? '').trim()
  const canShareUrl =
    publicUrl.startsWith('https://') &&
    (/\.pdf(\?|$)/i.test(publicUrl) || publicUrl.toLowerCase().includes('/pdf') || publicUrl.includes('pdf'))
  if (canShareUrl) {
    try {
      const urlPayload = { url: publicUrl, title: opts.file.name }
      if (typeof navigator.canShare !== 'function' || navigator.canShare(urlPayload)) {
        await navigator.share(urlPayload)
        return 'shared-url'
      }
    } catch (err) {
      if (isAbortError(err)) return 'shared-url'
      // fall through to file share
    }
  }

  const filePayload = { files: [opts.file] }
  if (typeof navigator.canShare === 'function' && !navigator.canShare(filePayload)) {
    return 'unsupported'
  }
  try {
    await navigator.share(filePayload)
    return 'shared-file'
  } catch (err) {
    if (isAbortError(err)) return 'shared-file'
    throw err
  }
}

export function downloadPdfFile(file: File) {
  // Guard: never download an image disguised as a PDF
  const name = file.name.toLowerCase().endsWith('.pdf') ? file.name : `${file.name}.pdf`
  const pdfFile =
    file.type === 'application/pdf' ? file : new File([file], name, { type: 'application/pdf' })

  const url = URL.createObjectURL(pdfFile)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  a.type = 'application/pdf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Build a real text PDF (not an image) — FlashLabel-safe. */
export function buildTextLabelPdfFile(
  lines: string[],
  filename: string,
  opts?: { pageW?: number; pageH?: number }
): File {
  const pageW = opts?.pageW ?? 288 // 4"
  const pageH = opts?.pageH ?? 432 // 6"
  const enc = (s: string) => new TextEncoder().encode(s)

  // Escape PDF string literals
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

  const contentLines: string[] = ['BT', '/F1 14 Tf', '1 0 0 1 36 390 Tm', '18 TL']
  lines.forEach((line, i) => {
    if (i === 0) contentLines.push(`(${esc(line)}) Tj`)
    else contentLines.push(`T* (${esc(line)}) Tj`)
  })
  contentLines.push('ET')
  const content = contentLines.join('\n')

  const objects: string[] = []
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  )
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n')
  objects.push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)

  const header = '%PDF-1.4\n'
  const parts: Uint8Array[] = [enc(header)]
  const offsets = [0]
  let offset = header.length
  for (const obj of objects) {
    offsets.push(offset)
    const bytes = enc(obj)
    parts.push(bytes)
    offset += bytes.length
  }

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`
  parts.push(enc(xref))

  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return asPdfFile(bytesToPdfBlob(out), filename)
}

export function canSharePdfFiles(): boolean {
  try {
    const probe = new File([new Blob(['%PDF-1.4'], { type: 'application/pdf' })], 'probe.pdf', {
      type: 'application/pdf',
    })
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      (typeof navigator.canShare !== 'function' ||
        navigator.canShare({ files: [probe] }) ||
        navigator.canShare({ url: 'https://example.com/label.pdf' }))
    )
  } catch {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  }
}

export function jpegBytesToPdf(jpeg: Uint8Array, imgW: number, imgH: number): Uint8Array {
  const pageW = 288
  const pageH = 432
  const enc = (s: string) => new TextEncoder().encode(s)

  const objects: Uint8Array[] = []
  const add = (body: string | Uint8Array) => {
    objects.push(typeof body === 'string' ? enc(body) : body)
  }

  add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')
  add(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  )

  const imgHeader = enc(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`
  )
  const imgFooter = enc('\nendstream\nendobj\n')
  const imgObj = new Uint8Array(imgHeader.length + jpeg.length + imgFooter.length)
  imgObj.set(imgHeader, 0)
  imgObj.set(jpeg, imgHeader.length)
  imgObj.set(imgFooter, imgHeader.length + jpeg.length)
  add(imgObj)

  const content = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`
  add(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)

  const header = enc('%PDF-1.4\n')
  const parts: Uint8Array[] = [header]
  const offsets = [0]
  let offset = header.length
  for (const obj of objects) {
    offsets.push(offset)
    parts.push(obj)
    offset += obj.length
  }

  const xrefStart = offset
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  parts.push(enc(xref))

  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

export async function canvasToPdfFile(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not export label image.'))),
      'image/jpeg',
      0.92
    )
  })
  const jpeg = new Uint8Array(await blob.arrayBuffer())
  const pdf = jpegBytesToPdf(jpeg, canvas.width, canvas.height)
  return asPdfFile(bytesToPdfBlob(pdf), filename)
}

/** Upload a client-built PDF so FlashLabel can open a public https PDF link. */
export async function uploadPdfForShare(
  orderId: string,
  file: File,
  kind: 'label' | 'address-slip' | 'pickup-ticket' = 'label'
): Promise<string> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)

  const res = await fetch(`/api/admin/orders/${orderId}/shipping/upload-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64: base64, filename: file.name, kind }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || typeof data.publicUrl !== 'string') {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not upload PDF.')
  }
  return data.publicUrl
}
