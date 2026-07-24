import type { BuildModule } from './types'

export const tools: BuildModule = {
  id: 'tools',
  title: 'Tools',
  owner: 'Luong',
  requirements: [
    'Migrate two tools from the current web: Personality testing and Gross ↔ Net salary calculator.',
    'Jobseeker-facing; keep the existing calculation logic.',
  ],
  features: [
    { name: 'Personality testing', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], notes: 'migrate logic from current web' },
    { name: 'Gross - Net calculation', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], notes: 'migrate logic from current web' },
  ],
}
