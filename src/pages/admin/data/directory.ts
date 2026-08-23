/*
 * Danh bạ doanh nghiệp — the free company pool and the queue of requests to claim
 * a company out of it.
 */
import { COMPANIES } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import type { StatusTone } from '@/pages/admin/lib/tone'
import { searchKey } from '@/pages/admin/ui/table'

/* ── Danh bạ doanh nghiệp — the free company pool ──────────────────────────────
   A reference dataset, deliberately OUTSIDE the CRM. Three reasons it is not just
   another flag on the company table:

     COUNTS   Every CRM number would break. "My customers 84", the pipeline totals,
              the register — all meaningless once unowned rows share the table.
     TRUST    Every CRM company feeds a quotation and then a VAT invoice, where the
              legal name and MST must be exact. A pool where MST is optional and
              sometimes WRONG cannot live in the same store.
     OWNERSHIP A CRM company always has a sales owner and a last-contact clock. A
              pool row has neither and never should.

   Only the NAME is required. MST is stored unverified and is never copied into a
   CRM company — the rep re-enters it on promotion, where the dedup rules run.

   Rows are read-only for sales: letting twenty people edit shared dirty data is how
   it gets dirtier. The only thing a rep can do is REQUEST one. */
type DirState = 'free' | 'pending' | 'claimed'
export const DIR_STATE: Record<DirState, { vi: string; tone: StatusTone }> = {
  free: { vi: 'Chưa nhận', tone: 'draft' },
  pending: { vi: 'Đang chờ duyệt', tone: 'pending' },
  claimed: { vi: 'Đã nhận', tone: 'active' },
}

/* "Phân loại khách hàng trong Free Data" — the rep says WHY this company is worth
   taking, from a fixed list. It is not decoration: it is the only thing that makes
   the queue reviewable at a glance, and it is what lets HQ measure which pool
   segments actually convert instead of guessing which import batch to buy again.

   Two of these are traps, and the form treats them as such (see KIND_IS_CUSTOMER):
   a company that HAS or HAD a Saramin package is not free data at all — it is a
   customer or a churned customer, and it already has an owner in the CRM. */
export const FREE_DATA_KIND = [
  'Đang/Đã đăng tuyển tại Saramin, hết gói dịch vụ',
  'Còn gói dịch vụ chưa sử dụng tại Saramin',
  'Đang đăng tuyển trên thị trường',
  'Chưa từng mua tin Saramin, có nhu cầu đăng tuyển',
  'KH tôi từng liên hệ / bán hàng trước đây',
  'Từng đăng tuyển trong quá khứ',
  'Có nhu cầu tuyển dụng trong tương lai',
  'Công ty thuộc ngành / khu vực tôi phụ trách',
]
/** the two classifications that describe an EXISTING customer, not free data */
export const KIND_IS_CUSTOMER = new Set([FREE_DATA_KIND[0], FREE_DATA_KIND[1]])

