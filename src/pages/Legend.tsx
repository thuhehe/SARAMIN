import { STATUS_META, STATUS_ORDER } from '@/lib/status'
import { cn } from '@/lib/utils'

export function Legend() {
  return (
    <div className="max-w-[760px] pb-16">
      <h1 className="text-[24px] font-bold tracking-tight mb-2">Status legend &amp; how to read</h1>
      <p className="text-[14px] leading-relaxed text-ink/75 mb-7">
        Both apps were extracted from source and read directly — the status column reflects what
        exists in the code today, and doubles as the <strong>remaining-effort</strong> signal for
        each feature.
      </p>

      <div className="space-y-2.5 mb-10">
        {STATUS_ORDER.map((s) => {
          const m = STATUS_META[s]
          return (
            <div key={s} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
              <span className={cn('mt-1 h-3 w-3 shrink-0 rounded-full', m.dot)} />
              <div>
                <span
                  className={cn(
                    'inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium mb-1',
                    m.pill,
                  )}
                >
                  {m.label}
                </span>
                <p className="text-[13px] leading-relaxed text-ink/75">{m.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <h2 className="text-[15px] font-semibold mb-3">Suggested way to run the review</h2>
      <ol className="space-y-2 list-decimal pl-5 text-[13.5px] leading-relaxed text-ink/80">
        <li>
          For each feature, tag one of: <strong>Launch</strong> (must-have),{' '}
          <strong>Fast-follow</strong>, <strong>Later / maybe</strong>, or <strong>Cut</strong>.
        </li>
        <li>The status label tells you the remaining effort — a live-wired feature is close to done; a mock or seam feature still needs backend work.</li>
        <li>For every Launch item, walk its “Questions for client” so the BA has answers before writing specs.</li>
        <li>Only then turn these into dev / BA tickets.</li>
      </ol>
    </div>
  )
}
