/* ── Time period filter — one control, shared by the dated lists ──────────────
 *
 * Quotations, Purchase order and Invoices each carry the SAME control at the top
 * of the page, above the summary cards and the table: seven presets, the last of
 * which opens a From → To pair. It sits on the page and not inside the Filter
 * panel because it changes what every number on the page MEANS — a control that
 * moves the denominator cannot live in a dropdown next to Status.
 *
 * The chosen period lives in a tiny module store rather than in page state, so
 * walking Quotations → Purchase order → Invoices keeps the window: "which period
 * am I looking at?" is answered once per session, the way an analytics console
 * behaves. Presets resolve against MOCK_TODAY so the demo rows land in sensible
 * buckets; production resolves them against the server clock in VN time. */
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { MOCK_TODAY } from '@/pages/admin/lib/fmt'

export type PeriodKey = 'today' | 'week' | 'month' | 'quarter' | 'ytd' | 'all' | 'custom'
export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'quarter', label: 'This quarter' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Time range' },
]
/** `from` / `to` are ISO yyyy-mm-dd — what an <input type="date"> speaks. They
    only matter while `key === 'custom'`, but are kept so switching to Time range
    starts from the last preset's window instead of two empty boxes. */
export type Period = { key: PeriodKey; from: string; to: string }

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return y && m && d ? new Date(y, m - 1, d) : null }
const fmtD = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
const today = () => new Date(MOCK_TODAY.getFullYear(), MOCK_TODAY.getMonth(), MOCK_TODAY.getDate())

/* ── store ─────────────────────────────────────────────────────────────────── */
let state: Period = { key: 'ytd', from: iso(new Date(today().getFullYear(), 0, 1)), to: iso(today()) }
const subs = new Set<() => void>()
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
export function setPeriod(patch: Partial<Period>) {
  /* Switching INTO Time range pre-fills From/To with the window the user was just
     looking at, so the pickers open on something true rather than on blanks. */
  if (patch.key === 'custom' && state.key !== 'custom') {
    const r = periodRange(state)
    patch = { ...patch, from: r.from ? iso(r.from) : '', to: r.to ? iso(r.to) : '' }
  }
  state = { ...state, ...patch }
  subs.forEach((f) => f())
}
export const usePeriod = () => useSyncExternalStore(subscribe, () => state, () => state)

/* ── resolution ────────────────────────────────────────────────────────────── */
/** Inclusive bounds at midnight; null = open. Weeks start on MONDAY (VN convention). */
export function periodRange(p: Period): { from: Date | null; to: Date | null } {
  const t = today()
  switch (p.key) {
    case 'today': return { from: t, to: t }
    case 'week': { const d = new Date(t); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return { from: d, to: t } }
    case 'month': return { from: new Date(t.getFullYear(), t.getMonth(), 1), to: t }
    case 'quarter': return { from: new Date(t.getFullYear(), Math.floor(t.getMonth() / 3) * 3, 1), to: t }
    case 'ytd': return { from: new Date(t.getFullYear(), 0, 1), to: t }
    case 'all': return { from: null, to: null }
    case 'custom': return { from: p.from ? fromIso(p.from) : null, to: p.to ? fromIso(p.to) : null }
  }
}
/** The mock stores dates as dd/mm/yyyy (quotations, invoices) or dd.mm.yyyy (the
    PO document). Anything else — "—", a blank — is "no date". */
export function docDate(s?: string): Date | null {
  const m = s ? /^(\d{2})[./](\d{2})[./](\d{4})/.exec(s.trim()) : null
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null
}
/** Is a row dated `s` inside the period? An UNDATED row shows under All time only —
    hiding it everywhere would make a draft vanish, showing it everywhere would put
    it in "Today" for ever. */
export function inPeriod(s: string | undefined, p: Period): boolean {
  const d = docDate(s)
  if (!d) return p.key === 'all'
  const { from, to } = periodRange(p)
  return !(from && d < from) && !(to && d > to)
}
export function periodLabel(p: Period): string {
  const { from, to } = periodRange(p)
  if (!from && !to) return 'Toàn bộ thời gian'
  if (from && to && from.getTime() === to.getTime()) return fmtD(from)
  return `${from ? fmtD(from) : '…'} – ${to ? fmtD(to) : '…'}`
}

/* ── the control ───────────────────────────────────────────────────────────── */
export function PeriodBar({ summary }: { summary?: React.ReactNode }) {
  const p = usePeriod()
  const badRange = p.key === 'custom' && !!p.from && !!p.to && p.from > p.to
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex flex-wrap rounded-lg border border-line bg-surface p-0.5 text-[11.5px] font-medium">
        {PERIODS.map((o) => (
          <button
            key={o.key}
            onClick={() => setPeriod({ key: o.key })}
            className={cn('rounded-md px-2.5 py-1 transition-colors', p.key === o.key ? 'bg-brand text-white' : 'text-muted hover:text-ink')}
          >{o.label}</button>
        ))}
      </span>
      {p.key === 'custom' && (
        <span className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11.5px]', badRange ? 'border-rose-300 bg-rose-50' : 'border-brand/40 bg-brand-soft/40')}>
          <span className="text-faint">From</span>
          <input type="date" value={p.from} max={p.to || undefined} onChange={(e) => setPeriod({ from: e.target.value })} className="bg-transparent font-medium text-ink outline-none" />
          <span className="text-faint">→</span>
          <span className="text-faint">To</span>
          <input type="date" value={p.to} min={p.from || undefined} onChange={(e) => setPeriod({ to: e.target.value })} className="bg-transparent font-medium text-ink outline-none" />
          {badRange && <span className="text-[10.5px] font-medium text-rose-600">From phải trước To</span>}
        </span>
      )}
      {/* The resolved window is always printed, so a preset never hides what it
          actually means — "This week" reads as its two dates. */}
      <span className="ml-auto text-[11px] text-muted tabular-nums">📅 {periodLabel(p)}{summary && <span className="text-faint"> {summary}</span>}</span>
    </div>
  )
}
