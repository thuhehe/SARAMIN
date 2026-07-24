import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight, ImageIcon } from 'lucide-react'
import { BUILD_MODULES, SITE_META, SCOPE_META } from '@/data/buildModules'
import type { BuildFeature, Scope, FeatureDetail } from '@/data/buildModules'
import type { FieldGroup, BackendSpec } from '@/data/types'
import { SCREENS } from '@/pages/Mockups'
import { Browser } from '@/components/wire'
import { cn } from '@/lib/utils'

function SiteDot({ site }: { site: BuildFeature['site'] }) {
  return <span className={cn('h-2 w-2 shrink-0 rounded-full', SITE_META[site].dot)} />
}

function SiteTag({ site }: { site: BuildFeature['site'] }) {
  return (
    <span className={cn('rounded border px-1 py-0.5 font-mono text-[10px] font-medium', SITE_META[site].pill)}>
      {SITE_META[site].tag}
    </span>
  )
}

function ScopePills({ scope }: { scope: Scope[] }) {
  return (
    <span className="flex gap-1">
      {scope.map((s) => (
        <span
          key={s}
          className={cn('rounded border px-1.5 py-0.5 text-[10px] font-semibold', SCOPE_META[s].pill)}
        >
          {s}
        </span>
      ))}
    </span>
  )
}

/* ── Rich per-feature detail renderers ────────────────────────────────────── */
function SpecBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-2.5">{title}</h2>
      {children}
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/80">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
          {t}
        </li>
      ))}
    </ul>
  )
}

function Ordered({ items }: { items: string[] }) {
  return (
    <ol className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink/80">
          <span className="mt-0.5 shrink-0 font-mono text-[11px] text-faint">{i + 1}.</span>
          {t}
        </li>
      ))}
    </ol>
  )
}

