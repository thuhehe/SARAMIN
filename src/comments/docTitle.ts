import { BUILD_MODULES } from '@/data/buildModules'
import { NAV_ORDER, SPECS } from '@/data'

/**
 * `docKey` is a router path — the API never dereferences it, so the job of
 * turning `/m/crm/3` back into "CRM — Sales & customer lifecycle › Purchase
 * orders" belongs here, on the site that owns the routes.
 *
 * Also carries a display *order*, so the rail can list other pages in the
 * same sequence as the left nav. A reviewer scanning the rail and a
 * reviewer scanning the nav should be walking the same document.
 */

interface Page {
  label: string
  order: number
}

const PAGES = new Map<string, Page>()

let next = 0
const add = (path: string, label: string) => {
  if (!PAGES.has(path)) PAGES.set(path, { label, order: next++ })
}

// Same order as the sidebar: standalone pages, then modules and their
// features, then the feature specs reachable from /f/:id.
add('/', 'Overview')
add('/modules', 'Modules')
add('/plan', 'Build plan')
add('/mockups', 'Jobseeker mockups')
add('/mockups/company', 'Company mockups')
add('/wireframe/admin', 'Admin mockups')
add('/legend', 'Status legend')

for (const module of BUILD_MODULES) {
  add(`/m/${module.id}`, module.title)
  module.features.forEach((feature, index) =>
    add(`/m/${module.id}/${index}`, `${module.title} › ${feature.name}`),
  )
}

for (const id of NAV_ORDER) {
  const spec = SPECS[id]
  if (spec) add(`/f/${id}`, spec.title)
}

/**
 * A comment can outlive the page it was left on — a module renamed, a
 * feature reordered, a route dropped. Showing the bare path is better
 * than hiding the thread: the reader can still read the question and see
 * that its page is gone.
 */
export function docTitle(docKey: string): string {
  return PAGES.get(docKey)?.label ?? docKey
}

/** Unknown pages sort last, together, rather than jumping to the top. */
export function docOrder(docKey: string): number {
  return PAGES.get(docKey)?.order ?? Number.MAX_SAFE_INTEGER
}

export interface DocLabelParts {
  /** The module the page belongs to, or null for a standalone page. */
  parent: string | null
  /** The page's own name. */
  leaf: string
}

/**
 * Split a page label at its last `›`, so a narrow list can lead with the
 * part that identifies the page and demote the part that repeats.
 *
 * In a rail this matters more than it sounds: five features of one module
 * all begin "CRM — Sales & customer lifecycle › …", and a single truncated
 * line shows the reader five identical rows whose only distinguishing text
 * is the bit that got cut off.
 */
export function docLabelParts(docKey: string): DocLabelParts {
  const label = docTitle(docKey)
  const at = label.lastIndexOf('›')
  if (at === -1) return { parent: null, leaf: label }
  return { parent: label.slice(0, at).trim(), leaf: label.slice(at + 1).trim() }
}

/** False when the path no longer maps to a page on this site. */
export function docExists(docKey: string): boolean {
  return PAGES.has(docKey)
}
