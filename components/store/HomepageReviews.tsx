import Link from 'next/link'
import { Star } from 'lucide-react'
import type { HomepageReview } from '@/lib/supabase/homepage-reviews'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-earth-200 text-earth-200'
          }`}
        />
      ))}
    </span>
  )
}

type Props = {
  reviews: HomepageReview[]
  totalCount: number
  averageRating: number
}

export function HomepageReviews({ reviews, totalCount, averageRating }: Props) {
  if (reviews.length === 0) return null

  return (
    <section className="page-section bg-white">
      <div className="store-container">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Customer reviews</h2>
            <p className="section-subtitle">
              {averageRating.toFixed(1)} average · {totalCount} review{totalCount === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/shop"
            className="text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
          >
            Shop reviewed products →
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <li key={review.id} className="premium-card flex h-full flex-col p-5">
              <Stars rating={review.rating} />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-earth-700">
                &ldquo;{review.comment}&rdquo;
              </blockquote>
              <footer className="mt-4 border-t border-earth-100 pt-4 text-xs text-earth-500">
                <p className="font-medium text-earth-800">{review.reviewer_name}</p>
                <p className="mt-0.5">
                  on{' '}
                  <Link
                    href={`/products/${review.product_id}`}
                    className="font-medium text-brand-700 no-underline hover:text-brand-800"
                  >
                    {review.product_name}
                  </Link>
                </p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
