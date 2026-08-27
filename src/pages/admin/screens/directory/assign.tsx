import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CLAIM_REQS, CLAIM_STATUS, myClaim } from '@/pages/admin/data/directory'
import { COMPANIES, coKey, coLabel } from '@/pages/admin/data/companies'
import { companyId } from '@/lib/companyId'
import { ME } from '@/pages/admin/data/salesOrg'
import { Pill } from '@/pages/admin/ui/status'
import type { ClaimReq } from '@/pages/admin/data/directory'

/* ── Phân công ty cho một sales ───────────────────────────────────────────────
   NOT its own screen. Admin works the Free-data list, filters Trạng thái = Đang
   chờ duyệt, opens the company, and assigns it there — because the decision is
   about THAT COMPANY, and the page that shows the company is where every fact
   needed to decide already is: the source, the contact the pool came with, the
   unverified MST, and now the reps who asked for it.

   A separate queue screen made the admin read the company in one place and decide
   in another, with the two never on screen together. */

/** the ONE open request on a company — pending (chờ Admin) or admin_ok (chờ Sales
    lead). One at a time by rule: a pending row locks Xin nhận for everyone else. */
export const openClaim = (co: string) => CLAIM_REQS.find((r) => r.co === co && (r.status === 'pending' || r.status === 'admin_ok'))

/* ── The MST gate ─────────────────────────────────────────────────────────────
   Runs at EVERY door a pool company enters the CRM through — lead approve, direct
   assign, sign-up promote — because this is the moment an untrusted pool row
   becomes a record that invoices read from.

   The MST lives in ONE place: the record itself (tab Overview), where the admin
   fills or corrects it. The assign/approve buttons READ that value and validate —
   they never carry their own input, or the same number gets asked for twice and
   the two copies drift. Empty blocks with a jump to Overview; a duplicate blocks
   naming the company that already holds the number. */
function mstCheck(tax: string): { state: 'empty' | 'dup' | 'ok'; dup?: (typeof COMPANIES)[number] } {
  const t = tax.trim()
  if (!t) return { state: 'empty' }
  const dup = COMPANIES.find((c) => c.tax === t)
  return dup ? { state: 'dup', dup } : { state: 'ok' }
}

function MstStatus({ tax, onFill }: { tax?: string; onFill?: () => void }) {
  const chk = mstCheck(tax ?? '')
  if (chk.state === 'ok') {
    return <p className="w-full text-[10.5px] text-emerald-700">✓ MST <span className="font-mono">{tax!.trim()}</span> (tab Overview) — không trùng với công ty nào trong Company list.</p>
  }
  if (chk.state === 'dup') {
    return (
      <p className="w-full rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-rose-900">
        ⚠ MST <span className="font-mono">{tax!.trim()}</span> trùng với <b>{coLabel(chk.dup!)}</b> ({companyId(coKey(chk.dup!))} · sales phụ trách <b>{chk.dup!.owner}</b>) — không tạo được hồ sơ mới.
        Nếu đúng là công ty này, dùng <b>Yêu cầu chuyển giao</b> trên hồ sơ đó; nếu là chi nhánh, tạo từ hồ sơ công ty mẹ. Sửa MST ở tab Overview.
      </p>
    )
  }
  return (
    <p className="flex w-full flex-wrap items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-900">
      <span>⚠ Công ty <b>chưa có MST</b> — cần MST trước khi tạo hồ sơ CRM.</span>
      {onFill && <button onClick={onFill} className="rounded border border-amber-400 bg-white px-1.5 py-0.5 font-semibold text-amber-800 hover:border-amber-600">Điền MST ở tab Overview →</button>}
    </p>
  )
}

/* ── The approval card: ONE request, TWO levels ───────────────────────────────
   Admin decides first; only a request Admin passed reaches the Sales lead. A
   rejection is terminal at either level. Each level writes its own note to the
   rep, read on the Yêu cầu nhận công ty log.

   The wireframe plays both roles on one card — each button carries its role tag
   (· Admin / · Sales lead), the same convention the invoice screen uses for
   Kế toán-only actions. */
type Stage =
  | { at: 'admin' } | { at: 'lead'; adminBy: string; adminAt: string }
  | { done: 'approved'; adminBy: string } | { done: 'rejected'; level: 'Admin' | 'Sales lead'; note: string }

