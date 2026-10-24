import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CO_ROLE_DEFS } from '@/pages/admin/data/companyRecord'
import type { CoUserRole } from '@/pages/admin/data/companyRecord'
import { CUSERS } from '@/pages/admin/data/users'
import type { CUser } from '@/pages/admin/data/users'
import { InviteUserModal } from '@/pages/admin/screens/companies/users'
import { RowAction } from '@/pages/admin/ui/list'
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

/* ── The global list, grouped by company (2026-10-24) ─────────────────────────
   One header row per company, its logins underneath, numbered continuously across
   the whole table. Grouping makes "who else is on this account" readable at a glance
   — the question HQ support asks most — at the cost of a GLOBAL user order. So the
   grouping is a toggle: OFF gives back the flat table where every column sorts the
   whole population ("the 50 most recently active logins").

   Sort with grouping ON is two-level:
     · Company / Company ID  → orders the GROUPS; users inside keep the default order
                               (Admin first, then name).
     · Member / Last active / Joined → orders users INSIDE each group, and the groups
                               follow their best member (the group whose top user wins
                               comes first).
   The line under the toolbar always says which of the two is in effect. */
type Row = CUser & { roleLabel?: string; companyId?: string; verified: boolean; lastDays: number | null; joined: string }
const DEMO: Row[] = [
  ...CUSERS.map((u, i) => ({ ...u, companyId: ({ 'Cty Vạn Phát': 'CO-6ECPFBV', 'FPT Software': 'CO-XKR8TDJ', 'Tiki': 'CO-Z53VR5K' } as Record<string, string>)[u.company], verified: u.status !== 'Invited', lastDays: u.status === 'Invited' ? null : [0, 0, 1, 0, 90][i], joined: ['12/04/2025', '03/06/2025', '12/01/2024', '20/10/2026', '10/11/2023'][i] })),
  { name: 'Nguyễn Hải Yến', email: 'yen@fpt.com.vn', company: 'FPT Software', companyId: 'CO-XKR8TDJ', role: 'Recruiter', roleLabel: 'Tuyển dụng Kỹ thuật', status: 'Active', last: '1w ago', lastDays: 7, verified: true, joined: '25/09/2026' },
  { name: 'Trần Đức Anh', email: 'anh@fpt.com.vn', company: 'FPT Software', companyId: 'CO-XKR8TDJ', role: 'Recruiter', status: 'Disabled', last: '2 months ago', lastDays: 60, verified: true, joined: '02/03/2025', disabledBy: 'HQ', disabledNote: 'Support request' },
  { name: 'hr@topdev.vn', email: 'hr@topdev.vn', company: 'Công ty TNHH BE', role: 'Admin', status: 'Disabled', last: '—', lastDays: null, verified: true, joined: '10/09/2026', disabledBy: 'Company', disabledNote: 'Nghỉ việc' },
  { name: 'Bùi Huyền', email: 'huyenbui@dnkinno.com', company: 'Công ty TNHH BE', role: 'Admin', status: 'Active', last: '—', lastDays: null, verified: true, joined: '10/09/2026' },
  { name: 'Lê Quốc Bảo', email: 'bao.le@saobangtech.vn', company: 'Công ty TNHH Giải pháp số Sao Mai', companyId: 'CO-GTCQ214', role: 'Recruiter', roleLabel: 'Tuyển dụng Kỹ thuật', status: 'Invited', last: '—', lastDays: null, verified: true, joined: '06/10/2026' },
  { name: 'Phạm Minh Hoa', email: 'mhoa7022@gmail.com', company: 'Công ty TNHH Grab', role: 'Admin', status: 'Active', last: '11/09/2026', lastDays: 43, verified: true, joined: '11/09/2026' },
  { name: 'Đặng Thu Trang', email: 'trang@vanphat.vn', company: 'Cty Vạn Phát', companyId: 'CO-6ECPFBV', role: 'Viewer', status: 'Active', last: '3d ago', lastDays: 3, verified: true, joined: '14/08/2026' },
]
type SortKey = 'member' | 'last' | 'joined' | 'company' | 'companyId'
const SORTS: { key: SortKey; label: string; level: 'group' | 'user' }[] = [
  { key: 'company', label: 'Company A–Z', level: 'group' },
  { key: 'companyId', label: 'Company ID', level: 'group' },
  { key: 'member', label: 'Member A–Z', level: 'user' },
  { key: 'last', label: 'Last active — newest', level: 'user' },
  { key: 'joined', label: 'Joined — newest', level: 'user' },
]
const dateKey = (d: string) => d.split('/').reverse().join('')
const userCmp = (k: SortKey) => (a: Row, b: Row) =>
  k === 'last' ? (a.lastDays ?? 1e9) - (b.lastDays ?? 1e9)
  : k === 'joined' ? dateKey(b.joined).localeCompare(dateKey(a.joined))
  : k === 'member' ? a.name.localeCompare(b.name, 'vi')
  : (a.role === 'Admin' ? 0 : 1) - (b.role === 'Admin' ? 0 : 1) || a.name.localeCompare(b.name, 'vi')

