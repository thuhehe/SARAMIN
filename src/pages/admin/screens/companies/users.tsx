import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CO_ALL_PERMS, CO_NEEDS, CO_PERM_GROUPS, CO_ROLE_DEFS, coTogglePerm } from '@/pages/admin/data/companyRecord'
import type { CoPermKey, CoRoleDef } from '@/pages/admin/data/companyRecord'
import { LField } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/* Interactive "build a role" panel — the Add/Edit role screen (VietnamWorks-style,
   trimmed). Roles list on the left, permission checklist on the right. */
export function CoRoleBuilder() {
  const [roles, setRoles] = useState<CoRoleDef[]>(CO_ROLE_DEFS)
  const [sel, setSel] = useState(1)
  const role = roles[sel]
  const editable = !role.admin
  const setPerms = (perms: CoPermKey[]) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, perms } : r)))
  const addRole = () => { setRoles((rs) => [...rs, { name: `New role ${rs.length}`, perms: ['jobs.view'] }]); setSel(roles.length) }
  return (
    <div className="mt-3 grid gap-3 rounded-lg border border-line p-3 md:grid-cols-[180px_1fr]">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11.5px] font-semibold text-ink">Roles</p>
          <button onClick={addRole} className="text-[11px] font-medium text-brand">+ Add role</button>
        </div>
        <div className="space-y-1">
          {roles.map((r, i) => (
            <button key={r.name} onClick={() => setSel(i)} className={cn('flex w-full items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-left', i === sel ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
              <span className="truncate text-[11.5px] font-medium text-ink">{r.name}</span>
              {r.admin && <Pill tone="neutral">Super admin</Pill>}
            </button>
          ))}
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <input value={role.name} readOnly={!editable} onChange={(e) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, name: e.target.value } : r)))} className={cn('min-w-0 flex-1 rounded-md px-2 py-1.5 text-[12.5px] font-semibold text-ink', editable ? 'border border-line' : 'border border-transparent bg-transparent')} />
          {role.admin && <span className="shrink-0 text-[10.5px] text-faint">Super admin · full access, can’t be edited</span>}
        </div>
        {CO_PERM_GROUPS.map((g) => (
          <div key={g.module} className="mb-2 border-t border-line/60 pt-2 first:border-0 first:pt-0">
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-faint">{g.module}</p>
            {g.perms.map((p) => {
              const on = role.perms.includes(p.key)
              const locked = on && CO_ALL_PERMS.some((q) => CO_NEEDS[q] === p.key && role.perms.includes(q))
              const disabled = !editable || locked
              return (
                <label key={p.key} className={cn('flex items-center gap-2 rounded px-1.5 py-1', disabled ? '' : 'cursor-pointer hover:bg-canvas/70')}>
                  <input type="checkbox" checked={on} disabled={disabled} onChange={() => editable && setPerms(coTogglePerm(role.perms, p.key))} className="h-3.5 w-3.5 accent-brand" />
                  <span className="text-[11.5px] text-ink">{p.label}</span>
                </label>
              )
            })}
          </div>
        ))}
        <p className="mt-2 text-[10.5px] leading-relaxed text-faint">Ticking a higher action auto-includes (and locks) its prerequisite, so a role is never invalid. Admin is the one fixed role — every other role is custom and editable.</p>
      </div>
    </div>
  )
}

/* Compact read-only view of ONE role's permissions — used inside the invite modal. */
function CoRolePermsView({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const def = CO_ROLE_DEFS.find((r) => r.name === role)
  return (
    <div className="mt-2 rounded-lg border border-line">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-left">
        <span className="text-[11.5px] font-medium text-brand">View role’s permissions</span>
        <span className="text-[10px] text-faint">{open ? '▾' : '▸'}</span>
      </button>
      {open && def && (
        <div className="border-t border-line px-3 py-2.5">
          {CO_PERM_GROUPS.map((g) => (
            <div key={g.module} className="mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{g.module}</p>
              {g.perms.map((p) => (
                <p key={p.key} className={cn('text-[11.5px]', def.perms.includes(p.key) ? 'text-ink' : 'text-faint line-through')}>
                  {def.perms.includes(p.key) ? '' : '—'} {p.label}
                </p>
              ))}
            </div>
          ))}
          {def.admin && <p className="text-[11.5px] text-ink">Manage users &amp; roles</p>}
        </div>
      )}
    </div>
  )
}

export function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState('Recruiter')
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Invite user</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <LField label="Company (account)" value="Cty Vạn Phát" select />
          <LField label="Email" req value="new.hr@vanphat.vn" />
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Role <span className="text-rose-500">*</span></p>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
              {CO_ROLE_DEFS.map((r) => <option key={r.name} value={r.name}>{r.name}{r.admin ? ' (account owner)' : ''}</option>)}
            </select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">Pick one of the account’s roles. Roles are built on the <b className="text-ink/70">Roles</b> screen; “Admin” grants account administration and every account keeps at least one.</p>
            <CoRolePermsView role={role} />
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span></span><span>We email an invite link. The person <b>sets their own password</b> — no one types it for them.</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Send invite</button>
        </div>
      </div>
    </div>
  )
}
