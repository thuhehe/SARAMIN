import type { BuildModule } from './types'

export const jobseekerUser: BuildModule = {
  id: 'jobseeker-user',
  title: 'Job seeker user management',
  owner: 'Luong',
  requirements: [
    'Email + password sign up / sign in, plus 4 social logins (Facebook, Google, LinkedIn, GitHub).',
    'Email verification to activate the account; password reset.',
    'My page: profile info, avatar, contact, job preferences, profile completeness.',
    'Deactivate (withdraw) account with a confirm step.',
    'Admin: search jobseeker accounts, view detail, activate / deactivate.',
  ],
  features: [
    { name: 'Sign up / Sign in', site: 'Jobseekers', scope: ['BE', 'FE'], notes: '4 social login (Facebook, Gmail, LinkedIn, Github)' },
    { name: 'User management', site: 'Admin', scope: ['BE', 'FE'] },
    { name: 'My page', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-mypage' },
    { name: 'Deactivate account', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
  ],
}
