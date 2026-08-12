/*
 * Working locations — the job form picks from a saved office book, it does not type.
 *
 * The change that matters here is the NAME. A location used to be city + address, and
 * both of those are useless as labels: a company with three sites in Hồ Chí Minh gets
 * three identical rows, and an address is too long to read inside a dropdown. The name
 * ("Trụ sở chính", "Nhà máy Bình Dương") is what an HR user actually recognises, so it
 * is what the picker shows first.
 *
 * NONE of the three create-modal fields is required (BA decision) — the form does not
 * block on a missing name, it just ends up with a location that is harder to tell
 * apart, and `locLabel` falls back to the address and then the province so the picker
 * still renders. The only refusals left are a completely empty record and a duplicate
 * name, and the duplicate check only runs when a name was actually typed.
 *
 * Offices are saved on the COMPANY, not on the job. A company posts the same job from
 * the same three sites all year; retyping the address every time is where typos and
 * "Q.1" / "Quận 1" / "District 1" duplicates come from. Create once, reuse — and when
 * the office moves, one edit fixes every live job.
 */
import { useState } from 'react'
import { MapPin, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OfficeLocation {
  id: string
  /** Optional. The label everywhere a location is listed — see `locLabel`. */
  name: string
  city: string
  address: string
}

export const NAME_MAX = 50
export const ADDRESS_MAX = 120
export const LOCATIONS_MAX = 3

/** Province list is Master data; this is the short demo slice. */
export const VN_PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Bắc Ninh', 'Hưng Yên', 'Quảng Ninh',
  'Khánh Hoà', 'Nghệ An', 'Thừa Thiên Huế', 'Long An', 'Vĩnh Phúc',
]

/** The label in dropdowns and lists. The NAME is what an HR user recognises, but it
    is optional, so fall back to the address and finally the province — a nameless
    office must still be pickable, just harder to tell apart. */
export const locLabel = (o: OfficeLocation) => o.name.trim() || o.address.trim() || o.city

/** The muted second line. Skips whatever `locLabel` already used, so an unnamed
    office does not read "55 Nguyễn Huệ · Hà Nội · 55 Nguyễn Huệ". */
export const locSub = (o: OfficeLocation) =>
  [o.city, o.address.trim()].filter((s) => s && s !== locLabel(o)).join(' · ')

export const DEMO_OFFICES: OfficeLocation[] = [
  { id: 'hq', name: 'Trụ sở chính', city: 'Hồ Chí Minh', address: 'Burning Bros D2 · 69 Võ Nguyên Giáp, Thảo Điền, Quận 2' },
  { id: 'hn', name: 'Văn phòng Hà Nội', city: 'Hà Nội', address: 'Tầng 12 Keangnam, Phạm Hùng, Nam Từ Liêm' },
  { id: 'bd', name: 'Nhà máy Bình Dương', city: 'Bình Dương', address: 'Lô B2, KCN VSIP II, Thủ Dầu Một' },
]

/* ── the field ──────────────────────────────────────────────────────────── */

