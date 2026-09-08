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

export interface GuideShot {
  /** path under public, e.g. /guide/products-packages/products-list.jpg */
  src?: string
  /** what to look at in the picture — one line */
  caption: string
  /** why there is no picture yet. Rendered as a dashed placeholder so the gap is
      visible on the page instead of silently missing. */
  pending?: string
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
