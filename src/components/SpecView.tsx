import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  HelpCircle,
  MessageCircleQuestion,
  Layers,
  ListChecks,
  Server,
  Database,
  Plug,
  FileText,
  PanelsTopLeft,
  NotebookPen,
  Hammer,
} from 'lucide-react'
import type { FeatureSpec } from '@/data/types'
import { SPECS } from '@/data'
import { StatusBadge } from './StatusBadge'
import { FieldsTable } from './FieldsTable'
import { SpecTableView } from './SpecTableView'
import { cn } from '@/lib/utils'

function SectionHead({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink mb-2.5">
      <span className="text-brand">{icon}</span>
      {children}
    </h3>
  )
}

function Bullets({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('space-y-1.5', className)}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/85">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-faint" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function SpecView({ spec }: { spec: FeatureSpec }) {
  const [tab, setTab] = useState<'spec' | 'wireframe'>('spec')

  return (
    <div className="min-w-0">
      {/* header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-[11px] text-muted mb-1.5">
          {spec.surface && <span>{spec.surface}</span>}
          {spec.code && (
            <>
              <span className="text-faint">·</span>
              <code className="font-mono text-faint">{spec.code}</code>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-bold tracking-tight">{spec.title}</h1>
          <StatusBadge status={spec.status} />
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/75 max-w-[62ch]">{spec.summary}</p>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-line mb-5">
        <TabButton active={tab === 'spec'} onClick={() => setTab('spec')} icon={<FileText className="h-3.5 w-3.5" />}>
          Specification
        </TabButton>
        <TabButton active={tab === 'wireframe'} onClick={() => setTab('wireframe')} icon={<PanelsTopLeft className="h-3.5 w-3.5" />}>
          Wireframe
        </TabButton>
      </div>

      {tab === 'wireframe' ? (
        <WireframePlaceholder title={spec.title} adminNav={spec.id.startsWith('admin-')} />
      ) : (
        <div className="space-y-7">
          {spec.description && (
            <p className="text-[14px] leading-relaxed text-ink/85 max-w-[68ch]">{spec.description}</p>
          )}

          {/* UI fields */}
          {spec.uiFields && spec.uiFields.length > 0 && (
            <section>
              <SectionHead icon={<Layers className="h-4 w-4" />}>Fields captured on screen</SectionHead>
              <div className="space-y-4">
                {spec.uiFields.map((g, i) => (
                  <div key={i}>
                    {g.group && (
                      <p className="text-[12px] font-medium text-muted mb-1.5">{g.group}</p>
                    )}
                    <FieldsTable items={g.items} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* behaviours */}
          {spec.behaviors && spec.behaviors.length > 0 && (
            <section>
              <SectionHead icon={<ListChecks className="h-4 w-4" />}>Behaviours</SectionHead>
              <Bullets items={spec.behaviors} />
            </section>
          )}

          {/* rules */}
          {spec.rules && spec.rules.length > 0 && (
            <section>
              <SectionHead icon={<ListChecks className="h-4 w-4" />}>Business rules</SectionHead>
              <Bullets items={spec.rules} />
            </section>
          )}

          {/* free-form sections */}
          {spec.sections?.map((s, i) => (
            <section key={i}>
              <SectionHead icon={<FileText className="h-4 w-4" />}>{s.heading}</SectionHead>
              {s.text && <p className="mb-2 text-[13.5px] leading-relaxed text-ink/80">{s.text}</p>}
              {s.table && <SpecTableView t={s.table} />}
              {s.items && <Bullets items={s.items} />}
            </section>
          ))}

          {/* backend contract */}
          {spec.backend && (
            <section className="rounded-xl border border-line bg-canvas/40 p-4">
              <SectionHead icon={<Server className="h-4 w-4" />}>Backend contract</SectionHead>
              <div className="space-y-4">
                {spec.backend.dataModel && spec.backend.dataModel.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-muted mb-1.5">
                      <Database className="h-3.5 w-3.5" /> Data model
                    </p>
                    <FieldsTable items={spec.backend.dataModel} />
                  </div>
                )}
                {spec.backend.endpoints && spec.backend.endpoints.length > 0 && (
                  <div>
                    <p className="text-[12px] font-medium text-muted mb-1.5">Endpoints</p>
                    <ul className="space-y-1">
                      {spec.backend.endpoints.map((e, i) => (
                        <li key={i} className="font-mono text-[12px] text-ink/80 bg-surface border border-line-soft rounded px-2 py-1">
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {spec.backend.integrations && spec.backend.integrations.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-muted mb-1.5">
                      <Plug className="h-3.5 w-3.5" /> Integrations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {spec.backend.integrations.map((s) => (
                        <span key={s} className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {spec.backend.notes && (
                  <p className="text-[12.5px] leading-relaxed text-muted">{spec.backend.notes}</p>
                )}
              </div>
            </section>
          )}

          {/* known / unknown — the "what we know / what we don't" the user asked for */}
          {(spec.known?.length || spec.unknown?.length) && (
            <section className="grid gap-3 sm:grid-cols-2">
              {spec.known && spec.known.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <SectionHead icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}>
                    <span className="text-emerald-800">What we know</span>
                  </SectionHead>
                  <Bullets items={spec.known} />
                </div>
              )}
              {spec.unknown && spec.unknown.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <SectionHead icon={<HelpCircle className="h-4 w-4 text-amber-600" />}>
                    <span className="text-amber-800">Needs investigation</span>
                  </SectionHead>
                  <Bullets items={spec.unknown} />
                </div>
              )}
            </section>
          )}

          {/* client questions */}
          {spec.clientQuestions && spec.clientQuestions.length > 0 && (
            <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
              <SectionHead icon={<MessageCircleQuestion className="h-4 w-4 text-violet-600" />}>
                <span className="text-violet-800">Questions for client</span>
              </SectionHead>
              <ol className="space-y-2 list-decimal pl-4 marker:text-violet-400">
                {spec.clientQuestions.map((qn, i) => (
                  <li key={i} className="text-[13px] leading-relaxed text-ink/85">{qn}</li>
                ))}
              </ol>
            </section>
          )}

          {/* BB notes — BurningBros build / BA notes */}
          {spec.bbNotes && spec.bbNotes.length > 0 && (
            <section className="rounded-xl border border-line bg-canvas/40 p-4">
              <SectionHead icon={<NotebookPen className="h-4 w-4" />}>
                BB notes
                <span className="ml-1.5 rounded bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                  BurningBros
                </span>
              </SectionHead>
              <div className="space-y-3.5">
                {spec.bbNotes.map((s, i) => (
                  <div key={i}>
                    {s.heading && (
                      <p className="text-[12px] font-semibold text-ink/80 mb-1.5">{s.heading}</p>
                    )}
                    {s.table && <SpecTableView t={s.table} />}
                    {s.items && <Bullets items={s.items} />}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BB — what needs to be done */}
          {spec.whatToBuild && spec.whatToBuild.length > 0 && (
            <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
              <SectionHead icon={<Hammer className="h-4 w-4 text-sky-600" />}>
                <span className="text-sky-800">What needs to be done</span>
              </SectionHead>
              <ul className="space-y-1.5">
                {spec.whatToBuild.map((t, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/85">
                    <span className="mt-[3px] text-sky-500">☐</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* related */}
          {spec.related && spec.related.length > 0 && (
            <section>
              <SectionHead icon={<Layers className="h-4 w-4" />}>Related features</SectionHead>
              <div className="flex flex-wrap gap-1.5">
                {spec.related.map((rid) => {
                  const r = SPECS[rid]
                  if (!r) return null
                  return (
                    <Link
                      key={rid}
                      to={`/f/${rid}`}
                      className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] text-ink/80 hover:border-brand hover:text-brand transition-colors"
                    >
                      {r.title}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium border-b-2 -mb-px transition-colors',
        active ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function WireframePlaceholder({ title, adminNav }: { title: string; adminNav?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/40 py-16 text-center">
      <PanelsTopLeft className="h-9 w-9 text-faint mb-3" />
      {adminNav ? (
        <>
          <p className="text-[14px] font-medium text-ink">This screen lives in the HQ Admin console</p>
          <p className="mt-1 text-[12.5px] text-muted max-w-[46ch]">
            See the proposed admin navigation & shell wireframe — this feature appears in its sidebar.
          </p>
          <Link
            to="/wireframe/admin"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
          >
            Open Admin nav wireframe
          </Link>
        </>
      ) : (
        <>
          <p className="text-[14px] font-medium text-ink">No wireframe yet for “{title}”</p>
          <p className="mt-1 text-[12.5px] text-muted max-w-[42ch]">
            Reserved for an interactive wireframe or embedded mockup. Drop a component or screenshot
            here as the design matures.
          </p>
        </>
      )}
    </div>
  )
}
