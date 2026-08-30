import type { APIRequestContext, APIResponse } from '@playwright/test'
import { API_BASE_URL } from '../playwright.config.js'

export interface ListProductsParams {
  sort?: string
  limit?: number | string
  brand?: string | string[]
  gender?: string | string[]
  category?: string | string[]
  subcategory?: string | string[]
  size?: string | string[]
  q?: string
}

/**
 * Raw action — no assertions inside; the spec asserts on the response itself
 * since this endpoint is the subject under test. Public endpoint, no auth.
 * Array-valued params are sent as repeated query params (checklist-style
 * multi-select), matching how the Shop page's filters work.
 */
export function listProducts(
  request: APIRequestContext,
  params: ListProductsParams = {}
): Promise<APIResponse> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    for (const v of Array.isArray(value) ? value : [value]) {
      query.append(key, String(v))
    }
  }
  const qs = query.toString()
  return request.get(`${API_BASE_URL}/api/products${qs ? `?${qs}` : ''}`)
}

/**
 * Raw action — no assertions inside; the spec asserts on the response itself
 * since this endpoint is the subject under test. Public endpoint, no auth.
 * Returns the Shop page's/homepage's filter facets (brand, gender, category,
 * subcategory, size), each with a live count.
 */
export function getProductFilters(request: APIRequestContext): Promise<APIResponse> {
  return request.get(`${API_BASE_URL}/api/products/filters`)
}

/**
 * Raw action — no assertions inside; the spec asserts on the response itself
 * since this endpoint is the subject under test. Public endpoint, no auth.
 * Returns one product's detail: per-size stock (`sizes`) and gallery images.
 */
export function getProduct(request: APIRequestContext, id: string): Promise<APIResponse> {
  return request.get(`${API_BASE_URL}/api/products/${id}`)
}

export interface ProductStock {
  productId: string
  productName: string
  size: string
  stock: number
}

/**
 * Precondition helper — scans the live catalog for a product+size that
 * currently has at least `minStock` units available, and returns its exact
 * current stock. Checkout tests need a *known* stock number (N) to build a
 * valid boundary/over-limit payload; reading it live here (instead of
 * hardcoding a number) is what keeps the test correct as seed data drifts.
 *
 * Picks randomly among every eligible product+size rather than always the
 * first match, since the exact-stock-boundary case (case 53) always drains
 * whatever it picks down to 0 — spreading that across the catalog instead of
 * repeatedly hammering the same item delays exhausting all stock to zero.
 *
 * Throws if nothing in the catalog qualifies — this is a required
 * precondition for the Checkout suite, not something to skip.
 */
export async function findProductWithStock(
  request: APIRequestContext,
  minStock: number
): Promise<ProductStock> {
  const listRes = await listProducts(request, { limit: 200 })
  if (listRes.status() !== 200) {
    throw new Error(
      `Looking up products failed: expected 200, got ${listRes.status()} — ${await listRes.text()}`
    )
  }
  const products: Array<{ id: string; name: string }> = await listRes.json()

  const eligible: ProductStock[] = []
  for (const product of products) {
    const detailRes = await getProduct(request, product.id)
    if (detailRes.status() !== 200) continue
    const detail: { name: string; sizes: Array<{ size: string; stock: number }> } =
      await detailRes.json()
    for (const s of detail.sizes) {
      if (s.stock >= minStock) {
        eligible.push({ productId: product.id, productName: detail.name, size: s.size, stock: s.stock })
      }
    }
  }

  if (eligible.length === 0) {
    throw new Error(
      `No product+size in the catalog currently has at least ${minStock} unit(s) of stock. ` +
        'The Checkout suite needs at least one such product+size to run — seed the catalog with stock first.'
    )
  }

  return eligible[Math.floor(Math.random() * eligible.length)]
}
