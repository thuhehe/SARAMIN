/*
 * Archived companies — a list of its own, not a filter on the working list.
 *
 * Archive exists to make a company stop generating work, so the working list must
 * never contain one. Putting them behind a filter left them one wrong dropdown away
 * from reappearing among live customers, and left the operator who wanted "the
 * archived list" hunting a filter panel for it.
 *
 * This is a REGISTER, not a work list, and it is built differently because of it:
 *  · sorted by when it was archived, newest first — the question is "what happened
 *    recently", never "who do I call"
 *  · the reason and who did it are COLUMNS, not a hover — that is the whole content
 *  · no pipeline, no idle, no last-contact, no revenue-chasing columns; none of them
 *    mean anything for a company nobody will contact again
 *  · no "+ New" action. Nothing is created here.
 */
import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { OpenRecordCtx, ScreenNavCtx } from '@/pages/admin/ctx'
import { COMPANIES, coCity, coKey, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { ARCHIVE_REASONS, archiveReason } from '@/pages/admin/data/companyPage'
import { vnd } from '@/pages/admin/lib/fmt'
import { CompanyDetail } from '@/pages/admin/screens/companies/detail'
import { FilterBar, FilterRow, ListPage } from '@/pages/admin/ui/list'

/** dd/mm/yyyy → sortable. Archive dates are entered as VN dates, not ISO. */
const dmy = (s: string) => {
  const [d, m, y] = s.split('/')
  return Number(y) * 10000 + Number(m) * 100 + Number(d)
}

export function AdminCompanyArchived() {
  const [open, setOpen] = useState<Company | null>(null)
  const [fReason, setFReason] = useState('')
  const [fOwner, setFOwner] = useState('')
  const goTo = useContext(ScreenNavCtx)
  const handed = useContext(OpenRecordCtx)
  const linked = handed ? COMPANIES.find((c) => companyId(coKey(c)) === handed || c.name === handed) ?? null : null
  const showing = open ?? linked
  if (showing) return <CompanyDetail c={showing} onBack={() => { setOpen(null); if (handed) goTo('admin-company-archived') }} onOpen={setOpen} />

  /* NOT scoped to the viewer's book. An archived company is nobody's to work, so
     "my archived companies" is not a question anyone asks — but "was this company
     archived, and why" is, and it is asked about companies that were never yours. */
  const all = COMPANIES.filter((c) => c.archived)
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'vi'))
  const rows = all
    .filter((c) => (!fReason || archiveReason(c.archived!.reason)?.vi === fReason) && (!fOwner || c.owner === fOwner))
    .slice()
    .sort((a, b) => dmy(b.archived!.at) - dmy(a.archived!.at))
  const activeFilters = [fReason, fOwner].filter(Boolean).length

  return (
    <div>
      {/* Said once at the top rather than per row: a register nobody visits often
          needs to explain what it IS, and the release-vs-archive distinction is the
          thing a reader will otherwise get wrong. */}
      <p className="mb-3 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
        Lưu trữ là <b className="text-ink/70">cửa cuối</b> — công ty không còn tồn tại (phá sản, giải thể, sáp nhập) hoặc không được phục vụ nữa (trùng lặp, vi phạm).
        Hồ sơ, hoá đơn và lịch sử <b className="text-ink/70">vẫn được giữ</b>, doanh thu kỳ đã chốt không đổi.
        Công ty vẫn còn tiềm năng nhưng không muốn chăm sóc thì <b className="text-ink/70">trả về bể dữ liệu</b>, không lưu trữ.
      </p>
    <ListPage
      total={all.length}
      searchHint="Tìm theo tên, mã số thuế hoặc Company ID — kể cả công ty của sales khác."
      searchExtra={rows.map((c) => `${companyId(coKey(c))} ${c.tax} ${c.legalName}`)}
      filters={
        <FilterBar count={activeFilters} onClear={() => { setFReason(''); setFOwner('') }}>
          <FilterRow label="Lý do" value={fReason} onChange={setFReason} options={ARCHIVE_REASONS.map((r) => r.vi)} />
          <FilterRow label="Sales phụ trách" value={fOwner} onChange={setFOwner} options={uniq(all.map((c) => c.owner))} />
        </FilterBar>
      }
      cols={[
        { label: 'Company', w: '1.6fr' },
        { label: 'Company ID', w: '0.9fr' },
        { label: 'Lý do lưu trữ', w: '1.2fr' },
        { label: 'Ghi chú', w: '1.8fr' },
        { label: 'Ngày lưu trữ', w: '0.8fr' },
        { label: 'Người thực hiện', w: '1.1fr' },
        { label: 'Sales phụ trách', w: '1fr' },
        { label: 'Tổng doanh thu', w: '1fr', align: 'r' as const },
      ]}
      rows={rows.map((c) => {
        const a = c.archived!
        return [
          <div className="min-w-0">
            <button onClick={() => setOpen(c)} className="block min-w-0 max-w-full truncate text-left font-medium text-ink/80 hover:text-brand hover:underline">{coLabel(c)}</button>
            <p className="truncate text-[10px] text-faint">MST {c.tax} · {coCity(c)}</p>
          </div>,
          <span className="font-mono text-[11px] text-muted">{companyId(coKey(c))}</span>,
          <span className={cn('rounded-md border px-1.5 py-0.5 text-[10.5px]',
            a.reason === 'banned' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-line bg-canvas text-muted')}>
            {archiveReason(a.reason)?.vi ?? a.reason}
          </span>,
          <span className="block truncate text-[11.5px] text-muted" title={a.note}>{a.note || '—'}</span>,
          <span className="tabular-nums text-[11.5px] text-muted">{a.at}</span>,
          <span className="truncate text-[11.5px] text-muted">{a.by}</span>,
          <span className="truncate text-[11.5px] text-muted">{c.owner}</span>,
          <span className="tabular-nums text-[11.5px]">{c.revenue ? vnd(c.revenue) : '—'}</span>,
        ]
      })}
    />
    </div>
  )
}
