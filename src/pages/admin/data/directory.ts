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
  { name: 'Công ty TNHH Logistics Đại Hưng', email: 'info@daihung-log.vn', phone: '0283 776 xxxx', web: 'daihung-log.vn', industry: 'Logistics', tax: '0999xxxxxx', source: 'Nhập từ web tuyển dụng', added: '25/06/2026', state: 'free' },
  { name: 'Công ty CP Xây dựng Minh Khang', person: 'Mr. Lê Đình Trung', email: 'tuyendung@minhkhang.vn', phone: '0918 442 xxx', addr: 'Hà Nội', industry: 'Xây dựng', source: 'Nhập từ danh bạ VCCI', added: '02/07/2026', state: 'pending', by: 'Nguyễn Thị Lan', reqs: 2 },
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
  approved: { vi: 'Được duyệt', tone: 'active' },
  rejected: { vi: 'Từ chối', tone: 'expired' },
}
type ClaimReq = {
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
  /** the approver's note — required on a rejection */
  note?: string
}
export const CLAIM_REQS: ClaimReq[] = [
  { id: 23941, co: 'Công ty CP Xây dựng Minh Khang', by: 'Nguyễn Thị Lan', when: '11/08/2026 10:09', person: 'Mr. Lê Đình Trung · Trưởng phòng HC-NS', phone: '0918 442 xxx', email: 'tuyendung@minhkhang.vn', reason: 'KH đang tuyển 8 vị trí kỹ thuật công trường trên thị trường, đã gọi HR và được hẹn gửi báo giá tuần sau.', kind: 'Đang đăng tuyển trên thị trường', link: 'vietnamworks.com/minhkhang-ky-thuat-cong-truong', reqs: 2, status: 'pending' },
  // The competing request on the same company. This is what the count means, and it
  // is the decision the admin actually has to make.
  { id: 23944, co: 'Công ty CP Xây dựng Minh Khang', by: 'Trần Quốc Trung', when: '12/08/2026 08:41', person: 'Ms. Đỗ Kim Ngân · HR', phone: '0918 442 xxx', reason: 'đang tuyển', kind: 'Có nhu cầu tuyển dụng trong tương lai', file: 'anh-tin-tuyen-dung.png', reqs: 2, status: 'pending' },
  { id: 23902, co: 'Công ty TNHH Nội thất An Bình', by: 'Trần Quốc Trung', when: '12/08/2026 09:48', person: 'Ms. Phạm Thuỳ Dương · HR', phone: '0274 356 xxxx', email: 'hr@anbinh-furniture.vn', reason: 'Gặp tại hội chợ nội thất 06/2026, đang cần 8 thợ mộc, HR xin gửi thông tin gói tin đăng.', kind: 'Chưa từng mua tin Saramin, có nhu cầu đăng tuyển', file: 'namecard-hoi-cho.jpg', reqs: 1, status: 'pending' },
  { id: 23810, co: 'Công ty CP Bao bì Tiến Phát', by: 'Phạm Quang Huy', when: '20/07/2026 10:12', person: 'Mr. Vũ Đức Thắng · HCNS', phone: '0251 388 xxxx', email: 'hcns@tienphat-pack.vn', reason: 'KH tôi từng liên hệ năm 2024, nay mở nhà máy 2 và tuyển 20 công nhân.', kind: 'KH tôi từng liên hệ / bán hàng trước đây', link: 'topcv.vn/tien-phat-cong-nhan-bao-bi', reqs: 1, status: 'approved', note: 'Đúng thông tin, đang tuyển thật. Đã tạo hồ sơ.' },
  // Rejected for the reason the form now tries to prevent.
  { id: 23788, co: 'Công ty TNHH Amazon Web Services Việt Nam', by: 'Nguyễn Thị Lan', when: '30/06/2026 15:32', person: 'Mr Hiếu', phone: '—', reason: 'test', kind: 'Đang đăng tuyển trên thị trường', reqs: 1, status: 'rejected', note: 'Thiếu thông tin liên hệ và không có bằng chứng đang tuyển.' },
]
