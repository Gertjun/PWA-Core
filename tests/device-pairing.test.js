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
const secrets = ['synthetic-shared-vault-password', 'synthetic-personal-vault-password'];
const sampleData = {
  workspace: { id: 'workspace-test-01', name: 'Synthetic workspace' },
  sync: { owner: 'synthetic-owner', repo: 'synthetic-repo', branch: 'main', token: 'synthetic-token-only' },
};

test('PIN-generator levert 16 geldige tekens in vier groepen', () => {
  const generated = newPin();
  assert.match(generated, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}(?:-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}){3}$/);
  assert.equal(normalizePin(generated).length, PAIRING_PIN_LENGTH);
  assert.equal(PAIRING_PIN_LENGTH * Math.log2(31) > 79, true);
});

test('generieke handmatige code round-tript app-data met hoge-entropie-PIN', async () => {
  const now = 1794900000000;
  const created = await createPairingCode({ data: sampleData, pin, context, now, transport: 'text' });
  assert.equal(created.expiresAt - created.issuedAt, PAIRING_TTL_MS);
  assert.equal(PAIRING_KDF_ITERATIONS, 600000);
  assert.equal(created.payload.startsWith('PWA-CORE-PAIR-2:'), true);
  assert.equal(created.payload.includes('synthetic-token-only'), false);
  const opened = await openPairingCode({ payload: created.payload, pin, context, now: now + 1000 });
  assert.deepEqual(opened.data, sampleData);
  assert.equal(opened.pairingId, created.pairingId);
});

test('dezelfde Core-envelop ondersteunt QR en handmatige code; QR-limiet is afzonderlijk', async () => {
  const created = await createPairingPayload({ data: sampleData, pin, secrets, context, transport: 'qr' });
  assert.equal(created.payload.length <= PAIRING_QR_MAX_CHARS, true);
  const opened = await openPairingPayload({ payload: created.payload, pin, secrets, context });
  assert.deepEqual(opened.data, sampleData);
  await assert.rejects(
    createPairingPayload({ data: { value: 'x'.repeat(3000) }, pin, secrets, context, transport: 'qr' }),
    /te groot voor één QR-code/,
  );
  const text = await createPairingCode({ data: { value: 'x'.repeat(3000) }, pin, secrets, context, transport: 'text' });
  assert.equal((await openPairingCode({ payload: text.payload, pin, secrets, context, transport: 'text' })).data.value.length, 3000);
});

test('aanvullende geheimen zijn optionele extra factoren en worden in vaste volgorde gebonden', async () => {
  const created = await createPairingCode({ data: sampleData, pin, secrets, context });
  await assert.rejects(openPairingCode({ payload: created.payload, pin, secrets: [secrets[1], secrets[0]], context }));
  await assert.rejects(openPairingCode({ payload: created.payload, pin: 'CD4E-8LNP-2R3S-6UVW', secrets, context }));
  const opened = await openPairingCode({ payload: created.payload, pin, secrets, context });
  assert.deepEqual(opened.data, sampleData);
});

test('Unicode-koppelgeheimen worden op beide apparaten naar NFC genormaliseerd', async () => {
  const decomposed = 'café';
  const composed = 'café';
  const created = await createPairingCode({ data: sampleData, pin, secrets: [decomposed], context });
  await assert.doesNotReject(openPairingCode({ payload: created.payload, pin, secrets: [decomposed], context }));
  const opened = await openPairingCode({ payload: created.payload, pin, secrets: [composed], context });
  assert.deepEqual(opened.data, sampleData);
});

test('contextbinding voorkomt gebruik in een andere app', async () => {
  const created = await createPairingCode({ data: sampleData, pin, context });
  await assert.rejects(openPairingCode({ payload: created.payload, pin, context: 'com.example.other-app' }), /andere app/);
});

test('verlopen codes en ongeldige klokwaarden worden geweigerd', async () => {
  const now = 1794900000000;
  const created = await createPairingCode({ data: sampleData, pin, context, now });
  await assert.rejects(openPairingCode({ payload: created.payload, pin, context, now: now + PAIRING_TTL_MS + 1 }), /verlopen/);
  await assert.rejects(openPairingCode({ payload: created.payload, pin, context, now: now - 60000 }), /geldigheidsduur/);
});

test('verkeerde PIN, gewijzigde ciphertext en legacy-protocollen worden geweigerd', async () => {
  const created = await createPairingCode({ data: sampleData, pin, context });
  await assert.rejects(openPairingCode({ payload: created.payload, pin: 'CD4E-8LNP-2R3S-6UVW', context }), /kloppen niet/);
  const prefix = 'PWA-CORE-PAIR-2:';
  const envelope = JSON.parse(Buffer.from(created.payload.slice(prefix.length), 'base64url').toString('utf8'));
  envelope.ciphertext = (envelope.ciphertext[0] === 'A' ? 'B' : 'A') + envelope.ciphertext.slice(1);
  const altered = prefix + Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url');
  await assert.rejects(openPairingCode({ payload: altered, pin, context }), /kloppen niet/);
  for (const legacy of ['PWK1.old', 'PWK2.old', 'CPK1.old', 'CPK2.old', 'PWA-CORE-PAIR-1:old']) {
    await assert.rejects(openPairingCode({ payload: legacy, pin, context }), /oude koppelcode/);
  }
});

test('ongeldige PINs, geheimen, contexten en payloads worden vóór encryptie geweigerd', async () => {
  await assert.rejects(createPairingCode({ data: sampleData, pin: 'ABCD-1234', context }), /16 tekens/);
  await assert.rejects(createPairingCode({ data: sampleData, pin, secrets: [''], context }), /niet-lege/);
  await assert.rejects(createPairingCode({ data: sampleData, pin, secrets: Array(9).fill('x'), context }), /maximaal 8/);
  await assert.rejects(createPairingCode({ data: [], pin, context }), /JSON-object/);
  await assert.rejects(createPairingCode({ data: new Date(), pin, context }), /JSON-object/);
  await assert.rejects(createPairingCode({ data: sampleData, pin, context: '../other-app' }), /context/);
  await assert.rejects(createPairingCode({ data: { value: 'x'.repeat(13000) }, pin, context }), /te groot/);
});

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test('pairing-ID kan lokaal als gebruikt worden gemarkeerd en niet opnieuw', async () => {
  const storage = new MemoryStorage();
  const created = await createPairingCode({ data: sampleData, pin, context });
  markPairingUsed(storage, created.pairingId);
  assert.throws(() => markPairingUsed(storage, created.pairingId), /al gebruikt/);
});

test('beschadigde lokale replayhistorie wordt fail-closed geweigerd', () => {
  const storage = new MemoryStorage();
  storage.setItem('pwa-core:device-pairing:used', '{broken');
  assert.throws(() => markPairingUsed(storage, 'A'.repeat(32)), /beschadigd/);
});
