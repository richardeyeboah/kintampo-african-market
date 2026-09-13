/** Fallback store photos when a recipe has no image. */
const RECIPE_FALLBACK_IMAGE: Record<string, string> = {
  'egusi-soup': '/images/store/pantry-shelf.png',
  'jollof-rice': '/images/categories/flours-rice.jpg',
  'plantain-fufu-night': '/images/categories/fresh-produce.jpg',
}

const DEFAULT_FALLBACK = '/images/store/pantry-shelf.png'

export function recipeFallbackImage(slug: string): string {
  return RECIPE_FALLBACK_IMAGE[slug] ?? DEFAULT_FALLBACK
}
