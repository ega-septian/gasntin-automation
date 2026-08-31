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
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    // Scoped to the login <form> — the site's navbar also has a "Masuk" CTA
    // button, so the bare role+name locator alone matches both. The name is
    // matched as a regex covering both of the button's own states ("Masuk"
    // and, while the login request is in flight, "Memproses...") so the
    // locator still resolves to the same element once its label changes.
    this.submitButton = page
      .locator('form')
      .getByRole('button', { name: /^(Masuk|Memproses\.\.\.)$/ })
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
