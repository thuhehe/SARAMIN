/*
 * Activity / audit log — a reusable "History" button + slide-over popup.
 *
 * Dropped into every admin page's header so any record's change history is one
 * click away, without a permanent section cluttering the page. Shows who (user
 * or System) did what, when, and the before → after — the audit trail the whole
 * console writes to. Mock data; real build reads /admin/audit?entity=…&id=…
 */
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Actor = 'user' | 'system'
type LogEntry = { when: string; actor: string; type: Actor; action: string; detail: string }

const SAMPLE: LogEntry[] = [
  { when: 'Today · 10:42', actor: 'Nguyễn Thị Lan', type: 'user', action: 'Changed status', detail: 'status: Pending approval → Active' },
  { when: 'Today · 10:31', actor: 'System', type: 'system', action: 'Auto-expired', detail: 'deadline 31/07/2026 passed → status: Expired' },
  { when: 'Today · 09:58', actor: 'Lê Hữu Phong', type: 'user', action: 'Approved', detail: 'HQ approval · pending_approval → active' },
  { when: 'Yesterday · 17:20', actor: 'Phạm Quang Huy', type: 'user', action: 'Edited fields', detail: 'salaryMax: 45,000,000 → 50,000,000 ₫ · deadline: 20/08 → 31/08' },
  { when: 'Yesterday · 15:03', actor: 'System', type: 'system', action: 'Sent notification', detail: 'Email “application received” → candidate' },
  { when: '12/06 · 09:40', actor: 'Trần Quốc Trung', type: 'user', action: 'Created', detail: 'Record created (source: Admin)' },
]

export function ActivityLogButton({ page }: { page: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted transition-colors hover:border-ink/30 hover:text-ink"
      >
        History
      </button>
      {open && <ActivityLogDrawer page={page} onClose={() => setOpen(false)} />}
    </>
  )
}

function ActivityLogDrawer({ page, onClose }: { page: string; onClose: () => void }) {
  const [filter, setFilter] = useState<'all' | Actor>('all')
  const rows = SAMPLE.filter((e) => filter === 'all' || e.type === filter)
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[520px] flex-col bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[14px] font-bold">Activity log</p>
            <p className="text-[11.5px] text-muted">{page} — who changed what, when</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        {/* filter */}
        <div className="flex items-center gap-1.5 border-b border-line-soft px-5 py-2.5 text-[11.5px]">
          {(['all', 'user', 'system'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-2 py-0.5 font-medium capitalize transition-colors',
                filter === f ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-canvas/70',
              )}
            >
              {f === 'all' ? 'All' : f === 'user' ? 'User actions' : 'System'}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-faint">Immutable · exportable</span>
        </div>

        {/* timeline */}
        <ul className="flex-1 divide-y divide-line-soft overflow-y-auto">
          {rows.map((e, i) => (
            <li key={i} className="flex gap-3 px-5 py-3">
              <span
                className={cn(
                  'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                  e.type === 'system' ? 'bg-slate-100 text-slate-500' : 'bg-brand-soft text-brand',
                )}
              >
                {e.type === 'system' ? '⚙' : (e.actor.split(' ').pop()?.[0] ?? '?')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-snug">
                  <span className="font-semibold text-ink">{e.actor}</span>
                  <span className="text-muted"> · {e.action}</span>
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink/75">{e.detail}</p>
                <p className="mt-0.5 text-[11px] text-faint">{e.when}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="border-t border-line-soft px-5 py-3 text-[11px] leading-relaxed text-faint">
          Every create / update / delete / status change and system action is recorded — actor, timestamp, before → after.
          PII-view actions (e.g. opening a resume) are always logged. Full history lives in System → Audit log.
        </p>
      </div>
    </div>
  )
}
