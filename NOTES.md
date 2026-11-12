# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele stand
- Initiële extractie uit PWA-Template 1.5.0 staat op `main`.
- 12 JavaScript-modules en `css/base.css` vormen de huidige distributie-allowlist.
- PR #1 t/m #6 zijn via squash merge verwerkt in `main`: manifestvalidatie/documentatie, crypto/records, deletion ledger, kluis-, synchronisatie- en passkeycontracttests.
- PR #4: 9 geïsoleerde kluiscontracttests; CI-run #43213355874 geslaagd.
- PR #5: 8 synchronisatiecontracttests; CI-run #43213584229 geslaagd.
- PR #6: 9 WebAuthn PRF-contracttests met nagebootste browserantwoorden; CI-runs #43213798190 en #43213816024 geslaagd.
- Mergecommit PR #6: `c32615b001895fe4f29109b030e64438f0f1a41d`.
- Branch `feature/precache-validator` bevat een CLI-tool en tests voor statische service-worker-precache-validatie; CI-validatie loopt via PR.
- De validator is bedoeld om in de root van een ontvangende app te draaien met `core-manifest.json` en `sw.js`; hij wijzigt de service worker niet.
- Node-mocks bewijzen niet de werking van Face ID, Touch ID, Windows Hello of echte platformauthenticators.
- Er is nog geen officiële release of release-tag.
- Geen pilotapp is aangepast.

## Open punten
1. Precache-validator laten slagen in CI en reviewen; nog niet mergen.
2. De ontbrekende `js/core/deletions.js`-precache-entry in MW4-CAMO later via een afzonderlijke app-PR oplossen.
3. Echte browser-/apparaatpraktijktests voor passkey-PRF en wachtwoordterugval uitvoeren.
4. Releaseworkflow bouwen met immutable SemVer-tag, manifest, checksums en artifactcontrole.
5. Distributieworkflow per pilotapp voorbereiden; uitsluitend via aparte PR's.
6. Integratie-, offline- en praktijktests uitvoeren in MW4-CAMO, Energieverbruik en Games Backlog.
7. Cryptotracker en Vaste Lasten later afzonderlijk analyseren.

## Sessielog
- **12 nov 2026:** PR #6 gemerged (9 geïsoleerde WebAuthn PRF-contracttests), squash-commit `c32615b001895fe4f29109b030e64438f0f1a41d`; CI-runs #43213798190 en #43213816024 geslaagd.
- **12 nov 2026:** branch `feature/precache-validator` aangemaakt; `tools/precache.mjs` en `tests/precache.test.js` toegevoegd. De tool controleert manifest-allowlist, lokale bestanden en statische service-worker-PRECACHE zonder app-bestanden te wijzigen.
- **12 nov 2026:** README en releasehandleiding bijgewerkt met gebruik en scope van de precache-validator. CI-validatie volgt via PR.
- **12 nov 2026:** bij inspectie bleek PWA-Template 1.5.0 alle 13 allowlisted bestanden te precachen; MW4-CAMO mist `js/core/deletions.js` in zijn precache. Dit wordt niet in deze core-PR aangepast.
