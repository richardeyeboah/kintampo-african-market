'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function WishlistButton({
  productId,
  compact = false,
}: {
  productId: string
  compact?: boolean
}) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      if (!uid) return
      supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', uid)
        .eq('product_id', productId)
        .maybeSingle()
        .then(({ data: row }) => setSaved(!!row))
    })
  }, [productId])

  async function toggle() {
    if (!isSupabaseBrowserConfigured()) return
    if (!userId) {
      window.location.href = `/login?next=/products/${productId}`
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (saved) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
      if (!error) setSaved(false)
    } else {
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: userId, product_id: productId })
      if (!error) setSaved(true)
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={cn(
        'flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-colors',
        compact ? 'h-11 w-11 shadow-sm' : 'h-11 w-11',
        saved
          ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
          : 'border-earth-200 bg-white/95 text-earth-400 hover:border-earth-300 hover:text-red-400'
      )}
    >
      <Heart
        className={cn('h-4 w-4', saved && 'fill-current')}
        strokeWidth={saved ? 0 : 2}
      />
    </button>
  )
}
