# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele status – bijgewerkt na PR #33 en releasevoorbereiding

- PR's #1 t/m #33 zijn gemerged naar `main`; PR #27 bevat de Safari-contrastcorrectie, PR #28 legt de eerste platformronde vast, PR #30 corrigeert de wachtwoordfoutmelding in de acceptatiefixture, PR #31 legt de geslaagde hertest vast en PR #33 actualiseert de releasevoorbereidingsdocumentatie.
- De geïsoleerde WebAuthn-acceptatiefixture is gepubliceerd op `https://gertjun.github.io/PWA-Core/acceptance/`.
- Eerste echte platformronde: iPhone en iPad met Safari/Face ID/iCloud-sleutelhanger en Windows 11 met Chrome en Edge. Fixture, testkluis, passkeyregistratie en PRF-ontgrendeling zijn op alle vier combinaties geslaagd (16/16 controles). Chrome en Edge gebruikten afzonderlijke testkluizen, wachtwoorden en passkeys.
- Tweede acceptatieronde: wachtwoordfallback zonder passkey, annuleren van de passkeyprompt met herstel via wachtwoord, onjuist wachtwoord gevolgd door succesvol correct wachtwoord, herladen en opnieuw ontgrendelen, en sessieonderbreking/herstel zijn door de gebruiker als geslaagd bevestigd.
- De verkeerde-wachtwoordtest is na merge en deployment van PR #30 opnieuw uitgevoerd en door de gebruiker geslaagd bevestigd: de fixture toont nu `WrongPasswordError` / “Onjuist wachtwoord.” De eerdere `OperationError – Onbekende fout` was fixture-specifiek; de normale app-route had dit foutcontract al. AES-GCM kan een verkeerd wachtwoord niet onderscheiden van een beschadigde wrapped key.
- Offlineacceptatie blijft open en moet per pilotapp worden getest; de fixture installeert geen service worker en valideert geen offline cache.
- Exacte OS-/browserversies, apparaatmodellen en Windows-authenticatorbuild zijn niet voor alle tests geregistreerd; zie `docs/PLATFORM-ACCEPTANCE.md`.

## Actuele stand

