import { useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { COMPANIES, coKey, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { poHistory } from '@/pages/admin/data/companyRecord'
import { beneficiariesOf, linkTotal, sponsorsOf, sponsorProducts, usageMatrix } from '@/pages/admin/data/sharedQuota'
import type { ShareLink } from '@/pages/admin/data/sharedQuota'
import { DetailCard } from '@/pages/admin/ui/fields'
import { RowAction } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/*
 * The Shared quota card on a company record — Products & billing tab.
 *
 * ONE card, two readings, and the record decides which: a SPONSOR (a company other
 * companies are linked to) reads WHO used WHAT from its POs; a BENEFICIARY reads
 * the one sponsor it draws on and what it has spent. A company that is neither,
 * but holds an invoiced PO, only gets the "+ Link company" action in the header —
 * the feature starts from the buyer's record, so that is where the door is.
 *
 * THE MATRIX. A PO is not "slots and CV": it can carry 100 Top job, 20 Basic, 10
 * Distinction and 200 CV unlocks at once, and the next sponsor's PO will carry a
 * different set. So the products are COLUMNS read from the sponsor's invoiced
 * lines, never hard-coded, and every company is one row across all of them. Three
 * summary rows close the table — the sponsor's own use, the total, and what is
 * left per product — because "what is left" is the question a sponsor opens this
 * card with, and it only makes sense per product.
 *
 * What is deliberately NOT here: a beneficiary never sees the sponsor's totals,
 * remaining quota, PO amounts or invoices. That is the whole shape of the feature —
 * the customer paying for the quota is the one who reads its balance.
 */

const byName = (name: string) => COMPANIES.find((x) => x.name === name)
const idOf = (name: string) => { const x = byName(name); return x ? companyId(coKey(x)) : '—' }

/** `CO-XXXXXXX` → the company, or the reason it cannot be linked. Mirrors the checks
    the server runs, so the dialog can say WHY before the operator presses Link. */
function resolveId(raw: string, sponsor: Company, links: ShareLink[]): { ok: true; c: Company } | { ok: false; why: string } | null {
  const v = raw.trim().toUpperCase()
  if (!v) return null
  if (!/^CO-[0-9A-HJKMNP-TV-Z]{7}$/.test(v)) return { ok: false, why: 'Không đúng dạng CO-XXXXXXX (7 ký tự sau CO-).' }
  const c = COMPANIES.find((x) => companyId(coKey(x)) === v)
  if (!c) return { ok: false, why: 'Không có công ty nào mang ID này.' }
  if (c.name === sponsor.name) return { ok: false, why: 'Đây là chính công ty này.' }
  if (c.archived) return { ok: false, why: `${coLabel(c)} đã Archived — không link được.` }
  if (beneficiariesOf(c.name).some((l) => l.status === 'active')) return { ok: false, why: `${coLabel(c)} đang là sponsor của công ty khác — không link lồng nhau.` }
  if (links.some((l) => l.beneficiary === c.name && l.status === 'active')) return { ok: false, why: `${coLabel(c)} đã được link rồi.` }
  return { ok: true, c }
}

/** The Link dialog — one input, validated live, and the rule under it. A dialog
    rather than a row on the card: linking is rare and consequential, the matrix is
    what the card is for, and a permanently open input box was reading as a search. */
function LinkCompanyModal({ sponsor, links, onLink, onClose }: { sponsor: Company; links: ShareLink[]; onLink: (c: Company) => void; onClose: () => void }) {
  const [raw, setRaw] = useState('')
  const r = resolveId(raw, sponsor, links)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-8 w-full max-w-[480px] rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <h3 className="text-[15px] font-bold tracking-tight text-ink">Link a company to {coLabel(sponsor)}’s quota</h3>
        <p className="mt-1 text-[12px] text-muted">Công ty được link sẽ đăng tin và mở CV từ các PO đã xuất hoá đơn của {coLabel(sponsor)} — và chỉ thấy số mình đã dùng.</p>
        <label className="mt-4 block text-[11px] font-semibold text-ink/80">Company ID</label>
        <input
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="CO-XXXXXXX"
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-[13px] uppercase outline-none placeholder:font-sans placeholder:normal-case placeholder:text-faint focus:border-brand"
        />
        <p className={cn('mt-1.5 min-h-[18px] text-[11.5px]', !r ? 'text-faint' : r.ok ? 'text-emerald-700' : 'text-rose-700')}>
          {!r
            ? 'Nhập đúng ID của công ty — không tìm theo tên, để không link nhầm hai công ty trùng tên.'
            : r.ok
              ? <>✓ <b>{coLabel(r.c)}</b> · {r.c.address} · sales owner {r.c.owner}</>
              : <>✗ {r.why}</>}
        </p>
        <p className="mt-2 rounded-md bg-canvas/70 px-3 py-2 text-[10.5px] leading-relaxed text-muted">
          Điều kiện: công ty tồn tại · <b className="text-ink/70">Active</b> · chưa có sponsor khác · không phải sponsor của ai · không phải chính công ty này. Quan hệ mẹ/con <b className="text-ink/70">không</b> bắt buộc và <b className="text-ink/70">không</b> tự tạo link. Ghi vào audit log và activity của cả hai công ty.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Huỷ</button>
          <button
            disabled={!r || !r.ok}
            onClick={() => { if (r?.ok) { onLink(r.c); onClose() } }}
            className="rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Link company
          </button>
        </div>
      </div>
    </div>
  )
}

/** Compact per-product read-out for one company: "Top job 3 · Basic 2 · CV 12".
    Only products with a spend — a row of zeros says nothing. */
function UsedChips({ used }: { used: Record<string, number> }) {
  const on = Object.entries(used).filter(([, n]) => n > 0)
  if (on.length === 0) return <span className="text-[11px] text-faint">chưa dùng</span>
  return (
    <span className="flex flex-wrap gap-1">
      {on.map(([k, n]) => (
        <span key={k} className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas/60 px-1.5 py-0.5 text-[10.5px]">
          <span className="text-muted">{k}</span><b className="tabular-nums text-ink">{n}</b>
        </span>
      ))}
    </span>
  )
}

function SponsorView({ c, links, onOpen, onRemove }: { c: Company; links: ShareLink[]; onOpen?: (x: Company) => void; onRemove: (name: string) => void }) {
  const products = usageMatrix(c.name, links)
  const active = links.filter((l) => l.status === 'active')
  const othersTotal = products.reduce((s, p) => s + p.others, 0)
  /* products as columns: the first column is sticky so a wide matrix (a PO with
     eight lines) still reads company-by-company while it scrolls sideways */
  const num = (n: number, muted?: boolean) => <span className={cn('tabular-nums', n === 0 || muted ? 'text-faint' : 'font-semibold text-ink')}>{n === 0 ? '—' : n}</span>
  const cellCls = 'px-3 py-2.5 text-right text-[12.5px]'
  const headCls = 'px-3 py-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-muted whitespace-nowrap'
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-brand-soft px-3 py-2 text-[11.5px] text-brand">
        <span><b>{active.length}</b> công ty đang dùng chung quota của {coLabel(c)}</span>
        <span>·</span>
        <span>các công ty đó đã dùng <b>{othersTotal}</b> đơn vị trên <b>{products.length}</b> sản phẩm của các PO đã xuất hoá đơn</span>
      </div>

      {products.length === 0 ? (
        <p className="text-[12px] text-muted">Chưa có PO nào được xuất hoá đơn — chưa có gì để dùng chung.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse" style={{ minWidth: 520 + products.length * 120 }}>
            <thead>
              <tr className="bg-canvas/60">
                <th className="sticky left-0 z-10 bg-canvas/60 px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-muted">Company</th>
                {products.map((p) => (
                  <th key={p.name} className={headCls}>
                    <span className="block normal-case tracking-normal text-ink/80">{p.name}</span>
                    <span className="font-normal normal-case tracking-normal text-faint">{p.unit} · tổng {p.total}</span>
                  </th>
                ))}
                <th className={headCls}>Tổng</th>
                <th className={cn(headCls, 'text-left')}>Last used</th>
                <th className={cn(headCls, 'text-left')}>Status</th>
                <th className={headCls} />
              </tr>
            </thead>
            <tbody>
              {links.length === 0 && (
                <tr><td colSpan={products.length + 5} className="px-3 py-3 text-[12px] text-muted">Chưa link công ty nào — bấm <b>+ Link company</b> ở góc thẻ.</td></tr>
              )}
              {links.map((l) => {
                const b = byName(l.beneficiary)
                const removed = l.status === 'removed'
                return (
                  <tr key={l.beneficiary + l.since} className={cn('border-t border-line-soft', removed && 'bg-canvas/30')}>
                    <td className="sticky left-0 z-10 bg-surface px-3 py-2.5 align-top">
                      <button onClick={() => b && onOpen?.(b)} className={cn('block max-w-[220px] truncate text-left text-[12.5px] font-medium hover:underline', removed ? 'text-muted' : 'text-brand')}>{b ? coLabel(b) : l.beneficiary}</button>
                      <span className="block font-mono text-[10px] text-faint">{idOf(l.beneficiary)} · link {l.since} bởi {l.by}</span>
                      <span className="block max-w-[220px] truncate text-[10px] text-faint" title={l.jobs.join(', ')}>{l.jobs.length} job: {l.jobs.join(', ')}</span>
                    </td>
                    {products.map((p) => <td key={p.name} className={cn(cellCls, 'align-top')}>{num(l.used[p.name] ?? 0, removed)}</td>)}
                    <td className={cn(cellCls, 'align-top')}><b className="tabular-nums">{linkTotal(l)}</b></td>
                    <td className="px-3 py-2.5 align-top text-[11.5px] tabular-nums text-muted">{l.lastUsed ?? '—'}</td>
                    <td className="px-3 py-2.5 align-top">
                      {removed
                        ? <span className="flex flex-col gap-0.5"><Pill tone="draft">Removed</Pill><span className="text-[10px] text-faint">{l.removedAt}</span></span>
                        : <Pill tone="active">Active</Pill>}
                    </td>
                    <td className="px-3 py-2.5 text-right align-top">{!removed && <RowAction tone="rose" onClick={() => onRemove(l.beneficiary)}>Remove</RowAction>}</td>
                  </tr>
                )
              })}
            </tbody>
            {/* The three lines a sponsor actually reads. "Còn lại" is the one that
                cannot be computed anywhere else on the page: it needs the sponsor's
                own spend AND every linked company's, per product. */}
            <tfoot className="text-[12px]">
              <tr className="border-t border-line bg-canvas/40">
                <td className="sticky left-0 z-10 bg-canvas/40 px-3 py-2 font-medium text-ink/80">{coLabel(c)} tự dùng</td>
                {products.map((p) => <td key={p.name} className={cellCls}>{num(p.ownUsed)}</td>)}
                <td className={cellCls}><b className="tabular-nums">{products.reduce((s, p) => s + p.ownUsed, 0)}</b></td>
                <td colSpan={3} />
              </tr>
              <tr className="border-t border-line-soft bg-canvas/40">
                <td className="sticky left-0 z-10 bg-canvas/40 px-3 py-2 font-medium text-ink/80">Công ty được link đã dùng</td>
                {products.map((p) => <td key={p.name} className={cellCls}>{num(p.others)}</td>)}
                <td className={cellCls}><b className="tabular-nums">{othersTotal}</b></td>
                <td colSpan={3} className="px-3 py-2 text-[10.5px] text-faint">kể cả link đã Remove — slot đã dùng là đã dùng</td>
              </tr>
              <tr className="border-t border-line bg-brand-soft/60">
                <td className="sticky left-0 z-10 bg-brand-soft/60 px-3 py-2 font-bold text-brand">Còn lại / tổng</td>
                {products.map((p) => (
                  <td key={p.name} className={cn(cellCls, 'font-bold tabular-nums', p.remaining / p.total < 0.2 ? 'text-amber-700' : 'text-brand')}>{p.remaining}<span className="font-normal text-faint"> / {p.total}</span></td>
                ))}
                <td className={cellCls} />
                <td colSpan={3} className="px-3 py-2 text-[10.5px] text-faint">chỉ sponsor và admin thấy dòng này</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
        Cột = từng sản phẩm trên các PO đã xuất hoá đơn của {coLabel(c)} — PO có bao nhiêu dòng thì bảng có bấy nhiêu cột, cuộn ngang khi nhiều. Mỗi lần công ty được link đăng tin hoặc mở CV là <b className="text-muted">một dòng trên Usage history của {coLabel(c)}</b> ghi rõ công ty nào.
        Remove chỉ chặn lần dùng <b className="text-muted">tiếp theo</b> — tin đã đăng vẫn chạy hết hạn. Trên Company site, công ty được link chỉ thấy <b className="text-muted">hàng của mình</b> — không thấy tổng, còn lại hay hoá đơn.
      </p>
    </>
  )
}

function BeneficiaryView({ c, links, onOpen, onRemove }: { c: Company; links: ShareLink[]; onOpen?: (x: Company) => void; onRemove: (sponsor: string) => void }) {
  return (
    <>
      {/* One block per sponsor. A company may draw on several — a group PO and a
          partner's PO at once — and each is its own link, its own usage, its own
          Remove, because "which quota did this come from" must never be a guess. */}
      <div className="space-y-2">
        {links.map((link) => {
          const s = byName(link.sponsor)
          return (
            <div key={link.sponsor} className="rounded-lg border border-brand/30 bg-brand-soft/60 px-3 py-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] text-ink/85">
                    Đăng tin từ PO của{' '}
                    <button onClick={() => s && onOpen?.(s)} className="font-semibold text-brand hover:underline">{s ? coLabel(s) : link.sponsor}</button>
                    <span className="font-mono text-[10.5px] text-faint"> · {idOf(link.sponsor)}</span>
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-faint">Link {link.since} bởi {link.by} · lần dùng gần nhất {link.lastUsed ?? '—'}</p>
                </div>
                <RowAction tone="rose" onClick={() => onRemove(link.sponsor)}>Remove link</RowAction>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide text-faint">Đã dùng</span>
                <UsedChips used={link.used} />
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
        <b className="text-muted">Không có “còn lại / tổng” ở đây, và không có hoá đơn</b> — cả hai nằm trên hồ sơ của từng sponsor. Sponsor không phải công ty mẹ — chỉ dùng chung quota. Job của {coLabel(c)} vẫn đứng tên {coLabel(c)}; tiền, hạng và customer status tính cho sponsor.
        Lúc đăng tin, PO của mỗi sponsor nằm trong nhóm riêng “Shared by …” — chọn PO nào thì trừ PO đó, không có ưu tiên tự động.
      </p>
    </>
  )
}

export function SharedQuotaCard({ c, onOpen }: { c: Company; onOpen?: (x: Company) => void }) {
  /* Local copies so the prototype can link and remove without touching the seed. */
  const [links, setLinks] = useState<ShareLink[]>(() => beneficiariesOf(c.name))
  const [mine, setMine] = useState<ShareLink[]>(() => sponsorsOf(c.name))
  const [linking, setLinking] = useState(false)
  const hasPo = poHistory(c).some((p) => p.invoiced) || sponsorProducts(c.name).length > 0
  const isSponsor = links.length > 0
  if (!isSponsor && mine.length === 0 && !hasPo) return null
  const today = '25/09/2026'
  return (
    <DetailCard
      title={mine.length ? 'Shared quota — dùng chung từ sponsor' : 'Shared quota — công ty dùng chung PO này'}
      action={mine.length
        ? <span className="text-[11px] text-faint">beneficiary · {mine.length} sponsor</span>
        : <button onClick={() => setLinking(true)} className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">+ Link company</button>}
    >
      {mine.length ? (
        <BeneficiaryView c={c} links={mine} onOpen={onOpen} onRemove={(sp) => setMine((ls) => ls.filter((l) => l.sponsor !== sp))} />
      ) : (
        <SponsorView
          c={c}
          links={links}
          onOpen={onOpen}
          onRemove={(name) => setLinks((ls) => ls.map((l) => (l.beneficiary === name && l.status === 'active' ? { ...l, status: 'removed', removedAt: today, removedBy: 'Nguyễn Thị Lan' } : l)))}
        />
      )}
      {linking && (
        <LinkCompanyModal
          sponsor={c}
          links={links}
          onLink={(x) => setLinks((ls) => [{ sponsor: c.name, beneficiary: x.name, since: today, by: 'Nguyễn Thị Lan', status: 'active', used: {}, jobs: [] }, ...ls])}
          onClose={() => setLinking(false)}
        />
      )}
    </DetailCard>
  )
}

/*
 * OVERVIEW snapshot — the relationship at a glance, next to Affiliated companies,
 * because that is where a reader looks for "who is this company tied to". It
 * answers only WHO and HOW MUCH; the matrix, the footer and the link/remove
 * actions stay on Products & billing. Renders nothing when there is no link.
 */
export function SharedQuotaOverview({ c, onOpen, onGoBilling }: { c: Company; onOpen?: (x: Company) => void; onGoBilling?: () => void }) {
  const mine = sponsorsOf(c.name)
  const [links, setLinks] = useState<ShareLink[]>(() => beneficiariesOf(c.name))
  const [linking, setLinking] = useState(false)
  const active = links.filter((l) => l.status === 'active')
  const canSponsor = poHistory(c).some((p) => p.invoiced) || sponsorProducts(c.name).length > 0
  if (mine.length === 0 && active.length === 0 && !canSponsor) return null
  const goBilling = <button onClick={onGoBilling} className="text-[11px] font-medium text-brand hover:underline">Products &amp; billing →</button>
  if (mine.length > 0) {
    return (
      <DetailCard title="Dùng chung quota — Shared quota" action={<Pill tone="neutral">beneficiary · {mine.length} sponsor</Pill>}>
        <ul className="divide-y divide-line-soft rounded-lg border border-line bg-canvas/40">
          {mine.map((link) => {
            const s = byName(link.sponsor)
            return (
              <li key={link.sponsor} className="px-2.5 py-2">
                <p className="text-[12px] text-ink/85">
                  PO của{' '}
                  <button onClick={() => s && onOpen?.(s)} className="font-semibold text-brand hover:underline">{s ? coLabel(s) : link.sponsor}</button>
                  <span className="font-mono text-[10.5px] text-faint"> · {idOf(link.sponsor)} · link {link.since}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5"><span className="text-[10px] uppercase tracking-wide text-faint">Đã dùng</span><UsedChips used={link.used} /></div>
              </li>
            )
          })}
        </ul>
        <p className="mt-1.5 text-[10.5px] text-faint">Không phải công ty mẹ — chỉ dùng chung quota. Hoá đơn, tổng và số còn lại ở hồ sơ từng sponsor.</p>
        <div className="mt-2 flex justify-end">{goBilling}</div>
      </DetailCard>
    )
  }
  const total = active.reduce((s, l) => s + linkTotal(l), 0)
  const today = '25/09/2026'
  return (
    <DetailCard
      title="Dùng chung quota — Shared quota"
      action={
        <span className="flex items-center gap-2">
          {active.length > 0 && <Pill tone="active">sponsor · {active.length} công ty</Pill>}
          <button onClick={() => setLinking(true)} className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">+ Link company</button>
        </span>
      }
    >
      {active.length === 0 ? (
        <p className="text-[12px] text-muted">Chưa có công ty nào dùng chung quota của {coLabel(c)}. <b>+ Link company</b> — nhập Company ID; link bao nhiêu công ty cũng được.</p>
      ) : (
        <>
          <p className="text-[11px] leading-relaxed text-muted">
            {coLabel(c)} đứng tên PO; <b className="text-ink/80">{active.length} công ty</b> được link đang đăng tin từ quota đó — đã dùng <b className="text-ink/80">{total}</b> đơn vị. Không phải công ty con: mỗi bên vẫn là khách hàng riêng.
          </p>
          <ul className="mt-2 divide-y divide-line-soft rounded-lg border border-line bg-canvas/40">
            {active.map((l) => {
              const b = byName(l.beneficiary)
              return (
                <li key={l.beneficiary} className="flex items-start justify-between gap-2 px-2.5 py-2">
                  <span className="min-w-0">
                    <button onClick={() => b && onOpen?.(b)} className="block truncate text-[12px] font-medium text-brand hover:underline">{b ? coLabel(b) : l.beneficiary}</button>
                    <span className="block font-mono text-[10px] text-faint">{idOf(l.beneficiary)} · link {l.since}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <b className="block text-[13px] tabular-nums text-ink">{linkTotal(l)}</b>
                    <span className="block text-[10px] text-faint">đơn vị · {l.lastUsed ?? '—'}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10.5px] text-faint">Bảng theo từng sản phẩm, còn lại / tổng và Remove ở tab Products &amp; billing.</span>
        {goBilling}
      </div>
      {linking && (
        <LinkCompanyModal
          sponsor={c}
          links={links}
          onLink={(x) => setLinks((ls) => [{ sponsor: c.name, beneficiary: x.name, since: today, by: 'Nguyễn Thị Lan', status: 'active', used: {}, jobs: [] }, ...ls])}
          onClose={() => setLinking(false)}
        />
      )}
    </DetailCard>
  )
}
