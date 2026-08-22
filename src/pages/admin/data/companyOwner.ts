/*
 * Owner (sales) history — who held the account, who reassigned it and why — plus
 * the verification documents proving the MST belongs to them.
 */
import { coLeadSource, isCustomer } from '@/pages/admin/data/companies'
import type { CoStatus, Company } from '@/pages/admin/data/companies'

/* ── Owner (sales) history — who held the account, and who reassigned it ────
   The current owner is the newest entry; every earlier tenure records the ACTOR
   who moved it (a Sales lead, never the old/new owner) and why. Deterministic
   from the company so a record reads the same every render. Mirrors the CRM
   requirement "Sales owner — one current owner, and a full reassignment history". */
type CoOwnerTenure = { owner: string; from: string; to: string; by: string; reason: string; created?: boolean }
/* Wider than the three reps who currently own companies: a history that goes back
   years contains people who have since left, and a pool of three makes a six-step
   chain visibly cycle A → B → A → B. */
const OWNER_POOL = [
  'Nguyễn Thị Lan', 'Phạm Quang Huy', 'Trần Quốc Trung',
  'Đặng Thu Hà', 'Vũ Minh Khoa', 'Hoàng Anh Tuấn', 'Bùi Ngọc Diệp',
]
const OWNER_LEAD = 'Lê Hữu Phong · Sales Lead'
const REASSIGN_REASONS = [
  'Territory rebalance — moved to the rep for this region',
  'Previous rep left the company — handed over',
  'Upgraded to a key-account rep as the account grew',
  'Round-robin reallocation after a workload review',
  'Rep moved to the enterprise team — account stayed in SMB',
  'Customer asked for a different point of contact',
  'Maternity cover — returned to the original rep afterwards',
  'Merged territory after the Q3 reorg',
]
const ownerSinceYear = (c: Company) => {
  const m = /\/(\d{4})$/.exec(c.since)
  return m ? Number(m[1]) : null
}
/** a rep different from `owner`, chosen deterministically by `salt`. */
const pickPrevOwner = (owner: string, salt: number) => {
  const others = OWNER_POOL.filter((r) => r !== owner)
  return others[salt % others.length]
}

/* Month arithmetic on a fixed "now" (08/2026) so a record renders identically every
   time — a history that shuffled between renders would be unreadable in review. */
const NOW_M = 2026 * 12 + 7
const mLabel = (m: number) => `${String((m % 12) + 1).padStart(2, '0')}/${Math.floor(m / 12)}`

export function companyOwnerHistory(c: Company): CoOwnerTenure[] {
  const yr = ownerSinceYear(c)
  // A brand-new lead (no purchase / no activation date): one entry — whoever
  // created it still owns it. "Never reassigned" is a real state, not a gap.
  if (yr === null) return [{ owner: c.owner, from: 'at creation', to: 'now', by: 'Tạo lead (hệ thống)', reason: `Lead created — ${coLeadSource(c)}`, created: true }]

  const salt = c.name.length + c.tax.length
  /* How many times it changed hands. Older accounts have seen more reps, but a
     FLOOR of three keeps the card showing a real chain even on a recently activated
     company — the wireframe exists to be reviewed, and a two-row list never shows
     whether the layout survives a long history. Capped at 8 so it stays a list. */
  const age = Math.max(0, 2026 - yr)
  const priors = Math.min(8, Math.max(4, age * 2 + (salt % 3)))
  if (priors === 0) return [{ owner: c.owner, from: c.since, to: 'now', by: 'Tạo lead (hệ thống)', reason: 'Owner set at creation · never reassigned', created: true }]

  /* Handover points, evenly spread across the account's life and walked BACKWARDS
     from now — index 0 is when the current owner took over. */
  const span = Math.max(priors, age * 12)
  const at = (i: number) => mLabel(NOW_M - Math.round(((i + 1) / (priors + 1)) * span))

  const out: CoOwnerTenure[] = []
  for (let i = 0; i <= priors; i++) {
    const last = i === priors
    out.push({
      owner: i === 0 ? c.owner : pickPrevOwner(c.owner, salt + i),
      from: last ? c.since : at(i),
      to: i === 0 ? 'now' : at(i - 1),
      by: last ? 'Tạo lead (hệ thống)' : OWNER_LEAD,
      reason: last ? 'Created from CRM · first owner' : REASSIGN_REASONS[(salt + i * 3) % REASSIGN_REASONS.length],
      created: last,
    })
  }
  return out
}

/* ── Verification documents — proof the MST belongs to them (giấy phép KD, giấy
   chứng nhận đăng ký thuế, hợp đồng đã ký). Uploaded at creation AND managed here
   on the record.

   NO approval status. A file is either on the record or it is not, and that single
   fact is already visible from the list itself — a per-file Chờ duyệt / Đã duyệt
   badge added a second state to read without adding anything to act on, and it
   implied a review queue nobody owns. */
export type CoDoc = { name: string; note?: string }
export function companyDocs(c: Company): CoDoc[] {
  // Anyone ever invoiced has their licence on file; a churned customer keeps theirs.
  // A deal that reached PO is collecting it. An early lead has none yet.
  if (c.account === 'Existing' || c.account === 'Churn') return [
    { name: 'giay-phep-kinh-doanh.pdf', note: `Tải lên ${c.since}` },
    { name: 'giay-chung-nhan-dang-ky-thue.pdf' },
  ]
  if (isCustomer(c)) return [{ name: 'giay-phep-kinh-doanh.pdf' }]
  return []
}
/**
 * Pipeline stage, as a control rather than a read-out.
 *
 * WHO may set WHAT is the whole point of this component:
 *  · SALES moves the deal between the three talking stages — Proposal, Qualified,
 *    Negotiation — in any direction. A deal genuinely goes backwards (the champion
 *    leaves, it returns to Proposal), so this is not a one-way ladder.
 *  · SALES may close to LOST from ANY stage, with a reason. That is the one exit a
 *    person is allowed to take at will.
 *  · PO and INVOICE are SYSTEM-only and are NOT in the menu at all. They are
 *    consequences of issuing the sales order and of Accounting issuing the VAT
 *    invoice; listing them greyed only invited the question "why can't I pick
 *    this?" on a menu whose job is to offer the choices that exist.
 *  · INVOICE is terminal: the deal is closed-won and there is nothing left to move.
 */
export const SALES_STAGES: CoStatus[] = ['Proposal', 'Qualified', 'Negotiation']
