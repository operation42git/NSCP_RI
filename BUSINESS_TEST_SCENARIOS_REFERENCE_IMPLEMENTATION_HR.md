# Poslovni Testni Scenariji za eFTI Referentnu Implementaciju

## Pregled

Ovaj dokument navodi **poslovne testne scenarije** koji se mogu izvoditi s trenutnom eFTI referentnom implementacijom. To su **ručni/funkcionalni testovi** koji provjeravaju poslovne tokove i slučajeve korištenja.

**Napomena**: Ovi testovi se temelje na onome što trenutna referentna implementacija **stvarno podržava**, a ne na onome što bi moglo biti planirano ili poželjno.

---

## Postavljanje Testnog Okruženja

### Preduvjeti

1. **3 Gate-a** pokrenuta (Borduria, Syldavia, Listenbourg)
2. **3 Platforme** pokrenute (ACME, Massive Dynamic, Umbrella Corporation)
3. **Keycloak** s konfiguriranim realm-ovima
4. **Portal Aplikacija** pokrenuta
5. **Testni Dataseti** učitani na platforme

### Testni Korisnici

| Korisnik | Realm | Lozinka | Uloga |
|----------|-------|---------|-------|
| `user_bo` | eFTI_BO | `Azerty59*123` | ROAD_CONTROLER |
| `user_sy` | eFTI_SY | `Azerty59*123` | ROAD_CONTROLER |
| `user_li` | eFTI_LI | `Azerty59*123` | ROAD_CONTROLER |

### Testni Dataseti

Provjerite da imate testne datasete na platformama:
- Borduria platforma (ACME): `12345678-ab12-4ab6-8999-123456789abc.xml`
- Syldavia platforma (Massive Dynamic): `87654321-ba21-6ba4-9888-987654321cba.xml`
- Listenbourg platforma (Umbrella Corporation): Dodatni testni dataseti

---

## Kategorija 1: Testovi UIL Upita

### Test 1.1: Lokalni UIL Upit (Isti Gate)

**Poslovni Slučaj**: Inspektor treba upitati dataset pohranjen na lokalnoj platformi

**Cilj**: Provjeriti da kontrolor prometa može dohvatiti puni dataset koristeći UIL kada su podaci pohranjeni lokalno

**Postavka**:
- Gate: Borduria
- Platforma: ACME (lokalna platforma)
- Korisnik: `user_bo` iz Bordurije

**Koraci**:
1. Prijavite se u portal kao `user_bo`
2. Idite na stranicu UIL pretrage
3. Unesite UIL informacije:
   - Gate ID: `borduria`
   - Platform ID: `acme`
   - Dataset ID: `12345678-ab12-4ab6-8999-123456789abc`
4. Odaberite subset ID: `full` (ili specifičan subset poput `AT02`, `EU02`)
5. Pošaljite upit
6. Pričekajte da se status promijeni iz `PENDING` → `IN_PROGRESS` → `COMPLETE`
7. Pregledajte vraćeni dataset

**Očekivani Rezultati**:
- ✅ Zahtjev je prihvaćen odmah s `requestId`
- ✅ Status prolazi kroz: PENDING → IN_PROGRESS → COMPLETE
- ✅ Puni XML dataset je vraćen (ili filtriran po subsetu ako je specificiran)
- ✅ Podaci se podudaraju s onim što je pohranjeno na platformi
- ✅ Vrijeme odgovora je brzo (nema komunikacije između gate-ova)

**Provjera**:
- Dataset ID se podudara sa traženim ID-om
- Platform ID se podudara
- Gate ID se podudara
- Sadržaj podataka je ispravan
- Ako je subset ID specificiran, prisutna su samo relevantna polja

---

### Test 1.2: Prekogranični UIL Upit (Različit Gate)

**Poslovni Slučaj**: Inspektor u jednoj zemlji treba podatke pohranjene na platformi druge zemlje

**Cilj**: Provjeriti prekogranični pristup podacima putem eDelivery-a

**Postavka**:
- Tražeći Gate: Borduria
- Ciljni Gate: Syldavia
- Platforma: Massive Dynamic (Syldavia platforma)
- Korisnik: `user_bo` iz Bordurije

**Koraci**:
1. Prijavite se u portal kao `user_bo` (Borduria)
2. Idite na stranicu UIL pretrage
3. Unesite UIL informacije za **Syldavia**:
   - Gate ID: `syldavia`
   - Platform ID: `massivedynamic`
   - Dataset ID: `87654321-ba21-6ba4-9888-987654321cba`
4. Odaberite subset ID: `full`
5. Pošaljite upit
6. Pričekajte ažuriranja statusa (ovo će trajati duže zbog eDelivery-a)
7. Pregledajte vraćeni dataset

**Očekivani Rezultati**:
- ✅ Zahtjev je prihvaćen odmah s `requestId`
- ✅ Status prolazi: PENDING → IN_PROGRESS → COMPLETE
- ✅ Borduria gate šalje eDelivery poruku Syldavia gate-u
- ✅ Syldavia gate upituje svoju platformu
- ✅ Syldavia gate odgovara putem eDelivery-a
- ✅ Puni dataset je vraćen Borduriji
- ✅ Vrijeme odgovora je duže nego lokalni upit (zbog eDelivery overhead-a)

**Provjera**:
- Dataset ID se podudara sa traženim ID-om
- Podaci dolaze s Syldavia platforme
- Prekogranična komunikacija između gate-ova radi putem eDelivery-a
- Integritet podataka je održan preko granica

---

### Test 1.3: UIL Upit s Filtriranjem Subseta

**Poslovni Slučaj**: Inspektor treba samo specifična polja temeljena na profilu regulacije zemlje

**Cilj**: Provjeriti da filtriranje subseta radi ispravno

**Postavka**:
- Gate: Borduria
- Platforma: ACME
- Korisnik: `user_bo`
- Subset ID: `AT02` (austrijski subset) ili `EU02` (EU subset)

**Koraci**:
1. Prijavite se kao `user_bo`
2. Idite na UIL pretragu
3. Unesite UIL informacije
4. Odaberite subset ID: `AT02` (umjesto `full`)
5. Pošaljite upit
6. Pričekajte odgovor
7. Usporedite vraćene podatke s punim datasetom

