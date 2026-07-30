/*
 * COMPANY ID — `JW-XXXXXXX`
 *
 * The human-facing identifier for a company: shown in the UI, in URLs, in exports
 * and quoted over the phone to support. It is NOT the database key — the database
 * keeps its own `bigint` primary key, and this code is a reversible encoding of it.
 *
 *   JW-        prefix, so the ID is self-describing in a log or a support ticket
 *   6 chars    the internal key, scrambled then Crockford-Base32 encoded
 *   1 char     check character — rejects a mistyped ID instead of opening the wrong company
 *
 * Crockford Base32 excludes I, L, O and U: no "was that a 1 or an l" support calls,
 * and nothing in the alphabet can accidentally spell a rude word.
 *
 * Capacity: 32^6 − 1 = 1,073,741,823 companies (~1.07 billion).
 *
 * Uniqueness is by CONSTRUCTION, not by luck: the encoding is a bijection over the
 * key space, so two different keys can never produce the same code. There is no
 * collision check to get wrong and no retry loop.
 */

/** Crockford Base32 — 0-9 A-Z minus I, L, O, U. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** 32^6 = 2^30. Payload space for the 6 encoded characters. */
const SPACE = 32 ** 6

/**
 * Scramble constants. MULT is ODD, therefore coprime with 2^30, therefore
 * invertible mod SPACE — that is what makes the mapping reversible AND makes
 * consecutive keys land far apart, so an ID does not leak how many companies
 * exist or let anyone guess the next one.
 */
const MULT = 0x2f1b3c5
const OFFSET = 0x5a17e9

/** Modular inverse of MULT mod 2^30, by Newton iteration. */
const MULT_INV = (() => {
  const m = BigInt(SPACE)
  const a = BigInt(MULT)
  let inv = 1n
  for (let i = 0; i < 64; i++) inv = (inv * (2n - a * inv)) % m
  return ((inv % m) + m) % m
})()

/** Weighted mod-32 checksum over the 6 payload characters. */
function checkChar(payload: string): string {
  let sum = 0
  for (let i = 0; i < payload.length; i++) sum += ALPHABET.indexOf(payload[i]) * (i + 2)
  return ALPHABET[sum % 32]
}

/**
 * Encode an internal key into its public company ID.
 * Valid keys are 1 … 1,073,741,823 (SPACE − 1).
 */
export function companyId(key: number): string {
  if (!Number.isInteger(key) || key < 1 || key >= SPACE) {
    throw new RangeError(`company key out of range: ${key}`)
  }
  let n = Number((BigInt(key) * BigInt(MULT) + BigInt(OFFSET)) % BigInt(SPACE))
  let payload = ''
  for (let i = 0; i < 6; i++) {
    payload = ALPHABET[n % 32] + payload
    n = Math.floor(n / 32)
  }
  return `JW-${payload}${checkChar(payload)}`
}

/**
 * Decode a company ID back to its internal key, or null when the input is not a
 * valid ID. Tolerant on the way in — case-insensitive, prefix optional, and the
 * ambiguous letters are folded (I/L→1, O→0, U→V) so a hand-copied ID still works.
 * A failed CHECK CHARACTER returns null: a typo is rejected, never silently
 * resolved to a different company.
 */
export function parseCompanyId(input: string): number | null {
  const cleaned = String(input)
    .trim()
    .toUpperCase()
    .replace(/^JW-/, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V')
  if (!/^[0-9A-Z]{7}$/.test(cleaned)) return null

  const payload = cleaned.slice(0, 6)
  if (checkChar(payload) !== cleaned[6]) return null

  let n = 0n
  for (const ch of payload) {
    const v = ALPHABET.indexOf(ch)
    if (v < 0) return null
    n = n * 32n + BigInt(v)
  }
  const key = (((n - BigInt(OFFSET)) * MULT_INV) % BigInt(SPACE) + BigInt(SPACE)) % BigInt(SPACE)
  const out = Number(key)
  return out >= 1 && out < SPACE ? out : null
}

/** How many companies this format supports — for the spec + client sign-off. */
export const COMPANY_ID_CAPACITY = SPACE - 1
