import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  createPairingPayload,
  openPairingPayload,
  markPairingUsed,
  DEVICE_PAIRING_TTL_MS,
  DEVICE_PAIRING_KDF_ITERATIONS,
} from '../js/core/device-pairing.js';

globalThis.crypto ??= webcrypto;

const context = 'com.example.test-app';
const secrets = ['synthetic-shared-vault-password', 'synthetic-personal-vault-password'];
const sampleData = {
  workspace: { id: 'workspace-test-01', name: 'Synthetic workspace' },
  sync: { owner: 'synthetic-owner', repo: 'synthetic-repo', branch: 'main', token: 'synthetic-token-only' },
};

test('pairing payload round-trip versleutelt generieke app-data met alle opgegeven geheimen', async () => {
  const now = 1794900000000;
  const created = await createPairingPayload({ data: sampleData, secrets, context, now });
  assert.equal(created.expiresAt - created.issuedAt, DEVICE_PAIRING_TTL_MS);
  assert.equal(DEVICE_PAIRING_KDF_ITERATIONS, 600000);
  assert.equal(created.payload.startsWith('PWA-CORE-PAIR-1:'), true);
  assert.equal(created.payload.includes('synthetic-token-only'), false);
  assert.equal(created.payload.includes('synthetic-shared-vault-password'), false);

  const opened = await openPairingPayload({ payload: created.payload, secrets, context, now: now + 1000 });
  assert.deepEqual(opened.data, sampleData);
  assert.equal(opened.pairingId, created.pairingId);
  assert.equal(opened.expiresAt, created.expiresAt);
});

test('Unicode-koppelgeheimen worden op beide apparaten naar NFC genormaliseerd', async () => {
  const created = await createPairingPayload({ data: sampleData, secrets: ['cafe\\u0301'], context });
  const opened = await openPairingPayload({ payload: created.payload, secrets: ['café'], context });
  assert.deepEqual(opened.data, sampleData);
});

test('verkeerd of onvolledig geheim wordt geweigerd zonder inhoud terug te geven', async () => {
  const created = await createPairingPayload({ data: sampleData, secrets, context });
  await assert.rejects(
    openPairingPayload({ payload: created.payload, secrets: ['wrong-password', secrets[1]], context }),
    /horen niet bij deze code/,
  );
  await assert.rejects(
    openPairingPayload({ payload: created.payload, secrets: [secrets[0]], context }),
    /horen niet bij deze code/,
  );
  await assert.rejects(
    openPairingPayload({ payload: created.payload, secrets: [...secrets].reverse(), context }),
    /horen niet bij deze code/,
  );
});

test('pairing is cryptografisch gebonden aan de app-context', async () => {
  const created = await createPairingPayload({ data: sampleData, secrets, context });
  await assert.rejects(
    openPairingPayload({ payload: created.payload, secrets, context: 'com.example.other-app' }),
    /andere app/,
  );
});

test('verlopen codes worden geweigerd', async () => {
  const now = 1794900000000;
  const created = await createPairingPayload({ data: sampleData, secrets, context, now });
  await assert.rejects(
    openPairingPayload({ payload: created.payload, secrets, context, now: now + DEVICE_PAIRING_TTL_MS + 1 }),
    /verlopen/,
  );
});

test('wijziging van de versleutelde inhoud wordt geweigerd', async () => {
  const created = await createPairingPayload({ data: sampleData, secrets, context });
  const altered = created.payload.slice(0, -1) + (created.payload.endsWith('A') ? 'B' : 'A');
  await assert.rejects(openPairingPayload({ payload: altered, secrets, context }));
});

test('onveilige payloads, contexten en geheimlijsten worden vóór versleuteling geweigerd', async () => {
  await assert.rejects(createPairingPayload({ data: [], secrets, context }), /object/);
  await assert.rejects(createPairingPayload({ data: new Date(), secrets, context }), /object/);
  await assert.rejects(createPairingPayload({ data: sampleData, secrets: [], context }), /1 tot 8/);
  await assert.rejects(createPairingPayload({ data: sampleData, secrets: [''], context }), /1 tot 8/);
  await assert.rejects(createPairingPayload({ data: sampleData, secrets, context: '../other-app' }), /context/);
  await assert.rejects(createPairingPayload({ data: { value: 'x'.repeat(2000) }, secrets, context }), /te groot/);
});

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test('pairing-ID kan na succesvolle koppeling lokaal als gebruikt worden gemarkeerd', async () => {
  const storage = new MemoryStorage();
  const created = await createPairingPayload({ data: sampleData, secrets, context });
  markPairingUsed(storage, created.pairingId);
  assert.throws(() => markPairingUsed(storage, created.pairingId), /al gebruikt/);
});

test('verlopen lokale replayregistraties worden opgeruimd', () => {
  const storage = new MemoryStorage();
  const id = 'A'.repeat(32);
  storage.setItem('pwa-core:device-pairing:used', JSON.stringify([{ pairingId: id, usedAt: 1000 }]));
  assert.doesNotThrow(() => markPairingUsed(storage, 'B'.repeat(32), { now: 1000 + 10 * 60 * 1000 + 1 }));
});

test('beschadigde lokale replayhistorie wordt fail-closed geweigerd', () => {
  const storage = new MemoryStorage();
  storage.setItem('pwa-core:device-pairing:used', '{broken');
  assert.throws(() => markPairingUsed(storage, 'A'.repeat(32)), /beschadigd/);
});
