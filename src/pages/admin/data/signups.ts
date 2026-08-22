/*
 * Inbound self-registrations waiting to be turned into a CRM company.
 */
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Sales / CRM — Sign-ups (inbound self-registrations) ─────────────────── */
export type SignupStatus = 'New' | 'Resolved' | 'Archived'
export type Signup = {
  person: string; email: string; phone: string; tax: string; company: string; hiring: boolean; when: string
  /** gate 1 — email verified? HQ can only act on verified rows. */
  verified: boolean
  /** MATCH is binary and informational: did the tax code match a company we already have? */
  matched: boolean; matchName?: string
  status: SignupStatus
  /** what happened once resolved */
  outcome?: string
}
/* Two gates: (1) EMAIL VERIFIED — automatic, gates whether HQ can act; (2) HQ placement.
   MATCH is just information. The ACTION is the SAME 3 choices for every verified sign-up:
   move to an existing company · create a new company + move · archive.
   Move / Create unlock login + send a "you’re in" email (password already set at sign-up). */
export const SIGNUP_STATUS: Record<SignupStatus, StatusTone> = { New: 'pending', Resolved: 'active', Archived: 'expired' }
export const SIGNUPS: Signup[] = [
  { person: 'Nguyễn Văn Toàn', email: 'toan@daiduong.vn', phone: '0903 112 456', tax: '0315xxxxxx', company: 'Công ty TNHH Đại Dương', hiring: true, when: '15m ago', verified: true, matched: false, status: 'New' },
  { person: 'Trần Thị Hà', email: 'ha@viettien.vn', phone: '0912 445 780', tax: '0314xxxxxx', company: 'Việt Tiến Logistics', hiring: true, when: '1h ago', verified: true, matched: true, matchName: 'Cty TNHH Việt Tiến', status: 'New' },
  { person: 'Lê Minh Khôi', email: 'khoi@fpt.com.vn', phone: '0977 320 118', tax: '0301xxxxxx', company: 'FPT Software', hiring: true, when: '3h ago', verified: true, matched: true, matchName: 'FPT Software', status: 'Resolved', outcome: 'Moved to FPT Software · sign-in email sent' },
  { person: 'Phạm Thu Trang', email: 'trang@newco.vn', phone: '0905 771 220', tax: '0399xxxxxx', company: 'Công ty CP NewCo', hiring: true, when: '20m ago', verified: false, matched: false, status: 'New' },
  { person: 'Đỗ Quốc Bảo', email: 'baohr@gmail.com', phone: '0938 015 662', tax: '—', company: 'Startup ABC', hiring: false, when: '5h ago', verified: true, matched: false, status: 'New' },
  { person: 'asdf qwer', email: 'x@spam.io', phone: '—', tax: '—', company: 'zzz', hiring: false, when: '6h ago', verified: false, matched: false, status: 'Archived', outcome: 'Archived' },
]
