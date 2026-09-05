import { useState } from 'react'
import { cn } from '@/lib/utils'
import { coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { CV_STATE, entitlements } from '@/pages/admin/data/companyRecord'
import type { Ent, EntType } from '@/pages/admin/data/companyRecord'
import { TIERS, TIER_YEAR, nextTierAt, tierAt, tierRevenue } from '@/pages/admin/data/membership'
import type { ServiceEntitlement } from '@/pages/admin/data/services'
import { vnd } from '@/pages/admin/lib/fmt'
import { FLabel, LField } from '@/pages/admin/ui/fields'
import { Pill, TierPill } from '@/pages/admin/ui/status'

/* Membership block on the company record. Deliberately shows the ARITHMETIC, not
   just the badge: accumulated-in-year, the gap to the next band, and the reset date.
   The gap is the reason a rep opens this — it is the only upsell number the loyalty
   programme produces. */
/* Membership tier as an at-a-glance STAT, not a left-column card: the tier and the
   gap to the next band are numbers a rep reads in passing, and the per-tier benefit
   table belongs in System → Membership tiers where it is configured once. */
export function MembershipStat({ c }: { c: Company }) {
  const acc = tierRevenue(c)
  const tier = tierAt(acc)
  const next = nextTierAt(acc)
  const floor = tier?.from ?? 0
  const ceil = next?.from ?? TIERS[TIERS.length - 1].from
  const pct = Math.min(100, Math.max(2, ((acc - floor) / (ceil - floor)) * 100))
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">Hạng {TIER_YEAR}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <TierPill tier={tier} en />
        <span className="text-[11px] font-bold tabular-nums text-ink">{acc ? vnd(acc) : '0 ₫'}</span>
      </div>
      <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 truncate text-[10px] text-faint" title={next ? `Còn ${vnd(next.from - acc)} nữa để lên hạng ${next.vi}` : 'Đã ở hạng cao nhất'}>
        {next ? `còn ${vnd(next.from - acc)} → ${next.key}` : 'hạng cao nhất'}
      </p>
    </div>
  )
}

