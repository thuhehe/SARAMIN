/*
 * Admin page prototypes — realistic (mock-data) previews for the HQ Admin shell.
 *
 * Keyed by the nav item's `specId`. The wireframe's content area renders the
 * matching prototype when one exists, else falls back to the generic skeleton.
 * Everything here is mock content laid out to VN-market recruitment standards —
 * structure & data shape only, not final visual design.
 */
import { useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { BenefitsField } from '@/components/BenefitsField'
import { LogoSizer } from '@/components/LogoSizer'
import { CreateSignalCtx, OpenRecordCtx, RO_HINT, ReadOnlyCtx, ScreenNavCtx, useDetailCrumb, useReadOnly } from '@/pages/admin/ctx'
import { AC_STATUS, BUYER_TYPE, COMPANIES, CO_ORDER, CO_SORTS, CO_STATUS, LEAD_SOURCES, RETAIL_BUYER, STAGE_NEXT, cadenceOf, coCity, coId, coKey, coLabel, coLastRevenue, coLeadSource, coValue, idleOf, inPipeline, isCustomer, isVNCompany, poGate } from '@/pages/admin/data/companies'
import type { BuyerType, CoSort, CoStatus, Company } from '@/pages/admin/data/companies'
import { SALES_STAGES, companyDocs, companyOwnerHistory } from '@/pages/admin/data/companyOwner'
import type { CoDoc } from '@/pages/admin/data/companyOwner'
import { BUSINESS_FORMS, CO_SIZES, CP_TRAITS } from '@/pages/admin/data/companyPage'
import { CALL, CHAT, CHAT_CHANNELS, CONTACT_STATUS, CO_ALL_PERMS, CO_NEEDS, CO_PERM_GROUPS, CO_ROLE_DEFS, KIND_META, MAX_SEATS, MEET, coTogglePerm, companyActivity, companyApplicants, companyContacts, companyJobs, companyResumeViews, companyTeam, pastPurchases, poHistory } from '@/pages/admin/data/companyRecord'
import type { CoAtt, CoContact, CoEvent, CoKind, CoPermKey, CoRoleDef, CoTab, CoUserRole, ContactStatus } from '@/pages/admin/data/companyRecord'
import { INDENT, ancestorsOf, childrenOf, coByName, coRoles, groupOf, groupRootOf, inGroup, taxRoot } from '@/pages/admin/data/companyTree'
import { CV_SEARCH_PACKAGES, SOURCE_LABEL, SUPPLY_GAPS, SVC_TONE, TERM_TONE, UNRESOLVED_TERMS, ZERO_RESULT_TERMS, svcState, usageOf } from '@/pages/admin/data/content'
import type { SvcState, UsagePair } from '@/pages/admin/data/content'
import { DIRECTORY } from '@/pages/admin/data/directory'
import { TIERS, TIER_YEAR, nextTierAt, tierAt, tierOf, tierRevenue } from '@/pages/admin/data/membership'
import { programmeFor, qtyByProduct, tierPct } from '@/pages/admin/data/products'
import { DEALS, DISCOUNT_MODES, INVOICES, ISSUER, MST_ROOT_MATCHES, NEWCHURN_MAX_QTY, NEWCHURN_PCT, NEXT_BY_STAGE, PATH, PAY_META, PAY_TERMS_DAYS, POS, PO_TONE, QUOTES, QUOTE_CATALOG, QUOTE_SORTS, QUOTE_TERMS, QUOTE_TONE, SARAMIN_BLUE, SARAMIN_MARK_D, SPECIAL_LEADER_MAX, STAGES, VAT_RATE, apprPerson, apprRole, catForMode, daysFromDoc, defaultMode, draftInvOf, fieldCls, invPay, invStage, isOpen, lineTotal, modesFor, optionTotals, payStatus, pdfNum, pdfOptions, poDraftBtn, poExpiry, poLive, poNext, poStage, poStep, selfApproves, signDate } from '@/pages/admin/data/sales'
import type { Deal, DiscountMode, Inv, Po, QLine, QOption, Quote, QuoteSort, QuoteStatus } from '@/pages/admin/data/sales'
import { ME, SALES_DEPT, SALES_PERSONAS, SALES_ROLE_LABEL, teamBookOf } from '@/pages/admin/data/salesOrg'
import type { SalesPersona } from '@/pages/admin/data/salesOrg'
import { SERVICE_USAGE } from '@/pages/admin/data/services'
import type { ServiceEntitlement } from '@/pages/admin/data/services'
import { MD_DOMAINS } from '@/pages/admin/data/system'
import { CUSERS, JS_STATUS, JS_USERS } from '@/pages/admin/data/users'
import type { CUser, JSSignup, JSStatus, JSUser } from '@/pages/admin/data/users'
import { dateBefore, daysLeft, enWords, endOfMonth, money, revFmt, vnWords, vnd } from '@/pages/admin/lib/fmt'
import type { StatusTone } from '@/pages/admin/lib/tone'
import { AdminDashboard, AdminRecruitReport, AdminRevenueReport, AdminSalesReport, AdminUserBehavior } from '@/pages/admin/screens/analytics/reports'
import { AdminDisplay } from '@/pages/admin/screens/content/display'
import { AdminPages } from '@/pages/admin/screens/content/pages'
import { AdminClaimQueue } from '@/pages/admin/screens/directory/claimQueue'
import { AdminDepartments } from '@/pages/admin/screens/directory/departments'
import { AdminCompanyDirectory } from '@/pages/admin/screens/directory/directory'
import { AdminBundles } from '@/pages/admin/screens/products/bundles'
import { AdminCatalog } from '@/pages/admin/screens/products/catalog'
import { AdminCredits, AdminOrders } from '@/pages/admin/screens/products/credits'
import { AdminImageGallery } from '@/pages/admin/screens/products/gallery'
import { AdminPlacements } from '@/pages/admin/screens/products/placements'
import { AdminPromotions } from '@/pages/admin/screens/products/promotions'
import { AdminApplicants } from '@/pages/admin/screens/recruitment/applicants'
import { AdminCvCheck } from '@/pages/admin/screens/recruitment/cvCheck'
import { AdminJobCreateStandalone, AdminJobList } from '@/pages/admin/screens/recruitment/jobs'
import { AdminResumeNewStandalone, AdminResumes } from '@/pages/admin/screens/recruitment/resumes'
import { AdminSignups } from '@/pages/admin/screens/signups/signups'
import { AdminAuditLog } from '@/pages/admin/screens/system/auditLog'
import { AdminEnvironment } from '@/pages/admin/screens/system/environment'
import { AdminIssuer } from '@/pages/admin/screens/system/issuer'
import { AdminMasterData } from '@/pages/admin/screens/system/masterData'
import { AdminMatchingReport, AdminMatchingSettings } from '@/pages/admin/screens/system/matching'
import { AdminMembership } from '@/pages/admin/screens/system/membership'
import { AdminRoles } from '@/pages/admin/screens/system/roles'
import { AdminStaff } from '@/pages/admin/screens/system/staff'
import { AdminUsers } from '@/pages/admin/screens/system/users'
import { Bi, CardGroup, ComboField, DetailCard, EField, FLabel, InfoBit, KV, LField, PageField, Radio, Section, SelectRow } from '@/pages/admin/ui/fields'
import { JobGroup } from '@/pages/admin/ui/form'
import { FilterBar, FilterRow, FilterSelect, ListPage, RowAction } from '@/pages/admin/ui/list'
import { MiniStat, StatCards } from '@/pages/admin/ui/stats'
import { Idle, Pill, TierPill } from '@/pages/admin/ui/status'
import { Table, searchKey } from '@/pages/admin/ui/table'
import type { Col } from '@/pages/admin/ui/table'

/* Back-compat barrel: these moved out of this file but other pages still
   import them from here. Removed once those imports are repointed. */
export { CreateSignalCtx, DetailCrumbCtx, OpenRecordCtx, ScreenNavCtx } from '@/pages/admin/ctx'
export type { DetailCrumb } from '@/pages/admin/ctx'
export { DESCRIPTIONS, PRICE_SEGMENTS } from '@/pages/admin/data/products'
export { AdminJobCreate } from '@/pages/admin/screens/jobForm/create'
export { NewPackageModal } from '@/pages/admin/screens/products/newPackage'
export { NewProductModal } from '@/pages/admin/screens/products/newProduct'

/* Membership block on the company record. Deliberately shows the ARITHMETIC, not
   just the badge: accumulated-in-year, the gap to the next band, and the reset date.
   The gap is the reason a rep opens this — it is the only upsell number the loyalty
   programme produces. */
/* Membership tier as an at-a-glance STAT, not a left-column card: the tier and the
   gap to the next band are numbers a rep reads in passing, and the per-tier benefit
   table belongs in System → Membership tiers where it is configured once. */
function MembershipStat({ c }: { c: Company }) {
  const acc = tierRevenue(c)
  const tier = tierAt(acc)
  const next = nextTierAt(acc)
  const floor = tier?.from ?? 0
  const ceil = next?.from ?? TIERS[TIERS.length - 1].from
  const pct = Math.min(100, Math.max(2, ((acc - floor) / (ceil - floor)) * 100))
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">Hạng {TIER_YEAR}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <TierPill tier={tier} en />
        <span className="text-[11px] font-bold tabular-nums text-ink">{acc ? vnd(acc) : '0 ₫'}</span>
      </div>
      <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 truncate text-[10px] text-faint" title={next ? `Còn ${vnd(next.from - acc)} nữa để lên hạng ${next.vi}` : 'Đã ở hạng cao nhất'}>
        {next ? `còn ${vnd(next.from - acc)} → ${next.key}` : 'hạng cao nhất'}
      </p>
    </div>
  )
}

/* A CHI NHÁNH is a dependent unit (đơn vị phụ thuộc), not a separate legal entity —
   its tax code is the company's 10-digit root plus a suffix (…-001). Having no legal
   personality, it cannot own capital in another company, so it can never be a công ty
   mẹ. Điều 195 defines the mẹ/con relationship by CONTROL (vốn / quyền bổ nhiệm /
   quyền sửa điều lệ), all of which a branch is incapable of holding. A company may
   well be both mẹ and con at once — that is a normal multi-tier group — but a branch
   may only ever be the child end. */

