# Changelog – PWA-Core

Wijzigingen aan de centrale kern en distributiecontracten. Nog geen stabiele release.

## Unreleased
- Registreer geslaagde echte WebAuthn-platformtests op iPhone en iPad (Safari/Face ID/iCloud-sleutelhanger) en Windows 11 (Chrome en Edge). Fixture, testkluis, passkeyregistratie en PRF-ontgrendeling zijn op alle vier combinaties geslaagd (16/16 controles); Chrome en Edge gebruikten afzonderlijke testkluizen, wachtwoorden en passkeys. Afzonderlijke wachtwoordterugval-, annulering/herstel- en offline/lifecycle-tests blijven open.
- Fix de WebAuthn-acceptatietestweergave op Safari door expliciete, contrastrijke lichte kleuren voor pagina, invoervelden en knoppen te gebruiken; voeg een CSS-contracttest toe.
- Upgrade all workflow Actions to Node.js 24-compatible releases, pinned to immutable commit SHAs; update the Pages artifact action to v5 so its nested upload-artifact dependency also uses Node 24.
- Add an isolated, manually deployed WebAuthn acceptance fixture using the current biometric/crypto modules; the fixture stores only a password-wrapped synthetic key and makes no runtime API requests.
- Fix manifest checksum generation so it can replace a partial or malformed checksum map in one pass; add regression coverage.
- Validate WebAuthn PRF outputs as exactly 32 bytes before deriving keys or storing passkey enrollment data.
- Hardened release workflow to build and tag the exact workflow-dispatch commit, pinned CI actions to immutable SHAs, made ZIP checksum assets portable, and restricted official releases to stable X.Y.Z SemVer.
- Improved WebAuthn PRF capability detection using `getClientCapabilities()` when available, with actual authenticator-result checks and clearer cancellation/unsupported-platform/password-fallback messages.
- Added an app-specific `pwa-core.lock.json` contract and offline validator for stable SemVer, immutable tag naming, full commit SHA, exact manifest SHA-256, release status, allowlist checksums and local core-file integrity.
- Documented the real-browser WebAuthn PRF/passkey/password-fallback acceptance matrix and the recommended immutable release-tag ruleset; no release or repository settings changed.
- Initiële extractie van 12 gedeelde JavaScript-modules en basis-CSS uit PWA-Template 1.5.0.
- Manifestvalidatie aangescherpt: canonieke SemVer, broncommit, allowlist, volledige SHA-256-dekking, veilige paden en symlinkcontrole.
- Regressietests toegevoegd voor manifestvalidatie, crypto-/recordcontracten en de deletion ledger.
- 9 geïsoleerde kluiscontracttests toegevoegd; GitHub Actions-run #43213355874 geslaagd.
- 8 geïsoleerde synchronisatiecontracttests toegevoegd; GitHub Actions-run #43213584229 geslaagd.
- 9 WebAuthn PRF-contracttests toegevoegd met nagebootste browserantwoorden; CI-runs #43213798190 en #43213816024 geslaagd.
- Service-worker-precache-validator toegevoegd met tests voor statische entries, ontbrekende bestanden, dubbele entries, dynamische expressies en remote paden; CI-run #43215106266 geslaagd.
- Handmatige releaseworkflow en releasemanifestpoort toegevoegd; nog niet vrijgegeven of in productie gebruikt.
- Geen officiële release-tag en geen wijzigingen aan pilotapps.
