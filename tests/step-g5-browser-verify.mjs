// G.5 uses the real Local Access UI, DOM, screenshots and isolated local storage.
// No private Phaser instance, production credentials or application instrumentation.
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const base = process.env.SMOKE_BASE_URL ?? 'http://[::1]:5176'
const shotsDir = 'docs/screenshots/step-g5'
const recoveryOnly = process.argv.includes('--recovery-only')
const UID = 'local-preview-user-v1'
fs.mkdirSync(shotsDir, { recursive: true })
const results = []
const runtime = { pageErrors: [], consoleErrors: [], warnings: [], failedResources: [], httpErrors: [], intentionalBlocks: [] }
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
let page

function record(id, status, note) {
  assert.ok(['PASS', 'PARTIAL', 'FAIL', 'NOT TESTABLE'].includes(status))
  results.push({ id, status, note })
  console.log(`[${status}] ${id}: ${note}`)
}

const cityRead = (uid) => ({
  placeables: JSON.parse(localStorage.getItem(`after-gamifikasi-shop-placeables:user:${uid}`) ?? '[]'),
  streak: JSON.parse(localStorage.getItem(`after-gamifikasi-streak-state:user:${uid}`) ?? 'null'),
  stats: JSON.parse(localStorage.getItem(`after-gamifikasi-user-stats-${uid}`) ?? 'null'),
  profile: JSON.parse(localStorage.getItem(`after-gamifikasi-learning-v1:${uid}`) ?? 'null'),
  economy: JSON.parse(localStorage.getItem(`after-gamifikasi-economy-state:user:${uid}`) ?? 'null'),
})

async function readyCity() {
  await page.waitForURL('**/game')
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 1)
  await page.locator('canvas').waitFor({ state: 'visible' })
  await page.waitForFunction((uid) => JSON.parse(localStorage.getItem(`after-gamifikasi-shop-placeables:user:${uid}`) ?? '[]').some((p) => p.shopKey === 'bank'), UID)
  assert.equal(await page.getByText('Unexpected Application Error!').count(), 0)
  const skip = page.getByRole('button', { name: 'Lewati Tutorial', exact: true })
  if (await skip.isVisible()) await skip.click()
  // Let Phaser's next-frame destruction and asset rendering settle.
  await page.waitForTimeout(700)
  assert.equal(await page.locator('canvas').count(), 1)
  assert.deepEqual(runtime.pageErrors, [])
}

