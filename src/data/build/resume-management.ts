import type { BuildModule } from './types'

export const resumeManagement: BuildModule = {
  id: 'resume-management',
  title: 'Resume management',
  owner: 'Luong',
  requirements: [
    'Create CV — online builder (+ uploaded CV); My CVs on the My page.',
    'One jobseeker = one primary CV (Phase-1) — confirm.',
    'Resume list on Admin and Company (CV search / talent), gated by package + candidate visibility consent.',
  ],
  features: [
    { name: 'Create CV', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-create-cv' },
    { name: 'My CVs (My page)', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-mypage' },
    { name: 'Resume list', site: 'Admin', scope: ['BE', 'FE'] },
    { name: 'Resume list', site: 'Companies', scope: ['BE', 'FE', 'UI'] },
  ],
}
