# PWA-Core – ontwerp opslaggaranties en schrijfwachtrij

Status: **VOORSTEL – niet goedgekeurd voor runtime-implementatie**  
Datum: 12 november 2026  
Basis: PWA-Core `main` op `355c33471dd28dee1b7cb8b1d69c40f0244138dd`; stabiele release `v1.0.0` blijft gepind op `1a9c31f489290853fdc3aa4e62f199b21a338030`.

## 1. Doel en afbakening

Dit ontwerp beschrijft de Core-contractverbeteringen die nodig zijn voordat Cryptotracker veilig een synchrone legacy-opslaginterface kan laten samenwerken met de asynchrone versleutelde Core-kluis.

Dit document is een technisch voorstel. Het wijzigt geen bestaand runtimecontract, opslagprefix, sleutel, dataschema, release of productiegegeven. De voorgestelde API's hieronder bestaan nog niet tenzij expliciet als bestaand aangeduid.

Doelen:

- iedere kritieke wijziging krijgt een controleerbare revisie;
- opslagfouten bereiken de oorspronkelijke aanroeper;
- flush bevestigt een aantoonbaar duurzaam opgeslagen revisienummer;
- vergrendeling wist geen sleutel voordat lokale schrijfacties zijn afgerond;
- meerdere tabbladen kunnen niet ongemerkt elkaars updates overschrijven;
- gevoelige app- en apparaatdata blijven versleuteld opgeslagen;
- de Core-release blijft een afzonderlijk, gepind artefact.

Niet-doelen: een algemene compatibiliteitslaag die `localStorage` nabootst, wijzigen van bestaande app-prefixen, wijzigen van het Core-envelopschema, of automatisch opruimen van oude Cryptotracker-gegevens.

## 2. Broncodebevindingen op de huidige Core-main

De volgende observaties zijn gecontroleerd in de huidige broncode; ze zijn geen aannames over de toekomstige implementatie.

### 2.1 `ctx.update()` verbergt opslagfouten

In `js/core/shell.js` vangt `applyUpdate()` fouten op, logt ze en toont een foutmelding, maar gooit ze niet opnieuw. Daardoor kan de Promise van `ctx.update()` succesvol afronden terwijl `vault.setData()` is mislukt. Dat is onverenigbaar met een adapter die de voltooiing van `await ctx.update()` als opslagbevestiging behandelt.

### 2.2 `vault.flush()` bevestigt niet aantoonbaar de laatste revisie

In `js/core/vault.js` retourneert `enqueue()` de oorspronkelijke Promise aan de directe aanroeper, maar bewaart de interne `queue` een keten met `.catch(console.error)`. Daardoor wordt de interne keten na een fout weer vervuld. `flush()` retourneert die interne keten en kan dus succesvol afronden terwijl een eerder opslagverzoek faalde. De bestaande `revision` en `persistedRevision` zijn een bruikbare basis, maar moeten onderdeel worden van het publieke flush-contract.

### 2.3 Apparaatinstellingen zijn al versleuteld, maar niet publiek ontsloten

`vault.getDeviceSettings()` en `vault.setDeviceSettings()` versleutelen apparaatinstellingen met de ontgrendelde datasleutel. Ze worden niet aangeboden via het publieke `ctx`-object. Een adapter mag daarom geen eigen plaintext-opslag introduceren; het Core-contract moet gecontroleerde toegang aanbieden.

### 2.4 Meerdere tabbladen

De shell luistert naar `storage`-events en kan een gewijzigde kluis opnieuw laden. Dit detecteert wijzigingen achteraf, maar vormt geen cross-tab schrijfmutex. Twee tabbladen kunnen daardoor beide op dezelfde oude toestand muteren en na elkaar een volledige envelop opslaan. De laatste schrijver kan wijzigingen van de eerste verliezen.

### 2.5 Vergrendeling en lifecycle

`lockNow()` probeert nu maximaal acht seconden synchronisatie af te wachten en roept anders `vault.flush()` aan. Door het hierboven beschreven flush-gedrag bewijst dat niet dat de laatste lokale revisie duurzaam is opgeslagen. `pagehide` is geen betrouwbare garantie voor het voltooien van asynchrone writes; een browser of mobiel OS kan het proces beëindigen.

## 3. Voorgesteld Core-contract

De exacte namen en signatures zijn **ontwerpvoorstellen**, geen bestaande API.

### 3.1 Foutpropagatie van `ctx.update(mutator)`

- De update blijft asynchroon en geordend.
- De mutator krijgt een geïsoleerde wijzigbare kopie van de meest actuele data.
- Bij een fout in mutator, encryptie of lokale opslag wordt de fout aan de aanroeper teruggegeven.
- De shell mag daarnaast een gebruikersmelding tonen, maar mag de fout niet absorberen.
- De UI wordt pas als opgeslagen bijgewerkt nadat de lokale persist succesvol is bevestigd.
- Een mislukte update mag niet automatisch als dirty/synced worden gemarkeerd alsof de opslag gelukt is.

