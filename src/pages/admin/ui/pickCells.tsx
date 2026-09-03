import { cn } from '@/lib/utils'

/* ── The two derived cells on a list of CVs ────────────────────────────────
 *
 * They replaced columns called "Application status" and "CV Search status",
 * each of which collapsed two unrelated facts into one word: a CV nobody ever
 * applied with read "Not sent", and so did a CV whose applications we are
 * holding. Identical value, opposite situations, and only the second is any of
 * the reviewer's business.
 *
 * ONE LINE EACH, since 2026-08-23. An earlier version printed a second line
 * spelling out the consequence ("2 đơn đang giữ lại — chờ duyệt · 5h"). It went
 * because the CV STATUS COLUMN SITS ON THE SAME ROW and already says it: a
 * reviewer reading "Not enough information" does not need two more cells
 * repeating what that implies. Two lines per cell on a twelve-column table also
 * cost twice the row height to restate a fact, which is the trade that made it
 * obvious.
 *
 * So each cell answers exactly one question and stops:
 *   ApplyCell  — has this CV been used to apply, and how many times
 *   SearchCell — is it showing in CV search right now
 */

/** Answers: how many applications carry the CURRENT version of this CV — the one
    the row is about and the one a verdict lands on. NOT the whole CV (client,
    2026-09-03: “this should be about the version, not the whole CV”): applications
    delivered on an earlier version are untouched by any decision here, so counting
    them would overstate what the reviewer is deciding. They survive in the tooltip
    only, for reconciliation. */
export function ApplyCell({ apps, ver, older }: { apps: number; ver?: number; older?: number }) {
  const v = ver ?? 1
  return (
    <p
      className={cn('flex items-baseline gap-1 truncate text-[11.5px]', apps ? 'text-ink' : 'text-faint')}
      title={older ? `${older} đơn khác dùng version cũ — không bị ảnh hưởng bởi quyết định trên v.${v}` : undefined}
    >
      <span className={cn('shrink-0', apps ? 'text-emerald-600' : '')}>{apps ? '✓' : '—'}</span>
      <span className="truncate">{apps ? `${apps} đơn dùng v.${v}` : `Chưa dùng v.${v} để ứng tuyển`}</span>
    </p>
  )
}

/** The CV-search status. THREE readable outcomes, because "hidden" and "never
    offered" are not the same fact:
      Showing     — the candidate flagged this CV and it qualifies
      Hidden      — they flagged it, our CV status is blocking it
      — Chưa chọn — they never flagged it; there is nothing for us to block

    `picked` is the candidate's own toggle (they flag ONE of their up-to-three CVs)
    and we never write it; visibility is picked AND Qualified. Deriving it from CV
    status alone was the original bug: a Qualified CV nobody flagged rendered as
    Showing.

    ON TALENT POOL THE THIRD STATE CANNOT OCCUR — every row there is a candidate who
    switched CV search on — so that screen passes `picked` and gets exactly the two
    values it should have. Same component, no variant: the screen's own data decides
    which states are reachable. */
export function SearchCell({ picked, verdict }: { picked: boolean; verdict: 'qualified' | 'doubt' | 'rejected' }) {
  if (!picked) {
    return <p className="truncate text-[11.5px] text-faint">— Chưa chọn</p>
  }
  const showing = verdict === 'qualified'
  return (
    <p className={cn('truncate text-[11.5px] font-semibold', showing ? 'text-emerald-700' : 'text-faint')}>
      {showing ? 'Showing' : 'Hidden'}
    </p>
  )
}

/** THE QUEUE'S VERSION — "did the candidate offer this CV to the pool at all".
 *
 * CV review asks a different question from Talent pool, and the split is not
 * cosmetic. On the QUEUE the only fact a reviewer cannot work out for themselves
 * is the candidate's CHOICE: whether the CV is currently visible follows from the
 * CV status sitting in the next column (anything in doubt is hidden; approve a
 * picked CV and it shows). So the cell states the choice and lets the reader do
 * the one-step inference.
 *
 * On the POOL the choice is constant — everyone there switched CV search on — so
 * that screen asks the only question left, which is whether it is actually
 * showing. See SearchCell.
 *
 * Same underlying field, opposite halves of it, because the two screens know
 * different things already. */
export function PoolPickCell({ picked, ver }: { picked: boolean; ver?: number }) {
  /* Stated against the current version (client, 2026-09-03): CV search only ever
     serves the current version, so “Đã chọn · v.3” is exactly what would show if
     this row were approved. */
  return (
    <p className={cn('flex items-baseline gap-1 truncate text-[11.5px]', picked ? 'text-ink' : 'text-faint')}>
      <span className={cn('shrink-0', picked ? 'text-emerald-600' : '')}>{picked ? '✓' : '—'}</span>
      <span className="truncate">{picked ? `Đã chọn · v.${ver ?? 1}` : 'Chưa chọn'}</span>
    </p>
  )
}
