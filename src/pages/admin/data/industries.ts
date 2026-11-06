/* ── Industry master data · 3 levels ─────────────────────────────────────────
   group (level 1) › industry (level 2) › specialty (level 3).

   The SAME tree the jobseeker Industry picker uses (Jobseeker & user ›
   Onboarding · "Industry picker — any of the 3 levels can be chosen"). A node is
   chosen AS ITSELF at whatever level — choosing a group means "all of it" and is
   stored as that one node, never expanded into its leaves. Otherwise tagging a
   group would write forty rows that all have to be rewritten when the taxonomy
   gains a branch.

   This is a WIREFRAME subset. The real list comes from Master data and is longer;
   it is modelled here only deep enough that the picker and the ancestor-chain
   matching can be judged against something real. */
export type IndustryNode = { id: string; name: string; children?: IndustryNode[] }

export const INDUSTRY_TREE: IndustryNode[] = [
  { id: 'it', name: 'IT / Software', children: [
    { id: 'it-sw', name: 'Software & IT services', children: [
      { id: 'it-sw-dev', name: 'Software development' },
      { id: 'it-sw-data', name: 'Data & AI' },
      { id: 'it-sw-sec', name: 'Cybersecurity' },
    ] },
    { id: 'it-hw', name: 'Hardware & devices', children: [
      { id: 'it-hw-semi', name: 'Semiconductors' },
      { id: 'it-hw-net', name: 'Networking equipment' },
    ] },
    { id: 'it-bpo', name: 'IT outsourcing' },
  ] },
  { id: 'tel', name: 'Telecommunications', children: [
    { id: 'tel-net', name: 'Mobile & fixed networks' },
    { id: 'tel-dc', name: 'Internet & data centres' },
  ] },
  { id: 'fin', name: 'Banking / Finance', children: [
    { id: 'fin-bank', name: 'Banking', children: [
      { id: 'fin-bank-retail', name: 'Retail banking' },
      { id: 'fin-bank-corp', name: 'Corporate banking' },
    ] },
    { id: 'fin-ins', name: 'Insurance' },
    { id: 'fin-sec', name: 'Securities & funds' },
  ] },
  { id: 'fmcg', name: 'FMCG', children: [
    { id: 'fmcg-fb', name: 'Food & beverage', children: [
      { id: 'fmcg-fb-dairy', name: 'Dairy' },
      { id: 'fmcg-fb-bev', name: 'Beverages' },
      { id: 'fmcg-fb-pack', name: 'Packaged food' },
    ] },
    { id: 'fmcg-hpc', name: 'Household & personal care' },
  ] },
  { id: 'ret', name: 'Retail', children: [
    { id: 'ret-super', name: 'Supermarkets & convenience' },
    { id: 'ret-ecom', name: 'E-commerce' },
    { id: 'ret-spec', name: 'Specialty retail' },
  ] },
  { id: 'mfg', name: 'Manufacturing', children: [
    { id: 'mfg-elec', name: 'Electronics assembly' },
    { id: 'mfg-tex', name: 'Textiles & footwear' },
    { id: 'mfg-mach', name: 'Machinery & metal' },
    { id: 'mfg-chem', name: 'Chemicals & plastics' },
  ] },
  { id: 'log', name: 'Logistics', children: [
    { id: 'log-wh', name: 'Warehousing & fulfilment' },
    { id: 'log-freight', name: 'Freight & transport', children: [
      { id: 'log-freight-road', name: 'Road freight' },
      { id: 'log-freight-sea', name: 'Sea & air freight' },
    ] },
    { id: 'log-lastmile', name: 'Last-mile delivery' },
  ] },
  { id: 'con', name: 'Construction & Real Estate', children: [
    { id: 'con-build', name: 'Construction & contracting' },
    { id: 'con-re', name: 'Real estate development' },
    { id: 'con-mat', name: 'Building materials' },
  ] },
  { id: 'hc', name: 'Healthcare', children: [
    { id: 'hc-hosp', name: 'Hospitals & clinics' },
    { id: 'hc-pharma', name: 'Pharmaceuticals' },
    { id: 'hc-dev', name: 'Medical devices' },
  ] },
  { id: 'edu', name: 'Education', children: [
    { id: 'edu-k12', name: 'K-12 & language centres' },
    { id: 'edu-uni', name: 'Higher education' },
    { id: 'edu-tech', name: 'EdTech' },
  ] },
  { id: 'hos', name: 'Hospitality & Tourism', children: [
    { id: 'hos-hotel', name: 'Hotels & resorts' },
    { id: 'hos-food', name: 'Food service' },
    { id: 'hos-travel', name: 'Travel & tours' },
  ] },
  { id: 'med', name: 'Media & Advertising', children: [
    { id: 'med-ad', name: 'Advertising & marketing' },
    { id: 'med-pub', name: 'Publishing & broadcasting' },
    { id: 'med-dig', name: 'Digital content' },
  ] },
]

