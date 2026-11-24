import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/core/pairing-ui.js', import.meta.url), 'utf8');
const dialog = source.slice(source.indexOf('export async function openPairOutDialog'));
const shell = await readFile(new URL('../js/core/shell.js', import.meta.url), 'utf8');

test('pairing UI keeps the PIN and transfer code in mutually exclusive panels', () => {
  assert.match(dialog, /id: 'pair-code-panel'/);
  assert.match(dialog, /id: 'pair-pin-panel', hidden: true/);
  assert.match(dialog, /showPin\.addEventListener\('click', \(\) => \{ codePanel\.hidden = true; pinPanel\.hidden = false; \}\)/);
  assert.match(dialog, /backToCode\.addEventListener\('click', \(\) => \{ pinPanel\.hidden = true; codePanel\.hidden = false; \}\)/);
  assert.match(dialog, /Pincode tonen \(QR-code verbergen\)/);
  assert.match(dialog, /Pincode tonen \(koppelcode verbergen\)/);
  assert.match(dialog, /De koppelcode is verborgen/);
});

test('pairing UI offers separate copy actions for the code and PIN', () => {
  assert.match(dialog, /Koppelcode kopiëren/);
  assert.match(dialog, /Pincode kopiëren/);
  assert.match(dialog, /copy\(code, field, toast, 'Koppelcode'\)/);
  assert.match(dialog, /copy\(pin, null, toast, 'Pincode'\)/);
  assert.match(source, /navigator\.clipboard\.writeText\(text\)/);
});

test('the QR image and PIN are never in the same panel', () => {
  assert.match(dialog, /const codePanel = h\('div', \{ class: 'stack', id: 'pair-code-panel' \}, qrImage, codeDetails, showPin\)/);
  assert.doesNotMatch(dialog.slice(dialog.indexOf('const pinPanel'), dialog.indexOf('const close')), /qrImage|field,/);
});

test('shell uses the shared pairing UI and marks a code used only after a successful link', () => {
  assert.match(shell, /pairUi\.openPairOutDialog\(/);
  assert.match(shell, /pairUi\.openPairing\(\{ input: v\.pairCode, pin: v\.pairPin, context: APP\.storagePrefix \}\)/);
  const submit = shell.slice(shell.indexOf("linkForm.addEventListener('submit'"), shell.indexOf('function handleIncomingPairLink'));
  assert.ok(submit.indexOf('vault.importEnvelope') < submit.indexOf('pairing.markUsed()'), 'markUsed moet na importEnvelope staan');
  assert.match(shell, /handleIncomingPairLink\(\);\n\}/);
  assert.doesNotMatch(shell, /from '\.\/pair\.js'/);
});
