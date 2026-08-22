/*
 * Reference lists the public company page writes back to the company record.
 */
/** Hình thức doanh nghiệp — the "business form" a jobseeker filters companies by.
    Modelled on Saramin KR's 기업형태 and adapted to the VN market, where FDI and
    state-owned are the two distinctions candidates actually care about. NOT the
    same as Loại hình doanh nghiệp (the legal form on the ĐKKD, which lives on the
    company record): this is scale + ownership character, that one is company law. */
export const BUSINESS_FORMS = [
  'Mid-sized company',
  'Large enterprise / Corporation',
  'Small & medium enterprise (SME)',
  'Startup',
  'Foreign-invested (FDI) company',
  'Joint venture',
  'State-owned enterprise',
  'Branch / Representative office',
  'Non-profit / NGO',
]

/* Headcount bands. A DROPDOWN, not free text: it is a list column and a search
   facet, so the values have to be identical across every company. */
export const CO_SIZES = ['1–9', '10–49', '50–200', '200–500', '500–1000', '1000–5000', '5000+']

/** Chip row under the facts card. A fixed list, because the whole point of the
    chips is that they read the same on every company and can be filtered on. */
export const CP_TRAITS = [
  'Thành viên tập đoàn', 'Gần ga metro', 'Hỗ trợ thai sản', 'Làm việc từ xa',
  'Trang phục tự do', 'Chế độ nghỉ chăm con', 'Có căn-tin', 'Văn phòng hạng A',
]

/**
 * Why a company was archived.
 *
 * Archiving is not "the customer stopped buying" — that is CHURN, which lives on
 * `account` and leaves the company fully Active, in every rep's list, and worth
 * calling back. Không gia hạn, chuyển sang đối thủ and mất liên lạc are all churn.
 *
 * Archive is for a company that no longer needs ANY care: the entity is gone, or we
 * have decided not to serve it. The value of the state is not that the record hides
 * — it is that the record stops GENERATING WORK: out of every rep's list, out of
 * round-robin, no idle reminders, no nurture, not counted in KPIs, and out of search
 * suggestions unless "include archived" is ticked.
 *
 * An ENUM rather than the free text it replaces, because the follow-up differs per
 * reason: a dissolved company means writing off what it owes, a merger means the
 * obligations transfer to the surviving company, a duplicate means nothing at all.
 * Free text cannot be reported on, and "phá sản" / "Phá sản" / "pha san" are three
 * different strings to anyone counting.
 */
export const ARCHIVE_REASONS = [
  { key: 'dissolved', vi: 'Phá sản / giải thể', note: 'Pháp nhân không còn tồn tại. Công nợ chuyển Kế toán xử lý — không win-back.' },
  { key: 'merged', vi: 'Sáp nhập vào công ty khác', note: 'Pháp nhân bị sáp nhập chấm dứt; theo Điều 201 Luật Doanh nghiệp 2020, công ty nhận sáp nhập kế thừa toàn bộ quyền và nghĩa vụ — kể cả phần dịch vụ đã trả tiền mà chưa giao.' },
  { key: 'duplicate', vi: 'Trùng lặp / tạo nhầm', note: 'Bản ghi không nên tồn tại. Chuyển user sang công ty thật trước khi lưu trữ.' },
  { key: 'banned', vi: 'Vi phạm — ngừng phục vụ', note: 'Công ty vẫn tồn tại nhưng ta không phục vụ nữa (tin giả, lừa đảo, vi phạm điều khoản).' },
  { key: 'other', vi: 'Khác', note: '' },
]

export const archiveReason = (k: string) => ARCHIVE_REASONS.find((r) => r.key === k)
