# DECISIONS – PWA-Core

Oude besluiten blijven staan. Een nieuw besluit kan een eerder besluit expliciet vervangen.

### D1 – Lokale distributie, geen runtime-afhankelijkheid
- **Besluit:** iedere PWA bevat de gepinde core-bestanden lokaal op dezelfde paden. Geen runtime-import vanaf PWA-Core of CDN.
- **Reden:** offline betrouwbaarheid, reproduceerbaarheid en geen externe runtime-afhankelijkheid.

### D2 – Versie en integriteit zijn expliciet
- **Besluit:** iedere core-release gebruikt SemVer, een onveranderlijke Git-tag, een volledige commit-SHA en SHA-256-checksums voor alle allowlisted bestanden.
- **Reden:** apps moeten exact kunnen vaststellen welke code zij gebruiken en updates moeten vóór distributie verifieerbaar zijn.

### D3 – Distributie uitsluitend via afzonderlijke PR's
- **Besluit:** elke ontvangende PWA krijgt een eigen updatebranch en PR. De workflow mag nooit rechtstreeks naar app-main schrijven of automatisch mergen.
- **Reden:** iedere app moet onafhankelijk kunnen testen, beoordelen en terugrollen.

### D4 – Pilotgroep en uitzonderingen
- **Besluit:** eerste pilot: MW4-CAMO, Energieverbruik en Games Backlog. Cryptotracker en Vaste Lasten worden later afzonderlijk op architectuur beoordeeld.
- **Reden:** de eerste drie delen aantoonbaar dezelfde modulaire kernbestanden; de andere twee hebben afwijkende architecturen.

### D5 – Release pas na contract- en integratiebewijs
- **Besluit:** groene syntax-/unit-CI alleen is onvoldoende voor een stabiele release. De contracttestmatrix, manifest, service-worker-precache en pilotintegratie moeten aantoonbaar gecontroleerd zijn.
- **Reden:** core-modules werken samen met app-configuratie, app-API, service worker en offline opslag.

### D6 – Onveranderlijke release-tags via repository ruleset
- **Besluit:** vóór de eerste stabiele release wordt een actieve tag ruleset voor v* ingericht die updates en verwijderingen blokkeert. Nieuwe tagcreatie blijft toegestaan voor de gecontroleerde handmatige releaseworkflow.
- **Historische status:** de ruleset was bij het vastleggen van dit besluit nog niet ingesteld; de actuele configuratie is vastgelegd in D13.
- **Reden:** gepubliceerde SemVer-tags zijn distributie-ankers en mogen nooit achteraf worden verplaatst of verwijderd. Repository-instellingen worden pas na expliciete toestemming aangepast.

### D7 – Echte WebAuthn PRF-platformtests zijn een afzonderlijke releasepoort
- **Besluit:** Node-contracttests met mocks en echte browser-/authenticatorpraktijktests worden afzonderlijk gerapporteerd. Een groene CI-run vervangt geen test op iOS/iPadOS, Windows of andere ondersteunde platformen.
- **Reden:** PRF-capability hangt af van de browser én de gekozen authenticator; wachtwoordterugval moet ook bij ontbrekende PRF aantoonbaar blijven werken.

