import type { Locator, Page } from '@playwright/test'

/**
 * Page object for the Order Detail page. Reached by clicking an order item
 * on the Order History page (GASNTIN-55) rather than navigated to directly,
 * so there is no `open()` — the page's own heading, order ID and status are
 * exposed for the caller to assert against.
 */
export class OrderDetailPage {
  readonly page: Page
  readonly root: Locator
  readonly heading: Locator
  readonly orderId: Locator
  readonly recipient: Locator
  readonly address: Locator
  readonly status: Locator
  readonly total: Locator
  readonly notFoundState: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('order-detail-page')
    this.heading = page.getByTestId('order-detail-heading')
    this.orderId = page.getByTestId('order-detail-id')
    this.recipient = page.getByTestId('order-detail-recipient')
    this.address = page.getByTestId('order-detail-address')
    this.status = page.getByTestId('order-detail-status')
    this.total = page.getByTestId('order-detail-total')
    this.notFoundState = page.getByTestId('order-detail-not-found')
  }

  item(index: number): Locator {
    return this.page.getByTestId(`order-detail-item-${index}`)
  }
}
