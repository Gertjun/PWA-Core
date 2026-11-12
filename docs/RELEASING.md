# Releases en distributie

## Status
PWA-Core `v1.0.0` is de eerste stabiele release en is gepubliceerd via Git-tag `v1.0.0` en GitHub Release. De tag verwijst naar commit `1a9c31f489290853fdc3aa4e62f199b21a338030`. Releaseworkflow #43267688827 is volledig geslaagd. Het distributiearchief `pwa-core-v1.0.0.zip` en `pwa-core-v1.0.0.zip.sha256` zijn gepubliceerd; het archief bevat `core-manifest.json` en de 13 bestanden uit de manifest-allowlist.

De release is beschikbaar als vastgepinde distributiebasis. Pilotapps worden pas daarna en elk via een eigen feature branch en PR gemigreerd. Offlineacceptatie blijft een acceptatie-eis per pilotapp.

## Releasevoorwaarden
1. Alle generieke tests en syntaxcontroles slagen.
2. Het manifest bevat voor ieder allowlisted bestand een SHA-256-checksum en wordt onafhankelijk gevalideerd.
3. De allowlist bevat uitsluitend `js/core/*.js` en `css/base.css`.
4. De ontvangende app controleert dat alle allowlisted core-bestanden lokaal aanwezig zijn en in de service-worker-precache staan.
5. Contracttests en regressietests zijn uitgevoerd; eventuele platformtests worden expliciet gedocumenteerd.
6. Een release krijgt een SemVer-tag en een GitHub Release. Een bestaande versie-tag wordt nooit overschreven. De GitHub Release wordt immutable gepubliceerd wanneer de repository-instelling voor immutable releases actief is.

## Scheiding tussen core-release en pilotmigraties

Een stabiele core-release is bedoeld als onveranderlijk distributie-artefact; de publicatie wijzigt geen ontvangende app. Tagbescherming en GitHub Release-immutability zijn afzonderlijke beveiligingslagen (zie hieronder). Publicatie vindt pas plaats na de core-contract-/regressietests, manifest- en checksumvalidatie, workflowcontroles, GitHub-tagbescherming en echte WebAuthn-platformacceptatie.

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

De workflow weigert een niet-`main`-ref, een unreleased of afwijkend manifest, onvolledige checksums en een al bestaande tag. De workflow wordt niet automatisch gestart door een push en maakt geen release tijdens PR-controles. De actieve tag-ruleset `Protect published PWA-Core versions` beschermt gepubliceerde versie-tags tegen wijziging en verwijdering; de configuratie staat hieronder. Controleer daarnaast vóór iedere publicatie dat GitHub immutable releases voor deze repository heeft ingeschakeld.

## Actieve tag ruleset

De repository-ruleset is ingericht en gecontroleerd:

- Naam: `Protect published PWA-Core versions`.
- Enforcement: `Active`.
- Target: tags die overeenkomen met `v*`.
- Updates en verwijderingen zijn geblokkeerd; tagcreatie blijft toegestaan voor de gecontroleerde releaseworkflow.
- Bypasslijst: leeg; er zijn geen bypass-actors.

De workflow weigert eveneens een al bestaande tag. De ruleset voorkomt dat een gepubliceerde versie achteraf wordt verplaatst of verwijderd.


## Git-tagbescherming versus immutable GitHub Releases

Dit zijn twee afzonderlijke beveiligingslagen:

- De actieve repository-ruleset `Protect published PWA-Core versions` target `refs/tags/v*` en blokkeert tag-updates en -verwijderingen. Dit beschermt de relatie tussen de releasetag en de Git-commit.
- Immutable GitHub Releases beschermen de gepubliceerde release en de bijbehorende release-assets tegen wijziging/verwijdering via het releasebeheer. Deze eigenschap moet afzonderlijk worden gecontroleerd; een beschermde tag betekent niet automatisch dat de GitHub Release immutable is.

### Vastgestelde status van v1.0.0

- De tag-ruleset is actief, zonder bypass-actors.
- De GitHub Release API rapporteert voor `v1.0.0` `immutable: false`.
- De bestaande release en assets zijn niet aangepast. Een wijziging van de repository-instelling maakt een reeds gepubliceerde release niet met terugwerkende kracht immutable.
- De repository-instelling en de exacte mogelijkheden/risico's om een bestaande release alsnog te beschermen moeten afzonderlijk worden onderzocht. Wijzig of verwijder v1.0.0, de tag of de assets niet als onderdeel van die controle.

### Toekomstige releases

1. Controleer vóór de volgende stabiele publicatie de repository-instelling voor immutable releases.
2. Schakel deze instelling alleen in na expliciete toestemming en leg de wijziging vast.
3. Verifieer na publicatie via de GitHub Release API dat `immutable: true` wordt gerapporteerd.
4. Behoud daarnaast de bestaande `v*`-tag-ruleset; de ene beveiligingslaag vervangt de andere niet.

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
## Actieve main-branch ruleset

De repository-ruleset `Protect main branch` is actief en target uitsluitend `refs/heads/main`:

- Pull request vereist vóór samenvoegen.
- Vereiste statuscheck: `test`; branches moeten up-to-date zijn (`strict_required_status_checks_policy: true`).
- Vereiste approvals: **0**. Dit is bewust zo ingesteld omdat de repository door één ontwikkelaar/reviewer wordt beheerd; een zelfreview zou geen onafhankelijke controle opleveren.
- Verwijderen en non-fast-forward/force-push zijn geblokkeerd.
- Bypasslijst leeg; de huidige gebruiker kan de regels niet omzeilen.

Deze configuratie dwingt feature branches, PR's en groene CI af, maar biedt geen onafhankelijke menselijke review. Een tweede reviewer kan later aanleiding zijn om de approval-eis opnieuw te beoordelen. Er is geen uitzondering op de afspraak dat merges alleen na expliciete toestemming van de gebruiker plaatsvinden.

## Huidige GitHub-beveiligingsstatus

Beide repository-rulesets zijn actief: `Protect main branch` voor `main` en `Protect published PWA-Core versions` voor `v*`. Zie de exacte configuraties hierboven. De rulesets bevatten geen bypass-actors.

