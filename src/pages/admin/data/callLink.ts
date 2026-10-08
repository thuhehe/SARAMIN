/*
 * CALLS ↔ COMPANIES — the Callio call log, and how each call gets onto a company.
 *
 * What the build already does (svn-be CallProjectionService, 07/10/2026): match a call
 * by its NUMBER against contact phones, the company phone and the primary contact's
 * phone, and queue what it cannot place — No company · Several companies · No rep — for
 * an admin to assign. On dev that queue holds 11,709 of 25,617 calls, because the
 * numbers reps dial are mostly on no CRM record.
 *
 * What this proposal adds on top: a call STARTED FROM THE CRM (the Copy on the Call card)
 * carries its company and contact with it — the rep picked them before dialling. A call
 * dialled straight in Callio still matches by number, and the two ways it fails get a fix
 * each: several companies hold the number → the rep picks one on the Call log; none does
 * → the number is saved on the contact and Sync from CRM re-matches the waiting calls
 * (the build never re-matches them). The admin queue keeps only what is left.
 */
import type { Company } from '@/pages/admin/data/companies'
import { coKey } from '@/pages/admin/data/companies'
import { companyContacts } from '@/pages/admin/data/companyRecord'

/** HOW a call got onto its company. Stored on the call row; read by the log and by the
    adoption numbers above it — a team whose calls are mostly "Rep" or "Admin" is not
    starting its calls from the CRM. */
export type LinkSource = 'crm-call' | 'number' | 'rep' | 'admin' | 'none'

