/*
 * The product catalogue: what is for sale, how it is fulfilled, the packages that
 * bundle it, and the discount programmes on top.
 */
import { INDUSTRY_TREE, industryBranch, industryMatch } from '@/pages/admin/data/industries'
import type { Account } from '@/pages/admin/data/companies'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Billing & products ───────────────────────────────────────────────────── */
/* The five product TYPES, derived from the client Products deck. The type is the
   discriminator that decides what "fulfilment" means, so it drives which fields
   the create form asks for — see NewProductModal. */
/* ── Placements registry ──────────────────────────────────────────────────────
   One row per display area on the jobseeker site, transcribed from the client
   Products deck (§1 Dịch vụ Trang chủ, §2 Dịch vụ Trang Tìm kiếm).

   This is the layer BETWEEN the site and the catalog. Sizes and caps live here,
   once — not retyped into every banner sale — and each row records how it gets
   filled, which is the product ⇄ homepage relationship:

     tier   — membership is DERIVED from a job's posting tier. Nothing is booked.
     booked — a company buys the slot for N days. Capacity-capped → needs a calendar.
     both   — available by tier AND sellable standalone. Needs a priority rule,
              or the fixed positions get oversold. */
export type FillRoute = 'tier' | 'booked' | 'both'
export const FILL_META: Record<FillRoute, { label: string; tone: StatusTone; hint: string }> = {
  tier: { label: 'Tier-driven', tone: 'active', hint: 'Derived from the job’s posting tier — never booked, never assigned by hand.' },
  booked: { label: 'Booked', tone: 'pending', hint: 'Sold as a time window on the slot. Capacity-capped, so it needs an availability calendar.' },
  both: { label: 'Tier + booked', tone: 'rejected', hint: 'Two supply routes competing for the same positions — needs an explicit priority rule.' },
}
/** Which artwork shapes a placement actually prints. This is the field the job
    form reads: a posting is asked for the shapes its product's placements need,
    and for nothing else. Asking every posting for all three was the old defect —
    a Basic Plus job that only ever renders a round thumbnail was being blocked
    over a missing portrait nobody would see.
    WIREFRAME ASSUMPTION: the exact mapping below is read off the KR cards and the
    Products deck and still needs confirming per row. */
export type Placement = { id: string; page: 'Home' | 'Search'; ref: string; name: string; size: string; shown: string; cap: string; route: FillRoute; fedBy: string; shapes?: Rendition[] }
export const PLACEMENTS: Placement[] = [
  { id: 'home-hero', page: 'Home', ref: '1.1', name: 'Main Banner (Hero)', size: '1536 × 371 px', shown: '1 at a time', cap: 'max 6 · rotate 3s', route: 'booked', fedBy: 'Banner placement product · client-supplied image + link' },
  { id: 'home-feature-co', page: 'Home', ref: '1.2', name: 'Feature company (logos)', size: 'Logo from profile', shown: '6 logos', cap: 'max 12 · random per reload', route: 'booked', fedBy: 'Feature company product · logo auto-pulled from company profile' },
  { id: 'home-super-hot', page: 'Home', ref: '1.3', name: 'Công việc Hot hôm nay', size: 'Job card + image', shown: '4 jobs', cap: 'unlimited pool · random per reload', route: 'both', fedBy: 'Top Job tier (first 10 days) — AND sold standalone (10 ngày)', shapes: ['landscape', 'portrait'] },
  { id: 'home-top-co', page: 'Home', ref: '1.4', name: 'Top Companies Hiring Now', size: 'Logo + cover', shown: '2 companies', cap: 'max 5 · rotate 5s', route: 'booked', fedBy: 'Công ty nổi bật product (10 ngày)' },
  { id: 'home-popular-jobs', page: 'Home', ref: '1.5', name: 'Popular Jobs', size: 'Job row', shown: '20 postings', cap: '+4 fixed premium positions', route: 'both', fedBy: 'Distinction + Top Job tiers · 4 fixed positions sold as an add-on', shapes: ['circle'] },
  { id: 'home-highlight-co', page: 'Home', ref: '1.6', name: 'Highlight Companies', size: 'Job row', shown: '20 postings', cap: '+5 fixed premium positions', route: 'both', fedBy: 'Basic Plus tier · 5 fixed positions sold as an add-on', shapes: ['circle'] },
  { id: 'home-new-jobs', page: 'Home', ref: '1.7', name: 'Công việc mới (Job Basic)', size: 'Job row', shown: 'List', cap: 'Bottom of page', route: 'tier', fedBy: 'Basic tier' },
  { id: 'home-adsense', page: 'Home', ref: '1.8', name: 'Banner adsense', size: '1260 × 120 px', shown: '1 at a time', cap: 'max 6 · refresh on reload', route: 'booked', fedBy: 'Banner placement product · below “Hot Categories”' },
  { id: 'home-tailored', page: 'Home', ref: '1.9', name: 'Jobs Tailored For You', size: 'Job card', shown: 'List', cap: '—', route: 'tier', fedBy: 'Guests: Distinction + Top Job · Logged in: personalised by profile & behaviour', shapes: ['landscape'] },
  { id: 'home-popup', page: 'Home', ref: '1.10', name: 'Homepage pop-up', size: 'Custom creative', shown: '1 at a time', cap: 'priority decides · frequency-capped', route: 'booked', fedBy: 'Popup placement product · per campaign, CTA configurable' },
  { id: 'search-highlight-co', page: 'Search', ref: '2.1', name: 'Highlight Company', size: 'Company block', shown: '1 company', cap: 'unlimited · random per reload', route: 'booked', fedBy: 'Highlight Company product → links to company profile' },
  { id: 'search-highlight-jobs', page: 'Search', ref: '2.2', name: 'Highlight Jobs', size: 'Job row', shown: 'Unlimited', cap: 'shuffled per search session', route: 'tier', fedBy: 'Basic Plus · Distinction · Top Job (tier sets the rank band)', shapes: ['circle'] },
  { id: 'search-adsense', page: 'Search', ref: '2.3', name: 'Banner adsense', size: '425 × 160 px', shown: '1 at a time', cap: 'unlimited · position varies on reload', route: 'booked', fedBy: 'Banner placement product · interleaved between results' },
]

/* Which slot a placement SKU sells. Declared ONCE: the catalogue prints it, the
   product form validates against it and the occupancy view counts bookings with
   it, so a product that changes slot cannot mean three different things on three
   screens. A product carrying its own `slot` still wins — this is the fallback
   for the SKUs that predate that field. */
