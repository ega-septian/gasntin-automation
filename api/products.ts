import type { APIRequestContext, APIResponse } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { API_BASE_URL } from '../playwright.config.js'
import { authHeaders } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Reused as the placeholder image for every seeded product's gallery. */
const SEED_IMAGE_PATH = path.join(__dirname, '../fixtures/test-asset.png')

/** Mirrors models.MaxProductImages — CreateProduct rejects any other count. */
const MAX_PRODUCT_IMAGES = 3

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
        eligible.push({
          productId: product.id,
          productName: detail.name,
          size: s.size,
          stock: s.stock,
        })
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

export interface Product {
  id: string
  brand: string
  name: string
  description: string
  gender: string
  category: string
  subcategory: string
  price: number
  discount: number
  total_sold: number
  image_url: string | null
  created_at: string
}

export interface Sale {
  id: string
  product_id: string
  quantity: number
  sold_at: string
}

export interface CreateProductPayload {
  brand: string
  name: string
  description?: string
  gender: string
  category: string
  subcategory?: string
  price: number
  discount?: number
  sizes?: Array<{ size: string; stock: number }>
}

/**
 * Raw action — no assertions inside; the Homepage suite's seeding helper
 * below is what asserts/throws. Requires auth (any valid token — the
 * endpoint doesn't care which account). multipart/form-data since
 * CreateProduct requires exactly MAX_PRODUCT_IMAGES image files per product;
 * the same placeholder image (SEED_IMAGE_PATH) is reused for all of them —
 * only the product's own fields matter for what these tests assert.
 */
export function createProduct(
  request: APIRequestContext,
  token: string,
  payload: CreateProductPayload
): Promise<APIResponse> {
  const form = new FormData()
  form.set('brand', payload.brand)
  form.set('name', payload.name)
  form.set('description', payload.description ?? '')
  form.set('gender', payload.gender)
  form.set('category', payload.category)
  form.set('subcategory', payload.subcategory ?? '')
  form.set('price', String(payload.price))
  form.set('discount', String(payload.discount ?? 0))
  if (payload.sizes) {
    form.set('sizes', JSON.stringify(payload.sizes))
  }

  const imageBytes = fs.readFileSync(SEED_IMAGE_PATH)
  for (let i = 0; i < MAX_PRODUCT_IMAGES; i++) {
    form.append('images', new Blob([imageBytes], { type: 'image/png' }), `seed-product-${i}.png`)
  }

  return request.post(`${API_BASE_URL}/api/products`, {
    headers: authHeaders(token),
    multipart: form,
  })
}

/**
 * Raw action — no assertions inside. Requires auth (any valid token). Soft-
 * deletes a product server-side (see the backend's ProductRepo.SoftDelete) —
 * used to clean up test-seeded products after a test runs; the storefront
 * itself never calls this endpoint.
 */
export function deleteProduct(
  request: APIRequestContext,
  token: string,
  id: string
): Promise<APIResponse> {
  return request.delete(`${API_BASE_URL}/api/products/${id}`, {
    headers: authHeaders(token),
  })
}

/**
 * Raw action — no assertions inside. Requires auth. Logs a sale event for an
 * existing product, feeding the "best_selling" sort.
 */
export function recordSale(
  request: APIRequestContext,
  token: string,
  productId: string,
  quantity: number
): Promise<APIResponse> {
  return request.post(`${API_BASE_URL}/api/products/${productId}/sales`, {
    headers: authHeaders(token),
    data: { quantity },
  })
}

/**
 * Precondition helper — creates a product through the public CreateProduct
 * endpoint (rather than a direct DB insert) so the Homepage suite's
 * assertions can target known, freshly-created data instead of assuming the
 * environment's catalog already contains a matching product. Fails fast if
 * seeding itself fails.
 */
export async function seedProduct(
  request: APIRequestContext,
  token: string,
  payload: CreateProductPayload
): Promise<Product> {
  const res = await createProduct(request, token, payload)
  if (res.status() !== 201) {
    throw new Error(
      `Seeding a product failed: expected 201, got ${res.status()} — ${await res.text()}`
    )
  }
  return res.json()
}

/**
 * Precondition helper — records a sale for an already-seeded product. Fails
 * fast if seeding itself fails.
 */
export async function seedSale(
  request: APIRequestContext,
  token: string,
  productId: string,
  quantity: number
): Promise<Sale> {
  const res = await recordSale(request, token, productId, quantity)
  if (res.status() !== 201) {
    throw new Error(
      `Seeding a sale failed: expected 201, got ${res.status()} — ${await res.text()}`
    )
  }
  return res.json()
}