### D8 – App-specifieke release-pin buiten het core-manifest
- **Besluit:** iedere ontvangende app bewaart `pwa-core.lock.json` met repository, stabiele SemVer-versie, `vX.Y.Z`-tag, volledige 40-teken releasecommit-SHA en SHA-256 van de exacte bytes van `core-manifest.json`.
- **Besluit:** de lokale validator controleert lockbestand, manifest en alle lokale core-bestanden offline. De migratie-/distributie-PR verifieert daarnaast via GitHub/Git dat de onveranderlijke tag naar exact de vastgelegde commit verwijst.
- **Reden:** het core-manifest kan zijn eigen uiteindelijke commit-SHA niet bevatten zonder een zelfreferentiële commit; de afzonderlijke app-pin legt de release-identiteit reproduceerbaar vast zonder runtime-netwerkafhankelijkheid.
### D9 – WebAuthn PRF-capability is adviserend; authenticatorresultaat is beslissend
- **Besluit:** `PublicKeyCredential.getClientCapabilities()` mag de passkey-optie vroegtijdig verbergen wanneer `extension:prf` expliciet `false` is. Een ontbrekende capability of detectiefout wordt als onbekend behandeld.
- **Besluit:** een passkey wordt pas als bruikbaar opgeslagen/gebruikt nadat de concrete registratie-/assertionrespons het vereiste `prf.results.first` bevat; `prf.enabled === false` bij registratie is een harde afwijzing. Wachtwoordontgrendeling blijft altijd beschikbaar.
- **Reden:** browserondersteuning en authenticatorondersteuning zijn verschillende lagen; platformcompatibiliteit kan niet betrouwbaar uit alleen feature-detectie worden afgeleid.
### D10 – Release wordt gebouwd vanaf exact de dispatchcommit
- **Besluit:** de handmatige releaseworkflow checkt `github.sha` uit en controleert dat `HEAD` exact gelijk is aan die SHA; de ZIP en de release-tag verwijzen dus naar dezelfde commit.
- **Besluit:** officiële stabiele releases accepteren uitsluitend SemVer `X.Y.Z`; CI- en release-actions worden op vaste commit-SHA's gepind.
- **Reden:** voorkomt dat een verschoven `main` tijdens een lopende workflow een ander archief oplevert dan de commit waarnaar de releasetag verwijst; voorkomt bewegende action-versies.
### D11 – Valideer de vaste PRF-uitvoerlengte
- **Besluit:** WebAuthn PRF-uitvoer wordt uitsluitend geaccepteerd als de buffer exact 32 bytes lang is; controle vindt plaats vóór HKDF, opslag of ontgrendeling.
- **Reden:** de WebAuthn PRF-specificatie definieert PRF-uitvoer als exact 32 bytes. Onverwachte buffers worden veilig geweigerd in plaats van stilzwijgend als sleutelbron te worden gebruikt.
### D12 – Scheid core-release en pilot-adoptie
- **Besluit:** de eerste stabiele PWA-Core-release is een onveranderlijk, lokaal distribueerbaar artefact en mag pas worden gepubliceerd nadat de core-contracttests, manifest-/checksumvalidatie, releaseworkflow en echte WebAuthn-platformacceptatie zijn afgerond. De drie pilot-apps worden niet vóór deze release aangepast.
- **Besluit:** de integratieacceptatie van MW4-CAMO, Energieverbruik en Games Backlog vindt ná publicatie plaats, elk via een afzonderlijke feature branch en PR. Een pilot-PR moet de concrete app-contracten, lokale bestanden, lock-pin, tag-naar-commitrelatie, service-worker-precache, CI en relevante offline-/runtimewerking aantonen. Een app-PR die faalt wordt niet gemerged; de stabiele core-release blijft onveranderd.
- **Vervangt voor de releasevolgorde de formulering in D5 dat pilotintegratie vóór publicatie van de core-release vereist is.** D5 blijft gelden voor contract- en regressiebewijs; app-integratie is een gate voor adoptie door die app, niet voor het aanmaken van het ongebruikte release-artefact.
- **Reden:** de afgesproken fasering vereist eerst een onveranderlijke core-release en daarna afzonderlijke, controleerbare pilotmigraties. De release zelf wijzigt geen productie-app.

### D13 – Actieve GitHub-rulesets en mergebevoegdheid
- **Feitelijke status:** de branch-ruleset `Protect main branch` is actief op `refs/heads/main`. Pull requests en de vereiste statuscheck `test` zijn verplicht; branches moeten up-to-date zijn. Vereiste approvals: 0, passend bij één ontwikkelaar/reviewer. Verwijderen en non-fast-forward zijn geblokkeerd; bypasslijst is leeg.
- **Feitelijke status:** de tag-ruleset `Protect published PWA-Core versions` is actief op `v*` en blokkeert updates en verwijderingen. De bypasslijst is leeg.
- **Werkafspraak:** PR's worden voorbereid en gecontroleerd, maar iedere merge vereist vooraf expliciet akkoord van de gebruiker.
- **Reden:** documenteer de werkelijk toegepaste repositorybeveiliging en leg de expliciete mergebevoegdheid eenduidig vast.


