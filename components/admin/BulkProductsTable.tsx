'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { BulkStockActions } from '@/components/admin/BulkStockActions'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { ProductStockToggle } from '@/components/admin/ProductStockToggle'

type Product = {
  id: string
  name: string
  category: string | null
  price: number | null
  image_url: string | null
  in_stock: boolean | null
}

export function BulkProductsTable({ products, compact = false }: { products: Product[]; compact?: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allChecked = products.length > 0 && selected.size === products.length
  const someChecked = selected.size > 0 && selected.size < products.length

  function toggleAll() {
    if (allChecked) setSelected(new Set())
    else setSelected(new Set(products.map((p) => p.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="mb-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
          <BulkStockActions ids={[...selected]} />
        </div>
      )}

      <div className={`admin-table-wrap hidden overflow-x-auto sm:block ${compact ? '' : 'rounded-xl border border-earth-200'}`}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-earth-300"
                  aria-label="Select all"
                />
              </th>
              <th></th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={selected.has(p.id) ? 'bg-brand-50/40' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className="h-4 w-4 rounded border-earth-300"
                  />
                </td>
                <td style={{ width: 56 }}>
                  <div className="relative h-10 w-10 overflow-hidden rounded-md border border-earth-200 bg-earth-50">
                    {p.image_url ? (
                      <Image src={p.image_url} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-4 w-4 text-earth-300" aria-hidden />
                      </div>
                    )}
                  </div>
                </td>
                <td className="font-medium text-earth-900">{p.name}</td>
                <td className="tabular-nums font-medium text-earth-900">
                  ${Number(p.price ?? 0).toFixed(2)}
                </td>
                <td>
                  <ProductStockToggle id={p.id} inStock={p.in_stock} />
                </td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-3 text-sm">
                    <Link href={`/admin/products/${p.id}/edit`} className="font-medium text-brand-700 no-underline hover:text-brand-800">
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 sm:hidden">
        {products.map((p) => (
          <li key={p.id} className="flex gap-2">
            <label className="flex items-center justify-center w-11 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggleOne(p.id)}
                className="h-5 w-5 rounded border-earth-300"
              />
            </label>
            <div className="admin-card flex flex-1 gap-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-earth-200 bg-earth-50">
                {p.image_url ? (
                  <Image src={p.image_url} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-earth-300" aria-hidden />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-medium text-earth-900">{p.name}</p>
                <p className="mt-0.5 text-xs text-earth-500">{p.category ?? '—'}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="tabular-nums text-sm font-semibold text-earth-900">
                    ${Number(p.price ?? 0).toFixed(2)}
                  </span>
                  <ProductStockToggle id={p.id} inStock={p.in_stock} />
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <Link href={`/admin/products/${p.id}/edit`} className="font-medium text-brand-700 no-underline">Edit</Link>
                  <DeleteProductButton id={p.id} name={p.name} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
