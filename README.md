# PWA-Core

Centrale bron en distributiepunt voor de gedeelde, modulaire kern van de PWA's.

**Status: v1.3.0 is de huidige Core-tag; `main` bevat post-tag wijzigingen die als v1.3.1 (unreleased) worden bijgehouden.** De eerste stabiele basis was v1.0.0.

PWA-Core beheert generieke JavaScript-modules en de gedeelde basis-CSS. Ontvangende apps bewaren de gekozen core-bestanden lokaal in hun eigen repository en laden ze vanaf hun eigen GitHub Pages-origin. De browser haalt tijdens runtime nooit code op uit deze repository of een CDN.

## Huidige Core-tag en main-status

- Tag: `v1.3.0`
- Tag/source commit: `fd47638355d975d85dfc376b07810b4b0e4b2a63`
- Manifest-SHA256 die door de vijf app-lockfiles wordt gepind: `141e78258aaa54dce8778f7b0c2344ca2375a41568bbbfd4a6138551432abac3`
- De tag en de v1.3.0-manifest zijn gecontroleerd. GitHub Release-assets en release-immutability konden in deze audit niet onafhankelijk worden bevestigd.
- `main` bevat post-tag fixes (KDF-envelopegrenzen, pairing-secret UI en factory-KDF-configuratie). Deze worden bijgehouden als **v1.3.1 unreleased**; ze zijn niet onderdeel van de v1.3.0-tag.

Alle vijf ontvangende apps pinnen momenteel v1.3.0. Appmigraties en acceptatie blijven afzonderlijke trajecten; zie `docs/APP-ACCEPTANCE-MATRIX.md`.

## Principes

- Apps bevatten core-bestanden lokaal op hun eigen origin.
- Een app-update gebruikt een expliciete release-identificatie: versie, tag, volledige commit-SHA en SHA-256 van de exacte manifestbytes.
- Updates verlopen per ontvangende app via een featurebranch en pull request.
- Geen automatische merge en geen directe wijziging van app-`main`.
- App-specifieke code, configuratie, gegevens, iconen en tokens blijven in de app-repository of op hun bestaande veilige locatie.
- Gepubliceerde core-releases en tags worden niet overschreven.

## Inhoud en structuur

- `js/core/`: gedeelde JavaScript-modules.
- `css/base.css`: gedeelde basisstijl en componentstijlen.
- `tests/`: generieke tests met synthetische data.
- `tests/acceptance/`: geïsoleerde browserfixture voor handmatige WebAuthn PRF-platformacceptatie.
- `tools/manifest.mjs`: manifest- en SHA-256-validatie.
- `tools/precache.mjs`: controleert of allowlisted bestanden lokaal bestaan en in de statische service-worker-`PRECACHE` staan.
- `tools/release.mjs`: controleert releasevoorwaarden.
- `tools/pin.mjs`: valideert een app-specifieke release-pin tegen manifest en lokale core-bestanden.
- `docs/`: architectuur, API-contracten, acceptatie en releaseproces.
- `core-manifest.json`: allowlist en checksums van distributiebestanden.

De huidige v1.2.2-allowlist bevat uitsluitend de gedeelde modules onder `js/core/` en `css/base.css`. App-specifieke bestanden zoals `js/config.js`, `js/app.js`, `css/app.css`, `index.html`, iconen en de volledige `sw.js` vallen erbuiten.

## Gebruik door een ontvangende app

Een app importeert de kern vanaf lokale relatieve paden. De distributie wijzigt dus geen runtime-imports naar GitHub of een CDN.

Bij een formele migratie/update moet de ontvangende app:

1. De gewenste stabiele release kiezen en de tag naar de volledige commit-SHA verifiëren.
2. Alleen de bestanden uit de manifest-allowlist opnemen.
3. `core-manifest.json` en `pwa-core.lock.json` vastleggen.
4. De pin en lokale bestanden controleren met `node tools/pin.mjs verify`.
5. Controleren dat alle allowlisted bestanden in de statische `PRECACHE` van de eigen service worker staan:
   `node tools/precache.mjs --manifest core-manifest.json --service-worker sw.js`.
6. De eigen tests en relevante online-, offline-, browser- en app-contractcontroles uitvoeren.
7. De wijzigingen via een eigen featurebranch en PR aanbieden.

De validator wijzigt geen service worker. Een ontbrekende precache-entry moet expliciet in de ontvangende app-PR worden aangepast. De volledige service worker blijft app-eigendom.

## Releaseproces

Een release wordt voorbereid via een featurebranch en PR. De workflow publiceert pas na merge naar `main`, na manifest-, checksum- en testvalidatie en na een handmatige workflowstart. Een bestaande versie-tag wordt nooit overschreven.

Zie [docs/RELEASING.md](docs/RELEASING.md) voor de volledige procedure en het app-pincontract.

## Beveiligingsgrenzen

- De actieve ruleset beschermt `main`; een pull request en de vereiste CI-statuscheck zijn verplicht.
- De actieve tag-ruleset beschermt gepubliceerde `v*`-tags tegen wijzigen en verwijderen.
- Git-tagbescherming en GitHub Release-immutability zijn afzonderlijke beveiligingslagen.
- De GitHub Release API rapporteerde voor v1.0.0 `immutable: false`. De release, tag en assets zijn niet aangepast. Zie `docs/RELEASING.md`.
- Tests gebruiken synthetische data. Productie-kluizen, data-repositories en persoonlijke tokens zijn buiten scope.

## App-integraties

De vijf apps zijn gemigreerd naar PWA-Core. Vier apps gebruiken v1.2.2; MW4-CAMO gebruikt nog v1.2.1 en wordt bijgewerkt via een afzonderlijke PR. Zie [de portfolio-acceptatiematrix](docs/APP-ACCEPTANCE-MATRIX.md) voor versies, bewijs en openstaande praktijktests.

## Documentatie

- [Architectuur](docs/ARCHITECTURE.md)
- [API- en gegevenscontracten](docs/CONTRACTS.md)
- [Release- en distributieproces](docs/RELEASING.md)
- [Platformacceptatie](docs/PLATFORM-ACCEPTANCE.md)


## Apparaatkoppeling

De gepubliceerde release v1.2.0 neemt `js/core/device-pairing.js` op als generieke cryptografische bouwsteen voor een tijdelijke, versleutelde overdracht naar een nieuw apparaat. De app blijft eigenaar van de QR-weergave/scanner, de inhoud en validatie van de configuratie, en het daadwerkelijk aansluiten van de kluizen en synchronisatie. Zie [de API-contracten](docs/CONTRACTS.md#6-apparaatkoppeling) voor de beveiligingsgrenzen.
