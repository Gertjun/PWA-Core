// Eén generiek pairing-protocol voor handmatige koppelcodes en QR-overdracht.
// Apps leveren uitsluitend hun eigen data, context en eventuele extra geheimen aan.
// PIN-generatie, KDF, encryptie, contextbinding, expiratie en replayregistratie blijven Core-eigendom.

import { randomBytes } from './crypto.js';

const FORMAT = 'pwa-core-pairing';
const VERSION = 2;
const PREFIX = 'PWA-CORE-PAIR-2:';
const LEGACY_PREFIXES = ['PWK1.', 'PWK2.', 'PWA-CORE-PAIR-1:', 'CPK1.', 'CPK2.'];
const PIN_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const PIN_LENGTH = 16;
const TTL_MS = 3 * 60 * 1000;
const KDF_ITERATIONS = 600000;
const MAX_SECRETS = 8;
const MAX_SECRET_BYTES = 4096;
const MAX_PLAINTEXT_BYTES = 12000;
const MAX_TEXT_CODE_CHARS = 24000;
const MAX_QR_CODE_CHARS = 2200;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    throw new Error(`De koppelcode bevat een ongeldige ${label}.`);
  }
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  let binary;
  try { binary = atob(padded); } catch { throw new Error(`De koppelcode bevat een ongeldige ${label}.`); }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function validateContext(context) {
  if (typeof context !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(context)) {
    throw new TypeError('context moet een vaste app-identificatie van 1–128 veilige tekens zijn.');
  }
}

export function normalizePin(pin) {
  return String(pin ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function validatePin(pin) {
  const normalized = normalizePin(pin);
  if (normalized.length !== PIN_LENGTH || [...normalized].some((character) => !PIN_CHARS.includes(character))) {
    throw new TypeError('De pincode moet 16 tekens bevatten, bijvoorbeeld AB3D-7KMP-9Q2R-5TUV.');
  }
  return normalized;
}

/** Genereert een uniforme 16-teken-PIN met rejection sampling (geen modulo-bias). */
export function newPin() {
  let result = '';
  const limit = Math.floor(256 / PIN_CHARS.length) * PIN_CHARS.length;
  while (result.length < PIN_LENGTH) {
    for (const value of randomBytes(32)) {
      if (value >= limit) continue;
      result += PIN_CHARS[value % PIN_CHARS.length];
      if (result.length === PIN_LENGTH) break;
    }
  }
  return result.match(/.{4}/g).join('-');
}

function encodeCredentials(pin, secrets) {
  if (!Array.isArray(secrets) || secrets.length > MAX_SECRETS ||
      secrets.some((secret) => typeof secret !== 'string' || !secret.length)) {
    throw new TypeError(`Geef maximaal ${MAX_SECRETS} aanvullende, niet-lege koppelgeheimen op.`);
  }
  const encoded = [encoder.encode(validatePin(pin)), ...secrets.map((secret) => encoder.encode(secret.normalize('NFC')))];
  if (encoded.some((secret) => secret.length > MAX_SECRET_BYTES)) {
    throw new TypeError('Een koppelgeheim is ongeldig lang.');
  }
  const material = new Uint8Array(4 + encoded.reduce((sum, secret) => sum + 4 + secret.length, 0));
  const view = new DataView(material.buffer);
  view.setUint32(0, encoded.length, false);
  let offset = 4;
  for (const secret of encoded) {
    view.setUint32(offset, secret.length, false);
    offset += 4;
    material.set(secret, offset);
    offset += secret.length;
    secret.fill(0);
  }
  return material;
}

async function derivePairingKey(pin, secrets, salt) {
  const material = encodeCredentials(pin, secrets);
  try {
    const baseKey = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: KDF_ITERATIONS },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  } finally {
    material.fill(0);
  }
}

function additionalData(context, issuedAt, expiresAt) {
  return encoder.encode(`${FORMAT}|${VERSION}|${context}|${issuedAt}|${expiresAt}`);
}

function validateData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(data))) {
    throw new TypeError('De over te dragen koppelgegevens moeten een JSON-object zijn.');
  }
}

