import { Link } from 'react-router-dom'
import { User, ListChecks, PanelsTopLeft } from 'lucide-react'
import {
  BUILD_MODULES,
  SITE_META,
  SCOPE_META,
  type BuildFeature,
  type Site,
  type Scope,
} from '@/data/buildModules'
import { cn } from '@/lib/utils'

function SitePill({ site }: { site: Site }) {
  return (
    <span className={cn('inline-block rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium', SITE_META[site].pill)}>
      {SITE_META[site].label}
    </span>
  )
}

function ScopePills({ scope }: { scope: Scope[] }) {
  return (
    <span className="inline-flex gap-1">
      {scope.map((s) => (
        <span key={s} className={cn('rounded border px-1 py-0.5 text-[10px] font-semibold', SCOPE_META[s].pill)}>
          {s}
        </span>
      ))}
    </span>
  )
}

export function BuildPlan() {
  const totalFeatures = BUILD_MODULES.reduce((n, m) => n + m.features.length, 0)

  return (
    <div className="max-w-[1080px] pb-16">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Build plan · near-final</p>
        <h1 className="text-[28px] font-bold tracking-tight mt-1">Modules, features &amp; pages</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/75 max-w-[72ch]">
          The SVN module list — {BUILD_MODULES.length} modules, {totalFeatures} features/pages — with owner, target
          site and scope of work. Requirements are drafted against basic VN-market recruitment standards
          (VietnamWorks / TopCV / ITviec). Rows with a mockup link to the{' '}
          <Link to="/mockups" className="text-brand hover:underline">Mockups</Link> gallery.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11.5px] text-muted">
          <span className="font-medium text-ink">Legend:</span>
          <SitePill site="Jobseekers" /> <SitePill site="Companies" /> <SitePill site="Admin" />
          <span className="mx-1 text-faint">·</span>
          <ScopePills scope={['BE', 'FE', 'UI']} /> BE backend · FE frontend · UI design
        </div>
      </div>

      <div className="space-y-4">
        {BUILD_MODULES.map((m, i) => (
          <section key={m.id} className="rounded-2xl border border-line bg-surface overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3.5">
              <span className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="text-[16px] font-semibold">{m.title}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                <User className="h-3 w-3" /> {m.owner}
              </span>
              <span className="ml-auto text-[11px] text-faint">{m.features.length} features</span>
            </div>

            <div className="grid gap-0 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              {/* requirements */}
              <div className="border-b md:border-b-0 md:border-r border-line-soft p-5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-faint mb-2">
                  <ListChecks className="h-3 w-3" /> Requirements
                </p>
                <ul className="space-y-1.5">
                  {m.requirements.map((r, j) => (
                    <li key={j} className="flex gap-2 text-[12.5px] leading-relaxed text-ink/80">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-faint" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* features / pages table */}
              <div className="p-3">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-muted">
                      <th className="px-2 py-1.5 font-semibold">Feature / page</th>
                      <th className="px-2 py-1.5 font-semibold">Site</th>
                      <th className="px-2 py-1.5 font-semibold">Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.features.map((f, j) => (
                      <FeatureRow key={j} feature={f} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function FeatureRow({ feature: f }: { feature: BuildFeature }) {
  return (
    <tr className="border-t border-line-soft align-top">
      <td className="px-2 py-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">{f.name}</span>
          {f.mockup && (
            <Link
              to={`/mockups?screen=${f.mockup}`}
              className="inline-flex items-center gap-1 rounded border border-brand/30 bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand hover:bg-brand hover:text-white"
            >
              <PanelsTopLeft className="h-3 w-3" /> Mockup
            </Link>
          )}
        </div>
        {f.notes && <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{f.notes}</p>}
      </td>
      <td className="px-2 py-2"><SitePill site={f.site} /></td>
      <td className="px-2 py-2"><ScopePills scope={f.scope} /></td>
    </tr>
  )
}
