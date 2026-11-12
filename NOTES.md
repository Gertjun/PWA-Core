# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele status – bijgewerkt na PR #27 en platformacceptatie

- PR #27 (Safari-contrast voor de acceptatiefixture) is gemerged; mergecommit: `3d22f1ba173ca73b8839a452e1b61946fe2051cf`. `main` is op deze commit gecontroleerd.
- De handmatige WebAuthn-acceptatiefixture is gepubliceerd en succesvol geladen op iPhone en iPad.
- Echte platformacceptatie: iPhone en iPad met Safari/Face ID/iCloud-sleutelhanger én Windows 11 met Chrome en Edge. Fixture laden, testkluis aanmaken, passkeyregistratie en PRF-ontgrendeling zijn op alle vier combinaties geslaagd (16/16 controles).
- Chrome en Edge zijn afzonderlijk getest met eigen testkluizen, wachtwoorden en passkeys; PRF-ontgrendeling is in beide browsers daadwerkelijk geslaagd.
- Nog open: afzonderlijke wachtwoordterugval-, annulering/herstel- en offline/lifecycle-scenario's. De volledige platformacceptatie en releasepoort zijn dus nog niet afgerond.
- Exacte OS-/browserversies, apparaatmodellen en Windows-authenticatorbuild zijn nog niet geregistreerd; zie `docs/PLATFORM-ACCEPTANCE.md`.

## Actuele stand

- Fase 3: PR #1 t/m #22, #24 en #25 zijn gemerged naar `main`; PR #23 is als verouderde tussenversie gesloten. De Node.js 24-actionupgrade staat als PR klaar.
- Laatste `main`-commit: `3e9c9687392caecdc2d6b9011bb17dc49e7f1602` (PR #24).
- Laatste post-merge CI-run #43222572070: **success**, 108 tests geslaagd, 0 mislukt.
- De distributie-allowlist bevat 12 JavaScript-modules en `css/base.css`.
- `core-manifest.json` staat nog op `0.1.0-dev.1`, `releaseStatus: unreleased` en lege checksums. Dit is correct voor de nog niet vrijgegeven ontwikkelfase.
- Er bestaan geen Git-tags en geen GitHub Releases. Er is geen officiële PWA-Core-release.
- Er zijn geen repository-rulesets; `main` is niet beschermd. Geen repository-instellingen gewijzigd.
- Geen pilotapp is aangepast: MW4-CAMO, Energieverbruik en Games Backlog zijn nog niet gemigreerd.
- Geen productiegegevens, kluisbestanden of tokens benaderd.

## Fase 3 – afgeronde technische werkzaamheden

### PR #22 – statusnotities

- PR #22 mergecommit: `79b6e9af9ccb983cb43b0f5f276a8b4608f443ae`; PR-CI #43221167689 en post-merge CI #43221232127 geslaagd (103 tests).

### WebAuthn-acceptatiefixture (PR #24)

- Test-only browserpagina, handmatige main-only deploymentworkflow via GitHub Pages Actions en statische beveiligingschecks zijn gemerged.
- PR #24 mergecommit: `3e9c9687392caecdc2d6b9011bb17dc49e7f1602`; PR-CI #43222484592 en post-merge CI #43222572070 geslaagd (108 tests).
- Fixture is nog niet gedeployed. Eerste publicatie vereist dat de gebruiker GitHub Pages als bron **GitHub Actions** inschakelt; er zijn geen repository-instellingen gewijzigd.

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
- De tag-ruleset en main-branch-ruleset zijn alleen voorbereid in `docs/RELEASING.md`; er zijn geen instellingen gewijzigd.

## Releasegates – nog niet vrijgegeven

1. **Echte platformacceptatie:** voer de testmatrix uit op iPhone en iPad met Safari, iCloud-sleutelhanger en Face ID; en op Windows 11 met Chrome/Edge en Windows Hello. Registreer resultaten zonder PRF-uitvoer, credential-ID's, wachtwoorden of kluisdata te bewaren.
2. **Tagbeveiliging:** activeer vóór de eerste release de ruleset voor `v*` met restricties op updates en verwijderingen; tagcreatie blijft toegestaan voor de gecontroleerde releaseworkflow.
3. **Main-beveiliging:** activeer de voorgestelde branch ruleset met verplichte PR, vereiste check `test`, bescherming tegen force-push/verwijderen en onafhankelijke review. Eén vereiste approval betekent dat een tweede reviewer beschikbaar moet zijn; zie `docs/RELEASING.md`.
4. **Releasekandidaat:** kies een stabiele `X.Y.Z`, vul alle manifestchecksums, zet status op `released`, voer alle manifest-, pin-, precache-, test- en workflowcontroles uit en merge de voorbereidings-PR.
5. **Publicatie:** voer pas daarna de handmatige releaseworkflow uit. Maak geen release of tag voordat alle voorgaande gates zijn gehaald.
6. **Pilotmigraties:** pas na de stabiele, onveranderlijke release; één feature branch en PR per app.

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
