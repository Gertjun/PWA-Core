import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createVault } from '../js/core/vault-factory.js';
import { createClient } from '../js/core/github.js';
import * as pairUi from '../js/core/pairing-ui.js';

globalThis.crypto ??= webcrypto;

class MemoryStorage {
  values = new Map();
  failKey = null;
  get length() { return this.values.size; }
  key(i) { return [...this.values.keys()][i] ?? null; }
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k, v) {
    if (k === this.failKey) throw new Error('synthetic storage failure');
    this.values.set(k, String(v));
  }
  removeItem(k) { this.values.delete(k); }
}

const context = 'synthetic-pairing';
const github = { owner: 'synthetic-owner', repo: 'synthetic-repo', branch: 'main', path: 'vault.json', token: 'synthetic-token' };
const password = 'Synthetic-password-42!';
const makeVault = (storage, storagePrefix) => createVault({ storage, storagePrefix, kdfIterations: 100_000 });

test('v3 transfer integrates QR, URL cleanup, GitHub download, vault import and encrypted settings with retry', async () => {
  const a = new MemoryStorage();
  const b = new MemoryStorage();
  const source = makeVault(a, 'integration-source');
  const target = makeVault(b, 'integration-target');
  const originalFetch = globalThis.fetch;
  try {
    await source.create(password, { records: [{ id: 'synthetic', amount: 42 }] });
    const envelope = structuredClone(source.getEnvelope());
    const created = await pairUi.createPairing({ syncConfig: github, dataKey: source.getDataKey(), context, appUrl: 'https://example.invalid/app/' });
    assert.ok(created.qr);
    assert.equal(created.pin, null);
    const history = { replaceState(_state, _unused, url) { assert.equal(url, '/app/'); } };
    const incoming = pairUi.takeIncomingPairCode({ location: { href: created.link }, history });
    const opened = await pairUi.openPairing({ input: incoming.code, context, storage: b });
    let offline = true;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.github.com/repos/synthetic-owner/synthetic-repo/contents/vault.json?ref=main');
      assert.equal(options.method, 'GET');
      assert.equal(options.headers.Authorization, 'Bearer synthetic-token');
      if (offline) throw new Error('synthetic offline');
      return { ok: true, json: async () => ({ sha: 'synthetic-sha', encoding: 'base64', content: Buffer.from(JSON.stringify(envelope)).toString('base64') }) };
    };
    const client = createClient(opened.syncConfig);
    await assert.rejects(client.getFile(), /Geen verbinding/);
    assert.equal(b.length, 0);
    offline = false;
    const remote = await client.getFile();
    const options = { deviceSettings: { github: opened.syncConfig, autoSync: true }, syncMeta: { sha: remote.sha, dirty: false } };
    // Prior auxiliary bytes must survive every failed setup attempt.
    b.setItem(target.KEYS.device, 'prior-device');
    b.setItem(target.KEYS.sync, 'prior-sync');
    for (const key of [target.KEYS.device, target.KEYS.sync, target.KEYS.vault]) {
      b.failKey = key;
      await assert.rejects(target.importEnvelopeWithKey(remote.envelope, opened.dataKey, options), /synthetic storage failure/);
      assert.equal(target.isUnlocked(), false);
      assert.equal(b.getItem(target.KEYS.vault), null);
      assert.equal(b.getItem(target.KEYS.device), 'prior-device');
      assert.equal(b.getItem(target.KEYS.sync), 'prior-sync');
      assert.equal(b.getItem(pairUi.pairingUsedKey(context)), null);
    }
    b.failKey = null;
    await target.importEnvelopeWithKey(remote.envelope, opened.dataKey, options);
    opened.markUsed();
    assert.deepEqual(target.getData(), source.getData());
    assert.deepEqual(await target.getDeviceSettings(), options.deviceSettings);
    assert.equal(target.getSyncMeta().sha, remote.sha);
    assert.ok(!b.getItem(target.KEYS.device).includes(github.token));
    target.lock();
    await target.unlockWithPassword(password);
    assert.deepEqual(await target.getDeviceSettings(), options.deviceSettings);
    await assert.rejects(pairUi.openPairing({ input: created.code, context, storage: b }), /al gebruikt/);
    assert.deepEqual(source.getEnvelope(), envelope);
  } finally {
    globalThis.fetch = originalFetch;
    await source.dispose();
    await target.dispose();
  }
});
