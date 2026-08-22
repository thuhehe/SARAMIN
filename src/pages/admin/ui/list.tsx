/* The list-page frame every admin list is built from: tabs, filters, row actions. */
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Footer, Table, TableSearch, cellText, searchKey } from '@/pages/admin/ui/table'
import type { Col } from '@/pages/admin/ui/table'

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
export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
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
export function FilterBar({ count, onClear, children, disabled }: { count: number; onClear: () => void; children?: React.ReactNode
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
export function FilterRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
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

export function RowAction({ children, tone, title, onClick }: { children: React.ReactNode; tone?: 'brand' | 'rose' | 'amber' | 'muted'; title?: string; onClick?: () => void }) {
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

export function ListPage({ tabs, cols, rows, minW, action, leading, filters, searchHint, searchExtra, total, searchScope, sort, outOfScope }: { tabs?: { label: string; count?: number; active?: boolean }[]; cols: Col[]; rows: React.ReactNode[][]; minW?: number; action?: React.ReactNode; filters?: React.ReactNode; searchHint?: string
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
        Hiển thị <b className="font-semibold text-ink/70 tabular-nums">{matched.length}</b>
        {' / '}Tổng <b className="font-semibold text-ink/70 tabular-nums">{total ?? rows.length}</b>
      </p>
      <Table cols={cols} rows={matched.slice(0, size)} minW={minW} empty={`Không có dòng nào khớp “${q.trim()}”.`} />
      <Footer size={size} onSize={setSize} />
    </div>
  )
}
