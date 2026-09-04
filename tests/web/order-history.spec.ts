import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { placeOrder, buildCheckoutPayload } from '@api/orders.js'
import { qaseId } from '@support/qase.js'
import { buildProductPayload } from '@data/products.js'

test.describe('WEB > Order History', () => {
  test(
    'A logged-in user with existing orders can view their Order History list and open an order to see its correct detail',
    { ...qaseId(55), tag: ['@smoke', '@order-history'] },
    async ({ page, orderHistoryPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 5 }] })
      )
      const order = await placeOrder(
        request,
        seeded.token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 2 }] })
      )

      await page.goto('/')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      await page.route('**/api/orders', async (route) => {
        if (route.request().method() === 'GET') {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
        await route.continue()
      })

      // Step 1: open the Order History page while the order list is still loading.
      await orderHistoryPage.open()
      await expect(orderHistoryPage.loadingIndicator).toBeVisible()
      await expect(orderHistoryPage.emptyState).not.toBeVisible()

      // Step 2: wait for the page to finish loading and observe the rendered list.
      await expect(orderHistoryPage.heading).toHaveText('Riwayat Pesanan')
      await expect(orderHistoryPage.emptyState).not.toBeVisible()
      await expect(orderHistoryPage.item(0)).toBeVisible()
      await expect(orderHistoryPage.item(0)).toContainText(order.id)
      await expect(orderHistoryPage.item(0)).toContainText(order.created_at)
      await expect(orderHistoryPage.item(0)).toContainText(order.status)
      await expect(orderHistoryPage.item(0)).toContainText(`${product.name} (M) ×2`)
      await expect(orderHistoryPage.item(0)).toContainText('Rp 200.000')

      // Step 3: click that order item and land on its Order Detail page.
      await orderHistoryPage.item(0).click()
      await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`))
      await expect(page.getByTestId('order-detail-id')).toHaveText(order.id)
    }
  )

  test(
    'Order History page shows an empty state with a "Mulai Belanja" shortcut when the user has no orders',
    { ...qaseId(56), tag: ['@regression', '@order-history'] },
    async ({ page, orderHistoryPage, request }) => {
      const seeded = await registerUser(request)

      await page.goto('/')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      // Step 1: open the Order History page with zero existing orders.
      await orderHistoryPage.open()
      await expect(orderHistoryPage.emptyState).toBeVisible()
      await expect(orderHistoryPage.emptyState).toContainText('📦')
      await expect(orderHistoryPage.emptyState).toContainText('Belum ada pesanan.')
      await expect(orderHistoryPage.startShoppingButton).toBeVisible()
      await expect(orderHistoryPage.item(0)).not.toBeVisible()

      // Step 2: click the "Mulai Belanja" button.
      await orderHistoryPage.startShoppingButton.click()
      await expect(page).toHaveURL(/\/shop$/)
    }
  )

  test(
    'Orders in the Order History list are shown with the most recently placed order first',
    { ...qaseId(57), tag: ['@regression', '@order-history'] },
    async ({ page, orderHistoryPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 10 }] })
      )

      // Step 1: place two orders in sequence, noting which is older/newer.
      const olderOrder = await placeOrder(
        request,
        seeded.token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 1 }] })
      )
      const newerOrder = await placeOrder(
        request,
        seeded.token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 1 }] })
      )

      await page.goto('/')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      // Step 2: open the Order History page; the newer order appears first.
      await orderHistoryPage.open()
      await expect(orderHistoryPage.item(0)).toContainText(newerOrder.id)
      await expect(orderHistoryPage.item(1)).toContainText(olderOrder.id)
    }
  )

  test(
    'A failed attempt to load the Order History list shows a distinct error state, not the same empty state as having zero orders',
    { ...qaseId(58), tag: ['@regression', '@order-history'] },
    async ({ page, orderHistoryPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 5 }] })
      )
      await placeOrder(
        request,
        seeded.token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 1 }] })
      )

      await page.goto('/')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      await page.route('**/api/orders', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 500, json: { error: 'Internal Server Error' } })
          return
        }
        await route.continue()
      })

      // Step 1: open the Order History page while the order list request is forced to fail.
      await orderHistoryPage.open()
      await expect(orderHistoryPage.errorState).toBeVisible()
      await expect(orderHistoryPage.emptyState).not.toBeVisible()
    }
  )
})