- PR's #1 t/m #33 zijn gemerged naar `main`; PR #23 is eerder als verouderde tussenversie gesloten.
- PR #28 documenteert de eerste echte platformacceptatie; PR #30 en #31 de fixturecorrectie en geslaagde hertest; PR #32 actualiseert de releasebeveiligingsdocumentatie en PR #33 werkt de releasegates en beveiligingsdocumentatie bij. Offlineacceptatie blijft open voor de afzonderlijke pilotmigraties.
- Laatste gecontroleerde `main`-commit vóór deze releasevoorbereidingsbranch: `273880ee53b9607f97353ed9b7ce3936553e51f0` (na merge PR #33); de actuele post-merge `test`-run wordt gecontroleerd via GitHub Actions.
- Actieve GitHub-rulesets: `Protect main branch` (PR verplicht, 0 approvals, check `test` verplicht en strict up-to-date, branch deletion/non-fast-forward geblokkeerd, geen bypass) en `Protect published PWA-Core versions` (target `v*`, updates/verwijderingen geblokkeerd, geen bypass).
- Geen productiegegevens, kluisbestanden of tokens benaderd.

## Releasevoorbereiding 1.0.0

- De gebruiker heeft `1.0.0` goedgekeurd als eerste stabiele releaseversie.
- Releasebranch `release/prepare-v1.0.0`: manifestversie `1.0.0`, status `released`, SHA-256-checksums voor alle 13 allowlisted bestanden. Deze waarden zijn berekend op basis van de bestanden op `main` commit `273880ee53b9607f97353ed9b7ce3936553e51f0`.
- Dit is uitsluitend releasevoorbereiding. Er is geen tag of GitHub Release aangemaakt; publicatie volgt pas na merge en expliciete toestemming.

## Fase 3 – afgeronde technische werkzaamheden

### PR #22 – statusnotities

- PR #22 mergecommit: `79b6e9af9ccb983cb43b0f5f276a8b4608f443ae`; PR-CI #43221167689 en post-merge CI #43221232127 geslaagd (103 tests).

### WebAuthn-acceptatiefixture (PR #24)

- Test-only browserpagina, handmatige main-only deploymentworkflow via GitHub Pages Actions en statische beveiligingschecks zijn gemerged.
- PR #24 mergecommit: `3e9c9687392caecdc2d6b9011bb17dc49e7f1602`; PR-CI #43222484592 en post-merge CI #43222572070 geslaagd (108 tests).
- De fixture is gedeployed en gebruikt; de gebruiker heeft de testscenario's op de gepubliceerde pagina uitgevoerd.

### PR #21 – platformtestdocumentatie en status

- Documenteert 16 geautomatiseerde biometric/WebAuthn-contracttests; echte apparaatacceptatie blijft open.
- PR #21 mergecommit: `501010f32c3b1bb113c714ee3d4985a649a2186c`; PR-CI #43220950283 en post-merge CI #43221041401 geslaagd (103 tests).

### PR #20 – manifestchecksumherstel

- `node tools/manifest.mjs generate` kan nu ook een gedeeltelijke of ongeldige checksum-map volledig opnieuw genereren; `verify` blijft strikt.
- Nieuwe regressietest voor herstel vanuit gedeeltelijke checksum-map.
- PR #20 mergecommit: `ce10fdcc2bb751627388313e0920cc9a145c7c36`; PR-CI #43220748836 en post-merge CI #43220822973 geslaagd (103 tests).

### PR #19 – release- en pilotgates

- D12 verduidelijkt dat de core-release vóór de pilotmigraties wordt gepubliceerd; integratieacceptatie vindt per afzonderlijke pilot-PR plaats.
- PR #19 mergecommit: `ddffacf81b8fef69f19275ff04cd2baed7dcd56f`; PR-CI #43220560437 en post-merge CI #43220647002 geslaagd (102 tests).

### PRF-documentatiecorrectie (PR #18)

- Verouderde tekst over de PRF-capabilitydetectie verwijderd; de handleiding weerspiegelt nu `getClientCapabilities()` als adviserende detectie en de authenticatorrespons als beslissend.
- `NOTES.md` gecorrigeerd voor PR #17 en actuele main-status.
- PR #18 mergecommit: `4d07d6134c5a46dadd2a46cd4f793a796812b70e`; PR-CI #43220347472 en post-merge CI #43220403749 geslaagd (102 tests).

### Releasevolgorde (besluit D12)

- De core-release wordt eerst gepubliceerd na core-/platformgates; de drie pilotmigraties volgen daarna afzonderlijk via PR's. App-integratie is een gate per pilot-PR, geen voorwaarde voor publicatie van het nog ongebruikte core-artefact.

### Release-pincontract (PR #12)

- Iedere app krijgt een eigen `pwa-core.lock.json` met repository, stabiele SemVer, releasetag, volledige 40-teken commit-SHA en SHA-256 van de exacte bytes van `core-manifest.json`.
- `tools/pin.mjs verify` valideert de pin, manifeststatus, versie, tagnaam, checksumdekking, lokale core-bestanden en symlinks offline.
- De externe tag-naar-commit-relatie wordt aanvullend gecontroleerd in iedere toekomstige app-migratie-PR. Het manifest bevat bewust niet zijn eigen commit-SHA.
- PR #12 mergecommit: `7310ad30922b2f9d0ba7b9c2ce90f331579dc36d`; PR-CI #43218070460 (94 tests) en post-merge CI #43218132736 geslaagd.

### WebAuthn PRF en wachtwoordfallback (PR #13 en #15)

- `bio.isSupported()` gebruikt `PublicKeyCredential.getClientCapabilities()` wanneer beschikbaar. Een expliciete `extension:prf: false` blokkeert de passkey-optie; ontbrekende of falende detectie blijft onbekend.
- De authenticatorrespons blijft beslissend: registratie wordt afgewezen bij `prf.enabled === false` en registratie/ontgrendeling vereisen een werkelijk PRF-resultaat.
- PRF-uitvoer wordt vóór HKDF en opslag gecontroleerd op exact 32 bytes.
- Annulering, ontbrekende passkeys, niet-ondersteunde authenticators en ongeldige app-context krijgen duidelijkere meldingen. Wachtwoordontgrendeling blijft beschikbaar.
- PR #13 mergecommit: `f15ae53bac7c0530120489eda9d6ba3d4b369ee4`; PR-CI #43218463431 (99 tests) en post-merge CI #43218537815 geslaagd.
- PR #15 mergecommit: `6bacce70135666e9b01b4ab1069c62bf1534f88c`; PR-CI #43219255509 (102 tests) en post-merge CI #43219324529 geslaagd.
- Alle WebAuthn-tests zijn geautomatiseerde mock-/contracttests. Er zijn nog geen echte iPhone/iPad Safari- of Windows 11-platformtests uitgevoerd.

### Releaseworkflow en GitHub-beveiliging (PR #14)

- Releaseworkflow checkt exact `github.sha` uit en controleert dat `HEAD` dezelfde commit is als de dispatchcommit en de uiteindelijke releasetag.
- Officiële releases accepteren uitsluitend stabiele SemVer `X.Y.Z`; prerelease- en buildmetadata-versies worden geweigerd.
- CI- en release-actions zijn vastgepind op commit-SHA's.
- ZIP-checksumasset bevat de archiefnaam en kan vanuit dezelfde downloadmap met `sha256sum -c` worden gecontroleerd.
- PR #14 mergecommit: `bb925441b4746272a7489ee1b35b05562c9414bc`; PR-CI #43218952321 (100 tests) en post-merge CI #43219049927 geslaagd.
- Destijds waren de tag-ruleset en main-branch-ruleset alleen als voorstel gedocumenteerd. De actuele actieve configuratie staat hieronder en in `docs/RELEASING.md`.

## Releasegates – nog niet vrijgegeven

1. **Echte platformacceptatie:** de vastgelegde configuraties (iPhone/iPad Safari en Windows 11 Chrome/Edge) zijn geslaagd, inclusief PRF en wachtwoordfallback. Exacte OS-/browserversies en apparaatmodellen ontbreken nog. Offlineacceptatie wordt per pilotapp uitgevoerd na migratie van de service-worker-cache; dit blokkeert de eerste Core-release niet (D12).
2. **Repositorybeveiliging:** afgerond. De actieve main-ruleset vereist PR's en de check `test`, met 0 verplichte approvals omdat er één ontwikkelaar/reviewer is. De actieve tag-ruleset beschermt `v*` tegen updates en verwijderingen.
3. **Releaseversie:** stabiele versie **1.0.0** is door de gebruiker goedgekeurd. De manifestvoorbereiding staat nog open: `coreVersion` instellen, alle checksums genereren, `releaseStatus` op `released` zetten en validators/CI controleren via een feature branch en PR.
4. **Publicatie:** pas na merge van de releasevoorbereidings-PR en een laatste controle de handmatige releaseworkflow uitvoeren. Geen tag of GitHub Release zonder expliciete toestemming.
5. **Pilotmigraties:** pas na de stabiele release; één feature branch en PR per app.

## Pilotmigratie-inventaris

- De drie pilotapps delen onderling dezelfde hashes voor 11 bestaande JavaScript-coremodules plus `css/base.css`.
- Vergeleken met PWA-Core `main` zijn 8 van die 11 modules plus CSS identiek.
- `shell.js`, `sync.js` en `vault.js` verschillen; `deletions.js` ontbreekt in alle drie.
- Iedere migratie moet de drie bijgewerkte modules en `deletions.js` als samenhangende wijziging opnemen, plus de releasepin, alle allowlisted bestanden en de gerichte service-worker-precache-update.
- MW4-CAMO, Energieverbruik en Games Backlog blijven afzonderlijke migraties. Cryptotracker en Vaste Lasten worden later afzonderlijk beoordeeld.

## Historische CI-mijlpalen

- PR #4: 9 kluiscontracttests; CI #43213355874 geslaagd.
- PR #5: 8 synchronisatiecontracttests; CI #43213584229 geslaagd.
- PR #6: 9 WebAuthn PRF-contracttests met mocks; CI #43213798190 en #43213816024 geslaagd.
- PR #7: precache-validator; CI #43215106266 geslaagd (78 tests).
- PR #8: releasemanifestpoort en handmatige releaseworkflow; CI #43215409264 geslaagd (84 tests).
- PR #10: platformacceptatiechecklist en tag-rulesetvoorstel; mergecommit #c637fc0152660eec692cd8ff9a562de5fbb66275.
- PR #11: sessie-/statusregistratie; gemerged.

## Sessielog
- **12 nov 2026:** PR #33 gemerged. Gebruiker bevestigt voortgang. Start releasevoorbereiding voor `1.0.0` op basis van `main` commit `273880ee53b9607f97353ed9b7ce3936553e51f0`; manifest en checksums worden in aparte PR aangeboden. Nog geen publicatie.
- **12 nov 2026:** releaseversie `1.0.0` door de gebruiker goedgekeurd. Voorbereiding documentatie-PR op basis van `main` `bbbfc4dc75ac3d30c750d6fe0622fc1ea3da81cf`; nog geen manifest-, tag- of releasewijzigingen uitgevoerd.
- **12 nov 2026:** PR #31 gemerged (acceptatiestatus na de geslaagde wachtwoordhertest); mergecommit `488528f29f0be68764c30d39d08f94b690befbbf`; post-merge CI `test` geslaagd (run #43246177031). Read-only releasecontrole: geen GitHub-rulesets, geen bestaande tags of GitHub Releases; `core-manifest.json` blijft `0.1.0-dev.1` / `unreleased` met lege checksum-map. Releaseworkflow en validators aanwezig. Branch-protectionstatus kon via de beschikbare GitHub-integratie niet worden uitgelezen.
- **12 nov 2026:** PR #30 gemerged (fixture-normalisatie naar `WrongPasswordError`); na deployment heeft de gebruiker de verkeerde-wachtwoordtest opnieuw uitgevoerd en als geslaagd bevestigd. Mergecommit `a11b94c11e61d5f36c88ed37c5da8a7dec38874c`.
- **12 nov 2026:** tweede acceptatieronde door gebruiker bevestigd: wachtwoordfallback zonder passkey, passkeyprompt annuleren en herstellen, onjuist wachtwoord weigeren gevolgd door succesvol correct wachtwoord, herladen/opnieuw ontgrendelen en sessieonderbreking/herstel geslaagd. Na PR #30 en deployment is ook de verkeerde-wachtwoordtest opnieuw uitgevoerd; gebruiker bevestigt de begrijpelijke melding “Onjuist wachtwoord.”
- **12 nov 2026:** PR #24 gemerged (geïsoleerde WebAuthn-platformacceptatiefixture en handmatige Pages-deploymentworkflow), squash-commit `3e9c9687392caecdc2d6b9011bb17dc49e7f1602`; PR-CI #43222484592 en post-merge CI #43222572070 geslaagd (108 tests). PR #23 gesloten als superseded.
- **12 nov 2026:** PR #22 gemerged (statusnotities), squash-commit `79b6e9af9ccb983cb43b0f5f276a8b4608f443ae`; PR-CI #43221167689 en post-merge CI #43221232127 geslaagd (103 tests).
- **12 nov 2026:** PR #21 gemerged (platformtestaantallen en actuele statusnotities), squash-commit `501010f32c3b1bb113c714ee3d4985a649a2186c`; PR-CI #43220950283 en post-merge CI #43221041401 geslaagd (103 tests).
- **12 nov 2026:** PR #20 gemerged (manifestchecksumgenerator kan gedeeltelijke checksum-map herstellen), squash-commit `ce10fdcc2bb751627388313e0920cc9a145c7c36`; PR-CI #43220748836 en post-merge CI #43220822973 geslaagd (103 tests).
- **12 nov 2026:** PR #19 gemerged (D12 release/pilotvolgorde), squash-commit `ddffacf81b8fef69f19275ff04cd2baed7dcd56f`; PR-CI #43220560437 en post-merge CI #43220647002 geslaagd (102 tests).

- **12 nov 2026:** PR #18 gemerged (correctie PRF-platformdocumentatie en statusnotities), squash-commit `4d07d6134c5a46dadd2a46cd4f793a796812b70e`; PR-CI #43220347472 en post-merge CI #43220403749 geslaagd (102 tests).
- **12 nov 2026:** PR #17 gemerged (statusnotities na PR #16), squash-commit `4620f94bfcddb0015772c5311ab7bc7bb3377624`; PR-CI #43219727470 en post-merge CI #43219793178 geslaagd (102 tests).
- **12 nov 2026:** PR #16 gemerged (samengevoegde actuele release-gereedheidsnotities), squash-commit `e4187b28f04ffa633b994d7849fba54ee06325cd`; PR-CI #43219524300 en post-merge CI #43219608343 geslaagd (102 tests).
- **12 nov 2026:** PR #15 gemerged (exacte 32-byte PRF-outputvalidatie), squash-commit `6bacce70135666e9b01b4ab1069c62bf1534f88c`; PR-CI #43219255509 en post-merge CI #43219324529 geslaagd (102 tests).
- **12 nov 2026:** PR #14 gemerged (dispatchcommit-integriteit, stabiele SemVer, action-SHA-pinning, checksumasset en main-rulesetvoorstel), squash-commit `bb925441b4746272a7489ee1b35b05562c9414bc`; PR-CI #43218952321 en post-merge CI #43219049927 geslaagd (100 tests).
- **12 nov 2026:** PR #13 gemerged (PRF-capabilitydetectie en wachtwoordfallback), squash-commit `f15ae53bac7c0530120489eda9d6ba3d4b369ee4`; PR-CI #43218463431 en post-merge CI #43218537815 geslaagd (99 tests).
- **12 nov 2026:** PR #12 gemerged (app-specifieke release-pin en offline validator), squash-commit `7310ad30922b2f9d0ba7b9c2ce90f331579dc36d`; PR-CI #43218070460 en post-merge CI #43218132736 geslaagd (94 tests).
- **12 nov 2026:** PR #10 gemerged (platformacceptatiechecklist, tag-rulesetvoorstel, correctie migratie-inventaris en werkafspraken), squash-commit `c637fc0152660eec692cd8ff9a562de5fbb66275`; Core checks-run #43216507632 geslaagd.
- **12 nov 2026:** actuele pilotbestanden vergeleken. Geen app- of repository-instellingen gewijzigd.
- **12 nov 2026:** PR #8 gemerged (guarded handmatige releaseworkflow en manifestpoort), squash-commit `73f63b3be0e6fc6ae9d7dd3db1428b9d0be537aa`; CI #43215409264 geslaagd (84 tests).
- **12 nov 2026:** PR #7 gemerged (precache-validator), squash-commit `b847f2976cd428fc976e96ae0a88670535eb9109`; CI #43215106266 geslaagd (78 tests).
- **12 nov 2026:** PR #6 gemerged (9 geïsoleerde WebAuthn PRF-contracttests), squash-commit `c32615b001895fe4f29109b030e64438f0f1a41d`; CI #43213798190 en #43213816024 geslaagd.
- **12 nov 2026:** pilotserviceworkers vergeleken; geen app-serviceworker aangepast.


- **12 nov 2026:** Node.js 20-deprecationwaarschuwing onderzocht; alle drie workflows bijgewerkt naar Node.js 24-compatible Actions met immutable SHA-pinning. `upload-pages-artifact` bijgewerkt naar v5 zodat de onderliggende `upload-artifact` eveneens Node.js 24 gebruikt. PR in voorbereiding.
