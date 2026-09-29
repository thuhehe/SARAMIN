import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BANNER_TONE, BOOKABLE_SLOTS, MIN_SHARE, SLOT_HEALTH, SLOT_TODAY_LABEL, THIN_DAYS, slotUsage } from '@/pages/admin/data/content'
import type { SlotHealth, SlotOccupant, SlotUsage } from '@/pages/admin/data/content'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* ── Slot occupancy ───────────────────────────────────────────────────────────
   The other half of Displays. That page lists BOOKINGS — one row per banner a
   customer bought. This one lists SLOTS, and the difference is the whole point:
   an empty slot is not a row on a booking list, it is the ABSENCE of rows against
   an area nobody thought to check. Rows have to BE the slots before "nothing is
   running here" can appear on screen at all.

   EVERY NUMBER HERE IS DERIVED, AND EVERY NUMBER SHOWS ITS WORKING. Two things
   make that true rather than claimed:

     · the reference date is printed at the top, because "còn 1 ngày" is
       uncheckable — and therefore untrustworthy — without a visible "today";
     · each count names its members in the cell beneath it, so "2 đang chờ" reads
       as the two bookings it actually is, not as a figure to take on faith.

   The one place the page cannot be definitive is capacity, and it says so out
   loud rather than picking a side — see the note under the table. */
