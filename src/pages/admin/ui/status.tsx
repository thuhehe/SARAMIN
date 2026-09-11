/* The pills that show a state: status, days-idle, membership tier. */
import { cn } from '@/lib/utils'
import { IDLE_RULE, ROT_DOT, ROT_TEXT, VERIFY_DISPLAY, idleOf } from '@/pages/admin/data/companies'
import type { Cadence, Verification, VerifyDisplay } from '@/pages/admin/data/companies'
import { TIERS, TIER_YEAR } from '@/pages/admin/data/membership'
import type { TierRow } from '@/pages/admin/data/membership'
import { dateBefore, revFmt } from '@/pages/admin/lib/fmt'
import { STATUS_TONE } from '@/pages/admin/lib/tone'
import type { StatusTone } from '@/pages/admin/lib/tone'

export function Pill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium', STATUS_TONE[tone])}>
      {children}
    </span>
  )
}

/** Idle read-out: a health dot + the gap. `days = null` → never contacted at all,
    which is a DISTINCT state from 0d and the highest-priority follow-up. */
/**
 * `compact` is the KANBAN-CARD read-out: dd/mm with no year, no health dot and no
 * colour. A card already carries its stage, its value and its owner — a fourth
 * coloured signal there competes with the stage rather than adding to it, and the
 * card is narrow enough that the year is four characters of noise. The full date,
 * the gap in days and the threshold are all still one hover away.
 */
export function Idle({ days, kind = 'openDeal', dotOnly, compact }: { days: number | null; kind?: Cadence; dotOnly?: boolean; compact?: boolean }) {
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


export function TierPill({ tier, en }: { tier: TierRow | null; en?: boolean }) {
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

/**
 * The verification tag — the SAME mark the employer sees beside their company name
 * on the Company site (Figma 2302-44567: a blue shield pill reading "Verified"), so
 * an admin and a customer on the phone are looking at one symbol.
 *
 * THREE labels (client, 09/09/2026), two stored states — `display` is derived by
 * verifyDisplayOf(), never held on the record:
 *
 *   Verified            blue  · an admin pressed Verify
 *   Waiting to verify   amber · ERC on file, nobody has verified → our queue
 *   No paperwork        slate · no ERC yet                        → their to-do
 *
 * Blue, not green, on purpose: green is the CRM's "active / bought" tone, and a
 * company can be Verified without ever having bought anything. Amber vs slate is
 * the load-bearing part — amber is work an admin can clear right now, slate is work
 * we are waiting on the employer for, so a queue of amber tags is a real queue.
 * `reason: 'edited'` is a modifier on either unverified label, because "we changed
 * something, check it again" is a different task from "never checked".
 */
export function VerifiedTag({ v, display, en, showReason = true }: { v: Verification; display?: VerifyDisplay; en?: boolean; showReason?: boolean }) {
  /* Callers that know the gaps pass `display`; the rest fall back to the stored
     state, which can only ever say verified / unverified. */
  const shown: VerifyDisplay = display ?? (v.state === 'verified' ? 'verified' : 'unverified')
  const label = en ? VERIFY_DISPLAY[shown].en : VERIFY_DISPLAY[shown].vi
  if (v.state === 'verified') {
    return (
      <span title={`Xác minh ${v.at} · ${v.by}`} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10.5px] font-semibold text-blue-700">
        <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden><path d="M8 1.5 2.5 3.6v3.9c0 3.3 2.4 6.2 5.5 7 3.1-.8 5.5-3.7 5.5-7V3.6L8 1.5Z" fill="currentColor" opacity=".18" /><path d="M8 1.5 2.5 3.6v3.9c0 3.3 2.4 6.2 5.5 7 3.1-.8 5.5-3.7 5.5-7V3.6L8 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="m5.6 8 1.7 1.7 3.2-3.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {label}
      </span>
    )
  }
  const why = v.reason === 'edited' ? `Đã xác minh ${v.wasVerifiedAt}, đổi thông tin ${v.since}${v.by ? ` bởi ${v.by}` : ''} — cần xác minh lại` : `Chưa ai xác minh · từ ${v.since}`
  const waiting = shown === 'waiting'
  return (
    <span
      title={waiting ? `${why} · đã có ERC trên hồ sơ — admin bấm Verify được` : `${why} · chưa có ERC trên hồ sơ`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold',
        waiting ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-100 text-slate-600',
      )}
    >
      {label}
      {showReason && v.reason === 'edited' && (
        <span className={cn('font-normal', waiting ? 'text-amber-700/80' : 'text-slate-500')}>· cần xác minh lại</span>
      )}
    </span>
  )
}

/**
 * Under a No-paperwork tag: what the admin is waiting on. Reads the gaps computed by
 * verifyGaps() — the SAME function the Verify button reads — so a row never promises
 * what the dialog then refuses. Today the only possible gap is the certificate.
 */
export function VerifyReadiness({ gaps }: { gaps: readonly string[] }) {
  return gaps.length === 0 ? (
    <span className="block truncate text-[10px] font-medium text-emerald-700" title="ERC đã có trên hồ sơ — bấm Verify được">✓ Có ERC — verify được</span>
  ) : (
    <span className="block truncate text-[10px] text-amber-700" title="Employer upload ở Company information, hoặc admin upload hộ ở card Enterprise Registration Documents">Chưa có ERC — chờ employer upload</span>
  )
}
