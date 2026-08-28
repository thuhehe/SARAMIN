/*
 * Inbound self-registrations waiting to be turned into a CRM company.
 */
import { COMPANIES } from '@/pages/admin/data/companies'
import { DIRECTORY } from '@/pages/admin/data/directory'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Sales / CRM — Sign-ups (inbound self-registrations) ─────────────────── */
export type SignupStatus = 'New' | 'Resolved' | 'Archived'
export type Signup = {
  person: string; email: string; phone: string; tax: string; company: string; hiring: boolean; when: string
  /* NO `verified` FIELD (2026-08-23). Email verification now happens BEFORE the
     request reaches this list — an unverified sign-up is not a row an operator
     can see, act on, or triage past. So every row here is verified by
     construction, and a column that reads the same value on every row is a
     column that costs width and teaches nothing.

     THIS REVERSES the earlier model, in which an unverified person could be
     placed and their login opened later when they clicked the link. Placement
     and verification are no longer two moments the operator has to hold apart:
     by the time they see the row, the person is real. */
  /** @deprecated kept only for the seed rows; the Match column is DERIVED — see
      `signupMatches`. A stored flag could only ever hold one answer, and the real
      answer is a list. */
  matched: boolean; matchName?: string
  /** the typed company hit a FREE-DATA row (name-normalised). A third placement
      path then applies: promote that pool row into the CRM company and move the
      user in — instead of creating a duplicate from scratch while the same company
      sits unclaimed in the pool. */
  freeDataMatch?: string
  status: SignupStatus
  /** what happened once resolved */
  outcome?: string
}
/* Two gates: (1) EMAIL VERIFIED — automatic, gates whether HQ can act; (2) HQ placement.
   MATCH is just information. The ACTION is the SAME choices for every sign-up:
   move to an existing company · create a new company + move · archive.
   Move / Create unlock login + send a "you’re in" email (password already set at sign-up). */
export const SIGNUP_STATUS: Record<SignupStatus, StatusTone> = { New: 'pending', Resolved: 'active', Archived: 'expired' }
export const SIGNUPS: Signup[] = [
  { person: 'Nguyễn Văn Toàn', email: 'toan@daiduong.vn', phone: '0903 112 456', tax: '0315xxxxxx', company: 'Công ty TNHH Đại Dương', hiring: true, when: '15m ago', matched: false, status: 'New' },
  { person: 'Trần Thị Hà', email: 'ha@viettien.vn', phone: '0912 445 780', tax: '0314xxxxxx', company: 'Việt Tiến Logistics', hiring: true, when: '1h ago', matched: true, matchName: 'Cty TNHH Việt Tiến', status: 'New' },
  { person: 'Lê Minh Khôi', email: 'khoi@fpt.com.vn', phone: '0977 320 118', tax: '0301xxxxxx', company: 'FPT Software', hiring: true, when: '3h ago', matched: true, matchName: 'FPT Software', status: 'Resolved', outcome: 'Moved to FPT Software · sign-in email sent' },
  { person: 'Phạm Thu Trang', email: 'trang@newco.vn', phone: '0905 771 220', tax: '0399xxxxxx', company: 'Công ty CP NewCo', hiring: true, when: '20m ago', matched: false, status: 'New' },
  { person: 'Đỗ Quốc Bảo', email: 'baohr@gmail.com', phone: '0938 015 662', tax: '—', company: 'Startup ABC', hiring: false, when: '5h ago', matched: false, status: 'New' },
  // The Free-data hit: no CRM match, but the typed company IS a pool row. The right
  // placement is promotion, not a from-scratch create that duplicates the pool.
  { person: 'Trần Thu Hà', email: 'hr@tantien-me.vn', phone: '028 3822 145', tax: '—', company: 'Cơ điện Tân Tiến', hiring: true, when: '2h ago', matched: false, freeDataMatch: 'Công ty TNHH Cơ điện Tân Tiến', status: 'New' },
  /* THE MULTI-MATCH CASE, and the reason Match is a list. One email domain can
     belong to several of our records — a parent and its branch here — and the typed
     company name matches neither exactly. Admin has to CHOOSE, so the column has to
     show the candidates rather than pick one and hide the rest. */
  { person: 'Ngô Hải Đăng', email: 'tuyendung@truongson.vn', phone: '0913 664 208', tax: '—', company: 'Trường Sơn Group', hiring: true, when: '40m ago', matched: false, status: 'New' },
  { person: 'asdf qwer', email: 'x@spam.io', phone: '—', tax: '—', company: 'zzz', hiring: false, when: '6h ago', matched: false, status: 'Archived', outcome: 'Archived' },
]

