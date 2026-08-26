import { defineConfig, devices, type ReporterDescription } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve .env relative to this file, not the process's cwd — otherwise tests
// launched from a different cwd (e.g. an IDE test runner using the repo root)
// silently load no env vars and DB-dependent cases get skipped unexpectedly.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8081'
export const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:5173'

const reporters: ReporterDescription[] = [['list'], ['html', { open: 'never' }]]

// Only uploads to Qase when a token is present, so a plain local `npm test`
// never tries (and fails) to reach the Qase API.
if (process.env.QASE_API_TOKEN) {
  reporters.push([
    'playwright-qase-reporter',
    {
      mode: 'testops',
      testops: {
        api: { token: process.env.QASE_API_TOKEN },
        project: 'GASNTIN',
        run: { complete: true },
      },
    },
  ])
  // Marks each passed case's Qase automation status as automated. Separate
  // from the reporter above, which only syncs run results, not case metadata.
  reporters.push(['./support/qase-automation-reporter.ts'])
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: reporters,
  globalSetup: './setup/global-setup.ts',

  use: {
    headless: true,
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: API_BASE_URL,
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'web',
      testDir: './tests/web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_BASE_URL,
        trace: 'retain-on-failure',
      },
    },
  ],
})
