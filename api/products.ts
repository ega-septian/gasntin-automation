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