function validatePairingId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{32}$/.test(value);
}

function maxCodeLength(transport) {
  if (transport === 'text') return MAX_TEXT_CODE_CHARS;
  if (transport === 'qr') return MAX_QR_CODE_CHARS;
  throw new TypeError('transport moet text of qr zijn.');
}

/**
 * Maakt één protocolenvelop voor iedere transportvorm.
 * De PIN is altijd verplicht; secrets zijn optionele extra factoren in een vaste app-volgorde.
 * transport='qr' hanteert de kleinere QR-limiet; 'text' staat een grotere handmatige code toe.
 */
export async function createPairingCode({
  data, pin, secrets = [], context, now = Date.now(), transport = 'text',
} = {}) {
  validateContext(context);
  validateData(data);
  const maxChars = maxCodeLength(transport);
  if (!Number.isSafeInteger(now) || now < 0) throw new TypeError('Ongeldig tijdstip.');

  const issuedAt = now;
  const expiresAt = issuedAt + TTL_MS;
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const pairingId = bytesToBase64Url(randomBytes(24));
  const key = await derivePairingKey(pin, secrets, salt);
  const plaintext = encoder.encode(JSON.stringify({
    format: FORMAT, version: VERSION, context, issuedAt, expiresAt, pairingId, data,
  }));
  if (plaintext.length > MAX_PLAINTEXT_BYTES) {
    plaintext.fill(0);
    throw new Error('De koppelgegevens zijn te groot voor een veilige overdracht.');
  }

  let ciphertext;
  try {
    ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: additionalData(context, issuedAt, expiresAt), tagLength: 128 },
      key,
      plaintext,
    );
  } finally {
    plaintext.fill(0);
  }

  const envelope = {
    format: FORMAT, version: VERSION, context, issuedAt, expiresAt,
    salt: bytesToBase64Url(salt), iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
  };
  const payload = PREFIX + bytesToBase64Url(encoder.encode(JSON.stringify(envelope)));
  if (payload.length > maxChars) {
    throw new Error(transport === 'qr'
      ? 'De koppelgegevens zijn te groot voor één QR-code. Gebruik de handmatige koppelcode.'
      : 'De handmatige koppelcode is te groot.');
  }
  return { payload, pairingId, issuedAt, expiresAt };
}

