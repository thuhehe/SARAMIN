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
 * Selection order is display order on the jobseeker page, so the reorder arrows are
 * the employer's only way to lead with their strongest benefit.
 */
import { useState } from 'react'
import { BENEFIT_TYPES, BENEFIT_MAX, benefitByKey } from '@/data/benefits'
import { cn } from '@/lib/utils'

export interface PickedBenefit { key: string; text: string; title?: string }

export function BenefitsField({
  initial = ['pay', 'health', 'leave'],
  companyBenefits = [],
  companyName = 'công ty',
  max = BENEFIT_MAX,
  label = 'Phúc lợi riêng của vị trí này',
}: {
  initial?: string[]
  /** Benefit type keys declared on the COMPANY page — inherited by every job of
      that company, shown here read-only so the employer can see what they do NOT
      need to retype. The company page is the source of truth for these. */
  companyBenefits?: string[]
  companyName?: string
  /** The JOB cap is 6 — twenty benefits on one ad reads as noise and nothing
      stands out. The COMPANY PAGE declares the employer's general welfare, is read
      once rather than scanned against rivals, and is allowed the whole list. */
  max?: number
  label?: string
}) {
  const [picked, setPicked] = useState<PickedBenefit[]>(() =>
    initial.map((k) => ({ key: k, text: benefitByKey(k)?.hint ?? '' })),
  )
  const full = picked.length >= max
  const has = (k: string) => picked.some((p) => p.key === k)

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
        <span className={cn('text-[10.5px]', full ? 'font-medium text-amber-700' : 'text-faint')}>
          {picked.length}/{max} {full ? '— đã đủ' : 'đã chọn'}
        </span>
      </div>

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
        Chỉ khai những gì <b className="text-ink/70">khác với mặt bằng chung</b> của công ty (thưởng dự án, phụ cấp ca đêm,
        laptop cấp riêng…). Loại phúc lợi lấy từ Master data (có icon, dịch sẵn, dùng được cho bộ lọc tìm việc); phần mô tả
        do công ty tự viết — tiếng Việt bắt buộc. Thứ tự ở đây là thứ tự hiển thị trên trang jobseeker.
      </p>

      {/* What the job INHERITS. Shown read-only at the point of writing, because an
          employer who cannot see the company benefits retypes them — which is exactly
          how the two surfaces drift apart. */}
      {companyBenefits.length > 0 && (
        <div className="mt-3 rounded-lg border border-line bg-canvas/40 p-3">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11.5px] font-medium text-ink/80">
              Phúc lợi chung của công ty
              <span className="ml-1.5 rounded border border-line bg-surface px-1.5 py-px text-[9.5px] font-normal text-muted">tự động hiển thị · chỉ đọc</span>
            </p>
            <a className="cursor-pointer text-[10.5px] font-medium text-brand hover:underline">Sửa ở trang công ty ↗</a>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {companyBenefits.map((k) => {
              const t = benefitByKey(k)
              if (!t) return null
              return (
                <span key={k} className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-[11px] text-ink/70">
                  <t.Icon className="h-3 w-3 shrink-0 text-muted" />{t.vi}
                </span>
              )
            })}
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
            Những mục này sẽ tự hiển thị bên dưới phần phúc lợi của vị trí trên trang tin — <b className="text-ink/70">không cần gõ lại</b>.
            Sửa một lần ở trang {companyName}, mọi tin đang mở cập nhật theo.
          </p>
        </div>
      )}
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
