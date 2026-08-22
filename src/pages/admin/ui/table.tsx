/* The admin table: columns, header search, footer paging, and cell helpers. */
import { isValidElement } from 'react'
import { cn } from '@/lib/utils'

/* A table cell carrying two short lines instead of one long truncating string.
   Long "a · b · c · d · e" values are unreadable at any column width — they
   truncate and the operator scrolls sideways to finish a sentence. Split at a
   natural break and both halves fit. */
/* Split a "a · b · c · d" value at the nth separator so both halves fit the column
   instead of truncating mid-sentence. Shared by every list that renders a joined
   field-sheet value. */
export function split2(v: string, n: number) {
  const parts = v.split(' · ')
  return [parts.slice(0, n).join(' · '), parts.slice(n).join(' · ')] as const
}

export function TwoLine({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-ink/80">{top}</p>
      {bottom && <p className="truncate text-[11px] text-muted">{bottom}</p>}
    </div>
  )
}

/* One search box per list, first control on the filter row. It matches against
   EVERY column's rendered text (see `cellText`), which is what people expect from a
   single box above a table — no field picker to learn, and no guessing which column
   a value lives in. */
export function TableSearch({ q, onChange, placeholder, dropdown }: { q: string; onChange: (v: string) => void; placeholder?: string
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
        placeholder={placeholder ?? 'Tìm trong tất cả các cột…'}
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

export type Col = { label: string; w: string; align?: 'r' | 'c' }

export function Table({ cols, rows, minW = 560, empty }: { cols: Col[]; rows: React.ReactNode[][]; minW?: number; empty?: string }) {
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

export function Footer({ size, onSize }: { size: number; onSize: (n: number) => void }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <label className="flex items-center gap-1.5 text-[11.5px] text-muted">
        Số dòng mỗi trang
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
export function cellText(n: React.ReactNode): string {
  if (n === null || n === undefined || typeof n === 'boolean') return ''
  if (typeof n === 'string' || typeof n === 'number') return String(n)
  if (Array.isArray(n)) return n.map(cellText).join(' ')
  if (isValidElement(n)) return cellText((n.props as { children?: React.ReactNode }).children)
  return ''
}
/** lowercase + diacritics stripped, so "cong ty" finds "Công ty". */
export const searchKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
