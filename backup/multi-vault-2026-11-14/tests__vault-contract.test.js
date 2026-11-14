import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { webcrypto } from 'node:crypto';

// vault.js importeert bewust de app-eigen config.js. Maak voor deze suite
// een geïsoleerde tijdelijke app-configuratie; wijzig nooit een echte app-config.
const root = await mkdtemp(path.join(tmpdir(), 'pwa-core-vault-'));
await mkdir(path.join(root, 'js', 'core'), { recursive: true });
for (const file of ['vault.js', 'crypto.js', 'deletions.js']) {
  await cp(new URL(`../js/core/${file}`, import.meta.url), path.join(root, 'js', 'core', file));
}
await writeFile(path.join(root, 'js', 'config.js'), `
export const APP = { storagePrefix: 'vault-contract-test', kdfIterations: 1000 };
`);

class MemoryStorage {
  failKey = null;
  getItem(key) { return Object.hasOwn(this, key) ? this[key] : null; }
  setItem(key, value) {
    if (this.failKey === key) throw new Error('Synthetic storage failure');
    this[key] = String(value);
  }
  removeItem(key) { delete this[key]; }
  clear() { for (const key of Object.keys(this)) delete this[key]; }
}
globalThis.localStorage = new MemoryStorage();
globalThis.crypto ??= webcrypto;

const vault = await import(pathToFileURL(path.join(root, 'js', 'core', 'vault.js')).href);
const PASSWORD = 'synthetic-test-passphrase';
const NEXT_PASSWORD = 'another-synthetic-passphrase';
const sample = () => ({ profile: { label: 'synthetic fixture' }, records: [{ id: 'r1', value: 42 }] });

async function clean() {
  localStorage.failKey = null;
  if (vault.isUnlocked()) {
    try { await vault.retryFlush(); } catch { /* cleanup continues only in synthetic test storage */ }
  }
  await vault.reset();
  localStorage.clear();
}

test('create schrijft een geldige versleutelde envelope en bewaart geen plaintext', async () => {
  await clean();
  const data = sample();
  await vault.create(PASSWORD, data);
  await vault.flush();

  assert.equal(vault.hasVault(), true);
  assert.equal(vault.isUnlocked(), true);
  assert.deepEqual(vault.getData(), data);
  const raw = localStorage.getItem(vault.KEYS.vault);
  assert.ok(raw);
  assert.equal(raw.includes('synthetic fixture'), false);
  assert.equal(raw.includes('"value":42'), false);
  const env = JSON.parse(raw);
  assert.equal(env.format, 'pwa-vault');
  assert.equal(env.version, 1);
  assert.equal(env.kdf.name, 'PBKDF2-SHA256');
  assert.equal(env.kdf.iterations, 1000);
  assert.ok(env.payload.iv && env.payload.data);
});

test('lock wist de ontgrendelde toestand en beschermde getters weigeren toegang', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  vault.lock();
  assert.equal(vault.isUnlocked(), false);
  assert.throws(() => vault.getData(), /vergrendeld/i);
  assert.throws(() => vault.getDataKey(), /vergrendeld/i);
  await vault.unlockWithPassword(PASSWORD);
  assert.equal(vault.isUnlocked(), true);
});

test('correct wachtwoord ontgrendelt; verkeerd wachtwoord wordt expliciet geweigerd', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  vault.lock();
  await assert.rejects(vault.unlockWithPassword('incorrect'), (error) => error.name === 'WrongPasswordError');
  assert.equal(vault.isUnlocked(), false);
  await vault.unlockWithPassword(PASSWORD);
  assert.equal(vault.getData().profile.label, 'synthetic fixture');
});

test('beschadigde ciphertext wordt geweigerd zonder de kluis te ontgrendelen', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const env = JSON.parse(localStorage.getItem(vault.KEYS.vault));
  const bytes = Buffer.from(env.payload.data, 'base64');
  bytes[0] ^= 1;
  env.payload.data = bytes.toString('base64');
  localStorage.setItem(vault.KEYS.vault, JSON.stringify(env));
  vault.lock();

  await assert.rejects(vault.unlockWithPassword(PASSWORD));
  assert.equal(vault.isUnlocked(), false);
});

test('onbekende toekomstige envelope-versie wordt geweigerd', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const env = JSON.parse(localStorage.getItem(vault.KEYS.vault));
  env.version = 2;
  localStorage.setItem(vault.KEYS.vault, JSON.stringify(env));
  vault.lock();

  await assert.rejects(vault.unlockWithPassword(PASSWORD), /nieuwere versie/i);
  assert.equal(vault.isUnlocked(), false);
  assert.equal(JSON.parse(localStorage.getItem(vault.KEYS.vault)).version, 2);
});

test('importEnvelope installeert een bestaande envelope alleen na wachtwoordcontrole', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const exported = structuredClone(vault.getEnvelope());
  await clean();

  await assert.rejects(vault.importEnvelope(exported, 'wrong'), (error) => error.name === 'WrongPasswordError');
  assert.equal(vault.hasVault(), false);
  await vault.importEnvelope(exported, PASSWORD);
  assert.equal(vault.hasVault(), true);
  assert.deepEqual(vault.getData(), sample());
});

test('snelle gelijktijdige updates worden in wachtrijvolgorde duurzaam opgeslagen', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const first = { order: 1 };
  const second = { order: 2 };
  await Promise.all([vault.setData(first), vault.setData(second)]);
  await vault.flush();

  assert.deepEqual(vault.getData(), second);
  assert.deepEqual(await vault.decryptRemote(vault.getEnvelope()), second);
  assert.equal(vault.getPersistedRevision(), vault.getRevision());
});

