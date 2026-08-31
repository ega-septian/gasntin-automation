import { test, expect } from '@playwright/test'
import { registerUser, loginUser, login, me } from '../../api/auth.js'
import { buildLoginPayload, uniqueEmail } from '../../data/users.js'
import { decodeJwt, withTamperedSignature, asAlgNoneToken } from '../../support/jwt.js'
import { qaseId } from '../../support/qase.js'

const GENERIC_AUTH_ERROR = 'email atau password salah'

test.describe('API > Login', () => {
  test('Successful login with valid email & password', qaseId(2), async ({ request }) => {
    const seeded = await registerUser(request)

    // Step 1: log in with the seeded user's valid credentials.
    const res = await login(
      request,
      buildLoginPayload({ email: seeded.email, password: seeded.password })
    )
    expect(res.status()).toBe(200)

    // Step 2: response includes a token and user object, never the password.
    const body = await res.json()
    expect(body.token).toEqual(expect.any(String))
    expect(body.token.length).toBeGreaterThan(0)
    expect(body.user).toMatchObject({ id: seeded.user.id, email: seeded.email })
    expect(body.user).not.toHaveProperty('password')
    expect(body.user).not.toHaveProperty('password_hash')
    expect(await res.text()).not.toContain(seeded.password)

    // Step 3: the token is usable to call the protected /me endpoint.
    const meRes = await me(request, body.token)
    expect(meRes.status()).toBe(200)
    expect(await meRes.json()).toMatchObject({ id: seeded.user.id, email: seeded.email })
  })

  test('Login fails - wrong password (registered email)', qaseId(3), async ({ request }) => {
    const seeded = await registerUser(request)

    // Step 1: log in with a registered email but the wrong password.
    const res = await login(
      request,
      buildLoginPayload({ email: seeded.email, password: 'WrongPassword123' })
    )
    expect(res.status()).toBe(401)

    // Step 2: response is the generic auth-error message, no token.
    const body = await res.json()
    expect(body).toEqual({ error: GENERIC_AUTH_ERROR })
    expect(body).not.toHaveProperty('token')

    // Step 3: no session was created — a protected endpoint still rejects the caller.
    const meRes = await me(request)
    expect(meRes.status()).toBe(401)
  })

  test(
    'Login fails - unregistered email, message identical to wrong-password case (anti user-enumeration)',
    qaseId(4),
    async ({ request }) => {
      const seeded = await registerUser(request)

      const wrongPasswordRes = await login(
        request,
        buildLoginPayload({ email: seeded.email, password: 'WrongPassword123' })
      )

      // Step 1: log in with an email that was never registered.
      const unknownEmailRes = await login(
        request,
        buildLoginPayload({ email: uniqueEmail('nobody') })
      )
      expect(unknownEmailRes.status()).toBe(401)
      expect(unknownEmailRes.status()).toBe(wrongPasswordRes.status())

      // Step 2: response is identical to the wrong-password case — no enumeration signal.
      expect(await unknownEmailRes.text()).toBe(await wrongPasswordRes.text())
      expect(await unknownEmailRes.json()).toEqual({ error: GENERIC_AUTH_ERROR })
    }
  )

  test('Login fails - empty email field', qaseId(5), async ({ request }) => {
    // Step 1: log in with an empty email.
    const res = await login(request, buildLoginPayload({ email: '' }))
    expect(res.status()).toBe(400)

    // Step 2: no token is returned in the response.
    expect(await res.json()).not.toHaveProperty('token')
  })

  test('Login fails - empty password field', qaseId(6), async ({ request }) => {
    // Step 1: log in with an empty password.
    const res = await login(request, buildLoginPayload({ password: '' }))
    expect(res.status()).toBe(400)
    expect(await res.json()).not.toHaveProperty('token')
  })

  test('Login fails - invalid email format', qaseId(7), async ({ request }) => {
    // Step 1: log in with a malformed email address.
    const res = await login(request, buildLoginPayload({ email: 'not-a-valid-email' }))
    expect(res.status()).toBe(400)
    expect(await res.json()).not.toHaveProperty('token')
  })

  test(
    'Verify the JWT token issued at login (HS256 algorithm, 24-hour expiry)',
    qaseId(8),
    async ({ request }) => {
      const seeded = await registerUser(request)

      // Step 1: log in and capture the issued token.
      const { token } = await loginUser(request, seeded)
      expect(token).toEqual(expect.any(String))

      // Step 2: decode the JWT header.
      const { header, payload } = decodeJwt(token)
      expect(header.alg).toBe('HS256')

      // Step 3: decode the JWT payload.
      expect(payload.sub).toBe(seeded.user.id)
      expect(payload.email).toBe(seeded.email)
      expect(payload.iat).toEqual(expect.any(Number))
      expect(payload.exp).toEqual(expect.any(Number))

      // Step 4: check the token's lifetime is 24 hours.
      expect(payload.exp - payload.iat).toBe(24 * 60 * 60)

      const validRes = await me(request, token)
      expect(validRes.status()).toBe(200)

      // Step 5: attempt access with a tampered token (bad signature or alg:none).
      for (const [label, forged] of [
        ['a corrupted signature', withTamperedSignature(token)],
        ['an "alg: none" downgrade', asAlgNoneToken(token)],
      ]) {
        const forgedRes = await me(request, forged)
        expect(forgedRes.status(), `token with ${label} must be rejected`).toBe(401)
      }
    }
  )
})
