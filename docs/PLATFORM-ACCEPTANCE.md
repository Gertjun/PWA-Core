# Browser- en apparaatacceptatie: WebAuthn PRF, passkeys en wachtwoordterugval

## Doel en status

Deze checklist is bedoeld voor echte browser- en platformtests van PWA-Core vóór een stabiele release. De bestaande Node-tests gebruiken nagebootste navigator.credentials-antwoorden en bewijzen alleen het JavaScript-contract. Ze bewijzen niet dat een browser, besturingssysteem of authenticator PRF ondersteunt.

**Status op 12 november 2026:** de 9 WebAuthn PRF-contracttests zijn geautomatiseerd geslaagd. Er zijn nog geen echte browser-/apparaatpraktijktests voor de PWA-Core-extractie uitgevoerd.

## Veilig testkader

1. Gebruik uitsluitend een geïsoleerde testapp en een aparte testdatarepository.
2. Gebruik geen productiekluis, productiedatarepository of productietoken.
3. Maak voor de test een aparte passkey met een herkenbare testnaam. De storagePrefix van de testapp moet uniek zijn.
4. Noteer OS-versie, browsernaam/-versie, passkey-provider en resultaat. Noteer nooit wachtwoorden, PRF-uitvoer, credential-ID's, tokens of kluisinhoud.
5. Verwijder na afloop de lokale testkluis en de testpasskey via het wachtwoordbeheer van het platform als deze niet nodig blijft.
6. Voer iedere test eerst uit op een schone testinstallatie en herhaal daarna waar relevant na herladen/sluiten/openen.

## Belangrijk onderscheid: browser versus authenticator

PRF is afhankelijk van zowel browser als authenticator. Een browser kan de extensie herkennen terwijl de gekozen platformauthenticator geen PRF-resultaat levert. Bij registratie is getClientExtensionResults().prf.enabled de relevante bevestiging; bij authenticatie moet getClientExtensionResults().prf.results.first aanwezig zijn.

De actuele implementatie van bio.isSupported() controleert isUserVerifyingPlatformAuthenticatorAvailable(). Dat zegt dat een platformauthenticator beschikbaar is, maar bewijst niet dat PRF beschikbaar is. De gebruikersinterface kan daardoor een passkey-optie tonen die bij registratie alsnog door de authenticator wordt geweigerd. De praktijktest moet dit gedrag expliciet vastleggen. Browser-capability-detectie via PublicKeyCredential.getClientCapabilities() kan aanvullend helpen, maar vervangt de controle van de daadwerkelijke PRF-uitvoer van de authenticator niet.

## Testmatrix

| Platform | Browser | Authenticator / opslag | Verwachting en aandachtspunt |
|---|---|---|---|
| iPhone (iOS 18+) | Safari | iCloud Keychain / Face ID | PRF is volgens gepubliceerde platforminformatie beschikbaar voor platform-passkeys; bevestig enabled en results.first op het echte apparaat. |
| iPad (iPadOS 18+) | Safari | iCloud Keychain / Face ID | Zelfstandig testen; niet aannemen dat een registratie op iPhone automatisch op iPad bruikbaar is. |
| Windows 11 | Chrome | Windows Hello | Algemene platform-passkeybeschikbaarheid is niet hetzelfde als PRF. Yubico documenteert Windows Hello als niet-ondersteunend voor hmac-secret/PRF in zijn compatibiliteitsoverzicht; bevestig dit op de actuele Windows/browser-build en controleer wachtwoordterugval. |
| Windows 11 | Edge | Windows Hello | Afzonderlijke controle; dezelfde authenticatorbeperking kan gelden, ook als de browser PRF als extensie kent. |
| Optioneel | Andere browser of externe security key | Alleen indien daadwerkelijk gebruikt | Apart registreren; nooit aannemen dat ondersteuning van één authenticator naar een andere overdraagbaar is. |

De platforminformatie verandert. Behandel de genoemde compatibiliteit als testhypothese, niet als vervanging van een praktijktest.

## Uit te voeren scenario's

### A. Registratie en PRF op iPhone en iPad

- [ ] Open de geïsoleerde testapp in Safari op iPhone.
- [ ] Maak een testkluis met een testwachtwoord.
- [ ] Registreer een nieuwe test-passkey met Face ID.
- [ ] Controleer dat de registratie niet als succesvol wordt gemeld als prf.enabled expliciet false is.
- [ ] Controleer dat bij succesvolle registratie een PRF-resultaat beschikbaar is (direct bij create() of via de daaropvolgende get()-aanroep).
- [ ] Sluit de app volledig, open opnieuw en ontgrendel met dezelfde passkey.
- [ ] Controleer dat dezelfde datasleutel wordt teruggekregen door de kluis daadwerkelijk te openen; vergelijk of toon nooit de sleutel zelf.
- [ ] Herhaal de volledige test afzonderlijk op iPad.

### B. Bestaande passkey en meerdere apparaten

- [ ] Registreer of selecteer een bestaande test-passkey op het tweede apparaat.
- [ ] Gebruik de functie voor het koppelen van een bestaande passkey.
- [ ] Controleer dat een PRF-resultaat wordt verkregen en de testkluis opent.
- [ ] Controleer expliciet dat een passkey van een andere app niet wordt geaccepteerd als de userHandle een andere storagePrefix aanduidt.
- [ ] Noteer of de passkey via iCloud Keychain beschikbaar kwam of dat op het tweede apparaat een aparte passkey is aangemaakt.
- [ ] Controleer dat uitschakelen van de lokale passkey de kluis en het wachtwoord niet verwijdert.

