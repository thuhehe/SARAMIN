/* Status tone — the one place a state maps to a colour. */
/* ── shared bits ──────────────────────────────────────────────────────────── */
export type StatusTone = 'active' | 'pending' | 'expired' | 'rejected' | 'draft' | 'neutral' | 'open' | 'schedule' | 'closed'

export const STATUS_TONE: Record<StatusTone, string> = {
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
