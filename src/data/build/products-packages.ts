import type { BuildModule } from './types'

export const productsPackages: BuildModule = {
  id: 'products-packages',
  title: 'Products & Packages',
  owner: 'Luan',
  requirements: [
    'Manage sellable products (job-posting slots, CV search, banner/ad placements).',
    'Bundle products into packages with price, duration and quota.',
    'Admin-only; feeds the Company purchasing surface.',
  ],
  features: [
    { name: 'Products management', site: 'Admin', scope: ['BE', 'FE'] },
    { name: 'Packages management', site: 'Admin', scope: ['BE', 'FE'] },
  ],
}
