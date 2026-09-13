import { Suspense, lazy, startTransition, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ADMIN_PROTOTYPES } from './admin/registry'
import { CreateSignalCtx, DetailCrumbCtx, OpenRecordCtx, ScreenNavCtx } from './admin/ctx'
import type { DetailCrumb } from './admin/ctx'
import { GlobalCompanySearch } from './admin/screens/companies/search'
/* The three create forms and the pipeline walkthrough are each a few hundred
   lines that only open on a click, so they follow the screens and load on
   demand rather than riding along with the shell. */
const NewPackageModal = lazy(() => import('./admin/screens/products/newPackage').then((m) => ({ default: m.NewPackageModal })))
const NewProductModal = lazy(() => import('./admin/screens/products/newProduct').then((m) => ({ default: m.NewProductModal })))
const NewQuotationModal = lazy(() => import('./admin/screens/sales/newQuotation').then((m) => ({ default: m.NewQuotationModal })))
const AdminPipeline = lazy(() => import('./admin/screens/sales/pipeline').then((m) => ({ default: m.AdminPipeline })))
import { ActivityLogButton } from './adminActivityLog'
import { MonetizationFlow } from '@/components/MonetizationFlow'
import { ActivationFlow } from '@/components/ActivationFlow'
import { CopyLinkButton, useScreenParam } from '@/components/ShareLink'
/* Groups, screens, off-nav screens and each screen's spec target now live in
   ./admin/nav, so the screen index can read the same list this shell renders. */
import { NAV_GROUPS, OFF_NAV, specPath } from './admin/nav'
import type { NavItem } from './admin/nav'

/* ── Sidebar state, remembered per reader ────────────────────────────────────
   Collapsing is a preference, not a per-visit decision: someone who works in the
   wide CRM tables collapses once and expects it to stay that way. Both bits live
   in localStorage and fail silently where it isn't available. */
const LS_COLLAPSED = 'admin-nav-collapsed'
const LS_OPEN_GROUPS = 'admin-nav-open-groups'

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}
function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode / storage disabled — the preference just doesn't persist */
  }
}

/** True while the viewport is wide enough for the labelled sidebar to earn its width. */
function useWideViewport() {
  const [wide, setWide] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setWide(mq.matches)
    /* Re-read on mount as well: a page first laid out at zero width (an embedded
       frame, a hidden pane, a restored background tab) mounts as "narrow", and the
       media query then never fires a change event — the sidebar would stay stuck as
       a rail on a full-width screen. */
    onChange()
    mq.addEventListener('change', onChange)
    window.addEventListener('resize', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [])
  return wide
}



/* Primary create action per page, rendered on the page title row — the
   conventional spot for it, so the page's main verb is visible before the
   reader gets past the explainer copy. Pages absent from this map have no
   single create action (reports, logs, boards). */
const PRIMARY_ACTION: Record<string, string> = {
  'admin-catalog': '+ New product',
  'admin-company-list': '+ New company',
  'admin-company-directory': '+ Thêm công ty',
  'admin-bundles': '+ New package',
  'admin-quotes': '+ New quotation',
}

/* Shown while a screen's chunk is in flight. Deliberately quiet and the height of
   a list page, so arriving at a screen doesn't jump the layout. */
function ScreenLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <p className="text-[12px] text-faint">Loading…</p>
    </div>
  )
}

