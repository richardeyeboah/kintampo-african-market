import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Heart } from 'lucide-react'
import { createClientOptional } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/types'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const supabase = await createClientOptional()
  if (!supabase) redirect('/login?next=/account/wishlist&error=configuration')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/wishlist')

  const { data: rows } = await supabase
    .from('wishlists')
    .select(
      'product_id, created_at, products ( id, name, price, image_url, category, in_stock, description, created_at )'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const products: Product[] = []
  for (const row of rows ?? []) {
    const p = row.products as Product | Product[] | null
    if (!p) continue
    const product = Array.isArray(p) ? p[0] : p
    if (product?.id) products.push(product as Product)
  }

  return (
    <>
      <div>
        <p className="section-eyebrow">Saved</p>
        <h1 className="section-title mt-2 inline-flex items-center gap-2">
          <Heart className="h-6 w-6 text-brand-600" aria-hidden />
          Wishlist
        </h1>
        <p className="section-subtitle mt-2">
          {products.length === 0
            ? 'No saved products yet. Save items from a product page to see them here.'
            : `${products.length} saved product${products.length === 1 ? '' : 's'}.`}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="premium-card mt-8 p-8 text-center">
          <p className="text-sm text-earth-600">Browse the shop and save items you want later.</p>
          <Link
            href="/shop"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
          >
            Shop products →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 2} />
          ))}
        </div>
      )}
    </>
  )
}