export type DirRow = {
  name: string
  /** the contact the source came with — columns, not a stack, so they can be scanned
      and so an empty one is visibly empty rather than silently missing */
  person?: string
  email?: string
  phone?: string
  web?: string
  addr?: string
  industry?: string
  /** untrusted: may be absent, may be wrong. Never promoted without re-entry. */
  tax?: string
  source: string
  added: string
  state: DirState
  /** who asked / who holds it, and the CRM record once promoted (by `name`, so the
      Company ID shown is the real one and never a second copy of it) */
  by?: string
  crm?: string
  /** how many reps have asked for this row. More than one is normal and is the
      admin's problem to resolve, not something the pool should silently block. */
  reqs?: number
}
export const DIRECTORY: DirRow[] = [
  { name: 'Công ty TNHH Cơ điện Tân Tiến', person: 'Ms. Trần Thu Hà · HR', email: 'hr@tantien-me.vn', phone: '028 3822 xxxx', web: 'tantien-me.vn', addr: 'Quận 12, HCMC', industry: 'Sản xuất', source: 'Nhập từ danh bạ VCCI', added: '02/07/2026', state: 'free' },
  { name: 'Công ty CP Thực phẩm Vạn An', person: 'Phòng nhân sự', email: 'tuyendung@vanan.com.vn', phone: '0909 118 xxx', addr: 'Long An', industry: 'Thực phẩm', tax: '0311xxxxxx', source: 'Nhập từ danh bạ VCCI', added: '02/07/2026', state: 'free' },
  // Name only. Still worth keeping: it is a name a rep can find before creating it.
  { name: 'Nhà máy Dệt Phú Cường', addr: 'Bình Dương', industry: 'Dệt may', source: 'Thu thập hội chợ 06/2026', added: '18/06/2026', state: 'free' },
  // The case the layout parity exists for: this WAS a CRM company — its owner
  // released it back to the pool (hết tiềm năng). It arrives with history, so the
  // pool record must be the same page a CRM record is, not a thinner cousin.
  { name: 'Công ty TNHH Logistics Đại Hưng', email: 'info@daihung-log.vn', phone: '0283 776 xxxx', web: 'daihung-log.vn', industry: 'Logistics', tax: '0999xxxxxx', source: 'Trả về từ CRM · Nguyễn Thị Lan (hết tiềm năng)', added: '15/07/2026', state: 'free' },
  { name: 'Công ty CP Xây dựng Minh Khang', person: 'Mr. Lê Đình Trung', email: 'tuyendung@minhkhang.vn', phone: '0918 442 xxx', addr: 'Hà Nội', industry: 'Xây dựng', source: 'Nhập từ danh bạ VCCI', added: '02/07/2026', state: 'pending', by: 'Nguyễn Thị Lan', reqs: 3 },
  { name: 'Công ty TNHH Nội thất An Bình', person: 'Ms. Phạm Thuỳ Dương', email: 'hr@anbinh-furniture.vn', phone: '0274 356 xxxx', addr: 'Bình Dương', industry: 'Sản xuất', source: 'Thu thập hội chợ 06/2026', added: '18/06/2026', state: 'pending', by: 'Trần Quốc Trung', reqs: 1 },
  { name: 'Công ty CP Bao bì Tiến Phát', person: 'Mr. Vũ Đức Thắng', email: 'hcns@tienphat-pack.vn', phone: '0251 388 xxxx', addr: 'Đồng Nai', industry: 'Sản xuất', tax: '0362xxxxxx', source: 'Nhập từ danh bạ VCCI', added: '02/07/2026', state: 'claimed', by: 'Phạm Quang Huy', crm: 'Công ty CP Bình Minh' },
  // Dirty data on purpose: this row is ALREADY a CRM company under another rep.
  // It stays Chưa nhận because the pool cannot know that — the check runs when the
  // rep clicks Xin nhận, and blocks the request there instead of at approval.
  { name: 'Công ty TNHH Sao Mai', person: 'Mr. Trần Đức Anh', email: 'hr@saomai.vn', phone: '0274 221 xxxx', web: 'saomai.vn', addr: 'Bình Dương', industry: 'Sản xuất', source: 'Nhập từ danh bạ VCCI', added: '02/07/2026', state: 'free' },
]

/** Does this pool row already exist in the CRM? Name-normalised, plus phone/domain.
    Run BEFORE a request is submitted — "already owned" is the commonest outcome and
    it must not cost an approval cycle. */
export function dirCrmMatch(r: DirRow): Company | undefined {
  const norm = (x: string) => searchKey(x).replace(/cong ty|tnhh|cp|co phan|nha may|\s+/g, '')
  return COMPANIES.find((c) =>
    norm(c.legalName) === norm(r.name) || norm(c.name) === norm(r.name) ||
    (Boolean(r.web) && c.domain === r.web))
}

/** A pool row rendered as a Company, so the CRM company-detail page can show it.

    Everything a customer has and a pool row does not is left EMPTY rather than
    invented: no owner, no products, no quota, no revenue, no `since`. The page's
    pool variant hides the parts that would otherwise print a row of dashes. The
    legal name is the collected name — there is no verified one yet, and pretending
    otherwise is exactly the trap the unverified-MST rule exists to avoid. */
export function dirAsCompany(r: DirRow): Company {
  return {
    name: r.name, shortName: '', legalName: r.name, tax: r.tax ?? '',
    industry: r.industry ?? '', size: '', address: r.addr ?? '', country: 'Việt Nam',
    contact: [r.person, r.phone].filter(Boolean).join(' · '),
    owner: '', status: 'Proposal', account: 'New',
    lastPO: '—', renewal: '—', nextStep: '', idle: null, note: '', revenue: 0,
    jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0,
    hasPage: false, jobs: 0, domain: r.web ?? '', since: '—',
  }
}

