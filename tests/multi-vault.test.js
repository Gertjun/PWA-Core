import test from 'node:test';
import assert from 'node:assert/strict';
import { createVault, DuplicateVaultInstanceError } from '../js/core/vault-factory.js';

import { createBiometric } from '../js/core/biometric-factory.js';
import { createSessionLock } from '../js/core/session-lock-factory.js';
import { createSync } from '../js/core/sync-factory.js';
import * as crypto from '../js/core/crypto.js';
import { webcrypto } from 'node:crypto';

globalThis.crypto ??= webcrypto;

test('biometric enrollment records are isolated by vault prefix', () => {
  const storage = new MemoryStorage();
  const shared = createBiometric({ storagePrefix: 'test-bio-shared', appName: 'Test', storage });
  const personal = createBiometric({ storagePrefix: 'test-bio-personal', appName: 'Test', storage });
  storage.setItem('test-bio-shared:biometric', JSON.stringify({ marker: 'shared' }));
  assert.equal(shared.isEnrolled(), true);
  assert.equal(personal.isEnrolled(), false);
  personal.disable();
  assert.equal(shared.isEnrolled(), true);
  shared.disable();
  assert.equal(shared.isEnrolled(), false);
});

test('session locks are independent across vault prefixes', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const held = new Set();
  const locks = {
    async request(name, options, callback) {
      if (held.has(name)) return callback(null);
      held.add(name);
      try { return await callback({ name }); }
      finally { held.delete(name); }
    },
  };
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { locks },
  });
  const shared = createSessionLock({ storagePrefix: 'test-lock-shared' });
  const duplicateShared = createSessionLock({ storagePrefix: 'test-lock-shared' });
  const personal = createSessionLock({ storagePrefix: 'test-lock-personal' });
  try {
    const sharedHandle = await shared.acquireSessionLock();
    const deniedSharedHandle = await duplicateShared.acquireSessionLock();
    const personalHandle = await personal.acquireSessionLock();
    assert.equal(deniedSharedHandle, null);
    assert.ok(sharedHandle);
    assert.ok(personalHandle);
    assert.equal(shared.hasSessionLock(), true);
    assert.equal(personal.hasSessionLock(), true);
    await sharedHandle.release();
    assert.equal(shared.hasSessionLock(), false);
    assert.equal(personal.hasSessionLock(), true);
    await personalHandle.release();
    assert.equal(personal.hasSessionLock(), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original);
    else delete globalThis.navigator;
  }
});


