import { test, expect } from '@playwright/test'
import { register, me } from '@api/auth.js'
import { buildRegisterPayload, uniqueEmail } from '@data/users.js'
import { findUserByEmail, BCRYPT_PREFIX } from '@support/db.js'
import { qaseId } from '@support/qase.js'

test.describe('API > Registration', () => {
  test(
    'Successful registration with valid email & password (auto-login)',
    { ...qaseId(1), tag: ['@smoke', '@registration'] },
    async ({ request }) => {
      const payload = buildRegisterPayload({ email: uniqueEmail('newuser') })

      // Step 1: register with a unique email and a valid password.
      const res = await register(request, payload)
      expect(res.status()).toBe(201)

      // Step 2: response includes a token and user object, never the password.
      const body = await res.json()
      expect(body.token).toEqual(expect.any(String))
      expect(body.token.length).toBeGreaterThan(0)
      expect(body.user).toMatchObject({ email: payload.email })
      expect(body.user.id).toEqual(expect.any(String))
      expect(body.user.created_at).toBeTruthy()
      expect(body.user).not.toHaveProperty('password')
      expect(body.user).not.toHaveProperty('password_hash')
      expect(await res.text()).not.toContain(payload.password)

      // Step 3: the stored password is a bcrypt hash, not plain text.
      const row = await findUserByEmail(payload.email)
      expect(row, `no users row found for ${payload.email}`).not.toBeNull()
      expect(row!.email).toBe(payload.email)
      expect(row!.password_hash).toMatch(BCRYPT_PREFIX)
      expect(row!.password_hash).not.toBe(payload.password)
      expect(row!.created_at).toBeTruthy()

      // Step 4: the token from step 1 is immediately usable (auto-login).
      const meRes = await me(request, body.token)
      expect(meRes.status()).toBe(200)
      expect(await meRes.json()).toMatchObject({ id: body.user.id, email: payload.email })
    }
  )
})
