import { useState } from 'react'
import { cn } from '@/lib/utils'
import { JOB_ROWS } from '@/pages/admin/data/recruitment'
import type { JobRow } from '@/pages/admin/data/recruitment'
import { AdminJobCreate } from '@/pages/admin/screens/jobForm/create'
import { AdminJobDetail } from '@/pages/admin/screens/recruitment/jobDetail'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* The create form as a screen in its own right, so the "Create job (Admin)" spec
   page can show the form instead of the list it is reached from. Back returns to
   the list — the same thing it does inside the console. */
export function AdminJobCreateStandalone() {
  const [backToList, setBackToList] = useState(false)
  if (backToList) return <AdminJobList />
  return <AdminJobCreate onBack={() => setBackToList(true)} />
}

export function AdminJobList() {
  const [creating, setCreating] = useState(false)
  const [detail, setDetail] = useState<JobRow | null>(null)
  if (creating) return <AdminJobCreate onBack={() => setCreating(false)} />
  if (detail) return <AdminJobDetail job={detail} onBack={() => setDetail(null)} />
  return (
    <div>
    <ListPage
      action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New job</button>}
      minW={1400}
      tabs={[{ label: 'All', count: 1248 }, { label: 'Draft', count: 8 }, { label: 'Schedule', count: 5, active: true }, { label: 'Open', count: 1180 }, { label: 'Closed', count: 58 }]}
      cols={[
        { label: 'Job title', w: '1.7fr' },
        { label: 'Job ID', w: '0.8fr' },
        { label: 'Category', w: '1fr' },
        { label: 'Company', w: '1.1fr' },
        { label: 'Product', w: '0.9fr' },
        { label: 'Created by', w: '0.8fr' },
        { label: 'Status', w: '0.9fr' },
        { label: 'Exposure', w: '0.7fr' },
        { label: 'Posted', w: '0.8fr', align: 'r' },
        { label: 'Expires', w: '0.8fr', align: 'r' },
        { label: 'Views', w: '0.6fr', align: 'r' },
        { label: 'Saves', w: '0.6fr', align: 'r' },
        { label: 'Applied', w: '0.7fr', align: 'r' },
      ]}
      rows={JOB_ROWS.map((r) => [
        <button onClick={() => setDetail(r)} className="min-w-0 text-left"><p className="truncate font-medium text-brand hover:underline">{r.title}</p></button>,
        <span className="font-mono text-[11px] text-muted">{r.id}</span>,
        <span className="truncate text-muted">{r.category}</span>,
        <span className="truncate">{r.company}</span>,
        <span className="rounded border border-line px-1.5 py-0.5 text-[10.5px] text-ink/70">{r.product}</span>,
        <Pill tone={r.source === 'Admin' ? 'neutral' : 'draft'}>{r.source}</Pill>,
        <Pill tone={r.status}>{r.statusLabel}</Pill>,
        r.status === 'open'
          ? <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-medium', r.exposure === 'On' ? 'text-emerald-600' : 'text-slate-400')}><span className={cn('h-1.5 w-1.5 rounded-full', r.exposure === 'On' ? 'bg-emerald-500' : 'bg-slate-300')} />{r.exposure}</span>
          : <span className="text-[11.5px] text-faint">—</span>,
        <span className="tabular-nums text-muted">{r.posted}</span>,
        <span className="tabular-nums text-muted">{r.deadline}</span>,
        <span className="tabular-nums">{r.views.toLocaleString('en-US')}</span>,
        <span className="tabular-nums">{r.saves.toLocaleString('en-US')}</span>,
        <span className="tabular-nums font-medium text-brand">{r.applicants || '—'}</span>,
      ])}
    />
    </div>
  )
}
