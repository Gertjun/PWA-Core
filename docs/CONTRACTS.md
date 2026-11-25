# PWA-Core – API- en gegevenscontracten

Status: bijgewerkt op 19 november 2026. De vijf portfolio-apps zijn gemigreerd en hun huidige lockfiles pinnen PWA-Core v1.3.0 (tag `v1.3.0`, source commit `fd47638355d975d85dfc376b07810b4b0e4b2a63`, manifest-SHA256 `141e78258aaa54dce8778f7b0c2344ca2375a41568bbbfd4a6138551432abac3`). `main` bevat post-tag fixes die als v1.3.1 unreleased worden bijgehouden. De actuele appversies en praktische acceptatie staan in `docs/APP-ACCEPTANCE-MATRIX.md`. Dit document beschrijft contracten; het is geen vervanging voor runtime- of praktijktestbewijs.

## 1. Reikwijdte en huidige migratiestatus

Alle vijf portfolio-apps gebruiken PWA-Core v1.3.0:

1. MW4-CAMO — 1.33.1
2. Energieverbruik — 1.45.4
3. Games Backlog — 1.34.4
4. Cryptotracker — 4.0.6
5. Vaste Lasten — 3.8.5

De apps zijn afzonderlijk gemigreerd via featurebranches en PR's. MW4-CAMO, Energieverbruik en Games Backlog gebruiken de modulaire app/Core-contracten. Cryptotracker en Vaste Lasten behouden app-eigen adapters en datamodellen; hun migraties zijn geen directe kopieën van de modulaire familie. App-specifieke acceptatie, releasebesluiten en resterende praktijktests blijven per app geregistreerd in de acceptatiematrix.

## 2. Runtimegrens: app en kern

De kernbestanden worden op dezelfde paden in de app-repository geplaatst. Ze worden lokaal vanaf de eigen GitHub Pages-origin geladen en in de service-worker-cache opgenomen. De runtime importeert nooit code rechtstreeks uit PWA-Core of via een CDN.

### 2.1 Configuratiecontract: js/config.js

De kern verwacht `export const APP` met minimaal:

- `name`: zichtbare appnaam;
- `version`: appversie (SemVer; niet de core-versie);
- `storagePrefix`: vaste, unieke prefix per app; na ingebruikname nooit wijzigen;
- `defaultDataPath` en `defaultBranch`: standaardlocatie van de versleutelde kluis;
- `autoLockMinutes`, `autoBiometricUnlock`, `syncDelaySeconds`;
- `minPasswordLength`, `kdfIterations`.

Optioneel (vanaf 1.4.0): `defaultOwner` en `defaultRepo`, waarmee de schil eigenaar en data-repo vooraf invult bij handmatig koppelen.

De drie modulaire apps gebruiken dezelfde configuratiestructuur en dezelfde waarden voor de generieke instellingen. Hun eigen naam, versie, opslagprefix en datapad verschillen. De huidige opslagprefixen zijn `mw4-camo`, `energieverbruik` en `games-backlog`.

### 2.2 App-contract: js/app.js

De schil importeert `app` uit `../app.js`. Verplichte eigenschappen:

- `schemaVersion`: hoogste ondersteunde app-dataschema;
- `screens`: lijst met `{ id, label, icon }`;
- `initialData()`: lege beginstructuur;
- `migrate(data)`: oude data naar het huidige app-schema brengen;
- `merge(local, remote)`: twee app-datasets samenvoegen;
- `render(root, ctx)`: huidig scherm tekenen.

Optioneel:

- `renderSettings(page, element, ctx)`: app-eigen instellingenpagina;
- aanvullende app-eigen eigenschappen en functies, zolang de generieke kern die niet overschrijft.

Regels voor de app-implementatie:

- `migrate` en `merge` behouden onbekende velden op hoofdniveau, waaronder `__pwaSync`;
- `merge` is deterministisch en behoudt records uit beide kanten;
- recordcollecties gebruiken `id` en `updatedAt`; verwijderingen worden niet als definitief ontbreken geïnterpreteerd;
- de app muteert `ctx.data` niet rechtstreeks.

### 2.3 Contextcontract: ctx

De kern levert aan `render`:

