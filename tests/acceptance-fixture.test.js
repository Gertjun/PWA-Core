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

test('acceptance deployment is manual, main-only and uses the exact checked-out commit', async () => {
  const workflow = await read('.github/workflows/deploy-acceptance.yml');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /\$REF" != "refs\/heads\/main"/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /actions\/checkout@11bd71901bbe5b1630ceea73d27597364c9af683/);
  assert.match(workflow, /actions\/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745b/);
  assert.match(workflow, /actions\/upload-pages-artifact@7b1f4a764d45c48632c6b24a0339c27f5614fb0b/);
  assert.match(workflow, /actions\/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /name: github-pages/);
  assert.doesNotMatch(workflow, /uses: actions\/(?:configure-pages|upload-pages-artifact|deploy-pages)@v\d/);
});
