import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { CLAIM_REQS, CLAIM_STATUS } from '@/pages/admin/data/directory'
import type { ClaimReq } from '@/pages/admin/data/directory'
import { ME } from '@/pages/admin/data/salesOrg'
import { AssignCard } from '@/pages/admin/screens/directory/assign'
import { FilterBar, FilterRow, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* ── Yêu cầu nhận công ty — one page, two views, two jobs ─────────────────────
   The page serves two different readers, and each gets the axis their question
   lives on:

     CHỜ DUYỆT      admin's decision queue, grouped BY COMPANY. The decision is
                    never "approve request #23941" — it is "which of these reps
                    gets this company", and that requires the rivals side by side.
                    A flat request table scatters them the moment anything else
                    arrives, which is why deciding row-by-row felt impossible.

     TẤT CẢ YÊU CẦU request-level tracking, default CỦA TÔI. This is where a rep
                    learns what happened — a rejection is otherwise silent (the
                    pool row just returns to Chưa nhận). It carries NO action
                    buttons: one place to decide, or two places disagree.

   The same AssignCard also renders on the company's Free-data record — the same
   component, so the queue and the record can never offer different decisions. */

export function AdminClaimRequests() {
  const goTo = useContext(ScreenNavCtx)
  const pending = CLAIM_REQS.filter((r) => r.status === 'pending')
  /* one group per company, requests inside oldest first — the timestamp is the
     tie-break of last resort, so it has to be readable in order */
  const groups: { co: string; reqs: ClaimReq[] }[] = []
  for (const r of pending) {
    const g = groups.find((x) => x.co === r.co)
    if (g) g.reqs.push(r)
    else groups.push({ co: r.co, reqs: [r] })
  }

  /* Oldest waiting first — the queue's sort is the fairness rule. */
  groups.sort((a, b) => a.reqs[0].id - b.reqs[0].id)
  const [view, setView] = useState<'queue' | 'all'>('queue')
  /* One company open at a time: the comparison is only ever read for the company
     being decided, and two open comparisons is how rows get mixed up. */
  const [open, setOpen] = useState<string | null>(null)
  const [mine, setMine] = useState(true)
  const [fStatus, setFStatus] = useState('')
  const base = mine ? CLAIM_REQS.filter((r) => r.by === ME) : CLAIM_REQS
  const rows = base.filter((r) => !fStatus || CLAIM_STATUS[r.status].vi === fStatus)

  return (
    <div>
      {/* The two views are the two jobs, so the switch names the job — not "tab 1 /
          tab 2". The queue badge counts COMPANIES, because that is how many
          decisions are waiting, not how many rows. */}
      <div className="mb-3 inline-flex overflow-hidden rounded-lg border border-line text-[12px] font-medium">
        <button onClick={() => setView('queue')} className={cn('px-3 py-1.5', view === 'queue' ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}>
          Chờ duyệt {groups.length > 0 && <span className={cn('ml-1 rounded-full px-1.5 text-[10.5px] font-bold', view === 'queue' ? 'bg-white/20' : 'bg-amber-100 text-amber-800')}>{groups.length} công ty</span>}
        </button>
        <button onClick={() => setView('all')} className={cn('border-l border-line px-3 py-1.5', view === 'all' ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}>
          Tất cả yêu cầu <span className="ml-1 text-[10.5px] opacity-70">{CLAIM_REQS.length}</span>
        </button>
      </div>

      {/* ── ADMIN: the decision queue — one LINE per company, expand to decide ──
          At real load (~20 companies waiting) a grid of full cards is a wall: every
          requester of every company rendered at once, when the admin only ever
          decides one company at a time. So the queue is a triage list — company,
          how many asked, how good the evidence looks, how long it has waited — and
          the full side-by-side comparison opens on the row that is being decided. */}
      {view === 'queue' && (
        <div>
          {groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">Không có yêu cầu nào đang chờ duyệt.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="grid grid-cols-[1.9fr_0.8fr_1fr_0.8fr_24px] gap-2 border-b border-line bg-canvas/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-faint">
                <span>Công ty</span><span>Sales xin</span><span>Bằng chứng</span><span>Chờ từ</span><span />
              </div>
              {groups.map((g) => {
                const isOpen = open === g.co
                const links = g.reqs.filter((r) => r.link).length
                const files = g.reqs.filter((r) => !r.link && r.file).length
                const none = g.reqs.length - links - files
                return (
                  <div key={g.co} className={cn('border-b border-line-soft last:border-b-0', isOpen && 'bg-canvas/30')}>
                    <button onClick={() => setOpen(isOpen ? null : g.co)} className="grid w-full grid-cols-[1.9fr_0.8fr_1fr_0.8fr_24px] items-center gap-2 px-3 py-2 text-left hover:bg-canvas/50">
                      <span className="min-w-0 truncate text-[12.5px] font-medium text-ink">{g.co}</span>
                      {/* A contest is the hard decision, so it is the loud cell. */}
                      {g.reqs.length > 1
                        ? <span className="justify-self-start rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">{g.reqs.length} — chọn 1</span>
                        : <span className="text-[11.5px] text-muted">1</span>}
                      {/* Evidence at a glance: what can be OPENED vs what must be
                          believed vs nothing at all — enough to pick which rows are
                          quick and which need the comparison. */}
                      <span className="flex items-center gap-2 text-[10.5px]">
                        {links > 0 && <span className="text-brand">{links} link</span>}
                        {files > 0 && <span className="text-muted">{files} 📎</span>}
                        {none > 0 && <span className="font-medium text-amber-700">{none} ⚠</span>}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted">{g.reqs[0].when.slice(0, 5)}</span>
                      <span className="text-[11px] text-faint">{isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-line-soft px-3 pb-3 pt-2.5">
                        <AssignCard co={g.co} reqs={g.reqs} />
                        <button onClick={() => goTo('admin-company-directory', g.co)} className="mt-1.5 text-[10.5px] font-medium text-brand hover:underline">
                          Mở hồ sơ trong Free data →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            Một dòng = một công ty, sắp theo <b className="text-muted">chờ lâu nhất trước</b>. Bấm dòng để mở phần so sánh và phân công — cùng một thẻ với hồ sơ công ty bên Free data.
          </p>
        </div>
      )}

      {/* ── SALES: request-level tracking, no actions ────────────────────────── */}
      {view === 'all' && (
        <div>
          <ListPage
            leading={
              <span className="inline-flex shrink-0 overflow-hidden rounded-md border border-line text-[11px] font-medium">
                <button onClick={() => setMine(true)} className={cn('px-2.5 py-1', mine ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}>Của tôi</button>
                <button onClick={() => setMine(false)} className={cn('border-l border-line px-2.5 py-1', !mine ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}>Tất cả</button>
              </span>
            }
            minW={1560}
            total={base.length}
            searchHint="Tìm công ty, sales, người liên hệ…"
            searchExtra={rows.map((r) => [r.link ?? '', r.file ?? ''].join(' '))}
            filters={
              <FilterBar count={fStatus ? 1 : 0} onClear={() => setFStatus('')}>
                <FilterRow label="Trạng thái" value={fStatus} onChange={setFStatus} options={Object.values(CLAIM_STATUS).map((x) => x.vi)} />
              </FilterBar>
            }
            cols={[
              { label: 'Công ty (danh bạ)', w: '1.7fr' },
              { label: 'Sales xin', w: '1fr' },
              { label: 'Ngày tạo yêu cầu', w: '0.95fr' },
              { label: 'Lý do tạo yêu cầu', w: '1.9fr' },
              { label: 'Phân loại khách hàng', w: '1.3fr' },
              { label: 'Trạng thái', w: '1.1fr' },
            ]}
            rows={rows.map((r) => [
              /* The company name links to its record — the next question after
                 "what happened" is always "which company again?". */
              <span className="min-w-0">
                <button onClick={() => goTo('admin-company-directory', r.co)} className="block max-w-full truncate text-left font-medium text-brand hover:underline">{r.co}</button>
                <span className="block truncate text-[10.5px] text-faint">{r.person} · {r.phone}</span>
              </span>,
              <span className="truncate">{r.by}{r.by === ME && <span className="text-brand"> (bạn)</span>}</span>,
              <span className="truncate tabular-nums text-[11.5px] text-muted">{r.when}</span>,
              <span className="min-w-0">
                <span className={cn('block text-[11.5px] leading-snug', r.reason.trim().length < 20 ? 'text-amber-700' : 'text-muted')} title={r.reason}>{r.reason}</span>
                {r.link
                  ? <span className="mt-0.5 block truncate font-mono text-[10.5px] text-brand underline" title={r.link}>{r.link}</span>
                  : r.file
                    ? <span className="mt-0.5 block truncate text-[10.5px] text-muted">📎 {r.file}</span>
                    : <span className="mt-0.5 block text-[10.5px] font-medium text-amber-700">⚠ không có bằng chứng</span>}
              </span>,
              <span className="min-w-0 truncate text-[11.5px] text-muted" title={r.kind}>{r.kind}</span>,
              /* The outcome plus what it MEANS — a pill alone does not say what to
                 do next, and a decided row names who decided and when. */
              <span className="flex min-w-0 flex-col gap-0.5">
                <Pill tone={CLAIM_STATUS[r.status].tone}>{CLAIM_STATUS[r.status].vi}</Pill>
                {r.status === 'rejected' && <span className="text-[10px] leading-snug text-faint">công ty về lại Chưa nhận — xin lại được</span>}
                {r.status === 'approved' && <span className="text-[10px] leading-snug text-faint">đã có hồ sơ trong CRM</span>}
                {r.status === 'pending' && (r.reqs ?? 1) > 1 && <span className="text-[10px] leading-snug text-amber-700">{r.reqs} sales cùng xin</span>}
                {r.decidedAt && <span className="text-[10px] leading-snug text-faint">{r.decidedAt}{r.decidedBy && ` · ${r.decidedBy}`}</span>}
              </span>,
            ])}
          />
          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            Bảng này để <b className="text-muted">theo dõi</b>, không có nút duyệt — duyệt/từ chối làm ở view <b className="text-muted">Chờ duyệt</b>, nơi các sales cùng xin một công ty đứng cạnh nhau.
            Với sales, mở <b className="text-muted">Của tôi</b> là biết yêu cầu của mình ra sao — vì khi bị từ chối, dòng trong danh bạ chỉ âm thầm quay về Chưa nhận, trông y như công ty mình chưa từng xin.
          </p>
        </div>
      )}
    </div>
  )
}
