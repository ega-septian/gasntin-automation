import { randomUUID } from 'node:crypto'

export const VALID_PASSWORD = 'Password123'

export interface RegisterPayload {
  email: string
  password: string
}

export type LoginPayload = RegisterPayload

/**
 * Every test seeds its own user so the suite can run fully parallel
 * and stays independent of whatever data already exists.
 */
export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}_${randomUUID()}@example.com`
}

/**
 * Valid-shaped register payload with sane defaults. Override only the
 * field(s) a test actually cares about, so specs stay readable as the
 * request body grows instead of hardcoding every field at every call site.
 */
export function buildRegisterPayload(overrides: Partial<RegisterPayload> = {}): RegisterPayload {
  return {
    email: uniqueEmail(),
    password: VALID_PASSWORD,
    ...overrides,
  }
}

/** Same idea as buildRegisterPayload, for the login request body. */
export function buildLoginPayload(overrides: Partial<LoginPayload> = {}): LoginPayload {
  return {
    email: uniqueEmail(),
    password: VALID_PASSWORD,
    ...overrides,
  }
}
