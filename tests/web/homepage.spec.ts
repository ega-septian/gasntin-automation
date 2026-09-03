import { test, expect } from './fixtures/fixtures.js'
import { registerUser } from '@api/auth.js'
import { listProducts, seedSale, type Product } from '@api/products.js'
import { qaseId } from '@support/qase.js'
import { buildProductPayload } from '@data/products.js'
import { LoginPage } from './pages/LoginPage.js'

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
      await expect(homePage.newArrivalsSection).toBeInViewport({ ratio: 0.5 })

      // Step 2: click the "On Sale" link; the page scrolls to the "SHOP BY
      // CATEGORY" section.
      await homePage.navbar.clickSaleLink()
      await expect(page).toHaveURL(/\/#sale$/)
      await expect(homePage.categorySection).toBeInViewport({ ratio: 0.5 })

      // Step 3: click the "Brands" link; the page scrolls to the "OUR HAPPY
      // CUSTOMERS" section.
      await homePage.navbar.clickBrandsLink()
      await expect(page).toHaveURL(/\/#brands$/)
      await expect(homePage.testimonialsSection).toBeInViewport({ ratio: 0.5 })
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

  test(
    "Navbar cart icon reflects the cart's item count and navigates to the Cart page",
    { ...qaseId(31), tag: ['@regression', '@homepage'] },
    async ({ page, request, homePage, productDetailPage, cartPage, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(token, buildProductPayload())

      // Step 1: open the Homepage with an empty cart; the cart icon shows no
      // item-count badge.
      await homePage.open()
      await expect(homePage.navbar.cartBadge).not.toBeVisible()

      // Step 2: open the product's detail page, click "Add to Cart", then
      // return to the Homepage; the cart icon now shows a badge with the
      // correct item count.
      await productDetailPage.open(product.id)
      await productDetailPage.addToCart()
      await homePage.open()
      await expect(homePage.navbar.cartBadge).toHaveText('1')

      // Step 3: click the cart icon; redirected to the Cart page, showing
      // the item that was added.
      await homePage.navbar.clickCart()
      await expect(page).toHaveURL(/\/cart$/)
      await expect(cartPage.root).toBeVisible()
      await expect(cartPage.itemName).toHaveText(product.name)
    }
  )

  test(
    'Guest sees a "Masuk" button in the navbar that opens the Login page',
    { ...qaseId(32), tag: ['@regression', '@homepage'] },
    async ({ page, homePage }) => {
      // Step 1: open the Homepage while not logged in; the navbar shows a
      // "Masuk" button and no account icon or "Keluar" button.
      await homePage.open()
      await expect(homePage.navbar.ctaButton).toHaveText('Masuk')
      await expect(homePage.navbar.accountButton).not.toBeVisible()
      await expect(homePage.navbar.logoutButton).not.toBeVisible()

      // Step 2: click the "Masuk" button; redirected to the Login page.
      await homePage.navbar.clickCta()
      await expect(page).toHaveURL(/\/login$/)
    }
  )

  test(
    'Logged-in user sees account and logout controls instead of "Masuk", and logging out returns to a logged-out Homepage',
    { ...qaseId(33), tag: ['@smoke', '@homepage'] },
    async ({ page, request, homePage }) => {
      const seeded = await registerUser(request)
      await page.goto('/')
      await page.evaluate(
        ({ token, user }) => {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        },
        { token: seeded.token, user: seeded.user }
      )

      // Step 1: open the Homepage while logged in; the navbar shows the 👤
      // icon and a "Keluar" button instead of the "Masuk" button.
      await homePage.open()
      await expect(homePage.navbar.accountButton).toBeVisible()
      await expect(homePage.navbar.logoutButton).toHaveText('Keluar')
      await expect(homePage.navbar.ctaButton).not.toBeVisible()

      // Step 2: click the "Keluar" button; the user is logged out and
      // redirected to the Homepage, where the "Masuk" button is shown again.
      await homePage.navbar.clickLogout()
      await expect(page).toHaveURL(/\/$/)
      await expect(homePage.navbar.ctaButton).toHaveText('Masuk')
    }
  )

  test(
    'Promo bar is shown to guests with a "Daftar Sekarang" call to action, and hidden once logged in',
    { ...qaseId(34), tag: ['@regression', '@homepage'] },
    async ({ page, request, homePage }) => {
      const { email, password } = await registerUser(request)

      // Step 1: open the Homepage while not logged in; a promo bar is shown
      // at the top with the acquisition message and a "Daftar Sekarang"
      // button.
      await homePage.open()
      await expect(homePage.promoBar).toContainText(
        'Daftar dan dapatkan diskon 20% untuk pembelian pertama —'
      )
      await expect(homePage.promoBarCta).toHaveText('Daftar Sekarang')

      // Step 2: click the "Daftar Sekarang" button; redirected to the Login
      // page.
      await homePage.promoBarCta.click()
      await expect(page).toHaveURL(/\/login$/)

      // Step 3: log in, then return to the Homepage; the promo bar is no
      // longer displayed.
      const loginPage = new LoginPage(page)
      await loginPage.login(email, password)
      await page.waitForURL(/\/$/)
      await homePage.open()
      await expect(homePage.promoBar).not.toBeVisible()
    }
  )

  test(
    'Hero section\'s "Shop Now" button navigates to the Shop page',
    { ...qaseId(35), tag: ['@regression', '@homepage'] },
    async ({ page, homePage, shopPage }) => {
      // Step 1: open the Homepage; the hero section is displayed with a
      // "Shop Now" button.
      await homePage.open()
      await expect(homePage.heroCta).toHaveText('Shop Now')

      // Step 2: click the "Shop Now" button; redirected to the Shop page.
      await homePage.heroCta.click()
      await expect(page).toHaveURL(/\/shop$/)
      await expect(shopPage.root).toBeVisible()
    }
  )

  test(
    'Clicking a brand in the brand strip navigates to the Shop page pre-filtered to that brand',
    { ...qaseId(36), tag: ['@regression', '@homepage'] },
    async ({ page, request, homePage, shopPage, seedProduct }) => {
      const { token } = await registerUser(request)
      await seedProduct(token, buildProductPayload({ brand: 'SUKO' }))

      // Step 1: open the Homepage and locate the brand strip below the hero
      // section; it lists NEVADA, DISNEY, MARVEL, COLE, and SUKO.
      await homePage.open()
      await expect(homePage.brandItems).toHaveText(['NEVADA', 'DISNEY', 'MARVEL', 'COLE', 'SUKO'])

      // Step 2: click "SUKO" in the brand strip; redirected to the Shop page
      // pre-filtered by that brand, with only SUKO products shown.
      await homePage.clickBrand('SUKO')
      await expect(page).toHaveURL(/\/shop\?brand=SUKO$/)
      await expect(shopPage.brandFilterCheckbox('SUKO')).toBeChecked()

      await expect(shopPage.productCards.first()).toBeVisible()
      const resultCount = await shopPage.productCards.count()
      expect(resultCount).toBeGreaterThan(0)
      for (let i = 0; i < resultCount; i++) {
        const brandText = await shopPage.productCards
          .nth(i)
          .getByTestId('product-brand')
          .innerText()
        expect(brandText).toBe('SUKO')
      }
    }
  )

  test(
    'New Arrivals section displays the newest products and links to their detail and Shop pages',
    { ...qaseId(37), tag: ['@regression', '@homepage'] },
    async ({ page, request, homePage, shopPage, productDetailPage, seedProduct }) => {
      const { token } = await registerUser(request)
      await seedProduct(token, buildProductPayload())

      // Step 1: open the Homepage and locate the "NEW ARRIVALS" section; up
      // to 4 products are displayed, ordered from most to least recently
      // added.
      await homePage.open()
      const newestRes = await listProducts(request, { sort: 'newest' })
      const newestProducts: Product[] = await newestRes.json()
      await expect(homePage.newArrivalsCards).toHaveCount(newestProducts.length)
      for (let i = 0; i < newestProducts.length; i++) {
        await expect(homePage.newArrivalsCards.nth(i).getByTestId('product-brand')).toHaveText(
          newestProducts[i].brand
        )
        await expect(homePage.newArrivalsCards.nth(i).getByTestId('product-name')).toHaveText(
          newestProducts[i].name
        )
      }

      // Step 2: click the first product card; redirected to that product's
      // detail page, showing the same name and brand.
      const firstCard = homePage.newArrivalsCards.first()
      const firstCardBrand = await firstCard.getByTestId('product-brand').innerText()
      const firstCardName = await firstCard.getByTestId('product-name').innerText()
      await firstCard.click()
      await expect(productDetailPage.root).toBeVisible()
      await expect(productDetailPage.brand).toHaveText(firstCardBrand)
      await expect(productDetailPage.name).toHaveText(firstCardName)

      // Step 3: return to the Homepage and click "View All" below the New
      // Arrivals section; redirected to the Shop page.
      await homePage.open()
      await homePage.newArrivalsViewAll.click()
      await expect(page).toHaveURL(/\/shop$/)
      await expect(shopPage.root).toBeVisible()
    }
  )

  test(
    'Top Selling section displays products ordered by total units sold and links to the Shop page',
    { ...qaseId(38), tag: ['@regression', '@homepage'] },
    async ({ page, request, homePage, shopPage, seedProduct }) => {
      const { token } = await registerUser(request)
      const product = await seedProduct(token, buildProductPayload())
      await seedSale(request, token, product.id, 3)

      // Step 1: open the Homepage and locate the "TOP SELLING" section; up
      // to 4 products are displayed, ordered from most to least units sold.
      await homePage.open()
      const bestSellingRes = await listProducts(request, { sort: 'best_selling' })
      const bestSellingProducts: Product[] = await bestSellingRes.json()
      await expect(homePage.topSellingCards).toHaveCount(bestSellingProducts.length)
      for (let i = 0; i < bestSellingProducts.length; i++) {
        await expect(homePage.topSellingCards.nth(i).getByTestId('product-brand')).toHaveText(
          bestSellingProducts[i].brand
        )
        await expect(homePage.topSellingCards.nth(i).getByTestId('product-name')).toHaveText(
          bestSellingProducts[i].name
        )
      }

      // Step 2: click "View All" below the Top Selling section; redirected
      // to the Shop page.
      await homePage.topSellingViewAll.click()
      await expect(page).toHaveURL(/\/shop$/)
      await expect(shopPage.root).toBeVisible()
    }
  )

  test(
    'Shop by Category cards show live product counts and link to the Shop page pre-filtered by category',
    { ...qaseId(39), tag: ['@regression', '@homepage'] },
    async ({ page, request, homePage, shopPage, seedProduct }) => {
      const { token } = await registerUser(request)
      await seedProduct(token, buildProductPayload({ category: 'Outerwear' }))

      // Step 1: open the Homepage and locate the "SHOP BY CATEGORY" section;
      // a card is shown for each category with at least one product, each
      // labeled with its name and a count matching that category's product
      // count. The filters response the page itself fetched on load is used
      // as the source of truth, so a concurrently-running test seeding an
      // unrelated category can't shift the count between the page's own
      // fetch and this assertion.
      const filtersResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/products/filters') && res.request().method() === 'GET'
      )
      await homePage.open()
      const filtersRes = await filtersResponsePromise
      const filters: { category: Array<{ value: string; count: number }> } = await filtersRes.json()
      const expectedCounts = new Map(filters.category.map((opt) => [opt.value, opt.count]))
      expect(expectedCounts.has('Outerwear')).toBe(true)

      const cardTexts = await homePage.categoryCards.allInnerTexts()
      expect(cardTexts).toHaveLength(filters.category.length)
      for (const text of cardTexts) {
        const match = text.trim().match(/^(.+) \((\d+)\)$/)
        expect(match).not.toBeNull()
        const [, name, countStr] = match!
        expect(Number(countStr)).toBe(expectedCounts.get(name))
      }

      // Step 2: click the "Outerwear" card; redirected to the Shop page
      // pre-filtered by that category, with only Outerwear products shown.
      await homePage.clickCategory('Outerwear')
      await expect(page).toHaveURL(/\/shop\?category=Outerwear$/)
      await expect(shopPage.categoryFilterCheckbox('Outerwear')).toBeChecked()

      const outerwearRes = await listProducts(request, { category: 'Outerwear', limit: 24 })
      const outerwearProducts: Product[] = await outerwearRes.json()
      await expect(shopPage.productCards.first()).toBeVisible()
      const actualNames = (await shopPage.productNames()).sort()
      expect(actualNames).toEqual(outerwearProducts.map((p) => p.name).sort())
    }
  )

  test(
    'On a mobile viewport, the navbar reveals nav links and search via a hamburger menu, while the "Masuk" button and cart icon remain visible',
    { ...qaseId(40), tag: ['@regression', '@homepage'] },
    async ({ page, homePage, shopPage }) => {
      // Step 1: open the Homepage with a mobile-width viewport while not
      // logged in; the header shows the logo, "Masuk" button, cart icon, and
      // a hamburger icon, but not the nav links or search box.
      await page.setViewportSize({ width: 390, height: 844 })
      await homePage.open()
      await expect(homePage.navbar.ctaButton).toBeVisible()
      await expect(homePage.navbar.cartButton).toBeVisible()
      await expect(homePage.navbar.mobileMenuToggle).toHaveText('☰')
      await expect(homePage.navbar.shopLink).not.toBeVisible()
      await expect(homePage.navbar.saleLink).not.toBeVisible()
      await expect(homePage.navbar.newArrivalsLink).not.toBeVisible()
      await expect(homePage.navbar.brandsLink).not.toBeVisible()
      await expect(homePage.navbar.searchInput).not.toBeVisible()

      // Step 2: click the hamburger icon; a panel expands showing the
      // search box and the nav links, and the icon becomes a close icon.
      await homePage.navbar.openMobileMenu()
      await expect(homePage.navbar.mobileMenu).toBeVisible()
      await expect(homePage.navbar.mobileSearchInput).toHaveAttribute(
        'placeholder',
        'Cari produk...'
      )
      await expect(homePage.navbar.mobileShopLink).toBeVisible()
      await expect(homePage.navbar.mobileSaleLink).toBeVisible()
      await expect(homePage.navbar.mobileNewArrivalsLink).toBeVisible()
      await expect(homePage.navbar.mobileBrandsLink).toBeVisible()
      await expect(homePage.navbar.mobileMenuToggle).toHaveText('✕')

      // Step 3: with the panel still expanded, click the "Shop" link inside
      // it; redirected to the Shop page, and the panel closes automatically.
      await homePage.navbar.mobileShopLink.click()
      await expect(page).toHaveURL(/\/shop$/)
      await expect(shopPage.root).toBeVisible()
      await expect(shopPage.navbar.mobileMenu).not.toBeVisible()
      await expect(shopPage.navbar.mobileMenuToggle).toHaveText('☰')

      // Step 4: go back to the Homepage, open the hamburger menu again, and
      // submit a search term from the panel; redirected to the Shop page
      // with the search term applied, and the panel closes automatically.
      await homePage.open()
      await homePage.navbar.openMobileMenu()
      await homePage.navbar.searchMobile('hoodie')
      await expect(page).toHaveURL(/\/shop\?q=hoodie$/)
      await expect(shopPage.navbar.mobileMenu).not.toBeVisible()
    }
  )
})
