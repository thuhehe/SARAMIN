import { Link } from 'react-router-dom'
import { ArrowRight, PanelsTopLeft, GitCommitHorizontal } from 'lucide-react'
import { MODULES, SPECS } from '@/data'
import { SURFACE_META, type Surface, type BigModule } from '@/data/modules'
import { StatusDot } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

function SurfaceChip({ surface }: { surface: Surface }) {
  const m = SURFACE_META[surface]
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', m.pill)}
      title={m.long}
    >
      {m.label}
    </span>
  )
}

export function Modules() {
  return (
    <div className="max-w-[980px] pb-16">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Cross-surface view</p>
        <h1 className="text-[28px] font-bold tracking-tight mt-1">Modules — end-to-end flows</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/75 max-w-[72ch]">
          The same features, re-packed into bigger modules that flow across the three apps —{' '}
          <SurfaceChip surface="JS" /> job-seeker, <SurfaceChip surface="CO" /> company/employer,{' '}
          <SurfaceChip surface="Admin" /> HQ admin. Read a module top-to-bottom to see how a capability
          moves from creation to management to what the user finally sees. Each step links to its full spec.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-line bg-canvas/40 p-4 flex flex-wrap items-center gap-3">
        <PanelsTopLeft className="h-4 w-4 text-brand shrink-0" />
        <p className="text-[13px] text-ink/75">
          Want to see the proposed HQ Admin console?
        </p>
        <Link
          to="/wireframe/admin"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
        >
          Open Admin nav wireframe <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-4">
        {MODULES.map((m) => (
          <ModuleCard key={m.id} module={m} />
        ))}
      </div>
    </div>
  )
}

function ModuleCard({ module: m }: { module: BigModule }) {
  return (
    <section className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-line-soft">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-faint">{m.code}</span>
          <h2 className="text-[16px] font-semibold">{m.title}</h2>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink/70">{m.goal}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted">
          <GitCommitHorizontal className="h-3.5 w-3.5 text-faint" />
          <span className="font-medium">{m.flow}</span>
        </p>
      </div>

      <ol className="divide-y divide-line-soft">
        {m.steps.map((s, i) => (
          <li key={i} className="flex gap-3 px-5 py-3">
            <div className="flex flex-col items-center pt-0.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-canvas text-[10px] font-semibold text-muted">
                {i + 1}
              </span>
              {i < m.steps.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SurfaceChip surface={s.surface} />
                <p className="text-[13px] font-medium text-ink">{s.label}</p>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {s.featureIds.map((fid) => {
                  const spec = SPECS[fid]
                  if (!spec) return (
                    <span key={fid} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] text-rose-600">
                      {fid} (missing)
                    </span>
                  )
                  return (
                    <Link
                      key={fid}
                      to={`/f/${fid}`}
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas/50 px-2 py-0.5 text-[11.5px] text-ink/80 hover:border-brand hover:text-brand"
                    >
                      <StatusDot status={spec.status} />
                      {spec.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {m.keyDecisions && m.keyDecisions.length > 0 && (
        <div className="border-t border-line-soft bg-amber-50/30 px-5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1.5">
            Key decisions gating this module
          </p>
          <ul className="space-y-1">
            {m.keyDecisions.map((d, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-ink/80">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
