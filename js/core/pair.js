// Koppelcode: een volgend apparaat koppelen zonder repo en token over te typen.
//
// PWK2 gebruikt een willekeurige 16-teken-PIN, PBKDF2-SHA-256 en AES-256-GCM.
// De PIN wordt apart gedeeld; het wachtwoord van de kluis zit niet in de code.

import { bytesToB64, b64ToBytes, randomBytes } from './crypto.js';

const PREFIX = 'PWK2.';
const LEGACY_PREFIX = 'PWK1.';
const FORMAT = 'pwa-core-pair-code';
const VERSION = 2;
const PIN_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const PIN_LENGTH = 16;
const PIN_GROUP = 4;
const ITERATIONS = 600_000;
const TTL_MS = 3 * 60 * 1000;
const MAX_CODE_CHARS = 16_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

function validateAppId(appId) {
  if (typeof appId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(appId)) {
    throw new TypeError('Ongeldige app-identificatie voor de koppelcode.');
  }
}

/** Uniforme willekeurige index via rejection sampling (geen modulo-bias). */
function randomPinCharacters(length) {
  const limit = Math.floor(256 / PIN_CHARS.length) * PIN_CHARS.length;
  let result = '';
  while (result.length < length) {
    for (const value of randomBytes(Math.max(16, (length - result.length) * 2))) {
      if (value >= limit) continue;
      result += PIN_CHARS[value % PIN_CHARS.length];
      if (result.length === length) break;
    }
  }
  return result;
}

/** Nieuwe pincode, bijvoorbeeld "AB3D-7KMP-9Q2R-5TUV". */
export function newPin() {
  const value = randomPinCharacters(PIN_LENGTH);
  return Array.from({ length: PIN_LENGTH / PIN_GROUP }, (_, i) =>
    value.slice(i * PIN_GROUP, (i + 1) * PIN_GROUP)).join('-');
}

export const normalizePin = (pin) => String(pin || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

function validatePin(pin) {
  const normalized = normalizePin(pin);
  if (normalized.length !== PIN_LENGTH || [...normalized].some((char) => !PIN_CHARS.includes(char))) {
    throw new Error('De pincode moet 16 tekens bevatten, bijvoorbeeld AB3D-7KMP-9Q2R-5TUV.');
  }
  return normalized;
}

async function pinKey(pin, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(validatePin(pin)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

const toUrl = (b64) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function fromUrl(s) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('Ongeldige koppelcode.');
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return b64;
}

function additionalData(appId, issuedAt, expiresAt) {
  return enc.encode(`${FORMAT}|${VERSION}|${appId}|${issuedAt}|${expiresAt}`);
}

function validateGithub(github) {
  if (!github || typeof github !== 'object' || Array.isArray(github) ||
      !['owner', 'repo', 'branch', 'path', 'token'].every((key) =>
        typeof github[key] === 'string' && github[key].length > 0 && github[key].length <= 4096)) {
    throw new TypeError('De GitHub-synchronisatiegegevens zijn onvolledig of ongeldig.');
  }
}

/** @param {{owner, repo, branch, path, token}} github */
export async function makePairCode(github, pin, appId, now = Date.now()) {
  validateAppId(appId);
  validateGithub(github);
  validatePin(pin);
  if (!Number.isSafeInteger(now) || now < 0) throw new TypeError('Ongeldig tijdstip.');

  const issuedAt = now;
  const expiresAt = issuedAt + TTL_MS;
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const payload = { format: FORMAT, version: VERSION, app: appId, issuedAt, expiresAt, github };
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: additionalData(appId, issuedAt, expiresAt), tagLength: 128 },
    await pinKey(pin, salt), enc.encode(JSON.stringify(payload)),
  );
  const box = { v: VERSION, s: bytesToB64(salt), i: bytesToB64(iv), d: bytesToB64(data), issuedAt, expiresAt };
  const code = PREFIX + toUrl(bytesToB64(enc.encode(JSON.stringify(box))));
  if (code.length > MAX_CODE_CHARS) throw new Error('De koppelcode is te groot.');
  return code;
}

/** @returns {Promise<{owner, repo, branch, path, token}>} */
export async function readPairCode(code, pin, appId, now = Date.now()) {
  validateAppId(appId);
  const text = String(code || '').trim().replace(/\s+/g, '');
  if (text.startsWith(LEGACY_PREFIX)) {
    throw new Error('Deze oude koppelcode (PWK1) is niet meer veilig genoeg. Maak op het andere apparaat een nieuwe koppelcode.');
  }
  if (!text.startsWith(PREFIX) || text.length > MAX_CODE_CHARS) throw new Error('Dit is geen geldige PWK2-koppelcode.');
  validatePin(pin);
  if (!Number.isSafeInteger(now) || now < 0) throw new TypeError('Ongeldig tijdstip.');

  let box;
  try {
    box = JSON.parse(dec.decode(b64ToBytes(fromUrl(text.slice(PREFIX.length)))));
  } catch {
    throw new Error('De koppelcode is niet compleet of beschadigd. Kopieer hem opnieuw.');
  }
  if (box?.v !== VERSION || !Number.isSafeInteger(box.issuedAt) || !Number.isSafeInteger(box.expiresAt) ||
      box.expiresAt - box.issuedAt !== TTL_MS || box.issuedAt > now + 30_000 ||
      box.expiresAt <= now || now - box.issuedAt > TTL_MS) {
    throw new Error('Deze koppelcode is verlopen of ongeldig. Maak op het andere apparaat een nieuwe code.');
  }
  let salt, iv, ciphertext;
  try {
    salt = b64ToBytes(box.s);
    iv = b64ToBytes(box.i);
    ciphertext = b64ToBytes(box.d);
  } catch {
    throw new Error('De koppelcode bevat ongeldige versleutelingsgegevens.');
  }
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 17 || ciphertext.length > 12_000) {
    throw new Error('De koppelcode bevat ongeldige versleutelingsgegevens.');
  }

  let payload;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: additionalData(appId, box.issuedAt, box.expiresAt), tagLength: 128 },
      await pinKey(pin, salt), ciphertext,
    );
    payload = JSON.parse(dec.decode(plain));
  } catch {
    throw new Error('De pincode klopt niet bij deze koppelcode, of de code is beschadigd.');
  }
  if (payload?.format !== FORMAT || payload.version !== VERSION || payload.app !== appId ||
      payload.issuedAt !== box.issuedAt || payload.expiresAt !== box.expiresAt) {
    throw new Error('Deze koppelcode hoort niet bij deze app of is ongeldig.');
  }
  validateGithub(payload.github);
  return payload.github;
}

export const PAIR_CODE_TTL_MS = TTL_MS;
export const PAIR_CODE_KDF_ITERATIONS = ITERATIONS;
export const PAIR_CODE_PIN_LENGTH = PIN_LENGTH;
