import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight, ExternalLink, ImageIcon } from 'lucide-react'
import { BUILD_MODULES, SITE_META, SCOPE_META } from '@/data/buildModules'
import type { BuildFeature, Scope, FeatureDetail, Requirement, ReqTable } from '@/data/buildModules'
import type { FieldGroup, BackendSpec } from '@/data/types'
import { resolveScreen, mockupHref } from '@/pages/screenRegistry'
import { cn } from '@/lib/utils'

/* ── Requirements ─────────────────────────────────────────────────────────────
   A requirement renders either as one bullet (plain string) or as a labelled
   card with an optional table / sub-points. Tables are the point: a rule set with
   more than three entries is far faster to read as rows than as a paragraph. */
function ReqTableView({ t, dense }: { t: ReqTable; dense?: boolean }) {
  const tmpl = `minmax(120px, 0.9fr) ${t.cols.slice(1).map(() => '1fr').join(' ')}`
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-line">
      <div
        style={{ gridTemplateColumns: tmpl, minWidth: 480 }}
        className={cn('grid gap-x-4 bg-canvas/60 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted', dense && 'text-[10px]')}
      >
        {t.cols.map((c, i) => <span key={i}>{c}</span>)}
      </div>
      {t.rows.map((r, ri) => (
        <div
          key={ri}
          style={{ gridTemplateColumns: tmpl, minWidth: 480 }}
          className={cn('grid gap-x-4 border-t border-line-soft px-3 py-1.5', dense ? 'text-[11.5px]' : 'text-[12.5px]')}
        >
          {r.map((cell, ci) => (
            <span key={ci} className={ci === 0 ? 'font-medium text-ink' : 'text-ink/75'}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

function Requirements({ items, dense }: { items: Requirement[]; dense?: boolean }) {
  return (
    <div className={dense ? 'space-y-2' : 'space-y-2.5'}>
      {items.map((r, i) =>
        typeof r === 'string' ? (
          <div key={i} className={cn('flex gap-2 leading-relaxed', dense ? 'text-[12.5px] text-muted' : 'text-[13.5px] text-ink/80')}>
            <span className={cn('mt-2 h-1 w-1 shrink-0 rounded-full', dense ? 'bg-faint' : 'bg-brand')} />
            {r}
          </div>
        ) : (
          <div key={i} className={cn('rounded-xl border border-line bg-surface', dense ? 'px-3 py-2.5' : 'px-4 py-3')}>
            <p className={cn('font-semibold text-ink', dense ? 'text-[12px]' : 'text-[13px]')}>{r.label}</p>
            {r.text && (
              <p className={cn('mt-1 leading-relaxed', dense ? 'text-[12px] text-muted' : 'text-[13px] text-ink/75')}>{r.text}</p>
            )}
            {r.table && <ReqTableView t={r.table} dense={dense} />}
            {r.items && (
              <ul className="mt-2 space-y-1">
                {r.items.map((it, j) => (
                  <li key={j} className={cn('flex gap-2 leading-relaxed', dense ? 'text-[12px] text-muted' : 'text-[12.5px] text-ink/75')}>
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-faint" />
                    {it}
                  </li>
                ))}
              </ul>
            )}
            {r.warn && (
              <p className={cn('mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 leading-relaxed text-amber-800', dense ? 'text-[11.5px]' : 'text-[12px]')}>
                ⚠️ {r.warn}
              </p>
            )}
          </div>
        ),
      )}
    </div>
  )
}

function SiteTag({ site }: { site: BuildFeature['site'] }) {
  return (
    <span className={cn('rounded border px-1 py-0.5 font-mono text-[10px] font-medium', SITE_META[site].pill)}>
      {SITE_META[site].tag}
    </span>
  )
}

/* BE and FE are deliberately not rendered: every feature needs both, so the pills
   carried no information and only added noise to each row. UI still does — it marks
   the features that need design work before they can be built. */
function ScopePills({ scope }: { scope: Scope[] }) {
  const shown = scope.filter((s) => s !== 'BE' && s !== 'FE')
  if (!shown.length) return null
  return (
    <span className="flex gap-1">
      {shown.map((s) => (
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
/* Every feature-detail section is one CARD with a titled header — the same shape as
   the requirement blocks, so a long spec reads as a stack of labelled groups
   instead of an undifferentiated wall of headings and text. */
function SpecBlock({ title, children, note }: { title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft bg-canvas/40 px-4 py-2">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">{title}</h2>
        {note && <span className="text-[11px] text-faint">{note}</span>}
      </div>
      <div className="px-4 py-3">{children}</div>
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
      {(d.description || d.userStory) && (
        <SpecBlock title="Overview">
          {/* A description may carry blank-line breaks; render them as real paragraphs
              so a long overview reads as prose instead of one dense block. */}
          {d.description && (
            <div className="space-y-2.5">
              {d.description.split('\n\n').map((para, i) => (
                <p key={i} className="text-[13.5px] leading-relaxed text-ink/80">{para.trim()}</p>
              ))}
            </div>
          )}
          {d.userStory && (
            <p className={cn('rounded-r-lg border-l-2 border-brand bg-brand-soft/50 px-3 py-2 text-[13px] italic text-ink/75', d.description && 'mt-3')}>
              {d.userStory}
            </p>
          )}
        </SpecBlock>
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
    <div className="mx-auto w-full max-w-[1200px] px-6 pb-16 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Module</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">{m.title}</h1>
        <span className="rounded-full border border-line bg-canvas/50 px-2.5 py-0.5 text-[11.5px] text-muted">
          Owner · {m.owner}
        </span>
        <span className="text-[11.5px] text-faint">{m.features.length} features</span>
      </div>

      {/* Edge cases first — the awkward real-world shapes this module answers. Pinned
          above the requirements because it is what a client checks to see whether we
          understood their business before reading how we built for it. */}
      {m.edgeCases && m.edgeCases.length > 0 && (
        <section className="mt-7 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60">
          <div className="border-b border-amber-200/70 px-4 py-2">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-amber-800">
              Edge cases covered · trường hợp đặc biệt đã xử lý
            </h2>
          </div>
          <ol className="divide-y divide-amber-200/60">
            {m.edgeCases.map((e, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <span className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-200/80 text-[11px] font-bold text-amber-900">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-amber-950">{e.label}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-900/85">{e.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* what it delivers */}
      <section className="mt-7">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">What it delivers</h2>
        <Requirements items={m.requirements} />
      </section>

      {/* The "Flow · features" list used to sit here. Removed: the sidebar already
          lists every feature in this module, so the section was a second copy of the
          same navigation. Feature pages are still routed at /m/:moduleId/:index. */}
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
  const screen = resolveScreen(f.mockup)
  const href = screen ? mockupHref(screen) : null

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pb-16 sm:px-8">
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

      {/* Screen UI — on top, above the requirement detail.
          This is NOT a second copy of the screen: resolveScreen returns the very
          component the mockup gallery renders, so there is only ever one place a
          screen is built. The link opens it in that gallery. */}
      <SpecBlock
        title="Screen UI"
        note={
          screen ? (
            <span className="flex items-center gap-3">
              {/* the route, as plain text — it was the only real information the
                  fake browser chrome carried */}
              {screen.url && <span className="hidden font-mono text-[11px] text-faint sm:inline">{screen.url}</span>}
              {href && (
                <Link to={href} className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
                  Open in {screen.src === 'admin' ? 'Admin' : screen.src === 'co' ? 'Company' : 'Jobseeker'} mockups
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </span>
          ) : (
            'not wired yet'
          )
        }
      >
        {screen ? (
          /* No <Browser> frame here. The SpecBlock card is already a frame, so the
             chrome was a second border around the first plus a fake URL bar; the
             URL now sits in the block header. The gallery keeps its chrome, where
             it is the only frame. */
          <div className="max-h-[640px] overflow-y-auto scroll-thin">
            <screen.Comp />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-canvas/40 p-6 text-center">
            <ImageIcon className="mx-auto h-5 w-5 text-faint" />
            <p className="mt-2 text-[13px] text-muted">No screen mockup wired for this feature yet.</p>
          </div>
        )}
      </SpecBlock>

      {f.notes && (
        <div className="mt-5 rounded-xl border border-line bg-canvas/40 p-4">
          <p className="text-[12px] font-semibold text-ink/70 mb-1">Notes</p>
          <p className="text-[13px] leading-relaxed text-ink/80">{f.notes}</p>
        </div>
      )}

      {/* rich per-feature detail */}
      {f.detail && <FeatureDetailBlocks d={f.detail} />}

      {/* module context */}
      <SpecBlock title={`Module context · ${m.title}`} note="rules that apply to every feature here">
        <Requirements items={m.requirements} dense />
      </SpecBlock>

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
