# Saramin Vietnam — Feature Spec (source of truth)

A living documentation site for the Saramin VN build, modelled on the Lotteria GEMS
handoff. Three panes:

1. **Left nav** — the feature hierarchy: **App group → Module → Feature**. The single
   navigable index the team follows.
2. **Center** — the detailed requirement for the selected feature: fields, behaviours,
   backend contract, _what we know_ / _what needs investigation_, and questions for the
   client. A **Wireframe** tab is reserved per feature for later.
3. **Right rail** — quick facts: status, owners, external systems, Admin↔Store relationship,
   open-item counts, related features.

## Editing the content (this is the whole point)

Everything is data-driven — you almost never touch components.

- **Add / edit a feature** → `src/data/features/*.ts` (one `FeatureSpec` per feature).
  - `jobseeker.ts`, `employer.ts`, `shared.ts` — Store Site (Part A)
  - `admin.ts` — HQ Admin (Part B)
  - `crosscutting.ts` — themes (Part C)
- **Add it to the menu** → `src/data/nav.ts` (add a leaf `{ id, label }` under a module).
  The leaf `id` must match the `FeatureSpec.id`.
- The `FeatureSpec` shape (all fields optional except id/title/status/summary) is documented
  in `src/data/types.ts`. Use `uiFields`, `behaviors`, `rules`, `backend`, `known`,
  `unknown`, `clientQuestions`, `clientTeam`, `externalSystems`, `adminStoreRelation`,
  `related`.

`js-auth` (Authentication) is fully fleshed out as the depth exemplar — copy its shape when
detailing other features.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build → dist/
```

## Deploy (Vercel)

Import this folder as a Vite project (build `npm run build`, output `dist`). `vercel.json`
already rewrites all routes to `index.html` for the SPA router.

## Source

Content seeded from the Notion "Saramin Vietnam — Feature Inventory & Scoping Worksheet".
Status labels: `live-wired`, `built-mock`, `be-migrated`, `prototype`, `empty-seam`,
`not-started`.
