# PWA-portfolio – migratie- en acceptatiematrix

Laatst bijgewerkt: 22 november 2026

## Uitgangspunt

Alle vijf portfolio-apps pinnen momenteel PWA-Core **v1.3.0**. De tag is aanwezig; GitHub Release-assets en immutability zijn in deze audit niet onafhankelijk geverifieerd. De gebruiker heeft de gedeelde Core-basis vrijgegeven, maar dit is geen automatische volledige acceptatie van iedere app-specifieke functie.

Vastgepinde release-identiteit:

- Tag: `v1.3.0`
- Source commit: `fd47638355d975d85dfc376b07810b4b0e4b2a63`
- Manifest-SHA256: `141e78258aaa54dce8778f7b0c2344ca2375a41568bbbfd4a6138551432abac3`
- Belangrijke wijziging: gedeelde pairing op PWA-CORE-PAIR-2, met 16-teken-PIN, contextbinding, expiratie en lokale replayregistratie.

`main` bevat post-tag fixes die als v1.3.1 unreleased worden bijgehouden; die veranderen de bestaande v1.3.0-pins niet.

## Overzicht

| App | Appversie op main | Core-pin op main | Migratiestatus | Praktische acceptatie |
|---|---:|---|---|---|
| MW4-CAMO | 1.33.1 | v1.3.0 | Gemigreerd; QR-adapter bijgewerkt in PR #11 | QR-koppeling tussen laptop en iPhone op 18 november bevestigd; de nieuwe gescheiden code/PIN-weergave uit PR #11 nog niet fysiek hertest. |
| Energieverbruik | 1.45.5 | v1.3.0 | Gemigreerd; beveiligings-/releasecorrectie PR #12 gemerged | Geen afzonderlijke actuele fysieke app-acceptatie vastgelegd. |
| Games Backlog | 1.34.4 | v1.3.0 | Gemigreerd; pairing bijgewerkt in PR #5; acceptatiedocumentatie PR #4 | PASS voor create/update/delete tussen iPhone en laptop op 18 november; de latere pairing-update is niet afzonderlijk fysiek getest. |
| Cryptotracker | 4.0.6 | v1.3.0 | Gemigreerd; securityfix PR #57 en cachebehoudfix PR #58 gemerged | Gebruiker bevestigde op 18 november dat 4.0.5 werkte; 4.0.6 en de nieuwe backup-importbeveiliging zijn nog niet afzonderlijk fysiek geaccepteerd. PR #58 behoudt `cpt:charts` bij legacy-opruiming en is met regressietests gevalideerd. Officiële app-release niet bevestigd. |
| Vaste Lasten | 3.8.5 | v1.3.0 | Gemigreerd; pairing bijgewerkt in PR #28 en QR-code/PIN-weergave in PR #31 | PASS voor eerder beschreven iPhone Safari ↔ Windows 11 Edge-tests en S06; PR #31 is nog niet fysiek hertest. Volledige testmatrix niet afgevinkt. |

### Schil (kopbalk en navigatie) uit Core (D23)

