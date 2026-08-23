import { useContext, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { RO_HINT, ReadOnlyCtx, ScreenNavCtx, useDetailCrumb } from '@/pages/admin/ctx'
import { AC_STATUS, BUYER_TYPE, COMPANIES, LEAD_SOURCES, RETAIL_BUYER, coCity, coKey, coLabel, coLeadSource, coValue, inPipeline, isVNCompany } from '@/pages/admin/data/companies'
import type { BuyerType, Company } from '@/pages/admin/data/companies'
import { ARCHIVE_REASONS, CO_SIZES, archiveReason } from '@/pages/admin/data/companyPage'
import { CONTACT_STATUS, MAX_SEATS, companyApplicants, companyContacts, companyJobs, companyResumeViews, companyTeam, jobSources, poHistory } from '@/pages/admin/data/companyRecord'
import { CO_TABS } from '@/pages/admin/data/companyRecord'
import type { CoContact, CoTab } from '@/pages/admin/data/companyRecord'
import { CLAIM_REQS } from '@/pages/admin/data/directory'
import type { DirRow } from '@/pages/admin/data/directory'
import { ClaimChain, pendingClaims } from '@/pages/admin/screens/directory/assign'
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
import { MembershipStat, ProductsQuota } from '@/pages/admin/screens/companies/products'
import { CoTabBar } from '@/pages/admin/screens/companies/tabBar'
import { CoRoleBuilder, InviteUserModal } from '@/pages/admin/screens/companies/users'
import { NewQuotationModal } from '@/pages/admin/screens/sales/newQuotation'
import { CardGroup, DetailCard, EField, KV, SelectRow } from '@/pages/admin/ui/fields'
import { RowAction } from '@/pages/admin/ui/list'
import { MiniStat } from '@/pages/admin/ui/stats'
import { Pill, TierPill } from '@/pages/admin/ui/status'
import { Table } from '@/pages/admin/ui/table'

/* One page for both a CRM company and a Danh bạ row.
   A pool row is shown on THIS page, not a lookalike of it: the reader is answering
   the same question ("who is this company?") and a second page drifts from this one
   the first time a field is added. What the pool variant does is SUBTRACT — one tab,
   no customer pills, no writes — because a company nobody owns has no pipeline, no
   quota, no contacts and no activity to show. */
export function CompanyDetail({ c, onBack, onOpen, viewer = ME, pool, onClaim, poolAssign }: { c: Company; onBack: () => void; onOpen?: (x: Company) => void; viewer?: string; pool?: DirRow; onClaim?: () => void; /** admin's assign-to-a-sales block, injected by the Danh bạ screen so this page stays unaware of claims */ poolAssign?: React.ReactNode }) {
  const isPool = Boolean(pool)
  const goTo = useContext(ScreenNavCtx)
  const decidedNone = (co: string) => !CLAIM_REQS.some((r) => r.co === co)
  /* `?tab=<name>` lands on a specific tab. Same reason as `?record=`: a link to a
     demo has to open ON the thing being demonstrated, not one click away from it. */
  const [params] = useSearchParams()
  const [tab, setTab] = useState<CoTab>(() => {
    const want = params.get('tab')
    return (CO_TABS.find((t) => t.toLowerCase() === want?.toLowerCase()) ?? 'Overview') as CoTab
  })
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
  /* Lifecycle actions live behind one ⋯ rather than as two buttons in the header.
     They are rare and mutually exclusive — a record is worked, released, or
     archived — so two permanent buttons competed for attention with the one action
     that IS routine (Tạo báo giá) and made the header read as a row of equals. */
  const [moreOpen, setMoreOpen] = useState(false)
  /* Reached from search rather than owned. Read everything, write nothing — see
     ReadOnlyCtx. Editing state is force-closed so a rep cannot leave the card in
     edit mode and come back to it on someone else's record. */
  /* Read-only when you are NOT the sales owner: you can view everything and LOG
     ACTIVITY (that stays open — see CompanyActivities), but you cannot EDIT the
     record's own fields. Owner is resolved against the signed-in viewer. */
  // Nobody owns a pool row, so every write is off — the same read-only rule applies,
  // not a second one.
  const ro = isPool || c.owner !== viewer
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

  /* ONE tab strip for both kinds of record. A pool row is not a different species:
     a CRM company can be RELEASED back to the pool, arriving here with contacts,
     POs and an owner chain behind it — so the layouts must match, or the same
     company changes shape when it changes list. A fresh import simply shows the
     tabs' normal empty states. */
  const tabs: { key: CoTab; label: string; count?: number }[] = [
    { key: 'Overview', label: 'Overview' },
    { key: 'Contacts', label: 'Contacts', count: isPool ? undefined : companyContacts(c).length },
    { key: 'Users', label: 'Users', count: isPool ? undefined : team.length },
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


  /* Pool tabs keep the CRM layout but never fabricate content to fill it — the
     synthesised sample contacts/users the CRM record uses would print invented
     people on a company nobody has worked yet. Each tab states what will put real
     data here instead. */
  const PoolEmpty = ({ children }: { children: React.ReactNode }) => (
    <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] leading-relaxed text-muted">{children}</p>
  )

  return (
    <ReadOnlyCtx.Provider value={ro}>
    <div>

      {/* Reached from the search, not from my own book. Reading a colleague's record
          is allowed and useful — it is what stops a duplicate being created. ACTING
          on it is not, and saying so here is what makes the read-only rule legible
          instead of a mystery when a button does nothing. */}
      {isPool ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2 text-[11.5px]">
          <span className="text-amber-900">Đây là công ty trong <b className="font-medium">Danh bạ doanh nghiệp</b> — <b className="font-medium">chưa phải khách hàng</b>, chưa có sales phụ trách, không đếm vào bất kỳ số nào của CRM. Chỉ đọc.</span>
          {onClaim && (
            <button onClick={onClaim} className="ml-auto shrink-0 rounded-md border border-brand/40 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand hover:border-brand">Xin nhận</button>
          )}
        </div>
      ) : ro && (
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
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">{isPool ? 'Danh bạ doanh nghiệp' : 'Company account'}</p>
            <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
              {c.name}
              {/* Both axes, always: customer status (has it ever bought) and, only
                  while a deal is live, the pipeline stage. */}
              {isPool
                ? <Pill tone={pool!.state === 'pending' ? 'pending' : 'draft'}>{pool!.state === 'pending' ? `Đang chờ duyệt${(pool!.reqs ?? 1) > 1 ? ` · ${pool!.reqs} yêu cầu` : ''}` : 'Chưa ai nhận'}</Pill>
                : <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>}
              {archived && <Pill tone="expired">Archived{archiveWhy ? ` · ${archiveReason(archiveWhy)?.vi}` : ''}</Pill>}
              {/* Grey, not amber: released is a settled lifecycle state, not something
                  needing attention today — same channel as Archived. See CRM →
                  "Status colour — red is reserved for act today". */}
              {released && !archived && <Pill tone="expired">Đã trả về bể dữ liệu</Pill>}
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
              {!isPool && (inPipeline(c) || c.status === 'Lost') && <PipelineStatusPicker c={c} />}
              {/* third axis — only rendered once a tier is actually earned, so the
                  header never carries a "chưa có hạng" non-fact. */}
              {!isPool && tierOf(c) && <TierPill tier={tierOf(c)} en />}
            </h2>
            {/* A pool row has no Company ID and no verified legal name, so the
                subtitle carries only what the source actually gave us — and marks the
                MST as unverified rather than printing it like a fact. */}
            {isPool ? (
              <p className="text-[11.5px] text-muted">
                {pool!.addr ?? 'chưa rõ địa chỉ'}
                {pool!.industry && <> · {pool!.industry}</>}
                {' · MST '}
                {pool!.tax ? <span className="font-mono text-amber-700">{pool!.tax} ⚠ chưa xác minh</span> : <span className="text-faint">chưa có</span>}
                {pool!.web && <> · <span className="font-mono">{pool!.web}</span></>}
              </p>
            ) : (
              <p className="text-[11.5px] text-muted"><span className="font-mono font-medium text-ink/70">{companyId(coKey(c))}</span> · {c.legalName} · MST {c.tax} · <span className="font-mono">{c.domain}</span></p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {/* Edit and Create-quotation are WRITES — withdrawn on someone else's
              record. "View on jobseeker" is a read, so it stays. */}
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
          {/* TWO EXITS behind one ⋯ — the question that picks between them is
              "should another rep be allowed to pick this up?". Yes → back to the
              pool. No → archive. Both are rare; neither deserves header real estate
              next to the action a rep actually performs every week. */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen((o) => !o)}
              title="Hành động khác"
              className={cn('grid h-[30px] w-[30px] place-items-center rounded-lg border text-[16px] leading-none', moreOpen ? 'border-brand text-brand' : 'border-line text-muted hover:border-ink/40 hover:text-ink')}
            >⋯</button>
            {moreOpen && (
              <>
                <span className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-[248px] overflow-hidden rounded-lg border border-line bg-surface py-1 text-left shadow-lg">
                  {archived ? (
                    <MoreItem onClick={() => { setArchived(false); setMoreOpen(false) }} label="Bỏ lưu trữ" hint="Đưa công ty trở lại danh sách hoạt động." />
                  ) : (
                    <>
                      {!ro && (released
                        ? <MoreItem onClick={() => { setReleased(false); setMoreOpen(false) }} label="Nhận lại công ty" hint="Nhận lại quyền phụ trách; dòng trong Danh bạ về Đã nhận." />
                        : <MoreItem onClick={() => { setReleaseOpen(true); setMoreOpen(false) }} label="Trả về bể dữ liệu" hint="Còn tồn tại nhưng hết tiềm năng — sales khác có thể nhận lại." />
                      )}
                      <span className="my-1 block border-t border-line-soft" />
                      <MoreItem danger onClick={() => { setArchiveOpen(true); setMoreOpen(false) }} label="Lưu trữ công ty" hint="Không còn tồn tại hoặc không phục vụ nữa — không ai nhận lại được." />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
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

      {/* at-a-glance stats. The pool variant swaps in the only facts a pool row has:
          where it came from, when, and how to reach it. Printing "Hạng 2026" or
          "Job quota" for a company that has never bought anything would be six
          dashes in a row pretending to be a dashboard. */}
      {isPool ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <MiniStat label="Nguồn" value={<span className="text-[12.5px]">{pool!.source.replace(/^Nhập từ |^Thu thập /, '')}</span>} sub="import batch" />
          <MiniStat label="Ngày nhập" value={<span className="text-[12.5px]">{pool!.added}</span>} sub="vào danh bạ" />
          <MiniStat label="Người liên hệ" value={<span className="text-[12.5px]">{pool!.person ?? '—'}</span>} sub={pool!.person ? 'từ nguồn' : 'chưa có'} />
          <MiniStat label="SĐT" value={<span className="text-[12.5px]">{pool!.phone ?? '—'}</span>} sub={pool!.email ?? 'chưa có email'} />
          <MiniStat label="Yêu cầu" value={pool!.state === 'pending' ? (pool!.reqs ?? 1) : 0} sub={pool!.state === 'pending' ? `đầu tiên: ${pool!.by}` : 'chưa ai xin'} tone={pool!.state === 'pending' ? 'warn' : undefined} />
        </div>
      ) : (
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
      )}

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
              title={isPool ? 'Thông tin — từ danh bạ' : 'Basic info — from CRM'}
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

              {isPool
                ? <KV label="Company ID" value="chưa có — cấp khi tạo hồ sơ CRM" />
                : <KV label="Company ID" value={companyId(coKey(c))} />}
              {/* Invoice details do not exist yet for a pool row: nothing has been
                  quoted, so no buyer classification has been decided and there is no
                  legal name to invoice. Showing the group with defaults would put a
                  guess where a decision belongs. */}
              {isPool ? (
                <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                  <b className="text-ink/70">Thông tin xuất hóa đơn</b> chưa có — phân loại người mua, legal name và địa chỉ xuất hóa đơn được nhập khi tạo hồ sơ CRM, trước lần báo giá đầu tiên.
                </p>
              ) : (<>
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
              </>)}

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
                  <KV label="Company size" value={c.size ? `${c.size} staff` : '—'} />
                  <KV label="Quốc gia đăng ký / Country of registration" value={c.country} />
                  {isVNCompany(c)
                    ? <KV label="Tỉnh / Thành phố · City" value={coCity(c)} />
                    : <KV label="Tỉnh / Thành phố · City" value="— (không phải công ty Việt Nam · xem Địa chỉ xuất hóa đơn)" />}
                  <KV label="Website" value={c.domain} link />
                </>
              )}

              {/* The Sales group is CRM qualification data — lead source, owner,
                  products interested, deal value. A pool row has none of it: nobody
                  has qualified this company, which is the whole reason it is still in
                  the pool. Defaults here would read as recorded facts. */}
              {isPool ? (
                <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                  <b className="text-ink/70">Chưa có thông tin sales</b> — nguồn lead, sales phụ trách, sản phẩm quan tâm và giá trị dự kiến đều được ghi khi công ty được nhận về CRM.
                </p>
              ) : (<>
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
              </>)}
            </DetailCard>
            <CompanyDocs c={c} />
            {/* Owner history moved to its own tab — see the tab strip above. */}
            {!isPool && <AffiliatedCompanies c={c} onOpen={onOpen} />}
          </div>

          {/* activity composer + full trail — the key section, so it gets the wider side */}
          {isPool ? (
            /* Just the assignment. No activity feed (an activity is something a sales
               owner did, and this company has no owner) and no explainer cards — the
               empty tabs and the ⚠ on the MST already say what this record is. */
            <div className="space-y-3">{poolAssign}</div>
          ) : (
            <CompanyActivities c={c} />
          )}
        </div>
      )}

      {/* ── Owner history — who held the account when, and who moved it ───── */}
      {/* Deliberately NARROW rather than stretched to the tab width: the chain is a
          timeline of short rows, and at 1700px each entry becomes a name at the far
          left with a date at the far right and nothing between them. */}
      {tab === 'Owner history' && (
        <div className="max-w-[620px]">
          <div className="mb-2">
            <p className="text-[13px] font-semibold text-ink">Owner history <span className="font-normal text-muted">— {isPool ? 'chưa có sales phụ trách' : 'one current owner, and every handover before it'}</span></p>
            <p className="text-[11px] text-faint">
              {isPool
                ? 'Chuỗi chủ sở hữu bắt đầu khi công ty được nhận về CRM. Trước đó, các sự kiện sở hữu là những yêu cầu xin nhận bên dưới — ai xin, ai bị từ chối, ai được phân. Công ty trả về từ CRM giữ nguyên chuỗi chủ cũ.'
                : 'Append-only. Quotations, sales targets and commission all reference who owned the account at the time, so a past tenure is never edited to tidy it up.'}
            </p>
          </div>
          <div className="space-y-3">
            {/* The tenure chain — on a promoted company its FIRST entry is the
                approved claim ("Nhận từ Free data — duyệt bởi …"), and that one line
                is all of the claim story that belongs here. The request-by-request
                detail lives on Yêu cầu nhận công ty; repeating it on every promoted
                record would be the same list maintained twice. */}
            {!isPool && <OwnerHistory c={c} />}
            {!isPool && c.fromPool && (
              <p className="text-[11px] leading-relaxed text-faint">
                Chi tiết các yêu cầu xin nhận (ai xin, ai bị từ chối) xem ở{' '}
                <button onClick={() => goTo('admin-claim-requests')} className="font-medium text-brand hover:underline">Yêu cầu nhận công ty →</button>
              </p>
            )}
            {/* On the POOL record the chain stays — there it is not a history display
                but decision context: the admin assigns on this page, and a
                re-submitted weak request has to be visible next to the fresh one.
                It is also the only ownership story a row with no owner has. */}
            {isPool && <ClaimChain co={c.name} />}
            {isPool && pendingClaims(c.name).length === 0 && decidedNone(c.name) && (
              <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-6 text-center text-[12px] text-muted">Chưa có yêu cầu nào trên công ty này.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────────────────── */}
      {/* ── Contacts — people we do business with (may have no login) ────── */}
      {tab === 'Contacts' && isPool && (
        <PoolEmpty>
          Chưa có contact nào — công ty chưa được nhận về CRM.
          {pool!.person && <><br />Người liên hệ từ nguồn (<b className="text-ink/70">{pool!.person}</b>{pool!.phone && ` · ${pool!.phone}`}) và contact point trong yêu cầu xin nhận sẽ thành <b className="text-ink/70">contact #1</b> khi admin duyệt.</>}
        </PoolEmpty>
      )}
      {tab === 'Contacts' && !isPool && (
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
      {tab === 'Users' && isPool && (
        <PoolEmpty>Chưa có user nào — công ty chưa có tài khoản đăng nhập trên Company site. Seat đầu tiên được mời sau khi công ty thành khách hàng.</PoolEmpty>
      )}
      {tab === 'Users' && !isPool && (
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
          {/* Manual services used to be a card of their own beside this one. They are
              entitlement bought on a PO like everything else, so they are lines in
              this list now — with their delivery log where their quota is shown. */}
          <DetailCard title="Products & quota" action={<span className="text-[11px] text-faint">theo từng sản phẩm</span>}>
            <ProductsQuota c={c} />
          </DetailCard>
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
      {tab === 'Company page' && isPool && (
        <PoolEmpty>Chưa có trang công ty trên site ứng viên — trang được tạo khi công ty mua sản phẩm có Company page.</PoolEmpty>
      )}
      {tab === 'Company page' && !isPool && (
        <DetailCard
          title="Company detail page (jobseeker)"
          action={<Pill tone={c.hasPage ? 'active' : 'pending'}>{c.hasPage ? 'Published' : 'Draft'}</Pill>}
        >
          <CompanyPageEditor c={c} />
        </DetailCard>
      )}

      {/* ── Jobs ─────────────────────────────────────────────────────────── */}
      {tab === 'Jobs' && isPool && (
        <PoolEmpty>Chưa có tin tuyển dụng nào trên Saramin. Bằng chứng “đang tuyển” trong yêu cầu xin nhận là tin đăng <b className="text-ink/70">ở nơi khác</b> — xem link/tệp trong Lịch sử yêu cầu nhận (tab Owner history).</PoolEmpty>
      )}
      {tab === 'Jobs' && !isPool && (
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
                      ? (src.until
                          ? <span className="min-w-0 truncate font-mono text-[10.5px] text-brand" title={`${src.label} · hạn ${src.until}`}>{src.label}</span>
                          : <span className="min-w-0" title="Admin đăng mà không chọn PO — Tin Free (Admin đăng hộ). Không trừ quota, không hoá đơn.">
                              <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-amber-800">Miễn phí</span>
                              <span className="mt-0.5 block truncate text-[10px] text-faint">không chọn PO</span>
                            </span>)
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

/** One row in the ⋯ menu. The hint is the point: these two actions are easy to
    confuse and the difference (can someone else pick this up?) has to be readable
    at the moment of choosing, not in a doc. */
function MoreItem({ label, hint, danger, onClick }: { label: string; hint: string; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full px-3 py-2 text-left hover:bg-canvas">
      <span className={cn('block text-[12px] font-medium', danger ? 'text-rose-600' : 'text-ink')}>{label}</span>
      <span className="mt-0.5 block text-[10.5px] leading-relaxed text-faint">{hint}</span>
    </button>
  )
}
