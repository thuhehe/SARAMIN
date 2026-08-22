/*
 * Every admin screen the wireframe can render, keyed by the nav item's `specId`.
 * The shell looks a screen up here; anything absent falls back to the generic
 * skeleton.
 */
import { AdminDashboard, AdminRecruitReport, AdminRevenueReport, AdminSalesReport, AdminUserBehavior } from '@/pages/admin/screens/analytics/reports'
import { AdminCompanyList } from '@/pages/admin/screens/companies/list'
import { AdminCompanyPipeline } from '@/pages/admin/screens/companies/pipeline'
import { AdminDisplay } from '@/pages/admin/screens/content/display'
import { AdminPages } from '@/pages/admin/screens/content/pages'
import { AdminClaimQueue } from '@/pages/admin/screens/directory/claimQueue'
import { AdminDepartments } from '@/pages/admin/screens/directory/departments'
import { AdminCompanyDirectory } from '@/pages/admin/screens/directory/directory'
import { AdminBundles } from '@/pages/admin/screens/products/bundles'
import { AdminCatalog } from '@/pages/admin/screens/products/catalog'
import { AdminCredits, AdminOrders } from '@/pages/admin/screens/products/credits'
import { AdminImageGallery } from '@/pages/admin/screens/products/gallery'
import { AdminPlacements } from '@/pages/admin/screens/products/placements'
import { AdminPromotions } from '@/pages/admin/screens/products/promotions'
import { AdminApplicants } from '@/pages/admin/screens/recruitment/applicants'
import { AdminCvCheck } from '@/pages/admin/screens/recruitment/cvCheck'
import { AdminJobCreateStandalone, AdminJobList } from '@/pages/admin/screens/recruitment/jobs'
import { AdminResumeNewStandalone, AdminResumes } from '@/pages/admin/screens/recruitment/resumes'
import { AdminInvoices } from '@/pages/admin/screens/sales/invoices'
import { AdminContracts, AdminPayments } from '@/pages/admin/screens/sales/payments'
import { AdminPipeline } from '@/pages/admin/screens/sales/pipeline'
import { AdminPOs } from '@/pages/admin/screens/sales/pos'
import { AdminQuotes } from '@/pages/admin/screens/sales/quotes'
import { AdminSignups } from '@/pages/admin/screens/signups/signups'
import { AdminAuditLog } from '@/pages/admin/screens/system/auditLog'
import { AdminEnvironment } from '@/pages/admin/screens/system/environment'
import { AdminIssuer } from '@/pages/admin/screens/system/issuer'
import { AdminMasterData } from '@/pages/admin/screens/system/masterData'
import { AdminMatchingReport, AdminMatchingSettings } from '@/pages/admin/screens/system/matching'
import { AdminMembership } from '@/pages/admin/screens/system/membership'
import { AdminRoles } from '@/pages/admin/screens/system/roles'
import { AdminStaff } from '@/pages/admin/screens/system/staff'
import { AdminUsers } from '@/pages/admin/screens/system/users'
import { AdminAccountUsage } from '@/pages/admin/screens/usage/accountUsage'
import { AdminCvSearchUsage } from '@/pages/admin/screens/usage/cvSearchUsage'
import { AdminManualServices } from '@/pages/admin/screens/usage/manualServices'
import { AdminUnresolvedTerms } from '@/pages/admin/screens/usage/unresolvedTerms'
import { AdminCompanyUsers } from '@/pages/admin/screens/users/companyUsers'
import { AdminJobseekers } from '@/pages/admin/screens/users/jobseekers'

export const ADMIN_PROTOTYPES: Record<string, () => JSX.Element> = {
  // Recruitment
  'admin-job-list': AdminJobList,
  'admin-job-create': AdminJobCreateStandalone,
  'admin-job-applicants': AdminApplicants,
  'admin-resumes': AdminResumes,
  'admin-cv-check': AdminCvCheck,
  'admin-resume-new': AdminResumeNewStandalone,
  // Companies
  'admin-company-list': AdminCompanyList,
  'admin-company-pipeline': AdminCompanyPipeline,
  // User — both sides of the marketplace's people accounts
  'admin-jobseekers': AdminJobseekers,
  'admin-company-users': AdminCompanyUsers,
  // Content
  'admin-banners': AdminDisplay,
  'admin-account-usage': AdminAccountUsage,
  'admin-manual-services': AdminManualServices,
  'admin-cv-search-usage': AdminCvSearchUsage,
  'admin-unresolved-terms': AdminUnresolvedTerms,
  'admin-pages': AdminPages,
  // Billing & products
  'admin-catalog': AdminCatalog,
  'admin-placements': AdminPlacements,
  'admin-image-gallery': AdminImageGallery,
  'admin-bundles': AdminBundles,
  'admin-credits': AdminCredits,
  'admin-orders': AdminOrders,
  'admin-promotions': AdminPromotions,
  // Sales / CRM
  'admin-signups': AdminSignups,
  'admin-sales-pipeline': AdminPipeline,
  'admin-quotes': AdminQuotes,
  'admin-invoices': AdminInvoices,
  'admin-purchase-orders': AdminPOs,
  'admin-payments': AdminPayments,
  'admin-contracts': AdminContracts,
  // Analytics
  'admin-analytics-dashboard': AdminDashboard,
  'admin-sales-report': AdminSalesReport,
  'admin-recruit-report': AdminRecruitReport,
  'admin-revenue-report': AdminRevenueReport,
  'admin-user-behavior': AdminUserBehavior,
  // System
  'admin-users': AdminUsers,
  'admin-roles': AdminRoles,
  'admin-staff': AdminStaff,
  'admin-issuer': AdminIssuer,
  'admin-membership': AdminMembership,
  'admin-master-data': AdminMasterData,
  'admin-audit-log': AdminAuditLog,
  'admin-matching-settings': AdminMatchingSettings,
  'admin-matching-report': AdminMatchingReport,
  'admin-environment': AdminEnvironment,
  'admin-departments': AdminDepartments,
  'admin-company-directory': AdminCompanyDirectory,
  'admin-claim-queue': AdminClaimQueue,
  // Job categories & roles now live inside Master data (one page); keep the id mapped.
  'admin-job-categories': AdminMasterData,
}
