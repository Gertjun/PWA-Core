import test from 'node:test';
import assert from 'node:assert/strict';
import * as pairUi from '../js/core/pairing-ui.js';
import qrcode from '../js/core/qrcode.js';

const syncConfig = { owner: 'voorbeeld', repo: 'testdata', branch: 'main', path: 'testapp/vault.json', token: 'github_pat_SYNTHETISCH_0000000000' };

function memoryStorage() {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), map };
}

test('extractPairCode accepts a bare code, a code with whitespace and a QR link', () => {
  const code = 'PWA-CORE-PAIR-2:abcDEF_-123';
  assert.equal(pairUi.extractPairCode(code), code);
  assert.equal(pairUi.extractPairCode(`  PWA-CORE-PAIR-2:abc\nDEF_-123 `), code);
  assert.equal(pairUi.extractPairCode(`https://voorbeeld.github.io/app/?pair=${encodeURIComponent(code)}`), code);
  assert.equal(pairUi.extractPairCode('https://voorbeeld.github.io/app/?pair=iets-anders'), '');
  assert.equal(pairUi.extractPairCode('willekeurige tekst'), '');
  assert.equal(pairUi.extractPairCode(''), '');
});

test('pairingLink keeps the app directory and sets ?pair=', () => {
  const link = pairUi.pairingLink('PWA-CORE-PAIR-2:x', 'https://voorbeeld.github.io/app/index.html#instellingen');
  const url = new URL(link);
  assert.equal(url.origin + url.pathname, 'https://voorbeeld.github.io/app/');
  assert.equal(url.searchParams.get('pair'), 'PWA-CORE-PAIR-2:x');
});

test('takeIncomingPairCode returns the code and strips it from the address bar', () => {
  const calls = [];
  const history = { state: { a: 1 }, replaceState: (...args) => calls.push(args) };
  const location = { href: 'https://voorbeeld.github.io/app/?pair=PWA-CORE-PAIR-2%3Aabc&x=1#hash' };
  assert.deepEqual(pairUi.takeIncomingPairCode({ location, history }), { code: 'PWA-CORE-PAIR-2:abc' });
  assert.deepEqual(calls, [[{ a: 1 }, '', '/app/?x=1#hash']]);
  assert.deepEqual(pairUi.takeIncomingPairCode({ location: { href: 'https://voorbeeld.github.io/app/?pair=rommel' }, history }), { invalid: true });
  assert.equal(pairUi.takeIncomingPairCode({ location: { href: 'https://voorbeeld.github.io/app/' }, history }), null);
});

test('createPairing produces a QR link that the receiving side can open once', async () => {
  const created = await pairUi.createPairing({ syncConfig, context: 'testapp', appUrl: 'https://voorbeeld.github.io/app/' });
  assert.match(created.code, /^PWA-CORE-PAIR-2:/);
  assert.ok(created.qr?.startsWith('data:image/gif;base64,'), 'QR-afbeelding verwacht');
  assert.equal(pairUi.extractPairCode(created.link), created.code);

  const storage = memoryStorage();
  const opened = await pairUi.openPairing({ input: created.link, pin: created.pin, context: 'testapp', storage });
  assert.deepEqual(opened.syncConfig, syncConfig);
  assert.equal(storage.map.size, 0, 'openen registreert nog niets');
  opened.markUsed();
  assert.ok(storage.getItem('testapp:pairing:used'));
  await assert.rejects(
    pairUi.openPairing({ input: created.code, pin: created.pin, context: 'testapp', storage }),
    /al gebruikt/,
  );
});

test('openPairing rejects a wrong PIN, a foreign app context and missing input', async () => {
  const created = await pairUi.createPairing({ syncConfig, context: 'testapp', appUrl: 'https://voorbeeld.github.io/app/' });
  const storage = memoryStorage();
  await assert.rejects(pairUi.openPairing({ input: created.code, pin: 'AAAA-AAAA-AAAA-AAAA', context: 'testapp', storage }));
  await assert.rejects(pairUi.openPairing({ input: created.code, pin: created.pin, context: 'andere-app', storage }));
  await assert.rejects(pairUi.openPairing({ input: '', pin: created.pin, context: 'testapp', storage }), /Plak de koppelcode/);
  await assert.rejects(pairUi.openPairing({ input: created.code, pin: '', context: 'testapp', storage }), /pincode/);
  assert.equal(storage.map.size, 0);
});

test('openPairing refuses to continue with damaged replay history (fail-closed)', async () => {
  const created = await pairUi.createPairing({ syncConfig, context: 'testapp', appUrl: 'https://voorbeeld.github.io/app/' });
  const storage = memoryStorage();
  storage.setItem('testapp:pairing:used', '{kapot');
  await assert.rejects(pairUi.openPairing({ input: created.code, pin: created.pin, context: 'testapp', storage }), /beschadigd/);
});

test('codes made by the earlier text and QR transports stay compatible', async () => {
  const { createPairingCode, newPin } = await import('../js/core/pair.js');
  for (const transport of ['text', 'qr']) {
    const pin = newPin();
    const { payload } = await createPairingCode({ syncConfig, pin, context: 'testapp', transport });
    const opened = await pairUi.openPairing({ input: payload, pin, context: 'testapp', storage: memoryStorage() });
    assert.deepEqual(opened.syncConfig, syncConfig);
  }
});

test('the vendored QR generator encodes a typical pairing link', () => {
  const qr = qrcode(0, 'L');
  qr.addData(`https://voorbeeld.github.io/app/?pair=PWA-CORE-PAIR-2:${'a'.repeat(1400)}`, 'Byte');
  qr.make();
  assert.ok(qr.getModuleCount() > 21);
  assert.equal(pairUi.qrDataUrl('x'.repeat(5000)), null, 'te lange inhoud geeft geen QR');
});

test('v3 QR links use only a fragment and are stripped on arrival', async () => {
  const dataKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const created = await pairUi.createPairing({ syncConfig, dataKey, context: 'testapp', appUrl: 'https://voorbeeld.github.io/app/' });
  assert.match(created.code, /^PWA-CORE-PAIR-3:/);
  assert.equal(created.pin, null);
  assert.ok(created.qr);
  assert.equal(new URL(created.link).search, '');
  assert.equal(pairUi.extractPairCode(created.link), created.code);
  const calls = [];
  const history = { replaceState: (...args) => calls.push(args) };
  assert.deepEqual(pairUi.takeIncomingPairCode({ location: { href: created.link }, history }), { code: created.code });
  assert.equal(calls[0][2], '/app/');
  const query = 'https://voorbeeld.github.io/app/?pair=' + encodeURIComponent(created.code);
  assert.equal(pairUi.extractPairCode(query), '');
  assert.deepEqual(pairUi.takeIncomingPairCode({ location: { href: query }, history }), { invalid: true });
  const storage = memoryStorage();
  const opened = await pairUi.openPairing({ input: created.link, context: 'testapp', storage });
  assert.deepEqual(opened.syncConfig, syncConfig);
  assert.deepEqual(await crypto.subtle.exportKey('raw', opened.dataKey), await crypto.subtle.exportKey('raw', dataKey));
  opened.markUsed();
  await assert.rejects(pairUi.openPairing({ input: created.code, context: 'testapp', storage }), /al gebruikt/);
});
