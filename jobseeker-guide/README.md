# Saramin Jobseeker — Cẩm nang thao tác

The operating handbook for the **built** jobseeker site
([dev.svn.topdev.asia](https://dev.svn.topdev.asia)), laid out like the admin
guide (saramin-admin-guide.vercel.app): grouped navy rail, three quick-question
cards, the key-fact banner, collapsible sections, a **user / Developer** switch
over one source, print to PDF.

It is a separate site from the spec (repo root) on purpose: the spec says what
SHOULD be built; this says what IS built, for CS / QA / ops.

## Content

All content is data — `src/data/handbook.ts`. One `GuideSection` per screen or
task; blocks are `p`, `steps`, `flow`, `table`, `warn`, `tip`, `links`. Mark a
block or a whole section `dev: true` to show it only in the Developer view.
Inline markup is `**bold**` and `` `code` `` only.

Written from `svn-web` + `svn-be` on branch `dev` — the commit hashes are in
`HANDBOOK.source` and printed in the footer. When the build changes, re-read the
code and bump them.

Modules so far: **Tài khoản** (sign up, sign in, forgot password).

## Run / deploy

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # → dist/
```

Vercel: import this repo with **Root Directory = `jobseeker-guide`**
(framework Vite, build `npm run build`, output `dist`).

`?view=dev` opens the Developer view directly; `#<section-id>` deep-links a section.
