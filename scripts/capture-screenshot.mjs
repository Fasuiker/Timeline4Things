import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'docs', 'images')
const outFile = path.join(outDir, 'screenshot.png')
const port = 4173
const basePath = '/Timeline4Things/'

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* retry */
    }
    await wait(500)
  }
  throw new Error(`Server did not start at ${url}`)
}

const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
  cwd: root,
  env: { ...process.env, GITHUB_PAGES: 'true' },
  stdio: 'ignore',
})

try {
  await waitForServer(`http://127.0.0.1:${port}${basePath}`)
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 820 } })
  await page.goto(`http://127.0.0.1:${port}${basePath}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.vis-timeline', { timeout: 15000 })
  await wait(800)
  await page.screenshot({ path: outFile, fullPage: false })
  await browser.close()
  console.log(`Saved ${outFile}`)
} finally {
  preview.kill('SIGTERM')
}
