import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ARTWORK_SETS, RENDITIONS, TAGS, autoSetFor, covers, imgStyle, matchLabel, missingFor,
  rankedSetsFor, setLabel, tagName,
} from '@/pages/admin/data/products'
import type { ArtworkSet, RankedSet, Rendition } from '@/pages/admin/data/products'
import { industryName, industryPath } from '@/pages/admin/data/industries'

/* ─────────────────────────────────────────────────────────────────────────────
   CARD ARTWORK on the job form.

   The problem this replaces: on stg-admin each rendition is picked on its own —
   "Pick image" opens, you filter to Photo — landscape, you choose; then it opens
   again for the portrait and you try to remember which photograph you just used.
   Two searches, and nothing in the form checks that the two results are the same
   scene. The hover card routinely ends up showing a different photo from the one
   at rest, and nobody sees it until the posting is live.

   What it becomes: the job holds THREE ASSET REFERENCES, but the operator deals
   in SETS. Industry fills all three before anyone touches the section; "Đổi ảnh"
   swaps all three in one click; mixing renditions from different sets is still
   possible, behind a toggle, because it is the exception and should cost one
   extra click rather than shaping the default path.

   The three ids are stored on the job, NOT just the set id: archiving or
   re-cropping a set must never repaint a posting that is already running. */

type Source = 'auto' | 'manual' | 'mixed' | 'company'
/** per-slot: which set each rendition came from. One set in all three = a clean pick. */
type Picked = Partial<Record<Rendition, ArtworkSet>>

const sameSet = (p: Picked) => {
  const ids = [...new Set(RENDITIONS.map((r) => p[r.key]?.id).filter(Boolean))]
  return ids.length === 1 ? RENDITIONS.map((r) => p[r.key]).find(Boolean)! : null
}

function fill(set: ArtworkSet | null): Picked {
  if (!set) return {}
  return Object.fromEntries(RENDITIONS.filter((r) => set.renditions[r.key]).map((r) => [r.key, set])) as Picked
}

