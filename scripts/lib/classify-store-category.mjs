/**
 * Rule-based store category classifier (name + optional source categories).
 * Shared by reclassify-product-categories.mjs
 */

export const STORE_CATEGORIES = [
  'African Prints',
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
  'Sample',
]

/** Strong food signals — block Cosmetics when these match */
const FOOD_BLOCK = [
  'fufu',
  'yam',
  'plantain',
  'gari',
  'banku',
  'kenkey',
  'rice',
  'indomie',
  'noodle',
  'beans',
  'egusi',
  'peanut',
  'groundnut',
  'palm oil',
  'tomato paste',
  'mackerel',
  'sardine',
  'stockfish',
  'goat meat',
  'chicken',
  'beer',
  'malt',
  'guinness',
  'juice',
  'bread',
  'bun',
  'chip',
  'chin chin',
  'spice',
  'seasoning',
  'maggi',
  'onion',
  'okra',
  'spinach',
  'ugwu',
  'potato',
  'per kg',
  'per lb',
]

const SOURCE_CATEGORY_SCORES = {
  Alcohol: { Beverages: 8 },
  Beverages: { Beverages: 8 },
  'Beverages/Juices': { Beverages: 8 },
  Milk: { 'Dairy And Tea': 8 },
  Dairy: { 'Dairy And Tea': 8 },
  'Dairy Items': { 'Dairy And Tea': 8 },
  Breads: { Bread: 8 },
  'Fresh Bakery': { Bread: 8 },
  Bread: { Bread: 8 },
  Biscuits: { Snack: 7 },
  Cookies: { Snack: 7 },
  Crackers: { Snack: 7 },
  Bars: { Snack: 7 },
  'Cake & Cookies': { Snack: 7 },
  'Snacks Item': { Snack: 8 },
  Snack: { Snack: 8 },
  Pantry: { 'Flours & Rice': 6, Canned: 2 },
  Canned: { Canned: 8 },
  Vegetable: { 'Fresh Produce': 8 },
  'Green Vegetable': { 'Fresh Produce': 8 },
  'Root Vegetable': { 'Fresh Produce': 8 },
  Potato: { 'Fresh Produce': 10 },
  Fruit: { 'Fresh Produce': 8 },
  'Fresh Fruit': { 'Fresh Produce': 8 },
  'Exotic Fruits': { 'Fresh Produce': 8 },
  'Food Products': { 'Flours & Rice': 4, Canned: 2, Spices: 2 },
  Poultry: { 'Meat and Seafood': 8 },
  Seafood: { 'Meat and Seafood': 8 },
  Spices: { Spices: 8 },
  'Ointments, Hygiene, Medicine': { Cosmetics: 8 },
  'Home & Kitchen': { 'Non food': 7 },
  Household: { 'Non food': 6 },
  'Our Store': { Motherland: 3 },
  Culture: { Motherland: 5 },
  'Clothes & Fashion': { 'Ready-to-wear': 8, 'African Prints': 4 },
  'Caribbean product': { 'Caribbean product': 8 },
  Frozen: { 'Frozen foods': 8 },
  'Frozen foods': { 'Frozen foods': 8 },
  Sample: { Sample: 8 },
  'Cold-drinks': { Beverages: 7 },
}

