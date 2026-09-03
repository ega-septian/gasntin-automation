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

export interface OrderItem {
  id: string
  product_id: string | null
  product_name: string
  brand: string
  size: string
  unit_price: number
  quantity: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  recipient_name: string
  phone: string
  address: string
  total_amount: number
  status: string
  created_at: string
  items: OrderItem[]
}

/**
 * Precondition helper — places an order through the public Checkout endpoint,
 * which consumes real stock server-side. Used by the Cart suite to change a
 * product/size's real stock as a background action, without going through
 * the browser's own cart. Fails fast if placing the order itself fails.
 */
export async function placeOrder(
  request: APIRequestContext,
  token: string,
  payload: CheckoutPayload
): Promise<Order> {
  const res = await checkout(request, token, payload)
  if (res.status() !== 201) {
    throw new Error(
      `Placing an order failed: expected 201, got ${res.status()} — ${await res.text()}`
    )
  }
  return res.json()
}
