/*
 * Benefits picker — the employer side of the job form.
 *
 * Replaces a free-text "Benefits" textarea. Two things it has to get right:
 *
 *  · The grid is the WHOLE list, visible at once (12 types, 4×3). No accordion, no
 *    search box — those exist to cope with a list too long to show, and the list was
 *    deliberately cut to a size that does not need them.
 *  · Picking a type opens a description box PREFILLED with a suggestion. A blank box
 *    gets skipped or filled with one dead word; a sentence to edit gets edited.
 *
 * The COMPANY SET is the starting point, not a lock: a new job opens prefilled with
 * the company-page benefits (a copy) and the editor curates freely per job. The two
 * safety valves are "↺ Về mặc định công ty" (replace with the company set) and a
 * read-only preview of the full set — so the default is always one click away, but a
 * company-page edit never silently rewrites a posting someone curated on purpose.
 *
 * Selection order is display order on the jobseeker page, so the reorder arrows are
 * the employer's only way to lead with their strongest benefit.
 */
import { useState } from 'react'
import { BENEFIT_TYPES, BENEFIT_MAX, benefitByKey } from '@/data/benefits'
import { cn } from '@/lib/utils'

export interface PickedBenefit { key: string; text: string; title?: string }

export function BenefitsField({
  initial,
  companyBenefits = [],
  companyName = 'công ty',
  max = BENEFIT_MAX,
  label = 'Phúc lợi của tin này',
}: {
  /** Per-job benefit keys. Omit on a NEW job — the field then prefills from
      `companyBenefits` (copy-on-create, capped at `max`). */
  initial?: string[]
  /** Benefit type keys declared on the COMPANY page — the DEFAULT SET a job starts
      from. Powers the prefill, the "↺ Về mặc định công ty" reset and the read-only
      preview. A copy, never a live link: editing the company page must not silently
      rewrite a posting someone curated on purpose. */
  companyBenefits?: string[]
  companyName?: string
  /** The JOB cap is 6 — twenty benefits on one ad reads as noise and nothing
      stands out. The COMPANY PAGE declares the employer's general welfare, is read
      once rather than scanned against rivals, and is allowed the whole list. */
  max?: number
  label?: string
}) {
  const fromKeys = (keys: string[]) =>
    keys.slice(0, max).map((k) => ({ key: k, text: benefitByKey(k)?.hint ?? '' }))
  const companyDefault = () => fromKeys(companyBenefits)

  // Copy-on-create: a new job starts as the company set; `initial` (an existing
  // job's own list) wins when provided.
  const [picked, setPicked] = useState<PickedBenefit[]>(() => fromKeys(initial ?? companyBenefits))
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const full = picked.length >= max
  const has = (k: string) => picked.some((p) => p.key === k)
  const capped = companyBenefits.length > max

  // Diverged = a reset would change something. Order counts: it is display order.
  const diverged =
    picked.length !== Math.min(companyBenefits.length, max) ||
    picked.some((p, i) => p.key !== companyBenefits[i] || p.text !== (benefitByKey(p.key)?.hint ?? ''))

  const toggle = (k: string) => {
    setPicked((prev) => {
      if (prev.some((p) => p.key === k)) return prev.filter((p) => p.key !== k)
      if (prev.length >= max) return prev
      return [...prev, { key: k, text: benefitByKey(k)?.hint ?? '' }]
    })
  }
  const move = (i: number, d: -1 | 1) =>
    setPicked((prev) => {
      const j = i + d
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <label className="text-[11.5px] font-medium text-ink/80">{label}</label>
        <span className="flex shrink-0 items-baseline gap-2.5">
          {companyBenefits.length > 0 && (
            <>
              <button
                onClick={() => setPreviewing((v) => !v)}
                className="text-[10.5px] font-medium text-brand hover:underline"
              >
                {previewing ? 'Ẩn phúc lợi công ty' : 'Xem phúc lợi công ty'}
              </button>
              {/* Reset replaces, never merges — hence the confirm step. Disabled
                  while the list already IS the default, so the button doubles as
                  a "you have diverged" indicator. */}
              <button
                onClick={() => diverged && setConfirmingReset(true)}
                disabled={!diverged}
                title={diverged ? 'Thay danh sách hiện tại bằng bộ phúc lợi mặc định của công ty' : 'Đang đúng bộ mặc định của công ty'}
                className={cn('text-[10.5px] font-medium', diverged ? 'text-brand hover:underline' : 'cursor-default text-faint')}
              >
                ↺ Về mặc định công ty
              </button>
            </>
          )}
          <span className={cn('text-[10.5px]', full ? 'font-medium text-amber-700' : 'text-faint')}>
            {picked.length}/{max} {full ? '— đã đủ' : 'đã chọn'}
          </span>
        </span>
      </div>

      {/* Reset confirm — inline, not a modal: the decision is small and local. */}
      {confirmingReset && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[11px] leading-relaxed text-amber-800">
            Thay toàn bộ danh sách hiện tại bằng bộ mặc định của {companyName}
            {capped ? ` (lấy ${max} mục đầu — bộ công ty có ${companyBenefits.length})` : ''}? Các chỉnh sửa riêng của tin sẽ mất.
          </p>
          <span className="flex shrink-0 gap-1.5">
            <button onClick={() => setConfirmingReset(false)} className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-muted hover:border-ink/40">Giữ nguyên</button>
            <button
              onClick={() => { setPicked(companyDefault()); setConfirmingReset(false) }}
              className="rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:opacity-90"
            >
              ↺ Về mặc định
            </button>
          </span>
        </div>
      )}

      {/* Read-only preview of the FULL company set — what a reset would restore,
          and the reference the editor curates against. */}
      {previewing && companyBenefits.length > 0 && (
        <div className="mb-2 rounded-lg border border-line bg-canvas/40 p-3">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11px] font-medium text-ink/80">
              Bộ phúc lợi mặc định của {companyName}
              <span className="ml-1.5 rounded border border-line bg-surface px-1.5 py-px text-[9.5px] font-normal text-muted">chỉ đọc · {companyBenefits.length} mục</span>
            </p>
            <a className="cursor-pointer text-[10.5px] font-medium text-brand hover:underline">Sửa ở trang công ty ↗</a>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {companyBenefits.map((k) => {
              const t = benefitByKey(k)
              if (!t) return null
              return (
                <span key={k} className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]', has(k) ? 'border-brand/30 bg-brand-soft text-brand' : 'border-line bg-surface text-ink/70')}>
                  <t.Icon className={cn('h-3 w-3 shrink-0', has(k) ? 'text-brand' : 'text-muted')} />{t.vi}
                  {has(k) && <span className="text-[9px]">✓ trong tin</span>}
                </span>
              )
            })}
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
            Tin mới mở form sẽ được điền sẵn bộ này; sửa trang công ty <b className="text-ink/70">không</b> tự đổi các tin đã đăng — dùng “↺ Về mặc định công ty” khi muốn lấy bản mới nhất.
          </p>
        </div>
      )}

      {/* the whole taxonomy, one screen */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {BENEFIT_TYPES.map((b) => {
          const on = has(b.key)
          const blocked = !on && full
          return (
            <button
              key={b.key}
              onClick={() => toggle(b.key)}
              disabled={blocked}
              title={blocked ? `Tối đa ${max} phúc lợi — bỏ bớt một mục trước` : b.en}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand/40',
                blocked && 'cursor-not-allowed opacity-40 hover:border-line',
              )}
            >
              <b.Icon className={cn('h-4 w-4 shrink-0', on ? 'text-brand' : 'text-faint')} />
              <span className={cn('min-w-0 truncate text-[11.5px]', on ? 'font-semibold text-brand' : 'text-ink/80')}>
                {b.vi}
              </span>
            </button>
          )
        })}
      </div>

      {/* one description per picked type — order here is order on the jobseeker page */}
      {picked.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {picked.map((p, i) => {
            const t = benefitByKey(p.key)
            if (!t) return null
            return (
              <div key={p.key} className="rounded-lg border border-line bg-canvas/30 p-2.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <t.Icon className="h-3.5 w-3.5 shrink-0 text-brand" />
                  {p.key === 'other' ? (
                    <input
                      value={p.title ?? ''}
                      onChange={(e) => setPicked((prev) => prev.map((x) => (x.key === p.key ? { ...x, title: e.target.value } : x)))}
                      placeholder="Tên phúc lợi…"
                      className="min-w-0 flex-1 rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-faint focus:border-brand"
                    />
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink">{t.vi}</span>
                  )}
                  <span className="flex shrink-0 items-center gap-0.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} title="Lên" className="rounded px-1 text-[11px] text-faint hover:text-ink disabled:opacity-30">↑</button>
                    <button onClick={() => move(i, 1)} disabled={i === picked.length - 1} title="Xuống" className="rounded px-1 text-[11px] text-faint hover:text-ink disabled:opacity-30">↓</button>
                    <button onClick={() => toggle(p.key)} title="Bỏ" className="rounded px-1 text-[11px] text-faint hover:text-rose-600">✕</button>
                  </span>
                </div>
                <textarea
                  value={p.text}
                  onChange={(e) => setPicked((prev) => prev.map((x) => (x.key === p.key ? { ...x, text: e.target.value } : x)))}
                  rows={2}
                  placeholder={t.hint || 'Mô tả phúc lợi này…'}
                  className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-brand"
                />
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
        Tin mới được <b className="text-ink/70">điền sẵn bộ phúc lợi của công ty</b> — thêm, bớt, sửa lời tuỳ ý cho vị trí này
        (bỏ mục không liên quan, thêm thưởng dự án, phụ cấp ca đêm…). Loại phúc lợi lấy từ Master data (có icon, dịch sẵn,
        dùng được cho bộ lọc tìm việc); mô tả tiếng Việt bắt buộc. Thứ tự ở đây là thứ tự hiển thị trên trang jobseeker.
      </p>
    </div>
  )
}

/** Jobseeker-facing render — icon + title + description, one card each. */
export function BenefitCards({ items }: { items: { key: string; text: string; title?: string }[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((p) => {
        const t = benefitByKey(p.key)
        if (!t) return null
        return (
          <div key={p.key} className="flex gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5">
            <t.Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-ink">{p.title || t.vi}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{p.text}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
