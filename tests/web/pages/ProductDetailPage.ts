import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Product Detail page. Composes the shared Navbar
 * component, plus the "Add to Cart" button (GASNTIN-31), the product's
 * brand/name headings (GASNTIN-37), and the size selector and quantity
 * stepper (GASNTIN-44, GASNTIN-45, GASNTIN-47).
 */
export class ProductDetailPage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly addToCartButton: Locator
  readonly brand: Locator
  readonly name: Locator
  readonly quantityIncrementButton: Locator
  readonly quantityValue: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('product-detail-page')
    this.addToCartButton = page.getByTestId('product-detail-add-to-cart')
    this.brand = page.getByTestId('product-detail-brand')
    this.name = page.getByTestId('product-detail-name')
    this.quantityIncrementButton = page.getByTestId('product-detail-quantity-increment')
    this.quantityValue = page.getByTestId('product-detail-quantity-value')
  }

  async open(productId: string): Promise<void> {
    await this.page.goto(`/products/${productId}`)
  }

  sizeButton(size: string): Locator {
    return this.page.getByTestId(`product-detail-size-${size}`)
  }

  async selectSize(size: string): Promise<void> {
    await this.sizeButton(size).click()
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click()
  }
}
