import { useState } from 'react'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { COMPANIES, CO_STATUS } from '@/pages/admin/data/companies'
import { OPERATOR_ROLE_BY_EMAIL, OP_DEPTS, STAFF, companiesOwnedBy } from '@/pages/admin/data/system'
import type { Staff } from '@/pages/admin/data/system'
import { DetailCard, KV } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'
import { Table } from '@/pages/admin/ui/table'

function AddStaffModal({ onAdd, onClose }: { onAdd: (s: Omit<Staff, 'id'>) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dept, setDept] = useState<string>('Sales')
  const [title, setTitle] = useState('')
  const valid = name.trim() && /.+@.+\..+/.test(email)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Add staff member</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Full name <span className="text-rose-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vũ Thanh Hải" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Email <span className="text-rose-500">*</span></label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@saramin.vn" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand">
                {OP_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Account executive" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>ℹ</span><span>This only adds the person to the directory. It does <b>not</b> grant console access — do that in <b>Users</b> (pick this staff member, assign a role, send the invite).</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => valid && onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim(), dept, title: title.trim() })} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Add to directory</button>
        </div>
      </div>
    </div>
  )
}

function StaffDetail({ s, onBack }: { s: Staff; onBack: () => void }) {
  useDetailCrumb(s.name, onBack)
  const role = OPERATOR_ROLE_BY_EMAIL[s.email]
  const owned = COMPANIES.filter((c) => c.owner === s.name)
  const initials = s.name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()
  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-[16px] font-bold text-white shadow-sm">{initials}</span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Staff member</p>
          <h2 className="mt-0.5 text-[20px] font-bold tracking-tight">{s.name}</h2>
          <p className="text-[11.5px] text-muted">{s.title || '—'} · {s.dept}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <DetailCard title="Contact & org">
          <KV label="Full name" value={s.name} />
          <KV label="Email" value={s.email} />
          <KV label="Phone" value={s.phone || '—'} />
          <KV label="Department" value={s.dept} />
          <KV label="Title" value={s.title || '—'} />
        </DetailCard>
        <div className="space-y-4">
          <DetailCard title="Console access" action={<span className="text-[11px] text-brand">Manage in Users →</span>}>
            {role
              ? <p className="flex items-center gap-2 text-[12.5px]">Operator <Pill tone={role === 'Super admin' ? 'neutral' : 'draft'}>{role}</Pill></p>
              : <p className="text-[12px] text-muted">No console access. Grant it in <b className="text-ink/70">Users</b> — pick this person and assign a role.</p>}
          </DetailCard>
          <DetailCard title="CRM ownership">
            {owned.length
              ? <div className="space-y-1.5">{owned.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5 text-[12px]"><span className="truncate">{c.name}</span><Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill></div>
                ))}</div>
              : <p className="text-[12px] text-muted">{s.dept === 'Sales' ? 'No companies assigned yet.' : 'Not a sales role — no company ownership.'}</p>}
          </DetailCard>
        </div>
      </div>
    </div>
  )
}

export function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>(STAFF)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<Staff | null>(null)
  const add = (s: Omit<Staff, 'id'>) => {
    setStaff((prev) => [{ id: Math.max(0, ...prev.map((x) => x.id)) + 1, ...s }, ...prev])
    setAdding(false)
  }
  if (open) return <StaffDetail s={open} onBack={() => setOpen(null)} />
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[64ch] flex-1 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
          The master people list for HQ. Add someone <b>once</b> (name · email · phone · department) and the record is reused elsewhere — <b>Users</b> picks a staff member to grant console access, and <b>CRM</b> assigns companies to a sales staff member as their owner. Adding staff here grants no access on its own.
        </p>
        <button onClick={() => setAdding(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Add staff</button>
      </div>
      <Table
        minW={1180}
        cols={[
          { label: 'Staff', w: '1.1fr' }, { label: 'Title', w: '1.2fr' }, { label: 'Email', w: '1.3fr' }, { label: 'Phone', w: '0.9fr' },
          { label: 'Department', w: '0.8fr' }, { label: 'Console access', w: '1fr' }, { label: 'CRM ownership', w: '1fr' },
        ]}
        rows={staff.map((s) => {
          const role = OPERATOR_ROLE_BY_EMAIL[s.email]
          const owned = companiesOwnedBy(s.name)
          return [
            <button onClick={() => setOpen(s)} className="min-w-0 truncate text-left text-[12.5px] font-medium text-brand hover:underline">{s.name}</button>,
            <span className="truncate text-[12px] text-ink/75">{s.title || '—'}</span>,
            <span className="truncate font-mono text-[11px] text-muted">{s.email}</span>,
            <span className="truncate text-[12px] text-ink/75 tabular-nums">{s.phone}</span>,
            <span className="truncate text-[12px] text-ink/75">{s.dept}</span>,
            role ? <Pill tone={role === 'Super admin' ? 'neutral' : 'draft'}>{role}</Pill> : <span className="text-[11px] text-faint">No access</span>,
            s.dept === 'Sales'
              ? (owned > 0 ? <span className="text-[12px] text-ink/75">{owned} {owned > 1 ? 'companies' : 'company'}</span> : <span className="text-[11px] text-faint">Unassigned</span>)
              : <span className="text-[11px] text-faint">—</span>,
          ]
        })}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Click a name to open the staff record. <b>Console access</b> = whether this person is an operator (and their role) — granted in <b>Users</b>, not here. <b>CRM ownership</b> = companies assigned to a sales staff member. Remove = deactivate (never hard-delete) so historical ownership &amp; the audit trail survive.
      </p>
      {adding && <AddStaffModal onAdd={add} onClose={() => setAdding(false)} />}
    </div>
  )
}
