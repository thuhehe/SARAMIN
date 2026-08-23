/*
 * Content model for the Saramin VN feature spec.
 *
 * The whole documentation site is data-driven: the team edits `features.ts`
 * (one `FeatureSpec` per navigable page) and `nav.ts` (the left-hand tree).
 * Nothing else needs to change to add / update a requirement.
 */

/** Build / backend readiness — mirrors the labels used in the Notion inventory. */
export type Status =
  | 'live-wired' //   screen exists AND connected to the real backend
  | 'built-mock' //   screen built but serving mock/demo data
  | 'be-migrated' //  admin module reads/writes the real backend
  | 'prototype' //    works only against the local prototype DB (Prisma/SQLite)
  | 'empty-seam' //   route/menu exists but page is a placeholder
  | 'not-started' //  not built yet
  | 'unknown'

/** A single data / form field, used for both UI fields and backend data-model fields. */
export interface Field {
  name: string
  type: string
  required?: boolean
  notes?: string
}

export interface FieldGroup {
  /** optional group heading, e.g. "Profile", "Password rules" */
  group?: string
  items: Field[]
}

/** An open question / unknown. `audience` says who must answer it. */
export interface OpenItem {
  text: string
  audience?: 'Client' | 'BA' | 'Backend' | 'Design' | 'Eng' | 'Legal'
  severity?: 'blocker' | 'open' | 'info'
}

export interface BackendSpec {
  /** persisted entity fields */
  dataModel?: Field[]
  /** API endpoints this screen touches */
  endpoints?: string[]
  /** external systems / integrations required */
  integrations?: string[]
  /** free-form backend notes */
  notes?: string
}

/** A simple header-row + rows table. Shared by requirement blocks (as `ReqTable`)
    and by spec sections, so an enum's values can be read as a grid instead of a
    sentence — the format the team actually reviews from. */
export interface SpecTable {
  cols: string[]
  rows: string[][]
}

export interface SpecSection {
  /** short heading, e.g. "Fields", "Behaviours", "Validation" */
  heading: string
  /** Pin this section directly under Overview, ABOVE "UI fields", instead of
      leaving it in the trailing block after Acceptance criteria. For the section
      that describes what the screen/document actually IS — a reader needs that
      before a field list, not five blocks below the backend contract. */
  early?: boolean
  /** optional lead sentence above the table / bullets. */
  text?: string
  /** render a named diagram component above the table. Diagrams are hand-built
      React, not data, because the one thing worth drawing on a spec page is the
      DIRECTION of a model — and that is a layout problem, not a list of rows. */
  diagram?: 'cv-status' | 'cv-language'
  /** value grid — use it for enums (status, exposure, stage) where each value has
      a meaning and a consequence; a table beats four bullets every time. */
  table?: SpecTable
  /** bullet lines */
  items?: string[]
  /** rendered as a warning-toned callout — for the "must never" rule of a section. */
  warn?: string
}

export interface FeatureSpec {
  /** slug — used in the URL and as the map key. */
  id: string
  /** short human title shown in the header and nav. */
  title: string
  /** optional feature code, e.g. "JS-AUTH-01". */
  code?: string
  /** which app surface this belongs to (for the header breadcrumb). */
  surface?: string
  status: Status
  /** one-line "what it does" (shown in nav tooltip + header). */
  summary: string
  /** longer description paragraph(s). */
  description?: string

  /** UI fields captured on the screen (rendered as a table). */
  uiFields?: FieldGroup[]
  /** ordered behaviour / interaction rules. */
  behaviors?: string[]
  /** business / validation rules. */
  rules?: string[]
  /** free-form additional spec sections. */
  sections?: SpecSection[]

  /** backend contract — the "fields for Backend" the user asked for. */
  backend?: BackendSpec

  /** what is confirmed / settled. */
  known?: string[]
  /** what still needs investigation. */
  unknown?: string[]
  /** explicit questions to put to the client. */
  clientQuestions?: string[]

  /** who owns / must answer (client-side team, e.g. "Sales (CRM)"). */
  clientTeam?: string[]

  /**
   * "BB notes" — BurningBros build / BA notes on how this is implemented
   * (approach, Admin side, Store side, caveats). Grouped like the Notion column.
   */
  bbNotes?: SpecSection[]
  /** "BB — What needs to be done" — the build checklist (Design / BE / FE / client, etc.). */
  whatToBuild?: string[]

  /** how Admin and Store relate for this feature. */
  adminStoreRelation?: string
  /** external systems as pills. */
  externalSystems?: string[]
  /** related feature ids (rendered as links). */
  related?: string[]

  /** reserved: a wireframe exists for this screen. */
  hasWireframe?: boolean
}

/** Left-nav tree. Level 1 = module, level 2 = feature, level 3 = sub-feature. */
export interface NavNode {
  /** matches a FeatureSpec.id when this node is a page; omitted for pure group rows. */
  id?: string
  label: string
  children?: NavNode[]
}

export interface NavModule {
  /** module code, e.g. "A1" */
  code: string
  label: string
  /** which app: "Store Site" | "HQ Admin" | "Cross-cutting" */
  app: string
  children: NavNode[]
}
