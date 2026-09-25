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

/*
 * The Link control — the KR admin's "ID AMS" pattern, which the client asked for
 * by picture: a LIST of Company-ID boxes, one per linked company, a red − on
 * each, an empty box to type the next ID into, and one SAVE for the lot. No
 * dialog, no search: the operator pastes IDs the sponsor handed over, sees the
 * resolved company appear beside each box, and saves once.
 *
 * Existing links are rows too — read-only ID, the company and its usage beside
 * it — so adding and removing happen in one place and the Save button states
 * exactly what it is about to do.
 */
type IdRow = { key: number; raw: string; existing?: ShareLink; removed?: boolean }
let rowSeq = 1

export function CompanyIdRows({ sponsor, links, onSave }: { sponsor: Company; links: ShareLink[]; onSave: (change: { add: Company[]; remove: string[] }) => void }) {
  const active = links.filter((l) => l.status === 'active')
  const fresh = (): IdRow[] => [...active.map((l) => ({ key: rowSeq++, raw: idOf(l.beneficiary), existing: l })), { key: rowSeq++, raw: '' }]
  const [rows, setRows] = useState<IdRow[]>(fresh)
  const set = (key: number, patch: Partial<IdRow>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  /* live verdict per NEW row — the same six checks the server runs, plus "typed
     twice in this list", which only this screen can see */
  const verdict = (r: IdRow) => {
    if (r.existing || !r.raw.trim()) return null
    const v = resolveId(r.raw, sponsor, links)
    if (v?.ok && rows.some((o) => o.key !== r.key && !o.existing && o.raw.trim().toUpperCase() === r.raw.trim().toUpperCase())) return { ok: false as const, why: 'ID này đã nhập ở dòng trên.' }
    return v
  }
  const adds = rows.filter((r) => !r.existing && verdict(r)?.ok).map((r) => (verdict(r) as { ok: true; c: Company }).c)
  const removes = rows.filter((r) => r.existing && r.removed).map((r) => r.existing!.beneficiary)
  const invalid = rows.some((r) => { const v = verdict(r); return v !== null && !v.ok })
  const dirty = adds.length > 0 || removes.length > 0
  const save = () => { onSave({ add: adds, remove: removes }); setRows(fresh()) }
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink/80">Company ID <span className="font-normal text-faint">— công ty dùng chung quota của {coLabel(sponsor)}</span></p>
      <div className="mt-1.5 space-y-1.5">
        {rows.map((r) => {
          const v = verdict(r)
          const dim = r.removed
          return (
            <div key={r.key}>
              <div className={cn('flex items-stretch overflow-hidden rounded-md border', dim ? 'border-line opacity-50' : v && !v.ok ? 'border-rose-300' : 'border-line')}>
                {r.existing ? (
                  <>
                    {/* Two lines, not one: in the narrow Overview column a one-line row
                        truncated the company name to nothing, and the name is the
                        only thing telling the operator the ID resolved to the right
                        company. */}
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2 bg-surface px-3 py-1.5">
                      <span className="min-w-0">
                        <span className="block font-mono text-[12.5px] leading-tight text-ink">{r.raw}</span>
                        <span className="block truncate text-[11px] leading-tight text-muted">{byName(r.existing.beneficiary) ? coLabel(byName(r.existing.beneficiary)!) : r.existing.beneficiary}</span>
                      </span>
                      <span className="shrink-0 text-right text-[10.5px] leading-tight tabular-nums text-faint">{linkTotal(r.existing)} đơn vị<span className="block">link {r.existing.since}</span></span>
                    </span>
                    <button
                      onClick={() => set(r.key, { removed: !r.removed })}
                      title={r.removed ? 'Giữ lại' : 'Gỡ khi Save'}
                      className={cn('w-10 shrink-0 text-[16px] font-bold text-white', r.removed ? 'bg-slate-400' : 'bg-rose-500 hover:bg-rose-600')}
                    >{r.removed ? '↺' : '−'}</button>
                  </>
                ) : (
                  <>
                    <input
                      value={r.raw}
                      onChange={(e) => set(r.key, { raw: e.target.value })}
                      placeholder="CO-XXXXXXX"
                      className="min-w-0 flex-1 bg-surface px-3 py-2 font-mono text-[12.5px] uppercase outline-none placeholder:font-sans placeholder:normal-case placeholder:text-faint"
                    />
                    {v?.ok && <span className="flex shrink-0 items-center px-2 text-[11.5px] text-emerald-700">✓ {coLabel(v.c)}</span>}
                    <button
                      onClick={() => setRows((rs) => (rs.filter((o) => !o.existing && !o.raw.trim()).length <= 1 && !r.raw.trim() ? rs : rs.filter((o) => o.key !== r.key)))}
                      title="Bỏ dòng"
                      className="w-10 shrink-0 bg-rose-500 text-[16px] font-bold text-white hover:bg-rose-600"
                    >−</button>
                  </>
                )}
              </div>
              {v && !v.ok && <p className="mt-0.5 text-[10.5px] text-rose-700">✗ {v.why}</p>}
              {r.removed && <p className="mt-0.5 text-[10.5px] text-amber-800">Sẽ gỡ khi Save — tin đã đăng vẫn chạy hết hạn, số đã dùng vẫn ở lại bảng.</p>}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => setRows((rs) => [...rs, { key: rowSeq++, raw: '' }])} className="text-[11px] font-medium text-brand hover:underline">+ Thêm ID</button>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[10.5px] text-faint">{adds.length > 0 && `link ${adds.length}`}{adds.length > 0 && removes.length > 0 && ' · '}{removes.length > 0 && `gỡ ${removes.length}`}</span>}
          <button
            disabled={!dirty || invalid}
            onClick={save}
            className="rounded-md bg-brand px-4 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >SAVE</button>
        </div>
      </div>
      <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
        Nhập đúng <b className="text-muted">Company ID</b> — không tìm theo tên. Điều kiện: tồn tại · <b className="text-muted">Active</b> · không phải sponsor của ai · không phải chính công ty này · chưa link. Link bao nhiêu công ty cũng được; một công ty cũng có thể dùng chung từ nhiều sponsor. Ghi audit log + activity của cả hai bên.
      </p>
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
                <tr><td colSpan={products.length + 5} className="px-3 py-3 text-[12px] text-muted">Chưa link công ty nào — link bằng Company ID ở tab Overview, thẻ Dùng chung quota.</td></tr>
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
        Link thêm công ty ở tab <b className="text-muted">Overview</b> (danh sách Company ID). Remove chỉ chặn lần dùng <b className="text-muted">tiếp theo</b> — tin đã đăng vẫn chạy hết hạn. Trên Company site, công ty được link chỉ thấy <b className="text-muted">hàng của mình</b> — không thấy tổng, còn lại hay hoá đơn.
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

/** Apply a Save from the ID list to the prototype's local link state. */
const TODAY = '25/09/2026'
function applyChange(ls: ShareLink[], sponsor: string, ch: { add: Company[]; remove: string[] }): ShareLink[] {
  const removed = ls.map((l) => (ch.remove.includes(l.beneficiary) && l.status === 'active' ? { ...l, status: 'removed' as const, removedAt: TODAY, removedBy: 'Nguyễn Thị Lan' } : l))
  const added: ShareLink[] = ch.add.map((x) => ({ sponsor, beneficiary: x.name, since: TODAY, by: 'Nguyễn Thị Lan', status: 'active', used: {}, jobs: [] }))
  return [...added, ...removed]
}

export function SharedQuotaCard({ c, onOpen }: { c: Company; onOpen?: (x: Company) => void }) {
  /* Local copies so the prototype can link and remove without touching the seed. */
  const [links, setLinks] = useState<ShareLink[]>(() => beneficiariesOf(c.name))
  const [mine, setMine] = useState<ShareLink[]>(() => sponsorsOf(c.name))
  const hasPo = poHistory(c).some((p) => p.invoiced) || sponsorProducts(c.name).length > 0
  const isSponsor = links.length > 0
  if (!isSponsor && mine.length === 0 && !hasPo) return null
  return (
    <DetailCard
      title={mine.length ? 'Shared quota — dùng chung từ sponsor' : 'Shared quota — công ty dùng chung PO này'}
      action={<span className="text-[11px] text-faint">{mine.length ? `beneficiary · ${mine.length} sponsor` : `${links.filter((l) => l.status === 'active').length} active`}</span>}
    >
      {mine.length ? (
        <BeneficiaryView c={c} links={mine} onOpen={onOpen} onRemove={(sp) => setMine((ls) => ls.filter((l) => l.sponsor !== sp))} />
      ) : (
        <SponsorView
          c={c}
          links={links}
          onOpen={onOpen}
          onRemove={(name) => setLinks((ls) => applyChange(ls, c.name, { add: [], remove: [name] }))}
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
  return (
    <DetailCard
      title="Dùng chung quota — Shared quota"
      action={active.length > 0 ? <Pill tone="active">sponsor · {active.length} công ty · {total} đơn vị đã dùng</Pill> : <span className="text-[11px] text-faint">sponsor · chưa link</span>}
    >
      {/* The KR "ID AMS" list, verbatim in shape: ID boxes, red minus, SAVE. Every
          linked company is a row (ID · name · units used), so this one control is
          both the list and the editor. */}
      <CompanyIdRows sponsor={c} links={links} onSave={(ch) => setLinks((ls) => applyChange(ls, c.name, ch))} />
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-line-soft pt-2">
        <span className="text-[10.5px] text-faint">Không phải công ty con: mỗi bên vẫn là khách hàng riêng. Bảng theo từng sản phẩm, còn lại / tổng ở tab Products &amp; billing.</span>
        {goBilling}
      </div>
    </DetailCard>
  )
}