**Očekivani Rezultati**:
- ✅ Odgovor sadrži samo polja označena s `subset id="AT02"` u XSD-u
- ✅ Polja koja nisu u AT02 subsetu su filtrirana
- ✅ XML je valjan ali sadrži manje polja nego puni dataset
- ✅ Filtriranje se događa na razini platforme

**Provjera**:
- Provjerite koja su polja prisutna
- Provjerite da se polja podudaraju s XSD subset anotacijama
- Usporedite s punim datasetom da vidite što je filtrirano

**Dostupni Subset ID-evi za Testiranje**:
- `AT02`, `AT05`, `AT06`, `AT07`, `AT08` (Austrija)
- `HR01`, `HR05a`, `HR05B`, `HR05c` (Hrvatska)
- `SI02`, `SI05`, `SI06` (Slovenija)
- `EU02`, `EU05a`, `EU05b`, `EU05c` (Europska Unija)
- `identifier` (samo identifier subset)
- `full` (kompletan dataset)

---

### Test 1.4: UIL Upit s Višestrukim Subsetima

**Poslovni Slučaj**: Inspektor treba podatke koji odgovaraju višestrukim subset zahtjevima

**Cilj**: Provjeriti da unija filtriranja radi (ILI logika)

**Postavka**:
- Gate: Borduria
- Platforma: ACME
- Subset ID-ovi: `["EU02", "identifier"]` ili `["HR01", "identifier"]`

**Koraci**:
1. Pošaljite UIL upit s višestrukim subset ID-ovima
2. Pričekajte odgovor
3. Analizirajte vraćene podatke

**Očekivani Rezultati**:
- ✅ Odgovor sadrži polja koja pripadaju **BILO KOM** od traženih subsetova (unija)
- ✅ Polja označena s `EU02` ILI `identifier` su uključena
- ✅ Polja označena ni s jednim su isključena

**Provjera**:
- Provjerite da unija logika radi ispravno
- Provjerite da su sva tražena subset polja prisutna

---

### Test 1.5: UIL Upit - Dataset Nije Pronađen

**Poslovni Slučaj**: Inspektor upituje dataset koji ne postoji

**Cilj**: Provjeriti rukovanje greškama za nedostajuće podatke

**Koraci**:
1. Pošaljite UIL upit s nepostojećim `datasetId`
2. Pričekajte odgovor

**Očekivani Rezultati**:
- ✅ Zahtjev je prihvaćen (vraća `requestId`)
- ✅ Status na kraju postaje `ERROR`
- ✅ Poruka greške označava da dataset nije pronaden
- ✅ Odgovarajući kod greške je vraćen

**Provjera**:
- Status greške je postavljen ispravno
- Poruka greške je jasna i djelotvorna
- Greška je zabilježena za audit

---

### Test 1.6: UIL Upit - Nevažeći Gate/Platforma

**Poslovni Slučaj**: Inspektor daje netočan gate ili platform ID

**Cilj**: Provjeriti validaciju UIL komponenti

**Koraci**:
1. Pošaljite UIL upit s nevažećim `gateId` ili `platformId`
2. Provjerite odgovor

**Očekivani Rezultati**:
- ✅ Validacija zahtjeva ne uspijeva
- ✅ Greška je vraćena odmah (prije asinkrone obrade)
- ✅ Jasna poruka greške označava nevažeći parametar

---

## Kategorija 2: Testovi Pretrage Identifikatora

### Test 2.1: Pretraga Identifikatora - Samo Lokalno

**Poslovni Slučaj**: Inspektor pretražuje ID vozila/opreme u vlastitoj zemlji

**Cilj**: Provjeriti da pretraga identifikatora radi za lokalni ROI

**Postavka**:
- Gate: Borduria
- Korisnik: `user_bo`
- Identifikator: Prethodno učitani ID vozila (npr. "ABC123")

**Preduvjet**: Prvo učitajte identifier podatke u ROI (putem platforme `saveIdentifiers` API-ja)

**Koraci**:
1. Prijavite se kao `user_bo`
2. Idite na stranicu Pretrage Identifikatora
3. Unesite kriterije pretrage:
   - Identifikator: `ABC123`
   - Tip Identifikatora: `MEANS` (ili `EQUIPMENT`, `CARRIED`)
   - Transportni Mod: `3` (Cestovni)
   - Zemlja Registracije: `HR` (opcionalno)
   - Opasna Roba: `false` (opcionalno)
4. Pošaljite pretragu
5. Pričekajte rezultate
6. Pregledajte vraćeni popis UIL-ova

**Očekivani Rezultati**:
- ✅ Zahtjev je prihvaćen s `requestId`
- ✅ Status napreduje do `COMPLETE`
- ✅ Vraća popis `Consignment` objekata koji odgovaraju identifikatoru
- ✅ Svaki rezultat sadrži:
   - **UIL komponente**: `gateId`, `platformId`, `datasetId`
   - **ROI podaci**: Datum prihvaćanja, datum dostave, informacije o transportnom sredstvu, informacije o opremi
- ✅ Rezultati samo s lokalnog gate-a (nema prekogranične pretrage)

**Provjera**:
- Svi rezultati odgovaraju kriterijima pretrage
- UIL informacije su kompletne i ispravne
- ROI podaci su prisutni za svaki rezultat

---

### Test 2.2: Pretraga Identifikatora - Multi-Gate (Broadcast)

**Poslovni Slučaj**: Inspektor pretražuje identifikator kroz više zemalja

**Cilj**: Provjeriti prekograničnu pretragu identifikatora putem broadcasta

**Postavka**:
- Tražeći Gate: Borduria
- Ciljni Gate-ovi: Syldavia, Listenbourg
- Identifikator: Isti identifikator postoji u više gate-ova

**Preduvjet**: Isti identifikator mora biti učitán u ROI u više gate-ova

**Koraci**:
1. Prijavite se kao `user_bo` (Borduria)
2. Unesite kriterije pretrage identifikatora
3. Pošaljite pretragu
4. Pričekajte rezultate (traje duže zbog prekograničnih upita)
5. Pregledajte konsolidirane rezultate

