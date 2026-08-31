import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Shop page. Composes the shared Navbar component, plus
 * the search-result summary text, the empty-results message, and the
 * product results grid (GASNTIN-29, GASNTIN-30).
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
}
