import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const sourceRoot = process.cwd();

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'pwa-core-manifest-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'tools'), { recursive: true });
  await mkdir(join(root, 'js/core'), { recursive: true });
  await mkdir(join(root, 'css'), { recursive: true });
  await cp(join(sourceRoot, 'tools/manifest.mjs'), join(root, 'tools/manifest.mjs'));
  await writeFile(join(root, 'js/core/example.js'), 'export const example = true;\n');
  await writeFile(join(root, 'css/base.css'), ':root { color-scheme: light dark; }\n');
  const manifest = {
    schemaVersion: 1,
    coreVersion: '0.1.0-dev.1',
    releaseStatus: 'unreleased',
    source: {
      repository: 'Gertjun/PWA-Template',
      ref: 'main',
      commit: '0f538f8acf40d086df38e9bc4ed2cd875925c569'
    },
    allowlist: ['js/core/example.js', 'css/base.css'],
    checksums: {}
  };
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest, null, 2));
  return { root, manifest };
}

async function run(root, command) {
  try {
    return await execFileAsync(process.execPath, [join(root, 'tools/manifest.mjs'), command], { cwd: root });
  } catch (error) {
    throw new Error(error.stderr || error.message);
  }
}

test('valideert een unreleased manifest met lege checksums', async t => {
  const { root } = await fixture(t);
  const result = await run(root, 'verify');
  assert.match(result.stdout, /Unreleased manifest/);
});

test('weigert een released manifest zonder volledige checksums', async t => {
  const { root, manifest } = await fixture(t);
  manifest.releaseStatus = 'released';
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(run(root, 'verify'), /released manifest moet/);
});

test('genereert en verifieert volledige SHA-256-checksums', async t => {
  const { root } = await fixture(t);
  await run(root, 'generate');
  const manifest = JSON.parse(await readFile(join(root, 'core-manifest.json'), 'utf8'));
  assert.equal(Object.keys(manifest.checksums).length, 2);
  await run(root, 'verify');
});

test('genereert volledige checksums opnieuw vanuit een gedeeltelijke checksum-map', async t => {
  const { root, manifest } = await fixture(t);
  manifest.checksums = { 'js/core/example.js': 'not-a-valid-checksum' };
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest, null, 2));

  await run(root, 'generate');
  const regenerated = JSON.parse(await readFile(join(root, 'core-manifest.json'), 'utf8'));
  assert.deepEqual(Object.keys(regenerated.checksums).sort(), ['css/base.css', 'js/core/example.js']);
  assert.match(regenerated.checksums['js/core/example.js'], /^[a-f0-9]{64}$/);
  assert.match(regenerated.checksums['css/base.css'], /^[a-f0-9]{64}$/);
  await run(root, 'verify');
});

test('detecteert gewijzigde bestanden na checksumgeneratie', async t => {
  const { root } = await fixture(t);
  await run(root, 'generate');
  await writeFile(join(root, 'js/core/example.js'), 'export const example = false;\n');
  await assert.rejects(run(root, 'verify'), /Checksum mismatch/);
});

test('weigert ongeldige checksumformaten', async t => {
  const { root, manifest } = await fixture(t);
  manifest.checksums = { 'js/core/example.js': 'not-a-sha256' };
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(run(root, 'verify'), /Ongeldig SHA-256-formaat/);
});

test('weigert paden buiten de allowlist', async t => {
  const { root, manifest } = await fixture(t);
  manifest.allowlist = ['../secrets.js'];
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(run(root, 'verify'), /Niet-toegestaan kernbestand/);
});

test('weigert ongeldige SemVer en source-commit', async t => {
  const { root, manifest } = await fixture(t);
  manifest.coreVersion = 'latest';
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(run(root, 'verify'), /geldige SemVer/);
});

test('weigert niet-canonieke SemVer-versies', async t => {
  const { root, manifest } = await fixture(t);
  manifest.coreVersion = '01.2.3';
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(run(root, 'verify'), /geldige SemVer/);
});

test('weigert gedeeltelijke checksums', async t => {
  const { root, manifest } = await fixture(t);
  manifest.checksums = { 'js/core/example.js': 'a'.repeat(64) };
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(run(root, 'verify'), /Checksums zijn gedeeltelijk/);
});

test('weigert checksums voor bestanden buiten de allowlist', async t => {
  const { root, manifest } = await fixture(t);
  manifest.checksums = { 'js/core/not-allowed.js': 'a'.repeat(64) };
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(run(root, 'verify'), /Checksum staat niet op de allowlist/);
});

test('weigert symlinked kernbestanden', async t => {
  const { root } = await fixture(t);
  const { symlink } = await import('node:fs/promises');
  await (await import('node:fs/promises')).unlink(join(root, 'js/core/example.js'));
  await symlink(join(root, 'css/base.css'), join(root, 'js/core/example.js'));
  await assert.rejects(run(root, 'verify'), /Symlinks zijn niet toegestaan/);
});

test('weigert een ongeldige broncommit-SHA', async t => {
  const { root, manifest } = await fixture(t);
  manifest.source.commit = 'not-a-commit-sha';
  await writeFile(join(root, 'core-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(run(root, 'verify'), /geldige commit-SHA/);
});
