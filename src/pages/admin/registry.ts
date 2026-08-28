/*
 * Every admin screen the wireframe can render, keyed by the nav item's `specId`.
 * The shell looks a screen up here; anything absent falls back to the generic
 * skeleton.
 */
import { lazy } from 'react'
import type { ComponentType } from 'react'

/* Each screen is fetched on first view rather than bundled with the shell. The
   console is 50 screens of mock data and a reader opens one or two, so shipping
   them all up front cost 2.5MB before anything rendered. */
const screen = (load: () => Promise<Record<string, ComponentType>>, name: string) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const adminJobList = screen(() => import('@/pages/admin/screens/recruitment/jobs'), 'AdminJobList')
const adminJobCreateStandalone = screen(() => import('@/pages/admin/screens/recruitment/jobs'), 'AdminJobCreateStandalone')
const adminApplicants = screen(() => import('@/pages/admin/screens/recruitment/applicants'), 'AdminApplicants')
const adminResumes = screen(() => import('@/pages/admin/screens/recruitment/resumes'), 'AdminResumes')
const adminCvCheck = screen(() => import('@/pages/admin/screens/recruitment/cvCheck'), 'AdminCvCheck')
const adminResumeNewStandalone = screen(() => import('@/pages/admin/screens/recruitment/resumes'), 'AdminResumeNewStandalone')
const adminCompanyList = screen(() => import('@/pages/admin/screens/companies/list'), 'AdminCompanyList')
const adminCompanyArchived = screen(() => import('@/pages/admin/screens/companies/archived'), 'AdminCompanyArchived')
const adminCompanyPipeline = screen(() => import('@/pages/admin/screens/companies/pipeline'), 'AdminCompanyPipeline')
const adminJobseekers = screen(() => import('@/pages/admin/screens/users/jobseekers'), 'AdminJobseekers')
const adminCompanyUsers = screen(() => import('@/pages/admin/screens/users/companyUsers'), 'AdminCompanyUsers')
const adminDisplay = screen(() => import('@/pages/admin/screens/content/display'), 'AdminDisplay')
const adminAccountUsage = screen(() => import('@/pages/admin/screens/usage/accountUsage'), 'AdminAccountUsage')
const adminManualServices = screen(() => import('@/pages/admin/screens/usage/manualServices'), 'AdminManualServices')
const adminCvSearchUsage = screen(() => import('@/pages/admin/screens/usage/cvSearchUsage'), 'AdminCvSearchUsage')
const adminUnresolvedTerms = screen(() => import('@/pages/admin/screens/usage/unresolvedTerms'), 'AdminUnresolvedTerms')
const adminPages = screen(() => import('@/pages/admin/screens/content/pages'), 'AdminPages')
const adminCatalog = screen(() => import('@/pages/admin/screens/products/catalog'), 'AdminCatalog')
const adminPlacements = screen(() => import('@/pages/admin/screens/products/placements'), 'AdminPlacements')
const adminImageGallery = screen(() => import('@/pages/admin/screens/products/gallery'), 'AdminImageGallery')
const adminBundles = screen(() => import('@/pages/admin/screens/products/bundles'), 'AdminBundles')
const adminCredits = screen(() => import('@/pages/admin/screens/products/credits'), 'AdminCredits')
const adminOrders = screen(() => import('@/pages/admin/screens/products/credits'), 'AdminOrders')
const adminPromotions = screen(() => import('@/pages/admin/screens/products/promotions'), 'AdminPromotions')
const adminSignups = screen(() => import('@/pages/admin/screens/signups/signups'), 'AdminSignups')
const adminPipeline = screen(() => import('@/pages/admin/screens/sales/pipeline'), 'AdminPipeline')
const adminQuotes = screen(() => import('@/pages/admin/screens/sales/quotes'), 'AdminQuotes')
const adminInvoices = screen(() => import('@/pages/admin/screens/sales/invoices'), 'AdminInvoices')
const adminPOs = screen(() => import('@/pages/admin/screens/sales/pos'), 'AdminPOs')
const adminPayments = screen(() => import('@/pages/admin/screens/sales/payments'), 'AdminPayments')
const adminContracts = screen(() => import('@/pages/admin/screens/sales/payments'), 'AdminContracts')
const adminDashboard = screen(() => import('@/pages/admin/screens/analytics/reports'), 'AdminDashboard')
const adminSalesReport = screen(() => import('@/pages/admin/screens/analytics/reports'), 'AdminSalesReport')
const adminRecruitReport = screen(() => import('@/pages/admin/screens/analytics/reports'), 'AdminRecruitReport')
const adminRevenueReport = screen(() => import('@/pages/admin/screens/analytics/reports'), 'AdminRevenueReport')
const adminUserBehavior = screen(() => import('@/pages/admin/screens/analytics/reports'), 'AdminUserBehavior')
const adminUsers = screen(() => import('@/pages/admin/screens/system/users'), 'AdminUsers')
const adminRoles = screen(() => import('@/pages/admin/screens/system/roles'), 'AdminRoles')
const adminStaff = screen(() => import('@/pages/admin/screens/system/staff'), 'AdminStaff')
const adminIssuer = screen(() => import('@/pages/admin/screens/system/issuer'), 'AdminIssuer')
const adminMembership = screen(() => import('@/pages/admin/screens/system/membership'), 'AdminMembership')
const adminMasterData = screen(() => import('@/pages/admin/screens/system/masterData'), 'AdminMasterData')
const adminAuditLog = screen(() => import('@/pages/admin/screens/system/auditLog'), 'AdminAuditLog')
const adminMatchingSettings = screen(() => import('@/pages/admin/screens/system/matching'), 'AdminMatchingSettings')
const adminMatchingReport = screen(() => import('@/pages/admin/screens/system/matching'), 'AdminMatchingReport')
const adminEnvironment = screen(() => import('@/pages/admin/screens/system/environment'), 'AdminEnvironment')
const adminDepartments = screen(() => import('@/pages/admin/screens/directory/departments'), 'AdminDepartments')
const adminCompanyDirectory = screen(() => import('@/pages/admin/screens/directory/directory'), 'AdminCompanyDirectory')
const adminClaimRequests = screen(() => import('@/pages/admin/screens/directory/claimRequests'), 'AdminClaimRequests')

