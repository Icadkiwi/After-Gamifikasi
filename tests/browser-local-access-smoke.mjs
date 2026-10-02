// Real AuthProvider; no account creation or real credential submission.
// Requires Vite dev on 5176 and the production preview on 4176.
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5176'
const preview = process.env.SMOKE_PREVIEW_URL ?? 'http://127.0.0.1:4176'
const shotsDir = process.env.SMOKE_SCREENSHOT_DIR ?? 'docs/screenshots'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const failures = []
let debugPage
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.route('https://*.googleapis.com/**', (route) => route.abort())
  const page = await context.newPage()
  debugPage = page
  page.setDefaultTimeout(20000)
  page.on('pageerror', (error) => failures.push(error.message))
  await page.goto(base)
  await page.getByRole('heading', { name: 'Pilih akses pengujian' }).waitFor()
  await page.getByRole('button', { name: 'Masuk Admin Lokal', exact: true }).click()
  await page.waitForURL('**/game')
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 1)
  await page.locator('canvas').waitFor()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('after-gamifikasi-economy-state:user:local-preview-admin-v1'))?.bankLevel === 1)
  await page.getByRole('button', { name: 'Lewati Tutorial', exact: true }).click()
  await page.getByRole('button', { name: 'Kontrol Admin', exact: true }).click()
  await page.getByRole('button', { name: '+500 Koin', exact: true }).click()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('after-gamifikasi-user-stats-local-preview-admin-v1'))?.coin === 500)
  await page.getByRole('button', { name: 'Tutup', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Kontrol Admin', exact: true }).waitFor()
  assert.equal(await page.evaluate(() => sessionStorage.getItem('after-gamifikasi-local-session-v1')), 'admin')
  console.log('PASS: local admin entry, tools and reload')

  await page.getByRole('link', { name: /^After Gamifikasi/ }).click()
  await page.getByRole('button', { name: 'Tes Login User', exact: true }).click()
  await page.waitForURL('**/login')
  await page.getByLabel('Email', { exact: true }).fill('invalid-email')
  await page.getByLabel('Kata Sandi', { exact: true }).fill('test-only')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'format yang valid' }).waitFor()
  assert.equal(await page.evaluate(() => sessionStorage.getItem('after-gamifikasi-local-session-v1')), null)
  await page.getByRole('link', { name: /^After Gamifikasi/ }).click()
  await page.getByRole('button', { name: 'Tes Registrasi User', exact: true }).click()
  await page.waitForURL('**/register')
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test')
  await page.getByLabel('Kata Sandi', { exact: true }).fill('123')
  await page.getByRole('button', { name: 'Daftar', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'minimal 6 karakter' }).waitFor()
  console.log('PASS: leaving preview for real login/register forms and validation')

  await page.getByRole('link', { name: /^After Gamifikasi/ }).click()
  await page.getByRole('button', { name: 'Coba User Lokal', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 1)
  await page.locator('canvas').waitFor()
  await page.getByRole('button', { name: 'Lewati Tutorial', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Kontrol Admin', exact: true }).count(), 0)
  const stats = await page.evaluate(() => ({
    admin: JSON.parse(localStorage.getItem('after-gamifikasi-user-stats-local-preview-admin-v1')),
    user: JSON.parse(localStorage.getItem('after-gamifikasi-user-stats-local-preview-user-v1')),
  }))
  assert.equal(stats.admin.coin, 500)
  assert.equal(stats.user.coin, 0)
  await page.reload()
  await page.locator('canvas').waitFor()
  assert.equal(await page.getByRole('button', { name: 'Kontrol Admin', exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await page.getByRole('heading', { name: 'Pilih akses pengujian' }).waitFor()
  console.log('PASS: local user isolation, reload and logout')
  await page.goto(`${base}/game`)
  await page.waitForURL('**/login')
  await page.goto(base)
  await page.getByRole('heading', { name: 'Pilih akses pengujian' }).waitFor()
  fs.mkdirSync(shotsDir, { recursive: true })
  await page.screenshot({ path: `${shotsDir}/local-access-desktop.png` })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.screenshot({ path: `${shotsDir}/local-access-mobile.png`, fullPage: true })

  const production = await browser.newContext()
  await production.route('https://*.googleapis.com/**', (route) => route.abort())
  await production.addInitScript(() => sessionStorage.setItem('after-gamifikasi-local-session-v1', 'admin'))
  const prodPage = await production.newPage()
  prodPage.on('pageerror', (error) => failures.push(error.message))
  await prodPage.goto(preview)
  await prodPage.waitForURL('**/login')
  assert.equal(await prodPage.getByRole('button', { name: 'Masuk Admin Lokal' }).count(), 0)
  await prodPage.goto(`${preview}/game`)
  await prodPage.waitForURL('**/login')
  assert.equal(await prodPage.locator('canvas').count(), 0)
  assert.deepEqual(failures, [])
  console.log('PASS: local admin tools, separate user preview, reload/logout, real login/register forms and validation, mobile layout; production rejects stale local admin session. No Firebase account created.')
} catch (error) {
  if (debugPage) console.error('Failed at:', debugPage.url(), (await debugPage.locator('body').innerText()).slice(0, 2000))
  throw error
} finally {
  await browser.close()
}
