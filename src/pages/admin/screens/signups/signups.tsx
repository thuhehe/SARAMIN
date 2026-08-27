import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useContext } from 'react'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { COMPANIES } from '@/pages/admin/data/companies'
import { CO_ROLE_DEFS } from '@/pages/admin/data/companyRecord'
import type { CoUserRole } from '@/pages/admin/data/companyRecord'
import { SIGNUPS, SIGNUP_STATUS } from '@/pages/admin/data/signups'
import type { Signup, SignupStatus } from '@/pages/admin/data/signups'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* The three sign-up actions, each with its own confirm flow. Move / Create both end by
   emailing the user a set-password / activation link; Archive discards the request. */
function SignupActionModal({ mode, s, onConfirm, onClose, onGoPool, onGoCreate }: { mode: 'move' | 'archive'; s: Signup; onConfirm: (status: SignupStatus, outcome: string) => void; onClose: () => void; onGoPool?: (co: string) => void; onGoCreate?: () => void }) {
  const targets = Array.from(new Set(COMPANIES.map((c) => (c.shortName?.trim() || c.name))))
  const [company, setCompany] = useState(s.matchName ?? targets[0] ?? '')
  const [role, setRole] = useState<CoUserRole>('Recruiter')
  const [reason, setReason] = useState('')
  const salesOwners = ['Nguyễn Thị Lan', 'Phạm Quang Huy', 'Trần Quốc Trung']
  const [owner, setOwner] = useState(salesOwners[0])
  const title = mode === 'move' ? `Move ${s.person} to a company` : 'Archive this sign-up?'
  /* Placement and login are two different moments once the email gate stopped
     blocking placement — so this note has to say which one it is describing, or it
     contradicts the unverified warning three lines above it. */
  const activation = s.verified
    ? <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>✉️</span><span>This unlocks login and emails the user <b>“you’re in — sign in”</b>. They sign in with the password they set at sign-up. (Their email is already verified.)</span></p>
    : <p className="flex gap-2 rounded-md bg-canvas/70 px-3 py-2 text-[11.5px] leading-relaxed text-muted"><span>✉️</span><span>Gán xong <b className="text-ink/75">chưa mở login</b> — người này chưa xác minh email. Khi họ bấm link xác minh, hệ thống tự mở login và gửi mail <b className="text-ink/75">“you’re in — sign in”</b>.</span></p>
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

          {/* The blockers live HERE, where the operator has committed to moving this
              person — not on the row, where they would fragment the table. Each one
              names the screen that fixes it and links to it. */}
          {mode === 'move' && !inCompanyList(s) && (
            <div className={cn('rounded-lg border px-3 py-2.5 text-[11.5px] leading-relaxed', s.freeDataMatch ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-line bg-canvas/60 text-muted')}>
              {s.freeDataMatch ? (
                <>
                  <p className="font-semibold">⚠ Công ty này đang ở Free data — chưa phải khách hàng</p>
                  <p className="mt-1">“<b>{s.freeDataMatch}</b>” mới là dòng danh bạ, chưa có MST và chưa có sales owner, nên chưa gán user vào được.</p>
                  <button onClick={() => { onClose(); onGoPool?.(s.freeDataMatch!) }} className="mt-1.5 rounded border border-amber-400 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 hover:border-amber-600">
                    Đưa công ty lên Company list →
                  </button>
                </>
              ) : (
                <>
                  <p className="font-semibold text-ink">Công ty “{s.company}” chưa có trong hệ thống</p>
                  <p className="mt-1">Admin tạo ở <b className="text-ink/75">Company list</b> (tên · MST · người liên hệ · sales owner), hoặc thêm vào <b className="text-ink/75">Free data</b> nếu chưa đủ thông tin.</p>
                  <button onClick={() => { onClose(); onGoCreate?.() }} className="mt-1.5 rounded border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-muted hover:border-brand hover:text-brand">
                    Tạo công ty trước →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Gate 1 is about LOGIN, not about placement: an unverified person can be
              placed, they simply cannot sign in until they click the link. Saying so
              here is what makes placing one safe rather than mysterious. */}
          {mode === 'move' && !s.verified && (
            <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
              Người này <b className="text-ink/75">chưa xác minh email</b>. Gán vào công ty vẫn được — nhưng <b className="text-ink/75">login chỉ mở khi họ bấm link xác minh</b>. Mail “you’re in” gửi sau khi cả hai điều kiện đủ.
            </p>
          )}

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
          {mode === 'move' && (
            <button
              disabled={!inCompanyList(s)}
              title={inCompanyList(s) ? undefined : 'Công ty chưa có trong Company list — tạo/đưa lên trước'}
              onClick={() => onConfirm('Resolved', `Moved to ${company} as ${role} · owner ${owner}${s.verified ? ' · sign-in email sent' : ' · chờ xác minh email'}`)}
              className={cn('rounded-lg px-4 py-2 text-[13px] font-semibold text-white', inCompanyList(s) ? 'bg-emerald-600 hover:opacity-90' : 'cursor-not-allowed bg-line')}
            >
              Move{s.verified ? ' + send sign-in' : ''}
            </button>
          )}
          {mode === 'archive' && <button onClick={() => onConfirm('Archived', `Archived${reason.trim() ? ` · ${reason.trim()}` : ''}`)} disabled={!reason.trim()} className="rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Archive sign-up</button>}
        </div>
      </div>
    </div>
  )
}

/* Row actions live behind a ⋯ menu. Fixed-positioned from the button rect so it
   never gets clipped by the table's horizontal-scroll container. */
function SignupRowMenu({ onMove, onArchive }: { onMove: () => void; onArchive: () => void }) {
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
            <button onClick={() => { setOpen(false); onArchive() }} className={cn(item, 'border-t border-line text-rose-600')}>Archive sign-up</button>
          </div>
        </>
      )}
    </>
  )
}

/** Is this sign-up's company already a CRM company? Only then can a user be moved
    in — everything else is "create the company first", by one of the two doors. */
const inCompanyList = (s: Signup) => {
  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/công ty|cong ty|tnhh|cp|cổ phần|co phan|\s+/g, '')
  return COMPANIES.some((c) => norm(c.name) === norm(s.company) || norm(c.legalName) === norm(s.company) || (Boolean(s.matchName) && norm(c.name) === norm(s.matchName!)))
}

export function AdminSignups() {
  const goTo = useContext(ScreenNavCtx)
  const [rows, setRows] = useState<Signup[]>(SIGNUPS)
  const [modal, setModal] = useState<{ mode: 'move' | 'archive'; s: Signup } | null>(null)
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
          inCompanyList(s)
            ? <Pill tone="active">Company list{s.matchName ? `: ${s.matchName}` : ''}</Pill>
            : s.freeDataMatch
              /* Not a CRM match — but the pool has it. The hint changes which action
                 is right: promote the pool row, do not create a duplicate of it. */
              ? <Pill tone="pending">Free data: {s.freeDataMatch.replace(/^Công ty (TNHH|CP|Cổ phần)\s*/i, '')}</Pill>
              : <Pill tone="neutral">Not match</Pill>,
          <div className="min-w-0">
            <Pill tone={SIGNUP_STATUS[s.status]}>{s.status}</Pill>
            {s.outcome && <p className="mt-0.5 truncate text-[10.5px] text-faint">{s.outcome}</p>}
          </div>,
          <span className="text-[11.5px] text-muted">{s.when}</span>,
          /* ONE affordance on every row: the ⋯ menu, always the same two options.
             Where the company is (and whether the email is verified) changes what
             happens INSIDE the modal, not whether the row can be clicked — a table
             whose rows offer four different controls makes the operator read each
             row before they can act on any of them. */
          s.status !== 'New'
            ? <span className="text-[11px] text-faint">—</span>
            : <div className="flex justify-end">
                <SignupRowMenu
                  onMove={() => setModal({ mode: 'move', s })}
                  onArchive={() => setModal({ mode: 'archive', s })}
                />
              </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Every row offers the <b>same two choices</b> — <b>Move to existing company</b> or <b>Archive</b> — this screen never creates a company. <b>Email verification gates LOGIN, not placement</b>: HQ can move a row before the person verifies, they simply cannot sign in until they click the link. A company that is still in <b>Free data</b>, or exists nowhere yet, surfaces inside the Move dialog itself with a link to the screen that fixes it (“Đưa công ty lên Company list →” / “Tạo công ty trước →”), and the Move button stays locked until the company is real. Move / Create unlock login and email the user “you’re in — sign in” once verification has happened (password already set).
      </p>
      {modal && <SignupActionModal mode={modal.mode} s={modal.s} onConfirm={resolve} onClose={() => setModal(null)} onGoPool={(co) => goTo('admin-company-directory', co)} onGoCreate={() => goTo('admin-company-list')} />}
    </div>
  )
}
