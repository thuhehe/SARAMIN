import { Fragment, useState } from 'react'
import { cn } from '@/lib/utils'
import { BOARD_ADS, BOARD_PLACEMENTS, BOARD_ROWS, BOARD_TODAY_LABEL, byStartDesc, daysTo, phaseOf } from '@/pages/admin/data/slotBoard'
import type { AdPhase, BoardAd, BoardPage, BoardPlacement, BoardRow } from '@/pages/admin/data/slotBoard'
import { Pill } from '@/pages/admin/ui/status'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Boosting — one page, two tabs ────────────────────────────────────────────
   Thu, 16/10/2026: the Boosting list and Slot occupancy become ONE page, the
   Boosting page that already exists in the build, split into two tabs:

     Ads           the current Boosting list, unchanged — one row per banner/popup,
                   filters Type · Status · Placement, sorted by Starts (newest first)
     By placement  one row per Display placement: Placement · Preview · Showing now ·
                   Waiting. Expand a row for its showing + waiting ads; "View all"
                   switches to the Ads tab with the Placement filter set — the same
                   thing `/content/boosting?placement=<id>` does today.

   The two tabs read the same ads; nothing is stored for the second one. */
type Tab = 'ads' | 'placements'

export function AdminBoosting() {
  const [tab, setTab] = useState<Tab>('ads')
  const [placement, setPlacement] = useState('')

  /* "View all" on the By placement tab = this tab, filtered. One list, not a
     second page and not a modal. */
  const viewAll = (placementId: string) => {
    setPlacement(placementId)
    setTab('ads')
  }

  const url = tab === 'placements' ? '/content/boosting?tab=placements' : `/content/boosting${placement ? `?placement=${placement}` : ''}`

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] text-faint">{url}</p>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Banners and popups on the jobseeker site — every paid, free and house placement in one list.
          </p>
        </div>
        <button className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ New</button>
      </div>

      <div className="mb-3 flex items-end gap-1 border-b border-line">
        <TabBtn on={tab === 'ads'} onClick={() => setTab('ads')} label="Ads" count={BOARD_ADS.length} />
        <TabBtn on={tab === 'placements'} onClick={() => setTab('placements')} label="By placement" count={BOARD_PLACEMENTS.length} />
        <span className="mb-1.5 ml-auto rounded-md border border-line bg-canvas/60 px-2 py-0.5 text-[10.5px] text-muted">
          As of <b className="tabular-nums text-ink/80">{BOARD_TODAY_LABEL}</b>
        </span>
      </div>

      {tab === 'ads'
        ? <AdsTab placement={placement} setPlacement={setPlacement} />
        : <PlacementsTab onViewAll={viewAll} />}
    </div>
  )
}

function TabBtn({ on, onClick, label, count }: { on: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        '-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors',
        on ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
      )}
    >
      {label}
      <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', on ? 'bg-brand-soft text-brand' : 'bg-canvas text-faint')}>{count}</span>
    </button>
  )
}

/* ── Tab 1 · Ads — the Boosting list as built ─────────────────────────────── */
const PHASE_TONE: Record<AdPhase, StatusTone> = { Draft: 'draft', Scheduled: 'schedule', Open: 'open', Closed: 'closed' }
const PLACEMENT_NAME = new Map(BOARD_PLACEMENTS.map((p) => [p.id, p.name]))

