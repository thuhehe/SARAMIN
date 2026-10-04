// Builds src/data/copy.generated.json: every piece of text a jobseeker sees on
// the Tài khoản screens, in VI / EN / KO, pulled straight from svn-web so the
// client reviews the copy the build actually ships.
//
//   SVN_WEB=../../svn-web node scripts/build-copy.mjs
//
// WHICH strings appear, and where, is curated in copy-screens.mjs; the TEXT is
// never typed by hand. An unresolved key fails the build. Strings in the copy
// modules that no screen references are listed at the end, so a new string in
// the build cannot slip past the review unnoticed.
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { flatten, loadCopy } from './dump-copy.mjs'
import { SCREENS, IGNORED_PREFIXES } from './copy-screens.mjs'

const WEB = process.env.SVN_WEB ?? path.resolve('../../svn-web')
const copy = await loadCopy()
const flat = { vi: flatten(copy.vi), en: flatten(copy.en), ko: flatten(copy.ko) }

const used = new Set()
const missing = []
const resolve = (lang, item) => {
  const keys = item.keys ?? [item.key]
  return keys
    .map((k) => {
      used.add(k)
      const v = flat[lang][k]
      if (v === undefined) missing.push(`${lang}:${k}`)
      return v ?? ''
    })
    .join('')
}

const screens = SCREENS.map((s) => ({
  id: s.id,
  screen: s.screen,
  path: s.path,
  note: s.note,
  items: s.items.map((it, i) => ({
    id: `${s.id}-${String(i + 1).padStart(2, '0')}`,
    where: it.where,
    note: it.note,
    keys: it.keys ?? [it.key],
    vi: resolve('vi', it),
    en: resolve('en', it),
    ko: resolve('ko', it),
  })),
}))

if (missing.length) {
  console.error(`✗ ${missing.length} key(s) did not resolve:\n  ` + [...new Set(missing)].join('\n  '))
  process.exit(1)
}

const rev = execSync('git log -1 --format=%h', { cwd: WEB }).toString().trim()
const date = execSync('git log -1 --format=%cs', { cwd: WEB }).toString().trim()
const out = { source: { web: rev, date }, screens }
writeFileSync('src/data/copy.generated.json', JSON.stringify(out, null, 1) + '\n')

const total = screens.reduce((n, s) => n + s.items.length, 0)
console.log(`✓ ${screens.length} screens, ${total} rows → src/data/copy.generated.json (svn-web ${rev})`)

const roots = new Set(Object.keys(flat.vi).filter((k) => !k.startsWith('dict.')).map((k) => k.split('.')[0]))
const unref = Object.keys(flat.vi).filter(
  (k) => (roots.has(k.split('.')[0]) || k.startsWith('dict.auth.')) && !used.has(k) && !IGNORED_PREFIXES.some((p) => k.startsWith(p)),
)
if (unref.length) console.log(`\n${unref.length} string(s) not on any screen (check they are really unused):\n  ` + unref.join('\n  '))