export function AdminWireframe() {
  const [walkthrough, setWalkthrough] = useState<null | 'activation' | 'flow'>(null)
  /** specId whose create modal is open — the title-row button opens it. */
  const [creating, setCreating] = useState<string | null>(null)
  /** the crumb a detail view publishes while it is open (see useDetailCrumb) */
  const [detail, setDetail] = useState<DetailCrumb | null>(null)
  /** Landing page: `?screen=<specId>` when a spec page linked here (so the feature
      spec never has to carry its own copy of the screen), else the default. Looked
      up by label so nav reordering can't desync it. */
  const [searchParams] = useSearchParams()
  const wanted = searchParams.get('screen')
  const [active, setActive] = useState<{ group: string; item: NavItem }>(() => {
    if (wanted) {
      for (const g of NAV_GROUPS) {
        const item = g.items.find((x) => x.specId === wanted)
        if (item) return { group: g.label, item }
      }
      // then the screens that exist but are not listed in the sidebar
      const off = OFF_NAV.find((o) => o.item.specId === wanted)
      if (off) return off
    }
    const g = NAV_GROUPS.find((x) => x.label === 'Recruitment') ?? NAV_GROUPS[0]
    return { group: g.label, item: g.items[0] }
  })
  /* Bumped on every nav click. Used as the page's key so re-clicking the ALREADY
     ACTIVE item remounts it: without this the shell clears the breadcrumb but the
     page keeps its own detail state, and the crumb then describes a list while the
     content still shows a record. */
  const [navSeq, setNavSeq] = useState(0)
  /* Bumped by the title-row create button. Pages whose create REPLACES the list
     (company, job) listen for it; pages with a modal are handled below. */
  const [createSeq, setCreateSeq] = useState(0)
  /* Screens arrive lazily, so switching page is a transition: without it React
     treats a click that suspends as a synchronous update it cannot finish, throws
     away the current screen and shows the fallback. The transition lets the page
     we are leaving stay on screen until the next one is ready. */
  const select = (group: string, item: NavItem) => {
    startTransition(() => {
      setWalkthrough(null)
      setDetail(null)
      setOpenRecord(null)
      setNavSeq((n) => n + 1)
      setActive({ group, item })
    })
  }

  /* A record linked from another page: switch to the page that OWNS the record and
     hand it the id to open, so the breadcrumb names the right module and Back
     returns to the right list. */
  /* `?record=<Company ID>` opens that record directly, the same way `?screen=`
     picks the page. It exists so a specific EXAMPLE can be linked — "the company
     with two POs", "the one posting free jobs" — instead of described and hunted
     for. Same mechanism a cross-page link uses, just seeded from the URL. */
  const [openRecord, setOpenRecord] = useState<string | null>(() => searchParams.get('record'))
  const goToScreen = (specId: string, record?: string) => {
    for (const g of NAV_GROUPS) {
      const item = g.items.find((x) => x.specId === specId)
      if (!item) continue
      startTransition(() => {
        setWalkthrough(null)
        setDetail(null)
        setNavSeq((n) => n + 1)
        setActive({ group: g.label, item })
        setOpenRecord(record ?? null)
      })
      return
    }
  }

  /* Sidebar chrome: collapsed to an icon rail, and which groups are unfolded.
     Below md the labelled panel has nowhere to go, so the rail is forced on. */
  const [collapsed, setCollapsed] = useState(() => readStored(LS_COLLAPSED, false))
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    readStored(LS_OPEN_GROUPS, Object.fromEntries(NAV_GROUPS.map((g) => [g.label, true]))),
  )
  const wide = useWideViewport()
  const railOnly = collapsed || !wide

  /* Keep the address bar pointing at the page on show, so it can be shared. */
  useScreenParam(active.item.specId)
  useEffect(() => writeStored(LS_COLLAPSED, collapsed), [collapsed])
  useEffect(() => writeStored(LS_OPEN_GROUPS, openGroups), [openGroups])

  /* "[" toggles the sidebar — the shortcut every console with a collapsible nav
     uses. Ignored while the reader is typing, so it can't eat a keystroke. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const specHref = specPath(active.item.specId)
  const Proto = active.item.specId ? ADMIN_PROTOTYPES[active.item.specId] : undefined

  return (
    <div className="pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframe</p>
        <h1 className="text-[26px] font-bold tracking-tight mt-1">HQ Admin — navigation & shell</h1>
      </div>

      {/* ── Wireframe frame ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
        {/* ── Row 1: the console's ONLY bar ───────────────────────────────
            The brand block sits at the sidebar's width so the top-left corner
            reads as one piece with the nav under it, and the breadcrumb lives
            IN this bar rather than in a second row below it. */}
        <div className="flex h-[52px] shrink-0 border-b border-line">
          <div
            className={cn(
              'flex shrink-0 items-center gap-2.5 overflow-hidden border-r border-line transition-[width] duration-150',
              railOnly ? 'w-14 justify-center px-0' : 'w-[236px] pl-3 pr-1.5',
            )}
          >
            {railOnly ? (
              /* Collapsed: the logo IS the way back out — hovering it turns into the
                 expand arrow. Below md there is nothing to expand into, so it stays
                 a plain mark. */
              wide ? (
                <button
                  onClick={() => setCollapsed(false)}
                  title="Expand sidebar  ["
                  aria-label="Expand sidebar"
                  className="group grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-canvas"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-[12px] font-bold text-white group-hover:hidden">S</span>
                  <ChevronRight className="hidden h-4 w-4 text-ink group-hover:block" />
                </button>
              ) : (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-[12px] font-bold text-white">S</span>
              )
            ) : (
              <>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-[12px] font-bold text-white">S</span>
                <span className="min-w-0 truncate text-[13px] font-semibold">Saramin · HQ Admin</span>
                {/* Collapse lives on the sidebar's own header, pointing at the thing
                    it moves — not out in the page bar. */}
                <button
                  onClick={() => setCollapsed(true)}
                  title="Collapse sidebar  ["
                  aria-label="Collapse sidebar"
                  className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-canvas hover:text-ink"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Three columns, not a flex row: the search has to sit in the MIDDLE of
              the bar and stay there. With flex it started wherever the breadcrumb
              ended, so it slid left and right as you moved between pages. The two
              1fr columns split the slack evenly, which centres the auto column
              between them without absolute positioning — so it can never overlap
              the breadcrumb or the right-hand actions. */}
          {/* Three tracks, and the numbers matter:
              · both side tracks are 1fr so they always resolve EQUAL — that, not
                absolute positioning, is what puts the middle track dead centre;
              · they carry a 150px MINIMUM so the right-hand actions (History ·
                View full spec · avatar) can never be squeezed under the search;
              · the centre is minmax(0,420px), so when the bar gets tight the SEARCH
                gives up width rather than the breadcrumb or the actions.
              A bare `1fr` would be minmax(auto,1fr): the wider right column would
              then outgrow its share and shove the search off-centre. */}
          {/* Three tracks so the search sits optically centred rather than wherever the
              breadcrumb happens to end. The right track is `auto`: its contents are
              fixed-width chrome that cannot shrink, and a 1fr track narrower than
              them made the block overflow leftwards under the search box. */}
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(160px,1fr)_minmax(0,420px)_auto] items-center">
            <div className="flex min-w-0 items-center gap-2.5 px-3">
              {/* Breadcrumb. On a detail view the page segment becomes the way BACK,
                  and the record itself is the last crumb — so no page needs its own
                  "← Back to X" button. */}
              <div className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted">
                {/* the group segment is the first thing to go when the bar is tight —
                    the page (and the record on a detail view) matter more */}
                <span className="hidden shrink-0 lg:inline">{active.group}</span>
                <span className="hidden shrink-0 text-faint lg:inline">/</span>
                {detail ? (
                  <button onClick={detail.onBack} className="shrink-0 text-brand hover:underline">{active.item.label}</button>
                ) : (
                  <span className="truncate font-medium text-ink">{active.item.label}</span>
                )}
                {detail && (
                  <>
                    <span className="shrink-0 text-faint">/</span>
                    <span className="truncate font-medium text-ink">{detail.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* One search for the whole console, in the chrome rather than on a page:
                "does this company exist, and where is it?" is a question a rep asks
                from wherever they are, and the answer has to be reachable without
                first navigating to Customers. Centre column, fixed width — a search
                box that changes width as the breadcrumb grows is a moving target. */}
            <div className="hidden w-full min-w-0 md:flex">
              <GlobalCompanySearch onOpen={goToScreen} />
            </div>

            <div className="flex h-full items-center justify-self-end">
              <div className="flex h-full items-center gap-2 px-3">
                <ActivityLogButton page={active.item.label} />
                {specHref && (
                  <Link to={specHref} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-brand transition-colors hover:border-ink/30 hover:underline">
                    <span className="hidden lg:inline">View full spec</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="flex h-full items-center gap-2 px-3">
                {/* No language control: the Admin console is English-only, so a
                    switcher would offer exactly one choice. See SH-I18N-01. */}
                {/* No notification bell: nothing in this console pushes an alert a
                    reader can act on, so a permanently-dotted bell only promises
                    something that never arrives. */}
                <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-brand to-violet-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex">
          <AdminSidebar
            collapsed={railOnly}
            activeGroup={active.group}
            activeItem={active.item.label}
            openGroups={openGroups}
            onToggleGroup={(label) => setOpenGroups((o) => ({ ...o, [label]: !(o[label] ?? true) }))}
            onSetAllGroups={(open) =>
              setOpenGroups(Object.fromEntries(NAV_GROUPS.map((g) => [g.label, open])))
            }
            onExpandSidebar={(label) => {
              setCollapsed(false)
              setOpenGroups((o) => ({ ...o, [label]: true }))
            }}
            onSelect={(group, item) => select(group, item)}
          />

          {/* Content preview */}
          <div className="min-w-0 flex-1 bg-surface">
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[17px] font-semibold">{active.item.label}</h3>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Every page is addressable, so a reviewer can point at THIS
                      screen instead of describing how to click to it. */}
                  <CopyLinkButton />
                  {/* Create belongs to the LIST. On a detail view (detail is set) the
                      page's verb is whatever that record allows, not "new". */}
                  {!walkthrough && !detail && active.item.specId && PRIMARY_ACTION[active.item.specId] && (
                    <button
                      onClick={() => { setCreating(active.item.specId!); setCreateSeq((n) => n + 1) }}
                      className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90"
                    >
                      {PRIMARY_ACTION[active.item.specId]}
                    </button>
                  )}
                </div>
              </div>

              {/* interactive walkthrough launched contextually from a page, else the page itself */}
              {walkthrough ? (
                <div>
                  <button
                    onClick={() => setWalkthrough(null)}
                    className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40"
                  >
                    ← Back to {active.item.label}
                  </button>
                  {walkthrough === 'activation' ? <ActivationFlow initialPhase={2} /> : <MonetizationFlow />}
                </div>
              ) : active.item.specId === 'admin-sales-pipeline' ? (
                <ScreenNavCtx.Provider value={goToScreen}>
                  <OpenRecordCtx.Provider value={openRecord}>
                    <DetailCrumbCtx.Provider value={setDetail}>
                      <Suspense fallback={<ScreenLoading />}>
                        <AdminPipeline onActivate={() => setWalkthrough('activation')} />
                      </Suspense>
                    </DetailCrumbCtx.Provider>
                  </OpenRecordCtx.Provider>
                </ScreenNavCtx.Provider>
              ) : Proto ? (
                <ScreenNavCtx.Provider value={goToScreen}>
                  <OpenRecordCtx.Provider value={openRecord}>
                    <DetailCrumbCtx.Provider value={setDetail}>
                      <CreateSignalCtx.Provider value={createSeq}>
                        <Suspense fallback={<ScreenLoading />}>
                          <Proto key={`${active.item.specId}-${navSeq}`} />
                        </Suspense>
                      </CreateSignalCtx.Provider>
                    </DetailCrumbCtx.Provider>
                  </OpenRecordCtx.Provider>
                </ScreenNavCtx.Provider>
              ) : (
                <>
                  <div className="overflow-hidden rounded-xl border border-line">
                    <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <span>Name</span>
                      <span>Owner</span>
                      <span>Updated</span>
                      <span>Status</span>
                    </div>
                    {[0, 1, 2, 3, 4].map((r) => (
                      <div key={r} className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] items-center border-t border-line-soft px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-canvas" />
                          <span className="h-3 rounded bg-line" style={{ width: `${60 - r * 6}%` }} />
                        </span>
                        <span className="h-3 w-16 rounded bg-line-soft" />
                        <span className="h-3 w-14 rounded bg-line-soft" />
                        <span className="h-4 w-14 rounded-full bg-canvas" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-faint">
                    Placeholder list — this page’s prototype isn’t built yet. Every module lands on a list → detail pattern with New / Filter / search.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* No placeholder: a create form is an overlay, so showing a spinner
              where the page is would be worse than the form arriving a beat later. */}
          <Suspense fallback={null}>
            {creating === 'admin-catalog' && <NewProductModal onClose={() => setCreating(null)} />}
            {creating === 'admin-bundles' && <NewPackageModal onClose={() => setCreating(null)} />}
            {creating === 'admin-quotes' && <NewQuotationModal onClose={() => setCreating(null)} />}
          </Suspense>
        </div>
      </div>

      {/* Rationale */}
    </div>
  )
}

/* ── Sidebar ─────────────────────────────────────────────────────────────────
   Two widths, one nav. Expanded (236px) it is the familiar grouped tree, each
   group foldable. Collapsed (56px) it is a rail of the six group icons, and the
   labels come back on demand: HOVER an icon for a flyout of that group's pages
   (jump without leaving the collapsed state), CLICK it to expand the sidebar on
   that group. So collapsing never costs the reader access to a page — only the
   labels being permanently on screen. */
function AdminSidebar({
  collapsed,
  activeGroup,
  activeItem,
  openGroups,
  onToggleGroup,
  onSetAllGroups,
  onExpandSidebar,
  onSelect,
}: {
  collapsed: boolean
  activeGroup: string
  activeItem: string
  openGroups: Record<string, boolean>
  onToggleGroup: (label: string) => void
  onSetAllGroups: (open: boolean) => void
  onExpandSidebar: (label: string) => void
  onSelect: (group: string, item: NavItem) => void
}) {
  /* group whose flyout is showing, and where to pin it (the icon's offset) */
  const [fly, setFly] = useState<{ label: string; top: number } | null>(null)
  const flyGroup = fly && NAV_GROUPS.find((g) => g.label === fly.label)
  const allOpen = NAV_GROUPS.every((g) => openGroups[g.label] ?? true)

  return (
    <aside
      onMouseLeave={() => setFly(null)}
      className={cn(
        'relative flex shrink-0 border-r border-line bg-canvas/30 transition-[width] duration-150',
        collapsed ? 'w-14' : 'w-[236px]',
      )}
    >
      {collapsed ? (
        <nav className="flex max-h-[640px] w-full flex-col items-center gap-1 overflow-y-auto scroll-thin py-2">
          {NAV_GROUPS.map((g) => (
            <button
              key={g.label}
              title={g.label}
              aria-label={g.label}
              onMouseEnter={(e) => setFly({ label: g.label, top: e.currentTarget.offsetTop })}
              onClick={() => onExpandSidebar(g.label)}
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors',
                activeGroup === g.label ? 'bg-brand-soft text-brand' : 'text-faint hover:bg-canvas hover:text-ink',
              )}
            >
              {g.icon}
            </button>
          ))}
        </nav>
      ) : (
        <nav className="max-h-[640px] w-full overflow-y-auto scroll-thin px-2 py-2.5">
          {NAV_GROUPS.map((g) => {
            const open = openGroups[g.label] ?? true
            return (
              <div key={g.label}>
                <button
                  onClick={() => onToggleGroup(g.label)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] font-medium text-ink hover:bg-canvas"
                >
                  <span className={cn(activeGroup === g.label ? 'text-brand' : 'text-faint')}>{g.icon}</span>
                  <span className="truncate">{g.label}</span>
                  {/* folded away but holding the current page — the reader still
                      needs to see where they are */}
                  {!open && activeGroup === g.label && (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  )}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-faint transition-transform',
                      !open && activeGroup === g.label ? 'ml-1.5' : 'ml-auto',
                      !open && '-rotate-90',
                    )}
                  />
                </button>
                {open && (
                  <ul>
                    {g.items.map((it) => (
                      <li key={it.label}>
                        <NavPage
                          label={it.label}
                          active={activeGroup === g.label && activeItem === it.label}
                          badge={it.badge}
                          onClick={() => onSelect(g.label, it)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
          {/* One click between the full tree and a six-line index of the console. */}
          <button
            onClick={() => onSetAllGroups(!allOpen)}
            className="mt-2 w-full border-t border-line-soft px-2 pt-2 text-left text-[11px] text-muted hover:text-brand"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </nav>
      )}

      {/* flyout — the collapsed rail's labels, on hover */}
      {collapsed && flyGroup && (
        <div
          style={{ top: fly!.top - 6 }}
          className="absolute left-14 z-30 min-w-[196px] rounded-xl border border-line bg-surface p-1.5 shadow-xl"
        >
          <p className="px-2 pb-1 pt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-faint">
            {flyGroup.label}
          </p>
          <ul>
            {flyGroup.items.map((it) => (
              <li key={it.label}>
                <NavPage
                  label={it.label}
                  active={activeGroup === flyGroup.label && activeItem === it.label}
                  badge={it.badge}
                  flush
                  onClick={() => {
                    setFly(null)
                    onSelect(flyGroup.label, it)
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

/** One page row — indented under its group in the panel, flush inside a flyout. */
function NavPage({
  label,
  active,
  flush,
  badge,
  onClick,
}: {
  label: string
  active: boolean
  flush?: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-lg py-1.5 pr-2 text-left text-[12px] transition-colors',
        flush ? 'pl-2' : 'pl-8',
        active ? 'bg-brand-soft font-medium text-brand' : 'text-ink/70 hover:bg-canvas',
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {/* Zero is not rendered — an empty queue should look like nothing to do,
          not like a page reporting in. A "0" badge trains people to ignore it. */}
      {!!badge && (
        <span className={cn(
          'ml-1.5 shrink-0 rounded-full px-1.5 text-[10px] font-semibold leading-[17px]',
          active ? 'bg-brand text-white' : 'bg-amber-100 text-amber-800',
        )}>{badge}</span>
      )}
    </button>
  )
}

