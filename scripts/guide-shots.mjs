/*
 * Capture the per-step screenshots for the CRM user guide's workflows from the
 * mockups on the local dev server. Re-run after a mockup changes:
 *   node scripts/guide-shots.mjs            (dev server on :5173)
 * Uses the system Chrome through playwright-core — no browser download.
 */
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5173'
const OUT = 'public/guide/crm/wf'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
page.setDefaultTimeout(8000)
const results = []
const only = new Set(process.argv.slice(2))

const go = async (url) => {
  await page.goto(BASE + url, { waitUntil: 'networkidle' })
  // the spec site's own sidebar is not part of the screen being illustrated
  await page.addStyleTag({ content: 'aside{display:none!important}' })
  await page.waitForTimeout(700)
}
const clickText = async (text, { exact = true, nth = 0 } = {}) => {
  await page.getByText(text, { exact }).nth(nth).click()
  await page.waitForTimeout(500)
}
const clickButton = async (re) => {
  await page.locator('button').filter({ hasText: re }).first().click()
  await page.waitForTimeout(500)
}
/** click the ⋯ menu of the Sign-ups row for `person` */
const openRowMenu = async (person) => {
  await page.evaluate((p) => {
    const el = [...document.querySelectorAll('span,div,p,button,td')].find((e) => e.children.length === 0 && (e.innerText || '').trim() === p)
    let row = el
    for (let i = 0; i < 10 && row && !(row.innerText || '').includes('⋯'); i++) row = row.parentElement
    const b = row && [...row.querySelectorAll('button')].find((x) => x.innerText.trim() === '⋯')
    if (!b) throw new Error('row menu not found for ' + p)
    b.click()
  }, person)
  await page.waitForTimeout(400)
}
const shot = async (name, fn) => {
  if (only.size && !only.has(name)) return
  try {
    await fn()
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/${name}.png` })
    results.push(`ok    ${name}`)
  } catch (e) {
    results.push(`FAIL  ${name} — ${String(e.message).split('\n')[0].slice(0, 120)}`)
  }
}
const setSelectByLabel = async (re) => {
  await page.evaluate((src) => {
    const rx = new RegExp(src, 'i')
    const sel = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => rx.test(o.text)))
    if (!sel) throw new Error('select not found')
    const opt = [...sel.options].find((o) => rx.test(o.text))
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
    setter.call(sel, opt.value)
    sel.dispatchEvent(new Event('change', { bubbles: true }))
  }, re.source)
  await page.waitForTimeout(500)
}

// ── Workflow 1 — sign-up & placement ─────────────────────────────────────────
await shot('wf1-01-signup-form', () => go('/mockups/company?screen=co-signup'))
await shot('wf1-02-email-sent', async () => {
  await go('/mockups/company?screen=co-signup')
  await page.locator('button').filter({ hasText: /I have read and agree/ }).first().click()
  await page.waitForTimeout(200)
  await page.locator('button').filter({ hasText: /^(Create account|Register|Đăng ký|Sign up)$/ }).last().click()
})
await shot('wf1-04-move-dialog', async () => { await go('/wireframe/admin?screen=admin-signups'); await openRowMenu('Phạm Thu Trang'); await clickText('Move to existing company') })
await shot('wf1-05-create-activate', async () => { await go('/wireframe/admin?screen=admin-signups'); await openRowMenu('Phạm Thu Trang'); await clickText('Create company & activate') })
await shot('wf1-06-archive', async () => { await go('/wireframe/admin?screen=admin-signups'); await openRowMenu('Phạm Thu Trang'); await clickText('Archive sign-up') })
await shot('wf1-07-console-no-paperwork', () => go('/mockups/company'))

// ── Workflow 2 — verification ────────────────────────────────────────────────
await shot('wf2-00-post-job-gate', () => go('/mockups/company?screen=co-post-job'))
await shot('wf2-01-company-info-no-paperwork', () => go('/mockups/company?screen=co-company-info'))
await shot('wf2-02-company-info-waiting', async () => {
  await go('/mockups/company?screen=co-company-info')
  // the empty state is a dropzone button — the one control that files the certificate
  await page.locator('button').filter({ hasText: /Tải lên giấy chứng nhận/ }).first().click()
})
await shot('wf2-03-customers-waiting', async () => {
  await go('/wireframe/admin?screen=admin-company-list')
  await setSelectByLabel(/manager/)
  await clickButton(/^Sales manager view$/)
  await clickButton(/^Chờ verify/)
})
const soviet = encodeURIComponent('Công ty TNHH Giải pháp Số Việt')
await shot('wf2-04-company-waiting', () => go(`/wireframe/admin?screen=admin-company-list&record=${soviet}`))
await shot('wf2-05-verify-dialog', async () => { await clickButton(/^Verify company$/) })
await shot('wf2-06-verified', async () => { await page.locator('.fixed.inset-0 button').filter({ hasText: /^Verify$/ }).first().click() })
await shot('wf2-07-employer-verified', async () => { await go('/mockups/company?screen=co-company-info'); await clickButton(/^Verified$/) })

// ── Workflow 3 — quotation discount approval ─────────────────────────────────
await shot('wf3-01-quotes-waiting-on-me', async () => { await go('/wireframe/admin?screen=admin-quotes'); await clickButton(/Chờ tôi duyệt/) })
await shot('wf3-02-quotation-pending-lead', async () => { await clickText('QUO-009905-06-2026') })
await shot('wf3-03-approve-panel', async () => { await clickButton(/^Duyệt/) })
await shot('wf3-04-quotation-manager-band', async () => {
  await go('/wireframe/admin?screen=admin-quotes')
  await setSelectByLabel(/manager/)
  await clickText('QUO-009913-08-2026')
})
await shot('wf3-05-new-quotation-builder', async () => { await go('/wireframe/admin?screen=admin-quotes'); await clickButton(/New quotation/) })

// ── Workflow 4 — claim from Free data ────────────────────────────────────────
await shot('wf4-01-free-data-list', () => go('/wireframe/admin?screen=admin-company-directory'))
await shot('wf4-02-claim-form', async () => {
  await page.evaluate(() => {
    const pill = [...document.querySelectorAll('span')].find((s) => s.innerText.trim() === 'Chưa nhận' && s.closest('[class*="grid"]'))
    let row = pill
    for (let i = 0; i < 8 && row && !row.querySelector('button'); i++) row = row.parentElement
    const name = row && [...row.querySelectorAll('button')][0]
    if (!name) throw new Error('no free row')
    name.click()
  })
  await page.waitForTimeout(600)
  await clickButton(/Xin nhận/)
})
await shot('wf4-03-admin-approves', async () => {
  await go('/wireframe/admin?screen=admin-company-directory')
  await page.evaluate(() => {
    const pill = [...document.querySelectorAll('span')].find((s) => s.innerText.trim() === 'Chờ duyệt lần 1 · Admin')
    let row = pill
    for (let i = 0; i < 8 && row && !row.querySelector('button'); i++) row = row.parentElement
    const name = row && [...row.querySelectorAll('button')][0]
    if (!name) throw new Error('no level-1 row')
    name.click()
  })
  await page.waitForTimeout(600)
  // the banner's "Duyệt yêu cầu (…) →" opens the Yêu cầu nhận tab — the tab strip itself is not a <button>
  await page.locator('button').filter({ hasText: /Duyệt yêu cầu/ }).first().click()
  await page.waitForTimeout(500)
})
await shot('wf4-04-lead-approves', async () => {
  // the card's own button, not the banner's "Duyệt yêu cầu (…) →"
  await page.locator('button').filter({ hasText: /^Duyệt\s*·\s*Admin$/ }).first().click()
})
await shot('wf4-05-claim-log', () => go('/wireframe/admin?screen=admin-claim-requests'))

await browser.close()
console.log(results.join('\n'))
