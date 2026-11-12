import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'core-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const allowed = (p) => (p.startsWith('js/core/') && p.endsWith('.js')) || p === 'css/base.css';

if (!Array.isArray(manifest.allowlist) || new Set(manifest.allowlist).size !== manifest.allowlist.length) {
  throw new Error('Manifest allowlist ontbreekt of bevat dubbele paden.');
}
for (const path of manifest.allowlist) {
  if (!allowed(path) || path.includes('..') || path.startsWith('/')) throw new Error(`Niet-toegestaan kernbestand: ${path}`);
}
if (process.argv[2] === 'generate') {
  const checksums = {};
  for (const path of manifest.allowlist) {
    const bytes = await readFile(resolve(root, path));
    checksums[path] = createHash('sha256').update(bytes).digest('hex');
  }
  manifest.checksums = checksums;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`SHA-256-checksums bijgewerkt voor ${Object.keys(checksums).length} bestanden.`);
} else if (process.argv[2] === 'verify') {
  const keys = Object.keys(manifest.checksums || {});
  if (keys.length === 0 && manifest.releaseStatus === 'unreleased') {
    console.log('Unreleased manifest: allowlist gecontroleerd; checksums worden bij release gegenereerd.');
  } else {
    if (keys.length !== manifest.allowlist.length || manifest.allowlist.some(p => !manifest.checksums?.[p])) {
      throw new Error('Manifest bevat niet voor elk allowlisted bestand een checksum.');
    }
    for (const path of manifest.allowlist) {
      const actual = createHash('sha256').update(await readFile(resolve(root, path))).digest('hex');
      if (actual !== manifest.checksums[path]) throw new Error(`Checksum mismatch: ${path}`);
    }
    console.log(`Alle ${keys.length} SHA-256-checksums zijn geldig.`);
  }
} else {
  throw new Error('Gebruik: node tools/manifest.mjs generate|verify');
}