/* ── Volume seeding ────────────────────────────────────────────────────────────
   The queue is reviewed at real load — around twenty companies waiting — and a
   two-card mock never shows whether a design survives that. Generated determin-
   istically (no randomness: a queue that reshuffles between renders is unreview-
   able in review). Mostly one requester per company, a few contested, evidence
   quality deliberately mixed so the triage signals have something to signal. */
const QUEUE_NAMES = [
  'Công ty TNHH Nhựa Tân Phú', 'Công ty CP Thép Miền Nam', 'Công ty TNHH Dược phẩm Hà Tây',
  'Công ty TNHH May mặc Song Long', 'Công ty CP Vận tải Hoà Bình', 'Công ty TNHH Điện lạnh Ngọc Anh',
  'Công ty CP Thực phẩm Bốn Mùa', 'Công ty TNHH Xây lắp Điện Quang', 'Công ty TNHH In ấn Lê Gia',
  'Công ty CP Nông sản Cửu Long', 'Công ty TNHH Gỗ Việt Ý', 'Công ty CP Cáp điện Thăng Long',
  'Công ty TNHH Du lịch Bầu Trời', 'Công ty TNHH Nhôm kính Đại Phát', 'Công ty CP Bảo vệ Toàn Cầu',
  'Công ty TNHH Giáo dục Sao Việt', 'Công ty CP Chuyển phát Tia Chớp', 'Công ty TNHH Thuỷ sản Biển Đông',
]
const QUEUE_REPS = ['Nguyễn Thị Lan', 'Trần Quốc Trung', 'Phạm Quang Huy']
const QUEUE_REASONS = [
  'KH đang tuyển trên thị trường, đã gọi HR và được hẹn gửi báo giá.',
  'đang tuyển',
  'Gặp tại hội chợ, đang cần tuyển gấp cho xưởng mới, HR xin thông tin gói tin đăng.',
  'KH tôi từng liên hệ năm ngoái, nay quay lại có nhu cầu tuyển 10+ vị trí.',
  'Thấy tin tuyển dụng trên website công ty, chưa liên hệ được.',
]
{
  let id = 23960
  QUEUE_NAMES.forEach((co, i) => {
    // every 6th company is contested by two reps; the rest have one requester
    const n = i % 6 === 2 ? 2 : 1
    const day = 4 + (i % 12)
    for (let k = 0; k < n; k++) {
      const by = QUEUE_REPS[(i + k) % 3]
      const ev = (i + k) % 4
      CLAIM_REQS.push({
        id: id++, co, by,
        when: `${String(day + k).padStart(2, '0')}/08/2026 ${String(8 + ((i + k) % 9)).padStart(2, '0')}:${String((i * 7 + k * 13) % 60).padStart(2, '0')}`,
        person: k === 0 ? 'Phòng nhân sự' : 'Ms. HR (nguồn khác)',
        phone: `09${String(10 + i)}${k} ${String(200 + i * 7)} xxx`,
        reason: QUEUE_REASONS[(i + k) % QUEUE_REASONS.length],
        kind: FREE_DATA_KIND[2 + ((i + k) % 6)],
        ...(ev === 0 || ev === 3 ? { link: `vietnamworks.com/tin-tuyen-dung-${1000 + i * 10 + k}` } : ev === 1 ? { file: `tin-tuyen-${i}${k}.png` } : {}),
        reqs: n, status: 'pending',
      })
    }
    DIRECTORY.push({
      name: co, phone: `028 3${String(700 + i)} xxxx`, addr: ['HCMC', 'Hà Nội', 'Bình Dương', 'Đồng Nai'][i % 4],
      industry: ['Sản xuất', 'Logistics', 'Thực phẩm', 'Xây dựng', 'Giáo dục'][i % 5],
      source: 'Nhập từ danh bạ VCCI', added: '02/07/2026', state: 'pending', by: QUEUE_REPS[i % 3], reqs: i % 6 === 2 ? 2 : 1,
    })
  })
}

/** The signed-in rep's own request on a company, if they made one.

    This is how a rep learns the outcome. Approval announces itself — the company
    turns up in their own book with them as owner — but a REJECTION is silent: the
    row simply goes back to Chưa nhận, which looks identical to never having asked.
    So the request itself has to be readable, by the person who made it, wherever
    they would look for it. */
