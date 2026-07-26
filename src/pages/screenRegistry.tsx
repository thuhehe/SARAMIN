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

export type ResolvedScreen = { title?: string; url?: string; Comp: () => JSX.Element }

const JS = new Map<string, ResolvedScreen>(
  SCREENS.map((s) => [s.id, { title: s.title, url: s.url, Comp: s.Comp }]),
)
const CO = new Map<string, ResolvedScreen>(
  CO_SCREENS.map((s) => [s.id, { title: s.label, url: 'company.saramin.vn', Comp: s.Comp }]),
)

/** authored `mockup` id → actual screen (source + id). */
const ALIAS: Record<string, { src: 'js' | 'co' | 'admin'; id: string }> = {
  // Company site — data ids differ from the CompanyMockups screen ids
  'co-create-job': { src: 'co', id: 'co-post-job' },
  'co-job-list': { src: 'co', id: 'co-jobs' },
  'co-application-list': { src: 'co', id: 'co-applicants' },
  'crm-company-page': { src: 'co', id: 'co-company-page' },
  // CRM / Admin console
  'crm-pipeline': { src: 'admin', id: 'admin-sales-pipeline' },
  'crm-customer': { src: 'admin', id: 'admin-company-list' }, // the one shared company/customer list
  // No screen built yet: crm-products (entitlements), crm-activate (activation is a flow)
}

function fromSource(src: 'js' | 'co' | 'admin', id: string): ResolvedScreen | null {
  if (src === 'js') return JS.get(id) ?? null
  if (src === 'co') return CO.get(id) ?? null
  return id in ADMIN_PROTOTYPES ? { url: 'admin.saramin.vn', Comp: ADMIN_PROTOTYPES[id] } : null
}

export function resolveScreen(mockupId?: string): ResolvedScreen | null {
  if (!mockupId) return null
  // direct hits across the three registries
  if (JS.has(mockupId)) return JS.get(mockupId)!
  if (CO.has(mockupId)) return CO.get(mockupId)!
  if (mockupId in ADMIN_PROTOTYPES) return { url: 'admin.saramin.vn', Comp: ADMIN_PROTOTYPES[mockupId] }
  // reconciled via alias
  const a = ALIAS[mockupId]
  return a ? fromSource(a.src, a.id) : null
}
