import type { Locator, Page } from '@playwright/test'

/**
 * Page object for the Order Detail page. Reachable either by clicking an
 * order item on the Order History page (GASNTIN-55) or by navigating
 * directly to its URL (GASNTIN-59 through GASNTIN-64), hence `open()`. The
 * page's own heading, order ID, shipping/status fields, line items, total,
 * not-found state, and navigation links are exposed for the caller to assert
 * against.
 */
export class OrderDetailPage {
  readonly page: Page
  readonly root: Locator
  readonly heading: Locator
  readonly loadingIndicator: Locator
  readonly orderId: Locator
  readonly recipient: Locator
  readonly address: Locator
  readonly status: Locator
  readonly total: Locator
  readonly notFoundState: Locator
  readonly continueShoppingLink: Locator
  readonly viewOrderHistoryLink: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('order-detail-page')
    this.heading = page.getByTestId('order-detail-heading')
    this.loadingIndicator = this.root.getByText('Memuat...')
    this.orderId = page.getByTestId('order-detail-id')
    this.recipient = page.getByTestId('order-detail-recipient')
    this.address = page.getByTestId('order-detail-address')
    this.status = page.getByTestId('order-detail-status')
    this.total = page.getByTestId('order-detail-total')
    this.notFoundState = page.getByTestId('order-detail-not-found')
    this.continueShoppingLink = page.getByRole('link', { name: 'Lanjutkan Belanja' })
    this.viewOrderHistoryLink = page.getByRole('link', { name: 'Lihat Riwayat Pesanan' })
  }

  async open(orderId: string): Promise<void> {
    await this.page.goto(`/orders/${orderId}`)
  }

  item(index: number): Locator {
    return this.page.getByTestId(`order-detail-item-${index}`)
  }
}