- `data` (alleen lezen);
- `update(mutator)` (asynchroon; mutator krijgt een wijzigbare kopie);
- `toast(message, kind)`, `confirm(message)`;
- `screen`, `go(id)`, `setBadge(id, count)`;
- `openSettings(page)`, `showShellSettings(group)`;
- `syncConfigured` (boolean);
- `readSyncFile(path)` (asynchroon; `{ sha, text }` of `null`).

Aanvullende opslagcontractmethoden (vanaf de nog niet gepubliceerde Core-fix):
- `flush()`: Promise die resolve't met `{ revision }` als de bij aanroep actuele revisie lokaal is bevestigd; anders reject met `StorageWriteError`.
- `getStorageStatus()`: uitsluitend `requestedRevision`, `persistedRevision`, `pending` en geschoonde foutmetadata; nooit app-data of sleutels.
- `retryStorage()`: één expliciete poging om de volledige actuele snapshot opnieuw op te slaan; geen automatische retry-loop.
- `getDeviceSettings()` / `setDeviceSettings(value)`: versleutelde, apparaatspecifieke instellingen; niet gesynchroniseerd.
- `update(mutator)`: resolve't uitsluitend na lokale persist en reject't bij fouten. De interne updateketen blijft na een fout bruikbaar.


De contracttests moeten controleren dat deze eigenschappen beschikbaar zijn en dat `update` de wijziging opslaat voordat de promise is afgerond.

## 3. Opslag- en versleutelingscontract

### 3.1 Lokale opslag

De kern gebruikt een app-eigen namespace op basis van `APP.storagePrefix`, onder meer voor:

- `<prefix>:vault`: versleutelde kluis-envelop;
- `<prefix>:device`: versleutelde apparaatinstellingen;
- `<prefix>:sync`: lokale synchronisatiestatus;
- `<prefix>:device-id`: willekeurig apparaat-ID;
- `<prefix>:biometric`: lokaal passkey-/PRF-record;
- aanvullende instellingen voor navigatie en de schil.

Geen app mag de prefix van een andere app gebruiken. App-gegevens en apparaatinstellingen blijven versleuteld; het apparaat-ID bevat geen gebruikersgegevens.

### 3.1.1 Schrijfrevisies en tabbladexclusiviteit

Iedere ontgrendelde sessie verkrijgt vóór unlock/create/import een exclusieve Web Lock op basis van `APP.storagePrefix`. De lock blijft vastgehouden tot de app succesvol is vergrendeld. Andere tabs blijven op het lockscherm; ontbrekende Web Locks of een bezette lock blokkeert schrijven. Storage-events en BroadcastChannel zijn uitsluitend notificaties, geen lockmechanisme. Als een vault-, device-settings- of volledige localStorage-clear-event toch van een niet-meewerkend/ouder tabblad komt, wordt de actieve sessie afgeschermd. De Core maakt een versleutelde recovery-envelop van de actuele geheugenstand en bewaart ook de externe versleutelde opslagwaarde; pas na export van de recoverybestanden wordt de sessielock vrijgegeven. Dit vangnet vervangt de operationele eis niet om vóór uitrol alle oude app-tabs te sluiten of te verversen. Een afgebroken GitHub-PUT kan server-side alsnog zijn verwerkt; de lokale sync-status blijft dan dirty en de volgende synchronisatie haalt de remote SHA op en merge't opnieuw.

De schil breekt bij vergrendelen eerst de actieve GitHub-fetch via `AbortController` af, wacht op de sync-afhandeling en op alle reeds gestarte shell-operaties (zoals device-settings, herstel en reset); zodra vergrendelen start, worden nieuwe schrijfoperaties geweigerd. Een `update` is pas voltooid na lokale persist. `flush` bevestigt de bij aanroep actuele revisie; een hogere volledige snapshot mag een eerdere mislukte write inhalen. Bij opslagfout wordt de fout doorgegeven en blijft de revisie pending. `retryStorage` doet maximaal één expliciete retry van de volledige actuele snapshot. De app verbergt gevoelige inhoud vóór het vergrendelen en wist de sleutel pas na succesvolle flush.

### 3.2 Kluis-envelop

De huidige envelop heeft deze vorm:

```json
{
  "format": "pwa-vault",
  "version": 1,
  "kdf": { "name": "PBKDF2-SHA256", "iterations": 600000, "salt": "…" },
  "wrappedKey": { "iv": "…", "data": "…" },
  "payload": { "iv": "…", "data": "…" },
  "updatedAt": 0
}
```

