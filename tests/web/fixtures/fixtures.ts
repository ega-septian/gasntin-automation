import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'
import { HomePage } from '../pages/HomePage.js'
import { ShopPage } from '../pages/ShopPage.js'
import { ProductDetailPage } from '../pages/ProductDetailPage.js'
import { CartPage } from '../pages/CartPage.js'
import {
  seedProduct as rawSeedProduct,
  deleteProduct,
  type CreateProductPayload,
  type Product,
} from '@api/products.js'

interface WebFixtures {
  loginPage: LoginPage
  homePage: HomePage
  shopPage: ShopPage
  productDetailPage: ProductDetailPage
  cartPage: CartPage
  seedProduct: (token: string, payload: CreateProductPayload) => Promise<Product>
}

/**
 * Extends the base test with page object and seeding fixtures shared across
 * the WEB suite.
 *
 * - `loginPage`: every WEB > Login case starts with "Open the Login page"
 *   (see GASNTIN-9 through GASNTIN-16), so navigation happens once here
 *   instead of being repeated in every test.
 * - `homePage`/`shopPage`/`productDetailPage`/`cartPage`: instantiated without
 *   navigating, since different WEB > Homepage cases start from different
 *   pages (see GASNTIN-26 through GASNTIN-33) — each test calls `.open()`
 *   itself.
 * - `seedProduct`: mirrors the API suite's fixture of the same name — every
 *   product it creates is soft-deleted again once the test finishes.
 */
export const test = base.extend<WebFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.open()
    await use(loginPage)
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page))
  },

  shopPage: async ({ page }, use) => {
    await use(new ShopPage(page))
  },

  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page))
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page))
  },

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
        console.warn(
          `seedProduct fixture: failed to clean up product ${id} (status ${res.status()})`
        )
      }
    }
  },
})

export { expect } from '@playwright/test'
