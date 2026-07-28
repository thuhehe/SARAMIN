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

## Comments

Reviewers can select any text and leave a threaded comment; the threads live in
BB PM (project **SRM**), not in this repo. Two ways in, both from the same
**Unlock comments** button:

| Path | Who | What their comments look like |
|---|---|---|
| **Continue with BB PM** | Burningbros team, member of the SRM project | Real name + avatar off their BB PM account (`isGuest: false`) |
| **Passcode** | Client team, anyone without a BB PM account | The display name they type, or "Guest" |

The BB PM path is a standard OAuth 2.1 authorization-code + PKCE flow against
`pm.burningbros.kr`: the browser leaves for BB PM's own login and consent
screens and returns to `/oauth/callback`, which trades the code for a comment
session. The access token is used once and never stored — see the header comment
in `src/comments/oauth.ts` for why.

**Turning it on for a deployment** needs one registration per origin, because the
authorization server only redirects back to URIs registered for the client:

```bash
curl -X POST https://pm.burningbros.kr/api/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{"client_name":"Saramin VN Spec Site",
       "redirect_uris":["https://YOUR-DOMAIN/oauth/callback",
                        "http://localhost:5173/oauth/callback"],
       "token_endpoint_auth_method":"none",
       "scope":"openid profile email"}'
```

Put the returned `client_id` in `VITE_BBPM_OAUTH_CLIENT_ID` (`.env.production`
for the deploy, `.env.local` for dev). Leave it blank and the dialog offers the
passcode only — the same behaviour as before this existed.

Two things live on the API side, not here: the site's origin must be in the
API's `CORS_ORIGINS`, and the signer must be a **member of the SRM project** —
a BB PM user who isn't gets a 403 and is pointed back at the passcode.

## Deploy (Vercel)

Import this folder as a Vite project (build `npm run build`, output `dist`). `vercel.json`
already rewrites all routes to `index.html` for the SPA router.

## Source

Content seeded from the Notion "Saramin Vietnam — Feature Inventory & Scoping Worksheet".
Status labels: `live-wired`, `built-mock`, `be-migrated`, `prototype`, `empty-seam`,
`not-started`.