**Očekivani Rezultati**:
- ✅ Zahtjev je prihvaćen s `requestId`
- ✅ Borduria prvo pretražuje lokalni ROI
- ✅ Borduria emitira `IdentifierQuery` Syldaviji i Listenbourgu putem eDelivery-a
- ✅ Svaki gate pretražuje svoj ROI
- ✅ Svaki gate odgovara s odgovarajućim rezultatima
- ✅ Borduria konsolidira sve rezultate
- ✅ Status postaje `COMPLETE`
- ✅ Vraća popis UIL-ova sa **svih gate-ova** gdje je identifikator pronaden

**Provjera**:
- Rezultati s više gate-ova su prisutni
- Svaki rezultat ima ispravan gate indikator
- Konsolidirani popis je kompletan
- Nema dupliciranih rezultata

---

### Test 2.3: Pretraga Identifikatora - Višestruki Rezultati (Isti Gate)

**Poslovni Slučaj**: Isti identifikator korišten u višestrukim pošiljkama

**Cilj**: Provjeriti višestruke rezultate za isti identifikator

**Postavka**:
- Učitajte isti identifikator (npr. vozilo "ABC123") u ROI više puta s različitim dataset ID-ovima

**Koraci**:
1. Izvedite pretragu identifikatora za "ABC123"
2. Pregledajte rezultate

**Očekivani Rezultati**:
- ✅ Vraća višestruke `Consignment` objekte
- ✅ Svaki rezultat ima različit `datasetId`
- ✅ Svi rezultati pokazuju isti identifikator ali različite pošiljke
- ✅ ROI podaci (datumi, oprema) mogu se razlikovati između rezultata

**Provjera**:
- Višestruki rezultati su vraćeni
- Svaki rezultat je jedinstven (različit dataset ID)
- Svi odgovaraju kriterijima pretrage

---

### Test 2.4: Pretraga Identifikatora - S Filtrima

**Poslovni Slučaj**: Inspektor želi suziti rezultate koristeći dodatne kriterije

**Cilj**: Provjeriti filtriranje po modu, zemlji, opasnoj robi

**Postavka**:
- Višestruki identifikatori postoje u ROI s različitim atributima

**Testni Scenariji**:

**Scenarij A: Filtriranje po Kodu Moda**
- Pretraga: Identifikator "ABC123" + Kod Moda `3` (Cestovni)
- Očekivano: Samo rezultati cestovnog transporta

**Scenarij B: Filtriranje po Zemlji Registracije**
- Pretraga: Identifikator "ABC123" + Zemlja Registracije `HR`
- Očekivano: Samo vozila registrirana u Hrvatskoj

**Scenarij C: Filtriranje po Opasnoj Robi**
- Pretraga: Identifikator "ABC123" + Opasna Roba `true`
- Očekivano: Samo pošiljke s opasnom robom

**Scenarij D: Kombinirani Filteri**
- Pretraga: Identifikator "ABC123" + Mod `3` + Zemlja `HR` + Opasna Roba `false`
- Očekivano: Rezultati koji odgovaraju SVIM kriterijima

**Koraci**:
1. Izvedite pretragu identifikatora s jednim filterom
2. Provjerite da rezultati odgovaraju filteru
3. Izvedite pretragu s kombiniranim filterima
4. Provjerite da rezultati odgovaraju svim filterima

**Očekivani Rezultati**:
- ✅ Filteri rade ispravno pojedinačno
- ✅ Kombinirani filteri koriste I logiku (svi moraju odgovarati)
- ✅ Rezultati su prikladno filtrirani

---

### Test 2.5: Pretraga Identifikatora - Neosjetljivo na Velika/Mala Slova

**Poslovni Slučaj**: Inspektor pretražuje s različitom veličinom slova nego što je pohranjeno

**Cilj**: Provjeriti podudaranje neosjetljivo na velika/mala slova

**Postavka**:
- Identifikator pohranjen u ROI kao: "ABC123"

**Testni Slučajevi**:
- Pretraga: "abc123" (mala slova)
- Pretraga: "ABC123" (velika slova)
- Pretraga: "AbC123" (miješana slova)

**Koraci**:
1. Pretražite s malim slovima
2. Pretražite s velikim slovima
3. Pretražite s miješanim slovima
4. Usporedite rezultate

**Očekivani Rezultati**:
- ✅ Sve varijacije veličine slova vraćaju iste rezultate
- ✅ Podudaranje je neosjetljivo na velika/mala slova
- ✅ Rezultati su konzistentni

---

### Test 2.6: Pretraga Identifikatora - Rezultati Nisu Pronađeni

**Poslovni Slučaj**: Inspektor pretražuje identifikator koji ne postoji

**Cilj**: Provjeriti rukovanje scenarijem bez podudaranja

**Koraci**:
1. Pretražite identifikator koji ne postoji u nijednom ROI-u
2. Pričekajte odgovor

**Očekivani Rezultati**:
- ✅ Zahtjev je prihvaćen
- ✅ Status postaje `COMPLETE`
- ✅ Vraća prazan popis (`identifiers: []`)
- ✅ Nema grešaka (prazan rezultat je valjan)

---

## Kategorija 3: Testovi Dvokoračnog Toka Radnji (Pretraga Identifikatora → UIL Upit)

### Test 3.1: Kompletan Dvokoračni Tok Radnji

**Poslovni Slučaj**: Inspektor pretražuje po identifikatoru, pregledava rezultate s ROI informacijama, zatim odabire jedan da dobije puni dataset

**Cilj**: Provjeriti end-to-end tok radnji od pretrage identifikatora do dohvaćanja punog dataseta

**Postavka**:
- Identifikator: "ABC123" postoji u ROI-u
- Višestruke pošiljke koriste ovaj identifikator

**Koraci**:

**Korak 1: Pretraga Identifikatora**
1. Prijavite se kao `user_bo`
2. Idite na stranicu Pretrage Identifikatora
3. Pretražite identifikator "ABC123"
4. Pričekajte rezultate
5. Pregledajte popis rezultata koji pokazuju:
   - Gate ID, Platform ID, Dataset ID (UIL komponente)
   - Datum prihvaćanja, Datum dostave
   - Informacije o transportnom sredstvu
   - Informacije o opremi

**Korak 2: Pregled ROI Informacija**
6. Kliknite "Display" ili "Open" na jednom rezultatu
7. Portal navigira na stranicu prikaza identifikatora
8. Pregledajte kompletne ROI informacije:
   - Svi datumi
   - Svi transportni pokreti
   - Svi detalji opreme
   - UIL komponente (gate, platforma, dataset)

