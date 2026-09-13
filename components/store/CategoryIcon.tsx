import {
  Box,
  Coffee,
  Fish,
  Flame,
  Leaf,
  Package,
  Scissors,
  Shirt,
  ShoppingBasket,
  Snowflake,
  Sparkles,
  Layers,
  Wheat,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  'African Prints': Layers,
  Wax: Layers,
  Alcohol: Wine,
  Beverages: Coffee,
  Bread: Wheat,
  Brocade: Sparkles,
  Canned: Package,
  'Caribbean product': Sparkles,
  Cosmetics: Sparkles,
  'Dairy And Tea': Coffee,
  'Flours & Rice': Wheat,
  'Fresh Produce': Leaf,
  'Frozen foods': Snowflake,
  'Hair & Braiding': Scissors,
  Headtie: Shirt,
  Kente: Layers,
  Lace: Sparkles,
  'Meat and Seafood': Fish,
  Motherland: ShoppingBasket,
  'Non food': Box,
  'Ready-to-wear': Shirt,
  Snack: ShoppingBasket,
  Spices: Flame,
}

type CategoryIconProps = {
  category: string
  className?: string
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = ICON_MAP[category] ?? ShoppingBasket
  return <Icon className={cn('h-6 w-6 text-brand-700', className)} strokeWidth={1.75} aria-hidden />
}
