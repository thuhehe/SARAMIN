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

/* ── Tag field ────────────────────────────────────────────────────────────────
   Tags are NOT a closed master list: HQ types a new one and it exists. That is
   deliberate — the taxonomy that must hold still is INDUSTRY, and forcing every
   loose label ("tết", "nữ giới", "ngoài trời") through a master-data release is
   how tagging quietly stops happening.

   Creating from the field itself, rather than from a separate admin screen, is
   the whole difference: the moment you need a tag is WHILE classifying a picture,
   not before. */
function TagField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const hits = TAGS.filter((t) => !value.includes(t.id) && t.name.toLowerCase().includes(q.trim().toLowerCase()))
  const exact = TAGS.find((t) => t.name.toLowerCase() === q.trim().toLowerCase())
  const canCreate = q.trim() !== '' && !exact
  const add = (id: string) => { onChange([...value, id]); setQ(''); setOpen(false) }
  const create = () => {
    const id = 't-' + Date.now().toString(36)
    TAGS.push({ id, name: q.trim() })   // wireframe only; a real build POSTs /admin/artwork-tags
    add(id)
  }
  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5">
        {value.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] text-muted">
            {tagName(id)}
            <button onClick={() => onChange(value.filter((x) => x !== id))} className="text-faint hover:text-ink">✕</button>
          </span>
        ))}
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (hits[0] && !canCreate) add(hits[0].id); else if (canCreate) create() }
            if (e.key === 'Backspace' && q === '' && value.length) onChange(value.slice(0, -1))
          }}
          placeholder={value.length ? 'thêm tag…' : 'Gõ để tìm hoặc tạo tag mới…'}
          className="min-w-[150px] flex-1 bg-transparent py-0.5 text-[11.5px] outline-none placeholder:text-faint"
        />
      </div>
      {open && (q.trim() !== '' || hits.length > 0) && (
        <div className="absolute z-30 mt-1 max-h-[180px] w-full overflow-y-auto rounded-lg border border-line bg-surface shadow-lg">
          {canCreate && (
            <button onMouseDown={(e) => { e.preventDefault(); create() }} className="flex w-full items-center gap-1.5 border-b border-line-soft px-2.5 py-1.5 text-left text-[11.5px] font-medium text-brand hover:bg-brand-soft">
              ＋ Tạo tag “{q.trim()}”
            </button>
          )}
          {hits.map((t) => (
            <button key={t.id} onMouseDown={(e) => { e.preventDefault(); add(t.id) }} className="block w-full px-2.5 py-1.5 text-left text-[11.5px] text-ink/85 hover:bg-canvas">{t.name}</button>
          ))}
          {hits.length === 0 && !canCreate && <p className="px-2.5 py-1.5 text-[11px] text-faint">Không có tag nào khớp.</p>}
        </div>
      )}
    </div>
  )
}

/* ── Tag manager ──────────────────────────────────────────────────────────────
   Rename and delete, because a tag list nobody can tidy becomes forty near-
   duplicates within a quarter. Deleting a tag detaches it from every set and
   never deletes a set: losing a label is not a reason to lose a photograph. */