function FieldTable({ groups }: { groups: FieldGroup[] }) {
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.group && <p className="mb-1.5 text-[12px] font-semibold text-ink/70">{g.group}</p>}
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-[12.5px]">
              <tbody>
                {g.items.map((f, fi) => (
                  <tr key={fi} className="border-b border-line-soft last:border-0">
                    <td className="w-[34%] px-3 py-2 align-top font-mono text-[11.5px] text-ink/80">
                      {f.name}
                      {f.required && <span className="text-rose-500"> *</span>}
                    </td>
                    <td className="w-[24%] px-3 py-2 align-top text-muted">{f.type}</td>
                    <td className="px-3 py-2 align-top text-muted">{f.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function BackendBlock({ b }: { b: BackendSpec }) {
  return (
    <div className="space-y-3">
      {b.dataModel && <FieldTable groups={[{ group: 'Data model', items: b.dataModel }]} />}
      {b.endpoints && (
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-ink/70">Endpoints</p>
          <div className="space-y-1">
            {b.endpoints.map((e, i) => (
              <code key={i} className="block rounded-md bg-canvas/70 px-2.5 py-1 font-mono text-[11.5px] text-ink/80">
                {e}
              </code>
            ))}
          </div>
        </div>
      )}
      {b.integrations && (
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-ink/70">Integrations</p>
          <div className="flex flex-wrap gap-1.5">
            {b.integrations.map((x, i) => (
              <span key={i} className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] text-muted">
                {x}
              </span>
            ))}
          </div>
        </div>
      )}
      {b.notes && <p className="text-[12.5px] leading-relaxed text-muted">{b.notes}</p>}
    </div>
  )
}

function FeatureDetailBlocks({ d }: { d: FeatureDetail }) {
  return (
    <>
      {d.description && <p className="mt-5 text-[14px] leading-relaxed text-ink/80">{d.description}</p>}
      {d.userStory && (
        <p className="mt-3 rounded-r-lg border-l-2 border-brand bg-brand-soft/50 px-3 py-2 text-[13px] italic text-ink/75">
          {d.userStory}
        </p>
      )}
      {d.uiFields && (
        <SpecBlock title="UI fields">
          <FieldTable groups={d.uiFields} />
        </SpecBlock>
      )}
      {d.behaviors && (
        <SpecBlock title="Behaviours">
          <Ordered items={d.behaviors} />
        </SpecBlock>
      )}
      {d.rules && (
        <SpecBlock title="Rules & validation">
          <Bullets items={d.rules} />
        </SpecBlock>
      )}
      {d.states && (
        <SpecBlock title="States">
          <div className="flex flex-wrap gap-1.5">
            {d.states.map((s, i) => (
              <span key={i} className="rounded-md border border-line bg-canvas/50 px-2 py-0.5 text-[11.5px] text-ink/70">
                {s}
              </span>
            ))}
          </div>
        </SpecBlock>
      )}
      {d.backend && (
        <SpecBlock title="Backend contract">
          <BackendBlock b={d.backend} />
        </SpecBlock>
      )}
      {d.acceptance && (
        <SpecBlock title="Acceptance criteria">
          <ul className="space-y-1.5">
            {d.acceptance.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/80">
                <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </SpecBlock>
      )}
      {d.sections?.map((s, i) => (
        <SpecBlock key={i} title={s.heading}>
          <Bullets items={s.items} />
        </SpecBlock>
      ))}
      {d.openQuestions && (
        <SpecBlock title="Open questions">
          <ul className="space-y-1.5">
            {d.openQuestions.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/80">
                <span className="mt-px shrink-0 font-semibold text-amber-500">?</span>
                {t}
              </li>
            ))}
          </ul>
        </SpecBlock>
      )}
    </>
  )
}

/* ── Module view: goal / requirements + feature flow ──────────────────────── */
export function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const m = BUILD_MODULES.find((x) => x.id === moduleId)
  if (!m) return <Navigate to="/" replace />

  return (
    <div className="max-w-[900px] pb-16">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Module</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">{m.title}</h1>
        <span className="rounded-full border border-line bg-canvas/50 px-2.5 py-0.5 text-[11.5px] text-muted">
          Owner · {m.owner}
        </span>
        <span className="text-[11.5px] text-faint">{m.features.length} features</span>
      </div>

      {/* what it delivers */}
      <section className="mt-7">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">What it delivers</h2>
        <ul className="space-y-2">
          {m.requirements.map((r, i) => (
            <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-ink/80">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* feature flow */}
      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">Flow · features</h2>
        <div className="space-y-2">
          {m.features.map((f, i) => (
            <Link
              key={i}
              to={`/m/${m.id}/${i}`}
              className="group block rounded-xl border border-line bg-surface p-3.5 transition-all hover:border-brand hover:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <SiteDot site={f.site} />
                <SiteTag site={f.site} />
                <span className="text-[14px] font-semibold group-hover:text-brand">{f.name}</span>
                <span className="ml-auto flex items-center gap-2">
                  <ScopePills scope={f.scope} />
                  <ChevronRight className="h-3.5 w-3.5 text-faint group-hover:text-brand group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              {f.notes && <p className="mt-1.5 pl-4 text-[12px] leading-relaxed text-muted">{f.notes}</p>}
              {f.mockup && (
                <p className="mt-1.5 pl-4 flex items-center gap-1 text-[11px] text-brand">
                  <ImageIcon className="h-3 w-3" /> UI mockup available
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ── Feature view: detail + related UI mockup ─────────────────────────────── */
export function FeatureDetail() {
  const { moduleId, featureIndex } = useParams<{ moduleId: string; featureIndex: string }>()
  const m = BUILD_MODULES.find((x) => x.id === moduleId)
  const idx = Number(featureIndex)
  const f = m && Number.isInteger(idx) ? m.features[idx] : undefined
  if (!m) return <Navigate to="/" replace />
  if (!f) return <Navigate to={`/m/${m.id}`} replace />

  const prev = idx > 0 ? { i: idx - 1, f: m.features[idx - 1] } : undefined
  const next = idx < m.features.length - 1 ? { i: idx + 1, f: m.features[idx + 1] } : undefined
  const screen = f.mockup ? SCREENS.find((s) => s.id === f.mockup) : undefined

  return (
    <div className="max-w-[900px] pb-16">
      {/* breadcrumb */}
      <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted">
        <Link to={`/m/${m.id}`} className="inline-flex items-center gap-1 hover:text-brand">
          <ArrowLeft className="h-3.5 w-3.5" /> {m.title}
        </Link>
        <ChevronRight className="h-3 w-3 text-faint" />
        <span className="text-ink/70">{f.name}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SiteTag site={f.site} />
        <h1 className="text-[24px] font-bold tracking-tight">{f.name}</h1>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-md border px-2 py-0.5 text-[11.5px] font-medium', SITE_META[f.site].pill)}>
          {SITE_META[f.site].label}
        </span>
        <ScopePills scope={f.scope} />
      </div>

      {f.notes && (
        <div className="mt-5 rounded-xl border border-line bg-canvas/40 p-4">
          <p className="text-[12px] font-semibold text-ink/70 mb-1">Notes</p>
          <p className="text-[13px] leading-relaxed text-ink/80">{f.notes}</p>
        </div>
      )}

      {/* rich per-feature detail */}
      {f.detail && <FeatureDetailBlocks d={f.detail} />}

      {/* module context */}
      <section className="mt-6">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-2">
          Module context · {m.title}
        </h2>
        <ul className="space-y-1.5">
          {m.requirements.map((r, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-faint" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* related UI mockup */}
      <section className="mt-7">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">UI mockup</h2>
        {screen ? (
          <Browser url={screen.url}>
            <screen.Comp />
          </Browser>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-canvas/40 p-6 text-center">
            <ImageIcon className="mx-auto h-5 w-5 text-faint" />
            <p className="mt-2 text-[13px] text-muted">
              No UI mockup for this feature yet.
            </p>
            <Link to="/mockups" className="mt-1 inline-block text-[12px] text-brand hover:underline">
              Browse all mockups →
            </Link>
          </div>
        )}
      </section>

      {/* prev / next within the module */}
      <div className="mt-10 flex items-stretch justify-between gap-3 border-t border-line pt-5">
        {prev ? (
          <Link
            to={`/m/${m.id}/${prev.i}`}
            className="group flex max-w-[46%] flex-col items-start rounded-xl border border-line bg-surface px-4 py-2.5 transition-colors hover:border-brand"
          >
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <ArrowLeft className="h-3 w-3" /> Previous
            </span>
            <span className="truncate text-[13px] font-medium group-hover:text-brand">{prev.f.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/m/${m.id}/${next.i}`}
            className="group flex max-w-[46%] flex-col items-end rounded-xl border border-line bg-surface px-4 py-2.5 text-right transition-colors hover:border-brand"
          >
            <span className="flex items-center gap-1 text-[11px] text-muted">
              Next <ArrowRight className="h-3 w-3" />
            </span>
            <span className="truncate text-[13px] font-medium group-hover:text-brand">{next.f.name}</span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