export function AdminSlots() {
  const all = BOOKABLE_SLOTS.map(slotUsage)
  const [focus, setFocus] = useState<SlotHealth | 'all'>('all')
  const [detail, setDetail] = useState<SlotUsage | null>(null)

  const rows = all.filter((u) => focus === 'all' || u.health === focus)
  const n = (h: SlotHealth) => all.filter((u) => u.health === h).length

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[72ch] text-[11.5px] leading-relaxed text-muted">
          One row per bookable display area. Capacity comes from the <b className="text-ink/70">Placements registry</b>,
          occupancy from the banners and popups published against it — nothing is typed, so a slot cannot read healthy
          while its last banner expires.
        </p>
        {/* Without this, every "còn N ngày" on the page is unverifiable. */}
        <span className="shrink-0 rounded-lg border border-line bg-canvas/60 px-2.5 py-1.5 text-[11px] text-muted">
          Tính đến <b className="tabular-nums text-ink/80">{SLOT_TODAY_LABEL}</b>
        </span>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <SumCard label="Vị trí bán được" value={all.length} sub="tổng vị trí có thể đặt" on={focus === 'all'} onClick={() => setFocus('all')} />
        <SumCard label="Trống ngay" value={n('Trống')} sub="không hiển thị gì" tone="rose" on={focus === 'Trống'} onClick={() => setFocus('Trống')} />
        <SumCard label={`Sắp trống ≤ ${THIN_DAYS} ngày`} value={n('Sắp trống')} sub="chưa có gì xếp sau" tone="amber" on={focus === 'Sắp trống'} onClick={() => setFocus('Sắp trống')} />
        <SumCard label="Loãng" value={n('Loãng')} sub="bán quá số vị trí" tone="violet" on={focus === 'Loãng'} onClick={() => setFocus('Loãng')} />
        <SumCard label="Chỉ nội bộ" value={n('Chỉ nội bộ')} sub="không sinh doanh thu" tone="sky" on={focus === 'Chỉ nội bộ'} onClick={() => setFocus('Chỉ nội bộ')} />
      </div>

      <ListPage
        minW={1340}
        cols={[
          { label: 'Vị trí', w: '1.8fr', hint: 'từ Placements registry' },
          { label: 'Hiển thị cùng lúc', w: '0.9fr', hint: 'số vị trí render đồng thời' },
          { label: 'Đang xoay vòng (live)', w: '1.4fr', hint: 'đếm booking Open + Exposure On' },
          { label: 'Tỉ lệ hiển thị / banner', w: '1.3fr', hint: '= hiển thị cùng lúc ÷ đang xoay vòng' },
          { label: 'Đang chờ (scheduled)', w: '1.3fr', hint: 'đã đặt, chưa tới ngày bắt đầu' },
          { label: 'Kín đến khi nào', w: '1.7fr', hint: 'ngày booking live CUỐI CÙNG kết thúc' },
          { label: 'Tình trạng', w: '1fr', hint: 'suy ra từ các cột bên trái' },
        ]}
        rows={rows.map((u) => [
          <span className="min-w-0">
            <button onClick={() => setDetail(u)} className="block max-w-full truncate text-left font-medium text-brand hover:underline">{u.placement.name}</button>
            <span className="block truncate text-[10.5px] text-faint">{u.placement.page} · deck §{u.placement.ref} · {u.placement.size}</span>
          </span>,

          /* The real capacity: how many positions render at once. */
          <span className="text-[11.5px]" title="Số vị trí hiển thị đồng thời trên trang — sức chứa thật của slot">
            <b className="tabular-nums text-ink/80">{u.shown ?? '—'}</b>
            <span className="block text-[10px] text-faint">{u.placement.shown}</span>
          </span>,

          /* live = Open AND Exposure On. The sub-line names the split, because a
             slot held up entirely by house creative looks identical to a healthy
             one at the level of a single count. */
          <span className="min-w-0" title="Booking có status Open VÀ Exposure On — xoay vòng qua các vị trí hiển thị">
            <span className="flex items-baseline gap-1.5">
              <b className={cn('text-[13px] tabular-nums', u.live.length === 0 ? 'text-rose-600' : 'text-ink')}>{u.live.length}</b>
              <span className="text-[10.5px] text-muted">{u.live.length === 0 ? 'không có gì hiển thị' : <><b className="text-brand">{u.sold}</b> khách · {u.house} nội bộ</>}</span>
            </span>
            {u.live.length > 0 && <FillBar u={u} />}
          </span>,

          /* The number that replaces "capacity used" once the pool is unlimited. */
          <ShareCell u={u} />,

          /* The count alone was the least explicable number on the old table:
             "2" with no indication of what, or when it lands. */
          u.nextIn
            ? <span className="min-w-0" title="Booking có status Schedule — đã đặt, chưa tới ngày bắt đầu">
                <span className="block text-[11.5px] text-ink/80"><b className="tabular-nums">{u.queued}</b> chờ · sớm nhất {u.nextIn.start}</span>
                <span className="block truncate text-[10.5px] text-faint">{u.nextIn.company}</span>
              </span>
            : <span className="text-[11.5px] text-faint">— chưa có gì xếp sau</span>,

          <Coverage u={u} />,

          <span title={SLOT_HEALTH[u.health].rule}><Pill tone={SLOT_HEALTH[u.health].tone}>{u.health}</Pill></span>,
        ])}
        total={all.length}
        searchHint="Search vị trí, trang…"
        searchExtra={rows.map((u) => [u.placement.page, u.placement.ref, u.placement.fedBy].join(' '))}
      />

      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        <b className="text-ink/70">Live</b> = status Open <b className="text-ink/70">và</b> Exposure On — an Open banner
        switched off renders nothing, and counting it would let a slot read occupied while showing blank ·
        <b className="text-ink/70">Kín đến khi nào</b> = ngày booking live <b className="text-ink/70">cuối cùng</b>{' '}
        kết thúc, tức lúc vị trí về 0 banner (“còn N ngày” = ngày đó − {SLOT_TODAY_LABEL}). Booking kết thúc SỚM nhất
        không được dùng: kho không giới hạn nên một banner rời không giải phóng chỗ nào và không tạo ra cơ hội bán mới
        · click a vị trí for its bookings and the days each has left
      </p>

      {/* What the model now assumes, and the one number the business still owes. */}
      <p className="mt-3 flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
        <span>⚠️</span>
        <span>
          <b>Kho vị trí là KHÔNG GIỚI HẠN.</b> Trang web hiển thị một số vị trí cố định, nhưng phía sau có thể xoay
          vòng bao nhiêu banner cũng được — nên vị trí không bao giờ “đầy”, và <b>không có “còn trống” để đếm</b>.
          Thứ thay đổi khi bán thêm là <b>tỉ lệ hiển thị</b> của mỗi banner: bán banner thứ 10 vào hero thì mọi khách
          chỉ còn 1/10 thời lượng. Vì vậy cột sức chứa đã bỏ; rủi ro cần canh là <b>Loãng</b>, không phải hết chỗ.
          <br />
          <b>Cần chốt với business:</b> ngưỡng tỉ lệ hiển thị tối thiểu — hiện tạm để{' '}
          <b>{Math.round(MIN_SHARE * 100)}%</b>. Đây là cam kết thương mại với khách (“banner của bạn lên hình ít nhất
          X% thời lượng”), không phải giới hạn kỹ thuật. Con số này cũng chính là thứ quyết định khi nào ngừng bán
          thêm vào một vị trí.
          <br />
          <span className="text-amber-700">
            Lưu ý: build spec hiện ghi <i>“a slot holds at most ONE Live banner per period”</i> (Phase-1) — mâu thuẫn
            với kho không giới hạn, cần sửa lại trong requirement.
          </span>
        </span>
      </p>

      {detail && <SlotDetail u={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

/** Clickable summary reading. `on` marks the filter currently applied. */
function SumCard({ label, value, sub, tone, on, onClick }: {
  label: string; value: number; sub: string
  tone?: 'rose' | 'amber' | 'sky' | 'violet'
  on: boolean; onClick: () => void
}) {
  const dead = value === 0
  return (
    <button
      onClick={onClick}
      className={cn('rounded-xl border p-3 text-left transition-colors', on ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className={cn(
        'mt-0.5 text-[20px] font-bold tabular-nums tracking-tight',
        dead ? 'text-ink/25'
          : tone === 'rose' ? 'text-rose-600'
            : tone === 'amber' ? 'text-amber-600'
              : tone === 'sky' ? 'text-sky-700'
                : tone === 'violet' ? 'text-violet-600'
                  : 'text-ink',
      )}>{value}</p>
      <p className="text-[10.5px] text-faint">{sub}</p>
    </button>
  )
}

/** Customer vs house as one bar, so the revenue mix reads without arithmetic. */
function FillBar({ u }: { u: SlotUsage }) {
  const denom = Math.max(u.live.length, 1)
  const pct = (x: number) => `${Math.min(100, (x / denom) * 100)}%`
  return (
    <span className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-line/70">
      {u.sold > 0 && <span className="bg-brand" style={{ width: pct(u.sold) }} />}
      {u.house > 0 && <span className="bg-slate-400" style={{ width: pct(u.house) }} />}
    </span>
  )
}

/* Share of voice, as a bar plus the arithmetic that produced it. The sub-line is
   the whole point: "40%" is a verdict, "2 vị trí ÷ 5 banner" is a fact the reader
   can check, and a percentage nobody can check is a percentage nobody trusts. */
function ShareCell({ u }: { u: SlotUsage }) {
  if (u.share == null) {
    return <span className="text-[11.5px] text-faint">{u.shown == null ? '— danh sách, không xoay vòng' : '—'}</span>
  }
  const pct = Math.round(u.share * 100)
  const low = u.share < MIN_SHARE
  return (
    <span className="min-w-0" title={`${u.shown} vị trí ÷ ${u.live.length} banner đang live = ${pct}% thời lượng mỗi banner`}>
      <span className="flex items-baseline gap-1.5">
        <b className={cn('text-[13px] tabular-nums', low ? 'text-violet-600' : 'text-ink/80')}>{pct}%</b>
        <span className="text-[10px] text-faint">{u.shown} vị trí ÷ {u.live.length} banner</span>
      </span>
      <span className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-line/70">
        <span className={cn(low ? 'bg-violet-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
      </span>
    </span>
  )
}

/* WHEN DOES THIS SLOT GO BLANK — the only date on an unlimited-pool slot that
   carries a decision.

   The column used to show the EARLIEST booking to end, which was the wrong anchor
   twice over. Nothing is freed when a booking ends, because nothing was ever
   scarce: the pool is unlimited, so every slot is sellable every day and an
   expiry opens no window. And one of five banners rotating out changes nothing
   an operator would act on. What can actually go wrong is the slot reaching ZERO
   live and rendering blank — which the LAST booking out decides. */
function Coverage({ u }: { u: SlotUsage }) {
  // Already blank today.
  if (u.live.length === 0) {
    return (
      <span className="min-w-0">
        <span className="block text-[11.5px] font-medium text-rose-600">Trống ngay</span>
        <span className="block truncate text-[10px] text-muted">
          {u.nextIn ? `${u.gapDays} ngày nữa mới có booking (${u.nextIn.start})` : 'chưa có gì xếp sau'}
        </span>
      </span>
    )
  }
  // A booking with no end date keeps it covered indefinitely.
  if (u.openEnded) {
    return (
      <span className="min-w-0" title="Có booking không đặt ngày kết thúc (luôn bật)">
        <span className="block text-[11.5px] text-ink/80">Kín — luôn bật</span>
        <span className="block truncate text-[10px] text-faint">không có ngày hết hạn</span>
      </span>
    )
  }
  if (!u.lastOut || u.emptyInDays == null) return <span className="text-[11.5px] text-faint">—</span>
  const d = u.emptyInDays
  return (
    <span
      className="min-w-0"
      title={`Booking live kết thúc muộn nhất: ${u.lastOut.end} (${u.lastOut.company}) − hôm nay ${SLOT_TODAY_LABEL} = ${d} ngày`}
    >
      <span className={cn('block text-[11.5px] tabular-nums', d <= THIN_DAYS ? 'font-medium text-amber-700' : 'text-ink/80')}>
        Kín đến {u.lastOut.end}
      </span>
      <span className="block truncate text-[10px] text-faint">còn {d} ngày · {u.lastOut.company} là booking cuối</span>
      <span className={cn('block truncate text-[10px]', u.queued === 0 ? 'font-medium text-rose-600' : u.gapDays ? 'font-medium text-amber-700' : 'text-emerald-700')}>
        {u.queued === 0
          ? '→ sau đó TRỐNG, chưa có gì xếp sau'
          : u.gapDays
            ? `→ trống ${u.gapDays} ngày trước booking ${u.nextIn!.start}`
            : '→ có booking nối tiếp, không đứt'}
      </span>
    </span>
  )
}

/* Per-slot bookings. This is where "số ngày hiển thị còn lại của mỗi company"
   belongs: it is a fact about a BOOKING, and flattening N bookings into the slot
   row is what makes a region table unreadable once a slot holds more than one. */
function SlotDetail({ u, onClose }: { u: SlotUsage; onClose: () => void }) {
  const order: Record<string, number> = { Open: 0, Schedule: 1, Draft: 2, Expired: 3 }
  const rows = [...u.occupants].sort((a, b) => (order[a.status] - order[b.status]) || (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
  const liveNow = (o: SlotOccupant) => o.status === 'Open' && o.exposure === 'On'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={onClose}>
      <div className="my-4 w-full max-w-[760px] rounded-2xl border border-line bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-ink">{u.placement.name}</h3>
            <p className="mt-0.5 text-[11px] text-muted">
              {u.placement.page} · deck §{u.placement.ref} · {u.placement.size} · hiển thị {u.placement.shown} · kho xoay vòng không giới hạn
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Pill tone={SLOT_HEALTH[u.health].tone}>{u.health}</Pill>
            <button onClick={onClose} className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-ink/40">Đóng</button>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* The state, and the rule that produced it, at the one moment the
              reader is actually asking "why does it say that?". */}
          <div className="mb-3 rounded-md bg-canvas/60 px-3 py-2 text-[11.5px] leading-relaxed">
            <p className="text-ink/80">{SLOT_HEALTH[u.health].hint}</p>
            <p className="mt-1 text-[11px] text-muted"><b className="text-ink/60">Cách tính:</b> {SLOT_HEALTH[u.health].rule}</p>
            <p className="mt-1 text-[10.5px] text-faint">Lấp bởi: {u.placement.fedBy} · tính đến {SLOT_TODAY_LABEL}</p>
          </div>

          <p className="mb-3 text-[11px] text-faint">
            Xem cùng dữ liệu này cho mọi vị trí ở <b className="text-ink/70">Displays → Theo vị trí</b> (nhóm banner
            theo vị trí).
          </p>

          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-line px-3 py-6 text-center text-[12px] text-faint">
              Chưa có booking nào cho vị trí này.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="grid grid-cols-[1.6fr_1.2fr_0.7fr_1.2fr_0.8fr_1fr] gap-x-3 bg-canvas/60 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                <span>Booking</span><span>Công ty</span><span>Nguồn</span><span>Lịch chạy</span><span className="text-right">Còn lại</span><span>Trạng thái</span>
              </div>
              {rows.map((o) => (
                <div key={o.id} className={cn('grid grid-cols-[1.6fr_1.2fr_0.7fr_1.2fr_0.8fr_1fr] items-center gap-x-3 border-t border-line-soft px-3 py-2 text-[12px]', !liveNow(o) && 'opacity-60')}>
                  <span className="min-w-0">
                    <span className="block truncate text-ink/85">{o.name}</span>
                    <span className="block font-mono text-[10px] text-faint">{o.id} · {o.kind}</span>
                  </span>
                  <span className={cn('truncate', o.source === 'House' && 'text-faint')}>{o.company}</span>
                  <span>{o.source === 'House' ? <Pill tone="neutral">Nội bộ</Pill> : <Pill tone="active">Khách</Pill>}</span>
                  <span className="tabular-nums text-[11.5px] text-muted">
                    {o.start === '—' ? 'chưa đặt' : o.end === 'Always on' ? `${o.start} – luôn bật` : `${o.start} – ${o.end}`}
                  </span>
                  <span className={cn('text-right tabular-nums text-[11.5px]', o.daysLeft != null && o.daysLeft <= THIN_DAYS && liveNow(o) ? 'font-medium text-amber-700' : 'text-muted')}>
                    {o.daysLeft == null ? '—' : o.daysLeft < 0 ? 'đã hết' : `${o.daysLeft} ngày`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Pill tone={BANNER_TONE[o.status]}>{o.status}</Pill>
                    {o.status === 'Open' && o.exposure === 'Off' && (
                      <span className="text-[10px] text-rose-600" title="Open nhưng Exposure Off — không hiển thị, không tính là live">tắt</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {u.health === 'Loãng' && u.share != null && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              {u.live.length} banner đang xoay vòng qua {u.shown} vị trí — mỗi banner chỉ lên hình{' '}
              <b>{Math.round(u.share * 100)}%</b> thời lượng, dưới ngưỡng {Math.round(MIN_SHARE * 100)}%. Bán thêm vào
              vị trí này sẽ làm mỏng tiếp phần của những khách đã mua.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
