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
  assert.match(workflow, /REF != "refs\/heads\/main"/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /actions\/checkout@11bd71901bbe5b1630ceea73d27597364c9af683/);
  assert.match(workflow, /push origin HEAD:gh-pages/);
  assert.doesNotMatch(workflow, /push --force|push -f/);
});