function AdsTab({ placement, setPlacement }: { placement: string; setPlacement: (v: string) => void }) {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [phase, setPhase] = useState('')

  const rows = [...BOARD_ADS].sort(byStartDesc).filter((a) =>
    (!q || [a.name, a.purpose ?? '', a.company].join(' ').toLowerCase().includes(q.toLowerCase()))
    && (!kind || a.kind === kind)
    && (!phase || phaseOf(a) === phase)
    && (!placement || a.placement === placement))

  const cols = 'grid-cols-[52px_1.7fr_0.6fr_1.5fr_1fr_0.7fr_0.55fr_0.75fr_0.85fr_32px]'
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search banners and popups"
          className="w-[240px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] outline-none focus:border-brand"
        />
        <Select value={kind} onChange={setKind} options={[['', 'All types'], ['Banner', 'Banner'], ['Popup', 'Popup']]} />
        <Select value={phase} onChange={setPhase} options={[['', 'All statuses'], ['Draft', 'Draft'], ['Scheduled', 'Scheduled'], ['Open', 'Open'], ['Closed', 'Closed']]} />
        <Select
          value={placement}
          onChange={setPlacement}
          on={!!placement}
          options={[['', 'All placements'], ...BOARD_PLACEMENTS.map((p) => [p.id, p.name] as [string, string])]}
        />
        {placement && (
          <button onClick={() => setPlacement('')} className="text-[11px] text-muted hover:text-ink">Clear</button>
        )}
        <span className="ml-auto text-[11px] text-faint">{rows.length} ads</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <div className="min-w-[980px]">
          <div className={cn('grid gap-x-3 bg-canvas/60 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted', cols)}>
            <span>Image</span><span>Name</span><span>Type</span><span>Placement</span><span>Source</span>
            <span>Status</span><span>Visible</span><span>Starts ↓</span><span>Ends</span><span />
          </div>
          {rows.map((a) => {
            const ph = phaseOf(a)
            return (
              <div key={a.id} className={cn('grid items-center gap-x-3 border-t border-line-soft px-3 py-2 text-[11.5px]', cols)}>
                <Thumb kind={a.kind} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink/90">{a.name}</span>
                  {a.purpose && <span className="block truncate text-[10.5px] text-faint">{a.purpose}</span>}
                </span>
                <span><Pill tone={a.kind === 'Popup' ? 'schedule' : 'neutral'}>{a.kind}</Pill></span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px]">{PLACEMENT_NAME.get(a.placement)}</span>
                  {a.placement === 'placement_company_page_top' && <span className="block text-[10px] text-faint">Every company page</span>}
                </span>
                <span className="min-w-0">
                  {a.source === 'Internal' ? <Pill tone="neutral">Internal</Pill> : <Pill tone="active">Customer</Pill>}
                  {a.source === 'Customer' && <span className="mt-0.5 block truncate text-[10px] text-faint">{a.company}</span>}
                </span>
                <span><Pill tone={PHASE_TONE[ph]}>{ph}</Pill></span>
                <span className={cn('text-[11px]', a.visible ? 'text-emerald-700' : 'text-faint')}>{a.visible ? 'Yes' : 'No'}</span>
                <span className="tabular-nums text-[11px] text-muted">{a.start}</span>
                <span className="tabular-nums text-[11px] text-muted">{a.end ?? (a.start === '—' ? '—' : 'No end date')}</span>
                <span className="text-center text-muted">⋯</span>
              </div>
            )
          })}
          {rows.length === 0 && <p className="border-t border-line-soft px-3 py-8 text-center text-[12px] text-faint">No ads match.</p>}
        </div>
      </div>
    </div>
  )
}

