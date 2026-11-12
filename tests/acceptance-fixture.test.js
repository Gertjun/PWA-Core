import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const read = (path) => readFile(join(process.cwd(), path), 'utf8');

test('acceptance fixture loads only same-origin static assets and blocks runtime connections', async () => {
  const html = await read('tests/acceptance/index.html');
  assert.match(html, /script-src 'self'/);
  assert.match(html, /style-src 'self'/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//i);
});

test('acceptance fixture JavaScript does not use network APIs', async () => {
  const source = await read('tests/acceptance/js/acceptance.js');
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
});

test('acceptance fixture uses a dedicated storage namespace', async () => {
  const config = await read('tests/acceptance/js/config.js');
  assert.match(config, /storagePrefix:\s*['"]pwa-core-acceptance-v1['"]/);
});

test('acceptance fixture persists only a password-wrapped synthetic key', async () => {
  const source = await read('tests/acceptance/js/acceptance.js');
  assert.match(source, /cryptoModule\.wrapDataKey\(dataKey, wrappingKey\)/);
  assert.match(source, /wrapped,\s*\}\)\)/);
  assert.doesNotMatch(source, /localStorage\.setItem\([^\n]*password/i);
});


test('acceptance fixture reports a readable password error instead of the Web Crypto OperationError', async () => {
  const source = await read('tests/acceptance/js/acceptance.js');
  assert.match(source, /class WrongPasswordError extends Error/);
  assert.match(source, /super\('Onjuist wachtwoord\.'/);
  assert.match(source, /try\s*\{\s*return await cryptoModule\.unwrapDataKey\(record\.wrapped, wrappingKey\);\s*\}\s*catch\s*\{/);
  assert.match(source, /throw new WrongPasswordError\(\)/);
});

test('acceptance fixture buttons use explicit high-contrast colors across browser color schemes', async () => {
  const css = await read('tests/acceptance/acceptance.css');
  assert.match(css, /color-scheme:\s*light/);
  assert.match(css, /button\s*\{[^}]*background:\s*#1d4ed8;[^}]*color:\s*#fff;/s);
  assert.match(css, /button\.secondary\s*\{[^}]*background:\s*#eef2f7;[^}]*color:\s*#172033;/s);
  assert.doesNotMatch(css, /ButtonFace|ButtonText|CanvasText/);
});

test('acceptance deployment is manual, main-only and uses the exact checked-out commit', async () => {
  const workflow = await read('.github/workflows/deploy-acceptance.yml');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /\$REF" != "refs\/heads\/main"/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
  assert.match(workflow, /actions\/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d/);
  assert.match(workflow, /actions\/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9/);
  assert.match(workflow, /actions\/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /name: github-pages/);
  assert.doesNotMatch(workflow, /uses: actions\/(?:configure-pages|upload-pages-artifact|deploy-pages)@v\d/);
});
