import { request } from '@playwright/test'
import { API_BASE_URL, WEB_BASE_URL } from '../playwright.config.js'

/**
 * Fail fast with a readable message when a precondition is missing, instead of
 * letting tests fail mid-run with an opaque error or silently report as
 * "skipped" — automation must never use test.skip() for a missing precondition.
 */
export default async function globalSetup(): Promise<void> {
  await checkBackendReachable()
  await checkDatabaseReachable()
  await checkFrontendReachable()
}

async function checkBackendReachable(): Promise<void> {
  const ctx = await request.newContext()

  try {
    const res = await ctx.get(`${API_BASE_URL}/health`, { timeout: 5000 })
    if (!res.ok()) {
      throw new Error(`GET /health returned ${res.status()}`)
    }
  } catch (err) {
    throw new Error(
      `Backend is not reachable at ${API_BASE_URL} (${(err as Error).message}).\n` +
        `Start it first:\n` +
        `  cd backend && go run ./cmd/api\n` +
        `It needs PostgreSQL running and DATABASE_URL configured in backend/.env.`
    )
  } finally {
    await ctx.dispose()
  }
}

async function checkFrontendReachable(): Promise<void> {
  const ctx = await request.newContext()

  try {
    const res = await ctx.get(WEB_BASE_URL, { timeout: 5000 })
    if (!res.ok()) {
      throw new Error(`GET ${WEB_BASE_URL} returned ${res.status()}`)
    }
  } catch (err) {
    throw new Error(
      `Frontend is not reachable at ${WEB_BASE_URL} (${(err as Error).message}).\n` +
        `Start it first:\n` +
        `  cd frontend && npm run dev\n` +
        `Needed by the WEB suite.`
    )
  } finally {
    await ctx.dispose()
  }
}

async function checkDatabaseReachable(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      `DATABASE_URL is not set.\n` +
        `The registration suite verifies the stored password is a bcrypt hash by\n` +
        `querying the database directly, so it needs the same PostgreSQL instance\n` +
        `the backend uses. Set it in automation/.env, e.g.:\n` +
        `  DATABASE_URL=postgres://teststore:teststore@localhost:5432/teststore?sslmode=disable`
    )
  }

  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()
    await client.query('SELECT 1')
  } catch (err) {
    throw new Error(
      `DATABASE_URL is set but the database is not reachable: ${(err as Error).message}`
    )
  } finally {
    await client.end()
  }
}