**Korak 3: UIL Upit**
9. Kliknite gumb "Go to UIL"
10. Portal navigira na stranicu UIL pretrage
11. Forma je **unaprijed popunjena** s:
    - Dataset ID: Iz rezultata identifikatora
    - Gate ID: Iz rezultata identifikatora
    - Platform ID: Iz rezultata identifikatora
12. Provjerite da su unaprijed popunjene vrijednosti ispravne
13. Opcionalno promijenite subset ID (zadano: `full`)
14. Pošaljite UIL upit
15. Pričekajte odgovor
16. Pregledajte **puni dataset** (ne samo identifier subset)

**Očekivani Rezultati**:
- ✅ Korak 1: Pretraga identifikatora vraća višestruke rezultate s ROI informacijama
- ✅ Korak 2: Stranica ROI informacija prikazuje kompletne identifier subset podatke
- ✅ Korak 3: UIL forma za pretragu je unaprijed popunjena ispravno
- ✅ Korak 3: Puni dataset je vraćen (sadrži više podataka nego identifier subset)
- ✅ Puni dataset uključuje sva polja (ne samo identifikatore)

**Provjera**:
- UIL komponente su pravilno izvučene iz rezultata identifikatora
- Unaprijed popunjena forma ima ispravne vrijednosti
- Puni dataset sadrži podatke identifikatora PLUS dodatna polja
- Kompletan tok radnji funkcionira end-to-end

---

### Test 3.2: Dvokoračni Tok Radnji - Prekogranični

**Poslovni Slučaj**: Inspektor pretražuje identifikator, pronalazi rezultat u stranom gate-u, upituje puni dataset iz stranog gate-a

**Postavka**:
- Identifikator postoji u Syldavia ROI-u
- Inspektor je u Borduriji

**Koraci**:
1. U Borduriji, pretražite identifikator
2. Pronađite rezultat iz Syldavije (strani gate)
3. Kliknite "Display" - provjerite ROI informacije iz Syldavije
4. Kliknite "Go to UIL" - UIL upit će biti za Syldavia dataset
5. Pošaljite UIL upit
6. Provjerite da prekogranični UIL upit radi

**Očekivani Rezultati**:
- ✅ Pretraga identifikatora pronalazi rezultat u stranom gate-u
- ✅ ROI informacije su prikazane ispravno
- ✅ UIL upit se izvodi prekogranično
- ✅ Puni dataset je dohvaćen iz stranog gate-a putem eDelivery-a

---

## Kategorija 4: Testovi Učitavanja Podataka Platforme

### Test 4.1: Platforma Sprema Identifikatore u ROI

**Poslovni Slučaj**: Platforma učitava identifier podatke u gate ROI

**Cilj**: Provjeriti da platforma može registrirati identifikatore u gate ROI

**Postavka**:
- Platforma: ACME (povezana s Borduria gate-om)
- Platforma ima dataset s identifikatorima

**Koraci**:
1. Platforma poziva `PUT /api/platform/v0/consignments/{datasetId}`
2. Platforma šalje identifier subset podatke:
   - Dataset ID
   - Gate ID, Platform ID
   - ID transportnog sredstva
   - ID-ovi opreme
   - Datumi (prihvaćanje, dostava)
   - Transportni mod
   - Indikator opasne robe
3. Gate prima i sprema u ROI bazu podataka
4. Provjerite da su podaci pravilno pohranjeni

**Očekivani Rezultati**:
- ✅ Zahtjev platforme je prihvaćen
- ✅ Gate sprema podatke u ROI bazu podataka
- ✅ Identifier podaci su dostupni za pretragu identifikatora
- ✅ Audit log je kreiran

**Provjera**:
- Upitajte ROI bazu podataka direktno da provjerite podatke
- Izvedite pretragu identifikatora s učitanim identifikatorom
- Provjerite da pretraga pronalazi učitane podatke

---

### Test 4.2: Platforma Ažurira Postojeće Identifier Podatke

**Poslovni Slučaj**: Platforma ažurira identifier informacije za postojeći dataset

**Postavka**:
- Identifikator već postoji u ROI-u

**Koraci**:
1. Platforma ponovno učitava isti dataset ID s ažuriranim podacima
2. Provjerite da su podaci ažurirani (ne duplicirani)

**Očekivani Rezultati**:
- ✅ Postojeći identifikator je ažuriran (ne dupliciran)
- ✅ UIL ostaje isti
- ✅ Ažurirani podaci se odražavaju u pretrazi identifikatora

---

## Kategorija 5: Testovi Prekogranične Komunikacije

### Test 5.1: Gate A Upituje Podatke Gate-a B

**Poslovni Slučaj**: Borduria upituje podatke pohranjene u Syldaviji

**Cilj**: Provjeriti komunikaciju između gate-ova putem eDelivery-a

**Postavka**:
- Tražeći: Borduria
- Ciljni: Syldavia

**Koraci**:
1. Iz Borduria portala, pošaljite UIL upit za Syldavia dataset
2. Pratite tok poruka:
   - Borduria → eDelivery → Syldavia
   - Syldavia → Platforma → Syldavia
   - Syldavia → eDelivery → Borduria
3. Provjerite end-to-end komunikaciju

**Očekivani Rezultati**:
- ✅ eDelivery poruke su poslane i primljene
- ✅ ID-ovi poruka su praćeni
- ✅ Komunikacija je sigurna (AS4 protokol)
- ✅ Odgovor se vraća ispravno

**Provjera**:
- Provjerite Domibus logove za razmjenu poruka
- Provjerite da se ID-ovi poruka podudaraju
- Provjerite status dostave

---

### Test 5.2: Gate Prima UIL Upit od Stranog Gate-a

**Poslovni Slučaj**: Syldavia prima upit iz Bordurije i odgovara

**Cilj**: Provjeriti da gate može primiti i obraditi vanjske upite

**Postavka**:
- Upituje: Borduria
- Prima: Syldavia

