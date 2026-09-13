import type { Product } from '@/types'

export type CountrySlug = 'ghana' | 'nigeria' | 'caribbean' | 'west-africa' | 'other'

export type StockBand = 'out' | 'low' | 'in'

export type ListingBadge = { label: string; variant: 'accent' | 'gold' | 'muted' }

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 2147483647
  }
  return Math.abs(h)
}

/** First size/weight line from name or description (e.g. "16 oz", "3 yards"). */
export function extractSizeLine(name: string, description: string | null): string | null {
  const text = `${name} ${description ?? ''}`
  const m =
    text.match(/\b(\d+(?:\.\d+)?)\s*(oz|lb|lbs|g|kg|ml|mL|L|l|yards?|yard)\b/i) ||
    text.match(/\b(\d+(?:\.\d+)?)\s*[-]?\s*(yard|yards)\b/i)
  if (m) {
    const u = m[2].toLowerCase()
    const unit = u === 'lbs' ? 'lb' : u
    return `${m[1]} ${unit}`
  }
  const pack = text.match(/\b(\d+)\s*[- ]?\s*(pack|ct|count|pcs)\b/i)
  if (pack) return `${pack[1]}-${pack[2].toLowerCase()}`
  return null
}

export function deriveCountry(product: Product): { slug: CountrySlug; label: string | null } {
  const text = `${product.name} ${product.description ?? ''}`.toLowerCase()
  if (/\bghana|ghanaian\b/.test(text)) return { slug: 'ghana', label: 'Ghana' }
  if (/\bnigeria|nigerian\b/.test(text)) return { slug: 'nigeria', label: 'Nigeria' }
  if (/\bcaribbean\b/.test(text)) return { slug: 'caribbean', label: 'Caribbean' }
  if (/\bwest africa|west african\b/.test(text)) return { slug: 'west-africa', label: 'West Africa' }

  const h = hashId(product.id) % 10
  if (h === 2 || h === 3) return { slug: 'ghana', label: 'Ghana' }
  if (h === 4 || h === 5) return { slug: 'nigeria', label: 'Nigeria' }
  return { slug: 'other', label: null }
}

export function deriveStockBand(product: Product): StockBand {
  if (!product.in_stock) return 'out'
  return hashId(product.id) % 6 === 0 ? 'low' : 'in'
}

export function deriveBadges(product: Product): ListingBadge[] {
  const h = hashId(product.id)
  const out: ListingBadge[] = []
  if (h % 11 === 0) out.push({ label: 'Best Seller', variant: 'accent' })
  if (h % 9 === 0) out.push({ label: '20% Off', variant: 'gold' })
  if (h % 13 === 0) out.push({ label: 'Popular', variant: 'muted' })
  return out.slice(0, 2)
}

export type ListingMeta = {
  countrySlug: CountrySlug
  countryLabel: string | null
  stockBand: StockBand
  sizeLine: string | null
  badges: ListingBadge[]
}

export function getListingMeta(product: Product): ListingMeta {
  const { slug, label } = deriveCountry(product)
  return {
    countrySlug: slug,
    countryLabel: label,
    stockBand: deriveStockBand(product),
    sizeLine: extractSizeLine(product.name, product.description),
    badges: deriveBadges(product),
  }
}
