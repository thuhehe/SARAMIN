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

/* ── The assignment card: one decision PER REQUEST ────────────────────────────
   Each requester row carries its own note field and its own Duyệt / Từ chối —
   because the admin is answering each rep individually, and the note is the only
   channel that tells a refused rep what a better request would look like. The
   winner and each loser get different sentences, and each rep reads their own on
   the Yêu cầu nhận công ty log.

   Approving any ONE request still ends the whole contest — the company has one
   owner — so the rivals still pending at that moment are auto-rejected with a note
   naming the winner. Rejecting individually leaves the rest pending. */

type RowDecision = { status: 'approved' | 'rejected'; note: string }

function RequesterRow({ r, decided, note, onNote, onApprove, onReject }: {
  r: ClaimReq
  decided?: RowDecision
  note: string
  onNote: (v: string) => void
  onApprove: () => void
  onReject: () => void
}) {
  const thin = r.reason.trim().length < 20
  return (
    <div className={cn('rounded-lg border px-3 py-2.5', decided ? (decided.status === 'approved' ? 'border-emerald-300 bg-emerald-50/50' : 'border-line bg-canvas/50') : 'border-line bg-surface')}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[12.5px] font-semibold text-ink">{r.by}</span>
        <span className="font-mono text-[10.5px] text-faint">#{r.id}</span>
        <span className="text-[10.5px] tabular-nums text-faint">{r.when}</span>
        {decided && <Pill tone={decided.status === 'approved' ? 'active' : 'expired'}>{decided.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</Pill>}
      </div>
      {/* The three things being compared, in the order they decide it: the reason,
          the evidence, and whether this rep actually has a way in. */}
      <p className={cn('mt-1 text-[11.5px] leading-snug', thin ? 'text-amber-700' : 'text-muted')}>{r.reason}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px]">
        {r.link
          ? <span className="min-w-0 max-w-full truncate font-mono text-brand underline" title={r.link}>{r.link}</span>
          : r.file
            ? <span className="text-muted">📎 {r.file}</span>
            : <span className="font-medium text-amber-700">⚠ không có bằng chứng</span>}
        <span className="text-faint">· {r.person}</span>
        <span className="text-faint">· {r.phone}{r.email ? ` · ${r.email}` : ''}</span>
      </p>
      {decided ? (
        /* After deciding this row: the note the rep will read, verbatim. */
        decided.note
          ? <p className="mt-1.5 rounded-md bg-surface px-2 py-1.5 text-[11px] leading-relaxed text-muted">Note gửi {r.by}: “{decided.note}”</p>
          : <p className="mt-1.5 text-[10.5px] text-faint">Không kèm note.</p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* The note travels WITH the decision — one input, two buttons, so a note
              cannot be written and then attached to nothing. */}
          <input
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder={`Note cho ${r.by} — đọc được ở Yêu cầu nhận công ty (không bắt buộc)`}
            className="min-w-[220px] flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
          />
          <button onClick={onReject} className="rounded-md border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:border-rose-300 hover:text-rose-700">Từ chối</button>
          <button onClick={onApprove} className="rounded-md bg-brand px-3 py-1.5 text-[11.5px] font-semibold text-white hover:opacity-90">Duyệt →</button>
        </div>
      )}
    </div>
  )
}

export function AssignCard({ reqs }: { reqs: ClaimReq[] }) {
  const contest = reqs.length > 1
  const [decisions, setDecisions] = useState<Record<number, RowDecision>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})
  const winner = reqs.find((r) => decisions[r.id]?.status === 'approved')
  const allRejected = reqs.length > 0 && reqs.every((r) => decisions[r.id]?.status === 'rejected')

  const reject = (id: number) => setDecisions((d) => ({ ...d, [id]: { status: 'rejected', note: (notes[id] ?? '').trim() } }))
  /* One approval ends the contest: the rivals still pending get auto-rejected with
     a note naming the winner, so every rep reads a sentence and not a bare status. */
  const approve = (id: number) => {
    const win = reqs.find((r) => r.id === id)!
    setDecisions((d) => {
      const next = { ...d, [id]: { status: 'approved' as const, note: (notes[id] ?? '').trim() } }
      for (const r of reqs) if (r.id !== id && next[r.id]?.status !== 'rejected') {
        next[r.id] = { status: 'rejected', note: (notes[r.id] ?? '').trim() || `Đã phân công ty cho ${win.by}.` }
      }
      return next
    })
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-3.5 py-2.5">
        {/* The card only ever renders ON the company's own record, where the header
            already names the company — so the title says what the card IS. */}
        <p className="text-[13px] font-semibold text-ink">Yêu cầu nhận công ty</p>
        {/* The header reports the card's state. After a decision it is the receipt —
            the outcome is a fact worth keeping; the how-it-works prose that used to
            sit in a footer is not. */}
        {winner
          ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">Đã phân cho {winner.by} · công ty rời danh bạ</span>
          : allRejected
            ? <span className="rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-bold text-muted">Đã từ chối tất cả — công ty về Chưa nhận</span>
            : contest
              ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">{reqs.length} sales cùng xin — duyệt 1</span>
              : <span className="text-[10.5px] text-faint">1 sales xin</span>}
      </div>

      <div className="space-y-1.5 p-3">
        {reqs.map((r) => (
          <RequesterRow
            key={r.id}
            r={r}
            decided={decisions[r.id]}
            note={notes[r.id] ?? ''}
            onNote={(v) => setNotes((n) => ({ ...n, [r.id]: v }))}
            onApprove={() => approve(r.id)}
            onReject={() => reject(r.id)}
          />
        ))}
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
