// Optional local browser check. Uses the existing playwright-core installation.
// Auth is intercepted in this test's browser only; no Firebase account is created.
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5176'
const shotsDir = process.env.SMOKE_SCREENSHOT_DIR ?? 'docs/screenshots'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const failures = []
let debugPage
try {
  const guest = await browser.newPage()
  await guest.goto(`${base}/game`)
  await guest.waitForURL('**/login')
  assert.equal(await guest.getByRole('heading', { name: 'Masuk', exact: true }).count(), 1)
  await guest.goto(`${base}/forgot-password`)
  await guest.locator('input[type=email]').waitFor()
  assert.ok(await guest.locator('input[type=email]').count())
  await guest.close()

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.route('**/src/contexts/AuthContext.tsx*', (route) => route.fulfill({ contentType: 'application/javascript', body: `
    const user = { uid: 'smoke-learner', email: 'learner@example.test', emailVerified: true };
    export function AuthProvider({children}) { return children; }
    export function useAuth() { return { user, isAdmin: false, isLocalSession: false, loading: false, initializing: false, authError: '', verificationError: '', verificationCooldownUntil: 0, logout: async () => {}, login: async () => user, register: async () => user, refreshUser: async () => user, resendVerificationEmail: async () => {} }; }
  ` }))
  await context.route('https://*.googleapis.com/**', (route) => route.abort())
  const page = await context.newPage()
  debugPage = page
  page.on('pageerror', (error) => failures.push(error.message))
  page.setDefaultTimeout(20000)
  await page.goto(`${base}/game`)
  await page.locator('canvas').waitFor()
  await page.getByRole('button', { name: 'Lewati Tutorial', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Kontrol Admin' }).count(), 0)
  await page.getByRole('button', { name: 'Belajar', exact: true }).click()
  await page.getByRole('button', { name: 'Mulai asesmen awal', exact: true }).click()
  async function answerAndSubmit() {
    const groups = page.locator('fieldset')
    for (let i = 0; i < await groups.count(); i++) await groups.nth(i).locator('input[type=radio]').last().check()
    await page.getByRole('button', { name: 'Kirim jawaban', exact: true }).click()
    await page.getByText('Skor: 100/100', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Lihat progres belajar' }).click()
  }
  await answerAndSubmit()
  await page.getByRole('button', { name: 'Baca materi', exact: true }).first().click()
  await page.getByRole('button', { name: 'Sudah membaca, lanjutkan latihan' }).click()
  await page.getByRole('button', { name: 'Latihan skenario', exact: true }).first().click()
  await answerAndSubmit()
  await page.getByRole('button', { name: 'Asesmen ulang', exact: true }).first().click()
  await answerAndSubmit()
  const state = await page.evaluate(() => ({ profile: JSON.parse(localStorage.getItem('after-gamifikasi-learning-v1:smoke-learner')), stats: JSON.parse(localStorage.getItem('after-gamifikasi-user-stats-smoke-learner')) }))
  assert.deepEqual(state.profile.completedChallenges, ['budget-challenge'])
  assert.equal(state.stats.exp, 100)
  assert.equal(state.stats.coin, 850)
  await page.getByRole('button', { name: 'Ringkasan', exact: true }).click()
  fs.mkdirSync(shotsDir, { recursive: true })
  await page.screenshot({ path: `${shotsDir}/learning-desktop.png` })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(await page.getByRole('dialog').isVisible())
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.screenshot({ path: `${shotsDir}/learning-mobile.png` })
  await page.getByRole('button', { name: 'Kembali ke kota', exact: true }).click()
  await page.setViewportSize({ width: 1280, height: 800 })
  // Use the real building UI rather than importing a second HMR event module.
  await page.waitForFunction(() => document.querySelector('canvas')?.clientWidth === 1280)
  const bankPosition = await page.evaluate(() => {
    const bank = JSON.parse(localStorage.getItem('after-gamifikasi-shop-placeables:user:smoke-learner')).find((item) => item.key === 'bank')
    return { x: bank.x, y: bank.y - 45 }
  })
  await page.locator('canvas').click({ position: bankPosition })
  await page.getByRole('button', { name: 'Tingkatkan - 700 koin', exact: true }).click()
  await page.getByRole('button', { name: 'Konfirmasi Tingkatkan', exact: true }).click()
  await page.getByRole('button', { name: 'Tutup', exact: true }).click()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('after-gamifikasi-economy-state:user:smoke-learner'))?.bankLevel === 2)
  await page.getByRole('button', { name: 'Belajar', exact: true }).click()
  await page.getByRole('button', { name: 'Jalur Belajar', exact: true }).click()
  await page.getByRole('button', { name: 'Baca materi', exact: true }).nth(1).click()
  await page.getByRole('button', { name: 'Sudah membaca, lanjutkan latihan' }).click()
  await page.getByRole('button', { name: 'Latihan skenario', exact: true }).nth(1).click()
  await answerAndSubmit()
  await page.getByRole('button', { name: 'Asesmen ulang', exact: true }).nth(1).click()
  await answerAndSubmit()
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('after-gamifikasi-learning-v1:smoke-learner')).completedChallenges.length), 2)
  await page.getByRole('button', { name: 'Kembali ke kota', exact: true }).click()
  await page.getByRole('button', { name: 'Toko', exact: true }).click()
  await page.getByRole('button', { name: 'Kendaraan', exact: true }).click()
  const taxi = page.locator('article').filter({ hasText: 'Taksi' })
  await taxi.getByRole('button', { name: 'Beli', exact: true }).click()
  // Shop confirmation is a separate button.
  const confirm = page.getByRole('button', { name: 'Beli', exact: true })
  if (await confirm.count() > 0) await confirm.last().click()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('after-gamifikasi-user-stats-smoke-learner'))?.purchasedShopItems.includes('vehicle-taxi'))
  const beforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('after-gamifikasi-user-stats-smoke-learner')).coin)
  await page.reload()
  await page.locator('canvas').waitFor()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('after-gamifikasi-economy-state:user:smoke-learner'))?.bankLevel === 2)
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('after-gamifikasi-user-stats-smoke-learner')).coin), beforeReload)
  assert.deepEqual(failures, [])
  console.log('PASS: guest auth routes; both learning loops; mastery/rewards; admin hidden; desktop/mobile; bank upgrade; city-to-challenge gate; vehicle purchase; reload persistence; no page errors.')
  await context.close()
} catch (error) {
  console.error('Page errors:', failures)
  if (debugPage) {
    console.error((await debugPage.locator('body').innerText()).slice(0, 5000))
    fs.mkdirSync(shotsDir, { recursive: true })
    await debugPage.screenshot({ path: `${shotsDir}/smoke-failure.png` })
  }
  throw error
} finally { await browser.close() }
