# Homepage — Product/PM Spec (Gap Analysis)

**Methodology note:** this was meant to be produced by an isolated `product-manager` subagent with no memory of this project's implementation history, to avoid the reviewer's judgment being colored by known implementation trade-offs. In practice, subagents in this environment cannot get Chrome/browser tool access and `WebFetch` cannot reach `localhost` (see `.claude/agents/product-manager.md`'s platform-limitation note) — so this review was done by the orchestrating Claude directly: live-browsing `http://localhost:5173/` end-to-end (desktop + mobile viewport), clicking through every major path, **without reading any frontend or backend source code**. Judgment below is based only on what was observed on screen, not on any implementation knowledge from earlier in this project's history — flagged explicitly anywhere that distinction matters.

Scope of the review: the homepage and everywhere its own links lead — Shop/filters/search, product detail, cart, checkout, login/logout, order history.

---

## Sufficient / Already Works Well

1. Hero section clearly states a value proposition, has a working "Shop Now" CTA, and shows credibility stats (200+ brands, 2,000+ products, 30,000+ customers).
2. The brand strip (NEVADA/DISNEY/MARVEL/COLE/SUKO) is clickable and correctly deep-links to the Shop page pre-filtered to that brand.
3. "Shop by Category" cards are clickable, show a live product count per category, and correctly deep-link to the Shop page pre-filtered to that category.
4. New Arrivals and Top Selling sections populate with real catalog products, correctly showing discounted price + original price + percentage badge where applicable.
5. The Shop page's filter sidebar (Brand, Gender, Kategori, Sub Kategori, Ukuran) supports multi-select checkboxes, shows counts, and correctly narrows results in combination (tested brand+category together).
6. Product search returns relevant results and clearly labels "Hasil pencarian untuk ...".
7. Product detail page shows per-size stock, a working quantity stepper, and clear "Ditambahkan ✓" feedback on Add to Cart.
8. Cart page is itemized with adjustable quantity, correct subtotal, and item removal.
9. Checkout correctly requires login — an unauthenticated user is redirected to Login and automatically returned to Checkout afterward, without losing their cart.
10. Order confirmation and order history pages are clean and show item/status/date/total correctly.
11. Login/logout works and the navbar reflects session state (Masuk vs. account icon + Keluar).
12. Below-the-fold homepage content (hero banner, brand strip, product grids) reflows to a usable layout on a phone-width viewport.

---

## Missing / Gaps

### Critical

1. **Mobile navbar is missing its core navigation.** At a phone-width viewport (390px), the nav links (Shop, On Sale, New Arrivals, Brands), the search box, and the "Masuk" login button are all absent — only the logo, cart icon, and account icon remain visible. A guest visiting on a phone has no visible way to search, browse via nav, or log in/register at all.
   - *Provenance: observed directly (screenshot at 390×844); no mobile-nav affordance (hamburger menu or equivalent) was found anywhere on the page.*

2. **Product photography is frequently unrelated to the product being sold.** This is systemic, not an isolated case — e.g. "COLE Everyday Casual Shorts" shows a photo of a derelict alley with laundry hanging (no shorts visible at all); the "Atasan" category card shows a rusted corrugated surface; the "Dress" category card shows a foggy horizon with no dress or person visible. A real shopper would likely read this as untrustworthy or broken.
   - *Provenance: observed directly across multiple product cards, product detail pages, and category cards. Quality was inconsistent — MARVEL-brand product photos were mostly on-topic; COLE/DISNEY and the category cards were frequently not.*

### Major

3. **The cart allows a quantity far beyond actual stock with no warning, only failing at final checkout submission.** Set an item's cart quantity to 32 while its real stock was 12; the cart displayed a normal subtotal for all 32 with no indication anything was wrong. The over-limit error only appeared after filling in the full checkout form (name, phone, address) and submitting — discarding that effort.
   - *Provenance: observed directly by reproducing it end-to-end.*

4. **Two navbar links scroll to the wrong section, contradicting their own label.** "On Sale" scrolls to "SHOP BY CATEGORY" (no discount/sale content is shown there); "Brands" scrolls to "OUR HAPPY CUSTOMERS" (testimonials) — not to the brand strip or any brand-related content. Both are actively misleading about where they'll take the user.
   - *Provenance: observed directly by clicking each link and reading the resulting scroll target.*

5. **The newsletter "Subscribe" control does nothing observable.** Entered an email and clicked Subscribe: no confirmation, no error, the field doesn't even clear. To a user this reads as a broken button, not a decorative one.
   - *Provenance: observed directly.*

6. **The Shop page's filter counts don't reflect an active search or filter.** After searching "hoodie" (narrowing results to 3 items, none of them COLE), the sidebar still showed "COLE (4)" — a whole-catalog count, not one scoped to the current results. This is confusing: the visible number doesn't match what clicking that checkbox would actually do.
   - *Provenance: observed directly; UX convention (a filter sidebar's counts should reflect the current result set, per common e-commerce filtering patterns like Matahari/Zalora) is the basis for calling this a gap, not a stated requirement.*

### Minor

7. **Footer links are inert plain text.** About, Features, Works, Career, Customer Support, Delivery Details, Terms & Conditions, Privacy Policy, Account, Manage Deliveries, Orders, Payments — none of them navigate anywhere when clicked, not even to a placeholder.
   - *Provenance: observed directly (clicked "About"; no navigation, no visual change).*

8. **Order number is shown as a raw UUID** (e.g. `18f6c3e0-529d-4a89-af63-728d9ab64f43`) rather than a short, human-readable order number — impractical for a customer to read back over phone/chat support.
   - *Provenance: observed directly on the order confirmation and order history pages.*

9. **Order status is shown as a raw, untranslated value** ("placed", lowercase, English) inconsistent with the rest of the UI, which is otherwise fully in Indonesian.
   - *Provenance: observed directly.*

10. **One product's detail-page image gallery loaded completely blank** (no photo, no placeholder icon) on first visit, though a second product's gallery loaded correctly and reloading the first later also worked. Possibly transient/intermittent rather than a hard rule — flagged for a follow-up check, not asserted as a confirmed systemic bug.
    - *Provenance: observed directly; not reproduced a second time on the same product in this session.*

---

## Open Questions

1. Is "on sale"/discounted browsing meant to be its own dedicated section, or is "Shop by Category" intentionally what "On Sale" should point to (i.e., just a mislabel to fix)?
2. Is the newsletter subscription meant to be a real, working feature at this stage, or is it acceptable as a decorative placeholder for now?
3. Should "Brands" have its own dedicated browsing destination (e.g. a brand-listing page), rather than only the always-visible homepage strip?
4. Is a functional footer (About/Terms/Privacy/Support/etc.) in scope for the current stage of this product, or explicitly deferred?

*(These were not resolved with the user before writing this spec — they should be answered before or alongside turning the "Missing/Gaps" section into committed functional requirements in the PRD, especially items 1–3 which affect what the PRD should say the correct behavior even is.)*