/** The artwork as the paid bands will print it. */
function SlotRow({ picked, need, onSlot }: { picked: Picked; need: Rendition[]; onSlot?: (r: Rendition) => void }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {RENDITIONS.filter((r) => need.includes(r.key)).map((r) => {
        const s = picked[r.key]
        /* `cn` is a plain join, so the radius lives in the box string only — a
           wrapper adding its own rounded-* would race this one in the stylesheet. */
        const box = r.key === 'landscape' ? 'h-[92px] w-[213px] rounded-lg' : r.key === 'portrait' ? 'h-[92px] w-[49px] rounded-lg' : 'h-[92px] w-[92px] rounded-full'
        return (
          <div key={r.key}>
            <div
              className={cn('relative overflow-hidden border', box, s ? 'border-line' : 'border-2 border-dashed border-line bg-canvas/50')}
              style={s ? imgStyle(s.hue) : undefined}
            >
              {s ? (
                <>
                  <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white">badge</span>
                  <span className="absolute right-1 top-1 text-[11px] text-white/90">☆</span>
                </>
              ) : (
                <span className="grid h-full place-items-center text-[10.5px] text-faint">trống</span>
              )}
            </div>
            {/* No caption. The shape IS the label — a 2.3:1 strip, a tall
                rectangle and a circle are told apart by looking, and the pixel
                size is a build fact that belongs in the spec, not on a form the
                operator reads fifty times a day. (Job management · "Card
                artwork" carries the sizes and where each frame prints.) */}
            {onSlot && (
              <button onClick={() => onSlot(r.key)} className="mt-1.5 text-[10.5px] text-brand hover:underline">Chọn riêng khung này</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function JobArtworkGroup({ industry, need }: { industry: string; need: Rendition[] }) {
  /* NOTHING TO ASK FOR. A product whose placements print no picture gets no
     artwork section — not an empty one. An empty section reads as "you forgot
     something" on a posting that will never render a frame. */
  if (need.length === 0) {
    return (
      <p className="rounded-md border border-line bg-canvas/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
        Gói đang chọn <b className="text-ink/70">không in khung ảnh nào</b> trên các placement nó chiếm, nên tin này
        không cần ảnh. Đổi sang gói có placement ảnh thì phần này hiện lại.
      </p>
    )
  }
  return <ArtworkPicker industry={industry} need={need} />
}

function ArtworkPicker({ industry, need }: { industry: string; need: Rendition[] }) {
  /* The automatic default resolves the moment Industry is known. It is a PREFILL,
     never a lock: `source` records who chose, and that is the whole state machine. */
  const auto = useMemo(() => autoSetFor(industry, need), [industry, need])
  const [picked, setPicked] = useState<Picked>(() => fill(auto))
  const [source, setSource] = useState<Source>('auto')
  const [industryAtPick, setIndustryAtPick] = useState(industry)
  const [open, setOpen] = useState<null | { slot?: Rendition }>(null)

  /* Industry changed AFTER the artwork was filled. Untouched artwork re-resolves
     silently; a hand-picked one is left exactly as it is and only flagged — the
     operator chose that photograph on purpose and an automatic swap would undo a
     decision without telling anyone. */
  const stale = industry !== industryAtPick
  if (stale && source === 'auto') {
    setIndustryAtPick(industry)
    setPicked(fill(autoSetFor(industry)))
  }

  const one = sameSet(picked)
  const filled = RENDITIONS.filter((r) => need.includes(r.key) && picked[r.key]).length
  const apply = (set: ArtworkSet, slot?: Rendition) => {
    if (slot) {
      setPicked((p) => ({ ...p, [slot]: set }))
      setSource('mixed')
    } else {
      setPicked(fill(set))
      setSource('manual')
    }
    setIndustryAtPick(industry)
    setOpen(null)
  }

  return (
    <>
      {/* A BADGE MARKS A DEVIATION, NOT THE DEFAULT. The auto fill used to
          announce itself ("✓ Tự điền theo ngành X — cụm «…»"); it was the one
          state that needs no announcing, and it put a sentence at the top of
          the section on every single posting. Silence now means "the system
          filled this"; a badge means a human stepped in, or nothing could be
          filled — the two cases actually worth a glance. */}
      <div className="flex flex-wrap items-center gap-2">
        {source === 'manual' && one && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-brand">
            Chọn tay — cụm “{setLabel(one)}”
          </span>
        )}
        {source === 'mixed' && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-brand">
            Ghép từ {new Set(RENDITIONS.map((r) => picked[r.key]?.id).filter(Boolean)).size} cụm
          </span>
        )}
        {!one && source === 'auto' && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11.5px] font-medium text-amber-800">
            ⚠ Ngành <b>{industryName(industry)}</b> chưa có cụm nào đủ khung gói này cần — chưa điền được
          </span>
        )}
        <button onClick={() => setOpen({})} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:border-brand">
          Đổi ảnh…
        </button>
        {source !== 'auto' && auto && (
          <button onClick={() => { setPicked(fill(auto)); setSource('auto'); setIndustryAtPick(industry) }} className="text-[11.5px] text-brand hover:underline">
            ↺ Về ảnh tự điền
          </button>
        )}
      </div>

      {stale && source !== 'auto' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
          Ngành đã đổi thành <b>{industryPath(industry)}</b>, nhưng ảnh đang là ảnh <b>chọn tay</b> nên hệ thống <b>không tự đổi</b>.
          {auto && <> Muốn theo ngành mới thì bấm <b>↺ Về ảnh tự điền</b> (“{setLabel(auto)}”).</>}
        </div>
      )}

      <SlotRow picked={picked} need={need} onSlot={(r) => setOpen({ slot: r })} />

      {/* The explainer that stood here — how many sets reach this industry, that
          the deepest match wins, that the job stores three asset ids — is spec,
          not UI. It is in Job management · "Card artwork". What the operator
          still needs AT THE MOMENT OF FILLING THE FORM is the one line below:
          this posting cannot be published yet. */}
      {filled < need.length && (
        <p className="text-[11px] font-medium text-amber-700">
          Còn {need.length - filled} khung trống — gói này in khung đó nên sẽ bị chặn khi đăng.
        </p>
      )}

      {open && (
        <PickArtworkModal
          industry={industry}
          need={need}
          slot={open.slot}
          current={picked}
          onApply={apply}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}

/* ── The picker ──────────────────────────────────────────────────────────────
   Set-first. "Gợi ý theo ngành" is the tab it opens on, and every row there is a
   whole set, so the common case is one click for three frames. Slot-level picking
   exists on the same screen but is reached deliberately — through "Chọn riêng
   khung này" on the slot, which is what `slot` carries in. */
function PickArtworkModal({
  industry, need, slot, current, onApply, onClose,
}: {
  industry: string
  need: Rendition[]
  slot?: Rendition
  current: Picked
  onApply: (s: ArtworkSet, slot?: Rendition) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'suggested' | 'all' | 'company' | 'upload'>('suggested')
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('')
  const [completeOnly, setCompleteOnly] = useState(!slot)
  const needLabel = RENDITIONS.filter((r) => need.includes(r.key)).map((r) => r.label.toLowerCase()).join(' · ')

  /* "Gợi ý theo ngành" keeps the resolver's own ranking — best match first — so
     the list is in the order the system would have chosen. "Tất cả cụm" has no
     ranking to show, so it falls back to least-used. */
  const ranked: RankedSet[] = tab === 'suggested'
    ? rankedSetsFor(industry)
    : ARTWORK_SETS.filter((s) => !s.archived).sort((a, b) => a.uses - b.uses).map((s) => ({ set: s, tier: 0 as const, depth: 0 }))
  const rows = ranked
    .filter(({ set: s }) => (slot ? !!s.renditions[slot] : true))
    .filter(({ set: s }) => (completeOnly ? covers(s, need) : true))
    .filter(({ set: s }) => !topic || s.tags.includes(topic))
    .filter(({ set: s }) => !q.trim() || setLabel(s).toLowerCase().includes(q.trim().toLowerCase()))

  const slotLabel = slot ? RENDITIONS.find((r) => r.key === slot)!.label.toLowerCase() : null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[980px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">{slot ? `Chọn ảnh cho khung ${slotLabel}` : 'Chọn cụm ảnh'}</p>
            <p className="text-[11px] text-muted">
              {slot
                ? <>Chỉ thay <b>một khung</b> — hai khung còn lại giữ nguyên. Tin sẽ được đánh dấu <i>ghép từ nhiều cụm</i>.</>
                : <>Gói này in <b>{needLabel}</b> — chọn một cụm là nhận hết các khung đó cùng lúc.</>}
            </p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="flex gap-1 border-b border-line px-5">
          {([
            ['suggested', `Gợi ý theo ngành · ${industryName(industry)}`],
            ['all', 'Tất cả cụm'],
            ['company', 'Ảnh của công ty'],
            ['upload', 'Tải lên'],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cn('-mb-px border-b-2 px-2.5 py-2 text-[12px]', tab === k ? 'border-brand font-semibold text-brand' : 'border-transparent text-muted hover:text-ink')}>{l}</button>
          ))}
        </div>

        {tab === 'company' ? (
          <div className="p-5">
            <p className="rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
              Ảnh <b className="text-ink/70">NEC Vietnam</b> tự tải lên cho tin của họ. Cũng lưu thành <b>cụm</b> với đúng
              ba khung như thư viện chung, nhưng <b>chỉ công ty này thấy</b> — mình không có quyền phát hành lại ảnh của
              họ cho công ty khác.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[{ id: 'c1', title: 'Văn phòng NEC · tầng 12', hue: 206 }, { id: 'c2', title: 'Team kỹ thuật NEC', hue: 274 }].map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-lg border border-line p-2.5">
                  <span className="h-[44px] w-[78px] shrink-0 rounded" style={imgStyle(c.hue)} />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">{c.title}</span>
                  <button className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-[11.5px] font-medium text-ink hover:border-brand">Dùng</button>
                </div>
              ))}
            </div>
          </div>
        ) : tab === 'upload' ? (
          <div className="p-5">
            <div className="grid w-full place-items-center gap-1 rounded-xl border-2 border-dashed border-line bg-canvas/40 px-4 py-8 text-center">
              <span className="text-[22px]">🖼️</span>
              <span className="text-[13px] font-semibold text-ink">Kéo thả một ảnh gốc</span>
              <span className="text-[11px] text-muted">≥ 600 × 1120 — hệ thống cắt sẵn cả ba khung từ focal point</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              Ảnh tải ở đây <b>chỉ nằm trên tin này</b> và trên cụm riêng của công ty — không vào thư viện chung.
              Ảnh thật của nơi làm việc luôn thắng ảnh stock, nên nguồn này được ưu tiên cao nhất.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5">
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-faint">🔍</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên cụm…" className="w-[190px] rounded-lg border border-line bg-surface py-1 pl-7 pr-2 text-[11.5px] outline-none focus:border-brand" />
              </div>
              <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', topic ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
                <span className={topic ? 'text-brand/70' : 'text-faint'}>Chủ đề</span>
                <select value={topic} onChange={(e) => setTopic(e.target.value)} className={cn('max-w-[150px] cursor-pointer bg-transparent text-[11.5px] outline-none', topic ? 'font-medium text-brand' : 'text-ink')}>
                  <option value="">Tất cả</option>
                  {TAGS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              {!slot && (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
                  <input type="checkbox" checked={completeOnly} onChange={(e) => setCompleteOnly(e.target.checked)} className="accent-brand" />
                  Chỉ cụm đủ khung gói cần
                </label>
              )}
              <span className="ml-auto text-[11px] text-faint">{rows.length} cụm · {tab === 'suggested' ? 'khớp sâu nhất, rồi ít dùng nhất' : 'ít dùng nhất lên trước'}</span>
            </div>

            <div className="max-h-[420px] overflow-y-auto border-t border-line px-5 py-3">
              {tab === 'suggested' && (
                <p className="mb-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11px] leading-relaxed text-brand">
                  Cụm với tới được <b>{industryPath(industry)}</b> — gắn đúng ngành này, gắn ở một <b>nhóm cha</b>,
                  gắn ở một <b>ngành con</b>, hoặc đánh dấu <i>Mọi ngành</i>. Xếp theo mức khớp. Mở <b>Tất cả cụm</b> nếu
                  muốn một cảnh ngoài ngành — không có gì chặn, chỉ là không được đề xuất.
                </p>
              )}
              {/* A GRID, not a list. Picking a picture is a visual comparison: the
                  eye wants several candidates side by side, and a one-per-row list
                  shows three at a time with most of the width spent on empty space.
                  Three cards per row turns "scroll and squint" into "look and click". */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((rk) => {
                  const s = rk.set
                  const inUse = RENDITIONS.some((r) => current[r.key]?.id === s.id)
                  /* In slot mode only the frame being replaced is worth showing —
                     the other two are not what is being chosen. */
                  const frames = RENDITIONS.filter((r) => (slot ? r.key === slot : need.includes(r.key)))
                  return (
                    <div key={s.id} className={cn('flex flex-col rounded-xl border p-2.5', inUse ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-ink/30')}>
                      <div className="flex min-h-[52px] items-end gap-1.5">
                        {frames.map((r) => {
                          const has = s.renditions[r.key]
                          const box = r.key === 'landscape' ? 'h-[46px] w-[106px] rounded' : r.key === 'portrait' ? 'h-[46px] w-[25px] rounded' : 'h-[46px] w-[46px] rounded-full'
                          return (
                            <span key={r.key} className={cn('relative block shrink-0 overflow-hidden border', box, has ? 'border-line' : 'border-dashed border-amber-300 bg-amber-50')} style={has ? imgStyle(s.hue) : undefined}>
                              {!has && <span className="absolute inset-0 grid place-items-center text-[8px] text-amber-700">—</span>}
                            </span>
                          )
                        })}
                        {inUse && <span className="ml-auto self-start rounded-full bg-brand px-1.5 py-px text-[9px] font-semibold text-white">đang dùng</span>}
                      </div>

                      <p className="mt-1.5 truncate text-[12.5px] font-medium text-ink" title={setLabel(s)}>{setLabel(s)}</p>

                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {/* WHY this set was offered. Without it a ranked grid is
                            just an order nobody can check. */}
                        {tab === 'suggested' && (
                          <span className={cn('rounded-full px-1.5 py-px text-[10px] font-semibold',
                            rk.tier === 0 && rk.depth === 3 ? 'bg-emerald-100 text-emerald-800'
                              : rk.tier === 0 ? 'bg-brand-soft text-brand'
                              : 'bg-canvas text-muted')}>
                            {matchLabel(rk)}
                          </span>
                        )}
                        {s.anyIndustry
                          ? <span className="rounded-full border border-brand/30 bg-brand-soft px-1.5 py-px text-[10px] font-medium text-brand">Mọi ngành</span>
                          : s.industries.slice(0, 2).map((i) => <span key={i} className="max-w-[110px] truncate rounded-full border border-brand/25 bg-brand-soft px-1.5 py-px text-[10px] text-brand" title={industryPath(i)}>{industryName(i)}</span>)}
                        {s.tags.slice(0, 2).map((t: string) => <span key={t} className="max-w-[90px] truncate rounded-full border border-line bg-canvas px-1.5 py-px text-[10px] text-muted">{tagName(t)}</span>)}
                      </div>

                      <p className="mt-1 text-[10px] text-faint">
                        {s.uses} tin đang dùng
                        {!covers(s, need) && <span className="text-amber-700"> · thiếu {missingFor(s, need).join(', ').toLowerCase()}</span>}
                      </p>

                      <button onClick={() => onApply(s, slot)} className="mt-2 w-full rounded-lg bg-brand px-3 py-1.5 text-[11.5px] font-semibold text-white hover:opacity-90">
                        {slot ? `Dùng cho khung ${slotLabel}` : 'Dùng cả cụm'}
                      </button>
                    </div>
                  )
                })}
                {rows.length === 0 && (
                  <p className="col-span-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
                    Không có cụm nào khớp. Bỏ bớt bộ lọc, mở <b>Tất cả cụm</b>, hoặc tải ảnh riêng cho tin này.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <span className="max-w-[60ch] text-[10.5px] leading-relaxed text-faint">
            {slot
              ? <>Ghép khung từ nhiều cụm là <b>trường hợp ngoại lệ</b> — tiện khi khung dọc của cụm này đẹp hơn, nhưng ba khung khác cảnh nhau thì thẻ lúc hover trông như đổi sang tin khác.</>
              : <>Một cụm = một cảnh ở ba tỉ lệ. Cần ghép từ nhiều cụm thì bấm <b>“Chọn riêng khung này”</b> dưới từng khung ở form.</>}
          </span>
          <button onClick={onClose} className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Đóng</button>
        </div>
      </div>
    </div>
  )
}
