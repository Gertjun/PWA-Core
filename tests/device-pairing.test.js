import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  createPairingCode,
  openPairingCode,
  newPin,
  normalizePin,
  markPairingUsed,
  PAIRING_TTL_MS,
  PAIRING_KDF_ITERATIONS,
  PAIRING_PIN_LENGTH,
  PAIRING_QR_MAX_CHARS,
} from '../js/core/pair.js';
import {
  createPairingPayload,
  openPairingPayload,
} from '../js/core/device-pairing.js';

globalThis.crypto ??= webcrypto;

const context = 'com.example.test-app';
const pin = 'AB3D-7KMP-9Q2R-5TUV';
const syncConfig = {
  owner: 'synthetic-owner',
  repo: 'synthetic-repo',
  branch: 'main',
  path: 'sync/data.json',
  token: 'synthetic-token-only',
};

test('PIN-generator levert 16 geldige tekens in vier groepen', () => {
  const generated = newPin();
  assert.match(generated, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}(?:-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}){3}$/);
  assert.equal(normalizePin(generated).length, PAIRING_PIN_LENGTH);
  assert.equal(PAIRING_PIN_LENGTH * Math.log2(31) > 79, true);
});

test('handmatige koppeling draagt uitsluitend synchronisatieconfiguratie over', async () => {
  const now = 1794900000000;
  const created = await createPairingCode({ syncConfig, pin, context, now, transport: 'text' });
  assert.equal(created.expiresAt - created.issuedAt, PAIRING_TTL_MS);
  assert.equal(PAIRING_KDF_ITERATIONS, 600000);
  assert.equal(created.payload.startsWith('PWA-CORE-PAIR-2:'), true);
  assert.equal(created.payload.includes('synthetic-token-only'), false);
  const opened = await openPairingCode({ payload: created.payload, pin, context, now: now + 1000 });
  assert.deepEqual(opened.syncConfig, syncConfig);
  assert.equal(opened.pairingId, created.pairingId);
  assert.equal('data' in opened, false);
});

test('dezelfde Core-envelop ondersteunt QR en handmatige code met afzonderlijke transportlimieten', async () => {
  const created = await createPairingPayload({ syncConfig, pin, context, transport: 'qr' });
  assert.equal(created.payload.length <= PAIRING_QR_MAX_CHARS, true);
  const opened = await openPairingPayload({ payload: created.payload, pin, context });
  assert.deepEqual(opened.syncConfig, syncConfig);
  await assert.rejects(
    createPairingPayload({ syncConfig: { ...syncConfig, path: `sync/${'x'.repeat(2300)}.json` }, pin, context, transport: 'qr' }),
    /te groot voor één QR-code/,
  );
  const largeSyncConfig = { ...syncConfig, path: `sync/${'x'.repeat(2300)}.json` };
  const text = await createPairingCode({ syncConfig: largeSyncConfig, pin, context, transport: 'text' });
  assert.deepEqual((await openPairingCode({ payload: text.payload, pin, context, transport: 'text' })).syncConfig, largeSyncConfig);
  await assert.rejects(openPairingPayload({ payload: text.payload, pin, context }), /geen geldige PWA-Core-koppelcode/);
});

test('contextbinding voorkomt gebruik in een andere app', async () => {
  const created = await createPairingCode({ syncConfig, pin, context });
  await assert.rejects(openPairingCode({ payload: created.payload, pin, context: 'com.example.other-app' }), /andere app/);
});

test('verlopen codes en ongeldige klokwaarden worden geweigerd', async () => {
  const now = 1794900000000;
  const created = await createPairingCode({ syncConfig, pin, context, now });
  await assert.rejects(openPairingCode({ payload: created.payload, pin, context, now: now + PAIRING_TTL_MS + 1 }), /verlopen/);
  await assert.rejects(openPairingCode({ payload: created.payload, pin, context, now: now - 60000 }), /geldigheidsduur/);
});

test('verkeerde PIN, gewijzigde ciphertext en legacy-protocollen worden geweigerd', async () => {
  const created = await createPairingCode({ syncConfig, pin, context });
  await assert.rejects(openPairingCode({ payload: created.payload, pin: 'CD4E-8KNP-2R3S-6UVW', context }), /kloppen niet/);
  const prefix = 'PWA-CORE-PAIR-2:';
  const envelope = JSON.parse(Buffer.from(created.payload.slice(prefix.length), 'base64url').toString('utf8'));
  envelope.ciphertext = (envelope.ciphertext[0] === 'A' ? 'B' : 'A') + envelope.ciphertext.slice(1);
  const altered = prefix + Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url');
  await assert.rejects(openPairingCode({ payload: altered, pin, context }), /kloppen niet/);
  for (const legacy of ['PWK1.old', 'PWK2.old', 'CPK1.old', 'CPK2.old', 'PWA-CORE-PAIR-1:old']) {
    await assert.rejects(openPairingCode({ payload: legacy, pin, context }), /oude koppelcode/);
  }
});

test('ongeldige PINs, contexten en synchronisatieconfiguraties worden vóór encryptie geweigerd', async () => {
  await assert.rejects(createPairingCode({ syncConfig, pin: 'ABCD-1234', context }), /16 tekens/);
  await assert.rejects(createPairingCode({ syncConfig: [], pin, context }), /JSON-object/);
  await assert.rejects(createPairingCode({ syncConfig: new Date(), pin, context }), /JSON-object/);
  await assert.rejects(createPairingCode({ syncConfig: { ...syncConfig, vaultData: { records: [1, 2, 3] } }, pin, context }), /uitsluitend owner, repo, branch, path en token/);
  await assert.rejects(createPairingCode({ syncConfig: { ...syncConfig, token: '' }, pin, context }), /token moet een tekstwaarde/);
  await assert.rejects(createPairingCode({ syncConfig: { ...syncConfig, token: 123 }, pin, context }), /token moet een tekstwaarde/);
  await assert.rejects(createPairingCode({ syncConfig, pin, context: '../other-app' }), /context/);
  await assert.rejects(createPairingCode({ syncConfig: { value: 'x'.repeat(13000) }, pin, context }), /te groot/);
});

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test('pairing-ID kan lokaal als gebruikt worden gemarkeerd en niet opnieuw', async () => {
  const storage = new MemoryStorage();
  const created = await createPairingCode({ syncConfig, pin, context });
  markPairingUsed(storage, created.pairingId);
  assert.throws(() => markPairingUsed(storage, created.pairingId), /al gebruikt/);
});

test('beschadigde lokale replayhistorie wordt fail-closed geweigerd', () => {
  const storage = new MemoryStorage();
  storage.setItem('pwa-core:device-pairing:used', '{broken');
  assert.throws(() => markPairingUsed(storage, 'A'.repeat(32)), /beschadigd/);
});
