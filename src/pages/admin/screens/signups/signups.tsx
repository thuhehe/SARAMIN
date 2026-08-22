import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { COMPANIES } from '@/pages/admin/data/companies'
import { CO_ROLE_DEFS } from '@/pages/admin/data/companyRecord'
import type { CoUserRole } from '@/pages/admin/data/companyRecord'
import { SIGNUPS, SIGNUP_STATUS } from '@/pages/admin/data/signups'
import type { Signup, SignupStatus } from '@/pages/admin/data/signups'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* The three sign-up actions, each with its own confirm flow. Move / Create both end by
   emailing the user a set-password / activation link; Archive discards the request. */
function SignupActionModal({ mode, s, onConfirm, onClose }: { mode: 'move' | 'create' | 'archive'; s: Signup; onConfirm: (status: SignupStatus, outcome: string) => void; onClose: () => void }) {
  const targets = Array.from(new Set(COMPANIES.map((c) => (c.shortName?.trim() || c.name))))
  const [company, setCompany] = useState(s.matchName ?? targets[0] ?? '')
  const [role, setRole] = useState<CoUserRole>('Recruiter')
  const [newName, setNewName] = useState(s.company)
  const [newTax, setNewTax] = useState(s.tax === '—' ? '' : s.tax)
  const [reason, setReason] = useState('')
  const salesOwners = ['Nguyễn Thị Lan', 'Phạm Quang Huy', 'Trần Quốc Trung']
  const [owner, setOwner] = useState(salesOwners[0])
  const title = mode === 'move' ? `Move ${s.person} to an existing company` : mode === 'create' ? `Create a new company & move ${s.person} in` : 'Archive this sign-up?'
  const activation = <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>✉️</span><span>This unlocks login and emails the user <b>“you’re in — sign in”</b>. They sign in with the password they set at sign-up. (Their email is already verified.)</span></p>
  const ownerField = (
    <div>
      <p className="mb-1 text-[11.5px] font-medium text-ink/80">Sales owner <span className="text-rose-500">*</span></p>
      <select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
        {salesOwners.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <p className="mt-1 text-[10.5px] text-faint">The rep who owns this company in the CRM.</p>
    </div>
  )
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[480px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">{title}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <div className="rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px] text-muted">
            Signed up as <b className="text-ink/80">{s.person}</b> · <span className="font-mono">{s.email}</span> · typed company “<b className="text-ink/80">{s.company}</b>”{s.tax !== '—' ? ` · MST ${s.tax}` : ''}
          </div>

          {mode === 'move' && (
            <>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Move into company <span className="text-rose-500">*</span></p>
                <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {s.matchName && !targets.includes(s.matchName) && <option value={s.matchName}>{s.matchName} (tax match)</option>}
                  {targets.map((n) => <option key={n} value={n}>{n}{n === s.matchName ? ' (tax match)' : ''}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Role in that company <span className="text-rose-500">*</span></p>
                <select value={role} onChange={(e) => setRole(e.target.value as CoUserRole)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {CO_ROLE_DEFS.map((r) => <option key={r.name} value={r.name}>{r.name}{r.admin ? ' (account owner)' : ''}</option>)}
                </select>
              </div>
              {ownerField}
              {activation}
            </>
          )}

          {mode === 'create' && (
            <>
              <p className="text-[12px] text-muted">Create a fresh company from this sign-up and make this person its <b className="text-ink/80">Admin</b>.</p>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Company name <span className="text-rose-500">*</span></p>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink" />
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Tax number</p>
                <input value={newTax} onChange={(e) => setNewTax(e.target.value)} placeholder="Business registration no." className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint" />
              </div>
              {ownerField}
              <p className="text-[11px] text-faint">Role: <b className="text-ink/70">Admin</b> — the first user of a new company is always its Admin.</p>
              {activation}
            </>
          )}

          {mode === 'archive' && (
            <>
              <p className="text-[12px] text-muted">Discard this sign-up — <b className="text-ink/80">no account is created</b> and no email is sent. Reversible and written to the audit log.</p>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Reason <span className="text-rose-500">*</span></p>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. spam / test / not a real company" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint" />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          {mode === 'move' && <button onClick={() => onConfirm('Resolved', `Moved to ${company} as ${role} · owner ${owner} · sign-in email sent`)} className="rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Move + send sign-in</button>}
          {mode === 'create' && <button onClick={() => onConfirm('Resolved', `New company “${newName}” created · Admin · owner ${owner} · sign-in email sent`)} disabled={!newName.trim()} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Create + move</button>}
          {mode === 'archive' && <button onClick={() => onConfirm('Archived', `Archived${reason.trim() ? ` · ${reason.trim()}` : ''}`)} disabled={!reason.trim()} className="rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Archive sign-up</button>}
        </div>
      </div>
    </div>
  )
}

/* Row actions live behind a ⋯ menu. Fixed-positioned from the button rect so it
   never gets clipped by the table's horizontal-scroll container. */
function SignupRowMenu({ onMove, onCreate, onArchive }: { onMove: () => void; onCreate: () => void; onArchive: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const toggle = () => {
    const el = ref.current
    if (!open && el) { const r = el.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.right - 200 }) }
    setOpen((o) => !o)
  }
  const item = 'block w-full px-3 py-2 text-left text-[12px] hover:bg-canvas/70'
  return (
    <>
      <button ref={ref} onClick={toggle} aria-label="Actions" className="grid h-7 w-7 place-items-center rounded-md border border-line text-[15px] leading-none text-muted hover:bg-canvas/70">⋯</button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', top: pos.top, left: pos.left }} className="z-50 w-[200px] overflow-hidden rounded-lg border border-line bg-surface shadow-xl">
            <button onClick={() => { setOpen(false); onMove() }} className={cn(item, 'text-ink')}>Move to existing company</button>
            <button onClick={() => { setOpen(false); onCreate() }} className={cn(item, 'text-ink')}>Create new company + move</button>
            <button onClick={() => { setOpen(false); onArchive() }} className={cn(item, 'border-t border-line text-rose-600')}>Archive sign-up</button>
          </div>
        </>
      )}
    </>
  )
}

export function AdminSignups() {
  const [rows, setRows] = useState<Signup[]>(SIGNUPS)
  const [modal, setModal] = useState<{ mode: 'move' | 'create' | 'archive'; s: Signup } | null>(null)
  const resolve = (status: SignupStatus, outcome: string) => {
    if (!modal) return
    setRows((rs) => rs.map((r) => (r.email === modal.s.email ? { ...r, status, outcome } : r)))
    setModal(null)
  }
  return (
    <div>
      <ListPage
        tabs={[{ label: 'All', count: 34 }, { label: 'New', count: 22, active: true }, { label: 'Resolved', count: 9 }, { label: 'Archived', count: 3 }]}
        cols={[
          { label: 'Full name', w: '1fr' }, { label: 'Email', w: '1.2fr' }, { label: 'Phone', w: '0.8fr' },
          { label: 'Tax number', w: '0.8fr' }, { label: 'Company name', w: '1fr' }, { label: 'Hiring', w: '0.5fr' },
          { label: 'Email verified', w: '1fr' }, { label: 'Match', w: '0.9fr' }, { label: 'Status', w: '1.1fr' }, { label: 'When', w: '0.6fr' },
          { label: 'Action', w: '1.3fr', align: 'r' },
        ]}
        rows={rows.map((s) => [
          <span className="truncate text-[12.5px] font-medium text-ink">{s.person}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{s.email}</span>,
          <span className="truncate text-[11.5px] text-muted">{s.phone}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{s.tax}</span>,
          <span className="truncate text-[12px] text-ink/80">{s.company}</span>,
          <Pill tone={s.hiring ? 'active' : 'neutral'}>{s.hiring ? 'Yes' : 'No'}</Pill>,
          s.verified
            ? <Pill tone="active">✓ Verified</Pill>
            : <Pill tone="pending">Awaiting</Pill>,
          s.matched
            ? <Pill tone="active">Match{s.matchName ? `: ${s.matchName}` : ''}</Pill>
            : <Pill tone="neutral">Not match</Pill>,
          <div className="min-w-0">
            <Pill tone={SIGNUP_STATUS[s.status]}>{s.status}</Pill>
            {s.outcome && <p className="mt-0.5 truncate text-[10.5px] text-faint">{s.outcome}</p>}
          </div>,
          <span className="text-[11.5px] text-muted">{s.when}</span>,
          s.status !== 'New'
            ? <span className="text-[11px] text-faint">—</span>
            : !s.verified
              ? <span className="whitespace-nowrap text-[10.5px] text-amber-700">Awaiting email verification</span>
              : <div className="flex justify-end">
                  <SignupRowMenu
                    onMove={() => setModal({ mode: 'move', s })}
                    onCreate={() => setModal({ mode: 'create', s })}
                    onArchive={() => setModal({ mode: 'archive', s })}
                  />
                </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        <b>Two gates:</b> a row is actionable only once <b>Email verified</b> (gate 1, automatic) — until then it shows “awaiting email verification.” Then HQ (gate 2) picks the <b>same three choices</b> for any verified row — <b>Move to existing</b>, <b>Create + move</b>, or <b>Archive</b>. Move / Create unlock login and email the user “you’re in — sign in” (password already set). <b>Match</b> is just a hint (did the tax code hit an existing company?).
      </p>
      {modal && <SignupActionModal mode={modal.mode} s={modal.s} onConfirm={resolve} onClose={() => setModal(null)} />}
    </div>
  )
}
