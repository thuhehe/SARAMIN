import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  INDUSTRY_INDEX, INDUSTRY_TREE, LEVEL_LABEL, industryBranch, industryChain, industryLevel, industryPath,
} from '@/pages/admin/data/industries'
import type { IndustryNode } from '@/pages/admin/data/industries'

/* ── The 3-level industry picker ─────────────────────────────────────────────
   Group › industry › specialty, and ANY level can be chosen. Same component and
   same four checkbox states as the jobseeker-side picker (Jobseeker & user ›
   Onboarding · "Industry picker"), because a second implementation of a tree
   this fiddly diverges within a sprint:

     Selected  this node itself is chosen — click to unselect
     Included  an ANCESTOR is chosen; pale tick + "đã gồm", locked. Clicking
               explains rather than silently doing nothing.
     Partial   some descendants are chosen, this node is not — dash + count.
               Clicking takes the whole node and MERGES the children into it.
     Empty     click to choose

   Choosing a parent means "all of it" and is stored as that ONE node, never
   expanded into its leaves — otherwise tagging a group writes forty rows that all
   have to be rewritten the day the taxonomy gains a branch. */

type NodeState = 'selected' | 'included' | 'partial' | 'empty'

function stateOf(id: string, value: string[]): NodeState {
  if (value.includes(id)) return 'selected'
  if (industryChain(id).slice(0, -1).some((a) => value.includes(a))) return 'included'
  const branch = industryBranch(id).slice(1)
  return branch.some((d) => value.includes(d)) ? 'partial' : 'empty'
}
const chosenUnder = (id: string, value: string[]) => industryBranch(id).slice(1).filter((d) => value.includes(d)).length

function Box({ state, count }: { state: NodeState; count: number }) {
  return (
    <span className={cn(
      'grid h-[14px] w-[14px] shrink-0 place-items-center rounded border text-[9px] font-bold leading-none',
      state === 'selected' && 'border-brand bg-brand text-white',
      state === 'included' && 'border-brand/35 bg-brand-soft text-brand/60',
      state === 'partial' && 'border-brand bg-surface text-brand',
      state === 'empty' && 'border-line bg-surface text-transparent',
    )}>
      {state === 'selected' || state === 'included' ? '✓' : state === 'partial' ? '–' : ''}
      {state === 'partial' && count > 0 && <span className="sr-only">{count}</span>}
    </span>
  )
}

function Column({ nodes, value, openId, onOpen, onToggle, onLocked }: {
  nodes: IndustryNode[]; value: string[]; openId: string | null
  onOpen: (id: string) => void; onToggle: (id: string) => void; onLocked: (id: string) => void
}) {
  return (
    <div className="max-h-[220px] min-w-0 flex-1 overflow-y-auto border-r border-line-soft last:border-r-0">
      {nodes.map((n) => {
        const st = stateOf(n.id, value)
        const cnt = chosenUnder(n.id, value)
        return (
          <div key={n.id} className={cn('flex items-start gap-1.5 px-2 py-1 text-[11.5px]', openId === n.id && 'bg-canvas')}>
            <button
              onClick={() => (st === 'included' ? onLocked(n.id) : onToggle(n.id))}
              className="mt-[3px] cursor-pointer"
              title={st === 'included' ? 'Đã nằm trong một mục cha đang được chọn' : undefined}
            >
              <Box state={st} count={cnt} />
            </button>
            {/* The LABEL opens the next level; the BOX selects. Two targets, so
                drilling down never selects by accident — the mistake that makes a
                tree picker feel unusable. Labels wrap, never truncate with "…". */}
            <button
              onClick={() => n.children && onOpen(n.id)}
              className={cn('min-w-0 flex-1 text-left leading-snug', st === 'included' ? 'text-faint' : 'text-ink/85', n.children && 'hover:text-brand')}
            >
              {n.name}
              {st === 'included' && <span className="ml-1 text-[10px] text-faint">· đã gồm</span>}
              {st === 'partial' && cnt > 0 && <span className="ml-1 rounded-full bg-brand-soft px-1.5 text-[9.5px] font-semibold text-brand">{cnt}</span>}
            </button>
            {n.children && <span className="mt-[2px] shrink-0 text-[10px] text-faint">›</span>}
          </div>
        )
      })}
    </div>
  )
}

