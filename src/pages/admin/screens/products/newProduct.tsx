import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ACTIVATE_WITHIN_DEFAULT, CATALOG, PLACEMENTS, PRODUCT_TYPES , SLOT_CONTENT } from '@/pages/admin/data/products'
import type { SlotContent } from '@/pages/admin/data/products'
import type { ProductTypeId } from '@/pages/admin/data/products'
import { FLabel, LField, Section, SelectField } from '@/pages/admin/ui/fields'

/* Create product. The type picker is step 1 because it changes the rest of the
   form — a placement needs a slot + calendar, a credit pack needs an amount, a
   manual service needs an SLA and an owner. One flat form can't express that. */
export function NewProductModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<ProductTypeId>('job')
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const [role, setRole] = useState<'main' | 'addon'>('main')
  /* A trial SKU is quotable only inside a trial quotation — see the catalog note. */
  const [trial, setTrial] = useState(false)
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Inactive')
  const [content, setContent] = useState<SlotContent>('banner')
  const [nameVi, setNameVi] = useState('')
  // Product ID auto-follows the name until someone types their own, then stops.
  const [skuEdited, setSkuEdited] = useState(false)
  /* Đơn vị tính prints on the quotation / PO line ("SL 2 tin"), so it is identity,
     not fulfilment. It follows the type until someone overrides it — the default is
     right almost always, but "gói" vs "tin" on a combo is a sales-language call. */
  const UNIT_DEFAULT: Record<ProductTypeId, string> = { job: 'tin', cv: 'gói', placement: 'slot', service: 'bài đăng' }
  const [unitManual, setUnitManual] = useState('')
  /* A Job-posting ADD-ON is a job enhancement, and there are exactly two kinds:
     a LABEL stamped on the job card, or a DISPLAY PLACEMENT that lifts the job
     into a premium homepage block. The kind decides what the picker below offers. */
  const [addonKind, setAddonKind] = useState<'label' | 'placement'>('placement')
  const jobAddon = type === 'job' && role === 'addon'
  const unit = unitManual || UNIT_DEFAULT[type]
  const [skuManual, setSkuManual] = useState('')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('50')
  // T&C clause 4 default. Stored per product, not read from a global setting.
  const [activate, setActivate] = useState(String(ACTIVATE_WITHIN_DEFAULT))
  // Only job-posting products can be the always-available (Admin-only) free tier.

  const autoSku = nameVi.trim()
    ? `${type.toUpperCase()}-${nameVi.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '').toUpperCase().slice(0, 12)}`
    : ''
  const sku = skuEdited ? skuManual : autoSku
  const setSku = setSkuManual

  const priceNum = Number(price.replace(/\D/g, ''))
  const amountNum = Number(amount.replace(/\D/g, ''))
  const perCv = priceNum > 0 && amountNum > 0 ? Math.round(priceNum / amountNum) : null
  const vnd = (n: number) => n.toLocaleString('vi-VN')

  // A name is all an Inactive product needs. Setting it Active also requires a
  // price — the one rule the spec keeps, checked on Save rather than by a button.
  // The free tier is the deliberate exception: it is never sold, so it has no price
  // to require, and demanding one would make it impossible to activate at all.
  const valid = nameVi.trim().length > 0 && (status === 'Inactive' || priceNum > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[620px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">New product</p>
            <p className="text-[11px] text-muted">A product is the sellable SKU — price + terms. What it grants comes from its type.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          <Section title="1 · Type" className="mt-0" />
          <div className="grid gap-1.5">
            {PRODUCT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
                  type === t.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30',
                )}
              >
                <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', type === t.id ? 'border-brand' : 'border-line')}>
                  {type === t.id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-[12.5px] font-semibold', type === t.id ? 'text-brand' : 'text-ink')}>{t.label}</span>
                  <span className="block text-[11px] leading-relaxed text-muted">{t.blurb}</span>
                  <span className="block text-[10.5px] text-faint">e.g. {t.eg}</span>
                </span>
              </button>
            ))}
          </div>

          <Section title="2 · Identity" />
          {/* One name — the internal/sales name sales and admin both use. Only the
              customer-facing description is translated (see its own tab below). */}
          <div>
            <FLabel req>Name</FLabel>
            <input
              value={nameVi}
              onChange={(e) => setNameVi(e.target.value)}
              placeholder="e.g. Tin Top Job"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
          </div>
          <div>
            <FLabel req>Product ID<span className="ml-1 font-normal text-faint">auto-generated — edit only if you need a specific code</span></FLabel>
            <input
              value={sku}
              onChange={(e) => { setSkuEdited(true); setSku(e.target.value.toUpperCase()) }}
              placeholder={autoSku || `${type.toUpperCase()}-…`}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              {skuEdited ? 'Manual — ' : 'Follows the name — '}
              locked after the first sale, because quotations, orders and invoices reference it.
            </p>
          </div>
          <div>
            <FLabel req>Đơn vị tính<span className="ml-1 font-normal text-faint">in trên dòng báo giá / PO — ví dụ “SL 2 {unit}”</span></FLabel>
            <select
              value={unit}
              onChange={(e) => setUnitManual(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
            >
              {['tin', 'gói', 'slot', 'bài đăng'].map((u) => (
                <option key={u} value={u}>{u}{u === UNIT_DEFAULT[type] ? ' — mặc định theo loại' : ''}</option>
              ))}
            </select>
          </div>
          {/* Applies to EVERY type, so it lives in Identity rather than inside one
              branch. Three values, not two: the fanpage post and the email send are
              genuinely sold BOTH ways (4.000.000 ₫ / 20.000.000 ₫ standalone) AND
              included inside Top Job — a binary flag would force duplicating them. */}
          <div>
            <FLabel req>Role</FLabel>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {([
                ['main', 'Main product', 'Quotable on its own — and still includable in other products'],
                ['addon', 'Add-on', 'Only via Includes — hidden from the quotation picker'],
              ] as const).map(([id, label, hint]) => (
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', role === id ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                >
                  <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', role === id ? 'border-brand' : 'border-line')}>
                    {role === id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-[12px] font-semibold', role === id ? 'text-brand' : 'text-ink')}>{label}</span>
                    <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            {role !== 'main' && (
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                Appears in the <b className="text-ink/70">Includes</b> picker when any product is created.
                {role === 'addon' && ' Never shown as a quotation line — it reaches a customer only inside a Main product.'}
              </p>
            )}
            {/* Sits under Role because the two answer the same question — WHERE this
                product may be quoted. A trial SKU is not a discount and not a gift:
                it is a cheap product, offered only inside a trial quotation. */}
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px]">
              <input type="checkbox" checked={trial} onChange={(e) => setTrial(e.target.checked)} className="h-3.5 w-3.5 shrink-0" />
              <span className={cn('font-medium', trial ? 'text-brand' : 'text-ink')}>Sản phẩm dùng thử / Trial product</span>
            </label>
          </div>

          {/* Status is a plain field with one Save, not a set of transition buttons —
              simplest model: two values, edited like any other attribute. */}
          <div>
            <FLabel req>Status</FLabel>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {([
                ['Active', 'Sellable — can be quoted and ordered'],
                ['Inactive', 'Not sellable — hidden from quotations'],
              ] as const).map(([v, hint]) => (
                <button
                  key={v}
                  onClick={() => setStatus(v)}
                  className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', status === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                >
                  <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', status === v ? 'border-brand' : 'border-line')}>
                    {status === v && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-[12px] font-semibold', status === v ? 'text-brand' : 'text-ink')}>{v}</span>
                    <span className="block text-[10px] leading-relaxed text-faint">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            {status === 'Active' && !priceNum && (
              <p className="mt-1 text-[10.5px] leading-relaxed text-amber-700">An Active product needs a price — Save is blocked until one is set.</p>
            )}
          </div>

          {/* The ONLY translated field: it is printed on the quotation and the PO,
              which go out in the customer's language. Everything else on this form is
              internal, so it needs one value, not two. */}
          <div>
            <div className="mb-1 flex items-end justify-between gap-2">
              <FLabel req={lang === 'VI'}>Product description</FLabel>
              <div className="mb-1 inline-flex shrink-0 overflow-hidden rounded-md border border-line">
                {(['VI', 'EN'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn('px-2 py-0.5 text-[10.5px] font-medium transition-colors', lang === l ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')}
                  >
                    {l === 'VI' ? 'Tiếng Việt' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-faint" style={{ minHeight: 60 }}>
              {lang === 'VI' ? 'In trên báo giá và PO — danh sách quyền lợi khách hàng đọc.' : 'Printed on the quotation and the PO — the benefit list the customer reads.'}
            </div>
          </div>

          <Section title="3 · Settings" />
          {/* Applies to EVERY type, so it comes before the branches. Three clocks
              get confused with each other constantly, so the hint below names all
              three and says which one this field is. */}
          <div>
              <FLabel req>
                Thời gian phải kích hoạt — kể từ ngày xuất hóa đơn
                <span className="ml-1 font-normal text-faint">T&amp;C điều 4</span>
              </FLabel>
              <select
                value={activate}
                onChange={(e) => setActivate(e.target.value)}
                className="w-full cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
              >
                {[3, 6, 12, 18, 24].map((m) => (
                  <option key={m} value={m}>{m} tháng{m === ACTIVATE_WITHIN_DEFAULT ? ' — mặc định (T&C điều 4)' : ''}</option>
                ))}
              </select>
              <p className="mt-1 rounded-md bg-canvas/70 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-muted">
                Ba mốc thời gian khác nhau — đây là mốc <b className="text-ink/75">thứ hai</b>:
                <br />① <b className="text-ink/75">Cấp quota</b> — ngay khi xuất hóa đơn.
                <br />② <b className="text-ink/75">Phải kích hoạt trong {activate} tháng</b> kể từ ngày hóa đơn, nếu không quota chưa dùng sẽ hết hạn.
                <br />③ <b className="text-ink/75">Sau khi kích hoạt</b>, mỗi slot chạy theo thời gian hiển thị / hiệu lực riêng bên dưới.
              </p>
            </div>
          {/* There is no separate "tier config" screen: THIS product IS the tier
              definition. Display duration, refresh cadence and the placements it
              feeds are editable here, and because there is exactly one Top Job
              product (segments are a price list, not extra products), what Top Job
              grants can only be defined in one place. */}
          {jobAddon && (
            <>
              {/* No Auto-refresh here: refresh cadence belongs to the TIER that owns
                  the job. An add-on only enhances it, for its own duration. */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Thời gian hiển thị (days)" req value="10 ngày" select />
                <div>
                  <FLabel req>Add-on type</FLabel>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {([
                      ['label', 'Label', 'Nhãn gắn trên tin'],
                      ['placement', 'Display placement', 'Đưa job vào vị trí premium'],
                    ] as const).map(([id, label, hint]) => (
                      <button
                        key={id}
                        onClick={() => setAddonKind(id)}
                        className={cn('rounded-lg border px-2.5 py-1.5 text-left transition-colors', addonKind === id ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                      >
                        <span className={cn('block text-[11.5px] font-medium', addonKind === id ? 'text-brand' : 'text-ink')}>{label}</span>
                        <span className="block text-[10px] leading-tight text-faint">{hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {addonKind === 'placement' ? (
                <div>
                  <FLabel req>Placement slot<span className="ml-1 font-normal text-faint">chỉ các slot có khối premium dành cho add-on</span></FLabel>
                  <div className="space-y-1.5">
                    {PLACEMENTS.filter((x) => x.route === 'both').map((x, i) => {
                      const on = i === 0
                      return (
                        <div key={x.id} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5', on ? 'border-brand bg-brand-soft' : 'border-line')}>
                          <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', on ? 'border-brand' : 'border-line')}>
                            {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/70')}>{x.name}</span>
                            <span className="block text-[10px] text-faint">{x.page} · {x.cap}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                    Vị trí premium là hàng có hạn (4–5 chỗ cố định) — bán add-on này phải qua kiểm tra chỗ trống, như mọi booking.
                  </p>
                </div>
              ) : (
                <div>
                  <FLabel req>Label<span className="ml-1 font-normal text-faint">nhãn hiển thị trên tin ở trang tìm kiếm & trang chủ</span></FLabel>
                  <div className="space-y-1.5">
                    {([
                      ['Hot job', 'Nhãn “HOT” đỏ trên tin — theo deck: 10 ngày đầu', true],
                      ['Super star', 'Nhãn “SUPER STAR” — tin nổi bật của tuần', false],
                    ] as const).map(([name, hint, on]) => (
                      <div key={name} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5', on ? 'border-brand bg-brand-soft' : 'border-line')}>
                        <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', on ? 'border-brand' : 'border-line')}>
                          {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/70')}>{name}</span>
                          <span className="block text-[10px] text-faint">{hint}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                    Danh sách label quản lý ở Master data — thêm nhãn mới không cần sửa form này.
                  </p>
                </div>
              )}
            </>
          )}
          {type === 'job' && !jobAddon && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Thời gian hiển thị (days)" req value="30 ngày" />
                <LField label="Auto-refresh" req value="Daily for 7 days, then every 5 days" select />
              </div>
              {/* "Posting slots sold" removed: a product defines what ONE posting
                  is; how many the customer buys is a quantity on the quotation line. */}

              <div>
                <FLabel req>Placement slots — where a job of this tier appears<span className="ml-1 font-normal text-faint">from the Placements registry</span></FLabel>
                <div className="space-y-1.5">
                  {PLACEMENTS.filter((x) => x.route !== 'booked').map((x, i) => {
                    const on = i < 4
                    return (
                      <div key={x.id} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5', on ? 'border-brand bg-brand-soft' : 'border-line')}>
                        <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on && <span className="text-[9px] leading-none">✓</span>}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/70')}>{x.name}</span>
                          <span className="block text-[10px] text-faint">{x.page} · {x.shown}</span>
                        </span>
                        {on && (
                          <select
                            defaultValue={x.id === 'home-super-hot' ? '10' : 'full'}
                            className="shrink-0 rounded border border-line bg-surface px-1.5 py-1 text-[10.5px] text-ink/80 outline-none focus:border-brand"
                          >
                            <option value="full">Toàn bộ thời gian hiển thị</option>
                            <option value="5">5 ngày đầu</option>
                            <option value="7">7 ngày đầu</option>
                            <option value="10">10 ngày đầu</option>
                            <option value="15">15 ngày đầu</option>
                            <option value="30">30 ngày</option>
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Composition is for products a customer buys. An Add-on is reached
                  only through a parent, so letting it include further products would
                  nest includes and make provisioning ambiguous. */}
              {role !== 'addon' && (
              <div>
                {/* "Add-on products" was wrong: there is no add-on class. These are
                    ordinary catalog products — Services, created in admin like any
                    other — that this product grants along with itself. Hence Includes. */}
                <FLabel>Includes / Bán kèm<span className="ml-1 font-normal text-faint">products granted together with this one — create them in the catalog first</span></FLabel>
                {/* Manual services + Job-posting add-ons (labels, premium positions).
                    Bookable PLACEMENT products are excluded: a tier feeds registry
                    areas via the section above, never by including a slot rental. */}
                <div className="space-y-1.5">
                  {CATALOG.filter((c) => c.type === 'Manual service' || (c.type === 'Job posting' && c.role === 'Add-on')).map((c, i) => {
                    const on = i < 2
                    return (
                      <div key={c.sku} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5', on ? 'border-brand bg-brand-soft' : 'border-line')}>
                        <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on && <span className="text-[9px] leading-none">✓</span>}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate text-[12px]', on ? 'font-medium text-brand' : 'text-ink/70')}>{c.name}</span>
                          <span className="block text-[10px] text-faint">{c.type} · sold separately at {c.price.replace(' ⓒ', '')}</span>
                        </span>
                        {on && (
                          <span className="flex shrink-0 items-center gap-1">
                            <span className="text-[10px] text-faint">SL</span>
                            <select defaultValue="1" className="rounded border border-line bg-surface px-1.5 py-1 text-[10.5px] text-ink/80 outline-none focus:border-brand">
                              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Included, not bundled: the customer sees ONE line “Tin Top Job” on the quotation. Paying it fires each include as an ops task at the quantity set here.</p>
              </div>
              )}

            </>
          )}
          {type === 'placement' && (
            <>
              {/* Options come from the Placements registry — the same list the
                  jobseeker site renders, so a sale can't invent a slot. */}
              <SelectField
                label="Placement slot"
                req
                value={`${PLACEMENTS[0].name} — ${PLACEMENTS[0].page} (${PLACEMENTS[0].size})`}
                options={PLACEMENTS.filter((p) => p.route !== 'tier').map((p) => `${p.name} — ${p.page} (${p.size})`)}
                extra={<span className="ml-1 font-normal text-faint">— tier-driven areas are excluded; they aren’t bookable</span>}
              />
              {/* WHAT fills the slot — decides what publishing will ask for. "Job
                  hiển thị trên trang chủ" is a placement whose content is a JOB, not
                  a banner: same booking mechanics, no creative upload. */}
              <div>
                <FLabel req>Nội dung hiển thị</FLabel>
                <div className="grid gap-1.5 sm:grid-cols-3">
                  {(Object.keys(SLOT_CONTENT) as SlotContent[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setContent(c)}
                      className={cn('rounded-lg border px-2.5 py-1.5 text-left transition-colors', content === c ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
                    >
                      <span className={cn('block text-[11.5px] font-medium', content === c ? 'text-brand' : 'text-ink')}>{SLOT_CONTENT[c].vi}</span>
                      <span className="block text-[10px] leading-tight text-faint">{SLOT_CONTENT[c].needs}</span>
                    </button>
                  ))}
                </div>
                {content === 'job' && (
                  <p className="mt-1 rounded-md bg-canvas/70 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-muted">
                    Hai đồng hồ, đừng nhầm: job chạy <b className="text-ink/70">30 ngày</b> theo tin đăng; booking này chỉ giữ chỗ
                    trang chủ <b className="text-ink/70">10 ngày</b>. Hết booking, job vẫn chạy tiếp trên trang tìm kiếm.
                  </p>
                )}
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Thời gian hiển thị (days)" req value="10 ngày" select />
                <LField label="Slots consumed" value="1 of 6 in rotation" />
              </div>

              {/* The pool cap is 6, so the only question sales actually has is
                  "is this slot free when the customer wants it?". Answering that at
                  the point of sale is what stops overselling. */}
            </>
          )}
          {type === 'cv' && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <FLabel req>Amount</FLabel>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="50" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
                </div>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Validity" req value="30 days" select hint="Deck sells 30-day and 90-day packs." />
              </div>
            </>
          )}
          {type === 'service' && (
            <>
              {/* What ONE unit of this service delivers. Quantity + unit rather than a
                  hardcoded label, so the same type covers a fanpage post, an email
                  send and a banner without needing a new product type each time. */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Số lượng" req value="1" />
                <LField label="Đơn vị" req value="bài đăng" select hint="bài đăng · email · lượt gửi · banner" />
              </div>
              <p className="rounded-md bg-brand-soft px-3 py-2 text-[11px] leading-relaxed text-brand">
                Paying this does <b>not</b> auto-provision quota. It opens a fulfilment task (Requested → Scheduled → Delivered) and needs proof-of-delivery before the line counts as fulfilled.
              </p>
            </>
          )}

          <Section title="4 · Pricing" />
          {/* HOW the product reaches a job, stored rather than inferred from price:
              a promo line can be 0 ₫ and still be consumed from a PO, so deriving
              "postable anytime" from price == 0 would turn every freebie into an
              unlimited loophole. Job-posting products only. */}
          {/* One product, a price PER SEGMENT — this is what replaces the CRM's
              separate "… SMEs / … Enterprise / … New 2024" records, so what a
              product grants is defined once. The record shows the same three rows. */}
          {/* ONE price, every type. Segment pricing (SME / Enterprise / Standard) was
              here but is out of scope for now — see the note in the record. An Add-on
              is never quoted, so its figure is labelled internal rather than list. */}
          <div>
            <FLabel req={role !== 'addon'}>
              {role === 'addon' ? 'Giá trị nội bộ (₫)' : 'Price (₫)'}
              {role === 'addon' && <span className="ml-1 font-normal text-faint">internal value — not quotable</span>}
            </FLabel>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              placeholder="3700000"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              {priceNum > 0 && <span className="text-ink/70">{vnd(priceNum)} ₫ · </span>}
              {role === 'addon'
                ? 'Attributes margin inside the parent product. Never printed on a quotation.'
                : 'The catalogue list price. A quotation may discount from it; this is the anchor.'}
            </p>
          </div>
          {type === 'cv' && (
            <p className="rounded-md bg-canvas/70 px-3 py-2 text-[11px] text-muted">
              Average per CV: <b className="text-ink/80">{perCv ? `~${vnd(perCv)} ₫ / CV` : '— enter price and amount'}</b> — computed, never typed. This is the number the deck sells on.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  )
}
