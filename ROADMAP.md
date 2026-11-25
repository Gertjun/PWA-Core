# Roadmap – PWA-Core

> **Dit bestand (toekomst):** alles wat nog moet of kan gebeuren: releases, acceptatie, audit-nazorg en open vragen. Het is de enige takenlijst.
> **Niet hier:** wat al is uitgebracht → [`CHANGELOG.md`](CHANGELOG.md); waarom → [`DECISIONS.md`](DECISIONS.md); de stand van nu → [`README.md`](README.md) en per app [`docs/APP-ACCEPTANCE-MATRIX.md`](docs/APP-ACCEPTANCE-MATRIX.md).

Bijgewerkt: 25 november 2026 · laatste tag v1.3.0, `main` v1.4.0 geïntegreerd; publicatie nog open

Elk punt houdt zijn nummer. Is een punt afgerond, dan haal je het hier weg (bij een release komt het in de changelog). Volgende vrije nummer: #13. Merge, release, tag en wijzigingen aan apps of repository-instellingen blijven afhankelijk van afzonderlijk expliciet akkoord (zie `CLAUDE.md`).

## Release
- #1 **v1.4.0 uitbrengen** — Na geslaagde merge van de koppel-PR (D24/D25) de post-tag fixes uit PR #58, #59 en #60 samen met de nieuwe koppelflow als v1.4.0 uitbrengen, in plaats van een losse v1.3.1. Daarna per app een afzonderlijke distributie-PR (#9–#11).
- #3 **Release-immutability** — De GitHub Release-assets en immutability van v1.3.0 onafhankelijk controleren, en de repository-instelling voor immutable releases onderzoeken en inschakelen voor toekomstige releases. Bestaande releases niet stilzwijgend aanpassen.

## Eén koppelflow in alle apps (D24/D25)
- #9 **MW4-CAMO, Energieverbruik, Games Backlog naar v1.4.0** — Per app een distributie-PR: allowlist kopiëren (incl. `pairing-ui.js` en `qrcode.js`), precache bijwerken, `defaultOwner`/`defaultRepo` in `config.js`. In MW4 `js/device-pairing-ui.js`, `js/device-pairing.js`, `js/vendor/qrcode.js` en de aanroep in `js/main.js` verwijderen. Hint-teksten op het startscherm gelijktrekken.
- #10 **Cryptotracker: koppelen via `pairing-ui.js`** — Koppelcode/QR-link ook op het eigen startscherm (`js/core/runtime.js`) accepteren, `openPairOutDialog()` gebruiken in plaats van de eigen dialoog in `app.js`, en het oude passkey-blok verwijderen. Context blijft `cpt`.
- #11 **Vaste Lasten: koppelen via `pairing-ui.js`** — De eigen QR-module (`js/device-pairing.js`, vendor-QR) vervangen door `pairing-ui.js`, met behoud van de eigen padvalidatie en meerdere kluizen; het huidige v3-contract draagt één sleutel over, dus per geautoriseerd domein sleuteloverdracht en gedeeltelijke foutafhandeling uitwerken; samen met #7.
- #12 **Acceptatie koppelen** — Eerst synthetische integrale browsertest met fictieve data en nagebootste GitHub API: v3 QR/tekst zonder PIN/wachtwoord, fragment opschonen, juiste kluis, foutieve sleutel, verlopen code, bestaande/beschadigde lokale kluis, offline/netwerk- en opslagfouten, lokale replay, legacy v2 en handmatige import. Daarna per app op iPhone en laptop: camera, Safari versus geïnstalleerde PWA, passkey bestaand/nieuw, wachtwoord-terugval, herinstallatie, offline en bestaande kluis. Geen echte tokens in tests of logs. 

## Audit-nazorg
- #2 **F08: legacy-opruiming op apparaten bevestigen** — De codefix is uitgevoerd; nog bevestigen dat oude gegevens op de apparaten zijn opgeruimd.
- #6 **Cryptotracker: aanvullende read-only audit afronden** — Legacy plaintext-opruiming blijft een expliciete gebruikershandeling na geverifieerde migratie.

## Acceptatie
- #4 **Offlineacceptatie per app** — De acceptatiefixture test geen service worker of offline cache; dit wordt per app getest (D12). Openstaande praktijktests per app staan in `docs/APP-ACCEPTANCE-MATRIX.md`.
- #7 **Vaste Lasten: schil uit Core** — Vaste Lasten gebruikt nog een eigen kopbalk, navigatie en eigen lettertypes (van Google Fonts, een externe bron). Volgens D23 overstappen op `css/base.css` als laag en `createNav()`, in een eigen PR in Vaste Lasten.
- #8 **Contrast actief nav-item in lichte thema's** — Met een blauwe accentkleur haalt de tekst van het actieve nav-item op de lichte achtergrond geen 4,5:1 (gezien in Cryptotracker, opgelost met `--accent-text`). Nagaan of Energieverbruik, Games Backlog en MW4 in het lichte thema ook te weinig contrast hebben en zo nodig een veilige standaard in `css/base.css`.
- #5 **Platformgegevens vastleggen** — Bij platformtests de exacte OS- en browserversies, apparaatmodellen en Windows-authenticatorbuild registreren (zie `docs/PLATFORM-ACCEPTANCE.md`).
