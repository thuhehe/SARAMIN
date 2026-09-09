/*
 * One user guide per module, keyed by module id. A module without an entry has
 * no guide yet — the sidebar and the module page simply do not offer one.
 * Add a module by writing ./<module>.ts and listing it here.
 */
import type { ModuleGuide } from './types'
import { crmGuide } from './crm'
import { jobManagementGuide } from './job-management'
import { productsPackagesGuide } from './products-packages'

export type { ModuleGuide, GuideTask, GuideShot, GuideSettings, GuideSource } from './types'

export const GUIDES: Record<string, ModuleGuide> = Object.fromEntries(
  [productsPackagesGuide, crmGuide, jobManagementGuide].map((g) => [g.moduleId, g]),
)

/** Canonical URL of a module's user guide. The ONLY place this path is built. */
export function guidePath(moduleId: string): string {
  return `/m/${moduleId}/guide`
}