function QuotaBar({ left, total }: { left: number; total: number }) {
  const pct = total ? (left / total) * 100 : 0
  return (
    <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-line">
      <div className={cn('h-full rounded-full', pct < 30 ? 'bg-amber-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
    </div>
  )
}

/**
 * The CV pack's activation line — state, the clock that is actually running, and
 * the button when pressing it is legal.
 *
 * `blockedBy` is the whole point of the design: a second paid pack cannot start
 * while another is running, so its button is disabled and SAYS WHICH pack is
 * holding it. A disabled control with no reason reads as a broken screen, and the
 * operator's next move is to call support.
 */
function CvActivation({ e, blockedBy, onActivate }: { e: Ent; blockedBy?: string; onActivate?: () => void }) {
  const cv = e.cv!
  const st = CV_STATE[cv.state]
  return (
    <div className="mt-1.5 rounded-md border border-line-soft bg-canvas/50 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Pill tone={st.tone}>{st.vi}</Pill>
        {/* ONE date per state — the clock that is running now. Showing both the
            activation deadline and the validity end at once is how an operator
            reads the wrong one and tells the customer the wrong thing. */}
        {cv.state === 'chua-kich-hoat' && (
          <span className="text-[10.5px] text-muted">Phải kích hoạt trước <b className="text-ink/70">{cv.activateBy}</b> · sau khi kích hoạt có <b className="text-ink/70">{cv.validDays} ngày</b></span>
        )}
        {cv.state === 'dang-dung' && (
          <span className="text-[10.5px] text-muted">Hạn dùng <b className="text-ink/70">{cv.validUntil}</b> · kích hoạt {cv.activatedAt} bởi {cv.activatedBy}</span>
        )}
        {cv.state === 'da-ket-thuc' && (
          <span className="text-[10.5px] text-muted">
            {cv.endedBy === 'quota' ? 'Đã dùng hết quota' : `Hết hạn dùng ${cv.validUntil}`} · kích hoạt {cv.activatedAt}
          </span>
        )}
        {cv.state === 'het-han-kich-hoat' && (
          <span className="text-[10.5px] text-rose-700">Quá hạn kích hoạt {cv.activateBy} — quota hết hiệu lực, không hoàn tiền</span>
        )}
      </div>
      {cv.state === 'chua-kich-hoat' && (
        blockedBy ? (
          <p className="mt-1 text-[10.5px] leading-relaxed text-amber-800">
            Chưa kích hoạt được: <b>{blockedBy}</b> đang chạy. Mỗi lúc chỉ một gói CV được kích hoạt — gói đó hết quota hoặc hết hạn dùng thì gói này mới bấm được.
          </p>
        ) : onActivate ? (
          <button onClick={onActivate} className="mt-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">
            Kích hoạt gói
          </button>
        ) : null
      )}
    </div>
  )
}

/* One product a company holds: the product and its quota on top, the order that
   bought it small underneath. That order is deliberate — a reader opens this card to
   answer "how many CV unlocks are left", not "which PO paid for them", so the PO is
   provenance, not the headline. */
function EntRow({ e, expanded, onToggle, blockedBy, onActivate }: { e: Ent; expanded: boolean; onToggle: () => void; blockedBy?: string; onActivate?: () => void }) {
  const noQuota = e.left === null
  const exhausted = !noQuota && e.left === 0
  const svc = e.svc
  return (
    <div className={cn('rounded-lg border', noQuota ? 'border-dashed border-amber-300 bg-amber-50/40' : 'border-line bg-surface')}>
      <div className="px-2.5 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate text-[12px] font-medium text-ink">{e.name}</span>
          {noQuota
            /* A quota row counts down from what was bought. A free row has nothing to
               count down, so it reports the same single fact the quota rows do —
               whether a job was POSTED — and nothing about how it is running. */
            ? <span className="shrink-0 text-[12px] font-semibold tabular-nums text-ink">
                {e.posts ?? 0}<span className="font-normal text-faint"> tin đã đăng</span>
              </span>
            : <span className={cn('shrink-0 text-[12px] font-semibold tabular-nums', exhausted ? 'text-faint' : 'text-ink')}>
                {e.left}<span className="font-normal text-faint">/{e.total} {e.unit}</span>
              </span>}
        </div>
        {/* A pack that has not been activated shows NO meter: the bar would read
            "100/100 left", which is true and completely misleading — nothing can be
            spent from it yet. */}
        {!noQuota && !(e.cv && e.cv.state === 'chua-kich-hoat') && <QuotaBar left={e.left!} total={e.total!} />}
        {e.cv && <CvActivation e={e} blockedBy={blockedBy} onActivate={onActivate} />}
        {/* Provenance — only where there IS one. On a free row the group heading
            already says it has no PO, so a sentence repeating that is noise. */}
        {e.po && (
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[10px] text-faint">
            <span className="font-mono text-brand/80">{e.po}</span>
            {e.invoiced && <span>· HĐ {e.invoiced}</span>}
            {e.until && <span>· hạn {e.until}</span>}
            {svc && <span>· ghi nhận tay</span>}
          </p>
        )}
        {svc && (
          <button onClick={onToggle} className="mt-1 text-[10.5px] font-medium text-brand hover:underline">
            {expanded ? '▾ Ẩn lượt đã ghi nhận' : `▸ ${svc.entries.length} lượt đã ghi nhận`}
          </button>
        )}
      </div>
      {/* A manual service has no meter, so its log lives where its quota is shown —
          the number above is only trustworthy because these entries are underneath it. */}
      {svc && expanded && (
        <div className="border-t border-line-soft px-2.5 py-2">
          {svc.entries.length === 0 ? (
            <p className="text-[11.5px] text-muted">Chưa ghi nhận lượt nào.</p>
          ) : (
            <ol className="space-y-2">
              {svc.entries.map((d, i) => (
                <li key={d.id} className="flex gap-2">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-canvas text-[9px] font-semibold text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[11.5px] font-medium tabular-nums text-ink">{d.date}</span>
                      <a href={d.link} onClick={(ev) => ev.preventDefault()} className="min-w-0 truncate text-[11px] text-brand hover:underline">{d.link}</a>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted">{d.content}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-faint">
                      {d.image
                        ? <span className="rounded border border-line bg-canvas px-1 font-mono">🖼 {d.image}</span>
                        : <span className="text-amber-700">⚠️ chưa có ảnh</span>}
                      <span>· {d.by}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Activation confirm. It exists because the act is IRREVERSIBLE in effect: pressing
 * it starts a 30- or 90-day clock that cannot be paused, and any quota left when
 * that clock ends is gone. So the dialog states the end date it is about to create,
 * in words, before the button.
 */
function ActivateCvModal({ e, company, onClose }: { e: Ent; company: string; onClose: () => void }) {
  const cv = e.cv!
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-8 w-full max-w-[460px] rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <h3 className="text-[15px] font-bold tracking-tight text-ink">Kích hoạt gói CV search?</h3>
        <p className="mt-1 text-[12px] text-muted">{company} · {e.name}</p>
        <div className="mt-3 space-y-1.5 rounded-lg border border-line bg-canvas/60 px-3 py-2.5 text-[12px]">
          {[['Quota của gói này', `${e.total} CV unlocks`],
            ['Thời hạn dùng sau khi kích hoạt', `${cv.validDays} ngày`],
            ['Phải kích hoạt trước', cv.activateBy]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <span className="text-muted">{k}</span><span className="font-medium text-ink/80">{v}</span>
            </div>
          ))}
        </div>
        <p className="mt-2.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
          Đồng hồ <b>{cv.validDays} ngày</b> chạy từ lúc bấm và <b>không dừng lại được</b>. Quota chưa dùng hết khi hết hạn sẽ mất. Trong lúc gói này chạy, các gói CV khác <b>không kích hoạt được</b>.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          NTD cũng tự kích hoạt được ở <b className="text-ink/75">Company site → Products</b>. Admin bấm hộ là để xử lý ca khách gọi lên nhờ, và bản ghi lưu lại ai bấm.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Huỷ</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">Kích hoạt</button>
        </div>
      </div>
    </div>
  )
}

/* Products & quota block — shared by the Overview snapshot and the billing tab */
export function ProductsQuota({ c, compact }: { c: Company; compact?: boolean }) {
  const ents = entitlements(c)
  const [openSvc, setOpenSvc] = useState<string | null>(null)
  const [activating, setActivating] = useState<Ent | null>(null)
  /* THE SERIALISATION, in one place: whichever CV pack is running blocks every other
     pack from starting. Computed from the rows the card is about to render, so the
     button state and the reason under it can never disagree with the list above. */
  const running = ents.find((e) => e.cv?.state === 'dang-dung')
  const [logging, setLogging] = useState<ServiceEntitlement | null>(null)
  /* The four product types, in the catalogue's own order, then the no-PO items. A
     type with nothing in it is omitted rather than shown empty — an empty heading
     tells a reader they are missing something they never bought. */
  const groups: { key: EntType; label: string }[] = [
    { key: 'job', label: 'Job posting' },
    { key: 'cv', label: 'CV search' },
    { key: 'placement', label: 'Display / placement' },
    { key: 'service', label: 'Manual service' },
    // The user's own name for this group. "Không thuộc PO nào" described what these
    // rows lack; "Job free" says what they ARE, and the missing PO is already stated
    // on each row's provenance line.
    { key: 'none', label: 'Job free' },
  ]
  const pos = [...new Set(ents.map((e) => e.po).filter(Boolean))]

  if (ents.length === 0) {
    return <p className="text-[12px] text-muted">Chưa mua sản phẩm nào — quota chỉ xuất hiện khi xuất hoá đơn VAT cho một PO. Tin miễn phí không cần quota: Admin đăng mà không chọn PO.</p>
  }

  return (
    <>
      {pos.length > 1 && !compact && (
        <p className="mb-2 text-[10.5px] leading-relaxed text-faint">
          Công ty này có <b className="text-muted">{pos.length} PO</b>. Mỗi sản phẩm ghi rõ PO của nó ở dòng nhỏ bên dưới —
          <b className="text-muted"> hạn dùng khác nhau theo từng PO</b>, và quota trừ theo thứ tự hết hạn gần nhất trước.
        </p>
      )}
      <div className="space-y-3">
        {groups.map((g) => {
          const rows = ents.filter((e) => e.type === g.key)
          if (rows.length === 0) return null
          return (
            <div key={g.key}>
              <p className={cn('mb-1 text-[10px] font-semibold uppercase tracking-wide', g.key === 'none' ? 'text-amber-800' : 'text-faint')}>{g.label}</p>
              <div className="space-y-1.5">
                {rows.map((e) => (
                  <EntRow
                    key={e.name + (e.po ?? '')}
                    e={e}
                    expanded={openSvc === e.name}
                    onToggle={() => setOpenSvc(openSvc === e.name ? null : e.name)}
                    blockedBy={running && running !== e ? running.name : undefined}
                    /* The STATE shows everywhere; the button only on the full billing
                       tab, same convention as the service log. The Overview snapshot is
                       read at a glance, and starting an irreversible 30/90-day clock
                       from a summary card is a misclick waiting to happen. */
                    onActivate={compact ? undefined : () => setActivating(e)}
                  />
                ))}
              </div>
              {g.key === 'service' && !compact && (
                <button
                  onClick={() => setLogging(rows.find((r) => r.svc && (r.left ?? 0) > 0)?.svc ?? rows[0].svc ?? null)}
                  disabled={!rows.some((r) => (r.left ?? 0) > 0)}
                  className="mt-1.5 rounded-md border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-faint"
                >
                  {rows.some((r) => (r.left ?? 0) > 0) ? '+ Ghi nhận đã đăng' : 'Đã dùng hết — không thể ghi nhận thêm'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      {logging && <LogServiceDeliveryModal e={logging} company={coLabel(c)} onClose={() => setLogging(null)} />}
      {activating && <ActivateCvModal e={activating} company={coLabel(c)} onClose={() => setActivating(null)} />}
    </>
  )
}

export function LogServiceDeliveryModal({ e, company, onClose }: { e: ServiceEntitlement; company: string; onClose: () => void }) {
  const [date, setDate] = useState('')
  const [link, setLink] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<string | null>(null)
  /* Link + content are required, image is not: an email blast has no screenshot
     worth keeping, but every delivery has somewhere it landed and something it
     said. Without those two the entry cannot answer "show me what we posted". */
  const valid = Boolean(date) && Boolean(link.trim()) && Boolean(content.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Ghi nhận đã đăng</p>
            <p className="text-[11px] text-muted">{e.name} · {company}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel req>Ngày đăng</FLabel>
              <input
                type="date"
                value={date}
                onChange={(ev) => setDate(ev.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
              />
            </div>
            <LField label="Người thực hiện" value="Nguyễn Thị Lan" hint="Lấy từ người đang đăng nhập." />
          </div>

          <div>
            <FLabel req>Link bài đăng</FLabel>
            <input
              value={link}
              onChange={(ev) => setLink(ev.target.value)}
              placeholder="https://facebook.com/topdev.vn/posts/…"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Bắt buộc — đây là thứ khách hỏi khi đối chiếu hoá đơn: “cho tôi xem bài đã đăng”.</p>
          </div>

          <div>
            <FLabel req>Nội dung đã đăng</FLabel>
            <textarea
              value={content}
              onChange={(ev) => setContent(ev.target.value)}
              rows={3}
              placeholder="Tóm tắt nội dung, thông điệp chính, CTA…"
              className="w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
          </div>

          <div>
            <FLabel>Ảnh chụp / ảnh đã dùng<span className="ml-1 font-normal text-faint">không bắt buộc</span></FLabel>
            <div className="rounded-lg border border-dashed border-line px-3 py-3 text-center">
              {image ? (
                <span className="flex items-center justify-center gap-2 text-[12px]">
                  <span className="truncate font-mono text-ink/80">{image}</span>
                  <button onClick={() => setImage(null)} className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-muted hover:border-rose-300 hover:text-rose-600">Gỡ</button>
                </span>
              ) : (
                <button onClick={() => setImage('proof-screenshot.jpg')} className="text-[12px] font-medium text-brand hover:underline">⬆ Tải ảnh lên</button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            Lưu — trừ 1 {e.unit}
          </button>
        </div>
      </div>
    </div>
  )
}
