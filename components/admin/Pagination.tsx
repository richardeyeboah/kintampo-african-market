import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}

export function Pagination({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="flex items-center justify-between border-t border-earth-100 pt-4 text-sm">
      <span className="text-earth-500">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        {hasPrev ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-earth-200 bg-white px-3 font-medium text-earth-700 no-underline hover:bg-earth-50"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-earth-100 bg-earth-50 px-3 font-medium text-earth-300">
            <ChevronLeft className="h-4 w-4" /> Prev
          </span>
        )}
        {hasNext ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-earth-200 bg-white px-3 font-medium text-earth-700 no-underline hover:bg-earth-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-earth-100 bg-earth-50 px-3 font-medium text-earth-300">
            Next <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  )
}