export function WorkingLocationsField({
  max = LOCATIONS_MAX,
  initial = ['hq'],
}: { max?: number; initial?: string[] }) {
  const [book, setBook] = useState<OfficeLocation[]>(DEMO_OFFICES)
  /** '' = a row that has been added but not chosen yet. */
  const [rows, setRows] = useState<string[]>(initial)
  const [open, setOpen] = useState<number | null>(null)
  /** index of the row the create-modal will fill, or null when closed. */
  const [creating, setCreating] = useState<number | null>(null)

  const byId = (id: string) => book.find((o) => o.id === id)
  const setRow = (i: number, id: string) => setRows((r) => r.map((x, j) => (j === i ? id : x)))

  const create = (o: Omit<OfficeLocation, 'id'>) => {
    const office = { ...o, id: `loc-${book.length + 1}` }
    setBook((b) => [...b, office])
    if (creating !== null) setRow(creating, office.id)
    setCreating(null)
    setOpen(null)
  }

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <label className="text-[11.5px] font-medium text-ink/80">
          Working location <span className="text-rose-500">*</span>
        </label>
        <span className="ml-auto text-[10.5px] text-faint">{rows.length}/{max}</span>
      </div>

      <div className="space-y-1.5">
        {rows.map((id, i) => {
          const loc = byId(id)
          return (
            <div key={i} className="flex items-start gap-1.5">
              <div className="relative min-w-0 flex-1">
                <button
                  onClick={() => setOpen((o) => (o === i ? null : i))}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md border bg-surface px-3 py-2 text-left',
                    open === i ? 'border-brand' : 'border-line',
                  )}
                >
                  <MapPin className={cn('h-3.5 w-3.5 shrink-0', loc ? 'text-brand' : 'text-faint')} />
                  {loc ? (
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink/80">
                      <b className="font-semibold text-ink">{locLabel(loc)}</b>
                      {locSub(loc) && <span className="text-faint"> · {locSub(loc)}</span>}
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-faint">Select a working location…</span>
                  )}
                  <span className="shrink-0 text-faint">▾</span>
                </button>

                {open === i && (
                  <>
                    <span className="fixed inset-0 z-10" onClick={() => setOpen(null)} />
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-lg">
                      <div className="max-h-56 overflow-auto py-1">
                        {book.map((o) => {
                          /* the same office twice on one job says nothing — block it here
                             rather than validating on save */
                          const used = rows.includes(o.id) && o.id !== id
                          return (
                            <button
                              key={o.id}
                              disabled={used}
                              onClick={() => { setRow(i, o.id); setOpen(null) }}
                              className={cn(
                                'block w-full px-3 py-1.5 text-left hover:bg-canvas',
                                o.id === id && 'bg-brand-soft',
                                used && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                              )}
                            >
                              <p className={cn('truncate text-[12px] font-semibold', o.id === id ? 'text-brand' : 'text-ink')}>
                                {locLabel(o)}
                                {used && <span className="ml-1.5 font-normal text-faint">— đã chọn</span>}
                              </p>
                              <p className="truncate text-[11px] text-faint">{locSub(o)}</p>
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => setCreating(i)}
                        className="flex w-full items-center gap-1.5 border-t border-line-soft bg-canvas/50 px-3 py-2 text-left text-[12px] font-medium text-brand hover:bg-brand-soft"
                      >
                        <Plus className="h-3.5 w-3.5" /> Create a new location
                      </button>
                    </div>
                  </>
                )}
              </div>

              {rows.length > 1 && (
                <button
                  onClick={() => { setRows((r) => r.filter((_, j) => j !== i)); setOpen(null) }}
                  title="Remove this location"
                  className="shrink-0 rounded-md border border-line px-2 py-2 text-muted hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {rows.length < max && (
        <button onClick={() => setRows((r) => [...r, ''])} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-brand">
          <Plus className="h-3.5 w-3.5" /> Add a working location
        </button>
      )}

      <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
        Địa điểm được lưu ở <b className="text-ink/70">hồ sơ công ty</b> và dùng lại cho mọi tin — tạo một lần, các tin sau chỉ chọn.
        Nên đặt <b className="text-ink/70">tên cho địa điểm</b>: một công ty có nhiều văn phòng cùng tỉnh/thành thì chỉ tên mới phân biệt được.
      </p>

      {creating !== null && <NewLocationModal onCancel={() => setCreating(null)} onCreate={create} taken={book.map((o) => o.name)} />}
    </div>
  )
}

/* ── create modal ───────────────────────────────────────────────────────── */

function NewLocationModal({
  onCancel, onCreate, taken,
}: { onCancel: () => void; onCreate: (o: Omit<OfficeLocation, 'id'>) => void; taken: string[] }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('Hà Nội')
  const [address, setAddress] = useState('')
  const [cityOpen, setCityOpen] = useState(false)

  /* No field is required — BA decision. The only thing still refused is a record
     with nothing in it at all (which would add a blank row to the office book
     forever) and a duplicate NAME, which is only checked when a name was typed. */
  const dupe = name.trim().length > 0 && taken.some((t) => t.trim().toLowerCase() === name.trim().toLowerCase())
  const ok = (name.trim().length > 0 || address.trim().length > 0) && !dupe

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-10 w-full max-w-[560px] overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
        <div className="border-b border-line px-5 py-3.5">
          <p className="text-[14px] font-bold">Create a new location</p>
          <p className="text-[11px] text-muted">Lưu vào hồ sơ công ty — các tin tuyển dụng sau chọn lại, không phải nhập lại.</p>
        </div>

        <div className="space-y-3 px-5 py-4">
          <ModalRow label="Office Name">
            <input
              autoFocus
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="Trụ sở chính, Nhà máy Bình Dương…"
              className={cn(
                'w-full rounded-md border bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint',
                dupe ? 'border-rose-400' : 'border-line focus:border-brand',
              )}
            />
            <div className="mt-0.5 flex items-baseline gap-2">
              {dupe && <span className="text-[10.5px] text-rose-600">Tên này đã có — mỗi địa điểm một tên riêng.</span>}
              <span className="ml-auto text-[10.5px] text-faint">{name.length}/{NAME_MAX} character(s)</span>
            </div>
          </ModalRow>

          <ModalRow label="City/Province">
            <div className="relative">
              <button
                onClick={() => setCityOpen((o) => !o)}
                className={cn('flex w-full items-center rounded-md border bg-surface px-3 py-2 text-left text-[12.5px] text-ink', cityOpen ? 'border-brand' : 'border-line')}
              >
                {city}<span className="ml-auto text-faint">▾</span>
              </button>
              {cityOpen && (
                <>
                  <span className="fixed inset-0 z-10" onClick={() => setCityOpen(false)} />
                  <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-line bg-surface py-1 shadow-lg">
                    {VN_PROVINCES.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setCity(p); setCityOpen(false) }}
                        className={cn('block w-full px-3 py-1.5 text-left text-[12px] hover:bg-canvas', p === city ? 'bg-brand-soft font-medium text-brand' : 'text-ink/80')}
                      >{p}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ModalRow>

          <ModalRow label="Office Address">
            <input
              value={address}
              maxLength={ADDRESS_MAX}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-0.5 text-right text-[10.5px] text-faint">{address.length}/{ADDRESS_MAX} character(s)</p>
          </ModalRow>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line bg-canvas/40 px-5 py-3">
          <button onClick={onCancel} className="rounded-md border border-line bg-surface px-4 py-1.5 text-[12px] font-medium text-ink/80 hover:bg-canvas">Cancel</button>
          <button
            disabled={!ok}
            onClick={() => onCreate({ name: name.trim(), city, address: address.trim() })}
            className={cn(
              'rounded-md px-5 py-1.5 text-[12px] font-semibold text-white',
              ok ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-brand/40',
            )}
          >Create</button>
        </div>
      </div>
    </div>
  )
}

function ModalRow({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
      <label className="pt-2 text-[11.5px] font-medium text-ink/80 sm:w-32 sm:shrink-0 sm:text-right">
        {label}{req && <span className="text-rose-500"> *</span>}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
