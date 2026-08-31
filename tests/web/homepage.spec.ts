import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { qaseId } from '@support/qase.js'
import { buildProductPayload } from '@data/products.js'

test.describe('WEB > Homepage', () => {
  test(
    'Navbar logo navigates back to the Homepage',
    { ...qaseId(26), tag: ['@regression', '@homepage'] },
    async ({ page, shopPage, homePage }) => {
      // Step 1: open the Shop page.
      await shopPage.open()
      await expect(shopPage.root).toBeVisible()

      // Step 2: click the "SHOP.CO" logo in the navbar.
      await shopPage.navbar.clickLogo()
      await expect(page).toHaveURL(/\/$/)
      await expect(homePage.root).toBeVisible()
    }
  )

  test(
    'Navbar "Shop" link navigates to the Shop page',
    { ...qaseId(27), tag: ['@regression', '@homepage'] },
    async ({ page, homePage, shopPage }) => {
      // Step 1: open the Homepage; the navbar is visible.
      await homePage.open()
      await expect(homePage.navbar.root).toBeVisible()

      // Step 2: click the "Shop" link in the navbar.
      await homePage.navbar.clickShopLink()
      await expect(page).toHaveURL(/\/shop$/)
      await expect(shopPage.root).toBeVisible()
    }
  )

  test(
    'Navbar section links scroll to their corresponding homepage section',
    { ...qaseId(28), tag: ['@regression', '@homepage'] },
    async ({ page, shopPage, homePage }) => {
      // Step 1: from the Shop page, click the "New Arrivals" link in the
      // navbar; it redirects back to the Homepage, scrolled to the "NEW
      // ARRIVALS" section.
      await shopPage.open()
      await shopPage.navbar.clickNewArrivalsLink()
      await expect(page).toHaveURL(/\/#new$/)
      await expect(homePage.newArrivalsSection).toBeInViewport()

      // Step 2: click the "On Sale" link; the page scrolls to the "SHOP BY
      // CATEGORY" section.
      await homePage.navbar.clickSaleLink()
      await expect(homePage.categorySection).toBeInViewport()

      // Step 3: click the "Brands" link; the page scrolls to the "OUR HAPPY
      // CUSTOMERS" section.
      await homePage.navbar.clickBrandsLink()
      await expect(homePage.testimonialsSection).toBeInViewport()
    }
  )

  test(
    'Navbar search box searches for a product and navigates to the Shop page with matching results',
    { ...qaseId(29), tag: ['@regression', '@homepage'] },
    async ({ page, request, homePage, shopPage, seedProduct }) => {
      const { token } = await registerUser(request)
      await seedProduct(token, buildProductPayload({ brand: 'MARVEL' }))

      // Step 1: open the Homepage.
      await homePage.open()

      // Step 2: type "MARVEL" into the search field in the navbar and press
      // Enter; redirected to the Shop page showing the search summary and
      // only matching results.
      await homePage.navbar.search('MARVEL')
      await expect(page).toHaveURL(/\/shop\?q=MARVEL$/)
      await expect(shopPage.searchSummary).toContainText('Hasil pencarian untuk "MARVEL"')

      await expect(shopPage.productCards.first()).toBeVisible()
      const resultCount = await shopPage.productCards.count()
      expect(resultCount).toBeGreaterThan(0)
      for (let i = 0; i < resultCount; i++) {
        const resultText = (await shopPage.productCards.nth(i).innerText()).toLowerCase()
        expect(resultText).toContain('marvel')
      }
    }
  )

  test(
    "Navbar search box with a keyword matching no product shows the Shop page's empty state",
    { ...qaseId(30), tag: ['@regression', '@homepage'] },
    async ({ page, homePage, shopPage }) => {
      // Step 1: open the Homepage.
      await homePage.open()

      // Step 2: type "zzzznotfoundxyz" into the search field in the navbar
      // and press Enter; redirected to the Shop page showing the empty-state
      // message instead of any product cards.
      await homePage.navbar.search('zzzznotfoundxyz')
      await expect(page).toHaveURL(/\/shop/)
      await expect(shopPage.emptyState).toContainText(
        'Tidak ada produk yang cocok dengan filter ini.'
      )
      await expect(shopPage.productCards).toHaveCount(0)
    }
  )
})
