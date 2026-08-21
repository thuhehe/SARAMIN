/*
 * Benefits picker — the employer side of the job form.
 *
 * Replaces a free-text "Benefits" textarea. Two things it has to get right:
 *
 *  · The grid is the WHOLE list, visible at once (11 types, from the client's
 *    `benefit` master data). No accordion, no
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
import { useRef, useState } from 'react'
import { BENEFIT_TYPES, benefitByKey } from '@/data/benefits'
import { cn } from '@/lib/utils'

export interface PickedBenefit { key: string; text: string }

export function BenefitsField({
  initial,
  companyBenefits = [],
  companyName = 'công ty',
  label = 'Phúc lợi của tin này',
}: {
  /** Per-job benefit keys. Omit on a NEW job — the field then prefills from
      `companyBenefits` (copy-on-create). */
  initial?: string[]
  /** Benefit type keys declared on the COMPANY page — the DEFAULT SET a job starts
      from. Powers the prefill, the "↺ Về mặc định công ty" reset and the read-only
      preview. A copy, never a live link: editing the company page must not silently
      rewrite a posting someone curated on purpose. */
  companyBenefits?: string[]
  companyName?: string
  label?: string
}) {
  /* NO CAP. Each of the 11 types can be picked once, so the list is self-limiting
     at 11 — an artificial ceiling only ever blocked a legitimate benefit and made
     the greyed-out grid read as "restricted to the company's set". */
  const fromKeys = (keys: string[]) =>
    keys.map((k) => ({ key: k, text: benefitByKey(k)?.hint ?? '' }))
  const companyDefault = () => fromKeys(companyBenefits)

  // Copy-on-create: a new job starts as the company set; `initial` (an existing
  // job's own list) wins when provided.
  const [picked, setPicked] = useState<PickedBenefit[]>(() => fromKeys(initial ?? companyBenefits))
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const has = (k: string) => picked.some((p) => p.key === k)

  // Diverged = a reset would change something. Order counts: it is display order.
  const diverged =
    picked.length !== companyBenefits.length ||
    picked.some((p, i) => p.key !== companyBenefits[i] || p.text !== (benefitByKey(p.key)?.hint ?? ''))

  const toggle = (k: string) => {
    setPicked((prev) => {
      if (prev.some((p) => p.key === k)) return prev.filter((p) => p.key !== k)
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
          <span className="text-[10.5px] text-faint">{picked.length} đã chọn</span>
        </span>
      </div>

      {/* Reset confirm — inline, not a modal: the decision is small and local. */}
      {confirmingReset && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[11px] leading-relaxed text-amber-800">
            Thay toàn bộ danh sách hiện tại bằng bộ mặc định của {companyName} ({companyBenefits.length} mục)? Các chỉnh sửa riêng của tin sẽ mất.
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
            Tin mới mở form sẽ được điền sẵn bộ này — <b className="text-ink/70">chỉ là mặc định</b>, tin vẫn chọn được loại ngoài bộ này.
            Sửa trang công ty <b className="text-ink/70">không</b> tự đổi các tin đã đăng — dùng “↺ Về mặc định công ty” khi muốn lấy bản mới nhất.
          </p>
        </div>
      )}

      {/* the whole taxonomy, one screen — ALL 11 codes, always selectable. The
          company set is the default the job starts from, never a restriction, and
          there is no cap: nothing here is ever greyed out. */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {BENEFIT_TYPES.map((b) => {
          const on = has(b.key)
          return (
            <button
              key={b.key}
              onClick={() => toggle(b.key)}
              title={b.en}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand/40',
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
                  {/* The title is always the master-data label. The client's list has
                      no "Khác" code, so there is no free-text benefit name — which is
                      what keeps every company's benefits comparable and filterable. */}
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink">{t.vi}</span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} title="Lên" className="rounded px-1 text-[11px] text-faint hover:text-ink disabled:opacity-30">↑</button>
                    <button onClick={() => move(i, 1)} disabled={i === picked.length - 1} title="Xuống" className="rounded px-1 text-[11px] text-faint hover:text-ink disabled:opacity-30">↓</button>
                    <button onClick={() => toggle(p.key)} title="Bỏ" className="rounded px-1 text-[11px] text-faint hover:text-rose-600">✕</button>
                  </span>
                </div>
                {/* Rich text, not a plain box: a benefit description is naturally a
                    LIST, and a bare textarea forces it into a run-on sentence. */}
                <RichArea
                  value={p.text}
                  onChange={(v) => setPicked((prev) => prev.map((x) => (x.key === p.key ? { ...x, text: v } : x)))}
                  placeholder={t.hint || 'Mô tả phúc lợi này…'}
                />
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
        Tin mới được <b className="text-ink/70">điền sẵn bộ phúc lợi của công ty</b> — đó chỉ là <b className="text-ink/70">mặc định để hiển thị</b>,
        không phải danh sách bị giới hạn: chọn được <b className="text-ink/70">bất kỳ loại nào, không giới hạn số lượng</b>, kể cả loại công ty chưa khai
        (thưởng dự án, phụ cấp ca đêm, laptop cấp riêng…), và bỏ mục không liên quan đến vị trí. Loại phúc lợi lấy từ Master data
        (có icon, dịch sẵn, dùng được cho bộ lọc tìm việc); mô tả tiếng Việt bắt buộc. Thứ tự ở đây là thứ tự hiển thị trên trang jobseeker.
      </p>
    </div>
  )
}

/**
 * Minimal rich-text box — bold, italic, bullet and numbered list.
 *
 * A benefit description is naturally a LIST ("15 ngày phép · nghỉ sinh nhật ·
 * company trip"), and a plain textarea forces it into a run-on sentence or into
 * whatever bullet glyph the writer happens to type. Storing the marker means the
 * jobseeker page renders a real list instead of a paragraph with dashes in it.
 *
 * The buttons edit the TEXT, not a hidden document model: bullets are inserted as
 * markers at the start of each selected line, bold/italic wrap the selection in
 * markdown. That is deliberate for a wireframe — the control is honest about what
 * it stores, and the stored value stays greppable and diffable. Production can swap
 * the editor without changing the field's shape as long as it keeps emitting the
 * same markup.
 */
export function RichArea({
  value, onChange, placeholder, rows = 2, readOnly,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  readOnly?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /** Wrap the selection (or the caret, giving an empty pair to type into).
      Whitespace at either end is pushed OUTSIDE the marks — "**bold **" fails to
      render as bold in most markdown parsers, and a user who double-clicks a word
      usually catches the trailing space. */
  const wrap = (mark: string) => {
    const el = ref.current
    if (!el) return
    let { selectionStart: a, selectionEnd: b } = el
    while (a < b && /\s/.test(value[a])) a++
    while (b > a && /\s/.test(value[b - 1])) b--
    onChange(value.slice(0, a) + mark + value.slice(a, b) + mark + value.slice(b))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + mark.length, b + mark.length) })
  }

  /** Prefix every line the selection touches — toggling off if they all have it. */
  const list = (kind: 'bullet' | 'number') => {
    const el = ref.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b } = el
    const from = value.lastIndexOf('\n', a - 1) + 1
    const toRaw = value.indexOf('\n', b)
    const to = toRaw === -1 ? value.length : toRaw
    const lines = value.slice(from, to).split('\n')
    const marked = /^\s*([•]|\d+\.)\s/
    const allMarked = lines.every((l) => marked.test(l))
    const out = lines.map((l, i) =>
      allMarked ? l.replace(marked, '') : `${kind === 'bullet' ? '• ' : `${i + 1}. `}${l}`,
    )
    onChange(value.slice(0, from) + out.join('\n') + value.slice(to))
    requestAnimationFrame(() => el.focus())
  }

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button" onClick={onClick} title={title} disabled={readOnly}
      className="grid h-5 w-5 place-items-center rounded text-[11px] text-muted hover:bg-canvas hover:text-ink disabled:opacity-40"
    >{children}</button>
  )

  return (
    <div className={cn('overflow-hidden rounded-md border border-line bg-surface focus-within:border-brand', readOnly && 'opacity-60')}>
      <div className="flex items-center gap-0.5 border-b border-line-soft bg-canvas/40 px-1 py-0.5">
        <Btn onClick={() => wrap('**')} title="Đậm"><b>B</b></Btn>
        <Btn onClick={() => wrap('*')} title="Nghiêng"><i>I</i></Btn>
        <span className="mx-0.5 h-3 w-px bg-line" />
        <Btn onClick={() => list('bullet')} title="Danh sách gạch đầu dòng">•</Btn>
        <Btn onClick={() => list('number')} title="Danh sách đánh số">1.</Btn>
      </div>
      <textarea
        ref={ref}
        value={value} readOnly={readOnly} rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y bg-transparent px-2.5 py-1.5 text-[11.5px] leading-relaxed text-ink outline-none placeholder:text-faint"
      />
    </div>
  )
}

/** Inline markup from RichArea: **bold** and *italic*. */
function inlineRich(t: string): React.ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((seg, i) => {
    if (/^\*\*[^*]+\*\*$/.test(seg)) return <b key={i} className="font-semibold text-ink">{seg.slice(2, -2)}</b>
    if (/^\*[^*]+\*$/.test(seg)) return <i key={i}>{seg.slice(1, -1)}</i>
    return <span key={i}>{seg}</span>
  })
}

/**
 * Renders what RichArea stores. It has to exist: the moment the editor can emit
 * bullets, a reader that prints the raw "• " and "**" is showing the markup rather
 * than the formatting, and every description written as a list looks broken.
 */
export function RichText({ value, className }: { value: string; className?: string }) {
  return (
    <div className={className}>
      {value.split('\n').map((line, i) => {
        const m = line.match(/^\s*([•]|\d+\.)\s+(.*)$/)
        if (m) return (
          <p key={i} className="flex gap-1.5">
            <span className="shrink-0 text-faint">{m[1]}</span>
            <span className="min-w-0">{inlineRich(m[2])}</span>
          </p>
        )
        return line.trim() ? <p key={i}>{inlineRich(line)}</p> : null
      })}
    </div>
  )
}

/** Jobseeker-facing render — icon + title + description, one card each. */
export function BenefitCards({ items }: { items: { key: string; text: string }[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((p) => {
        const t = benefitByKey(p.key)
        if (!t) return null
        return (
          <div key={p.key} className="flex gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5">
            <t.Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-ink">{t.vi}</p>
              <RichText value={p.text} className="mt-0.5 space-y-0.5 text-[11.5px] leading-relaxed text-muted" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