Voorgestelde regel: `await ctx.update(fn)` resolve't uitsluitend nadat de door die update geproduceerde revisie lokaal duurzaam is opgeslagen; anders reject't de Promise.

### 3.2 Publieke flush- en revisiegarantie

Voeg een publiek `ctx.flush()` toe, of een gelijkwaardig contract met dezelfde garanties.

Minimale semantiek:

1. Leg bij aanroep de hoogste op dat moment aangevraagde revisie vast (`targetRevision`).
2. Wacht op alle lokale schrijfopdrachten die nodig zijn om die revisie te bewaren.
3. Resolve alleen wanneer `persistedRevision >= targetRevision`.
4. Reject wanneer de doelrevisie niet is opgeslagen; de fout bevat minimaal de foutoorzaak en doelrevisie.
5. Een latere succesvolle volledige snapshot mag een eerdere mislukte revisie inhalen, maar alleen wanneer aantoonbaar dezelfde of een hogere revisie volledig is opgeslagen.
6. Een flush zonder openstaande wijzigingen resolve't direct met de bevestigde revisie.

Maak desgewenst `ctx.getStorageStatus()` beschikbaar met uitsluitend niet-gevoelige metadata: `requestedRevision`, `persistedRevision`, `pending`, `lastError` (geschoonde foutcode/bericht). Geen data, sleutels, tokens of inhoud opnemen.

### 3.3 Wachtrijgedrag

De Core-wachtrij moet:

- writes strikt serialiseren binnen één tabblad;
- elke write aan een revisie koppelen;
- fouten per revisie registreren en aan de directe aanroeper doorgeven;
- na een fout niet stilzwijgend doen alsof de fout verdwenen is;
- een expliciet herstelpad bieden: retry van een volledige actuele snapshot of gecontroleerd blokkeren tot herstel;
- geen onbeperkte retry-loop uitvoeren;
- bij een mislukte opslag de laatst bevestigde revisie onderscheiden van de laatste aangevraagde revisie.

De wachtrij mag intern verder kunnen lopen om herstel mogelijk te maken, maar `flush()` moet de foutstatus van zijn eigen doelrevisie beoordelen. Alleen een resolved queue-tail is geen opslagbewijs.

### 3.4 Versleutelde apparaatinstellingen

Expose gecontroleerde `ctx.getDeviceSettings()` en `ctx.setDeviceSettings(value)` (of een kleine namespaced adapter) op basis van de bestaande vault-functies.

Contract:

- alleen beschikbaar wanneer de kluis ontgrendeld is;
- Core versleutelt vóór opslag en ontsleutelt na lezen;
- instellingen worden niet naar het synchronisatiebestand gestuurd;
- fouten worden doorgegeven;
- nooit terugvallen op plaintext `localStorage`;
- migratie van legacy-instellingen gebeurt expliciet en idempotent.

### 3.5 Vergrendelcontract

Een vergrendelactie moet een expliciet resultaat hebben:

- `locked`: alle vereiste lokale writes zijn bevestigd en daarna is de sleutel gewist;
- `blocked`: opslag kon niet worden bevestigd; de app blijft afgeschermd en toont dat gegevens nog niet veilig zijn opgeslagen;
- `already-locked`: er was geen ontgrendelde sessie.

De UI moet eerst gevoelige inhoud afschermen. De sleutel mag niet worden gewist voordat de laatste vereiste lokale revisie is bevestigd. Een timeout is geen bewijs van opslag en mag nooit als succes worden behandeld.

## 4. Cross-tab schrijfserialisatie

### 4.1 Gewenste invariant

Voor een gegeven app-opslagprefix mag maximaal één tabblad tegelijk een read-modify-write-transactie uitvoeren op de Core-kluis. Een tweede tabblad mag niet op een oude snapshot schrijven.

### 4.2 Voorkeursontwerp

Onderzoek en implementeer een Core-beheerde Web Locks-mutex per app-prefix, bijvoorbeeld een stabiele locknaam afgeleid van `APP.storagePrefix`.

Binnen de mutex:

1. controleer of de sessie nog ontgrendeld en bevoegd is;
2. lees de meest recente envelop opnieuw uit lokale opslag;
3. ontsleutel met de actuele datasleutel;
4. voer de mutator uit op de actuele data;
5. valideer en versleutel de nieuwe snapshot;
6. schrijf de envelop;
7. controleer dat de write gelukt is en werk `persistedRevision` bij;
8. geef de mutex vrij.

