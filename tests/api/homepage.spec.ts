import { test, expect } from './fixtures/fixtures.js'
import { listAssets } from '@api/assets.js'
import { listProducts, getProductFilters, seedSale } from '@api/products.js'
import { registerUser } from '@api/auth.js'
import { qaseId } from '@support/qase.js'
import { buildProductPayload } from '@data/products.js'

const TIMESTAMP_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

test.describe('API > Homepage', () => {
  test(
    'GET /api/assets returns every uploaded asset',
    { ...qaseId(17), tag: '@regression' },
    async ({ request }) => {
      // Step 1: request the assets list.
      const res = await listAssets(request)
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
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
    }
  )

  test(
    'GET /api/products with no query params returns the newest products up to the default limit',
    { ...qaseId(18), tag: '@smoke' },
    async ({ request, seedProduct }) => {
      const { token } = await registerUser(request)
      await seedProduct(token, buildProductPayload())

      // Step 1: request products with no query parameters at all.
      const res = await listProducts(request)
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeLessThanOrEqual(4)
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
    { ...qaseId(19), tag: '@regression' },
    async ({ request, seedProduct }) => {
      const { token } = await registerUser(request)
      const bestSeller = await seedProduct(token, buildProductPayload())
      const worstSeller = await seedProduct(token, buildProductPayload())
      await seedSale(request, token, bestSeller.id, 100)
      await seedSale(request, token, worstSeller.id, 1)

      // Step 1: request products ranked by best_selling. A high limit keeps
      // both seeded products in view regardless of how large the rest of the
      // catalog is.
      const res = await listProducts(request, { sort: 'best_selling', limit: 1000 })
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      for (const product of body) {
        expect(typeof product.total_sold).toBe('number')
      }

      // Step 2: total_sold is non-increasing from one product to the next,
      // and the two seeded products land in the order their own sale
      // volumes dictate.
      for (let i = 0; i < body.length - 1; i++) {
        expect(body[i].total_sold).toBeGreaterThanOrEqual(body[i + 1].total_sold)
      }
      const bestSellerIndex = body.findIndex((p: { id: string }) => p.id === bestSeller.id)
      const worstSellerIndex = body.findIndex((p: { id: string }) => p.id === worstSeller.id)
      expect(bestSellerIndex).toBeGreaterThanOrEqual(0)
      expect(worstSellerIndex).toBeGreaterThanOrEqual(0)
      expect(bestSellerIndex).toBeLessThan(worstSellerIndex)
    }
  )

  test(
    'GET /api/products?sort= with an invalid value is rejected',
    { ...qaseId(20), tag: '@regression' },
    async ({ request }) => {
      // Step 1: request products with an unsupported sort value.
      const res = await listProducts(request, { sort: 'invalid' })
      expect(res.status()).toBe(400)

      const body = await res.json()
      expect(body.param).toBe('sort')
      expect(typeof body.error).toBe('string')
      expect(body.error.length).toBeGreaterThan(0)
      expect(body.error).toMatch(/sort/i)
      expect(body.error).toMatch(/newest/i)
      expect(body.error).toMatch(/best_selling/i)
    }
  )

  test(
    'GET /api/products?limit= with a non-numeric or non-positive value is rejected',
    { ...qaseId(21), tag: '@regression' },
    async ({ request }) => {
      // Step 1: request products with a non-numeric limit.
      const nonNumeric = await listProducts(request, { limit: 'abc' })
      expect(nonNumeric.status()).toBe(400)
      const nonNumericBody = await nonNumeric.json()
      expect(nonNumericBody.param).toBe('limit')
      expect(typeof nonNumericBody.error).toBe('string')
      expect(nonNumericBody.error.length).toBeGreaterThan(0)
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
    { ...qaseId(22), tag: '@regression' },
    async ({ request, seedProduct }) => {
      const { token } = await registerUser(request)
      const seeded = await seedProduct(
        token,
        buildProductPayload({ sizes: [{ size: 'L', stock: 5 }] })
      )

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
      expect(body.brand.some((f: { value: string }) => f.value === seeded.brand)).toBe(true)
      expect(body.gender.some((f: { value: string }) => f.value === seeded.gender)).toBe(true)
      expect(body.category.some((f: { value: string }) => f.value === seeded.category)).toBe(true)
      expect(body.subcategory.some((f: { value: string }) => f.value === seeded.subcategory)).toBe(
        true
      )
      expect(body.size.some((f: { value: string }) => f.value === 'L')).toBe(true)
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
    { ...qaseId(23), tag: '@regression' },
    async ({ request, seedProduct }) => {
      const { token } = await registerUser(request)
      const seeded = await seedProduct(token, buildProductPayload({ brand: 'SUKO' }))

      // Step 1: request products filtered to the SUKO brand. A high limit
      // keeps the seeded product in view regardless of catalog size.
      const res = await listProducts(request, { brand: 'SUKO', limit: 1000 })
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThan(0)
      expect(body.some((p: { id: string }) => p.id === seeded.id)).toBe(true)
      for (const product of body) {
        expect(product.brand).toBe('SUKO')
      }
    }
  )

  test(
    'GET /api/products?category= filters results, and combines with other filters as AND',
    { ...qaseId(24), tag: '@regression' },
    async ({ request, seedProduct }) => {
      const { token } = await registerUser(request)
      const wanitaOuterwear = await seedProduct(
        token,
        buildProductPayload({ category: 'Outerwear', gender: 'Wanita' })
      )
      const priaOuterwear = await seedProduct(
        token,
        buildProductPayload({ category: 'Outerwear', gender: 'Pria' })
      )

      // Step 1: request products filtered to the Outerwear category. A high
      // limit keeps both seeded products in view regardless of catalog size.
      const categoryOnly = await listProducts(request, { category: 'Outerwear', limit: 1000 })
      expect(categoryOnly.status()).toBe(200)
      const categoryOnlyBody = await categoryOnly.json()
      expect(Array.isArray(categoryOnlyBody)).toBe(true)
      expect(categoryOnlyBody.length).toBeGreaterThan(0)
      for (const product of categoryOnlyBody) {
        expect(product.category).toBe('Outerwear')
      }
      const categoryOnlyIds = categoryOnlyBody.map((p: { id: string }) => p.id)
      expect(categoryOnlyIds).toContain(wanitaOuterwear.id)
      expect(categoryOnlyIds).toContain(priaOuterwear.id)

      // Step 2: combine with gender=Wanita; both filters apply together (AND),
      // narrowing the result to no more than the category-only count and
      // excluding the seeded Pria product.
      const combined = await listProducts(request, {
        category: 'Outerwear',
        gender: 'Wanita',
        limit: 1000,
      })
      expect(combined.status()).toBe(200)
      const combinedBody = await combined.json()
      expect(Array.isArray(combinedBody)).toBe(true)
      for (const product of combinedBody) {
        expect(product.category).toBe('Outerwear')
        expect(product.gender).toBe('Wanita')
      }
      const combinedIds = combinedBody.map((p: { id: string }) => p.id)
      expect(combinedIds).toContain(wanitaOuterwear.id)
      expect(combinedIds).not.toContain(priaOuterwear.id)
      expect(combinedBody.length).toBeLessThanOrEqual(categoryOnlyBody.length)
    }
  )

  test(
    'GET /api/products?category= for a category with no matching products returns an empty array, not an error',
    { ...qaseId(25), tag: '@regression' },
    async ({ request }) => {
      // Step 1: request products for a category that doesn't exist.
      const res = await listProducts(request, { category: 'BogusCategoryXYZ' })
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(body).toEqual([])
    }
  )
})