export const ADMIN_PROTOTYPES: Record<string, ComponentType> = {
  // Recruitment
  'admin-job-list': adminJobList,
  'admin-job-create': adminJobCreateStandalone,
  'admin-job-applicants': adminApplicants,
  'admin-resumes': adminResumes,
  'admin-cv-check': adminCvCheck,
  'admin-resume-new': adminResumeNewStandalone,
  // Customers
  'admin-company-list': adminCompanyList,
  'admin-company-archived': adminCompanyArchived,
  'admin-company-pipeline': adminCompanyPipeline,
  // User — both sides of the marketplace's people accounts
  'admin-jobseekers': adminJobseekers,
  'admin-company-users': adminCompanyUsers,
  // Content
  'admin-banners': adminDisplay,
  'admin-account-usage': adminAccountUsage,
  'admin-manual-services': adminManualServices,
  'admin-cv-search-usage': adminCvSearchUsage,
  'admin-unresolved-terms': adminUnresolvedTerms,
  'admin-pages': adminPages,
  // Billing & products
  'admin-catalog': adminCatalog,
  'admin-placements': adminPlacements,
  'admin-image-gallery': adminImageGallery,
  'admin-bundles': adminBundles,
  'admin-credits': adminCredits,
  'admin-orders': adminOrders,
  'admin-promotions': adminPromotions,
  // Sales / CRM
  'admin-signups': adminSignups,
  'admin-sales-pipeline': adminPipeline,
  'admin-quotes': adminQuotes,
  'admin-invoices': adminInvoices,
  'admin-purchase-orders': adminPOs,
  'admin-payments': adminPayments,
  'admin-contracts': adminContracts,
  // Analytics
  'admin-analytics-dashboard': adminDashboard,
  'admin-sales-report': adminSalesReport,
  'admin-recruit-report': adminRecruitReport,
  'admin-revenue-report': adminRevenueReport,
  'admin-user-behavior': adminUserBehavior,
  // System
  'admin-users': adminUsers,
  'admin-roles': adminRoles,
  'admin-staff': adminStaff,
  'admin-issuer': adminIssuer,
  'admin-membership': adminMembership,
  'admin-master-data': adminMasterData,
  'admin-audit-log': adminAuditLog,
  'admin-matching-settings': adminMatchingSettings,
  'admin-matching-report': adminMatchingReport,
  'admin-environment': adminEnvironment,
  'admin-departments': adminDepartments,
  'admin-company-directory': adminCompanyDirectory,
  'admin-claim-requests': adminClaimRequests,
  // Job categories & roles now live inside Master data (one page); keep the id mapped.
  'admin-job-categories': adminMasterData,
}