**Koraci**:
1. Iz Bordurije, pošaljite UIL upit za Syldavia dataset
2. Pratite Syldavia gate logove
3. Provjerite Syldavia:
   - Prima upit putem eDelivery-a
   - Obradjuje upit
   - Upituje lokalnu platformu
   - Šalje odgovor natrag putem eDelivery-a

**Očekivani Rezultati**:
- ✅ Syldavia prima upit ispravno
- ✅ Upit je usmjeren na lokalnu platformu
- ✅ Odgovor je poslan natrag tražećem gate-u
- ✅ Korelacija poruka radi (odgovor odgovara zahtjevu)

---

### Test 5.3: Gate Prima Identifier Upit od Stranog Gate-a

**Poslovni Slučaj**: Syldavia prima identifier pretražni upit iz Bordurije

**Postavka**:
- Upituje: Borduria
- Prima: Syldavia

**Koraci**:
1. Iz Bordurije, pošaljite identifier pretragu
2. Provjerite da Borduria emitira Syldaviji
3. Provjerite Syldavia:
   - Prima `IdentifierQuery` putem eDelivery-a
   - Pretražuje lokalni ROI
   - Šalje `IdentifierResponse` natrag
4. Provjerite konsolidirane rezultate

**Očekivani Rezultati**:
- ✅ Identifier upit je ispravno emitiran
- ✅ Strani gate pretražuje svoj ROI
- ✅ Rezultati su ispravno konsolidirani

---

## Kategorija 6: Testovi Filtriranja Subseta

### Test 6.1: Usporedba Različitih Subseta iz Isto G Dataseta

**Poslovni Slučaj**: Isti dataset filtriran različitim propisima zemalja vraća različita polja

**Cilj**: Provjeriti da filtriranje subseta proizvodi različite rezultate

**Postavka**:
- Isti dataset ID
- Testirajte s višestrukim subset ID-ovima

**Koraci**:
1. Upitajte dataset s subsetom `full`
2. Spremite rezultat
3. Upitajte isti dataset s subsetom `AT02`
4. Upitajte isti dataset s subsetom `EU02`
5. Upitajte isti dataset s subsetom `identifier`
6. Usporedite sve rezultate

**Očekivani Rezultati**:
- ✅ `full` - Sadrži sva polja
- ✅ `AT02` - Sadrži samo AT02 označena polja (manje polja)
- ✅ `EU02` - Sadrži samo EU02 označena polja (različita polja)
- ✅ `identifier` - Sadrži samo identifier subset polja (minimalno)
- ✅ Svaki subset vraća valjan XML
- ✅ Razlike u poljima su jasne

**Provjera**:
- Brojite polja u svakom rezultatu
- Provjerite da se polja podudaraju s XSD anotacijama
- Dokumentirajte koja su polja prisutna u svakom subsetu

---

### Test 6.2: Filtriranje Subseta - Prekogranično

**Poslovni Slučaj**: Inspektor u jednoj zemlji traži subset iz dataseta druge zemlje

**Postavka**:
- Tražeći: Borduria
- Ciljni: Syldavia
- Subset: `AT02` (austrijski subset)

**Koraci**:
1. Pošaljite prekogranični UIL upit s subsetom `AT02`
2. Provjerite da se filtriranje događa na ciljnom gate-u/platformi
3. Provjerite da su vraćena samo subset polja

**Očekivani Rezultati**:
- ✅ Prekogranični upit radi s subsetom
- ✅ Filtriranje se događa na ciljnoj platformi
- ✅ Samo subset polja su prenesena natrag

---

## Kategorija 7: Rukovanje Greškama i Rubni Slučajevi

### Test 7.1: Timeout Zahtjeva

**Poslovni Slučaj**: Platforma ne odgovara unutar vremena timeouta

**Postavka**:
- Koristite dataset ID koji završava s "1" (pokreće timeout u simulatoru)

**Koraci**:
1. Pošaljite UIL upit
2. Pričekajte timeout

**Očekivani Rezultati**:
- ✅ Zahtjev je prihvaćen
- ✅ Status na kraju postaje `TIMEOUT`
- ✅ Odgovarajuća poruka greške
- ✅ Zahtjev je ponovno pokušan (ako je konfigurirano)

---

### Test 7.2: Platforma Nije Dostupna

**Poslovni Slučaj**: Ciljana platforma je neaktivna

**Postavka**:
- Zaustavite ciljanu platformu servis

**Koraci**:
1. Pošaljite UIL upit za nedostupnu platformu
2. Pratite rukovanje greškama

**Očekivani Rezultati**:
- ✅ Zahtjev je prihvaćen
- ✅ Status postaje `ERROR` nakon pokušaja ponovnog pokušaja
- ✅ Poruka greške označava da platforma nije dostupna
- ✅ Greška je zabilježena

---

### Test 7.3: Nevažeći XML Odgovor

**Poslovni Slučaj**: Platforma vraća neispravan XML

**Postavka**:
- Konfigurirajte platformu da vrati nevažeći XML (ako je moguće)

**Koraci**:
1. Pošaljite UIL upit
2. Primite nevažeći odgovor
3. Provjerite rukovanje greškama

**Očekivani Rezultati**:
- ✅ Nevažeći XML je detektiran
- ✅ Status postaje `ERROR`
- ✅ Poruka greške označava neuspjeh validacije XML-a
- ✅ Zahtjev nije pohranjen kao uspješan

---

### Test 7.4: Istovremeni Zahtjevi

**Poslovni Slučaj**: Višestruki korisnici šalju zahtjeve istovremeno

**Koraci**:
1. Pošaljite 5-10 UIL upita istovremeno
2. Pratite obradu
3. Provjerite da su svi obrađeni

**Očekivani Rezultati**:
- ✅ Svi zahtjevi su prihvaćeni
- ✅ Svaki dobiva jedinstven `requestId`
- ✅ Svi su obrađeni (mogu biti u redu čekanja)
- ✅ Rezultati su vraćeni ispravno

---

## Kategorija 8: Testovi Portal UI-ja

### Test 8.1: Prijava i Autentifikacija

**Poslovni Slučaj**: Korisnik se prijavljuje u portal aplikaciju

**Koraci**:
1. Navigirajte na portal URL
2. Unesite vjerodajnice
3. Dovršite Keycloak login tok
4. Provjerite pristup portalu

