/*
 * BUILD MODULES — the near-final module list defined by the SVN team
 * (Module · Owner · Features · Site · Scope · Notes), mirrored from the sheet.
 *
 * This is the authoritative build plan. Detail now lives ONE FILE PER MODULE in
 * ./build/*, so features can be enriched (and worked on) independently without
 * touching a single giant file. This module just re-exports the shared types
 * and composes the ordered list.
 *
 * `requirements` are authored per module against basic VN-market recruitment
 * standards (VietnamWorks / TopCV / ITviec). `mockup` links a feature to a
 * wireframe on the Mockups page. `detail` (optional) is the deep per-feature
 * spec rendered on the feature page — see ./build/job-management.ts for the
 * depth template.
 */

export type { Site, Scope, BuildFeature, BuildModule, FeatureDetail, Requirement, RequirementBlock, ReqTable, BulletItem, KeyPoint } from './build/types'
export { SITE_META, SCOPE_META, READY_META } from './build/types'

import type { BuildModule } from './build/types'
import { crm } from './build/crm'
import { companyUser } from './build/company-user'
import { jobseekerUser } from './build/jobseeker-user'
import { adminAccess } from './build/admin-access'
import { adminSystem } from './build/admin-system'
import { productsPackages } from './build/products-packages'
import { jobManagement } from './build/job-management'
import { applicationManagement } from './build/application-management'
import { resumeManagement } from './build/resume-management'
import { bannersPopups } from './build/banners-popups'
import { tools } from './build/tools'

/*
 * Order matters — this is the reading order of the whole spec, in the left nav, on
 * /modules and in the build plan. It follows the commercial chain: define what is
 * SELLABLE, sell it, then deliver it — and within delivery, the order the
 * marketplace itself runs in.
 *
 *   Products & Packages  what we sell — the catalogue the CRM's documents draw on
 *   CRM                  selling it — quotation → order → payment → invoice
 *   Account management   the account the sale creates — logins, roles, offboarding
 *   Job management       delivering the thing they bought
 *   Job seeker user      the other side of the marketplace: who applies
 *   Resume management    the CV they build — the input to an application
 *   Application          the CV meeting the job — so it reads after both halves
 *   Roles & permissions  identity & access behind all of the above
 *   System               the rest of HQ configuration
 *   Banners & Popups     content laid over the site
 *   Tools                supporting utilities
 */
export const BUILD_MODULES: BuildModule[] = [
  productsPackages,
  crm,
  companyUser,
  jobManagement,
  jobseekerUser,
  resumeManagement,
  applicationManagement,
  adminAccess,
  adminSystem,
  bannersPopups,
  tools,
]
