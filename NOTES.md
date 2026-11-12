# NOTES – PWA-Core

Laatst bijgewerkt: 12 november 2026

## Actuele stand
- Initiële extractie uit PWA-Template 1.5.0 staat op `main`.
- 12 JavaScript-modules en `css/base.css` vormen de huidige distributie-allowlist.
- Er is nog geen officiële release of release-tag.
- Geen pilotapp is aangepast.
- PR #1 hardent manifestvalidatie en voegt regressietests toe; merge is niet uitgevoerd.

## Open punten
1. PR #1 inhoudelijk beoordelen en laten landen na expliciet akkoord.
2. Contracttestmatrix uit `docs/CONTRACTS.md` omzetten naar uitvoerbare tests.
3. Service-worker-precache-controle bouwen.
4. Releaseworkflow bouwen met immutable SemVer-tag, manifest, checksums en artifactcontrole.
5. Distributieworkflow per pilotapp voorbereiden; uitsluitend via aparte PR's.
6. Integratie-, offline- en praktijktests uitvoeren in MW4-CAMO, Energieverbruik en Games Backlog.
7. Cryptotracker en Vaste Lasten later afzonderlijk analyseren.

## Sessielog
- **12 nov 2026:** PR #1 aangemaakt voor strengere manifestvalidatie. CI-run #43211712067 geslaagd. Review wees aanvullende randgevallen aan; PR-branch uitgebreid met canonieke SemVer-controle, weigering van symlinks en regressietests voor gedeeltelijke/onverwachte checksums. CI op de laatste commit moet nog worden gecontroleerd.
- **12 nov 2026:** eerste statuscontrole: geen open PR's op de toenmalige basis; initiële core-extractie en documentatie aanwezig. Geen release en geen app-migraties.
