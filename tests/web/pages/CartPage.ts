import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Cart page. Composes the shared Navbar component, plus
 * the added line item's name (GASNTIN-31), the per-line quantity control and
 * its container (GASNTIN-41, GASNTIN-42, GASNTIN-43, GASNTIN-44, GASNTIN-45,
 * GASNTIN-46), and the order-summary Checkout button (GASNTIN-46, GASNTIN-47).
 */
export class CartPage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly itemName: Locator
  readonly checkoutButton: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('cart-page')
    this.itemName = page.getByTestId('cart-item-name')
    this.checkoutButton = page.getByTestId('cart-checkout-button')
  }

  async open(): Promise<void> {
    await this.page.goto('/cart')
  }

  lineItem(index: number): Locator {
    return this.page.getByTestId(`cart-item-${index}`)
  }

  quantityValue(index: number): Locator {
    return this.page.getByTestId(`cart-item-quantity-${index}`)
  }

  incrementButton(index: number): Locator {
    return this.page.getByTestId(`cart-item-increment-${index}`)
  }

  decrementButton(index: number): Locator {
    return this.page.getByTestId(`cart-item-decrement-${index}`)
  }
}
