import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { CLAIM_REQS, CLAIM_STATUS } from '@/pages/admin/data/directory'
import { ME } from '@/pages/admin/data/salesOrg'
import { FilterBar, FilterRow, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* ── Yêu cầu nhận công ty — the LOG, and only the log ─────────────────────────
   One append-only row per request: who asked, why, with what evidence, and what
   was decided (by whom, when). Nothing here approves or rejects — the admin
   decides on the company's record in Free data, where every rep who asked for the
   same company is read side by side. A second decision surface is a second place
   for the two to disagree.

   Why the log is a screen at all: a REJECTION is otherwise silent. The pool row
   just returns to Chưa nhận, which looks exactly like a company the rep never
   asked for — so until a notification exists, this page (default CỦA TÔI) is how
   a rep learns what happened. The approved row doubles as the record of WHO WON:
   its sales became the company's owner. */

export function AdminClaimRequests() {
  const goTo = useContext(ScreenNavCtx)
  const [mine, setMine] = useState(true)
  const [fStatus, setFStatus] = useState('')
  const base = mine ? CLAIM_REQS.filter((r) => r.by === ME) : CLAIM_REQS
  const rows = base.filter((r) => !fStatus || CLAIM_STATUS[r.status].vi === fStatus)

  return (
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
          /* The company name links to its record — where a pending request can
             actually be decided, and the next question after "what happened" is
             always "which company again?". */
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
          /* The outcome plus what it MEANS. The approved row is the answer to "ai
             được chọn" — its sales became the owner. */
          <span className="flex min-w-0 flex-col gap-0.5">
            <Pill tone={CLAIM_STATUS[r.status].tone}>{CLAIM_STATUS[r.status].vi}</Pill>
            {/* Which level it sits at / who said no — the two-level chain, told from
                the rep's side. */}
            {r.status === 'pending' && <span className="text-[10px] leading-snug text-faint">lần 1 — chờ Admin duyệt</span>}
            {r.status === 'admin_ok' && <span className="text-[10px] leading-snug text-faint">✓ Admin duyệt — lần 2, chờ Sales lead</span>}
            {r.status === 'rejected' && <span className="text-[10px] leading-snug text-faint">bởi {r.rejectedLevel ?? 'Admin'} — công ty về lại Chưa nhận, xin lại được</span>}
            {r.status === 'approved' && <span className="text-[10px] leading-snug text-faint">được chọn — là sales phụ trách</span>}
            {r.decidedAt && <span className="text-[10px] leading-snug text-faint">{r.decidedAt}{r.decidedBy && ` · ${r.decidedBy}`}</span>}
            {/* The admin's note to THIS rep — the sentence that tells a refused rep
                what a better request would look like. Verbatim, never summarised. */}
            {r.note && <span className="text-[10.5px] leading-snug text-muted">“{r.note}”</span>}
          </span>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Đây là <b className="text-muted">log</b>, không phải chỗ duyệt — duyệt ở <b className="text-muted">Free data</b> (lọc Đang chờ duyệt, mở công ty): <b className="text-muted">Admin duyệt trước (bước 1), Sales lead duyệt sau (bước 2)</b> — từ chối ở bước nào là chốt ở bước đó.
        Sales mở <b className="text-muted">Của tôi</b> để biết yêu cầu của mình được duyệt hay bị từ chối, và đọc <b className="text-muted">note của admin</b> gửi riêng cho mình — vì khi bị từ chối, dòng trong danh bạ chỉ âm thầm quay về Chưa nhận.
      </p>
    </div>
  )
}