/** Ontsleutelt en valideert de Core-envelop; past zelf geen app-instellingen of data toe. */
export async function openPairingCode({
  payload, pin, secrets = [], context, now = Date.now(), transport = 'text',
} = {}) {
  validateContext(context);
  const maxChars = maxCodeLength(transport);
  if (typeof payload !== 'string') throw new TypeError('De koppelcode moet tekst zijn.');
  const text = payload.trim().replace(/\s+/g, '');
  if (LEGACY_PREFIXES.some((prefix) => text.startsWith(prefix))) {
    throw new Error('Deze oude koppelcode wordt niet meer geaccepteerd. Maak op het andere apparaat een nieuwe code.');
  }
  if (!text.startsWith(PREFIX) || text.length > maxChars) {
    throw new Error('Dit is geen geldige PWA-Core-koppelcode.');
  }
  if (!Number.isSafeInteger(now) || now < 0) throw new TypeError('Ongeldig tijdstip.');

  let envelope;
  try {
    envelope = JSON.parse(decoder.decode(base64UrlToBytes(text.slice(PREFIX.length), 'inhoud')));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('De koppelcode bevat')) throw error;
    throw new Error('De koppelcode is beschadigd of onvolledig.');
  }

  if (envelope?.format !== FORMAT || envelope.version !== VERSION ||
      envelope.context !== context ||
      !Number.isSafeInteger(envelope.issuedAt) || !Number.isSafeInteger(envelope.expiresAt)) {
    throw new Error('Deze koppelcode is ongeldig of hoort bij een andere app.');
  }
  if (envelope.expiresAt <= now || now - envelope.issuedAt > TTL_MS) {
    throw new Error('Deze koppelcode is verlopen. Maak op het andere apparaat een nieuwe code.');
  }
  if (envelope.issuedAt > now + 30000 || envelope.expiresAt - envelope.issuedAt !== TTL_MS) {
    throw new Error('De geldigheidsduur van deze koppelcode klopt niet.');
  }

  const salt = base64UrlToBytes(envelope.salt, 'salt');
  const iv = base64UrlToBytes(envelope.iv, 'initialisatievector');
  const ciphertext = base64UrlToBytes(envelope.ciphertext, 'versleutelde inhoud');
  if (salt.length !== 16 || iv.length !== 12 ||
      ciphertext.length < 17 || ciphertext.length > MAX_PLAINTEXT_BYTES + 16) {
    throw new Error('De koppelcode heeft een ongeldige inhoud.');
  }

  const key = await derivePairingKey(pin, secrets, salt);
  let plaintext;
  let decoded;
  try {
    plaintext = new Uint8Array(await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: additionalData(context, envelope.issuedAt, envelope.expiresAt), tagLength: 128 },
      key,
      ciphertext,
    ));
    decoded = JSON.parse(decoder.decode(plaintext));
  } catch {
    throw new Error('De pincode of aanvullende koppelgeheimen kloppen niet, of de code is beschadigd.');
  } finally {
    plaintext?.fill(0);
  }

  if (decoded?.format !== FORMAT || decoded.version !== VERSION ||
      decoded.context !== context || decoded.issuedAt !== envelope.issuedAt ||
      decoded.expiresAt !== envelope.expiresAt || !validatePairingId(decoded.pairingId)) {
    throw new Error('De ontsleutelde koppelgegevens zijn ongeldig.');
  }
  validateData(decoded.data);
  return {
    data: decoded.data,
    pairingId: decoded.pairingId,
    issuedAt: decoded.issuedAt,
    expiresAt: decoded.expiresAt,
  };
}

/** Lokale replayregistratie; zonder server is dit geen globale eenmaligheid. */
export function markPairingUsed(storage, pairingId, {
  storageKey = 'pwa-core:device-pairing:used', now = Date.now(),
} = {}) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('Lokale opslag voor replaybescherming is niet beschikbaar.');
  }
  if (!validatePairingId(pairingId)) throw new TypeError('Ongeldige pairing-ID.');
  if (typeof storageKey !== 'string' || !/^[A-Za-z0-9._:-]{1,160}$/.test(storageKey)) {
    throw new TypeError('Ongeldige opslagnaam voor replaybescherming.');
  }
  if (!Number.isSafeInteger(now) || now < 0) throw new TypeError('Ongeldig tijdstip.');

  let entries = [];
  const stored = storage.getItem(storageKey);
  if (stored !== null) {
    try { entries = JSON.parse(stored); }
    catch { throw new Error('De lokale replayhistorie is beschadigd; deze wordt niet automatisch gewist.'); }
    if (!Array.isArray(entries) || entries.some((entry) =>
      !entry || !validatePairingId(entry.pairingId) ||
      !Number.isSafeInteger(entry.usedAt) || entry.usedAt < 0)) {
      throw new Error('De lokale replayhistorie is ongeldig; deze wordt niet automatisch gewist.');
    }
  }

  entries = entries.filter((entry) => now - entry.usedAt <= 10 * 60 * 1000 && entry.usedAt <= now + 30000);
  if (entries.some((entry) => entry.pairingId === pairingId)) {
    throw new Error('Deze koppelcode is op dit apparaat al gebruikt. Maak een nieuwe code.');
  }
  entries.push({ pairingId, usedAt: now });
  storage.setItem(storageKey, JSON.stringify(entries.slice(-32)));
}

export const PAIRING_TTL_MS = TTL_MS;
export const PAIRING_KDF_ITERATIONS = KDF_ITERATIONS;
export const PAIRING_PIN_LENGTH = PIN_LENGTH;
export const PAIRING_TEXT_MAX_CHARS = MAX_TEXT_CODE_CHARS;
export const PAIRING_QR_MAX_CHARS = MAX_QR_CODE_CHARS;
