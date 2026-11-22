# Roadmap – PWA-Core

> **Dit bestand (toekomst):** alles wat nog moet of kan gebeuren: releases, acceptatie, audit-nazorg en open vragen. Het is de enige takenlijst.
> **Niet hier:** wat al is uitgebracht → [`CHANGELOG.md`](CHANGELOG.md); waarom → [`DECISIONS.md`](DECISIONS.md); de stand van nu → [`README.md`](README.md) en per app [`docs/APP-ACCEPTANCE-MATRIX.md`](docs/APP-ACCEPTANCE-MATRIX.md).

Bijgewerkt: 22 november 2026 · laatste tag v1.3.0, `main` v1.3.1 unreleased

Elk punt houdt zijn nummer. Is een punt afgerond, dan haal je het hier weg (bij een release komt het in de changelog). Volgende vrije nummer: #9. Merge, release, tag en wijzigingen aan apps of repository-instellingen blijven afhankelijk van afzonderlijk expliciet akkoord (zie `CLAUDE.md`).

## Release
- #1 **v1.3.1 uitbrengen** — De post-tag fixes uit PR #58, #59 en #60 (zie "Unreleased" in de changelog) als release voorbereiden; daarna per app een afzonderlijke distributie-PR.
- #3 **Release-immutability** — De GitHub Release-assets en immutability van v1.3.0 onafhankelijk controleren, en de repository-instelling voor immutable releases onderzoeken en inschakelen voor toekomstige releases. Bestaande releases niet stilzwijgend aanpassen.

## Audit-nazorg
- #2 **F08: legacy-opruiming op apparaten bevestigen** — De codefix is uitgevoerd; nog bevestigen dat oude gegevens op de apparaten zijn opgeruimd.
- #6 **Cryptotracker: aanvullende read-only audit afronden** — Legacy plaintext-opruiming blijft een expliciete gebruikershandeling na geverifieerde migratie.

## Acceptatie
- #4 **Offlineacceptatie per app** — De acceptatiefixture test geen service worker of offline cache; dit wordt per app getest (D12). Openstaande praktijktests per app staan in `docs/APP-ACCEPTANCE-MATRIX.md`.
- #7 **Vaste Lasten: schil uit Core** — Vaste Lasten gebruikt nog een eigen kopbalk, navigatie en eigen lettertypes (van Google Fonts, een externe bron). Volgens D23 overstappen op `css/base.css` als laag en `createNav()`, in een eigen PR in Vaste Lasten.
- #8 **Contrast actief nav-item in lichte thema's** — Met een blauwe accentkleur haalt de tekst van het actieve nav-item op de lichte achtergrond geen 4,5:1 (gezien in Cryptotracker, opgelost met `--accent-text`). Nagaan of Energieverbruik, Games Backlog en MW4 in het lichte thema ook te weinig contrast hebben en zo nodig een veilige standaard in `css/base.css`.
- #5 **Platformgegevens vastleggen** — Bij platformtests de exacte OS- en browserversies, apparaatmodellen en Windows-authenticatorbuild registreren (zie `docs/PLATFORM-ACCEPTANCE.md`).
