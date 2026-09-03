import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { placeOrder, buildCheckoutPayload } from '@api/orders.js'
import { qaseId } from '@support/qase.js'
import { buildProductPayload } from '@data/products.js'

test.describe('WEB > Cart', () => {
  test(
    'Cart page displays available stock for each line item near its quantity control',
    { ...qaseId(41), tag: ['@regression', '@cart'] },
    async ({ page, productDetailPage, cartPage, request, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(
        token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 7 }] })
      )

      // Step 1: open the Cart page with a line item added to it.
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.addToCart()
      await cartPage.open()
      await expect(page.getByTestId('cart-heading')).toHaveText('Keranjang')
      await expect(cartPage.lineItem(0)).toBeVisible()

      // Step 2: look at the area around that line item's quantity control.
      await expect(cartPage.lineItem(0)).toContainText('Stok tersedia (ukuran M): 7')
    }
  )

  test(
    'Stock shown on the Cart page reflects current live stock, not the value cached when the item was added',
    { ...qaseId(42), tag: ['@regression', '@cart'] },
    async ({ page, productDetailPage, cartPage, request, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(
        token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 6 }] })
      )

      // Step 1: note the available stock for a product/size already in the Cart.
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await expect(page.getByText('Stok tersedia (ukuran M): 6')).toBeVisible()
      await productDetailPage.addToCart()

      // Step 2: cause the real stock for that same product/size to change,
      // without touching the Cart; the Product Detail page reflects the change.
      await placeOrder(
        request,
        token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 4 }] })
      )
      await productDetailPage.open(product.id)
      await expect(page.getByText('Stok tersedia (ukuran M): 2')).toBeVisible()

      // Step 3: open the Cart page.
      await cartPage.open()
      await expect(cartPage.lineItem(0)).toContainText('Stok tersedia (ukuran M): 2')
      await expect(cartPage.lineItem(0)).not.toContainText('Stok tersedia (ukuran M): 6')
    }
  )

  test(
    'The "+" quantity control on the Cart page cannot increase a line item\'s quantity beyond its current available stock',
    { ...qaseId(43), tag: ['@regression', '@cart'] },
    async ({ productDetailPage, cartPage, request, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(
        token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 3 }] })
      )

      // Step 1: open the Cart page with the line item's quantity below the
      // known available stock.
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.addToCart()
      await cartPage.open()
      await expect(cartPage.quantityValue(0)).toHaveText('1')

      // Step 2: click "+" repeatedly for that line item until the quantity
      // reaches the known available stock.
      await cartPage.incrementButton(0).click()
      await expect(cartPage.quantityValue(0)).toHaveText('2')
      await cartPage.incrementButton(0).click()
      await expect(cartPage.quantityValue(0)).toHaveText('3')

      // Step 3: click "+" once more, after the quantity already equals the
      // available stock; it must not increase past that figure.
      await cartPage.incrementButton(0).click()
      await expect(cartPage.quantityValue(0)).toHaveText('3')
    }
  )

  test(
    'The "−" quantity control on the Cart page remains usable regardless of stock level',
    { ...qaseId(44), tag: ['@regression', '@cart'] },
    async ({ productDetailPage, cartPage, request, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(
        token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 5 }] })
      )

      // Step 1: open the Cart page with a line item whose quantity is greater than 1.
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.quantityIncrementButton.click()
      await productDetailPage.addToCart()
      await cartPage.open()
      await expect(cartPage.quantityValue(0)).toHaveText('2')

      // Step 2: click the "−" button once for that line item.
      await cartPage.decrementButton(0).click()
      await expect(cartPage.quantityValue(0)).toHaveText('1')
    }
  )

  test(
    "Cart page does not silently change a line item's quantity when it becomes invalid due to a stock decrease",
    { ...qaseId(45), tag: ['@regression', '@cart'] },
    async ({ productDetailPage, cartPage, request, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(
        token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 3 }] })
      )

      // Step 1: add a product/size to the Cart with quantity equal to its current stock.
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.quantityIncrementButton.click()
      await productDetailPage.quantityIncrementButton.click()
      await productDetailPage.addToCart()
      await cartPage.open()
      await expect(cartPage.quantityValue(0)).toHaveText('3')

      // Step 2: reduce the real stock for that same product/size below the cart's
      // quantity via another order, without touching the Cart itself.
      await placeOrder(
        request,
        token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 2 }] })
      )

      // Step 3: open (refresh) the Cart page again.
      await cartPage.open()
      await expect(cartPage.quantityValue(0)).toHaveText('3')
    }
  )

  test(
    "Cart page shows an inline warning and disables the Checkout button when a line item's quantity exceeds current available stock",
    { ...qaseId(46), tag: ['@regression', '@cart'] },
    async ({ productDetailPage, cartPage, request, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(
        token,
        buildProductPayload({ brand: 'NEVADA', sizes: [{ size: 'M', stock: 3 }] })
      )

      // Step 1: open the Cart page with a line item whose quantity exceeds
      // its current available stock — arranged the same way as case 45, by
      // adding at the original stock (3) and then reducing real stock via
      // another order (down to 1).
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.quantityIncrementButton.click()
      await productDetailPage.quantityIncrementButton.click()
      await productDetailPage.addToCart()
      await placeOrder(
        request,
        token,
        buildCheckoutPayload({ items: [{ product_id: product.id, size: 'M', quantity: 2 }] })
      )
      await cartPage.open()
      await expect(cartPage.lineItem(0)).toContainText(product.name)
      await expect(cartPage.lineItem(0)).toContainText(
        /melebihi stok|kelebihan stok|exceeds.*stock/i
      )

      // Step 2: look at the Checkout button in the order summary; it must be disabled.
      await expect(cartPage.checkoutButton).toBeDisabled()

      // Step 3: lower that line item's quantity via "−" to at or below its
      // available stock; the warning disappears and Checkout becomes enabled.
      await cartPage.decrementButton(0).click()
      await cartPage.decrementButton(0).click()
      await expect(cartPage.quantityValue(0)).toHaveText('1')
      await expect(cartPage.lineItem(0)).not.toContainText(
        /melebihi stok|kelebihan stok|exceeds.*stock/i
      )
      await expect(cartPage.checkoutButton).toBeEnabled()
    }
  )

  test(
    'Checkout button remains enabled and no over-stock warning appears when all cart line item quantities are within available stock',
    { ...qaseId(47), tag: ['@regression', '@cart'] },
    async ({ page, productDetailPage, cartPage, request, seedProduct }) => {
      const seeded = await registerUser(request)
      const product = await seedProduct(
        seeded.token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 5 }] })
      )

      // Step 1: open the Cart page with a line item whose quantity is within its available stock.
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.quantityIncrementButton.click()
      await productDetailPage.addToCart()
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )
      await cartPage.open()
      await expect(cartPage.quantityValue(0)).toHaveText('2')

      // Step 2: look at the Checkout button in the order summary.
      await expect(cartPage.checkoutButton).toBeEnabled()

      // Step 3: click the Checkout button.
      await cartPage.checkoutButton.click()
      await expect(page).toHaveURL(/\/checkout$/)
      await expect(page.getByTestId('checkout-page')).toBeVisible()
    }
  )

  test(
    'Repeating Add to Cart from the Product Detail Page for the same product and size does not let the combined cart quantity exceed available stock',
    { ...qaseId(48), tag: ['@regression', '@cart'] },
    async ({ productDetailPage, cartPage, request, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(
        token,
        buildProductPayload({ sizes: [{ size: 'M', stock: 3 }] })
      )

      // Step 1: open the Product Detail page and select the size with the known low stock.
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await expect(productDetailPage.quantityValue).toHaveText('1')

      // Step 2: set the quantity below the available stock and add to cart.
      await productDetailPage.quantityIncrementButton.click()
      await expect(productDetailPage.quantityValue).toHaveText('2')
      await productDetailPage.addToCart()
      await cartPage.open()
      await expect(cartPage.quantityValue(0)).toHaveText('2')

      // Step 3: return to the same Product Detail page, select the same
      // size, set the quantity again, and add to cart a second time; the
      // combined quantity in the Cart must not exceed the available stock.
      await productDetailPage.open(product.id)
      await productDetailPage.selectSize('M')
      await productDetailPage.quantityIncrementButton.click()
      await expect(productDetailPage.quantityValue).toHaveText('2')
      await productDetailPage.addToCart()
      await cartPage.open()
      await expect(cartPage.quantityValue(0)).toHaveText('3')
    }
  )
})
