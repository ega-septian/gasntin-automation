import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { placeOrder, buildCheckoutPayload } from '@api/orders.js'
import { qaseId } from '@support/qase.js'
import { buildProductPayload } from '@data/products.js'
import { updateProductPrice } from '@support/db.js'
import { LoginPage } from './pages/LoginPage.js'

test.describe('WEB > Order Detail', () => {
  test(
    'Order Detail page displays complete order information: ID, shipping details, status, date, line items, and total, all with correct Rupiah formatting',
    { ...qaseId(59), tag: ['@smoke', '@order-detail'] },
    async ({ page, orderDetailPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ price: 150000, sizes: [{ size: 'M', stock: 5 }] })
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

      // Step 1: open the Order Detail page for one of the user's existing orders.
      await orderDetailPage.open(order.id)
      await expect(orderDetailPage.loadingIndicator).not.toBeVisible()
      await expect(page.getByText('Nomor Pesanan')).toBeVisible()
      await expect(orderDetailPage.orderId).toHaveText(order.id)

      // Step 2: check the "Dikirim ke" section.
      await expect(orderDetailPage.recipient).toHaveText(order.recipient_name)
      await expect(page.getByText(order.phone, { exact: true })).toBeVisible()
      await expect(orderDetailPage.address).toHaveText(order.address)

      // Step 3: check the "Status Pesanan" and "Dibuat pada" sections.
      await expect(orderDetailPage.status).toHaveText(order.status)
      await expect(page.getByText(order.created_at, { exact: true })).toBeVisible()

      // Step 4: check each line item in the order's item list.
      const item = order.items[0]
      await expect(orderDetailPage.item(0)).toContainText(item.brand)
      await expect(orderDetailPage.item(0)).toContainText(item.product_name)
      await expect(orderDetailPage.item(0)).toContainText(
        `Ukuran: ${item.size} · ${item.quantity}x`
      )
      await expect(orderDetailPage.item(0)).toContainText('Rp 300.000')

      // Step 5: check the "Total" section at the bottom of the page.
      await expect(orderDetailPage.total).toHaveText('Rp 300.000')

      // Step 6: look for navigation options on the page.
      await expect(orderDetailPage.continueShoppingLink).toBeVisible()
      await expect(orderDetailPage.viewOrderHistoryLink).toBeVisible()
    }
  )

  test(
    'Order Detail page shows a "not found" state for an order ID that does not resolve to a viewable order',
    { ...qaseId(60), tag: ['@regression', '@order-detail'] },
    async ({ page, orderDetailPage, request }) => {
      const seeded = await registerUser(request)

      await page.goto('/')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      // Step 1: open the Order Detail page directly using an order ID that does not exist.
      await orderDetailPage.open('00000000-0000-0000-0000-000000000000')
      await expect(orderDetailPage.loadingIndicator).not.toBeVisible()
      await expect(orderDetailPage.notFoundState).toBeVisible()
      await expect(orderDetailPage.notFoundState).toContainText('Pesanan tidak ditemukan')
      await expect(orderDetailPage.viewOrderHistoryLink).toBeVisible()

      // Step 2: click "Lihat Riwayat Pesanan".
      await orderDetailPage.viewOrderHistoryLink.click()
      await expect(page).toHaveURL(/\/orders$/)
      await expect(page.getByTestId('order-history-page')).toBeVisible()
    }
  )

  test(
    'Order Detail page shows the "not found" state, not a raw error, for a malformed order ID',
    { ...qaseId(61), tag: ['@regression', '@order-detail'] },
    async ({ page, orderDetailPage, request }) => {
      const seeded = await registerUser(request)

      await page.goto('/')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      // Step 1: open the Order Detail page directly with a malformed order ID.
      await orderDetailPage.open('abc123')
      await expect(orderDetailPage.notFoundState).toBeVisible()
      await expect(orderDetailPage.notFoundState).toContainText('Pesanan tidak ditemukan')
    }
  )

  test(
    "A logged-in user cannot view another user's order via its Order Detail URL",
    { ...qaseId(62), tag: ['@regression', '@order-detail'] },
    async ({ page, orderDetailPage, request, seedProduct }) => {
      const userB = await registerUser(request)
      const userA = await registerUser(request)
      const product = await seedProduct(
        userB.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 5 }] })
      )
      const userBOrder = await placeOrder(
        request,
        userB.token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 1 }] })
      )

      await page.goto('/')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: userB.token, user: userB.user }
      )
      await page.goto('/')
      await expect(page.getByTestId('navbar-logout-button')).toBeVisible()

      // Step 1: as User B, note the ID of one of User B's existing orders.
      const userBOrderId = userBOrder.id

      // Step 2: log out, then log in as User A, a different account.
      await page.getByTestId('navbar-logout-button').click()
      await expect(page.getByTestId('navbar-cta')).toBeVisible()
      const loginPage = new LoginPage(page)
      await loginPage.open()
      await loginPage.login(userA.email, userA.password)
      await expect(page.getByTestId('navbar-logout-button')).toBeVisible()

      // Step 3: as User A, open the Order Detail page directly using User B's order ID.
      await orderDetailPage.open(userBOrderId)
      await expect(orderDetailPage.notFoundState).toBeVisible()
      await expect(orderDetailPage.notFoundState).toContainText('Pesanan tidak ditemukan')
      await expect(page.getByText(userBOrder.address)).not.toBeVisible()
      await expect(page.getByText(userBOrder.phone, { exact: true })).not.toBeVisible()
      await expect(orderDetailPage.item(0)).not.toBeVisible()
      await expect(orderDetailPage.total).not.toBeVisible()
    }
  )

  test(
    'An anonymous user opening an Order Detail URL is redirected to the Login page and returned there after logging in',
    { ...qaseId(63), tag: ['@smoke', '@order-detail'] },
    async ({ page, orderDetailPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 5 }] })
      )
      const order = await placeOrder(
        request,
        seeded.token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 1 }] })
      )

      // Step 1: attempt to open a specific order's Order Detail page directly while logged out.
      await orderDetailPage.open(order.id)
      await expect(page).toHaveURL(new RegExp(`/login\\?redirect=/orders/${order.id}`))
      await expect(orderDetailPage.notFoundState).not.toBeVisible()

      // Step 2: log in with valid credentials belonging to the order's owner.
      const loginPage = new LoginPage(page)
      await loginPage.login(seeded.email, seeded.password)
      await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`))
      await expect(orderDetailPage.orderId).toHaveText(order.id)
    }
  )

  test(
    "Order Detail page shows the price charged at the time of order placement, not the product's current live price",
    { ...qaseId(64), tag: ['@regression', '@order-detail'] },
    async ({ page, orderDetailPage, productDetailPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ price: 120000, sizes: [{ size: 'M', stock: 5 }] })
      )
      const order = await placeOrder(
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

      // Step 1: note the price that was charged for that item at the time the order was placed.
      const chargedUnitPrice = order.items[0].unit_price
      expect(chargedUnitPrice).toBe(120000)

      // Step 2: confirm the product's live price has changed, without altering the existing order.
      await updateProductPrice(product.id, 180000)
      await productDetailPage.open(product.id)
      await expect(productDetailPage.price).toContainText('Rp 180.000')

      // Step 3: open the Order Detail page for the previously placed order.
      await orderDetailPage.open(order.id)
      await expect(orderDetailPage.item(0)).toContainText('Rp 120.000')
      await expect(orderDetailPage.item(0)).not.toContainText('Rp 180.000')
      await expect(orderDetailPage.total).toHaveText('Rp 120.000')
    }
  )
})
