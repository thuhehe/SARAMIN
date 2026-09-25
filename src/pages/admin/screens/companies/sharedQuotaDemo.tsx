import { useState } from 'react'
import { cn } from '@/lib/utils'
import { COMPANIES, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { CompanyDetail } from '@/pages/admin/screens/companies/detail'
import type { CoTab } from '@/pages/admin/data/companyRecord'

/*
 * Spec-page preview for the Shared quota feature. The feature lives on the company
 * record (Products & billing tab), which the console reaches by opening a row on the
 * Customers list — one click the preview cannot ask a reader to make. So this screen
 * opens the record straight on that tab, for the two companies that show both sides:
 * the SPONSOR (FPT Software — three companies linked, one removed) and a BENEFICIARY
 * (Sao Mai — posts from FPT's POs, sees only what it used).
 */
const SPONSOR = 'FPT Software'
const BENEFICIARY = 'Công ty TNHH Sao Mai'

export function AdminSharedQuotaDemo() {
  const [which, setWhich] = useState<string>(SPONSOR)
  const [tab, setTab] = useState<CoTab>('Products & billing')
  const [open, setOpen] = useState<Company | null>(null)
  const c = open ?? COMPANIES.find((x) => x.name === which)!
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-canvas/60 px-3 py-2 text-[11.5px]">
        <span className="text-muted">Xem hồ sơ của:</span>
        {[SPONSOR, BENEFICIARY].map((n) => (
          <button
            key={n}
            onClick={() => { setWhich(n); setOpen(null) }}
            className={cn('rounded-full border px-2.5 py-1 font-medium', c.name === n ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-ink')}
          >
            {coLabel(COMPANIES.find((x) => x.name === n)!)} — {n === SPONSOR ? 'sponsor (mua PO)' : 'beneficiary (dùng chung)'}
          </button>
        ))}
        <span className="text-faint">· tab</span>
        {(['Overview', 'Products & billing'] as CoTab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setOpen(null) }} className={cn('rounded-full border px-2.5 py-1 font-medium', tab === t ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:text-ink')}>{t}</button>
        ))}
      </div>
      <CompanyDetail key={c.name + tab} c={c} onBack={() => setOpen(null)} onOpen={setOpen} initialTab={tab} />
    </div>
  )
}