export const myClaim = (co: string, who: string) =>
  CLAIM_REQS.filter((r) => r.co === co && r.by === who).sort((a, b) => b.id - a.id)[0]

/** How many times a request on this company has been refused.

    Derived, never stored as a state on the row: a rejection refuses a REQUEST, not
    the company. The company goes straight back to Chưa nhận and anyone — including
    the rep just refused — can ask again. Showing the count is what stops the same
    weak request being approved on the third attempt out of fatigue. */
export const rejectedCount = (co: string) => CLAIM_REQS.filter((r) => r.co === co && r.status === 'rejected').length

/** the CRM record a claimed pool row became */
export const dirCrm = (r: DirRow) => (r.crm ? COMPANIES.find((c) => c.name === r.crm) : undefined)

/* ── Yêu cầu nhận công ty — the admin approval queue ──────────────────────────
   Admin approves, per the client's decision. Approving is one write: it promotes
   the pool row into a CRM company, sets the requester as sales owner, and files the
   contact point as contact #1. Rejecting returns the row to Chưa nhận with a reason,
   because a rep refused twice for the same reason should be able to read it.

   Resolved requests STAY in this list. The queue is also the record of how every
   company entered the CRM — filtering them out would leave the only copy of that
   history in an audit log nobody opens. */
type ClaimStatus = 'pending' | 'approved' | 'rejected'
export const CLAIM_STATUS: Record<ClaimStatus, { vi: string; tone: StatusTone }> = {
  pending: { vi: 'Đang chờ', tone: 'pending' },
  approved: { vi: 'Đã duyệt', tone: 'active' },
  rejected: { vi: 'Từ chối', tone: 'expired' },
}
export type ClaimReq = {
  id: number
  co: string
  by: string
  when: string
  person: string
  phone: string
  email?: string
  reason: string
  kind: string
  /** a link the approver can OPEN, or a file they have to open and believe */
  link?: string
  file?: string
  /** how many requests exist on this company, this one included */
  reqs: number
  status: ClaimStatus
  /** who decided and when — filled on approval/rejection. This pair is what makes
      the history on the record readable: "Từ chối" alone answers nothing when the
      question is "who turned this down, and was that before or after my call?" */
  decidedBy?: string
  decidedAt?: string
}
export const CLAIM_REQS: ClaimReq[] = [
  /* The claim history of a company that has ALREADY been promoted (Bình Minh,
     CO-N3V7F5Z — fromPool on its CRM record). The chain follows the company into
     the CRM: its Owner history tab shows these two below the tenure chain, and the
     approved one IS the first tenure. One contest, one loser, one winner. */
  { id: 23701, co: 'Công ty CP Bình Minh', by: 'Nguyễn Thị Lan', when: '10/07/2026 09:41', person: 'Ms. Lê Thu Hằng · HR', phone: '0283 555 xxx', reason: 'Thấy tin tuyển giáo viên trên website trường, chưa liên hệ được.', kind: 'Đang đăng tuyển trên thị trường', reqs: 2, status: 'rejected', decidedBy: 'Lê Minh Anh (admin)', decidedAt: '14/07/2026 10:30' },
  { id: 23702, co: 'Công ty CP Bình Minh', by: 'Trần Quốc Trung', when: '11/07/2026 14:05', person: 'Ms. Lê Thu Hằng · HR', phone: '0283 555 xxx', email: 'hr@binhminh.edu.vn', reason: 'Trường mở thêm cơ sở quận 7, cần 12 giáo viên và 3 nhân viên tuyển sinh cho kỳ 9/2026. Đã gọi HR, hẹn demo.', kind: 'Chưa từng mua tin Saramin, có nhu cầu đăng tuyển', link: 'binhminh.edu.vn/tuyen-dung-giao-vien-2026', reqs: 2, status: 'approved', decidedBy: 'Lê Minh Anh (admin)', decidedAt: '14/07/2026 10:30' },
  { id: 23941, co: 'Công ty CP Xây dựng Minh Khang', by: 'Nguyễn Thị Lan', when: '11/08/2026 10:09', person: 'Mr. Lê Đình Trung · Trưởng phòng HC-NS', phone: '0918 442 xxx', email: 'tuyendung@minhkhang.vn', reason: 'KH đang tuyển 8 vị trí kỹ thuật công trường trên thị trường, đã gọi HR và được hẹn gửi báo giá tuần sau.', kind: 'Đang đăng tuyển trên thị trường', link: 'vietnamworks.com/minhkhang-ky-thuat-cong-truong', reqs: 3, status: 'pending' },
  // The competing request on the same company. This is what the count means, and it
  // is the decision the admin actually has to make.
  { id: 23944, co: 'Công ty CP Xây dựng Minh Khang', by: 'Trần Quốc Trung', when: '12/08/2026 08:41', person: 'Ms. Đỗ Kim Ngân · HR', phone: '0918 442 xxx', reason: 'đang tuyển', kind: 'Có nhu cầu tuyển dụng trong tương lai', file: 'anh-tin-tuyen-dung.png', reqs: 3, status: 'pending' },
  // A third rep on Minh Khang: the strongest evidence but the latest timestamp, so
  // the recommended tie-break (evidence first, time second) actually has to be used.
  { id: 23951, co: 'Công ty CP Xây dựng Minh Khang', by: 'Phạm Quang Huy', when: '12/08/2026 15:20', person: 'Ms. Bùi Thanh Mai · Giám đốc Nhân sự', phone: '0918 442 xxx', email: 'ns@minhkhang.vn', reason: 'Giám đốc NS là khách cũ của tôi ở công ty trước, đã hẹn gặp 18/08 và họ đang tuyển 12 vị trí cho 2 dự án mới.', kind: 'KH tôi từng liên hệ / bán hàng trước đây', link: 'vietnamworks.com/cong-ty-minh-khang-tuyen-dung', reqs: 3, status: 'pending' },
  { id: 23902, co: 'Công ty TNHH Nội thất An Bình', by: 'Trần Quốc Trung', when: '12/08/2026 09:48', person: 'Ms. Phạm Thuỳ Dương · HR', phone: '0274 356 xxxx', email: 'hr@anbinh-furniture.vn', reason: 'Gặp tại hội chợ nội thất 06/2026, đang cần 8 thợ mộc, HR xin gửi thông tin gói tin đăng.', kind: 'Chưa từng mua tin Saramin, có nhu cầu đăng tuyển', file: 'namecard-hoi-cho.jpg', reqs: 1, status: 'pending' },
  // An APPROVED request belonging to the signed-in rep, so all three statuses are
  // visible in the default "Của tôi" view instead of only two.
  { id: 23755, co: 'Công ty TNHH Cơ khí Thành Đạt', by: 'Nguyễn Thị Lan', when: '02/07/2026 09:15', person: 'Mr. Đặng Văn Sơn · Trưởng phòng NS', phone: '0274 990 xxx', email: 'ns@thanhdat-me.vn', reason: 'KH đang tuyển 15 thợ hàn và 3 kỹ sư cơ khí cho nhà máy mới, đã gặp trực tiếp và họ xin báo giá gói tin đăng.', kind: 'Đang đăng tuyển trên thị trường', link: 'vietnamworks.com/thanh-dat-tho-han', reqs: 1, status: 'approved', decidedBy: 'Lê Minh Anh (admin)', decidedAt: '05/07/2026 14:02' },
  { id: 23810, co: 'Công ty CP Bao bì Tiến Phát', by: 'Phạm Quang Huy', when: '20/07/2026 10:12', person: 'Mr. Vũ Đức Thắng · HCNS', phone: '0251 388 xxxx', email: 'hcns@tienphat-pack.vn', reason: 'KH tôi từng liên hệ năm 2024, nay mở nhà máy 2 và tuyển 20 công nhân.', kind: 'KH tôi từng liên hệ / bán hàng trước đây', link: 'topcv.vn/tien-phat-cong-nhan-bao-bi', reqs: 1, status: 'approved', decidedBy: 'Lê Minh Anh (admin)', decidedAt: '22/07/2026 09:30' },
  // Rejected, and the company went straight back to Chưa nhận — see Nhà máy Dệt Phú
  // Cường in DIRECTORY, still free for anyone to ask for again.
  { id: 23788, co: 'Nhà máy Dệt Phú Cường', by: 'Nguyễn Thị Lan', when: '30/06/2026 15:32', person: 'Mr Hiếu', phone: '—', reason: 'test', kind: 'Đang đăng tuyển trên thị trường', reqs: 1, status: 'rejected', decidedBy: 'Lê Minh Anh (admin)', decidedAt: '02/07/2026 11:15' },
]
