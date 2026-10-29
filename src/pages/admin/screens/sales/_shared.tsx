import { AC_STATUS, coId, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { PAY_META, SARAMIN_BLUE, SARAMIN_MARK_D, payLate, payStatus } from '@/pages/admin/data/sales'
import type { PayFacts, QrState } from '@/pages/admin/data/sales'
import { InfoBit } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/* Confirmation card — mirrors CompanyInfoCard on Create job. Its job is to let the
   rep verify they picked the right company, and it doubles as the VAT-billing
   read-out: legal name, MST and registered address all print on the invoice, and
   they live on the company record rather than being re-entered per quotation. */
export function QuoteCompanyCard({ c }: { c: Company }) {
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()
  return (
    <div className="rounded-lg border border-line bg-canvas/40 p-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-surface text-[12px] font-bold text-brand">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">{coLabel(c)} <span className="text-[11px] font-normal text-muted">· ID {coId(c)}</span></p>
          <p className="truncate text-[11px] text-muted">{c.industry} · {c.size} staff · {c.address}</p>
        </div>
        {/* Customer status only. The pipeline STAGE is a property of the deal, and
            on a quotation the deal's stage is already implied by the quotation's own
            status — two stage-ish badges on one card is one too many. */}
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {c.account && <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-2.5 sm:grid-cols-4">
        <InfoBit label="Tên pháp lý / Legal name" value={c.legalName} hint="prints on the invoice" />
        <InfoBit label="Mã số thuế / Tax code" value={c.tax} mono hint="prints on the invoice" />
        <InfoBit label="Người liên hệ / Contact" value={c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]} hint={c.contact.split(' · ')[1] ?? ''} />
        <InfoBit label="Email" value={`contact@${c.domain}`} hint="send-to address" />
      </div>
    </div>
  )
}

export function SaraminMark({ width = 104, fill = SARAMIN_BLUE }: { width?: number; fill?: string }) {
  return (
    <svg viewBox="0 0 123.3 31" width={width} height={(width * 31) / 123.3} role="img" aria-label="Saramin">
      <path d={SARAMIN_MARK_D} fill={fill} fillRule="evenodd" />
    </svg>
  )
}

/** Payment read-out. Overdue also says HOW late, because "overdue" alone does not
    tell a rep whether to send a reminder or escalate. On a Wooribank row the QR
    rides underneath as a small note — never a column of its own, because a QR is
    a notice about one email, not a status of the money. */
export function PayCell({ facts, qr }: { facts: PayFacts; qr?: QrState | null }) {
  const st = payStatus(facts)
  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5">
      <span className="flex min-w-0 items-center gap-1.5" title={PAY_META[st].vi}>
        <Pill tone={PAY_META[st].tone}>{st}</Pill>
        {/* The collection DATE moved to its own column (2026-08-23). What stays here
            is the lateness, which is not a date the rep records but a number derived
            from one they have not — it belongs beside the status it explains. */}
        {st === 'Overdue' && <span className="shrink-0 text-[10px] font-medium text-rose-600 tabular-nums">+{payLate(facts)}d</span>}
      </span>
      {/* Only the two states a rep acts on. A QR already paid is said by the chip. */}
      {qr?.kind === 'sent' && <span className="text-[10px] text-muted tabular-nums">QR hết hạn {qr.expires.slice(0, 5)}</span>}
      {qr?.kind === 'expired' && <span className="text-[10px] font-medium text-rose-600 tabular-nums">QR đã hết hạn {qr.expires.slice(0, 5)}</span>}
    </span>
  )
}

/** The QR line on the PO / invoice detail. Read-only, three states, no button —
    an expired QR is gone for good; the customer pays by ordinary transfer and
    Kế toán confirms it on the invoice. */
export function QrLine({ qr }: { qr: QrState | null }) {
  if (!qr) return null
  const dm = (d: string) => d.slice(0, 5)
  if (qr.kind === 'paid') return <p className="text-[11.5px] font-medium text-emerald-700">✓ Đã thanh toán qua QR ngày {dm(qr.paidAt!)}</p>
  if (qr.kind === 'expired') return <p className="text-[11.5px] font-medium text-rose-600">QR đã hết hạn {dm(qr.expires)} — khách chưa thanh toán qua QR</p>
  return <p className="text-[11.5px] text-ink/80">QR đã gửi {dm(qr.sent)} · hết hạn 23:59 ngày {dm(qr.expires)}</p>
}
