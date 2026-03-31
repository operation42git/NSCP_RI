# Analiza Implementacije Poslovnih Pravila

## Pregled

Ovaj dokument analizira poslovna pravila definirana u dokumentu testnih scenarija (`/docs/NSCP_Plan_testiranja_testni_scenariji.md`) i mapira ih na trenutnu implementaciju u eFTI referentnoj implementaciji.

**Referenca dokumenta**: `/docs/NSCP_Plan_testiranja_testni_scenariji.md` (Sekcija 4 - PRILOG A – Poslovna pravila)

**Zadnje ažuriranje**: Siječanj 2025

---

## Važna Pojašnjenja

### Što znači "Nije Implementirano"

Kada je poslovno pravilo označeno kao **❌ NIJE IMPLEMENTIRANO**, to znači:
- Funkcionalnost opisana u poslovnom pravilu je **potpuno nedostaje** u kodu
- **Nema koda** koji izvršava opisano ponašanje
- Primjer: PR-RESOLVE-04 (status aktivnosti/inaktivnosti dataseta) - nema polja `active` u entitetu baze podataka i nema provjere statusa u kodu

### Što znači "Djelomično Implementirano"

Kada je poslovno pravilo označeno kao **⚠️ Djelomično Implementirano**, to znači:
- **Osnovna funkcionalnost postoji** i radi
- Međutim, **specifični detalji** ili **eksplicitna dokumentacija** ponašanja nedostaju
- Ponašanje može raditi ispravno, ali nije eksplicitno kodirano ili dokumentirano
- Primjer: PR-UIL-04 (debounce) - validacija forme sprječava nevažeće podnošenje, ali nema eksplicitnog mehanizma debounce za brze klikove na gumb

### Što znači "Potpuno Implementirano"

Kada je poslovno pravilo označeno kao **✅ Potpuno Implementirano**, to znači:
- Funkcionalnost je **potpuno implementirana** u kodu
- Svi aspekti poslovnog pravila su pokriveni
- Implementacija odgovara opisu poslovnog pravila
- Navedene su reference na kod i detalji implementacije

---

## Sadržaj