class MemoryStorage {
  #values = new Map();
  get length() { return this.#values.size; }
  key(index) { return [...this.#values.keys()][index] ?? null; }
  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(String(key), String(value)); }
  removeItem(key) { this.#values.delete(key); }
  keys() { return [...this.#values.keys()]; }
}

const makeVault = (storage, storagePrefix) => createVault({
  storagePrefix,
  kdfIterations: 100_000,
  storage,
});

test('multi-vault instances isolate data, keys, envelopes and revisions', async () => {
  const storage = new MemoryStorage();
  const shared = makeVault(storage, 'test-shared');
  const personal = makeVault(storage, 'test-personal');
  try {
    await shared.create('Shared-passphrase-1!', { domain: 'shared', amount: 10 });
    await personal.create('Personal-passphrase-2!', { domain: 'personal', amount: 20 });

    assert.equal(shared.getData().domain, 'shared');
    assert.equal(personal.getData().domain, 'personal');
    assert.notDeepEqual(shared.getEnvelope(), personal.getEnvelope());
    assert.notEqual(shared.getDataKey(), personal.getDataKey());

    await shared.setData({ domain: 'shared', amount: 11 });
    await shared.flush();

    assert.equal(shared.getData().amount, 11);
    assert.notEqual(shared.getRevision(), personal.getRevision());
    assert.equal(personal.getData().amount, 20);
    assert.equal(personal.getStorageStatus().pending, false);
    assert.ok(storage.getItem('test-shared:vault'));
    assert.ok(storage.getItem('test-personal:vault'));
  } finally {
    await shared.dispose();
    await personal.dispose();
  }
});

test('a password from one vault cannot import another vault envelope', async () => {
  const storage = new MemoryStorage();
  const shared = makeVault(storage, 'test-shared-password');
  const personal = makeVault(storage, 'test-personal-password');
  const verifier = makeVault(storage, 'test-verify-personal');
  try {
    await shared.create('Shared-passphrase-1!', { domain: 'shared' });
    await personal.create('Personal-passphrase-2!', { domain: 'personal' });
    const envelope = structuredClone(personal.getEnvelope());

    await assert.rejects(
      verifier.importEnvelope(envelope, 'Shared-passphrase-1!'),
      (error) => error?.name === 'WrongPasswordError',
    );
    assert.equal(verifier.hasVault(), false);

    await verifier.importEnvelope(envelope, 'Personal-passphrase-2!');
    assert.equal(verifier.getData().domain, 'personal');
  } finally {
    await shared.dispose();
    await personal.dispose();
    await verifier.dispose();
  }
});

test('reset removes only keys belonging to its exact vault prefix', async () => {
  const storage = new MemoryStorage();
  const shared = makeVault(storage, 'test-scope');
  const personal = makeVault(storage, 'test-scope-personal');
  try {
    await shared.create('Shared-passphrase-1!', { domain: 'shared' });
    await personal.create('Personal-passphrase-2!', { domain: 'personal' });
    await personal.setDeviceSettings({ marker: 'keep-me' });
    await shared.reset();

    assert.equal(shared.hasVault(), false);
    assert.equal(personal.hasVault(), true);
    assert.deepEqual(await personal.getDeviceSettings(), { marker: 'keep-me' });
    assert.ok(storage.keys().some((key) => key.startsWith('test-scope-personal:')));
  } finally {
    await shared.dispose();
    await personal.dispose();
  }
});

test('a write failure in one vault does not poison another vault queue', async () => {
  const storage = new MemoryStorage();
  const shared = makeVault(storage, 'test-failed');
  const personal = makeVault(storage, 'test-healthy');
  const originalSetItem = storage.setItem.bind(storage);
  let failSharedVaultWrite = false;
  storage.setItem = (key, value) => {
    if (failSharedVaultWrite && key === 'test-failed:vault') {
      const error = new Error('synthetic quota failure');
      error.name = 'QuotaExceededError';
      throw error;
    }
    originalSetItem(key, value);
  };
  try {
    await shared.create('Shared-passphrase-1!', { domain: 'shared' });
    await personal.create('Personal-passphrase-2!', { domain: 'personal' });

    failSharedVaultWrite = true;
    await assert.rejects(shared.setData({ domain: 'shared', amount: 2 }));
    await personal.setData({ domain: 'personal', amount: 3 });
    await personal.flush();
    assert.equal(personal.getData().amount, 3);
    assert.equal(personal.getStorageStatus().pending, false);

    failSharedVaultWrite = false;
    await shared.retryFlush();
    assert.equal(shared.getStorageStatus().pending, false);
  } finally {
    failSharedVaultWrite = false;
    await shared.dispose();
    await personal.dispose();
  }
});

test('vault factory rejects KDF settings outside envelope validation bounds', async () => {
  const storage = new MemoryStorage();
  for (const iterations of [1, 99_999, 2_000_001, Number.MAX_SAFE_INTEGER, 1.5]) {
    assert.throws(() => createVault({
      storagePrefix: `test-invalid-kdf-${iterations}`,
      kdfIterations: iterations,
      storage,
    }), TypeError);
  }

  const minimum = createVault({ storagePrefix: 'test-kdf-minimum', kdfIterations: 100_000, storage });
  const maximum = createVault({ storagePrefix: 'test-kdf-maximum', kdfIterations: 2_000_000, storage });
  await minimum.dispose();
  await maximum.dispose();
});

test('duplicate and invalid storage prefixes fail closed', async () => {
  const storage = new MemoryStorage();
  const first = makeVault(storage, 'test-duplicate');
  try {
    assert.throws(
      () => makeVault(storage, 'test-duplicate'),
      (error) => error instanceof DuplicateVaultInstanceError,
    );
    assert.throws(() => makeVault(storage, 'test:invalid'), TypeError);
  } finally {
    await first.dispose();
  }
});


test('sync controllers upload only their own vault and remote path', async () => {
  const storage = new MemoryStorage();
  const shared = makeVault(storage, 'test-sync-shared');
  const personal = makeVault(storage, 'test-sync-personal');
  const sharedSync = createSync({ vault: shared, appName: 'Test' });
  const personalSync = createSync({ vault: personal, appName: 'Test' });
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method, body: init.body ? JSON.parse(init.body) : null });
    if (init.method === 'GET') return { ok: false, status: 404, json: async () => ({}) };
    const path = String(url).includes('/shared.json') ? 'sha-shared' : 'sha-personal';
    return { ok: true, status: 200, json: async () => ({ content: { sha: path } }) };
  };
  try {
    await shared.create('Shared-passphrase-1!', { schema: 1, domain: 'shared' });
    await personal.create('Personal-passphrase-2!', { schema: 1, domain: 'personal' });
    const settings = (path) => ({ owner: 'synthetic', repo: 'synthetic', branch: 'main', path, token: 'synthetic-token' });
    const [sharedResult, personalResult] = await Promise.all([
      sharedSync.syncNow({ settings: settings('shared.json'), merge: (a, b) => ({ ...a, ...b }), schemaVersion: 1 }),
      personalSync.syncNow({ settings: settings('personal.json'), merge: (a, b) => ({ ...a, ...b }), schemaVersion: 1 }),
    ]);
    assert.equal(sharedResult, 'uploaded');
    assert.equal(personalResult, 'uploaded');
    assert.equal(shared.getSyncMeta().sha, 'sha-shared');
    assert.equal(personal.getSyncMeta().sha, 'sha-personal');
    const puts = requests.filter((request) => request.method === 'PUT');
    assert.equal(puts.length, 2);
    assert.ok(puts.some((request) => request.url.includes('/shared.json')));
    assert.ok(puts.some((request) => request.url.includes('/personal.json')));
    assert.equal(sharedSync.isSyncing(), false);
    assert.equal(personalSync.isSyncing(), false);
  } finally {
    globalThis.fetch = originalFetch;
    await shared.dispose();
    await personal.dispose();
  }
});


test('biometric PRF/HKDF contexts cannot unlock another vault key', async () => {
  const storage = new MemoryStorage();
  const sharedBio = createBiometric({ storagePrefix: 'test-bio-shared', appName: 'Test', storage });
  const personalBio = createBiometric({ storagePrefix: 'test-bio-personal', appName: 'Test', storage });
  const sharedKey = await crypto.generateDataKey();
  const personalKey = await crypto.generateDataKey();
  const secrets = new Map([[1, crypto.randomBytes(32)], [2, crypto.randomBytes(32)]]);
  const prfInputs = [];
  let nextId = 0;
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      credentials: {
        async create(options) {
          const id = ++nextId;
          prfInputs.push(new Uint8Array(options.publicKey.extensions.prf.eval.first));
          return {
            rawId: new Uint8Array([id]),
            getClientExtensionResults: () => ({ prf: { enabled: true, results: { first: secrets.get(id) } } }),
          };
        },
        async get(options) {
          const id = options.publicKey.allowCredentials[0].id[0];
          return { getClientExtensionResults: () => ({ prf: { results: { first: secrets.get(id) } } }) };
        },
      },
    },
  });
  try {
    await sharedBio.enroll(sharedKey);
    await personalBio.enroll(personalKey);
    assert.notDeepEqual([...prfInputs[0]], [...prfInputs[1]]);
    assert.equal(await crypto.sameKey(sharedKey, await sharedBio.unlock()), true);
    assert.equal(await crypto.sameKey(personalKey, await personalBio.unlock()), true);

    const sharedRecord = storage.getItem('test-bio-shared:biometric');
    const personalRecord = storage.getItem('test-bio-personal:biometric');
    storage.setItem('test-bio-shared:biometric', personalRecord);
    await assert.rejects(sharedBio.unlock(), /werkt niet meer/i);
    storage.setItem('test-bio-shared:biometric', sharedRecord);
    assert.equal(await crypto.sameKey(sharedKey, await sharedBio.unlock()), true);
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else delete globalThis.navigator;
  }
});