/** Order matters: food staples before beauty */
const NAME_RULES = [
  {
    cat: 'Flours & Rice',
    words: [
      'fufu',
      'fufuf',
      'yam flour',
      'plantain flour',
      'plantain fufu',
      'cassava flour',
      'gari',
      'garri',
      'konkonte',
      'kokonte',
      'banku mix',
      'banku',
      'kenkey flour',
      'semolina',
      'rice',
      'jollof',
      'parboiled',
      'beans',
      'black eye',
      'egusi',
      'groundnut',
      'peanut butter',
      'peanut',
      'indomie',
      'noodle',
      'macaroni',
      'spaghetti',
      'couscous',
      'millet',
      'corn meal',
      'corn flour',
      'honeywell',
      'golden penny',
      'mhamsa',
      'tomato paste',
      'tasty tom',
      'tomato mix',
      'tom brown',
    ],
    weight: 12,
  },
  {
    cat: 'Fresh Produce',
    words: [
      'yam',
      'plantain',
      'okra',
      'spinach',
      'ugwu',
      'kontomire',
      'onion',
      'garlic',
      'ginger root',
      'ginger',
      'papaya',
      'potato',
      'tomato',
      'cucumber',
      'lettuce',
      'carrot',
      'cabbage',
      'mango',
      'banana',
      'apple',
      'orange',
      'lemon',
      'avocado',
      'pomegranate',
      'amaranthus',
      'coconut',
      ' per kg',
      ' per lb',
      'bunch',
    ],
    weight: 12,
  },
  {
    cat: 'Beverages',
    words: [
      'beer',
      'wine',
      'guinness',
      'star beer',
      'malta',
      'vimto',
      'juice',
      'drink',
      'soda',
      'fanta',
      'coca',
      'pepsi',
      'schweppes',
      'maltina',
      'malt pack',
      'zobo',
      'milo',
      'ovaltine',
      'cerelac',
      'bitters',
      'tonic',
      'whiskey',
      'vodka',
      'rum',
      'alcohol',
      'beverage',
    ],
    weight: 11,
  },
  {
    cat: 'Spices',
    words: [
      'spice',
      'seasoning',
      'pepper soup',
      'suya',
      'shito',
      'curry powder',
      'thyme',
      'maggi',
      'knorr',
      'bouillon',
      'palm oil',
      'palm soup',
      'groundnut oil',
      'carotina',
      'cooking oil',
      'vegetable oil',
      'olive oil',
      'sesame oil',
      'red oil',
      'ginger powder',
      'garlic powder',
    ],
    weight: 11,
  },
  {
    cat: 'Meat and Seafood',
    words: [
      'fish',
      'tilapia',
      'stockfish',
      'smoked fish',
      'kini fish',
      'shrimp',
      'prawn',
      'crab',
      'goat meat',
      'chicken',
      'turkey',
      'beef',
      'sausage',
      'snail',
      'dried snail',
      'mackerel',
      'sardine',
    ],
    weight: 11,
  },
  {
    cat: 'Canned',
    words: ['canned', 'corned beef', 'baked beans', 'tomato puree'],
    weight: 10,
  },
  {
    cat: 'Dairy And Tea',
    words: [
      'tea',
      'milk powder',
      'peak milk',
      'carnation',
      'evaporated milk',
      'condensed milk',
      'yogurt',
      'cheese',
      'butter',
      'margarine',
      'blue band',
      'milky mist',
      'konkonte',
      'kokonte',
    ],
    weight: 10,
  },
  {
    cat: 'Bread',
    words: ['bread', ' bun', 'roll', 'rusk', 'toastea', 'baguette', 'britannia'],
    weight: 10,
  },
  {
    cat: 'Snack',
    words: [
      'chip',
      'crisp',
      'cracker',
      'biscuit',
      'cookie',
      'snack',
      'chin chin',
      'plantain chip',
      'popcorn',
      'candy',
      'chocolate',
      'kinder',
      'belvita',
    ],
    weight: 10,
  },
  {
    cat: 'Frozen foods',
    words: ['frozen', 'ice cream'],
    weight: 10,
  },
  {
    cat: 'Caribbean product',
    words: ['jamaican', 'caribbean', 'ackee', 'scotch bonnet', 'jerk', 'callaloo'],
    weight: 10,
  },
  {
    cat: 'Cosmetics',
    words: [
      'lotion',
      'cream',
      'soap',
      'caro white',
      'carotone',
      'qei',
      'jaune',
      'lightening',
      'bleach',
      'cosmetic',
      'bath gel',
      'shower gel',
      'body gel',
      'body lotion',
      'shea butter',
      'shampoo',
      'conditioner',
      'shea butter',
      'pomade',
      'deodorant',
      'toothpaste',
      'dettol',
      'pepsodent',
      'irish spring',
      'body wash',
      'bathing gel',
      'shower milk',
      'ointment',
      'hydroquinone',
      'toning',
    ],
    weight: 9,
  },
  {
    cat: 'African Prints',
    words: [
      'ankara',
      'african print',
      'wax print',
      'wax',
      'hollandais',
      'print fabric',
      'yard fabric',
      'george wrapper',
      'george fabric',
    ],
    weight: 12,
  },
  {
    cat: 'Kente',
    words: ['kente cloth', 'kente fabric', 'kente', 'aso oke', 'aso-oke'],
    weight: 13,
  },
  {
    cat: 'Headtie',
    words: ['headtie', 'head tie', 'gele', 'headwrap', 'head wrap'],
    weight: 12,
  },
  {
    cat: 'Brocade',
    words: ['brocade', 'bazin', 'swiss voile', 'voile fabric', 'damask'],
    weight: 12,
  },
  {
    cat: 'Lace',
    words: ['lace fabric', 'french lace', 'guipure', 'voile lace', 'cord lace'],
    weight: 12,
  },
  {
    cat: 'Ready-to-wear',
    words: [
      'dress',
      'dashiki',
      'boubou',
      'kaftan',
      'agbada',
      'blouse',
      'skirt',
      'romper',
      'jumpsuit',
      'ready to wear',
      'ready-to-wear',
    ],
    weight: 11,
  },
  {
    cat: 'Hair & Braiding',
    words: [
      'braid',
      'braiding',
      'hair extension',
      'weave',
      'wig',
      'crochet hair',
      'kanekalon',
      'hair bundle',
      'edge control',
    ],
    weight: 12,
  },
  {
    cat: 'Non food',
    words: ['plastic drum', 'pot ', ' pan', 'utensil', 'plate', 'cup', 'florida water'],
    weight: 9,
  },
  {
    cat: 'Motherland',
    words: ['kente', 'chewing stick', 'kaawe', 'shile', 'authentic shile'],
    weight: 8,
  },
]

