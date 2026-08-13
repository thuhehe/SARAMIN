/*
 * Benefits — the 11 types a job or a company page can advertise.
 *
 * THIS LIST IS THE CLIENT'S MASTER DATA (`benefit`, 11 codes). The codes and the
 * vi/en names come from them verbatim and must not be renamed here — they are what
 * the backend stores and what the search filter joins on. What WE add is the two
 * things a code alone cannot give a UI:
 *
 *   · an ICON, so a benefit reads at a glance on a job card
 *   · a HINT — the sentence prefilled into the description box when the type is
 *     picked. An employer given a blank box writes nothing or one dead word; given
 *     a sentence to edit, they edit it, and an edited sentence always beats an
 *     empty one. This is the single biggest lever on benefit-content quality.
 *
 * The model: a benefit is a fixed TYPE (code + icon + bilingual label) plus a
 * DESCRIPTION written per job. The type is what makes the icon possible, what makes
 * the label translatable, and — the reason it is worth doing at all — what makes
 * benefits FILTERABLE. A free-text welfare blob can never answer "show me jobs with
 * ESOP"; a typed list can.
 */
import {
  ShieldCheck, HeartPulse, Award, Banknote, Wallet, CalendarDays,
  GraduationCap, Laptop, House, Plane, PieChart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface BenefitType {
  /** The client's master-data code. Never change these — they are the stored value. */
  key: string
  /** Vietnamese label — the required language, shown to jobseekers. */
  vi: string
  en: string
  Icon: LucideIcon
  /** Prefilled into the description box when the type is picked — see file header. */
  hint: string
}

export const BENEFIT_TYPES: BenefitType[] = [
  { key: 'insurance',      vi: 'Bảo hiểm đầy đủ',   en: 'Full insurance',        Icon: ShieldCheck,    hint: 'BHXH – BHYT – BHTN đóng đầy đủ theo lương' },
  { key: 'health',         vi: 'Bảo hiểm sức khỏe', en: 'Health insurance',      Icon: HeartPulse,     hint: 'Bảo hiểm sức khoẻ riêng, khám sức khoẻ định kỳ hằng năm' },
  { key: 'bonus',          vi: 'Thưởng',            en: 'Performance bonus',     Icon: Award,          hint: 'Thưởng theo hiệu suất, xét tăng lương 1–2 lần/năm' },
  { key: 'salary-13th',    vi: 'Lương tháng 13',    en: '13th-month salary',     Icon: Banknote,       hint: 'Lương tháng 13, chi trả trước Tết' },
  { key: 'allowance',      vi: 'Phụ cấp',           en: 'Allowances',            Icon: Wallet,         hint: 'Phụ cấp ăn trưa, xăng xe, điện thoại, chuyên cần' },
  { key: 'paid-leave',     vi: 'Nghỉ phép',         en: 'Paid leave',            Icon: CalendarDays,   hint: '12–15 ngày phép/năm, nghỉ sinh nhật' },
  { key: 'training',       vi: 'Đào tạo',           en: 'Training & development', Icon: GraduationCap, hint: 'Đào tạo nội bộ, ngân sách học tập, lộ trình thăng tiến rõ ràng' },
  { key: 'laptop',         vi: 'Trang bị laptop',   en: 'Laptop provided',       Icon: Laptop,         hint: 'Cấp laptop và màn hình phụ cho công việc' },
  { key: 'remote-support', vi: 'Hỗ trợ làm từ xa',  en: 'Remote work support',   Icon: House,          hint: 'Hybrid 2 ngày/tuần, hỗ trợ thiết bị và cước internet' },
  { key: 'company-trip',   vi: 'Du lịch công ty',   en: 'Company trip',          Icon: Plane,          hint: 'Du lịch hằng năm, team building định kỳ' },
  { key: 'stock-esop',     vi: 'Cổ phần / ESOP',    en: 'Stock options / ESOP',  Icon: PieChart,       hint: 'Chương trình ESOP cho nhân sự gắn bó từ 1 năm' },
]

export const benefitByKey = (k: string) => BENEFIT_TYPES.find((b) => b.key === k)
