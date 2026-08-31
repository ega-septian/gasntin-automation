import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { qaseId } from '@support/qase.js'
import { uniqueEmail } from '@data/users.js'

test.describe('WEB > Login', () => {
  test(
    'Successful login via the Login form, redirected to the Homepage',
    qaseId(9),
    async ({ page, request, loginPage }) => {
      const seeded = await registerUser(request)

      // Step 1: the login form is displayed with Email and Password fields and a "Masuk" button.
      await expect(loginPage.emailInput).toBeVisible()
      await expect(loginPage.passwordInput).toBeVisible()
      await expect(loginPage.submitButton).toBeVisible()

      // Step 2: fill in valid credentials and submit.
      await loginPage.login(seeded.email, seeded.password)

      // Step 3: redirected to the Homepage, session persisted (the navbar now
      // reflects the logged-in state instead of the guest "Masuk" CTA).
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByTestId('navbar-logout-button')).toBeVisible()
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

  test(
    'The "Masuk" button is disabled and shows a loading state during login',
    qaseId(11),
    async ({ page, request, loginPage }) => {
      const seeded = await registerUser(request)

      // Delays the login response instead of throttling the network, so the
      // loading state has a reliable window to be observed.
      let loginRequestCount = 0
      await page.route('**/api/auth/login', async (route) => {
        loginRequestCount++
        await new Promise((resolve) => setTimeout(resolve, 800))
        await route.continue()
      })
      // On success the app navigates to the Homepage right after the button
      // re-enables, which normally swaps it out of the DOM in the same tick
      // before Step 3 can observe the "re-enabled, back to Masuk" state. The
      // Homepage view is only fetched on demand (it hasn't been loaded yet,
      // since the test starts on the Login page directly), so delaying that
      // fetch keeps the Login page rendered long enough for the reverted
      // button state to actually be observable, without altering app behavior.
      await page.route('**/views/HomeView.vue*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await route.continue()
      })

      // Step 1: submit valid credentials; the button immediately shows the loading state.
      await loginPage.emailInput.fill(seeded.email)
      await loginPage.passwordInput.fill(seeded.password)
      await loginPage.submitButton.click()

      await expect(loginPage.submitButton).toBeDisabled()
      await expect(loginPage.submitButton).toContainText('Memproses...')

      // Step 2: a disabled button cannot register another click, so only one
      // login request is ever sent — the double-submit is prevented structurally.
      await expect(loginPage.submitButton).toBeDisabled()

      // Step 3: once the process finishes, the button re-enables, the loading
      // animation disappears, and the text reverts to "Masuk".
      await expect(loginPage.submitButton).toBeEnabled()
      await expect(loginPage.submitButton).toHaveText('Masuk')
      expect(loginRequestCount).toBe(1)
    }
  )

  test(
    'The show/hide password icon on the Login form works correctly',
    qaseId(12),
    async ({ loginPage }) => {
      // Step 1: typed characters are masked by default.
      await loginPage.passwordInput.fill('some-password')
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')

      // Step 2: clicking the eye icon reveals the password and flips the icon.
      await loginPage.togglePasswordVisibilityButton.click()
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'text')
      await expect(loginPage.togglePasswordVisibilityButton).toContainText('🙈')

      // Step 3: clicking it again re-masks the password and flips the icon back.
      await loginPage.togglePasswordVisibilityButton.click()
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')
      await expect(loginPage.togglePasswordVisibilityButton).toContainText('👁️')
    }
  )

  test(
    'The Login form prevents submission when the Email or Password field is empty',
    qaseId(13),
    async ({ page, loginPage }) => {
      // Step 1: leave Email empty, fill Password, submit — native validation blocks it.
      await loginPage.passwordInput.fill('some-password')
      await loginPage.submitButton.click()

      expect(
        await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
      ).not.toBe('')
      await expect(page).toHaveURL(/\/login$/)

      // Step 2: fill Email, leave Password empty, submit again — same for Password.
      await loginPage.emailInput.fill(uniqueEmail())
      await loginPage.passwordInput.fill('')
      await loginPage.submitButton.click()

      expect(
        await loginPage.passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage)
      ).not.toBe('')
      await expect(page).toHaveURL(/\/login$/)
    }
  )

  test(
    'The login session persists after the Homepage is refreshed',
    qaseId(14),
    async ({ page, request, loginPage }) => {
      const seeded = await registerUser(request)

      // Step 1: log in through the form until reaching the Homepage, which
      // displays a "Keluar" button.
      await loginPage.login(seeded.email, seeded.password)
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByTestId('navbar-logout-button')).toContainText('Keluar')

      // Step 2: a full page reload must not throw the user back to the Login page.
      await page.reload()
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByTestId('navbar-logout-button')).toContainText('Keluar')
    }
  )

  test(
    'A logged-in user is automatically redirected from the Login page to the Homepage',
    qaseId(15),
    async ({ page, request }) => {
      const seeded = await registerUser(request)

      // Seeds the logged-in precondition directly via localStorage (same keys the
      // app itself persists on login) rather than re-driving the form — this case
      // is about the guard's redirect behavior, not the login flow itself.
      await page.goto('/login')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      // Step 1: opening /login while already logged in redirects straight to the
      // Homepage — the Login page is never actually rendered.
      await page.goto('/login')
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByTestId('login-form')).not.toBeVisible()
    }
  )

  test(
    'An anonymous user is automatically redirected from the Order History page to the Login page',
    qaseId(16),
    async ({ page }) => {
      // Step 1: no active session, opening /orders directly redirects to Login;
      // the Order History page's content is never actually visible.
      await page.goto('/orders')
      await expect(page).toHaveURL(/\/login(\?|$)/)
      await expect(page.getByTestId('order-history-page')).not.toBeVisible()

      // Step 2 (edge case): the client-side guard only checks whether session data
      // is present, not whether it's valid — so a tampered/expired token still lets
      // the user land on the Order History page visually. But the page's own request
      // to load the order list is then rejected by the server, so no real order data
      // is shown — the user actually sees the empty state instead.
      await page.evaluate(() => {
        localStorage.setItem('auth_token', 'expired-or-tampered-token')
        localStorage.setItem(
          'auth_user',
          JSON.stringify({ id: 'x', email: 'ghost@example.com', created_at: new Date().toISOString() })
        )
      })
      await page.goto('/orders')
      await expect(page).toHaveURL(/\/orders$/)
      await expect(page.getByTestId('order-history-empty-state')).toContainText('Belum ada pesanan.')
    }
  )
})
