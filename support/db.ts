/**
 * Database access used by the one assertion that cannot be made through the API:
 * proving the stored password is a bcrypt hash, not plain text. The API
 * deliberately never returns password_hash, so there is no other way to check it.
 *
 * DATABASE_URL is a required precondition, verified up front by global-setup.ts —
 * by the time this runs it is expected to be set and reachable.
 */

export interface UserRow {
  id: string
  email: string
  password_hash: string
  created_at: string
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

  await client.connect()
  try {
    const { rows } = await client.query<UserRow>(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    )
    return rows[0] ?? null
  } finally {
    await client.end()
  }
}

/** bcrypt hashes always carry a $2a$/$2b$/$2y$ prefix. */
export const BCRYPT_PREFIX = /^\$2[aby]\$/

/**
 * Updates a product's live price directly in the database. Used only by the
 * Order Detail suite's price-immutability case (GASNTIN-64), which needs to
 * change a product's catalog price after an order referencing it has already
 * been placed — there is no admin/API endpoint for updating a product's
 * price (see backend/cmd/api/main.go's route table), so this is arranged
 * directly against the same database the backend uses, matching that case's
 * own stated precondition.
 */
export async function updateProductPrice(productId: string, price: number): Promise<void> {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

  await client.connect()
  try {
    await client.query('UPDATE products SET price = $1 WHERE id = $2', [price, productId])
  } finally {
    await client.end()
  }
}
