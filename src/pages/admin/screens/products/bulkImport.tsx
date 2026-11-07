import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { RENDITIONS, imgStyle } from '@/pages/admin/data/products'
import type { Rendition } from '@/pages/admin/data/products'
import { industryLevel, industryName, industryPath } from '@/pages/admin/data/industries'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { IndustryTreePicker } from '@/pages/admin/ui/industryPicker'
import { TagField, TagManager } from '@/pages/admin/ui/tagField'

/* ── Bulk entry ───────────────────────────────────────────────────────────────
   ONE ROW PER SET. The three formats sit SIDE BY SIDE across the row, each in
   its own column, so a set is a single line you read left to right.

   That layout removes the Format column outright: the column heading names the
   format and the slot is drawn at that shape, so there is nothing left for a
   Format cell to say. It also removes the merged-cell block of the previous
   cut — with the three pictures across rather than stacked, name · industry ·
   topics · expiry are already one-per-row and need no merging.

   What stays load-bearing: a dropped file renders AT ITS SLOT'S SHAPE, so a
   picture in the wrong frame is visible immediately; and the set-level cells can
   be copied set-to-set, because industry is a three-level pick and doing it
   forty times by hand is what sends people back to Excel. */

type ImgSet = {
  name: string
  industries: string[]
  tags: string[]
  expiry: string
  imgs: Partial<Record<Rendition, string>>
}
/** the cells worth copying between sets — the ones with real work in them */
type SetCol = 'name' | 'industries' | 'tags' | 'expiry'
const LABEL: Record<SetCol, string> = { name: 'tên cụm', industries: 'ngành', tags: 'topic', expiry: 'hạn bản quyền' }

const W = { idx: 'w-[26px]', name: 'w-[140px]', ind: 'w-[230px]', tags: 'w-[172px]', exp: 'w-[92px]', del: 'w-[26px]' }
const SLOT_W: Record<Rendition, string> = { landscape: 'w-[114px]', portrait: 'w-[88px]', circle: 'w-[88px]' }
/** the slot preview, at the real aspect — the shape itself names the format */
const SHAPE: Record<Rendition, string> = {
  landscape: 'h-[42px] w-[75px] rounded',
  portrait: 'h-[56px] w-[42px] rounded',
  circle: 'h-[50px] w-[50px] rounded-full',
}
const blankSet = (): ImgSet => ({ name: '', industries: [], tags: [], expiry: '', imgs: {} })

const SEED: ImgSet[] = [
  { name: 'Văn phòng HN', industries: ['it-sw', 'fin'], tags: ['t-office', 't-people'], expiry: '31/12/2027',
    imgs: { landscape: 'office-hn-01.jpg', portrait: 'office-hn-02.jpg', circle: 'office-hn-03.jpg' } },
  { name: 'Kho Bình Dương', industries: ['log-wh'], tags: ['t-wh'], expiry: '',
    imgs: { landscape: 'kho-bd-01.jpg', portrait: 'kho-bd-02.jpg' } },
  { name: 'Spa Quận 1', industries: [], tags: [], expiry: '', imgs: { landscape: 'spa-q1-01.jpg' } },
  blankSet(), blankSet(),
]

type SetError = { col: SetCol | 'imgs'; msg: string }
const isBlankSet = (s: ImgSet) =>
  !s.name.trim() && !s.industries.length && !s.tags.length && !s.expiry.trim() && !Object.keys(s.imgs).length

