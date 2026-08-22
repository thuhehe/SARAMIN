import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BANNERS, BANNER_TONE, POPUPS, PU_AUDIENCE } from '@/pages/admin/data/content'
import type { Banner, Popup } from '@/pages/admin/data/content'
import { CATALOG } from '@/pages/admin/data/products'
import { PublishBannerModal } from '@/pages/admin/screens/content/publishBanner'
import { PublishPopupModal } from '@/pages/admin/screens/content/publishPopup'
import { FilterSelect, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* ── Display: banners + popups ────────────────────────────────────────────────
   ONE page, not two. A banner and a popup are the same commercial object — a
   Display placement product, sold on the same COMPANY → PO → PRODUCT chain, with
   the same Draft → Schedule → Open → Expired lifecycle and the same separate
   Exposure switch. Splitting them into two console pages made an operator learn
   the same screen twice.

   They keep their own tables because the two genuinely differ in what an
   operator must see: a banner is placed in a SLOT (so: placement, clicks), while
   a popup interrupts (so: purpose, audience, and a priority order — only ONE
   popup ever shows). The switcher decides which list; everything around it is
   shared. */
export function AdminDisplay() {
  const [kind, setKind] = useState<'Banners' | 'Popups'>('Banners')

  /* Reads first, before the controls that narrow the list — it decides WHICH
     list this is. Same switcher markup as the Companies view switcher. */
  const switcher = (
    <span className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
      {(['Banners', 'Popups'] as const).map((k) => (
        <button
          key={k}
          onClick={() => setKind(k)}
          className={cn('rounded-md px-3 py-1 transition-colors', kind === k ? 'bg-brand text-white' : 'text-muted hover:text-ink')}
        >
          {k}
        </button>
      ))}
    </span>
  )

  return kind === 'Banners' ? <AdminBanners leading={switcher} /> : <AdminPopups leading={switcher} />
}

function AdminBanners({ leading }: { leading?: React.ReactNode }) {
  const [fStatus, setFStatus] = useState('')
  const [fSource, setFSource] = useState('')
  const [edit, setEdit] = useState<Banner | null>(null)
  const [creating, setCreating] = useState(false)

  const rows = BANNERS.filter((b) => (!fStatus || b.status === fStatus) && (!fSource || b.source === fSource))
  const slotOf = (sku: string) => CATALOG.find((c) => c.sku === sku)?.name ?? sku

  return (
    <div>
      <ListPage
        leading={leading}
        cols={[
          { label: 'Banner', w: '1.7fr' },
          { label: 'Placement', w: '1.3fr' },
          { label: 'Company', w: '1.2fr' },
          { label: 'Schedule', w: '1.3fr' },
          { label: 'Status', w: '0.8fr' },
          { label: 'Exposure', w: '0.8fr' },
          { label: 'Clicks', w: '0.7fr', align: 'r' },
        ]}
        rows={rows.map((b) => [
          <span className="flex min-w-0 items-center gap-1.5">
            <button onClick={() => setEdit(b)} className="min-w-0 truncate text-left font-medium text-brand hover:underline">{b.name}</button>
            {b.source === 'House' && <span className="shrink-0"><Pill tone="neutral">Nội bộ</Pill></span>}
          </span>,
          <span className="truncate">{slotOf(b.sku)}</span>,
          <span className={cn('truncate', b.source === 'House' && 'text-faint')}>{b.company}</span>,
          <span className="tabular-nums">{b.start === '—' ? <span className="text-faint">chưa đặt</span> : `${b.start} – ${b.end}`}</span>,
          <Pill tone={BANNER_TONE[b.status]}>{b.status}</Pill>,
          b.exposure === 'On'
            ? <span className="flex items-center gap-1 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />On</span>
            : <span className="flex items-center gap-1 text-faint"><span className="h-1.5 w-1.5 rounded-full bg-line" />Off</span>,
          <span className="tabular-nums">{b.clicks}</span>,
        ])}
        filters={
          <>
            <FilterSelect label="Status" value={fStatus} onChange={setFStatus} options={['Draft', 'Schedule', 'Open', 'Expired']} />
            <FilterSelect label="Nguồn" value={fSource} onChange={setFSource} options={['Sold', 'House']} />
          </>
        }
        total={BANNERS.length}
        searchHint="Search banner, placement, company…"
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Publish banner</button>}
        minW={1180}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Status follows the dates, never typed: no start date means <b className="text-ink/70">publish now</b> →
        <b className="text-ink/70"> Open</b>, a future start gives <b className="text-ink/70">Schedule</b>, the end date
        makes it <b className="text-ink/70">Expired</b> · Exposure is separate — an Open banner can be switched off
        without ending the booking
      </p>
      {(creating || edit) && <PublishBannerModal banner={edit} onClose={() => { setCreating(false); setEdit(null) }} />}
    </div>
  )
}