### D14 – Scheid tagbescherming en GitHub Release-immutability
- **Feitelijke status:** de actieve repository-ruleset `Protect published PWA-Core versions` target `refs/tags/v*` en blokkeert tag-updates en -verwijderingen. De GitHub Release API rapporteert voor v1.0.0 `immutable: false`.
- **Besluit voor toekomstig publicatieproces:** behandel immutable GitHub Releases als aanvullende bescherming naast de bestaande tag-ruleset. Controleer eerst de repository-instelling en verifieer vóór de volgende stabiele publicatie dat de instelling actief is en de workflow daardoor een immutable release oplevert.
- **Bestaande release:** v1.0.0, de tag en beide assets blijven ongewijzigd zolang de gevolgen en ondersteunde herstel-/conversiemogelijkheden voor een bestaande release niet aantoonbaar zijn vastgesteld.
- **Reden:** tagbescherming beveiligt de Git-ref, maar bewijst niet dat de release-assets onveranderlijk zijn. Beide beveiligingslagen moeten afzonderlijk worden gecontroleerd.


### D15 – Cryptotracker-opslagcontract en exclusieve schrijfsessie
- **Besluit:** PWA-Core gebruikt voor iedere app-opslagprefix één exclusieve Web Lock die gedurende de volledige ontgrendelde sessie wordt vastgehouden. Een tabblad moet deze lock verkrijgen vóórdat het een kluis ontgrendelt, aanmaakt of importeert. Andere tabbladen blijven vergrendeld zolang de lock bezet is.
- **Besluit:** ontbreekt `navigator.locks` of kan de lock niet worden verkregen, dan blijft de sessie vergrendeld en worden geen schrijfoperaties toegestaan. Geen localStorage-lease, BroadcastChannel of storage-event geldt als mutex; geen geforceerde lock-overname.
- **Besluit:** vergrendelen schermt de gevoelige UI direct af en wacht daarna op bevestigde lokale opslag. De sleutel wordt uitsluitend gewist nadat de flush is geslaagd. Bij een opslagfout blijft de UI afgeschermd, wordt de fout expliciet getoond en kan de gebruiker een gecontroleerde retry uitvoeren; geen onbeperkte automatische retry.
- **Besluit:** `ctx.update()` resolve't pas na succesvolle lokale persist en reject't bij mutator-, encryptie- of opslagfouten. Flush bevestigt een concreet revisienummer; een hogere volledig opgeslagen snapshot mag eerdere mislukte revisies inhalen.
- **Besluit:** app-data en portfolio-afleidbare cache (`prices`, `chartCache`) blijven versleuteld. Alleen gescheiden algemene `fng`- en `fx`-cache zijn kandidaat voor plaintext. Device-settings blijven versleuteld en worden niet gesynchroniseerd.
- **Besluit:** legacy-opslag (`cpt.*`), inclusief `cpt.vault` en `cpt.lock`, wordt tijdens deze migratie niet verwijderd of overschreven. Opruiming vereist eerst geverifieerde import/herstel en afzonderlijk expliciet akkoord.
- **Toestemming:** gebruiker heeft op 12 november 2026 de architectuurrichting goedgekeurd na merge van PR #38. Implementatie op een eigen featurebranch is toegestaan. PR-merge, nieuwe stabiele Core-release, Cryptotracker-releasepin en legacy-opruiming blijven afzonderlijke gates waarvoor opnieuw expliciet akkoord nodig is.
- **Reden:** voorkomen van lost updates tussen tabs, foutieve opslagbevestiging en onbedoelde blootstelling van portfolio-informatie of legacygegevens.