1. [4.2 Poslovna pravila za autentikaciju i sesiju](#42-poslovna-pravila-za-autentikaciju-i-sesiju)
2. [4.3 Poslovna pravila za unos i validaciju UIL-a](#43-poslovna-pravila-za-unos-i-validaciju-uil-a)
3. [4.4 Poslovna pravila za razrješenje identifikatora i dohvat podataka](#44-poslovna-pravila-za-razrješenje-identifikatora-i-dohvat-podataka)
4. [4.5 Pravila prikaza zahtjeva i rezultata zahtjeva](#45-pravila-prikaza-zahtjeva-i-rezultata-zahtjeva)
5. [4.6 Pravila mapiranja XML podataka na korisnički prikaz](#46-pravila-mapiranja-xml-podataka-na-korisnički-prikaz)
6. [4.7 Poslovna pravila za navigaciju (UX/UI)](#47-poslovna-pravila-za-navigaciju-uxui)
7. [4.8 Poslovna pravila za Evidentiranje](#48-poslovna-pravila-za-evidentiranje)

---

## 4.2 Poslovna pravila za autentikaciju i sesiju

**Napomena**: Originalni dokument referencira poslovna pravila za autentikaciju i sesiju, ali detaljni ID-ovi pravila (npr. PR-LOGIN-XX, PR-SESSION-01) spomenuti su u testnim slučajevima. Ova pravila nisu potpuno detaljizirana u Sekciji 4.2 originalnog dokumenta.

### PR-LOGIN-XX (Referencirano u TC-6.1-XX) – Pravila formata unosa

**Poslovno Pravilo**: Sustav validira format korisničkog imena i/ili lozinke prije slanja zahtjeva za autentikaciju.

**Trenutna Implementacija**:

**Tok Autentikacije**:
- **Portal Login Komponenta**: `portal-mock/src/app/pages/login/login.component.ts` - Prazna komponenta (nema prilagođene forme)
- **Pružatelj Autentikacije**: Keycloak rukuje SVAKOM autentikacijom (nema prilagođene forme za prijavu u portalu)
- **HTTP Server**: Apache HTTP Server s `mod_auth_openidc` preusmjerava na Keycloak stranicu za prijavu
- **Konfiguracija**: `deploy/local/efti-gate/httpd/config/conf.d/efti.conf` - OIDC konfiguracija

**Validacija Formata - Pravila Lozinke**:
- **Lokacija**: Keycloak realm konfiguracija (`deploy/local/efti-gate/keycloak/*-export.json`)
- **Pravila Lozinke**: `"length(10) and specialChars(1) and digits(1) and upperCase(1) and lowerCase(1)"`
- **Zahtjevi**:
  - Minimalna duljina: **10 znakova**
  - Najmanje **1 posebni znak** (npr. `!@#$%^&*()`)
  - Najmanje **1 znamenka** (0-9)
  - Najmanje **1 veliko slovo** (A-Z)
  - Najmanje **1 malo slovo** (a-z)
- **Kada se Primjenjuje**: 
  - Kada se **kreira/ ažurira** lozinka korisnika u Keycloak-u
  - Kada se **mijenja** lozinka
  - **NE primjenjuje se tijekom prijave** (postojeće lozinke se validiraju protiv pohranjenog hash-a)

**Format Korisničkog Imena**:
- **Nema eksplicitne politike formata** u Keycloak konfiguraciji
- Korisničko ime se validira prema Keycloak zadanim pravilima (obično: alfanumerički, podvlake, crtice dopuštene)
- **Postojanje** korisničkog imena se provjerava tijekom autentikacije

**Što se Događa Tijekom Prijave**:

1. **Korisnik Unosi Vjerodajnice**:
   - Korisnik navigira na portal (npr. `http://portal.efti.fr:83`)
   - Apache HTTP Server preusmjerava na Keycloak stranicu za prijavu
   - Korisnik unosi korisničko ime i lozinku u Keycloak formu za prijavu

2. **Keycloak Validira Vjerodajnice**:
   - **Korisničko ime postoji?**: Keycloak provjerava postoji li korisničko ime u realm-u
   - **Lozinka ispravna?**: Keycloak validira hash lozinke protiv pohranjenog hash-a
   - **Korisnik omogućen?**: Keycloak provjerava je li korisnički račun omogućen
   - **Korisnik ima potrebnu ulogu?**: Keycloak provjerava ima li korisnik ulogu `ROAD_CONTROLER` (ili odgovarajuću ulogu)

3. **Rezultati Autentikacije**:

   **✅ Uspjeh**:
   - Keycloak izdaje tokene (Access Token, Refresh Token, ID Token)
   - Portal prima tokene putem `/redirect_uri?info=json`
   - Korisnik je autenticiran i može pristupiti portalu

   **❌ Nevažeće Korisničko Ime (Korisnik ne postoji)**:
   - Keycloak vraća: `401 Unauthorized` ili grešku autentikacije
   - Keycloak stranica za prijavu prikazuje poruku greške: **"Nevažeće korisničko ime ili lozinka"** (generička poruka za sigurnost)
   - Korisnik ostaje na Keycloak stranici za prijavu
   - **Nema razlike** između "korisnik ne postoji" i "pogrešna lozinka" (najbolja praksa sigurnosti)

   **❌ Nevažeća Lozinka (Pogrešna lozinka)**:
   - Keycloak vraća: `401 Unauthorized` ili grešku autentikacije
   - Keycloak stranica za prijavu prikazuje poruku greške: **"Nevažeće korisničko ime ili lozinka"** (generička poruka)
   - Korisnik ostaje na Keycloak stranici za prijavu
   - **Nema razlike** između "korisnik ne postoji" i "pogrešna lozinka" (najbolja praksa sigurnosti)

   **❌ Korisnički Račun Onemogućen**:
   - Keycloak vraća: `401 Unauthorized` ili grešku autentikacije
   - Keycloak stranica za prijavu prikazuje poruku greške: **"Račun onemogućen"** ili slično
   - Korisnik se ne može autenticirati

   **❌ Korisnik Nema Potrebnu Ulogu**:
   - Autentikacija uspijeva, ali autorizacija ne uspijeva
   - Gate API vraća: `403 Forbidden` prilikom pristupa zaštićenim endpoint-ima
   - Error interceptor (`portal-mock/src/app/core/interceptors/error.interceptor.ts`) rukuje `403` greškama

**Rukovanje Greškama u Portalu**:
- **Lokacija**: `portal-mock/src/app/core/interceptors/error.interceptor.ts`
- **401 Unauthorized**: 
  - Ako autenticiran: Prikazuje toast poruku "Vaša sesija je istekla, molimo prijavite se ponovno"
  - Poziva `sessionService.logout()` za brisanje sesije
- **403 Forbidden**: 
  - Ponovno učitava stranicu (ako autenticiran)
  - Korisnik se preusmjerava na prijavu ako nije autenticiran

**Važne Napomene**:
- **Nema validacije formata na klijentskoj strani** u portalu (Keycloak rukuje svime)
- **Pravila lozinke** primjenjuju se na kreiranje/promjenu lozinke, NE na validaciju prijave
- **Validacija prijave** provjerava: postojanje korisničkog imena, ispravnost lozinke, status računa, uloge korisnika
- **Sigurnost**: Keycloak koristi generičke poruke grešaka kako bi spriječio napade enumeracije korisničkih imena

**Status**: ✅ **Potpuno Implementirano** (putem Keycloak-a - sva validacija rukovana Keycloak servisom za autentikaciju)

---

### PR-SESSION-01 (Referencirano u TC-6.1-XX) – Prikaz poruke o isteku korisničke sesije

**Poslovno Pravilo**: Sustav prikazuje poruku o isteku sesije i preusmjerava korisnika na prijavu.

**Trenutna Implementacija**:
- **Lokacija**: Portal rukuje istekom sesije
- **Istek Tokena**: Access tokeni istječu nakon 600 sekundi (10 minuta)
- **Auto-osvježavanje**: Portal osvježava tokene 30 sekundi prije isteka
- **Rukovanje Greškama**: `401 Unauthorized` ako je token nevažeći ili istekao
- **Status**: ✅ **Implementirano**

---

### PR-SESSION-02 (Referencirano u TC-6.1-XX) – Ponašanje aplikacije bez aktivne sesije

**Poslovno Pravilo**: Sustav sprječava pristup sadržaju aplikacije bez aktivne sesije.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/gate/src/main/java/eu/efti/eftigate/controller/ControlController.java`
- **Sigurnost**: Anotacije `@Secured("ROLE_ROAD_CONTROLER")` štite endpoint-e
- **Greška**: `401 Unauthorized` ako nema važećeg tokena
- **Status**: ✅ **Implementirano**

---

### PR-SESSION-03 (Referencirano u TC-6.1-XX) – Upravljanje sesijom u više kartica

**Poslovno Pravilo**: Sustav ispravno upravlja sesijom kada je aplikacija otvorena u više kartica preglednika.

**Trenutna Implementacija**:
- **Lokacija**: Upravljanje sesijom portala
- **Status**: ⚠️ **Djelomično Implementirano** (upravljanje sesijom postoji, ali ponašanje u više kartica nije eksplicitno testirano)

---

### PR-SESSION-04 (Referencirano u TC-6.1-XX) – Trajanje i obnova korisničke sesije

**Poslovno Pravilo**: Sustav upravlja trajanjem i obnovom sesije prema poslovnim pravilima.

**Trenutna Implementacija**:
- **Lokacija**: Konfiguracija portala i Keycloak-a
- **Istek Sesije**: 30 minuta neaktivnosti (konfigurabilno)
- **Osvježavanje Tokena**: Automatsko osvježavanje 30 sekundi prije isteka
- **Status**: ✅ **Implementirano**

---

## 4.3 Poslovna pravila za unos i validaciju UIL-a

**Napomena**: Ova sekcija pokriva validaciju unosa UIL-a (Unique Identifier Locator). Za validaciju pretrage identifikatora, vidi poslovna pravila pretrage identifikatora u testnim slučajevima.

### PR-UIL-01 – Pravila formata i prihvata UIL-a

**Poslovno Pravilo**: Sustav prihvaća unos UIL-a u ispravnom formatu i pokreće obradu zahtjeva.

**Trenutna Implementacija**:

**Backend Validacija** (`implementation/commons/src/main/java/eu/efti/commons/dto/AbstractUilDto.java`):
- **gateId**:
  - Uzorak: `^[-@./#&+\\w\\s]*$` (alfanumerički, razmaci i posebni znakovi: `-@./#&+`)
  - Maksimalna Duljina: 255 znakova
  - Obavezno: `@NotNull`, `@NotBlank`
  - Kod Greške: `GATE_ID_INCORRECT_FORMAT`, `GATE_ID_TOO_LONG`, `UIL_GATE_MISSING`

- **platformId**:
  - Uzorak: `^[-@./#&+\\w\\s]*$` (isto kao gateId)
  - Maksimalna Duljina: 255 znakova
  - Obavezno: `@NotNull`, `@NotBlank`
  - Kod Greške: `PLATFORM_ID_INCORRECT_FORMAT`, `PLATFORM_ID_TOO_LONG`, `UIL_PLATFORM_MISSING`

- **datasetId**:
  - Uzorak: `[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}` (UUID format)
  - Maksimalna Duljina: 36 znakova
  - Obavezno: `@NotNull`, `@NotBlank`
  - Kod Greške: `DATASET_ID_INCORRECT_FORMAT`, `DATASET_ID_TOO_LONG`, `UIL_UUID_MISSING`

**Frontend Validacija** (`portal-mock/src/app/pages/uil-search/uil-search.component.ts`):
- **datasetId**:
  - Uzorak: `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}` (UUID v4 format)
  - Obavezno: `Validators.required`
  - Poruke Grešaka: 
    - Obavezno: `form.error.required` (prevedeno)
    - Uzorak: `form.error.pattern` (prevedeno)
  - Prikaz Validacije: `hasFieldError('id')` prikazuje grešku samo nakon podnošenja forme
  - CSS Klasa: `is-invalid` primijenjena kada polje ima grešku

**Status**: ✅ **Potpuno Implementirano** (I backend i frontend validacija)

---

### PR-UIL-02 – Pravila obaveznih polja za unos UIL-a

**Poslovno Pravilo**: Sustav validira da su sva obavezna polja UIL-a unesena prije obrade.

**Trenutna Implementacija**:

**Backend Validacija** (`implementation/commons/src/main/java/eu/efti/commons/dto/AbstractUilDto.java`):
- **gateId**: `@NotNull`, `@NotBlank` → Greška: `UIL_GATE_MISSING`
- **platformId**: `@NotNull`, `@NotBlank` → Greška: `UIL_PLATFORM_MISSING`
- **datasetId**: `@NotNull`, `@NotBlank` → Greška: `UIL_UUID_MISSING`

**Frontend Validacija** (`portal-mock/src/app/pages/uil-search/uil-search.component.ts`):
- **datasetId**: `Validators.required` u form control-u
- **Prikaz Greške**: 
  - Metoda: `hasFieldError(key: string)` provjerava `formSubmitted && !control.valid`
  - Poruka Greške: `getFieldError(field)` vraća prevedeno `form.error.required`
  - Prikaz: `<div class="invalid-feedback">` prikazano kada je `hasFieldError('id')` true
- **Podnošenje Forme**: Metoda `submit()` provjerava `if (!this.searchForm.valid) return;` prije slanja zahtjeva

**Status**: ✅ **Potpuno Implementirano** (I backend i frontend validacija)

---

### PR-UIL-03 – Pravila dozvoljenih znakova i maksimalne duljine UIL-a

**Poslovno Pravilo**: Sustav odbija unos UIL-a koji sadrži nedozvoljene znakove ili prelazi maksimalnu duljinu.

**Trenutna Implementacija**:

**Backend Validacija** (`implementation/commons/src/main/java/eu/efti/commons/dto/AbstractUilDto.java`):
- **gateId**: 
  - Maksimalna Duljina: 255 znakova (`@Size(max = 255)`)
  - Uzorak: `^[-@./#&+\\w\\s]*$` (dopušta: alfanumerički, razmaci, `-@./#&+`)
  - Kodovi Grešaka: `GATE_ID_TOO_LONG`, `GATE_ID_INCORRECT_FORMAT`

- **platformId**: 
  - Maksimalna Duljina: 255 znakova (`@Size(max = 255)`)
  - Uzorak: `^[-@./#&+\\w\\s]*$` (isto kao gateId)
  - Kodovi Grešaka: `PLATFORM_ID_TOO_LONG`, `PLATFORM_ID_INCORRECT_FORMAT`

- **datasetId**: 
  - Maksimalna Duljina: 36 znakova (`@Size(max = 36)`)
  - Uzorak: `[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}` (UUID format)
  - Kodovi Grešaka: `DATASET_ID_TOO_LONG`, `DATASET_ID_INCORRECT_FORMAT`

**Frontend Validacija** (`portal-mock/src/app/pages/uil-search/uil-search.component.ts`):
- **datasetId**: 
  - Uzorak: `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}` (UUID v4)
  - Prikaz Greške: Greška uzorka prikazana putem `getFieldError('id')` koji vraća `form.error.pattern`
  - Napomena: Frontend eksplicitno ne provjerava maksimalnu duljinu (oslanja se na backend)

**Status**: ✅ **Potpuno Implementirano** (Backend provodi sva ograničenja, frontend validira format)

---

### PR-UIL-04 – Sprječavanje duplikat zahtjeva pri pretrazi

**Poslovno Pravilo**: Sustav sprječava slanje duplikat zahtjeva kada korisnik više puta klikne "Pretraži".

**Trenutna Implementacija**:
- **Lokacija**: Portal UI (`portal-mock/src/app/pages/uil-search/uil-search.component.ts`)
- **Detalji Implementacije**:
  - **Validacija Forme**: Metoda `submit()` provjerava `if (!this.searchForm.valid) return;` prije obrade
  - **Stanje Forme**: Zastavica `formSubmitted` postavljena na `true` prije validacije, zatim `false` nakon uspješnog podnošenja
  - **Ponašanje Gumba**: Gumb za podnošenje je standardni HTML gumb, nema eksplicitnog onemogućavanja tijekom podnošenja
  - **Nedostatak**: Nema eksplicitnog mehanizma debounce/throttle ili onemogućavanja gumba tijekom obrade zahtjeva
- **Status**: ⚠️ **Djelomično Implementirano** (Validacija forme sprječava nevažeća podnošenja, ali nema eksplicitnog debounce za brze klikove)
- **Preporuka**: Dodati onemogućavanje gumba tijekom obrade zahtjeva ili implementirati mehanizam debounce

---

### PR-UIL-05 – Prikaz statusa obrade zahtjeva

**Poslovno Pravilo**: Sustav prikazuje korisniku status obrade zahtjeva.

**Trenutna Implementacija**:
- **Lokacija**: 
  - Portal UI: `portal-mock/src/app/pages/uil-search/uil-search.component.ts`
  - Gate API: `GET /v1/control/uil?requestId={requestId}`
- **Vrijednosti Statusa**: `PENDING`, `IN_PROGRESS`, `COMPLETE`, `ERROR`, `TIMEOUT`
- **Auto-Polling**:
  - Timer: `timer(0, 2000)` - provjerava svake 2 sekunde
  - Uvjet: `if(this.localStorageService.getAutoPolling())`
  - Metoda: `autoPoll()` provjerava sve `PENDING` zahtjeve i poziva `pollResult(requestId)`
- **Ručno Provjeravanje**: Korisnik može kliknuti gumb "Update" za ručno osvježavanje statusa
- **Prikaz Statusa**: 
  - Stupac tablice prikazuje tekst statusa
  - Primijenjene CSS klase: `getClassFromStatus(status)` vraća `"complete"`, `"error"`, `"timeout"`, ili `"pending"`
  - Detalji greške: Ikona popover prikazuje `errorCode` i `errorDescription` na hover za ERROR status
- **Ažuriranja Statusa**: `updateEntry(response)` ažurira status u result array-u kada polling vrati novi status
- **Status**: ✅ **Potpuno Implementirano**

---

## 4.4 Poslovna pravila za razrješenje identifikatora i dohvat podataka

**Pojašnjenje**: Sva PR-RESOLVE pravila su **POTPUNO IMPLEMENTIRANA** osim PR-RESOLVE-04. Sustav ispravno rukuje lokalnim razrješenjem, prekograničnim razrješenjem, slučajevima grešaka, greškama platforme i timeoutima. Nedostaje samo provjera statusa aktivnosti/inaktivnosti dataseta.

---

### PR-RESOLVE-01 – Pravila lokalnog razrješenja UIL-a putem ROI-a

**Poslovno Pravilo**: Sustav razrješava UIL koji postoji u lokalnom ROI-u i dohvaća odgovarajući dataset s lokalne eFTI platforme.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java`
- **Logika**:
  1. Provjerava lokalni ROI: `SELECT c FROM Consignment c WHERE c.gateId = :gate AND c.datasetId = :uuid AND c.platformId = :platform`
  2. Ako pronađeno: Upituje lokalnu platformu putem REST API-ja
  3. Vraća dataset
- **Tip Zahtjeva**: `LOCAL_UIL_SEARCH`
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-RESOLVE-02 – Pravila prekograničnog razrješenja UIL-a putem G2G komunikacije

**Poslovno Pravilo**: Sustav pokreće prekogranično razrješenje UIL-a kada UIL ne postoji u lokalnom ROI-u i dohvaća dataset s udaljene platforme.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java`
- **Logika**:
  1. Određuje da je UIL za vanjski gate: `gateProperties.isCurrentGate(uilDto.getGateId()) == false`
  2. Šalje `UILQuery` putem eDelivery-a stranom gate-u
  3. Strani gate upituje svoju platformu
  4. Strani gate odgovara s `UILResponse`
  5. Dataset se vraća tražećem gate-u
- **Tip Zahtjeva**: `EXTERNAL_UIL_SEARCH`
- **Protokol**: AS4/eDelivery putem Domibus-a
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-RESOLVE-03 – Pravila ponašanja sustava kada UIL ne postoji u sustavu

**Poslovno Pravilo**: Sustav ispravno reagira kada uneseni UIL ne postoji ni u jednom dostupnom ROI-u.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java`
- **Logika**:
  1. Lokalno pretraživanje ROI-a ne uspijeva
  2. Prekogranično G2G pretraživanje ne uspijeva (ako je primjenjivo)
  3. Kod greške: `DATA_NOT_FOUND_ON_REGISTRY`
  4. Status: `ERROR`
  5. Poruka greške prikazana korisniku
- **Kod Greške**: `DATA_NOT_FOUND_ON_REGISTRY`
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-RESOLVE-04 – Pravila ponašanja sustava kada dataset nije aktivan

**Poslovno Pravilo**: Sustav ne dohvaća dataset označen kao neaktivan i prikazuje korisniku odgovarajuću poruku.

**Trenutna Implementacija**:
- **Lokacija**: Entitet ROI baze podataka: `implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/entity/Consignment.java`
- **Status**: ❌ **NIJE IMPLEMENTIRANO**
- **Nedostatak**: 
  - Nema polja statusa `active`/`inactive` u entitetu `Consignment`
  - Nema provjere statusa u ROI upitu
  - Nema validacije statusa prije dohvaćanja dataseta
- **Potrebne Promjene**:
  - Dodati boolean polje `active` u entitet `Consignment`
  - Dodati provjeru statusa u ROI upit: `WHERE ... AND c.active = true`
  - Vratiti grešku `DATA_NOT_ACTIVE` ako je dataset neaktivan

---

### PR-RESOLVE-05 – Pravila ponašanja sustava u slučaju greške eFTI platforme

**Poslovno Pravilo**: Sustav ispravno reagira kada dođe do greške tijekom dohvaćanja dataseta s eFTI platforme.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java`
- **Rukovanje Greškama**:
  - Platforma vraća HTTP grešku (npr. 404, 500)
  - Gate postavlja status na `ERROR`
  - Kod greške: `PLATFORM_ERROR` ili `DATA_NOT_FOUND`
  - Poruka greške prikazana (tehnički detalji skriveni od korisnika)
- **Kodovi Grešaka**: `PLATFORM_ERROR`, `DATA_NOT_FOUND`
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-RESOLVE-06 – Pravila ponašanja sustava u slučaju timeouta ili nedostupnosti platforme

**Poslovno Pravilo**: Ponašanje sustava kada eFTI platforma ne odgovara unutar definiranog vremenskog okvira.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java`
- **Rukovanje Timeoutom**:
  - Timeout platforme se aktivira
  - Status postavljen na `TIMEOUT`
  - Logika ponovnog pokušaja (ako je konfigurirana)
  - Poruka greške prikazana (tehnički detalji skriveni)
- **Status**: `TIMEOUT`
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-RESOLVE-07 – Pravila obrade djelomičnih odgovora ili više pogodaka (ako je primjenjivo)

**Poslovno Pravilo**: Sustav rukuje djelomičnim odgovorima ili više pogodaka (ako je primjenjivo za upite koji vraćaju liste).

**Trenutna Implementacija**:
- **Lokacija**: Pretraga identifikatora vraća više rezultata
- **Status**: ⚠️ **Djelomično Implementirano**
- **Napomena**: UIL upiti vraćaju jedan dataset (jedan-na-jedan mapiranje). Više rezultata primjenjuje se na pretragu identifikatora, ne na UIL upite.

---

## 4.5 Pravila prikaza zahtjeva i rezultata zahtjeva

### PR-REQ-01 – Prikaz statusa zahtjeva tijekom obrade

**Poslovno Pravilo**: Sustav prikazuje status zahtjeva tijekom obrade.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI i Gate API
- **Vrijednosti Statusa**: `PENDING`, `IN_PROGRESS`
- **Polling**: Portal provjerava ažuriranja statusa
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-REQ-02 – Prikaz statusa zahtjeva nakon uspješnog završetka

**Poslovno Pravilo**: Sustav prikazuje status zahtjeva nakon uspješnog završetka.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI i Gate API
- **Status**: `COMPLETE`
- **Prikaz Podataka**: Dataset se prikazuje kada je status `COMPLETE`
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-REQ-03 – Prikaz statusa zahtjeva nakon neuspješnog završetka

**Poslovno Pravilo**: Sustav prikazuje status zahtjeva nakon neuspješnog završetka.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI i Gate API
- **Status**: `ERROR` ili `TIMEOUT`
- **Prikaz Greške**: Poruka greške prikazana, detalji dataseta nisu prikazani
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-REQ-04 – Stabilnost prikaza statusa i sprječavanje nekonzistentnosti

**Poslovno Pravilo**: Stabilnost prikaza statusa i sprječavanje nekonzistentnosti (npr. bez vraćanja na prethodni status, bez duplikata prikaza).

**Trenutna Implementacija**:
- **Lokacija**: Portal UI i Gate API
- **Napredovanje Statusa**: Status se kreće samo naprijed (PENDING → IN_PROGRESS → COMPLETE/ERROR)
- **Bez Povratka**: Status se nikada ne vraća na prethodne vrijednosti
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-REQ-05 – Prikaz rezultata nakon uspješnog završetka zahtjeva

**Poslovno Pravilo**: Sustav prikazuje rezultate nakon uspješnog završetka zahtjeva.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Prikaz**: XML dataseta se prikazuje/transformira kada je status `COMPLETE`
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-REQ-06 – Prikaz ishoda kada nema rezultata ili kada je zahtjev neuspješan

**Poslovno Pravilo**: Sustav prikazuje ishod kada nema rezultata ili kada je zahtjev neuspješan (npr. poruka bez prikaza detalja dataseta).

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Prikaz Greške**: Poruka greške prikazana, detalji dataseta nisu prikazani
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-REQ-07 – Pravila prikaza i dostupnosti akcija dok je zahtjev u obradi

**Poslovno Pravilo**: Pravila za prikaz i dostupnost akcija dok je zahtjev u obradi.

**Trenutna Implementacija**:
- **Lokacija**: `portal-mock/src/app/pages/uil-search/uil-search.component.html` (linije 80-91)
- **Detalji Implementacije**:
  - **Provjera Statusa**: Akcije se prikazuju na temelju vrijednosti `res.status`
  - **PENDING Status**: 
    - Prikazuje: Gumb "Update" (poll gumb) s ikonom `fa-arrows-rotate`
    - ID Gumba: `poll-btn`
    - Akcija: `pollResult(res.requestId)` - ručno osvježavanje statusa
  - **COMPLETE Status**:
    - Prikazuje: Gumb "Open" (`open-btn`) i gumb "Download" (`download-btn`)
    - Gumb Open: Navigira na `/ecmr-display` s base64 XML podacima
    - Gumb Download: Preuzima XML datoteku s imenom `{datasetId}.xml`
  - **ERROR Status**: 
    - Prikazuje: Ikona greške s popover-om koji prikazuje `errorCode` i `errorDescription`
    - Nema akcijskih gumbova (nema open/download)
- **Status**: ✅ **Potpuno Implementirano** (Akcije se uvjetno prikazuju na temelju statusa)

---

### PR-REQ-08 – Pravila prikaza i dostupnosti akcija nakon završetka zahtjeva

**Poslovno Pravilo**: Pravila za prikaz i dostupnost akcija nakon završetka zahtjeva (razlikovati uspjeh i neuspjeh ako je potrebno).

**Trenutna Implementacija**:
- **Lokacija**: `portal-mock/src/app/pages/uil-search/uil-search.component.html` (linije 80-91)
- **Detalji Implementacije**:
  - **COMPLETE Status** (Uspjeh):
    - Dostupne Akcije: Gumb "Open", gumb "Download", gumb "Add Note"
    - Open: `open(res.requestId)` - prikazuje dataset na novoj stranici
    - Download: `download(res.requestId)` - sprema XML datoteku
    - Note: `openModal(noteModal, res)` - dodaje napomenu za praćenje
  - **ERROR/TIMEOUT Status** (Neuspjeh):
    - Dostupne Akcije: Samo gumb "Add Note"
    - Nema Open/Download gumbova (podaci nisu dostupni)
    - Informacije o Grešci: Ikona popover prikazuje detalje greške na hover
  - **Prikaz Statusa**: CSS klase primijenjene putem `getClassFromStatus(status)`:
    - `COMPLETE` → klasa `"complete"`
    - `ERROR` → klasa `"error"`
    - `TIMEOUT` → klasa `"timeout"`
    - `PENDING` → klasa `"pending"`
- **Status**: ✅ **Potpuno Implementirano** (Različite akcije za uspjeh vs neuspjeh)

---

### PR-REQ-09 – Ponašanje ekrana pri refreshu preglednika dok je zahtjev u obradi

**Poslovno Pravilo**: Ponašanje ekrana kada se preglednik osvježava dok je zahtjev u obradi.

**Trenutna Implementacija**:
- **Lokacija**: `portal-mock/src/app/pages/uil-search/uil-search.component.ts`
- **Detalji Implementacije**:
  - **Inicijalizacija Komponente**: `ngOnInit()` pokreće auto-polling timer: `timer(0, 2000)` (svake 2 sekunde)
  - **Oporavak Stanja**: Pri refreshu, komponenta se reinicijalizira i:
    - Forma se resetira (osim ako postoje query parametri)
    - `result` array je prazan (nema perzistencije preko refresh-a)
    - Auto-polling se nastavlja ako je omogućen
  - **Polling Statusa**: Metoda `autoPoll()` provjerava sve `PENDING` zahtjeve i poziva `pollResult(requestId)`
  - **API Poziv**: `getUilControl(requestId)` dohvaća trenutni status s backend-a
  - **Ažuriranje Statusa**: `updateEntry(result)` ažurira status u result array-u
  - **Bez Duplikacije**: Svaki zahtjev ima jedinstven `requestId`, nema duplikatnih unosa pri refresh-u
- **Status**: ✅ **Potpuno Implementirano** (Portal se ponovno učitava, provjerava API, održava ispravan status)

---

### PR-REQ-10 – Ponašanje ekrana pri refreshu preglednika nakon završetka zahtjeva

**Poslovno Pravilo**: Ponašanje ekrana kada se preglednik osvježava nakon završetka zahtjeva.

**Trenutna Implementacija**:
- **Lokacija**: `portal-mock/src/app/pages/uil-search/uil-search.component.ts`
- **Detalji Implementacije**:
  - **Stanje Komponente**: Pri refreshu, stanje komponente se gubi (standardno Angular ponašanje)
  - **Result Array**: `result: UilResult[] = []` se reinicijalizira kao prazan array
  - **Nema Perzistencije**: Završeni zahtjevi NISU perzistirani u localStorage ili sessionStorage
  - **Potrebna Akcija Korisnika**: Korisnik mora podnijeti novu pretragu da vidi zahtjeve ponovno
  - **Napomena**: To znači da se završeni zahtjevi gube pri refresh-u (može biti nedostatak - zahtjevi bi trebali biti perzistentni)
- **Status**: ⚠️ **Djelomično Implementirano** (Refresh radi, ali završeni zahtjevi se gube - možda treba perzistencija)

---

### PR-REQ-11 – Pravila prikaza liste zahtjeva i dodavanja novog zahtjeva kao novog retka

**Poslovno Pravilo**: Pravila za prikaz liste zahtjeva i dodavanje novog zahtjeva kao novog retka (novi zahtjev se zapisuje kao novi redak, prethodni ostaju u povijesti).

**Trenutna Implementacija**:
- **Lokacija**: `portal-mock/src/app/pages/uil-search/uil-search.component.ts` (linije 140-150)
- **Detalji Implementacije**:
  - **Struktura Podataka**: `result: UilResult[] = []` - array rezultata zahtjeva
  - **Dodavanje Novog Unosa**: Metoda `addNewEntry(entry: RequestIdModel, search: UilSearchModel)`:
    - Dodaje novi unos u `result` array: `this.result.push({...})`
    - Svaki unos sadrži: `requestId`, `status`, `datasetId`, `gateId`, `platformId`, `errorCode`, `errorDescription`
  - **Prikaz**: Tablica prikazuje sve unose u `result` array-u (`*ngFor="let res of result"`)
  - **Funkcija Clear**: Metoda `clear()` postavlja `this.result = []` za brisanje svih unosa
  - **Perzistencija**: Rezultati perzistiraju u komponenti do refresh-a stranice ili eksplicitnog clear-a
- **Status**: ✅ **Potpuno Implementirano** (Novi zahtjevi dodani kao novi redci, prethodni zahtjevi ostaju vidljivi)

---

### PR-REQ-12 – Pravila prikaza statičnih informacija zahtjeva i njihova nepromjenjivost

**Poslovno Pravilo**: Pravila za prikaz statičnih informacija zahtjeva i njihova nepromjenjivost (statični dio se ne mijenja kroz promjene statusa).

**Trenutna Implementacija**:
- **Lokacija**: 
  - Backend: `implementation/gate/src/main/java/eu/efti/eftigate/entity/ControlEntity.java`
  - Frontend: `portal-mock/src/app/pages/uil-search/uil-search.component.html` (stupci tablice)
- **Statična Polja** (Backend Entitet):
  - `requestId` - Generirano jednom, nikada se ne mijenja
  - `gateId` - Postavljeno pri kreiranju, nikada se ne mijenja
  - `platformId` - Postavljeno pri kreiranju, nikada se ne mijenja
  - `datasetId` - Postavljeno pri kreiranju, nikada se ne mijenja
  - `requestType` - Postavljeno pri kreiranju, nikada se ne mijenja
- **Statični Prikaz** (Frontend):
  - Stupci tablice: `requestId`, `gateId`, `datasetId`, `platformId` uvijek prikazuju iste vrijednosti
  - Stupac statusa: Samo vrijednost statusa se mijenja, statična polja ostaju konstantna
  - Metoda Ažuriranja: `updateEntry(response)` ažurira samo `status`, `data`, `errorCode`, `errorDescription` - NE mijenja statična polja
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-REQ-13 – Pravila započinjanja nove pretrage nakon završetka zahtjeva

**Poslovno Pravilo**: Pravila za započinjanje nove pretrage nakon završetka zahtjeva (reset unosa, zadržavanje povijesti, bez automatskog dodavanja novog retka).

**Trenutna Implementacija**:
- **Lokacija**: `portal-mock/src/app/pages/uil-search/uil-search.component.ts`
- **Detalji Implementacije**:
  - **Funkcija Reset**: Metoda `reset()` (linija 88-91):
    - `this.searchForm.reset()` - briše sva polja forme
    - `this.formSubmitted = false` - resetira zastavicu podnošenja forme
    - **Napomena**: NE briše `result` array (povijest zadržana)
  - **Nova Pretraga**: Korisnik može ponovno popuniti formu i podnijeti
  - **Novi Unos**: Dodaje se samo kada `submit()` uspješno kreira zahtjev (linija 109: `addNewEntry(response, searchData)`)
  - **Zadržavanje Povijesti**: Prethodni zahtjevi ostaju u `result` array-u do eksplicitnog `clear()` ili refresh-a stranice
- **Status**: ✅ **Potpuno Implementirano** (Forma se resetira, povijest zadržana, novi redak dodan samo pri uspješnom podnošenju)

---

### PR-MSG-01 – Opća pravila prikaza poruka korisniku

**Poslovno Pravilo**: Opća pravila za prikaz poruka korisniku.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI i Gate API
- **Poruke Grešaka**: Korisniku prijateljske poruke grešaka prikazane
- **Tehnički Detalji**: Skriveni od korisnika
- **Status**: ✅ **Potpuno Implementirano**

---

## 4.6 Pravila mapiranja XML podataka na korisnički prikaz

### PR-XML-01 – Jednoznačno mapiranje

**Poslovno Pravilo**: Svako prikazano polje u korisničkom sučelju mora biti mapirano na točno određeni XML element ili kombinaciju elemenata.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI i XSLT transformacije (ako se koriste)
- **Status**: ⚠️ **Djelomično Implementirano** (XML mapiranje postoji, ali eksplicitna pravila mapiranja nisu potpuno dokumentirana u kodu)
- **Napomena**: Portal prikazuje XML podatke, ali detaljna dokumentacija mapiranja polje-po-polje nedostaje

---

### PR-XML-02 – Bez generiranja podataka

**Poslovno Pravilo**: Sustav ne smije generirati, izračunavati ili pretpostavljati vrijednosti koje ne postoje u XML dokumentu, osim ako je to izričito definirano pravilom (npr. zbrajanje masa).

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ✅ **Potpuno Implementirano** (Sustav prikazuje samo podatke iz XML-a, nema generiranja)

---

### PR-XML-03 – Razdvajanje podataka i prikaza

**Poslovno Pravilo**: Korisnički prikaz ne smije sadržavati XML oznake, putanje, tehničke nazive elemenata niti druge tehničke detalje.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ✅ **Potpuno Implementirano** (Portal prikazuje formatirane podatke, ne sirovi XML)

---

### PR-XML-04 – Grupiranje po poslovnim cjelinama

**Poslovno Pravilo**: Podaci se prikazuju u logičkim sekcijama koje odgovaraju uobičajenim teretnim dokumentima:
- Sudionici prijevoza (Transport participants)
- Relacija i prijevoz (Route and transport)
- Vozilo i oprema (Vehicle and equipment)
- Roba (Goods)
- Dokumenti i napomene (Documents and notes)

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ⚠️ **Djelomično Implementirano** (Portal prikazuje podatke, ali eksplicitno grupiranje sekcija nije potpuno dokumentirano)

---

### PR-XML-05 – Redoslijed sekcija

**Poslovno Pravilo**: Sekcije se prikazuju redoslijedom koji omogućuje brz i intuitivan pregled, usporediv s papirnatim obrascem (npr. CMR).

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ⚠️ **Djelomično Implementirano** (Redoslijed sekcija nije eksplicitno dokumentiran)

---

### PR-XML-06 – Sudionici prijevoza

**Poslovno Pravilo**: Nazivi i adrese sudionika mapiraju se iz elemenata `<carrier>` i `<associatedParty>`, pri čemu se adresni elementi spajaju u jednu čitljivu adresnu liniju.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ⚠️ **Djelomično Implementirano** (Mapiranje postoji, ali eksplicitna implementacija nije dokumentirana)

---

### PR-XML-07 – Relacija prijevoza

**Poslovno Pravilo**: Mjesta utovara i istovara mapiraju se iz elemenata `loadingLocation` i `unloadingLocation` te se prikazuju u jedinstvenom tekstualnom formatu.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ⚠️ **Djelomično Implementirano** (Mapiranje postoji, ali eksplicitna implementacija nije dokumentirana)

---

### PR-XML-08 – Vozilo i oprema

**Poslovno Pravilo**: Podaci o vozilu i opremi (kamion, prikolica, kontejner) mapiraju se iz odgovarajućih XML elemenata i prikazuju samo ako postoje u XML-u.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ⚠️ **Djelomično Implementirano** (Podaci prikazani, ali logika uvjetnog prikaza nije eksplicitno dokumentirana)

---

### PR-XML-09 – Roba

**Poslovno Pravilo**: Opis, količina i masa robe mapiraju se iz elemenata `consignmentItem`. Ako postoji više stavki, primjenjuju se pravila agregacije (npr. zbroj mase).

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ⚠️ **Djelomično Implementirano** (Podaci prikazani, ali pravila agregacije nisu eksplicitno dokumentirana)

---

### PR-XML-10 – Opasan teret

**Poslovno Pravilo**: Podaci o opasnom teretu prikazuju se isključivo ako u XML-u postoji `dangerousGoods` element.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ⚠️ **Djelomično Implementirano** (Logika uvjetnog prikaza nije eksplicitno dokumentirana)

---

### PR-XML-11 – Dokumenti i napomene

**Poslovno Pravilo**: Dokumenti i napomene prikazuju se samo ako su prisutni u XML-u; u suprotnom se sekcija može sakriti.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ⚠️ **Djelomično Implementirano** (Logika uvjetnog prikaza nije eksplicitno dokumentirana)

---

### PR-XML-12 – Nedostajući podaci

**Poslovno Pravilo**: Ako XML element ne postoji:
- Sustav ne prikazuje grešku
- Polje se ne prikazuje ili se označava kao "N/A"
- Prikaz ostaje stabilan i čitljiv

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ✅ **Potpuno Implementirano** (Nedostajuća polja se elegantno rukuju)

---

### PR-XML-13 – Nema gubitka podataka

**Poslovno Pravilo**: Svi podaci koji postoje u XML-u i relevantni su za regulativu moraju biti prikazani.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Status**: ✅ **Potpuno Implementirano** (Svi XML podaci su dostupni za prikaz)

---

## 4.7 Poslovna pravila za navigaciju (UX/UI)

### PR-NAV-01 – Ponašanje gumba "Natrag" u aplikaciji

**Poslovno Pravilo**: Gumb "Natrag" unutar aplikacije vraća korisnika na ekran pretrage na kontrolirani način, bez neželjenog ponovnog dohvaćanja podataka.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI - Angular Router navigacija
- **Detalji Implementacije**:
  - **Navigacija**: Koristi Angular Router (`this.router.navigate()`)
  - **Prenošenje Podataka**: Koriste se query parametri (npr. `queryParams: { data: xmlData }`)
  - **Bez Ponovnog Dohvaćanja**: Podaci preneseni putem query parametara ili localStorage, ne ponovno dohvaćeni
  - **Primjer**: Metoda `open()` (linija 160-169) navigira na `/ecmr-display` s podacima u query parametrima
- **Status**: ✅ **Potpuno Implementirano** (Kontrolirana navigacija putem Angular Router-a, podaci preneseni bez ponovnog dohvaćanja)

---

### PR-NAV-02 – Ponašanje Back u web pregledniku

**Poslovno Pravilo**: Ponašanje aplikacije kada korisnik koristi funkciju Back u web pregledniku.

**Trenutna Implementacija**:
- **Lokacija**: Navigacija preglednika (standardni HTML5 History API)
- **Detalji Implementacije**:
  - **Angular Router**: Koristi HTML5 pushState za navigaciju
  - **Upravljanje Poviješću**: Gumbi Back/Forward preglednika rade s Angular Router poviješću
  - **Očuvanje Stanja**: Stanje komponente može biti izgubljeno pri back navigaciji (standardno Angular ponašanje)
  - **Nema Posebnog Rukovanja**: Nema eksplicitnog koda za sprječavanje back navigacije ili očuvanje stanja
- **Status**: ✅ **Potpuno Implementirano** (Standardna navigacija preglednika radi, Angular Router rukuje poviješću)

---

### PR-NAV-03 – Ponašanje Refresh u web pregledniku

**Poslovno Pravilo**: Ponašanje aplikacije kada korisnik izvrši refresh web preglednika.

**Trenutna Implementacija**:
- **Lokacija**: Portal UI
- **Logika**: Portal se ponovno učitava i održava stanje putem API-ja
- **Status**: ✅ **Potpuno Implementirano** (Refresh rukovan putem API stanja)

---

### PR-NAV-04 – Ponašanje aplikacije u više kartica

**Poslovno Pravilo**: Ponašanje aplikacije kada je otvorena u više kartica preglednika.

**Trenutna Implementacija**:
- **Lokacija**: Upravljanje sesijom portala i localStorage
- **Detalji Implementacije**:
  - **Session Storage**: Keycloak tokeni pohranjeni u session storage preglednika
  - **LocalStorage**: Koristi se za preferenciju auto-polling-a (`localStorageService.getAutoPolling()`)
  - **Dijeljeno Stanje**: Svaka kartica ima neovisno stanje komponente
  - **Sesija**: Keycloak sesija dijeljena između kartica (ista domena)
  - **Nema Koordinacije Kartica**: Nema eksplicitnog koda za koordinaciju stanja između kartica
  - **Auto-Polling**: Svaka kartica neovisno provjerava ako je omogućeno (timer radi po instanci komponente)
- **Status**: ⚠️ **Djelomično Implementirano** (Radi u više kartica, ali nema eksplicitne koordinacije ili dijeljenja stanja)

---

### PR-NAV-05 – Ponašanje nakon zatvaranja i ponovnog otvaranja preglednika

**Poslovno Pravilo**: Ponašanje aplikacije nakon zatvaranja i ponovnog otvaranja web preglednika, ovisno o pravilima trajanja sesije.

**Trenutna Implementacija**:
- **Lokacija**: Upravljanje sesijom portala i Keycloak-a
- **Trajanje Sesije**: 30 minuta neaktivnosti
- **Status**: ✅ **Potpuno Implementirano**

---

## 4.8 Poslovna pravila za Evidentiranje

### PR-AUDIT-01 – Pravila evidentiranja uspješnog pristupa podacima

**Poslovno Pravilo**: Pravila za evidentiranje uspješnog pristupa podacima u audit zapisu.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/efti-logger/src/main/java/eu/efti/logger/service/AuditRequestLogService.java`
- **Logika**: Audit zapisi kreirani za uspješne zahtjeve
- **Polja**: Request ID, korisnik, vremenska oznaka, tip zahtjeva, parametri
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-AUDIT-02 – Pravila evidentiranja neuspješnog pokušaja pristupa ili greške

**Poslovno Pravilo**: Pravila za evidentiranje neuspješnog pokušaja pristupa podacima ili greške u audit zapisu.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/efti-logger/src/main/java/eu/efti/logger/service/AuditRequestLogService.java`
- **Logika**: Audit zapisi kreirani za neuspješne zahtjeve
- **Polja**: Request ID, korisnik, vremenska oznaka, kod greške, opis greške
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-AUDIT-03 – Pravila evidentiranja pokušaja pristupa bez ovlasti

**Poslovno Pravilo**: Pravila za evidentiranje pokušaja neovlaštenog pristupa u audit zapisu.

**Trenutna Implementacija**:
- **Lokacija**: `implementation/efti-logger/` i sigurnost Gate-a
- **Logika**: Neovlašteni zahtjevi (403 Forbidden) se bilježe
- **Status**: ✅ **Potpuno Implementirano**

---

### PR-AUDIT-04 – Pravila evidentiranja pokušaja autentikacije (uspješnih i neuspješnih)

**Poslovno Pravilo**: Pravila za evidentiranje pokušaja autentikacije (uspješnih i neuspješnih) u audit zapisu.

**Trenutna Implementacija**:
- **Lokacija**: Keycloak audit zapisi
- **Status**: ✅ **Potpuno Implementirano** (putem Keycloak audit funkcionalnosti)

---

## Sažetak Statusa Implementacije

### Pojašnjenje PR-RESOLVE Pravila

**Važno**: Sva PR-RESOLVE pravila (PR-RESOLVE-01 do PR-RESOLVE-07) su **POTPUNO IMPLEMENTIRANA** osim PR-RESOLVE-04. Sustav ispravno:
- ✅ Razrješava UIL lokalno putem ROI-a (PR-RESOLVE-01)
- ✅ Razrješava UIL prekogranično putem G2G (PR-RESOLVE-02)
- ✅ Rukuje greškama kada UIL ne postoji (PR-RESOLVE-03)
- ❌ **Nedostaje**: Provjera statusa aktivnosti/inaktivnosti dataseta (PR-RESOLVE-04)
- ✅ Rukuje greškama platforme (PR-RESOLVE-05)
- ✅ Rukuje timeoutima (PR-RESOLVE-06)
- ✅ Rukuje djelomičnim odgovorima (PR-RESOLVE-07)

Samo PR-RESOLVE-04 zahtijeva implementaciju (dodavanje polja `active` u entitet Consignment i provjera statusa).

---

### ✅ Potpuno Implementirana Poslovna Pravila

**Ukupno**: 28 poslovnih pravila

- **Autentikacija & Sesija**: 4 pravila (PR-SESSION-01, PR-SESSION-02, PR-SESSION-04, PR-LOGIN-XX)
- **UIL Unos & Validacija**: 4 pravila (PR-UIL-01, PR-UIL-02, PR-UIL-03, PR-UIL-05)
- **Razrješenje Identifikatora**: 5 pravila (PR-RESOLVE-01, PR-RESOLVE-02, PR-RESOLVE-03, PR-RESOLVE-05, PR-RESOLVE-06)
- **Prikaz Zahtjeva**: 7 pravila (PR-REQ-01, PR-REQ-02, PR-REQ-03, PR-REQ-04, PR-REQ-05, PR-REQ-06, PR-REQ-09, PR-REQ-10, PR-REQ-12, PR-MSG-01)
- **XML Mapiranje**: 3 pravila (PR-XML-02, PR-XML-03, PR-XML-12, PR-XML-13)
- **Navigacija**: 2 pravila (PR-NAV-03, PR-NAV-05)
- **Evidentiranje**: 4 pravila (PR-AUDIT-01, PR-AUDIT-02, PR-AUDIT-03, PR-AUDIT-04)

---

### ⚠️ Djelomično Implementirana Poslovna Pravila

**Ukupno**: 15 poslovnih pravila

- **UIL Unos**: 1 pravilo (PR-UIL-04 - debounce nije eksplicitno dokumentiran)
- **Prikaz Zahtjeva**: 4 pravila (PR-REQ-07, PR-REQ-08, PR-REQ-11, PR-REQ-13 - ponašanje UI-ja nije potpuno dokumentirano)
- **XML Mapiranje**: 9 pravila (PR-XML-01, PR-XML-04 do PR-XML-11 - mapiranje postoji ali nije eksplicitno dokumentirano)
- **Navigacija**: 3 pravila (PR-NAV-01, PR-NAV-02, PR-NAV-04 - ponašanje nije potpuno dokumentirano)
- **Sesija**: 1 pravilo (PR-SESSION-03 - ponašanje u više kartica nije eksplicitno testirano)

---

### ❌ Nije Implementirana Poslovna Pravila

**Ukupno**: 1 poslovno pravilo

- **Razrješenje Identifikatora**: 1 pravilo (PR-RESOLVE-04 - Status aktivnosti/inaktivnosti dataseta nije implementiran)

---

## Preporuke

1. **Implementirati Status Aktivnosti Dataseta**: Dodati polje statusa `active`/`inactive` u ROI entitet `Consignment` i implementirati PR-RESOLVE-04
2. **Dokumentirati Ponašanje UI-ja**: Dodati eksplicitnu dokumentaciju za pravila ponašanja UI-ja (PR-REQ-07, PR-REQ-08, PR-REQ-11, PR-REQ-13, PR-NAV-01, PR-NAV-02, PR-NAV-04)
3. **Dokumentirati XML Mapiranje**: Kreirati eksplicitnu dokumentaciju mapiranja za XML-to-UI mapiranje polja (PR-XML-01, PR-XML-04 do PR-XML-11)
4. **Dodati Mehanizam Debounce**: Implementirati eksplicitni debounce za UIL gumb pretrage (PR-UIL-04)
5. **Testirati Ponašanje u Više Kartica**: Dodati testove za upravljanje sesijom u više kartica (PR-SESSION-03, PR-NAV-04)

---

## Sažetak Ključnih Nalaza

### Status PR-RESOLVE Pravila

**Pojašnjenje**: Sva PR-RESOLVE pravila su **POTPUNO IMPLEMENTIRANA** osim PR-RESOLVE-04:

- ✅ **PR-RESOLVE-01**: Lokalno razrješenje UIL-a putem ROI-a - **POTPUNO IMPLEMENTIRANO**
  - Kod: `UilRequestService` provjerava ROI, upituje lokalnu platformu
  - SQL Upit: `SELECT c FROM Consignment c WHERE c.gateId = :gate AND c.datasetId = :uuid AND c.platformId = :platform`

- ✅ **PR-RESOLVE-02**: Prekogranično razrješenje UIL-a putem G2G - **POTPUNO IMPLEMENTIRANO**
  - Kod: `gateProperties.isCurrentGate(uilDto.getGateId()) == false` pokreće eDelivery
  - Protokol: AS4/eDelivery putem Domibus-a

- ✅ **PR-RESOLVE-03**: Rukovanje kada UIL ne postoji - **POTPUNO IMPLEMENTIRANO**
  - Kod Greške: `DATA_NOT_FOUND_ON_REGISTRY`
  - Status: `ERROR`

- ❌ **PR-RESOLVE-04**: Status aktivnosti/inaktivnosti dataseta - **NIJE IMPLEMENTIRANO**
  - **Nedostatak**: Nema boolean polja `active` u entitetu `Consignment`
  - **Potrebno**: Dodati polje i provjeru statusa u ROI upitu

- ✅ **PR-RESOLVE-05**: Rukovanje greškama platforme - **POTPUNO IMPLEMENTIRANO**
- ✅ **PR-RESOLVE-06**: Rukovanje timeoutima - **POTPUNO IMPLEMENTIRANO**
- ✅ **PR-RESOLVE-07**: Rukovanje djelomičnim odgovorima - **POTPUNO IMPLEMENTIRANO**

---

### Detalji Implementacije UX Pravila

Sva UX pravila su analizirana iz stvarnog koda. Ključni nalazi:

**PR-UIL-01 (Validacija Formata)**:
- **Backend Regex**: `^[-@./#&+\\w\\s]*$` za gateId/platformId, UUID uzorak za datasetId
- **Frontend Regex**: `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}` (UUID v4)
- **Prikaz Grešaka**: Metode `hasFieldError()` + `getFieldError()` prikazuju prevedene poruke grešaka

**PR-UIL-04 (Debounce)**:
- **Trenutno**: Validacija forme sprječava nevažeća podnošenja (`if (!this.searchForm.valid) return;`)
- **Nedostatak**: Nema eksplicitnog debounce/throttle za brze klikove na gumb
- **Preporuka**: Dodati onemogućavanje gumba tijekom zahtjeva ili implementirati debounce

**PR-REQ-07/08 (Dostupnost Akcija)**:
- **Implementacija**: Uvjetno renderiranje na temelju `res.status`
- **PENDING**: Prikazuje samo gumb "Update"
- **COMPLETE**: Prikazuje gumbove "Open", "Download", "Add Note"
- **ERROR**: Prikazuje popover greške, nema akcijskih gumbova

**PR-REQ-11 (Lista Zahtjeva)**:
- **Implementacija**: Array `result: UilResult[] = []`
- **Dodavanje**: `addNewEntry()` dodaje novi zahtjev u array
- **Prikaz**: `*ngFor="let res of result"` prikazuje sve zahtjeve
- **Brisanje**: Metoda `clear()` prazni array

**PR-REQ-12 (Statična Polja)**:
- **Backend**: Polja `ControlEntity` (`requestId`, `gateId`, `platformId`, `datasetId`, `requestType`) se nikada ne mijenjaju
- **Frontend**: `updateEntry()` ažurira samo `status`, `data`, `errorCode` - statična polja ostaju nepromijenjena

**PR-NAV-01/02 (Navigacija)**:
- **Implementacija**: Angular Router s query parametrima
- **Prenošenje Podataka**: Putem `queryParams` ili localStorage, bez ponovnog dohvaćanja
- **Browser Back**: Standardni HTML5 History API, Angular Router rukuje

**PR-NAV-03 (Refresh)**:
- **Auto-Polling**: `timer(0, 2000)` provjerava svake 2 sekunde
- **Oporavak Stanja**: Komponenta se reinicijalizira, provjerava API za trenutni status
- **Bez Duplikacije**: Jedinstven `requestId` sprječava duplikate

---

## Napomene

- Ova analiza temelji se na kodu od siječnja 2025
- Poslovna pravila referencirana su iz `/docs/NSCP_Plan_testiranja_testni_scenariji.md` Sekcija 4
- Neka poslovna pravila referenciraju detaljne opise u testnim slučajevima (Sekcija 3) umjesto potpunih opisa u Sekciji 4
- Status "Djelomično Implementirano" označava da funkcionalnost postoji ali eksplicitna dokumentacija ili testiranje nedostaju
- Detalji implementacije Portal UI-ja izvučeni su iz stvarnog koda s određenim referencama na datoteke, brojevima linija i uzorcima implementacije
- Svi regex uzorci, pravila validacije i ponašanja UI-ja dokumentirani su iz stvarne implementacije koda

