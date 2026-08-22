import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { BUYER_TYPE, RETAIL_BUYER, coLabel } from '@/pages/admin/data/companies'
import type { BuyerType, Company } from '@/pages/admin/data/companies'
import { MST_ROOT_MATCHES } from '@/pages/admin/data/sales'
import { MD_DOMAINS } from '@/pages/admin/data/system'
import { ComboField, LField } from '@/pages/admin/ui/fields'
import { JobGroup } from '@/pages/admin/ui/form'
import { Pill } from '@/pages/admin/ui/status'

/** One row of the MST-root suggestion list, with its two link directions. */
function MstMatchRow({ m, rel, onSet }: {
  m: typeof MST_ROOT_MATCHES[number]
  rel: 'none' | 'parent' | 'child'
  onSet: (r: 'none' | 'parent' | 'child') => void
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2', rel === 'none' ? 'border-line bg-surface' : 'border-brand/40 bg-brand-soft/50')}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-ink">{m.name}</p>
        <p className="truncate text-[10.5px] text-faint">MST {m.tax} · {m.where} · {m.owner}</p>
      </div>
      {/* Two directions, and they have different cardinality on purpose: the new
          company has at most ONE parent, but can be the parent of MANY of these. */}
      <div className="flex shrink-0 overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
        <button onClick={() => onSet(rel === 'child' ? 'none' : 'child')} className={cn('px-2 py-1', rel === 'child' ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')} title="Công ty đang tạo là công ty con của công ty này">↑ Là con của</button>
        <button onClick={() => onSet(rel === 'parent' ? 'none' : 'parent')} className={cn('border-l border-line px-2 py-1', rel === 'parent' ? 'bg-brand text-white' : 'text-muted hover:bg-canvas')} title="Công ty đang tạo là công ty mẹ của công ty này">↓ Là mẹ của</button>
      </div>
    </div>
  )
}

/**
 * New-company screen — a full page, not a modal: it is long enough that a rep needs
 * the whole viewport, and it can be linked to and reloaded.
 *
 * `lockedParent` pre-fills the parent as a fixed row. Nothing sets it today: the
 * "+ Thêm công ty con" shortcut was removed so that every company is created
 * through this one page and passes the same MST duplicate check — a second create
 * path is a second way to make a duplicate. The prop stays because the linked-from-
 * parent flow is a plausible addition; the group link itself is made with
 * "Gán quan hệ mẹ / con" on the company record.
 */
export function CompanyCreatePage({ onBack, lockedParent }: { onBack: () => void; lockedParent?: Company }) {
  useDetailCrumb(lockedParent ? `Thêm công ty con · ${coLabel(lockedParent)}` : 'New company', onBack)
  /* Quốc tịch drives whether the Vietnamese province picker is shown at all. */
  const [country, setCountry] = useState('Việt Nam')
  /* Which invoice shape this buyer takes — it decides whether MST is required and
     whether the CCCD / buyer-name pair is asked for at all. */
  const [buyer, setBuyer] = useState<BuyerType>('dn-vn')
  /** An individual buyer has no Tên đơn vị and no MST — the person replaces both. */
  const isIndiv = buyer === 'ca-nhan-cccd' || buyer === 'ca-nhan'
  const [tax, setTax] = useState('')
  const [looking, setLooking] = useState(false)
  const [looked, setLooked] = useState(false)
  /* Which of the same-tax-root companies this new record links to, and in which
     direction. Keyed by company name; at most one 'child' entry can exist. */
  const [rels, setRels] = useState<Record<string, 'none' | 'parent' | 'child'>>({})
  const [docs, setDocs] = useState<string[]>([])
  const isVN = country.trim().toLowerCase().startsWith('việt nam') || country.trim().toLowerCase() === 'vietnam'
  const rootHit = tax.replace(/\D/g, '').length >= 10
  const parentPick = Object.entries(rels).find(([, r]) => r === 'child')?.[0]
  const childPicks = Object.entries(rels).filter(([, r]) => r === 'parent').map(([n]) => n)

  const setRel = (name: string, r: 'none' | 'parent' | 'child') =>
    setRels((prev) => {
      const next = { ...prev }
      // only ONE parent is possible, so choosing a new one releases the old
      if (r === 'child') for (const k of Object.keys(next)) if (next[k] === 'child') next[k] = 'none'
      next[name] = r
      return next
    })

  const lookup = () => {
    setLooking(true)
    window.setTimeout(() => { setLooking(false); setLooked(true) }, 700)
  }

  return (
    <div className="max-w-[860px] pb-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-tight">{lockedParent ? 'Thêm công ty con' : 'New company'}</h2>
        <Pill tone="draft">Draft</Pill>
      </div>

      <div className="space-y-8">
        {/* TWO groups, because the fields answer two different questions. "Who is
            this company to us" is how a rep finds and talks about them; "what must
            print on their invoice" is a fiscal contract. Mixing them is what had a
            rep filling in a tax code between a brand name and an industry. */}
        <JobGroup title="Thông tin xuất hóa đơn">
          {/* FIRST in the group, because it decides which of the fields below even
              exist. Asking for a tax code and then removing the field is worse than
              asking one question up front. */}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Phân loại người mua <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(BUYER_TYPE) as BuyerType[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setBuyer(k)}
                  className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', buyer === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}
                >
                  {BUYER_TYPE[k].vi}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{BUYER_TYPE[buyer].hint}</p>
          </div>

          {/* The NAME line, and which one it is depends on the buyer. For a company
              it is the legal name; for an individual the person REPLACES it — an
              individual has no Tên đơn vị, and leaving an empty company-name field
              on the form invites someone to type the person's name into it. */}
          {isIndiv ? (
            buyer === 'ca-nhan'
              ? (
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Họ tên người mua hàng</label>
                  <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2 text-[12.5px] text-muted">
                    <span className="font-medium text-ink/70">{RETAIL_BUYER}</span>
                    <span className="ml-auto shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px]">hệ thống tự điền</span>
                  </div>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Cá nhân không có CCCD — hóa đơn in đúng câu này. Không nhập tay, không sửa.</p>
                </div>
              )
              : <LField label="Họ tên người mua hàng" req value="Nguyễn Văn A" hint="In vào dòng “Họ tên người mua hàng” trên hóa đơn. Cá nhân không có Tên đơn vị." />
          ) : (
            <LField label="Tên đơn vị / Legal name" req value="Công ty TNHH …" hint="Đúng như trên giấy phép — in vào dòng “Tên đơn vị” trên hóa đơn VAT." />
          )}

          {/* MST exists only for a Vietnamese company. A foreign company has no
              Vietnamese tax code and an individual has none at all, so the field is
              REMOVED rather than shown empty with a note — an input nobody may fill
              is a question the form should not have asked. */}
          {BUYER_TYPE[buyer].tax === 'req' && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Mã số thuế (MST) <span className="text-rose-500">*</span></label>
              <div className="flex gap-1.5">
                <input value={tax} onChange={(e) => { setTax(e.target.value); setLooked(false) }} placeholder="0328xxxxxx-001" className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
                <button onClick={lookup} disabled={!rootHit || looking} className={cn('shrink-0 rounded-md px-2.5 py-2 text-[11.5px] font-semibold', rootHit && !looking ? 'bg-brand text-white hover:opacity-90' : 'cursor-not-allowed bg-canvas text-faint')}>
                  {looking ? 'Đang tra…' : 'Tra cứu'}
                </button>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">10 số, hoặc 10 số + “-001” nếu là chi nhánh.</p>
            </div>
          )}
          {buyer === 'dn-nn' && (
            <p className="rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
              Doanh nghiệp nước ngoài <b className="text-ink">không có MST Việt Nam</b> — không hỏi mã số thuế. Hóa đơn vẫn cần <b className="text-ink">tên đơn vị</b> và <b className="text-ink">địa chỉ xuất hóa đơn</b>.
            </p>
          )}

          {/* CCCD is the individual's identifier and is never stored in the MST
              field — different format, different legal meaning. */}
          {BUYER_TYPE[buyer].needsIdCard && (
            <LField label="Số CCCD" req value="079xxxxxxxxx" hint="Căn cước công dân — in vào dòng “Căn cước công dân”. Không dùng ô MST." />
          )}

          {/* No address for a buyer who provided nothing — see the note below. */}
          {!BUYER_TYPE[buyer].noAddress && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Địa chỉ xuất hóa đơn <span className="text-rose-500">*</span></label>
              <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{isVN ? 'Số nhà, tên đường, phường/xã, quận/huyện' : 'Street, city, postal code, country'}</div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                In trên báo giá, đơn hàng và hóa đơn VAT. Bắt buộc với các phân loại còn lại, kể cả doanh nghiệp nước ngoài không có MST. Được viết tắt các danh từ thông dụng (P, TP, VN, CP, TNHH, KCN, CN…) miễn còn xác định chính xác địa chỉ.
              </p>
            </div>
          )}
          {/* The consequence the customer feels, straight from the decree: an invoice
              with no buyer information cannot be used by an organisation to record an
              expense or in a tax settlement. A rep picking this for someone who is
              really buying for a company has just guaranteed a re-issue request. */}
          {BUYER_TYPE[buyer].noAddress && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
              Khối người mua chỉ có một dòng <b>“{RETAIL_BUYER}”</b> — không MST, không CCCD, không địa chỉ.
              <b className="mt-1 block">Hóa đơn này khách KHÔNG dùng để hạch toán chi phí hay quyết toán thuế được</b>
              <span className="text-amber-800/85">(điểm 4, Phụ lục NĐ 254/2026/NĐ-CP). Chỉ chọn khi khách thật sự là người tiêu dùng cá nhân và không cung cấp thông tin.</span>
            </p>
          )}

          {looked && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-emerald-900">
              <p className="font-semibold">✓ Đã lấy thông tin từ cơ quan thuế</p>
              <p className="mt-1">Tên đơn vị, địa chỉ đăng ký và ngành nghề đã được điền. <b>Rep vẫn sửa được</b> — dữ liệu đăng ký thường là địa chỉ trụ sở, không phải nơi làm việc thực tế.</p>
            </div>
          )}

          {/* The MST-root list, in place of a blocking warning: same first 10 digits
              means "probably related", never "duplicate". The rep links it, or not. */}
          {rootHit && (
            <div className="rounded-lg border border-line bg-canvas/50 p-3">
              <p className="text-[12px] font-semibold text-ink">Có {MST_ROOT_MATCHES.length} công ty trùng 10 số gốc MST</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">Trùng gốc thường là cùng một pháp nhân — chi nhánh hoặc công ty con. Chọn hướng liên kết cho từng công ty, hoặc bỏ qua nếu không liên quan. <b className="text-ink/70">Không bắt buộc</b> và không chặn lưu.</p>
              <div className="mt-2 space-y-1.5">
                {MST_ROOT_MATCHES.map((m) => (
                  <MstMatchRow key={m.name} m={m} rel={rels[m.name] ?? 'none'} onSet={(r) => setRel(m.name, r)} />
                ))}
              </div>
              {(parentPick || childPicks.length > 0) && (
                <div className="mt-2 rounded-md border border-brand/30 bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">
                  <b>Sẽ liên kết:</b>
                  {parentPick && <> công ty con của <b>{parentPick}</b>.</>}
                  {childPicks.length > 0 && <> công ty mẹ của <b>{childPicks.join(', ')}</b>.</>}
                  <span className="block text-brand/70">Liên kết chỉ để tra cứu — MST, hợp đồng, quota, hoá đơn và sales phụ trách vẫn riêng của từng công ty.</span>
                  {parentPick && childPicks.length > 0 && (
                    <span className="mt-1 block rounded bg-amber-100 px-1.5 py-1 text-amber-900">Công ty này sẽ nằm giữa hai tầng. Hệ thống kiểm tra liên kết vòng khi lưu — nếu công ty mẹ đã nằm dưới một trong các công ty con, liên kết sẽ bị từ chối.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {lockedParent && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Công ty mẹ</label>
              <div className="flex items-center gap-2 rounded-md border border-brand/30 bg-brand-soft px-3 py-2 text-[12.5px] text-brand">
                <span className="min-w-0 truncate font-medium">{coLabel(lockedParent)}</span>
                <span className="shrink-0 text-[10.5px] text-brand/70">MST {lockedParent.tax}</span>
                <span className="ml-auto shrink-0 rounded border border-brand/30 px-1.5 py-0.5 text-[10px] font-medium">Đã cố định</span>
              </div>
            </div>
          )}
        </JobGroup>

        <JobGroup title="Thông tin cơ bản">
          {/* Tên hiển thị leads this group, exactly as it leads Thông tin cơ bản on
              the Basic info card — the two surfaces stay field-for-field identical.
              Optional: every list, board and document falls back to the legal name
              until a display name is set, so leaving it blank blocks nothing.

              WHAT CREATION STILL DOES NOT ASK FOR, and where it is asked instead:
              company tags · the EXACT headcount · ngày thành lập → the Company page
              tab. Those are page content, entered where they are seen. Industry and
              the size BAND are asked here instead: both are list columns and search
              facets, needed the day the record exists rather than when the page is
              written. */}
          <LField label="Tên hiển thị" value="e.g. FPT, Tiki, NEC" hint="Tên thương hiệu ứng viên biết — hiện trên trang công ty và mọi thẻ việc làm. Bỏ trống thì dùng tên pháp lý." />
          {/* Two separate facts, filtered separately — never one joined field. */}
          <div className="grid grid-cols-2 gap-3">
            <LField label="Industry" value="IT / Software" select hint="Từ Master data → Industry." />
            <LField label="Company size" value="200–500" select hint="Khoảng nhân sự — cột danh sách và bộ lọc." />
          </div>
          {/* Country of registration gates the province picker: a Vietnamese company
              gets the 34 provincial units, a foreign one does not. A company has a
              country of REGISTRATION, not a nationality. */}
          <ComboField
            label="Quốc gia đăng ký / Country of registration"
            value={country}
            onChange={setCountry}
            placeholder="Select a country…"
            options={MD_DOMAINS.find((d) => d.key === 'country')?.entries ?? ['Việt Nam']}
          />
          {isVN ? (
            <LField label="Tỉnh / Thành phố · City" value="Hồ Chí Minh" select hint="Tỉnh/thành của trụ sở — từ Master data → Locations." />
          ) : (
            <p className="rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
              Không phải công ty Việt Nam nên <b className="text-ink">không chọn Tỉnh / Thành phố</b> — ghi thành phố vào <b className="text-ink">Địa chỉ xuất hóa đơn</b> ở nhóm dưới.
            </p>
          )}
          <LField label="Website" value="company.vn" />
        </JobGroup>

        {/* Uploaded at creation because it is what proves the MST belongs to them —
            the same document Accounting will want before the first VAT invoice. */}
        <JobGroup title="Company verification document">
          <div>
            <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-4 text-center">
              <p className="text-[12px] font-medium text-ink">Kéo thả hoặc <button onClick={() => setDocs((d) => [...d, `giay-phep-kinh-doanh-${d.length + 1}.pdf`])} className="text-brand hover:underline">chọn tệp</button></p>
              <p className="mt-0.5 text-[10.5px] text-faint">Giấy phép kinh doanh · Giấy chứng nhận đăng ký thuế · Hợp đồng đã ký. PDF, JPG, PNG — tối đa 10MB mỗi tệp.</p>
            </div>
            {docs.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {docs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
                    <span className="text-[13px]"></span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink/80">{d}</span>
                    <button onClick={() => setDocs((p) => p.filter((_, j) => j !== i))} className="text-[11px] text-faint hover:text-ink">✕</button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">Không bắt buộc lúc tạo — có thể tải lên bất cứ lúc nào từ hồ sơ công ty.</p>
          </div>
        </JobGroup>

        <JobGroup title="Primary contact">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Contact name" req value="Họ và tên" />
            <ComboField label="Title" value="HR Manager" placeholder="Select or type a title…" options={['HR Manager', 'HR Director', 'Talent Acquisition', 'Recruiter', 'CEO / Founder', 'Office Manager']} />
          </div>
          {/* Both required: a contact nobody can reach is not a contact. */}
          <div className="grid grid-cols-2 gap-3">
            <LField label="Phone" req value="09xx xxx xxx" />
            <LField label="Email" req value="hr@company.vn" />
          </div>
        </JobGroup>

        <JobGroup title="Sales">
          <div className="grid grid-cols-2 gap-3">
            <ComboField label="Lead source" value="Website sign-up" placeholder="Select or type…" options={['Website sign-up', 'Inbound call', 'Referral', 'Event / job fair', 'Outbound', 'Partner']} />
            <LField label="Sales owner" value="Nguyễn Thị Lan" select />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Products interested</label>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> Job Posting</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Resume Search</span>
            </div>
          </div>
          <LField label="Estimated deal value (₫)" value="0" />
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Description</label>
            <div className="h-16 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">How we heard about them, need, next step…</div>
          </div>
        </JobGroup>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <button onClick={onBack} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
        <button onClick={onBack} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Save company</button>
      </div>
    </div>
  )
}