De wachtwoordsleutel wordt met PBKDF2-SHA256 afgeleid; de datasleutel en payload gebruiken AES-GCM. De payload bevat het app-datamodel. De envelope-versie staat los van de app-`schemaVersion` en de PWA-Core-versie.

### 3.3 Passkeys

WebAuthn PRF levert een geheim dat via HKDF wordt gebruikt om de datasleutel lokaal in te pakken. De PRF-invoer en opslagkeys zijn per app afgeleid van `storagePrefix`. De kern ondersteunt ook het opnieuw koppelen van een bestaande passkey. Een wachtwoord blijft de terugvaloptie.

WebAuthn beperkt `user.id` tot maximaal 64 bytes. De Core maakt daarom een compacte, deterministische namespace-tag op basis van `storagePrefix` en een expliciete functie-scope (`vault` of een andere app-eigen scope), gevolgd door willekeurige bytes. De volledige prefix wordt niet in `user.id` opgenomen. Bij opnieuw koppelen worden deze nieuwe tags gecontroleerd; bestaande gestructureerde `storagePrefix:`-handles blijven herkenbaar en niet-gestructureerde legacy-handles blijven koppelbaar. De PRF-invoer, HKDF-context, opgeslagen credential-ID en wrapped datasleutel veranderen hierdoor niet. Een nieuwe functie binnen dezelfde app gebruikt een eigen scope, zodat een passkey voor een andere sleutelbundel niet als dezelfde passkeyfunctie wordt geaccepteerd.

Passkey-tests zijn platformtests en geen gewone Node-unit-tests. Test minimaal Safari op iPhone/iPad en een Windows-browser met Windows Hello; controleer ook de wachtwoord-terugval. Een passkey-record op één apparaat wordt niet als bewijs gezien dat een ander apparaat is ingericht.

## 4. Synchronisatiecontract

### 4.1 GitHub-client

`createClient(settings)` verwacht:

`{ owner, repo, branch, path, token }`

De client leest en schrijft één bestand via de GitHub Contents API. Een upload gebruikt de eerder opgehaalde SHA als voorwaarde; een conflict wordt als `ConflictError` gemeld. Tokens worden uitsluitend lokaal ingevoerd en mogen nooit in tests, logs, fixtures of PWA-Core terechtkomen.

### 4.2 syncNow

`syncNow({ settings, merge, migrate, schemaVersion })` levert één van:

- `up-to-date`
- `uploaded`
- `downloaded`
- `merged`
- `restored`

De kern voorkomt gelijktijdige sync-runs, controleert of lokale data tijdens het ophalen veranderde en probeert GitHub-conflicten beperkt opnieuw. Remote data met een hoger app-schema blokkeert synchronisatie met `UpdateRequiredError`.

De 1.5.0-variant bereidt vóór sync de verwijderadministratie voor en schrijft na het ophalen ook de bijgewerkte administratie terug. Dit wijkt bewust af van de oudere sync-implementatie.

## 5. Record- en verwijdercontract

### 5.1 Records

De generieke helpers zijn:

- `newRecord(fields)`: maakt `id`, `createdAt` en `updatedAt`;
- `alive(list)`: filtert verwijderde records uit de weergave;
- `findById(list, id)`;
- `updateById(list, id, changes)`;
- `removeById(list, id)`: schrijft een tombstone;
- `mergeCollections(local, remote)`: per ID wint de nieuwste `updatedAt`; bij gelijke tijd wint lokaal;
- `purgeTombstones(list, days)`: verwijdert oude tombstones uit de collectie.

### 5.2 Verwijderadministratie in 1.5.0

De nieuwe module `deletions.js` voegt `__pwaSync` toe aan de versleutelde app-data:

```json
{
  "__pwaSync": {
    "version": 1,
    "devices": {
      "device-id": {
        "createdAt": 0,
        "lastSeenAt": 0,
        "acknowledged": { "collectie:record-id": 0 }
      }
    },
    "deletions": { "collectie:record-id": 0 }
  }
}
```

Een verwijdering wordt geïdentificeerd met collectiepad plus record-ID. Actieve apparaten bevestigen welke verwijderingen zij hebben verwerkt. Tombstones kunnen worden opgeruimd zodra alle actieve apparaten de verwijdering hebben bevestigd; de graveyard blijft bestaan om oude back-ups en lang offline apparaten te blokkeren. Een afgemeld apparaat mag niet opnieuw deelnemen.

