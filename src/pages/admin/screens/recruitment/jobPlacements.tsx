import { Fragment, useState } from 'react'
import { cn } from '@/lib/utils'
import { JOB_PLACEMENTS, JP_TODAY_LABEL, PLACED_JOBS, jobPlacementRows, jpDays, jpPhaseOf } from '@/pages/admin/data/jobPlacements'
import type { JobPlacement, JpPhase, JpRow, JpSpot, PlacedJob } from '@/pages/admin/data/jobPlacements'
import { Pill } from '@/pages/admin/ui/status'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Job list → Placement tab ─────────────────────────────────────────────────
   The Boosting "By placement" tab, applied to jobs (17/10/2026): one row per paid
   job placement on the Home page and the Search page's top section, with what is
   running there now and what starts next. It replaces the CS sheet "Super Hot Job
   Today / Job Highlight". Expanded rows carry the sheet's columns; View all opens
   the Jobs tab filtered to that placement, finished runs included. */
const PHASE_TONE: Record<JpPhase, StatusTone> = { Scheduled: 'schedule', Open: 'open', Closed: 'closed' }
const TAG_STYLE: Record<PlacedJob['tag'], string> = {
  'Paid package': 'bg-rose-50 text-rose-700 border-rose-200',
  Gift: 'bg-amber-50 text-amber-700 border-amber-200',
  'CS Support': 'bg-sky-50 text-sky-700 border-sky-200',
}

