# Changelog – PWA-Core

Wijzigingen aan de centrale kern en distributiecontracten. Nog geen stabiele release.

## Unreleased
- Initiële extractie van 12 gedeelde JavaScript-modules en basis-CSS uit PWA-Template 1.5.0.
- Manifestvalidatie aangescherpt: canonieke SemVer, broncommit, allowlist, volledige SHA-256-dekking, veilige paden en symlinkcontrole.
- Regressietests toegevoegd voor manifestvalidatie, crypto-/recordcontracten en de deletion ledger.
- 9 geïsoleerde kluiscontracttests toegevoegd; GitHub Actions-run #43213355874 geslaagd.
- Synchronisatiecontracttests toegevoegd voor upload, download, merge, schema-upgradeblokkade, conflict-retry en single-flight; validatie loopt via PR.
- Geen officiële release-tag en geen wijzigingen aan pilotapps.
