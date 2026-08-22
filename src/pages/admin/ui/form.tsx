/* Form-layout primitives shared across admin forms: sections, toggles, steppers. */
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function EmptySec({ what }: { what: string }) {
  return <p className="rounded-md border border-dashed border-line bg-canvas/30 px-2.5 py-2 text-[11px] italic text-faint">{what}</p>
}

/** A form section: a big underlined header with its fields below (VietnamWorks-style). */
export function JobGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="border-b-2 border-line pb-2 text-[18px] font-bold tracking-tight text-ink">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/** Inline "Show to Job Seekers" switch, shown to the right of a field label. */
export function ShowToggle({ on = true }: { on?: boolean }) {
  const [v, setV] = useState(on)
  return (
    <button onClick={() => setV((x) => !x)} className="flex items-center gap-2 text-[11px] text-muted">
      Show to Job Seekers
      <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', v ? 'bg-brand' : 'bg-line')}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', v ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  )
}

/** − [n] + stepper placeholder. */
export function Stepper({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-line">
      <span className="px-3 py-2 text-[13px] text-muted">−</span>
      <span className="min-w-[48px] border-x border-line px-3 py-2 text-center text-[12.5px] text-ink/80">{value}</span>
      <span className="px-3 py-2 text-[13px] text-muted">+</span>
    </div>
  )
}

/** Compact demographic row (VietnamWorks-style): label · radios · Show-toggle, kept close together. */
export function DemoRow({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <label className="w-36 text-[11.5px] font-medium text-ink/80">{label}</label>
      <RadioOpts options={options} value="Any" />
      <ShowToggle on={false} />
    </div>
  )
}

/** Radio option pills without a label (label handled by LabelRow). */
export function RadioOpts({ options, value }: { options: string[]; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-0.5">
      {options.map((o) => (
        <span key={o} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/80">
          <span className={cn('grid h-4 w-4 place-items-center rounded-full border-2', o === value ? 'border-brand' : 'border-line')}>{o === value && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
          {o}
        </span>
      ))}
    </div>
  )
}
