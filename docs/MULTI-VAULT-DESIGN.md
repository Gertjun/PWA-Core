# PWA-Core – ontwerp voor meerdere onafhankelijke kluizen

Status: implementatieontwerp voor featurebranch `feat/multi-vault-instances`.
Datum: 14 november 2026.
Basis: `main` commit `43e48a48eb02c3c61585529a15599999ef7d6291`.
Stabiele distributiebasis: PWA-Core `v1.0.0` blijft ongewijzigd.

## 1. Doel

Ondersteun meerdere onafhankelijke kluizen binnen één PWA-runtime, zonder dat hun sleutels, lokale opslag, passkey-afleiding, sessies of synchronisatiestatus elkaar kunnen beïnvloeden.

Primaire use-case is Vaste Lasten:
- gezamenlijke gegevens in een eigen kluis;
- persoonlijke gegevens van persoon 1 in een eigen kluis;
- persoonlijke gegevens van persoon 2 in een eigen kluis;
- ieder domein behoudt zijn eigen wachtwoord, datasleutel, envelope en remote bestand.

Dit ontwerp voegt geen app-specifieke logica toe aan PWA-Core. De Core levert herbruikbare instanties; de ontvangende app bepaalt welke kluizen worden aangemaakt en welke gegevens bij iedere kluis horen.

## 2. Broncodebevinding

De huidige modules zijn singleton-georiënteerd:
- `vault.js` bewaart `dataKey`, `data`, `envelope`, revisies, schrijfwachtrij en syncmetadata op moduleniveau en leest `APP.storagePrefix` bij import.
- `sync.js` heeft één modulebrede `running`-promise en gebruikt de singleton-vault.
- `session-lock.js` heeft één modulebrede actieve lock en één locknaam op basis van `APP.storagePrefix`.
- `biometric.js` bindt opslagkey, PRF-label en HKDF-info aan `APP.storagePrefix`.

Dezelfde module tweemaal importeren levert dus geen twee kluizen op. Een prefix-wissel of herhaalde initialisatie is geen veilige workaround.

## 3. Voorgestelde API

### 3.1 Vault factory

Voeg `createVault({ storagePrefix, kdfIterations, storage? })` toe.

De factory valideert:
- `storagePrefix` is een stabiele namespace van één segment met letters, cijfers, punt, underscore of koppelteken (geen dubbele punt);
- `kdfIterations` is een positief geheel getal binnen de ondersteunde beleidsgrenzen;
- een prefix wordt binnen dezelfde runtime niet aan twee actieve instanties toegewezen;
- `storage` voldoet aan het beperkte Storage-contract (`getItem`, `setItem`, `removeItem`, `key`, `length`) en is standaard `localStorage`.

Iedere instantie bezit volledig eigen:
- datasleutel, plaintext data in geheugen en envelope;
- requested/persisted revisions, write queue en write errors;
- opslagkeys (`<prefix>:vault`, `device`, `sync`, `device-id`);
- syncmetadata en device-id;
- lifecycle en lockstatus.

De instantie exposeert dezelfde vault-operaties als de huidige module: create, unlock, import, restore, lock, reset, setData, changePassword, flush, retryFlush, storage-status, envelope-/data-toegang en de bestaande deletion-ledger/sync-hulpfuncties.

De huidige named exports blijven bestaan als backwards-compatible facade over één default instantie die wordt gemaakt uit `APP.storagePrefix` en `APP.kdfIterations`. Bestaande apps hoeven daardoor niet direct te migreren.

### 3.2 Sync factory

Voeg `createSync({ vault, appName })` toe. De geretourneerde `syncNow` en `isSyncing` sluiten uitsluitend over de meegegeven vault en hebben een eigen `running`-promise.

De bestaande `syncNow` / `isSyncing` exports blijven de facade voor de default vault.

