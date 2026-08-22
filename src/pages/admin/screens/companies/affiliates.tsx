import { useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { useReadOnly } from '@/pages/admin/ctx'
import { COMPANIES, coKey, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { INDENT, ancestorsOf, childrenOf, coByName, groupOf, groupRootOf, inGroup, taxRoot } from '@/pages/admin/data/companyTree'
import { tierOf } from '@/pages/admin/data/membership'
import { DetailCard, FLabel, Radio } from '@/pages/admin/ui/fields'
import { Pill, TierPill } from '@/pages/admin/ui/status'
import { searchKey } from '@/pages/admin/ui/table'

function GroupChart({ root, current, onClose, onOpen }: { root: Company; current: Company; onClose: () => void; onOpen?: (x: Company) => void }) {
  const rows: { c: Company; depth: number }[] = []
  const walk = (n: Company, depth: number) => {
    rows.push({ c: n, depth })
    childrenOf(n).forEach((k) => walk(k, depth + 1))
  }
  walk(root, 0)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[940px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Sơ đồ tập đoàn — {coLabel(root)}</p>
            <p className="text-[11px] text-muted">{rows.length} công ty · liên kết chỉ để tra cứu, không kế thừa quota, hợp đồng hay doanh thu.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto p-3">
          <div className="grid gap-x-3 border-b border-line px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: 'minmax(0,3.2fr) 1fr 0.9fr 1.1fr' }}>
            <span>Công ty</span><span>MST</span><span>Hạng</span><span>Sales phụ trách</span>
          </div>
          {rows.map(({ c, depth }) => {
            const t = tierOf(c)
            const isCurrent = c.name === current.name
            return (
              <button
                key={c.name}
                onClick={() => { onClose(); onOpen?.(c) }}
                className={cn('grid w-full items-center gap-x-3 border-b border-line-soft px-2 py-2 text-left text-[12px] transition-colors hover:bg-canvas/70', isCurrent && 'bg-brand-soft/50')}
                style={{ gridTemplateColumns: 'minmax(0,3.2fr) 1fr 0.9fr 1.1fr' }}
              >
                <span className="flex min-w-0 items-center" style={{ paddingLeft: depth * INDENT }}>
                  {depth > 0 && <span className="mr-1.5 shrink-0 text-faint">└</span>}
                  <span className={cn('min-w-0 truncate', isCurrent ? 'font-semibold text-brand' : 'text-ink/80')}>{coLabel(c)}</span>
                  {depth > 0 && <span className="ml-1.5 shrink-0"><Pill tone="neutral">Công ty con</Pill></span>}
                  {childrenOf(c).length > 0 && <span className="ml-1.5 shrink-0 rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>}
                </span>
                <span className="truncate font-mono text-[11px] text-muted">{c.tax}</span>
                <span className="min-w-0 truncate">{t ? <TierPill tier={t} en /> : <span className="text-[11px] text-faint">Chưa có hạng</span>}</span>
                <span className="truncate text-[11.5px] text-muted">{c.owner}</span>
              </button>
            )
          })}
        </div>

        <div className="border-t border-line bg-canvas/40 px-5 py-2.5 text-[10.5px] leading-relaxed text-muted">
          Mỗi công ty giữ <b className="text-ink/70">MST, gói/quota, hợp đồng, hoá đơn và sales phụ trách riêng</b>. Hạng thành viên
          cũng tính riêng từng pháp nhân — doanh thu công ty con <b className="text-ink/70">không</b> cộng lên công ty mẹ.
        </div>
      </div>
    </div>
  )
}

/* ── Link an EXISTING company as parent or child ───────────────────────────
   Two directions, one stored field. Whichever way the rep thinks about it
   ("this belongs to X" vs "X belongs to this"), the write is always the same:
   parentCompanyId on the CHILD. The modal makes that explicit — it shows the
   resulting mẹ → con pair before saving, so nobody has to work out which record
   actually changes. Every link is simply CÔNG TY CON: the old chi-nhánh /
   công-ty-con split was derived from the tax root and changed nothing a rep could
   act on, so it is gone. Companies sharing the 10-digit tax root are still
   surfaced FIRST in the picker, as the strongest hint of the same legal entity. */
function LinkAffiliateModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const [dir, setDir] = useState<'parent' | 'child'>('parent')
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Company | null>(null)

  // Cycle guard: for "c is a child of X", X may not sit under c; for "c is the
  // parent of X", X may not be an ancestor of c. Without this a group can be
  // linked into a loop that the ancestor walk would then have to survive. The loop
  // is also what Điều 195 forbids outright (a con may not hold capital in its mẹ),
  // so this guard is a legal rule, not only a data-integrity one.
  const candidates = COMPANIES.filter((x) => {
    if (x.name === c.name) return false
    if (dir === 'parent') return !ancestorsOf(x).some((a) => a.name === c.name)
    return !ancestorsOf(c).some((a) => a.name === x.name)
  }).filter((x) => {
    const k = searchKey(q.trim())
    return !k || searchKey([coLabel(x), x.legalName, x.tax, companyId(coKey(x))].join(' ')).includes(k)
  }).sort((a, b) => Number(taxRoot(b.tax) === taxRoot(c.tax)) - Number(taxRoot(a.tax) === taxRoot(c.tax)))

  // Whichever direction was chosen, resolve it to the one pair that gets stored.
  const parent = dir === 'parent' ? pick : c
  const child = dir === 'parent' ? c : pick
  // Re-parenting an existing child is allowed, but it MOVES the record out of its
  // current group — say so rather than letting the tree silently change shape.
  const moving = child?.parent ? coByName(child.parent) : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Gán quan hệ tập đoàn</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Quan hệ</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { k: 'parent' as const, t: `${coLabel(c)} là CÔNG TY CON`, s: 'Chọn công ty mẹ của công ty này', off: false },
                { k: 'child' as const, t: `${coLabel(c)} là CÔNG TY MẸ`, s: 'Chọn công ty con trực thuộc', off: false },
              ]).map((o) => (
                <button
                  key={o.k}
                  onClick={() => { if (o.off) return; setDir(o.k); setPick(null) }}
                  disabled={o.off}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left',
                    o.off ? 'cursor-not-allowed border-line bg-canvas/50 opacity-60' : dir === o.k ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40',
                  )}
                >
                  <span className="flex items-center gap-2"><Radio on={dir === o.k && !o.off} /><span className="text-[12px] font-semibold text-ink">{o.t}</span></span>
                  <span className="mt-0.5 block pl-6 text-[11px] text-muted">{o.s}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11.5px] font-medium text-ink/80">
              {dir === 'parent' ? 'Công ty mẹ' : 'Công ty con'} <span className="text-rose-500">*</span>
            </p>
            {/* The 10-digit tax root is the strongest signal two records are the same
                legal entity, so those companies are surfaced first and labelled —
                the rep should not have to notice the MST match themselves. */}
            <p className="mb-1.5 text-[10.5px] leading-relaxed text-faint">
              Gợi ý đầu danh sách là các công ty <b className="text-ink/70">trùng 10 số gốc MST</b> với {coLabel(c)} (<span className="font-mono">{taxRoot(c.tax)}</span>) — thường là cùng một pháp nhân. Vẫn tìm được mọi công ty khác bên dưới.
            </p>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, MST hoặc Company ID…"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand"
            />
            <div className="mt-1.5 max-h-[200px] space-y-1 overflow-y-auto">
              {candidates.slice(0, 8).map((x) => {
                const sameRoot = taxRoot(x.tax) === taxRoot(c.tax)
                return (
                <button
                  key={x.name}
                  onClick={() => setPick(x)}
                  className={cn('flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left', pick?.name === x.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}
                >
                  <Radio on={pick?.name === x.name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate text-[12px] font-medium text-ink">{coLabel(x)}</span>
                      {sameRoot && <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1 py-px text-[9.5px] font-medium text-amber-700">cùng gốc MST</span>}
                    </span>
                    <span className="block truncate text-[10.5px] text-faint">MST {x.tax} · {companyId(coKey(x))} · {x.owner}</span>
                  </span>
                </button>
                )
              })}
              {candidates.length === 0 && <p className="rounded-md bg-canvas/60 px-2 py-3 text-center text-[11px] text-faint">Không có công ty phù hợp — đã loại công ty hiện tại và mọi lựa chọn sẽ tạo vòng lặp sở hữu.</p>}
            </div>
          </div>

          {pick && parent && child && (
            <div className="rounded-lg border border-line bg-canvas/40 p-3">
              <p className="mb-1.5 text-[11.5px] font-semibold text-ink/70">Sau khi lưu</p>
              <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                <span className="font-medium text-ink">{coLabel(parent)}</span>
                <span className="rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>
                <span className="text-faint">›</span>
                <span className="font-medium text-ink">{coLabel(child)}</span>
                <Pill tone="neutral">Công ty con</Pill>
              </div>
              {moving && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                 {coLabel(child)} đang trực thuộc <b>{coLabel(moving)}</b>. Lưu thay đổi này sẽ <b>chuyển</b> công ty sang tập đoàn mới — ghi vào audit log.
                </p>
              )}
            </div>
          )}

        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} disabled={!pick} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Lưu liên kết</button>
        </div>
      </div>
    </div>
  )
}