async function verifyFeatures() {
  const state = await page.evaluate(cityRead, UID)
  const hall = state.placeables.find((p) => p.shopKey === 'Classic City Hall Icon')
  const bank = state.placeables.find((p) => p.shopKey === 'bank')
  assert.ok(hall && bank)
  await minimizeMissions()
  await page.screenshot({ path: `${shotsDir}/01-main-city-desktop.png` })
  record('Main City', 'PASS', 'Visible canvas and starter buildings; actual screenshot 01, public sprite clicks below')
  await clickPlaceable('bank')
  await page.getByRole('button', { name: 'Tingkatkan - 700 koin', exact: true }).waitFor()
  await closeModal()
  record('Bank', 'PASS', 'Bank sprite opens existing upgrade UI')
  await clickPlaceable('Classic City Hall Icon')
  const hallDialog = page.getByRole('dialog', { name: /Balai Kota/ })
  await hallDialog.waitFor()
  assert.equal(hall.canSell, false)
  assert.equal(await hallDialog.getByRole('button', { name: /Jual|Tingkatkan/ }).count(), 0)
  const progress = await page.evaluate(async () => {
    const { emitGameEvent, subscribeGameEvent } = await import('/src/game/GameEvents.ts')
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { unsubscribe(); reject(new Error('City progress event missing')) }, 3000)
      const unsubscribe = subscribeGameEvent('CITY_PROGRESS_UPDATE', (value) => { clearTimeout(timer); unsubscribe(); resolve(value) })
      emitGameEvent('REQUEST_CITY_PROGRESS', {})
    })
  })
  const metrics = await hallDialog.locator('.grid.grid-cols-3 > div > p:last-child').allTextContents()
  assert.deepEqual(metrics, [progress.cityLevel, progress.buildingCount, progress.passiveIncomePerHour].map(String))
  const hallText = await hallDialog.innerText()
  assert.doesNotMatch(hallText, /mastery|komunitas|AI/)
  record('City Hall Modal', 'PASS', `Sprite click opens protected modal; live event metrics ${JSON.stringify(progress)} match DOM`)
  check('City Hall truthful copy', !hallText.includes('Toko Cukur beroperasi') || state.placeables.some((p) => p.shopKey === 'barber_shop'), 'Milestone copy must not claim an absent barber is operating')
  await page.screenshot({ path: `${shotsDir}/04-cityhall-modal.png` })
  await closeModal()
  record('City Hall', 'PASS', `Real sprite responds at saved (${hall.x}, ${hall.y}); screenshot 01 shows scale and separation from Bank; not sellable`)
  await page.getByRole('button', { name: 'Toko', exact: true }).click()
  const shop = page.locator('.shop-modal')
  await shop.waitFor()
  const labels = await shop.locator('article').allTextContents()
  assert.ok(labels.length > 10)
  assert.doesNotMatch(labels.join('\n'), /Classic City Hall|Balai Kota|Hand-Sketched|Sekolah|Streak/i)
  await closeModal()
  record('Shop', 'PASS', `${labels.length} actual shop cards checked in Semua: Hall, School and Streak excluded`)
  record('School', state.placeables.some((p) => p.shopKey === 'Hand-Sketched Cartoon School Building') ? 'NOT TESTABLE' : 'PARTIAL', 'School is not placed in the default city; no placement feature added. Existing Learn entry tested below.')

  const hud = page.locator('aside').first()
  assert.match(await hud.innerText(), /Level 1/)
  assert.match(await hud.innerText(), /EXP/)
  assert.match(await hud.innerText(), /0 hari/)
  for (const [name, asset] of [['Coin', 'Coin.png'], ['Diamond', 'Diamond.png'], ['Streak asset', 'Streak.png']]) {
    const imageState = await hud.locator(`img[src*="${asset}"]`).evaluate((img) => ({ loaded: img.complete && img.naturalWidth > 0, src: img.getAttribute('src') }))
    assert.ok(imageState.loaded)
    record(name, 'PASS', imageState.src)
  }
  check('Streak next milestone', (await hud.innerText()).includes('Hadiah berikutnya: hari ke-3'), 'At 0 days the next configured gift is day 3, not all milestones completed')
  assert.equal(await page.getByRole('button', { name: 'Lindungi streak', exact: true }).count(), 0)
  assert.equal(await page.getByText(/Hadiah Misteri Dibuka/).count(), 0)
  record('HUD', 'PASS', 'Level, EXP, coin, diamond, current streak and all three real PNG assets loaded')

  // Isolated browser fixture supplies purchasing funds and Bank capacity only.
  // Neither valid learning evidence nor streak is manufactured by these actions.
  await page.evaluate((uid) => {
    const statsKey = `after-gamifikasi-user-stats-${uid}`
    const economyKey = `after-gamifikasi-economy-state:user:${uid}`
    localStorage.setItem(statsKey, JSON.stringify({ ...JSON.parse(localStorage.getItem(statsKey)), coin: 4000 }))
    localStorage.setItem(economyKey, JSON.stringify({ ...JSON.parse(localStorage.getItem(economyKey)), bankLevel: 3 }))
  }, UID)
  await page.reload()
  await readyCity()
  await minimizeMissions()
  const beforePurchase = await page.evaluate(cityRead, UID)
  await page.getByRole('button', { name: 'Toko', exact: true }).click()
  const barber = page.locator('.shop-modal article').filter({ hasText: 'Toko Cukur' })
  await barber.getByRole('button', { name: 'Beli', exact: true }).click()
  await page.getByRole('button', { name: 'Beli', exact: true }).last().click()
  await page.getByText('Menempatkan Toko Cukur', { exact: true }).waitFor()
  await page.locator('canvas').click({ position: { x: 640, y: bank.y + 10 } })
  await page.getByRole('button', { name: 'Taruh di Sini', exact: true }).click()
  await page.waitForFunction((uid) => JSON.parse(localStorage.getItem(`after-gamifikasi-shop-placeables:user:${uid}`)).some((p) => p.shopKey === 'barber_shop'), UID)
  const afterPurchase = await page.evaluate(cityRead, UID)
  assert.deepEqual(afterPurchase.streak, beforePurchase.streak)
  assert.deepEqual(afterPurchase.profile, beforePurchase.profile)
  assert.ok(afterPurchase.stats.coin < beforePurchase.stats.coin)
  record('City actions do not teach', 'PASS', 'Real barber purchase/placement deducts coins without changing learning profile or creating a streak')
  // Put the existing income accumulator just below one coin to exercise a real
  // one-second passive-income tick without a twelve-minute wall-clock wait.
  await page.evaluate((uid) => {
    const key = `after-gamifikasi-economy-state:user:${uid}`
    localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)), passiveIncomeRemainder: 0.9999 }))
  }, UID)
  await page.reload()
  await readyCity()
  await page.waitForFunction(({ uid, coin }) => JSON.parse(localStorage.getItem(`after-gamifikasi-user-stats-${uid}`)).coin > coin, { uid: UID, coin: afterPurchase.stats.coin })
  const afterIncome = await page.evaluate(cityRead, UID)
  assert.deepEqual(afterIncome.streak, afterPurchase.streak)
  assert.deepEqual(afterIncome.profile, afterPurchase.profile)
  record('Passive income does not teach', 'PASS', 'Real timed income adds a coin; profile/mastery and streak bytes unchanged')
  await page.getByRole('button', { name: 'Toko', exact: true }).click()
  await page.getByRole('button', { name: 'Kendaraan', exact: true }).click()
  await page.locator('article').filter({ hasText: 'Taksi' }).getByRole('button', { name: 'Beli', exact: true }).click()
  await page.getByRole('button', { name: 'Beli', exact: true }).last().click()
  await page.waitForFunction((uid) => JSON.parse(localStorage.getItem(`after-gamifikasi-user-stats-${uid}`)).purchasedShopItems.includes('vehicle-taxi'), UID)
  if (await page.locator('.shop-modal').isVisible()) await closeModal()
  const vehicleCount = await page.evaluate(async () => {
    const { emitGameEvent, subscribeGameEvent } = await import('/src/game/GameEvents.ts')
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { unsubscribe(); reject(new Error('Vehicle progress event missing')) }, 3000)
      const unsubscribe = subscribeGameEvent('CITY_PROGRESS_UPDATE', (value) => { clearTimeout(timer); unsubscribe(); resolve(value.vehicleNpcCount) })
      emitGameEvent('REQUEST_CITY_PROGRESS', {})
    })
  })
  assert.equal(vehicleCount, 1)
  await page.screenshot({ path: `${shotsDir}/09-city-vehicles.png`, animations: 'disabled' })
  const roadClip = { x: 0, y: 700, width: 1280, height: 80 }
  const frame1 = await page.screenshot({ path: `${shotsDir}/10-vehicle-motion-before.png`, clip: roadClip })
  await page.waitForTimeout(600)
  const frame2 = await page.screenshot({ path: `${shotsDir}/11-vehicle-motion-after.png`, clip: roadClip })
  assert.equal(frame1.equals(frame2), false)
  assert.deepEqual((await page.evaluate(cityRead, UID)).profile, afterIncome.profile)
  assert.deepEqual((await page.evaluate(cityRead, UID)).streak, afterIncome.streak)
  record('Vehicles', 'PASS', 'Real taxi purchase creates one NPC in public city progress; two road screenshots differ after 600ms; no learning/streak awarded')

  // Prior-day streak fixture: test eligibility/protection before a real learning
  // submission advances day 2 to day 3 and grants the configured gift.
  await page.evaluate((uid) => {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const key = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    localStorage.setItem(`after-gamifikasi-streak-state:user:${uid}`, JSON.stringify({ schemaVersion: 1, userId: uid, currentStreak: 2, bestStreak: 2, lastActiveDate: key, protectionUsedDate: null, grantedMilestoneReceipts: [] }))
  }, UID)
  await page.reload()
  await readyCity()
  const atRisk = await page.evaluate(cityRead, UID)
  await page.getByRole('button', { name: 'Lindungi streak', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Lindungi streak', exact: true }).count(), 0)
  const protectedState = await page.evaluate(cityRead, UID)
  assert.ok(protectedState.streak.protectionUsedDate)
  assert.equal(protectedState.streak.currentStreak, 2)
  assert.deepEqual(protectedState.profile, atRisk.profile)
  assert.equal(protectedState.stats.diamond, atRisk.stats.diamond)
  await page.reload()
  await readyCity()
  assert.deepEqual((await page.evaluate(cityRead, UID)).streak, protectedState.streak)
  assert.equal(await page.getByRole('button', { name: 'Lindungi streak', exact: true }).count(), 0)
  record('Streak Protection', 'PASS', 'Hidden at day 0; eligible prior-day streak protects once, survives reload, changes no mastery or reward')
  await page.getByRole('button', { name: 'Belajar', exact: true }).click()
  await page.getByText('Dasbor Pembelajaran', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Mulai asesmen awal', exact: true }).click()
  const groups = page.locator('fieldset')
  for (let i = 0; i < await groups.count(); i++) await groups.nth(i).locator('input[type=radio]').last().check()
  await page.getByRole('button', { name: 'Kirim jawaban', exact: true }).click()
  await page.getByText('Skor: 100/100', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Kembali ke kota', exact: true }).click()
  await page.getByText('Hadiah Misteri Dibuka!', { exact: true }).waitFor()
  const gifted = await page.evaluate(cityRead, UID)
  assert.equal(gifted.streak.currentStreak, 3)
  assert.equal(gifted.stats.diamond - protectedState.stats.diamond, 20)
  assert.equal(gifted.stats.learningRewardReceipts.filter((id) => id === 'streak-milestone:3').length, 1)
  await page.screenshot({ path: `${shotsDir}/06-mystery-gift.png` })
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click()
  assert.deepEqual((await page.evaluate(cityRead, UID)).profile, gifted.profile)
  await page.reload()
  await readyCity()
  const reloaded = await page.evaluate(cityRead, UID)
  assert.deepEqual(reloaded.streak, gifted.streak)
  assert.equal(reloaded.stats.diamond, gifted.stats.diamond)
  assert.deepEqual(reloaded.stats.learningRewardReceipts, gifted.stats.learningRewardReceipts)
  assert.deepEqual(reloaded.profile, gifted.profile)
  assert.equal(await page.getByText('Hadiah Misteri Dibuka!', { exact: true }).count(), 0)
  check('Streak next milestone after gift', (await hud.innerText()).includes('Hadiah berikutnya: hari ke-7'), 'Day 3 must announce next configured milestone day 7')
  record('Mystery Gift', 'PASS', 'No gift at day 0/2; real assessment advances seeded prior days to 3: +20 diamonds, one receipt, one reveal; reload cannot pay again')
  record('Streak', 'PASS', 'UI shows 3 days from validated learning; protection, purchases, passive income and gift presentation do not alter mastery')
  await minimizeMissions()
  await page.screenshot({ path: `${shotsDir}/02-hud-streak-desktop.png` })

  await verifyMissions('desktop')
  await page.screenshot({ path: `${shotsDir}/03-daily-mystery-panel.png` })
  await minimizeMissions()
  await page.setViewportSize({ width: 390, height: 780 })
  await page.waitForFunction(() => document.querySelector('canvas')?.clientWidth === 390)
  await page.waitForTimeout(500)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.screenshot({ path: `${shotsDir}/05-narrow-mobile.png` })
  await verifyMissions('mobile')
  await page.screenshot({ path: `${shotsDir}/07-narrow-missions.png` })
  await minimizeMissions()
  // Horizontal pan is a real Phaser pointer gesture, then return to the left
  // boundary; the saved Hall's left facade remains within the narrow viewport.
  const canvasBox = await page.locator('canvas').boundingBox()
  await page.mouse.move(330, canvasBox.y + 455)
  await page.mouse.down()
  await page.mouse.move(230, canvasBox.y + 455, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(400)
  await page.mouse.move(220, canvasBox.y + 455)
  await page.mouse.down()
  await page.mouse.move(385, canvasBox.y + 455, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(600)
  await clickPlaceable('Classic City Hall Icon', -95)
  await hallDialog.waitFor()
  assert.equal(await hallDialog.getByRole('button', { name: 'Tutup', exact: true }).isVisible(), true)
  const mobileDialogBox = await hallDialog.boundingBox()
  assert.ok(mobileDialogBox.x >= 0 && mobileDialogBox.x + mobileDialogBox.width <= 390)
  await page.screenshot({ path: `${shotsDir}/08-narrow-cityhall.png` })
  await closeModal()
  record('Phaser pointer interaction', 'PASS', 'Desktop Bank/Hall clicks and mobile pan/Hall click work after overlays close')
  record('Narrow/mobile', 'PASS', '390x780: no horizontal overflow; HUD, quick actions, scrolling and City Hall close action exercised (screenshots 05/07/08)')
  record('Desktop', 'PASS', '1280x800: real city, HUD and overlays captured')
  const unexpectedResources = runtime.failedResources.filter((entry) => !runtime.intentionalBlocks.includes(entry.url) && entry.error !== 'net::ERR_ABORTED')
  const unexpectedConsole = runtime.consoleErrors.filter((entry) => !runtime.intentionalBlocks.includes(entry.url))
  assert.deepEqual(runtime.pageErrors, [])
  assert.deepEqual(unexpectedConsole, [])
  assert.deepEqual(unexpectedResources, [])
  assert.deepEqual(runtime.httpErrors, [])
  record('Console/runtime', 'PASS', `0 uncaught/console/resource/HTTP errors; ${runtime.warnings.length} warnings; ${runtime.intentionalBlocks.length} intentional external blocks`)
}

function check(id, passed, note) { record(id, passed ? 'PASS' : 'FAIL', note) }

async function minimizeMissions() {
  const minimize = page.getByRole('button', { name: 'Kecilkan', exact: true })
  if (await minimize.isVisible()) await minimize.click()
}

async function closeModal() { await page.getByRole('button', { name: 'Tutup', exact: true }).click() }

async function clickPlaceable(key, offsetX = 0) {
  const position = await page.evaluate(({ uid, key, offsetX }) => {
    const item = JSON.parse(localStorage.getItem(`after-gamifikasi-shop-placeables:user:${uid}`)).find((p) => p.shopKey === key)
    return { x: item.x + offsetX, y: item.y - 45 }
  }, { uid: UID, key, offsetX })
  await page.locator('canvas').click({ position })
}

async function verifyMissions(viewport) {
  await page.getByRole('button', { name: /Buka misi harian/i }).click()
  assert.equal(await page.getByRole('heading', { name: 'Taksi', exact: true }).count(), 0, 'React mission click must not open a vehicle underneath')
  const panel = page.locator('aside').filter({ hasText: 'Misi Misteri Hari Ini' })
  await panel.waitFor()
  const limit = panel.getByRole('button', { name: /Batas bonus misi harian/ })
  assert.equal(await limit.count(), 1)
  const mission = panel.locator('[data-slot="card"]').filter({ hasText: 'Misi Misteri Hari Ini' })
  const prompt = await mission.locator('[data-slot="card-title"]').innerText()
  const optionLabels = await mission.getByRole('button').allTextContents()
  const before = await page.evaluate(cityRead, UID)
  await mission.getByRole('button').first().click()
  assert.match(await mission.innerText(), /Tepat!|Belum tepat\./)
  const after = await page.evaluate(cityRead, UID)
  assert.deepEqual(after.profile, before.profile)
  assert.deepEqual(after.streak, before.streak)
  assert.equal(after.stats.diamond, before.stats.diamond)
  assert.equal(after.stats.exp, before.stats.exp)
  const scroll = panel.locator('.daily-mission-scrollbar').first()
  const size = await scroll.evaluate((el) => ({ height: el.clientHeight, content: el.scrollHeight }))
  check(`Daily Mission scroll ${viewport}`, size.height > 90, `Scroll viewport ${size.height}px for ${size.content}px content; must leave usable space for existing missions`)
  if (size.height > 90) {
    await scroll.evaluate((el) => { el.scrollTop = el.scrollHeight })
    assert.ok(await scroll.evaluate((el) => el.scrollTop > 0))
    await scroll.evaluate((el) => { el.scrollTop = 0 })
  }
  assert.doesNotMatch(await panel.innerText(), /roulette|jackpot|taruhan|lootbox/i)
  await page.reload()
  await readyCity()
  await minimizeMissions()
  await page.getByRole('button', { name: /Buka misi harian/i }).click()
  assert.equal(await page.getByRole('heading', { name: 'Taksi', exact: true }).count(), 0, 'Reloaded React mission click must not reach a vehicle')
  assert.equal(await mission.locator('[data-slot="card-title"]').innerText(), prompt)
  assert.deepEqual(await mission.getByRole('button').allTextContents(), optionLabels)
  await page.waitForTimeout(250)
  record(`Mystery Mission ${viewport}`, 'PASS', 'Actual question and options stable after reload; answer feedback grants no mastery/EXP/diamonds/streak')
  record(`DailyRewardLimit ${viewport}`, 'PASS', 'Existing limit card with accessible limit description rendered in mission panel')
}

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Asia/Jakarta' })
  await context.route('https://*.googleapis.com/**', (route) => {
    runtime.intentionalBlocks.push(route.request().url())
    return route.abort()
  })
  page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', (error) => runtime.pageErrors.push(error.message))
  page.on('console', (message) => {
    const entry = { text: message.text(), url: message.location().url }
    if (message.type() === 'error') runtime.consoleErrors.push(entry)
    if (message.type() === 'warning') runtime.warnings.push(entry)
  })
  page.on('requestfailed', (request) => runtime.failedResources.push({ url: request.url(), error: request.failure()?.errorText }))
  page.on('response', (response) => { if (response.status() >= 400) runtime.httpErrors.push({ url: response.url(), status: response.status() }) })
  await page.goto(base)
  await page.getByRole('heading', { name: 'Pilih akses pengujian' }).waitFor()
  await page.getByRole('button', { name: 'Coba User Lokal', exact: true }).click()
  await readyCity()
  record('recovery.initial', 'PASS', 'Local Access -> Coba User Lokal -> /game; one visible canvas, Bank persisted, no mount exception')
  await page.reload()
  await readyCity()
  record('recovery.reload', 'PASS', 'One visible canvas after reload; no uncaught error')
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await page.getByRole('heading', { name: 'Pilih akses pengujian' }).waitFor()
  assert.equal(await page.locator('canvas').count(), 0)
  await page.getByRole('button', { name: 'Coba User Lokal', exact: true }).click()
  await readyCity()
  record('recovery.remount', 'PASS', 'Logout removes canvas; re-entry mounts exactly one without a null-ref error')
  await page.screenshot({ path: `${shotsDir}/00-recovery.png` })
  if (!recoveryOnly) await verifyFeatures()
  assert.equal(results.filter((result) => result.status === 'FAIL').length, 0)
} catch (error) {
  record('verification.failure', 'FAIL', error.stack ?? String(error))
  if (page) {
    await page.screenshot({ path: `${shotsDir}/${recoveryOnly ? 'recovery' : 'verification'}-failure.png` }).catch(() => {})
    console.error('DIAGNOSTIC', await page.evaluate(() => ({ url: location.href, canvases: document.querySelectorAll('canvas').length, body: document.body.innerText.slice(0, 2500) })).catch(() => null))
  }
  throw error
} finally {
  fs.writeFileSync(`${shotsDir}/${recoveryOnly ? 'recovery' : 'results'}.json`, JSON.stringify({ results, runtime }, null, 2) + '\n')
  await browser.close()
}
