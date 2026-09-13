// Remote fallbacks: 960px source for sharp tiles on retina.
const U = (cdnId: string) =>
  `https://images.unsplash.com/${cdnId}?w=960&h=960&fit=crop&q=90&auto=format`

const LOCAL = (filename: string) => `/images/categories/${filename}`

/**
 * Explicit public/ assets — do NOT probe the filesystem at runtime.
 * On Vercel, `public/` is not always readable via fs in server components,
 * so existsSync wrongly fell back to Unsplash and hid uploaded photos.
 */
const CATEGORY_LOCAL: Partial<Record<string, string>> = {
  Beverages: LOCAL('beverages.png'),
  Bread: LOCAL('bread.png'),
  Canned: LOCAL('canned.jpg'),
  'Caribbean product': LOCAL('caribbean-product.jpg'),
  Cosmetics: LOCAL('cosmetics.jpg'),
  'Dairy And Tea': LOCAL('dairy-and-tea.png'),
  'Flours & Rice': LOCAL('flours-rice.jpg'),
  'Fresh Produce': LOCAL('fresh-produce.jpg'),
  'Frozen foods': LOCAL('frozen-foods.jpg'),
  'Meat and Seafood': LOCAL('meat-seafood.jpg'),
  Motherland: LOCAL('motherland.png'),
  'Non food': LOCAL('non-food.png'),
  Snack: LOCAL('snack.jpg'),
  Spices: LOCAL('spices.jpg'),
  'African Prints': LOCAL('african-prints.jpg'),
  Wax: LOCAL('african-prints.jpg'),
}

/** Remote fallbacks when no local asset is listed above. Omit known-dead Unsplash IDs. */
const CATEGORY_REMOTE: Record<string, string> = {
  Alcohol: U('photo-1510812431401-41d2bd2722f3'),
  Beverages: U('photo-1755752919046-a6543db419cc'),
  Bread: U('photo-1725297952102-ab28892a31ab'),
  Brocade: U('photo-1558171813-4c088753af8f'),
  Canned: U('photo-1601598704991-eef6114775e0'),
  'Caribbean product': U('photo-1617631716600-6a454b430367'),
  Cosmetics: U('photo-1556228720-195a672e8a03'),
  'Dairy And Tea': U('photo-1552593050-477020c5af3f'),
  'Flours & Rice': U('photo-1686820740687-426a7b9b2043'),
  'Fresh Produce': U('photo-1607349913338-fca6f7fc42d0'),
  'Frozen foods': U('photo-1601599967100-f16100982063'),
  Headtie: U('photo-1594938298603-c8148c4dae35'),
  Kente: U('photo-1610030469983-98e550d6193c'),
  Lace: U('photo-1594633313593-bab3825d0caf'),
  'Meat and Seafood': U('photo-1754587489041-9fc8301f4c98'),
  Motherland: U('photo-1740439225991-ab26e8f6da9d'),
  'Non food': U('photo-1631856954655-966f97d809de'),
  'Ready-to-wear': U('photo-1490481651871-ab68de25d43d'),
  Snack: U('photo-1604719312497-c6fc196f51ec'),
  Spices: U('photo-1596040033229-a9821ebd058d'),
}

/** @deprecated Use getCategoryImage — kept for any direct imports */
export const CATEGORY_IMAGES: Record<string, string> = { ...CATEGORY_REMOTE }

function resolveCategoryImage(category: string): string | undefined {
  return CATEGORY_LOCAL[category] ?? CATEGORY_REMOTE[category]
}

export function getCategoryImage(category: string): string | undefined {
  return resolveCategoryImage(category)
}

export function getBeveragesCollectionImage(): string {
  return resolveCategoryImage('Beverages') ?? CATEGORY_REMOTE.Beverages
}

/** Featured “Beauty & Body Care” tile — same photo as Cosmetics category. */
export function getCosmeticsCollectionImage(): string {
  return resolveCategoryImage('Cosmetics') ?? CATEGORY_REMOTE.Cosmetics
}
