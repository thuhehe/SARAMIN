import { cn } from '@/lib/utils'
import { COMPANIES } from '@/pages/admin/data/companies'
import { TIERS, TIER_RESET, TIER_YEAR, tierOf } from '@/pages/admin/data/membership'
import type { Tier } from '@/pages/admin/data/membership'
import { vnd } from '@/pages/admin/lib/fmt'
import { JobGroup } from '@/pages/admin/ui/form'
import { TierPill } from '@/pages/admin/ui/status'
import { Table } from '@/pages/admin/ui/table'

/* ── System → Membership tiers ─────────────────────────────────────────────────
   The settings page behind the loyalty programme. Two tables and nothing else:
   the thresholds that earn a tier, and the reward catalogue each tier unlocks.
   Both are data, because the programme is re-issued every year — 2025's bands are
   already different from 2026's, and that must never be a code change.

   Only ONE number per tier is stored (the lower bound). The "đến dưới" column is
   derived from the next band up, so the bands can never overlap or leave a gap. */
export function AdminMembership() {
  const noTier = COMPANIES.filter((c) => !tierOf(c)).length
  const countOf = (k: Tier) => COMPANIES.filter((c) => tierOf(c)?.key === k).length
  return (
    <div>
      <div className="mb-3 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
        <b>Chương trình Khách hàng Thân thiết {TIER_YEAR}</b> — hạng thành viên được <b>tính tự động</b> từ tổng giá trị đơn hàng
        tích lũy của công ty <b>trong một năm</b>. Sales không set hạng bằng tay. Tích lũy <b>reset về 0 vào {TIER_RESET}</b>;
        hạng năm nay không mang sang năm sau.
      </div>

      <div className="space-y-4">
        {/* ── Thresholds ───────────────────────────────────────────────────── */}
        <JobGroup title="Tier thresholds">
          <Table
            minW={720}
            cols={[
              { label: 'Danh hiệu', w: '1.2fr' },
              { label: 'Từ (tích lũy ≥)', w: '1.1fr' },
              { label: 'Đến dưới', w: '1.1fr' },
              { label: 'Công ty đang ở hạng này', w: '1fr', align: 'r' },
            ]}
            rows={[
              [
                <span className="text-[11.5px] text-faint">Chưa có hạng</span>,
                <span className="tabular-nums text-faint">0 ₫</span>,
                <span className="tabular-nums text-faint">{vnd(TIERS[0].from)}</span>,
                <span className="tabular-nums text-muted">{noTier}</span>,
              ],
              ...TIERS.map((t, i) => [
                <span className="flex items-center gap-2"><TierPill tier={t} en /></span>,
                <input
                  readOnly
                  value={t.from.toLocaleString('en-US')}
                  className="w-full rounded-md border border-line bg-surface px-2 py-1 text-right text-[12px] tabular-nums text-ink"
                />,
                <span className="tabular-nums text-muted">{TIERS[i + 1] ? vnd(TIERS[i + 1].from) : 'không giới hạn'}</span>,
                <span className="tabular-nums font-medium text-ink">{countOf(t.key)}</span>,
              ]),
            ]}
          />
        </JobGroup>

        {/* ── Reward catalogue ─────────────────────────────────────────────── */}
        <JobGroup title="Danh mục quyền lợi theo hạng">
          {/* A matrix of benefit × tier implied the system grants and tracks each cell.
              It does not — quyền lợi are agreed and delivered by hand — so this is a
              note per tier that CSKH writes and reads, not data anything computes. */}
          <div className="space-y-2.5">
            {TIERS.map((t) => (
              <div key={t.key} className="rounded-lg border border-line">
                <div className="flex items-center gap-2 border-b border-line-soft bg-canvas/50 px-3 py-2">
                  <TierPill tier={t} en />
                  <span className="text-[11px] text-faint">tích lũy ≥ {vnd(t.from)}</span>
                </div>
                {/* Rich-text placeholder: the real screen gets bold / list / link. */}
                <div className="flex items-center gap-1 border-b border-line-soft px-2 py-1 text-[11px] text-faint">
                  {['B', 'I', 'U', '•', '1.', ''].map((b) => (
                    <span key={b} className={cn('grid h-5 min-w-5 place-items-center rounded px-1 hover:bg-canvas', b === 'B' && 'font-bold', b === 'I' && 'italic', b === 'U' && 'underline')}>{b}</span>
                  ))}
                </div>
                <div className="px-3 py-2.5 text-[11.5px] leading-relaxed text-faint" style={{ minHeight: 66 }}>
                  Ghi chú quyền lợi của hạng {t.vi} — CSKH tự nhập và tự theo dõi. Hệ thống không cấp và không trừ quyền lợi tự động.
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10.5px] leading-relaxed text-faint">
            Chỉ là ghi chú. Hạng thành viên vẫn được tính tự động từ tích lũy đơn hàng, nhưng <b className="text-ink/70">quyền lợi
            thì thoả thuận và thực hiện thủ công</b> — không có bản ghi cấp phát nào được sinh ra từ đây.
          </p>
        </JobGroup>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2.5">
        <button className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Save</button>
      </div>
    </div>
  )
}
