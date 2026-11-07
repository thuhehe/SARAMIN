import { useContext, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { RENDITIONS, imgStyle } from '@/pages/admin/data/products'
import type { Rendition } from '@/pages/admin/data/products'
import { industryLevel, industryName, industryPath } from '@/pages/admin/data/industries'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { IndustryTreePicker } from '@/pages/admin/ui/industryPicker'
import { TagField, TagManager } from '@/pages/admin/ui/tagField'

/* ── Bulk entry ───────────────────────────────────────────────────────────────
   A spreadsheet in the admin, with MERGED CELLS — one block per image set.

   The first grid was one flat row per image, which made the set-level fields
   (name, industry, tags, expiry) repeat on every row of a set. Three copies of
   one value is three chances for them to disagree, and the import then has to
   resolve a conflict the grid should never have allowed. So the set is the block
   and those fields are merged down it, exactly as they would be in Excel.

   FORMAT IS NO LONGER A CHOICE. Each block has three fixed slots — ngang · dọc ·
   tròn — so the row IS the format and the cell only states it. Dropping a file
   into a slot shows it AT THAT SHAPE, which is what tells the operator at a
   glance whether the set is complete and whether a picture landed in the wrong
   frame. */

type ImgSet = {
  name: string
  industries: string[]
  tags: string[]
  expiry: string
  imgs: Partial<Record<Rendition, string>>
}
/** the columns that belong to the SET, not to one picture — the merged ones */
type SetCol = 'name' | 'industries' | 'tags' | 'expiry'

const W = {
  idx: 'w-[30px]', name: 'w-[150px]', fmt: 'w-[104px]',
  ind: 'w-[230px]', tags: 'w-[186px]', exp: 'w-[98px]', del: 'w-[26px]',
}
/** the slot preview, drawn at the real aspect so the shape itself names the format */
const SHAPE: Record<Rendition, string> = {
  landscape: 'h-[46px] w-[82px] rounded',
  portrait: 'h-[58px] w-[44px] rounded',
  circle: 'h-[54px] w-[54px] rounded-full',
}
const blankSet = (): ImgSet => ({ name: '', industries: [], tags: [], expiry: '', imgs: {} })

const SEED: ImgSet[] = [
  { name: 'Văn phòng HN', industries: ['it-sw', 'fin'], tags: ['t-office', 't-people'], expiry: '31/12/2027',
    imgs: { landscape: 'office-hn-01.jpg', portrait: 'office-hn-02.jpg', circle: 'office-hn-03.jpg' } },
  { name: 'Kho Bình Dương', industries: ['log-wh'], tags: ['t-wh'], expiry: '',
    imgs: { landscape: 'kho-bd-01.jpg', portrait: 'kho-bd-02.jpg' } },
  { name: 'Spa Quận 1', industries: [], tags: [], expiry: '',
    imgs: { landscape: 'spa-q1-01.jpg' } },
  blankSet(),
]

type SetError = { col: SetCol | 'imgs'; msg: string }
const isBlankSet = (s: ImgSet) =>
  !s.name.trim() && !s.industries.length && !s.tags.length && !s.expiry.trim() && !Object.keys(s.imgs).length

function setError(s: ImgSet, i: number, all: ImgSet[]): SetError | null {
  if (isBlankSet(s)) return null
  if (!Object.keys(s.imgs).length) return { col: 'imgs', msg: 'Chưa có ảnh nào' }
  if (!s.industries.length) return { col: 'industries', msg: 'Thiếu ngành — bắt buộc' }
  /* Set names must be UNIQUE. With the name merged down a block it is the handle
     for the whole set; two blocks sharing one is a question nobody can answer. */
  const n = s.name.trim().toLowerCase()
  if (n && all.some((o, j) => j !== i && o.name.trim().toLowerCase() === n)) return { col: 'name', msg: 'Trùng tên với cụm khác' }
  if (s.expiry.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(s.expiry.trim())) return { col: 'expiry', msg: 'Ngày phải là dd/mm/yyyy' }
  return null
}

export function AdminImageBulkImport() {
  const goto = useContext(ScreenNavCtx)
  const [sets, setSets] = useState<ImgSet[]>(SEED)
  const [sel, setSel] = useState<{ s: number; col: SetCol } | null>(null)
  const [clip, setClip] = useState<{ col: SetCol; val: string | string[] } | null>(null)
  const [picker, setPicker] = useState<number | null>(null)
  const [manageTags, setManageTags] = useState(false)
  /* Two ways to take a dropped file, chosen once for the whole session rather
     than per picture — a per-row choice would be a decision forty times over. */
  const [cropOnDrop, setCropOnDrop] = useState(false)
  const [cropping, setCropping] = useState<{ s: number; r: Rendition } | null>(null)
  const [toast, setToast] = useState('')
  const selRef = useRef(sel)
  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 3200) }
  const pick = (v: { s: number; col: SetCol } | null) => { selRef.current = v; setSel(v) }

  const patch = (i: number, p: Partial<ImgSet>) => setSets((x) => x.map((s, j) => (j === i ? { ...s, ...p } : s)))
  const dropInto = (i: number, r: Rendition, name: string) => {
    setSets((x) => x.map((s, j) => (j === i ? { ...s, imgs: { ...s.imgs, [r]: name } } : s)))
    if (cropOnDrop) setCropping({ s: i, r })
  }

  /* COPY A SET-LEVEL CELL — the Excel gesture the operator asked for. Ctrl+C /
     Ctrl+V moves one value, the ⤓ handle pushes it to every set below. Industry
     and expiry are the same across most of a batch; without this the grid is a
     form with forty identical answers typed by hand. */
  const copyCell = (i: number, col: SetCol) => {
    const v = sets[i][col]
    setClip({ col, val: Array.isArray(v) ? [...v] : v })
    say(`Đã copy ${LABEL[col]} của cụm ${i + 1}. Chọn ô khác rồi Ctrl+V, hoặc bấm ⤓ để đổ xuống tất cả.`)
  }
  const pasteCell = (i: number, col: SetCol) => {
    if (!clip || clip.col !== col) return say(`Clipboard đang giữ ${clip ? LABEL[clip.col] : 'rỗng'} — dán được vào đúng cột đó thôi.`)
    patch(i, { [col]: Array.isArray(clip.val) ? [...clip.val] : clip.val } as Partial<ImgSet>)
  }
  const fillDown = (i: number, col: SetCol) => {
    let n = 0
    setSets((x) => { const v = x[i][col]; n = x.length - i - 1; return x.map((s, j) => (j > i ? { ...s, [col]: Array.isArray(v) ? [...v] : v } : s)) })
    window.setTimeout(() => say(`Đã đổ ${LABEL[col]} xuống ${n} cụm bên dưới.`), 0)
  }
  const onCellKey = (e: React.KeyboardEvent, i: number, col: SetCol) => {
    if (!(e.ctrlKey || e.metaKey)) return
    const k = e.key.toLowerCase()
    if (k === 'c') { e.preventDefault(); copyCell(i, col) }
    if (k === 'v') { e.preventDefault(); pasteCell(i, col) }
    if (k === 'd') { e.preventDefault(); fillDown(i, col) }
  }

  const errs = sets.map((s, i) => setError(s, i, sets))
  const live = sets.filter((s) => !isBlankSet(s)).length
  const bad = errs.filter(Boolean).length
  const ok = live - bad
  const partial = sets.filter((s, i) => !isBlankSet(s) && !errs[i] && Object.keys(s.imgs).length < RENDITIONS.length).length

  /** the ⤓ handle + the copy affordances, shown on the cell that has focus */
  const CellTools = ({ i, col }: { i: number; col: SetCol }) =>
    sel?.s === i && sel.col === col ? (
      <span className="absolute -bottom-[6px] right-1 z-20 flex items-center gap-[3px] rounded-full border border-line bg-surface px-1 py-[1px] shadow-sm">
        <button onMouseDown={(e) => { e.preventDefault(); copyCell(i, col) }} title="Copy ô này (Ctrl+C)" className="text-[9px] leading-none text-muted hover:text-brand">⧉</button>
        {clip?.col === col && (
          <button onMouseDown={(e) => { e.preventDefault(); pasteCell(i, col) }} title="Dán vào ô này (Ctrl+V)" className="text-[9px] leading-none text-brand hover:opacity-70">⇲</button>
        )}
        {i < sets.length - 1 && (
          <button onMouseDown={(e) => { e.preventDefault(); fillDown(i, col) }} title="Đổ xuống tất cả cụm bên dưới (Ctrl+D)" className="text-[9px] font-bold leading-none text-brand hover:opacity-70">⤓</button>
        )}
      </span>
    ) : null

  return (
    <div>
      {/* Actions at the TOP — the operator decides to save from wherever they are
          in a long grid, and a button at the foot of forty blocks is a scroll away. */}
      <div className="sticky top-0 z-30 -mx-5 mb-2 flex flex-wrap items-center gap-2 border-b border-line bg-surface px-5 py-2">
        <span className="text-[11.5px] text-muted">
          <b className="text-ink/80 tabular-nums">{ok}</b> cụm sẵn sàng
          {bad > 0 && <span className="text-rose-700"> · <b className="tabular-nums">{bad}</b> cụm còn lỗi</span>}
          {partial > 0 && <span className="text-amber-700"> · {partial} cụm chưa đủ 3 khung</span>}
        </span>
        <label className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-canvas/50 px-2 py-1 text-[11px] text-muted">
          <input type="checkbox" checked={cropOnDrop} onChange={(e) => setCropOnDrop(e.target.checked)} className="accent-brand" />
          Thả ảnh xong mở khung cắt
          <span className="text-faint">· {cropOnDrop ? 'đang bật — cắt từng ảnh' : 'đang tắt — thả là xong'}</span>
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setManageTags(true)} className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:border-brand">Quản lý topic</button>
          <button onClick={() => goto('admin-image-gallery')} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Huỷ</button>
          <button disabled={ok === 0} onClick={() => goto('admin-image-gallery')} className="rounded-lg bg-brand px-4 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Tạo {ok} cụm</button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11px] text-muted">
        <span><kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px]">Ctrl+C</kbd> / <kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px]">Ctrl+V</kbd> copy ô ngành · topic · hạn sang cụm khác</span>
        <span><kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px]">Ctrl+D</kbd> hoặc <b className="text-brand">⤓</b> đổ ô xuống mọi cụm bên dưới</span>
        <span className="font-medium text-ink/70">Kéo ảnh thả thẳng vào ô khung — ảnh hiện đúng shape của khung đó</span>
      </div>

      {toast && <p className="mb-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11.5px] text-brand">{toast}</p>}

      <div className="overflow-hidden rounded-xl border border-line">
        {/* header */}
        <div className="flex border-b border-line bg-canvas/70 text-[10px] font-semibold uppercase tracking-wide text-muted">
          <span className={cn(W.idx, 'shrink-0 px-1 py-1.5 text-center')}>#</span>
          <span className={cn(W.name, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Image set name</span>
          <span className="min-w-0 flex-1 border-l border-line-soft px-2 py-1.5">Ảnh <span className="font-normal normal-case tracking-normal text-faint">kéo file vào từng khung</span></span>
          <span className={cn(W.fmt, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Format</span>
          <span className={cn(W.ind, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Industry <span className="text-rose-500">*</span></span>
          <span className={cn(W.tags, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Topics</span>
          <span className={cn(W.exp, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Hạn BQ</span>
          <span className={cn(W.del, 'shrink-0')} />
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          {sets.map((s, i) => {
            const err = errs[i]
            const badCol = (c: SetCol | 'imgs') => err?.col === c
            const cell = (c: SetCol, extra?: string) =>
              cn('relative shrink-0 border-l border-line-soft p-1', badCol(c) && 'bg-rose-100',
                sel?.s === i && sel.col === c && 'ring-1 ring-inset ring-brand', extra)
            return (
              <div key={i} className={cn('flex border-b border-line-soft', i % 2 === 1 && 'bg-canvas/30')}>
                <span className={cn(W.idx, 'shrink-0 pt-2 text-center text-[10px]', err ? 'font-semibold text-rose-600' : 'text-faint')}>{i + 1}</span>

                {/* MERGED — the set's name spans its three slots */}
                <span className={cell('name', W.name)} title={badCol('name') ? err!.msg : undefined}>
                  {badCol('name') && <span className="pointer-events-none absolute right-0 top-0 border-[4px] border-transparent border-r-rose-500 border-t-rose-500" />}
                  <input
                    value={s.name}
                    onChange={(e) => patch(i, { name: e.target.value })}
                    onFocus={() => pick({ s: i, col: 'name' })}
                    onKeyDown={(e) => onCellKey(e, i, 'name')}
                    placeholder="Tên cụm…"
                    className="w-full bg-transparent px-1 py-0.5 text-[11.5px] outline-none placeholder:text-faint"
                  />
                  <CellTools i={i} col="name" />
                </span>

                {/* PER-SLOT — three fixed frames; the row IS the format */}
                <span className={cn('min-w-0 flex-1 border-l border-line-soft', badCol('imgs') && 'bg-rose-100')}>
                  {RENDITIONS.map((r, k) => {
                    const file = s.imgs[r.key]
                    return (
                      <span key={r.key} className={cn('flex h-[72px] items-center gap-2 px-2', k < 2 && 'border-b border-line-soft/70')}>
                        <span
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) dropInto(i, r.key, f.name) }}
                          onClick={() => dropInto(i, r.key, `${r.key}-${i + 1}.jpg`)}
                          className={cn('grid shrink-0 cursor-pointer place-items-center border', SHAPE[r.key],
                            file ? 'border-line' : 'border-dashed border-line bg-canvas/50 hover:border-brand')}
                          style={file ? imgStyle(200 + i * 48) : undefined}
                          title={file ? `${file} — bấm để thay` : `Kéo ảnh ${r.label.toLowerCase()} vào đây`}
                        >
                          {!file && <span className="text-[13px] text-faint">＋</span>}
                        </span>
                        <span className="min-w-0 flex-1">
                          {file
                            ? <span className="block truncate font-mono text-[10px] text-muted">{file}</span>
                            : <span className="block text-[10.5px] text-faint">kéo ảnh {r.label.toLowerCase()} vào ô</span>}
                          {file && cropOnDrop && (
                            <button onClick={() => setCropping({ s: i, r: r.key })} className="text-[10px] text-brand hover:underline">Cắt lại</button>
                          )}
                          {file && <button onClick={() => patch(i, { imgs: Object.fromEntries(Object.entries(s.imgs).filter(([k2]) => k2 !== r.key)) })} className="ml-2 text-[10px] text-faint hover:text-rose-600">Gỡ</button>}
                        </span>
                      </span>
                    )
                  })}
                </span>

                {/* Format — fixed per slot, stated not chosen */}
                <span className={cn(W.fmt, 'shrink-0 border-l border-line-soft')}>
                  {RENDITIONS.map((r, k) => (
                    <span key={r.key} className={cn('flex h-[72px] flex-col justify-center px-2', k < 2 && 'border-b border-line-soft/70')}>
                      <span className="text-[11px] font-medium text-ink/75">{r.label}</span>
                      <span className="text-[9.5px] text-faint">{r.px}</span>
                    </span>
                  ))}
                </span>

                {/* MERGED — industry chips, any level, several per set */}
                <span className={cell('industries', W.ind)} title={badCol('industries') ? err!.msg : undefined}>
                  {badCol('industries') && <span className="pointer-events-none absolute right-0 top-0 border-[4px] border-transparent border-r-rose-500 border-t-rose-500" />}
                  <span
                    tabIndex={0}
                    onFocus={() => pick({ s: i, col: 'industries' })}
                    onKeyDown={(e) => onCellKey(e, i, 'industries')}
                    className="block outline-none"
                  >
                    <span className="flex flex-wrap items-center gap-1">
                      {s.industries.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-1.5 py-px text-[10px] text-brand" title={industryPath(id)}>
                          <span className="text-[8.5px] font-semibold text-brand/60">L{industryLevel(id)}</span>
                          {industryName(id)}
                          <button onClick={() => patch(i, { industries: s.industries.filter((x) => x !== id) })} className="text-brand/60 hover:text-brand">✕</button>
                        </span>
                      ))}
                      <button onClick={() => { pick({ s: i, col: 'industries' }); setPicker(picker === i ? null : i) }} className="rounded-full border border-dashed border-line px-1.5 py-px text-[10px] text-faint hover:border-brand hover:text-brand">
                        ＋ ngành
                      </button>
                    </span>
                  </span>
                  <CellTools i={i} col="industries" />
                </span>

                {/* MERGED — topics, with create-inline and a way to the manager */}
                <span className={cell('tags', W.tags)}>
                  <span tabIndex={0} onFocus={() => pick({ s: i, col: 'tags' })} onKeyDown={(e) => onCellKey(e, i, 'tags')} className="block outline-none">
                    <TagField value={s.tags} onChange={(v) => patch(i, { tags: v })} />
                  </span>
                  <CellTools i={i} col="tags" />
                </span>

                {/* MERGED — one expiry for the set */}
                <span className={cell('expiry', W.exp)} title={badCol('expiry') ? err!.msg : undefined}>
                  {badCol('expiry') && <span className="pointer-events-none absolute right-0 top-0 border-[4px] border-transparent border-r-rose-500 border-t-rose-500" />}
                  <input
                    value={s.expiry}
                    onChange={(e) => patch(i, { expiry: e.target.value })}
                    onFocus={() => pick({ s: i, col: 'expiry' })}
                    onKeyDown={(e) => onCellKey(e, i, 'expiry')}
                    placeholder="dd/mm/yyyy"
                    className="w-full bg-transparent px-1 py-0.5 text-[11px] outline-none placeholder:text-faint"
                  />
                  <CellTools i={i} col="expiry" />
                </span>

                <span className={cn(W.del, 'shrink-0 pt-2 text-center')}>
                  {!isBlankSet(s) && <button onClick={() => setSets((x) => x.filter((_, j) => j !== i))} title="Xoá cụm" className="text-[11px] text-faint hover:text-rose-600">✕</button>}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-canvas/40 px-2 py-1.5">
          <button onClick={() => setSets((x) => [...x, blankSet()])} className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] text-muted hover:border-brand">＋ cụm mới</button>
          <button onClick={() => setSets((x) => x.filter((s) => !isBlankSet(s)))} className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] text-muted hover:border-brand">Xoá cụm trống</button>
          <span className="ml-auto text-[10.5px] text-faint">Bảng tự lưu nháp — F5 không mất dữ liệu</span>
        </div>
      </div>

      {picker !== null && (
        <div className="fixed inset-0 z-40 grid place-items-start justify-center overflow-y-auto bg-black/30 p-10" onClick={() => setPicker(null)}>
          <div className="w-full max-w-[720px] rounded-xl border border-line bg-surface p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-[12.5px] font-semibold">Ngành cho cụm {picker + 1}{sets[picker].name ? ` · ${sets[picker].name}` : ''}</p>
            <IndustryTreePicker value={sets[picker].industries} onChange={(v) => patch(picker, { industries: v })} />
            <div className="mt-3 flex justify-end">
              <button onClick={() => setPicker(null)} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Xong</button>
            </div>
          </div>
        </div>
      )}

      {cropping && (
        <CropOverlay
          rendition={cropping.r}
          hue={200 + cropping.s * 48}
          onClose={() => setCropping(null)}
        />
      )}
      {manageTags && <TagManager onClose={() => setManageTags(false)} />}
    </div>
  )
}

/* The crop overlay only appears when the toggle is ON. The frame is the target
   ratio and the picture moves and scales inside it — the image is never stretched
   to fit, because a squashed face is worse than a tight crop. */
function CropOverlay({ rendition, hue, onClose }: { rendition: Rendition; hue: number; onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  const r = RENDITIONS.find((x) => x.key === rendition)!
  const frame = rendition === 'landscape' ? 'h-[146px] w-[260px] rounded-md'
    : rendition === 'portrait' ? 'h-[208px] w-[156px] rounded-md'
    : 'h-[180px] w-[180px] rounded-full'
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-6" onClick={onClose}>
      <div className="w-full max-w-[560px] rounded-2xl border border-line bg-surface p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-2 text-[13px] font-semibold">Cắt khung {r.label.toLowerCase()} · {r.px}</p>
        <div className="relative grid h-[260px] place-items-center overflow-hidden rounded-lg border border-line bg-black">
          <div className="absolute inset-0" style={{ ...imgStyle(hue), transform: `scale(${zoom})` }} />
          <div className="absolute inset-0 bg-black/60" />
          <div className={cn('relative overflow-hidden border-2 border-white/90', frame)}>
            <div className="absolute inset-0" style={{ ...imgStyle(hue), transform: `scale(${zoom})` }} />
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand" />
          </div>
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
            Kéo ảnh để chỉnh khung · ảnh giữ nguyên tỉ lệ gốc, không bị bóp méo
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10.5px] text-faint">Thu phóng</span>
          <input type="range" min={100} max={200} value={zoom * 100} onChange={(e) => setZoom(Number(e.target.value) / 100)} className="h-1 flex-1 accent-brand" />
          <span className="w-[36px] text-right text-[10.5px] tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Huỷ</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Xong</button>
        </div>
      </div>
    </div>
  )
}

const LABEL: Record<SetCol, string> = { name: 'tên cụm', industries: 'ngành', tags: 'topic', expiry: 'hạn bản quyền' }
