/*
 * Build-module types + the rich per-feature detail schema.
 *
 * `BUILD_MODULES` (composed in ../buildModules.ts from one file per module in
 * this folder) is the authoritative build plan. Each feature can carry an
 * optional `detail` — the deep spec we author "as detailed as possible".
 *
 * Detail reuses the small building blocks from ../types (FieldGroup, BackendSpec,
 * SpecSection) so the two systems stay consistent.
 */
import type { FieldGroup, BackendSpec, SpecSection, SpecTable } from '../types'

export type Site = 'Jobseekers' | 'Companies' | 'Admin'
export type Scope = 'BE' | 'FE' | 'UI'

export const SITE_META: Record<Site, { label: string; tag: string; pill: string; dot: string }> = {
  Jobseekers: { label: 'Jobseekers', tag: 'JS', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Companies: { label: 'Companies', tag: 'CO', pill: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  Admin: { label: 'Admin', tag: 'Admin', pill: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
}

export const SCOPE_META: Record<Scope, { pill: string }> = {
  BE: { pill: 'bg-blue-100 text-blue-700 border-blue-200' },
  FE: { pill: 'bg-blue-100 text-blue-700 border-blue-200' },
  UI: { pill: 'bg-orange-100 text-orange-700 border-orange-200' },
}

/*
 * BA readiness — the dot next to each feature in the left nav.
 *
 * Green = the requirement is written up and ready for the BA to work from.
 * Grey  = not ready yet. Set MANUALLY per feature via `ready: true`; this is a
 * human judgement about the spec, not something derived from the data.
 */
export const READY_META = {
  ready: { dot: 'bg-emerald-500', label: 'Ready for BA' },
  notReady: { dot: 'bg-slate-300', label: 'Not ready yet' },
} as const

/**
 * A client-supplied source document this requirement was written from, rendered as
 * a clickable card so a reader can open the ORIGINAL instead of trusting a summary
 * of it. Files live under `public/docs/` and are served by the site itself, so a
 * link never depends on someone's Drive permissions.
 */
export interface RefDoc {
  /** file name as the reader should see it, e.g. "Products.pptx" */
  label: string
  /** href — a path under public (`/docs/Products.pptx`) or an external URL */
  href: string
  /** shape of the file, e.g. "PPTX · 26 slides · 20 MB" */
  meta?: string
  /** one line: what it covers, and who / when it came from */
  note?: string
}

/**
 * One key point. A plain string is English-only; the object form is BILINGUAL and
 * renders Vietnamese first with the English underneath — stacked, never run
 * together on one line, so each language can be read on its own. Key points are
 * what a VN developer and a client reviewer both read first, which is exactly the
 * audience that needs both languages.
 */
export type KeyPoint = string | { vi: string; en: string }

/** Deep per-feature spec — authored to be "as detailed as possible". All optional. */
/**
 * A bullet, or a labelled GROUP of bullets. Twenty flat bullets is a wall nobody
 * finishes; the same twenty under five headings is a list a reader can navigate and
 * come back to. Plain strings still work, so existing lists need no change.
 */
export type BulletItem = string | { group: string; items: string[] }

export interface FeatureDetail {
  /** client source documents this requirement was written from. */
  refDocs?: RefDoc[]
  /** 1–2 paragraph overview: what this screen/feature is and does. */
  description?: string
  /** "As a … I want … so that …" */
  userStory?: string
  /**
   * The handful of rules a developer must not miss. Rendered directly under
   * Overview, above everything else including the screen, and styled to be
   * unmissable — this document is long, and the rules that decide the build get
   * lost in it. Keep it to 3–6 lines; a key-points list that grows into a second
   * requirement list stops being read.
   */
  keyPoints?: KeyPoint[]
  /** UI fields captured on the screen(s), grouped. */
  uiFields?: FieldGroup[]
  /** interaction / behaviour rules, in order. */
  behaviors?: BulletItem[]
  /** business / validation rules. */
  rules?: BulletItem[]
  /** empty / loading / error / edge states to design for. */
  states?: string[]
  /** backend contract: data model, endpoints, integrations, notes. */
  backend?: BackendSpec
  /** acceptance criteria — "done when…". */
  acceptance?: string[]
  /** freeform extra sections. */
  sections?: SpecSection[]
  /** Rules that belong to THIS feature rather than to the whole module — same
      shape as module requirements (label + text + table + items), so a rule can
      live next to the screen it governs instead of in a module-wide list. */
  requirements?: Requirement[]
  /** open questions for the client / team. */
  openQuestions?: string[]
}

export interface BuildFeature {
  name: string
  site: Site
  scope: Scope[]
  notes?: string
  /** id of a wireframe on the Mockups page, if one exists */
  mockup?: string
  /**
   * Is this requirement ready for the BA to pick up? Drives the nav dot:
   * green when true, grey otherwise. Set by hand — see READY_META.
   */
  ready?: boolean
  /** deep spec — rendered on the feature detail page when present */
  detail?: FeatureDetail
}

/** A small table inside a requirement — the fastest way to read a rule set.
    Same shape as a spec-section table, so one renderer serves both. */
export type ReqTable = SpecTable

/**
 * A requirement is either a plain sentence, or a LABELLED BLOCK — a short title
 * plus any of: one lead sentence, a table, and a list of sub-points. Blocks exist
 * so a dense rule (stage meanings, status values, thresholds) can be read as a
 * table instead of a paragraph. Prefer a block whenever a requirement is longer
 * than ~2 lines or enumerates more than 3 things.
 */
export interface RequirementBlock {
  label: string
  text?: string
  table?: ReqTable
  items?: string[]
  /** rendered as a warning-toned callout — for "must never" rules. */
  warn?: string
}

export type Requirement = string | RequirementBlock

export interface BuildModule {
  id: string
  title: string
  owner: string
  /**
   * The awkward real-world cases this module has an answer for — pinned above the
   * requirements. This is the section a client scans first to check we understood
   * their business, so keep each entry to the case and the resolution, not the
   * mechanism. Omit rather than pad: an empty highlight reads worse than none.
   */
  /** Awkward real-world shapes this module answers. `text` may carry blank-line
      paragraph breaks; `warn` is the rule that must actually be ENFORCED, kept
      separate so it does not read as more prose. */
  edgeCases?: { label: string; text: string; warn?: string }[]
  /** authored — what the module must deliver (VN-standard). */
  requirements: Requirement[]
  features: BuildFeature[]
}
