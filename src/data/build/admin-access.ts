import type { BuildModule } from './types'

/*
 * Admin roles & operators (HQ system access).
 *
 * Internal-staff counterpart to Account management's company users: this module
 * governs who inside Saramin HQ can use the admin console and what they can do.
 * Three features — the STAFF directory (the master people list), the ROLE (a
 * permission tree) and the OPERATOR (a staff login assigned a role). The operator
 * invite flow deliberately mirrors the company HR Manager / HR Specialist invite
 * so there is one consistent pattern.
 *
 * The interactive prototype lives on the Admin wireframe (System → Staff / Roles
 * & permissions / Users); each feature's "Screen UI" panel embeds that same
 * live prototype (AdminStaff / AdminRoles / AdminUsers).
 */

export const adminAccess: BuildModule = {
  id: 'admin-access',
  title: 'Admin roles & operators',
  owner: 'Luong',
  requirements: [
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
        cols: ['Permission', 'Means'],
        rows: [
          ['None', 'The page is not even in the nav'],
          ['Read', 'View only'],
          ['Read & write', 'Create · edit · delete'],
        ],
      },
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
      label: 'Roles are team-managed',
      text: 'There is no locked “system” role type — sensible defaults are seeded but are ordinary editable roles.',
      items: [
        'A role cannot be deleted while operators are still assigned to it.',
        'At least one role must always keep full access, so no one can be locked out.',
        'Remove = disable, never a hard delete, so the audit trail stays intact. Every role/operator change is logged.',
      ],
    },
    {
      label: 'Audit logging — everything, platform-wide',
      text: 'Who (operator · company user · jobseeker · System) changed what, when, and the before → after value. Covers every create / update / delete / status change and system actions (auto-expiry, auto-publish, provisioning, notifications).',
      table: {
        cols: ['Scope', 'Shows', 'Reached from'],
        rows: [
          ['System → Audit log', 'The whole firehose — searchable, filterable', 'System menu'],
          ['Per-page History drawer', 'Recent activity in that section', 'Any admin page'],
          ['Record Activity / History', 'That one record’s trail', 'The record itself (e.g. company Overview)'],
        ],
      },
      items: [
        'The three scopes must not overlap.',
        'The log is immutable and exportable — entries are never edited or deleted, including when the actor is disabled.',
        'PII-view actions are audited even though nothing changed: opening a resume / unlocking a CV records actor + candidate + timestamp.',
      ],
    },
    {
      label: 'What the System menu contains',
      text: 'Everything under System is HQ-only configuration — it changes how the rest of the platform behaves, so it sits behind the strictest role grants.',
      table: {
        cols: ['Page', 'What it configures', 'Who needs it'],
        rows: [
          ['Staff', 'The master people list (name · email · phone · dept)', 'Super admin / ops'],
          ['Users', 'Operator logins + assigned role', 'Super admin'],
          ['Roles & permissions', 'The permission tree per admin page', 'Super admin'],
          ['Company information', 'Our own issuer identity on every sales document', 'Finance / super admin'],
          ['Products', 'The catalogue — what is sellable and at what price (see Products & Packages)', 'Finance / super admin'],
          ['Membership tiers', 'The loyalty programme — tier thresholds + reward catalogue, per year (see CRM)', 'Sales lead / marketing'],
          ['Master data', 'Every reference list (dropdowns + search filters)', 'Operations'],
          ['Audit log', 'The platform-wide change trail', 'Super admin / compliance'],
          ['Environment', 'Feature flags', 'Engineering'],
          ['Departments', 'Internal org reference data', 'Operations'],
        ],
      },
    },
    {
      label: 'Company information — the issuer identity (Saramin, not a customer)',
      text: 'Our own legal identity, set ONCE here and read by every quotation, sales order and VAT invoice. Nobody retypes it per document, and a sent document keeps the version it was sent with.',
      table: {
        cols: ['Group', 'Fields'],
        rows: [
          ['Legal identity', 'Company name (VI + EN), tax code (MST), address (VI + EN), website'],
          ['Brand', 'Logo used on the letterhead'],
          ['Document defaults', 'VAT rate, quotation validity, discount threshold needing approval, quotation / sales-order number formats, support email'],
          ['Bank details', 'Bank, account number, account name — printed on the order so the customer can pay'],
        ],
      },
      items: [
        'Bilingual by design: VI and EN both print on the letterhead, so one document serves local and foreign customers.',
        'The "proposed by" line is the SIGNED-IN rep, not a setting here.',
        'Changing these values must not retroactively alter documents already issued — documents store a snapshot.',
      ],
    },
    {
      label: 'Master data — one source of truth for every reference list',
      text: 'All dropdown / filter vocabularies live here, so the job form, the CV form and the Store search filters can never drift apart. Vietnamese is mandatory; English and Korean are optional.',
      table: {
        cols: ['Domain', 'Shape'],
        rows: [
          ['Job categories & roles', 'Two-level taxonomy (Category → Role)'],
          ['Locations', 'Grouped (region → province / city)'],
          ['Skills', 'Tag set — the canonical list CV extraction and search must resolve to'],
          ['Industry · Job level · Job type · Education level · Application language · Salary currency', 'Flat lists'],
        ],
      },
      items: [
        'Each domain feeds the matching form dropdown; an operator can also add a value inline from that dropdown (＋ Create new…) and it is saved back here.',
        'Adding a value is a DATA change, never a release — this is the same principle as the job taxonomy (see Job management) and the tool rate tables (see Tools).',
        'A value in use cannot simply vanish: renaming is safe, removing needs a merge/replace path so existing records keep resolving.',
      ],
    },
    {
      label: 'Environment — feature flags',
      text: 'Flags gate which surfaces are live and which still read mock data, so a half-finished area can ship dark instead of blocking a release (e.g. store.jobs.realData, store.companies.reviews, crm.purchaseOrders, notifications.zaloZNS).',
      items: [
        'Some flags are UI-editable here; others are environment-only and read-only in the console — the page must show which is which.',
        'Every flag change is audited: a flag flip changes behaviour for real users.',
      ],
    },
    {
      label: 'Departments — internal org reference data',
      text: 'The HQ department list (name, member count, lead) used to group operators and to route work.',
      warn: 'Prototype only — no backend counterpart yet. Confirm with the client whether departments are actually needed in Phase 1, or whether the role on each operator is enough.',
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
              { name: 'name', type: 'string', required: true },
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
            { name: 'name', type: 'string', required: true },
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
