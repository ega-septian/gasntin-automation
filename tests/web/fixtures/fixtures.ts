import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'

interface WebFixtures {
  loginPage: LoginPage
}

/**
 * Extends the base test with a `loginPage` fixture: every WEB > Login case
 * starts with "Open the Login page" (see GASNTIN-9 through GASNTIN-16), so
 * navigation happens once here instead of being repeated in every test.
 */
export const test = base.extend<WebFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.open()
    await use(loginPage)
  },
})

export { expect } from '@playwright/test'
