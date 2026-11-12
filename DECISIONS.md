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
