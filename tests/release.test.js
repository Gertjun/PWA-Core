import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReleaseManifest } from '../tools/release.mjs';

const checksum = 'a'.repeat(64);
const manifest = () => ({
  coreVersion: '1.0.0',
  releaseStatus: 'released',
  allowlist: ['js/core/example.js', 'css/base.css'],
  checksums: {
    'js/core/example.js': checksum,
    'css/base.css': 'b'.repeat(64),
  },
});

test('accepteert een released manifest met volledige SHA-256-dekking', () => {
  assert.deepEqual(validateReleaseManifest(manifest(), '1.0.0'), { version: '1.0.0', files: 2 });
});

test('weigert unreleased manifest', () => {
  const value = manifest();
  value.releaseStatus = 'unreleased';
  assert.throws(() => validateReleaseManifest(value, '1.0.0'), /niet released/i);
});

test('weigert versieverschil tussen input en manifest', () => {
  assert.throws(() => validateReleaseManifest(manifest(), '1.0.1'), /komt niet overeen/i);
});

test('weigert niet-canonieke SemVer input', () => {
  assert.throws(() => validateReleaseManifest(manifest(), '01.0.0'), /stabiele SemVer/i);
});

test('weigert prereleaseversies en buildmetadata voor stabiele releases', () => {
  assert.throws(() => validateReleaseManifest(manifest(), '1.0.0-rc.1'), /stabiele SemVer/i);
  assert.throws(() => validateReleaseManifest(manifest(), '1.0.0+build.1'), /stabiele SemVer/i);
});

test('weigert ontbrekende en onverwachte checksums', () => {
  const missing = manifest();
  delete missing.checksums['css/base.css'];
  assert.throws(() => validateReleaseManifest(missing, '1.0.0'), /exact één checksum/i);

  const extra = manifest();
  extra.checksums['js/core/not-allowed.js'] = checksum;
  assert.throws(() => validateReleaseManifest(extra, '1.0.0'), /exact één checksum/i);
});

test('weigert malformed checksum en dubbele allowlist-paden', () => {
  const malformed = manifest();
  malformed.checksums['css/base.css'] = 'not-a-hash';
  assert.throws(() => validateReleaseManifest(malformed, '1.0.0'), /Ongeldige SHA-256/i);

  const duplicate = manifest();
  duplicate.allowlist.push('css/base.css');
  assert.throws(() => validateReleaseManifest(duplicate, '1.0.0'), /dubbele paden/i);
});
