/*
 * The sales org — who owns which book. Drives record scope on the company list.
 */
/* The signed-in rep. Every activity is stamped with THIS account — not with the
   company's sales owner — because whoever does the work is who the KPI counts. */
export const ME = 'Nguyễn Thị Lan'

/* ── Sales org — drives record scope on the Company list ───────────────────────
 * Saramin Sales department:
 *   • A SALES MANAGER heads the department and sees every team's book.
 *   • Under the manager are (up to) 2 TEAMS, each run by a SALES LEAD.
 *   • A salesperson belongs to exactly ONE team; a lead may run up to 2 teams.
 *     Nothing nests below the team.
 * The LIST follows this tree:
 *   rep      → only companies they own (no tab).
 *   lead     → own book (Sales view) + every company owned by a salesperson in
 *              the team(s) they lead (Sales lead view).
 *   manager  → own book (Sales view) + every salesperson's book (Sales manager view).
 * SCOPE APPLIES TO THE LIST ONLY. Every salesperson can SEARCH, OPEN and LOG AN
 * ACTIVITY on ANY company on the platform — otherwise "not in my list" reads as
 * "does not exist" and the rep creates a duplicate. Only the sales OWNER may edit
 * a company's own fields (see the CompanyDetail owner gate). */
type SalesTeam = { name: string; lead: string; members: string[] }
export const SALES_TEAMS: SalesTeam[] = [
  // A lead is also a member of their home team; Nguyễn Thị Lan leads BOTH teams.
  { name: 'Team A', lead: 'Nguyễn Thị Lan', members: ['Nguyễn Thị Lan', 'Phạm Quang Huy'] },
  { name: 'Team B', lead: 'Nguyễn Thị Lan', members: ['Trần Quốc Trung'] },
]
export const SALES_MANAGER = 'Đỗ Xuân Trường'
export type SalesRole = 'rep' | 'lead' | 'manager'
export const SALES_ROLE_LABEL: Record<SalesRole, string> = { rep: 'Salesperson', lead: 'Sales lead', manager: 'Sales manager' }
export type SalesPersona = { name: string; role: SalesRole }
/* The identities you can "log in as" on the Company list to see how scope changes. */
export const SALES_PERSONAS: SalesPersona[] = [
  { name: 'Phạm Quang Huy', role: 'rep' },       // plain rep, Team A → own book only
  { name: 'Nguyễn Thị Lan', role: 'lead' },      // leads Team A + Team B → own + team view
  { name: SALES_MANAGER, role: 'manager' },      // department head → own + department view
]
/* Every distinct member of the team(s) a person leads (the lead included). */
export const teamBookOf = (leadName: string): Set<string> => {
  const set = new Set<string>()
  for (const t of SALES_TEAMS) if (t.lead === leadName) t.members.forEach((m) => set.add(m))
  return set
}
/* All salespeople in the department — every team member, plus the manager. */
export const SALES_DEPT = new Set<string>([...SALES_TEAMS.flatMap((t) => t.members), SALES_MANAGER])
