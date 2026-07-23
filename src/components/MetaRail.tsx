import { Link } from 'react-router-dom'
import { Users, Boxes, GitCompareArrows, CircleAlert } from 'lucide-react'
import type { FeatureSpec } from '@/data/types'
import { STATUS_META } from '@/lib/status'
import { cn } from '@/lib/utils'

function RailBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-faint mb-2">
        <span className="text-muted">{icon}</span>
        {title}
      </p>
      {children}
    </section>
  )
}

export function MetaRail({ spec }: { spec: FeatureSpec }) {
  const m = STATUS_META[spec.status]
  const openCount =
    (spec.unknown?.length ?? 0) + (spec.clientQuestions?.length ?? 0)

  return (
    <aside className="hidden xl:flex flex-col w-[300px] shrink-0 h-[calc(100vh-24px)] sticky top-3 rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-line-soft shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-faint">At a glance</p>
        <h2 className="text-[14px] font-semibold truncate">{spec.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4 space-y-5">
        <RailBlock icon={<CircleAlert className="h-3 w-3" />} title="Status">
          <div className={cn('rounded-lg border px-3 py-2', m.pill)}>
            <p className="text-[12.5px] font-semibold">{m.label}</p>
            <p className="text-[11.5px] opacity-80 leading-snug mt-0.5">{m.description}</p>
          </div>
        </RailBlock>

        {openCount > 0 && (
          <RailBlock icon={<CircleAlert className="h-3 w-3" />} title="Open items">
            <div className="flex gap-2">
              {spec.unknown && spec.unknown.length > 0 && (
                <span className="flex-1 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-center">
                  <span className="block text-[18px] font-bold text-amber-700 leading-none">
                    {spec.unknown.length}
                  </span>
                  <span className="text-[10px] text-amber-800/80">unknowns</span>
                </span>
              )}
              {spec.clientQuestions && spec.clientQuestions.length > 0 && (
                <span className="flex-1 rounded-lg border border-violet-200 bg-violet-50/60 px-2.5 py-1.5 text-center">
                  <span className="block text-[18px] font-bold text-violet-700 leading-none">
                    {spec.clientQuestions.length}
                  </span>
                  <span className="text-[10px] text-violet-800/80">client Qs</span>
                </span>
              )}
            </div>
          </RailBlock>
        )}

        {spec.clientTeam && spec.clientTeam.length > 0 && (
          <RailBlock icon={<Users className="h-3 w-3" />} title="Client team / owners">
            <ul className="space-y-1">
              {spec.clientTeam.map((t) => (
                <li key={t} className="text-[12.5px] text-ink/80">
                  {t}
                </li>
              ))}
            </ul>
          </RailBlock>
        )}

        {spec.externalSystems && spec.externalSystems.length > 0 && (
          <RailBlock icon={<Boxes className="h-3 w-3" />} title="External systems">
            <div className="flex flex-wrap gap-1.5">
              {spec.externalSystems.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px]"
                >
                  {s}
                </span>
              ))}
            </div>
          </RailBlock>
        )}

        {spec.adminStoreRelation && (
          <RailBlock icon={<GitCompareArrows className="h-3 w-3" />} title="Admin ↔ Store">
            <p className="text-[12px] leading-relaxed text-ink/75">{spec.adminStoreRelation}</p>
          </RailBlock>
        )}

        {spec.related && spec.related.length > 0 && (
          <RailBlock icon={<Boxes className="h-3 w-3" />} title="Jump to related">
            <div className="flex flex-col gap-1">
              {spec.related.slice(0, 6).map((rid) => (
                <Link
                  key={rid}
                  to={`/f/${rid}`}
                  className="text-[12px] text-brand hover:underline truncate"
                >
                  → {rid}
                </Link>
              ))}
            </div>
          </RailBlock>
        )}
      </div>
    </aside>
  )
}
