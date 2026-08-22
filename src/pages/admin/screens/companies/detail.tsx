import { useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { RO_HINT, ReadOnlyCtx, useDetailCrumb } from '@/pages/admin/ctx'
import { AC_STATUS, BUYER_TYPE, COMPANIES, LEAD_SOURCES, RETAIL_BUYER, coCity, coKey, coLabel, coLeadSource, coValue, inPipeline, isVNCompany } from '@/pages/admin/data/companies'
import type { BuyerType, Company } from '@/pages/admin/data/companies'
import { ARCHIVE_REASONS, CO_SIZES, archiveReason } from '@/pages/admin/data/companyPage'
import { CONTACT_STATUS, MAX_SEATS, companyApplicants, companyContacts, companyJobs, companyResumeViews, companyTeam, jobSources, poHistory } from '@/pages/admin/data/companyRecord'
import type { CoContact, CoTab } from '@/pages/admin/data/companyRecord'
import { tierOf } from '@/pages/admin/data/membership'
import { ME } from '@/pages/admin/data/salesOrg'
import { MD_DOMAINS } from '@/pages/admin/data/system'
import { vnd } from '@/pages/admin/lib/fmt'
import { CompanyActivities } from '@/pages/admin/screens/companies/activity'
import { AffiliatedCompanies } from '@/pages/admin/screens/companies/affiliates'
import { AddContactModal, ContactDetail } from '@/pages/admin/screens/companies/contacts'
import { CompanyDocs } from '@/pages/admin/screens/companies/docs'
import { OwnerHistory, PipelineStatusPicker } from '@/pages/admin/screens/companies/owner'
import { CompanyPageEditor } from '@/pages/admin/screens/companies/page'
import { MembershipStat, ProductsQuota, ServiceUsageCard } from '@/pages/admin/screens/companies/products'
import { CoTabBar } from '@/pages/admin/screens/companies/tabBar'
import { CoRoleBuilder, InviteUserModal } from '@/pages/admin/screens/companies/users'
import { NewQuotationModal } from '@/pages/admin/screens/sales/newQuotation'
import { CardGroup, DetailCard, EField, KV, SelectRow } from '@/pages/admin/ui/fields'
import { RowAction } from '@/pages/admin/ui/list'
import { MiniStat } from '@/pages/admin/ui/stats'
import { Pill, TierPill } from '@/pages/admin/ui/status'
import { Table } from '@/pages/admin/ui/table'

export function CompanyDetail({ c, onBack, onOpen, viewer = ME }: { c: Company; onBack: () => void; onOpen?: (x: Company) => void; viewer?: string }) {
  const [tab, setTab] = useState<CoTab>('Overview')
  const [inviting, setInviting] = useState(false)
  const [contactOpen, setContactOpen] = useState<CoContact | null>(null)
  /* One Edit toggle for the whole Basic-info card, rather than a pencil per row:
     14 inline editors is 14 chances to leave one half-saved. */
  const [editInfo, setEditInfo] = useState(false)
  /* "+ Thêm công ty con" swaps in the create PAGE with this company locked as the
     parent, rather than floating a form over the record it came from. */
  useDetailCrumb(coLabel(c), onBack)
  const [addingContact, setAddingContact] = useState(false)
  const [quoting, setQuoting] = useState(false)
  /* HQ cleanup for duplicate / junk companies — soft + reversible, never a delete. */
  const [archived, setArchived] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  /* Why it was archived — an enum, not free text: the follow-up differs per reason
     and free text cannot be counted. Empty until picked, which is what gates Save. */
  const [archiveWhy, setArchiveWhy] = useState('')
  /* THE OTHER EXIT. A company that still exists but is no longer worth chasing goes
     back to the free-data pool: the owner is cleared and the linked pool row flips
     to Chưa nhận so any rep can Xin nhận it again. The CRM record is KEPT — history,
     invoices, activity all stay — so a re-claim reattaches to it instead of creating
     a duplicate. Archive is the opposite door: for a company that must never be
     worked again, the pool row stays consumed. */
  const [released, setReleased] = useState(false)
  const [releaseOpen, setReleaseOpen] = useState(false)
  /* Reached from search rather than owned. Read everything, write nothing — see
     ReadOnlyCtx. Editing state is force-closed so a rep cannot leave the card in
     edit mode and come back to it on someone else's record. */
  /* Read-only when you are NOT the sales owner: you can view everything and LOG
     ACTIVITY (that stays open — see CompanyActivities), but you cannot EDIT the
     record's own fields. Owner is resolved against the signed-in viewer. */
  const ro = c.owner !== viewer
  const noProducts = !c.jobPosting && !c.resumeSearch
  const team = companyTeam(c)
  const jobs = companyJobs(c)
  /* Which entitlement bucket each posted job consumed — see jobSources. */
  const jobSrc = jobSources(c)
  /* Jobs Admin posted with no PO selected. Not quota, not a product — just jobs. */
  const freeJobs = jobs.filter((j) => j.free).length
  const activeJobs = jobs.filter((j) => j.status === 'open').length
  const full = team.length >= MAX_SEATS
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()

  const tabs: { key: CoTab; label: string; count?: number }[] = [
    { key: 'Overview', label: 'Overview' },
    { key: 'Contacts', label: 'Contacts', count: companyContacts(c).length },
    { key: 'Users', label: 'Users', count: team.length },
    { key: 'Products & billing', label: 'Products & billing' },
    { key: 'Company page', label: 'Company page' },
    { key: 'Jobs', label: 'Jobs', count: c.jobPosting ? jobs.length : undefined },
    // Applications hang off the jobs this account posted, so the tab only exists
    // for Job-Posting customers; Resumes only for Resume-Search customers.
    ...(c.jobPosting ? [{ key: 'Applications' as CoTab, label: 'Applications', count: companyApplicants(c).length }] : []),
    ...(c.resumeSearch ? [{ key: 'Resumes' as CoTab, label: 'Resumes' }] : []),
    // Its own tab, and LAST: the chain is an audit trail consulted on purpose
    // ("who held this when, and who moved it"), not something read while working
    // the account. In the Overview column it cost a card's height on every visit
    // to answer a question asked a few times a year.
    { key: 'Owner history', label: 'Owner history' },
  ]


  return (
    <ReadOnlyCtx.Provider value={ro}>
    <div>

      {/* Reached from the search, not from my own book. Reading a colleague's record
          is allowed and useful — it is what stops a duplicate being created. ACTING
          on it is not, and saying so here is what makes the read-only rule legible
          instead of a mystery when a button does nothing. */}
      {ro && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-canvas/70 px-3 py-2 text-[11.5px]">
          <span className="text-[13px]"></span>
          <span className="text-muted">Công ty này do <b className="font-medium text-ink">{c.owner}</b> phụ trách — bạn <b className="font-medium text-ink">không sửa được thông tin</b>, nhưng vẫn <b className="font-medium text-ink">ghi nhận hoạt động</b> được.</span>
          <button className="ml-auto shrink-0 rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">Yêu cầu chuyển giao</button>
        </div>
      )}

      {/* header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-[16px] font-bold text-white shadow-sm">{initials}</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Company account</p>
            <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
              {c.name}
              {/* Both axes, always: customer status (has it ever bought) and, only
                  while a deal is live, the pipeline stage. */}
              <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>
              {archived && <Pill tone="expired">Archived{archiveWhy ? ` · ${archiveReason(archiveWhy)?.vi}` : ''}</Pill>}
              {released && !archived && <Pill tone="pending">Đã trả về bể dữ liệu</Pill>}
              {/* Not a status — a provenance mark. It says the identity fields came
                  from free data a rep re-typed, so verify before the first invoice. */}
              {c.fromPool && (
                <span title={`Nhận từ danh bạ ${c.fromPool.at} · duyệt bởi ${c.fromPool.by}`} className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-muted">
                  Từ danh bạ
                </span>
              )}
              {/* Shown while a deal is live, and also once it is LOST — a lost deal
                  can be re-opened to an earlier stage, so hiding the control there
                  would remove the only way back. Closed-won (Invoice) stays hidden:
                  there is nothing left to move. */}
              {(inPipeline(c) || c.status === 'Lost') && <PipelineStatusPicker c={c} />}
              {/* third axis — only rendered once a tier is actually earned, so the
                  header never carries a "chưa có hạng" non-fact. */}
              {tierOf(c) && <TierPill tier={tierOf(c)} en />}
            </h2>
            <p className="text-[11.5px] text-muted"><span className="font-mono font-medium text-ink/70">{companyId(coKey(c))}</span> · {c.legalName} · MST {c.tax} · <span className="font-mono">{c.domain}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Edit and Create-quotation are WRITES — withdrawn on someone else's
              record. "View on jobseeker" is a read, so it stays. */}
          {!ro && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Edit</button>}
          {c.hasPage && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">View on jobseeker ↗</button>}
          {/* Tạo báo giá — unconditional, for EVERY company. A quotation is the one
              document that is always legitimate to raise: a first quote for a
              prospect, a renewal for an existing customer, a win-back for a churned
              one. The gated step is the PO, which is raised from an accepted
              quotation option (see the Quotations list), not from here. */}
          {/* …but still only for a company in MY book: quoting someone else's
              customer is exactly the collision the ownership rule exists to stop. */}
          {!ro && (
            <button onClick={() => setQuoting(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">
              Tạo báo giá / Create quotation
            </button>
          )}
          {/* TWO EXITS, and the question that picks between them is "should another
              rep be allowed to pick this up?". Yes → back to the pool. No → archive. */}
          {!ro && !archived && (
            released
              ? <button onClick={() => setReleased(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Nhận lại công ty</button>
              : <button onClick={() => setReleaseOpen(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand">Trả về bể dữ liệu</button>
          )}
          {archived
            ? <button onClick={() => setArchived(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Unarchive</button>
            : <button onClick={() => setArchiveOpen(true)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50">Archive company</button>}
        </div>
      </div>

      {releaseOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[480px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-[15px] font-bold">Trả {coLabel(c)} về bể dữ liệu?</p>
              <button onClick={() => setReleaseOpen(false)} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[12px] leading-relaxed text-muted">
                Bỏ bạn khỏi vai trò phụ trách và <b className="text-ink/80">mở lại dòng tương ứng trong Danh bạ doanh nghiệp</b> (về trạng thái <i>Chưa nhận</i>) để bất kỳ sales nào cũng có thể Xin nhận lại.
              </p>
              <ul className="space-y-1 rounded-md bg-canvas/70 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted">
                <li>· Hồ sơ CRM <b className="text-ink/70">được giữ nguyên</b> — hoá đơn, PO, hoạt động, lịch sử phụ trách. Ai nhận lại sẽ nhận đúng hồ sơ này, không tạo bản trùng.</li>
                <li>· Công ty rời khỏi danh sách và KPI của bạn, không còn nhắc idle.</li>
                <li>· Không cần lý do — đây là việc thường ngày, và đảo ngược được bằng “Nhận lại công ty”.</li>
              </ul>
              <p className="rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800">
                Chỉ dùng khi công ty <b>vẫn tồn tại</b> nhưng không còn tiềm năng. Công ty đã <b>phá sản, giải thể, sáp nhập, trùng lặp hoặc bị ngừng phục vụ</b> thì phải <b>Archive</b> — trả về bể dữ liệu sẽ khiến một sales khác nhận lại và gọi vào một công ty không còn tồn tại.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={() => setReleaseOpen(false)} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Huỷ</button>
              <button onClick={() => { setReleased(true); setReleaseOpen(false) }} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Trả về bể dữ liệu</button>
            </div>
          </div>
        </div>
      )}

      {archiveOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[480px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-[15px] font-bold">Archive {coLabel(c)}?</p>
              <button onClick={() => setArchiveOpen(false)} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[12px] text-muted">Archiving <b className="text-ink/80">hides the company from active lists, blocks its logins and hides its jobs</b>. It’s reversible (Unarchive) and never deletes the record or its audit trail.</p>
              {(noProducts && team.length <= 1) ? (
                <p className="flex gap-2 rounded-md bg-canvas px-3 py-2.5 text-[11.5px] leading-relaxed text-muted"><span>🧹</span><span>This looks like an empty shell (no products, {team.length} user) — safe to archive.</span></p>
              ) : (
                <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span>⚠️</span><span>This company has {noProducts ? '' : 'active products and '}{team.length} users. <b>Move its users into the surviving company first</b> — don’t strand a real account.</span></p>
              )}
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Lý do <span className="text-rose-500">*</span></p>
                <div className="space-y-1">
                  {ARCHIVE_REASONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setArchiveWhy(r.key)}
                      className={cn('flex w-full gap-2 rounded-md border px-2.5 py-1.5 text-left', archiveWhy === r.key ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand/40')}
                    >
                      <span className={cn('mt-[3px] grid h-3 w-3 shrink-0 place-items-center rounded-full border-2', archiveWhy === r.key ? 'border-brand' : 'border-line')}>
                        {archiveWhy === r.key && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                      </span>
                      <span className="min-w-0">
                        <span className={cn('block text-[12px]', archiveWhy === r.key ? 'font-semibold text-brand' : 'text-ink/80')}>{r.vi}</span>
                        {archiveWhy === r.key && r.note && <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">{r.note}</span>}
                      </span>
                    </button>
                  ))}
                </div>
                <textarea rows={2} placeholder="Ghi chú thêm (tuỳ chọn) — vd. đã chuyển user sang Công ty TNHH Vạn Phát" className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12px] text-ink placeholder:text-faint" />
                <p className="mt-1 text-[10.5px] text-faint">Ghi vào audit log kèm tên bạn và thời điểm.</p>
              </div>
              <p className="rounded-md bg-canvas/70 px-3 py-2 text-[10.5px] leading-relaxed text-muted">
                Câu hỏi để chọn đúng cửa: <b className="text-ink/70">có nên để sales khác nhận lại công ty này không?</b>
                {' '}Còn tồn tại nhưng hết tiềm năng → <b className="text-ink/70">Trả về bể dữ liệu</b>.
                {' '}Không còn tồn tại, hoặc không được phục vụ nữa → <b className="text-ink/70">Archive</b>, và dòng trong Danh bạ <b className="text-ink/70">không mở lại</b> nên không ai nhận nhầm.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={() => setArchiveOpen(false)} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
              <button
                disabled={!archiveWhy}
                title={archiveWhy ? undefined : 'Chọn lý do trước'}
                onClick={() => { setArchived(true); setArchiveOpen(false) }}
                className={cn('rounded-lg px-4 py-2 text-[13px] font-semibold text-white', archiveWhy ? 'bg-rose-600 hover:opacity-90' : 'cursor-not-allowed bg-rose-600/40')}
              >Archive company</button>
            </div>
          </div>
        </div>
      )}

      {/* at-a-glance stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <MembershipStat c={c} />
        <MiniStat label="Customer since" value={c.since.slice(-4)} sub={c.since} />
        <MiniStat label="Open jobs" value={c.jobPosting ? activeJobs : '—'} sub={c.jobPosting ? `${jobs.length} total` : 'No Job Posting'} />
        <MiniStat label="Team" value={`${team.length}/${MAX_SEATS}`} sub="seats used" tone={full ? 'warn' : undefined} />
        {/* A free job draws on NO quota, so a company posting only free jobs has
            none — and "n/a" is the honest reading, not "0 slots left". */}
        <MiniStat label="Job quota" value={c.jobPosting ? `${c.jobLeft}/${c.jobTotal}` : '—'} sub={c.jobPosting ? 'slots left' : freeJobs > 0 ? 'chỉ tin miễn phí' : 'n/a'} tone={c.jobPosting && c.jobLeft / c.jobTotal < 0.3 ? 'warn' : undefined} />
        <MiniStat label="CV unlocks" value={c.resumeSearch ? `${c.cvLeft}/${c.cvTotal}` : '—'} sub={c.resumeSearch ? 'left' : 'n/a'} tone={c.resumeSearch && c.cvLeft / c.cvTotal < 0.3 ? 'warn' : undefined} />
        <MiniStat label="Sales owner" value={<span className="text-[12.5px]">{c.owner.split(' ').slice(-2).join(' ')}</span>} sub="from CRM" />
      </div>

      <CoTabBar tabs={tabs} active={tab} onSelect={setTab} />

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {/* Overview = who they are (left, narrow) + what we have done with them
          (right, wide). Products & quota and Team are NOT repeated here — they own
          the "Products & billing" and "Users" tabs. Activities is the primary
          section: it is what a rep actually opens this record for. */}
      {tab === 'Overview' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <div className="min-w-0 space-y-4">
            {/* Mirrors the New-company form field-for-field, in the same order, so a
                rep never wonders where something they typed went. */}
            <DetailCard
              title="Basic info — from CRM"
              action={
                editInfo
                  ? (
                    <span className="flex items-center gap-1.5">
                      <button onClick={() => setEditInfo(false)} className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-muted hover:border-ink/40">Cancel</button>
                      <button onClick={() => setEditInfo(false)} className="rounded-md bg-brand px-2 py-0.5 text-[11px] font-semibold text-white hover:opacity-90">Save</button>
                    </span>
                  )
                  : ro ? undefined : <button onClick={() => setEditInfo(true)} className="text-[11px] text-brand hover:underline">Edit</button>
              }
            >
              {/* SAME GROUPS, SAME ORDER AS THE NEW-COMPANY FORM — Thông tin xuất hóa
                  đơn → Thông tin cơ bản → Sales. (Company verification document and
                  Primary contact are the form's other two groups; on this page they
                  are the CompanyDocs card below and the Contacts tab.) A rep fills the
                  form once and reads this card for years; the same headings in the
                  same order is what makes "where did the thing I typed go" a question
                  nobody has to ask. Editing is one toggle for the whole card, not a
                  pencil per row — 20 inline editors is 20 chances to half-save one. */}

              <KV label="Company ID" value={companyId(coKey(c))} />
              <CardGroup title="Thông tin xuất hóa đơn" first />
              {editInfo ? (
                <>
                  <SelectRow label="Phân loại người mua" value={BUYER_TYPE[c.buyerType ?? 'dn-vn'].vi} onChange={() => {}} options={(Object.keys(BUYER_TYPE) as BuyerType[]).map((k) => BUYER_TYPE[k].vi)} hint="Quyết định giấy tờ nào bắt buộc và dòng nào in trên hóa đơn VAT." />
                  <EField label="Tên đơn vị / Legal name" value={c.legalName} onChange={() => {}} />
                  <EField label="Mã số thuế (MST)" value={c.tax} onChange={() => {}} />
                  {BUYER_TYPE[c.buyerType ?? 'dn-vn'].needsIdCard && (
                    <>
                      <EField label="Số CCCD" value={c.idCard ?? ''} onChange={() => {}} />
                      <EField label="Họ tên người mua hàng" value={c.buyerName ?? ''} onChange={() => {}} />
                    </>
                  )}
                  <EField label="Địa chỉ xuất hóa đơn" value={c.address} onChange={() => {}} hint="In nguyên văn trên báo giá, đơn hàng và hóa đơn VAT." />
                </>
              ) : (
                <>
                  <KV label="Phân loại người mua" value={BUYER_TYPE[c.buyerType ?? 'dn-vn'].vi} />
                  <KV label="Tên đơn vị / Legal name" value={c.legalName} />
                  {/* The identifier that applies to THIS buyer type, and only that
                      one — MST for a company, CCCD for an individual. */}
                  {BUYER_TYPE[c.buyerType ?? 'dn-vn'].tax === 'req'
                    ? <KV label="Mã số thuế (MST)" value={c.tax} />
                    : <KV label="Mã số thuế (MST)" value={c.tax?.trim() || '— (không áp dụng)'} />}
                  {BUYER_TYPE[c.buyerType ?? 'dn-vn'].needsIdCard && (
                    <>
                      <KV label="Số CCCD" value={c.idCard || '—'} />
                      <KV label="Họ tên người mua hàng" value={c.buyerName || '—'} />
                    </>
                  )}
                  {c.buyerType === 'ca-nhan' && (
                    <KV label="Họ tên người mua hàng" value={`${RETAIL_BUYER} — hệ thống tự điền`} />
                  )}
                  {BUYER_TYPE[c.buyerType ?? 'dn-vn'].noAddress
                    ? <KV label="Địa chỉ xuất hóa đơn" value="— (không in trên hóa đơn: bán cho người tiêu dùng)" />
                    : <KV label="Địa chỉ xuất hóa đơn" value={c.address} />}
                </>
              )}

              <CardGroup title="Thông tin cơ bản" />
              {/* Country always, Vietnamese province only for a Vietnamese company —
                  the same rule the form uses. */}
              {editInfo ? (
                <>
                  <EField label="Tên hiển thị" value={c.shortName} onChange={() => {}} hint="Tên thương hiệu ứng viên biết — hiện trên trang công ty và mọi thẻ việc làm. Bỏ trống thì dùng tên pháp lý." />
                  {/* Industry and size are two different facts, filtered separately —
                      never joined into one "IT, 200–500" field. */}
                  <SelectRow label="Industry" value={c.industry} onChange={() => {}} options={MD_DOMAINS.find((d) => d.key === 'industry')?.entries ?? []} />
                  <SelectRow label="Company size" value={c.size} onChange={() => {}} options={CO_SIZES} />
                  <SelectRow label="Quốc gia đăng ký / Country of registration" value={c.country} onChange={() => {}} options={MD_DOMAINS.find((d) => d.key === 'country')?.entries ?? []} />
                  {isVNCompany(c) && <SelectRow label="Tỉnh / Thành phố · City" value={coCity(c)} onChange={() => {}} options={MD_DOMAINS.find((d) => d.key === 'locations')?.entries ?? []} />}
                  <EField label="Website" value={c.domain} onChange={() => {}} mono />
                </>
              ) : (
                <>
                  <KV label="Tên hiển thị" value={c.shortName?.trim() || '— (dùng tên pháp lý)'} />
                  <KV label="Industry" value={c.industry} />
                  <KV label="Company size" value={`${c.size} staff`} />
                  <KV label="Quốc gia đăng ký / Country of registration" value={c.country} />
                  {isVNCompany(c)
                    ? <KV label="Tỉnh / Thành phố · City" value={coCity(c)} />
                    : <KV label="Tỉnh / Thành phố · City" value="— (không phải công ty Việt Nam · xem Địa chỉ xuất hóa đơn)" />}
                  <KV label="Website" value={c.domain} link />
                </>
              )}

              <CardGroup title="Sales" />
              {editInfo ? (
                <>
                  <SelectRow label="Lead source" value={coLeadSource(c)} onChange={() => {}} options={LEAD_SOURCES} />
                  <SelectRow label="Sales owner" value={c.owner} onChange={() => {}} options={[...new Set(COMPANIES.map((x) => x.owner))]} />
                </>
              ) : (
                <>
                  <KV label="Lead source" value={coLeadSource(c)} />
                  <KV label="Sales owner" value={c.owner} />
                </>
              )}
              {/* Captured on the New-company form as pre-sale INTENT. Kept here so it does
                  not vanish after creation — what they actually bought lives on the
                  Products & billing tab, which is a different fact. */}
              <div className="border-b border-line-soft py-2">
                <p className="text-[10.5px] uppercase tracking-wide text-faint">Products interested</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {!c.jobPosting && !c.resumeSearch && <span className="text-[12px] text-faint">— not recorded</span>}
                  {c.jobPosting && <span className="rounded border border-brand/30 bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">Job Posting</span>}
                  {c.resumeSearch && <span className="rounded border border-brand/30 bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">Resume Search</span>}
                </div>
              </div>
              {editInfo
                ? <><EField label="Estimated deal value (₫)" value={String(coValue(c))} onChange={() => {}} /><EField label="Description" value={c.note} onChange={() => {}} /></>
                : <><KV label="Estimated deal value" value={vnd(coValue(c))} /><KV label="Description" value={c.note} /></>}

              {/* DETAIL MIRRORS CREATE, FIELD FOR FIELD. Anything the create form does
                  not ask for is not shown here either — no "entered elsewhere" group.
                  What used to sit in one: tên hiển thị, company tags, industry, số
                  nhân viên and ngày thành lập are edited on the Company page tab and
                  read there; loại hình, tình trạng MST, người đại diện and công ty mẹ
                  are no longer surfaced on this card at all. */}
              {/* Contact person / email / phone deliberately NOT here — they live on the
                  Contacts tab, where a company can have several with their own statuses.
                  Duplicating the primary one here guarantees the two drift apart. */}
            </DetailCard>
            <CompanyDocs c={c} />
            {/* Owner history moved to its own tab — see the tab strip above. */}
            <AffiliatedCompanies c={c} onOpen={onOpen} />
          </div>

          {/* activity composer + full trail — the key section, so it gets the wider side */}
          <CompanyActivities c={c} />
        </div>
      )}

      {/* ── Owner history — who held the account when, and who moved it ───── */}
      {/* Deliberately NARROW rather than stretched to the tab width: the chain is a
          timeline of short rows, and at 1700px each entry becomes a name at the far
          left with a date at the far right and nothing between them. */}
      {tab === 'Owner history' && (
        <div className="max-w-[620px]">
          <div className="mb-2">
            <p className="text-[13px] font-semibold text-ink">Owner history <span className="font-normal text-muted">— one current owner, and every handover before it</span></p>
            <p className="text-[11px] text-faint">Append-only. Quotations, sales targets and commission all reference who owned the account at the time, so a past tenure is never edited to tidy it up.</p>
          </div>
          <OwnerHistory c={c} />
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────────────────── */}
      {/* ── Contacts — people we do business with (may have no login) ────── */}
      {tab === 'Contacts' && (
        <div>
          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">Contact people <span className="font-normal text-muted">— who we do business with</span></p>
                <p className="text-[11px] text-faint">Owned by Sales. A contact does not need a login, and is never created from one.</p>
              </div>
              {!ro && <button onClick={() => setAddingContact(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Add contact</button>}
            </div>
            {/* No Actions column: the name is the link and every action lives in the
                contact panel, so the row stays scannable and the note gets the width. */}
            {/* Every field the Add-contact form captures has a column here: name,
                role flags, title, email, PHONE, status and note. A field worth
                asking for is a field worth showing — otherwise the rep types a
                phone number and then has to open the record to read it back. */}
            <Table
              minW={1320}
              cols={[
                { label: 'Contact', w: '1.4fr' },
                { label: 'Title', w: '1.1fr' },
                { label: 'Email', w: '1.4fr' },
                { label: 'Phone', w: '0.9fr' },
                { label: 'Status', w: '1fr' },
                { label: 'Has login?', w: '0.7fr' },
                { label: 'Note', w: '1.8fr' },
              ]}
              rows={companyContacts(c).map((p) => [
                <button onClick={() => setContactOpen(p)} className="block min-w-0 max-w-full text-left">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium text-brand hover:underline">{p.name}</span>
                    {p.primary && <span className="shrink-0 rounded border border-brand/30 bg-brand-soft px-1 py-0.5 text-[9.5px] font-semibold text-brand">PRIMARY</span>}
                    {p.billing && <span className="shrink-0 rounded border border-line bg-canvas px-1 py-0.5 text-[9.5px] font-semibold text-muted" title="Receives quotations & invoices">BILLING</span>}
                    {p.decisionMaker && <span className="shrink-0 text-[10px] text-faint" title="Decision maker">◆</span>}
                  </span>
                </button>,
                <span className="truncate text-[11.5px] text-muted">{p.title}</span>,
                <span className="truncate font-mono text-[11px] text-muted" title={p.email}>{p.email}</span>,
                <span className="truncate font-mono text-[11px] text-muted">{p.phone}</span>,
                <span title={CONTACT_STATUS[p.status].hint}><Pill tone={CONTACT_STATUS[p.status].tone}>{p.status}</Pill></span>,
                p.linkedUser
                  ? <span className="text-[11px] text-emerald-700">linked</span>
                  : <span className="text-[11px] text-faint">no login</span>,
                <span className="truncate text-[11.5px] text-muted" title={p.note}>{p.note}</span>,
              ])}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              Click a name to open the contact — every action (edit, change status, invite as user, find successor) lives there. Five statuses, each one an instruction: <b>Active</b> contact normally · <b>Needs verifying</b> fix the details first · <b>Paused</b> wait until the resume date · <b>No longer here</b> find the successor · <b>Do not contact</b> no outreach at all. Exactly one contact is <b>PRIMARY</b> (quotations) and one is <b>BILLING</b> (invoices) — often two different people.
            </p>
          </div>

          <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
            Contacts and <b>Users</b> are <b>independent lists</b>. A contact can exist with no login (the accountant who only receives invoices); a user can exist with no contact record (an HR Specialist the customer invited themselves). Where they are the same human the rows are <b>linked</b> — but neither list is generated from the other, and deleting one never touches the other.
          </p>
        </div>
      )}

      {/* ── Users — logins on the Company site (the account's 4 seats) ────── */}
      {tab === 'Users' && (
        <div>
          <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">Login users <span className="font-normal text-muted">— who can sign in to the Company site</span></p>
              <p className="text-[11px] text-faint">Owned by the customer’s HR Manager. Consumes a seat; may be someone Sales never met.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn('text-[11px] font-medium', full ? 'text-amber-700' : 'text-faint')}>{team.length}/{MAX_SEATS} seats</span>
              {!ro && <button onClick={() => setInviting(true)} disabled={full} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">+ Invite user</button>}
            </div>
          </div>
          {noProducts && <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">Subscription expired — logins remain but are read-only until the account is renewed.</p>}
          <Table
            cols={[{ label: 'User', w: '1.6fr' }, { label: 'Role', w: '1fr' }, { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.5fr', align: 'r' }]}
            rows={team.map((u) => [
              <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p><p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p></div>,
              <Pill tone={u.role === 'Admin' ? 'neutral' : 'draft'}>{u.role}</Pill>,
              <Pill tone={u.status === 'Active' ? 'active' : 'pending'}>{u.status}</Pill>,
              <span className="text-[11.5px] text-muted">{u.last}</span>,
              // Managing another rep's customer's logins is a write, so the whole
              // Actions cell collapses to "—" rather than showing dead buttons.
              ro
                ? <span className="text-[11px] text-faint" title={RO_HINT}>—</span>
                : u.status === 'Invited'
                ? <><RowAction tone="brand">Resend</RowAction><RowAction tone="rose">Cancel</RowAction></>
                : u.role === 'Admin'
                  ? <RowAction>Change role</RowAction>
                  : <><RowAction>Change role</RowAction><RowAction tone="rose">Disable</RowAction></>,
            ])}
          />
          <p className="mt-2 text-[11px] leading-relaxed text-faint">Each user is assigned a role. Remove = disable (never hard-delete) — the last Admin can’t be disabled; assign Admin to someone else first. A self-signup requesting to join appears here for the Admin to approve.</p>
          <CoRoleBuilder />
          </div>
          <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
            A seat is a <b>login</b>, not a relationship. Someone here may never appear under <b>Contacts</b> (the customer invited them without telling us), and a contact may never need a seat. Rows for the same human are <b>linked</b> in both directions.
          </p>
        </div>
      )}

      {/* ── Products & billing ───────────────────────────────────────────── */}
      {tab === 'Products & billing' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <DetailCard title="Products & quota">
            <ProductsQuota c={c} />
          </DetailCard>
          {/* Manual services sit next to the metered quota, not inside it: the
              numbers look the same to a reader, but one is observed and the other
              is asserted by a person. */}
          <ServiceUsageCard c={c} />
          {/* PO history, not "billing history": the PO is the document a rep and a
              customer both refer to, and one row per PO is one row per thing that
              was actually bought. Order / Invoice / Payment as three separate rows
              was one purchase told three times.
              No STATUS column — a PO only reaches this list once it is invoiced, so
              every row had the same value. The invoice DATE is the useful fact, and
              it doubles as "has it been invoiced yet". */}
          <DetailCard title="PO history" action={poHistory(c).length > 1 ? <span className="text-[11px] text-faint">{poHistory(c).length} PO</span> : undefined}>
            {poHistory(c).length === 0 ? (
              <>
                <p className="text-[12px] text-muted">Chưa có PO nào. PO xuất hiện ở đây ngay khi Sales phát hành đơn hàng từ báo giá khách đã chốt.</p>
                {/* The case this card used to have no answer for: jobs are live, but
                    no document exists. Saying it here stops a reader concluding the
                    list is broken — or worse, that a PO was lost. */}
                {freeJobs > 0 && (
                  <p className="mt-2 rounded-md border border-dashed border-amber-300 bg-amber-50/60 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
                    Công ty này đang có <b>{freeJobs} tin miễn phí</b> đang chạy nhưng <b>không có PO nào</b> — và đúng như vậy: tin miễn phí là Admin đăng mà <b>không chọn PO</b>, nên không có báo giá, không có PO, không có hoá đơn.
                    <span className="mt-0.5 block text-amber-800/85">Không trừ quota nào, không tính doanh thu, không tính hạng — xem cột <b>Trừ từ</b> ở tab Jobs.</span>
                  </p>
                )}
              </>
            ) : (
              <Table
                cols={[
                  { label: 'PO', w: '1.2fr' },
                  { label: 'Sản phẩm trong PO', w: '1.8fr' },
                  { label: 'Giá trị', w: '0.9fr', align: 'r' },
                  { label: 'Ngày xuất HĐ', w: '0.95fr', align: 'r' },
                  // With two live POs, "when does it run out" is the column that
                  // tells a rep which one to renew first.
                  { label: 'Hạn dùng', w: '0.9fr', align: 'r' },
                ]}
                rows={poHistory(c).map((o) => [
                  <span className="truncate font-mono text-[11.5px] text-brand">{o.po}</span>,
                  <span className="truncate text-muted" title={o.products}>{o.products}</span>,
                  <span className="tabular-nums">{o.amount}</span>,
                  o.invoiced
                    ? <span className="tabular-nums text-muted">{o.invoiced}</span>
                    : <span className="text-[10.5px] text-amber-600">chưa xuất</span>,
                  o.until
                    ? <span className="tabular-nums text-muted">{o.until}</span>
                    : <span className="text-[10.5px] text-faint">—</span>,
                ])}
              />
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              Mỗi quota đã mua đều truy về <b className="text-muted">một PO đã trả tiền</b> — cấp tự động khi xuất hoá đơn VAT, không ai chọn tay.
              Ngoại lệ là <b className="text-muted">tin miễn phí</b>: Admin đăng mà không chọn PO, nên nó không xuất hiện ở đây và <b className="text-muted">không cần xuất hiện</b> — chỉ hiện trên từng tin ở tab Jobs.
            </p>
          </DetailCard>
        </div>
      )}

      {/* ── Company page ─────────────────────────────────────────────────── */}
      {tab === 'Company page' && (
        <DetailCard
          title="Company detail page (jobseeker)"
          action={<Pill tone={c.hasPage ? 'active' : 'pending'}>{c.hasPage ? 'Published' : 'Draft'}</Pill>}
        >
          <CompanyPageEditor c={c} />
        </DetailCard>
      )}

      {/* ── Jobs ─────────────────────────────────────────────────────────── */}
      {tab === 'Jobs' && (
        <div>
          {/* A free job needs NO product and NO PO, so "no product" can no longer
              mean "no jobs" — the gate has to check for jobs, not for entitlement. */}
          {!c.jobPosting && jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">
              This account has no Job Posting product — it can only be posted for free by Admin (no PO). Resume-Search-only customers are invisible to jobseekers.
            </p>
          ) : jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">No jobs posted yet.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11.5px] text-muted">
                  <b className="text-ink">{activeJobs}</b> active · <b className="text-ink">{jobs.length}</b> total
                  {c.jobTotal > 0 && <> — using <b className="text-ink">{c.jobTotal - c.jobLeft}/{c.jobTotal}</b> posting slots</>}
                  {/* Free jobs are counted apart from slots, because they consumed none. */}
                  {freeJobs > 0 && <> · <b className="text-amber-700">{freeJobs} tin miễn phí</b> (không PO, không trừ slot)</>}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by status</span>
              </div>
              <Table
                cols={[
                  { label: 'Job title', w: '2fr' },
                  // Which bucket this posting was deducted from. Assigned in the same
                  // order the quota drains, so this column and the billing tab can
                  // never disagree — and "free or paid?" is answered per job, which
                  // is where the question is actually asked.
                  { label: 'Trừ từ', w: '1.2fr' },
                  { label: 'Status', w: '1fr' },
                  { label: 'Applicants', w: '0.85fr', align: 'r' },
                  { label: 'Deadline', w: '0.95fr', align: 'r' },
                  { label: 'Actions', w: '0.9fr', align: 'r' },
                ]}
                rows={jobs.map((j, i) => {
                  const src = jobSrc[i]
                  return [
                    <div className="min-w-0"><p className="truncate font-medium text-ink">{j.title}</p><p className="text-[11px] text-faint">Posted {j.posted}</p></div>,
                    src
                      ? (src.kind === 'free'
                          ? <span className="min-w-0" title="Admin đăng mà không chọn PO — Tin Free (Admin đăng hộ). Không trừ quota, không hoá đơn.">
                              <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-amber-800">Miễn phí</span>
                              <span className="mt-0.5 block truncate text-[10px] text-faint">không chọn PO</span>
                            </span>
                          : <span className="min-w-0 truncate font-mono text-[10.5px] text-brand" title={`${src.label} · hạn ${src.until}`}>{src.label}</span>)
                      : <span className="text-[10.5px] text-faint">—</span>,
                    <Pill tone={j.status}>{j.statusLabel}</Pill>,
                    <span className="tabular-nums">{j.applicants || '—'}</span>,
                    <span className="tabular-nums text-muted">{j.deadline}</span>,
                    <RowAction>View</RowAction>,
                  ]
                })}
              />
              <p className="mt-2 text-[11px] leading-relaxed text-faint">
                Jobs this account posted (HQ oversight). Company posts go live directly — manage them from Recruitment → Jobs.
                <b className="text-muted"> Trừ từ</b> nói tin này tiêu quota của nguồn nào — cùng thứ tự trừ với thẻ Products &amp; quota, nên hai chỗ không bao giờ nói khác nhau.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Applications (employer view, mirrored for HQ) ─────────────────── */}
      {tab === 'Applications' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">Applications received across this account’s jobs — <b className="text-ink">the same list the company sees on their site</b>.</p>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by job / stage</span>
          </div>
          <Table
            cols={[{ label: 'Candidate', w: '1.4fr' }, { label: 'Applied to', w: '1.8fr' }, { label: 'Stage', w: '1fr' }, { label: 'Applied', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1fr', align: 'r' }]}
            rows={companyApplicants(c).map((a) => [
              <span className="truncate font-medium text-ink">{a.name}</span>,
              <span className="truncate text-muted">{a.job}</span>,
              <Pill tone={a.tone}>{a.stage}</Pill>,
              <span className="text-[11.5px] text-muted">{a.applied}</span>,
              <RowAction>View CV</RowAction>,
            ])}
          />
          <p className="mt-2 text-[11px] text-faint">Read-only for HQ — HQ never moves a company’s candidates through their pipeline, and opening a candidate’s CV is written to the audit log.</p>
        </div>
      )}

      {/* ── Resumes (CV unlocks) ─────────────────────────────────────────── */}
      {tab === 'Resumes' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">CVs this account <b className="text-ink">unlocked from Resume Search</b> — the same list the employer sees on their site. Uses <b className="text-ink">{c.cvTotal - c.cvLeft}/{c.cvTotal}</b> unlocks.</p>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by user</span>
          </div>
          <Table
            cols={[{ label: 'Candidate', w: '1.3fr' }, { label: 'Headline', w: '1.8fr' }, { label: 'Unlocked by', w: '1fr' }, { label: 'When', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '0.9fr', align: 'r' }]}
            rows={companyResumeViews(c).map((r) => [
              <span className="truncate font-medium text-ink">{r.name}</span>,
              <span className="truncate text-muted">{r.headline}</span>,
              <span className="truncate text-[11.5px]">{r.by}</span>,
              <span className="text-[11.5px] text-muted">{r.when}</span>,
              <RowAction>Open CV</RowAction>,
            ])}
          />
          <p className="mt-2 text-[11px] text-faint">Each unlock spends 1 from the pooled CV-unlock quota and is written to the immutable audit log.</p>
        </div>
      )}

      {/* ── Activities (log chat / call + timeline) ──────────────────────── */}

      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {contactOpen && <ContactDetail p={contactOpen} c={c} onClose={() => setContactOpen(null)} />}
      {addingContact && <AddContactModal c={c} onClose={() => setAddingContact(false)} />}
      {quoting && <NewQuotationModal company={c.name} onClose={() => setQuoting(false)} />}
    </div>
    </ReadOnlyCtx.Provider>
  )
}
