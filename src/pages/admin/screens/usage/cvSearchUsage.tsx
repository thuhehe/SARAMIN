import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CV_SEARCH_PACKAGES, ZERO_RESULT_TERMS } from '@/pages/admin/data/content'
import { ListPage } from '@/pages/admin/ui/list'
import { StatCards } from '@/pages/admin/ui/stats'
import { Pill } from '@/pages/admin/ui/status'

export function AdminCvSearchUsage() {
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