test('flush verwerpt een mislukte lokale write en rapporteert alleen revisiemetadata', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const before = vault.getPersistedRevision();
  localStorage.failKey = vault.KEYS.vault;
  await assert.rejects(vault.setData({ profile: { label: 'not persisted' } }));
  const status = vault.getStorageStatus();
  assert.equal(status.pending, true);
  assert.equal(status.persistedRevision, before);
  assert.ok(status.requestedRevision > before);
  assert.equal(JSON.stringify(status).includes('not persisted'), false);
  await assert.rejects(vault.flush(), (error) =>
    error.name === 'StorageWriteError' && error.targetRevision === status.requestedRevision);
});

test('retryFlush schrijft één volledige actuele snapshot en herstelt de flush-garantie', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  localStorage.failKey = vault.KEYS.vault;
  await assert.rejects(vault.setData({ profile: { label: 'retry me' } }));
  localStorage.failKey = null;
  const result = await vault.retryFlush();
  assert.equal(result.revision, vault.getRevision());
  assert.equal(vault.getPersistedRevision(), vault.getRevision());
  assert.equal(vault.getStorageStatus().pending, false);
  assert.deepEqual(await vault.decryptRemote(vault.getEnvelope()), { profile: { label: 'retry me' } });
});

test('een latere volledige snapshot mag een eerdere mislukte revisie inhalen', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  localStorage.failKey = vault.KEYS.vault;
  await assert.rejects(vault.setData({ order: 1 }));
  localStorage.failKey = null;
  await vault.setData({ order: 2 });
  const result = await vault.flush();
  assert.equal(result.revision, vault.getRevision());
  assert.deepEqual(await vault.decryptRemote(vault.getEnvelope()), { order: 2 });
});

test('restoreBackup blijft pending als de nieuwe envelop niet lokaal kan worden opgeslagen', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const backup = structuredClone(vault.getEnvelope());
  await vault.setData({ profile: { label: 'newer local data' } });
  localStorage.failKey = vault.KEYS.vault;
  await assert.rejects(vault.restoreBackup(backup, PASSWORD));
  await assert.rejects(vault.flush(), (error) => error.name === 'StorageWriteError');
  assert.equal(vault.getStorageStatus().pending, true);
  localStorage.failKey = null;
  await vault.retryFlush();
  assert.equal(vault.getData().profile.label, sample().profile.label);
  assert.deepEqual(vault.getData().records, sample().records);
  assert.ok(vault.getData().__pwaSync);
});

test('recovery-envelop bevat actuele geheugenstand zonder localStorage te wijzigen', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const storedBefore = localStorage.getItem(vault.KEYS.vault);
  await vault.setData({ recovery: { label: 'memory-only recovery' } });
  localStorage.failKey = vault.KEYS.vault;
  await assert.rejects(vault.setData({ recovery: { label: 'latest memory state' } }));
  const storedAfterFailure = localStorage.getItem(vault.KEYS.vault);
  const recovery = await vault.createRecoveryEnvelope();
  assert.equal(localStorage.getItem(vault.KEYS.vault), storedAfterFailure);
  assert.notEqual(storedBefore, storedAfterFailure);
  assert.deepEqual(await vault.decryptRemote(recovery), { recovery: { label: 'latest memory state' } });
  localStorage.failKey = null;
});

test('device-settings recovery export is versleuteld en schrijft niets naar localStorage', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const secretSettings = { github: { token: 'ghp-sensitive-token' }, autoSync: true };
  const before = localStorage.getItem(vault.KEYS.device);
  const recovery = await vault.createDeviceSettingsRecovery(secretSettings);
  assert.equal(localStorage.getItem(vault.KEYS.device), before);
  assert.equal(JSON.stringify(recovery).includes('ghp-sensitive-token'), false);
  assert.ok(recovery.iv);
  assert.ok(recovery.data);
});

test('wachtwoord wijzigen vereist het huidige wachtwoord en maakt het oude ongeldig', async () => {
  await clean();
  await vault.create(PASSWORD, sample());
  const before = structuredClone(vault.getEnvelope());
  await assert.rejects(vault.changePassword('wrong', NEXT_PASSWORD), (error) => error.name === 'WrongPasswordError');
  await vault.changePassword(PASSWORD, NEXT_PASSWORD);
  await vault.flush();

  const after = vault.getEnvelope();
  assert.deepEqual(after.payload, before.payload);
  assert.notEqual(after.kdf.salt, before.kdf.salt);
  assert.notDeepEqual(after.wrappedKey, before.wrappedKey);
  vault.lock();
  await assert.rejects(vault.unlockWithPassword(PASSWORD), (error) => error.name === 'WrongPasswordError');
  await vault.unlockWithPassword(NEXT_PASSWORD);
  assert.deepEqual(vault.getData(), sample());
});

test('apparaatinstellingen blijven versleuteld en reset wist alleen de app-namespace', async () => {
  await clean();
  localStorage.setItem('other-app:keep', 'untouched');
  await vault.create(PASSWORD, sample());
  await vault.setDeviceSettings({ privateSetting: 'synthetic-secret' });
  const deviceRaw = localStorage.getItem(vault.KEYS.device);
  assert.ok(deviceRaw);
  assert.equal(deviceRaw.includes('synthetic-secret'), false);
  vault.lock();
  await assert.rejects(vault.getDeviceSettings(), /vergrendeld/i);
  await vault.unlockWithPassword(PASSWORD);
  assert.deepEqual(await vault.getDeviceSettings(), { privateSetting: 'synthetic-secret' });

  await vault.reset();
  assert.equal(vault.hasVault(), false);
  assert.equal(localStorage.getItem('other-app:keep'), 'untouched');
  assert.equal(vault.isUnlocked(), false);
});

test.after(async () => {
  await rm(root, { recursive: true, force: true });
});
