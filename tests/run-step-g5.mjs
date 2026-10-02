// STEP G.5 orchestrator — the ONLY runner needed for browser verification.
// Spawns Vite dev server, waits for readiness (IPv4 AND IPv6 — Vite 8 on this
// machine binds ::1 only), runs the existing verify script, and ALWAYS
// terminates the Vite process tree in a finally block. No new dependencies.
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const PORT = 5176
const OVERALL_TIMEOUT_MS = 240_000
const READY_TIMEOUT_MS = 60_000
const CANDIDATE_URLS = [`http://127.0.0.1:${PORT}`, `http://[::1]:${PORT}`]

async function probe(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return res.ok ? res.status : null
  } catch {
    return null
  }
}

// Probe both stacks: a Vite bound to ::1 answers IPv6 but not 127.0.0.1.
async function findListeningUrl(urls = CANDIDATE_URLS) {
  for (const url of urls) {
    if (await probe(url)) return url
  }
  return null
}

const preUsed = await findListeningUrl()
if (preUsed) {
  console.error(`Port ${PORT} already in use via ${preUsed} — aborting (find PID via: netstat -ano | grep ${PORT})`)
  process.exit(2)
}

const vite = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', '--port', String(PORT), '--strictPort'],
  // shell:true is REQUIRED on Windows for npx.cmd (Node >=18.20 rejects .cmd
  // spawns with EINVAL); pid then belongs to cmd.exe and taskkill /T still
  // takes down the whole child tree.
  { cwd: process.cwd(), stdio: 'inherit', shell: process.platform === 'win32', windowsHide: true },
)

let viteExited = false
let viteExitCode = null
let viteError = null
vite.on('exit', (code) => { viteExited = true; viteExitCode = code })
vite.on('error', (error) => { viteExited = true; viteError = error })

function killProcess(child) {
  if (child.pid == null || child.exitCode !== null) return
  try {
    if (process.platform === 'win32') {
      // /T kills the whole tree (cmd.exe -> node -> vite), /F forces.
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true })
    } else {
      child.kill('SIGTERM')
    }
  } catch { /* best effort */ }
}

function killVite() { if (!viteExited) killProcess(vite) }

let preview
let timedOut = false
const overallTimer = setTimeout(() => {
  timedOut = true
  killVite()
  if (preview) killProcess(preview)
  console.error('OVERALL TIMEOUT — Vite killed, verification aborted')
  process.exitCode = 1
}, OVERALL_TIMEOUT_MS)

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (viteExited) throw new Error(viteError?.message ?? `Vite exited early (code=${viteExitCode})`)
    const url = await findListeningUrl()
    if (url) return url
    await delay(500)
  }
  throw new Error(`Dev server not ready within ${timeoutMs}ms on ${CANDIDATE_URLS.join(' or ')}`)
}

try {
  const baseUrl = await waitForServer(READY_TIMEOUT_MS)
  console.log(`Vite ready on ${baseUrl} (pid ${vite.pid}) — starting browser verification`)
  // The verify script reads SMOKE_BASE_URL at import time.
  process.env.SMOKE_BASE_URL = baseUrl
  if (process.argv.includes('--existing-smokes')) {
    process.env.SMOKE_SCREENSHOT_DIR = 'docs/screenshots/step-g5/existing-smokes'
    const previewUrls = ['http://127.0.0.1:4176', 'http://[::1]:4176']
    if (await findListeningUrl(previewUrls)) throw new Error('Preview port 4176 already in use; leaving its owner untouched')
    preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '4176', '--strictPort'], { stdio: 'inherit', windowsHide: true })
    let previewError
    preview.on('error', (error) => { previewError = error })
    const deadline = Date.now() + READY_TIMEOUT_MS
    let previewUrl
    while (!previewUrl && Date.now() < deadline) {
      if (previewError || preview.exitCode !== null) throw new Error(previewError?.message ?? 'Preview exited before readiness')
      const url = await findListeningUrl(previewUrls)
      if (url) previewUrl = url
      else await delay(500)
    }
    if (!previewUrl) throw new Error('Preview readiness timed out')
    process.env.SMOKE_PREVIEW_URL = previewUrl
    await import('./browser-learning-smoke.mjs')
    await import('./browser-local-access-smoke.mjs')
  } else {
    await import('./step-g5-browser-verify.mjs')
  }
} catch (error) {
  process.exitCode = 1
  console.error(`VERIFICATION ERROR: ${error?.message ?? error}`)
} finally {
  clearTimeout(overallTimer)
  killVite()
  if (preview) killProcess(preview)
  // Give the tree-kill a moment, then double-check the port is free.
  await delay(1500)
  const postUsed = await findListeningUrl()
  console.log(postUsed == null
    ? 'Vite stopped cleanly; port released.'
    : `WARNING: port ${PORT} still responding via ${postUsed} — stray process may remain (netstat -ano | grep ${PORT})`)
  if (postUsed) process.exitCode = 1
  if (preview) {
    const previewStillRunning = await findListeningUrl(['http://127.0.0.1:4176', 'http://[::1]:4176'])
    console.log(previewStillRunning ? 'WARNING: preview port 4176 still responds.' : 'Preview stopped cleanly; port released.')
    if (previewStillRunning) process.exitCode = 1
  }
  if (timedOut) console.error('Result: TIMED OUT — treat verification as NOT TESTABLE this run.')
}
