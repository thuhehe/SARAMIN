import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CLAIM_REQS, CLAIM_STATUS, myClaim } from '@/pages/admin/data/directory'
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

/** every pending request on one company, oldest first — the timestamp is the
    tie-break of last resort, so it has to be readable in order */
export const pendingClaims = (co: string) => CLAIM_REQS.filter((r) => r.co === co && r.status === 'pending')

function Requester({ r, chosen, onPick }: { r: ClaimReq; chosen: boolean; onPick: () => void }) {
  const thin = r.reason.trim().length < 20
  return (
    <button
      onClick={onPick}
      className={cn('flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left', chosen ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand/40')}
    >
      <span className={cn('mt-[3px] grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2', chosen ? 'border-brand' : 'border-line')}>
        {chosen && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn('text-[12.5px] font-semibold', chosen ? 'text-brand' : 'text-ink')}>{r.by}</span>
          <span className="font-mono text-[10.5px] text-faint">#{r.id}</span>
          <span className="text-[10.5px] tabular-nums text-faint">{r.when}</span>
        </span>
        {/* The three things being compared, in the order they decide it: the reason,
            the evidence, and whether this rep actually has a way in. */}
        <span className={cn('mt-1 block text-[11.5px] leading-snug', thin ? 'text-amber-700' : 'text-muted')}>{r.reason}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px]">
          {r.link
            ? <span className="min-w-0 max-w-full truncate font-mono text-brand underline" title={r.link}>{r.link}</span>
            : r.file
              ? <span className="text-muted">📎 {r.file}</span>
              : <span className="font-medium text-amber-700">⚠ không có bằng chứng</span>}
          <span className="text-faint">· {r.person}</span>
          <span className="text-faint">· {r.phone}{r.email ? ` · ${r.email}` : ''}</span>
        </span>
        <span className="mt-1 block truncate text-[10.5px] text-faint">{r.kind}</span>
      </span>
    </button>
  )
}

export function AssignCard({ co, reqs }: { co: string; reqs: ClaimReq[] }) {
  const [pick, setPick] = useState<number | null>(reqs.length === 1 ? reqs[0].id : null)
  const chosen = reqs.find((r) => r.id === pick)
  const contest = reqs.length > 1
  /* The card has three states, and the mockup plays all of them: deciding →
     approved / rejected. The AFTER states exist because clicking a button that
     rewrites three records and closes a page must show what it did — silence after
     an action that big reads as "did that work?". */
  const [done, setDone] = useState<null | { kind: 'approved'; rep: ClaimReq } | { kind: 'rejected' }>(null)

  /* ── after: approved ── The company is no longer pool data, so this panel is the
     last thing this page shows — a receipt, then the pointer to where the work
     continues (the new CRM record, owned by the chosen rep). */
  if (done?.kind === 'approved') {
    const rep = done.rep
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4">
        <p className="text-[13px] font-bold text-emerald-900">✓ Đã phân công ty cho {rep.by}</p>
        <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-emerald-900/90">
          <li>· Hồ sơ CRM đã được tạo — <b>{rep.by}</b> là sales phụ trách.</li>
          <li>· <b>{rep.person}</b> ({rep.phone}{rep.email ? ` · ${rep.email}` : ''}) là người liên hệ đầu tiên.</li>
          <li>· Công ty <b>rời khỏi danh bạ</b> — không còn xin được nữa.</li>
          {contest && <li>· {reqs.length - 1} yêu cầu còn lại chuyển sang <b>Từ chối</b> ({reqs.filter((r) => r.id !== rep.id).map((r) => r.by).join(', ')}).</li>}
        </ul>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Mở hồ sơ CRM →</button>
          <span className="text-[10.5px] text-emerald-900/70">Ghi vào audit log và Yêu cầu nhận công ty kèm tên bạn và thời điểm.</span>
        </div>
      </div>
    )
  }

  /* ── after: rejected ── The company survives this, so the panel says what is now
     true of it — back in the pool, claimable by anyone — and where the refusals
     went (Lịch sử duyệt, right below). */
  if (done?.kind === 'rejected') {
    return (
      <div className="rounded-xl border border-line bg-canvas/70 p-4">
        <p className="text-[13px] font-bold text-ink">Đã từ chối {reqs.length > 1 ? `cả ${reqs.length} yêu cầu` : 'yêu cầu'}</p>
        <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-muted">
          <li>· Công ty trở lại <b className="text-ink/80">Chưa nhận</b> — ai cũng xin lại được, kể cả {reqs.length > 1 ? 'những người' : 'người'} vừa bị từ chối.</li>
          <li>· {reqs.length > 1 ? 'Các yêu cầu' : 'Yêu cầu'} chuyển vào <b className="text-ink/80">Lịch sử duyệt</b> bên dưới, kèm tên bạn và thời điểm.</li>
          <li>· Dòng trong danh bạ hiện thêm <b className="text-ink/80">“đã từ chối {reqs.length} lần”</b> để lần duyệt sau nhìn thấy.</li>
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-3.5 py-2.5">
        <p className="text-[13px] font-semibold text-ink">{co}</p>
        {contest
          ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">{reqs.length} sales cùng xin — chọn 1</span>
          : <span className="text-[10.5px] text-faint">1 sales xin</span>}
      </div>

      <div className="space-y-1.5 p-3">
        {reqs.map((r) => <Requester key={r.id} r={r} chosen={pick === r.id} onPick={() => setPick(r.id)} />)}
      </div>

      {/* Two actions and nothing else. No reason field: a rejection here does not
          need justifying — it returns the company to the pool for anyone to ask
          again, so nothing is taken away from the rep that a sentence would soften. */}
      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-canvas/40 px-3.5 py-3">
        <button
          disabled={!chosen}
          title={chosen ? undefined : 'Chọn một sales ở trên trước'}
          onClick={() => chosen && setDone({ kind: 'approved', rep: chosen })}
          className={cn('rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white', chosen ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-line')}
        >
          {chosen ? `Phân công ty cho ${chosen.by} →` : 'Chọn 1 sales để phân công'}
        </button>
        <button onClick={() => setDone({ kind: 'rejected' })} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-rose-300 hover:text-rose-700">
          Từ chối {contest ? 'tất cả' : ''}
        </button>
        {/* The consequence of each action, where the action is. */}
        <span className="w-full text-[10.5px] leading-relaxed text-faint">
          {chosen
            ? <>Tạo hồ sơ CRM, gán <b className="text-muted">{chosen.by}</b> làm sales phụ trách, ghi <b className="text-muted">{chosen.person}</b> làm người liên hệ đầu tiên, và đưa công ty ra khỏi danh bạ.{contest && <> {reqs.length - 1} yêu cầu còn lại tự động chuyển sang <b className="text-muted">Từ chối</b>.</>}</>
            : <>Chọn 1 sales ở trên để phân công ty. <b className="text-muted">Từ chối</b> thì công ty <b className="text-muted">quay lại “Chưa nhận”</b> — ai cũng xin lại được, kể cả người vừa bị từ chối.</>}
        </span>
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
export function ClaimChain({ co }: { co: string }) {
  const all = CLAIM_REQS.filter((r) => r.co === co).sort((a, b) => b.id - a.id)
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
              {r.status === 'pending'
                ? <span className="mt-0.5 block text-[10.5px] text-faint">đang chờ admin duyệt</span>
                : r.decidedAt && (
                  <span className="mt-0.5 block text-[10.5px] text-faint">
                    {r.status === 'approved' ? 'Duyệt' : 'Từ chối'} {r.decidedAt}{r.decidedBy && <> · bởi {r.decidedBy}</>}
                    {r.status === 'rejected' && (won ? <> — công ty được phân cho sales khác</> : <> — công ty về lại Chưa nhận</>)}
                    {r.status === 'approved' && <> — {r.by} trở thành sales phụ trách</>}
                  </span>
                )}
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
  if (r.status === 'pending') {
    return (
      <div className="rounded-xl border border-line bg-canvas/60 p-3 text-[11.5px] leading-relaxed text-muted">
        <b className="text-ink">Bạn đã xin công ty này</b> — yêu cầu <span className="font-mono">#{r.id}</span> gửi {r.when}, đang chờ admin duyệt.
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