**Očekivani Rezultati**:
- ✅ Login preusmjerava na Keycloak
- ✅ Keycloak validira vjerodajnice
- ✅ JWT token je primljen
- ✅ Portal se učitava nakon autentifikacije
- ✅ Korisnička uloga je prikazana (ako UI to prikazuje)

---

### Test 8.2: Portal - UIL Pretraga Forma

**Poslovni Slučaj**: Korisnik popunjava UIL pretražnu formu

**Koraci**:
1. Navigirajte na UIL pretražnu stranicu
2. Popunite polja forme:
   - Dataset ID (UUID format)
   - Gate ID (dropdown)
   - Platform ID (dropdown)
3. Pošaljite formu
4. Provjerite validaciju forme

**Očekivani Rezultati**:
- ✅ Forma validira UUID format za dataset ID
- ✅ Dropdown-ovi prikazuju dostupne gate-ove/platforme
- ✅ Nevažeći unos prikazuje poruke grešaka
- ✅ Gumb za slanje je onemogućen dok forma nije valjana
- ✅ Nakon slanja, forma prikazuje stanje učitavanja

---

### Test 8.3: Portal - Identifier Pretraga Forma

**Poslovni Slučaj**: Korisnik popunjava identifier pretražnu formu

**Koraci**:
1. Navigirajte na Identifier pretražnu stranicu
2. Popunite formu:
   - Identifikator (tekst)
   - Tip Identifikatora (multi-select)
   - Kod Moda (dropdown)
   - Zemlja Registracije (dropdown)
   - Opasna Roba (radio)
3. Pošaljite formu

**Očekivani Rezultati**:
- ✅ Forma validira format identifikatora
- ✅ Multi-select radi ispravno
- ✅ Sva opcionalna polja su stvarno opcionalna
- ✅ Forma se šalje s ispravnim formatom podataka

---

### Test 8.4: Portal - Prikaz Rezultata

**Poslovni Slučaj**: Korisnik pregledava rezultate upita

**Koraci**:
1. Pošaljite upit (UIL ili Identifier)
2. Pričekajte da status postane COMPLETE
3. Pregledajte rezultate u portalu

**Očekivani Rezultati**:
- ✅ Ažuriranja statusa su prikazana
- ✅ Rezultati su prikazani u čitljivom formatu
- ✅ XML podaci su transformirani u HTML (ako se koristi XSLT)
- ✅ Rezultati su skrolabilni/paginirani ako su veliki
- ✅ Opcije preuzimanja/pregleda su dostupne

---

### Test 8.5: Portal - Auto-Polling

**Poslovni Slučaj**: Portal automatski provjerava status zahtjeva

**Koraci**:
1. Omogućite auto-polling (ako je konfigurabilan)
2. Pošaljite upit
3. Promatrajte ažuriranja statusa

**Očekivani Rezultati**:
- ✅ Portal provjerava status svakih X sekundi
- ✅ Status se automatski ažurira u UI-ju
- ✅ Nema potrebe za ručnim osvježavanjem
- ✅ Polling se zaustavlja kada je status COMPLETE ili ERROR

---

### Test 8.6: Portal - Navigacija Između Stranica

**Poslovni Slučaj**: Korisnik navigira od pretrage identifikatora do UIL pretrage

**Koraci**:
1. Izvedite pretragu identifikatora
2. Kliknite "Display" na rezultatu
3. Pregledajte stranicu ROI informacija
4. Kliknite gumb "Go to UIL"
5. Provjerite da je UIL forma unaprijed popunjena

**Očekivani Rezultati**:
- ✅ Navigacija radi glatko
- ✅ Podaci su pravilno preneseni između stranica
- ✅ Unaprijed popunjavanje forme radi
- ✅ Browser back/forward gumbi rade

---

## Kategorija 9: Testovi Autentifikacije i Autorizacije

### Test 9.1: Valjana Korisnička Prijava

**Poslovni Slučaj**: Autorizirani korisnik se prijavljuje

**Koraci**:
1. Prijavite se s valjanim vjerodajnicama (`user_bo` / `Azerty59*123`)
2. Provjerite pristup

**Očekivani Rezultati**:
- ✅ Prijava uspijeva
- ✅ JWT token je valjan
- ✅ Korisnik može pristupiti portal funkcijama
- ✅ Korisnička uloga je prepoznata

---

### Test 9.2: Nevažeće Vjerodajnice

**Poslovni Slučaj**: Korisnik unosi pogrešnu lozinku

**Koraci**:
1. Pokušajte prijavu s pogrešnom lozinkom
2. Provjerite rukovanje greškama

**Očekivani Rezultati**:
- ✅ Prijava ne uspijeva
- ✅ Jasna poruka greške
- ✅ Korisnik nije autentificiran
- ✅ Portal nije dostupan

---

### Test 9.3: Istek Tokena

**Poslovni Slučaj**: Korisnička sesija istječe

**Koraci**:
1. Uspješno se prijavite
2. Pričekajte istek tokena (ili ručno isteknete token)
3. Pokušajte koristiti portal

**Očekivani Rezultati**:
- ✅ Nakon isteka, zahtjevi ne uspijevaju s 401 Unauthorized
- ✅ Korisnik je preusmjeren na prijavu
- ✅ Korisnik se može ponovno autentificirati

---

### Test 9.4: Pristup Temeljen na Ulozi (Ako je Implementirano)

**Poslovni Slučaj**: Različite uloge imaju različit pristup

**Napomena**: Trenutna implementacija ima minimalan pristup temeljen na ulozi. Postoje samo osnovne uloge.

**Koraci**:
1. Prijavite se kao različiti korisnici s različitim ulogama
2. Provjerite pristup funkcijama

**Očekivani Rezultati**:
- ✅ `ROAD_CONTROLER` može pristupiti UIL i Identifier upitima
- ✅ Uloge su izvučene iz JWT tokena
- ✅ Neautorizirani zahtjevi su odbijeni

**Ograničenje**: Trenutna implementacija nema filtriranje podataka temeljeno na ulozi ili UI razlike.

---

## Kategorija 10: Testovi Integriteta Podataka

### Test 10.1: Konzistentnost Podataka - UIL Upit

**Poslovni Slučaj**: Provjeriti da se vraćeni podaci podudaraju s onim što je pohranjeno na platformi

