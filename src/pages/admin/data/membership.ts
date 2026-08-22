/*
 * Membership tiers — Chương trình Khách hàng Thân thiết. Revenue in the tier year
 * decides the tier; it resets on 01/01.
 */
import type { Company } from '@/pages/admin/data/companies'

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
export type Tier = 'Member' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
/** Ascending by threshold — the order every lookup below depends on. */
export const TIERS: { key: Tier; vi: string; from: number; pill: string }[] = [
  { key: 'Member', vi: 'Thành viên', from: 30_000_000, pill: 'bg-slate-100 text-slate-600 border-slate-200' },
  { key: 'Bronze', vi: 'Đồng', from: 50_000_000, pill: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'Silver', vi: 'Bạc', from: 100_000_000, pill: 'bg-slate-200/70 text-slate-700 border-slate-300' },
  { key: 'Gold', vi: 'Vàng', from: 200_000_000, pill: 'bg-amber-50 text-amber-700 border-amber-300' },
  { key: 'Diamond', vi: 'Kim Cương', from: 300_000_000, pill: 'bg-sky-50 text-sky-700 border-sky-300' },
]
export type TierRow = (typeof TIERS)[number]
/** The programme year the mock sits in, and the date the accumulator zeroes. */
export const TIER_YEAR = 2026
export const TIER_RESET = '01/01/2027'

/** Cumulative paid-order value inside the CURRENT programme year — the only input to
    the tier. Demo-only derivation: a company whose first invoice landed this year has
    all of its revenue in-year; an older account keeps a stable share of its lifetime;
    a churned account has booked nothing this year, which is exactly why it holds no
    tier. The real build sums paid orders whose paid date falls inside the year. */
export const tierRevenue = (c: Company) => {
  if (!c.revenue || c.account === 'Churn') return 0
  if (c.since.endsWith(String(TIER_YEAR))) return c.revenue
  let h = 0
  for (const ch of c.name) h = (h * 37 + ch.codePointAt(0)!) % 6151
  const share = 0.3 + (h % 60) / 100 // 30% – 89% of lifetime, stable per company
  return Math.round((c.revenue * share) / 1_000_000) * 1_000_000
}
/** The tier an amount earns — null below the first threshold, which is a real state
    ("chưa có hạng"), not an error: most of the book sits there in January. */
export const tierAt = (v: number): TierRow | null => {
  let hit: TierRow | null = null
  for (const t of TIERS) if (v >= t.from) hit = t
  return hit
}
export const tierOf = (c: Company) => tierAt(tierRevenue(c))
/** The next band up and therefore the gap to sell against — null once at Diamond. */
export const nextTierAt = (v: number): TierRow | null => TIERS.find((t) => v < t.from) ?? null