Dit is een apart contract naast het app-dataschema. De app-merge moet `__pwaSync` behouden. De kern combineert de administratie onafhankelijk van de app-specifieke merge en past de graveyard na samenvoegen opnieuw toe.

## 6. Compatibiliteitsmatrix

| Onderdeel | MW4-CAMO | Energieverbruik | Games Backlog | Cryptotracker | Vaste Lasten |
|---|---|---|---|---|---|
| Modulaire `js/core/` | Ja | Ja | Ja | Nee | Nee |
| Zelfde 12 core-/base-hashes binnen de pilotgroep | Ja | Ja | Ja | n.v.t. | n.v.t. |
| App-merge behoudt onbekende top-level velden | Ja, spread + collecties | Ja, spread + collecties | Ja, spread + collecties | Eigen merge; apart beoordelen | Eigen merge; apart beoordelen |
| Records/tombstones | `progress`, `pins`, `loadouts` | 8 collecties | `games`, `gameInfo` | Eigen `del`/deleted administratie | Eigen model |
| Huidig app-schema | 4 | 5 | 9 | Eigen DATA_V | Eigen versie-/datamodel |
| Eerste migratiegroep | 1 | 2 | 3 | Later apart | Later apart |

### Specifieke aandachtspunten

- Energieverbruik en Games Backlog ruimen tombstones na 180 dagen op tijdens `migrate`; de blijvende `__pwaSync.deletions`-graveyard moet voorkomen dat oude records terugkomen.
- MW4 bewaart verwijdermarkeringen al bewust en gebruikt vaste record-ID's voor camo-voortgang.
- De drie modulaire apps gebruiken verschillende app-schema's. De kern mag deze schema's niet gelijk trekken of zelf verhogen.
- Cryptotracker gebruikt onder meer `data.v`, eigen `deleted`-administratie, eigen sync/crypto en een eigen conflictstrategie. Vaste Lasten verdeelt data bovendien over gedeelde en persoonsgebonden bestanden. Beide vragen een eigen analyse en migratieontwerp.

## 7. Verplichte geautomatiseerde compatibiliteitstests

De tests draaien zonder echte GitHub-repository, tokens of gebruikersdata. Gebruik synthetische data en een nep-GitHub-client/fetch.

### A. Publieke interface
1. Configuratie bevat alle vereiste APP-velden; opslagprefixen van fixtures zijn uniek.
2. De app-export voldoet aan het contract en de kern kan starten met een minimale test-app.
3. Alle ctx-methodes bestaan; `ctx.update` is asynchroon en markeert data als gewijzigd.

### B. Kluis en versleuteling
4. Envelope round-trip: aanmaken, opslaan, openen en payload teruglezen.
5. Verkeerd wachtwoord en beschadigde envelope worden veilig geweigerd.
6. Een onbekende toekomstige envelope-versie wordt geweigerd zonder lokale data te overschrijven.
7. Meerdere snelle updates worden in volgorde opgeslagen; `flush` wacht op de laatste revisie.
8. Apparaatinstellingen zijn niet leesbaar zonder de datasleutel.

### C. Synchronisatie
9. Geen remote bestand → eerste upload.
10. Alleen lokaal gewijzigd → upload met SHA.
11. Alleen remote gewijzigd → downloaden en veilig toepassen.
12. Beide gewijzigd → app-merge, zonder onbekende top-level velden te verliezen.
13. Gelijktijdige wijziging/conflict → beperkte retry zonder overschrijven van nieuwere data.
14. Remote app-schema hoger → sync stopt met updateverzoek.
15. Lokale wijziging tijdens remote fetch → sync start opnieuw.
16. Een mislukte upload laat de lokale data als dirty gemarkeerd.

### D. Verwijderingen en herstel
17. Verwijdering op apparaat A wordt na sync niet teruggezet door apparaat B.
18. Apparaat B is langdurig offline; na terugkeer blijft de verwijdering gelden.
19. Een oude back-up brengt een verwijderd record niet terug.
20. Tombstone-opruiming gebeurt pas nadat alle actieve apparaten hebben bevestigd.
21. Een afgemeld apparaat kan niet opnieuw registreren.
22. Een record-ID in twee verschillende collecties veroorzaakt geen kruisverwijdering.
23. Een verwijdering blijft gelden bij gelijktijdige wijziging van hetzelfde record.
24. Herstel van back-up behoudt de actuele graveyard; een onleesbare remote kluis wordt nooit blind overschreven.

