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
- **Reden:** gepubliceerde SemVer-tags zijn distributie-ankers en mogen nooit achteraf worden verplaatst of verwijderd. De ruleset is nog niet ingesteld; repository-instellingen worden pas na expliciete toestemming aangepast.

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
