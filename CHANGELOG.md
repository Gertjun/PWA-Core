# Changelog – PWA-Core

Wijzigingen aan de centrale kern en distributiecontracten. Nog geen stabiele release.

## Unreleased
- Initiële extractie van 12 gedeelde JavaScript-modules en basis-CSS uit PWA-Template 1.5.0.
- Manifestvalidatie aangescherpt: canonieke SemVer, broncommit, allowlist, volledige SHA-256-dekking, veilige paden en symlinkcontrole.
- Regressietests toegevoegd voor manifestvalidatie, crypto-/recordcontracten en de deletion ledger.
- 9 geïsoleerde kluiscontracttests toegevoegd; GitHub Actions-run #43213355874 geslaagd.
- 8 geïsoleerde synchronisatiecontracttests toegevoegd; GitHub Actions-run #43213584229 geslaagd.
- 9 WebAuthn PRF-contracttests toegevoegd met nagebootste browserantwoorden; CI-runs #43213798190 en #43213816024 geslaagd.
- Service-worker-precache-validator toegevoegd met tests voor statische entries, ontbrekende bestanden, dubbele entries, dynamische expressies en remote paden.
- Geen officiële release-tag en geen wijzigingen aan pilotapps.