/* Unlink ONE parent→child edge. Named from both ends because "unlink this company"
   is ambiguous on a middle node — Đông Phong sits under Trường Sơn and above Kim
   Long, and cutting the edge above it is a different act from cutting the one below.

   The consequence that has to be on screen: descendants travel WITH the child. Cut
   Trường Sơn → Đông Phong and Kim Long does not become a root; it stays under Đông
   Phong, which becomes the root of a new group. */
function UnlinkAffiliateModal({ parent, child, onClose }: { parent: Company; child: Company; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const descendants = (() => {
    const out: Company[] = []
    const walk = (n: Company) => childrenOf(n).forEach((k) => { out.push(k); walk(k) })
    walk(child)
    return out
  })()
  const childKeepsGroup = descendants.length > 0
  const parentLeftAlone = childrenOf(parent).length === 1 && !parent.parent

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Gỡ quan hệ mẹ / con</p>
            <p className="text-[11px] text-muted">Chỉ gỡ liên kết. Không công ty nào bị xoá.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          <div className="rounded-lg border border-line bg-canvas/40 p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="font-medium text-ink">{coLabel(parent)}</span>
              <span className="rounded border border-line bg-canvas px-1 text-[10px] text-muted">Công ty mẹ</span>
              <span className="text-rose-500 line-through">›</span>
              <span className="font-medium text-ink">{coLabel(child)}</span>
              <Pill tone="neutral">Công ty con</Pill>
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">MST {parent.tax} · MST {child.tax} — hai pháp nhân riêng, không thay đổi.</p>
          </div>

          <div className="rounded-lg border border-line px-3 py-2.5">
            <p className="mb-1.5 text-[11.5px] font-semibold text-ink/70">Sau khi gỡ</p>
            <ul className="space-y-1 text-[11.5px] leading-relaxed text-muted">
              <li>· <b className="text-ink/80">{coLabel(child)}</b> {childKeepsGroup ? 'trở thành gốc của một tập đoàn mới' : 'trở thành công ty độc lập'}.</li>
              {childKeepsGroup && (
                <li>· <b className="text-ink/80">{descendants.length} công ty cấp dưới</b> ({descendants.map(coLabel).join(', ')}) đi theo {coLabel(child)} — không bị gỡ.</li>
              )}
              {parentLeftAlone && <li>· <b className="text-ink/80">{coLabel(parent)}</b> không còn công ty con nào.</li>}
              <li>· MST, hợp đồng, quota, báo giá và hoá đơn của cả hai <b className="text-ink/80">giữ nguyên</b> — quan hệ tập đoàn chưa bao giờ gộp doanh thu.</li>
            </ul>
          </div>

          <div>
            <FLabel req>Lý do gỡ</FLabel>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: gán nhầm tập đoàn · đã thoái vốn · tách pháp nhân"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand"
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Ghi vào audit log cùng người thực hiện — quan hệ tập đoàn đổi chủ sở hữu báo cáo, nên luôn phải truy được ai đổi và vì sao.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Hủy</button>
          <button
            onClick={onClose}
            disabled={!reason.trim()}
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gỡ quan hệ
          </button>
        </div>
      </div>
    </div>
  )
}

