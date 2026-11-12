# Releases en distributie

## Status
De initiële extractie is nog niet vrijgegeven. Er bestaat geen stabiele release-tag. Apps mogen deze code nog niet als updatebron gebruiken.

## Releasevoorwaarden
1. Alle generieke tests en syntaxcontroles slagen.
2. Het manifest bevat voor ieder allowlisted bestand een SHA-256-checksum en wordt onafhankelijk gevalideerd.
3. De allowlist bevat uitsluitend `js/core/*.js` en `css/base.css`.
4. De ontvangende app controleert dat alle allowlisted core-bestanden lokaal aanwezig zijn en in de service-worker-precache staan.
5. Contracttests en regressietests zijn uitgevoerd; eventuele platformtests worden expliciet gedocumenteerd.
6. Een release krijgt een SemVer-tag en een GitHub Release. Een bestaande versie-tag wordt nooit overschreven.

## Manifest voorbereiden
Voer de releasevoorbereiding via een featurebranch en PR uit:

1. Kies de nieuwe SemVer-versie en werk `coreVersion` bij in `core-manifest.json`.
2. Laat `releaseStatus` tijdelijk op `unreleased` staan.
3. Genereer alle hashes met `node tools/manifest.mjs generate`.
4. Zet daarna `releaseStatus` op `released`.
5. Controleer lokaal met `node tools/manifest.mjs verify` en `node tools/release.mjs validate --version X.Y.Z`.
6. Laat CI slagen en merge de PR pas na review.

## Release publiceren
Na merge naar `main`:
1. Open GitHub Actions in PWA-Core.
2. Kies workflow **PWA-Core release** en start deze handmatig vanaf `main`.
3. Vul bij `version` exact de `coreVersion` in, zonder `v`-prefix.
4. De workflow valideert het manifest en alle tests opnieuw.
5. De workflow bouwt een ZIP met `core-manifest.json` en uitsluitend de allowlisted bestanden, berekent de ZIP-SHA-256 en publiceert een versie-tag plus GitHub Release.

De workflow weigert een niet-`main`-ref, een unreleased of afwijkend manifest, onvolledige checksums en een al bestaande tag. De workflow wordt niet automatisch gestart door een push en maakt geen release tijdens PR-controles. Configureer vóór de eerste productie-release ook GitHub tag protection/rulesets om gepubliceerde versie-tags tegen handmatige wijziging of verwijdering te beschermen.

## Aanbevolen tag ruleset vóór de eerste release

De repository is openbaar en GitHub rulesets zijn beschikbaar voor openbare repositories op GitHub Free. De actuele PWA-Core-repository heeft nog geen ruleset. Stel vóór de eerste stabiele release handmatig de volgende repository ruleset in via **Settings → Rules → Rulesets → New tag ruleset**:

- Naam: `Protect published PWA-Core versions`.
- Enforcement: `Active`.
- Target tags: include pattern `v*`.
- Tag protections: **Restrict updates** en **Restrict deletions**.
- **Restrict creations** blijft uit, zodat de handmatige releaseworkflow een nieuwe `vX.Y.Z`-tag kan maken.
- Houd de bypasslijst leeg tenzij een aantoonbare operationele noodzaak ontstaat.

Controleer na opslaan dat de ruleset actief is en op `v*` van toepassing is. Dit document is alleen een voorstel/werkinstructie: de instellingen zijn nog niet aangepast. De workflow controleert zelf ook dat een bestaande tag niet wordt overschreven; de ruleset voegt bescherming tegen latere handmatige wijzigingen/verwijderingen toe.

## Precache-validatie
De ontvangende app voert vanuit de repository-root uit:

```sh
node tools/precache.mjs --manifest core-manifest.json --service-worker sw.js
```

De validator:
- leest de allowlist uit het core-manifest;
- controleert of elk allowlisted bestand lokaal bestaat;
- leest alleen een statische `PRECACHE`-array met letterlijke paden;
- weigert dynamische expressies, dubbele entries en remote/absolute paden;
- faalt wanneer een core-bestand ontbreekt of niet in de precache staat.

De validator verandert geen bestanden. Een ontbrekende entry wordt uitsluitend via een aparte PR in de ontvangende app toegevoegd. De volledige service worker blijft app-eigendom.

## Distributie
- Distributie is handmatig gestart; later kan een geplande controle worden toegevoegd.
- Eén aparte updatebranch en PR per ontvangende app.
- Alleen bestanden uit de gevalideerde manifest-allowlist worden gekopieerd.
- De workflow controleert hashes vóór en na kopiëren en voert daarna de precache-validator uit.
- App-specifieke bestanden zoals `js/config.js`, `js/app.js`, `css/app.css`, `index.html`, `manifest.webmanifest`, iconen en `sw.js` worden niet overschreven. De workflow mag uitsluitend de precache-lijst van `sw.js` gericht aanpassen wanneer een nieuwe module wordt toegevoegd.
- De workflow gebruikt de ingebouwde `GITHUB_TOKEN` van de ontvangende repository met minimale rechten. Geen persoonlijk PAT.
- Er wordt nooit automatisch gemerged.

## Rollback
Een update-PR kan worden gesloten. Na merge kan de vorige vastgepinde core-versie via een aparte rollback-PR worden teruggezet. Verwijder of wijzig nooit een gepubliceerde release-tag.
