import { cn } from '@/lib/utils'

/* ── "Did the candidate CHOOSE this CV, and what did our status do to it" ──
 *
 * Two cells, one shape, and the shape is the whole point. The columns these
 * replace ("Application status", "CV Search status") each collapsed two facts
 * into one word:
 *
 *   a CV nobody ever applied with          → "Not sent"
 *   a CV whose applications we are holding → "Not sent"
 *
 * Identical value, opposite situations, and only the second is any of the
 * reviewer's business. The first is not a status at all — it is an ABSENCE, and
 * printing a status for a record that does not exist is how a list starts lying.
 *
 * So every cell reads top-down as CHOICE then CONSEQUENCE:
 *   line 1 — what the CANDIDATE did (a fact about them, never about us)
 *   line 2 — what our CV status does to that choice (derived, and only shown
 *            when there is a choice for it to act on)
 *
 * When line 1 is "chưa chọn" there is deliberately NO line 2. That blank is
 * accurate, and it is also the fastest way to see that a queue row is harmless:
 * nothing is waiting on it.
 */

/** Line 1 — the candidate's own act. Faint when they have not made one. */
function Choice({ on, label }: { on: boolean; label: string }) {
  return (
    <p className={cn('flex items-baseline gap-1 truncate text-[11.5px]', on ? 'text-ink' : 'text-faint')}>
      <span className={cn('shrink-0', on ? 'text-emerald-600' : '')}>{on ? '✓' : '—'}</span>
      <span className="truncate">{label}</span>
    </p>
  )
}

/** Line 2 — what our status does to it. Absent when there is no choice. */
function Effect({ text, tone }: { text: string; tone: 'ok' | 'wait' | 'bad' | 'mute' }) {
  return (
    <p className={cn('mt-0.5 truncate text-[10.5px]',
      tone === 'ok' ? 'text-emerald-700' : tone === 'wait' ? 'text-amber-700' : tone === 'bad' ? 'text-rose-600' : 'text-faint')}
    >{text}</p>
  )
}

/** Answers: has this CV been used to apply, and what is happening to those applications. */
export function ApplyCell({ apps, verdict, waited }: { apps: number; verdict: 'qualified' | 'doubt' | 'rejected'; waited?: string }) {
  if (apps === 0) {
    return (
      <div className="min-w-0">
        <Choice on={false} label="Chưa dùng để ứng tuyển" />
      </div>
    )
  }
  const eff = verdict === 'qualified'
    ? { text: `${apps} đơn đã gửi tới NTD`, tone: 'ok' as const }
    : verdict === 'doubt'
      ? { text: `${apps} đơn đang giữ lại — chờ duyệt${waited && waited !== '—' ? ` · ${waited}` : ''}`, tone: 'wait' as const }
      : { text: `${apps} đơn không được gửi / đã thu hồi`, tone: 'bad' as const }
  return (
    <div className="min-w-0">
      <Choice on label={`${apps} đơn ứng tuyển`} />
      <Effect text={eff.text} tone={eff.tone} />
    </div>
  )
}

/** Answers: did the candidate flag this CV for CV search, and is it actually showing.
    `picked` is the candidate's toggle — a jobseeker may flag ONE CV out of three, so
    "chưa chọn" is the common and entirely healthy case, not a problem to fix. */
export function SearchCell({ picked, verdict }: { picked: boolean; verdict: 'qualified' | 'doubt' | 'rejected' }) {
  if (!picked) {
    return (
      <div className="min-w-0">
        <Choice on={false} label="Chưa chọn" />
        <Effect text="ứng viên chỉ bật 1 CV" tone="mute" />
      </div>
    )
  }
  const eff = verdict === 'qualified'
    ? { text: 'Đang hiển thị với NTD', tone: 'ok' as const }
    : verdict === 'doubt'
      ? { text: 'Bị ẩn — chờ duyệt', tone: 'wait' as const }
      : { text: 'Bị ẩn — CV đã bị từ chối', tone: 'bad' as const }
  return (
    <div className="min-w-0">
      <Choice on label="Đã chọn cho CV search" />
      <Effect text={eff.text} tone={eff.tone} />
    </div>
  )
}
