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