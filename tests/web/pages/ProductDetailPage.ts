import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Product Detail page. Composes the shared Navbar
 * component, plus the "Add to Cart" button (GASNTIN-31).
 */
export class ProductDetailPage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly addToCartButton: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('product-detail-page')
    this.addToCartButton = page.getByTestId('product-detail-add-to-cart')
  }

  async open(productId: string): Promise<void> {
    await this.page.goto(`/products/${productId}`)
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click()
  }
}
