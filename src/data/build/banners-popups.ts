import type { BuildModule } from './types'

export const bannersPopups: BuildModule = {
  id: 'banners-popups',
  title: 'Banners & Popups',
  owner: 'Luong',
  requirements: [
    'Admin: create + manage banners and popups with scheduling and placement/target.',
    'Jobseeker site: render active banners and popups in the defined slots.',
    'A banner is placed in a named SLOT on the jobseeker site — e.g. Home hero · Home mid (long banner) · Sidebar (square). Slots are a fixed, defined set; the jobseeker pages reserve those areas as Admin-managed.',
    'Banner scheduling is a date range (from – to). Status is derived from that range, not typed by hand: Scheduled (before start) → Live (inside range) → Ended (past end). A banner can also be Draft before it is scheduled.',
    'Banner performance is tracked per banner (impressions / clicks) so HQ can report on it.',
    'Paid ad slots are sold as products — a banner placement can be backed by a purchased ad product (e.g. "Main ad — Home hero", per week) from Products & Packages. HQ-run house banners need no product.',
    'A popup targets an AUDIENCE — e.g. Guests (not logged in) · Logged-in jobseekers · Employers (company users). Same Draft / Scheduled / Live lifecycle as banners, plus "Always on" (no end date).',
    'Popups need FREQUENCY CAPPING so we never re-show one to the same person too often — e.g. once per session, once per week. Dismissal is remembered per user/device.',
    'Only one popup shows at a time; if several are eligible, priority decides which one (avoid stacking popups on the same page).',
  ],
  features: [
    { name: 'Create banner + Banner list', site: 'Admin', scope: ['BE', 'FE'] },
    { name: 'Display banner', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
    { name: 'Create popup + Popup list', site: 'Admin', scope: ['BE', 'FE', 'UI'] },
    { name: 'Display popup', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
  ],
}
