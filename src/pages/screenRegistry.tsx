/*
 * Unified screen resolver — maps a feature's `mockup` id to a renderable screen
 * from whichever mockup set it lives in (Jobseeker / Company / Admin).
 *
 * The three mockup systems were built with different id schemes, so the ALIAS
 * table below reconciles the ids authored in src/data/build/* with the actual
 * screen ids. When the source registries realign their ids, shrink ALIAS.
 * Ids with no built screen (e.g. crm-customer, crm-products) resolve to null and
 * the feature page shows a "not wired yet" placeholder.
 */
import { SCREENS } from './Mockups'
import { CO_SCREENS } from './CompanyMockups'
import { ADMIN_PROTOTYPES } from './adminPrototypes'

export type ScreenSource = 'js' | 'co' | 'admin'
export type ResolvedScreen = {
  title?: string
  url?: string
  Comp: () => JSX.Element
  /** which gallery this screen actually lives in — powers the "open in mockups" link */
  src: ScreenSource
  /** the screen's id INSIDE that gallery (post-alias), for deep-linking */
  screenId: string
}

/* Some screens are sub-screens reached from a nav page rather than nav pages
   themselves (the create form lives behind "+ New job" on the job list). The
   preview still shows the sub-screen — that is what the requirement is about —
   but the link has to open the nav page that owns it, or it lands nowhere. */
const NAV_OWNER: Record<string, string> = {
  'admin-job-create': 'admin-job-list', // reached from "+ New job"
  'admin-credits': 'admin-company-list', // a per-company balance — lives on the company record
}

/** Every admin screen a spec page can show, and the nav page that opens it. Anything
    not here has no home in the console, and we render no link rather than a link
    that quietly lands on the default page. */
const ADMIN_NAV_PAGES = new Set([
  'admin-job-list', 'admin-job-applicants', 'admin-resumes',
  'admin-company-list', 'admin-company-pipeline', 'admin-quotes', 'admin-purchase-orders', 'admin-signups',
  'admin-jobseekers', 'admin-company-users',
  // Products only: Packages and Promotions were removed from the console nav, so a
  // spec page showing those screens gets a preview but no link to a page that exists.
  'admin-catalog',
  'admin-banners', 'admin-popups', 'admin-pages', 'admin-boards', 'admin-blog',
  'admin-analytics-dashboard', 'admin-sales-report', 'admin-recruit-report', 'admin-revenue-report', 'admin-user-behavior',
  'admin-users', 'admin-roles', 'admin-master-data', 'admin-audit-log', 'admin-environment', 'admin-departments',
])

/** Deep link to the gallery that owns this screen, so the spec page never becomes a
    second place a screen has to be maintained. null = no gallery page opens it. */
export function mockupHref(s: ResolvedScreen): string | null {
  if (s.src === 'co') return '/mockups/company'
  if (s.src === 'js') return '/mockups'
  const page = NAV_OWNER[s.screenId] ?? s.screenId
  return ADMIN_NAV_PAGES.has(page) ? `/wireframe/admin?screen=${page}` : null
}

const JS = new Map<string, ResolvedScreen>(
  SCREENS.map((s) => [s.id, { title: s.title, url: s.url, Comp: s.Comp, src: 'js' as const, screenId: s.id }]),
)
const CO = new Map<string, ResolvedScreen>(
  CO_SCREENS.map((s) => [s.id, { title: s.label, url: 'company.saramin.vn', Comp: s.Comp, src: 'co' as const, screenId: s.id }]),
)

/** authored `mockup` id → actual screen (source + id). */
const ALIAS: Record<string, { src: 'js' | 'co' | 'admin'; id: string }> = {
  // Company site — data ids differ from the CompanyMockups screen ids
  'co-create-job': { src: 'co', id: 'co-post-job' },
  'co-job-list': { src: 'co', id: 'co-jobs' },
  'co-application-list': { src: 'co', id: 'co-applicants' },
  'crm-company-page': { src: 'co', id: 'co-company-page' },
  // CRM / Admin console
  // The console's own Pipeline page. NOT admin-sales-pipeline: that component is
  // not on the admin nav, so a spec page showing it would be displaying a screen
  // the mockup gallery has no way to reach — the exact drift we are removing.
  'crm-pipeline': { src: 'admin', id: 'admin-company-pipeline' },
  'crm-customer': { src: 'admin', id: 'admin-company-list' }, // the one shared company/customer list
  'crm-signups': { src: 'admin', id: 'admin-signups' },
  // No screen built yet: crm-products (entitlements), crm-activate (activation is a flow)
}

function fromSource(src: ScreenSource, id: string): ResolvedScreen | null {
  if (src === 'js') return JS.get(id) ?? null
  if (src === 'co') return CO.get(id) ?? null
  return id in ADMIN_PROTOTYPES ? { url: 'admin.saramin.vn', Comp: ADMIN_PROTOTYPES[id], src: 'admin', screenId: id } : null
}

export function resolveScreen(mockupId?: string): ResolvedScreen | null {
  if (!mockupId) return null
  // ALIAS FIRST, deliberately. Several CRM ids exist in BOTH the storyboard in
  // Mockups.tsx and the real admin console prototype; the alias names the one that
  // is actually maintained. Resolving direct hits first let the storyboard shadow
  // the console, which is how a spec page ended up rendering a second, stale copy
  // of the company screen. One id must resolve to exactly one component.
  const a = ALIAS[mockupId]
  if (a) return fromSource(a.src, a.id)
  if (JS.has(mockupId)) return JS.get(mockupId)!
  if (CO.has(mockupId)) return CO.get(mockupId)!
  if (mockupId in ADMIN_PROTOTYPES) return { url: 'admin.saramin.vn', Comp: ADMIN_PROTOTYPES[mockupId], src: 'admin', screenId: mockupId }
  return null
}
