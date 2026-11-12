import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/core/shell.js', import.meta.url), 'utf8');

test('ctx.update geeft fouten door en de interne keten blijft herstelbaar', () => {
  assert.match(source, /updateChain\.catch\(\(\) => \{\}\)\.then\(\(\) => applyUpdate\(mutator\)\)/);
  assert.ok(source.includes("toast(\`Opslaan mislukt: ${err.message}\`, 'error');"));
  assert.ok(source.includes('if (vault.getStorageStatus().pending) showStorageNotice(err);'));
});

test('nieuwe updates worden geweigerd zodra vergrendelen start', () => {
  assert.match(source, /async function applyUpdate\(mutator\) \{\s*if \(locking\) throw new Error\('De app wordt vergrendeld\.'\)/);
});

test('lock wacht op lopende updates en sync vóór flush en sleutelwissing', () => {
  const lock = source.slice(source.indexOf('async function lockNow()'), source.indexOf('function autoLockMinutes'));
  assert.match(lock, /while \(busyOperations\.size\) await Promise\.allSettled\(\[\.\.\.busyOperations\]\);/);
  assert.match(lock, /await updateChain\.catch\(\(\) => \{\}\);/);
  assert.match(lock, /syncController\?\.abort\(\);/);
  assert.match(lock, /if \(syncPromise\) await syncPromise;/);
  assert.match(lock, /await vault\.flush\(\);[\s\S]*vault\.lock\(\);[\s\S]*await releaseAppSession\(\);/);
});

test('sync-runs worden bijgehouden en niet gestart tijdens vergrendelen', () => {
  assert.match(source, /function runSync\(options = \{\}\) \{\s*if \(locking \|\| !vault\.isUnlocked\(\)\) return Promise\.resolve\(\);/);
  assert.match(source, /if \(syncPromise\) return syncPromise;/);
});

test('unexpected vault writes from non-cooperating tabs fail closed and preserve both encrypted copies', () => {
  const tabs = source.slice(source.indexOf('function wireOtherTabs()'), source.indexOf('// ---------- Service worker & updates ----------'));
  assert.match(tabs, /await handleExternalStorageChange\(e\.key, e\.newValue\);/);
  assert.doesNotMatch(tabs, /reloadFromStorage\(\)/);
  assert.match(source, /vault\.createRecoveryEnvelope\(\)/);
  assert.match(source, /vault\.createDeviceSettingsRecovery\(/);
  assert.match(source, /recovery-device-settings-local-/);
  assert.match(source, /external-vault/);
  assert.match(tabs, /if \(e\.key === null\)/);
  assert.match(tabs, /e\.key === vault\.KEYS\.vault \|\| e\.key === vault\.KEYS\.device/);
  assert.match(source, /device-settings/);
});

test('normal lock does not race external storage-conflict recovery', () => {
  const lock = source.slice(source.indexOf('async function lockNow()'), source.indexOf('function autoLockMinutes'));
  assert.match(lock, /if \(storageConflict\) return;[\s\S]*await vault\.flush\(\);[\s\S]*if \(storageConflict\) return;/);
});
