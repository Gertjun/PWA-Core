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

- `js/core/`: gedeelde JavaScript-modules.
- `css/base.css`: gedeelde basisstijl en componentstijlen.
- `tests/`: generieke tests met synthetische data.
- `tools/manifest.mjs`: manifest- en SHA-256-validatie.
- `tools/precache.mjs`: controleert of elk allowlisted core-bestand lokaal bestaat en in de statische `PRECACHE`-array van een ontvangende app staat.
- `docs/`: architectuur, API-contracten en releaseproces.
- `core-manifest.json`: allowlist en checksums van distributiebestanden.

## Precache-validatie in een ontvangende app

Voer de validator uit vanuit de root van de app-repository nadat de core-bestanden en `core-manifest.json` lokaal zijn geplaatst:

```sh
node tools/precache.mjs --manifest core-manifest.json --service-worker sw.js
```

De validator controleert de allowlist tegen de lokale bestanden en een statische array die letterlijk `const PRECACHE = [...]` heet. Dynamische precache-opbouw wordt bewust geweigerd, zodat de controle geen onvolledige lijst kan goedkeuren. De tool wijzigt de service worker nooit; ontbrekende entries moeten in een afzonderlijke app-PR worden toegevoegd.

## Bronbasis en scope

De initiële bronbasis is PWA-Template 1.5.0. De eerste pilotgroep is MW4-CAMO, Energieverbruik en Games Backlog. Cryptotracker en Vaste Lasten worden later afzonderlijk beoordeeld.

Zie `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md` en `docs/RELEASING.md`.

**Let op:** er is nog geen release-tag. Gebruik deze repository nog niet om productie-apps bij te werken.
