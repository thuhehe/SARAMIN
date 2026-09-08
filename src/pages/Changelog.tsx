import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CHANGELOG, KIND_META, type Bilingual, type ChangeEntry, type ChangeKind } from '@/data/changelog'
import { BUILD_MODULES } from '@/data/buildModules'
import { cn } from '@/lib/utils'

/*
 * Document history — what changed on this site, when, and why.
 *
 * Read by the client, so Vietnamese leads and English sits underneath: the
 * same convention the requirement pages use for key points. An entry that was
 * authored in one language only renders as that one line.
 */

function Line({ value, className }: { value: Bilingual; className?: string }) {
  if (typeof value === 'string') return <span className={className}>{value}</span>
  return (
    <span className={cn('block', className)}>
      <span className="block">{value.vi}</span>
      <span className="block text-muted">{value.en}</span>
    </span>
  )
}

/** Human date, stable regardless of the reader's locale settings. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function moduleTitle(id?: string) {
  if (!id) return undefined
  return BUILD_MODULES.find((m) => m.id === id)?.title
}

function EntryCard({ entry }: { entry: ChangeEntry }) {
  const kind = KIND_META[entry.kind]
  const modTitle = moduleTitle(entry.module)
  /* A module that is not in BUILD_MODULES has no page to open — link only when
     there is somewhere to land, or the reader hits a redirect to the home page. */
  const href = modTitle
    ? entry.featureKey !== undefined
      ? `/m/${entry.module}/${entry.featureKey}`
      : `/m/${entry.module}`
    : undefined

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', kind.pill)}>
          {kind.vi} · {kind.label}
        </span>
        {modTitle &&
          (href ? (
            <Link to={href} className="text-[11px] font-medium text-brand hover:underline">
              {modTitle} →
            </Link>
          ) : (
            <span className="text-[11px] text-muted">{modTitle}</span>
          ))}
      </div>

      <Line value={entry.title} className="text-[13.5px] font-semibold leading-relaxed" />
      {entry.detail && (
        <Line value={entry.detail} className="mt-1.5 text-[13px] leading-relaxed text-ink/75" />
      )}

      {entry.source && entry.source.length > 0 && (
        <p className="mt-2.5 border-t border-line-soft pt-2 text-[11px] text-faint">
          Đọc từ code / read from:{' '}
          {entry.source.map((s, i) => (
            <span key={`${s.repo}-${s.sha ?? i}`}>
              {i > 0 && ' · '}
              <span className="font-mono">
                {s.repo}
                {s.sha ? `@${s.sha}` : ''}
              </span>
              {s.note ? ` — ${s.note}` : ''}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

export function Changelog() {
  const [kindFilter, setKindFilter] = useState<ChangeKind | 'all'>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')

  const modules = useMemo(() => {
    const ids = new Set(CHANGELOG.map((e) => e.module).filter(Boolean) as string[])
    return [...ids].map((id) => ({ id, title: moduleTitle(id) ?? id }))
  }, [])

  const entries = useMemo(
    () =>
      CHANGELOG.filter((e) => kindFilter === 'all' || e.kind === kindFilter).filter(
        (e) => moduleFilter === 'all' || e.module === moduleFilter,
      ),
    [kindFilter, moduleFilter],
  )

  /* Grouped by day, newest first — a reader scans for "what moved this week",
     not for individual entries. The data file is authored newest-first, but a
     hand-inserted entry can break that, so sort rather than trust it. */
  const days = useMemo(() => {
    const byDate = new Map<string, ChangeEntry[]>()
    for (const e of entries) {
      const list = byDate.get(e.date) ?? []
      list.push(e)
      byDate.set(e.date, list)
    }
    return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [entries])

  const latest = CHANGELOG.reduce<string | undefined>(
    (acc, e) => (!acc || e.date > acc ? e.date : acc),
    undefined,
  )

  return (
    <div className="max-w-[820px] pb-16">
      <h1 className="mb-2 text-[24px] font-bold tracking-tight">
        Lịch sử tài liệu · Document history
      </h1>
      <p className="mb-1 text-[14px] leading-relaxed text-ink/75">
        Mỗi lần tài liệu này được đối chiếu với code thực tế, thay đổi được ghi lại ở đây — ngày,
        module, và nội dung đã đổi.
      </p>
      <p className="mb-6 text-[13px] leading-relaxed text-muted">
        Every time this documentation is reconciled against the actual build, the change is logged
        here with its date, module and substance. Cosmetic edits are not logged — only changes that
        change what is being built.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-faint">
          {CHANGELOG.length} entries{latest ? ` · last updated ${formatDate(latest)}` : ''}
        </span>
        <span className="text-line">|</span>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as ChangeKind | 'all')}
          className="rounded-lg border border-line bg-surface px-2 py-1"
        >
          <option value="all">All kinds</option>
          {(Object.keys(KIND_META) as ChangeKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_META[k].label}
            </option>
          ))}
        </select>
        {modules.length > 0 && (
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1"
          >
            <option value="all">All modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {days.length === 0 ? (
        <p className="text-[13px] text-muted">No entries match this filter.</p>
      ) : (
        <div className="space-y-8">
          {days.map(([date, list]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint">
                  {formatDate(date)}
                </h2>
                <span className="h-px flex-1 bg-line-soft" />
                <span className="text-[11px] text-faint">
                  {list.length} change{list.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2.5">
                {list.map((e, i) => (
                  <EntryCard key={`${date}-${i}`} entry={e} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
