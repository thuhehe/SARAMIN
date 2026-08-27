import { useState } from 'react'
import { cn } from '@/lib/utils'

/*
 * Reassign a company's sales owner.
 *
 * WHY THIS IS A DIALOG AND NOT A DROPDOWN. The owner used to be a plain select
 * inside the Basic-info card's edit mode, which had two problems the Owner history
 * tab made visible: it captured no REASON, so the history rendered a Reason column
 * nothing could populate; and because read-only is "you are not the owner", the
 * owning rep could move their own account — the exact thing the requirement
 * forbids ("a rep cannot quietly pass their own accounts around").
 *
 * So the reason is REQUIRED here. A handover with no reason is the one field the
 * history is read for six months later, and nobody remembers it by then.
 */
export function ReassignOwnerDialog({ company, current, owners, onConfirm, onClose }: {
  company: string
  current: string
  owners: string[]
  onConfirm: (to: string, reason: string) => void
  onClose: () => void
}) {
  const targets = owners.filter((o) => o !== current)
  const [to, setTo] = useState(targets[0] ?? '')
  const [reason, setReason] = useState('')
  const ready = !!to && reason.trim().length > 0
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[500px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Chuyển giao {company}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          <p className="rounded-md bg-canvas/70 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
            Đang phụ trách: <b className="text-ink/80">{current}</b>. Chuyển giao chỉ đổi <b className="text-ink/80">người chịu trách nhiệm</b> — contact, deal, quota, hạng thành viên và quan hệ khách hàng không đổi.
          </p>
          <div>
            <p className="mb-1 text-[11.5px] font-medium text-ink/80">Giao cho <span className="text-rose-500">*</span></p>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
            >
              {targets.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-1 text-[11.5px] font-medium text-ink/80">Lý do <span className="text-rose-500">*</span></p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="VD: rebalance vùng phụ trách · rep cũ đã nghỉ · account lớn lên, chuyển sang key-account"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              Bắt buộc — ghi vào Owner history kèm người thực hiện và ngày. Đây là ô mà 6 tháng sau không ai còn nhớ nếu bỏ trống.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button
            disabled={!ready}
            onClick={() => onConfirm(to, reason.trim())}
            className={cn('rounded-lg px-4 py-2 text-[13px] font-semibold text-white', ready ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-line')}
          >
            Chuyển giao
          </button>
        </div>
      </div>
    </div>
  )
}
