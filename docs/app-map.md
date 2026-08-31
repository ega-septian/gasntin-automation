# SHOP.CO — App Map

A factual inventory of pages/routes that actually exist in the app. This is **structural fact, not business logic** — it exists so `product-manager` and `qa-tester` can check "does this page exist" without opening router files each time, and never again describe/test a page that was never built (see KAN-1's Jira history: several early WEB Login test cases assumed a "Dashboard" page/route that never existed or was ever planned — this file exists to stop that specific failure mode from recurring).

**This file only records what pages exist and whether they require login — never what a page *should* do.** Expected behavior always comes from a Confluence PRD or a `product-manager` spec, per `CLAUDE.md`'s three-agent architecture. Reading this file is not "reading implementation code to decide correctness" — it's the same kind of factual reference a sitemap or IA doc would give a new QA hire on day one.

**Source of truth:** `../gastinweb/frontend/src/router/index.js`. **Last verified:** 2026-08-31. If a route is added/removed/renamed, update this file in the same change.

## Routes

| Page (QA-friendly name) | URL | Route name | Requires login? | View component |
|---|---|---|---|---|
| Homepage | `{env}/` | `home` | No | `HomeView.vue` |
| Login | `{env}/login` | `login` | Guest-only — a logged-in user opening this is redirected to Homepage | `LoginView.vue` |
| Shop | `{env}/shop` | `shop` | No | `ShopView.vue` |
| Product Detail | `{env}/products/:id` | `product-detail` | No | `ProductDetailView.vue` |
| Cart | `{env}/cart` | `cart` | No | `CartView.vue` |
| Checkout | `{env}/checkout` | `checkout` | **Yes** — anonymous access redirects to Login with `?redirect=` back to Checkout | `CheckoutView.vue` |
| Order History | `{env}/orders` | `orders` | **Yes** — same redirect pattern | `OrderHistoryView.vue` |
| Order Detail | `{env}/orders/:id` | `order-detail` | **Yes** — same redirect pattern | `OrderDetailView.vue` |

## Explicitly confirmed NOT to exist

- **"Dashboard"** — no route, no view, never planned (confirmed by the product owner, 2026-08-31). Post-login, the app lands on the **Homepage**, not a separate authenticated landing page. If you see any reference to a "Dashboard" page in older docs/specs/Qase cases, it's a leftover mistake from before this file existed — correct it, don't automate around it.

## How the login guard actually behaves (structural fact, from `router/index.js`'s `beforeEach`)

- `requiresGuest` routes (Login): if already authenticated, redirected to Homepage.
- `requiresAuth` routes (Checkout, Order History, Order Detail): if not authenticated, redirected to Login with the original destination preserved in `?redirect=`, so a successful login sends the user back to where they were headed.
- The guard only checks whether session data (`auth_token`) is *present* in `localStorage` — not whether it's actually valid. A tampered/expired token still passes the guard; whatever the destination page's own API calls do with that invalid token (e.g. fail and render an empty state) is a separate, page-specific behavior — this file doesn't claim to know that for every page, check the page itself or its PRD/spec.
