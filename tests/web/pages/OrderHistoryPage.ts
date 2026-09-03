import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Order History page. Composes the shared Navbar
 * component, plus the loading indicator, the empty state and its "Mulai
 * Belanja" shortcut (GASNTIN-55, GASNTIN-56), and the order list items
 * (GASNTIN-55, GASNTIN-57). `errorState` targets the distinct failed-load
 * message the page is expected to show (GASNTIN-58) — it does not exist in
 * the current markup yet.
 */
export class OrderHistoryPage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly heading: Locator
  readonly loadingIndicator: Locator
  readonly emptyState: Locator
  readonly startShoppingButton: Locator
  readonly errorState: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('order-history-page')
    this.heading = page.getByTestId('order-history-heading')
    this.loadingIndicator = this.root.getByText('Memuat...')
    this.emptyState = page.getByTestId('order-history-empty-state')
    this.startShoppingButton = this.emptyState.getByRole('link', { name: 'Mulai Belanja' })
    this.errorState = page.getByTestId('order-history-error-state')
  }

  async open(): Promise<void> {
    await this.page.goto('/orders')
  }

  item(index: number): Locator {
    return this.page.getByTestId(`order-history-item-${index}`)
  }
}
