import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { ACTIVATE_WITHIN_DEFAULT, CATALOG, DESCRIPTIONS, FILL_META, PLACEMENTS, SLOT_CONTENT, activateWithin, activateWithinLabel } from '@/pages/admin/data/products'
import type { CatalogItem } from '@/pages/admin/data/products'
import { DetailCard, KV } from '@/pages/admin/ui/fields'
import { FilterSelect, ListPage } from '@/pages/admin/ui/list'
import { MiniStat } from '@/pages/admin/ui/stats'
import { Pill } from '@/pages/admin/ui/status'

/* Product detail. Deliberately NOT one generic layout: the Fulfilment card and
   the "Where it appears" card change with the type, because that is the whole
   point of typing products. Everything else (price list, usage, history) is
   shared.

   The price list is the card that matters most — it is what replaces the CRM's
   the CRM's four separate Basic Plus SKUs with one product at one price. */
function ProductDetail({ p, onBack }: { p: CatalogItem; onBack: () => void }) {
  const isTier = p.type === 'Job posting'
  const isCredit = p.type === 'CV search'
  const isPlacement = p.type === 'Placement booking'
  const isAddon = p.role === 'Add-on'
  const isService = p.type === 'Manual service'
  const isFreeTier = p.entitlement === 'free'
  const unpriced = p.price.startsWith('—')


  const placement = PLACEMENTS.find((x) =>
    (p.sku === 'PLC-HOMEHERO' && x.id === 'home-hero') ||
    (p.sku === 'PLC-ADS-HOME' && x.id === 'home-adsense') ||
    (p.sku === 'PLC-ADS-SEARCH' && x.id === 'search-adsense') ||
    (p.sku === 'PLC-TOPCOMPANY' && x.id === 'home-top-co') ||
    (p.sku === 'PLC-HOTJOBS' && x.id === 'home-super-hot') ||
    (p.sku === 'PLC-POPULARJOBS' && x.id === 'home-popular-jobs') ||
    (p.sku === 'PLC-HLCOMPANIES' && x.id === 'home-highlight-co') ||
    (p.sku === 'PLC-FEATURECO' && x.id === 'home-feature-co') ||
    (p.sku === 'PLC-SEARCH-HLCO' && x.id === 'search-highlight-co') ||
    (p.sku === 'PLC-POPUP' && x.id === 'home-popup'))

  // Which placements a tier feeds — read from the registry, not restated.
  const TIER_FEEDS: Record<string, string[]> = {
    'JOB-BASIC': ['home-new-jobs'],
    'JOB-BASICPLUS': ['home-highlight-co', 'search-highlight-jobs'],
    'JOB-DISTINCTION': ['home-popular-jobs', 'home-tailored', 'search-highlight-jobs'],
    'JOB-TOPJOB': ['home-super-hot', 'home-popular-jobs', 'home-tailored', 'search-highlight-jobs'],
  }
  const feeds = (TIER_FEEDS[p.sku] ?? []).map((id) => PLACEMENTS.find((x) => x.id === id)!).filter(Boolean)

  const [descLang, setDescLang] = useState<'VI' | 'EN'>('VI')
  const desc = DESCRIPTIONS[p.sku]

  // Publishes "System / Products / Tin Basic Plus" to the shell — the crumb IS the
  // way back, so there is no second "← Back" button, and the shell hides the
  // list's "+ New product" while a record is open.
  useDetailCrumb(p.name, onBack)

  return (
    <div className="max-w-[1080px]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            {p.name} <Pill tone={p.status === 'Active' ? 'active' : 'expired'}>{p.status}</Pill>
            {isFreeTier && <Pill tone="neutral">🆓 Free — Admin only</Pill>}
            {p.trial && <Pill tone="draft">Sản phẩm dùng thử</Pill>}
          </h2>
          <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
            <span className="font-mono">{p.sku}</span> · {p.type} ·
            {p.role === 'Main' ? <span>Main product</span> : <Pill tone="pending">{p.role}</Pill>}
            · created 24/07/2026
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink/80 hover:border-ink/40">Duplicate</button>
          <button className="rounded-lg border border-brand/30 bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Edit</button>
          {/* No Activate / Deactivate: status is a field on the form, changed via Edit. */}
        </div>
      </div>

      {unpriced && !isFreeTier && (
        <p className="mb-3 flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
          <span></span><span><b>Cannot be set Active — no price.</b> The client deck does not price this item. Saving it as Active is blocked until a price is set.</span>
        </p>
      )}

      {p.trial && (
        <p className="mb-3 flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand">
          <span>🧪</span>
          <span>
            <b>Chỉ bán trong báo giá dùng thử.</b> Sản phẩm này chỉ xuất hiện khi báo giá chọn chương trình <b>Gói dùng thử</b>, và báo giá đó không chọn được sản phẩm thường.
            Đây là <b>sản phẩm giá thấp</b>, không phải chiết khấu — hóa đơn ghi đúng thứ đã bán với đúng giá đã bán, và báo cáo doanh thu thấy một SKU rẻ chứ không phải một khoản giảm giá 95%.
            Mọi ô chiết khấu trên báo giá đều khoá ở 0.
          </span>
        </p>
      )}
      {isFreeTier && (
        <p className="mb-3 flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand">
          <span>🆓</span><span><b>Always available — no PO, no limit.</b> HQ can post this tier for any company at any time. It is <b>never offered on the Company site</b> (employers post only from what they bought), it is not upgradeable to a paid tier, and it gets no premium placement slots.</span>
        </p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="List price" value={isFreeTier ? '0 ₫' : unpriced ? '—' : p.price.replace(' ⓒ', '')} sub={isFreeTier ? 'never sold' : unpriced ? 'not set' : 'current version'} tone={!isFreeTier && unpriced ? 'warn' : undefined} />
        <MiniStat label="Sold" value={isFreeTier ? '—' : p.status === 'Active' ? '128' : '0'} sub={isFreeTier ? 'not sold' : 'paid order lines'} />
        <MiniStat label="Active entitlements" value={p.status === 'Active' ? '41' : '0'} sub="across companies" />
        <MiniStat label="Included in" value={CATALOG.filter((c) => c.includes?.includes(p.sku)).length || '—'} sub={CATALOG.filter((c) => c.includes?.includes(p.sku)).length ? 'products' : 'not included anywhere'} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Same field the create form captures — the customer-facing text printed
            on the quotation and the PO, with the same VI / EN tab. */}
        <DetailCard
          title="Product description"
          action={
            <span className="inline-flex overflow-hidden rounded-md border border-line">
              {(['VI', 'EN'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setDescLang(l)}
                  className={cn('px-2 py-0.5 text-[10.5px] font-medium transition-colors', descLang === l ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}
                >
                  {l === 'VI' ? 'Tiếng Việt' : 'English'}
                </button>
              ))}
            </span>
          }
        >
          <p className={cn('text-[12px] leading-relaxed', desc ? 'text-ink/85' : 'text-faint')}>
            {desc ? (descLang === 'VI' ? desc.vi : desc.en) : '— chưa nhập mô tả'}
          </p>
        </DetailCard>

        {/* Mirrors the create form: ONE price, every type. */}
        <DetailCard
          title={isAddon ? 'Giá trị nội bộ' : 'Price'}
          action={<span className="text-[11px] text-faint">{isAddon ? 'not quotable' : 'list price'}</span>}
        >
          <p className="text-[17px] font-bold tabular-nums text-ink">{unpriced ? '— chưa đặt' : p.price.replace(' ⓒ', '')}</p>
        </DetailCard>

        {/* Field-for-field the same set the create form asks for, per type — so the
            form and the record never disagree about what defines a product. */}
        <DetailCard title={`Fulfilment — ${p.type}`} action={<span className="text-[11px] text-faint">same fields as create</span>}>
          {/* Applies to every type, so it leads the card rather than sitting inside
              one branch. It is also the only line here that can cost the customer
              money they already paid. */}
          <KV
            label="Kích hoạt trong — từ ngày xuất hóa đơn"
            value={activateWithin(p) === null
              ? '— never invoiced, so no window'
              : `${activateWithinLabel(p)} kể từ ngày xuất hóa đơn · quota chưa dùng hết hạn sau đó`}
          />
          {isTier && (<>
            <KV label="Entitlement source" value={isFreeTier ? 'Always available — Admin only, no PO, no limit' : 'Requires purchase — drawn from an active PO line'} />
            <KV label="Thời gian hiển thị" value={`${p.fulfilment.match(/^(\d+) ngày/)?.[1] ?? '30'} ngày`} />
            <KV label="Auto-refresh" value={p.fulfilment.split('· ')[1] ?? '—'} />
            {/* Each slot carries its own duration in the create form, so the record
                shows it per row rather than as a flat list of names. */}
            <div className="border-b border-line-soft py-2">
              <p className="text-[10.5px] uppercase tracking-wide text-faint">Placement slots</p>
              {feeds.length ? (
                <div className="mt-1 space-y-1">
                  {feeds.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="min-w-0 truncate text-ink/85">{f.name}</span>
                      <span className="shrink-0 text-[10.5px] text-muted">{f.id === 'home-super-hot' ? '10 ngày đầu' : 'toàn bộ thời gian'}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-0.5 text-[12.5px] text-faint">— none</p>}
            </div>
            <div className="py-2">
              <p className="text-[10.5px] uppercase tracking-wide text-faint">Includes / Bán kèm</p>
              {p.includes?.length ? (
                <div className="mt-1 space-y-1">
                  {p.includes.map((sku) => {
                    const c = CATALOG.find((x) => x.sku === sku)
                    if (!c) return null
                    return (
                      <div key={sku} className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="min-w-0 truncate text-ink/85">{c.name}</span>
                        <span className="shrink-0 text-[10.5px] text-muted">SL 1</span>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="mt-0.5 text-[12.5px] text-faint">— none</p>}
            </div>
          </>)}
          {isCredit && (<>
            <KV label="Số lượng" value={`${p.fulfilment.match(/^(\d+) lượt/)?.[1] ?? '—'} lượt mở CV`} />
            <KV label="Validity" value={`${p.fulfilment.match(/· (\d+) ngày/)?.[1] ?? '—'} ngày`} />
            <KV label="Average per CV" value={p.fulfilment.includes('~') ? `~${p.fulfilment.split('~')[1]} — computed from price ÷ số lượng` : '— set a price'} />
          </>)}
          {isPlacement && (<>
            <KV label="Placement slot" value={placement ? `${placement.name} — ${placement.page}` : '— not mapped'} link={!!placement} />
            <KV label="Nội dung hiển thị" value={p.content ? SLOT_CONTENT[p.content].vi : '— chưa đặt'} />
            {p.content === 'job' && (
              <p className="mt-1 rounded-md bg-canvas/70 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-muted">
                Booking giữ chỗ theo <b className="text-ink/70">thời gian hiển thị của slot</b>; job vẫn chạy đủ vòng đời
                tin đăng của nó. Hai đồng hồ độc lập — hết booking không có nghĩa job hết hạn.
              </p>
            )}
            <KV label="Thời gian hiển thị" value={p.fulfilment.match(/(\d+ ngày)/)?.[1] ?? '— chưa đặt'} />
            {/* Not every slot has a numeric pool — the Hot-jobs area is an unlimited
                pool, so fall back to the registry's own capacity wording. */}
            <KV label="Slots consumed" value={placement ? (placement.cap.match(/max (\d+)/) ? `1 of ${placement.cap.match(/max (\d+)/)![1]} in rotation` : `1 · ${placement.cap}`) : '—'} />
            <p className="mt-2 text-[10.5px] leading-relaxed text-faint">Size and capacity are read from System → Placements — read-only here, so a sale cannot contradict the site.</p>
          </>)}
          {isService && (<>
            <KV label="Số lượng" value={p.fulfilment.match(/^(\d+)/)?.[1] ?? '1'} />
            <KV label="Đơn vị" value={p.fulfilment.match(/^\d+ ([^·]+)/)?.[1]?.trim() ?? '—'} />
            <p className="mt-2 text-[10.5px] leading-relaxed text-faint">Paying this opens a fulfilment task (Requested → Scheduled → Delivered) and needs proof of delivery — it does not provision quota.</p>
          </>)}
        </DetailCard>

        {(p.includes?.length || p.role === 'Add-on') && (
          <DetailCard title={p.role === 'Add-on' ? 'How this reaches a customer' : 'Included in this product'} action={<span className="text-[11px] text-faint">{p.role === 'Add-on' ? 'attach-only' : `${p.includes!.length} products`}</span>}>
            {p.role === 'Add-on' ? (<>
              <p className="text-[11.5px] leading-relaxed text-muted">
                Never a quotation line on its own. It reaches a customer only through a Job posting product that
                lists it in <b className="text-ink/70">Includes</b>:
              </p>
              <div className="mt-2 space-y-1.5">
                {CATALOG.filter((c) => c.includes?.includes(p.sku)).map((c) => (
                  <div key={c.sku} className="rounded-lg border border-line px-2.5 py-1.5">
                    <span className="block text-[12px] font-medium text-ink">{c.name}</span>
                    <span className="block text-[10.5px] text-faint">{c.type} · {c.price.replace(' ⓒ', '')}</span>
                  </div>
                ))}
              </div>
            </>) : (<>
              <div className="space-y-1.5">
                {p.includes!.map((s) => {
                  const c = CATALOG.find((x) => x.sku === s)
                  if (!c) return null
                  return (
                    <div key={s} className="flex items-start justify-between gap-2 rounded-lg border border-line px-2.5 py-2">
                      <span className="min-w-0">
                        <span className="block text-[12px] font-medium text-ink">{c.name}</span>
                        <span className="block text-[10.5px] text-faint">{c.type} · {c.role === 'Add-on' ? 'attach-only' : `also sold separately at ${c.price.replace(' ⓒ', '')}`}</span>
                      </span>
                      <Pill tone={c.type === 'Manual service' ? 'pending' : 'neutral'}>{c.type === 'Manual service' ? 'ops task' : 'placement'}</Pill>
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
                <b className="text-ink/70">Included, not bundled.</b> The customer sees one line — “{p.name}” — on the
                quotation, at one price. Paying it fires each include: a Manual service opens an ops task, a placement
                grants the position. This is why {p.name} stays a <b className="text-ink/70">product</b> and not a package.
              </p>
            </>)}
          </DetailCard>
        )}

        <DetailCard title="Where it appears on the site" action={<span className="text-[11px] text-faint">{isTier ? `${feeds.length} placements` : placement ? '1 placement' : '—'}</span>}>
          {isTier && feeds.length > 0 && (<>
            <div className="space-y-1.5">
              {feeds.map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-2 rounded-lg border border-line px-2.5 py-2">
                  <span className="min-w-0">
                    <span className="block text-[12px] font-medium text-ink">{f.name}</span>
                    <span className="block text-[10.5px] text-faint">{f.page} · {f.shown} · {f.cap}</span>
                  </span>
                  <Pill tone={FILL_META[f.route].tone}>{FILL_META[f.route].label}</Pill>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
              Tier-driven: a job lands in these areas <b className="text-ink/70">because of its tier</b>. Nothing is
              booked and nothing is assigned by hand.
            </p>
          </>)}
          {(isPlacement || isAddon) && placement && (<>
            <div className="rounded-lg border border-line px-2.5 py-2">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium text-ink">{placement.name}</span>
                  <span className="block text-[10.5px] text-faint">{placement.page} · deck §{placement.ref} · {placement.size}</span>
                </span>
                <Pill tone={FILL_META[placement.route].tone}>{FILL_META[placement.route].label}</Pill>
              </div>
            </div>
            {placement.route === 'both' && (
              <p className="mt-2 flex gap-1.5 rounded-md bg-amber-50 px-2.5 py-2 text-[10.5px] leading-relaxed text-amber-800">
                <span></span><span>This area is also filled by a posting tier, so tier-included jobs and purchased positions compete for the same finite slots. Needs a priority rule.</span>
              </p>
            )}
            <p className="mt-2 text-[10.5px] leading-relaxed text-faint">Selling this needs an availability check — the slot cannot exceed {placement.cap}.</p>
          </>)}
          {isCredit && <p className="text-[11.5px] leading-relaxed text-muted">Nothing. A credit pack grants a balance, not visibility — it is spent in Resume search.</p>}
          {isService && <p className="text-[11.5px] leading-relaxed text-muted">Off-platform. Delivered on the TopDev fanpage / by email, so it appears nowhere on the jobseeker site.</p>}
        </DetailCard>

      </div>
    </div>
  )
}

export function AdminCatalog() {
  // The "+ New product" button lives on the page title row in the shell
  // (PRIMARY_ACTION in AdminWireframe), which also opens NewProductModal.
  //
  // Type used to be a tab strip. It is a filter now: tabs spend a whole row to
  // offer one facet, and this list needs to be narrowed by Type AND Status at
  // the same time — which a tab strip cannot express.
  const [fType, setFType] = useState('')
  const [fRole, setFRole] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [sort, setSort] = useState('')
  const [detail, setDetail] = useState<string | null>(null)

  /** Unpriced rows ("— price TBC", "— nội bộ") sort last either way — they are
      missing data, not a price of zero, so they must not lead an ascending list. */
  const priceOf = (v: string) => {
    const n = Number((v.match(/[\d,]+/)?.[0] ?? '').replace(/,/g, ''))
    return v.trim().startsWith('—') || Number.isNaN(n) ? null : n
  }
  const rows = CATALOG
    .filter((p) => (!fType || p.type === fType) && (!fRole || p.role === fRole) && (!fStatus || p.status === fStatus))
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

  const open = CATALOG.find((p) => p.sku === detail)
  if (open) return <ProductDetail p={open} onBack={() => setDetail(null)} />

  return (
    <div>
      <ListPage
        // Product name leads: a catalog product is an ENTITY, so the row's identity
        // is the human name (sales says "Tin Top Job", never "JOB-TOPJOB"). Only
        // document lists — quotation, invoice, PO — lead with their number, because
        // for a document the number IS the name.
        cols={[{ label: 'Product', w: '1.9fr' }, { label: 'SKU', w: '1.1fr' }, { label: 'Type', w: '1.2fr' }, { label: 'Role', w: '1.2fr' }, { label: 'Price', w: '1.1fr', align: 'r' }, { label: 'Fulfilment', w: '1.6fr' }, { label: 'Activate within', w: '1fr' }, { label: 'Status', w: '0.7fr', align: 'r' }]}
        rows={rows.map((p) => [
          // The name opens the product record — where the price, the entitlement it
          // grants and its change history live.
          <a href="#" onClick={(e) => { e.preventDefault(); setDetail(p.sku) }} className="min-w-0 truncate font-medium text-brand hover:underline">{p.name}</a>,
          <span className="truncate font-mono text-[11px] text-muted">{p.sku}</span>,
          p.type,
          // Add-on can never be a quotation line, so it is called out rather than
          // printed as plain text like Main.
          <span className="flex min-w-0 flex-wrap items-center gap-1">
            {p.role === 'Main' ? <span className="text-muted">Main</span> : <Pill tone={p.role === 'Add-on' ? 'pending' : 'neutral'}>{p.role}</Pill>}
            {p.trial && <Pill tone="draft">Dùng thử</Pill>}
          </span>,
          <span className={cn(p.price.startsWith('—') && 'text-faint')}>{p.price}</span>,
          p.fulfilment,
          // Next to Fulfilment on purpose: "what you get" and "by when you must
          // start" are read together, and a non-default window is the thing worth
          // spotting from the list.
          <span className={cn('text-[11.5px]', activateWithin(p) === null ? 'text-faint' : activateWithin(p) !== ACTIVATE_WITHIN_DEFAULT ? 'font-medium text-amber-700' : 'text-muted')}>
            {activateWithinLabel(p)}{activateWithin(p) !== null && <span className="text-faint"> từ hóa đơn</span>}
          </span>,
          <Pill tone={p.status === 'Active' ? 'active' : 'expired'}>{p.status}</Pill>,
        ])}
        filters={
          <>
            <FilterSelect label="Type" value={fType} onChange={setFType} options={[...new Set(CATALOG.map((p) => p.type))]} />
            <FilterSelect label="Role" value={fRole} onChange={setFRole} options={['Main', 'Add-on']} />
            <FilterSelect label="Status" value={fStatus} onChange={setFStatus} options={['Active', 'Inactive']} />
            {/* Sort is not a filter — it never hides a row — but it belongs on the same
                line, because "narrow then order" is one thought. */}
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
        total={CATALOG.length}
        searchHint="Search product, SKU, type…"
        minW={1400}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Every product maps to an entitlement (product + remaining quota + validity) — the record downstream
        screens read and decrement
      </p>
      <p className="mt-3 flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
        <span></span>
        <span>
          <b>Open with the client:</b> the deck gives no price for the banner / adsense / popup placements or the two
          premium-position add-ons. Email reach is stated three different ways — 7.500 (Basic Plus), 9.500 (Ultimate),
          650.000 and 300.000 on the same deck slide.
        </span>
      </p>
    </div>
  )
}
