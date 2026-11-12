# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele stand
- Initiële extractie uit PWA-Template 1.5.0 staat op `main`.
- 12 JavaScript-modules en `css/base.css` vormen de huidige distributie-allowlist.
- PR #1 (manifestvalidatie/documentatie), PR #2 (crypto/records) en PR #3 (deletion ledger) zijn op 12 november 2026 via squash merge verwerkt in `main`.
- De volgende testfase staat op branch `feature/vault-contract-tests` en voegt geïsoleerde kluiscontracttests toe.
- De tests gebruiken een tijdelijke app-configuratie, een in-memory localStorage en uitsluitend synthetische gegevens.
- Er is nog geen officiële release of release-tag.
- Geen pilotapp is aangepast.

## Open punten
1. Kluiscontracttests laten slagen in CI en reviewen; nog niet mergen.
2. Contracttestmatrix uit `docs/CONTRACTS.md` verder omzetten naar uitvoerbare tests.
3. Synchronisatiecontracttests bouwen met een nep-GitHub-client.
4. Passkey-/WebAuthn-platformtests voorbereiden; Node-unit-tests zijn hiervoor niet voldoende.
5. Service-worker-precache-controle bouwen.
6. Releaseworkflow bouwen met immutable SemVer-tag, manifest, checksums en artifactcontrole.
7. Distributieworkflow per pilotapp voorbereiden; uitsluitend via aparte PR's.
8. Integratie-, offline- en praktijktests uitvoeren in MW4-CAMO, Energieverbruik en Games Backlog.
9. Cryptotracker en Vaste Lasten later afzonderlijk analyseren.

## Sessielog
- **12 nov 2026:** PR #1 gemerged (manifestvalidatie, checksum-/padbeveiliging en documentatie), squash-commit `ba6e8bac7e5c8df20c9afa95c846b56f98f8dab1`.
- **12 nov 2026:** PR #2 gemerged (crypto- en recordcontracttests), squash-commit `b025b2abedb23dd556642b4146babd669473eefb`.
- **12 nov 2026:** PR #3 gemerged (deletion-ledgercontracttests), squash-commit `e782e927b5f89b37e1fb4a604bd02d2aae237d66`.
- **12 nov 2026:** branch `feature/vault-contract-tests` aangemaakt vanaf de bijgewerkte `main`; `tests/vault-contract.test.js` toegevoegd. CI-validatie is nog in behandeling via de bijbehorende PR.