**Koraci**:
1. Upitajte dataset putem UIL-a
2. Usporedite vraćene podatke s datotekom platforme
3. Provjerite integritet

**Očekivani Rezultati**:
- ✅ Vraćeni podaci se podudaraju s izvornom datotekom
- ✅ Nema korupcije podataka
- ✅ XML je dobro formiran i valjan
- ✅ Sva tražena polja su prisutna (ako su u subsetu)

---

### Test 10.2: Konzistentnost Podataka - Pretraga Identifikatora

**Poslovni Slučaj**: Provjeriti da pretraga identifikatora vraća ispravne UIL informacije

**Koraci**:
1. Izvedite pretragu identifikatora
2. Izvucite UIL iz rezultata
3. Izvedite UIL upit s izvučenim UIL-om
4. Provjerite da se dataset podudara s rezultatom identifikatora

**Očekivani Rezultati**:
- ✅ UIL izvučen iz pretrage identifikatora je ispravan
- ✅ UIL upit s izvučenim UIL-om vraća ispravan dataset
- ✅ Konzistentnost podataka je održana

---

### Test 10.3: Konzistentnost Filtriranja Subseta

**Poslovni Slučaj**: Provjeriti da je isti dataset s različitim subsetima konzistentan

**Koraci**:
1. Upitajte dataset s `full` subsetom
2. Upitajte isti dataset s specifičnim subsetom
3. Provjerite da su subset polja podskup punih polja

**Očekivani Rezultati**:
- ✅ Subset polja su sva prisutna u punom datasetu
- ✅ Nema novih polja u subsetu koja nisu u punom
- ✅ Vrijednosti polja se podudaraju između punog i subseta

---

## Kategorija 11: Testovi Performansi i Skalabilnosti

### Test 11.1: Vrijeme Odgovora - Lokalni Upit

**Poslovni Slučaj**: Izmjeriti performanse lokalnih upita

**Koraci**:
1. Pošaljite višestruke lokalne UIL upite
2. Izmjerite vrijeme odgovora
3. Izračunajte prosjek

**Očekivani Rezultati**:
- ✅ Vrijeme odgovora je razumno (< 5 sekundi za lokalno)
- ✅ Vrijeme odgovora je konzistentno
- ✅ Nema značajnog pogoršanja s višestrukim zahtjevima

**Metrike za Snimanje**:
- Vrijeme od slanja zahtjeva do COMPLETE statusa
- Broj zahtjeva obrađenih po minuti

---

### Test 11.2: Vrijeme Odgovora - Prekogranični Upit

**Poslovni Slučaj**: Izmjeriti performanse prekograničnih upita

**Koraci**:
1. Pošaljite višestruke prekogranične UIL upite
2. Izmjerite vrijeme odgovora
3. Usporedite s lokalnim upitima

**Očekivani Rezultati**:
- ✅ Prekogranični je sporiji od lokalnog (zbog eDelivery-a)
- ✅ Vrijeme odgovora je prihvatljivo (< 30 sekundi tipično)
- ✅ eDelivery overhead je razuman

**Metrike za Snimanje**:
- Vrijeme od zahtjeva do odgovora
- Latencija eDelivery poruka

---

### Test 11.3: Istovremeni Korisnici

**Poslovni Slučaj**: Višestruki korisnici upituju istovremeno

**Koraci**:
1. Neka se 3-5 korisnika prijavi
2. Svaki šalje upite istovremeno
3. Pratite ponašanje sustava

**Očekivani Rezultati**:
- ✅ Svi zahtjevi su prihvaćeni
- ✅ Sustav rukuje istovremenim opterećenjem
- ✅ Nema gubitka zahtjeva
- ✅ Vremena odgovora ostaju prihvatljiva

---

## Kategorija 12: Testovi Audita i Logiranja

### Test 12.1: Audit Trail Zahtjeva

**Poslovni Slučaj**: Provjeriti da su svi zahtjevi zabilježeni

**Koraci**:
1. Pošaljite različite zahtjeve (UIL, Identifier)
2. Provjerite audit logove
3. Provjerite logiranje

**Očekivani Rezultati**:
- ✅ Svi zahtjevi su zabilježeni s:
  - Request ID
  - Korisnik/Autoritet
  - Vremenska oznaka
  - Tip zahtjeva
  - Parametri
- ✅ Logovi su dostupni za pregled

---

### Test 12.2: Logiranje Prekogranične Komunikacije

**Poslovni Slučaj**: Provjeriti da su eDelivery poruke zabilježene

**Koraci**:
1. Izvedite prekogranični upit
2. Provjerite Domibus logove
3. Provjerite gate logove

**Očekivani Rezultati**:
- ✅ eDelivery poruke su zabilježene
- ✅ ID-ovi poruka su praćeni
- ✅ Korelacija zahtjev/odgovor je zabilježena
- ✅ Greške komunikacije su zabilježene

---

## Kategorija 13: Poslovni Slučajevi Korištenja

### Test 13.1: Tok Radnji Cestovnog Inspektora

**Poslovni Slučaj**: Cestovni inspektor treba provjeriti transportnu pošiljku

**Scenarij**:
- Inspektor vidi vozilo na cesti
- Inspektor zna registracijski broj vozila
- Inspektor želi provjeriti transportne dokumente

**Koraci**:
1. Inspektor se prijavljuje u portal
2. Pretražuje po registraciji vozila (pretraga identifikatora)
3. Dobiva popis pošiljki koje koriste to vozilo
4. Pregledava ROI informacije (datumi, ruta, oprema)
5. Odabire jednu pošiljku
6. Dohvaća puni dataset putem UIL upita
7. Pregledava kompletan transportni dokument

**Očekivani Rezultati**:
- ✅ Kompletan tok radnji funkcionira end-to-end
- ✅ Inspektor može identificirati ispravnu pošiljku
- ✅ Kompletan dokument je dostupan
- ✅ Podaci su dovoljni za inspekcijske svrhe

**Napomena**: Stvarna poslovna pravila (cabotage, provjere težine, itd.) se **NE VALIDIRAJU** - radi samo dohvaćanje podataka.

---

### Test 13.2: Prekogranična Transportna Inspekcija

**Poslovni Slučaj**: Inspektor u Zemlji A treba podatke iz Zemlje B

