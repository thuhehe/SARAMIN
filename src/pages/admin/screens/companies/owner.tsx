import { useState } from 'react'
import { cn } from '@/lib/utils'
import { RO_HINT, useReadOnly } from '@/pages/admin/ctx'
import { CO_STATUS } from '@/pages/admin/data/companies'
import type { CoStatus, Company } from '@/pages/admin/data/companies'
import { SALES_STAGES, companyOwnerHistory } from '@/pages/admin/data/companyOwner'
import type { CoOwnerTenure } from '@/pages/admin/data/companyOwner'
import { DetailCard } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/* `tenures` overrides the derived chain. It exists for a company that has been
   RELEASED back to the Free-data pool: the row is pool data now, but the tenures it
   accumulated while it was a customer are real history and must not disappear
   because the record changed lists. */
export function OwnerHistory({ c, tenures }: { c: Company; tenures?: CoOwnerTenure[] }) {
  const hist = tenures ?? companyOwnerHistory(c)
  /* The header counts HANDOVERS, not owners — a company always has exactly one
     owner, so "N owners" would read as if it could hold several at once. With a
     long chain the number is the thing a lead actually wants ("this account has
     moved five times"), which is why it is worth stating at all. */
  const moves = hist.filter((t) => !t.created && !t.released).length
  /* A CLOSED chain: the newest tenure has a real end date, which happens when the
     company was released back to the Free-data pool. Nobody owns it now, so the top
     entry must not be badged "Current" — that would name a rep who handed it back
     as the person to call. */
  const closed = hist.length > 0 && (hist[0].released || hist[0].to !== 'now')
  return (
    <DetailCard
      title="Owner history"
      action={<span className="text-[11px] text-faint">{closed ? 'chuỗi đã đóng — hiện không ai phụ trách' : moves === 0 ? 'chưa chuyển giao lần nào' : `${moves} lần chuyển giao`}</span>}
    >
      <ol className="space-y-2.5">
        {hist.map((t, i) => (
          <li key={i} className="relative pl-4">
            {/* The release is an ownership EVENT, not a tenure — amber dot, no date
                range, because nothing began at that moment. */}
            <span className={cn('absolute left-0 top-[5px] h-2 w-2 rounded-full', t.released ? 'bg-amber-500' : i === 0 ? 'bg-brand' : 'bg-line')} />
            {i < hist.length - 1 && <span className="absolute bottom-[-10px] left-[3px] top-4 w-px bg-line-soft" />}
            <div className="flex items-center justify-between gap-2">
              <span className={cn('truncate text-[12.5px] font-medium', t.released ? 'text-amber-800' : 'text-ink')}>{t.owner}</span>
              {t.released
                ? <span className="shrink-0 text-[10.5px] tabular-nums text-faint">{t.from}</span>
                : i === 0 && !closed
                  ? <Pill tone="active">Current</Pill>
                  : <span className="shrink-0 text-[10.5px] tabular-nums text-faint">{t.from} – {t.to}</span>}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
              {!t.released && i === 0 && !closed && <span className="tabular-nums text-muted">{t.from} – now · </span>}
              {t.released
                ? <span className="text-amber-800/80">↩ Trả về bể dữ liệu — công ty rời CRM, chờ sales khác nhận</span>
                : t.created ? (c.fromPool ? <span className="text-ink/70">Nhận từ Free data — duyệt bởi {t.by}</span> : 'Created the lead') : <><span className="text-ink/70">↔ Reassigned by {t.by}</span></>}
              {' · '}{t.reason}
            </p>
          </li>
        ))}
      </ol>
    </DetailCard>
  )
}

export function PipelineStatusPicker({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [stage, setStage] = useState<CoStatus>(c.status)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [reason, setReason] = useState('')
  const terminal = stage === 'Invoice'

  const pick = (next: CoStatus) => {
    if (next === 'Lost') { setClosing(true); setOpen(false); return }
    setStage(next); setOpen(false)
  }

  return (
    <span className="relative inline-flex">
      {/* The chevron sits INSIDE the chip. A wrapper border plus a hover label was
          three signals doing one signal's job — the chevron alone already says
          "this opens", and keeping it inside means the control still reads as one
          badge among the others rather than as a box around one. */}
      <button
        onClick={() => { if (!ro && !terminal) setOpen((o) => !o) }}
        disabled={ro || terminal}
        title={ro ? RO_HINT : terminal ? 'Deal đã đóng thắng — không còn giai đoạn nào để chuyển.' : 'Đổi giai đoạn pipeline'}
        className={cn('inline-flex rounded-full', ro || terminal ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80')}
      >
        <Pill tone={CO_STATUS[stage].tone}>
          {CO_STATUS[stage].label}
          {!ro && !terminal && <span className={cn('text-[8px] leading-none transition-transform', open && 'rotate-180')}>▼</span>}
        </Pill>
      </button>

      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <span className="absolute left-0 top-full z-20 mt-1 block w-[290px] overflow-hidden rounded-lg border border-line bg-surface text-left shadow-lg">
            {SALES_STAGES.map((st) => (
              <button key={st} onClick={() => pick(st)} className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-canvas', st === stage && 'bg-brand-soft/50')}>
                <Pill tone={CO_STATUS[st].tone}>{CO_STATUS[st].label}</Pill>
                {st === stage && <span className="ml-auto text-[10px] font-medium text-brand">hiện tại</span>}
              </button>
            ))}
            <button onClick={() => pick('Lost')} className="flex w-full items-center gap-2 border-t border-line-soft px-2.5 py-1.5 text-left hover:bg-canvas">
              <Pill tone={CO_STATUS.Lost.tone}>{CO_STATUS.Lost.label}</Pill>
              <span className="text-[10.5px] text-muted">— đóng deal, cần lý do</span>
            </button>
          </span>
        </>
      )}

      {/* Lost is the only exit a human takes on purpose, so it is the only one that
          asks why — the reason is what makes the loss report worth reading. */}
      {closing && (
        <span className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={() => setClosing(false)}>
          <span className="my-4 block w-full max-w-[420px] rounded-2xl border border-line bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-bold text-ink">Đóng deal — Lost</p>
            <p className="mt-0.5 text-[11.5px] text-muted">Công ty vẫn giữ nguyên customer status và ở lại danh sách nurture. Một báo giá mới sẽ mở lại deal.</p>
            <p className="mb-1 mt-3 block text-[11.5px] font-medium text-ink/80">Lý do <span className="text-rose-500">*</span></p>
            <span className="flex flex-wrap gap-1.5">
              {['Giá cao', 'Chọn đối thủ', 'Cắt ngân sách', 'Không còn nhu cầu', 'Mất liên lạc'].map((r) => (
                <button key={r} onClick={() => setReason(r)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', reason === r ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{r}</button>
              ))}
            </span>
            <span className="mt-3 flex justify-end gap-2">
              <button onClick={() => setClosing(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Huỷ</button>
              <button
                disabled={!reason}
                onClick={() => { setStage('Lost'); setClosing(false) }}
                className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', reason ? 'bg-rose-600 hover:opacity-90' : 'cursor-not-allowed bg-line')}
              >
                Đóng deal
              </button>
            </span>
          </span>
        </span>
      )}
    </span>
  )
}
