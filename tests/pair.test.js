import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  newPin, normalizePin, makePairCode, readPairCode,
  PAIR_CODE_TTL_MS, PAIR_CODE_KDF_ITERATIONS, PAIR_CODE_PIN_LENGTH,
} from '../js/core/pair.js';

globalThis.crypto ??= webcrypto;

const appId = 'synthetic-test-app';
const pin = 'AB3D-7KMP-9Q2R-5TUV';
const github = { owner: 'synthetic-owner', repo: 'synthetic-repo', branch: 'main', path: 'vault.json', token: 'synthetic-token' };

test('nieuwe PIN heeft 16 tekens uit de toegestane tekenset en vier groepen', () => {
  const value = newPin();
  assert.match(value, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}(?:-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}){3}$/);
  assert.equal(normalizePin(value).length, PAIR_CODE_PIN_LENGTH);
  assert.equal(PAIR_CODE_PIN_LENGTH, 16);
  assert.equal(PAIR_CODE_KDF_ITERATIONS, 600000);
});

test('PWK2 rond-trip versleutelt GitHub-instellingen en bindt ze aan de app', async () => {
  const now = 1794900000000;
  const code = await makePairCode(github, pin, appId, now);
  assert.equal(code.startsWith('PWK2.'), true);
  assert.equal(code.includes(github.token), false);
  assert.deepEqual(await readPairCode(code, pin, appId, now + 1000), github);
  await assert.rejects(readPairCode(code, pin, 'other-app', now + 1000), /pincode klopt niet|hoort niet bij deze app/);
});

test('PWK2-code verloopt na drie minuten', async () => {
  const now = 1794900000000;
  const code = await makePairCode(github, pin, appId, now);
  assert.equal(PAIR_CODE_TTL_MS, 180000);
  await assert.rejects(readPairCode(code, pin, appId, now + PAIR_CODE_TTL_MS), /verlopen/);
});

test('verkeerde, te korte en niet-toegestane PINs worden geweigerd', async () => {
  const code = await makePairCode(github, pin, appId);
  await assert.rejects(readPairCode(code, 'WRONG-PIN-0000-0000', appId), /pincode klopt niet/);
  await assert.rejects(makePairCode(github, 'ABCD-1234', appId), /16 tekens/);
  await assert.rejects(readPairCode(code, 'ABCD-1234', appId), /16 tekens/);
  await assert.rejects(makePairCode(github, 'ABCD-1234-IJKL-MNOP', appId), /16 tekens/);
});

test('oude PWK1-codes worden expliciet geweigerd', async () => {
  await assert.rejects(readPairCode('PWK1.legacy-code', pin, appId), /PWK1.*niet meer veilig/);
});

test('ongeldige app-identificaties en onvolledige GitHub-configuraties worden geweigerd', async () => {
  await assert.rejects(makePairCode(github, pin, '../other-app'), /app-identificatie/);
  await assert.rejects(makePairCode({ ...github, token: '' }, pin, appId), /onvolledig of ongeldig/);
});
