import { useState } from 'react'
import { cn } from '@/lib/utils'
import { COMPANIES, CO_ORDER, CO_STATUS, STAGE_NEXT, cadenceOf, coLabel, coValue } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { ME } from '@/pages/admin/data/salesOrg'
import { vnd } from '@/pages/admin/lib/fmt'
import { CompanyDetail } from '@/pages/admin/screens/companies/detail'
import { Idle, Pill } from '@/pages/admin/ui/status'

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


/* ── Pipeline — the same companies as a status board (opens the same record) ── */
export function AdminCompanyPipeline() {
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
