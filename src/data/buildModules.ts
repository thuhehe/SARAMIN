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

export type { Site, Scope, BuildFeature, BuildModule, FeatureDetail, Requirement, RequirementBlock, ReqTable } from './build/types'
export { SITE_META, SCOPE_META, READY_META } from './build/types'

import type { BuildModule } from './build/types'
import { crm } from './build/crm'
import { jobseekerUser } from './build/jobseeker-user'
import { adminAccess } from './build/admin-access'
import { productsPackages } from './build/products-packages'
import { jobManagement } from './build/job-management'
import { applicationManagement } from './build/application-management'
import { resumeManagement } from './build/resume-management'
import { bannersPopups } from './build/banners-popups'
import { tools } from './build/tools'

export const BUILD_MODULES: BuildModule[] = [
  crm,
  jobseekerUser,
  adminAccess,
  productsPackages,
  jobManagement,
  applicationManagement,
  resumeManagement,
  bannersPopups,
  tools,
]