**Scenarij**:
- Vozilo iz Zemlje B je provjereno u Zemlji A
- Podaci su pohranjeni na platformi Zemlje B
- Inspektor treba pristup podacima

**Koraci**:
1. Inspektor u Borduriji pretražuje identifikator vozila iz Syldavije
2. Pretraga identifikatora emitira Syldaviji
3. Pronalazi pošiljku u Syldavia ROI-u
4. Inspektor dohvaća puni dataset s Syldavia platforme
5. Pregledava kompletan transportni dokument

**Očekivani Rezultati**:
- ✅ Prekogranična pretraga radi
- ✅ Pristup podacima je odobren
- ✅ Kompletan dokument je dohvaćen
- ✅ Komunikacija je sigurna

---

### Test 13.3: Višestruke Pošiljke za Isto Vozilo

**Poslovni Slučaj**: Isto vozilo korišteno u višestrukim transportnim operacijama

**Scenarij**:
- Vozilo "ABC123" se pojavljuje u 3 različite pošiljke
- Inspektor pretražuje i dobiva sva 3 rezultata
- Inspektor treba identificirati koja je trenutna

**Koraci**:
1. Pretražite identifikator "ABC123"
2. Dobijte višestruke rezultate
3. Pregledajte ROI informacije za svaku (datumi, rute)
4. Identificirajte trenutnu pošiljku temeljenu na datumima
5. Dohvatite puni dataset za trenutnu pošiljku

**Očekivani Rezultati**:
- ✅ Višestruki rezultati su vraćeni
- ✅ ROI informacije pomažu identificirati ispravnu pošiljku
- ✅ Inspektor može odabrati prikladan dataset

---

## Kategorija 14: Scenariji Integracije

### Test 14.1: Kompletan End-to-End Tok

**Poslovni Slučaj**: Puni tok radnji od učitavanja platforme do upita inspektora

**Koraci**:
1. **Platforma učitava identifikatore** u ROI
2. **Inspektor pretražuje po identifikatoru**
3. **Inspektor odabire rezultat** i pregledava ROI info
4. **Inspektor upituje puni dataset** putem UIL-a
5. **Inspektor pregledava kompletan dokument**

**Očekivani Rezultati**:
- ✅ Svi koraci rade zajedno
- ✅ Podaci teku ispravno kroz sustav
- ✅ Nema gubitka ili korupcije podataka
- ✅ Kompletan tok radnji je funkcionalan

---

### Test 14.2: Multi-Gate Integracija

**Poslovni Slučaj**: Sva tri gate-a sudjeluju u identifier broadcastu

**Postavka**:
- Sva tri gate-a pokrenuta
- Isti identifikator postoji u sve tri ROI baze podataka

**Koraci**:
1. Iz Bordurije, pretražite identifikator
2. Provjerite emitiranje Syldaviji i Listenbourgu
3. Provjerite odgovore sa svih gate-ova
4. Provjerite konsolidirane rezultate

**Očekivani Rezultati**:
- ✅ Svi gate-ovi primaju broadcast
- ✅ Svi gate-ovi odgovaraju
- ✅ Rezultati su ispravno konsolidirani
- ✅ Status prikazuje rezultate sa svakog gate-a

---

## Checklist Izvršavanja Testa

### Pre-Test Postavka

- [ ] Svi servisi su pokrenuti (gate-ovi, platforme, Keycloak, Domibus)
- [ ] Testni dataseti su učitani na platforme
- [ ] Testni identifikatori su učitani u ROI baze podataka
- [ ] Keycloak korisnici su konfigurirani
- [ ] Portal aplikacija je dostupna
- [ ] Postman kolekcija je spremna (za API testiranje)

### Izvršavanje Testa

- [ ] Izvedite testove u svakoj kategoriji
- [ ] Dokumentirajte rezultate (Pass/Fail/Promatranja)
- [ ] Snimite vremena odgovora
- [ ] Snimite screenshot-e/logove za neuspjehe
- [ ] Zabilježite sva ograničenja ili probleme

### Post-Test Analiza

- [ ] Pregledajte sve rezultate testova
- [ ] Identificirajte obrasce u neuspjesima
- [ ] Dokumentirajte ograničenja sustava
- [ ] Zabilježite nedostajuće funkcije
- [ ] Predložite preporuke

---

## Poznata Ograničenja (Nije Testabilno)

Ovi poslovni scenariji **se ne mogu testirati** s trenutnom implementacijom:

❌ **Provjere Cabotage** - Nema poslovne logike za validaciju cabotage-a
❌ **Provjera ADR Usuđnosti** - Nema ADR specifičnih validacijskih pravila
❌ **Tokovi Radnji Carinskog Oslobođenja** - Nema carinskog specifičnog procesiranja
❌ **Validacija Težine/Dimenzija** - Nema validacije protiv limita
❌ **Provjera Vozačke Dozvole** - Nema vozačkih podataka ili validacije
❌ **Validacija Planiranja Rute** - Nema validacije rute
❌ **Upiti Temeljeni na Vremenu** - Ne mogu se pretraživati po vremenskim rasponima
❌ **Masovne Operacije** - Ne mogu se upitati višestruki dataseti odjednom
❌ **Obavijesti u Stvarnom Vremenu** - Nema push obavijesti, samo polling
❌ **Filtriranje Podataka Temeljeno na Ulozi** - Trenutne uloge ne utječu na filtriranje podataka

---

## Sažetak

Trenutna referentna implementacija podržava **tokove radnji dohvaćanja podataka**:

✅ **Što Radi**:
- UIL upiti (lokalni i prekogranični)
- Pretrage identifikatora (lokalne i multi-gate)
- Filtriranje subseta po zemlji/profilu regulacije
- Dvokoračni tok radnji (identifikator → UIL)
- Učitavanje podataka platforme u ROI
- Prekogranična komunikacija putem eDelivery-a
- Portal UI za upite i pregled rezultata

❌ **Što Ne Radi** (Poslovna Logika):
- Validacije specifične za domenu (cabotage, ADR, carine)
- Provjera poslovnih pravila
- Automatizacija toka radnji
- Podrška odlučivanju

**Fokus**: Referentna implementacija demonstrira **tehničku infrastrukturu** za pristup podacima, ne poslovnu logiku za specifične inspekcijske scenarije.







