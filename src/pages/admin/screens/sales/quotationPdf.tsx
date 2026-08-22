import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Company } from '@/pages/admin/data/companies'
import { ISSUER, QUOTE_TERMS, SARAMIN_BLUE, VAT_RATE, pdfNum, pdfOptions, signDate } from '@/pages/admin/data/sales'
import type { Quote } from '@/pages/admin/data/sales'
import { enWords, vnWords } from '@/pages/admin/lib/fmt'
import { SaraminMark } from '@/pages/admin/screens/sales/_shared'
import { Bi } from '@/pages/admin/ui/fields'

/** The A4 sheet. Rendered at 794px (210mm @96dpi) and scaled by the viewer. */
function QuotationPdfDoc({ q, co }: { q: Quote; co?: Company }) {
  const opts = pdfOptions(q)
  const rep = co?.owner ?? 'Nguyễn Thị Lan'
  const contact = co?.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0] ?? q.customer
  const sd = signDate(q.created)
  const COLS = '28px minmax(0,2.6fr) 58px 46px 84px 58px 92px'

  return (
    <div className="mx-auto bg-white text-slate-800 shadow-xl" style={{ width: 794 }}>
      <div className="px-[52px] py-[44px]">
        {/* ── letterhead ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold leading-snug text-slate-900">{ISSUER.nameVi}</p>
            <p className="text-[11px] font-medium italic leading-snug text-slate-500">{ISSUER.nameEn}</p>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-slate-600">{ISSUER.addrVi}</p>
            <p className="text-[9.5px] italic leading-relaxed text-slate-400">{ISSUER.addrEn}</p>
            <p className="mt-1 text-[9.5px] font-medium text-sky-700">{ISSUER.web}</p>
          </div>
          {/* Group brand on the document: Saramin is the parent, TopDev the brand
              the customer buys on — both belong here, in that order. */}
          <div className="shrink-0 pt-0.5 text-right">
            <SaraminMark width={104} />
            <p className="mt-1.5 border-t border-slate-200 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {ISSUER.brand} Vietnam
            </p>
          </div>
        </div>

        <p className="mt-2 text-[9.5px] text-slate-600">
          <span className="text-slate-400">Báo giá bởi / Proposed by:</span> <b className="text-slate-800">{rep}</b> | {rep.split(' ').pop()?.toLowerCase()}@topdev.vn
        </p>

        {/* ── title band ───────────────────────────────────────────────
            A black slab is loud without being informative. This is the same
            content on paper-white with a single brand rule down the left: the
            title reads as a title, the number stays monospaced and findable, and
            the two dates sit in their own labelled cells so "hết hạn" — the one
            date that actually constrains the customer — can be picked out. */}
        <div className="mt-5 flex items-stretch justify-between gap-6 border-y border-slate-200 py-3.5">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="h-full w-[3px] shrink-0 rounded-full" style={{ backgroundColor: SARAMIN_BLUE }} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <p className="text-[26px] font-black leading-none tracking-tight text-slate-900">BÁO GIÁ</p>
                <p className="text-[10.5px] font-semibold tracking-[0.28em] text-slate-400">PROPOSAL</p>
              </div>
              <p className="mt-2 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11.5px] font-bold tracking-tight" style={{ color: SARAMIN_BLUE }}>
                {q.code}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {([
              { vi: 'Ngày báo giá', en: 'Proposal Date', v: q.created, accent: false },
              { vi: 'Ngày hết hạn', en: 'Expiry Date', v: q.expires, accent: true },
            ]).map((d) => (
              <div
                key={d.en}
                className={cn('min-w-[104px] rounded-md border px-2.5 py-1.5 text-right', d.accent ? 'border-slate-300 bg-slate-50' : 'border-slate-200')}
              >
                <span className="block text-[8.5px] font-semibold uppercase tracking-wide text-slate-500">{d.vi}</span>
                <span className="block text-[8.5px] italic text-slate-400">{d.en}</span>
                <b className={cn('mt-1 block text-[12.5px] tabular-nums', d.accent ? 'text-slate-900' : 'text-slate-700')}>{d.v}</b>
              </div>
            ))}
          </div>
        </div>

        {/* ── customer + VAT billing, side by side ───────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <Bi vi="Thông tin khách hàng" en="Client information" className="text-[10px] font-bold uppercase tracking-wide text-slate-700" />
            <dl className="mt-2 space-y-1.5 text-[10px] leading-snug">
              <div><dt className="text-slate-400">Tên khách hàng / Client name</dt><dd className="font-semibold text-slate-800">{contact}</dd></div>
              <div><dt className="text-slate-400">Email</dt><dd className="font-medium text-slate-700">{co ? `${contact.split(' ').pop()?.toLowerCase()}@${co.domain}` : '—'}</dd></div>
              <div><dt className="text-slate-400">Số điện thoại / Phone number</dt><dd className="font-medium tabular-nums text-slate-700">0978 490 363</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <Bi vi="Thông tin xuất hóa đơn VAT" en="Billing information for VAT-invoice" className="text-[10px] font-bold uppercase tracking-wide text-slate-700" />
            <dl className="mt-2 space-y-1.5 text-[10px] leading-snug">
              <div><dt className="text-slate-400">Tên công ty / Company name</dt><dd className="font-semibold uppercase text-slate-800">{co?.legalName ?? q.customer}</dd></div>
              <div><dt className="text-slate-400">Địa chỉ ĐKKD / Billing Address</dt><dd className="font-medium text-slate-700">{co?.address ?? '—'}</dd></div>
              <div><dt className="text-slate-400">Mã số thuế / Tax code</dt><dd className="font-medium tabular-nums text-slate-700">{co?.tax ?? '—'}</dd></div>
            </dl>
          </div>
        </div>

        {/* ── options ────────────────────────────────────────────────── */}
        {opts.map((o) => (
          <section key={o.n} className="mt-5">
            {/* Options are ALTERNATIVES. With three of them the reader needs to know
                which one we are actually proposing, so the recommended one is named
                — without implying the others are unavailable. */}
            <div
              className="flex items-start justify-between gap-3 rounded-t-lg border border-b-0 px-3.5 py-2"
              style={{
                borderColor: o.n === 1 ? `${SARAMIN_BLUE}33` : '#E2E8F0',
                backgroundColor: o.n === 1 ? `${SARAMIN_BLUE}0F` : '#F8FAFC',
                borderLeft: `3px solid ${o.n === 1 ? SARAMIN_BLUE : '#94A3B8'}`,
              }}
            >
              <p className="min-w-0 text-[10.5px] leading-snug">
                <span className="font-bold" style={{ color: o.n === 1 ? SARAMIN_BLUE : '#475569' }}>Option {o.n}</span>
                <span className="ml-1.5 text-slate-600">{o.title}</span>
              </p>
              {o.n === 1 && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: SARAMIN_BLUE }}>
                  Đề xuất · Recommended
                </span>
              )}
            </div>
            <div className="rounded-b-lg border border-t-0 border-slate-200">
              {/* header row */}
              <div className="grid items-end gap-x-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[8.5px] font-bold uppercase leading-tight text-slate-600" style={{ gridTemplateColumns: COLS }}>
                <Bi vi="STT" en="No." />
                <Bi vi="Dịch vụ" en="Type of service" />
                <Bi vi="Đơn vị tính" en="Unit" />
                <Bi vi="Số lượng" en="Quantity" />
                <Bi vi="Đơn giá" en="Unit price" className="text-right" />
                <Bi vi="Giảm giá" en="Discount" className="text-right" />
                <Bi vi="Tổng giá" en="Total price" className="text-right" />
              </div>
              {o.lines.map((l, i) => (
                <div key={i} className="grid items-center gap-x-2 border-b border-slate-100 px-3 py-2 text-[10px]" style={{ gridTemplateColumns: COLS }}>
                  <span className="text-slate-400 tabular-nums">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block leading-snug text-slate-800">{l.name}</span>
                    {l.gift && <span className="mt-0.5 inline-block rounded border border-emerald-200 bg-emerald-50 px-1 py-px text-[8px] font-semibold text-emerald-700">QUÀ TẶNG · GIFT</span>}
                  </span>
                  <span className="leading-tight text-slate-500">{l.unitVi}<span className="block text-[8.5px] italic text-slate-400">{l.unitEn}</span></span>
                  <span className="tabular-nums text-slate-700">{l.qty}</span>
                  <span className="text-right tabular-nums text-slate-700">{pdfNum(l.price)}</span>
                  <span className="text-right tabular-nums text-slate-500">{l.disc}%</span>
                  <span className="text-right font-semibold tabular-nums text-slate-900">{pdfNum(l.gift ? 0 : Math.round(l.qty * l.price * (1 - l.disc / 100)))}</span>
                </div>
              ))}
              {/* totals — right-aligned block, never a grand total across options */}
              <div className="flex justify-end px-3 py-2.5">
                <div className="w-[300px] text-[10px]">
                  <div className="flex items-center justify-between py-1">
                    <Bi vi="Tạm tính" en="Subtotal" className="text-slate-500" />
                    <span className="tabular-nums text-slate-700">{pdfNum(o.sub)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 py-1">
                    <span className="text-slate-500">Thuế GTGT ({VAT_RATE}%)</span>
                    <span className="tabular-nums text-slate-700">{pdfNum(o.vat)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-slate-800 pt-1.5">
                    <Bi vi={`Tổng đơn hàng sau thuế VAT ${VAT_RATE}%`} en={`Total price after VAT ${VAT_RATE}%`} className="text-[9.5px] font-bold text-slate-800" />
                    <span className="shrink-0 pl-2 text-[13px] font-black tabular-nums text-slate-900">{pdfNum(o.total)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[9.5px] leading-relaxed">
                <p className="text-slate-700"><span className="font-semibold">Bằng chữ:</span> {vnWords(o.total)}.</p>
                <p className="italic text-slate-400"><span className="font-semibold not-italic">In words:</span> {enWords(o.total)}.</p>
              </div>
            </div>

            {/* benefits per package */}
            {o.feats.map((f, i) => (
              <div key={i} className="mt-2 rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[9.5px] font-bold text-slate-700">
                  Quyền lợi gói {f.name} trên TopDev.vn
                  <span className="block font-medium italic text-slate-400">Features of {f.name} Package on TopDev.vn</span>
                </p>
                <ol className="mt-1.5 space-y-0.5">
                  {f.items.map((it, j) => (
                    <li key={j} className="flex gap-1.5 text-[9.5px] leading-relaxed text-slate-600">
                      <span className="shrink-0 tabular-nums text-slate-400">{j + 1}.</span>{it}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        ))}

        {/* ── terms & conditions ─────────────────────────────────────── */}
        <section className="mt-6 break-before-page">
          <Bi vi="Điều khoản và điều kiện" en="Terms & Conditions" className="border-b-2 border-slate-800 pb-1 text-[12px] font-bold uppercase tracking-wide text-slate-900" />
          <ol className="mt-2.5 space-y-2.5">
            {QUOTE_TERMS.map((t, i) => (
              <li key={i} className="flex gap-2 text-[9.5px] leading-relaxed">
                <span className="shrink-0 font-bold tabular-nums text-slate-400">{i + 1}.</span>
                <span className="min-w-0">
                  {t.vi.map((p, j) => <span key={j} className={cn('block text-slate-700', j > 0 && 'pl-2')}>{p}</span>)}
                  {t.en.map((p, j) => <span key={j} className={cn('block italic text-slate-400', j > 0 && 'pl-2')}>{p}</span>)}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── signature ──────────────────────────────────────────────── */}
        <div className="mt-8 flex justify-end">
          <div className="w-[260px] text-center">
            <Bi vi={`Đại diện ${ISSUER.brand}`} en={ISSUER.brand} className="text-[10px] font-bold text-slate-800" />
            <p className="mt-0.5 text-[9.5px] text-slate-600">{sd.vi}</p>
            <p className="text-[9.5px] italic text-slate-400">{sd.en}</p>
            <div className="mt-12 border-t border-slate-400 pt-1 text-[9px] text-slate-500">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Viewer chrome around the sheet: zoom, the generated file name, print and
   download. Deliberately NOT an editor — a quotation is composed in the builder;
   this screen only renders it and hands over the file. The rep then sends that
   file themselves and records it with "Mark as sent". */
export function QuotationPdfModal({ q, co, onClose }: { q: Quote; co?: Company; onClose: () => void }) {
  const [zoom, setZoom] = useState(0.85)
  const file = `${q.code}.pdf`
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2.5 text-white">
        <span className="text-[13px] font-semibold">Xuất PDF / Export quotation</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px]">{file}</span>
        <span className="hidden text-[11px] text-slate-400 sm:inline">A4 · dọc / portrait · {q.options} option{q.options > 1 ? 's' : ''}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-600">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">−</button>
            <span className="min-w-[46px] px-1 text-center text-[11px] tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">+</button>
          </div>
          <button className="rounded-md border border-slate-600 px-2.5 py-1 text-[12px] font-medium hover:bg-white/10">In / Print</button>
          {/* Download is the primary action now: the rep sends the file themselves,
              through their own mailbox or Zalo, and records that with "Mark as sent". */}
          <button className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-slate-900 hover:opacity-90">Tải PDF</button>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-300 hover:bg-white/10">✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div style={{ width: 794 * zoom, margin: '0 auto' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 794 }}>
            <QuotationPdfDoc q={q} co={co} />
          </div>
        </div>
      </div>
      <p className="border-t border-slate-700 bg-slate-900 px-4 py-2 text-[10.5px] leading-relaxed text-slate-400">
        Nội dung y hệt bản PDF khách đang dùng — chỉ tinh chỉnh trình bày: cặp Việt/Anh xếp chồng thay vì viết liền, bảng có cột và số canh phải, mỗi option là một khối riêng có tổng riêng (các option là <b className="text-slate-200">lựa chọn thay thế</b>, không bao giờ cộng lại).
      </p>
    </div>
  )
}
