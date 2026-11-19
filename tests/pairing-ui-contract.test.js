import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/core/shell.js', import.meta.url), 'utf8');
const pairingUi = source.slice(source.indexOf('async function openPairOut()'), source.indexOf('function openPairIn'));

test('pairing UI keeps the PIN and transfer code in mutually exclusive panels', () => {
  assert.match(pairingUi, /id: 'pair-code-panel'/);
  assert.match(pairingUi, /id: 'pair-pin-panel', hidden: true/);
  assert.match(pairingUi, /showPin\.addEventListener\('click', \(\) => \{ codePanel\.hidden = true; pinPanel\.hidden = false; \}\)/);
  assert.match(pairingUi, /backToCode\.addEventListener\('click', \(\) => \{ pinPanel\.hidden = true; codePanel\.hidden = false; \}\)/);
  assert.match(pairingUi, /Pincode tonen \(koppelcode verbergen\)/);
  assert.match(pairingUi, /De koppelcode is verborgen/);
});

test('pairing UI offers separate copy actions for the code and PIN', () => {
  assert.match(pairingUi, /Koppelcode kopiëren/);
  assert.match(pairingUi, /Pincode kopiëren/);
  assert.match(pairingUi, /navigator\.clipboard\.writeText\(code\)/);
  assert.match(pairingUi, /navigator\.clipboard\.writeText\(pin\)/);
});
