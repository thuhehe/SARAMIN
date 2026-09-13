import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, FileText, Monitor } from 'lucide-react'
import { NAV_GROUPS, OFF_NAV, specPath } from './admin/nav'
import type { NavItem } from './admin/nav'
import { ADMIN_PROTOTYPES } from './admin/registry'

/*
 * ADMIN SCREEN INDEX — the map of the HQ Admin console.
 *
 * The console itself opens on one screen with its own sidebar, which answers
 * "where am I" but never "what is in here". This page answers the second, and it
 * is also the honest way to show the console's SIZE — that screen list IS the
 * scope of Part B, and a nav you have to expand group by group hides it.
 *
 * Counts are computed, never written down: a number typed into this comment or
 * into the copy is a number that goes stale the next time a nav line is added.
 *
 * Everything here is DERIVED from ./admin/nav — the same list the console
 * renders. Nothing about a screen is restated, so a group renamed there is
 * renamed here, and a screen added there appears here without an edit.
 */

/** A screen is "drawn" when the registry has a real component for it. */
const isDrawn = (specId?: string) => Boolean(specId && ADMIN_PROTOTYPES[specId])

const screenHref = (specId?: string) =>
  specId ? `/wireframe/admin?screen=${specId}` : '/wireframe/admin'

export function AdminScreenIndex() {
  const navScreens = NAV_GROUPS.reduce((n, g) => n + g.items.length, 0)
  const total = navScreens + OFF_NAV.length
  const drawn = [
    ...NAV_GROUPS.flatMap((g) => g.items),
    ...OFF_NAV.map((o) => o.item),
  ].filter((it) => isDrawn(it.specId)).length

  return (
    <div className="max-w-[1080px] pb-16">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">
          HQ Admin · Part B
        </p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight">Admin console — screen index</h1>
        <p className="mt-2 max-w-[72ch] text-[15px] leading-relaxed text-ink/75">
          Every screen in the proposed HQ Admin console — {NAV_GROUPS.length} nav groups,{' '}
          {total} screens — on one page, so the console can be reviewed whole instead of a
          group at a time. Each row opens that screen in the{' '}
          <Link to="/wireframe/admin" className="text-brand hover:underline">
            prototype
          </Link>
          ; where a requirement has been authored for it, the <b className="font-semibold">Spec</b>{' '}
          link goes to it.
        </p>
        {/* Said once, here, rather than as a badge on every row: today every
            screen is drawn, so a per-row "Prototype" chip would be a column of
            the same word. Rows flag the EXCEPTION instead. */}
        <p className="mt-3 text-[11.5px] text-muted">
          {drawn === total ? (
            <>
              All <b className="font-semibold text-ink">{total}</b> are drawn as prototype screens.
            </>
          ) : (
            <>
              <b className="font-semibold text-ink">{drawn}</b> of {total} are drawn as prototype
              screens; the other {total - drawn} render the generic skeleton.
            </>
          )}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas/40 p-4">
        <Monitor className="h-4 w-4 shrink-0 text-brand" />
        <p className="text-[13px] text-ink/75">Rather walk the console itself?</p>
        <Link
          to="/wireframe/admin"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
        >
          Open Admin mockups <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-4">
        {NAV_GROUPS.map((g) => (
          <section key={g.label} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center gap-2.5 border-b border-line-soft px-5 py-3.5">
              <span className="text-brand">{g.icon}</span>
              <h2 className="text-[16px] font-semibold">{g.label}</h2>
              <span className="ml-auto text-[11px] text-faint">
                {g.items.length} {g.items.length === 1 ? 'screen' : 'screens'}
              </span>
            </div>
            <ul className="divide-y divide-line-soft">
              {g.items.map((it) => (
                <ScreenRow key={it.specId ?? it.label} item={it} />
              ))}
            </ul>
          </section>
        ))}

        {/* The de-navved screens. They are not a footnote: someone looking for
            "Audit log" needs to be told it was pulled from the nav on purpose
            and is still openable, or they file it as a missing screen. */}
        <section className="overflow-hidden rounded-2xl border border-dashed border-line bg-surface">
          <div className="border-b border-line-soft px-5 py-3.5">
            <h2 className="text-[16px] font-semibold text-ink/80">Off the nav, still reachable</h2>
            <p className="mt-1 max-w-[68ch] text-[12.5px] leading-relaxed text-ink/65">
              Pulled from the console sidebar by the client (2026-08), but kept drawn and
              routable — restoring one is a single nav line. A link to these still opens them.
            </p>
          </div>
          <ul className="divide-y divide-line-soft">
            {OFF_NAV.map((o) => (
              <ScreenRow key={o.item.specId ?? o.item.label} item={o.item} group={o.group} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function ScreenRow({ item, group }: { item: NavItem; group?: string }) {
  const spec = specPath(item.specId)
  const drawn = isDrawn(item.specId)

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-2.5">
      <Link
        to={screenHref(item.specId)}
        className="text-[13px] font-medium text-ink hover:text-brand"
      >
        {item.label}
      </Link>

      {/* The badge means work waiting, so it carries its meaning here too. */}
      {item.badge !== undefined && (
        <span
          title="Items waiting in this queue"
          className="rounded-full bg-rose-100 px-1.5 text-[10px] font-semibold leading-[16px] text-rose-700"
        >
          {item.badge}
        </span>
      )}

      {group && <span className="text-[11px] text-faint">was under {group}</span>}

      {/* Only the exception is marked — see the note under the heading. */}
      {!drawn && (
        <span
          title="No screen component yet — the console renders the generic skeleton"
          className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
        >
          Skeleton
        </span>
      )}

      <span className="ml-auto flex items-center gap-3">
        {spec ? (
          <Link
            to={spec}
            className="inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-brand"
          >
            <FileText className="h-3 w-3" /> Spec
          </Link>
        ) : (
          <span className="text-[11.5px] text-faint" title="No requirement authored for this screen yet">
            No spec yet
          </span>
        )}
        <Link
          to={screenHref(item.specId)}
          className="inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-brand"
        >
          <ExternalLink className="h-3 w-3" /> Open
        </Link>
      </span>
    </li>
  )
}
