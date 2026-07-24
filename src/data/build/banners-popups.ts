import type { BuildModule } from './types'

export const bannersPopups: BuildModule = {
  id: 'banners-popups',
  title: 'Banners & Popups',
  owner: 'Luong',
  requirements: [
    'Admin: create + manage banners and popups with scheduling and placement/target.',
    'Jobseeker site: render active banners and popups in the defined slots.',
  ],
  features: [
    { name: 'Create banner + Banner list', site: 'Admin', scope: ['BE', 'FE'] },
    { name: 'Display banner', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
    { name: 'Create popup + Popup list', site: 'Admin', scope: ['BE', 'FE', 'UI'] },
    { name: 'Display popup', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
  ],
}
