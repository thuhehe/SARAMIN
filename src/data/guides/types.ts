/*
 * Module USER GUIDES — how to drive the real admin screens, one page per module.
 *
 * The requirement (src/data/build/*.ts) says WHY a module behaves the way it does.
 * A guide says HOW an operator gets a job done on the screens that were actually
 * built — key steps only, with a screenshot of the real console. It is written
 * from the build repos (SARAMIN_BUILD), not from the spec, so it carries its own
 * "built from" stamp: the day the admin changes, this page is what goes stale.
 *
 * Keep each task short. A guide is not a second requirement: the reader already
 * knows how a table or a form works, so a step names the field and the decision,
 * never the click on "Save".
 */

import type { SpecTable } from '../types'

export interface GuideShot {
  /** path under public, e.g. /guide/products-packages/products-list.jpg */
  src?: string
  /** what to look at in the picture — one line */
  caption: string
  /** why there is no picture yet. Rendered as a dashed placeholder so the gap is
      visible on the page instead of silently missing. */
  pending?: string
}

/** One reference table inside a task — see `GuideTask.settings`. */
export interface GuideSettings {
  /** short heading, e.g. "Every product asks for these" */
  heading: string
  /** one line of context above the table */
  note?: string
  table: SpecTable
}

export interface GuideTask {
  /** anchor id — stable once published, links point at it */
  id: string
  title: string
  /** where in the admin menu, e.g. 'Products & Packages → Products → New product' */
  where: string
  /** one line: what you end up with */
  outcome?: string
  /** key steps only. **bold** marks a field or button name as it appears on screen. */
  steps: string[]
  shots?: GuideShot[]
  /**
   * A field-by-field reference for a form-heavy task: what each control means and
   * what it decides downstream. A TABLE rather than more bullets, because fifteen
   * settings as a list is a wall nobody finishes, and this is read one row at a
   * time — an operator arrives with a single field in front of them.
   *
   * `steps` still says what to DO. This says what the thing you are looking at IS,
   * so the two do not have to be written into each other.
   */
  settings?: GuideSettings[]
  /** "Good to know" — the one to three facts that save a support call. */
  tips?: string[]
  /** slug of the feature in this module whose requirement explains the rules */
  spec?: string
}

export interface GuideSource {
  repo: string
  branch: string
  commit: string
  date: string
  note: string
}

export interface ModuleGuide {
  moduleId: string
  /** who this is for and what the module is, in two or three sentences */
  intro: string
  /** things to know before the first task — two to four bullets */
  before?: string[]
  tasks: GuideTask[]
  builtFrom: GuideSource[]
}
