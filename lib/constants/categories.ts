/**
 * Tax: most categories are grocery-exempt.
 * Taxable: Alcohol, Cosmetics, Non food, fashion & hair (see lib/tax/sales-tax.ts).
 */
export const PRODUCT_CATEGORIES = [
  'African Prints',
  'Alcohol',
  'Beverages',
  'Bread',
  'Brocade',
  'Canned',
  'Caribbean product',
  'Cosmetics',
  'Dairy And Tea',
  'Flours & Rice',
  'Fresh Produce',
  'Frozen foods',
  'Hair & Braiding',
  'Headtie',
  'Kente',
  'Lace',
  'Meat and Seafood',
  'Motherland',
  'Non food',
  'Ready-to-wear',
  'Snack',
  'Spices',
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

/**
 * Fashion type categories — browse tiles / filters on `/fashion`.
 * Order matches storefront strip (type first, then RTW / hair).
 */
export const FASHION_CATEGORIES = [
  'African Prints',
  'Lace',
  'Headtie',
  'Kente',
  'Brocade',
  'Ready-to-wear',
  'Hair & Braiding',
] as const

export type FashionCategory = (typeof FASHION_CATEGORIES)[number]

/** Legacy shop labels still treated as fashion (e.g. old “Wax” rows). */
export const LEGACY_FASHION_CATEGORIES = ['Wax'] as const

/** Brand / mill lines for fabric admin + `/fashion` brand filter. */
export const FASHION_BRAND_LINES = [
  'Hollandais',
  'Vlisco-type',
  'Supreme-style',
  'Other wax',
  'Unbranded',
] as const

export type FashionBrandLine = (typeof FASHION_BRAND_LINES)[number]

/** Storefront department hubs (same cart, scoped browse). */
export const SHOP_DEPTS = ['fashion'] as const
export type ShopDept = (typeof SHOP_DEPTS)[number]

export function isFashionCategory(category: string): boolean {
  return (
    (FASHION_CATEGORIES as readonly string[]).includes(category) ||
    (LEGACY_FASHION_CATEGORIES as readonly string[]).includes(category)
  )
}

/** Categories used when scoping product queries to the fashion department. */
export function fashionQueryCategories(): readonly string[] {
  return [...FASHION_CATEGORIES, ...LEGACY_FASHION_CATEGORIES]
}

export function parseShopDept(value: string | null | undefined): ShopDept | null {
  if (value === 'fashion') return 'fashion'
  return null
}

export function categoriesForDept(dept: ShopDept | null): readonly string[] | null {
  if (dept === 'fashion') return FASHION_CATEGORIES
  return null
}

/** Short labels for category chips on home / shop. */
export const CATEGORY_ICONS: Record<string, string> = {
  Alcohol: '🍷',
  Beverages: '🥤',
  Bread: '🍞',
  Spices: '🌶️',
  'Flours & Rice': '🌾',
  'Fresh Produce': '🥬',
  'Frozen foods': '🧊',
  'Meat and Seafood': '🐟',
  Snack: '🍿',
  'Dairy And Tea': '🫖',
  'African Prints': '🧵',
  Wax: '🧵',
  Lace: '👗',
  Headtie: '🧣',
  Kente: '🟨',
  Brocade: '✨',
  'Ready-to-wear': '🧥',
  'Hair & Braiding': '💇',
}
