import { useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { CreateSignalCtx, OpenRecordCtx, ScreenNavCtx } from '@/pages/admin/ctx'
import { AC_STATUS, COMPANIES, CO_ORDER, CO_SORTS, CO_STATUS, cadenceOf, coCity, coKey, coLabel, coLastRevenue, inPipeline } from '@/pages/admin/data/companies'
import type { CoSort, Company } from '@/pages/admin/data/companies'
import { coRoles, groupOf, groupRootOf, inGroup } from '@/pages/admin/data/companyTree'
import { DIRECTORY } from '@/pages/admin/data/directory'
import { TIER_YEAR, tierOf } from '@/pages/admin/data/membership'
import { SALES_DEPT, SALES_PERSONAS, SALES_ROLE_LABEL, teamBookOf } from '@/pages/admin/data/salesOrg'
import type { SalesPersona } from '@/pages/admin/data/salesOrg'
import { revFmt } from '@/pages/admin/lib/fmt'
import { CompanyCreatePage } from '@/pages/admin/screens/companies/create'
import { CompanyDetail } from '@/pages/admin/screens/companies/detail'
import { FilterBar, FilterRow, ListPage } from '@/pages/admin/ui/list'
import { Idle, Pill, TierPill } from '@/pages/admin/ui/status'
import { searchKey } from '@/pages/admin/ui/table'
import type { Col } from '@/pages/admin/ui/table'

export function AdminCompanyList() {
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
  /* Archived companies never appear here, and there is no filter to bring them
     back: a state whose purpose is to stop generating work must not be one wrong
     dropdown away from sitting among live customers. They have their own register —
     CRM → Công ty đã lưu trữ — which is also where "was this archived, and why" is
     answered. */
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
      !c.archived &&
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
