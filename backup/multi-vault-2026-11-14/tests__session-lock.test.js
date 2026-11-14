import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = await mkdtemp(path.join(tmpdir(), 'pwa-core-session-lock-'));
await mkdir(path.join(root, 'js', 'core'), { recursive: true });
const source = await (await import('node:fs/promises')).readFile(new URL('../js/core/session-lock.js', import.meta.url));
await writeFile(path.join(root, 'js', 'core', 'session-lock.js'), source);
await writeFile(path.join(root, 'js', 'core', 'session-lock-other.js'), source);
await writeFile(path.join(root, 'js', 'config.js'), `
export const APP = { storagePrefix: 'session-lock-test' };
`);

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const lockModule = await import(pathToFileURL(path.join(root, 'js', 'core', 'session-lock.js')).href);
const otherTabModule = await import(pathToFileURL(path.join(root, 'js', 'core', 'session-lock-other.js')).href);

function installLocks() {
  let held = false;
  const calls = [];
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    locks: {
      request: async (name, options, callback) => {
        calls.push({ name, options });
        if (held && options.ifAvailable) return callback(null);
        held = true;
        try { return await callback({ name }); }
        finally { held = false; }
      },
    },
  } });
  return calls;
}

test('Web Lock wordt vastgehouden tot expliciete release en blokkeert een tweede sessie', async () => {
  const calls = installLocks();
  const first = await lockModule.acquireSessionLock();
  assert.ok(first);
  assert.equal(lockModule.hasSessionLock(), true);
  const second = await otherTabModule.acquireSessionLock();
  assert.equal(second, null);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.mode, 'exclusive');
  assert.equal(calls[0].options.ifAvailable, true);
  await first.release();
  assert.equal(lockModule.hasSessionLock(), false);
  const third = await otherTabModule.acquireSessionLock();
  assert.ok(third);
  await third.release();
});

test('ontbrekende Web Locks weigert fail-closed', async () => {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  await assert.rejects(lockModule.acquireSessionLock(), (error) =>
    error.name === 'SessionLockUnavailableError');
  assert.equal(lockModule.hasSessionLock(), false);
});

test.after(async () => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else delete globalThis.navigator;
  await rm(root, { recursive: true, force: true });
});
