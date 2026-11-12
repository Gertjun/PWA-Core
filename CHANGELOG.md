# Changelog – PWA-Core

Wijzigingen aan de centrale kern en distributiecontracten. Nog geen stabiele release.

## Unreleased
- Initiële extractie van 12 gedeelde JavaScript-modules en basis-CSS uit PWA-Template 1.5.0.
- Manifestvalidatie aangescherpt: canonieke SemVer, broncommit, allowlist, volledige SHA-256-dekking, veilige paden en symlinkcontrole.
- Regressietests toegevoegd voor manifestvalidatie, crypto-/recordcontracten en de deletion ledger.
- 9 geïsoleerde kluiscontracttests toegevoegd; GitHub Actions-run #43213355874 geslaagd.
- 8 geïsoleerde synchronisatiecontracttests toegevoegd; GitHub Actions-run #43213584229 geslaagd.
- WebAuthn PRF-contracttests toegevoegd met nagebootste browserantwoorden; echte platformondersteuning moet nog praktisch worden gevalideerd.
- Geen officiële release-tag en geen wijzigingen aan pilotapps.
