import type { Locator, Page } from '@playwright/test'

/**
 * Page Object for the Login page. Reused across every WEB > Login case
 * (GASNTIN-9 through GASNTIN-16), since they all start from this page.
 */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly togglePasswordVisibilityButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByTestId('login-email-input')
    this.passwordInput = page.getByTestId('login-password-input')
    this.submitButton = page.getByTestId('login-submit-button')
    this.errorMessage = page.getByTestId('login-error-message')
    this.togglePasswordVisibilityButton = page.getByTestId('login-toggle-password-visibility')
  }

  async open(): Promise<void> {
    await this.page.goto('/login')
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
