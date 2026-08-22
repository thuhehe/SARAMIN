/*
 * Admin page prototypes — realistic (mock-data) previews for the HQ Admin shell.
 *
 * Keyed by the nav item's `specId`. The wireframe's content area renders the
 * matching prototype when one exists, else falls back to the generic skeleton.
 * Everything here is mock content laid out to VN-market recruitment standards —
 * structure & data shape only, not final visual design.
 */

/* Back-compat barrel: these moved out of this file but other pages still
   import them from here. Removed once those imports are repointed. */
export { CreateSignalCtx, DetailCrumbCtx, OpenRecordCtx, ScreenNavCtx } from '@/pages/admin/ctx'
export type { DetailCrumb } from '@/pages/admin/ctx'
export { DESCRIPTIONS, PRICE_SEGMENTS } from '@/pages/admin/data/products'
export { ADMIN_PROTOTYPES } from '@/pages/admin/registry'
export { GlobalCompanySearch } from '@/pages/admin/screens/companies/search'
export { AdminJobCreate } from '@/pages/admin/screens/jobForm/create'
export { NewPackageModal } from '@/pages/admin/screens/products/newPackage'
export { NewProductModal } from '@/pages/admin/screens/products/newProduct'
export { NewQuotationModal } from '@/pages/admin/screens/sales/newQuotation'
export { AdminPipeline } from '@/pages/admin/screens/sales/pipeline'

