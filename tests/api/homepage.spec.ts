import { test, expect } from '@playwright/test'
import { listAssets } from '../../api/assets.js'
import { listProducts, getProductFilters } from '../../api/products.js'
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

  test(
    'GET /api/products?sort=best_selling orders products by total units sold, descending',
    qaseId(19),
    async ({ request }) => {
      // Step 1: request products ranked by best_selling.
      const res = await listProducts(request, { sort: 'best_selling', limit: 24 })
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      // Relies on the environment already having at least one recorded sale.
      for (const product of body) {
        expect(typeof product.total_sold).toBe('number')
      }

      // Step 2: total_sold is non-increasing from one product to the next.
      for (let i = 0; i < body.length - 1; i++) {
        expect(body[i].total_sold).toBeGreaterThanOrEqual(body[i + 1].total_sold)
      }
    }
  )

  test(
    'GET /api/products?sort= with an invalid value is rejected',
    qaseId(20),
    async ({ request }) => {
      // Step 1: request products with an unsupported sort value.
      const res = await listProducts(request, { sort: 'invalid' })
      expect(res.status()).toBe(400)

      const body = await res.json()
      expect(body.param).toBe('sort')
      expect(typeof body.error).toBe('string')
      expect(body.error.length).toBeGreaterThan(0)
      // Content check only — wording may evolve, but it must name the
      // parameter and list both accepted values.
      expect(body.error).toMatch(/sort/i)
      expect(body.error).toMatch(/newest/i)
      expect(body.error).toMatch(/best_selling/i)
    }
  )

  test(
    'GET /api/products?limit= with a non-numeric or non-positive value is rejected',
    qaseId(21),
    async ({ request }) => {
      // Step 1: request products with a non-numeric limit.
      const nonNumeric = await listProducts(request, { limit: 'abc' })
      expect(nonNumeric.status()).toBe(400)
      const nonNumericBody = await nonNumeric.json()
      expect(nonNumericBody.param).toBe('limit')
      expect(typeof nonNumericBody.error).toBe('string')
      expect(nonNumericBody.error.length).toBeGreaterThan(0)
      // Content check only — wording may evolve, but it must name the
      // parameter and communicate that a positive integer is required.
      expect(nonNumericBody.error).toMatch(/limit/i)
      expect(nonNumericBody.error).toMatch(/bilangan bulat positif|positive integer/i)

      // Step 2: request products with a negative limit; same content
      // requirements as step 1 (wording need not be identical).
      const negative = await listProducts(request, { limit: -1 })
      expect(negative.status()).toBe(400)
      const negativeBody = await negative.json()
      expect(negativeBody.param).toBe('limit')
      expect(typeof negativeBody.error).toBe('string')
      expect(negativeBody.error.length).toBeGreaterThan(0)
      expect(negativeBody.error).toMatch(/limit/i)
      expect(negativeBody.error).toMatch(/bilangan bulat positif|positive integer/i)
    }
  )

  test(
    'GET /api/products/filters returns brand, gender, category, subcategory, and size facets with live counts',
    qaseId(22),
    async ({ request }) => {
      // Step 1: request the filter facets.
      const res = await getProductFilters(request)
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(body).toMatchObject({
        brand: expect.any(Array),
        gender: expect.any(Array),
        category: expect.any(Array),
        subcategory: expect.any(Array),
        size: expect.any(Array),
      })
      // Relies on the environment already having at least one product with a
      // brand, gender, category, subcategory, and size.
      for (const facet of ['brand', 'gender', 'category', 'subcategory', 'size'] as const) {
        expect(body[facet].length).toBeGreaterThan(0)
      }

      // Step 2: each entry has a value and a positive live count.
      for (const facet of ['brand', 'gender', 'category', 'subcategory', 'size'] as const) {
        const entry = body[facet][0]
        expect(entry).toMatchObject({ value: expect.any(String), count: expect.any(Number) })
        expect(entry.count).toBeGreaterThan(0)
      }
    }
  )

  test(
    'GET /api/products?brand= filters results to only that brand',
    qaseId(23),
    async ({ request }) => {
      // Step 1: request products filtered to the SUKO brand.
      const res = await listProducts(request, { brand: 'SUKO', limit: 24 })
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      // Relies on the environment already having at least one SUKO product.
      expect(body.length).toBeGreaterThan(0)
      for (const product of body) {
        expect(product.brand).toBe('SUKO')
      }
    }
  )

  test(
    'GET /api/products?category= filters results, and combines with other filters as AND',
    qaseId(24),
    async ({ request }) => {
      // Step 1: request products filtered to the Outerwear category.
      const categoryOnly = await listProducts(request, { category: 'Outerwear', limit: 24 })
      expect(categoryOnly.status()).toBe(200)
      const categoryOnlyBody = await categoryOnly.json()
      expect(Array.isArray(categoryOnlyBody)).toBe(true)
      // Relies on the environment already having Outerwear products for more
      // than one gender.
      expect(categoryOnlyBody.length).toBeGreaterThan(0)
      for (const product of categoryOnlyBody) {
        expect(product.category).toBe('Outerwear')
      }

      // Step 2: combine with gender=Wanita; both filters apply together (AND),
      // narrowing the result to no more than the category-only count.
      const combined = await listProducts(request, { category: 'Outerwear', gender: 'Wanita', limit: 24 })
      expect(combined.status()).toBe(200)
      const combinedBody = await combined.json()
      expect(Array.isArray(combinedBody)).toBe(true)
      for (const product of combinedBody) {
        expect(product.category).toBe('Outerwear')
        expect(product.gender).toBe('Wanita')
      }
      expect(combinedBody.length).toBeLessThanOrEqual(categoryOnlyBody.length)
    }
  )

  test(
    'GET /api/products?category= for a category with no matching products returns an empty array, not an error',
    qaseId(25),
    async ({ request }) => {
      // Step 1: request products for a category that doesn't exist.
      const res = await listProducts(request, { category: 'BogusCategoryXYZ' })
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(body).toEqual([])
    }
  )
})
