import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BANNER_TONE, PLACEMENT_POS } from '@/pages/admin/data/content'
import type { Banner } from '@/pages/admin/data/content'
import { CATALOG, PLACEMENTS } from '@/pages/admin/data/products'
import { DestinationPicker } from '@/pages/admin/screens/content/destination'
import { FLabel, LField, Section } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/* Publish a banner. The chain is COMPANY → PO → PRODUCT, then the two decisions
   that are actually this screen's: when it starts, and what runs.

   Starting from the company rather than the placement is what keeps a banner
   attached to something the customer paid for. Picking a placement first would let
   an operator publish a hero banner nobody bought and only discover it at invoice
   reconciliation, which is the wrong end of the process to find it. */
export function PublishBannerModal({ banner, onClose }: { banner: Banner | null; onClose: () => void }) {
  const editing = Boolean(banner)
  /* House banners are Saramin VN's own promotion: no customer, no PO, no product
     line to spend. They still occupy a rotation slot, so they are a booking like
     any other — only the money side is absent. */
  const [source, setSource] = useState<'Sold' | 'House'>(banner?.source ?? 'Sold')
  const house = source === 'House'
  const [houseEnd, setHouseEnd] = useState(banner?.source === 'House' ? banner.end : '')
  const [purpose, setPurpose] = useState('')
  const [name, setName] = useState(banner?.name ?? '')
  const [exposure, setExposure] = useState<'On' | 'Off'>(banner?.exposure ?? 'On')
  const [company, setCompany] = useState(banner?.company ?? '')
  const [po, setPo] = useState('')
  const [sku, setSku] = useState(banner?.sku ?? '')
  const [start, setStart] = useState(banner?.start === '—' ? '' : banner?.start ?? '')
  const [file, setFile] = useState<string | null>(banner?.creative ?? null)

  const companies = Object.keys(PLACEMENT_POS)
  const pos = PLACEMENT_POS[company] ?? []
  const chosenPo = pos.find((x) => x.po === po)
  const lines = chosenPo?.lines ?? []

  const product = CATALOG.find((c) => c.sku === sku)
  const slot = PLACEMENTS.find((x) =>
    (sku === 'PLC-HOMEHERO' && x.id === 'home-hero') ||
    (sku === 'PLC-ADS-HOME' && x.id === 'home-adsense') ||
    (sku === 'PLC-ADS-SEARCH' && x.id === 'search-adsense') ||
    (sku === 'PLC-TOPCOMPANY' && x.id === 'home-top-co') ||
    (sku === 'PLC-FEATURECO' && x.id === 'home-feature-co') ||
    (sku === 'PLC-SEARCH-HLCO' && x.id === 'search-highlight-co') ||
    (sku === 'PLC-POPUP' && x.id === 'home-popup'))

  const days = Number(product?.fulfilment.match(/(\d+) ngày/)?.[1] ?? 7)
  const status = banner?.status ?? 'Draft'
  /* The one hard rule: a running banner's creative is frozen. The customer paid for
     what is on screen now, and swapping it mid-flight leaves the impressions already
     served attributed to an image nobody can retrieve. Switch Exposure off, or wait
     for Expired, then publish a new booking. */
  const creativeLocked = status === 'Open'
  /* An empty start date is not a missing field — it MEANS publish now. So it is
     never part of `valid`; only the things that genuinely cannot be inferred are. */
  /* The name is required on both paths — a booking nobody can name is one nobody
     can find again in the list. */
  const valid = Boolean(name.trim()) && (editing
    ? Boolean(file)
    : house
      ? Boolean(sku) && Boolean(houseEnd) && Boolean(purpose.trim()) && Boolean(file)
      : Boolean(company) && Boolean(po) && Boolean(sku) && Boolean(file) && Boolean(chosenPo?.invoiced))

  const pick = (v: string) => { setCompany(v); setPo(''); setSku('') }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">{banner ? banner.name : 'Publish banner'}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              {banner ? <>{banner.id} · {banner.company} · <Pill tone={BANNER_TONE[status]}>{status}</Pill></> : 'Chọn khách hàng → PO → sản phẩm, rồi đặt ngày và tải banner.'}
            </p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          {creativeLocked && (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
              <span>🔒</span>
              <span>
                Banner đang <b>Open</b> — không thể thay ảnh. Khách đã trả tiền cho đúng ảnh đang chạy, đổi giữa kỳ sẽ
                làm số lượt hiển thị đã ghi nhận không còn khớp với ảnh nào. Hãy tắt <b>Exposure</b>, hoặc đợi hết hạn
                rồi tạo booking mới.
              </span>
            </p>
          )}

          {/* The NAME is what every list, report and conversation refers to — without
              it a booking is only "the FPT one, the July slot". Asked first, before
              any of the plumbing. */}
          <div>
            <FLabel req>Tên banner</FLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Tết 2026 — FPT Software · Home hero"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] text-faint">Tên nội bộ để nhận ra booking này trong danh sách — không hiển thị cho người dùng.</p>
          </div>

          {!editing && (
            <>
              <Section title="1 · Nguồn" className="mt-0" />
              <div className="grid gap-1.5 sm:grid-cols-2">
                {([
                  ['Sold', 'Khách hàng', 'Đã mua — gắn với dòng trong PO đã xuất hoá đơn'],
                  ['House', 'Nội bộ — Saramin VN', 'Tự chạy: tuyển dụng nội bộ, thông báo, chiến dịch riêng'],
                ] as const).map(([v, label, hint]) => (
                  <button
                    key={v}
                    onClick={() => setSource(v)}
                    className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', source === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                  >
                    <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', source === v ? 'border-brand' : 'border-line')}>
                      {source === v && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-[12px] font-semibold', source === v ? 'text-brand' : 'text-ink')}>{label}</span>
                      <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              {house && (
                <p className="flex gap-2 rounded-md bg-canvas/70 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  <span>ℹ️</span>
                  <span>
                    Banner nội bộ <b className="text-ink/70">vẫn chiếm 1 chỗ</b> trong pool của vị trí đó — nếu không tính, chỗ
                    bán cho khách sẽ bị vượt. Nhưng nó <b className="text-ink/70">không vào doanh thu</b> và không trừ lượt của PO nào.
                  </span>
                </p>
              )}
            </>
          )}

          {house && !editing && (
            <>
              <Section title="2 · Vị trí" />
              <div>
                <FLabel req>Placement</FLabel>
                <select
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink"
                >
                  <option value="">— Chọn vị trí —</option>
                  {CATALOG.filter((c) => c.type === 'Placement booking' && c.role !== 'Add-on').map((c) => (
                    <option key={c.sku} value={c.sku}>{c.name}</option>
                  ))}
                </select>
                {slot && (
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                    <span className="font-mono">{slot.size}</span> · {slot.shown} · {slot.cap} — đọc từ Placements.
                  </p>
                )}
              </div>
              <div>
                <FLabel req>Mục đích</FLabel>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="VD: tuyển dụng nội bộ · thông báo bảo trì · chiến dịch thương hiệu"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Bắt buộc — không có PO nào giải thích vì sao banner này chạy, nên lý do phải nằm ngay trên bản ghi.</p>
              </div>
            </>
          )}

          {!house && !editing && <Section title="2 · Khách hàng & đơn hàng" />}
          {!house && (
          <div>
            <FLabel req>Khách hàng</FLabel>
            <select
              value={company}
              onChange={(e) => pick(e.target.value)}
              disabled={editing}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink disabled:bg-canvas/60 disabled:text-muted"
            >
              <option value="">— Chọn khách hàng —</option>
              {companies.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            {!editing && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Chỉ hiện khách đã mua ít nhất một sản phẩm placement.</p>}
          </div>
          )}

          {!editing && !house && (
            <>
              <div>
                <FLabel req>Đơn hàng / PO</FLabel>
                <select
                  value={po}
                  onChange={(e) => { setPo(e.target.value); setSku('') }}
                  disabled={!company}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink disabled:bg-canvas/60 disabled:text-muted"
                >
                  <option value="">{company ? '— Chọn PO —' : '— Chọn khách hàng trước —'}</option>
                  {pos.map((x) => (
                    <option key={x.po} value={x.po}>{x.po}{x.invoiced ? ` · đã xuất HĐ ${x.invoiced}` : ' · chưa xuất hoá đơn'}</option>
                  ))}
                </select>
                {chosenPo && !chosenPo.invoiced && (
                  <p className="mt-1 flex gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                    <span>⚠️</span><span>PO này <b>chưa xuất hoá đơn</b> — chưa có quota, chưa thể publish. Kế toán xác nhận thanh toán và xuất HĐ trước.</span>
                  </p>
                )}
              </div>

              <div>
                <FLabel req>Sản phẩm trong PO</FLabel>
                {!chosenPo ? (
                  <p className="rounded-md border border-line bg-canvas/50 px-3 py-2 text-[11.5px] text-faint">Chọn PO để xem các dòng placement.</p>
                ) : (
                  <div className="space-y-1.5">
                    {lines.map((ln) => {
                      const p = CATALOG.find((c) => c.sku === ln.sku)
                      const left = ln.qty - ln.used
                      const spent = left <= 0
                      const on = sku === ln.sku
                      return (
                        <button
                          key={ln.sku}
                          onClick={() => !spent && setSku(ln.sku)}
                          disabled={spent}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left',
                            on ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30',
                            spent && 'cursor-not-allowed opacity-50 hover:border-line',
                          )}
                        >
                          <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', on ? 'border-brand' : 'border-line')}>
                            {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/80')}>{p?.name ?? ln.sku}</span>
                            <span className="block text-[10px] text-faint">{ln.used}/{ln.qty} đã dùng</span>
                          </span>
                          <span className={cn('shrink-0 text-[11px] font-semibold tabular-nums', spent ? 'text-rose-600' : 'text-ink')}>
                            {spent ? 'hết lượt' : `${left} còn lại`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {slot && (
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                    <span className="font-mono">{slot.size}</span> · {slot.shown} · {slot.cap} — đọc từ Placements, không sửa ở đây.
                  </p>
                )}
              </div>
            </>
          )}

          {editing && (
            <LField label="Sản phẩm" value={product?.name ?? banner?.sku ?? '—'} hint={banner?.source === 'House' ? 'Banner nội bộ — không gắn PO nào.' : 'Đã chốt khi bán — muốn đổi thì tạo booking mới.'} />
          )}

          <Section title="3 · Thời gian hiển thị" />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel>Ngày bắt đầu<span className="ml-1 font-normal text-faint">để trống = đăng ngay</span></FLabel>
              <input
                type="date"
                value={start ? start.split('/').reverse().join('-') : ''}
                onChange={(e) => setStart(e.target.value.split('-').reverse().join('/'))}
                disabled={status === 'Open' || status === 'Expired'}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand disabled:bg-canvas/60 disabled:text-muted"
              />
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                {start
                  ? <>Ngày trong tương lai → trạng thái <b className="text-ink/70">Schedule</b>, chờ đến {start}. <button onClick={() => setStart('')} className="font-medium text-brand hover:underline">Xoá ngày — đăng ngay</button></>
                  : <>Để trống = đăng ngay → trạng thái <b className="text-ink/70">Open</b> khi lưu.</>}
              </p>
            </div>
            {house ? (
              <div>
                <FLabel req>Ngày kết thúc</FLabel>
                <input
                  type="date"
                  value={houseEnd ? houseEnd.split('/').reverse().join('-') : ''}
                  onChange={(e) => setHouseEnd(e.target.value.split('-').reverse().join('/'))}
                  disabled={status === 'Open' || status === 'Expired'}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand disabled:bg-canvas/60 disabled:text-muted"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Nhập tay — không có sản phẩm nào quy định thời lượng, nên banner nội bộ phải tự đặt hạn kết thúc.</p>
              </div>
            ) : (
              <LField label="Ngày kết thúc" value={start ? `+${days} ngày từ ngày bắt đầu` : `— ${days} ngày sau ngày bắt đầu`} hint="Tính từ thời gian hiển thị của sản phẩm, không nhập tay." />
            )}
          </div>
          {/* Exposure: the same compact toggle a job uses — one row, a sentence and a
              switch. Two radio cards said the same thing in four times the space. */}
          <div>
            <FLabel>Exposure</FLabel>
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
              <span className="min-w-0 flex-1 text-[11.5px] text-muted">
                {exposure === 'On'
                  ? 'On — hiển thị trên site ngay khi Open.'
                  : 'Off — giữ ẩn; booking vẫn chạy và vẫn hết hạn đúng ngày (không phải kết thúc).'}
              </span>
              <button
                role="switch"
                aria-checked={exposure === 'On'}
                onClick={() => setExposure((v) => (v === 'On' ? 'Off' : 'On'))}
                className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', exposure === 'On' ? 'bg-emerald-500' : 'bg-line')}
              >
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', exposure === 'On' ? 'left-[18px]' : 'left-0.5')} />
              </button>
            </div>
          </div>

          <Section title="4 · Banner" />
          <div>
            <FLabel req>Ảnh banner</FLabel>
            <div className={cn('rounded-lg border border-dashed px-3 py-4 text-center', creativeLocked ? 'border-line bg-canvas/50' : 'border-line hover:border-brand/50')}>
              {file ? (
                <div className="flex items-center justify-center gap-2 text-[12px]">
                  <span className="truncate font-mono text-ink/80">{file}</span>
                  {!creativeLocked && (
                    <button onClick={() => setFile(null)} className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-muted hover:border-rose-300 hover:text-rose-600">Gỡ</button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setFile(`${(sku || 'banner').toLowerCase()}-${(slot?.size ?? '').replace(/[^0-9x]/g, '')}.jpg`)}
                  disabled={creativeLocked || (!editing && !sku)}
                  className="text-[12px] font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
                >
                  ⬆ Tải ảnh lên
                </button>
              )}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              Đúng kích thước <b className="text-ink/70">{slot?.size ?? '— chọn sản phẩm trước'}</b>. Ảnh sai tỉ lệ bị chặn khi lưu, không tự crop.
            </p>
          </div>
          <DestinationPicker />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          {status === 'Draft' && (
            <button onClick={onClose} disabled={!valid} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink/80 hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40">Lưu nháp</button>
          )}
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {status === 'Draft' ? 'Publish' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}