### E. App-integratie en distributie
25. De manifestbestanden en checksums komen exact overeen met de release.
26. Alle core-modules staan in de service-worker-PRECACHE.
27. De test-app start online en na een eerste cachevulling offline.
28. Per ontvangende app draaien de eigen unit-/E2E-tests; onbekende velden en collecties blijven behouden.
29. Een update opent een PR op een aparte branch; geen directe wijziging van main en geen automatische merge.

## 8. Historische praktijktests voor PWA-Template 1.5.0

De volgende 1.5.0-scenario's zijn op 12 november 2026 uitgevoerd in de geïsoleerde testapp `Gertjun/PWA-Template-Test`, met een afzonderlijke privé-testdatarepo. De uitkomsten hieronder zijn door de gebruiker op twee apparaten bevestigd:

- Synchronisatie in beide richtingen en het koppelen van een tweede apparaat: geslaagd.
- Apparaat B offline houden, op A een record verwijderen, B weer online brengen en synchroniseren: het verwijderde record kwam niet terug.
- Een eerdere back-up herstellen op A en daarna op B: het verwijderde record bleef op beide apparaten verwijderd.
- Een apparaat afmelden: het apparaat kon daarna niet meer synchroniseren en kreeg de verwachte melding dat het was afgemeld.
- Het afgemelde apparaat wissen en opnieuw koppelen: de oude afmelding bleef zichtbaar en de nieuwe koppeling verscheen als een nieuwe apparaatregistratie.
- Verwijderbevestigingen controleren: beide actieve apparaten toonden hetzelfde aantal bevestigingen; het oude afgemelde apparaat liep één bevestiging achter en blokkeerde de compactie niet.