export const LINK_SOURCE: Record<LinkSource, { label: string; hint: string; tone: string }> = {
  'crm-call': { label: 'CRM call', hint: 'Copied from the Call card on the company — the rep picked the company and contact before dialling.', tone: 'border-brand/30 bg-brand-soft text-brand' },
  number: { label: 'Number', hint: 'Matched automatically — exactly one company holds this number, when the call came in or on Sync from CRM.', tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  rep: { label: 'Rep', hint: 'Picked by the rep who made the call — several companies hold this number.', tone: 'border-violet-200 bg-violet-50 text-violet-700' },
  admin: { label: 'Admin', hint: 'Assigned by an admin from Needs assigning.', tone: 'border-slate-200 bg-slate-100 text-slate-600' },
  none: { label: 'Waiting', hint: 'Not on a company yet — in the rep’s My calls to link and in Needs assigning.', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
}

/** The build's own outcome vocabulary (calls.json → outcome.*). */
export type CallOutcome = 'Answered' | 'Missed' | 'Busy' | 'Failed' | 'Abandoned'

export type CallRow = {
  id: string
  date: string
  time: string
  phone: string
  /** the rep credited — resolved from the extension; '' when no admin is bound to it */
  rep: string
  ext: string
  dir: 'Outbound' | 'Inbound'
  outcome: CallOutcome
  dur: string
  record?: boolean
  company?: string
  contact?: string
  source: LinkSource
  /** why a waiting call could not be placed by its number — the build's queue states */
  reason?: 'No company' | 'Several companies' | 'No rep'
  /** Several companies: every company holding the number, with the contact holding it
      there — the rep picks one on the Call log */
  candidates?: { company: string; contact: string }[]
  /** No company: the number was saved on this contact AFTER the call came in, so Sync
      from CRM links it now (prototype seed — the real one reads the CRM) */
  savedSince?: { company: string; contact: string }
  archived?: boolean
}

export const CALLS: CallRow[] = [
  { id: '6ac5d2a1f03e…', date: '07/10/2026', time: '14:07', phone: '0908 123 456', rep: 'Nguyễn Thị Lan', ext: '10005', dir: 'Outbound', outcome: 'Answered', dur: '00:02:14', record: true, company: 'Công ty TNHH Đại Dương', contact: 'Nguyễn Văn Toàn', source: 'crm-call' },
  { id: '6ac5d27c9b11…', date: '07/10/2026', time: '13:52', phone: '0912 345 678', rep: 'Phạm Quang Huy', ext: '10007', dir: 'Outbound', outcome: 'Answered', dur: '00:04:02', record: true, company: 'Tiki', contact: 'Bùi Thu Hằng', source: 'number' },
  { id: '6ac5cfe3de0d…', date: '07/10/2026', time: '13:40', phone: '0969 920 995', rep: 'Nguyễn Thị Lan', ext: '10005', dir: 'Outbound', outcome: 'Answered', dur: '00:00:48', record: true, source: 'none', reason: 'No company' },
  { id: '6ac5cf6d2e94…', date: '07/10/2026', time: '13:36', phone: '0911 468 024', rep: 'Nguyễn Thị Lan', ext: '10005', dir: 'Outbound', outcome: 'Answered', dur: '00:03:05', record: true, source: 'none', reason: 'Several companies', candidates: [{ company: 'Công ty CP Bình Minh', contact: 'Lê Thu Hằng' }, { company: 'Công ty TNHH Sao Mai', contact: 'Trần Đức Anh' }] },
  { id: '6ac5cf9a01c2…', date: '07/10/2026', time: '13:31', phone: '028 3822 1234', rep: 'Phạm Quang Huy', ext: '10007', dir: 'Outbound', outcome: 'Answered', dur: '00:01:45', record: true, company: 'FPT Software', contact: '— company line', source: 'crm-call' },
  { id: '6ac5cf4e77a8…', date: '07/10/2026', time: '13:20', phone: '0903 111 222', rep: 'Trần Quốc Trung', ext: '10013', dir: 'Inbound', outcome: 'Answered', dur: '00:03:10', record: true, company: 'MoMo', contact: 'Trịnh Khánh Vy', source: 'number' },
  { id: '6ac5cfcc440f…', date: '07/10/2026', time: '13:05', phone: '0369 621 841', rep: 'Nguyễn Thị Lan', ext: '10005', dir: 'Outbound', outcome: 'Answered', dur: '00:01:12', record: true, source: 'none', reason: 'No company', savedSince: { company: 'Công ty TNHH Phú Thịnh', contact: 'Hồ Đăng Khoa' } },
  { id: '6ac5ce6339a7…', date: '07/10/2026', time: '12:58', phone: '0938 555 777', rep: 'Phạm Quang Huy', ext: '10007', dir: 'Outbound', outcome: 'Answered', dur: '00:06:30', record: true, company: 'VNG Corporation', contact: 'Đoàn Hải Nam', source: 'rep' },
  { id: '6ac5ce4839b0…', date: '07/10/2026', time: '11:44', phone: '0974 635 104', rep: 'Trần Quốc Trung', ext: '10013', dir: 'Outbound', outcome: 'Busy', dur: '00:00:00', company: 'Thế Giới Di Động', contact: 'Cao Văn Đức', source: 'crm-call' },
  { id: '6ac5cfbbbe64…', date: '07/10/2026', time: '11:30', phone: '0225 391 1004', rep: '', ext: '10013', dir: 'Outbound', outcome: 'Answered', dur: '00:00:26', record: true, source: 'none', reason: 'Several companies', candidates: [{ company: 'Công ty TNHH Đại Dương', contact: 'Phạm Kế Toán' }, { company: 'Công ty CP Bình Minh', contact: 'Phạm Kế Toán' }] },
  { id: '6ac5cdd7505d…', date: '07/10/2026', time: '10:15', phone: '0981 127 348', rep: 'Nguyễn Thị Lan', ext: '10005', dir: 'Outbound', outcome: 'Answered', dur: '00:02:02', record: true, company: 'Công ty TNHH Đại Dương', contact: 'Phạm Kế Toán', source: 'admin' },
  { id: '6ac5ced1ac7c…', date: '07/10/2026', time: '09:50', phone: '0902 320 131', rep: 'Lê Hữu Phong', ext: '10011', dir: 'Outbound', outcome: 'Answered', dur: '00:00:16', record: true, company: 'Công ty CP An Khang', contact: 'Trần Mỹ Duyên', source: 'crm-call' },
  { id: '6ac5cd0a3e19…', date: '07/10/2026', time: '09:12', phone: '0916 881 919', rep: 'Phạm Quang Huy', ext: '10007', dir: 'Inbound', outcome: 'Answered', dur: '00:00:41', record: true, source: 'none', reason: 'No company', archived: true },
]

/** A call needs linking only when someone actually spoke: an unanswered call writes no
    activity (the build's rule — only a real conversation resets Idle), so asking a rep
    to file one would be work with nothing at the end of it. */
export const needsLink = (r: CallRow) => r.source === 'none' && !r.archived && r.outcome === 'Answered'

/** One number a rep can ring on this account — contacts first, then the account's own
    lines, the same list the build's "Call this company" dialog shows. */
export type CallTarget = { key: string; name: string; title: string; number: string; companyLine?: boolean }

const MOBILES = ['0908 123 456', '0981 127 348', '0938 555 777', '0974 635 104', '0903 111 222']

export function callTargets(c: Company): CallTarget[] {
  const seed = coKey(c) % MOBILES.length
  const people = companyContacts(c)
    .filter((p) => p.status !== 'No longer here' && p.phone !== '—')
    .map((p, i) => ({
      key: `contact-${i}`,
      name: p.name,
      title: p.title,
      number: MOBILES[(seed + i) % MOBILES.length],
    }))
  return [...people, { key: 'company-phone', name: 'Company line', title: 'Switchboard', number: '028 3822 1234', companyLine: true }]
}
