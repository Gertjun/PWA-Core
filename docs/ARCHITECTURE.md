# PWA-Core – architectuur en distributiemodel

## Status

PWA-Core v1.0.0 is de eerste stabiele release en is gepubliceerd via Git-tag `v1.0.0` en GitHub Release. De release-tag verwijst naar commit `1a9c31f489290853fdc3aa4e62f199b21a338030`. De releaseworkflow (#43267688827) is geslaagd en de ZIP- en SHA-256-assets zijn gepubliceerd.

De architectuur hieronder beschrijft het vastgestelde model. De releasepublicatie zelf migreert geen ontvangende apps; iedere app doorloopt afzonderlijk de pilotacceptatie.

## Doel en uitgangspunten

Generieke functionaliteit wordt op één centrale plaats onderhouden. Iedere app gebruikt een bewust gekozen, vastgepinde versie. Een app mag niet afhankelijk zijn van een externe server om zijn kerncode te laden.

- Centrale bron: [Gertjun/PWA-Core](https://github.com/Gertjun/PWA-Core).
- Distributie: alleen manifest-allowlisted bestanden uit een stabiele release.
- Runtime: core-bestanden staan lokaal in de ontvangende app-repository en worden vanaf de eigen origin geladen.
- Updates: per app een featurebranch en PR; nooit automatisch mergen.
- App-specifiek: configuratie, datamodel, schermen, berekeningen, iconen, gegevens en service worker blijven eigendom van de app.

## Wat hoort in PWA-Core?

**Wel:**
- `js/core/`: vault, crypto, biometric/passkey, GitHub-client, sync, deletions, records, DOM, navigatie, UI en shell;
- `css/base.css`;
- generieke tests en synthetische fixtures;
- documentatie van publieke API-contracten, distributie en acceptatie.

**Niet:**
- `js/config.js`, `js/app.js`, `css/app.css`, `index.html`, manifest of app-iconen;
- app-specifieke schermen, datamodellen, labels, kleuren en berekeningen;
- de volledige `sw.js`: service worker, versie en precache blijven per app;
- tokens, kluisbestanden, productiegegevens of persoonlijke data.

## Distributie- en runtime-model

De release-allowlist bevat 13 bestanden: 12 JavaScript-modules onder `js/core/` en `css/base.css`. De ontvangende app neemt die bestanden lokaal op dezelfde paden op. Relatieve imports blijven daardoor werken zonder build-stap, package manager of runtime-download.

Een ontvangende app legt de exacte release vast met:
- `core-manifest.json`: allowlist en SHA-256-checksums;
- `pwa-core.lock.json`: repository, versie, tag, volledige commit-SHA en SHA-256 van de exacte manifestbytes.

De app controleert de releasepin en lokale bestanden met `node tools/pin.mjs verify`. Daarna controleert `node tools/precache.mjs --manifest core-manifest.json --service-worker sw.js` of elk allowlisted bestand lokaal aanwezig is en in de statische precache staat.

De validators wijzigen geen bestanden. De service worker blijft app-eigendom; ontbrekende entries worden gericht via de app-PR toegevoegd.

## Waarom geen runtime-import, submodule of package?

- Remote ES-module-import zou runtime-netwerkafhankelijkheid en extra offline-/beschikbaarheidsrisico introduceren.
- Git submodules voegen beheer- en deploycomplexiteit toe voor statische GitHub Pages-apps.
- Een npm-package of bundler past niet bij de afgesproken eenvoudige runtime zonder build-stap.
- Releasebestanden lokaal kopiëren houdt de runtime zelfstandig en maakt iedere update zichtbaar als controleerbare PR.

## Release- en updateproces

1. PWA-Core valideert tests, manifest en checksums.
2. Een stabiele SemVer-release wordt via de gecontroleerde releaseworkflow gepubliceerd.
3. Een ontvangende app kiest expliciet een release.
4. De app-update wordt op een eigen branch voorbereid; alleen allowlisted core-bestanden en bijbehorende pinmetadata worden bijgewerkt.
5. CI controleert syntax, tests, manifest/pin en precache.
6. De PR wordt beoordeeld; relevante browser-, offline- en multi-device-tests blijven aparte acceptatiepunten.
7. Alleen na expliciet akkoord wordt gemerged.

Er is geen automatische merge. Een mislukte of incompatibele update blijft buiten `main` en kan worden afgewezen door de PR niet te mergen.

## Scope van de migraties

De eerste pilotgroep is MW4-CAMO, Energieverbruik en Games Backlog. Ze gebruiken de modulaire architectuur en worden elk afzonderlijk gemigreerd en geaccepteerd.

Cryptotracker en Vaste Lasten blijven in scope, maar hebben een afwijkende, meer monolithische architectuur en eigen gegevens-/synccontracten. Ze krijgen eerst een afzonderlijke adapter-/refactoranalyse; er wordt geen gedeelde core geforceerd.

## Beveiligingsgrenzen

- Core-tests gebruiken uitsluitend synthetische data en nepclients.
- Geen productie-datarepository, kluisinhoud of persoonlijk token wordt benaderd.
- Gepubliceerde tags worden beschermd tegen wijzigen/verwijderen.
- Git-tagbescherming vervangt GitHub Release-immutability niet. Voor v1.0.0 is `immutable: false` gerapporteerd; zie `docs/RELEASING.md`.
- Een releasepublicatie verandert nooit zelfstandig een ontvangende app.
