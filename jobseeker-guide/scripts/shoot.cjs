// Captures the jobseeker screens the guide pages point at, from svn-web dev
// running locally in mock mode. One function per shot; a failing shot is
// logged and skipped, never fatal.
const { chromium } = require(process.env.PW_CORE ?? 'playwright-core'); const { prep } = require('./shoot-lib.cjs')
const OUT = require('node:path').resolve(__dirname, '../public/shots')
const BASE = 'http://localhost:3000'
const only = process.argv.slice(2)

async function go(p, u) { await p.goto(BASE + u, { waitUntil: 'networkidle', timeout: 240000 }); await prep(p); await p.waitForTimeout(700) }
async function snap(p, name, opts = {}) { await p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 80, ...opts }); console.log('✓', name) }
async function el(p, loc, name, pad = 16) {
  const box = await loc.boundingBox(); if (!box) throw new Error('no box for ' + name)
  const vp = p.viewportSize()
  const x = Math.max(0, box.x - pad), y = Math.max(0, box.y - pad)
  await snap(p, name, { clip: { x, y, width: Math.min(vp.width - x, box.width + pad * 2), height: box.height + pad * 2 }, fullPage: true })
}

const SHOTS = {
  'acc-sign-up': async p => { await go(p, '/auth/sign-up'); await snap(p, 'acc-sign-up') },
  'acc-sign-up-detail': async p => { await go(p, '/auth/sign-up/detail'); await snap(p, 'acc-sign-up-detail', { fullPage: true }) },
  'acc-password': async p => {
    await go(p, '/auth/sign-up/detail')
    await p.getByPlaceholder('Nhập mật khẩu').fill('matkhau1')
    await p.waitForTimeout(400)
    await el(p, p.getByPlaceholder('Nhập mật khẩu').locator('xpath=ancestor::*[.//li][1]'), 'acc-password')
  },
  'acc-phone-otp': async p => {
    await go(p, '/auth/sign-up/detail')
    await p.getByPlaceholder('Nhập số điện thoại').fill('912345678')
    await p.getByRole('button', { name: 'Xác thực' }).click()
    await p.waitForTimeout(1500)
    await p.getByPlaceholder('Nhập mã 6 chữ số').scrollIntoViewIfNeeded()
    await el(p, p.getByPlaceholder('Nhập mã 6 chữ số').locator('xpath=ancestor::*[.//text()[contains(.,"Số điện thoại")]][1]'), 'acc-phone-otp')
  },
  'acc-phone-verified': async p => {
    await go(p, '/auth/sign-up/detail')
    await p.getByPlaceholder('Nhập số điện thoại').fill('912345678')
    await p.getByRole('button', { name: 'Xác thực' }).click(); await p.waitForTimeout(1200)
    await p.getByPlaceholder('Nhập mã 6 chữ số').fill('123456')
    await p.getByRole('button', { name: 'Kiểm tra' }).click(); await p.waitForTimeout(1500)
    await el(p, p.getByPlaceholder('Nhập số điện thoại').locator('xpath=ancestor::*[.//text()[contains(.,"Số điện thoại")]][1]'), 'acc-phone-verified')
  },
  'acc-abroad': async p => {
    await go(p, '/auth/sign-up/detail')
    await p.getByText('Tôi đang ở nước ngoài').click(); await p.waitForTimeout(600)
    await p.getByPlaceholder('Nhập email').scrollIntoViewIfNeeded()
    await snap(p, 'acc-abroad')
  },
  'acc-terms': async p => {
    await go(p, '/auth/sign-up/detail')
    const t = p.getByText('Đồng ý tất cả').first(); await t.scrollIntoViewIfNeeded()
    await el(p, t.locator('xpath=ancestor::*[.//text()[contains(.,"Bắt buộc")]][1]'), 'acc-terms')
  },
  'acc-signup-errors': async p => {
    await go(p, '/auth/sign-up/detail')
    for (const ph of ['Nhập họ và tên', 'Nhập email', 'Nhập mật khẩu']) { await p.getByPlaceholder(ph).click(); }
    await p.getByPlaceholder('Nhập số điện thoại').click(); await p.mouse.click(5, 5); await p.waitForTimeout(500)
    await snap(p, 'acc-signup-errors')
  },
  'acc-complete-signup': async p => { await go(p, '/auth/complete-signup'); await p.waitForTimeout(1500); await snap(p, 'acc-complete-signup', { fullPage: true }) },
  'acc-welcome': async p => { await go(p, '/chao-mung'); await snap(p, 'acc-welcome') },
  'acc-sign-in': async p => { await go(p, '/auth/sign-in'); await snap(p, 'acc-sign-in') },
  'acc-sign-in-errors': async p => {
    await go(p, '/auth/sign-in')
    await p.getByRole('button', { name: 'Đăng nhập', exact: true }).click(); await p.waitForTimeout(700)
    await snap(p, 'acc-sign-in-errors')
  },
  'acc-sign-in-oauth': async p => { await go(p, '/auth/sign-in?error=oauth_failed'); await snap(p, 'acc-sign-in-oauth') },
  'acc-sign-in-verified': async p => { await go(p, '/auth/sign-in?verified=1'); await snap(p, 'acc-sign-in-verified') },
  'acc-forgot': async p => { await go(p, '/auth/forgot-password'); await snap(p, 'acc-forgot') },
  'acc-forgot-verified': async p => {
    await go(p, '/auth/forgot-password')
    await p.getByPlaceholder('Nhập số điện thoại của bạn').fill('0912345678')
    await p.getByRole('button', { name: 'Xác thực' }).click(); await p.waitForTimeout(1500)
    await snap(p, 'acc-forgot-code')
    await p.getByPlaceholder('••••••').fill('000000')
    await p.getByRole('button', { name: 'Kiểm tra' }).click(); await p.waitForTimeout(1500)
    await snap(p, 'acc-forgot-verified')
    await p.getByRole('button', { name: 'Đặt lại mật khẩu' }).last().click(); await p.waitForTimeout(1500)
    await snap(p, 'acc-forgot-step2')
  },
  'acc-reset-legacy': async p => { await go(p, '/auth/reset-password?token=demo'); await snap(p, 'acc-reset-legacy') },
  'acc-account-deleted': async p => { await go(p, '/auth/account-deleted'); await snap(p, 'acc-account-deleted') },

  'cv-list': async p => { await go(p, '/ho-so-ca-nhan/cv-resume'); await snap(p, 'cv-list'); await snap(p, 'cv-list-full', { fullPage: true }) },
  'cv-new': async p => { await go(p, '/ho-so-ca-nhan/cv/tao-moi'); await snap(p, 'cv-new') },
  'cv-builder': async p => {
    await go(p, '/ho-so-ca-nhan/cv/tao'); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500)
    await snap(p, 'cv-builder'); await snap(p, 'cv-builder-full', { fullPage: true })
  },
  'cv-experience': async p => {
    await go(p, '/ho-so-ca-nhan/cv/tao')
    const sel = p.getByRole('combobox', { name: 'Kinh nghiệm' }).first()
    if (await sel.count()) { await sel.click(); await p.getByRole('option', { name: 'Có kinh nghiệm' }).click() }
    else { await p.locator('select').first().selectOption({ label: 'Có kinh nghiệm' }) }
    await p.waitForTimeout(900)
    const h = p.getByText('Kinh nghiệm làm việc', { exact: true }).first(); await h.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120))
    await snap(p, 'cv-experience')
  },
  // No cv-education shot: the degree list comes from the backend catalogue, empty in mock mode.
  'cv-skills': async p => {
    await go(p, '/ho-so-ca-nhan/cv/tao')
    const sec = p.locator('h3', { hasText: 'Kỹ năng' }).first(); await sec.scrollIntoViewIfNeeded()
    const add = sec.locator('xpath=ancestor::*[.//button[contains(.,"Thêm")]][1]').getByRole('button', { name: /Thêm/ }).first(); await add.click(); await p.waitForTimeout(1200)
    await sec.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120))
    await snap(p, 'cv-skills')
  },
  'cv-basic-info': async p => {
    await go(p, '/ho-so-ca-nhan/cv/tao'); await p.evaluate(() => window.scrollTo(0, 0))
    await p.getByRole('button', { name: 'Chỉnh sửa' }).first().click(); await p.waitForTimeout(900); await p.evaluate(() => window.scrollTo(0, 0))
    await snap(p, 'cv-basic-info')
  },
  'cv-visibility': async p => {
    await go(p, '/ho-so-ca-nhan/cv/tao')
    const q = p.locator('h2', { hasText: 'hiển thị CV' }).first(); await q.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -80))
    await snap(p, 'cv-visibility')
  },
  'cv-save-blocked': async p => {
    await go(p, '/ho-so-ca-nhan/cv/tao')
    await p.getByRole('button', { name: 'Lưu', exact: true }).nth(1).click({ noWaitAfter: true, timeout: 8000 }); await p.waitForTimeout(1200)
    await snap(p, 'cv-save-blocked')
  },
  'cv-detail': async p => { await go(p, '/ho-so-ca-nhan/cv/mock-cv-4'); await p.evaluate(() => window.scrollTo(0, 0)); await snap(p, 'cv-detail') },
  'cv-upload': async p => {
    await go(p, '/ho-so-ca-nhan/cv/tai-len'); await snap(p, 'cv-upload')
    await p.getByText('Thêm tệp').first().click(); await p.waitForTimeout(700); await snap(p, 'cv-upload-modal')
  },
  'cv-upload-existing': async p => { await go(p, '/ho-so-ca-nhan/cv/tai-len?id=mock-cv-1'); await snap(p, 'cv-upload-existing') },
  'cv-viewing': async p => { await go(p, '/ho-so-ca-nhan/luot-xem-cv'); await snap(p, 'cv-viewing') },
  'cv-work-pref': async p => { await go(p, '/ho-so-ca-nhan/dieu-kien-lam-viec'); await snap(p, 'cv-work-pref') },
  // Signed-in mock profile, so Nộp đơn opens the apply panel (not the sign-in box).
  'cv-apply': async p => {
    await go(p, '/jobs/senior-security-engineer-r53947899'); await snap(p, 'cv-job')
    await p.getByRole('button', { name: 'Nộp đơn' }).nth(1).click({ timeout: 8000 }); await p.waitForTimeout(1500); await snap(p, 'cv-apply')
  },
}

;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN', deviceScaleFactor: 1 })
  await ctx.addCookies([{ name: 'NEXT_LOCALE', value: 'vi', domain: 'localhost', path: '/' }])
  for (const [k, fn] of Object.entries(SHOTS)) {
    if (only.length && !only.includes(k)) continue
    const p = await ctx.newPage()
    try { await fn(p) } catch (e) { console.log('✗', k, e.message.split('\n')[0]) }
    await p.close()
  }
  await b.close()
})()
