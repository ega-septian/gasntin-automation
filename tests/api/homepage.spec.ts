import { test, expect } from '@playwright/test'
import { listAssets } from '../../api/assets.js'
import { listProducts } from '../../api/products.js'
import { qaseId } from '../../support/qase.js'

const TIMESTAMP_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

test.describe('API > Homepage', () => {
  test('GET /api/assets returns every uploaded asset', qaseId(17), async ({ request }) => {
    // Step 1: request the assets list.
    const res = await listAssets(request)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    // Relies on the environment already having at least one uploaded asset
    // (e.g. hero_banner) rather than seeding one itself.
    expect(body.length).toBeGreaterThan(0)

    // Step 2: every item carries the expected fields, with timestamps
    // formatted as "yyyy-mm-dd HH:MM:SS".
    for (const asset of body) {
      expect(asset).toMatchObject({
        key: expect.any(String),
        filename: expect.any(String),
        url: expect.any(String),
        content_type: expect.any(String),
        size_bytes: expect.any(Number),
      })
      expect(asset.created_at).toMatch(TIMESTAMP_FORMAT)
      expect(asset.updated_at).toMatch(TIMESTAMP_FORMAT)
    }
  })

  test(
    'GET /api/products with no query params returns the newest products up to the default limit',
    qaseId(18),
    async ({ request }) => {
      // Step 1: request products with no query parameters at all.
      const res = await listProducts(request)
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeLessThanOrEqual(4)
      // Relies on the environment already having more than 4 products.
      expect(body.length).toBeGreaterThan(0)

      // Step 2: products are ordered newest first — created_at's
      // "yyyy-mm-dd HH:MM:SS" format sorts correctly as a plain string.
      for (let i = 0; i < body.length - 1; i++) {
        expect(body[i].created_at >= body[i + 1].created_at).toBe(true)
      }
    }
  )
})
