import { test, expect } from '@playwright/test'
import { registerUser } from '../../api/auth.js'
import { findProductWithStock, getProduct } from '../../api/products.js'
import { checkout, buildCheckoutPayload } from '../../api/orders.js'
import { qaseId } from '../../support/qase.js'

test.describe('API > Checkout', () => {
  // Serial, not parallel: cases 52/53 both pick a live product+size by
  // current stock, and case 53 always drains whatever it picks down to 0.
  // Running them concurrently risks both landing on the same product+size
  // and racing each other's stock read/decrement.
  test.describe.configure({ mode: 'serial' })

  test(
    "POST /orders rejects checkout when a requested item's quantity exceeds its current available stock",
    qaseId(52),
    async ({ request }) => {
      // Setup: a logged-in user, plus a product+size with a known current
      // stock N (read live from the catalog rather than assumed).
      const seeded = await registerUser(request)
      const item = await findProductWithStock(request, 1)

      // Step 1: submit checkout for one more unit than is currently available.
      const res = await checkout(
        request,
        seeded.token,
        buildCheckoutPayload({
          items: [{ product_id: item.productId, size: item.size, quantity: item.stock + 1 }],
        })
      )

      // Step 2: the server rejects with 400, naming the product, size, and
      // remaining stock in the response.
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toBe(
        `stok tidak cukup untuk ${item.productName} ukuran ${item.size} (tersisa ${item.stock})`
      )

      // Step 3: the rejected order must not have decremented stock.
      const afterRes = await getProduct(request, item.productId)
      expect(afterRes.status()).toBe(200)
      const after = await afterRes.json()
      const afterSize = after.sizes.find((s: { size: string }) => s.size === item.size)
      expect(afterSize?.stock).toBe(item.stock)
    }
  )

  test(
    "POST /orders succeeds when a requested item's quantity exactly equals its current available stock",
    qaseId(53),
    async ({ request }) => {
      // Setup: a logged-in user, plus a product+size with a known current
      // stock N (N >= 1), read live from the catalog rather than assumed.
      const seeded = await registerUser(request)
      const item = await findProductWithStock(request, 1)

      // Step 1: submit checkout for exactly the available stock.
      const res = await checkout(
        request,
        seeded.token,
        buildCheckoutPayload({
          items: [{ product_id: item.productId, size: item.size, quantity: item.stock }],
        })
      )

      // Step 2: HTTP 201 is returned with the created order, including the
      // submitted item.
      expect(res.status()).toBe(201)
      const body = await res.json()
      expect(body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            product_id: item.productId,
            size: item.size,
            quantity: item.stock,
          }),
        ])
      )

      // Step 3: the product's stock for that size is now decremented to 0.
      const afterRes = await getProduct(request, item.productId)
      expect(afterRes.status()).toBe(200)
      const after = await afterRes.json()
      const afterSize = after.sizes.find((s: { size: string }) => s.size === item.size)
      expect(afterSize?.stock).toBe(0)
    }
  )

  test('POST /orders is rejected without a valid Authorization token', qaseId(54), async ({ request }) => {
    // Step 1: submit an otherwise valid checkout body with no Authorization
    // header at all.
    const res = await checkout(
      request,
      undefined,
      buildCheckoutPayload({
        items: [{ product_id: 'nonexistent-product-id', size: 'M', quantity: 1 }],
      })
    )

    // HTTP 401 is returned with an error indicating the token is missing or
    // invalid. "No order is created" is not independently verifiable here:
    // an unauthenticated request never resolves to any user_id, so there is
    // no order history that could be queried to prove it either way in a
    // black-box test.
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })
})
