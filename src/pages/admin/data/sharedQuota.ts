/*
 * SHARED QUOTA — one company's PO, used by several companies.
 *
 * NOT the corporate tree. `Company.parent` links two legal entities and shares
 * nothing; this link shares exactly one thing — the quota an issued invoice put on
 * the SPONSOR's account — with companies that have no other relationship to it
 * (a franchise, a group buying centrally, an agency paying for its clients).
 *
 * Vocabulary, used everywhere the feature shows: the SPONSOR is the company that
 * bought the PO and is invoiced for it; a BENEFICIARY is a company an admin linked
 * to it by Company ID, which then posts from the sponsor's POs as if they were its
 * own. "Parent / subsidiary" is deliberately avoided — that pair already means the
 * legal tree, where nothing is inherited.
 */

export type ShareStatus = 'active' | 'removed'

/** One product line on the sponsor's invoiced POs — a COLUMN of the usage matrix.
    A PO can carry any number of these (100 Top job, 20 Basic, 200 CV search…), so
    nothing about the screen may assume "slots" and "CV" are the only two. */
export type SponsorProduct = { name: string; unit: string; total: number; /** what the sponsor itself has spent */ ownUsed: number }

export type ShareLink = {
  /** the company that bought the PO — keyed by `Company.name` like everything else here */
  sponsor: string
  beneficiary: string
  since: string
  by: string
  status: ShareStatus
  removedAt?: string
  removedBy?: string
  /** what this beneficiary has spent from the sponsor's POs, PER PRODUCT — a link that
      was removed keeps its history, because the sponsor's ledger still carries it */
  used: Record<string, number>
  lastUsed?: string
  /** job titles posted on the sponsor's quota — what the sponsor sees per company */
  jobs: string[]
}

/** The sponsor's product lines, as the usage matrix reads them. Seeded per sponsor
    for the demo; in the build this is the entitlement ledger of the sponsor's
    invoiced POs, grouped by product. */
export const SPONSOR_PRODUCTS: Record<string, SponsorProduct[]> = {
  'FPT Software': [
    { name: 'Top job', unit: 'slots', total: 100, ownUsed: 38 },
    { name: 'Basic', unit: 'slots', total: 20, ownUsed: 4 },
    { name: 'Distinction', unit: 'slots', total: 10, ownUsed: 0 },
    { name: 'CV search — COMBO 200', unit: 'unlocks', total: 200, ownUsed: 61 },
  ],
  'Tiki': [
    { name: 'Job Posting — Pro', unit: 'slots', total: 30, ownUsed: 8 },
  ],
}

export const SHARED_QUOTA: ShareLink[] = [
  { sponsor: 'FPT Software', beneficiary: 'Công ty TNHH Sao Mai', since: '12/08/2026', by: 'Phạm Quang Huy', status: 'active', used: { 'Top job': 3, 'Basic': 2, 'CV search — COMBO 200': 12 }, lastUsed: '20/09/2026', jobs: ['Kỹ sư cơ khí', 'QA Engineer (Bình Dương)', 'Nhân viên kho', 'Trưởng ca sản xuất', 'Nhân viên QC'] },
  // Sao Mai draws on TWO sponsors — the case the picker's per-sponsor groups exist for.
  { sponsor: 'Tiki', beneficiary: 'Công ty TNHH Sao Mai', since: '05/09/2026', by: 'Phạm Quang Huy', status: 'active', used: { 'Job Posting — Pro': 1 }, lastUsed: '18/09/2026', jobs: ['Nhân viên giao nhận'] },
  { sponsor: 'FPT Software', beneficiary: 'Công ty CP An Khang', since: '01/09/2026', by: 'Phạm Quang Huy', status: 'active', used: { 'Top job': 1 }, lastUsed: '15/09/2026', jobs: ['Dược sĩ bán hàng'] },
  { sponsor: 'FPT Software', beneficiary: 'Công ty TNHH Phú Thịnh', since: '05/07/2026', by: 'Phạm Quang Huy', status: 'removed', removedAt: '30/08/2026', removedBy: 'Phạm Quang Huy', used: { 'Top job': 2, 'CV search — COMBO 200': 4 }, lastUsed: '22/08/2026', jobs: ['Nhân viên bán hàng', 'Kế toán kho'] },
]

/** Every sponsor this company draws on today. A company CAN be linked to several
    sponsors at once (client, 25/09/2026) — each link is its own row, its own usage,
    its own Remove; the PO picker groups the POs per sponsor so the poster always
    knows whose quota a slot comes from. */
export const sponsorsOf = (name: string): ShareLink[] =>
  SHARED_QUOTA.filter((l) => l.beneficiary === name && l.status === 'active')

/** Every company ever linked to this sponsor, active first. */
export const beneficiariesOf = (name: string): ShareLink[] =>
  SHARED_QUOTA.filter((l) => l.sponsor === name).sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1))

export const sponsorProducts = (name: string): SponsorProduct[] => SPONSOR_PRODUCTS[name] ?? []

/** Sum of a link's spends, every product together — the one number a row leads with. */
export const linkTotal = (l: ShareLink): number => Object.values(l.used).reduce((s, n) => s + n, 0)

/** Per product: what linked companies (any status — a removed link's spend is still
    spent) took from this sponsor, what the sponsor itself used, and what is left. */
export function usageMatrix(name: string, links: ShareLink[] = beneficiariesOf(name)) {
  return sponsorProducts(name).map((p) => {
    const others = links.reduce((s, l) => s + (l.used[p.name] ?? 0), 0)
    return { ...p, others, remaining: Math.max(0, p.total - p.ownUsed - others) }
  })
}