### D16 – Niet-meewerkende of oudere tabbladen tijdens Core-uitrol
- **Besluit:** Web Locks coördineert uitsluitend tabbladen die het nieuwe Core-lockprotocol uitvoeren. Vóór ingebruikname van deze Core-fix moeten alle reeds geopende oudere app-tabbladen worden gesloten of ververst.
- **Besluit:** als een ontgrendelde sessie toch een externe wijziging van de vault, device-settings of een volledige localStorage-clear ontvangt, wordt de UI afgeschermd. De Core voert geen automatische reload, merge of overwrite uit; de actuele lokale geheugenstand en, indien aanwezig, de externe versleutelde opslagwaarde worden als herstelkopieën aangeboden. De sessielock blijft vastgehouden tot de gebruiker de herstelkopieën heeft aangevraagd.
- **Reden:** oudere versies nemen niet deel aan Web Locks en kunnen daarom niet door de nieuwe mutex worden tegengehouden. Stilzwijgend herladen of terugschrijven kan anders één van beide gegevensstanden verliezen.


### D17 – Meerdere onafhankelijke kluizen per app-runtime
- **Besluit:** PWA-Core ondersteunt meerdere onafhankelijke vault-instanties binnen één app-runtime via een factory-API. Iedere instantie heeft een unieke, vaste storage-prefix en eigen datasleutel, envelope, revisies/schrijfwachtrij, device-ID, device-settings, syncstatus en lifecycle.
- **Besluit:** sync, Web Lock-sessie en WebAuthn PRF/HKDF-configuratie worden eveneens per vault-instantie geïsoleerd. Een operatie, fout, reset of lock op één prefix mag geen andere prefix beïnvloeden.
- **Backwards compatibility:** de bestaande module-exports blijven als facade beschikbaar voor één standaardinstantie op basis van `APP.storagePrefix` en `APP.kdfIterations`. De nieuwe factory-API is aanvullend.
- **Veiligheidsgrens:** meerdere vaults vormen geen cross-vault transactie. Gedeelde en persoonlijke writes kunnen afzonderlijk slagen of falen; de app moet gedeeltelijke bevestiging expliciet behandelen.
- **Migratiegrens:** bestaande envelopes en prefixes blijven ongewijzigd. App-specifieke migratie, import, remote padmapping en opruiming gebeuren uitsluitend in een afzonderlijke app-PR na tests; geen productiegegevens of bestaande datarepositories benaderen in de Core-PR.
- **Toestemming:** gebruiker heeft op 14 november 2026 ingestemd met de multi-vault-richting. Implementatie op een eigen featurebranch is toegestaan. Merge, nieuwe stabiele Core-release, app-releasepins en productie-/legacydata-migraties blijven afzonderlijke goedkeuringsmomenten.
- **Reden:** Vaste Lasten heeft gescheiden wachtwoord-/gegevensdomeinen voor gezamenlijke en persoonlijke gegevens. Een singleton per app kan deze grenzen niet correct modelleren; afzonderlijke factory-instanties kunnen dat zonder de bestaande modulaire apps te dwingen direct te migreren.

### D18 – Generieke cryptografische bouwstenen voor apparaatkoppeling
- **Besluit:** PWA-Core biedt een generieke module voor het versleutelen en ontsleutelen van tijdelijke apparaatkoppel-payloads. De module ontvangt app-data als opaque JSON-object, een geordende lijst van 1–8 geheimen en een vaste app-context. De bestaande app blijft eigenaar van QR-UI/scanner, payloadschema, validatie, rol-/kluiskeuze en het toepassen via de bestaande vault-/sync-routes.
- **Beveiliging:** PBKDF2-SHA-256 met 600.000 iteraties en lengte-gecodeerde, NFC-genormaliseerde geheimen; AES-256-GCM met 16-byte salt, 12-byte IV en 128-bit tag; context en tijdstempels zijn authenticated additional data. De code verloopt na drie minuten.
- **Replaygrens:** de Core ondersteunt lokale replayregistratie per ontvangend apparaat en weigert beschadigde replayhistorie fail-closed. Zonder centrale online rendezvous kan de Core geen globale eenmaligheid garanderen; dit wordt expliciet gecommuniceerd en mag niet als globale one-time code worden gepresenteerd.
- **Geen automatische mutatie:** de Core wijzigt geen kluis, token, GitHub-repository of app-opslag. De app markeert de pairing-ID pas na volledig geslaagde koppeling. Bestaande data blijft beschermd door de bestaande fail-closed app-routes.
- **Compatibiliteit:** de module is aanvullend; bestaande API's, kluis-enveloppen, opslagprefixen en gepubliceerde releases blijven ongewijzigd. De nieuwe module wordt pas onderdeel van een volgende release-allowlist na review, tests en expliciete releasegoedkeuring.
- **Toestemming:** gebruiker heeft op 17 november 2026 toestemming gegeven om deze Core-uitbreiding op een aparte featurebranch te onderzoeken en voor te bereiden. Merge, release en app-migraties vereisen afzonderlijke expliciete goedkeuring.
- **Reden:** beveiligde apparaatkoppeling is een herbruikbaar platformmechanisme, terwijl de betekenis en toepassing van de overgedragen instellingen per app verschilt.


