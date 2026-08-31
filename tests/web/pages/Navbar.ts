import type { Locator, Page } from '@playwright/test'

/**
 * Component object for the navbar, present on every page. Reused across
 * every WEB > Homepage case that interacts with the logo, nav links, search
 * box, cart icon, or the guest/logged-in session controls (GASNTIN-26
 * through GASNTIN-33).
 */
export class Navbar {
  readonly root: Locator
  readonly logo: Locator
  readonly shopLink: Locator
  readonly saleLink: Locator
  readonly newArrivalsLink: Locator
  readonly brandsLink: Locator
  readonly searchInput: Locator
  readonly cartButton: Locator
  readonly cartBadge: Locator
  readonly ctaButton: Locator
  readonly accountButton: Locator
  readonly logoutButton: Locator

  constructor(page: Page) {
    this.root = page.getByTestId('navbar')
    this.logo = this.root.getByTestId('navbar-logo')
    this.shopLink = this.root.getByTestId('navbar-link-shop')
    this.saleLink = this.root.getByTestId('navbar-link-sale')
    this.newArrivalsLink = this.root.getByTestId('navbar-link-new-arrivals')
    this.brandsLink = this.root.getByTestId('navbar-link-brands')
    this.searchInput = this.root.getByTestId('navbar-search-input')
    this.cartButton = this.root.getByTestId('navbar-cart-button')
    this.cartBadge = this.root.getByTestId('navbar-cart-badge')
    this.ctaButton = this.root.getByTestId('navbar-cta')
    this.accountButton = this.root.getByTestId('navbar-account-button')
    this.logoutButton = this.root.getByTestId('navbar-logout-button')
  }

  async clickLogo(): Promise<void> {
    await this.logo.click()
  }

  async clickShopLink(): Promise<void> {
    await this.shopLink.click()
  }

  async clickSaleLink(): Promise<void> {
    await this.saleLink.click()
  }

  async clickNewArrivalsLink(): Promise<void> {
    await this.newArrivalsLink.click()
  }

  async clickBrandsLink(): Promise<void> {
    await this.brandsLink.click()
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term)
    await this.searchInput.press('Enter')
  }

  async clickCart(): Promise<void> {
    await this.cartButton.click()
  }

  async clickCta(): Promise<void> {
    await this.ctaButton.click()
  }

  async clickLogout(): Promise<void> {
    await this.logoutButton.click()
  }
}
