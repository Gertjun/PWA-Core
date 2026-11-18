# Changelog – PWA-Core

Wijzigingen aan de centrale kern en distributiecontracten.

## 1.3.0 – in voorbereiding
- Consolideer handmatige koppelcodes en QR-apparaatkoppeling op één generiek Core-protocol (PWA-CORE-PAIR-2), bedoeld voor beperkte GitHub Sync-configuratie.
- Verhoog PIN naar 16 willekeurige tekens (circa 79,3 bits), gebruik rejection sampling en maak PBKDF2-SHA-256/AES-256-GCM, contextbinding, expiry en replayregistratie centraal.
- Ondersteun dezelfde versleutelde envelop voor QR en handmatige overdracht, met afzonderlijke transportlimieten; verwijder aanvullende geheimfactoren.
- Draag uitsluitend minimale GitHub Sync-configuratie over; applicatiedata en vaultwachtwoorden blijven buiten pairing. Weiger alle oudere pairing-protocollen; bestaande vaultdata en remote syncbestanden blijven onaangeroerd.
- Voeg regressietests toe voor PIN, strikt GitHub Sync-schema, QR-/teksttransportlimieten, contextbinding, expiratie, tampering, legacyweigering en replay.

## 1.2.2 – 17 november 2026
- Herstel synchronisatie van opnieuw aangemaakte records: een levende record vervangt een oudere verwijdering alleen als `updatedAt` aantoonbaar nieuwer is.
- Verwijder de achterhaalde tombstone uit dezelfde collectie en voeg regressietests toe voor verwijderen, opnieuw aanmaken en synchroniseren tussen twee apparaten.
- Records met gelijke, oudere of ontbrekende tijdstempels blijven fail-closed.

## 1.2.1 – 17 november 2026
- Begrens WebAuthn `user.id` tot maximaal 64 bytes met een compacte, app- en functienamespaced identificatie; behoud herkenning van bestaande legacy-passkeys.

## 1.2.0 – 17 november 2026
- Voeg `js/core/device-pairing.js` toe aan de gedeelde distributie met tijdelijke AES-256-GCM-versleutelde, app-contextgebonden overdracht; QR-weergave, scanner en app-specifieke kluis-/sync-integratie blijven bij de ontvangende app.
- Gebruik PBKDF2-SHA-256 met 600.000 iteraties, NFC-normalisatie van koppelgeheimen, een geldigheidsduur van drie minuten en lokale replaybescherming.
- Voeg tests toe voor encryptie/decryptie, Unicode-normalisatie, verkeerde of onvolledige geheimen, contextbinding, expiratie, manipulatie, payloadvalidatie en replaybescherming.

## 1.1.0 – 14 november 2026
- Voeg factory-based onafhankelijke vault-, sync-, Web Lock- en biometric-instanties toe, met behoud van de bestaande singleton-facades.
- Voeg isolatietests toe voor afzonderlijke sleutels, wachtwoorden, storage-prefixes, write queues, biometric-enrollmentrecords en session locks.

