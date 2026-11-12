# PWA-Core

Centrale bron voor de gedeelde, modulaire kern van Geerts Progressive Web Apps.

> **Status: initiële extractie / nog geen stabiele release.** Bestanden worden eerst uit PWA-Template 1.5.0 overgenomen, gecontroleerd en getest. Apps mogen deze repository niet tijdens runtime laden.

## Principes

- Apps bevatten de gekozen kernbestanden lokaal op hun eigen origin.
- Elke app pint een expliciete PWA-Core-versie en commit-SHA.
- Updates worden per app aangeboden via een aparte branch en pull request.
- Geen automatische merge en geen directe wijziging van app-main.
- App-specifieke code, configuratie, gegevens en tokens blijven in de app-repository.
- Een release krijgt een manifest met SHA-256-checksums.

## Structuur

- js/core/: gedeelde JavaScript-modules.
- css/base.css: gedeelde basisstijl en componentstijlen.
- tests/: generieke tests met synthetische data.
- docs/: architectuur, API-contracten en releaseproces.
- core-manifest.json: allowlist en checksums van distributiebestanden.

## Bronbasis en scope

De initiële bronbasis is PWA-Template 1.5.0. De eerste pilotgroep is MW4-CAMO, Energieverbruik en Games Backlog. Cryptotracker en Vaste Lasten worden later afzonderlijk beoordeeld.

Zie docs/ARCHITECTURE.md, docs/CONTRACTS.md en docs/RELEASING.md.

**Let op:** er is nog geen release-tag. Gebruik deze repository nog niet om productie-apps bij te werken.