Alle Core-routes die de lokale vault kunnen vervangen of wijzigen moeten dezelfde coördinatie gebruiken, waaronder normale updates, restore/import, remote adoption en relevante sleutelwijzigingen. De netwerkrequest zelf hoort niet onnodig lang onder de lokale schrijfmutex te blijven.

### 4.3 Ondersteuning ontbrekende Web Locks

Een `storage`-event of BroadcastChannel is alleen een notificatie en geen mutex. Een zelfgebouwde localStorage lease zonder atomische compare-and-swap is evenmin voldoende bewijs tegen races.

Als Web Locks niet beschikbaar zijn, mag Core niet stilzwijgend terugvallen op onbeschermd multi-tab schrijven. De implementatie moet óf een aantoonbaar atomisch alternatief gebruiken (bijvoorbeeld een IndexedDB-transactie met een goed gedefinieerd lockrecord), óf fail-closed werken: tweede schrijvende sessie blokkeren en de gebruiker uitleggen dat één tabblad moet worden gebruikt. De gekozen fallback vereist aparte browseracceptatie.

### 4.4 Synchronisatie en externe wijzigingen

GitHub SHA-conflicten beschermen remote writes, niet lokale tabbladwrites. Remote adoption/restore moet daarom eveneens lokaal worden geserialiseerd. Voorafgaand aan het toepassen van remote data moet Core vaststellen of lokale wijzigingen sinds het ophalen zijn ontstaan en deze via de bestaande app-merge behouden of de operatie afbreken met een expliciet conflict.

## 5. Gegevensclassificatie en opslaggrens

- App-data en apparaatinstellingen: uitsluitend via de versleutelde Core-kluis respectievelijk versleutelde device-settings.
- Syncmetadata: alleen de noodzakelijke niet-geheime metadata buiten de payload; geen portfolio-inhoud, instellingen, tokens of sleutelmateriaal.
- Niet-persoonlijke koers-/publieke marktcache: alleen buiten de kluis als de app-eigenaar expliciet vastlegt dat de inhoud geen gebruikers- of portefeuillegegevens bevat. Bij twijfel versleuteld of niet persistent opslaan.
- Geheugen: gevoelige caches wissen bij lock, logout/reset en onherstelbare sleutel-/decryptiefout.
- Logs en foutmeldingen: nooit payloads, passphrases, tokens, encryptiesleutels of volledige instellingen loggen.

Dit ontwerp staat niet toe dat de adapter een eigen plaintext persistence-laag toevoegt.

## 6. Migratie- en synchronisatiegrenzen voor Cryptotracker

Dit Core-ontwerp verandert de bestaande Cryptotracker-migratiebesluiten niet:

- het legacybestand `crypto-portfolio.enc.json` wordt alleen gelezen en nooit overschreven of verwijderd;
- het nieuwe Core-synchronisatiebestand is `crypto-portfolio.pwa-core-v1.json`;
- oude GitHub-schrijfroutes blijven uitgeschakeld;
- migratie moet idempotent zijn en na onderbreking veilig hervatbaar;
- tombstones, onbekende velden en de bestaande app-merge-semantiek blijven behouden;
- geen legacy lokale sleutels, prefixen of schema's wijzigen/verwijderen zonder afzonderlijk akkoord;
- Core-device-settings mogen niet naar GitHub-sync worden gekopieerd.

De exacte vertaling van Cryptotracker-verwijdermarkeringen naar `__pwaSync` vereist een afzonderlijke mapping- en regressiespecificatie. Gebruik geen generieke tombstone-purge die Cryptotracker-semantiek kan verliezen.

## 7. Teststrategie en acceptatiepoorten

### 7.1 Geautomatiseerde Core-contracttests

1. `ctx.update()` resolve't pas na bevestigde lokale opslag.
2. Mutatorfout reject't en wijzigt geen opgeslagen data.
3. Encryptie-/QuotaExceeded-/SecurityError reject't zichtbaar.
4. `ctx.flush()` wacht tot de target revision duurzaam is opgeslagen.
5. Flush reject't wanneer de target revision niet is opgeslagen.
6. Een mislukte write wordt niet als persisted gerapporteerd.
7. Een expliciete retry kan de actuele volledige snapshot opslaan en de revisie inhalen.
8. Meerdere snelle updates worden in volgorde toegepast zonder verloren wijzigingen.
9. Lock wist de sleutel pas na succesvolle flush.
10. Bij flush-fout blijft de app afgeschermd en meldt de status expliciet dat opslag niet bevestigd is.
11. Device-settings zijn versleuteld, lokaal en niet onderdeel van remote sync.
12. Twee tabbladen met gelijktijdige updates behouden beide mutaties of de tweede schrijver wordt fail-closed geblokkeerd.
13. Restore, import en remote adoption gebruiken dezelfde lokale schrijfcoördinatie.
14. Onbekende velden en tombstones blijven behouden.

