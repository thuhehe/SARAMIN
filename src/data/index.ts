import type { FeatureSpec, NavModule } from './types'
import { JOBSEEKER_SPECS } from './features/jobseeker'
import { EMPLOYER_SPECS } from './features/employer'
import { SHARED_SPECS } from './features/shared'
import { ADMIN_SPECS } from './features/admin'
import { CROSSCUTTING_SPECS } from './features/crosscutting'
import { NAV } from './nav'
import { MODULES } from './modules'

const ALL: FeatureSpec[] = [
  ...JOBSEEKER_SPECS,
  ...EMPLOYER_SPECS,
  ...SHARED_SPECS,
  ...ADMIN_SPECS,
  ...CROSSCUTTING_SPECS,
]

/** id → spec */
export const SPECS: Record<string, FeatureSpec> = Object.fromEntries(
  ALL.map((s) => [s.id, s]),
)

export const ALL_SPECS = ALL
export { NAV, MODULES }
export type { FeatureSpec, NavModule }

/** flat, in-nav order — for prev/next navigation. */
export const NAV_ORDER: string[] = (() => {
  const ids: string[] = []
  const walk = (nodes: { id?: string; children?: unknown[] }[]) => {
    for (const n of nodes) {
      if (n.id) ids.push(n.id)
      if (n.children) walk(n.children as { id?: string; children?: unknown[] }[])
    }
  }
  NAV.forEach((m) => walk(m.children))
  return ids
})()
