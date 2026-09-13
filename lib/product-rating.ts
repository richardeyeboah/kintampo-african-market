/** Deterministic “rating” for display when DB has no reviews (0–5). */
export function pseudoRatingFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 9973
  }
  const frac = (h % 10) / 10
  return Math.round((4.2 + frac) * 10) / 10
}
