import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/store/PageHeader'
import { AddBundleToCart } from '@/components/store/AddBundleToCart'
import { ProductImage } from '@/components/store/ProductImage'
import { fetchActiveBundles, fetchBundleBySlug } from '@/lib/supabase/bundles'
import { formatMoney } from '@/lib/utils'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const bundle = await fetchBundleBySlug(slug)
  if (!bundle) return { title: 'Kit not found', robots: { index: false } }
  return {
    title: bundle.name,
    description: bundle.description ?? `${bundle.name} — kit from the store.`,
  }
}

export async function generateStaticParams() {
  const bundles = await fetchActiveBundles()
  return bundles.map((b) => ({ slug: b.slug }))
}

export default async function BundleDetailPage({ params }: Props) {
  const { slug } = await params
  const bundle = await fetchBundleBySlug(slug)
  if (!bundle) notFound()

  const listTotal = bundle.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const discount = Math.max(0, Math.min(50, Number(bundle.discount_percent) || 0))
  const saleTotal = Math.round(listTotal * (1 - discount / 100) * 100) / 100

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title={bundle.name} subtitle={bundle.description ?? undefined} />
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="store-container grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
          <div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {bundle.items.map((line) => (
                <li key={line.product.id}>
                  <Link
                    href={`/products/${line.product.id}`}
                    className="premium-card premium-card-hover block overflow-hidden no-underline"
                  >
                    <div className="relative aspect-square bg-earth-50">
                      <ProductImage
                        src={line.product.image_url}
                        alt={line.product.name}
                        className="h-full w-full rounded-none"
                        sizes="(max-width:640px) 50vw, 200px"
                        framed={false}
                      />
                      {line.quantity > 1 && (
                        <span className="absolute bottom-2 right-2 rounded-md bg-earth-900/90 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
                          ×{line.quantity}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-earth-900">
                        {line.product.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-earth-900">
                        {formatMoney(line.product.price * line.quantity)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-earth-200 bg-earth-50 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
                Kit total
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-earth-900">
                {formatMoney(saleTotal)}
              </p>
              {discount > 0 && (
                <p className="mt-1 text-sm text-earth-600">
                  <span className="tabular-nums line-through">{formatMoney(listTotal)}</span>
                  <span className="ml-2 font-semibold text-accent-800">{discount}% off list</span>
                </p>
              )}
              <p className="mt-3 text-sm text-earth-600">
                {bundle.items.length} item{bundle.items.length === 1 ? '' : 's'} included
              </p>
              <div className="mt-6">
                <AddBundleToCart bundle={bundle} />
              </div>
            </div>
            <p className="mt-6">
              <Link
                href="/bundles"
                className="text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
              >
                ← All kits
              </Link>
            </p>
          </aside>
        </div>
      </section>
    </div>
  )
}
