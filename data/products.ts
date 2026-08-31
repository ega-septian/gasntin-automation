import type { CreateProductPayload } from '../api/products.js'

/**
 * Valid-shaped product payload with sane defaults. Override only the
 * field(s) a test actually cares about, so specs stay readable as the
 * request body grows instead of hardcoding every field at every call site.
 * Same pattern as data/users.ts's buildRegisterPayload.
 */
export function buildProductPayload(overrides: Partial<CreateProductPayload> = {}): CreateProductPayload {
  return {
    brand: 'NEVADA',
    name: `Seed Product ${Date.now()}-${Math.random().toString(36).slice(2)}`,
    gender: 'Pria',
    category: 'Atasan',
    subcategory: 'Kaos',
    price: 100000,
    sizes: [{ size: 'M', stock: 10 }],
    ...overrides,
  }
}
