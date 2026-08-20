import type { BuildModule } from './types'

/*
 * Roles & permissions — identity & access for the whole product.
 *
 * Governs WHO can log in and WHAT they can see and do, across both the Admin
 * console (Saramin staff = operators) and the Employer site (company users).
 * Three features, in setup order:
 *
 *   Staff directory      the master people list (name · email · phone · dept).
 *   Roles & permissions  a permission tree — None / Read / Read & write per page.
 *   Operators (users)    a staff login assigned exactly one role; the invite
 *                        mirrors the company HR invite (set-own-password).
 *
 * Split out of the System module because access is a feature in its own right.
 * The general System settings (Company info, Master data, Audit log, Environment,
 * Departments, Membership tiers) live in the System module.
 *
 * The interactive prototypes live on the Admin wireframe; each feature's
 * "Screen UI" panel embeds that same live prototype (AdminStaff / AdminRoles /
 * AdminUsers).
 */

export const adminAccess: BuildModule = {
  // id kept as 'admin-access' so existing /m/admin-access links keep working.
  id: 'admin-access',
  title: 'Roles & permissions',
  owner: 'Luong',
  requirements: [
    {
      label: 'Feature scope — accounts, roles & access (read this first)',
      text: 'This feature governs WHO can log in and WHAT they can see and do, across both the Admin console (Saramin staff = operators) and the Employer site (company users). Access is decided by three independent layers — a role’s page capabilities, the record scope a person’s position grants, and per-record action rules. A feature owner should be able to test each layer on its own.',
      table: {
        cols: ['Layer', 'Question it answers', 'Example'],
        rows: [
          ['1 · Capability (role × page)', 'What actions can this role do on this page type?', 'Sales role: Read & write on Companies, None on System'],
          ['2 · Record scope (position)', 'Of that page’s records, WHICH may this person see?', 'Rep sees own companies; lead sees the team’s; manager sees the department'],
          ['3 · Record actions (relationship)', 'On a record they can see, which actions are gated?', 'Only the owner edits; anyone can log an activity'],
        ],
      },
      items: [
        'The three layers are independent: a wider scope (seeing a company) does NOT by itself grant edit rights on it.',
        'Everything is audited — see the System module → Audit log.',
      ],
    },
    {
      label: 'How an account + role is created — 3 flows',
      text: 'A user with a role comes to exist in exactly one of three ways. All three end with the person able to sign in with their OWN password (never one typed for them).',
      table: {
        cols: ['#', 'Flow', 'Where', 'Result'],
        rows: [
          ['1', 'HQ Admin creates the role, creates the user, assigns the role', 'Admin console', 'Invite link emailed → the user sets their own password → Active'],
          ['2', 'A company’s super-admin user creates a role + a company user', 'Employer site', 'Invite link emailed → the new company user sets their own password'],
          ['3', 'A person self-registers', 'Employer site', 'Sign-up → matched/triaged → joins a company (or becomes a new lead); no password is ever set by an admin'],
        ],
      },
      items: [
        'Flow 1 is the Operators (users) feature here; flows 2 and 3 are the Employer-site company-user + sign-up features — same invite-and-set-own-password pattern, different population.',
        'In every flow the account is issued a role at creation; there is no account without a role.',
      ],
    },
    {
      label: 'Operators vs company users — two separate populations',
      table: {
        cols: ['Population', 'Who they are', 'Where they work'],
        rows: [
          ['Operator', 'Saramin staff (internal HQ)', 'Admin console'],
          ['Company user', 'An employer’s HR', 'Company site'],
        ],
      },
      items: ['They share the same invite pattern, but are never the same list.'],
    },
    {
      label: 'Staff directory — the master people list',
      text: 'Every HQ person is added once to the Staff directory (name · email · phone · department). That record is the single source two other places draw from, so an email / department is never retyped.',
      table: {
        cols: ['Used by', 'How'],
        rows: [
          ['Users (operators)', 'Create-operator picks a staff member from a dropdown, then assigns a role'],
          ['CRM ownership', 'A company is assigned to a SALES staff member as its owner'],
        ],
      },
      items: ['Being in the directory grants no access on its own — an operator record (login + role) is a separate step in Users.'],
    },
    {
      label: 'Access model — role per admin page',
      text: 'A ROLE defines permissions per admin page. Each operator is assigned exactly one role, and only ever sees the nav items and actions that role allows.',
      table: {
        cols: ['Permission', 'Means', 'Rule'],
        rows: [
          ['None', 'The page is not even in the nav', 'Not granted — the page is hidden entirely'],
          ['Read', 'View only', 'Can view, never change'],
          ['Read & write', 'Create · edit · delete', 'Write implies read — includes everything Read allows'],
        ],
      },
      items: ['Capability (what a role can DO on a page type) is one axis; record SCOPE (which records of that type it may see) is a second, independent axis — see the next two blocks.'],
    },
    {
      label: 'Sales org — the hierarchy record scope is built on',
      text: 'Record scope on Sales-owned data (companies and everything hanging off them) follows the Sales department tree. There is no nesting below a team.',
      table: {
        cols: ['Level', 'Who', 'Rule'],
        rows: [
          ['Department', 'Sales manager (department head)', 'One head over the whole department'],
          ['Team', 'Sales lead', 'Up to 2 teams; each team has one lead. A lead may run up to 2 teams'],
          ['Member', 'Salesperson', 'Belongs to exactly ONE team'],
        ],
      },
      items: [
        'A salesperson belongs to exactly one team; a sales lead can lead up to two teams; nothing nests below the team.',
        'A record’s owner is a staffId (from the Staff directory), so team membership and ownership resolve to real people.',
      ],
    },
    {
      label: 'Record scope — Sales view (who sees which companies)',
      text: 'Visibility on the Company list (and CRM records that inherit the company’s owner) is decided by the signed-in person’s position. Each level sees their OWN book plus everyone below them. A rep never browses the whole system — they can still REACH any company by search (to avoid creating duplicates) but they LIST only their scope.',
      table: {
        cols: ['Role', 'Sees on the list', 'Tabs shown'],
        rows: [
          ['Salesperson', 'Only companies they own', 'None — a single own-book list'],
          ['Sales lead', 'Own book + every company owned by a member of the team(s) they lead', 'Sales view (own) · Sales lead view (own + team)'],
          ['Sales manager', 'Own book + every company in the Sales department', 'Sales view (own) · Department view (own + all)'],
        ],
      },
      items: [
        'The wider tab INCLUDES the viewer’s own companies — it is the full book they are accountable for, not only other people’s. (Sales-lead view = the lead’s own + all team members’.)',
        'A person is in exactly one team; a lead may run two teams, so their Sales-lead view spans both.',
      ],
      warn: 'Scope only decides what a person can SEE. What they may EDIT vs merely LOG on a company is the separate record-action rule below.',
    },
    {
      label: 'Record actions — Company detail (edit is owner-gated, activity is collaborative)',
      text: 'On a company a person can see, actions split by their relationship to the record, tab by tab. This lets a teammate help (log a call) without being able to overwrite the owner’s data.',
      table: {
        cols: ['Action / tab', 'Who can do it', 'Note'],
        rows: [
          ['View the record', 'Anyone in scope (own / team / dept)', 'Visibility only'],
          ['Edit Overview (detail information)', 'The sales owner only (+ admin override)', 'Owner-gated — mutates shared truth'],
          ['Log a new Activity (call · note · email)', 'Any salesperson who can see the company', 'Append-only. Credited to the signed-in user, NOT the sales owner — whoever does the work gets the KPI'],
          ['Edit the Company page tab (jobseeker profile)', 'The sales owner AND the Customer Support role', 'Two roles may edit this tab specifically'],
          ['Reassign owner', 'Sales lead / manager / admin', 'Ownership transfer'],
        ],
      },
      items: [
        'A logged activity is append-only: it adds an entry and can never change an existing field — which is what makes it safe to open to the whole team while Overview-edit stays owner-only.',
        'Customer Support is a role that can edit the Company page tab on any company it supports, even though it is not the sales owner.',
      ],
    },
    {
      label: 'Setup order (enforced)',
      table: {
        cols: ['Step', 'Action'],
        rows: [
          ['1', 'Add the person to the Staff directory (once)'],
          ['2', 'Define the role'],
          ['3', 'Create the operator — pick the staff member'],
          ['4', 'Assign a saved role'],
          ['5', 'Send the invite'],
        ],
      },
      warn: 'The operator clicks the link and sets their OWN password — no one types a password for them. Statuses match the company HR invite exactly: Pending (invited) → Active (link clicked, password set).',
    },
    {
      label: 'Operator (admin user) status',
      text: 'The same enum as the company HR invite — Invited → Active → Disabled — because the operator invite deliberately mirrors it.',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Pending', 'Invited, awaiting activation', 'An invite can expire and be resent'],
          ['Active', 'Link clicked & password set', 'The person sets their OWN password via the invite link — no one types it for them'],
          ['Disabled', 'Access removed', 'Re-enableable — remove = disable, never a hard delete'],
        ],
      },
    },
    {
      label: 'Roles are team-managed',
      text: 'There is no locked “system” role type — sensible defaults are seeded but are ordinary editable roles.',
      items: [
        'A role cannot be deleted while operators are still assigned to it.',
        'At least one role must always keep full access, so no one can be locked out.',
        'Remove = disable, never a hard delete, so the audit trail stays intact. Every role/operator change is logged.',
      ],
    },
    {
      label: 'Full name — one field, no first/last split',
      text: 'An HQ staff member’s name is stored and captured in a SINGLE "Full name" field — same platform-wide standard as jobseekers and company (employer) users.',
      warn: 'Do NOT split any person’s name into first name / last name anywhere. One field: Full name.',
    },
  ],
  features: [
    {
      name: 'Staff directory',
      site: 'Admin',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      notes: 'The master people list. A person is added here once (name · email · phone · department); Users and CRM ownership both draw from it.',
      mockup: 'admin-staff',
      detail: {
        description:
          'A single registry of HQ staff. Adding someone captures name, email, phone and department, and that record is then reused: creating an operator (a console login) picks a staff member from this list, and CRM assigns companies to a sales staff member as their owner. Being in the directory grants no access on its own — the operator record (login + role) is a separate step in Users.',
        userStory:
          'As an HQ admin, I want one place that holds every colleague’s name / email / phone / department, so that granting console access or assigning a company owner is just picking a person, never re-typing them.',
        uiFields: [
          {
            group: 'Staff member',
            items: [
              { name: 'fullName', type: 'string', required: true, notes: 'ONE field — no first/last split' },
              { name: 'email', type: 'email', required: true, notes: 'unique; becomes the login if the person is later made an operator' },
              { name: 'phone', type: 'string', notes: 'contact number' },
              { name: 'department', type: 'ref → Department', notes: 'org unit (System → Departments)' },
              { name: 'title', type: 'string', notes: 'e.g. Account executive' },
            ],
          },
        ],
        behaviors: [
          'Add a staff member with name + email (phone / department / title optional).',
          'Each row shows console access (their operator role, or “No access”) and, for Sales staff, how many CRM companies they own.',
          'Console access is granted in Users, not here — this page is only the people record.',
          'Remove = deactivate, never a hard delete, so historical CRM ownership and the audit trail survive.',
        ],
        rules: [
          'Email is unique across staff and is the login identity if the person becomes an operator.',
          'Directory membership ≠ console access — the two are deliberately separate.',
          'A staff member who owns companies or holds an active operator login can’t be hard-deleted; deactivate instead.',
        ],
        states: ['In directory (no access)', 'In directory + operator', 'In directory + CRM owner', 'Deactivated'],
        backend: {
          dataModel: [
            { name: 'staffId', type: 'uuid' },
            { name: 'fullName', type: 'string', required: true, notes: 'single field — no first/last split' },
            { name: 'email', type: 'string', required: true, notes: 'unique' },
            { name: 'phone', type: 'string' },
            { name: 'departmentId', type: 'ref(department)' },
            { name: 'title', type: 'string' },
          ],
          endpoints: ['GET /admin/staff', 'POST /admin/staff', 'PATCH /admin/staff/:id', 'PATCH /admin/staff/:id/deactivate'],
          integrations: ['Operators (staff → operator selection)', 'CRM (staff → company owner)', 'Departments', 'Audit log'],
          notes: 'The person entity. An operator row references a staffId; a CRM company’s owner references a staffId. One person, one record.',
        },
        acceptance: [
          'A staff member added here appears in the Users “create operator” dropdown and the CRM owner picker.',
          'Granting console access in Users reflects back here as the person’s role.',
          'A staff member with owned companies cannot be hard-deleted.',
        ],
        openQuestions: [
          'Is staff created manually here, or synced from an HR system / directory (e.g. Google Workspace)?',
          'Can a staff member belong to more than one department?',
        ],
      },
    },
    {
      name: 'Roles & permissions',
      site: 'Admin',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      notes: 'Step 1 of the operator flow — a role must exist before it can be assigned. A role is a permission tree over every admin page, grouped by module.',
      mockup: 'admin-roles',
      detail: {
        description:
          'The role editor is a permission matrix over every admin page, grouped by module (Recruitment, Companies, Content, Billing, CRM, Analytics, System). For each page pick None, Read (view only), or Read & write (create / edit / delete). Group-level and “apply to all pages” toggles cascade to the rows beneath them, and a live counter shows how many of the total pages are granted. Saved roles are then assigned to operators in the Users feature.',
        userStory:
          'As an HQ super admin, I want to define exactly what each role can see and do, so that operators only ever get the access their job actually needs.',
        uiFields: [
          {
            group: 'Role',
            items: [
              { name: 'name', type: 'string', required: true, notes: 'e.g. Sales, Operations, Content editor' },
              { name: 'description', type: 'string', notes: 'one line — what this role is for' },
              { name: 'operatorCount', type: 'number', notes: 'read-only; how many operators hold this role (gates delete)' },
            ],
          },
          {
            group: 'Permission grid (per page)',
            items: [
              { name: 'resource', type: 'enum', notes: 'one row per admin page, e.g. Companies → Company accounts' },
              { name: 'level', type: "enum('none'|'read'|'write')", required: true, notes: 'None / Read / Read & write — write implies read' },
            ],
          },
        ],
        behaviors: [
          'Choose a level per page; the "apply to all pages" control and each group header set every row beneath them in one click.',
          'A live "X / N granted" counter (total + per group) updates as levels change.',
          'Search filters the tree to matching pages; groups collapse / expand.',
          'Duplicate an existing role to seed a new one, then rename and adjust.',
          'Delete is available but disabled while any operator holds the role (hover explains — reassign them first).',
          'Save writes the grants; Cancel discards unsaved changes.',
        ],
        rules: [
          'Permission levels are hierarchical: Read & write includes Read; None hides the page entirely.',
          'All roles are editable — there is no protected/system role type.',
          'A role cannot be deleted while its operator count is greater than zero.',
          'Lockout guard: at least one role must always retain full access (roles & operator management); the last full-access role can’t be downgraded or deleted.',
        ],
        states: ['New role (all pages None)', 'Editing (unsaved changes)', 'In use (has operators — delete blocked)', 'Not in use (deletable)'],
        backend: {
          dataModel: [
            { name: 'roleId', type: 'uuid' },
            { name: 'name', type: 'string', required: true },
            { name: 'description', type: 'string' },
            { name: 'grants', type: 'map<resource, level>', required: true, notes: 'resource:action model — level ∈ none|read|write' },
          ],
          endpoints: [
            'GET /admin/roles',
            'POST /admin/roles',
            'PATCH /admin/roles/:id (grants / name)',
            'DELETE /admin/roles/:id (blocked while operators assigned)',
          ],
          integrations: ['Operators (role assignment)', 'Every admin module (grants gate nav + actions)', 'Audit log'],
          notes: 'Permission engine is resource:action; the UI groups resources by module for readability. The full role matrix / personas still need client sign-off.',
        },
        acceptance: [
          'A role can be created with a mix of None / Read / Read & write across pages and saved.',
          'Group and "apply to all" toggles set every child row; the granted counter matches the grid.',
          'Deleting a role with operators assigned is blocked; deleting an unused role succeeds.',
          'The last full-access role cannot be downgraded or deleted.',
        ],
        openQuestions: [
          'Which default personas ship (Super admin / Sales / Operations / Content / Finance…), and exactly what does each get? (client sign-off)',
          'Is permission granularity page-level (None/Read/Write) enough, or do some pages need finer action-level grants (e.g. approve vs edit)?',
          'Can any role be freely renamed, or should the seeded defaults keep stable names for reporting?',
        ],
      },
    },
    {
      name: 'Operators (users)',
      site: 'Admin',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      notes: 'HQ staff logins. Create → assign a role → send invite → the operator sets their own password. Pending until activated, then Active.',
      mockup: 'admin-users',
      detail: {
        description:
          'The operator list plus the create → assign-role → invite → activate lifecycle. Creating an operator picks a person from the Staff directory (their name / email / department come from that record — you do not re-type them) and assigns a role, then sends a one-time invite link; the operator sets their own password. Until they activate, the row is Pending; once they do, it flips to Active. This is the identical invite flow and status set used for company HR Manager / HR Specialist users.',
        userStory:
          'As an HQ super admin, I want to invite a colleague and assign their role so that access is provisioned securely (they set their own password) and I can see who has activated.',
        uiFields: [
          {
            group: 'Operator',
            items: [
              { name: 'staff', type: 'ref → Staff', required: true, notes: 'picked from the Staff directory — supplies name / email / department' },
              { name: 'email', type: 'email', notes: 'read-only; from the staff record — becomes the login they set a password for' },
              { name: 'role', type: 'ref → Role', required: true, notes: 'exactly one role per operator (from Roles & permissions)' },
              { name: 'status', type: "enum('Pending'|'Active'|'Disabled')", notes: 'Pending = invited; Active = activated; Disabled = access removed' },
              { name: 'lastLogin', type: 'datetime', notes: 'read-only; “—” while Pending' },
            ],
          },
        ],
        behaviors: [
          'Create operator → pick a staff member from the directory (name / email / department auto-fill) → pick a saved role → “Create & send invite”. The row appears immediately as Pending with last-login “—”.',
          'The invite emails a one-time activation link; the operator sets their own password (no one types it for them).',
          'Status flips Pending → Active once the operator activates the link.',
          'Pending rows can be Resent (new link) or Cancelled (revoke the invite).',
          'Active rows can have their role changed, or be Disabled; Disabled rows can be Re-enabled.',
          'Prototype only: a “Simulate activate” action flips a Pending row to Active to demo the transition.',
        ],
        rules: [
          'Exactly one role per operator; the role controls every screen and action they can reach.',
          'Remove = Disable, never a hard delete — keep the audit trail. Disabled operators can be re-enabled.',
          'Lockout guard: you cannot disable or downgrade the last operator that holds a full-access role.',
          'Same status semantics and invite mechanics as the company HR Manager / HR Specialist invite.',
        ],
        states: ['Pending (invite sent, awaiting activation)', 'Active', 'Disabled', 'Invite expired (resend)'],
        backend: {
          dataModel: [
            { name: 'operatorId', type: 'uuid' },
            { name: 'staffId', type: 'ref(staff)', required: true, notes: 'the person — name / email come from the staff record' },
            { name: 'roleId', type: 'ref(role)', required: true },
            { name: 'status', type: 'enum', notes: 'pending | active | disabled' },
          ],
          endpoints: [
            'POST /admin/operators/invite { staffId, roleId } → creates a Pending operator + sends the link',
            'POST /admin/operators/:id/resend',
            'POST /admin/operators/:id/cancel',
            'PATCH /admin/operators/:id/role { roleId }',
            'PATCH /admin/operators/:id/disable  ·  /enable',
            'POST /admin/operators/activate { token, password } (set-own-password)',
          ],
          integrations: ['Roles & permissions (role assignment)', 'Notifications (invite / activation email)', 'Audit log', 'Auth (session / SSO — TBD)'],
          notes: 'Mirror the company users invite flow. Confirm the admin auth story (SSO vs local) before the activation endpoint is finalised.',
        },
        acceptance: [
          'Creating an operator sends a set-password link and lands the row as Pending; the system never stores a typed password.',
          'Activating the link flips the operator to Active and records the first login.',
          'Resend / Cancel work on Pending rows; Disable / Re-enable and Change role work on active ones.',
          'The last full-access operator cannot be disabled or downgraded.',
        ],
        openQuestions: [
          'Admin authentication: SSO (Google Workspace / corporate IdP) vs local accounts?',
          'How long should an operator invite link stay valid before it expires?',
          'Do full-access operators require MFA?',
        ],
      },
    },
  ],
}
