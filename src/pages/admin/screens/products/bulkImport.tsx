import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { RENDITIONS, imgStyle } from '@/pages/admin/data/products'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { Pill } from '@/pages/admin/ui/status'

/* ── Bulk import ──────────────────────────────────────────────────────────────
   A PAGE, not a modal. A stock pack lands forty pictures at a time, the sheet is
   prepared outside the admin by whoever bought the licence, and the review step
   is a table you scroll and argue with — none of that belongs in a dialog you can
   lose by clicking outside it.

   THE SHEET IS ONE ROW PER IMAGE, NOT PER SET. Rows sharing a Name are grouped
   into one set on import, so the person filling it in never has to hold the idea
   of a "set" in their head — only "this file is the ngang one of Văn phòng HN".
   Asking a customer to express a 1-to-3 relationship in a flat spreadsheet is
   where these imports usually die. */

type Row = {
  name: string; link: string; fmt: string; industry: string; tags: string; expiry: string
  err?: string
}

const SEED: Row[] = [
  { name: 'Văn phòng HN', link: 'drive.google.com/file/d/1A…', fmt: 'Ngang', industry: 'CNTT, web và truyền thông › Công ty dịch vụ web', tags: 'Văn phòng, Nhóm người', expiry: '31/12/2027' },
  { name: 'Văn phòng HN', link: 'drive.google.com/file/d/1B…', fmt: 'Dọc', industry: 'CNTT, web và truyền thông › Công ty dịch vụ web', tags: 'Văn phòng, Nhóm người', expiry: '31/12/2027' },
  { name: 'Văn phòng HN', link: 'drive.google.com/file/d/1C…', fmt: 'Tròn', industry: 'CNTT, web và truyền thông › Công ty dịch vụ web', tags: 'Văn phòng, Nhóm người', expiry: '31/12/2027' },
  { name: 'Kho Bình Dương', link: 'drive.google.com/file/d/1D…', fmt: 'Ngang', industry: 'Bán hàng và phân phối › Vận tải và logistics › Kho bãi/lưu trữ', tags: 'Kho vận', expiry: '31/12/2027' },
  { name: 'Kho Bình Dương', link: 'drive.google.com/file/d/1E…', fmt: 'Dọc', industry: 'Bán hàng và phân phối › Vận tải và logistics › Kho bãi/lưu trữ', tags: 'Kho vận', expiry: '31/12/2027' },
  { name: '', link: 'drive.google.com/file/d/1F…', fmt: 'Ngang', industry: 'Sản xuất và hóa chất › Máy móc, thiết bị và ô tô', tags: '', expiry: '' },
  { name: 'Nhà máy Z', link: 'drive.google.com/file/d/1G…', fmt: 'Ngang', industry: 'Ngành ABC', tags: 'Nhà máy · sản xuất', expiry: '', err: 'Ngành không có trong Master data' },
  { name: 'Nhà máy Z', link: 'drive.google.com/file/d/1H…', fmt: 'Vuông', industry: 'Sản xuất và hóa chất', tags: '', expiry: '', err: 'Format phải là Ngang · Dọc · Tròn' },
  { name: 'Spa Quận 1', link: '(trống)', fmt: 'Dọc', industry: 'Dịch vụ › Làm đẹp và mỹ phẩm', tags: '', expiry: '', err: 'Thiếu Image link' },
  { name: 'Spa Quận 1', link: 'drive.google.com/file/d/1J…', fmt: 'Tròn', industry: '', tags: '', expiry: '', err: 'Thiếu Industry — bắt buộc' },
]

