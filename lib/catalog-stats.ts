/** Human-readable in-stock count for hero, trust strip, etc. */
export function formatInStockCount(count: number): string {
  if (count <= 0) return 'Products in stock'
  return `${count.toLocaleString()} product${count === 1 ? '' : 's'} in stock`
}

export function formatInStockShort(count: number): string {
  if (count <= 0) return 'In stock'
  return `${count.toLocaleString()} in stock`
}
