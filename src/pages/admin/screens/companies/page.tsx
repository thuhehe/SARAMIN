import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BenefitsField } from '@/components/BenefitsField'
import { LogoSizer } from '@/components/LogoSizer'
import { RO_HINT, useReadOnly } from '@/pages/admin/ctx'
import type { Company } from '@/pages/admin/data/companies'
import { BUSINESS_FORMS, CP_TRAITS } from '@/pages/admin/data/companyPage'
import { MD_DOMAINS } from '@/pages/admin/data/system'
import type { StatusTone } from '@/pages/admin/lib/tone'
import { PageField } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/** One collapsible section = one card on the live page. `state` is what the
    section contributes to the page, said in the reviewer's language. */
function PageSec({
  n, title, sub, state, tone, open, onToggle, children,
}: {
  n: number; title: string; sub: string
  state: string; tone: StatusTone
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border', open ? 'border-brand/50' : 'border-line')}>
      <button onClick={onToggle} className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left', open ? 'bg-brand-soft/40' : 'bg-canvas/40 hover:bg-canvas/70')}>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-surface text-[10px] font-bold tabular-nums text-muted">{n}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold text-ink">{title}</span>
          <span className="block truncate text-[10.5px] text-faint">{sub}</span>
        </span>
        <Pill tone={tone}>{state}</Pill>
        <span className="shrink-0 text-[11px] text-faint">{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="space-y-2.5 border-t border-line px-3 py-3">{children}</div>}
    </div>
  )
}

/** A slot that holds an uploaded asset — photo, video, logo. */
function AssetSlot({ label, filled }: { label: string; filled?: boolean }) {
  return (
    /* h-full matters: the hero slot sits inside a `row-span-2` wrapper, and without
       it the slot only takes its text height while the wrapper stays tall — the
       mosaic then reads as one short box beside a full-height column. */
    <div className={cn(
      'grid h-full place-items-center rounded-md border border-dashed px-2 py-3 text-center',
      filled ? 'border-brand/40 bg-brand-soft/30' : 'border-line bg-canvas/40',
    )}>
      <span className={cn('text-[10.5px] leading-tight', filled ? 'font-medium text-brand' : 'text-faint')}>
        {filled ? label : `+ ${label}`}
      </span>
    </div>
  )
}

