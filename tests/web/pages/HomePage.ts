import type { Locator, Page } from '@playwright/test'
import { Navbar } from './Navbar.js'

/**
 * Page object for the Homepage. Composes the shared Navbar component, plus
 * locators for the sections the navbar's "On Sale"/"New Arrivals"/"Brands"
 * links scroll to (GASNTIN-28).
 */
export class HomePage {
  readonly page: Page
  readonly navbar: Navbar
  readonly root: Locator
  readonly newArrivalsSection: Locator
  readonly categorySection: Locator
  readonly testimonialsSection: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = new Navbar(page)
    this.root = page.getByTestId('home-page')
    this.newArrivalsSection = page.getByTestId('home-new-arrivals-section')
    this.categorySection = page.getByTestId('home-category-section')
    this.testimonialsSection = page.getByTestId('home-testimonials-section')
  }

  async open(): Promise<void> {
    await this.page.goto('/')
  }
}