function norm(s) {
  return ` ${(s ?? '').toLowerCase()} `
}

/** Avoid substring false positives (e.g. rum in drum, palm in papaya, pepsi in pepsodent). */
function includesToken(haystack, token) {
  if (!token) return false
  if (token.includes(' ')) return haystack.includes(token)
  return haystack.includes(` ${token} `)
}

function hasFoodBlock(name) {
  return FOOD_BLOCK.some((w) => includesToken(name, w))
}

export function classifyStoreCategory(input) {
  const name = norm(input.name ?? '')
  const desc = norm(input.description ?? '')
  const sourceCats = input.sourceCategories ?? []

  const scores = Object.fromEntries(STORE_CATEGORIES.map((c) => [c, 0]))

  for (const src of sourceCats) {
    const mapped = SOURCE_CATEGORY_SCORES[src]
    if (mapped) {
      for (const [cat, pts] of Object.entries(mapped)) {
        scores[cat] += pts
      }
    } else {
      const lower = src.toLowerCase()
      if (lower.includes('beverage') || lower.includes('juice') || lower.includes('alcohol')) scores.Beverages += 4
      if (lower.includes('dairy') || lower.includes('milk')) scores['Dairy And Tea'] += 4
      if (lower.includes('bread') || lower.includes('bakery')) scores.Bread += 4
      if (lower.includes('snack') || lower.includes('biscuit') || lower.includes('cookie')) scores.Snack += 4
      if (lower.includes('vegetable') || lower.includes('fruit') || lower.includes('produce') || lower.includes('potato')) {
        scores['Fresh Produce'] += 5
      }
      if (lower.includes('spice') || lower.includes('herb')) scores.Spices += 4
      if (lower.includes('frozen')) scores['Frozen foods'] += 4
      if (lower.includes('meat') || lower.includes('seafood') || lower.includes('poultry') || lower.includes('fish')) {
        scores['Meat and Seafood'] += 4
      }
      if (lower.includes('cosmetic') || lower.includes('hygiene') || lower.includes('medicine') || lower.includes('ointment')) {
        scores.Cosmetics += 4
      }
      if (lower.includes('kitchen') || lower.includes('home') || lower.includes('household')) scores['Non food'] += 3
    }
  }

  for (const rule of NAME_RULES) {
    for (const w of rule.words) {
      if (includesToken(name, w)) {
        scores[rule.cat] += rule.weight
        break
      }
    }
  }

  if (desc.length > 30) {
    for (const rule of NAME_RULES) {
      for (const w of rule.words) {
        if (includesToken(desc, w)) {
          scores[rule.cat] += 2
          break
        }
      }
    }
  }

  if (hasFoodBlock(name)) {
    scores.Cosmetics = 0
  }

  if (includesToken(name, 'shea butter')) {
    scores['Dairy And Tea'] = 0
  }

  if (
    includesToken(name, 'lightening') ||
    includesToken(name, 'body lotion') ||
    includesToken(name, 'qei')
  ) {
    scores['Fresh Produce'] = 0
  }

  let best = 'Motherland'
  let bestScore = 0
  let reason = 'fallback:uncategorized'

  for (const cat of STORE_CATEGORIES) {
    if (scores[cat] > bestScore) {
      bestScore = scores[cat]
      best = cat
      reason = `score:${scores[cat]}`
    }
  }

  if (bestScore <= 0 && sourceCats.length > 0) {
    reason = `source_only:${sourceCats.join('|')}`
  }

  return { category: best, reason, scores, confident: bestScore > 0 }
}