export function AffiliatedCompanies({ c, onOpen }: { c: Company; onOpen?: (x: Company) => void }) {
  const ro = useReadOnly()
  const [chart, setChart] = useState(false)
  const [linking, setLinking] = useState(false)
  /** The relationship being removed: {parent, child} — always named from both ends,
      never "unlink this", so the confirm can say exactly which edge is cut. */
  const [unlinking, setUnlinking] = useState<{ parent: Company; child: Company } | null>(null)

  const chain = ancestorsOf(c)
  const kids = childrenOf(c)
  const root = groupRootOf(c)
  const go = (x: Company) => onOpen?.(x)

  return (
    <DetailCard
      title="Công ty liên kết — Affiliated companies"
      action={inGroup(c) ? <span className="text-[11px] text-faint">{groupOf(root).length} công ty trong tập đoàn</span> : undefined}
    >
      {/* Where this company sits in its group, root first. Rendered as a boxed path
          rather than a run of links: the tail is THIS company, and it has to read as
          a position rather than as one more thing to click. */}
      {chain.length > 0 && (
        <div className="mb-2.5 rounded-lg border border-line bg-canvas/50 px-2.5 py-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-faint">Vị trí trong tập đoàn</p>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[11.5px]">
            {chain.map((a, i) => (
              <span key={a.name} className="flex items-center gap-1">
                {i === 0 && <span className="text-[11px]"></span>}
                <button onClick={() => go(a)} className="font-medium text-brand hover:underline">{coLabel(a)}</button>
                <span className="text-faint">›</span>
              </span>
            ))}
            <span className="rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">{coLabel(c)}</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[10.5px] text-faint">cấp {chain.length + 1}</span>
              {!ro && (
                <button
                  onClick={() => setUnlinking({ parent: chain[chain.length - 1], child: c })}
                  title={`Gỡ khỏi ${coLabel(chain[chain.length - 1])}`}
                  className="rounded border border-line px-1.5 py-0.5 text-[10.5px] font-medium text-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                >
                  Gỡ
                </button>
              )}
            </span>
          </div>
        </div>
      )}

      {kids.length > 0 ? (
        <div className="space-y-1.5">
          {kids.map((k) => (
            <div key={k.name} className="flex w-full items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5 hover:border-brand/40">
              <button onClick={() => go(k)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-medium text-ink hover:text-brand hover:underline">{coLabel(k)}</p>
                <p className="truncate text-[10.5px] text-faint">MST {k.tax} · {k.owner}</p>
              </button>
              {/* One label. A "chi nhánh" vs "công ty con" split was derived from the
                  tax code and shown here, but it changed nothing a rep can act on —
                  both are separate customers with their own MST, quota and invoices. */}
              <span className="flex shrink-0 items-center gap-1.5">
                <Pill tone="neutral">Công ty con</Pill>
                {!ro && (
                  <button
                    onClick={() => setUnlinking({ parent: c, child: k })}
                    title={`Gỡ ${coLabel(k)} khỏi ${coLabel(c)}`}
                    className="rounded border border-line px-1.5 py-0.5 text-[10.5px] font-medium text-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                  >
                    Gỡ
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11.5px] text-muted">
          {chain.length
            ? 'Không có công ty con trực tiếp.'
            : 'Chưa thuộc tập đoàn nào và chưa có công ty con.'}
        </p>
      )}

      {/* One action only: LINK an existing record, either direction. A subsidiary
          that does not exist yet is created from the Companies list like any other
          company — a second create path here would be a second way to make a
          duplicate, and the group link is not a reason to bypass the MST check. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-2.5">
        {!ro && <button onClick={() => setLinking(true)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-ink/40">Gán quan hệ mẹ / con</button>}
        {inGroup(c) && <button onClick={() => setChart(true)} className="ml-auto text-[11px] font-medium text-brand hover:underline">Xem sơ đồ tập đoàn ↗</button>}
      </div>

      {chart && <GroupChart root={root} current={c} onClose={() => setChart(false)} onOpen={onOpen} />}
      {linking && <LinkAffiliateModal c={c} onClose={() => setLinking(false)} />}
      {unlinking && <UnlinkAffiliateModal {...unlinking} onClose={() => setUnlinking(null)} />}
    </DetailCard>
  )
}