### D19 – Compacte en functienamespaced WebAuthn userHandles
- **Besluit:** alle nieuwe WebAuthn `user.id`-waarden blijven maximaal 64 bytes en bevatten geen volledige `storagePrefix`. De Core gebruikt een compacte, deterministische SHA-256-afgeleide tag op basis van app-prefix en expliciete funct-scope, plus willekeurige bytes.
- **Besluit:** iedere afzonderlijke passkeyfunctie gebruikt een eigen scope. Daardoor zijn bijvoorbeeld vault-ontgrendeling en een app-eigen bundle-ontgrendeling niet onderling uitwisselbaar bij herkenning van bestaande credentials.
- **Compatibiliteit:** oude gestructureerde `storagePrefix:`-handles blijven voor de bijbehorende app herkenbaar; app-specifieke eerdere compacte formaten mogen alleen via expliciete legacy-tags worden geaccepteerd. Niet-gestructureerde legacy-handles blijven koppelbaar.
- **Beveiligingsgrens:** PRF-labels, HKDF-contexten, credential-ID's, opgeslagen wrapped keys, vault-enveloppen en data-opslag worden niet gewijzigd. De userHandle dient uitsluitend voor namespaceherkenning en wordt niet gebruikt als sleutelbron.
- **Toestemming:** gebruiker heeft op 17 november 2026 toestemming gegeven om de Core-fix voor te bereiden en te testen. Merge, stabiele Core-release en afzonderlijke app-integraties vereisen afzonderlijke expliciete goedkeuring.
- **Reden:** WebAuthn schrijft een maximum van 64 bytes voor `user.id`. Lange workspace-/storage-prefixes mogen daarom niet tot mislukte registratie leiden; functienamespacing voorkomt verwarring tussen meerdere passkeydoelen binnen één app.


### D18 – Bewust geaccepteerde gedeelde GitHub Pages-origin voor het huidige portfolio
- **Feitelijke situatie:** de vijf portfolio-apps (MW4-CAMO, Energieverbruik, Games Backlog, Cryptotracker en Vaste Lasten) worden gepubliceerd onder verschillende URL-paden op dezelfde GitHub Pages-origin: `https://gertjun.github.io`.
- **Besluit:** deze hostingstructuur blijft voor het huidige portfolio bewust behouden. Er wordt geen afzonderlijke origin per app ingevoerd als onderdeel van deze audit.
- **Beveiligingsnuance:** verschillende URL-paden en unieke localStorage-prefixes voorkomen normale naamconflicten, maar vormen geen browserbeveiligingsgrens. JavaScript dat op één pad binnen deze origin draait, deelt dezelfde origin-bevoegdheden en kan in beginsel origin-brede opslag van andere apps benaderen. Dit geldt onder meer voor localStorage en IndexedDB. Versleuteling van kluisinhoud beperkt de leesbaarheid van gegevens, maar maakt de apps niet onderling geïsoleerd.
- **Overige isolatie:** eigen opslagprefixes en app-specifieke service-worker-cacheprefixes zijn nuttige scheiding voor normaal functioneren en cachebeheer, maar mogen niet worden beschreven als harde beveiligingsisolatie.
- **Acceptatie:** dit risico is beoordeeld en bewust geaccepteerd voor de huidige portfolio-opzet. Een toekomstige audit moet het als bekende, geaccepteerde architectuurkeuze registreren en niet opnieuw als onbehandelde bevinding opvoeren, tenzij de scope, dreigingsanalyse of hostingstructuur wezenlijk verandert.
- **Herbeoordeling:** heropen dit besluit bij verhuizing naar andere origins, toevoeging van niet-vertrouwde scripts/derde partijen, een concreet origin-gerelateerd incident of een wijziging in de gegevensclassificatie. Een eventuele origin-migratie vereist een afzonderlijk plan voor bestaande browseropslag, geïnstalleerde PWA's, service workers en passkey-/apparaatconfiguratie.
- **Reden:** behoud van de bestaande eenvoudige hosting en expliciete vastlegging van de werkelijke browserbeveiligingsgrens, zodat opslagprefixes niet ten onrechte als isolatiemaatregel worden beschouwd.


