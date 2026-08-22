import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CLAIM_REQS, CLAIM_STATUS } from '@/pages/admin/data/directory'
import { FilterBar, FilterRow, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

export function AdminClaimQueue() {
  const [fStatus, setFStatus] = useState('')
  const rows = CLAIM_REQS.filter((r) => !fStatus || CLAIM_STATUS[r.status].vi === fStatus)

  return (
    <div>
      <ListPage
        minW={1860}
        total={CLAIM_REQS.length}
        searchHint="Tìm ID, công ty, sales, người liên hệ…"
        searchExtra={rows.map((r) => [r.link ?? '', r.file ?? '', r.note ?? ''].join(' '))}
        filters={
          <FilterBar count={fStatus ? 1 : 0} onClear={() => setFStatus('')}>
            <FilterRow label="Trạng thái" value={fStatus} onChange={setFStatus} options={Object.values(CLAIM_STATUS).map((x) => x.vi)} />
          </FilterBar>
        }
        cols={[
          { label: 'ID', w: '0.5fr' },
          { label: 'Công ty (danh bạ)', w: '1.7fr' },
          { label: 'Sales xin', w: '1fr' },
          { label: 'Ngày tạo yêu cầu', w: '0.95fr' },
          { label: 'Lý do tạo yêu cầu', w: '2.1fr' },
          { label: 'Phân loại khách hàng', w: '1.5fr' },
          { label: 'Ghi chú duyệt', w: '1.4fr' },
          { label: 'Số YC', w: '0.55fr' },
          { label: 'Trạng thái', w: '0.8fr' },
          { label: '', w: '1.4fr' },
        ]}
        rows={rows.map((r) => [
          <span className="font-mono text-[11px] text-faint">{r.id}</span>,
          /* Company + the contact point the rep supplied, stacked: the approver is
             checking whether this rep actually has a way in, so the phone belongs
             next to the name rather than three columns away. */
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{r.co}</span>
            <span className="block truncate text-[10.5px] text-faint">{r.person}</span>
            <span className="block truncate text-[10.5px] text-faint">{r.phone}{r.email && ` · ${r.email}`}</span>
          </span>,
          <span className="truncate">{r.by}</span>,
          <span className="truncate tabular-nums text-[11.5px] text-muted">{r.when}</span>,
          /* Reason + evidence in one cell, because they are read together. A link is
             visibly different from a file: one can be opened, the other believed. */
          <span className="min-w-0">
            <span className={cn('block text-[11.5px] leading-snug', r.reason.length < 20 ? 'text-amber-700' : 'text-muted')} title={r.reason}>{r.reason}</span>
            {r.link
              ? <span className="mt-0.5 block truncate font-mono text-[10.5px] text-brand underline" title={r.link}>{r.link}</span>
              : r.file
                ? <span className="mt-0.5 block truncate text-[10.5px] text-muted">📎 {r.file}</span>
                : <span className="mt-0.5 block text-[10.5px] font-medium text-amber-700">⚠ không có bằng chứng</span>}
          </span>,
          <span className="min-w-0 truncate text-[11.5px] text-muted" title={r.kind}>{r.kind}</span>,
          r.note
            ? <span className="min-w-0 text-[11px] leading-snug text-muted" title={r.note}>{r.note}</span>
            : <span className="text-[10.5px] text-faint">—</span>,
          /* The tie-break signal: 2 means another rep asked for the same company and
             the admin is choosing between people, not just approving a request. */
          (r.reqs ?? 1) > 1
            ? <span className="font-semibold tabular-nums text-amber-700" title="Có sales khác cũng xin công ty này">{r.reqs} ⚠</span>
            : <span className="tabular-nums text-muted">{r.reqs}</span>,
          <Pill tone={CLAIM_STATUS[r.status].tone}>{CLAIM_STATUS[r.status].vi}</Pill>,
          r.status === 'pending'
            ? <span className="flex flex-wrap items-center justify-end gap-1.5">
                <button className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-rose-300 hover:text-rose-700">Từ chối</button>
                <button className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">Duyệt → tạo hồ sơ</button>
              </span>
            : <span className="block text-right text-[10.5px] text-faint">đã xử lý</span>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Duyệt là <b className="text-muted">một thao tác</b>: tạo hồ sơ công ty trong CRM, gán sales xin làm người phụ trách, ghi contact point thành người liên hệ đầu tiên, và đánh dấu hàng trong danh bạ là Đã nhận kèm liên kết.
        Từ chối <b className="text-muted">bắt buộc có ghi chú</b> và hàng đó trở lại Chưa nhận. Trùng với công ty đã có trong CRM đã bị chặn ngay lúc sales gửi — không tiêu một lượt duyệt.
        Yêu cầu đã xử lý <b className="text-muted">vẫn nằm ở đây</b>: đây cũng là hồ sơ ghi lại mỗi công ty vào CRM bằng đường nào.
      </p>
    </div>
  )
}

