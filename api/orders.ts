import type { APIRequestContext, APIResponse } from '@playwright/test'
import { API_BASE_URL } from '../playwright.config.js'
import { authHeaders } from './auth.js'

export interface CheckoutItemPayload {
  product_id: string
  size: string
  quantity: number
}

export interface CheckoutPayload {
  recipient_name: string
  phone: string
  address: string
  items: CheckoutItemPayload[]
}

/**
 * Raw action — no assertions inside; the spec asserts on the response itself
 * since this endpoint is the subject under test. Requires auth — there is no
 * guest checkout path on this site (see order_handler.go). Pass `token` as
 * `undefined` to send the request with no Authorization header at all.
 */
export function checkout(
  request: APIRequestContext,
  token: string | undefined,
  payload: CheckoutPayload
): Promise<APIResponse> {
  return request.post(`${API_BASE_URL}/api/orders`, {
    headers: token ? authHeaders(token) : undefined,
    data: payload,
  })
}

/**
 * Valid-shaped checkout body with sane defaults, so specs only need to
 * override the `items` (or another field) they actually care about.
 */
export function buildCheckoutPayload(overrides: Partial<CheckoutPayload> = {}): CheckoutPayload {
  return {
    recipient_name: 'QA Automation',
    phone: '081234567890',
    address: 'Jl. Automation Testing No. 1, Jakarta',
    items: [],
    ...overrides,
  }
}
