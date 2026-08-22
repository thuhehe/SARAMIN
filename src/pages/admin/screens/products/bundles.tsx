import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PACKAGES } from '@/pages/admin/data/products'
import { FilterSelect, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

export function AdminBundles() {
  const [fStatus, setFStatus] = useState('')
  const [sort, setSort] = useState('')

  const priceOf = (v: string) => {
    const n = Number((v.match(/[\d,]+/)?.[0] ?? '').replace(/,/g, ''))
    return v.trim().startsWith('—') || v === 'Custom' || Number.isNaN(n) ? null : n
  }
  const shown = PACKAGES
    .filter((k) => !fStatus || k.status === fStatus)
    .slice()
    .sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name, 'vi')
      if (sort === 'name-desc') return b.name.localeCompare(a.name, 'vi')
      if (sort === 'price-asc' || sort === 'price-desc') {
        const x = priceOf(a.price), y = priceOf(b.price)
        if (x === null && y === null) return 0
        if (x === null) return 1
        if (y === null) return -1
        return sort === 'price-asc' ? x - y : y - x
      }
      return 0
    })

  return (
    <div>
      <ListPage
        cols={[{ label: 'Package', w: '1.4fr' }, { label: 'Components', w: '2.6fr' }, { label: 'Package price', w: '1.1fr', align: 'r' }, { label: 'Status', w: '0.8fr', align: 'r' }]}
        rows={shown.map((k) => [
          <span>
            <span className="block font-medium text-brand">{k.name}</span>
            <span className="block text-[10.5px] text-faint">{k.note}</span>
          </span>,
          <span className="text-[11px] leading-relaxed">{k.components}</span>,
          <span className={cn(k.price.startsWith('—') && 'text-faint')}>{k.price}</span>,
          <Pill tone={k.status === 'Active' ? 'active' : 'expired'}>{k.status}</Pill>,
        ])}
        filters={
          <>
            <FilterSelect label="Status" value={fStatus} onChange={setFStatus} options={['Active', 'Inactive']} />
            <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', sort ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
              <span className={sort ? 'text-brand/70' : 'text-faint'}>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={cn('max-w-[150px] cursor-pointer bg-transparent text-[11.5px] outline-none', sort ? 'font-medium text-brand' : 'text-ink')}
              >
                <option value="">Default</option>
                <option value="name-asc">Tên A → Z</option>
                <option value="name-desc">Tên Z → A</option>
                <option value="price-asc">Giá thấp → cao</option>
                <option value="price-desc">Giá cao → thấp</option>
              </select>
            </label>
          </>
        }
        total={PACKAGES.length}
        searchHint="Search package, component…"
        minW={1000}
      />
    </div>
  )
}
