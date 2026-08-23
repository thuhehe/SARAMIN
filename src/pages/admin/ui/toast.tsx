import { useEffect } from 'react'
import { cn } from '@/lib/utils'

/* ── Toast ─────────────────────────────────────────────────────────────────
 *
 * Confirmation AFTER the fact, for actions that are frequent, low-risk and
 * reversible. Approve is all three: a reviewer works a queue of them, the CV
 * simply becomes normal, and one click undoes it.
 *
 * The trade this makes explicit — a modal asks "are you sure?" before every
 * approve, which on a 40-row queue is 40 interruptions to prevent a mistake
 * that costs one click to fix. A toast with UNDO inverts it: no interruption,
 * and the same mistake still costs one click. Reject keeps its dialog, because
 * it is neither low-risk nor silent: it sends words to a stranger, and there is
 * nothing to "undo" about a message already delivered.
 *
 * UNDO IS THE WHOLE POINT, so it is a real affordance rather than a hint: if the
 * only way back were to find the row again in another tab, this would be a
 * notification pretending to be a safety net.
 */
export type ToastMsg = { msg: string; sub?: string; warn?: string; onUndo?: () => void }

export function Toast({ toast, onClose }: { toast: ToastMsg; onClose: () => void }) {
  /* Long enough to read two lines and reach Undo, short enough not to stack up
     while a queue is being worked. Re-armed per message, so a fast reviewer
     always sees the latest one for its full life. */
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-lg">
        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-600 text-[10px] leading-none text-white">✓</span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-ink">{toast.msg}</p>
          {toast.sub && <p className="mt-0.5 text-[11px] leading-snug text-muted">{toast.sub}</p>}
          {/* The one thing a dialog was carrying that a toast must not drop. It is
              not a reason to stop — the approve was right — so it informs rather
              than blocks, and it sits where the reviewer is already looking. */}
          {toast.warn && (
            <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10.5px] leading-snug text-amber-800">⚠ {toast.warn}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {toast.onUndo && (
            <button
              onClick={() => { toast.onUndo?.(); onClose() }}
              className="rounded-md border border-line px-2 py-1 text-[11.5px] font-semibold text-brand hover:bg-canvas"
            >Hoàn tác</button>
          )}
          <button onClick={onClose} className={cn('grid h-6 w-6 place-items-center rounded-md text-[13px] text-faint hover:bg-canvas hover:text-ink')}>✕</button>
        </div>
      </div>
    </div>
  )
}
