import type { Surface } from './modules'

/**
 * PHASE 1 — the locked basic flow of the recruiting website.
 *
 * This is the entire scope we are building first: a single clean recruiting
 * loop plus a paid CV-search loop. Everything else is an add-on and is parked
 * so the team can focus on getting the UX/UI of this basic flow excellent.
 * Deliberately simple (no field-level detail): each flow is a short chain of
 * steps across the three apps so the shape is easy to picture. For depth, see
 * Modules (/modules) and the per-feature specs.
 */
export interface FlowStepBasic {
  /** one or more surfaces this step happens on */
  surfaces: Surface[]
  title: string
  note?: string
}

export interface BasicFlow {
  id: string
  title: string
  desc: string
  steps: FlowStepBasic[]
}

export const FLOWS: BasicFlow[] = [
  {
    id: 'flow-setup',
    title: 'Company & job setup',
    desc: 'How a company is created and gets a job in front of job-seekers.',
    steps: [
      { surfaces: ['Admin', 'CO'], title: 'Create company', note: 'The company account is created; its user can sign in on the Company site or be managed from Admin.' },
      { surfaces: ['CO', 'Admin'], title: 'Create job', note: 'Posted by the company itself, or by HQ on the company’s behalf from Admin.' },
      { surfaces: ['JS'], title: 'Display to job-seekers', note: 'The job appears in search and on the job detail page.' },
    ],
  },
  {
    id: 'flow-apply',
    title: 'Apply → screen → hire',
    desc: 'The core recruiting loop. Applications pass through HQ screening before reaching the employer — this quality gate is the key value we sell.',
    steps: [
      { surfaces: ['JS'], title: 'Apply', note: 'Job-seeker finds a job and applies with their CV.' },
      { surfaces: ['Admin'], title: 'HQ screening', note: 'The application lands in our system first. HQ screens out low-quality CVs so only high-quality ones are forwarded — our key selling point to companies.' },
      { surfaces: ['CO'], title: 'Forward to company', note: 'Screened applications are passed to the employer to review.' },
      { surfaces: ['CO'], title: 'Follow up & update status', note: 'Company tracks each application and updates its status through the review.' },
    ],
  },
  {
    id: 'flow-cv-search',
    title: 'CV database & search (paid)',
    desc: 'How a company finds candidates directly by searching the CV database — a paid feature.',
    steps: [
      { surfaces: ['JS'], title: 'Maintain CV', note: 'Job-seeker uploads / updates their CV on their profile. One seeker has one CV.' },
      { surfaces: ['CO'], title: 'Buy search package', note: 'Company purchases a package to unlock CV search.' },
      { surfaces: ['CO'], title: 'Search — results locked', note: 'Company searches by job title and sees matching results, but CV details stay locked until the package is bought.' },
      { surfaces: ['CO'], title: 'Unlock & contact', note: 'After purchase the company sees full CV details and contacts the seeker in its own way.' },
    ],
  },
]
