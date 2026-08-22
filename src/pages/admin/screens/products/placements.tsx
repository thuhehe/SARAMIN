import { useState } from 'react'
import { cn } from '@/lib/utils'
import { FILL_META, PLACEMENTS } from '@/pages/admin/data/products'
import type { FillRoute } from '@/pages/admin/data/products'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/** Placements list — the registry the product form and the jobseeker site share. */
export function AdminPlacements() {
  const [route, setRoute] = useState<FillRoute | 'all'>('all')
  const shown = PLACEMENTS.filter((p) => route === 'all' || p.route === route)
  const n = (r: FillRoute) => PLACEMENTS.filter((p) => p.route === r).length
  return (
    <div>
      <p className="mb-3 max-w-[72ch] text-[11.5px] leading-relaxed text-muted">
        Every display area on the jobseeker site, from the client Products deck. Sizes and caps are defined
        here <b className="text-ink/70">once</b> — a banner sale points at a row instead of re-typing “1536×371, max 6, rotate 3s”.
        The <b className="text-ink/70">Filled by</b> column is the product ⇄ page relationship.
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {([['all', `All ${PLACEMENTS.length}`], ['tier', `Tier-driven ${n('tier')}`], ['booked', `Booked ${n('booked')}`], ['both', `Tier + booked ${n('both')}`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setRoute(k as FillRoute | 'all')} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', route === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{label}</button>
        ))}
      </div>

      <ListPage
        cols={[{ label: 'Placement', w: '1.6fr' }, { label: 'Size', w: '1fr' }, { label: 'Shown', w: '0.9fr' }, { label: 'Capacity', w: '1.3fr' }, { label: 'Fill route', w: '1fr' }, { label: 'Filled by', w: '2fr' }]}
        rows={shown.map((p) => [
          <span>
            <span className="font-medium text-ink">{p.name}</span>
            <span className="block text-[10.5px] text-faint">{p.page} · deck §{p.ref}</span>
          </span>,
          <span className="font-mono text-[11px]">{p.size}</span>,
          p.shown,
          p.cap,
          <Pill tone={FILL_META[p.route].tone}>{FILL_META[p.route].label}</Pill>,
          <span className="text-[11px] leading-relaxed">{p.fedBy}</span>,
        ])}
        minW={1180}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Tier-driven = membership derived from the job’s tier, nothing booked · Booked = a purchased time window,
        needs an availability calendar
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(['tier', 'booked', 'both'] as FillRoute[]).map((r) => (
          <div key={r} className="rounded-lg border border-line p-2.5">
            <Pill tone={FILL_META[r].tone}>{FILL_META[r].label}</Pill>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{FILL_META[r].hint}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
        <span></span>
        <span>
          <b>Three placements have two supply routes.</b> “Công việc Hot hôm nay” shows 4 jobs but is both a Top Job
          perk (first 10 days) and a standalone purchase; Popular Jobs and Highlight Companies each have a fixed
          premium block (4 and 5 positions) sold as an add-on on top of the tier-driven list. Each needs one
          resolver with an explicit priority rule — otherwise the finite positions get oversold.
        </span>
      </p>
    </div>
  )
}
