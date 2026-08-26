import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { qaseId } from '@support/qase.js'

test.describe('WEB > Login', () => {
  test(
    'Successful login via the Login form, redirected to the Dashboard page',
    qaseId(9),
    async ({ page, request, loginPage }) => {
      const seeded = await registerUser(request)

      // Step 1: the login form is displayed with Email and Password fields and a "Masuk" button.
      await expect(loginPage.emailInput).toBeVisible()
      await expect(loginPage.passwordInput).toBeVisible()
      await expect(loginPage.submitButton).toBeVisible()

      // Step 2: fill in valid credentials and submit.
      await loginPage.login(seeded.email, seeded.password)

      // Step 3: redirected to the Dashboard, session persisted.
      await expect(page).toHaveURL(/\/dashboard$/)
      await expect(page.getByTestId('dashboard-welcome-heading')).toContainText(seeded.email)
    }
  )

  test(
    'Login fails via the Login form - error message displayed correctly',
    qaseId(10),
    async ({ page, request, loginPage }) => {
      const seeded = await registerUser(request)

      // Step 1: submit the login form with a wrong email/password combination.
      await loginPage.login(seeded.email, 'wrong-password')

      // Step 2: an error message is shown above the submit button, the user stays on the
      // Login page, and no session is persisted.
      await expect(loginPage.errorMessage).toContainText('email atau password salah')
      await expect(page).toHaveURL(/\/login$/)
      expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBeNull()
    }
  )
})
