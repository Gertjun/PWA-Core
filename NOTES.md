# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele stand
- Fase 3 gestart: release-pincontract uitgewerkt in PR #12 (`feature/release-pin-contract`); PR nog niet gemerged op het moment van deze notitie.
- Nieuwe `pwa-core.lock.json`-specificatie legt repository, stabiele SemVer, `vX.Y.Z`, volledige 40-teken releasecommit-SHA en SHA-256 van de exacte manifestbytes vast. `tools/pin.mjs verify` valideert dit offline plus alle lokale core-bestanden.
- PR #12 CI-run #43217947495 geslaagd: 94 tests, 0 failures. Eerdere mislukte runs betroffen een tijdelijke fout in de nieuwe testfixture; gecorrigeerd vóór de geslaagde run.
- Initiële extractie uit PWA-Template 1.5.0 staat op `main`.
- 12 JavaScript-modules en `css/base.css` vormen de huidige distributie-allowlist.
- PR #1 t/m #10 zijn via squash merge verwerkt in `main`; PR #9 legde de releaseworkflow-status vast en PR #10 voegde platformacceptatie-/tagbeveiligingsdocumentatie toe.
- PR #4: 9 geïsoleerde kluiscontracttests; CI-run #43213355874 geslaagd.
- PR #5: 8 synchronisatiecontracttests; CI-run #43213584229 geslaagd.
- PR #6: 9 WebAuthn PRF-contracttests met nagebootste browserantwoorden; CI-runs #43213798190 en #43213816024 geslaagd.
- PR #7: statische service-worker-precache-validator; CI-run #43215106266 geslaagd (78 tests).
- PR #8: releasemanifestpoort en handmatige releaseworkflow; CI-run #43215409264 geslaagd (84 tests).
- Mergecommit PR #6: `c32615b001895fe4f29109b030e64438f0f1a41d`; PR #7: `b847f2976cd428fc976e96ae0a88670535eb9109`; PR #8: `73f63b3be0e6fc6ae9d7dd3db1428b9d0be537aa`.
- De precache-validator draait in de root van een ontvangende app met `core-manifest.json` en `sw.js`; hij wijzigt de service worker niet.
- De drie pilotapps hebben onderling dezelfde hashes voor 11 bestaande js/core-modules plus css/base.css (12 bestanden). Vergeleken met PWA-Core main zijn 8 van die 11 modules plus CSS identiek; shell.js, sync.js en vault.js verschillen. deletions.js ontbreekt in alle drie. De migratie moet de drie bijgewerkte modules en deletions.js als één samenhangende wijziging opnemen en de precache per app gericht uitbreiden.
- De handmatige releaseworkflow is beschikbaar op `main`, maar de huidige manifeststatus is nog `unreleased`; er is geen officiële release of release-tag.
- Node-mocks bewijzen niet de werking van Face ID, Touch ID, Windows Hello of echte platformauthenticators.
- Laatste main-commit na PR #10: `c637fc0152660eec692cd8ff9a562de5fbb66275`; Core checks-run #43216507632 is geslaagd.
- core-manifest.json: coreVersion 0.1.0-dev.1, releaseStatus unreleased, lege checksums; geen stabiele release of tag.
- GitHub geeft geen repository-rulesets terug; branchmetadata toont main als niet beschermd. Er zijn nog geen tagregels ingesteld. Geen instellingen gewijzigd.
- De PRF-contracttests gebruiken nagebootste WebAuthn-antwoorden. Echte platformtests zijn nog niet uitgevoerd. bio.isSupported() controleert momenteel platform-authenticatorbeschikbaarheid, niet de daadwerkelijke PRF-capability.
- Geen pilotapp is aangepast.

## Open punten
1. Tag ruleset voor v* door de gebruiker instellen vóór de eerste productie-release; aanbevolen configuratie staat in docs/RELEASING.md.
2. Echte browser-/apparaatpraktijktests voor passkey-PRF en wachtwoordterugval uitvoeren volgens docs/PLATFORM-ACCEPTANCE.md.
3. Per pilotapp de actuele contractverschillen verder valideren en een afzonderlijke migratie-PR voorbereiden zodra een stabiele PWA-Core-release is toegestaan.
4. Per pilotapp core-bestanden, versiepinning, manifestchecksums en service-worker-precache in één afzonderlijke migratie-PR integreren.
5. Integratie-, offline- en praktijktests uitvoeren in MW4-CAMO, Energieverbruik en Games Backlog.
6. Cryptotracker en Vaste Lasten later afzonderlijk analyseren.

## Sessielog
- **12 nov 2026:** Fase 3 gestart. PR #12 maakt een app-specifieke release-pin en offline validator; CI-run #43217947495 geslaagd (94 tests). Geen release, tag, app-repository of repository-instelling gewijzigd.
- **12 nov 2026:** PR #10 gemerged (platformacceptatiechecklist, tag-rulesetvoorstel, correctie migratie-inventaris en werkafspraken), squash-commit `c637fc0152660eec692cd8ff9a562de5fbb66275`; Core checks-run #43216507632 geslaagd.
- **12 nov 2026:** actuele GitHub-status en pilotbestanden gecontroleerd. PR #9 is gemerged; main stond op 2474c3e1039cfa27f0b83216a5ceeabd4940548d, Core checks-run #43215622299 geslaagd. Rulesets ontbreken en main is niet beschermd. Pilotapps delen 11 oudere core-modules + CSS; drie modules verschillen met PWA-Core en deletions.js ontbreekt. Geen app- of repository-instellingen gewijzigd.
- **12 nov 2026:** PR #8 gemerged (guarded handmatige releaseworkflow en manifestpoort), squash-commit `73f63b3be0e6fc6ae9d7dd3db1428b9d0be537aa`; CI-run #43215409264 geslaagd met 84 tests.
- **12 nov 2026:** PR #7 gemerged (precache-validator, tests en documentatie), squash-commit `b847f2976cd428fc976e96ae0a88670535eb9109`; CI-run #43215106266 geslaagd met 78 tests.
- **12 nov 2026:** PR #6 gemerged (9 geïsoleerde WebAuthn PRF-contracttests), squash-commit `c32615b001895fe4f29109b030e64438f0f1a41d`; CI-runs #43213798190 en #43213816024 geslaagd.
- **12 nov 2026:** pilotserviceworkers vergeleken. PWA-Template 1.5.0 bevat alle allowlisted core-bestanden; de drie pilotapps zijn nog niet op de nieuwe allowlist gemigreerd. Er is daarom geen app-serviceworker aangepast.
