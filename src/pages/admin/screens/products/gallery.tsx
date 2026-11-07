import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ARTWORK_SETS, INDUSTRIES_L1, RENDITIONS, TAGS,
  imgStyle, isComplete, missingOf, ownCoverage, setLabel, suggestIndustries, tagName,
} from '@/pages/admin/data/products'
import type { ArtworkSet, Rendition } from '@/pages/admin/data/products'
import { industryBranch, industryLevel, industryName, industryPath } from '@/pages/admin/data/industries'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { IndustryTreePicker } from '@/pages/admin/ui/industryPicker'
import { TagField, TagManager } from '@/pages/admin/ui/tagField'
import { Pill } from '@/pages/admin/ui/status'

/** The three renditions of a set, at their real aspect ratios. One hue across all
    three because it IS one photograph — the claim the set makes, shown not asserted. */
function RenditionStrip({ set }: { set: ArtworkSet }) {
  /* `cn` is a plain join, not tailwind-merge: two rounded-* classes on one element
     race in the stylesheet. The radius lives in the box string ONLY. */
  const box: Record<Rendition, string> = {
    landscape: 'h-[54px] w-[96px] rounded-md',
    portrait: 'h-[54px] w-[40px] rounded-md',
    circle: 'h-[54px] w-[54px] rounded-full',
  }
  return (
    <span className="flex items-end gap-1.5">
      {RENDITIONS.map((r) => {
        const has = set.renditions[r.key]
        return (
          <span key={r.key} className="block">
            <span
              className={cn('relative block overflow-hidden border', box[r.key], has ? 'border-line' : 'border-dashed border-amber-300 bg-amber-50')}
              style={has ? imgStyle(set.hue) : undefined}
            >
              {!has && <span className="absolute inset-0 grid place-items-center text-[9px] font-medium text-amber-700">trống</span>}
              {has?.derived && <span className="absolute bottom-0 right-0 bg-black/45 px-1 text-[8px] text-white" title="Cắt ra từ ảnh gốc">✂</span>}
            </span>
            <span className="mt-0.5 block text-center text-[9px] text-faint">{r.label}</span>
          </span>
        )
      })}
    </span>
  )
}

/** A set's industries as chips, each showing which LEVEL it was tagged at — the
    thing that decides how wide its reach is, so it belongs on the chip. */
function IndustryChips({ set, max }: { set: ArtworkSet; max?: number }) {
  if (set.anyIndustry) return <span className="rounded-full border border-brand/30 bg-brand-soft px-1.5 py-px text-[10px] font-medium text-brand">Mọi ngành</span>
  const shown = max ? set.industries.slice(0, max) : set.industries
  return (
    <>
      {shown.map((id) => (
        <span key={id} className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand-soft px-1.5 py-px text-[10px] text-brand" title={industryPath(id)}>
          <span className="text-[8.5px] font-semibold text-brand/60">L{industryLevel(id)}</span>
          {industryName(id)}
        </span>
      ))}
      {max && set.industries.length > max && <span className="text-[10px] text-faint">+{set.industries.length - max}</span>}
    </>
  )
}