function CompaniesBoard({ onOpen, showOwner, rows = COMPANIES }: { onOpen: (c: Company) => void; showOwner?: boolean; rows?: Company[] }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, minmax(130px,1fr))' }}>
      {CO_ORDER.map((st) => {
        /* An expired quotation takes the company OFF the board — the quotation is
           why the card exists. The closed columns are unaffected: a deal that
           reached Invoice or Lost was resolved by a person, not by a lapse. */
        const list = rows.filter((c) => c.status === st && (!c.quoteLapsed || st === 'Invoice' || st === 'Lost'))
        const total = list.reduce((s, c) => s + coValue(c), 0)
        return (
          <div key={st} className="rounded-lg border border-line bg-canvas/40 p-2">
            <div className="mb-1 flex items-center justify-between" title={`${st} — next: ${STAGE_NEXT[st]}`}>
              <Pill tone={CO_STATUS[st].tone}>{st}</Pill>
              <span className="text-[11px] font-bold text-faint">{list.length}</span>
            </div>
            <p className="mb-2 text-[10.5px] text-faint tabular-nums">{list.length ? vnd(total) : '—'}</p>
            {list.map((c) => (
              <button key={c.name} onClick={() => onOpen(c)} className="mb-1.5 block w-full rounded-md border border-line bg-surface p-2 text-left hover:border-brand/40">
                <p className="truncate text-[11.5px] font-semibold text-ink">{coLabel(c)}</p>
                {/* industry sits directly under the name — it is what a rep scans to
                    judge fit and to spot clusters worth a sector play. Rendered as a
                    bordered tag, not plain text, so it reads as a category the board
                    can be filtered by rather than as a second line of the name. */}
                <span className="mt-1 inline-block max-w-full truncate rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] text-muted">{c.industry}</span>
                {/* A board column is ~130px: name, industry, value and idle are all
                    that survive truncation. Option count and next step live on the
                    record, one click away. */}
                <div className="mt-1.5 flex items-baseline justify-between gap-1">
                  <p className="min-w-0 truncate text-[11.5px] font-semibold text-ink tabular-nums">{vnd(coValue(c))}</p>
                  <span className="shrink-0 text-[10.5px]"><Idle days={c.idle} kind={cadenceOf(c)} compact /></span>
                </div>
                {showOwner && <p className="mt-0.5 truncate text-[10px] text-faint">{c.owner}</p>}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}


function QuotaBar({ left, total }: { left: number; total: number }) {
  const pct = total ? (left / total) * 100 : 0
  return (
    <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-line">
      <div className={cn('h-full rounded-full', pct < 30 ? 'bg-amber-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ── Global company search ───────────────────────────────────────────────────
   One search box in the shell, reachable from every page. The Companies list has
   its own search, but that one narrows a LIST the rep is already looking at; this
   one answers a different question — "does this customer exist at all, and where
   is it?" — from wherever they happen to be.

   Deliberately unscoped: it searches EVERY company, not the signed-in rep's book.
   A rep who cannot find a customer because it belongs to a colleague creates it
   again, and a duplicate MST costs far more than the privacy of a company name.
   What the rep gets is REACH: one record, opened by name / MST / Company ID.
   Browsing someone else's book is still not possible — there is no listing here,
   the result set is capped, and it dies with the query.

   Companies only. A quotation or a PO is always reached THROUGH its company, and
   a box that answers with four kinds of record needs the user to read every row
   before they can act on any of them. */
export function GlobalCompanySearch({ onOpen }: { onOpen: (specId: string, record: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  /* ⌘K / Ctrl-K from anywhere. The shortcut is printed in the box: a hotkey nobody
     can see is a hotkey nobody uses. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); input.current?.select() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // clicking anywhere else dismisses the results without clearing the query
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => { setCursor(0) }, [q])

  const ql = searchKey(q.trim())
  /* Identity fields plus the contact's NAME — not their job title, and not the
     city. "Trưởng phòng HC-NS" and "HCMC" are on almost every record, so matching
     them turns a search into a way to page through everyone's book, which is the
     one thing this box must not become. */
  const hay = (c: Company) => searchKey([coLabel(c), c.name, c.legalName, c.tax, companyId(coKey(c)), c.contact.split('·')[0], c.domain].join(' '))
  const all = ql.length >= 2 ? COMPANIES.filter((c) => hay(c).includes(ql)) : []
  const hits = all.slice(0, 7)
  /* The free Danh bạ answers the same query. Without this the box says "it does not
     exist yet" about a company sitting unclaimed in the pool — and that sentence is
     the whole reason the box exists, so it has to be true of BOTH stores. */
  const pool = ql.length >= 2
    ? DIRECTORY.filter((d) => d.state === 'free' && searchKey([d.name, d.phone ?? '', d.web ?? '', d.tax ?? ''].join(' ')).includes(ql)).slice(0, 4)
    : []

  /* Hands the shell the Company ID, not the row: the shell switches to Companies
     and that page resolves the id, so the breadcrumb names Companies and Back
     returns to the Companies list — not to whatever page the search was used on. */
  const go = (c: Company) => {
    setOpen(false)
    setQ('')
    input.current?.blur()
    onOpen('admin-company-list', companyId(coKey(c)))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setQ(''); setOpen(false); input.current?.blur(); return }
    if (!hits.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((i) => (i + 1) % hits.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((i) => (i - 1 + hits.length) % hits.length) }
    if (e.key === 'Enter') { e.preventDefault(); go(hits[cursor]) }
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <div className={cn('flex items-center gap-2 rounded-lg border bg-canvas px-2.5 py-1.5 transition-colors', open ? 'border-brand/50 bg-surface' : 'border-line hover:border-ink/25')}>
        <span className="shrink-0 text-[12px] text-faint"></span>
        <input
          ref={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Tìm công ty — tên, mã số thuế, mã công ty…"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
        />
        {q ? (
          <button onClick={() => { setQ(''); input.current?.focus() }} className="shrink-0 text-[12px] text-faint hover:text-ink" aria-label="Clear search">✕</button>
        ) : (
          <span className="hidden shrink-0 rounded border border-line px-1.5 py-px font-mono text-[10px] text-faint lg:inline">⌘K</span>
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          {ql.length < 2 ? (
            <p className="px-3 py-2.5 text-[11.5px] text-muted">Type at least <b className="text-ink">2 characters</b> — company name, tax code (MST) or Company ID.</p>
          ) : hits.length === 0 && pool.length === 0 ? (
            <div className="px-3 py-2.5">
              <p className="text-[11.5px] text-muted">No company matches “<b className="text-ink">{q.trim()}</b>”.</p>
              {/* The point of searching before creating: this line is what stops the
                  rep from making a duplicate they could not find. Both stores, named
                  — a rep who is told "nowhere" must be able to trust it. */}
              <p className="mt-0.5 text-[10.5px] text-faint">Checked every CRM company including other reps’, and the free <b className="text-muted">Danh bạ doanh nghiệp</b> — if it is not in either, it does not exist yet.</p>
            </div>
          ) : (
            <>
              {hits.length > 0 && (<>
              <div className="flex items-center gap-2 border-b border-line-soft bg-canvas/60 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Companies</span>
                <span className="ml-auto text-[10.5px] text-faint">{hits.length}/{all.length} result{all.length === 1 ? '' : 's'}</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-1">
                {hits.map((c, i) => (
                  <button
                    key={c.name}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(c)}
                    className={cn('flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left', i === cursor ? 'bg-canvas' : 'hover:bg-canvas')}
                  >
                    <span className="mt-px text-[12px]"></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate text-[12.5px] font-medium text-ink">{coLabel(c)}</span>
                        <Pill tone={AC_STATUS[c.account].tone}>{c.account}</Pill>
                        {/* Pipeline is a second, independent axis — a rep opening a
                            record wants to know if a deal is live on it. */}
                        {inPipeline(c) && <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-faint">
                        <span className="font-mono">{companyId(coKey(c))}</span>
                        <span>·</span>
                        <span>MST {c.tax}</span>
                        <span>·</span>
                        <span>{c.owner}{c.owner === ME && <span className="text-brand"> (you)</span>}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              </>)}

              {/* Second store, second section — never mixed into the list above. A
                  CRM company is a customer with an owner; a Danh bạ row is reference
                  data nobody holds. Ranking them together would hide that. */}
              {pool.length > 0 && (
                <>
                  <div className="flex items-center gap-2 border-y border-line-soft bg-canvas/60 px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Danh bạ · chưa ai nhận</span>
                    <span className="ml-auto text-[10.5px] text-faint">{pool.length} kết quả</span>
                  </div>
                  <div className="p-1">
                    {pool.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => { setOpen(false); setQ(''); input.current?.blur(); onOpen('admin-company-directory', '') }}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-canvas"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="min-w-0 truncate text-[12.5px] font-medium text-ink">{d.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-faint">
                            <span>{d.addr ?? '—'}</span>
                            {d.phone && <><span>·</span><span>{d.phone}</span></>}
                            <span>·</span>
                            <span>chưa có sales phụ trách</span>
                          </span>
                        </span>
                        <span className="mt-0.5 shrink-0 text-[10.5px] font-medium text-brand">Xin nhận →</span>
                      </button>
                    ))}
                  </div>
                  <p className="border-t border-line-soft bg-canvas/60 px-3 py-1.5 text-[10px] leading-relaxed text-faint">
                    Chưa phải khách hàng — <b className="text-muted">dữ liệu tham chiếu</b>, không đếm vào số nào của CRM. Xin nhận cần SĐT liên hệ + bằng chứng đang tuyển, và admin duyệt.
                  </p>
                </>
              )}

              <div className="flex items-center gap-3 border-t border-line-soft bg-canvas/60 px-3 py-1.5 text-[10px] text-faint">
                <span><b className="font-mono text-muted">↑↓</b> navigate</span>
                <span><b className="font-mono text-muted">↵</b> open</span>
                <span><b className="font-mono text-muted">esc</b> close</span>
                {all.length > hits.length && <span className="ml-auto">Refine to see the other {all.length - hits.length}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AdminCompanyList() {
  const [open, setOpen] = useState<Company | null>(null)
  /* The "+ New company" button lives on the page title row (shell PRIMARY_ACTION),
     so the shell signals the intent and this page enters create mode. */
  const createSignal = useContext(CreateSignalCtx)
  /* Creating a company REPLACES the list rather than floating over it — the form is
     long enough to need the whole viewport. Same pattern as job create. */
  const [creating, setCreating] = useState(false)
  useEffect(() => { if (createSignal) setCreating(true) }, [createSignal])
  /* Who is logged in. In the real product this comes from the session; here it is a
     switcher so a reviewer can see how scope changes per role. */
  const [persona, setPersona] = useState<SalesPersona>(SALES_PERSONAS[1]) // default: the sales lead
  /* 'me' = own book · 'team' = teams I lead (lead only) · 'dept' = whole department (manager only). */
  const [view, setView] = useState<'me' | 'team' | 'dept'>('me')
  // Group filter — the whole tree under one root. Deliberately NOT an owner filter:
  // a group can span several reps, so filtering by group has to ignore the view
  // switcher, otherwise a rep can never see the parts of the group they don't own.
  const [group, setGroup] = useState<Company | null>(null)
  /* Filters mirror the columns a rep actually narrows by. Plain selects plus one
     toggle: six popovers would cost more attention than this list is worth. */
  const [fIndustry, setFIndustry] = useState('')
  const [fLocation, setFLocation] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fPipeline, setFPipeline] = useState('')
  const [fOwner, setFOwner] = useState('')
  const [sort, setSort] = useState<CoSort>('contact-old')
  const goTo = useContext(ScreenNavCtx)
  /* Arrived from the shell's global search (or any cross-page link): open that
     company. Matched on Company ID first, then on the raw name, so a caller can
     hand either. */
  const handed = useContext(OpenRecordCtx)
  const linked = handed ? COMPANIES.find((c) => companyId(coKey(c)) === handed || c.name === handed) ?? null : null
  const showing = open ?? linked
  if (showing) return <CompanyDetail c={showing} viewer={persona.name} onBack={() => { setOpen(null); if (handed) goTo('admin-company-list') }} onOpen={setOpen} />

  /* A Sales rep only ever LISTS their own book — there is no "whole system" scope to
     browse everyone's customers. What they still get is a search that can REACH any
     single customer by name / MST / ID and open its record — the list's own
     `outOfScope` dropdown, and the shell-wide GlobalCompanySearch — so a rep who
     knows a company exists never has to re-create it. Wider scope is a role: a lead
     also gets their team's book, a manager the whole department. */
  const me = persona.name
  /* Views this persona is allowed to switch between (rep has just their own). */
  const views: ('me' | 'team' | 'dept')[] = persona.role === 'lead' ? ['me', 'team'] : persona.role === 'manager' ? ['me', 'dept'] : ['me']
  const effView = views.includes(view) ? view : 'me'
  const mine = effView === 'me'
  const teamBook = teamBookOf(me) // members of the team(s) this person leads
  const scope =
    effView === 'dept' ? COMPANIES.filter((c) => SALES_DEPT.has(c.owner))
    : effView === 'team' ? COMPANIES.filter((c) => teamBook.has(c.owner))
    : COMPANIES.filter((c) => c.owner === me)
  const base = group ? groupOf(group) : scope
  // once the list can show other reps' companies (team / dept, or a cross-rep group), the owner column has to be there
  const showOwner = effView !== 'me' || Boolean(group)
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'vi'))
  const rows = base
    .filter((c) =>
      (!fIndustry || c.industry === fIndustry) &&
      (!fLocation || coCity(c) === fLocation) &&
      (!fStatus || c.account === fStatus) &&
      (!fPipeline || (fPipeline === 'Not in pipeline' ? !inPipeline(c) : inPipeline(c) && c.status === fPipeline)) &&
      (!fOwner || c.owner === fOwner),
    )
    .slice()
    .sort(CO_SORTS[sort].cmp)
  const activeFilters = [fIndustry, fLocation, fStatus, fPipeline, fOwner].filter(Boolean).length
  const clearAll = () => { setFIndustry(''); setFLocation(''); setFStatus(''); setFPipeline(''); setFOwner('') }
  if (creating) return <CompanyCreatePage onBack={() => setCreating(false)} />

  return (
    <div>
      {/* Group filter banner — only ever visible once a rep has clicked a group tag,
          so the default list stays exactly as it was. */}
      {group && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2 text-[12px] text-brand">
          <span className="font-semibold">Tập đoàn {coLabel(group)}</span>
          <span className="text-brand/70">— {rows.length} công ty, mọi cấp, không phân biệt sales phụ trách. Mỗi công ty vẫn có MST, hợp đồng và quota riêng.</span>
          <button onClick={() => setGroup(null)} className="ml-auto rounded-md border border-brand/40 px-2 py-0.5 text-[11px] font-medium hover:bg-surface">Bỏ lọc ✕</button>
        </div>
      )}

      {/* Prototype affordance: switch the signed-in identity to see how the LIST scope
          changes by role. In production this is the session, never a control.
          The permission summary beside it is what makes the invisible rules visible —
          a permission is otherwise impossible to SEE on a mockup: the reader would
          have to notice which buttons are missing. */}
      <div className="mb-3 rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="font-medium text-faint">Đang xem với vai trò</span>
          <select
            value={persona.name}
            onChange={(e) => { const p = SALES_PERSONAS.find((x) => x.name === e.target.value)!; setPersona(p); setView('me') }}
            className="cursor-pointer rounded-md border border-line bg-surface px-2 py-1 text-[12px] font-medium text-ink outline-none"
          >
            {SALES_PERSONAS.map((p) => <option key={p.name} value={p.name}>{p.name} — {SALES_ROLE_LABEL[p.role]}</option>)}
          </select>
          <span className="text-[11px] text-faint">— đổi vai trò để xem quyền thay đổi thế nào</span>
        </div>
        {/* Four rules, always on screen: the one that is scoped, and the three that are not. */}
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              k: 'Danh sách này',
              v: persona.role === 'rep' ? 'Chỉ công ty của tôi' : persona.role === 'lead' ? 'Của tôi + cả nhóm tôi quản lý' : 'Của tôi + toàn bộ sales',
              scoped: true,
            },
            { k: 'Tìm kiếm', v: 'MỌI công ty', scoped: false },
            { k: 'Xem chi tiết', v: 'MỌI công ty', scoped: false },
            { k: 'Ghi nhận hoạt động', v: 'MỌI công ty', scoped: false },
          ].map((r) => (
            <div key={r.k} className={cn('rounded-md border px-2.5 py-1.5', r.scoped ? 'border-brand/30 bg-brand-soft' : 'border-line bg-surface')}>
              <p className={cn('text-[10px] font-semibold uppercase tracking-wide', r.scoped ? 'text-brand/70' : 'text-faint')}>{r.k}</p>
              <p className={cn('text-[11.5px] font-medium', r.scoped ? 'text-brand' : 'text-ink/80')}>{r.v}</p>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-faint">
          Chỉ <b className="text-ink/70">danh sách</b> bị giới hạn theo vai trò. Tìm kiếm · xem · ghi nhận hoạt động thì <b className="text-ink/70">không</b> — nếu không tìm thấy, sales sẽ tạo trùng khách hàng. Sửa thông tin công ty: <b className="text-ink/70">chỉ sales phụ trách</b>.
        </p>
      </div>

      {/* The view switcher decides WHICH list this is, so it reads first — before the
          controls that narrow it — and shares the header row with them. A plain rep
          has no switcher (own book only); a lead / manager gets the wider tab. */}
      <ListPage
        minW={showOwner ? 1640 : 1500}
        leading={
          views.length > 1 ? (
            <span className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
              {views.map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn('rounded-md px-3 py-1 transition-colors', effView === v ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>
                  {v === 'me' ? 'Sales view' : v === 'team' ? 'Sales lead view' : 'Sales manager view'}
                </button>
              ))}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-1 text-[12px] font-medium text-muted">Công ty của tôi</span>
          )
        }
        sort={
          <label className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
            <span className="text-faint">Sắp xếp</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CoSort)}
              className="max-w-[170px] cursor-pointer bg-transparent text-[11.5px] font-medium text-ink outline-none"
            >
              {(Object.keys(CO_SORTS) as CoSort[]).map((k) => <option key={k} value={k}>{CO_SORTS[k].label}</option>)}
            </select>
          </label>
        }
        /* rows are already narrowed by the filter row, so Total means the book of
           business, not what survived the filters */
        total={base.length}
        searchHint={mine ? `Tìm trong ${base.length} công ty của tôi · gõ tên / MST để mở nhanh một KH bất kỳ…` : 'Tìm trong danh sách — tên, MST, company ID…'}
        // the box promises these, so they have to be searchable even though the
        // table prints none of them
        searchExtra={rows.map((c) => [companyId(coKey(c)), c.tax, c.legalName, c.contact, coCity(c), c.domain].join(' '))}
        /* A rep cannot browse the whole system, but must still be able to REACH a
           specific customer they know by name — otherwise "not in my list" reads as
           "does not exist" and they re-create a company that already has an owner.
           So nothing is LISTED here: matches outside the book surface as direct links
           straight into that customer's record, and only when the query is specific. */
        /* A rep cannot BROWSE the whole system, but must be able to REACH one
           customer they know exists — otherwise "not in my list" reads as "does not
           exist" and they re-create a company that already has an owner.

           So this is a dropdown on the query, not a second list on the page. It is
           neutral, not a warning: finding a colleague's customer is a success. It
           needs a real query, it is capped, and it dies with the query — three
           things that keep "reach" from quietly becoming "browse". */
        /* Available in EVERY tab, not just the own-book one: search reaches ALL
           companies for every salesperson (rep, lead and manager alike). What the
           dropdown lists is simply whatever the current tab does not already show. */
        outOfScope={(q) => {
          const ql = searchKey(q)
          const inBook = rows.filter((c) => searchKey([coLabel(c), c.legalName, c.tax, companyId(coKey(c)), c.contact, c.domain].join(' ')).includes(ql)).length
          if (ql.length < 2) {
            return (
              <div className="absolute left-0 top-full z-20 mt-1 w-[340px] rounded-lg border border-line bg-surface p-2.5 text-[11px] text-muted shadow-lg">
                Gõ ít nhất <b className="text-ink">2 ký tự</b> để tìm trong <b className="text-ink">mọi công ty</b> — tên, MST hoặc Company ID.
              </div>
            )
          }
          const hay = (c: Company) => searchKey([coLabel(c), c.legalName, c.tax, companyId(coKey(c)), c.contact, c.domain].join(' '))
          // everything the CURRENT tab does not already list — scope never hides a
          // company from search, it only decides what the table itself shows
          const listed = new Set(base.map((c) => c.name))
          const all = COMPANIES.filter((c) => !listed.has(c.name) && hay(c).includes(ql))
          const hits = all.slice(0, 5)
          /* Third section: the free pool. Same reason as "ngoài sổ" — a rep who does
             not find a company here creates a duplicate. The pool is where the name
             most often already is, unowned, so it has to answer the same query. */
          const pool = DIRECTORY.filter((d) => d.state === 'free' && searchKey([d.name, d.phone ?? '', d.web ?? '', d.tax ?? ''].join(' ')).includes(ql)).slice(0, 3)
          return (
            <div className="absolute left-0 top-full z-20 mt-1 w-[420px] overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
              <div className="flex items-center gap-2 border-b border-line-soft bg-canvas/60 px-2.5 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Ngoài danh sách này — mọi sales đều tìm &amp; xem được</span>
                <span className="ml-auto text-[10.5px] text-faint">{all.length ? `${hits.length}/${all.length}` : '0'} kết quả</span>
              </div>
              {hits.length > 0 ? (
                <div className="max-h-[260px] overflow-y-auto p-1">
                  {hits.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setOpen(c)}
                      className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-canvas"
                    >
                      <span className="mt-px text-[12px]"></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="min-w-0 truncate text-[12px] font-medium text-ink">{coLabel(c)}</span>
                          <Pill tone={AC_STATUS[c.account].tone}>{c.account}</Pill>
                        </span>
                        {/* Company ID + MST + owner: enough to be certain this is the
                            right record before opening it, and to know whose it is. */}
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-faint">
                          <span className="font-mono">{companyId(coKey(c))}</span>
                          <span>· MST {c.tax}</span>
                          <span>· {c.owner}</span>
                        </span>
                      </span>
                      <span className="mt-0.5 shrink-0 text-[10.5px] font-medium text-brand">Xem hồ sơ →</span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Nothing anywhere is the moment a duplicate gets created, so the
                   create action lives right here rather than back up on the toolbar. */
                <div className="p-2.5">
                  <p className="text-[11px] text-muted">Không có công ty nào khớp “{q}” — kể cả ngoài danh sách này.</p>
                  {/* Create is the last resort, and only when the pool has nothing
                      either — otherwise the rep types a company that already exists
                      as free data and it gets entered twice. */}
                  {inBook === 0 && pool.length === 0 && (
                    <button onClick={() => setCreating(true)} className="mt-1.5 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">+ Tạo công ty mới</button>
                  )}
                </div>
              )}
              {all.length > hits.length && (
                <p className="border-t border-line-soft bg-canvas/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-faint">
                  Chỉ hiện {hits.length} kết quả đầu — gõ chính xác hơn (MST hoặc Company ID) thay vì duyệt danh sách.
                </p>
              )}
              {pool.length > 0 && (
                <>
                  <div className="flex items-center gap-2 border-y border-line-soft bg-canvas/60 px-2.5 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Trong danh bạ · chưa ai nhận</span>
                    <span className="ml-auto text-[10.5px] text-faint">{pool.length} kết quả</span>
                  </div>
                  <div className="p-1">
                    {pool.map((d) => (
                      <div key={d.name} className="flex items-start gap-2 rounded-md px-2 py-1.5">
                        <span className="min-w-0 flex-1">
                          <span className="min-w-0 truncate text-[12px] font-medium text-ink">{d.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-faint">
                            <span>{d.addr ?? '—'}</span>
                            {d.phone && <span>· {d.phone}</span>}
                            <span>· {d.source}</span>
                          </span>
                        </span>
                        <span className="mt-0.5 shrink-0 text-[10.5px] font-medium text-brand">Xin nhận →</span>
                      </div>
                    ))}
                  </div>
                  <p className="border-t border-line-soft bg-canvas/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-faint">
                    Chưa phải khách hàng — <b className="text-muted">dữ liệu tham chiếu</b>. Xin nhận cần SĐT liên hệ + bằng chứng đang tuyển, và admin duyệt.
                  </p>
                </>
              )}
            </div>
          )
        }}
        filters={
          <FilterBar count={activeFilters} onClear={clearAll}>
            <FilterRow label="Industry" value={fIndustry} onChange={setFIndustry} options={uniq(base.map((c) => c.industry))} />
            <FilterRow label="Location" value={fLocation} onChange={setFLocation} options={uniq(base.map(coCity))} />
            <FilterRow label="Status" value={fStatus} onChange={setFStatus} options={Object.keys(AC_STATUS)} />
            <FilterRow label="Pipeline" value={fPipeline} onChange={setFPipeline} options={[...CO_ORDER, 'Not in pipeline']} />
            {showOwner && <FilterRow label="Owner" value={fOwner} onChange={setFOwner} options={uniq(base.map((c) => c.owner))} />}
          </FilterBar>
        }
        cols={[
          { label: 'Company', w: '1.4fr' },
          // The permanent public identifier — what support quotes back and what an
          // export joins on. Sits next to the name so a row can be identified.
          { label: 'Company ID', w: '0.85fr' },
          { label: 'Industry', w: '0.9fr' },
          { label: 'Location', w: '0.9fr' },
          { label: 'Status', w: '0.8fr' },
          // The third axis, next to customer status because that is what a rep
          // compares it against: status says whether they buy, tier says how much.
          { label: `Tier ${TIER_YEAR}`, w: '1fr' },
          { label: 'Pipeline', w: '0.9fr' },
          // Owner is only meaningful when looking across the team — in Sales view
          // every row is yours, so the column would repeat the same name. A group
          // view always shows it: the whole point is that a group can span reps.
          ...(showOwner ? [{ label: 'Owner', w: '0.9fr' } as Col] : []),
          { label: 'Last contact', w: '0.85fr' },
          { label: 'Latest note', w: '1.5fr' },
          { label: 'Total revenue', w: '1fr', align: 'r' as const },
          { label: 'Latest revenue', w: '1fr', align: 'r' as const },
        ]}
        rows={rows.map((c) => [
          <div className="min-w-0">
            <button onClick={() => setOpen(c)} className="block min-w-0 max-w-full truncate text-left font-medium text-brand hover:underline">{coLabel(c)}</button>
            {/* The group tag is the whole affordance: it says "this record is part of a
                bigger customer" and doubles as the filter into that group. */}
            {inGroup(c) && (
              <button
                onClick={() => setGroup(groupRootOf(c))}
                className="mt-0.5 block max-w-full truncate text-left text-[10px] text-faint hover:text-brand hover:underline"
              >
                {coLabel(groupRootOf(c))} · {coRoles(c).join(' · ')}
              </button>
            )}
          </div>,
          <span className="truncate font-mono text-[11px] text-muted">{companyId(coKey(c))}</span>,
          <span className="truncate">{c.industry}</span>,
          <span className="truncate">{c.address}</span>,
          <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>,
          // Badge + the number it was earned on. The accumulated figure has to sit
          // next to the badge: without it the tier looks like something a rep set.
          <div className="min-w-0">
            <TierPill tier={tierOf(c)} />
          </div>,
          inPipeline(c) ? (
            <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>
          ) : c.quoteLapsed ? (
            /* Off the board, but for a reason worth acting on — and NOT Lost. Saying
               only "—" here would hide a live prospect whose offer simply ran out. */
            <span title="Báo giá đã hết hạn cuối tháng — công ty rời pipeline. Tạo báo giá mới (hoặc bản v2) để đưa lại vào Proposal." className="min-w-0 truncate text-[10.5px] font-medium text-amber-600">
              Báo giá hết hạn
            </span>
          ) : <span className="text-faint">—</span>,
          ...(showOwner ? [<span className="truncate">{c.owner}</span>] : []),
          // Plain date — no rot dot, no colour. Urgency lives on the Pipeline board
          // and in the sort, not as a third colour channel on every row.
          <Idle days={c.idle} kind={cadenceOf(c)} compact />,
          <span className="truncate text-muted">{c.note}</span>,
          <span className="tabular-nums">{revFmt(c.revenue)}</span>,
          <span className="tabular-nums">{revFmt(coLastRevenue(c))}</span>,
        ])}
      />
    </div>
  )
}

/* ── Pipeline — the same companies as a status board (opens the same record) ── */
function AdminCompanyPipeline() {
  const [open, setOpen] = useState<Company | null>(null)
  const [view, setView] = useState<'me' | 'team'>('me')
  if (open) return <CompanyDetail c={open} onBack={() => setOpen(null)} onOpen={setOpen} />
  const rows = view === 'me' ? COMPANIES.filter((c) => c.owner === ME) : COMPANIES
  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
        <button onClick={() => setView('me')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'me' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales view</button>
        <button onClick={() => setView('team')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'team' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales lead view</button>
      </div>
      <CompaniesBoard onOpen={setOpen} rows={rows} showOwner={view === 'team'} />
    </div>
  )
}

/* No status pill. Everything on this list was PAID — an unpaid product never
   provisions, so "Paid" was true of every row and told the reader nothing. Whether
   it has ENDED is said by which list it is in (Đang dùng / Đã kết thúc) and by the
   row being muted, not by a badge repeating it. */
function PurchaseRow({ name, detail, amount, date, expired }: { name: string; detail: string; amount: string; date: string; expired?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5', expired ? 'border-line-soft bg-canvas/40' : 'border-line')}>
      <div className="min-w-0">
        <p className={cn('truncate text-[11.5px] font-medium', expired ? 'text-muted' : 'text-ink')}>{name}</p>
        <p className="text-[10.5px] text-faint">{detail} · {date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('text-[11.5px] font-medium tabular-nums', expired && 'text-muted')}>{amount}</p>
      </div>
    </div>
  )
}

function ContactDetail({ p, c, onClose }: { p: CoContact; c: Company; onClose: () => void }) {
  /* Edit is in-place rather than a second modal: the reader is already looking at
     the record, and a modal on top of a slide-over is one layer too many. Changes
     are held in a draft so Cancel is a true revert. */
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<CoContact>(p)
  const [justSaved, setJustSaved] = useState(false)
  const set = <K extends keyof CoContact>(k: K, v: CoContact[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const cancel = () => { setDraft(p); setEditing(false) }
  const save = () => { setEditing(false); setJustSaved(true) }
  const startEdit = () => { setJustSaved(false); setEditing(true) }

  const st = CONTACT_STATUS[draft.status]
  const blocked = draft.status === 'No longer here' || draft.status === 'Do not contact'
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-full max-w-[560px] flex-col bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Contact · {coLabel(c)}</p>
            <h3 className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[16px] font-bold tracking-tight">
              {draft.name}
              {draft.primary && <span className="rounded border border-brand/30 bg-brand-soft px-1 py-0.5 text-[9.5px] font-semibold text-brand">PRIMARY</span>}
              {draft.billing && <span className="rounded border border-line bg-canvas px-1 py-0.5 text-[9.5px] font-semibold text-muted">BILLING</span>}
              {editing && <span className="rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[9.5px] font-semibold text-amber-700">EDITING</span>}
            </h3>
            <p className="text-[11.5px] text-muted">{draft.title}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* status, with the "what do I do instead" line spelled out */}
          <div className={cn('rounded-lg border px-3 py-2.5', blocked ? 'border-rose-200 bg-rose-50' : 'border-line bg-canvas/40')}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={st.tone}>{draft.status}</Pill>
              <span className="text-[11.5px] text-muted">{st.vi}</span>
              {draft.snoozedUntil && <span className="text-[11.5px] text-amber-700">· đến {draft.snoozedUntil}</span>}
            </div>
            <p className={cn('mt-1.5 text-[11.5px] leading-relaxed', blocked ? 'text-rose-800' : 'text-muted')}>{st.hint}</p>
            {/* what to DO is a separate line from what it MEANS — the rep is here to act */}
            <p className={cn('mt-1 text-[11.5px] font-medium', blocked ? 'text-rose-900' : 'text-ink/80')}>→ {st.action}</p>
            {draft.movedTo && (
              <p className="mt-1.5 text-[11.5px] text-brand">Nay ở <b>{draft.movedTo}</b> — a warm lead at their new employer.</p>
            )}
            {editing && (
              <div className="mt-2.5 border-t border-line-soft pt-2.5">
                <p className="mb-1.5 text-[10.5px] uppercase tracking-wide text-faint">Change status</p>
                {/* Rows, not chips: five statuses each need their meaning beside them,
                    otherwise a rep guesses what "Paused" covers. */}
                <div className="space-y-1">
                  {(Object.keys(CONTACT_STATUS) as ContactStatus[]).map((k) => {
                    const m = CONTACT_STATUS[k]
                    const on = draft.status === k
                    return (
                      <button
                        key={k}
                        onClick={() => set('status', k)}
                        className={cn('flex w-full items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left', on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-ink/30')}
                      >
                        <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand' : 'border-line')}>
                          {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className={cn('text-[12px] font-medium', on ? 'text-brand' : 'text-ink')}>{k}</span>
                            <span className="text-[10.5px] text-faint">{m.vi}</span>
                          </span>
                          <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">{m.hint}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                {draft.status === 'Paused' && (
                  <div className="mt-2"><EField label="Resume contact on" value={draft.snoozedUntil ?? ''} onChange={(v) => set('snoozedUntil', v)} hint="Required for Paused — reminders stay off until this date." /></div>
                )}
                {draft.status === 'No longer here' && (
                  <div className="mt-2"><EField label="Now at (if known)" value={draft.movedTo ?? ''} onChange={(v) => set('movedTo', v)} hint="Optional — creates a warm lead at their new employer." /></div>
                )}
              </div>
            )}
          </div>

          <DetailCard title="Details" action={justSaved ? <span className="text-[11px] font-medium text-emerald-700">✓ Saved</span> : undefined}>
            {editing ? (
              <>
                <EField label="Full name" value={draft.name} onChange={(v) => set('name', v)} />
                <EField label="Job title" value={draft.title} onChange={(v) => set('title', v)} />
                <EField label="Email" value={draft.email} onChange={(v) => set('email', v)} mono hint="Verified before it is used on a quotation." />
                <EField label="Phone" value={draft.phone} onChange={(v) => set('phone', v)} />
                <div className="py-2">
                  <p className="mb-1 text-[10.5px] uppercase tracking-wide text-faint">Role on this account</p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      ['primary', 'Primary (receives quotations)'],
                      ['billing', 'Billing (receives invoices)'],
                      ['decisionMaker', 'Decision maker'],
                    ] as [keyof CoContact, string][]).map(([k, label]) => {
                      const on = Boolean(draft[k])
                      return (
                        <button key={String(k)} onClick={() => set(k, (!on) as never)} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px]', on ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>
                          <span className={cn('grid h-3.5 w-3.5 place-items-center rounded border text-[9px]', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on ? '✓' : ''}</span>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-[10.5px] text-faint">Only one contact per company can be Primary or Billing — setting it here moves it off whoever held it.</p>
                </div>
                <KV label="Login user" value={draft.linkedUser ? `${draft.linkedUser}` : 'No login — contact only'} />
                <KV label="Last contacted" value={draft.lastContact} />
              </>
            ) : (
              <>
                <KV label="Full name" value={draft.name} />
                <KV label="Job title" value={draft.title} />
                <KV label="Email" value={draft.email} link />
                <KV label="Phone" value={draft.phone} />
                <KV label="Decision maker" value={draft.decisionMaker ? 'Yes — signs off on the purchase' : 'No'} />
                <KV label="Receives quotations" value={draft.primary ? 'Yes — PRIMARY contact' : 'No'} />
                <KV label="Receives invoices" value={draft.billing ? 'Yes — BILLING contact' : 'No'} />
                <KV label="Login user" value={draft.linkedUser ? `${draft.linkedUser}` : 'No login — contact only'} />
                <KV label="Last contacted" value={draft.lastContact} />
              </>
            )}
          </DetailCard>

          <DetailCard title="Note" action={<span className="text-[11px] text-faint">one note per contact</span>}>
            {editing ? (
              <textarea value={draft.note} onChange={(e) => set('note', e.target.value)} rows={4} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink outline-none focus:border-brand" />
            ) : (
              <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink/85">{draft.note}</div>
            )}
            <p className="mt-1.5 text-[10.5px] text-faint">The human context a status cannot carry — preferred channel, who they defer to, what went wrong last time.</p>
          </DetailCard>

          </div>

        {/* every contact action lives here, not on the list row */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          {editing ? (
            <>
              <span className="mr-auto text-[11px] text-faint">Editing — Cancel discards every change.</span>
              <button onClick={cancel} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
              <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Save changes</button>
            </>
          ) : (
            <>
              {draft.status === 'Needs verifying' && <button onClick={startEdit} className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand">Verify details</button>}
              {draft.status === 'No longer here' && <button className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand">Find successor</button>}
              {!draft.linkedUser && !blocked && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Invite as user</button>}
              {!draft.primary && !blocked && <button onClick={() => { set('primary', true); setJustSaved(true) }} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Make primary</button>}
              <button onClick={startEdit} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Change status</button>
              <button onClick={startEdit} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* Add a contact by hand — the name-card path. Deliberately short: a contact is
   cheap to create and details get verified later, which is what Unverified is for. */
function AddContactModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const [status, setStatus] = useState<ContactStatus>('Needs verifying')
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Add contact</p>
            <p className="text-[11px] text-muted">To {coLabel(c)} · a contact needs no login</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Full name" req value="Họ và tên" />
            <ComboField label="Job title" value="" placeholder="Select or type a title…" options={['HR Manager', 'HR Director', 'Talent Acquisition', 'Recruiter', 'Kế toán trưởng / Chief accountant', 'CEO / Founder', 'Office Manager']} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Email" value="name@company.vn" hint="Verified before it is used on a quotation." />
            <LField label="Phone" value="09xx xxx xxx" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CONTACT_STATUS) as ContactStatus[]).map((k) => (
                <button key={k} onClick={() => setStatus(k)} title={CONTACT_STATUS[k].hint} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', status === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>
                  {k} <span className="text-[10px] opacity-70">{CONTACT_STATUS[k].vi}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{CONTACT_STATUS[status].hint} <b className="text-ink/70">→ {CONTACT_STATUS[status].action}</b></p>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Role on this account</label>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Primary contact (receives quotations)</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Billing contact (receives invoices)</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Decision maker</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note</label>
            <div className="h-16 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">Preferred channel, who they defer to, anything the next rep should know…</div>
          </div>
          <p className="rounded-md bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">
            Adding a contact does <b>not</b> create a login. Use <b>Invite as user</b> on the contact afterwards if they need to sign in — that is an explicit, separate step.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Add contact</button>
        </div>
      </div>
    </div>
  )
}

/* Interactive "build a role" panel — the Add/Edit role screen (VietnamWorks-style,
   trimmed). Roles list on the left, permission checklist on the right. */
function CoRoleBuilder() {
  const [roles, setRoles] = useState<CoRoleDef[]>(CO_ROLE_DEFS)
  const [sel, setSel] = useState(1)
  const role = roles[sel]
  const editable = !role.admin
  const setPerms = (perms: CoPermKey[]) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, perms } : r)))
  const addRole = () => { setRoles((rs) => [...rs, { name: `New role ${rs.length}`, perms: ['jobs.view'] }]); setSel(roles.length) }
  return (
    <div className="mt-3 grid gap-3 rounded-lg border border-line p-3 md:grid-cols-[180px_1fr]">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11.5px] font-semibold text-ink">Roles</p>
          <button onClick={addRole} className="text-[11px] font-medium text-brand">+ Add role</button>
        </div>
        <div className="space-y-1">
          {roles.map((r, i) => (
            <button key={r.name} onClick={() => setSel(i)} className={cn('flex w-full items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-left', i === sel ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
              <span className="truncate text-[11.5px] font-medium text-ink">{r.name}</span>
              {r.admin && <Pill tone="neutral">Super admin</Pill>}
            </button>
          ))}
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <input value={role.name} readOnly={!editable} onChange={(e) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, name: e.target.value } : r)))} className={cn('min-w-0 flex-1 rounded-md px-2 py-1.5 text-[12.5px] font-semibold text-ink', editable ? 'border border-line' : 'border border-transparent bg-transparent')} />
          {role.admin && <span className="shrink-0 text-[10.5px] text-faint">Super admin · full access, can’t be edited</span>}
        </div>
        {CO_PERM_GROUPS.map((g) => (
          <div key={g.module} className="mb-2 border-t border-line/60 pt-2 first:border-0 first:pt-0">
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-faint">{g.module}</p>
            {g.perms.map((p) => {
              const on = role.perms.includes(p.key)
              const locked = on && CO_ALL_PERMS.some((q) => CO_NEEDS[q] === p.key && role.perms.includes(q))
              const disabled = !editable || locked
              return (
                <label key={p.key} className={cn('flex items-center gap-2 rounded px-1.5 py-1', disabled ? '' : 'cursor-pointer hover:bg-canvas/70')}>
                  <input type="checkbox" checked={on} disabled={disabled} onChange={() => editable && setPerms(coTogglePerm(role.perms, p.key))} className="h-3.5 w-3.5 accent-brand" />
                  <span className="text-[11.5px] text-ink">{p.label}</span>
                </label>
              )
            })}
          </div>
        ))}
        <p className="mt-2 text-[10.5px] leading-relaxed text-faint">Ticking a higher action auto-includes (and locks) its prerequisite, so a role is never invalid. Admin is the one fixed role — every other role is custom and editable.</p>
      </div>
    </div>
  )
}

/* Compact read-only view of ONE role's permissions — used inside the invite modal. */
function CoRolePermsView({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const def = CO_ROLE_DEFS.find((r) => r.name === role)
  return (
    <div className="mt-2 rounded-lg border border-line">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-left">
        <span className="text-[11.5px] font-medium text-brand">View role’s permissions</span>
        <span className="text-[10px] text-faint">{open ? '▾' : '▸'}</span>
      </button>
      {open && def && (
        <div className="border-t border-line px-3 py-2.5">
          {CO_PERM_GROUPS.map((g) => (
            <div key={g.module} className="mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{g.module}</p>
              {g.perms.map((p) => (
                <p key={p.key} className={cn('text-[11.5px]', def.perms.includes(p.key) ? 'text-ink' : 'text-faint line-through')}>
                  {def.perms.includes(p.key) ? '' : '—'} {p.label}
                </p>
              ))}
            </div>
          ))}
          {def.admin && <p className="text-[11.5px] text-ink">Manage users &amp; roles</p>}
        </div>
      )}
    </div>
  )
}

/** Attachment tray shared by every activity type — images and forwarded emails. */
/* What may be attached depends on the activity: a chat is screenshots (you cannot
   attach an email to a Zalo thread), a meeting can carry both a photo of the room
   and the follow-up email. A CALL gets no attach row at all — Calio syncs the
   recording and outcome automatically, so a manual control there is noise. */
function AttachRow({ atts, onAdd, onDrop, allow = ['image', 'email'] }: { atts: CoAtt[]; onAdd: (a: CoAtt) => void; onDrop: (i: number) => void; allow?: CoAtt['kind'][] }) {
  const n = atts.filter((a) => a.kind === 'image').length
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Đính kèm</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {atts.map((a, i) => (
          <span key={i} className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]', a.kind === 'email' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-line bg-canvas text-muted')}>
            <span>{a.kind === 'email' ? '' : ''}</span>
            <span className="max-w-[150px] truncate">{a.label}</span>
            <button onClick={() => onDrop(i)} className="ml-0.5 text-faint hover:text-ink">✕</button>
          </span>
        ))}
        {allow.includes('image') && <button onClick={() => onAdd({ kind: 'image', label: `anh-${n + 1}.png` })} className="rounded-md border border-dashed border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">+ Ảnh</button>}
        {allow.includes('email') && <button onClick={() => onAdd({ kind: 'email', label: 'RE- trao đổi.eml' })} className="rounded-md border border-dashed border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">+ Email</button>}
      </div>
    </div>
  )
}

function CompanyActivities({ c }: { c: Company }) {
  const [kind, setKind] = useState<null | 'chat' | 'call' | 'meeting'>(null)
  const [channel, setChannel] = useState('Zalo')
  const [note, setNote] = useState('')
  const [atts, setAtts] = useState<CoAtt[]>([])
  const [when, setWhen] = useState('20/07/2026')
  const [time, setTime] = useState('14:00')
  const [mins, setMins] = useState('60')
  const [place, setPlace] = useState('Tại văn phòng khách hàng')
  const [logged, setLogged] = useState<CoEvent[]>([])
  /* SINGLE-select, not a set of toggles. The old chips were multi-select, so tapping
     "Sales" while everything was on REMOVED sales — the opposite of what a tap looks
     like it should do. One active view at a time is what a tab bar promises.
     Defaults to Sales: contact with the client is what this panel is read for, and
     it is the only kind that resets Idle. */
  const [feed, setFeed] = useState<'sales' | 'client' | 'system' | 'all'>('sales')
  const all = [...logged, ...companyActivity(c)]
  const rows = feed === 'all' ? all : all.filter((e) => e.kind === feed)
  const countOf = (k: CoKind) => all.filter((e) => e.kind === k).length

  const save = () => {
    const base = { time: 'just now', kind: 'sales' as CoKind, days: 0, by: ME, atts: atts.length ? atts : undefined }
    const entry: CoEvent =
      kind === 'chat'
        ? { ...base, icon: '', tone: CHAT, title: `Chat · ${channel}`, sub: note.trim() || 'No note added.' }
        : kind === 'meeting'
          ? { ...base, icon: '', tone: MEET, title: `Meeting · ${place.toLowerCase()}`, sub: `${note.trim() || 'No note added.'} ${mins} phút · ${time} ${when}.` }
          : { ...base, icon: '', tone: CALL, title: 'Call · logged via Calio', sub: note.trim() || 'Call synced from Calio — outcome & recording attached.' }
    setLogged((p) => [entry, ...p])
    setKind(null); setNote(''); setChannel('Zalo'); setAtts([])
  }
  const addAtt = (a: CoAtt) => setAtts((p) => [...p, a])
  const dropAtt = (i: number) => setAtts((p) => p.filter((_, j) => j !== i))

  return (
    // min-w-0 so the trail's table scrolls inside this column instead of forcing
    // the whole Overview grid wider than the page.
    <div className="min-w-0 space-y-4">
      {/* composer — OPEN to anyone who can see the company (owner, teammates, lead,
          manager). Logging is append-only and is credited to the SIGNED-IN user,
          not the sales owner — whoever does the work gets the KPI. Editing the
          company's own fields stays owner-only, but that gate lives on the Overview
          card, not here. */}
      {(
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-3.5 py-2.5">
          <p className="text-[12.5px] font-bold">Log an activity</p>
          <span className="ml-auto text-[10.5px] text-faint">Ghi cho <b className="text-ink/70">bạn</b> (người đăng nhập), không phải chủ sở hữu</span>
        </div>
        <div className="p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setKind('chat')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'chat' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Chat</button>
            <button onClick={() => setKind('call')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'call' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Call</button>
            <button onClick={() => setKind('meeting')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'meeting' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Meeting</button>
            {/* Stamped with the signed-in account, not the company's sales owner —
                whoever actually does the work is who gets the KPI for it. */}
            {kind && <span className="ml-auto text-[11px] text-faint">Ghi nhận cho <b className="font-medium text-ink/70">{ME}</b></span>}
          </div>

          {kind === 'chat' && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Channel <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {CHAT_CHANNELS.map((ch) => (
                    <button key={ch} onClick={() => setChannel(ch)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', channel === ch ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{ch}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note <span className="text-rose-500">*</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={`What did you discuss on ${channel}?`} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              {/* Screenshots only — an email is its own thread, not an attachment to a chat. */}
              <AttachRow atts={atts} onAdd={addAtt} onDrop={dropAtt} allow={['image']} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log chat</button>
              </div>
            </div>
          )}

          {kind === 'meeting' && (
            <div className="mt-3 space-y-2.5">
              {/* A meeting is the only activity with a scheduled MOMENT of its own —
                  a chat or a call is logged when it happened, a meeting is logged
                  against the slot it was held in (or will be held in). */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Ngày <span className="text-rose-500">*</span></label>
                  {/* Backdating is allowed, but only inside the current month: a rep
                      writing up yesterday's meeting is normal, one editing last
                      month's numbers after the period closed is not. */}
                  <input value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand" />
                  <p className="mt-1 text-[10px] leading-relaxed text-faint">Từ 01/08/2026 đến hôm nay</p>
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Giờ <span className="text-rose-500">*</span></label>
                  <input value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Thời lượng</label>
                  <select value={mins} onChange={(e) => setMins(e.target.value)} className="w-full cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand">
                    {['15', '30', '45', '60', '90', '120'].map((m) => <option key={m} value={m}>{m} phút</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Hình thức</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Tại văn phòng khách hàng', 'Tại văn phòng Saramin', 'Online — Google Meet', 'Online — Zoom', 'Khác'].map((pl) => (
                    <button key={pl} onClick={() => setPlace(pl)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', place === pl ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{pl}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Nội dung <span className="text-rose-500">*</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Nội dung trao đổi, thống nhất, việc cần làm tiếp…" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              <AttachRow atts={atts} onAdd={addAtt} onDrop={dropAtt} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log meeting</button>
              </div>
            </div>
          )}

          {kind === 'call' && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Call summary / next step… (auto-filled from Calio when available)" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              {/* No attach row: Calio syncs the recording and outcome onto the call
                  automatically, so a manual attach control here is dead weight. */}
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log call</button>
              </div>
            </div>
          )}

        </div>
      </div>
      )}

      {/* history — table so the whole trail is scannable at a glance */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-ink">Activity <span className="font-normal text-muted">— everything that happened on this account</span></p>

        </div>
        {/* One active view at a time. Sales sits first and is the default because it
            is the reason the panel exists; Client and System are context. */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-line">
            {([
              { k: 'sales' as const, label: 'Sales', n: countOf('sales') },
              { k: 'client' as const, label: 'Client', n: countOf('client') },
              { k: 'system' as const, label: 'System', n: countOf('system') },
              { k: 'all' as const, label: 'Tất cả', n: all.length },
            ]).map((t, i) => {
              const on = feed === t.k
              return (
                <button
                  key={t.k}
                  onClick={() => setFeed(t.k)}
                  title={t.k === 'all' ? 'Toàn bộ dòng thời gian' : KIND_META[t.k].hint}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] transition-colors',
                    i > 0 && 'border-l border-line',
                    on ? 'bg-brand font-medium text-white' : 'text-muted hover:bg-canvas',
                  )}
                >
                  {t.label}
                  <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', on ? 'bg-white/25 text-white' : 'bg-canvas text-faint')}>{t.n}</span>
                </button>
              )
            })}
          </div>
          {feed === 'sales' && <span className="text-[10.5px] text-faint">Chat · call · meeting · tài liệu đã gửi — chỉ nhóm này reset Idle.</span>}
        </div>
        {/* "Never contacted" is an ALARM about the relationship, so it may only fire
            when there is genuinely no sales activity — not merely because the reader
            is standing on an empty Client or System tab. */}
        {rows.length === 0 && countOf('sales') === 0 ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-3.5 py-4 text-center">
            <p className="text-[12.5px] font-medium text-rose-700">Never contacted</p>
            <p className="mt-0.5 text-[11.5px] text-rose-700/80">No sales activity has ever been logged for this company — the highest-priority follow-up, not the lowest.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-canvas/40 px-3.5 py-4 text-center">
            <p className="text-[12px] text-muted">Chưa có hoạt động nào thuộc nhóm <b className="text-ink/70">{feed === 'client' ? 'Client' : 'System'}</b> cho công ty này.</p>
          </div>
        ) : (
          <Table
            cols={[{ label: 'When', w: '0.8fr' }, { label: 'Activity', w: '1.3fr' }, { label: 'Who', w: '1fr' }, { label: 'Details', w: '2.4fr' }]}
            rows={rows.map((e) => [
              <span className="text-[11.5px] text-muted">{e.time}</span>,
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]', e.tone)}>{e.icon}</span>
                <span className="truncate font-medium text-ink">{e.title}</span>
              </span>,
              /* The NAMED account, with the side it acted for underneath. The KPI
                 counts this name — a colleague covering for the owner gets the credit. */
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[11.5px] font-medium text-ink/80">{e.by}</span>
                <span className="text-[10px] text-faint">{KIND_META[e.kind].label}</span>
              </span>,
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-muted">{e.sub}</span>
                {e.atts && e.atts.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1">
                    {e.atts.map((a, i) => (
                      <span key={i} className={cn('inline-flex max-w-[160px] items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]', a.kind === 'email' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-line bg-canvas text-muted')}>
                        <span>{a.kind === 'email' ? '' : ''}</span>
                        <span className="truncate">{a.label}</span>
                      </span>
                    ))}
                  </span>
                )}
              </span>,
            ])}
          />
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
          One trail for the whole account: <b>Sales</b> (what we did), <b>Client</b> (what the customer did — posted a job, opened a CV, paid) and <b>System</b> (invoice issued, products provisioned, quota warnings).
          <b> Idle counts from the newest Sales row only</b>, so a client opening a CV can never make a silent account look freshly contacted. PII actions (CV unlocks) are always audited.
          <b className="text-ink/70"> Who</b> is the account that actually performed the activity, not the company’s sales owner — that is the account the KPI counts, so a colleague covering for a busy owner gets the credit.
        </p>
      </div>
    </div>
  )
}

function CoTabBar({ tabs, active, onSelect }: { tabs: { key: CoTab; label: string; count?: number }[]; active: CoTab; onSelect: (t: CoTab) => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-0.5 border-b border-line-soft">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={cn(
            'relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors',
            active === t.key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {t.label}
          {t.count != null && <span className={cn('rounded-full px-1.5 text-[10px]', active === t.key ? 'bg-brand text-white' : 'bg-canvas text-faint')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* Products & quota block — shared by the Overview snapshot and the billing tab */
function ProductsQuota({ c, compact }: { c: Company; compact?: boolean }) {
  const noProducts = !c.jobPosting && !c.resumeSearch
  /* A company's history matters as much as its current entitlement — "what did they
     buy last year?" is the first question on a renewal call. Past purchases are a
     second list behind a toggle rather than a third card: same rows, same shape,
     just no longer counting toward quota. */
  const [showPast, setShowPast] = useState(false)
  const past = pastPurchases(c)
  return (
    <>
      {!compact && (
        <>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">{showPast ? 'Đã kết thúc' : 'Đang dùng'}</p>
            <span className="inline-flex overflow-hidden rounded-md border border-line text-[10px] font-medium">
              <button onClick={() => setShowPast(false)} className={cn('px-1.5 py-0.5', !showPast ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}>Đang dùng</button>
              <button onClick={() => setShowPast(true)} className={cn('border-l border-line px-1.5 py-0.5', showPast ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}>Đã kết thúc {past.length > 0 && `(${past.length})`}</button>
            </span>
          </div>
          {/* These lines land here the moment Kế toán issues the VAT invoice on the
              PO — immediately, with no further step. Until then the company has no
              quota and cannot post a job or open a CV. */}
          {showPast ? (
            past.length === 0
              ? <p className="text-[12px] text-muted">Chưa có sản phẩm nào kết thúc.</p>
              : <div className="space-y-1.5">{past.map((x, i) => <PurchaseRow key={i} {...x} expired />)}</div>
          ) : noProducts ? (
            <p className="text-[12px] text-muted">No purchases on record yet — products appear here as soon as a VAT invoice is issued on a PO.</p>
          ) : (
            <div className="space-y-1.5">
              {c.jobPosting && <PurchaseRow name="Job Posting — Pro" detail="10 slots · 3 months" amount="15,000,000 ₫" date={c.since} />}
              {c.resumeSearch && <PurchaseRow name="Resume Search — 6 months" detail="100 CV unlocks" amount="20,000,000 ₫" date={c.since} />}
            </div>
          )}
        </>
      )}
      {!noProducts && (
        <>
          <p className={cn('mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint', !compact && 'mt-3.5')}>Quota in use</p>
          <div className="space-y-3">
            {c.jobPosting && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]"><b>Job posting</b><span className="tabular-nums font-semibold">{c.jobLeft}<span className="font-normal text-faint">/{c.jobTotal} slots</span></span></div>
                <QuotaBar left={c.jobLeft} total={c.jobTotal} />
              </div>
            )}
            {c.resumeSearch && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]"><b>Resume search</b><span className="tabular-nums font-semibold">{c.cvLeft}<span className="font-normal text-faint">/{c.cvTotal} unlocks</span></span></div>
                <QuotaBar left={c.cvLeft} total={c.cvTotal} />
              </div>
            )}
            <p className="text-[11px] text-faint">Valid until 31/12/2026.</p>
          </div>
        </>
      )}
      {noProducts && c.account === 'Churn' && <p className="mt-2 text-[11px] text-amber-700">Subscription expired — no active quota. Renew to reactivate.</p>}
    </>
  )
}

function ServiceUsageCard({ c }: { c: Company }) {
  const svc = SERVICE_USAGE[c.name] ?? []
  const [logging, setLogging] = useState<ServiceEntitlement | null>(null)
  const [open, setOpen] = useState<string | null>(svc[0]?.sku ?? null)

  if (svc.length === 0) {
    return (
      <DetailCard title="Manual service — đã sử dụng">
        <p className="text-[12px] text-muted">Công ty này chưa mua dịch vụ thủ công nào (bài đăng fanpage, email marketing…).</p>
      </DetailCard>
    )
  }

  return (
    <DetailCard title="Manual service — đã sử dụng" action={<span className="text-[11px] text-faint">1 ghi nhận = 1 lượt</span>}>
      <div className="space-y-2.5">
        {svc.map((e) => {
          const used = e.entries.length
          const left = e.total - used
          const exhausted = left <= 0
          const expanded = open === e.sku
          return (
            <div key={e.sku} className="rounded-lg border border-line">
              <button onClick={() => setOpen(expanded ? null : e.sku)} className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left">
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium text-ink">{e.name}</span>
                  <span className="block text-[10.5px] text-faint">{used} / {e.total} {e.unit} đã dùng</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={cn('text-[12px] font-semibold tabular-nums', exhausted ? 'text-rose-600' : 'text-ink')}>
                    {left}<span className="font-normal text-faint"> còn lại</span>
                  </span>
                  <span className="text-faint">{expanded ? '▾' : '▸'}</span>
                </span>
              </button>
              <div className="px-3 pb-2"><QuotaBar left={left} total={e.total} /></div>

              {expanded && (
                <div className="border-t border-line-soft px-3 py-2.5">
                  {e.entries.length === 0 ? (
                    <p className="text-[11.5px] text-muted">Chưa ghi nhận lượt nào.</p>
                  ) : (
                    <ol className="space-y-2">
                      {e.entries.map((d, i) => (
                        <li key={d.id} className="flex gap-2">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-canvas text-[9px] font-semibold text-muted">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <span className="text-[11.5px] font-medium tabular-nums text-ink">{d.date}</span>
                              <a href={d.link} onClick={(ev) => ev.preventDefault()} className="min-w-0 truncate text-[11px] text-brand hover:underline">{d.link}</a>
                            </div>
                            <p className="text-[11px] leading-relaxed text-muted">{d.content}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-faint">
                              {d.image
                                ? <span className="rounded border border-line bg-canvas px-1 font-mono">🖼 {d.image}</span>
                                : <span className="text-amber-700">⚠️ chưa có ảnh</span>}
                              <span>· {d.by}</span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                  <button
                    onClick={() => setLogging(e)}
                    disabled={exhausted}
                    className="mt-2.5 rounded-md border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-faint"
                  >
                    {exhausted ? 'Đã dùng hết — không thể ghi nhận thêm' : '+ Ghi nhận đã đăng'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-2.5 text-[10.5px] leading-relaxed text-faint">
        Hệ thống không tự đếm được dịch vụ thủ công — số còn lại tính từ <b className="text-ink/70">số lượt đã ghi nhận</b>,
        không nhập tay. Muốn sửa một lượt thì sửa chính ghi nhận đó.
      </p>
      {logging && <LogServiceDeliveryModal e={logging} company={coLabel(c)} onClose={() => setLogging(null)} />}
    </DetailCard>
  )
}

function LogServiceDeliveryModal({ e, company, onClose }: { e: ServiceEntitlement; company: string; onClose: () => void }) {
  const [date, setDate] = useState('')
  const [link, setLink] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<string | null>(null)
  /* Link + content are required, image is not: an email blast has no screenshot
     worth keeping, but every delivery has somewhere it landed and something it
     said. Without those two the entry cannot answer "show me what we posted". */
  const valid = Boolean(date) && Boolean(link.trim()) && Boolean(content.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Ghi nhận đã đăng</p>
            <p className="text-[11px] text-muted">{e.name} · {company}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel req>Ngày đăng</FLabel>
              <input
                type="date"
                value={date}
                onChange={(ev) => setDate(ev.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
              />
            </div>
            <LField label="Người thực hiện" value="Nguyễn Thị Lan" hint="Lấy từ người đang đăng nhập." />
          </div>

          <div>
            <FLabel req>Link bài đăng</FLabel>
            <input
              value={link}
              onChange={(ev) => setLink(ev.target.value)}
              placeholder="https://facebook.com/topdev.vn/posts/…"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Bắt buộc — đây là thứ khách hỏi khi đối chiếu hoá đơn: “cho tôi xem bài đã đăng”.</p>
          </div>

          <div>
            <FLabel req>Nội dung đã đăng</FLabel>
            <textarea
              value={content}
              onChange={(ev) => setContent(ev.target.value)}
              rows={3}
              placeholder="Tóm tắt nội dung, thông điệp chính, CTA…"
              className="w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
          </div>

          <div>
            <FLabel>Ảnh chụp / ảnh đã dùng<span className="ml-1 font-normal text-faint">không bắt buộc</span></FLabel>
            <div className="rounded-lg border border-dashed border-line px-3 py-3 text-center">
              {image ? (
                <span className="flex items-center justify-center gap-2 text-[12px]">
                  <span className="truncate font-mono text-ink/80">{image}</span>
                  <button onClick={() => setImage(null)} className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-muted hover:border-rose-300 hover:text-rose-600">Gỡ</button>
                </span>
              ) : (
                <button onClick={() => setImage('proof-screenshot.jpg')} className="text-[12px] font-medium text-brand hover:underline">⬆ Tải ảnh lên</button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            Lưu — trừ 1 {e.unit}
          </button>
        </div>
      </div>
    </div>
  )
}

/** One collapsible section = one card on the live page. `state` is what the
    section contributes to the page, said in the reviewer's language. */
function PageSec({
  n, title, sub, state, tone, open, onToggle, children,
}: {
  n: number; title: string; sub: string
  state: string; tone: StatusTone
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border', open ? 'border-brand/50' : 'border-line')}>
      <button onClick={onToggle} className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left', open ? 'bg-brand-soft/40' : 'bg-canvas/40 hover:bg-canvas/70')}>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-surface text-[10px] font-bold tabular-nums text-muted">{n}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold text-ink">{title}</span>
          <span className="block truncate text-[10.5px] text-faint">{sub}</span>
        </span>
        <Pill tone={tone}>{state}</Pill>
        <span className="shrink-0 text-[11px] text-faint">{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="space-y-2.5 border-t border-line px-3 py-3">{children}</div>}
    </div>
  )
}

/** A slot that holds an uploaded asset — photo, video, logo. */
function AssetSlot({ label, filled }: { label: string; filled?: boolean }) {
  return (
    /* h-full matters: the hero slot sits inside a `row-span-2` wrapper, and without
       it the slot only takes its text height while the wrapper stays tall — the
       mosaic then reads as one short box beside a full-height column. */
    <div className={cn(
      'grid h-full place-items-center rounded-md border border-dashed px-2 py-3 text-center',
      filled ? 'border-brand/40 bg-brand-soft/30' : 'border-line bg-canvas/40',
    )}>
      <span className={cn('text-[10.5px] leading-tight', filled ? 'font-medium text-brand' : 'text-faint')}>
        {filled ? label : `+ ${label}`}
      </span>
    </div>
  )
}

/* jobseeker company page — editor + draft preview, shared by Overview + its tab */
function CompanyPageEditor({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [open, setOpen] = useState<number | null>(1)
  const [traits, setTraits] = useState<string[]>(c.hasPage ? ['Thành viên tập đoàn', 'Làm việc từ xa', 'Trang phục tự do'] : [])
  /* Which of the 11 shared codes this company has declared. BenefitsField owns the
     editing from here; this is only the seed and the section's status line. */
  const bens = c.hasPage ? ['insurance', 'health', 'bonus', 'salary-13th', 'allowance', 'paid-leave', 'training'] : []
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const has = c.hasPage
  const toggle = (n: number) => setOpen((o) => (o === n ? null : n))

  /* The editor is open for EVERY company — no Job Posting product required (BA
     decision). Products gate what a customer's JOBS can do, not whether HQ may
     prepare the page: a rep filling the page during the sales conversation is
     exactly the pitch ("this is how you'll look on Saramin"), and requiring the
     purchase first makes the page perpetually one step behind the deal. */

  /* The five publish blockers, in the order they appear on the page. Everything
     else is optional by design and never appears here. */
  const gates = [
    { label: 'Logo', ok: has },
    { label: 'Tên hiển thị', ok: true },
    { label: 'Ngành nghề', ok: true },
    { label: 'Địa chỉ', ok: true },
    { label: 'Giới thiệu (VI)', ok: has },
  ]
  const missing = gates.filter((g) => !g.ok)
  /* Every section, with whether it would actually RENDER on the live page. ONE list
     drives the rail, the per-section pills and the percentage — when these were
     three separate arrays the meter drifted out of step with the sections it was
     supposed to be counting. `auto` is section 2, which nobody fills by hand and
     which therefore must not inflate the score. */
  const secs = [
    { n: 1, title: 'Nhận diện', ok: has, req: true },
    { n: 2, title: 'Company at a glance', ok: true },
    { n: 3, title: 'Đặc điểm nổi bật', ok: traits.length > 0 },
    { n: 4, title: 'Company vision', ok: has, req: true },
    { n: 5, title: 'Video giới thiệu', ok: has },
    { n: 6, title: 'Hình ảnh công ty', ok: has },
    { n: 7, title: 'Phúc lợi & Chế độ', ok: bens.length > 0 },
  ]
  const optional = secs.filter((s) => !s.req)
  const done = gates.length - missing.length + optional.filter((s) => s.ok).length
  const pct = Math.round((done / (gates.length + optional.length)) * 100)

  return (
    /* Container query, not a viewport breakpoint: this card sits inside a column
       whose width has nothing to do with the window's. Keyed on `lg:` the rail
       split fired on a wide monitor while the editor column was still 370px, which
       is narrower than the logo previews inside it.
       The @container marker has to sit on a WRAPPER — an element cannot answer a
       container query against itself, only its descendants can. */
    <div className="@container">
    <div className="grid gap-3 @[820px]:grid-cols-[minmax(0,1fr)_260px] @[820px]:items-start">
      {/* ═══ LEFT — the sections, in live-page order ═══════════════════════ */}
      <div className="min-w-0 space-y-2">

      {/* ── 1. Identity — the sticky sidebar on the live page ───────────────── */}
      <PageSec n={1} title="Nhận diện" sub="Sidebar · logo, company tags" state={has ? 'Đã có' : 'Thiếu logo'} tone={has ? 'active' : 'pending'} open={open === 1} onToggle={() => toggle(1)}>
        {/* Tên hiển thị is NOT edited here — it lives on the Overview tab, in Thông
            tin cơ bản, with the rest of the company's identity. The page reads it. */}
        {/* One asset, two frames, plus the peer row that settles the size — see LogoSizer. */}
        <div>
          <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Logo <span className="text-rose-500">*</span></p>
          <LogoSizer company={c.name} />
        </div>
        {/* Company tags moved off the create form and land here, with the rest of how
            the company presents itself. */}
        <div>
          <p className="mb-1 text-[11px] font-medium text-ink/80">Company tags</p>
          <CompanyTagPicker initial={['Korean company']} />
        </div>
      </PageSec>

      {/* ── 2. Registry facts — ONE stored value, editable from either tab ──── */}
      <PageSec n={2} title="Company at a glance" sub="Thành lập · hình thức · nhân sự · doanh thu · business detail · địa chỉ" state="Đã có" tone="active" open={open === 2} onToggle={() => toggle(2)}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* Founding date LEADS the card, matching Saramin KR's strip — the first
              tile there is 업력 (years in business) over the founding date. It is
              also the only field here that reads as a claim about the company
              rather than a classification of it. */}
          <PageField label="Ngày thành lập" type="date" ro={ro} value="1993-09-27" />
          <PageField label="Business form" ro={ro} value="Mid-sized company" options={BUSINESS_FORMS} hint="Quy mô + tính chất sở hữu — KHÁC “Loại hình doanh nghiệp” (hình thức pháp lý trên ĐKKD, nằm ở tab Overview)." />
          <PageField label="Number of employees" type="number" suffix="người" ro={ro} value="1240" hint="Một con số chính xác, không phải khoảng. Dải quy mô cho bộ lọc được suy ra từ số này." />
          <PageField label="Revenues" type="number" suffix="₫" ro={ro} value="441840000000" hint="Doanh thu năm gần nhất, đơn vị đồng. Nhập số thuần — hệ thống tự tách hàng nghìn khi hiển thị." />
        </div>
        {/* Business detail sits BELOW the tile grid, not inside it: the strip is
            exactly 4 tiles wide and a 5th breaks the row, and this is free text
            rather than a fact tile. It lives here because it reads as the prose
            companion to Business form directly above it. */}
        <PageField
          label="Business detail" area maxWords={80} ro={ro}
          value={`${c.industry} · Dịch vụ ${c.industry.toLowerCase()} cho khách hàng doanh nghiệp và cá nhân trên toàn quốc.`}
        />
        {/* Address + its map link moved up from the old section 8. They belong with
            the facts, exactly as Saramin KR has them: 주소 with a 지도보기 button
            sitting in the same detail grid as 업종 and 사업내용, not in a section of
            their own. A lone address is not worth a section header. */}
        <PageField label="Địa chỉ" ro={ro} value={c.address} wide />
        <PageField label="Google Maps link" ro={ro} value="https://maps.app.goo.gl/…" wide hint="Dán link chia sẻ từ Google Maps — nút “Xem bản đồ” trên trang công khai trỏ vào đây. Bỏ trống thì chỉ hiện dòng địa chỉ." />
      </PageSec>

      {/* ── 3. Trait chips ─────────────────────────────────────────────────── */}
      <PageSec n={3} title="Đặc điểm nổi bật" sub="Dải chip dưới thẻ facts · danh sách cố định" state={traits.length ? `${traits.length} chip` : 'Trống — ẩn'} tone={traits.length ? 'active' : 'neutral'} open={open === 3} onToggle={() => toggle(3)}>
        <div className="flex flex-wrap gap-1.5">
          {CP_TRAITS.map((t) => {
            const on = traits.includes(t)
            return (
              <button
                key={t}
                disabled={ro}
                onClick={() => setTraits((p) => (p.includes(t) ? p.filter((x) => x !== t) : p.length >= 6 ? p : [...p, t]))}
                className={cn('rounded-full border px-2.5 py-1 text-[11px]', on ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line bg-surface text-muted hover:border-brand/40', ro && 'cursor-not-allowed opacity-50')}
              >{t}</button>
            )
          })}
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Tối đa 6. Danh sách cố định (không tự nhập) — đó chính là lý do chip <b className="text-ink/70">so sánh được giữa các công ty và lọc được</b> ở trang tìm công ty. {traits.length}/6 đã chọn.
        </p>
      </PageSec>

      {/* ── 4. About ───────────────────────────────────────────────────────── */}
      <PageSec n={4} title="Company vision" sub="Tầm nhìn · sứ mệnh · giới thiệu · VI bắt buộc" state={has ? 'Đã có' : 'Bắt buộc — trống'} tone={has ? 'active' : 'pending'} open={open === 4} onToggle={() => toggle(4)}>
        <div className="mb-1 flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
          {/* Two languages only — VI required, EN optional. No KO. */}
          {(['VI', 'EN'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={cn('px-2.5 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}{l === 'VI' && ' *'}</button>
          ))}
        </div>
        <textarea
          readOnly={ro}
          rows={4}
          defaultValue={has && lang === 'VI' ? `${c.shortName || c.name} là một trong những doanh nghiệp ${c.industry.toLowerCase()} hàng đầu Việt Nam…` : ''}
          placeholder={lang === 'VI' ? 'Giới thiệu công ty bằng tiếng Việt…' : `Bản dịch ${lang} — bỏ trống thì trang hiển thị bản tiếng Việt.`}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-brand"
        />
        <p className="text-[10.5px] text-faint">VI là bản bắt buộc VÀ là bản dự phòng: thiếu EN/KO thì trang tự hiển thị tiếng Việt, không bao giờ để trống.</p>
      </PageSec>

      {/* ── 5. Video ───────────────────────────────────────────────────────── */}
      <PageSec n={5} title="Video giới thiệu" sub="Tối đa 3 · chỉ nhúng YouTube hoặc Vimeo" state={has ? '1/3' : 'Trống — ẩn'} tone={has ? 'active' : 'neutral'} open={open === 5} onToggle={() => toggle(5)}>
        <div className="space-y-1.5">
          {(has ? ['https://youtube.com/watch?v=…  ·  “Vượt trội mỗi ngày” · 2:14'] : []).map((v) => (
            <div key={v} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px]">
              <span className="min-w-0 flex-1 truncate text-ink/80">{v}</span>
              <button disabled={ro} className="shrink-0 text-[11px] text-faint hover:text-rose-600 disabled:opacity-40">Bỏ</button>
            </div>
          ))}
          <input readOnly={ro} placeholder="Dán link YouTube / Vimeo…" className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px] outline-none placeholder:text-faint focus:border-brand" />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">Chỉ nhận link từ danh sách host cho phép — không cho tải file video lên, vì băng thông và kiểm duyệt nội dung không thuộc phạm vi Phase-1.</p>
      </PageSec>

      {/* ── 6. Photos ──────────────────────────────────────────────────────── */}
      <PageSec n={6} title="Hình ảnh công ty" sub="Bố cục 1 ảnh lớn + 4 ảnh nhỏ · cần ≥3 ảnh" state={has ? '5 ảnh' : 'Trống — ẩn'} tone={has ? 'active' : 'neutral'} open={open === 6} onToggle={() => toggle(6)}>
        {/* The live mosaic, laid out ready: 1 hero left + 4 tiles right (Figma
            83:21921). Slots are pre-drawn so the shape is obvious before any photo
            is uploaded — an empty grid of equal squares does not tell an operator
            which picture is about to be the big one. */}
        <div className="grid h-44 grid-cols-4 grid-rows-2 gap-1.5">
          <div className="col-span-2 row-span-2"><AssetSlot label={has ? 'Trụ sở Hà Nội (hero)' : 'Ảnh hero'} filled={has} /></div>
          <AssetSlot label={has ? 'Không gian làm việc' : 'Ảnh 2'} filled={has} />
          <AssetSlot label={has ? 'Sự kiện Gala' : 'Ảnh 3'} filled={has} />
          <AssetSlot label={has ? 'Team building' : 'Ảnh 4'} filled={has} />
          <AssetSlot label={has ? 'Hoạt động CSR' : 'Ảnh 5'} filled={has} />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Ảnh đầu tiên là <b className="text-ink/70">hero</b> và chiếm nửa khối bên trái — thứ tự ở đây quyết định ảnh nào lên hero. Dưới 3 ảnh thì cả thẻ bị ẩn: một mosaic thủng lỗ trông tệ hơn là không có.
        </p>
      </PageSec>

      {/* ── 7. Benefits ────────────────────────────────────────────────────── */}
      {/* The SAME 11 codes the job form uses, not a second 8-group list. The Figma
          draws 8 groups, but the spec already decided one shared taxonomy — that is
          what lets a job's benefits be merged with the company's and de-duplicated.
          Two lists would make "Lương thưởng" and "Lương & thưởng" different rows. */}
      <PageSec n={7} title="Phúc lợi & Chế độ" sub="Bộ phúc lợi MẶC ĐỊNH · điền sẵn cho mọi tin tuyển dụng mới" state={`${bens.length} nhóm`} tone={bens.length ? 'active' : 'neutral'} open={open === 7} onToggle={() => toggle(7)}>
        <div className="rounded-md border border-line bg-canvas/30 p-2.5">
          <BenefitsField
            label="Phúc lợi chung của công ty"
            initial={bens}
          />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Đây là <b className="text-ink/70">bộ mặc định</b> cho phúc lợi: tin tuyển dụng mới mở form được <b className="text-ink/70">điền sẵn</b> bộ này (bản sao), rồi người đăng thêm bớt tuỳ ý cho vị trí. Sửa ở đây <b className="text-ink/70">không</b> tự đổi tin đã đăng — tin cũ lấy bản mới bằng nút “↺ Về mặc định công ty” trên form; tin mới luôn lấy bản mới nhất.
        </p>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Không giới hạn 6 như ở tin tuyển dụng — trang công ty được đọc một lần chứ không bị so sánh cạnh các tin khác, nên liệt kê đủ là có lợi.
        </p>
      </PageSec>

      {/* ── 8. Offices — the same book the job form picks from ──────────────── */}
      </div>

      {/* ═══ RIGHT — progress rail ════════════════════════════════════════════
          Sticky, because the thing it answers ("what is still missing, can I
          publish yet") is asked while scrolling through eleven sections, not
          before starting. The publish actions live here too: the gate and the
          button it gates belong in the same place, or the button is 2000px away
          from the reason it is disabled. */}
      <aside className="space-y-2 @[820px]:sticky @[820px]:top-2">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className={cn('text-[12px] font-semibold', missing.length ? 'text-amber-800' : 'text-emerald-700')}>
            {missing.length === 0 ? 'Đủ điều kiện đăng' : `Còn thiếu ${missing.length} mục bắt buộc`}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[19px] font-bold tabular-nums leading-none text-ink">{pct}%</span>
            <span className="text-[10.5px] text-faint">hoàn thiện</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"><div className={cn('h-full rounded-full', missing.length ? 'bg-amber-500' : 'bg-brand')} style={{ width: `${pct}%` }} /></div>

          {/* The gate CHECKLIST is gone — the headline above already names how many
              are missing, and the disabled Publish button names which. The section
              list below carries the * markers, so the required items are still
              visible without a second list repeating them. */}
          <div className="mt-3 space-y-0.5">
            {secs.map((s) => (
              <button
                key={s.n}
                onClick={() => setOpen(s.n)}
                className={cn('flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] hover:bg-canvas', open === s.n && 'bg-brand-soft/60')}
              >
                <span className={cn(
                  'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border text-[8px] font-bold',
                  s.ok ? 'border-transparent bg-emerald-500 text-white' : 'border-dashed border-line text-transparent',
                )}>✓</span>
                <span className={cn('min-w-0 flex-1 truncate', open === s.n ? 'font-semibold text-brand' : s.ok ? 'text-ink/80' : 'text-faint')}>{s.title}</span>
                {s.req && <span className="shrink-0 text-[9px] text-rose-500">*</span>}
              </button>
            ))}
          </div>
        </div>

        {/* actions, next to the gate that governs them */}
        <div className="space-y-1.5 rounded-lg border border-line bg-surface p-3">
          <a href="#" onClick={(e) => e.preventDefault()} className="block text-[11.5px] font-medium text-brand hover:underline">↗ Xem thử bản nháp</a>
          {ro ? (
            <p className="rounded-md border border-dashed border-line bg-canvas/50 px-2 py-1.5 text-[10.5px] leading-relaxed text-muted">{RO_HINT}</p>
          ) : has ? (
            <>
              <button className="w-full rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Lưu thay đổi</button>
              <button className="w-full rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">↗ Xem trang thật</button>
              <button className="w-full rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-rose-300 hover:text-rose-600">Gỡ khỏi công khai</button>
            </>
          ) : (
            <>
              <button
                disabled={missing.length > 0}
                title={missing.length ? `Còn thiếu: ${missing.map((m) => m.label).join(', ')}` : undefined}
                className={cn('w-full rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white', missing.length ? 'cursor-not-allowed bg-brand/40' : 'bg-brand hover:opacity-90')}
              >Đăng trang</button>
              <button className="w-full rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand">Lưu nháp</button>
            </>
          )}
        </div>
      </aside>
    </div>
    </div>
  )
}

function GroupChart({ root, current, onClose, onOpen }: { root: Company; current: Company; onClose: () => void; onOpen?: (x: Company) => void }) {
  const rows: { c: Company; depth: number }[] = []
  const walk = (n: Company, depth: number) => {
    rows.push({ c: n, depth })
    childrenOf(n).forEach((k) => walk(k, depth + 1))
  }
  walk(root, 0)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[940px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Sơ đồ tập đoàn — {coLabel(root)}</p>
            <p className="text-[11px] text-muted">{rows.length} công ty · liên kết chỉ để tra cứu, không kế thừa quota, hợp đồng hay doanh thu.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto p-3">
          <div className="grid gap-x-3 border-b border-line px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: 'minmax(0,3.2fr) 1fr 0.9fr 1.1fr' }}>
            <span>Công ty</span><span>MST</span><span>Hạng</span><span>Sales phụ trách</span>
          </div>
          {rows.map(({ c, depth }) => {
            const t = tierOf(c)
            const isCurrent = c.name === current.name
            return (
              <button
                key={c.name}
                onClick={() => { onClose(); onOpen?.(c) }}
                className={cn('grid w-full items-center gap-x-3 border-b border-line-soft px-2 py-2 text-left text-[12px] transition-colors hover:bg-canvas/70', isCurrent && 'bg-brand-soft/50')}
                style={{ gridTemplateColumns: 'minmax(0,3.2fr) 1fr 0.9fr 1.1fr' }}
              >
                <span className="flex min-w-0 items-center" style={{ paddingLeft: depth * INDENT }}>
                  {depth > 0 && <span className="mr-1.5 shrink-0 text-faint">└</span>}
                  <span className={cn('min-w-0 truncate', isCurrent ? 'font-semibold text-brand' : 'text-ink/80')}>{coLabel(c)}</span>
                  {depth > 0 && <span className="ml-1.5 shrink-0"><Pill tone="neutral">Công ty con</Pill></span>}
                  {childrenOf(c).length > 0 && <span className="ml-1.5 shrink-0 rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>}
                </span>
                <span className="truncate font-mono text-[11px] text-muted">{c.tax}</span>
                <span className="min-w-0 truncate">{t ? <TierPill tier={t} en /> : <span className="text-[11px] text-faint">Chưa có hạng</span>}</span>
                <span className="truncate text-[11.5px] text-muted">{c.owner}</span>
              </button>
            )
          })}
        </div>

        <div className="border-t border-line bg-canvas/40 px-5 py-2.5 text-[10.5px] leading-relaxed text-muted">
          Mỗi công ty giữ <b className="text-ink/70">MST, gói/quota, hợp đồng, hoá đơn và sales phụ trách riêng</b>. Hạng thành viên
          cũng tính riêng từng pháp nhân — doanh thu công ty con <b className="text-ink/70">không</b> cộng lên công ty mẹ.
        </div>
      </div>
    </div>
  )
}

/* ── Link an EXISTING company as parent or child ───────────────────────────
   Two directions, one stored field. Whichever way the rep thinks about it
   ("this belongs to X" vs "X belongs to this"), the write is always the same:
   parentCompanyId on the CHILD. The modal makes that explicit — it shows the
   resulting mẹ → con pair before saving, so nobody has to work out which record
   actually changes. Every link is simply CÔNG TY CON: the old chi-nhánh /
   công-ty-con split was derived from the tax root and changed nothing a rep could
   act on, so it is gone. Companies sharing the 10-digit tax root are still
   surfaced FIRST in the picker, as the strongest hint of the same legal entity. */
function LinkAffiliateModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const [dir, setDir] = useState<'parent' | 'child'>('parent')
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Company | null>(null)

  // Cycle guard: for "c is a child of X", X may not sit under c; for "c is the
  // parent of X", X may not be an ancestor of c. Without this a group can be
  // linked into a loop that the ancestor walk would then have to survive. The loop
  // is also what Điều 195 forbids outright (a con may not hold capital in its mẹ),
  // so this guard is a legal rule, not only a data-integrity one.
  const candidates = COMPANIES.filter((x) => {
    if (x.name === c.name) return false
    if (dir === 'parent') return !ancestorsOf(x).some((a) => a.name === c.name)
    return !ancestorsOf(c).some((a) => a.name === x.name)
  }).filter((x) => {
    const k = searchKey(q.trim())
    return !k || searchKey([coLabel(x), x.legalName, x.tax, companyId(coKey(x))].join(' ')).includes(k)
  }).sort((a, b) => Number(taxRoot(b.tax) === taxRoot(c.tax)) - Number(taxRoot(a.tax) === taxRoot(c.tax)))

  // Whichever direction was chosen, resolve it to the one pair that gets stored.
  const parent = dir === 'parent' ? pick : c
  const child = dir === 'parent' ? c : pick
  // Re-parenting an existing child is allowed, but it MOVES the record out of its
  // current group — say so rather than letting the tree silently change shape.
  const moving = child?.parent ? coByName(child.parent) : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Gán quan hệ tập đoàn</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Quan hệ</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { k: 'parent' as const, t: `${coLabel(c)} là CÔNG TY CON`, s: 'Chọn công ty mẹ của công ty này', off: false },
                { k: 'child' as const, t: `${coLabel(c)} là CÔNG TY MẸ`, s: 'Chọn công ty con trực thuộc', off: false },
              ]).map((o) => (
                <button
                  key={o.k}
                  onClick={() => { if (o.off) return; setDir(o.k); setPick(null) }}
                  disabled={o.off}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left',
                    o.off ? 'cursor-not-allowed border-line bg-canvas/50 opacity-60' : dir === o.k ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40',
                  )}
                >
                  <span className="flex items-center gap-2"><Radio on={dir === o.k && !o.off} /><span className="text-[12px] font-semibold text-ink">{o.t}</span></span>
                  <span className="mt-0.5 block pl-6 text-[11px] text-muted">{o.s}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11.5px] font-medium text-ink/80">
              {dir === 'parent' ? 'Công ty mẹ' : 'Công ty con'} <span className="text-rose-500">*</span>
            </p>
            {/* The 10-digit tax root is the strongest signal two records are the same
                legal entity, so those companies are surfaced first and labelled —
                the rep should not have to notice the MST match themselves. */}
            <p className="mb-1.5 text-[10.5px] leading-relaxed text-faint">
              Gợi ý đầu danh sách là các công ty <b className="text-ink/70">trùng 10 số gốc MST</b> với {coLabel(c)} (<span className="font-mono">{taxRoot(c.tax)}</span>) — thường là cùng một pháp nhân. Vẫn tìm được mọi công ty khác bên dưới.
            </p>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, MST hoặc Company ID…"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <div className="mt-1.5 max-h-[200px] space-y-1 overflow-y-auto">
              {candidates.slice(0, 8).map((x) => {
                const sameRoot = taxRoot(x.tax) === taxRoot(c.tax)
                return (
                <button
                  key={x.name}
                  onClick={() => setPick(x)}
                  className={cn('flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left', pick?.name === x.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}
                >
                  <Radio on={pick?.name === x.name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate text-[12px] font-medium text-ink">{coLabel(x)}</span>
                      {sameRoot && <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1 py-px text-[9.5px] font-medium text-amber-700">cùng gốc MST</span>}
                    </span>
                    <span className="block truncate text-[10.5px] text-faint">MST {x.tax} · {companyId(coKey(x))} · {x.owner}</span>
                  </span>
                </button>
                )
              })}
              {candidates.length === 0 && <p className="rounded-md bg-canvas/60 px-2 py-3 text-center text-[11px] text-faint">Không có công ty phù hợp — đã loại công ty hiện tại và mọi lựa chọn sẽ tạo vòng lặp sở hữu.</p>}
            </div>
          </div>

          {pick && parent && child && (
            <div className="rounded-lg border border-line bg-canvas/40 p-3">
              <p className="mb-1.5 text-[11.5px] font-semibold text-ink/70">Sau khi lưu</p>
              <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                <span className="font-medium text-ink">{coLabel(parent)}</span>
                <span className="rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>
                <span className="text-faint">›</span>
                <span className="font-medium text-ink">{coLabel(child)}</span>
                <Pill tone="neutral">Công ty con</Pill>
              </div>
              {moving && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                 {coLabel(child)} đang trực thuộc <b>{coLabel(moving)}</b>. Lưu thay đổi này sẽ <b>chuyển</b> công ty sang tập đoàn mới — ghi vào audit log.
                </p>
              )}
            </div>
          )}

        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} disabled={!pick} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Lưu liên kết</button>
        </div>
      </div>
    </div>
  )
}

/* Unlink ONE parent→child edge. Named from both ends because "unlink this company"
   is ambiguous on a middle node — Đông Phong sits under Trường Sơn and above Kim
   Long, and cutting the edge above it is a different act from cutting the one below.

   The consequence that has to be on screen: descendants travel WITH the child. Cut
   Trường Sơn → Đông Phong and Kim Long does not become a root; it stays under Đông
   Phong, which becomes the root of a new group. */
function UnlinkAffiliateModal({ parent, child, onClose }: { parent: Company; child: Company; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const descendants = (() => {
    const out: Company[] = []
    const walk = (n: Company) => childrenOf(n).forEach((k) => { out.push(k); walk(k) })
    walk(child)
    return out
  })()
  const childKeepsGroup = descendants.length > 0
  const parentLeftAlone = childrenOf(parent).length === 1 && !parent.parent

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Gỡ quan hệ mẹ / con</p>
            <p className="text-[11px] text-muted">Chỉ gỡ liên kết. Không công ty nào bị xoá.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          <div className="rounded-lg border border-line bg-canvas/40 p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="font-medium text-ink">{coLabel(parent)}</span>
              <span className="rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>
              <span className="text-rose-500 line-through">›</span>
              <span className="font-medium text-ink">{coLabel(child)}</span>
              <Pill tone="neutral">Công ty con</Pill>
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">MST {parent.tax} · MST {child.tax} — hai pháp nhân riêng, không thay đổi.</p>
          </div>

          <div className="rounded-lg border border-line px-3 py-2.5">
            <p className="mb-1.5 text-[11.5px] font-semibold text-ink/70">Sau khi gỡ</p>
            <ul className="space-y-1 text-[11.5px] leading-relaxed text-muted">
              <li>· <b className="text-ink/80">{coLabel(child)}</b> {childKeepsGroup ? 'trở thành gốc của một tập đoàn mới' : 'trở thành công ty độc lập'}.</li>
              {childKeepsGroup && (
                <li>· <b className="text-ink/80">{descendants.length} công ty cấp dưới</b> ({descendants.map(coLabel).join(', ')}) đi theo {coLabel(child)} — không bị gỡ.</li>
              )}
              {parentLeftAlone && <li>· <b className="text-ink/80">{coLabel(parent)}</b> không còn công ty con nào.</li>}
              <li>· MST, hợp đồng, quota, báo giá và hoá đơn của cả hai <b className="text-ink/80">giữ nguyên</b> — quan hệ tập đoàn chưa bao giờ gộp doanh thu.</li>
            </ul>
          </div>

          <div>
            <FLabel req>Lý do gỡ</FLabel>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: gán nhầm tập đoàn · đã thoái vốn · tách pháp nhân"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Ghi vào audit log cùng người thực hiện — quan hệ tập đoàn đổi chủ sở hữu báo cáo, nên luôn phải truy được ai đổi và vì sao.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          <button
            onClick={onClose}
            disabled={!reason.trim()}
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gỡ quan hệ
          </button>
        </div>
      </div>
    </div>
  )
}

function AffiliatedCompanies({ c, onOpen }: { c: Company; onOpen?: (x: Company) => void }) {
  const ro = useReadOnly()
  const [chart, setChart] = useState(false)
  const [linking, setLinking] = useState(false)
  /** The relationship being removed: {parent, child} — always named from both ends,
      never "unlink this", so the confirm can say exactly which edge is cut. */
  const [unlinking, setUnlinking] = useState<{ parent: Company; child: Company } | null>(null)

  const chain = ancestorsOf(c)
  const kids = childrenOf(c)
  const root = groupRootOf(c)
  const go = (x: Company) => onOpen?.(x)

  return (
    <DetailCard
      title="Công ty liên kết — Affiliated companies"
      action={inGroup(c) ? <span className="text-[11px] text-faint">{groupOf(root).length} công ty trong tập đoàn</span> : undefined}
    >
      {/* Where this company sits in its group, root first. Rendered as a boxed path
          rather than a run of links: the tail is THIS company, and it has to read as
          a position rather than as one more thing to click. */}
      {chain.length > 0 && (
        <div className="mb-2.5 rounded-lg border border-line bg-canvas/50 px-2.5 py-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-faint">Vị trí trong tập đoàn</p>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[11.5px]">
            {chain.map((a, i) => (
              <span key={a.name} className="flex items-center gap-1">
                {i === 0 && <span className="text-[11px]"></span>}
                <button onClick={() => go(a)} className="font-medium text-brand hover:underline">{coLabel(a)}</button>
                <span className="text-faint">›</span>
              </span>
            ))}
            <span className="rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">{coLabel(c)}</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[10.5px] text-faint">cấp {chain.length + 1}</span>
              {!ro && (
                <button
                  onClick={() => setUnlinking({ parent: chain[chain.length - 1], child: c })}
                  title={`Gỡ khỏi ${coLabel(chain[chain.length - 1])}`}
                  className="rounded border border-line px-1.5 py-0.5 text-[10.5px] font-medium text-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                >
                  Gỡ
                </button>
              )}
            </span>
          </div>
        </div>
      )}

      {kids.length > 0 ? (
        <div className="space-y-1.5">
          {kids.map((k) => (
            <div key={k.name} className="flex w-full items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5 hover:border-brand/40">
              <button onClick={() => go(k)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-medium text-ink hover:text-brand hover:underline">{coLabel(k)}</p>
                <p className="truncate text-[10.5px] text-faint">MST {k.tax} · {k.owner}</p>
              </button>
              {/* One label. A "chi nhánh" vs "công ty con" split was derived from the
                  tax code and shown here, but it changed nothing a rep can act on —
                  both are separate customers with their own MST, quota and invoices. */}
              <span className="flex shrink-0 items-center gap-1.5">
                <Pill tone="neutral">Công ty con</Pill>
                {!ro && (
                  <button
                    onClick={() => setUnlinking({ parent: c, child: k })}
                    title={`Gỡ ${coLabel(k)} khỏi ${coLabel(c)}`}
                    className="rounded border border-line px-1.5 py-0.5 text-[10.5px] font-medium text-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                  >
                    Gỡ
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11.5px] text-muted">
          {chain.length
            ? 'Không có công ty con trực tiếp.'
            : 'Chưa thuộc tập đoàn nào và chưa có công ty con.'}
        </p>
      )}

      {/* One action only: LINK an existing record, either direction. A subsidiary
          that does not exist yet is created from the Companies list like any other
          company — a second create path here would be a second way to make a
          duplicate, and the group link is not a reason to bypass the MST check. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-2.5">
        {!ro && <button onClick={() => setLinking(true)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-ink/40">Gán quan hệ mẹ / con</button>}
        {inGroup(c) && <button onClick={() => setChart(true)} className="ml-auto text-[11px] font-medium text-brand hover:underline">Xem sơ đồ tập đoàn ↗</button>}
      </div>

      {chart && <GroupChart root={root} current={c} onClose={() => setChart(false)} onOpen={onOpen} />}
      {linking && <LinkAffiliateModal c={c} onClose={() => setLinking(false)} />}
      {unlinking && <UnlinkAffiliateModal {...unlinking} onClose={() => setUnlinking(null)} />}
    </DetailCard>
  )
}

/**
 * Company tags — a multi-select of editorial labels from Master data → Company tag.
 * Click to open the option list; tick any number (Korean company, Big company, …).
 * Options are read from MD_DOMAINS so this stays in sync with Master data.
 */
function CompanyTagPicker({ initial = [] }: { initial?: string[] }) {
  const ro = useReadOnly()
  const options = MD_DOMAINS.find((d) => d.key === 'company-tag')?.entries ?? ['Korean company', 'Big company']
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<string[]>(initial)
  const toggle = (t: string) => setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
  return (
    <div className="relative">
      <button
        onClick={() => { if (!ro) setOpen((o) => !o) }}
        disabled={ro}
        title={ro ? RO_HINT : undefined}
        className={cn('flex min-h-[38px] w-full flex-wrap items-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-left', ro ? 'cursor-not-allowed bg-canvas/50' : 'bg-surface')}
      >
        {sel.length === 0 && <span className="px-1 text-[12px] text-faint">Select tags…</span>}
        {sel.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">
            {t}
            <span role="button" onClick={(e) => { e.stopPropagation(); toggle(t) }} className="cursor-pointer text-brand/50 hover:text-brand">×</span>
          </span>
        ))}
        <span className="ml-auto pl-1 text-faint">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lg">
          {options.map((t) => {
            const on = sel.includes(t)
            return (
              <button key={t} onClick={() => toggle(t)} className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-canvas', on ? 'font-medium text-brand' : 'text-ink/80')}>
                <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px]', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on ? '✓' : ''}</span>
                {t}
              </button>
            )
          })}
          <p className="mt-1 border-t border-line-soft px-3 pt-1.5 text-[10.5px] leading-snug text-faint">Multi-select · manage options in System → Master data → Company tag</p>
        </div>
      )}
    </div>
  )
}

function OwnerHistory({ c }: { c: Company }) {
  const hist = companyOwnerHistory(c)
  /* The header counts HANDOVERS, not owners — a company always has exactly one
     owner, so "N owners" would read as if it could hold several at once. With a
     long chain the number is the thing a lead actually wants ("this account has
     moved five times"), which is why it is worth stating at all. */
  const moves = hist.filter((t) => !t.created).length
  return (
    <DetailCard
      title="Owner history"
      action={<span className="text-[11px] text-faint">{moves === 0 ? 'chưa chuyển giao lần nào' : `${moves} lần chuyển giao`}</span>}
    >
      <ol className="space-y-2.5">
        {hist.map((t, i) => (
          <li key={i} className="relative pl-4">
            <span className={cn('absolute left-0 top-[5px] h-2 w-2 rounded-full', i === 0 ? 'bg-brand' : 'bg-line')} />
            {i < hist.length - 1 && <span className="absolute bottom-[-10px] left-[3px] top-4 w-px bg-line-soft" />}
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[12.5px] font-medium text-ink">{t.owner}</span>
              {i === 0
                ? <Pill tone="active">Current</Pill>
                : <span className="shrink-0 text-[10.5px] tabular-nums text-faint">{t.from} – {t.to}</span>}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
              {i === 0 && <span className="tabular-nums text-muted">{t.from} – now · </span>}
              {t.created ? 'Created the lead' : <><span className="text-ink/70">↔ Reassigned by {t.by}</span></>}
              {' · '}{t.reason}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-2 border-t border-line-soft pt-2 text-[11px] leading-relaxed text-faint">
        Every reassignment is logged with <b className="text-ink/70">who moved it and why</b> — the record is append-only, never overwritten. Changing owner does not touch contacts, deals or the customer relationship.
      </p>
    </DetailCard>
  )
}

function CompanyDocs({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [docs, setDocs] = useState<CoDoc[]>(() => companyDocs(c))
  const add = () => setDocs((d) => [...d, { name: `tai-lieu-${d.length + 1}.pdf` }])
  return (
    <DetailCard
      title="Verification documents"
      action={<span className="text-[11px] text-faint">{docs.length} tệp</span>}
    >
      <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-4 text-center">
        <p className="text-[12px] font-medium text-ink">{ro ? 'Chỉ xem tài liệu' : <>Kéo thả hoặc <button onClick={add} className="text-brand hover:underline">chọn tệp</button></>}</p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint">Giấy phép kinh doanh · Giấy chứng nhận đăng ký thuế · Hợp đồng đã ký. PDF, JPG, PNG — tối đa 10MB mỗi tệp.</p>
      </div>
      {docs.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
              <span className="text-[13px]"></span>
              <div className="min-w-0 flex-1">
                <a href="#" onClick={(e) => e.preventDefault()} className="block truncate text-[11.5px] font-medium text-brand hover:underline">{d.name}</a>
                {d.note && <p className="truncate text-[10px] text-faint">{d.note}</p>}
              </div>
              {!ro && <button onClick={() => setDocs((p) => p.filter((_, j) => j !== i))} className="shrink-0 text-[11px] text-faint hover:text-ink">✕</button>}
            </div>
          ))}
        </div>
      )}
      {docs.length === 0
        ? <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">Chưa có tài liệu xác minh — vẫn bán được, nhưng sẽ bị chặn ở bước <b>xuất hoá đơn VAT</b>.</p>
        : <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">Chứng minh MST là của họ. Bản cũ vẫn giữ lại cho audit khi công ty đăng ký lại.</p>}
    </DetailCard>
  )
}

function PipelineStatusPicker({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [stage, setStage] = useState<CoStatus>(c.status)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [reason, setReason] = useState('')
  const terminal = stage === 'Invoice'

  const pick = (next: CoStatus) => {
    if (next === 'Lost') { setClosing(true); setOpen(false); return }
    setStage(next); setOpen(false)
  }

  return (
    <span className="relative inline-flex">
      {/* The chevron sits INSIDE the chip. A wrapper border plus a hover label was
          three signals doing one signal's job — the chevron alone already says
          "this opens", and keeping it inside means the control still reads as one
          badge among the others rather than as a box around one. */}
      <button
        onClick={() => { if (!ro && !terminal) setOpen((o) => !o) }}
        disabled={ro || terminal}
        title={ro ? RO_HINT : terminal ? 'Deal đã đóng thắng — không còn giai đoạn nào để chuyển.' : 'Đổi giai đoạn pipeline'}
        className={cn('inline-flex rounded-full', ro || terminal ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80')}
      >
        <Pill tone={CO_STATUS[stage].tone}>
          {CO_STATUS[stage].label}
          {!ro && !terminal && <span className={cn('text-[8px] leading-none transition-transform', open && 'rotate-180')}>▼</span>}
        </Pill>
      </button>

      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <span className="absolute left-0 top-full z-20 mt-1 block w-[290px] overflow-hidden rounded-lg border border-line bg-surface text-left shadow-lg">
            {SALES_STAGES.map((st) => (
              <button key={st} onClick={() => pick(st)} className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-canvas', st === stage && 'bg-brand-soft/50')}>
                <Pill tone={CO_STATUS[st].tone}>{CO_STATUS[st].label}</Pill>
                {st === stage && <span className="ml-auto text-[10px] font-medium text-brand">hiện tại</span>}
              </button>
            ))}
            <button onClick={() => pick('Lost')} className="flex w-full items-center gap-2 border-t border-line-soft px-2.5 py-1.5 text-left hover:bg-canvas">
              <Pill tone={CO_STATUS.Lost.tone}>{CO_STATUS.Lost.label}</Pill>
              <span className="text-[10.5px] text-muted">— đóng deal, cần lý do</span>
            </button>
          </span>
        </>
      )}

      {/* Lost is the only exit a human takes on purpose, so it is the only one that
          asks why — the reason is what makes the loss report worth reading. */}
      {closing && (
        <span className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={() => setClosing(false)}>
          <span className="my-4 block w-full max-w-[420px] rounded-2xl border border-line bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-bold text-ink">Đóng deal — Lost</p>
            <p className="mt-0.5 text-[11.5px] text-muted">Công ty vẫn giữ nguyên customer status và ở lại danh sách nurture. Một báo giá mới sẽ mở lại deal.</p>
            <p className="mb-1 mt-3 block text-[11.5px] font-medium text-ink/80">Lý do <span className="text-rose-500">*</span></p>
            <span className="flex flex-wrap gap-1.5">
              {['Giá cao', 'Chọn đối thủ', 'Cắt ngân sách', 'Không còn nhu cầu', 'Mất liên lạc'].map((r) => (
                <button key={r} onClick={() => setReason(r)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', reason === r ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{r}</button>
              ))}
            </span>
            <span className="mt-3 flex justify-end gap-2">
              <button onClick={() => setClosing(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Huỷ</button>
              <button
                disabled={!reason}
                onClick={() => { setStage('Lost'); setClosing(false) }}
                className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', reason ? 'bg-rose-600 hover:opacity-90' : 'cursor-not-allowed bg-line')}
              >
                Đóng deal
              </button>
            </span>
          </span>
        </span>
      )}
    </span>
  )
}

function CompanyDetail({ c, onBack, onOpen, viewer = ME }: { c: Company; onBack: () => void; onOpen?: (x: Company) => void; viewer?: string }) {
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
              {archived && <Pill tone="expired">Archived</Pill>}
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
          {/* HQ cleanup for duplicate / junk companies — soft & reversible. */}
          {archived
            ? <button onClick={() => setArchived(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Unarchive</button>
            : <button onClick={() => setArchiveOpen(true)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50">Archive company</button>}
        </div>
      </div>

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
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Reason <span className="text-rose-500">*</span></p>
                <textarea rows={2} placeholder="e.g. duplicate of Công ty TNHH Vạn Phát — users moved" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink" />
                <p className="mt-1 text-[10.5px] text-faint">Written to the audit log with your name and the time.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={() => setArchiveOpen(false)} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
              <button onClick={() => { setArchived(true); setArchiveOpen(false) }} className="rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Archive company</button>
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
        <MiniStat label="Job quota" value={c.jobPosting ? `${c.jobLeft}/${c.jobTotal}` : '—'} sub={c.jobPosting ? 'slots left' : 'n/a'} tone={c.jobPosting && c.jobLeft / c.jobTotal < 0.3 ? 'warn' : undefined} />
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
          <DetailCard title="PO history">
            {poHistory(c).length === 0 ? (
              <p className="text-[12px] text-muted">Chưa có PO nào. PO xuất hiện ở đây ngay khi Sales phát hành đơn hàng từ báo giá khách đã chốt.</p>
            ) : (
              <Table
                cols={[
                  { label: 'PO', w: '1.2fr' },
                  { label: 'Sản phẩm trong PO', w: '1.8fr' },
                  { label: 'Giá trị', w: '1fr', align: 'r' },
                  { label: 'Ngày xuất hoá đơn', w: '1.1fr', align: 'r' },
                ]}
                rows={poHistory(c).map((o) => [
                  <span className="truncate font-mono text-[11.5px] text-brand">{o.po}</span>,
                  <span className="truncate text-muted" title={o.products}>{o.products}</span>,
                  <span className="tabular-nums">{o.amount}</span>,
                  o.invoiced
                    ? <span className="tabular-nums text-muted">{o.invoiced}</span>
                    : <span className="text-[10.5px] text-amber-600">chưa xuất</span>,
                ])}
              />
            )}
            <p className="mt-2 text-[11px] text-faint">Every entitlement traces back to a paid PO — provisioned automatically when the VAT invoice is issued, never picked by hand.</p>
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
          {!c.jobPosting ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">
              This account has no Job Posting product — it can’t post jobs. Resume-Search-only customers are invisible to jobseekers.
            </p>
          ) : jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">No jobs posted yet.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11.5px] text-muted"><b className="text-ink">{activeJobs}</b> active · <b className="text-ink">{jobs.length}</b> total — using <b className="text-ink">{c.jobTotal - c.jobLeft}/{c.jobTotal}</b> posting slots</p>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by status</span>
              </div>
              <Table
                cols={[{ label: 'Job title', w: '2fr' }, { label: 'Status', w: '1.1fr' }, { label: 'Applicants', w: '0.9fr', align: 'r' }, { label: 'Deadline', w: '1fr', align: 'r' }, { label: 'Actions', w: '1fr', align: 'r' }]}
                rows={jobs.map((j) => [
                  <div className="min-w-0"><p className="truncate font-medium text-ink">{j.title}</p><p className="text-[11px] text-faint">Posted {j.posted}</p></div>,
                  <Pill tone={j.status}>{j.statusLabel}</Pill>,
                  <span className="tabular-nums">{j.applicants || '—'}</span>,
                  <span className="tabular-nums text-muted">{j.deadline}</span>,
                  <RowAction>View</RowAction>,
                ])}
              />
              <p className="mt-2 text-[11px] text-faint">Jobs this account posted (HQ oversight). Company posts go live directly — manage them from Recruitment → Jobs.</p>
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

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState('Recruiter')
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Invite user</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <LField label="Company (account)" value="Cty Vạn Phát" select />
          <LField label="Email" req value="new.hr@vanphat.vn" />
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Role <span className="text-rose-500">*</span></p>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
              {CO_ROLE_DEFS.map((r) => <option key={r.name} value={r.name}>{r.name}{r.admin ? ' (account owner)' : ''}</option>)}
            </select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">Pick one of the account’s roles. Roles are built on the <b className="text-ink/70">Roles</b> screen; “Admin” grants account administration and every account keeps at least one.</p>
            <CoRolePermsView role={role} />
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span></span><span>We email an invite link. The person <b>sets their own password</b> — no one types it for them.</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Send invite</button>
        </div>
      </div>
    </div>
  )
}

function ChangeRoleModal({ user, users, onConfirm, onClose }: { user: CUser; users: CUser[]; onConfirm: (role: CoUserRole) => void; onClose: () => void }) {
  const [target, setTarget] = useState<CoUserRole>(user.role)
  const admins = users.filter((u) => u.company === user.company && u.role === 'Admin' && u.status !== 'Disabled')
  const lastAdmin = user.role === 'Admin' && admins.length <= 1
  const blocked = lastAdmin && target !== 'Admin'
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Change role — {user.name}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-[12px] text-muted">Pick the role for this user. <b className="text-ink/80">No email/login changes</b> — only their access changes.</p>
          <div className="space-y-1.5">
            {CO_ROLE_DEFS.map((r) => (
              <button key={r.name} onClick={() => setTarget(r.name as CoUserRole)} className={cn('flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left', target === r.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
                <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', target === r.name ? 'border-brand' : 'border-line')}>{target === r.name && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                <span className="min-w-0"><span className="block truncate text-[12.5px] font-medium text-ink">{r.name}{r.admin ? ' · account owner' : ''}</span><span className="block truncate text-[10.5px] text-faint">{r.admin ? 'everything + manage users & roles' : r.perms.length + ' permissions'}</span></span>
              </button>
            ))}
          </div>
          {blocked && <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span></span><span>This is the account’s <b>last Admin</b>. Assign Admin to another user before downgrading this one.</span></p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => !blocked && onConfirm(target)} disabled={blocked} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Save role</button>
        </div>
      </div>
    </div>
  )
}

/* HQ-only: move a user from one company to another. One email = one employer login
   = one company at a time, so a move is detach-then-attach (login never changes).
   Blocked if the user is the sole Admin of their current company. */
function MoveUserModal({ user, users, onConfirm, onClose }: { user: CUser; users: CUser[]; onConfirm: (toCompany: string, role: CoUserRole) => void; onClose: () => void }) {
  const admins = users.filter((u) => u.company === user.company && u.role === 'Admin' && u.status !== 'Disabled')
  const soleAdmin = user.role === 'Admin' && admins.length <= 1
  const targets = Array.from(new Set(COMPANIES.map((c) => (c.shortName?.trim() || c.name)))).filter((n) => n !== user.company)
  const [toCompany, setToCompany] = useState(targets[0] ?? '')
  const [role, setRole] = useState<CoUserRole>('Recruiter')
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Move user — {user.name}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          {soleAdmin ? (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span>⚠️</span><span>{user.name} is the <b>sole Admin</b> of {user.company}. Assign another Admin there first — a company can’t be left without one.</span></p>
          ) : (
            <>
              <p className="text-[12px] text-muted">Move this login into another company. <b className="text-ink/80">The email &amp; password never change</b> — only which company they’re in and their role there.</p>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">From</p>
                <div className="rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[12.5px] text-ink">{user.company}</div>
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">To company <span className="text-rose-500">*</span></p>
                <select value={toCompany} onChange={(e) => setToCompany(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {targets.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">Role in that company <span className="text-rose-500">*</span></p>
                <select value={role} onChange={(e) => setRole(e.target.value as CoUserRole)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {CO_ROLE_DEFS.map((r) => <option key={r.name} value={r.name}>{r.name}{r.admin ? ' (account owner)' : ''}</option>)}
                </select>
              </div>
              <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>📝</span><span>This is an HQ action and is written to the audit log (who moved whom, from → to, role).</span></p>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => !soleAdmin && toCompany && onConfirm(toCompany, role)} disabled={soleAdmin || !toCompany} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Move user</button>
        </div>
      </div>
    </div>
  )
}

function AdminCompanyUsers() {
  const [inviting, setInviting] = useState(false)
  const [users, setUsers] = useState<CUser[]>(CUSERS)
  const [changing, setChanging] = useState<CUser | null>(null)
  const [moving, setMoving] = useState<CUser | null>(null)
  const applyRole = (role: CoUserRole) => {
    if (!changing) return
    setUsers((prev) => prev.map((u) => (u.email === changing.email ? { ...u, role } : u)))
    setChanging(null)
  }
  const applyMove = (toCompany: string, role: CoUserRole) => {
    if (!moving) return
    setUsers((prev) => prev.map((u) => (u.email === moving.email ? { ...u, company: toCompany, role } : u)))
    setMoving(null)
  }
  return (
    <div>
      <ListPage
        action={<button onClick={() => setInviting(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ Invite user</button>}
        tabs={[{ label: 'All users', count: 1140, active: true }, { label: 'Active', count: 1020 }, { label: 'Invited', count: 96 }, { label: 'Disabled', count: 24 }]}
        cols={[
          { label: 'User', w: '1.5fr' }, { label: 'Company (account)', w: '1.2fr' }, { label: 'Role', w: '1.1fr' },
          { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.5fr', align: 'r' },
        ]}
        rows={users.map((u) => [
          <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p><p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p></div>,
          <span className="truncate">{u.company}</span>,
          <Pill tone={u.role === 'Admin' ? 'neutral' : 'draft'}>{u.role}</Pill>,
          <Pill tone={u.status === 'Active' ? 'active' : u.status === 'Invited' ? 'pending' : 'expired'}>{u.status}</Pill>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Invited'
              ? <><RowAction tone="brand">Resend</RowAction><RowAction tone="rose">Cancel</RowAction></>
              : u.status === 'Disabled'
                ? <RowAction tone="brand">Re-enable</RowAction>
                : <><button onClick={() => setChanging(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Change role</button><button onClick={() => setMoving(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Move</button>{u.role !== 'Admin' && <RowAction tone="rose">Disable</RowAction>}</>}
          </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">Each user is assigned a role built on the Roles screen. Every account keeps at least one <b>Admin</b> — the last Admin can’t be downgraded or disabled. <b>Move</b> (HQ only) sends a login to another company with a chosen role; the sole Admin of a company can’t be moved out until another Admin is assigned.</p>
      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {changing && <ChangeRoleModal user={changing} users={users} onConfirm={applyRole} onClose={() => setChanging(null)} />}
      {moving && <MoveUserModal user={moving} users={users} onConfirm={applyMove} onClose={() => setMoving(null)} />}
    </div>
  )
}

/** Sign-up channel as a compact chip — email vs one of the 4 social providers. */
function SignupChip({ via }: { via: JSSignup }) {
  const dot: Record<JSSignup, string> = { Email: 'bg-slate-400', Google: 'bg-rose-500', Facebook: 'bg-blue-600', LinkedIn: 'bg-sky-600', GitHub: 'bg-slate-800' }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink/75">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot[via])} />
      {via}
    </span>
  )
}

/** Profile-completeness bar — the number My page shows the seeker. */
function Meter({ pct }: { pct: number }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {/* fixed width, not w-full — the cell is shrink-to-fit, so a percentage width collapses */}
      <span className="h-1.5 w-[58px] shrink-0 overflow-hidden rounded-full bg-line">
        <span className={cn('block h-full rounded-full', pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-400')} style={{ width: `${pct}%` }} />
      </span>
      <span className="shrink-0 text-[11px] tabular-nums text-muted">{pct}%</span>
    </span>
  )
}

function AdminJobseekers() {
  const [users, setUsers] = useState<JSUser[]>(JS_USERS)
  const [detail, setDetail] = useState<JSUser | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const setStatus = (id: number, status: JSStatus) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  const create = (name: string, email: string) => {
    setUsers((prev) => [
      { id: Math.max(0, ...prev.map((u) => u.id)) + 1, name, email, phone: '—', location: '—', headline: '—', signup: 'Email', status: 'Unverified', complete: 10, resumes: 0, applications: 0, joined: '28/07/2026', last: '—' },
      ...prev,
    ])
    setCreating(false)
    setToast(`Set-password link sent to ${email} — the account stays Unverified until they open it.`)
  }

  if (detail) {
    const live = users.find((u) => u.id === detail.id) ?? detail
    return <JobseekerDetail u={live} onBack={() => setDetail(null)} onStatus={(s) => setStatus(live.id, s)} />
  }

  const n = (s: JSStatus) => users.filter((u) => u.status === s).length
  return (
    <div>
      {toast && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Accounts" value="128,412" sub="all time" />
        <MiniStat label="Active" value="121,006" sub="verified + usable" />
        <MiniStat label="Unverified" value="4,318" sub="email not confirmed" tone="warn" />
        <MiniStat label="Deactivated" value="1,942" sub="blocked by HQ" />
        <MiniStat label="Withdrawn" value="1,146" sub="seeker-initiated" />
        <MiniStat label="New this month" value="3,204" sub="▲ 12% vs Jun" />
      </div>

      <ListPage
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New user</button>}
        tabs={[
          { label: 'All', count: users.length, active: true },
          { label: 'Active', count: n('Active') },
          { label: 'Unverified', count: n('Unverified') },
          { label: 'Deactivated', count: n('Deactivated') },
          { label: 'Withdrawn', count: n('Withdrawn') },
        ]}
        minW={1120}
        cols={[
          { label: 'Jobseeker', w: '1.6fr' },
          { label: 'Signed up via', w: '0.9fr' },
          { label: 'Profile', w: '0.9fr' },
          { label: 'CVs', w: '0.5fr', align: 'r' },
          { label: 'Applied', w: '0.6fr', align: 'r' },
          { label: 'Status', w: '0.9fr' },
          { label: 'Joined', w: '0.8fr', align: 'r' },
          { label: 'Last login', w: '0.9fr', align: 'r' },
          { label: 'Actions', w: '1.7fr', align: 'r' },
        ]}
        rows={users.map((u) => [
          <button onClick={() => setDetail(u)} className="min-w-0 text-left">
            <p className="truncate text-[12.5px] font-medium text-brand hover:underline">{u.name}</p>
            <p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p>
          </button>,
          <SignupChip via={u.signup} />,
          <Meter pct={u.complete} />,
          <span className="tabular-nums">{u.resumes || '—'}</span>,
          <span className="tabular-nums font-medium text-brand">{u.applications || '—'}</span>,
          <Pill tone={JS_STATUS[u.status]}>{u.status}</Pill>,
          <span className="tabular-nums text-muted">{u.joined}</span>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Unverified' ? (
              <>
                <button onClick={() => setToast(`Verification email re-sent to ${u.email}.`)} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Resend</button>
                <button onClick={() => setStatus(u.id, 'Active')} title="Demo: simulate the seeker clicking their verification link" className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Simulate verify</button>
              </>
            ) : u.status === 'Deactivated' ? (
              <button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Reactivate</button>
            ) : u.status === 'Withdrawn' ? (
              <span className="text-[10.5px] text-faint">seeker-initiated · restore on request</span>
            ) : (
              <>
                <button onClick={() => setDetail(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">View</button>
                <button onClick={() => setStatus(u.id, 'Deactivated')} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Deactivate</button>
              </>
            )}
          </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Interactive prototype — <b>Simulate verify</b> flips an Unverified row to Active; <b>Deactivate</b> / <b>Reactivate</b> toggle a row. <b>Deactivated</b> is an HQ block (login refused, resumes hidden from Resume Search); <b>Withdrawn</b> is the seeker deactivating their own account from My page. Opening an account or its CV is PII access — always written to the audit log.
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
        Open questions for the client: retention for withdrawn accounts (grace period before hard delete) · whether HQ may create seeker accounts at all · merge policy when the same email arrives by email sign-up and by social login.
      </p>

      {creating && <NewJobseekerModal onCreate={create} onClose={() => setCreating(false)} />}
    </div>
  )
}

function NewJobseekerModal({ onCreate, onClose }: { onCreate: (name: string, email: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const valid = name.trim() && /.+@.+\..+/.test(email)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">New jobseeker user</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
            <span></span><span>The normal path is self sign-up on the Store site. Use this only for support cases (e.g. a seeker who can't complete sign-up) — it does not replace registration.</span>
          </p>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Full name <span className="text-rose-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nguyễn Thị Hà" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Email <span className="text-rose-500">*</span></label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <LField label="Phone" value="optional — seeker completes it on My page" />
          <LField label="Location" value="Hồ Chí Minh" select hint="From Master data → Locations. Everything else (headline, CV, job preferences) is filled in by the seeker." />
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand">
            <span></span><span>We email a set-password link. The seeker <b>sets their own password</b> — no one types it for them. The account stays <b>Unverified</b> until they open the link, then flips to <b>Active</b>.</span>
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => valid && onCreate(name.trim(), email.trim())} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Create &amp; send link</button>
        </div>
      </div>
    </div>
  )
}

/** One seeker account — what My page holds, plus their CVs and applications. */
function JobseekerDetail({ u, onBack, onStatus }: { u: JSUser; onBack: () => void; onStatus: (s: JSStatus) => void }) {
  useDetailCrumb(u.name, onBack)
  const CVS: [string, 'public' | 'private', string, number][] = [
    ['CV_NguyenVanAn_Frontend_EN.pdf', 'public', 'Updated 2 days ago', 6],
    ['CV tiếng Việt — Frontend', 'private', 'Updated 3 weeks ago', 0],
  ]
  const APPS: [string, string, StatusTone, string, string][] = [
    ['Senior Frontend Engineer (ReactJS)', 'FPT Software', 'pending', 'Interview', '2h ago'],
    ['Product Manager', 'MoMo', 'neutral', 'Screening', '5d ago'],
    ['Backend Engineer (Go)', 'Shopee', 'rejected', 'Rejected', '2 months ago'],
  ]
  return (
    <div className="max-w-[960px]">

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">{u.name} <Pill tone={JS_STATUS[u.status]}>{u.status}</Pill></h2>
          <p className="text-[11.5px] text-muted">{u.headline} · {u.location} · <span className="font-mono">{u.email}</span></p>
        </div>
        <div className="flex shrink-0 gap-2">
          {u.status === 'Unverified' && <button className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Resend verification</button>}
          {u.status === 'Deactivated' || u.status === 'Withdrawn'
            ? <button onClick={() => onStatus('Active')} className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Reactivate</button>
            : <button onClick={() => onStatus('Deactivated')} className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12.5px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Deactivate</button>}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Profile" value={`${u.complete}%`} sub="completeness" tone={u.complete < 50 ? 'warn' : undefined} />
        <MiniStat label="CVs" value={u.resumes || '—'} sub={`${CVS.filter((c) => c[1] === 'public').length} public`} />
        <MiniStat label="Applications" value={u.applications || '—'} sub="all time" />
        <MiniStat label="CV unlocks" value="6" sub="by employers" />
        <MiniStat label="Joined" value={u.joined} sub={`via ${u.signup}`} />
        <MiniStat label="Last login" value={u.last} sub="web · Chrome" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Account">
          <KV label="Full name" value={u.name} />
          <KV label="Email (login)" value={u.email} />
          <KV label="Email verified" value={u.status === 'Unverified' ? 'No — verification pending' : 'Yes'} />
          <KV label="Sign-up method" value={u.signup === 'Email' ? 'Email + password' : `${u.signup} (social login)`} />
          <KV label="Phone" value={u.phone} />
          <KV label="Location" value={u.location} />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            HQ never sees or sets a password. Password reset is a self-service email link; social-login accounts have no password at all.
          </p>
        </DetailCard>

        <DetailCard title="My page — profile & job preferences">
          <div className="mb-2"><Meter pct={u.complete} /></div>
          <KV label="Headline" value={u.headline} />
          <KV label="Desired role" value="Software Developer · IT" />
          <KV label="Work type" value="In office" />
            <KV label="Contract type" value="Fulltime" />
          <KV label="Expected salary" value="35 – 45 tr VND / month" />
          <KV label="Preferred locations" value="Hồ Chí Minh · Remote" />
          <KV label="Open to offers" value="Yes — visible in Resume Search" />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            Read-only for HQ. The seeker edits these on My page; the vocabularies come from Master data.
          </p>
        </DetailCard>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[12.5px] font-bold">CVs / resumes</p>
        <Table
          minW={640}
          cols={[{ label: 'CV', w: '2fr' }, { label: 'Visibility', w: '0.9fr' }, { label: 'Updated', w: '1fr' }, { label: 'Unlocked by', w: '0.9fr', align: 'r' }, { label: '', w: '0.7fr', align: 'r' }]}
          rows={CVS.map((c) => [
            <span className="truncate text-[12.5px] text-ink/85">{c[0]}</span>,
            <Pill tone={c[1] === 'public' ? 'active' : 'draft'}>{c[1] === 'public' ? 'Public' : 'Private'}</Pill>,
            <span className="text-[11.5px] text-muted">{c[2]}</span>,
            <span className="tabular-nums">{c[3] ? `${c[3]} employers` : '—'}</span>,
            <RowAction>Open CV</RowAction>,
          ])}
        />
        <p className="mt-2 text-[11px] text-faint">Opening a CV is a PII view — logged with the operator, the record and the timestamp. Private CVs never appear in Resume Search.</p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[12.5px] font-bold">Applications</p>
        <Table
          minW={640}
          cols={[{ label: 'Job', w: '1.9fr' }, { label: 'Company', w: '1fr' }, { label: 'Stage', w: '0.9fr' }, { label: 'Applied', w: '0.8fr', align: 'r' }]}
          rows={APPS.map((a) => [
            <span className="truncate text-[12.5px] text-ink/85">{a[0]}</span>,
            <span className="truncate">{a[1]}</span>,
            <Pill tone={a[2]}>{a[3]}</Pill>,
            <span className="text-[11.5px] text-muted">{a[4]}</span>,
          ])}
        />
        <p className="mt-2 text-[11px] text-faint">Read-only mirror of what the seeker sees under “Applied jobs” — HQ never moves a candidate's stage; that is the employer's call.</p>
      </div>
    </div>
  )
}

/** A used/total cell. Empty means "did not buy this", which is not the same as
    "bought and used none" — so it renders as — rather than 0/0 with a full bar. */
function UsageCell({ p }: { p: UsagePair }) {
  if (p.total === 0) return <span className="text-faint">—</span>
  const pct = (p.used / p.total) * 100
  const low = p.total - p.used === 0
  return (
    <span className="flex items-center gap-2">
      <span className={cn('shrink-0 tabular-nums', low ? 'font-semibold text-rose-600' : 'text-ink')}>{p.used}/{p.total}</span>
      <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-line">
        <span className={cn('block h-full rounded-full', low ? 'bg-rose-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
      </span>
    </span>
  )
}

function AdminAccountUsage() {
  const [fState, setFState] = useState('')
  const [sort, setSort] = useState('')

  const base = COMPANIES.filter((c) => isCustomer(c) || c.account === 'Churn')
    .map((c) => ({ c, u: usageOf(c) }))
    .filter((r) => r.u.job.total + r.u.cv.total + r.u.plc.total + r.u.svc.total > 0)

  const owed = (u: ReturnType<typeof usageOf>) =>
    (u.job.total - u.job.used) + (u.cv.total - u.cv.used) + (u.plc.total - u.plc.used) + (u.svc.total - u.svc.used)
  const spentPct = (u: ReturnType<typeof usageOf>) => {
    const t = u.job.total + u.cv.total + u.plc.total + u.svc.total
    const d = u.job.used + u.cv.used + u.plc.used + u.svc.used
    return t === 0 ? 0 : (d / t) * 100
  }

  const rows = base
    .filter((r) => !fState || (fState === 'Còn nhiều chưa dùng' ? spentPct(r.u) < 50 : spentPct(r.u) >= 90))
    .slice()
    .sort((a, b) => {
      if (sort === 'unused') return owed(b.u) - owed(a.u)
      if (sort === 'spent') return spentPct(b.u) - spentPct(a.u)
      return coLabel(a.c).localeCompare(coLabel(b.c), 'vi')
    })

  return (
    <div>
      <ListPage
        cols={[
          { label: 'Khách hàng', w: '1.6fr' },
          { label: 'Job slots', w: '1.1fr' },
          { label: 'CV unlocks', w: '1.1fr' },
          { label: 'Placements', w: '1.1fr' },
          { label: 'Manual services', w: '1.1fr' },
          { label: 'Chưa dùng', w: '0.8fr', align: 'r' },
          { label: 'Hạn dùng', w: '1fr', align: 'r' },
        ]}
        rows={rows.map(({ c, u }) => [
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{coLabel(c)}</span>
            <span className="block text-[10.5px] text-faint">👤 {c.owner}</span>
          </span>,
          <UsageCell p={u.job} />,
          <UsageCell p={u.cv} />,
          <UsageCell p={u.plc} />,
          <UsageCell p={u.svc} />,
          <span className={cn('font-semibold tabular-nums', owed(u) === 0 ? 'text-faint' : 'text-ink')}>{owed(u)}</span>,
          <span className={cn('tabular-nums', c.renewal === 'Lapsed' ? 'text-rose-600' : 'text-muted')}>{c.renewal}</span>,
        ])}
        filters={
          <>
            <FilterSelect label="Mức dùng" value={fState} onChange={setFState} options={['Còn nhiều chưa dùng', 'Sắp hết']} />
            <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', sort ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
              <span className={sort ? 'text-brand/70' : 'text-faint'}>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={cn('cursor-pointer bg-transparent text-[11.5px] outline-none', sort ? 'font-medium text-brand' : 'text-ink')}>
                <option value="">Tên A → Z</option>
                <option value="unused">Chưa dùng nhiều nhất</option>
                <option value="spent">Đã dùng nhiều nhất</option>
              </select>
            </label>
          </>
        }
        total={base.length}
        searchHint="Search khách hàng, sales owner…"
        minW={1240}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Màn hình sales mở trước khi gọi gia hạn. <b className="text-ink/70">Chưa dùng nhiều</b> = khách chưa nhận đủ
        giá trị đã trả → rủi ro không tái ký; <b className="text-ink/70">sắp hết</b> = cơ hội bán thêm ·
        ô <b className="text-ink/70">—</b> nghĩa là chưa mua loại đó, khác với mua rồi chưa dùng
      </p>
    </div>
  )
}

function AdminUnresolvedTerms() {
  const [tab, setTab] = useState<'terms' | 'supply'>('supply')
  const [fStatus, setFStatus] = useState('')

  const rows = UNRESOLVED_TERMS
    .filter((r) => !fStatus || r.status === fStatus)
    .slice()
    .sort((a, b) => (a.status === 'Mới' ? -1 : 1) - (b.status === 'Mới' ? -1 : 1) || b.n - a.n)

  const fresh = UNRESOLVED_TERMS.filter((r) => r.status === 'Mới').length

  return (
    <div className="space-y-4">
      <StatCards
        cards={[
          { label: 'Chờ xử lý', value: String(fresh) },
          { label: 'Có ở NTD tìm kiếm', value: String(UNRESOLVED_TERMS.filter((r) => r.from.includes('search')).length) },
          { label: 'Có ở CV ứng viên', value: String(UNRESOLVED_TERMS.filter((r) => r.from.includes('cv')).length) },
          { label: 'Thiếu nguồn ứng viên', value: `${SUPPLY_GAPS.length} truy vấn` },
        ]}
      />

      {tab === 'terms' ? (
        <ListPage
          minW={1340}
          searchHint="Tìm từ khoá…"
          total={UNRESOLVED_TERMS.length}
          leading={<TabSwitch tab={tab} setTab={setTab} />}
          filters={<FilterSelect label="Trạng thái" value={fStatus} onChange={setFStatus} options={['Mới', 'Đã xử lý', 'Bỏ qua']} />}
          cols={[
            { label: 'Từ khoá', w: '1.6fr' },
            { label: 'Phát hiện từ', w: '1.5fr' },
            { label: 'Số lần', w: '0.6fr', align: 'r' },
            { label: 'Lần đầu', w: '0.7fr' },
            { label: 'Gần nhất', w: '0.9fr' },
            { label: 'Đề xuất', w: '2fr' },
            { label: 'Trạng thái', w: '0.9fr' },
            { label: '', w: '1.5fr', align: 'r' },
          ]}
          rows={rows.map((r) => [
            <span className="min-w-0 max-w-full truncate font-medium text-ink">{r.term}</span>,
            <span className="flex flex-wrap items-center gap-1">
              {r.from.map((f) => <Pill key={f} tone={f === 'cv' ? 'neutral' : 'draft'}>{SOURCE_LABEL[f]}</Pill>)}
            </span>,
            <span className="tabular-nums">{r.n}</span>,
            <span className="tabular-nums text-muted">{r.first}</span>,
            <span className="tabular-nums text-muted">{r.last}</span>,
            <span className="truncate text-muted">{r.suggest}</span>,
            <Pill tone={TERM_TONE[r.status]}>{r.status}</Pill>,
            <span className="flex items-center justify-end gap-1.5">
              <button className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand">Gộp vào kỹ năng</button>
              <button className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-ink/40">Tạo mới</button>
              <button className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-ink/40">Bỏ qua</button>
            </span>,
          ])}
        />
      ) : (
        <ListPage
          minW={1100}
          searchHint="Tìm truy vấn…"
          total={SUPPLY_GAPS.length}
          leading={<TabSwitch tab={tab} setTab={setTab} />}
          cols={[
            { label: 'Truy vấn', w: '2fr' },
            { label: 'Số lần tìm', w: '0.8fr', align: 'r' },
            { label: 'Ứng viên trong kho', w: '1fr', align: 'r' },
            { label: 'Ghi chú', w: '2fr' },
          ]}
          rows={SUPPLY_GAPS.map((g) => [
            <span className="min-w-0 max-w-full truncate font-medium text-ink">{g.query}</span>,
            <span className="tabular-nums">{g.n}</span>,
            <span className={cn('font-semibold tabular-nums', g.pool === 0 ? 'text-rose-600' : 'text-ink')}>{g.pool}</span>,
            <span className="truncate text-muted">{g.note}</span>,
          ])}
        />
      )}

      <div className="rounded-xl border border-line bg-canvas/40 p-4 text-[11.5px] leading-relaxed text-muted">
        <p className="mb-1"><b className="text-ink">Mọi lượt tìm ra 0 kết quả đều rơi vào đúng MỘT trong hai nhóm.</b> Hệ thống tự phân loại ngay tại thời điểm chạy truy vấn, không đoán lại về sau.</p>
        <p className="mb-1"><b className="text-ink">1 · Thiếu ứng viên</b> — logic chạy đúng: hiểu từ khoá, áp đúng bộ lọc, nhưng trong kho thật sự không có ai. Đây <b>không phải lỗi</b>. Việc của Sales / tuyển nguồn.</p>
        <p><b className="text-ink">2 · Logic chưa đúng</b> — hệ thống lẽ ra phải trả về kết quả nhưng đã không trả. Đây <b>là lỗi của mình</b>: không hiểu từ khoá, bộ lọc loại nhầm ứng viên, ứng viên chưa được đánh chỉ mục, hoặc truy vấn lỗi. Việc của dev + người quản lý danh mục kỹ năng. <b className="text-ink">Chỉ số cần theo dõi là nhóm 2 phải giảm dần về 0.</b></p>
      </div>
    </div>
  )
}

function TabSwitch({ tab, setTab }: { tab: 'terms' | 'supply'; setTab: (t: 'terms' | 'supply') => void }) {
  return (
    <span className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
      {([['supply', '1 · Thiếu ứng viên'], ['terms', '2 · Logic chưa đúng']] as const).map(([k, label]) => (
        <button key={k} onClick={() => setTab(k)} className={cn('rounded-md px-3 py-1 transition-colors', tab === k ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>{label}</button>
      ))}
    </span>
  )
}

function AdminCvSearchUsage() {
  const [scope, setScope] = useState('Tất cả')

  const stateOf = (r: typeof CV_SEARCH_PACKAGES[number]) =>
    r.searches === 0 ? 'Chưa dùng' : r.used >= r.total ? 'Đã dùng hết' : 'Còn lượt'

  const rows = CV_SEARCH_PACKAGES
    .filter((r) => (scope === 'Chưa dùng' ? r.searches < 10 : scope === 'Dùng nhiều' ? r.searches >= 60 : true))
    .slice()
    .sort((a, b) => b.searches - a.searches)

  const sum = (f: (r: typeof CV_SEARCH_PACKAGES[number]) => number) => CV_SEARCH_PACKAGES.reduce((n, r) => n + f(r), 0)
  const idle = CV_SEARCH_PACKAGES.filter((r) => r.searches < 10).length

  return (
    <div className="space-y-4">
      <StatCards
        cards={[
          { label: 'Lượt tìm · 30 ngày', value: String(sum((r) => r.searches)) },
          { label: 'Lượt mở CV đã dùng', value: `${sum((r) => r.used)} / ${sum((r) => r.total)}` },
          { label: 'Lượt mở CV còn lại', value: String(sum((r) => r.total - r.used)) },
          { label: 'Mua nhưng chưa dùng', value: `${idle} gói` },
        ]}
      />

      <ListPage
        minW={2200}
        searchHint="Tìm gói, khách hàng, mã công ty…"
        searchExtra={CV_SEARCH_PACKAGES.map((r) => `${r.coId} ${r.owner}`)}
        total={CV_SEARCH_PACKAGES.length}
        leading={
          <span className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
            {['Tất cả', 'Dùng nhiều', 'Chưa dùng'].map((o) => (
              <button key={o} onClick={() => setScope(o)} className={cn('rounded-md px-3 py-1 transition-colors', scope === o ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>{o}</button>
            ))}
          </span>
        }
        cols={[
          { label: 'Gói tìm kiếm CV', w: '1.8fr' },
          { label: 'Khách hàng', w: '1.4fr' },
          { label: 'Mã công ty', w: '0.8fr' },
          { label: 'Hạn mức', w: '1.2fr' },
          { label: 'Còn lại', w: '0.7fr', align: 'r' },
          { label: 'Sales phụ trách', w: '1fr' },
          { label: 'Hạn dùng', w: '0.9fr' },
          { label: 'Trạng thái', w: '1fr' },
          { label: 'Lần tìm cuối', w: '1fr', align: 'r' },
        ]}
        rows={rows.map((r) => {
          const state = stateOf(r)
          const left = r.total - r.used
          return [
            <span className="min-w-0 max-w-full truncate font-medium text-brand">{r.pkg}</span>,
            <span className="truncate text-ink/85">{r.co}</span>,
            <span className="tabular-nums text-muted">{r.coId}</span>,
            <span className="flex items-center gap-2">
              <span className="shrink-0 tabular-nums">{r.used}/{r.total}</span>
              <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-line">
                <span className={cn('block h-full rounded-full', state === 'Chưa dùng' ? 'bg-line' : 'bg-brand')} style={{ width: `${(r.used / r.total) * 100}%` }} />
              </span>
            </span>,
            <span className={cn('font-semibold tabular-nums', left === 0 ? 'text-faint' : 'text-ink')}>{left}</span>,
            <span className="truncate text-muted">👤 {r.owner}</span>,
            <span className="tabular-nums text-muted">{r.until}</span>,
            <Pill tone={state === 'Chưa dùng' ? 'pending' : state === 'Đã dùng hết' ? 'draft' : 'active'}>{state}</Pill>,
            <span className={cn(r.searches === 0 ? 'text-faint' : 'text-muted')}>{r.last}</span>,
          ]
        })}
      />

      {/* The queue moved to System → Từ khoá chưa khớp: it needs a status, an owner
          and a decision per row, none of which fit in a panel. What stays here is the
          number, because a spike in it is a symptom of THIS product underperforming. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-ink">Tìm kiếm không ra kết quả · {ZERO_RESULT_TERMS.reduce((n, z) => n + z.n, 0)} lượt / 30 ngày</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {ZERO_RESULT_TERMS.filter((z) => z.why === 'Không hiểu từ khoá').length} từ khoá hệ thống không hiểu (sửa được bằng dữ liệu) ·{' '}
            {ZERO_RESULT_TERMS.filter((z) => z.why === 'Không có ứng viên').length} truy vấn thiếu nguồn ứng viên (việc của Sales)
          </p>
        </div>
        {/* A real link, not a dead button — the queue is a page in System, and a
            button that goes nowhere is the fastest way to make a wireframe unreadable. */}
        <a
          href="/wireframe/admin?screen=admin-unresolved-terms"
          className="shrink-0 rounded-md border border-brand/30 bg-brand-soft px-3 py-1.5 text-[11.5px] font-medium text-brand hover:bg-brand hover:text-white"
        >Mở danh sách xử lý →</a>
      </div>
    </div>
  )
}

function AdminManualServices() {
  const [fState, setFState] = useState('')
  const [fSku, setFSku] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [logging, setLogging] = useState<{ e: ServiceEntitlement; company: string } | null>(null)

  const all = Object.entries(SERVICE_USAGE)
    .flatMap(([company, list]) => list.map((e) => ({ company, e, state: svcState(e), left: e.total - e.entries.length })))
  const rows = all
    .filter((r) => (!fState || r.state === fState) && (!fSku || r.e.sku === fSku))
    // Rows that need action first, then rows that lost value, then the settled ones.
    .sort((a, b) => {
      const rank = (x: SvcState) => (x === 'Còn lượt' ? 0 : x === 'Hết hạn' ? 1 : x === 'Đã dùng hết' ? 2 : 3)
      return rank(a.state) - rank(b.state) || b.left - a.left
    })

  const services = [...new Set(all.map((r) => r.e.sku))]

  return (
    <div>
      <ListPage
        cols={[
          { label: 'Dịch vụ', w: '1.9fr' },
          { label: 'Khách hàng', w: '1.4fr' },
          { label: 'Quota', w: '1.2fr' },
          { label: 'Còn lại', w: '0.7fr', align: 'r' },
          { label: 'Hạn dùng', w: '0.9fr' },
          { label: 'Trạng thái', w: '1fr' },
          { label: '', w: '1.1fr', align: 'r' },
        ]}
        rows={rows.map(({ company, e, state, left }) => {
          const key = `${company}|${e.sku}`
          return [
            <button onClick={() => setOpen(open === key ? null : key)} className="min-w-0 max-w-full truncate text-left font-medium text-brand hover:underline">
              {e.name}
            </button>,
            <span className="truncate text-ink/85">{company}</span>,
            <span className="flex items-center gap-2">
              <span className="shrink-0 tabular-nums">{e.entries.length}/{e.total}</span>
              <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-line">
                <span className={cn('block h-full rounded-full', state === 'Hết hạn' ? 'bg-rose-500' : 'bg-brand')} style={{ width: `${(e.entries.length / e.total) * 100}%` }} />
              </span>
            </span>,
            <span className={cn('font-semibold tabular-nums', state === 'Hết hạn' ? 'text-rose-600' : left === 0 ? 'text-faint' : 'text-ink')}>{left}</span>,
            <span className={cn('tabular-nums', state === 'Hết hạn' || state === 'Đã kết thúc' ? 'text-faint' : 'text-muted')}>{e.validUntil}</span>,
            <Pill tone={SVC_TONE[state]}>{state}</Pill>,
            <span className="flex items-center justify-end gap-1.5">
              <button onClick={() => setOpen(open === key ? null : key)} className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-ink/40">
                Lịch sử {e.entries.length > 0 && `(${e.entries.length})`}
              </button>
              {state === 'Còn lượt'
                ? <button onClick={() => setLogging({ e, company })} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Ghi nhận</button>
                : <span className="w-[64px] text-center text-[11px] text-faint">—</span>}
            </span>,
          ]
        })}
        filters={
          <>
            <FilterSelect label="Trạng thái" value={fState} onChange={setFState} options={['Còn lượt', 'Đã dùng hết', 'Hết hạn', 'Đã kết thúc']} />
            <FilterSelect label="Dịch vụ" value={fSku} onChange={setFSku} options={services} />
          </>
        }
        total={all.length}
        searchHint="Search dịch vụ, khách hàng…"
        minW={1280}
      />

      {/* A drawer, not a panel under the table. The list is 21 rows and will be
          hundreds: a panel below it opens nowhere near the row that was clicked, so
          the reader loses their place. A drawer holds still, leaves the table where
          it was, and has room for the proof at a size worth looking at. */}
      {open && (() => {
        const r = all.find((x) => `${x.company}|${x.e.sku}` === open)
        if (!r) return null
        const pct = (r.e.entries.length / r.e.total) * 100
        return (
          <>
            <div onClick={() => setOpen(null)} className="fixed inset-0 z-40 bg-black/25" />
            <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col border-l border-line bg-surface shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold">{r.e.name}</p>
                  <p className="truncate text-[11.5px] text-muted">{r.company}</p>
                </div>
                <button onClick={() => setOpen(null)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
              </div>

              {/* Quota and validity travel with the history: "show me the posts" and
                  "how many are left" are one question, asked in one breath. */}
              <div className="border-b border-line-soft px-4 py-3">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <Pill tone={SVC_TONE[r.state]}>{r.state}</Pill>
                  <span className="text-[12px] tabular-nums">
                    <b>{r.e.entries.length}</b><span className="text-faint">/{r.e.total} {r.e.unit}</span>
                    <span className="ml-2 text-faint">·</span>
                    <span className={cn('ml-2 font-semibold', r.state === 'Hết hạn' ? 'text-rose-600' : r.left === 0 ? 'text-faint' : 'text-ink')}>
                      còn {r.left}
                    </span>
                  </span>
                </div>
                <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <span className={cn('block h-full rounded-full', r.state === 'Hết hạn' ? 'bg-rose-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
                </span>
                <p className="mt-1.5 text-[10.5px] text-faint">Hạn dùng {r.e.validUntil}</p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-4 py-3.5">
                {r.e.entries.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-[11.5px] text-faint">
                    Chưa ghi nhận lượt nào.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {r.e.entries.map((d, n) => (
                      <li key={d.id} className="rounded-lg border border-line">
                        <div className="flex items-center justify-between gap-2 border-b border-line-soft bg-canvas/50 px-2.5 py-1.5">
                          <span className="flex items-center gap-2 text-[11.5px]">
                            <span className="grid h-4 w-4 place-items-center rounded-full bg-surface text-[9px] font-semibold text-muted">{n + 1}</span>
                            <b className="tabular-nums text-ink">{d.date}</b>
                          </span>
                          <span className="truncate text-[10.5px] text-faint">{d.by}</span>
                        </div>
                        <div className="p-2.5">
                          {/* The screenshot at a size someone can actually judge —
                              a filename in a footnote is not proof of anything. */}
                          <div className={cn('mb-2 grid h-28 place-items-center rounded-md border text-[11px]', d.image ? 'border-line bg-canvas' : 'border-dashed border-amber-200 bg-amber-50 text-amber-700')}>
                            {d.image
                              ? <span className="text-center text-faint"><span className="block text-[20px]">🖼</span><span className="font-mono">{d.image}</span></span>
                              : <span>⚠️ chưa đính ảnh</span>}
                          </div>
                          <p className="text-[11.5px] leading-relaxed text-ink/85">{d.content}</p>
                          <a href={d.link} onClick={(ev) => ev.preventDefault()} className="mt-1.5 block truncate text-[11px] text-brand hover:underline">{d.link}</a>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {r.state === 'Hết hạn' && (
                  <p className="mt-3 flex gap-2 rounded-md bg-rose-50 px-3 py-2 text-[11.5px] leading-relaxed text-rose-700">
                    <span>⚠️</span>
                    <span>Hết hạn <b>{r.e.validUntil}</b> khi còn <b>{r.left} {r.e.unit}</b> chưa giao. Không thể ghi nhận thêm — muốn bù cho khách thì bán/tặng một entitlement mới, đừng sửa hạn của cái cũ.</span>
                  </p>
                )}
              </div>

              {/* The action sits with the history, so logging a delivery happens where
                  the reader just checked what was already delivered. */}
              <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
                <span className="text-[10.5px] leading-relaxed text-faint">1 ghi nhận = 1 {r.e.unit}</span>
                {r.state === 'Còn lượt' ? (
                  <button onClick={() => setLogging({ e: r.e, company: r.company })} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">
                    + Ghi nhận đã đăng
                  </button>
                ) : (
                  <span className="rounded-lg border border-line bg-canvas px-3.5 py-2 text-[12.5px] font-medium text-faint">Không thể ghi nhận</span>
                )}
              </div>
            </aside>
          </>
        )
      })()}

      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Một dòng = một <b className="text-ink/70">entitlement</b> (công ty × dịch vụ). Trạng thái suy ra từ số còn lại
        và hạn dùng, không nhập tay · chỉ <b className="text-ink/70">Còn lượt</b> mới ghi nhận được
      </p>
      {logging && <LogServiceDeliveryModal e={logging.e} company={logging.company} onClose={() => setLogging(null)} />}
    </div>
  )
}

/** Same flat no-contact thresholds as the Companies list — see idleOf above. */
function IdlePill({ days }: { days: number }) {
  const rot = idleOf(days)
  // On a card there is no column header to carry the meaning, so the pill says it.
  return <Pill tone={rot === 'red' ? 'rejected' : rot === 'amber' ? 'pending' : 'draft'}>Liên hệ {dateBefore(days)}</Pill>
}

function PipelineTable({ onConvert, onOpen }: { onConvert: (d: Deal) => void; onOpen: (d: Deal) => void }) {
  // priority sort: open deals by most-idle-first (rotting), Won/Lost sink to bottom
  const sorted = [...DEALS].sort((a, b) => (isOpen(b.stage) ? b.idle : -1) - (isOpen(a.stage) ? a.idle : -1))
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-muted">Sort: <b className="font-medium text-ink">Priority — most idle first</b> ▾</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-muted">▽ Bộ lọc</span>
        <span className="text-faint">by owner · stage · industry · last contact</span>
      </div>
      <Table
        cols={[
          { label: 'Company', w: '2fr' }, { label: 'Stage', w: '1.1fr' }, { label: 'Value', w: '0.9fr', align: 'r' },
          { label: 'Owner', w: '1.2fr' }, { label: 'Last contact', w: '1fr' }, { label: 'Next step', w: '1.6fr' },
        ]}
        rows={sorted.map((d) => [
          <div className="min-w-0">
            <button onClick={() => onOpen(d)} className="block max-w-full truncate text-left font-medium text-brand hover:underline">{d.company}</button>
            {d.stage === 'Won' && (
              <button onClick={() => onConvert(d)} className="mt-1 inline-flex rounded-md bg-emerald-600 px-2 py-0.5 text-[10.5px] font-semibold text-white hover:opacity-90">Convert →</button>
            )}
          </div>,
          <Pill tone={d.tone}>{d.stage}</Pill>,
          <span className="tabular-nums">{money(d.value)}</span>,
          <span className="truncate">{d.owner}</span>,
          <IdlePill days={d.idle} />,
          <span className="truncate text-muted">{d.next}</span>,
        ])}
      />
      <p className="mt-2 text-[11px] text-faint">Default view for long pipelines. Top row = most neglected open deal — work down the list. Idle thresholds are per stage (Negotiation tolerates 21d/45d, Qualified only 7d/14d); closed deals show &quot;—&quot;. Click a company to open the lead.</p>
    </div>
  )
}

function PipelineBoard({ onConvert, onOpen }: { onConvert: (d: Deal) => void; onOpen: (d: Deal) => void }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, minmax(120px,1fr))' }}>
      {STAGES.map((st) => {
        const cards = DEALS.filter((d) => d.stage === st.key)
        const total = cards.reduce((s, d) => s + d.value, 0)
        return (
          <div key={st.key} className="rounded-lg border border-line bg-canvas/40 p-2">
            <div className="mb-1 flex items-center justify-between"><Pill tone={st.tone}>{st.key}</Pill><span className="text-[11px] font-bold text-faint">{cards.length}</span></div>
            <p className="mb-2 text-[10.5px] text-faint tabular-nums">{money(total)}</p>
            {cards.map((d) => (
              <div key={d.company} onClick={() => onOpen(d)} className={cn('mb-1.5 cursor-pointer rounded-md border bg-surface p-2 hover:border-brand', st.key === 'Won' && 'border-emerald-300 ring-1 ring-emerald-200')}>
                <p className="truncate text-[11.5px] font-semibold text-ink">{d.company}</p>
                <p className="text-[10.5px] text-muted tabular-nums">{money(d.value)}</p>
                {st.key === 'Won' && (
                  <button onClick={(e) => { e.stopPropagation(); onConvert(d) }} className="mt-1.5 w-full rounded-md bg-emerald-600 px-2 py-1 text-[10.5px] font-semibold text-white hover:opacity-90">Convert →</button>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function TL({ icon, title, time, sub, tone }: { icon: string; title: string; time: string; sub: string; tone: string }) {
  return (
    <div className="flex gap-2.5">
      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px]', tone)}>{icon}</span>
      <div className="min-w-0 flex-1 border-b border-line-soft pb-3">
        <div className="flex items-center justify-between gap-2"><p className="truncate text-[12.5px] font-medium text-brand">{title}</p><span className="shrink-0 text-[11px] text-faint">{time}</span></div>
        <p className="text-[11.5px] text-muted">{sub}</p>
      </div>
    </div>
  )
}

function LeadDetail({ deal, onBack }: { deal: Deal; onBack: () => void }) {
  useDetailCrumb(deal.company, onBack)
  const ci = PATH.indexOf(deal.stage)
  const [converting, setConverting] = useState(false)
  return (
    <div>

      {/* header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-[16px]"></span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Lead · Company</p>
            <h3 className="text-[19px] font-bold tracking-tight">{deal.company}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Change owner</button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Edit</button>
          <button onClick={() => setConverting(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Convert</button>
        </div>
      </div>

      {/* status path */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto rounded-xl border border-line bg-surface p-1.5">
        <div className="flex flex-1 items-stretch gap-1">
          {PATH.map((s, i) => (
            <div key={s} className={cn('flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-[12px] font-semibold', i < ci ? 'bg-brand-soft text-brand' : i === ci ? 'bg-brand text-white' : 'bg-canvas text-muted')}>
              {i < ci ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>
        {deal.stage === 'Lost'
          ? <Pill tone="rejected">Lost</Pill>
          : deal.stage === 'Won'
            ? <button onClick={() => setConverting(true)} className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90">Convert →</button>
            : <button className="shrink-0 rounded-lg bg-brand px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90">✓ Mark stage complete</button>}
      </div>

      {/* 3 columns */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.95fr)]">
        {/* col 1 — details */}
        <div className="space-y-3">
          <DetailCard title="About (company)">
            <KV label="Legal name" value={deal.company} />
            <KV label="Mã số thuế (MST)" value="0312xxxxxx" />
            <KV label="Industry · Size" value="Logistics · 200–500 staff" />
            <KV label="Website" value="viettien.vn" link />
            <KV label="Notes" value="Multi-branch logistics firm, hiring drivers & ops across 3 cities." />
          </DetailCard>
          <DetailCard title="Sales">
            <KV label="Owner" value={deal.owner} link />
            <KV label="Lead source" value="Referral" />
            <KV label="Estimated value" value={money(deal.value)} />
            <KV label="Stage" value={deal.stage} />
          </DetailCard>
        </div>

        {/* col 2 — activity */}
        <DetailCard
          title="Activity"
          action={<span className="flex gap-1">{['', '', '', ''].map((i) => <span key={i} className="grid h-6 w-6 place-items-center rounded-md border border-line text-[11px] text-muted">{i}</span>)}</span>}
        >
          <p className="mb-3 text-[11px] text-faint">Filters: Within 2 months · All activities · All types</p>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Upcoming &amp; overdue</p>
          <div className="space-y-3">
            <TL icon="" title="Introductory call" time="Feb 16" sub="Upcoming event · 1:30 PM" tone="bg-violet-100 text-violet-700" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">February 2026</p>
            <TL icon="" title="Discovery call" time="Today" sub="You logged a call — 18 min" tone="bg-sky-100 text-sky-700" />
            <TL icon="" title="Send pricing options" time="Today" sub="Task completed" tone="bg-emerald-100 text-emerald-700" />
            <TL icon="" title="Intro & product overview" time="Today" sub="Email sent to Ms. Linh · Opened" tone="bg-amber-100 text-amber-700" />
          </div>
        </DetailCard>

        {/* col 3 — related & next step (recommended) */}
        <div className="space-y-3">
          <div className="rounded-xl border border-brand/30 bg-brand-soft p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand">▶ Next best action</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/85">{NEXT_BY_STAGE[deal.stage]}</p>
          </div>
          <DetailCard title="Contacts" action={<span className="text-[11px] text-brand">+ Add</span>}>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-[12px]"></span>
                <div className="min-w-0"><p className="truncate text-[12.5px] font-semibold">Ms. Vũ Thanh Linh</p><p className="text-[11px] text-muted">HR Manager · decision-maker</p></div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-[12px]"></span>
                <div className="min-w-0"><p className="truncate text-[12.5px] font-semibold">Mr. Lê Quốc Bảo</p><p className="text-[11px] text-muted">Finance · handles PO / invoice</p></div>
              </div>
            </div>
          </DetailCard>
          <DetailCard title="Deal &amp; products">
            <KV label="Estimated value" value={money(deal.value)} />
            <div className="border-b border-line-soft py-2">
              <p className="text-[10.5px] uppercase tracking-wide text-faint">Products interested</p>
              <div className="mt-1 flex flex-wrap gap-1.5"><Pill tone="neutral">Job Posting</Pill><Pill tone="neutral">Resume Search</Pill></div>
            </div>
            <KV label="Latest quote" value="Q-2042 · Sent · 28.5M ₫" link />
          </DetailCard>
          <DetailCard title="On our platform">
            <p className="text-[12px] text-muted">Not yet an account · <b className="text-ink">0</b> jobs posted. Becomes a company account when you <b className="text-ink">Convert</b> it.</p>
          </DetailCard>
        </div>
      </div>

      {converting && <ConvertLeadModal companyName={deal.company} value={deal.value} owner={deal.owner} onClose={() => setConverting(false)} />}
    </div>
  )
}

/* ── Tạo PO / Create sales order ───────────────────────────────────────────────
   Raised from ONE accepted quotation option. Nothing is retyped: lines, totals,
   VAT and the VAT-billing block are copied from the quotation, because those are
   what the e-invoice must eventually match. Confirming is the "won" moment for the
   pipeline — but it provisions nothing; only the invoice does (T&C clause 3). */
function CreatePOModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const { quote } = poGate(c)
  const [terms, setTerms] = useState('100% in advance')
  const [poNo, setPoNo] = useState('')
  /* Lines drive the total, never the reverse — quantity × the real catalog price.
     Back-solving a unit price from the deal value produces prices like 5,979,938,
     which is not a figure any catalog would ever quote. */
  const pack = QUOTE_CATALOG[1]
  const unit = pack.price
  const qty = Math.max(1, Math.round(coValue(c) / (1 + VAT_RATE / 100) / unit))
  const sub = qty * unit
  const vat = Math.round(sub * VAT_RATE / 100)
  const total = sub + vat

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[780px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Tạo PO / Create sales order — {coLabel(c)}</p>
            <p className="text-[11px] text-muted">From the accepted quotation option. Lines and billing details are copied, not retyped.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[72vh] space-y-3.5 overflow-y-auto p-5">
          <Section title="Source — the accepted option" className="mt-0" />
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft/40 px-3 py-2 text-[12px]">
            <span className="font-mono font-medium text-brand">{quote}</span>
            <Pill tone="active">Option 2 · accepted</Pill>
            <span className="text-muted">The alternatives the customer did not choose never become orders.</span>
          </div>

          <Section title="Order lines — copied from the option" />
          <div className="overflow-x-auto rounded-lg border border-line">
            <div className="grid min-w-[560px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span>#</span><span>Dịch vụ / Service</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Tổng giá</span>
            </div>
            <div className="grid min-w-[560px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span className="text-faint">1</span><span className="truncate">{pack.vi}</span><span className="text-[11px] text-muted">{pack.unitVi} / {pack.unitEn}</span>
              <span className="tabular-nums">{qty}</span><span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span><span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
            </div>
            <div className="grid min-w-[560px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span className="text-faint">2</span>
              <span className="flex min-w-0 items-center gap-1.5"><span className="truncate">{pack.vi}</span><Pill tone="active">Tặng</Pill></span>
              <span className="text-[11px] text-muted">{pack.unitVi} / {pack.unitEn}</span><span className="tabular-nums">1</span><span className="text-right tabular-nums">0</span><span className="text-right tabular-nums">0</span>
            </div>
          </div>
          <p className="text-[10.5px] text-faint">The gift line carries into the order at 0 ₫ — no revenue, but it is provisioned as real quota once the invoice is issued.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <Section title="VAT billing — snapshot from the quotation" className="mt-0" />
              <LField label="Tên công ty / Legal name" req value={c.legalName} />
              <LField label="Địa chỉ KKD / Billing address" req value={c.address} />
              <LField label="Mã số thuế / Tax code" req value={c.tax} hint="Must match the e-invoice exactly — a mismatch later needs a cancel + re-issue." />
            </div>
            <div className="space-y-3">
              <Section title="Order terms" className="mt-0" />
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Điều khoản thanh toán / Payment terms</label>
                <select value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
                  <option>100% in advance</option><option>50 / 50</option><option>Net 30 after invoice</option>
                </select>
                <p className="mt-1 text-[10.5px] text-faint">Advance is the default — clause 3 activates the service only after payment.</p>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Customer PO number <span className="font-normal text-faint">(optional)</span></label>
                <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="e.g. PO-VP/2026/044" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]" />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">If their procurement issues its own PO, record the number and attach the file. Customers without a procurement process simply confirm the order we send.</p>
              </div>
              <button className="w-full rounded-md border border-dashed border-line py-2 text-[11.5px] text-muted hover:border-ink/40">+ Attach their signed PO / confirmation</button>
            </div>
          </div>

          <div className="ml-auto w-full max-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
            <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
            <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{total.toLocaleString('en-US')} ₫</span></div>
            <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(total)}.</p>
          </div>

          {/* Two consequences, both immediate on issue, and neither of them is
              provisioning — that is the invoice's job. Stated here because this is
              the last screen before the PO exists. */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            <b>Issuing this PO is the “won” moment</b> — the deal moves to the PO stage, and the PO is <b>Active</b> until <b>{endOfMonth('01/07/2026')}</b> (end of the month, same rule as the quotation). It provisions <b>nothing</b>: no account, no quota, no company page. That happens the moment <b>Kế toán</b> issues the VAT e-invoice on it. Customer status stays <b>{c.account ? AC_STATUS[c.account].label : 'Prospect'}</b> until then.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
          {/* No "Save draft": a PO has no draft state — it is Active from the moment
              it is issued, so the only outcomes here are issue it or don't. */}
          <button className="rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">Issue PO →</button>
        </div>
      </div>
    </div>
  )
}

/* Confirmation card — mirrors CompanyInfoCard on Create job. Its job is to let the
   rep verify they picked the right company, and it doubles as the VAT-billing
   read-out: legal name, MST and registered address all print on the invoice, and
   they live on the company record rather than being re-entered per quotation. */
function QuoteCompanyCard({ c }: { c: Company }) {
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()
  return (
    <div className="rounded-lg border border-line bg-canvas/40 p-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-surface text-[12px] font-bold text-brand">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">{coLabel(c)} <span className="text-[11px] font-normal text-muted">· ID {coId(c)}</span></p>
          <p className="truncate text-[11px] text-muted">{c.industry} · {c.size} staff · {c.address}</p>
        </div>
        {/* Customer status only. The pipeline STAGE is a property of the deal, and
            on a quotation the deal's stage is already implied by the quotation's own
            status — two stage-ish badges on one card is one too many. */}
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {c.account && <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-2.5 sm:grid-cols-4">
        <InfoBit label="Tên pháp lý / Legal name" value={c.legalName} hint="prints on the invoice" />
        <InfoBit label="Mã số thuế / Tax code" value={c.tax} mono hint="prints on the invoice" />
        <InfoBit label="Người liên hệ / Contact" value={c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]} hint={c.contact.split(' · ')[1] ?? ''} />
        <InfoBit label="Email" value={`contact@${c.domain}`} hint="send-to address" />
      </div>
    </div>
  )
}

/** `company` pre-selects the record — set when opened from a company detail page,
    left empty when opened from the Quotations list. */
export function NewQuotationModal({ onClose, company: initialCompany = '' }: { onClose: () => void; company?: string }) {
  const today = '29/07/2026'
  const [company, setCompany] = useState(initialCompany)
  const [seq, setSeq] = useState(0)
  const [options, setOptions] = useState<QOption[]>([
    { id: 1, lines: [{ cat: 1, qty: 1, price: QUOTE_CATALOG[1].price, disc: 0, gift: false }, { cat: 1, qty: 1, price: 0, disc: 0, gift: true }], recommended: true, optDisc: 0, fixed: 0 },
    { id: 2, lines: [{ cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }, { cat: 0, qty: 1, price: 0, disc: 0, gift: true }], recommended: false, optDisc: 0, fixed: 0 },
  ])

  const co = COMPANIES.find((c) => c.name === company)

  /* ── One discount MODE per quotation ────────────────────────────────────────
     Four modes, and the customer's status decides which are on offer. They are
     exclusive: two programmes layered on one quotation produce a total nobody
     planned and an approver signing off on half of it.

     What each mode does to the three inputs is declared in DISCOUNT_MODES, not
     re-derived here — twelve rules spread through a form is how they drift. */
  /* WHO is writing this quotation. In the product this is simply the signed-in
     user; here it is a picker so the self-approval rules can be seen working —
     the same personas the Companies and Quotations lists use. */
  const [creator, setCreator] = useState<SalesPersona>(SALES_PERSONAS[0])
  const [mode, setMode] = useState<DiscountMode>('newchurn')
  const allowed = modesFor(co?.account)
  /* Picking a company resets the mode to that status's default, and re-picking a
     mode wipes every figure the previous one left behind. Carrying 50% over into
     a Special offer would mean the rep approves a number they never typed. */
  useEffect(() => {
    if (co) setMode(defaultMode(co.account))
  }, [co?.name, co?.account])
  /* Products reset when trial is involved: a trial quotation cannot hold a
     full-price SKU and a normal one cannot hold a trial SKU, so leaving the
     previous selection would produce a line the mode does not permit. Clearing the
     DISCOUNTS is not done here — see the effect below, which has to catch the
     automatic mode change on picking a company as well as this manual one. */
  const pickMode = (m: DiscountMode) => {
    setMode(m)
    if ((m === 'trial') === (mode === 'trial')) return
    const firstOf = catForMode(m)[0].i
    setOptions((os) => os.map((o) => ({
      ...o,
      lines: o.lines.map((l) => ({ ...l, cat: firstOf, price: l.gift ? 0 : QUOTE_CATALOG[firstOf].price })),
    })))
  }
  const rule = DISCOUNT_MODES[mode]
  const promo = programmeFor(co?.account)

  /* Rule-driven fields are recomputed whenever the company, the mode or any
     quantity moves — those are the only inputs the rules read. Keyed on a
     signature so writing the result back cannot re-trigger the effect. */
  const qtySig = options.map((o) => o.lines.map((l) => `${l.gift ? 'g' : 'p'}${l.qty}`).join(',')).join('|')
  /* A mode change WIPES every discount figure before the new rules run. This has to
     live here rather than in the click handler, because the mode also changes on
     its own the moment a company is picked — and without the wipe a New & Churn
     50% survived into an Existing quotation on any option the rep did not retype.
     A rate the rep never chose, sitting under an approval band, is exactly the bug
     the mode switch exists to prevent. */
  const prevMode = useRef(mode)
  useEffect(() => {
    const switched = prevMode.current !== mode
    prevMode.current = mode
    setOptions((os) => {
      let changed = false
      const next = os.map((o0) => {
        const o = switched ? { ...o0, optDisc: 0, fixed: 0, lines: o0.lines.map((l) => ({ ...l, disc: 0 })) } : o0
        if (switched) changed = true
        // Line %: the volume tiers under Existing, otherwise locked at 0.
        const totals = qtyByProduct(o.lines)
        const lines = o.lines.map((l) => {
          const d = rule.line === 'auto' && !l.gift && promo?.tiers ? tierPct(promo, totals.get(l.cat) ?? 0) : 0
          if (rule.line === 'free' || d === l.disc) return l
          changed = true
          return { ...l, disc: d }
        })
        // Order %: the 50%-with-a-cap rule under New & Churn, otherwise untouched
        // when free, otherwise 0.
        let od = o.optDisc
        if (rule.order === 'auto') {
          const withinCap = o.lines.every((l) => l.gift || l.qty <= NEWCHURN_MAX_QTY)
          od = withinCap ? NEWCHURN_PCT : 0
        } else if (rule.order === 'off') od = 0
        if (od !== o.optDisc) changed = true
        const fx = rule.fixed === 'off' ? 0 : o.fixed
        if (fx !== o.fixed) changed = true
        return changed ? { ...o, lines, optDisc: od, fixed: fx } : o0
      })
      return changed ? next : os
    })
  }, [mode, promo, qtySig])

  /** The line that costs the customer the 50%, when there is one. */
  const capBreaches = rule.order === 'auto'
    ? options.flatMap((o, oi) => o.lines.map((l, li) => ({ oi, li, l })).filter((x) => !x.l.gift && x.l.qty > NEWCHURN_MAX_QTY))
    : []

  /* ── Approval ───────────────────────────────────────────────────────────────
     ONLY the order-level % under the Existing programme routes for approval, and
     it routes on the highest rate in the document. A Special offer does not: the
     rep is trusted to set it and owns it, which is the difference between the two
     modes. A fixed amount never routes either — it is a voucher, agreed
     elsewhere, not a rate the rep invented. */
  /* Routed on the HIGHEST band across the options, not per option: the customer
     picks one and the approver has to be able to sign off on the worst case. So a
     document with one option at 8% and another at 18% goes to the manager, and the
     lead never sees it — two approvals on one document that offers a choice would
     mean approving a price the customer may never take. */
  const perOption = rule.approves ? options.map((o) => (o.optDisc > 0 ? apprRole(o.optDisc) : null)) : []
  const orderPct = rule.approves ? Math.max(0, ...options.map((o) => o.optDisc)) : 0
  const required = orderPct === 0 ? null : apprRole(orderPct)
  /* The creator's own seniority can waive it entirely — see selfApproves. */
  const waived = !!required && selfApproves(creator.role, required)
  const approver = waived ? null : required
  /** True when the options disagree and the document escalated because of it. */
  const escalated = required === 'manager' && perOption.some((r) => r === 'lead')

  const everyOptionPaid = options.every((o) => o.lines.some((l) => !l.gift && lineTotal(l) > 0))
  const valid = !!co && everyOptionPaid

  const patch = (oid: number, li: number, d: Partial<QLine>) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: o.lines.map((l, i) => (i === li ? { ...l, ...d } : l)) } : o)))
  const addLine = (oid: number) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: [...o.lines, { cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }] } : o)))
  const delLine = (oid: number, li: number) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: o.lines.filter((_, i) => i !== li) } : o)))
  const addOption = () =>
    setOptions((os) => (os.length >= 3 ? os : [...os, { id: Math.max(...os.map((o) => o.id)) + 1, lines: [{ cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }], recommended: false, optDisc: 0, fixed: 0 }]))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[1000px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">New quotation · Báo giá</p>
            <p className="text-[11px] text-muted">Bilingual VN/EN proposal. 1–3 priced options in one document — the customer picks one.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[74vh] space-y-3.5 overflow-y-auto p-5">
          {/* 1 · header — every value is derived, so it reads as INFORMATION rather
              than as fields the rep might think they should fill in. */}
          <Section title="1 · Document header — auto" className="mt-0" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-4">
            <InfoBit label="Số báo giá / Quotation no." value={`QUO-00991${seq}-07-2026`} mono hint="Gapless sequence" />
            <InfoBit label="Ngày báo giá / Proposal date" value={today} />
            <InfoBit label="Ngày hết hạn / Expiry date" value={endOfMonth(today)} hint={`cuối tháng · còn ${daysLeft(today, today)} ngày`} />
            {/* A field only in the mock: in the product this is the signed-in user
                and is not choosable. It is here because the creator's role decides
                whether the discount needs approving at all. */}
            <label className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-faint">Báo giá bởi / Proposed by</span>
              <select
                value={creator.name}
                onChange={(e) => setCreator(SALES_PERSONAS.find((x) => x.name === e.target.value)!)}
                className="w-full cursor-pointer truncate bg-transparent text-[12.5px] font-medium text-ink outline-none"
              >
                {SALES_PERSONAS.map((x) => <option key={x.name} value={x.name}>{x.name} — {SALES_ROLE_LABEL[x.role]}</option>)}
              </select>
              <span className="block text-[10px] text-faint">quyết định có cần duyệt hay không</span>
            </label>
          </div>

          {/* 2 · client — pick the company, then confirm it from its own record.
              Billing data (legal name, MST, address) is READ from that record, so
              there is no separate VAT-billing form to keep in sync. */}
          <Section title="2 · Khách hàng / Client" />
          {/* Opened from a company record, the company is already decided — showing a
              picker there invites changing it, which is exactly what must not happen.
              The confirmation card below carries the details either way. */}
          {!initialCompany && (
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">
              Company<span className="text-rose-500"> *</span>
              <span className="ml-2 text-[10.5px] font-normal text-faint">— searchable by name or ID</span>
            </label>
            <select value={company} onChange={(e) => { setCompany(e.target.value); setSeq((s) => (s + 1) % 10) }} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
              <option value="">— Pick a company from the CRM —</option>
              {COMPANIES.map((c) => <option key={c.name} value={c.name}>{coLabel(c)} · {coId(c)}</option>)}
            </select>
          </div>
          )}
          {co
            ? <QuoteCompanyCard c={co} />
            : <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-[11.5px] text-faint">Pick a company to confirm its details, contact and billing data.</p>}

          {/* The one discount decision on this screen, taken BEFORE the lines,
              because it decides which of the three discount cells the rep may even
              touch. Only the modes this customer's status qualifies for are shown —
              a New-customer offer greyed out on an Existing quotation would invite
              the question of how to unlock it. */}
          {co && (
            <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
              <p className="mb-2 text-[11.5px] font-semibold text-ink">
                Chương trình chiết khấu
                <span className="ml-1.5 font-normal text-muted">— chọn một, áp dụng cho cả báo giá · khách hàng <b className="text-ink/75">{co.account}</b></span>
              </p>
              {/* Compact radio pills. The long explanation of each mode used to sit
                  here and in the rule strip below it — but the mode is chosen once,
                  and the three discount cells already show what they do by being
                  editable, rule-coloured or locked. The rules live in the
                  requirement; the form does not need to teach them every time. */}
              <div className="flex flex-wrap gap-1.5">
                {allowed.map((m) => {
                  const d = DISCOUNT_MODES[m]
                  const on = mode === m
                  return (
                    <button
                      key={m}
                      onClick={() => pickMode(m)}
                      title={d.hint}
                      className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors',
                        on ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line bg-surface text-muted hover:border-ink/30')}
                    >
                      <span className={cn('grid h-3 w-3 shrink-0 place-items-center rounded-full border', on ? 'border-brand' : 'border-line')}>
                        {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                      </span>
                      {d.vi}
                    </button>
                  )
                })}
              </div>

              {/* The cliff, named. "One line over and the whole 50% is gone" is the
                  rule reps get wrong, so it points at the exact line. */}
              {capBreaches.length > 0 && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] leading-relaxed text-rose-900">
                  <b>Mất toàn bộ {NEWCHURN_PCT}%.</b>{' '}
                  {capBreaches.map((x) => `Option ${x.oi + 1} · dòng ${x.li + 1} (${QUOTE_CATALOG[x.l.cat].vi}) có số lượng ${x.l.qty}`).join(' · ')} — vượt giới hạn {NEWCHURN_MAX_QTY}.
                  Chỉ cần một dòng vượt là cả đơn mất chiết khấu, không phải riêng dòng đó.
                  <br />
                  <span className="text-rose-800">Hai cách xử lý: giảm số lượng về {NEWCHURN_MAX_QTY}, hoặc chuyển sang <b>Chiết khấu theo số lượng</b> — chương trình dành cho đơn lớn.</span>
                </div>
              )}
              {mode === 'trial' && (
                <p className="mt-2 rounded-lg border border-brand/30 bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">
                  Báo giá dùng thử chỉ chọn được <b>sản phẩm dùng thử</b> — đây là các SKU có giá riêng, không phải chiết khấu, nên hóa đơn ghi đúng thứ đã bán với đúng giá đã bán. Mọi ô chiết khấu khoá ở 0.
                </p>
              )}
            </div>
          )}

          {/* 3 · options — the heart of it */}
          <Section title="3 · Options — alternatives, not add-ons" />
          {options.map((o, oi) => {
            /* Three discount levels — see optionTotals for the order they stack in.
               Which of them the rep may touch is decided by the MODE, not here. */
            const { sub, pctCut, fixedCut, net, vat } = optionTotals(o)
            return (
              <div key={o.id} className={cn('rounded-xl border p-3', o.recommended ? 'border-brand/40 bg-brand-soft/30' : 'border-line')}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold">
                    Option {oi + 1}
                    <span className="ml-1.5 font-normal text-muted">{o.lines.map((l) => QUOTE_CATALOG[l.cat].vi + (l.gift ? ' (Tặng)' : '')).join(' + ')}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-ink/80">
                      <input type="radio" name="rec" checked={o.recommended} onChange={() => setOptions((os) => os.map((x) => ({ ...x, recommended: x.id === o.id })))} className="h-3 w-3" />
                      Recommended
                    </label>
                    {options.length > 1 && (
                      <button onClick={() => setOptions((os) => os.filter((x) => x.id !== o.id))} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted hover:border-rose-300 hover:text-rose-600">Remove</button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-line">
                  <div className="grid min-w-[720px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.2fr 0.7fr 0.5fr 1fr 0.6fr 1fr 24px' }}>
                    <span>#</span><span>Dịch vụ / Service</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Giảm</span><span className="text-right">Tổng giá</span><span />
                  </div>
                  {o.lines.map((l, li) => (
                    <div key={li} className="grid min-w-[720px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.2fr 0.7fr 0.5fr 1fr 0.6fr 1fr 24px' }}>
                      <span className="text-faint">{li + 1}</span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        {/* Trial SKUs and normal SKUs never appear in the same list —
                            a trial quotation offers only trial products, and vice versa. */}
                        <select value={l.cat} onChange={(e) => { const c = Number(e.target.value); patch(o.id, li, { cat: c, price: l.gift ? 0 : QUOTE_CATALOG[c].price }) }} className="min-w-0 flex-1 truncate rounded border border-line bg-surface px-1.5 py-1 text-[11.5px]">
                          {catForMode(mode).map(({ c, i }) => <option key={i} value={i}>{c.vi}</option>)}
                        </select>
                        {l.gift && <Pill tone="active">Tặng</Pill>}
                      </span>
                      <span className="text-[11px] text-muted">{QUOTE_CATALOG[l.cat].unitVi} / {QUOTE_CATALOG[l.cat].unitEn}</span>
                      <input type="number" min={1} value={l.qty} onChange={(e) => patch(o.id, li, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-full rounded border border-line bg-surface px-1 py-1 text-right text-[11.5px] tabular-nums" />
                      <input disabled={l.gift} value={l.gift ? '0' : l.price.toLocaleString('en-US')} onChange={(e) => patch(o.id, li, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} className={cn('w-full rounded border border-line px-1 py-1 text-right text-[11.5px] tabular-nums', l.gift ? 'bg-canvas text-faint' : 'bg-surface')} />
                      <span className="flex items-center justify-end gap-0.5">
                        {/* Read-only, always: the number is a consequence of the
                            quantity, and an editable box invites overwriting the
                            rule the customer was promised. */}
                        <input
                          type="number" min={0} max={100} value={l.disc}
                          disabled={l.gift || rule.line !== 'free'} readOnly={l.gift || rule.line !== 'free'}
                          onChange={(e) => patch(o.id, li, { disc: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                          className={cn('w-11 rounded border px-1 py-1 text-right text-[11.5px] tabular-nums', l.gift ? 'border-line bg-canvas text-faint' : fieldCls(rule.line, l.disc > 0))} />
                        <span className="text-[10.5px] text-faint">%</span>
                      </span>
                      <span className="text-right tabular-nums">{lineTotal(l).toLocaleString('en-US')}</span>
                      {o.lines.length > 1
                        ? <button onClick={() => delLine(o.id, li)} className="text-[12px] text-faint hover:text-rose-600">✕</button>
                        : <span />}
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => addLine(o.id)} className="rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">+ Line item</button>
                    <button onClick={() => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, lines: [...x.lines, { cat: x.lines[0].cat, qty: 1, price: 0, disc: 0, gift: true }] } : x)))} className="rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">+ Gift (Tặng)</button>
                  </div>
                  <div className="min-w-[360px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
                    {/* Every figure shows the arithmetic that produced it. The client has
                        to be able to confirm the ORDER the three discounts stack in —
                        percentage before amount, VAT on what is left — and a column of
                        bare totals cannot be checked against their own spreadsheet. */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 text-muted">
                        Tạm tính
                        <span className="ml-1 text-[10px] text-faint">Σ (SL × đơn giá × (1 − CK dòng))</span>
                      </span>
                      <span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span>
                    </div>
                    {/* Order-level %, on the subtotal and before VAT. Free, rule-driven
                        or locked at 0 depending on the mode — never a plain input. */}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted">
                        Chiết khấu tổng đơn
                        <input
                          type="number" min={0} max={100} value={o.optDisc}
                          disabled={rule.order !== 'free'} readOnly={rule.order !== 'free'}
                          onChange={(e) => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, optDisc: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x)))}
                          className={cn('w-12 rounded border px-1 py-0.5 text-right text-[11.5px] tabular-nums', fieldCls(rule.order, o.optDisc > 0))} />
                        <span className="text-[10.5px] text-faint">%</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {o.optDisc > 0 && <span className="block text-[10px] text-faint">{sub.toLocaleString('en-US')} × {o.optDisc}%</span>}
                        <span className={cn('tabular-nums', pctCut > 0 && 'text-rose-600')}>{pctCut > 0 ? '−' : ''}{pctCut.toLocaleString('en-US')} ₫</span>
                      </span>
                    </div>
                    {/* The client's "Voucher": a flat amount, not a percentage. It comes
                        off AFTER the percentage, so the two cannot be read as one. */}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted">
                        Giảm số tiền
                        <input
                          type="text" inputMode="numeric" value={o.fixed ? o.fixed.toLocaleString('en-US') : '0'}
                          disabled={rule.fixed !== 'free'} readOnly={rule.fixed !== 'free'}
                          onChange={(e) => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, fixed: Number(e.target.value.replace(/\D/g, '')) || 0 } : x)))}
                          className={cn('w-24 rounded border px-1 py-0.5 text-right text-[11.5px] tabular-nums', fieldCls(rule.fixed, o.fixed > 0))} />
                        <span className="text-[10.5px] text-faint">₫</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {/* Only ever visible when the cap actually bit — otherwise it is
                            noise on a line that already reads correctly. */}
                        {o.fixed > fixedCut && <span className="block text-[10px] text-rose-500">tối đa {(sub - pctCut).toLocaleString('en-US')}</span>}
                        <span className={cn('tabular-nums', fixedCut > 0 && 'text-rose-600')}>{fixedCut > 0 ? '−' : ''}{fixedCut.toLocaleString('en-US')} ₫</span>
                      </span>
                    </div>
                    {(pctCut > 0 || fixedCut > 0) && (
                      <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-line-soft pt-1">
                        <span className="min-w-0 text-muted">
                          Sau chiết khấu
                          <span className="ml-1 text-[10px] text-faint">tạm tính − CK tổng đơn − giảm tiền</span>
                        </span>
                        <span className="tabular-nums font-medium">{net.toLocaleString('en-US')} ₫</span>
                      </div>
                    )}
                    {/* VAT is charged on what is LEFT, never on the pre-discount figure —
                        the single most consequential line here, because getting it wrong
                        overcharges the customer on a filed invoice. */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 text-muted">
                        Thuế GTGT ({VAT_RATE}%)
                        <span className="ml-1 text-[10px] text-faint">{net.toLocaleString('en-US')} × {VAT_RATE}%</span>
                      </span>
                      <span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span>
                    </div>
                    <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{(net + vat).toLocaleString('en-US')} ₫</span></div>
                    <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(net + vat)}.</p>
                    {/* The formula in one line, for the client to sign off. It is stated
                        rather than inferred from the numbers above, because the ORDER is
                        the part that is genuinely open to disagreement. */}
                    <p className="mt-2 rounded-md border border-line bg-surface px-2 py-1.5 text-[10px] leading-relaxed text-muted">
                      <b className="text-ink/70">Công thức:</b> Tạm tính = Σ (SL × đơn giá × (1 − CK dòng)) → trừ <b>CK tổng đơn %</b> → trừ <b>giảm số tiền</b> (tối đa bằng phần còn lại) → <b>VAT tính trên số còn lại</b> → Tổng sau VAT. Làm tròn đến đồng ở từng bước.
                    </p>
                  </div>
                </div>

              </div>
            )
          })}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={addOption} disabled={options.length >= 3} className={cn('rounded-lg border px-3 py-1.5 text-[12px] font-medium', options.length >= 3 ? 'border-line text-faint' : 'border-brand/40 text-brand hover:bg-brand-soft')}>
              + Add option {options.length >= 3 && '(max 3)'}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Internal note — not printed</label>
            <textarea rows={2} placeholder="Why this pricing, what the customer asked for…" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]" />
          </div>
        </div>

        {/* footer */}
        <div className="space-y-2 border-t border-line px-5 py-3">
          {/* One line, and it names the PERSON — "needs approval" leaves the rep
              guessing who to chase, which is how a quotation sits for three days. */}
          {approver && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900">
              Chiết khấu tổng đơn <b>{orderPct}%</b> → cần <b>{SALES_ROLE_LABEL[approver]}</b> duyệt trước khi gửi khách.
              {/* Why the lead was skipped, when the options disagreed. */}
              {escalated && <span className="text-amber-800"> Có option chỉ cần Sales lead, nhưng option cao nhất vượt {SPECIAL_LEADER_MAX}% nên <b>cả báo giá</b> trình Sales manager.</span>}
              <span className="text-amber-800"> Mức ≤ {SPECIAL_LEADER_MAX}% do Sales lead duyệt, trên {SPECIAL_LEADER_MAX}% do Sales manager duyệt. Chiết khấu theo bậc trên từng dòng và số tiền giảm cố định <b>không cần duyệt</b>. Sửa lại % sau khi đã duyệt sẽ <b>hủy phê duyệt</b> và phải trình lại.</span>
            </div>
          )}
          {/* The waiver, said out loud. A rep who sees no approval step needs to know
              it is because of who they are, not because the rule stopped applying. */}
          {waived && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] leading-relaxed text-emerald-900">
              Chiết khấu tổng đơn <b>{orderPct}%</b> — <b>không cần trình duyệt</b>. {creator.name} là <b>{SALES_ROLE_LABEL[creator.role]}</b>, mức này thuộc thẩm quyền của chính người lập báo giá.
              {creator.role === 'lead' && <span className="text-emerald-800"> Trên {SPECIAL_LEADER_MAX}% thì vẫn phải trình Sales manager.</span>}
            </div>
          )}
          {mode === 'special' && (
            <p className="text-[11.5px] leading-relaxed text-amber-700">
              <b>Ưu đãi đặc biệt — không có bước duyệt.</b> Cả ba mức đều do sales tự quyết, nên con số ở đây là trách nhiệm của người lập báo giá.
            </p>
          )}
          {!everyOptionPaid && <p className="text-[11.5px] text-rose-600">Every option needs at least one paid line — an option cannot be gifts only.</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
            <button disabled={!co} className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', co ? 'border-line text-ink hover:border-ink/40' : 'border-line text-faint')}>Save draft</button>
            <button disabled={!valid} className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', valid ? 'border-brand/40 text-brand hover:bg-brand-soft' : 'border-line text-faint')}>Preview PDF</button>
            <button disabled={!valid} className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', !valid ? 'bg-line' : approver ? 'bg-amber-600 hover:opacity-90' : 'bg-brand hover:opacity-90')}>
              {approver ? `Gửi ${SALES_ROLE_LABEL[approver]} duyệt →` : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** One row of the MST-root suggestion list, with its two link directions. */
function MstMatchRow({ m, rel, onSet }: {
  m: typeof MST_ROOT_MATCHES[number]
  rel: 'none' | 'parent' | 'child'
  onSet: (r: 'none' | 'parent' | 'child') => void
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2', rel === 'none' ? 'border-line bg-surface' : 'border-brand/40 bg-brand-soft/50')}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-ink">{m.name}</p>
        <p className="truncate text-[10.5px] text-faint">MST {m.tax} · {m.where} · {m.owner}</p>
      </div>
      {/* Two directions, and they have different cardinality on purpose: the new
          company has at most ONE parent, but can be the parent of MANY of these. */}
      <div className="flex shrink-0 overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
        <button onClick={() => onSet(rel === 'child' ? 'none' : 'child')} className={cn('px-2 py-1', rel === 'child' ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')} title="Công ty đang tạo là công ty con của công ty này">↑ Là con của</button>
        <button onClick={() => onSet(rel === 'parent' ? 'none' : 'parent')} className={cn('border-l border-line px-2 py-1', rel === 'parent' ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')} title="Công ty đang tạo là công ty mẹ của công ty này">↓ Là mẹ của</button>
      </div>
    </div>
  )
}

/**
 * New-company screen — a full page, not a modal: it is long enough that a rep needs
 * the whole viewport, and it can be linked to and reloaded.
 *
 * `lockedParent` pre-fills the parent as a fixed row. Nothing sets it today: the
 * "+ Thêm công ty con" shortcut was removed so that every company is created
 * through this one page and passes the same MST duplicate check — a second create
 * path is a second way to make a duplicate. The prop stays because the linked-from-
 * parent flow is a plausible addition; the group link itself is made with
 * "Gán quan hệ mẹ / con" on the company record.
 */
function CompanyCreatePage({ onBack, lockedParent }: { onBack: () => void; lockedParent?: Company }) {
  useDetailCrumb(lockedParent ? `Thêm công ty con · ${coLabel(lockedParent)}` : 'New company', onBack)
  /* Quốc tịch drives whether the Vietnamese province picker is shown at all. */
  const [country, setCountry] = useState('Việt Nam')
  /* Which invoice shape this buyer takes — it decides whether MST is required and
     whether the CCCD / buyer-name pair is asked for at all. */
  const [buyer, setBuyer] = useState<BuyerType>('dn-vn')
  /** An individual buyer has no Tên đơn vị and no MST — the person replaces both. */
  const isIndiv = buyer === 'ca-nhan-cccd' || buyer === 'ca-nhan'
  const [tax, setTax] = useState('')
  const [looking, setLooking] = useState(false)
  const [looked, setLooked] = useState(false)
  /* Which of the same-tax-root companies this new record links to, and in which
     direction. Keyed by company name; at most one 'child' entry can exist. */
  const [rels, setRels] = useState<Record<string, 'none' | 'parent' | 'child'>>({})
  const [docs, setDocs] = useState<string[]>([])
  const isVN = country.trim().toLowerCase().startsWith('việt nam') || country.trim().toLowerCase() === 'vietnam'
  const rootHit = tax.replace(/\D/g, '').length >= 10
  const parentPick = Object.entries(rels).find(([, r]) => r === 'child')?.[0]
  const childPicks = Object.entries(rels).filter(([, r]) => r === 'parent').map(([n]) => n)

  const setRel = (name: string, r: 'none' | 'parent' | 'child') =>
    setRels((prev) => {
      const next = { ...prev }
      // only ONE parent is possible, so choosing a new one releases the old
      if (r === 'child') for (const k of Object.keys(next)) if (next[k] === 'child') next[k] = 'none'
      next[name] = r
      return next
    })

  const lookup = () => {
    setLooking(true)
    window.setTimeout(() => { setLooking(false); setLooked(true) }, 700)
  }

  return (
    <div className="max-w-[860px] pb-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-tight">{lockedParent ? 'Thêm công ty con' : 'New company'}</h2>
        <Pill tone="draft">Draft</Pill>
      </div>

      <div className="space-y-8">
        {/* TWO groups, because the fields answer two different questions. "Who is
            this company to us" is how a rep finds and talks about them; "what must
            print on their invoice" is a fiscal contract. Mixing them is what had a
            rep filling in a tax code between a brand name and an industry. */}
        <JobGroup title="Thông tin xuất hóa đơn">
          {/* FIRST in the group, because it decides which of the fields below even
              exist. Asking for a tax code and then removing the field is worse than
              asking one question up front. */}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Phân loại người mua <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(BUYER_TYPE) as BuyerType[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setBuyer(k)}
                  className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', buyer === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}
                >
                  {BUYER_TYPE[k].vi}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{BUYER_TYPE[buyer].hint}</p>
          </div>

          {/* The NAME line, and which one it is depends on the buyer. For a company
              it is the legal name; for an individual the person REPLACES it — an
              individual has no Tên đơn vị, and leaving an empty company-name field
              on the form invites someone to type the person's name into it. */}
          {isIndiv ? (
            buyer === 'ca-nhan'
              ? (
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Họ tên người mua hàng</label>
                  <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2 text-[12.5px] text-muted">
                    <span className="font-medium text-ink/70">{RETAIL_BUYER}</span>
                    <span className="ml-auto shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px]">hệ thống tự điền</span>
                  </div>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Cá nhân không có CCCD — hóa đơn in đúng câu này. Không nhập tay, không sửa.</p>
                </div>
              )
              : <LField label="Họ tên người mua hàng" req value="Nguyễn Văn A" hint="In vào dòng “Họ tên người mua hàng” trên hóa đơn. Cá nhân không có Tên đơn vị." />
          ) : (
            <LField label="Tên đơn vị / Legal name" req value="Công ty TNHH …" hint="Đúng như trên giấy phép — in vào dòng “Tên đơn vị” trên hóa đơn VAT." />
          )}

          {/* MST exists only for a Vietnamese company. A foreign company has no
              Vietnamese tax code and an individual has none at all, so the field is
              REMOVED rather than shown empty with a note — an input nobody may fill
              is a question the form should not have asked. */}
          {BUYER_TYPE[buyer].tax === 'req' && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Mã số thuế (MST) <span className="text-rose-500">*</span></label>
              <div className="flex gap-1.5">
                <input value={tax} onChange={(e) => { setTax(e.target.value); setLooked(false) }} placeholder="0328xxxxxx-001" className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
                <button onClick={lookup} disabled={!rootHit || looking} className={cn('shrink-0 rounded-md px-2.5 py-2 text-[11.5px] font-semibold', rootHit && !looking ? 'bg-brand text-white hover:opacity-90' : 'cursor-not-allowed bg-canvas text-faint')}>
                  {looking ? 'Đang tra…' : 'Tra cứu'}
                </button>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">10 số, hoặc 10 số + “-001” nếu là chi nhánh.</p>
            </div>
          )}
          {buyer === 'dn-nn' && (
            <p className="rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
              Doanh nghiệp nước ngoài <b className="text-ink">không có MST Việt Nam</b> — không hỏi mã số thuế. Hóa đơn vẫn cần <b className="text-ink">tên đơn vị</b> và <b className="text-ink">địa chỉ xuất hóa đơn</b>.
            </p>
          )}

          {/* CCCD is the individual's identifier and is never stored in the MST
              field — different format, different legal meaning. */}
          {BUYER_TYPE[buyer].needsIdCard && (
            <LField label="Số CCCD" req value="079xxxxxxxxx" hint="Căn cước công dân — in vào dòng “Căn cước công dân”. Không dùng ô MST." />
          )}

          {/* No address for a buyer who provided nothing — see the note below. */}
          {!BUYER_TYPE[buyer].noAddress && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Địa chỉ xuất hóa đơn <span className="text-rose-500">*</span></label>
              <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{isVN ? 'Số nhà, tên đường, phường/xã, quận/huyện' : 'Street, city, postal code, country'}</div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                In trên báo giá, đơn hàng và hóa đơn VAT. Bắt buộc với các phân loại còn lại, kể cả doanh nghiệp nước ngoài không có MST. Được viết tắt các danh từ thông dụng (P, TP, VN, CP, TNHH, KCN, CN…) miễn còn xác định chính xác địa chỉ.
              </p>
            </div>
          )}
          {/* The consequence the customer feels, straight from the decree: an invoice
              with no buyer information cannot be used by an organisation to record an
              expense or in a tax settlement. A rep picking this for someone who is
              really buying for a company has just guaranteed a re-issue request. */}
          {BUYER_TYPE[buyer].noAddress && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
              Khối người mua chỉ có một dòng <b>“{RETAIL_BUYER}”</b> — không MST, không CCCD, không địa chỉ.
              <b className="mt-1 block">Hóa đơn này khách KHÔNG dùng để hạch toán chi phí hay quyết toán thuế được</b>
              <span className="text-amber-800/85">(điểm 4, Phụ lục NĐ 254/2026/NĐ-CP). Chỉ chọn khi khách thật sự là người tiêu dùng cá nhân và không cung cấp thông tin.</span>
            </p>
          )}

          {looked && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-emerald-900">
              <p className="font-semibold">✓ Đã lấy thông tin từ cơ quan thuế</p>
              <p className="mt-1">Tên đơn vị, địa chỉ đăng ký và ngành nghề đã được điền. <b>Rep vẫn sửa được</b> — dữ liệu đăng ký thường là địa chỉ trụ sở, không phải nơi làm việc thực tế.</p>
            </div>
          )}

          {/* The MST-root list, in place of a blocking warning: same first 10 digits
              means "probably related", never "duplicate". The rep links it, or not. */}
          {rootHit && (
            <div className="rounded-lg border border-line bg-canvas/50 p-3">
              <p className="text-[12px] font-semibold text-ink">Có {MST_ROOT_MATCHES.length} công ty trùng 10 số gốc MST</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">Trùng gốc thường là cùng một pháp nhân — chi nhánh hoặc công ty con. Chọn hướng liên kết cho từng công ty, hoặc bỏ qua nếu không liên quan. <b className="text-ink/70">Không bắt buộc</b> và không chặn lưu.</p>
              <div className="mt-2 space-y-1.5">
                {MST_ROOT_MATCHES.map((m) => (
                  <MstMatchRow key={m.name} m={m} rel={rels[m.name] ?? 'none'} onSet={(r) => setRel(m.name, r)} />
                ))}
              </div>
              {(parentPick || childPicks.length > 0) && (
                <div className="mt-2 rounded-md border border-brand/30 bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">
                  <b>Sẽ liên kết:</b>
                  {parentPick && <> công ty con của <b>{parentPick}</b>.</>}
                  {childPicks.length > 0 && <> công ty mẹ của <b>{childPicks.join(', ')}</b>.</>}
                  <span className="block text-brand/70">Liên kết chỉ để tra cứu — MST, hợp đồng, quota, hoá đơn và sales phụ trách vẫn riêng của từng công ty.</span>
                  {parentPick && childPicks.length > 0 && (
                    <span className="mt-1 block rounded bg-amber-100 px-1.5 py-1 text-amber-900">Công ty này sẽ nằm giữa hai tầng. Hệ thống kiểm tra liên kết vòng khi lưu — nếu công ty mẹ đã nằm dưới một trong các công ty con, liên kết sẽ bị từ chối.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {lockedParent && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Công ty mẹ</label>
              <div className="flex items-center gap-2 rounded-md border border-brand/30 bg-brand-soft px-3 py-2 text-[12.5px] text-brand">
                <span className="min-w-0 truncate font-medium">{coLabel(lockedParent)}</span>
                <span className="shrink-0 text-[10.5px] text-brand/70">MST {lockedParent.tax}</span>
                <span className="ml-auto shrink-0 rounded border border-brand/30 px-1.5 py-0.5 text-[10px] font-medium">Đã cố định</span>
              </div>
            </div>
          )}
        </JobGroup>

        <JobGroup title="Thông tin cơ bản">
          {/* Tên hiển thị leads this group, exactly as it leads Thông tin cơ bản on
              the Basic info card — the two surfaces stay field-for-field identical.
              Optional: every list, board and document falls back to the legal name
              until a display name is set, so leaving it blank blocks nothing.

              WHAT CREATION STILL DOES NOT ASK FOR, and where it is asked instead:
              company tags · the EXACT headcount · ngày thành lập → the Company page
              tab. Those are page content, entered where they are seen. Industry and
              the size BAND are asked here instead: both are list columns and search
              facets, needed the day the record exists rather than when the page is
              written. */}
          <LField label="Tên hiển thị" value="e.g. FPT, Tiki, NEC" hint="Tên thương hiệu ứng viên biết — hiện trên trang công ty và mọi thẻ việc làm. Bỏ trống thì dùng tên pháp lý." />
          {/* Two separate facts, filtered separately — never one joined field. */}
          <div className="grid grid-cols-2 gap-3">
            <LField label="Industry" value="IT / Software" select hint="Từ Master data → Industry." />
            <LField label="Company size" value="200–500" select hint="Khoảng nhân sự — cột danh sách và bộ lọc." />
          </div>
          {/* Country of registration gates the province picker: a Vietnamese company
              gets the 34 provincial units, a foreign one does not. A company has a
              country of REGISTRATION, not a nationality. */}
          <ComboField
            label="Quốc gia đăng ký / Country of registration"
            value={country}
            onChange={setCountry}
            placeholder="Select a country…"
            options={MD_DOMAINS.find((d) => d.key === 'country')?.entries ?? ['Việt Nam']}
          />
          {isVN ? (
            <LField label="Tỉnh / Thành phố · City" value="Hồ Chí Minh" select hint="Tỉnh/thành của trụ sở — từ Master data → Locations." />
          ) : (
            <p className="rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
              Không phải công ty Việt Nam nên <b className="text-ink">không chọn Tỉnh / Thành phố</b> — ghi thành phố vào <b className="text-ink">Địa chỉ xuất hóa đơn</b> ở nhóm dưới.
            </p>
          )}
          <LField label="Website" value="company.vn" />
        </JobGroup>

        {/* Uploaded at creation because it is what proves the MST belongs to them —
            the same document Accounting will want before the first VAT invoice. */}
        <JobGroup title="Company verification document">
          <div>
            <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-4 text-center">
              <p className="text-[12px] font-medium text-ink">Kéo thả hoặc <button onClick={() => setDocs((d) => [...d, `giay-phep-kinh-doanh-${d.length + 1}.pdf`])} className="text-brand hover:underline">chọn tệp</button></p>
              <p className="mt-0.5 text-[10.5px] text-faint">Giấy phép kinh doanh · Giấy chứng nhận đăng ký thuế · Hợp đồng đã ký. PDF, JPG, PNG — tối đa 10MB mỗi tệp.</p>
            </div>
            {docs.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {docs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
                    <span className="text-[13px]"></span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink/80">{d}</span>
                    <button onClick={() => setDocs((p) => p.filter((_, j) => j !== i))} className="text-[11px] text-faint hover:text-ink">✕</button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">Không bắt buộc lúc tạo — có thể tải lên bất cứ lúc nào từ hồ sơ công ty.</p>
          </div>
        </JobGroup>

        <JobGroup title="Primary contact">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Contact name" req value="Họ và tên" />
            <ComboField label="Title" value="HR Manager" placeholder="Select or type a title…" options={['HR Manager', 'HR Director', 'Talent Acquisition', 'Recruiter', 'CEO / Founder', 'Office Manager']} />
          </div>
          {/* Both required: a contact nobody can reach is not a contact. */}
          <div className="grid grid-cols-2 gap-3">
            <LField label="Phone" req value="09xx xxx xxx" />
            <LField label="Email" req value="hr@company.vn" />
          </div>
        </JobGroup>

        <JobGroup title="Sales">
          <div className="grid grid-cols-2 gap-3">
            <ComboField label="Lead source" value="Website sign-up" placeholder="Select or type…" options={['Website sign-up', 'Inbound call', 'Referral', 'Event / job fair', 'Outbound', 'Partner']} />
            <LField label="Sales owner" value="Nguyễn Thị Lan" select />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Products interested</label>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> Job Posting</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Resume Search</span>
            </div>
          </div>
          <LField label="Estimated deal value (₫)" value="0" />
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Description</label>
            <div className="h-16 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">How we heard about them, need, next step…</div>
          </div>
        </JobGroup>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <button onClick={onBack} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
        <button onClick={onBack} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Save company</button>
      </div>
    </div>
  )
}

function ConvertLeadModal({ companyName, value, owner, onClose }: { companyName: string; value: number; owner: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[760px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Convert to customer — {companyName}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[72vh] space-y-3 overflow-y-auto p-5">
          <div className="flex gap-2.5 rounded-lg bg-brand-soft px-3.5 py-3 text-[12px] leading-relaxed text-brand">
            <span></span>
            <div>Converting creates the <b>company account</b> + its <b>first user login</b>, and provisions the <b>products</b> they bought. If the company already exists (e.g. it self-signed up), link it instead to avoid a duplicate.</div>
          </div>

          {/* Account */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">Account <span className="font-normal text-faint">(the company)</span></p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <div className="rounded-lg border border-brand bg-brand-soft/40 p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-brand"><Radio on /> Create new account</div>
                <LField label="Account name" req value={companyName} />
              </div>
              <div className="flex items-center justify-center text-[11px] font-semibold text-faint">— OR —</div>
              <div className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-muted"><Radio /> Choose existing account</div>
                <div className="flex items-center rounded-md border border-line px-3 py-2 text-[12px] text-faint">Search by name / tax code <span className="ml-auto"></span></div>
                <p className="mt-2 rounded-md bg-canvas/60 px-2 py-2.5 text-center text-[11px] text-faint">0 matches — checked by tax code (dedup)</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">Contact <span className="font-normal text-faint">(→ first user login)</span></p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <div className="rounded-lg border border-brand bg-brand-soft/40 p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-brand"><Radio on /> Create new contact</div>
                <LField label="Name · title" value="Ms. Vũ Thanh Linh · HR Manager" />
                <p className="mt-1.5 text-[11px] text-muted">Gets the login as HR Manager (super admin).</p>
              </div>
              <div className="flex items-center justify-center text-[11px] font-semibold text-faint">— OR —</div>
              <div className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-muted"><Radio /> Choose existing contact</div>
                <p className="rounded-md bg-canvas/60 px-2 py-2.5 text-center text-[11px] text-faint">0 matches detected</p>
              </div>
            </div>
          </div>

          {/* Products (our version of "Opportunity") */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">Products <span className="font-normal text-faint">(provisioned as quota on convert)</span></p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> Job Posting — 10 slots</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> Resume Search — 100 unlocks</span>
            </div>
            <label className="mt-2.5 flex items-center gap-2 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Don’t provision yet (activate later)</label>
            <p className="mt-2 text-[11px] text-amber-700">Job Posting is selected → a public company page will be required after convert.</p>
            <p className="mt-1 text-[11px] text-faint">From <b className="text-ink/70">{companyName}</b> · {money(value)} · Quote Q-2042</p>
          </div>

          {/* owner + status */}
          <div className="grid gap-3 md:grid-cols-2">
            <LField label="Record owner" req value={owner} select />
            <LField label="Converted status" req value="Active customer" select />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Convert</button>
        </div>
      </div>
    </div>
  )
}

export function AdminPipeline({ onActivate }: { onActivate?: () => void } = {}) {
  const [view, setView] = useState<'table' | 'board'>('table')
  const [openLead, setOpenLead] = useState<Deal | null>(null)
  const [convertDeal, setConvertDeal] = useState<Deal | null>(null)
  const [creating, setCreating] = useState(false)

  if (openLead) return <LeadDetail deal={openLead} onBack={() => setOpenLead(null)} />
  if (creating) return <CompanyCreatePage onBack={() => setCreating(false)} />

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* view toggle — table is the default for long pipelines */}
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
          <button onClick={() => setView('table')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'table' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>☰ Table</button>
          <button onClick={() => setView('board')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'board' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>▦ Board</button>
        </div>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New lead</button>
      </div>

      {view === 'table' ? <PipelineTable onConvert={setConvertDeal} onOpen={setOpenLead} /> : <PipelineBoard onConvert={setConvertDeal} onOpen={setOpenLead} />}

      {/* Hand-off banner — the entry point to the activation walkthrough, and ONLY
          that. Rendered only when a caller supplies onActivate (the admin wireframe).
          On a requirement page nobody passes it, where the banner was a dead CTA
          plus a hard-coded storyboard line about one specific company. */}
      {onActivate && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-[16px]"></span>
          <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-emerald-800">
            <b>“Cty Trường Sơn” is Won.</b> The pipeline ends here. Next you <b>activate the customer</b> — create the account, choose products, and (for Job Posting) build the company page. This hands the customer off to <b>Account management</b>.
          </p>
          <button onClick={onActivate} className="shrink-0 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Activate customer →</button>
        </div>
      )}

      {convertDeal && <ConvertLeadModal companyName={convertDeal.company} value={convertDeal.value} owner={convertDeal.owner} onClose={() => setConvertDeal(null)} />}
    </div>
  )
}
/** Products, compactly: first name + "+N" when there are more. Full list on hover. */
function ProductCell({ ids }: { ids: number[] }) {
  if (!ids.length) return <span className="text-faint">—</span>
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={ids.map((i) => QUOTE_CATALOG[i].vi).join(' · ')}>
      <span className="truncate">{QUOTE_CATALOG[ids[0]].short}</span>
      {ids.length > 1 && <span className="shrink-0 rounded border border-line bg-canvas px-1 text-[10px] text-muted">+{ids.length - 1}</span>}
    </span>
  )
}

function SaraminMark({ width = 104, fill = SARAMIN_BLUE }: { width?: number; fill?: string }) {
  return (
    <svg viewBox="0 0 123.3 31" width={width} height={(width * 31) / 123.3} role="img" aria-label="Saramin">
      <path d={SARAMIN_MARK_D} fill={fill} fillRule="evenodd" />
    </svg>
  )
}

/** The A4 sheet. Rendered at 794px (210mm @96dpi) and scaled by the viewer. */
function QuotationPdfDoc({ q, co }: { q: Quote; co?: Company }) {
  const opts = pdfOptions(q)
  const rep = co?.owner ?? 'Nguyễn Thị Lan'
  const contact = co?.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0] ?? q.customer
  const sd = signDate(q.created)
  const COLS = '28px minmax(0,2.6fr) 58px 46px 84px 58px 92px'

  return (
    <div className="mx-auto bg-white text-slate-800 shadow-xl" style={{ width: 794 }}>
      <div className="px-[52px] py-[44px]">
        {/* ── letterhead ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold leading-snug text-slate-900">{ISSUER.nameVi}</p>
            <p className="text-[11px] font-medium italic leading-snug text-slate-500">{ISSUER.nameEn}</p>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-slate-600">{ISSUER.addrVi}</p>
            <p className="text-[9.5px] italic leading-relaxed text-slate-400">{ISSUER.addrEn}</p>
            <p className="mt-1 text-[9.5px] font-medium text-sky-700">{ISSUER.web}</p>
          </div>
          {/* Group brand on the document: Saramin is the parent, TopDev the brand
              the customer buys on — both belong here, in that order. */}
          <div className="shrink-0 pt-0.5 text-right">
            <SaraminMark width={104} />
            <p className="mt-1.5 border-t border-slate-200 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {ISSUER.brand} Vietnam
            </p>
          </div>
        </div>

        <p className="mt-2 text-[9.5px] text-slate-600">
          <span className="text-slate-400">Báo giá bởi / Proposed by:</span> <b className="text-slate-800">{rep}</b> | {rep.split(' ').pop()?.toLowerCase()}@topdev.vn
        </p>

        {/* ── title band ───────────────────────────────────────────────
            A black slab is loud without being informative. This is the same
            content on paper-white with a single brand rule down the left: the
            title reads as a title, the number stays monospaced and findable, and
            the two dates sit in their own labelled cells so "hết hạn" — the one
            date that actually constrains the customer — can be picked out. */}
        <div className="mt-5 flex items-stretch justify-between gap-6 border-y border-slate-200 py-3.5">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="h-full w-[3px] shrink-0 rounded-full" style={{ backgroundColor: SARAMIN_BLUE }} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <p className="text-[26px] font-black leading-none tracking-tight text-slate-900">BÁO GIÁ</p>
                <p className="text-[10.5px] font-semibold tracking-[0.28em] text-slate-400">PROPOSAL</p>
              </div>
              <p className="mt-2 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11.5px] font-bold tracking-tight" style={{ color: SARAMIN_BLUE }}>
                {q.code}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {([
              { vi: 'Ngày báo giá', en: 'Proposal Date', v: q.created, accent: false },
              { vi: 'Ngày hết hạn', en: 'Expiry Date', v: q.expires, accent: true },
            ]).map((d) => (
              <div
                key={d.en}
                className={cn('min-w-[104px] rounded-md border px-2.5 py-1.5 text-right', d.accent ? 'border-slate-300 bg-slate-50' : 'border-slate-200')}
              >
                <span className="block text-[8.5px] font-semibold uppercase tracking-wide text-slate-500">{d.vi}</span>
                <span className="block text-[8.5px] italic text-slate-400">{d.en}</span>
                <b className={cn('mt-1 block text-[12.5px] tabular-nums', d.accent ? 'text-slate-900' : 'text-slate-700')}>{d.v}</b>
              </div>
            ))}
          </div>
        </div>

        {/* ── customer + VAT billing, side by side ───────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <Bi vi="Thông tin khách hàng" en="Client information" className="text-[10px] font-bold uppercase tracking-wide text-slate-700" />
            <dl className="mt-2 space-y-1.5 text-[10px] leading-snug">
              <div><dt className="text-slate-400">Tên khách hàng / Client name</dt><dd className="font-semibold text-slate-800">{contact}</dd></div>
              <div><dt className="text-slate-400">Email</dt><dd className="font-medium text-slate-700">{co ? `${contact.split(' ').pop()?.toLowerCase()}@${co.domain}` : '—'}</dd></div>
              <div><dt className="text-slate-400">Số điện thoại / Phone number</dt><dd className="font-medium tabular-nums text-slate-700">0978 490 363</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <Bi vi="Thông tin xuất hóa đơn VAT" en="Billing information for VAT-invoice" className="text-[10px] font-bold uppercase tracking-wide text-slate-700" />
            <dl className="mt-2 space-y-1.5 text-[10px] leading-snug">
              <div><dt className="text-slate-400">Tên công ty / Company name</dt><dd className="font-semibold uppercase text-slate-800">{co?.legalName ?? q.customer}</dd></div>
              <div><dt className="text-slate-400">Địa chỉ ĐKKD / Billing Address</dt><dd className="font-medium text-slate-700">{co?.address ?? '—'}</dd></div>
              <div><dt className="text-slate-400">Mã số thuế / Tax code</dt><dd className="font-medium tabular-nums text-slate-700">{co?.tax ?? '—'}</dd></div>
            </dl>
          </div>
        </div>

        {/* ── options ────────────────────────────────────────────────── */}
        {opts.map((o) => (
          <section key={o.n} className="mt-5">
            {/* Options are ALTERNATIVES. With three of them the reader needs to know
                which one we are actually proposing, so the recommended one is named
                — without implying the others are unavailable. */}
            <div
              className="flex items-start justify-between gap-3 rounded-t-lg border border-b-0 px-3.5 py-2"
              style={{
                borderColor: o.n === 1 ? `${SARAMIN_BLUE}33` : '#E2E8F0',
                backgroundColor: o.n === 1 ? `${SARAMIN_BLUE}0F` : '#F8FAFC',
                borderLeft: `3px solid ${o.n === 1 ? SARAMIN_BLUE : '#94A3B8'}`,
              }}
            >
              <p className="min-w-0 text-[10.5px] leading-snug">
                <span className="font-bold" style={{ color: o.n === 1 ? SARAMIN_BLUE : '#475569' }}>Option {o.n}</span>
                <span className="ml-1.5 text-slate-600">{o.title}</span>
              </p>
              {o.n === 1 && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: SARAMIN_BLUE }}>
                  Đề xuất · Recommended
                </span>
              )}
            </div>
            <div className="rounded-b-lg border border-t-0 border-slate-200">
              {/* header row */}
              <div className="grid items-end gap-x-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[8.5px] font-bold uppercase leading-tight text-slate-600" style={{ gridTemplateColumns: COLS }}>
                <Bi vi="STT" en="No." />
                <Bi vi="Dịch vụ" en="Type of service" />
                <Bi vi="Đơn vị tính" en="Unit" />
                <Bi vi="Số lượng" en="Quantity" />
                <Bi vi="Đơn giá" en="Unit price" className="text-right" />
                <Bi vi="Giảm giá" en="Discount" className="text-right" />
                <Bi vi="Tổng giá" en="Total price" className="text-right" />
              </div>
              {o.lines.map((l, i) => (
                <div key={i} className="grid items-center gap-x-2 border-b border-slate-100 px-3 py-2 text-[10px]" style={{ gridTemplateColumns: COLS }}>
                  <span className="text-slate-400 tabular-nums">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block leading-snug text-slate-800">{l.name}</span>
                    {l.gift && <span className="mt-0.5 inline-block rounded border border-emerald-200 bg-emerald-50 px-1 py-px text-[8px] font-semibold text-emerald-700">QUÀ TẶNG · GIFT</span>}
                  </span>
                  <span className="leading-tight text-slate-500">{l.unitVi}<span className="block text-[8.5px] italic text-slate-400">{l.unitEn}</span></span>
                  <span className="tabular-nums text-slate-700">{l.qty}</span>
                  <span className="text-right tabular-nums text-slate-700">{pdfNum(l.price)}</span>
                  <span className="text-right tabular-nums text-slate-500">{l.disc}%</span>
                  <span className="text-right font-semibold tabular-nums text-slate-900">{pdfNum(l.gift ? 0 : Math.round(l.qty * l.price * (1 - l.disc / 100)))}</span>
                </div>
              ))}
              {/* totals — right-aligned block, never a grand total across options */}
              <div className="flex justify-end px-3 py-2.5">
                <div className="w-[300px] text-[10px]">
                  <div className="flex items-center justify-between py-1">
                    <Bi vi="Tạm tính" en="Subtotal" className="text-slate-500" />
                    <span className="tabular-nums text-slate-700">{pdfNum(o.sub)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 py-1">
                    <span className="text-slate-500">Thuế GTGT ({VAT_RATE}%)</span>
                    <span className="tabular-nums text-slate-700">{pdfNum(o.vat)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-slate-800 pt-1.5">
                    <Bi vi={`Tổng đơn hàng sau thuế VAT ${VAT_RATE}%`} en={`Total price after VAT ${VAT_RATE}%`} className="text-[9.5px] font-bold text-slate-800" />
                    <span className="shrink-0 pl-2 text-[13px] font-black tabular-nums text-slate-900">{pdfNum(o.total)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[9.5px] leading-relaxed">
                <p className="text-slate-700"><span className="font-semibold">Bằng chữ:</span> {vnWords(o.total)}.</p>
                <p className="italic text-slate-400"><span className="font-semibold not-italic">In words:</span> {enWords(o.total)}.</p>
              </div>
            </div>

            {/* benefits per package */}
            {o.feats.map((f, i) => (
              <div key={i} className="mt-2 rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[9.5px] font-bold text-slate-700">
                  Quyền lợi gói {f.name} trên TopDev.vn
                  <span className="block font-medium italic text-slate-400">Features of {f.name} Package on TopDev.vn</span>
                </p>
                <ol className="mt-1.5 space-y-0.5">
                  {f.items.map((it, j) => (
                    <li key={j} className="flex gap-1.5 text-[9.5px] leading-relaxed text-slate-600">
                      <span className="shrink-0 tabular-nums text-slate-400">{j + 1}.</span>{it}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        ))}

        {/* ── terms & conditions ─────────────────────────────────────── */}
        <section className="mt-6 break-before-page">
          <Bi vi="Điều khoản và điều kiện" en="Terms & Conditions" className="border-b-2 border-slate-800 pb-1 text-[12px] font-bold uppercase tracking-wide text-slate-900" />
          <ol className="mt-2.5 space-y-2.5">
            {QUOTE_TERMS.map((t, i) => (
              <li key={i} className="flex gap-2 text-[9.5px] leading-relaxed">
                <span className="shrink-0 font-bold tabular-nums text-slate-400">{i + 1}.</span>
                <span className="min-w-0">
                  {t.vi.map((p, j) => <span key={j} className={cn('block text-slate-700', j > 0 && 'pl-2')}>{p}</span>)}
                  {t.en.map((p, j) => <span key={j} className={cn('block italic text-slate-400', j > 0 && 'pl-2')}>{p}</span>)}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── signature ──────────────────────────────────────────────── */}
        <div className="mt-8 flex justify-end">
          <div className="w-[260px] text-center">
            <Bi vi={`Đại diện ${ISSUER.brand}`} en={ISSUER.brand} className="text-[10px] font-bold text-slate-800" />
            <p className="mt-0.5 text-[9.5px] text-slate-600">{sd.vi}</p>
            <p className="text-[9.5px] italic text-slate-400">{sd.en}</p>
            <div className="mt-12 border-t border-slate-400 pt-1 text-[9px] text-slate-500">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Viewer chrome around the sheet: zoom, the generated file name, print and
   download. Deliberately NOT an editor — a quotation is composed in the builder;
   this screen only renders it and hands over the file. The rep then sends that
   file themselves and records it with "Mark as sent". */
function QuotationPdfModal({ q, co, onClose }: { q: Quote; co?: Company; onClose: () => void }) {
  const [zoom, setZoom] = useState(0.85)
  const file = `${q.code}.pdf`
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2.5 text-white">
        <span className="text-[13px] font-semibold">Xuất PDF / Export quotation</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px]">{file}</span>
        <span className="hidden text-[11px] text-slate-400 sm:inline">A4 · dọc / portrait · {q.options} option{q.options > 1 ? 's' : ''}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-600">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">−</button>
            <span className="min-w-[46px] px-1 text-center text-[11px] tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">+</button>
          </div>
          <button className="rounded-md border border-slate-600 px-2.5 py-1 text-[12px] font-medium hover:bg-white/10">In / Print</button>
          {/* Download is the primary action now: the rep sends the file themselves,
              through their own mailbox or Zalo, and records that with "Mark as sent". */}
          <button className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-slate-900 hover:opacity-90">Tải PDF</button>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-300 hover:bg-white/10">✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div style={{ width: 794 * zoom, margin: '0 auto' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 794 }}>
            <QuotationPdfDoc q={q} co={co} />
          </div>
        </div>
      </div>
      <p className="border-t border-slate-700 bg-slate-900 px-4 py-2 text-[10.5px] leading-relaxed text-slate-400">
        Nội dung y hệt bản PDF khách đang dùng — chỉ tinh chỉnh trình bày: cặp Việt/Anh xếp chồng thay vì viết liền, bảng có cột và số canh phải, mỗi option là một khối riêng có tổng riêng (các option là <b className="text-slate-200">lựa chọn thay thế</b>, không bao giờ cộng lại).
      </p>
    </div>
  )
}

/* Quotation detail. The list stays scannable, so every exception lives here: the
   approval gate, a lapsed offer, a superseded version, and which option the
   customer actually accepted. Read-only — changes go through Edit, which reopens
   the builder, because a Sent quotation is immutable and revising it makes a v2. */
function QuotationDetail({ q, persona, onBack, onCreatePO, onDuplicate }: { q: Quote; persona?: SalesPersona; onBack: () => void; onCreatePO: (c: Company) => void; onDuplicate?: (companyName: string) => void }) {
  useDetailCrumb(q.code, onBack)
  /* Resolve the quotation's company against the real records. `co` on a quotation
     is written as the legal name, and older rows carry only `customer` — so match
     on any of the names a company is known by. Without this the duplicate dialog
     opens on "— Chọn công ty —" for a quotation that plainly belongs to someone. */
  const co = COMPANIES.find((x) => x.name === q.co)
    ?? COMPANIES.find((x) => x.legalName === q.co || x.name === q.customer || x.legalName === q.customer || x.shortName === q.customer)
  /* Issue PO shows on every SENT quotation — that is the only state where an order
     can follow. It is disabled on a lapsed offer: the discounts and gifts expired
     with the validity date (T&C clause 2), so extend or re-issue as v2 first. */
  const canPO = q.status === 'Sent' && !q.lapsed
  /* A special discount gates SEND. Until it is approved the quotation is a Draft
     that cannot leave the building — which is the whole point of the request. */
  const pending = q.appr === 'pending' && q.special != null
  const rejected = q.appr === 'rejected'
  /** True when the signed-in persona is the one this request routed to. */
  const iAmApprover = !!(pending && persona && apprRole(q.special!) === persona.role
    && (persona.role === 'manager' || teamBookOf(persona.name).has(q.reqBy ?? '')))
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  // One option per product listed, priced off the catalog so the arithmetic is real.
  /* Which option the customer bought is decided HERE, when the PO is raised —
     the quotation itself carries no per-option status. With one option there is
     nothing to ask; with several the rep must pick one, because an order copies
     exactly ONE option forward. */
  const [picking, setPicking] = useState(false)
  /* Duplicate ≠ revise. Revise makes v2 of THIS quotation and supersedes it —
     same deal, same company. Duplicate starts a brand-new quotation, on any
     company, with no link back beyond a "copied from" reference. Using duplicate
     where revise was meant leaves two live quotes on one deal. */
  const [duping, setDuping] = useState(false)
  /* Defaults to THIS quotation's company: re-quoting the same customer after one
     lapsed is the common case, and quoting a different company is the exception the
     rep opts into. Starting empty made every duplicate ask a question that already
     has an answer. */
  const [dupCo, setDupCo] = useState('')
  const [pdf, setPdf] = useState(false)
  /** what the dialog acts on: the rep's pick if they made one, else this company. */
  const dupTarget = dupCo || co?.name || ''
  /* Build ONE card per declared option. Deriving from q.products instead would
     render 2 cards for a quotation that says it has 3 — and the Issue-PO picker
     would then offer fewer choices than the customer was actually given. */
  const opts = Array.from({ length: Math.max(1, q.options) }, (_, i) => {
    const p = q.products[i % q.products.length]
    // Same rule as the printed document: lines drive the total. Quantity is never
    // back-solved from q.value, or the detail and the PDF disagree on the figures.
    const qty = 1
    const sub = qty * QUOTE_CATALOG[p].price
    const vat = Math.round(sub * VAT_RATE / 100)
    return { n: i + 1, p, qty, sub, vat, total: sub + vat }
  })
  return (
    <div>

      {/* ── Special-discount approval ────────────────────────────────────────
          Shown on the QUOTATION, because approving a percentage without the lines,
          the options and the customer in front of you is signing a number blind.
          The same bar serves both sides: the approver gets buttons, everyone else
          gets the status and who it is sitting with. */}
      {q.special != null && q.appr && (
        <div className={cn('mb-4 rounded-xl border px-3.5 py-3',
          q.appr === 'approved' ? 'border-emerald-200 bg-emerald-50'
            : q.appr === 'rejected' ? 'border-rose-200 bg-rose-50'
              : 'border-amber-300 bg-amber-50')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn('text-[12.5px] font-semibold',
                q.appr === 'approved' ? 'text-emerald-900' : q.appr === 'rejected' ? 'text-rose-900' : 'text-amber-900')}>
                {q.appr === 'approved' ? '✓ ' : q.appr === 'rejected' ? '✕ ' : '⏳ '}
                Chiết khấu đặc biệt <b>{q.special}%</b> trên tổng đơn
                {q.appr === 'pending' && <> — chờ <b>{SALES_ROLE_LABEL[apprRole(q.special)]}</b> ({apprPerson(q.special, q.reqBy)}) duyệt</>}
                {q.appr === 'approved' && <> — đã duyệt</>}
                {q.appr === 'rejected' && <> — bị từ chối</>}
              </p>
              <p className={cn('mt-0.5 text-[11px] leading-relaxed',
                q.appr === 'approved' ? 'text-emerald-800' : q.appr === 'rejected' ? 'text-rose-800' : 'text-amber-800')}>
                {q.reqBy} đề nghị lúc {q.reqAt}.
                {q.appr !== 'pending' && q.apprBy && <> {q.apprBy} quyết định lúc {q.apprAt}, ở mức <b>{q.apprPct}%</b>.</>}
                {q.note && <> · “{q.note}”</>}
              </p>
              {q.apprReason && <p className="mt-1 rounded-md bg-white/70 px-2 py-1 text-[11px] leading-relaxed text-rose-900"><b>Lý do từ chối:</b> {q.apprReason}</p>}
              {/* The rule that makes an approval mean something. */}
              {q.appr === 'approved' && <p className="mt-1 text-[10.5px] text-emerald-800">Sửa lại % sẽ hủy phê duyệt này và phải trình lại — nếu vượt {SPECIAL_LEADER_MAX}% thì trình Sales manager.</p>}
            </div>

            {iAmApprover ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button onClick={() => setDecision('reject')} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-700 hover:border-rose-400">Từ chối</button>
                <button onClick={() => setDecision('approve')} className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Duyệt {q.special}%</button>
              </div>
            ) : q.appr === 'pending' ? (
              <span className="shrink-0 text-[11px] text-amber-800">Bạn không phải người duyệt mức này.</span>
            ) : null}
          </div>

          {/* A rejection needs a reason; an approval does not. The rep can only act
              on "no" if they are told what would be a yes. */}
          {decision === 'reject' && (
            <div className="mt-2.5 rounded-lg border border-rose-200 bg-white px-2.5 py-2">
              <label className="mb-1 block text-[11px] font-medium text-rose-900">Lý do từ chối <span className="text-rose-500">*</span></label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Mức nào thì duyệt được? Rep cần biết để chỉnh lại." className="w-full rounded-md border border-line px-2.5 py-1.5 text-[12px] outline-none focus:border-rose-400" />
              <div className="mt-1.5 flex justify-end gap-2">
                <button onClick={() => { setDecision(null); setReason('') }} className="rounded-md border border-line px-2.5 py-1 text-[11.5px] font-medium text-muted hover:border-ink/40">Hủy</button>
                <button disabled={!reason.trim()} className={cn('rounded-md px-3 py-1 text-[11.5px] font-semibold text-white', reason.trim() ? 'bg-rose-600 hover:opacity-90' : 'bg-line')}>Gửi từ chối</button>
              </div>
            </div>
          )}
          {decision === 'approve' && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-white px-2.5 py-2 text-[11.5px] text-emerald-900">
              <span>Duyệt <b>{q.special}%</b> cho {q.customer}. Ghi lại người duyệt, thời điểm và mức đã duyệt — sau đó rep gửi được báo giá.</span>
              <span className="flex shrink-0 gap-2">
                <button onClick={() => setDecision(null)} className="rounded-md border border-line px-2.5 py-1 font-medium text-muted hover:border-ink/40">Hủy</button>
                <button className="rounded-md bg-emerald-600 px-3 py-1 font-semibold text-white hover:opacity-90">Xác nhận duyệt</button>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Báo giá / Quotation</p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            <span className="font-mono">{q.code}</span>
            <Pill tone={QUOTE_TONE[q.status]}>{q.status}</Pill>
          </h2>
          <p className="text-[11.5px] text-muted">{q.customer} · {q.options} options · giá trị {q.value.toLocaleString('en-US')} ₫</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* One action, not two: "preview" and "export" render the SAME document —
              the viewer is where the file is downloaded from, so a rep can never
              send a PDF they have not looked at. */}
          <button onClick={() => setPdf(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Xuất PDF / Export</button>
          {/* Available in EVERY status — the commonest use is re-quoting an expired
              or lost offer, so restricting it to live quotations would remove it
              exactly when it is most wanted. */}
          <button onClick={() => setDuping(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink/40">⧉ Nhân bản / Duplicate</button>
          {/* Sales declares "sent" — reps routinely deliver the PDF by Zalo or from
              their own mail client, so it cannot depend on our mailer firing. */}
          {q.status === 'Draft' && (
            <button
              disabled={pending || rejected}
              title={pending ? 'Chờ duyệt chiết khấu đặc biệt' : rejected ? 'Chiết khấu bị từ chối — chỉnh lại % rồi trình lại' : undefined}
              className={cn('rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white', pending || rejected ? 'cursor-not-allowed bg-line' : 'bg-brand hover:opacity-90')}
            >
              Mark as sent
            </button>
          )}
          {q.status === 'Sent' && (
            <button
              onClick={() => { if (!canPO || !co) return; if (opts.length > 1) setPicking(true); else onCreatePO(co) }}
              disabled={!canPO}
              title={canPO ? (opts.length > 1 ? 'Chọn option khách đã chốt, rồi tạo PO' : 'Raise the sales order from this option') : `Offer lapsed ${q.expires} — extend validity or re-issue as v2 first`}
              className={cn('rounded-lg px-3 py-1.5 text-[12px] font-semibold', canPO ? 'bg-brand text-white hover:opacity-90' : 'border border-line bg-canvas text-faint')}
            >
              Issue PO →
            </button>
          )}
        </div>
      </div>

      {q.lapsed && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-900">
          Offer lapsed — validity ended {q.expires}. Extend validity or re-issue as v2 before an order can be raised.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-5">
        <InfoBit label="Ngày báo giá / Created" value={q.created} />
        <InfoBit label="Ngày hết hạn / Expires" value={q.expires} hint={q.lapsed ? 'lapsed' : q.expires === '—' ? 'not sent yet' : undefined} />
        <InfoBit label="Báo giá bởi / Proposed by" value={co?.owner ?? 'Nguyễn Thị Lan'} />
        <InfoBit label="Số option" value={String(q.options)} hint="alternatives, never summed" />
        {/* ONE option's total-after-VAT, never a sum: the accepted option once the
            customer decides, else the HIGHEST option. Deliberately not the
            "recommended" one — that swap is still an open question in the spec. */}
        <InfoBit label="Giá trị / Value" value={`${q.value.toLocaleString('en-US')} ₫`} hint={q.acceptedOpt ? 'accepted option' : 'highest option'} />
      </div>

      {co && <div className="mb-4"><QuoteCompanyCard c={co} /></div>}

      <p className="mb-2 text-[12.5px] font-semibold">Options</p>
      <div className="space-y-2">
        {opts.map((o) => (
          <div key={o.n} className="rounded-xl border border-line p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold">Option {o.n} <span className="font-normal text-muted">{QUOTE_CATALOG[o.p].vi}</span></p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-line">
              <div className="grid min-w-[520px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
                <span>#</span><span>Dịch vụ</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Tổng giá</span>
              </div>
              <div className="grid min-w-[520px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
                <span className="text-faint">1</span><span className="truncate">{QUOTE_CATALOG[o.p].vi}</span>
                <span className="text-[11px] text-muted">{QUOTE_CATALOG[o.p].unitVi}</span>
                <span className="tabular-nums">{o.qty}</span>
                <span className="text-right tabular-nums">{QUOTE_CATALOG[o.p].price.toLocaleString('en-US')}</span>
                <span className="text-right tabular-nums">{o.sub.toLocaleString('en-US')}</span>
              </div>
            </div>
            <div className="mt-2 ml-auto w-full max-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
              <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{o.sub.toLocaleString('en-US')} ₫</span></div>
              <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{o.vat.toLocaleString('en-US')} ₫</span></div>
              <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{o.total.toLocaleString('en-US')} ₫</span></div>
              <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(o.total)}.</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">Options are alternatives — no grand total exists, and reporting never sums them.</p>

      {duping && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <p className="text-[15px] font-bold">Nhân bản báo giá</p>
                <p className="text-[11px] text-muted">Tạo một báo giá MỚI từ {q.code} — số mới, ngày mới, trạng thái Nháp.</p>
              </div>
              <button onClick={() => setDuping(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>

            <div className="space-y-3.5 p-5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Báo giá cho công ty<span className="text-rose-500"> *</span></label>
                <select value={dupTarget} onChange={(e) => setDupCo(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {!co && <option value="">— Chọn công ty —</option>}
                  {COMPANIES.map((c) => <option key={c.name} value={c.name}>{coLabel(c)} · {coId(c)}</option>)}
                </select>
                <p className="mt-1 text-[10.5px] text-faint">
                  {!dupTarget
                    ? 'Chọn công ty sẽ nhận bản báo giá mới.'
                    : dupTarget === co?.name
                      ? 'Giữ nguyên công ty của báo giá này — dùng khi báo lại sau khi bản cũ hết hạn hoặc bị từ chối. Đổi ở trên nếu muốn chào cho khách khác.'
                      : 'Khác công ty — dùng khi chào cùng gói cho khách khác. Thông tin xuất hóa đơn sẽ lấy theo công ty mới.'}
                </p>
              </div>

              <div className="rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
                <b className="text-ink/70">Không sao chép:</b> số báo giá, ngày báo giá, ngày hết hạn, trạng thái gửi, option khách đã chốt,
                và liên kết tới PO. Bản sao luôn bắt đầu ở <b className="text-ink/70">Nháp</b> với hạn <b className="text-ink/70">cuối tháng tạo</b>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              <button onClick={() => setDuping(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Hủy</button>
              <button
                disabled={!dupTarget}
                onClick={() => { setDuping(false); onDuplicate?.(dupTarget) }}
                className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', dupTarget ? 'bg-brand hover:opacity-90' : 'bg-line')}
              >
                Tạo bản sao →
              </button>
            </div>
          </div>
        </div>
      )}

      {picking && co && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[620px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <p className="text-[15px] font-bold">Khách đã chốt option nào?</p>
                <p className="text-[11px] text-muted">Một PO chỉ lấy được MỘT option. Các option còn lại không trở thành đơn hàng.</p>
              </div>
              <button onClick={() => setPicking(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>
            <div className="space-y-2 p-5">
              {opts.map((o) => (
                <button
                  key={o.n}
                  onClick={() => { setPicking(false); onCreatePO(co) }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:border-brand hover:bg-brand-soft/40"
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">Option {o.n}</span>
                    <span className="block truncate text-[11.5px] text-muted">{QUOTE_CATALOG[o.p].vi} · {o.qty} {QUOTE_CATALOG[o.p].unitVi}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[12.5px] font-semibold tabular-nums text-ink">{o.total.toLocaleString('en-US')} ₫</span>
                    <span className="block text-[10.5px] text-faint">đã gồm VAT {VAT_RATE}%</span>
                  </span>
                </button>
              ))}
              <p className="text-[10.5px] leading-relaxed text-faint">
                Option được chọn sẽ được sao nguyên sang PO — dòng hàng, số lượng, đơn giá, VAT và thông tin xuất hóa đơn.
                Không nhập lại gì.
              </p>
            </div>
          </div>
        </div>
      )}

      {pdf && <QuotationPdfModal q={q} co={co} onClose={() => setPdf(false)} />}
    </div>
  )
}

function AdminQuotes() {
  /* PO creation lives HERE, not on the company detail page: an order can only come
     from an ACCEPTED quotation option, so the accepted row is the only place the
     action is ever valid. Company detail carries "Create quotation" instead. */
  const [poFor, setPoFor] = useState<Company | null>(null)
  const [open, setOpen] = useState<Quote | null>(null)
  /* Duplicating hands the copy straight to the builder, pre-filled with the target
     company — the rep lands on an editable draft rather than a confirmation. */
  const [dupFor, setDupFor] = useState<string | null>(null)
  const [fStatus, setFStatus] = useState('')
  const [qSort, setQSort] = useState<QuoteSort>('expires')
  /* Approval happens HERE, not on a screen of its own. An approver has to see the
     lines, the options and the customer before signing off on a percentage, and
     all of that already lives on the quotation — a separate "Approvals" page
     would be a second, thinner copy of this list plus a link back to it.
     What the approver needs is a way to FIND their requests, which is a filter.

     Same persona switcher as the Companies list, so "who am I" is answered once
     and the same way everywhere. */
  const [persona, setPersona] = useState<SalesPersona>(SALES_PERSONAS[1])
  const [queue, setQueue] = useState(false)
  /** Requests routed to THIS persona: matched on the role the rate escalates to. */
  const mine = (q: Quote) =>
    q.appr === 'pending' && q.special != null && apprRole(q.special) === persona.role &&
    (persona.role === 'manager' || teamBookOf(persona.name).has(q.reqBy ?? ''))
  const inbox = QUOTES.filter(mine)
  const goTo = useContext(ScreenNavCtx)
  /* Arrived via a cross-page link (e.g. from a PO row): open that quotation. Falls
     back to a stub so a PO can always link to its source even if the quotation is
     not one of the demo rows. */
  const handed = useContext(OpenRecordCtx)
  const linked = handed
    ? QUOTES.find((x) => x.code === handed) ?? {
        code: handed, customer: POS.find((p) => p.quote === handed)?.customer ?? '—', products: [1], options: 2,
        value: POS.find((p) => p.quote === handed)?.total ?? 0, status: 'Issued to PO' as QuoteStatus,
        created: '—', expires: '—',
      }
    : null
  const showing = open ?? linked
  if (showing) return (
    <>
      <QuotationDetail q={showing} persona={persona} onBack={() => { setOpen(null); if (handed) goTo('admin-quotes') }} onCreatePO={setPoFor} onDuplicate={setDupFor} />
      {dupFor && <NewQuotationModal company={dupFor} onClose={() => setDupFor(null)} />}
      {poFor && <CreatePOModal c={poFor} onClose={() => setPoFor(null)} />}
    </>
  )

  /* Status left the tab strip and moved into Filter, so this list carries the same
     Search · Filter · Sort toolbar as Companies. Tabs made status the ONE dimension
     worth narrowing by and spent a whole row saying so. */
  const shown = QUOTES
    .filter((q) => (queue ? mine(q) : true))
    .filter((q) => !fStatus || q.status === fStatus)
    .slice()
    .sort(QUOTE_SORTS[qSort].cmp)
  const rows = shown.map((q) => {
    return [
      <button onClick={() => setOpen(q)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{q.code}</button>,
      <span className="truncate">{q.customer}</span>,
      <ProductCell ids={q.products} />,
      <span className="tabular-nums text-muted">{q.options}</span>,
      <span className="tabular-nums">{q.value.toLocaleString('en-US')} ₫</span>,
      /* Status AND the approval flag, because a pending request is not a status —
         the quotation is still a Draft, it simply cannot be sent yet. */
      <span className="flex min-w-0 flex-wrap items-center gap-1">
        <Pill tone={QUOTE_TONE[q.status]}>{q.status}</Pill>
        {q.appr === 'pending' && q.special != null && (
          <Pill tone="schedule">⏳ {q.special}% · chờ {SALES_ROLE_LABEL[apprRole(q.special)]}</Pill>
        )}
        {q.appr === 'approved' && q.special != null && <Pill tone="active">✓ {q.special}% đã duyệt</Pill>}
        {q.appr === 'rejected' && <Pill tone="rejected">✕ từ chối</Pill>}
      </span>,
      <span className="tabular-nums text-muted">{q.created}</span>,
      <span className="tabular-nums text-muted">{q.expires}</span>,
    ]
  })

  return (
    <div>
      {/* Create action lives on the page title row (see PRIMARY_ACTION in AdminWireframe). */}
      <ListPage
        total={shown.length}
        searchHint="Tìm số báo giá, khách hàng…"
        leading={
          <span className="flex flex-wrap items-center gap-2">
            {/* Same control as the Companies list — one answer to "who am I". */}
            <label className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
              <span className="text-faint">Đang xem với tư cách</span>
              <select
                value={persona.name}
                onChange={(e) => { setPersona(SALES_PERSONAS.find((x) => x.name === e.target.value)!); setQueue(false) }}
                className="max-w-[210px] cursor-pointer bg-transparent text-[11.5px] font-medium text-ink outline-none"
              >
                {SALES_PERSONAS.map((x) => <option key={x.name} value={x.name}>{x.name} — {SALES_ROLE_LABEL[x.role]}</option>)}
              </select>
            </label>
            {/* Only a lead or a manager can have an inbox, so the control is absent
                for a plain rep rather than present and permanently empty. */}
            {persona.role !== 'rep' && (
              <button
                onClick={() => setQueue((v) => !v)}
                className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                  queue ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-line bg-surface text-muted hover:border-ink/30')}
              >
                ⏳ Chờ tôi duyệt
                <span className={cn('rounded-full px-1.5 text-[10px] font-semibold', queue ? 'bg-amber-600 text-white' : inbox.length ? 'bg-amber-100 text-amber-800' : 'bg-canvas text-faint')}>{inbox.length}</span>
              </button>
            )}
          </span>
        }
        filters={
          <FilterBar count={fStatus ? 1 : 0} onClear={() => setFStatus('')}>
            <FilterRow label="Status" value={fStatus} onChange={setFStatus} options={['Draft', 'Sent', 'Issued to PO', 'Expired']} />
          </FilterBar>
        }
        sort={
          <label className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
            <span className="text-faint">Sắp xếp</span>
            <select
              value={qSort}
              onChange={(e) => setQSort(e.target.value as QuoteSort)}
              className="max-w-[170px] cursor-pointer bg-transparent text-[11.5px] font-medium text-ink outline-none"
            >
              {(Object.keys(QUOTE_SORTS) as QuoteSort[]).map((k) => <option key={k} value={k}>{QUOTE_SORTS[k].label}</option>)}
            </select>
          </label>
        }
        cols={[
          { label: 'Quotation', w: '1.4fr' }, { label: 'Customer', w: '1.3fr' }, { label: 'Products', w: '1.2fr' },
          { label: 'Options', w: '0.6fr' }, { label: 'Value', w: '1.1fr', align: 'r' }, { label: 'Status', w: '2.3fr' },
          { label: 'Created', w: '0.8fr' }, { label: 'Expires', w: '0.8fr' },
        ]}
        rows={rows}
        minW={1000}
      />
      {poFor && <CreatePOModal c={poFor} onClose={() => setPoFor(null)} />}
    </div>
  )
}
/* ── VAT e-invoice as PDF ──────────────────────────────────────────────────────
   The provider's own template (easyinvoice), reproduced because Kế toán and the
   customer both work from this exact sheet. It renders in TWO forms off one
   component, and the differences are the whole point:

     NHÁP (draft)   Số : <Chưa cấp số>. No seller signature block, no tax-authority
                    code, no lookup URL. It is a working proof, not a document — it
                    grants nothing and is filed nowhere.
     CHÍNH (issued) Số : 175 — allocated by the provider, sequential and gapless.
                    Carries the digital signature block, the "Mã của cơ quan thuế"
                    and the lookup page. THIS is the fiscal document.

   Which buyer lines print depends on the company's BuyerType: a company shows Tên
   đơn vị + Mã số thuế; an individual shows Họ tên người mua hàng + Căn cước công
   dân; a foreign company shows the name and address with the tax line blank. */
/* ── Bilingual labels on a VAT invoice ────────────────────────────────────────
   Nghị định 123/2020 điều 10 khoản 13: the writing on an invoice is VIETNAMESE.
   Foreign text is allowed, but only as an ADDITION — placed in parentheses to the
   right of the Vietnamese, or on the line directly below it, and in a SMALLER
   font. It may never replace the Vietnamese or be printed at equal size.

   So the "Tên đơn vị / Legal name" slash format the quotation and the PO use is
   fine on those documents and NOT fine here. Everything on this sheet goes
   through InvLabel / InvHead, which enforce the shape: Vietnamese first, English parenthesised
   and one step smaller. */
function InvLabel({ vi, en }: { vi: string; en: string }) {
  return (
    <>
      {vi} <span className="text-[8px] font-normal italic text-slate-500">({en})</span>
    </>
  )
}
/** Same rule inside a table header, where the English goes BELOW rather than beside
    — the decree allows either placement. */
function InvHead({ vi, en }: { vi: string; en: string }) {
  return (
    <>
      {vi}
      <span className="block text-[7px] font-normal italic text-slate-500">({en})</span>
    </>
  )
}

function InvoicePdfDoc({ inv, co }: { inv: Inv; co?: Company }) {
  const pack = QUOTE_CATALOG[inv.product]
  const sub = Math.round(inv.total / (1 + VAT_RATE / 100))
  const vat = inv.total - sub
  const unit = Math.round(sub / inv.qty)
  const official = inv.step === 'issued'
  const bt = BUYER_TYPE[co?.buyerType ?? 'dn-vn']
  // The provider allocates the number only when the invoice is made official.
  const serial = inv.code.split('-')[0]
  const no = official ? inv.code.split('-')[1] : null
  const d = (official && inv.issued !== '—' ? inv.issued : '11/08/2026').split('/')
  const COLS = '34px minmax(0,2.3fr) 52px 56px 82px 92px 40px 78px 92px'
  const Cell = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <span className={cn('border-r border-slate-300 px-1.5 py-1 text-[9px] leading-snug last:border-r-0', className)}>{children}</span>
  )

  return (
    <div className="mx-auto bg-white text-slate-900 shadow-xl" style={{ width: 794 }}>
      <div className="px-[44px] py-[36px]">
        {/* seller — the issuer block is fixed, from System → Company information */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 pt-1"><SaraminMark width={92} /></div>
          <div className="min-w-0 text-[9.5px] leading-relaxed">
            <p><span className="text-slate-500"><InvLabel vi="Đơn vị bán hàng" en="Seller" /> : </span><b>{ISSUER.nameVi}</b></p>
            <p><span className="text-slate-500"><InvLabel vi="Mã số thuế" en="Tax code" />: </span><b>0315421202</b></p>
            <p><span className="text-slate-500"><InvLabel vi="Địa chỉ" en="Address" /> : </span>{ISSUER.addrVi}</p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-4 border-t border-slate-300 pt-3">
          {/* the QR only exists once the provider has signed and filed it */}
          <div className="shrink-0">
            {official
              ? <div className="grid h-[88px] w-[88px] place-items-center border border-slate-800 text-[8px] text-slate-400">QR</div>
              : <div className="grid h-[88px] w-[88px] place-items-center border border-dashed border-slate-300 text-center text-[8px] leading-tight text-slate-300">chưa có<br />QR</div>}
          </div>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[17px] font-bold uppercase tracking-wide text-red-600">Hóa đơn giá trị gia tăng</p>
            <p className="text-[10px] font-semibold italic text-red-600">(VAT INVOICE)</p>
            {!official && (
              <p className="mx-auto mt-1 inline-block bg-yellow-100 px-2 py-0.5 text-[13px] font-bold text-red-600">
                HÓA ĐƠN NHÁP — chưa có giá trị pháp lý
              </p>
            )}
            <p className="mt-1 text-[9.5px]">
              Ngày <b className="px-1">{d[0]}</b> tháng <b className="px-1">{d[1]}</b> năm <b className="px-1">{d[2]}</b>
            </p>
          </div>
          <div className="w-[150px] shrink-0 text-[9.5px] leading-relaxed">
            <p><span className="text-slate-500">Ký hiệu: </span><b>{serial}</b></p>
            <p className="mt-0.5">
              <span className="text-slate-500">Số : </span>
              {official
                ? <b className="rounded border border-red-300 px-2 py-0.5 text-red-600">{no}</b>
                : <b className="text-red-600">&lt;Chưa cấp số&gt;</b>}
            </p>
          </div>
        </div>

        {/* buyer — WHICH lines carry a value depends on the buyer type */}
        <dl className="mt-3 space-y-[3px] text-[9.5px] leading-relaxed">
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Họ tên người mua hàng" en="Buyer name" /> :</dt>
            {/* A named person when we have one; the fixed consumer-sale phrase when
                the buyer is an individual with no CCCD; blank for a company, where
                the name belongs on Tên đơn vị instead. */}
            <dd className="min-w-0 flex-1 font-bold">
              {bt.needsBuyerName ? (co?.buyerName ?? '') : (co?.buyerType ?? 'dn-vn') === 'ca-nhan' ? RETAIL_BUYER : ''}
            </dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Tên đơn vị" en="Company name" /> :</dt>
            <dd className="min-w-0 flex-1 font-bold uppercase">{co?.legalName ?? inv.customer}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Mã số thuế" en="Tax code" /> :</dt>
            <dd className="min-w-0 flex-1 font-bold tabular-nums">{bt.tax === 'req' ? (co?.tax ?? '') : ''}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Căn cước công dân" en="Citizen ID" /> :</dt>
            <dd className={cn('min-w-0 flex-1 tabular-nums', bt.needsIdCard && 'font-bold')}>{bt.needsIdCard ? (co?.idCard ?? '') : ''}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Địa chỉ" en="Address" /> :</dt>
            {/* Blank for a buyer who provided nothing — the decree's "Bán cho người
                tiêu dùng" case carries no name, address or ID at all. */}
            <dd className="min-w-0 flex-1 font-bold">{bt.noAddress ? '' : (co?.address ?? '')}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Hình thức thanh toán" en="Payment method" /> :</dt>
            <dd className="min-w-0 flex-1 font-bold">Chuyển khoản</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Đơn vị tiền tệ" en="Currency" /> :</dt>
            <dd className="min-w-0 flex-1 font-bold">VND</dd>
          </div>
        </dl>

        {/* line table — the provider's numbered column headers */}
        <div className="mt-3 border border-slate-400">
          <div className="grid border-b border-slate-400 bg-white text-center text-[9px] font-semibold" style={{ gridTemplateColumns: COLS }}>
            <Cell><InvHead vi="STT" en="No." /></Cell>
            <Cell><InvHead vi="Tên hàng hóa, dịch vụ" en="Description" /></Cell>
            <Cell><InvHead vi="Đơn vị tính" en="Unit" /></Cell>
            <Cell><InvHead vi="Số lượng" en="Quantity" /></Cell>
            <Cell><InvHead vi="Đơn giá" en="Unit price" /></Cell>
            <Cell><InvHead vi="Thành tiền trước thuế" en="Amount before VAT" /></Cell>
            <Cell><InvHead vi="Thuế suất" en="VAT rate" /></Cell>
            <Cell><InvHead vi="Tiền thuế" en="VAT amount" /></Cell>
            <Cell><InvHead vi="Tổng tiền thanh toán" en="Total payable" /></Cell>
          </div>
          <div className="grid border-b border-slate-300 text-center text-[8px] text-slate-500" style={{ gridTemplateColumns: COLS }}>
            <Cell>1</Cell><Cell>2</Cell><Cell>3</Cell><Cell>4</Cell><Cell>5</Cell><Cell>6=4x5</Cell><Cell>7</Cell><Cell>8</Cell><Cell>9=6+8</Cell>
          </div>
          <div className="grid min-h-[96px] border-b border-slate-400" style={{ gridTemplateColumns: COLS }}>
            <Cell className="text-center">1</Cell>
            <Cell className="text-left">{pack.vi}</Cell>
            <Cell className="text-center">{pack.unitVi}</Cell>
            <Cell className="text-center tabular-nums">{inv.qty}</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(unit)}</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(sub)}</Cell>
            <Cell className="text-center tabular-nums">{VAT_RATE}%</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(vat)}</Cell>
            <Cell className="text-right font-semibold tabular-nums">{pdfNum(inv.total)}</Cell>
          </div>
          {/* the provider's VAT-rate summary block, every band listed */}
          <div className="grid border-b border-slate-400 bg-white text-[9px] font-semibold" style={{ gridTemplateColumns: 'minmax(0,2fr) 56px 1fr 1fr 1.2fr' }}>
            <Cell><InvHead vi="Tổng hợp" en="Summary" /></Cell>
            <Cell className="text-center"><InvHead vi="Thuế suất" en="VAT rate" /></Cell>
            <Cell className="text-center"><InvHead vi="Tổng tiền trước thuế" en="Total before VAT" /></Cell>
            <Cell className="text-center"><InvHead vi="Tổng tiền thuế" en="Total VAT" /></Cell>
            <Cell className="text-center"><InvHead vi="Tổng tiền thanh toán" en="Total payable" /></Cell>
          </div>
          {([
            ['Tổng tiền không chịu thuế:', 'KCT', false],
            ['Tổng tiền chịu thuế suất:', '0%', false],
            ['Tổng tiền chịu thuế suất:', '5%', false],
            ['Tổng tiền chịu thuế suất:', `${VAT_RATE}%`, true],
            ['Tổng tiền chịu thuế suất:', '10%', false],
            ['Tổng tiền không tính thuế:', 'KKKNT', false],
            ['Tổng tiền chịu thuế suất:', 'KHAC', false],
          ] as const).map(([label, band, on], i) => (
            <div key={i} className="grid border-b border-slate-300 text-[9px]" style={{ gridTemplateColumns: 'minmax(0,2fr) 56px 1fr 1fr 1.2fr' }}>
              <Cell>{label}</Cell>
              <Cell className="text-center">{band}</Cell>
              <Cell className={cn('text-right tabular-nums', on && 'font-bold')}>{on ? pdfNum(sub) : ''}</Cell>
              <Cell className={cn('text-right tabular-nums', on && 'font-bold')}>{on ? pdfNum(vat) : ''}</Cell>
              <Cell className={cn('text-right tabular-nums', on && 'font-bold')}>{on ? pdfNum(inv.total) : ''}</Cell>
            </div>
          ))}
          <div className="grid border-b border-slate-400 text-[9px] font-bold" style={{ gridTemplateColumns: 'minmax(0,2fr) 56px 1fr 1fr 1.2fr' }}>
            <Cell>Tổng cộng :</Cell><Cell />
            <Cell className="text-right tabular-nums">{pdfNum(sub)}</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(vat)}</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(inv.total)}</Cell>
          </div>
          <div className="px-1.5 py-1 text-[9px]">
            <span className="text-slate-600"><InvLabel vi="Số tiền viết bằng chữ" en="Amount in words" /> : </span><b>{vnWords(inv.total)}</b>
          </div>
        </div>

        {/* signature row — the seller block only exists on an official invoice */}
        <div className="mt-4 grid grid-cols-2 gap-6 text-center text-[9.5px]">
          <div>
            <p className="font-bold">Người mua hàng</p>
            <div className="h-[64px]" />
          </div>
          <div>
            <p className="font-bold">Người bán hàng</p>
            {official ? (
              <div className="mt-1.5 inline-block rounded border border-red-300 px-3 py-1.5 text-left text-[8.5px] leading-snug">
                <p className="font-semibold text-slate-700">Signature Valid</p>
                <p className="mt-0.5 text-red-600">✅ bởi: {ISSUER.nameVi}</p>
                <p className="text-red-600">Ký ngày: {inv.issued !== '—' ? inv.issued.replace(/\//g, '-') : '—'}</p>
              </div>
            ) : (
              <div className="mt-1.5 inline-block rounded border border-dashed border-slate-300 px-3 py-3 text-[8.5px] text-slate-400">chưa ký số</div>
            )}
          </div>
        </div>

        {/* the tax-authority code and lookup page exist only once it is filed */}
        {official ? (
          <div className="mt-3 border-t border-slate-300 pt-2 text-[8.5px] leading-relaxed">
            <p><span className="text-slate-600">Mã của cơ quan thuế: </span><b className="font-mono">0035FDFC78864F4C08BA320C8F8A9D9EE6</b></p>
            <p>
              <span className="text-slate-600">Trang tra cứu: </span>
              <span className="text-sky-700 underline">http://0315421202hd.easyinvoice.com.vn</span>
              <span className="text-slate-600"> · Mã tra cứu: </span><b className="font-mono">RO2NN7MLS</b>
            </p>
            <p className="text-slate-400">(Cần kiểm tra, đối chiếu khi lập, giao, nhận hóa đơn)</p>
          </div>
        ) : (
          <p className="mt-3 border-t border-dashed border-slate-300 pt-2 text-[8.5px] leading-relaxed text-slate-400">
            Bản nháp: chưa có số hóa đơn, chưa ký số, chưa có mã của cơ quan thuế và chưa có trang tra cứu. Chỉ dùng để khách đối chiếu thông tin trước khi xuất chính thức.
          </p>
        )}
      </div>
    </div>
  )
}

function InvoicePdfModal({ inv, co, onClose }: { inv: Inv; co?: Company; onClose: () => void }) {
  const [zoom, setZoom] = useState(0.9)
  const official = inv.step === 'issued'
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2.5 text-white">
        <span className="text-[13px] font-semibold">{official ? 'Hóa đơn chính / Official invoice' : 'Hóa đơn nháp / Draft invoice'}</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px]">{inv.code}.pdf</span>
        {!official && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10.5px] font-medium text-amber-300">chưa cấp số · chưa ký số</span>}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-600">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">−</button>
            <span className="min-w-[46px] px-1 text-center text-[11px] tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">+</button>
          </div>
          <button className="rounded-md border border-slate-600 px-2.5 py-1 text-[12px] font-medium hover:bg-white/10">🖨 In / Print</button>
          <button className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-slate-900 hover:opacity-90">⬇ Tải PDF</button>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-300 hover:bg-white/10">✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div style={{ width: 794 * zoom, margin: '0 auto' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 794 }}>
            <InvoicePdfDoc inv={inv} co={co} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoiceDetail({ inv, onBack }: { inv: Inv; onBack: () => void }) {
  useDetailCrumb(inv.code, onBack)
  const [pdf, setPdf] = useState(false)
  /* Confirming payment is ONE write, against the PO. The invoice and the PO both
     read that fact, so the PO's payment column follows by construction rather than
     by a second update that could fail on its own. Local state here only because
     the mock has no store. */
  const [paidNow, setPaidNow] = useState<string | null>(null)
  const pay = invPay(inv)
  const payNow = payStatus(paidNow ?? pay.paidAt, pay.poIssued)
  /* `customer` on an invoice may be the record name, the legal name or the display
     name depending on which row wrote it — match on all of them, or the buyer block
     silently prints as a company when it should print as an individual. */
  const invCo = COMPANIES.find((x) => x.name === inv.co)
    ?? COMPANIES.find((x) => x.name === inv.customer || x.legalName === inv.customer || coLabel(x) === inv.customer)
  const pack = QUOTE_CATALOG[inv.product]
  const sub = Math.round(inv.total / (1 + VAT_RATE / 100))
  const vat = inv.total - sub
  const unit = Math.round(sub / inv.qty)
  const st = invStage(inv)
  return (
    <div>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            {inv.step === 'issued'
              ? 'Hóa đơn GTGT / VAT e-invoice'
              : inv.step === 'archived'
                ? 'Hóa đơn nháp / Draft — lưu trữ, PO đã hết hạn'
                : 'Hóa đơn nháp / Draft — chưa có giá trị pháp lý, chưa cấp quota'}
          </p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            <span className="font-mono">{inv.code}</span>
            <Pill tone={st.tone}>{st.en}</Pill>
            {/* The second, independent axis. An issued invoice can still be unpaid,
                and an unpaid one can still be overdue — none of which is a document
                status, so it gets its own badge instead of changing that one. */}
            <PayCell paidAt={paidNow ?? pay.paidAt} poIssued={pay.poIssued} />
          </h2>
          <p className="text-[11.5px] text-muted">{st.vi} · {inv.customer}</p>
        </div>
        {/* Read left to right: the action, then the documents. Every invoice has a
            draft behind it, and an issued one has TWO documents worth opening —
            checking the filed sheet against the draft it came from is a real task,
            so each gets its own button rather than one button that changes meaning.
            The official one sits furthest right: it is the one that counts.
            Printing and downloading live inside the viewer, so neither of these is
            a second download button. */}
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          {/* A DRAFT carries a Sales action only. Kế toán opening this screen gets
              told why there is nothing for them to do, rather than looking for a
              button that was never rendered — "the request has not been made yet"
              is a different problem from "I lack the permission". */}
          {inv.step === 'draft' && (
            <>
              <span className="text-[11px] text-muted">Kế toán chỉ xuất được hóa đơn chính khi Sales đã <b className="text-ink/75">yêu cầu</b>.</span>
              <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Yêu cầu xuất hóa đơn chính</button>
            </>
          )}
          {inv.step === 'requested' && (
            <button className="rounded-lg bg-amber-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Xuất hóa đơn chính<span className="ml-1 font-normal opacity-90">· Kế toán</span></button>
          )}
          {/* KẾ TOÁN ONLY, and only while the money is outstanding — Unpaid or
              Overdue. It is independent of the document status: an invoice can be
              issued and unpaid, or still a draft and already paid. */}
          {payNow !== 'Paid' && (
            <button
              onClick={() => setPaidNow(dateBefore(0))}
              title={`Xác nhận đã nhận tiền. Ghi vào PO ${inv.po} — cột Thanh toán của PO cập nhật theo. Chỉ Kế toán.`}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
            >
              Confirm payment<span className="ml-1 font-normal opacity-90">· Kế toán</span>
            </button>
          )}
          {paidNow && (
            <span className="text-[11px] text-emerald-700">✓ Đã ghi vào <b className="font-mono">{inv.po}</b></span>
          )}
          {/* No draft viewer here. A draft is produced and read on its PO — this
              screen is for the document that was filed. Two buttons that opened the
              same modal only made a reader ask which one they were looking at. */}
          <button
            onClick={() => setPdf(true)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:border-brand hover:text-brand"
          >
            {inv.step === 'issued' ? 'Xem hóa đơn chính' : 'Xem hóa đơn'}
          </button>
        </div>
      </div>

      {/* No status banner and no explanatory notes on the record. The eyebrow, the
          pill beside the number and the button row already say what this document
          is and what may be done to it; a stack of coloured boxes repeating it was
          pushing the invoice itself below the fold. The rules live in the
          requirement, not on every record. */}

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-5">
        <InfoBit label="Số hóa đơn" value={inv.code} mono hint={inv.step === 'issued' ? 'do nhà cung cấp cấp' : 'chưa có giá trị pháp lý'} />
        <InfoBit label="Ngày xuất chính / Issued" value={inv.issued} hint={inv.step === 'issued' ? 'một SỰ KIỆN, không phải kế hoạch' : inv.step === 'archived' ? 'không bao giờ xuất chính' : 'chưa xuất chính'} />
        <InfoBit label="Kích hoạt trước / Activate by" value={inv.activateBy} hint="ngày xuất chính + 12 tháng" />
        <InfoBit label="Từ PO" value={inv.po} mono />
        <InfoBit label="Thanh toán đã xác nhận" value={inv.payment ?? '—'} mono hint={inv.payment ? `bởi ${inv.issuer}` : 'chưa có'} />
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="text-[11.5px] leading-relaxed">
            <p className="text-muted">Đơn vị bán hàng:</p>
            <p className="font-bold text-ink">DAOUKIWOOM INNOVATION COMPANY LIMITED</p>
            <p className="text-ink/80">Level 12, 13 &amp; 14, AP Tower, 518B Dien Bien Phu, Thanh My Tay Ward, HCMC</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">0315421202</span></p>
          </div>
          <div className="text-right text-[11.5px] leading-relaxed">
            <p className="text-muted">Đơn vị mua hàng:</p>
            <p className="font-bold text-brand">{inv.customer}</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">{COMPANIES.find((c) => c.name === inv.co)?.tax ?? '0318705749'}</span></p>
            <p className="mt-1 text-[10.5px] text-faint">Khớp chính xác với thông tin trên báo giá — lệch là phải hủy &amp; xuất lại</p>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-line">
          <div className="grid min-w-[620px] gap-x-3 bg-ink px-3 py-2 text-[11px] font-semibold text-white" style={{ gridTemplateColumns: '28px 2.6fr 0.7fr 0.6fr 1fr 1fr' }}>
            <span>#</span><span>Tên hàng hóa, dịch vụ</span><span className="text-right">ĐVT</span><span className="text-right">SL</span><span className="text-right">Đơn giá</span><span className="text-right">Thành tiền</span>
          </div>
          <div className="grid min-w-[620px] gap-x-3 border-t border-line px-3 py-2 text-[12px]" style={{ gridTemplateColumns: '28px 2.6fr 0.7fr 0.6fr 1fr 1fr' }}>
            <span className="text-faint">1</span><span className="truncate">{pack.vi}</span>
            <span className="text-right text-[11px] text-muted">{pack.unitVi}</span>
            <span className="text-right tabular-nums">{inv.qty}</span>
            <span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span>
            <span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
          </div>
        </div>

        <div className="mt-3 ml-auto w-full max-w-[320px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
          <div className="flex justify-between"><span className="text-muted">Cộng tiền hàng</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
          <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng tiền thanh toán</span><span className="tabular-nums">{inv.total.toLocaleString('en-US')} ₫</span></div>
          <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Số tiền viết bằng chữ: {vnWords(inv.total)}.</p>
        </div>
      </div>

      {pdf && <InvoicePdfModal inv={inv} co={invCo} onClose={() => setPdf(false)} />}
    </div>
  )
}

function AdminInvoices() {
  const [open, setOpen] = useState<Inv | null>(null)
  if (open) return <InvoiceDetail inv={open} onBack={() => setOpen(null)} />
  /* Archived rows are withdrawn from the default list. A draft whose PO expired
     never had legal force and granted nothing, so it is not an invoice to
     reconcile — but it stays reachable through the Archived tab and from its PO,
     because "what happened to that draft?" is a real month-end question. */
  const rows = INVOICES.filter((i) => i.step !== 'archived')
  return (
    <div>
    <ListPage
      tabs={[{ label: 'All', count: 210, active: true }, { label: 'Draft', count: 5 }, { label: 'Invoice requested', count: 3 }, { label: 'Invoice issued' }, { label: 'Archived', count: 4 }, { label: 'Activation expiring', count: 6 }]}
      cols={[{ label: 'Invoice no.', w: '1.2fr' }, { label: 'Customer', w: '1.6fr' }, { label: 'From PO', w: '1.4fr' }, { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.9fr' },
        { label: 'Thanh toán', w: '1.1fr' },
        { label: 'Issued', w: '0.9fr' }, { label: 'Activate by', w: '0.9fr' }]}
      rows={rows.map((i) => {
        const st = invStage(i)
        return [
          <button onClick={() => setOpen(i)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{i.code}</button>,
          <span className="truncate">{i.customer}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{i.po}</span>,
          <span className="tabular-nums">{i.total.toLocaleString('en-US')} ₫</span>,
          <Pill tone={st.tone}>{st.en}</Pill>,
          <PayCell {...invPay(i)} />,
          <span className="tabular-nums text-muted">{i.issued}</span>,
          <span className="tabular-nums text-muted">{i.activateBy}</span>,
        ]
      })}
      minW={1280}
      total={rows.length}
    />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        A draft invoice whose PO expired at month end is <b className="text-muted">withdrawn from this list</b> — it never had legal force and granted
        nothing, so it is not an invoice to reconcile. The record stays on its PO and in the audit log.
      </p>
    </div>
  )
}
/** Payment read-out. Overdue also says HOW late, because "overdue" alone does not
    tell a rep whether to send a reminder or escalate. */
function PayCell({ paidAt, poIssued }: { paidAt?: string; poIssued: string }) {
  const st = payStatus(paidAt, poIssued)
  const late = daysFromDoc(poIssued) - PAY_TERMS_DAYS
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={PAY_META[st].vi}>
      <Pill tone={PAY_META[st].tone}>{st}</Pill>
      {st === 'Paid' && paidAt && <span className="shrink-0 text-[10px] text-faint tabular-nums">{paidAt.replace(/\./g, '/')}</span>}
      {st === 'Overdue' && <span className="shrink-0 text-[10px] font-medium text-rose-600 tabular-nums">+{late}d</span>}
    </span>
  )
}

function PoDetail({ po, onBack }: { po: Po; onBack: () => void }) {
  useDetailCrumb(po.code, onBack)
  /* Only one document opens from here now: the draft VAT invoice. The PO itself is
     printed in full further down the page, so a viewer for it was a second copy of
     something already on screen. */
  const [draftPdf, setDraftPdf] = useState(false)
  const poCo = COMPANIES.find((x) => x.name === po.co)
    ?? COMPANIES.find((x) => x.name === po.customer || x.legalName === po.customer || coLabel(x) === po.customer)
  const step = poStep(po)
  const cur = poStage(step)
  const next = poNext(step)
  const pack = QUOTE_CATALOG[po.product]
  const sub = Math.round(po.total / (1 + VAT_RATE / 100))
  const vat = po.total - sub
  const unit = Math.round(sub / po.qty)
  return (
    <div>

      {/* One status, one action. The four-status model — what each means, who acts
          and what it triggers — is documented in the requirement, not restated on
          screen every time a rep opens a PO. */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5">
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={PO_TONE[step]}>{cur.en}</Pill>
          {/* An Active PO is running out of month, and that is the only thing on
              this bar the rep can still change the outcome of. */}
          {/* A draft invoice does not stop the clock: the PO still lapses at the
              end of its month unless the OFFICIAL invoice goes out. */}
          {poLive(step) && <span className="text-[11px] text-muted">Hết hạn <b className="text-ink/75">{poExpiry(po)}</b> — cuối tháng</span>}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* ONE button for the draft, on exactly the statuses where a draft is the
              live document. "Xuất" not "Xem": the PO is where a draft is PRODUCED,
              and this is now the only place it can be — the invoice screen shows
              the filed document, not the working one. */}
          {poDraftBtn(step) && (
            <button onClick={() => setDraftPdf(true)} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand">
              Xuất hóa đơn nháp
            </button>
          )}
          {/* Once the official invoice exists it is the document worth opening, and
              it lives on its own screen. */}
          {step === 'invoiced' && (
            <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">
              Xem hóa đơn chính
            </button>
          )}
          {/* SALES steps only. Issuing the official invoice is Kế toán's act and it
              is taken on the invoice itself — that is where the document, its number
              and its signature live. A duplicate button here would let the fiscal
              document be created from a screen that does not show it. */}
          {next && !next.accounting && (
            <button className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">
              {next.label}
            </button>
          )}
          {next?.accounting && (
            <span className="text-[11.5px] text-muted">Đang chờ <b className="text-ink/75">Kế toán</b> xuất hóa đơn chính — thao tác trên hóa đơn.</span>
          )}
        </div>
      </div>

      {/* No explanatory callouts on the record. The status pill, the expiry date
          beside it and the buttons already say what this PO is and what may be
          done to it; the rules behind them live in the requirement, not repeated
          on every record a rep opens. */}

      {/* document */}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <p className="text-[18px] font-bold tracking-tight">{po.code}</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div className="text-[11.5px] leading-relaxed">
            <p className="font-bold text-ink">DAOUKIWOOM INNOVATION COMPANY LIMITED</p>
            <p className="text-ink/80">Level 12, 13 &amp; 14, AP Tower, 518B Dien Bien Phu,<br />Thanh My Tay Ward, HCMC<br />Ho Chi Minh City<br />Vietnam 700000</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">0315421202</span></p>
          </div>
          <div className="text-right text-[11.5px] leading-relaxed">
            <p className="text-muted">Người nhận:</p>
            <p className="font-bold text-brand">{po.customer}</p>
            <p className="mt-1 text-ink/80">Mã số thuế: <span className="tabular-nums">{COMPANIES.find((c) => c.name === po.co)?.tax ?? '0318705749'}</span></p>
            {po.poNo && <p className="text-ink/80">Số PO của khách: <span className="font-mono">{po.poNo}</span></p>}
            <p className="mt-1 text-ink/80">Ngày phát hành: <b>{po.issued}</b></p>
            <p className="text-ink/80">Hết hạn: <b>{poExpiry(po)}</b></p>
            <p className="text-ink/80">Người bán: <b>{po.seller}</b></p>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-line">
          <div className="grid min-w-[760px] gap-x-3 bg-ink px-3 py-2 text-[11px] font-semibold text-white" style={{ gridTemplateColumns: '28px 3fr 0.7fr 1fr 0.7fr 0.9fr 1fr' }}>
            <span>#</span><span>Sản phẩm</span><span className="text-right">Số lượng</span><span className="text-right">Giá</span><span className="text-right">Chiết khấu</span><span className="text-right">Thuế</span><span className="text-right">Tổng</span>
          </div>
          <div className="grid min-w-[760px] gap-x-3 border-t border-line px-3 py-2.5 text-[12px]" style={{ gridTemplateColumns: '28px 3fr 0.7fr 1fr 0.7fr 0.9fr 1fr' }}>
            <span className="text-faint">1</span>
            <span className="min-w-0">
              <p className="font-medium text-ink">{pack.vi}</p>
              <ol className="mt-1 ml-4 list-decimal text-[11px] leading-relaxed text-muted">
                {pack.feats.map((f) => <li key={f}>{f}</li>)}
              </ol>
            </span>
            <span className="text-right tabular-nums">{po.qty} {pack.unitVi}</span>
            <span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span>
            <span className="text-right tabular-nums">0%</span>
            <span className="text-right text-[11px] text-muted">Thuế GTGT {VAT_RATE}%</span>
            <span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
          </div>
        </div>

        {/* the client's screen stops at a pre-VAT line total; spelling the tax out
            removes the ambiguity about what the customer actually owes */}
        <div className="mt-3 ml-auto w-full max-w-[320px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
          <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
          <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng phải trả</span><span className="tabular-nums">{po.total.toLocaleString('en-US')} ₫</span></div>
          <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(po.total)}.</p>
        </div>
      </div>

      {/* The draft invoice this PO would produce — rendered by the SAME component
          the Invoice screen uses, in its draft form, so the rep is looking at the
          document that will actually exist rather than a preview of it. */}
      {draftPdf && <InvoicePdfModal inv={draftInvOf(po)} co={poCo} onClose={() => setDraftPdf(false)} />}
    </div>
  )
}

function AdminPOs() {
  const [open, setOpen] = useState<Po | null>(null)
  /* The source quotation belongs to the Quotations page, so the link navigates
     there rather than rendering a quotation inside Purchase order — that keeps the
     breadcrumb honest ("CRM / Quotations / QUO-…") and Back going to the right list. */
  const goTo = useContext(ScreenNavCtx)
  if (open) return <PoDetail po={open} onBack={() => setOpen(null)} />
  return (
    <ListPage
      tabs={[{ label: 'All', count: 64, active: true }, { label: 'Active', count: 9 }, { label: 'Draft invoice', count: 5 }, { label: 'Invoice requested', count: 3 }, { label: 'Invoice issued' }, { label: 'Expired' }]}
      cols={[
        { label: 'PO', w: '1.5fr' }, { label: 'Customer', w: '1.8fr' }, { label: 'Quotation', w: '1.4fr' },
        { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.9fr' },
        // Payment sits NEXT TO the document status, never merged into it: they are
        // two independent facts and a rep reads them together.
        { label: 'Thanh toán', w: '1.1fr' },
        { label: 'Issued', w: '0.8fr' }, { label: 'Expires', w: '0.9fr' },
      ]}
      rows={POS.map((p) => [
        <button onClick={() => setOpen(p)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{p.code}</button>,
        <span className="truncate">{p.customer}</span>,
        <button onClick={() => goTo('admin-quotes', p.quote)} className="min-w-0 truncate text-left font-mono text-[11px] text-brand hover:underline">{p.quote}</button>,
        <span className="tabular-nums">{p.total.toLocaleString('en-US')} ₫</span>,
        <Pill tone={PO_TONE[poStep(p)]}>{poStage(poStep(p)).en}</Pill>,
        <PayCell paidAt={p.paidAt} poIssued={p.issued} />,
        <span className="tabular-nums text-muted">{p.issued}</span>,
        <span className={cn('tabular-nums', poLive(poStep(p)) ? 'font-medium text-ink/80' : 'text-faint')}>{poExpiry(p)}</span>,
      ])}
      minW={1240}
    />
  )
}
function AdminPayments() {
  const rows = [
    ['PAY-1042', 'Công ty Vạn Phát', 'SO-1188', '37,800,000 ₫', 'Bank transfer', <Pill tone="active">Confirmed · Kế toán</Pill>, '26/07/2026'],
    ['PAY-1043', 'AM Software Việt Nam', 'SO-1189', '6,588,000 ₫', 'Bank transfer', <Pill tone="pending">Recorded — to confirm</Pill>, '27/07/2026'],
    ['PAY-1044', 'Trường Sơn', 'SO-1185', '73,929,353 ₫', 'Bank transfer', <Pill tone="active">Confirmed · Kế toán</Pill>, '24/07/2026'],
    ['PAY-1045', 'Á Châu', 'SO-1182', '19,934,148 ₫', 'Cash', <Pill tone="rejected">Unmatched</Pill>, '20/07/2026'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'Awaiting payment', count: 9 }, { label: 'To confirm', count: 4, active: true }, { label: 'Confirmed' }, { label: 'To invoice', count: 2 }, { label: 'Unmatched', count: 1 }]}
      cols={[{ label: 'Reference', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Order', w: '0.9fr' }, { label: 'Amount', w: '1.1fr', align: 'r' }, { label: 'Method', w: '1.1fr' }, { label: 'Status', w: '1.6fr' }, { label: 'Paid', w: '0.9fr', align: 'r' }]}
      rows={rows}
      minW={860}
    />
  )
}
function AdminContracts() {
  const rows = [
    ['CT-0912', 'Trường Sơn', '546,679,016 ₫', <Pill tone="active">Active</Pill>, '20/04/2026 – 20/04/2027'],
    ['CT-0913', 'Phương Đông', '498,258,424 ₫', <Pill tone="expired">Expired</Pill>, '20/05/2025 – 15/04/2026'],
    ['CT-0914', 'Hồng Đức', '152,568,060 ₫', <Pill tone="draft">Draft</Pill>, '30/03/2026 – 04/09/2026'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Contract', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Value', w: '1.2fr', align: 'r' }, { label: 'Status', w: '1fr' }, { label: 'Validity', w: '1.8fr', align: 'r' }]}
      rows={rows}
    />
  )
}

export const ADMIN_PROTOTYPES: Record<string, () => JSX.Element> = {
  // Recruitment
  'admin-job-list': AdminJobList,
  'admin-job-create': AdminJobCreateStandalone,
  'admin-job-applicants': AdminApplicants,
  'admin-resumes': AdminResumes,
  'admin-cv-check': AdminCvCheck,
  'admin-resume-new': AdminResumeNewStandalone,
  // Companies
  'admin-company-list': AdminCompanyList,
  'admin-company-pipeline': AdminCompanyPipeline,
  // User — both sides of the marketplace's people accounts
  'admin-jobseekers': AdminJobseekers,
  'admin-company-users': AdminCompanyUsers,
  // Content
  'admin-banners': AdminDisplay,
  'admin-account-usage': AdminAccountUsage,
  'admin-manual-services': AdminManualServices,
  'admin-cv-search-usage': AdminCvSearchUsage,
  'admin-unresolved-terms': AdminUnresolvedTerms,
  'admin-pages': AdminPages,
  // Billing & products
  'admin-catalog': AdminCatalog,
  'admin-placements': AdminPlacements,
  'admin-image-gallery': AdminImageGallery,
  'admin-bundles': AdminBundles,
  'admin-credits': AdminCredits,
  'admin-orders': AdminOrders,
  'admin-promotions': AdminPromotions,
  // Sales / CRM
  'admin-signups': AdminSignups,
  'admin-sales-pipeline': AdminPipeline,
  'admin-quotes': AdminQuotes,
  'admin-invoices': AdminInvoices,
  'admin-purchase-orders': AdminPOs,
  'admin-payments': AdminPayments,
  'admin-contracts': AdminContracts,
  // Analytics
  'admin-analytics-dashboard': AdminDashboard,
  'admin-sales-report': AdminSalesReport,
  'admin-recruit-report': AdminRecruitReport,
  'admin-revenue-report': AdminRevenueReport,
  'admin-user-behavior': AdminUserBehavior,
  // System
  'admin-users': AdminUsers,
  'admin-roles': AdminRoles,
  'admin-staff': AdminStaff,
  'admin-issuer': AdminIssuer,
  'admin-membership': AdminMembership,
  'admin-master-data': AdminMasterData,
  'admin-audit-log': AdminAuditLog,
  'admin-matching-settings': AdminMatchingSettings,
  'admin-matching-report': AdminMatchingReport,
  'admin-environment': AdminEnvironment,
  'admin-departments': AdminDepartments,
  'admin-company-directory': AdminCompanyDirectory,
  'admin-claim-queue': AdminClaimQueue,
  // Job categories & roles now live inside Master data (one page); keep the id mapped.
  'admin-job-categories': AdminMasterData,
}
