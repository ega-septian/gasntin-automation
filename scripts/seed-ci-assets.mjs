// Ensures at least one asset exists before the API test suite runs.
//
// tests/api/homepage.spec.ts's assets case relies on the environment already
// having at least one uploaded asset (e.g. hero_banner) — true for a normal
// dev DB (uploaded manually once), but NOT true for a genuinely fresh
// database like CI's, which only has whatever the migrations themselves seed
// (no migration inserts into `assets`). This script closes that gap without
// touching the test or global-setup.ts.
//
// Safe to run anywhere: it's a no-op if any asset already exists, so running
// it against a real dev DB won't clobber anything.
//
// Plain JS (not TS) on purpose — no tsx/ts-node in this project's
// devDependencies, and Node 20+'s built-in fetch/FormData/Blob are enough
// for these two calls, so there's nothing to gain from pulling in the TS
// toolchain just for this script.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8081'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const existing = await fetch(`${API_BASE_URL}/api/assets`).then((r) => r.json())
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`Assets already present (${existing.length}) — nothing to seed.`)
    return
  }

  // Register a throwaway user just to get a Bearer token — the asset
  // endpoints only require *a* valid token, not a specific account.
  const email = `ci-seed-${Date.now()}@shopco.test`
  const registerRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123' }),
  })
  if (!registerRes.ok) {
    throw new Error(`Seeding user failed: ${registerRes.status} — ${await registerRes.text()}`)
  }
  const { token } = await registerRes.json()

  const imagePath = path.join(__dirname, '../fixtures/test-asset.png')
  const form = new FormData()
  form.set('key', 'hero_banner')
  form.set('image', new Blob([fs.readFileSync(imagePath)], { type: 'image/png' }), 'test-asset.png')

  const uploadRes = await fetch(`${API_BASE_URL}/api/assets/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!uploadRes.ok) {
    throw new Error(`Seeding asset failed: ${uploadRes.status} — ${await uploadRes.text()}`)
  }
  console.log('Seeded 1 CI asset (hero_banner).')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