function Select({ value, onChange, options, on }: { value: string; onChange: (v: string) => void; options: [string, string][]; on?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('max-w-[260px] rounded-lg border bg-surface px-2 py-1.5 text-[12px] outline-none', on ? 'border-brand text-brand' : 'border-line text-ink/80')}
    >
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function Thumb({ kind }: { kind: BoardAd['kind'] }) {
  return (
    <span className="grid h-10 w-10 place-items-center rounded bg-gradient-to-br from-slate-200 to-slate-300 text-[8px] text-slate-500">
      {kind === 'Popup' ? 'popup' : 'img'}
    </span>
  )
}

/* ── Tab 2 · By placement ─────────────────────────────────────────────────────
   One row per Display placement: what is on screen now and what is waiting.
   Everything is derived from the Placements registry and the ads. */
function PlacementsTab({ onViewAll }: { onViewAll: (placementId: string) => void }) {
  const rows = BOARD_ROWS()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set(['placement_jobseeker_job_detail_banner']))
  const [preview, setPreview] = useState<BoardPlacement | null>(null)

  const shown = rows.filter((r) => {
    const hay = [r.placement.name, r.placement.key, r.placement.id, r.placement.pageLabel].join(' ').toLowerCase()
    return !q || hay.includes(q.toLowerCase())
  })
  const toggle = (id: string) => setOpen((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search placement…"
          className="w-[240px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] outline-none focus:border-brand"
        />
        <span className="ml-auto text-[11px] text-faint">{shown.length} of {rows.length} placements</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-[12px]">
          <thead>
            <tr className="bg-canvas/60 text-left text-[10.5px] font-semibold uppercase tracking-wide text-muted">
              <th className="w-8 px-2 py-2" />
              <Th label="Placement" hint="name" w="w-[30%]" />
              <Th label="Preview" hint="reference image" w="w-[150px]" />
              <Th label="Showing now" hint="Open + Visible on" w="w-[14%]" />
              <Th label="Waiting" hint="Scheduled — start date ahead" />
              <th className="w-[110px] px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const isOpen = open.has(r.placement.id)
              return (
                <Fragment key={r.placement.id}>
                  <tr className={cn('border-t border-line-soft align-top', isOpen && 'bg-brand-soft/40')}>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => toggle(r.placement.id)}
                        aria-expanded={isOpen}
                        title={isOpen ? 'Collapse' : 'Show the ads showing and waiting'}
                        className="grid h-6 w-6 place-items-center rounded-md border border-line text-[11px] text-muted hover:border-ink/40 hover:text-ink"
                      >
                        {isOpen ? '▾' : '▸'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => toggle(r.placement.id)} className="block text-left font-medium text-ink hover:text-brand">
                        {r.placement.name}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      {r.placement.hasReference ? (
                        <button onClick={() => setPreview(r.placement)} title="Open the reference image" className="block rounded-md border border-line p-0.5 hover:border-brand">
                          <PageSketch page={r.placement.page} placementKey={r.placement.key} w={128} />
                        </button>
                      ) : (
                        <span className="grid h-[82px] w-[132px] place-items-center rounded-md border border-dashed border-line px-2 text-center text-[10px] leading-snug text-faint">
                          No reference image — add one on Placements
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <b className={cn('block text-[16px] tabular-nums', r.showing.length === 0 ? 'text-rose-600' : 'text-ink')}>{r.showing.length}</b>
                      {r.hidden.length > 0 && (
                        <span className="mt-0.5 block text-[10.5px] text-amber-700" title="Open but Visible = Off — not on screen, but still holds a slide">
                          + {r.hidden.length} hidden (Visible off)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <b className={cn('text-[16px] tabular-nums', r.waiting.length === 0 ? 'text-ink/30' : 'text-ink')}>{r.waiting.length}</b>
                      <span className="block text-[10.5px] text-muted">
                        {r.waiting.length === 0 ? 'nothing booked ahead' : `next starts ${r.waiting[0].start.slice(0, 5)} · ${r.waiting[0].company}`}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => onViewAll(r.placement.id)} className="whitespace-nowrap text-[11.5px] font-medium text-brand hover:underline">
                        View all ({r.all.length}) →
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-brand-soft/40">
                      <td />
                      <td colSpan={5} className="px-3 pb-4">
                        <ExpandedAds row={r} onViewAll={() => onViewAll(r.placement.id)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {shown.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-[12px] text-faint">No placement matches.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        <b className="text-ink/70">Showing now</b> = status Open and Visible on ·{' '}
        <b className="text-ink/70">Waiting</b> = status Scheduled · <b className="text-ink/70">View all</b> opens the Ads
        tab filtered to that placement — Draft and Closed ads included.
      </p>

      {preview && <PreviewModal p={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function Th({ label, hint, w }: { label: string; hint: string; w?: string }) {
  return (
    <th className={cn('px-3 py-2 align-bottom', w)}>
      {label}
      <span className="block text-[9.5px] font-normal normal-case tracking-normal text-faint">{hint}</span>
    </th>
  )
}

/* Expanded row: what is showing and what is waiting on one placement. */
function ExpandedAds({ row, onViewAll }: { row: BoardRow; onViewAll: () => void }) {
  const ads = [...row.showing, ...row.hidden, ...row.waiting]
  const cols = 'grid-cols-[44px_1.7fr_1.3fr_0.75fr_1.35fr_0.8fr_0.5fr_0.8fr]'
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="text-[11.5px] font-semibold text-ink/80">
          Showing now {row.showing.length} · Hidden {row.hidden.length} · Waiting {row.waiting.length}
        </span>
        <button onClick={onViewAll} className="text-[11px] font-medium text-brand hover:underline">
          View all {row.all.length} ads, closed included →
        </button>
      </div>
      {ads.length === 0 ? (
        <p className="px-3 py-5 text-center text-[11.5px] text-faint">Nothing showing and nothing waiting on this placement.</p>
      ) : (
        <div>
          <div className={cn('grid gap-x-3 bg-canvas/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted', cols)}>
            <span>Image</span><span>Name</span><span>Company · order</span><span>Source</span><span>Starts → Ends</span>
            <span>Days</span><span>Visible</span><span>Status</span>
          </div>
          {ads.map((a) => {
            const ph = phaseOf(a)
            const d = daysTo(a)
            return (
              <div key={a.id} className={cn('grid items-center gap-x-3 border-t border-line-soft px-3 py-2 text-[11.5px]', cols, !a.visible && 'text-ink/60')}>
                <span className="grid h-7 w-10 place-items-center rounded bg-gradient-to-br from-slate-200 to-slate-300 text-[8px] text-slate-500">{a.kind === 'Popup' ? 'popup' : 'img'}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink/85">{a.name}</span>
                  <span className="block font-mono text-[9.5px] text-faint">{a.id}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{a.company}</span>
                  <span className="block truncate text-[10px] text-faint">{a.order}</span>
                </span>
                <span>{a.source === 'Internal' ? <Pill tone="neutral">Internal</Pill> : <Pill tone="active">Customer</Pill>}</span>
                <span className="tabular-nums text-[11px] text-muted">{a.start} → {a.end ?? 'no end date'}</span>
                <span className="text-[11px]">
                  {ph === 'Scheduled'
                    ? <span className="text-violet-700">starts in {d} d</span>
                    : d === null ? <span className="text-muted">no end</span> : <span className={cn(d <= 7 ? 'font-medium text-amber-700' : 'text-muted')}>{d === 0 ? 'last day' : `${d} d left`}</span>}
                </span>
                <span className={cn('text-[11px]', a.visible ? 'text-emerald-700' : 'font-medium text-amber-700')} title={a.visible ? '' : 'Hidden from visitors — still holds a slide'}>
                  {a.visible ? 'Yes' : 'No'}
                </span>
                <span><Pill tone={PHASE_TONE[ph]}>{ph}</Pill></span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PreviewModal({ p, onClose }: { p: BoardPlacement; onClose: () => void }) {
  return (
    <Overlay onClose={onClose} width="max-w-[640px]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <h3 className="text-[14px] font-bold tracking-tight text-ink">{p.name}</h3>
          <p className="text-[11px] text-muted">{p.pageLabel} · {p.size === 'any' ? 'any size' : `${p.size} px`} · reference image</p>
        </div>
        <button onClick={onClose} className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-ink/40">Close</button>
      </div>
      <div className="p-5">
        <PageSketch page={p.page} placementKey={p.key} w={590} />
        <p className="mt-2 text-[11px] text-faint">
          In the build this is the placement's <b className="text-ink/70">Reference image</b>, uploaded on Product settings →
          Placements. The wireframe draws the page instead, with the placement highlighted.
        </p>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose, width }: { children: React.ReactNode; onClose: () => void; width: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={onClose}>
      <div className={cn('my-4 w-full rounded-2xl border border-line bg-surface shadow-2xl', width)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

/* ── The page, drawn small, with the placement lit up ─────────────────────────
   Stands in for the reference image. Grey boxes are the page; the brand-coloured
   box is where this placement's banner renders. */
type R = [number, number, number, number]
const SPOT: Record<string, R> = {
  BANNER_SLOT_2: [0, 0, 160, 5],
  BANNER_SLOT_1: [10, 18, 82, 34],
  BANNER_SLOT_3: [10, 62, 140, 6],
  HOME_POPUP: [52, 26, 56, 46],
  SEARCH_PAGE_BANNER: [118, 20, 34, 40],
  JOBSEEKER_JOB_DETAIL_BANNER: [12, 74, 98, 9],
  JOBSEEKER_MY_DASHBOARD_BANNER: [56, 18, 50, 18],
  COMPANY_PAGE_TOP: [10, 40, 140, 8],
  CO_HOME_TOP_STRIP: [10, 16, 100, 7],
  CO_HOME_MID_STRIP: [10, 52, 140, 6],
  CO_HOME_RAIL_BANNER: [118, 26, 32, 18],
  CO_HOME_RECOMMEND_RAIL: [118, 48, 32, 26],
  CO_HOME_SERVICE_PROMO: [10, 64, 100, 14],
  CO_CANDIDATE_MANAGEMENT_LEFT_BANNER: [6, 58, 30, 16],
}
const BASE: Record<BoardPage, R[]> = {
  home: [[10, 18, 82, 34], [96, 18, 54, 34], [10, 56, 140, 4], [10, 62, 140, 6], [10, 72, 44, 18], [58, 72, 44, 18], [106, 72, 44, 18]],
  search: [[10, 20, 102, 12], [10, 36, 102, 12], [10, 52, 102, 12], [10, 68, 102, 12], [118, 20, 34, 40]],
  'job-detail': [[12, 18, 98, 8], [12, 30, 98, 40], [116, 18, 34, 52], [12, 74, 98, 9], [12, 86, 98, 8]],
  'my-page': [[8, 18, 42, 70], [56, 18, 50, 18], [110, 18, 42, 18], [56, 40, 96, 22], [56, 66, 96, 22]],
  company: [[10, 14, 140, 22], [10, 40, 140, 8], [10, 52, 96, 36], [110, 52, 40, 36]],
  'co-home': [[10, 16, 100, 7], [10, 26, 104, 22], [10, 52, 140, 6], [10, 64, 100, 14], [118, 26, 32, 18], [118, 48, 32, 26]],
  'co-candidate': [[6, 16, 30, 38], [6, 58, 30, 16], [40, 16, 114, 10], [40, 30, 114, 58]],
}

function PageSketch({ page, placementKey, w }: { page: BoardPage; placementKey: string; w: number }) {
  const spot = SPOT[placementKey]
  const popup = placementKey === 'HOME_POPUP'
  const co = page.startsWith('co-')
  return (
    <svg viewBox="0 0 160 100" width={w} height={(w * 100) / 160} className="block rounded bg-white" role="img" aria-label={`${placementKey} on the ${page} page`}>
      <rect x="0" y="0" width="160" height="100" fill="#f8fafc" />
      <rect x="0" y={placementKey === 'BANNER_SLOT_2' ? 5 : 0} width="160" height="10" fill={co ? '#e0e7ff' : '#e2e8f0'} />
      <rect x="6" y={placementKey === 'BANNER_SLOT_2' ? 8 : 3} width="18" height="4" rx="1" fill="#94a3b8" />
      {BASE[page].map(([x, y, ww, h], i) => (
        <rect key={i} x={x} y={y} width={ww} height={h} rx="1.5" fill="#e2e8f0" />
      ))}
      {popup && <rect x="0" y="0" width="160" height="100" fill="#0f172a" opacity="0.35" />}
      {spot && (
        <rect x={spot[0]} y={spot[1]} width={spot[2]} height={spot[3]} rx="1.5" fill="#2563eb" fillOpacity={popup ? 1 : 0.85} stroke="#1d4ed8" strokeWidth="0.8" />
      )}
    </svg>
  )
}