| App | `css/base.css` geladen | `js/core/nav.js` tekent de navigatie | Stand |
|---|---|---|---|
| MW4-CAMO | Ja | Ja (via `shell.js`) | Schil uit Core. |
| Energieverbruik | Ja | Ja (via `shell.js`) | Schil uit Core. |
| Games Backlog | Ja | Ja (via `shell.js`) | Schil uit Core. |
| Cryptotracker | Ja, als laag `core` (vanaf 4.3.0, PR #78 in Cryptotracker) | Ja (`createNav()` in `js/bootstrap.js`) | Tot en met 4.2.0 nagemaakt; PR #78 wacht op akkoord. Nog niet op echte apparaten bekeken. |
| Vaste Lasten | Nee (eigen opmaak en lettertypes) | Nee | Wijkt af; zie ROADMAP #7. |

## Bewijs en afbakening

### Core-basis

Alle vijf lockfiles pinnen v1.3.0. De tag is aanwezig en de manifest-SHA in de lockfiles is gecontroleerd; GitHub Release-assets en immutability zijn niet onafhankelijk bevestigd. De gebruiker heeft de gedeelde Core-basis vrijgegeven voor gebruik. De apps blijven afzonderlijke implementaties met eigen opslagprefixen, datamodellen, service workers en synchronisatie-adapters. Daarom blijft app-specifieke acceptatie apart geregistreerd.

### MW4-CAMO

- Main gebruikt PWA-Core v1.3.0; appversie is 1.33.1. PR #11 scheidt de QR-koppelcode van de PIN-weergave. De eerdere fysieke QR-test tussen laptop en iPhone is bevestigd, maar de UI-wijziging uit PR #11 moet nog op een apparaat worden gecontroleerd.
- Opslagprefix `mw4-camo`, datapad `mw4-camo/vault.json` en schema 4 zijn behouden.
- De gebruiker bevestigde op 18 november 2026 dat de QR-koppeling tussen laptop en iPhone is gelukt.

### Energieverbruik

- Main gebruikt appversie 1.45.5 en PWA-Core v1.3.0; migratie en apparaatkoppeling zijn gemerged; PR #12 bevat de beveiligingsfix en versie-/service-worker-bump.
- Er is in deze matrix geen afzonderlijke fysieke acceptatietest voor de app vastgelegd. De Core-basis is wel elders praktisch afgedekt.

### Games Backlog

- Main gebruikt appversie 1.34.4 en PWA-Core v1.3.0; de pairing-update is gemerged via PR #5. De beschreven fysieke create/update/delete-test is uitgevoerd op 18 november, vóór die pairing-update.
- Op 18 november 2026 heeft de gebruiker de volgende praktijktest uitgevoerd tussen iPhone en laptop:
  - Een testspel aangemaakt op de iPhone; na synchronisatie verscheen het op de laptop.
  - De titel op de iPhone gewijzigd; na synchronisatie verscheen de gewijzigde titel op de laptop.
  - Het testspel op de laptop verwijderd; na synchronisatie was het op beide apparaten verdwenen.
- Dit is PASS voor de beschreven app-specifieke create/update/delete-synchronisatie. De bredere Core-tests zijn niet opnieuw volledig herhaald, omdat die al via Vaste Lasten zijn uitgevoerd.

### Cryptotracker

Main gebruikt Cryptotracker 4.0.6 en PWA-Core v1.3.0. PR #57 voegde strengere validatie van back-uptransactietypen en datums toe; PR #58 behoudt `cpt:charts` tijdens legacy-opruiming conform besluit D59. Beide PR's zijn op 19 november gemerged. PR #58 bevat een regressietest die controleert dat de Core-grafiekcache behouden blijft. De gebruiker bevestigde op 18 november dat 4.0.5 functioneel was (“Alles werkt!”); 4.0.6 en de PR #57-beveiligingsfix zijn nog niet afzonderlijk fysiek geaccepteerd. Een officiële app-release is niet bevestigd.

### Vaste Lasten

De gebruiker heeft op 18 november op iPhone Safari en Windows 11 Edge bevestigd dat aanmaken, wijzigen en verwijderen tussen apparaten synchroniseert; main is 3.8.5 en pin v1.3.0. PR #31 scheidt de QR-koppelcode van de PIN-weergave; die UI-wijziging is nog niet afzonderlijk fysiek geaccepteerd. Aanvullend is S06 fysiek doorlopen: offline invoer bleef “Alleen lokaal”, synchronisatie meldde “Geen verbinding met Github”, na netwerkherstel synchroniseerde de testlast naar Windows en een verwijdering kwam terug op de iPhone. Dit is PASS voor die beschreven scope, niet voor alle S01–S07-, V01–V06- of CR01–CR09-scenario's. Documentatie-PR #23 en #24 zijn gemerged.

## Resterende acties

1. Een afzonderlijke fysieke acceptatietest van Energieverbruik is niet vastgelegd; dit is geen blokkade voor het gebruik van de vrijgegeven Core-basis.
2. Cryptotracker 4.0.6-release alleen uitvoeren na een afzonderlijke releasebeslissing en acceptatie van de huidige main-versie.

## Veiligheidsgrenzen

- Ontwikkel- en regressietests gebruiken uitsluitend synthetische gegevens.
- Geen productiekluis, private datarepository, productietoken of bestaande gebruikersgegevens openen, wijzigen, migreren of verwijderen.
- Een merge van documentatie-PR's verandert geen appcode of productiegegevens.
- Een groene CI-run, een geslaagde Core-test en een fysieke app-test zijn verschillende bewijscategorieën en worden niet onderling uitgewisseld.


## Bewust geaccepteerde portfolio-architectuurkeuze: gedeelde origin

De vijf apps worden gehost onder afzonderlijke paden op `https://gertjun.github.io` en delen daarmee één browser-origin. De gebruiker heeft op 18 november 2026 expliciet besloten deze structuur te behouden.

De apps gebruiken eigen opslagprefixes en eigen service-worker-/cacheconfiguratie. Dit voorkomt normale naamconflicten en helpt cachebeheer, maar vormt **geen beveiligingsisolatie tussen apps**: scripts op één pad kunnen in beginsel origin-brede opslag van andere paden benaderen. Versleuteling van kluisinhoud beperkt de leesbaarheid, maar verandert de origin-bevoegdheden niet.

**Auditbehandeling:** dit is een bekende, beoordeelde en bewust geaccepteerde beperking, geen onbehandelde auditbevinding en geen actie om nu afzonderlijke origins in te voeren. Heropen uitsluitend bij een wezenlijke wijziging van hosting, scripts/derde partijen, gegevensclassificatie of dreigingsmodel. Zie besluit D18 en het hoofdstuk “Portfolio-hosting en origin-isolatie” in `docs/ARCHITECTURE.md`.
