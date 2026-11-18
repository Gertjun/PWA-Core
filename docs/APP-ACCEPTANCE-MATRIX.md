# PWA-portfolio – migratie- en acceptatiematrix

Laatst bijgewerkt: 18 november 2026

## Uitgangspunt

PWA-Core **v1.2.2** is de officiële, gepubliceerde en immutable gedeelde basis. De gebruiker heeft de Core-basis vrijgegeven nadat de gedeelde functionaliteit in praktijktests via Vaste Lasten is gecontroleerd. Dit is geen automatische volledige acceptatie van iedere app-specifieke functie.

Vastgepinde release-identiteit:

- Tag: `v1.2.2`
- Commit: `14dc3ad12c56a448f7de47e2c4c39347475355f6`
- Manifest-SHA256: `702f8394d4ffd87072b33d6a1a6a3aa59b6124253334aef08772385037dc7616`
- Belangrijke wijziging: een aantoonbaar nieuwere hercreatie kan een oudere verwijdering opheffen; gelijke, oudere of ontbrekende tijdstempels blijven fail-closed.

## Overzicht

| App | Appversie op main | Core-pin op main | Migratiestatus | Praktische acceptatie |
|---|---:|---|---|---|
| MW4-CAMO | 1.32.1 | v1.2.2 | Gemigreerd; PR #7 gemerged | QR-koppeling tussen laptop en iPhone door gebruiker bevestigd. |
| Energieverbruik | 1.45.3 | v1.2.2 | Gemigreerd; PR #8 gemerged | Geen afzonderlijke actuele fysieke app-acceptatie vastgelegd. |
| Games Backlog | 1.34.3 | v1.2.2 | Gemigreerd; PR #2 gemerged | PASS voor aanmaken, wijzigen en verwijderen met synchronisatie tussen iPhone en laptop. |
| Cryptotracker | 4.0.5 kandidaat | v1.2.2 | Gemigreerd; PR #47–#50 en documentatie-PR #51 gemerged | Gebruiker bevestigde op 18 november: “Alles werkt!”. Officiële app-release 4.0.5 nog niet gepubliceerd. |
| Vaste Lasten | 3.8.3 | v1.2.2 | Gemigreerd; PR #22 en documentatie-PR #23–#24 gemerged | PASS voor de beschreven iPhone Safari ↔ Windows 11 Edge-tests en S06-netwerkuitval/herstel. Volledige testmatrix niet afgevinkt. |

## Bewijs en afbakening

### Core-basis

PWA-Core v1.2.2 is als centrale release gepubliceerd en immutable. De gebruiker heeft de gedeelde Core-basis vrijgegeven voor gebruik. De apps blijven afzonderlijke implementaties met eigen opslagprefixen, datamodellen, service workers en synchronisatie-adapters. Daarom blijft app-specifieke acceptatie apart geregistreerd.

### MW4-CAMO

- Main gebruikt PWA-Core v1.2.2 via de gemergede PR #7; appversie is 1.32.1.
- Opslagprefix `mw4-camo`, datapad `mw4-camo/vault.json` en schema 4 zijn behouden.
- De gebruiker bevestigde op 18 november 2026 dat de QR-koppeling tussen laptop en iPhone is gelukt.

### Energieverbruik

- Main gebruikt appversie 1.45.3 en PWA-Core v1.2.2; migratie-PR #8 is gemerged.
- Er is in deze matrix geen afzonderlijke fysieke acceptatietest voor de app vastgelegd. De Core-basis is wel elders praktisch afgedekt.

### Games Backlog

- Main gebruikt appversie 1.34.3 en PWA-Core v1.2.2; migratie-PR #2 is gemerged.
- Op 18 november 2026 heeft de gebruiker de volgende praktijktest uitgevoerd tussen iPhone en laptop:
  - Een testspel aangemaakt op de iPhone; na synchronisatie verscheen het op de laptop.
  - De titel op de iPhone gewijzigd; na synchronisatie verscheen de gewijzigde titel op de laptop.
  - Het testspel op de laptop verwijderd; na synchronisatie was het op beide apparaten verdwenen.
- Dit is PASS voor de beschreven app-specifieke create/update/delete-synchronisatie. De bredere Core-tests zijn niet opnieuw volledig herhaald, omdat die al via Vaste Lasten zijn uitgevoerd.

### Cryptotracker

De gebruiker heeft de praktijktest op 18 november als geslaagd bevestigd (“Alles werkt!”). PR #47–#50 zijn gemerged; de post-merge testworkflow, Core-validatie en Pages-deployment waren succesvol op de gecontroleerde commit. De officiële app-release 4.0.5 is een afzonderlijke, nog niet uitgevoerde stap.

### Vaste Lasten

De gebruiker heeft op 18 november op iPhone Safari en Windows 11 Edge bevestigd dat aanmaken, wijzigen en verwijderen tussen apparaten synchroniseert. Aanvullend is S06 fysiek doorlopen: offline invoer bleef “Alleen lokaal”, synchronisatie meldde “Geen verbinding met Github”, na netwerkherstel synchroniseerde de testlast naar Windows en een verwijdering kwam terug op de iPhone. Dit is PASS voor die beschreven scope, niet voor alle S01–S07-, V01–V06- of CR01–CR09-scenario's. Documentatie-PR #23 en #24 zijn gemerged.

## Resterende acties

1. Een afzonderlijke fysieke acceptatietest van Energieverbruik is niet vastgelegd; dit is geen blokkade voor het gebruik van de vrijgegeven Core-basis.
2. Cryptotracker 4.0.5-release alleen uitvoeren na een afzonderlijke releasebeslissing.

## Veiligheidsgrenzen

- Ontwikkel- en regressietests gebruiken uitsluitend synthetische gegevens.
- Geen productiekluis, private datarepository, productietoken of bestaande gebruikersgegevens openen, wijzigen, migreren of verwijderen.
- Een merge van documentatie-PR's verandert geen appcode of productiegegevens.
- Een groene CI-run, een geslaagde Core-test en een fysieke app-test zijn verschillende bewijscategorieën en worden niet onderling uitgewisseld.


## Bewust geaccepteerde portfolio-architectuurkeuze: gedeelde origin

De vijf apps worden gehost onder afzonderlijke paden op `https://gertjun.github.io` en delen daarmee één browser-origin. De gebruiker heeft op 18 november 2026 expliciet besloten deze structuur te behouden.

De apps gebruiken eigen opslagprefixes en eigen service-worker-/cacheconfiguratie. Dit voorkomt normale naamconflicten en helpt cachebeheer, maar vormt **geen beveiligingsisolatie tussen apps**: scripts op één pad kunnen in beginsel origin-brede opslag van andere paden benaderen. Versleuteling van kluisinhoud beperkt de leesbaarheid, maar verandert de origin-bevoegdheden niet.

**Auditbehandeling:** dit is een bekende, beoordeelde en bewust geaccepteerde beperking, geen onbehandelde auditbevinding en geen actie om nu afzonderlijke origins in te voeren. Heropen uitsluitend bij een wezenlijke wijziging van hosting, scripts/derde partijen, gegevensclassificatie of dreigingsmodel. Zie besluit D18 en het hoofdstuk “Portfolio-hosting en origin-isolatie” in `docs/ARCHITECTURE.md`.