export function AdminImageBulkImport() {
  const goto = useContext(ScreenNavCtx)
  const [picked, setPicked] = useState(false)
  const rows = SEED
  const good = rows.filter((r) => !r.err)
  const bad = rows.filter((r) => r.err)
  /* An unnamed row is still importable — it becomes its own single-image set.
     Grouping keys on Name, so blank names can never be merged with each other. */
  const named = [...new Set(good.filter((r) => r.name).map((r) => r.name))]
  const unnamed = good.filter((r) => !r.name).length
  const sets = named.length + unnamed

  const COLS = 'grid grid-cols-[1.15fr_1.4fr_0.55fr_2fr_1.1fr_0.75fr] gap-x-2'

  return (
    <div className="max-w-[1100px]">
      <p className="mb-3 max-w-[80ch] text-[11.5px] leading-relaxed text-muted">
        Nhập cả lô ảnh từ một file Excel. <b className="text-ink/70">Một dòng = một ảnh</b>; các dòng trùng cột{' '}
        <b className="text-ink/70">Name</b> được gộp thành một cụm. Người điền file không cần hiểu khái niệm “cụm” — chỉ
        cần biết “tấm này là bản ngang của Văn phòng HN”.
      </p>

      <div className="mb-3 flex items-center gap-2 rounded-xl border border-brand/25 bg-brand-soft px-3.5 py-2.5 text-[11.5px] text-brand">
        <span className="text-[16px]">⇩</span>
        <span className="flex-1 leading-relaxed">
          Gửi khách hàng file mẫu <b>gallery-images-import-template.xlsx</b> — cột <b>Industry</b> đã có sẵn dropdown{' '}
          <b>636 mục</b> lấy thẳng từ Master data (11 nhóm · 70 ngành · 555 chuyên ngành), chọn được cả 3 cấp. Cột{' '}
          <b>Format</b> có dropdown Ngang · Dọc · Tròn.
        </span>
        <button className="shrink-0 rounded-lg border border-brand/40 bg-surface px-2.5 py-1 text-[11px] font-semibold">Tải file mẫu</button>
      </div>

      {!picked ? (
        <>
          <button onClick={() => setPicked(true)} className="grid w-full place-items-center gap-1 rounded-2xl border-2 border-dashed border-line bg-canvas/40 px-4 py-12 text-center hover:border-brand hover:bg-brand-soft/40">
            <span className="text-[24px]">📄</span>
            <span className="text-[13.5px] font-semibold text-ink">Kéo thả file .xlsx đã điền vào đây</span>
            <span className="text-[11px] text-muted">Ảnh để trên Google Drive — cột <b>Image link</b> phải mở được bằng link</span>
          </button>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              ['1 · Khách điền file', 'Mỗi ảnh một dòng. Industry chọn từ dropdown; Name, Tag, Expiry để trống được.'],
              ['2 · Tải file lên đây', 'Hệ thống kiểm từng dòng: ngành có thật không, format có đúng không, link mở được không.'],
              ['3 · Xem trước rồi nhập', 'Dòng lỗi bị bỏ qua, phần còn lại vẫn nhập. Không có chuyện một ô sai chặn cả lô.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-line bg-surface p-3">
                <p className="text-[12px] font-semibold text-ink">{t}</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px]">
              <span className="text-[13px]">📄</span>
              <b className="text-ink">anh-stock-thang-11.xlsx</b>
              <span className="text-faint">· {rows.length} dòng</span>
              <button onClick={() => setPicked(false)} className="ml-1 text-faint hover:text-ink">✕</button>
            </span>
            <Pill tone="active">{good.length} dòng hợp lệ → {sets} cụm</Pill>
            {bad.length > 0 && <Pill tone="rejected">{bad.length} dòng lỗi · sẽ bỏ qua</Pill>}
            {unnamed > 0 && <span className="text-[11px] text-faint">{unnamed} dòng không đặt tên → mỗi dòng thành một cụm riêng</span>}
          </div>

          <div className="overflow-hidden rounded-xl border border-line">
            <div className={cn(COLS, 'bg-canvas/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted')}>
              <span>Name</span><span>Image link</span><span>Format</span><span>Industry</span><span>Tag</span><span>Expiry</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className={cn('border-t border-line-soft px-3 py-1.5', r.err && 'bg-rose-50')}>
                <div className={cn(COLS, 'text-[11px]')}>
                  <span className={cn('truncate', r.name ? 'text-ink' : 'italic text-faint')}>{r.name || '(không đặt tên)'}</span>
                  <span className="truncate font-mono text-[10px] text-muted">{r.link}</span>
                  <span className={cn(r.err?.includes('Format') ? 'font-medium text-rose-700' : 'text-muted')}>{r.fmt}</span>
                  <span className={cn('truncate', r.err?.includes('Ngành') || r.err?.includes('Industry') ? 'font-medium text-rose-700' : 'text-muted')} title={r.industry}>{r.industry || '—'}</span>
                  <span className="truncate text-muted">{r.tags || '—'}</span>
                  <span className="text-muted">{r.expiry || '—'}</span>
                </div>
                {r.err && <p className="mt-0.5 text-[10px] font-medium text-rose-700">↳ {r.err}</p>}
              </div>
            ))}
          </div>

          <p className="mt-2.5 max-w-[85ch] text-[10.5px] leading-relaxed text-faint">
            <b className="text-ink/70">Dòng lỗi bị bỏ qua, phần còn lại vẫn nhập.</b> Một ô sai chính tả không nên chặn cả
            lô bốn mươi ảnh — khách sửa những dòng đó rồi tải lại, hệ thống bỏ qua các cụm đã có.
          </p>

          <p className="mb-1.5 mt-5 text-[11px] font-semibold uppercase tracking-wide text-faint">Sẽ tạo {sets} cụm</p>
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
            {[...named.map((n) => ({ name: n, rows: good.filter((r) => r.name === n) })),
              ...good.filter((r) => !r.name).map((r) => ({ name: '', rows: [r] }))].map((g, gi) => {
              const has = (label: string) => g.rows.some((r) => r.fmt === label)
              const hue = 200 + gi * 37
              return (
                <div key={gi} className="rounded-xl border border-line bg-surface p-2.5">
                  <div className="flex items-end gap-1.5">
                    {RENDITIONS.map((r) => {
                      const on = has(r.label)
                      const box = r.key === 'landscape' ? 'h-[46px] w-[82px] rounded' : r.key === 'portrait' ? 'h-[46px] w-[35px] rounded' : 'h-[46px] w-[46px] rounded-full'
                      return (
                        <span key={r.key} className="block">
                          <span className={cn('relative block overflow-hidden border', box, on ? 'border-line' : 'border-dashed border-amber-300 bg-amber-50')} style={on ? imgStyle(hue) : undefined}>
                            {!on && <span className="absolute inset-0 grid place-items-center text-[8px] text-amber-700">trống</span>}
                          </span>
                          <span className="mt-0.5 block text-center text-[8.5px] text-faint">{r.label}</span>
                        </span>
                      )
                    })}
                  </div>
                  <p className={cn('mt-1.5 truncate text-[12px]', g.name ? 'font-medium text-ink' : 'italic text-faint')}>{g.name || '(không đặt tên)'}</p>
                  <p className="truncate text-[10px] text-muted" title={g.rows[0].industry}>{g.rows[0].industry}</p>
                  {g.rows.length < 3 && (
                    <p className="mt-1 text-[10px] font-medium text-amber-700">
                      Thiếu {RENDITIONS.filter((r) => !has(r.label)).map((r) => r.label.toLowerCase()).join(' · ')} — không dùng làm ảnh tự điền
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-3">
            <span className="text-[11px] text-faint">{good.length} ảnh → {sets} cụm · {bad.length} dòng bị bỏ qua</span>
            <div className="flex gap-2">
              <button onClick={() => goto('admin-image-gallery')} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Huỷ</button>
              <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Tải file lỗi (.xlsx)</button>
              <button onClick={() => goto('admin-image-gallery')} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Nhập {sets} cụm</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
