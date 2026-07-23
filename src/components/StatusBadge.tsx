import type { Status } from '@/data/types'
import { STATUS_META } from '@/lib/status'
import { cn } from '@/lib/utils'

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        m.pill,
        className,
      )}
      title={m.description}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

export function StatusDot({ status }: { status: Status }) {
  const m = STATUS_META[status]
  return <span className={cn('h-2 w-2 shrink-0 rounded-full', m.dot)} title={m.label} />
}
