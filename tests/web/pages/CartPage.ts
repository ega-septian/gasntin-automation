import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Cart page. Composes the shared Navbar component, plus
 * the added line item's name (GASNTIN-31).
 */
export class CartPage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly itemName: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('cart-page')
    this.itemName = page.getByTestId('cart-item-name')
  }

  async open(): Promise<void> {
    await this.page.goto('/cart')
  }
}
