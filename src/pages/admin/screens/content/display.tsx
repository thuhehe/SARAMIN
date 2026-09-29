import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BANNERS, BANNER_TONE, BOOKABLE_SLOTS, POPUPS, PU_AUDIENCE, SLOT_HEALTH, SLOT_TODAY_LABEL, slotUsage } from '@/pages/admin/data/content'
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
  /* Two VIEWS of one list, not two screens — the same relationship a Jira backlog
     has with its epic swimlanes. Flat answers "find me this booking"; grouped
     answers "what is in this slot", which is the question that needs a placement
     to be a heading rather than a repeated cell. */
  const [group, setGroup] = useState(false)

  const rows = BANNERS.filter((b) => (!fStatus || b.status === fStatus) && (!fSource || b.source === fSource))
  const slotOf = (sku: string) => CATALOG.find((c) => c.sku === sku)?.name ?? sku

  const viewToggle = (
    <span className="inline-flex overflow-hidden rounded-lg border border-line bg-surface text-[11.5px] font-medium">
      {([[false, 'Danh sách'], [true, 'Theo vị trí']] as const).map(([v, label]) => (
        <button
          key={label}
          onClick={() => setGroup(v)}
          className={cn('px-2.5 py-1 transition-colors', group === v ? 'bg-brand text-white' : 'text-muted hover:text-ink')}
        >
          {label}
        </button>
      ))}
    </span>
  )

  if (group) {
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {leading}
          {viewToggle}
          <button onClick={() => setCreating(true)} className="ml-auto shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Publish banner</button>
        </div>
        <BannersByPlacement onOpen={setEdit} />
        {(creating || edit) && <PublishBannerModal banner={edit} onClose={() => { setCreating(false); setEdit(null) }} />}
      </div>
    )
  }

  return (
    <div>
      <ListPage
        leading={<span className="flex items-center gap-2">{leading}{viewToggle}</span>}
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

/* ── Banners grouped by placement (swimlane) ──────────────────────────────────
   The client asked for a per-placement page showing total positions, what is
   live, days left per company and what has expired. All four are facts about
   BOOKINGS read against one slot — so grouping the rows already on this page
   gives every placement its "detail page" at once, and a slot with no rows
   underneath states the emptiness by itself.

   A separate page per placement would have been thirteen screens that go stale
   the moment a fourteenth slot is added, and a reader would have to open each
   one to learn which are in trouble. */
function BannersByPlacement({ onOpen }: { onOpen: (b: Banner) => void }) {
  return (
    <div className="space-y-4">
      {BOOKABLE_SLOTS.map((p) => {
        const u = slotUsage(p)
        const rows = u.occupants.filter((o) => o.kind === 'Banner')
        const order: Record<string, number> = { Open: 0, Schedule: 1, Draft: 2, Expired: 3 }
        const sorted = [...rows].sort((a, b) => (order[a.status] - order[b.status]) || (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
        const live = (o: (typeof sorted)[number]) => o.status === 'Open' && o.exposure === 'On'

        return (
          <section key={p.id} className="overflow-hidden rounded-xl border border-line">
            {/* The swimlane header carries the slot's whole reading, so the group
                is scannable without expanding it. */}
            <header className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line bg-canvas/60 px-4 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-bold text-ink">{p.name}</span>
                <span className="block truncate text-[10.5px] text-faint">{p.page} · deck §{p.ref} · {p.size} · hiển thị {p.shown}</span>
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                <Stat n={u.live.length} label="đang chạy" tone={u.live.length === 0 ? 'rose' : 'emerald'} />
                <Stat n={u.queued} label="đang chờ" />
                <Stat n={u.expired} label="đã hết hạn" />
                <Stat n={u.draft} label="nháp" />
                {u.share != null && <span className="text-[11px]">tỉ lệ <b className="tabular-nums text-ink/80">{Math.round(u.share * 100)}%</b></span>}
              </span>
              <span className="ml-auto shrink-0" title={SLOT_HEALTH[u.health].rule}>
                <Pill tone={SLOT_HEALTH[u.health].tone}>{u.health}</Pill>
              </span>
            </header>

            {sorted.length === 0 ? (
              <p className="px-4 py-5 text-center text-[11.5px] text-faint">
                Chưa có banner nào đặt vào vị trí này{p.route === 'both' && ' — vị trí vẫn được lấp theo hạng tin đăng'}.
              </p>
            ) : (
              <div>
                <div className="grid grid-cols-[1.8fr_1.2fr_0.7fr_1.3fr_0.8fr_1fr] gap-x-4 border-b border-line-soft px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
                  <span>Banner</span><span>Công ty</span><span>Nguồn</span><span>Lịch chạy</span><span className="text-right">Còn lại</span><span>Trạng thái</span>
                </div>
                {sorted.map((o) => (
                  <div key={o.id} className={cn('grid grid-cols-[1.8fr_1.2fr_0.7fr_1.3fr_0.8fr_1fr] items-center gap-x-4 border-b border-line-soft px-4 py-2 text-[12px] last:border-0', !live(o) && 'opacity-60')}>
                    <span className="min-w-0">
                      <button
                        onClick={() => { const b = BANNERS.find((x) => x.id === o.id); if (b) onOpen(b) }}
                        className="block max-w-full truncate text-left font-medium text-brand hover:underline"
                      >
                        {o.name}
                      </button>
                      <span className="block font-mono text-[10px] text-faint">{o.id}</span>
                    </span>
                    <span className={cn('truncate', o.source === 'House' && 'text-faint')}>{o.company}</span>
                    <span>{o.source === 'House' ? <Pill tone="neutral">Nội bộ</Pill> : <Pill tone="active">Khách</Pill>}</span>
                    <span className="tabular-nums text-[11.5px] text-muted">
                      {o.start === '—' ? 'chưa đặt' : `${o.start} – ${o.end}`}
                    </span>
                    {/* The client's "số ngày hiển thị còn lại của mỗi company". */}
                    <span className={cn('text-right tabular-nums text-[11.5px]', o.daysLeft != null && o.daysLeft <= 7 && live(o) ? 'font-medium text-amber-700' : 'text-muted')}>
                      {o.daysLeft == null ? '—' : o.daysLeft < 0 ? 'đã hết' : `${o.daysLeft} ngày`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Pill tone={BANNER_TONE[o.status]}>{o.status}</Pill>
                      {o.status === 'Open' && o.exposure === 'Off' && (
                        <span className="text-[10px] text-rose-600" title="Open nhưng Exposure Off — không hiển thị">tắt</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}
      <p className="text-[11px] leading-relaxed text-faint">
        Mỗi nhóm là một vị trí, kể cả vị trí chưa có banner nào — một nhóm rỗng chính là câu trả lời cho “vị trí nào
        đang trống”. Số ngày còn lại tính đến {SLOT_TODAY_LABEL} · xem tổng quan toàn bộ vị trí ở{' '}
        <b className="text-ink/70">Slot occupancy</b>.
      </p>
    </div>
  )
}

/** One stat in a swimlane header — dimmed at zero so a row of noughts stays quiet. */
function Stat({ n, label, tone }: { n: number; label: string; tone?: 'rose' | 'emerald' }) {
  return (
    <span className="text-[11px]">
      <b className={cn('tabular-nums', n === 0 ? 'text-ink/25' : tone === 'rose' ? 'text-rose-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-ink/80')}>{n}</b>{' '}
      <span className={cn(n === 0 && 'text-faint')}>{label}</span>
    </span>
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
