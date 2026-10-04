/*
 * The shape of the jobseeker handbook. Same model as the admin guide: one
 * document, two audiences. Blocks marked `dev: true` are hidden in the user view
 * and shown in the Developer view — the audience is a filter over one source,
 * never a second copy, because two copies drift and the rule they disagree on is
 * always the one that mattered.
 */

export interface GuideTable {
  cols: string[]
  rows: string[][]
}

export type GuideBlock =
  /** a paragraph */
  | { kind: 'p'; text: string; dev?: boolean }
  /** numbered actions — what to DO, in order */
  | { kind: 'steps'; heading?: string; items: string[]; dev?: boolean }
  /** the screens a journey passes through, left to right */
  | { kind: 'flow'; heading?: string; items: { label: string; path?: string }[]; dev?: boolean }
  /** a value grid — the default for anything with more than three cases */
  | { kind: 'table'; heading?: string; note?: string; table: GuideTable; dev?: boolean }
  /** the one rule of the section that, unknown, produces a wrong outcome */
  | { kind: 'warn'; text: string; dev?: boolean }
  /** a helpful aside — not a rule, a shortcut */
  | { kind: 'tip'; text: string; dev?: boolean }
  /** deep links into the live jobseeker site */
  | { kind: 'links'; items: { label: string; path: string }[]; dev?: boolean }
  /** one screen's copy, as generated from the build (copy.generated.json) */
  | { kind: 'copy'; screen: string; dev?: boolean }
  /** the whole copy review's toolbar: copy-all / download */
  | { kind: 'copy-all'; dev?: boolean }

export interface GuideSection {
  /** anchor id — stable once published; the page's URL hash */
  id: string
  /** the parent module (GuideModule.id) */
  module: string
  /** the sub-module inside it (GuideSub.label) */
  group: string
  /** short badge in the sidebar */
  code: string
  /** sidebar label */
  label: string
  title: string
  /** the route(s) on the live site this section describes */
  where?: string
  lead?: string
  blocks: GuideBlock[]
  /** whole section hidden from the user view */
  dev?: boolean
}

/** A sub-module: one row of pages inside a module. */
export interface GuideSub {
  label: string
  /** one line on the module's overview card */
  blurb: string
}

/** A parent module. Its overview is the landing page; its pages are reached
    through the sub-modules, one page at a time. */
export interface GuideModule {
  id: string
  code: string
  label: string
  title: string
  lead: string
  /** the three "I want to…" cards above the fold */
  quick?: { q: string; a: string }[]
  keyFact?: { heading: string; text: string }
  links?: { label: string; path: string }[]
  subs: GuideSub[]
  /** extra blocks under the sub-module cards */
  blocks?: GuideBlock[]
}

export interface Handbook {
  modules: GuideModule[]
  sections: GuideSection[]
  /** what build this was written from — shown in the footer */
  source: { web: string; be: string; date: string }
}
