import type { APIRequestContext, APIResponse } from '@playwright/test'
import { API_BASE_URL } from '../playwright.config.js'
import {
  uniqueEmail,
  VALID_PASSWORD,
  type RegisterPayload,
  type LoginPayload,
} from '../data/users.js'

export interface AuthUser {
  id: string
  email: string
  created_at: string
}

export interface SeededUser {
  email: string
  password: string
  token: string
  user: AuthUser
}

export interface LoggedInUser {
  token: string
  user: AuthUser
}

/**
 * Raw actions — one function per endpoint, no assertions inside. Specs call
 * these directly and assert on the response themselves when the endpoint is
 * the actual subject under test; never call `request.<method>()` with a raw
 * path in a spec file.
 *
 * URLs are built from API_BASE_URL explicitly rather than relying on the
 * caller's configured baseURL — this file is used from both the `api` project
 * (baseURL already the backend) and the `web` project (baseURL is the
 * frontend), so a relative path would silently hit the wrong host from WEB tests.
 */

export function register(
  request: APIRequestContext,
  payload: RegisterPayload
): Promise<APIResponse> {
  return request.post(`${API_BASE_URL}/api/auth/register`, { data: payload })
}

export function login(request: APIRequestContext, payload: LoginPayload): Promise<APIResponse> {
  return request.post(`${API_BASE_URL}/api/auth/login`, { data: payload })
}

/** Omit `token` to hit /me unauthenticated. */
export function me(request: APIRequestContext, token?: string): Promise<APIResponse> {
  return request.get(
    `${API_BASE_URL}/api/auth/me`,
    token ? { headers: authHeaders(token) } : undefined
  )
}

/**
 * Builds the Authorization header for an authenticated request.
 * The app has no cookie session (token lives in the client's localStorage,
 * not a Set-Cookie), so a header object is the token-based equivalent of
 * Playwright's storageState() reuse pattern for this API.
 */
export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

/**
 * Precondition helpers — seed state and fail fast on setup errors, built on
 * top of the raw actions above rather than duplicating the endpoint paths.
 */

/**
 * Seeds a user through the public register endpoint rather than the database,
 * so the suite needs no DB credentials to run.
 * Returns the credentials plus the token/user the API handed back.
 */
export async function registerUser(
  request: APIRequestContext,
  overrides: Partial<RegisterPayload> = {}
): Promise<SeededUser> {
  const credentials: RegisterPayload = {
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? VALID_PASSWORD,
  }

  const res = await register(request, credentials)

  if (res.status() !== 201) {
    throw new Error(
      `Seeding a user failed: expected 201, got ${res.status()} — ${await res.text()}`
    )
  }

  const body = await res.json()
  return { ...credentials, token: body.token, user: body.user }
}

/**
 * Logs in an already-registered user. Useful as a precondition for tests that
 * need a fresh token without going through registerUser again.
 */
export async function loginUser(
  request: APIRequestContext,
  { email, password }: LoginPayload
): Promise<LoggedInUser> {
  const res = await login(request, { email, password })

  if (res.status() !== 200) {
    throw new Error(`Login failed: expected 200, got ${res.status()} — ${await res.text()}`)
  }

  const body = await res.json()
  return { token: body.token, user: body.user }
}