Elke sync-instantie blijft bewust één remote bestand beheren. Vaste Lasten maakt dus drie sync-instanties (of twee in een sessie: gedeeld plus de actieve gebruiker), elk met een eigen GitHub-pad en SHA-state. Geen gedeelde retry-/conflictstatus.

### 3.3 Session-lock factory

Voeg `createSessionLock({ storagePrefix })` toe. Elke instantie gebruikt een exclusieve Web Lock met een deterministische, prefixgebonden naam. Actieve lockhandle en pending acquire zijn instance-local.

De bestaande exports blijven de facade voor de standaard-app-prefix.

### 3.4 Biometric factory

Voeg `createBiometric({ storagePrefix, appName })` toe. Iedere instantie gebruikt eigen:
- lokale enrollment-key;
- PRF-input/salt;
- HKDF-info;
- wrapped DEK-record.

Eenzelfde platformpasskey kan op authenticatorniveau mogelijk voor meer dan één kluis worden gebruikt, maar iedere kluis heeft een cryptografisch gescheiden PRF-afleiding en wrapped DEK. In de eerste implementatie mag ontgrendeling per kluis een afzonderlijke authenticatoractie vragen. Een gecombineerde één-prompt-ontgrendeling is een latere UX-optimalisatie en mag de eerste veilige multi-vault-API niet blokkeren.

### 3.5 App-orkestratie

Vaste Lasten maakt expliciet instanties met vaste, versievaste namespaces, bijvoorbeeld:
- `vaste-lasten-shared`;
- `vaste-lasten-personal-p1`;
- `vaste-lasten-personal-p2`.

De concrete prefixen moeten vóór implementatie worden gecontroleerd op botsingen met bestaande lokale keys; ze worden niet afgeleid uit een door de gebruiker wijzigbare repo-/bestandsinstelling.

Een ingelogde persoon opent alleen de gedeelde kluis en de eigen persoonlijke kluis. De andere persoonlijke kluis hoeft niet te worden ontgrendeld of geladen. De drie remote paden blijven `samen.json`, `eigen-p1.json` en `eigen-p2.json`; de bestaande encryptie-/JSON-contracten worden per bestand afzonderlijk behandeld in de app-adapter.

## 4. Isolatie-invarianten

1. Een operatie op instantie A verandert geen state, key, revision, queue, syncmeta of storage-key van instantie B.
2. Een wachtwoord voor A kan envelope B niet ontsluiten; tests gebruiken verschillende synthetische wachtwoorden en sleutels.
3. Een reset van A verwijdert uitsluitend keys die exact binnen A's prefix vallen.
4. Een lock van A wist alleen A's sleutel/data en geeft alleen A's Web Lock vrij.
5. Sync A gebruikt alleen vault A, remote SHA A en remote pad A.
6. Passkey PRF/HKDF-contexten zijn per prefix gescheiden; een wrapped DEK van A kan niet met de context van B worden geopend.
7. Een duplicate prefix in één runtime wordt fail-closed geweigerd.
8. Geen plaintext gegevens worden naar localStorage, syncmetadata, logs of foutmeldingen geschreven.
9. Er is geen impliciete cross-vault transactie. Een gedeelde wijziging kan slagen terwijl een persoonlijke write faalt; de app moet gedeeltelijke bevestiging expliciet tonen en mag niet doen alsof beide domeinen atomair zijn opgeslagen.
10. Elke vault houdt zijn eigen Web Lock vast gedurende de volledige ontgrendelde sessie. Locks op verschillende prefixes kunnen onafhankelijk worden verkregen.

## 5. Backwards compatibility en release