### C. Windows 11 en PRF-ondersteuning

- [ ] Open de geïsoleerde testapp in Chrome met Windows Hello beschikbaar.
- [ ] Controleer eerst de browser-capabilities indien de browser PublicKeyCredential.getClientCapabilities() aanbiedt.
- [ ] Start passkey-registratie en leg vast of prf.enabled true, false of ontbrekend is.
- [ ] Als PRF ontbreekt of uitgeschakeld is: de app mag geen succesvolle PRF-configuratie opslaan of melden.
- [ ] Controleer dat de foutmelding begrijpelijk is en het wachtwoordveld beschikbaar blijft.
- [ ] Herhaal eventueel in Edge; registreer de uitkomst afzonderlijk.

### D. Wachtwoordterugval en herstel

- [ ] Maak een kluis zonder passkey aan en ontgrendel uitsluitend met het wachtwoord.
- [ ] Annuleer een passkey-prompt; controleer dat de app niet vastloopt en het wachtwoordveld beschikbaar blijft.
- [ ] Test op een authenticator zonder PRF; controleer dat de passkey niet als ingeschakeld wordt opgeslagen.
- [ ] Schakel een bestaande lokale passkey uit; controleer dat het wachtwoord nog steeds werkt.
- [ ] Verwijder de testpasskey uit het platformwachtwoordbeheer en controleer dat het wachtwoord de testkluis nog kan openen.
- [ ] Test een onjuist wachtwoord en een PRF-resultaat dat niet bij de opgeslagen wrapping past; beide moeten gecontroleerd falen zonder data te overschrijven.
- [ ] Herlaad de app na iedere fout en controleer dat het wachtwoordpad opnieuw beschikbaar is.

### E. Offline en lifecycle

- [ ] Na een eerste online cachevulling: open de testapp offline.
- [ ] Ontgrendel de bestaande testkluis met wachtwoord.
- [ ] Herhaal met passkey op een platform waar PRF daadwerkelijk werkt.
- [ ] Vergrendel en ontgrendel na appwissel, schermvergrendeling en herstart van de browser.
- [ ] Controleer dat een ontbrekende PRF-API of geweigerde prompt geen lege pagina of geblokkeerde interface veroorzaakt.

## Registratie van resultaten

Leg per scenario vast:

- datum en test-ID;
- app-commit en PWA-Core-commit;
- apparaatmodel en OS-versie;
- browser en exacte versie;
- passkey-provider/authenticator;
- browser meldt PRF-capability: ja/nee/niet beschikbaar;
- registratie-uitkomst: enabled=true, false of ontbrekend;
- authenticatie-uitkomst: results.first aanwezig/ontbrekend (geen waarde opslaan);
- kluis ontgrendeld: ja/nee;
- wachtwoordterugval: geslaagd/mislukt;
- foutmelding en eventuele herstelactie.

Een scenario is alleen **geslaagd** wanneer de verwachte uitkomst op het echte apparaat is waargenomen. Mocks, syntaxchecks en een groene GitHub Actions-run worden apart als geautomatiseerd bewijs geregistreerd.

## Bronnen

- MDN, WebAuthn extensions: uitleg over PRF-inputs en outputs bij create() en get().
- Yubico, Developer's Guide to PRF: platformafhankelijkheid, getClientCapabilities(), prf.enabled en de compatibiliteitsnotitie voor Windows Hello en Apple-platform-passkeys.

## Browser-capabilitydetectie in de implementatie

`bio.isSupported()` controleert eerst of een platformauthenticator beschikbaar is. Als `PublicKeyCredential.getClientCapabilities()` bestaat, wordt daarnaast `extension:prf` gelezen. Een expliciete `false` verbergt de passkey-optie; een ontbrekende waarde of fout in deze aanvullende API wordt als onbekend behandeld en blokkeert de wachtwoordroute niet.

Deze browsercontrole is uitsluitend een vroege indicatie. `extension:prf: true` bewijst niet dat de gekozen authenticator PRF ondersteunt. Bij registratie is `getClientExtensionResults().prf.enabled === false` een expliciete afwijzing; bij registratie en authenticatie is een werkelijk `prf.results.first` vereist voordat de passkey lokaal wordt opgeslagen of gebruikt. Als dat resultaat ontbreekt, blijft de app op wachtwoordontgrendeling aangewezen.

De gebruikersmeldingen onderscheiden annuleren, een niet-ondersteunde authenticator, een ontbrekende passkey en een ongeldige app-context. In alle gevallen blijft het wachtwoordveld beschikbaar. Een automatische passkeyprompt die door de gebruiker wordt geannuleerd blijft stil; de handmatige actie geeft een begrijpelijke melding.

Deze logica is met mocks getest. Zij vervangt niet de echte iPhone-, iPad- en Windows 11-platformacceptatie hierboven.
De implementatie accepteert uitsluitend PRF-uitvoer van exact 32 bytes. Dat is de uitvoerlengte die de WebAuthn PRF-specificatie voorschrijft. Een ontbrekende of afwijkend lange buffer wordt geweigerd vóór HKDF of lokale opslag; de gebruiker kan de kluis met het wachtwoord openen.