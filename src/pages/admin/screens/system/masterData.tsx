import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MD_DOMAINS } from '@/pages/admin/data/system'
import type { MDDomain } from '@/pages/admin/data/system'

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

export function AdminMasterData() {
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
