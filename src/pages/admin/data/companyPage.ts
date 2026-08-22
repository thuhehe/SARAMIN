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
