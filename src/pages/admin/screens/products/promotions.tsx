import { useState } from 'react'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { AC_STATUS } from '@/pages/admin/data/companies'
import { PROGRAMMES } from '@/pages/admin/data/products'
import type { Programme } from '@/pages/admin/data/products'
import { DetailCard, KV } from '@/pages/admin/ui/fields'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* The settings screen. Not a list of coupon CODES — nobody types a code here.
   A programme is chosen BY the customer's status, so the record reads as a rule
   the quotation builder obeys rather than as something a rep applies by hand. */
export function AdminPromotions() {
  const [open, setOpen] = useState<Programme | null>(null)
  if (open) return <ProgrammeDetail p={open} onBack={() => setOpen(null)} />
  return (
    <div>
      <ListPage
        cols={[
          { label: 'Programme', w: '2fr' }, { label: 'Applies to', w: '1.2fr' }, { label: 'Discount', w: '1.7fr' },
          { label: 'Condition', w: '1.8fr' }, { label: 'Stacks', w: '0.8fr' }, { label: 'Validity', w: '1.2fr' }, { label: 'Status', w: '0.8fr', align: 'r' },
        ]}
        rows={PROGRAMMES.map((p) => [
          <button onClick={() => setOpen(p)} className="min-w-0 truncate text-left font-medium text-brand hover:underline">{p.vi}</button>,
          <span className="flex flex-wrap gap-1">{p.audience.map((a) => <Pill key={a} tone={AC_STATUS[a].tone}>{a}</Pill>)}</span>,
          <span className="text-muted">{p.kind === 'volume-per-product' ? `${p.tiers![0].pct}–${p.tiers![p.tiers!.length - 1].pct}% theo tổng số lượng cùng loại` : `${p.pct}% trên tổng đơn`}</span>,
          <span className="text-muted">{p.kind === 'volume-per-product' ? `từ ${p.tiers![0].minQty} sản phẩm cùng loại` : `mọi dòng ≤ ${p.maxQtyPerLine} · PO đầu tiên của trạng thái hiện tại`}</span>,
          p.stackable ? <span className="text-muted">Có</span> : <Pill tone="rejected">Không</Pill>,
          <span className="tabular-nums text-muted">{p.from} – {p.to}</span>,
          <Pill tone={p.status === 'Active' ? 'active' : 'expired'}>{p.status}</Pill>,
        ])}
        total={PROGRAMMES.length}
        searchHint="Search programme…"
        minW={1320}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        A programme is matched to a customer by their <b className="text-muted">customer status</b> (New · Existing · Churn) and applied by the
        quotation builder automatically — there is no code for a rep to type, and no button to press.
      </p>
    </div>
  )
}

/* The record. The tier table is the point of the screen, so it is the record —
   everything else on the page is the conditions around it. */
function ProgrammeDetail({ p, onBack }: { p: Programme; onBack: () => void }) {
  useDetailCrumb(p.vi, onBack)
  const tiers = p.tiers ?? []
  return (
    <div className="max-w-[900px]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            {p.vi} <Pill tone={p.status === 'Active' ? 'active' : 'expired'}>{p.status}</Pill>
          </h2>
          <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
            <span className="font-mono">{p.id}</span> · {p.name} · hiệu lực {p.from} – {p.to}
          </p>
        </div>
        <button className="shrink-0 rounded-lg border border-brand/30 bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Edit</button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DetailCard title="Điều kiện áp dụng — conditions">
          <KV label="Khách hàng / Customer status" value={p.audience.join(' · ')} />
          <KV label="Cách tính" value={p.kind === 'volume-per-product' ? 'Cộng dồn theo loại sản phẩm (“cùng loại”) — tổng số lượng của một sản phẩm trong option quyết định % cho mọi dòng của sản phẩm đó' : `${p.pct}% trên tổng đơn (trước VAT)`} />
          {p.maxQtyPerLine != null && (
            <KV label="Giới hạn số lượng" value={`Mọi dòng phải ≤ ${p.maxQtyPerLine}. Chỉ cần 1 dòng vượt là mất toàn bộ ${p.pct}% — không phải chỉ dòng đó.`} />
          )}
          <KV
            label="Phạm vi"
            value={p.firstPoOfCurrentSpell
              ? 'PO đầu tiên kể từ khi khách ở trạng thái hiện tại — với khách Churn là PO đầu tiên sau khi quay lại, không phải PO đầu tiên trong lịch sử. Tự động hết hiệu lực: hóa đơn đầu tiên đổi khách sang Existing nên chương trình không còn khớp.'
              : 'Mọi đơn trong thời gian hiệu lực'}
          />
          <KV label="Chạy cùng chương trình khác" value={p.stackable ? 'Có' : 'Không — loại trừ mọi chương trình khác'} />
          <KV
            label="Duyệt chiết khấu"
            value="Không cần duyệt. Mức chiết khấu do chương trình cấp và sales không nhập tay được trên báo giá, nên không có bước trình duyệt nào."
          />
          {p.giftActivationFollowsPaid && (
            <KV label="Hạn kích hoạt tin tặng" value="Giống tin mua — dùng đúng activation window của sản phẩm đã mua (xem Products management)" />
          )}
        </DetailCard>

        <DetailCard
          title={p.kind === 'volume-per-product' ? 'Bậc chiết khấu — theo tổng số lượng cùng loại' : 'Mức chiết khấu'}
          action={<span className="text-[11px] text-faint">áp dụng tự động khi tạo báo giá</span>}
        >
          {tiers.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-line">
                <div className="grid grid-cols-3 gap-x-2 bg-canvas/60 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                  <span>Từ số lượng</span><span>Đến</span><span className="text-right">Chiết khấu</span>
                </div>
                {tiers.map((t, i) => {
                  const next = tiers[i + 1]
                  return (
                    <div key={t.minQty} className="grid grid-cols-3 gap-x-2 border-t border-line-soft px-3 py-1.5 text-[12px]">
                      <span className="tabular-nums font-medium">{t.minQty}</span>
                      <span className="tabular-nums text-muted">{next ? next.minQty - 1 : '∞'}</span>
                      <span className="text-right tabular-nums font-semibold">{t.pct}%</span>
                    </div>
                  )
                })}
              </div>
              {/* The row the client's sheet does not print, and the one a rep will
                  otherwise assume is 25%. */}
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Số lượng <b className="text-ink/75">1</b> không có chiết khấu. Các mốc là <b className="text-ink/75">ngưỡng</b>, không phải con số chính xác — mua 7 tin hưởng bậc 5 (30%), không phải mất chiết khấu.
                <br />Số lượng được <b className="text-ink/75">cộng dồn theo loại sản phẩm</b>: 3 tin Basic Plus ở một dòng và 4 tin Basic Plus ở dòng khác là 7 tin, cả hai dòng cùng hưởng 30%. Tách dòng không làm thay đổi giá.
              </p>
            </>
          ) : (
            <p className="text-[13px]"><b className="text-[15px]">{p.pct}%</b> trên tổng đơn, trước VAT.</p>
          )}
          {p.note && <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">{p.note}</p>}
        </DetailCard>
      </div>
    </div>
  )
}