export function JobPlacementsTab({ onViewAll }: { onViewAll: (placementId: string) => void }) {
  const rows = jobPlacementRows()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Set<string>>(() => new Set(rows.map((r) => r.placement.id)))
  const [page, setPage] = useState<'' | 'Home' | 'Search'>('')

  const shown = rows.filter((r) =>
    (!page || r.placement.page === page)
    && (!q || [r.placement.name, r.placement.id, ...r.all.flatMap((j) => [j.jobId, j.title, j.company, j.companyId])].join(' ').toLowerCase().includes(q.toLowerCase())))
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
          placeholder="Search placement, job ID, title, company…"
          className="w-[280px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] outline-none focus:border-brand"
        />
        <select
          value={page}
          onChange={(e) => setPage(e.target.value as typeof page)}
          className={cn('rounded-lg border bg-surface px-2 py-1.5 text-[12px] outline-none', page ? 'border-brand text-brand' : 'border-line text-ink/80')}
        >
          <option value="">All pages</option>
          <option value="Home">Home</option>
          <option value="Search">Search</option>
        </select>
        <span className="inline-flex overflow-hidden rounded-lg border border-line bg-surface text-[11.5px] font-medium">
          <button onClick={() => setOpen(new Set(rows.map((r) => r.placement.id)))} className="px-2.5 py-1.5 text-ink/80 hover:bg-canvas">Expand all</button>
          <button onClick={() => setOpen(new Set())} className="border-l border-line px-2.5 py-1.5 text-ink/80 hover:bg-canvas">Collapse all</button>
        </span>
        <span className="ml-auto rounded-md border border-line bg-canvas/60 px-2 py-0.5 text-[10.5px] text-muted">
          As of <b className="tabular-nums text-ink/80">{JP_TODAY_LABEL}</b>
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[1080px] border-collapse text-[12px]">
          <thead>
            <tr className="bg-canvas/60 text-left text-[10.5px] font-semibold uppercase tracking-wide text-muted">
              <th className="w-8 px-2 py-2" />
              <Th label="Placement" hint="name · products that land here" w="w-[30%]" />
              <Th label="Preview" hint="reference image" w="w-[150px]" />
              <Th label="Showing now" hint="jobs running here today" w="w-[14%]" />
              <Th label="Waiting" hint="starts later" />
              <th className="w-[90px] px-3 py-2" />
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
                        title={isOpen ? 'Collapse' : 'Show the jobs showing and waiting'}
                        className="grid h-6 w-6 place-items-center rounded-md border border-line text-[11px] text-muted hover:border-ink/40 hover:text-ink"
                      >
                        {isOpen ? '▾' : '▸'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => toggle(r.placement.id)} className="block text-left font-medium text-ink hover:text-brand">{r.placement.name}</button>
                      <span className="block text-[10.5px] text-faint">fed by {r.placement.fedBy}</span>
                    </td>
                    <td className="px-3 py-3">
                      {r.placement.hasReference ? (
                        <span className="block w-fit rounded-md border border-line p-0.5"><JobPageSketch spot={r.placement.spot} w={128} /></span>
                      ) : (
                        <span className="grid h-[82px] w-[132px] place-items-center rounded-md border border-dashed border-line px-2 text-center text-[10px] leading-snug text-faint">
                          No reference image — add one on Placements
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <b className={cn('block text-[16px] tabular-nums', r.showing.length === 0 ? 'text-rose-600' : 'text-ink')}>{r.showing.length}</b>
                    </td>
                    <td className="px-3 py-3">
                      <b className={cn('text-[16px] tabular-nums', r.waiting.length === 0 ? 'text-ink/30' : 'text-ink')}>{r.waiting.length}</b>
                      <span className="block text-[10.5px] text-muted">
                        {r.waiting.length === 0 ? 'nothing starts later' : `next starts ${r.waiting[0].activated.slice(0, 5)} · ${r.waiting[0].company}`}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => onViewAll(r.placement.id)} className="whitespace-nowrap text-[11.5px] font-medium text-brand hover:underline">View all</button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-brand-soft/40">
                      <td />
                      <td colSpan={5} className="px-3 pb-4">
                        <ExpandedJobs row={r} />
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
        A job is in a placement because the <b className="text-ink/70">product it was published with covers that
        placement</b> — nobody books a job into a band by hand. <b className="text-ink/70">Showing now</b> = running here
        today · <b className="text-ink/70">Waiting</b> = starts later · <b className="text-ink/70">View all</b> opens the
        Jobs tab filtered to that placement, finished runs included.
      </p>
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

/* The sheet's columns: STT · ID Job · Title · Phân loại · Ngày kích hoạt · Ngày hết
   hạn · Số ngày còn lại · Tên công ty — plus Company ID and Status. */
const COLS = 'grid-cols-[32px_74px_2fr_104px_86px_86px_70px_92px_1.5fr_84px]'
function ExpandedJobs({ row }: { row: JpRow }) {
  const jobs = [...row.showing, ...row.waiting]
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="text-[11.5px] font-semibold text-ink/80">Showing now {row.showing.length} · Waiting {row.waiting.length}</span>
      </div>
      {jobs.length === 0 ? (
        <p className="px-3 py-5 text-center text-[11.5px] text-faint">No job is running here and none starts later.</p>
      ) : (
        <JobGrid jobs={jobs} />
      )}
    </div>
  )
}

function JobGrid({ jobs }: { jobs: PlacedJob[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px]">
        <div className={cn('grid gap-x-3 bg-canvas/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted', COLS)}>
          <span>#</span><span>Job ID</span><span>Title</span><span>Internal tag</span><span>Activated</span><span>Expires</span>
          <span>Days left</span><span>Company ID</span><span>Company</span><span>Status</span>
        </div>
        {jobs.map((j, i) => {
          const ph = jpPhaseOf(j)
          const d = jpDays(j)
          return (
            <div key={j.jobId + j.placement} className={cn('grid items-center gap-x-3 border-t border-line-soft px-3 py-2 text-[11.5px]', COLS, ph === 'Closed' && 'text-ink/55')}>
              <span className="tabular-nums text-muted">{i + 1}</span>
              <span className="font-mono text-[11px] text-brand hover:underline">{j.jobId}</span>
              <span className="min-w-0 truncate font-medium text-ink/85" title={j.title}>{j.title}</span>
              <span><span className={cn('inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10.5px] font-medium', TAG_STYLE[j.tag])}>{j.tag}</span></span>
              <span className="tabular-nums text-muted">{j.activated}</span>
              <span className="tabular-nums text-muted">{j.expires}</span>
              <span className="tabular-nums">
                {ph === 'Scheduled'
                  ? <span className="text-violet-700">in {d} d</span>
                  : ph === 'Closed' ? <span className="text-faint">—</span>
                    : <span className={cn('font-medium', d <= 3 ? 'text-rose-600' : 'text-sky-700')}>{d === 0 ? 'last day' : d}</span>}
              </span>
              <span className="font-mono text-[10.5px]">{j.companyId}</span>
              <span className="min-w-0 truncate" title={j.company}>{j.company}</span>
              <span><Pill tone={PHASE_TONE[ph]}>{ph}</Pill></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Jobs tab, filtered to one placement — every run there, finished ones included. */
export function JobsInPlacement({ placementId, onClear }: { placementId: string; onClear: () => void }) {
  const p = JOB_PLACEMENTS.find((x) => x.id === placementId) as JobPlacement
  const order: Record<JpPhase, number> = { Open: 0, Scheduled: 1, Closed: 2 }
  const jobs = PLACED_JOBS.filter((j) => j.placement === placementId).sort((a, b) => order[jpPhaseOf(a)] - order[jpPhaseOf(b)])
  return (
    <div>
      <p className="mb-1 font-mono text-[10.5px] text-faint">/recruitment/jobs?placement={placementId}</p>
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11.5px]">
        <span className="rounded-full border border-brand bg-brand-soft px-2.5 py-0.5 text-brand">Placement: {p.name}</span>
        <button onClick={onClear} className="text-muted hover:text-ink">Clear</button>
        <span className="ml-auto text-faint">{jobs.length} jobs</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <JobGrid jobs={jobs} />
      </div>
    </div>
  )
}

/* ── The page, drawn small, with the band lit up — stands in for the reference image. */
type R = [number, number, number, number]
const HOME_BASE: R[] = [[10, 16, 70, 30], [84, 16, 66, 30], [10, 50, 140, 20], [10, 74, 140, 10], [10, 88, 140, 8]]
const JP_SPOT: Record<JpSpot, R> = {
  'hot-plus': [10, 50, 44, 20],
  hot: [58, 50, 92, 20],
  top: [10, 74, 92, 10],
  distinction: [106, 74, 44, 10],
  recommended: [84, 16, 66, 30],
  highlight: [10, 88, 140, 8],
  'top-search': [10, 16, 104, 16],
}
function JobPageSketch({ spot, w }: { spot: JpSpot; w: number }) {
  const search = spot === 'top-search'
  const base: R[] = search ? [[10, 16, 104, 16], [10, 36, 104, 12], [10, 52, 104, 12], [10, 68, 104, 12], [118, 16, 32, 64]] : HOME_BASE
  const s = JP_SPOT[spot]
  return (
    <svg viewBox="0 0 160 100" width={w} height={(w * 100) / 160} className="block rounded bg-white" role="img" aria-label={`${spot} on the ${search ? 'search' : 'home'} page`}>
      <rect x="0" y="0" width="160" height="100" fill="#f8fafc" />
      <rect x="0" y="0" width="160" height="10" fill="#e2e8f0" />
      <rect x="6" y="3" width="18" height="4" rx="1" fill="#94a3b8" />
      {base.map(([x, y, ww, h], i) => <rect key={i} x={x} y={y} width={ww} height={h} rx="1.5" fill="#e2e8f0" />)}
      <rect x={s[0]} y={s[1]} width={s[2]} height={s[3]} rx="1.5" fill="#2563eb" fillOpacity={0.85} stroke="#1d4ed8" strokeWidth="0.8" />
    </svg>
  )
}
