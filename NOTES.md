# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele stand
- Initiële extractie uit PWA-Template 1.5.0 staat op `main`.
- 12 JavaScript-modules en `css/base.css` vormen de huidige distributie-allowlist.
- PR #1 t/m #8 zijn via squash merge verwerkt in `main`: manifestvalidatie/documentatie, crypto/records, deletion ledger, kluis-, synchronisatie- en passkeycontracttests, precache-validator en handmatige releaseworkflow.
- PR #4: 9 geïsoleerde kluiscontracttests; CI-run #43213355874 geslaagd.
- PR #5: 8 synchronisatiecontracttests; CI-run #43213584229 geslaagd.
- PR #6: 9 WebAuthn PRF-contracttests met nagebootste browserantwoorden; CI-runs #43213798190 en #43213816024 geslaagd.
- PR #7: statische service-worker-precache-validator; CI-run #43215106266 geslaagd (78 tests).
- PR #8: releasemanifestpoort en handmatige releaseworkflow; CI-run #43215409264 geslaagd (84 tests).
- Mergecommit PR #6: `c32615b001895fe4f29109b030e64438f0f1a41d`; PR #7: `b847f2976cd428fc976e96ae0a88670535eb9109`; PR #8: `73f63b3be0e6fc6ae9d7dd3db1428b9d0be537aa`.
- De precache-validator draait in de root van een ontvangende app met `core-manifest.json` en `sw.js`; hij wijzigt de service worker niet.
- De drie pilotapps zijn nog niet naar de huidige PWA-Core-allowlist gemigreerd en bevatten momenteel niet `js/core/deletions.js`. Dat is dus geen losse precache-regressie; module en precache-entry moeten samen worden toegevoegd in de toekomstige afzonderlijke migratie-PR per app. PWA-Template 1.5.0 bevat de volledige allowlist in de precache.
- De handmatige releaseworkflow is beschikbaar op `main`, maar de huidige manifeststatus is nog `unreleased`; er is geen officiële release of release-tag.
- Node-mocks bewijzen niet de werking van Face ID, Touch ID, Windows Hello of echte platformauthenticators.
- Geen pilotapp is aangepast.

## Open punten
1. Tag protection/rulesets vóór de eerste productie-release instellen.
2. Echte browser-/apparaatpraktijktests voor passkey-PRF en wachtwoordterugval uitvoeren.
3. Distributieworkflow per pilotapp voorbereiden; uitsluitend via aparte PR's.
4. Per pilotapp core-bestanden, versiepinning, manifestchecksums en service-worker-precache in één afzonderlijke migratie-PR integreren.
5. Integratie-, offline- en praktijktests uitvoeren in MW4-CAMO, Energieverbruik en Games Backlog.
6. Cryptotracker en Vaste Lasten later afzonderlijk analyseren.

## Sessielog
- **12 nov 2026:** PR #8 gemerged (guarded handmatige releaseworkflow en manifestpoort), squash-commit `73f63b3be0e6fc6ae9d7dd3db1428b9d0be537aa`; CI-run #43215409264 geslaagd met 84 tests.
- **12 nov 2026:** PR #7 gemerged (precache-validator, tests en documentatie), squash-commit `b847f2976cd428fc976e96ae0a88670535eb9109`; CI-run #43215106266 geslaagd met 78 tests.
- **12 nov 2026:** PR #6 gemerged (9 geïsoleerde WebAuthn PRF-contracttests), squash-commit `c32615b001895fe4f29109b030e64438f0f1a41d`; CI-runs #43213798190 en #43213816024 geslaagd.
- **12 nov 2026:** pilotserviceworkers vergeleken. PWA-Template 1.5.0 bevat alle allowlisted core-bestanden; de drie pilotapps zijn nog niet op de nieuwe allowlist gemigreerd. Er is daarom geen app-serviceworker aangepast.
