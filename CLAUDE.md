# CLAUDE.md – PWA-Core werkafspraken

Deze repository beheert uitsluitend generieke, gedeelde PWA-kernbestanden. De actuele projectafspraken en besluiten in deze repository zijn leidend.

## Begin van iedere sessie
1. Controleer de actuele `main`, branches, openstaande PR's, commits en CI-runs.
2. Lees dit bestand, `NOTES.md`, `DECISIONS.md`, de recente `CHANGELOG.md`, `README.md` en relevante documenten onder `docs/`.
3. Controleer welke PWA's de gewijzigde modules gebruiken en of de wijziging hun publieke contract raakt.
4. Behandel de gepubliceerde PWA-Core `v1.0.0` als de eerste stabiele distributiebasis; gebruik `PWA-Template 1.5.0` uitsluitend als historische bronbasis voor de oorspronkelijke extractie.
5. Benader nooit app-datarepositories, kluisbestanden, persoonlijke tokens of productiegegevens.

## Tijdens het werk
- Communiceer in het Nederlands en leg technische keuzes kort en feitelijk uit.
- Werk uitsluitend via feature-/fix-branches en PR's. Push nooit rechtstreeks naar `main`.
- Open PR's en bereid wijzigingen zelfstandig voor, maar merge nooit zonder expliciet akkoord van de gebruiker voor die specifieke merge. Dit geldt ook wanneer diff, backwards compatibility, relevante tests en CI volledig groen zijn.
- Productie-apps en repository-instellingen vallen buiten deze mergebevoegdheid: wijzig die niet zonder de daarvoor vereiste expliciete toestemming.
- Houd backwards compatibility aan. Een wijziging aan een publiek contract die bestaande apps breekt, vereist een MAJOR-versie en migratieplan.
- Geen runtime-CDN, remote ES-module imports, npm-package of verplichte build-stap in de PWA-runtime.
- Apps nemen core-bestanden lokaal op dezelfde paden op en pinnen zowel een SemVer-versie als een volledige commit-SHA.
- Wijzig geen app-repository in dezelfde PR als PWA-Core. Elke pilotapp krijgt een afzonderlijke distributie-PR.
- Een distributie-update mag uitsluitend allowlisted bestanden kopiëren. Controleer manifest, SHA-256, precache en app-specifieke bestanden vóór een PR wordt geopend.
- Gebruik geen persoonlijke PAT. Automatisering in de ontvangende app gebruikt alleen minimaal benodigde GitHub Actions-permissies.
- Pin externe GitHub Actions op vaste commit-SHA's voordat distributie in productie wordt gebruikt.
- Tests met synthetische gegevens zijn toegestaan. Deel geen echte kluisdata of geheimen in tests, logs of PR's.
- Een groene CI bewijst niet dat browser-, offline-, passkey- of multi-devicegedrag werkt. Benoem niet-uitgevoerde praktijktests expliciet.
- Volg SemVer: MAJOR voor incompatibele contractwijzigingen, MINOR voor backwards-compatible functionaliteit, PATCH voor backwards-compatible fixes.
- Wijzig gepubliceerde release-tags nooit achteraf. Behandel release-assets en gepubliceerde GitHub Releases eveneens als distributie-artefacten: wijzig of verwijder ze niet zonder voorafgaande expliciete toestemming en een afzonderlijke risicoanalyse.
- Gebruik voor toekomstige stabiele GitHub Releases immutable-releasebescherming zodra de repository-instelling is gecontroleerd en ingeschakeld; verwar deze bescherming niet met de afzonderlijke `v*`-tag-ruleset. Bestaande releases worden niet stilzwijgend aangepast.

## Einde van iedere sessie
1. Controleer diff, branch, PR, laatste commit en bijbehorende CI-run.
2. Werk `NOTES.md` bij met datum, stand, tests, open punten en sessielog (nieuwste bovenaan).
3. Voeg relevante nieuwe besluiten toe aan `DECISIONS.md`; herschrijf historische besluiten niet.
4. Werk `CHANGELOG.md` bij voor wijzigingen aan core-code of distributiecontracten.
5. Werk de PR-beschrijving bij met scope, testresultaten, risico's en resterende handmatige controles.
6. Rapporteer de PR-link, mergebeslissing en onderbouwing. Vraag expliciet akkoord voordat je mergeert; groene CI of een geslaagde review vervangt dat akkoord niet.

## Scopegrenzen
PWA-Core bevat alleen generieke modules en basis-CSS. App-schermen, configuratie, datamodellen, `app.js`, `config.js`, `index.html`, manifest, iconen en de volledige service worker blijven eigendom van iedere app. De service worker krijgt per app een eigen precache-update via de afzonderlijke distributie-PR.