De testbranch heeft een geslaagde GitHub Actions-testworkflow (commit `3cdc5fa490da0a194919e3e0354ac1f49c331e6d`, run [43201963152](https://github.com/Gertjun/PWA-Template-Test/actions/runs/43201963152)) en een geslaagde GitHub Pages-deployment (run [43202645959](https://github.com/Gertjun/PWA-Template-Test/actions/runs/43202645959)).

Beperkingen: de exacte OS-/browsercombinaties zijn niet voor elke praktijktest vastgelegd. De volgende bredere controles uit de PWA-Core-acceptatielijst zijn niet allemaal met deze praktijktest bewezen: passkey-PRF op elk ondersteund platform, wachtwoordterugval, herstel met een andere sleutel, meerdere browsertabbladen, update van een reeds geopende oude app-versie en volledige offline-start na cachevulling. De 29 contracttests zijn een bredere acceptatielijst en niet allemaal geïmplementeerd of uitgevoerd.

## 9. Huidige status en migratievoortgang

### PWA-Core

- De eerste stabiele release `v1.0.0` is gepubliceerd. De tag verwijst naar commit `1a9c31f489290853fdc3aa4e62f199b21a338030`.
- De releaseworkflow #43267688827 is geslaagd; ZIP en SHA-256-assets zijn gepubliceerd. De release bevat `core-manifest.json` en de 13 bestanden uit de allowlist.
- De actieve ruleset beschermt `main`; de actieve `v*`-tag-ruleset blokkeert wijzigingen en verwijderingen van gepubliceerde tags.
- De GitHub Release API rapporteert voor v1.0.0 `immutable: false`. Dit is een afzonderlijke beveiligingslaag naast de actieve tag-ruleset; zie `docs/RELEASING.md`.
- De core-release is onveranderlijk als distributiebasis. Een core-release publiceert geen wijzigingen naar ontvangende apps.

### Pilotmigraties

- **MW4-CAMO:** PR [#4](https://github.com/Gertjun/MW4-CAMO/pull/4) is gemerged. De app pint PWA-Core v1.0.0 op de volledige releasecommit en bevat manifest-, pin- en precachevalidatie. De PR rapporteerde 61 geslaagde tests. De resterende echte platform-/multi-device-acceptatie moet worden beoordeeld aan de hand van de actuele app-notities; een geslaagde CI alleen bewijst die niet.
- **Energieverbruik:** PR [#7](https://github.com/Gertjun/Energieverbruik/pull/7) is gemerged. De app pint dezelfde releasecommit; de PR rapporteerde geslaagde unit-, Core-contract-, deletion-ledger-, pin-, precache- en Playwright-validatie. De bestaande opslagprefix, datapad en app-schema 5 zijn behouden.
- **Games Backlog:** PR [#1](https://github.com/Gertjun/Games-Backlog/pull/1) staat open als draft op `feature/pwa-core-v1.0.0-migration`. De PR bevat de releasepin, manifest en alle 13 core-bestanden. De actuele head is `df884b6fb67808ffbf399fedc083ecc9f5cc2658`; workflowrun #43290708084 is geslaagd. De PR rapporteert 87/87 unit- en contracttests, 2/2 Playwright E2E-tests, pin- en precachevalidatie. Handmatige iPhone/Safari-/iPad- en twee-apparatencontroles staan nog als open punten in de PR. Niet mergen voordat die acceptatie en expliciete toestemming zijn afgehandeld.
- **Cryptotracker en Vaste Lasten:** geen directe kopieermigratie. Eerst een afzonderlijke adapter-/refactoranalyse vanwege hun afwijkende architectuur en gegevens-/synccontracten.

### PWA-Template

- PWA-Template 1.5.0 staat op `main` via commit `0f538f8acf40d086df38e9bc4ed2cd875925c569`.
- De huidige template-corebestanden komen overeen met de broncommit die in het PWA-Core-manifest is vastgelegd.
- De formele `core-manifest.json`-/`pwa-core.lock.json`-integratie en automatische release-distributie/updateworkflow zijn nog niet in de template-setup geïntegreerd. Dit is een expliciet open technisch werkpakket; lokale core-bestanden alleen gelden niet als formele releasepin.

### Test- en veiligheidsgrenzen

- De 29 contracttestpunten in §7 vormen een acceptatielijst; ze zijn niet allemaal als automatische tests geïmplementeerd of uitgevoerd.
- De historische PWA-Template 1.5.0-praktijktests in §8 zijn door de gebruiker op twee apparaten bevestigd. Ze bewijzen niet automatisch alle platformcombinaties of alle huidige pilotapp-integraties.
- Gebruik voor core-tests uitsluitend synthetische data. Productie-datarepositories, kluisbestanden en persoonlijke tokens blijven buiten scope.
- Een mislukte of ontbrekende CI-status is geen goedkeuring. Een groene CI vervangt geen expliciete handmatige acceptatie.


## 10. Meerdere onafhankelijke kluizen per runtime

De factory-API is additief en laat de bestaande singleton-contracten intact:

- `createVault({ storagePrefix, kdfIterations, storage? })` maakt een geïsoleerde vault-instantie. De standaardstorage is `localStorage`; tests mogen een Storage-compatibele synthetische implementatie injecteren.
- `createSync({ vault, appName })` maakt een sync-controller die uitsluitend de geïnjecteerde vault gebruikt en een eigen actieve-runstatus heeft.
- `createSessionLock({ storagePrefix })` maakt een Web Lock-controller met een prefixgebonden locknaam en instance-local lifecycle.
- `createBiometric({ storagePrefix, appName, storage? })` maakt een PRF-enrollment-/unlock-controller met prefixgebonden opslagkey, PRF-label en HKDF-info.
- De bestaande `vault.js`, `sync.js`, `session-lock.js` en `biometric.js` exports blijven compatibele facades over de standaard `APP`-configuratie.

Elke vault-prefix is één stabiel namespace-segment (letters, cijfers, punt, underscore of koppelteken; geen dubbele punt) zodat prefixes niet via prefix-overlap elkaars opslag kunnen raken. Elke actieve vault-prefix mag binnen één runtime maar één vault-instantie hebben. Een dubbele instantie wordt geweigerd. Verschillende prefixes hebben onafhankelijk:
- vault envelope, DEK, password wrapping en payload;
- local storage keys, device ID, settings en syncmetadata;
- revisies, write queue, flush-/retryfouten;
- Web Lock-sessie;
- passkey-enrollmentrecord en PRF/HKDF-afleidingscontext;
- sync controller, conflict retries en remote SHA.

Een passkey kan mogelijk dezelfde credential op authenticatorniveau hergebruiken, maar iedere vault heeft een afzonderlijke PRF/HKDF-context en wrapped DEK. De eerste implementatie garandeert geen gezamenlijke één-prompt-ontgrendeling; dat is een latere UX-optimalisatie.

Een app zoals Vaste Lasten kan één instantie voor gedeelde gegevens en één voor de actieve persoon maken. De derde persoonlijke instantie kan bestaan zonder dat die tijdens een sessie wordt ontgrendeld. Elke sync-controller beheert één remote bestand. De app koppelt dus expliciet iedere vault aan het juiste bestand en wachtwoorddomein.

Er bestaat geen atomische transactie over meerdere vaults. Bij een actie die twee gegevensdomeinen wijzigt, moet de app de afzonderlijke write-/flushresultaten afhandelen en bij gedeeltelijk succes een herstelbare status tonen. De Core mag geen all-or-nothing garantie suggereren.

De Core-factory importeert of converteert geen bestaande appdata. Bestaande envelopes, localStorage-keys en remote bestanden blijven onaangeroerd totdat een afzonderlijke app-migratie een volledige backup-, verificatie- en rollbackprocedure uitvoert.

## 6. Apparaatkoppeling: GitHub Sync-toegang

Bestanden: `js/core/pair.js` (enige cryptografische implementatie) en `js/core/device-pairing.js` (dunne QR-adapter).

Legacy v2-apparaatkoppeling draagt uitsluitend de minimale configuratie over die nodig is om GitHub Sync op het nieuwe apparaat in te stellen. Denk aan provider, repository-eigenaar, repositorynaam, branch, bestandspad en het daarvoor benodigde GitHub-token. De Core dwingt het vaste schema `owner`, `repo`, `branch`, `path` en `token` af en weigert extra velden of niet-tekstuele/lege waarden. De app blijft verantwoordelijk voor inhoudelijke validatie en tokenrechten.

**Uitdrukkelijk buiten de overdracht:** vaultinhoud, records, portfolio-/appdata, vaultwachtwoorden, passkeys, API-sleutels die niet nodig zijn voor GitHub Sync en overige gebruikersinstellingen. Na succesvolle koppeling haalt het nieuwe apparaat de bestaande applicatiegegevens op via de normale GitHub Sync-route. Pairing is dus geen data- of vaultmigratie.

### Publieke API v2 (v1.3.0)

- `newPin()`: uniforme willekeurige PIN van 16 tekens; rejection sampling voorkomt modulo-bias.
- `createPairingCode({ syncConfig, pin, context, now?, transport? })` en `openPairingCode(...)`: versleutelen/ontsleutelen uitsluitend de synchronisatieconfiguratie.
- `transport='text'` ondersteunt handmatige codes tot 24.000 tekens; `transport='qr'` gebruikt dezelfde envelop en cryptografie met een limiet van 2.200 tekens.
- `device-pairing.js` biedt `createPairingPayload` en `openPairingPayload` als dunne QR-adapter rond dezelfde Core-implementatie.
- `markPairingUsed(storage, pairingId)` registreert lokaal dat een succesvol afgeronde koppeling op dit apparaat is gebruikt.
- Vanaf 1.4.0: `assertPairingNotUsed(storage, pairingId, { storageKey })` controleert de replayhistorie zonder te schrijven.

### Publieke API v3 (vanaf 1.4.0, D25)

- `createFullPairingCode({ syncConfig, dataKey, context, now?, transport? })` en `openFullPairingCode({ payload, context, now?, transport? })`: vijf vaste sync-velden plus één exporteerbare AES-256-GCM-datasleutel. Geen PIN of wachtwoord. Retour bij openen: syncConfig, dataKey (CryptoKey), pairingId, issuedAt, expiresAt. Dezelfde transportlimieten als v2.
- `vault.importEnvelopeWithKey(env, key, { deviceSettings?, syncMeta? })`: alleen in lege lokale vault-opslag, valideert en ontsleutelt de payload vóór schrijven, bewaart de bestaande envelope en password wrapping. De aanroeper moet de exclusieve sessielock houden; de functie weigert ook beschadigde lokale vault-opslag. Bij v3 geeft de shell versleutelde device-settings en syncmetadata mee: de vault wordt als laatste geschreven, zodat een mislukte voorbereidende write geen gedeeltelijk geïnstalleerde kluis oplevert. Bij een write-fout worden gewijzigde hulprecords waar mogelijk hersteld; een retry blijft mogelijk zolang geen vault bestaat. Dit is geen crash-atomische multi-key transactie.
- V3 is een geheim met volledige toegang, geen versleutelde of ondertekende envelop tegen de bezitter. Base64url is codering, geen encryptie. De lokale app valideert context en tijd; manipulatie van metadata door een bezitter is niet cryptografisch uitgesloten. Een kopie kan buiten de app ook na drie minuten worden gebruikt. Geen globale replaybescherming of intrekking. Geen wachtwoord of passkey in de code.
- V3 QR-links gebruiken uitsluitend `#pair=` om overdracht naar de HTTP-server te vermijden. Geen logging of screenshots; browser/camera/clipboard kunnen de gegevens desondanks bewaren. Expliciete bronbevestiging en waarschuwing verplicht. Het bronvenster sluit na drie minuten.

### Koppel-interface (vanaf 1.4.0): `js/core/pairing-ui.js`

- `openPairOutDialog({ syncConfig, dataKey?, context, appName, appUrl?, toast?, isAuthorized? })`: toont bij dataKey v3 met bronbevestiging, QR-fragmentlink en tekstcode; zonder dataKey legacy v2 met apart pincodepaneel en querylink. Past de QR niet, dan alleen de tekstcode. De shell geeft een sessiegebonden isAuthorized-controle mee.
- `takeIncomingPairCode({ location?, history? })`: leest `#pair=` (v3) of `?pair=` (v2) uit de adresbalk, haalt hem daar weg en geeft `{ code }`, `{ invalid: true }` of `null`.
- `openPairing({ input, pin, context, storage?, storageKey? })`: accepteert een kale code of geplakte QR-link, opent v2 met PIN of v3 zonder PIN, controleert replay en geeft `{ syncConfig, pairingId, markUsed }`, bij v3 tevens `dataKey` en `expiresAt`. De app roept `markUsed()` pas aan als de kluis is opgehaald en geopend.
- `extractPairCode(input)`, `pairingLink(code, appUrl)`, `createPairing(...)`, `qrDataUrl(text)`, `pairingUsedKey(storagePrefix)` als losse bouwstenen.
- Standaard `context` is `APP.storagePrefix`; standaard replaynaam `<storagePrefix>:pairing:used`.

### Beveiligingscontract v2 en gemeenschappelijke grenzen

- PIN: 16 willekeurige tekens uit een alfabet van 31 symbolen (circa 79,3 bits), met rejection sampling.
- Sleutelafleiding: PBKDF2-SHA-256, 600.000 iteraties; encryptie/authenticatie: AES-256-GCM, 16-byte salt, 12-byte IV en 128-bit tag.
- App-context, protocolversie en geldigheidsduur van drie minuten zijn cryptografisch gebonden.
- De PIN is de enige factor van het generieke koppelprotocol. De oude optie om app-wachtwoorden of andere geheimen als extra KDF-factoren mee te geven is bewust verwijderd: zulke geheimen horen niet in het koppelproces.
- QR en handmatige code zijn alleen transportvormen; ze geven exact dezelfde beperkte synchronisatieconfiguratie door.
- De Core schrijft geen opslag en voert geen synchronisatie uit. De Core accepteert uitsluitend de vijf GitHub Sync-velden; de app valideert daarnaast hun inhoud, slaat ze op via de bestaande device-settings-route en start daarna de bestaande GitHub Sync.
- Vanaf 1.4.0 registreert de Core-shell een code pas als lokaal gebruikt nadat de kluis is opgehaald en geopend; vooraf wordt de replayhistorie fail-closed gecontroleerd. Apps met een eigen schil volgen dezelfde volgorde via `openPairing().markUsed()`. Replayregistratie is lokaal per ontvangend apparaat; zonder centrale rendezvousserver kan geen globale eenmaligheid worden gegarandeerd.
- Oude PWK1/PWK2/CPK1/CPK2/PWA-CORE-PAIR-1-codes worden geweigerd; bronapparaat moet een nieuwe code genereren. Bestaande kluizen en remote syncbestanden blijven onaangeraakt.

### Acceptatie per app

Een app is pas gemigreerd als tests aantonen dat alleen de noodzakelijke GitHub Sync-configuratie en bij v3 de geautoriseerde kluissleutel worden overgedragen, het nieuwe apparaat die configuratie veilig opslaat en de normale GitHub Sync de bestaande gegevens ophaalt. De oude cryptografische pairing-implementatie moet aantoonbaar uit app-code, tests en documentatie zijn verwijderd. App-specifieke UI en mapping mogen blijven.
