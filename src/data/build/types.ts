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
import type { FieldGroup, BackendSpec, SpecSection } from '../types'

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

/** Deep per-feature spec — authored to be "as detailed as possible". All optional. */
export interface FeatureDetail {
  /** 1–2 paragraph overview: what this screen/feature is and does. */
  description?: string
  /** "As a … I want … so that …" */
  userStory?: string
  /** UI fields captured on the screen(s), grouped. */
  uiFields?: FieldGroup[]
  /** interaction / behaviour rules, in order. */
  behaviors?: string[]
  /** business / validation rules. */
  rules?: string[]
  /** empty / loading / error / edge states to design for. */
  states?: string[]
  /** backend contract: data model, endpoints, integrations, notes. */
  backend?: BackendSpec
  /** acceptance criteria — "done when…". */
  acceptance?: string[]
  /** freeform extra sections. */
  sections?: SpecSection[]
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
  /** deep spec — rendered on the feature detail page when present */
  detail?: FeatureDetail
}

export interface BuildModule {
  id: string
  title: string
  owner: string
  /** authored — what the module must deliver (VN-standard). */
  requirements: string[]
  features: BuildFeature[]
}
