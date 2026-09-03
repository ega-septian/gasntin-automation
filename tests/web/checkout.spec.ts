import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { placeOrder, buildCheckoutPayload } from '@api/orders.js'
import { qaseId } from '@support/qase.js'
import { buildProductPayload } from '@data/products.js'
import { LoginPage } from './pages/LoginPage.js'

test.describe('WEB > Checkout', () => {
  test(
    "Checkout page's order summary shows a stock warning before the form is filled in, when a cart line item exceeds current available stock",
    { ...qaseId(49), tag: ['@regression', '@checkout'] },
    async ({ page, productDetailPage, checkoutPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 3 }] })
      )

      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.quantityIncrementButton.click()
      await productDetailPage.quantityIncrementButton.click()
      await expect(productDetailPage.quantityValue).toHaveText('3')
      await productDetailPage.addToCart()

      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      await placeOrder(
        request,
        seeded.token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 2 }] })
      )

      // Step 1: open the Checkout page with the cart in the above invalid
      // state, without filling in any of the shipping fields yet.
      await checkoutPage.open()
      await expect(checkoutPage.root).toBeVisible()
      await expect(checkoutPage.recipientNameInput).toHaveValue('')
      await expect(checkoutPage.phoneInput).toHaveValue('')
      await expect(checkoutPage.addressInput).toHaveValue('')
      await expect(checkoutPage.summaryOverstockWarning(0)).toHaveText(
        `${product.name} (ukuran M): Kuantitas melebihi stok yang tersedia.`
      )
    }
  )

  test(
    'Submitting "Buat Pesanan" with insufficient stock shows a specific error and preserves the already-typed form fields',
    { ...qaseId(50), tag: ['@regression', '@checkout'] },
    async ({ page, productDetailPage, checkoutPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 3 }] })
      )

      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.quantityIncrementButton.click()
      await productDetailPage.quantityIncrementButton.click()
      await expect(productDetailPage.quantityValue).toHaveText('3')
      await productDetailPage.addToCart()

      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      await placeOrder(
        request,
        seeded.token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 2 }] })
      )

      const formValues = {
        recipientName: 'QA Automation',
        phone: '081234567890',
        address: 'Jl. Automation Testing No. 1, Jakarta',
      }

      // Step 1: open the Checkout page with a cart whose requested quantity
      // now exceeds the real stock at submission time.
      await checkoutPage.open()
      await expect(checkoutPage.root).toBeVisible()
      await expect(checkoutPage.form).toBeVisible()

      // Step 2: fill in the shipping fields with valid values.
      await checkoutPage.fillForm(formValues)
      await expect(checkoutPage.recipientNameInput).toHaveValue(formValues.recipientName)
      await expect(checkoutPage.phoneInput).toHaveValue(formValues.phone)
      await expect(checkoutPage.addressInput).toHaveValue(formValues.address)

      // Step 3: submit the order.
      await checkoutPage.submit()
      await expect(checkoutPage.errorMessage).toHaveText(
        `stok tidak cukup untuk ${product.name} ukuran M (tersisa 1)`
      )

      // Step 4: the previously typed fields must remain unchanged.
      await expect(checkoutPage.recipientNameInput).toHaveValue(formValues.recipientName)
      await expect(checkoutPage.phoneInput).toHaveValue(formValues.phone)
      await expect(checkoutPage.addressInput).toHaveValue(formValues.address)
    }
  )

  test(
    'Accessing Checkout while logged out redirects to Login and returns to Checkout with cart intact after logging in',
    { ...qaseId(51), tag: ['@smoke', '@checkout'] },
    async ({ page, productDetailPage, checkoutPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 5 }] })
      )

      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.addToCart()

      // Step 1: attempt to open the Checkout page directly while logged out.
      await checkoutPage.open()
      await expect(page).toHaveURL(/\/login\?redirect=\/checkout/)
      await expect(page.getByTestId('login-page')).toBeVisible()

      // Step 2: log in with valid credentials on the Login page.
      const loginPage = new LoginPage(page)
      await loginPage.login(seeded.email, seeded.password)
      await expect(page).toHaveURL(/\/checkout$/)
      await expect(checkoutPage.root).toBeVisible()

      // Step 3: the cart's items are still present and unchanged.
      await expect(checkoutPage.summaryItem(0)).toContainText(product.name)
      await expect(checkoutPage.summaryItem(0)).toContainText('(M)')
    }
  )
})