export function IndustryTreePicker({ value, onChange, limit }: { value: string[]; onChange: (v: string[]) => void; limit?: number }) {
  const [g, setG] = useState<string | null>(INDUSTRY_TREE[0]?.id ?? null)
  const [i2, setI2] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [note, setNote] = useState('')

  const col2 = g ? (INDUSTRY_INDEX[g]?.node.children ?? []) : []
  const col3 = i2 ? (INDUSTRY_INDEX[i2]?.node.children ?? []) : []

  const toggle = (id: string) => {
    setNote('')
    if (value.includes(id)) return onChange(value.filter((v) => v !== id))
    if (limit && value.length >= limit) return setNote(`Tối đa ${limit} lĩnh vực. Bỏ bớt một mục để chọn thêm.`)
    /* MERGE: taking a parent absorbs whatever was chosen beneath it, so the same
       branch is never stored twice at two depths. */
    const under = industryBranch(id).slice(1)
    const merged = value.filter((v) => !under.includes(v))
    if (merged.length < value.length) setNote(`Đã gộp ${value.length - merged.length} mục con vào “${INDUSTRY_INDEX[id].node.name}” — chọn mục cha là chọn cả nhánh.`)
    onChange([...merged, id])
  }
  const locked = (id: string) => {
    const owner = industryChain(id).slice(0, -1).find((a) => value.includes(a))
    setNote(`${INDUSTRY_INDEX[id].node.name} đã nằm trong ${INDUSTRY_INDEX[owner!].node.name}. Bỏ chọn ${INDUSTRY_INDEX[owner!].node.name} nếu chỉ muốn chọn riêng mục này.`)
  }

  /* Search runs across ALL THREE levels and returns a flat list — each hit shows
     its level and its path, and is selectable right there. Without it, finding a
     specialty means guessing which group it lives under. */
  const hits = q.trim()
    ? Object.values(INDUSTRY_INDEX).filter((n) => n.node.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 12)
    : []

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-faint">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm ở cả 3 cấp — nhóm, ngành, chuyên ngành…" className="w-full rounded-lg border border-line bg-surface py-1 pl-7 pr-2 text-[11.5px] outline-none focus:border-brand" />
        </div>
        {value.length > 0 && <button onClick={() => { onChange([]); setNote('') }} className="shrink-0 text-[11px] text-faint hover:text-ink">Xoá hết</button>}
      </div>

      {q.trim() ? (
        <div className="max-h-[220px] overflow-y-auto rounded-lg border border-line">
          {hits.length === 0 && <p className="px-3 py-2 text-[11.5px] text-faint">Không có mục nào khớp.</p>}
          {hits.map((h) => {
            const st = stateOf(h.node.id, value)
            return (
              <button key={h.node.id} onClick={() => (st === 'included' ? locked(h.node.id) : toggle(h.node.id))} className="flex w-full items-start gap-2 border-b border-line-soft px-2.5 py-1.5 text-left last:border-b-0 hover:bg-canvas">
                <span className="mt-[3px]"><Box state={st} count={chosenUnder(h.node.id, value)} /></span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] leading-snug text-ink/85">{h.node.name}</span>
                  <span className="block text-[10px] text-faint">{LEVEL_LABEL[h.level]} · {industryPath(h.node.id)}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex overflow-hidden rounded-lg border border-line">
          <Column nodes={INDUSTRY_TREE} value={value} openId={g} onOpen={(id) => { setG(id); setI2(null) }} onToggle={toggle} onLocked={locked} />
          {col2.length > 0
            ? <Column nodes={col2} value={value} openId={i2} onOpen={setI2} onToggle={toggle} onLocked={locked} />
            : <div className="min-w-0 flex-1 px-2 py-2 text-[10.5px] text-faint">Nhóm này không chia nhỏ hơn.</div>}
          {col3.length > 0
            ? <Column nodes={col3} value={value} openId={null} onOpen={() => {}} onToggle={toggle} onLocked={locked} />
            : <div className="min-w-0 flex-1 px-2 py-2 text-[10.5px] text-faint">{i2 ? 'Ngành này không có chuyên ngành.' : 'Chọn một ngành để xem chuyên ngành.'}</div>}
        </div>
      )}

      {note && <p className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">{note}</p>}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-[11px] text-faint">Chưa chọn ngành nào.</span>}
        {value.map((id) => (
          <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">
            <span className="rounded bg-brand/15 px-1 text-[9.5px] font-semibold uppercase">{LEVEL_LABEL[industryLevel(id)]}</span>
            {industryPath(id)}
            <button onClick={() => onChange(value.filter((v) => v !== id))} className="text-brand/60 hover:text-brand">✕</button>
          </span>
        ))}
      </div>
    </div>
  )
}
