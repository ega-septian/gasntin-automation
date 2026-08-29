import type { APIRequestContext, APIResponse } from '@playwright/test'
import { API_BASE_URL } from '../playwright.config.js'

/**
 * Raw action — no assertions inside; the spec asserts on the response itself
 * since this endpoint is the subject under test. Public endpoint, no auth.
 */
export function listAssets(request: APIRequestContext): Promise<APIResponse> {
  return request.get(`${API_BASE_URL}/api/assets`)
}
