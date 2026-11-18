# PWA-portfolio – migratie- en acceptatiematrix

Laatst bijgewerkt: 18 november 2026

## Uitgangspunt

PWA-Core **v1.2.2** is de officiële, gepubliceerde en immutable gedeelde basis. De gebruiker heeft bevestigd dat een praktijktest bij een van de apps goed is verlopen en dat PWA-Core daarmee als gedeelde basis gebruikt mag worden. Dat is vrijgave van de Core-basis; het vervangt geen app-specifieke praktijktest van iedere PWA.

Vastgepinde release-identiteit:

- Tag: `v1.2.2`
- Commit: `14dc3ad12c56a448f7de47e2c4c39347475355f6`
- Manifest-SHA256: `702f8394d4ffd87072b33d6a1a6a3aa59b6124253334aef08772385037dc7616`
- Belangrijke wijziging: een aantoonbaar nieuwere hercreatie kan een oudere verwijdering opheffen; gelijke, oudere of ontbrekende tijdstempels blijven fail-closed.

## Overzicht

| App | Appversie op main | Core-pin op main | Migratiestatus | Praktische acceptatie |
|---|---:|---|---|---|
| MW4-CAMO | 1.32.0 | v1.2.1 | Upgrade naar v1.2.2 in voorbereiding op featurebranch; PR nog niet aangemaakt | QR-koppeling is via PR #6 gemerged. Scan-/koppeltest laptop ↔ iPhone nog niet bevestigd. |
| Energieverbruik | 1.45.3 | v1.2.2 | Gemigreerd; PR #8 gemerged | Geen actuele fysieke acceptatiebevestiging vastgelegd in deze matrix. |
| Games Backlog | 1.34.3 | v1.2.2 | Gemigreerd; PR #2 gemerged | Geen actuele fysieke acceptatiebevestiging vastgelegd in deze matrix. |
| Cryptotracker | 4.0.5 | v1.2.2 | Gemigreerd; PR #48 en vervolgfixes #49–#50 gemerged | Gebruiker bevestigde op 18 november: “Alles werkt!”. Officiële app-release 4.0.5 nog niet gepubliceerd. |
| Vaste Lasten | 3.8.3 | v1.2.2 | Gemigreerd; PR #22 en documentatie-PR #23 gemerged | PASS voor de beschreven iPhone Safari ↔ Windows 11 Edge-tests en S06-netwerkuitval/herstel. Volledige matrix niet afgevinkt. |

## Bewijs en afbakening

### Core-basis

PWA-Core v1.2.2 is als centrale release gepubliceerd en immutable. De gebruiker heeft de gedeelde Core-basis vrijgegeven voor gebruik nadat een praktijktest in een app goed verliep. De apps blijven afzonderlijke implementaties met eigen opslagprefixen, datamodellen, service workers, synchronisatie-adapters en acceptatierisico's.

### MW4-CAMO

- De QR-koppeling is al gemerged via PR #6; de oude projectnotities beschreven dit ten onrechte nog als alleen een featurebranch.
- De huidige main gebruikt Core v1.2.1. De upgradebranch brengt de app naar v1.2.2 en verhoogt de appversie naar 1.32.1.
- Opslagprefix `mw4-camo`, datapad `mw4-camo/vault.json` en schema 4 moeten ongewijzigd blijven.
- De praktische QR-scan- en koppeltest tussen laptop en iPhone blijft open totdat de gebruiker deze uitvoert en bevestigt.

### Energieverbruik en Games Backlog

Beide apps staan al op v1.2.2. Hun actuele documentatie wordt gecorrigeerd zodat oude teksten over een nog niet gemergede migratie niet langer als actuele status worden gelezen. Deze matrix claimt geen fysieke acceptatie die niet expliciet is bevestigd.

### Cryptotracker

De gebruiker heeft de praktijktest op 18 november als geslaagd bevestigd (“Alles werkt!”). PR #47–#50 zijn gemerged; de post-merge testworkflow, Core-validatie en Pages-deployment waren succesvol op de gecontroleerde commit. De officiële app-release 4.0.5 is een afzonderlijke, nog niet uitgevoerde stap.

### Vaste Lasten

De gebruiker heeft op 18 november op iPhone Safari en Windows 11 Edge bevestigd dat aanmaken, wijzigen en verwijderen tussen apparaten synchroniseert. Aanvullend is S06 fysiek doorlopen: offline invoer bleef “Alleen lokaal”, synchronisatie meldde “Geen verbinding met Github”, na netwerkherstel synchroniseerde de testlast naar Windows en een verwijdering kwam terug op de iPhone. Dit is PASS voor die beschreven scope, niet voor alle S01–S07-, V01–V06- of CR01–CR09-scenario's.

## Resterende acties

1. MW4-CAMO v1.2.2-upgrade afronden, inclusief pin-, manifest-, precache- en regressiecontroles.
2. De actuele CI-resultaten op de MW4-upgrade-PR beoordelen. De code-PR wordt niet gemerged zonder afzonderlijk akkoord.
3. QR-koppeling praktisch testen tussen laptop en iPhone, inclusief openen vanuit de iOS-camera en invoer van de aparte pincode.
4. App-specifieke praktijktests voor Energieverbruik en Games Backlog alleen als afzonderlijke, nog niet bevestigde acceptatie markeren; geen testresultaat afleiden uit alleen een groene CI-run.
5. Cryptotracker 4.0.5-release alleen uitvoeren na een afzonderlijke releasebeslissing.

## Veiligheidsgrenzen

- Ontwikkel- en regressietests gebruiken uitsluitend synthetische gegevens.
- Geen productiekluis, private datarepository, productietoken of bestaande gebruikersgegevens openen, wijzigen, migreren of verwijderen.
- Een merge van documentatie-PR's verandert geen appcode of productiegegevens.
- Een groene CI-run, een geslaagde Core-test en een fysieke app-test zijn verschillende bewijscategorieën en worden niet onderling uitgewisseld.
