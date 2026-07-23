import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { ALL_SPECS, NAV, SPECS } from '@/data'
import type { Status } from '@/data/types'
import { STATUS_META, STATUS_ORDER } from '@/lib/status'
import { StatusDot } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

export function Overview() {
  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = ALL_SPECS.filter((f) => f.status === s).length
    return acc
  }, {})
  const total = ALL_SPECS.length
  const openQuestions = ALL_SPECS.reduce(
    (n, f) => n + (f.clientQuestions?.length ?? 0),
    0,
  )

  const apps = Array.from(new Set(NAV.map((m) => m.app)))

  return (
    <div className="max-w-[900px] pb-16">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">
          Saramin Vietnam
        </p>
        <h1 className="text-[28px] font-bold tracking-tight mt-1">
          Feature Inventory &amp; Requirement Spec
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/75 max-w-[70ch]">
          A living source of truth across the two codebases — the public{' '}
          <strong>Store Site</strong> (job-seeker + employer) and the internal{' '}
          <strong>HQ Admin</strong> console. Each feature captures what it does, its build
          status, the backend contract, what we know, what still needs investigation, and the
          open questions for the client.
        </p>
      </div>

      {/* status roll-up */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        <StatTile value={total} label="Features documented" accent="brand" />
        <StatTile value={openQuestions} label="Open client questions" accent="violet" />
        {STATUS_ORDER.map((s) => (
          <StatusTile key={s} status={s} value={counts[s] ?? 0} />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-canvas/40 p-4 mb-9 flex gap-3">
        <BookOpen className="h-4 w-4 text-brand shrink-0 mt-0.5" />
        <p className="text-[13px] leading-relaxed text-ink/75">
          <strong>How to read this:</strong> both apps were read directly from source — this is
          what exists in the code today, not a wishlist. “UI exists” ≠ “connected to real data”.
          Treat the status label as the <em>remaining-effort</em> signal.{' '}
          <Link to="/legend" className="text-brand hover:underline">
            See the full status legend →
          </Link>
        </p>
      </div>

      {/* modules by app */}
      {apps.map((app) => (
        <section key={app} className="mb-8">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">
            {app}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {NAV.filter((m) => m.app === app).map((m) => (
              <Link
                key={m.code}
                to={`/f/${m.children[0]?.id}`}
                className="group rounded-xl border border-line bg-surface p-4 hover:border-brand hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[11px] text-faint">{m.code}</span>
                  <span className="text-[14px] font-semibold group-hover:text-brand">
                    {m.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-faint ml-auto group-hover:text-brand group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {m.children.map((c) => {
                    const spec = c.id ? SPECS[c.id] : undefined
                    return (
                      <span key={c.id} className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                        {spec && <StatusDot status={spec.status} />}
                        {c.label}
                      </span>
                    )
                  })}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function StatTile({
  value,
  label,
  accent,
}: {
  value: number
  label: string
  accent: 'brand' | 'violet'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3.5',
        accent === 'brand' ? 'border-brand/30 bg-brand-soft' : 'border-violet-200 bg-violet-50/50',
      )}
    >
      <p
        className={cn(
          'text-[26px] font-bold leading-none',
          accent === 'brand' ? 'text-brand' : 'text-violet-700',
        )}
      >
        {value}
      </p>
      <p className="text-[11.5px] text-muted mt-1.5">{label}</p>
    </div>
  )
}

function StatusTile({ status, value }: { status: Status; value: number }) {
  const m = STATUS_META[status]
  return (
    <div className="rounded-xl border border-line bg-surface p-3.5">
      <div className="flex items-center gap-1.5">
        <span className={cn('h-2 w-2 rounded-full', m.dot)} />
        <p className="text-[22px] font-bold leading-none">{value}</p>
      </div>
      <p className="text-[11.5px] text-muted mt-1.5">{m.label}</p>
    </div>
  )
}
