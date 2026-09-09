import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useContext } from 'react'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { COMPANIES } from '@/pages/admin/data/companies'
import { verifyGaps } from '@/pages/admin/data/companyOwner'
import { CO_ROLE_DEFS } from '@/pages/admin/data/companyRecord'
import type { CoUserRole } from '@/pages/admin/data/companyRecord'
import { SIGNUPS, SIGNUP_STATUS, signupMatches } from '@/pages/admin/data/signups'
import type { Signup, SignupMatch, SignupStatus } from '@/pages/admin/data/signups'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* The three sign-up actions, each with its own confirm flow. Move / Create both end by
   emailing the user a set-password / activation link; Archive discards the request. */
function SignupActionModal({ mode, s, onConfirm, onClose, onGoRecord }: { mode: 'move' | 'archive'; s: Signup; onConfirm: (status: SignupStatus, outcome: string) => void; onClose: () => void; onGoRecord?: (co: string) => void }) {
  const targets = Array.from(new Set(COMPANIES.map((c) => (c.shortName?.trim() || c.name))))
  /* The candidates the Match column showed, in the same order — the dropdown must
     open on what the operator was already looking at, and must not silently prefer
     one when the column offered several. */
  const cands = signupMatches(s).filter((m) => m.where === 'crm')
  const whyOf = (n: string) => cands.find((m) => m.name === n)?.why.join(' + ')
  const [company, setCompany] = useState(cands[0]?.name ?? targets[0] ?? '')
  const [role, setRole] = useState<CoUserRole>('Recruiter')
  const [reason, setReason] = useState('')
  const title = mode === 'move' ? `Move ${s.person} to a company` : 'Archive this sign-up?'
  /* ONE note, no branch — and it no longer mentions login. Since the verification
     flow (09/2026) the person is ALREADY signed in: the email link was the only gate,
     and their sign-up created an Unverified company they are working in right now.
     Move is therefore a DEDUP act: re-attach their login to the company that already
     exists, and archive the duplicate their sign-up created. */
  const activation = <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>🔗</span><span>The person is <b>already signed in</b> — their sign-up created <b>{s.company}</b> as an Unverified company. Move re-attaches their login to the company you pick and <b>archives that duplicate</b>; their data stays. They get an email saying which company they now belong to. <b>Do it now</b> if the match is right — this never waits for the ERC or for verification; resolving a duplicate and verifying a company are two independent jobs.</span></p>
  /* NO Sales-owner field (client: remove). A sign-up is only ever moved into a
     company that already exists on the Customers list, and the promotion gate
     guarantees every such record HAS an owner — asking again here invited the
     operator to change it in passing, from a dialog about a person, not the
     account. Ownership changes have one home: Chuyển giao on the company record. */
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

          {/* The two "no existing customer matches" outcomes live HERE, where the
              operator has committed to acting on this person. Neither is a blocker
              any more: the sign-up already created the company, so there is nothing
              to promote or create first. One is a MERGE (the pool row is absorbed into
              the shell — never the other way, a pool row cannot hold a login); the
              other is "leave it, verify it on the record". */}
          {mode === 'move' && !inCompanyList(s) && (
            <div className={cn('rounded-lg border px-3 py-2.5 text-[11.5px] leading-relaxed', s.freeDataMatch ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-line bg-canvas/60 text-muted')}>
              {s.freeDataMatch ? (
                <>
                  <p className="font-semibold">Công ty này đã có một dòng ở Free data</p>
                  <p className="mt-1">“<b>{s.freeDataMatch}</b>” là dòng danh bạ — không có login. Công ty mà sign-up vừa tạo mới là bản ghi đầy đủ hơn, nên <b>gộp dòng Free data vào đó</b>: dòng rời Free data, SĐT / địa chỉ / ngành / nguồn đổ vào các ô còn trống, yêu cầu Xin nhận đang mở (nếu có) thành ứng viên sales owner khi Verify.</p>
                  <button onClick={() => onConfirm('Resolved', `Gộp dòng Free data “${s.freeDataMatch}” vào ${s.company}`)} className="mt-1.5 rounded border border-amber-400 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 hover:border-amber-600">
                    Gộp dòng Free data vào công ty này
                  </button>
                </>
              ) : (
                <>
                  <p className="font-semibold text-ink">Không trùng công ty nào — “{s.company}” là công ty mới</p>
                  <p className="mt-1">Sign-up đã tạo hồ sơ này trên Customers (Chưa xác minh, chưa có owner). Không có gì để Move; việc còn lại là <b className="text-ink/75">xác minh</b> ở Company detail — nút Verify chỉ mở khi hồ sơ đủ <b className="text-ink/75">MST · địa chỉ đăng ký MST · ERC</b>. Dòng này tự Resolved khi công ty được Verify.</p>
                  {/* Whether the trip to Company detail is worth making right now — read
                      off the shell the sign-up created, by the same function the
                      Customers filter and the Verify button use. */}
                  {(() => {
                    const shell = COMPANIES.find((c) => c.name === s.company || c.shortName === s.company)
                    if (!shell) return null
                    const gaps = verifyGaps(shell)
                    return gaps.length === 0
                      ? <p className="mt-1 font-medium text-emerald-700">Hồ sơ đã đủ — verify được ngay.</p>
                      : <p className="mt-1 text-amber-800">Hồ sơ còn thiếu: <b>{gaps.join(' · ')}</b> — employer bổ sung ở Company information; chưa cần mở Company detail.</p>
                  })()}
                  <button onClick={() => { onClose(); onGoRecord?.(s.company) }} className="mt-1.5 rounded border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-muted hover:border-brand hover:text-brand">
                    Mở Company detail →
                  </button>
                </>
              )}
            </div>
          )}

          {/* REMOVED 2026-08-23: the “chưa xác minh email” warning. Verification is
              now a precondition for the row existing at all, so the case it warned
              about cannot reach this dialog. */}

          {mode === 'move' && (
            <>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Move into company <span className="text-rose-500">*</span></p>
                <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {/* Matched companies first, labelled with WHY, then the rest of the
                      book. A flat alphabetical list buries the two records this
                      sign-up actually resembles somewhere in the middle. */}
                  {cands.length > 0 && (
                    <optgroup label={`Khớp với sign-up này (${cands.length})`}>
                      {cands.map((m) => <option key={m.name} value={m.name}>{m.name} — khớp {m.why.join(' + ')}</option>)}
                    </optgroup>
                  )}
                  <optgroup label="Tất cả công ty">
                    {targets.filter((n) => !cands.some((m) => m.name === n)).map((n) => <option key={n} value={n}>{n}</option>)}
                  </optgroup>
                </select>
                {cands.length > 1 && (
                  <p className="mt-1 text-[10.5px] leading-relaxed text-amber-800">
                    ⚠ <b>{cands.length} công ty</b> cùng khớp — thường là công ty mẹ và chi nhánh dùng chung đuôi email. Chọn đúng pháp nhân người này thuộc về; gán nhầm thì user thấy sai tin tuyển dụng và sai quota.
                  </p>
                )}
                {whyOf(company) && <p className="mt-1 text-[10.5px] text-faint">Đang chọn <b className="text-ink/70">{company}</b> — khớp {whyOf(company)}.</p>}
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Role in that company <span className="text-rose-500">*</span></p>
                <select value={role} onChange={(e) => setRole(e.target.value as CoUserRole)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {CO_ROLE_DEFS.map((r) => <option key={r.name} value={r.name}>{r.name}{r.admin ? ' (account owner)' : ''}</option>)}
                </select>
              </div>
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
              title={inCompanyList(s) ? undefined : 'Công ty chưa có trong Customers — tạo/đưa lên trước'}
              onClick={() => onConfirm('Resolved', `Moved to ${company} as ${role} · sign-in email sent`)}
              className={cn('rounded-lg px-4 py-2 text-[13px] font-semibold text-white', inCompanyList(s) ? 'bg-emerald-600 hover:opacity-90' : 'cursor-not-allowed bg-line')}
            >
              Move + send sign-in
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
    in — everything else is "create the company first", by one of the two doors.
    Reads the SAME match list the column renders: a gate computed separately from
    what the operator was shown is a gate that eventually disagrees with it. */
const crmMatches = (s: Signup) => signupMatches(s).filter((m) => m.where === 'crm')
const inCompanyList = (s: Signup) => crmMatches(s).length > 0

/** The Match cell: every candidate, each a link to the record it names.
    A single pill could only ever name one company, and one email domain routinely
    belongs to several of ours — a parent and its branches. Hiding the rest is how
    a user gets attached to the wrong one of two records that look alike. */
function MatchCell({ s, onOpen }: { s: Signup; onOpen: (m: SignupMatch) => void }) {
  const ms = signupMatches(s)
  if (ms.length === 0) return <Pill tone="neutral">Not match</Pill>
  return (
    <div className="min-w-0 space-y-0.5">
      {ms.map((m) => (
        <button
          key={m.where + m.name}
          onClick={() => onOpen(m)}
          title={`Mở ${m.name} — khớp ${m.why.join(' + ')}`}
          className="flex w-full min-w-0 items-center gap-1 text-left"
        >
          {/* THE SOURCE, spelled out — “CRM” and “Bể” were internal shorthand for
              the two lists the operator is about to act on, and the whole decision
              turns on which one it is: a Customers hit can be Moved into right
              now, a Free data hit cannot until someone promotes it. */}
          <span className={cn('shrink-0 rounded px-1 py-px text-[9px] font-semibold',
            m.where === 'crm' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
            {m.where === 'crm' ? 'Customers' : 'Free data'}
          </span>
          {/* The match REASON (“tên+đuôi email”) was removed: it explained how the
              matcher found the row, which is our machinery, not the operator's
              question. They open the company and look. The reason survives in the
              hover title for the rare ambiguous case. */}
          <span className="min-w-0 flex-1 truncate text-[11.5px] text-brand hover:underline">{m.name}</span>
        </button>
      ))}
    </div>
  )
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
          { label: 'Full name', w: '1fr' }, { label: 'Email', w: '1.1fr' }, { label: 'Phone', w: '0.8fr' },
          { label: 'Tax number', w: '0.8fr' }, { label: 'Company name', w: '1fr' }, { label: 'Hiring', w: '0.5fr' },
          /* Match is the widest column on purpose (client: the company name was
             truncating): it is the one cell whose content the operator actually
             reads before acting, and it carries a source chip + the full name. */
          /* NO “Email verified” column (2026-08-23): every row in this list has
             already verified, so the cell read the same value on all of them. */
          { label: 'Match', w: '2.2fr' }, { label: 'Status', w: '1fr' }, { label: 'When', w: '0.6fr' },
          { label: 'Action', w: '1.3fr', align: 'r' },
        ]}
        rows={rows.map((s) => [
          <span className="truncate text-[12.5px] font-medium text-ink">{s.person}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{s.email}</span>,
          <span className="truncate text-[11.5px] text-muted">{s.phone}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{s.tax}</span>,
          <span className="truncate text-[12px] text-ink/80">{s.company}</span>,
          <Pill tone={s.hiring ? 'active' : 'neutral'}>{s.hiring ? 'Yes' : 'No'}</Pill>,
          <MatchCell s={s} onOpen={(m) => goTo(m.where === 'crm' ? 'admin-company-list' : 'admin-company-directory', m.name)} />,
          <div className="min-w-0">
            <Pill tone={SIGNUP_STATUS[s.status]}>{s.status}</Pill>
            {s.outcome && <p className="mt-0.5 truncate text-[10.5px] text-faint">{s.outcome}</p>}
          </div>,
          <span className="text-[11.5px] text-muted">{s.when}</span>,
          /* ONE affordance on every row: the ⋯ menu, always the same two options.
             Where the company is changes what happens INSIDE the modal, not
             whether the row can be clicked — a table
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
        <b>A row appears the moment the email is verified — and by then the person is already signed in.</b> Their sign-up created a company on Customers with Verified = <b>Unverified</b> and no sales owner; login was never gated here. So this screen is now about one question: <b>is this a company we already have?</b> The <b>Match</b> column lists candidates found by name, email domain or MST. If one is right → <b>Move to existing company</b> (re-attach the login, archive the duplicate). If it is spam → <b>Archive</b> (deactivates the login and archives the shell company). If it is genuinely new → nothing to do here: the row <b>resolves itself when an admin verifies the company</b> from Company detail. A candidate still in <b>Free data</b> is <b>merged into the new company</b> from inside the dialog — the pool row is absorbed, never promoted separately, or one company would have three records.
      </p>
      {modal && <SignupActionModal mode={modal.mode} s={modal.s} onConfirm={resolve} onClose={() => setModal(null)} onGoRecord={(co) => goTo('admin-company-list', co)} />}
    </div>
  )
}