function AdminPopups({ leading }: { leading?: React.ReactNode }) {
  const [fStatus, setFStatus] = useState('')
  const [fSource, setFSource] = useState('')
  const [edit, setEdit] = useState<Popup | null>(null)
  const [creating, setCreating] = useState(false)

  const rows = POPUPS
    .filter((b) => (!fStatus || b.status === fStatus) && (!fSource || b.source === fSource))
    .slice()
    .sort((a, b) => a.priority - b.priority)

  return (
    <div>
      <ListPage
        /* One column per field the create form asks for, in the same order: name,
           purpose, customer, PO, product, schedule, creative, exposure, status.
           Audience / frequency / priority were columns the form never captured —
           either the form should ask for them or the table should not claim them. */
        minW={2200}
        leading={leading}
        cols={[
          { label: 'Popup', w: '1.5fr' },
          { label: 'Mục đích', w: '1.4fr' },
          { label: 'Khách hàng', w: '1.2fr' },
          { label: 'Đơn hàng / PO', w: '1.2fr' },
          { label: 'Sản phẩm', w: '1fr' },
          { label: 'Lịch chạy', w: '1.3fr' },
          { label: 'Ảnh popup', w: '1.1fr' },
          { label: 'Exposure', w: '0.7fr' },
          { label: 'Status', w: '0.8fr' },
        ]}
        rows={rows.map((b) => [
          <span className="flex min-w-0 items-center gap-1.5">
            <button onClick={() => setEdit(b)} className="min-w-0 truncate text-left font-medium text-brand hover:underline">{b.name}</button>
            {b.source === 'House' && <span className="shrink-0"><Pill tone="neutral">Nội bộ</Pill></span>}
          </span>,
          <span className="truncate text-muted" title={b.purpose}>{b.purpose}</span>,
          <span className={cn('truncate', b.source === 'House' && 'text-faint')}>{b.company}</span>,
          b.po
            ? <span className="truncate font-mono text-[11px] text-muted">{b.po}</span>
            : <span className="text-[10.5px] text-faint">— nội bộ</span>,
          <span className="truncate text-muted">{b.product}</span>,
          <span className="tabular-nums">{b.start === '—' ? <span className="text-faint">chưa đặt</span> : b.end === 'Always on' ? `${b.start} – luôn bật` : `${b.start} – ${b.end}`}</span>,
          b.creative
            ? <span className="truncate font-mono text-[10.5px] text-muted">🖼 {b.creative}</span>
            : <span className="text-[10.5px] text-amber-600">chưa có ảnh</span>,
          b.exposure === 'On'
            ? <span className="flex items-center gap-1 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />On</span>
            : <span className="flex items-center gap-1 text-faint"><span className="h-1.5 w-1.5 rounded-full bg-line" />Off</span>,
          <Pill tone={BANNER_TONE[b.status]}>{b.status}</Pill>,
        ])}
        filters={
          <>
            <FilterSelect label="Status" value={fStatus} onChange={setFStatus} options={['Draft', 'Schedule', 'Open', 'Expired']} />
            <FilterSelect label="Nguồn" value={fSource} onChange={setFSource} options={['Sold', 'House']} />
          </>
        }
        total={POPUPS.length}
        searchHint="Search popup, mục đích, khách hàng, PO…"
        searchExtra={rows.map((b) => [b.purpose, b.company, b.po ?? '', b.product, PU_AUDIENCE[b.audience]].join(' '))}
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Publish popup</button>}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Sorted by <b className="text-ink/70">ưu tiên</b> because only ONE popup shows at a time — this list is the order
        the resolver walks · same Draft → Schedule → Open → Expired lifecycle and separate Exposure switch as banners
      </p>
      {(creating || edit) && <PublishPopupModal popup={edit} onClose={() => { setCreating(false); setEdit(null) }} />}
    </div>
  )
}
