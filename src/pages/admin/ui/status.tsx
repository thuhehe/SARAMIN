/* The pills that show a state: status, days-idle, membership tier. */
import { cn } from '@/lib/utils'
import { IDLE_RULE, ROT_DOT, ROT_TEXT, idleOf } from '@/pages/admin/data/companies'
import type { Cadence } from '@/pages/admin/data/companies'
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