### D20 – Eén Core-functie voor beperkte GitHub Sync-apparaatkoppeling
- **Besluit:** alle apps gebruiken één gedeelde cryptografische implementatie in `js/core/pair.js`; `js/core/device-pairing.js` is uitsluitend een dunne QR-adapter. Geen app mag eigen PIN-, KDF-, encryptie-, expiry- of replaylogica onderhouden.
- **Doel en scope:** de overdracht bevat uitsluitend de minimale configuratie die nodig is om GitHub Sync op het nieuwe apparaat in te stellen (bijvoorbeeld repository-eigenaar, repository, branch, bestandspad en GitHub-token). De Core behandelt de configuratie als opaque JSON; de app bepaalt en valideert de noodzakelijke velden.
- **Uitgesloten:** geen vaultinhoud, records, portfolio-/appdata, vaultwachtwoorden, passkeys, niet-syncgerelateerde API-sleutels of overige gebruikersinstellingen. Na koppeling haalt het nieuwe apparaat de bestaande applicatiegegevens op via de bestaande GitHub Sync-route. Pairing is geen datamigratie.
- **Beveiliging:** één verplichte PIN van 16 willekeurige tekens (circa 79,3 bits) met rejection sampling; PBKDF2-SHA-256 (600.000 iteraties), AES-256-GCM, contextbinding, vaste geldigheid van drie minuten en lokale replayregistratie. QR en handmatige code gebruiken dezelfde versleutelde envelop. De eerdere optionele lijst aanvullende geheimen is verwijderd; vaultwachtwoorden worden niet als pairingfactor gebruikt.
- **Compatibiliteit:** PWK1, PWK2, CPK1, CPK2 en PWA-CORE-PAIR-1 worden niet geaccepteerd. Een nieuwe code moet op het bronapparaat worden aangemaakt. Bestaande vaultdata en remote syncbestanden blijven onaangeraakt.
- **App-specifieke beveiliging:** de Core biedt één gedeelde basis. Iedere app moet aantonen dat uitsluitend de minimale GitHub Sync-configuratie wordt overgedragen, dat tokenrechten passend zijn en dat de ontvangen configuratie veilig wordt opgeslagen. Een afwijkende beveiligingsmaatregel mag alleen aanvullend op de Core-basis worden toegepast; geen eigen cryptografische variant.
- **Acceptatie:** een appmigratie is pas klaar als Core-koppeling werkt, de nieuwe app GitHub Sync uitvoert en daarmee de bestaande data ophaalt, én de oude dubbele implementatie aantoonbaar uit app-code, tests en documentatie is verwijderd.
- **Toestemming:** gebruiker heeft op 18 november 2026 opdracht gegeven de beperkte generieke Core-opzet te herzien en per app eventuele aanvullende beveiligingsbehoeften te signaleren. Alleen implementatie op een eigen featurebranch en PR is toegestaan; merge, release, appmigratie-merge en productieacties vereisen afzonderlijk akkoord.
- **Reden:** apparaatkoppeling is een gedeelde platformfunctie, maar moet uitsluitend de sync-toegang overdragen en mag geen tweede gegevensmigratiepad worden.
