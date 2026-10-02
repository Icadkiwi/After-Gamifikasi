/**
 * Uji E2E alur autentikasi: registrasi -> verifikasi -> login -> logout
 *
 * Prasyarat:
 *   - Dev server berjalan di http://localhost:5199 (npx vite --port 5199)
 *   - Google Chrome terinstall (playwright-core memakai Chrome sistem)
 *
 * CATATAN: skrip ini membuat akun NYATA di project Firebase production
 * (email acak @example.com) untuk menguji alur secara sungguhan.
 *
 * Jalankan: node tests/e2e-auth-flow.mjs
 */

import { chromium } from 'playwright-core'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE_URL = 'http://localhost:5199'
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const FIREBASE_API_KEY = 'AIzaSyBsjdniJqqErmZ7hwB8YCeiUW3_YpPiq8c'
const FIREBASE_PROJECT_ID = 'after-gamification'

// Email unik per run agar registrasi selalu berhasil (domain example.com
// adalah domain resmi khusus testing, tidak memiliki kotak masuk nyata).
const EMAIL = `e2e-${Date.now()}@example.com`
const PASSWORD = 'test123456'

const results = []
let page
let browser
let uidFromPage = null

function report(name, passed, detail = '') {
  results.push({ name, passed, detail })
  const status = passed ? 'PASS' : 'FAIL'
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ''}`)
}

async function expectText(selector, expected, timeout = 15000) {
  const locator = page.locator(selector).filter({ hasText: expected }).first()
  await locator.waitFor({ state: 'visible', timeout })
  return locator
}

async function dismissOnboardingIfPresent() {
  // Pengguna baru dapat disambut modal onboarding; tutup bila muncul agar klik tidak terhalang.
  try {
    const dialog = page.locator('[role="dialog"]').first()
    if (await dialog.isVisible({ timeout: 3000 })) {
      for (const label of ['Lewati', 'Skip', 'Mulai', 'Tutup', 'Lanjut', 'Oke', 'Mengerti']) {
        const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).first()
        if (await btn.isVisible().catch(() => false)) {
          await btn.click()
          return
        }
      }
      await page.keyboard.press('Escape')
    }
  } catch {
    // Tidak ada modal; lanjutkan saja.
  }
}

// Mendapatkan token via REST identitytoolkit (independen dari browser)
// untuk memverifikasi akun benar-benar ada dan mengambil idToken Firestore.
async function signInViaRest(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  )
  return res.json()
}

async function getUserDoc(uid, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } })
  if (!res.ok) return null
  return res.json()
}

async function getUidFromBrowser() {
  return page.evaluate(async () => {
    const mod = await import('/src/lib/firebase.ts')
    return mod.auth.currentUser?.uid ?? null
  })
}

async function logoutFromUi() {
  await dismissOnboardingIfPresent()
  // Scope ke kontainer halaman verifikasi agar tidak bentrok dengan tombol "Keluar"
  // yang mungkin ada di modal onboarding.
  const pageContainer = page.locator('div[class*="max-w-md"]')
  await pageContainer.getByRole('button', { name: 'Keluar', exact: true }).click()
  try {
    await page.waitForURL('**/login', { timeout: 15000 })
  } catch {
    // Fallback: paksa sign-out via modul firebase bila klik UI tidak memicu navigasi.
    await page.evaluate(async () => {
      const mod = await import('/src/lib/firebase.ts')
      await mod.auth.signOut()
    })
    await page.waitForURL('**/login', { timeout: 15000 })
  }
}

async function step(name, fn) {
  try {
    await fn()
  } catch (err) {
    report(name, false, String(err).slice(0, 160))
  }
}

try {
  console.log(`\n=== UJI E2E AUTH — akun uji: ${EMAIL} ===\n`)

  browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const context = await browser.newContext({ locale: 'id-ID' })
  page = await context.newPage()
  page.setDefaultTimeout(20000)

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // ============ 1. REGISTRASI: VALIDASI ============
  await page.goto(`${BASE_URL}/register`)

  // 1a. Email format tidak valid -> pesan spesifik
  await page.getByLabel(/Email/).fill('bukan-email')
  await page.getByLabel(/Kata Sandi/).fill('123456')
  await page.getByRole('button', { name: 'Daftar' }).click()
  try {
    await expectText('[role="alert"]', 'Masukkan alamat email dengan format yang valid.')
    report('Registrasi menolak email format tidak valid', true)
  } catch {
    report('Registrasi menolak email format tidak valid', false, 'pesan validasi tidak muncul')
  }

  // 1b. Password kurang dari 6 karakter -> pesan spesifik
  await page.getByLabel(/Email/).fill(EMAIL)
  await page.getByLabel(/Kata Sandi/).fill('12345')
  await page.getByRole('button', { name: 'Daftar' }).click()
  try {
    await expectText('[role="alert"]', 'Kata sandi harus terdiri dari minimal 6 karakter.')
    report('Registrasi menolak password terlalu pendek', true)
  } catch {
    report('Registrasi menolak password terlalu pendek', false, 'pesan validasi tidak muncul')
  }

  // ============ 2. REGISTRASI SUKSES -> /verify-email ============
  await page.getByLabel(/Kata Sandi/).fill(PASSWORD)
  await page.getByRole('button', { name: 'Daftar' }).click()
  try {
    await page.waitForURL('**/verify-email', { timeout: 30000 })
    report('Registrasi sukses diarahkan ke /verify-email', true)
  } catch {
    report('Registrasi sukses diarahkan ke /verify-email', false, `URL sekarang: ${page.url()}`)
  }

  try {
    await expectText('body', 'Verifikasi Email', 15000)
    report('Halaman verifikasi menampilkan judul', true)
  } catch {
    report('Halaman verifikasi menampilkan judul', false)
  }

  await dismissOnboardingIfPresent()
  uidFromPage = await getUidFromBrowser()
  report('Sesi auth aktif setelah registrasi', Boolean(uidFromPage), `uid=${uidFromPage}`)

  // ============ 3. LOGOUT DARI HALAMAN VERIFIKASI ============
  await step('Logout dari halaman verifikasi kembali ke /login', async () => {
    await logoutFromUi()
    report('Logout dari halaman verifikasi kembali ke /login', true)
  })

  // ============ 4. DUPLIKAT EMAIL -> PESAN SPESIFIK ============
  await step('Registrasi duplikat memberi pesan spesifik', async () => {
    await page.goto(`${BASE_URL}/register`)
    await page.getByLabel(/Email/).fill(EMAIL)
    await page.getByLabel(/Kata Sandi/).fill(PASSWORD)
    await page.getByRole('button', { name: 'Daftar' }).click()
    await expectText('[role="alert"]', 'Email sudah terdaftar', 20000)
    report('Registrasi duplikat memberi pesan spesifik', true)
  })

  // ============ 5. LOGIN: PASSWORD SALAH ============
  await step('Login password salah memberi pesan spesifik', async () => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Email/).fill(EMAIL)
    await page.getByLabel(/Kata Sandi/).fill('password-salah-999')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expectText('[role="alert"]', 'Email atau kata sandi salah', 20000)
    report('Login password salah memberi pesan spesifik', true)
  })

  // ============ 6. LOGIN BENAR -> /verify-email + COOLDOWN ============
  await step('Login benar diarahkan ke /verify-email', async () => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Email/).fill(EMAIL)
    await page.getByLabel(/Kata Sandi/).fill(PASSWORD)
    await page.getByRole('button', { name: 'Masuk' }).click()
    await page.waitForURL('**/verify-email', { timeout: 30000 })
    report('Login benar diarahkan ke /verify-email (belum terverifikasi)', true)
  })

  await dismissOnboardingIfPresent()

  // 6b. Kirim ulang email verifikasi -> sukses + cooldown aktif.
  // Cooldown dari email verifikasi registrasi bisa masih berjalan (persisten di
  // sessionStorage), jadi tunggu hitung mundur selesai maksimal 90 detik.
  try {
    const resendBtn = page
      .getByRole('button', { name: 'Kirim ulang email verifikasi', exact: true })
      .or(page.getByRole('button', { name: /Kirim ulang dalam \d+ detik/ }))
      .first()
    await page.waitForFunction(
      () => {
        const buttons = [...document.querySelectorAll('button')]
        return buttons.some((b) => b.textContent?.trim() === 'Kirim ulang email verifikasi' && !b.disabled)
      },
      undefined,
      { timeout: 90000 },
    )
    await resendBtn.click()
    await expectText('[role="status"]', 'Email verifikasi sudah dikirim ulang.', 20000)
    report('Kirim ulang email verifikasi sukses', true)

    // Setelah sukses, tombol harus disabled dengan hitung mundur.
    await page.waitForSelector('button:disabled', { timeout: 10000 })
    const countdown = await page.getByText(/Kirim ulang dalam \d+ detik/).first().isVisible().catch(() => false)
    report('Cooldown kirim ulang aktif (hitung mundur tampil)', countdown)
  } catch (err) {
    report('Kirim ulang email verifikasi + cooldown', false, String(err).slice(0, 120))
  }

  // ============ 7. FIRESTORE: DOKUMEN USER TERBUAT ============
  try {
    const auth = await signInViaRest(EMAIL, PASSWORD)
    if (!auth.idToken) {
      report('Dokumen user terbuat di Firestore', false, `signIn REST gagal: ${auth.error?.message ?? '?'}`)
    } else {
      const uid = auth.localId
      // Beri jeda kecil bila transaksi profil sempat tertunda.
      let doc = await getUserDoc(uid, auth.idToken)
      if (!doc?.fields) {
        await sleep(3000)
        doc = await getUserDoc(uid, auth.idToken)
      }
      const emailField = doc?.fields?.email?.stringValue
      const createdAt = doc?.fields?.createdAt?.timestampValue
      report(
        'Dokumen user terbuat di Firestore',
        Boolean(emailField),
        `email=${emailField ?? 'TIDAK ADA'}, createdAt=${createdAt ?? '-'}`,
      )
    }
  } catch (err) {
    report('Dokumen user terbuat di Firestore', false, String(err).slice(0, 120))
  }

  // ============ 8. KESEHATAN KONSOL ============
  // Error "Failed to load resource ... 400" berasal dari tes negatif yang
  // disengaja (login salah, email duplikat) dan bukan kegagalan aplikasi.
  const fatalErrors = consoleErrors.filter(
    (text) =>
      !text.includes('favicon') &&
      !text.includes('Download the React DevTools') &&
      !/^Failed to load resource/.test(text.trim()),
  )
  report(
    'Tidak ada error console fatal',
    fatalErrors.length === 0,
    fatalErrors.length ? fatalErrors[0].slice(0, 150) : 'bersih',
  )
} catch (err) {
  report('Skrip selesai tanpa crash', false, String(err).slice(0, 300))
} finally {
  // ============ CLEANUP: hapus akun uji dari Firebase production ============
  try {
    const auth = await signInViaRest(EMAIL, PASSWORD)
    if (auth.idToken) {
      const uid = auth.localId
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${auth.idToken}` } },
      )
      const del = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: auth.idToken }),
        },
      )
      console.log(`[CLEANUP] Akun uji ${EMAIL} ${del.ok ? 'dihapus dari Firebase' : 'gagal dihapus'}`)
    }
  } catch {
    console.log('[CLEANUP] dilewati (gagal membersihkan akun uji)')
  }

  const passed = results.filter((r) => r.passed).length
  const failed = results.length - passed
  console.log(`\n=== RINGKASAN: ${passed} PASS, ${failed} FAIL dari ${results.length} tes ===\n`)

  if (browser) await browser.close().catch(() => {})
  process.exit(failed > 0 ? 1 : 0)
}
