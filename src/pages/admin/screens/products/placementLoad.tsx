/*
 * Products → Tình hình hiển thị.
 *
 * MỘT view duy nhất: trang jobseeker vẽ thành sơ đồ, mỗi band là lưới slot THẬT của
 * nó (đúng số cột, đúng số dòng), và đúng hai con số — bao nhiêu tin đang lấp slot,
 * bao nhiêu tin đang chờ (hoặc bao nhiêu slot bỏ trống).
 *
 * Bản đầu có ba tab (Tổng quan / Sơ đồ trang / Tra cứu tin), bốn ô thống kê, hai
 * khối giải thích và năm trạng thái có pill. PO cắt toàn bộ 10/11/2026: "tôi chỉ
 * cần 2 con số này thui". Lưới slot là thứ duy nhất được giữ lại — và được làm cho
 * đúng với trang thật, vì đó là thứ trả lời câu hỏi ban đầu.
 */
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PLACEMENT_LOADS, PL_PAGES, PL_SOURCE, PL_TODAY_LABEL, computeLoad } from '@/pages/admin/data/placementLoad'
import type { PlComputed, PlPage, PlacementLoad } from '@/pages/admin/data/placementLoad'

/**
 * Lưới slot của một band — đúng `cols` cột và `ceil(items/cols)` dòng của trang thật.
 *
 * Ô đặc = có tin lấp. Ô viền đứt = slot trống. Không vẽ tin đang chờ thành ô: một
 * band có 683 tin chờ thì không có cách nào vẽ ra mà vẫn đọc được — con số nằm ở
 * dòng chú thích ngay dưới.
 */
function SlotGrid({ p, c }: { p: PlacementLoad; c: PlComputed }) {
  /* Thẻ ghim là MỘT ô lớn cao bằng hai dòng thẻ thường — đúng như trang chủ vẽ nó
     bên trái lưới Super hot, nên vẽ nó như lưới 4 cột sẽ sai hình. */
  if (p.big) {
    return <div className={cn('h-[39px] w-[54px] rounded-[3px]', c.showing > 0 ? 'bg-emerald-400' : 'border border-dashed border-slate-300 bg-slate-50')} />
  }
  return (
    <div className="grid w-fit gap-[3px]" style={{ gridTemplateColumns: `repeat(${p.cols}, 18px)` }}>
      {Array.from({ length: p.itemsShown }).map((_, i) => (
        <span
          key={i}
          className={cn('h-[18px] rounded-[2px]', i < c.showing ? 'bg-emerald-400' : 'border border-dashed border-slate-300 bg-slate-50')}
        />
      ))}
    </div>
  )
}

/**
 * Hàng chờ — các tin đủ điều kiện nhưng không còn slot.
 *
 * Vẽ tiếp cùng số cột với lưới slot để mắt đọc được là "phần tràn ra ngoài lưới",
 * nhưng CẮT ở hai dòng: một band có 683 tin chờ thì vẽ hết là một bức tường không
 * đọc được, và con số mới là thứ cần nhớ. Phần vượt hiện thành "+N".
 */
function QueueGrid({ p, waiting }: { p: PlacementLoad; waiting: number }) {
  const cap = p.cols * 2
  const drawn = Math.min(waiting, cap)
  const rest = waiting - drawn
  return (
    <div className="flex items-end gap-2">
      <div className="grid w-fit gap-[3px]" style={{ gridTemplateColumns: `repeat(${p.cols}, 18px)` }}>
        {Array.from({ length: drawn }).map((_, i) => (
          <span key={i} className="h-[18px] rounded-[2px] bg-amber-300" />
        ))}
      </div>
      {rest > 0 && <span className="pb-[1px] text-[11px] font-semibold tabular-nums text-amber-600">+{rest.toLocaleString('en-US')}</span>}
    </div>
  )
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">{children}</p>
}

function Band({ p }: { p: PlacementLoad }) {
  const c = computeLoad(p)
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[12.5px] font-semibold text-ink">{p.name}</span>
        <span className="text-[10.5px] text-faint">
          {p.itemsShown} slot · {p.carousel ? 'dải cuộn 1 dòng' : `${p.cols} cột × ${c.rows} dòng`}
        </span>
        <span className="ml-auto font-mono text-[10px] text-faint">{p.key}</span>
      </div>

      {/* Hàng chờ nằm BÊN PHẢI lưới slot, không nằm dưới: một trang có 8 band, xếp
          dọc thì phải cuộn hai lần mới đọc hết một trang. */}
      <div className="mt-2.5 flex flex-wrap items-start gap-x-8 gap-y-3">
        <div>
          <RowLabel>
            <span className="text-emerald-700">{c.showing} tin đang hiển thị</span>
            {c.empty > 0 && <span className="text-slate-500"> · {c.empty} slot chưa có tin lấp</span>}
          </RowLabel>
          <SlotGrid p={p} c={c} />
        </div>

        {c.waiting > 0 && (
          <div>
            <RowLabel><span className="text-amber-600">{c.waiting.toLocaleString('en-US')} tin đang chờ hiển thị</span></RowLabel>
            <QueueGrid p={p} waiting={c.waiting} />
          </div>
        )}
      </div>

      <p className="mt-2.5 flex flex-wrap items-center gap-1 text-[10.5px]">
        <span className="text-faint">Sản phẩm feed vào đây:</span>
        {p.products.map((code) => (
          <span key={code} className="rounded border border-line bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-muted">{code}</span>
        ))}
      </p>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]',
        active ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}
    >
      {children}
    </button>
  )
}

export function AdminPlacementLoad() {
  const [page, setPage] = useState<PlPage>('home')
  const bands = PLACEMENT_LOADS.filter((p) => p.page === page)
  const meta = PL_PAGES.find((p) => p.id === page)!

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {PL_PAGES.map((pg) => (
          <Chip key={pg.id} active={page === pg.id} onClick={() => setPage(pg.id)}>{pg.label}</Chip>
        ))}
        <span className="ml-auto text-[10.5px] text-faint">Số liệu {PL_TODAY_LABEL} · {PL_SOURCE}</span>
      </div>
      {meta.note && <p className="mb-3 text-[11.5px] text-muted">{meta.note}</p>}

      <div className="space-y-2 rounded-xl border border-line bg-slate-50/60 p-3">
        {bands.map((p) => <Band key={p.id} p={p} />)}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-3 w-3 rounded-[2px] bg-emerald-400" /> Slot đã có tin
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-3 w-3 rounded-[2px] border border-dashed border-slate-300 bg-slate-50" /> Slot đang hiển thị nhưng chưa có tin lấp
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-3 w-3 rounded-[2px] bg-amber-300" /> Tin đang chờ hiển thị
        </span>
        <span className="text-[10.5px] text-faint">Lưới vẽ đúng số cột / dòng của trang thật; hàng chờ cắt ở 2 dòng, phần còn lại hiện “+N”.</span>
      </div>
    </div>
  )
}
