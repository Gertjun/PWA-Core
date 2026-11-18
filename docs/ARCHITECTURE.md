# PWA-Core – architectuur en distributiemodel

## Status

De eerste stabiele release v1.0.0 is opgevolgd door de actuele stabiele release **v1.1.0**, gepubliceerd via Git-tag en immutable GitHub Release. De tag verwijst naar commit `9763502c2233ca3824b6525fd5a5785fb3596c9c`; de ZIP- en SHA-256-assets zijn gepubliceerd. De release bevat 18 allowlisted bestanden. De v1.0.0-release blijft als historische eerste stabiele basis behouden.

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

## Eén gedeelde Core-functie voor GitHub Sync-apparaatkoppeling

Apparaatkoppeling is een generieke Core-functie die iedere portfolio-app kan gebruiken. De scope is bewust beperkt: de overdracht bevat alleen de minimale configuratie waarmee het nieuwe apparaat GitHub Sync kan authenticeren en de juiste syncfile kan vinden. De exacte velden worden per app gemapt en gevalideerd.

De Core bevat één cryptografische implementatie in `js/core/pair.js`; `js/core/device-pairing.js` is uitsluitend een QR-adapter. QR en handmatige kopieer/plakoverdracht gebruiken dezelfde envelop en PIN-beveiliging. De PIN bestaat uit 16 willekeurige tekens (31-symbolenalfabet, circa 79,3 bits) en wordt met rejection sampling gegenereerd. PBKDF2-SHA-256 (600.000 iteraties), AES-256-GCM, contextbinding, drie minuten geldigheid en lokale replayregistratie zijn centraal geregeld.

**De pairing-payload bevat geen applicatiegegevens.** Vaultinhoud, records, portfolio-/appdata, vaultwachtwoorden, passkeys, niet-syncgerelateerde API-sleutels en overige gebruikersinstellingen worden niet overgedragen. De Core biedt geen extra-secret/KDF-factorlijst: de koppel-PIN is de enige pairingfactor. Na het opslaan van de GitHub Sync-configuratie haalt het nieuwe apparaat de bestaande gegevens op via de normale synchronisatie.

De Core valideert en ontsleutelt de configuratie, maar schrijft geen instellingen en voert geen sync uit. De app blijft verantwoordelijk voor minimale veldmapping, validatie, veilige opslag, tokenrechten en het starten van de bestaande sync-flow. Een app mag geen eigen PIN-, KDF-, encryptie-, expiry- of replayimplementatie onderhouden.

Legacy-PWK1/PWK2/CPK1/CPK2/PWA-CORE-PAIR-1-codes worden na migratie geweigerd. Dit raakt geen bestaande vaultdata of remote syncbestanden.
