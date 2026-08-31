import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { getProduct } from '@api/products.js'
import { checkout, buildCheckoutPayload } from '@api/orders.js'
import { qaseId } from '@support/qase.js'
import { buildProductPayload } from '@data/products.js'

test.describe('API > Checkout', () => {
  test(
    "POST /orders rejects checkout when a requested item's quantity exceeds its current available stock",
    { ...qaseId(52), tag: ['@regression', '@checkout'] },
    async ({ request, seedProduct }) => {
      const seeded = await registerUser(request)
      const item = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 3 }] })
      )

      // Step 1: submit checkout for one more unit than is currently available.
      const res = await checkout(
        request,
        seeded.token,
        buildCheckoutPayload({
          items: [{ product_id: item.id, size: 'M', quantity: 4 }],
        })
      )

      // Step 2: the server rejects with 400, naming the product, size, and
      // remaining stock in the response.
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toBe(`stok tidak cukup untuk ${item.name} ukuran M (tersisa 3)`)

      // Step 3: the rejected order must not have decremented stock.
      const afterRes = await getProduct(request, item.id)
      expect(afterRes.status()).toBe(200)
      const after = await afterRes.json()
      const afterSize = after.sizes.find((s: { size: string }) => s.size === 'M')
      expect(afterSize?.stock).toBe(3)
    }
  )

  test(
    "POST /orders succeeds when a requested item's quantity exactly equals its current available stock",
    { ...qaseId(53), tag: ['@smoke', '@checkout'] },
    async ({ request, seedProduct }) => {
      const seeded = await registerUser(request)
      const item = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 3 }] })
      )

      // Step 1: submit checkout for exactly the available stock.
      const res = await checkout(
        request,
        seeded.token,
        buildCheckoutPayload({
          items: [{ product_id: item.id, size: 'M', quantity: 3 }],
        })
      )

      // Step 2: HTTP 201 is returned with the created order, including the
      // submitted item.
      expect(res.status()).toBe(201)
      const body = await res.json()
      expect(body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            product_id: item.id,
            size: 'M',
            quantity: 3,
          }),
        ])
      )

      // Step 3: the product's stock for that size is now decremented to 0.
      const afterRes = await getProduct(request, item.id)
      expect(afterRes.status()).toBe(200)
      const after = await afterRes.json()
      const afterSize = after.sizes.find((s: { size: string }) => s.size === 'M')
      expect(afterSize?.stock).toBe(0)
    }
  )

  test(
    'POST /orders is rejected without a valid Authorization token',
    { ...qaseId(54), tag: ['@regression', '@checkout'] },
    async ({ request }) => {
      // Step 1: submit an otherwise valid checkout body with no Authorization
      // header at all.
      const res = await checkout(
        request,
        undefined,
        buildCheckoutPayload({
          items: [{ product_id: 'nonexistent-product-id', size: 'M', quantity: 1 }],
        })
      )

      // Step 2: the request is rejected with 401 and a non-empty error message.
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(typeof body.error).toBe('string')
      expect(body.error.length).toBeGreaterThan(0)
    }
  )
})
