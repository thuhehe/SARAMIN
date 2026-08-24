import { useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { COMPANIES, coKey, coLabel } from '@/pages/admin/data/companies'
import { DIRECTORY, DIR_STATE, FREE_DATA_KIND, KIND_IS_CUSTOMER, dirAsCompany, dirCrmMatch, rejectedCount } from '@/pages/admin/data/directory'
import type { DirRow } from '@/pages/admin/data/directory'
import { CreateSignalCtx, OpenRecordCtx, ScreenNavCtx, useDetailCrumb } from '@/pages/admin/ctx'
import { ME } from '@/pages/admin/data/salesOrg'
import { FLabel, LField } from '@/pages/admin/ui/fields'
import { JobGroup } from '@/pages/admin/ui/form'
import { CompanyDetail } from '@/pages/admin/screens/companies/detail'
import { FilterBar, FilterRow, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* ── Tạo yêu cầu ──────────────────────────────────────────────────────────────
   Built to match the existing FreeDB form field-for-field, per the client: a
   description box carrying the format template, the Free-Data classification, and an
   optional link + attachment. ĐÓNG / LƯU LẠI.

   The contact point is asked for INSIDE the description, via the template — not as
   its own fields. That is the client's form and this mirrors it. The known cost is
   in the requirement: a template is a request, and the live queue shows what a
   request produces ("test", "đang tuyển"). It stays an open question there rather
   than a silent deviation here.

   Two things sit ABOVE the form and are not part of it — both are guards the client
   asked for separately: the CRM-duplicate block, and the notice that other reps have
   already asked for this row. */
function ClaimModal({ row, onClose }: { row: DirRow; onClose: () => void }) {
  const [desc, setDesc] = useState('')
  const [kind, setKind] = useState('')
  const [link, setLink] = useState('')
  const [file, setFile] = useState('')
  const dup = dirCrmMatch(row)
  const kindIsCustomer = KIND_IS_CUSTOMER.has(kind)
  const ok = Boolean(desc.trim()) && !dup && !kindIsCustomer

  const inp = 'w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand'
  /* The client's own placeholder, kept verbatim — it is the only instruction a rep
     gets about what to write, so paraphrasing it would change the data we receive. */
  const TEMPLATE = `Vui lòng mô tả lý do yêu cầu nhận chăm sóc bán hàng KH từ FreeDB để quá trình duyệt diễn ra nhanh chóng và thuận lợi.
Format:
1. Lý do:
2. Contact Point: Tên nhân sự Sales liên hệ/take care - Email - SĐT`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[880px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <p className="text-[15px] font-bold">Tạo yêu cầu</p>
            <p className="text-[11.5px] text-muted">{row.name}{row.addr && <span className="text-faint"> · {row.addr}</span>}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[74vh] space-y-3 overflow-y-auto p-5">
          {/* Guard, not a form field: the duplicate check runs when the form opens,
              so an already-owned company never costs an approval cycle. */}
          {dup && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-900">
              <p className="font-semibold">⚠ Công ty này đã có trong CRM</p>
              <p className="mt-1"><b>{coLabel(dup)}</b> · {companyId(coKey(dup))} · sales phụ trách <b>{dup.owner}</b>.</p>
              <p className="mt-1 text-amber-800/85">Không tạo được yêu cầu. Nếu cần làm việc với khách này, xin chuyển giao từ hồ sơ công ty.</p>
            </div>
          )}
          {row.state === 'pending' && (
            <div className="rounded-lg border border-line bg-canvas/70 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted">
              <b className="text-ink">{row.reqs ?? 1} sales đã xin công ty này</b> (đầu tiên: {row.by}). Bạn vẫn gửi được — admin chọn một người và nêu lý do cho những người còn lại.
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11.5px] text-ink/70">- Mô tả thông tin chi tiết</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={12}
              placeholder={TEMPLATE}
              className={cn(inp, 'resize-y leading-relaxed')}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] text-ink/70">- Phân loại khách hàng trong Free Data</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={inp}>
              <option value="">Không có mục nào được chọn</option>
              {FREE_DATA_KIND.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            {/* Guard again, not a field: two of the classifications describe a company
                that already has a Saramin package — i.e. a customer, not free data. */}
            {kindIsCustomer && (
              <p className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
                ⚠ Phân loại này nói khách <b>đã / đang có gói dịch vụ Saramin</b> — tức là <b>đã là khách hàng</b>, không phải free data.
                <span className="mt-0.5 block text-amber-800/85">Tìm công ty trong CRM và dùng <b>Yêu cầu chuyển giao</b>, không xin từ danh bạ.</span>
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11.5px] text-ink/70">Link (Optional)</label>
              <input value={link} onChange={(e) => setLink(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-ink/70">Tệp đính kèm (Optional)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setFile(file ? '' : 'tin-tuyen-dung.png')} className="shrink-0 rounded border border-line bg-canvas px-2 py-1.5 text-[11.5px] text-ink/80 hover:border-brand">Chọn tệp</button>
                <span className="min-w-0 truncate text-[11.5px] text-muted">{file || 'Không có tệp nào được chọn'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button onClick={onClose} className="rounded border border-line px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted hover:border-ink/40">Đóng</button>
          <button onClick={onClose} disabled={!ok} className={cn('rounded px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-white', ok ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-line')}>Lưu lại</button>
        </div>
      </div>
    </div>
  )
}



export function AdminCompanyDirectory() {
  const [claim, setClaim] = useState<DirRow | null>(null)
  const handed = useContext(OpenRecordCtx)
  const goTo = useContext(ScreenNavCtx)
  /* The row a rep opened to read. A MODAL, not a page: a pool row holds nine fields
     and nothing to do, so a screen of its own would be a lot of navigation around a
     lookup. Read-only throughout — this is shared reference data, and letting one
     rep edit what dozens rely on is the fastest way to make it dirtier. */
  /* Clicking a name opens the COMPANY DETAIL page — the same page a CRM company
     opens on, in its pool variant — not a popup. A reader is answering the same
     question ("who is this company?"), and a modal that answers it differently is a
     second page to learn and a second page to keep in step. */
  const [peek, setPeek] = useState<DirRow | null>(null)
  /* Adding a row by hand. The pool is mostly bulk-imported, but a rep who meets a
     company at a fair and finds it missing has nowhere to put it — and typing it
     straight into the CRM as a customer is the wrong shape: it is not owned, not
     verified and not a customer yet. */
  const [adding, setAdding] = useState(false)
  /* Same wiring as Companies: the shell owns the "+ Thêm công ty" button on the page
     title row and signals intent; the page swaps itself for the form. */
  const createSignal = useContext(CreateSignalCtx)
  useEffect(() => { if (createSignal) setAdding(true) }, [createSignal])
  const [fState, setFState] = useState('')
  /* A claimed company LEAVES the pool. It is a CRM company now, with an owner and a
     record of its own, and listing it here too would show one company twice — in the
     one place whose job is to say what nobody has taken yet. The row is not deleted:
     it keeps its `claimed` state so the promotion is still traceable, it just stops
     being part of this list. */
  const pool = DIRECTORY.filter((r) => r.state !== 'claimed')
  const rows = pool.filter((r) => !fState || DIR_STATE[r.state].vi === fState)

  if (adding) return <PoolCreatePage onBack={() => setAdding(false)} />

  /* Same pattern as Companies: the record REPLACES the list rather than floating
     over it, so Back means one thing and the breadcrumb stays true. */
  /* A row handed in from another screen — the claim-tracking table links a request
     to the company it is about. Matched on the pool NAME, which is the only handle a
     pool row has: it has no Company ID until it becomes a CRM company. */
  const shown = peek ?? (handed ? DIRECTORY.find((r) => r.name === handed) ?? null : null)
  if (shown) {
    return (
      <>
        <CompanyDetail
          c={dirAsCompany(shown)}
          pool={shown}
          onBack={() => { setPeek(null); if (handed) goTo('admin-company-directory') }}
          onClaim={() => { setClaim(shown); }}
        />
        {claim && <ClaimModal row={claim} onClose={() => setClaim(null)} />}
      </>
    )
  }

  return (
    <div>
      <ListPage
        minW={1720}
        total={pool.length}
        searchHint="Tìm tên công ty, người liên hệ, email, SĐT, MST…"
        searchExtra={rows.map((r) => [r.web ?? '', r.source].join(' '))}
        filters={
          <FilterBar count={fState ? 1 : 0} onClear={() => setFState('')}>
            <FilterRow label="Trạng thái" value={fState} onChange={setFState} options={[DIR_STATE.free.vi, DIR_STATE.pending.vi]} />
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
        ]}
        rows={rows.map((r) => [
          <span className="min-w-0">
            {/* Opens the row. The columns are deliberately narrow — address, industry
                and source all truncate — so there has to be somewhere to read the
                whole record before deciding whether to ask for it. */}
            <button onClick={() => setPeek(r)} className="block max-w-full truncate text-left font-medium text-ink hover:text-brand hover:underline">{r.name}</button>
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
              {r.state === 'pending' && <span className="text-[10.5px] font-medium text-amber-700">{r.reqs ?? 1} sales xin</span>}
              {/* Refused before, and free again. The count is a warning to the next
                  approver, not a state on the company. */}
              {r.state === 'free' && rejectedCount(r.name) > 0 && (
                <span className="text-[10.5px] text-muted" title="Đã có yêu cầu bị từ chối trước đó — công ty vẫn ở Chưa nhận, ai cũng xin lại được">
                  đã từ chối {rejectedCount(r.name)} lần
                </span>
              )}
            </span>
            {r.by && <span className="truncate text-[10.5px] text-faint">{r.by}</span>}
          </span>,

        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Dữ liệu tham chiếu, <b className="text-muted">không phải khách hàng</b> — không đếm vào bất kỳ số nào của CRM, không có sales phụ trách, không lên pipeline, không xuất được báo giá.
        Sales <b className="text-muted">chỉ đọc</b>: sửa dữ liệu dùng chung của hàng chục người là cách nhanh nhất làm nó bẩn thêm.
        Admin duyệt xong thì công ty đó <b className="text-muted">rời khỏi danh bạ</b> — nó đã thành hồ sơ CRM có sales phụ trách, để lại đây nữa thì một công ty hiện hai lần.
        <span className="mt-1 block">
          <b className="text-muted">Admin duyệt ngay tại đây</b>: lọc Trạng thái = <b className="text-muted">Đang chờ duyệt</b>, mở công ty, xem các sales đã xin và phân công ty cho một người. Không có màn hình duyệt riêng — quyết định là về công ty này, nên nó nằm trên hồ sơ công ty này.
        </span>
      </p>

      {claim && <ClaimModal row={claim} onClose={() => setClaim(null)} />}
    </div>
  )
}



/**
 * Add one company to the pool — the same SHAPE as New company: a full page that
 * replaces the list, a Draft pill, JobGroup sections, and the button living on the
 * page title row rather than in the toolbar. A rep should not have to learn two
 * ways of adding a company.
 *
 * What it is NOT is the same FORM. New company produces a CRM customer: it asks for
 * the invoice classification, the verification document, a primary contact and a
 * sales owner, and the record it writes is owned and counted from the moment it
 * saves. A pool row is the opposite of all four — unowned, unverified, uncounted —
 * so the sections that make a customer are absent here on purpose. Filling them in
 * would not add to the pool; it would skip it.
 *
 * ONLY THE NAME IS REQUIRED. The store is explicitly "large and dirty", and
 * demanding a tax code or a phone number either blocks the add or teaches people to
 * invent values. A row with a name and nothing else is still a lead worth having.
 */
function PoolCreatePage({ onBack }: { onBack: () => void }) {
  useDetailCrumb('Thêm công ty vào bể dữ liệu', onBack)
  const [name, setName] = useState('')
  const [tax, setTax] = useState('')

  /* The duplicate check searches BOTH stores, because the two failures differ. A
     duplicate POOL row splits future claims across two rows that cannot see each
     other's history. A company that is already a CRM CUSTOMER must not be re-entered
     as free data at all — it has an owner, and a pool row for it invites a second
     rep to ask for a company that is already taken. Warns, never blocks: near
     matches on a dirty list are normal, same rule as the claim-request check. */
  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/cong ty|tnhh|cp|co phan|\s+/g, '')
  const q = norm(name)
  const dupPool = q.length > 2 ? DIRECTORY.filter((r) => norm(r.name).includes(q) || (Boolean(tax) && r.tax === tax)).slice(0, 3) : []
  const dupCrm = q.length > 2 ? COMPANIES.filter((c) => norm(c.legalName).includes(q) || norm(c.name).includes(q) || (Boolean(tax) && c.tax === tax)).slice(0, 3) : []
  const ok = name.trim().length > 1

  return (
    <div className="max-w-[860px] pb-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-tight">Thêm công ty vào bể dữ liệu</h2>
        <Pill tone="draft">Chưa nhận</Pill>
      </div>

      <div className="space-y-8">
        <JobGroup title="Thông tin công ty">
          <div>
            <FLabel req>Tên công ty</FLabel>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Công ty TNHH …" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>

          {(dupPool.length > 0 || dupCrm.length > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[11.5px] font-semibold text-amber-800">Có thể đã tồn tại — kiểm tra trước khi thêm</p>
              {dupCrm.map((c) => (
                <p key={c.name} className="mt-1 text-[11px] leading-relaxed text-amber-800">
                  · <b>Đã là khách hàng CRM</b>: {coLabel(c)} · {companyId(coKey(c))} — <b>không thêm vào bể</b>, công ty này đã có sales phụ trách.
                </p>
              ))}
              {dupPool.map((r) => (
                <p key={r.name} className="mt-1 text-[11px] leading-relaxed text-amber-800">
                  · Đã có trong bể: {r.name} — {DIR_STATE[r.state].vi}{r.by ? ` · ${r.by}` : ''}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <LField label="Ngành nghề" value="" />
            <div>
              <FLabel>Mã số thuế</FLabel>
              <input value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0312xxxxxx" className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-[12px] outline-none placeholder:text-faint focus:border-brand" />
              <p className="mt-1 text-[10.5px] leading-relaxed text-amber-700">Nhập ở đây vẫn là <b>chưa xác minh</b> — sẽ phải nhập lại theo giấy tờ khi tạo hồ sơ CRM.</p>
            </div>
          </div>
          <LField label="Địa chỉ" value="" />
          <LField label="Website" value="" />
        </JobGroup>

        <JobGroup title="Người liên hệ (nếu có)">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Người liên hệ" value="" />
            <LField label="Chức danh" value="" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Điện thoại" value="" />
            <LField label="Email" value="" />
          </div>
          <p className="text-[10.5px] leading-relaxed text-faint">
            Không bắt buộc — nhiều dòng trong bể chỉ có mỗi tên công ty. Nhưng <b className="text-ink/70">Xin nhận thì bắt buộc có số điện thoại</b>, nên có sẵn ở đây sẽ đỡ một bước sau này.
          </p>
        </JobGroup>

        <JobGroup title="Nguồn">
          <div className="rounded-md border border-line bg-canvas/50 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted">
            Ghi tự động: <b className="text-ink/70">Nhập tay · {ME}</b> — không nhập tay được.
            Mọi dòng khác trong bể đều nói rõ nguồn (VCCI, hội chợ, job board); dòng thêm thủ công cũng phải vậy, và người thêm chính là nguồn.
          </div>
        </JobGroup>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
        <button
          disabled={!ok}
          title={ok ? undefined : 'Nhập tên công ty'}
          onClick={onBack}
          className={cn('rounded-lg px-4 py-2 text-[13px] font-semibold text-white', ok ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-brand/40')}
        >Thêm vào bể</button>
        <button onClick={onBack} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Huỷ</button>
        <p className="ml-auto text-[11px] text-faint">Vào bể ở trạng thái <b className="text-muted">Chưa nhận</b> — thêm không phải là nhận.</p>
      </div>
    </div>
  )
}
