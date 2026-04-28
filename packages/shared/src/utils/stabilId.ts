/**
 * Deterministischer Hash für stabile Label-IDs in DnD-Bild-Fragen.
 *
 * Aufgerufen mit (frageId, text, index): identische Inputs liefern immer dieselbe
 * 8-char base32-ID. Frontend-Normalizer (Mount) und Migrations-Skript (One-Shot)
 * importieren denselben Algorithmus, damit Pre-Migration-SuS-Antworten
 * (text-keyed) auch nach Migration via ID-Lookup auflösbar bleiben.
 *
 * Algorithmus: SHA-1 über `${frageId}|${text}|${index}`, erste 5 Bytes als
 * base32 (RFC 4648, lowercase ohne Padding).
 */
export function stabilId(frageId: string, text: string, index: number): string {
  const input = `${frageId}|${text}|${index}`
  const hash = sha1(input)
  return base32Lower(hash.slice(0, 5))  // 5 Bytes → 8 base32-Zeichen
}

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

function base32Lower(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += BASE32_ALPHABET[(value >> bits) & 31]
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }
  return out
}

function sha1(input: string): Uint8Array {
  // Minimal SHA-1 Implementation — synchroner Hash für deterministische IDs
  // Quelle: simplified RFC 3174 reference implementation
  const enc = new TextEncoder().encode(input)
  const len = enc.length
  const blockBytes = 64
  const totalBlocks = Math.floor((len + 9 + blockBytes - 1) / blockBytes)
  const buf = new Uint8Array(totalBlocks * blockBytes)
  buf.set(enc)
  buf[len] = 0x80
  const bits = BigInt(len) * 8n
  // length-suffix big-endian 64-bit
  for (let i = 0; i < 8; i++) {
    buf[buf.length - 1 - i] = Number((bits >> BigInt(i * 8)) & 0xffn)
  }
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
  for (let bk = 0; bk < totalBlocks; bk++) {
    const w = new Array<number>(80)
    for (let i = 0; i < 16; i++) {
      const off = bk * blockBytes + i * 4
      w[i] = ((buf[off] << 24) | (buf[off+1] << 16) | (buf[off+2] << 8) | buf[off+3]) >>> 0
    }
    for (let i = 16; i < 80; i++) {
      const v = w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16]
      w[i] = ((v << 1) | (v >>> 31)) >>> 0
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4
    for (let i = 0; i < 80; i++) {
      let f, k
      if (i < 20) { f = (b & c) | ((~b) & d); k = 0x5a827999 }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1 }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc }
      else { f = b ^ c ^ d; k = 0xca62c1d6 }
      const tmp = ((((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0)
      e = d; d = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = tmp
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0
  }
  const out = new Uint8Array(20)
  const w = [h0, h1, h2, h3, h4]
  for (let i = 0; i < 5; i++) {
    out[i*4]   = (w[i] >>> 24) & 0xff
    out[i*4+1] = (w[i] >>> 16) & 0xff
    out[i*4+2] = (w[i] >>> 8)  & 0xff
    out[i*4+3] =  w[i]         & 0xff
  }
  return out
}