export function AssignCard({ req, tax, onFillMst }: { req: ClaimReq; /** the record's own MST (tab Overview) — the single source the gate reads */ tax?: string; onFillMst?: () => void }) {
  const [stage, setStage] = useState<Stage>(
    req.status === 'admin_ok' ? { at: 'lead', adminBy: req.adminBy ?? 'Lê Minh Anh (admin)', adminAt: req.adminAt ?? '' } : { at: 'admin' },
  )
  const [note, setNote] = useState('')
  const thin = req.reason.trim().length < 20
  const roleTag = 'at' in stage ? (stage.at === 'admin' ? 'Admin' : 'Sales lead') : null
  /* The lead's Duyệt is the write that CREATES the company, so the MST gate sits on
     that button and nowhere earlier — Admin's level-1 pass creates nothing. */
  const needMst = 'at' in stage && stage.at === 'lead'
  const mstOk = !needMst || mstCheck(tax ?? '').state === 'ok'

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-3.5 py-2.5">
        <p className="text-[13px] font-semibold text-ink">Yêu cầu nhận công ty</p>
        {'done' in stage
          ? stage.done === 'approved'
            ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">Đã phân cho {req.by} · công ty rời danh bạ</span>
            : <span className="rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-bold text-muted">Từ chối bởi {stage.level} — công ty về Chưa nhận</span>
          : stage.at === 'admin'
            ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">Chờ duyệt lần 1 · Admin</span>
            : <span className="rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-bold text-muted">Chờ duyệt lần 2 · Sales lead</span>}
      </div>

      <div className="space-y-2 p-3">
        {/* The request being judged — reason, evidence, contact point. */}
        <div className="rounded-lg border border-line px-3 py-2.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[12.5px] font-semibold text-ink">{req.by}</span>
            <span className="font-mono text-[10.5px] text-faint">#{req.id}</span>
            <span className="text-[10.5px] tabular-nums text-faint">{req.when}</span>
          </div>
          <p className={cn('mt-1 text-[11.5px] leading-snug', thin ? 'text-amber-700' : 'text-muted')}>{req.reason}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px]">
            {req.link
              ? <span className="min-w-0 max-w-full truncate font-mono text-brand underline" title={req.link}>{req.link}</span>
              : req.file
                ? <span className="text-muted">📎 {req.file}</span>
                : <span className="font-medium text-amber-700">⚠ không có bằng chứng</span>}
            <span className="text-faint">· {req.person}</span>
            <span className="text-faint">· {req.phone}{req.email ? ` · ${req.email}` : ''}</span>
          </p>
          <p className="mt-1 truncate text-[10.5px] text-faint">{req.kind}</p>
        </div>

        {/* Level 1's pass, once it exists — the lead must see who let this through. */}
        {'at' in stage && stage.at === 'lead' && (
          <p className="rounded-md bg-canvas/70 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-muted">
            ✓ Admin đã duyệt{stage.adminAt && <> {stage.adminAt}</>} · {stage.adminBy} — chuyển lên Sales lead.
          </p>
        )}

        {'done' in stage ? (
          stage.done === 'approved' ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-3 text-[11.5px] leading-relaxed text-emerald-900">
              <p className="font-bold">✓ Sales lead đã duyệt — hồ sơ CRM được tạo</p>
              <p className="mt-0.5">{req.by} là sales phụ trách · <b>{req.person}</b> là người liên hệ đầu tiên · công ty rời khỏi danh bạ.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-canvas/70 p-3 text-[11.5px] leading-relaxed text-muted">
              <p className="font-bold text-ink">Đã từ chối ở bước {stage.level === 'Admin' ? '1 (Admin)' : '2 (Sales lead)'} — từ chối là chốt, không chuyển tiếp</p>
              <p className="mt-0.5">Công ty trở lại <b className="text-ink/80">Chưa nhận</b>, ai cũng xin lại được.{stage.note && <> Note gửi {req.by}: “{stage.note}”</>}</p>
            </div>
          )
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {needMst && <MstStatus tax={tax} onFill={onFillMst} />}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Note cho ${req.by} — đọc được ở Yêu cầu nhận công ty (không bắt buộc)`}
              className="min-w-[220px] flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <button
              onClick={() => setStage({ done: 'rejected', level: roleTag as 'Admin' | 'Sales lead', note: note.trim() })}
              className="rounded-md border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:border-rose-300 hover:text-rose-700"
            >
              Từ chối<span className="ml-1 font-normal opacity-80">· {roleTag}</span>
            </button>
            <button
              disabled={!mstOk}
              title={mstOk ? undefined : mstCheck(tax ?? '').state === 'dup' ? 'MST trùng với công ty đã có — không tạo được hồ sơ' : 'Điền MST ở tab Overview trước — hồ sơ CRM được tạo ở bước này'}
              onClick={() => stage.at === 'admin'
                ? setStage({ at: 'lead', adminBy: 'bạn (Admin)', adminAt: 'vừa xong' })
                : setStage({ done: 'approved', adminBy: stage.adminBy })}
              className={cn('rounded-md px-3 py-1.5 text-[11.5px] font-semibold text-white', mstOk ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-line')}
            >
              Duyệt<span className="ml-1 font-normal opacity-90">· {roleTag}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Phân trực tiếp — admin assigns without any approval ──────────────────────
   The admin can hand a company to a rep outright: no request, no level 2. It is
   the same write approval ends in, minus the queue — for the case where the
   assignment is a management decision, not a rep's claim. If a request is open,
   it is auto-rejected with a note naming who got the company. */
export function DirectAssignCard({ co, tax, onFillMst }: { co: string; tax?: string; onFillMst?: () => void }) {
  const reps = ['Nguyễn Thị Lan', 'Trần Quốc Trung', 'Phạm Quang Huy']
  const [rep, setRep] = useState('')
  const [done, setDone] = useState(false)
  const open = openClaim(co)
  const ok = Boolean(rep) && mstCheck(tax ?? '').state === 'ok'

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-3.5 text-[11.5px] leading-relaxed text-emerald-900">
        <p className="font-bold">✓ Đã phân trực tiếp cho {rep}</p>
        <p className="mt-0.5">Hồ sơ CRM được tạo với MST <b className="font-mono">{(tax ?? '').trim()}</b>, {rep} là sales phụ trách, công ty rời khỏi danh bạ.{open && <> Yêu cầu đang chờ của <b>{open.by}</b> tự động Từ chối kèm note “Admin đã phân trực tiếp cho {rep}”.</>}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-3.5 py-2.5">
        <p className="text-[13px] font-semibold text-ink">Phân trực tiếp <span className="font-normal text-muted">· Admin</span></p>
        <span className="text-[10.5px] text-faint">không cần duyệt</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 p-3">
        {/* Direct assign CREATES the company too, so it passes the same MST gate as
            an approval — a bypass of the queue is not a bypass of the dedup. */}
        <MstStatus tax={tax} onFill={onFillMst} />
        <select value={rep} onChange={(e) => setRep(e.target.value)} className="min-w-[200px] flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px] text-ink outline-none focus:border-brand">
          <option value="">— Chọn sales —</option>
          {reps.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          disabled={!ok}
          title={ok ? undefined : mstCheck(tax ?? '').state === 'dup' ? 'MST trùng với công ty đã có — không tạo được hồ sơ' : 'Cần MST (tab Overview) và một sales'}
          onClick={() => setDone(true)}
          className={cn('rounded-md px-3 py-1.5 text-[11.5px] font-semibold text-white', ok ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-line')}
        >
          Phân ngay →
        </button>
        {/* The one side effect worth flagging before the click, not after. */}
        {open && <p className="w-full text-[10.5px] leading-relaxed text-amber-700">Yêu cầu đang chờ của <b>{open.by}</b> (#{open.id}) sẽ tự động Từ chối kèm note nêu người được phân.</p>}
      </div>
    </div>
  )
}

/* ── Lịch sử yêu cầu nhận — every request on this company, newest first ───────
   Rendered inside the record's OWNER HISTORY tab, because that is what these are:
   ownership events from before there was an owner. Who asked, who was refused, who
   was assigned — the chain a tenure history continues from. Pending requests are
   included: an open request is part of the ownership story, not a separate fact.

   It is read at the moment of the NEXT decision — an approver looking at a fresh
   request needs to see, in the same glance, that this same rep was refused two
   weeks ago with the same evidence. The "đã từ chối N lần" marker points here. */
export function ClaimChain({ co, rows }: { co: string; /** override for a CUSTOMER record — its log is derived from the owner chain (companyClaimHistory), not read from the live queue */ rows?: ClaimReq[] }) {
  const all = (rows ?? CLAIM_REQS.filter((r) => r.co === co)).sort((a, b) => b.id - a.id)
  if (all.length === 0) return null
  /* A rejection means different things depending on how the contest ended: if
     another request on this company was APPROVED, the company did not return to
     the pool — it went to the winner. Saying "về lại Chưa nhận" there would be
     false, and this chain exists to be trusted. */
  const won = all.some((r) => r.status === 'approved')
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-baseline justify-between gap-2 border-b border-line px-3.5 py-2.5">
        <p className="text-[13px] font-semibold text-ink">Lịch sử yêu cầu nhận</p>
        <span className="text-[10.5px] text-faint">{all.length} yêu cầu</span>
      </div>
      <ol className="divide-y divide-line-soft">
        {all.map((r) => (
          <li key={r.id} className="flex items-start gap-2.5 px-3.5 py-2.5">
            <Pill tone={CLAIM_STATUS[r.status].tone}>{CLAIM_STATUS[r.status].vi}</Pill>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2 text-[11.5px]">
                <b className="text-ink">{r.by}</b>
                <span className="text-faint">gửi {r.when}</span>
              </span>
              {/* The request stays readable — a refusal with the reason and evidence
                  still attached is what stops the same weak request being approved on
                  the third attempt. */}
              <span className={cn('mt-0.5 block truncate text-[11px]', r.reason.trim().length < 20 ? 'text-amber-700' : 'text-muted')} title={r.reason}>{r.reason}</span>
              {/* The two-level trail, one line per level that has spoken. */}
              {r.status === 'pending' && <span className="mt-0.5 block text-[10.5px] text-faint">chờ duyệt lần 1 — Admin</span>}
              {r.status === 'admin_ok' && <span className="mt-0.5 block text-[10.5px] text-faint">✓ Admin duyệt {r.adminAt}{r.adminBy && ` · ${r.adminBy}`} — chờ duyệt lần 2 (Sales lead)</span>}
              {(r.status === 'approved' || r.status === 'rejected') && (
                <span className="mt-0.5 block text-[10.5px] text-faint">
                  {r.adminBy && r.rejectedLevel !== 'Admin' && <>✓ Admin duyệt {r.adminAt} · {r.adminBy} → </>}
                  {r.status === 'approved'
                    ? <>Sales lead duyệt {r.decidedAt}{r.decidedBy && ` · ${r.decidedBy}`} — {r.by} trở thành sales phụ trách</>
                    : <>Từ chối bởi <b className="text-ink/70">{r.rejectedLevel ?? 'Admin'}</b> {r.decidedAt}{r.decidedBy && ` · ${r.decidedBy}`}{won ? ' — công ty được phân cho sales khác' : ' — công ty về lại Chưa nhận'}</>}
                </span>
              )}
              {r.note && <span className="mt-0.5 block text-[10.5px] leading-snug text-muted">Note: “{r.note}”</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** The outcome of MY OWN request on this company, on the company's record.

    Approval needs no announcement — the company is in my book with my name on it.
    A rejection needs one: the row is back at Chưa nhận, which looks exactly like a
    company I never asked for, so without this the rep's only signal is silence. */
export function MyClaimNotice({ co }: { co: string }) {
  const r = myClaim(co, ME)
  if (!r) return null
  if (r.status === 'pending' || r.status === 'admin_ok') {
    return (
      <div className="rounded-xl border border-line bg-canvas/60 p-3 text-[11.5px] leading-relaxed text-muted">
        <b className="text-ink">Bạn đã xin công ty này</b> — yêu cầu <span className="font-mono">#{r.id}</span> gửi {r.when}, {r.status === 'admin_ok' ? 'Admin đã duyệt — chờ duyệt lần 2 (Sales lead)' : 'chờ duyệt lần 1 (Admin)'}.
      </div>
    )
  }
  if (r.status === 'rejected') {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-[11.5px] leading-relaxed text-rose-900">
        <b>Yêu cầu của bạn đã bị từ chối</b> — <span className="font-mono">#{r.id}</span>, gửi {r.when}.
        <span className="mt-0.5 block text-rose-800/85">Công ty đã trở lại <b>Chưa nhận</b>, nên bạn xin lại được — nhưng hãy bổ sung lý do và bằng chứng rõ hơn, vì admin không kèm lý do khi từ chối.</span>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-[11.5px] leading-relaxed text-emerald-900">
      <b>Yêu cầu của bạn đã được duyệt</b> — <span className="font-mono">#{r.id}</span>. Công ty đã có hồ sơ trong CRM và bạn là sales phụ trách.
    </div>
  )
}
