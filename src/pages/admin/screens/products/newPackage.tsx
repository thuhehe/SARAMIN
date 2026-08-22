import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CATALOG } from '@/pages/admin/data/products'
import { FLabel, Section } from '@/pages/admin/ui/fields'

/* Packages — several products at one package price, reusable across customers.
   A package is a SELLING WRAPPER: paying for one provisions each component
   separately at the component quota, so consumption and reporting are identical
   whether the customer bought the package or the pieces.

   The client has exactly one real package today (Gói Ultimate). The CRM's other
   "Gói …" groups are NOT packages — Gói Enterprise / Gói SME are the same three
   tiers at different segment prices, which is a price list on the product. */
/* Create package. The whole point of the screen is the number at the bottom: the
   sum of the component list prices against the one package price, i.e. the discount
   the product owner is actually deciding. So components carry a quantity and the
   comparison is live — never a figure someone types by hand.

   Add-ons are not offered as components: they reach a customer through a parent
   product's Includes, so putting one in a package would grant it twice. */
export function NewPackageModal({ onClose }: { onClose: () => void }) {
  const eligible = CATALOG.filter((c) => c.role !== 'Add-on' && c.status === 'Active')
  const [qty, setQty] = useState<Record<string, number>>({ 'JOB-TOPJOB': 1, 'CV-050': 1 })
  const [pkgPrice, setPkgPrice] = useState('')
  const [name, setName] = useState('')
  const [custom, setCustom] = useState(false)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Inactive')
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')

  const picked = Object.entries(qty).filter(([, n]) => n > 0)
  const priceNum = Number(pkgPrice.replace(/\D/g, ''))
  const valid = name.trim().length > 0 && picked.length >= 2 && (custom || priceNum > 0)

  const toggle = (sku: string) => setQty((k) => ({ ...k, [sku]: k[sku] ? 0 : 1 }))
  const matches = eligible.filter((c) =>
    !q.trim() || `${c.name} ${c.sku} ${c.type}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[620px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">New package</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          <Section title="1 · Identity" className="mt-0" />
          <div>
            <FLabel req>Name</FLabel>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gói Ultimate" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <div className="rounded-md bg-canvas/70 px-3 py-2 text-[11px] leading-relaxed text-muted">
            <b className="text-ink/70">Package ID:</b>{' '}
            <span className="font-mono">{name.trim() ? `PKG-${name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '').toUpperCase().slice(0, 12)}` : 'auto-generated from the name'}</span>
          </div>

          {/* Same field the product form has: this is what prints on the quotation
              and the PO, so a package needs it as much as a product does. */}
          <div>
            <div className="mb-1 flex items-end justify-between gap-2">
              <FLabel req={lang === 'VI'}>Package description</FLabel>
              <div className="mb-1 inline-flex shrink-0 overflow-hidden rounded-md border border-line">
                {(['VI', 'EN'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn('px-2 py-0.5 text-[10.5px] font-medium transition-colors', lang === l ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}
                  >
                    {l === 'VI' ? 'Tiếng Việt' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-faint" style={{ minHeight: 60 }}>
              {lang === 'VI'
                ? 'In trên báo giá và PO — danh sách quyền lợi của cả gói mà khách đọc.'
                : 'Printed on the quotation and the PO — the benefit list for the whole package.'}
            </div>
          </div>

          <Section title="2 · Components" />
          {/* A searchable, scrollable picker rather than a flat list: the catalogue is
              24 products today and will grow, so the list must be filterable and must
              not push the price fields off the bottom of the modal. Chosen components
              are summarised above the list so they stay visible while scrolling. */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted">{picked.length} selected</span>
              {picked.map(([sku, n]) => {
                const c = CATALOG.find((x) => x.sku === sku)
                if (!c) return null
                return (
                  <span key={sku} className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[10.5px] text-brand">
                    {c.name}{n > 1 && <b>×{n}</b>}
                    <button onClick={() => setQty((q) => ({ ...q, [sku]: 0 }))} className="text-brand/60 hover:text-brand">✕</button>
                  </span>
                )
              })}
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm sản phẩm theo tên, SKU hoặc loại…"
              className="mb-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <div className="max-h-[220px] space-y-1.5 overflow-y-auto rounded-md border border-line p-1.5 scroll-thin">
              {matches.length === 0 && <p className="px-1.5 py-3 text-center text-[11.5px] text-faint">Không tìm thấy sản phẩm nào</p>}
              {matches.map((c) => {
                const on = (qty[c.sku] ?? 0) > 0
                return (
                  <div key={c.sku} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5', on ? 'border-brand bg-brand-soft' : 'border-line')}>
                    <button onClick={() => toggle(c.sku)} className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-line')}>
                      {on && <span className="text-[9px] leading-none">✓</span>}
                    </button>
                    <button onClick={() => toggle(c.sku)} className="min-w-0 flex-1 text-left">
                      <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/70')}>{c.name}</span>
                      <span className="block text-[10px] text-faint"><span className="font-mono">{c.sku}</span> · {c.type} · {c.price.replace(' ⓒ', '')}</span>
                    </button>
                    {on && (
                      <span className="flex shrink-0 items-center gap-1">
                        <span className="text-[10px] text-faint">SL</span>
                        <select value={qty[c.sku]} onChange={(e) => setQty((k) => ({ ...k, [c.sku]: Number(e.target.value) }))} className="rounded border border-line bg-surface px-1.5 py-1 text-[10.5px] text-ink/80 outline-none focus:border-brand">
                          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {picked.length < 2 && (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
              <span></span><span>A package needs at least <b>2 components</b> — one component is just a product at a price.</span>
            </p>
          )}

          <Section title="3 · Package price" />
          <div className="flex items-center gap-2">
            <button onClick={() => setCustom((c) => !c)} className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded border', custom ? 'border-brand bg-brand text-white' : 'border-line')}>
              {custom && <span className="text-[9px] leading-none">✓</span>}
            </button>
            <span className="text-[11.5px] text-ink/80">Custom price — quoted per deal (the Enterprise case)</span>
          </div>
          {!custom && (
            <div>
              <FLabel req>Package price (₫)</FLabel>
              <input value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} inputMode="numeric" placeholder="16489000" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
          )}

          <Section title="4 · Status" />
          <div className="grid gap-1.5 sm:grid-cols-2">
            {([
              ['Active', 'Sellable — can be quoted and ordered'],
              ['Inactive', 'Not sellable — hidden from quotations'],
            ] as const).map(([v, hint]) => (
              <button
                key={v}
                onClick={() => setStatus(v)}
                className={cn('rounded-lg border px-2.5 py-2 text-left transition-colors', status === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
              >
                <span className={cn('block text-[12px] font-semibold', status === v ? 'text-brand' : 'text-ink')}>{v}</span>
                <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
              </button>
            ))}
          </div>
          {status === 'Active' && (
            <p className="text-[10.5px] leading-relaxed text-amber-700">A package can only be Active while every component is Active.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  )
}
