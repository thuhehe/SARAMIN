/*
 * Corporate groups: a company can have a parent and children, and the record shows
 * the whole tree it sits in.
 */
import { COMPANIES } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'

/* ── Corporate tree ────────────────────────────────────────────────────────
   Parent and subsidiary are separate legal entities: separate records, separate
   tax codes, separate accounts, separate billing, separate sales owners. The
   only thing the link does is let a rep see the context and click across. A
   BRANCH is the one exception in Vietnamese law — not its own legal entity, so
   it shares the parent's 10-digit tax code and only appends a -001 suffix. We
   store branches in the same tree with the same `parent` field and tell the two
   apart by comparing tax roots, so there is no second mechanism to maintain. */
export const coByName = (n: string) => COMPANIES.find((x) => x.name === n)
/** The 10-digit tax number without a branch suffix — the identity of the legal entity. */
export const taxRoot = (t: string) => t.split('-')[0]
/** Direct children only, in list order. */
export const childrenOf = (c: Company) => COMPANIES.filter((x) => x.parent === c.name)
/** Ancestor chain, furthest first: [group root, …, direct parent]. Depth-guarded so a
    bad `parent` value can never spin the render loop. */
export const ancestorsOf = (c: Company) => {
  const chain: Company[] = []
  let cur = c.parent ? coByName(c.parent) : undefined
  while (cur && chain.length < 8 && !chain.includes(cur)) {
    chain.unshift(cur)
    cur = cur.parent ? coByName(cur.parent) : undefined
  }
  return chain
}
/** The top of the group — the company itself when it has no parent. */
export const groupRootOf = (c: Company) => ancestorsOf(c)[0] ?? c
/** Every company in the same group, the root included. */
export const groupOf = (root: Company) => COMPANIES.filter((x) => groupRootOf(x).name === root.name)
/** True when the company is part of a group at all (has a parent or any children). */
export const inGroup = (c: Company) => Boolean(c.parent) || childrenOf(c).length > 0

/* A company can hold BOTH roles at once — Đông Phong sits under Trường Sơn and has
   Kim Long Steel under it. A binary "parent OR child" label hid that middle layer
   entirely, so every mid-tier company read as a leaf. */
export const coRoles = (c: Company): string[] => {
  const r: string[] = []
  if (c.parent) r.push('công ty con')
  if (childrenOf(c).length > 0) r.push('công ty mẹ')
  return r
}
/* ── the tabbed company record ────────────────────────────────────────────── */
/* ── Affiliated companies — the corporate-tree block on a company record ─────
   One level up (as a breadcrumb) and one level down (as a list). Deliberately not
   the whole tree: the rep needs context and a way across, not an org chart. Every
   row shows the affiliate's OWN tax code, because that is what makes it obvious
   these are separate customers that happen to be related. */
/* Sơ đồ tập đoàn — the whole group as an indented tree, rooted at the top-most
   parent. Deliberately NOT a revenue roll-up: the point of the chart is to show
   that the link is for lookup only, so every node carries its own MST, its own
   tier and its own sales owner. */
/* One indent step. 18px looked fine on a two-level demo group and squeezed the name
   to "Kim Lon…" the moment a real conglomerate went five deep: the indent, the two
   pills and the name all compete for one column. 14px plus a wider modal buys back
   enough room that depth 5 still reads. */
export const INDENT = 14
