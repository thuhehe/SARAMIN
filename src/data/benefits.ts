/*
 * Benefits — the 12 types a job can advertise.
 *
 * The model: a benefit is a fixed TYPE (icon + bilingual label, master data) plus a
 * DESCRIPTION written per job. The type is what makes an icon possible, what makes
 * the label translatable, and — the reason it is worth doing at all — what makes
 * benefits FILTERABLE. A free-text blob can never answer "show me jobs with a
 * shuttle bus"; a typed list can. The description stays free text because that is
 * the part that genuinely differs between companies.
 *
 * Deliberately short. The first draft ran to 66 types across 9 groups; at that size
 * an employer scrolls instead of choosing, and every job ends up listing twenty
 * benefits, which means none of them stands out. Twelve fits one 4×3 grid on a
 * single screen, and the merges are lossless because the description carries the
 * detail: "Phụ cấp" covers ăn trưa / xăng xe / điện thoại / chuyên cần without
 * needing four separate types.
 */
import {
  Gift, Wallet, HeartPulse, CalendarDays, Clock, Bus,
  UtensilsCrossed, Laptop, GraduationCap, Plane, HeartHandshake, MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface BenefitType {
  key: string
  /** Vietnamese label — the required language, shown to jobseekers. */
  vi: string
  en: string
  Icon: LucideIcon
  /** Prefilled into the description box when the type is picked. An employer given
      a blank box writes nothing or one useless line; given a sentence to edit, they
      edit it — and an edited sentence is always better than an empty one. */
  hint: string
}

export const BENEFIT_TYPES: BenefitType[] = [
  { key: 'pay',        vi: 'Lương & thưởng',     en: 'Pay & bonus',         Icon: Gift,            hint: 'Lương tháng 13, thưởng KPI, xét tăng lương 1–2 lần/năm' },
  { key: 'allowance',  vi: 'Phụ cấp',            en: 'Allowances',          Icon: Wallet,          hint: 'Phụ cấp ăn trưa, xăng xe, điện thoại, chuyên cần' },
  { key: 'health',     vi: 'Bảo hiểm & sức khoẻ', en: 'Insurance & health', Icon: HeartPulse,      hint: 'BHXH – BHYT – BHTN đầy đủ, bảo hiểm sức khoẻ riêng, khám định kỳ' },
  { key: 'leave',      vi: 'Nghỉ phép',          en: 'Paid leave',          Icon: CalendarDays,    hint: '12–15 ngày phép/năm, nghỉ sinh nhật' },
  { key: 'flexible',   vi: 'Làm việc linh hoạt', en: 'Flexible working',    Icon: Clock,           hint: 'Làm 5 ngày/tuần, giờ linh hoạt, hybrid 2 ngày' },
  { key: 'transport',  vi: 'Đưa đón & chỗ ở',    en: 'Transport & housing', Icon: Bus,             hint: 'Xe đưa đón, ký túc xá / hỗ trợ thuê nhà' },
  { key: 'canteen',    vi: 'Căn-tin',            en: 'Canteen',             Icon: UtensilsCrossed, hint: 'Ăn trưa tại canteen, thực đơn phong phú' },
  { key: 'equipment',  vi: 'Trang bị làm việc',  en: 'Equipment & uniform', Icon: Laptop,          hint: 'Laptop, màn hình phụ, đồng phục và đồ bảo hộ' },
  { key: 'training',   vi: 'Đào tạo & thăng tiến', en: 'Training & career', Icon: GraduationCap,   hint: 'Lộ trình thăng tiến rõ ràng, đào tạo nội bộ, ngân sách học tập' },
  { key: 'trips',      vi: 'Du lịch & hoạt động', en: 'Trips & activities', Icon: Plane,           hint: 'Du lịch hàng năm, team building, sự kiện nội bộ' },
  { key: 'family',     vi: 'Chăm lo gia đình',   en: 'Family care',         Icon: HeartHandshake,  hint: 'Hiếu hỉ, quà cho con CBNV, bảo hiểm người thân' },
  { key: 'other',      vi: 'Khác',               en: 'Other',               Icon: MoreHorizontal,  hint: '' },
]

/* There is deliberately NO per-job maximum. Each type can be picked once, so a job
   is self-limiting at the length of this list; an artificial ceiling only ever
   blocked a benefit the employer genuinely offers, and the greyed-out grid it
   produced read as "you may only use the company's set". */

export const benefitByKey = (k: string) => BENEFIT_TYPES.find((b) => b.key === k)
