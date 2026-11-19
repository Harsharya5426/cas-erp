import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '../config/env.js';

const scryptAsync = promisify(crypto.scrypt);
const SCRYPT_KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const actualBuf = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer;
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export function sha256Hex(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function verifyHmacSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
  encoding: 'hex' | 'base64' = 'base64'
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest(encoding);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

// Field-level AES-256-GCM encryption for MFA secrets & sensitive templates
function getAesKey(): Buffer {
  return crypto.createHash('sha256').update(env.FIELD_ENCRYPTION_KEY).digest();
}

export function encryptSensitiveValue(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getAesKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSensitiveValue(ciphertext: string): string {
  const [ivStr, tagStr, dataStr] = ciphertext.split('.');
  if (!ivStr || !tagStr || !dataStr) {
    throw new Error('Malformed encrypted payload');
  }
  const iv = Buffer.from(ivStr, 'base64url');
  const tag = Buffer.from(tagStr, 'base64url');
  const data = Buffer.from(dataStr, 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getAesKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// RFC 6238 TOTP (Base32)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function computeTotpCode(secret: string, timestampMs = Date.now(), stepSec = 30): string {
  const counter = Math.floor(timestampMs / 1000 / stepSec);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const key = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(codeInt % 1_000_000).padStart(6, '0');
}

export function verifyTotpCode(secret: string, candidateCode: string, windowSteps = 1): boolean {
  const normalized = candidateCode.trim();
  if (!/^\d{6}$/.test(normalized)) return false;
  const now = Date.now();
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const expected = computeTotpCode(secret, now + delta * 30_000);
    if (crypto.timingSafeEqual(Buffer.from(normalized), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

