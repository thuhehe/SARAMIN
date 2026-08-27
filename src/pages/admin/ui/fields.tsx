/*
 * Form and read-out primitives shared across admin screens — labelled fields,
 * detail cards, key/value rows.
 */
import { useState } from 'react'
import { cn } from '@/lib/utils'

/* ── small building blocks for the flow ──────────────────────────────────────── */

/** A labelled boxed value — the prototype's stand-in for a text input. */
export function RField({ label, value, span }: { label: string; value?: string; span?: string }) {
  return (
    <div className={span}>
      <label className="mb-1 block text-[10.5px] font-medium text-ink/70">{label}</label>
      <div className={cn('min-h-[30px] rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px]', value ? 'text-ink/80' : 'text-faint')}>
        {value || '—'}
      </div>
    </div>
  )
}

/** Editable wizard field. */
export function BField({ label, req, value, onChange, placeholder }: { label: string; req?: boolean; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-surface px-2.5 py-2 text-[12px] outline-none focus:border-brand"
      />
    </div>
  )
}

/* ── Contact detail (slide-over) ─────────────────────────────────────────────
   A contact accumulates history a table row cannot hold — status changes, who
   replaced whom, notes over time — so the row links here rather than trying to
   show everything inline. Every ACTION on a contact lives in this panel, which is
   why the list has no Actions column. */
/** Editable SELECT row — for fields whose values come from Master data. */
export function SelectRow({ label, req, value, onChange, options, placeholder, hint }: { label: string; req?: boolean; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; hint?: string }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <label className="text-[10.5px] uppercase tracking-wide text-faint">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand"
      >
        <option value="">{placeholder ?? '— none —'}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}

