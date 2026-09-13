'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  ImagePlus,
  Loader2,
  Scissors,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMoney, cn } from '@/lib/utils'
import { MAX_UPLOAD_BYTES, shrinkImageForUpload, ImagePrepareError } from '@/lib/admin/shrink-image-upload'
import {
  FABRIC_COMPOSITIONS,
  FABRIC_KINDS,
  FABRIC_ORIGINS,
  FABRIC_WIDTHS,
  type FabricKindId,
  buildFabricDescription,
  buildFabricPackLabel,
  buildFabricProductName,
  buildFabricVariantGroup,
  fabricKindById,
  formatYards,
} from '@/lib/fabrics/catalog'
import { FASHION_BRAND_LINES } from '@/lib/constants/categories'

type FormState = {
  kindId: FabricKindId
  designName: string
  color: string
  yards: string
  widthId: (typeof FABRIC_WIDTHS)[number]['id']
  composition: (typeof FABRIC_COMPOSITIONS)[number]
  origin: (typeof FABRIC_ORIGINS)[number]
  care: string
  notes: string
  brand: string
  price: string
  stockPieces: string
  image_url: string
  image_urls: string[]
}

const INITIAL: FormState = {
  kindId: 'wax_6yd',
  designName: '',
  color: '',
  yards: '6',
  widthId: '45',
  composition: '100% cotton',
  origin: 'Nigeria',
  care: 'Hand wash cold or dry clean. Do not bleach.',
  notes: '',
  brand: '',
  price: '',
  stockPieces: '1',
  image_url: '',
  image_urls: [],
}

