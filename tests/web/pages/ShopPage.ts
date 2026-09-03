import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Shop page. Composes the shared Navbar component, plus
 * the search-result summary text, the empty-results message, the product
 * results grid (GASNTIN-29, GASNTIN-30), and the brand/category filter
 * checkboxes (GASNTIN-36, GASNTIN-39).
 */
export class ShopPage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly searchSummary: Locator
  readonly emptyState: Locator
  readonly productCards: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('shop-page')
    this.searchSummary = page.getByTestId('shop-search-summary')
    this.emptyState = page.getByTestId('shop-empty-state')
    this.productCards = page.locator('[data-testid^="shop-product-card-"]')
  }

  async open(): Promise<void> {
    await this.page.goto('/shop')
  }

  brandFilterCheckbox(brand: string): Locator {
    return this.page.getByTestId(`shop-filter-brand-${brand}`)
  }

  categoryFilterCheckbox(category: string): Locator {
    return this.page.getByTestId(`shop-filter-category-${category}`)
  }

  async productNames(): Promise<string[]> {
    return this.productCards.locator('[data-testid="product-name"]').allTextContents()
  }
}
