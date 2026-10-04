// Builds the guide as ONE self-contained HTML fragment for a claude.ai Artifact
// preview: the Vite build with VITE_ARTIFACT=1 (hides the print button the
// artifact frame cannot honour), its CSS and JS inlined, no <html>/<head>/<body>
// of its own (the artifact host wraps the page in its skeleton).
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const out = 'dist-artifact'
execSync(`npx vite build --outDir ${out} --emptyOutDir`, { stdio: 'inherit', env: { ...process.env, VITE_ARTIFACT: '1' } })

const assets = path.join(out, 'assets')
const files = readdirSync(assets)
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(path.join(assets, f), 'utf8')).join('\n')
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(path.join(assets, f), 'utf8')).join('\n')
const html = readFileSync('index.html', 'utf8')
const title = html.match(/<title>.*<\/title>/)[0]
const icon = html.match(/<link rel="icon"[^>]*>/)?.[0] ?? ''

const page = [
  title,
  icon,
  `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`,
  '<div id="root"></div>',
  `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`,
].join('\n')

const dest = process.argv[2] ?? path.join(out, 'jobseeker-guide.html')
writeFileSync(dest, page)
console.log(`wrote ${dest} (${(page.length / 1024).toFixed(0)} KB)`)
