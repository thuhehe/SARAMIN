import { useContext, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { RENDITIONS, TAGS } from '@/pages/admin/data/products'
import { INDUSTRY_INDEX, industryPath } from '@/pages/admin/data/industries'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { IndustryTreePicker } from '@/pages/admin/ui/industryPicker'

/* ── Bulk entry ───────────────────────────────────────────────────────────────
   A PAGE WITH A SPREADSHEET ON IT — no .xlsx anywhere.

   The previous design shipped a template, had the customer fill it in Excel and
   upload it back. Three things killed that route:
     · Drive links were the biggest single source of failure — wrong sharing
       permission, rate limits, an HTML interstitial returned instead of an image.
     · The template had to be regenerated every time industry master data moved,
       and a file already sitting in someone's inbox cannot be updated.
     · Validation happened in a separate pass, so the person fixing a cell was no
       longer looking at the sheet that produced it.

   So the sheet moves into the admin. What must survive the move is the FEEL of a
   spreadsheet, because that is the only reason the Excel detour was tolerable:
   keyboard navigation, pasting a block, filling down, and dropping files in bulk.
   Without those this is a 40-row form, and a 40-row form sends people straight
   back to Excel.

   The data shape is unchanged: ONE ROW PER IMAGE, rows sharing a Name group into
   one set. Nobody filling this in has to hold the idea of a "set" in their head —
   only "this file is the ngang one of Văn phòng HN". */

type Col = 'name' | 'img' | 'fmt' | 'industry' | 'tags' | 'expiry'
type Row = Record<Col, string>

const COLS: { key: Col; label: string; req?: boolean; hint?: string }[] = [
  { key: 'name', label: 'Name', hint: 'trùng tên = 1 cụm' },
  { key: 'img', label: 'Ảnh', req: true, hint: 'kéo file vào' },
  { key: 'fmt', label: 'Format', req: true },
  { key: 'industry', label: 'Industry', req: true, hint: 'chọn cấp bất kỳ' },
  { key: 'tags', label: 'Tags', hint: 'cách nhau dấu phẩy' },
  { key: 'expiry', label: 'Hạn bản quyền', hint: 'dd/mm/yyyy' },
]
const GRID = 'grid grid-cols-[30px_140px_180px_92px_minmax(190px,1fr)_150px_104px_28px]'
const FMTS = RENDITIONS.map((r) => r.label)
const blank = (): Row => ({ name: '', img: '', fmt: '', industry: '', tags: '', expiry: '' })
const isBlank = (r: Row) => COLS.every((c) => !r[c.key].trim())

/** A pasted or typed industry arrives as a PATH string; the grid stores the node
    id. Anything that does not resolve is kept verbatim so the cell can show what
    the person actually wrote next to the reason it failed. */
const idOfPath = (text: string) =>
  Object.keys(INDUSTRY_INDEX).find((id) => industryPath(id).toLowerCase() === text.trim().toLowerCase())
const showIndustry = (v: string) => (INDUSTRY_INDEX[v] ? industryPath(v) : v)

const SEED: Row[] = [
  { name: 'Văn phòng HN', img: 'office-hn-01.jpg', fmt: 'Ngang', industry: 'it-sw', tags: 'Văn phòng, Nhóm người', expiry: '31/12/2027' },
  { name: 'Văn phòng HN', img: 'office-hn-02.jpg', fmt: 'Dọc', industry: 'it-sw', tags: 'Văn phòng, Nhóm người', expiry: '31/12/2027' },
  { name: 'Văn phòng HN', img: 'office-hn-03.jpg', fmt: 'Tròn', industry: 'it-sw', tags: 'Văn phòng, Nhóm người', expiry: '31/12/2027' },
  { name: 'Kho Bình Dương', img: 'kho-bd-01.jpg', fmt: 'Ngang', industry: 'log-wh', tags: 'Kho vận', expiry: '' },
  { name: 'Kho Bình Dương', img: 'kho-bd-02.jpg', fmt: 'Dọc', industry: 'log-wh', tags: 'Kho vận', expiry: '' },
  { name: '', img: 'nha-may-z.jpg', fmt: 'Ngang', industry: 'mfg-mach', tags: '', expiry: '' },
  { name: 'Spa Quận 1', img: 'spa-q1-01.jpg', fmt: 'Vuông', industry: 'hos-food', tags: '', expiry: '' },
  { name: 'Spa Quận 1', img: 'spa-q1-02.jpg', fmt: 'Tròn', industry: '', tags: 'làm đẹp', expiry: '' },
  ...Array.from({ length: 6 }, blank),
]

/** Why a row cannot be saved. Empty rows are not errors — they are the slack a
    spreadsheet always has at the bottom. */
function rowError(r: Row): string | null {
  if (isBlank(r)) return null
  if (!r.img.trim()) return 'Thiếu ảnh'
  if (!FMTS.includes(r.fmt.trim())) return `Format phải là ${FMTS.join(' · ')}`
  if (!r.industry.trim()) return 'Thiếu Industry — bắt buộc'
  if (!INDUSTRY_INDEX[r.industry]) return 'Ngành không có trong Master data'
  if (r.expiry.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(r.expiry.trim())) return 'Ngày phải là dd/mm/yyyy'
  return null
}
/** A blank Name NEVER groups with another blank Name — two unnamed pictures are
    two sets, not one. Grouping on "" would silently weld a whole batch together. */
const groupKey = (r: Row, i: number) => (r.name.trim() ? `n:${r.name.trim().toLowerCase()}` : `r:${i}`)

export function AdminImageBulkImport() {
  const goto = useContext(ScreenNavCtx)
  const [rows, setRows] = useState<Row[]>(SEED)
  const [sel, setSelState] = useState<{ r: number; c: number }>({ r: 0, c: 0 })
  /* The active cell is ALSO kept in a ref. Paste and drop are native events that
     can fire before React has re-rendered after a focus change, and reading `sel`
     from the render closure there drops the block on whatever cell was selected
     one interaction ago — silently, into rows the operator is not looking at. */
  const selRef = useRef(sel)
  const setSel = (v: { r: number; c: number }) => { selRef.current = v; setSelState(v) }
  const [picker, setPicker] = useState<number | null>(null)
  const [dropping, setDropping] = useState(false)
  const [toast, setToast] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)

  const set = (r: number, c: Col, v: string) => setRows((p) => p.map((row, i) => (i === r ? { ...row, [c]: v } : row)))
  /* setTimeout rather than requestAnimationFrame: rAF is suspended entirely while
     the page is in a background tab, which silently breaks arrow-key navigation
     for anyone who moved the window behind another one. */
  const focusCell = (r: number, c: number) => {
    setSel({ r, c })
    window.setTimeout(() => document.getElementById(`bc-${r}-${c}`)?.focus(), 0)
  }
  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 3500) }
  /* The current cell IS the focused element, so read it from the DOM rather than
     trusting a focus event to have landed in state first. Paste and drop are the
     two gestures where being one cell out silently writes into rows the operator
     is not looking at, so neither may depend on React having caught up. */
  const activeCell = () => {
    const m = /^bc-(\d+)-(\d+)$/.exec((document.activeElement as HTMLElement | null)?.id ?? '')
    return m ? { r: Number(m[1]), c: Number(m[2]) } : selRef.current
  }

  /* FILL DOWN — the single most-missed control when a form replaces a sheet.
     Industry and expiry are the same for most of a batch; typing them forty times
     is exactly why someone goes back to Excel. */
  const fillDown = (r: number, c: Col) => {
    let v = ''
    let n = 0
    setRows((p) => { v = p[r][c]; n = p.length - r - 1; return p.map((row, i) => (i > r ? { ...row, [c]: v } : row)) })
    window.setTimeout(() => say(`Đã điền “${c === 'industry' ? showIndustry(v) : v || '(trống)'}” xuống ${n} dòng dưới.`), 0)
  }

  /* PASTE A BLOCK — the migration path for data already prepared in Sheets, and
     the reason the .xlsx parser does not need to exist. */
  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text || !/[\t\n]/.test(text)) return
    e.preventDefault()
    const block = text.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map((l) => l.split('\t'))
    const { r: r0, c: c0 } = activeCell()
    setRows((p) => {
      const next = [...p]
      while (next.length < r0 + block.length) next.push(blank())
      block.forEach((line, dr) => line.forEach((cell, dc) => {
        const ci = c0 + dc
        if (ci >= COLS.length) return
        const key = COLS[ci].key
        const v = cell.trim()
        next[r0 + dr] = { ...next[r0 + dr], [key]: key === 'industry' ? (idOfPath(v) ?? v) : v }
      }))
      return next
    })
    say(`Đã dán ${block.length} dòng × ${block[0].length} cột từ clipboard.`)
  }

  /* DROP FILES — N files become N rows. This is what replaces the Image link
     column, and with it the whole class of Drive permission failures. */
  const onDrop = (e: React.DragEvent, atRow?: number) => {
    e.preventDefault(); setDropping(false)
    const names = [...e.dataTransfer.files].map((f) => f.name)
    if (!names.length) return
    let from = 0
    setRows((p) => {
      const start = atRow ?? activeCell().r ?? p.findIndex((r) => !r.img.trim())
      from = start < 0 ? p.length : start
      const next = [...p]
      while (next.length < from + names.length) next.push(blank())
      names.forEach((n, i) => { next[from + i] = { ...next[from + i], img: n } })
      return next
    })
    say(`Đã thả ${names.length} ảnh vào bảng, bắt đầu từ dòng ${from + 1}.`)
  }

  const onKey = (e: React.KeyboardEvent, r: number, c: number) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); return fillDown(r, COLS[c].key) }
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); if (r < rows.length - 1) focusCell(r + 1, c) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (r > 0) focusCell(r - 1, c) }
    else if (e.key === 'Escape') (e.target as HTMLElement).blur()
  }

  /* Grouping is LIVE, recomputed on every keystroke — the count at the foot is
     the thing being bought, so it cannot wait for a validate button. */
  const groups = useMemo(() => {
    const m = new Map<string, number[]>()
    rows.forEach((r, i) => { if (!isBlank(r)) m.set(groupKey(r, i), [...(m.get(groupKey(r, i)) ?? []), i]) })
    return m
  }, [rows])
  const groupIndex = useMemo(() => {
    const idx = new Map<string, number>()
    let n = 0
    rows.forEach((r, i) => { const k = groupKey(r, i); if (!isBlank(r) && !idx.has(k)) idx.set(k, n++) })
    return idx
  }, [rows])

  const errs = rows.map(rowError)
  const filled = rows.filter((r) => !isBlank(r)).length
  const bad = errs.filter(Boolean).length
  const ok = filled - bad
  const goodGroups = [...groups.entries()].filter(([, is]) => is.some((i) => !errs[i])).length
  const unknownTags = [...new Set(rows.flatMap((r) => r.tags.split(',').map((t) => t.trim()).filter(Boolean)))]
    .filter((t) => !TAGS.some((x) => x.name.toLowerCase() === t.toLowerCase()))

  return (
    <div>
      {/* No <h2> here: the admin shell already prints the screen title from the
          nav entry, and a second copy of it pushes the grid below the fold. */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[80ch] text-[11.5px] leading-relaxed text-muted">
          Điền thẳng trên trang như đang làm Excel — <b className="text-ink/70">một dòng = một ảnh</b>, các dòng{' '}
          <b className="text-ink/70">trùng Name</b> tự gộp thành một cụm. Không cần tải file mẫu, không cần nhập ngược lại.
        </p>
        <button onClick={() => goto('admin-image-gallery')} className="shrink-0 text-[11.5px] text-brand hover:underline">← Về thư viện</button>
      </div>

      {/* The four spreadsheet gestures, named. Nobody discovers Ctrl+D. */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11px] text-muted">
        <span><kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px]">Ctrl+V</kbd> dán cả khối từ Excel / Sheets</span>
        <span><kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px]">Ctrl+D</kbd> điền giá trị ô xuống các dòng dưới</span>
        <span><kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px]">Tab</kbd> · <kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px]">Enter</kbd> · <kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px]">↑↓</kbd> di chuyển ô</span>
        <span className="font-medium text-ink/70">Kéo thả nhiều ảnh vào bảng → mỗi ảnh một dòng</span>
      </div>

      {toast && (
        <p className="mb-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11.5px] text-brand">{toast}</p>
      )}

      <div
        ref={gridRef}
        onPaste={onPaste}
        onDragOver={(e) => { e.preventDefault(); setDropping(true) }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => onDrop(e)}
        className={cn('overflow-hidden rounded-xl border', dropping ? 'border-2 border-dashed border-brand bg-brand-soft/30' : 'border-line')}
      >
        <div className={cn(GRID, 'items-stretch border-b border-line bg-canvas/70 text-[10px] font-semibold uppercase tracking-wide text-muted')}>
          <span className="px-1.5 py-1.5 text-center">#</span>
          {COLS.map((c) => (
            <span key={c.key} className="border-l border-line-soft px-2 py-1.5">
              {c.label}{c.req && <span className="text-rose-500"> *</span>}
              {c.hint && <span className="ml-1 font-normal normal-case tracking-normal text-faint">{c.hint}</span>}
            </span>
          ))}
          <span />
        </div>

        <div className="max-h-[440px] overflow-y-auto">
          {rows.map((row, r) => {
            const err = errs[r]
            const k = groupKey(row, r)
            const gi = groupIndex.get(k)
            const members = groups.get(k) ?? []
            const first = members[0] === r
            const grouped = members.length > 1
            return (
              <div
                key={r}
                className={cn(GRID, 'items-stretch border-b border-line-soft text-[11.5px]',
                  err ? 'bg-rose-50/60' : grouped && gi !== undefined && gi % 2 === 0 ? 'bg-brand-soft/20' : '')}
              >
                <span className="relative flex items-center justify-center px-1 text-[10px] text-faint">
                  {grouped && <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: `hsl(${(gi ?? 0) * 67 + 200} 60% 60%)` }} />}
                  {r + 1}
                </span>

                {COLS.map((col, c) => {
                  const active = sel.r === r && sel.c === c
                  const common = 'w-full bg-transparent px-2 py-1.5 outline-none'
                  return (
                    <span key={col.key} className={cn('relative border-l border-line-soft', active && 'ring-1 ring-inset ring-brand')}>
                      {col.key === 'fmt' ? (
                        <select
                          id={`bc-${r}-${c}`}
                          value={row.fmt}
                          onFocus={() => setSel({ r, c })}
                          onClick={() => setSel({ r, c })}
                          onKeyDown={(e) => onKey(e, r, c)}
                          onChange={(e) => set(r, 'fmt', e.target.value)}
                          className={cn(common, 'cursor-pointer', !row.fmt && 'text-faint')}
                        >
                          <option value="">—</option>
                          {FMTS.map((f) => <option key={f} value={f}>{f}</option>)}
                          {row.fmt && !FMTS.includes(row.fmt) && <option value={row.fmt}>{row.fmt}</option>}
                        </select>
                      ) : col.key === 'industry' ? (
                        <button
                          id={`bc-${r}-${c}`}
                          onFocus={() => setSel({ r, c })}
                          onKeyDown={(e) => onKey(e, r, c)}
                          onClick={() => { setSel({ r, c }); setPicker(picker === r ? null : r) }}
                          className={cn(common, 'truncate text-left', !row.industry && 'text-faint', row.industry && !INDUSTRY_INDEX[row.industry] && 'text-rose-700')}
                          title={showIndustry(row.industry)}
                        >
                          {showIndustry(row.industry) || 'Chọn ngành…'}
                        </button>
                      ) : col.key === 'img' ? (
                        <span
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                          onDrop={(e) => { e.stopPropagation(); onDrop(e, r) }}
                          className="block"
                        >
                          <input
                            id={`bc-${r}-${c}`}
                            value={row.img}
                            onFocus={() => setSel({ r, c })}
                          onClick={() => setSel({ r, c })}
                            onKeyDown={(e) => onKey(e, r, c)}
                            onChange={(e) => set(r, 'img', e.target.value)}
                            placeholder="kéo ảnh vào ô"
                            className={cn(common, 'font-mono text-[10.5px] placeholder:font-sans placeholder:text-faint')}
                          />
                        </span>
                      ) : (
                        <input
                          id={`bc-${r}-${c}`}
                          value={row[col.key]}
                          onFocus={() => setSel({ r, c })}
                          onClick={() => setSel({ r, c })}
                          onKeyDown={(e) => onKey(e, r, c)}
                          onChange={(e) => set(r, col.key, e.target.value)}
                          placeholder={col.key === 'name' && !grouped ? '' : ''}
                          className={common}
                        />
                      )}

                      {/* Fill-down handle on the active cell — the discoverable
                          twin of Ctrl+D, which nobody finds on their own. */}
                      {active && r < rows.length - 1 && (
                        <button
                          onMouseDown={(e) => { e.preventDefault(); fillDown(r, col.key) }}
                          title="Điền xuống các dòng dưới (Ctrl+D)"
                          className="absolute -bottom-[5px] -right-[5px] z-10 grid h-[14px] w-[14px] place-items-center rounded-full border border-white bg-brand text-[9px] font-bold leading-none text-white shadow hover:opacity-90"
                        >
                          ⤓
                        </button>
                      )}
                    </span>
                  )
                })}

                <span className="flex items-center justify-center">
                  {!isBlank(row) && (
                    <button onClick={() => setRows((p) => p.filter((_, i) => i !== r))} className="text-[11px] text-faint hover:text-rose-600" title="Xoá dòng">✕</button>
                  )}
                </span>

                {err && (
                  <span className="col-span-8 border-t border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                    ↳ dòng {r + 1}: {err}
                  </span>
                )}
                {grouped && first && (
                  <span className="col-span-8 px-2 py-0.5 text-[10px] text-brand">
                    ↳ {members.length} dòng này gộp thành <b>1 cụm</b> — {RENDITIONS.filter((x) => members.some((i) => rows[i].fmt === x.label)).map((x) => x.label.toLowerCase()).join(' · ') || 'chưa có format nào'}
                    {members.length < 3 && <span className="text-amber-700"> · thiếu {RENDITIONS.filter((x) => !members.some((i) => rows[i].fmt === x.label)).map((x) => x.label.toLowerCase()).join(' · ')}</span>}
                  </span>
                )}

                {picker === r && (
                  <span className="col-span-8 border-t border-line bg-surface p-2.5">
                    <IndustryTreePicker
                      value={row.industry && INDUSTRY_INDEX[row.industry] ? [row.industry] : []}
                      onChange={(v) => { set(r, 'industry', v[0] ?? ''); if (v[0]) setPicker(null) }}
                      limit={1}
                    />
                    <span className="mt-1.5 block text-[10px] text-faint">
                      Chọn một mục ở bất kỳ cấp nào. Chọn xong muốn áp cho cả lô thì bấm <b>⤓</b> ở góc ô (hoặc Ctrl+D).
                    </span>
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-canvas/40 px-2 py-1.5">
          <button onClick={() => setRows((p) => [...p, ...Array.from({ length: 10 }, blank)])} className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] text-muted hover:border-brand">＋ 10 dòng</button>
          <button onClick={() => setRows((p) => p.filter((r) => !isBlank(r)))} className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] text-muted hover:border-brand">Xoá dòng trống</button>
          <span className="ml-auto text-[10.5px] text-faint">Bảng tự lưu nháp — F5 không mất dữ liệu</span>
        </div>
      </div>

      {unknownTags.length > 0 && (
        <p className="mt-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11px] text-brand">
          Tag mới sẽ được tạo khi lưu: <b>{unknownTags.join(' · ')}</b> — tag lạ không bị từ chối, vì bắt khách chọn từ danh sách cố định là cách nhanh nhất để họ bỏ trống cột này.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-muted">
          <b className="text-ink/80 tabular-nums">{ok}</b> dòng hợp lệ → <b className="text-ink/80 tabular-nums">{goodGroups}</b> cụm
          {bad > 0 && <span className="text-rose-700"> · <b className="tabular-nums">{bad}</b> dòng lỗi (bị bỏ qua)</span>}
          {filled === 0 && <span className="text-faint"> · bảng còn trống</span>}
        </p>
        <div className="flex gap-2">
          <button onClick={() => goto('admin-image-gallery')} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Huỷ</button>
          <button disabled={ok === 0} onClick={() => goto('admin-image-gallery')} className="rounded-lg bg-brand px-4 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            Tạo {goodGroups} cụm
          </button>
        </div>
      </div>

      <p className="mt-2 max-w-[86ch] text-[10.5px] leading-relaxed text-faint">
        <b className="text-ink/70">Dòng lỗi bị bỏ qua, phần còn lại vẫn lưu.</b> Một ô sai chính tả không được chặn cả lô
        bốn mươi ảnh — và vì lỗi hiện ngay tại ô, người nhập sửa luôn tại chỗ thay vì tải về một file báo lỗi. Cụm thiếu
        khung vẫn được tạo, nằm trong bộ lọc <i>Phiên bản · Còn thiếu</i> ở thư viện để bổ sung sau.
      </p>
    </div>
  )
}