export const PLACEMENT_OF_SKU: Record<string, string> = {
  'PLC-HOMEHERO': 'home-hero',
  'PLC-FEATURECO': 'home-feature-co',
  'PLC-HOTJOBS': 'home-super-hot',
  'PLC-TOPCOMPANY': 'home-top-co',
  'PLC-ADS-HOME': 'home-adsense',
  'PLC-ADS-SEARCH': 'search-adsense',
  'PLC-SEARCH-HLCO': 'search-highlight-co',
  'PLC-POPUP': 'home-popup',
}

/* How many items the slot RENDERS AT ONCE — "1 at a time", "6 logos", "4 jobs".
   This is the only real capacity a slot has.

   It is NOT a limit on how many banners may be booked against it. A slot shows a
   fixed number of positions and rotates an UNLIMITED pool of bookings through
   them, so the constraint is never "no room left" — it is that every extra
   booking makes each one appear less often. `null` = a plain list, no rotation. */
export function shownOf(p: Placement): number | null {
  const n = p.shown.match(/^(\d+)/)
  return n ? Number(n[1]) : null
}

/* Share of voice: the fraction of the time one booking is on screen, = positions
   ÷ bookings in rotation. Above 1 every booking is always visible, so it clamps.

   This is the number that replaces "capacity used". An uncapped slot can be sold
   indefinitely without ever reading full, and the only thing that moves is this
   ratio — which is what the customer actually bought. */
export function shareOf(shown: number | null, live: number): number | null {
  if (shown == null || live === 0) return null
  return Math.min(1, shown / live)
}

/* The deck's "max 6 · rotate 3s" prose, as a number, kept ONLY as a reference
   reading. The client has since confirmed the pool is unlimited, so this is what
   the deck claims rather than a rule the system enforces. */
export function deckCapOf(p: Placement): number | null {
  const max = p.cap.match(/max (\d+)/)
  if (max) return Number(max[1])
  const fixed = p.cap.match(/\+(\d+) fixed/)
  if (fixed) return Number(fixed[1])
  return null
}

/* ── Image gallery · ARTWORK SETS ────────────────────────────────────────────
   The library does not hold loose pictures any more. It holds SETS: one visual
   idea, carrying up to three RENDITIONS of the same photograph — ngang (thẻ lúc
   nghỉ), dọc (thẻ mở rộng khi hover), tròn (dải thẻ tròn).

   Why a set and not three images: the three frames on the jobseeker site are the
   SAME card in three states. Picking them one by one means searching the library
   three times and hoping the three results are the same scene — which is exactly
   what happens on stg-admin today, where "Pick image" opens once per rendition.
   Grouping them makes the normal path one click, and the automatic default
   possible at all: you cannot auto-fill three slots from three unrelated lists.

   Classification sits on the SET, never on a rendition: topics (what it shows,
   for browsing) and industries (level-1 master data, for the automatic fill).
   INDUSTRY_TOPICS survives as the seeding map — it proposes industries for a new
   set from its topics, so nobody tags twenty-four sets by hand. */
export type Rendition = 'landscape' | 'portrait' | 'circle'
export const RENDITIONS: { key: Rendition; label: string; ratio: string; px: string; box: string; where: string }[] = [
  { key: 'landscape', label: 'Ngang', ratio: '16:9', px: '596 × 336', box: 'h-[60px] w-[107px]', where: 'thẻ lúc nghỉ — dải trả phí' },
  { key: 'portrait', label: 'Dọc', ratio: '3:4', px: '600 × 800', box: 'h-[60px] w-[45px]', where: 'thẻ mở rộng khi hover' },
  { key: 'circle', label: 'Tròn', ratio: '1:1', px: '240 × 240', box: 'h-[60px] w-[60px] rounded-full', where: 'dải thẻ ảnh tròn' },
]

export type ArtworkSet = {
  id: string
  /** OPTIONAL. A set is identified by what it shows, and HQ bulk-loads stock packs
      where naming forty pictures is busywork nobody does. Unnamed sets fall back to
      "Cụm #<n>" in every list, so the grid never renders a blank row. */
  title?: string
  /** stand-in for the photograph — ONE hue per set, because all three renditions
      are the same picture; two different hues in a row would be the bug. */
  hue: number
  /** REQUIRED. Industry node ids at ANY of the three levels. This is the only
      mandatory classification: a set with no industry can never be auto-filled,
      so it would enter the library already invisible. */
  industries: string[]
  /** a neutral set any industry may draw from — the fallback when an industry is empty */
  anyIndustry?: boolean
  /** OPTIONAL. Tag ids → TAGS, which HQ creates, renames and deletes freely. */
  tags: string[]
  /** which renditions exist, and whether each was CROPPED from the master (the
      normal case — one upload) or supplied as its own file (when a crop cannot work) */
  renditions: Partial<Record<Rendition, { derived: boolean }>>
  /** OPTIONAL. Licence expiry — the one date that lets a single query find
      everything to pull when a stock subscription lapses. */
  expires?: string
  uses: number
  archived?: boolean
}

/* ── Tags ─────────────────────────────────────────────────────────────────────
   NOT master data with a migration behind it. HQ invents a tag the moment it is
   useful ("tết", "nữ giới", "ngoài trời"), renames it when the wording drifts and
   deletes it when a campaign ends. That is the whole point: the taxonomy that has
   to hold still is INDUSTRY; tags are the loose, human layer on top.

   Deleting a tag removes it from every set that carried it and never deletes a
   set — a label going away is not a reason to lose a photograph. */
export type Tag = { id: string; name: string; uses?: number }
export const TAGS: Tag[] = [
  { id: 't-office', name: 'Văn phòng' },
  { id: 't-eng', name: 'Kỹ thuật' },
  { id: 't-factory', name: 'Nhà máy · sản xuất' },
  { id: 't-plant', name: 'Nhà xưởng · ngoại cảnh' },
  { id: 't-wh', name: 'Kho vận' },
  { id: 't-transport', name: 'Vận tải' },
  { id: 't-site', name: 'Công trường' },
  { id: 't-retail', name: 'Bán lẻ · cửa hàng' },
  { id: 't-product', name: 'Sản phẩm · bao bì' },
  { id: 't-health', name: 'Y tế · chăm sóc' },
  { id: 't-lab', name: 'Nghiên cứu · phòng lab' },
  { id: 't-class', name: 'Lớp học · đào tạo' },
  { id: 't-horeca', name: 'Nhà hàng · khách sạn' },
  { id: 't-tech', name: 'Công nghệ' },
  { id: 't-data', name: 'Dữ liệu · biểu đồ' },
  { id: 't-people', name: 'Nhóm người' },
  { id: 't-building', name: 'Toà nhà · kiến trúc' },
  { id: 't-nature', name: 'Thiên nhiên · môi trường' },
  { id: 't-abstract', name: 'Trừu tượng · nền' },
]
export const tagName = (id: string) => TAGS.find((t) => t.id === id)?.name ?? id

