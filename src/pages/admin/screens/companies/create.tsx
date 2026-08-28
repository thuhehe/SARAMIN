import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { BUYER_TYPE, COMPANIES, RETAIL_BUYER, coLabel, COMPANY_TYPE, buyersFor} from '@/pages/admin/data/companies'
import type { BuyerType, Company, CompanyType} from '@/pages/admin/data/companies'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { DIRECTORY } from '@/pages/admin/data/directory'
import { MST_ROOT_MATCHES } from '@/pages/admin/data/sales'
import { MD_DOMAINS } from '@/pages/admin/data/system'
import { ComboField, DerivedField, LField } from '@/pages/admin/ui/fields'
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
  const goTo = useContext(ScreenNavCtx)
  useDetailCrumb(lockedParent ? `Thêm công ty con · ${coLabel(lockedParent)}` : 'New company', onBack)
  /* Quốc tịch drives whether the Vietnamese province picker is shown at all. */
  const [country, setCountry] = useState('Việt Nam')
  /* Which invoice shape this buyer takes — it decides whether MST is required and
     whether the CCCD / buyer-name pair is asked for at all. */
  const [buyer, setBuyer] = useState<BuyerType>('dn-vn')
  /* On by default: the classification a rep picks while CREATING the record is
     the record's default in all but the rarest case. Unticking it is the
     deliberate act, not ticking it. */
  const [payDefault, setPayDefault] = useState(true)
  /** An individual buyer has no Tên đơn vị and no MST — the person replaces both. */
  const isIndiv = buyer === 'ca-nhan-cccd' || buyer === 'ca-nhan'
  const [tax, setTax] = useState('')
  const [looking, setLooking] = useState(false)
  const [coType, setCoType] = useState<CompanyType>('trong-nuoc')
  const isForeign = coType === 'nuoc-ngoai'
  /* Is the invoice buyer the COMPANY itself, or a person? dn-vn is only offered on
     domestic records and dn-nn only on foreign ones, so this one flag separates
     "inherit the invoice block from Thông tin công ty" from "collect the person". */
  const buyerIsCompany = buyer === 'dn-vn' || buyer === 'dn-nn'
  const [looked, setLooked] = useState(false)
  /* What Verify reported — null until pressed. A report, never a gate. */
  const [verify, setVerify] = useState<null | 'found' | 'missing'>(null)
  /* Same number, both stores. The CRM hit is the ONE thing that blocks creation;
     the pool hit blocks too, but by pointing at a better door (direct assign). */
  const crmHit = tax.trim() ? COMPANIES.find((co) => co.tax?.trim() === tax.trim()) : undefined
  const poolHit = crmHit ? undefined : DIRECTORY.find((d) => d.tax && d.tax.trim() === tax.trim() && d.state !== 'claimed')
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
    window.setTimeout(() => {
      setLooking(false)
      // demo rule: an even last digit "exists" on the registry, an odd one does not
      // — so both chips are reachable from the keyboard.
      const ok = /[02468]$/.test(tax.replace(/\D/g, ''))
      setVerify(ok ? 'found' : 'missing')
      setLooked(ok)
    }, 700)
  }

  return (
    <div className="max-w-[860px] pb-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-tight">{lockedParent ? 'Thêm công ty con' : 'New company'}</h2>
        <Pill tone="draft">Draft</Pill>
      </div>

      {/* The door declares what is being made. This page creates a CUSTOMER, so it
          names its four required fields before the first input — the operator who
          only has a company name is on the wrong screen and should know it now, not
          after filling four sections. */}
      <div className="mb-5 rounded-lg border border-line bg-canvas/50 px-3.5 py-2.5">
        {/* FIVE either way since 2026-08-23 — the foreign tax code became required,
            so the count and the sentence stopped needing a branch. */}
        {/* The COUNT follows Loại công ty, because the field set does: a foreign
            company has no Vietnamese MST to ask for, so it is four, not five.
            Hardcoding five listed a field that is not required and contradicted
            the requirement's own “4 thông tin (nước ngoài)”. */}
        <p className="text-[11.5px] font-semibold text-ink">Tạo khách hàng — bắt buộc {isForeign ? 4 : 5} thông tin</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
          <b className="text-ink/75">Tên legal</b>{!isForeign && <> · <b className="text-ink/75">Mã số thuế</b></>} · <b className="text-ink/75">Địa chỉ đăng ký{isForeign ? '' : ' MST'}</b> · <b className="text-ink/75">Người liên hệ</b> · <b className="text-ink/75">Sales owner</b> — hồ sơ lưu xong là có chủ và được đếm vào mọi con số của CRM.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Chỉ có mỗi tên công ty? Dùng <button onClick={() => goTo('admin-company-directory')} className="font-semibold text-brand hover:underline">Free data → Thêm công ty</button> — ở đó chỉ cần tên, và sales sẽ xin nhận sau.
        </p>
      </div>

      <div className="space-y-8">
        {/* TWO groups, because the fields answer two different questions. "Who is
            this company to us" is how a rep finds and talks about them; "what must
            print on their invoice" is a fiscal contract. Mixing them is what had a
            rep filling in a tax code between a brand name and an industry. */}
        {/* ── The company's OWN identity — always asked, whatever the invoices will
            say. Split from the invoice block per the client: a customer record has a
            legal name, a tax code and a registered address of its own; who a given
            invoice is issued to is a different (and per-document) question. */}
        <JobGroup title="Thông tin công ty">
          {/* FIRST in the group, because it decides which invoice classifications
              exist below — the same reason Phân loại người mua leads its own group.
              Asking it after the invoice block would mean re-picking a classification
              the answer just invalidated. */}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Loại công ty <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(COMPANY_TYPE) as CompanyType[]).map((k) => (
                <button
                  key={k}
                  onClick={() => { setCoType(k); setLooked(false); setVerify(null); if (!buyersFor(k).includes(buyer)) setBuyer(buyersFor(k)[0]) }}
                  className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', coType === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}
                >
                  {COMPANY_TYPE[k].vi}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              Quyết định các lựa chọn ở <b className="text-ink/70">Thông tin xuất hóa đơn</b>: {buyersFor(coType).map((b) => BUYER_TYPE[b].vi).join(' · ')}.
            </p>
          </div>

          {/* Verify returns exactly these two from the tax authority, so after a
              lookup they are FILLED, not asked again — retyping a legal name that
              the registry just gave us is how the record ends up disagreeing with
              the invoice by one character. Editable before a lookup, and correctable
              after (the registered address is often the head office, not where the
              team actually sits). */}
          {looked
            ? <DerivedField label="Tên đơn vị / Legal name" value="Công ty TNHH Xây dựng Minh Khang" from="Verify MST" hint="Lấy từ cơ quan thuế — sửa được nếu giấy phép ghi khác." />
            : <LField label="Tên đơn vị / Legal name" req value="Công ty TNHH …" hint={isForeign ? 'Đúng như trên giấy đăng ký kinh doanh ở nước sở tại.' : 'Đúng như trên giấy phép kinh doanh — hoặc bấm Verify ở ô MST để tự điền.'} />}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{isForeign ? <>Mã số thuế nước ngoài <span className="text-rose-500">*</span></> : <>Mã số thuế (MST) <span className="text-rose-500">*</span></>}</label>
            <div className="flex gap-1.5">
              <input value={tax} onChange={(e) => { setTax(e.target.value); setLooked(false); setVerify(null) }} placeholder={isForeign ? 'Tax ID nước sở tại' : '0328xxxxxx-001'} className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              {/* Verify is INFORMATION, not a gate: it answers "does this number
                  exist on the tax registry?" and nothing else. The one rule that
                  blocks creation on this field is UNIQUENESS across Company list +
                  Free data. Hidden for a foreign company — its number is a foreign
                  tax ID and the Vietnamese registry has nothing to say about it;
                  a button that can only fail teaches reps to ignore buttons. */}
              {!isForeign && (
                <button onClick={lookup} disabled={!rootHit || looking} className={cn('shrink-0 rounded-md px-2.5 py-2 text-[11.5px] font-semibold', rootHit && !looking ? 'bg-brand text-white hover:opacity-90' : 'cursor-not-allowed bg-canvas text-faint')}>
                  {looking ? 'Đang kiểm tra…' : 'Verify'}
                </button>
              )}
            </div>
            {/* One of two chips — a REPORT, not a verdict. "Không có tồn tại" still
                creates: a company registered last week can be missing from the
                registry for days, and that lag is the registry's, not the
                customer's. Only a duplicate MST blocks. */}
            {verify === 'found' && (
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">✓ Có tồn tại trên MST</span>
                <span className="text-[10.5px] text-faint">Tên đơn vị + địa chỉ đăng ký đã tự điền từ cơ quan thuế — rep vẫn sửa được.</span>
              </p>
            )}
            {verify === 'missing' && (
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">✕ Không có tồn tại trên MST</span>
                <span className="text-[10.5px] text-faint">Chỉ là thông tin — vẫn tạo được công ty, miễn MST không trùng.</span>
              </p>
            )}
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{isForeign ? 'Mã số thuế ở nước sở tại — BẮT BUỘC (2026-08-23). Không kiểm tra được trên hệ thống thuế VN nên không có nút Verify; điều đó làm nó khó xác minh, không làm nó tùy chọn — một hồ sơ DN nước ngoài không có mã số thuế nào cả thì không đối chiếu được với hợp đồng hay chứng từ chuyển tiền về sau.' : '10 số, hoặc 10 số + “-001” nếu là chi nhánh. Verify chỉ để biết — điều kiện duy nhất chặn tạo là MST trùng hồ sơ đã có.'}</p>
            {/* The dedup spans BOTH stores. Free data and Company list are one
                company table at two completeness levels, so a check that only
                looked at customers would let a rep create the very duplicate the
                pool exists to prevent — and the pool holds tens of thousands of
                rows nobody reads before typing. */}
            {/* The only gate on the whole form, so it is the only red on it. */}
            {crmHit && (
              <p className="mt-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] leading-relaxed text-rose-900">
                ✕ MST này đã thuộc <b>{coLabel(crmHit)}</b> trên Company list — <b>không tạo được</b> (MST là duy nhất trên cả hai kho). Mở hồ sơ đó để cập nhật, hoặc kiểm tra lại số.
              </p>
            )}
            {poolHit && (
              <p className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
                ⚠ MST này đã có trong <b>Free data</b> — <b>{poolHit.name}</b>{poolHit.addr ? ` · ${poolHit.addr}` : ''}.
                <span className="mt-0.5 block text-amber-800/85">
                  Đừng tạo mới: mở dòng đó và <b>phân trực tiếp cho sales</b> (hoặc duyệt yêu cầu đang chờ) — công ty sẽ lên Company list mang theo dữ liệu danh bạ và rời khỏi Free data. Tạo mới ở đây sẽ thành hai bản ghi cho một công ty.
                </span>
                <button onClick={() => goTo('admin-company-directory', poolHit.name)} className="mt-1 rounded border border-amber-400 bg-white px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-800 hover:border-amber-600">
                  Mở dòng Free data →
                </button>
              </p>
            )}
          </div>
          {/* The MST-root list, in place of a blocking warning: same first 10 digits
              means "probably related", never "duplicate". The rep links it, or not. */}
          {!isForeign && rootHit && (
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
          {looked
            ? <DerivedField label="Địa chỉ đăng ký mã số thuế" value="123 Nguyễn Trãi, Thanh Xuân, Hà Nội" from="Verify MST" hint="Địa chỉ trên đăng ký thuế — thường là trụ sở, có thể khác nơi làm việc thực tế (nhập ở Thông tin cơ bản)." />
            : <LField label={isForeign ? 'Địa chỉ đăng ký' : 'Địa chỉ đăng ký mã số thuế'} req value={isForeign ? 'Street, city, country' : 'Số nhà, tên đường, phường/xã, tỉnh/thành'} hint={isForeign ? 'Địa chỉ đăng ký của công ty ở nước sở tại — in lên hóa đơn thay địa chỉ đăng ký MST.' : 'Bấm Verify ở ô MST để tự điền, hoặc nhập tay.'} />}
          <LField label="Tên hiển thị" value="e.g. FPT, Tiki, NEC" hint="Tên thương hiệu ứng viên biết. Bỏ trống thì mọi danh sách dùng tên pháp lý." />
        </JobGroup>

        <JobGroup title="Thông tin xuất hóa đơn">
          {/* FIRST in the group, because it decides which of the fields below even
              exist. Asking for a tax code and then removing the field is worse than
              asking one question up front. */}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Phân loại người mua <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {buyersFor(coType).map((k) => (
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

          {/* Buyer IS the company (DN Việt Nam on a domestic record, DN nước ngoài
              on a foreign one) → every line INHERITS from Thông tin công ty above,
              no manual entry: asking again would be typing the same values twice
              and letting them drift. Only the two person classifications collect
              their own fields, because there the buyer is genuinely someone else. */}
          {buyerIsCompany && (
            <div className="rounded-lg border border-line bg-canvas/40 p-3">
              <div className="space-y-1.5">
                {[['Tên đơn vị / Legal name', 'Công ty TNHH …'], ...(isForeign ? [] : [['Mã số thuế (MST)', tax.trim() || '— theo ô MST ở trên —']]), ['Địa chỉ xuất hóa đơn', isForeign ? 'Địa chỉ đăng ký' : 'Địa chỉ đăng ký mã số thuế']].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="text-muted">{k}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn(k.includes('MST') && tax.trim() ? 'font-mono' : '', 'text-ink/75')}>{v}</span>
                      <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[9.5px] text-faint">tự điền</span>
                    </span>
                  </div>
                ))}
              </div>
              {/* REMOVED 2026-08-23: the paragraph explaining that these lines are
                  inherited. Every row already carries a "tự điền" badge, and none
                  of them is an input — the block says it is derived by being
                  derived. */}
            </div>
          )}

          {/* The NAME line, and which one it is depends on the buyer. For a company
              it is the legal name; for an individual the person REPLACES it — an
              individual has no Tên đơn vị, and leaving an empty company-name field
              on the form invites someone to type the person's name into it. */}
          {!buyerIsCompany && isIndiv && (
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
          )}


          {/* CCCD is the individual's identifier and is never stored in the MST
              field — different format, different legal meaning. */}
          {BUYER_TYPE[buyer].needsIdCard && (
            <LField label="Số CCCD" req value="079xxxxxxxxx" hint="Căn cước công dân — in vào dòng “Căn cước công dân”. Không dùng ô MST." />
          )}

          {/* No address for a buyer who provided nothing — see the note below. */}
          {!buyerIsCompany && !BUYER_TYPE[buyer].noAddress && (
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



          {/* No "Set as default" checkbox HERE: the classification picked at create
              simply IS the default — a checkbox would be a question with only one
              sane answer. The checkbox lives on the Issue-PO dialog, the one moment
              a rep consciously deviates from the record and can decide whether the
              deviation should stick. */}
          {/* The note that used to sit here only DESCRIBED the default. A checkbox
              SETS it, on the form that owns the record — which is also where the
              PO dialog's own "Đặt làm mặc định" went (removed there 2026-08-23).
              One place to set it, one place to read it. */}
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-2">
            <input type="checkbox" checked={payDefault} onChange={(e) => setPayDefault(e.target.checked)} className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--color-brand)]" />
            <span className="text-[11px] leading-relaxed text-muted">
              <b className="text-ink/75">Set làm mặc định xuất hóa đơn</b> — mọi báo giá và PO của công ty này bắt đầu từ phân loại trên. Đổi lúc phát hành PO chỉ áp dụng cho PO đó, không sửa hồ sơ.
            </span>
          </label>

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
          {/* Tên hiển thị moved UP into Thông tin công ty — the identity group owns
              every name the record has. */}
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
            <LField label="Sales owner" req value="Nguyễn Thị Lan" select hint="Bắt buộc — một hồ sơ ở Company list luôn có chủ. Chưa biết giao ai thì công ty đó thuộc về Free data." />
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