- Bestaande imports en named exports blijven werken via de default facade.
- De factory-API is additive; geen wijziging aan de envelope-format v1 of bestaande storage-prefixen.
- Geen wijziging aan bestaande release-tag, release-ZIP, checksums of v1.0.0-manifest.
- Na implementatie en tests volgt een SemVer-beoordeling. De beoogde versie is MINOR (waarschijnlijk v1.1.0) als alle bestaande contracten backwards-compatible blijven; bij een aangetoonde incompatibiliteit wordt de release niet als MINOR gepubliceerd.
- Vaste Lasten en Cryptotracker krijgen afzonderlijke app-PR's na een stabiele Core-release. Deze Core-PR wijzigt geen app-repository.

## 6. Testmatrix

### Factory en lifecycle
1. Maak twee instanties met unieke prefixes; beide starten onafhankelijk.
2. Duplicate prefix in dezelfde runtime wordt geweigerd.
3. Create/unlock/lock van A beïnvloedt B niet.
4. Reset A verwijdert geen enkele B-key, ook niet bij prefixen waarbij de ene tekstprefix een prefix van de andere lijkt.
5. Change-password A wijzigt geen envelope B.
6. Flush/retry van A wacht niet op of bevestigt geen revisies van B.
7. Fout in de write queue A maakt queue B niet onbruikbaar.

### Crypto-isolatie
8. A en B krijgen verschillende willekeurige DEK's en salts.
9. Password A opent alleen envelope A.
10. Envelope A met key B wordt geweigerd en omgekeerd.
11. Verkeerde of beschadigde envelope leidt niet tot opslagmutatie.
12. Recovery envelope A bevat uitsluitend A-data.

### Biometric
13. Enrollment-records, PRF-labels en HKDF-info verschillen per prefix.
14. PRF-uitvoer voor A kan geen wrapped key B openen.
15. Password fallback blijft voor iedere kluis afzonderlijk werken.
16. Eén mislukte/afgebroken biometrische actie voor A laat B's enrollment intact.

### Locks en sync
17. Locks voor A en B kunnen gelijktijdig actief zijn.
18. Tweede tab op dezelfde prefix wordt geblokkeerd; andere prefix wordt niet geblokkeerd.
19. Sync A uploadt/leest uitsluitend het ingestelde bestand A.
20. Sync A-conflict/retry wijzigt geen syncstatus of running-state van B.
21. Remote schema-/decryptiefout in A blokkeert B niet.

### Failure en herstel
22. Quota-/SecurityError bij A blijft beperkt tot A; B kan blijven flushen.
23. Partial success van twee onafhankelijke writes wordt correct gerapporteerd.
24. Reset van één vault behoudt andere envelopes, device-settings, passkey-records en device IDs.
25. Bestaande singleton-contracttests blijven ongewijzigd slagen.

Alle tests gebruiken synthetische data, in-memory storage en mock GitHub/WebAuthn-clients. Geen echte datarepository, tokens, kluisbestanden of passkeys.

## 7. Implementatievolgorde

1. Refactor `vault.js` naar een closure-backed factory en behoud de singleton-facade.
2. Voeg `createSessionLock` en `createBiometric` toe met backwards-compatible facades.
3. Voeg `createSync` toe met vault-injectie en onafhankelijke run-state.
4. Voeg isolatie-/regressietests toe vóór app-integratie.
5. Update API-contractdocumentatie en manifest allowlist/checksums op de featurebranch.
6. Voer volledige CI uit en beoordeel diff/compatibiliteit.
7. Open een draft PR. Geen merge of release zonder afzonderlijk akkoord.
8. Daarna pas Vaste Lasten-adapter en migratieplan in een afzonderlijke app-branch.

## 8. Niet in scope

- Geen wijzigingen aan Vaste Lasten, Cryptotracker of andere app-repositories.
- Geen toegang tot de daadwerkelijke datarepository of de drie remote JSON-bestanden.
- Geen import van bestaande localStorage-data en geen verwijderen/overschrijven van legacy keys.
- Geen echte passkeyregistratie of herstel.
- Geen releasepublicatie, app-releasepin, service-worker-update of merge.
- Geen belofte van een atomische transactie over meerdere kluizen.
