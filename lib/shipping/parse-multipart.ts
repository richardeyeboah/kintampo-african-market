type MultipartPart = {
  name?: string
  contentType?: string
  body: Buffer
}

function parseMultipartParts(contentType: string, buffer: Buffer): MultipartPart[] {
  const boundaryMatch = contentType.match(/boundary=([^;\s"]+|"(?:[^"]+)")/i)
  if (!boundaryMatch) {
    throw new Error('USPS label response was not multipart.')
  }
  const boundary = boundaryMatch[1]!.replace(/^"|"$/g, '')
  const delimiter = `--${boundary}`
  const raw = buffer.toString('latin1')
  const segments = raw.split(delimiter).slice(1, -1)
  const parts: MultipartPart[] = []

  for (const segment of segments) {
    const chunk = segment.replace(/^\r\n/, '').replace(/\r\n$/, '')
    const headerEnd = chunk.indexOf('\r\n\r\n')
    if (headerEnd === -1) continue
    const headerBlock = chunk.slice(0, headerEnd)
    const bodyLatin1 = chunk.slice(headerEnd + 4)
    const nameMatch = headerBlock.match(/name="([^"]+)"/i)
    const typeMatch = headerBlock.match(/content-type:\s*([^\r\n]+)/i)
    parts.push({
      name: nameMatch?.[1],
      contentType: typeMatch?.[1]?.trim().toLowerCase(),
      body: Buffer.from(bodyLatin1, 'latin1'),
    })
  }

  return parts
}

export function parseUspsLabelMultipart(
  contentType: string,
  buffer: Buffer
): { metadata: Record<string, unknown>; pdf: Buffer } {
  const parts = parseMultipartParts(contentType, buffer)
  const metaPart = parts.find((p) => p.name === 'labelMetadata' || p.contentType?.includes('json'))
  const pdfPart = parts.find(
    (p) => p.name === 'labelImage' || p.contentType?.includes('pdf') || p.contentType?.includes('octet-stream')
  )

  if (!metaPart?.body.length) {
    throw new Error('USPS label response missing metadata.')
  }
  if (!pdfPart?.body.length) {
    throw new Error('USPS label response missing PDF.')
  }

  const metadata = JSON.parse(metaPart.body.toString('utf8')) as Record<string, unknown>
  return { metadata, pdf: pdfPart.body }
}