/* ── MATCH — a derived LIST, never a stored flag ───────────────────────────────
   "Đã có công ty này chưa?" has more than one right answer: an email domain is
   shared by a parent and its branches, and a typed company name is whatever the
   person felt like typing. A single stored `matchName` could hold only one of
   them, so it silently hid the others — and the operator picked from a dropdown
   without knowing a second candidate existed.

   Three independent signals, and the row says WHICH ones fired: the reason is what
   tells an admin whether to trust a candidate. A domain hit on a company whose name
   looks nothing alike is usually a subsidiary; a name hit with a different domain is
   usually a different company with a common name. */
export type MatchWhy = 'tên' | 'đuôi email' | 'MST'
export type SignupMatch = { name: string; where: 'crm' | 'pool'; why: MatchWhy[] }

/** Strips diacritics and the legal-form words, so "Công ty TNHH Việt Tiến" and
    "viet tien" are the same key. */
const normName = (x: string) =>
  x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/công ty|cong ty|tnhh|cp|cổ phần|co phan|group|corporation|\s+/g, '')

/* Free mail providers are NOT an identity: matching every @gmail.com sign-up against
   every company that ever listed a gmail address would fill the column with noise
   and teach the operator to ignore it. */
const PUBLIC_MAIL = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'yopmail.com'])
const domainOf = (email: string) => {
  const d = email.split('@')[1]?.trim().toLowerCase()
  return d && !PUBLIC_MAIL.has(d) ? d : undefined
}
const siteDomain = (web?: string) => web?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') || undefined

/**
 * Every company — CRM or pool — that this sign-up could be. Ordered CRM first, then
 * by how many signals agree, because that is the order an admin should consider them.
 */
export function signupMatches(s: Signup): SignupMatch[] {
  const dom = domainOf(s.email)
  const tax = s.tax?.trim() && s.tax.trim() !== '—' ? s.tax.trim() : undefined
  const typed = normName(s.company)
  const hits = new Map<string, SignupMatch>()
  const add = (name: string, where: 'crm' | 'pool', why: MatchWhy) => {
    const key = where + '::' + name
    const at = hits.get(key)
    if (at) { if (!at.why.includes(why)) at.why.push(why) }
    else hits.set(key, { name, where, why: [why] })
  }
  for (const c of COMPANIES) {
    const label = c.shortName?.trim() || c.name
    if (typed && (normName(c.name) === typed || normName(c.legalName) === typed)) add(label, 'crm', 'tên')
    if (dom && siteDomain(c.domain) === dom) add(label, 'crm', 'đuôi email')
    if (tax && c.tax?.trim() === tax) add(label, 'crm', 'MST')
  }
  for (const d of DIRECTORY) {
    if (d.state === 'claimed') continue   // already promoted — it is a CRM row now
    if (typed && normName(d.name) === typed) add(d.name, 'pool', 'tên')
    if (dom && siteDomain(d.web) === dom) add(d.name, 'pool', 'đuôi email')
    if (tax && d.tax?.trim() === tax) add(d.name, 'pool', 'MST')
  }
  return [...hits.values()].sort((a, b) =>
    (a.where === b.where ? 0 : a.where === 'crm' ? -1 : 1) || b.why.length - a.why.length || a.name.localeCompare(b.name))
}