function setError(s: ImgSet, i: number, all: ImgSet[]): SetError | null {
  if (isBlankSet(s)) return null
  if (!Object.keys(s.imgs).length) return { col: 'imgs', msg: 'Chưa có ảnh nào' }
  if (!s.industries.length) return { col: 'industries', msg: 'Thiếu ngành — bắt buộc' }
  /* Set names are UNIQUE: the name is the handle for the whole set, and two sets
     sharing one is a question nobody downstream can answer. */
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
  const [addN, setAddN] = useState(10)
  /* One decision for the session, not one per picture — forty pictures would be
     the same choice forty times. */
  const [cropOnDrop, setCropOnDrop] = useState(false)
  const [cropping, setCropping] = useState<{ s: number; r: Rendition } | null>(null)
  const [toast, setToast] = useState('')
  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 3200) }

  const patch = (i: number, p: Partial<ImgSet>) => setSets((x) => x.map((s, j) => (j === i ? { ...s, ...p } : s)))
  const dropInto = (i: number, r: Rendition, name: string) => {
    setSets((x) => x.map((s, j) => (j === i ? { ...s, imgs: { ...s.imgs, [r]: name } } : s)))
    if (cropOnDrop) setCropping({ s: i, r })
  }

  const copyCell = (i: number, col: SetCol) => {
    const v = sets[i][col]
    setClip({ col, val: Array.isArray(v) ? [...v] : v })
    say(`Đã copy ${LABEL[col]} của cụm ${i + 1} — chọn ô cùng cột ở cụm khác rồi bấm Dán, hoặc Đổ xuống để áp cho tất cả.`)
  }
  const pasteCell = (i: number, col: SetCol) => {
    if (!clip || clip.col !== col) return say(`Clipboard đang giữ ${clip ? LABEL[clip.col] : 'rỗng'} — chỉ dán được vào đúng cột đó.`)
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
  const ok = sets.filter((s, i) => !isBlankSet(s) && !errs[i]).length
  /* Counted in SETS, not rows — one row IS one set here. Only two numbers are
     worth printing: what will be created, and what is blocking. A third count of
     "sets without all 3 frames" would be noise: a set missing a frame is a
     legitimate set for any package that never prints it. */
  const bad = sets.filter((s, i) => !isBlankSet(s) && errs[i]).length

  /* The copy controls are WORDS, not icons, and they appear on the focused cell.
     Nobody discovers Ctrl+C in a web grid, and a bare ⧉ is a guess — this is the
     one gesture the page lives on, so it is spelled out. */
  const CellTools = ({ i, col }: { i: number; col: SetCol }) =>
    sel?.s === i && sel.col === col ? (
      <span className="absolute -bottom-[9px] right-0 z-20 flex items-center gap-1 rounded-full border border-brand/40 bg-surface px-1.5 py-[1px] text-[9px] font-medium shadow-sm">
        <button onMouseDown={(e) => { e.preventDefault(); copyCell(i, col) }} title="Ctrl+C" className="text-muted hover:text-brand">⧉ Copy</button>
        {clip?.col === col && (
          <button onMouseDown={(e) => { e.preventDefault(); pasteCell(i, col) }} title="Ctrl+V" className="text-brand hover:opacity-70">⇲ Dán</button>
        )}
        {i < sets.length - 1 && (
          <button onMouseDown={(e) => { e.preventDefault(); fillDown(i, col) }} title="Ctrl+D" className="text-brand hover:opacity-70">⤓ Đổ xuống</button>
        )}
      </span>
    ) : null

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-5 mb-2 flex flex-wrap items-center gap-2 border-b border-line bg-surface px-5 py-2">
        <button onClick={() => goto('admin-image-gallery')} className="text-[11.5px] font-medium text-brand hover:underline">← Thư viện ảnh</button>
        <label className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-canvas/50 px-2 py-1 text-[11px] text-muted">
          <input type="checkbox" checked={cropOnDrop} onChange={(e) => setCropOnDrop(e.target.checked)} className="accent-brand" />
          Thả ảnh xong mở khung cắt
          <span className="text-faint">· {cropOnDrop ? 'đang bật' : 'đang tắt — thả là xong'}</span>
        </label>
        <div className="ml-auto flex items-center gap-2">
          {bad > 0 && <span className="text-[11.5px] font-medium text-amber-700">{bad} cụm còn lỗi</span>}
          <button onClick={() => setManageTags(true)} className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:border-brand">Quản lý topic</button>
          <button onClick={() => goto('admin-image-gallery')} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Huỷ</button>
          <button disabled={ok === 0} onClick={() => goto('admin-image-gallery')} className="rounded-lg bg-brand px-4 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Tạo {ok} cụm</button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-brand/25 bg-brand-soft/40 px-3 py-2 text-[11px] text-brand">
        <span className="font-semibold">Copy nhanh giữa các cụm:</span>
        <span>bấm vào ô <b>ngành · topic · hạn</b> → hiện <b>⧉ Copy</b> · <b>⇲ Dán</b> · <b>⤓ Đổ xuống</b></span>
        <span>hoặc <kbd className="rounded border border-brand/30 bg-surface px-1 font-mono text-[10px]">Ctrl+C</kbd> <kbd className="rounded border border-brand/30 bg-surface px-1 font-mono text-[10px]">Ctrl+V</kbd> <kbd className="rounded border border-brand/30 bg-surface px-1 font-mono text-[10px]">Ctrl+D</kbd></span>
      </div>

      {toast && <p className="mb-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11.5px] text-brand">{toast}</p>}

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="flex border-b border-line bg-canvas/70 text-[10px] font-semibold uppercase tracking-wide text-muted">
          <span className={cn(W.idx, 'shrink-0 px-1 py-1.5 text-center')}>#</span>
          <span className={cn(W.name, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Image set name</span>
          {/* The heading names the format; the slot is drawn at that shape. There
              is nothing a separate Format column could add. */}
          {RENDITIONS.map((r) => (
            <span key={r.key} className={cn(SLOT_W[r.key], 'shrink-0 border-l border-line-soft px-2 py-1.5')}>
              {r.label}
              <span className="block font-normal normal-case tracking-normal text-faint">{r.px}</span>
            </span>
          ))}
          <span className={cn(W.ind, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Industry <span className="text-rose-500">*</span></span>
          <span className={cn(W.tags, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Topics</span>
          <span className={cn(W.exp, 'shrink-0 border-l border-line-soft px-2 py-1.5')}>Hạn BQ</span>
          <span className={cn(W.del, 'shrink-0')} />
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          {sets.map((s, i) => {
            const err = errs[i]
            const bad = (c: SetCol | 'imgs') => err?.col === c
            const cellCls = (c: SetCol, w: string) =>
              cn('relative shrink-0 border-l border-line-soft p-1', w, bad(c) && 'bg-rose-100',
                sel?.s === i && sel.col === c && 'ring-1 ring-inset ring-brand')
            const corner = (c: SetCol) => bad(c) && <span className="pointer-events-none absolute right-0 top-0 border-[4px] border-transparent border-r-rose-500 border-t-rose-500" />
            return (
              <div key={i} className={cn('flex items-stretch border-b border-line-soft', i % 2 === 1 && 'bg-canvas/30')}>
                <span className={cn(W.idx, 'shrink-0 pt-2 text-center text-[10px]', err ? 'font-semibold text-rose-600' : 'text-faint')}>{i + 1}</span>

                <span className={cellCls('name', W.name)} title={bad('name') ? err!.msg : undefined}>
                  {corner('name')}
                  <input
                    value={s.name}
                    onChange={(e) => patch(i, { name: e.target.value })}
                    onFocus={() => setSel({ s: i, col: 'name' })}
                    onClick={() => setSel({ s: i, col: 'name' })}
                    onKeyDown={(e) => onCellKey(e, i, 'name')}
                    placeholder="Tên cụm…"
                    className="w-full bg-transparent px-1 py-0.5 text-[11.5px] outline-none placeholder:text-faint"
                  />
                  <CellTools i={i} col="name" />
                </span>

                {/* The three formats ACROSS, one column each */}
                {RENDITIONS.map((r) => {
                  const file = s.imgs[r.key]
                  return (
                    <span key={r.key} className={cn(SLOT_W[r.key], 'shrink-0 border-l border-line-soft px-1 py-1.5', bad('imgs') && 'bg-rose-100')}>
                      <span className="flex flex-col items-center gap-0.5">
                        <span
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) dropInto(i, r.key, f.name) }}
                          onClick={() => dropInto(i, r.key, `${r.key}-${i + 1}.jpg`)}
                          className={cn('grid cursor-pointer place-items-center border', SHAPE[r.key],
                            file ? 'border-line' : 'border-dashed border-line bg-canvas/50 hover:border-brand')}
                          style={file ? imgStyle(200 + i * 46) : undefined}
                          title={file ? `${file} — bấm để thay` : `Kéo ảnh ${r.label.toLowerCase()} vào đây`}
                        >
                          {!file && <span className="text-[12px] text-faint">＋</span>}
                        </span>
                        {file ? (
                          <span className="flex items-center gap-1 text-[9px]">
                            {cropOnDrop && <button onClick={() => setCropping({ s: i, r: r.key })} className="text-brand hover:underline">Cắt</button>}
                            <button onClick={() => patch(i, { imgs: Object.fromEntries(Object.entries(s.imgs).filter(([k]) => k !== r.key)) })} className="text-faint hover:text-rose-600">Gỡ</button>
                          </span>
                        ) : (
                          <span className="text-[9px] text-faint">kéo vào</span>
                        )}
                      </span>
                    </span>
                  )
                })}

                <span className={cellCls('industries', W.ind)} title={bad('industries') ? err!.msg : undefined}>
                  {corner('industries')}
                  <span tabIndex={0} onFocus={() => setSel({ s: i, col: 'industries' })} onClick={() => setSel({ s: i, col: 'industries' })} onKeyDown={(e) => onCellKey(e, i, 'industries')} className="block outline-none">
                    <span className="flex flex-wrap items-center gap-1">
                      {s.industries.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-1.5 py-px text-[10px] text-brand" title={industryPath(id)}>
                          <span className="text-[8.5px] font-semibold text-brand/60">L{industryLevel(id)}</span>
                          {industryName(id)}
                          <button onClick={() => patch(i, { industries: s.industries.filter((x) => x !== id) })} className="text-brand/60 hover:text-brand">✕</button>
                        </span>
                      ))}
                      <button onClick={() => { setSel({ s: i, col: 'industries' }); setPicker(picker === i ? null : i) }} className="rounded-full border border-dashed border-line px-1.5 py-px text-[10px] text-faint hover:border-brand hover:text-brand">＋ ngành</button>
                    </span>
                  </span>
                  <CellTools i={i} col="industries" />
                </span>

                <span className={cellCls('tags', W.tags)}>
                  <span tabIndex={0} onFocus={() => setSel({ s: i, col: 'tags' })} onClick={() => setSel({ s: i, col: 'tags' })} onKeyDown={(e) => onCellKey(e, i, 'tags')} className="block outline-none">
                    <TagField value={s.tags} onChange={(v) => patch(i, { tags: v })} />
                  </span>
                  <CellTools i={i} col="tags" />
                </span>

                <span className={cellCls('expiry', W.exp)} title={bad('expiry') ? err!.msg : undefined}>
                  {corner('expiry')}
                  <input
                    value={s.expiry}
                    onChange={(e) => patch(i, { expiry: e.target.value })}
                    onFocus={() => setSel({ s: i, col: 'expiry' })}
                    onClick={() => setSel({ s: i, col: 'expiry' })}
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
          {/* A pack is forty pictures, so the useful action is "give me a screenful
              of empty sets", with the count editable rather than guessed for them. */}
          <button onClick={() => setSets((x) => [...x, ...Array.from({ length: Math.max(1, addN) }, blankSet)])} className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] text-muted hover:border-brand">
            ＋ thêm
          </button>
          <input
            type="number"
            min={1}
            max={100}
            value={addN}
            onChange={(e) => setAddN(Number(e.target.value))}
            className="w-[46px] rounded border border-line bg-surface px-1 py-0.5 text-center text-[11px] outline-none focus:border-brand"
          />
          <span className="text-[11px] text-muted">cụm trống</span>
          <span className="ml-auto text-[10.5px] text-faint">Bảng tự lưu nháp — F5 không mất dữ liệu</span>
        </div>
      </div>

      {picker !== null && (
        <div className="fixed inset-0 z-40 grid place-items-start justify-center overflow-y-auto bg-black/30 p-10" onClick={() => setPicker(null)}>
          <div className="w-full max-w-[720px] rounded-xl border border-line bg-surface p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-[12.5px] font-semibold">Ngành cho cụm {picker + 1}{sets[picker].name ? ` · ${sets[picker].name}` : ''}</p>
            <IndustryTreePicker value={sets[picker].industries} onChange={(v) => patch(picker, { industries: v })} />
            <p className="mt-2 text-[10.5px] text-faint">Chọn xong, muốn áp cho cả lô thì bấm <b className="text-brand">⤓ Đổ xuống</b> ở ô ngành.</p>
            <div className="mt-3 flex justify-end">
              <button onClick={() => setPicker(null)} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Xong</button>
            </div>
          </div>
        </div>
      )}

      {cropping && <CropOverlay rendition={cropping.r} hue={200 + cropping.s * 46} onClose={() => setCropping(null)} />}
      {manageTags && <TagManager onClose={() => setManageTags(false)} />}
    </div>
  )
}

/* Only reachable with the toggle on. The frame carries the target ratio and the
   picture moves and scales inside it at its own aspect — never stretched to fit,
   because a squashed face is worse than a tight crop and nobody notices it until
   it is on the homepage. */
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
