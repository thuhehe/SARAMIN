import type { BuildModule } from './types'

export const applicationManagement: BuildModule = {
  id: 'application-management',
  title: 'Application management',
  owner: 'Luong',
  requirements: [
    'Apply flow (Jobseeker): quick apply with a selected CV — the jobseeker picks one of their CVs; no re-typing of profile data.',
    'Application list on Admin and Company; My application on the Jobseeker site.',
    'Status pipeline; HQ screening step before forwarding to the company (Phase-1 quality gate). The jobseeker is told this at apply time ("screened by Saramin before it reaches the employer").',
    'One application = one jobseeker + one job. Applying twice to the same job is blocked; the jobseeker sees the existing application instead.',
    'Stage pipeline per application, owned by the company after HQ screening: New → Reviewing → Shortlisted → Interview → Hired / Rejected. Stage changes are logged (who moved it, when, from → to).',
    'Admin (HQ oversight) sees applications across ALL companies with the candidate, the job applied to, the company and the current stage — used for the screening queue and quality checks.',
    'Company sees only its own applications, filterable by job and by stage — this is the same employer view HQ mirrors on the company record.',
    'HQ access to applications is read-only: HQ does not move a company’s candidates through their pipeline. Opening a candidate’s CV is a PII action and is always written to the audit log.',
    'My application (Jobseeker): the candidate sees each application with its current stage and the date applied — the status they see must match the company-side stage.',
  ],
  features: [
    { name: 'Apply flow', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-apply' },
    { name: 'Application list', site: 'Admin', scope: ['BE', 'FE'] },
    { name: 'Application list', site: 'Companies', scope: ['BE', 'FE', 'UI'], mockup: 'co-application-list' },
    { name: 'My application', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
  ],
}
