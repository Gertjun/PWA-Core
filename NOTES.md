# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele stand
- Initiële extractie uit PWA-Template 1.5.0 staat op `main`.
- 12 JavaScript-modules en `css/base.css` vormen de huidige distributie-allowlist.
- PR #1 t/m #5 zijn via squash merge verwerkt in `main`: manifestvalidatie/documentatie, crypto/records, deletion ledger, kluiscontracttests en synchronisatiecontracttests.
- PR #4 voegt 9 geïsoleerde kluiscontracttests toe; GitHub Actions-run #43213355874 is geslaagd.
- PR #5 voegt 8 synchronisatiecontracttests toe; GitHub Actions-run #43213584229 is geslaagd.
- De huidige branch `feature/biometric-contract-tests` voegt tests toe voor de WebAuthn PRF-module met nagebootste browserantwoorden.
- Biometrie-fixtures gebruiken een tijdelijke app-configuratie, in-memory localStorage en uitsluitend synthetische sleutels/antwoorden.
- Node-mocks bewijzen niet de werking van Face ID, Touch ID, Windows Hello of echte platformauthenticators.
- Er is nog geen officiële release of release-tag.
- Geen pilotapp is aangepast.

## Open punten
1. Biometrie-contracttests laten slagen in CI en reviewen; nog niet mergen.
2. Echte browser-/apparaatpraktijktests voor passkey-PRF en wachtwoordterugval uitvoeren.
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
- **12 nov 2026:** PR #5 gemerged (8 geïsoleerde synchronisatiecontracttests), squash-commit `4cd8476a98961796b51f183a056c46c9439da818`; CI-run #43213584229 geslaagd.
- **12 nov 2026:** branch `feature/biometric-contract-tests` aangemaakt; `tests/biometric-contract.test.js` toegevoegd. De tests simuleren WebAuthn create/get, PRF-resultaten, verkeerde app-identiteit, ontbrekende PRF en wachtwoordterugval. CI-validatie volgt via PR.
