import { BUILD_MODULES } from './buildModules'
import type { BuildFeature, BuildModule } from './build/types'

/*
 * Feature URLs are keyed by a SLUG, never by the array index.
 *
 * `/m/resume-management/9` breaks the moment a feature is inserted above it:
 * the link still resolves, silently, to a different requirement — which is
 * worse than a 404, because a shared link keeps working and starts lying.
 * `/m/resume-management/resume-list-companies` survives any reordering.
 *
 * The slug comes from the feature NAME, or from an explicit `slug` on the
 * feature where two features in one module share a name (Admin vs Companies
 * versions of Job list, Create job, Application list, Resume list). Authoring
 * the clashing ones explicitly is deliberate: a slug derived from position in
 * the array, or auto-suffixed only "when needed", would shift again the day a
 * third same-named feature is added — reintroducing the exact bug this fixes.
 */

/** Vietnamese-safe: strips diacritics so "Phúc lợi" → "phuc-loi". */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** The stable id of a feature within its module. */
export function featureSlug(f: BuildFeature): string {
  return f.slug ?? slugify(f.name)
}

/** Canonical URL of a feature page. The ONLY place a feature path is built. */
export function featurePath(m: BuildModule, f: BuildFeature): string {
  return `/m/${m.id}/${featureSlug(f)}`
}

export interface ResolvedFeature {
  feature: BuildFeature
  index: number
  /** true when the URL used the old numeric index — the caller redirects. */
  legacy: boolean
}

/**
 * Resolve the `:featureKey` route param. Slug first; a bare number is accepted
 * so links already shared (and comment threads already left) keep working.
 */
export function resolveFeature(m: BuildModule, key: string | undefined): ResolvedFeature | null {
  if (!key) return null
  const bySlug = m.features.findIndex((f) => featureSlug(f) === key)
  if (bySlug >= 0) return { feature: m.features[bySlug], index: bySlug, legacy: false }
  if (/^\d+$/.test(key)) {
    const index = Number(key)
    const feature = m.features[index]
    if (feature) return { feature, index, legacy: true }
  }
  return null
}

/**
 * Comment threads are keyed by pathname. A thread left on `/m/x/9` before the
 * slug change must still appear on that feature's page, so the page reads its
 * canonical key PLUS the numeric key the feature happens to sit at today.
 * Returns the canonical path first.
 */
export function featureDocKeys(m: BuildModule, r: ResolvedFeature): string[] {
  return [featurePath(m, r.feature), `/m/${m.id}/${r.index}`]
}

/** Dev-only guard: two features in one module must never share a slug. */
export function assertUniqueSlugs(modules: BuildModule[]): void {
  for (const m of modules) {
    const seen = new Map<string, string>()
    for (const f of m.features) {
      const s = featureSlug(f)
      const clash = seen.get(s)
      if (clash) {
        console.error(
          `[featureSlug] duplicate slug "${s}" in module "${m.id}": "${clash}" and "${f.name}". ` +
            'Add an explicit `slug` to one of them — otherwise one of the two pages is unreachable.',
        )
      }
      seen.set(s, f.name)
    }
  }
}

/**
 * Map any doc path to its canonical form. A comment thread left on the old
 * `/m/{module}/{index}` URL resolves to the same page as its slug URL, so the
 * two must not read as two different documents in the rail or the nav badges.
 * Anything that is not a feature path is returned unchanged.
 */
export function canonicalDocKey(pathname: string): string {
  const parts = /^\/m\/([^/]+)\/([^/]+)$/.exec(pathname)
  if (!parts) return pathname
  const m = BUILD_MODULES.find((x) => x.id === parts[1])
  if (!m) return pathname
  const hit = resolveFeature(m, parts[2])
  return hit ? featurePath(m, hit.feature) : pathname
}
