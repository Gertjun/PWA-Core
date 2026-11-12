# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele stand
- Initiële extractie uit PWA-Template 1.5.0 staat op `main`.
- 12 JavaScript-modules en `css/base.css` vormen de huidige distributie-allowlist.
- PR #1 (manifestvalidatie/documentatie), PR #2 (crypto/records), PR #3 (deletion ledger) en PR #4 (kluiscontracttests) zijn via squash merge verwerkt in `main`.
- PR #4 voegt 9 geïsoleerde kluiscontracttests toe; GitHub Actions-run #43213355874 is volledig geslaagd.
- De huidige branch `feature/sync-contract-tests` voegt tests toe voor synchronisatie en de GitHub Contents API-client.
- Alle fixtures gebruiken een tijdelijke app-configuratie, in-memory localStorage, een nep-fetch en uitsluitend synthetische gegevens.
- Er is nog geen officiële release of release-tag.
- Geen pilotapp is aangepast.

## Open punten
1. Synchronisatiecontracttests laten slagen in CI en reviewen; nog niet mergen.
2. Passkey-/WebAuthn-platformtests voorbereiden; Node-unit-tests zijn hiervoor niet voldoende.
3. Service-worker-precache-controle bouwen.
4. Releaseworkflow bouwen met immutable SemVer-tag, manifest, checksums en artifactcontrole.
5. Distributieworkflow per pilotapp voorbereiden; uitsluitend via aparte PR's.
6. Integratie-, offline- en praktijktests uitvoeren in MW4-CAMO, Energieverbruik en Games Backlog.
7. Cryptotracker en Vaste Lasten later afzonderlijk analyseren.

## Sessielog
- **12 nov 2026:** PR #1 gemerged (manifestvalidatie, checksum-/padbeveiliging en documentatie), squash-commit `ba6e8bac7e5c8df20c9afa95c846b56f98f8dab1`.
- **12 nov 2026:** PR #2 gemerged (crypto- en recordcontracttests), squash-commit `b025b2abedb23dd556642b4146babd669473eefb`.
- **12 nov 2026:** PR #3 gemerged (deletion-ledgercontracttests), squash-commit `e782e927b5f89b37e1fb4a604bd02d2aae237d66`.
- **12 nov 2026:** PR #4 gemerged (9 geïsoleerde kluiscontracttests), squash-commit `3fef430202bf4ffd180a7e9b2de6d6d2a690fc04`; CI-run #43213355874 geslaagd.
- **12 nov 2026:** branch `feature/sync-contract-tests` aangemaakt; `tests/sync-contract.test.js` toegevoegd voor eerste upload, lokale/remote wijzigingen, merge, schema-upgradeblokkade, conflict-retry en single-flight gedrag. CI-validatie volgt via PR.
