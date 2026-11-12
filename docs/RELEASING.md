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

## Scheiding tussen core-release en pilotmigraties

De eerste stabiele core-release is een onveranderlijk distributie-artefact; de publicatie wijzigt geen ontvangende app. Publicatie vindt pas plaats na de core-contract-/regressietests, manifest- en checksumvalidatie, workflowcontroles, GitHub-tagbescherming en echte WebAuthn-platformacceptatie.

De drie pilotapps worden bewust pas **na** de stabiele release gemigreerd. Iedere pilot krijgt een eigen feature branch en PR. Die PR moet aanvullend bewijzen dat de release in de concrete app integreert: release-tag wijst naar de gepinde volledige commit-SHA, lockbestand en manifestchecksum kloppen, alle allowlisted bestanden zijn lokaal aanwezig en intact, de service-worker-precache is volledig, CI slaagt en relevante runtime-/offline-/app-contractcontroles zijn uitgevoerd. Een mislukte pilot-PR wordt niet gemerged; de gepubliceerde core-release wordt nooit aangepast of overschreven.

Daarmee is pilotintegratie een acceptatiepoort voor iedere app-migratie, niet een voorwaarde om het nog ongebruikte core-artefact te publiceren. Zie besluit D12.

## Manifest voorbereiden
Voer de releasevoorbereiding via een featurebranch en PR uit:

1. Kies een stabiele SemVer-versie `X.Y.Z` (geen prerelease of buildmetadata) en werk `coreVersion` bij in `core-manifest.json`.
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
5. De workflow checkt exact de dispatchcommit uit, valideert dat deze gelijk blijft aan de releasecommit, bouwt een ZIP met `core-manifest.json` en uitsluitend de allowlisted bestanden, berekent de ZIP-SHA-256 en publiceert een versie-tag plus GitHub Release.

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

## App-specifieke release-pin

Iedere ontvangende app bewaart naast `core-manifest.json` een eigen `pwa-core.lock.json`. Het lockbestand bevat de onveranderlijke identificatie van de gebruikte release:

```json
{
  "schemaVersion": 1,
  "repository": "Gertjun/PWA-Core",
  "version": "1.0.0",
  "tag": "v1.0.0",
  "commit": "<40-teken volledige commit-SHA van de tag>",
  "manifestSha256": "<SHA-256 van de exacte core-manifest.json-bytes>"
}
```

De manifestchecksum wordt berekend over de ongewijzigde bytes van `core-manifest.json` (inclusief witruimte en newline); het is dus geen hash van opnieuw geserialiseerde JSON. De commit-SHA is de commit waarnaar de release-tag verwijst. Het manifest bevat bewust niet zijn eigen releasecommit: dat zou een zelfreferentiële commit opleveren.

### Pin valideren in een ontvangende app

Na het kopiëren van de allowlisted bestanden, `core-manifest.json` en `pwa-core.lock.json` voert de app-PR uit:

```sh
node tools/pin.mjs verify
node tools/precache.mjs --manifest core-manifest.json --service-worker sw.js
```

De pinvalidator controleert stabiele SemVer, `tag === v + version`, een volledige 40-teken commit-SHA, manifestchecksum, released-status, exacte checksumdekking en de SHA-256 van ieder lokaal core-bestand. Symlinks en paden buiten de allowlist worden geweigerd. De validator werkt volledig lokaal en wordt niet vanuit de PWA-runtime geladen.

De pinvalidator kan offline niet bewijzen dat een externe Git-tag naar de opgegeven commit verwijst. Daarom moet de distributie-/migratie-PR de tag-resolutie aanvullend via GitHub/Git verifiëren en vastleggen dat `refs/tags/vX.Y.Z` exact naar de `commit` in het lockbestand wijst. De actieve `v*`-tag-ruleset beschermt die relatie na publicatie tegen wijzigen en verwijderen. Een wijziging van de tag is nooit een toegestane updateprocedure.
## Releaseworkflow-integriteit

De handmatige releaseworkflow checkt de workflow-dispatchcommit uit via `github.sha` en vergelijkt daarna `git rev-parse HEAD` met diezelfde SHA. Het archief wordt daardoor altijd opgebouwd uit exact de commit waaraan de nieuwe release-tag wordt gekoppeld, ook als `main` ondertussen verder beweegt.

Officiële stabiele releases accepteren uitsluitend SemVer `X.Y.Z`; prerelease- en buildmetadata-versies worden geweigerd. De CI-workflow en releaseworkflow pinnen externe GitHub Actions op vaste commit-SHA's.

Het ZIP-checksum-bestand bevat alleen de archiefbestandsnaam, zodat `sha256sum -c pwa-core-vX.Y.Z.zip.sha256` werkt wanneer beide release-assets in dezelfde map staan.
## Aanbevolen main-branch ruleset (voorstel, nog niet toegepast)

Stel via **Settings → Rules → Rulesets → New branch ruleset** een afzonderlijke ruleset in:

- Naam: `Protect main – reviewed and tested`.
- Enforcement: `Active`.
- Target branches: include pattern `main`.
- Require a pull request before merging.
- Required approvals: **1** onafhankelijke approval; dismiss stale approvals en require approval of the most recent reviewable push.
- Require status checks to pass: selecteer de check `test` uit de workflow **Core checks**.
- Require branches to be up to date before merging.
- Block force pushes en branch deletion.
- Bypass list: leeg.

**Belangrijke randvoorwaarde:** een PR-auteur kan de eigen PR niet goedkeuren. Eén verplichte approval betekent dus dat een tweede bevoegde reviewer nodig is. Als de repository uitsluitend door één persoon wordt beheerd, activeer deze 1-approval-instelling niet voordat een tweede reviewer beschikbaar is. Een alternatief met 0 approvals behoudt de verplichte PR en groene CI, maar is geen onafhankelijke review. Dit is een expliciete beheerkeuze; er is niets ingesteld.

De tag ruleset `Protect published PWA-Core versions` blijft afzonderlijk: target `v*`, actieve restricties op updates en verwijderingen, tagcreatie toegestaan voor de gecontroleerde releaseworkflow en een lege bypasslijst.

## Huidige GitHub-beveiligingsstatus

Bij de laatste controle waren er geen repository-rulesets en was `main` niet beschermd. Deze voorstellen zijn documentatie; er zijn geen repository-instellingen gewijzigd.