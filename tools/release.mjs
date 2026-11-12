import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const stableSemver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function validateReleaseManifest(manifest, requestedVersion) {
  if (typeof requestedVersion !== 'string' || !stableSemver.test(requestedVersion)) {
    throw new Error('De aangevraagde releaseversie moet een stabiele SemVer-versie X.Y.Z zijn (zonder prerelease- of buildmetadata).');
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Core-manifest moet een JSON-object zijn.');
  }
  if (manifest.releaseStatus !== 'released') {
    throw new Error('Release geblokkeerd: manifest releaseStatus is niet released.');
  }
  if (manifest.coreVersion !== requestedVersion) {
    throw new Error('Releaseversie komt niet overeen met coreVersion in het manifest.');
  }
  if (!Array.isArray(manifest.allowlist) || manifest.allowlist.length === 0 ||
      new Set(manifest.allowlist).size !== manifest.allowlist.length) {
    throw new Error('Manifest allowlist ontbreekt, is leeg of bevat dubbele paden.');
  }
  if (!manifest.checksums || typeof manifest.checksums !== 'object' || Array.isArray(manifest.checksums)) {
    throw new Error('Manifest bevat geen geldige checksum-map.');
  }
  const paths = Object.keys(manifest.checksums);
  if (paths.length !== manifest.allowlist.length ||
      manifest.allowlist.some(path => !Object.hasOwn(manifest.checksums, path)) ||
      paths.some(path => !manifest.allowlist.includes(path))) {
    throw new Error('Release vereist exact één checksum voor ieder allowlisted bestand.');
  }
  for (const [path, checksum] of Object.entries(manifest.checksums)) {
    if (typeof checksum !== 'string' || !/^[a-f0-9]{64}$/.test(checksum)) {
      throw new Error('Ongeldige SHA-256-checksum voor: ' + path);
    }
  }
  return { version: requestedVersion, files: manifest.allowlist.length };
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] !== 'validate' || args[1] !== '--version' || !args[2]) {
    throw new Error('Gebruik: node tools/release.mjs validate --version 1.2.3');
  }
  const manifest = JSON.parse(await readFile(resolve('core-manifest.json'), 'utf8'));
  const result = validateReleaseManifest(manifest, args[2]);
  console.log('Releasemanifest OK: v' + result.version + ', ' + result.files + ' bestanden met SHA-256-checksum.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('RELEASEVALIDATIE FOUT: ' + error.message);
    process.exitCode = 1;
  });
}
