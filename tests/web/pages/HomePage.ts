import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Homepage. Composes the shared Navbar component, plus
 * locators for the sections the navbar's "On Sale"/"New Arrivals"/"Brands"
 * links scroll to (GASNTIN-28), the promo bar, hero CTA, brand strip, New
 * Arrivals/Top Selling product grids, and Shop by Category cards
 * (GASNTIN-34 through GASNTIN-39).
 */
export class HomePage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly newArrivalsSection: Locator
  readonly categorySection: Locator
  readonly testimonialsSection: Locator
  readonly promoBar: Locator
  readonly promoBarCta: Locator
  readonly heroCta: Locator
  readonly brandItems: Locator
  readonly newArrivalsCards: Locator
  readonly newArrivalsViewAll: Locator
  readonly topSellingCards: Locator
  readonly topSellingViewAll: Locator
  readonly categoryCards: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('home-page')
    this.newArrivalsSection = page.getByTestId('home-new-arrivals-section')
    this.categorySection = page.getByTestId('home-category-section')
    this.testimonialsSection = page.getByTestId('home-testimonials-section')
    this.promoBar = page.getByTestId('home-promo-bar')
    this.promoBarCta = page.getByTestId('home-promo-bar-cta')
    this.heroCta = page.getByTestId('home-hero-cta')
    this.brandItems = page.locator('[data-testid^="home-brand-item-"]')
    this.newArrivalsCards = page.locator('[data-testid^="home-new-arrival-card-"]')
    this.newArrivalsViewAll = page.getByTestId('home-new-arrivals-view-all')
    this.topSellingCards = page.locator('[data-testid^="home-top-selling-card-"]')
    this.topSellingViewAll = page.getByTestId('home-top-selling-view-all')
    this.categoryCards = page.locator('[data-testid^="home-category-card-"]')
  }

  async open(): Promise<void> {
    await this.page.goto('/')
  }

  async clickBrand(brand: string): Promise<void> {
    await this.brandItems.filter({ hasText: brand }).click()
  }

  async clickCategory(category: string): Promise<void> {
    await this.categoryCards.filter({ hasText: category }).click()
  }
}
