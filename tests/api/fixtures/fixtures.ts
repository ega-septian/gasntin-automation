import { test as base } from '@playwright/test'
import {
  seedProduct as rawSeedProduct,
  deleteProduct,
  type CreateProductPayload,
  type Product,
} from '@api/products.js'

interface ApiFixtures {
  seedProduct: (token: string, payload: CreateProductPayload) => Promise<Product>
}

/**
 * Extends the base test with a `seedProduct` fixture: every product it
 * creates is soft-deleted again once the test finishes, so seeded catalog
 * data (visible on the live homepage's "New Arrivals" otherwise) doesn't
 * accumulate in a shared local dev database the way plain seedProduct calls
 * did before this fixture existed.
 */
export const test = base.extend<ApiFixtures>({
  seedProduct: async ({ request }, use) => {
    const created: Array<{ token: string; id: string }> = []

    await use(async (token, payload) => {
      const product = await rawSeedProduct(request, token, payload)
      created.push({ token, id: product.id })
      return product
    })

    // Teardown — best-effort. A cleanup failure is a hygiene issue, not a
    // reason to fail a test that otherwise passed, so it's logged, not thrown.
    for (const { token, id } of created) {
      const res = await deleteProduct(request, token, id)
      if (!res.ok()) {
        console.warn(`seedProduct fixture: failed to clean up product ${id} (status ${res.status()})`)
      }
    }
  },
})

export { expect } from '@playwright/test'
