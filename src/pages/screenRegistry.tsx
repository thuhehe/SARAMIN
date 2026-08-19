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
import { ADMIN_SCREEN_LABELS } from './AdminWireframe'

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
  'admin-resume-new': 'admin-resumes', // reached from "+ New resume"
  'admin-credits': 'admin-company-list', // a per-company balance — lives on the company record
}

/** Every admin screen a spec page can show, and the nav page that opens it. Anything
    not here has no home in the console, and we render no link rather than a link
    that quietly lands on the default page. */
const ADMIN_NAV_PAGES = new Set([
  'admin-job-list', 'admin-job-applicants', 'admin-resumes', 'admin-cv-check',
  'admin-company-list', 'admin-company-pipeline', 'admin-quotes', 'admin-purchase-orders', 'admin-signups', 'admin-invoices',
  // The free company pool and its approval queue. Directory is load-bearing today
  // — a CRM feature renders it via the crm-company-directory alias, so leaving it
  // out suppressed that page's console link. Claim queue has no feature pointing at
  // it yet and is listed for the same reason as any other built nav page.
  'admin-company-directory', 'admin-claim-queue',
  'admin-jobseekers', 'admin-company-users',
  // The whole Products group is back in the console nav — Packages, Placements and
  // Discount programmes alongside Products — so all four get a link again. Omitting
  // them suppressed the link for pages that DO exist, which is the opposite of what
  // this set is for.
  'admin-catalog', 'admin-bundles', 'admin-placements', 'admin-promotions',
  // ONE page for all manual services (the per-service split was reverted — five
  // products across a hundred companies is one list at the grain of company ×
  // service), plus the per-account usage view.
  'admin-manual-services', 'admin-account-usage', 'admin-cv-search-usage',
  // Image gallery sits beside Placements in the nav — it is configuration a
  // placement reads (the stock pictures its image slots draw from), not something
  // a customer bought.
  'admin-banners', 'admin-image-gallery', 'admin-pages',
  'admin-analytics-dashboard', 'admin-sales-report', 'admin-recruit-report', 'admin-revenue-report', 'admin-user-behavior',
  'admin-staff', 'admin-users', 'admin-roles', 'admin-issuer', 'admin-membership',
  // Matching settings + report. Preventative: no feature renders either screen
  // yet, so no link is being suppressed today — they are listed because the set
  // covers every screen a spec page CAN show, and the gap would only surface as
  // a missing link the day a feature points at one.
  'admin-matching-settings', 'admin-matching-report',
  'admin-master-data', 'admin-unresolved-terms', 'admin-audit-log', 'admin-environment', 'admin-departments',
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

/* Admin screens carry no title of their own — the console's own nav is where a
   screen is NAMED, so the label is read from there. Without this a spec page
   shows the raw id ("admin-cv-check"), which is a slug, not a name. */
const ADMIN_TITLES = ADMIN_SCREEN_LABELS

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
  // The free company pool and its approval queue. Two screens, one spec feature.
  'crm-company-directory': { src: 'admin', id: 'admin-company-directory' },
  'crm-claim-queue': { src: 'admin', id: 'admin-claim-queue' },
  // No screen built yet: crm-products (entitlements), crm-activate (activation is a flow)
}

function fromSource(src: ScreenSource, id: string): ResolvedScreen | null {
  if (src === 'js') return JS.get(id) ?? null
  if (src === 'co') return CO.get(id) ?? null
  return id in ADMIN_PROTOTYPES ? { title: ADMIN_TITLES[id], url: 'admin.saramin.vn', Comp: ADMIN_PROTOTYPES[id], src: 'admin', screenId: id } : null
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
  if (mockupId in ADMIN_PROTOTYPES) return { title: ADMIN_TITLES[mockupId], url: 'admin.saramin.vn', Comp: ADMIN_PROTOTYPES[mockupId], src: 'admin', screenId: mockupId }
  return null
}