/* ── Normalising a tag name ───────────────────────────────────────────────────
   Tags are free text, so the ONLY thing standing between a tidy list and forty
   near-duplicates is what happens on save.

   `cleanTagName` is what gets STORED — it keeps the creator's capitalisation,
   because "CV" and "Tết" are not improved by being lowercased on the chip.
   `tagKey` is the comparison key, used for the unique index and for "does this
   already exist": same text, case-folded.

   NFC is the step that actually matters here and the one most likely to be
   skipped. Vietnamese diacritics have two legal encodings — "ă" is either one
   code point (U+0103) or two (a + U+0306). Two tags can look identical on screen,
   differ in bytes, and sail straight past a UNIQUE index. Normalising both on the
   way in is the only fix; comparing rendered strings is not one.

   Accents are KEPT. "ma", "mà" and "má" are three different words — stripping
   diacritics to dedupe would merge tags that mean nothing like each other. */
export const cleanTagName = (s: string) =>
  s.normalize('NFC')
    .replace(/^[\s#]+/, '')        // people type "#tết" out of hashtag habit
    .replace(/\s+/g, ' ')          // tabs, nbsp and double spaces all collapse
    .trim()
    .slice(0, 50)
export const tagKey = (s: string) => cleanTagName(s).toLowerCase()
/** the existing tag with this name, whatever its spacing / case / encoding */
export const findTag = (name: string) => TAGS.find((t) => tagKey(t.name) === tagKey(name))
/** what a set is called in a list when nobody named it */
export const setLabel = (s: ArtworkSet, n?: number) => s.title?.trim() || `Cụm #${n ?? s.id.replace(/\D/g, '')}`

const ALL = { landscape: { derived: false }, portrait: { derived: true }, circle: { derived: true } }
const LP = { landscape: { derived: false }, portrait: { derived: true } }

export const ARTWORK_SETS: ArtworkSet[] = [
  { id: 's1', title: 'Kho hàng · xe nâng', hue: 210, tags: ['t-wh'], industries: ['log-wh', 'mfg'], renditions: ALL, uses: 12, expires: '31/12/2026' },
  { id: 's2', title: 'Dây chuyền sản xuất', hue: 24, tags: ['t-factory', 't-eng'], industries: ['mfg'], renditions: LP, uses: 7, expires: '31/12/2026' },
  { id: 's3', title: 'Nhóm họp trong văn phòng', hue: 268, tags: ['t-office', 't-people'], industries: ['it', 'fin', 'med', 'edu', 'hos'], renditions: ALL, uses: 41 },
  { id: 's4', title: 'Phòng khám · điều dưỡng', hue: 160, tags: ['t-health', 't-people'], industries: ['hc'], renditions: ALL, uses: 5 },
  { id: 's5', title: 'Lập trình viên & màn hình code', hue: 200, tags: ['t-tech', 't-office'], industries: ['it', 'tel'], renditions: ALL, uses: 23 },
  { id: 's6', title: 'Quầy bán lẻ · khách hàng', hue: 340, tags: ['t-retail'], industries: ['ret', 'fmcg'], renditions: { landscape: { derived: false } }, uses: 9, expires: '28/02/2026' },
  { id: 's7', title: 'Công trường xây dựng', hue: 40, tags: ['t-site', 't-eng'], industries: ['con'], renditions: LP, uses: 3, expires: '31/12/2026' },
  { id: 's8', title: 'Lớp học · giảng viên', hue: 96, tags: ['t-class', 't-people'], industries: ['edu'], renditions: ALL, uses: 6 },
  { id: 's9', title: 'Sảnh khách sạn', hue: 12, tags: ['t-horeca'], industries: ['hos'], renditions: ALL, uses: 2 },
  { id: 's10', title: 'Quầy giao dịch ngân hàng', hue: 224, tags: ['t-office', 't-retail'], industries: ['fin-bank-retail', 'ret'], renditions: ALL, uses: 15, expires: '31/12/2026' },
  { id: 's11', title: 'Toà nhà cao tầng (nền)', hue: 190, tags: ['t-building'], industries: [], anyIndustry: true, renditions: ALL, uses: 18 },
  { id: 's12', title: 'Gradient xanh (nền)', hue: 246, tags: ['t-abstract'], industries: [], anyIndustry: true, renditions: ALL, uses: 11 },
  { id: 's13', title: 'Xe tải giao hàng', hue: 350, tags: ['t-transport'], industries: ['log-freight-road'], renditions: LP, uses: 6, expires: '31/12/2026' },
  { id: 's14', title: 'Bàn làm việc · laptop', hue: 258, tags: ['t-office'], industries: ['it', 'fin', 'med', 'tel', 'fmcg', 'ret', 'edu'], renditions: ALL, uses: 33 },
  { id: 's15', title: 'Kỹ sư kiểm tra máy', hue: 32, tags: ['t-eng', 't-factory'], industries: ['mfg', 'con'], renditions: ALL, uses: 8, expires: '31/12/2026' },
  { id: 's16', title: 'Đội ngũ chụp chung', hue: 288, tags: ['t-people'], industries: [], anyIndustry: true, renditions: ALL, uses: 27 },
  { id: 's17', title: 'Server room · hạ tầng', hue: 214, tags: ['t-tech'], industries: ['it-hw', 'tel-dc'], renditions: ALL, uses: 9, expires: '31/12/2026' },
  { id: 's18', title: 'Thùng carton thương hiệu', hue: 22, tags: ['t-product'], industries: ['fmcg-fb-pack', 'ret'], renditions: ALL, uses: 5 },
  { id: 's19', title: 'Kỹ thuật viên phòng lab', hue: 174, tags: ['t-lab', 't-health'], industries: ['hc-pharma'], renditions: LP, uses: 2 },
  { id: 's20', title: 'Biểu đồ tài chính trên máy tính bảng', hue: 188, tags: ['t-data', 't-tech'], industries: ['fin', 'it', 'tel', 'med'], renditions: ALL, uses: 14 },
  { id: 's21', title: 'Nhà máy nhìn từ trên cao', hue: 200, tags: ['t-plant', 't-factory'], industries: ['mfg', 'log'], renditions: LP, uses: 9, expires: '31/12/2026' },
  { id: 's22', title: 'Kệ hàng siêu thị (cũ)', hue: 300, tags: ['t-retail'], industries: ['ret'], renditions: { landscape: { derived: false } }, uses: 0, archived: true },
  { id: 's23', title: 'Đóng gói đơn hàng', hue: 182, tags: ['t-wh', 't-transport'], industries: ['log', 'fmcg'], renditions: ALL, uses: 4 },
  { id: 's24', title: 'Bắt tay · chúc mừng (cận cảnh)', hue: 306, tags: ['t-people'], industries: [], anyIndustry: true, renditions: ALL, uses: 21 },
]

/** A set holds ALL THREE frames. This is a property of the set alone, so it is
    only good for library bookkeeping — the card badge and the coverage floor.
    It is NOT the test for using a set: that is covers(set, need), below. */
export const isComplete = (s: ArtworkSet) => RENDITIONS.every((r) => s.renditions[r.key])
/* ── What a posting actually needs ───────────────────────────────────────────
   "Complete" is not a property of the SET on its own — it is a question about a
   set AND a placement. A posting whose product only ever prints a round
   thumbnail must not be refused a set that has ngang and tròn but no dọc: the
   missing frame is one nobody will ever render. Asking every posting for all
   three was the defect; `need` is what fixes it. */
export const shapesOfPlacements = (ids: string[]): Rendition[] =>
  RENDITIONS.map((r) => r.key).filter((k) => ids.some((id) => PLACEMENTS.find((p) => p.id === id)?.shapes?.includes(k)))
/** the shapes a product's own placements print — the union, in canonical order */
export const shapesForSku = (sku: string): Rendition[] =>
  shapesOfPlacements(CATALOG.find((c) => c.sku === sku)?.feeds ?? [])
/** does this set carry every shape the posting needs? */
export const covers = (s: ArtworkSet, need: Rendition[]) => need.every((k) => !!s.renditions[k])
export const missingFor = (s: ArtworkSet, need: Rendition[]) =>
  RENDITIONS.filter((r) => need.includes(r.key) && !s.renditions[r.key]).map((r) => r.label)
export const missingOf = (s: ArtworkSet) => RENDITIONS.filter((r) => !s.renditions[r.key]).map((r) => r.label)

/** COVERAGE counts a group's OWN fully-cropped sets — tagged at the group itself or
    anywhere inside its branch, since a set tagged "Road freight" is Logistics
    coverage. Neutral (anyIndustry) sets are a safety net, not coverage: if twelve
    groups all fall back on the same four neutral photographs the homepage repeats
    exactly as badly, so counting them would make the floor unreachable. */
export const ownCoverage = (groupId: string) => {
  const branch = industryBranch(groupId)
  return ARTWORK_SETS.filter((s) => !s.archived && isComplete(s) && s.industries.some((i) => branch.includes(i))).length
}

/* ── Resolving artwork for a job ─────────────────────────────────────────────
   The job holds ONE industry node, at any of the three levels; a set holds
   SEVERAL, at any level. They meet through `industryMatch`, which returns a TIER
   instead of a boolean:

     tier 0 · ancestor — the set is tagged at the job's node or above it; `depth`
              says how specific the matched node was (3 = specialty, 1 = group)
     tier 1 · descendant — the set is tagged below the job's node
     tier 2 · neutral (anyIndustry)

   Ordering by (tier, -depth, uses) IS the resolution rule: most specific real
   match first, ties broken on least-used, neutral only when nothing else exists. */
export type RankedSet = { set: ArtworkSet; tier: 0 | 1 | 2; depth: number }
export function rankedSetsFor(jobIndustryId: string): RankedSet[] {
  return ARTWORK_SETS.filter((s) => !s.archived)
    .map((s) => {
      const m = industryMatch(s.industries, jobIndustryId, s.anyIndustry)
      return m ? { set: s, tier: m.tier, depth: m.depth } : null
    })
    .filter((r): r is RankedSet => r !== null)
    .sort((a, b) => a.tier - b.tier || b.depth - a.depth || a.set.uses - b.set.uses)
}
/** every set this job may draw from, best fit first */
export const setsFor = (jobIndustryId: string) => rankedSetsFor(jobIndustryId).map((r) => r.set)
/** THE AUTOMATIC DEFAULT: the best-fitting set that COVERS `need` — the frames
    this posting's product actually prints, not all three. Least-used is not a
    refinement — "first match" puts one photograph on every card of an industry. */
export const autoSetFor = (jobIndustryId: string, need: Rendition[] = RENDITIONS.map((r) => r.key)) =>
  rankedSetsFor(jobIndustryId).find((r) => covers(r.set, need))?.set ?? null
/** why a set was offered — printed in the picker so the ranking is readable */
export const matchLabel = (r: RankedSet) =>
  r.tier === 2 ? 'Mọi ngành' : r.tier === 1 ? 'Ngành con' : r.depth === 3 ? 'Khớp chuyên ngành' : r.depth === 2 ? 'Khớp ngành' : 'Khớp nhóm'

/** Master data → Image topic. ~12 values, and it does not grow when the industry list does. */
export const GALLERY_TOPICS = [
  'Văn phòng', 'Kỹ thuật', 'Nhà máy · sản xuất', 'Nhà xưởng · ngoại cảnh', 'Kho vận', 'Vận tải',
  'Công trường', 'Bán lẻ · cửa hàng', 'Sản phẩm · bao bì', 'Y tế · chăm sóc', 'Nghiên cứu · phòng lab',
  'Lớp học · đào tạo', 'Nhà hàng · khách sạn', 'Công nghệ', 'Dữ liệu · biểu đồ', 'Nhóm người',
  'Toà nhà · kiến trúc', 'Thiên nhiên · môi trường', 'Trừu tượng · nền',
]
/** INDUSTRY → ordered topics. The first entry is what the automatic default resolves to. */
export const INDUSTRY_TOPICS: [string, string[]][] = [
  ['IT / Software', ['Công nghệ', 'Dữ liệu · biểu đồ', 'Văn phòng', 'Trừu tượng · nền']],
  ['FMCG', ['Sản phẩm · bao bì', 'Nhà máy · sản xuất', 'Bán lẻ · cửa hàng', 'Kho vận']],
  ['Banking / Finance', ['Dữ liệu · biểu đồ', 'Văn phòng', 'Toà nhà · kiến trúc']],
  ['Healthcare', ['Y tế · chăm sóc', 'Nghiên cứu · phòng lab', 'Nhóm người']],
  ['Manufacturing', ['Nhà máy · sản xuất', 'Nhà xưởng · ngoại cảnh', 'Kỹ thuật']],
  ['Retail', ['Bán lẻ · cửa hàng', 'Sản phẩm · bao bì', 'Kho vận']],
  ['Education', ['Lớp học · đào tạo', 'Nhóm người']],
  ['Logistics', ['Kho vận', 'Vận tải', 'Nhà xưởng · ngoại cảnh']],
  ['Construction & Real Estate', ['Công trường', 'Toà nhà · kiến trúc', 'Kỹ thuật']],
  ['Hospitality & Tourism', ['Nhà hàng · khách sạn', 'Nhóm người']],
  ['Media & Advertising', ['Văn phòng', 'Nhóm người', 'Trừu tượng · nền']],
  ['Telecommunications', ['Công nghệ', 'Dữ liệu · biểu đồ', 'Toà nhà · kiến trúc']],
]
/** Level-1 industry (Master data). The set carries these DIRECTLY now; the map
    above is demoted to a seeding aid — it proposes industries for a new set from
    its topics, so the twenty-four existing sets were classified once, not by hand. */
export const INDUSTRIES_L1 = INDUSTRY_TREE.map((n) => n.id)
const TOPIC_SEED_ID: Record<string, string> = {
  'IT / Software': 'it', 'Telecommunications': 'tel', 'Banking / Finance': 'fin', 'FMCG': 'fmcg',
  'Retail': 'ret', 'Manufacturing': 'mfg', 'Logistics': 'log', 'Construction & Real Estate': 'con',
  'Healthcare': 'hc', 'Education': 'edu', 'Hospitality & Tourism': 'hos', 'Media & Advertising': 'med',
}
/** PROPOSES group-level industries for a new set from its topics, so nobody
    classifies two dozen sets from a blank form. It proposes; it never writes. */
export const suggestIndustries = (tagIds: string[]) => {
  const names = tagIds.map(tagName)
  return INDUSTRY_TOPICS.filter(([, ts]) => ts.some((t) => names.includes(t))).map(([i]) => TOPIC_SEED_ID[i]).filter(Boolean)
}
/** the floor, counted in FULLY-CROPPED sets: one that crops to all three serves
    every package, so it is the honest unit for "is this industry stocked yet". */
export const INDUSTRY_FLOOR = 3

/** the wireframe's stand-in for a photograph */
export const imgStyle = (hue: number) => ({
  background: `linear-gradient(135deg, hsl(${hue} 55% 62%), hsl(${hue + 28} 45% 42%))`,
})

/* ── Upload ──────────────────────────────────────────────────────────────────
   Two steps, because a stock pack arrives forty pictures at a time and nobody
   classifies forty pictures one modal at a time: drop the batch, let the too-small
   ones fail loudly, then apply topic / role / licence to the whole batch at once
   and correct the odd one out. */
export type PendingFile = { name: string; w: number; h: number; hue: number; title: string; ok: boolean }
export const PENDING_SEED: PendingFile[] = [
  { name: 'warehouse-forklift-02.jpg', w: 2400, h: 1600, hue: 205, title: 'Kho hàng · xe nâng', ok: true },
  { name: 'team-meeting-natural-light.jpg', w: 3000, h: 2000, hue: 262, title: 'Họp nhóm · ánh sáng tự nhiên', ok: true },
  { name: 'engineer-inspection.jpg', w: 2048, h: 1365, hue: 34, title: 'Kỹ sư kiểm tra thiết bị', ok: true },
  { name: 'clinic-corridor.jpg', w: 1800, h: 1200, hue: 158, title: 'Hành lang phòng khám', ok: true },
  { name: 'logo-square-small.png', w: 800, h: 800, hue: 320, title: 'logo-square-small', ok: false },
]

/* FOUR types. "Add-on" was a fifth until we noticed it describes how a thing is
   SOLD, not what it is: an email blast is a Manual service whether it is sold
   alone or included in Top Job, and a premium fixed position is a Placement
   either way. So attachability is a FLAG on the product (`standalone`), not a
   type — which is why the same "Công ty nổi bật" definition serves both the
   standalone booking and the copy included inside Top Job. */
export const PRODUCT_TYPES = [
  { id: 'job', label: 'Job posting', blurb: 'A posting tier — publishing a job spends one slot', eg: 'Basic · Basic Plus · Distinction · Top Job' },
  { id: 'cv', label: 'CV search', blurb: 'Unlock quota + validity, spent per CV opened', eg: 'COMBO 30 / 50 / 100 / 300' },
  { id: 'placement', label: 'Placement booking', blurb: 'A time window on a slot, capacity-capped', eg: 'Main banner · Công ty nổi bật · Adsense · Popup' },
  { id: 'service', label: 'Manual service', blurb: 'Ops fulfils it — creates a task, not an entitlement', eg: 'Fanpage post · Email marketing' },
] as const
export type ProductTypeId = (typeof PRODUCT_TYPES)[number]['id']

/* The catalog, transcribed from the client Products deck. Prices marked ⓒ come
   from the current CRM product picker (the deck prices only the CV combos).

   Note what is deliberately NOT here: one row per tier, not the four segment
   variants the CRM carries today (Basic Plus exists there as Basic Plus SMEs
   3.949.000 / Basic Plus Enterprise 5.544.000 / Basic Plus Job 6.100.000 /
   Basic Plus 15 days 30.000.000). Segment pricing is a price list ON the
   product, so what a tier grants is defined once. */
/* SKU is the stable handle a product keeps for life: it is what a quotation line,
   an order, an invoice and an entitlement all reference, so it must survive a
   rename. Shape is TYPE-CAPABILITY — the type prefix makes a row self-describing
   in an export or a support ticket, where the Type column is not there to help. */
/* `role` is the product's relationship to a sale — the same axis the create form
   asks for. Three values, not two, because the fanpage post and the email send are
   genuinely sold standalone AND included inside Top Job; a binary flag would force
   duplicating them.
     Main   — quotable on its own
     Add-on — reaches a customer only via another product's `includes`
     Both   — quotable AND includable                                            */
type ProductRole = 'Main' | 'Add-on'
/* `entitlement` says HOW a product reaches a job, and it is deliberately NOT
   derived from price: a promo line can cost 0 ₫ and still be consumed from a PO.
   'free' = HQ may post it at any time with no PO and no limit; it is Admin-only,
   never offered on the Company site, and never upgradeable to a paid tier. */
type Entitlement = 'purchase' | 'free'
/* ── Activation window ────────────────────────────────────────────────────────
   How long the customer has to START using what they bought, counted from the
   INVOICE date — client T&C clause 4. It is the middle of three clocks and the
   only one that can silently destroy paid-for quota:

     provisioned   the invoice is issued → quota lands on the account (immediate)
     activate by   invoice date + THIS window → unused quota expires
     runs for      once a slot is activated, the posting/pack runs its own period

   It sits on the PRODUCT, not on a global setting, because a 12-month bank on a
   13.800.000 ₫ Top Job slot and a 12-month bank on a free trial tin are not the
   same promise. Default 12 months, which is what the client T&C states. */
export const ACTIVATE_WITHIN_DEFAULT = 12
/** Months to activate, or null where the product is never invoiced at all. */
export const activateWithin = (p: { entitlement?: Entitlement; activateWithin?: number }) =>
  p.entitlement === 'free' ? null : p.activateWithin ?? ACTIVATE_WITHIN_DEFAULT
/* Always in MONTHS, never "1 năm": the point of the column is to compare 3 against
   12 at a glance, and the client T&C itself says "trong vòng 12 tháng". */
export const activateWithinLabel = (p: { entitlement?: Entitlement; activateWithin?: number }) => {
  const m = activateWithin(p)
  return m === null ? '—' : `${m} tháng`
}

/* `trial` is a third VISIBILITY axis, alongside role. A trial product is a real
   SKU with a real (low) price — not a discount — and it is offered ONLY inside a
   quotation whose discount programme is Gói dùng thử. Keeping it a product is
   what makes the sale auditable: the invoice states what was sold at what price,
   and revenue reporting sees a cheap SKU rather than a 95% write-down nobody can
   explain a year later. */
/* What a placement SHOWS. This is the axis Q1 of the requirement exposed: "job
   hiển thị trên trang chủ 10 ngày" is not a banner sale — same slot mechanics,
   different content. The content decides what publishing asks for: a banner needs
   a creative upload, a job placement needs a JOB picked from the company's open
   jobs, a company placement pulls logo/cover from the profile.

   The 30/10 confusion dissolves here: 30 ngày là vòng đời của JOB (job posting
   entitlement), 10 ngày là thời lượng BOOKING trên slot. Hai đồng hồ, hai object —
   the booking ends and the job keeps running on search. */
export type SlotContent = 'banner' | 'job' | 'company'
export const SLOT_CONTENT: Record<SlotContent, { vi: string; needs: string }> = {
  banner: { vi: 'Banner (khách cung cấp)', needs: 'Upload ảnh đúng kích thước slot' },
  job: { vi: 'Job đang đăng', needs: 'Chọn 1 job Open của công ty — không upload gì' },
  company: { vi: 'Logo & trang công ty', needs: 'Tự lấy logo/cover từ hồ sơ công ty' },
}

export const CATALOG: { sku: string; name: string; type: string; role: ProductRole; price: string; fulfilment: string; status: 'Active' | 'Inactive'; includes?: string[]; entitlement?: Entitlement; activateWithin?: number; trial?: boolean; content?: SlotContent; addonKind?: 'label' | 'placement'; slot?: string; feeds?: string[] }[] = [
  // ── Job posting ───────────────────────────────────────────────────────────
  { sku: 'JOB-FREE', name: 'Tin Free (Admin đăng hộ)', type: 'Job posting', role: 'Main', price: '0 ₫', fulfilment: '14 ngày · không vị trí nổi bật', status: 'Active', entitlement: 'free', feeds: [] },
  { sku: 'JOB-BASIC', name: 'Tin Basic', type: 'Job posting', role: 'Main', price: '2,710,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 15 ngày', status: 'Active', feeds: ['home-new-jobs'] },
  { sku: 'JOB-BASICPLUS', name: 'Tin Basic Plus', type: 'Job posting', role: 'Main', price: '6,100,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 10 ngày', status: 'Active', includes: ['ADD-HLCOMPANIES', 'SVC-EMAIL-DEV'], feeds: ['home-highlight-co', 'search-highlight-jobs'] },
  { sku: 'JOB-DISTINCTION', name: 'Tin Distinction', type: 'Job posting', role: 'Main', price: '12,000,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 5 ngày', status: 'Active', includes: ['ADD-POPULARJOBS'], feeds: ['home-popular-jobs', 'home-tailored', 'search-highlight-jobs'] },
  { sku: 'JOB-TOPJOB', name: 'Tin Top Job', type: 'Job posting', role: 'Main', price: '13,800,000 ₫ ⓒ', fulfilment: '30 ngày · mỗi ngày ×7 rồi 5 ngày', status: 'Active', includes: ['ADD-POPULARJOBS', 'ADD-LABEL-HOTJOB', 'SVC-FB-TOPDEV', 'SVC-EMAIL-DEV'], feeds: ['home-super-hot', 'home-popular-jobs', 'home-tailored', 'search-highlight-jobs'] },
  // Shorter window than the 12-month default on purpose: a giveaway that can be
  // banked for a year is a liability on the books, not an incentive to start.
  { sku: 'JOB-TRIAL', name: 'Tin đăng dùng thử (Basic Job)', type: 'Job posting', role: 'Main', price: '500,000 ₫', fulfilment: '15 ngày · 1 slot · 1 lần / MST', status: 'Active', activateWithin: 3, trial: true },
  /* Job ENHANCEMENTS, not slot rentals: normalised from Placement booking after
     the Add-on type (label | display placement) landed on the Job-posting form.
     The rule that separates the two models now — a slot a customer can BOOK on its
     own stays a Placement product (Công việc Hot hôm nay); an enhancement that only
     ever ATTACHES to a job at posting time is a Job posting Add-on. */
  { sku: 'ADD-POPULARJOBS', name: 'Popular Jobs — vị trí premium', type: 'Job posting', role: 'Add-on', price: '— nội bộ', fulfilment: '10 ngày · 4 vị trí cố định', status: 'Active', addonKind: 'placement', slot: 'home-popular-jobs' },
  { sku: 'ADD-HLCOMPANIES', name: 'Highlight Companies — vị trí premium', type: 'Job posting', role: 'Add-on', price: '— nội bộ', fulfilment: '10 ngày · 5 vị trí cố định', status: 'Active', addonKind: 'placement', slot: 'home-highlight-co' },
  { sku: 'ADD-LABEL-HOTJOB', name: 'Nhãn “Hot job”', type: 'Job posting', role: 'Add-on', price: '1,500,000 ₫', fulfilment: '10 ngày · nhãn HOT đỏ trên tin', status: 'Active', addonKind: 'label' },
  { sku: 'CV-TRIAL', name: 'Tìm kiếm hồ sơ dùng thử (7 ngày)', type: 'CV search', role: 'Main', price: '300,000 ₫', fulfilment: '5 lượt · 7 ngày · 1 lần / MST', status: 'Active', activateWithin: 3, trial: true },

  // ── CV search ─────────────────────────────────────────────────────────────
  { sku: 'CV-030', name: 'COMBO 30 — mở CV', type: 'CV search', role: 'Main', price: '2,400,000 ₫', fulfilment: '30 lượt · 30 ngày · ~80.000/CV', status: 'Active' },
  { sku: 'CV-050', name: 'COMBO 50 — mở CV', type: 'CV search', role: 'Main', price: '3,700,000 ₫', fulfilment: '50 lượt · 30 ngày · ~74.000/CV', status: 'Active' },
  { sku: 'CV-100', name: 'COMBO 100 — mở CV', type: 'CV search', role: 'Main', price: '7,000,000 ₫', fulfilment: '100 lượt · 90 ngày · ~70.000/CV', status: 'Active' },
  { sku: 'CV-300', name: 'COMBO 300 — mở CV', type: 'CV search', role: 'Main', price: '20,000,000 ₫', fulfilment: '300 lượt · 90 ngày · ~67.000/CV', status: 'Active' },
  { sku: 'CV-SOURCING', name: 'CV sourcing + giới thiệu', type: 'CV search', role: 'Add-on', price: '— nội bộ', fulfilment: '10 lượt · theo gói cha', status: 'Active' },

  // ── Placement booking ─────────────────────────────────────────────────────
  { sku: 'PLC-HOMEHERO', name: 'Main Banner — Home hero', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1536×371 · 1 of 6 · rotate 3s', status: 'Inactive', content: 'banner' },
  { sku: 'PLC-FEATURECO', name: 'Feature company (logo)', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '6 logo · tối đa 12', status: 'Inactive', content: 'company' },
  { sku: 'PLC-TOPCOMPANY', name: 'Công ty nổi bật', type: 'Placement booking', role: 'Main', price: '10,000,000 ₫ ⓒ', fulfilment: '10 ngày · Home · logo + cover', status: 'Active', content: 'company' },
  { sku: 'PLC-HOTJOBS', name: 'Công việc Hot hôm nay', type: 'Placement booking', role: 'Main', price: '5,000,000 ₫ ⓒ', fulfilment: '10 ngày · 4 vị trí', status: 'Active', content: 'job' },
  { sku: 'PLC-ADS-HOME', name: 'Banner adsense — Home', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1260×120 · 1 of 6', status: 'Inactive', content: 'banner' },
  { sku: 'PLC-ADS-SEARCH', name: 'Banner adsense — Search', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '425×160 · không giới hạn', status: 'Inactive', content: 'banner' },
  { sku: 'PLC-SEARCH-HLCO', name: 'Highlight Company — Search', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1 công ty · không giới hạn', status: 'Inactive', content: 'company' },
  { sku: 'PLC-POPUP', name: 'Homepage pop-up', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1 popup · theo chiến dịch', status: 'Inactive', content: 'banner' },

  // ── Manual service ────────────────────────────────────────────────────────
  { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', type: 'Manual service', role: 'Main', price: '4,000,000 ₫ ⓒ', fulfilment: '1 bài đăng · 176k follower', status: 'Active' },
  { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', type: 'Manual service', role: 'Main', price: '20,000,000 ₫ ⓒ', fulfilment: '1 lượt gửi · reach theo gói cha', status: 'Active' },
  { sku: 'SVC-HACKERRANK', name: 'Đánh giá ứng viên HackerRank', type: 'Manual service', role: 'Add-on', price: '— nội bộ', fulfilment: '1 bài test · chỉ trong Gói Ultimate', status: 'Active' },
  { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', type: 'Manual service', role: 'Add-on', price: '— nội bộ', fulfilment: '2 mốc · ngày 11 và ngày 31', status: 'Active' },
  { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', type: 'Manual service', role: 'Main', price: '8,000,000 ₫', fulfilment: '1 lượt gửi · 650k ứng viên', status: 'Active' },
]

/* Price segments and product descriptions are shared by the create form and the
   product record, so the two can never ask for / show a different set. */
export const PRICE_SEGMENTS = ['SME / Startup', 'Enterprise', 'Standard'] as const

/** Deck-derived VI/EN description — what prints on the quotation and the PO. */
export const DESCRIPTIONS: Record<string, { vi: string; en: string }> = {
  'JOB-BASIC': { vi: 'Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag · Làm mới bài đăng mỗi 15 ngày · Hiển thị tại Trang chủ mục “Công việc mới” và Trang tìm kiếm.', en: 'Official job posting for 30 days, up to 03 skill tags · Refreshed every 15 days · Shown in “New jobs” on the homepage and in search.' },
  'JOB-BASICPLUS': { vi: 'Đăng tuyển chính thức 30 ngày · Làm mới mỗi 10 ngày · Tiêu đề tô đỏ · Ưu tiên hiển thị trong kết quả tìm kiếm · Logo công ty tại mục Highlight Companies · Email marketing đến 7.500 data.', en: 'Official posting for 30 days · Refreshed every 10 days · Bold red title · Priority in search results · Company logo in Highlight Companies · Email marketing to 7,500 targeted profiles.' },
  'JOB-DISTINCTION': { vi: 'Đăng tuyển chính thức 30 ngày, tối đa 05 skill tag · Làm mới mỗi 05 ngày · Tiêu đề đỏ + nền nổi bật · Hiển thị 03 phúc lợi ở trang tìm kiếm · Top Search · Hiển thị tại “Các công ty phổ biến”.', en: 'Official posting for 30 days, up to 05 skill tags · Refreshed every 05 days · Red title + highlighted background · 3 benefits shown in search · Top Search · Shown in Popular Companies.' },
  'JOB-TOPJOB': { vi: 'Gói cao cấp nhất: 30 ngày, tối đa 07 skill tag · Làm mới mỗi ngày trong 7 ngày đầu rồi mỗi 05 ngày · Nhãn “HOT JOB” 10 ngày · “Công việc Hot hôm nay” 10 ngày đầu · Vị trí cao nhất Top Search · Bài đăng fanpage TopDev · Big Banner trong Email Job Alert.', en: 'Top tier: 30 days, up to 07 skill tags · Refreshed daily for the first 7 days then every 05 · “HOT JOB” label for 10 days · “Hot jobs today” for the first 10 days · Highest Top Search position · TopDev fanpage post · Big Banner in the Email Job Alert.' },
  'JOB-TRIAL': { vi: 'Tin dùng thử tặng khách hàng mới: 15 ngày hiển thị, 01 slot, giới hạn 01 lần trên mỗi mã số thuế.', en: 'Free trial posting for new customers: 15 days, 01 slot, limited to once per tax code.' },
  'CV-030': { vi: 'Mở 30 hồ sơ ứng viên (mỗi CV tương ứng 01 lượt mở) · Hạn dùng 30 ngày kể từ ngày kích hoạt · Hồ sơ đã mở được bảo lưu 30 ngày sau khi dịch vụ hết hạn.', en: 'Unlock 30 candidate profiles (1 unlock per CV) · Valid 30 days from activation · Opened profiles retained 30 days after expiry.' },
  'CV-050': { vi: 'Mở 50 hồ sơ ứng viên · Hạn dùng 30 ngày kể từ ngày kích hoạt.', en: 'Unlock 50 candidate profiles · Valid 30 days from activation.' },
  'CV-100': { vi: 'Mở 100 hồ sơ ứng viên · Hạn dùng 90 ngày kể từ ngày kích hoạt.', en: 'Unlock 100 candidate profiles · Valid 90 days from activation.' },
  'CV-300': { vi: 'Mở 300 hồ sơ ứng viên · Hạn dùng 90 ngày kể từ ngày kích hoạt.', en: 'Unlock 300 candidate profiles · Valid 90 days from activation.' },
  'PLC-TOPCOMPANY': { vi: 'Thời gian hiển thị 10 ngày · Vị trí Trang chủ TopDev · Logo công ty và hình ảnh đại diện · Tiếp cận hơn 200.000 lượt truy cập.', en: '10 days · TopDev homepage · Company logo and cover image · Reaches 200,000+ visits.' },
  'PLC-HOTJOBS': { vi: 'Thời gian hiển thị 10 ngày · Trang chủ TopDev · Logo công ty và thông tin tuyển dụng · 4 vị trí hiển thị.', en: '10 days · TopDev homepage · Company logo and job details · 4 display positions.' },
  'SVC-FB-TOPDEV': { vi: 'Bài đăng quảng bá tin tuyển dụng hoặc thương hiệu trên fanpage chính thức TopDev, hơn 176.000 follower.', en: 'A promotional post for the job or brand on the official TopDev fanpage, 176,000+ followers.' },
  'SVC-EMAIL-DEV': { vi: 'Gửi email tin tuyển dụng hoặc chiến dịch truyền thông đến database developer của TopDev.', en: 'Email the job or campaign to the TopDev developer database.' },
}

export type CatalogItem = (typeof CATALOG)[number]

export const PACKAGES: { name: string; note: string; components: string; price: string; status: 'Active' | 'Inactive' }[] = [
  { name: 'Gói Ultimate', note: '6 components · from the client catalogue', components: 'Top Job posting (60 ngày: 30 chính thức + 30 bảo hành) · CV sourcing + giới thiệu · Email marketing 9.500 data · Popular Companies logo · HackerRank assessment · CSKH follow-up', price: '16,489,000 ₫', status: 'Active' },
  { name: 'Top Job + premium position', note: '2 components · proposed', components: 'Tin Top Job ×1 · Popular Jobs premium position ×1', price: '— price TBC', status: 'Inactive' },
  { name: 'Enterprise (custom)', note: 'quoted per deal', components: 'All products + negotiated volume', price: 'Custom', status: 'Inactive' },
]

/* ── Discount programmes ──────────────────────────────────────────────────────
   The client's own promo sheet, configured here ONCE and applied by the quotation
   builder automatically. It is deliberately settings, not a hard-coded rule: the
   thresholds are a commercial decision that changes every campaign, and a rep
   typing 25 / 30 / 35 by hand gets it wrong roughly as often as they get it right.

   Two programmes, two SHAPES, and the shapes are genuinely different — which is
   why this is not one table with an audience column:

     volume per PRODUCT (Existing)  — quantities of the SAME product are summed
                                      across the option, and the tier that total
                                      reaches sets the % on every line of it
     flat on the order  (New/Churn) — one % on everything, but only while EVERY
                                      line stays at or under a quantity cap

   “Cùng loại” is the load-bearing phrase in the first one: 3 + 4 Basic Plus on two
   lines is 7 Basic Plus, so both lines earn the 5-tier at 30% — not 25% each for
   being under 5 separately. Splitting a line must never change the price.

   The second is all-or-nothing on purpose: one line over the cap and the whole
   50% is lost, not just that line's share. That cliff is the client's rule, and
   it is the reason the builder has to show WHICH line broke it. */
type PromoAudience = Account
type VolumeTier = { minQty: number; pct: number }
export type Programme = {
  id: string
  name: string
  vi: string
  audience: PromoAudience[]
  /** per-product: quantities of the same product are summed, then tiered ·
      flat: one % on the whole option */
  kind: 'volume-per-product' | 'flat-order'
  tiers?: VolumeTier[]
  pct?: number
  /** flat only — every non-gift line must be at or under this, or nothing applies */
  maxQtyPerLine?: number
  /** flat only — first PO of the CURRENT status spell, not first in history: for a
      Churn customer that is the first PO since they came back. Self-enforcing,
      because the first invoice flips them to Existing and the programme stops
      matching on its own. */
  firstPoOfCurrentSpell?: boolean
  /** whether it may run alongside another programme on the same quotation */
  stackable: boolean
  /** gift lines inherit the paid line's activation window rather than their own */
  giftActivationFollowsPaid?: boolean
  status: 'Active' | 'Inactive'
  from: string
  to: string
  note?: string
}

export const PROGRAMMES: Programme[] = [
  {
    id: 'EXISTING-VOLUME',
    name: 'Volume discount — existing customers',
    vi: 'Chiết khấu theo số lượng (cùng loại)',
    audience: ['Existing'],
    kind: 'volume-per-product',
    // Thresholds, not exact matches: 7 tin earns the 5-tier, not nothing.
    tiers: [
      { minQty: 2, pct: 25 }, { minQty: 5, pct: 30 }, { minQty: 10, pct: 35 },
      { minQty: 20, pct: 40 }, { minQty: 30, pct: 45 }, { minQty: 50, pct: 50 },
      { minQty: 100, pct: 60 },
    ],
    stackable: true,
    status: 'Active',
    from: '01/01/2026',
    to: '31/12/2026',
    note: 'Section 1 of 3 on the client’s sheet — the other two sections that “apply at the same time” have not been supplied yet.',
  },
  {
    id: 'NEWCHURN-50',
    name: 'Welcome / win-back — 50% off everything',
    vi: 'Giảm 50% tất cả các dịch vụ',
    audience: ['New', 'Churn'],
    kind: 'flat-order',
    pct: 50,
    maxQtyPerLine: 5,
    firstPoOfCurrentSpell: true,
    stackable: false,
    giftActivationFollowsPaid: true,
    status: 'Active',
    from: '01/01/2026',
    to: '31/12/2026',
    note: 'Over the cap, the sheet’s own escape routes are: quote the Existing programme instead, or split into two documents so the customer gets both. Both are a rep decision, not something the system does by itself.',
  },
]

/** The one programme that applies to a customer status, or null. */
export const programmeFor = (a?: Account) => PROGRAMMES.find((x) => x.status === 'Active' && a && x.audience.includes(a)) ?? null
/** Highest tier whose threshold the quantity reaches. 1 earns nothing. */
export const tierPct = (p: Programme, qty: number) =>
  (p.tiers ?? []).reduce((best, t) => (qty >= t.minQty ? t.pct : best), 0)
/** Quantity of each product across an option's PAID lines — the number the tier
    is looked up on. Gifts are 0 ₫ and were not bought, so they never count. */
export const qtyByProduct = (lines: { cat: number; qty: number; gift: boolean }[]) => {
  const m = new Map<number, number>()
  lines.forEach((l) => { if (!l.gift) m.set(l.cat, (m.get(l.cat) ?? 0) + l.qty) })
  return m
}
