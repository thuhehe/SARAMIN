import type { BuildModule } from './types'

/*
 * Admin roles & operators (HQ system access).
 *
 * Internal-staff counterpart to Account management's company users: this module
 * governs who inside Saramin HQ can use the admin console and what they can do.
 * Two features — the ROLE (a permission tree) and the OPERATOR (a staff login
 * assigned a role). The operator invite flow deliberately mirrors the company
 * HR Manager / HR Specialist invite so there is one consistent pattern.
 *
 * The interactive prototype lives on the Admin wireframe (System → Roles &
 * permissions / Users); each feature's "Screen UI" panel embeds that same
 * live prototype (AdminRoles / AdminUsers).
 */

export const adminAccess: BuildModule = {
  id: 'admin-access',
  title: 'Admin roles & operators',
  owner: 'Luong',
  requirements: [
    'Internal HQ operators only — distinct from company (employer) users. An operator is a Saramin staff member with access to the admin console; a company user is an employer’s HR. The two share the same invite pattern but are separate populations.',
    'Access model: a ROLE defines permissions per admin page — None / Read (view) / Read & write (create · edit · delete). Each operator is assigned exactly one role. A user only sees the nav items and actions their role allows.',
    'Setup order (enforced): 1) define the role first, 2) create the operator (name + email), 3) assign a saved role, 4) send the invite. The operator clicks the link and sets their OWN password — no one types it for them.',
    'Statuses & invite flow are the SAME as the company HR Manager / HR Specialist invite: Pending (invited, not yet activated) → Active (link clicked, password set). One consistent pattern across the product.',
    'Roles are fully team-managed — there is no locked "system" role type. Sensible defaults are seeded but are ordinary editable roles. A role cannot be deleted while operators are still assigned to it, and at least one role must always keep full access so no one is locked out.',
    'Remove = disable, never a hard delete, so the audit trail stays intact. Every role/operator change is written to the audit log.',
  ],
  features: [
    {
      name: 'Roles & permissions',
      site: 'Admin',
      scope: ['BE', 'FE', 'UI'],
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
      notes: 'HQ staff logins. Create → assign a role → send invite → the operator sets their own password. Pending until activated, then Active.',
      mockup: 'admin-users',
      detail: {
        description:
          'The operator list plus the create → assign-role → invite → activate lifecycle. Creating an operator captures their name + email and a role, then sends a one-time invite link; the operator sets their own password. Until they activate, the row is Pending; once they do, it flips to Active. This is the identical invite flow and status set used for company HR Manager / HR Specialist users.',
        userStory:
          'As an HQ super admin, I want to invite a colleague and assign their role so that access is provisioned securely (they set their own password) and I can see who has activated.',
        uiFields: [
          {
            group: 'Operator',
            items: [
              { name: 'name', type: 'string', required: true },
              { name: 'email', type: 'email', required: true, notes: 'their login; they set their own password via the invite link' },
              { name: 'role', type: 'ref → Role', required: true, notes: 'exactly one role per operator (from Roles & permissions)' },
              { name: 'status', type: "enum('Pending'|'Active'|'Disabled')", notes: 'Pending = invited; Active = activated; Disabled = access removed' },
              { name: 'lastLogin', type: 'datetime', notes: 'read-only; “—” while Pending' },
            ],
          },
        ],
        behaviors: [
          'Create operator → fill name + email → pick a saved role → “Create & send invite”. The row appears immediately as Pending with last-login “—”.',
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
            { name: 'name', type: 'string', required: true },
            { name: 'email', type: 'string', required: true, notes: 'unique' },
            { name: 'roleId', type: 'ref(role)', required: true },
            { name: 'status', type: 'enum', notes: 'pending | active | disabled' },
          ],
          endpoints: [
            'POST /admin/operators/invite { name, email, roleId } → creates a Pending operator + sends the link',
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
