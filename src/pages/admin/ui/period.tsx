/* ── Time period filter — one control, shared by the dated lists ──────────────
 *
 * Quotations, Purchase order and Invoices each carry the SAME control at the top
 * right of the page, above the summary cards and the table — one dropdown button
 * in the Google Analytics pattern. The button reads the preset AND its resolved
 * dates ("YTD · 01/01/2026 – 08/08/2026 ▾"); the panel lists the presets on the
 * left and Start / End dates on the right; a change takes effect on Apply, and
 * Cancel or clicking away discards it. It sits on the page and not inside the
 * Filter panel because it changes what every number on the page MEANS — a
 * control that moves the denominator cannot live in a dropdown next to Status.
 *
 * The chosen period lives in a tiny module store rather than in page state, so
 * walking Quotations → Purchase order → Invoices keeps the window: "which period
 * am I looking at?" is answered once per session, the way an analytics console
 * behaves. Presets resolve against MOCK_TODAY so the demo rows land in sensible
 * buckets; production resolves them against the server clock in VN time. */
import { useState, useSyncExternalStore } from 'react'
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
const iso = (d: Date | null) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '')
const fromIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return y && m && d ? new Date(y, m - 1, d) : null }
const fmtD = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
const today = () => new Date(MOCK_TODAY.getFullYear(), MOCK_TODAY.getMonth(), MOCK_TODAY.getDate())

/* ── store ─────────────────────────────────────────────────────────────────── */
let state: Period = { key: 'ytd', from: iso(new Date(today().getFullYear(), 0, 1)), to: iso(today()) }
const subs = new Set<() => void>()
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
export function setPeriod(next: Period) { state = next; subs.forEach((f) => f()) }
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
/** The window a preset resolves to, as the two ISO strings the date boxes show. */
const isoRange = (p: Period) => { const r = periodRange(p); return { from: iso(r.from), to: iso(r.to) } }
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
const labelOf = (k: PeriodKey) => PERIODS.find((o) => o.key === k)!.label

/* ── the control ───────────────────────────────────────────────────────────── */
export function PeriodBar({ summary }: { summary?: React.ReactNode }) {
  const p = usePeriod()
  const [open, setOpen] = useState(false)
  /* The panel edits a DRAFT. Nothing on the page moves until Apply — a list that
     re-sorts under the cursor while someone is still choosing a date is the
     behaviour every analytics tool has trained people out of expecting. */
  const [draft, setDraft] = useState<Period>(p)
  const show = () => { setDraft(p); setOpen(true) }
  const close = () => setOpen(false)
  const apply = () => { setPeriod(draft); setOpen(false) }
  const pick = (key: PeriodKey) =>
    /* Into Time range: pre-fill Start / End with the window that was just showing,
       so the boxes open on something true rather than on blanks. */
    setDraft((d) => (key === 'custom' && d.key !== 'custom' ? { key, ...isoRange(d) } : { ...d, key }))
  /* Typing in either box IS choosing Time range — the same move Google Analytics
     makes to "Custom" — so a preset can never sit selected beside dates it does
     not resolve to. */
  const setDate = (which: 'from' | 'to', v: string) =>
    setDraft((d) => ({ ...(d.key === 'custom' ? d : isoRange(d)), key: 'custom', [which]: v }))
  const shown = draft.key === 'custom' ? { from: draft.from, to: draft.to } : isoRange(draft)
  const badRange = !!shown.from && !!shown.to && shown.from > shown.to

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-[11px] text-muted">{summary}</span>
      <span className="relative">
        <button
          onClick={open ? close : show}
          className={cn('inline-flex items-center gap-2 rounded-lg border bg-surface px-2.5 py-1 text-[11.5px]', open ? 'border-brand' : 'border-line hover:border-ink/30')}
        >
          <span className="font-semibold text-ink">{labelOf(p.key)}</span>
          <span className="tabular-nums text-muted">{periodLabel(p)}</span>
          <span className="text-faint">▾</span>
        </button>
        {open && (
          <>
            {/* click-away closes WITHOUT applying, like Cancel */}
            <span className="fixed inset-0 z-10" onClick={close} />
            <span className="absolute right-0 top-full z-20 mt-1 block w-[460px] overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
              <span className="grid grid-cols-[172px_1fr]">
                <span className="block border-r border-line-soft py-1.5">
                  {PERIODS.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => pick(o.key)}
                      className={cn('flex w-full items-center justify-between px-3 py-1.5 text-left text-[12px] transition-colors',
                        draft.key === o.key ? 'bg-brand-soft font-medium text-brand' : 'text-ink hover:bg-canvas')}
                    >
                      {o.label}
                      {o.key === 'custom' && <span className="text-faint">›</span>}
                    </button>
                  ))}
                </span>
                <span className="block space-y-2.5 p-3">
                  <span className="grid grid-cols-2 gap-2">
                    {(['from', 'to'] as const).map((which) => (
                      <label key={which} className={cn('block rounded-lg border px-2 py-1.5', badRange ? 'border-rose-300 bg-rose-50/40' : draft.key === 'custom' ? 'border-brand/50' : 'border-line')}>
                        <span className="block text-[10px] font-medium uppercase tracking-wide text-faint">{which === 'from' ? 'Start date' : 'End date'}</span>
                        <input
                          type="date"
                          value={shown[which]}
                          min={which === 'to' ? shown.from || undefined : undefined}
                          max={which === 'from' ? shown.to || undefined : undefined}
                          onChange={(e) => setDate(which, e.target.value)}
                          className="w-full bg-transparent text-[12px] font-medium text-ink outline-none"
                        />
                      </label>
                    ))}
                  </span>
                  <span className="block text-[11px] tabular-nums text-muted">
                    {draft.key === 'all' && !shown.from && !shown.to ? 'Không giới hạn — mọi ngày, kể cả dòng chưa có ngày.' : `${shown.from ? fmtD(fromIso(shown.from)!) : '…'} – ${shown.to ? fmtD(fromIso(shown.to)!) : '…'}`}
                  </span>
                  {badRange
                    ? <span className="block text-[10.5px] font-medium text-rose-600">Start date phải trước End date.</span>
                    : <span className="block text-[10.5px] leading-relaxed text-faint">Sửa ngày sẽ chuyển sang <b className="font-medium text-muted">Time range</b>. Tuần bắt đầu từ thứ Hai; “Today” tính theo giờ Việt Nam.</span>}
                </span>
              </span>
              <span className="flex items-center justify-end gap-2 border-t border-line-soft bg-canvas/40 px-3 py-2">
                <button onClick={close} className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-muted hover:text-ink">Cancel</button>
                <button
                  onClick={apply}
                  disabled={badRange}
                  className={cn('rounded-md px-3 py-1 text-[11.5px] font-semibold', badRange ? 'cursor-not-allowed bg-line text-faint' : 'bg-brand text-white hover:opacity-90')}
                >Apply</button>
              </span>
            </span>
          </>
        )}
      </span>
    </div>
  )
}
