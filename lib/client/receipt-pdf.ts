/**
 * Minimal multi-page PDF writer for customer receipts.
 *
 * The label writer in `share-label-pdf.ts` targets a single 4×6 sticker with
 * one bold font and no pagination, which truncates any receipt longer than a
 * few lines. This builds letter-size pages with regular and bold Helvetica,
 * greedy word wrapping, and page breaks.
 */

export type ReceiptPdfLine = {
  text: string
  bold?: boolean
  size?: number
  /** Extra space above this line, in points. */
  spaceBefore?: number
}

const PAGE_W = 612 // 8.5in
const PAGE_H = 792 // 11in
const MARGIN = 54 // 0.75in
const BODY_W = PAGE_W - MARGIN * 2

/** Helvetica averages just under half the point size per character. */
const CHAR_W_RATIO = 0.52

function escapePdfText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function sanitize(s: string): string {
  // WinAnsi-safe: replace typographic characters the base font cannot show.
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00d7/g, 'x')
    .replace(/\u2022/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
}

function wrap(text: string, size: number): string[] {
  const maxChars = Math.max(8, Math.floor(BODY_W / (size * CHAR_W_RATIO)))
  if (text.length <= maxChars) return [text]

  const words = text.split(/\s+/)
  const out: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }
    if (current) out.push(current)
    // A single word longer than the line gets hard-split.
    let rest = word
    while (rest.length > maxChars) {
      out.push(rest.slice(0, maxChars))
      rest = rest.slice(maxChars)
    }
    current = rest
  }
  if (current) out.push(current)
  return out
}

type PlacedLine = { text: string; bold: boolean; size: number; leading: number }

function paginate(lines: ReceiptPdfLine[]): PlacedLine[][] {
  const pages: PlacedLine[][] = []
  let page: PlacedLine[] = []
  let y = PAGE_H - MARGIN

  for (const raw of lines) {
    const size = raw.size ?? 10.5
    const bold = raw.bold ?? false
    const leading = Math.round(size * 1.45)
    const segments = wrap(sanitize(raw.text), size)

    segments.forEach((segment, index) => {
      const spaceBefore = index === 0 ? (raw.spaceBefore ?? 0) : 0
      const advance = leading + spaceBefore
      if (y - advance < MARGIN) {
        pages.push(page)
        page = []
        y = PAGE_H - MARGIN
      }
      y -= advance
      page.push({ text: segment, bold, size, leading: advance })
    })
  }

  if (page.length) pages.push(page)
  return pages.length ? pages : [[]]
}

function contentStream(page: PlacedLine[]): string {
  const parts: string[] = ['BT', `1 0 0 1 ${MARGIN} ${PAGE_H - MARGIN} Tm`]
  page.forEach((line) => {
    parts.push(`${line.leading} TL`)
    parts.push('T*')
    parts.push(`/${line.bold ? 'F2' : 'F1'} ${line.size} Tf`)
    parts.push(`(${escapePdfText(line.text)}) Tj`)
  })
  parts.push('ET')
  return parts.join('\n')
}

export function buildReceiptPdfBlob(lines: ReceiptPdfLine[]): Blob {
  const pages = paginate(lines)
  const enc = (s: string) => new TextEncoder().encode(s)

  // 1 catalog, 2 pages tree, 3 regular font, 4 bold font,
  // then a page object + content object per page.
  const pageObjNum = (i: number) => 5 + i * 2
  const contentObjNum = (i: number) => 6 + i * 2

  const objects: string[] = []
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pages
      .map((_, i) => `${pageObjNum(i)} 0 R`)
      .join(' ')}] /Count ${pages.length} >>\nendobj\n`
  )
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n'
  )
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n'
  )

  pages.forEach((page, i) => {
    objects.push(
      `${pageObjNum(i)} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum(i)} 0 R >>\nendobj\n`
    )
    const content = contentStream(page)
    objects.push(
      `${contentObjNum(i)} 0 obj\n<< /Length ${enc(content).length} >>\nstream\n${content}\nendstream\nendobj\n`
    )
  })

  const header = '%PDF-1.4\n'
  const parts: Uint8Array[] = [enc(header)]
  const offsets: number[] = [0]
  let offset = enc(header).length
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
  let cursor = 0
  for (const part of parts) {
    out.set(part, cursor)
    cursor += part.length
  }
  // Copy into a fresh buffer so the Blob never aliases a detached view.
  return new Blob([out.slice()], { type: 'application/pdf' })
}

export function downloadReceiptPdf(lines: ReceiptPdfLine[], filename: string) {
  const name = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
  const url = URL.createObjectURL(buildReceiptPdfBlob(lines))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
