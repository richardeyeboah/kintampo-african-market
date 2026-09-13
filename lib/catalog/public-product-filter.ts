/**
 * Internal / checkout-test SKUs must never appear on the public catalog,
 * homepage, search, or sitemap — even if mistakenly left in_stock.
 */
export function isHiddenFromStorefront(product: {
  name?: string | null
  description?: string | null
}): boolean {
  const name = (product.name ?? '').toLowerCase()
  const desc = (product.description ?? '').toLowerCase()
  if (
    name.includes('payment test') ||
    name.includes('checkout test') ||
    name.includes('apple pay test') ||
    /^test item\b/.test(name) ||
    /\(\$0\.60\)/.test(name)
  ) {
    return true
  }
  if (desc.includes('live checkout test') && name.includes('test')) return true
  return false
}

export function filterStorefrontProducts<T extends { name?: string | null; description?: string | null }>(
  products: T[]
): T[] {
  return products.filter((p) => !isHiddenFromStorefront(p))
}
