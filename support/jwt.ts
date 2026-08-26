/**
 * Minimal JWT helpers. Decoding only — never verifies signatures, which is
 * exactly what the test cases ask for (inspect the token the server issued,
 * and craft invalid ones to prove the server rejects them).
 */

export interface JwtHeader {
  alg: string
  typ?: string
}

export interface JwtPayload {
  sub: string
  email: string
  iat: number
  exp: number
  [claim: string]: unknown
}

export interface DecodedJwt {
  header: JwtHeader
  payload: JwtPayload
  signature: string
}

function base64UrlDecode(part: string): string {
  return Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

function base64UrlEncode(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function decodeJwt(token: string): DecodedJwt {
  const [header, payload, signature] = token.split('.')
  return {
    header: JSON.parse(base64UrlDecode(header)),
    payload: JSON.parse(base64UrlDecode(payload)),
    signature,
  }
}

/** Keeps header and payload intact but corrupts the signature. */
export function withTamperedSignature(token: string): string {
  const [header, payload, signature] = token.split('.')
  const flipped = signature
    .split('')
    .map((c) => (c === 'A' ? 'B' : 'A'))
    .join('')
  return `${header}.${payload}.${flipped}`
}

/** Classic "alg: none" downgrade attempt, keeping the original claims. */
export function asAlgNoneToken(token: string): string {
  const { payload } = decodeJwt(token)
  return `${base64UrlEncode({ alg: 'none', typ: 'JWT' })}.${base64UrlEncode(payload)}.`
}
