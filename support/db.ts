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
