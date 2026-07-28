import type { BuildModule } from './types'

export const productsPackages: BuildModule = {
  id: 'products-packages',
  title: 'Products & Packages',
  owner: 'Luan',
  requirements: [
    'Manage sellable products (job-posting slots, CV search, banner/ad placements).',
    'Bundle products into packages with price, duration and quota.',
    'Admin-only; feeds the Company purchasing surface.',
    'Product types in the catalog: Posting quota (e.g. Job Posting — Pro: 10 posts / 3 months) · Subscription (e.g. Resume Search — 6 months: 100 CV unlocks) · Advertising (e.g. Main ad, Home hero — per week) · Boost (e.g. Recommend rank boost — per job / 14 days). Each product carries price (₫), fulfilment (what the buyer gets) and an Active / Draft status.',
    'Every product maps to an ENTITLEMENT (product + remaining quota + validity) — that is the single record downstream screens read and decrement. Nothing is entitled without a paid order.',
    'Job-posting tiers exposed per job: Free · Basic · Basic plus · Distinction — the tier drives visibility / ranking on the jobseeker site (see Job management).',
    'Bundles = several catalog products at one package price (e.g. Recruit Starter = Job Posting Pro + 1 boost; Recruit Growth = Job Posting Pro + Resume Search; Enterprise = all products + Talent pool, custom price). Bundles have their own Active / Draft status.',
    'Provisioning is automatic on payment — an admin never hand-picks products for an account. Paying an order provisions exactly what was bought, with the correct quota (see CRM → Payments and Account management → Products & quota).',
    'Quota is consumed by the surfaces that use it: publishing a job spends a posting slot; unlocking a CV spends one unlock. At zero the action is blocked with a buy-more path.',
    'Admin surfaces for this module: Catalog (products), Bundles, Credits (auditable balance ledger per company), Orders (Draft → Pending payment → Paid → Fulfilled) and Promotions (discount codes with scope, validity and usage cap).',
  ],
  features: [
    { name: 'Products management', site: 'Admin', scope: ['BE', 'FE'] },
    { name: 'Packages management', site: 'Admin', scope: ['BE', 'FE'] },
  ],
}
