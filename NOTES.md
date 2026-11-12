# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele stand
- Fase 3: PR #12 en PR #13 zijn gemerged. PR #12 voegde `pwa-core.lock.json` en `tools/pin.mjs verify` toe; PR #13 verbeterde PRF-capabilitydetectie, foutmeldingen en wachtwoordfallback.
- PR #12 CI-run #43218070460 geslaagd (94 tests); PR #13 CI-run #43218463431 geslaagd (99 tests). Beide merges hebben ook een geslaagde post-merge CI-run.
- Actuele `main` vóór PR #14: `f15ae53bac7c0530120489eda9d6ba3d4b369ee4`. PR #1 t/m #13 zijn gemerged; geen openstaande PR's op dat controlemoment.
- `core-manifest.json` staat nog op `0.1.0-dev.1` / `unreleased`; geen stabiele release, tag of pilotmigratie.
- Echte iPhone/iPad Safari- en Windows 11-platformtests ontbreken nog. De 99 CI-tests bevatten uitsluitend mock-/contracttests voor WebAuthn.
- Geen actieve repository-rulesets; `main` is niet beschermd. Er zijn geen repository-instellingen gewijzigd.
- Initiële extractie uit PWA-Template 1.5.0 staat op `main`.
- 12 JavaScript-modules en `css/base.css` vormen de huidige distributie-allowlist.
- PR #1 t/m #13 zijn via squash merge verwerkt in `main`.
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
- **12 nov 2026:** PR #14 voorbereidt release-integriteit: checkout op exacte dispatchcommit, stabiele SemVer-poort, SHA-pinning van CI-actions, bruikbare ZIP-checksum en voorstel voor main-ruleset. PR-CI #43218861115 geslaagd (100 tests); PR nog niet gemerged op het moment van deze notitie.
- **12 nov 2026:** PR #12 gemerged (app-specifieke release-pin + offline validator), squash-commit `7310ad30922b2f9d0ba7b9c2ce90f331579dc36d`; PR-CI #43218070460 en post-merge CI #43218132736 geslaagd (94 tests).
- **12 nov 2026:** PR #13 gemerged (WebAuthn PRF-capabilitydetectie en wachtwoordfallback), squash-commit `f15ae53bac7c0530120489eda9d6ba3d4b369ee4`; PR-CI #43218463431 en post-merge CI #43218537815 geslaagd (99 tests). Echte platformtests niet uitgevoerd.
- **12 nov 2026:** Fase 3 PRF-verbetering voorbereid in PR #13 (`fix/webauthn-prf-capability-fallback`): browsercapabilitydetectie, daadwerkelijke authenticator-resultaatcontrole, duidelijkere fout-/wachtwoordmeldingen en aanvullende mocktests. Echte platformtests blijven open.
- **12 nov 2026:** Fase 3 gestart. PR #12 maakt een app-specifieke release-pin en offline validator; CI-run #43217947495 geslaagd (94 tests). Geen release, tag, app-repository of repository-instelling gewijzigd.
- **12 nov 2026:** PR #10 gemerged (platformacceptatiechecklist, tag-rulesetvoorstel, correctie migratie-inventaris en werkafspraken), squash-commit `c637fc0152660eec692cd8ff9a562de5fbb66275`; Core checks-run #43216507632 geslaagd.
- **12 nov 2026:** actuele GitHub-status en pilotbestanden gecontroleerd. PR #9 is gemerged; main stond op 2474c3e1039cfa27f0b83216a5ceeabd4940548d, Core checks-run #43215622299 geslaagd. Rulesets ontbreken en main is niet beschermd. Pilotapps delen 11 oudere core-modules + CSS; drie modules verschillen met PWA-Core en deletions.js ontbreekt. Geen app- of repository-instellingen gewijzigd.
- **12 nov 2026:** PR #8 gemerged (guarded handmatige releaseworkflow en manifestpoort), squash-commit `73f63b3be0e6fc6ae9d7dd3db1428b9d0be537aa`; CI-run #43215409264 geslaagd met 84 tests.
- **12 nov 2026:** PR #7 gemerged (precache-validator, tests en documentatie), squash-commit `b847f2976cd428fc976e96ae0a88670535eb9109`; CI-run #43215106266 geslaagd met 78 tests.
- **12 nov 2026:** PR #6 gemerged (9 geïsoleerde WebAuthn PRF-contracttests), squash-commit `c32615b001895fe4f29109b030e64438f0f1a41d`; CI-runs #43213798190 en #43213816024 geslaagd.
- **12 nov 2026:** pilotserviceworkers vergeleken. PWA-Template 1.5.0 bevat alle allowlisted core-bestanden; de drie pilotapps zijn nog niet op de nieuwe allowlist gemigreerd. Er is daarom geen app-serviceworker aangepast.