### 7.2 Browser- en apparaattests

Node-tests kunnen de browserlock- en lifecyclegaranties niet volledig bewijzen. Vereist zijn minimaal:

- iPhone Safari geïnstalleerde PWA: twee tabbladen/sessies, achtergrond, app-switcher, geforceerd beëindigen en heropenen;
- iPad Safari: gelijktijdige tabs en lock/unlock;
- Windows Chrome en Edge: twee tabs, crash/refresh en opslagfout;
- offline schrijven, heropenen en later synchroniseren;
- opslag vol / write geweigerd via gecontroleerde testfixture;
- passkey- en wachtwoordontgrendeling na herstart;
- twee apparaten die onafhankelijk wijzigen en daarna synchroniseren.

Leg browser-, OS- en apparaatversies en het resultaat per test vast. Een groene CI is noodzakelijk maar niet voldoende.

### 7.3 Acceptatiecriteria vóór Cryptotracker-runtime-integratie

- Het publieke fout- en flush-contract is gedocumenteerd en contracttests slagen.
- Cross-tab write-coördinatie is aantoonbaar racevrij binnen de ondersteunde browsermatrix, of unsupported browsers worden fail-closed geblokkeerd.
- Lock/unlock verliest geen bevestigde lokale revisies.
- Geen gevoelige data wordt buiten de versleutelde opslag geschreven.
- De nieuwe Core-release is apart gepubliceerd en exact gepind in Cryptotracker via een eigen PR.
- De Cryptotracker-adapter slaagt voor geïsoleerde tests vóór integratie met de bestaande app.

## 8. Open ontwerpkeuzes – geen impliciete goedkeuring

De volgende punten zijn bewust open en vereisen expliciet besluit voordat de betreffende implementatie start:

1. **Core-release:** akkoord op een afzonderlijke Core-fixrelease (waarschijnlijk v1.0.1) na implementatie en tests. De exacte versie volgt SemVer-beoordeling van de contractwijziging.
2. **Cross-tab fallback:** Web Locks als minimum, of IndexedDB-atomische coördinatie om ook browsers zonder Web Locks schrijfrechten te geven. Geen keuze maken zonder compatibiliteitsbewijs.
3. **Vergrendelgedrag:** bevestigen dat een lock vanuit één tab alle andere tabs van dezelfde app-sessie afschermt/vergrendelt.
4. **Legacy plaintext-opslag:** afzonderlijk besluit over eventuele verwijdering, pas na verificatie van de import en met behoud van legacy-versleutelde archieven. Dit ontwerp geeft nog geen toestemming tot verwijdering.
5. **Cryptotracker-cacheclassificatie:** definitief vaststellen welke cachevelden publiek/niet-persoonlijk zijn en welke versleuteld moeten blijven.
6. **Retrybeleid:** grenzen, gebruikersinteractie en statuspresentatie voor herstel na opslagfouten vaststellen.

## 9. Uitvoeringsvolgorde na goedkeuring

1. Contractwijziging en testspecificatie definitief maken.
2. Core-implementatie op een eigen featurebranch, zonder release- of repository-instellingen te wijzigen.
3. Unit-/contracttests, statische controles en regressietests uitvoeren.
4. PR openen; niet mergen zonder expliciet akkoord.
5. Na merge een nieuwe onveranderlijke Core-release publiceren via het bestaande releaseproces en na expliciete toestemming.
6. Cryptotracker-releasepin bijwerken in een afzonderlijke Cryptotracker-branch/PR.
7. Adapter geïsoleerd testen en daarna pas integreren.
8. Praktische browser-/apparaatacceptatie uitvoeren.

## 10. Bewijsstatus

| Onderwerp | Status |
|---|---|
| Huidige foutpropagatie in `ctx.update` | Broncode gecontroleerd; fout wordt geabsorbeerd |
| Huidige `vault.flush`-semantiek | Broncode gecontroleerd; interne queue-tail absorbeert fout |
| Versleutelde device-settings intern | Broncode gecontroleerd; publieke ctx-toegang ontbreekt |
| Cross-tab mutex | Niet aanwezig in huidige shell/vault |
| Web Locks-ondersteuning en fallback | Nog browsermatrix-/apparaatbewijs nodig |
| Geen dataverlies bij lock/crash | Niet bewezen; praktijktest vereist |
| Cryptotracker-adapter | Niet geïmplementeerd of getest |

---
**Statusregel:** dit document is een voorstel en vormt geen toestemming om runtimecode, schema's, opslagprefixen, productiegegevens of releasebestanden te wijzigen.
