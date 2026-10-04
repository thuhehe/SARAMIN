# Saramin Jobseeker — Cẩm nang thao tác

The operating handbook for the **built** jobseeker site
([dev.svn.topdev.asia](https://dev.svn.topdev.asia)), laid out like the admin
guide (saramin-admin-guide.vercel.app): grouped navy rail, three quick-question
cards, the key-fact banner, collapsible sections, a **user / Developer** switch
over one source, print to PDF.

It is a separate site from the spec (repo root) on purpose: the spec says what
SHOULD be built; this says what IS built, for CS / QA / ops.

## Content

Structure is **module → sub-module → page**, one page on screen at a time. A
module (`GuideModule`) opens on its overview — quick questions, key fact, one card
per sub-module; a page carries its sub-module's tabs and Trước / Sau. The URL hash
is the place: `#tai-khoan` (module) or `#dang-nhap` (page).

All content is data — `src/data/handbook.ts`. One `GuideSection` per screen or
task, tagged with its `module` and sub-module (`group`); blocks are `p`, `steps`, `flow`, `table`, `warn`, `tip`, `links`. Mark a
block or a whole section `dev: true` to show it only in the Developer view.
Inline markup is `**bold**` and `` `code` `` only.

Written from `svn-web` + `svn-be` on branch `dev` — the commit hashes are in
`HANDBOOK.source` and printed in the footer. When the build changes, re-read the
code and bump them.

Modules so far: **Tài khoản** (sign up, sign in, forgot password), **CV** (create, upload, manage, apply — `src/data/cv.ts`), **Duyệt nội dung** (copy review of the account screens).

## Run / deploy

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # → dist/
```

Vercel: import this repo with **Root Directory = `jobseeker-guide`**
(framework Vite, build `npm run build`, output `dist`).

`?view=dev` opens the Developer view directly; `#<section-id>` deep-links a section.

## Duyệt nội dung (client copy review)

Every string a jobseeker sees on the account screens, one row per string with a
stable ID (`SD-07`), in VI / EN / KO. The text is **extracted from svn-web**, never
typed by hand:

```bash
SVN_WEB=../../svn-web node scripts/build-copy.mjs   # → src/data/copy.generated.json
```

- `scripts/copy-screens.mjs` — which strings appear on which screen, in on-screen
  order, with position / condition notes. `IGNORED_PREFIXES` lists copy that exists
  in the build but never renders (with the reason).
- `scripts/dump-copy.mjs` — bundles the svn-web copy modules with esbuild; schema
  validation messages are read by running each schema on an input that breaks one
  rule. Needs `zod` (a devDependency here; svn-web needs no `node_modules`).
- The build fails on a key that no longer resolves, and lists any new string no
  screen references — re-run after every `/pullcode`, then re-check the IDs quoted
  in the "Điểm cần khách quyết định" table (`src/data/copyReview.ts`).

## Ảnh chụp màn hình

`public/shots/*.jpg`, mapped to pages in `src/data/shots.ts`. Captured from svn-web
`dev` running locally in mock mode (dev.svn.topdev.asia was not reachable from the
capture machine) — the real screens and copy, with sample data:

```bash
# in svn-web: .env.local with NEXT_PUBLIC_USE_MOCK=true, SVN_MOCK_MY_PROFILE=true,
# NEXT_PUBLIC_SITE_URL=http://localhost:3000 — then `pnpm dev`
node scripts/shoot.cjs              # every shot
node scripts/shoot.cjs cv-list      # just one
```

Needs `playwright-core` (set `PW_CORE` to its path if not installed here) and the
preinstalled Chromium at `/opt/pw-browsers/chromium`.
