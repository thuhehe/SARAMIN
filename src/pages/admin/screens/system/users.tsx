import { useState } from 'react'
import { cn } from '@/lib/utils'
import { OPERATORS, OP_STATUS, ROLES, STAFF, TOTAL_PERMS, expandGrants, grantedCount } from '@/pages/admin/data/system'
import type { OpUser } from '@/pages/admin/data/system'
import { ListPage, RowAction } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

function CreateOperatorModal({ onCreate, onClose }: { onCreate: (name: string, email: string, dept: string, role: string) => void; onClose: () => void }) {
  const [staffId, setStaffId] = useState<number | null>(null)
  const [role, setRole] = useState('')
  // Only staff who aren't already operators can be invited (name/email come from
  // the Staff directory — you don't re-type them here).
  const takenEmails = new Set(OPERATORS.map((o) => o.email))
  const options = STAFF.filter((s) => !takenEmails.has(s.email))
  const picked = STAFF.find((s) => s.id === staffId) ?? null
  const valid = picked && role
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[480px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Create operator</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          {/* step markers */}
          <div className="flex items-center gap-1 text-[10.5px] font-medium text-faint">
            <span className={cn('rounded-full px-2 py-0.5', picked ? 'bg-brand-soft text-brand' : 'bg-brand text-white')}>1 · Pick staff</span><span>→</span>
            <span className={cn('rounded-full px-2 py-0.5', role ? 'bg-brand-soft text-brand' : picked ? 'bg-brand text-white' : 'bg-canvas')}>2 · Assign role</span><span>→</span>
            <span className="rounded-full bg-canvas px-2 py-0.5">3 · Send invite</span>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Staff member <span className="text-rose-500">*</span></label>
            <select value={staffId ?? ''} onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand">
              <option value="">Select a staff member…</option>
              {options.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.dept} · {s.email}</option>)}
            </select>
            <p className="mt-1.5 text-[11px] text-faint">From the <b className="text-ink/70">Staff directory</b> — name, email &amp; department come from their record. Not listed? Add them in <b className="text-ink/70">System → Staff</b> first.</p>
          </div>
          {picked && (
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2.5 text-[11.5px]">
              <div className="col-span-2 min-w-0"><p className="text-[10px] uppercase tracking-wide text-faint">Email (login)</p><p className="truncate font-mono text-[11px] text-ink/80">{picked.email}</p></div>
              <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-faint">Dept</p><p className="truncate text-ink/80">{picked.dept}</p></div>
              <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-faint">Phone</p><p className="truncate text-ink/80 tabular-nums">{picked.phone || '—'}</p></div>
              <div className="col-span-2 min-w-0"><p className="text-[10px] uppercase tracking-wide text-faint">Title</p><p className="truncate text-ink/80">{picked.title || '—'}</p></div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Role <span className="text-rose-500">*</span></label>
            <div className="grid gap-1.5">
              {ROLES.map((r) => (
                <button key={r.name} onClick={() => setRole(r.name)} className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left', role === r.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
                  <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', role === r.name ? 'border-brand' : 'border-line')}>{role === r.name && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-ink">{r.name}</span><span className="block truncate text-[10.5px] text-faint">{r.desc}</span></span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-faint">{grantedCount(expandGrants(r.grants))}/{TOTAL_PERMS}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-faint">No role fits? Define one first in <b className="text-ink/70">System → Roles &amp; permissions</b>.</p>
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span></span><span>Sending the invite emails a one-time activation link. The operator <b>sets their own password</b> — no one types it for them. Their status stays <b>Pending</b> until they activate it, then flips to <b>Active</b>.</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => picked && role && onCreate(picked.name, picked.email, picked.dept, role)} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Create &amp; send invite</button>
        </div>
      </div>
    </div>
  )
}

export function AdminUsers() {
  const [users, setUsers] = useState<OpUser[]>(OPERATORS)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => setToast(m)
  const create = (name: string, email: string, dept: string, role: string) => {
    setUsers((prev) => [{ id: Math.max(0, ...prev.map((u) => u.id)) + 1, name, email, dept, role, status: 'Pending', last: '—' }, ...prev])
    setCreating(false)
    flash(`Invitation sent to ${email} — waiting for them to activate the link.`)
  }
  const setStatus = (id: number, status: OpUser['status']) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))

  return (
    <div>
      {toast && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      <ListPage
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ Create operator</button>}
        tabs={[{ label: 'All', count: users.length, active: true }, { label: 'Active', count: users.filter((u) => u.status === 'Active').length }, { label: 'Pending', count: users.filter((u) => u.status === 'Pending').length }, { label: 'Disabled', count: users.filter((u) => u.status === 'Disabled').length }]}
        minW={1060}
        cols={[{ label: 'Operator', w: '1.1fr' }, { label: 'Email (login)', w: '1.4fr' }, { label: 'Department', w: '0.9fr' }, { label: 'Role', w: '1.1fr' }, { label: 'Status', w: '1fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.6fr', align: 'r' }]}
        rows={users.map((u) => [
          <span className="truncate text-[12.5px] font-medium text-ink">{u.name}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{u.email}</span>,
          <span className="truncate text-[12px] text-ink/75">{u.dept}</span>,
          <Pill tone={u.role === 'Super admin' ? 'neutral' : 'draft'}>{u.role}</Pill>,
          u.status === 'Pending'
            ? <span className="inline-flex items-center gap-1.5"><Pill tone="pending">Pending</Pill><span className="text-[10.5px] text-faint">invite sent</span></span>
            : <Pill tone={OP_STATUS[u.status]}>{u.status}</Pill>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Pending'
              ? <><button onClick={() => flash(`Invitation re-sent to ${u.email}.`)} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Resend</button><button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70" title="Demo: simulate the operator activating their link">Simulate activate</button><RowAction tone="rose">Cancel</RowAction></>
              : u.status === 'Disabled'
                ? <button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Re-enable</button>
                : <><RowAction>Change role</RowAction><button onClick={() => setStatus(u.id, 'Disabled')} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Disable</button></>}
          </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Interactive prototype — <b>+ Create operator</b> adds a Pending row; <b>Simulate activate</b> flips it to Active. Full lifecycle &amp; status rules are in the feature spec (↗ View full spec).
      </p>

      {creating && <CreateOperatorModal onCreate={create} onClose={() => setCreating(false)} />}
    </div>
  )
}
