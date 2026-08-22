/*
 * People accounts on both sides of the marketplace: company logins and jobseekers.
 */
import type { CoUserRole } from '@/pages/admin/data/companyRecord'
import type { StatusTone } from '@/pages/admin/lib/tone'

export type CUser = { name: string; email: string; company: string; role: CoUserRole; status: 'Active' | 'Invited' | 'Disabled'; last: string }
export const CUSERS: CUser[] = [
  { name: 'Vũ Thanh Linh', email: 'linh@vanphat.vn', company: 'Cty Vạn Phát', role: 'Admin', status: 'Active', last: '10m ago' },
  { name: 'Đỗ Thị Mai', email: 'mai@vanphat.vn', company: 'Cty Vạn Phát', role: 'Recruiter', status: 'Active', last: '2h ago' },
  { name: 'Lý Văn Giang', email: 'giang@fpt.com.vn', company: 'FPT Software', role: 'Admin', status: 'Active', last: '1d ago' },
  { name: 'Ngô Minh Tú', email: 'tu@fpt.com.vn', company: 'FPT Software', role: 'Viewer', status: 'Invited', last: '—' },
  { name: 'Bùi Thu Hằng', email: 'hang@tiki.vn', company: 'Tiki', role: 'Recruiter', status: 'Disabled', last: '3 months ago' },
]

/* ── User — jobseeker accounts ────────────────────────────────────────────────
 * HQ view of the seeker side of the marketplace (module: Job seeker user
 * management). Accounts are born on the Jobseeker site — email + password or one
 * of the 4 social logins — so HQ's job here is search → inspect → activate /
 * deactivate, never "type someone's password". Sign-up method and email
 * verification are first-class columns because they explain most support cases.
 * -------------------------------------------------------------------------- */
export type JSSignup = 'Email' | 'Google' | 'Facebook' | 'LinkedIn' | 'GitHub'
export type JSStatus = 'Active' | 'Unverified' | 'Deactivated' | 'Withdrawn'
export type JSUser = {
  id: number
  name: string
  email: string
  phone: string
  location: string
  headline: string
  signup: JSSignup
  status: JSStatus
  complete: number
  resumes: number
  applications: number
  joined: string
  last: string
}
export const JS_STATUS: Record<JSStatus, StatusTone> = { Active: 'active', Unverified: 'pending', Deactivated: 'expired', Withdrawn: 'rejected' }
export const JS_USERS: JSUser[] = [
  { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0903 112 445', location: 'Hồ Chí Minh', headline: 'Frontend Engineer · 4 yrs', signup: 'Email', status: 'Active', complete: 92, resumes: 2, applications: 14, joined: '12/03/2025', last: '10m ago' },
  { id: 2, name: 'Trần Thị Bích', email: 'bich.tran@gmail.com', phone: '0912 668 201', location: 'Hà Nội', headline: 'Digital Marketing · 6 yrs', signup: 'Google', status: 'Active', complete: 78, resumes: 1, applications: 8, joined: '04/01/2026', last: '3h ago' },
  { id: 3, name: 'Lê Hoàng Cường', email: 'cuong.le@outlook.com', phone: '0977 340 118', location: 'Hồ Chí Minh', headline: 'Product Manager · 8 yrs', signup: 'LinkedIn', status: 'Active', complete: 100, resumes: 3, applications: 27, joined: '22/08/2024', last: '1d ago' },
  { id: 4, name: 'Phạm Thu Dung', email: 'dung.pham@gmail.com', phone: '—', location: 'Đà Nẵng', headline: 'Kế toán tổng hợp · 3 yrs', signup: 'Email', status: 'Unverified', complete: 24, resumes: 0, applications: 0, joined: '26/07/2026', last: '—' },
  { id: 5, name: 'Vũ Minh Đức', email: 'duc.vu@gmail.com', phone: '0908 771 903', location: 'Hồ Chí Minh', headline: 'Backend Engineer · 5 yrs', signup: 'Facebook', status: 'Active', complete: 61, resumes: 1, applications: 3, joined: '15/05/2026', last: '2 weeks ago' },
  { id: 6, name: 'Đặng Thu Trang', email: 'trang.dang@gmail.com', phone: '0356 220 447', location: 'Hải Phòng', headline: 'QA Engineer · 2 yrs', signup: 'GitHub', status: 'Deactivated', complete: 46, resumes: 1, applications: 5, joined: '03/02/2025', last: '3 months ago' },
  { id: 7, name: 'Hoàng Bảo Ngọc', email: 'ngoc.hoang@gmail.com', phone: '0938 015 662', location: 'Hà Nội', headline: 'HR Specialist · 3 yrs', signup: 'Email', status: 'Withdrawn', complete: 88, resumes: 0, applications: 11, joined: '19/09/2024', last: '1 month ago' },
]
