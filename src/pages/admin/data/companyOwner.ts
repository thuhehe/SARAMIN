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
export type CoOwnerTenure = {
  owner: string; from: string; to: string; by: string; reason: string; created?: boolean
  /** This entry is the RELEASE back to the Free-data pool, not a tenure. It is an
      ownership event like any handover — the only difference is that nobody picks it
      up — so it belongs in the timeline rather than in a banner beside it. */
  released?: boolean
  /** This tenure BEGAN by taking the company back out of the Free-data pool —
      an approved claim, or an admin's direct assignment. The flag is what lets the
      timeline say "⤴ Nhận từ Free data" instead of the ordinary "↔ Reassigned". */
  claimed?: boolean
}
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

/* Month arithmetic on a fixed "now" (08/2026) so a record renders identically every
   time — a history that shuffled between renders would be unreadable in review. */
const NOW_M = 2026 * 12 + 7
const mLabel = (m: number) => `${String((m % 12) + 1).padStart(2, '0')}/${Math.floor(m / 12)}`

export function companyOwnerHistory(c: Company): CoOwnerTenure[] {
  /* EVERY record gets the FULL event vocabulary (client, 2026-08-27): created →
     reassigned (actor + reason) → RELEASED to the Free-data pool → CLAIMED back
     (two-level approval, or an admin\u2019s direct assignment) → reassigned → current.
     The wireframe exists so a dev can see every event type on whichever company
     they happen to open — "never reassigned" remains a real production state, but
     a one-row example demonstrates nothing about the layout or the vocabulary. */
  const salt = c.name.length * 7 + c.tax.length * 3
  const pick = (i: number, not?: string) => {
    const pool = OWNER_POOL.filter((r) => r !== not)
    return pool[(salt + i * 5) % pool.length]
  }

  const RELEASE_REASONS = [
    'Hết tiềm năng — 3 lần báo giá không phản hồi, khách nói chưa có ngân sách',
    'Rep phụ trách nghỉ việc, account nhỏ không phân lại — trả về bể',
    'Khách tạm dừng tuyển 6 tháng — trả về bể chờ tín hiệu mới',
  ]

  /* Month boundaries walked BACKWARDS from now, 3–5 months per segment, so dates
     are deterministic and the chain reads oldest-at-the-bottom. */
  let m = NOW_M
  const back = (i: number) => { m -= 3 + ((salt + i) % 3); return mLabel(m) }

  const out: CoOwnerTenure[] = []
  const directReclaim = salt % 2 === 1

  // ── current tenure, and 1–2 reassignments since the reclaim ────────────────
  // 2–3 tenures since the reclaim and 1–2 before the release: 6–8 rows on every
  // record, because the client asked for MANY changes, not a token pair
  const sinceReclaim = 2 + (salt % 2)
  let upper = 'now'
  let owner = c.owner
  for (let i = 0; i < sinceReclaim; i++) {
    const from = c.fromPool && i === sinceReclaim - 1 ? c.fromPool.at : back(i)
    out.push({
      owner, from, to: upper,
      by: i === sinceReclaim - 1
        ? '' // filled below — this row is the reclaim itself when the loop ends
        : OWNER_LEAD,
      reason: REASSIGN_REASONS[(salt + i * 3) % REASSIGN_REASONS.length],
    })
    upper = from
    owner = pick(i + 1, owner)
  }
  // the OLDEST of those rows is the reclaim: it began by leaving the pool
  const reclaim = out[out.length - 1]
  reclaim.claimed = true
  if (c.fromPool) {
    // the approved request on the Yêu cầu nhận tab IS this tenure — same person,
    // same date, or the two surfaces describe two different events
    reclaim.owner = 'Trần Quốc Trung'
    reclaim.by = c.fromPool.by
    reclaim.reason = 'Yêu cầu xin nhận được duyệt (2 cấp)'
  } else if (directReclaim) {
    reclaim.by = 'Lê Minh Anh (admin)'
    reclaim.reason = 'Phân trực tiếp từ Free data — không qua yêu cầu'
  } else {
    reclaim.by = 'Lê Minh Anh (admin) → Lê Hữu Phong (Sales lead)'
    reclaim.reason = 'Yêu cầu xin nhận được duyệt (2 cấp)'
  }

  // ── the release that put it in the pool, dated between the two tenures ─────
  const releasedBy = pick(7, reclaim.owner)
  const releaseAt = back(7)
  out.push({
    owner: releasedBy, from: releaseAt, to: '',
    by: releasedBy, released: true,
    reason: RELEASE_REASONS[salt % RELEASE_REASONS.length],
  })

  // ── the earlier CRM life: 1–2 reassignments, then creation ─────────────────
  upper = releaseAt
  owner = releasedBy
  const before = 1 + ((salt >> 2) % 2)
  for (let i = 0; i < before; i++) {
    const from = back(10 + i)
    out.push({
      owner, from, to: upper,
      by: OWNER_LEAD,
      reason: REASSIGN_REASONS[(salt + 5 + i * 3) % REASSIGN_REASONS.length],
    })
    upper = from
    owner = pick(10 + i, owner)
  }
  out.push({
    owner, from: back(20), to: upper,
    by: 'Tạo lead (hệ thống)',
    reason: `Lead created — ${coLeadSource(c)}`,
    created: true,
  })
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
