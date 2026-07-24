import type { BuildModule } from './types'

export const applicationManagement: BuildModule = {
  id: 'application-management',
  title: 'Application management',
  owner: 'Luong',
  requirements: [
    'Apply flow (Jobseeker): quick apply with a selected CV.',
    'Application list on Admin and Company; My application on the Jobseeker site.',
    'Status pipeline; HQ screening step before forwarding to the company (Phase-1 quality gate).',
  ],
  features: [
    { name: 'Apply flow', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-apply' },
    { name: 'Application list', site: 'Admin', scope: ['BE', 'FE'] },
    { name: 'Application list', site: 'Companies', scope: ['BE', 'FE', 'UI'], mockup: 'co-application-list' },
    { name: 'My application', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
  ],
}
