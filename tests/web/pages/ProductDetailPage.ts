import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Product Detail page. Composes the shared Navbar
 * component, plus the "Add to Cart" button (GASNTIN-31) and the product's
 * brand/name headings (GASNTIN-37).
 */
export class ProductDetailPage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly addToCartButton: Locator
  readonly brand: Locator
  readonly name: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('product-detail-page')
    this.addToCartButton = page.getByTestId('product-detail-add-to-cart')
    this.brand = page.getByTestId('product-detail-brand')
    this.name = page.getByTestId('product-detail-name')
  }

  async open(productId: string): Promise<void> {
    await this.page.goto(`/products/${productId}`)
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click()
  }
}
