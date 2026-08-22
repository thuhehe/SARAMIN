import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LField, LabelRow, TArea } from '@/pages/admin/ui/fields'
import { JobGroup } from '@/pages/admin/ui/form'

/* ── System → Company information (issuer) ────────────────────────────────────
   The ONE place the letterhead that prints on every selling document is set:
   logo, VN + EN legal name, VN + EN address, website, plus the tax identity and
   bank details the order and invoice need. Never typed per quotation — otherwise
   the same company appears three different ways across three documents, and a
   move of office means editing every template. */
export function AdminIssuer() {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const NAME = { VI: 'CÔNG TY TNHH DAOUKIWOOM INNOVATION', EN: 'DAOUKIWOOM INNOVATION COMPANY LIMITED' }
  const ADDR = {
    VI: 'Tầng 12, 13 & 14, Tòa nhà AP, 518B Điện Biên Phủ, Phường Thạnh Mỹ Tây, Thành Phố Hồ Chí Minh, Việt Nam',
    EN: 'Level 12, 13 & 14, AP Tower, 518B Dien Bien Phu Street, Thanh My Tay Ward, Ho Chi Minh City, Vietnam',
  }
  return (
    <div className="max-w-[900px]">
      <p className="mb-3 max-w-[70ch] text-[11.5px] leading-relaxed text-muted">
        The issuer identity printed at the top of every quotation, sales order and VAT invoice. Set once here —
        documents read it, so nobody retypes it and past documents keep the version they were sent with.
      </p>

      {/* live letterhead preview — what the customer actually sees */}
      <div className="mb-4 overflow-hidden rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-line bg-canvas/50 px-3 py-1.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Letterhead preview</p>
          <div className="flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
            {(['VI', 'EN'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={cn('px-2 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 bg-surface p-4">
          <div className="min-w-0 text-[11.5px] leading-relaxed">
            <p className="font-bold text-ink">{NAME.VI}</p>
            <p className="font-bold text-ink">{NAME.EN}</p>
            <p className="mt-0.5 text-ink/80">{ADDR[lang]}</p>
            <p className="text-brand">https://topdev.vn</p>
            <p className="mt-1.5 text-ink/70">Báo giá bởi / Proposed by: Nguyễn Thị Lan | lan.nguyen@topdev.vn <span className="text-faint">— the signed-in rep, not a setting</span></p>
          </div>
          <div className="grid h-12 w-28 shrink-0 place-items-center rounded-md border border-dashed border-line bg-canvas/60 text-[11px] font-bold tracking-tight text-ink/60">saramin</div>
        </div>
      </div>

      <div className="space-y-4">
        <JobGroup title="Legal identity">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Tên công ty (VI)" req value={NAME.VI} hint="Prints on line 1 of the letterhead." />
            <LField label="Company name (EN)" req value={NAME.EN} hint="Prints on line 2 — both always print, in both languages." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Mã số thuế / Tax code" req value="0313545562" hint="The ISSUER’s MST — not the customer’s." />
            <LField label="Website" value="https://topdev.vn" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TArea label="Địa chỉ (VI)" req value={ADDR.VI} rows={2} />
            <TArea label="Address (EN)" req value={ADDR.EN} rows={2} />
          </div>
        </JobGroup>

        <JobGroup title="Brand">
          <div>
            <LabelRow label="Logo" />
            <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 p-3">
              <div className="grid h-12 w-28 shrink-0 place-items-center rounded-md border border-dashed border-line bg-surface text-[11px] font-bold tracking-tight text-ink/60">saramin</div>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-ink/80">saramin-logo.svg · 420×96</p>
                <p className="text-[10.5px] text-faint">SVG or PNG at 2× · max 400 KB · transparent background. Printed top-right on every document.</p>
              </div>
              <button className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">Replace</button>
            </div>
          </div>
        </JobGroup>

        <JobGroup title="Document defaults">
          <div className="grid grid-cols-3 gap-3">
            <LField label="Thuế suất VAT / VAT rate" req value="8%" select hint="A State rate change is made here once (T&C clause 6). A sent document keeps the rate it was sent with." />
            <LField label="Quotation validity" req value="Đến hết tháng / End of month" select hint="Every quotation lapses on the last day of the month it was raised in — so validity shrinks through the month." />
            <LField label="Discount needing approval" req value="> 20%" hint="Above this, Send is blocked pending a sales lead." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LField label="Quotation no. format" value="QUO-{seq}-{MM}-{YYYY}" hint="Gapless sequence." />
            <LField label="Sales order no. format" value="PO-{seq6}-{MM}-{YYYY}" hint="Same shape as quotation and invoice — only the prefix differs." />
            <LField label="Support email" value="customercare@topdev.vn" hint="Printed in T&C clause 6." />
          </div>
        </JobGroup>

        <JobGroup title="Bank details — printed on the order for payment">
          <div className="grid grid-cols-3 gap-3">
            <LField label="Ngân hàng / Bank" req value="Vietcombank — CN Tân Bình" />
            <LField label="Số tài khoản / Account no." req value="0071 0004 12345" />
            <LField label="Chủ tài khoản / Account name" req value="CONG TY TNHH DAOUKIWOOM INNOVATION" />
          </div>
          <p className="text-[10.5px] leading-relaxed text-faint">
            Sent with the sales order because the default payment term is 100% in advance — the customer pays before the VAT
            e-invoice is issued (T&amp;C clause 3).
          </p>
        </JobGroup>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-amber-900">
          Editing these values is <b>versioned, not retroactive</b>. Documents already sent keep the letterhead, VAT rate and
          bank details they were issued with — reprinting a year-old quotation must produce the identical page.
        </p>
        <button className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Save</button>
      </div>
    </div>
  )
}