function RoleTag({ u }: { u: Row }) {
  return u.role === 'Admin'
    ? <span className="inline-flex items-center rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">Company Admin</span>
    : <span className="text-[12px] text-ink/80">{u.roleLabel ?? u.role}</span>
}
function StatusCell({ u }: { u: Row }) {
  return (
    <div className="min-w-0">
      <Pill tone={u.status === 'Active' ? 'active' : u.status === 'Invited' ? 'pending' : 'expired'}>{u.status}</Pill>
      {u.status === 'Disabled' && u.disabledNote && <p className="mt-0.5 truncate text-[10.5px] text-faint">{u.disabledBy === 'HQ' ? 'by Saramin' : 'by company'} · {u.disabledNote}</p>}
    </div>
  )
}

export function AdminCompanyUsers() {
  const [inviting, setInviting] = useState(false)
  const [users, setUsers] = useState<Row[]>(DEMO)
  const [changing, setChanging] = useState<CUser | null>(null)
  const [disabling, setDisabling] = useState<CUser | null>(null)
  const [grouped, setGrouped] = useState(true)
  const [sort, setSort] = useState<SortKey>('company')
  const [tab, setTab] = useState<'All' | 'Active' | 'Invited' | 'Disabled'>('All')
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const applyDisable = (reason: string) => {
    if (!disabling) return
    setUsers((prev) => prev.map((u) => (u.email === disabling.email ? { ...u, status: 'Disabled', disabledBy: 'HQ', disabledNote: reason } : u)))
    setDisabling(null)
  }
  const reEnable = (email: string) =>
    setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, status: 'Active', disabledNote: undefined } : u)))
  const applyRole = (role: CoUserRole) => {
    if (!changing) return
    setUsers((prev) => prev.map((u) => (u.email === changing.email ? { ...u, role, roleLabel: undefined } : u)))
    setChanging(null)
  }

  const counts = { All: users.length, Active: 0, Invited: 0, Disabled: 0 } as Record<string, number>
  users.forEach((u) => counts[u.status]++)
  const needle = q.trim().toLowerCase()
  const visible = users.filter((u) => (tab === 'All' || u.status === tab) && (!needle || [u.name, u.email, u.company, u.companyId ?? ''].join(' ').toLowerCase().includes(needle)))
  const level = SORTS.find((s) => s.key === sort)!.level

  // groups — built from ALL users so a header can say "2 of 5 match"
  const byCo = new Map<string, Row[]>()
  users.forEach((u) => byCo.set(u.company, [...(byCo.get(u.company) ?? []), u]))
  let groups = [...byCo.entries()].map(([company, all]) => ({ company, all, id: all[0].companyId, shown: visible.filter((u) => u.company === company).sort(userCmp(level === 'user' ? sort : 'company')) })).filter((g) => g.shown.length)
  groups = groups.sort((a, b) =>
    sort === 'company' ? a.company.localeCompare(b.company, 'vi')
    : sort === 'companyId' ? (a.id ?? '~').localeCompare(b.id ?? '~')
    : userCmp(sort)(a.shown[0], b.shown[0]))
  const flat = visible.slice().sort(
    sort === 'company' ? (a, b) => a.company.localeCompare(b.company, 'vi') || userCmp('company')(a, b)
    : sort === 'companyId' ? (a, b) => (a.companyId ?? '~').localeCompare(b.companyId ?? '~')
    : userCmp(sort))

  const head = grouped
    ? ['#', 'Member', 'Role', 'Status', 'Email', 'Last active', 'Joined', 'Actions']
    : ['#', 'Member', 'Company', 'Company ID', 'Role', 'Status', 'Last active', 'Joined', 'Actions']
  const grid = grouped ? 'grid-cols-[40px_1.6fr_1.1fr_1fr_0.7fr_0.9fr_0.8fr_1.3fr]' : 'grid-cols-[40px_1.5fr_1.4fr_0.9fr_1fr_0.9fr_0.8fr_0.8fr_1.3fr]'
  const actions = (u: Row) => (
    <div className="flex items-center justify-end gap-1.5">
      {u.status === 'Invited'
        ? <><RowAction tone="brand">Resend</RowAction><RowAction tone="rose">Cancel</RowAction></>
        : u.status === 'Disabled'
          ? <button onClick={() => reEnable(u.email)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-brand hover:bg-canvas/70">Reactivate</button>
          : <><button onClick={() => setChanging(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Change role</button><button onClick={() => setDisabling(u)} className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50">Deactivate</button></>}
    </div>
  )
  const member = (u: Row) => (
    <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p>{u.name !== u.email && <p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p>}</div>
  )
  const idCell = (id?: string) => id
    ? <span className="font-mono text-[11px] text-muted">{id} <span className="cursor-pointer text-faint">⧉</span></span>
    : <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-700">Chưa có Company ID</span>
  let n = 0

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted">Login users of every customer company.</p>
        <button onClick={() => setInviting(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ Invite user</button>
      </div>
      <div className="mb-3 flex gap-4 border-b border-line">
        {(['All', 'Active', 'Invited', 'Disabled'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 px-1 pb-2 text-[12.5px]', tab === t ? 'border-brand font-semibold text-brand' : 'border-transparent text-muted hover:text-ink')}>{t} <span className="text-faint">{counts[t]}</span></button>
        ))}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, company or Company ID" className="w-[300px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] placeholder:text-faint" />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink">
          <span onClick={() => setGrouped((g) => !g)} className={cn('relative h-4 w-7 rounded-full transition-colors', grouped ? 'bg-brand' : 'bg-line')}><span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', grouped ? 'right-0.5' : 'left-0.5')} /></span>
          <span onClick={() => setGrouped((g) => !g)}>Nhóm theo công ty</span>
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink">
          {SORTS.map((s) => <option key={s.key} value={s.key}>Sort: {s.label}</option>)}
        </select>
        <button className="ml-auto rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink">⤓ Export Excel</button>
      </div>
      <p className="mb-2 text-[11px] text-faint">
        {!grouped ? 'Danh sách phẳng — sắp xếp áp dụng cho toàn bộ user.'
          : level === 'group' ? 'Đang sắp xếp các CÔNG TY; user trong mỗi công ty: Company Admin trước, rồi theo tên.'
          : 'Đang sắp xếp USER trong từng công ty; công ty xếp theo user đứng đầu nhóm. Cần thứ tự user toàn hệ thống? Tắt “Nhóm theo công ty”.'}
      </p>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <div className="min-w-[1000px]">
          <div className={cn('grid items-center gap-3 border-b border-line bg-canvas/60 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint', grid)}>
            {head.map((h, i) => <span key={h} className={cn(i === head.length - 1 && 'text-right')}>{h}</span>)}
          </div>
          {grouped ? groups.map((g) => {
            const open = !collapsed[g.company]
            const st = { Active: 0, Invited: 0, Disabled: 0 } as Record<string, number>
            g.all.forEach((u) => st[u.status]++)
            return (
              <div key={g.company}>
                <div onClick={() => setCollapsed((c) => ({ ...c, [g.company]: open }))} className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-slate-50 px-4 py-2.5 hover:bg-slate-100/70">
                  <span className="w-[28px] text-[11px] text-faint">{open ? '▾' : '▸'}</span>
                  <span className="text-[13px] font-semibold text-brand hover:underline">{g.company}</span>
                  {idCell(g.id)}
                  <span className="text-[11.5px] text-muted">· {g.all.length} {g.all.length > 1 ? 'users' : 'user'}</span>
                  <span className="text-[11px] text-faint">{(['Active', 'Invited', 'Disabled'] as const).filter((s) => st[s]).map((s) => `${st[s]} ${s}`).join(' · ')}</span>
                  {g.shown.length < g.all.length && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10.5px] text-brand">{g.shown.length} / {g.all.length} khớp bộ lọc</span>}
                </div>
                {open && g.shown.map((u) => (
                  <div key={u.email} className={cn('grid items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-0', grid)}>
                    <span className="pl-3 text-[11.5px] text-faint">{++n}</span>
                    <div className="border-l-2 border-line pl-3">{member(u)}</div>
                    <RoleTag u={u} />
                    <StatusCell u={u} />
                    <span className="text-[11.5px] text-muted">{u.verified ? 'Verified' : '—'}</span>
                    <span className="text-[11.5px] text-muted">{u.last}</span>
                    <span className="text-[11.5px] text-muted">{u.joined}</span>
                    {actions(u)}
                  </div>
                ))}
                {!open && (n += g.shown.length) && null}
              </div>
            )
          }) : flat.map((u) => (
            <div key={u.email} className={cn('grid items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-0', grid)}>
              <span className="text-[11.5px] text-faint">{++n}</span>
              {member(u)}
              <span className="truncate text-[12px] text-brand">{u.company}</span>
              {idCell(u.companyId)}
              <RoleTag u={u} />
              <StatusCell u={u} />
              <span className="text-[11.5px] text-muted">{u.last}</span>
              <span className="text-[11.5px] text-muted">{u.joined}</span>
              {actions(u)}
            </div>
          ))}
          {!visible.length && <p className="px-4 py-8 text-center text-[12.5px] text-muted">Không có user nào khớp.</p>}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11.5px] text-muted">
        <span>Showing {visible.length} users{grouped ? ` in ${groups.length} companies` : ''}</span>
        <span>Rows per page 100 · Page 1 of 1</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Phân trang đếm theo USER. Nếu một công ty bị cắt sang trang sau, header công ty lặp lại ở đầu trang kèm “(tiếp)”. Số thứ tự chạy liên tục qua các nhóm, kể cả nhóm đang thu gọn.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        <b className="text-ink/70">Deactivate</b> is offboarding (nhân viên nghỉ việc): login blocked, seat freed, their work stays with the company — reversible, audited, never deleted. The company’s own Admin can do this too; a user <b>HQ</b> deactivated can only be reactivated by HQ. The last active Admin can’t be deactivated or downgraded.
      </p>
      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {changing && <ChangeRoleModal user={changing} users={users} onConfirm={applyRole} onClose={() => setChanging(null)} />}
      {disabling && <DisableUserModal user={disabling} users={users} onConfirm={applyDisable} onClose={() => setDisabling(null)} />}
    </div>
  )
}
