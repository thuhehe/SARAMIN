import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BANNER_TONE, PLACEMENT_POS } from '@/pages/admin/data/content'
import type { Popup } from '@/pages/admin/data/content'
import { CATALOG } from '@/pages/admin/data/products'
import { DestinationPicker } from '@/pages/admin/screens/content/destination'
import { FLabel, LField, Section } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

export function PublishPopupModal({ popup, onClose }: { popup: Popup | null; onClose: () => void }) {
  const editing = Boolean(popup)
  /* Identical chain to a banner: COMPANY → PO → PRODUCT. A popup slot is a placement
     product too (Homepage pop-up), so there is no reason for a second way in. */
  const [source, setSource] = useState<'Sold' | 'House'>(popup?.source ?? 'House')
  const house = source === 'House'
  const [company, setCompany] = useState(popup?.company ?? '')
  const [po, setPo] = useState('')
  const [sku, setSku] = useState('')
  const [start, setStart] = useState(popup?.start === '—' ? '' : popup?.start ?? '')
  const [houseEnd, setHouseEnd] = useState(popup && popup.end !== 'Always on' && popup.end !== '—' ? popup.end : '')
  const [purpose, setPurpose] = useState('')
  const [name, setName] = useState(popup?.name ?? '')
  const [exposure, setExposure] = useState<'On' | 'Off'>(popup?.exposure ?? 'On')
  const [file, setFile] = useState<string | null>(popup?.creative ?? null)

  const companies = Object.keys(PLACEMENT_POS)
  const pos = PLACEMENT_POS[company] ?? []
  const chosenPo = pos.find((x) => x.po === po)
  const lines = chosenPo?.lines ?? []
  const product = CATALOG.find((c) => c.sku === sku)
  const days = Number(product?.fulfilment.match(/(\d+) ngày/)?.[1] ?? 7)

  const status = popup?.status ?? 'Draft'
  const creativeLocked = status === 'Open'
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
            <p className="text-[15px] font-bold">{popup ? popup.name : 'Publish popup'}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              {popup ? <>{popup.id} · {popup.company} · <Pill tone={BANNER_TONE[status]}>{status}</Pill></> : 'Chọn khách hàng → PO → sản phẩm, rồi đặt ngày và tải ảnh.'}
            </p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          {creativeLocked && (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
              <span>🔒</span>
              <span>Popup đang <b>Open</b> — không thể thay ảnh. Tắt <b>Exposure</b> để gỡ khỏi màn hình, hoặc đợi hết hạn rồi tạo mới.</span>
            </p>
          )}

          {/* The NAME is what every list, report and conversation refers to — without
              it a booking is only "the FPT one, the July slot". Asked first, before
              any of the plumbing. */}
          <div>
            <FLabel req>Tên popup</FLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khảo sát NPS tháng 8 · Ứng viên"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] text-faint">Tên nội bộ để nhận ra popup này trong danh sách — không hiển thị cho người dùng.</p>
          </div>

          {!editing && (
            <>
              <Section title="1 · Nguồn" className="mt-0" />
              <div className="grid gap-1.5 sm:grid-cols-2">
                {([
                  ['Sold', 'Khách hàng', 'Đã mua — gắn với dòng trong PO đã xuất hoá đơn'],
                  ['House', 'Nội bộ — Saramin VN', 'Thông báo, khảo sát, chiến dịch riêng'],
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
            </>
          )}

          {house && !editing && (
            <>
              <Section title="2 · Vị trí" />
              <div>
                <FLabel req>Placement</FLabel>
                <select value={sku} onChange={(e) => setSku(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  <option value="">— Chọn vị trí —</option>
                  {CATALOG.filter((c) => c.type === 'Placement booking' && c.role !== 'Add-on').map((c) => <option key={c.sku} value={c.sku}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <FLabel req>Mục đích</FLabel>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="VD: khảo sát NPS · thông báo bảo trì · chào mừng người dùng mới"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Bắt buộc — không có PO nào giải thích vì sao popup này chạy.</p>
              </div>
            </>
          )}

          {!house && !editing && (
            <>
              <Section title="2 · Khách hàng & đơn hàng" />
              <div>
                <FLabel req>Khách hàng</FLabel>
                <select value={company} onChange={(e) => pick(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  <option value="">— Chọn khách hàng —</option>
                  {companies.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <FLabel req>Đơn hàng / PO</FLabel>
                <select
                  value={po}
                  onChange={(e) => { setPo(e.target.value); setSku('') }}
                  disabled={!company}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink disabled:bg-canvas/60 disabled:text-muted"
                >
                  <option value="">{company ? '— Chọn PO —' : '— Chọn khách hàng trước —'}</option>
                  {pos.map((x) => <option key={x.po} value={x.po}>{x.po}{x.invoiced ? ` · đã xuất HĐ ${x.invoiced}` : ' · chưa xuất hoá đơn'}</option>)}
                </select>
                {chosenPo && !chosenPo.invoiced && (
                  <p className="mt-1 flex gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                    <span>⚠️</span><span>PO này <b>chưa xuất hoá đơn</b> — chưa có quota, chưa thể publish.</span>
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
                      const pr = CATALOG.find((c) => c.sku === ln.sku)
                      const left = ln.qty - ln.used
                      const spent = left <= 0
                      const on = sku === ln.sku
                      return (
                        <button
                          key={ln.sku}
                          onClick={() => !spent && setSku(ln.sku)}
                          disabled={spent}
                          className={cn('flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left', on ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30', spent && 'cursor-not-allowed opacity-50 hover:border-line')}
                        >
                          <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', on ? 'border-brand' : 'border-line')}>
                            {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/80')}>{pr?.name ?? ln.sku}</span>
                            <span className="block text-[10px] text-faint">{ln.used}/{ln.qty} đã dùng</span>
                          </span>
                          <span className={cn('shrink-0 text-[11px] font-semibold tabular-nums', spent ? 'text-rose-600' : 'text-ink')}>{spent ? 'hết lượt' : `${left} còn lại`}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {editing && <LField label="Sản phẩm" value={product?.name ?? 'Homepage pop-up'} hint={popup?.source === 'House' ? 'Popup nội bộ — không gắn PO nào.' : 'Đã chốt khi bán.'} />}

          <Section title={editing ? '1 · Thời gian hiển thị' : '3 · Thời gian hiển thị'} />
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
                  ? <>Ngày trong tương lai → <b className="text-ink/70">Schedule</b>. <button onClick={() => setStart('')} className="font-medium text-brand hover:underline">Xoá ngày — đăng ngay</button></>
                  : <>Để trống = đăng ngay → <b className="text-ink/70">Open</b> khi lưu.</>}
              </p>
            </div>
            {house && !editing ? (
              <div>
                <FLabel req>Ngày kết thúc</FLabel>
                <input
                  type="date"
                  value={houseEnd ? houseEnd.split('/').reverse().join('-') : ''}
                  onChange={(e) => setHouseEnd(e.target.value.split('-').reverse().join('/'))}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Nhập tay — popup nội bộ không có sản phẩm quy định thời lượng.</p>
              </div>
            ) : (
              <LField label="Ngày kết thúc" value={start ? `+${days} ngày từ ngày bắt đầu` : `— ${days} ngày sau ngày bắt đầu`} hint="Tính từ thời gian hiển thị của sản phẩm, không nhập tay." />
            )}
          </div>

          <div>
            <FLabel>Exposure</FLabel>
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
              <span className="min-w-0 flex-1 text-[11.5px] text-muted">
                {exposure === 'On' ? 'On — hiển thị cho đối tượng đã chọn.' : 'Off — giữ ẩn; lịch vẫn chạy và vẫn hết hạn đúng ngày.'}
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

          <div>
            <FLabel req>Ảnh popup</FLabel>
            <div className={cn('rounded-lg border border-dashed px-3 py-4 text-center', creativeLocked ? 'border-line bg-canvas/50' : 'border-line hover:border-brand/50')}>
              {file ? (
                <div className="flex items-center justify-center gap-2 text-[12px]">
                  <span className="truncate font-mono text-ink/80">{file}</span>
                  {!creativeLocked && <button onClick={() => setFile(null)} className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-muted hover:border-rose-300 hover:text-rose-600">Gỡ</button>}
                </div>
              ) : (
                <button onClick={() => setFile('popup-creative.jpg')} disabled={creativeLocked} className="text-[12px] font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:text-faint disabled:no-underline">
                  ⬆ Tải ảnh lên
                </button>
              )}
            </div>
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
