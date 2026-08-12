/*
 * Admin page prototypes — realistic (mock-data) previews for the HQ Admin shell.
 *
 * Keyed by the nav item's `specId`. The wireframe's content area renders the
 * matching prototype when one exists, else falls back to the generic skeleton.
 * Everything here is mock content laid out to VN-market recruitment standards —
 * structure & data shape only, not final visual design.
 */
import { createContext, isValidElement, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { BenefitsField, BenefitCards } from '@/components/BenefitsField'
import { benefitByKey, BENEFIT_TYPES } from '@/data/benefits'
import { WorkingLocationsField } from '@/components/WorkingLocationsField'
import { LogoSizer } from '@/components/LogoSizer'

/* The benefit types declared on the COMPANY page. Every job of that company
   inherits them read-only, so a posting only ever writes what is specific to the
   position — one source of truth, two renderings. */
const COMPANY_BENEFITS = ['health', 'leave', 'transport', 'canteen', 'training', 'trips']

/* ── Detail breadcrumb ───────────────────────────────────────────────────────
   A detail view publishes its own crumb (and the way back) up to the admin shell,
   so the breadcrumb reads "CRM / Companies / Đại Dương" and IS the way back. That
   replaces the per-page "← Back to X" button: one navigation affordance, in the
   place every admin console puts it, instead of two that can disagree. */
export type DetailCrumb = { label: string; onBack: () => void }
export const DetailCrumbCtx = createContext<(c: DetailCrumb | null) => void>(() => {})

/** Publish this detail view's crumb for as long as it is mounted. */
export function useDetailCrumb(label: string, onBack: () => void) {
  const set = useContext(DetailCrumbCtx)
  const cb = useRef(onBack)
  cb.current = onBack
  useEffect(() => {
    set({ label, onBack: () => cb.current() })
    return () => set(null)
  }, [label, set])
}

/* Cross-page record links. A quotation opened from the Purchase-order list must
   land on the QUOTATIONS page, not render inside Purchase order — otherwise the
   breadcrumb reads "CRM / Purchase order / QUO-…", naming the wrong module for
   the record you are looking at, and Back returns to the wrong list. So the link
   asks the shell to switch pages and pass the record to open. */
export const ScreenNavCtx = createContext<(specId: string, record?: string) => void>(() => {})
/** The record the shell wants this page to open on arrival, if any. */
export const OpenRecordCtx = createContext<string | null>(null)
/* The page title row owns the primary create action, so the shell has to be able
   to trigger a create that REPLACES the page (company, job) as well as one that
   opens a modal. A bumped counter is the signal; the page decides what to do. */
export const CreateSignalCtx = createContext(0)

/* ── Read-only record ─────────────────────────────────────────────────────────
   A rep can REACH a colleague's company through search (that is what stops
   duplicates being created) but may not ACT on it. Carried as context rather than
   a prop threaded through eight components: the detail page is deep, and a new
   button added to a nested card would otherwise quietly stay writable.

   Read stays fully open — every tab, every figure. Only WRITE is withdrawn, and
   the way back is an explicit reassignment, not a silent edit. */
const ReadOnlyCtx = createContext(false)
const useReadOnly = () => useContext(ReadOnlyCtx)
/** Uniform reason text, so every disabled control explains itself the same way. */
const RO_HINT = 'Chỉ đọc — công ty này do sales khác phụ trách. Yêu cầu chuyển giao để chỉnh sửa.'

/* ── shared bits ──────────────────────────────────────────────────────────── */
type StatusTone = 'active' | 'pending' | 'expired' | 'rejected' | 'draft' | 'neutral' | 'open' | 'schedule' | 'closed'

const STATUS_TONE: Record<StatusTone, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  neutral: 'bg-sky-50 text-sky-700 border-sky-200',
  // job status model: Draft → Schedule → Open → Closed
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  schedule: 'bg-violet-50 text-violet-700 border-violet-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
}

function Pill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium', STATUS_TONE[tone])}>
      {children}
    </span>
  )
}

/* One search box per list, first control on the filter row. It matches against
   EVERY column's rendered text (see `cellText`), which is what people expect from a
   single box above a table — no field picker to learn, and no guessing which column
   a value lives in. */
function TableSearch({ q, onChange, placeholder, dropdown }: { q: string; onChange: (v: string) => void; placeholder?: string
  /** Results the TABLE cannot show, hung under the input as a transient panel.
      Anchored to the box on purpose: it is a property of the query, so it appears
      and disappears with the query rather than becoming a second list on the page. */
  dropdown?: React.ReactNode }) {
  return (
    <div className="relative shrink-0">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-faint"></span>
      <input
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search all columns…'}
        className="w-[210px] rounded-lg border border-line bg-surface py-1 pl-7 pr-7 text-[11.5px] outline-none transition-[width,border-color] focus:w-[280px] focus:border-brand"
      />
      {q && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-faint hover:text-ink"
        >
          ✕
        </button>
      )}
      {dropdown}
    </div>
  )
}

function TabBar({
  q,
  onQ,
  action,
  leading,
  filters,
  searchHint,
  searchScope,
  sort,
  outOfScope,
}: {
  q: string
  onQ: (v: string) => void
  /** the list's create button — on this row so a list never needs a header strip of its own */
  action?: React.ReactNode
  /** whatever the page wants in FRONT of the search box on the same row — the
      Sales view / Sales lead view switcher, for instance. */
  leading?: React.ReactNode
  /** filter controls, rendered on their own line under the search */
  filters?: React.ReactNode
  /** tells the reader what the box actually matches on this list */
  searchHint?: string
  /** scope control, rendered immediately after the box so the two read as one thing */
  searchScope?: React.ReactNode
  /** sort control — sits at the end of the filter row, where "how is this ordered?"
      is asked after "which rows?" */
  sort?: React.ReactNode
  /** panel hung under the search box when the query reaches records the table
      itself may not list */
  outOfScope?: React.ReactNode
}) {
  return (
    <div className="mb-3">
      {/* ONE row for the whole header: whatever the page puts in front (a view
          switcher), then Search · Filter · Sort, then the create action pushed to
          the right. Two rows for four controls spent a line of the page on
          alignment. No tab strip — status is one filter among several, so it lives
          in the Filter panel with the rest. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {leading}
        <TableSearch q={q} onChange={onQ} placeholder={searchHint} dropdown={outOfScope} />
        {searchScope}
        {filters}
        {/* Sort sits WITH the filters, not pushed to the far edge: narrowing a list
            and ordering it are the same job, and a control alone on the right reads
            as belonging to the table rather than to the toolbar. */}
        {sort}
        {action && <span className="ml-auto">{action}</span>}
      </div>
    </div>
  )
}

/** One filter control. Native select on purpose: it is keyboard- and mobile-correct
    for free, and a list page needs six of them without six popovers. */
function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const on = value !== ''
  return (
    <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
      <span className={on ? 'text-brand/70' : 'text-faint'}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('max-w-[130px] cursor-pointer bg-transparent text-[11.5px] outline-none', on ? 'font-medium text-brand' : 'text-ink')}
      >
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

/**
 * All the field filters behind ONE control, so the toolbar reads Search · Filter ·
 * Sort and nothing else. Five selects sitting open on the row cost a line of the
 * page permanently to serve a narrowing that happens occasionally — and the row
 * grew every time a filter was added. The button carries the active count, so the
 * fact that a list IS filtered stays visible with the panel closed.
 */
function FilterBar({ count, onClear, children, disabled }: { count: number; onClear: () => void; children?: React.ReactNode
  /** No column on this list is categorical — every value is unique, so there is
      nothing to narrow by. The control still renders, greyed with a reason: a
      toolbar that changes shape from page to page is harder to learn than one
      control that is occasionally unavailable. */
  disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  if (disabled) {
    return (
      <span title="Danh sách này không có cột nào để lọc — mọi giá trị đều khác nhau." className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1 text-[11.5px] font-medium text-faint">
        ▽ Filter <span>▾</span>
      </span>
    )
  }
  return (
    <span className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium', count > 0 ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:border-ink/30')}
      >
        ▽ Filter
        {count > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">{count}</span>}
        <span className="text-faint">▾</span>
      </button>
      {open && (
        <>
          {/* click-away, so the panel behaves like a menu rather than a thing you
              have to remember to close */}
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <span className="absolute left-0 top-full z-20 mt-1 block w-[260px] overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            <span className="flex items-center justify-between border-b border-line-soft bg-canvas/60 px-2.5 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Lọc danh sách</span>
              {count > 0 && <button onClick={onClear} className="text-[10.5px] font-medium text-brand hover:underline">Xoá tất cả</button>}
            </span>
            <span className="block space-y-2 p-2.5">{children}</span>
          </span>
        </>
      )}
    </span>
  )
}

/** One row inside the Filter panel — label above, full-width select. */
function FilterRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <span className="block">
      <span className="mb-0.5 block text-[10.5px] text-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('w-full cursor-pointer rounded-md border bg-surface px-2 py-1 text-[11.5px] outline-none focus:border-brand', value ? 'border-brand font-medium text-brand' : 'border-line text-ink')}
      >
        <option value="">Tất cả</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </span>
  )
}

function RowAction({ children, tone, title, onClick }: { children: React.ReactNode; tone?: 'brand' | 'rose' | 'amber' | 'muted'; title?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
        tone === 'brand'
          ? 'border-brand/30 bg-brand-soft text-brand hover:bg-brand hover:text-white'
          : tone === 'rose'
            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'
            : tone === 'amber'
              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white'
              : 'border-line text-muted hover:bg-canvas/70',
      )}
    >
      {children}
    </button>
  )
}

type Col = { label: string; w: string; align?: 'r' | 'c' }

function Table({ cols, rows, minW = 560, empty }: { cols: Col[]; rows: React.ReactNode[][]; minW?: number; empty?: string }) {
  const tmpl = cols.map((c) => c.w).join(' ')
  const alignCls = (a?: 'r' | 'c') => (a === 'r' ? 'text-right justify-end' : a === 'c' ? 'text-center justify-center' : '')
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <div style={{ gridTemplateColumns: tmpl, minWidth: minW }} className="grid gap-x-5 bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {cols.map((c, i) => <span key={i} className={alignCls(c.align)}>{c.label}</span>)}
      </div>
      {rows.map((r, ri) => (
        <div key={ri} style={{ gridTemplateColumns: tmpl, minWidth: minW }} className="grid gap-x-5 items-center border-t border-line-soft px-4 py-2.5 text-[12.5px]">
          {r.map((cell, ci) => (
            <span key={ci} className={cn('flex min-w-0 items-center gap-1.5 text-ink/80', alignCls(cols[ci]?.align))}>{cell}</span>
          ))}
        </div>
      ))}
      {rows.length === 0 && (
        <p className="border-t border-line-soft px-4 py-8 text-center text-[12px] text-muted">{empty ?? 'No rows.'}</p>
      )}
    </div>
  )
}

const PAGE_SIZES = [10, 20, 50, 100]

function Footer({ size, onSize }: { size: number; onSize: (n: number) => void }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <label className="flex items-center gap-1.5 text-[11.5px] text-muted">
        Rows per page
        <select
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
          className="rounded-md border border-line bg-surface px-1.5 py-1 text-[11.5px] text-ink outline-none focus:border-brand"
        >
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <div className="flex gap-1">
        {['1', '2', '3', '…', '12'].map((p) => (
          <span key={p} className={cn('grid h-6 min-w-6 place-items-center rounded border px-1 text-[11px]', p === '1' ? 'border-brand bg-brand text-white' : 'border-line text-muted')}>{p}</span>
        ))}
      </div>
    </div>
  )
}

/* Rendered text of a cell, so one search box can cover every column without each
   list having to hand over a parallel plain-text copy of its rows. */
function cellText(n: React.ReactNode): string {
  if (n === null || n === undefined || typeof n === 'boolean') return ''
  if (typeof n === 'string' || typeof n === 'number') return String(n)
  if (Array.isArray(n)) return n.map(cellText).join(' ')
  if (isValidElement(n)) return cellText((n.props as { children?: React.ReactNode }).children)
  return ''
}
/** lowercase + diacritics stripped, so "cong ty" finds "Công ty". */
const searchKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

function ListPage({ tabs, cols, rows, minW, action, leading, filters, searchHint, searchExtra, total, searchScope, sort, outOfScope }: { tabs?: { label: string; count?: number; active?: boolean }[]; cols: Col[]; rows: React.ReactNode[][]; minW?: number; action?: React.ReactNode; filters?: React.ReactNode; searchHint?: string
  /** sort control, rendered at the end of the filter row */
  sort?: React.ReactNode
  /** rendered in FRONT of the search box, on the same row */
  leading?: React.ReactNode
  /** per-row text the search should match but the table does not print — e.g. the
      company ID and MST. Without it a placeholder promising "search by ID" lies. */
  searchExtra?: string[]
  /** the unfiltered population, when `rows` has already been filtered by the page's
      own controls — so "Total" means the whole list, not what survived the filters. */
  total?: number
  /** rendered to the right of the search box — the scope control, when the page has
      more than one population to search. */
  searchScope?: React.ReactNode
  /** shown under the search when the CURRENT query has matches the current scope
      cannot reach. Without it a rep searches their own list, sees nothing, and
      creates a duplicate of a company that already exists under someone else. */
  outOfScope?: (q: string) => React.ReactNode }) {
  const [q, setQ] = useState('')
  const [size, setSize] = useState(20)
  /* Status filter + sort derived here rather than at 28 call sites. A list that
     passes its own `filters` / `sort` keeps them; everything else gets the same
     toolbar for free, which is the only way "every table looks the same" survives
     the next screen someone adds. */
  const [tabPick, setTabPick] = useState('')
  /** column index → chosen value, for the filters derived from the columns */
  const [colPick, setColPick] = useState<Record<number, string>>({})
  const [ord, setOrd] = useState<'none' | 'asc' | 'desc'>('none')

  const query = searchKey(q.trim())
  let matched = query
    ? rows.filter((r, i) => searchKey([r.map(cellText).join(' '), searchExtra?.[i] ?? ''].join(' ')).includes(query))
    : rows

  /* Tabs became a Status filter. The match runs on the row's RENDERED text — the
     same text the search box already reads — so no list has to hand over a parallel
     copy of its data just to be filterable. */
  const tabOpts = (tabs ?? []).map((t) => t.label).filter((l) => l.toLowerCase() !== 'all')
  if (tabPick) {
    const key = searchKey(tabPick)
    matched = matched.filter((r) => r.some((c) => searchKey(cellText(c)).trim() === key))
  }
  /* Options are read from the rows BEFORE the column filters apply — otherwise
     picking a value collapses its own dropdown to that one option and there is no
     way back. */
  const matchedBase = matched
  for (const [ci, v] of Object.entries(colPick)) {
    if (!v) continue
    matched = matched.filter((r) => cellText(r[Number(ci)]).trim() === v)
  }

  /* Generic ordering by the first column — the one a list is named by. "Mặc định"
     keeps the order the page chose, which is usually meaningful (newest first,
     most-idle first), so it stays the default and is always reachable again. */
  if (ord !== 'none') {
    const key = (r: React.ReactNode[]) => cellText(r[0]).trim().toLowerCase()
    matched = matched.slice().sort((a, b) => (ord === 'asc' ? 1 : -1) * key(a).localeCompare(key(b), 'vi'))
  }

  /* Columns worth filtering by, discovered from the rendered rows: a column whose
     values REPEAT and come from a small set is a category; one where every row
     differs is an identity or a number, and a dropdown of 40 unique values is not a
     filter. Column 0 is skipped — it is what the list is named by, which is what the
     search box is for. */
  /* Labels already spoken for — the tab-derived Status filter, most often. A second
     row called "Status" listing slightly different values is worse than no row. */
  const takenLabels = new Set(tabOpts.length > 0 ? ['status', 'trạng thái'] : [])
  const autoCols = cols
    .map((c, ci) => {
      if (ci === 0) return null
      const lower = c.label.trim().toLowerCase()
      if (takenLabels.has(lower)) return null
      takenLabels.add(lower)
      const vals = matchedBase.map((r) => cellText(r[ci]).trim()).filter(Boolean)
      const uniqVals = [...new Set(vals)]
      const ok = uniqVals.length >= 2 && uniqVals.length <= 8 && vals.length > uniqVals.length
        && uniqVals.every((v) => v.length <= 24 && !/^[\d.,\s₫%/-]+$/.test(v))
      return ok ? { label: c.label, ci, options: uniqVals.sort((a, b) => a.localeCompare(b, 'vi')) } : null
    })
    .filter(Boolean)
    .slice(0, 4) as { label: string; ci: number; options: string[] }[]

  const activeAuto = Object.values(colPick).filter(Boolean).length
  const derivedFilters = filters ?? ((tabOpts.length > 0 || autoCols.length > 0) ? (
    <FilterBar count={(tabPick ? 1 : 0) + activeAuto} onClear={() => { setTabPick(''); setColPick({}) }}>
      {tabOpts.length > 0 && <FilterRow label="Status" value={tabPick} onChange={setTabPick} options={tabOpts} />}
      {autoCols.map((c) => (
        <FilterRow
          key={c.ci}
          label={c.label}
          value={colPick[c.ci] ?? ''}
          onChange={(v) => setColPick((p) => ({ ...p, [c.ci]: v }))}
          options={c.options}
        />
      ))}
    </FilterBar>
  ) : <FilterBar count={0} onClear={() => {}} disabled />)

  const derivedSort = sort ?? (
    <label className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
      <span className="text-faint">Sắp xếp</span>
      <select
        value={ord}
        onChange={(e) => setOrd(e.target.value as 'none' | 'asc' | 'desc')}
        className="cursor-pointer bg-transparent text-[11.5px] font-medium text-ink outline-none"
      >
        <option value="none">Mặc định</option>
        <option value="asc">{cols[0]?.label ?? 'A'} A → Z</option>
        <option value="desc">{cols[0]?.label ?? 'A'} Z → A</option>
      </select>
    </label>
  )

  return (
    <div>
      <TabBar q={q} onQ={setQ} action={action} leading={leading} filters={derivedFilters} searchHint={searchHint} searchScope={searchScope} sort={derivedSort} outOfScope={q.trim() ? outOfScope?.(q.trim()) : null} />
      {/* Result count sits directly on top of the table it describes — how many rows
          the current search/filters left, against the whole list. */}
      <p className="mb-1.5 text-[11px] text-faint">
        Search <b className="font-semibold text-ink/70 tabular-nums">{matched.length}</b>
        {' / '}Total <b className="font-semibold text-ink/70 tabular-nums">{total ?? rows.length}</b>
      </p>
      <Table cols={cols} rows={matched.slice(0, size)} minW={minW} empty={`No rows match “${q.trim()}”.`} />
      <Footer size={size} onSize={setSize} />
    </div>
  )
}

function StatCards({ cards, row }: { cards: { label: string; value: string; delta?: string; up?: boolean }[]; row?: boolean }) {
  return (
    <div className={cn('grid gap-3', row ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4')}>
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl border border-line p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{c.label}</p>
          <p className="mt-1 text-[20px] font-bold tracking-tight tabular-nums">{c.value}</p>
          {c.delta && <p className={cn('mt-0.5 text-[11.5px] font-medium', c.up ? 'text-emerald-600' : 'text-rose-600')}>{c.up ? '▲' : '▼'} {c.delta}</p>}
        </div>
      ))}
    </div>
  )
}

function Bars({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-end gap-3" style={{ height: 140 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-medium text-muted tabular-nums">{d.value}{unit}</span>
            <div className="w-full rounded-t bg-brand/80" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 border-t border-line-soft pt-2">
        {data.map((d, i) => <span key={i} className="flex-1 text-center text-[10.5px] text-faint">{d.label}</span>)}
      </div>
    </div>
  )
}

/* ── Recruitment ──────────────────────────────────────────────────────────── */
type JobRow = { id: string; title: string; category: string; company: string; source: 'Company' | 'Admin'; product: string; status: StatusTone; statusLabel: string; exposure: 'On' | 'Off'; posted: string; deadline: string; views: number; saves: number; applicants: number }
const JOB_ROWS: JobRow[] = [
  { id: 'JOB-2116', title: 'Senior Frontend Engineer (ReactJS)', category: 'CNTT - Phần mềm', company: 'FPT Software', source: 'Company', product: 'Basic', status: 'draft', statusLabel: 'Draft', exposure: 'Off', posted: '—', deadline: '31/08/2026', views: 0, saves: 0, applicants: 0 },
  { id: 'JOB-2117', title: 'Kế toán tổng hợp', category: 'Kế toán - Kiểm toán', company: 'VNG Corporation', source: 'Company', product: 'Free', status: 'schedule', statusLabel: 'Schedule', exposure: 'Off', posted: '01/09/2026', deadline: '20/09/2026', views: 0, saves: 0, applicants: 0 },
  { id: 'JOB-2109', title: 'Digital Marketing Lead', category: 'Marketing - Truyền thông', company: 'Tiki', source: 'Admin', product: 'Distinction', status: 'open', statusLabel: 'Open', exposure: 'On', posted: '15/07/2026', deadline: '15/09/2026', views: 1240, saves: 86, applicants: 42 },
  { id: 'JOB-2101', title: 'Product Manager', category: 'Sản phẩm - Dự án', company: 'MoMo', source: 'Company', product: 'Basic plus', status: 'open', statusLabel: 'Open', exposure: 'On', posted: '05/07/2026', deadline: '05/09/2026', views: 890, saves: 54, applicants: 18 },
  { id: 'JOB-2098', title: 'Nhân viên kinh doanh', category: 'Kinh doanh - Bán hàng', company: 'Thế Giới Di Động', source: 'Company', product: 'Free', status: 'open', statusLabel: 'Open', exposure: 'Off', posted: '20/07/2026', deadline: '28/08/2026', views: 320, saves: 12, applicants: 7 },
  { id: 'JOB-2040', title: 'Backend Engineer (Go)', category: 'CNTT - Phần mềm', company: 'Shopee', source: 'Company', product: 'Top Job', status: 'closed', statusLabel: 'Closed', exposure: 'Off', posted: '01/04/2026', deadline: '01/07/2026', views: 2150, saves: 143, applicants: 61 },
  { id: 'JOB-2001', title: 'Thực tập sinh Nhân sự', category: 'Nhân sự', company: 'Base.vn', source: 'Company', product: 'Free', status: 'draft', statusLabel: 'Draft', exposure: 'Off', posted: '—', deadline: '—', views: 0, saves: 0, applicants: 0 },
]
/* The create form as a screen in its own right, so the "Create job (Admin)" spec
   page can show the form instead of the list it is reached from. Back returns to
   the list — the same thing it does inside the console. */
function AdminJobCreateStandalone() {
  const [backToList, setBackToList] = useState(false)
  if (backToList) return <AdminJobList />
  return <AdminJobCreate onBack={() => setBackToList(true)} />
}

function AdminJobList() {
  const [creating, setCreating] = useState(false)
  const [detail, setDetail] = useState<JobRow | null>(null)
  if (creating) return <AdminJobCreate onBack={() => setCreating(false)} />
  if (detail) return <AdminJobDetail job={detail} onBack={() => setDetail(null)} />
  return (
    <div>
    <ListPage
      action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New job</button>}
      minW={1400}
      tabs={[{ label: 'All', count: 1248 }, { label: 'Draft', count: 8 }, { label: 'Schedule', count: 5, active: true }, { label: 'Open', count: 1180 }, { label: 'Closed', count: 58 }]}
      cols={[
        { label: 'Job title', w: '1.7fr' },
        { label: 'Job ID', w: '0.8fr' },
        { label: 'Category', w: '1fr' },
        { label: 'Company', w: '1.1fr' },
        { label: 'Product', w: '0.9fr' },
        { label: 'Created by', w: '0.8fr' },
        { label: 'Status', w: '0.9fr' },
        { label: 'Exposure', w: '0.7fr' },
        { label: 'Posted', w: '0.8fr', align: 'r' },
        { label: 'Expires', w: '0.8fr', align: 'r' },
        { label: 'Views', w: '0.6fr', align: 'r' },
        { label: 'Saves', w: '0.6fr', align: 'r' },
        { label: 'Applied', w: '0.7fr', align: 'r' },
      ]}
      rows={JOB_ROWS.map((r) => [
        <button onClick={() => setDetail(r)} className="min-w-0 text-left"><p className="truncate font-medium text-brand hover:underline">{r.title}</p></button>,
        <span className="font-mono text-[11px] text-muted">{r.id}</span>,
        <span className="truncate text-muted">{r.category}</span>,
        <span className="truncate">{r.company}</span>,
        <span className="rounded border border-line px-1.5 py-0.5 text-[10.5px] text-ink/70">{r.product}</span>,
        <Pill tone={r.source === 'Admin' ? 'neutral' : 'draft'}>{r.source}</Pill>,
        <Pill tone={r.status}>{r.statusLabel}</Pill>,
        r.status === 'open'
          ? <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-medium', r.exposure === 'On' ? 'text-emerald-600' : 'text-slate-400')}><span className={cn('h-1.5 w-1.5 rounded-full', r.exposure === 'On' ? 'bg-emerald-500' : 'bg-slate-300')} />{r.exposure}</span>
          : <span className="text-[11.5px] text-faint">—</span>,
        <span className="tabular-nums text-muted">{r.posted}</span>,
        <span className="tabular-nums text-muted">{r.deadline}</span>,
        <span className="tabular-nums">{r.views.toLocaleString('en-US')}</span>,
        <span className="tabular-nums">{r.saves.toLocaleString('en-US')}</span>,
        <span className="tabular-nums font-medium text-brand">{r.applicants || '—'}</span>,
      ])}
    />
    </div>
  )
}

/** Text that opens a detail page in a new tab (wireframe affordance). */
function ExtLink({ children }: { children: React.ReactNode }) {
  return (
    <a target="_blank" rel="noopener noreferrer" title="Opens in a new tab" className="min-w-0 truncate text-brand hover:underline">
      {children}
    </a>
  )
}

/* A CV is always shown as the candidate NAMED it, plus the kind it is — the two
   things HQ needs to know at a glance. Never the tag alone: "Saramin CV" with no
   name gives the screener nothing to recognise the document by. */
function CvCell({ label, kind }: { label: string; kind: 'saramin' | 'upload' }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="min-w-0 truncate text-ink/80">{kind === 'saramin' ? '' : ''} {label}</span>
      {kind === 'saramin'
        ? <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Saramin CV</span>
        : <span className="shrink-0 rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">Uploaded</span>}
      <a target="_blank" rel="noopener noreferrer" className="shrink-0 text-brand hover:underline">View</a>
    </span>
  )
}

/* stage is a plain string + its own tone so the list can FILTER on it — a
   pre-rendered <Pill> is unfilterable. Same shape as CoApplicant below. */
/*
 * Status model v2 — an application carries TWO status dimensions and the admin
 * list must show both, because they are owned by different people:
 *
 *   status (Layer 2, HQ-owned)   Sent · Recalled · Blocked
 *   stage  (Layer 3, company-owned, read-only here)
 *                                New → Reviewing → Shortlisted → Interview → Hired / Rejected
 *
 * Layer 1 (screening) is dormant: every application is written `passed` at apply
 * and it is never displayed, so there is no column for it.
 */
type Delivery = 'Sent' | 'Recalled' | 'Blocked'

const DELIVERY_TONE: Record<Delivery, StatusTone> = {
  Sent: 'neutral',
  Recalled: 'draft',
  Blocked: 'rejected',
}

/* The employer funnel, in order. Tones run cool → warm → resolved so the column
   reads as progress at a glance. */
const STAGE_TONE: Record<string, StatusTone> = {
  New: 'draft',
  Reviewing: 'neutral',
  Shortlisted: 'schedule',
  Interview: 'pending',
  Hired: 'active',
  Rejected: 'rejected',
}

type Applicant = { name: string; role: string; years: string; loc: string; edu: string; job: string; company: string; cv: [string, 'saramin' | 'upload']; status: Delivery; stage: string; when: string }

/* Applicant detail under status model v2. There is NO pre-send gate any more:
   the employer already has this CV, so HQ cannot approve or reject it. What is
   left is oversight — read the same information the employer sees, then either
   pull it back (Recall) or shut the whole account off (Block). The quality
   checks stay on screen as LABELS: they inform, they never block. */
function ApplicantDetail({ name, status, onClose }: { name: string; status: Delivery; onClose: () => void }) {
  const [decision, setDecision] = useState<'none' | 'recall' | 'block'>('none')
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-10">
      <div className="flex max-h-[600px] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
              {name}
              <Pill tone={DELIVERY_TONE[status]}>{status}</Pill>
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              Senior Frontend Engineer · FPT Software · applied 2h ago · CV: <b className="font-semibold text-ink/80">Frontend Engineer CV</b>
              <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Saramin CV</span>
            </p>
          </div>
          <span className="cursor-pointer text-faint" onClick={onClose}>✕</span>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          {/* CV under review */}
          <div className="rounded-lg border border-line bg-canvas/30 p-4">
            <p className="text-[13px] font-bold text-ink">{name}</p>
            <p className="mb-2 text-[11px] text-muted">Frontend Engineer · Hồ Chí Minh · 4 yrs</p>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Experience</p>
            <p className="text-[11px] text-ink">Frontend Engineer · Zenpay · 2022–nay</p>
            <p className="mb-2 text-[11px] text-muted">Web Developer · Lantern Digital · 2020–2022</p>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Skills</p>
            <p className="text-[11px] text-ink">React · TypeScript · Next.js · Tailwind · Testing</p>
            <p className="mt-2 text-[10.5px] text-faint">Opening the full CV is a PII action and is audited.</p>
          </div>
          {/* labels + the two oversight actions */}
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Labels · never blocking</p>
              <div className="space-y-1">
                {([['Độ phù hợp', '86% — skills & years fit'], ['Mức hoàn thiện hồ sơ', '3 / 4'], ['Kênh liên hệ', 'Email + phone'], ['Nguồn dữ liệu', 'Saramin CV']] as [string, string][]).map(([k, v]) => (
                  <p key={k} className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="text-faint">{k}</span><b className="font-semibold text-ink/80">{v}</b>
                  </p>
                ))}
              </div>
              <p className="mt-1.5 text-[10.5px] text-faint">These inform the employer’s decision. None of them stops a CV from being sent.</p>
            </div>
            {decision === 'recall' && (
              <div>
                <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-600">Recall this application</p>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                  The employer was emailed at apply time — that email cannot be un-sent. Recall removes the CV from their dashboard and notifies them to ignore it. Terminal: the candidate must apply again.
                </p>
              </div>
            )}
            {decision === 'block' && (
              <div>
                <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-rose-500">Block reason (required, audited)</p>
                <div className="space-y-1">
                  {['Fraudulent / fake identity', 'Abusive behaviour', 'Duplicate accounts', 'Other (note required)'].map((r, i) => (
                    <label key={r} className={cn('flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]', i === 0 ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-line text-muted')}>{r}</label>
                  ))}
                </div>
                <p className="mt-1.5 text-[10.5px] font-medium text-rose-600">Whole user: blocks future applies and recalls all 7 sent applications across every job.</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <span className="text-[10.5px] text-faint">No approve / reject — the employer already has this CV. Every action is audited.</span>
          <div className="flex shrink-0 gap-2 whitespace-nowrap">
            {decision === 'none' ? (
              <>
                <RowAction>Note</RowAction>
                <RowAction>Edit</RowAction>
                <button onClick={() => setDecision('block')} className="rounded-lg border border-rose-300 px-3 py-1.5 text-[12.5px] font-semibold text-rose-600">Block user…</button>
                <button onClick={() => setDecision('recall')} className="rounded-lg bg-amber-500 px-3 py-1.5 text-[12.5px] font-semibold text-white">Recall…</button>
              </>
            ) : (
              <>
                <button onClick={() => setDecision('none')} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold text-muted">Cancel</button>
                <button onClick={onClose} className={cn('rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white', decision === 'block' ? 'bg-rose-500' : 'bg-amber-500')}>
                  {decision === 'block' ? 'Confirm block user' : 'Confirm recall'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminApplicants() {
  const [open, setOpen] = useState<Applicant | null>(null)
  const [fStatus, setFStatus] = useState('')
  const [fStage, setFStage] = useState('')
  const [fCompany, setFCompany] = useState('')
  const [fLoc, setFLoc] = useState('')
  const [fCv, setFCv] = useState('')
  const raw: Applicant[] = [
    { name: 'Nguyễn Văn An', role: 'Frontend Engineer', years: '4 yrs', loc: 'Hồ Chí Minh', edu: "Bachelor · CS", job: 'Senior Frontend Engineer', company: 'FPT Software', cv: ['Frontend Engineer CV', 'saramin'], status: 'Sent', stage: 'Reviewing', when: '2h ago' },
    { name: 'Trần Thị Bích', role: 'Digital Marketing Specialist', years: '6 yrs', loc: 'Hà Nội', edu: 'Bachelor · Marketing', job: 'Digital Marketing Lead', company: 'Tiki', cv: ['bich-portfolio.pdf', 'upload'], status: 'Sent', stage: 'Interview', when: '5h ago' },
    { name: 'Lê Hoàng Cường', role: 'Senior Product Manager', years: '8 yrs', loc: 'Hồ Chí Minh', edu: 'Master · MBA', job: 'Product Manager', company: 'MoMo', cv: ['Product Manager CV', 'saramin'], status: 'Sent', stage: 'Hired', when: '1d ago' },
    { name: 'Phạm Thu Dung', role: 'General Accountant', years: '3 yrs', loc: 'Đà Nẵng', edu: 'Bachelor · Accounting', job: 'Kế toán tổng hợp', company: 'VNG', cv: ['thu-dung-cv.pdf', 'upload'], status: 'Sent', stage: 'New', when: '1d ago' },
    { name: 'Vũ Minh Đức', role: 'Backend Engineer', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · SE', job: 'Backend Engineer (Go)', company: 'Shopee', cv: ['Backend Engineer CV', 'saramin'], status: 'Sent', stage: 'Rejected', when: '3d ago' },
    { name: 'Đặng Thị Hoa', role: 'Product Designer', years: '4 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · Design', job: 'UI/UX Designer', company: 'One Mount', cv: ['hoa-portfolio.pdf', 'upload'], status: 'Sent', stage: 'New', when: '3d ago' },
    { name: 'Bùi Quang Huy', role: 'Data Analyst', years: '2 yrs', loc: 'Hà Nội', edu: 'Bachelor · Statistics', job: 'Data Analyst', company: 'Techcombank', cv: ['Data Analyst CV', 'saramin'], status: 'Recalled', stage: 'Reviewing', when: '4d ago' },
    { name: 'Ngô Thị Lan', role: 'HR Generalist', years: '7 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · HRM', job: 'HR Business Partner', company: 'Grab', cv: ['lan-cv.docx', 'upload'], status: 'Sent', stage: 'Interview', when: '4d ago' },
    { name: 'Hoàng Văn Nam', role: 'DevOps Engineer', years: '6 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · CS', job: 'DevOps Engineer', company: 'VNG', cv: ['DevOps Engineer CV', 'saramin'], status: 'Sent', stage: 'New', when: '5d ago' },
    { name: 'Trịnh Mỹ Linh', role: 'Content Writer', years: '3 yrs', loc: 'Hà Nội', edu: 'Bachelor · Journalism', job: 'Content Marketing', company: 'Base.vn', cv: ['my-linh.pdf', 'upload'], status: 'Blocked', stage: 'New', when: '5d ago' },
    { name: 'Đỗ Anh Tú', role: 'iOS Developer', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · SE', job: 'Mobile Engineer (iOS)', company: 'MoMo', cv: ['iOS Developer CV', 'saramin'], status: 'Sent', stage: 'Shortlisted', when: '6d ago' },
    { name: 'Lý Thu Trang', role: 'QA Engineer', years: '4 yrs', loc: 'Đà Nẵng', edu: 'Bachelor · IT', job: 'QA Engineer', company: 'FPT Software', cv: ['trang-qa.pdf', 'upload'], status: 'Sent', stage: 'Interview', when: '6d ago' },
    { name: 'Phan Văn Kiên', role: 'Sales Executive', years: '3 yrs', loc: 'Hồ Chí Minh', edu: 'College · Business', job: 'Sales Executive', company: 'Thế Giới Di Động', cv: ['Sales Executive CV', 'saramin'], status: 'Sent', stage: 'New', when: '1w ago' },
    { name: 'Võ Thị Ngọc', role: 'Business Analyst', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · IS', job: 'Business Analyst', company: 'Shopee', cv: ['ngoc-cv.pdf', 'upload'], status: 'Sent', stage: 'Shortlisted', when: '1w ago' },
    { name: 'Mai Đức Thắng', role: 'Solution Architect', years: '10 yrs', loc: 'Hồ Chí Minh', edu: 'Master · CS', job: 'Solution Architect', company: 'Techcombank', cv: ['Solution Architect CV', 'saramin'], status: 'Sent', stage: 'Hired', when: '1w ago' },
  ]
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'vi'))
  const cvKind = (a: Applicant) => (a.cv[1] === 'saramin' ? 'Saramin CV' : 'Uploaded file')
  // the filter row narrows the list; ListPage still searches on top of the result
  const shown = raw.filter(
    (a) =>
      (!fStatus || a.status === fStatus) &&
      (!fStage || a.stage === fStage) &&
      (!fCompany || a.company === fCompany) &&
      (!fLoc || a.loc === fLoc) &&
      (!fCv || cvKind(a) === fCv),
  )
  const rows = shown.map((a) => [
    <span onClick={() => setOpen(a)} className="min-w-0 cursor-pointer truncate text-brand hover:underline">{a.name}</span>,
    <div className="min-w-0">
      <p className="truncate text-ink/80">{a.role} · {a.years}</p>
      <p className="truncate text-[11px] text-faint">{a.loc} · {a.edu}</p>
    </div>,
    <ExtLink>{a.job}</ExtLink>,
    <ExtLink>{a.company}</ExtLink>,
    <CvCell label={a.cv[0]} kind={a.cv[1]} />,
    <Pill tone={DELIVERY_TONE[a.status]}>{a.status}</Pill>,
    /* Recalled and Blocked CVs are off the employer's dashboard, so their funnel
       stops moving — an em-dash says that better than a frozen badge would. */
    a.status === 'Sent'
      ? <Pill tone={STAGE_TONE[a.stage] ?? 'draft'}>{a.stage}</Pill>
      : <span className="text-faint" title="Off the employer dashboard — the funnel no longer applies">—</span>,
    <span className="text-muted">{a.when}</span>,
    /* Row actions are STATE-AWARE: an action that cannot apply is not rendered,
       so the row never offers a dead button. Recall is terminal, Block is
       user-level, and both open the detail for the reason + confirm step. */
    <div className="flex flex-wrap items-center justify-end gap-1">
      <RowAction title="Opens the CV in a viewer — audited" onClick={() => setOpen(a)}>CV</RowAction>
      {a.status === 'Sent' && (
        <RowAction tone="amber" title="Pull this CV off the employer’s dashboard — terminal" onClick={() => setOpen(a)}>Recall</RowAction>
      )}
      {a.status === 'Blocked' && (
        <RowAction tone="rose" title="Unblock this user and let them apply again" onClick={() => setOpen(a)}>Unblock</RowAction>
      )}
      <RowAction title="Edit · Note · Block user · Delivery history" onClick={() => setOpen(a)}>⋯</RowAction>
    </div>,
  ])
  return (
    <div>
      {/* The two dimensions are owned by different people, so the list names both
          owners once rather than leaving a reader to guess which badge is whose. */}
      <p className="mb-2.5 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
        <b className="font-semibold text-ink/80">Status</b> is Saramin’s — Sent on apply, then Recalled or Blocked by HQ.{' '}
        <b className="font-semibold text-ink/80">Stage</b> is the employer’s hiring funnel and is read-only here. There is no screening
        queue: an application is sent to the employer the moment it is submitted.
      </p>
      <ListPage
        minW={1700}
        /* rows are already narrowed by the filter row, so Total means every
           application HQ holds, not what survived the filters */
        total={raw.length}
        searchHint="Search candidate, job, company…"
        filters={
          <>
            <FilterSelect label="Status" value={fStatus} onChange={setFStatus} options={uniq(raw.map((a) => a.status))} />
            <FilterSelect label="Stage" value={fStage} onChange={setFStage} options={uniq(raw.map((a) => a.stage))} />
            <FilterSelect label="Company" value={fCompany} onChange={setFCompany} options={uniq(raw.map((a) => a.company))} />
            <FilterSelect label="Location" value={fLoc} onChange={setFLoc} options={uniq(raw.map((a) => a.loc))} />
            <FilterSelect label="CV" value={fCv} onChange={setFCv} options={uniq(raw.map(cvKind))} />
          </>
        }
        cols={[
          { label: 'Candidate', w: '1.1fr' },
          { label: 'Snapshot', w: '1.7fr' },
          { label: 'Applied to', w: '1.3fr' },
          { label: 'Company', w: '1fr' },
          { label: 'CV', w: '1.2fr' },
          { label: 'Status · Saramin', w: '0.9fr' },
          { label: 'Stage · employer', w: '0.9fr' },
          { label: 'Applied', w: '0.8fr', align: 'r' },
          { label: 'Actions', w: '1.4fr', align: 'r' },
        ]}
        rows={rows}
      />
      {open && <ApplicantDetail name={open.name} status={open.status} onClose={() => setOpen(null)} />}
    </div>
  )
}

/* Candidate detail — ONE candidate = one row in the pool; the drill-in shows
   their Profile summary + ALL their CVs (≤3, exactly one searchable) and the
   HQ moderation actions. HQ moderates; it never edits content or flips the
   candidate's own visibility consent. */
function ResumeCandidateDetail({ name, onClose }: { name: string; onClose: () => void }) {
  const cvs = [
    { label: 'Frontend Engineer CV', kind: 'Saramin CV · generated', searchable: true, updated: '2 days ago', complete: '92%' },
    { label: 'Fullstack CV (EN)', kind: 'Uploaded · CV_An_EN.pdf', searchable: false, updated: '1 week ago', complete: '81%' },
  ]
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-10">
      <div className="flex max-h-[600px] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-[14px] font-bold text-ink">{name}</p>
            <p className="text-[11px] text-muted">Frontend Engineer · Hồ Chí Minh · 4 yrs · <span className="text-emerald-600">Discoverable (candidate-set)</span></p>
          </div>
          <span className="cursor-pointer text-faint" onClick={onClose}>✕</span>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {/* profile summary — the searchable identity + preferences */}
          <div>
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Profile (onboarding data — feeds search)</p>
            <div className="grid gap-x-4 gap-y-1 rounded-lg border border-line p-3 text-[11.5px] sm:grid-cols-2">
              <p className="text-muted">Desired role: <b className="text-ink">Senior Frontend Engineer</b></p>
              <p className="text-muted">Locations: <b className="text-ink">HCMC · Hà Nội</b></p>
              <p className="text-muted">Experience: <b className="text-ink">4 yrs</b></p>
              <p className="text-muted">Expected salary: <b className="text-ink">25–35 tr</b></p>
              <p className="text-muted">Availability: <b className="text-ink">1 month</b></p>
              <p className="text-muted">Contact: <b className="text-ink">masked</b> <span className="cursor-pointer text-brand">reveal (audited)</span></p>
            </div>
          </div>
          {/* the candidate's CVs — max 3, exactly one searchable */}
          <div>
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">CVs ({cvs.length} of 3) — exactly one is searchable</p>
            <div className="space-y-2">
              {cvs.map((cv) => (
                <div key={cv.label} className={cn('flex items-center gap-3 rounded-lg border p-3', cv.searchable ? 'border-brand/40 bg-brand-soft/30' : 'border-line')}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[13px]"></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-ink">{cv.label} {cv.searchable && <Pill tone="active">Searchable</Pill>}</p>
                    <p className="text-[10.5px] text-faint">{cv.kind} · {cv.complete} complete · updated {cv.updated}</p>
                  </div>
                  <span className="cursor-pointer text-[11px] font-medium text-brand">Open (audited)</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">Which CV is searchable is the candidate’s choice — HQ cannot change it.</p>
          </div>
          {/* moderation — the only thing HQ owns here */}
          <div>
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Moderation (HQ-owned)</p>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="active">Normal</Pill>
              <button className="rounded-md border border-amber-300 px-2.5 py-1 text-[11px] font-medium text-amber-600">⚑ Flag for review…</button>
              <button className="rounded-md border border-rose-300 px-2.5 py-1 text-[11px] font-medium text-rose-600">Remove from pool…</button>
              <span className="text-[10.5px] text-faint">reason required · audited · never blocks the candidate from applying</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-line px-4 py-3"><button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink/70">Close</button></div>
      </div>
    </div>
  )
}

function AdminResumes() {
  const [creating, setCreating] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  if (creating) return <AdminResumeNew onBack={() => setCreating(false)} />
  const raw: [string, string, string, number, boolean, string][] = [
    // candidate, searchable-CV title/yrs, location, cv count, discoverable, updated
    ['Nguyễn Văn An', 'Frontend Engineer · 4 yrs', 'Hồ Chí Minh', 2, true, '2 days ago'],
    ['Trần Thị Bích', 'Digital Marketing · 6 yrs', 'Hà Nội', 1, true, '1 week ago'],
    ['Lê Hoàng Cường', 'Product Manager · 8 yrs', 'Hồ Chí Minh', 3, false, '3 weeks ago'],
    ['Phạm Thu Dung', 'Kế toán · 3 yrs', 'Đà Nẵng', 1, true, '1 month ago'],
    ['Vũ Minh Đức', 'Backend Engineer · 5 yrs', 'Hồ Chí Minh', 2, true, '2 months ago'],
  ]
  const rows = raw.map(([name, title, loc, count, disc, updated]) => [
    <span onClick={() => setSel(name)} className="min-w-0 cursor-pointer truncate text-brand hover:underline">{name}</span>,
    <span className="truncate text-ink/80">{title}</span>,
    loc,
    <span className="text-muted">{count} of 3</span>,
    disc ? <Pill tone="active">Discoverable</Pill> : <Pill tone="draft">Hidden</Pill>,
    <Pill tone="active">Normal</Pill>,
    <span className="text-muted">{updated}</span>,
  ])
  return (
    <div>
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">ONE row per candidate — the row shows their SEARCHABLE CV (what employer CV search reads). Open a candidate to see all their CVs (max 3). Resumes contain PII — every open is audited.</div>
      <ListPage
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New resume</button>}
        tabs={[{ label: 'All candidates', count: 8420, active: true }, { label: 'Discoverable', count: 6100 }, { label: 'Hidden', count: 2320 }, { label: 'Flagged', count: 14 }, { label: 'Removed from pool', count: 9 }]}
        cols={[
          { label: 'Candidate', w: '1.2fr' },
          { label: 'Searchable CV — title / exp', w: '1.6fr' },
          { label: 'Location', w: '0.9fr' },
          { label: 'CVs', w: '0.6fr' },
          { label: 'Visibility (candidate)', w: '1fr' },
          { label: 'Moderation (HQ)', w: '0.9fr' },
          { label: 'Updated', w: '0.9fr', align: 'r' },
        ]}
        rows={rows}
      />
      {sel && <ResumeCandidateDetail name={sel} onClose={() => setSel(null)} />}
    </div>
  )
}

/* ── Create resume (Admin) ────────────────────────────────────────────────────
   Two routes into ONE object, converging on the Saramin standard review screen:

     ① Upload CV  → CV Convert pipeline (parse → extract → AI tag → generate)
     ② Builder    → 4-step wizard (basics → headline & body → AI tags → preview)

   Neither route writes to the resume master. "Register to resume master" on the
   convergence screen is the only write in the whole flow, which is why switching
   paths or abandoning half-way costs nothing.

   The route decides only two things: `source` (IMPORT vs SELF_REGISTER) and the
   document set (Upload carries the original PDF too). Everything downstream —
   the review screen, the standard JSON, the matching keys — is identical. */

const CONVERT_STEPS = [
  { n: '①', title: 'Parse PDF', desc: 'Extract text and layout from the original CV.', ms: 1200 },
  { n: '②', title: 'Extract structured fields', desc: 'Map name, contact, experience, education, skills to the Saramin schema.', ms: 1500 },
  { n: '③', title: 'AI tag suggestions', desc: 'Suggest skill / role / domain tags. Reviewable by operators.', ms: 1800 },
  { n: '④', title: 'Generate Saramin-standard resume', desc: 'Create a new Saramin CV PDF from the standard template.', ms: 1400 },
]

/** The one canonical suggestion set, shared by the pipeline's step ③ and the
    Builder's tag step — so both routes visibly converge on identical tags. */
const SUGGESTED_TAGS: { kind: 'Skill' | 'Role' | 'Domain'; value: string; conf: number }[] = [
  { kind: 'Skill', value: 'React', conf: 0.97 },
  { kind: 'Skill', value: 'Next.js', conf: 0.94 },
  { kind: 'Skill', value: 'TypeScript', conf: 0.93 },
  { kind: 'Skill', value: 'Tailwind CSS', conf: 0.86 },
  { kind: 'Skill', value: 'GraphQL', conf: 0.78 },
  { kind: 'Role', value: 'Frontend Engineer', conf: 0.95 },
  { kind: 'Domain', value: 'E-commerce', conf: 0.82 },
]
/** Confidence at or above this auto-applies; below it goes to the operator queue. */
const AUTO_APPLY = 0.8

const EXTRACTED_FIELDS: [string, string][] = [
  ['Headline', 'Frontend Engineer | React + Next.js | 3y exp'],
  ['Location', 'Hà Nội, Việt Nam'],
  ['Experience', 'Tiki (2023.03~), Sendo (2022.01~2023.02)'],
  ['Education', 'HUST · B.S. Computer Science'],
]

/** Drives the pipeline on a timer: idle → running(0..3) → done. */
function useConvertProgress() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (phase !== 'running') return
    const cur = CONVERT_STEPS[step]
    if (!cur) return
    const t = setTimeout(() => {
      // The last step's timer flips to done, so the effect body stays free of a
      // synchronous setState.
      if (step + 1 >= CONVERT_STEPS.length) setPhase('done')
      else setStep((i) => i + 1)
    }, cur.ms)
    return () => clearTimeout(t)
  }, [phase, step])
  return {
    phase,
    step,
    start: () => { setPhase('running'); setStep(0) },
    reset: () => { setPhase('idle'); setStep(-1) },
  }
}

/* ── the standard model, as the prototype carries it ─────────────────────────── */
type StdExp = { company: string; position: string; location: string; startYm: string; endYm: string; areas: string; bullets: string[]; tech: string }
type StdEdu = { school: string; faculty: string; major: string; degree: string; startYm: string; endYm: string; gpa: string }
type StdLang = { language: string; cert: string; score: string; level: string }
type Prefs = {
  careerLevel: string; yearsOfExp: string; cats: string; empTypes: string
  locs: string; inds: string; salKind: string; salCur: string; salMin: string; salMax: string
  remoteOk: boolean; relocate: boolean; overseas: boolean
}
type Std = {
  nameVi: string; nameEn: string; nameKr: string; dob: string; gender: string
  email: string; phone: string; city: string; district: string; road: string
  sumVi: string; sumEn: string; sumKo: string
  experiences: StdExp[]; educations: StdEdu[]
  skills: { group: string; items: string }[]
  languages: StdLang[]
  certifications: { name: string; issuer: string; year: string; score: string }[]
  projects: { name: string; role: string; period: string; tech: string }[]
  awards: { name: string; year: string; issuer: string }[]
  references: { name: string; role: string; relation: string; phone: string }[]
  links: { kind: string; url: string }[]
  prefs: Prefs
  tags: { kind: string; value: string; conf: number }[]
}

const EMPTY_PREFS: Prefs = {
  careerLevel: 'ANY', yearsOfExp: '0', cats: '', empTypes: '', locs: '', inds: '',
  salKind: '', salCur: 'VND', salMin: '', salMax: '', remoteOk: false, relocate: false, overseas: false,
}

/** What the Upload route hands to the review screen — a fully-extracted resume. */
function importedStd(): Std {
  return {
    nameVi: 'Nguyễn Văn An', nameEn: 'Nguyen Van An', nameKr: '응우옌 반 안',
    dob: '1998-04-12', gender: 'M', email: 'nguyen.an@example.vn', phone: '+84 90 123 4567',
    city: 'Hà Nội', district: 'Cầu Giấy', road: 'Trần Thái Tông',
    sumVi: 'Frontend Engineer 3 năm kinh nghiệm với React, Next.js, TypeScript. Tập trung vào performance và DX cho hệ thống lớn.',
    sumEn: 'Frontend Engineer with 3 years of experience in React, Next.js, TypeScript. Focused on performance and DX at scale.',
    sumKo: 'React, Next.js, TypeScript 기반 프론트엔드 엔지니어 3년차. 대규모 서비스의 성능과 DX 개선에 집중합니다.',
    experiences: [
      { company: 'Tiki', position: 'Frontend Engineer', location: 'Hồ Chí Minh', startYm: '2023-03', endYm: '', areas: 'Storefront', tech: 'React, Next.js, TypeScript, Tailwind', bullets: ['Migrated the legacy jQuery checkout to React 18 + App Router', 'Owned the performance budget — cut TTI 35% on SKU listing', 'Mentored 2 juniors on Server Component patterns'] },
      { company: 'Sendo', position: 'Junior Web Developer', location: 'Hồ Chí Minh', startYm: '2022-01', endYm: '2023-02', areas: 'Admin', tech: 'Vue 3, Pinia, Vite', bullets: ['Built seller admin dashboards on Vue 3 + Pinia', 'Cut bundle size 28% via code-splitting'] },
    ],
    educations: [{ school: 'Hanoi University of Science and Technology', faculty: 'School of ICT', major: 'Computer Science', degree: 'BACHELOR', startYm: '2018-09', endYm: '2022-07', gpa: '3.4 / 4.0' }],
    skills: [
      { group: 'Frontend', items: 'React, Next.js, TypeScript, Tailwind, GraphQL' },
      { group: 'State & Data', items: 'Redux, TanStack Query, Zustand' },
      { group: 'Tools', items: 'Git, Figma, Vercel, Sentry' },
      { group: 'Soft skills', items: 'Mentoring, Cross-team collaboration' },
    ],
    languages: [
      { language: 'vi', cert: '', score: '', level: 'NATIVE' },
      { language: 'en', cert: 'TOEIC', score: '850', level: 'ADVANCED' },
      { language: 'ko', cert: 'TOPIK', score: '4급', level: 'INTERMEDIATE' },
    ],
    certifications: [
      { name: 'MOS Excel', issuer: 'Microsoft', year: '2021', score: '960' },
      { name: 'AWS Cloud Practitioner', issuer: 'Amazon', year: '2024', score: '' },
    ],
    projects: [{ name: 'Tiki Storefront PPR migration', role: 'Lead Frontend', period: '2024-04 → 2024-09', tech: 'Next.js, React Server Components' }],
    awards: [{ name: 'Best Performance Contribution Q3', year: '2024', issuer: 'Tiki' }],
    references: [{ name: 'Trần Minh Hiếu', role: 'Engineering Manager, Tiki', relation: 'Direct manager', phone: '+84 90 555 1234' }],
    links: [{ kind: 'github', url: 'https://github.com/nguyen-an' }, { kind: 'linkedin', url: 'https://linkedin.com/in/nguyen-an' }],
    prefs: {
      careerLevel: 'EXPERIENCED', yearsOfExp: '3', cats: 'Frontend Developer, Full-stack Developer',
      empTypes: 'FULL_TIME', locs: 'Hà Nội, Hồ Chí Minh', inds: 'E-commerce, SaaS',
      salKind: 'MONTHLY', salCur: 'VND', salMin: '30000000', salMax: '45000000',
      remoteOk: true, relocate: false, overseas: false,
    },
    tags: SUGGESTED_TAGS.filter((t) => t.conf >= AUTO_APPLY).map((t) => ({ kind: t.kind, value: t.value, conf: t.conf })),
  }
}

/** What the Builder route hands over: the typed free text folded into the model.
    Headline + body become the VI summary, location becomes the address city, and
    each checked tag becomes a Skill tag. Everything else starts EMPTY — which is
    why so many matching keys read Missing on this route. */
function builderStd(f: { fullName: string; email: string; phone: string; location: string; headline: string; body: string; tags: string[] }): Std {
  return {
    nameVi: f.fullName, nameEn: '', nameKr: '', dob: '', gender: '',
    email: f.email, phone: f.phone, city: f.location, district: '', road: '',
    sumVi: f.headline ? `${f.headline}\n\n${f.body}` : f.body, sumEn: '', sumKo: '',
    experiences: [], educations: [], skills: [], languages: [], certifications: [],
    projects: [], awards: [], references: [], links: [],
    prefs: { ...EMPTY_PREFS },
    tags: f.tags.map((value) => ({ kind: 'Skill', value, conf: 0.95 })),
  }
}

/* ── Job matching keys ────────────────────────────────────────────────────────
   Nine derived readiness indicators, named after the JOB-POSTING filters rather
   than the resume's own fields — because the question they answer is "which job
   filters can this resume be found by?". Recomputed on every keystroke, so a key
   flips to Ready as the operator fills the section that feeds it. */
function matchKeys(s: Std): { label: string; ready: boolean; preview: string }[] {
  const list = (csv: string) => csv.split(',').map((x) => x.trim()).filter(Boolean)
  const first3 = (csv: string) => list(csv).slice(0, 3).join(' · ') || '—'
  const p = s.prefs
  const edu = s.educations[0]
  const salReady = p.salKind === 'INTERVIEW' || p.salMin.trim() !== ''
  const workTypes = [p.remoteOk && 'remote', p.overseas && 'oversea'].filter(Boolean).join(' · ')
  return [
    { label: 'Job categories', ready: list(p.cats).length > 0, preview: first3(p.cats) },
    { label: 'Career', ready: p.careerLevel !== 'ANY' || Number(p.yearsOfExp) > 0, preview: p.careerLevel === 'EXPERIENCED' ? `${p.careerLevel} · ${p.yearsOfExp}y` : p.careerLevel },
    { label: 'Education', ready: !!edu, preview: edu ? `${edu.degree} · ${edu.school}` : '—' },
    { label: 'Industries', ready: list(p.inds).length > 0, preview: first3(p.inds) },
    { label: 'Language certs', ready: s.languages.length > 0, preview: s.languages.map((l) => [l.language, l.cert, l.score].filter(Boolean).join(':')).slice(0, 3).join(' · ') || '—' },
    { label: 'Salary', ready: salReady, preview: p.salKind === 'INTERVIEW' ? 'INTERVIEW' : p.salMin ? `${p.salMin}~${p.salMax || '?'} ${p.salCur}` : '—' },
    { label: 'Locations', ready: list(p.locs).length > 0, preview: first3(p.locs) },
    { label: 'Work types', ready: !!workTypes, preview: workTypes || '—' },
    { label: 'Willing to relocate', ready: p.relocate, preview: p.relocate ? 'Yes' : '—' },
  ]
}

/* ── small building blocks for the flow ──────────────────────────────────────── */

/** A labelled boxed value — the prototype's stand-in for a text input. */
function RField({ label, value, span }: { label: string; value?: string; span?: string }) {
  return (
    <div className={span}>
      <label className="mb-1 block text-[10.5px] font-medium text-ink/70">{label}</label>
      <div className={cn('min-h-[30px] rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px]', value ? 'text-ink/80' : 'text-faint')}>
        {value || '—'}
      </div>
    </div>
  )
}

/** One section of the standard resume on the review screen. */
function StdSection({ title, count, repeatable, children }: { title: string; count?: number; repeatable?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line-soft px-3.5 py-2">
        <h4 className="text-[12.5px] font-semibold text-ink">{title}</h4>
        {count != null && <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] tabular-nums text-faint">{count}</span>}
        {repeatable && <button className="ml-auto rounded-md border border-line px-2 py-0.5 text-[10.5px] text-muted hover:border-brand hover:text-brand">＋ Add item</button>}
      </header>
      <div className="space-y-3 p-3.5">{children}</div>
    </section>
  )
}

/** A repeatable entry inside a section, with its own remove affordance. */
function StdItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-lg border border-line-soft bg-canvas/30 p-3">
      <button className="absolute right-2 top-2 text-[10.5px] text-faint hover:text-rose-500">Remove</button>
      {children}
    </div>
  )
}

/** Confidence-scored tag chip. Checked state is the operator's decision, not the
    model's — the score only decides what arrives pre-checked. */
function TagChip({ kind, value, conf, checked, onClick }: { kind: string; value: string; conf: number; checked: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors',
        checked ? 'border-brand bg-brand-soft text-ink' : 'border-line bg-surface text-muted hover:text-ink',
      )}
    >
      <span className={cn('text-[9.5px]', checked ? 'text-brand' : 'text-faint')}>{checked ? '☑' : '☐'}</span>
      <span className="rounded bg-canvas px-1 text-[9px] uppercase tracking-wide text-faint">{kind}</span>
      <span className="font-medium">{value}</span>
      <span className={cn('rounded px-1 text-[9.5px] tabular-nums', conf >= AUTO_APPLY ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
        {(conf * 100).toFixed(0)}%
      </span>
    </button>
  )
}

/* ── the flow ────────────────────────────────────────────────────────────────── */

function AdminResumeNew({ onBack }: { onBack: () => void }) {
  useDetailCrumb('New resume', onBack)
  const [path, setPath] = useState<'picker' | 'upload' | 'builder' | 'review'>('picker')
  const [draft, setDraft] = useState<Std | null>(null)
  const [source, setSource] = useState<'IMPORT' | 'SELF_REGISTER'>('IMPORT')

  function handoff(std: Std, src: 'IMPORT' | 'SELF_REGISTER') {
    setDraft(std)
    setSource(src)
    setPath('review')
  }

  if (path === 'review' && draft) {
    return (
      <ResumeReview
        std={draft}
        setStd={setDraft as (s: Std) => void}
        source={source}
        onBack={() => setPath(source === 'IMPORT' ? 'upload' : 'builder')}
        onRegistered={onBack}
      />
    )
  }

  if (path === 'picker') {
    return (
      <div className="max-w-[860px]">
        <h2 className="text-[20px] font-bold tracking-tight">Two paths, one Saramin standard model</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Upload an existing CV or fill it in by hand — either path normalises to the same standard resume. Nothing is written to the
          resume master until you register on the review screen.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {([
            ['① Upload CV', 'Upload CV (PDF / DOC / DOCX)', 'AI parses and converts the file into the Saramin standard format. Carries the original PDF alongside the generated one.', 'upload'],
            ['② Fill by hand', 'CV Builder wizard', 'Step-by-step form for basics · headline & body · tags, ending on the same standard resume. No original file.', 'builder'],
          ] as const).map(([badge, title, desc, target]) => (
            <div key={target} className="flex flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-[15px]">{target === 'upload' ? '' : ''}</span>
                <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">{badge}</span>
              </div>
              <p className="mt-3 text-[13.5px] font-semibold text-ink">{title}</p>
              <p className="mt-1 flex-1 text-[11.5px] leading-relaxed text-muted">{desc}</p>
              <button onClick={() => setPath(target)} className="mt-3 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Use this path</button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-faint">
          The route decides only two things: <b>source</b> (Upload → IMPORT, Builder → SELF_REGISTER) and which CV documents exist.
          The review screen, the stored standard JSON and the register action are identical for both.
        </p>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setPath('picker')} className="mb-3 text-[11.5px] font-medium text-muted hover:text-brand">← Choose another path</button>
      {path === 'upload'
        ? <UploadRoute onContinue={() => handoff(importedStd(), 'IMPORT')} />
        : <BuilderRoute onContinue={(f) => handoff(builderStd(f), 'SELF_REGISTER')} />}
    </div>
  )
}

/** Registered as its own screen id so the spec page can show the create flow
    directly; Back returns to the list, the same thing it does in the console. */
function AdminResumeNewStandalone() {
  const [backToList, setBackToList] = useState(false)
  if (backToList) return <AdminResumes />
  return <AdminResumeNew onBack={() => setBackToList(true)} />
}

/* ── ① Upload route — file + CV Convert pipeline ─────────────────────────────── */

function UploadRoute({ onContinue }: { onContinue: () => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<{ name: string; kb: string } | null>(null)
  const { phase, step, start, reset } = useConvertProgress()

  // A stale pipeline result must never be shown against a new file, so any change
  // to the selection resets the run.
  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setFile(f ? { name: f.name, kb: (f.size / 1024).toFixed(1) } : null)
    reset()
  }
  function clear() {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    reset()
  }

  const shown = (i: number) => phase === 'done' || step >= i

  return (
    <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
      {/* left — file + step rail */}
      <aside className="space-y-3">
        <div className="rounded-xl border border-line bg-surface p-3.5">
          <h3 className="text-[12.5px] font-semibold">Upload original CV</h3>
          <p className="mt-0.5 text-[11px] text-faint">PDF · DOC · DOCX — max ~5 MB. Type and size are validated before upload.</p>
          {file ? (
            <div className="mt-3 flex items-center gap-2.5 rounded-md border border-line bg-canvas/40 p-2.5">
              <span className="text-[15px]"></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-medium text-ink">{file.name}</p>
                <p className="text-[10.5px] text-faint tabular-nums">{file.kb} KB</p>
              </div>
              <button
                onClick={clear}
                disabled={phase === 'running'}
                title={phase === 'running' ? 'Cannot change the file while the pipeline is running' : 'Remove'}
                className="rounded-md border border-line px-1.5 py-1 text-[10.5px] text-muted disabled:opacity-40"
              ></button>
            </div>
          ) : (
            <>
              <button onClick={() => fileRef.current?.click()} className="mt-3 flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-line bg-canvas/30 px-4 py-7 text-[11.5px] text-muted transition-colors hover:border-brand hover:text-ink">
                <span className="text-[18px]"></span>
                Choose file
              </button>
              {/* Prototype affordance only — the real console has just the file input.
                  A spec reviewer should not have to find a PDF on their machine to see
                  the pipeline, which is the part of this screen worth reviewing. */}
              <button onClick={() => setFile({ name: 'original-cv.pdf', kb: '184.2' })} className="mt-2 w-full text-[10.5px] text-faint underline hover:text-brand">
                or use a sample CV (prototype only)
              </button>
            </>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={pick} />
        </div>

        <ol className="space-y-2">
          {CONVERT_STEPS.map((s, i) => {
            const state = phase === 'done' || i < step ? 'done' : i === step && phase === 'running' ? 'active' : 'pending'
            return (
              <li key={s.title} className={cn('flex gap-2.5 rounded-lg border p-2.5', state === 'active' ? 'border-brand bg-brand-soft/40' : state === 'done' ? 'border-emerald-200 bg-emerald-50/50' : 'border-line bg-surface')}>
                <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold', state === 'active' ? 'bg-brand text-white' : state === 'done' ? 'bg-emerald-600 text-white' : 'bg-canvas text-faint')}>
                  {state === 'done' ? '✓' : state === 'active' ? '◍' : s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-medium text-ink">{s.title}</p>
                  <p className="text-[10.5px] leading-snug text-faint">{s.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>

        {phase === 'idle' && (
          <button onClick={start} disabled={!file} className="w-full rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-40">
            Start analysis
          </button>
        )}
        {phase === 'running' && (
          <button disabled className="w-full rounded-lg bg-brand/60 px-3 py-2 text-[12.5px] font-semibold text-white">◍ Processing…</button>
        )}
        {phase === 'done' && (
          <>
            <button onClick={onContinue} className="w-full rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Review &amp; edit extracted result →</button>
            <p className="text-[10.5px] leading-relaxed text-faint">The extracted fields and tags are carried to the review screen. Nothing is saved until you register there.</p>
          </>
        )}
        {phase === 'idle' && !file && (
          <p className="text-[10.5px] text-faint">The pipeline runs on an explicit start — pick a file first, so a wrong file can be swapped without watching a run you would discard.</p>
        )}
      </aside>

      {/* right — stage panel, one result card per completed step */}
      {phase === 'idle' ? (
        <section className="grid min-h-[420px] place-items-center rounded-xl border border-dashed border-line p-8 text-center">
          <div>
            <p className="text-[24px]"></p>
            <h3 className="mt-1 text-[14px] font-semibold">Normalise this CV into the Saramin standard model</h3>
            <p className="mx-auto mt-1 max-w-[420px] text-[11.5px] leading-relaxed text-muted">
              The pipeline parses the original PDF, extracts structured fields and searchable tags, and generates a new resume in the
              Saramin standard format. Every result is reviewable before anything is saved.
            </p>
            {file && <span className="mt-3 inline-block rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] text-muted">{file.name}</span>}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          {shown(0) && (
            <ResultCard title="PDF parsing result" active={step === 0 && phase === 'running'} done={phase === 'done' || step > 0}>
              <pre className="overflow-x-auto rounded-md bg-canvas/60 p-3 font-mono text-[10.5px] leading-relaxed text-muted">{`original-cv.pdf · 1 page · 312 tokens
  ├─ Frontend Engineer · Tiki  (2023.03 – present)
  ├─ Junior Web Developer · Sendo  (2022.01 – 2023.02)
  ├─ HUST · B.S. Computer Science (2018 – 2022)
  └─ Skills: React, TS, Next.js, Tailwind, GraphQL, PG`}</pre>
            </ResultCard>
          )}
          {shown(1) && (
            <ResultCard title="Structured fields" active={step === 1 && phase === 'running'} done={phase === 'done' || step > 1}>
              <dl className="grid gap-2 sm:grid-cols-2">
                {EXTRACTED_FIELDS.map(([k, v]) => (
                  <div key={k} className="rounded-md border border-line bg-surface p-2.5">
                    <dt className="text-[9.5px] uppercase tracking-wide text-faint">{k}</dt>
                    <dd className="mt-0.5 text-[11.5px] text-ink/80">{v}</dd>
                  </div>
                ))}
              </dl>
            </ResultCard>
          )}
          {shown(2) && (
            <ResultCard title="AI suggested tags" active={step === 2 && phase === 'running'} done={phase === 'done' || step > 2}>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((t) => (
                  <TagChip key={t.value} kind={t.kind} value={t.value} conf={t.conf} checked={t.conf >= AUTO_APPLY} />
                ))}
              </div>
              <p className="mt-2 text-[10.5px] text-faint">Confidence ≥ {AUTO_APPLY * 100}% is auto-applied. The rest move to the operator approval queue.</p>
            </ResultCard>
          )}
          {shown(3) && (
            <ResultCard title="Saramin-standard resume" active={step === 3 && phase === 'running'} done={phase === 'done'}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-[16px]"></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-medium text-ink">saramin-cv.pdf · 1 page · ready for review</p>
                  <p className="text-[10.5px] text-faint">Open the “Saramin standard” tab on the review screen to preview it.</p>
                </div>
                {phase === 'done' && <Pill tone="active">Preview ready</Pill>}
              </div>
            </ResultCard>
          )}
        </section>
      )}
    </div>
  )
}

function ResultCard({ title, active, done, children }: { title: string; active: boolean; done: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl border bg-surface', active ? 'border-brand/60 shadow-sm' : done ? 'border-emerald-200' : 'border-line')}>
      <div className="flex items-center justify-between border-b border-line-soft px-3.5 py-2">
        <h4 className="text-[12px] font-semibold text-ink">{title}</h4>
        <span className={cn('text-[11px]', active ? 'text-brand' : done ? 'text-emerald-600' : 'text-faint')}>{active ? '◍' : done ? '✓' : '◌'}</span>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  )
}

/* ── ② Builder route — 4-step wizard with gates ──────────────────────────────── */

const BUILDER_STEPS = [
  { key: 'personal', label: 'Personal info', desc: 'Who the candidate is and how to reach them.' },
  { key: 'content', label: 'Headline & content', desc: 'Summarise the experience for recruiters.' },
  { key: 'tags', label: 'AI tags', desc: 'AI analyses the body and suggests Saramin-standard tags. Operator review applies.' },
  { key: 'preview', label: 'Preview & submit', desc: 'Read back the information before handing off to the standard review screen.' },
] as const

type BuilderForm = { fullName: string; email: string; phone: string; location: string; headline: string; body: string; tags: string[] }

function BuilderRoute({ onContinue }: { onContinue: (f: BuilderForm) => void }) {
  const [step, setStep] = useState(1)
  const [err, setErr] = useState<string | null>(null)
  const [f, setF] = useState<BuilderForm>({ fullName: '', email: '', phone: '', location: '', headline: '', body: '', tags: [] })
  const [tagPhase, setTagPhase] = useState<'idle' | 'running' | 'done'>('idle')

  const up = <K extends keyof BuilderForm>(k: K, v: BuilderForm[K]) => setF((p) => ({ ...p, [k]: v }))

  // The gate per step. Step 3 and 4 have none — zero tags is a valid resume.
  function canAdvance() {
    if (step === 1) return f.fullName.trim() !== '' && /.+@.+\..+/.test(f.email) && f.phone.trim() !== '' && f.location.trim() !== ''
    if (step === 2) return f.headline.trim() !== '' && f.body.trim() !== ''
    return true
  }

  function runTags() {
    setTagPhase('running')
    setTimeout(() => {
      setTagPhase('done')
      // Re-running replaces the SUGGESTION set, not the operator's checkmarks —
      // so only seed the auto-apply set when nothing has been checked yet.
      setF((p) => (p.tags.length > 0 ? p : { ...p, tags: SUGGESTED_TAGS.filter((t) => t.conf >= AUTO_APPLY).map((t) => t.value) }))
    }, 1600)
  }

  const cur = BUILDER_STEPS[step - 1]

  return (
    <div className="max-w-[820px]">
      <ol className="mb-4 flex flex-wrap items-center gap-1.5">
        {BUILDER_STEPS.map((s, i) => {
          const done = step > i + 1
          const active = step === i + 1
          return (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className={cn('grid h-6 w-6 place-items-center rounded-full border text-[10.5px] font-semibold', done ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-brand bg-brand text-white' : 'border-line text-faint')}>
                {done ? '✓' : i + 1}
              </span>
              <span className={cn('text-[11.5px]', active ? 'font-semibold text-ink' : 'text-muted')}>{s.label}</span>
              {i < BUILDER_STEPS.length - 1 && <span className="text-faint">›</span>}
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-line bg-surface">
        <header className="border-b border-line-soft px-4 py-3">
          <h3 className="text-[14px] font-semibold">Step {step}: {cur.label}</h3>
          <p className="mt-0.5 text-[11.5px] text-muted">{cur.desc}</p>
        </header>
        <div className="space-y-3 p-4">
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <BField label="Full name" req value={f.fullName} onChange={(v) => up('fullName', v)} placeholder="Nguyễn Văn An" />
              <BField label="Email" req value={f.email} onChange={(v) => up('email', v)} placeholder="you@example.com" />
              <BField label="Phone" req value={f.phone} onChange={(v) => up('phone', v)} placeholder="0901234567" />
              <BField label="Location" req value={f.location} onChange={(v) => up('location', v)} placeholder="Hồ Chí Minh" />
            </div>
          )}

          {step === 2 && (
            <>
              <BField label="Headline" req value={f.headline} onChange={(v) => up('headline', v)} placeholder="Backend developer with 3 years of experience" />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-ink/80">Resume body<span className="text-rose-500"> *</span></label>
                <textarea
                  rows={7}
                  value={f.body}
                  onChange={(e) => up('body', e.target.value)}
                  placeholder="Describe the experience, skills, education…"
                  className="w-full resize-y rounded-md border border-line bg-surface px-2.5 py-2 text-[12px] outline-none focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] text-faint">The headline and body become the VI summary of the standard resume — its first line is the resume headline.</p>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="rounded-lg border border-line bg-canvas/30 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-[12.5px] font-semibold">AI tag suggestions</h4>
                  <p className="text-[11px] text-muted">The same suggestion set the Upload pipeline produces — both routes converge on identical tags.</p>
                </div>
                {tagPhase === 'idle' && (
                  <button onClick={runTags} disabled={f.body.trim() === ''} className="rounded-md bg-brand px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:opacity-90 disabled:opacity-40">Run AI suggestion</button>
                )}
                {tagPhase === 'running' && <button disabled className="rounded-md bg-brand/60 px-2.5 py-1.5 text-[11.5px] font-semibold text-white">◍ Analysing…</button>}
                {tagPhase === 'done' && <button onClick={runTags} className="rounded-md border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:border-brand hover:text-brand">↻ Re-run</button>}
              </div>

              {f.body.trim() === '' && tagPhase === 'idle' && <p className="mt-2 text-[11px] italic text-faint">Fill in the resume body on the previous step first.</p>}
              {f.body.trim() !== '' && tagPhase === 'idle' && <p className="mt-2 text-[11px] italic text-faint">Run AI suggestion to see tags here.</p>}

              {tagPhase !== 'idle' && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.map((t) => (
                    <TagChip
                      key={t.value}
                      kind={t.kind}
                      value={t.value}
                      conf={t.conf}
                      checked={f.tags.includes(t.value)}
                      onClick={() => tagPhase === 'done' && up('tags', f.tags.includes(t.value) ? f.tags.filter((x) => x !== t.value) : [...f.tags, t.value])}
                    />
                  ))}
                </div>
              )}
              {tagPhase === 'done' && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                  <span className="rounded-md bg-canvas px-2 py-0.5 text-[10.5px] text-muted tabular-nums">{f.tags.length} selected</span>
                  <p className="text-[10.5px] text-faint">Only checked tags are applied. Below {AUTO_APPLY * 100}% confidence goes to the operator approval queue.</p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2.5">
              {([['Name', f.fullName], ['Email', f.email], ['Phone', f.phone], ['Location', f.location], ['Headline', f.headline]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 border-b border-line-soft pb-2 text-[12px] last:border-b-0">
                  <span className="text-muted">{k}</span>
                  <span className={cn('col-span-2', v ? 'font-medium text-ink' : 'italic text-faint')}>{v || 'not provided'}</span>
                </div>
              ))}
              <div>
                <p className="mb-1 text-[11px] font-medium text-ink/80">Body</p>
                <p className="whitespace-pre-wrap rounded-md border border-line bg-canvas/40 p-2.5 text-[11.5px] text-ink/80">{f.body || <span className="italic text-faint">not provided</span>}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-ink/80">Tags</span>
                {f.tags.length === 0
                  ? <span className="text-[11.5px] italic text-faint">none selected</span>
                  : f.tags.map((t) => <span key={t} className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10.5px] text-muted">{t}</span>)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-ink/80">Source</span>
                <span className="rounded-md border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted">SELF_REGISTER</span>
                <span className="text-[10.5px] text-faint">— set by the route, not chosen here</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-faint">
                This is a read-back, not the review. Continue hands off to the Saramin standard screen, where the resume is actually
                edited and registered.
              </p>
            </div>
          )}

          {err && <p role="alert" className="text-[11.5px] text-rose-600">{err}</p>}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => { setErr(null); setStep((s) => Math.max(1, s - 1)) }} disabled={step === 1} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted disabled:opacity-40">‹ Back</button>
        {step < BUILDER_STEPS.length ? (
          <button
            onClick={() => { if (!canAdvance()) { setErr('Please complete the required fields on this step.'); return } setErr(null); setStep((s) => s + 1) }}
            className="rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90"
          >Next ›</button>
        ) : (
          <button onClick={() => onContinue(f)} className="rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Continue to review →</button>
        )}
      </div>
    </div>
  )
}

/** Editable wizard field. */
function BField({ label, req, value, onChange, placeholder }: { label: string; req?: boolean; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-surface px-2.5 py-2 text-[12px] outline-none focus:border-brand"
      />
    </div>
  )
}

/* ── convergence — Saramin standard resume, review & edit ────────────────────── */

function ResumeReview({ std, setStd, source, onBack, onRegistered }: {
  std: Std
  setStd: (s: Std) => void
  source: 'IMPORT' | 'SELF_REGISTER'
  onBack: () => void
  onRegistered: () => void
}) {
  const hasOriginal = source === 'IMPORT'
  const [tab, setTab] = useState<'original' | 'saramin'>(hasOriginal ? 'original' : 'saramin')
  const [registered, setRegistered] = useState(false)
  const keys = matchKeys(std)
  const ready = keys.filter((k) => k.ready).length

  const setPref = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setStd({ ...std, prefs: { ...std.prefs, [k]: v } })

  if (registered) {
    return (
      <div className="max-w-[560px] rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
        <p className="text-[15px] font-bold text-emerald-800">Registered to the resume master</p>
        <p className="mt-1 text-[12px] leading-relaxed text-emerald-900/80">
          The standard resume was saved with <b>source = {source}</b>{hasOriginal ? ', both the original and the generated Saramin PDF' : ', the generated Saramin PDF only'}, and {std.tags.length} tag{std.tags.length === 1 ? '' : 's'}.
          The console would now open the new resume’s detail page.
        </p>
        <p className="mt-2 text-[11px] text-emerald-900/70">
          The candidate is <b>not</b> discoverable in employer CV search yet — that needs their own visibility consent.
        </p>
        <button onClick={onRegistered} className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Back to resume list</button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} className="text-[11.5px] font-medium text-muted hover:text-brand">← Previous step</button>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted">source: {source}</span>
          <button onClick={() => setRegistered(true)} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Register to resume master</button>
        </div>
      </div>

      <h2 className="text-[19px] font-bold tracking-tight">Saramin standard resume — review &amp; edit</h2>
      <p className="mt-1 max-w-[760px] text-[12px] text-muted">
        One unified view of the extracted or entered content in the Saramin standard format. Edit any section, then register. This is the
        only write in the flow — until you press Register, nothing exists in the resume master.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {/* LEFT — CV documents */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-line bg-surface">
            <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line-soft px-3.5 py-2.5">
              <div>
                <h3 className="text-[12.5px] font-semibold">CV documents</h3>
                <p className="text-[10.5px] text-faint">Opening a CV document is a PII event and is written to the audit log.</p>
              </div>
              <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">{hasOriginal ? 'Original + Saramin' : 'Saramin only'}</span>
            </header>
            <div className="flex gap-1 border-b border-line-soft px-3.5 pt-2.5">
              {([['original', 'Original CV'], ['saramin', 'Saramin standard']] as const).map(([k, label]) => {
                const disabled = k === 'original' && !hasOriginal
                return (
                  <button
                    key={k}
                    disabled={disabled}
                    onClick={() => setTab(k)}
                    title={disabled ? 'The Builder route produces no original file' : undefined}
                    className={cn('rounded-t-md px-2.5 py-1.5 text-[11.5px]', tab === k ? 'border-b-2 border-brand font-semibold text-brand' : 'text-muted', disabled && 'opacity-40')}
                  >{label}</button>
                )
              })}
            </div>
            <div className="p-3.5">
              <div className="grid min-h-[380px] place-items-center rounded-lg border border-dashed border-line bg-canvas/30 text-center">
                <div className="px-6">
                  <p className="text-[22px]"></p>
                  <p className="mt-1 text-[12px] font-medium text-ink">
                    {tab === 'original' ? 'original-cv.pdf' : 'saramin-cv.pdf'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {tab === 'original'
                      ? 'The file as the candidate supplied it — the document an employer reads.'
                      : 'Generated from the standard template. Regenerated whenever the standard resume changes.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — matching keys + section editors */}
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface">
            <header className="border-b border-line-soft px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-[12.5px] font-semibold">Job matching keys</h3>
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums', ready >= 7 ? 'bg-emerald-50 text-emerald-700' : ready >= 4 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600')}>
                  {ready} / {keys.length} ready
                </span>
              </div>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint">
                Which job-posting filters this resume can be found by. Derived live — fill a section below and its key flips to Ready.
                An all-Missing resume registers fine but is close to invisible in CV search.
              </p>
            </header>
            <div className="grid gap-2 p-3.5 sm:grid-cols-2">
              {keys.map((k) => (
                <div key={k.label} className={cn('flex items-start gap-2 rounded-md border p-2', k.ready ? 'border-emerald-200 bg-emerald-50/50' : 'border-line bg-surface')}>
                  <span className={cn('mt-0.5 text-[10px]', k.ready ? 'text-emerald-600' : 'text-faint')}>{k.ready ? '✓' : '◌'}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ink">{k.label}</p>
                    <p className="truncate text-[10.5px] text-faint">{k.preview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <StdSection title="Identity & contact">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <RField label="Name (VI) *" value={std.nameVi} />
              <RField label="Name (EN)" value={std.nameEn} />
              <RField label="Name (KO)" value={std.nameKr} />
              <RField label="Date of birth" value={std.dob} />
              <RField label="Gender" value={std.gender} />
              <RField label="Email *" value={std.email} />
              <RField label="Phone *" value={std.phone} />
              <RField label="City" value={std.city} />
              <RField label="District" value={std.district} />
              <RField label="Road" value={std.road} span="sm:col-span-2" />
            </div>
          </StdSection>

          <StdSection title="Summary">
            <div className="space-y-2.5">
              <RField label="Summary (VI) — its first line becomes the resume headline" value={std.sumVi} />
              <RField label="Summary (EN)" value={std.sumEn} />
              <RField label="Summary (KO)" value={std.sumKo} />
            </div>
          </StdSection>

          <StdSection title="Experience" count={std.experiences.length} repeatable>
            {std.experiences.length === 0 && <EmptySec what="No experience yet — this is what drives years-of-experience and the Career matching key." />}
            {std.experiences.map((e, i) => (
              <StdItem key={i}>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <RField label="Company *" value={e.company} />
                  <RField label="Position *" value={e.position} />
                  <RField label="Location" value={e.location} />
                  <RField label="Areas (comma-separated)" value={e.areas} />
                  <RField label="Start (YYYY-MM) *" value={e.startYm} />
                  <RField label="End (YYYY-MM — empty = present)" value={e.endYm} />
                  <RField label="Tech stack (comma-separated)" value={e.tech} span="sm:col-span-2" />
                </div>
                <p className="mt-2 mb-1 text-[10.5px] font-medium text-ink/70">Achievements (one per line)</p>
                <ul className="space-y-1">
                  {e.bullets.map((b) => <li key={b} className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] text-ink/80">{b}</li>)}
                </ul>
              </StdItem>
            ))}
          </StdSection>

          <StdSection title="Education" count={std.educations.length} repeatable>
            {std.educations.length === 0 && <EmptySec what="No education yet — the Education matching key stays Missing until one entry exists." />}
            {std.educations.map((e, i) => (
              <StdItem key={i}>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <RField label="School *" value={e.school} span="sm:col-span-2" />
                  <RField label="Faculty" value={e.faculty} />
                  <RField label="Major" value={e.major} />
                  <RField label="Degree * (HIGH_SCHOOL · ASSOCIATE · BACHELOR · MASTER · DOCTOR)" value={e.degree} span="sm:col-span-2" />
                  <RField label="Start (YYYY-MM)" value={e.startYm} />
                  <RField label="End (YYYY-MM)" value={e.endYm} />
                  <RField label="GPA" value={e.gpa} />
                </div>
              </StdItem>
            ))}
          </StdSection>

          <StdSection title="Skills" count={std.skills.length} repeatable>
            {std.skills.length === 0 && <EmptySec what="No skills yet. Real CVs group their stack — keep the groups rather than flattening to one list." />}
            {std.skills.map((s, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-[150px_1fr]">
                <RField label="Group" value={s.group} />
                <RField label="Items (comma-separated — must resolve to the Skill taxonomy)" value={s.items} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Languages" count={std.languages.length} repeatable>
            {std.languages.length === 0 && <EmptySec what="No languages yet — this feeds the Language certs matching key." />}
            {std.languages.map((l, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-4">
                <RField label="Language" value={l.language} />
                <RField label="Cert" value={l.cert} />
                <RField label="Score / level" value={l.score} />
                <RField label="Level" value={l.level} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Certifications" count={std.certifications.length} repeatable>
            {std.certifications.length === 0 && <EmptySec what="None." />}
            {std.certifications.map((c, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-4">
                <RField label="Certificate" value={c.name} />
                <RField label="Issuer" value={c.issuer} />
                <RField label="Score" value={c.score} />
                <RField label="Year" value={c.year} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Projects" count={std.projects.length} repeatable>
            {std.projects.length === 0 && <EmptySec what="None." />}
            {std.projects.map((p, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-2">
                <RField label="Project" value={p.name} />
                <RField label="Role" value={p.role} />
                <RField label="Period" value={p.period} />
                <RField label="Tech stack" value={p.tech} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Awards / activities" count={std.awards.length} repeatable>
            {std.awards.length === 0 && <EmptySec what="None." />}
            {std.awards.map((a, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-3">
                <RField label="Award" value={a.name} />
                <RField label="Issuer" value={a.issuer} />
                <RField label="Year" value={a.year} />
              </div>
            ))}
          </StdSection>

          <StdSection title="References" count={std.references.length} repeatable>
            <p className="-mt-1 mb-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] text-amber-800">
              VN CVs routinely list a referee with a phone number. This section is PII about a THIRD party — masked in the list, and revealing it is audited.
            </p>
            {std.references.length === 0 && <EmptySec what="None." />}
            {std.references.map((r, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-4">
                <RField label="Name" value={r.name} />
                <RField label="Role" value={r.role} />
                <RField label="Relation" value={r.relation} />
                <RField label="Phone" value={r.phone} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Portfolio / links" count={std.links.length} repeatable>
            {std.links.length === 0 && <EmptySec what="None." />}
            {std.links.map((l, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-[120px_1fr]">
                <RField label="Kind" value={l.kind} />
                <RField label="URL" value={l.url} />
              </div>
            ))}
          </StdSection>

          {/* The one editable section, so the matching keys can be watched flipping. */}
          <StdSection title="Job preferences">
            <p className="-mt-1 text-[10.5px] text-faint">Editable here — change a field and watch its matching key above flip to Ready.</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <PrefSelect label="Career level" value={std.prefs.careerLevel} options={['FRESHER', 'EXPERIENCED', 'ANY']} onChange={(v) => setPref('careerLevel', v)} />
              <BField label="Years of experience" value={std.prefs.yearsOfExp} onChange={(v) => setPref('yearsOfExp', v)} />
              <BField label="Desired job categories (comma-separated)" value={std.prefs.cats} onChange={(v) => setPref('cats', v)} placeholder="Frontend Developer, Full-stack Developer" />
              <BField label="Desired employment types (comma-separated)" value={std.prefs.empTypes} onChange={(v) => setPref('empTypes', v)} placeholder="FULL_TIME, CONTRACT" />
              <BField label="Desired locations (comma-separated)" value={std.prefs.locs} onChange={(v) => setPref('locs', v)} placeholder="Hà Nội, Hồ Chí Minh" />
              <BField label="Target industries (comma-separated)" value={std.prefs.inds} onChange={(v) => setPref('inds', v)} placeholder="E-commerce, SaaS" />
              <PrefSelect label="Salary kind" value={std.prefs.salKind} options={['', 'ANNUAL', 'MONTHLY', 'INTERVIEW', 'INTERNAL_RULE']} onChange={(v) => setPref('salKind', v)} />
              <PrefSelect label="Currency" value={std.prefs.salCur} options={['VND', 'USD']} onChange={(v) => setPref('salCur', v)} />
              <BField label="Salary min" value={std.prefs.salMin} onChange={(v) => setPref('salMin', v)} placeholder="30000000" />
              <BField label="Salary max" value={std.prefs.salMax} onChange={(v) => setPref('salMax', v)} placeholder="45000000" />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {([['Remote OK', 'remoteOk'], ['Open to relocate', 'relocate'], ['Open to overseas', 'overseas']] as [string, 'remoteOk' | 'relocate' | 'overseas'][]).map(([label, k]) => (
                <button
                  key={k}
                  onClick={() => setPref(k, !std.prefs[k])}
                  className={cn('rounded-full border px-2.5 py-1 text-[11px] transition-colors', std.prefs[k] ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted hover:text-ink')}
                >
                  {std.prefs[k] ? '☑' : '☐'} {label}
                </button>
              ))}
            </div>
          </StdSection>

          <StdSection title="Tags" count={std.tags.length}>
            {std.tags.length === 0
              ? <EmptySec what="No tags applied. The resume registers, but it will not surface for skill or role searches." />
              : (
                <div className="flex flex-wrap gap-1.5">
                  {std.tags.map((t) => <TagChip key={t.value} kind={t.kind} value={t.value} conf={t.conf} checked />)}
                </div>
              )}
            <p className="text-[10.5px] text-faint">Only checked tags were applied. A blank tag value is rejected by the API — an empty tag pollutes the taxonomy join CV search depends on.</p>
          </StdSection>

          <p className="rounded-lg border border-line bg-canvas/40 px-3 py-2.5 text-[10.5px] leading-relaxed text-faint">
            <b className="text-muted">On register:</b> the whole standard resume is stored as one serialised <code className="font-mono">standardJson</code>, and the flat
            columns the list and search read are DERIVED from it — <code className="font-mono">headline</code> = the first line of the VI summary,{' '}
            <code className="font-mono">content</code> = the VI summary (falling back to EN, then KO). Never the other way round.
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptySec({ what }: { what: string }) {
  return <p className="rounded-md border border-dashed border-line bg-canvas/30 px-2.5 py-2 text-[11px] italic text-faint">{what}</p>
}

function PrefSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-ink/80">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-surface px-2 py-2 text-[12px] outline-none focus:border-brand"
      >
        {options.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </div>
  )
}

/* ── Companies ────────────────────────────────────────────────────────────── */
// Pipeline stage = the sales/document flow. Ordered Qualified → Proposal →
// Negotiation → PO → Invoice, plus Lost. (Renewal/lapse is tracked separately by
// the customer `account` status: New / Existing / Churn.)
//   Qualified   = HR manager is willing to discuss the Quotation
//   Proposal    = Quotation has been sent to the customer
//   Negotiation = HR manager is running it through their internal approval process
//   PO          = customer agreed to buy; Sales issued the Purchase Order (deal won)
//   Invoice     = customer paid; Accounting issued the Invoice (deal closed)
//   Lost        = ended without a PO (declined / lost to a competitor / budget cut / went silent)
type CoStatus = 'Qualified' | 'Proposal' | 'Negotiation' | 'PO' | 'Invoice' | 'Lost'
// Customer-relationship health (shown on the Companies directory) — distinct from the
// deal lifecycle above (shown on the Pipeline board). Only real customers have one;
// a company still being sold to (no PO yet) has account = null.
//   New = became a customer recently (onboarding)
//   Existing = active, currently using a purchased service
//   Churn = no new product bought for 1 year since the last PO was issued
/* Customer status — exactly three, and every company always has one.
     New      = has never bought from us (no VAT e-invoice has ever been issued)
     Existing = has paid at least once — active service or a past order
     Churn    = no new order for 12 months since the last invoice
   New is about BUYING HISTORY, not about having a login: a company can sit at New
   for years while being quoted repeatedly. Whether an account exists is a separate
   fact. New → Existing is one-way; a win-back returns a churned company to Existing,
   never to New. */
type Account = 'New' | 'Existing' | 'Churn'
type Company = {
  name: string; shortName: string; legalName: string; tax: string; industry: string; size: string; address: string
  /** Quốc tịch — where the company is REGISTERED. 'Việt Nam' is what reveals the
      province picker; every country keeps a free-text address. */
  country: string
  // Corporate tree. `parent` is the DIRECT parent's `name` — one parent only, any
  // depth (parent → subsidiary → sub-subsidiary). Undefined = a root: either the top
  // of a group, or a company that stands alone. Nothing is inherited down this link:
  // quota, billing, users and deals all stay on the record that owns them.
  parent?: string
  contact: string; owner: string; status: CoStatus
  account: Account; lastPO: string; renewal: string; nextStep: string
  idle: number | null; note: string; revenue: number
  /** the sent quotation has passed its expiry date — the deal does NOT move, it gets flagged */
  quoteLapsed?: boolean
  jobPosting: boolean; resumeSearch: boolean; jobLeft: number; jobTotal: number; cvLeft: number; cvTotal: number
  hasPage: boolean; jobs: number; domain: string; since: string
}
const COMPANIES: Company[] = [
  { name: 'Công ty TNHH Đại Dương', shortName: 'Đại Dương', legalName: 'Công ty TNHH Đại Dương', country: 'Việt Nam', tax: '0315xxxxxx', industry: 'Thủy sản', size: '50–200', address: 'Hải Phòng', contact: 'Mr. Nguyễn Văn Toàn · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '18/06/2026', renewal: '18/12/2026', nextStep: 'Quarterly review', idle: 34, note: 'Renewal discussion started.', revenue: 55_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 10, cvLeft: 45, cvTotal: 80, hasPage: true, jobs: 3, domain: 'daiduong.vn', since: '12/04/2025' },
  { name: 'Công ty CP Bình Minh', shortName: 'Bình Minh', legalName: 'Công ty Cổ phần Bình Minh', country: 'Việt Nam', tax: '0316xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận 3, HCMC', contact: 'Ms. Lê Thu Hằng · HR', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Schedule product demo', idle: 6, note: 'Quotation sent — demo booked 29/07.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'binhminh.edu.vn', since: '—' },
  { name: 'Công ty TNHH Sao Mai', shortName: 'Sao Mai', legalName: 'Công ty TNHH Sao Mai', country: 'Việt Nam', tax: '0317xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', contact: 'Mr. Trần Đức Anh · HR Mgr', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send revised quote', idle: 12, note: 'Waiting on their board approval.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'saomai.vn', since: '—' },
  { name: 'Công ty TNHH Vạn Phát', shortName: 'Vạn Phát', legalName: 'Công ty TNHH Vạn Phát', country: 'Việt Nam', tax: '0312xxxxxx', industry: 'Healthcare', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Vũ Thanh Linh · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '26/05/2026', renewal: '26/08/2026', nextStep: 'Onboarding check-in', idle: 47, note: 'Kickoff scheduled 30/07.', revenue: 37_800_000, jobPosting: true, resumeSearch: true, jobLeft: 7, jobTotal: 10, cvLeft: 62, cvTotal: 100, hasPage: true, jobs: 4, domain: 'vanphat.vn', since: '26/05/2026' },
  { name: 'FPT Software', shortName: 'FPT Software', legalName: 'Công ty TNHH Phần mềm FPT', country: 'Việt Nam', tax: '0101xxxxxx', industry: 'CNTT', size: '5000+', address: 'Cầu Giấy, Hà Nội', contact: 'Mr. Lý Văn Giang · HR Lead', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '15/06/2026', renewal: '15/09/2026', nextStep: 'Upsell Resume Search', idle: 60, note: 'Discussed CV-search add-on.', revenue: 420_000_000, jobPosting: true, resumeSearch: false, jobLeft: 12, jobTotal: 50, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 38, domain: 'fpt.com.vn', since: '12/01/2024' },
  { name: 'Công ty CP Hoàng Gia', shortName: 'Hoàng Gia', legalName: 'Công ty Cổ phần Hoàng Gia', country: 'Việt Nam', tax: '0313xxxxxx', industry: 'Bất động sản', size: '50–200', address: 'Quận 7, HCMC', contact: 'Ms. Đỗ Thu Hà · Recruiter', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '03/03/2026', renewal: '03/09/2026', nextStep: 'Confirm CV-unlock usage', idle: 1, note: 'PO signed; awaiting payment.', revenue: 20_000_000, jobPosting: false, resumeSearch: true, jobLeft: 0, jobTotal: 0, cvLeft: 40, cvTotal: 50, hasPage: false, jobs: 0, domain: 'hoanggia.vn', since: '03/03/2026' },
  { name: 'Công ty TNHH Việt Tiến', shortName: '', legalName: 'Công ty TNHH Việt Tiến Logistics', country: 'Việt Nam', tax: '0314xxxxxx', industry: 'Logistics', size: '200–500', address: 'Quận Bình Tân, HCMC', contact: 'Mr. Ngô Minh Tú', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '10/07/2025', renewal: 'Lapsed', nextStep: 'Win-back call', idle: 73, note: 'No response to renewal ×3.', revenue: 90_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'viettien.vn', since: '15/08/2024' },
  { name: 'Tiki', shortName: 'Tiki', legalName: 'Công ty TNHH TIKI', country: 'Việt Nam', tax: '0309xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 4, HCMC', contact: 'Ms. Bùi Thu Hằng · TA Manager', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '01/07/2026', renewal: '01/10/2026', nextStep: 'Quarterly review', idle: 86, note: 'QBR booked next week.', revenue: 300_000_000, jobPosting: true, resumeSearch: true, jobLeft: 21, jobTotal: 30, cvLeft: 210, cvTotal: 300, hasPage: true, jobs: 21, domain: 'tiki.vn', since: '10/11/2023' },
  { name: 'VNG Corporation', shortName: 'VNG', legalName: 'Công ty CP VNG', country: 'Việt Nam', tax: '0304xxxxxx', industry: 'CNTT', size: '1000–5000', address: 'Quận 7, HCMC', contact: 'Mr. Đoàn Hải Nam · HR Director', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '20/06/2026', renewal: '20/12/2026', nextStep: 'Renewal upsell deck', idle: 99, note: 'Interested in employer-branding page.', revenue: 510_000_000, jobPosting: true, resumeSearch: true, jobLeft: 30, jobTotal: 40, cvLeft: 180, cvTotal: 400, hasPage: true, jobs: 27, domain: 'vng.com.vn', since: '05/02/2024' },
  { name: 'MoMo', shortName: 'MoMo', legalName: 'Công ty CP Dịch vụ Di động Trực tuyến (M_Service)', country: 'Việt Nam', tax: '0305xxxxxx', industry: 'Fintech', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Ms. Trịnh Khánh Vy · TA Lead', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '18/07/2026', renewal: '18/10/2026', nextStep: 'Collect payment on PO', idle: 2, note: 'PO signed; invoice pending.', revenue: 150_000_000, jobPosting: true, resumeSearch: true, jobLeft: 10, jobTotal: 15, cvLeft: 90, cvTotal: 120, hasPage: true, jobs: 9, domain: 'momo.vn', since: '18/07/2026' },
  { name: 'Thế Giới Di Động', shortName: 'TGDĐ', legalName: 'Công ty CP Đầu tư Thế Giới Di Động', country: 'Việt Nam', tax: '0306xxxxxx', industry: 'Bán lẻ', size: '5000+', address: 'Thủ Đức, HCMC', contact: 'Mr. Cao Văn Đức · HR Manager', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '10/05/2026', renewal: '10/11/2026', nextStep: 'Quarterly review', idle: 112, note: 'Volume hiring for new stores.', revenue: 620_000_000, jobPosting: true, resumeSearch: true, jobLeft: 40, jobTotal: 80, cvLeft: 300, cvTotal: 500, hasPage: true, jobs: 54, domain: 'thegioididong.com', since: '22/09/2023' },
  { name: 'Shopee Việt Nam', shortName: 'Shopee', legalName: 'Công ty TNHH Shopee', country: 'Singapore', tax: '0307xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 1, HCMC', contact: 'Ms. Lâm Ngọc Bích · TA', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Align on package + price', idle: 5, note: 'Comparing us vs a competitor.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'shopee.vn', since: '—' },
  { name: 'Base.vn', shortName: 'Base.vn', legalName: 'Công ty CP Base Enterprise', country: 'Việt Nam', tax: '0308xxxxxx', industry: 'CNTT', size: '200–500', address: 'Quận 1, HCMC', contact: 'Mr. Phan Anh Tuấn', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Book discovery call', idle: 3, note: 'Inbound from website form.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'base.vn', since: '—' },
  { name: 'Công ty CP Đông Á', shortName: '', legalName: 'Công ty Cổ phần Đông Á', country: 'Việt Nam', tax: '0318xxxxxx', industry: 'Tài chính', size: '500–1000', address: 'Quận 1, HCMC', contact: 'Ms. Hà Kiều Trang · HR', owner: 'Trần Quốc Trung', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 16, note: 'Quotation sent — gone quiet.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dongabank.com.vn', since: '—' },
  { name: 'Công ty TNHH Minh Long', shortName: 'Minh Long', legalName: 'Công ty TNHH Gốm sứ Minh Long', country: 'Việt Nam', tax: '0319xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Bình Dương', contact: 'Mr. Lý Quốc Bảo', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '02/06/2025', renewal: 'Lapsed', nextStep: 'Win-back next quarter', idle: 40, note: 'Budget frozen; revisit in Q4.', revenue: 60_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'minhlong.com', since: '14/03/2024' },
  { name: 'Công ty CP An Khang', shortName: 'An Khang', legalName: 'Công ty Cổ phần Dược phẩm An Khang', country: 'Việt Nam', tax: '0321xxxxxx', industry: 'Y tế', size: '200–500', address: 'Quận 10, HCMC', contact: 'Ms. Trần Mỹ Duyên · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 4, note: 'Quotation sent for Job Posting Pro.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'ankhang.vn', since: '—' },
  { name: 'Công ty TNHH Phú Thịnh', shortName: 'Phú Thịnh', legalName: 'Công ty TNHH Thương mại Phú Thịnh', country: 'Việt Nam', tax: '0322xxxxxx', industry: 'Bán lẻ', size: '50–200', address: 'Quận Tân Bình, HCMC', contact: 'Mr. Hồ Đăng Khoa · Trưởng phòng HC-NS', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Waiting on director approval', idle: 11, note: 'Asked for 10% discount; escalated.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phuthinh.com.vn', since: '—' },
  { name: 'Công ty CP Thành Đạt', shortName: 'Thành Đạt', legalName: 'Công ty Cổ phần Xây dựng Thành Đạt', country: 'Việt Nam', tax: '0320xxxxxx', industry: 'Xây dựng', size: '200–500', address: 'Quận Hà Đông, Hà Nội', contact: 'Mr. Vũ Đình Khôi · HR', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '12/07/2026', renewal: '12/10/2026', nextStep: 'Onboarding check-in', idle: 53, note: 'First purchase — Job Posting.', revenue: 25_000_000, jobPosting: true, resumeSearch: false, jobLeft: 8, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 3, domain: 'thanhdat.com.vn', since: '12/07/2026' },
  // ── Rot coverage: the rows below deliberately span fresh / amber / red for every
  // open stage, and across all three reps, so the Idle column can be read at a glance
  // in both Sales view and Sales-lead view. Thresholds are IDLE_AMBER / IDLE_RED above.
  { name: 'Công ty CP Nam Long', shortName: 'Nam Long', legalName: 'Công ty Cổ phần Đầu tư Nam Long', country: 'Việt Nam', tax: '0323xxxxxx', industry: 'Bất động sản', size: '500–1000', address: 'Quận 7, HCMC', contact: 'Ms. Đặng Kiều Oanh · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-send quotation options', idle: 9, note: 'Asked us to circle back after Tết planning.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'namlong.vn', since: '—' },
  { name: 'Công ty TNHH Hòa Bình', shortName: 'Hòa Bình', legalName: 'Công ty TNHH Xây dựng Hòa Bình', country: 'Việt Nam', tax: '0324xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Mr. Đinh Trọng Nghĩa · Trưởng phòng NS', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — no reply in 2.5 weeks', idle: 18, note: 'Three follow-ups, no answer. Try the CFO.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hoabinh.com.vn', since: '—' },
  { name: 'Công ty CP Thương mại Vina', shortName: 'Vina Trading', legalName: 'Công ty Cổ phần Thương mại Vina', country: 'Việt Nam', tax: '0325xxxxxx', industry: 'FMCG', size: '500–1000', address: 'Quận Bình Thạnh, HCMC', contact: 'Ms. Hoàng Diệu Linh · HR', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase quotation feedback', idle: 12, note: 'Quotation sent; validity ends in 2 days.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinatrading.vn', since: '—' },
  { name: 'Công ty TNHH An Phú Logistics', shortName: 'An Phú', legalName: 'Công ty TNHH Giao nhận An Phú', country: 'Việt Nam', tax: '0326xxxxxx', industry: 'Logistics', size: '200–500', address: 'Quận 9, HCMC', contact: 'Mr. Lại Văn Bình', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quotation expired — reissue or close', idle: 26, note: 'Went silent after pricing. Decide: reissue or Lost.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'anphulog.vn', since: '—' },
  { name: 'Công ty CP Tài chính Đại Tín', shortName: 'Đại Tín', legalName: 'Công ty Cổ phần Tài chính Đại Tín', country: 'Việt Nam', tax: '0327xxxxxx', industry: 'Tài chính', size: '500–1000', address: 'Quận 1, HCMC', contact: 'Ms. Chu Thanh Vân · HR Director', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask for approval timeline', idle: 30, note: 'Legal review dragging; needs a nudge.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'daitin.com.vn', since: '—' },
  { name: 'Công ty CP Trường Sơn', shortName: 'Trường Sơn', legalName: 'Công ty Cổ phần Tập đoàn Trường Sơn', country: 'Việt Nam', tax: '0328xxxxxx', industry: 'Sản xuất', size: '1000–5000', address: 'Đà Nẵng', contact: 'Mr. Tạ Quang Đạo · Giám đốc NS', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate to sales lead', idle: 52, note: 'Stalled past 45d — approval never came back.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'truongson.vn', since: '—' },
  // The one BRANCH in the mock — same 10-digit tax root as its parent, only the -001
  // suffix differs. That is what flips the affiliate badge from "Công ty con" to
  // "Chi nhánh"; nothing else about the record behaves differently. It still buys its
  // own package, is invoiced on its own tax code, and has its own sales owner.
  { name: 'CN Trường Sơn — Hà Nội', shortName: 'Trường Sơn HN', legalName: 'Chi nhánh Công ty Cổ phần Tập đoàn Trường Sơn tại Hà Nội', country: 'Việt Nam', tax: '0328xxxxxx-001', industry: 'Sản xuất', size: '200–500', address: 'Long Biên, Hà Nội', parent: 'Công ty CP Trường Sơn', contact: 'Ms. Nguyễn Vân Khánh · HC-NS', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '08/06/2026', renewal: '08/12/2026', nextStep: 'Quarterly review', idle: 21, note: 'Hires separately from HQ — own PO, own invoice.', revenue: 42_000_000, jobPosting: true, resumeSearch: false, jobLeft: 4, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'truongson.vn', since: '08/06/2025' },
  { name: 'Công ty TNHH Hải Âu Travel', shortName: 'Hải Âu', legalName: 'Công ty TNHH Du lịch Hải Âu', country: 'Việt Nam', tax: '0329xxxxxx', industry: 'Du lịch', size: '50–200', address: 'Quận 1, HCMC', contact: 'Ms. Phùng Mỹ Hạnh · HR', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '19/07/2026', renewal: '19/10/2026', nextStep: 'Chase payment on PO', idle: 10, note: 'PO signed 19/07; payment not received yet.', revenue: 28_000_000, jobPosting: true, resumeSearch: false, jobLeft: 5, jobTotal: 5, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'haiautravel.vn', since: '19/07/2026' },
  { name: 'Công ty CP Tân Hưng Foods', shortName: 'Tân Hưng', legalName: 'Công ty Cổ phần Thực phẩm Tân Hưng', country: 'Việt Nam', tax: '0330xxxxxx', industry: 'Thực phẩm', size: '200–500', address: 'Long An', contact: 'Mr. Ngô Bá Thành · HC-NS', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '05/07/2026', renewal: '05/10/2026', nextStep: 'Payment 24d overdue — escalate', idle: 24, note: 'Accounting has chased twice; no transfer.', revenue: 45_000_000, jobPosting: true, resumeSearch: true, jobLeft: 10, jobTotal: 10, cvLeft: 50, cvTotal: 50, hasPage: false, jobs: 0, domain: 'tanhungfoods.vn', since: '05/07/2026' },
  // More Qualified cover — idle spans fresh / amber / red (8d / 15d) across all three reps
  { name: 'Công ty CP Dệt may Phương Nam', shortName: 'Phương Nam', legalName: 'Công ty Cổ phần Dệt may Phương Nam', country: 'Việt Nam', tax: '0331xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Quận 12, HCMC', parent: 'Công ty CP Trường Sơn', contact: 'Ms. Nguyễn Hồng Nhung · HR', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send package comparison', idle: 4, note: 'Wants Basic Plus vs Basic breakdown.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phuongnamtex.vn', since: '—' },
  { name: 'Công ty TNHH Cơ khí Đông Phong', shortName: 'Đông Phong', legalName: 'Công ty TNHH Cơ khí Đông Phong', country: 'Việt Nam', tax: '0332xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', parent: 'Công ty CP Trường Sơn', contact: 'Mr. Trịnh Văn Lộc · Trưởng phòng NS', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-book the demo they missed', idle: 132, note: 'No-showed the demo; rescheduling.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dongphong.com.vn', since: '—' },
  { name: 'Galaxy Media', shortName: 'Galaxy', legalName: 'Công ty Cổ phần Truyền thông Galaxy', country: 'Việt Nam', tax: '0333xxxxxx', industry: 'Truyền thông', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Đặng Thảo My · TA Lead', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase — 3 calls unanswered', idle: 19, note: 'Went quiet after the discovery call.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'galaxymedia.vn', since: '—' },
  // More Proposal cover — includes a quotation that has already lapsed past its 14-day validity
  { name: 'Công ty CP Dược Hậu Giang', shortName: 'DHG Pharma', legalName: 'Công ty Cổ phần Dược Hậu Giang', country: 'Việt Nam', tax: '0334xxxxxx', industry: 'Y tế', size: '1000–5000', address: 'Cần Thơ', contact: 'Mr. Lâm Thanh Tùng · HR Director', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quotation sent 22/07 — follow up', idle: 5, note: '2 options sent: Basic Plus + Basic.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dhgpharma.com.vn', since: '—' },
  { name: 'Vietjet Air', shortName: 'Vietjet', legalName: 'Công ty Cổ phần Hàng không Vietjet', country: 'Việt Nam', tax: '0335xxxxxx', industry: 'Hàng không', size: '5000+', address: 'Tân Bình, HCMC', contact: 'Ms. Hoàng Bảo Ngân · TA Manager', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quote expires 04/08 — nudge', idle: 13, note: 'Comparing our quote against TopCV.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vietjetair.com', since: '—' },
  { name: 'Công ty TNHH Kim Long Steel', shortName: 'Kim Long', legalName: 'Công ty TNHH Thép Kim Long', country: 'Việt Nam', tax: '0336xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Đồng Nai', parent: 'Công ty TNHH Cơ khí Đông Phong', contact: 'Mr. Vương Chí Kiên · HR', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quote lapsed — re-issue or close', idle: 126, note: 'Quotation expired 10 days ago.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'kimlongsteel.vn', since: '—' },
  // More Negotiation cover — long internal-approval cycles, so the reds run deep here
  { name: 'Techcombank', shortName: 'Techcombank', legalName: 'Ngân hàng TMCP Kỹ Thương Việt Nam', country: 'Việt Nam', tax: '0337xxxxxx', industry: 'Tài chính', size: '5000+', address: 'Cầu Giấy, Hà Nội', contact: 'Ms. Phùng Diệu Linh · Head of TA', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Waiting on procurement sign-off', idle: 17, note: 'Legal reviewing our T&C clause 4.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'techcombank.com.vn', since: '—' },
  { name: 'Công ty CP Bán lẻ Thiên Hà', shortName: 'Thiên Hà', legalName: 'Công ty Cổ phần Bán lẻ Thiên Hà', country: 'Việt Nam', tax: '0338xxxxxx', industry: 'Bán lẻ', size: '500–1000', address: 'Đà Nẵng', contact: 'Mr. Đỗ Nhật Trường · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send v3 quote at 12% discount', idle: 26, note: 'Board meets month-end to approve.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'thienharetail.vn', since: '—' },
  { name: 'Công ty TNHH Bảo Sơn Group', shortName: 'Bảo Sơn', legalName: 'Công ty TNHH Tập đoàn Bảo Sơn', country: 'Việt Nam', tax: '0339xxxxxx', industry: 'Bất động sản', size: '1000–5000', address: 'Nam Từ Liêm, Hà Nội', contact: 'Ms. Cao Quỳnh Anh · HR', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — 7 weeks silent', idle: 51, note: 'Sponsor left the company; no new contact.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'baosongroup.com', since: '—' },
  // More PO cover — order confirmed, payment outstanding by varying degrees
  { name: 'Công ty CP Vinh Quang Logistics', shortName: 'Vinh Quang', legalName: 'Công ty Cổ phần Vinh Quang Logistics', country: 'Việt Nam', tax: '0340xxxxxx', industry: 'Logistics', size: '200–500', address: 'Hải Phòng', contact: 'Mr. Bùi Xuân Trường · HC-NS', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '24/07/2026', renewal: '24/10/2026', nextStep: 'Awaiting transfer — due 31/07', idle: 3, note: 'Order confirmed; bank details sent.', revenue: 31_000_000, jobPosting: true, resumeSearch: false, jobLeft: 5, jobTotal: 5, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinhquanglog.vn', since: '24/07/2026' },
  { name: 'Lazada Việt Nam', shortName: 'Lazada', legalName: 'Công ty TNHH Recess (Lazada Việt Nam)', country: 'Việt Nam', tax: '0341xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 1, HCMC', contact: 'Ms. Trương Mỹ Hạnh · TA Lead', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '15/07/2026', renewal: '15/10/2026', nextStep: 'Chase payment — 12d out', idle: 12, note: 'Their finance runs a 30-day cycle.', revenue: 195_000_000, jobPosting: true, resumeSearch: true, jobLeft: 20, jobTotal: 20, cvLeft: 150, cvTotal: 150, hasPage: false, jobs: 0, domain: 'lazada.vn', since: '15/07/2026' },
  { name: 'Công ty CP Xây dựng Hưng Thịnh', shortName: 'Hưng Thịnh', legalName: 'Công ty Cổ phần Xây dựng Hưng Thịnh', country: 'Việt Nam', tax: '0342xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Quận Bình Thạnh, HCMC', contact: 'Mr. Phan Đăng Hải · Giám đốc NS', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '04/07/2026', renewal: '04/10/2026', nextStep: 'Payment 25d overdue — escalate', idle: 25, note: 'Signed PO but no transfer; CFO on leave.', revenue: 88_000_000, jobPosting: true, resumeSearch: true, jobLeft: 15, jobTotal: 15, cvLeft: 80, cvTotal: 80, hasPage: false, jobs: 0, domain: 'hungthinhcorp.vn', since: '04/07/2026' },
  // Lost — closed, so no rot colour at all
  { name: 'Công ty CP Công nghệ Tân Tiến', shortName: 'Tân Tiến', legalName: 'Công ty Cổ phần Công nghệ Tân Tiến', country: 'Việt Nam', tax: '0343xxxxxx', industry: 'CNTT', size: '200–500', address: 'Quận 7, HCMC', contact: 'Mr. Hoàng Việt Dũng · CTO', owner: 'Phạm Quang Huy', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Nurture — revisit Q1 2027', idle: 40, note: 'Lost to competitor on price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tantien.tech', since: '—' },
  { name: 'Công ty TNHH Đức Thành', shortName: 'Đức Thành', legalName: 'Công ty TNHH Thương mại Đức Thành', country: 'Việt Nam', tax: '0344xxxxxx', industry: 'Bán lẻ', size: '50–200', address: 'Quận Gò Vấp, HCMC', contact: 'Ms. Lưu Ngọc Diễm · HR', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '20/05/2025', renewal: 'Lapsed', nextStep: 'Win-back call in August', idle: 33, note: 'Hiring frozen; no budget this year.', revenue: 18_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'ducthanh.com.vn', since: '20/05/2024' },
  // Invoice — won and closed
  // The company behind the client's real quotation QUO-009909-07-2026, so that
  // quotation resolves to a CRM record like every other one.
  { name: 'Công ty TNHH AM Software Việt Nam', shortName: 'AM Software', legalName: 'CÔNG TY TNHH AM SOFTWARE VIỆT NAM', country: 'Việt Nam', tax: '0317110315', industry: 'CNTT', size: '50–200', address: '115/2A Lê Trọng Tấn, Phường Sơn Kỳ, Quận Tân Phú, HCMC', contact: 'Mr. Nguyễn Huy · HR', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 9, note: 'Quotation sent 20/07 — 2 options.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'aoimirai.co.jp', since: '—' },
  { name: 'Sacombank', shortName: 'Sacombank', legalName: 'Ngân hàng TMCP Sài Gòn Thương Tín', country: 'Việt Nam', tax: '0345xxxxxx', industry: 'Tài chính', size: '5000+', address: 'Quận 3, HCMC', contact: 'Ms. Nguyễn Lê Vy · Head of Talent', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '08/06/2026', renewal: '08/12/2026', nextStep: 'Quarterly review', idle: 66, note: 'Renewed for a second year.', revenue: 380_000_000, jobPosting: true, resumeSearch: true, jobLeft: 25, jobTotal: 40, cvLeft: 220, cvTotal: 350, hasPage: true, jobs: 19, domain: 'sacombank.com.vn', since: '08/06/2025' },
  { name: 'Công ty TNHH Giáo dục Sunrise', shortName: 'Sunrise Edu', legalName: 'Công ty TNHH Giáo dục Sunrise', country: 'Việt Nam', tax: '0331xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận Tân Phú, HCMC', contact: 'Ms. Lưu Ngọc Hân · HR', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send quotation options', idle: 2, note: 'Discovery call done; keen on Resume Search.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'sunriseedu.vn', since: '—' },
  { name: 'Công ty CP Bảo Việt Care', shortName: 'Bảo Việt Care', legalName: 'Công ty Cổ phần Bảo Việt Care', country: 'Việt Nam', tax: '0332xxxxxx', industry: 'Y tế', size: '500–1000', address: 'Quận 5, HCMC', contact: 'Ms. Trịnh Bích Thảo · TA Lead', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '28/05/2026', renewal: '28/11/2026', nextStep: 'Quarterly review', idle: 79, note: 'Renewal talk starts next month.', revenue: 185_000_000, jobPosting: true, resumeSearch: true, jobLeft: 14, jobTotal: 20, cvLeft: 120, cvTotal: 200, hasPage: true, jobs: 11, domain: 'baovietcare.vn', since: '14/06/2025' },
  // ── Volume rows: enough companies for the pipeline board and the list to feel
  // like a real book of business — every stage populated, owners rotated across
  // the three reps, idle values spanning fresh / amber / red.
  { name: 'Công ty CP Vĩnh Cửu', shortName: 'Vĩnh Cửu', legalName: 'Công ty Cổ phần Vĩnh Cửu', country: 'Việt Nam', tax: '0333xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', contact: 'Ms. Lê Kim Chi · HR', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up in 2 days', idle: 3, note: 'Quotation sent, awaiting review.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinhcuu.vn', since: '—' },
  { name: 'Công ty TNHH Bách Khoa Tech', shortName: 'Bách Khoa', legalName: 'Công ty TNHH Bách Khoa Technology', country: 'Việt Nam', tax: '0334xxxxxx', industry: 'CNTT', size: '50–200', address: 'Quận 10, HCMC', contact: 'Mr. Vương Tuấn Kiệt · CTO', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Call the HR manager', idle: 9, note: 'No reply since the quotation.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'bachkhoatech.vn', since: '—' },
  { name: 'Công ty CP Nội thất Sài Gòn', shortName: 'Nội thất SG', legalName: 'Công ty Cổ phần Nội thất Sài Gòn', country: 'Việt Nam', tax: '0335xxxxxx', industry: 'Bán lẻ', size: '200–500', address: 'Quận 12, HCMC', contact: 'Ms. Trần Thảo Vy · HR', owner: 'Trần Quốc Trung', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Reissue or close', idle: 19, note: 'Quotation validity almost up.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'noithatsg.vn', since: '—' },
  { name: 'Công ty TNHH Dệt may Phong Phú', shortName: 'Phong Phú', legalName: 'Công ty TNHH Dệt may Phong Phú', country: 'Việt Nam', tax: '0336xxxxxx', industry: 'Dệt may', size: '1000–5000', address: 'Quận 9, HCMC', contact: 'Mr. Bùi Hữu Lộc · Trưởng phòng NS', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Clarify option B', idle: 5, note: 'Comparing our 3 options.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phongphu.com.vn', since: '—' },
  { name: 'Công ty CP Dược Nam Hà', shortName: 'Nam Hà', legalName: 'Công ty Cổ phần Dược Nam Hà', country: 'Việt Nam', tax: '0337xxxxxx', industry: 'Y tế', size: '1000–5000', address: 'Cần Thơ', contact: 'Ms. Nguyễn Bảo Châu · HR Director', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Decide: reissue or Lost', idle: 24, note: 'Silent for over 3 weeks.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dhgpharma.com.vn', since: '—' },
  { name: 'Công ty TNHH Cơ khí Tây Đô', shortName: 'Tây Đô', legalName: 'Công ty TNHH Cơ khí Tây Đô', country: 'Việt Nam', tax: '0338xxxxxx', industry: 'Cơ khí', size: '200–500', address: 'Hải Dương', contact: 'Mr. Hà Trọng Tín', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Book the demo', idle: 2, note: 'Wants a demo next week.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'taydock.vn', since: '—' },
  { name: 'Công ty CP Vận tải Bắc Nam', shortName: 'Bắc Nam', legalName: 'Công ty Cổ phần Vận tải Bắc Nam', country: 'Việt Nam', tax: '0339xxxxxx', industry: 'Logistics', size: '500–1000', address: 'Đà Nẵng', contact: 'Ms. Đỗ Lan Phương · HC-NS', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask about budget cycle', idle: 11, note: 'Budget check in progress.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'bacnamlogistics.vn', since: '—' },
  { name: 'Công ty TNHH Kiến Á', shortName: 'Kiến Á', legalName: 'Công ty TNHH Đầu tư Kiến Á', country: 'Việt Nam', tax: '0340xxxxxx', industry: 'Bất động sản', size: '200–500', address: 'Quận 2, HCMC', contact: 'Mr. Lâm Chí Cường · HR', owner: 'Phạm Quang Huy', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate to sales lead', idle: 16, note: 'Went quiet after first call.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'kiena.vn', since: '—' },
  { name: 'Công ty CP Bia Sài Gòn Miền Tây', shortName: 'Bia SG MT', legalName: 'Công ty Cổ phần Bia Sài Gòn Miền Tây', country: 'Việt Nam', tax: '0341xxxxxx', industry: 'Thực phẩm', size: '500–1000', address: 'Cần Thơ', contact: 'Ms. Phạm Ngọc Diệp', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send quotation options', idle: 6, note: 'Interested in Resume Search.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'biasgmt.vn', since: '—' },
  { name: 'Công ty TNHH Thiết bị Y tế Việt', shortName: 'TBYT Việt', legalName: 'Công ty TNHH Thiết bị Y tế Việt', country: 'Việt Nam', tax: '0342xxxxxx', industry: 'Y tế', size: '50–200', address: 'Quận 5, HCMC', contact: 'Mr. Tôn Quang Vinh · HR', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Discovery call', idle: 4, note: 'Referred by an existing client.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tbytviet.vn', since: '—' },
  { name: 'Công ty CP Xi măng Hà Tiên', shortName: 'Hà Tiên', legalName: 'Công ty Cổ phần Xi măng Hà Tiên', country: 'Việt Nam', tax: '0343xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Kiên Giang', contact: 'Ms. Cao Thị Lệ · HR Manager', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send revised quote', idle: 14, note: 'Haggling on the 6-month price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hatien.com.vn', since: '—' },
  { name: 'Công ty TNHH Phần mềm Rikkei', shortName: 'Rikkei', legalName: 'Công ty TNHH Phần mềm Rikkei', country: 'Nhật Bản / Japan', tax: '0344xxxxxx', industry: 'CNTT', size: '500–1000', address: 'Cầu Giấy, Hà Nội', contact: 'Mr. Đặng Minh Hoàng · TA Lead', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask for approval date', idle: 27, note: 'Waiting on their board.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'rikkeisoft.com', since: '—' },
  { name: 'Công ty CP Thủy sản Minh Phú', shortName: 'Minh Phú', legalName: 'Công ty Cổ phần Thủy sản Minh Phú', country: 'Việt Nam', tax: '0345xxxxxx', industry: 'Thủy sản', size: '1000–5000', address: 'Cà Mau', contact: 'Ms. Võ Kim Ngân · HR', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — likely dead', idle: 48, note: 'Stalled well past 45d.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'minhphu.com', since: '—' },
  { name: 'Công ty TNHH Bảo hiểm Tín Việt', shortName: 'Tín Việt', legalName: 'Công ty TNHH Bảo hiểm Tín Việt', country: 'Việt Nam', tax: '0346xxxxxx', industry: 'Tài chính', size: '200–500', address: 'Quận 1, HCMC', contact: 'Mr. Nguyễn Đình Phúc', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Prepare the order', idle: 7, note: 'Agreed terms verbally.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tinviet.vn', since: '—' },
  { name: 'Công ty CP Du lịch Phương Nam', shortName: 'Phương Nam', legalName: 'Công ty Cổ phần Du lịch Phương Nam', country: 'Việt Nam', tax: '0347xxxxxx', industry: 'Du lịch', size: '50–200', address: 'Nha Trang', contact: 'Ms. Huỳnh Mai Trâm · HR', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '16/07/2026', renewal: '16/10/2026', nextStep: 'Hand to Accounting', idle: 2, note: 'PO signed, invoice next.', revenue: 63_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 30, cvLeft: 54, cvTotal: 100, hasPage: true, jobs: 7, domain: 'phuongnamtravel.vn', since: '16/07/2026' },
  { name: 'Công ty TNHH Giấy Tân Mai', shortName: 'Tân Mai', legalName: 'Công ty TNHH Giấy Tân Mai', country: 'Việt Nam', tax: '0348xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Đồng Nai', contact: 'Mr. Trịnh Bá Hưng · HC-NS', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '17/07/2026', renewal: '17/10/2026', nextStep: 'Chase payment', idle: 12, note: 'Payment not received yet.', revenue: 80_000_000, jobPosting: true, resumeSearch: false, jobLeft: 7, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 8, domain: 'tanmai.vn', since: '17/07/2026' },
  { name: 'Công ty CP Điện máy Thành Công', shortName: 'Thành Công', legalName: 'Công ty Cổ phần Điện máy Thành Công', country: 'Việt Nam', tax: '0349xxxxxx', industry: 'Bán lẻ', size: '500–1000', address: 'Quận Gò Vấp, HCMC', contact: 'Ms. Lý Thu Trang · HR', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '18/07/2026', renewal: '18/10/2026', nextStep: 'Escalate to Accounting lead', idle: 23, note: 'Payment badly overdue.', revenue: 97_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 56, cvTotal: 100, hasPage: true, jobs: 9, domain: 'thanhcongdm.vn', since: '18/07/2026' },
  { name: 'Công ty TNHH Logistics Sao Việt', shortName: 'Sao Việt', legalName: 'Công ty TNHH Logistics Sao Việt', country: 'Việt Nam', tax: '0350xxxxxx', industry: 'Logistics', size: '200–500', address: 'Hải Phòng', contact: 'Mr. Phan Đức Duy', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '19/07/2026', renewal: '19/10/2026', nextStep: 'Kickoff call', idle: 92, note: 'Onboarding in progress.', revenue: 114_000_000, jobPosting: true, resumeSearch: true, jobLeft: 9, jobTotal: 30, cvLeft: 57, cvTotal: 100, hasPage: true, jobs: 10, domain: 'saovietlog.vn', since: '19/07/2026' },
  { name: 'Công ty CP Giáo dục Én Nhỏ', shortName: 'Én Nhỏ', legalName: 'Công ty Cổ phần Giáo dục Én Nhỏ', country: 'Việt Nam', tax: '0351xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận Phú Nhuận, HCMC', contact: 'Ms. Ngô Hải Yến · HR', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '20/07/2026', renewal: '20/10/2026', nextStep: 'Quarterly review', idle: 105, note: 'Using both products actively.', revenue: 131_000_000, jobPosting: true, resumeSearch: false, jobLeft: 4, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 2, domain: 'ennho.edu.vn', since: '21/01/2025' },
  { name: 'Công ty TNHH Sơn Đại Việt', shortName: 'Đại Việt', legalName: 'Công ty TNHH Sơn Đại Việt', country: 'Việt Nam', tax: '0352xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Long An', contact: 'Mr. Chu Văn Thái', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '21/07/2026', renewal: '21/10/2026', nextStep: 'Check-in — usage is low', idle: 118, note: 'Quiet since activation.', revenue: 148_000_000, jobPosting: true, resumeSearch: true, jobLeft: 5, jobTotal: 20, cvLeft: 59, cvTotal: 100, hasPage: true, jobs: 3, domain: 'sondaiviet.vn', since: '21/07/2026' },
  { name: 'Công ty CP Nông sản Xanh', shortName: 'Nông sản Xanh', legalName: 'Công ty Cổ phần Nông sản Xanh', country: 'Việt Nam', tax: '0353xxxxxx', industry: 'Nông nghiệp', size: '200–500', address: 'Lâm Đồng', contact: 'Ms. Trương Bích Hạnh · HR', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '22/07/2026', renewal: '22/10/2026', nextStep: 'Prepare renewal quote', idle: 46, note: 'Renewal in 2 months.', revenue: 165_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 30, cvLeft: 60, cvTotal: 100, hasPage: true, jobs: 4, domain: 'nongsanxanh.vn', since: '23/03/2025' },
  { name: 'Công ty TNHH Nhựa Bình Phát', shortName: 'Bình Phát', legalName: 'Công ty TNHH Nhựa Bình Phát', country: 'Việt Nam', tax: '0354xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Bình Dương', contact: 'Mr. Đoàn Quốc Huy · HR', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '23/07/2026', renewal: '23/10/2026', nextStep: 'Re-engage before renewal', idle: 31, note: 'No contact in a month.', revenue: 182_000_000, jobPosting: true, resumeSearch: false, jobLeft: 7, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 5, domain: 'binhphat.vn', since: '23/07/2026' },
  { name: 'Công ty CP Bán lẻ Vạn Xuân', shortName: 'Vạn Xuân', legalName: 'Công ty Cổ phần Bán lẻ Vạn Xuân', country: 'Việt Nam', tax: '0355xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Ms. Tạ Mỹ Linh · TA Manager', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '24/07/2026', renewal: '24/10/2026', nextStep: 'Upsell Resume Search', idle: 59, note: 'Repeat customer, 3rd order.', revenue: 199_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 62, cvTotal: 100, hasPage: true, jobs: 6, domain: 'vanxuan.vn', since: '25/05/2025' },
  { name: 'Công ty TNHH Kỹ thuật Nam Việt', shortName: 'Nam Việt', legalName: 'Công ty TNHH Kỹ thuật Nam Việt', country: 'Việt Nam', tax: '0356xxxxxx', industry: 'Cơ khí', size: '200–500', address: 'Quận Tân Bình, HCMC', contact: 'Mr. Lưu Anh Tú', owner: 'Trần Quốc Trung', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-engage next quarter', idle: 35, note: 'Chose a competitor on price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'namvieteng.vn', since: '—' },
  { name: 'Công ty CP Chứng khoán Đại Nam', shortName: 'CK Đại Nam', legalName: 'Công ty Cổ phần Chứng khoán Đại Nam', country: 'Việt Nam', tax: '0357xxxxxx', industry: 'Tài chính', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Hồ Diễm Quỳnh · HR', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Nurture — revisit Q1', idle: 44, note: 'Budget frozen for the year.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'cknam.vn', since: '—' },
  { name: 'Công ty TNHH Mỹ phẩm Hương Sen', shortName: 'Hương Sen', legalName: 'Công ty TNHH Mỹ phẩm Hương Sen', country: 'Việt Nam', tax: '0358xxxxxx', industry: 'FMCG', size: '50–200', address: 'Quận 7, HCMC', contact: 'Ms. Bạch Tuyết Nhi', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send discount options', idle: null, note: 'Inbound sign-up — nobody has called yet.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'huongsen.vn', since: '—' },
  { name: 'Công ty CP Thép Việt Đức', shortName: 'Thép Việt Đức', legalName: 'Công ty Cổ phần Thép Việt Đức', country: 'Việt Nam', tax: '0359xxxxxx', industry: 'Sản xuất', size: '1000–5000', address: 'Vĩnh Phúc', contact: 'Mr. Kiều Mạnh Hà · Trưởng phòng NS', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Retry after 01/08', idle: 9, note: 'HR manager on leave.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'thepvietduc.vn', since: '—' },
  { name: 'Công ty TNHH Cà phê Ban Mê', shortName: 'Ban Mê', legalName: 'Công ty TNHH Cà phê Ban Mê', country: 'Việt Nam', tax: '0360xxxxxx', industry: 'Thực phẩm', size: '200–500', address: 'Đắk Lắk', contact: 'Ms. Phùng Thanh Thúy · HR', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase legal', idle: 22, note: 'Legal reviewing our T&C.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'banmecoffee.vn', since: '—' },
  { name: 'Công ty CP Công nghệ TekOne', shortName: 'TekOne', legalName: 'Công ty Cổ phần Công nghệ TekOne', country: 'Việt Nam', tax: '0361xxxxxx', industry: 'CNTT', size: '50–200', address: 'Quận 4, HCMC', contact: 'Mr. Trần Gia Bảo · CEO', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '04/07/2026', renewal: '04/10/2026', nextStep: 'Ask for a testimonial', idle: null, note: 'Inbound sign-up — nobody has called yet.', revenue: 101_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 68, cvTotal: 100, hasPage: true, jobs: 3, domain: 'tekone.vn', since: '06/02/2025' },
  { name: 'Công ty TNHH An Toàn Lao Động Việt', shortName: 'ATLĐ Việt', legalName: 'Công ty TNHH An Toàn Lao Động Việt', country: 'Việt Nam', tax: '0362xxxxxx', industry: 'Dịch vụ', size: '50–200', address: 'Quận Bình Tân, HCMC', contact: 'Ms. Dương Kiều My', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '05/07/2026', renewal: '05/10/2026', nextStep: 'Collect PO number', idle: 6, note: 'Awaiting their PO number.', revenue: 118_000_000, jobPosting: true, resumeSearch: true, jobLeft: 9, jobTotal: 30, cvLeft: 69, cvTotal: 100, hasPage: true, jobs: 4, domain: 'atldviet.vn', since: '05/07/2026' },
  { name: 'Công ty CP Khách sạn Biển Đông', shortName: 'Biển Đông', legalName: 'Công ty Cổ phần Khách sạn Biển Đông', country: 'Việt Nam', tax: '0363xxxxxx', industry: 'Du lịch', size: '500–1000', address: 'Đà Nẵng', contact: 'Mr. Nguyễn Hải Sơn · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Confirm option 2', idle: 13, note: 'Second option preferred.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'biendonghotel.vn', since: '—' },
  { name: 'Công ty TNHH Thương mại Hoàng Long', shortName: 'Hoàng Long', legalName: 'Công ty TNHH Thương mại Hoàng Long', country: 'Việt Nam', tax: '0364xxxxxx', industry: 'Bán lẻ', size: '200–500', address: 'Quận 6, HCMC', contact: 'Ms. Đinh Thu Hà', owner: 'Phạm Quang Huy', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Qualify need & budget', idle: 3, note: 'Inbound from the website.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hoanglongtm.vn', since: '—' },
]

/* Colour carries meaning, so customer status must not borrow RED. On a company row
   red already means "act now" three times over — idle past its red threshold, a
   lapsed quotation, never contacted. Churn is none of those: it is a factual
   lifecycle state (no new order in 12 months) and commercially it is an
   OPPORTUNITY — a churned customer is the warmest win-back lead we have. Amber
   reads as attention-not-alarm, which is exactly the register, and it leaves red
   free for the markers that genuinely demand action today. */
const AC_STATUS: Record<Account, { tone: StatusTone; label: string }> = {
  New: { tone: 'draft', label: 'New' },
  Existing: { tone: 'active', label: 'Existing' },
  Churn: { tone: 'pending', label: 'Churn' },
}
/* Onboarding is a CADENCE, not a status — the first 90 days after the first
   invoice, when a fresh customer needs a tighter touch. The real system reads
   firstInvoicedAt; the mock uses `since`, which is the same date. */
const ONBOARDING_DAYS = 90
const TODAY = new Date(2026, 6, 29) // 29/07/2026 — the mock's "now"
const daysSince = (dmy: string) => {
  const [d, m, y] = dmy.split('/').map(Number)
  if (!d || !m || !y) return Infinity // "—" — never activated
  return Math.round((TODAY.getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000)
}
// A company shows a pipeline step only while a deal is open (before it closes at
// Invoice, or dies at Lost). Settled customers show "—".
/* On the board or not. Three ways off it, and only one of them is a decision:
   closed-won (Invoice), closed-lost (Lost, by a human with a reason), and the
   quotation EXPIRING. The quotation is the reason the card exists, so when it
   lapses the card goes with it — but that is not Lost: no reason, no decision,
   customer status untouched, and a new quotation puts them straight back. */
const inPipeline = (c: Company) => c.status !== 'Invoice' && c.status !== 'Lost' && !c.quoteLapsed
const revFmt = (v: number) => (v === 0 ? '—' : (v / 1e6).toFixed(0) + 'M ₫')

/* ── Create-PO gate ───────────────────────────────────────────────────────────
   A sales order / PO is only ever created from ONE ACCEPTED quotation option —
   never from scratch, and never from a quotation that has lapsed (T&C clause 2:
   the discounts and gifts were only committed until the expiry date). So the
   button is always visible on a pre-PO company, but it explains itself when it
   cannot fire. Demo mapping by stage: Qualified/Proposal = quote out, not yet
   accepted · Proposal + idle > 14d = quote lapsed · Negotiation = an option has
   been accepted, so the PO can be raised. */
function poGate(c: Company): { ok: boolean; reason?: string; quote: string } {
  const quote = `QUO-0099${(c.tax.replace(/\D/g, '').slice(0, 2) || '10')}-07-2026`
  if (c.status === 'PO' || c.status === 'Invoice') return { ok: false, reason: 'An order already exists for this deal.', quote }
  if (c.status === 'Lost') return { ok: false, reason: 'The deal is closed-lost. Re-open it or start a new deal first.', quote }
  if (c.status === 'Qualified') return { ok: false, reason: 'No quotation option has been accepted yet.', quote }
  if (c.status === 'Proposal') {
    return (c.idle ?? 0) > 14
      ? { ok: false, reason: 'The quotation has lapsed past its validity — extend it or re-issue as v2 before raising an order.', quote }
      : { ok: false, reason: 'The quotation is sent but no option has been accepted yet.', quote }
  }
  return { ok: true, quote } // Negotiation — an option is agreed, raise the order
}

/* ── Idle ──────────────────────────────────────────────────────────────────
   Idle = days since the last human CONTACT with the client. Reset only by a real
   touch (logged chat/call/meeting, or a document sent/confirmed); system events
   (auto-reminders, provisioning, page publishes) must NOT reset it.

   ONE rule everywhere — the same definition, thresholds table and display on the
   Companies list and the Pipeline board. The rule is "idle vs the EXPECTED CONTACT
   CADENCE for this relationship type", i.e. one formula reading a settings table,
   never per-stage logic sprinkled through the code. A company with an open deal
   always uses the openDeal row: the live opportunity sets the pace. */
type Cadence = 'openDeal' | 'onboarding' | 'existing' | 'nurture' | 'churn'
const IDLE_RULE: Record<Cadence, { amber: number; red: number; cadence: string }> = {
  openDeal:    { amber: 7,  red: 14, cadence: 'weekly' },
  onboarding:  { amber: 14, red: 30, cadence: 'fortnightly' }, // Existing, first 90 days after the first invoice
  existing:    { amber: 30, red: 60, cadence: 'monthly' },
  nurture:     { amber: 30, red: 60, cadence: 'monthly' },     // New (never bought), no open deal
  churn:       { amber: 60, red: 90, cadence: 'quarterly' },   // win-back
}
/* Sort options for the Companies list. The default is "chưa liên hệ lâu nhất" —
   with the Needs-attention filter gone, ordering by neglect is what puts the rows a
   rep must act on at the top, without spending a colour channel on every row.
   Never-contacted (idle null) sorts first: it is the highest-priority follow-up. */
type CoSort = 'contact-old' | 'contact-new' | 'name' | 'revenue'
const idleRank = (c: Company) => (c.idle === null ? Infinity : c.idle)
const CO_SORTS: Record<CoSort, { label: string; cmp: (a: Company, b: Company) => number }> = {
  'contact-old': { label: 'Chưa liên hệ lâu nhất', cmp: (a, b) => idleRank(b) - idleRank(a) },
  'contact-new': { label: 'Liên hệ gần đây nhất', cmp: (a, b) => idleRank(a) - idleRank(b) },
  name: { label: 'Tên công ty A → Z', cmp: (a, b) => coLabel(a).localeCompare(coLabel(b), 'vi') },
  revenue: { label: 'Doanh thu cao nhất', cmp: (a, b) => b.revenue - a.revenue },
}

function cadenceOf(c: Company): Cadence {
  if (inPipeline(c)) return 'openDeal'
  if (c.account === 'Churn') return 'churn'
  if (c.account === 'New') return 'nurture'
  return daysSince(c.since) <= ONBOARDING_DAYS ? 'onboarding' : 'existing'
}
type Rot = 'fresh' | 'amber' | 'red'
function idleOf(days: number, k: Cadence = 'openDeal'): Rot {
  const t = IDLE_RULE[k]
  return days >= t.red ? 'red' : days >= t.amber ? 'amber' : 'fresh'
}
/** ONE display rule, used on both the Companies list and the Pipeline board:
    under a month reads in days ("12d"); a month or more rolls up to months +
    remainder ("1m 18d", "3m 2d") so a long gap stays readable instead of "92d".
    Still used wherever a DURATION is what is being said ("2m 4d ago" on the
    activity trail); the Last-contact column shows the date itself instead. */
function fmtIdle(days: number): string {
  if (days < 30) return `${days}d`
  const m = Math.floor(days / 30)
  const d = days % 30
  return d ? `${m}m ${d}d` : `${m}m`
}
/* Fixed "today" for the mock so the dates it derives stay stable across reloads
   and match the hand-written dates elsewhere in the data (lastPO, renewal…). */
const MOCK_TODAY = new Date(2026, 7, 8)
/** A gap in days, rendered as the DATE that gap points back to — dd/mm/yyyy.
    `short` drops the year, for places where the column is one of several things
    competing for a narrow card. The full date is always in the tooltip. */
function dateBefore(days: number, short?: boolean): string {
  const d = new Date(MOCK_TODAY)
  d.setDate(d.getDate() - days)
  const dm = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  return short ? dm : `${dm}/${d.getFullYear()}`
}
const ROT_TEXT: Record<Rot, string> = {
  fresh: 'text-muted',
  amber: 'text-amber-600 font-medium',
  red: 'text-rose-600 font-medium',
}
const ROT_DOT: Record<Rot, string> = { fresh: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500' }
/** Idle read-out: a health dot + the gap. `days = null` → never contacted at all,
    which is a DISTINCT state from 0d and the highest-priority follow-up. */
/**
 * `compact` is the KANBAN-CARD read-out: dd/mm with no year, no health dot and no
 * colour. A card already carries its stage, its value and its owner — a fourth
 * coloured signal there competes with the stage rather than adding to it, and the
 * card is narrow enough that the year is four characters of noise. The full date,
 * the gap in days and the threshold are all still one hover away.
 */
function Idle({ days, kind = 'openDeal', dotOnly, compact }: { days: number | null; kind?: Cadence; dotOnly?: boolean; compact?: boolean }) {
  if (days === null) {
    return (
      <span className={cn('inline-flex items-center gap-1', compact ? 'text-muted' : 'font-medium text-rose-600')} title="Chưa có liên hệ nào được ghi nhận cho công ty này — ưu tiên theo dõi cao nhất.">
        {!compact && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
        {dotOnly ? null : compact ? '—' : 'Chưa liên hệ'}
      </span>
    )
  }
  const t = IDLE_RULE[kind]
  const rot = idleOf(days, kind)
  const tip = `Liên hệ gần nhất ${dateBefore(days)} — ${days} ngày trước. ${kind} expects ${t.cadence} contact: amber from ${t.amber}d, red from ${t.red}d.`
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums', compact ? 'text-muted' : ROT_TEXT[rot])} title={tip}>
      {!compact && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', ROT_DOT[rot])} />}
      {dotOnly ? null : dateBefore(days, compact)}
    </span>
  )
}


const CO_STATUS: Record<CoStatus, { tone: StatusTone; label: string }> = {
  Qualified: { tone: 'draft', label: 'Qualified' },
  Proposal: { tone: 'neutral', label: 'Proposal' },
  Negotiation: { tone: 'pending', label: 'Negotiation' },
  PO: { tone: 'schedule', label: 'PO' },
  Invoice: { tone: 'active', label: 'Invoice' },
  Lost: { tone: 'rejected', label: 'Lost' },
}
// Board order follows the document flow: the quotation goes out (Proposal), the HR
// manager engages with it (Qualified), then internal approval (Negotiation) → PO → Invoice.
const CO_ORDER: CoStatus[] = ['Proposal', 'Qualified', 'Negotiation', 'PO', 'Invoice', 'Lost']
/* WHO moves a card out of each stage, and by doing what. Surfaced as the column
   tooltip so the rule lives where the work happens instead of only in the spec — a
   rep should not have to open the requirement to learn that PO waits on Accounting.
   Mirrors the "Rule" column of "Pipeline stages" in the CRM requirement; keep the
   two in step. */
const STAGE_NEXT: Record<CoStatus, string> = {
  Proposal: 'SALES chases the customer for a reply. The card landed here automatically the moment the quotation was marked Sent — it is never dragged in.',
  Qualified: 'SALES agrees the option and the price, then moves the card on. This stage can be skipped entirely — Proposal → Negotiation is legal.',
  Negotiation: 'SALES creates the Sales order from the option the customer accepted. Revising to v2 / v3 happens here without leaving the stage.',
  PO: 'KẾ TOÁN ONLY confirms the payment against the bank statement. Won — but nothing is provisioned yet.',
  Invoice: 'Closed. KẾ TOÁN issued the VAT e-invoice; the system then flipped the customer to Existing, started the 12-month clock and released provisioning.',
  Lost: 'SALES set this by hand with a reason — the system never auto-closes a deal. Re-open by moving it back a stage; a win-back is a NEW deal.',
}
// A company is a customer once a PO is issued (PO or Invoice stage).
const isCustomer = (c: Company) => c.status === 'PO' || c.status === 'Invoice'
/** Full VND — e.g. 18,000,000 ₫ (pipeline values are read exactly, not rounded to M). */
const vnd = (v: number) => v.toLocaleString('en-US') + ' ₫'
const CO_VALUE: Record<string, number> = {
  'Công ty TNHH Đại Dương': 42_000_000, 'Công ty CP Bình Minh': 68_000_000, 'Công ty TNHH Sao Mai': 155_000_000,
  'Công ty TNHH Vạn Phát': 37_800_000, 'FPT Software': 420_000_000, 'Công ty CP Hoàng Gia': 20_000_000,
  'Công ty TNHH Việt Tiến': 90_000_000, 'Tiki': 300_000_000,
  'VNG Corporation': 510_000_000, 'MoMo': 150_000_000, 'Thế Giới Di Động': 620_000_000,
  'Shopee Việt Nam': 245_000_000, 'Base.vn': 18_000_000, 'Công ty CP Đông Á': 72_000_000,
  'Công ty TNHH Minh Long': 60_000_000, 'Công ty CP Thành Đạt': 25_000_000,
  'Công ty CP An Khang': 95_000_000, 'Công ty TNHH Phú Thịnh': 33_500_000,
  'Công ty CP Nam Long': 128_000_000, 'Công ty TNHH Hòa Bình': 210_000_000,
  'Công ty CP Thương mại Vina': 76_000_000, 'Công ty TNHH An Phú Logistics': 54_000_000,
  'Công ty CP Tài chính Đại Tín': 165_000_000, 'Công ty CP Trường Sơn': 231_000_000,
  'Công ty TNHH Hải Âu Travel': 28_000_000, 'Công ty CP Tân Hưng Foods': 45_000_000,
  'Công ty TNHH Giáo dục Sunrise': 22_000_000, 'Công ty CP Bảo Việt Care': 185_000_000,
  'Công ty CP Dệt may Phương Nam': 64_000_000, 'Công ty TNHH Cơ khí Đông Phong': 41_000_000,
  'Galaxy Media': 87_000_000, 'Công ty CP Dược Hậu Giang': 240_000_000,
  'Vietjet Air': 465_000_000, 'Công ty TNHH Kim Long Steel': 58_000_000,
  'Techcombank': 540_000_000, 'Công ty CP Bán lẻ Thiên Hà': 112_000_000,
  'Công ty TNHH Bảo Sơn Group': 198_000_000, 'Công ty CP Vinh Quang Logistics': 31_000_000,
  'Lazada Việt Nam': 195_000_000, 'Công ty CP Xây dựng Hưng Thịnh': 88_000_000,
  'Công ty CP Công nghệ Tân Tiến': 74_000_000, 'Công ty TNHH Đức Thành': 18_000_000,
  'Công ty TNHH AM Software Việt Nam': 6_588_000, 'Sacombank': 380_000_000,
}
/* Deal value. Rows without an explicit entry above get a stable pseudo-value
   derived from the name, so a demo company can never render as 0 ₫ — the map only
   needs maintaining for the few figures we quote in conversation. */
const coValue = (c: Company) => {
  const explicit = CO_VALUE[c.name]
  if (explicit) return explicit
  let h = 0
  for (const ch of c.name) h = (h * 31 + ch.codePointAt(0)!) % 100000
  return (18 + (h % 43)) * 1_000_000 // 18M – 60M ₫, stable per name
}
/** Display label: prefer the short/brand name, fall back to the legal name. */
const coLabel = (c: Company) => c.shortName?.trim() || c.legalName
/* Demo stand-in for the database primary key. In the real build this is the
   company row's bigint id; here it is derived from the name so every render (and
   every screenshot) shows the same company ID. See lib/companyId.ts. */
const coKey = (c: Company) => {
  let h = 0
  for (const ch of c.name) h = (h * 131 + ch.codePointAt(0)!) % 900000
  return h + 1000
}
/** City / province — the last segment of the address (the form captures both). */
/** A Vietnamese-registered company — the only case that gets the province picker. */
const isVNCompany = (c: Company) => /^vi[eệ]t nam$|^vietnam$/i.test(c.country.trim())
const coCity = (c: Company) => c.address.split(',').pop()!.trim()
/** Demo-only: a stable lead source per company, so the field is exercised without
    authoring one on every row. Real build stores this from the New-company form. */
const LEAD_SOURCES = ['Website sign-up', 'Inbound call', 'Referral', 'Event / job fair', 'Outbound', 'Partner']
/* Latest revenue = the value of the MOST RECENT paid order, where Total revenue is
   lifetime. A first-time customer's latest equals their total; a repeat customer's
   is the last order only — the pair together shows whether an account is growing or
   coasting. Demo-only derivation; the real build reads the last paid invoice. */
const coLastRevenue = (c: Company) => {
  if (!c.revenue) return 0
  if (c.account === 'New') return c.revenue // first order = their whole history
  let h = 0
  for (const ch of c.name) h = (h * 29 + ch.codePointAt(0)!) % 7919
  const share = 0.2 + (h % 60) / 100 // 20% – 79% of lifetime, stable per company
  return Math.round((c.revenue * share) / 1_000_000) * 1_000_000
}
const coLeadSource = (c: Company) => {
  let h = 0
  for (const ch of c.name) h = (h * 17 + ch.codePointAt(0)!) % 9973
  return LEAD_SOURCES[h % LEAD_SOURCES.length]
}

/* ── Membership tier — Chương trình Khách hàng Thân thiết ───────────────────
   A THIRD status axis on the company, and the only one that is purely arithmetic:
   the tier is a function of ONE number — the cumulative value of the orders the
   company paid for inside the current programme year. It is never typed, never
   granted by a rep, and it is not account health (customerStatus) nor a live deal
   (pipeline).

   The rule that shapes everything: the accumulator RESETS on 1 January. Nothing
   carries over — a Diamond customer starts the new year with 0 ₫ accumulated and
   no tier, and climbs again from scratch. That is why the tier can never be stored
   as a plain column and forgotten: it has to be recomputed against a year window.

   Thresholds and the reward catalogue are SETTINGS (System → Membership tiers),
   not code — the programme is re-issued every year and the bands move. */
type Tier = 'Member' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
/** Ascending by threshold — the order every lookup below depends on. */
const TIERS: { key: Tier; vi: string; from: number; pill: string }[] = [
  { key: 'Member', vi: 'Thành viên', from: 30_000_000, pill: 'bg-slate-100 text-slate-600 border-slate-200' },
  { key: 'Bronze', vi: 'Đồng', from: 50_000_000, pill: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'Silver', vi: 'Bạc', from: 100_000_000, pill: 'bg-slate-200/70 text-slate-700 border-slate-300' },
  { key: 'Gold', vi: 'Vàng', from: 200_000_000, pill: 'bg-amber-50 text-amber-700 border-amber-300' },
  { key: 'Diamond', vi: 'Kim Cương', from: 300_000_000, pill: 'bg-sky-50 text-sky-700 border-sky-300' },
]
type TierRow = (typeof TIERS)[number]
/** The programme year the mock sits in, and the date the accumulator zeroes. */
const TIER_YEAR = 2026
const TIER_RESET = '01/01/2027'

/** Cumulative paid-order value inside the CURRENT programme year — the only input to
    the tier. Demo-only derivation: a company whose first invoice landed this year has
    all of its revenue in-year; an older account keeps a stable share of its lifetime;
    a churned account has booked nothing this year, which is exactly why it holds no
    tier. The real build sums paid orders whose paid date falls inside the year. */
const tierRevenue = (c: Company) => {
  if (!c.revenue || c.account === 'Churn') return 0
  if (c.since.endsWith(String(TIER_YEAR))) return c.revenue
  let h = 0
  for (const ch of c.name) h = (h * 37 + ch.codePointAt(0)!) % 6151
  const share = 0.3 + (h % 60) / 100 // 30% – 89% of lifetime, stable per company
  return Math.round((c.revenue * share) / 1_000_000) * 1_000_000
}
/** The tier an amount earns — null below the first threshold, which is a real state
    ("chưa có hạng"), not an error: most of the book sits there in January. */
const tierAt = (v: number): TierRow | null => {
  let hit: TierRow | null = null
  for (const t of TIERS) if (v >= t.from) hit = t
  return hit
}
const tierOf = (c: Company) => tierAt(tierRevenue(c))
/** The next band up and therefore the gap to sell against — null once at Diamond. */
const nextTierAt = (v: number): TierRow | null => TIERS.find((t) => v < t.from) ?? null

function TierPill({ tier, en }: { tier: TierRow | null; en?: boolean }) {
  if (!tier) {
    return (
      <span className="text-[10.5px] text-faint" title={`Chưa đạt mốc ${revFmt(TIERS[0].from)} tích lũy trong năm ${TIER_YEAR} — chưa có hạng.`}>
        Chưa có hạng
      </span>
    )
  }
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium', tier.pill)}>
      <span aria-hidden>◆</span>
      {tier.vi}
      {en && <span className="text-[9.5px] opacity-70">({tier.key})</span>}
    </span>
  )
}

/* Membership block on the company record. Deliberately shows the ARITHMETIC, not
   just the badge: accumulated-in-year, the gap to the next band, and the reset date.
   The gap is the reason a rep opens this — it is the only upsell number the loyalty
   programme produces. */
/* Membership tier as an at-a-glance STAT, not a left-column card: the tier and the
   gap to the next band are numbers a rep reads in passing, and the per-tier benefit
   table belongs in System → Membership tiers where it is configured once. */
function MembershipStat({ c }: { c: Company }) {
  const acc = tierRevenue(c)
  const tier = tierAt(acc)
  const next = nextTierAt(acc)
  const floor = tier?.from ?? 0
  const ceil = next?.from ?? TIERS[TIERS.length - 1].from
  const pct = Math.min(100, Math.max(2, ((acc - floor) / (ceil - floor)) * 100))
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">Hạng {TIER_YEAR}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <TierPill tier={tier} en />
        <span className="text-[11px] font-bold tabular-nums text-ink">{acc ? vnd(acc) : '0 ₫'}</span>
      </div>
      <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 truncate text-[10px] text-faint" title={next ? `Còn ${vnd(next.from - acc)} nữa để lên hạng ${next.vi}` : 'Đã ở hạng cao nhất'}>
        {next ? `còn ${vnd(next.from - acc)} → ${next.key}` : 'hạng cao nhất'}
      </p>
    </div>
  )
}

/* ── Corporate tree ────────────────────────────────────────────────────────
   Parent and subsidiary are separate legal entities: separate records, separate
   tax codes, separate accounts, separate billing, separate sales owners. The
   only thing the link does is let a rep see the context and click across. A
   BRANCH is the one exception in Vietnamese law — not its own legal entity, so
   it shares the parent's 10-digit tax code and only appends a -001 suffix. We
   store branches in the same tree with the same `parent` field and tell the two
   apart by comparing tax roots, so there is no second mechanism to maintain. */
const coByName = (n: string) => COMPANIES.find((x) => x.name === n)
/** The 10-digit tax number without a branch suffix — the identity of the legal entity. */
const taxRoot = (t: string) => t.split('-')[0]
/** Direct children only, in list order. */
const childrenOf = (c: Company) => COMPANIES.filter((x) => x.parent === c.name)
/** Ancestor chain, furthest first: [group root, …, direct parent]. Depth-guarded so a
    bad `parent` value can never spin the render loop. */
const ancestorsOf = (c: Company) => {
  const chain: Company[] = []
  let cur = c.parent ? coByName(c.parent) : undefined
  while (cur && chain.length < 8 && !chain.includes(cur)) {
    chain.unshift(cur)
    cur = cur.parent ? coByName(cur.parent) : undefined
  }
  return chain
}
/** The top of the group — the company itself when it has no parent. */
const groupRootOf = (c: Company) => ancestorsOf(c)[0] ?? c
/** Every company in the same group, the root included. */
const groupOf = (root: Company) => COMPANIES.filter((x) => groupRootOf(x).name === root.name)
/** True when the company is part of a group at all (has a parent or any children). */
const inGroup = (c: Company) => Boolean(c.parent) || childrenOf(c).length > 0

/* A company can hold BOTH roles at once — Đông Phong sits under Trường Sơn and has
   Kim Long Steel under it. A binary "parent OR child" label hid that middle layer
   entirely, so every mid-tier company read as a leaf. */
const coRoles = (c: Company): string[] => {
  const r: string[] = []
  if (c.parent) r.push('công ty con')
  if (childrenOf(c).length > 0) r.push('công ty mẹ')
  return r
}
/* A CHI NHÁNH is a dependent unit (đơn vị phụ thuộc), not a separate legal entity —
   its tax code is the company's 10-digit root plus a suffix (…-001). Having no legal
   personality, it cannot own capital in another company, so it can never be a công ty
   mẹ. Điều 195 defines the mẹ/con relationship by CONTROL (vốn / quyền bổ nhiệm /
   quyền sửa điều lệ), all of which a branch is incapable of holding. A company may
   well be both mẹ and con at once — that is a normal multi-tier group — but a branch
   may only ever be the child end. */

function CompaniesBoard({ onOpen, showOwner, rows = COMPANIES }: { onOpen: (c: Company) => void; showOwner?: boolean; rows?: Company[] }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, minmax(130px,1fr))' }}>
      {CO_ORDER.map((st) => {
        /* An expired quotation takes the company OFF the board — the quotation is
           why the card exists. The closed columns are unaffected: a deal that
           reached Invoice or Lost was resolved by a person, not by a lapse. */
        const list = rows.filter((c) => c.status === st && (!c.quoteLapsed || st === 'Invoice' || st === 'Lost'))
        const total = list.reduce((s, c) => s + coValue(c), 0)
        return (
          <div key={st} className="rounded-lg border border-line bg-canvas/40 p-2">
            <div className="mb-1 flex items-center justify-between" title={`${st} — next: ${STAGE_NEXT[st]}`}>
              <Pill tone={CO_STATUS[st].tone}>{st}</Pill>
              <span className="text-[11px] font-bold text-faint">{list.length}</span>
            </div>
            <p className="mb-2 text-[10.5px] text-faint tabular-nums">{list.length ? vnd(total) : '—'}</p>
            {list.map((c) => (
              <button key={c.name} onClick={() => onOpen(c)} className="mb-1.5 block w-full rounded-md border border-line bg-surface p-2 text-left hover:border-brand/40">
                <p className="truncate text-[11.5px] font-semibold text-ink">{coLabel(c)}</p>
                {/* industry sits directly under the name — it is what a rep scans to
                    judge fit and to spot clusters worth a sector play. Rendered as a
                    bordered tag, not plain text, so it reads as a category the board
                    can be filtered by rather than as a second line of the name. */}
                <span className="mt-1 inline-block max-w-full truncate rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] text-muted">{c.industry}</span>
                {/* A board column is ~130px: name, industry, value and idle are all
                    that survive truncation. Option count and next step live on the
                    record, one click away. */}
                <div className="mt-1.5 flex items-baseline justify-between gap-1">
                  <p className="min-w-0 truncate text-[11.5px] font-semibold text-ink tabular-nums">{vnd(coValue(c))}</p>
                  <span className="shrink-0 text-[10.5px]"><Idle days={c.idle} kind={cadenceOf(c)} compact /></span>
                </div>
                {showOwner && <p className="mt-0.5 truncate text-[10px] text-faint">{c.owner}</p>}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}


function QuotaBar({ left, total }: { left: number; total: number }) {
  const pct = total ? (left / total) * 100 : 0
  return (
    <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-line">
      <div className={cn('h-full rounded-full', pct < 30 ? 'bg-amber-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* The signed-in rep. Every activity is stamped with THIS account — not with the
   company's sales owner — because whoever does the work is who the KPI counts. */
const ME = 'Nguyễn Thị Lan'

/* ── Global company search ───────────────────────────────────────────────────
   One search box in the shell, reachable from every page. The Companies list has
   its own search, but that one narrows a LIST the rep is already looking at; this
   one answers a different question — "does this customer exist at all, and where
   is it?" — from wherever they happen to be.

   Deliberately unscoped: it searches EVERY company, not the signed-in rep's book.
   A rep who cannot find a customer because it belongs to a colleague creates it
   again, and a duplicate MST costs far more than the privacy of a company name.
   What the rep gets is REACH: one record, opened by name / MST / Company ID.
   Browsing someone else's book is still not possible — there is no listing here,
   the result set is capped, and it dies with the query.

   Companies only. A quotation or a PO is always reached THROUGH its company, and
   a box that answers with four kinds of record needs the user to read every row
   before they can act on any of them. */
export function GlobalCompanySearch({ onOpen }: { onOpen: (specId: string, record: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  /* ⌘K / Ctrl-K from anywhere. The shortcut is printed in the box: a hotkey nobody
     can see is a hotkey nobody uses. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); input.current?.select() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // clicking anywhere else dismisses the results without clearing the query
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => { setCursor(0) }, [q])

  const ql = searchKey(q.trim())
  /* Identity fields plus the contact's NAME — not their job title, and not the
     city. "Trưởng phòng HC-NS" and "HCMC" are on almost every record, so matching
     them turns a search into a way to page through everyone's book, which is the
     one thing this box must not become. */
  const hay = (c: Company) => searchKey([coLabel(c), c.name, c.legalName, c.tax, companyId(coKey(c)), c.contact.split('·')[0], c.domain].join(' '))
  const all = ql.length >= 2 ? COMPANIES.filter((c) => hay(c).includes(ql)) : []
  const hits = all.slice(0, 7)

  /* Hands the shell the Company ID, not the row: the shell switches to Companies
     and that page resolves the id, so the breadcrumb names Companies and Back
     returns to the Companies list — not to whatever page the search was used on. */
  const go = (c: Company) => {
    setOpen(false)
    setQ('')
    input.current?.blur()
    onOpen('admin-company-list', companyId(coKey(c)))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setQ(''); setOpen(false); input.current?.blur(); return }
    if (!hits.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((i) => (i + 1) % hits.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((i) => (i - 1 + hits.length) % hits.length) }
    if (e.key === 'Enter') { e.preventDefault(); go(hits[cursor]) }
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <div className={cn('flex items-center gap-2 rounded-lg border bg-canvas px-2.5 py-1.5 transition-colors', open ? 'border-brand/50 bg-surface' : 'border-line hover:border-ink/25')}>
        <span className="shrink-0 text-[12px] text-faint"></span>
        <input
          ref={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search any company — name, tax code, company ID…"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
        />
        {q ? (
          <button onClick={() => { setQ(''); input.current?.focus() }} className="shrink-0 text-[12px] text-faint hover:text-ink" aria-label="Clear search">✕</button>
        ) : (
          <span className="hidden shrink-0 rounded border border-line px-1.5 py-px font-mono text-[10px] text-faint lg:inline">⌘K</span>
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          {ql.length < 2 ? (
            <p className="px-3 py-2.5 text-[11.5px] text-muted">Type at least <b className="text-ink">2 characters</b> — company name, tax code (MST) or Company ID.</p>
          ) : hits.length === 0 ? (
            <div className="px-3 py-2.5">
              <p className="text-[11.5px] text-muted">No company matches “<b className="text-ink">{q.trim()}</b>”.</p>
              {/* The point of searching before creating: this line is what stops the
                  rep from making a duplicate they could not find. */}
              <p className="mt-0.5 text-[10.5px] text-faint">Checked every company, including other reps’ — if it is not here, it does not exist yet.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-line-soft bg-canvas/60 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Companies</span>
                <span className="ml-auto text-[10.5px] text-faint">{hits.length}/{all.length} result{all.length === 1 ? '' : 's'}</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-1">
                {hits.map((c, i) => (
                  <button
                    key={c.name}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(c)}
                    className={cn('flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left', i === cursor ? 'bg-canvas' : 'hover:bg-canvas')}
                  >
                    <span className="mt-px text-[12px]"></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate text-[12.5px] font-medium text-ink">{coLabel(c)}</span>
                        <Pill tone={AC_STATUS[c.account].tone}>{c.account}</Pill>
                        {/* Pipeline is a second, independent axis — a rep opening a
                            record wants to know if a deal is live on it. */}
                        {inPipeline(c) && <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-faint">
                        <span className="font-mono">{companyId(coKey(c))}</span>
                        <span>·</span>
                        <span>MST {c.tax}</span>
                        <span>·</span>
                        <span>{c.owner}{c.owner === ME && <span className="text-brand"> (you)</span>}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-line-soft bg-canvas/60 px-3 py-1.5 text-[10px] text-faint">
                <span><b className="font-mono text-muted">↑↓</b> navigate</span>
                <span><b className="font-mono text-muted">↵</b> open</span>
                <span><b className="font-mono text-muted">esc</b> close</span>
                {all.length > hits.length && <span className="ml-auto">Refine to see the other {all.length - hits.length}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AdminCompanyList() {
  const [open, setOpen] = useState<Company | null>(null)
  /* The "+ New company" button lives on the page title row (shell PRIMARY_ACTION),
     so the shell signals the intent and this page enters create mode. */
  const createSignal = useContext(CreateSignalCtx)
  /* Creating a company REPLACES the list rather than floating over it — the form is
     long enough to need the whole viewport. Same pattern as job create. */
  const [creating, setCreating] = useState(false)
  useEffect(() => { if (createSignal) setCreating(true) }, [createSignal])
  const [view, setView] = useState<'me' | 'team'>('me')
  // Group filter — the whole tree under one root. Deliberately NOT an owner filter:
  // a group can span several reps, so filtering by group has to ignore the view
  // switcher, otherwise a rep can never see the parts of the group they don't own.
  const [group, setGroup] = useState<Company | null>(null)
  /* Filters mirror the columns a rep actually narrows by. Plain selects plus one
     toggle: six popovers would cost more attention than this list is worth. */
  const [fIndustry, setFIndustry] = useState('')
  const [fLocation, setFLocation] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fPipeline, setFPipeline] = useState('')
  const [fOwner, setFOwner] = useState('')
  const [sort, setSort] = useState<CoSort>('contact-old')
  const goTo = useContext(ScreenNavCtx)
  /* Arrived from the shell's global search (or any cross-page link): open that
     company. Matched on Company ID first, then on the raw name, so a caller can
     hand either. */
  const handed = useContext(OpenRecordCtx)
  const linked = handed ? COMPANIES.find((c) => companyId(coKey(c)) === handed || c.name === handed) ?? null : null
  const showing = open ?? linked
  if (showing) return <CompanyDetail c={showing} onBack={() => { setOpen(null); if (handed) goTo('admin-company-list') }} onOpen={setOpen} />

  /* A Sales rep only ever LISTS their own book — there is no "whole system" scope to
     browse everyone's customers. What they still get is a search that can REACH any
     single customer by name / MST / ID and open its record — the list's own
     `outOfScope` dropdown, and the shell-wide GlobalCompanySearch — so a rep who
     knows a company exists never has to re-create it. The Sales-lead view is the
     role that legitimately sees the whole team. */
  const mine = view === 'me'
  const base = group ? groupOf(group) : mine ? COMPANIES.filter((c) => c.owner === ME) : COMPANIES
  // once the list can show other reps' companies (team, or a cross-rep group), the owner column has to be there
  const showOwner = view === 'team' || Boolean(group)
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'vi'))
  const rows = base
    .filter((c) =>
      (!fIndustry || c.industry === fIndustry) &&
      (!fLocation || coCity(c) === fLocation) &&
      (!fStatus || c.account === fStatus) &&
      (!fPipeline || (fPipeline === 'Not in pipeline' ? !inPipeline(c) : inPipeline(c) && c.status === fPipeline)) &&
      (!fOwner || c.owner === fOwner),
    )
    .slice()
    .sort(CO_SORTS[sort].cmp)
  const activeFilters = [fIndustry, fLocation, fStatus, fPipeline, fOwner].filter(Boolean).length
  const clearAll = () => { setFIndustry(''); setFLocation(''); setFStatus(''); setFPipeline(''); setFOwner('') }
  if (creating) return <CompanyCreatePage onBack={() => setCreating(false)} />

  return (
    <div>
      {/* Group filter banner — only ever visible once a rep has clicked a group tag,
          so the default list stays exactly as it was. */}
      {group && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2 text-[12px] text-brand">
          <span className="font-semibold">Tập đoàn {coLabel(group)}</span>
          <span className="text-brand/70">— {rows.length} công ty, mọi cấp, không phân biệt sales phụ trách. Mỗi công ty vẫn có MST, hợp đồng và quota riêng.</span>
          <button onClick={() => setGroup(null)} className="ml-auto rounded-md border border-brand/40 px-2 py-0.5 text-[11px] font-medium hover:bg-surface">Bỏ lọc ✕</button>
        </div>
      )}


      {/* The view switcher decides WHICH list this is, so it reads first — before the
          controls that narrow it — and shares the header row with them. */}
      <ListPage
        minW={showOwner ? 1640 : 1500}
        leading={
          <span className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
            <button onClick={() => setView('me')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'me' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales view</button>
            <button onClick={() => setView('team')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'team' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales lead view</button>
          </span>
        }
        sort={
          <label className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
            <span className="text-faint">Sắp xếp</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CoSort)}
              className="max-w-[170px] cursor-pointer bg-transparent text-[11.5px] font-medium text-ink outline-none"
            >
              {(Object.keys(CO_SORTS) as CoSort[]).map((k) => <option key={k} value={k}>{CO_SORTS[k].label}</option>)}
            </select>
          </label>
        }
        /* rows are already narrowed by the filter row, so Total means the book of
           business, not what survived the filters */
        total={base.length}
        searchHint={mine ? `Tìm trong ${base.length} công ty của tôi · gõ tên / MST để mở nhanh một KH bất kỳ…` : 'Tìm trong danh sách — tên, MST, company ID…'}
        // the box promises these, so they have to be searchable even though the
        // table prints none of them
        searchExtra={rows.map((c) => [companyId(coKey(c)), c.tax, c.legalName, c.contact, coCity(c), c.domain].join(' '))}
        /* A rep cannot browse the whole system, but must still be able to REACH a
           specific customer they know by name — otherwise "not in my list" reads as
           "does not exist" and they re-create a company that already has an owner.
           So nothing is LISTED here: matches outside the book surface as direct links
           straight into that customer's record, and only when the query is specific. */
        /* A rep cannot BROWSE the whole system, but must be able to REACH one
           customer they know exists — otherwise "not in my list" reads as "does not
           exist" and they re-create a company that already has an owner.

           So this is a dropdown on the query, not a second list on the page. It is
           neutral, not a warning: finding a colleague's customer is a success. It
           needs a real query, it is capped, and it dies with the query — three
           things that keep "reach" from quietly becoming "browse". */
        outOfScope={(q) => {
          if (!mine) return null
          const ql = searchKey(q)
          const inBook = rows.filter((c) => searchKey([coLabel(c), c.legalName, c.tax, companyId(coKey(c)), c.contact, c.domain].join(' ')).includes(ql)).length
          if (ql.length < 2) {
            return (
              <div className="absolute left-0 top-full z-20 mt-1 w-[340px] rounded-lg border border-line bg-surface p-2.5 text-[11px] text-muted shadow-lg">
                Gõ ít nhất <b className="text-ink">2 ký tự</b> để tìm ngoài sổ của bạn — tên, MST hoặc Company ID.
              </div>
            )
          }
          const hay = (c: Company) => searchKey([coLabel(c), c.legalName, c.tax, companyId(coKey(c)), c.contact, c.domain].join(' '))
          const all = COMPANIES.filter((c) => c.owner !== ME && hay(c).includes(ql))
          const hits = all.slice(0, 5)
          return (
            <div className="absolute left-0 top-full z-20 mt-1 w-[420px] overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
              <div className="flex items-center gap-2 border-b border-line-soft bg-canvas/60 px-2.5 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Ngoài sổ của bạn</span>
                <span className="ml-auto text-[10.5px] text-faint">{all.length ? `${hits.length}/${all.length}` : '0'} kết quả</span>
              </div>
              {hits.length > 0 ? (
                <div className="max-h-[260px] overflow-y-auto p-1">
                  {hits.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setOpen(c)}
                      className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-canvas"
                    >
                      <span className="mt-px text-[12px]"></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="min-w-0 truncate text-[12px] font-medium text-ink">{coLabel(c)}</span>
                          <Pill tone={AC_STATUS[c.account].tone}>{c.account}</Pill>
                        </span>
                        {/* Company ID + MST + owner: enough to be certain this is the
                            right record before opening it, and to know whose it is. */}
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-faint">
                          <span className="font-mono">{companyId(coKey(c))}</span>
                          <span>· MST {c.tax}</span>
                          <span>· {c.owner}</span>
                        </span>
                      </span>
                      <span className="mt-0.5 shrink-0 text-[10.5px] font-medium text-brand">Xem hồ sơ →</span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Nothing anywhere is the moment a duplicate gets created, so the
                   create action lives right here rather than back up on the toolbar. */
                <div className="p-2.5">
                  <p className="text-[11px] text-muted">Không có công ty nào khớp “{q}” — kể cả ngoài sổ của bạn.</p>
                  {inBook === 0 && (
                    <button onClick={() => setCreating(true)} className="mt-1.5 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">+ Tạo công ty mới</button>
                  )}
                </div>
              )}
              {all.length > hits.length && (
                <p className="border-t border-line-soft bg-canvas/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-faint">
                  Chỉ hiện {hits.length} kết quả đầu — gõ chính xác hơn (MST hoặc Company ID) thay vì duyệt danh sách.
                </p>
              )}
            </div>
          )
        }}
        filters={
          <FilterBar count={activeFilters} onClear={clearAll}>
            <FilterRow label="Industry" value={fIndustry} onChange={setFIndustry} options={uniq(base.map((c) => c.industry))} />
            <FilterRow label="Location" value={fLocation} onChange={setFLocation} options={uniq(base.map(coCity))} />
            <FilterRow label="Status" value={fStatus} onChange={setFStatus} options={Object.keys(AC_STATUS)} />
            <FilterRow label="Pipeline" value={fPipeline} onChange={setFPipeline} options={[...CO_ORDER, 'Not in pipeline']} />
            {showOwner && <FilterRow label="Owner" value={fOwner} onChange={setFOwner} options={uniq(base.map((c) => c.owner))} />}
          </FilterBar>
        }
        cols={[
          { label: 'Company', w: '1.4fr' },
          // The permanent public identifier — what support quotes back and what an
          // export joins on. Sits next to the name so a row can be identified.
          { label: 'Company ID', w: '0.85fr' },
          { label: 'Industry', w: '0.9fr' },
          { label: 'Location', w: '0.9fr' },
          { label: 'Status', w: '0.8fr' },
          // The third axis, next to customer status because that is what a rep
          // compares it against: status says whether they buy, tier says how much.
          { label: `Tier ${TIER_YEAR}`, w: '1fr' },
          { label: 'Pipeline', w: '0.9fr' },
          // Owner is only meaningful when looking across the team — in Sales view
          // every row is yours, so the column would repeat the same name. A group
          // view always shows it: the whole point is that a group can span reps.
          ...(showOwner ? [{ label: 'Owner', w: '0.9fr' } as Col] : []),
          { label: 'Last contact', w: '0.85fr' },
          { label: 'Latest note', w: '1.5fr' },
          { label: 'Total revenue', w: '1fr', align: 'r' as const },
          { label: 'Latest revenue', w: '1fr', align: 'r' as const },
        ]}
        rows={rows.map((c) => [
          <div className="min-w-0">
            <button onClick={() => setOpen(c)} className="block min-w-0 max-w-full truncate text-left font-medium text-brand hover:underline">{coLabel(c)}</button>
            {/* The group tag is the whole affordance: it says "this record is part of a
                bigger customer" and doubles as the filter into that group. */}
            {inGroup(c) && (
              <button
                onClick={() => setGroup(groupRootOf(c))}
                className="mt-0.5 block max-w-full truncate text-left text-[10px] text-faint hover:text-brand hover:underline"
              >
                {coLabel(groupRootOf(c))} · {coRoles(c).join(' · ')}
              </button>
            )}
          </div>,
          <span className="truncate font-mono text-[11px] text-muted">{companyId(coKey(c))}</span>,
          <span className="truncate">{c.industry}</span>,
          <span className="truncate">{c.address}</span>,
          <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>,
          // Badge + the number it was earned on. The accumulated figure has to sit
          // next to the badge: without it the tier looks like something a rep set.
          <div className="min-w-0">
            <TierPill tier={tierOf(c)} />
          </div>,
          inPipeline(c) ? (
            <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>
          ) : c.quoteLapsed ? (
            /* Off the board, but for a reason worth acting on — and NOT Lost. Saying
               only "—" here would hide a live prospect whose offer simply ran out. */
            <span title="Báo giá đã hết hạn cuối tháng — công ty rời pipeline. Tạo báo giá mới (hoặc bản v2) để đưa lại vào Proposal." className="min-w-0 truncate text-[10.5px] font-medium text-amber-600">
              Báo giá hết hạn
            </span>
          ) : <span className="text-faint">—</span>,
          ...(showOwner ? [<span className="truncate">{c.owner}</span>] : []),
          // Plain date — no rot dot, no colour. Urgency lives on the Pipeline board
          // and in the sort, not as a third colour channel on every row.
          <Idle days={c.idle} kind={cadenceOf(c)} compact />,
          <span className="truncate text-muted">{c.note}</span>,
          <span className="tabular-nums">{revFmt(c.revenue)}</span>,
          <span className="tabular-nums">{revFmt(coLastRevenue(c))}</span>,
        ])}
      />
    </div>
  )
}

/* ── Pipeline — the same companies as a status board (opens the same record) ── */
function AdminCompanyPipeline() {
  const [open, setOpen] = useState<Company | null>(null)
  const [view, setView] = useState<'me' | 'team'>('me')
  if (open) return <CompanyDetail c={open} onBack={() => setOpen(null)} onOpen={setOpen} />
  const rows = view === 'me' ? COMPANIES.filter((c) => c.owner === ME) : COMPANIES
  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
        <button onClick={() => setView('me')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'me' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales view</button>
        <button onClick={() => setView('team')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'team' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales lead view</button>
      </div>
      <CompaniesBoard onOpen={setOpen} rows={rows} showOwner={view === 'team'} />
    </div>
  )
}

function CompanyPagePreview({ c }: { c: Company }) {
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="h-12 bg-gradient-to-r from-brand to-violet-500" />
      <div className="-mt-5 px-3 pb-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg border-2 border-surface bg-surface text-[13px] font-bold text-brand shadow">{initials}</div>
        <p className="mt-1.5 text-[12.5px] font-bold">{c.name}</p>
        <p className="text-[10.5px] text-faint">{c.industry} · {c.size} staff</p>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between rounded-md border border-line px-2 py-1 text-[10.5px]"><span>Open role #1</span><span className="text-faint">HCMC</span></div>
          <div className="flex justify-between rounded-md border border-line px-2 py-1 text-[10.5px]"><span>Open role #2</span><span className="text-faint">HCMC</span></div>
        </div>
      </div>
    </div>
  )
}

/** One row per PURCHASE ORDER — what was bought, for how much, and when the VAT
    invoice went out. A PO with no invoice date is money not yet collected. */
function poHistory(c: Company): { po: string; products: string; amount: string; invoiced: string | null }[] {
  if (!isCustomer(c) && c.account !== 'Churn') return []
  const k = coKey(c)
  const rows: { po: string; products: string; amount: string; invoiced: string | null }[] = []
  if (c.jobPosting && c.resumeSearch) {
    rows.push({ po: `PO-${String(5500 + (k % 400)).padStart(6, '0')}-07-2026`, products: 'Job Posting — Pro · Resume Search — 6 tháng', amount: '37,800,000 ₫', invoiced: c.since })
  } else if (c.jobPosting) {
    rows.push({ po: `PO-${String(5500 + (k % 400)).padStart(6, '0')}-07-2026`, products: 'Job Posting — Pro (10 slots)', amount: '15,000,000 ₫', invoiced: c.since })
  } else if (c.resumeSearch) {
    rows.push({ po: `PO-${String(5500 + (k % 400)).padStart(6, '0')}-07-2026`, products: 'Resume Search — 6 tháng (100 CV)', amount: '20,000,000 ₫', invoiced: c.since })
  }
  // The PO a rep is chasing: sent, agreed, not yet invoiced — so no date.
  if (c.status === 'PO') {
    rows.unshift({ po: `PO-${String(5900 + (k % 90)).padStart(6, '0')}-08-2026`, products: 'Job Posting — Pro (gia hạn)', amount: '15,000,000 ₫', invoiced: null })
  }
  if (c.account === 'Churn') {
    rows.push({ po: `PO-${String(5100 + (k % 300)).padStart(6, '0')}-12-2024`, products: 'Job Posting — Pro · Resume Search', amount: '35,000,000 ₫', invoiced: '20/12/2024' })
  }
  return rows
}

/** Purchases that have run out or lapsed. Kept on the record for renewal calls —
    "what did they buy last year, and for how much" is the first thing asked. */
function pastPurchases(c: Company): { name: string; detail: string; amount: string; date: string }[] {
  if (c.account === 'Churn') return [
    { name: 'Job Posting — Pro', detail: '10 slots · hết hạn 31/12/2025', amount: '15,000,000 ₫', date: '12/2024' },
    { name: 'Resume Search — 6 tháng', detail: '100 CV unlocks · đã dùng hết', amount: '20,000,000 ₫', date: '06/2024' },
  ]
  if (isCustomer(c)) return [
    { name: 'Job Posting — Basic', detail: '5 slots · hết hạn ' + (c.since || '—'), amount: '6,100,000 ₫', date: 'kỳ trước' },
  ]
  return []
}

/* No status pill. Everything on this list was PAID — an unpaid product never
   provisions, so "Paid" was true of every row and told the reader nothing. Whether
   it has ENDED is said by which list it is in (Đang dùng / Đã kết thúc) and by the
   row being muted, not by a badge repeating it. */
function PurchaseRow({ name, detail, amount, date, expired }: { name: string; detail: string; amount: string; date: string; expired?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5', expired ? 'border-line-soft bg-canvas/40' : 'border-line')}>
      <div className="min-w-0">
        <p className={cn('truncate text-[11.5px] font-medium', expired ? 'text-muted' : 'text-ink')}>{name}</p>
        <p className="text-[10.5px] text-faint">{detail} · {date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('text-[11.5px] font-medium tabular-nums', expired && 'text-muted')}>{amount}</p>
      </div>
    </div>
  )
}

const MAX_SEATS = 4

/* ── per-company mock data (jobs · team · activity) ───────────────────────── */
type CoJob = { title: string; status: StatusTone; statusLabel: string; applicants: number; posted: string; deadline: string }
const COMPANY_JOBS: Record<string, CoJob[]> = {
  'Công ty TNHH Vạn Phát': [
    { title: 'Điều dưỡng viên (Khoa Nội)', status: 'open', statusLabel: 'Open', applicants: 14, posted: '02/07/2026', deadline: '31/08/2026' },
    { title: 'Bác sĩ Đa khoa', status: 'open', statusLabel: 'Open', applicants: 6, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Kế toán viện phí', status: 'open', statusLabel: 'Open', applicants: 0, posted: '20/07/2026', deadline: '15/09/2026' },
    { title: 'Lễ tân bệnh viện', status: 'closed', statusLabel: 'Closed', applicants: 31, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'FPT Software': [
    { title: 'Senior Frontend Engineer (ReactJS)', status: 'open', statusLabel: 'Open', applicants: 0, posted: '24/07/2026', deadline: '31/08/2026' },
    { title: 'Java Developer (Spring Boot)', status: 'open', statusLabel: 'Open', applicants: 52, posted: '10/07/2026', deadline: '10/09/2026' },
    { title: 'Business Analyst', status: 'open', statusLabel: 'Open', applicants: 28, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Comtor tiếng Nhật (BrSE)', status: 'open', statusLabel: 'Open', applicants: 11, posted: '01/07/2026', deadline: '31/08/2026' },
    { title: 'DevOps Engineer', status: 'open', statusLabel: 'Open', applicants: 19, posted: '20/06/2026', deadline: '20/08/2026' },
    { title: 'QA Automation Engineer', status: 'closed', statusLabel: 'Closed', applicants: 40, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Tiki': [
    { title: 'Digital Marketing Lead', status: 'open', statusLabel: 'Open', applicants: 42, posted: '15/07/2026', deadline: '15/09/2026' },
    { title: 'Product Manager', status: 'open', statusLabel: 'Open', applicants: 18, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Backend Engineer (Go)', status: 'open', statusLabel: 'Open', applicants: 33, posted: '02/07/2026', deadline: '02/09/2026' },
    { title: 'Data Analyst', status: 'open', statusLabel: 'Open', applicants: 25, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Nhân viên Kho vận', status: 'open', statusLabel: 'Open', applicants: 0, posted: '22/07/2026', deadline: '20/09/2026' },
    { title: 'Category Manager', status: 'closed', statusLabel: 'Closed', applicants: 47, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Công ty TNHH Đại Dương': [
    { title: 'Nhân viên Kinh doanh Thủy sản', status: 'open', statusLabel: 'Open', applicants: 9, posted: '20/06/2026', deadline: '31/08/2026' },
    { title: 'Kỹ sư Nuôi trồng Thủy sản', status: 'open', statusLabel: 'Open', applicants: 4, posted: '15/06/2026', deadline: '15/09/2026' },
    { title: 'Nhân viên QC (Chế biến)', status: 'closed', statusLabel: 'Closed', applicants: 22, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'VNG Corporation': [
    { title: 'Kế toán tổng hợp', status: 'schedule', statusLabel: 'Schedule', applicants: 0, posted: '—', deadline: '20/09/2026' },
    { title: 'Game Product Manager', status: 'open', statusLabel: 'Open', applicants: 36, posted: '12/07/2026', deadline: '12/09/2026' },
    { title: 'Backend Engineer (Golang)', status: 'open', statusLabel: 'Open', applicants: 44, posted: '08/07/2026', deadline: '08/09/2026' },
    { title: 'Data Engineer', status: 'open', statusLabel: 'Open', applicants: 17, posted: '30/06/2026', deadline: '31/08/2026' },
    { title: 'UI/UX Designer', status: 'open', statusLabel: 'Open', applicants: 23, posted: '25/06/2026', deadline: '25/08/2026' },
    { title: 'Chuyên viên Tuyển dụng', status: 'closed', statusLabel: 'Closed', applicants: 58, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'MoMo': [
    { title: 'Product Manager', status: 'open', statusLabel: 'Open', applicants: 18, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Risk & Fraud Analyst', status: 'open', statusLabel: 'Open', applicants: 12, posted: '02/07/2026', deadline: '02/09/2026' },
    { title: 'Android Engineer (Kotlin)', status: 'open', statusLabel: 'Open', applicants: 29, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Nhân viên CSKH (Hotline)', status: 'open', statusLabel: 'Open', applicants: 61, posted: '20/06/2026', deadline: '20/08/2026' },
    { title: 'Kế toán thanh toán', status: 'draft', statusLabel: 'Draft', applicants: 0, posted: '—', deadline: '—' },
  ],
  'Thế Giới Di Động': [
    { title: 'Nhân viên Kinh doanh (Chuỗi cửa hàng)', status: 'open', statusLabel: 'Open', applicants: 128, posted: '22/07/2026', deadline: '30/09/2026' },
    { title: 'Quản lý Cửa hàng — HCMC', status: 'open', statusLabel: 'Open', applicants: 47, posted: '18/07/2026', deadline: '18/09/2026' },
    { title: 'Kỹ thuật viên Bảo hành', status: 'open', statusLabel: 'Open', applicants: 63, posted: '15/07/2026', deadline: '15/09/2026' },
    { title: 'Nhân viên Kho vận', status: 'open', statusLabel: 'Open', applicants: 84, posted: '10/07/2026', deadline: '10/09/2026' },
    { title: 'Chuyên viên Đào tạo Nội bộ', status: 'schedule', statusLabel: 'Schedule', applicants: 0, posted: '—', deadline: '01/10/2026' },
    { title: 'Thu ngân (Part-time)', status: 'closed', statusLabel: 'Closed', applicants: 96, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Công ty CP Thành Đạt': [
    { title: 'Kỹ sư Xây dựng (Giám sát công trình)', status: 'open', statusLabel: 'Open', applicants: 7, posted: '14/07/2026', deadline: '14/09/2026' },
    { title: 'Kỹ sư Dự toán', status: 'open', statusLabel: 'Open', applicants: 3, posted: '12/07/2026', deadline: '12/09/2026' },
    { title: 'Nhân viên An toàn Lao động', status: 'draft', statusLabel: 'Draft', applicants: 0, posted: '—', deadline: '—' },
  ],
}
const companyJobs = (c: Company) => COMPANY_JOBS[c.name] ?? []

/* Applications received (employer view — like the Company site) */
type CoApplicant = { name: string; job: string; applied: string; tone: StatusTone; stage: string }
const APPLICANT_NAMES = ['Trần Văn Hùng', 'Nguyễn Thị Mai', 'Lê Hoàng Nam', 'Phạm Thu Trang', 'Đỗ Minh Quân', 'Vũ Thị Hồng', 'Bùi Đức Anh']
const APPLICANT_STAGES: { tone: StatusTone; stage: string }[] = [
  { tone: 'schedule', stage: 'Shortlisted' }, { tone: 'pending', stage: 'Reviewing' }, { tone: 'neutral', stage: 'New' },
  { tone: 'active', stage: 'Interview' }, { tone: 'rejected', stage: 'Rejected' }, { tone: 'neutral', stage: 'New' }, { tone: 'pending', stage: 'Reviewing' },
]
const APPLICANT_WHEN = ['2 days ago', '3 days ago', '5 days ago', '1 week ago', '1 week ago', '2 weeks ago', '2 weeks ago']
const companyApplicants = (c: Company): CoApplicant[] => {
  const js = companyJobs(c)
  if (!js.length) return []
  return APPLICANT_NAMES.map((n, i) => ({ name: n, job: js[i % js.length].title, applied: APPLICANT_WHEN[i], tone: APPLICANT_STAGES[i].tone, stage: APPLICANT_STAGES[i].stage }))
}

/* Resume unlocks / opens (employer view — like the Company site) */
type CoResumeView = { name: string; headline: string; when: string; by: string }
const companyResumeViews = (c: Company): CoResumeView[] => {
  if (!c.resumeSearch) return []
  const mgr = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  return [
    { name: 'Hoàng Thị Lan Anh', headline: 'Kế toán trưởng · 8 năm KN', when: '1 hour ago', by: mgr },
    { name: 'Nguyễn Đức Thắng', headline: 'Kỹ sư Cơ khí · 5 năm KN', when: '3 hours ago', by: mgr },
    { name: 'Trần Bảo Ngọc', headline: 'Nhân viên Marketing · 3 năm KN', when: 'Yesterday', by: 'Đỗ Thị Mai' },
    { name: 'Lý Quốc Khánh', headline: 'Chuyên viên Nhân sự · 6 năm KN', when: '2 days ago', by: mgr },
    { name: 'Phan Thị Hương', headline: 'Nhân viên Kinh doanh · 4 năm KN', when: '3 days ago', by: 'Đỗ Thị Mai' },
  ]
}

/* ── CONTACT PEOPLE vs LOGIN USERS ───────────────────────────────────────────
   Two different populations on the same company, deliberately INDEPENDENT:

     Contact  a person we do business with. Owned by Sales, lives in the CRM, and
              may have no login at all — a CFO who signs off, an accountant who
              receives invoices, a receptionist who takes the call.
     User     a login on the Company site. Consumes one of the 4 seats, owned by
              the customer's HR Manager, and may be someone Sales never met.

   They overlap often (the HR Manager is usually both) but neither implies the
   other, so one is NEVER auto-created from the other. A contact may optionally be
   LINKED to a user record; the link is informational, not a dependency. */
/* FIVE statuses, not nine. Each answers "what do I do about this person NOW?", and
   two statuses that lead to the SAME action are one status:
     on leave + asked-us-to-come-back   → Paused          (both: wait, with a date)
     left + retired + moved department   → No longer here  (all: find the successor)
     never verified + email now bouncing → Needs verifying (both: fix the details)
   The sub-reason ("nghỉ hưu" vs "chuyển phòng ban") goes in the note, where a human
   reads it — rather than multiplying statuses that behave identically. */
type ContactStatus = 'Active' | 'Needs verifying' | 'Paused' | 'No longer here' | 'Do not contact'
const CONTACT_STATUS: Record<ContactStatus, { tone: StatusTone; vi: string; hint: string; action: string }> = {
  Active: {
    tone: 'active', vi: 'Đang liên hệ',
    hint: 'Our working contact — reachable and expecting to hear from us.',
    action: 'Call or email as normal.',
  },
  'Needs verifying': {
    tone: 'pending', vi: 'Cần xác minh',
    hint: 'Details not confirmed — from a name card or web form, or the email has started bouncing.',
    action: 'Confirm email + phone before this contact goes on a quotation.',
  },
  Paused: {
    tone: 'schedule', vi: 'Tạm dừng liên hệ',
    hint: 'On leave, or they asked us to come back later. Still our contact, just not now.',
    action: 'Do not chase until the resume date; use the cover person if urgent.',
  },
  'No longer here': {
    tone: 'expired', vi: 'Không còn phụ trách',
    hint: 'Left the company, retired, or moved department — either way they no longer buy from us.',
    action: 'Find the successor. If you know where they went, that is a warm lead.',
  },
  'Do not contact': {
    tone: 'rejected', vi: 'Không liên hệ',
    hint: 'They asked not to be contacted. A compliance flag, not an opinion.',
    action: 'No outreach at all, manual or automated. Only a manager can clear it.',
  },
}
type CoContact = {
  name: string; title: string; email: string; phone: string
  status: ContactStatus; primary?: boolean; decisionMaker?: boolean
  /** receives every quotation / invoice — usually the accountant, rarely the buyer */
  billing?: boolean
  /** where a "No longer here" contact went, when we know — a warm lead at the new employer */
  movedTo?: string
  /** the date a "Paused" contact should be approached again */
  snoozedUntil?: string
  /** email of the login user this person is the same human as, when they have one */
  linkedUser?: string
  /** ONE free-text note per contact — the human context a status can never carry:
      how they prefer to be reached, who they defer to, what went wrong last time. */
  note: string
  /** when we last spoke to THIS person (the company's Idle is the newest of these) */
  lastContact: string
}

/* Demo contacts: always the primary from the CRM record, plus a realistic spread
   of the awkward states — someone who left, someone who moved desk, an unlinked
   finance contact who will never need a login. */
function companyContacts(c: Company): CoContact[] {
  const person = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const title = c.contact.split(' · ')[1] ?? 'HR'
  const local = (n: string) =>
    n.split(' ').pop()!.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '')
  const out: CoContact[] = [
    { name: person, title, email: `${local(person)}@${c.domain}`, phone: '09xx xxx xxx', status: 'Active', primary: true, decisionMaker: true, linkedUser: `${local(person)}@${c.domain}`, note: 'Prefers Zalo over email. Signs off up to 100M ₫ alone; above that needs the GD.', lastContact: '2 days ago' },
    // finance contact: receives every invoice, never needs to log in
    { name: 'Phạm Kế Toán', title: 'Kế toán trưởng / Chief accountant', email: `ketoan@${c.domain}`, phone: '09xx xxx xxx', status: 'Active', billing: true, note: 'Only wants the VAT invoice + MST — do not send sales material. Reachable 8–17h.', lastContact: '3 weeks ago' },
  ]
  if (isCustomer(c)) {
    out.push({ name: 'Đỗ Thị Mai', title: 'HR Specialist', email: `mai@${c.domain}`, phone: '09xx xxx xxx', status: 'Active', linkedUser: `mai@${c.domain}`, note: 'Day-to-day poster of jobs. Ask her for the hiring plan before quoting a renewal.', lastContact: '5 days ago' })
    // the classic churn cause: the person who bought from us left, and nobody told Sales
    out.push({ name: 'Trần Cũ', title: 'HR Manager (cũ)', email: `tran@${c.domain}`, phone: '—', status: 'No longer here', movedTo: 'Công ty CP Vạn Phát', note: 'Đã nghỉ việc 06/2026. Bought the first package from us — nobody told Sales, which is why the renewal slipped.', lastContact: '4 months ago' })
  }
  if (c.size === '5000+' || c.jobs > 15) {
    out.push({ name: 'Nguyễn Điều Chuyển', title: 'Trưởng phòng Tuyển dụng', email: `chuyen@${c.domain}`, phone: '09xx xxx xxx', status: 'No longer here', note: 'Đã chuyển sang phòng Đào tạo. Still friendly — happy to introduce the new TA lead.', lastContact: '6 weeks ago' })
    out.push({ name: 'Vũ Mới Nhập', title: 'Chuyên viên Tuyển dụng', email: `moi@${c.domain}`, phone: '09xx xxx xxx', status: 'Needs verifying', note: 'Captured from a name card at the 07/2026 job fair — email not confirmed yet.', lastContact: '—' })
  }
  if (c.account === 'Churn') {
    out.push({ name: 'Lê Không Phản Hồi', title: 'Giám đốc Nhân sự', email: `le@${c.domain}`, phone: '09xx xxx xxx', status: 'Needs verifying', note: 'Email bounced twice, phone rings out. Try the switchboard or LinkedIn.', lastContact: '5 months ago' })
    out.push({ name: 'Hoàng Hẹn Lại', title: 'Trưởng phòng HCNS', email: `hoang@${c.domain}`, phone: '09xx xxx xxx', status: 'Paused', snoozedUntil: '01/10/2026', note: 'Budget frozen until Q4. Asked us to come back after 01/10 — do not chase before that.', lastContact: '2 months ago' })
  }
  return out
}

/* ── Contact detail (slide-over) ─────────────────────────────────────────────
   A contact accumulates history a table row cannot hold — status changes, who
   replaced whom, notes over time — so the row links here rather than trying to
   show everything inline. Every ACTION on a contact lives in this panel, which is
   why the list has no Actions column. */
/** Editable SELECT row — for fields whose values come from Master data. */
function SelectRow({ label, value, onChange, options, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; hint?: string }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <label className="text-[10.5px] uppercase tracking-wide text-faint">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand"
      >
        <option value="">{placeholder ?? '— none —'}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}

/** Editable text row — the edit-mode counterpart of KV. */
function EField({ label, value, onChange, mono, hint }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean; hint?: string }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <label className="text-[10.5px] uppercase tracking-wide text-faint">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand', mono && 'font-mono text-[11.5px]')}
      />
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

function ContactDetail({ p, c, onClose }: { p: CoContact; c: Company; onClose: () => void }) {
  /* Edit is in-place rather than a second modal: the reader is already looking at
     the record, and a modal on top of a slide-over is one layer too many. Changes
     are held in a draft so Cancel is a true revert. */
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<CoContact>(p)
  const [justSaved, setJustSaved] = useState(false)
  const set = <K extends keyof CoContact>(k: K, v: CoContact[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const cancel = () => { setDraft(p); setEditing(false) }
  const save = () => { setEditing(false); setJustSaved(true) }
  const startEdit = () => { setJustSaved(false); setEditing(true) }

  const st = CONTACT_STATUS[draft.status]
  const blocked = draft.status === 'No longer here' || draft.status === 'Do not contact'
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-full max-w-[560px] flex-col bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Contact · {coLabel(c)}</p>
            <h3 className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[16px] font-bold tracking-tight">
              {draft.name}
              {draft.primary && <span className="rounded border border-brand/30 bg-brand-soft px-1 py-0.5 text-[9.5px] font-semibold text-brand">PRIMARY</span>}
              {draft.billing && <span className="rounded border border-line bg-canvas px-1 py-0.5 text-[9.5px] font-semibold text-muted">BILLING</span>}
              {editing && <span className="rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[9.5px] font-semibold text-amber-700">EDITING</span>}
            </h3>
            <p className="text-[11.5px] text-muted">{draft.title}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* status, with the "what do I do instead" line spelled out */}
          <div className={cn('rounded-lg border px-3 py-2.5', blocked ? 'border-rose-200 bg-rose-50' : 'border-line bg-canvas/40')}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={st.tone}>{draft.status}</Pill>
              <span className="text-[11.5px] text-muted">{st.vi}</span>
              {draft.snoozedUntil && <span className="text-[11.5px] text-amber-700">· đến {draft.snoozedUntil}</span>}
            </div>
            <p className={cn('mt-1.5 text-[11.5px] leading-relaxed', blocked ? 'text-rose-800' : 'text-muted')}>{st.hint}</p>
            {/* what to DO is a separate line from what it MEANS — the rep is here to act */}
            <p className={cn('mt-1 text-[11.5px] font-medium', blocked ? 'text-rose-900' : 'text-ink/80')}>→ {st.action}</p>
            {draft.movedTo && (
              <p className="mt-1.5 text-[11.5px] text-brand">Nay ở <b>{draft.movedTo}</b> — a warm lead at their new employer.</p>
            )}
            {editing && (
              <div className="mt-2.5 border-t border-line-soft pt-2.5">
                <p className="mb-1.5 text-[10.5px] uppercase tracking-wide text-faint">Change status</p>
                {/* Rows, not chips: five statuses each need their meaning beside them,
                    otherwise a rep guesses what "Paused" covers. */}
                <div className="space-y-1">
                  {(Object.keys(CONTACT_STATUS) as ContactStatus[]).map((k) => {
                    const m = CONTACT_STATUS[k]
                    const on = draft.status === k
                    return (
                      <button
                        key={k}
                        onClick={() => set('status', k)}
                        className={cn('flex w-full items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left', on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-ink/30')}
                      >
                        <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand' : 'border-line')}>
                          {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className={cn('text-[12px] font-medium', on ? 'text-brand' : 'text-ink')}>{k}</span>
                            <span className="text-[10.5px] text-faint">{m.vi}</span>
                          </span>
                          <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">{m.hint}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                {draft.status === 'Paused' && (
                  <div className="mt-2"><EField label="Resume contact on" value={draft.snoozedUntil ?? ''} onChange={(v) => set('snoozedUntil', v)} hint="Required for Paused — reminders stay off until this date." /></div>
                )}
                {draft.status === 'No longer here' && (
                  <div className="mt-2"><EField label="Now at (if known)" value={draft.movedTo ?? ''} onChange={(v) => set('movedTo', v)} hint="Optional — creates a warm lead at their new employer." /></div>
                )}
              </div>
            )}
          </div>

          <DetailCard title="Details" action={justSaved ? <span className="text-[11px] font-medium text-emerald-700">✓ Saved</span> : undefined}>
            {editing ? (
              <>
                <EField label="Full name" value={draft.name} onChange={(v) => set('name', v)} />
                <EField label="Job title" value={draft.title} onChange={(v) => set('title', v)} />
                <EField label="Email" value={draft.email} onChange={(v) => set('email', v)} mono hint="Verified before it is used on a quotation." />
                <EField label="Phone" value={draft.phone} onChange={(v) => set('phone', v)} />
                <div className="py-2">
                  <p className="mb-1 text-[10.5px] uppercase tracking-wide text-faint">Role on this account</p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      ['primary', 'Primary (receives quotations)'],
                      ['billing', 'Billing (receives invoices)'],
                      ['decisionMaker', 'Decision maker'],
                    ] as [keyof CoContact, string][]).map(([k, label]) => {
                      const on = Boolean(draft[k])
                      return (
                        <button key={String(k)} onClick={() => set(k, (!on) as never)} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px]', on ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>
                          <span className={cn('grid h-3.5 w-3.5 place-items-center rounded border text-[9px]', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on ? '✓' : ''}</span>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-[10.5px] text-faint">Only one contact per company can be Primary or Billing — setting it here moves it off whoever held it.</p>
                </div>
                <KV label="Login user" value={draft.linkedUser ? `${draft.linkedUser}` : 'No login — contact only'} />
                <KV label="Last contacted" value={draft.lastContact} />
              </>
            ) : (
              <>
                <KV label="Full name" value={draft.name} />
                <KV label="Job title" value={draft.title} />
                <KV label="Email" value={draft.email} link />
                <KV label="Phone" value={draft.phone} />
                <KV label="Decision maker" value={draft.decisionMaker ? 'Yes — signs off on the purchase' : 'No'} />
                <KV label="Receives quotations" value={draft.primary ? 'Yes — PRIMARY contact' : 'No'} />
                <KV label="Receives invoices" value={draft.billing ? 'Yes — BILLING contact' : 'No'} />
                <KV label="Login user" value={draft.linkedUser ? `${draft.linkedUser}` : 'No login — contact only'} />
                <KV label="Last contacted" value={draft.lastContact} />
              </>
            )}
          </DetailCard>

          <DetailCard title="Note" action={<span className="text-[11px] text-faint">one note per contact</span>}>
            {editing ? (
              <textarea value={draft.note} onChange={(e) => set('note', e.target.value)} rows={4} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink outline-none focus:border-brand" />
            ) : (
              <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink/85">{draft.note}</div>
            )}
            <p className="mt-1.5 text-[10.5px] text-faint">The human context a status cannot carry — preferred channel, who they defer to, what went wrong last time.</p>
          </DetailCard>

          </div>

        {/* every contact action lives here, not on the list row */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          {editing ? (
            <>
              <span className="mr-auto text-[11px] text-faint">Editing — Cancel discards every change.</span>
              <button onClick={cancel} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
              <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Save changes</button>
            </>
          ) : (
            <>
              {draft.status === 'Needs verifying' && <button onClick={startEdit} className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand">Verify details</button>}
              {draft.status === 'No longer here' && <button className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand">Find successor</button>}
              {!draft.linkedUser && !blocked && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Invite as user</button>}
              {!draft.primary && !blocked && <button onClick={() => { set('primary', true); setJustSaved(true) }} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Make primary</button>}
              <button onClick={startEdit} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Change status</button>
              <button onClick={startEdit} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* Add a contact by hand — the name-card path. Deliberately short: a contact is
   cheap to create and details get verified later, which is what Unverified is for. */
function AddContactModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const [status, setStatus] = useState<ContactStatus>('Needs verifying')
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Add contact</p>
            <p className="text-[11px] text-muted">To {coLabel(c)} · a contact needs no login</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Full name" req value="Họ và tên" />
            <ComboField label="Job title" value="" placeholder="Select or type a title…" options={['HR Manager', 'HR Director', 'Talent Acquisition', 'Recruiter', 'Kế toán trưởng / Chief accountant', 'CEO / Founder', 'Office Manager']} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Email" value="name@company.vn" hint="Verified before it is used on a quotation." />
            <LField label="Phone" value="09xx xxx xxx" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CONTACT_STATUS) as ContactStatus[]).map((k) => (
                <button key={k} onClick={() => setStatus(k)} title={CONTACT_STATUS[k].hint} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', status === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>
                  {k} <span className="text-[10px] opacity-70">{CONTACT_STATUS[k].vi}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{CONTACT_STATUS[status].hint} <b className="text-ink/70">→ {CONTACT_STATUS[status].action}</b></p>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Role on this account</label>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Primary contact (receives quotations)</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Billing contact (receives invoices)</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Decision maker</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note</label>
            <div className="h-16 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">Preferred channel, who they defer to, anything the next rep should know…</div>
          </div>
          <p className="rounded-md bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">
            Adding a contact does <b>not</b> create a login. Use <b>Invite as user</b> on the contact afterwards if they need to sign in — that is an explicit, separate step.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Add contact</button>
        </div>
      </div>
    </div>
  )
}

type CoUserRole = 'Admin' | 'Recruiter' | 'Viewer'
type CoTeamUser = { name: string; email: string; role: CoUserRole; status: 'Active' | 'Invited'; last: string }
function companyTeam(c: Company): CoTeamUser[] {
  const noProducts = !c.jobPosting && !c.resumeSearch
  const managerName = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const localPart = (n: string) =>
    n.split(' ').pop()!.toLowerCase()
      .replace(/đ/g, 'd').replace(/ơ/g, 'o').replace(/ư/g, 'u')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  const base: Omit<CoTeamUser, 'email'>[] = [{ name: managerName, role: 'Admin', status: 'Active', last: '10m ago' }]
  if (isCustomer(c) && !noProducts) {
    base.push({ name: 'Đỗ Thị Mai', role: 'Recruiter', status: 'Active', last: '2h ago' })
    if (c.size === '5000+' || c.jobs > 15) {
      base.push({ name: 'Ngô Minh Tú', role: 'Recruiter', status: 'Active', last: '1d ago' })
      base.push({ name: 'Lê Thanh Sơn', role: 'Viewer', status: 'Invited', last: '—' })
    }
  }
  return base.map((u) => ({ ...u, email: `${localPart(u.name)}@${c.domain}` }))
}

/* ── Company roles — built from a short permission set, then assigned ──────────
   The VietnamWorks "build a role, then set users" flow, trimmed to 7 permissions
   across the 3 modules. Prerequisites auto-include so a role can never be invalid.
   "Manage users & roles" is NOT tickable — it lives on the fixed Admin role. */
type CoPermKey = 'jobs.view' | 'jobs.post' | 'jobs.edit' | 'apps.view' | 'apps.move' | 'resume.search' | 'resume.unlock'
const CO_PERM_GROUPS: { module: string; perms: { key: CoPermKey; label: string; needs?: CoPermKey }[] }[] = [
  { module: 'Job posts', perms: [
    { key: 'jobs.view', label: 'View jobs' },
    { key: 'jobs.post', label: 'Post jobs', needs: 'jobs.view' },
    { key: 'jobs.edit', label: 'Edit jobs', needs: 'jobs.view' },
  ] },
  { module: 'Applications', perms: [
    { key: 'apps.view', label: 'View applications & CVs' },
    { key: 'apps.move', label: 'Manage applications', needs: 'apps.view' },
  ] },
  { module: 'Resume search', perms: [
    { key: 'resume.search', label: 'Search resumes' },
    { key: 'resume.unlock', label: 'View / unlock resume detail', needs: 'resume.search' },
  ] },
]
const CO_ALL_PERMS: CoPermKey[] = CO_PERM_GROUPS.flatMap((g) => g.perms.map((p) => p.key))
const CO_NEEDS: Partial<Record<CoPermKey, CoPermKey>> = Object.fromEntries(
  CO_PERM_GROUPS.flatMap((g) => g.perms.filter((p) => p.needs).map((p) => [p.key, p.needs])),
) as Partial<Record<CoPermKey, CoPermKey>>

/* Admin is the one fixed, highest role (all access + manage users) and cannot be
   edited. EVERY other role is a custom role the Admin builds and can edit. */
type CoRoleDef = { name: string; admin?: boolean; perms: CoPermKey[] }
const CO_ROLE_DEFS: CoRoleDef[] = [
  { name: 'Admin', admin: true, perms: CO_ALL_PERMS },
  { name: 'Recruiter', perms: [...CO_ALL_PERMS] },
  { name: 'Viewer', perms: ['jobs.view', 'apps.view'] },
]

function coTogglePerm(perms: CoPermKey[], key: CoPermKey): CoPermKey[] {
  if (!perms.includes(key)) {
    const next = new Set(perms)
    let k: CoPermKey | undefined = key
    while (k) { next.add(k); k = CO_NEEDS[k] }
    return CO_ALL_PERMS.filter((p) => next.has(p))
  }
  const drop = new Set<CoPermKey>([key])
  let changed = true
  while (changed) {
    changed = false
    for (const p of CO_ALL_PERMS) {
      const n = CO_NEEDS[p]
      if (n && drop.has(n) && !drop.has(p)) { drop.add(p); changed = true }
    }
  }
  return perms.filter((p) => !drop.has(p))
}

/* Interactive "build a role" panel — the Add/Edit role screen (VietnamWorks-style,
   trimmed). Roles list on the left, permission checklist on the right. */
function CoRoleBuilder() {
  const [roles, setRoles] = useState<CoRoleDef[]>(CO_ROLE_DEFS)
  const [sel, setSel] = useState(1)
  const role = roles[sel]
  const editable = !role.admin
  const setPerms = (perms: CoPermKey[]) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, perms } : r)))
  const addRole = () => { setRoles((rs) => [...rs, { name: `New role ${rs.length}`, perms: ['jobs.view'] }]); setSel(roles.length) }
  return (
    <div className="mt-3 grid gap-3 rounded-lg border border-line p-3 md:grid-cols-[180px_1fr]">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11.5px] font-semibold text-ink">Roles</p>
          <button onClick={addRole} className="text-[11px] font-medium text-brand">+ Add role</button>
        </div>
        <div className="space-y-1">
          {roles.map((r, i) => (
            <button key={r.name} onClick={() => setSel(i)} className={cn('flex w-full items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-left', i === sel ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
              <span className="truncate text-[11.5px] font-medium text-ink">{r.name}</span>
              {r.admin && <Pill tone="neutral">Super admin</Pill>}
            </button>
          ))}
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <input value={role.name} readOnly={!editable} onChange={(e) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, name: e.target.value } : r)))} className={cn('min-w-0 flex-1 rounded-md px-2 py-1.5 text-[12.5px] font-semibold text-ink', editable ? 'border border-line' : 'border border-transparent bg-transparent')} />
          {role.admin && <span className="shrink-0 text-[10.5px] text-faint">Super admin · full access, can’t be edited</span>}
        </div>
        {CO_PERM_GROUPS.map((g) => (
          <div key={g.module} className="mb-2 border-t border-line/60 pt-2 first:border-0 first:pt-0">
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-faint">{g.module}</p>
            {g.perms.map((p) => {
              const on = role.perms.includes(p.key)
              const locked = on && CO_ALL_PERMS.some((q) => CO_NEEDS[q] === p.key && role.perms.includes(q))
              const disabled = !editable || locked
              return (
                <label key={p.key} className={cn('flex items-center gap-2 rounded px-1.5 py-1', disabled ? '' : 'cursor-pointer hover:bg-canvas/70')}>
                  <input type="checkbox" checked={on} disabled={disabled} onChange={() => editable && setPerms(coTogglePerm(role.perms, p.key))} className="h-3.5 w-3.5 accent-brand" />
                  <span className="text-[11.5px] text-ink">{p.label}</span>
                </label>
              )
            })}
          </div>
        ))}
        <p className="mt-2 text-[10.5px] leading-relaxed text-faint">Ticking a higher action auto-includes (and locks) its prerequisite, so a role is never invalid. Admin is the one fixed role — every other role is custom and editable.</p>
      </div>
    </div>
  )
}

/* Compact read-only view of ONE role's permissions — used inside the invite modal. */
function CoRolePermsView({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const def = CO_ROLE_DEFS.find((r) => r.name === role)
  return (
    <div className="mt-2 rounded-lg border border-line">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-left">
        <span className="text-[11.5px] font-medium text-brand">View role’s permissions</span>
        <span className="text-[10px] text-faint">{open ? '▾' : '▸'}</span>
      </button>
      {open && def && (
        <div className="border-t border-line px-3 py-2.5">
          {CO_PERM_GROUPS.map((g) => (
            <div key={g.module} className="mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{g.module}</p>
              {g.perms.map((p) => (
                <p key={p.key} className={cn('text-[11.5px]', def.perms.includes(p.key) ? 'text-ink' : 'text-faint line-through')}>
                  {def.perms.includes(p.key) ? '' : '—'} {p.label}
                </p>
              ))}
            </div>
          ))}
          {def.admin && <p className="text-[11.5px] text-ink">Manage users &amp; roles</p>}
        </div>
      )}
    </div>
  )
}

/* ── Company activity feed ───────────────────────────────────────────────────
   ONE merged trail of everything that ever happened on this account, typed by WHO
   caused it so it can be filtered and so Idle stays honest:

     sales   a human on OUR side did it — chat, call, quotation/PO sent
     client  the CUSTOMER did it — posted a job, opened a CV, paid, invited a user
     system  automatic — invoice issued, products provisioned, quota warnings

   IDLE counts from the newest SALES row only. That is the rule that matters: a
   client opening a CV or the system issuing an invoice must never make a silent
   account look freshly contacted. Everything is visible; only sales resets the clock. */
type CoKind = 'sales' | 'client' | 'system'
/* `by` is the ACCOUNT that performed the activity — not the company's sales owner.
   A colleague who covers a call while the owner is busy is the one who did the work,
   so they are the one shown here and the one the KPI counts. `atts` are the files
   carried by the row (screenshots of a Zalo thread, a forwarded email, meeting
   photos); they are part of the record, not a separate document library. */
type CoAtt = { kind: 'image' | 'email' | 'file'; label: string }
type CoEvent = { icon: string; tone: string; title: string; time: string; sub: string; kind: CoKind; days: number; by: string; atts?: CoAtt[] }

const CHAT = 'bg-sky-100 text-sky-700'
const CALL = 'bg-emerald-100 text-emerald-700'
const MEET = 'bg-indigo-100 text-indigo-700'
const DOC = 'bg-violet-100 text-violet-700'
const CLIENT = 'bg-amber-100 text-amber-700'
const SYS = 'bg-slate-100 text-slate-600'

const KIND_META: Record<CoKind, { label: string; hint: string }> = {
  sales: { label: 'Sales', hint: 'what we did — resets Idle' },
  client: { label: 'Client', hint: 'what the customer did' },
  system: { label: 'System', hint: 'automatic events' },
}

function companyActivity(c: Company): CoEvent[] {
  const contact = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const rep = c.owner.split(' ').slice(-2).join(' ')
  // No contact has ever been logged — a real state, and the highest-priority
  // follow-up. An empty trail says that far better than inventing history.
  if (c.idle === null) return []
  const last = c.idle
  const ev: CoEvent[] = []
  /* Who did it: our own rows are performed by a named colleague — usually the owner,
     but not always, which is the whole point of showing it. Client rows are performed
     by the contact on their side; system rows by the system. */
  const cover = 'Đỗ Minh Quân'
  const add = (days: number, kind: CoKind, icon: string, tone: string, title: string, sub: string, by?: string, atts?: CoAtt[]) =>
    ev.push({ days, kind, icon, tone, title, sub, by: by ?? (kind === 'sales' ? rep : kind === 'client' ? contact : 'System'), time: `${fmtIdle(days)} ago`, atts })

  if (c.account === 'Churn') {
    add(last, 'sales', '', CALL, 'Call · win-back', `${rep} called ${contact} — ${c.note.toLowerCase()} Agreed to revisit.`, cover)
    add(last + 20, 'system', '', SYS, 'Subscription expired', 'All quota lapsed — the account is read-only until it is renewed.')
    add(last + 34, 'sales', '', CHAT, 'Chat · Email', `${rep} sent a renewal reminder to ${contact} — no reply.`)
    add(last + 61, 'sales', '', DOC, 'Renewal quotation sent', `Sent to ${contact}; the quotation lapsed unanswered.`)
    add(last + 92, 'client', '', CLIENT, 'Last CV unlocked', `${contact} opened a candidate — the final use before they went quiet.`)
    add(last + 150, 'system', '', SYS, 'Payment confirmed', 'Accounting matched the bank transfer for the previous term.')
    return ev.sort((x, y) => x.days - y.days)
  }

  // ── sales side: chats, calls and the documents we sent ────────────────────
  add(last, 'sales', '', CHAT, 'Chat · Zalo', `${rep} messaged ${contact} — next step: ${c.nextStep.toLowerCase()}.`, undefined,
    [{ kind: 'image', label: 'zalo-01.png' }, { kind: 'image', label: 'zalo-02.png' }, { kind: 'image', label: 'bao-gia.jpg' }])
  add(last + 6, 'sales', '', MEET, 'Meeting · at their office', `Package options walked through with ${contact} and the finance lead. 60 phút · 14:00 20/07/2026.`, cover,
    [{ kind: 'email', label: 'RE- Báo giá tháng 7.eml' }, { kind: 'image', label: 'bien-ban-hop.jpg' }])
  if (c.status === 'PO' || c.status === 'Invoice') {
    add(last + 9, 'sales', '', DOC, 'Purchase order issued', `${contact} confirmed the accepted option; PO issued by ${rep} — active until the end of the month.`)
  }
  if (c.status !== 'Qualified') {
    add(last + 21, 'sales', '', DOC, 'Quotation sent', `${rep} sent the priced options to ${contact}.`)
  }
  add(last + 38, 'sales', '', CALL, 'Call · discovery', `${rep} called ${contact} — logged via Calio, need and budget qualified.`)
  add(last + 52, 'sales', '', CHAT, 'Chat · Email', `First outreach to ${contact}.`)

  // ── the money + provisioning chain, once they are a customer ──────────────
  if (isCustomer(c)) {
    add(last + 4, 'client', '', CLIENT, 'Payment made', `${contact} transferred ${vnd(coValue(c))} for the order.`)
    add(last + 3, 'system', '', SYS, 'Payment confirmed', 'Accounting matched the transfer against the bank — invoicing unlocked.')
    add(last + 2, 'system', '', SYS, 'VAT e-invoice issued', 'Provider stamped the invoice; the 12-month activation window started.')
    add(last + 2, 'system', '', SYS, 'Products provisioned',
      [c.jobPosting && 'Job Posting', c.resumeSearch && 'Resume Search'].filter(Boolean).join(' + ') + ' — released from the paid invoice.')
    add(last + 1, 'system', '', SYS, 'Account activated', `Login created for ${contact} (Admin) · owner ${c.owner}.`)
  }

  // ── what the client themselves did on their site ──────────────────────────
  if (c.jobPosting) {
    add(Math.max(0, last - 2), 'client', '', CLIENT, 'Job published', `${contact} posted a role — ${c.jobTotal - c.jobLeft}/${c.jobTotal} posting slots used.`)
    add(Math.max(0, last - 1), 'client', '', CLIENT, 'Applications received', 'Candidates applied to the open roles — visible on the Applications tab.')
    if (c.hasPage) add(last + 30, 'system', '', SYS, 'Company page published', 'The public profile went live on the jobseeker site.')
    if (c.jobTotal && c.jobLeft / c.jobTotal < 0.3) {
      add(Math.max(0, last - 3), 'system', '', SYS, 'Posting quota low', `${c.jobLeft} of ${c.jobTotal} slots left — offer a top-up.`)
    }
  }
  if (c.resumeSearch) {
    add(Math.max(0, last - 1), 'client', '', CLIENT, 'CV unlocked (PII)', `${contact} opened a candidate — ${c.cvTotal - c.cvLeft}/${c.cvTotal} unlocks used · audited.`)
    add(Math.max(0, last - 4), 'client', '', CLIENT, 'Resume search run', 'Searched the CV pool — no unlock spent on a search itself.')
  }
  if (isCustomer(c)) {
    add(Math.max(0, last - 5), 'client', '', CLIENT, 'User invited', `${contact} invited a user (Recruiter) to the account.`)
    add(Math.max(0, last - 6), 'client', '', CLIENT, 'Signed in', `${contact} signed in to the company site.`)
  }

  return ev.sort((x, y) => x.days - y.days)
}

/* Sales activity log — compose a chat (channel + note) or a call (via Calio) */
const CHAT_CHANNELS = ['Zalo', 'Facebook Messenger', 'Email', 'SMS', 'Zalo OA', 'Phone', 'Other']
/** Attachment tray shared by every activity type — images and forwarded emails. */
/* What may be attached depends on the activity: a chat is screenshots (you cannot
   attach an email to a Zalo thread), a meeting can carry both a photo of the room
   and the follow-up email. A CALL gets no attach row at all — Calio syncs the
   recording and outcome automatically, so a manual control there is noise. */
function AttachRow({ atts, onAdd, onDrop, allow = ['image', 'email'] }: { atts: CoAtt[]; onAdd: (a: CoAtt) => void; onDrop: (i: number) => void; allow?: CoAtt['kind'][] }) {
  const n = atts.filter((a) => a.kind === 'image').length
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Đính kèm</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {atts.map((a, i) => (
          <span key={i} className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]', a.kind === 'email' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-line bg-canvas text-muted')}>
            <span>{a.kind === 'email' ? '' : ''}</span>
            <span className="max-w-[150px] truncate">{a.label}</span>
            <button onClick={() => onDrop(i)} className="ml-0.5 text-faint hover:text-ink">✕</button>
          </span>
        ))}
        {allow.includes('image') && <button onClick={() => onAdd({ kind: 'image', label: `anh-${n + 1}.png` })} className="rounded-md border border-dashed border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">+ Ảnh</button>}
        {allow.includes('email') && <button onClick={() => onAdd({ kind: 'email', label: 'RE- trao đổi.eml' })} className="rounded-md border border-dashed border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">+ Email</button>}
      </div>
    </div>
  )
}

function CompanyActivities({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [kind, setKind] = useState<null | 'chat' | 'call' | 'meeting'>(null)
  const [channel, setChannel] = useState('Zalo')
  const [note, setNote] = useState('')
  const [atts, setAtts] = useState<CoAtt[]>([])
  const [when, setWhen] = useState('20/07/2026')
  const [time, setTime] = useState('14:00')
  const [mins, setMins] = useState('60')
  const [place, setPlace] = useState('Tại văn phòng khách hàng')
  const [logged, setLogged] = useState<CoEvent[]>([])
  /* SINGLE-select, not a set of toggles. The old chips were multi-select, so tapping
     "Sales" while everything was on REMOVED sales — the opposite of what a tap looks
     like it should do. One active view at a time is what a tab bar promises.
     Defaults to Sales: contact with the client is what this panel is read for, and
     it is the only kind that resets Idle. */
  const [feed, setFeed] = useState<'sales' | 'client' | 'system' | 'all'>('sales')
  const all = [...logged, ...companyActivity(c)]
  const rows = feed === 'all' ? all : all.filter((e) => e.kind === feed)
  const countOf = (k: CoKind) => all.filter((e) => e.kind === k).length

  const save = () => {
    const base = { time: 'just now', kind: 'sales' as CoKind, days: 0, by: ME, atts: atts.length ? atts : undefined }
    const entry: CoEvent =
      kind === 'chat'
        ? { ...base, icon: '', tone: CHAT, title: `Chat · ${channel}`, sub: note.trim() || 'No note added.' }
        : kind === 'meeting'
          ? { ...base, icon: '', tone: MEET, title: `Meeting · ${place.toLowerCase()}`, sub: `${note.trim() || 'No note added.'} ${mins} phút · ${time} ${when}.` }
          : { ...base, icon: '', tone: CALL, title: 'Call · logged via Calio', sub: note.trim() || 'Call synced from Calio — outcome & recording attached.' }
    setLogged((p) => [entry, ...p])
    setKind(null); setNote(''); setChannel('Zalo'); setAtts([])
  }
  const addAtt = (a: CoAtt) => setAtts((p) => [...p, a])
  const dropAtt = (i: number) => setAtts((p) => p.filter((_, j) => j !== i))

  return (
    // min-w-0 so the trail's table scrolls inside this column instead of forcing
    // the whole Overview grid wider than the page.
    <div className="min-w-0 space-y-4">
      {/* composer — withdrawn on a colleague's record. Logging an activity is the
          one write that would corrupt someone else's numbers: it stamps THEIR
          company with MY contact and resets THEIR idle clock. The trail below
          stays fully readable. */}
      {ro ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line bg-canvas/50 px-3.5 py-2.5">
          <span className="text-[13px]"></span>
          <span className="text-[11.5px] leading-relaxed text-muted">
            Không ghi nhận hoạt động trên công ty của sales khác — việc này sẽ reset <b className="text-ink/70">Idle</b> của họ và ghi tên bạn vào sổ của họ.
          </span>
        </div>
      ) : (
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line-soft px-3.5 py-2.5">
          <p className="text-[12.5px] font-bold">Log an activity</p>
        </div>
        <div className="p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setKind('chat')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'chat' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Chat</button>
            <button onClick={() => setKind('call')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'call' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Call</button>
            <button onClick={() => setKind('meeting')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'meeting' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Meeting</button>
            {/* Stamped with the signed-in account, not the company's sales owner —
                whoever actually does the work is who gets the KPI for it. */}
            {kind && <span className="ml-auto text-[11px] text-faint">Ghi nhận cho <b className="font-medium text-ink/70">{ME}</b></span>}
          </div>

          {kind === 'chat' && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Channel <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {CHAT_CHANNELS.map((ch) => (
                    <button key={ch} onClick={() => setChannel(ch)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', channel === ch ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{ch}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note <span className="text-rose-500">*</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={`What did you discuss on ${channel}?`} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              {/* Screenshots only — an email is its own thread, not an attachment to a chat. */}
              <AttachRow atts={atts} onAdd={addAtt} onDrop={dropAtt} allow={['image']} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log chat</button>
              </div>
            </div>
          )}

          {kind === 'meeting' && (
            <div className="mt-3 space-y-2.5">
              {/* A meeting is the only activity with a scheduled MOMENT of its own —
                  a chat or a call is logged when it happened, a meeting is logged
                  against the slot it was held in (or will be held in). */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Ngày <span className="text-rose-500">*</span></label>
                  {/* Backdating is allowed, but only inside the current month: a rep
                      writing up yesterday's meeting is normal, one editing last
                      month's numbers after the period closed is not. */}
                  <input value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand" />
                  <p className="mt-1 text-[10px] leading-relaxed text-faint">Từ 01/08/2026 đến hôm nay</p>
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Giờ <span className="text-rose-500">*</span></label>
                  <input value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Thời lượng</label>
                  <select value={mins} onChange={(e) => setMins(e.target.value)} className="w-full cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand">
                    {['15', '30', '45', '60', '90', '120'].map((m) => <option key={m} value={m}>{m} phút</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Hình thức</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Tại văn phòng khách hàng', 'Tại văn phòng Saramin', 'Online — Google Meet', 'Online — Zoom', 'Khác'].map((pl) => (
                    <button key={pl} onClick={() => setPlace(pl)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', place === pl ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{pl}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Nội dung <span className="text-rose-500">*</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Nội dung trao đổi, thống nhất, việc cần làm tiếp…" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              <AttachRow atts={atts} onAdd={addAtt} onDrop={dropAtt} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log meeting</button>
              </div>
            </div>
          )}

          {kind === 'call' && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Call summary / next step… (auto-filled from Calio when available)" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              {/* No attach row: Calio syncs the recording and outcome onto the call
                  automatically, so a manual attach control here is dead weight. */}
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log call</button>
              </div>
            </div>
          )}

        </div>
      </div>
      )}

      {/* history — table so the whole trail is scannable at a glance */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-ink">Activity <span className="font-normal text-muted">— everything that happened on this account</span></p>

        </div>
        {/* One active view at a time. Sales sits first and is the default because it
            is the reason the panel exists; Client and System are context. */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-line">
            {([
              { k: 'sales' as const, label: 'Sales', n: countOf('sales') },
              { k: 'client' as const, label: 'Client', n: countOf('client') },
              { k: 'system' as const, label: 'System', n: countOf('system') },
              { k: 'all' as const, label: 'Tất cả', n: all.length },
            ]).map((t, i) => {
              const on = feed === t.k
              return (
                <button
                  key={t.k}
                  onClick={() => setFeed(t.k)}
                  title={t.k === 'all' ? 'Toàn bộ dòng thời gian' : KIND_META[t.k].hint}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] transition-colors',
                    i > 0 && 'border-l border-line',
                    on ? 'bg-brand font-medium text-white' : 'text-muted hover:bg-canvas',
                  )}
                >
                  {t.label}
                  <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', on ? 'bg-white/25 text-white' : 'bg-canvas text-faint')}>{t.n}</span>
                </button>
              )
            })}
          </div>
          {feed === 'sales' && <span className="text-[10.5px] text-faint">Chat · call · meeting · tài liệu đã gửi — chỉ nhóm này reset Idle.</span>}
        </div>
        {/* "Never contacted" is an ALARM about the relationship, so it may only fire
            when there is genuinely no sales activity — not merely because the reader
            is standing on an empty Client or System tab. */}
        {rows.length === 0 && countOf('sales') === 0 ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-3.5 py-4 text-center">
            <p className="text-[12.5px] font-medium text-rose-700">Never contacted</p>
            <p className="mt-0.5 text-[11.5px] text-rose-700/80">No sales activity has ever been logged for this company — the highest-priority follow-up, not the lowest.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-canvas/40 px-3.5 py-4 text-center">
            <p className="text-[12px] text-muted">Chưa có hoạt động nào thuộc nhóm <b className="text-ink/70">{feed === 'client' ? 'Client' : 'System'}</b> cho công ty này.</p>
          </div>
        ) : (
          <Table
            cols={[{ label: 'When', w: '0.8fr' }, { label: 'Activity', w: '1.3fr' }, { label: 'Who', w: '1fr' }, { label: 'Details', w: '2.4fr' }]}
            rows={rows.map((e) => [
              <span className="text-[11.5px] text-muted">{e.time}</span>,
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]', e.tone)}>{e.icon}</span>
                <span className="truncate font-medium text-ink">{e.title}</span>
              </span>,
              /* The NAMED account, with the side it acted for underneath. The KPI
                 counts this name — a colleague covering for the owner gets the credit. */
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[11.5px] font-medium text-ink/80">{e.by}</span>
                <span className="text-[10px] text-faint">{KIND_META[e.kind].label}</span>
              </span>,
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-muted">{e.sub}</span>
                {e.atts && e.atts.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1">
                    {e.atts.map((a, i) => (
                      <span key={i} className={cn('inline-flex max-w-[160px] items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]', a.kind === 'email' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-line bg-canvas text-muted')}>
                        <span>{a.kind === 'email' ? '' : ''}</span>
                        <span className="truncate">{a.label}</span>
                      </span>
                    ))}
                  </span>
                )}
              </span>,
            ])}
          />
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
          One trail for the whole account: <b>Sales</b> (what we did), <b>Client</b> (what the customer did — posted a job, opened a CV, paid) and <b>System</b> (invoice issued, products provisioned, quota warnings).
          <b> Idle counts from the newest Sales row only</b>, so a client opening a CV can never make a silent account look freshly contacted. PII actions (CV unlocks) are always audited.
          <b className="text-ink/70"> Who</b> is the account that actually performed the activity, not the company’s sales owner — that is the account the KPI counts, so a colleague covering for a busy owner gets the credit.
        </p>
      </div>
    </div>
  )
}

function MiniStat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: 'warn' }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('mt-0.5 text-[15px] font-bold tabular-nums', tone === 'warn' ? 'text-amber-600' : 'text-ink')}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10.5px] text-faint">{sub}</p>}
    </div>
  )
}

type CoTab = 'Overview' | 'Contacts' | 'Users' | 'Products & billing' | 'Company page' | 'Jobs' | 'Applications' | 'Resumes' | 'Activity'
function CoTabBar({ tabs, active, onSelect }: { tabs: { key: CoTab; label: string; count?: number }[]; active: CoTab; onSelect: (t: CoTab) => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-0.5 border-b border-line-soft">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={cn(
            'relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors',
            active === t.key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {t.label}
          {t.count != null && <span className={cn('rounded-full px-1.5 text-[10px]', active === t.key ? 'bg-brand text-white' : 'bg-canvas text-faint')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* Products & quota block — shared by the Overview snapshot and the billing tab */
function ProductsQuota({ c, compact }: { c: Company; compact?: boolean }) {
  const noProducts = !c.jobPosting && !c.resumeSearch
  /* A company's history matters as much as its current entitlement — "what did they
     buy last year?" is the first question on a renewal call. Past purchases are a
     second list behind a toggle rather than a third card: same rows, same shape,
     just no longer counting toward quota. */
  const [showPast, setShowPast] = useState(false)
  const past = pastPurchases(c)
  return (
    <>
      {!compact && (
        <>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">{showPast ? 'Đã kết thúc' : 'Đang dùng'}</p>
            <span className="inline-flex overflow-hidden rounded-md border border-line text-[10px] font-medium">
              <button onClick={() => setShowPast(false)} className={cn('px-1.5 py-0.5', !showPast ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}>Đang dùng</button>
              <button onClick={() => setShowPast(true)} className={cn('border-l border-line px-1.5 py-0.5', showPast ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}>Đã kết thúc {past.length > 0 && `(${past.length})`}</button>
            </span>
          </div>
          {/* These lines land here the moment Kế toán issues the VAT invoice on the
              PO — immediately, with no further step. Until then the company has no
              quota and cannot post a job or open a CV. */}
          {showPast ? (
            past.length === 0
              ? <p className="text-[12px] text-muted">Chưa có sản phẩm nào kết thúc.</p>
              : <div className="space-y-1.5">{past.map((x, i) => <PurchaseRow key={i} {...x} expired />)}</div>
          ) : noProducts ? (
            <p className="text-[12px] text-muted">No purchases on record yet — products appear here as soon as a VAT invoice is issued on a PO.</p>
          ) : (
            <div className="space-y-1.5">
              {c.jobPosting && <PurchaseRow name="Job Posting — Pro" detail="10 slots · 3 months" amount="15,000,000 ₫" date={c.since} />}
              {c.resumeSearch && <PurchaseRow name="Resume Search — 6 months" detail="100 CV unlocks" amount="20,000,000 ₫" date={c.since} />}
            </div>
          )}
        </>
      )}
      {!noProducts && (
        <>
          <p className={cn('mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint', !compact && 'mt-3.5')}>Quota in use</p>
          <div className="space-y-3">
            {c.jobPosting && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]"><b>Job posting</b><span className="tabular-nums font-semibold">{c.jobLeft}<span className="font-normal text-faint">/{c.jobTotal} slots</span></span></div>
                <QuotaBar left={c.jobLeft} total={c.jobTotal} />
              </div>
            )}
            {c.resumeSearch && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]"><b>Resume search</b><span className="tabular-nums font-semibold">{c.cvLeft}<span className="font-normal text-faint">/{c.cvTotal} unlocks</span></span></div>
                <QuotaBar left={c.cvLeft} total={c.cvTotal} />
              </div>
            )}
            <p className="text-[11px] text-faint">Valid until 31/12/2026.</p>
          </div>
        </>
      )}
      {noProducts && c.account === 'Churn' && <p className="mt-2 text-[11px] text-amber-700">Subscription expired — no active quota. Renew to reactivate.</p>}
    </>
  )
}

/* ── Manual-service usage ─────────────────────────────────────────────────────
   A Manual service has no automatic meter. Nothing on the platform can observe a
   fanpage post going up or an email blast going out, so "how many of the 4 posts
   has this customer used?" is only answerable if the person who did the work says
   so. This is that record.

   ONE LOG ENTRY = ONE UNIT CONSUMED. Remaining is derived (total − entries), never
   stored and never edited by hand — a typed remaining count is the thing that goes
   out of step with what was actually delivered.

   Proof is required, not decorative: the link is what a customer asks for when they
   query the invoice ("show me the post"), and without it the entry is one person's
   word that a unit was spent. */
type ServiceDelivery = { id: string; date: string; link: string; image: string | null; content: string; by: string }
type ServiceEntitlement = { sku: string; name: string; unit: string; total: number; validUntil: string; entries: ServiceDelivery[] }

const SERVICE_USAGE: Record<string, ServiceEntitlement[]> = {
  'Công ty TNHH Vạn Phát': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 4, validUntil: '30/11/2026', entries: [
      { id: 'SD-001', date: '02/08/2026', link: 'https://facebook.com/topdev.vn/posts/1029384', image: 'vanphat-fb-01.jpg', content: 'Tuyển 5 Backend Engineer — Vạn Phát. Đăng kèm ảnh văn phòng, CTA về trang công ty.', by: 'Nguyễn Thị Lan' },
      { id: 'SD-002', date: '09/08/2026', link: 'https://facebook.com/topdev.vn/posts/1031002', image: 'vanphat-fb-02.jpg', content: 'Nhắc lại tin tuyển dụng, nhấn phúc lợi 13th-month salary.', by: 'Phạm Quang Huy' },
    ] },
    { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', unit: 'lượt gửi', total: 1, validUntil: '30/11/2026', entries: [] },
    { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', unit: 'lượt gửi', total: 2, validUntil: '30/11/2026', entries: [
      { id: 'SD-003', date: '05/08/2026', link: 'https://mail.topdev.vn/campaign/9921', image: null, content: 'Big Banner trong Job Alert tuần 32 — 650k ứng viên.', by: 'Nguyễn Thị Lan' },
    ] },
  ],
  'FPT Software': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 2, validUntil: '15/09/2026', entries: [
      { id: 'SD-010', date: '20/06/2026', link: 'https://facebook.com/topdev.vn/posts/998211', image: null, content: 'Employer branding — FPT Software culture post.', by: 'Phạm Quang Huy' },
      { id: 'SD-011', date: '05/07/2026', link: 'https://facebook.com/topdev.vn/posts/1004556', image: 'fpt-fb-02.jpg', content: 'Tuyển Java/Go, kèm banner sự kiện tech talk.', by: 'Phạm Quang Huy' },
    ] },
    { sku: 'SVC-HACKERRANK', name: 'Đánh giá ứng viên HackerRank', unit: 'bài test', total: 5, validUntil: '15/09/2026', entries: [
      { id: 'SD-012', date: '01/07/2026', link: 'https://hackerrank.com/x/tests/44120', image: null, content: 'Bộ test Java backend, 5 ứng viên vòng 2.', by: 'Trần Quốc Trung' },
    ] },
  ],
  // The case that matters: paid, partly used, then the validity ran out. Two sends
  // were never delivered and can no longer be — that has to be visible, not silent.
  'Tiki': [
    { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', unit: 'lượt gửi', total: 3, validUntil: '30/06/2026', entries: [
      { id: 'SD-020', date: '10/05/2026', link: 'https://mail.topdev.vn/campaign/8812', image: null, content: 'Chiến dịch tuyển Data Engineer.', by: 'Phạm Quang Huy' },
    ] },
  ],
  'VNG Corporation': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 3, validUntil: '20/12/2026', entries: [] },
    { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', unit: 'mốc', total: 2, validUntil: '20/12/2026', entries: [
      { id: 'SD-030', date: '01/07/2026', link: 'https://crm.saramin.vn/notes/5521', image: null, content: 'Mốc ngày 11 — review chất lượng CV, khách hài lòng.', by: 'Nguyễn Thị Lan' },
      { id: 'SD-031', date: '21/07/2026', link: 'https://crm.saramin.vn/notes/5588', image: null, content: 'Mốc ngày 31 — đề xuất nâng lên Top Job.', by: 'Nguyễn Thị Lan' },
    ] },
  ],
  'MoMo': [
    { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', unit: 'lượt gửi', total: 1, validUntil: '18/10/2026', entries: [] },
  ],
  'Thế Giới Di Động': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 6, validUntil: '10/11/2026', entries: [
      { id: 'SD-040', date: '15/06/2026', link: 'https://facebook.com/topdev.vn/posts/995001', image: 'tgdd-fb-01.jpg', content: 'Tuyển hàng loạt nhân viên cửa hàng mới.', by: 'Trần Quốc Trung' },
      { id: 'SD-041', date: '01/07/2026', link: 'https://facebook.com/topdev.vn/posts/1002110', image: 'tgdd-fb-02.jpg', content: 'Đợt 2 — mở rộng khu vực miền Trung.', by: 'Trần Quốc Trung' },
      { id: 'SD-042', date: '20/07/2026', link: 'https://facebook.com/topdev.vn/posts/1010455', image: null, content: 'Đợt 3 — nhấn lộ trình thăng tiến.', by: 'Trần Quốc Trung' },
    ] },
  ],
  // Churned: validity lapsed with everything unused. The clearest "we owe nothing
  // any more, but the customer got nothing either" row.
  'Công ty TNHH Việt Tiến': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 2, validUntil: '10/01/2026', entries: [] },
  ],

  /* More companies, deliberately spread across all four derived states and all five
     SKUs — the page is read by scanning for what is owed, so the demo has to show a
     fresh row, a used-up row, an EXPIRED-with-units-left row (the one that must never
     be quiet) and a cleanly closed row side by side. */
  'Công ty CP Hoàng Gia': [
    // Nothing delivered and validity already gone: the customer paid for two posts
    // and received none. The loudest row on the page.
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 2, validUntil: '30/06/2026', entries: [] },
    { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', unit: 'lượt', total: 3, validUntil: '20/12/2026', entries: [
      { id: 'SD-030', date: '12/08/2026', link: '', image: null, content: 'Gọi review 2 tuần đầu — CV chưa đạt kỳ vọng, đề xuất đổi tiêu đề tin.', by: 'Trần Quốc Trung' },
    ] },
  ],
  'Shopee Việt Nam': [
    { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', unit: 'lượt gửi', total: 3, validUntil: '31/10/2026', entries: [
      { id: 'SD-031', date: '28/07/2026', link: 'https://mail.topdev.vn/campaign/10032', image: 'shopee-email-01.jpg', content: 'Blast 120k dev — tuyển Backend & Data. Open rate 24%.', by: 'Phạm Quang Huy' },
    ] },
    { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', unit: 'lượt gửi', total: 2, validUntil: '31/10/2026', entries: [] },
  ],
  'Công ty TNHH Minh Long': [
    // Everything delivered, validity passed — a clean close, nothing owed.
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 1, validUntil: '10/01/2026', entries: [
      { id: 'SD-032', date: '05/01/2026', link: 'https://facebook.com/topdev.vn/posts/981004', image: 'minhlong-fb.jpg', content: 'Tuyển thợ gốm & QC — đăng kèm ảnh xưởng.', by: 'Nguyễn Thị Lan' },
    ] },
  ],
  'Công ty CP Trường Sơn': [
    { sku: 'SVC-HACKERRANK', name: 'Đánh giá ứng viên HackerRank', unit: 'bài test', total: 10, validUntil: '30/11/2026', entries: [
      { id: 'SD-033', date: '01/08/2026', link: 'https://hackerrank.com/x/tests/88120', image: null, content: 'Bộ test Java cho 4 ứng viên vòng 1.', by: 'Nguyễn Thị Lan' },
      { id: 'SD-034', date: '08/08/2026', link: 'https://hackerrank.com/x/tests/88455', image: null, content: 'Bộ test SQL cho 3 ứng viên Data.', by: 'Nguyễn Thị Lan' },
    ] },
    { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', unit: 'lượt', total: 2, validUntil: '30/11/2026', entries: [] },
  ],
  'Base.vn': [
    // Small customer, one service, fully used inside validity.
    { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', unit: 'lượt gửi', total: 1, validUntil: '30/11/2026', entries: [
      { id: 'SD-035', date: '11/08/2026', link: 'https://mail.topdev.vn/campaign/10101', image: null, content: 'Blast 40k dev SaaS — tuyển Product Engineer.', by: 'Trần Quốc Trung' },
    ] },
  ],
  'Công ty CP An Khang': [
    { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', unit: 'lượt gửi', total: 4, validUntil: '18/10/2026', entries: [
      { id: 'SD-036', date: '04/08/2026', link: 'https://mail.topdev.vn/campaign/10044', image: 'ankhang-banner.jpg', content: 'Job Alert tuần 32 — ngành Y tế / Dược.', by: 'Nguyễn Thị Lan' },
    ] },
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 3, validUntil: '18/10/2026', entries: [] },
  ],
}

function ServiceUsageCard({ c }: { c: Company }) {
  const svc = SERVICE_USAGE[c.name] ?? []
  const [logging, setLogging] = useState<ServiceEntitlement | null>(null)
  const [open, setOpen] = useState<string | null>(svc[0]?.sku ?? null)

  if (svc.length === 0) {
    return (
      <DetailCard title="Manual service — đã sử dụng">
        <p className="text-[12px] text-muted">Công ty này chưa mua dịch vụ thủ công nào (bài đăng fanpage, email marketing…).</p>
      </DetailCard>
    )
  }

  return (
    <DetailCard title="Manual service — đã sử dụng" action={<span className="text-[11px] text-faint">1 ghi nhận = 1 lượt</span>}>
      <div className="space-y-2.5">
        {svc.map((e) => {
          const used = e.entries.length
          const left = e.total - used
          const exhausted = left <= 0
          const expanded = open === e.sku
          return (
            <div key={e.sku} className="rounded-lg border border-line">
              <button onClick={() => setOpen(expanded ? null : e.sku)} className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left">
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium text-ink">{e.name}</span>
                  <span className="block text-[10.5px] text-faint">{used} / {e.total} {e.unit} đã dùng</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={cn('text-[12px] font-semibold tabular-nums', exhausted ? 'text-rose-600' : 'text-ink')}>
                    {left}<span className="font-normal text-faint"> còn lại</span>
                  </span>
                  <span className="text-faint">{expanded ? '▾' : '▸'}</span>
                </span>
              </button>
              <div className="px-3 pb-2"><QuotaBar left={left} total={e.total} /></div>

              {expanded && (
                <div className="border-t border-line-soft px-3 py-2.5">
                  {e.entries.length === 0 ? (
                    <p className="text-[11.5px] text-muted">Chưa ghi nhận lượt nào.</p>
                  ) : (
                    <ol className="space-y-2">
                      {e.entries.map((d, i) => (
                        <li key={d.id} className="flex gap-2">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-canvas text-[9px] font-semibold text-muted">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <span className="text-[11.5px] font-medium tabular-nums text-ink">{d.date}</span>
                              <a href={d.link} onClick={(ev) => ev.preventDefault()} className="min-w-0 truncate text-[11px] text-brand hover:underline">{d.link}</a>
                            </div>
                            <p className="text-[11px] leading-relaxed text-muted">{d.content}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-faint">
                              {d.image
                                ? <span className="rounded border border-line bg-canvas px-1 font-mono">🖼 {d.image}</span>
                                : <span className="text-amber-700">⚠️ chưa có ảnh</span>}
                              <span>· {d.by}</span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                  <button
                    onClick={() => setLogging(e)}
                    disabled={exhausted}
                    className="mt-2.5 rounded-md border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-faint"
                  >
                    {exhausted ? 'Đã dùng hết — không thể ghi nhận thêm' : '+ Ghi nhận đã đăng'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-2.5 text-[10.5px] leading-relaxed text-faint">
        Hệ thống không tự đếm được dịch vụ thủ công — số còn lại tính từ <b className="text-ink/70">số lượt đã ghi nhận</b>,
        không nhập tay. Muốn sửa một lượt thì sửa chính ghi nhận đó.
      </p>
      {logging && <LogServiceDeliveryModal e={logging} company={coLabel(c)} onClose={() => setLogging(null)} />}
    </DetailCard>
  )
}

function LogServiceDeliveryModal({ e, company, onClose }: { e: ServiceEntitlement; company: string; onClose: () => void }) {
  const [date, setDate] = useState('')
  const [link, setLink] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<string | null>(null)
  /* Link + content are required, image is not: an email blast has no screenshot
     worth keeping, but every delivery has somewhere it landed and something it
     said. Without those two the entry cannot answer "show me what we posted". */
  const valid = Boolean(date) && Boolean(link.trim()) && Boolean(content.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Ghi nhận đã đăng</p>
            <p className="text-[11px] text-muted">{e.name} · {company}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel req>Ngày đăng</FLabel>
              <input
                type="date"
                value={date}
                onChange={(ev) => setDate(ev.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
              />
            </div>
            <LField label="Người thực hiện" value="Nguyễn Thị Lan" hint="Lấy từ người đang đăng nhập." />
          </div>

          <div>
            <FLabel req>Link bài đăng</FLabel>
            <input
              value={link}
              onChange={(ev) => setLink(ev.target.value)}
              placeholder="https://facebook.com/topdev.vn/posts/…"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Bắt buộc — đây là thứ khách hỏi khi đối chiếu hoá đơn: “cho tôi xem bài đã đăng”.</p>
          </div>

          <div>
            <FLabel req>Nội dung đã đăng</FLabel>
            <textarea
              value={content}
              onChange={(ev) => setContent(ev.target.value)}
              rows={3}
              placeholder="Tóm tắt nội dung, thông điệp chính, CTA…"
              className="w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
          </div>

          <div>
            <FLabel>Ảnh chụp / ảnh đã dùng<span className="ml-1 font-normal text-faint">không bắt buộc</span></FLabel>
            <div className="rounded-lg border border-dashed border-line px-3 py-3 text-center">
              {image ? (
                <span className="flex items-center justify-center gap-2 text-[12px]">
                  <span className="truncate font-mono text-ink/80">{image}</span>
                  <button onClick={() => setImage(null)} className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-muted hover:border-rose-300 hover:text-rose-600">Gỡ</button>
                </span>
              ) : (
                <button onClick={() => setImage('proof-screenshot.jpg')} className="text-[12px] font-medium text-brand hover:underline">⬆ Tải ảnh lên</button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            Lưu — trừ 1 {e.unit}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── The public company page, section by section ──────────────────────────────
   The editor is laid out as the LIVE PAGE is laid out (Figma "Company detail",
   node 78:20315) — same sections, same order, same names. HQ fills this in for a
   customer who will not do it themselves, which is most of them at the start, so
   the mapping between "what I typed" and "what appears" has to be obvious.

   Two rules run through the whole thing and explain most of the UI:

    · REQUIRED vs OPTIONAL is the spine. Five things gate publishing (logo,
      display name, industry, ≥1 office, VI introduction). EVERY other section is
      optional and its card simply does not render on the live page while empty —
      which is why each one says so rather than sitting there looking broken.
    · The registry facts are NOT typed here. MST, legal name, company type,
      representative and registered address already live on the company record;
      re-typing them on the page would give one company two tax codes that drift.
      They are shown read-only with a pointer to where they are edited. */

/** Chip row under the facts card. A fixed list, because the whole point of the
    chips is that they read the same on every company and can be filtered on. */
const CP_TRAITS = [
  'Thành viên tập đoàn', 'Gần ga metro', 'Hỗ trợ thai sản', 'Làm việc từ xa',
  'Trang phục tự do', 'Chế độ nghỉ chăm con', 'Có căn-tin', 'Văn phòng hạng A',
]

/** One collapsible section = one card on the live page. `state` is what the
    section contributes to the page, said in the reviewer's language. */
function PageSec({
  n, title, sub, state, tone, open, onToggle, children,
}: {
  n: number; title: string; sub: string
  state: string; tone: StatusTone
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border', open ? 'border-brand/50' : 'border-line')}>
      <button onClick={onToggle} className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left', open ? 'bg-brand-soft/40' : 'bg-canvas/40 hover:bg-canvas/70')}>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-surface text-[10px] font-bold tabular-nums text-muted">{n}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold text-ink">{title}</span>
          <span className="block truncate text-[10.5px] text-faint">{sub}</span>
        </span>
        <Pill tone={tone}>{state}</Pill>
        <span className="shrink-0 text-[11px] text-faint">{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="space-y-2.5 border-t border-line px-3 py-3">{children}</div>}
    </div>
  )
}

/** A slot that holds an uploaded asset — photo, video, logo. */
function AssetSlot({ label, filled, wide }: { label: string; filled?: boolean; wide?: boolean }) {
  return (
    <div className={cn(
      'grid place-items-center rounded-md border border-dashed px-2 py-3 text-center',
      filled ? 'border-brand/40 bg-brand-soft/30' : 'border-line bg-canvas/40',
      wide && 'row-span-2',
    )}>
      <span className={cn('text-[10.5px] leading-tight', filled ? 'font-medium text-brand' : 'text-faint')}>
        {filled ? label : `+ ${label}`}
      </span>
    </div>
  )
}

/* jobseeker company page — editor + draft preview, shared by Overview + its tab */
function CompanyPageEditor({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [open, setOpen] = useState<number | null>(1)
  const [traits, setTraits] = useState<string[]>(c.hasPage ? ['Thành viên tập đoàn', 'Làm việc từ xa', 'Trang phục tự do'] : [])
  /* Which of the 12 shared types this company has declared. BenefitsField owns the
     editing from here; this is only the seed and the section's status line. */
  const bens = c.hasPage ? ['health', 'pay', 'training', 'leave', 'transport'] : []
  const [lang, setLang] = useState<'VI' | 'EN' | 'KO'>('VI')
  const has = c.hasPage
  const toggle = (n: number) => setOpen((o) => (o === n ? null : n))

  if (!c.jobPosting) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-6 text-center">
        <p className="text-[12.5px] font-medium">No public page needed</p>
        <p className="mx-auto mt-1 max-w-[42ch] text-[11.5px] text-muted">Resume-Search-only customer — invisible to jobseekers and not listed in the public Companies directory. Add Job Posting to enable a page.</p>
      </div>
    )
  }

  /* The five publish blockers, in the order they appear on the page. Everything
     else is optional by design and never appears here. */
  const gates = [
    { label: 'Logo', ok: has },
    { label: 'Tên hiển thị', ok: true },
    { label: 'Ngành nghề', ok: true },
    { label: 'Ít nhất 1 văn phòng', ok: true },
    { label: 'Giới thiệu (VI)', ok: has },
  ]
  const missing = gates.filter((g) => !g.ok)
  /* The optional sections, each counted only if it would actually RENDER on the
     live page. Story blocks and leaders are empty in every demo record, so a page
     can never read 100% just for clearing the publish gate — that number is what
     an account manager quotes to a customer, and it has to be earned. */
  const optional = [
    traits.length > 0,        // 3 chips
    has,                      // 5 video
    has,                      // 6 photos
    false,                    // 7 story — no blocks yet
    bens.length > 0,          // 8 benefits
    false,                    // 9 leaders — nobody added
    has,                      // 11 meta
  ]
  const done = gates.length - missing.length + optional.filter(Boolean).length
  const pct = Math.round((done / (gates.length + optional.length)) * 100)

  return (
    <div className="space-y-3">
      {/* publish gate + completeness, before any field */}
      <div className="rounded-lg border border-line bg-canvas/40 p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[12px] font-semibold text-ink">
            {missing.length === 0 ? 'Đủ điều kiện đăng' : `Còn thiếu ${missing.length} mục bắt buộc`}
            <span className="ml-1.5 font-normal text-faint">· trang hoàn thiện {pct}%</span>
          </p>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[11.5px] font-medium text-brand hover:underline">↗ Xem thử bản nháp</a>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {gates.map((g) => (
            <span key={g.label} className={cn('rounded-md border px-2 py-0.5 text-[10.5px]', g.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 font-medium text-amber-800')}>
              {g.ok ? '✓' : '!'} {g.label}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
          Chỉ 5 mục trên chặn việc đăng trang. <b className="text-ink/70">Mọi mục còn lại là tuỳ chọn</b> — để trống thì thẻ đó không hiển thị trên trang, chứ không hiện ô rỗng.
        </p>
      </div>

      {/* ── 1. Identity — the sticky sidebar on the live page ───────────────── */}
      <PageSec n={1} title="Nhận diện" sub="Sidebar · logo, tên, ngành, nút theo dõi" state={has ? 'Đã có' : 'Thiếu logo'} tone={has ? 'active' : 'pending'} open={open === 1} onToggle={() => toggle(1)}>
        <div className="space-y-2.5">
          <LField label="Tên hiển thị" req value={c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '')} hint="Tên thương hiệu ứng viên biết — thường KHÁC tên pháp lý trên hoá đơn." />
          <LField label="Dòng mô tả ngắn" value={`${c.industry} · Dịch vụ tài chính`} hint="Hiện ngay dưới tên, tối đa 1 dòng." />
        </div>
        {/* One asset, two frames, plus the peer row that settles the size — see LogoSizer. */}
        <div>
          <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Logo <span className="text-rose-500">*</span></p>
          <LogoSizer company={c.name} initialZoom={has ? 100 : 100} />
        </div>
        <LField label="Ảnh bìa (cover)" value={has ? 'cover.jpg · 1440×148' : 'Chưa tải lên'} hint="Tuỳ chọn — không có thì trang dùng dải màu mặc định." />
        {/* the four fields above are exactly what the sidebar renders, so show it */}
        <div className="grid gap-2 sm:grid-cols-[1fr_200px] sm:items-start">
          <p className="text-[10.5px] leading-relaxed text-faint">
            Bốn trường trên dựng nên cột trái cố định của trang — ứng viên nhìn thấy nó ở mọi lần cuộn, nên đây là phần đáng sửa kỹ nhất.
          </p>
          <CompanyPagePreview c={c} />
        </div>
      </PageSec>

      {/* ── 2. Registry facts — read-only on purpose ────────────────────────── */}
      <PageSec n={2} title="Thông tin doanh nghiệp" sub="Thẻ facts · lấy từ hồ sơ công ty, không nhập lại" state="Tự động" tone="neutral" open={open === 2} onToggle={() => toggle(2)}>
        <div className="grid gap-x-4 gap-y-1.5 text-[11.5px] sm:grid-cols-2">
          {[
            ['Năm thành lập', '1993'], ['Quy mô', `${c.size} nhân viên`],
            ['Ngành', c.industry], ['Quốc gia', c.country],
            ['Mã số thuế', c.tax], ['Tên pháp lý', c.legalName],
            ['Loại hình', /CP|Cổ phần/.test(c.legalName) ? 'Công ty cổ phần' : 'Công ty TNHH'],
            ['Tình trạng', 'Đang hoạt động'],
            ['Người đại diện', c.contact.replace(/ · .*/, '')], ['Địa chỉ đăng ký', c.address],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 border-b border-line-soft py-1">
              <span className="w-32 shrink-0 text-faint">{k}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-ink/80">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-[10.5px] leading-relaxed text-amber-700">
          Không sửa được ở đây — <b>sửa ở tab Overview</b> của công ty. Nhập lại trên trang công khai sẽ tạo ra hai bản mã số thuế / tên pháp lý và chúng sẽ lệch nhau.
        </p>
      </PageSec>

      {/* ── 3. Trait chips ─────────────────────────────────────────────────── */}
      <PageSec n={3} title="Đặc điểm nổi bật" sub="Dải chip dưới thẻ facts · danh sách cố định" state={traits.length ? `${traits.length} chip` : 'Trống — ẩn'} tone={traits.length ? 'active' : 'neutral'} open={open === 3} onToggle={() => toggle(3)}>
        <div className="flex flex-wrap gap-1.5">
          {CP_TRAITS.map((t) => {
            const on = traits.includes(t)
            return (
              <button
                key={t}
                disabled={ro}
                onClick={() => setTraits((p) => (p.includes(t) ? p.filter((x) => x !== t) : p.length >= 6 ? p : [...p, t]))}
                className={cn('rounded-full border px-2.5 py-1 text-[11px]', on ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line bg-surface text-muted hover:border-brand/40', ro && 'cursor-not-allowed opacity-50')}
              >{t}</button>
            )
          })}
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Tối đa 6. Danh sách cố định (không tự nhập) — đó chính là lý do chip <b className="text-ink/70">so sánh được giữa các công ty và lọc được</b> ở trang tìm công ty. {traits.length}/6 đã chọn.
        </p>
      </PageSec>

      {/* ── 4. About ───────────────────────────────────────────────────────── */}
      <PageSec n={4} title="Về công ty" sub="Đoạn giới thiệu · VI bắt buộc" state={has ? 'Đã có' : 'Bắt buộc — trống'} tone={has ? 'active' : 'pending'} open={open === 4} onToggle={() => toggle(4)}>
        <div className="mb-1 flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
          {(['VI', 'EN', 'KO'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={cn('px-2.5 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}{l === 'VI' && ' *'}</button>
          ))}
        </div>
        <textarea
          readOnly={ro}
          rows={4}
          defaultValue={has && lang === 'VI' ? `${c.shortName || c.name} là một trong những doanh nghiệp ${c.industry.toLowerCase()} hàng đầu Việt Nam…` : ''}
          placeholder={lang === 'VI' ? 'Giới thiệu công ty bằng tiếng Việt…' : `Bản dịch ${lang} — bỏ trống thì trang hiển thị bản tiếng Việt.`}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-brand"
        />
        <p className="text-[10.5px] text-faint">VI là bản bắt buộc VÀ là bản dự phòng: thiếu EN/KO thì trang tự hiển thị tiếng Việt, không bao giờ để trống.</p>
      </PageSec>

      {/* ── 5. Video ───────────────────────────────────────────────────────── */}
      <PageSec n={5} title="Video giới thiệu" sub="Tối đa 3 · chỉ nhúng YouTube hoặc Vimeo" state={has ? '1/3' : 'Trống — ẩn'} tone={has ? 'active' : 'neutral'} open={open === 5} onToggle={() => toggle(5)}>
        <div className="space-y-1.5">
          {(has ? ['https://youtube.com/watch?v=…  ·  “Vượt trội mỗi ngày” · 2:14'] : []).map((v) => (
            <div key={v} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px]">
              <span className="min-w-0 flex-1 truncate text-ink/80">{v}</span>
              <button disabled={ro} className="shrink-0 text-[11px] text-faint hover:text-rose-600 disabled:opacity-40">Bỏ</button>
            </div>
          ))}
          <input readOnly={ro} placeholder="Dán link YouTube / Vimeo…" className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px] outline-none placeholder:text-faint focus:border-brand" />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">Chỉ nhận link từ danh sách host cho phép — không cho tải file video lên, vì băng thông và kiểm duyệt nội dung không thuộc phạm vi Phase-1.</p>
      </PageSec>

      {/* ── 6. Photos ──────────────────────────────────────────────────────── */}
      <PageSec n={6} title="Hình ảnh công ty" sub="Bố cục 1 ảnh lớn + 4 ảnh nhỏ · cần ≥3 ảnh" state={has ? '5 ảnh' : 'Trống — ẩn'} tone={has ? 'active' : 'neutral'} open={open === 6} onToggle={() => toggle(6)}>
        <div className="grid h-40 grid-cols-3 grid-rows-2 gap-1.5">
          <div className="col-span-2 row-span-2"><AssetSlot label={has ? 'Trụ sở Hà Nội (hero)' : 'Ảnh hero'} filled={has} /></div>
          <AssetSlot label={has ? 'Không gian làm việc' : 'Ảnh'} filled={has} />
          <AssetSlot label={has ? 'Sự kiện Gala' : 'Ảnh'} filled={has} />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Ảnh đầu tiên là <b className="text-ink/70">hero</b> và chiếm nửa khối — thứ tự ở đây quyết định ảnh nào lên hero. Dưới 3 ảnh thì cả thẻ bị ẩn: một mosaic thủng lỗ trông tệ hơn là không có.
        </p>
      </PageSec>

      {/* ── 7. Story ───────────────────────────────────────────────────────── */}
      <PageSec n={7} title="Câu chuyện của chúng tôi" sub="Tối đa 4 khối ảnh + chữ, xen kẽ trái/phải" state={has ? '0/4 — ẩn' : 'Trống — ẩn'} tone="neutral" open={open === 7} onToggle={() => toggle(7)}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-canvas/40 px-3 py-2.5 text-[11.5px] text-faint">
            <span className="flex-1">Chưa có khối nào — thẻ “Câu chuyện” không hiển thị trên trang.</span>
            <button disabled={ro} className="shrink-0 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-brand disabled:opacity-40">+ Thêm khối</button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {['Tầm nhìn & Sứ mệnh', 'Giá trị cốt lõi', 'Chương trình nổi bật'].map((t) => (
            <div key={t} className="rounded-md border border-line bg-surface p-2">
              <p className="mb-1 text-[11px] font-semibold text-ink">{t}</p>
              <textarea readOnly={ro} rows={2} placeholder="Tuỳ chọn…" className="w-full rounded border border-line bg-canvas/30 px-2 py-1 text-[11px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
          ))}
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">Ba ô nhỏ này bật/tắt độc lập với các khối ảnh — điền một ô cũng hiển thị được.</p>
      </PageSec>

      {/* ── 8. Benefits ────────────────────────────────────────────────────── */}
      {/* The SAME 12 types the job form uses, not a second 8-group list. The Figma
          draws 8 groups, but the spec already decided one shared taxonomy — that is
          what lets a job's benefits be merged with the company's and de-duplicated.
          Two lists would make "Lương thưởng" and "Lương & thưởng" different rows. */}
      <PageSec n={8} title="Phúc lợi & Chế độ" sub="Phúc lợi CHUNG của công ty · mọi tin tuyển dụng kế thừa" state={`${bens.length} nhóm`} tone={bens.length ? 'active' : 'neutral'} open={open === 8} onToggle={() => toggle(8)}>
        <div className="rounded-md border border-line bg-canvas/30 p-2.5">
          <BenefitsField
            label="Phúc lợi chung của công ty"
            max={BENEFIT_TYPES.length}
            initial={bens}
          />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Đây là <b className="text-ink/70">nguồn sự thật</b> cho phúc lợi: khai báo một lần ở đây, mọi tin tuyển dụng của công ty tự kế thừa (chỉ đọc), tin chỉ viết thêm phần <i>riêng của vị trí</i>. Sửa ở đây là mọi tin đang chạy cập nhật theo.
        </p>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Không giới hạn 6 như ở tin tuyển dụng — trang công ty được đọc một lần chứ không bị so sánh cạnh các tin khác, nên liệt kê đủ là có lợi.
        </p>
      </PageSec>

      {/* ── 9. Leaders ─────────────────────────────────────────────────────── */}
      <PageSec n={9} title="Đội ngũ lãnh đạo" sub="Tối đa 6 người · ảnh + tên + chức danh" state={has ? '0/6 — ẩn' : 'Trống — ẩn'} tone="neutral" open={open === 9} onToggle={() => toggle(9)}>
        <div className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-dashed border-line bg-canvas/40 p-2 text-center">
              <div className="mx-auto h-10 w-10 rounded-full border border-line bg-surface" />
              <p className="mt-1.5 text-[10.5px] text-faint">+ Thêm người</p>
            </div>
          ))}
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">Ảnh chân dung là bắt buộc cho mỗi người — một hàng avatar khuyết trông như trang lỗi.</p>
      </PageSec>

      {/* ── 10. Offices — the same book the job form picks from ─────────────── */}
      <PageSec n={10} title="Văn phòng" sub="Danh sách + bản đồ · dùng chung sổ địa điểm với tin tuyển dụng" state="3 địa điểm" tone="active" open={open === 10} onToggle={() => toggle(10)}>
        <div className="rounded-md border border-line bg-canvas/30 p-2.5">
          <WorkingLocationsField max={8} initial={['hq', 'hn', 'bd']} />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Đây là <b className="text-ink/70">cùng một sổ địa điểm</b> mà form đăng tin chọn ra — sửa địa chỉ ở đây thì mọi tin đang chạy cập nhật theo. Địa điểm đầu tiên là trụ sở chính và là điểm bản đồ mặc định.
        </p>
      </PageSec>

      {/* ── 11. Meta ───────────────────────────────────────────────────────── */}
      <PageSec n={11} title="Thông tin thêm" sub="Lĩnh vực kinh doanh · thương hiệu · website · mạng xã hội" state={has ? 'Đã có' : 'Trống — ẩn'} tone={has ? 'active' : 'neutral'} open={open === 11} onToggle={() => toggle(11)}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <LField label="Lĩnh vực kinh doanh" value={has ? `Dịch vụ ${c.industry.toLowerCase()}` : ''} />
          <LField label="Thương hiệu" value={has ? c.shortName || c.name : ''} hint="Ngăn cách bằng dấu ·" />
          <LField label="Website" value={c.domain} />
          <LField label="Mạng xã hội" value={has ? 'Facebook · LinkedIn' : ''} hint="Chỉ nhận link — hiển thị thành icon." />
        </div>
        <LField label="Số nhân viên hiển thị / lịch sử nhân sự" value={has ? `${c.size} · 2 năm dữ liệu` : ''} hint="Biểu đồ nhân sự cần tối thiểu 3 năm, dưới mức đó thì ẩn." />
      </PageSec>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-2">
        {ro ? (
          <span className="rounded-lg border border-dashed border-line bg-canvas/50 px-3 py-1.5 text-[11.5px] text-muted">{RO_HINT}</span>
        ) : has ? (
          <>
            <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Lưu thay đổi</button>
            <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">↗ Xem trang thật</button>
            <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-rose-300 hover:text-rose-600">Gỡ khỏi công khai</button>
          </>
        ) : (
          <>
            <button disabled={missing.length > 0} className={cn('rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white', missing.length ? 'cursor-not-allowed bg-brand/40' : 'bg-brand hover:opacity-90')}>Đăng trang</button>
            <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand">Lưu nháp</button>
          </>
        )}
      </div>
      {!has && <p className="text-[11px] text-amber-700">Nháp — chưa công khai. Công ty <b>không đăng được tin tuyển dụng</b> cho tới khi trang này được đăng.</p>}
    </div>
  )
}

/* ── the tabbed company record ────────────────────────────────────────────── */
/* ── Affiliated companies — the corporate-tree block on a company record ─────
   One level up (as a breadcrumb) and one level down (as a list). Deliberately not
   the whole tree: the rep needs context and a way across, not an org chart. Every
   row shows the affiliate's OWN tax code, because that is what makes it obvious
   these are separate customers that happen to be related. */
/* Sơ đồ tập đoàn — the whole group as an indented tree, rooted at the top-most
   parent. Deliberately NOT a revenue roll-up: the point of the chart is to show
   that the link is for lookup only, so every node carries its own MST, its own
   tier and its own sales owner. */
function GroupChart({ root, current, onClose, onOpen }: { root: Company; current: Company; onClose: () => void; onOpen?: (x: Company) => void }) {
  const rows: { c: Company; depth: number }[] = []
  const walk = (n: Company, depth: number) => {
    rows.push({ c: n, depth })
    childrenOf(n).forEach((k) => walk(k, depth + 1))
  }
  walk(root, 0)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[760px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Sơ đồ tập đoàn — {coLabel(root)}</p>
            <p className="text-[11px] text-muted">{rows.length} công ty · liên kết chỉ để tra cứu, không kế thừa quota, hợp đồng hay doanh thu.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto p-3">
          <div className="grid gap-x-3 border-b border-line px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '2.4fr 1.1fr 1fr 1.1fr' }}>
            <span>Công ty</span><span>MST</span><span>Hạng</span><span>Sales phụ trách</span>
          </div>
          {rows.map(({ c, depth }) => {
            const t = tierOf(c)
            const isCurrent = c.name === current.name
            return (
              <button
                key={c.name}
                onClick={() => { onClose(); onOpen?.(c) }}
                className={cn('grid w-full items-center gap-x-3 border-b border-line-soft px-2 py-2 text-left text-[12px] transition-colors hover:bg-canvas/70', isCurrent && 'bg-brand-soft/50')}
                style={{ gridTemplateColumns: '2.4fr 1.1fr 1fr 1.1fr' }}
              >
                <span className="flex min-w-0 items-center" style={{ paddingLeft: depth * 18 }}>
                  {depth > 0 && <span className="mr-1.5 shrink-0 text-faint">└</span>}
                  <span className={cn('min-w-0 truncate', isCurrent ? 'font-semibold text-brand' : 'text-ink/80')}>{coLabel(c)}</span>
                  {depth > 0 && <span className="ml-1.5 shrink-0"><Pill tone="neutral">Công ty con</Pill></span>}
                  {childrenOf(c).length > 0 && <span className="ml-1.5 shrink-0 rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>}
                </span>
                <span className="truncate font-mono text-[11px] text-muted">{c.tax}</span>
                <span className="min-w-0 truncate">{t ? <TierPill tier={t} en /> : <span className="text-[11px] text-faint">Chưa có hạng</span>}</span>
                <span className="truncate text-[11.5px] text-muted">{c.owner}</span>
              </button>
            )
          })}
        </div>

        <div className="border-t border-line bg-canvas/40 px-5 py-2.5 text-[10.5px] leading-relaxed text-muted">
          Mỗi công ty giữ <b className="text-ink/70">MST, gói/quota, hợp đồng, hoá đơn và sales phụ trách riêng</b>. Hạng thành viên
          cũng tính riêng từng pháp nhân — doanh thu công ty con <b className="text-ink/70">không</b> cộng lên công ty mẹ.
        </div>
      </div>
    </div>
  )
}

/* ── Link an EXISTING company as parent or child ───────────────────────────
   Two directions, one stored field. Whichever way the rep thinks about it
   ("this belongs to X" vs "X belongs to this"), the write is always the same:
   parentCompanyId on the CHILD. The modal makes that explicit — it shows the
   resulting mẹ → con pair before saving, so nobody has to work out which record
   actually changes. Every link is simply CÔNG TY CON: the old chi-nhánh /
   công-ty-con split was derived from the tax root and changed nothing a rep could
   act on, so it is gone. Companies sharing the 10-digit tax root are still
   surfaced FIRST in the picker, as the strongest hint of the same legal entity. */
function LinkAffiliateModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const [dir, setDir] = useState<'parent' | 'child'>('parent')
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Company | null>(null)

  // Cycle guard: for "c is a child of X", X may not sit under c; for "c is the
  // parent of X", X may not be an ancestor of c. Without this a group can be
  // linked into a loop that the ancestor walk would then have to survive. The loop
  // is also what Điều 195 forbids outright (a con may not hold capital in its mẹ),
  // so this guard is a legal rule, not only a data-integrity one.
  const candidates = COMPANIES.filter((x) => {
    if (x.name === c.name) return false
    if (dir === 'parent') return !ancestorsOf(x).some((a) => a.name === c.name)
    return !ancestorsOf(c).some((a) => a.name === x.name)
  }).filter((x) => {
    const k = searchKey(q.trim())
    return !k || searchKey([coLabel(x), x.legalName, x.tax, companyId(coKey(x))].join(' ')).includes(k)
  }).sort((a, b) => Number(taxRoot(b.tax) === taxRoot(c.tax)) - Number(taxRoot(a.tax) === taxRoot(c.tax)))

  // Whichever direction was chosen, resolve it to the one pair that gets stored.
  const parent = dir === 'parent' ? pick : c
  const child = dir === 'parent' ? c : pick
  // Re-parenting an existing child is allowed, but it MOVES the record out of its
  // current group — say so rather than letting the tree silently change shape.
  const moving = child?.parent ? coByName(child.parent) : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Gán quan hệ tập đoàn</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Quan hệ</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { k: 'parent' as const, t: `${coLabel(c)} là CÔNG TY CON`, s: 'Chọn công ty mẹ của công ty này', off: false },
                { k: 'child' as const, t: `${coLabel(c)} là CÔNG TY MẸ`, s: 'Chọn công ty con trực thuộc', off: false },
              ]).map((o) => (
                <button
                  key={o.k}
                  onClick={() => { if (o.off) return; setDir(o.k); setPick(null) }}
                  disabled={o.off}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left',
                    o.off ? 'cursor-not-allowed border-line bg-canvas/50 opacity-60' : dir === o.k ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40',
                  )}
                >
                  <span className="flex items-center gap-2"><Radio on={dir === o.k && !o.off} /><span className="text-[12px] font-semibold text-ink">{o.t}</span></span>
                  <span className="mt-0.5 block pl-6 text-[11px] text-muted">{o.s}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11.5px] font-medium text-ink/80">
              {dir === 'parent' ? 'Công ty mẹ' : 'Công ty con'} <span className="text-rose-500">*</span>
            </p>
            {/* The 10-digit tax root is the strongest signal two records are the same
                legal entity, so those companies are surfaced first and labelled —
                the rep should not have to notice the MST match themselves. */}
            <p className="mb-1.5 text-[10.5px] leading-relaxed text-faint">
              Gợi ý đầu danh sách là các công ty <b className="text-ink/70">trùng 10 số gốc MST</b> với {coLabel(c)} (<span className="font-mono">{taxRoot(c.tax)}</span>) — thường là cùng một pháp nhân. Vẫn tìm được mọi công ty khác bên dưới.
            </p>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, MST hoặc Company ID…"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <div className="mt-1.5 max-h-[200px] space-y-1 overflow-y-auto">
              {candidates.slice(0, 8).map((x) => {
                const sameRoot = taxRoot(x.tax) === taxRoot(c.tax)
                return (
                <button
                  key={x.name}
                  onClick={() => setPick(x)}
                  className={cn('flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left', pick?.name === x.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}
                >
                  <Radio on={pick?.name === x.name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate text-[12px] font-medium text-ink">{coLabel(x)}</span>
                      {sameRoot && <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1 py-px text-[9.5px] font-medium text-amber-700">cùng gốc MST</span>}
                    </span>
                    <span className="block truncate text-[10.5px] text-faint">MST {x.tax} · {companyId(coKey(x))} · {x.owner}</span>
                  </span>
                </button>
                )
              })}
              {candidates.length === 0 && <p className="rounded-md bg-canvas/60 px-2 py-3 text-center text-[11px] text-faint">Không có công ty phù hợp — đã loại công ty hiện tại và mọi lựa chọn sẽ tạo vòng lặp sở hữu.</p>}
            </div>
          </div>

          {pick && parent && child && (
            <div className="rounded-lg border border-line bg-canvas/40 p-3">
              <p className="mb-1.5 text-[11.5px] font-semibold text-ink/70">Sau khi lưu</p>
              <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                <span className="font-medium text-ink">{coLabel(parent)}</span>
                <span className="rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>
                <span className="text-faint">›</span>
                <span className="font-medium text-ink">{coLabel(child)}</span>
                <Pill tone="neutral">Công ty con</Pill>
              </div>
              {moving && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                 {coLabel(child)} đang trực thuộc <b>{coLabel(moving)}</b>. Lưu thay đổi này sẽ <b>chuyển</b> công ty sang tập đoàn mới — ghi vào audit log.
                </p>
              )}
            </div>
          )}

        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} disabled={!pick} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Lưu liên kết</button>
        </div>
      </div>
    </div>
  )
}

/* Unlink ONE parent→child edge. Named from both ends because "unlink this company"
   is ambiguous on a middle node — Đông Phong sits under Trường Sơn and above Kim
   Long, and cutting the edge above it is a different act from cutting the one below.

   The consequence that has to be on screen: descendants travel WITH the child. Cut
   Trường Sơn → Đông Phong and Kim Long does not become a root; it stays under Đông
   Phong, which becomes the root of a new group. */
function UnlinkAffiliateModal({ parent, child, onClose }: { parent: Company; child: Company; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const descendants = (() => {
    const out: Company[] = []
    const walk = (n: Company) => childrenOf(n).forEach((k) => { out.push(k); walk(k) })
    walk(child)
    return out
  })()
  const childKeepsGroup = descendants.length > 0
  const parentLeftAlone = childrenOf(parent).length === 1 && !parent.parent

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Gỡ quan hệ mẹ / con</p>
            <p className="text-[11px] text-muted">Chỉ gỡ liên kết. Không công ty nào bị xoá.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          <div className="rounded-lg border border-line bg-canvas/40 p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="font-medium text-ink">{coLabel(parent)}</span>
              <span className="rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>
              <span className="text-rose-500 line-through">›</span>
              <span className="font-medium text-ink">{coLabel(child)}</span>
              <Pill tone="neutral">Công ty con</Pill>
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">MST {parent.tax} · MST {child.tax} — hai pháp nhân riêng, không thay đổi.</p>
          </div>

          <div className="rounded-lg border border-line px-3 py-2.5">
            <p className="mb-1.5 text-[11.5px] font-semibold text-ink/70">Sau khi gỡ</p>
            <ul className="space-y-1 text-[11.5px] leading-relaxed text-muted">
              <li>· <b className="text-ink/80">{coLabel(child)}</b> {childKeepsGroup ? 'trở thành gốc của một tập đoàn mới' : 'trở thành công ty độc lập'}.</li>
              {childKeepsGroup && (
                <li>· <b className="text-ink/80">{descendants.length} công ty cấp dưới</b> ({descendants.map(coLabel).join(', ')}) đi theo {coLabel(child)} — không bị gỡ.</li>
              )}
              {parentLeftAlone && <li>· <b className="text-ink/80">{coLabel(parent)}</b> không còn công ty con nào.</li>}
              <li>· MST, hợp đồng, quota, báo giá và hoá đơn của cả hai <b className="text-ink/80">giữ nguyên</b> — quan hệ tập đoàn chưa bao giờ gộp doanh thu.</li>
            </ul>
          </div>

          <div>
            <FLabel req>Lý do gỡ</FLabel>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: gán nhầm tập đoàn · đã thoái vốn · tách pháp nhân"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Ghi vào audit log cùng người thực hiện — quan hệ tập đoàn đổi chủ sở hữu báo cáo, nên luôn phải truy được ai đổi và vì sao.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          <button
            onClick={onClose}
            disabled={!reason.trim()}
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gỡ quan hệ
          </button>
        </div>
      </div>
    </div>
  )
}

function AffiliatedCompanies({ c, onOpen }: { c: Company; onOpen?: (x: Company) => void }) {
  const ro = useReadOnly()
  const [chart, setChart] = useState(false)
  const [linking, setLinking] = useState(false)
  /** The relationship being removed: {parent, child} — always named from both ends,
      never "unlink this", so the confirm can say exactly which edge is cut. */
  const [unlinking, setUnlinking] = useState<{ parent: Company; child: Company } | null>(null)

  const chain = ancestorsOf(c)
  const kids = childrenOf(c)
  const root = groupRootOf(c)
  const go = (x: Company) => onOpen?.(x)

  return (
    <DetailCard
      title="Công ty liên kết — Affiliated companies"
      action={inGroup(c) ? <span className="text-[11px] text-faint">{groupOf(root).length} công ty trong tập đoàn</span> : undefined}
    >
      {/* Where this company sits in its group, root first. Rendered as a boxed path
          rather than a run of links: the tail is THIS company, and it has to read as
          a position rather than as one more thing to click. */}
      {chain.length > 0 && (
        <div className="mb-2.5 rounded-lg border border-line bg-canvas/50 px-2.5 py-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-faint">Vị trí trong tập đoàn</p>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[11.5px]">
            {chain.map((a, i) => (
              <span key={a.name} className="flex items-center gap-1">
                {i === 0 && <span className="text-[11px]"></span>}
                <button onClick={() => go(a)} className="font-medium text-brand hover:underline">{coLabel(a)}</button>
                <span className="text-faint">›</span>
              </span>
            ))}
            <span className="rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">{coLabel(c)}</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[10.5px] text-faint">cấp {chain.length + 1}</span>
              {!ro && (
                <button
                  onClick={() => setUnlinking({ parent: chain[chain.length - 1], child: c })}
                  title={`Gỡ khỏi ${coLabel(chain[chain.length - 1])}`}
                  className="rounded border border-line px-1.5 py-0.5 text-[10.5px] font-medium text-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                >
                  Gỡ
                </button>
              )}
            </span>
          </div>
        </div>
      )}

      {kids.length > 0 ? (
        <div className="space-y-1.5">
          {kids.map((k) => (
            <div key={k.name} className="flex w-full items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5 hover:border-brand/40">
              <button onClick={() => go(k)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-medium text-ink hover:text-brand hover:underline">{coLabel(k)}</p>
                <p className="truncate text-[10.5px] text-faint">MST {k.tax} · {k.owner}</p>
              </button>
              {/* One label. A "chi nhánh" vs "công ty con" split was derived from the
                  tax code and shown here, but it changed nothing a rep can act on —
                  both are separate customers with their own MST, quota and invoices. */}
              <span className="flex shrink-0 items-center gap-1.5">
                <Pill tone="neutral">Công ty con</Pill>
                {!ro && (
                  <button
                    onClick={() => setUnlinking({ parent: c, child: k })}
                    title={`Gỡ ${coLabel(k)} khỏi ${coLabel(c)}`}
                    className="rounded border border-line px-1.5 py-0.5 text-[10.5px] font-medium text-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                  >
                    Gỡ
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11.5px] text-muted">
          {chain.length
            ? 'Không có công ty con trực tiếp.'
            : 'Chưa thuộc tập đoàn nào và chưa có công ty con.'}
        </p>
      )}

      {/* One action only: LINK an existing record, either direction. A subsidiary
          that does not exist yet is created from the Companies list like any other
          company — a second create path here would be a second way to make a
          duplicate, and the group link is not a reason to bypass the MST check. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-2.5">
        {!ro && <button onClick={() => setLinking(true)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-ink/40">Gán quan hệ mẹ / con</button>}
        {inGroup(c) && <button onClick={() => setChart(true)} className="ml-auto text-[11px] font-medium text-brand hover:underline">Xem sơ đồ tập đoàn ↗</button>}
      </div>

      {chart && <GroupChart root={root} current={c} onClose={() => setChart(false)} onOpen={onOpen} />}
      {linking && <LinkAffiliateModal c={c} onClose={() => setLinking(false)} />}
      {unlinking && <UnlinkAffiliateModal {...unlinking} onClose={() => setUnlinking(null)} />}
    </DetailCard>
  )
}

/**
 * Company tags — a multi-select of editorial labels from Master data → Company tag.
 * Click to open the option list; tick any number (Korean company, Big company, …).
 * Options are read from MD_DOMAINS so this stays in sync with Master data.
 */
function CompanyTagPicker({ initial = [] }: { initial?: string[] }) {
  const ro = useReadOnly()
  const options = MD_DOMAINS.find((d) => d.key === 'company-tag')?.entries ?? ['Korean company', 'Big company']
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<string[]>(initial)
  const toggle = (t: string) => setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
  return (
    <div className="relative">
      <button
        onClick={() => { if (!ro) setOpen((o) => !o) }}
        disabled={ro}
        title={ro ? RO_HINT : undefined}
        className={cn('flex min-h-[38px] w-full flex-wrap items-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-left', ro ? 'cursor-not-allowed bg-canvas/50' : 'bg-surface')}
      >
        {sel.length === 0 && <span className="px-1 text-[12px] text-faint">Select tags…</span>}
        {sel.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">
            {t}
            <span role="button" onClick={(e) => { e.stopPropagation(); toggle(t) }} className="cursor-pointer text-brand/50 hover:text-brand">×</span>
          </span>
        ))}
        <span className="ml-auto pl-1 text-faint">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lg">
          {options.map((t) => {
            const on = sel.includes(t)
            return (
              <button key={t} onClick={() => toggle(t)} className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-canvas', on ? 'font-medium text-brand' : 'text-ink/80')}>
                <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px]', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on ? '✓' : ''}</span>
                {t}
              </button>
            )
          })}
          <p className="mt-1 border-t border-line-soft px-3 pt-1.5 text-[10.5px] leading-snug text-faint">Multi-select · manage options in System → Master data → Company tag</p>
        </div>
      )}
    </div>
  )
}

/* ── Owner (sales) history — who held the account, and who reassigned it ────
   The current owner is the newest entry; every earlier tenure records the ACTOR
   who moved it (a Sales lead, never the old/new owner) and why. Deterministic
   from the company so a record reads the same every render. Mirrors the CRM
   requirement "Sales owner — one current owner, and a full reassignment history". */
type CoOwnerTenure = { owner: string; from: string; to: string; by: string; reason: string; created?: boolean }
const OWNER_POOL = ['Nguyễn Thị Lan', 'Phạm Quang Huy', 'Trần Quốc Trung']
const OWNER_LEAD = 'Lê Hữu Phong · Sales Lead'
const REASSIGN_REASONS = [
  'Territory rebalance — moved to the rep for this region',
  'Previous rep left the company — handed over',
  'Upgraded to a key-account rep as the account grew',
  'Round-robin reallocation after a workload review',
]
const ownerSinceYear = (c: Company) => {
  const m = /\/(\d{4})$/.exec(c.since)
  return m ? Number(m[1]) : null
}
/** a rep different from `owner`, chosen deterministically by `salt`. */
const pickPrevOwner = (owner: string, salt: number) => {
  const others = OWNER_POOL.filter((r) => r !== owner)
  return others[salt % others.length]
}
function companyOwnerHistory(c: Company): CoOwnerTenure[] {
  const yr = ownerSinceYear(c)
  // A brand-new lead (no purchase / no activation date): one entry — whoever
  // created it still owns it. "Never reassigned" is a real state, not a gap.
  if (yr === null) return [{ owner: c.owner, from: 'at creation', to: 'now', by: 'Tạo lead (hệ thống)', reason: `Lead created — ${coLeadSource(c)}`, created: true }]
  const priors = yr <= 2023 ? 2 : yr <= 2024 ? 1 : 0
  if (priors === 0) return [{ owner: c.owner, from: c.since, to: 'now', by: 'Tạo lead (hệ thống)', reason: 'Owner set at creation · never reassigned', created: true }]
  const salt = c.name.length + c.tax.length
  const out: CoOwnerTenure[] = [
    { owner: c.owner, from: priors === 2 ? '02/2025' : '03/2025', to: 'now', by: OWNER_LEAD, reason: REASSIGN_REASONS[salt % REASSIGN_REASONS.length] },
  ]
  if (priors === 2) out.push({ owner: pickPrevOwner(c.owner, salt), from: '05/2024', to: '02/2025', by: OWNER_LEAD, reason: REASSIGN_REASONS[(salt + 2) % REASSIGN_REASONS.length] })
  out.push({ owner: pickPrevOwner(c.owner, salt + 1), from: c.since, to: priors === 2 ? '05/2024' : '03/2025', by: 'Tạo lead (hệ thống)', reason: 'Created from CRM · first owner', created: true })
  return out
}

function OwnerHistory({ c }: { c: Company }) {
  const hist = companyOwnerHistory(c)
  // No count in the header: a company always has exactly ONE owner. The list is a
  // tenure history, so "N owners" read as if it could hold several at once.
  return (
    <DetailCard title="Owner history">
      <ol className="space-y-2.5">
        {hist.map((t, i) => (
          <li key={i} className="relative pl-4">
            <span className={cn('absolute left-0 top-[5px] h-2 w-2 rounded-full', i === 0 ? 'bg-brand' : 'bg-line')} />
            {i < hist.length - 1 && <span className="absolute bottom-[-10px] left-[3px] top-4 w-px bg-line-soft" />}
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[12.5px] font-medium text-ink">{t.owner}</span>
              {i === 0
                ? <Pill tone="active">Current</Pill>
                : <span className="shrink-0 text-[10.5px] tabular-nums text-faint">{t.from} – {t.to}</span>}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
              {i === 0 && <span className="tabular-nums text-muted">{t.from} – now · </span>}
              {t.created ? 'Created the lead' : <><span className="text-ink/70">↔ Reassigned by {t.by}</span></>}
              {' · '}{t.reason}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-2 border-t border-line-soft pt-2 text-[11px] leading-relaxed text-faint">
        Every reassignment is logged with <b className="text-ink/70">who moved it and why</b> — the record is append-only, never overwritten. Changing owner does not touch contacts, deals or the customer relationship.
      </p>
    </DetailCard>
  )
}

/* ── Verification documents — proof the MST belongs to them (giấy phép KD, giấy
   chứng nhận đăng ký thuế, hợp đồng đã ký). Uploaded at creation AND managed here
   on the record.

   NO approval status. A file is either on the record or it is not, and that single
   fact is already visible from the list itself — a per-file Chờ duyệt / Đã duyệt
   badge added a second state to read without adding anything to act on, and it
   implied a review queue nobody owns. */
type CoDoc = { name: string; note?: string }
function companyDocs(c: Company): CoDoc[] {
  // Anyone ever invoiced has their licence on file; a churned customer keeps theirs.
  // A deal that reached PO is collecting it. An early lead has none yet.
  if (c.account === 'Existing' || c.account === 'Churn') return [
    { name: 'giay-phep-kinh-doanh.pdf', note: `Tải lên ${c.since}` },
    { name: 'giay-chung-nhan-dang-ky-thue.pdf' },
  ]
  if (isCustomer(c)) return [{ name: 'giay-phep-kinh-doanh.pdf' }]
  return []
}
function CompanyDocs({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [docs, setDocs] = useState<CoDoc[]>(() => companyDocs(c))
  const add = () => setDocs((d) => [...d, { name: `tai-lieu-${d.length + 1}.pdf` }])
  return (
    <DetailCard
      title="Verification documents"
      action={<span className="text-[11px] text-faint">{docs.length} tệp</span>}
    >
      <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-4 text-center">
        <p className="text-[12px] font-medium text-ink">{ro ? 'Chỉ xem tài liệu' : <>Kéo thả hoặc <button onClick={add} className="text-brand hover:underline">chọn tệp</button></>}</p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint">Giấy phép kinh doanh · Giấy chứng nhận đăng ký thuế · Hợp đồng đã ký. PDF, JPG, PNG — tối đa 10MB mỗi tệp.</p>
      </div>
      {docs.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
              <span className="text-[13px]"></span>
              <div className="min-w-0 flex-1">
                <a href="#" onClick={(e) => e.preventDefault()} className="block truncate text-[11.5px] font-medium text-brand hover:underline">{d.name}</a>
                {d.note && <p className="truncate text-[10px] text-faint">{d.note}</p>}
              </div>
              {!ro && <button onClick={() => setDocs((p) => p.filter((_, j) => j !== i))} className="shrink-0 text-[11px] text-faint hover:text-ink">✕</button>}
            </div>
          ))}
        </div>
      )}
      {docs.length === 0
        ? <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">Chưa có tài liệu xác minh — vẫn bán được, nhưng sẽ bị chặn ở bước <b>xuất hoá đơn VAT</b>.</p>
        : <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">Chứng minh MST là của họ. Bản cũ vẫn giữ lại cho audit khi công ty đăng ký lại.</p>}
    </DetailCard>
  )
}

/**
 * Pipeline stage, as a control rather than a read-out.
 *
 * WHO may set WHAT is the whole point of this component:
 *  · SALES moves the deal between the three talking stages — Proposal, Qualified,
 *    Negotiation — in any direction. A deal genuinely goes backwards (the champion
 *    leaves, it returns to Proposal), so this is not a one-way ladder.
 *  · SALES may close to LOST from ANY stage, with a reason. That is the one exit a
 *    person is allowed to take at will.
 *  · PO and INVOICE are SYSTEM-only and are NOT in the menu at all. They are
 *    consequences of issuing the sales order and of Accounting issuing the VAT
 *    invoice; listing them greyed only invited the question "why can't I pick
 *    this?" on a menu whose job is to offer the choices that exist.
 *  · INVOICE is terminal: the deal is closed-won and there is nothing left to move.
 */
const SALES_STAGES: CoStatus[] = ['Proposal', 'Qualified', 'Negotiation']

function PipelineStatusPicker({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [stage, setStage] = useState<CoStatus>(c.status)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [reason, setReason] = useState('')
  const terminal = stage === 'Invoice'

  const pick = (next: CoStatus) => {
    if (next === 'Lost') { setClosing(true); setOpen(false); return }
    setStage(next); setOpen(false)
  }

  return (
    <span className="relative inline-flex">
      {/* The chevron sits INSIDE the chip. A wrapper border plus a hover label was
          three signals doing one signal's job — the chevron alone already says
          "this opens", and keeping it inside means the control still reads as one
          badge among the others rather than as a box around one. */}
      <button
        onClick={() => { if (!ro && !terminal) setOpen((o) => !o) }}
        disabled={ro || terminal}
        title={ro ? RO_HINT : terminal ? 'Deal đã đóng thắng — không còn giai đoạn nào để chuyển.' : 'Đổi giai đoạn pipeline'}
        className={cn('inline-flex rounded-full', ro || terminal ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80')}
      >
        <Pill tone={CO_STATUS[stage].tone}>
          {CO_STATUS[stage].label}
          {!ro && !terminal && <span className={cn('text-[8px] leading-none transition-transform', open && 'rotate-180')}>▼</span>}
        </Pill>
      </button>

      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <span className="absolute left-0 top-full z-20 mt-1 block w-[290px] overflow-hidden rounded-lg border border-line bg-surface text-left shadow-lg">
            {SALES_STAGES.map((st) => (
              <button key={st} onClick={() => pick(st)} className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-canvas', st === stage && 'bg-brand-soft/50')}>
                <Pill tone={CO_STATUS[st].tone}>{CO_STATUS[st].label}</Pill>
                {st === stage && <span className="ml-auto text-[10px] font-medium text-brand">hiện tại</span>}
              </button>
            ))}
            <button onClick={() => pick('Lost')} className="flex w-full items-center gap-2 border-t border-line-soft px-2.5 py-1.5 text-left hover:bg-canvas">
              <Pill tone={CO_STATUS.Lost.tone}>{CO_STATUS.Lost.label}</Pill>
              <span className="text-[10.5px] text-muted">— đóng deal, cần lý do</span>
            </button>
          </span>
        </>
      )}

      {/* Lost is the only exit a human takes on purpose, so it is the only one that
          asks why — the reason is what makes the loss report worth reading. */}
      {closing && (
        <span className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={() => setClosing(false)}>
          <span className="my-4 block w-full max-w-[420px] rounded-2xl border border-line bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-bold text-ink">Đóng deal — Lost</p>
            <p className="mt-0.5 text-[11.5px] text-muted">Công ty vẫn giữ nguyên customer status và ở lại danh sách nurture. Một báo giá mới sẽ mở lại deal.</p>
            <p className="mb-1 mt-3 block text-[11.5px] font-medium text-ink/80">Lý do <span className="text-rose-500">*</span></p>
            <span className="flex flex-wrap gap-1.5">
              {['Giá cao', 'Chọn đối thủ', 'Cắt ngân sách', 'Không còn nhu cầu', 'Mất liên lạc'].map((r) => (
                <button key={r} onClick={() => setReason(r)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', reason === r ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{r}</button>
              ))}
            </span>
            <span className="mt-3 flex justify-end gap-2">
              <button onClick={() => setClosing(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Huỷ</button>
              <button
                disabled={!reason}
                onClick={() => { setStage('Lost'); setClosing(false) }}
                className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', reason ? 'bg-rose-600 hover:opacity-90' : 'cursor-not-allowed bg-line')}
              >
                Đóng deal
              </button>
            </span>
          </span>
        </span>
      )}
    </span>
  )
}

function CompanyDetail({ c, onBack, onOpen }: { c: Company; onBack: () => void; onOpen?: (x: Company) => void }) {
  const [tab, setTab] = useState<CoTab>('Overview')
  const [inviting, setInviting] = useState(false)
  const [contactOpen, setContactOpen] = useState<CoContact | null>(null)
  /* One Edit toggle for the whole Basic-info card, rather than a pencil per row:
     14 inline editors is 14 chances to leave one half-saved. */
  const [editInfo, setEditInfo] = useState(false)
  /* "+ Thêm công ty con" swaps in the create PAGE with this company locked as the
     parent, rather than floating a form over the record it came from. */
  useDetailCrumb(coLabel(c), onBack)
  const [addingContact, setAddingContact] = useState(false)
  const [quoting, setQuoting] = useState(false)
  /* HQ cleanup for duplicate / junk companies — soft + reversible, never a delete. */
  const [archived, setArchived] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  /* Reached from search rather than owned. Read everything, write nothing — see
     ReadOnlyCtx. Editing state is force-closed so a rep cannot leave the card in
     edit mode and come back to it on someone else's record. */
  const ro = c.owner !== ME
  const noProducts = !c.jobPosting && !c.resumeSearch
  const team = companyTeam(c)
  const jobs = companyJobs(c)
  const activeJobs = jobs.filter((j) => j.status === 'open').length
  const full = team.length >= MAX_SEATS
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()

  const tabs: { key: CoTab; label: string; count?: number }[] = [
    { key: 'Overview', label: 'Overview' },
    { key: 'Contacts', label: 'Contacts', count: companyContacts(c).length },
    { key: 'Users', label: 'Users', count: team.length },
    { key: 'Products & billing', label: 'Products & billing' },
    { key: 'Company page', label: 'Company page' },
    { key: 'Jobs', label: 'Jobs', count: c.jobPosting ? jobs.length : undefined },
    // Applications hang off the jobs this account posted, so the tab only exists
    // for Job-Posting customers; Resumes only for Resume-Search customers.
    ...(c.jobPosting ? [{ key: 'Applications' as CoTab, label: 'Applications', count: companyApplicants(c).length }] : []),
    ...(c.resumeSearch ? [{ key: 'Resumes' as CoTab, label: 'Resumes' }] : []),
  ]


  return (
    <ReadOnlyCtx.Provider value={ro}>
    <div>

      {/* Reached from the search, not from my own book. Reading a colleague's record
          is allowed and useful — it is what stops a duplicate being created. ACTING
          on it is not, and saying so here is what makes the read-only rule legible
          instead of a mystery when a button does nothing. */}
      {c.owner !== ME && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-canvas/70 px-3 py-2 text-[11.5px]">
          <span className="text-[13px]"></span>
          <span className="text-muted">Công ty này do <b className="font-medium text-ink">{c.owner}</b> phụ trách — bạn đang xem ở chế độ <b className="font-medium text-ink">chỉ đọc</b>.</span>
          <button className="ml-auto shrink-0 rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">Yêu cầu chuyển giao</button>
        </div>
      )}

      {/* header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-[16px] font-bold text-white shadow-sm">{initials}</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Company account</p>
            <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
              {c.name}
              {/* Both axes, always: customer status (has it ever bought) and, only
                  while a deal is live, the pipeline stage. */}
              <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>
              {archived && <Pill tone="expired">Archived</Pill>}
              {/* Shown while a deal is live, and also once it is LOST — a lost deal
                  can be re-opened to an earlier stage, so hiding the control there
                  would remove the only way back. Closed-won (Invoice) stays hidden:
                  there is nothing left to move. */}
              {(inPipeline(c) || c.status === 'Lost') && <PipelineStatusPicker c={c} />}
              {/* third axis — only rendered once a tier is actually earned, so the
                  header never carries a "chưa có hạng" non-fact. */}
              {tierOf(c) && <TierPill tier={tierOf(c)} en />}
            </h2>
            <p className="text-[11.5px] text-muted"><span className="font-mono font-medium text-ink/70">{companyId(coKey(c))}</span> · {c.legalName} · MST {c.tax} · <span className="font-mono">{c.domain}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Edit and Create-quotation are WRITES — withdrawn on someone else's
              record. "View on jobseeker" is a read, so it stays. */}
          {!ro && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Edit</button>}
          {c.hasPage && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">View on jobseeker ↗</button>}
          {/* Tạo báo giá — unconditional, for EVERY company. A quotation is the one
              document that is always legitimate to raise: a first quote for a
              prospect, a renewal for an existing customer, a win-back for a churned
              one. The gated step is the PO, which is raised from an accepted
              quotation option (see the Quotations list), not from here. */}
          {/* …but still only for a company in MY book: quoting someone else's
              customer is exactly the collision the ownership rule exists to stop. */}
          {!ro && (
            <button onClick={() => setQuoting(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">
              Tạo báo giá / Create quotation
            </button>
          )}
          {/* HQ cleanup for duplicate / junk companies — soft & reversible. */}
          {archived
            ? <button onClick={() => setArchived(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Unarchive</button>
            : <button onClick={() => setArchiveOpen(true)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50">Archive company</button>}
        </div>
      </div>

      {archiveOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[480px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-[15px] font-bold">Archive {coLabel(c)}?</p>
              <button onClick={() => setArchiveOpen(false)} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[12px] text-muted">Archiving <b className="text-ink/80">hides the company from active lists, blocks its logins and hides its jobs</b>. It’s reversible (Unarchive) and never deletes the record or its audit trail.</p>
              {(noProducts && team.length <= 1) ? (
                <p className="flex gap-2 rounded-md bg-canvas px-3 py-2.5 text-[11.5px] leading-relaxed text-muted"><span>🧹</span><span>This looks like an empty shell (no products, {team.length} user) — safe to archive.</span></p>
              ) : (
                <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span>⚠️</span><span>This company has {noProducts ? '' : 'active products and '}{team.length} users. <b>Move its users into the surviving company first</b> — don’t strand a real account.</span></p>
              )}
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Reason <span className="text-rose-500">*</span></p>
                <textarea rows={2} placeholder="e.g. duplicate of Công ty TNHH Vạn Phát — users moved" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink" />
                <p className="mt-1 text-[10.5px] text-faint">Written to the audit log with your name and the time.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={() => setArchiveOpen(false)} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
              <button onClick={() => { setArchived(true); setArchiveOpen(false) }} className="rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Archive company</button>
            </div>
          </div>
        </div>
      )}

      {/* at-a-glance stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <MembershipStat c={c} />
        <MiniStat label="Customer since" value={c.since.slice(-4)} sub={c.since} />
        <MiniStat label="Open jobs" value={c.jobPosting ? activeJobs : '—'} sub={c.jobPosting ? `${jobs.length} total` : 'No Job Posting'} />
        <MiniStat label="Team" value={`${team.length}/${MAX_SEATS}`} sub="seats used" tone={full ? 'warn' : undefined} />
        <MiniStat label="Job quota" value={c.jobPosting ? `${c.jobLeft}/${c.jobTotal}` : '—'} sub={c.jobPosting ? 'slots left' : 'n/a'} tone={c.jobPosting && c.jobLeft / c.jobTotal < 0.3 ? 'warn' : undefined} />
        <MiniStat label="CV unlocks" value={c.resumeSearch ? `${c.cvLeft}/${c.cvTotal}` : '—'} sub={c.resumeSearch ? 'left' : 'n/a'} tone={c.resumeSearch && c.cvLeft / c.cvTotal < 0.3 ? 'warn' : undefined} />
        <MiniStat label="Sales owner" value={<span className="text-[12.5px]">{c.owner.split(' ').slice(-2).join(' ')}</span>} sub="from CRM" />
      </div>

      <CoTabBar tabs={tabs} active={tab} onSelect={setTab} />

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {/* Overview = who they are (left, narrow) + what we have done with them
          (right, wide). Products & quota and Team are NOT repeated here — they own
          the "Products & billing" and "Users" tabs. Activities is the primary
          section: it is what a rep actually opens this record for. */}
      {tab === 'Overview' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <div className="min-w-0 space-y-4">
            {/* Mirrors the New-company form field-for-field, in the same order, so a
                rep never wonders where something they typed went. */}
            <DetailCard
              title="Basic info — from CRM"
              action={
                editInfo
                  ? (
                    <span className="flex items-center gap-1.5">
                      <button onClick={() => setEditInfo(false)} className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-muted hover:border-ink/40">Cancel</button>
                      <button onClick={() => setEditInfo(false)} className="rounded-md bg-brand px-2 py-0.5 text-[11px] font-semibold text-white hover:opacity-90">Save</button>
                    </span>
                  )
                  : ro ? undefined : <button onClick={() => setEditInfo(true)} className="text-[11px] text-brand hover:underline">Edit</button>
              }
            >
              {/* Company ID is system-assigned, so it is never editable — everything
                  below it is. Editing happens in place: one Edit toggle turns the whole
                  card into fields, rather than 14 pencil icons. */}
              <KV label="Company ID" value={companyId(coKey(c))} />
              {editInfo ? (
                <>
                  <EField label="Legal name" value={c.legalName} onChange={() => {}} />
                  <EField label="Short name" value={c.shortName} onChange={() => {}} hint="Empty falls back to the legal name." />
                  <EField label="Tax code (MST)" value={c.tax} onChange={() => {}} />
                  <SelectRow label="Công ty mẹ" value={c.parent ?? ''} onChange={() => {}} options={COMPANIES.filter((x) => x.name !== c.name).map((x) => x.name)} placeholder="— không thuộc tập đoàn nào —" hint="Full legal names, because two companies can share a short name. Pick the DIRECT parent. Leave empty for a standalone company or a group root." />
                  <SelectRow label="Industry" value={c.industry} onChange={() => {}} options={MD_DOMAINS.find((d) => d.key === 'industry')?.entries ?? []} />
                  <SelectRow label="Company size" value={c.size} onChange={() => {}} options={['1–9', '10–49', '50–200', '200–500', '500–1000', '1000–5000', '5000+']} />
                </>
              ) : (
                <>
                  <KV label="Legal name" value={c.legalName} />
                  <KV label="Short name" value={c.shortName?.trim() || '— (falls back to the legal name)'} />
                  <KV label="Tax code (MST)" value={c.tax} />
                  <KV label="Công ty mẹ" value={c.parent ? coLabel(coByName(c.parent)!) : '— (không thuộc tập đoàn nào)'} />
                  {/* Split: industry and size are two different facts, filtered separately. */}
                  <KV label="Industry" value={c.industry} />
                  <KV label="Company size" value={`${c.size} staff`} />
                </>
              )}
              {/* Editorial labels sit with the other classification fields rather than in
                  their own card — one company identity block, not two. */}
              <div className="border-b border-line-soft py-2">
                <p className="text-[10.5px] uppercase tracking-wide text-faint">Company tags</p>
                <div className="mt-1"><CompanyTagPicker initial={['Korean company']} /></div>
              </div>
              {/* Same rule as the create form: country always, Vietnamese province
                  only for a Vietnamese company, Address for everyone. */}
              {editInfo ? (
                <>
                  <SelectRow label="Quốc tịch / Country" value={c.country} onChange={() => {}} options={MD_DOMAINS.find((d) => d.key === 'country')?.entries ?? []} />
                  {isVNCompany(c) && <SelectRow label="Tỉnh / Thành phố · City" value={coCity(c)} onChange={() => {}} options={MD_DOMAINS.find((d) => d.key === 'locations')?.groups?.[0]?.items ?? []} />}
                  <EField label="Address" value={c.address} onChange={() => {}} hint="Prints on quotations, orders and invoices." />
                  <EField label="Website" value={c.domain} onChange={() => {}} mono />
                  <SelectRow label="Lead source" value={coLeadSource(c)} onChange={() => {}} options={LEAD_SOURCES} />
                  <SelectRow label="Sales owner" value={c.owner} onChange={() => {}} options={[...new Set(COMPANIES.map((x) => x.owner))]} />
                </>
              ) : (
                <>
                  <KV label="Quốc tịch / Country" value={c.country} />
                  {isVNCompany(c)
                    ? <KV label="Tỉnh / Thành phố · City" value={coCity(c)} />
                    : <KV label="Tỉnh / Thành phố · City" value="— (không phải công ty Việt Nam · xem Address)" />}
                  <KV label="Address" value={c.address} />
                  <KV label="Website" value={c.domain} link />
                  <KV label="Lead source" value={coLeadSource(c)} />
                  <KV label="Sales owner" value={c.owner} />
                </>
              )}
              {/* Captured on the New-company form as pre-sale INTENT. Kept here so it does
                  not vanish after creation — what they actually bought lives on the
                  Products & billing tab, which is a different fact. */}
              <div className="border-b border-line-soft py-2">
                <p className="text-[10.5px] uppercase tracking-wide text-faint">Products interested</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {!c.jobPosting && !c.resumeSearch && <span className="text-[12px] text-faint">— not recorded</span>}
                  {c.jobPosting && <span className="rounded border border-brand/30 bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">Job Posting</span>}
                  {c.resumeSearch && <span className="rounded border border-brand/30 bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">Resume Search</span>}
                </div>
              </div>
              {editInfo
                ? <><EField label="Estimated deal value (₫)" value={String(coValue(c))} onChange={() => {}} /><EField label="Description" value={c.note} onChange={() => {}} /></>
                : <><KV label="Estimated deal value" value={vnd(coValue(c))} /><KV label="Description" value={c.note} /></>}
              {/* Contact person / email / phone deliberately NOT here — they live on the
                  Contacts tab, where a company can have several with their own statuses.
                  Duplicating the primary one here guarantees the two drift apart. */}
            </DetailCard>
            <CompanyDocs c={c} />
            <OwnerHistory c={c} />
            <AffiliatedCompanies c={c} onOpen={onOpen} />
          </div>

          {/* activity composer + full trail — the key section, so it gets the wider side */}
          <CompanyActivities c={c} />
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────────────────── */}
      {/* ── Contacts — people we do business with (may have no login) ────── */}
      {tab === 'Contacts' && (
        <div>
          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">Contact people <span className="font-normal text-muted">— who we do business with</span></p>
                <p className="text-[11px] text-faint">Owned by Sales. A contact does not need a login, and is never created from one.</p>
              </div>
              {!ro && <button onClick={() => setAddingContact(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Add contact</button>}
            </div>
            {/* No Actions column: the name is the link and every action lives in the
                contact panel, so the row stays scannable and the note gets the width. */}
            {/* Every field the Add-contact form captures has a column here: name,
                role flags, title, email, PHONE, status and note. A field worth
                asking for is a field worth showing — otherwise the rep types a
                phone number and then has to open the record to read it back. */}
            <Table
              minW={1320}
              cols={[
                { label: 'Contact', w: '1.4fr' },
                { label: 'Title', w: '1.1fr' },
                { label: 'Email', w: '1.4fr' },
                { label: 'Phone', w: '0.9fr' },
                { label: 'Status', w: '1fr' },
                { label: 'Has login?', w: '0.7fr' },
                { label: 'Note', w: '1.8fr' },
              ]}
              rows={companyContacts(c).map((p) => [
                <button onClick={() => setContactOpen(p)} className="block min-w-0 max-w-full text-left">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium text-brand hover:underline">{p.name}</span>
                    {p.primary && <span className="shrink-0 rounded border border-brand/30 bg-brand-soft px-1 py-0.5 text-[9.5px] font-semibold text-brand">PRIMARY</span>}
                    {p.billing && <span className="shrink-0 rounded border border-line bg-canvas px-1 py-0.5 text-[9.5px] font-semibold text-muted" title="Receives quotations & invoices">BILLING</span>}
                    {p.decisionMaker && <span className="shrink-0 text-[10px] text-faint" title="Decision maker">◆</span>}
                  </span>
                </button>,
                <span className="truncate text-[11.5px] text-muted">{p.title}</span>,
                <span className="truncate font-mono text-[11px] text-muted" title={p.email}>{p.email}</span>,
                <span className="truncate font-mono text-[11px] text-muted">{p.phone}</span>,
                <span title={CONTACT_STATUS[p.status].hint}><Pill tone={CONTACT_STATUS[p.status].tone}>{p.status}</Pill></span>,
                p.linkedUser
                  ? <span className="text-[11px] text-emerald-700">linked</span>
                  : <span className="text-[11px] text-faint">no login</span>,
                <span className="truncate text-[11.5px] text-muted" title={p.note}>{p.note}</span>,
              ])}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              Click a name to open the contact — every action (edit, change status, invite as user, find successor) lives there. Five statuses, each one an instruction: <b>Active</b> contact normally · <b>Needs verifying</b> fix the details first · <b>Paused</b> wait until the resume date · <b>No longer here</b> find the successor · <b>Do not contact</b> no outreach at all. Exactly one contact is <b>PRIMARY</b> (quotations) and one is <b>BILLING</b> (invoices) — often two different people.
            </p>
          </div>

          <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
            Contacts and <b>Users</b> are <b>independent lists</b>. A contact can exist with no login (the accountant who only receives invoices); a user can exist with no contact record (an HR Specialist the customer invited themselves). Where they are the same human the rows are <b>linked</b> — but neither list is generated from the other, and deleting one never touches the other.
          </p>
        </div>
      )}

      {/* ── Users — logins on the Company site (the account's 4 seats) ────── */}
      {tab === 'Users' && (
        <div>
          <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">Login users <span className="font-normal text-muted">— who can sign in to the Company site</span></p>
              <p className="text-[11px] text-faint">Owned by the customer’s HR Manager. Consumes a seat; may be someone Sales never met.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn('text-[11px] font-medium', full ? 'text-amber-700' : 'text-faint')}>{team.length}/{MAX_SEATS} seats</span>
              {!ro && <button onClick={() => setInviting(true)} disabled={full} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">+ Invite user</button>}
            </div>
          </div>
          {noProducts && <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">Subscription expired — logins remain but are read-only until the account is renewed.</p>}
          <Table
            cols={[{ label: 'User', w: '1.6fr' }, { label: 'Role', w: '1fr' }, { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.5fr', align: 'r' }]}
            rows={team.map((u) => [
              <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p><p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p></div>,
              <Pill tone={u.role === 'Admin' ? 'neutral' : 'draft'}>{u.role}</Pill>,
              <Pill tone={u.status === 'Active' ? 'active' : 'pending'}>{u.status}</Pill>,
              <span className="text-[11.5px] text-muted">{u.last}</span>,
              // Managing another rep's customer's logins is a write, so the whole
              // Actions cell collapses to "—" rather than showing dead buttons.
              ro
                ? <span className="text-[11px] text-faint" title={RO_HINT}>—</span>
                : u.status === 'Invited'
                ? <><RowAction tone="brand">Resend</RowAction><RowAction tone="rose">Cancel</RowAction></>
                : u.role === 'Admin'
                  ? <RowAction>Change role</RowAction>
                  : <><RowAction>Change role</RowAction><RowAction tone="rose">Disable</RowAction></>,
            ])}
          />
          <p className="mt-2 text-[11px] leading-relaxed text-faint">Each user is assigned a role. Remove = disable (never hard-delete) — the last Admin can’t be disabled; assign Admin to someone else first. A self-signup requesting to join appears here for the Admin to approve.</p>
          <CoRoleBuilder />
          </div>
          <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
            A seat is a <b>login</b>, not a relationship. Someone here may never appear under <b>Contacts</b> (the customer invited them without telling us), and a contact may never need a seat. Rows for the same human are <b>linked</b> in both directions.
          </p>
        </div>
      )}

      {/* ── Products & billing ───────────────────────────────────────────── */}
      {tab === 'Products & billing' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <DetailCard title="Products & quota">
            <ProductsQuota c={c} />
          </DetailCard>
          {/* Manual services sit next to the metered quota, not inside it: the
              numbers look the same to a reader, but one is observed and the other
              is asserted by a person. */}
          <ServiceUsageCard c={c} />
          {/* PO history, not "billing history": the PO is the document a rep and a
              customer both refer to, and one row per PO is one row per thing that
              was actually bought. Order / Invoice / Payment as three separate rows
              was one purchase told three times.
              No STATUS column — a PO only reaches this list once it is invoiced, so
              every row had the same value. The invoice DATE is the useful fact, and
              it doubles as "has it been invoiced yet". */}
          <DetailCard title="PO history">
            {poHistory(c).length === 0 ? (
              <p className="text-[12px] text-muted">Chưa có PO nào. PO xuất hiện ở đây ngay khi Sales phát hành đơn hàng từ báo giá khách đã chốt.</p>
            ) : (
              <Table
                cols={[
                  { label: 'PO', w: '1.2fr' },
                  { label: 'Sản phẩm trong PO', w: '1.8fr' },
                  { label: 'Giá trị', w: '1fr', align: 'r' },
                  { label: 'Ngày xuất hoá đơn', w: '1.1fr', align: 'r' },
                ]}
                rows={poHistory(c).map((o) => [
                  <span className="truncate font-mono text-[11.5px] text-brand">{o.po}</span>,
                  <span className="truncate text-muted" title={o.products}>{o.products}</span>,
                  <span className="tabular-nums">{o.amount}</span>,
                  o.invoiced
                    ? <span className="tabular-nums text-muted">{o.invoiced}</span>
                    : <span className="text-[10.5px] text-amber-600">chưa xuất</span>,
                ])}
              />
            )}
            <p className="mt-2 text-[11px] text-faint">Every entitlement traces back to a paid PO — provisioned automatically when the VAT invoice is issued, never picked by hand.</p>
          </DetailCard>
        </div>
      )}

      {/* ── Company page ─────────────────────────────────────────────────── */}
      {tab === 'Company page' && (
        <DetailCard
          title="Company detail page (jobseeker)"
          action={c.jobPosting ? <Pill tone={c.hasPage ? 'active' : 'pending'}>{c.hasPage ? 'Published' : 'Draft'}</Pill> : undefined}
        >
          <CompanyPageEditor c={c} />
        </DetailCard>
      )}

      {/* ── Jobs ─────────────────────────────────────────────────────────── */}
      {tab === 'Jobs' && (
        <div>
          {!c.jobPosting ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">
              This account has no Job Posting product — it can’t post jobs. Resume-Search-only customers are invisible to jobseekers.
            </p>
          ) : jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">No jobs posted yet.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11.5px] text-muted"><b className="text-ink">{activeJobs}</b> active · <b className="text-ink">{jobs.length}</b> total — using <b className="text-ink">{c.jobTotal - c.jobLeft}/{c.jobTotal}</b> posting slots</p>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by status</span>
              </div>
              <Table
                cols={[{ label: 'Job title', w: '2fr' }, { label: 'Status', w: '1.1fr' }, { label: 'Applicants', w: '0.9fr', align: 'r' }, { label: 'Deadline', w: '1fr', align: 'r' }, { label: 'Actions', w: '1fr', align: 'r' }]}
                rows={jobs.map((j) => [
                  <div className="min-w-0"><p className="truncate font-medium text-ink">{j.title}</p><p className="text-[11px] text-faint">Posted {j.posted}</p></div>,
                  <Pill tone={j.status}>{j.statusLabel}</Pill>,
                  <span className="tabular-nums">{j.applicants || '—'}</span>,
                  <span className="tabular-nums text-muted">{j.deadline}</span>,
                  <RowAction>View</RowAction>,
                ])}
              />
              <p className="mt-2 text-[11px] text-faint">Jobs this account posted (HQ oversight). Company posts go live directly — manage them from Recruitment → Jobs.</p>
            </>
          )}
        </div>
      )}

      {/* ── Applications (employer view, mirrored for HQ) ─────────────────── */}
      {tab === 'Applications' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">Applications received across this account’s jobs — <b className="text-ink">the same list the company sees on their site</b>.</p>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by job / stage</span>
          </div>
          <Table
            cols={[{ label: 'Candidate', w: '1.4fr' }, { label: 'Applied to', w: '1.8fr' }, { label: 'Stage', w: '1fr' }, { label: 'Applied', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1fr', align: 'r' }]}
            rows={companyApplicants(c).map((a) => [
              <span className="truncate font-medium text-ink">{a.name}</span>,
              <span className="truncate text-muted">{a.job}</span>,
              <Pill tone={a.tone}>{a.stage}</Pill>,
              <span className="text-[11.5px] text-muted">{a.applied}</span>,
              <RowAction>View CV</RowAction>,
            ])}
          />
          <p className="mt-2 text-[11px] text-faint">Read-only for HQ — HQ never moves a company’s candidates through their pipeline, and opening a candidate’s CV is written to the audit log.</p>
        </div>
      )}

      {/* ── Resumes (CV unlocks) ─────────────────────────────────────────── */}
      {tab === 'Resumes' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">CVs this account <b className="text-ink">unlocked from Resume Search</b> — the same list the employer sees on their site. Uses <b className="text-ink">{c.cvTotal - c.cvLeft}/{c.cvTotal}</b> unlocks.</p>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by user</span>
          </div>
          <Table
            cols={[{ label: 'Candidate', w: '1.3fr' }, { label: 'Headline', w: '1.8fr' }, { label: 'Unlocked by', w: '1fr' }, { label: 'When', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '0.9fr', align: 'r' }]}
            rows={companyResumeViews(c).map((r) => [
              <span className="truncate font-medium text-ink">{r.name}</span>,
              <span className="truncate text-muted">{r.headline}</span>,
              <span className="truncate text-[11.5px]">{r.by}</span>,
              <span className="text-[11.5px] text-muted">{r.when}</span>,
              <RowAction>Open CV</RowAction>,
            ])}
          />
          <p className="mt-2 text-[11px] text-faint">Each unlock spends 1 from the pooled CV-unlock quota and is written to the immutable audit log.</p>
        </div>
      )}

      {/* ── Activities (log chat / call + timeline) ──────────────────────── */}

      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {contactOpen && <ContactDetail p={contactOpen} c={c} onClose={() => setContactOpen(null)} />}
      {addingContact && <AddContactModal c={c} onClose={() => setAddingContact(false)} />}
      {quoting && <NewQuotationModal company={c.name} onClose={() => setQuoting(false)} />}
    </div>
    </ReadOnlyCtx.Provider>
  )
}

type CUser = { name: string; email: string; company: string; role: CoUserRole; status: 'Active' | 'Invited' | 'Disabled'; last: string }
const CUSERS: CUser[] = [
  { name: 'Vũ Thanh Linh', email: 'linh@vanphat.vn', company: 'Cty Vạn Phát', role: 'Admin', status: 'Active', last: '10m ago' },
  { name: 'Đỗ Thị Mai', email: 'mai@vanphat.vn', company: 'Cty Vạn Phát', role: 'Recruiter', status: 'Active', last: '2h ago' },
  { name: 'Lý Văn Giang', email: 'giang@fpt.com.vn', company: 'FPT Software', role: 'Admin', status: 'Active', last: '1d ago' },
  { name: 'Ngô Minh Tú', email: 'tu@fpt.com.vn', company: 'FPT Software', role: 'Viewer', status: 'Invited', last: '—' },
  { name: 'Bùi Thu Hằng', email: 'hang@tiki.vn', company: 'Tiki', role: 'Recruiter', status: 'Disabled', last: '3 months ago' },
]

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState('Recruiter')
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Invite user</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <LField label="Company (account)" value="Cty Vạn Phát" select />
          <LField label="Email" req value="new.hr@vanphat.vn" />
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Role <span className="text-rose-500">*</span></p>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
              {CO_ROLE_DEFS.map((r) => <option key={r.name} value={r.name}>{r.name}{r.admin ? ' (account owner)' : ''}</option>)}
            </select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">Pick one of the account’s roles. Roles are built on the <b className="text-ink/70">Roles</b> screen; “Admin” grants account administration and every account keeps at least one.</p>
            <CoRolePermsView role={role} />
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span></span><span>We email an invite link. The person <b>sets their own password</b> — no one types it for them.</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Send invite</button>
        </div>
      </div>
    </div>
  )
}

function ChangeRoleModal({ user, users, onConfirm, onClose }: { user: CUser; users: CUser[]; onConfirm: (role: CoUserRole) => void; onClose: () => void }) {
  const [target, setTarget] = useState<CoUserRole>(user.role)
  const admins = users.filter((u) => u.company === user.company && u.role === 'Admin' && u.status !== 'Disabled')
  const lastAdmin = user.role === 'Admin' && admins.length <= 1
  const blocked = lastAdmin && target !== 'Admin'
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Change role — {user.name}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-[12px] text-muted">Pick the role for this user. <b className="text-ink/80">No email/login changes</b> — only their access changes.</p>
          <div className="space-y-1.5">
            {CO_ROLE_DEFS.map((r) => (
              <button key={r.name} onClick={() => setTarget(r.name as CoUserRole)} className={cn('flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left', target === r.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
                <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', target === r.name ? 'border-brand' : 'border-line')}>{target === r.name && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                <span className="min-w-0"><span className="block truncate text-[12.5px] font-medium text-ink">{r.name}{r.admin ? ' · account owner' : ''}</span><span className="block truncate text-[10.5px] text-faint">{r.admin ? 'everything + manage users & roles' : r.perms.length + ' permissions'}</span></span>
              </button>
            ))}
          </div>
          {blocked && <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span></span><span>This is the account’s <b>last Admin</b>. Assign Admin to another user before downgrading this one.</span></p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => !blocked && onConfirm(target)} disabled={blocked} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Save role</button>
        </div>
      </div>
    </div>
  )
}

/* HQ-only: move a user from one company to another. One email = one employer login
   = one company at a time, so a move is detach-then-attach (login never changes).
   Blocked if the user is the sole Admin of their current company. */
function MoveUserModal({ user, users, onConfirm, onClose }: { user: CUser; users: CUser[]; onConfirm: (toCompany: string, role: CoUserRole) => void; onClose: () => void }) {
  const admins = users.filter((u) => u.company === user.company && u.role === 'Admin' && u.status !== 'Disabled')
  const soleAdmin = user.role === 'Admin' && admins.length <= 1
  const targets = Array.from(new Set(COMPANIES.map((c) => (c.shortName?.trim() || c.name)))).filter((n) => n !== user.company)
  const [toCompany, setToCompany] = useState(targets[0] ?? '')
  const [role, setRole] = useState<CoUserRole>('Recruiter')
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Move user — {user.name}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          {soleAdmin ? (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span>⚠️</span><span>{user.name} is the <b>sole Admin</b> of {user.company}. Assign another Admin there first — a company can’t be left without one.</span></p>
          ) : (
            <>
              <p className="text-[12px] text-muted">Move this login into another company. <b className="text-ink/80">The email &amp; password never change</b> — only which company they’re in and their role there.</p>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">From</p>
                <div className="rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[12.5px] text-ink">{user.company}</div>
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">To company <span className="text-rose-500">*</span></p>
                <select value={toCompany} onChange={(e) => setToCompany(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {targets.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Role in that company <span className="text-rose-500">*</span></p>
                <select value={role} onChange={(e) => setRole(e.target.value as CoUserRole)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {CO_ROLE_DEFS.map((r) => <option key={r.name} value={r.name}>{r.name}{r.admin ? ' (account owner)' : ''}</option>)}
                </select>
              </div>
              <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>📝</span><span>This is an HQ action and is written to the audit log (who moved whom, from → to, role).</span></p>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => !soleAdmin && toCompany && onConfirm(toCompany, role)} disabled={soleAdmin || !toCompany} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Move user</button>
        </div>
      </div>
    </div>
  )
}

function AdminCompanyUsers() {
  const [inviting, setInviting] = useState(false)
  const [users, setUsers] = useState<CUser[]>(CUSERS)
  const [changing, setChanging] = useState<CUser | null>(null)
  const [moving, setMoving] = useState<CUser | null>(null)
  const applyRole = (role: CoUserRole) => {
    if (!changing) return
    setUsers((prev) => prev.map((u) => (u.email === changing.email ? { ...u, role } : u)))
    setChanging(null)
  }
  const applyMove = (toCompany: string, role: CoUserRole) => {
    if (!moving) return
    setUsers((prev) => prev.map((u) => (u.email === moving.email ? { ...u, company: toCompany, role } : u)))
    setMoving(null)
  }
  return (
    <div>
      <ListPage
        action={<button onClick={() => setInviting(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ Invite user</button>}
        tabs={[{ label: 'All users', count: 1140, active: true }, { label: 'Active', count: 1020 }, { label: 'Invited', count: 96 }, { label: 'Disabled', count: 24 }]}
        cols={[
          { label: 'User', w: '1.5fr' }, { label: 'Company (account)', w: '1.2fr' }, { label: 'Role', w: '1.1fr' },
          { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.5fr', align: 'r' },
        ]}
        rows={users.map((u) => [
          <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p><p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p></div>,
          <span className="truncate">{u.company}</span>,
          <Pill tone={u.role === 'Admin' ? 'neutral' : 'draft'}>{u.role}</Pill>,
          <Pill tone={u.status === 'Active' ? 'active' : u.status === 'Invited' ? 'pending' : 'expired'}>{u.status}</Pill>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Invited'
              ? <><RowAction tone="brand">Resend</RowAction><RowAction tone="rose">Cancel</RowAction></>
              : u.status === 'Disabled'
                ? <RowAction tone="brand">Re-enable</RowAction>
                : <><button onClick={() => setChanging(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Change role</button><button onClick={() => setMoving(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Move</button>{u.role !== 'Admin' && <RowAction tone="rose">Disable</RowAction>}</>}
          </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">Each user is assigned a role built on the Roles screen. Every account keeps at least one <b>Admin</b> — the last Admin can’t be downgraded or disabled. <b>Move</b> (HQ only) sends a login to another company with a chosen role; the sole Admin of a company can’t be moved out until another Admin is assigned.</p>
      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {changing && <ChangeRoleModal user={changing} users={users} onConfirm={applyRole} onClose={() => setChanging(null)} />}
      {moving && <MoveUserModal user={moving} users={users} onConfirm={applyMove} onClose={() => setMoving(null)} />}
    </div>
  )
}

/* ── User — jobseeker accounts ────────────────────────────────────────────────
 * HQ view of the seeker side of the marketplace (module: Job seeker user
 * management). Accounts are born on the Jobseeker site — email + password or one
 * of the 4 social logins — so HQ's job here is search → inspect → activate /
 * deactivate, never "type someone's password". Sign-up method and email
 * verification are first-class columns because they explain most support cases.
 * -------------------------------------------------------------------------- */
type JSSignup = 'Email' | 'Google' | 'Facebook' | 'LinkedIn' | 'GitHub'
type JSStatus = 'Active' | 'Unverified' | 'Deactivated' | 'Withdrawn'
type JSUser = {
  id: number
  name: string
  email: string
  phone: string
  location: string
  headline: string
  signup: JSSignup
  status: JSStatus
  complete: number
  resumes: number
  applications: number
  joined: string
  last: string
}
const JS_STATUS: Record<JSStatus, StatusTone> = { Active: 'active', Unverified: 'pending', Deactivated: 'expired', Withdrawn: 'rejected' }
const JS_USERS: JSUser[] = [
  { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0903 112 445', location: 'Hồ Chí Minh', headline: 'Frontend Engineer · 4 yrs', signup: 'Email', status: 'Active', complete: 92, resumes: 2, applications: 14, joined: '12/03/2025', last: '10m ago' },
  { id: 2, name: 'Trần Thị Bích', email: 'bich.tran@gmail.com', phone: '0912 668 201', location: 'Hà Nội', headline: 'Digital Marketing · 6 yrs', signup: 'Google', status: 'Active', complete: 78, resumes: 1, applications: 8, joined: '04/01/2026', last: '3h ago' },
  { id: 3, name: 'Lê Hoàng Cường', email: 'cuong.le@outlook.com', phone: '0977 340 118', location: 'Hồ Chí Minh', headline: 'Product Manager · 8 yrs', signup: 'LinkedIn', status: 'Active', complete: 100, resumes: 3, applications: 27, joined: '22/08/2024', last: '1d ago' },
  { id: 4, name: 'Phạm Thu Dung', email: 'dung.pham@gmail.com', phone: '—', location: 'Đà Nẵng', headline: 'Kế toán tổng hợp · 3 yrs', signup: 'Email', status: 'Unverified', complete: 24, resumes: 0, applications: 0, joined: '26/07/2026', last: '—' },
  { id: 5, name: 'Vũ Minh Đức', email: 'duc.vu@gmail.com', phone: '0908 771 903', location: 'Hồ Chí Minh', headline: 'Backend Engineer · 5 yrs', signup: 'Facebook', status: 'Active', complete: 61, resumes: 1, applications: 3, joined: '15/05/2026', last: '2 weeks ago' },
  { id: 6, name: 'Đặng Thu Trang', email: 'trang.dang@gmail.com', phone: '0356 220 447', location: 'Hải Phòng', headline: 'QA Engineer · 2 yrs', signup: 'GitHub', status: 'Deactivated', complete: 46, resumes: 1, applications: 5, joined: '03/02/2025', last: '3 months ago' },
  { id: 7, name: 'Hoàng Bảo Ngọc', email: 'ngoc.hoang@gmail.com', phone: '0938 015 662', location: 'Hà Nội', headline: 'HR Specialist · 3 yrs', signup: 'Email', status: 'Withdrawn', complete: 88, resumes: 0, applications: 11, joined: '19/09/2024', last: '1 month ago' },
]

/** Sign-up channel as a compact chip — email vs one of the 4 social providers. */
function SignupChip({ via }: { via: JSSignup }) {
  const dot: Record<JSSignup, string> = { Email: 'bg-slate-400', Google: 'bg-rose-500', Facebook: 'bg-blue-600', LinkedIn: 'bg-sky-600', GitHub: 'bg-slate-800' }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink/75">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot[via])} />
      {via}
    </span>
  )
}

/** Profile-completeness bar — the number My page shows the seeker. */
function Meter({ pct }: { pct: number }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {/* fixed width, not w-full — the cell is shrink-to-fit, so a percentage width collapses */}
      <span className="h-1.5 w-[58px] shrink-0 overflow-hidden rounded-full bg-line">
        <span className={cn('block h-full rounded-full', pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-400')} style={{ width: `${pct}%` }} />
      </span>
      <span className="shrink-0 text-[11px] tabular-nums text-muted">{pct}%</span>
    </span>
  )
}

function AdminJobseekers() {
  const [users, setUsers] = useState<JSUser[]>(JS_USERS)
  const [detail, setDetail] = useState<JSUser | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const setStatus = (id: number, status: JSStatus) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  const create = (name: string, email: string) => {
    setUsers((prev) => [
      { id: Math.max(0, ...prev.map((u) => u.id)) + 1, name, email, phone: '—', location: '—', headline: '—', signup: 'Email', status: 'Unverified', complete: 10, resumes: 0, applications: 0, joined: '28/07/2026', last: '—' },
      ...prev,
    ])
    setCreating(false)
    setToast(`Set-password link sent to ${email} — the account stays Unverified until they open it.`)
  }

  if (detail) {
    const live = users.find((u) => u.id === detail.id) ?? detail
    return <JobseekerDetail u={live} onBack={() => setDetail(null)} onStatus={(s) => setStatus(live.id, s)} />
  }

  const n = (s: JSStatus) => users.filter((u) => u.status === s).length
  return (
    <div>
      {toast && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Accounts" value="128,412" sub="all time" />
        <MiniStat label="Active" value="121,006" sub="verified + usable" />
        <MiniStat label="Unverified" value="4,318" sub="email not confirmed" tone="warn" />
        <MiniStat label="Deactivated" value="1,942" sub="blocked by HQ" />
        <MiniStat label="Withdrawn" value="1,146" sub="seeker-initiated" />
        <MiniStat label="New this month" value="3,204" sub="▲ 12% vs Jun" />
      </div>

      <ListPage
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New user</button>}
        tabs={[
          { label: 'All', count: users.length, active: true },
          { label: 'Active', count: n('Active') },
          { label: 'Unverified', count: n('Unverified') },
          { label: 'Deactivated', count: n('Deactivated') },
          { label: 'Withdrawn', count: n('Withdrawn') },
        ]}
        minW={1120}
        cols={[
          { label: 'Jobseeker', w: '1.6fr' },
          { label: 'Signed up via', w: '0.9fr' },
          { label: 'Profile', w: '0.9fr' },
          { label: 'CVs', w: '0.5fr', align: 'r' },
          { label: 'Applied', w: '0.6fr', align: 'r' },
          { label: 'Status', w: '0.9fr' },
          { label: 'Joined', w: '0.8fr', align: 'r' },
          { label: 'Last login', w: '0.9fr', align: 'r' },
          { label: 'Actions', w: '1.7fr', align: 'r' },
        ]}
        rows={users.map((u) => [
          <button onClick={() => setDetail(u)} className="min-w-0 text-left">
            <p className="truncate text-[12.5px] font-medium text-brand hover:underline">{u.name}</p>
            <p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p>
          </button>,
          <SignupChip via={u.signup} />,
          <Meter pct={u.complete} />,
          <span className="tabular-nums">{u.resumes || '—'}</span>,
          <span className="tabular-nums font-medium text-brand">{u.applications || '—'}</span>,
          <Pill tone={JS_STATUS[u.status]}>{u.status}</Pill>,
          <span className="tabular-nums text-muted">{u.joined}</span>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Unverified' ? (
              <>
                <button onClick={() => setToast(`Verification email re-sent to ${u.email}.`)} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Resend</button>
                <button onClick={() => setStatus(u.id, 'Active')} title="Demo: simulate the seeker clicking their verification link" className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Simulate verify</button>
              </>
            ) : u.status === 'Deactivated' ? (
              <button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Reactivate</button>
            ) : u.status === 'Withdrawn' ? (
              <span className="text-[10.5px] text-faint">seeker-initiated · restore on request</span>
            ) : (
              <>
                <button onClick={() => setDetail(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">View</button>
                <button onClick={() => setStatus(u.id, 'Deactivated')} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Deactivate</button>
              </>
            )}
          </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Interactive prototype — <b>Simulate verify</b> flips an Unverified row to Active; <b>Deactivate</b> / <b>Reactivate</b> toggle a row. <b>Deactivated</b> is an HQ block (login refused, resumes hidden from Resume Search); <b>Withdrawn</b> is the seeker deactivating their own account from My page. Opening an account or its CV is PII access — always written to the audit log.
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
        Open questions for the client: retention for withdrawn accounts (grace period before hard delete) · whether HQ may create seeker accounts at all · merge policy when the same email arrives by email sign-up and by social login.
      </p>

      {creating && <NewJobseekerModal onCreate={create} onClose={() => setCreating(false)} />}
    </div>
  )
}

function NewJobseekerModal({ onCreate, onClose }: { onCreate: (name: string, email: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const valid = name.trim() && /.+@.+\..+/.test(email)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">New jobseeker user</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
            <span></span><span>The normal path is self sign-up on the Store site. Use this only for support cases (e.g. a seeker who can't complete sign-up) — it does not replace registration.</span>
          </p>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Full name <span className="text-rose-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nguyễn Thị Hà" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Email <span className="text-rose-500">*</span></label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <LField label="Phone" value="optional — seeker completes it on My page" />
          <LField label="Location" value="Hồ Chí Minh" select hint="From Master data → Locations. Everything else (headline, CV, job preferences) is filled in by the seeker." />
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand">
            <span></span><span>We email a set-password link. The seeker <b>sets their own password</b> — no one types it for them. The account stays <b>Unverified</b> until they open the link, then flips to <b>Active</b>.</span>
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => valid && onCreate(name.trim(), email.trim())} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Create &amp; send link</button>
        </div>
      </div>
    </div>
  )
}

/** One seeker account — what My page holds, plus their CVs and applications. */
function JobseekerDetail({ u, onBack, onStatus }: { u: JSUser; onBack: () => void; onStatus: (s: JSStatus) => void }) {
  useDetailCrumb(u.name, onBack)
  const CVS: [string, 'public' | 'private', string, number][] = [
    ['CV_NguyenVanAn_Frontend_EN.pdf', 'public', 'Updated 2 days ago', 6],
    ['CV tiếng Việt — Frontend', 'private', 'Updated 3 weeks ago', 0],
  ]
  const APPS: [string, string, StatusTone, string, string][] = [
    ['Senior Frontend Engineer (ReactJS)', 'FPT Software', 'pending', 'Interview', '2h ago'],
    ['Product Manager', 'MoMo', 'neutral', 'Screening', '5d ago'],
    ['Backend Engineer (Go)', 'Shopee', 'rejected', 'Rejected', '2 months ago'],
  ]
  return (
    <div className="max-w-[960px]">

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">{u.name} <Pill tone={JS_STATUS[u.status]}>{u.status}</Pill></h2>
          <p className="text-[11.5px] text-muted">{u.headline} · {u.location} · <span className="font-mono">{u.email}</span></p>
        </div>
        <div className="flex shrink-0 gap-2">
          {u.status === 'Unverified' && <button className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Resend verification</button>}
          {u.status === 'Deactivated' || u.status === 'Withdrawn'
            ? <button onClick={() => onStatus('Active')} className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Reactivate</button>
            : <button onClick={() => onStatus('Deactivated')} className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12.5px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Deactivate</button>}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Profile" value={`${u.complete}%`} sub="completeness" tone={u.complete < 50 ? 'warn' : undefined} />
        <MiniStat label="CVs" value={u.resumes || '—'} sub={`${CVS.filter((c) => c[1] === 'public').length} public`} />
        <MiniStat label="Applications" value={u.applications || '—'} sub="all time" />
        <MiniStat label="CV unlocks" value="6" sub="by employers" />
        <MiniStat label="Joined" value={u.joined} sub={`via ${u.signup}`} />
        <MiniStat label="Last login" value={u.last} sub="web · Chrome" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Account">
          <KV label="Full name" value={u.name} />
          <KV label="Email (login)" value={u.email} />
          <KV label="Email verified" value={u.status === 'Unverified' ? 'No — verification pending' : 'Yes'} />
          <KV label="Sign-up method" value={u.signup === 'Email' ? 'Email + password' : `${u.signup} (social login)`} />
          <KV label="Phone" value={u.phone} />
          <KV label="Location" value={u.location} />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            HQ never sees or sets a password. Password reset is a self-service email link; social-login accounts have no password at all.
          </p>
        </DetailCard>

        <DetailCard title="My page — profile & job preferences">
          <div className="mb-2"><Meter pct={u.complete} /></div>
          <KV label="Headline" value={u.headline} />
          <KV label="Desired role" value="Software Developer · IT" />
          <KV label="Work type" value="In office" />
            <KV label="Contract type" value="Fulltime" />
          <KV label="Expected salary" value="35 – 45 tr VND / month" />
          <KV label="Preferred locations" value="Hồ Chí Minh · Remote" />
          <KV label="Open to offers" value="Yes — visible in Resume Search" />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            Read-only for HQ. The seeker edits these on My page; the vocabularies come from Master data.
          </p>
        </DetailCard>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[12.5px] font-bold">CVs / resumes</p>
        <Table
          minW={640}
          cols={[{ label: 'CV', w: '2fr' }, { label: 'Visibility', w: '0.9fr' }, { label: 'Updated', w: '1fr' }, { label: 'Unlocked by', w: '0.9fr', align: 'r' }, { label: '', w: '0.7fr', align: 'r' }]}
          rows={CVS.map((c) => [
            <span className="truncate text-[12.5px] text-ink/85">{c[0]}</span>,
            <Pill tone={c[1] === 'public' ? 'active' : 'draft'}>{c[1] === 'public' ? 'Public' : 'Private'}</Pill>,
            <span className="text-[11.5px] text-muted">{c[2]}</span>,
            <span className="tabular-nums">{c[3] ? `${c[3]} employers` : '—'}</span>,
            <RowAction>Open CV</RowAction>,
          ])}
        />
        <p className="mt-2 text-[11px] text-faint">Opening a CV is a PII view — logged with the operator, the record and the timestamp. Private CVs never appear in Resume Search.</p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[12.5px] font-bold">Applications</p>
        <Table
          minW={640}
          cols={[{ label: 'Job', w: '1.9fr' }, { label: 'Company', w: '1fr' }, { label: 'Stage', w: '0.9fr' }, { label: 'Applied', w: '0.8fr', align: 'r' }]}
          rows={APPS.map((a) => [
            <span className="truncate text-[12.5px] text-ink/85">{a[0]}</span>,
            <span className="truncate">{a[1]}</span>,
            <Pill tone={a[2]}>{a[3]}</Pill>,
            <span className="text-[11.5px] text-muted">{a[4]}</span>,
          ])}
        />
        <p className="mt-2 text-[11px] text-faint">Read-only mirror of what the seeker sees under “Applied jobs” — HQ never moves a candidate's stage; that is the employer's call.</p>
      </div>
    </div>
  )
}

/* ── Content ──────────────────────────────────────────────────────────────── */
/* A BANNER is an instance of a Placement product: one company's creative, running
   on one slot, for a period. The product says what a hero banner costs and how big
   it is; this record is the thing that actually goes live.

   Status mirrors Jobs exactly — Draft → Schedule → Open → Expired, driven by the
   publish action and the dates, never typed. Exposure is SEPARATE, as on a job: an
   Open banner can be pulled off screen without ending its booking. */
type BannerStatus = 'Draft' | 'Schedule' | 'Open' | 'Expired'
const BANNER_TONE: Record<BannerStatus, StatusTone> = {
  Draft: 'draft',
  Schedule: 'schedule',
  Open: 'open',
  Expired: 'closed',
}
type Banner = {
  id: string
  name: string
  /* Sold — bought by a customer, backed by a paid PO line.
     House — Saramin VN's own promotion. No company, no PO, no product. */
  source: 'Sold' | 'House'
  sku: string
  company: string
  start: string
  end: string
  status: BannerStatus
  exposure: 'On' | 'Off'
  clicks: string
  creative: string | null
}
const BANNERS: Banner[] = [
  { id: 'BN-1042', name: 'Hero — Tết 2026 campaign', source: 'Sold', sku: 'PLC-HOMEHERO', company: 'FPT Software', start: '01/01/2026', end: '15/02/2026', status: 'Expired', exposure: 'Off', clicks: '12,480', creative: 'tet2026-hero-1536x371.jpg' },
  { id: 'BN-1051', name: 'Hero — Tuyển dụng Q3', source: 'Sold', sku: 'PLC-HOMEHERO', company: 'Công ty Vạn Phát', start: '01/08/2026', end: '08/08/2026', status: 'Open', exposure: 'On', clicks: '3,190', creative: 'vanphat-hero-1536x371.jpg' },
  { id: 'BN-1052', name: 'Adsense — IT jobs', source: 'Sold', sku: 'PLC-ADS-HOME', company: 'Tiki', start: '10/08/2026', end: '17/08/2026', status: 'Schedule', exposure: 'Off', clicks: '—', creative: 'tiki-ads-1260x120.jpg' },
  { id: 'BN-1053', name: 'Hero — Employer promo', source: 'Sold', sku: 'PLC-HOMEHERO', company: 'MoMo', start: '—', end: '—', status: 'Draft', exposure: 'Off', clicks: '—', creative: null },
  { id: 'BN-1054', name: 'Adsense — Search, Shopee', source: 'Sold', sku: 'PLC-ADS-SEARCH', company: 'Shopee', start: '05/08/2026', end: '12/08/2026', status: 'Open', exposure: 'Off', clicks: '840', creative: 'shopee-search-425x160.jpg' },
  { id: 'BN-1060', name: 'Tuyển dụng nội bộ — Saramin VN', source: 'House', sku: 'PLC-HOMEHERO', company: 'Saramin VN', start: '01/08/2026', end: '31/08/2026', status: 'Open', exposure: 'On', clicks: '2,410', creative: 'saramin-hiring-1536x371.jpg' },
  { id: 'BN-1061', name: 'Thông báo bảo trì hệ thống', source: 'House', sku: 'PLC-ADS-HOME', company: 'Saramin VN', start: '20/08/2026', end: '22/08/2026', status: 'Schedule', exposure: 'Off', clicks: '—', creative: 'maintenance-1260x120.jpg' },
]

function AdminBanners() {
  const [fStatus, setFStatus] = useState('')
  const [fSource, setFSource] = useState('')
  const [edit, setEdit] = useState<Banner | null>(null)
  const [creating, setCreating] = useState(false)

  const rows = BANNERS.filter((b) => (!fStatus || b.status === fStatus) && (!fSource || b.source === fSource))
  const slotOf = (sku: string) => CATALOG.find((c) => c.sku === sku)?.name ?? sku

  return (
    <div>
      <ListPage
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

/* Publish a banner. Two decisions only, as asked: WHEN it starts and WHAT runs.
   Everything else is read from the placement product — size, duration, the slot's
   rotation cap — because those were fixed when the product was sold. */
/* Placement lines that have actually been BOUGHT. A banner cannot be published
   from the catalogue — only from a paid order line — which is the module's own
   invariant applied to this screen: nothing is entitled without a paid order.

   `qty` is what the customer bought, `used` is how many bookings already exist
   against that line. A line with none left cannot be chosen again. */
type PoPlacementLine = { sku: string; qty: number; used: number }
type PlacementPo = { po: string; invoiced: string | null; lines: PoPlacementLine[] }
const PLACEMENT_POS: Record<string, PlacementPo[]> = {
  'Công ty TNHH Vạn Phát': [
    { po: 'PO-005812-07-2026', invoiced: '26/05/2026', lines: [{ sku: 'PLC-HOMEHERO', qty: 2, used: 1 }, { sku: 'PLC-TOPCOMPANY', qty: 1, used: 0 }, { sku: 'PLC-POPUP', qty: 2, used: 1 }] },
    { po: 'PO-005940-08-2026', invoiced: null, lines: [{ sku: 'PLC-HOMEHERO', qty: 1, used: 0 }] },
  ],
  'FPT Software': [
    { po: 'PO-005601-06-2026', invoiced: '15/06/2026', lines: [{ sku: 'PLC-HOMEHERO', qty: 1, used: 1 }] },
  ],
  'Tiki': [
    { po: 'PO-005733-07-2026', invoiced: '01/07/2026', lines: [{ sku: 'PLC-ADS-HOME', qty: 3, used: 1 }] },
  ],
  'MoMo': [
    { po: 'PO-005888-07-2026', invoiced: '18/07/2026', lines: [{ sku: 'PLC-HOMEHERO', qty: 1, used: 0 }] },
  ],
  'Shopee': [
    { po: 'PO-005777-08-2026', invoiced: '05/08/2026', lines: [{ sku: 'PLC-ADS-SEARCH', qty: 2, used: 1 }] },
  ],
}

/* Publish a banner. The chain is COMPANY → PO → PRODUCT, then the two decisions
   that are actually this screen's: when it starts, and what runs.

   Starting from the company rather than the placement is what keeps a banner
   attached to something the customer paid for. Picking a placement first would let
   an operator publish a hero banner nobody bought and only discover it at invoice
   reconciliation, which is the wrong end of the process to find it. */
function PublishBannerModal({ banner, onClose }: { banner: Banner | null; onClose: () => void }) {
  const editing = Boolean(banner)
  /* House banners are Saramin VN's own promotion: no customer, no PO, no product
     line to spend. They still occupy a rotation slot, so they are a booking like
     any other — only the money side is absent. */
  const [source, setSource] = useState<'Sold' | 'House'>(banner?.source ?? 'Sold')
  const house = source === 'House'
  const [houseEnd, setHouseEnd] = useState(banner?.source === 'House' ? banner.end : '')
  const [purpose, setPurpose] = useState('')
  const [name, setName] = useState(banner?.name ?? '')
  const [exposure, setExposure] = useState<'On' | 'Off'>(banner?.exposure ?? 'On')
  const [company, setCompany] = useState(banner?.company ?? '')
  const [po, setPo] = useState('')
  const [sku, setSku] = useState(banner?.sku ?? '')
  const [start, setStart] = useState(banner?.start === '—' ? '' : banner?.start ?? '')
  const [file, setFile] = useState<string | null>(banner?.creative ?? null)

  const companies = Object.keys(PLACEMENT_POS)
  const pos = PLACEMENT_POS[company] ?? []
  const chosenPo = pos.find((x) => x.po === po)
  const lines = chosenPo?.lines ?? []

  const product = CATALOG.find((c) => c.sku === sku)
  const slot = PLACEMENTS.find((x) =>
    (sku === 'PLC-HOMEHERO' && x.id === 'home-hero') ||
    (sku === 'PLC-ADS-HOME' && x.id === 'home-adsense') ||
    (sku === 'PLC-ADS-SEARCH' && x.id === 'search-adsense') ||
    (sku === 'PLC-TOPCOMPANY' && x.id === 'home-top-co') ||
    (sku === 'PLC-FEATURECO' && x.id === 'home-feature-co') ||
    (sku === 'PLC-SEARCH-HLCO' && x.id === 'search-highlight-co') ||
    (sku === 'PLC-POPUP' && x.id === 'home-popup'))

  const days = Number(product?.fulfilment.match(/(\d+) ngày/)?.[1] ?? 7)
  const status = banner?.status ?? 'Draft'
  /* The one hard rule: a running banner's creative is frozen. The customer paid for
     what is on screen now, and swapping it mid-flight leaves the impressions already
     served attributed to an image nobody can retrieve. Switch Exposure off, or wait
     for Expired, then publish a new booking. */
  const creativeLocked = status === 'Open'
  /* An empty start date is not a missing field — it MEANS publish now. So it is
     never part of `valid`; only the things that genuinely cannot be inferred are. */
  /* The name is required on both paths — a booking nobody can name is one nobody
     can find again in the list. */
  const valid = Boolean(name.trim()) && (editing
    ? Boolean(file)
    : house
      ? Boolean(sku) && Boolean(houseEnd) && Boolean(purpose.trim()) && Boolean(file)
      : Boolean(company) && Boolean(po) && Boolean(sku) && Boolean(file) && Boolean(chosenPo?.invoiced))

  const pick = (v: string) => { setCompany(v); setPo(''); setSku('') }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">{banner ? banner.name : 'Publish banner'}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              {banner ? <>{banner.id} · {banner.company} · <Pill tone={BANNER_TONE[status]}>{status}</Pill></> : 'Chọn khách hàng → PO → sản phẩm, rồi đặt ngày và tải banner.'}
            </p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          {creativeLocked && (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
              <span>🔒</span>
              <span>
                Banner đang <b>Open</b> — không thể thay ảnh. Khách đã trả tiền cho đúng ảnh đang chạy, đổi giữa kỳ sẽ
                làm số lượt hiển thị đã ghi nhận không còn khớp với ảnh nào. Hãy tắt <b>Exposure</b>, hoặc đợi hết hạn
                rồi tạo booking mới.
              </span>
            </p>
          )}

          {/* The NAME is what every list, report and conversation refers to — without
              it a booking is only "the FPT one, the July slot". Asked first, before
              any of the plumbing. */}
          <div>
            <FLabel req>Tên banner</FLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Tết 2026 — FPT Software · Home hero"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] text-faint">Tên nội bộ để nhận ra booking này trong danh sách — không hiển thị cho người dùng.</p>
          </div>

          {!editing && (
            <>
              <Section title="1 · Nguồn" className="mt-0" />
              <div className="grid gap-1.5 sm:grid-cols-2">
                {([
                  ['Sold', 'Khách hàng', 'Đã mua — gắn với dòng trong PO đã xuất hoá đơn'],
                  ['House', 'Nội bộ — Saramin VN', 'Tự chạy: tuyển dụng nội bộ, thông báo, chiến dịch riêng'],
                ] as const).map(([v, label, hint]) => (
                  <button
                    key={v}
                    onClick={() => setSource(v)}
                    className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', source === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                  >
                    <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', source === v ? 'border-brand' : 'border-line')}>
                      {source === v && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-[12px] font-semibold', source === v ? 'text-brand' : 'text-ink')}>{label}</span>
                      <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              {house && (
                <p className="flex gap-2 rounded-md bg-canvas/70 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  <span>ℹ️</span>
                  <span>
                    Banner nội bộ <b className="text-ink/70">vẫn chiếm 1 chỗ</b> trong pool của vị trí đó — nếu không tính, chỗ
                    bán cho khách sẽ bị vượt. Nhưng nó <b className="text-ink/70">không vào doanh thu</b> và không trừ lượt của PO nào.
                  </span>
                </p>
              )}
            </>
          )}

          {house && !editing && (
            <>
              <Section title="2 · Vị trí" />
              <div>
                <FLabel req>Placement</FLabel>
                <select
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink"
                >
                  <option value="">— Chọn vị trí —</option>
                  {CATALOG.filter((c) => c.type === 'Placement booking' && c.role !== 'Add-on').map((c) => (
                    <option key={c.sku} value={c.sku}>{c.name}</option>
                  ))}
                </select>
                {slot && (
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                    <span className="font-mono">{slot.size}</span> · {slot.shown} · {slot.cap} — đọc từ Placements.
                  </p>
                )}
              </div>
              <div>
                <FLabel req>Mục đích</FLabel>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="VD: tuyển dụng nội bộ · thông báo bảo trì · chiến dịch thương hiệu"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Bắt buộc — không có PO nào giải thích vì sao banner này chạy, nên lý do phải nằm ngay trên bản ghi.</p>
              </div>
            </>
          )}

          {!house && !editing && <Section title="2 · Khách hàng & đơn hàng" />}
          {!house && (
          <div>
            <FLabel req>Khách hàng</FLabel>
            <select
              value={company}
              onChange={(e) => pick(e.target.value)}
              disabled={editing}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink disabled:bg-canvas/60 disabled:text-muted"
            >
              <option value="">— Chọn khách hàng —</option>
              {companies.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            {!editing && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Chỉ hiện khách đã mua ít nhất một sản phẩm placement.</p>}
          </div>
          )}

          {!editing && !house && (
            <>
              <div>
                <FLabel req>Đơn hàng / PO</FLabel>
                <select
                  value={po}
                  onChange={(e) => { setPo(e.target.value); setSku('') }}
                  disabled={!company}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink disabled:bg-canvas/60 disabled:text-muted"
                >
                  <option value="">{company ? '— Chọn PO —' : '— Chọn khách hàng trước —'}</option>
                  {pos.map((x) => (
                    <option key={x.po} value={x.po}>{x.po}{x.invoiced ? ` · đã xuất HĐ ${x.invoiced}` : ' · chưa xuất hoá đơn'}</option>
                  ))}
                </select>
                {chosenPo && !chosenPo.invoiced && (
                  <p className="mt-1 flex gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                    <span>⚠️</span><span>PO này <b>chưa xuất hoá đơn</b> — chưa có quota, chưa thể publish. Kế toán xác nhận thanh toán và xuất HĐ trước.</span>
                  </p>
                )}
              </div>

              <div>
                <FLabel req>Sản phẩm trong PO</FLabel>
                {!chosenPo ? (
                  <p className="rounded-md border border-line bg-canvas/50 px-3 py-2 text-[11.5px] text-faint">Chọn PO để xem các dòng placement.</p>
                ) : (
                  <div className="space-y-1.5">
                    {lines.map((ln) => {
                      const p = CATALOG.find((c) => c.sku === ln.sku)
                      const left = ln.qty - ln.used
                      const spent = left <= 0
                      const on = sku === ln.sku
                      return (
                        <button
                          key={ln.sku}
                          onClick={() => !spent && setSku(ln.sku)}
                          disabled={spent}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left',
                            on ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30',
                            spent && 'cursor-not-allowed opacity-50 hover:border-line',
                          )}
                        >
                          <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', on ? 'border-brand' : 'border-line')}>
                            {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/80')}>{p?.name ?? ln.sku}</span>
                            <span className="block text-[10px] text-faint">{ln.used}/{ln.qty} đã dùng</span>
                          </span>
                          <span className={cn('shrink-0 text-[11px] font-semibold tabular-nums', spent ? 'text-rose-600' : 'text-ink')}>
                            {spent ? 'hết lượt' : `${left} còn lại`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {slot && (
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                    <span className="font-mono">{slot.size}</span> · {slot.shown} · {slot.cap} — đọc từ Placements, không sửa ở đây.
                  </p>
                )}
              </div>
            </>
          )}

          {editing && (
            <LField label="Sản phẩm" value={product?.name ?? banner?.sku ?? '—'} hint={banner?.source === 'House' ? 'Banner nội bộ — không gắn PO nào.' : 'Đã chốt khi bán — muốn đổi thì tạo booking mới.'} />
          )}

          <Section title="3 · Thời gian hiển thị" />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel>Ngày bắt đầu<span className="ml-1 font-normal text-faint">để trống = đăng ngay</span></FLabel>
              <input
                type="date"
                value={start ? start.split('/').reverse().join('-') : ''}
                onChange={(e) => setStart(e.target.value.split('-').reverse().join('/'))}
                disabled={status === 'Open' || status === 'Expired'}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand disabled:bg-canvas/60 disabled:text-muted"
              />
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                {start
                  ? <>Ngày trong tương lai → trạng thái <b className="text-ink/70">Schedule</b>, chờ đến {start}. <button onClick={() => setStart('')} className="font-medium text-brand hover:underline">Xoá ngày — đăng ngay</button></>
                  : <>Để trống = đăng ngay → trạng thái <b className="text-ink/70">Open</b> khi lưu.</>}
              </p>
            </div>
            {house ? (
              <div>
                <FLabel req>Ngày kết thúc</FLabel>
                <input
                  type="date"
                  value={houseEnd ? houseEnd.split('/').reverse().join('-') : ''}
                  onChange={(e) => setHouseEnd(e.target.value.split('-').reverse().join('/'))}
                  disabled={status === 'Open' || status === 'Expired'}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand disabled:bg-canvas/60 disabled:text-muted"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Nhập tay — không có sản phẩm nào quy định thời lượng, nên banner nội bộ phải tự đặt hạn kết thúc.</p>
              </div>
            ) : (
              <LField label="Ngày kết thúc" value={start ? `+${days} ngày từ ngày bắt đầu` : `— ${days} ngày sau ngày bắt đầu`} hint="Tính từ thời gian hiển thị của sản phẩm, không nhập tay." />
            )}
          </div>
          {/* Exposure: the same compact toggle a job uses — one row, a sentence and a
              switch. Two radio cards said the same thing in four times the space. */}
          <div>
            <FLabel>Exposure</FLabel>
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
              <span className="min-w-0 flex-1 text-[11.5px] text-muted">
                {exposure === 'On'
                  ? 'On — hiển thị trên site ngay khi Open.'
                  : 'Off — giữ ẩn; booking vẫn chạy và vẫn hết hạn đúng ngày (không phải kết thúc).'}
              </span>
              <button
                role="switch"
                aria-checked={exposure === 'On'}
                onClick={() => setExposure((v) => (v === 'On' ? 'Off' : 'On'))}
                className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', exposure === 'On' ? 'bg-emerald-500' : 'bg-line')}
              >
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', exposure === 'On' ? 'left-[18px]' : 'left-0.5')} />
              </button>
            </div>
          </div>

          <Section title="4 · Banner" />
          <div>
            <FLabel req>Ảnh banner</FLabel>
            <div className={cn('rounded-lg border border-dashed px-3 py-4 text-center', creativeLocked ? 'border-line bg-canvas/50' : 'border-line hover:border-brand/50')}>
              {file ? (
                <div className="flex items-center justify-center gap-2 text-[12px]">
                  <span className="truncate font-mono text-ink/80">{file}</span>
                  {!creativeLocked && (
                    <button onClick={() => setFile(null)} className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-muted hover:border-rose-300 hover:text-rose-600">Gỡ</button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setFile(`${(sku || 'banner').toLowerCase()}-${(slot?.size ?? '').replace(/[^0-9x]/g, '')}.jpg`)}
                  disabled={creativeLocked || (!editing && !sku)}
                  className="text-[12px] font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
                >
                  ⬆ Tải ảnh lên
                </button>
              )}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              Đúng kích thước <b className="text-ink/70">{slot?.size ?? '— chọn sản phẩm trước'}</b>. Ảnh sai tỉ lệ bị chặn khi lưu, không tự crop.
            </p>
          </div>
          <DestinationPicker />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          {status === 'Draft' && (
            <button onClick={onClose} disabled={!valid} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink/80 hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40">Lưu nháp</button>
          )}
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {status === 'Draft' ? 'Publish' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* Where a placement sends the jobseeker. Shared by banners and popups because the
   answer is the same for both: inside the site, to one of three things. Stores the
   ID rather than a URL, so a slug change never breaks a paid placement. */
function DestinationPicker() {
  const [target, setTarget] = useState<'job' | 'company' | 'jobs'>('company')
  return (
    <div>
      <FLabel req>Link đích<span className="ml-1 font-normal text-faint">nội bộ</span></FLabel>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {([
          ['job', 'Một job', 'Job detail'],
          ['company', 'Trang công ty', 'Company page'],
          ['jobs', 'Job list của công ty', 'Company job list'],
        ] as const).map(([v, label, sub]) => (
          <button
            key={v}
            onClick={() => setTarget(v)}
            className={cn('rounded-lg border px-2.5 py-1.5 text-left transition-colors', target === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
          >
            <span className={cn('block text-[11.5px] font-medium', target === v ? 'text-brand' : 'text-ink')}>{label}</span>
            <span className="block text-[10px] text-faint">{sub}</span>
          </button>
        ))}
      </div>
      <div className="mt-1.5">
        <select className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
          {target === 'job' && <>
            <option>— Chọn job —</option>
            <option>JOB-2109 · Digital Marketing Lead</option>
            <option>JOB-2101 · Product Manager</option>
          </>}
          {target !== 'job' && <>
            <option>— Chọn công ty —</option>
            {Object.keys(PLACEMENT_POS).map((x) => <option key={x}>{x}{target === 'jobs' ? ' · tất cả job đang mở' : ''}</option>)}
          </>}
        </select>
        <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
          Lưu <b className="text-ink/70">ID</b>, không lưu URL — job đổi slug hay công ty đổi tên thì link vẫn đúng.
          {target === 'job' && ' Job đóng thì tự trỏ về job list của công ty đó thay vì báo 404.'}
        </p>
      </div>
    </div>
  )
}

/* A POPUP is the same kind of record as a banner — a scheduled creative with a
   source, a status and an exposure switch. Three things differ, and all three come
   from the fact that a popup INTERRUPTS rather than sits in a slot:

     · it targets an AUDIENCE, not a placement
     · it carries a FREQUENCY CAP, so one person is not shown it twice a day
     · only ONE can show at a time, so it needs a PRIORITY

   Everything else — Draft → Schedule → Open → Expired, Exposure separate, creative
   frozen while Open — is deliberately identical, because an operator who has learnt
   the banner screen should not have to learn a second one. */
type PopupAudience = 'Guests' | 'Jobseekers' | 'Employers'
type Popup = {
  id: string
  name: string
  source: 'Sold' | 'House'
  audience: PopupAudience
  company: string
  /** the PO line this popup was sold on — empty for a House popup */
  po?: string
  /** the placement product bought (Homepage pop-up …) */
  product: string
  /** why it is running, in the booker's own words — asked on the form as Mục đích */
  purpose: string
  start: string
  end: string
  status: BannerStatus
  exposure: 'On' | 'Off'
  freq: string
  priority: number
  creative: string | null
}
const POPUPS: Popup[] = [
  { id: 'PU-2010', name: 'Chào mừng người dùng mới', source: 'House', audience: 'Guests', product: 'Homepage pop-up', purpose: 'Giới thiệu tính năng cho khách mới', company: 'Saramin VN', start: '01/06/2026', end: 'Always on', status: 'Open', exposure: 'On', freq: '1 / phiên', priority: 1, creative: 'welcome-popup.jpg' },
  { id: 'PU-2011', name: 'Khảo sát NPS', source: 'House', audience: 'Jobseekers', product: 'Homepage pop-up', purpose: 'Thu thập NPS quý 3', company: 'Saramin VN', start: '01/08/2026', end: '14/08/2026', status: 'Open', exposure: 'On', freq: '1 / tuần', priority: 3, creative: 'nps-survey.jpg' },
  { id: 'PU-2012', name: 'Tuyển dụng Q3 — Vạn Phát', source: 'Sold', audience: 'Jobseekers', po: 'PO-003862-07-2026', product: 'Homepage pop-up', purpose: 'Đẩy tin tuyển dụng Q3', company: 'Công ty TNHH Vạn Phát', start: '10/08/2026', end: '17/08/2026', status: 'Schedule', exposure: 'Off', freq: '1 / phiên', priority: 2, creative: 'vanphat-popup.jpg' },
  { id: 'PU-2013', name: 'Employer trial', source: 'House', audience: 'Employers', product: 'Homepage pop-up', purpose: 'Mời NTD dùng thử', company: 'Saramin VN', start: '—', end: '—', status: 'Draft', exposure: 'Off', freq: '1 / tuần', priority: 5, creative: null },
  { id: 'PU-2009', name: 'Tết 2026 — FPT Software', source: 'Sold', audience: 'Jobseekers', po: 'PO-003790-12-2025', product: 'Homepage pop-up', purpose: 'Chiến dịch Tết 2026', company: 'FPT Software', start: '01/01/2026', end: '15/02/2026', status: 'Expired', exposure: 'Off', freq: '1 / phiên', priority: 4, creative: 'fpt-tet.jpg' },
]
const PU_AUDIENCE: Record<PopupAudience, string> = {
  Guests: 'Khách chưa đăng nhập',
  Jobseekers: 'Ứng viên đã đăng nhập',
  Employers: 'Nhà tuyển dụng',
}

function AdminPopups() {
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
        minW={1560}
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

function PublishPopupModal({ popup, onClose }: { popup: Popup | null; onClose: () => void }) {
  const editing = Boolean(popup)
  /* Identical chain to a banner: COMPANY → PO → PRODUCT. A popup slot is a placement
     product too (Homepage pop-up), so there is no reason for a second way in. */
  const [source, setSource] = useState<'Sold' | 'House'>(popup?.source ?? 'House')
  const house = source === 'House'
  const [company, setCompany] = useState(popup?.company ?? '')
  const [po, setPo] = useState('')
  const [sku, setSku] = useState('')
  const [start, setStart] = useState(popup?.start === '—' ? '' : popup?.start ?? '')
  const [houseEnd, setHouseEnd] = useState(popup && popup.end !== 'Always on' && popup.end !== '—' ? popup.end : '')
  const [purpose, setPurpose] = useState('')
  const [name, setName] = useState(popup?.name ?? '')
  const [exposure, setExposure] = useState<'On' | 'Off'>(popup?.exposure ?? 'On')
  const [file, setFile] = useState<string | null>(popup?.creative ?? null)

  const companies = Object.keys(PLACEMENT_POS)
  const pos = PLACEMENT_POS[company] ?? []
  const chosenPo = pos.find((x) => x.po === po)
  const lines = chosenPo?.lines ?? []
  const product = CATALOG.find((c) => c.sku === sku)
  const days = Number(product?.fulfilment.match(/(\d+) ngày/)?.[1] ?? 7)

  const status = popup?.status ?? 'Draft'
  const creativeLocked = status === 'Open'
  /* The name is required on both paths — a booking nobody can name is one nobody
     can find again in the list. */
  const valid = Boolean(name.trim()) && (editing
    ? Boolean(file)
    : house
      ? Boolean(sku) && Boolean(houseEnd) && Boolean(purpose.trim()) && Boolean(file)
      : Boolean(company) && Boolean(po) && Boolean(sku) && Boolean(file) && Boolean(chosenPo?.invoiced))

  const pick = (v: string) => { setCompany(v); setPo(''); setSku('') }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">{popup ? popup.name : 'Publish popup'}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              {popup ? <>{popup.id} · {popup.company} · <Pill tone={BANNER_TONE[status]}>{status}</Pill></> : 'Chọn khách hàng → PO → sản phẩm, rồi đặt ngày và tải ảnh.'}
            </p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          {creativeLocked && (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
              <span>🔒</span>
              <span>Popup đang <b>Open</b> — không thể thay ảnh. Tắt <b>Exposure</b> để gỡ khỏi màn hình, hoặc đợi hết hạn rồi tạo mới.</span>
            </p>
          )}

          {/* The NAME is what every list, report and conversation refers to — without
              it a booking is only "the FPT one, the July slot". Asked first, before
              any of the plumbing. */}
          <div>
            <FLabel req>Tên popup</FLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khảo sát NPS tháng 8 · Ứng viên"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] text-faint">Tên nội bộ để nhận ra popup này trong danh sách — không hiển thị cho người dùng.</p>
          </div>

          {!editing && (
            <>
              <Section title="1 · Nguồn" className="mt-0" />
              <div className="grid gap-1.5 sm:grid-cols-2">
                {([
                  ['Sold', 'Khách hàng', 'Đã mua — gắn với dòng trong PO đã xuất hoá đơn'],
                  ['House', 'Nội bộ — Saramin VN', 'Thông báo, khảo sát, chiến dịch riêng'],
                ] as const).map(([v, label, hint]) => (
                  <button
                    key={v}
                    onClick={() => setSource(v)}
                    className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', source === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                  >
                    <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', source === v ? 'border-brand' : 'border-line')}>
                      {source === v && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-[12px] font-semibold', source === v ? 'text-brand' : 'text-ink')}>{label}</span>
                      <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {house && !editing && (
            <>
              <Section title="2 · Vị trí" />
              <div>
                <FLabel req>Placement</FLabel>
                <select value={sku} onChange={(e) => setSku(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  <option value="">— Chọn vị trí —</option>
                  {CATALOG.filter((c) => c.type === 'Placement booking' && c.role !== 'Add-on').map((c) => <option key={c.sku} value={c.sku}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <FLabel req>Mục đích</FLabel>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="VD: khảo sát NPS · thông báo bảo trì · chào mừng người dùng mới"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Bắt buộc — không có PO nào giải thích vì sao popup này chạy.</p>
              </div>
            </>
          )}

          {!house && !editing && (
            <>
              <Section title="2 · Khách hàng & đơn hàng" />
              <div>
                <FLabel req>Khách hàng</FLabel>
                <select value={company} onChange={(e) => pick(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  <option value="">— Chọn khách hàng —</option>
                  {companies.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <FLabel req>Đơn hàng / PO</FLabel>
                <select
                  value={po}
                  onChange={(e) => { setPo(e.target.value); setSku('') }}
                  disabled={!company}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink disabled:bg-canvas/60 disabled:text-muted"
                >
                  <option value="">{company ? '— Chọn PO —' : '— Chọn khách hàng trước —'}</option>
                  {pos.map((x) => <option key={x.po} value={x.po}>{x.po}{x.invoiced ? ` · đã xuất HĐ ${x.invoiced}` : ' · chưa xuất hoá đơn'}</option>)}
                </select>
                {chosenPo && !chosenPo.invoiced && (
                  <p className="mt-1 flex gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                    <span>⚠️</span><span>PO này <b>chưa xuất hoá đơn</b> — chưa có quota, chưa thể publish.</span>
                  </p>
                )}
              </div>
              <div>
                <FLabel req>Sản phẩm trong PO</FLabel>
                {!chosenPo ? (
                  <p className="rounded-md border border-line bg-canvas/50 px-3 py-2 text-[11.5px] text-faint">Chọn PO để xem các dòng placement.</p>
                ) : (
                  <div className="space-y-1.5">
                    {lines.map((ln) => {
                      const pr = CATALOG.find((c) => c.sku === ln.sku)
                      const left = ln.qty - ln.used
                      const spent = left <= 0
                      const on = sku === ln.sku
                      return (
                        <button
                          key={ln.sku}
                          onClick={() => !spent && setSku(ln.sku)}
                          disabled={spent}
                          className={cn('flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left', on ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30', spent && 'cursor-not-allowed opacity-50 hover:border-line')}
                        >
                          <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', on ? 'border-brand' : 'border-line')}>
                            {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/80')}>{pr?.name ?? ln.sku}</span>
                            <span className="block text-[10px] text-faint">{ln.used}/{ln.qty} đã dùng</span>
                          </span>
                          <span className={cn('shrink-0 text-[11px] font-semibold tabular-nums', spent ? 'text-rose-600' : 'text-ink')}>{spent ? 'hết lượt' : `${left} còn lại`}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {editing && <LField label="Sản phẩm" value={product?.name ?? 'Homepage pop-up'} hint={popup?.source === 'House' ? 'Popup nội bộ — không gắn PO nào.' : 'Đã chốt khi bán.'} />}

          <Section title={editing ? '1 · Thời gian hiển thị' : '3 · Thời gian hiển thị'} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel>Ngày bắt đầu<span className="ml-1 font-normal text-faint">để trống = đăng ngay</span></FLabel>
              <input
                type="date"
                value={start ? start.split('/').reverse().join('-') : ''}
                onChange={(e) => setStart(e.target.value.split('-').reverse().join('/'))}
                disabled={status === 'Open' || status === 'Expired'}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand disabled:bg-canvas/60 disabled:text-muted"
              />
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                {start
                  ? <>Ngày trong tương lai → <b className="text-ink/70">Schedule</b>. <button onClick={() => setStart('')} className="font-medium text-brand hover:underline">Xoá ngày — đăng ngay</button></>
                  : <>Để trống = đăng ngay → <b className="text-ink/70">Open</b> khi lưu.</>}
              </p>
            </div>
            {house && !editing ? (
              <div>
                <FLabel req>Ngày kết thúc</FLabel>
                <input
                  type="date"
                  value={houseEnd ? houseEnd.split('/').reverse().join('-') : ''}
                  onChange={(e) => setHouseEnd(e.target.value.split('-').reverse().join('/'))}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Nhập tay — popup nội bộ không có sản phẩm quy định thời lượng.</p>
              </div>
            ) : (
              <LField label="Ngày kết thúc" value={start ? `+${days} ngày từ ngày bắt đầu` : `— ${days} ngày sau ngày bắt đầu`} hint="Tính từ thời gian hiển thị của sản phẩm, không nhập tay." />
            )}
          </div>

          <div>
            <FLabel>Exposure</FLabel>
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
              <span className="min-w-0 flex-1 text-[11.5px] text-muted">
                {exposure === 'On' ? 'On — hiển thị cho đối tượng đã chọn.' : 'Off — giữ ẩn; lịch vẫn chạy và vẫn hết hạn đúng ngày.'}
              </span>
              <button
                role="switch"
                aria-checked={exposure === 'On'}
                onClick={() => setExposure((v) => (v === 'On' ? 'Off' : 'On'))}
                className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', exposure === 'On' ? 'bg-emerald-500' : 'bg-line')}
              >
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', exposure === 'On' ? 'left-[18px]' : 'left-0.5')} />
              </button>
            </div>
          </div>

          <div>
            <FLabel req>Ảnh popup</FLabel>
            <div className={cn('rounded-lg border border-dashed px-3 py-4 text-center', creativeLocked ? 'border-line bg-canvas/50' : 'border-line hover:border-brand/50')}>
              {file ? (
                <div className="flex items-center justify-center gap-2 text-[12px]">
                  <span className="truncate font-mono text-ink/80">{file}</span>
                  {!creativeLocked && <button onClick={() => setFile(null)} className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-muted hover:border-rose-300 hover:text-rose-600">Gỡ</button>}
                </div>
              ) : (
                <button onClick={() => setFile('popup-creative.jpg')} disabled={creativeLocked} className="text-[12px] font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:text-faint disabled:no-underline">
                  ⬆ Tải ảnh lên
                </button>
              )}
            </div>
          </div>
          <DestinationPicker />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          {status === 'Draft' && (
            <button onClick={onClose} disabled={!valid} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink/80 hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40">Lưu nháp</button>
          )}
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {status === 'Draft' ? 'Publish' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Account usage, across every customer ─────────────────────────────────────
   The queues answer "what still needs doing?". This answers the other question —
   "what has this customer consumed?" — for every customer at once, which today can
   only be reconstructed by opening thirty company records one at a time.

   Every column is the same shape because every product is: bought N, used M. Job
   slots, CV unlocks, placement bookings and service deliveries differ only in WHO
   records the use — the platform observes the first three, a person asserts the
   fourth — not in what the number means. */
type UsagePair = { used: number; total: number }
function usageOf(c: Company) {
  const placements = (PLACEMENT_POS[c.name] ?? []).flatMap((p) => p.lines)
  const services = SERVICE_USAGE[c.name] ?? []
  return {
    job: { used: c.jobTotal - c.jobLeft, total: c.jobTotal } as UsagePair,
    cv: { used: c.cvTotal - c.cvLeft, total: c.cvTotal } as UsagePair,
    plc: { used: placements.reduce((t, l) => t + l.used, 0), total: placements.reduce((t, l) => t + l.qty, 0) } as UsagePair,
    svc: { used: services.reduce((t, e) => t + e.entries.length, 0), total: services.reduce((t, e) => t + e.total, 0) } as UsagePair,
  }
}

/** A used/total cell. Empty means "did not buy this", which is not the same as
    "bought and used none" — so it renders as — rather than 0/0 with a full bar. */
function UsageCell({ p }: { p: UsagePair }) {
  if (p.total === 0) return <span className="text-faint">—</span>
  const pct = (p.used / p.total) * 100
  const low = p.total - p.used === 0
  return (
    <span className="flex items-center gap-2">
      <span className={cn('shrink-0 tabular-nums', low ? 'font-semibold text-rose-600' : 'text-ink')}>{p.used}/{p.total}</span>
      <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-line">
        <span className={cn('block h-full rounded-full', low ? 'bg-rose-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
      </span>
    </span>
  )
}

function AdminAccountUsage() {
  const [fState, setFState] = useState('')
  const [sort, setSort] = useState('')

  const base = COMPANIES.filter((c) => isCustomer(c) || c.account === 'Churn')
    .map((c) => ({ c, u: usageOf(c) }))
    .filter((r) => r.u.job.total + r.u.cv.total + r.u.plc.total + r.u.svc.total > 0)

  const owed = (u: ReturnType<typeof usageOf>) =>
    (u.job.total - u.job.used) + (u.cv.total - u.cv.used) + (u.plc.total - u.plc.used) + (u.svc.total - u.svc.used)
  const spentPct = (u: ReturnType<typeof usageOf>) => {
    const t = u.job.total + u.cv.total + u.plc.total + u.svc.total
    const d = u.job.used + u.cv.used + u.plc.used + u.svc.used
    return t === 0 ? 0 : (d / t) * 100
  }

  const rows = base
    .filter((r) => !fState || (fState === 'Còn nhiều chưa dùng' ? spentPct(r.u) < 50 : spentPct(r.u) >= 90))
    .slice()
    .sort((a, b) => {
      if (sort === 'unused') return owed(b.u) - owed(a.u)
      if (sort === 'spent') return spentPct(b.u) - spentPct(a.u)
      return coLabel(a.c).localeCompare(coLabel(b.c), 'vi')
    })

  return (
    <div>
      <ListPage
        cols={[
          { label: 'Khách hàng', w: '1.6fr' },
          { label: 'Job slots', w: '1.1fr' },
          { label: 'CV unlocks', w: '1.1fr' },
          { label: 'Placements', w: '1.1fr' },
          { label: 'Manual services', w: '1.1fr' },
          { label: 'Chưa dùng', w: '0.8fr', align: 'r' },
          { label: 'Hạn dùng', w: '1fr', align: 'r' },
        ]}
        rows={rows.map(({ c, u }) => [
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{coLabel(c)}</span>
            <span className="block text-[10.5px] text-faint">👤 {c.owner}</span>
          </span>,
          <UsageCell p={u.job} />,
          <UsageCell p={u.cv} />,
          <UsageCell p={u.plc} />,
          <UsageCell p={u.svc} />,
          <span className={cn('font-semibold tabular-nums', owed(u) === 0 ? 'text-faint' : 'text-ink')}>{owed(u)}</span>,
          <span className={cn('tabular-nums', c.renewal === 'Lapsed' ? 'text-rose-600' : 'text-muted')}>{c.renewal}</span>,
        ])}
        filters={
          <>
            <FilterSelect label="Mức dùng" value={fState} onChange={setFState} options={['Còn nhiều chưa dùng', 'Sắp hết']} />
            <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', sort ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
              <span className={sort ? 'text-brand/70' : 'text-faint'}>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={cn('cursor-pointer bg-transparent text-[11.5px] outline-none', sort ? 'font-medium text-brand' : 'text-ink')}>
                <option value="">Tên A → Z</option>
                <option value="unused">Chưa dùng nhiều nhất</option>
                <option value="spent">Đã dùng nhiều nhất</option>
              </select>
            </label>
          </>
        }
        total={base.length}
        searchHint="Search khách hàng, sales owner…"
        minW={1240}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Màn hình sales mở trước khi gọi gia hạn. <b className="text-ink/70">Chưa dùng nhiều</b> = khách chưa nhận đủ
        giá trị đã trả → rủi ro không tái ký; <b className="text-ink/70">sắp hết</b> = cơ hội bán thêm ·
        ô <b className="text-ink/70">—</b> nghĩa là chưa mua loại đó, khác với mua rồi chưa dùng
      </p>
    </div>
  )
}

/* ── Manual services, one page for all of them ────────────────────────────────
   Five products across a hundred companies is not five queues — it is one list at
   the grain of (company × service), which is where the quota lives. A per-product
   page fragments the one question ops actually asks: who is owed something?

   STATUS IS DERIVED from two facts, remaining and validity, and both matter:

     Còn lượt    — remaining > 0, still valid. Actionable.
     Đã dùng hết — delivered everything. Nothing owed, nothing lost.
     Hết hạn     — validity passed with units UNUSED. The customer paid for
                   something they never received, and it can no longer be given.
                   This is the row that must never be silent.
     Đã kết thúc — validity passed with everything delivered. Clean close.

   Only "Còn lượt" can be logged against. Delivering after expiry would mean giving
   away a unit the customer's own terms had already forfeited. */
type SvcState = 'Còn lượt' | 'Đã dùng hết' | 'Hết hạn' | 'Đã kết thúc'
const SVC_TONE: Record<SvcState, StatusTone> = {
  'Còn lượt': 'open',
  'Đã dùng hết': 'expired',
  'Hết hạn': 'rejected',
  'Đã kết thúc': 'closed',
}
/** Demo "today". A real build compares against the server clock. */
const SVC_TODAY = new Date(2026, 7, 16)
const asDate = (d: string) => {
  const [dd, mm, yy] = d.split('/').map(Number)
  return new Date(yy, mm - 1, dd)
}
function svcState(e: ServiceEntitlement): SvcState {
  const left = e.total - e.entries.length
  const expired = asDate(e.validUntil) < SVC_TODAY
  if (expired) return left > 0 ? 'Hết hạn' : 'Đã kết thúc'
  return left > 0 ? 'Còn lượt' : 'Đã dùng hết'
}

function AdminManualServices() {
  const [fState, setFState] = useState('')
  const [fSku, setFSku] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [logging, setLogging] = useState<{ e: ServiceEntitlement; company: string } | null>(null)

  const all = Object.entries(SERVICE_USAGE)
    .flatMap(([company, list]) => list.map((e) => ({ company, e, state: svcState(e), left: e.total - e.entries.length })))
  const rows = all
    .filter((r) => (!fState || r.state === fState) && (!fSku || r.e.sku === fSku))
    // Rows that need action first, then rows that lost value, then the settled ones.
    .sort((a, b) => {
      const rank = (x: SvcState) => (x === 'Còn lượt' ? 0 : x === 'Hết hạn' ? 1 : x === 'Đã dùng hết' ? 2 : 3)
      return rank(a.state) - rank(b.state) || b.left - a.left
    })

  const services = [...new Set(all.map((r) => r.e.sku))]

  return (
    <div>
      <ListPage
        cols={[
          { label: 'Dịch vụ', w: '1.9fr' },
          { label: 'Khách hàng', w: '1.4fr' },
          { label: 'Quota', w: '1.2fr' },
          { label: 'Còn lại', w: '0.7fr', align: 'r' },
          { label: 'Hạn dùng', w: '0.9fr' },
          { label: 'Trạng thái', w: '1fr' },
          { label: '', w: '1.1fr', align: 'r' },
        ]}
        rows={rows.map(({ company, e, state, left }) => {
          const key = `${company}|${e.sku}`
          return [
            <button onClick={() => setOpen(open === key ? null : key)} className="min-w-0 max-w-full truncate text-left font-medium text-brand hover:underline">
              {e.name}
            </button>,
            <span className="truncate text-ink/85">{company}</span>,
            <span className="flex items-center gap-2">
              <span className="shrink-0 tabular-nums">{e.entries.length}/{e.total}</span>
              <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-line">
                <span className={cn('block h-full rounded-full', state === 'Hết hạn' ? 'bg-rose-500' : 'bg-brand')} style={{ width: `${(e.entries.length / e.total) * 100}%` }} />
              </span>
            </span>,
            <span className={cn('font-semibold tabular-nums', state === 'Hết hạn' ? 'text-rose-600' : left === 0 ? 'text-faint' : 'text-ink')}>{left}</span>,
            <span className={cn('tabular-nums', state === 'Hết hạn' || state === 'Đã kết thúc' ? 'text-faint' : 'text-muted')}>{e.validUntil}</span>,
            <Pill tone={SVC_TONE[state]}>{state}</Pill>,
            <span className="flex items-center justify-end gap-1.5">
              <button onClick={() => setOpen(open === key ? null : key)} className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-ink/40">
                Lịch sử {e.entries.length > 0 && `(${e.entries.length})`}
              </button>
              {state === 'Còn lượt'
                ? <button onClick={() => setLogging({ e, company })} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Ghi nhận</button>
                : <span className="w-[64px] text-center text-[11px] text-faint">—</span>}
            </span>,
          ]
        })}
        filters={
          <>
            <FilterSelect label="Trạng thái" value={fState} onChange={setFState} options={['Còn lượt', 'Đã dùng hết', 'Hết hạn', 'Đã kết thúc']} />
            <FilterSelect label="Dịch vụ" value={fSku} onChange={setFSku} options={services} />
          </>
        }
        total={all.length}
        searchHint="Search dịch vụ, khách hàng…"
        minW={1280}
      />

      {/* History opens BELOW the table rather than in a modal: comparing "what did we
          post for them" against the quota above it is the whole point, and a modal
          would cover the row it belongs to. */}
      {open && (() => {
        const r = all.find((x) => `${x.company}|${x.e.sku}` === open)
        if (!r) return null
        return (
          <div className="mt-3 rounded-xl border border-line">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft bg-canvas/50 px-3.5 py-2.5">
              <p className="text-[12.5px] font-semibold">
                Lịch sử — {r.company} · <span className="font-normal text-muted">{r.e.name}</span>
              </p>
              <span className="flex items-center gap-2">
                <Pill tone={SVC_TONE[r.state]}>{r.state}</Pill>
                <button onClick={() => setOpen(null)} className="text-[11px] text-muted hover:text-ink">Đóng</button>
              </span>
            </div>
            <div className="p-3.5">
              {r.e.entries.length === 0 ? (
                <p className="text-[11.5px] text-muted">Chưa ghi nhận lượt nào.</p>
              ) : (
                <ol className="space-y-2.5">
                  {r.e.entries.map((d, n) => (
                    <li key={d.id} className="flex gap-2.5">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-canvas text-[10px] font-semibold text-muted">{n + 1}</span>
                      {/* Image kept as its own block: the proof a customer asks to see
                          is the screenshot, so it should not be a footnote. */}
                      <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-canvas text-[9px] text-faint">
                        {d.image ? '🖼' : 'chưa có ảnh'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[11.5px] font-medium tabular-nums text-ink">{d.date}</span>
                          <a href={d.link} onClick={(ev) => ev.preventDefault()} className="min-w-0 truncate text-[11px] text-brand hover:underline">{d.link}</a>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted">{d.content}</p>
                        <p className="mt-0.5 text-[10px] text-faint">{d.image ? <span className="font-mono">{d.image}</span> : <span className="text-amber-700">⚠️ chưa đính ảnh</span>} · {d.by}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {r.state === 'Hết hạn' && (
                <p className="mt-2.5 flex gap-2 rounded-md bg-rose-50 px-3 py-2 text-[11.5px] leading-relaxed text-rose-700">
                  <span>⚠️</span>
                  <span>Hết hạn <b>{r.e.validUntil}</b> khi còn <b>{r.left} {r.e.unit}</b> chưa giao. Không thể ghi nhận thêm — muốn bù cho khách thì bán/tặng một entitlement mới, đừng sửa hạn của cái cũ.</span>
                </p>
              )}
            </div>
          </div>
        )
      })()}

      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Một dòng = một <b className="text-ink/70">entitlement</b> (công ty × dịch vụ). Trạng thái suy ra từ số còn lại
        và hạn dùng, không nhập tay · chỉ <b className="text-ink/70">Còn lượt</b> mới ghi nhận được
      </p>
      {logging && <LogServiceDeliveryModal e={logging.e} company={logging.company} onClose={() => setLogging(null)} />}
    </div>
  )
}

function AdminPages() {
  const rows = [
    ['About Saramin Vietnam', '/about', '12/06/2026', <Pill tone="active">Published</Pill>],
    ['Terms of Service', '/legal/terms', '01/05/2026', <Pill tone="active">Published</Pill>],
    ['Privacy Policy', '/legal/privacy', '01/05/2026', <Pill tone="active">Published</Pill>],
    ['Service guide — Employers', '/guide/employer', '20/07/2026', <Pill tone="draft">Draft</Pill>],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 24, active: true }, { label: 'Published', count: 19 }, { label: 'Draft', count: 5 }]}
      cols={[{ label: 'Page', w: '1.8fr' }, { label: 'Slug', w: '1.4fr' }, { label: 'Updated', w: '1fr' }, { label: 'Status', w: '0.9fr', align: 'r' }]}
      rows={rows}
    />
  )
}

/* ── Billing & products ───────────────────────────────────────────────────── */
/* The five product TYPES, derived from the client Products deck. The type is the
   discriminator that decides what "fulfilment" means, so it drives which fields
   the create form asks for — see NewProductModal. */
/* ── Placements registry ──────────────────────────────────────────────────────
   One row per display area on the jobseeker site, transcribed from the client
   Products deck (§1 Dịch vụ Trang chủ, §2 Dịch vụ Trang Tìm kiếm).

   This is the layer BETWEEN the site and the catalog. Sizes and caps live here,
   once — not retyped into every banner sale — and each row records how it gets
   filled, which is the product ⇄ homepage relationship:

     tier   — membership is DERIVED from a job's posting tier. Nothing is booked.
     booked — a company buys the slot for N days. Capacity-capped → needs a calendar.
     both   — available by tier AND sellable standalone. Needs a priority rule,
              or the fixed positions get oversold. */
type FillRoute = 'tier' | 'booked' | 'both'
const FILL_META: Record<FillRoute, { label: string; tone: StatusTone; hint: string }> = {
  tier: { label: 'Tier-driven', tone: 'active', hint: 'Derived from the job’s posting tier — never booked, never assigned by hand.' },
  booked: { label: 'Booked', tone: 'pending', hint: 'Sold as a time window on the slot. Capacity-capped, so it needs an availability calendar.' },
  both: { label: 'Tier + booked', tone: 'rejected', hint: 'Two supply routes competing for the same positions — needs an explicit priority rule.' },
}
type Placement = { id: string; page: 'Home' | 'Search'; ref: string; name: string; size: string; shown: string; cap: string; route: FillRoute; fedBy: string }
const PLACEMENTS: Placement[] = [
  { id: 'home-hero', page: 'Home', ref: '1.1', name: 'Main Banner (Hero)', size: '1536 × 371 px', shown: '1 at a time', cap: 'max 6 · rotate 3s', route: 'booked', fedBy: 'Banner placement product · client-supplied image + link' },
  { id: 'home-feature-co', page: 'Home', ref: '1.2', name: 'Feature company (logos)', size: 'Logo from profile', shown: '6 logos', cap: 'max 12 · random per reload', route: 'booked', fedBy: 'Feature company product · logo auto-pulled from company profile' },
  { id: 'home-super-hot', page: 'Home', ref: '1.3', name: 'Công việc Hot hôm nay', size: 'Job card + image', shown: '4 jobs', cap: 'unlimited pool · random per reload', route: 'both', fedBy: 'Top Job tier (first 10 days) — AND sold standalone (10 ngày)' },
  { id: 'home-top-co', page: 'Home', ref: '1.4', name: 'Top Companies Hiring Now', size: 'Logo + cover', shown: '2 companies', cap: 'max 5 · rotate 5s', route: 'booked', fedBy: 'Công ty nổi bật product (10 ngày)' },
  { id: 'home-popular-jobs', page: 'Home', ref: '1.5', name: 'Popular Jobs', size: 'Job row', shown: '20 postings', cap: '+4 fixed premium positions', route: 'both', fedBy: 'Distinction + Top Job tiers · 4 fixed positions sold as an add-on' },
  { id: 'home-highlight-co', page: 'Home', ref: '1.6', name: 'Highlight Companies', size: 'Job row', shown: '20 postings', cap: '+5 fixed premium positions', route: 'both', fedBy: 'Basic Plus tier · 5 fixed positions sold as an add-on' },
  { id: 'home-new-jobs', page: 'Home', ref: '1.7', name: 'Công việc mới (Job Basic)', size: 'Job row', shown: 'List', cap: 'Bottom of page', route: 'tier', fedBy: 'Basic tier' },
  { id: 'home-adsense', page: 'Home', ref: '1.8', name: 'Banner adsense', size: '1260 × 120 px', shown: '1 at a time', cap: 'max 6 · refresh on reload', route: 'booked', fedBy: 'Banner placement product · below “Hot Categories”' },
  { id: 'home-tailored', page: 'Home', ref: '1.9', name: 'Jobs Tailored For You', size: 'Job card', shown: 'List', cap: '—', route: 'tier', fedBy: 'Guests: Distinction + Top Job · Logged in: personalised by profile & behaviour' },
  { id: 'home-popup', page: 'Home', ref: '1.10', name: 'Homepage pop-up', size: 'Custom creative', shown: '1 at a time', cap: 'priority decides · frequency-capped', route: 'booked', fedBy: 'Popup placement product · per campaign, CTA configurable' },
  { id: 'search-highlight-co', page: 'Search', ref: '2.1', name: 'Highlight Company', size: 'Company block', shown: '1 company', cap: 'unlimited · random per reload', route: 'booked', fedBy: 'Highlight Company product → links to company profile' },
  { id: 'search-highlight-jobs', page: 'Search', ref: '2.2', name: 'Highlight Jobs', size: 'Job row', shown: 'Unlimited', cap: 'random per reload', route: 'tier', fedBy: 'Basic Plus · Distinction · Top Job (tier sets the rank band)' },
  { id: 'search-adsense', page: 'Search', ref: '2.3', name: 'Banner adsense', size: '425 × 160 px', shown: '1 at a time', cap: 'unlimited · position varies on reload', route: 'booked', fedBy: 'Banner placement product · interleaved between results' },
]

/** Placements list — the registry the product form and the jobseeker site share. */
function AdminPlacements() {
  const [route, setRoute] = useState<FillRoute | 'all'>('all')
  const shown = PLACEMENTS.filter((p) => route === 'all' || p.route === route)
  const n = (r: FillRoute) => PLACEMENTS.filter((p) => p.route === r).length
  return (
    <div>
      <p className="mb-3 max-w-[72ch] text-[11.5px] leading-relaxed text-muted">
        Every display area on the jobseeker site, from the client Products deck. Sizes and caps are defined
        here <b className="text-ink/70">once</b> — a banner sale points at a row instead of re-typing “1536×371, max 6, rotate 3s”.
        The <b className="text-ink/70">Filled by</b> column is the product ⇄ page relationship.
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {([['all', `All ${PLACEMENTS.length}`], ['tier', `Tier-driven ${n('tier')}`], ['booked', `Booked ${n('booked')}`], ['both', `Tier + booked ${n('both')}`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setRoute(k as FillRoute | 'all')} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', route === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{label}</button>
        ))}
      </div>

      <ListPage
        cols={[{ label: 'Placement', w: '1.6fr' }, { label: 'Size', w: '1fr' }, { label: 'Shown', w: '0.9fr' }, { label: 'Capacity', w: '1.3fr' }, { label: 'Fill route', w: '1fr' }, { label: 'Filled by', w: '2fr' }]}
        rows={shown.map((p) => [
          <span>
            <span className="font-medium text-ink">{p.name}</span>
            <span className="block text-[10.5px] text-faint">{p.page} · deck §{p.ref}</span>
          </span>,
          <span className="font-mono text-[11px]">{p.size}</span>,
          p.shown,
          p.cap,
          <Pill tone={FILL_META[p.route].tone}>{FILL_META[p.route].label}</Pill>,
          <span className="text-[11px] leading-relaxed">{p.fedBy}</span>,
        ])}
        minW={1180}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Tier-driven = membership derived from the job’s tier, nothing booked · Booked = a purchased time window,
        needs an availability calendar
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(['tier', 'booked', 'both'] as FillRoute[]).map((r) => (
          <div key={r} className="rounded-lg border border-line p-2.5">
            <Pill tone={FILL_META[r].tone}>{FILL_META[r].label}</Pill>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{FILL_META[r].hint}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
        <span></span>
        <span>
          <b>Three placements have two supply routes.</b> “Công việc Hot hôm nay” shows 4 jobs but is both a Top Job
          perk (first 10 days) and a standalone purchase; Popular Jobs and Highlight Companies each have a fixed
          premium block (4 and 5 positions) sold as an add-on on top of the tier-driven list. Each needs one
          resolver with an explicit priority rule — otherwise the finite positions get oversold.
        </span>
      </p>
    </div>
  )
}

/* FOUR types. "Add-on" was a fifth until we noticed it describes how a thing is
   SOLD, not what it is: an email blast is a Manual service whether it is sold
   alone or included in Top Job, and a premium fixed position is a Placement
   either way. So attachability is a FLAG on the product (`standalone`), not a
   type — which is why the same "Công ty nổi bật" definition serves both the
   standalone booking and the copy included inside Top Job. */
const PRODUCT_TYPES = [
  { id: 'job', label: 'Job posting', blurb: 'A posting tier — publishing a job spends one slot', eg: 'Basic · Basic Plus · Distinction · Top Job' },
  { id: 'cv', label: 'CV search', blurb: 'Unlock quota + validity, spent per CV opened', eg: 'COMBO 30 / 50 / 100 / 300' },
  { id: 'placement', label: 'Placement booking', blurb: 'A time window on a slot, capacity-capped', eg: 'Main banner · Công ty nổi bật · Adsense · Popup' },
  { id: 'service', label: 'Manual service', blurb: 'Ops fulfils it — creates a task, not an entitlement', eg: 'Fanpage post · Email marketing' },
] as const
type ProductTypeId = (typeof PRODUCT_TYPES)[number]['id']

/* The catalog, transcribed from the client Products deck. Prices marked ⓒ come
   from the current CRM product picker (the deck prices only the CV combos).

   Note what is deliberately NOT here: one row per tier, not the four segment
   variants the CRM carries today (Basic Plus exists there as Basic Plus SMEs
   3.949.000 / Basic Plus Enterprise 5.544.000 / Basic Plus Job 6.100.000 /
   Basic Plus 15 days 30.000.000). Segment pricing is a price list ON the
   product, so what a tier grants is defined once. */
/* SKU is the stable handle a product keeps for life: it is what a quotation line,
   an order, an invoice and an entitlement all reference, so it must survive a
   rename. Shape is TYPE-CAPABILITY — the type prefix makes a row self-describing
   in an export or a support ticket, where the Type column is not there to help. */
/* `role` is the product's relationship to a sale — the same axis the create form
   asks for. Three values, not two, because the fanpage post and the email send are
   genuinely sold standalone AND included inside Top Job; a binary flag would force
   duplicating them.
     Main   — quotable on its own
     Add-on — reaches a customer only via another product's `includes`
     Both   — quotable AND includable                                            */
type ProductRole = 'Main' | 'Add-on'
/* `entitlement` says HOW a product reaches a job, and it is deliberately NOT
   derived from price: a promo line can cost 0 ₫ and still be consumed from a PO.
   'free' = HQ may post it at any time with no PO and no limit; it is Admin-only,
   never offered on the Company site, and never upgradeable to a paid tier. */
type Entitlement = 'purchase' | 'free'
/* ── Activation window ────────────────────────────────────────────────────────
   How long the customer has to START using what they bought, counted from the
   INVOICE date — client T&C clause 4. It is the middle of three clocks and the
   only one that can silently destroy paid-for quota:

     provisioned   the invoice is issued → quota lands on the account (immediate)
     activate by   invoice date + THIS window → unused quota expires
     runs for      once a slot is activated, the posting/pack runs its own period

   It sits on the PRODUCT, not on a global setting, because a 12-month bank on a
   13.800.000 ₫ Top Job slot and a 12-month bank on a free trial tin are not the
   same promise. Default 12 months, which is what the client T&C states. */
const ACTIVATE_WITHIN_DEFAULT = 12
/** Months to activate, or null where the product is never invoiced at all. */
const activateWithin = (p: { entitlement?: Entitlement; activateWithin?: number }) =>
  p.entitlement === 'free' ? null : p.activateWithin ?? ACTIVATE_WITHIN_DEFAULT
/* Always in MONTHS, never "1 năm": the point of the column is to compare 3 against
   12 at a glance, and the client T&C itself says "trong vòng 12 tháng". */
const activateWithinLabel = (p: { entitlement?: Entitlement; activateWithin?: number }) => {
  const m = activateWithin(p)
  return m === null ? '—' : `${m} tháng`
}

const CATALOG: { sku: string; name: string; type: string; role: ProductRole; price: string; fulfilment: string; status: 'Active' | 'Inactive'; includes?: string[]; entitlement?: Entitlement; activateWithin?: number }[] = [
  // ── Job posting ───────────────────────────────────────────────────────────
  { sku: 'JOB-FREE', name: 'Tin Free (Admin đăng hộ)', type: 'Job posting', role: 'Main', price: '0 ₫', fulfilment: '14 ngày · không vị trí nổi bật', status: 'Active', entitlement: 'free' },
  { sku: 'JOB-BASIC', name: 'Tin Basic', type: 'Job posting', role: 'Main', price: '2,710,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 15 ngày', status: 'Active' },
  { sku: 'JOB-BASICPLUS', name: 'Tin Basic Plus', type: 'Job posting', role: 'Main', price: '6,100,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 10 ngày', status: 'Active', includes: ['PLC-HLCOMPANIES', 'SVC-EMAIL-DEV'] },
  { sku: 'JOB-DISTINCTION', name: 'Tin Distinction', type: 'Job posting', role: 'Main', price: '12,000,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 5 ngày', status: 'Active', includes: ['PLC-POPULARJOBS'] },
  { sku: 'JOB-TOPJOB', name: 'Tin Top Job', type: 'Job posting', role: 'Main', price: '13,800,000 ₫ ⓒ', fulfilment: '30 ngày · mỗi ngày ×7 rồi 5 ngày', status: 'Active', includes: ['PLC-POPULARJOBS', 'SVC-FB-TOPDEV', 'SVC-EMAIL-DEV'] },
  // Shorter window than the 12-month default on purpose: a giveaway that can be
  // banked for a year is a liability on the books, not an incentive to start.
  { sku: 'JOB-TRIAL', name: 'Tin Basic — dùng thử (tặng KH mới)', type: 'Job posting', role: 'Main', price: '0 ₫', fulfilment: '15 ngày · 1 slot · 1 lần / MST', status: 'Active', activateWithin: 3 },

  // ── CV search ─────────────────────────────────────────────────────────────
  { sku: 'CV-030', name: 'COMBO 30 — mở CV', type: 'CV search', role: 'Main', price: '2,400,000 ₫', fulfilment: '30 lượt · 30 ngày · ~80.000/CV', status: 'Active' },
  { sku: 'CV-050', name: 'COMBO 50 — mở CV', type: 'CV search', role: 'Main', price: '3,700,000 ₫', fulfilment: '50 lượt · 30 ngày · ~74.000/CV', status: 'Active' },
  { sku: 'CV-100', name: 'COMBO 100 — mở CV', type: 'CV search', role: 'Main', price: '7,000,000 ₫', fulfilment: '100 lượt · 90 ngày · ~70.000/CV', status: 'Active' },
  { sku: 'CV-300', name: 'COMBO 300 — mở CV', type: 'CV search', role: 'Main', price: '20,000,000 ₫', fulfilment: '300 lượt · 90 ngày · ~67.000/CV', status: 'Active' },
  { sku: 'CV-SOURCING', name: 'CV sourcing + giới thiệu', type: 'CV search', role: 'Add-on', price: '— nội bộ', fulfilment: '10 lượt · theo gói cha', status: 'Active' },

  // ── Placement booking ─────────────────────────────────────────────────────
  { sku: 'PLC-HOMEHERO', name: 'Main Banner — Home hero', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1536×371 · 1 of 6 · rotate 3s', status: 'Inactive' },
  { sku: 'PLC-FEATURECO', name: 'Feature company (logo)', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '6 logo · tối đa 12', status: 'Inactive' },
  { sku: 'PLC-TOPCOMPANY', name: 'Công ty nổi bật', type: 'Placement booking', role: 'Main', price: '10,000,000 ₫ ⓒ', fulfilment: '10 ngày · Home · logo + cover', status: 'Active' },
  { sku: 'PLC-HOTJOBS', name: 'Công việc Hot hôm nay', type: 'Placement booking', role: 'Main', price: '5,000,000 ₫ ⓒ', fulfilment: '10 ngày · 4 vị trí', status: 'Active' },
  { sku: 'PLC-ADS-HOME', name: 'Banner adsense — Home', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1260×120 · 1 of 6', status: 'Inactive' },
  { sku: 'PLC-ADS-SEARCH', name: 'Banner adsense — Search', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '425×160 · không giới hạn', status: 'Inactive' },
  { sku: 'PLC-SEARCH-HLCO', name: 'Highlight Company — Search', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1 công ty · không giới hạn', status: 'Inactive' },
  { sku: 'PLC-POPUP', name: 'Homepage pop-up', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1 popup · theo chiến dịch', status: 'Inactive' },
  { sku: 'PLC-POPULARJOBS', name: 'Popular Jobs — vị trí premium', type: 'Placement booking', role: 'Add-on', price: '— nội bộ', fulfilment: '4 vị trí cố định', status: 'Active' },
  { sku: 'PLC-HLCOMPANIES', name: 'Highlight Companies — vị trí premium', type: 'Placement booking', role: 'Add-on', price: '— nội bộ', fulfilment: '5 vị trí cố định', status: 'Active' },

  // ── Manual service ────────────────────────────────────────────────────────
  { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', type: 'Manual service', role: 'Main', price: '4,000,000 ₫ ⓒ', fulfilment: '1 bài đăng · 176k follower', status: 'Active' },
  { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', type: 'Manual service', role: 'Main', price: '20,000,000 ₫ ⓒ', fulfilment: '1 lượt gửi · reach theo gói cha', status: 'Active' },
  { sku: 'SVC-HACKERRANK', name: 'Đánh giá ứng viên HackerRank', type: 'Manual service', role: 'Add-on', price: '— nội bộ', fulfilment: '1 bài test · chỉ trong Gói Ultimate', status: 'Active' },
  { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', type: 'Manual service', role: 'Add-on', price: '— nội bộ', fulfilment: '2 mốc · ngày 11 và ngày 31', status: 'Active' },
  { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', type: 'Manual service', role: 'Main', price: '8,000,000 ₫', fulfilment: '1 lượt gửi · 650k ứng viên', status: 'Active' },
]

/* Price segments and product descriptions are shared by the create form and the
   product record, so the two can never ask for / show a different set. */
export const PRICE_SEGMENTS = ['SME / Startup', 'Enterprise', 'Standard'] as const

/** Deck-derived VI/EN description — what prints on the quotation and the PO. */
export const DESCRIPTIONS: Record<string, { vi: string; en: string }> = {
  'JOB-BASIC': { vi: 'Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag · Làm mới bài đăng mỗi 15 ngày · Hiển thị tại Trang chủ mục “Công việc mới” và Trang tìm kiếm.', en: 'Official job posting for 30 days, up to 03 skill tags · Refreshed every 15 days · Shown in “New jobs” on the homepage and in search.' },
  'JOB-BASICPLUS': { vi: 'Đăng tuyển chính thức 30 ngày · Làm mới mỗi 10 ngày · Tiêu đề tô đỏ · Ưu tiên hiển thị trong kết quả tìm kiếm · Logo công ty tại mục Highlight Companies · Email marketing đến 7.500 data.', en: 'Official posting for 30 days · Refreshed every 10 days · Bold red title · Priority in search results · Company logo in Highlight Companies · Email marketing to 7,500 targeted profiles.' },
  'JOB-DISTINCTION': { vi: 'Đăng tuyển chính thức 30 ngày, tối đa 05 skill tag · Làm mới mỗi 05 ngày · Tiêu đề đỏ + nền nổi bật · Hiển thị 03 phúc lợi ở trang tìm kiếm · Top Search · Hiển thị tại “Các công ty phổ biến”.', en: 'Official posting for 30 days, up to 05 skill tags · Refreshed every 05 days · Red title + highlighted background · 3 benefits shown in search · Top Search · Shown in Popular Companies.' },
  'JOB-TOPJOB': { vi: 'Gói cao cấp nhất: 30 ngày, tối đa 07 skill tag · Làm mới mỗi ngày trong 7 ngày đầu rồi mỗi 05 ngày · Nhãn “HOT JOB” 10 ngày · “Công việc Hot hôm nay” 10 ngày đầu · Vị trí cao nhất Top Search · Bài đăng fanpage TopDev · Big Banner trong Email Job Alert.', en: 'Top tier: 30 days, up to 07 skill tags · Refreshed daily for the first 7 days then every 05 · “HOT JOB” label for 10 days · “Hot jobs today” for the first 10 days · Highest Top Search position · TopDev fanpage post · Big Banner in the Email Job Alert.' },
  'JOB-TRIAL': { vi: 'Tin dùng thử tặng khách hàng mới: 15 ngày hiển thị, 01 slot, giới hạn 01 lần trên mỗi mã số thuế.', en: 'Free trial posting for new customers: 15 days, 01 slot, limited to once per tax code.' },
  'CV-030': { vi: 'Mở 30 hồ sơ ứng viên (mỗi CV tương ứng 01 lượt mở) · Hạn dùng 30 ngày kể từ ngày kích hoạt · Hồ sơ đã mở được bảo lưu 30 ngày sau khi dịch vụ hết hạn.', en: 'Unlock 30 candidate profiles (1 unlock per CV) · Valid 30 days from activation · Opened profiles retained 30 days after expiry.' },
  'CV-050': { vi: 'Mở 50 hồ sơ ứng viên · Hạn dùng 30 ngày kể từ ngày kích hoạt.', en: 'Unlock 50 candidate profiles · Valid 30 days from activation.' },
  'CV-100': { vi: 'Mở 100 hồ sơ ứng viên · Hạn dùng 90 ngày kể từ ngày kích hoạt.', en: 'Unlock 100 candidate profiles · Valid 90 days from activation.' },
  'CV-300': { vi: 'Mở 300 hồ sơ ứng viên · Hạn dùng 90 ngày kể từ ngày kích hoạt.', en: 'Unlock 300 candidate profiles · Valid 90 days from activation.' },
  'PLC-TOPCOMPANY': { vi: 'Thời gian hiển thị 10 ngày · Vị trí Trang chủ TopDev · Logo công ty và hình ảnh đại diện · Tiếp cận hơn 200.000 lượt truy cập.', en: '10 days · TopDev homepage · Company logo and cover image · Reaches 200,000+ visits.' },
  'PLC-HOTJOBS': { vi: 'Thời gian hiển thị 10 ngày · Trang chủ TopDev · Logo công ty và thông tin tuyển dụng · 4 vị trí hiển thị.', en: '10 days · TopDev homepage · Company logo and job details · 4 display positions.' },
  'SVC-FB-TOPDEV': { vi: 'Bài đăng quảng bá tin tuyển dụng hoặc thương hiệu trên fanpage chính thức TopDev, hơn 176.000 follower.', en: 'A promotional post for the job or brand on the official TopDev fanpage, 176,000+ followers.' },
  'SVC-EMAIL-DEV': { vi: 'Gửi email tin tuyển dụng hoặc chiến dịch truyền thông đến database developer của TopDev.', en: 'Email the job or campaign to the TopDev developer database.' },
}

type CatalogItem = (typeof CATALOG)[number]

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

function AdminCatalog() {
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
        cols={[{ label: 'Product', w: '1.9fr' }, { label: 'SKU', w: '1.1fr' }, { label: 'Type', w: '1.2fr' }, { label: 'Role', w: '0.8fr' }, { label: 'Price', w: '1.1fr', align: 'r' }, { label: 'Fulfilment', w: '1.6fr' }, { label: 'Activate within', w: '1fr' }, { label: 'Status', w: '0.7fr', align: 'r' }]}
        rows={rows.map((p) => [
          // The name opens the product record — where the price, the entitlement it
          // grants and its change history live.
          <a href="#" onClick={(e) => { e.preventDefault(); setDetail(p.sku) }} className="min-w-0 truncate font-medium text-brand hover:underline">{p.name}</a>,
          <span className="truncate font-mono text-[11px] text-muted">{p.sku}</span>,
          p.type,
          // Add-on can never be a quotation line, so it is called out rather than
          // printed as plain text like Main.
          p.role === 'Main'
            ? <span className="text-muted">Main</span>
            : <Pill tone={p.role === 'Add-on' ? 'pending' : 'neutral'}>{p.role}</Pill>,
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

/* Create product. The type picker is step 1 because it changes the rest of the
   form — a placement needs a slot + calendar, a credit pack needs an amount, a
   manual service needs an SLA and an owner. One flat form can't express that. */
export function NewProductModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<ProductTypeId>('job')
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const [role, setRole] = useState<'main' | 'addon'>('main')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Inactive')
  const [nameVi, setNameVi] = useState('')
  // Product ID auto-follows the name until someone types their own, then stops.
  const [skuEdited, setSkuEdited] = useState(false)
  const [skuManual, setSkuManual] = useState('')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('50')
  const [entitlement, setEntitlement] = useState<Entitlement>('purchase')
  // T&C clause 4 default. Stored per product, not read from a global setting.
  const [activate, setActivate] = useState(String(ACTIVATE_WITHIN_DEFAULT))
  // Only job-posting products can be the always-available (Admin-only) free tier.
  const isFree = type === 'job' && entitlement === 'free'

  const autoSku = nameVi.trim()
    ? `${type.toUpperCase()}-${nameVi.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '').toUpperCase().slice(0, 12)}`
    : ''
  const sku = skuEdited ? skuManual : autoSku
  const setSku = setSkuManual

  const priceNum = Number(price.replace(/\D/g, ''))
  const amountNum = Number(amount.replace(/\D/g, ''))
  const perCv = priceNum > 0 && amountNum > 0 ? Math.round(priceNum / amountNum) : null
  const vnd = (n: number) => n.toLocaleString('vi-VN')

  // A name is all an Inactive product needs. Setting it Active also requires a
  // price — the one rule the spec keeps, checked on Save rather than by a button.
  // The free tier is the deliberate exception: it is never sold, so it has no price
  // to require, and demanding one would make it impossible to activate at all.
  const valid = nameVi.trim().length > 0 && (status === 'Inactive' || isFree || priceNum > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[620px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">New product</p>
            <p className="text-[11px] text-muted">A product is the sellable SKU — price + terms. What it grants comes from its type.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          <Section title="1 · Type" className="mt-0" />
          <div className="grid gap-1.5">
            {PRODUCT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
                  type === t.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30',
                )}
              >
                <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', type === t.id ? 'border-brand' : 'border-line')}>
                  {type === t.id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-[12.5px] font-semibold', type === t.id ? 'text-brand' : 'text-ink')}>{t.label}</span>
                  <span className="block text-[11px] leading-relaxed text-muted">{t.blurb}</span>
                  <span className="block text-[10.5px] text-faint">e.g. {t.eg}</span>
                </span>
              </button>
            ))}
          </div>

          <Section title="2 · Identity" />
          {/* One name — the internal/sales name sales and admin both use. Only the
              customer-facing description is translated (see its own tab below). */}
          <div>
            <FLabel req>Name</FLabel>
            <input
              value={nameVi}
              onChange={(e) => setNameVi(e.target.value)}
              placeholder="e.g. Tin Top Job"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
          </div>
          <div>
            <FLabel req>Product ID<span className="ml-1 font-normal text-faint">auto-generated — edit only if you need a specific code</span></FLabel>
            <input
              value={sku}
              onChange={(e) => { setSkuEdited(true); setSku(e.target.value.toUpperCase()) }}
              placeholder={autoSku || `${type.toUpperCase()}-…`}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              {skuEdited ? 'Manual — ' : 'Follows the name — '}
              locked after the first sale, because quotations, orders and invoices reference it.
            </p>
          </div>
          {/* Applies to EVERY type, so it lives in Identity rather than inside one
              branch. Three values, not two: the fanpage post and the email send are
              genuinely sold BOTH ways (4.000.000 ₫ / 20.000.000 ₫ standalone) AND
              included inside Top Job — a binary flag would force duplicating them. */}
          <div>
            <FLabel req>Role</FLabel>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {([
                ['main', 'Main product', 'Quotable on its own — and still includable in other products'],
                ['addon', 'Add-on', 'Only via Includes — hidden from the quotation picker'],
              ] as const).map(([id, label, hint]) => (
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', role === id ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                >
                  <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', role === id ? 'border-brand' : 'border-line')}>
                    {role === id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-[12px] font-semibold', role === id ? 'text-brand' : 'text-ink')}>{label}</span>
                    <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            {role !== 'main' && (
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                Appears in the <b className="text-ink/70">Includes</b> picker when any product is created.
                {role === 'addon' && ' Never shown as a quotation line — it reaches a customer only inside a Main product.'}
              </p>
            )}
          </div>

          {/* Status is a plain field with one Save, not a set of transition buttons —
              simplest model: two values, edited like any other attribute. */}
          <div>
            <FLabel req>Status</FLabel>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {([
                ['Active', 'Sellable — can be quoted and ordered'],
                ['Inactive', 'Not sellable — hidden from quotations'],
              ] as const).map(([v, hint]) => (
                <button
                  key={v}
                  onClick={() => setStatus(v)}
                  className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', status === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                >
                  <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', status === v ? 'border-brand' : 'border-line')}>
                    {status === v && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-[12px] font-semibold', status === v ? 'text-brand' : 'text-ink')}>{v}</span>
                    <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            {status === 'Active' && !priceNum && !isFree && (
              <p className="mt-1 text-[10.5px] leading-relaxed text-amber-700">An Active product needs a price — Save is blocked until one is set.</p>
            )}
          </div>

          {/* The ONLY translated field: it is printed on the quotation and the PO,
              which go out in the customer's language. Everything else on this form is
              internal, so it needs one value, not two. */}
          <div>
            <div className="mb-1 flex items-end justify-between gap-2">
              <FLabel req={lang === 'VI'}>Product description</FLabel>
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
              {lang === 'VI' ? 'In trên báo giá và PO — danh sách quyền lợi khách hàng đọc.' : 'Printed on the quotation and the PO — the benefit list the customer reads.'}
            </div>
          </div>

          <Section title="3 · Fulfilment" />
          {/* Applies to EVERY type, so it comes before the branches. Three clocks
              get confused with each other constantly, so the hint below names all
              three and says which one this field is. */}
          {!isFree ? (
            <div>
              <FLabel req>
                Thời gian phải kích hoạt — kể từ ngày xuất hóa đơn
                <span className="ml-1 font-normal text-faint">T&amp;C điều 4</span>
              </FLabel>
              <select
                value={activate}
                onChange={(e) => setActivate(e.target.value)}
                className="w-full cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
              >
                {[3, 6, 12, 18, 24].map((m) => (
                  <option key={m} value={m}>{m} tháng{m === ACTIVATE_WITHIN_DEFAULT ? ' — mặc định (T&C điều 4)' : ''}</option>
                ))}
              </select>
              <p className="mt-1 rounded-md bg-canvas/70 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-muted">
                Ba mốc thời gian khác nhau — đây là mốc <b className="text-ink/75">thứ hai</b>:
                <br />① <b className="text-ink/75">Cấp quota</b> — ngay khi xuất hóa đơn.
                <br />② <b className="text-ink/75">Phải kích hoạt trong {activate} tháng</b> kể từ ngày hóa đơn, nếu không quota chưa dùng sẽ hết hạn.
                <br />③ <b className="text-ink/75">Sau khi kích hoạt</b>, mỗi slot chạy theo thời gian hiển thị / hiệu lực riêng bên dưới.
              </p>
            </div>
          ) : (
            <p className="rounded-md bg-brand-soft px-2.5 py-1.5 text-[10.5px] leading-relaxed text-brand">
              🆓 Không có thời hạn kích hoạt — tier này không bao giờ được bán nên không có hóa đơn để đếm từ đó.
            </p>
          )}
          {/* There is no separate "tier config" screen: THIS product IS the tier
              definition. Display duration, refresh cadence and the placements it
              feeds are editable here, and because there is exactly one Top Job
              product (segments are a price list, not extra products), what Top Job
              grants can only be defined in one place. */}
          {type === 'job' && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Thời gian hiển thị (days)" req value="30 ngày" />
                <LField label="Auto-refresh" req value="Daily for 7 days, then every 5 days" select />
              </div>
              {/* "Posting slots sold" removed: a product defines what ONE posting
                  is; how many the customer buys is a quantity on the quotation line. */}

              <div>
                <FLabel req>Placement slots — where a job of this tier appears<span className="ml-1 font-normal text-faint">from the Placements registry</span></FLabel>
                <div className="space-y-1.5">
                  {PLACEMENTS.filter((x) => x.route !== 'booked').map((x, i) => {
                    const on = i < 4
                    return (
                      <div key={x.id} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5', on ? 'border-brand bg-brand-soft' : 'border-line')}>
                        <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on && <span className="text-[9px] leading-none">✓</span>}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/70')}>{x.name}</span>
                          <span className="block text-[10px] text-faint">{x.page} · {x.shown}</span>
                        </span>
                        {on && (
                          <select
                            defaultValue={x.id === 'home-super-hot' ? '10' : 'full'}
                            className="shrink-0 rounded border border-line bg-surface px-1.5 py-1 text-[10.5px] text-ink/80 outline-none focus:border-brand"
                          >
                            <option value="full">Toàn bộ thời gian hiển thị</option>
                            <option value="5">5 ngày đầu</option>
                            <option value="7">7 ngày đầu</option>
                            <option value="10">10 ngày đầu</option>
                            <option value="15">15 ngày đầu</option>
                            <option value="30">30 ngày</option>
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Composition is for products a customer buys. An Add-on is reached
                  only through a parent, so letting it include further products would
                  nest includes and make provisioning ambiguous. */}
              {role !== 'addon' && (
              <div>
                {/* "Add-on products" was wrong: there is no add-on class. These are
                    ordinary catalog products — Services, created in admin like any
                    other — that this product grants along with itself. Hence Includes. */}
                <FLabel>Includes / Bán kèm<span className="ml-1 font-normal text-faint">products granted together with this one — create them in the catalog first</span></FLabel>
                {/* Manual services only. The premium fixed positions were listed here
                    too, but they are PLACEMENTS — already chosen in the section above,
                    so offering them twice let one tier grant the same slot twice. */}
                <div className="space-y-1.5">
                  {CATALOG.filter((c) => c.type === 'Manual service').map((c, i) => {
                    const on = i < 2
                    return (
                      <div key={c.sku} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5', on ? 'border-brand bg-brand-soft' : 'border-line')}>
                        <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on && <span className="text-[9px] leading-none">✓</span>}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/70')}>{c.name}</span>
                          <span className="block text-[10px] text-faint">{c.type} · sold separately at {c.price.replace(' ⓒ', '')}</span>
                        </span>
                        {on && (
                          <span className="flex shrink-0 items-center gap-1">
                            <span className="text-[10px] text-faint">SL</span>
                            <select defaultValue="1" className="rounded border border-line bg-surface px-1.5 py-1 text-[10.5px] text-ink/80 outline-none focus:border-brand">
                              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Included, not bundled: the customer sees ONE line “Tin Top Job” on the quotation. Paying it fires each include as an ops task at the quantity set here.</p>
              </div>
              )}

            </>
          )}
          {type === 'placement' && (
            <>
              {/* Options come from the Placements registry — the same list the
                  jobseeker site renders, so a sale can't invent a slot. */}
              <SelectField
                label="Placement slot"
                req
                value={`${PLACEMENTS[0].name} — ${PLACEMENTS[0].page} (${PLACEMENTS[0].size})`}
                options={PLACEMENTS.filter((p) => p.route !== 'tier').map((p) => `${p.name} — ${p.page} (${p.size})`)}
                extra={<span className="ml-1 font-normal text-faint">— tier-driven areas are excluded; they aren’t bookable</span>}
              />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Thời gian hiển thị (days)" req value="10 ngày" select />
                <LField label="Slots consumed" value="1 of 6 in rotation" />
              </div>

              {/* The pool cap is 6, so the only question sales actually has is
                  "is this slot free when the customer wants it?". Answering that at
                  the point of sale is what stops overselling. */}
            </>
          )}
          {type === 'cv' && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <FLabel req>Amount</FLabel>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="50" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
                </div>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Validity" req value="30 days" select hint="Deck sells 30-day and 90-day packs." />
              </div>
            </>
          )}
          {type === 'service' && (
            <>
              {/* What ONE unit of this service delivers. Quantity + unit rather than a
                  hardcoded label, so the same type covers a fanpage post, an email
                  send and a banner without needing a new product type each time. */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Số lượng" req value="1" />
                <LField label="Đơn vị" req value="bài đăng" select hint="bài đăng · email · lượt gửi · banner" />
              </div>
              <p className="rounded-md bg-brand-soft px-3 py-2 text-[11px] leading-relaxed text-brand">
                Paying this does <b>not</b> auto-provision quota. It opens a fulfilment task (Requested → Scheduled → Delivered) and needs proof-of-delivery before the line counts as fulfilled.
              </p>
            </>
          )}

          <Section title="4 · Pricing" />
          {/* HOW the product reaches a job, stored rather than inferred from price:
              a promo line can be 0 ₫ and still be consumed from a PO, so deriving
              "postable anytime" from price == 0 would turn every freebie into an
              unlimited loophole. Job-posting products only. */}
          {type === 'job' && (
            <div>
              <FLabel req>Entitlement source</FLabel>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {([
                  ['purchase', 'Requires purchase', 'Must draw from an active PO line — the normal paid path'],
                  ['free', 'Always available — Admin only', 'No PO, no limit. HQ posts it any time; never offered on the Company site'],
                ] as const).map(([id, label, hint]) => (
                  <button
                    key={id}
                    onClick={() => setEntitlement(id)}
                    className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', entitlement === id ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                  >
                    <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', entitlement === id ? 'border-brand' : 'border-line')}>
                      {entitlement === id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-[12px] font-semibold', entitlement === id ? 'text-brand' : 'text-ink')}>{label}</span>
                      <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              {isFree && (
                <p className="mt-1 rounded-md bg-brand-soft px-2.5 py-1.5 text-[10.5px] leading-relaxed text-brand">
                  🆓 No price required — this tier is never sold. Employers can’t choose it; it can’t be upgraded to a paid tier, and it gets no premium placement slots.
                </p>
              )}
            </div>
          )}
          {/* One product, a price PER SEGMENT — this is what replaces the CRM's
              separate "… SMEs / … Enterprise / … New 2024" records, so what a
              product grants is defined once. The record shows the same three rows. */}
          {/* ONE price, every type. Segment pricing (SME / Enterprise / Standard) was
              here but is out of scope for now — see the note in the record. An Add-on
              is never quoted, so its figure is labelled internal rather than list. */}
          <div>
            <FLabel req={role !== 'addon' && !isFree}>
              {role === 'addon' ? 'Giá trị nội bộ (₫)' : 'Price (₫)'}
              {role === 'addon' && <span className="ml-1 font-normal text-faint">internal value — not quotable</span>}
            </FLabel>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              placeholder="3700000"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              {priceNum > 0 && <span className="text-ink/70">{vnd(priceNum)} ₫ · </span>}
              {role === 'addon'
                ? 'Attributes margin inside the parent product. Never printed on a quotation.'
                : 'The catalogue list price. A quotation may discount from it; this is the anchor.'}
            </p>
          </div>
          {type === 'cv' && (
            <p className="rounded-md bg-canvas/70 px-3 py-2 text-[11px] text-muted">
              Average per CV: <b className="text-ink/80">{perCv ? `~${vnd(perCv)} ₫ / CV` : '— enter price and amount'}</b> — computed, never typed. This is the number the deck sells on.
            </p>
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

const PACKAGES: { name: string; note: string; components: string; price: string; status: 'Active' | 'Inactive' }[] = [
  { name: 'Gói Ultimate', note: '6 components · from the client catalogue', components: 'Top Job posting (60 ngày: 30 chính thức + 30 bảo hành) · CV sourcing + giới thiệu · Email marketing 9.500 data · Popular Companies logo · HackerRank assessment · CSKH follow-up', price: '16,489,000 ₫', status: 'Active' },
  { name: 'Top Job + premium position', note: '2 components · proposed', components: 'Tin Top Job ×1 · Popular Jobs premium position ×1', price: '— price TBC', status: 'Inactive' },
  { name: 'Enterprise (custom)', note: 'quoted per deal', components: 'All products + negotiated volume', price: 'Custom', status: 'Inactive' },
]

function AdminBundles() {
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
function AdminCredits() {
  const rows = [
    ['Công ty Vạn Phát', '80 CV unlocks', '−20 (unlock)', 'System', '10m ago'],
    ['FPT Software', '1,240 credits', '+500 (grant)', 'Phạm Quang Huy', '2h ago'],
    ['Tiki', '320 credits', '−15 (unlock)', 'System', '1d ago'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Company', w: '1.5fr' }, { label: 'Balance', w: '1fr', align: 'r' }, { label: 'Last change', w: '1fr', align: 'r' }, { label: 'By', w: '1fr', align: 'r' }, { label: 'When', w: '0.8fr', align: 'r' }]}
      rows={rows}
    />
  )
}
function AdminOrders() {
  const rows = [
    ['ORD-5521', 'Công ty Vạn Phát', '37,800,000 ₫', <Pill tone="active">Fulfilled</Pill>, '26/05/2026'],
    ['ORD-5522', 'Việt Tiến Logistics', '22,000,000 ₫', <Pill tone="pending">Pending payment</Pill>, '01/06/2026'],
    ['ORD-5523', 'Hoàng Gia', '8,000,000 ₫', <Pill tone="neutral">Paid</Pill>, '03/06/2026'],
    ['ORD-5524', 'Tiki', '32,000,000 ₫', <Pill tone="draft">Draft</Pill>, '05/06/2026'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 312, active: true }, { label: 'Pending payment', count: 14 }, { label: 'Paid', count: 40 }, { label: 'Fulfilled', count: 250 }]}
      cols={[{ label: 'Order', w: '1fr' }, { label: 'Company', w: '1.6fr' }, { label: 'Amount', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.1fr' }, { label: 'Date', w: '1fr', align: 'r' }]}
      rows={rows}
    />
  )
}
/* ── Discount programmes ──────────────────────────────────────────────────────
   The client's own promo sheet, configured here ONCE and applied by the quotation
   builder automatically. It is deliberately settings, not a hard-coded rule: the
   thresholds are a commercial decision that changes every campaign, and a rep
   typing 25 / 30 / 35 by hand gets it wrong roughly as often as they get it right.

   Two programmes, two SHAPES, and the shapes are genuinely different — which is
   why this is not one table with an audience column:

     volume per PRODUCT (Existing)  — quantities of the SAME product are summed
                                      across the option, and the tier that total
                                      reaches sets the % on every line of it
     flat on the order  (New/Churn) — one % on everything, but only while EVERY
                                      line stays at or under a quantity cap

   “Cùng loại” is the load-bearing phrase in the first one: 3 + 4 Basic Plus on two
   lines is 7 Basic Plus, so both lines earn the 5-tier at 30% — not 25% each for
   being under 5 separately. Splitting a line must never change the price.

   The second is all-or-nothing on purpose: one line over the cap and the whole
   50% is lost, not just that line's share. That cliff is the client's rule, and
   it is the reason the builder has to show WHICH line broke it. */
type PromoAudience = Account
type VolumeTier = { minQty: number; pct: number }
type Programme = {
  id: string
  name: string
  vi: string
  audience: PromoAudience[]
  /** per-product: quantities of the same product are summed, then tiered ·
      flat: one % on the whole option */
  kind: 'volume-per-product' | 'flat-order'
  tiers?: VolumeTier[]
  pct?: number
  /** flat only — every non-gift line must be at or under this, or nothing applies */
  maxQtyPerLine?: number
  /** flat only — first PO of the CURRENT status spell, not first in history: for a
      Churn customer that is the first PO since they came back. Self-enforcing,
      because the first invoice flips them to Existing and the programme stops
      matching on its own. */
  firstPoOfCurrentSpell?: boolean
  /** whether it may run alongside another programme on the same quotation */
  stackable: boolean
  /** gift lines inherit the paid line's activation window rather than their own */
  giftActivationFollowsPaid?: boolean
  status: 'Active' | 'Inactive'
  from: string
  to: string
  note?: string
}

const PROGRAMMES: Programme[] = [
  {
    id: 'EXISTING-VOLUME',
    name: 'Volume discount — existing customers',
    vi: 'Chiết khấu theo số lượng (cùng loại)',
    audience: ['Existing'],
    kind: 'volume-per-product',
    // Thresholds, not exact matches: 7 tin earns the 5-tier, not nothing.
    tiers: [
      { minQty: 2, pct: 25 }, { minQty: 5, pct: 30 }, { minQty: 10, pct: 35 },
      { minQty: 20, pct: 40 }, { minQty: 30, pct: 45 }, { minQty: 50, pct: 50 },
      { minQty: 100, pct: 60 },
    ],
    stackable: true,
    status: 'Active',
    from: '01/01/2026',
    to: '31/12/2026',
    note: 'Section 1 of 3 on the client’s sheet — the other two sections that “apply at the same time” have not been supplied yet.',
  },
  {
    id: 'NEWCHURN-50',
    name: 'Welcome / win-back — 50% off everything',
    vi: 'Giảm 50% tất cả các dịch vụ',
    audience: ['New', 'Churn'],
    kind: 'flat-order',
    pct: 50,
    maxQtyPerLine: 5,
    firstPoOfCurrentSpell: true,
    stackable: false,
    giftActivationFollowsPaid: true,
    status: 'Active',
    from: '01/01/2026',
    to: '31/12/2026',
    note: 'Over the cap, the sheet’s own escape routes are: quote the Existing programme instead, or split into two documents so the customer gets both. Both are a rep decision, not something the system does by itself.',
  },
]

/** The one programme that applies to a customer status, or null. */
const programmeFor = (a?: Account) => PROGRAMMES.find((x) => x.status === 'Active' && a && x.audience.includes(a)) ?? null
/** Highest tier whose threshold the quantity reaches. 1 earns nothing. */
const tierPct = (p: Programme, qty: number) =>
  (p.tiers ?? []).reduce((best, t) => (qty >= t.minQty ? t.pct : best), 0)
/** Quantity of each product across an option's PAID lines — the number the tier
    is looked up on. Gifts are 0 ₫ and were not bought, so they never count. */
const qtyByProduct = (lines: { cat: number; qty: number; gift: boolean }[]) => {
  const m = new Map<number, number>()
  lines.forEach((l) => { if (!l.gift) m.set(l.cat, (m.get(l.cat) ?? 0) + l.qty) })
  return m
}

/* The settings screen. Not a list of coupon CODES — nobody types a code here.
   A programme is chosen BY the customer's status, so the record reads as a rule
   the quotation builder obeys rather than as something a rep applies by hand. */
function AdminPromotions() {
  const [open, setOpen] = useState<Programme | null>(null)
  if (open) return <ProgrammeDetail p={open} onBack={() => setOpen(null)} />
  return (
    <div>
      <ListPage
        cols={[
          { label: 'Programme', w: '2fr' }, { label: 'Applies to', w: '1.2fr' }, { label: 'Discount', w: '1.7fr' },
          { label: 'Condition', w: '1.8fr' }, { label: 'Stacks', w: '0.8fr' }, { label: 'Validity', w: '1.2fr' }, { label: 'Status', w: '0.8fr', align: 'r' },
        ]}
        rows={PROGRAMMES.map((p) => [
          <button onClick={() => setOpen(p)} className="min-w-0 truncate text-left font-medium text-brand hover:underline">{p.vi}</button>,
          <span className="flex flex-wrap gap-1">{p.audience.map((a) => <Pill key={a} tone={AC_STATUS[a].tone}>{a}</Pill>)}</span>,
          <span className="text-muted">{p.kind === 'volume-per-product' ? `${p.tiers![0].pct}–${p.tiers![p.tiers!.length - 1].pct}% theo tổng số lượng cùng loại` : `${p.pct}% trên tổng đơn`}</span>,
          <span className="text-muted">{p.kind === 'volume-per-product' ? `từ ${p.tiers![0].minQty} sản phẩm cùng loại` : `mọi dòng ≤ ${p.maxQtyPerLine} · PO đầu tiên của trạng thái hiện tại`}</span>,
          p.stackable ? <span className="text-muted">Có</span> : <Pill tone="rejected">Không</Pill>,
          <span className="tabular-nums text-muted">{p.from} – {p.to}</span>,
          <Pill tone={p.status === 'Active' ? 'active' : 'expired'}>{p.status}</Pill>,
        ])}
        total={PROGRAMMES.length}
        searchHint="Search programme…"
        minW={1320}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        A programme is matched to a customer by their <b className="text-muted">customer status</b> (New · Existing · Churn) and applied by the
        quotation builder automatically — there is no code for a rep to type, and no button to press.
      </p>
    </div>
  )
}

/* The record. The tier table is the point of the screen, so it is the record —
   everything else on the page is the conditions around it. */
function ProgrammeDetail({ p, onBack }: { p: Programme; onBack: () => void }) {
  useDetailCrumb(p.vi, onBack)
  const tiers = p.tiers ?? []
  return (
    <div className="max-w-[900px]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            {p.vi} <Pill tone={p.status === 'Active' ? 'active' : 'expired'}>{p.status}</Pill>
          </h2>
          <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
            <span className="font-mono">{p.id}</span> · {p.name} · hiệu lực {p.from} – {p.to}
          </p>
        </div>
        <button className="shrink-0 rounded-lg border border-brand/30 bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Edit</button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DetailCard title="Điều kiện áp dụng — conditions">
          <KV label="Khách hàng / Customer status" value={p.audience.join(' · ')} />
          <KV label="Cách tính" value={p.kind === 'volume-per-product' ? 'Cộng dồn theo loại sản phẩm (“cùng loại”) — tổng số lượng của một sản phẩm trong option quyết định % cho mọi dòng của sản phẩm đó' : `${p.pct}% trên tổng đơn (trước VAT)`} />
          {p.maxQtyPerLine != null && (
            <KV label="Giới hạn số lượng" value={`Mọi dòng phải ≤ ${p.maxQtyPerLine}. Chỉ cần 1 dòng vượt là mất toàn bộ ${p.pct}% — không phải chỉ dòng đó.`} />
          )}
          <KV
            label="Phạm vi"
            value={p.firstPoOfCurrentSpell
              ? 'PO đầu tiên kể từ khi khách ở trạng thái hiện tại — với khách Churn là PO đầu tiên sau khi quay lại, không phải PO đầu tiên trong lịch sử. Tự động hết hiệu lực: hóa đơn đầu tiên đổi khách sang Existing nên chương trình không còn khớp.'
              : 'Mọi đơn trong thời gian hiệu lực'}
          />
          <KV label="Chạy cùng chương trình khác" value={p.stackable ? 'Có' : 'Không — loại trừ mọi chương trình khác'} />
          <KV
            label="Duyệt chiết khấu"
            value={`Mức do chương trình cấp không cần duyệt dù vượt ${DISCOUNT_APPROVAL}%. Chỉ khi sales tắt áp dụng tự động và tự nhập thì mới trình duyệt.`}
          />
          {p.giftActivationFollowsPaid && (
            <KV label="Hạn kích hoạt tin tặng" value="Giống tin mua — dùng đúng activation window của sản phẩm đã mua (xem Products management)" />
          )}
        </DetailCard>

        <DetailCard
          title={p.kind === 'volume-per-product' ? 'Bậc chiết khấu — theo tổng số lượng cùng loại' : 'Mức chiết khấu'}
          action={<span className="text-[11px] text-faint">áp dụng tự động khi tạo báo giá</span>}
        >
          {tiers.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-line">
                <div className="grid grid-cols-3 gap-x-2 bg-canvas/60 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                  <span>Từ số lượng</span><span>Đến</span><span className="text-right">Chiết khấu</span>
                </div>
                {tiers.map((t, i) => {
                  const next = tiers[i + 1]
                  return (
                    <div key={t.minQty} className="grid grid-cols-3 gap-x-2 border-t border-line-soft px-3 py-1.5 text-[12px]">
                      <span className="tabular-nums font-medium">{t.minQty}</span>
                      <span className="tabular-nums text-muted">{next ? next.minQty - 1 : '∞'}</span>
                      <span className="text-right tabular-nums font-semibold">{t.pct}%</span>
                    </div>
                  )
                })}
              </div>
              {/* The row the client's sheet does not print, and the one a rep will
                  otherwise assume is 25%. */}
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Số lượng <b className="text-ink/75">1</b> không có chiết khấu. Các mốc là <b className="text-ink/75">ngưỡng</b>, không phải con số chính xác — mua 7 tin hưởng bậc 5 (30%), không phải mất chiết khấu.
                <br />Số lượng được <b className="text-ink/75">cộng dồn theo loại sản phẩm</b>: 3 tin Basic Plus ở một dòng và 4 tin Basic Plus ở dòng khác là 7 tin, cả hai dòng cùng hưởng 30%. Tách dòng không làm thay đổi giá.
              </p>
            </>
          ) : (
            <p className="text-[13px]"><b className="text-[15px]">{p.pct}%</b> trên tổng đơn, trước VAT.</p>
          )}
          {p.note && <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">{p.note}</p>}
        </DetailCard>
      </div>
    </div>
  )
}

/* ── Sales / CRM ──────────────────────────────────────────────────────────────
   LEGACY board. This is an older mockup of the same Sales pipeline that the
   Companies board (CompaniesBoard, sourced from COMPANIES) now covers, with its
   own stage vocabulary (Lead / Won) and its own demo rows. It shares the ONE
   idle RULE via idleOf() above, but it still carries its own `idle` numbers — so
   a company appearing in both shows two different day counts. Idle is a property
   of the COMPANY; this duplicate field should go when the board is retired in
   favour of the company-sourced one. */
type Deal = { company: string; stage: string; tone: StatusTone; value: number; owner: string; idle: number; next: string }
const DEALS: Deal[] = [
  { company: 'Cty Việt Tiến Logistics', stage: 'Negotiation', tone: 'pending', value: 369_900_000, owner: 'Trần Quốc Trung', idle: 21, next: 'Chase signed contract' },
  { company: 'Cty Tinh Hoa Công Nghệ', stage: 'Negotiation', tone: 'pending', value: 111_700_000, owner: 'Nguyễn Thị Lan', idle: 18, next: 'Negotiate discount' },
  { company: 'Cty Vạn Phát', stage: 'Negotiation', tone: 'pending', value: 133_500_000, owner: 'Nguyễn Thị Lan', idle: 12, next: 'Send revised quote' },
  { company: 'Cty Hoàng Gia', stage: 'Proposal', tone: 'neutral', value: 171_100_000, owner: 'Nguyễn Thị Lan', idle: 9, next: 'Follow up on proposal' },
  { company: 'Cty Hồng Đức', stage: 'Qualified', tone: 'neutral', value: 128_000_000, owner: 'Phạm Quang Huy', idle: 6, next: 'Schedule product demo' },
  { company: 'Cty Sao Mai', stage: 'Proposal', tone: 'neutral', value: 98_400_000, owner: 'Phạm Quang Huy', idle: 3, next: 'Prepare proposal' },
  { company: 'Cty Thiên Long', stage: 'Lead', tone: 'draft', value: 476_900_000, owner: 'Trần Quốc Trung', idle: 2, next: 'Qualify budget & need' },
  { company: 'Cty Trường Sơn', stage: 'Won', tone: 'active', value: 231_300_000, owner: 'Phạm Quang Huy', idle: 1, next: 'Activate account' },
  { company: 'Cty Á Châu', stage: 'Lost', tone: 'rejected', value: 115_500_000, owner: 'Nguyễn Thị Lan', idle: 30, next: 'Re-engage next quarter' },
]
const STAGES: { key: string; tone: StatusTone }[] = [
  { key: 'Lead', tone: 'draft' }, { key: 'Qualified', tone: 'neutral' }, { key: 'Proposal', tone: 'neutral' },
  { key: 'Negotiation', tone: 'pending' }, { key: 'Won', tone: 'active' }, { key: 'Lost', tone: 'rejected' },
]
const isOpen = (s: string) => s !== 'Won' && s !== 'Lost'
const money = (v: number) => (v / 1e6).toFixed(1) + 'M ₫'

/** Same flat no-contact thresholds as the Companies list — see idleOf above. */
function IdlePill({ days }: { days: number }) {
  const rot = idleOf(days)
  // On a card there is no column header to carry the meaning, so the pill says it.
  return <Pill tone={rot === 'red' ? 'rejected' : rot === 'amber' ? 'pending' : 'draft'}>Liên hệ {dateBefore(days)}</Pill>
}

function PipelineTable({ onConvert, onOpen }: { onConvert: (d: Deal) => void; onOpen: (d: Deal) => void }) {
  // priority sort: open deals by most-idle-first (rotting), Won/Lost sink to bottom
  const sorted = [...DEALS].sort((a, b) => (isOpen(b.stage) ? b.idle : -1) - (isOpen(a.stage) ? a.idle : -1))
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-muted">Sort: <b className="font-medium text-ink">Priority — most idle first</b> ▾</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-muted">▽ Filter</span>
        <span className="text-faint">by owner · stage · industry · last contact</span>
      </div>
      <Table
        cols={[
          { label: 'Company', w: '2fr' }, { label: 'Stage', w: '1.1fr' }, { label: 'Value', w: '0.9fr', align: 'r' },
          { label: 'Owner', w: '1.2fr' }, { label: 'Last contact', w: '1fr' }, { label: 'Next step', w: '1.6fr' },
        ]}
        rows={sorted.map((d) => [
          <div className="min-w-0">
            <button onClick={() => onOpen(d)} className="block max-w-full truncate text-left font-medium text-brand hover:underline">{d.company}</button>
            {d.stage === 'Won' && (
              <button onClick={() => onConvert(d)} className="mt-1 inline-flex rounded-md bg-emerald-600 px-2 py-0.5 text-[10.5px] font-semibold text-white hover:opacity-90">Convert →</button>
            )}
          </div>,
          <Pill tone={d.tone}>{d.stage}</Pill>,
          <span className="tabular-nums">{money(d.value)}</span>,
          <span className="truncate">{d.owner}</span>,
          <IdlePill days={d.idle} />,
          <span className="truncate text-muted">{d.next}</span>,
        ])}
      />
      <p className="mt-2 text-[11px] text-faint">Default view for long pipelines. Top row = most neglected open deal — work down the list. Idle thresholds are per stage (Negotiation tolerates 21d/45d, Qualified only 7d/14d); closed deals show &quot;—&quot;. Click a company to open the lead.</p>
    </div>
  )
}

function PipelineBoard({ onConvert, onOpen }: { onConvert: (d: Deal) => void; onOpen: (d: Deal) => void }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, minmax(120px,1fr))' }}>
      {STAGES.map((st) => {
        const cards = DEALS.filter((d) => d.stage === st.key)
        const total = cards.reduce((s, d) => s + d.value, 0)
        return (
          <div key={st.key} className="rounded-lg border border-line bg-canvas/40 p-2">
            <div className="mb-1 flex items-center justify-between"><Pill tone={st.tone}>{st.key}</Pill><span className="text-[11px] font-bold text-faint">{cards.length}</span></div>
            <p className="mb-2 text-[10.5px] text-faint tabular-nums">{money(total)}</p>
            {cards.map((d) => (
              <div key={d.company} onClick={() => onOpen(d)} className={cn('mb-1.5 cursor-pointer rounded-md border bg-surface p-2 hover:border-brand', st.key === 'Won' && 'border-emerald-300 ring-1 ring-emerald-200')}>
                <p className="truncate text-[11.5px] font-semibold text-ink">{d.company}</p>
                <p className="text-[10.5px] text-muted tabular-nums">{money(d.value)}</p>
                {st.key === 'Won' && (
                  <button onClick={(e) => { e.stopPropagation(); onConvert(d) }} className="mt-1.5 w-full rounded-md bg-emerald-600 px-2 py-1 text-[10.5px] font-semibold text-white hover:opacity-90">Convert →</button>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/* ── Lead detail (Salesforce-style) ───────────────────────────────────────── */
const PATH = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won']
const NEXT_BY_STAGE: Record<string, string> = {
  Lead: 'Qualify budget, authority & timeline. Confirm the decision-maker.',
  Qualified: 'Book a product demo and send an intro deck within 2 days.',
  Proposal: 'Follow up on the proposal; confirm which products they need.',
  Negotiation: 'Send the revised quote and agree terms — aim to close this week.',
  Won: 'Activate the customer: create the account & provision products.',
  Lost: 'Log the loss reason and set a reminder to re-engage next quarter.',
}


function DetailCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line-soft px-3.5 py-2.5"><p className="text-[12.5px] font-bold">{title}</p>{action}</div>
      <div className="p-3.5">{children}</div>
    </div>
  )
}
function KV({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <p className="text-[10.5px] uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('mt-0.5 text-[12.5px]', link ? 'text-brand' : 'text-ink/85')}>{value}</p>
    </div>
  )
}
function TL({ icon, title, time, sub, tone }: { icon: string; title: string; time: string; sub: string; tone: string }) {
  return (
    <div className="flex gap-2.5">
      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px]', tone)}>{icon}</span>
      <div className="min-w-0 flex-1 border-b border-line-soft pb-3">
        <div className="flex items-center justify-between gap-2"><p className="truncate text-[12.5px] font-medium text-brand">{title}</p><span className="shrink-0 text-[11px] text-faint">{time}</span></div>
        <p className="text-[11.5px] text-muted">{sub}</p>
      </div>
    </div>
  )
}

function LeadDetail({ deal, onBack }: { deal: Deal; onBack: () => void }) {
  useDetailCrumb(deal.company, onBack)
  const ci = PATH.indexOf(deal.stage)
  const [converting, setConverting] = useState(false)
  return (
    <div>

      {/* header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-[16px]"></span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Lead · Company</p>
            <h3 className="text-[19px] font-bold tracking-tight">{deal.company}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Change owner</button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Edit</button>
          <button onClick={() => setConverting(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Convert</button>
        </div>
      </div>

      {/* status path */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto rounded-xl border border-line bg-surface p-1.5">
        <div className="flex flex-1 items-stretch gap-1">
          {PATH.map((s, i) => (
            <div key={s} className={cn('flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-[12px] font-semibold', i < ci ? 'bg-brand-soft text-brand' : i === ci ? 'bg-brand text-white' : 'bg-canvas text-muted')}>
              {i < ci ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>
        {deal.stage === 'Lost'
          ? <Pill tone="rejected">Lost</Pill>
          : deal.stage === 'Won'
            ? <button onClick={() => setConverting(true)} className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90">Convert →</button>
            : <button className="shrink-0 rounded-lg bg-brand px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90">✓ Mark stage complete</button>}
      </div>

      {/* 3 columns */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.95fr)]">
        {/* col 1 — details */}
        <div className="space-y-3">
          <DetailCard title="About (company)">
            <KV label="Legal name" value={deal.company} />
            <KV label="Tax code (MST)" value="0312xxxxxx" />
            <KV label="Industry · Size" value="Logistics · 200–500 staff" />
            <KV label="Website" value="viettien.vn" link />
            <KV label="Notes" value="Multi-branch logistics firm, hiring drivers & ops across 3 cities." />
          </DetailCard>
          <DetailCard title="Sales">
            <KV label="Owner" value={deal.owner} link />
            <KV label="Lead source" value="Referral" />
            <KV label="Estimated value" value={money(deal.value)} />
            <KV label="Stage" value={deal.stage} />
          </DetailCard>
        </div>

        {/* col 2 — activity */}
        <DetailCard
          title="Activity"
          action={<span className="flex gap-1">{['', '', '', ''].map((i) => <span key={i} className="grid h-6 w-6 place-items-center rounded-md border border-line text-[11px] text-muted">{i}</span>)}</span>}
        >
          <p className="mb-3 text-[11px] text-faint">Filters: Within 2 months · All activities · All types</p>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Upcoming &amp; overdue</p>
          <div className="space-y-3">
            <TL icon="" title="Introductory call" time="Feb 16" sub="Upcoming event · 1:30 PM" tone="bg-violet-100 text-violet-700" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">February 2026</p>
            <TL icon="" title="Discovery call" time="Today" sub="You logged a call — 18 min" tone="bg-sky-100 text-sky-700" />
            <TL icon="" title="Send pricing options" time="Today" sub="Task completed" tone="bg-emerald-100 text-emerald-700" />
            <TL icon="" title="Intro & product overview" time="Today" sub="Email sent to Ms. Linh · Opened" tone="bg-amber-100 text-amber-700" />
          </div>
        </DetailCard>

        {/* col 3 — related & next step (recommended) */}
        <div className="space-y-3">
          <div className="rounded-xl border border-brand/30 bg-brand-soft p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand">▶ Next best action</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/85">{NEXT_BY_STAGE[deal.stage]}</p>
          </div>
          <DetailCard title="Contacts" action={<span className="text-[11px] text-brand">+ Add</span>}>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-[12px]"></span>
                <div className="min-w-0"><p className="truncate text-[12.5px] font-semibold">Ms. Vũ Thanh Linh</p><p className="text-[11px] text-muted">HR Manager · decision-maker</p></div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-[12px]"></span>
                <div className="min-w-0"><p className="truncate text-[12.5px] font-semibold">Mr. Lê Quốc Bảo</p><p className="text-[11px] text-muted">Finance · handles PO / invoice</p></div>
              </div>
            </div>
          </DetailCard>
          <DetailCard title="Deal &amp; products">
            <KV label="Estimated value" value={money(deal.value)} />
            <div className="border-b border-line-soft py-2">
              <p className="text-[10.5px] uppercase tracking-wide text-faint">Products interested</p>
              <div className="mt-1 flex flex-wrap gap-1.5"><Pill tone="neutral">Job Posting</Pill><Pill tone="neutral">Resume Search</Pill></div>
            </div>
            <KV label="Latest quote" value="Q-2042 · Sent · 28.5M ₫" link />
          </DetailCard>
          <DetailCard title="On our platform">
            <p className="text-[12px] text-muted">Not yet an account · <b className="text-ink">0</b> jobs posted. Becomes a company account when you <b className="text-ink">Convert</b> it.</p>
          </DetailCard>
        </div>
      </div>

      {converting && <ConvertLeadModal companyName={deal.company} value={deal.value} owner={deal.owner} onClose={() => setConverting(false)} />}
    </div>
  )
}

/* ── Create-lead modal (company-first, adapted from Salesforce) ────────────── */
function LField({ label, req, value, select, hint }: { label: string; req?: boolean; value: string; select?: boolean; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{value}{select && <span className="ml-auto">▾</span>}</div>
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}
function Section({ title, className }: { title: string; className?: string }) {
  return <p className={cn('mt-2 rounded-md bg-canvas/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted', className)}>{title}</p>
}

/** Interactive combobox — pick a suggested option or type a custom value. */
function ComboField({ label, req, value: initial, options, placeholder, onChange }: { label: string; req?: boolean; value?: string; options: string[]; placeholder?: string
  /** report the picked value up, for fields that gate another field (e.g. country → city) */
  onChange?: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(initial ?? '')
  const commit = (v: string) => { setVal(v); onChange?.(v) }
  const isExact = options.some((o) => o.toLowerCase() === val.toLowerCase())
  // exact selection (or empty) → show the whole list; mid-typing → filter
  const matches = isExact || val.length === 0 ? options : options.filter((o) => o.toLowerCase().includes(val.toLowerCase()))
  const isCustom = val.length > 0 && !isExact
  return (
    <div className="relative">
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 focus-within:border-brand">
        <input
          value={val}
          onChange={(e) => { commit(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
        />
        <button type="button" onClick={() => setOpen((o) => !o)} className="ml-2 shrink-0 text-muted">▾</button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-lg">
            {matches.map((o) => (
              <button type="button" key={o} onClick={() => { commit(o); setOpen(false) }} className={cn('block w-full px-3 py-1.5 text-left text-[12px] hover:bg-canvas', o === val ? 'font-medium text-brand' : 'text-ink')}>{o}</button>
            ))}
            {isCustom && (
              <button type="button" onClick={() => setOpen(false)} className="block w-full border-t border-line px-3 py-1.5 text-left text-[12px] text-brand hover:bg-canvas">Use “{val}” (custom)</button>
            )}
            {matches.length === 0 && !isCustom && <p className="px-3 py-1.5 text-[11px] text-faint">Type to add a custom value…</p>}
          </div>
        </>
      )}
    </div>
  )
}
/* ── New quotation (Báo giá) ───────────────────────────────────────────────────
   Modelled on the client's live PDF QUO-009909-07-2026. The load-bearing idea is
   that one quotation carries 1–3 priced OPTIONS which are ALTERNATIVES, not
   add-ons: each totals independently, exactly one gets accepted, and the document
   has no grand total. Everything derived (line totals, VAT, total-after-VAT,
   amount-in-words, benefit lists) is computed here and never typed. */
const QUOTE_CATALOG = [
  { vi: 'Dịch vụ tin đăng (Basic Job)', short: 'Basic Job', unitVi: 'tin', unitEn: 'post', price: 2_710_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag', 'Làm mới bài đăng mỗi 15 ngày'] },
  { vi: 'Dịch vụ tin đăng (Basic Plus Job)', short: 'Basic Plus Job', unitVi: 'tin', unitEn: 'post', price: 6_100_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag', 'Tiêu đề đậm xanh', 'Top Search: ưu tiên trên kết quả tìm kiếm', 'Làm mới bài đăng mỗi 10 ngày', 'Hiển thị tại “Các công ty nổi bật” — Trang chủ'] },
  { vi: 'Dịch vụ tin đăng (Premium Job)', short: 'Premium Job', unitVi: 'tin', unitEn: 'post', price: 9_800_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 05 skill tag', 'Tiêu đề đậm xanh + huy hiệu Premium', 'Top Search + Top Category', 'Làm mới bài đăng mỗi 7 ngày'] },
  { vi: 'Dịch vụ tìm kiếm hồ sơ (30 ngày)', short: 'CV Search 30d', unitVi: 'hồ sơ', unitEn: 'CV', price: 5_500_000, feats: ['Mở tối đa 50 hồ sơ trong 30 ngày', 'Lọc theo kỹ năng, kinh nghiệm, mức lương'] },
  { vi: 'Dịch vụ tìm kiếm hồ sơ (90 ngày)', short: 'CV Search 90d', unitVi: 'hồ sơ', unitEn: 'CV', price: 13_900_000, feats: ['Mở tối đa 200 hồ sơ trong 90 ngày', 'Lọc theo kỹ năng, kinh nghiệm, mức lương'] },
  { vi: 'Employer Branding Page', short: 'EB Page', unitVi: 'gói', unitEn: 'package', price: 15_000_000, feats: ['Trang thương hiệu tuyển dụng riêng', 'Banner + video giới thiệu'] },
]
/* A quotation ALWAYS expires on the last day of the month it was created in —
   not after a fixed number of days. So validity shrinks through the month, and
   every quote raised in a month lapses together. Derived, never typed. */
function endOfMonth(ddmmyyyy: string) {
  const [, mm, yyyy] = ddmmyyyy.split('/').map(Number)
  if (!mm || !yyyy) return '—'
  const last = new Date(yyyy, mm, 0).getDate()
  return `${String(last).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yyyy}`
}
/** Days left on a quotation raised on `created`, as of `today`. */
function daysLeft(created: string, today: string) {
  const p = (d: string) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd) }
  const exp = p(endOfMonth(created))
  const n = Math.round((exp.getTime() - p(today).getTime()) / 86_400_000)
  return n
}
const DISCOUNT_APPROVAL = 20 // % above which a sales lead must approve before Send

const VN_D = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
function vnRead3(n: number, full: boolean) {
  const tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10
  let s = ''
  if (full || tr > 0) s += VN_D[tr] + ' trăm'
  if (ch === 0 && dv > 0) s += ((tr > 0 || full) ? ' lẻ ' : ' ') + VN_D[dv]
  else if (ch === 1) s += ' mười' + (dv > 0 ? ' ' + (dv === 5 ? 'lăm' : VN_D[dv]) : '')
  else if (ch > 1) s += ' ' + VN_D[ch] + ' mươi' + (dv === 1 ? ' một' : dv === 5 ? ' lăm' : dv > 0 ? ' ' + VN_D[dv] : '')
  return s.trim()
}
/** Bằng chữ — the PDF's amount-in-words, generated. 6,588,000 → "Sáu triệu năm trăm tám mươi tám nghìn đồng." */
function vnWords(n: number) {
  if (n <= 0) return 'Không đồng'
  const g: number[] = []
  for (let x = n; x > 0; x = Math.floor(x / 1000)) g.unshift(x % 1000)
  const scales = ['', 'nghìn', 'triệu', 'tỷ']
  const parts = g.map((v, i) => (v === 0 ? '' : (vnRead3(v, i > 0) + ' ' + scales[g.length - 1 - i]).trim())).filter(Boolean)
  const s = parts.join(' ')
  return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng'
}

/** The PDF's English "In words:" line. 6,588,000 → "Six million five hundred
    eighty-eight thousand VND." Same generated-never-typed rule as vnWords. */
const EN_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
function enRead3(n: number): string {
  const h = Math.floor(n / 100), r = n % 100
  const out: string[] = []
  if (h) out.push(`${EN_ONES[h]} hundred`)
  if (r < 20) { if (r) out.push(EN_ONES[r]) }
  else {
    const t = Math.floor(r / 10), u = r % 10
    out.push(u ? `${EN_TENS[t]}-${EN_ONES[u]}` : EN_TENS[t])
  }
  return out.join(' ')
}
function enWords(n: number) {
  if (n <= 0) return 'Zero VND'
  const g: number[] = []
  for (let x = n; x > 0; x = Math.floor(x / 1000)) g.unshift(x % 1000)
  const scales = ['', 'thousand', 'million', 'billion']
  const parts = g.map((v, i) => (v === 0 ? '' : `${enRead3(v)} ${scales[g.length - 1 - i]}`.trim())).filter(Boolean)
  const s = parts.join(' ')
  return s.charAt(0).toUpperCase() + s.slice(1) + ' VND'
}

type QLine = { cat: number; qty: number; price: number; disc: number; gift: boolean }
type QOption = { id: number; lines: QLine[]; recommended: boolean; optDisc: number }
const lineTotal = (l: QLine) => (l.gift ? 0 : Math.round(l.qty * l.price * (1 - l.disc / 100)))
const VAT_RATE = 8

/* ── Tạo PO / Create sales order ───────────────────────────────────────────────
   Raised from ONE accepted quotation option. Nothing is retyped: lines, totals,
   VAT and the VAT-billing block are copied from the quotation, because those are
   what the e-invoice must eventually match. Confirming is the "won" moment for the
   pipeline — but it provisions nothing; only the invoice does (T&C clause 3). */
function CreatePOModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const { quote } = poGate(c)
  const [terms, setTerms] = useState('100% in advance')
  const [poNo, setPoNo] = useState('')
  /* Lines drive the total, never the reverse — quantity × the real catalog price.
     Back-solving a unit price from the deal value produces prices like 5,979,938,
     which is not a figure any catalog would ever quote. */
  const pack = QUOTE_CATALOG[1]
  const unit = pack.price
  const qty = Math.max(1, Math.round(coValue(c) / (1 + VAT_RATE / 100) / unit))
  const sub = qty * unit
  const vat = Math.round(sub * VAT_RATE / 100)
  const total = sub + vat

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[780px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Tạo PO / Create sales order — {coLabel(c)}</p>
            <p className="text-[11px] text-muted">From the accepted quotation option. Lines and billing details are copied, not retyped.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[72vh] space-y-3.5 overflow-y-auto p-5">
          <Section title="Source — the accepted option" className="mt-0" />
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft/40 px-3 py-2 text-[12px]">
            <span className="font-mono font-medium text-brand">{quote}</span>
            <Pill tone="active">Option 2 · accepted</Pill>
            <span className="text-muted">The alternatives the customer did not choose never become orders.</span>
          </div>

          <Section title="Order lines — copied from the option" />
          <div className="overflow-x-auto rounded-lg border border-line">
            <div className="grid min-w-[560px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span>#</span><span>Dịch vụ / Service</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Tổng giá</span>
            </div>
            <div className="grid min-w-[560px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span className="text-faint">1</span><span className="truncate">{pack.vi}</span><span className="text-[11px] text-muted">{pack.unitVi} / {pack.unitEn}</span>
              <span className="tabular-nums">{qty}</span><span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span><span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
            </div>
            <div className="grid min-w-[560px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span className="text-faint">2</span>
              <span className="flex min-w-0 items-center gap-1.5"><span className="truncate">{pack.vi}</span><Pill tone="active">Tặng</Pill></span>
              <span className="text-[11px] text-muted">{pack.unitVi} / {pack.unitEn}</span><span className="tabular-nums">1</span><span className="text-right tabular-nums">0</span><span className="text-right tabular-nums">0</span>
            </div>
          </div>
          <p className="text-[10.5px] text-faint">The gift line carries into the order at 0 ₫ — no revenue, but it is provisioned as real quota once the invoice is issued.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <Section title="VAT billing — snapshot from the quotation" className="mt-0" />
              <LField label="Tên công ty / Legal name" req value={c.legalName} />
              <LField label="Địa chỉ KKD / Billing address" req value={c.address} />
              <LField label="Mã số thuế / Tax code" req value={c.tax} hint="Must match the e-invoice exactly — a mismatch later needs a cancel + re-issue." />
            </div>
            <div className="space-y-3">
              <Section title="Order terms" className="mt-0" />
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Điều khoản thanh toán / Payment terms</label>
                <select value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
                  <option>100% in advance</option><option>50 / 50</option><option>Net 30 after invoice</option>
                </select>
                <p className="mt-1 text-[10.5px] text-faint">Advance is the default — clause 3 activates the service only after payment.</p>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Customer PO number <span className="font-normal text-faint">(optional)</span></label>
                <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="e.g. PO-VP/2026/044" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]" />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">If their procurement issues its own PO, record the number and attach the file. Customers without a procurement process simply confirm the order we send.</p>
              </div>
              <button className="w-full rounded-md border border-dashed border-line py-2 text-[11.5px] text-muted hover:border-ink/40">+ Attach their signed PO / confirmation</button>
            </div>
          </div>

          <div className="ml-auto w-full max-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
            <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
            <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{total.toLocaleString('en-US')} ₫</span></div>
            <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(total)}.</p>
          </div>

          {/* Two consequences, both immediate on issue, and neither of them is
              provisioning — that is the invoice's job. Stated here because this is
              the last screen before the PO exists. */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            <b>Issuing this PO is the “won” moment</b> — the deal moves to the PO stage, and the PO is <b>Active</b> until <b>{endOfMonth('01/07/2026')}</b> (end of the month, same rule as the quotation). It provisions <b>nothing</b>: no account, no quota, no company page. That happens the moment <b>Kế toán</b> issues the VAT e-invoice on it. Customer status stays <b>{c.account ? AC_STATUS[c.account].label : 'Prospect'}</b> until then.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
          {/* No "Save draft": a PO has no draft state — it is Active from the moment
              it is issued, so the only outcomes here are issue it or don't. */}
          <button className="rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">Issue PO →</button>
        </div>
      </div>
    </div>
  )
}

/** Company ID in the same format the Create-job picker uses: "Vạn Phát · CO-0312". */
const coId = (c: Company) => 'CO-' + (c.tax.replace(/\D/g, '').slice(0, 4) || '0000').padEnd(4, '0')
/** A derived value shown as information — deliberately not styled as an input. */
function InfoBit({ label, value, hint, mono }: { label: string; value: string; hint?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('truncate text-[12.5px] font-medium text-ink', mono && 'font-mono')}>{value}</p>
      {hint && <p className="truncate text-[10px] text-faint">{hint}</p>}
    </div>
  )
}
/* Confirmation card — mirrors CompanyInfoCard on Create job. Its job is to let the
   rep verify they picked the right company, and it doubles as the VAT-billing
   read-out: legal name, MST and registered address all print on the invoice, and
   they live on the company record rather than being re-entered per quotation. */
function QuoteCompanyCard({ c }: { c: Company }) {
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()
  return (
    <div className="rounded-lg border border-line bg-canvas/40 p-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-surface text-[12px] font-bold text-brand">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">{coLabel(c)} <span className="text-[11px] font-normal text-muted">· ID {coId(c)}</span></p>
          <p className="truncate text-[11px] text-muted">{c.industry} · {c.size} staff · {c.address}</p>
        </div>
        {/* Customer status only. The pipeline STAGE is a property of the deal, and
            on a quotation the deal's stage is already implied by the quotation's own
            status — two stage-ish badges on one card is one too many. */}
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {c.account && <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-2.5 sm:grid-cols-4">
        <InfoBit label="Tên pháp lý / Legal name" value={c.legalName} hint="prints on the invoice" />
        <InfoBit label="Mã số thuế / Tax code" value={c.tax} mono hint="prints on the invoice" />
        <InfoBit label="Người liên hệ / Contact" value={c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]} hint={c.contact.split(' · ')[1] ?? ''} />
        <InfoBit label="Email" value={`contact@${c.domain}`} hint="send-to address" />
      </div>
    </div>
  )
}

/** `company` pre-selects the record — set when opened from a company detail page,
    left empty when opened from the Quotations list. */
export function NewQuotationModal({ onClose, company: initialCompany = '' }: { onClose: () => void; company?: string }) {
  const today = '29/07/2026'
  const [company, setCompany] = useState(initialCompany)
  const [seq, setSeq] = useState(0)
  const [options, setOptions] = useState<QOption[]>([
    { id: 1, lines: [{ cat: 1, qty: 1, price: QUOTE_CATALOG[1].price, disc: 0, gift: false }, { cat: 1, qty: 1, price: 0, disc: 0, gift: true }], recommended: true, optDisc: 0 },
    { id: 2, lines: [{ cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }, { cat: 0, qty: 1, price: 0, disc: 0, gift: true }], recommended: false, optDisc: 0 },
  ])

  const co = COMPANIES.find((c) => c.name === company)

  /* ── Promotion, applied automatically ──────────────────────────────────────
     The programme follows from the customer's STATUS, so it is decided the moment
     a company is picked — the rep never chooses it. While auto is on the discount
     cells are read-only and show what the programme grants; turning it off is an
     explicit, visible act, because a hand-typed discount is a concession somebody
     has to answer for. */
  const [autoPromo, setAutoPromo] = useState(true)
  const promo = programmeFor(co?.account)
  /* Recompute when the company changes or any quantity moves — those are the only
     two inputs the programmes read. Keyed on a signature rather than on `options`
     so writing the result back cannot re-trigger the effect. */
  const qtySig = options.map((o) => o.lines.map((l) => `${l.gift ? 'g' : 'p'}${l.qty}`).join(',')).join('|')
  useEffect(() => {
    if (!autoPromo || !promo) return
    setOptions((os) => {
      let changed = false
      const next = os.map((o) => {
        // Gifts are 0 ₫, so a discount on them is meaningless — and they must not
        // count against the quantity cap either, or a "+ Gift" would silently
        // destroy the 50%.
        const withinCap = o.lines.every((l) => l.gift || l.qty <= (promo.maxQtyPerLine ?? Infinity))
        // "Cùng loại": the tier is looked up on the TOTAL of that product across the
        // option, so two lines of the same product earn one shared rate. Splitting
        // 7 into 3 + 4 must not turn 30% into 25%.
        const totals = qtyByProduct(o.lines)
        const lines = o.lines.map((l) => {
          const d = l.gift || promo.kind !== 'volume-per-product' ? 0 : tierPct(promo, totals.get(l.cat) ?? 0)
          if (d !== l.disc) changed = true
          return d === l.disc ? l : { ...l, disc: d }
        })
        const od = promo.kind === 'flat-order' && withinCap ? promo.pct ?? 0 : 0
        if (od !== o.optDisc) changed = true
        return changed ? { ...o, lines, optDisc: od } : o
      })
      return changed ? next : os
    })
  }, [autoPromo, promo, qtySig])

  /** Options where a flat programme is being blocked, and the line that blocks it. */
  const capBreaches = promo?.maxQtyPerLine
    ? options.flatMap((o, oi) => o.lines
        .map((l, li) => ({ oi, li, l }))
        .filter((x) => !x.l.gift && x.l.qty > promo.maxQtyPerLine!))
    : []

  // Approval looks at BOTH discount levels — a 30% option-level cut is no less
  // of a concession than a 30% line-level one.
  const maxDisc = Math.max(0, ...options.flatMap((o) => [o.optDisc, ...o.lines.map((l) => l.disc)]))
  /* A rate the PROGRAMME granted is not a concession — management already approved
     it when they set the programme up, and every tier from 25% upward is above the
     threshold. Routing all of them would fill the approval queue with quotations
     nobody would ever reject, and an approval step that is never refused stops
     being read. So the gate fires on what a HUMAN chose: the moment auto-apply is
     switched off, the numbers become the rep's and the normal rule returns. */
  const programmeDriven = autoPromo && !!promo
  const needsApproval = maxDisc > DISCOUNT_APPROVAL && !programmeDriven
  const everyOptionPaid = options.every((o) => o.lines.some((l) => !l.gift && lineTotal(l) > 0))
  const valid = !!co && everyOptionPaid

  const patch = (oid: number, li: number, d: Partial<QLine>) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: o.lines.map((l, i) => (i === li ? { ...l, ...d } : l)) } : o)))
  const addLine = (oid: number) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: [...o.lines, { cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }] } : o)))
  const delLine = (oid: number, li: number) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: o.lines.filter((_, i) => i !== li) } : o)))
  const addOption = () =>
    setOptions((os) => (os.length >= 3 ? os : [...os, { id: Math.max(...os.map((o) => o.id)) + 1, lines: [{ cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }], recommended: false, optDisc: 0 }]))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[1000px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">New quotation · Báo giá</p>
            <p className="text-[11px] text-muted">Bilingual VN/EN proposal. 1–3 priced options in one document — the customer picks one.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[74vh] space-y-3.5 overflow-y-auto p-5">
          {/* 1 · header — every value is derived, so it reads as INFORMATION rather
              than as fields the rep might think they should fill in. */}
          <Section title="1 · Document header — auto" className="mt-0" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-4">
            <InfoBit label="Số báo giá / Quotation no." value={`QUO-00991${seq}-07-2026`} mono hint="Gapless sequence" />
            <InfoBit label="Ngày báo giá / Proposal date" value={today} />
            <InfoBit label="Ngày hết hạn / Expiry date" value={endOfMonth(today)} hint={`cuối tháng · còn ${daysLeft(today, today)} ngày`} />
            <InfoBit label="Báo giá bởi / Proposed by" value="Nguyễn Thị Lan" hint="Signed-in rep" />
          </div>

          {/* 2 · client — pick the company, then confirm it from its own record.
              Billing data (legal name, MST, address) is READ from that record, so
              there is no separate VAT-billing form to keep in sync. */}
          <Section title="2 · Khách hàng / Client" />
          {/* Opened from a company record, the company is already decided — showing a
              picker there invites changing it, which is exactly what must not happen.
              The confirmation card below carries the details either way. */}
          {!initialCompany && (
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">
              Company<span className="text-rose-500"> *</span>
              <span className="ml-2 text-[10.5px] font-normal text-faint">— searchable by name or ID</span>
            </label>
            <select value={company} onChange={(e) => { setCompany(e.target.value); setSeq((s) => (s + 1) % 10) }} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
              <option value="">— Pick a company from the CRM —</option>
              {COMPANIES.map((c) => <option key={c.name} value={c.name}>{coLabel(c)} · {coId(c)}</option>)}
            </select>
          </div>
          )}
          {co
            ? <QuoteCompanyCard c={co} />
            : <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-[11.5px] text-faint">Pick a company to confirm its details, contact and billing data.</p>}

          {/* The programme, stated before the lines rather than discovered in the
              totals. A rep who cannot see WHY a line says 30% will type over it. */}
          {co && (
            promo ? (
              <div className={cn('rounded-xl border px-3.5 py-2.5', autoPromo ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('text-[12.5px] font-semibold', autoPromo ? 'text-emerald-900' : 'text-amber-900')}>
                      {autoPromo ? '🎁 ' : '✎ '}{promo.vi}
                      <span className="ml-1.5 font-normal">· khách hàng <b>{co.account}</b></span>
                    </p>
                    <p className={cn('mt-0.5 text-[11px] leading-relaxed', autoPromo ? 'text-emerald-800' : 'text-amber-800')}>
                      {!autoPromo
                        ? 'Đang nhập chiết khấu thủ công — chương trình không còn được áp dụng tự động.'
                        : promo.kind === 'volume-per-product'
                          ? `Cộng dồn số lượng theo từng loại sản phẩm trong option, rồi lấy bậc tương ứng: ${promo.tiers!.map((t) => `${t.minQty}+ → ${t.pct}%`).join(' · ')}. Số lượng 1 không có chiết khấu.`
                          : `${promo.pct}% trên tổng đơn, với điều kiện mọi dòng ≤ ${promo.maxQtyPerLine} số lượng. Chỉ áp dụng cho PO đầu tiên kể từ khi khách ở trạng thái ${co.account} và không chạy cùng chương trình khác.`}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-ink/70">
                    <input type="checkbox" checked={autoPromo} onChange={(e) => setAutoPromo(e.target.checked)} className="h-3.5 w-3.5" />
                    Áp dụng tự động
                  </label>
                </div>
                {/* Why a 50% went through without an approval step — otherwise the
                    rep assumes the control is broken. */}
                <div className="mt-1.5 text-[10.5px] leading-relaxed">
                  {autoPromo
                    ? <span className="text-emerald-800">Mức này do chương trình cấp nên <b>không cần duyệt</b>, dù vượt {DISCOUNT_APPROVAL}%. Tắt “Áp dụng tự động” là chiết khấu thành do sales tự quyết và phải trình duyệt.</span>
                    : <span className="text-amber-800">Chiết khấu thủ công — vượt {DISCOUNT_APPROVAL}% sẽ phải trình sales lead duyệt trước khi gửi.</span>}
                </div>

                {/* The cliff, named. "One line over and the whole 50% is gone" is
                    the rule reps get wrong, so it points at the exact line and
                    repeats the sheet's own two ways out. */}
                {autoPromo && capBreaches.length > 0 && (
                  <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] leading-relaxed text-rose-900">
                    <b>Mất toàn bộ {promo.pct}%.</b>{' '}
                    {capBreaches.map((x) => `Option ${x.oi + 1} · dòng ${x.li + 1} (${QUOTE_CATALOG[x.l.cat].vi}) có số lượng ${x.l.qty}`).join(' · ')} — vượt giới hạn {promo.maxQtyPerLine}.
                    Chỉ cần một dòng vượt là cả đơn mất chiết khấu, không phải riêng dòng đó.
                    <br />
                    <span className="text-rose-800">Hai cách xử lý theo quy định: giảm số lượng về {promo.maxQtyPerLine}, hoặc <b>tách 2 báo giá / 2 hóa đơn</b> để khách hưởng cả hai chương trình. Cả hai đều do sales quyết định — hệ thống không tự tách.</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-line bg-canvas/50 px-3.5 py-2.5 text-[11.5px] text-muted">
                Không có chương trình khuyến mãi nào áp dụng cho khách hàng <b className="text-ink/75">{co.account}</b>. Chiết khấu nhập tay và cần duyệt nếu vượt {DISCOUNT_APPROVAL}%.
              </p>
            )
          )}

          {/* 3 · options — the heart of it */}
          <Section title="3 · Options — alternatives, not add-ons" />
          {options.map((o, oi) => {
            /* Two discount levels, applied in order: per-line first, then a single
               option-level discount on the subtotal. VAT is charged on what is left,
               so the option discount must land BEFORE the VAT line, not after. */
            const sub = o.lines.reduce((s, l) => s + lineTotal(l), 0)
            const optCut = Math.round(sub * o.optDisc / 100)
            const net = sub - optCut
            const vat = Math.round(net * VAT_RATE / 100)
            return (
              <div key={o.id} className={cn('rounded-xl border p-3', o.recommended ? 'border-brand/40 bg-brand-soft/30' : 'border-line')}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold">
                    Option {oi + 1}
                    <span className="ml-1.5 font-normal text-muted">{o.lines.map((l) => QUOTE_CATALOG[l.cat].vi + (l.gift ? ' (Tặng)' : '')).join(' + ')}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-ink/80">
                      <input type="radio" name="rec" checked={o.recommended} onChange={() => setOptions((os) => os.map((x) => ({ ...x, recommended: x.id === o.id })))} className="h-3 w-3" />
                      Recommended
                    </label>
                    {options.length > 1 && (
                      <button onClick={() => setOptions((os) => os.filter((x) => x.id !== o.id))} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted hover:border-rose-300 hover:text-rose-600">Remove</button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-line">
                  <div className="grid min-w-[720px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.2fr 0.7fr 0.5fr 1fr 0.6fr 1fr 24px' }}>
                    <span>#</span><span>Dịch vụ / Service</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Giảm</span><span className="text-right">Tổng giá</span><span />
                  </div>
                  {o.lines.map((l, li) => (
                    <div key={li} className="grid min-w-[720px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.2fr 0.7fr 0.5fr 1fr 0.6fr 1fr 24px' }}>
                      <span className="text-faint">{li + 1}</span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <select value={l.cat} onChange={(e) => { const c = Number(e.target.value); patch(o.id, li, { cat: c, price: l.gift ? 0 : QUOTE_CATALOG[c].price }) }} className="min-w-0 flex-1 truncate rounded border border-line bg-surface px-1.5 py-1 text-[11.5px]">
                          {QUOTE_CATALOG.map((p, i) => <option key={i} value={i}>{p.vi}</option>)}
                        </select>
                        {l.gift && <Pill tone="active">Tặng</Pill>}
                      </span>
                      <span className="text-[11px] text-muted">{QUOTE_CATALOG[l.cat].unitVi} / {QUOTE_CATALOG[l.cat].unitEn}</span>
                      <input type="number" min={1} value={l.qty} onChange={(e) => patch(o.id, li, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-full rounded border border-line bg-surface px-1 py-1 text-right text-[11.5px] tabular-nums" />
                      <input disabled={l.gift} value={l.gift ? '0' : l.price.toLocaleString('en-US')} onChange={(e) => patch(o.id, li, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} className={cn('w-full rounded border border-line px-1 py-1 text-right text-[11.5px] tabular-nums', l.gift ? 'bg-canvas text-faint' : 'bg-surface')} />
                      <span className="flex items-center justify-end gap-0.5">
                        {/* Read-only while the programme is driving it: the number
                            is a consequence of the quantity, and an editable box
                            invites overwriting the rule the customer was promised. */}
                        <input disabled={l.gift || (autoPromo && !!promo)} type="number" min={0} max={100} value={l.disc} onChange={(e) => patch(o.id, li, { disc: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} className={cn('w-11 rounded border px-1 py-1 text-right text-[11.5px] tabular-nums', l.disc > DISCOUNT_APPROVAL ? 'border-amber-400 bg-amber-50 text-amber-900' : autoPromo && promo && l.disc > 0 ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800' : 'border-line bg-surface', l.gift && 'bg-canvas text-faint')} />
                        <span className="text-[10.5px] text-faint">%</span>
                      </span>
                      <span className="text-right tabular-nums">{lineTotal(l).toLocaleString('en-US')}</span>
                      {o.lines.length > 1
                        ? <button onClick={() => delLine(o.id, li)} className="text-[12px] text-faint hover:text-rose-600">✕</button>
                        : <span />}
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => addLine(o.id)} className="rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">+ Line item</button>
                    <button onClick={() => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, lines: [...x.lines, { cat: x.lines[0].cat, qty: 1, price: 0, disc: 0, gift: true }] } : x)))} className="rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">+ Gift (Tặng)</button>
                  </div>
                  <div className="min-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
                    <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
                    {/* Applies to the whole option — on the subtotal, before VAT */}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted">
                        Chiết khấu
                        <input type="number" min={0} max={100} value={o.optDisc} disabled={autoPromo && !!promo}
                          onChange={(e) => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, optDisc: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x)))}
                          className={cn('w-12 rounded border px-1 py-0.5 text-right text-[11.5px] tabular-nums', o.optDisc > DISCOUNT_APPROVAL ? 'border-amber-400 bg-amber-50 text-amber-900' : autoPromo && promo && o.optDisc > 0 ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800' : 'border-line bg-surface')} />
                        <span className="text-[10.5px] text-faint">%</span>
                      </span>
                      <span className={cn('tabular-nums', optCut > 0 && 'text-rose-600')}>{optCut > 0 ? '−' : ''}{optCut.toLocaleString('en-US')} ₫</span>
                    </div>
                    {o.optDisc > 0 && <div className="flex justify-between"><span className="text-muted">Sau chiết khấu</span><span className="tabular-nums">{net.toLocaleString('en-US')} ₫</span></div>}
                    <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
                    <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{(net + vat).toLocaleString('en-US')} ₫</span></div>
                    <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(net + vat)}.</p>
                  </div>
                </div>

              </div>
            )
          })}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={addOption} disabled={options.length >= 3} className={cn('rounded-lg border px-3 py-1.5 text-[12px] font-medium', options.length >= 3 ? 'border-line text-faint' : 'border-brand/40 text-brand hover:bg-brand-soft')}>
              + Add option {options.length >= 3 && '(max 3)'}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Internal note — not printed</label>
            <textarea rows={2} placeholder="Why this pricing, what the customer asked for…" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]" />
          </div>
        </div>

        {/* footer */}
        <div className="space-y-2 border-t border-line px-5 py-3">
          {needsApproval && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-900">
              A {maxDisc}% discount exceeds the {DISCOUNT_APPROVAL}% threshold — Send is blocked until a sales lead approves. Save as draft and request approval.
            </div>
          )}
          {!everyOptionPaid && <p className="text-[11.5px] text-rose-600">Every option needs at least one paid line — an option cannot be gifts only.</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
            <button disabled={!co} className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', co ? 'border-line text-ink hover:border-ink/40' : 'border-line text-faint')}>Save draft</button>
            <button disabled={!valid} className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', valid ? 'border-brand/40 text-brand hover:bg-brand-soft' : 'border-line text-faint')}>Preview PDF</button>
            {/* Over-threshold discount blocks SEND, but must not block the action that
                unblocks it — the rep needs to be able to request the approval. */}
            <button disabled={!valid} className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', !valid ? 'bg-line' : needsApproval ? 'bg-amber-600 hover:opacity-90' : 'bg-brand hover:opacity-90')}>
              {needsApproval ? 'Request approval →' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Companies sharing the first 10 digits of a tax code — the same legal entity's
   branches, or genuinely unrelated companies that happen to collide. The form does
   NOT decide which; it lists them and lets the rep link. */
const MST_ROOT_MATCHES = [
  { name: 'Công ty CP Trường Sơn', tax: '0328xxxxxx', owner: 'Nguyễn Thị Lan', where: 'Đà Nẵng', status: 'Existing' },
  { name: 'CN Trường Sơn — Hà Nội', tax: '0328xxxxxx-001', owner: 'Phạm Quang Huy', where: 'Long Biên, Hà Nội', status: 'Existing' },
  { name: 'CN Trường Sơn — Cần Thơ', tax: '0328xxxxxx-002', owner: 'Trần Quốc Trung', where: 'Ninh Kiều, Cần Thơ', status: 'New' },
]

/** One row of the MST-root suggestion list, with its two link directions. */
function MstMatchRow({ m, rel, onSet }: {
  m: typeof MST_ROOT_MATCHES[number]
  rel: 'none' | 'parent' | 'child'
  onSet: (r: 'none' | 'parent' | 'child') => void
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2', rel === 'none' ? 'border-line bg-surface' : 'border-brand/40 bg-brand-soft/50')}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-ink">{m.name}</p>
        <p className="truncate text-[10.5px] text-faint">MST {m.tax} · {m.where} · {m.owner}</p>
      </div>
      {/* Two directions, and they have different cardinality on purpose: the new
          company has at most ONE parent, but can be the parent of MANY of these. */}
      <div className="flex shrink-0 overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
        <button onClick={() => onSet(rel === 'child' ? 'none' : 'child')} className={cn('px-2 py-1', rel === 'child' ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')} title="Công ty đang tạo là công ty con của công ty này">↑ Là con của</button>
        <button onClick={() => onSet(rel === 'parent' ? 'none' : 'parent')} className={cn('border-l border-line px-2 py-1', rel === 'parent' ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')} title="Công ty đang tạo là công ty mẹ của công ty này">↓ Là mẹ của</button>
      </div>
    </div>
  )
}

/**
 * New-company screen — a full page, not a modal: it is long enough that a rep needs
 * the whole viewport, and it can be linked to and reloaded.
 *
 * `lockedParent` pre-fills the parent as a fixed row. Nothing sets it today: the
 * "+ Thêm công ty con" shortcut was removed so that every company is created
 * through this one page and passes the same MST duplicate check — a second create
 * path is a second way to make a duplicate. The prop stays because the linked-from-
 * parent flow is a plausible addition; the group link itself is made with
 * "Gán quan hệ mẹ / con" on the company record.
 */
function CompanyCreatePage({ onBack, lockedParent }: { onBack: () => void; lockedParent?: Company }) {
  useDetailCrumb(lockedParent ? `Thêm công ty con · ${coLabel(lockedParent)}` : 'New company', onBack)
  /* Quốc tịch drives whether the Vietnamese province picker is shown at all. */
  const [country, setCountry] = useState('Việt Nam')
  const [tax, setTax] = useState('')
  const [looking, setLooking] = useState(false)
  const [looked, setLooked] = useState(false)
  /* Which of the same-tax-root companies this new record links to, and in which
     direction. Keyed by company name; at most one 'child' entry can exist. */
  const [rels, setRels] = useState<Record<string, 'none' | 'parent' | 'child'>>({})
  const [docs, setDocs] = useState<string[]>([])
  const isVN = country.trim().toLowerCase().startsWith('việt nam') || country.trim().toLowerCase() === 'vietnam'
  const rootHit = tax.replace(/\D/g, '').length >= 10
  const parentPick = Object.entries(rels).find(([, r]) => r === 'child')?.[0]
  const childPicks = Object.entries(rels).filter(([, r]) => r === 'parent').map(([n]) => n)

  const setRel = (name: string, r: 'none' | 'parent' | 'child') =>
    setRels((prev) => {
      const next = { ...prev }
      // only ONE parent is possible, so choosing a new one releases the old
      if (r === 'child') for (const k of Object.keys(next)) if (next[k] === 'child') next[k] = 'none'
      next[name] = r
      return next
    })

  const lookup = () => {
    setLooking(true)
    window.setTimeout(() => { setLooking(false); setLooked(true) }, 700)
  }

  return (
    <div className="max-w-[860px] pb-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-tight">{lockedParent ? 'Thêm công ty con' : 'New company'}</h2>
        <Pill tone="draft">Draft</Pill>
      </div>

      <div className="space-y-8">
        <JobGroup title="Company information">
          <LField label="Legal name" req value="Công ty TNHH …" />
          <div className="grid grid-cols-2 gap-3">
            <LField label="Short name" value="e.g. FPT, Tiki, NEC" hint="Display / brand name — shown on the pipeline & company page." />
            {/* MST first-class: it is the key the whole dedup + affiliate flow hangs
                off, and the lookup that can fill the rest of this section. */}
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Tax code (MST) <span className="text-rose-500">*</span></label>
              <div className="flex gap-1.5">
                <input value={tax} onChange={(e) => { setTax(e.target.value); setLooked(false) }} placeholder="0328xxxxxx-001" className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
                <button onClick={lookup} disabled={!rootHit || looking} className={cn('shrink-0 rounded-md px-2.5 py-2 text-[11.5px] font-semibold', rootHit && !looking ? 'bg-brand text-white hover:opacity-90' : 'cursor-not-allowed bg-canvas text-faint')}>
                  {looking ? 'Đang tra…' : 'Tra cứu'}
                </button>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">10 số, hoặc 10 số + “-001” nếu là chi nhánh.</p>
            </div>
          </div>

          {looked && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-emerald-900">
              <p className="font-semibold">✓ Đã lấy thông tin từ cơ quan thuế</p>
              <p className="mt-1">Tên pháp lý, địa chỉ đăng ký và ngành nghề đã được điền. <b>Rep vẫn sửa được</b> — dữ liệu đăng ký thường là địa chỉ trụ sở, không phải nơi làm việc thực tế.</p>
            </div>
          )}

          {/* The MST-root list, in place of a blocking warning: same first 10 digits
              means "probably related", never "duplicate". The rep links it, or not. */}
          {rootHit && (
            <div className="rounded-lg border border-line bg-canvas/50 p-3">
              <p className="text-[12px] font-semibold text-ink">Có {MST_ROOT_MATCHES.length} công ty trùng 10 số gốc MST</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">Trùng gốc thường là cùng một pháp nhân — chi nhánh hoặc công ty con. Chọn hướng liên kết cho từng công ty, hoặc bỏ qua nếu không liên quan. <b className="text-ink/70">Không bắt buộc</b> và không chặn lưu.</p>
              <div className="mt-2 space-y-1.5">
                {MST_ROOT_MATCHES.map((m) => (
                  <MstMatchRow key={m.name} m={m} rel={rels[m.name] ?? 'none'} onSet={(r) => setRel(m.name, r)} />
                ))}
              </div>
              {(parentPick || childPicks.length > 0) && (
                <div className="mt-2 rounded-md border border-brand/30 bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">
                  <b>Sẽ liên kết:</b>
                  {parentPick && <> công ty con của <b>{parentPick}</b>.</>}
                  {childPicks.length > 0 && <> công ty mẹ của <b>{childPicks.join(', ')}</b>.</>}
                  <span className="block text-brand/70">Liên kết chỉ để tra cứu — MST, hợp đồng, quota, hoá đơn và sales phụ trách vẫn riêng của từng công ty.</span>
                  {/* Both directions at once is legal (a middle layer of a group) but
                      it is also the only way to describe a loop, so say when it is checked. */}
                  {parentPick && childPicks.length > 0 && (
                    <span className="mt-1 block rounded bg-amber-100 px-1.5 py-1 text-amber-900">Công ty này sẽ nằm giữa hai tầng. Hệ thống kiểm tra liên kết vòng khi lưu — nếu công ty mẹ đã nằm dưới một trong các công ty con, liên kết sẽ bị từ chối.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {lockedParent && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Công ty mẹ</label>
              <div className="flex items-center gap-2 rounded-md border border-brand/30 bg-brand-soft px-3 py-2 text-[12.5px] text-brand">
                <span className="min-w-0 truncate font-medium">{coLabel(lockedParent)}</span>
                <span className="shrink-0 text-[10.5px] text-brand/70">MST {lockedParent.tax}</span>
                <span className="ml-auto shrink-0 rounded border border-brand/30 px-1.5 py-0.5 text-[10px] font-medium">Đã cố định</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <LField label="Industry" value="IT / Software" select />
            <LField label="Company size" value="100–499 staff" select />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Company tags</label>
            <CompanyTagPicker />
          </div>
          {/* Quốc tịch gates the province picker: a Vietnamese company gets the
              63-province list, a foreign one does not (its city goes in Address). */}
          <ComboField
            label="Quốc tịch / Country"
            value={country}
            onChange={setCountry}
            placeholder="Select a country…"
            options={MD_DOMAINS.find((d) => d.key === 'country')?.entries ?? ['Việt Nam']}
          />
          {isVN ? (
            <LField label="Tỉnh / Thành phố · City" value="Hồ Chí Minh" select hint="Vietnamese province or city of the head office — from Master data → Locations." />
          ) : (
            <p className="rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
              Không phải công ty Việt Nam nên <b className="text-ink">không chọn Tỉnh / Thành phố</b> — ghi thành phố vào Address bên dưới.
            </p>
          )}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Address</label>
            <div className="flex gap-1.5">
              <div className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{isVN ? 'Số nhà, tên đường, phường/xã, quận/huyện' : 'Street, city, postal code, country'}</div>
              {/* Optional: pick the address on a map so the pin is stored alongside
                  the text. Sales use it to find the office; the printed documents
                  still use the typed address. */}
              <button className="shrink-0 rounded-md border border-line px-2.5 py-2 text-[11.5px] font-medium text-muted hover:border-brand hover:text-brand">Chọn trên bản đồ</button>
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Địa chỉ trụ sở — in trên báo giá, đơn hàng và hoá đơn. Bắt buộc với mọi quốc gia. Chọn trên bản đồ để lưu kèm toạ độ (tuỳ chọn).</p>
          </div>
          <LField label="Website" value="company.vn" />
        </JobGroup>

        {/* Uploaded at creation because it is what proves the MST belongs to them —
            the same document Accounting will want before the first VAT invoice. */}
        <JobGroup title="Company verification document">
          <div>
            <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-4 text-center">
              <p className="text-[12px] font-medium text-ink">Kéo thả hoặc <button onClick={() => setDocs((d) => [...d, `giay-phep-kinh-doanh-${d.length + 1}.pdf`])} className="text-brand hover:underline">chọn tệp</button></p>
              <p className="mt-0.5 text-[10.5px] text-faint">Giấy phép kinh doanh · Giấy chứng nhận đăng ký thuế · Hợp đồng đã ký. PDF, JPG, PNG — tối đa 10MB mỗi tệp.</p>
            </div>
            {docs.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {docs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
                    <span className="text-[13px]"></span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink/80">{d}</span>
                    <button onClick={() => setDocs((p) => p.filter((_, j) => j !== i))} className="text-[11px] text-faint hover:text-ink">✕</button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">Không bắt buộc lúc tạo — có thể tải lên bất cứ lúc nào từ hồ sơ công ty.</p>
          </div>
        </JobGroup>

        <JobGroup title="Primary contact">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Contact name" req value="Họ và tên" />
            <ComboField label="Title" value="HR Manager" placeholder="Select or type a title…" options={['HR Manager', 'HR Director', 'Talent Acquisition', 'Recruiter', 'CEO / Founder', 'Office Manager']} />
          </div>
          {/* Both required: a contact nobody can reach is not a contact. */}
          <div className="grid grid-cols-2 gap-3">
            <LField label="Phone" req value="09xx xxx xxx" />
            <LField label="Email" req value="hr@company.vn" />
          </div>
        </JobGroup>

        <JobGroup title="Sales">
          <div className="grid grid-cols-2 gap-3">
            <ComboField label="Lead source" value="Website sign-up" placeholder="Select or type…" options={['Website sign-up', 'Inbound call', 'Referral', 'Event / job fair', 'Outbound', 'Partner']} />
            <LField label="Sales owner" value="Nguyễn Thị Lan" select />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Products interested</label>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> Job Posting</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Resume Search</span>
            </div>
          </div>
          <LField label="Estimated deal value (₫)" value="0" />
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Description</label>
            <div className="h-16 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">How we heard about them, need, next step…</div>
          </div>
        </JobGroup>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <button onClick={onBack} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
        <button onClick={onBack} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Save company</button>
      </div>
    </div>
  )
}

/* ── Convert-lead modal (adapted from Salesforce) ─────────────────────────── */
function Radio({ on }: { on?: boolean }) {
  return <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand' : 'border-line')}>{on && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
}
function ConvertLeadModal({ companyName, value, owner, onClose }: { companyName: string; value: number; owner: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[760px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Convert to customer — {companyName}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[72vh] space-y-3 overflow-y-auto p-5">
          <div className="flex gap-2.5 rounded-lg bg-brand-soft px-3.5 py-3 text-[12px] leading-relaxed text-brand">
            <span></span>
            <div>Converting creates the <b>company account</b> + its <b>first user login</b>, and provisions the <b>products</b> they bought. If the company already exists (e.g. it self-signed up), link it instead to avoid a duplicate.</div>
          </div>

          {/* Account */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">Account <span className="font-normal text-faint">(the company)</span></p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <div className="rounded-lg border border-brand bg-brand-soft/40 p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-brand"><Radio on /> Create new account</div>
                <LField label="Account name" req value={companyName} />
              </div>
              <div className="flex items-center justify-center text-[11px] font-semibold text-faint">— OR —</div>
              <div className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-muted"><Radio /> Choose existing account</div>
                <div className="flex items-center rounded-md border border-line px-3 py-2 text-[12px] text-faint">Search by name / tax code <span className="ml-auto"></span></div>
                <p className="mt-2 rounded-md bg-canvas/60 px-2 py-2.5 text-center text-[11px] text-faint">0 matches — checked by tax code (dedup)</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">Contact <span className="font-normal text-faint">(→ first user login)</span></p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <div className="rounded-lg border border-brand bg-brand-soft/40 p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-brand"><Radio on /> Create new contact</div>
                <LField label="Name · title" value="Ms. Vũ Thanh Linh · HR Manager" />
                <p className="mt-1.5 text-[11px] text-muted">Gets the login as HR Manager (super admin).</p>
              </div>
              <div className="flex items-center justify-center text-[11px] font-semibold text-faint">— OR —</div>
              <div className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-muted"><Radio /> Choose existing contact</div>
                <p className="rounded-md bg-canvas/60 px-2 py-2.5 text-center text-[11px] text-faint">0 matches detected</p>
              </div>
            </div>
          </div>

          {/* Products (our version of "Opportunity") */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">Products <span className="font-normal text-faint">(provisioned as quota on convert)</span></p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> Job Posting — 10 slots</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> Resume Search — 100 unlocks</span>
            </div>
            <label className="mt-2.5 flex items-center gap-2 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Don’t provision yet (activate later)</label>
            <p className="mt-2 text-[11px] text-amber-700">Job Posting is selected → a public company page will be required after convert.</p>
            <p className="mt-1 text-[11px] text-faint">From <b className="text-ink/70">{companyName}</b> · {money(value)} · Quote Q-2042</p>
          </div>

          {/* owner + status */}
          <div className="grid gap-3 md:grid-cols-2">
            <LField label="Record owner" req value={owner} select />
            <LField label="Converted status" req value="Active customer" select />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Convert</button>
        </div>
      </div>
    </div>
  )
}

export function AdminPipeline({ onActivate }: { onActivate?: () => void } = {}) {
  const [view, setView] = useState<'table' | 'board'>('table')
  const [openLead, setOpenLead] = useState<Deal | null>(null)
  const [convertDeal, setConvertDeal] = useState<Deal | null>(null)
  const [creating, setCreating] = useState(false)

  if (openLead) return <LeadDetail deal={openLead} onBack={() => setOpenLead(null)} />
  if (creating) return <CompanyCreatePage onBack={() => setCreating(false)} />

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* view toggle — table is the default for long pipelines */}
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
          <button onClick={() => setView('table')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'table' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>☰ Table</button>
          <button onClick={() => setView('board')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'board' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>▦ Board</button>
        </div>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New lead</button>
      </div>

      {view === 'table' ? <PipelineTable onConvert={setConvertDeal} onOpen={setOpenLead} /> : <PipelineBoard onConvert={setConvertDeal} onOpen={setOpenLead} />}

      {/* Hand-off banner — the entry point to the activation walkthrough, and ONLY
          that. Rendered only when a caller supplies onActivate (the admin wireframe).
          On a requirement page nobody passes it, where the banner was a dead CTA
          plus a hard-coded storyboard line about one specific company. */}
      {onActivate && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-[16px]"></span>
          <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-emerald-800">
            <b>“Cty Trường Sơn” is Won.</b> The pipeline ends here. Next you <b>activate the customer</b> — create the account, choose products, and (for Job Posting) build the company page. This hands the customer off to <b>Account management</b>.
          </p>
          <button onClick={onActivate} className="shrink-0 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Activate customer →</button>
        </div>
      )}

      {convertDeal && <ConvertLeadModal companyName={convertDeal.company} value={convertDeal.value} owner={convertDeal.owner} onClose={() => setConvertDeal(null)} />}
    </div>
  )
}
/* Quote-to-cash, in the order it actually happens:
   Quotation (1–3 options) → Sales order / PO (confirm = won) → Payment
   (Accounting confirms) → VAT e-invoice (issue = closed + provisioning released). */
/* FOUR statuses only: Draft · Sent · Issued to PO · Expired. Everything that used
   to be its own status is a FLAG on one of these — discount approval is a gate on
   Draft, an accepted option is recorded on a Sent quote until the PO exists, a
   revision is a version (v2) not a status, and a lapsed offer is Sent + expired
   validity. The flags live in the data and surface on the DETAIL page; the list
   stays scannable and shows the status pill alone. */
type QuoteStatus = 'Draft' | 'Sent' | 'Issued to PO' | 'Expired'
/* Expiry first by default: every quotation dies at month-end, so "what runs out
   soonest" is the only ordering that tells a rep what to chase today. */
type QuoteSort = 'expires' | 'created' | 'value'
const QUOTE_SORTS: Record<QuoteSort, { label: string; cmp: (a: Quote, b: Quote) => number }> = {
  expires: { label: 'Sắp hết hạn trước', cmp: (a, b) => dmy(a.expires) - dmy(b.expires) },
  created: { label: 'Mới tạo trước', cmp: (a, b) => dmy(b.created) - dmy(a.created) },
  value: { label: 'Giá trị cao nhất', cmp: (a, b) => b.value - a.value },
}
/** "20/07/2026" → a sortable number. A dash (no date) sorts last. */
function dmy(d: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d.trim())
  return m ? Number(m[3] + m[2] + m[1]) : Number.MAX_SAFE_INTEGER
}

type Quote = {
  code: string; customer: string; co?: string; products: number[]; options: number
  value: number; status: QuoteStatus; created: string; expires: string
  acceptedOpt?: number; lapsed?: boolean; awaitingApproval?: boolean; note?: string
}
const QUOTE_TONE: Record<QuoteStatus, StatusTone> = { Draft: 'draft', Sent: 'pending', 'Issued to PO': 'active', Expired: 'expired' }
const QUOTES: Quote[] = [
  /* Three options — Basic Plus (the one we RECOMMEND), Basic as the cheaper
     alternative, Premium as the upsell. The client's own file had two; a third is
     the case the document has to prove it handles, since the rule is 1–3
     ALTERNATIVES that are never summed.
     value = 10,584,000 = the HIGHEST option (Premium), per the documented rule —
     NOT the recommended one. This row is deliberately the worked example of the
     open question in the spec: recommended ≠ highest, and the two give different
     pipeline totals. */
  { code: 'QUO-009909-07-2026', customer: 'AM Software Việt Nam', co: 'Công ty TNHH AM Software Việt Nam', products: [1, 0, 2], options: 3, value: 10_584_000, status: 'Sent', created: '20/07/2026', expires: '31/07/2026' },
  { code: 'QUO-009908-07-2026', customer: 'Công ty Vạn Phát', co: 'Công ty TNHH Vạn Phát', products: [1, 4], options: 3, value: 37_800_000, status: 'Sent', created: '14/07/2026', expires: '31/07/2026', acceptedOpt: 2, note: 'Customer confirmed Option 2 by email.' },
  { code: 'QUO-009907-07-2026', customer: 'Hoàng Gia', products: [2], options: 1, value: 131_429_662, status: 'Issued to PO', created: '30/06/2026', expires: '30/06/2026', acceptedOpt: 1 },
  { code: 'QUO-009906-06-2026', customer: 'Việt Tiến Logistics', co: 'Công ty TNHH Việt Tiến', products: [0, 3], options: 2, value: 28_536_925, status: 'Sent', created: '16/06/2026', expires: '30/06/2026', lapsed: true, note: 'Went quiet after pricing. Extend or re-issue as v2.' },
  { code: 'QUO-009904-05-2026', customer: 'Tinh Hoa (v1)', products: [1], options: 2, value: 58_900_000, status: 'Expired', created: '17/05/2026', expires: '31/05/2026', note: 'Replaced by v2 — QUO-009905-06-2026.' },
  { code: 'QUO-009905-06-2026', customer: 'Tinh Hoa', products: [1, 5], options: 2, value: 60_206_698, status: 'Draft', created: '28/07/2026', expires: '31/07/2026', awaitingApproval: true, note: '25% discount — needs sales-lead approval before it can be sent.' },
]
/** Products, compactly: first name + "+N" when there are more. Full list on hover. */
function ProductCell({ ids }: { ids: number[] }) {
  if (!ids.length) return <span className="text-faint">—</span>
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={ids.map((i) => QUOTE_CATALOG[i].vi).join(' · ')}>
      <span className="truncate">{QUOTE_CATALOG[ids[0]].short}</span>
      {ids.length > 1 && <span className="shrink-0 rounded border border-line bg-canvas px-1 text-[10px] text-muted">+{ids.length - 1}</span>}
    </span>
  )
}

/* ── Export quotation to PDF ───────────────────────────────────────────────────
   The document the customer actually receives. Content is a faithful reproduction
   of the client's live PDF (EST-009909-07-2026) — every block, every field, both
   languages, nothing added and nothing dropped. What is REFINED here is only the
   presentation:

     · bilingual pairs are stacked (VN primary, EN muted underneath) instead of
       being run together on one line — the single biggest readability win;
     · the two customer blocks become side-by-side cards instead of wrapped prose;
     · line tables get real columns, tabular figures and right-aligned money;
     · each option is a self-contained card with its own totals box, because the
       options are ALTERNATIVES and the document must never look like it sums;
     · terms become numbered clauses with a VN/EN pair each.

   Everything printed is derived (line totals, VAT, total-after-VAT, amount in
   words, benefit lists) — see the "What prints on the page" spec section. */
const ISSUER = {
  nameVi: 'CÔNG TY TNHH DAOUKIWOOM INNOVATION',
  nameEn: 'DAOUKIWOOM INNOVATION COMPANY LIMITED',
  addrVi: 'Tầng 12, 13 & 14, Tòa nhà AP, 518B Điện Biên Phủ, Phường Thạnh Mỹ Tây, Thành phố Hồ Chí Minh, Việt Nam',
  addrEn: 'Level 12, 13 & 14, AP Tower, 518B Dien Bien Phu Street, Thanh My Tay Ward, Ho Chi Minh City, Vietnam',
  web: 'https://topdev.vn',
  support: 'customercare@topdev.vn',
  brand: 'TopDev',
}

/** One bilingual label: Vietnamese leads, English sits under it, muted. */
function Bi({ vi, en, className, enClass }: { vi: string; en: string; className?: string; enClass?: string }) {
  return (
    <span className={cn('block', className)}>
      <span className="block">{vi}</span>
      <span className={cn('block text-[0.85em] font-normal italic text-slate-500', enClass)}>{en}</span>
    </span>
  )
}

const pdfNum = (n: number) => n.toLocaleString('en-US')
/** "20/07/2026" → "Ngày 20 tháng 07 năm 2026 / July 20th, 2026" */
function signDate(d: string) {
  const [dd, mm, yyyy] = d.split('/')
  const EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const n = Number(dd)
  const ord = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return { vi: `Ngày ${dd} tháng ${mm} năm ${yyyy}`, en: `${EN[Number(mm) - 1]} ${n}${ord}, ${yyyy}` }
}

/* T&C — verbatim from the client's PDF, split into VN/EN pairs so each clause can
   be read in one language without the other interleaved. Six clauses, in order. */
const QUOTE_TERMS: { vi: string[]; en: string[] }[] = [
  { vi: ['Giá đã bao gồm 8% thuế VAT.'], en: ['Price is inclusive of 8% VAT.'] },
  {
    vi: ['Báo giá bao gồm chính sách chiết khấu, ưu đãi và quà tặng có hiệu lực áp dụng cho khách hàng đến hết ngày hết hạn được đề cập phía trên. Sau thời gian này, các chính sách có thể thay đổi dựa trên các chương trình khách hàng chính thức khác do TopDev áp dụng.'],
    en: ['The quote includes discounts, incentives and gifts valid for customers until the expiration date mentioned above. After this time, policies may change based on other official promotions programs applied by TopDev.'],
  },
  {
    vi: ['Dịch vụ được kích hoạt sau khi khách hàng thanh toán đơn hàng & hóa đơn cho đơn hàng được xuất.'],
    en: ['The service will be activated after the customer completes the payment & the invoice is issued.'],
  },
  {
    vi: [
      'Thời hạn dịch vụ:',
      '– Đối với dịch vụ tin đăng: Dịch vụ đã mua phải được kích hoạt trong vòng 12 tháng kể từ ngày xuất hóa đơn.',
      '– Đối với dịch vụ tìm kiếm hồ sơ: Dịch vụ đã mua phải được kích hoạt trong vòng 12 tháng kể từ ngày xuất hóa đơn.',
      '– Thời gian trên không áp dụng cho các trường hợp tin đăng thuộc chương trình ưu đãi với quy định khác về thời gian sử dụng.',
      '– Sau thời gian tương ứng nêu trên, bất kỳ dịch vụ nào đã mua nhưng chưa được kích hoạt sẽ không còn giá trị sử dụng nếu không có thỏa thuận khác được xác nhận.',
    ],
    en: [
      'Service term:',
      '– Job posting service: The purchased service must be activated within 12 months from the date the invoice is issued.',
      '– Search CV service: The purchased service must be activated within 12 months from the date the invoice is issued.',
      '– The above time does not apply to cases of job posts applied to promotional programs with different regulations on usage time.',
      '– After this period, any service purchased but not activated will no longer be valid unless other agreements have been confirmed.',
    ],
  },
  {
    vi: [
      'Thời hạn sử dụng sau khi kích hoạt dịch vụ (được áp dụng cho cả dịch vụ đặt mua và dịch vụ tặng kèm):',
      '– Dịch vụ đăng tin: 30 ngày đăng tin chính thức.',
      '– Tìm kiếm hồ sơ: 30 ngày hoặc 90 ngày tương ứng với dịch vụ đặt mua.',
      '– Quà tặng kèm: theo ghi chú quà tặng phía trên.',
    ],
    en: [
      'Usage period after activating the service (applicable to both service and bonus service):',
      '– Job Posting service: 30 days for official posting.',
      '– Search CV: 30 days or 90 days corresponding to the ordered service.',
      '– Employer Branding gift: according to note information above.',
    ],
  },
  {
    vi: [`TopDev cam kết chính sách giá & ưu đãi tại thời điểm báo giá là tốt nhất dành cho khách hàng theo chương trình khách hàng thân thiết & chính sách hiện hành (trừ trường hợp thay đổi thuế suất VAT theo quy định Nhà nước). Liên hệ hỗ trợ: ${ISSUER.support}.`],
    en: [`We commit that the price policy & incentives at the time of quotation are the best offer for you according to the loyalty program & current policies (except for changes in VAT rates according to State regulations). Contact support: ${ISSUER.support}.`],
  },
]

type PdfLine = { name: string; unitVi: string; unitEn: string; qty: number; price: number; disc: number; gift: boolean }
type PdfOption = { n: number; title: string; lines: PdfLine[]; sub: number; vat: number; total: number; feats: { name: string; items: string[] }[] }

/** Build the printable options from the quotation — paid line + its gift line, as
    the client's document does. Gift lines print at 0 ₫ but are real entitlements. */
function pdfOptions(q: Quote): PdfOption[] {
  return Array.from({ length: Math.max(1, q.options) }, (_, i) => {
    const cat = QUOTE_CATALOG[q.products[i % q.products.length]]
    /* LINES DRIVE THE TOTAL, never the reverse. Back-solving quantity from the
       quotation's value made every option's quantity shift whenever the value
       changed — add a pricier third option and Option 1 silently became "2 tin".
       Quantity is a property of the option; the value is derived FROM the options
       (the highest one), not the other way round. */
    const qty = 1
    const lines: PdfLine[] = [
      { name: cat.vi, unitVi: cat.unitVi, unitEn: cat.unitEn, qty, price: cat.price, disc: 0, gift: false },
      { name: `${cat.vi} (Tặng)`, unitVi: cat.unitVi, unitEn: cat.unitEn, qty: 1, price: 0, disc: 0, gift: true },
    ]
    const sub = lines.reduce((s, l) => s + (l.gift ? 0 : Math.round(l.qty * l.price * (1 - l.disc / 100))), 0)
    const vat = Math.round(sub * VAT_RATE / 100)
    return {
      n: i + 1,
      title: lines.map((l) => l.name).join(' + '),
      lines,
      sub,
      vat,
      total: sub + vat,
      feats: [
        { name: cat.vi, items: cat.feats },
        { name: `${cat.vi} (Tặng)`, items: cat.feats },
      ],
    }
  })
}

/* Saramin wordmark, inlined as a path rather than hotlinked from saramin.co.kr:
   a document must render identically offline, in print and a year from now, which
   a remote asset cannot promise. Brand blue #2D65F2, taken from the live site. */
const SARAMIN_BLUE = '#2D65F2'
const SARAMIN_MARK_D = 'M29.1,24.5L29.1,24.5c-0.4,0.3-1.5,0.9-3.5,0.9c-2.1,0-3.3-0.9-3.3-2.4c0-1.4,1.3-2.3,3.2-2.3 c1.3,0,2.4,0.2,3.5,0.5h0.1C29.1,21.2,29.1,24.5,29.1,24.5z M19.1,13.4c0,0.6,0.3,1.2,0.7,1.5c0.6,0.4,1.4,0.5,2.4,0.2 c0.9-0.3,2.1-0.6,3.4-0.6c2.4,0,3.4,0.8,3.4,2.8v1h-0.1c-1.3-0.3-2.3-0.5-3.9-0.5c-6.6,0-7.1,4.2-7.1,5.5c0,2.9,1.9,5.9,7.3,5.9 c4.2,0,6.7-1.4,7.4-1.9c0.6-0.4,0.8-0.8,0.8-1.5v-8.4c0-4.5-2.6-6.8-7.7-6.8c-2.1,0-4.1,0.4-5.1,0.8S19.1,12.5,19.1,13.4z M80.9,12.6L80.9,12.6c-1.3-1.4-2.9-2-5.1-2c-2.3,0-4.7,0.7-6.3,1.9c-0.7,0.5-0.9,0.9-0.9,1.6v12.7c0,1.2,1,2.3,2.2,2.3 c1.3,0,2.2-1,2.2-2.3v-11l0.1-0.1c0.3-0.2,1.3-0.8,2.8-0.8c1.9,0,2.9,1.1,2.9,3.2v8.8c0,1.2,1,2.3,2.2,2.3c1.3,0,2.2-1,2.2-2.3V15.8 l0.1-0.1c0.3-0.2,1.3-0.8,2.8-0.8c1.9,0,2.9,1.1,2.9,3.2v8.8c0,1.2,1,2.3,2.2,2.3c1.3,0,2.3-1,2.3-2.3V18c0-5-2.3-7.4-7.2-7.4 C84.5,10.6,82.6,11.3,80.9,12.6L80.9,12.6L80.9,12.6z M60.6,24.5L60.6,24.5c-0.4,0.3-1.5,0.9-3.5,0.9c-2.1,0-3.3-0.9-3.3-2.4 c0-1.4,1.3-2.3,3.2-2.3c1.3,0,2.4,0.2,3.5,0.5h0.1C60.6,21.3,60.6,24.5,60.6,24.5z M50.6,13.4c0,0.6,0.3,1.2,0.7,1.5 c0.6,0.4,1.4,0.5,2.4,0.2c0.9-0.3,2.1-0.6,3.4-0.6c2.4,0,3.4,0.8,3.4,2.8v1h-0.1c-1.3-0.3-2.3-0.5-3.9-0.5c-6.6,0-7.1,4.2-7.1,5.5 c0,2.9,1.9,5.9,7.3,5.9c4.2,0,6.7-1.4,7.4-1.9c0.6-0.4,0.8-0.8,0.8-1.5v-8.4c0-4.5-2.6-6.8-7.7-6.8c-2.1,0-4.2,0.4-5.1,0.8 C51.1,11.8,50.6,12.5,50.6,13.4z M46.3,10.9c-0.7-0.2-1.8-0.3-3-0.3c-3.9,0-6.1,2.1-6.1,5.8V27c0,1.2,1,2.1,2.2,2.1l0,0l0,0l0,0 c1.3,0,2.3-1,2.3-2.2v-9.7c0-1.5,0.6-2.3,1.9-2.3c0.6,0,1.1,0.1,1.6,0.2c0.4,0.1,0.7,0.1,1.1,0.1c1.4,0,2.1-1.2,2.1-2.1 C48.4,12,47.6,11.2,46.3,10.9 M10.7,18.4l-2.8-0.6c-1.5-0.3-2.2-0.8-2.2-1.7c0-0.5,0.3-1.6,2.6-1.6c1,0,2.4,0.3,3.3,0.8 c1.1,0.6,2.3,0.5,2.9-0.3c0.4-0.4,0.6-1,0.5-1.6c0-0.4-0.2-0.9-0.7-1.4c-1.1-0.9-3.5-1.6-5.9-1.6c-4.3,0-7.1,2.3-7.1,5.7 c0,3.3,2.8,4.7,5.1,5.3c0.8,0.2,1.2,0.3,1.7,0.4c0.3,0.1,0.7,0.1,1.2,0.2c1.5,0.3,2.1,0.9,2.1,1.8c0,0.6-0.4,1.7-2.8,1.7 c-1.7,0-3.5-0.5-4.6-1.2C3.7,24.2,3.3,24,2.8,24c-0.6,0-1.2,0.3-1.6,0.8c-0.6,0.8-0.4,2.1,0.4,2.8c0.7,0.6,2.9,2,6.9,2 c4.3,0,7.2-2.4,7.2-6C15.8,20.9,14.1,19.2,10.7,18.4 M99.6,8.5c-1.2,0-2.1,1-2.1,2.2v11.9c0,1.2,1,2.2,2.1,2.2c1.2,0,2.1-1,2.1-2.2 V10.7C101.7,9.5,100.8,8.5,99.6,8.5 M99.6,0c-1.8,0-3.2,1.3-3.2,3.1s1.4,3.2,3.2,3.2c1.7,0,3.2-1.5,3.2-3.2 C102.8,1.4,101.4,0,99.6,0 M113.6,10.6c-4.5,0-6.9,1.6-7.3,1.9c-0.6,0.4-0.8,0.8-0.8,1.6v12.8c0,1.2,1,2.3,2.2,2.3 c1.3,0,2.2-1,2.2-2.3V15.7l0,0c0.7-0.4,2-0.8,3.5-0.8c1.7,0,3.5,0.9,3.5,3.3v8.7c0,1.2,1,2.3,2.2,2.3c1.3,0,2.2-1,2.2-2.3V18 C121.5,13.2,118.8,10.6,113.6,10.6'
function SaraminMark({ width = 104, fill = SARAMIN_BLUE }: { width?: number; fill?: string }) {
  return (
    <svg viewBox="0 0 123.3 31" width={width} height={(width * 31) / 123.3} role="img" aria-label="Saramin">
      <path d={SARAMIN_MARK_D} fill={fill} fillRule="evenodd" />
    </svg>
  )
}

/** The A4 sheet. Rendered at 794px (210mm @96dpi) and scaled by the viewer. */
function QuotationPdfDoc({ q, co }: { q: Quote; co?: Company }) {
  const opts = pdfOptions(q)
  const rep = co?.owner ?? 'Nguyễn Thị Lan'
  const contact = co?.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0] ?? q.customer
  const sd = signDate(q.created)
  const COLS = '28px minmax(0,2.6fr) 58px 46px 84px 58px 92px'

  return (
    <div className="mx-auto bg-white text-slate-800 shadow-xl" style={{ width: 794 }}>
      <div className="px-[52px] py-[44px]">
        {/* ── letterhead ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold leading-snug text-slate-900">{ISSUER.nameVi}</p>
            <p className="text-[11px] font-medium italic leading-snug text-slate-500">{ISSUER.nameEn}</p>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-slate-600">{ISSUER.addrVi}</p>
            <p className="text-[9.5px] italic leading-relaxed text-slate-400">{ISSUER.addrEn}</p>
            <p className="mt-1 text-[9.5px] font-medium text-sky-700">{ISSUER.web}</p>
          </div>
          {/* Group brand on the document: Saramin is the parent, TopDev the brand
              the customer buys on — both belong here, in that order. */}
          <div className="shrink-0 pt-0.5 text-right">
            <SaraminMark width={104} />
            <p className="mt-1.5 border-t border-slate-200 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {ISSUER.brand} Vietnam
            </p>
          </div>
        </div>

        <p className="mt-2 text-[9.5px] text-slate-600">
          <span className="text-slate-400">Báo giá bởi / Proposed by:</span> <b className="text-slate-800">{rep}</b> | {rep.split(' ').pop()?.toLowerCase()}@topdev.vn
        </p>

        {/* ── title band ───────────────────────────────────────────────
            A black slab is loud without being informative. This is the same
            content on paper-white with a single brand rule down the left: the
            title reads as a title, the number stays monospaced and findable, and
            the two dates sit in their own labelled cells so "hết hạn" — the one
            date that actually constrains the customer — can be picked out. */}
        <div className="mt-5 flex items-stretch justify-between gap-6 border-y border-slate-200 py-3.5">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="h-full w-[3px] shrink-0 rounded-full" style={{ backgroundColor: SARAMIN_BLUE }} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <p className="text-[26px] font-black leading-none tracking-tight text-slate-900">BÁO GIÁ</p>
                <p className="text-[10.5px] font-semibold tracking-[0.28em] text-slate-400">PROPOSAL</p>
              </div>
              <p className="mt-2 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11.5px] font-bold tracking-tight" style={{ color: SARAMIN_BLUE }}>
                {q.code}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {([
              { vi: 'Ngày báo giá', en: 'Proposal Date', v: q.created, accent: false },
              { vi: 'Ngày hết hạn', en: 'Expiry Date', v: q.expires, accent: true },
            ]).map((d) => (
              <div
                key={d.en}
                className={cn('min-w-[104px] rounded-md border px-2.5 py-1.5 text-right', d.accent ? 'border-slate-300 bg-slate-50' : 'border-slate-200')}
              >
                <span className="block text-[8.5px] font-semibold uppercase tracking-wide text-slate-500">{d.vi}</span>
                <span className="block text-[8.5px] italic text-slate-400">{d.en}</span>
                <b className={cn('mt-1 block text-[12.5px] tabular-nums', d.accent ? 'text-slate-900' : 'text-slate-700')}>{d.v}</b>
              </div>
            ))}
          </div>
        </div>

        {/* ── customer + VAT billing, side by side ───────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <Bi vi="Thông tin khách hàng" en="Client information" className="text-[10px] font-bold uppercase tracking-wide text-slate-700" />
            <dl className="mt-2 space-y-1.5 text-[10px] leading-snug">
              <div><dt className="text-slate-400">Tên khách hàng / Client name</dt><dd className="font-semibold text-slate-800">{contact}</dd></div>
              <div><dt className="text-slate-400">Email</dt><dd className="font-medium text-slate-700">{co ? `${contact.split(' ').pop()?.toLowerCase()}@${co.domain}` : '—'}</dd></div>
              <div><dt className="text-slate-400">Số điện thoại / Phone number</dt><dd className="font-medium tabular-nums text-slate-700">0978 490 363</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <Bi vi="Thông tin xuất hóa đơn VAT" en="Billing information for VAT-invoice" className="text-[10px] font-bold uppercase tracking-wide text-slate-700" />
            <dl className="mt-2 space-y-1.5 text-[10px] leading-snug">
              <div><dt className="text-slate-400">Tên công ty / Company name</dt><dd className="font-semibold uppercase text-slate-800">{co?.legalName ?? q.customer}</dd></div>
              <div><dt className="text-slate-400">Địa chỉ ĐKKD / Billing Address</dt><dd className="font-medium text-slate-700">{co?.address ?? '—'}</dd></div>
              <div><dt className="text-slate-400">Mã số thuế / Tax code</dt><dd className="font-medium tabular-nums text-slate-700">{co?.tax ?? '—'}</dd></div>
            </dl>
          </div>
        </div>

        {/* ── options ────────────────────────────────────────────────── */}
        {opts.map((o) => (
          <section key={o.n} className="mt-5">
            {/* Options are ALTERNATIVES. With three of them the reader needs to know
                which one we are actually proposing, so the recommended one is named
                — without implying the others are unavailable. */}
            <div
              className="flex items-start justify-between gap-3 rounded-t-lg border border-b-0 px-3.5 py-2"
              style={{
                borderColor: o.n === 1 ? `${SARAMIN_BLUE}33` : '#E2E8F0',
                backgroundColor: o.n === 1 ? `${SARAMIN_BLUE}0F` : '#F8FAFC',
                borderLeft: `3px solid ${o.n === 1 ? SARAMIN_BLUE : '#94A3B8'}`,
              }}
            >
              <p className="min-w-0 text-[10.5px] leading-snug">
                <span className="font-bold" style={{ color: o.n === 1 ? SARAMIN_BLUE : '#475569' }}>Option {o.n}</span>
                <span className="ml-1.5 text-slate-600">{o.title}</span>
              </p>
              {o.n === 1 && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: SARAMIN_BLUE }}>
                  Đề xuất · Recommended
                </span>
              )}
            </div>
            <div className="rounded-b-lg border border-t-0 border-slate-200">
              {/* header row */}
              <div className="grid items-end gap-x-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[8.5px] font-bold uppercase leading-tight text-slate-600" style={{ gridTemplateColumns: COLS }}>
                <Bi vi="STT" en="No." />
                <Bi vi="Dịch vụ" en="Type of service" />
                <Bi vi="Đơn vị tính" en="Unit" />
                <Bi vi="Số lượng" en="Quantity" />
                <Bi vi="Đơn giá" en="Unit price" className="text-right" />
                <Bi vi="Giảm giá" en="Discount" className="text-right" />
                <Bi vi="Tổng giá" en="Total price" className="text-right" />
              </div>
              {o.lines.map((l, i) => (
                <div key={i} className="grid items-center gap-x-2 border-b border-slate-100 px-3 py-2 text-[10px]" style={{ gridTemplateColumns: COLS }}>
                  <span className="text-slate-400 tabular-nums">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block leading-snug text-slate-800">{l.name}</span>
                    {l.gift && <span className="mt-0.5 inline-block rounded border border-emerald-200 bg-emerald-50 px-1 py-px text-[8px] font-semibold text-emerald-700">QUÀ TẶNG · GIFT</span>}
                  </span>
                  <span className="leading-tight text-slate-500">{l.unitVi}<span className="block text-[8.5px] italic text-slate-400">{l.unitEn}</span></span>
                  <span className="tabular-nums text-slate-700">{l.qty}</span>
                  <span className="text-right tabular-nums text-slate-700">{pdfNum(l.price)}</span>
                  <span className="text-right tabular-nums text-slate-500">{l.disc}%</span>
                  <span className="text-right font-semibold tabular-nums text-slate-900">{pdfNum(l.gift ? 0 : Math.round(l.qty * l.price * (1 - l.disc / 100)))}</span>
                </div>
              ))}
              {/* totals — right-aligned block, never a grand total across options */}
              <div className="flex justify-end px-3 py-2.5">
                <div className="w-[300px] text-[10px]">
                  <div className="flex items-center justify-between py-1">
                    <Bi vi="Tạm tính" en="Subtotal" className="text-slate-500" />
                    <span className="tabular-nums text-slate-700">{pdfNum(o.sub)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 py-1">
                    <span className="text-slate-500">Thuế GTGT ({VAT_RATE}%)</span>
                    <span className="tabular-nums text-slate-700">{pdfNum(o.vat)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-slate-800 pt-1.5">
                    <Bi vi={`Tổng đơn hàng sau thuế VAT ${VAT_RATE}%`} en={`Total price after VAT ${VAT_RATE}%`} className="text-[9.5px] font-bold text-slate-800" />
                    <span className="shrink-0 pl-2 text-[13px] font-black tabular-nums text-slate-900">{pdfNum(o.total)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[9.5px] leading-relaxed">
                <p className="text-slate-700"><span className="font-semibold">Bằng chữ:</span> {vnWords(o.total)}.</p>
                <p className="italic text-slate-400"><span className="font-semibold not-italic">In words:</span> {enWords(o.total)}.</p>
              </div>
            </div>

            {/* benefits per package */}
            {o.feats.map((f, i) => (
              <div key={i} className="mt-2 rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[9.5px] font-bold text-slate-700">
                  Quyền lợi gói {f.name} trên TopDev.vn
                  <span className="block font-medium italic text-slate-400">Features of {f.name} Package on TopDev.vn</span>
                </p>
                <ol className="mt-1.5 space-y-0.5">
                  {f.items.map((it, j) => (
                    <li key={j} className="flex gap-1.5 text-[9.5px] leading-relaxed text-slate-600">
                      <span className="shrink-0 tabular-nums text-slate-400">{j + 1}.</span>{it}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        ))}

        {/* ── terms & conditions ─────────────────────────────────────── */}
        <section className="mt-6 break-before-page">
          <Bi vi="Điều khoản và điều kiện" en="Terms & Conditions" className="border-b-2 border-slate-800 pb-1 text-[12px] font-bold uppercase tracking-wide text-slate-900" />
          <ol className="mt-2.5 space-y-2.5">
            {QUOTE_TERMS.map((t, i) => (
              <li key={i} className="flex gap-2 text-[9.5px] leading-relaxed">
                <span className="shrink-0 font-bold tabular-nums text-slate-400">{i + 1}.</span>
                <span className="min-w-0">
                  {t.vi.map((p, j) => <span key={j} className={cn('block text-slate-700', j > 0 && 'pl-2')}>{p}</span>)}
                  {t.en.map((p, j) => <span key={j} className={cn('block italic text-slate-400', j > 0 && 'pl-2')}>{p}</span>)}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── signature ──────────────────────────────────────────────── */}
        <div className="mt-8 flex justify-end">
          <div className="w-[260px] text-center">
            <Bi vi={`Đại diện ${ISSUER.brand}`} en={ISSUER.brand} className="text-[10px] font-bold text-slate-800" />
            <p className="mt-0.5 text-[9.5px] text-slate-600">{sd.vi}</p>
            <p className="text-[9.5px] italic text-slate-400">{sd.en}</p>
            <div className="mt-12 border-t border-slate-400 pt-1 text-[9px] text-slate-500">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Viewer chrome around the sheet: zoom, the generated file name, print and
   download. Deliberately NOT an editor — a quotation is composed in the builder;
   this screen only renders it and hands over the file. The rep then sends that
   file themselves and records it with "Mark as sent". */
function QuotationPdfModal({ q, co, onClose }: { q: Quote; co?: Company; onClose: () => void }) {
  const [zoom, setZoom] = useState(0.85)
  const file = `${q.code}.pdf`
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2.5 text-white">
        <span className="text-[13px] font-semibold">Xuất PDF / Export quotation</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px]">{file}</span>
        <span className="hidden text-[11px] text-slate-400 sm:inline">A4 · dọc / portrait · {q.options} option{q.options > 1 ? 's' : ''}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-600">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">−</button>
            <span className="min-w-[46px] px-1 text-center text-[11px] tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">+</button>
          </div>
          <button className="rounded-md border border-slate-600 px-2.5 py-1 text-[12px] font-medium hover:bg-white/10">In / Print</button>
          {/* Download is the primary action now: the rep sends the file themselves,
              through their own mailbox or Zalo, and records that with "Mark as sent". */}
          <button className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-slate-900 hover:opacity-90">Tải PDF</button>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-300 hover:bg-white/10">✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div style={{ width: 794 * zoom, margin: '0 auto' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 794 }}>
            <QuotationPdfDoc q={q} co={co} />
          </div>
        </div>
      </div>
      <p className="border-t border-slate-700 bg-slate-900 px-4 py-2 text-[10.5px] leading-relaxed text-slate-400">
        Nội dung y hệt bản PDF khách đang dùng — chỉ tinh chỉnh trình bày: cặp Việt/Anh xếp chồng thay vì viết liền, bảng có cột và số canh phải, mỗi option là một khối riêng có tổng riêng (các option là <b className="text-slate-200">lựa chọn thay thế</b>, không bao giờ cộng lại).
      </p>
    </div>
  )
}

/* Quotation detail. The list stays scannable, so every exception lives here: the
   approval gate, a lapsed offer, a superseded version, and which option the
   customer actually accepted. Read-only — changes go through Edit, which reopens
   the builder, because a Sent quotation is immutable and revising it makes a v2. */
function QuotationDetail({ q, onBack, onCreatePO, onDuplicate }: { q: Quote; onBack: () => void; onCreatePO: (c: Company) => void; onDuplicate?: (companyName: string) => void }) {
  useDetailCrumb(q.code, onBack)
  /* Resolve the quotation's company against the real records. `co` on a quotation
     is written as the legal name, and older rows carry only `customer` — so match
     on any of the names a company is known by. Without this the duplicate dialog
     opens on "— Chọn công ty —" for a quotation that plainly belongs to someone. */
  const co = COMPANIES.find((x) => x.name === q.co)
    ?? COMPANIES.find((x) => x.legalName === q.co || x.name === q.customer || x.legalName === q.customer || x.shortName === q.customer)
  /* Issue PO shows on every SENT quotation — that is the only state where an order
     can follow. It is disabled on a lapsed offer: the discounts and gifts expired
     with the validity date (T&C clause 2), so extend or re-issue as v2 first. */
  const canPO = q.status === 'Sent' && !q.lapsed
  // One option per product listed, priced off the catalog so the arithmetic is real.
  /* Which option the customer bought is decided HERE, when the PO is raised —
     the quotation itself carries no per-option status. With one option there is
     nothing to ask; with several the rep must pick one, because an order copies
     exactly ONE option forward. */
  const [picking, setPicking] = useState(false)
  /* Duplicate ≠ revise. Revise makes v2 of THIS quotation and supersedes it —
     same deal, same company. Duplicate starts a brand-new quotation, on any
     company, with no link back beyond a "copied from" reference. Using duplicate
     where revise was meant leaves two live quotes on one deal. */
  const [duping, setDuping] = useState(false)
  /* Defaults to THIS quotation's company: re-quoting the same customer after one
     lapsed is the common case, and quoting a different company is the exception the
     rep opts into. Starting empty made every duplicate ask a question that already
     has an answer. */
  const [dupCo, setDupCo] = useState('')
  const [pdf, setPdf] = useState(false)
  /** what the dialog acts on: the rep's pick if they made one, else this company. */
  const dupTarget = dupCo || co?.name || ''
  /* Build ONE card per declared option. Deriving from q.products instead would
     render 2 cards for a quotation that says it has 3 — and the Issue-PO picker
     would then offer fewer choices than the customer was actually given. */
  const opts = Array.from({ length: Math.max(1, q.options) }, (_, i) => {
    const p = q.products[i % q.products.length]
    // Same rule as the printed document: lines drive the total. Quantity is never
    // back-solved from q.value, or the detail and the PDF disagree on the figures.
    const qty = 1
    const sub = qty * QUOTE_CATALOG[p].price
    const vat = Math.round(sub * VAT_RATE / 100)
    return { n: i + 1, p, qty, sub, vat, total: sub + vat }
  })
  return (
    <div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Báo giá / Quotation</p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            <span className="font-mono">{q.code}</span>
            <Pill tone={QUOTE_TONE[q.status]}>{q.status}</Pill>
          </h2>
          <p className="text-[11.5px] text-muted">{q.customer} · {q.options} options · giá trị {q.value.toLocaleString('en-US')} ₫</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* One action, not two: "preview" and "export" render the SAME document —
              the viewer is where the file is downloaded from, so a rep can never
              send a PDF they have not looked at. */}
          <button onClick={() => setPdf(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Xuất PDF / Export</button>
          {/* Available in EVERY status — the commonest use is re-quoting an expired
              or lost offer, so restricting it to live quotations would remove it
              exactly when it is most wanted. */}
          <button onClick={() => setDuping(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink/40">⧉ Nhân bản / Duplicate</button>
          {/* Sales declares "sent" — reps routinely deliver the PDF by Zalo or from
              their own mail client, so it cannot depend on our mailer firing. */}
          {q.status === 'Draft' && (
            <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Mark as sent</button>
          )}
          {q.status === 'Sent' && (
            <button
              onClick={() => { if (!canPO || !co) return; if (opts.length > 1) setPicking(true); else onCreatePO(co) }}
              disabled={!canPO}
              title={canPO ? (opts.length > 1 ? 'Chọn option khách đã chốt, rồi tạo PO' : 'Raise the sales order from this option') : `Offer lapsed ${q.expires} — extend validity or re-issue as v2 first`}
              className={cn('rounded-lg px-3 py-1.5 text-[12px] font-semibold', canPO ? 'bg-brand text-white hover:opacity-90' : 'border border-line bg-canvas text-faint')}
            >
              Issue PO →
            </button>
          )}
        </div>
      </div>

      {q.lapsed && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-900">
          Offer lapsed — validity ended {q.expires}. Extend validity or re-issue as v2 before an order can be raised.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-5">
        <InfoBit label="Ngày báo giá / Created" value={q.created} />
        <InfoBit label="Ngày hết hạn / Expires" value={q.expires} hint={q.lapsed ? 'lapsed' : q.expires === '—' ? 'not sent yet' : undefined} />
        <InfoBit label="Báo giá bởi / Proposed by" value={co?.owner ?? 'Nguyễn Thị Lan'} />
        <InfoBit label="Số option" value={String(q.options)} hint="alternatives, never summed" />
        {/* ONE option's total-after-VAT, never a sum: the accepted option once the
            customer decides, else the HIGHEST option. Deliberately not the
            "recommended" one — that swap is still an open question in the spec. */}
        <InfoBit label="Giá trị / Value" value={`${q.value.toLocaleString('en-US')} ₫`} hint={q.acceptedOpt ? 'accepted option' : 'highest option'} />
      </div>

      {co && <div className="mb-4"><QuoteCompanyCard c={co} /></div>}

      <p className="mb-2 text-[12.5px] font-semibold">Options</p>
      <div className="space-y-2">
        {opts.map((o) => (
          <div key={o.n} className="rounded-xl border border-line p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold">Option {o.n} <span className="font-normal text-muted">{QUOTE_CATALOG[o.p].vi}</span></p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-line">
              <div className="grid min-w-[520px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
                <span>#</span><span>Dịch vụ</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Tổng giá</span>
              </div>
              <div className="grid min-w-[520px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
                <span className="text-faint">1</span><span className="truncate">{QUOTE_CATALOG[o.p].vi}</span>
                <span className="text-[11px] text-muted">{QUOTE_CATALOG[o.p].unitVi}</span>
                <span className="tabular-nums">{o.qty}</span>
                <span className="text-right tabular-nums">{QUOTE_CATALOG[o.p].price.toLocaleString('en-US')}</span>
                <span className="text-right tabular-nums">{o.sub.toLocaleString('en-US')}</span>
              </div>
            </div>
            <div className="mt-2 ml-auto w-full max-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
              <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{o.sub.toLocaleString('en-US')} ₫</span></div>
              <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{o.vat.toLocaleString('en-US')} ₫</span></div>
              <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{o.total.toLocaleString('en-US')} ₫</span></div>
              <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(o.total)}.</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">Options are alternatives — no grand total exists, and reporting never sums them.</p>

      {duping && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <p className="text-[15px] font-bold">Nhân bản báo giá</p>
                <p className="text-[11px] text-muted">Tạo một báo giá MỚI từ {q.code} — số mới, ngày mới, trạng thái Nháp.</p>
              </div>
              <button onClick={() => setDuping(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>

            <div className="space-y-3.5 p-5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Báo giá cho công ty<span className="text-rose-500"> *</span></label>
                <select value={dupTarget} onChange={(e) => setDupCo(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {!co && <option value="">— Chọn công ty —</option>}
                  {COMPANIES.map((c) => <option key={c.name} value={c.name}>{coLabel(c)} · {coId(c)}</option>)}
                </select>
                <p className="mt-1 text-[10.5px] text-faint">
                  {!dupTarget
                    ? 'Chọn công ty sẽ nhận bản báo giá mới.'
                    : dupTarget === co?.name
                      ? 'Giữ nguyên công ty của báo giá này — dùng khi báo lại sau khi bản cũ hết hạn hoặc bị từ chối. Đổi ở trên nếu muốn chào cho khách khác.'
                      : 'Khác công ty — dùng khi chào cùng gói cho khách khác. Thông tin xuất hóa đơn sẽ lấy theo công ty mới.'}
                </p>
              </div>

              <div className="rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
                <b className="text-ink/70">Không sao chép:</b> số báo giá, ngày báo giá, ngày hết hạn, trạng thái gửi, option khách đã chốt,
                và liên kết tới PO. Bản sao luôn bắt đầu ở <b className="text-ink/70">Nháp</b> với hạn <b className="text-ink/70">cuối tháng tạo</b>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              <button onClick={() => setDuping(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Hủy</button>
              <button
                disabled={!dupTarget}
                onClick={() => { setDuping(false); onDuplicate?.(dupTarget) }}
                className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', dupTarget ? 'bg-brand hover:opacity-90' : 'bg-line')}
              >
                Tạo bản sao →
              </button>
            </div>
          </div>
        </div>
      )}

      {picking && co && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[620px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <p className="text-[15px] font-bold">Khách đã chốt option nào?</p>
                <p className="text-[11px] text-muted">Một PO chỉ lấy được MỘT option. Các option còn lại không trở thành đơn hàng.</p>
              </div>
              <button onClick={() => setPicking(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>
            <div className="space-y-2 p-5">
              {opts.map((o) => (
                <button
                  key={o.n}
                  onClick={() => { setPicking(false); onCreatePO(co) }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:border-brand hover:bg-brand-soft/40"
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">Option {o.n}</span>
                    <span className="block truncate text-[11.5px] text-muted">{QUOTE_CATALOG[o.p].vi} · {o.qty} {QUOTE_CATALOG[o.p].unitVi}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[12.5px] font-semibold tabular-nums text-ink">{o.total.toLocaleString('en-US')} ₫</span>
                    <span className="block text-[10.5px] text-faint">đã gồm VAT {VAT_RATE}%</span>
                  </span>
                </button>
              ))}
              <p className="text-[10.5px] leading-relaxed text-faint">
                Option được chọn sẽ được sao nguyên sang PO — dòng hàng, số lượng, đơn giá, VAT và thông tin xuất hóa đơn.
                Không nhập lại gì.
              </p>
            </div>
          </div>
        </div>
      )}

      {pdf && <QuotationPdfModal q={q} co={co} onClose={() => setPdf(false)} />}
    </div>
  )
}

function AdminQuotes() {
  /* PO creation lives HERE, not on the company detail page: an order can only come
     from an ACCEPTED quotation option, so the accepted row is the only place the
     action is ever valid. Company detail carries "Create quotation" instead. */
  const [poFor, setPoFor] = useState<Company | null>(null)
  const [open, setOpen] = useState<Quote | null>(null)
  /* Duplicating hands the copy straight to the builder, pre-filled with the target
     company — the rep lands on an editable draft rather than a confirmation. */
  const [dupFor, setDupFor] = useState<string | null>(null)
  const [fStatus, setFStatus] = useState('')
  const [qSort, setQSort] = useState<QuoteSort>('expires')
  const goTo = useContext(ScreenNavCtx)
  /* Arrived via a cross-page link (e.g. from a PO row): open that quotation. Falls
     back to a stub so a PO can always link to its source even if the quotation is
     not one of the demo rows. */
  const handed = useContext(OpenRecordCtx)
  const linked = handed
    ? QUOTES.find((x) => x.code === handed) ?? {
        code: handed, customer: POS.find((p) => p.quote === handed)?.customer ?? '—', products: [1], options: 2,
        value: POS.find((p) => p.quote === handed)?.total ?? 0, status: 'Issued to PO' as QuoteStatus,
        created: '—', expires: '—',
      }
    : null
  const showing = open ?? linked
  if (showing) return (
    <>
      <QuotationDetail q={showing} onBack={() => { setOpen(null); if (handed) goTo('admin-quotes') }} onCreatePO={setPoFor} onDuplicate={setDupFor} />
      {dupFor && <NewQuotationModal company={dupFor} onClose={() => setDupFor(null)} />}
      {poFor && <CreatePOModal c={poFor} onClose={() => setPoFor(null)} />}
    </>
  )

  /* Status left the tab strip and moved into Filter, so this list carries the same
     Search · Filter · Sort toolbar as Companies. Tabs made status the ONE dimension
     worth narrowing by and spent a whole row saying so. */
  const shown = QUOTES
    .filter((q) => !fStatus || q.status === fStatus)
    .slice()
    .sort(QUOTE_SORTS[qSort].cmp)
  const rows = shown.map((q) => {
    return [
      <button onClick={() => setOpen(q)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{q.code}</button>,
      <span className="truncate">{q.customer}</span>,
      <ProductCell ids={q.products} />,
      <span className="tabular-nums text-muted">{q.options}</span>,
      <span className="tabular-nums">{q.value.toLocaleString('en-US')} ₫</span>,
      <Pill tone={QUOTE_TONE[q.status]}>{q.status}</Pill>,
      <span className="tabular-nums text-muted">{q.created}</span>,
      <span className="tabular-nums text-muted">{q.expires}</span>,
    ]
  })

  return (
    <div>
      {/* Create action lives on the page title row (see PRIMARY_ACTION in AdminWireframe). */}
      <ListPage
        total={QUOTES.length}
        searchHint="Tìm số báo giá, khách hàng…"
        filters={
          <FilterBar count={fStatus ? 1 : 0} onClear={() => setFStatus('')}>
            <FilterRow label="Status" value={fStatus} onChange={setFStatus} options={['Draft', 'Sent', 'Issued to PO', 'Expired']} />
          </FilterBar>
        }
        sort={
          <label className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
            <span className="text-faint">Sắp xếp</span>
            <select
              value={qSort}
              onChange={(e) => setQSort(e.target.value as QuoteSort)}
              className="max-w-[170px] cursor-pointer bg-transparent text-[11.5px] font-medium text-ink outline-none"
            >
              {(Object.keys(QUOTE_SORTS) as QuoteSort[]).map((k) => <option key={k} value={k}>{QUOTE_SORTS[k].label}</option>)}
            </select>
          </label>
        }
        cols={[
          { label: 'Quotation', w: '1.4fr' }, { label: 'Customer', w: '1.3fr' }, { label: 'Products', w: '1.2fr' },
          { label: 'Options', w: '0.6fr' }, { label: 'Value', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1fr' },
          { label: 'Created', w: '0.8fr' }, { label: 'Expires', w: '0.8fr' },
        ]}
        rows={rows}
        minW={1000}
      />
      {poFor && <CreatePOModal c={poFor} onClose={() => setPoFor(null)} />}
    </div>
  )
}
/* An invoice only EXISTS once it has been issued — before that there is a PO
   awaiting one, which is the PO list's job. So this list carries no "blocked"
   or "draft" rows: every row here is a real fiscal document with a legal number.
   That is why there are only two statuses. */
type Inv = { code: string; legal: string; customer: string; co?: string; po: string; payment: string; total: number; issued: string; activateBy: string; cancelled?: boolean; replacedBy?: string; product: number; qty: number; issuer: string }
const INVOICES: Inv[] = [
  { code: 'INV-003390-07-2026', legal: '1C26TAA/0041', customer: 'Công ty TNHH Vạn Phát', co: 'Công ty TNHH Vạn Phát', po: 'PO-005863-07-2026', payment: 'PAY-1042', total: 37_800_000, issued: '26/07/2026', activateBy: '26/07/2027', product: 1, qty: 5, issuer: 'Lê Thị Kế Toán' },
  { code: 'INV-003389-07-2026', legal: '1C26TAA/0040', customer: 'Công ty CP Trường Sơn', co: 'Công ty CP Trường Sơn', po: 'PO-005859-07-2026', payment: 'PAY-1044', total: 73_929_353, issued: '24/07/2026', activateBy: '24/07/2027', product: 2, qty: 7, issuer: 'Lê Thị Kế Toán' },
  { code: 'INV-003388-07-2026', legal: '1C26TAA/0039', customer: 'Hồng Đức', po: 'PO-005855-07-2026', payment: 'PAY-1039', total: 139_609_357, issued: '06/07/2026', activateBy: '—', cancelled: true, replacedBy: 'INV-003391-07-2026 · 1C26TAA/0042', product: 2, qty: 14, issuer: 'Lê Thị Kế Toán' },
]

function InvoiceDetail({ inv, onBack }: { inv: Inv; onBack: () => void }) {
  useDetailCrumb(inv.code, onBack)
  const pack = QUOTE_CATALOG[inv.product]
  const sub = Math.round(inv.total / (1 + VAT_RATE / 100))
  const vat = inv.total - sub
  const unit = Math.round(sub / inv.qty)
  return (
    <div>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Hóa đơn GTGT / VAT e-invoice</p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            <span className="font-mono">{inv.legal}</span>
            <Pill tone={inv.cancelled ? 'expired' : 'active'}>{inv.cancelled ? 'Cancelled' : 'Issued'}</Pill>
          </h2>
          <p className="text-[11.5px] text-muted">Số nội bộ {inv.code} · {inv.customer}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Tải PDF</button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink/40">Xem PO nguồn</button>
          {/* The ONLY place a sale is undone. The PO has no Cancelled status, so
              this button carries both cases: a wrong invoice being replaced, and
              an invoice issued ahead of a payment that never arrived. */}
          {!inv.cancelled && (
            <button
              title="Hủy hóa đơn + biên bản, và thu hồi quota đã cấp. Dùng cho hóa đơn sai, hoặc hóa đơn xuất trước thanh toán mà khách không trả tiền."
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-700 hover:border-rose-400"
            >
              Hủy hóa đơn · Kế toán
            </button>
          )}
          {inv.cancelled && (
            <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Xem hóa đơn thay thế →</button>
          )}
        </div>
      </div>

      {/* One row, one status, and the actions that status actually permits. An
          issued invoice has no forward action at all — that is the rule, not a
          gap, so the row states it instead of showing an empty space. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-faint">Trạng thái</span>
          <Pill tone={inv.cancelled ? 'expired' : 'active'}>{inv.cancelled ? 'Cancelled' : 'Issued'}</Pill>
          <span className="text-[11px] text-muted">{inv.cancelled ? 'Đã hủy — đã có hóa đơn thay thế' : 'Đã xuất hóa đơn'}</span>
        </div>
        <span className="text-[11.5px] font-medium text-emerald-700">
          {inv.cancelled
            ? '✓ Đã xử lý xong — không còn hành động nào trên hóa đơn này'
            : '✓ Hóa đơn hợp lệ — không sửa được. Hành động duy nhất còn lại là hủy + xuất thay thế.'}
        </span>
      </div>

      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
        Hóa đơn đã xuất là <b>bất biến</b> — không sửa được. Sai sót xử lý bằng <b>hủy + xuất hóa đơn thay thế kèm biên bản</b> theo
        quy định. Chỉ <b>Kế toán</b> được thực hiện.
      </div>
      {inv.cancelled && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-900">
          Hóa đơn này đã bị hủy và thay thế bởi <b className="font-mono">{inv.replacedBy}</b>.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-5">
        <InfoBit label="Số hóa đơn hợp lệ" value={inv.legal} mono hint="do nhà cung cấp cấp" />
        <InfoBit label="Ngày xuất / Issued" value={inv.issued} hint="một SỰ KIỆN, không phải kế hoạch" />
        <InfoBit label="Kích hoạt trước / Activate by" value={inv.activateBy} hint="ngày xuất + 12 tháng" />
        <InfoBit label="Từ PO" value={inv.po} mono />
        <InfoBit label="Thanh toán đã xác nhận" value={inv.payment} mono hint={`bởi ${inv.issuer}`} />
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="text-[11.5px] leading-relaxed">
            <p className="text-muted">Đơn vị bán hàng:</p>
            <p className="font-bold text-ink">DAOUKIWOOM INNOVATION COMPANY LIMITED</p>
            <p className="text-ink/80">Level 12, 13 &amp; 14, AP Tower, 518B Dien Bien Phu, Thanh My Tay Ward, HCMC</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">0315421202</span></p>
          </div>
          <div className="text-right text-[11.5px] leading-relaxed">
            <p className="text-muted">Đơn vị mua hàng:</p>
            <p className="font-bold text-brand">{inv.customer}</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">{COMPANIES.find((c) => c.name === inv.co)?.tax ?? '0318705749'}</span></p>
            <p className="mt-1 text-[10.5px] text-faint">Khớp chính xác với thông tin trên báo giá — lệch là phải hủy &amp; xuất lại</p>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-line">
          <div className="grid min-w-[620px] gap-x-3 bg-ink px-3 py-2 text-[11px] font-semibold text-white" style={{ gridTemplateColumns: '28px 2.6fr 0.7fr 0.6fr 1fr 1fr' }}>
            <span>#</span><span>Tên hàng hóa, dịch vụ</span><span className="text-right">ĐVT</span><span className="text-right">SL</span><span className="text-right">Đơn giá</span><span className="text-right">Thành tiền</span>
          </div>
          <div className="grid min-w-[620px] gap-x-3 border-t border-line px-3 py-2 text-[12px]" style={{ gridTemplateColumns: '28px 2.6fr 0.7fr 0.6fr 1fr 1fr' }}>
            <span className="text-faint">1</span><span className="truncate">{pack.vi}</span>
            <span className="text-right text-[11px] text-muted">{pack.unitVi}</span>
            <span className="text-right tabular-nums">{inv.qty}</span>
            <span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span>
            <span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
          </div>
        </div>

        <div className="mt-3 ml-auto w-full max-w-[320px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
          <div className="flex justify-between"><span className="text-muted">Cộng tiền hàng</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
          <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng tiền thanh toán</span><span className="tabular-nums">{inv.total.toLocaleString('en-US')} ₫</span></div>
          <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Số tiền viết bằng chữ: {vnWords(inv.total)}.</p>
        </div>
      </div>
    </div>
  )
}

function AdminInvoices() {
  const [open, setOpen] = useState<Inv | null>(null)
  if (open) return <InvoiceDetail inv={open} onBack={() => setOpen(null)} />
  return (
    <ListPage
      tabs={[{ label: 'All', count: 210, active: true }, { label: 'Issued' }, { label: 'Cancelled / replaced' }, { label: 'Activation expiring', count: 6 }]}
      cols={[{ label: 'Invoice · legal no.', w: '1.7fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'From PO', w: '1.4fr' }, { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.2fr' }, { label: 'Issued', w: '0.9fr' }, { label: 'Activate by', w: '0.9fr' }]}
      rows={INVOICES.map((i) => [
        <button onClick={() => setOpen(i)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{i.code} · {i.legal}</button>,
        <span className="truncate">{i.customer}</span>,
        <span className="truncate font-mono text-[11px] text-muted">{i.po}</span>,
        <span className="tabular-nums">{i.total.toLocaleString('en-US')} ₫</span>,
        <Pill tone={i.cancelled ? 'expired' : 'active'}>{i.cancelled ? 'Cancelled' : 'Issued'}</Pill>,
        <span className="tabular-nums text-muted">{i.issued}</span>,
        <span className="tabular-nums text-muted">{i.activateBy}</span>,
      ])}
      minW={1040}
    />
  )
}
/* ── PO as PDF ─────────────────────────────────────────────────────────────────
   Field-for-field the client's live document (PO-003971-08-2026): letterhead,
   "XÁC NHẬN ĐƠN HÀNG / PURCHASE ORDER", the two header cells Ngày đặt hàng and
   Số đơn hàng, client + VAT-billing blocks, ONE line table (a PO carries the one
   option the customer accepted — never a choice), totals, amount in words, the
   package benefits, the service terms, and a TWO-column signature page.

   It shares the quotation's letterhead, table shell and terms on purpose: the
   customer receives both documents in the same week, and a different-looking PO
   reads as coming from a different company. */
function PoPdfDoc({ po, co }: { po: Po; co?: Company }) {
  const pack = QUOTE_CATALOG[po.product]
  const sub = Math.round(po.total / (1 + VAT_RATE / 100))
  const vat = po.total - sub
  const unit = Math.round(sub / po.qty)
  const issued = po.issued.replace(/\./g, '/')
  const sd = signDate(issued)
  const contact = co?.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0] ?? po.customer
  const COLS = '28px minmax(0,2.6fr) 58px 46px 84px 58px 92px'

  return (
    <div className="mx-auto bg-white text-slate-800 shadow-xl" style={{ width: 794 }}>
      <div className="px-[52px] py-[44px]">
        {/* letterhead — identical to the quotation's */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold leading-snug text-slate-900">{ISSUER.nameVi}</p>
            <p className="text-[11px] font-medium italic leading-snug text-slate-500">{ISSUER.nameEn}</p>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-slate-600">{ISSUER.addrVi}</p>
            <p className="text-[9.5px] italic leading-relaxed text-slate-400">{ISSUER.addrEn}</p>
            <p className="mt-1 text-[9.5px] font-medium text-sky-700">{ISSUER.web}</p>
          </div>
          <div className="shrink-0 pt-0.5 text-right">
            <SaraminMark width={104} />
            <p className="mt-1.5 border-t border-slate-200 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {ISSUER.brand} Vietnam
            </p>
          </div>
        </div>

        <p className="mt-2 text-[9.5px] text-slate-600">
          <span className="text-slate-400">Phụ trách / Account:</span> <b className="text-slate-800">{po.seller}</b> | {po.seller.split(' ').pop()?.toLowerCase()}@topdev.vn
        </p>

        {/* title band — the PO's own two header cells */}
        <div className="mt-5 flex items-stretch justify-between gap-6 border-y border-slate-200 py-3.5">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="h-full w-[3px] shrink-0 rounded-full" style={{ backgroundColor: SARAMIN_BLUE }} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <p className="text-[22px] font-black leading-none tracking-tight text-slate-900">XÁC NHẬN ĐƠN HÀNG</p>
                <p className="text-[10.5px] font-semibold tracking-[0.28em] text-slate-400">PURCHASE ORDER</p>
              </div>
              <p className="mt-2 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11.5px] font-bold tracking-tight" style={{ color: SARAMIN_BLUE }}>
                {po.code}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {([
              { vi: 'Ngày đặt hàng', en: 'Date of purchase', v: issued },
              { vi: 'Số đơn hàng', en: 'No. purchase order', v: po.poNo ?? po.code },
            ]).map((d) => (
              <div key={d.vi} className="min-w-[112px] rounded border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-center">
                <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-500">{d.vi}</p>
                <p className="text-[8px] italic text-slate-400">{d.en}</p>
                <p className="mt-1 font-mono text-[11px] font-bold tabular-nums text-slate-900">{d.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* client + VAT billing */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <Bi vi="Thông tin khách hàng" en="Client information" className="text-[10px] font-bold uppercase tracking-wide text-slate-700" />
            <dl className="mt-2 space-y-1.5 text-[10px] leading-snug">
              <div><dt className="text-slate-400">Tên khách hàng / Client name</dt><dd className="font-medium text-slate-800">{contact}</dd></div>
              <div><dt className="text-slate-400">Email</dt><dd className="font-medium text-slate-700">{co ? `contact@${co.domain}` : '—'}</dd></div>
              <div><dt className="text-slate-400">Số điện thoại / Phone number</dt><dd className="font-medium tabular-nums text-slate-700">0978 490 363</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <Bi vi="Thông tin xuất hóa đơn VAT" en="Billing information for VAT-invoice" className="text-[10px] font-bold uppercase tracking-wide text-slate-700" />
            <dl className="mt-2 space-y-1.5 text-[10px] leading-snug">
              <div><dt className="text-slate-400">Tên công ty / Company name</dt><dd className="font-semibold uppercase text-slate-800">{co?.legalName ?? po.customer}</dd></div>
              <div><dt className="text-slate-400">Địa chỉ ĐKKD / Billing Address</dt><dd className="font-medium text-slate-700">{co?.address ?? '—'}</dd></div>
              <div><dt className="text-slate-400">Mã số thuế / Tax code</dt><dd className="font-medium tabular-nums text-slate-700">{co?.tax ?? '—'}</dd></div>
            </dl>
          </div>
        </div>

        {/* ONE line block — no options, because the customer already chose */}
        <section className="mt-5">
          <div className="rounded-lg border border-slate-200">
            <div className="grid items-end gap-x-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[8.5px] font-bold uppercase leading-tight text-slate-600" style={{ gridTemplateColumns: COLS }}>
              <Bi vi="STT" en="No." />
              <Bi vi="Dịch vụ" en="Type of service" />
              <Bi vi="Đơn vị tính" en="Unit" />
              <Bi vi="Số lượng" en="Quantity" />
              <Bi vi="Đơn giá" en="Unit price" className="text-right" />
              <Bi vi="Giảm giá" en="Discount" className="text-right" />
              <Bi vi="Tổng giá" en="Total price" className="text-right" />
            </div>
            <div className="grid items-center gap-x-2 border-b border-slate-100 px-3 py-2 text-[10px]" style={{ gridTemplateColumns: COLS }}>
              <span className="tabular-nums text-slate-400">1</span>
              <span className="block min-w-0 leading-snug text-slate-800">{pack.vi}</span>
              <span className="leading-tight text-slate-500">{pack.unitVi}<span className="block text-[8.5px] italic text-slate-400">{pack.unitEn}</span></span>
              <span className="tabular-nums text-slate-700">{po.qty}</span>
              <span className="text-right tabular-nums text-slate-700">{pdfNum(unit)}</span>
              <span className="text-right tabular-nums text-slate-500">0%</span>
              <span className="text-right font-semibold tabular-nums text-slate-900">{pdfNum(sub)}</span>
            </div>
            <div className="flex justify-end px-3 py-2.5">
              <div className="w-[300px] text-[10px]">
                <div className="flex items-center justify-between py-1">
                  <Bi vi="Tạm tính" en="Subtotal" className="text-slate-500" />
                  <span className="tabular-nums text-slate-700">{pdfNum(sub)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 py-1">
                  <span className="text-slate-500">Thuế GTGT ({VAT_RATE}%)</span>
                  <span className="tabular-nums text-slate-700">{pdfNum(vat)}</span>
                </div>
                <div className="flex items-center justify-between border-t-2 border-slate-800 pt-1.5">
                  <Bi vi={`Tổng đơn hàng sau thuế VAT ${VAT_RATE}%`} en={`Total price after VAT ${VAT_RATE}%`} className="text-[9.5px] font-bold text-slate-800" />
                  <span className="shrink-0 pl-2 text-[13px] font-black tabular-nums text-slate-900">{pdfNum(po.total)}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[9.5px] leading-relaxed">
              <p className="text-slate-700"><span className="font-semibold">Bằng chữ:</span> {vnWords(po.total)}.</p>
              <p className="italic text-slate-400"><span className="font-semibold not-italic">In words:</span> {enWords(po.total)}.</p>
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2">
            <p className="text-[9.5px] font-bold text-slate-700">
              Quyền lợi gói {pack.short} trên TopDev.vn
              <span className="block font-medium italic text-slate-400">Features of {pack.short} Package on TopDev.vn</span>
            </p>
            <ol className="mt-1.5 space-y-0.5">
              {pack.feats.map((it, j) => (
                <li key={j} className="flex gap-1.5 text-[9.5px] leading-relaxed text-slate-600">
                  <span className="shrink-0 tabular-nums text-slate-400">{j + 1}.</span>{it}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* service terms — same clauses the quotation carries */}
        <section className="mt-6 break-before-page">
          <Bi vi="Điều kiện sử dụng dịch vụ" en="Terms of Service" className="border-b-2 border-slate-800 pb-1 text-[12px] font-bold uppercase tracking-wide text-slate-900" />
          <ol className="mt-2.5 space-y-2.5">
            {QUOTE_TERMS.map((t, i) => (
              <li key={i} className="flex gap-2 text-[9.5px] leading-relaxed">
                <span className="shrink-0 font-bold tabular-nums text-slate-400">{i + 1}.</span>
                <span className="min-w-0">
                  {t.vi.map((x, j) => <span key={j} className={cn('block text-slate-700', j > 0 && 'pl-2')}>{x}</span>)}
                  {t.en.map((x, j) => <span key={j} className={cn('block italic text-slate-400', j > 0 && 'pl-2')}>{x}</span>)}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* TRANG KÝ — a PO is signed by BOTH sides, unlike a quotation */}
        <section className="mt-7 break-before-page">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-900">Trang ký</p>
          <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
            Dành cho đại diện của khách hàng và {ISSUER.brand} để xác nhận sử dụng dịch vụ và chấp thuận các điều kiện &amp; điều khoản dịch vụ đã nêu.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-6">
            <div className="text-center">
              <Bi vi={`Đại diện ${ISSUER.brand}`} en={ISSUER.brand} className="text-[10px] font-bold text-slate-800" />
              <p className="mt-0.5 text-[9.5px] text-slate-600">{sd.vi}</p>
              <p className="text-[9.5px] italic text-slate-400">{sd.en}</p>
              <div className="mt-14 border-t border-slate-400 pt-1 text-[9px] text-slate-500">Authorized Signature</div>
            </div>
            <div className="text-center">
              <Bi vi="Đại diện Khách hàng" en="Customer" className="text-[10px] font-bold text-slate-800" />
              {/* Left blank on purpose: the customer dates it when they sign. */}
              <p className="mt-0.5 text-[9.5px] text-slate-600">Ngày ____ tháng ____ năm ______</p>
              <p className="text-[9.5px] italic text-slate-400">Date: ____________________</p>
              <div className="mt-14 border-t border-slate-400 pt-1 text-[9px] text-slate-500">Authorized Signature</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function PoPdfModal({ po, co, onClose }: { po: Po; co?: Company; onClose: () => void }) {
  const [zoom, setZoom] = useState(0.85)
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2.5 text-white">
        <span className="text-[13px] font-semibold">Xuất PDF / Export purchase order</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px]">{po.code}.pdf</span>
        <span className="hidden text-[11px] text-slate-400 sm:inline">A4 · dọc / portrait</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-600">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">−</button>
            <span className="min-w-[46px] px-1 text-center text-[11px] tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">+</button>
          </div>
          <button className="rounded-md border border-slate-600 px-2.5 py-1 text-[12px] font-medium hover:bg-white/10">🖨 In / Print</button>
          <button className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-slate-900 hover:opacity-90">⬇ Tải PDF</button>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-300 hover:bg-white/10">✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div style={{ width: 794 * zoom, margin: '0 auto' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 794 }}>
            <PoPdfDoc po={po} co={co} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Purchase order ───────────────────────────────────────────────────────────
   Page layout follows the client's live system. Numbering is PO-{seq6}-{MM}-
   {YYYY}, issuer block on the left, recipient + dates on the right, line items
   with the package benefits printed inline.

   The three accounting milestones from that screen — ĐÃ THANH TOÁN · ĐÃ YÊU CẦU
   XUẤT HÓA ĐƠN · ĐÃ XUẤT HÓA ĐƠN — are modelled as an ordered STATE here rather
   than a row of independent toggles, so a PO cannot be marked invoiced before the
   money is confirmed (T&C clause 3). Exactly one primary action is offered at a
   time, and the two money steps are Accounting-only. */
/* FOUR statuses, and only ONE of them is a step: a PO is Active from the moment
   it is issued off an accepted quotation option, and the single action on it is
   Kế toán issuing the VAT invoice. Everything else is an exit.

   Draft / Sent / Paid were all removed, each for the same reason — they permitted
   the same actions and carried the same obligations as Active:
     · "Draft" and "Sent" — a PO is created BY being issued to the customer; there
       is no state in which one exists but has not gone out.
     · "Paid" — payment is a FACT recorded against the PO, not a stage of it. The
       invoice can legitimately be issued before the money lands (customers
       routinely need the invoice to release payment internally), so a PO that
       reads "Paid" would say nothing the payment record does not.
   One exit: Expired — nobody acts, the PO lapses at the end of its month, the
   same rule as the quotation it came from.

   There is deliberately NO Cancelled here. Withdrawing a sale means withdrawing
   the INVOICE, which is the fiscal document and the thing that granted the quota;
   the PO is only the commercial record behind it. Putting a second cancel on the
   PO would give two places to undo one event and two records that can disagree
   about whether the sale happened. The invoice-before-payment case is handled
   where it belongs: Invoice → Hủy hóa đơn (Kế toán). */
type PoStep = 'active' | 'invoiced' | 'expired'
type PoStage = { key: PoStep; vi: string; en: string; by: string }
const PO_FLOW: PoStage[] = [
  { key: 'active', vi: 'Đang hiệu lực', en: 'Active', by: 'Sales' },
  { key: 'invoiced', vi: 'Đã xuất hóa đơn', en: 'Issued invoice', by: 'Kế toán' },
]
/* An exit, not a step — nobody reaches it by clicking the flow forward. */
const PO_EXITS: Record<string, PoStage> = {
  expired: { key: 'expired', vi: 'Hết hạn', en: 'Expired', by: 'System' },
}
const poStage = (k: PoStep) => PO_FLOW.find((x) => x.key === k) ?? PO_EXITS[k]
/** The single next action, and who may click it. Only Active has one. */
function poNext(step: PoStep) {
  if (step !== 'active') return null
  return { label: 'Xuất hóa đơn', by: 'Kế toán', accounting: true }
}
type Po = { code: string; customer: string; co?: string; poNo?: string; quote: string; total: number; step: PoStep; issued: string; seller: string; product: number; qty: number }
/* A PO lapses at the end of the month it was issued in — the same end-of-month
   rule as the quotation it came from, so the two documents can never disagree
   about how long the commercial terms stand. Dates on the document are dotted. */
const poExpiry = (p: Po) => endOfMonth(p.issued.replace(/\./g, '/'))
const POS: Po[] = [
  { code: 'PO-005864-07-2026', customer: 'CÔNG TY TNHH DEKON VIỆT NAM', poNo: 'PO-DK/2026/031', quote: 'QUO-009911-07-2026', total: 12_960_000, step: 'invoiced', issued: '27.07.2026', seller: 'Nguyễn Hoàng Oanh', product: 2, qty: 1 },
  { code: 'PO-005863-07-2026', customer: 'Công ty TNHH Vạn Phát', co: 'Công ty TNHH Vạn Phát', poNo: 'PO-VP/2026/044', quote: 'QUO-009908-07-2026', total: 40_824_000, step: 'invoiced', issued: '22.07.2026', seller: 'Nguyễn Thị Lan', product: 1, qty: 6 },
  { code: 'PO-005862-07-2026', customer: 'CÔNG TY TNHH AM SOFTWARE VIỆT NAM', co: 'Công ty TNHH AM Software Việt Nam', quote: 'QUO-009909-07-2026', total: 6_588_000, step: 'active', issued: '20.07.2026', seller: 'Nguyễn Thị Lan', product: 1, qty: 1 },
  { code: 'PO-005861-07-2026', customer: 'Công ty CP Hoàng Gia', co: 'Công ty CP Hoàng Gia', quote: 'QUO-009907-07-2026', total: 87_505_977, step: 'active', issued: '18.07.2026', seller: 'Trần Quốc Trung', product: 2, qty: 8 },
  { code: 'PO-005860-07-2026', customer: 'Công ty TNHH Sao Mai', co: 'Công ty TNHH Sao Mai', quote: 'QUO-009910-07-2026', total: 126_360_120, step: 'active', issued: '16.07.2026', seller: 'Trần Quốc Trung', product: 1, qty: 19 },
  // issued in June and never invoiced — lapsed on 30/06, not on a rolling 30 days
  { code: 'PO-005859-06-2026', customer: 'Công ty TNHH Minh Long', quote: 'QUO-009906-06-2026', total: 32_400_000, step: 'expired', issued: '24.06.2026', seller: 'Nguyễn Thị Lan', product: 0, qty: 10 },
  { code: 'PO-005858-06-2026', customer: 'Công ty CP Đông Á', quote: 'QUO-009905-06-2026', total: 21_600_000, step: 'expired', issued: '09.06.2026', seller: 'Phạm Quang Huy', product: 0, qty: 7 },
]
const PO_TONE: Record<PoStep, StatusTone> = { active: 'pending', invoiced: 'active', expired: 'expired' }

function PoDetail({ po, onBack }: { po: Po; onBack: () => void }) {
  useDetailCrumb(po.code, onBack)
  const [pdf, setPdf] = useState(false)
  const poCo = COMPANIES.find((x) => x.name === po.co || x.legalName === po.customer || coLabel(x) === po.customer)
  const cur = poStage(po.step)
  const next = poNext(po.step)
  const pack = QUOTE_CATALOG[po.product]
  const sub = Math.round(po.total / (1 + VAT_RATE / 100))
  const vat = po.total - sub
  const unit = Math.round(sub / po.qty)
  return (
    <div>

      {/* One status, one action. The four-status model — what each means, who acts
          and what it triggers — is documented in the requirement, not restated on
          screen every time a rep opens a PO. */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5">
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={PO_TONE[po.step]}>{cur.en}</Pill>
          {/* An Active PO is running out of month, and that is the only thing on
              this bar the rep can still change the outcome of. */}
          {po.step === 'active' && <span className="text-[11px] text-muted">Hết hạn <b className="text-ink/75">{poExpiry(po)}</b> — cuối tháng</span>}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* Export is available in EVERY state, expired included: a copy of the
              document is what gets asked for long after the deal is over, and
              refusing it then would be the one time it mattered. */}
          <button onClick={() => setPdf(true)} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand">
            ⬇ Xuất PO (PDF)
          </button>
          {/* No cancel on a PO. Undoing a sale is a fiscal act — it happens on the
              invoice, which is also what granted the quota. This link is the way
              there rather than a second button that does the same thing badly. */}
          {po.step === 'invoiced' && (
            <button
              title="Hủy sale = hủy hóa đơn (kèm biên bản, xuất hóa đơn thay thế nếu cần). PO không có trạng thái Đã hủy."
              className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40"
            >
              Xem hóa đơn →
            </button>
          )}
          {next
            ? (
              <button className={cn('rounded-lg px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90', next.accounting ? 'bg-amber-600' : 'bg-brand')}>
                {next.label} →{next.accounting && <span className="ml-1 font-normal opacity-90">· Kế toán</span>}
              </button>
            )
            : po.step === 'expired'
              ? <span className="text-[11.5px] font-medium text-muted">Hết hạn {poExpiry(po)} — tạo PO mới từ báo giá</span>
              : <span className="text-[11.5px] font-medium text-emerald-700">✓ Sản phẩm đã vào tài khoản khách hàng</span>}
        </div>
      </div>

      {/* The consequence of the invoice, stated where it happens. Provisioning is
          immediate — not a queue, not a manual hand-off — so this is the line that
          tells a rep the customer can already work. */}
      {po.step === 'invoiced' && (
        <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-emerald-900">
          <b>Đã xuất hóa đơn → sản phẩm chạy về tài khoản khách hàng ngay.</b> {pack.vi} × {po.qty} {pack.unitVi} hiển thị trong trang chi tiết công ty, và khách có thể đăng tin / xem CV ngay từ lúc này — không chờ thao tác nào khác.
        </div>
      )}

      {/* document */}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <p className="text-[18px] font-bold tracking-tight">{po.code}</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div className="text-[11.5px] leading-relaxed">
            <p className="font-bold text-ink">DAOUKIWOOM INNOVATION COMPANY LIMITED</p>
            <p className="text-ink/80">Level 12, 13 &amp; 14, AP Tower, 518B Dien Bien Phu,<br />Thanh My Tay Ward, HCMC<br />Ho Chi Minh City<br />Vietnam 700000</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">0315421202</span></p>
          </div>
          <div className="text-right text-[11.5px] leading-relaxed">
            <p className="text-muted">Người nhận:</p>
            <p className="font-bold text-brand">{po.customer}</p>
            <p className="mt-1 text-ink/80">Mã số thuế: <span className="tabular-nums">{COMPANIES.find((c) => c.name === po.co)?.tax ?? '0318705749'}</span></p>
            {po.poNo && <p className="text-ink/80">Số PO của khách: <span className="font-mono">{po.poNo}</span></p>}
            <p className="mt-1 text-ink/80">Ngày phát hành: <b>{po.issued}</b></p>
            <p className="text-ink/80">Hết hạn: <b>{poExpiry(po)}</b></p>
            <p className="text-ink/80">Người bán: <b>{po.seller}</b></p>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-line">
          <div className="grid min-w-[760px] gap-x-3 bg-ink px-3 py-2 text-[11px] font-semibold text-white" style={{ gridTemplateColumns: '28px 3fr 0.7fr 1fr 0.7fr 0.9fr 1fr' }}>
            <span>#</span><span>Sản phẩm</span><span className="text-right">Số lượng</span><span className="text-right">Giá</span><span className="text-right">Chiết khấu</span><span className="text-right">Thuế</span><span className="text-right">Tổng</span>
          </div>
          <div className="grid min-w-[760px] gap-x-3 border-t border-line px-3 py-2.5 text-[12px]" style={{ gridTemplateColumns: '28px 3fr 0.7fr 1fr 0.7fr 0.9fr 1fr' }}>
            <span className="text-faint">1</span>
            <span className="min-w-0">
              <p className="font-medium text-ink">{pack.vi}</p>
              <ol className="mt-1 ml-4 list-decimal text-[11px] leading-relaxed text-muted">
                {pack.feats.map((f) => <li key={f}>{f}</li>)}
              </ol>
            </span>
            <span className="text-right tabular-nums">{po.qty} {pack.unitVi}</span>
            <span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span>
            <span className="text-right tabular-nums">0%</span>
            <span className="text-right text-[11px] text-muted">Thuế GTGT {VAT_RATE}%</span>
            <span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
          </div>
        </div>

        {/* the client's screen stops at a pre-VAT line total; spelling the tax out
            removes the ambiguity about what the customer actually owes */}
        <div className="mt-3 ml-auto w-full max-w-[320px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
          <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
          <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng phải trả</span><span className="tabular-nums">{po.total.toLocaleString('en-US')} ₫</span></div>
          <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(po.total)}.</p>
        </div>
      </div>

      {pdf && <PoPdfModal po={po} co={poCo} onClose={() => setPdf(false)} />}
    </div>
  )
}

function AdminPOs() {
  const [open, setOpen] = useState<Po | null>(null)
  /* The source quotation belongs to the Quotations page, so the link navigates
     there rather than rendering a quotation inside Purchase order — that keeps the
     breadcrumb honest ("CRM / Quotations / QUO-…") and Back going to the right list. */
  const goTo = useContext(ScreenNavCtx)
  if (open) return <PoDetail po={open} onBack={() => setOpen(null)} />
  return (
    <ListPage
      tabs={[{ label: 'All', count: 64, active: true }, { label: 'Active', count: 9 }, { label: 'Issued invoice' }, { label: 'Expired' }]}
      cols={[
        { label: 'PO', w: '1.5fr' }, { label: 'Customer', w: '1.8fr' }, { label: 'Quotation', w: '1.4fr' },
        { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.4fr' }, { label: 'Issued', w: '0.8fr' }, { label: 'Expires', w: '0.9fr' },
      ]}
      rows={POS.map((p) => [
        <button onClick={() => setOpen(p)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{p.code}</button>,
        <span className="truncate">{p.customer}</span>,
        <button onClick={() => goTo('admin-quotes', p.quote)} className="min-w-0 truncate text-left font-mono text-[11px] text-brand hover:underline">{p.quote}</button>,
        <span className="tabular-nums">{p.total.toLocaleString('en-US')} ₫</span>,
        <Pill tone={PO_TONE[p.step]}>{poStage(p.step).en}</Pill>,
        <span className="tabular-nums text-muted">{p.issued}</span>,
        <span className={cn('tabular-nums', p.step === 'active' ? 'font-medium text-ink/80' : 'text-faint')}>{poExpiry(p)}</span>,
      ])}
      minW={1080}
    />
  )
}
function AdminPayments() {
  const rows = [
    ['PAY-1042', 'Công ty Vạn Phát', 'SO-1188', '37,800,000 ₫', 'Bank transfer', <Pill tone="active">Confirmed · Kế toán</Pill>, '26/07/2026'],
    ['PAY-1043', 'AM Software Việt Nam', 'SO-1189', '6,588,000 ₫', 'Bank transfer', <Pill tone="pending">Recorded — to confirm</Pill>, '27/07/2026'],
    ['PAY-1044', 'Trường Sơn', 'SO-1185', '73,929,353 ₫', 'Bank transfer', <Pill tone="active">Confirmed · Kế toán</Pill>, '24/07/2026'],
    ['PAY-1045', 'Á Châu', 'SO-1182', '19,934,148 ₫', 'Cash', <Pill tone="rejected">Unmatched</Pill>, '20/07/2026'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'Awaiting payment', count: 9 }, { label: 'To confirm', count: 4, active: true }, { label: 'Confirmed' }, { label: 'To invoice', count: 2 }, { label: 'Unmatched', count: 1 }]}
      cols={[{ label: 'Reference', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Order', w: '0.9fr' }, { label: 'Amount', w: '1.1fr', align: 'r' }, { label: 'Method', w: '1.1fr' }, { label: 'Status', w: '1.6fr' }, { label: 'Paid', w: '0.9fr', align: 'r' }]}
      rows={rows}
      minW={860}
    />
  )
}
function AdminContracts() {
  const rows = [
    ['CT-0912', 'Trường Sơn', '546,679,016 ₫', <Pill tone="active">Active</Pill>, '20/04/2026 – 20/04/2027'],
    ['CT-0913', 'Phương Đông', '498,258,424 ₫', <Pill tone="expired">Expired</Pill>, '20/05/2025 – 15/04/2026'],
    ['CT-0914', 'Hồng Đức', '152,568,060 ₫', <Pill tone="draft">Draft</Pill>, '30/03/2026 – 04/09/2026'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Contract', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Value', w: '1.2fr', align: 'r' }, { label: 'Status', w: '1fr' }, { label: 'Validity', w: '1.8fr', align: 'r' }]}
      rows={rows}
    />
  )
}

/* ── Analytics ────────────────────────────────────────────────────────────── */
function AdminDashboard() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'Revenue (MTD)', value: '2.4B ₫', delta: '12% vs last month', up: true },
        { label: 'Active jobs', value: '1,180', delta: '4% vs last month', up: true },
        { label: 'New applicants', value: '3,942', delta: '8% vs last month', up: true },
        { label: 'Paying companies', value: '452', delta: '3 churned', up: false },
      ]} />
      <div>
        <p className="mb-2 text-[12px] font-semibold text-ink/70">Revenue — last 6 months (B ₫)</p>
        <Bars data={[{ label: 'Feb', value: 1.6 }, { label: 'Mar', value: 1.9 }, { label: 'Apr', value: 1.7 }, { label: 'May', value: 2.1 }, { label: 'Jun', value: 2.3 }, { label: 'Jul', value: 2.4 }]} />
      </div>
    </div>
  )
}
function AdminSalesReport() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'Bookings (MTD)', value: '2.4B ₫', delta: '12%', up: true },
        { label: 'Avg deal size', value: '38.2M ₫', delta: '5%', up: true },
        { label: 'Win rate', value: '31%', delta: '2%', up: false },
        { label: 'Open pipeline', value: '4.9B ₫' },
      ]} />
      <ListPage
        cols={[{ label: 'Product', w: '1.6fr' }, { label: 'Units sold', w: '1fr', align: 'r' }, { label: 'Revenue', w: '1.2fr', align: 'r' }, { label: 'Share', w: '0.8fr', align: 'r' }]}
        rows={[
          ['Job Posting — Pro', '112', '1.68B ₫', '52%'],
          ['Resume Search', '48', '0.96B ₫', '30%'],
          ['Main ad', '36', '0.29B ₫', '9%'],
          ['Boosts', '61', '0.18B ₫', '6%'],
        ]}
      />
    </div>
  )
}
function AdminRecruitReport() {
  return (
    <div className="space-y-4">
      <p className="text-[12px] font-semibold text-ink/70">Recruiting funnel — last 30 days</p>
      <Bars data={[{ label: 'Views', value: 84200 }, { label: 'Applies', value: 12400 }, { label: 'Screened', value: 8100 }, { label: 'Interview', value: 2600 }, { label: 'Hired', value: 640 }]} />
      <p className="text-[11px] text-faint">Apply rate 14.7% · screen-through 65% · hire rate 0.8% — aggregates the application pipeline</p>
    </div>
  )
}
function AdminRevenueReport() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'Revenue (YTD)', value: '14.2B ₫', delta: '18% YoY', up: true },
        { label: 'Recognized', value: '11.8B ₫' },
        { label: 'Deferred', value: '2.4B ₫' },
        { label: 'Refunds', value: '86M ₫', delta: '0.6%', up: false },
      ]} />
      <ListPage
        cols={[{ label: 'Month', w: '1fr' }, { label: 'Bookings', w: '1.2fr', align: 'r' }, { label: 'Recognized', w: '1.2fr', align: 'r' }, { label: 'Refunds', w: '1fr', align: 'r' }]}
        rows={[['May 2026', '2.1B ₫', '1.7B ₫', '12M ₫'], ['Jun 2026', '2.3B ₫', '1.9B ₫', '18M ₫'], ['Jul 2026', '2.4B ₫', '2.0B ₫', '9M ₫']]}
      />
    </div>
  )
}
function AdminUserBehavior() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'DAU', value: '18,400', delta: '6%', up: true },
        { label: 'Searches / day', value: '42,100', delta: '9%', up: true },
        { label: 'Avg session', value: '6m 12s', delta: '3%', up: true },
        { label: 'Apply conversion', value: '14.7%' },
      ]} />
      <Bars data={[{ label: 'Mon', value: 17200 }, { label: 'Tue', value: 18900 }, { label: 'Wed', value: 19400 }, { label: 'Thu', value: 18100 }, { label: 'Fri', value: 20300 }, { label: 'Sat', value: 11200 }, { label: 'Sun', value: 9800 }]} />
      <p className="text-[11px] text-faint">Reads the Store behaviour-tracking pipeline · privacy/consent applies (VN)</p>
    </div>
  )
}

/* ── System · Roles & permissions ───────────────────────────────────────────
 * Interactive flow — the internal HQ operator lifecycle, in order:
 *   1. Define a ROLE first  → a permission tree (None / Read / Read & write per page)
 *   2. Create an operator   → fill name + email
 *   3. Assign the role      → pick from the roles defined in step 1
 *   4. Send email invite    → operator sets their OWN password via the link
 *   → status is Pending until they activate it, then Active
 * Same invitation format/flow as the company Admin / assigned-role invite.
 */
type PermLevel = 'none' | 'read' | 'write'
const PERM_GROUPS: { key: string; label: string; resources: string[] }[] = [
  { key: 'recruitment', label: 'Recruitment', resources: ['Jobs', 'Job approval', 'Applicants', 'Resumes / candidates (PII)'] },
  { key: 'companies', label: 'Companies', resources: ['Company accounts', 'Company users', 'Company page review'] },
  { key: 'content', label: 'Content', resources: ['Banners', 'Popups', 'Pages'] },
  { key: 'billing', label: 'Billing & products', resources: ['Catalog', 'Bundles', 'Credits', 'Orders', 'Promotions'] },
  { key: 'crm', label: 'CRM', resources: ['Sign-ups', 'Pipeline / leads', 'Quotes', 'Invoices', 'Purchase orders', 'Payments', 'Contracts'] },
  { key: 'analytics', label: 'Analytics', resources: ['Dashboard', 'Sales report', 'Recruit report', 'Revenue report', 'User behavior'] },
  { key: 'system', label: 'System', resources: ['Operator accounts', 'Roles & permissions', 'Master data', 'Job categories & roles', 'Audit log', 'Environment / flags', 'Departments'] },
]
const TOTAL_PERMS = PERM_GROUPS.reduce((n, g) => n + g.resources.length, 0)
const permKey = (gk: string, r: string) => `${gk}:${r}`

type Role = { name: string; desc: string; users: number; grants: Record<string, PermLevel> }
const ROLES: Role[] = [
  { name: 'Super admin', desc: 'Full access to every module, including roles & operator accounts.', users: 3, grants: { recruitment: 'write', companies: 'write', content: 'write', billing: 'write', crm: 'write', analytics: 'write', system: 'write' } },
  { name: 'Sales', desc: 'CRM pipeline, companies & billing. No content or system settings.', users: 8, grants: { recruitment: 'none', companies: 'read', content: 'none', billing: 'write', crm: 'write', analytics: 'read', system: 'none' } },
  { name: 'Operations', desc: 'Recruitment moderation, company accounts & content.', users: 12, grants: { recruitment: 'write', companies: 'write', content: 'write', billing: 'none', crm: 'none', analytics: 'read', system: 'none' } },
  { name: 'Content editor', desc: 'Content module only — banners, popups, pages, blog.', users: 5, grants: { recruitment: 'none', companies: 'none', content: 'write', billing: 'none', crm: 'none', analytics: 'read', system: 'none' } },
  { name: 'Finance', desc: 'Billing, orders & revenue reports. Read-only CRM.', users: 4, grants: { recruitment: 'none', companies: 'read', content: 'none', billing: 'write', crm: 'read', analytics: 'read', system: 'none' } },
]
// expand a role's per-group grants into a full per-resource permission map
const expandGrants = (grants: Record<string, PermLevel>): Record<string, PermLevel> => {
  const m: Record<string, PermLevel> = {}
  for (const g of PERM_GROUPS) for (const r of g.resources) m[permKey(g.key, r)] = grants[g.key] ?? 'none'
  return m
}
const grantedCount = (perms: Record<string, PermLevel>) => Object.values(perms).filter((l) => l !== 'none').length

const PERM_LEVELS: { key: PermLevel; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Read & write' },
]
function PermSeg({ value, onChange }: { value: PermLevel | null; onChange: (l: PermLevel) => void }) {
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-line">
      {PERM_LEVELS.map((l, i) => (
        <button
          key={l.key}
          onClick={() => onChange(l.key)}
          className={cn(
            'px-2.5 py-1 text-[11px] font-medium transition-colors',
            i > 0 && 'border-l border-line',
            value === l.key
              ? l.key === 'none' ? 'bg-slate-600 text-white' : 'bg-brand text-white'
              : 'text-muted hover:bg-canvas/70',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

/* ── Step 1 · the permission-tree editor (mirrors the Customer-permissions screen) */
function RoleEditor({ role, onClose }: { role: Role | null; onClose: () => void }) {
  useDetailCrumb(role ? role.name : 'New role', onClose)
  const [name, setName] = useState(role?.name ?? '')
  const [desc, setDesc] = useState(role?.desc ?? '')
  const [perms, setPerms] = useState<Record<string, PermLevel>>(role ? expandGrants(role.grants) : expandGrants({}))
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({ recruitment: true })
  const searching = query.trim().length > 0
  const q = query.trim().toLowerCase()

  const setMany = (keys: string[], level: PermLevel) => setPerms((p) => ({ ...p, ...Object.fromEntries(keys.map((k) => [k, level])) }))
  const allKeys = PERM_GROUPS.flatMap((g) => g.resources.map((r) => permKey(g.key, r)))
  const groupKeys = (g: (typeof PERM_GROUPS)[number]) => g.resources.map((r) => permKey(g.key, r))
  const uniformLevel = (keys: string[]): PermLevel | null => {
    const first = perms[keys[0]]
    return keys.every((k) => perms[k] === first) ? first : null
  }
  const granted = grantedCount(perms)

  return (
    <div>

      {/* header — name + granted counter + bulk + save */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[240px] flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Step 1 · {role ? 'Edit role' : 'New role'}</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Role name (e.g. Regional ops)"
            className="mt-1 w-full max-w-[420px] rounded-lg border border-line bg-surface px-3 py-2 text-[16px] font-bold tracking-tight outline-none placeholder:font-normal placeholder:text-faint focus:border-brand"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description of what this role can do"
            className="mt-1.5 w-full max-w-[520px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] text-ink/80 outline-none placeholder:text-faint focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand tabular-nums">{granted} / {TOTAL_PERMS} granted</span>
          <button onClick={onClose} className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Save role</button>
        </div>
      </div>

      {/* search + top-level bulk */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages / permissions…"
          className="w-[240px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] outline-none placeholder:text-faint focus:border-brand"
        />
        <span className="ml-auto text-[11px] font-medium text-faint">Apply to all pages:</span>
        <PermSeg value={uniformLevel(allKeys)} onChange={(l) => setMany(allKeys, l)} />
      </div>

      {/* the tree */}
      <div className="space-y-2">
        {PERM_GROUPS.map((g) => {
          const gks = groupKeys(g)
          const visible = g.resources.filter((r) => !searching || r.toLowerCase().includes(q) || g.label.toLowerCase().includes(q))
          if (searching && visible.length === 0) return null
          const isOpen = searching || open[g.key]
          const gGranted = gks.filter((k) => perms[k] !== 'none').length
          return (
            <div key={g.key} className="overflow-hidden rounded-xl border border-line">
              <div className="flex items-center gap-2 bg-canvas/60 px-3.5 py-2.5">
                <button onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className={cn('text-faint transition-transform', !isOpen && '-rotate-90')}>▾</span>
                  <span className="text-[13px] font-bold text-ink">{g.label}</span>
                  <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10.5px] font-medium text-faint tabular-nums">{gGranted}/{g.resources.length}</span>
                </button>
                <PermSeg value={uniformLevel(gks)} onChange={(l) => setMany(gks, l)} />
              </div>
              {isOpen && (
                <div>
                  {visible.map((r) => {
                    const k = permKey(g.key, r)
                    return (
                      <div key={k} className="flex items-center gap-2 border-t border-line-soft px-3.5 py-2 pl-8">
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink/85">{r}</span>
                        <PermSeg value={perms[k]} onChange={(l) => setPerms((p) => ({ ...p, [k]: l }))} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Set once, per page. <b className="text-ink/70">Read</b> = can view the page; <b className="text-ink/70">Read &amp; write</b> = can also create / edit / delete. Group and “apply to all” toggles cascade to the rows below them. Save the role, then assign it to operators in <b className="text-ink/70">System → Users</b>.
      </p>
    </div>
  )
}

function AdminRoles() {
  const [editing, setEditing] = useState<{ role: Role | null } | null>(null)
  if (editing) return <RoleEditor role={editing.role} onClose={() => setEditing(null)} />
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[64ch] flex-1 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
          <b>Step 1 of the operator flow — define the role first.</b> A role is a permission tree: per page, choose <b>None</b> / <b>Read</b> / <b>Read &amp; write</b>. You then assign a saved role to each operator in <b>System → Users</b> and send them an invite.
        </p>
        <button onClick={() => setEditing({ role: null })} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ New role</button>
      </div>
      <Table
        cols={[{ label: 'Role', w: '2.1fr' }, { label: 'Permissions', w: '0.9fr', align: 'r' }, { label: 'Operators', w: '0.7fr', align: 'r' }, { label: 'Actions', w: '2fr', align: 'r' }]}
        rows={ROLES.map((r) => {
          const granted = grantedCount(expandGrants(r.grants))
          const inUse = r.users > 0
          return [
            <div className="min-w-0"><button onClick={() => setEditing({ role: r })} className="block truncate text-left font-medium text-brand hover:underline">{r.name}</button><p className="truncate text-[11px] text-faint">{r.desc}</p></div>,
            <span className="tabular-nums">{granted}/{TOTAL_PERMS}</span>,
            <span className="tabular-nums">{r.users}</span>,
            <div className="flex items-center justify-end gap-1.5">
              <button onClick={() => setEditing({ role: r })} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Edit</button>
              <RowAction>Duplicate</RowAction>
              <button disabled={inUse} title={inUse ? `${r.users} operator${r.users > 1 ? 's' : ''} assigned — reassign them first` : 'Delete role'} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 enabled:hover:bg-rose-500 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Delete</button>
            </div>,
          ]
        })}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">Roles are fully managed by your team — create, edit, duplicate or delete. A role <b>can’t be deleted while operators are still assigned to it</b> (reassign them first), and at least one role must always keep full access so no one gets locked out.</p>
    </div>
  )
}

/* ── System · Users (HQ operators) — create → assign role → invite → status ── */
/* Department is the org unit (who they sit with, from System → Departments);
   role is the RBAC grant set. The two are orthogonal — same department, different
   roles is normal — so they get their own columns. */
const OP_DEPTS = ['Sales', 'Operations', 'Content', 'Engineering'] as const
type OpUser = { id: number; name: string; email: string; dept: string; role: string; status: 'Active' | 'Pending' | 'Disabled'; last: string }
const OPERATORS: OpUser[] = [
  { id: 1, name: 'Trần Quốc Trung', email: 'admin@saramin.vn', dept: 'Content', role: 'Super admin', status: 'Active', last: '5m ago' },
  { id: 2, name: 'Lê Hữu Phong', email: 'ops1@saramin.vn', dept: 'Operations', role: 'Operations', status: 'Active', last: '1h ago' },
  { id: 3, name: 'Nguyễn Thị Lan', email: 'sales1@saramin.vn', dept: 'Sales', role: 'Sales', status: 'Active', last: '2h ago' },
  { id: 4, name: 'Phạm Quang Huy', email: 'sales2@saramin.vn', dept: 'Sales', role: 'Sales', status: 'Pending', last: '—' },
  { id: 5, name: 'Đặng Thu Trang', email: 'content1@saramin.vn', dept: 'Content', role: 'Content editor', status: 'Disabled', last: '2 months ago' },
]
const OP_STATUS: Record<OpUser['status'], StatusTone> = { Active: 'active', Pending: 'pending', Disabled: 'expired' }

/* ── System · Staff directory ─────────────────────────────────────────────────
 * The master people list for HQ — name · email · phone · department. It is the
 * single source that two other places draw from:
 *   • Operators (console logins) — you create an operator by PICKING a staff
 *     member here, then assigning a role. Not every staff member is an operator.
 *   • CRM ownership — a company is assigned to a SALES staff member (its owner).
 * A person's email / department is entered once, here, then reused everywhere.
 */
type Staff = { id: number; name: string; email: string; phone: string; dept: string; title: string }
const STAFF: Staff[] = [
  { id: 1, name: 'Trần Quốc Trung', email: 'admin@saramin.vn', phone: '0901 234 567', dept: 'Content', title: 'Founder / Super admin' },
  { id: 2, name: 'Lê Hữu Phong', email: 'ops1@saramin.vn', phone: '0902 345 678', dept: 'Operations', title: 'Operations lead' },
  { id: 3, name: 'Nguyễn Thị Lan', email: 'sales1@saramin.vn', phone: '0903 456 789', dept: 'Sales', title: 'Account executive' },
  { id: 4, name: 'Phạm Quang Huy', email: 'sales2@saramin.vn', phone: '0904 567 890', dept: 'Sales', title: 'Account executive' },
  { id: 5, name: 'Đặng Thu Trang', email: 'content1@saramin.vn', phone: '0905 678 901', dept: 'Content', title: 'Content editor' },
  { id: 6, name: 'Ngô Minh Tú', email: 'tu@saramin.vn', phone: '0906 789 012', dept: 'Operations', title: 'Moderator' },
  { id: 7, name: 'Vũ Thanh Hải', email: 'hai@saramin.vn', phone: '0907 890 123', dept: 'Sales', title: 'Sales rep' },
  { id: 8, name: 'Seonguk Park', email: 'seonguk@saramin.vn', phone: '0908 901 234', dept: 'Engineering', title: 'Engineering lead' },
]
/** which staff already have a console login (seed operators), by email → role. */
const OPERATOR_ROLE_BY_EMAIL: Record<string, string> = Object.fromEntries(OPERATORS.map((o) => [o.email, o.role]))
/** how many CRM companies a staff member owns (drawn from the CRM company list). */
const companiesOwnedBy = (name: string) => COMPANIES.filter((c) => c.owner === name).length

function AddStaffModal({ onAdd, onClose }: { onAdd: (s: Omit<Staff, 'id'>) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dept, setDept] = useState<string>('Sales')
  const [title, setTitle] = useState('')
  const valid = name.trim() && /.+@.+\..+/.test(email)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Add staff member</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Full name <span className="text-rose-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vũ Thanh Hải" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Email <span className="text-rose-500">*</span></label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@saramin.vn" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand">
                {OP_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Account executive" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>ℹ</span><span>This only adds the person to the directory. It does <b>not</b> grant console access — do that in <b>Users</b> (pick this staff member, assign a role, send the invite).</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => valid && onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim(), dept, title: title.trim() })} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Add to directory</button>
        </div>
      </div>
    </div>
  )
}

function StaffDetail({ s, onBack }: { s: Staff; onBack: () => void }) {
  useDetailCrumb(s.name, onBack)
  const role = OPERATOR_ROLE_BY_EMAIL[s.email]
  const owned = COMPANIES.filter((c) => c.owner === s.name)
  const initials = s.name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()
  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-[16px] font-bold text-white shadow-sm">{initials}</span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Staff member</p>
          <h2 className="mt-0.5 text-[20px] font-bold tracking-tight">{s.name}</h2>
          <p className="text-[11.5px] text-muted">{s.title || '—'} · {s.dept}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <DetailCard title="Contact & org">
          <KV label="Full name" value={s.name} />
          <KV label="Email" value={s.email} />
          <KV label="Phone" value={s.phone || '—'} />
          <KV label="Department" value={s.dept} />
          <KV label="Title" value={s.title || '—'} />
        </DetailCard>
        <div className="space-y-4">
          <DetailCard title="Console access" action={<span className="text-[11px] text-brand">Manage in Users →</span>}>
            {role
              ? <p className="flex items-center gap-2 text-[12.5px]">Operator <Pill tone={role === 'Super admin' ? 'neutral' : 'draft'}>{role}</Pill></p>
              : <p className="text-[12px] text-muted">No console access. Grant it in <b className="text-ink/70">Users</b> — pick this person and assign a role.</p>}
          </DetailCard>
          <DetailCard title="CRM ownership">
            {owned.length
              ? <div className="space-y-1.5">{owned.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5 text-[12px]"><span className="truncate">{c.name}</span><Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill></div>
                ))}</div>
              : <p className="text-[12px] text-muted">{s.dept === 'Sales' ? 'No companies assigned yet.' : 'Not a sales role — no company ownership.'}</p>}
          </DetailCard>
        </div>
      </div>
    </div>
  )
}

function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>(STAFF)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<Staff | null>(null)
  const add = (s: Omit<Staff, 'id'>) => {
    setStaff((prev) => [{ id: Math.max(0, ...prev.map((x) => x.id)) + 1, ...s }, ...prev])
    setAdding(false)
  }
  if (open) return <StaffDetail s={open} onBack={() => setOpen(null)} />
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[64ch] flex-1 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
          The master people list for HQ. Add someone <b>once</b> (name · email · phone · department) and the record is reused elsewhere — <b>Users</b> picks a staff member to grant console access, and <b>CRM</b> assigns companies to a sales staff member as their owner. Adding staff here grants no access on its own.
        </p>
        <button onClick={() => setAdding(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Add staff</button>
      </div>
      <Table
        minW={1180}
        cols={[
          { label: 'Staff', w: '1.1fr' }, { label: 'Title', w: '1.2fr' }, { label: 'Email', w: '1.3fr' }, { label: 'Phone', w: '0.9fr' },
          { label: 'Department', w: '0.8fr' }, { label: 'Console access', w: '1fr' }, { label: 'CRM ownership', w: '1fr' },
        ]}
        rows={staff.map((s) => {
          const role = OPERATOR_ROLE_BY_EMAIL[s.email]
          const owned = companiesOwnedBy(s.name)
          return [
            <button onClick={() => setOpen(s)} className="min-w-0 truncate text-left text-[12.5px] font-medium text-brand hover:underline">{s.name}</button>,
            <span className="truncate text-[12px] text-ink/75">{s.title || '—'}</span>,
            <span className="truncate font-mono text-[11px] text-muted">{s.email}</span>,
            <span className="truncate text-[12px] text-ink/75 tabular-nums">{s.phone}</span>,
            <span className="truncate text-[12px] text-ink/75">{s.dept}</span>,
            role ? <Pill tone={role === 'Super admin' ? 'neutral' : 'draft'}>{role}</Pill> : <span className="text-[11px] text-faint">No access</span>,
            s.dept === 'Sales'
              ? (owned > 0 ? <span className="text-[12px] text-ink/75">{owned} {owned > 1 ? 'companies' : 'company'}</span> : <span className="text-[11px] text-faint">Unassigned</span>)
              : <span className="text-[11px] text-faint">—</span>,
          ]
        })}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Click a name to open the staff record. <b>Console access</b> = whether this person is an operator (and their role) — granted in <b>Users</b>, not here. <b>CRM ownership</b> = companies assigned to a sales staff member. Remove = deactivate (never hard-delete) so historical ownership &amp; the audit trail survive.
      </p>
      {adding && <AddStaffModal onAdd={add} onClose={() => setAdding(false)} />}
    </div>
  )
}

function CreateOperatorModal({ onCreate, onClose }: { onCreate: (name: string, email: string, dept: string, role: string) => void; onClose: () => void }) {
  const [staffId, setStaffId] = useState<number | null>(null)
  const [role, setRole] = useState('')
  // Only staff who aren't already operators can be invited (name/email come from
  // the Staff directory — you don't re-type them here).
  const takenEmails = new Set(OPERATORS.map((o) => o.email))
  const options = STAFF.filter((s) => !takenEmails.has(s.email))
  const picked = STAFF.find((s) => s.id === staffId) ?? null
  const valid = picked && role
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[480px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Create operator</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          {/* step markers */}
          <div className="flex items-center gap-1 text-[10.5px] font-medium text-faint">
            <span className={cn('rounded-full px-2 py-0.5', picked ? 'bg-brand-soft text-brand' : 'bg-brand text-white')}>1 · Pick staff</span><span>→</span>
            <span className={cn('rounded-full px-2 py-0.5', role ? 'bg-brand-soft text-brand' : picked ? 'bg-brand text-white' : 'bg-canvas')}>2 · Assign role</span><span>→</span>
            <span className="rounded-full bg-canvas px-2 py-0.5">3 · Send invite</span>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Staff member <span className="text-rose-500">*</span></label>
            <select value={staffId ?? ''} onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand">
              <option value="">Select a staff member…</option>
              {options.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.dept} · {s.email}</option>)}
            </select>
            <p className="mt-1.5 text-[11px] text-faint">From the <b className="text-ink/70">Staff directory</b> — name, email &amp; department come from their record. Not listed? Add them in <b className="text-ink/70">System → Staff</b> first.</p>
          </div>
          {picked && (
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2.5 text-[11.5px]">
              <div className="col-span-2 min-w-0"><p className="text-[10px] uppercase tracking-wide text-faint">Email (login)</p><p className="truncate font-mono text-[11px] text-ink/80">{picked.email}</p></div>
              <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-faint">Dept</p><p className="truncate text-ink/80">{picked.dept}</p></div>
              <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-faint">Phone</p><p className="truncate text-ink/80 tabular-nums">{picked.phone || '—'}</p></div>
              <div className="col-span-2 min-w-0"><p className="text-[10px] uppercase tracking-wide text-faint">Title</p><p className="truncate text-ink/80">{picked.title || '—'}</p></div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Role <span className="text-rose-500">*</span></label>
            <div className="grid gap-1.5">
              {ROLES.map((r) => (
                <button key={r.name} onClick={() => setRole(r.name)} className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left', role === r.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
                  <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', role === r.name ? 'border-brand' : 'border-line')}>{role === r.name && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-ink">{r.name}</span><span className="block truncate text-[10.5px] text-faint">{r.desc}</span></span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-faint">{grantedCount(expandGrants(r.grants))}/{TOTAL_PERMS}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-faint">No role fits? Define one first in <b className="text-ink/70">System → Roles &amp; permissions</b>.</p>
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span></span><span>Sending the invite emails a one-time activation link. The operator <b>sets their own password</b> — no one types it for them. Their status stays <b>Pending</b> until they activate it, then flips to <b>Active</b>.</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => picked && role && onCreate(picked.name, picked.email, picked.dept, role)} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Create &amp; send invite</button>
        </div>
      </div>
    </div>
  )
}

function AdminUsers() {
  const [users, setUsers] = useState<OpUser[]>(OPERATORS)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => setToast(m)
  const create = (name: string, email: string, dept: string, role: string) => {
    setUsers((prev) => [{ id: Math.max(0, ...prev.map((u) => u.id)) + 1, name, email, dept, role, status: 'Pending', last: '—' }, ...prev])
    setCreating(false)
    flash(`Invitation sent to ${email} — waiting for them to activate the link.`)
  }
  const setStatus = (id: number, status: OpUser['status']) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))

  return (
    <div>
      {toast && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      <ListPage
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ Create operator</button>}
        tabs={[{ label: 'All', count: users.length, active: true }, { label: 'Active', count: users.filter((u) => u.status === 'Active').length }, { label: 'Pending', count: users.filter((u) => u.status === 'Pending').length }, { label: 'Disabled', count: users.filter((u) => u.status === 'Disabled').length }]}
        minW={1060}
        cols={[{ label: 'Operator', w: '1.1fr' }, { label: 'Email (login)', w: '1.4fr' }, { label: 'Department', w: '0.9fr' }, { label: 'Role', w: '1.1fr' }, { label: 'Status', w: '1fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.6fr', align: 'r' }]}
        rows={users.map((u) => [
          <span className="truncate text-[12.5px] font-medium text-ink">{u.name}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{u.email}</span>,
          <span className="truncate text-[12px] text-ink/75">{u.dept}</span>,
          <Pill tone={u.role === 'Super admin' ? 'neutral' : 'draft'}>{u.role}</Pill>,
          u.status === 'Pending'
            ? <span className="inline-flex items-center gap-1.5"><Pill tone="pending">Pending</Pill><span className="text-[10.5px] text-faint">invite sent</span></span>
            : <Pill tone={OP_STATUS[u.status]}>{u.status}</Pill>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Pending'
              ? <><button onClick={() => flash(`Invitation re-sent to ${u.email}.`)} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Resend</button><button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70" title="Demo: simulate the operator activating their link">Simulate activate</button><RowAction tone="rose">Cancel</RowAction></>
              : u.status === 'Disabled'
                ? <button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Re-enable</button>
                : <><RowAction>Change role</RowAction><button onClick={() => setStatus(u.id, 'Disabled')} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Disable</button></>}
          </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Interactive prototype — <b>+ Create operator</b> adds a Pending row; <b>Simulate activate</b> flips it to Active. Full lifecycle &amp; status rules are in the feature spec (↗ View full spec).
      </p>

      {creating && <CreateOperatorModal onCreate={create} onClose={() => setCreating(false)} />}
    </div>
  )
}
/* ── Master data — one place for every reference list ─────────────────────────
 * Single source of truth for the dropdown / filter vocabularies used across all
 * three sites. One page, one left rail of domains, one detail panel. Each domain
 * declares its shape: flat list, tag cloud, two-level taxonomy, or grouped list.
 * Mirrors the client's master-data spec sheet (Industry, Job categories, roles,
 * level, skills, education, languages, job types, locations, currency).
 * ---------------------------------------------------------------------------- */
type MDKind = 'flat' | 'tags' | 'taxonomy' | 'grouped'
type MDDomain = {
  key: string
  label: string
  i18n: string
  used: string
  note: string
  kind: MDKind
  entries?: string[]
  groups?: { name: string; items: string[] }[]
}
const MD_DOMAINS: MDDomain[] = [
  {
    // Numbering series belong in Master data: they are configuration an admin looks
    // up, not something any screen lets you type. Records and documents follow
    // OPPOSITE rules, which is the whole point of listing them side by side.
    key: 'doc-numbering', label: 'Document numbering', i18n: '—', used: 'Company · quotation · sales order · invoice',
    note: 'System-assigned, never editable (except the customer’s own PO number, typed as given). A RECORD id must not be guessable — its sequence would reveal how many customers we have. A DOCUMENT number must be sequential + date-stamped so it is filable, quotable on the phone, and legal for VAT.',
    kind: 'flat',
    entries: [
      'Company (record) — CO-XXXXXXX · e.g. CO-P9FCEPD · 6 encoded chars + 1 check char, Crockford Base32 (no I/L/O/U) · NOT sequential, capacity 1.07 billion',
      'Quotation — QUO-{seq6}-{MM}-{YYYY} · e.g. QUO-009909-07-2026 · sequential',
      'Sales order / PO — PO-{seq6}-{MM}-{YYYY} · e.g. PO-005864-07-2026 · sequential',
      'Invoice, internal — INV-{seq6}-{MM}-{YYYY} · e.g. INV-003390-07-2026 · sequential',
      'Invoice, legal series — issued by the e-invoice provider · e.g. 1C26TAA/0041 · sequential and gapless, required by law',
      'Customer’s own PO number — free text, recorded exactly as given · e.g. PO-VP/2026/044',
    ],
  },
  {
    key: 'industry', label: 'Industry', i18n: 'vi · en · ko', used: 'Company profile · job form · Store filter',
    note: 'Classifies companies (and jobs). Single-level list.', kind: 'flat',
    entries: ['IT / Software', 'FMCG', 'Banking / Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Logistics', 'Construction & Real Estate', 'Hospitality & Tourism', 'Media & Advertising', 'Telecommunications'],
  },
  {
    key: 'job-categories', label: 'Job categories & roles', i18n: 'vi · en · ko', used: 'Job form (Category → Role) · Store filter',
    note: 'Two-level taxonomy: each Category owns a list of Roles (job titles). Roles are children of their category — pick a category on the left to manage its roles. Distinct from System → Roles & permissions (admin RBAC).',
    kind: 'taxonomy',
    groups: [
      { name: 'IT', items: ['Software Developer', 'Machine Learning / AI Engineer', 'Augmented Reality (AR) Developer', 'Internet of Things (IoT) Developer', 'Blockchain Developer', 'DevOps Engineer', 'Data Engineer / Scientist / Analyst', 'Network Engineer / Cyber Security', 'QA / Tester', 'Product Manager / Business Analyst', 'IT Support Specialist', 'IT - Hardware / Network'] },
      { name: 'Business, Finance', items: ['Accountant', 'Financial Analyst', 'Auditor', 'Investment Analyst', 'Business Development', 'Sales Executive'] },
      { name: 'Management', items: ['Project Manager', 'Operations Manager', 'General Manager', 'Team Lead'] },
      { name: 'Manufacturing & Engineering', items: ['Mechanical Engineer', 'Electrical Engineer', 'QA/QC Engineer', 'Production Supervisor'] },
      { name: 'Service', items: ['Customer Service', 'Restaurant Staff', 'Housekeeping', 'Security'] },
      { name: 'Design, Creativity', items: ['UI/UX Designer', 'Graphic Designer', 'Copywriter', 'Video Editor'] },
    ],
  },
  {
    key: 'benefits', label: 'Benefits (phúc lợi)', i18n: 'vi · en · ko', used: 'Job form (Benefits picker) · Job detail · Store filter',
    note: 'A benefit = a fixed TYPE (icon + label, here) + a DESCRIPTION written per job. Typing them is what gives each benefit an icon, a translation and a SEARCH FILTER — a free-text blob can never answer “show me jobs with a shuttle bus”. Kept deliberately short (12, one 4×3 grid): the description carries the detail, so “Phụ cấp” covers ăn trưa / xăng xe / điện thoại / chuyên cần without four separate types. Max 6 per job.',
    kind: 'flat',
    entries: [
      'Lương & thưởng — Pay & bonus',
      'Phụ cấp — Allowances',
      'Bảo hiểm & sức khoẻ — Insurance & health',
      'Nghỉ phép — Paid leave',
      'Làm việc linh hoạt — Flexible working',
      'Đưa đón & chỗ ở — Transport & housing',
      'Căn-tin — Canteen',
      'Trang bị làm việc — Equipment & uniform',
      'Đào tạo & thăng tiến — Training & career',
      'Du lịch & hoạt động — Trips & activities',
      'Chăm lo gia đình — Family care',
      'Khác — Other (tiêu đề tự nhập, luôn xếp cuối)',
    ],
  },
  {
    key: 'job-level', label: 'Job level', i18n: 'vi · en · ko', used: 'Job form · Store filter',
    note: 'Seniority of the posting. Single-level list.', kind: 'flat',
    entries: ['Intern/Student', 'Fresher/Entry level', 'Experienced (non-manager)', 'Manager', 'Director and above'],
  },
  {
    key: 'skills', label: 'Skills', i18n: 'vi · en', used: 'Job form · resume · Store filter (tags)',
    note: 'Free-growing tag vocabulary; can be connected to Job categories / roles. Displayed as tags on the Jobseeker site.', kind: 'tags',
    entries: ['ASP.NET Core', '.NET', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'SQL Server', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'Photoshop', 'SEO', 'Copywriting', 'Japanese N2', 'Excel'],
  },
  {
    key: 'education', label: 'Education level', i18n: 'vi · en', used: 'Job form (min. education) · resume',
    note: 'Single-level list.', kind: 'flat',
    entries: ['High school', "Associate's degree", 'College', 'Bachelor', 'Master', 'Doctorate', 'Others'],
  },
  {
    key: 'languages', label: 'Preferred languages for application', i18n: 'vi · en', used: 'Job form · resume',
    note: 'Languages a candidate may apply / be assessed in. Single-level list.', kind: 'flat',
    entries: ['English', 'Vietnamese', 'Japanese', 'Chinese', 'Korean', 'French', 'Spanish', 'Italian'],
  },
  {
    // TWO axes, two lists — see Job management → "WORK TYPE and CONTRACT TYPE are
    // TWO fields". They combine freely ("Fulltime + Remote"), so one merged list
    // would force the employer to pick a side and drop the other half.
    key: 'work-types', label: 'Work types (job_type)', i18n: 'vi · en · ko', used: 'Job form · Search filter · Matching',
    note: 'WHERE and HOW the work happens. Single-level list.', kind: 'flat',
    entries: ['In office', 'Remote', 'Hybrid', 'Oversea'],
  },
  {
    key: 'contract-types', label: 'Contract types (contract_type)', i18n: 'vi · en · ko', used: 'Job form · Search filter',
    note: 'The EMPLOYMENT RELATIONSHIP. Job side only — the candidate is never asked for one, so this drives the jobseeker\u2019s SEARCH FILTER, not the match score. No "Other": a catch-all here meant the old list was carrying two axes at once.', kind: 'flat',
    entries: ['Fulltime', 'Part-time', 'Fixed-term contract', 'Internship', 'Probation', 'Freelance', 'Seasonal'],
  },
  {
    // Gates the Locations field: a Vietnamese company picks a province from
    // Locations below; a foreign one does not, and writes its city into Address.
    key: 'country', label: 'Country (quốc tịch công ty)', i18n: 'vi · en', used: 'Company profile (create + detail)',
    note: 'Nationality of the COMPANY — where it is registered, not where its office is. Việt Nam is the default and the only value that reveals the Vietnamese province picker. Single-level list.',
    kind: 'flat',
    entries: ['Việt Nam', 'Hàn Quốc / Korea', 'Nhật Bản / Japan', 'Singapore', 'Hoa Kỳ / United States', 'Trung Quốc / China', 'Đài Loan / Taiwan', 'Thái Lan / Thailand', 'Malaysia', 'Đức / Germany', 'Pháp / France', 'Anh / United Kingdom', 'Úc / Australia', 'Ấn Độ / India', 'Khác / Other'],
  },
  {
    key: 'locations', label: 'Locations', i18n: 'vi · en', used: 'Company profile · job form · Store filter',
    note: 'Vietnamese provinces/cities plus an International bucket. Grouped list.', kind: 'grouped',
    groups: [
      { name: 'Vietnam', items: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Khánh Hòa', '… 63 provinces'] },
      { name: 'International', items: ['International (remote)', 'Japan', 'Singapore', 'Korea', 'Other'] },
    ],
  },
  {
    key: 'currency', label: 'Salary currency', i18n: '—', used: 'Job form (salary range)',
    note: 'ISO currency codes offered in the salary field. Single-level list.', kind: 'flat',
    entries: ['USD', 'VND', 'JPY', 'CNY', 'EUR', 'INR', 'GBP', 'RUB', 'SGD'],
  },
  {
    key: 'company-tag', label: 'Company tag', i18n: 'vi · en', used: 'Company profile · Store filter (tags)',
    note: 'Editorial labels applied to a company (a company can carry several). Displayed as tags on the Company site. Free-growing list — start with the two below.', kind: 'tags',
    entries: ['Korean company', 'Big company'],
  },
]

function MDEntryRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft px-4 py-2.5 text-[12.5px] last:border-0">
      <span className="truncate text-ink/80">{label}</span>
      <div className="flex shrink-0 items-center gap-3">
        <button className="text-[11.5px] text-brand hover:underline">Edit</button>
        <button className="text-[11.5px] text-rose-500 hover:underline">Delete</button>
      </div>
    </div>
  )
}

function MDDomainDetail({ d }: { d: MDDomain }) {
  const [cat, setCat] = useState(0)
  const count = d.kind === 'taxonomy'
    ? (d.groups!.length + d.groups!.reduce((n, g) => n + g.items.length, 0))
    : d.kind === 'grouped'
      ? d.groups!.reduce((n, g) => n + g.items.length, 0)
      : d.entries!.length
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-bold tracking-tight text-ink">{d.label}</h3>
          <p className="mt-0.5 text-[11px] text-muted">{count} entries · Languages: {d.i18n} · Used by: {d.used}</p>
        </div>
        <button className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">+ Add new</button>
      </div>
      <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11.5px] leading-relaxed text-sky-800">{d.note}</div>

      {d.kind === 'taxonomy' && (
        <div className="grid gap-4 md:grid-cols-2">
          <TaxoPane title="Job Category" items={d.groups!.map((g) => g.name)} activeIndex={cat} onSelect={setCat} />
          <TaxoPane title={`Role — in “${d.groups![cat].name}”`} items={d.groups![cat].items} />
        </div>
      )}

      {d.kind === 'grouped' && (
        <div className="space-y-4">
          {d.groups!.map((g) => (
            <div key={g.name} className="overflow-hidden rounded-xl border border-line">
              <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5">
                <span className="text-[12.5px] font-bold text-ink">{g.name}</span>
                <span className="text-[11px] text-faint">· {g.items.length}</span>
                <button className="ml-auto text-[12px] font-medium text-brand hover:underline">Add new +</button>
              </div>
              {g.items.map((it) => <MDEntryRow key={it} label={it} />)}
            </div>
          ))}
        </div>
      )}

      {d.kind === 'tags' && (
        <div className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap gap-1.5">
            {d.entries!.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11.5px] text-brand">{t}<button className="text-brand/50 hover:text-brand">×</button></span>
            ))}
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand/50 px-2.5 py-1 text-[11.5px] font-medium text-brand hover:bg-brand-soft">＋ Add tag</button>
          </div>
        </div>
      )}

      {d.kind === 'flat' && (
        <div className="overflow-hidden rounded-xl border border-line">
          {d.entries!.map((e) => <MDEntryRow key={e} label={e} />)}
        </div>
      )}
    </div>
  )
}

/* ── System → Company information (issuer) ────────────────────────────────────
   The ONE place the letterhead that prints on every selling document is set:
   logo, VN + EN legal name, VN + EN address, website, plus the tax identity and
   bank details the order and invoice need. Never typed per quotation — otherwise
   the same company appears three different ways across three documents, and a
   move of office means editing every template. */
function AdminIssuer() {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const NAME = { VI: 'CÔNG TY TNHH DAOUKIWOOM INNOVATION', EN: 'DAOUKIWOOM INNOVATION COMPANY LIMITED' }
  const ADDR = {
    VI: 'Tầng 12, 13 & 14, Tòa nhà AP, 518B Điện Biên Phủ, Phường Thạnh Mỹ Tây, Thành Phố Hồ Chí Minh, Việt Nam',
    EN: 'Level 12, 13 & 14, AP Tower, 518B Dien Bien Phu Street, Thanh My Tay Ward, Ho Chi Minh City, Vietnam',
  }
  return (
    <div className="max-w-[900px]">
      <p className="mb-3 max-w-[70ch] text-[11.5px] leading-relaxed text-muted">
        The issuer identity printed at the top of every quotation, sales order and VAT invoice. Set once here —
        documents read it, so nobody retypes it and past documents keep the version they were sent with.
      </p>

      {/* live letterhead preview — what the customer actually sees */}
      <div className="mb-4 overflow-hidden rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-line bg-canvas/50 px-3 py-1.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Letterhead preview</p>
          <div className="flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
            {(['VI', 'EN'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={cn('px-2 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 bg-surface p-4">
          <div className="min-w-0 text-[11.5px] leading-relaxed">
            <p className="font-bold text-ink">{NAME.VI}</p>
            <p className="font-bold text-ink">{NAME.EN}</p>
            <p className="mt-0.5 text-ink/80">{ADDR[lang]}</p>
            <p className="text-brand">https://topdev.vn</p>
            <p className="mt-1.5 text-ink/70">Báo giá bởi / Proposed by: Nguyễn Thị Lan | lan.nguyen@topdev.vn <span className="text-faint">— the signed-in rep, not a setting</span></p>
          </div>
          <div className="grid h-12 w-28 shrink-0 place-items-center rounded-md border border-dashed border-line bg-canvas/60 text-[11px] font-bold tracking-tight text-ink/60">saramin</div>
        </div>
      </div>

      <div className="space-y-4">
        <JobGroup title="Legal identity">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Tên công ty (VI)" req value={NAME.VI} hint="Prints on line 1 of the letterhead." />
            <LField label="Company name (EN)" req value={NAME.EN} hint="Prints on line 2 — both always print, in both languages." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Mã số thuế / Tax code" req value="0313545562" hint="The ISSUER’s MST — not the customer’s." />
            <LField label="Website" value="https://topdev.vn" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TArea label="Địa chỉ (VI)" req value={ADDR.VI} rows={2} />
            <TArea label="Address (EN)" req value={ADDR.EN} rows={2} />
          </div>
        </JobGroup>

        <JobGroup title="Brand">
          <div>
            <LabelRow label="Logo" />
            <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 p-3">
              <div className="grid h-12 w-28 shrink-0 place-items-center rounded-md border border-dashed border-line bg-surface text-[11px] font-bold tracking-tight text-ink/60">saramin</div>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-ink/80">saramin-logo.svg · 420×96</p>
                <p className="text-[10.5px] text-faint">SVG or PNG at 2× · max 400 KB · transparent background. Printed top-right on every document.</p>
              </div>
              <button className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">Replace</button>
            </div>
          </div>
        </JobGroup>

        <JobGroup title="Document defaults">
          <div className="grid grid-cols-3 gap-3">
            <LField label="Thuế suất VAT / VAT rate" req value="8%" select hint="A State rate change is made here once (T&C clause 6). A sent document keeps the rate it was sent with." />
            <LField label="Quotation validity" req value="Đến hết tháng / End of month" select hint="Every quotation lapses on the last day of the month it was raised in — so validity shrinks through the month." />
            <LField label="Discount needing approval" req value="> 20%" hint="Above this, Send is blocked pending a sales lead." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LField label="Quotation no. format" value="QUO-{seq}-{MM}-{YYYY}" hint="Gapless sequence." />
            <LField label="Sales order no. format" value="PO-{seq6}-{MM}-{YYYY}" hint="Same shape as quotation and invoice — only the prefix differs." />
            <LField label="Support email" value="customercare@topdev.vn" hint="Printed in T&C clause 6." />
          </div>
        </JobGroup>

        <JobGroup title="Bank details — printed on the order for payment">
          <div className="grid grid-cols-3 gap-3">
            <LField label="Ngân hàng / Bank" req value="Vietcombank — CN Tân Bình" />
            <LField label="Số tài khoản / Account no." req value="0071 0004 12345" />
            <LField label="Chủ tài khoản / Account name" req value="CONG TY TNHH DAOUKIWOOM INNOVATION" />
          </div>
          <p className="text-[10.5px] leading-relaxed text-faint">
            Sent with the sales order because the default payment term is 100% in advance — the customer pays before the VAT
            e-invoice is issued (T&amp;C clause 3).
          </p>
        </JobGroup>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-amber-900">
          Editing these values is <b>versioned, not retroactive</b>. Documents already sent keep the letterhead, VAT rate and
          bank details they were issued with — reprinting a year-old quotation must produce the identical page.
        </p>
        <button className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Save</button>
      </div>
    </div>
  )
}

/* ── System → Membership tiers ─────────────────────────────────────────────────
   The settings page behind the loyalty programme. Two tables and nothing else:
   the thresholds that earn a tier, and the reward catalogue each tier unlocks.
   Both are data, because the programme is re-issued every year — 2025's bands are
   already different from 2026's, and that must never be a code change.

   Only ONE number per tier is stored (the lower bound). The "đến dưới" column is
   derived from the next band up, so the bands can never overlap or leave a gap. */
function AdminMembership() {
  const noTier = COMPANIES.filter((c) => !tierOf(c)).length
  const countOf = (k: Tier) => COMPANIES.filter((c) => tierOf(c)?.key === k).length
  return (
    <div>
      <div className="mb-3 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
        <b>Chương trình Khách hàng Thân thiết {TIER_YEAR}</b> — hạng thành viên được <b>tính tự động</b> từ tổng giá trị đơn hàng
        tích lũy của công ty <b>trong một năm</b>. Sales không set hạng bằng tay. Tích lũy <b>reset về 0 vào {TIER_RESET}</b>;
        hạng năm nay không mang sang năm sau.
      </div>

      <div className="space-y-4">
        {/* ── Thresholds ───────────────────────────────────────────────────── */}
        <JobGroup title="Tier thresholds">
          <Table
            minW={720}
            cols={[
              { label: 'Danh hiệu', w: '1.2fr' },
              { label: 'Từ (tích lũy ≥)', w: '1.1fr' },
              { label: 'Đến dưới', w: '1.1fr' },
              { label: 'Công ty đang ở hạng này', w: '1fr', align: 'r' },
            ]}
            rows={[
              [
                <span className="text-[11.5px] text-faint">Chưa có hạng</span>,
                <span className="tabular-nums text-faint">0 ₫</span>,
                <span className="tabular-nums text-faint">{vnd(TIERS[0].from)}</span>,
                <span className="tabular-nums text-muted">{noTier}</span>,
              ],
              ...TIERS.map((t, i) => [
                <span className="flex items-center gap-2"><TierPill tier={t} en /></span>,
                <input
                  readOnly
                  value={t.from.toLocaleString('en-US')}
                  className="w-full rounded-md border border-line bg-surface px-2 py-1 text-right text-[12px] tabular-nums text-ink"
                />,
                <span className="tabular-nums text-muted">{TIERS[i + 1] ? vnd(TIERS[i + 1].from) : 'không giới hạn'}</span>,
                <span className="tabular-nums font-medium text-ink">{countOf(t.key)}</span>,
              ]),
            ]}
          />
        </JobGroup>

        {/* ── Reward catalogue ─────────────────────────────────────────────── */}
        <JobGroup title="Danh mục quyền lợi theo hạng">
          {/* A matrix of benefit × tier implied the system grants and tracks each cell.
              It does not — quyền lợi are agreed and delivered by hand — so this is a
              note per tier that CSKH writes and reads, not data anything computes. */}
          <div className="space-y-2.5">
            {TIERS.map((t) => (
              <div key={t.key} className="rounded-lg border border-line">
                <div className="flex items-center gap-2 border-b border-line-soft bg-canvas/50 px-3 py-2">
                  <TierPill tier={t} en />
                  <span className="text-[11px] text-faint">tích lũy ≥ {vnd(t.from)}</span>
                </div>
                {/* Rich-text placeholder: the real screen gets bold / list / link. */}
                <div className="flex items-center gap-1 border-b border-line-soft px-2 py-1 text-[11px] text-faint">
                  {['B', 'I', 'U', '•', '1.', ''].map((b) => (
                    <span key={b} className={cn('grid h-5 min-w-5 place-items-center rounded px-1 hover:bg-canvas', b === 'B' && 'font-bold', b === 'I' && 'italic', b === 'U' && 'underline')}>{b}</span>
                  ))}
                </div>
                <div className="px-3 py-2.5 text-[11.5px] leading-relaxed text-faint" style={{ minHeight: 66 }}>
                  Ghi chú quyền lợi của hạng {t.vi} — CSKH tự nhập và tự theo dõi. Hệ thống không cấp và không trừ quyền lợi tự động.
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10.5px] leading-relaxed text-faint">
            Chỉ là ghi chú. Hạng thành viên vẫn được tính tự động từ tích lũy đơn hàng, nhưng <b className="text-ink/70">quyền lợi
            thì thoả thuận và thực hiện thủ công</b> — không có bản ghi cấp phát nào được sinh ra từ đây.
          </p>
        </JobGroup>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2.5">
        <button className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Save</button>
      </div>
    </div>
  )
}

function AdminMasterData() {
  const [sel, setSel] = useState(0)
  const active = MD_DOMAINS[sel]
  return (
    <div>
      <div className="mb-3 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
        <b>Master data</b> — one source of truth for every reference list (dropdown / filter vocabulary) used across the Jobseeker, Company and Admin sites. Managing it here keeps the job form, resume form and Store search filters consistent. <b>vi</b> mandatory · <b>en / ko</b> optional.
      </div>
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        {/* left rail — domains */}
        <div className="overflow-hidden rounded-xl border border-line">
          {MD_DOMAINS.map((d, i) => (
            <button
              key={d.key}
              onClick={() => setSel(i)}
              className={cn('flex w-full items-center justify-between gap-2 border-b border-line-soft px-3.5 py-2.5 text-left last:border-0 hover:bg-canvas/50', i === sel && 'bg-brand-soft')}
            >
              <span className={cn('truncate text-[12.5px]', i === sel ? 'font-semibold text-brand' : 'text-ink/80')}>{d.label}</span>
              <span className="shrink-0 rounded-full bg-canvas px-1.5 text-[10px] tabular-nums text-faint">
                {d.kind === 'taxonomy' ? d.groups!.length : d.kind === 'grouped' ? d.groups!.reduce((n, g) => n + g.items.length, 0) : d.entries!.length}
              </span>
            </button>
          ))}
        </div>
        {/* detail */}
        <MDDomainDetail key={active.key} d={active} />
      </div>
      <p className="mt-3 text-[11px] text-faint">
        Each domain feeds the matching form dropdown; operators can also add a new value inline from those dropdowns (＋ Create new…) — new values are saved back here.
      </p>
    </div>
  )
}
function AdminAuditLog() {
  const rows = [
    ['10:42', 'Nguyễn Thị Lan', 'Activated customer', 'Công ty Vạn Phát'],
    ['10:31', 'Phạm Quang Huy', 'Viewed resume (PII)', 'CV #48211'],
    ['09:58', 'Lê Hữu Phong', 'Approved job', 'Digital Marketing Lead · Tiki'],
    ['09:40', 'Trần Quốc Trung', 'Granted credits (+500)', 'FPT Software'],
    ['09:12', 'System', 'Issued e-invoice', 'INV-003390-07-2026'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Time', w: '0.7fr' }, { label: 'Actor', w: '1.2fr' }, { label: 'Action', w: '1.6fr' }, { label: 'Target', w: '1.8fr', align: 'r' }]}
      rows={rows}
    />
  )
}
function AdminEnvironment() {
  const flags = [
    { name: 'store.jobs.realData', desc: 'Store job search reads real backend', on: true },
    { name: 'store.companies.reviews', desc: 'Company reviews (UGC) visible', on: false },
    { name: 'crm.purchaseOrders', desc: 'PO / payments / contracts enabled', on: false },
    { name: 'notifications.zaloZNS', desc: 'Zalo ZNS delivery channel', on: false },
  ]
  return (
    <div>
      <div className="space-y-2">
        {flags.map((f) => (
          <div key={f.name} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[12px] font-medium text-ink">{f.name}</p>
              <p className="text-[11.5px] text-muted">{f.desc}</p>
            </div>
            <span className={cn('relative h-5 w-9 rounded-full transition-colors', f.on ? 'bg-brand' : 'bg-line')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', f.on ? 'left-4' : 'left-0.5')} />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-faint">Feature flags gate which Store screens use real data vs mock · some UI-editable, some env-only</p>
    </div>
  )
}
function AdminDepartments() {
  const rows = [
    ['Sales', '8', 'Nguyễn Thị Lan'],
    ['Operations', '12', 'Lê Hữu Phong'],
    ['Content', '5', 'Trần Quốc Trung'],
    ['Engineering', '14', 'Seonguk'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Department', w: '1.6fr' }, { label: 'Members', w: '0.8fr', align: 'r' }, { label: 'Lead', w: '1.4fr', align: 'r' }]}
      rows={rows}
    />
  )
}

/* ── Sales / CRM — Sign-ups (inbound self-registrations) ─────────────────── */
type SignupStatus = 'New' | 'Resolved' | 'Archived'
type Signup = {
  person: string; email: string; phone: string; tax: string; company: string; hiring: boolean; when: string
  /** gate 1 — email verified? HQ can only act on verified rows. */
  verified: boolean
  /** MATCH is binary and informational: did the tax code match a company we already have? */
  matched: boolean; matchName?: string
  status: SignupStatus
  /** what happened once resolved */
  outcome?: string
}
/* Two gates: (1) EMAIL VERIFIED — automatic, gates whether HQ can act; (2) HQ placement.
   MATCH is just information. The ACTION is the SAME 3 choices for every verified sign-up:
   move to an existing company · create a new company + move · archive.
   Move / Create unlock login + send a "you’re in" email (password already set at sign-up). */
const SIGNUP_STATUS: Record<SignupStatus, StatusTone> = { New: 'pending', Resolved: 'active', Archived: 'expired' }
const SIGNUPS: Signup[] = [
  { person: 'Nguyễn Văn Toàn', email: 'toan@daiduong.vn', phone: '0903 112 456', tax: '0315xxxxxx', company: 'Công ty TNHH Đại Dương', hiring: true, when: '15m ago', verified: true, matched: false, status: 'New' },
  { person: 'Trần Thị Hà', email: 'ha@viettien.vn', phone: '0912 445 780', tax: '0314xxxxxx', company: 'Việt Tiến Logistics', hiring: true, when: '1h ago', verified: true, matched: true, matchName: 'Cty TNHH Việt Tiến', status: 'New' },
  { person: 'Lê Minh Khôi', email: 'khoi@fpt.com.vn', phone: '0977 320 118', tax: '0301xxxxxx', company: 'FPT Software', hiring: true, when: '3h ago', verified: true, matched: true, matchName: 'FPT Software', status: 'Resolved', outcome: 'Moved to FPT Software · sign-in email sent' },
  { person: 'Phạm Thu Trang', email: 'trang@newco.vn', phone: '0905 771 220', tax: '0399xxxxxx', company: 'Công ty CP NewCo', hiring: true, when: '20m ago', verified: false, matched: false, status: 'New' },
  { person: 'Đỗ Quốc Bảo', email: 'baohr@gmail.com', phone: '0938 015 662', tax: '—', company: 'Startup ABC', hiring: false, when: '5h ago', verified: true, matched: false, status: 'New' },
  { person: 'asdf qwer', email: 'x@spam.io', phone: '—', tax: '—', company: 'zzz', hiring: false, when: '6h ago', verified: false, matched: false, status: 'Archived', outcome: 'Archived' },
]
/* The three sign-up actions, each with its own confirm flow. Move / Create both end by
   emailing the user a set-password / activation link; Archive discards the request. */
function SignupActionModal({ mode, s, onConfirm, onClose }: { mode: 'move' | 'create' | 'archive'; s: Signup; onConfirm: (status: SignupStatus, outcome: string) => void; onClose: () => void }) {
  const targets = Array.from(new Set(COMPANIES.map((c) => (c.shortName?.trim() || c.name))))
  const [company, setCompany] = useState(s.matchName ?? targets[0] ?? '')
  const [role, setRole] = useState<CoUserRole>('Recruiter')
  const [newName, setNewName] = useState(s.company)
  const [newTax, setNewTax] = useState(s.tax === '—' ? '' : s.tax)
  const [reason, setReason] = useState('')
  const title = mode === 'move' ? `Move ${s.person} to an existing company` : mode === 'create' ? `Create a new company & move ${s.person} in` : 'Archive this sign-up?'
  const activation = <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>✉️</span><span>This unlocks login and emails the user <b>“you’re in — sign in”</b>. They sign in with the password they set at sign-up. (Their email is already verified.)</span></p>
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[480px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">{title}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <div className="rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px] text-muted">
            Signed up as <b className="text-ink/80">{s.person}</b> · <span className="font-mono">{s.email}</span> · typed company “<b className="text-ink/80">{s.company}</b>”{s.tax !== '—' ? ` · MST ${s.tax}` : ''}
          </div>

          {mode === 'move' && (
            <>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Move into company <span className="text-rose-500">*</span></p>
                <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {s.matchName && !targets.includes(s.matchName) && <option value={s.matchName}>{s.matchName} (tax match)</option>}
                  {targets.map((n) => <option key={n} value={n}>{n}{n === s.matchName ? ' (tax match)' : ''}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Role in that company <span className="text-rose-500">*</span></p>
                <select value={role} onChange={(e) => setRole(e.target.value as CoUserRole)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {CO_ROLE_DEFS.map((r) => <option key={r.name} value={r.name}>{r.name}{r.admin ? ' (account owner)' : ''}</option>)}
                </select>
              </div>
              {activation}
            </>
          )}

          {mode === 'create' && (
            <>
              <p className="text-[12px] text-muted">Create a fresh company from this sign-up and make this person its <b className="text-ink/80">Admin</b>.</p>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Company name <span className="text-rose-500">*</span></p>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink" />
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Tax number</p>
                <input value={newTax} onChange={(e) => setNewTax(e.target.value)} placeholder="Business registration no." className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint" />
              </div>
              <p className="text-[11px] text-faint">Role: <b className="text-ink/70">Admin</b> — the first user of a new company is always its Admin.</p>
              {activation}
            </>
          )}

          {mode === 'archive' && (
            <>
              <p className="text-[12px] text-muted">Discard this sign-up — <b className="text-ink/80">no account is created</b> and no email is sent. Reversible and written to the audit log.</p>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Reason <span className="text-rose-500">*</span></p>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. spam / test / not a real company" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint" />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          {mode === 'move' && <button onClick={() => onConfirm('Resolved', `Moved to ${company} as ${role} · activation email sent`)} className="rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Move + send activation</button>}
          {mode === 'create' && <button onClick={() => onConfirm('Resolved', `New company “${newName}” created · user is Admin · activation email sent`)} disabled={!newName.trim()} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Create + move</button>}
          {mode === 'archive' && <button onClick={() => onConfirm('Archived', `Archived${reason.trim() ? ` · ${reason.trim()}` : ''}`)} disabled={!reason.trim()} className="rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Archive sign-up</button>}
        </div>
      </div>
    </div>
  )
}

/* Row actions live behind a ⋯ menu. Fixed-positioned from the button rect so it
   never gets clipped by the table's horizontal-scroll container. */
function SignupRowMenu({ onMove, onCreate, onArchive }: { onMove: () => void; onCreate: () => void; onArchive: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const toggle = () => {
    const el = ref.current
    if (!open && el) { const r = el.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.right - 200 }) }
    setOpen((o) => !o)
  }
  const item = 'block w-full px-3 py-2 text-left text-[12px] hover:bg-canvas/70'
  return (
    <>
      <button ref={ref} onClick={toggle} aria-label="Actions" className="grid h-7 w-7 place-items-center rounded-md border border-line text-[15px] leading-none text-muted hover:bg-canvas/70">⋯</button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', top: pos.top, left: pos.left }} className="z-50 w-[200px] overflow-hidden rounded-lg border border-line bg-surface shadow-xl">
            <button onClick={() => { setOpen(false); onMove() }} className={cn(item, 'text-ink')}>Move to existing company</button>
            <button onClick={() => { setOpen(false); onCreate() }} className={cn(item, 'text-ink')}>Create new company + move</button>
            <button onClick={() => { setOpen(false); onArchive() }} className={cn(item, 'border-t border-line text-rose-600')}>Archive sign-up</button>
          </div>
        </>
      )}
    </>
  )
}

function AdminSignups() {
  const [rows, setRows] = useState<Signup[]>(SIGNUPS)
  const [modal, setModal] = useState<{ mode: 'move' | 'create' | 'archive'; s: Signup } | null>(null)
  const resolve = (status: SignupStatus, outcome: string) => {
    if (!modal) return
    setRows((rs) => rs.map((r) => (r.email === modal.s.email ? { ...r, status, outcome } : r)))
    setModal(null)
  }
  return (
    <div>
      <ListPage
        tabs={[{ label: 'All', count: 34 }, { label: 'New', count: 22, active: true }, { label: 'Resolved', count: 9 }, { label: 'Archived', count: 3 }]}
        cols={[
          { label: 'Full name', w: '1fr' }, { label: 'Email', w: '1.2fr' }, { label: 'Phone', w: '0.8fr' },
          { label: 'Tax number', w: '0.8fr' }, { label: 'Company name', w: '1fr' }, { label: 'Hiring', w: '0.5fr' },
          { label: 'Email verified', w: '1fr' }, { label: 'Match', w: '0.9fr' }, { label: 'Status', w: '1.1fr' }, { label: 'When', w: '0.6fr' },
          { label: 'Action', w: '1.3fr', align: 'r' },
        ]}
        rows={rows.map((s) => [
          <span className="truncate text-[12.5px] font-medium text-ink">{s.person}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{s.email}</span>,
          <span className="truncate text-[11.5px] text-muted">{s.phone}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{s.tax}</span>,
          <span className="truncate text-[12px] text-ink/80">{s.company}</span>,
          <Pill tone={s.hiring ? 'active' : 'neutral'}>{s.hiring ? 'Yes' : 'No'}</Pill>,
          s.verified
            ? <Pill tone="active">✓ Verified</Pill>
            : <Pill tone="pending">Awaiting</Pill>,
          s.matched
            ? <Pill tone="active">Match{s.matchName ? `: ${s.matchName}` : ''}</Pill>
            : <Pill tone="neutral">Not match</Pill>,
          <div className="min-w-0">
            <Pill tone={SIGNUP_STATUS[s.status]}>{s.status}</Pill>
            {s.outcome && <p className="mt-0.5 truncate text-[10.5px] text-faint">{s.outcome}</p>}
          </div>,
          <span className="text-[11.5px] text-muted">{s.when}</span>,
          s.status !== 'New'
            ? <span className="text-[11px] text-faint">—</span>
            : !s.verified
              ? <span className="whitespace-nowrap text-[10.5px] text-amber-700">Awaiting email verification</span>
              : <div className="flex justify-end">
                  <SignupRowMenu
                    onMove={() => setModal({ mode: 'move', s })}
                    onCreate={() => setModal({ mode: 'create', s })}
                    onArchive={() => setModal({ mode: 'archive', s })}
                  />
                </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        <b>Two gates:</b> a row is actionable only once <b>Email verified</b> (gate 1, automatic) — until then it shows “awaiting email verification.” Then HQ (gate 2) picks the <b>same three choices</b> for any verified row — <b>Move to existing</b>, <b>Create + move</b>, or <b>Archive</b>. Move / Create unlock login and email the user “you’re in — sign in” (password already set). <b>Match</b> is just a hint (did the tax code hit an existing company?).
      </p>
      {modal && <SignupActionModal mode={modal.mode} s={modal.s} onConfirm={resolve} onClose={() => setModal(null)} />}
    </div>
  )
}

/* ── registry ─────────────────────────────────────────────────────────────── */
/* ── Reference data — Job categories & roles ─────────────────────────────── */
function TaxoPane({ title, items, activeIndex, onSelect }: { title: string; items: string[]; activeIndex?: number; onSelect?: (i: number) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5">
        <span className="text-[12.5px] font-bold text-ink">{title}</span>
        <button className="text-[12px] font-medium text-brand hover:underline">Add new +</button>
      </div>
      <div className="max-h-[420px] overflow-auto">
        {items.map((it, i) => (
          <div
            key={i}
            onClick={() => onSelect?.(i)}
            className={cn(
              'flex items-center justify-between border-b border-line-soft px-4 py-2.5 text-[12.5px] last:border-0',
              onSelect && 'cursor-pointer hover:bg-canvas/50',
              i === activeIndex && 'bg-brand-soft',
            )}
          >
            <span className={cn('truncate', i === activeIndex ? 'font-medium text-brand' : 'text-ink/80')}>{it}</span>
            <button className="shrink-0 text-[11.5px] text-brand hover:underline">Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Create Job — draft field map ─────────────────────────────────────────────
 * A field inventory for the job-create form, NOT final visual design.
 * Structure adapted from the TopDev job dashboard (9-tab layout) and cross-checked
 * against a live Saramin post. Placeholder values are illustrative. Fields tagged
 * `confirm` need client sign-off (legal / VN-market / commercial specifics).
 * ------------------------------------------------------------------------------ */



function FLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{children}{req && <span className="text-rose-500"> *</span>}</label>
}

/** free-text textarea placeholder */
function TArea({ label, req, value, rows = 3, hint, extra }: { label: React.ReactNode; req?: boolean; value: string; rows?: number; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-faint" style={{ minHeight: rows * 20 }}>{value}</div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/** multi-value chip / token input placeholder */
function ChipField({ label, req, chips, placeholder, hint, extra }: { label: React.ReactNode; req?: boolean; chips: string[]; placeholder: string; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5">
        {chips.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">{c}<span className="text-brand/50">×</span></span>
        ))}
        <span className="px-1 text-[12px] text-faint">{placeholder}</span>
      </div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/* ── Job skills — ONE field ──────────────────────────────────────────────────
   A single list, drawn from the canonical Skill taxonomy (never free text — that
   is what lets a JD skill join to a CV skill).

   Skills RANK candidates, they do not exclude anyone: a flat list where every
   entry filtered would narrow the pool to nothing after four or five picks. The
   candidate line is there so an employer can see how rare their combination is
   before they publish. */
const SKILL_POOL: { name: string; sel: number }[] = [
  { name: 'React', sel: 0.20 },
  { name: 'TypeScript', sel: 0.35 },
  { name: 'Node.js', sel: 0.30 },
  { name: 'Git', sel: 0.55 },
  { name: 'ASP.NET Core', sel: 0.10 },
  { name: '.NET', sel: 0.14 },
  { name: 'GraphQL', sel: 0.12 },
  { name: 'Docker', sel: 0.18 },
  { name: 'Kubernetes', sel: 0.06 },
  { name: 'AWS', sel: 0.15 },
  { name: 'Figma', sel: 0.22 },
]
const BASE_POOL = 3200
const SKILL_CAP = 10

/* Suggestions for the EMPLOYER, keyed on the job's own Job role — the same
   occupation↔skill map the candidate side reads, just entered from the job end
   instead of the desired-role end. ESSENTIAL rows first, then OPTIONAL; that
   flag is already on the client's occupation_skill table, so the ordering costs
   no demand data and no new backend. */
const ROLE_SKILL_MAP: Record<string, { name: string; essential: boolean }[]> = {
  'Software Developer': [
    { name: 'Git', essential: true },
    { name: 'TypeScript', essential: true },
    { name: 'React', essential: true },
    { name: 'Node.js', essential: true },
    { name: 'Docker', essential: false },
    { name: 'AWS', essential: false },
    { name: 'GraphQL', essential: false },
    { name: 'Kubernetes', essential: false },
  ],
  'DevOps Engineer': [
    { name: 'Docker', essential: true },
    { name: 'Kubernetes', essential: true },
    { name: 'AWS', essential: true },
    { name: 'Git', essential: true },
    { name: 'Node.js', essential: false },
  ],
}
const SUGGEST_CAP = 6

function JobSkillsField({ roles = ['Software Developer'] }: { roles?: string[] } = {}) {
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'GraphQL'])
  const [adding, setAdding] = useState(false)

  const sel = (n: string) => SKILL_POOL.find((s) => s.name === n)?.sel ?? 0.25
  const count = Math.max(1, Math.round(skills.reduce((acc, n) => acc * sel(n), BASE_POOL)))
  const available = SKILL_POOL.filter((s) => !skills.includes(s.name))
  const full = skills.length >= SKILL_CAP
  /* UNION across every role on the job, not just the first — a job tagged
     "Software Developer + DevOps Engineer" wants both lists. A skill that is
     ESSENTIAL for ANY of the roles counts as essential; essentials first, then
     optionals, minus what is already on the job, capped at 6. Same rule as the
     candidate side with several desired roles — only the key differs. */
  const merged = new Map<string, boolean>()
  for (const r of roles) {
    for (const s of ROLE_SKILL_MAP[r] ?? []) {
      merged.set(s.name, (merged.get(s.name) ?? false) || s.essential)
    }
  }
  const suggestions = [...merged]
    .map(([name, essential]) => ({ name, essential }))
    .filter((s) => !skills.includes(s.name))
    .sort((a, b) => Number(b.essential) - Number(a.essential))
    .slice(0, SUGGEST_CAP)

  return (
    <div>
      <LabelRow label="Skills" req right={<span className={cn('text-[10.5px] tabular-nums', full ? 'font-medium text-amber-600' : 'text-faint')}>{skills.length}/{SKILL_CAP}</span>} />
      <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5">
        {skills.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">
            {c}
            <span onClick={() => setSkills((a) => a.filter((x) => x !== c))} className="cursor-pointer opacity-60 hover:opacity-100">×</span>
          </span>
        ))}
        {!full && <button onClick={() => setAdding((o) => !o)} className="px-1 text-[11.5px] font-medium text-brand">＋ Add skill</button>}
      </div>

      {adding && (
        <div className="mt-1 overflow-hidden rounded-md border border-line bg-surface shadow-sm">
          <p className="border-b border-line-soft bg-canvas/50 px-2.5 py-1 text-[10px] text-faint">From the Skill taxonomy — type to search</p>
          {available.slice(0, 6).map((s) => (
            <button
              key={s.name}
              onClick={() => { setSkills((a) => [...a, s.name]); setAdding(false) }}
              className="flex w-full items-center border-b border-line-soft px-2.5 py-1.5 text-left text-[11.5px] text-ink/80 last:border-b-0 hover:bg-canvas/60"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions — read from occupation_skill, keyed on the job's own Job
          role. One tap each; essentials first so the ordering itself tells the
          employer what matters. Never auto-added: a suggestion the employer did
          not choose would silently change who the job ranks. */}
      {!full && suggestions.length > 0 && (
        <div className="mt-1.5 rounded-md border border-line bg-canvas/40 px-2.5 py-2">
          <p className="text-[10.5px] text-muted">
            Common for <b className="font-medium text-ink/80">{roles.join(' + ')}</b> <span className="text-faint">· essential first</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <span
                key={s.name}
                onClick={() => setSkills((a) => [...a, s.name])}
                title={s.essential ? 'Essential for this role' : 'Optional for this role'}
                className={cn(
                  'cursor-pointer rounded-full border px-2 py-0.5 text-[11px]',
                  s.essential
                    ? 'border-brand/40 bg-surface font-medium text-brand'
                    : 'border-dashed border-line bg-surface text-muted',
                )}
              >＋ {s.name}</span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-1 text-[10.5px] text-faint">
        <b className="font-medium text-muted tabular-nums">≈ {count.toLocaleString()}</b> candidates have all of these · skills rank candidates, they never exclude anyone.
      </p>
    </div>
  )
}

/** inline single-value field with optional provenance/confirm markers + hint */
function FField({ label, req, value, select, hint, extra }: { label: React.ReactNode; req?: boolean; value: string; select?: boolean; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{value}{select && <span className="ml-auto">▾</span>}</div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/** KV row with a read-only "shown to jobseekers" toggle on the right — mirrors the create form's Show-to-Jobseekers switch. */
function KVShow({ label, value, shown }: { label: string; value: string; shown: boolean }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] uppercase tracking-wide text-faint">{label}</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-[9.5px] text-muted">
          <span className={cn('relative h-3.5 w-6 rounded-full', shown ? 'bg-emerald-500' : 'bg-line')}>
            <span className={cn('absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white', shown ? 'left-[11px]' : 'left-0.5')} />
          </span>
          {shown ? 'Shown' : 'Hidden'}
        </span>
      </div>
      <p className="mt-0.5 text-[12.5px] text-ink/85">{value}</p>
    </div>
  )
}

/* ── Job detail (read-only) — opened by clicking a job title ─────────────────── */
/* Who saved this job. HQ asked to see the people behind the Saves number — a
   save is a demand signal, and a shortlist of warm candidates worth sourcing.
   Names are candidate PII, so opening one is an audited action like any resume view. */
type Saver = { name: string; title: string; exp: string; location: string; when: string; applied: boolean }
const JOB_SAVERS: Saver[] = [
  { name: 'Nguyễn Văn An', title: 'Frontend Engineer', exp: '4 năm', location: 'Hồ Chí Minh', when: '2 giờ trước', applied: true },
  { name: 'Trần Thị Bích', title: 'Digital Marketing Executive', exp: '6 năm', location: 'Hà Nội', when: '5 giờ trước', applied: false },
  { name: 'Lê Hoàng Cường', title: 'Product Manager', exp: '8 năm', location: 'Hồ Chí Minh', when: '1 ngày trước', applied: false },
  { name: 'Phạm Thu Dung', title: 'Content Strategist', exp: '3 năm', location: 'Đà Nẵng', when: '2 ngày trước', applied: true },
  { name: 'Vũ Minh Đức', title: 'Growth Marketing', exp: '5 năm', location: 'Hồ Chí Minh', when: '3 ngày trước', applied: false },
]

function SavedByCard({ job }: { job: JobRow }) {
  const [open, setOpen] = useState(false)
  if (!job.saves) {
    return (
      <DetailCard title="Saved by" action={<span className="text-[11px] text-faint">0 jobseekers</span>}>
        <p className="text-[12px] text-muted">Chưa có ai lưu tin này.</p>
      </DetailCard>
    )
  }
  const shown = open ? JOB_SAVERS : JOB_SAVERS.slice(0, 3)
  return (
    <DetailCard title="Saved by" action={<span className="text-[11px] text-faint">{job.saves.toLocaleString('en-US')} jobseekers</span>}>
      <Table
        minW={520}
        cols={[{ label: 'Jobseeker', w: '1.6fr' }, { label: 'Location', w: '0.9fr' }, { label: 'Saved', w: '0.9fr' }, { label: 'Applied?', w: '0.7fr', align: 'r' }]}
        rows={shown.map((s) => [
          <div className="min-w-0">
            <button className="truncate text-left text-[12.5px] font-medium text-brand hover:underline">{s.name}</button>
            <p className="truncate text-[10.5px] text-faint">{s.title} · {s.exp}</p>
          </div>,
          <span className="truncate text-muted">{s.location}</span>,
          <span className="text-muted">{s.when}</span>,
          s.applied
            ? <Pill tone="active">Đã ứng tuyển</Pill>
            : <span className="text-[11.5px] text-faint">—</span>,
        ])}
      />
      {job.saves > 3 && (
        <button onClick={() => setOpen((o) => !o)} className="mt-2 text-[11.5px] font-medium text-brand hover:underline">
          {open ? 'Thu gọn' : `Xem tất cả ${job.saves.toLocaleString('en-US')} người đã lưu →`}
        </button>
      )}
      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
        Tên ứng viên là PII — mở hồ sơ từ đây được ghi vào audit log, và chỉ hiện với người có quyền xem ứng viên.
      </p>
    </DetailCard>
  )
}

function AdminJobDetail({ job, onBack }: { job: JobRow; onBack: () => void }) {
  useDetailCrumb(job.title, onBack)
  /* The employer's title-edit window is 72 HOURS from publishedAt — counted in
     hours, not calendar days. Shown here because HQ needs to know the employer can
     no longer fix it themselves; Admin itself is NOT restricted on any field. */
  const hoursLive = (() => {
    const m = job.posted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!m || job.status !== 'open') return null
    const posted = new Date(+m[3], +m[2] - 1, +m[1])
    return Math.floor((Date.now() - posted.getTime()) / 3_600_000)
  })()
  const titleLocked = hoursLive !== null && hoursLive > 72
  return (
    <div className="max-w-[900px]">

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">{job.title} <Pill tone={job.status}>{job.statusLabel}</Pill></h2>
          <p className="text-[11.5px] text-muted"><span className="font-mono">{job.id}</span> · {job.category} · {job.company} · Created by {job.source}</p>
          {hoursLive !== null && (
            <p className={cn('mt-1 text-[10.5px]', titleLocked ? 'text-amber-700' : 'text-muted')}>
              {titleLocked
                ? `🔒 Tiêu đề đã khoá với employer — tin đã đăng ${hoursLive} giờ (khoá sau 72 giờ). Admin vẫn sửa được mọi trường.`
                : `Employer còn ${72 - hoursLive} giờ để sửa tiêu đề (72 giờ kể từ khi đăng). Admin không bị giới hạn.`}
            </p>
          )}
          <a className="mt-1 inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-brand hover:underline">
            {job.status === 'draft' || job.status === 'schedule'
              ? 'Preview draft ↗'
              : job.status === 'open'
                ? 'View live job post ↗'
                : 'View job post (closed) ↗'}
          </a>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Duplicate</button>
          <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Edit</button>
          {job.status === 'open' && <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Close</button>}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <MiniStat label="Applicants" value={job.applicants || '—'} />
        <MiniStat label="Views" value={job.views.toLocaleString('en-US')} />
        <MiniStat label="Saves" value={job.saves.toLocaleString('en-US')} />
        <MiniStat label="Created by" value={job.source} />
        <MiniStat label="Posted" value={job.posted} />
        <MiniStat label="Expires" value={job.deadline} />
        <MiniStat label="Status" value={job.statusLabel} tone={job.status === 'schedule' ? 'warn' : undefined} />
      </div>

      {/* Full read-only field view — mirrors the Create job form, grouped the same way */}
      <div className="space-y-4">
        <DetailCard title="Posting setup">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KV label="Company" value={`${job.company} · CO-1042`} link />
            <KV label="Purchase order (PO)" value={job.product === 'Free' ? '— none (Free job)' : 'PO-2026-0042 · active'} link={job.product !== 'Free'} />
            <KV label="Products" value={`Job Posting — ${job.product}`} />
            <KV label="Exposure" value={job.status === 'open' ? 'On — visible on the jobseeker site' : '— (only meaningful while Open)'} />
            <KV label="Created by" value={job.source === 'Admin' ? 'Admin — HQ on the company’s behalf' : 'Company HR'} />
          </div>
        </DetailCard>

        <DetailCard title="Job information">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KV label="Job title (VI)" value="Trưởng nhóm kỹ thuật (.NET, tiếng Nhật N4+)" />
            <KV label="Job title (EN)" value="Technical Leader / Technical Architect (.NET)" />
            <KV label="Job category" value={job.category} />
            <KV label="Job role" value="Software Developer" />
            <KV label="Job level" value="Experienced (non-manager)" />
            <KV label="Work type" value="In office" />
            <KV label="Contract type" value="Fulltime" />
            <KV label="Industry" value="FMCG" />
            <KV label="Skills" value="ASP.NET Core · .NET · React" />
            <KV label="Location (province / city)" value="Hồ Chí Minh" />
            <KV label="Address" value="Burning Bros D2 · 69 Võ Nguyên Giáp, Thảo Điền, Quận 2" />
            <KVShow label="Salary" value="500 – 1,500 USD / month" shown />
            <KVShow label="Number of headcount" value="1" shown={false} />
            <KV label="Contact person" value="Ms. Vũ Thanh Linh · HR Manager" />
            <KV label="Application recipient email(s)" value="hr@nec.vn · ta.lead@nec.vn" />
            <KV label="Expires" value={`${job.deadline} — from product duration`} />
          </div>
        </DetailCard>

        <DetailCard title="Job content">
          <Section title="Job description" />
          <p className="text-[12px] leading-relaxed text-muted">Lead the development team; backend architecture (70%) + frontend (30%); code review &amp; mentoring…</p>
          <Section title="Requirements" className="mt-2" />
          <p className="text-[12px] leading-relaxed text-muted">7+ years software dev; 3+ years as Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; Japanese N4+…</p>
          {/* Two blocks, one source each: what this POSITION adds, then what it
              INHERITS from the company page. They never contradict because they no
              longer describe the same thing. */}
          <Section title="Phúc lợi riêng của vị trí này" className="mt-2" />
          <BenefitCards items={[
            { key: 'pay', text: 'Thưởng dự án theo milestone, xét tăng lương 2 lần/năm' },
            { key: 'flexible', text: 'Hybrid 2 ngày/tuần, giờ vào ca linh hoạt 8–10h' },
          ]} />
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
            <Section title="Phúc lợi chung của công ty" className="mt-0" />
            <a className="cursor-pointer text-[10.5px] font-medium text-brand hover:underline">Xem trang công ty ↗</a>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMPANY_BENEFITS.map((k) => {
              const t = benefitByKey(k)
              if (!t) return null
              return (
                <span key={k} className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas/50 px-2 py-1 text-[11px] text-ink/70">
                  <t.Icon className="h-3 w-3 shrink-0 text-muted" />{t.vi}
                </span>
              )
            })}
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
            Kế thừa tự động từ trang công ty (chỉ đọc) — sửa ở đó thì mọi tin đang mở cập nhật theo. Tin tuyển dụng <b className="text-ink/70">không ghi đè</b> phúc lợi công ty.
            Nhãn loại phúc lợi song ngữ lấy từ Master data; phần mô tả tiếng Việt bắt buộc, EN/KO tuỳ chọn.
          </p>
        </DetailCard>

        <DetailCard title="Candidate expectation">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KV label="Years of experience (min – max)" value="3 – 7 years" />
            <KV label="Minimum education level" value="Bachelor" />
            <KVShow label="Nationality" value="Any" shown={false} />
            <KVShow label="Gender" value="Any" shown={false} />
            <KVShow label="Marital status" value="Any" shown={false} />
            <KVShow label="Age preference" value="18 – 60" shown={false} />
            <KV label="Cover letter" value="Never required" />
          </div>
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">Demographic fields (nationality / gender / marital status / age) are legally sensitive for VN job ads — pending client confirmation.</p>
        </DetailCard>

        <SavedByCard job={job} />

        <DetailCard title="Internal (HQ only)">
          <p className="text-[12px] leading-relaxed text-muted">Approval context, special instructions, follow-ups… — never shown publicly.</p>
        </DetailCard>
      </div>

      {job.status === 'open' && <p className="mt-3 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11.5px] text-muted">This job is live on the jobseeker site. Turn Exposure off to take it down without closing it — or Close to end it.</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-faint">Read-only view — mirrors the Create job fields. Real values load from the saved job record; use Edit to change them.</p>
    </div>
  )
}

/** A form section: a big underlined header with its fields below (VietnamWorks-style). */
function JobGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="border-b-2 border-line pb-2 text-[18px] font-bold tracking-tight text-ink">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/** Inline "Show to Job Seekers" switch, shown to the right of a field label. */
function ShowToggle({ on = true }: { on?: boolean }) {
  const [v, setV] = useState(on)
  return (
    <button onClick={() => setV((x) => !x)} className="flex items-center gap-2 text-[11px] text-muted">
      Show to Job Seekers
      <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', v ? 'bg-brand' : 'bg-line')}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', v ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  )
}

/** − [n] + stepper placeholder. */
function Stepper({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-line">
      <span className="px-3 py-2 text-[13px] text-muted">−</span>
      <span className="min-w-[48px] border-x border-line px-3 py-2 text-center text-[12.5px] text-ink/80">{value}</span>
      <span className="px-3 py-2 text-[13px] text-muted">+</span>
    </div>
  )
}

/** Field label row with an optional right-aligned control (e.g. Show-to-jobseekers). */
function LabelRow({ label, req, right }: { label: string; req?: boolean; right?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <label className="text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  )
}

/** Compact demographic row (VietnamWorks-style): label · radios · Show-toggle, kept close together. */
function DemoRow({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <label className="w-36 text-[11.5px] font-medium text-ink/80">{label}</label>
      <RadioOpts options={options} value="Any" />
      <ShowToggle on={false} />
    </div>
  )
}

/**
 * Interactive single-select dropdown (click to open, pick one).
 *
 * `createLabel` turns on the inline "＋ Create new…" affordance: master-data-backed
 * fields (category, level, industry, currency…) let an operator add a new option
 * without leaving the form — the new value is added to Master data and selected.
 */
function SelectField({ label, req, value, options, extra, createLabel, onChange }: { label: string; req?: boolean; value: string; options: string[]; extra?: React.ReactNode; createLabel?: string; onChange?: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(value)
  const [opts, setOpts] = useState(options)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const pick = (v: string) => { setSel(v); onChange?.(v) }
  const commit = () => {
    const v = draft.trim()
    if (v) { setOpts((o) => (o.includes(v) ? o : [...o, v])); pick(v) }
    setDraft(''); setCreating(false); setOpen(false)
  }
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="relative">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center rounded-md border border-line bg-surface px-3 py-2 text-left text-[12.5px] text-ink/80">
          {sel}<span className="ml-auto text-faint">▾</span>
        </button>
        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-lg">
            <div className="max-h-52 overflow-auto py-1">
              {opts.map((o) => (
                <button key={o} onClick={() => { pick(o); setOpen(false) }} className={cn('block w-full px-3 py-1.5 text-left text-[12px] hover:bg-canvas', o === sel ? 'bg-brand-soft font-medium text-brand' : 'text-ink/80')}>{o}</button>
              ))}
            </div>
            {createLabel && (
              <div className="border-t border-line-soft bg-canvas/50">
                {creating ? (
                  <div className="flex items-center gap-1.5 p-1.5">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setCreating(false); setDraft('') } }}
                      placeholder={`New ${label.toLowerCase()}…`}
                      className="min-w-0 flex-1 rounded border border-line bg-surface px-2 py-1 text-[12px] outline-none focus:border-brand"
                    />
                    <button onClick={commit} className="shrink-0 rounded bg-brand px-2 py-1 text-[11px] font-semibold text-white hover:opacity-90">Add</button>
                  </div>
                ) : (
                  <button onClick={() => setCreating(true)} className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[12px] font-medium text-brand hover:bg-brand-soft">
                    <span className="text-[14px] leading-none">＋</span> {createLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Radio option pills without a label (label handled by LabelRow). */
function RadioOpts({ options, value }: { options: string[]; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-0.5">
      {options.map((o) => (
        <span key={o} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/80">
          <span className={cn('grid h-4 w-4 place-items-center rounded-full border-2', o === value ? 'border-brand' : 'border-line')}>{o === value && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
          {o}
        </span>
      ))}
    </div>
  )
}

/** Company summary chip — click to open the company detail page on Admin. */
function CompanyInfoCard() {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg border border-line bg-canvas/40 p-3 text-left transition-colors hover:border-brand/40">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-surface text-[12px] font-bold text-brand">NEC</span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">NEC Vietnam <span className="text-[11px] font-normal text-muted">· ID CO-1042</span></p>
        <p className="text-[11px] text-muted">IT / Software · 100–499 staff · Head office: Hồ Chí Minh</p>
      </div>
      <span className="ml-auto text-[15px] text-muted">→</span>
    </button>
  )
}

const TITLE_I18N: Record<'VI' | 'EN', string> = {
  VI: 'Trưởng nhóm kỹ thuật (.NET, tiếng Nhật N4+)',
  EN: 'Technical Leader / Technical Architect (.NET)',
}

/** Bilingual textarea — VI / EN tab on the label row. */
function BiTArea({ label, req, vi, en, rows = 4 }: { label: string; req?: boolean; vi: string; en: string; rows?: number }) {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <label className="text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
        <div className="ml-auto flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
          {(['VI', 'EN'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={cn('px-2 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-faint" style={{ minHeight: rows * 20 }}>{lang === 'VI' ? vi : en}</div>
    </div>
  )
}

function AdminJobCreate({ onBack }: { onBack: () => void }) {
  useDetailCrumb('New job', onBack)
  const [exposed, setExposed] = useState(true)
  const [postMenu, setPostMenu] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [titleLang, setTitleLang] = useState<'VI' | 'EN'>('VI')
  const G2 = 'grid grid-cols-2 gap-3'
  const G3 = 'grid grid-cols-3 gap-3'

  /* Products offered depend on the PO, straight from the product's `entitlement`:
     with no PO only the always-available (free) tiers can be picked; choosing a PO adds
     that PO's paid lines. Nothing here matches on the product NAME. */
  const NO_PO = '— none (Free job) —'
  const [po, setPo] = useState(NO_PO)
  const hasPo = po !== NO_PO
  const freeProducts = CATALOG.filter((c) => c.type === 'Job posting' && c.entitlement === 'free' && c.status === 'Active')
  const paidProducts = CATALOG.filter((c) => c.type === 'Job posting' && c.entitlement !== 'free' && c.status === 'Active')
  const label = (c: (typeof CATALOG)[number]) => `${c.name} · ${c.fulfilment.split(' · ')[0]}`
  const productOptions = (hasPo ? paidProducts : freeProducts).map(label)

  return (
    <div className="max-w-[860px]">

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mt-0.5 text-[20px] font-bold tracking-tight">Create job <span className="font-medium text-muted">— draft field map</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="draft">Draft</Pill>
          <a className="inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-brand">Preview draft ↗</a>
        </div>
      </div>

      <div className="space-y-8">
        {/* ═══ POSTING SETUP (company · package · exposure) ═════════════════ */}
        <JobGroup title="Posting setup">
          <SelectField label="Company" req value="NEC Vietnam · CO-1042" createLabel="Create company" options={['NEC Vietnam · CO-1042', 'FPT Software · CO-1007', 'VNG Corporation · CO-2231', 'Tiki · CO-1890', 'MoMo · CO-3120']} extra={<span className="ml-2 text-[10.5px] font-normal text-faint">— searchable by name or ID</span>} />
          <CompanyInfoCard />
          {/* PO → Products sit side by side: the PO scopes which products can be picked */}
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Purchase order (PO)"
              value={NO_PO}
              onChange={setPo}
              options={[NO_PO, 'PO-2026-0042 · active · signed 12/07/2026', 'PO-2026-0039 · active · signed 02/06/2026']}
              extra={<span className="ml-2 text-[10.5px] font-normal text-faint">— paid products only</span>}
            />
            {/* keyed on the PO so the product resets rather than keeping a stale
                paid tier after the operator drops back to "no PO" */}
            <SelectField
              key={po}
              label="Products"
              req
              value={productOptions[0] ?? '— no product available —'}
              options={productOptions}
              extra={<span className="ml-2 text-[10.5px] font-normal text-faint">{hasPo ? '— lines on the selected PO' : '— free tier (no PO)'}</span>}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <LabelRow label="Exposure" />
              <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
                <span className="min-w-0 flex-1 text-[11.5px] text-muted">{exposed ? 'On — visible on the jobseeker site.' : 'Off — hidden; reversible before the deadline (does not Close).'}</span>
                <button role="switch" aria-checked={exposed} onClick={() => setExposed((v) => !v)} className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', exposed ? 'bg-emerald-500' : 'bg-line')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', exposed ? 'left-[18px]' : 'left-0.5')} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10.5px] leading-relaxed text-faint">
            The product list follows the PO. With <b>no PO</b> only products flagged <b>Always available</b> on the product record are offered — HQ can post those for any company at any time, unlimited. Pick a PO (a customer can have more than one active) and the list becomes that PO’s paid lines. Expiry comes from the product’s duration. <b>Employers never see the free tier</b> — on the Company site they can only post from what they bought.
          </p>
        </JobGroup>

        {/* ═══ JOB INFORMATION (client field list) ══════════════════════════ */}
        <JobGroup title="Job information">
          {/* job title — single field, VI / EN tab */}
          <div>
            <LabelRow label="Job title" req right={
              <div className="flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
                {(['VI', 'EN'] as const).map((l) => (
                  <button key={l} onClick={() => setTitleLang(l)} className={cn('px-2 py-0.5', titleLang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
                ))}
              </div>
            } />
            <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{TITLE_I18N[titleLang]}</div>
            <p className="mt-1 text-[10.5px] text-faint">Vietnamese is the default &amp; required language and the fallback shown wherever an EN/KO translation is missing; English/Korean optional.</p>
          </div>

          <div className={G2}>
            <SelectField label="Job category" req value="IT" createLabel="Create category" options={['IT', 'Marketing', 'Finance & Accounting', 'Sales', 'Human Resources', 'Design', 'Engineering', 'Healthcare', 'Education']} />
            <ChipField label="Job role" req chips={['Software Developer']} placeholder="Add role…" hint="Roles come from the selected category (Master data). Type to add a new one." />
          </div>
          <div className={G2}>
            <SelectField label="Job level" req value="Experienced (non-manager)" createLabel="Create job level" options={['Intern/Student', 'Fresher/Entry level', 'Experienced (non-manager)', 'Manager', 'Director and above']} />
            <SelectField label="Work type" req value="In office" createLabel="Create work type" options={['In office', 'Remote', 'Hybrid', 'Oversea']} /><SelectField label="Contract type" req value="Fulltime" createLabel="Create contract type" options={['Fulltime', 'Part-time', 'Fixed-term contract', 'Internship', 'Probation', 'Freelance', 'Seasonal']} />
          </div>
          <div className={G2}>
            <SelectField label="Industry" req value="FMCG" createLabel="Create industry" options={['IT / Software', 'FMCG', 'Banking / Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Logistics']} />
            <JobSkillsField />
          </div>
          {/* A working location is a NAMED office saved on the company, not a
              city+address typed per job — see WorkingLocationsField. */}
          <WorkingLocationsField />

          <div>
            <LabelRow label="Salary range" req right={<ShowToggle />} />
            <div className={G3}>
              <FField label="From" value="500" />
              <FField label="To" value="1500" />
              <SelectField label="Currency" value="USD" createLabel="Create currency" options={['USD', 'VND', 'JPY', 'CNY', 'EUR', 'INR', 'GBP', 'RUB', 'SGD']} />
            </div>
          </div>
          <div>
            <LabelRow label="Number of headcount" right={<ShowToggle on={false} />} />
            <Stepper value="1" />
          </div>
          <SelectField label="Contact person" req value="Ms. Vũ Thanh Linh · HR Manager" createLabel="Create contact person" options={['Ms. Vũ Thanh Linh · HR Manager', 'Mr. Ngô Minh Tú · HR Specialist', 'Ms. Đỗ Thị Mai · HR Specialist']} extra={<span className="ml-2 text-[10.5px] font-normal text-faint">— the recipient name candidates see</span>} />
          <ChipField label="Application recipient email(s)" req chips={['hr@nec.vn', 'ta.lead@nec.vn']} placeholder="Add email…" hint="Applications are emailed to these addresses (multiple allowed); the name shown to candidates is the contact person above." />
        </JobGroup>

        {/* ═══ JOB CONTENT (bilingual rich text) ════════════════════════════ */}
        <JobGroup title="Job content">
          <BiTArea label="Job description" req rows={4}
            vi="Lãnh đạo nhóm phát triển; kiến trúc backend (70%) + frontend (30%); review code & mentoring…"
            en="Lead the development team; backend architecture (70%) + frontend (30%); code review & mentoring…" />
          <BiTArea label="Requirements" req rows={4}
            vi="7+ năm phát triển phần mềm; 3+ năm ở vị trí Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; tiếng Nhật N4+…"
            en="7+ years software dev; 3+ years as Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; Japanese N4+…" />
          {/* Benefits is NOT free text any more: a typed list is what gives each
              one an icon, a translation, and a search filter. See BenefitsField.
              The job declares only what is SPECIFIC to the position; the company's
              general benefits are inherited from the company page, shown here so
              nobody retypes them. */}
          <BenefitsField
            initial={['pay', 'flexible']}
            companyBenefits={COMPANY_BENEFITS}
            companyName="NEC Vietnam"
          />
        </JobGroup>

        {/* ═══ CANDIDATE EXPECTATION ════════════════════════════════════════ */}
        <JobGroup title="Candidate expectation">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
           Demographic fields (nationality / gender / marital status / age) are legally sensitive for VN job ads — confirm with the client whether to collect / display them.
          </div>
          <div className={G2}>
            <div>
              <LabelRow label="Years of experience (min – max)" />
              <div className="flex items-center gap-2 text-[12.5px] text-faint">
                <span className="rounded-md border border-line bg-surface px-3 py-1.5">Min</span>—<span className="rounded-md border border-line bg-surface px-3 py-1.5">Max</span>
              </div>
            </div>
            <SelectField label="Minimum education level" value="Bachelor" createLabel="Create education level" options={['High school', "Associate's degree", 'College', 'Bachelor', 'Master', 'Doctorate', 'Others']} />
          </div>
          <DemoRow label="Nationality" options={['Any', 'Vietnamese', 'Foreigner']} />
          <DemoRow label="Gender" options={['Any', 'Male', 'Female']} />
          <DemoRow label="Marital status" options={['Any', 'Single', 'Married']} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <label className="w-36 text-[11.5px] font-medium text-ink/80">Age preference</label>
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <span className="rounded-md border border-line bg-surface px-3 py-1.5">18</span>—<span className="rounded-md border border-line bg-surface px-3 py-1.5">60</span>
            </div>
            <ShowToggle on={false} />
          </div>
          <div>
            <LabelRow label="Do you require cover letter?" />
            <RadioOpts options={['Yes, always required', 'No, it is optional', 'No, it is never required']} value="No, it is never required" />
          </div>
        </JobGroup>

        {/* ═══ INTERNAL (HQ ONLY) ═══════════════════════════════════════════ */}
        <JobGroup title="Internal (HQ only)">
          <TArea label="Notes" value="Approval context, special instructions, follow-ups… — never shown publicly." rows={3} />
        </JobGroup>
      </div>

      {/* footer actions */}
      <div className="mt-6 border-t border-line pt-4">
        {scheduling && (
          <div className="mb-3 rounded-lg border border-line bg-canvas/40 p-3">
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Schedule publish time</p>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-faint">
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5">dd/mm/yyyy</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5">hh:mm</span>
              <span className="text-[11px] text-muted">GMT+7</span>
              <button onClick={() => setScheduling(false)} className="ml-1 text-[11px] font-medium text-muted underline">Cancel</button>
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">Job is saved with <b>Schedule</b> status and auto-publishes to <b>Open</b> at this time.</p>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Save as draft</button>
          <div className="relative">
            <button onClick={() => setPostMenu((o) => !o)} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">
              {scheduling ? 'Schedule post' : 'Post now'} <span className="text-[11px]">▾</span>
            </button>
            {postMenu && (
              <div className="absolute right-0 z-10 mt-1 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
                <button onClick={() => { setScheduling(false); setPostMenu(false) }} className="block w-full px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-canvas">Post now — publish immediately</button>
                <button onClick={() => { setScheduling(true); setPostMenu(false) }} className="block w-full border-t border-line-soft px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-canvas">Schedule for later…</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Open questions for the client: bilingual coverage per field (VI/EN/KO) · whether demographic fields are collected at all · salary-display policy · which package/boost SKUs exist · approval workflow (auto vs manual).
      </p>
    </div>
  )
}

export const ADMIN_PROTOTYPES: Record<string, () => JSX.Element> = {
  // Recruitment
  'admin-job-list': AdminJobList,
  'admin-job-create': AdminJobCreateStandalone,
  'admin-job-applicants': AdminApplicants,
  'admin-resumes': AdminResumes,
  'admin-resume-new': AdminResumeNewStandalone,
  // Companies
  'admin-company-list': AdminCompanyList,
  'admin-company-pipeline': AdminCompanyPipeline,
  // User — both sides of the marketplace's people accounts
  'admin-jobseekers': AdminJobseekers,
  'admin-company-users': AdminCompanyUsers,
  // Content
  'admin-banners': AdminBanners,
  'admin-popups': AdminPopups,
  'admin-account-usage': AdminAccountUsage,
  'admin-manual-services': AdminManualServices,
  'admin-pages': AdminPages,
  // Billing & products
  'admin-catalog': AdminCatalog,
  'admin-placements': AdminPlacements,
  'admin-bundles': AdminBundles,
  'admin-credits': AdminCredits,
  'admin-orders': AdminOrders,
  'admin-promotions': AdminPromotions,
  // Sales / CRM
  'admin-signups': AdminSignups,
  'admin-sales-pipeline': AdminPipeline,
  'admin-quotes': AdminQuotes,
  'admin-invoices': AdminInvoices,
  'admin-purchase-orders': AdminPOs,
  'admin-payments': AdminPayments,
  'admin-contracts': AdminContracts,
  // Analytics
  'admin-analytics-dashboard': AdminDashboard,
  'admin-sales-report': AdminSalesReport,
  'admin-recruit-report': AdminRecruitReport,
  'admin-revenue-report': AdminRevenueReport,
  'admin-user-behavior': AdminUserBehavior,
  // System
  'admin-users': AdminUsers,
  'admin-roles': AdminRoles,
  'admin-staff': AdminStaff,
  'admin-issuer': AdminIssuer,
  'admin-membership': AdminMembership,
  'admin-master-data': AdminMasterData,
  'admin-audit-log': AdminAuditLog,
  'admin-environment': AdminEnvironment,
  'admin-departments': AdminDepartments,
  // Job categories & roles now live inside Master data (one page); keep the id mapped.
  'admin-job-categories': AdminMasterData,
}
