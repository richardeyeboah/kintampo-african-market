/** Curated discovery rows — link to shop filters (aligned with live catalog). */
export const FEATURED_COLLECTIONS = [
  {
    id: 'fashion',
    title: 'Fashion & Fabric',
    subtitle: 'Prints, lace, ready-to-wear & hair',
    emoji: '🧵',
    href: '/fashion',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21067fa?w=960&h=960&fit=crop&q=90&auto=format',
  },
  {
    id: 'staples',
    title: 'Yam, Fufu & Pantry',
    subtitle: 'Flours, gari, banku, rice & African staples',
    emoji: '🍠',
    href: '/shop?q=fufu',
    image: '/images/categories/flours-rice.jpg',
  },
  {
    id: 'produce',
    title: 'Fresh Market',
    subtitle: 'Yam, plantain, greens & produce',
    emoji: '🥬',
    href: '/shop?q=yam',
    image: '/images/categories/fresh-produce.jpg',
  },
  {
    id: 'beverages',
    title: 'Drinks & Beverages',
    subtitle: 'Malt, beer, juices & African favorites',
    emoji: '🥤',
    href: '/shop?category=Beverages',
    image: '/images/categories/beverages.png',
  },
  {
    id: 'beauty',
    title: 'Beauty & Body Care',
    subtitle: 'Lotions, soaps & skincare',
    emoji: '✨',
    href: '/shop?category=Cosmetics',
    image: '/images/categories/cosmetics.jpg',
  },
] as const