export function FabricProductForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [useCustomBrand, setUseCustomBrand] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function selectKind(kindId: FabricKindId) {
    const kind = fabricKindById(kindId)
    setForm((prev) => ({
      ...prev,
      kindId,
      yards: String(kind.defaultYards),
      composition:
        kindId === 'lace'
          ? 'Net / tulle'
          : kindId === 'brocade'
            ? '100% polyester'
            : '100% cotton',
      care:
        kindId === 'lace'
          ? 'Hand wash cold. Lay flat to dry. Do not wring.'
          : 'Hand wash cold or dry clean. Do not bleach.',
    }))
  }

  const yardsNum = Number(form.yards)
  const priceNum = Number(form.price)
  const stockNum = Number(form.stockPieces)

  const preview = useMemo(() => {
    const kind = fabricKindById(form.kindId)
    const name = buildFabricProductName({
      designName: form.designName || 'Untitled design',
      color: form.color,
      kindId: form.kindId,
      yards: Number.isFinite(yardsNum) && yardsNum > 0 ? yardsNum : kind.defaultYards,
    })
    const pack_label = buildFabricPackLabel({
      yards: Number.isFinite(yardsNum) && yardsNum > 0 ? yardsNum : kind.defaultYards,
      widthId: form.widthId,
      kindId: form.kindId,
    })
    const description = buildFabricDescription({
      designName: form.designName,
      color: form.color,
      kindId: form.kindId,
      yards: Number.isFinite(yardsNum) && yardsNum > 0 ? yardsNum : kind.defaultYards,
      widthId: form.widthId,
      composition: form.composition,
      origin: form.origin,
      care: form.care,
      notes: form.notes,
    })
    const perYard =
      Number.isFinite(priceNum) &&
      priceNum > 0 &&
      Number.isFinite(yardsNum) &&
      yardsNum > 0
        ? priceNum / yardsNum
        : null
    return { name, pack_label, description, category: kind.category, perYard, kind }
  }, [form, yardsNum, priceNum])

  const completeness = [
    Boolean(form.designName.trim()),
    Boolean(form.color.trim()),
    Number.isFinite(yardsNum) && yardsNum > 0,
    Number.isFinite(priceNum) && priceNum > 0,
    Boolean(form.image_url),
    Number.isFinite(stockNum) && stockNum >= 0,
  ].filter(Boolean).length
  const completenessPct = Math.round((completeness / 6) * 100)

  async function uploadFile(file: File): Promise<string | null> {
    let prepared: File
    try {
      prepared = await shrinkImageForUpload(file)
    } catch (err) {
      setError(err instanceof ImagePrepareError ? err.message : `"${file.name}" could not be prepared.`)
      return null
    }
    if (prepared.size > MAX_UPLOAD_BYTES) {
      setError(`"${file.name}" is too large to upload. Try a smaller photo.`)
      return null
    }
    const fd = new FormData()
    fd.append('file', prepared)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}) as { url?: string; error?: string })
    if (!res.ok || !data.url) {
      setError(data.error || `Upload failed (${res.status}).`)
      return null
    }
    return data.url
  }

  async function handlePrimaryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadFile(file)
      if (url) update('image_url', url)
    } catch {
      setError('Upload failed — check your connection.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleExtraUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const urls: string[] = []
      const failed: string[] = []
      for (const file of files) {
        const url = await uploadFile(file)
        if (url) urls.push(url)
        else failed.push(file.name)
      }
      if (urls.length) {
        setForm((prev) => ({ ...prev, image_urls: [...prev.image_urls, ...urls] }))
      }
      if (failed.length && urls.length) {
        setError(`${failed.length} of ${files.length} photos failed.`)
      }
    } catch {
      setError('Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.designName.trim()) {
      setError('Design / pattern name is required.')
      return
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError('Enter a piece price greater than $0.')
      return
    }
    if (!Number.isFinite(yardsNum) || yardsNum <= 0) {
      setError('Enter yardage greater than 0.')
      return
    }
    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      setError('Stock must be a whole number of pieces (0 or more).')
      return
    }

    setLoading(true)
    setError('')

    const payload = {
      name: buildFabricProductName({
        designName: form.designName,
        color: form.color,
        kindId: form.kindId,
        yards: yardsNum,
      }),
      description: buildFabricDescription({
        designName: form.designName,
        color: form.color,
        kindId: form.kindId,
        yards: yardsNum,
        widthId: form.widthId,
        composition: form.composition,
        origin: form.origin,
        care: form.care,
        notes: form.notes,
      }),
      price: priceNum,
      category: fabricKindById(form.kindId).category,
      image_url: form.image_url || null,
      image_urls: form.image_urls,
      in_stock: stockNum > 0,
      brand: form.brand.trim() || null,
      pack_label: buildFabricPackLabel({
        yards: yardsNum,
        widthId: form.widthId,
        kindId: form.kindId,
      }),
      unit_amount: yardsNum,
      unit_of_measure: 'yd',
      stock_quantity: stockNum,
      variant_group: buildFabricVariantGroup(form.designName, form.kindId),
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not save fabric.')
        return
      }
      router.push('/admin/products')
      router.refresh()
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="space-y-6">
        {/* Material type */}
        <section className="admin-card space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Scissors className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="admin-section-title">Material type</h2>
              <p className="mt-1 text-sm text-earth-500">
                Choose how this piece is sold on the floor.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {FABRIC_KINDS.map((kind) => {
              const active = form.kindId === kind.id
              return (
                <button
                  key={kind.id}
                  type="button"
                  onClick={() => selectKind(kind.id)}
                  className={cn(
                    'min-h-11 rounded-xl border px-3 py-3 text-left transition-colors duration-150',
                    active
                      ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                      : 'border-earth-200 bg-white hover:border-earth-300 hover:bg-earth-50'
                  )}
                >
                  <p className="text-sm font-semibold text-earth-900">{kind.label}</p>
                  <p className="mt-0.5 text-xs text-earth-500">{kind.hint}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Identity */}
        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">Design identity</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="form-label" htmlFor="designName">
                Design / pattern name <span className="text-red-500">*</span>
              </label>
              <Input
                id="designName"
                required
                maxLength={120}
                placeholder="e.g. Royal Ankara Bloom, Soft Net Cord"
                value={form.designName}
                onChange={(e) => update('designName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="color">
                Colorway
              </label>
              <Input
                id="color"
                maxLength={60}
                placeholder="e.g. Wine, Emerald, Multi"
                value={form.color}
                onChange={(e) => update('color', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="brand">
                Brand / line
              </label>
              <select
                id="brand"
                className="form-select"
                value={
                  useCustomBrand ||
                  (form.brand.length > 0 &&
                    !(FASHION_BRAND_LINES as readonly string[]).includes(form.brand))
                    ? '__custom__'
                    : form.brand
                }
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '__custom__') {
                    setUseCustomBrand(true)
                    if ((FASHION_BRAND_LINES as readonly string[]).includes(form.brand)) {
                      update('brand', '')
                    }
                    return
                  }
                  setUseCustomBrand(false)
                  update('brand', v)
                }}
              >
                <option value="">Select (optional)</option>
                {FASHION_BRAND_LINES.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
                <option value="__custom__">Other / custom…</option>
              </select>
              {(useCustomBrand ||
                (form.brand.length > 0 &&
                  !(FASHION_BRAND_LINES as readonly string[]).includes(form.brand))) && (
                <Input
                  maxLength={80}
                  placeholder="Custom mill / brand name"
                  value={
                    (FASHION_BRAND_LINES as readonly string[]).includes(form.brand)
                      ? ''
                      : form.brand
                  }
                  onChange={(e) => update('brand', e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>
        </section>

        {/* Specs */}
        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">Piece specs</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="yards">
                Length (yards) <span className="text-red-500">*</span>
              </label>
              <Input
                id="yards"
                type="number"
                min="0.5"
                max="100"
                step="0.5"
                required
                value={form.yards}
                onChange={(e) => update('yards', e.target.value)}
              />
              <p className="text-[11px] text-earth-400">
                6 yd is standard for African prints.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="width">
                Width
              </label>
              <select
                id="width"
                className="form-select"
                value={form.widthId}
                onChange={(e) =>
                  update('widthId', e.target.value as FormState['widthId'])
                }
              >
                {FABRIC_WIDTHS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="stock">
                Pieces in stock <span className="text-red-500">*</span>
              </label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                required
                value={form.stockPieces}
                onChange={(e) => update('stockPieces', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="composition">
                Composition
              </label>
              <select
                id="composition"
                className="form-select"
                value={form.composition}
                onChange={(e) =>
                  update('composition', e.target.value as FormState['composition'])
                }
              >
                {FABRIC_COMPOSITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="origin">
                Origin
              </label>
              <select
                id="origin"
                className="form-select"
                value={form.origin}
                onChange={(e) => update('origin', e.target.value as FormState['origin'])}
              >
                {FABRIC_ORIGINS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="form-label" htmlFor="care">
              Care
            </label>
            <Input
              id="care"
              maxLength={200}
              value={form.care}
              onChange={(e) => update('care', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="form-label" htmlFor="notes">
              Floor notes
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={800}
              className="form-input"
              placeholder="Stretch, sequins, matching blouse lace, slight dye variation, etc."
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </section>

        {/* Pricing */}
        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="price">
                Piece price (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-earth-400">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="9999"
                  required
                  className="pl-7"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                />
              </div>
              <p className="text-[11px] text-earth-400">
                Price for the full piece customers buy.
              </p>
            </div>
            <div className="rounded-xl border border-earth-200 bg-earth-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-earth-500">
                Implied per yard
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-earth-900">
                {preview.perYard != null ? formatMoney(preview.perYard) : '—'}
                <span className="ml-1 text-sm font-medium text-earth-500">/yd</span>
              </p>
              <p className="mt-1 text-xs text-earth-500">
                Shown on the product card when yardage is set.
              </p>
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">Photos</h2>
          <p className="text-sm text-earth-500">
            Primary shot first — full bolt or laid piece. Add close-ups of pattern and edge.
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <label
              className={cn(
                'flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors',
                uploading
                  ? 'border-earth-200 bg-earth-50'
                  : 'border-earth-300 bg-earth-50 hover:border-brand-400'
              )}
            >
              {form.image_url ? (
                <Image
                  src={form.image_url}
                  alt="Primary fabric"
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-earth-400" />
              ) : (
                <ImagePlus className="h-6 w-6 text-earth-400" strokeWidth={1.5} />
              )}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                className="sr-only"
                onChange={handlePrimaryUpload}
                disabled={uploading}
              />
            </label>
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <p className="font-medium text-earth-800">Primary image</p>
              <p className="text-earth-500">Phone photos, PNG, JPEG, WebP, or HEIC</p>
              {form.image_url && (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center text-sm font-medium text-red-600"
                  onClick={() => update('image_url', '')}
                >
                  Remove primary
                </button>
              )}
            </div>
          </div>

          {form.image_urls.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {form.image_urls.map((url) => (
                <li key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-earth-200">
                  <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-md bg-white/95 text-earth-700"
                    aria-label="Remove photo"
                    onClick={() =>
                      update(
                        'image_urls',
                        form.image_urls.filter((u) => u !== url)
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-earth-200 bg-white px-4 text-sm font-medium text-earth-800 transition-colors hover:bg-earth-50">
            <ImagePlus className="h-4 w-4" aria-hidden />
            Add detail photos
            <input
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="sr-only"
              onChange={handleExtraUpload}
              disabled={uploading}
            />
          </label>
        </section>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 lg:hidden">
          <Button type="submit" size="lg" disabled={loading || uploading} className="min-h-11">
            {loading ? 'Saving…' : 'Publish fabric'}
          </Button>
          <Link href="/admin/products" className="no-underline">
            <Button type="button" variant="outline" size="lg" className="min-h-11">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      {/* Sticky listing preview */}
      <aside className="admin-card sticky top-24 space-y-4 lg:self-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">
            Customer listing preview
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-earth-200 bg-white">
            <div className="relative aspect-square bg-earth-100">
              {form.image_url ? (
                <Image
                  src={form.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="280px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-earth-400">
                  No photo yet
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-earth-500">
                {form.brand.trim() || preview.category}
              </p>
              <p className="line-clamp-2 text-sm font-medium text-earth-900">{preview.name}</p>
              <p className="text-xs text-earth-500">{preview.pack_label}</p>
              <p className="pt-1 text-base font-semibold tabular-nums text-earth-900">
                {Number.isFinite(priceNum) && priceNum > 0 ? formatMoney(priceNum) : '$—'}
              </p>
              {preview.perYard != null && (
                <p className="text-[11px] tabular-nums text-earth-500">
                  {formatMoney(preview.perYard)}/yd · {formatYards(yardsNum || preview.kind.defaultYards)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-earth-500">
            <span>Listing completeness</span>
            <span className="font-semibold tabular-nums text-earth-800">{completenessPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-earth-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-150"
              style={{ width: `${completenessPct}%` }}
            />
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-earth-600">
            {[
              ['Design name', Boolean(form.designName.trim())],
              ['Colorway', Boolean(form.color.trim())],
              ['Yardage', Number.isFinite(yardsNum) && yardsNum > 0],
              ['Piece price', Number.isFinite(priceNum) && priceNum > 0],
              ['Primary photo', Boolean(form.image_url)],
              ['Stock count', Number.isFinite(stockNum) && stockNum >= 0],
            ].map(([label, ok]) => (
              <li key={String(label)} className="flex items-center gap-2">
                <Check
                  className={cn('h-3.5 w-3.5', ok ? 'text-emerald-600' : 'text-earth-300')}
                  aria-hidden
                />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden space-y-2 lg:block">
          <Button type="submit" className="min-h-11 w-full" disabled={loading || uploading}>
            {loading ? 'Saving…' : 'Publish fabric'}
          </Button>
          <Link href="/admin/products" className="block no-underline">
            <Button type="button" variant="outline" className="min-h-11 w-full">
              Cancel
            </Button>
          </Link>
          <p className="text-center text-[11px] text-earth-400">
            Goes live under {preview.category} on /fashion.
          </p>
        </div>
      </aside>
    </form>
  )
}
