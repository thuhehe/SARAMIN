import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CO_ROLE_DEFS } from '@/pages/admin/data/companyRecord'
import type { CoUserRole } from '@/pages/admin/data/companyRecord'
import { CUSERS } from '@/pages/admin/data/users'
import type { CUser } from '@/pages/admin/data/users'
import { InviteUserModal } from '@/pages/admin/screens/companies/users'
import { ListPage, RowAction } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

function ChangeRoleModal({ user, users, onConfirm, onClose }: { user: CUser; users: CUser[]; onConfirm: (role: CoUserRole) => void; onClose: () => void }) {
  const [target, setTarget] = useState<CoUserRole>(user.role)
  const admins = users.filter((u) => u.company === user.company && u.role === 'Admin' && u.status !== 'Disabled')
  const lastAdmin = user.role === 'Admin' && admins.length <= 1
  const blocked = lastAdmin && target !== 'Admin'
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Change role — {user.name}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-[12px] text-muted">Pick the role for this user. <b className="text-ink/80">No email/login changes</b> — only their access changes.</p>
          <div className="space-y-1.5">
            {CO_ROLE_DEFS.map((r) => (
              <button key={r.name} onClick={() => setTarget(r.name as CoUserRole)} className={cn('flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left', target === r.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
                <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', target === r.name ? 'border-brand' : 'border-line')}>{target === r.name && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                <span className="min-w-0"><span className="block truncate text-[12.5px] font-medium text-ink">{r.name}{r.admin ? ' · account owner' : ''}</span><span className="block truncate text-[10.5px] text-faint">{r.admin ? 'everything + manage users & roles' : r.perms.length + ' permissions'}</span></span>
              </button>
            ))}
          </div>
          {blocked && <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span></span><span>This is the account’s <b>last Admin</b>. Assign Admin to another user before downgrading this one.</span></p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => !blocked && onConfirm(target)} disabled={blocked} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Save role</button>
        </div>
      </div>
    </div>
  )
}

/* HQ deactivation. Same soft, reversible action the company Admin has — but done by
   Saramin (support / trust & safety). A user HQ deactivates can only be re-enabled by
   HQ, so a company Admin can't quietly undo it. Never a hard delete. */
function DisableUserModal({ user, users, onConfirm, onClose }: { user: CUser; users: CUser[]; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const admins = users.filter((u) => u.company === user.company && u.role === 'Admin' && u.status !== 'Disabled')
  const lastAdmin = user.role === 'Admin' && admins.length <= 1
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[470px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Deactivate {user.name}?</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          {lastAdmin ? (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span>⚠️</span><span>{user.name} is the <b>last active Admin</b> of {user.company}. Assign Admin to someone else first — a company can’t be left without one.</span></p>
          ) : (
            <>
              <p className="text-[12px] leading-relaxed text-muted">Blocks this login immediately and frees their seat. Their jobs, applicants and CV unlocks <b className="text-ink/80">stay with {user.company}</b>. Reversible and audited — never a delete.</p>
              <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>🔒</span><span>Because <b>HQ</b> is doing this, the company’s own Admin <b>cannot</b> re-enable them — only Saramin can.</span></p>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Reason <span className="text-rose-500">*</span></p>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. left the company · support request · abuse report" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint" />
                <p className="mt-1 text-[10.5px] text-faint">Internal — written to the audit log, never shown to the user.</p>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => !lastAdmin && reason.trim() && onConfirm(reason.trim())} disabled={lastAdmin || !reason.trim()} className="rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Deactivate</button>
        </div>
      </div>
    </div>
  )
}

export function AdminCompanyUsers() {
  const [inviting, setInviting] = useState(false)
  const [users, setUsers] = useState<CUser[]>(CUSERS)
  const [changing, setChanging] = useState<CUser | null>(null)
  const [disabling, setDisabling] = useState<CUser | null>(null)
  const applyDisable = (reason: string) => {
    if (!disabling) return
    setUsers((prev) => prev.map((u) => (u.email === disabling.email ? { ...u, status: 'Disabled', disabledBy: 'HQ', disabledNote: reason } : u)))
    setDisabling(null)
  }
  const reEnable = (email: string) =>
    setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, status: 'Active', disabledNote: undefined } : u)))
  const applyRole = (role: CoUserRole) => {
    if (!changing) return
    setUsers((prev) => prev.map((u) => (u.email === changing.email ? { ...u, role } : u)))
    setChanging(null)
  }
  return (
    <div>
      <ListPage
        action={<button onClick={() => setInviting(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ Invite user</button>}
        tabs={[{ label: 'All users', count: 1140, active: true }, { label: 'Active', count: 1020 }, { label: 'Invited', count: 96 }, { label: 'Disabled', count: 24 }]}
        cols={[
          { label: 'User', w: '1.5fr' }, { label: 'Company (account)', w: '1.2fr' }, { label: 'Role', w: '1.1fr' },
          { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.5fr', align: 'r' },
        ]}
        rows={users.map((u) => [
          <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p><p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p></div>,
          <span className="truncate">{u.company}</span>,
          <Pill tone={u.role === 'Admin' ? 'neutral' : 'draft'}>{u.role}</Pill>,
          <div className="min-w-0">
            <Pill tone={u.status === 'Active' ? 'active' : u.status === 'Invited' ? 'pending' : 'expired'}>{u.status}</Pill>
            {u.status === 'Disabled' && u.disabledNote && <p className="mt-0.5 truncate text-[10.5px] text-faint">{u.disabledBy === 'HQ' ? 'by Saramin' : 'by company'} · {u.disabledNote}</p>}
          </div>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Invited'
              ? <><RowAction tone="brand">Resend</RowAction><RowAction tone="rose">Cancel</RowAction></>
              : u.status === 'Disabled'
                ? <button onClick={() => reEnable(u.email)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-brand hover:bg-canvas/70">Reactivate</button>
                : <><button onClick={() => setChanging(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Change role</button><button onClick={() => setDisabling(u)} className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50">Deactivate</button></>}
          </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        <b className="text-ink/70">Deactivate</b> is offboarding (nhân viên nghỉ việc): login blocked, seat freed, their work stays with the company — reversible, audited, never deleted. The company’s own Admin can do this too; a user <b>HQ</b> deactivated can only be reactivated by HQ. The last active Admin can’t be deactivated or downgraded.
      </p>
      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {changing && <ChangeRoleModal user={changing} users={users} onConfirm={applyRole} onClose={() => setChanging(null)} />}
      {disabling && <DisableUserModal user={disabling} users={users} onConfirm={applyDisable} onClose={() => setDisabling(null)} />}
    </div>
  )
}
