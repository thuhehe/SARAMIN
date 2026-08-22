import { useState } from 'react'
import { cn } from '@/lib/utils'
import { COMPANIES, coLabel, isCustomer } from '@/pages/admin/data/companies'
import { usageOf } from '@/pages/admin/data/content'
import type { UsagePair } from '@/pages/admin/data/content'
import { FilterSelect, ListPage } from '@/pages/admin/ui/list'

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

export function AdminAccountUsage() {
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