/** Editable text row — the edit-mode counterpart of KV. */
export function EField({ label, req, value, onChange, mono, hint, after, trail }: { label: string; req?: boolean; value: string; onChange: (v: string) => void; mono?: boolean; hint?: string; after?: React.ReactNode; trail?: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <label className="text-[10.5px] uppercase tracking-wide text-faint">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <div className="mt-1 flex gap-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand', mono && 'font-mono text-[11.5px]')}
        />
        {trail}
      </div>
      {after}
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}

/* ── The public company page, section by section ──────────────────────────────
   The editor is laid out as the LIVE PAGE is laid out (Figma "Company detail",
   node 78:20315) — same sections, same order, same names. HQ fills this in for a
   customer who will not do it themselves, which is most of them at the start, so
   the mapping between "what I typed" and "what appears" has to be obvious.

   Two rules run through the whole thing and explain most of the UI:

    · REQUIRED vs OPTIONAL is the spine. Five things gate publishing (logo,
      display name, industry, ≥1 office, VI introduction). EVERY other section is
      optional and its card simply does not render on the live page while empty —
      which is why each one says so rather than sitting there looking broken.
    · The registry facts are NOT typed here. MST, legal name, company type,
      representative and registered address already live on the company record;
      re-typing them on the page would give one company two tax codes that drift.
      They are shown read-only with a pointer to where they are edited. */

/* ── Fields that WRITE BACK to the company record ─────────────────────────────
   The facts card on the public page (MST, tên pháp lý, quy mô, ngành, địa chỉ…)
   shows the very same values the CRM record holds. Two rules follow, and they are
   not in tension once stated in the right order:

     1. There is ONE stored value per fact. The page never keeps its own copy.
     2. It can be EDITED from here, and the edit lands on the company record —
        the operator is on this tab because the page is missing something, and
        sending them to another tab to fix it is how a page stays half-filled.

   So the row is editable and carries a marker saying where the value actually
   lives. What is forbidden is a SECOND field, not a second editing surface. */
/** A field on the company page. Plain input, select, date, number or a word-capped
    textarea — no "↔ Overview" badge any more: after the registry fields (MST, tên
    pháp lý, tình trạng, người đại diện) moved off this page, what is left is owned
    BY the page, so there is nothing to cross-reference. */
export function PageField({
  label, value, req, ro, hint, options, wide, type, suffix, area, maxWords,
}: {
  label: string; value: string; req?: boolean; ro?: boolean; hint?: string
  /** present → renders a select instead of an input */
  options?: string[]
  wide?: boolean
  type?: 'text' | 'date' | 'number'
  /** unit shown inside the right edge of the box — ₫, người… */
  suffix?: string
  /** a textarea instead of one line, with a live word counter */
  area?: boolean
  maxWords?: number
}) {
  const [v, setV] = useState(value)
  const words = v.trim() ? v.trim().split(/\s+/).length : 0
  const over = maxWords !== undefined && words > maxWords
  /* Money reads back formatted under the box. A raw 44184040000 is unreadable and
     an operator cannot tell a typo'd extra zero from a correct one. */
  const money = type === 'number' && suffix === '₫' && Number(v) > 0
  return (
    <div className={cn(wide && 'sm:col-span-2')}>
      <div className="mb-0.5 flex items-baseline gap-1.5">
        <label className="text-[11px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
        {maxWords !== undefined && (
          <span className={cn('ml-auto shrink-0 text-[9.5px]', over ? 'font-semibold text-rose-600' : 'text-faint')}>
            {words}/{maxWords} từ
          </span>
        )}
      </div>
      {area ? (
        <textarea
          value={v} readOnly={ro} rows={3} onChange={(e) => setV(e.target.value)}
          className={cn('w-full rounded-md border bg-surface px-2.5 py-1.5 text-[12px] leading-relaxed text-ink outline-none placeholder:text-faint',
            over ? 'border-rose-400' : 'border-line focus:border-brand', ro && 'cursor-not-allowed opacity-60')}
        />
      ) : options ? (
        <select
          value={v} disabled={ro} onChange={(e) => setV(e.target.value)}
          className={cn('w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand', ro && 'cursor-not-allowed opacity-60')}
        >
          {/* de-duped: the current value is prepended only when the list lacks it,
              and the list itself may repeat — both would collide as React keys */}
          {[...new Set([v, ...options])].map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <div className="relative">
          <input
            type={type ?? 'text'}
            value={v} readOnly={ro} onChange={(e) => setV(e.target.value)}
            placeholder="—"
            className={cn('w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink outline-none placeholder:text-faint focus:border-brand',
              suffix && 'pr-9', ro && 'cursor-not-allowed opacity-60')}
          />
          {suffix && <span className="pointer-events-none absolute inset-y-0 right-2.5 grid place-items-center text-[11px] text-faint">{suffix}</span>}
        </div>
      )}
      {money && <p className="mt-0.5 text-[10px] font-medium text-brand">{Number(v).toLocaleString('vi-VN')} ₫</p>}
      {hint && <p className="mt-0.5 text-[10px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}

export function DetailCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line-soft px-3.5 py-2.5"><p className="text-[12.5px] font-bold">{title}</p>{action}</div>
      <div className="p-3.5">{children}</div>
    </div>
  )
}
export function KV({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <p className="text-[10.5px] uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('mt-0.5 text-[12.5px]', link ? 'text-brand' : 'text-ink/85')}>{value}</p>
    </div>
  )
}
/* ── Create-lead modal (company-first, adapted from Salesforce) ────────────── */
export function LField({ label, req, value, select, hint }: { label: string; req?: boolean; value: string; select?: boolean; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{value}{select && <span className="ml-auto">▾</span>}</div>
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}
/**
 * A value the system FILLED, shown where a field would be.
 *
 * The distinction it draws is the whole point: an input invites typing, and typing
 * a value the record already holds is how two copies of one fact start to drift.
 * So a derived value keeps the field's position and label — the reader still finds
 * it where the form's rhythm says it should be — but reads as settled, with a tag
 * naming its source so "where did this come from" never needs asking.
 */
export function DerivedField({ label, value, from, hint, mono }: { label: string; value: string; from: string; hint?: string; mono?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-line bg-canvas/60 px-3 py-2 text-[12.5px]">
        <span className={cn('min-w-0 flex-1 truncate text-ink/75', mono && 'font-mono text-[11.5px]')}>{value}</span>
        <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[9.5px] text-faint">{from}</span>
      </div>
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}

/**
 * Group heading inside a detail card — the card counterpart of the create form's
 * JobGroup heading (bold title over a 2px rule), so a record reads with the same
 * landmarks as the form that filled it.
 *
 * Deliberately NOT the faint grey `Section` pill: that one is a step divider inside
 * a wizard and reads as a label on the row beneath it. This is a heading someone
 * SCANS for in a 20-row card, which is a different job and needs different weight.
 *
 * `hint` carries the "this group lives somewhere else" pointer, so the two form
 * groups that are not fields on this card (verification documents, primary contact)
 * still appear in sequence instead of silently vanishing.
 */
export function CardGroup({ title, first, hint }: { title: string; first?: boolean; hint?: React.ReactNode }) {
  return (
    <div className={cn('border-b-2 border-line pb-1.5', first ? 'mb-1.5' : 'mb-1.5 mt-4')}>
      <h4 className="text-[13px] font-bold tracking-tight text-ink">{title}</h4>
      {hint && <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}

export function Section({ title, className }: { title: string; className?: string }) {
  return <p className={cn('mt-2 rounded-md bg-canvas/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted', className)}>{title}</p>
}

/** Interactive combobox — pick a suggested option or type a custom value. */
export function ComboField({ label, req, value: initial, options, placeholder, onChange }: { label: string; req?: boolean; value?: string; options: string[]; placeholder?: string
  /** report the picked value up, for fields that gate another field (e.g. country → city) */
  onChange?: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(initial ?? '')
  const commit = (v: string) => { setVal(v); onChange?.(v) }
  const isExact = options.some((o) => o.toLowerCase() === val.toLowerCase())
  // exact selection (or empty) → show the whole list; mid-typing → filter
  const matches = isExact || val.length === 0 ? options : options.filter((o) => o.toLowerCase().includes(val.toLowerCase()))
  const isCustom = val.length > 0 && !isExact
  return (
    <div className="relative">
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 focus-within:border-brand">
        <input
          value={val}
          onChange={(e) => { commit(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
        />
        <button type="button" onClick={() => setOpen((o) => !o)} className="ml-2 shrink-0 text-muted">▾</button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-lg">
            {matches.map((o) => (
              <button type="button" key={o} onClick={() => { commit(o); setOpen(false) }} className={cn('block w-full px-3 py-1.5 text-left text-[12px] hover:bg-canvas', o === val ? 'font-medium text-brand' : 'text-ink')}>{o}</button>
            ))}
            {isCustom && (
              <button type="button" onClick={() => setOpen(false)} className="block w-full border-t border-line px-3 py-1.5 text-left text-[12px] text-brand hover:bg-canvas">Use “{val}” (custom)</button>
            )}
            {matches.length === 0 && !isCustom && <p className="px-3 py-1.5 text-[11px] text-faint">Type to add a custom value…</p>}
          </div>
        </>
      )}
    </div>
  )
}
/** A derived value shown as information — deliberately not styled as an input. */
export function InfoBit({ label, value, hint, mono }: { label: string; value: string; hint?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('truncate text-[12.5px] font-medium text-ink', mono && 'font-mono')}>{value}</p>
      {hint && <p className="truncate text-[10px] text-faint">{hint}</p>}
    </div>
  )
}
/* ── Convert-lead modal (adapted from Salesforce) ─────────────────────────── */
export function Radio({ on }: { on?: boolean }) {
  return <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand' : 'border-line')}>{on && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
}
/** One bilingual label: Vietnamese leads, English sits under it, muted. */
export function Bi({ vi, en, className, enClass }: { vi: string; en: string; className?: string; enClass?: string }) {
  return (
    <span className={cn('block', className)}>
      <span className="block">{vi}</span>
      <span className={cn('block text-[0.85em] font-normal italic text-slate-500', enClass)}>{en}</span>
    </span>
  )
}

/* ── Create Job — draft field map ─────────────────────────────────────────────
 * A field inventory for the job-create form, NOT final visual design.
 * Structure adapted from the TopDev job dashboard (9-tab layout) and cross-checked
 * against a live Saramin post. Placeholder values are illustrative. Fields tagged
 * `confirm` need client sign-off (legal / VN-market / commercial specifics).
 * ------------------------------------------------------------------------------ */



export function FLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{children}{req && <span className="text-rose-500"> *</span>}</label>
}

/** free-text textarea placeholder */
export function TArea({ label, req, value, rows = 3, hint, extra }: { label: React.ReactNode; req?: boolean; value: string; rows?: number; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-faint" style={{ minHeight: rows * 20 }}>{value}</div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/** multi-value chip / token input placeholder */
export function ChipField({ label, req, chips, placeholder, hint, extra }: { label: React.ReactNode; req?: boolean; chips: string[]; placeholder: string; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5">
        {chips.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">{c}<span className="text-brand/50">×</span></span>
        ))}
        <span className="px-1 text-[12px] text-faint">{placeholder}</span>
      </div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/** inline single-value field with optional provenance/confirm markers + hint */
export function FField({ label, req, value, select, hint, extra }: { label: React.ReactNode; req?: boolean; value: string; select?: boolean; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{value}{select && <span className="ml-auto">▾</span>}</div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/** Field label row with an optional right-aligned control (e.g. Show-to-jobseekers). */
export function LabelRow({ label, req, right }: { label: string; req?: boolean; right?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <label className="text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  )
}

/**
 * Interactive single-select dropdown (click to open, pick one).
 *
 * `createLabel` turns on the inline "＋ Create new…" affordance: master-data-backed
 * fields (category, level, industry, currency…) let an operator add a new option
 * without leaving the form — the new value is added to Master data and selected.
 */
export function SelectField({ label, req, value, options, extra, createLabel, onChange }: { label: string; req?: boolean; value: string; options: string[]; extra?: React.ReactNode; createLabel?: string; onChange?: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(value)
  const [opts, setOpts] = useState(options)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const pick = (v: string) => { setSel(v); onChange?.(v) }
  const commit = () => {
    const v = draft.trim()
    if (v) { setOpts((o) => (o.includes(v) ? o : [...o, v])); pick(v) }
    setDraft(''); setCreating(false); setOpen(false)
  }
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="relative">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center rounded-md border border-line bg-surface px-3 py-2 text-left text-[12.5px] text-ink/80">
          {sel}<span className="ml-auto text-faint">▾</span>
        </button>
        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-lg">
            <div className="max-h-52 overflow-auto py-1">
              {opts.map((o) => (
                <button key={o} onClick={() => { pick(o); setOpen(false) }} className={cn('block w-full px-3 py-1.5 text-left text-[12px] hover:bg-canvas', o === sel ? 'bg-brand-soft font-medium text-brand' : 'text-ink/80')}>{o}</button>
              ))}
            </div>
            {createLabel && (
              <div className="border-t border-line-soft bg-canvas/50">
                {creating ? (
                  <div className="flex items-center gap-1.5 p-1.5">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setCreating(false); setDraft('') } }}
                      placeholder={`New ${label.toLowerCase()}…`}
                      className="min-w-0 flex-1 rounded border border-line bg-surface px-2 py-1 text-[12px] outline-none focus:border-brand"
                    />
                    <button onClick={commit} className="shrink-0 rounded bg-brand px-2 py-1 text-[11px] font-semibold text-white hover:opacity-90">Add</button>
                  </div>
                ) : (
                  <button onClick={() => setCreating(true)} className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[12px] font-medium text-brand hover:bg-brand-soft">
                    <span className="text-[14px] leading-none">＋</span> {createLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Bilingual textarea — VI / EN tab on the label row. */
export function BiTArea({ label, req, vi, en, rows = 4 }: { label: string; req?: boolean; vi: string; en: string; rows?: number }) {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <label className="text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
        <div className="ml-auto flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
          {(['VI', 'EN'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={cn('px-2 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-faint" style={{ minHeight: rows * 20 }}>{lang === 'VI' ? vi : en}</div>
    </div>
  )
}