function TagManager({ onClose }: { onClose: () => void }) {
  const [, force] = useState(0)
  const [newName, setNewName] = useState('')
  const usage = (id: string) => ARTWORK_SETS.filter((s) => !s.archived && s.tags.includes(id)).length
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={onClose}>
      <div className="my-4 w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Quản lý tag</p>
            <p className="text-[11px] text-muted">HQ tự tạo, sửa tên và xoá — không cần phát hành master data.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="p-5">
          <div className="mb-3 flex gap-1.5">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên tag mới…" className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] outline-none focus:border-brand" />
            <button
              disabled={!newName.trim()}
              onClick={() => { TAGS.push({ id: 't-' + Date.now().toString(36), name: newName.trim() }); setNewName(''); force((n) => n + 1) }}
              className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >＋ Tạo</button>
          </div>
          <div className="max-h-[300px] overflow-y-auto rounded-lg border border-line">
            {TAGS.map((t) => (
              <div key={t.id} className="flex items-center gap-2 border-b border-line-soft px-2.5 py-1.5 last:border-b-0">
                <input
                  defaultValue={t.name}
                  onBlur={(e) => { t.name = e.target.value.trim() || t.name; force((n) => n + 1) }}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[11.5px] text-ink outline-none hover:border-line focus:border-brand"
                />
                <span className="shrink-0 text-[10px] text-faint">{usage(t.id)} cụm</span>
                <button
                  onClick={() => {
                    const n = usage(t.id)
                    if (n === 0 || confirm(`Xoá tag “${t.name}”? ${n} cụm đang gắn sẽ bị gỡ nhãn — ảnh vẫn giữ nguyên.`)) {
                      ARTWORK_SETS.forEach((s) => { s.tags = s.tags.filter((x) => x !== t.id) })
                      TAGS.splice(TAGS.findIndex((x) => x.id === t.id), 1)
                      force((k) => k + 1)
                    }
                  }}
                  className="shrink-0 text-[11px] text-faint hover:text-rose-600"
                >Xoá</button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
            Đổi tên áp dụng ngay cho mọi cụm đang gắn. Xoá thì <b>chỉ gỡ nhãn</b> — không cụm ảnh nào bị xoá theo.
          </p>
        </div>
      </div>
    </div>
  )
}

export function AdminImageGallery() {
  const goto = useContext(ScreenNavCtx)
  const [group, setGroup] = useState('')
  const [tag, setTag] = useState('')
  const [fit, setFit] = useState<'' | 'complete' | 'partial'>('')
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
    .filter((s) => !fit || (fit === 'complete' ? isComplete(s) : !isComplete(s)))
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
        <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', fit ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
          <span className={fit ? 'text-brand/70' : 'text-faint'}>Phiên bản</span>
          <select value={fit} onChange={(e) => setFit(e.target.value as typeof fit)} className={cn('cursor-pointer bg-transparent text-[11.5px] outline-none', fit ? 'font-medium text-brand' : 'text-ink')}>
            <option value="">Tất cả</option>
            <option value="complete">Đủ cả 3</option>
            <option value="partial">Còn thiếu</option>
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
   TWO ROUTES, named at the top instead of discovered:

     ① one master → crop three frames    the normal case, ONE upload
     ② upload each frame separately      three different shots, or a crop that
                                         genuinely cannot work

   Naming both routes up front is the difference between a tool and a workaround:
   a quiet "upload your own file" link per frame reads as error recovery. */
type Mode = 'crop' | 'files'

/** The crop stage: the master fills the frame, a scrim darkens everything outside
    it, so what is KEPT and what is thrown away are visible at the same time. */
function CropStage({ active, hue, zoom, setZoom }: { active: Rendition; hue: number; zoom: number; setZoom: (n: number) => void }) {
  const frame = active === 'landscape' ? 'h-[146px] w-[260px] rounded-md' : active === 'portrait' ? 'h-[208px] w-[156px] rounded-md' : 'h-[186px] w-[186px] rounded-full'
  return (
    <div>
      <div className="relative grid h-[272px] place-items-center overflow-hidden rounded-xl border border-line bg-black">
        <div className="absolute inset-0" style={{ ...imgStyle(hue), transform: `scale(${zoom})` }} />
        <div className="absolute inset-0 bg-black/60" />
        <div className={cn('relative overflow-hidden border-2 border-white/90', frame)}>
          <div className="absolute inset-0" style={{ ...imgStyle(hue), transform: `scale(${zoom})` }} />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand shadow" title="Focal point" />
          <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white">badge</span>
          <span className="absolute right-1 top-1 text-[11px] text-white/90">☆</span>
        </div>
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
          Kéo ảnh để chỉnh khung · chấm xanh là focal point
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10.5px] text-faint">Thu phóng</span>
        <input type="range" min={100} max={200} value={zoom * 100} onChange={(e) => setZoom(Number(e.target.value) / 100)} className="h-1 flex-1 accent-brand" />
        <span className="w-[36px] text-right text-[10.5px] tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(1)} className="text-[10.5px] text-brand hover:underline">Đặt lại</button>
      </div>
    </div>
  )
}

function CreateSetModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [mode, setMode] = useState<Mode>('crop')
  const [dropped, setDropped] = useState(false)
  const [active, setActive] = useState<Rendition>('landscape')
  const [zoom, setZoom] = useState(1)
  const [skip, setSkip] = useState<Rendition[]>([])
  /* mode ② — each frame is its own file, so each carries its own filled state */
  const [files, setFiles] = useState<Partial<Record<Rendition, boolean>>>({})
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [any, setAny] = useState(false)
  const [expires, setExpires] = useState('')
  const hue = 212

  const have = (r: Rendition) => (mode === 'crop' ? dropped && !skip.includes(r) : !!files[r])
  const count = RENDITIONS.filter((r) => have(r.key)).length
  const suggested = suggestIndustries(tags)
  /* Industry is the ONLY gate. Name, tag and expiry are optional by design — a
     stock pack of forty pictures never gets forty hand-written names, and a rule
     nobody can satisfy is a rule that gets worked around. */
  const ready = count > 0 && (any || industries.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[800px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Tạo cụm ảnh</p>
            <p className="text-[11px] text-muted">
              <span className={cn(step === 1 ? 'font-semibold text-brand' : '')}>1 · Ảnh &amp; ba khung</span>
              <span className="mx-1.5 text-faint">→</span>
              <span className={cn(step === 2 ? 'font-semibold text-brand' : '')}>2 · Phân loại cụm</span>
            </p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        {step === 1 ? (
          <div className="p-5">
            <div className="mb-3 grid grid-cols-2 gap-2">
              {([
                ['crop', '① Một ảnh gốc → cắt 3 khung', 'Tải một ảnh ≥1600×1200 rồi kéo khung cho từng tỉ lệ. Cùng một cảnh ở cả ba khung.'],
                ['files', '② Tải riêng từng khung', 'Ba tệp đã cắt sẵn, hoặc ba góc chụp khác nhau. Dùng khi cắt từ một ảnh không ra.'],
              ] as const).map(([k, t, hint]) => (
                <button key={k} onClick={() => setMode(k)} className={cn('rounded-xl border p-3 text-left', mode === k ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-ink/30')}>
                  <span className={cn('block text-[12.5px] font-semibold', mode === k ? 'text-brand' : 'text-ink')}>{t}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">{hint}</span>
                </button>
              ))}
            </div>

            {mode === 'crop' ? (
              !dropped ? (
                <button onClick={() => setDropped(true)} className="grid w-full place-items-center gap-1 rounded-xl border-2 border-dashed border-line bg-canvas/40 px-4 py-10 text-center hover:border-brand hover:bg-brand-soft/40">
                  <span className="text-[22px]">🖼️</span>
                  <span className="text-[13px] font-semibold text-ink">Kéo thả <b>một ảnh gốc</b> vào đây</span>
                  <span className="text-[11px] text-muted">JPG · PNG · WebP — tối thiểu <b>1600 × 1200</b>, đủ để cắt cả 16:9, 3:4 và 1:1</span>
                </button>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-line px-2.5 py-2">
                    <span className="h-9 w-12 shrink-0 rounded" style={imgStyle(hue)} />
                    <span className="min-w-0 flex-1">
                      <span className="block px-1 text-[12.5px] font-medium text-ink">engineers-workshop-04.jpg</span>
                      <span className="block px-1 font-mono text-[10.5px] text-faint">3200×2400 · 2.1 MB</span>
                    </span>
                    <Pill tone="active">Đạt</Pill>
                    <button onClick={() => { setDropped(false); setSkip([]) }} className="shrink-0 text-[11px] text-faint hover:text-ink">✕</button>
                  </div>

                  <div className="grid grid-cols-[1fr_190px] gap-4">
                    <CropStage active={active} hue={hue} zoom={zoom} setZoom={setZoom} />
                    <div>
                      <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Khung đang cắt</p>
                      <div className="space-y-1.5">
                        {RENDITIONS.map((r) => {
                          const off = skip.includes(r.key)
                          const thumb = r.key === 'landscape' ? 'h-[27px] w-[48px] rounded' : r.key === 'portrait' ? 'h-[36px] w-[27px] rounded' : 'h-[32px] w-[32px] rounded-full'
                          return (
                            <div key={r.key} className={cn('rounded-lg border p-1.5', active === r.key ? 'border-brand bg-brand-soft/50' : 'border-line')}>
                              <button onClick={() => setActive(r.key)} className="flex w-full items-center gap-2 text-left">
                                <span className={cn('shrink-0 border border-line', thumb, off && 'opacity-25')} style={imgStyle(hue)} />
                                <span className="min-w-0 flex-1">
                                  <span className={cn('block text-[11px] font-medium', active === r.key ? 'text-brand' : 'text-ink')}>{r.label}</span>
                                  <span className="block text-[9.5px] text-faint">{r.px}</span>
                                </span>
                                {off && <span className="shrink-0 text-[9px] text-amber-700">bỏ trống</span>}
                              </button>
                              <div className="mt-1 flex gap-1.5 text-[10px]">
                                <button className="text-brand hover:underline">Tệp riêng</button>
                                <span className="text-faint">·</span>
                                <button onClick={() => setSkip((p) => (off ? p.filter((x) => x !== r.key) : [...p, r.key]))} className={cn('hover:underline', off ? 'font-medium text-brand' : 'text-faint')}>
                                  {off ? 'Thêm lại' : 'Bỏ trống'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-[10px] leading-relaxed text-faint">
                        Ảnh <b>tròn</b> mặc định cắt từ khung <b>dọc</b> theo cùng focal point — gần như không bao giờ phải tải tệp thứ ba.
                      </p>
                    </div>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {RENDITIONS.map((r) => {
                    const on = !!files[r.key]
                    return (
                      <div key={r.key}>
                        <button
                          onClick={() => setFiles((p) => ({ ...p, [r.key]: !p[r.key] }))}
                          className={cn('grid h-[104px] w-full place-items-center gap-0.5 rounded-lg border-2 border-dashed px-2 text-center', on ? 'border-brand' : 'border-line bg-canvas/40 hover:border-brand')}
                          style={on ? imgStyle(hue) : undefined}
                        >
                          {on ? (
                            <span className="rounded bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">{r.key}-04.jpg</span>
                          ) : (
                            <>
                              <span className="text-[17px]">＋</span>
                              <span className="text-[11px] font-semibold text-ink">Tải ảnh {r.label.toLowerCase()}</span>
                              <span className="text-[10px] text-muted">{r.px} · {r.ratio}</span>
                            </>
                          )}
                        </button>
                        <p className="mt-1 text-[10.5px] font-medium text-ink">{r.label} · {r.ratio}</p>
                        <p className="text-[10px] text-faint">{r.where}</p>
                        {on && <button onClick={() => setFiles((p) => ({ ...p, [r.key]: false }))} className="mt-0.5 text-[10px] text-faint hover:text-ink">Gỡ tệp</button>}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-faint">
                  Mỗi khung một tệp, đúng tỉ lệ ghi trên ô — ở chế độ này hệ thống <b>không cắt lại</b>. Khung nào để trống
                  thì cụm vẫn tạo được, nhưng <b className="text-amber-700">cụm thiếu không bao giờ được chọn làm ảnh tự điền</b>.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-[1fr_170px] gap-4">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                  Tên cụm <span className="ml-1 font-normal normal-case tracking-normal text-faint">— không bắt buộc</span>
                </p>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="vd. Nhóm kỹ sư trong xưởng — để trống cũng được" className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] outline-none focus:border-brand" />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Hết hạn</p>
                <input value={expires} onChange={(e) => setExpires(e.target.value)} placeholder="dd/mm/yyyy" className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] outline-none focus:border-brand" />
              </div>
            </div>

            <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wide text-faint">
              Ngành <span className="text-rose-500">*</span> <span className="ml-1 font-normal normal-case tracking-normal">— bắt buộc. Chọn ở bất kỳ cấp nào</span>
            </p>
            {suggested.length > 0 && industries.length === 0 && !any && (
              <p className="mb-1.5 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11px] text-brand">
                Từ tag đã chọn, đề xuất ở cấp nhóm: <b>{suggested.map(industryName).join(' · ')}</b>
                <button onClick={() => setIndustries(suggested)} className="ml-2 font-semibold underline">Nhận tất cả</button>
              </p>
            )}
            <label className={cn('mb-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px]', any ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted')}>
              <input type="checkbox" checked={any} onChange={(e) => setAny(e.target.checked)} className="accent-current" />
              Mọi ngành (ảnh trung tính — dùng làm dự phòng)
            </label>
            <div className={cn(any && 'pointer-events-none opacity-40')}>
              <IndustryTreePicker value={industries} onChange={setIndustries} />
            </div>

            <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wide text-faint">
              Tag <span className="ml-1 font-normal normal-case tracking-normal">— không bắt buộc, gõ để tạo mới</span>
            </p>
            <TagField value={tags} onChange={setTags} />
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
              Chỉ <b>Ngành</b> là bắt buộc. Tên, tag và hạn bản quyền để trống được — một lô stock bốn mươi ảnh không ai
              ngồi đặt tên từng tấm, và một quy tắc không ai theo nổi là quy tắc sẽ bị lách.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <span className="text-[11px] text-faint">
            {count === 0 ? 'Chưa có khung nào' : `${count}/3 phiên bản`}
            {count > 0 && count < 3 && <span className="text-amber-700"> · cụm thiếu, không được dùng làm ảnh tự điền</span>}
          </span>
          <div className="flex gap-2">
            <button onClick={step === 1 ? onClose : () => setStep(1)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">
              {step === 1 ? 'Huỷ' : '← Quay lại'}
            </button>
            {step === 1 ? (
              <button disabled={count === 0} onClick={() => setStep(2)} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Tiếp tục · phân loại →</button>
            ) : (
              <button disabled={!ready} onClick={onClose} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Tạo cụm</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
