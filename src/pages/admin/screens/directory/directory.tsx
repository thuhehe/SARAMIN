import { useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { coKey, coLabel } from '@/pages/admin/data/companies'
import { DIRECTORY, DIR_STATE, FREE_DATA_KIND, KIND_IS_CUSTOMER, dirCrm, dirCrmMatch } from '@/pages/admin/data/directory'
import type { DirRow } from '@/pages/admin/data/directory'
import { FLabel } from '@/pages/admin/ui/fields'
import { FilterBar, FilterRow, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* ── Tạo yêu cầu nhận công ty ─────────────────────────────────────────────────
   The request form. Four things the rep supplies, and every one of them is used by
   somebody downstream rather than merely collected:

     Lý do          → what the approver reads first
     Phân loại      → what makes the queue reviewable, and what measures the source
     Contact point  → becomes contact #1 on the company the rep is about to receive
     Bằng chứng     → a link or a file the approver can OPEN

   Contact point is structured fields, not a line inside the description. A template
   in a placeholder ("2. Contact Point: …") is a request, and a request is what
   produces the one-word reasons — "test", "đang tuyển" — that make an approval
   queue unreviewable. A required field is not a request. */
function ClaimModal({ row, onClose }: { row: DirRow; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [kind, setKind] = useState('')
  const [person, setPerson] = useState(row.person ?? '')
  const [phone, setPhone] = useState(row.phone ?? '')
  const [email, setEmail] = useState(row.email ?? '')
  const [link, setLink] = useState('')
  const [file, setFile] = useState('')
  const dup = dirCrmMatch(row)
  const kindIsCustomer = KIND_IS_CUSTOMER.has(kind)
  // Evidence: a link OR a file. One of the two, never neither — that is the whole
  // second condition the request exists to prove.
  const hasProof = Boolean(link.trim()) || Boolean(file.trim())
  const ok = Boolean(reason.trim()) && Boolean(kind) && Boolean(person.trim()) && Boolean(phone.trim()) && hasProof && !dup && !kindIsCustomer

  const inp = 'w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[720px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Tạo yêu cầu nhận công ty</p>
            <p className="text-[11.5px] text-muted">{row.name}{row.addr && <span className="text-faint"> · {row.addr}</span>}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[70vh] space-y-3.5 overflow-y-auto p-5">
          {/* The duplicate check runs here, not at approval. If it is already a CRM
              company the request is never created — the rep is told who holds it. */}
          {dup && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-900">
              <p className="font-semibold">⚠ Công ty này đã có trong CRM</p>
              <p className="mt-1"><b>{coLabel(dup)}</b> · {companyId(coKey(dup))} · sales phụ trách <b>{dup.owner}</b>.</p>
              <p className="mt-1 text-amber-800/85">Không tạo được yêu cầu. Nếu cần làm việc với khách này, xin chuyển giao từ hồ sơ công ty.</p>
            </div>
          )}

          {/* A row already asked for is NOT blocked — see the requirement. The rep is
              told, so they can spend the effort on a free row instead if they want. */}
          {row.state === 'pending' && (
            <div className="rounded-lg border border-line bg-canvas/70 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted">
              <b className="text-ink">{row.reqs ?? 1} sales đã xin công ty này</b> (đầu tiên: {row.by}). Bạn vẫn gửi được — admin chọn một người và nêu lý do cho những người còn lại.
            </div>
          )}

          <div>
            <FLabel req>Lý do tạo yêu cầu · mô tả thông tin chi tiết</FLabel>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder={'Mô tả lý do bạn muốn nhận chăm sóc khách hàng này từ danh bạ, để admin duyệt được nhanh.\nVD: KH đang tuyển 8 vị trí kỹ thuật trên thị trường, đã liên hệ HR và được hẹn gọi lại tuần sau.'}
              className={cn(inp, 'resize-y leading-relaxed')}
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              Lý do là <b className="text-ink/70">phần duy nhất admin đọc trước</b>. “test”, “đang tuyển” không đủ để duyệt và sẽ bị trả lại.
            </p>
          </div>

          <div>
            <FLabel req>Phân loại khách hàng trong Free Data</FLabel>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={inp}>
              <option value="">— Chọn phân loại —</option>
              {FREE_DATA_KIND.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            {/* The two customer classifications are a contradiction, not a category:
                a company with a Saramin package is not free data. Saying so here is
                cheaper than an approval round that ends in "này là KH của bạn khác". */}
            {kindIsCustomer ? (
              <p className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
                ⚠ Phân loại này nói khách <b>đã / đang có gói dịch vụ Saramin</b> — tức là <b>đã là khách hàng</b>, không phải free data. Khách hàng luôn có sales phụ trách trong CRM.
                <span className="mt-1 block text-amber-800/85">Tìm công ty trong CRM và dùng <b>Yêu cầu chuyển giao</b>, không xin từ danh bạ.</span>
              </p>
            ) : (
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Dùng để admin duyệt nhanh, và để đo <b className="text-ink/70">nguồn danh bạ nào thật sự ra khách</b> — không phải để trang trí.</p>
            )}
          </div>

          {/* Contact point — REQUIRED, and reused rather than just checked. */}
          <div className="rounded-lg border border-line bg-canvas/40 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Contact point · người liên hệ tại KH</p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <div>
                <FLabel req>Tên người liên hệ</FLabel>
                <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="VD: Ms. Trần Thu Hà · HR" className={inp} />
              </div>
              <div>
                <FLabel req>Số điện thoại</FLabel>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="028 xxxx xxxx" className={inp} />
              </div>
              <div>
                <FLabel>Email</FLabel>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hr@congty.vn" className={inp} />
              </div>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
              Ba trường này trở thành <b className="text-ink/70">người liên hệ đầu tiên</b> trên hồ sơ công ty sau khi duyệt — không chỉ là điều kiện để xin.
            </p>
          </div>

          {/* Evidence: a link or a file, not "optional". */}
          <div className="rounded-lg border border-line bg-canvas/40 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
              Bằng chứng công ty đang tuyển <span className="font-normal normal-case tracking-normal text-rose-500">— bắt buộc có link hoặc tệp</span>
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <FLabel>Link tin tuyển dụng</FLabel>
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="vietnamworks.com/…" className={inp} />
              </div>
              <div>
                <FLabel>Tệp đính kèm</FLabel>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFile(file ? '' : 'tin-tuyen-dung.png')} className="shrink-0 rounded-md border border-line bg-surface px-2.5 py-2 text-[11.5px] font-medium text-muted hover:border-brand hover:text-brand">Chọn tệp</button>
                  <span className="min-w-0 truncate text-[11.5px] text-faint">{file || 'Chưa chọn tệp nào'}</span>
                </div>
              </div>
            </div>
            <p className={cn('mt-1.5 text-[10.5px] leading-relaxed', hasProof ? 'text-faint' : 'text-amber-700')}>
              {hasProof
                ? <>Ưu tiên <b className="text-ink/70">link</b> — admin mở kiểm tra được ngay. Ảnh chụp thì phải đọc và tin.</>
                : <>Chưa có bằng chứng nào. Một trong hai điều kiện để nhận công ty là <b>công ty đang tuyển</b> — ghi chú suông thì admin phải tin, không kiểm tra được.</>}
            </p>
          </div>

          <p className="rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            Yêu cầu này <b className="text-ink/70">không tạo hồ sơ công ty</b>. Admin duyệt thì hệ thống mới tạo hồ sơ trong CRM, gán bạn làm sales phụ trách và ghi contact point trên thành người liên hệ đầu tiên.
            <span className="block text-faint">MST trong danh bạ <b className="text-ink/60">không được tin</b> — bạn sẽ nhập lại MST trên hồ sơ, và lúc đó hệ thống mới kiểm tra trùng.</span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          {!ok && !dup && !kindIsCustomer && <span className="mr-auto text-[11px] text-faint">Còn thiếu: lý do, phân loại, contact point và bằng chứng.</span>}
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Đóng</button>
          <button onClick={onClose} disabled={!ok} className={cn('rounded-lg px-4 py-2 text-[13px] font-semibold text-white', ok ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-line')}>
            Gửi yêu cầu cho admin →
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminCompanyDirectory() {
  const [claim, setClaim] = useState<DirRow | null>(null)
  const [fState, setFState] = useState('')
  const rows = DIRECTORY.filter((r) => !fState || DIR_STATE[r.state].vi === fState)

  return (
    <div>
      <ListPage
        minW={1720}
        total={DIRECTORY.length}
        searchHint="Tìm tên công ty, người liên hệ, email, SĐT, MST…"
        searchExtra={rows.map((r) => [r.web ?? '', r.source].join(' '))}
        filters={
          <FilterBar count={fState ? 1 : 0} onClear={() => setFState('')}>
            <FilterRow label="Trạng thái" value={fState} onChange={setFState} options={Object.values(DIR_STATE).map((x) => x.vi)} />
          </FilterBar>
        }
        cols={[
          { label: 'Tên công ty', w: '1.8fr' },
          { label: 'Người liên hệ', w: '1.1fr' },
          { label: 'Email', w: '1.3fr' },
          { label: 'SĐT', w: '1fr' },
          { label: 'MST (chưa xác minh)', w: '1.05fr' },
          { label: 'Tỉnh / TP', w: '0.85fr' },
          { label: 'Ngành', w: '0.8fr' },
          { label: 'Nguồn', w: '1.2fr' },
          { label: 'Trạng thái', w: '1.15fr' },
          // Every row ends in the one thing a rep can do here.
          { label: '', w: '1fr' },
        ]}
        rows={rows.map((r) => [
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{r.name}</span>
            {r.web && <span className="block truncate font-mono text-[10.5px] text-faint">{r.web}</span>}
          </span>,
          <span className="truncate text-muted">{r.person ?? <span className="text-faint">—</span>}</span>,
          <span className="truncate text-[11.5px] text-muted">{r.email ?? <span className="text-faint">—</span>}</span>,
          <span className="truncate tabular-nums text-muted">{r.phone ?? <span className="text-faint">—</span>}</span>,
          /* Shown but visibly untrusted — the column header says so and a wrong one
             is worse than a blank, because a blank gets typed in. */
          r.tax
            ? <span className="truncate font-mono text-[11px] text-amber-700" title="Chưa xác minh — sẽ nhập lại khi tạo hồ sơ CRM">{r.tax} ⚠</span>
            : <span className="text-[10.5px] text-faint">—</span>,
          <span className="truncate text-muted">{r.addr ?? <span className="text-faint">—</span>}</span>,
          <span className="truncate text-muted">{r.industry ?? <span className="text-faint">—</span>}</span>,
          <span className="truncate text-[11px] text-faint">{r.source}</span>,
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-1.5">
              <Pill tone={DIR_STATE[r.state].tone}>{DIR_STATE[r.state].vi}</Pill>
              {/* Competing requests are normal. The count is the admin's tie-break
                  signal, so it belongs on the row and not only in the queue. */}
              {r.state === 'pending' && (r.reqs ?? 1) > 1 && <span className="text-[10.5px] font-medium text-amber-700">{r.reqs} yêu cầu</span>}
            </span>
            {r.by && <span className="truncate text-[10.5px] text-faint">{r.by}</span>}
          </span>,
          /* The action, on EVERY row — a row a rep cannot act on has to say why, or
             they click through to find out and learn nothing. */
          r.state === 'claimed'
            ? (dirCrm(r)
                ? <span className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-[10.5px] text-brand" title={`Đã thành hồ sơ CRM · ${coLabel(dirCrm(r)!)}`}>{companyId(coKey(dirCrm(r)!))} →</span>
                    <span className="text-[10px] text-faint">đã có sales phụ trách</span>
                  </span>
                : <span className="text-[10.5px] text-faint">—</span>)
            : <button onClick={() => setClaim(r)} className={cn('rounded-md px-2 py-1 text-[11px] font-semibold', r.state === 'pending' ? 'border border-line text-muted hover:border-brand hover:text-brand' : 'border border-brand/40 bg-brand-soft text-brand hover:border-brand')}>
                {r.state === 'pending' ? 'Xin nhận (đã có người xin)' : 'Xin nhận'}
              </button>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Dữ liệu tham chiếu, <b className="text-muted">không phải khách hàng</b> — không đếm vào bất kỳ số nào của CRM, không có sales phụ trách, không lên pipeline, không xuất được báo giá.
        Sales <b className="text-muted">chỉ đọc</b>: sửa dữ liệu dùng chung của hàng chục người là cách nhanh nhất làm nó bẩn thêm. Hàng nào cũng giữ lại — nhận rồi thì đánh dấu và liên kết tới hồ sơ CRM, không xóa.
      </p>
      {claim && <ClaimModal row={claim} onClose={() => setClaim(null)} />}
    </div>
  )
}