export type IndustryInfo = { node: IndustryNode; level: 1 | 2 | 3; path: IndustryNode[] }

/** id → the node, its level, and the chain from the group down to it. Built once. */
export const INDUSTRY_INDEX: Record<string, IndustryInfo> = (() => {
  const out: Record<string, IndustryInfo> = {}
  const walk = (nodes: IndustryNode[], path: IndustryNode[]) => {
    for (const n of nodes) {
      const p = [...path, n]
      out[n.id] = { node: n, level: p.length as 1 | 2 | 3, path: p }
      if (n.children) walk(n.children, p)
    }
  }
  walk(INDUSTRY_TREE, [])
  return out
})()

export const INDUSTRY_IDS = Object.keys(INDUSTRY_INDEX)
export const industryName = (id: string) => INDUSTRY_INDEX[id]?.node.name ?? id
export const industryLevel = (id: string) => INDUSTRY_INDEX[id]?.level ?? 1
/** "Logistics › Freight & transport › Road freight" */
export const industryPath = (id: string) => (INDUSTRY_INDEX[id]?.path ?? []).map((n) => n.name).join(' › ')
/** the ids from the group down to this node, this node included */
export const industryChain = (id: string) => (INDUSTRY_INDEX[id]?.path ?? []).map((n) => n.id)
/** this node and everything under it */
export const industryBranch = (id: string): string[] => {
  const n = INDUSTRY_INDEX[id]?.node
  if (!n) return []
  const out = [n.id]
  const walk = (ns: IndustryNode[]) => ns.forEach((c) => { out.push(c.id); if (c.children) walk(c.children) })
  if (n.children) walk(n.children)
  return out
}
export const LEVEL_LABEL: Record<1 | 2 | 3, string> = { 1: 'Cả nhóm', 2: 'Cả ngành', 3: 'Chuyên ngành' }

/* ── How a tagged set reaches a job ──────────────────────────────────────────
   The job carries ONE industry node, at any level. A set carries SEVERAL, at any
   level. They meet on the chain:

     ANCESTOR  the set is tagged at the job's own node or above it — a real match.
               The deeper the matched node, the more specific the fit, so a set
               tagged "Road freight" beats one tagged "Logistics" for a Road
               freight job. This is the direction that must always work: tagging a
               photo at group level is how one picture covers a whole branch.
     DESCENDANT the set is tagged BELOW the job's node — the job said "Logistics"
               and the set says "Road freight". Usable, but it is a guess about a
               job that did not commit, so it ranks after every ancestor match.
     NEUTRAL   anyIndustry. Last resort, and never counted as coverage.

   Returning a TIER rather than a boolean is what lets the resolver prefer the
   specific picture without ever leaving a card empty. */
export type MatchTier = { tier: 0 | 1 | 2; depth: number } | null
export function industryMatch(setIds: string[], jobId: string, anyIndustry?: boolean): MatchTier {
  const chain = industryChain(jobId)
  let best: MatchTier = null
  for (const id of setIds) {
    const at = chain.indexOf(id)
    if (at >= 0) { const c = { tier: 0 as const, depth: at + 1 }; if (!best || best.tier > 0 || c.depth > best.depth) best = c }
  }
  if (best) return best
  const branch = industryBranch(jobId)
  if (setIds.some((id) => branch.includes(id))) return { tier: 1, depth: 0 }
  return anyIndustry ? { tier: 2, depth: 0 } : null
}
