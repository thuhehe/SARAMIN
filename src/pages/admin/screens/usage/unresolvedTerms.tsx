import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SOURCE_LABEL, SUPPLY_GAPS, TERM_TONE, UNRESOLVED_TERMS } from '@/pages/admin/data/content'
import { FilterSelect, ListPage } from '@/pages/admin/ui/list'
import { StatCards } from '@/pages/admin/ui/stats'
import { Pill } from '@/pages/admin/ui/status'

export function AdminUnresolvedTerms() {
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