/* jobseeker company page — editor + draft preview, shared by Overview + its tab */
export function CompanyPageEditor({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [open, setOpen] = useState<number | null>(1)
  const [traits, setTraits] = useState<string[]>(c.hasPage ? ['Thành viên tập đoàn', 'Làm việc từ xa', 'Trang phục tự do'] : [])
  /* Which of the 11 shared codes this company has declared. BenefitsField owns the
     editing from here; this is only the seed and the section's status line. */
  const bens = c.hasPage ? ['insurance', 'health', 'bonus', 'salary-13th', 'allowance', 'paid-leave', 'training'] : []
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const has = c.hasPage
  const toggle = (n: number) => setOpen((o) => (o === n ? null : n))

  /* The editor is open for EVERY company — no Job Posting product required (BA
     decision). Products gate what a customer's JOBS can do, not whether HQ may
     prepare the page: a rep filling the page during the sales conversation is
     exactly the pitch ("this is how you'll look on Saramin"), and requiring the
     purchase first makes the page perpetually one step behind the deal. */

  /* The five publish blockers, in the order they appear on the page. Everything
     else is optional by design and never appears here. */
  const gates = [
    { label: 'Logo', ok: has },
    { label: 'Tên hiển thị', ok: true },
    { label: 'Ngành nghề', ok: true },
    { label: 'Địa chỉ', ok: true },
    { label: 'Giới thiệu (VI)', ok: has },
  ]
  const missing = gates.filter((g) => !g.ok)
  /* Every section, with whether it would actually RENDER on the live page. ONE list
     drives the rail, the per-section pills and the percentage — when these were
     three separate arrays the meter drifted out of step with the sections it was
     supposed to be counting. `auto` is section 2, which nobody fills by hand and
     which therefore must not inflate the score. */
  const secs = [
    { n: 1, title: 'Nhận diện', ok: has, req: true },
    { n: 2, title: 'Company at a glance', ok: true },
    { n: 3, title: 'Đặc điểm nổi bật', ok: traits.length > 0 },
    { n: 4, title: 'Company vision', ok: has, req: true },
    { n: 5, title: 'Video giới thiệu', ok: has },
    { n: 6, title: 'Hình ảnh công ty', ok: has },
    { n: 7, title: 'Phúc lợi & Chế độ', ok: bens.length > 0 },
  ]
  const optional = secs.filter((s) => !s.req)
  const done = gates.length - missing.length + optional.filter((s) => s.ok).length
  const pct = Math.round((done / (gates.length + optional.length)) * 100)

  return (
    /* Container query, not a viewport breakpoint: this card sits inside a column
       whose width has nothing to do with the window's. Keyed on `lg:` the rail
       split fired on a wide monitor while the editor column was still 370px, which
       is narrower than the logo previews inside it.
       The @container marker has to sit on a WRAPPER — an element cannot answer a
       container query against itself, only its descendants can. */
    <div className="@container">
    <div className="grid gap-3 @[820px]:grid-cols-[minmax(0,1fr)_260px] @[820px]:items-start">
      {/* ═══ LEFT — the sections, in live-page order ═══════════════════════ */}
      <div className="min-w-0 space-y-2">

      {/* ── 1. Identity — the sticky sidebar on the live page ───────────────── */}
      <PageSec n={1} title="Nhận diện" sub="Sidebar · logo, company tags" state={has ? 'Đã có' : 'Thiếu logo'} tone={has ? 'active' : 'pending'} open={open === 1} onToggle={() => toggle(1)}>
        {/* Tên hiển thị is NOT edited here — it lives on the Overview tab, in Thông
            tin cơ bản, with the rest of the company's identity. The page reads it. */}
        {/* One asset, two frames, plus the peer row that settles the size — see LogoSizer. */}
        <div>
          <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Logo <span className="text-rose-500">*</span></p>
          <LogoSizer company={c.name} />
        </div>
        {/* Company tags moved off the create form and land here, with the rest of how
            the company presents itself. */}
        <div>
          <p className="mb-1 text-[11px] font-medium text-ink/80">Company tags</p>
          <CompanyTagPicker initial={['Korean company']} />
        </div>
      </PageSec>

      {/* ── 2. Registry facts — ONE stored value, editable from either tab ──── */}
      <PageSec n={2} title="Company at a glance" sub="Thành lập · hình thức · nhân sự · doanh thu · business detail · địa chỉ" state="Đã có" tone="active" open={open === 2} onToggle={() => toggle(2)}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* Founding date LEADS the card, matching Saramin KR's strip — the first
              tile there is 업력 (years in business) over the founding date. It is
              also the only field here that reads as a claim about the company
              rather than a classification of it. */}
          <PageField label="Ngày thành lập" type="date" ro={ro} value="1993-09-27" />
          <PageField label="Business form" ro={ro} value="Mid-sized company" options={BUSINESS_FORMS} hint="Quy mô + tính chất sở hữu — KHÁC “Loại hình doanh nghiệp” (hình thức pháp lý trên ĐKKD, nằm ở tab Overview)." />
          <PageField label="Number of employees" type="number" suffix="người" ro={ro} value="1240" hint="Một con số chính xác, không phải khoảng. Dải quy mô cho bộ lọc được suy ra từ số này." />
          <PageField label="Revenues" type="number" suffix="₫" ro={ro} value="441840000000" hint="Doanh thu năm gần nhất, đơn vị đồng. Nhập số thuần — hệ thống tự tách hàng nghìn khi hiển thị." />
        </div>
        {/* Business detail sits BELOW the tile grid, not inside it: the strip is
            exactly 4 tiles wide and a 5th breaks the row, and this is free text
            rather than a fact tile. It lives here because it reads as the prose
            companion to Business form directly above it. */}
        <PageField
          label="Business detail" area maxWords={80} ro={ro}
          value={`${c.industry} · Dịch vụ ${c.industry.toLowerCase()} cho khách hàng doanh nghiệp và cá nhân trên toàn quốc.`}
        />
        {/* Address + its map link moved up from the old section 8. They belong with
            the facts, exactly as Saramin KR has them: 주소 with a 지도보기 button
            sitting in the same detail grid as 업종 and 사업내용, not in a section of
            their own. A lone address is not worth a section header. */}
        <PageField label="Địa chỉ" ro={ro} value={c.address} wide />
        <PageField label="Google Maps link" ro={ro} value="https://maps.app.goo.gl/…" wide hint="Dán link chia sẻ từ Google Maps — nút “Xem bản đồ” trên trang công khai trỏ vào đây. Bỏ trống thì chỉ hiện dòng địa chỉ." />
      </PageSec>

      {/* ── 3. Trait chips ─────────────────────────────────────────────────── */}
      <PageSec n={3} title="Đặc điểm nổi bật" sub="Dải chip dưới thẻ facts · danh sách cố định" state={traits.length ? `${traits.length} chip` : 'Trống — ẩn'} tone={traits.length ? 'active' : 'neutral'} open={open === 3} onToggle={() => toggle(3)}>
        <div className="flex flex-wrap gap-1.5">
          {CP_TRAITS.map((t) => {
            const on = traits.includes(t)
            return (
              <button
                key={t}
                disabled={ro}
                onClick={() => setTraits((p) => (p.includes(t) ? p.filter((x) => x !== t) : p.length >= 6 ? p : [...p, t]))}
                className={cn('rounded-full border px-2.5 py-1 text-[11px]', on ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line bg-surface text-muted hover:border-brand/40', ro && 'cursor-not-allowed opacity-50')}
              >{t}</button>
            )
          })}
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Tối đa 6. Danh sách cố định (không tự nhập) — đó chính là lý do chip <b className="text-ink/70">so sánh được giữa các công ty và lọc được</b> ở trang tìm công ty. {traits.length}/6 đã chọn.
        </p>
      </PageSec>

      {/* ── 4. About ───────────────────────────────────────────────────────── */}
      <PageSec n={4} title="Company vision" sub="Tầm nhìn · sứ mệnh · giới thiệu · VI bắt buộc" state={has ? 'Đã có' : 'Bắt buộc — trống'} tone={has ? 'active' : 'pending'} open={open === 4} onToggle={() => toggle(4)}>
        <div className="mb-1 flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
          {/* Two languages only — VI required, EN optional. No KO. */}
          {(['VI', 'EN'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={cn('px-2.5 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}{l === 'VI' && ' *'}</button>
          ))}
        </div>
        <textarea
          readOnly={ro}
          rows={4}
          defaultValue={has && lang === 'VI' ? `${c.shortName || c.name} là một trong những doanh nghiệp ${c.industry.toLowerCase()} hàng đầu Việt Nam…` : ''}
          placeholder={lang === 'VI' ? 'Giới thiệu công ty bằng tiếng Việt…' : `Bản dịch ${lang} — bỏ trống thì trang hiển thị bản tiếng Việt.`}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-brand"
        />
        <p className="text-[10.5px] text-faint">VI là bản bắt buộc VÀ là bản dự phòng: thiếu EN/KO thì trang tự hiển thị tiếng Việt, không bao giờ để trống.</p>
      </PageSec>

      {/* ── 5. Video ───────────────────────────────────────────────────────── */}
      <PageSec n={5} title="Video giới thiệu" sub="Tối đa 3 · chỉ nhúng YouTube hoặc Vimeo" state={has ? '1/3' : 'Trống — ẩn'} tone={has ? 'active' : 'neutral'} open={open === 5} onToggle={() => toggle(5)}>
        <div className="space-y-1.5">
          {(has ? ['https://youtube.com/watch?v=…  ·  “Vượt trội mỗi ngày” · 2:14'] : []).map((v) => (
            <div key={v} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px]">
              <span className="min-w-0 flex-1 truncate text-ink/80">{v}</span>
              <button disabled={ro} className="shrink-0 text-[11px] text-faint hover:text-rose-600 disabled:opacity-40">Bỏ</button>
            </div>
          ))}
          <input readOnly={ro} placeholder="Dán link YouTube / Vimeo…" className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px] outline-none placeholder:text-faint focus:border-brand" />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">Chỉ nhận link từ danh sách host cho phép — không cho tải file video lên, vì băng thông và kiểm duyệt nội dung không thuộc phạm vi Phase-1.</p>
      </PageSec>

      {/* ── 6. Photos ──────────────────────────────────────────────────────── */}
      <PageSec n={6} title="Hình ảnh công ty" sub="Bố cục 1 ảnh lớn + 4 ảnh nhỏ · cần ≥3 ảnh" state={has ? '5 ảnh' : 'Trống — ẩn'} tone={has ? 'active' : 'neutral'} open={open === 6} onToggle={() => toggle(6)}>
        {/* The live mosaic, laid out ready: 1 hero left + 4 tiles right (Figma
            83:21921). Slots are pre-drawn so the shape is obvious before any photo
            is uploaded — an empty grid of equal squares does not tell an operator
            which picture is about to be the big one. */}
        <div className="grid h-44 grid-cols-4 grid-rows-2 gap-1.5">
          <div className="col-span-2 row-span-2"><AssetSlot label={has ? 'Trụ sở Hà Nội (hero)' : 'Ảnh hero'} filled={has} /></div>
          <AssetSlot label={has ? 'Không gian làm việc' : 'Ảnh 2'} filled={has} />
          <AssetSlot label={has ? 'Sự kiện Gala' : 'Ảnh 3'} filled={has} />
          <AssetSlot label={has ? 'Team building' : 'Ảnh 4'} filled={has} />
          <AssetSlot label={has ? 'Hoạt động CSR' : 'Ảnh 5'} filled={has} />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Ảnh đầu tiên là <b className="text-ink/70">hero</b> và chiếm nửa khối bên trái — thứ tự ở đây quyết định ảnh nào lên hero. Dưới 3 ảnh thì cả thẻ bị ẩn: một mosaic thủng lỗ trông tệ hơn là không có.
        </p>
      </PageSec>

      {/* ── 7. Benefits ────────────────────────────────────────────────────── */}
      {/* The SAME 11 codes the job form uses, not a second 8-group list. The Figma
          draws 8 groups, but the spec already decided one shared taxonomy — that is
          what lets a job's benefits be merged with the company's and de-duplicated.
          Two lists would make "Lương thưởng" and "Lương & thưởng" different rows. */}
      <PageSec n={7} title="Phúc lợi & Chế độ" sub="Bộ phúc lợi MẶC ĐỊNH · điền sẵn cho mọi tin tuyển dụng mới" state={`${bens.length} nhóm`} tone={bens.length ? 'active' : 'neutral'} open={open === 7} onToggle={() => toggle(7)}>
        <div className="rounded-md border border-line bg-canvas/30 p-2.5">
          <BenefitsField
            label="Phúc lợi chung của công ty"
            initial={bens}
          />
        </div>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Đây là <b className="text-ink/70">bộ mặc định</b> cho phúc lợi: tin tuyển dụng mới mở form được <b className="text-ink/70">điền sẵn</b> bộ này (bản sao), rồi người đăng thêm bớt tuỳ ý cho vị trí. Sửa ở đây <b className="text-ink/70">không</b> tự đổi tin đã đăng — tin cũ lấy bản mới bằng nút “↺ Về mặc định công ty” trên form; tin mới luôn lấy bản mới nhất.
        </p>
        <p className="text-[10.5px] leading-relaxed text-faint">
          Không giới hạn 6 như ở tin tuyển dụng — trang công ty được đọc một lần chứ không bị so sánh cạnh các tin khác, nên liệt kê đủ là có lợi.
        </p>
      </PageSec>

      {/* ── 8. Offices — the same book the job form picks from ──────────────── */}
      </div>

      {/* ═══ RIGHT — progress rail ════════════════════════════════════════════
          Sticky, because the thing it answers ("what is still missing, can I
          publish yet") is asked while scrolling through eleven sections, not
          before starting. The publish actions live here too: the gate and the
          button it gates belong in the same place, or the button is 2000px away
          from the reason it is disabled. */}
      <aside className="space-y-2 @[820px]:sticky @[820px]:top-2">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className={cn('text-[12px] font-semibold', missing.length ? 'text-amber-800' : 'text-emerald-700')}>
            {missing.length === 0 ? 'Đủ điều kiện đăng' : `Còn thiếu ${missing.length} mục bắt buộc`}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[19px] font-bold tabular-nums leading-none text-ink">{pct}%</span>
            <span className="text-[10.5px] text-faint">hoàn thiện</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"><div className={cn('h-full rounded-full', missing.length ? 'bg-amber-500' : 'bg-brand')} style={{ width: `${pct}%` }} /></div>

          {/* The gate CHECKLIST is gone — the headline above already names how many
              are missing, and the disabled Publish button names which. The section
              list below carries the * markers, so the required items are still
              visible without a second list repeating them. */}
          <div className="mt-3 space-y-0.5">
            {secs.map((s) => (
              <button
                key={s.n}
                onClick={() => setOpen(s.n)}
                className={cn('flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] hover:bg-canvas', open === s.n && 'bg-brand-soft/60')}
              >
                <span className={cn(
                  'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border text-[8px] font-bold',
                  s.ok ? 'border-transparent bg-emerald-500 text-white' : 'border-dashed border-line text-transparent',
                )}>✓</span>
                <span className={cn('min-w-0 flex-1 truncate', open === s.n ? 'font-semibold text-brand' : s.ok ? 'text-ink/80' : 'text-faint')}>{s.title}</span>
                {s.req && <span className="shrink-0 text-[9px] text-rose-500">*</span>}
              </button>
            ))}
          </div>
        </div>

        {/* actions, next to the gate that governs them */}
        <div className="space-y-1.5 rounded-lg border border-line bg-surface p-3">
          <a href="#" onClick={(e) => e.preventDefault()} className="block text-[11.5px] font-medium text-brand hover:underline">↗ Xem thử bản nháp</a>
          {ro ? (
            <p className="rounded-md border border-dashed border-line bg-canvas/50 px-2 py-1.5 text-[10.5px] leading-relaxed text-muted">{RO_HINT}</p>
          ) : has ? (
            <>
              <button className="w-full rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Lưu thay đổi</button>
              <button className="w-full rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">↗ Xem trang thật</button>
              <button className="w-full rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-rose-300 hover:text-rose-600">Gỡ khỏi công khai</button>
            </>
          ) : (
            <>
              <button
                disabled={missing.length > 0}
                title={missing.length ? `Còn thiếu: ${missing.map((m) => m.label).join(', ')}` : undefined}
                className={cn('w-full rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white', missing.length ? 'cursor-not-allowed bg-brand/40' : 'bg-brand hover:opacity-90')}
              >Đăng trang</button>
              <button className="w-full rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand">Lưu nháp</button>
            </>
          )}
        </div>
      </aside>
    </div>
    </div>
  )
}

/**
 * Company tags — a multi-select of editorial labels from Master data → Company tag.
 * Click to open the option list; tick any number (Korean company, Big company, …).
 * Options are read from MD_DOMAINS so this stays in sync with Master data.
 */
function CompanyTagPicker({ initial = [] }: { initial?: string[] }) {
  const ro = useReadOnly()
  const options = MD_DOMAINS.find((d) => d.key === 'company-tag')?.entries ?? ['Korean company', 'Big company']
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<string[]>(initial)
  const toggle = (t: string) => setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
  return (
    <div className="relative">
      <button
        onClick={() => { if (!ro) setOpen((o) => !o) }}
        disabled={ro}
        title={ro ? RO_HINT : undefined}
        className={cn('flex min-h-[38px] w-full flex-wrap items-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-left', ro ? 'cursor-not-allowed bg-canvas/50' : 'bg-surface')}
      >
        {sel.length === 0 && <span className="px-1 text-[12px] text-faint">Select tags…</span>}
        {sel.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">
            {t}
            <span role="button" onClick={(e) => { e.stopPropagation(); toggle(t) }} className="cursor-pointer text-brand/50 hover:text-brand">×</span>
          </span>
        ))}
        <span className="ml-auto pl-1 text-faint">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lg">
          {options.map((t) => {
            const on = sel.includes(t)
            return (
              <button key={t} onClick={() => toggle(t)} className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-canvas', on ? 'font-medium text-brand' : 'text-ink/80')}>
                <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px]', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on ? '✓' : ''}</span>
                {t}
              </button>
            )
          })}
          <p className="mt-1 border-t border-line-soft px-3 pt-1.5 text-[10.5px] leading-snug text-faint">Multi-select · manage options in System → Master data → Company tag</p>
        </div>
      )}
    </div>
  )
}
