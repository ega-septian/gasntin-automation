import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

export interface CheckoutFormValues {
  recipientName: string
  phone: string
  address: string
}

/**
 * Page object for the Checkout page. Composes the shared Navbar component,
 * plus the shipping form fields and submit button (GASNTIN-50), the inline
 * submission error message (GASNTIN-50), and the "Ringkasan Pesanan" order
 * summary (GASNTIN-49, GASNTIN-51).
 */
export class CheckoutPage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly form: Locator
  readonly recipientNameInput: Locator
  readonly phoneInput: Locator
  readonly addressInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly summaryTotal: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('checkout-page')
    this.form = page.getByTestId('checkout-form')
    this.recipientNameInput = page.getByLabel('Nama Penerima')
    this.phoneInput = page.getByLabel('Nomor HP')
    this.addressInput = page.getByLabel('Alamat Pengiriman')
    this.submitButton = page.getByTestId('checkout-submit-button')
    this.errorMessage = page.getByTestId('checkout-error-message')
    this.summaryTotal = page.getByTestId('checkout-summary-total')
  }

  async open(): Promise<void> {
    await this.page.goto('/checkout')
  }

  summaryItem(index: number): Locator {
    return this.page.getByTestId(`checkout-summary-item-${index}`)
  }

  summaryOverstockWarning(index: number): Locator {
    return this.page.getByTestId(`checkout-summary-overstock-${index}`)
  }

  async fillForm({ recipientName, phone, address }: CheckoutFormValues): Promise<void> {
    await this.recipientNameInput.fill(recipientName)
    await this.phoneInput.fill(phone)
    await this.addressInput.fill(address)
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