## 1.0.0 – 12 november 2026
- Eerste stabiele PWA-Core-release gepubliceerd vanaf commit `1a9c31f489290853fdc3aa4e62f199b21a338030`; Git-tag `v1.0.0` en GitHub Release aangemaakt.
- Distributiearchief `pwa-core-v1.0.0.zip` en `pwa-core-v1.0.0.zip.sha256` gepubliceerd; de release bevat `core-manifest.json` en de 13 bestanden uit de manifest-allowlist.
- Releaseworkflow #43267688827 volledig geslaagd, inclusief branch-/commitcontrole, versie- en manifestvalidatie, tests, ZIP-build en publicatie.
- Tag-ruleset `Protect published PWA-Core versions` actief voor `v*`; GitHub Release API rapporteert voor de bestaande release `immutable: false`. De release-assets en release zelf zijn niet aangepast; aanvullende release-immutability wordt afzonderlijk onderzocht.
- Registreer geslaagde echte WebAuthn-platformtests op iPhone en iPad (Safari/Face ID/iCloud-sleutelhanger) en Windows 11 (Chrome en Edge): 16/16 controles voor fixture, testkluis, passkeyregistratie en PRF-ontgrendeling. Leg ook de geslaagde tweede acceptatieronde vast: wachtwoordfallback zonder passkey, annuleren/herstellen na passkeyprompt, onjuist wachtwoord gevolgd door succesvolle ontgrendeling met het juiste wachtwoord, herladen en sessieonderbreking. De gemelde `OperationError – Onbekende fout` bleek een fout in de testfixture: de normale kluisroute vertaalt dit al naar `WrongPasswordError` / “Onjuist wachtwoord”. PR #30 heeft de fixture hiermee gelijkgetrokken en de gebruiker heeft na deployment de verkeerde-wachtwoordtest opnieuw als geslaagd bevestigd. Offlineacceptatie blijft open.
- Fix de WebAuthn-acceptatietestweergave op Safari door expliciete, contrastrijke lichte kleuren voor pagina, invoervelden en knoppen te gebruiken; voeg een CSS-contracttest toe.
- Normaliseer de onjuiste-wachtwoordmelding in de geïsoleerde acceptatiefixture naar hetzelfde `WrongPasswordError`-contract als de productiekluis; voorkom dat een ruwe Web Crypto `OperationError` aan de gebruiker wordt getoond.
- Upgrade all workflow Actions to Node.js 24-compatible releases, pinned to immutable commit SHAs; update the Pages artifact action to v5 so its nested upload-artifact dependency also uses Node 24.
- Add an isolated, manually deployed WebAuthn acceptance fixture using the current biometric/crypto modules; the fixture stores only a password-wrapped synthetic key and makes no runtime API requests.
- Fix manifest checksum generation so it can replace a partial or malformed checksum map in one pass; add regression coverage.
- Validate WebAuthn PRF outputs as exactly 32 bytes before deriving keys or storing passkey enrollment data.
- Hardened release workflow to build and tag the exact workflow-dispatch commit, pinned CI actions to immutable SHAs, made ZIP checksum assets portable, and restricted official releases to stable X.Y.Z SemVer.
- Improved WebAuthn PRF capability detection using `getClientCapabilities()` when available, with actual authenticator-result checks and clearer cancellation/unsupported-platform/password-fallback messages.
- Added an app-specific `pwa-core.lock.json` contract and offline validator for stable SemVer, immutable tag naming, full commit SHA, exact manifest SHA-256, release status, allowlist checksums and local core-file integrity.
- Documenteer de daadwerkelijk actieve main-branch- en tag-rulesets: verplichte PR en `test`-check op `main` (0 approvals wegens één ontwikkelaar/reviewer), plus bescherming van `v*` tegen updates en verwijderingen.
- Initiële extractie van 12 gedeelde JavaScript-modules en basis-CSS uit PWA-Template 1.5.0.
- Manifestvalidatie aangescherpt: canonieke SemVer, broncommit, allowlist, volledige SHA-256-dekking, veilige paden en symlinkcontrole.
- Regressietests toegevoegd voor manifestvalidatie, crypto-/recordcontracten en de deletion ledger.
- 9 geïsoleerde kluiscontracttests toegevoegd; GitHub Actions-run #43213355874 geslaagd.
- 8 geïsoleerde synchronisatiecontracttests toegevoegd; GitHub Actions-run #43213584229 geslaagd.
- 9 WebAuthn PRF-contracttests toegevoegd met nagebootste browserantwoorden; CI-runs #43213798190 en #43213816024 geslaagd.
- Service-worker-precache-validator toegevoegd met tests voor statische entries, ontbrekende bestanden, dubbele entries, dynamische expressies en remote paden; CI-run #43215106266 geslaagd.
- Handmatige releaseworkflow en releasemanifestpoort toegevoegd; voor het eerst gebruikt voor de publicatie van v1.0.0.
- Vóór de publicatie van v1.0.0 bestond nog geen officiële release-tag. De drie pilotapps zijn niet gewijzigd; migraties volgen afzonderlijk na de Core-release.
