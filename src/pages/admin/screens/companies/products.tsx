import { useState } from 'react'
import { cn } from '@/lib/utils'
import { coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { entitlementSources, pastPurchases } from '@/pages/admin/data/companyRecord'
import type { EntSource } from '@/pages/admin/data/companyRecord'
import { TIERS, TIER_YEAR, nextTierAt, tierAt, tierRevenue } from '@/pages/admin/data/membership'
import { SERVICE_USAGE } from '@/pages/admin/data/services'
import type { ServiceEntitlement } from '@/pages/admin/data/services'
import { vnd } from '@/pages/admin/lib/fmt'
import { DetailCard, FLabel, LField } from '@/pages/admin/ui/fields'
import { TierPill } from '@/pages/admin/ui/status'

/* Membership block on the company record. Deliberately shows the ARITHMETIC, not
   just the badge: accumulated-in-year, the gap to the next band, and the reset date.
   The gap is the reason a rep opens this — it is the only upsell number the loyalty
   programme produces. */
/* Membership tier as an at-a-glance STAT, not a left-column card: the tier and the
   gap to the next band are numbers a rep reads in passing, and the per-tier benefit
   table belongs in System → Membership tiers where it is configured once. */
export function MembershipStat({ c }: { c: Company }) {
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

function QuotaBar({ left, total }: { left: number; total: number }) {
  const pct = total ? (left / total) * 100 : 0
  return (
    <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-line">
      <div className={cn('h-full rounded-full', pct < 30 ? 'bg-amber-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
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

/* One bucket of entitlement — the PO (or the free grant) that paid for it, with its
   own lines and its own expiry.

   The header is the source, not the product. That inversion is the whole answer to
   "which product belongs to which PO": a reader does not match a product to a PO by
   reading a code in a cell, they read the PO once and the products under it. */
function SourceBlock({ s }: { s: EntSource }) {
  return (
    <div className="rounded-lg border border-line">
      <div className="flex items-start justify-between gap-2 border-b border-line-soft px-2.5 py-1.5">
        <span className="min-w-0">
          <span className="truncate font-mono text-[11px] font-medium text-brand">{s.label}</span>
          <span className="mt-0.5 block truncate text-[10px] text-faint">xuất hoá đơn {s.from}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[11px] font-semibold tabular-nums text-ink">{s.amount ? vnd(s.amount) : '0 ₫'}</span>
          <span className="block text-[10px] text-faint">đến {s.until}</span>
        </span>
      </div>
      <div className="space-y-2 px-2.5 py-2">
        {s.lines.map((l) => (
          <div key={l.name}>
            <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
              <span className="min-w-0 truncate">{l.name}</span>
              <span className={cn('shrink-0 tabular-nums font-semibold', l.left === 0 && 'text-faint')}>
                {l.left}<span className="font-normal text-faint">/{l.total} {l.unit}</span>
              </span>
            </div>
            <QuotaBar left={l.left} total={l.total} />
            {l.left === 0 && <p className="mt-0.5 text-[10px] text-faint">đã dùng hết — hạn {s.until}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Products & quota block — shared by the Overview snapshot and the billing tab */
export function ProductsQuota({ c, compact }: { c: Company; compact?: boolean }) {
  const noProducts = !c.jobPosting && !c.resumeSearch
  /* A company's history matters as much as its current entitlement — "what did they
     buy last year?" is the first question on a renewal call. Past purchases are a
     second list behind a toggle rather than a third card: same rows, same shape,
     just no longer counting toward quota. */
  const [showPast, setShowPast] = useState(false)
  const past = pastPurchases(c)
  const srcs = entitlementSources(c)
  // Totals across every bucket. They stay PRIMARY: the number a rep quotes to a
  // customer is "how many do we have left", never "how many are left on PO 2".
  const tot = (unit: 'slots' | 'CV unlocks' | 'tin') =>
    srcs.flatMap((x) => x.lines).filter((l) => l.unit === unit)
      .reduce((a, l) => ({ left: a.left + l.left, total: a.total + l.total }), { left: 0, total: 0 })
  const jobT = tot('slots')
  /* Gifted postings — the 0 ₫ "(Tặng)" lines inside a paid PO — are counted apart
     from paid slots. Merging them was wrong in both directions: it inflated what the
     customer paid for, and it hid which postings cost them nothing, which is the
     first thing a renewal conversation needs to know. */
  const giftT = tot('tin')
  const cvT = tot('CV unlocks')

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
          {/* Bought lines land here the moment Kế toán issues the VAT invoice on the
              PO. A FREE grant lands here with no document at all — which is why the
              bucket, not the product, is the thing being labelled. */}
          {showPast ? (
            past.length === 0
              ? <p className="text-[12px] text-muted">Chưa có sản phẩm nào kết thúc.</p>
              : <div className="space-y-1.5">{past.map((x, i) => <PurchaseRow key={i} {...x} expired />)}</div>
          ) : srcs.length === 0 ? (
            <p className="text-[12px] text-muted">Chưa mua sản phẩm nào — quota chỉ xuất hiện khi xuất hoá đơn VAT cho một PO. Tin miễn phí không cần quota: Admin đăng mà không chọn PO.</p>
          ) : (
            <div className="space-y-2">
              {srcs.map((x) => <SourceBlock key={x.label} s={x} />)}
              {srcs.length > 1 && (
                <p className="text-[10.5px] leading-relaxed text-faint">
                  <b className="text-muted">Trừ quota theo thứ tự hết hạn gần nhất trước</b>, để không phần nào hết hạn mà chưa dùng.
                </p>
              )}
            </div>
          )}
        </>
      )}
      {(!noProducts || giftT.total > 0) && (
        <>
          {/* The total is what a rep quotes. It is shown as a total, and the source
              blocks above are where the same number is broken down. */}
          <p className={cn('mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint', !compact && 'mt-3.5')}>
            Tổng quota còn lại {srcs.length > 1 && <span className="font-normal normal-case tracking-normal text-faint">· từ {srcs.length} nguồn</span>}
          </p>
          <div className="space-y-3">
            {jobT.total > 0 && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <b>Job posting</b>
                  <span className="tabular-nums font-semibold">{jobT.left}<span className="font-normal text-faint">/{jobT.total} slots</span></span>
                </div>
                <QuotaBar left={jobT.left} total={jobT.total} />
                {compact && srcs.length > 1 && <p className="mt-0.5 text-[10px] text-faint">{srcs.map((x) => `${x.kind === 'free' ? 'miễn phí' : x.label.slice(3, 9)}`).join(' + ')}</p>}
              </div>
            )}
            {giftT.total > 0 && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <b className="text-amber-800">Tin đăng tặng kèm PO</b>
                  <span className="tabular-nums font-semibold">{giftT.left}<span className="font-normal text-faint">/{giftT.total} tin</span></span>
                </div>
                <QuotaBar left={giftT.left} total={giftT.total} />
                <p className="mt-0.5 text-[10px] text-faint">0 ₫ trong PO đã trả tiền — tính riêng, để lúc gia hạn biết khách thật sự đã trả tiền cho bao nhiêu tin.</p>
              </div>
            )}
            {cvT.total > 0 && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]"><b>Resume search</b><span className="tabular-nums font-semibold">{cvT.left}<span className="font-normal text-faint">/{cvT.total} unlocks</span></span></div>
                <QuotaBar left={cvT.left} total={cvT.total} />
              </div>
            )}
            {/* Expiry is per bucket, so a single "valid until" line would be a lie
                the moment there are two POs. */}
            <p className="text-[11px] text-faint">
              {srcs.length === 1
                ? <>Hạn dùng {srcs[0].until}.</>
                : <>Hạn dùng khác nhau theo từng nguồn: {srcs.map((x) => `${x.kind === 'free' ? 'miễn phí' : x.label.slice(0, 12)} → ${x.until}`).join(' · ')}.</>}
            </p>
          </div>
        </>
      )}
      {noProducts && c.account === 'Churn' && <p className="mt-2 text-[11px] text-amber-700">Subscription expired — no active quota. Renew to reactivate.</p>}
    </>
  )
}

export function ServiceUsageCard({ c }: { c: Company }) {
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

export function LogServiceDeliveryModal({ e, company, onClose }: { e: ServiceEntitlement; company: string; onClose: () => void }) {
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