export function AdminImageGallery() {
  const goto = useContext(ScreenNavCtx)
  const [group, setGroup] = useState('')
  const [tag, setTag] = useState('')
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [open, setOpen] = useState<ArtworkSet | null>(null)
  const [creating, setCreating] = useState(false)
  const [managingTags, setManagingTags] = useState(false)

  /* Filtering by a GROUP means its whole branch — a set tagged "Road freight" has
     to appear under Logistics, or the filter lies about what the library holds. */
  const branch = group ? industryBranch(group) : []
  const shown = ARTWORK_SETS.filter((s) => (showArchived ? true : !s.archived))
    .filter((s) => !group || s.anyIndustry || s.industries.some((i) => branch.includes(i)))
    .filter((s) => !tag || s.tags.includes(tag))
    .filter((s) => !q.trim() || (setLabel(s) + ' ' + s.tags.map(tagName).join(' ')).toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div>
      {/* Coverage gaps are NOT banners. They are read off the two controls that can
          act on them: the group filter prints each group's complete-set count, and
          "Phiên bản · Còn thiếu" lists the unfinished sets. A warning you cannot
          click is just noise sitting above the work. */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-faint">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên cụm, tag…" className="w-[190px] rounded-lg border border-line bg-surface py-1 pl-7 pr-2 text-[11.5px] outline-none focus:border-brand" />
        </div>
        <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', group ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
          <span className={group ? 'text-brand/70' : 'text-faint'}>Nhóm ngành</span>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className={cn('max-w-[180px] cursor-pointer bg-transparent text-[11.5px] outline-none', group ? 'font-medium text-brand' : 'text-ink')}>
            <option value="">Tất cả</option>
            {INDUSTRIES_L1.map((id) => <option key={id} value={id}>{industryName(id)} ({ownCoverage(id)})</option>)}
          </select>
        </label>
        <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', tag ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
          <span className={tag ? 'text-brand/70' : 'text-faint'}>Tag</span>
          <select value={tag} onChange={(e) => setTag(e.target.value)} className={cn('max-w-[150px] cursor-pointer bg-transparent text-[11.5px] outline-none', tag ? 'font-medium text-brand' : 'text-ink')}>
            <option value="">Tất cả</option>
            {TAGS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <button onClick={() => setShowArchived((v) => !v)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', showArchived ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted hover:border-ink/30')}>
          Hiện cả cụm đã lưu trữ
        </button>
        <button onClick={() => setManagingTags(true)} className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11.5px] text-muted hover:border-ink/30">
          Quản lý tag
        </button>
        <div className="ml-auto flex gap-1.5">
          <button onClick={() => goto('admin-image-bulk')} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink hover:border-brand">⇪ Nhập hàng loạt</button>
          <button onClick={() => setCreating(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">＋ Tạo cụm ảnh</button>
        </div>
      </div>

      <p className="mb-1.5 text-[11px] text-faint">
        Hiển thị <b className="font-semibold text-ink/70 tabular-nums">{shown.length}</b> / Tổng{' '}
        <b className="font-semibold text-ink/70 tabular-nums">{ARTWORK_SETS.filter((s) => !s.archived).length}</b> cụm đang dùng được
        {group && <> · <b className="text-ink/70">{industryName(group)}</b> có <b className="text-ink/70 tabular-nums">{ownCoverage(group)}</b> cụm đầy đủ trong nhánh này</>}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((s, n) => (
          <button key={s.id} onClick={() => setOpen(s)} className="rounded-xl border border-line bg-surface p-2.5 text-left transition-colors hover:border-brand">
            <span className="flex items-start justify-between gap-2">
              <RenditionStrip set={s} />
              <span className="shrink-0 text-right">
                <span className="block rounded bg-canvas px-1.5 py-0.5 text-[10px] text-muted">{s.uses} tin dùng</span>
                {s.archived && <span className="mt-1 block rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Lưu trữ</span>}
              </span>
            </span>
            <span className={cn('mt-2 block truncate text-[12.5px]', s.title ? 'font-medium text-ink' : 'italic text-faint')}>{setLabel(s, n + 1)}</span>
            <span className="mt-1 flex flex-wrap items-center gap-1"><IndustryChips set={s} max={3} /></span>
            <span className="mt-1 flex flex-wrap items-center gap-1">
              {s.tags.map((t) => <span key={t} className="rounded-full border border-line bg-canvas px-1.5 py-px text-[10px] text-muted">{tagName(t)}</span>)}
              {s.expires && <span className="rounded-full border border-line bg-canvas px-1.5 py-px text-[10px] text-faint">hết hạn {s.expires}</span>}
            </span>
            {!isComplete(s) && !s.archived && (
              <span className="mt-1.5 block text-[10px] font-medium text-amber-700">⚠ Thiếu {missingOf(s).join(' · ').toLowerCase()} — không được dùng làm ảnh tự điền</span>
            )}
          </button>
        ))}
      </div>

      {open && <SetModal set={open} onClose={() => setOpen(null)} />}
      {creating && <CreateSetModal onClose={() => setCreating(false)} />}
      {managingTags && <TagManager onClose={() => setManagingTags(false)} />}
    </div>
  )
}

/* ── One set ─────────────────────────────────────────────────────────────── */
function SetModal({ set, onClose }: { set: ArtworkSet; onClose: () => void }) {
  const [industries, setIndustries] = useState<string[]>(set.industries)
  const [any, setAny] = useState(!!set.anyIndustry)
  const [tags, setTags] = useState<string[]>(set.tags)
  const [title, setTitle] = useState(set.title ?? '')
  const [expires, setExpires] = useState(set.expires ?? '')
  const canSave = any || industries.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="my-4 w-full max-w-[720px] rounded-xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={setLabel(set) + ' — đặt tên (không bắt buộc)'}
              className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[14px] font-bold text-ink outline-none placeholder:font-normal placeholder:italic placeholder:text-faint hover:border-line focus:border-brand"
            />
            <p className="px-1 text-[11px] text-muted">{set.uses} tin đang dùng{set.expires ? ` · bản quyền đến ${set.expires}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">✕</button>
        </div>

        <div className="p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Ba phiên bản</p>
          <div className="flex flex-wrap items-start gap-4">
            {RENDITIONS.map((r) => {
              const has = set.renditions[r.key]
              const box = r.key === 'landscape' ? 'h-[108px] w-[192px] rounded-lg' : r.key === 'portrait' ? 'h-[108px] w-[81px] rounded-lg' : 'h-[108px] w-[108px] rounded-full'
              return (
                <div key={r.key}>
                  <div className={cn('relative overflow-hidden border', box, has ? 'border-line' : 'border-2 border-dashed border-amber-300 bg-amber-50')} style={has ? imgStyle(set.hue) : undefined}>
                    {has ? (
                      <>
                        <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white">badge</span>
                        <span className="absolute right-1 top-1 text-[11px] text-white/90">☆</span>
                        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand" title="Focal point" />
                      </>
                    ) : (
                      <span className="grid h-full place-items-center text-[11px] font-medium text-amber-700">Chưa có</span>
                    )}
                  </div>
                  <p className="mt-1 text-[10.5px] font-medium text-ink">{r.label} · {r.px}</p>
                  <p className="text-[10px] text-faint">{r.where}</p>
                  <p className="mt-1 flex gap-1.5 text-[10.5px]">
                    {has
                      ? <><button className="text-brand hover:underline">Cắt lại</button><span className="text-faint">·</span><button className="text-brand hover:underline">Thay tệp</button></>
                      : <><button className="text-brand hover:underline">Cắt từ ảnh gốc</button><span className="text-faint">·</span><button className="text-brand hover:underline">Tải tệp riêng</button></>}
                  </p>
                  {has?.derived && <p className="mt-0.5 text-[10px] text-faint">✂ cắt từ ảnh gốc</p>}
                </div>
              )
            })}
          </div>

          <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wide text-faint">
            Ngành <span className="text-rose-500">*</span>
            <span className="ml-1.5 font-normal normal-case tracking-normal text-faint">— bắt buộc. Chọn ở bất kỳ cấp nào: nhóm · ngành · chuyên ngành</span>
          </p>
          <label className={cn('mb-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px]', any ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted')}>
            <input type="checkbox" checked={any} onChange={(e) => setAny(e.target.checked)} className="accent-current" />
            Mọi ngành (ảnh trung tính — dùng làm dự phòng)
          </label>
          <div className={cn(any && 'pointer-events-none opacity-40')}>
            <IndustryTreePicker value={industries} onChange={setIndustries} />
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
            Gắn ở <b>nhóm</b> thì cả nhánh dùng được tấm ảnh này; gắn ở <b>chuyên ngành</b> thì chỉ tin đúng chuyên ngành
            đó mới ưu tiên nó. Tin đăng luôn lấy <b>mức khớp sâu nhất</b> trước, nên một cụm gắn nhóm không bao giờ chặn
            mất một cụm gắn chuyên ngành.
          </p>

          <div className="mt-4 grid grid-cols-[1fr_170px] gap-4">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                Tag <span className="ml-1.5 font-normal normal-case tracking-normal text-faint">— không bắt buộc, gõ để tạo mới</span>
              </p>
              <TagField value={tags} onChange={setTags} />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Hết hạn</p>
              <input value={expires} onChange={(e) => setExpires(e.target.value)} placeholder="dd/mm/yyyy" className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] outline-none focus:border-brand" />
              <p className="mt-1 text-[10px] leading-relaxed text-faint">Để trống nếu bản quyền vĩnh viễn.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          <span className="text-[11px] text-faint">
            {!canSave
              ? <span className="text-amber-700">Chưa có ngành — bắt buộc trước khi lưu</span>
              : isComplete(set)
                ? <>Đủ cả 3 phiên bản — <b className="text-ink/70">được dùng làm ảnh tự điền</b></>
                : <span className="text-amber-700">Thiếu {missingOf(set).join(' · ').toLowerCase()} — chỉ chọn tay được</span>}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Đóng</button>
            <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Lưu trữ</button>
            <button disabled={!canSave} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Create a set ─────────────────────────────────────────────────────────────
   ONE SCREEN, no mode toggle and no wizard.

   The earlier version made you choose "một ảnh gốc" vs "tải riêng từng khung"
   before you had done anything, then pushed classification onto a second step.
   Both were wrong. The two upload routes are not alternatives you pick between —
   they are the SAME SCREEN: drop a master at the top and the three frames below
   fill themselves by cropping it; drop a file straight onto a frame and that
   frame uses it instead. Mixing the two on one set is normal, not an exception.

   Classification sits underneath, visible from the start, so the whole thing is
   one pass: drop, check the three crops, pick an industry, save. */

/** Cropping one frame. The master fills the stage, a scrim darkens everything
    outside the frame, so what is KEPT and what is thrown away read at once. */
function CropOverlay({ format, hue, onDone, onCancel }: {
  format: Rendition; hue: number; onDone: () => void; onCancel: () => void
}) {
  const [zoom, setZoom] = useState(1)
  const r = RENDITIONS.find((x) => x.key === format)!
  const frame = format === 'landscape' ? 'h-[150px] w-[267px] rounded-md'
    : format === 'portrait' ? 'h-[216px] w-[162px] rounded-md'
    : 'h-[192px] w-[192px] rounded-full'
  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-2xl bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-[13.5px] font-bold">Cắt khung {r.label.toLowerCase()} <span className="font-normal text-muted">· {r.px}</span></p>
        <button onClick={onCancel} className="text-[12px] text-muted hover:text-ink">✕</button>
      </div>
      <div className="p-5">
        <div className="relative grid h-[290px] place-items-center overflow-hidden rounded-xl border border-line bg-black">
          <div className="absolute inset-0" style={{ ...imgStyle(hue), transform: `scale(${zoom})` }} />
          <div className="absolute inset-0 bg-black/60" />
          <div className={cn('relative overflow-hidden border-2 border-white/90', frame)}>
            <div className="absolute inset-0" style={{ ...imgStyle(hue), transform: `scale(${zoom})` }} />
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand shadow" title="Focal point" />
            <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white">badge</span>
            <span className="absolute right-1 top-1 text-[11px] text-white/90">☆</span>
          </div>
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
            Kéo ảnh để chỉnh khung · chấm xanh là focal point · ảnh giữ nguyên tỉ lệ gốc, không bị bóp méo
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10.5px] text-faint">Thu phóng</span>
          <input type="range" min={100} max={200} value={zoom * 100} onChange={(e) => setZoom(Number(e.target.value) / 100)} className="h-1 flex-1 accent-brand" />
          <span className="w-[36px] text-right text-[10.5px] tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(1)} className="text-[10.5px] text-brand hover:underline">Đặt lại</button>
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
          Ô <i>badge</i> và dấu <i>☆</i> là vùng thẻ tự vẽ đè lên — đừng để chủ thể nằm dưới đó.
        </p>
      </div>
      <div className="mt-auto flex justify-end gap-2 border-t border-line px-5 py-3">
        <button onClick={onCancel} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Huỷ</button>
        <button onClick={onDone} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Xong</button>
      </div>
    </div>
  )
}

/** Where each frame's picture came from. `derived` = cropped from the master. */
type SlotSource = null | { derived: boolean }

function CreateSetModal({ onClose }: { onClose: () => void }) {
  const [master, setMaster] = useState(false)
  const [slots, setSlots] = useState<Record<Rendition, SlotSource>>({ landscape: null, portrait: null, circle: null })
  const [cropping, setCropping] = useState<Rendition | null>(null)
  const [title, setTitle] = useState('')
  /* The generic name a blank field falls back to. Read off the library size so it
     is stable and non-colliding; shown as the placeholder so it is a visible
     default rather than a surprise after saving. */
  const autoName = `Hình ${ARTWORK_SETS.length + 1}`
  const [tags, setTags] = useState<string[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [expires, setExpires] = useState('')
  const hue = 212

  /* Dropping a master fills every EMPTY frame by cropping it. Frames that
     already carry their own file are left alone — re-cropping over a deliberate
     upload is the one thing that would make this screen untrustworthy. */
  const dropMaster = () => {
    setMaster(true)
    setSlots((p) => ({
      landscape: p.landscape ?? { derived: true },
      portrait: p.portrait ?? { derived: true },
      circle: p.circle ?? { derived: true },
    }))
  }
  const clearMaster = () => {
    setMaster(false)
    setSlots((p) => ({
      landscape: p.landscape?.derived ? null : p.landscape,
      portrait: p.portrait?.derived ? null : p.portrait,
      circle: p.circle?.derived ? null : p.circle,
    }))
  }
  const setSlot = (r: Rendition, v: SlotSource) => setSlots((p) => ({ ...p, [r]: v }))

  const count = RENDITIONS.filter((r) => slots[r.key]).length
  const suggested = suggestIndustries(tags)
  /* Industry is the ONLY gate. A stock pack of forty pictures never gets forty
     hand-written names, and a rule nobody can satisfy is one that gets dodged. */
  const ready = count > 0 && industries.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="relative my-4 w-full max-w-[760px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Tạo cụm ảnh</p>
            <p className="text-[11px] text-muted">Thả một ảnh gốc để cắt cả ba khung, hoặc tải riêng từng khung — trộn cả hai cũng được.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-5 py-4">
          {/* ① master — optional, and the fastest way to fill all three */}
          {!master ? (
            <button onClick={dropMaster} className="grid w-full place-items-center gap-0.5 rounded-xl border-2 border-dashed border-line bg-canvas/40 px-4 py-6 text-center hover:border-brand hover:bg-brand-soft/40">
              <span className="text-[19px]">🖼️</span>
              <span className="text-[12.5px] font-semibold text-ink">Thả <b>một ảnh gốc</b> — tự cắt cho cả ba khung bên dưới</span>
              <span className="text-[10.5px] text-muted">JPG · PNG · WebP, tối thiểu <b>1600 × 1200</b>. Không bắt buộc — có thể tải thẳng vào từng khung.</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2">
              <span className="h-9 w-12 shrink-0 rounded" style={imgStyle(hue)} />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-medium text-ink">engineers-workshop-04.jpg</span>
                <span className="block font-mono text-[10.5px] text-faint">3200 × 2400 · 2.1 MB</span>
              </span>
              <Pill tone="active">Đạt</Pill>
              <button onClick={clearMaster} className="shrink-0 text-[11px] text-faint hover:text-ink" title="Gỡ ảnh gốc — các khung cắt từ nó sẽ trống lại">✕</button>
            </div>
          )}

          {/* ② the three frames */}
          <div className="mb-1.5 mt-4 flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
              Ba khung <span className="ml-1 font-normal normal-case tracking-normal">— khung nào để trống cũng được</span>
            </p>
            <span className="text-[10.5px] tabular-nums text-faint">{count}/3</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {RENDITIONS.map((r) => {
              const s = slots[r.key]
              const box = r.key === 'landscape' ? 'h-[92px] w-full rounded-lg'
                : r.key === 'portrait' ? 'h-[92px] w-[69px] rounded-lg'
                : 'h-[92px] w-[92px] rounded-full'
              return (
                <div key={r.key} className="rounded-xl border border-line p-2.5">
                  <div className={cn(r.key === 'landscape' ? '' : 'flex justify-center')}>
                    {s ? (
                      /* Clicking the PICTURE opens the crop. A text link below it is
                         a second place to look for something the image already
                         affords — and on a frame you are judging by eye, the thing
                         you want to adjust is the thing you are looking at. */
                      <button
                        onClick={() => setCropping(r.key)}
                        title={`Bấm để cắt khung ${r.label.toLowerCase()}`}
                        className={cn('group relative block overflow-hidden border border-line', box)}
                        style={imgStyle(hue)}
                      >
                        <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white">badge</span>
                        <span className="absolute right-1 top-1 text-[11px] text-white/90">☆</span>
                        {s.derived && <span className="absolute bottom-0 right-0 bg-black/45 px-1 text-[9px] text-white" title="Cắt từ ảnh gốc">✂</span>}
                        <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-ink">✂ Cắt</span>
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSlot(r.key, { derived: false })}
                        className={cn('grid place-items-center gap-0.5 border-2 border-dashed border-line bg-canvas/40 text-center hover:border-brand', box)}
                      >
                        <span className="text-[15px] leading-none">＋</span>
                        <span className="px-1 text-[10px] font-medium text-ink">Tải ảnh {r.label.toLowerCase()}</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10.5px] font-medium text-ink">{r.label} · {r.px}</p>
                  <p className="text-[10px] leading-snug text-faint">{r.where}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[10.5px]">
                    {s ? (
                      <>
                        <span className="text-faint">Bấm ảnh để cắt</span>
                        <span className="text-faint">·</span>
                        <button onClick={() => setSlot(r.key, { derived: false })} className="text-brand hover:underline">Thay tệp</button>
                        <span className="text-faint">·</span>
                        <button onClick={() => setSlot(r.key, null)} className="text-faint hover:text-ink">Bỏ trống</button>
                      </>
                    ) : master ? (
                      <button onClick={() => { setSlot(r.key, { derived: true }); setCropping(r.key) }} className="font-medium text-brand hover:underline">Cắt từ ảnh gốc</button>
                    ) : (
                      <span className="text-faint">Chưa có ảnh</span>
                    )}
                  </p>
                  {s && <p className="mt-0.5 text-[9.5px] text-faint">{s.derived ? '✂ cắt từ ảnh gốc' : 'tệp riêng'}</p>}
                </div>
              )
            })}
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
            Ảnh <b>tròn</b> cắt sẵn từ khung <b>dọc</b> theo cùng focal point, nên thường chỉ cần một lần tải lên.
            Khung để trống thì cụm vẫn tạo được, nhưng <b className="text-amber-700">cụm thiếu không bao giờ được chọn làm ảnh tự điền</b>.
          </p>

          {/* ③ classification — same screen, no second step */}
          <div className="mt-5 border-t border-line pt-4">
            <div className="grid grid-cols-[1fr_150px] gap-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">Tên cụm <span className="ml-1 font-normal normal-case tracking-normal">— không bắt buộc</span></p>
                {/* Nobody names forty stock pictures, so a blank name is filled in
                    rather than refused — and the generated name is SHOWN as the
                    placeholder, so it is a default the operator can see and accept
                    rather than something that appears after saving. */}
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={autoName} className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] outline-none focus:border-brand" />
                <p className="mt-0.5 text-[9.5px] text-faint">Để trống thì hệ thống đặt là <b className="text-ink/70">{autoName}</b>.</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">Hết hạn</p>
                <input value={expires} onChange={(e) => setExpires(e.target.value)} placeholder="dd/mm/yyyy" className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] outline-none focus:border-brand" />
              </div>
            </div>

            <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-faint">
              Tag <span className="ml-1 font-normal normal-case tracking-normal">— không bắt buộc, gõ để tạo mới</span>
            </p>
            <TagField value={tags} onChange={setTags} />

            <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-faint">
              Ngành <span className="text-rose-500">*</span> <span className="ml-1 font-normal normal-case tracking-normal">— bắt buộc. Chọn ở bất kỳ cấp nào</span>
            </p>
            {suggested.length > 0 && industries.length === 0 && (
              <p className="mb-1.5 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11px] text-brand">
                Từ tag đã chọn, đề xuất: <b>{suggested.map(industryName).join(' · ')}</b>
                <button onClick={() => setIndustries(suggested)} className="ml-2 font-semibold underline">Nhận tất cả</button>
              </p>
            )}
            {/* No "Mọi ngành" here. Industry is the one required field, and an
                escape hatch next to it is the thing people click to get past a
                required field. A genuinely neutral set is still possible — flag it
                on the set afterwards, in the detail view, as a deliberate edit. */}
            <IndustryTreePicker value={industries} onChange={setIndustries} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <span className="text-[11px] text-faint">
            {count === 0 ? 'Chưa có khung nào' : `${count}/3 khung`}
            {count > 0 && count < 3 && <span className="text-amber-700"> · cụm thiếu, không dùng làm ảnh tự điền</span>}
            {count > 0 && industries.length === 0 && <span className="text-amber-700"> · chưa chọn ngành</span>}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Huỷ</button>
            <button disabled={!ready} onClick={onClose} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Tạo cụm</button>
          </div>
        </div>

        {cropping && (
          <CropOverlay
            format={cropping}
            hue={hue}
            onDone={() => { setSlot(cropping, { derived: true }); setCropping(null) }}
            onCancel={() => setCropping(null)}
          />
        )}
      </div>
    </div>
  )
}
