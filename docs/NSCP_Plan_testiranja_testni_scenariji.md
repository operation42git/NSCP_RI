Plan testiranja i testni scenariji
Projekt NSCP
Implementacija pilot projekta i produkcijskog rješenje za NSCP


Radna verzija 0.1

 
Autori dokumenta
Ime i prezime	Organizacija
Ivan Tomić	

Povijest izmjena
Verzija	Datum	Sažetak izmjena	Autor izmjena
0.1	28.12.2025.	Inicijalna verzija	
			
			

Prihvaćanje dokumenta
Ime i prezime	Funkcija	Organizacija 	Datum	Potpis
				

Distribucijska lista
Ime i prezime	Organizacija
	

 
Popis korištenih kratica
Kratica	Naziv
	
	


 
Sadržaj

1	Uvod	1
1.1	Svrha dokumenta	1
1.2	Izmjene dokumenta	1
1.3	Popis priloga	1
2	Metodologija testiranja	1
2.1	Testna metodologija – opći pristup	1
2.2	Hijerarhija testnih artefakata	1
2.2.1	Business Scenario (BS)	1
2.2.2	Test Case (TC)	1
2.2.3	Test Step	2
2.2.4	Expected Result (ER)	2
2.2.5	Alternative / Exception Test Case	2
2.3	Dizajn testnih slučajeva	2
2.4	Kriteriji uspješnosti testa	2
2.5	Upravljanje alternativnim i iznimnim tokovima	2
2.6	Matrica sljedivosti testova	3
2.7	Tablica pojmova	3
3	BS-6.1 Poslovni scenarij – Cestovna kontrola i dohvat eFTI podataka	1
3.1	Opći opis testnog scenarija	1
3.2	Preduvjeti	1
3.3	Testni podaci (primjeri)	1
3.4	Testni slučajevi – Autentikacija i sesija	2
3.4.1	TC-6.1-xx – Uspješna autentikacija korisnika	2
3.4.2	TC-6.1-xx – Neuspješna autentikacija: pogrešno korisničko ime i/ili lozinka	2
3.4.3	TC-6.1-xx – Validacija praznih polja pri prijavi	3
3.4.4	TC-6.1-XX – Validacija formata korisničkog imena i/ili lozinke	3
3.4.5	TC-6.1-XX – Prikaz poruke o grešci pri neuspješnoj autentikaciji	4
3.4.6	TC-6.1-XX – Istek korisničke sesije	4
3.4.7	TC-6.1-XX – Odjava korisnika (logout) i povratak na prijavu	5
3.5	Testni slučajevi – Unos i validacija UIL-a	5
3.5.1	TC-6.1- xx – Uspješan unos UIL-a ispravnog formata	5
3.5.2	TC-6.1-XX – Neispravan format UIL-a	6
3.5.3	TC-6.1-XX – Prazno polje za unos UIL-a	6
3.5.4	TC-6.1-XX – Validacija: nedozvoljeni znakovi / predugačak unos UIL-a	7
3.5.5	TC-6.1-XX – Ponašanje aplikacije kod ponovljenog klika "Pretraži" (debounce / dvostruki zahtjev)	7
3.6	Testni slučajevi – Razrješenje identifikatora i dohvat podataka	8
3.6.1	TC-6.1-XX – Razrješenje UIL-a u lokalnom ROI-u	8
3.6.2	TC-6.1-XX – Prekogranično razrješenje UIL-a putem G2G	8
3.6.3	TC-6.1-XX – UIL ne postoji u sustavu	9
3.6.4	TC-6.1-xx – Dataset nije aktivan	9
3.6.5	TC-6.1-XX – Dataset nije aktivan	9
3.6.6	TC-6.1-XX – Greška prilikom dohvaćanja dataset-a	10
3.6.7	TC-6.1-XX – Timeout ili nedostupnost eFTI platforme	10
3.6.8	TC-6.1-XX – Djelomični odgovor / više pogodaka (ako je primjenjivo kod upita koji vraća listu)	11
3.7	Prikaz zahtjeva i rezultata zahtjeva	11
3.7.1	TC-6.1-XX – Prikaz liste zahtjeva i dodavanje novog zahtjeva kao novog retka	11
3.7.2	TC-6.1-XX – Prikaz statičnih informacija zahtjeva i njihov kontinuitet kroz promjene statusa	12
3.7.3	TC-6.1-XX – Prikaz životnog ciklusa statusa zahtjeva (obrada, uspjeh, neuspjeh)	12
3.7.4	TC-6.1-XX – Prikaz i dostupnost akcija ovisno o statusu zahtjeva	13
3.7.5	TC-6.1-XX – Refresh ekrana zahtjeva i konzistentnost prikaza	13
3.7.6	TC-6.1-XX – Prikaz rezultata po završetku zahtjeva	14
3.7.7	TC-6.1-XX – Nova pretraga nakon završetka zahtjeva	14
3.8	Testni slučajevi – Prikaz i provjera podataka	15
3.8.1	TC-6.1-XX – Prikaz dohvaćenog dataset-a (osnovni prikaz)	15
3.8.2	TC-6.1-XX – Prikaz i mapiranje: podaci o pošiljci / prijevozu	15
3.8.3	TC-6.1-XX – Prikaz i mapiranje: sudionici prijevoza	16
3.8.4	TC-6.1-XX – Prikaz i mapiranje: relacija / mjesta utovara i istovara	16
3.8.5	TC-6.1-XX – Prikaz i mapiranje: podaci o vozilu i prikolici	16
3.8.6	TC-6.1-XX – Prikaz i mapiranje: podaci o robi	17
3.8.7	TC-6.1-XX – Prikaz i mapiranje: dokumenti i reference	17
3.8.8	TC-6.1-XX – Ponašanje prikaza kod nedostajućih XML polja	18
3.8.9	TC-6.1-XX – Formatiranje prikaza podataka	18
3.8.10	TC-6.1-XX – Validacija naziva polja i etiketa	19
3.9	Testni slučajevi – Pravila korištenja i navigacija (UI/UX)	20
3.9.1	TC-6.1-XX – Ponašanje gumba “Natrag” u aplikaciji (povrat na pretragu)	20
3.9.2	TC-6.1-XX – Web preglednik navigacija: Back (preglednik)	20
3.9.3	TC-6.1-XX – Web preglednik navigacija: Refresh (F5)	20
3.9.4	TC-6.1-XX – Otvaranje aplikacije u novoj kartici / dupliciranje sesije (ako je relevantno)	20
3.9.5	TC-6.1-XX – Ponašanje nakon zatvaranja preglednika i ponovnog otvaranja (sesija / prijava)	20
3.10	Testni slučajevi – Evidentiranje i završetak	20
3.10.1	TC-6.1-XX – Evidentiranje pristupa (audit): uspješan dohvat	20
3.10.2	TC-6.1-XX – Evidentiranje pristupa (audit): neuspješan dohvat / greška	20
3.10.3	TC-6.1-XX – Evidentiranje: pokušaj pristupa bez ovlasti (rola/subset ograničenje)	20
3.10.4	TC-6.1-14 – Evidentiranje pristupa i dohvaćanja podataka	20
4	PRILOG A – Poslovna pravila	1
4.1	Poslovna pravila za razrješenje identifikatora i dohvat podataka	3
4.1.1	RESOLVE-01	3
4.1.2	PR-RESOLVE-02	3
4.1.3	PR-RESOLVE-03	3
4.1.4	PR-RESOLVE-04	3
4.1.5	PR-RESOLVE-05	3
4.1.6	PR-RESOLVE-06	3
4.1.7	PR-RESOLVE-07	3
4.2	Pravila prikaza zahtjeva i rezultata zahtjeva	3
4.2.1	PR-REQ-01	3
4.2.2	PR-REQ-02	3
4.2.3	PR-REQ-03	3
4.2.4	PR-REQ-04	3
4.2.5	PR-REQ-05	3
4.2.6	PR-REQ-06	3
4.2.7	PR-REQ-07	4
4.2.8	PR-REQ-08	4
4.2.9	PR-REQ-09	4
4.2.10	PR-REQ-10	4
4.2.11	PR-REQ-11	4
4.2.12	PR-REQ-12	4
4.2.13	PR-REQ-13	4
4.2.14	PR-MSG-01	4
4.3	Pravila mapiranja XML podataka na korisnički prikaz	4
4.3.1	PR-XML-01 – Jednoznačno mapiranje	4
4.3.2	PR-XML-02 – Bez generiranja podataka	4
4.3.3	PR-XML-03 – Razdvajanje podataka i prikaza	5
4.3.4	PR-XML-04 – Grupiranje po poslovnim cjelinama	5
4.3.5	PR-XML-05 – Redoslijed sekcija	5
4.3.6	PR-XML-06 – Sudionici prijevoza	5
4.3.7	PR-XML-07 – Relacija prijevoza	5
4.3.8	PR-XML-08 – Vozilo i oprema	5
4.3.9	PR-XML-09 – Roba	5
4.3.10	PR-XML-10 – Opasan teret	5
4.3.11	PR-XML-11 – Dokumenti i napomene	5
4.3.12	PR-XML-12 – Nedostajući podaci	5
4.3.13	PR-XML-13 – Nema gubitka podataka	5

 
1	Uvod
1.1	Svrha dokumenta
Ovaj dokument definira plan testiranja NSCP eFTI pilot sustava kroz poslovne scenarije. Testiranje je organizirano tako da se svaki poslovni scenarij provodi kroz više testnih scenarija (pozitivne, negativne i rubne slučajeve) kako bi se potvrdilo očekivano ponašanje sustava u različitim okolnostima. Dokument je namijenjen razumijevanju testne logike na poslovnoj i funkcionalnoj razini, neovisno o konkretnoj implementaciji ili pojedinačnim tehničkim testnim skriptama.

1.2	Izmjene dokumenta
1.3	Popis priloga
2	Metodologija testiranja
Testiranje se temelji na poslovnim scenarijima definiranim u analizi eFTI pilota. Za svaki poslovni scenarij identificiraju se tipične situacije iz stvarne prakse te se nad njima provodi niz testnih scenarija. Svaki testni scenarij opisuje varijaciju istog poslovnog toka, s ciljem provjere ispravnog dohvata podataka, obrade iznimki, interoperabilnosti i korisničkog iskustva.
2.1	Testna metodologija – opći pristup
Testiranje u okviru projekta NSCP provodi se prema standardima ISTQB i ISO/IEC 29119, uz prilagodbu složenom integracijskom i regulatornom kontekstu eFTI sustava.
Cilj metodologije je osigurati da:
•	poslovni scenariji definirani u projektnoj dokumentaciji budu ispravno implementirani,
•	arhitekturalne komponente i njihove međuovisnosti funkcioniraju sukladno propisima,
•	sustav ispravno reagira na pozitivne, alternativne i iznimne tokove,
•	testni artefakti budu mjerljivi, ponovljivi i revizijski prihvatljivi.
Testiranje je strukturirano hijerarhijski, od poslovnog konteksta prema izvršivim testnim slučajevima.

2.2	Hijerarhija testnih artefakata
Testni artefakti definirani su u sljedećoj hijerarhiji:
2.2.1	Business Scenario (BS)
Opisuje poslovni proces ili situaciju iz stvarnog svijeta (npr. cestovna kontrola).
Izvor: poslovna i regulatorna dokumentacija.
2.2.2	Test Case (TC)
Izvršivi testni slučaj s jasno definiranim:
•	preduvjetima,
•	koracima,
•	očekivanim rezultatima,
•	jednoznačnim ishodom (Pass/Fail).
2.2.3	Test Step
Pojedinačna akcija korisnika ili sustava unutar testnog slučaja.
2.2.4	Expected Result (ER)
Očekivano ponašanje sustava nakon izvršenja testnog koraka.
2.2.5	Alternative / Exception Test Case
Posebni testni slučajevi koji pokrivaju alternativne tokove ili iznimne situacije.

2.3	Dizajn testnih slučajeva
Testni slučajevi dizajnirani su prema sljedećim načelima:
•	Jedan testni slučaj ima jedan primarni ishod.
•	Pozitivni i negativni tokovi koji imaju različite ishode modeliraju se kao zasebni testni slučajevi.
•	Sitne varijacije validacije korisničkog unosa mogu biti opisane unutar istog testnog slučaja.
•	Testni slučajevi ne dupliciraju tehničke detalje koji su već pokriveni komponentnim ili integracijskim testovima.

2.4	Kriteriji uspješnosti testa
Testni slučaj smatra se uspješnim (Pass) ako:
•	svi testni koraci budu izvršeni,
•	svi očekivani rezultati budu ostvareni,
•	nema neočekivanih grešaka ili odstupanja.
Testni slučaj smatra se neuspješnim (Fail) ako:
•	barem jedan očekivani rezultat nije ostvaren,
•	sustav pokaže nepredviđeno ponašanje.

2.5	Upravljanje alternativnim i iznimnim tokovima
Alternativni i iznimni tokovi:
•	koji imaju različite poslovne ili tehničke ishode,
•	ili uključuju različite komponente sustava,
modeliraju se kao zasebni testni slučajevi.
Manje varijacije korisničkog unosa mogu se opisati unutar istog testnog slučaja.

2.6	Matrica sljedivosti testova
Svaki testni slučaj može se povezati s:
•	poslovnim scenarijem (BS),
•	testnim scenarijem (TS),
•	regulatornim ili funkcionalnim zahtjevom.
Time se osigurava:
•	potpuna sljedivost,
•	pregled pokrivenosti,
•	revizijska prihvatljivost.

2.7	Tablica pojmova 

Pojam	Kratica	Opis
Business Scenario	BS	Poslovni proces ili situacija iz stvarnog svijeta
Test Scenario	TS	Cjeloviti testni scenarij
Test Case	TC	Izvršivi testni slučaj s koracima i očekivanim rezultatima
Test Step	–	Pojedinačna akcija u testnom slučaju
Expected Result	ER	Očekivano ponašanje sustava po koraku
Alternative Flow	AF	Varijacija toka s istim ciljem
Exception Case	EC	Testni slučaj za iznimne situacije
Pass / Fail	–	Ishod izvršenja testnog slučaja
Matrica sljedivosti testova	–	Povezivanje testova s poslovnim i regulatornim zahtjevima
 
3	BS-6.1 Poslovni scenarij – Cestovna kontrola i dohvat eFTI podataka
3.1	Opći opis testnog scenarija
Svrha:
Provesti end-to-end test koji u potpunosti prati poslovni scenarij BS-6.1 (cestovna kontrola) i potvrđuje da sustav omogućuje ovlaštenom korisniku dohvat i pregled eFTI/eCMR podataka korištenjem propisanih arhitekturalnih i tehničkih komponenti.
Opseg:
•	autentikacija i autorizacija korisnika
•	unos i validacija identifikatora (UIL)
•	razrješenje identifikatora (lokalno i prekogranično)
•	dohvat eFTI/eCMR podataka s platforme
•	prikaz podataka korisniku
•	rukovanje alternativnim i iznimnim tokovima
Uključene komponente:
•	Korisnička aplikacija (UI)
•	AAP (autentikacija i autorizacija)
•	Gate / orkestracijska logika
•	ROI (Registar identifikatora)
•	eFTI platforma
•	G2G komunikacija (ako je primjenjivo)
3.2	 Preduvjeti
•	Postoji registriran korisnik s ulogom ROAD_CONTROL_OFFICER
•	Sustav NSCP je operativan
•	ROI sadrži barem jedan aktivni zapis s važećim UIL-om
•	Dostupan je barem jedan dataset:
•	lokalni (razrješiv unutar nacionalnog ROI-a)
•	udaljeni (razrješiv putem G2G komunikacije)
3.3	Testni podaci (primjeri)
 Korisnički računi
•	Ispravni korisnik korisnik
•	Neispravni korisnik
Identifikatori
•	Važeći lokalni UIL
•	Važeći udaljeni UIL
•	Nevažeći / nepostojeći UIL
•	UIL neispravnog formata

3.4	Testni slučajevi – Autentikacija i sesija
3.4.1	TC-6.1-xx – Uspješna autentikacija korisnika
Svrha
Provjeriti da se ovlašteni korisnik može uspješno autentificirati u aplikaciju i započeti korištenje sustava.
Preduvjeti
•	Korisnik ima važeće korisničko ime i lozinku
•	Korisnik nije prethodno prijavljen u aplikaciju
Koraci
1. Korisnik otvara korisničku aplikaciju
2. Sustav prikazuje ekran za prijavu
3. Korisnik unosi ispravno korisničko ime i lozinku
4. Korisnik potvrđuje prijavu
Očekivani rezultat
•	Autentikacija je uspješna
•	Korisnik je preusmjeren na ekran za pretragu
•	Uloga korisnika je učitana i primijenjena
3.4.2	TC-6.1-xx – Neuspješna autentikacija: pogrešno korisničko ime i/ili lozinka
Svrha
Provjeriti da sustav ispravno odbija autentikaciju kada korisnik unese neispravno korisničko ime i/ili lozinku.
Preduvjeti
•	Korisnik se nalazi na ekranu za prijavu
•	Korisnik nije prethodno prijavljen u aplikaciju
Koraci
1. Korisnik unosi neispravno korisničko ime i/ili pogrešnu lozinku
2. Korisnik potvrđuje prijavu
Očekivani rezultat
•	Sustav odbija autentikaciju
•	Prikazuje se poruka o neispravnim korisničkim podacima
•	Korisnik ostaje na ekranu za prijavu
•	Ne uspostavlja se korisnička sesija
3.4.3	TC-6.1-xx – Validacija praznih polja pri prijavi
Svrha
Provjeriti da sustav ispravno validira obavezna polja na ekranu za prijavu i sprječava slanje zahtjeva s nepotpunim podacima.
Preduvjeti
•	Korisnik se nalazi na ekranu za prijavu
•	Korisnik nije prethodno prijavljen u aplikaciju
Koraci
1. Korisnik ne unosi korisničko ime i/ili lozinku
2. Korisnik odabire opciju "Prijava"
Očekivani rezultat
•	Sustav prikazuje poruke o obveznim poljima
•	Autentikacija se ne pokreće
•	Zahtjev se ne šalje prema AAP-u
•	Korisnik ostaje na ekranu za prijavu
3.4.4	TC-6.1-XX – Validacija formata korisničkog imena i/ili lozinke
Svrha
Provjeriti da sustav validira format korisničkog imena i/ili lozinke prije slanja zahtjeva za autentikaciju.
Preduvjeti
•	Korisnik se nalazi na ekranu za prijavu
•	Korisnik nije prethodno prijavljen u aplikaciju
Koraci
1. Korisnik unosi korisničko ime i/ili lozinku u formatu koji nije dopušten
2. Korisnik odabire opciju "Prijava"
Očekivani rezultat
•	Sustav prepoznaje neispravan format unosa
•	Sustav prikazuje poruku o neispravnom formatu unosa
•	Autentikacija se ne pokreće
•	Zahtjev se ne šalje prema AAP-u
•	Korisnik ostaje na ekranu za prijavu
Referenca na poslovna pravila
•	PR-LOGIN-XX (Pravila formata unosa)[A1.1]
3.4.5	TC-6.1-XX – Prikaz poruke o grešci pri neuspješnoj autentikaciji
Svrha
Provjeriti da se korisniku prikazuje jasna i razumljiva poruka o grešci kada autentikacija ne uspije.
Preduvjeti
•	Korisnik se nalazi na ekranu za prijavu
•	Korisnik unosi vjerodajnice koje dovode do neuspješne autentikacije
KORACI
1. Korisnik unosi korisničko ime i/ili lozinku koji nisu ispravni
2. Korisnik odabire opciju "Prijava"
Očekivani rezultat
•	Sustav odbija autentikaciju
•	Sustav prikazuje poruku o grešci
•	Poruka je razumljiva korisniku i ne otkriva tehničke ili sigurnosne detalje
•	Korisnik ostaje na ekranu za prijavu
REFERENCA NA POSLOVNA PRAVILA
•	PR-LOGIN-XX (Pravila prikaza poruka o grešci)

3.4.6	TC-6.1-XX – Istek korisničke sesije
Svrha
Provjeriti da sustav ispravno reagira na istek korisničke sesije i onemogućava daljnje korištenje aplikacije bez ponovne prijave.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik ima aktivnu korisničku sesiju
Koraci
1. Korisnička sesija istekne (istek vremena neaktivnosti ili definirano trajanje sesije)
2. Korisnik pokuša izvršiti bilo koju radnju u aplikaciji
Očekivani rezultat
•	Sustav prepoznaje istek korisničke sesije
•	Sustav onemogućava izvršenje tražene radnje
•	Sustav prikazuje poruku o isteku korisničke sesije
•	Sustav preusmjerava korisnika na ekran za prijavu
•	Za nastavak rada potrebna je ponovna prijava
Referenca na poslovna pravila
•	PR-SESSION-01 (Prikaz poruke o isteku korisničke sesije)

3.4.7	TC-6.1-XX – Odjava korisnika (logout) i povratak na prijavu
Svrha
Provjeriti da se korisnik može ispravno odjaviti iz aplikacije te da se nakon odjave onemogući daljnji pristup aplikaciji bez ponovne prijave.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
- Korisnik se nalazi unutar aplikacije
Koraci
1. Korisnik odabire opciju "Odjava" u korisničkom sučelju
2. Sustav izvršava postupak odjave korisnika
3. Sustav prikazuje ekran za prijavu
OČEKIVANI REZULTAT
•	Korisnička sesija je završena
•	Prikazuje se ekran za prijavu
•	Prethodno dohvaćeni podaci više nisu dostupni
•	Za nastavak rada potrebna je ponovna prijava

3.5	Testni slučajevi – Unos i validacija UIL-a
3.5.1	TC-6.1- xx – Uspješan unos UIL-a ispravnog formata
Svrha
Provjeriti da aplikacija prihvaća unos UIL-a ispravnog formata i pokreće obradu zahtjeva za pretragu.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik se nalazi na ekranu za unos UIL-a
Koraci
1. Korisnik unosi važeći UIL u polje za unos
2. Korisnik odabire opciju "Pretraži"
Očekivani rezultat
•	Sustav prihvaća uneseni UIL
•	Sustav pokreće obradu zahtjeva za pretragu
•	Korisniku se prikazuje status obrade zahtjeva
Referenca na poslovna pravila
•	PR-UIL-01 (Pravila formata i prihvata UIL-a)
•	PR-UIL-05 (Prikaz statusa obrade zahtjeva)
3.5.2	TC-6.1-XX – Neispravan format UIL-a
Svrha
Provjeriti da aplikacija prepoznaje UIL koji nije u dopuštenom formatu i sprječava pokretanje pretrage.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik se nalazi na ekranu za unos UIL-a
Koraci
1. Korisnik unosi UIL koji nije u dopuštenom formatu
2. Korisnik odabire opciju "Pretraži"
Očekivani rezultat
•	Sustav prepoznaje neispravan format UIL-a
•	Sustav prikazuje poruku o neispravnom formatu unosa
•	Obrada pretrage se ne pokreće
•	Zahtjev se ne šalje prema sustavu za razrješenje i dohvat podataka
Referenca na poslovna pravila
•	PR-UIL-01 (Pravila formata i prihvata UIL-a)
•	PR-MSG-01 (Pravila prikaza poruka korisniku)
3.5.3	TC-6.1-XX – Prazno polje za unos UIL-a
Svrha
Provjeriti da aplikacija validira obavezno polje za unos UIL-a i sprječava pokretanje pretrage bez unosa.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik se nalazi na ekranu za unos UIL-a
Koraci
1. Korisnik ne unosi UIL u polje za unos
2. Korisnik odabire opciju "Pretraži"
Očekivani rezultat
•	Sustav prikazuje poruku da je unos UIL-a obavezan
•	Obrada pretrage se ne pokreće
•	Zahtjev se ne šalje prema sustavu za razrješenje i dohvat podataka
•	Korisnik ostaje na ekranu za unos UIL-a
Referenca na poslovna pravila
•	PR-UIL-02 (Pravila obaveznih polja za unos UIL-a)
•	PR-MSG-01 (Pravila prikaza poruka korisniku)

3.5.4	TC-6.1-XX – Validacija: nedozvoljeni znakovi / predugačak unos UIL-a
Svrha
Provjeriti da aplikacija odbija UIL unos koji sadrži nedozvoljene znakove ili prelazi dopuštenu duljinu te sprječava pokretanje pretrage.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik se nalazi na ekranu za unos UIL-a
Koraci
1. Korisnik unosi UIL koji sadrži nedozvoljene znakove i/ili prelazi dopuštenu duljinu
2. Korisnik odabire opciju "Pretraži"
Očekivani rezultat
•	Sustav prepoznaje nedozvoljen unos (znakovi i/ili duljina)
•	Sustav prikazuje poruku o neispravnom unosu
•	Obrada pretrage se ne pokreće
•	Zahtjev se ne šalje prema sustavu za razrješenje i dohvat podataka
Referenca na poslovna pravila
•	PR-UIL-03 (Pravila dozvoljenih znakova i maksimalne duljine UIL-a)
•	PR-MSG-01 (Pravila prikaza poruka korisniku)
3.5.5	TC-6.1-XX – Ponašanje aplikacije kod ponovljenog klika "Pretraži" (debounce / dvostruki zahtjev)
Svrha
Provjeriti da aplikacija sprječava slanje višestrukih zahtjeva za pretragu pri ponovljenom kliku na opciju "Pretraži".
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik se nalazi na ekranu za unos UIL-a
•	Korisnik je unio važeći UIL
Koraci
1. Korisnik odabire opciju "Pretraži"
2. Korisnik ponovno odabire opciju "Pretraži" prije završetka obrade prvog zahtjeva
Očekivani rezultat
•	Sustav prihvaća i obrađuje samo jedan zahtjev za pretragu
•	Sustav sprječava slanje duplikat zahtjeva
•	Korisniku se prikazuje status obrade zahtjeva bez prikaza greške zbog ponavljanja akcije
Referenca na poslovna pravila
•	PR-UIL-04 (Sprječavanje duplikat zahtjeva pri pretrazi)
•	PR-UIL-05 (Prikaz statusa obrade zahtjeva)
3.6	Testni slučajevi – Razrješenje identifikatora i dohvat podataka
3.6.1	TC-6.1-XX – Razrješenje UIL-a u lokalnom ROI-u
Svrha
Provjeriti da sustav ispravno razrješava UIL koji postoji u lokalnom ROI-u
i dohvaća pripadajući dataset s lokalne eFTI platforme.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik je unio sintaktički ispravan UIL
•	UIL postoji u lokalnom ROI-u i označen je kao aktivan
Koraci
1. Sustav provjerava lokalni ROI
2. Sustav pronalazi UIL i utvrđuje da je aktivan
3. Sustav dohvaća dataset s lokalne eFTI platforme
Očekivani rezultat
•	Dataset je uspješno dohvaćen
•	Dataset je spreman za daljnju obradu i prikaz
Referenca na poslovna pravila
•	PR-RESOLVE-01
3.6.2	TC-6.1-XX – Prekogranično razrješenje UIL-a putem G2G
Svrha
Provjeriti da sustav ispravno pokreće prekogranično razrješenje UIL-a
kada UIL ne postoji u lokalnom ROI-u te dohvaća dataset s udaljene platforme.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik je unio sintaktički ispravan UIL
•	UIL ne postoji u lokalnom ROI-u
•	UIL postoji u ROI-u druge države članice
Koraci
1. Sustav utvrđuje da lokalni ROI ne sadrži uneseni UIL
2. Sustav pokreće G2G pretragu
3. Udaljeni gate vraća podatke o datasetu
4. Sustav dohvaća dataset s udaljene eFTI platforme
Očekivani rezultat
•	Dataset je uspješno dohvaćen
•	Dataset je spreman za daljnju obradu i prikaz
Referenca na poslovna pravila
•	PR-RESOLVE-02
3.6.3	TC-6.1-XX – UIL ne postoji u sustavu
SVRHA
Provjeriti da sustav ispravno reagira kada uneseni UIL ne postoji
ni u lokalnom ROI-u ni putem prekogranične pretrage.
PREDUVJETI
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik je unio sintaktički ispravan UIL
•	UIL ne postoji ni u jednom dostupnom ROI-u
KORACI
1. Sustav ne pronalazi UIL u lokalnom ROI-u
2. Sustav ne pronalazi UIL putem G2G pretrage
OČEKIVANI REZULTAT
•	Sustav prikazuje poruku da podaci nisu pronađeni
•	Ne prikazuju se detalji dataset-a
REFERENCA NA POSLOVNA PRAVILA
•	PR-RESOLVE-03
•	PR-MSG-01
3.6.4	TC-6.1-xx – Dataset nije aktivan[A2.1]
1.	ROI vraća status dataset-a „inactive“
Očekivani rezultat:
•	Sustav ne dohvaća dataset
•	Prikazuje se poruka o nedostupnosti podataka
3.6.5	TC-6.1-XX – Dataset nije aktivan
Svrha
Provjeriti da sustav ne dohvaća dataset koji je označen kao neaktivan
i da korisniku prikazuje odgovarajuću poruku.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik je unio sintaktički ispravan UIL
•	UIL postoji u ROI-u, ali dataset ima status "inactive"
Koraci
1. ROI vraća status dataset-a kao neaktivan

Očekivani rezultat
•	Sustav ne dohvaća dataset
•	Sustav prikazuje poruku o nedostupnosti podataka
Referenca na poslovna pravila
•	PR-RESOLVE-04
•	PR-MSG-01
3.6.6	TC-6.1-XX – Greška prilikom dohvaćanja dataset-a
SVRHA
Provjeriti da sustav ispravno reagira kada dođe do greške pri dohvaćanju
dataset-a s eFTI platforme.
PREDUVJETI
•	Korisnik je uspješno prijavljen u aplikaciju
•	Sustav pokušava dohvatiti dataset s eFTI platforme
KORACI
1. eFTI platforma vraća grešku tijekom dohvaćanja dataset-a
OČEKIVANI REZULTAT
•	Sustav prikazuje poruku o privremenoj pogrešci
•	Tehnički detalji greške nisu prikazani korisniku
REFERENCA NA POSLOVNA PRAVILA
•	PR-RESOLVE-05
•	PR-MSG-01
3.6.7	TC-6.1-XX – Timeout ili nedostupnost eFTI platforme
Svrha
Provjeriti ponašanje sustava kada eFTI platforma ne odgovara
u definiranom vremenskom roku.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Sustav pokušava dohvatiti dataset s eFTI platforme
Koraci
1. eFTI platforma ne odgovara unutar definiranog vremenskog okvira
Očekivani rezultat
•	Sustav prekida pokušaj dohvaćanja
•	Sustav prikazuje poruku o privremenoj nedostupnosti
•	Tehnički detalji nisu prikazani korisniku

Referenca na poslovna pravila
•	PR-RESOLVE-06
•	PR-MSG-01
3.6.8	TC-6.1-XX – Djelomični odgovor / više pogodaka (ako je primjenjivo kod upita koji vraća listu)[A3.1]

3.7	Prikaz zahtjeva i rezultata zahtjeva
Ova sekcija objedinjuje sva pravila i testne slučajeve koji se odnose na ponašanje aplikacije na ekranu pretrage i prikaza rezultata, odnosno na:
•	prikaz statusa zahtjeva tijekom obrade
•	prikaz završnog ishoda zahtjeva (uspjeh ili neuspjeh)
•	prikaz rezultata kada je zahtjev dovršen
•	ponašanje aplikacije pri refreshu preglednika tijekom obrade ili nakon obrade
•	dostupnost i ponašanje akcija na ekranu (npr. Pretraži, Nova pretraga, Natrag)
Ova sekcija ne pokriva:
•	unos i validaciju UIL-a (sekcija 3.5)
•	razrješenje identifikatora i dohvat podataka (sekcija 3.6)
•	mapiranje i prikaz sadržaja dataset-a (sekcija 3.7)

3.7.1	TC-6.1-XX – Prikaz liste zahtjeva i dodavanje novog zahtjeva kao novog retka
Svrha
Provjeriti da ekran prikazuje listu zahtjeva te da se svaki novi pokrenuti zahtjev zapisuje kao novi redak u listi.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
Koraci
1. Korisnik pokrene zahtjev pretrage
2. Sustav prikazuje listu zahtjeva
3. Korisnik pokrene još jedan zahtjev pretrage
Očekivani rezultat
•	Lista zahtjeva je prikazana
•	Novi zahtjev je prikazan kao novi redak u listi
•	Prethodni zahtjev (ako postoji) ostaje vidljiv u listi
Referenca na poslovna pravila
•	PR-REQ-11 (Pravila prikaza liste zahtjeva i dodavanja novog retka)
3.7.2	TC-6.1-XX – Prikaz statičnih informacija zahtjeva i njihov kontinuitet kroz promjene statusa
Svrha
Provjeriti da se statične informacije zahtjeva prikazuju i da se ne mijenjaju
dok se status zahtjeva mijenja.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	U listi postoji barem jedan zahtjev
Koraci
1. Sustav prikazuje redak zahtjeva u listi
2. Status zahtjeva se promijeni tijekom obrade
Očekivani rezultat
•	Statične informacije zahtjeva su prikazane
•	Statične informacije ostaju nepromijenjene tijekom promjene statusa
Referenca na poslovna pravila
•	PR-REQ-12 (Pravila prikaza i stabilnosti statičnih informacija zahtjeva)
3.7.3	TC-6.1-XX – Prikaz životnog ciklusa statusa zahtjeva (obrada, uspjeh, neuspjeh)
Svrha
Provjeriti da se status zahtjeva prikazuje i ažurira kroz cijeli životni ciklus
te da završni status odgovara ishodu obrade.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik je pokrenuo zahtjev
Koraci
1. Sustav započne obradu zahtjeva
2. Sustav tijekom vremena ažurira status zahtjeva
3. Sustav završi zahtjev uspješno ili neuspješno
Očekivani rezultat
•	Tijekom obrade prikazuje se status obrade
•	Nakon završetka prikazuje se završni status (uspjeh ili neuspjeh)
•	Status se ne vraća na prethodne vrijednosti
Referenca na poslovna pravila
•	PR-REQ-01 (Status tijekom obrade)
•	PR-REQ-02 (Status nakon uspjeha)
•	PR-REQ-03 (Status nakon neuspjeha)
•	PR-REQ-04 (Stabilnost statusa)¨
3.7.4	TC-6.1-XX – Prikaz i dostupnost akcija ovisno o statusu zahtjeva
Svrha
Provjeriti da su akcije nad zahtjevom prikazane i dostupne u skladu sa statusom
te da nisu dostupne akcije koje nisu dozvoljene.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	U listi postoji zahtjev u različitim statusima (obrada, uspjeh, neuspjeh)
Koraci
1. Sustav prikaže zahtjev u statusu obrade
2. Sustav prikaže zahtjev u statusu uspjeha
3. Sustav prikaže zahtjev u statusu neuspjeha
Očekivani rezultat
•	Prikazane akcije ovise o statusu zahtjeva
•	Nedozvoljene akcije nisu dostupne u statusu u kojem nisu dozvoljene
Referenca na poslovna pravila
•	PR-REQ-07 (Akcije tijekom obrade)
•	PR-REQ-08 (Akcije nakon završetka)
3.7.5	TC-6.1-XX – Refresh ekrana zahtjeva i konzistentnost prikaza
Svrha
Provjeriti da refresh preglednika ne narušava prikaz liste zahtjeva i da se nakon
refresh-a prikazuju konzistentni statusi i rezultati.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	U listi postoji barem jedan zahtjev (u obradi ili završen)
Koraci
1. Korisnik izvrši refresh preglednika na ekranu zahtjeva
2. Sustav ponovno prikaže ekran zahtjeva
Očekivani rezultat
•	Lista zahtjeva je i dalje prikazana
•	Statusi zahtjeva su konzistentni s njihovim stvarnim stanjem
•	Nema dupliciranja zahtjeva u listi zbog refresh-a
Referenca na poslovna pravila
•	PR-REQ-09 (Refresh tijekom obrade)
•	PR-REQ-10 (Refresh nakon završetka)
•	PR-REQ-04 (Stabilnost prikaza)

3.7.6	TC-6.1-XX – Prikaz rezultata po završetku zahtjeva
Svrha
Provjeriti da se nakon završetka zahtjeva prikazuje odgovarajući rezultat:
prikaz dataset-a kod uspjeha ili poruka bez prikaza detalja kod neuspjeha.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Postoji zahtjev koji je završio uspješno i zahtjev koji je završio neuspješno
Koraci
1. Sustav prikaže završeni zahtjev s uspješnim ishodom
2. Sustav prikaže završeni zahtjev s neuspješnim ishodom
Očekivani rezultat
•	Kod uspjeha prikazuje se rezultat (dataset) povezan sa zahtjevom
•	Kod neuspjeha prikazuje se poruka, bez prikaza detalja dataset-a
•	Rezultati su povezani s odgovarajućim zahtjevom
Referenca na poslovna pravila
•	PR-REQ-05 (Prikaz rezultata nakon uspjeha)
•	PR-REQ-06 (Prikaz kada nema rezultata)
•	PR-MSG-01 (Pravila poruka)
3.7.7	TC-6.1-XX – Nova pretraga nakon završetka zahtjeva
Svrha
Provjeriti da korisnik može započeti novu pretragu nakon završetka zahtjeva
te da se prethodni zahtjev zadrži u listi povijesti.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Postoji barem jedan zahtjev koji je završio (uspješno ili neuspješno)
Koraci
1. Korisnik odabire opciju "Nova pretraga"
2. Sustav priprema ekran za novi unos
Očekivani rezultat
•	Ekran je spreman za unos novog UIL-a
•	Prethodni zahtjev ostaje prikazan u listi zahtjeva
•	Novi zahtjev još nije dodan u listu zahtjeva
Referenca na poslovna pravila
•	PR-REQ-11 (Pravila započinjanja nove pretrage)
•	PR-REQ-04 (Stabilnost prikaza)


3.8	Testni slučajevi – Prikaz i provjera podataka
Ova skupina testnih slučajeva služi za verifikaciju da se dohvaćeni XML podaci prikazuju u skladu s definiranim poslovnim pravilima, neovisno o načinu dohvaćanja dataset-a.
Testni slučajevi iz ove skupine:
•	ne testiraju dohvat podataka (to je pokriveno drugim TC-ovima),
•	ne sadrže XML putanje u koracima

3.8.1	TC-6.1-XX – Prikaz dohvaćenog dataset-a (osnovni prikaz)
SVRHA
Provjeriti da se dohvaćeni dataset prikazuje korisniku u osnovnom,strukturiranom i čitljivom obliku.
PREDUVJETI
•	Dataset je uspješno dohvaćen
KORACI
1. Sustav prikazuje ekran s dohvaćenim dataset-om
OČEKIVANI REZULTAT
•	Dataset je prikazan korisniku
•	Prikaz je strukturiran u logičke cjeline
•	Nema prikaza tehničkih ili sistemskih informacija
REFERENCA NA POSLOVNA PRAVILA
•	PR-XML-15
3.8.2	TC-6.1-XX – Prikaz i mapiranje: podaci o pošiljci / prijevozu
Svrha
Provjeriti da su osnovni podaci o pošiljci i prijevozu ispravno mapirani
iz XML-a i prikazani korisniku.
Preduvjeti
•	Dataset je uspješno dohvaćen
•	Podaci o pošiljci postoje u XML-u
Koraci
1. Sustav prikazuje sekciju s osnovnim podacima o pošiljci i prijevozu
Očekivani rezultat
•	Prikazani su svi relevantni podaci o pošiljci
•	Podaci su mapirani prema poslovnim pravilima
•	Prikaz je čitljiv i konzistentan
Referenca na poslovna pravila
•	PR-XML-01
•	PR-XML-04
3.8.3	TC-6.1-XX – Prikaz i mapiranje: sudionici prijevoza
Svrha
Provjeriti da su sudionici prijevoza ispravno mapirani i prikazani
u poslovno razumljivom obliku.
Preduvjeti
•	Dataset je uspješno dohvaćen
•	Podaci o sudionicima postoje u XML-u
Koraci
1. Sustav prikazuje sekciju sa sudionicima prijevoza
Očekivani rezultat
•	Prikazani su pošiljatelj, prijevoznik i primatelj
•	Nazivi i adrese su pravilno mapirani
•	Tehnička struktura XML-a nije vidljiva korisniku
Referenca na poslovna pravila
•	PR-XML-06
•	PR-XML-14
3.8.4	TC-6.1-XX – Prikaz i mapiranje: relacija / mjesta utovara i istovara
SVRHA
Provjeriti ispravan prikaz relacije prijevoza i mjesta utovara i istovara.
PREDUVJETI
•	Dataset je uspješno dohvaćen
•	Podaci o relaciji postoje u XML-u
KORACI
1. Sustav prikazuje sekciju s podacima o relaciji prijevoza
OČEKIVANI REZULTAT
•	Prikazana su mjesta utovara i istovara
•	Redoslijed i nazivi su ispravni
•	Prikaz je u skladu s poslovnim pravilima
REFERENCA NA POSLOVNA PRAVILA
•	PR-XML-07
3.8.5	TC-6.1-XX – Prikaz i mapiranje: podaci o vozilu i prikolici
Svrha
Provjeriti da su podaci o vozilu i prikolici ispravno mapirani i prikazani.
Preduvjeti
•	Dataset je uspješno dohvaćen
•	Podaci o vozilu i/ili prikolici postoje u XML-u
Koraci
1. Sustav prikazuje sekciju s podacima o vozilu i prikolici

Očekivani rezultat
•	Prikazani su podaci o vozilu i prikolici ako postoje
•	Neprisutni podaci nisu prikazani ili su označeni kao N/A
•	Prikaz je u skladu s poslovnim pravilima
Referenca na poslovna pravila
•	PR-XML-08
•	PR-XML-12
3.8.6	TC-6.1-XX – Prikaz i mapiranje: podaci o robi
Svrha
Provjeriti ispravan prikaz i mapiranje podataka o robi.
Preduvjeti
•	Dataset je uspješno dohvaćen
•	Podaci o robi postoje u XML-u
Koraci
1. Sustav prikazuje sekciju s podacima o robi
Očekivani rezultat
•	Prikazan je opis, količina i mjere robe
•	Agregacija podataka je u skladu s pravilima
•	Prikaz je čitljiv i konzistentan
Referenca na poslovna pravila
•	PR-XML-09
3.8.7	TC-6.1-XX – Prikaz i mapiranje: dokumenti i reference
Svrha
Provjeriti prikaz dokumenata i referenci povezanih s prijevozom.
Preduvjeti
•	Dataset je uspješno dohvaćen
•	Dokumenti ili reference postoje u XML-u
Koraci
1. Sustav prikazuje sekciju s dokumentima i referencama
Očekivani rezultat
•	Dokumenti i reference su prikazani ako postoje
•	Ako ne postoje, sekcija se ne prikazuje ili je prazna
•	Prikaz je u skladu s poslovnim pravilima

Referenca na poslovna pravila
•	PR-XML-11
•	PR-XML-12
3.8.8	TC-6.1-XX – Ponašanje prikaza kod nedostajućih XML polja
Svrha
Provjeriti ponašanje prikaza kada pojedini XML elementi nedostaju.
Preduvjeti
•	Dataset je uspješno dohvaćen
•	Pojedini podaci nisu prisutni u XML-u
Koraci
1. Sustav prikazuje dataset s nedostajućim podacima
Očekivani rezultat
•	Nedostajući podaci nisu prikazani ili su označeni kao N/A
•	Prikaz ostaje stabilan i čitljiv
Referenca na poslovna pravila
•	PR-XML-12
•	PR-XML-13
3.8.9	TC-6.1-XX – Formatiranje prikaza podataka
Svrha
Provjeriti da su datumi, jedinice mjere, države i decimalni zapisi
formatirani u skladu s poslovnim pravilima.
Preduvjeti
•	Dataset je uspješno dohvaćen
Koraci
1. Sustav prikazuje podatke s različitim formatima
Očekivani rezultat
•	Datumi su prikazani u čitljivom formatu
•	Jedinice mjere i države su konzistentne
•	Decimalni zapis je u skladu s pravilima
Referenca na poslovna pravila
•	PR-XML-17
3.8.10	TC-6.1-XX – Validacija naziva polja i etiketa
Svrha
Provjeriti da su nazivi polja i etikete prikazani u poslovno razumljivom
obliku, bez tehničke XML terminologije.
Preduvjeti
•	Dataset je uspješno dohvaćen

KORACI
1. Sustav prikazuje sve sekcije i polja dataset-a
Očekivani rezultat
•	Nazivi polja su user-friendly
•	XML ili tehnički nazivi nisu vidljivi korisniku
•	Terminologija je konzistentna kroz prikaz
Referenca na poslovna pravila
•	PR-XML-14
•	PR-XML-18

3.9	Testni slučajevi – Pravila korištenja i navigacija (UI/UX)[A4.1]

3.9.1	TC-6.1-XX – Ponašanje gumba "Natrag" u aplikaciji (povrat na pretragu)
Svrha
Provjeriti da gumb "Natrag" unutar aplikacije vraća korisnika na ekran pretrage
na kontrolirani način, bez neželjenog ponovnog dohvaćanja podataka.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik se nalazi na ekranu prikaza rezultata ili prikaza dataset-a
Koraci
1. Korisnik odabire gumb "Natrag" u aplikaciji
Očekivani rezultat
•	Sustav prikazuje ekran pretrage
•	Prethodno dohvaćeni podaci nisu automatski ponovno dohvaćeni
•	Korisnik može pokrenuti novu pretragu
Referenca na poslovna pravila
•	PR-NAV-01 (Ponašanje gumba "Natrag" unutar aplikacije)


3.9.2	TC-6.1-XX – Web preglednik navigacija: Back (preglednik)
Svrha
Provjeriti ponašanje aplikacije kada korisnik koristi funkciju Back u web pregledniku.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik je navigirao između najmanje dva ekrana unutar aplikacije
Koraci
1. Korisnik odabire Back u web pregledniku
Očekivani rezultat
•	Aplikacija se ponaša u skladu s definiranim pravilima navigacije preglednika
•	Ne dolazi do prikaza nekonzistentnih ili zastarjelih podataka
•	Ne dolazi do neovlaštenog pristupa sadržaju bez aktivne sesije
Referenca na poslovna pravila
•	PR-NAV-02 (Ponašanje Back u web pregledniku)
•	PR-SESSION-02 (Ponašanje aplikacije bez aktivne sesije)
3.9.3	TC-6.1-XX – Web preglednik navigacija: Refresh (F5)
Svrha
Provjeriti ponašanje aplikacije kada korisnik izvrši refresh web preglednika.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik se nalazi na jednom od ekrana aplikacije (pretraga, lista zahtjeva, prikaz dataset-a)
Koraci
1. Korisnik izvrši refresh web preglednika (F5)
2. Sustav ponovno učita trenutni ekran
Očekivani rezultat
•	Aplikacija se ponovno učita bez greške
•	Prikaz i stanje aplikacije su konzistentni s pravilima (npr. lista zahtjeva i statusi)
•	Ne dolazi do dupliciranja zahtjeva zbog refresh-a
•	Ako sesija nije aktivna, korisnik se preusmjerava na prijavu
Referenca na poslovna pravila
•	PR-NAV-03 (Ponašanje Refresh u web pregledniku)
•	PR-REQ-09 (Refresh tijekom obrade zahtjeva)
•	PR-REQ-10 (Refresh nakon završetka zahtjeva)
•	PR-SESSION-02 (Ponašanje aplikacije bez aktivne sesije)

3.9.4	TC-6.1-XX – Otvaranje aplikacije u novoj kartici ili dupliciranje sesije
Svrha
Provjeriti ponašanje aplikacije kada korisnik otvori aplikaciju u novoj kartici
ili duplicira postojeću karticu.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik ima otvorenu aplikaciju u jednoj kartici
Koraci
1. Korisnik otvori aplikaciju u novoj kartici ili duplicira postojeću karticu
2. Korisnik pokuša koristiti aplikaciju u obje kartice
Očekivani rezultat
•	Aplikacija se ponaša u skladu s pravilima upravljanja sesijom u više kartica
•	Ne dolazi do nekonzistentnog stanja ili gubitka kontrole nad sesijom
•	Ne dolazi do neovlaštenog pristupa bez aktivne sesije
Referenca na poslovna pravila
•	PR-NAV-04 (Ponašanje aplikacije u više kartica)
•	PR-SESSION-03 (Upravljanje sesijom u više kartica)
3.9.5	TC-6.1-XX – Ponašanje nakon zatvaranja preglednika i ponovnog otvaranja
Svrha
Provjeriti ponašanje aplikacije nakon zatvaranja web preglednika i ponovnog otvaranja,
ovisno o pravilima trajanja korisničke sesije.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
Koraci
1. Korisnik zatvori web preglednik
2. Korisnik ponovno otvori web preglednik i aplikaciju
Očekivani rezultat
•	Aplikacija se ponaša u skladu s pravilima trajanja i pohrane sesije
•	Ako sesija nije aktivna, korisnik se preusmjerava na prijavu
•	Ako je sesija i dalje aktivna prema pravilima, korisnik može nastaviti rad
Referenca na poslovna pravila
•	PR-NAV-05 (Ponašanje nakon zatvaranja i ponovnog otvaranja)
•	PR-SESSION-04 (Trajanje i obnova korisničke sesije)


3.10	 Testni slučajevi – Evidentiranje [A5.1]
3.10.1	TC-6.1-XX – Evidentiranje pristupa (audit): uspješan dohvat
Svrha
Provjeriti da se uspješan pristup i dohvat podataka evidentira u audit zapisu
u skladu s poslovnim pravilima evidentiranja.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik ima ovlasti za pristup traženim podacima
•	Dohvat dataset-a je uspješno završen
Koraci
1. Sustav uspješno razrješava UIL i dohvaća dataset
2. Sustav završava obradu zahtjeva uspješno
Očekivani rezultat
•	Evidentiran je audit zapis o uspješnom pristupu
•	Audit zapis sadrži osnovne informacije o pristupu
•	Evidentiranje je izvršeno bez utjecaja na korisnički prikaz
Referenca na poslovna pravila
•	PR-AUDIT-01 (Evidentiranje uspješnog pristupa)
3.10.2	TC-6.1-XX – Evidentiranje pristupa (audit): neuspješan dohvat ili greška
Svrha
Provjeriti da se neuspješan pokušaj dohvaćanja podataka ili greška tijekom obrade
evidentira u audit zapisu.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Sustav pokuša obraditi zahtjev koji završava neuspješno
Koraci
1. Sustav pokuša razrješiti UIL i dohvatiti dataset
2. Obrada zahtjeva završi neuspješno (npr. nije pronađeno, greška, timeout)
Očekivani rezultat
•	Evidentiran je audit zapis o neuspješnom pokušaju pristupa
•	Audit zapis sadrži osnovne informacije o pokušaju pristupa
•	Tehnički detalji greške nisu vidljivi korisniku
Referenca na poslovna pravila
•	PR-AUDIT-02 (Evidentiranje neuspješnog pristupa)

3.10.3	TC-6.1-XX – Evidentiranje: pokušaj pristupa bez ovlasti[A6.1]
Svrha
Provjeriti da se pokušaj pristupa podacima bez odgovarajućih ovlasti
ispravno blokira i evidentira u audit zapisu.
Preduvjeti
•	Korisnik je uspješno prijavljen u aplikaciju
•	Korisnik nema ovlasti za traženi skup podataka (rola ili subset ograničenje)
Koraci
1. Korisnik pokuša pristupiti podacima bez odgovarajućih ovlasti
Očekivani rezultat
•	Sustav onemogućava pristup podacima
•	Korisniku se prikazuje odgovarajuća poruka
•	Evidentiran je audit zapis o neovlaštenom pokušaju pristupa
Referenca na poslovna pravila
•	PR-AUDIT-03 (Evidentiranje neovlaštenog pokušaja pristupa)
•	PR-AUTH-02 (Kontrola pristupa prema ulozi ili subsetu)
•	PR-MSG-01 (Pravila prikaza poruka korisniku)
3.10.4	TC-6.1-XX – Evidentiranje autentikacije: uspješna prijava korisnika[A7.1]
Svrha
Provjeriti da se svaka uspješna autentikacija korisnika evidentira
u audit zapisu u skladu s poslovnim pravilima.
Preduvjeti
•	Korisnik ima važeće korisničke vjerodajnice
•	Korisnik se nalazi na ekranu za prijavu
Koraci
1. Korisnik unosi ispravne vjerodajnice
2. Sustav uspješno autentificira korisnika
3. Korisniku se omogućuje pristup aplikaciji
Očekivani rezultat
•	Autentikacija korisnika je uspješna
•	Korisniku je omogućen pristup aplikaciji
•	Evidentiran je audit zapis o uspješnoj autentikaciji
Referenca na poslovna pravila
•	PR-AUDIT-04

3.10.5	TC-6.1-XX – Evidentiranje autentikacije: neuspješna prijava korisnika[A8.1]
Svrha
Provjeriti da se svaki neuspješan pokušaj autentikacije korisnika
evidentira u audit zapisu u skladu s poslovnim pravilima.
Preduvjeti
•	Korisnik se nalazi na ekranu za prijavu
Koraci
1. Korisnik unosi neispravne vjerodajnice
2. Sustav odbija autentikaciju
Očekivani rezultat
•	Autentikacija korisnika nije uspješna
•	Korisniku se prikazuje odgovarajuća poruka
•	Evidentiran je audit zapis o neuspješnom pokušaju autentikacije
Referenca na poslovna pravila
•	PR-AUDIT-05
•	PR-MSG-01



 
4	PRILOG A – Poslovna pravila i poruke
4.1	Poruke
4.2	Poslovna pravila za autentikaciju i sesiju
4.3	Poslovna pravila za unos i validaciju UILa
4.3.1	PR-UIL-01 Pravila formata i prihvata UIL-a
4.3.2	PR-UIL-02 Pravila obaveznih polja za unos UIL-a
4.3.3	PR-UIL-03 Pravila dozvoljenih znakova i maksimalne duljine UIL-a
4.3.4	PR-UIL-04 Sprječavanje duplikat zahtjeva pri pretrazi
4.3.5	PR-UIL-05 Prikaz statusa obrade zahtjeva
4.4	Poslovna pravila za razrješenje identifikatora i dohvat podataka
4.4.1	RESOLVE-01
Pravila lokalnog razrješenja UIL-a putem ROI-a
4.4.2	PR-RESOLVE-02
Pravila prekograničnog razrješenja UIL-a putem G2G komunikacije
4.4.3	PR-RESOLVE-03
Pravila ponašanja sustava kada UIL ne postoji u sustavu
4.4.4	PR-RESOLVE-04
Pravila ponašanja sustava kada dataset nije aktivan
4.4.5	PR-RESOLVE-05
Pravila ponašanja sustava u slučaju greške eFTI platforme
4.4.6	PR-RESOLVE-06
Pravila ponašanja sustava u slučaju timeouta ili nedostupnosti platforme
4.4.7	PR-RESOLVE-07
Pravila obrade djelomičnih odgovora ili više pogodaka (ako je primjenjivo)

4.5	Pravila prikaza zahtjeva i rezultata zahtjeva
Ova sekcija pravila definira ponašanje ekrana koji prikazuje listu zahtjeva, njihove statične informacije, promjenjive statuse, dostupne akcije te prikaz rezultata zahtjeva. Pravila ne opisuju tehničku implementaciju.
4.5.1	PR-REQ-01
Prikaz statusa zahtjeva tijekom obrade
4.5.2	PR-REQ-02
Prikaz statusa zahtjeva nakon uspješnog završetka
4.5.3	PR-REQ-03
Prikaz statusa zahtjeva nakon neuspješnog završetka
4.5.4	PR-REQ-04
Stabilnost prikaza statusa i sprječavanje nekonzistentnosti
(npr. bez vraćanja na prethodni status, bez duplikata prikaza)
4.5.5	PR-REQ-05
Prikaz rezultata nakon uspješnog završetka zahtjeva
4.5.6	PR-REQ-06
Prikaz ishoda kada nema rezultata ili kada je zahtjev neuspješan
(npr. poruka bez prikaza detalja dataset-a)
4.5.7	PR-REQ-07
Pravila prikaza i dostupnosti akcija dok je zahtjev u obradi
4.5.8	PR-REQ-08
Pravila prikaza i dostupnosti akcija nakon završetka zahtjeva
(razlikovati uspjeh i neuspjeh ako je potrebno)
4.5.9	PR-REQ-09
Ponašanje ekrana pri refreshu preglednika dok je zahtjev u obradi
4.5.10	PR-REQ-10
Ponašanje ekrana pri refreshu preglednika nakon završetka zahtjeva
4.5.11	PR-REQ-11
Pravila prikaza liste zahtjeva i dodavanja novog zahtjeva kao novog retka
(novi zahtjev se zapisuje kao novi redak, prethodni ostaju u povijesti)
4.5.12	PR-REQ-12
Pravila prikaza statičnih informacija zahtjeva i njihova nepromjenjivost
(statični dio se ne mijenja kroz promjene statusa)
4.5.13	PR-REQ-13
Pravila započinjanja nove pretrage nakon završetka zahtjeva
(reset unosa, zadržavanje povijesti, bez automatskog dodavanja novog retka)
4.5.14	PR-MSG-01[A9.1]
Opća pravila prikaza poruka korisniku (već postojeća sekcija, koristi se i ovdje)

4.6	Pravila mapiranja XML podataka na korisnički prikaz
Ova sekcija definira poslovna pravila mapiranja XML podataka (eFTI Common Data Set) na korisnički prikaz u aplikaciji za cestovnu kontrolu.
Cilj pravila je osigurati da:
•	svi regulatorno relevantni podaci budu prikazani,
•	podaci budu prikazani u poslovno razumljivom obliku,
•	korisnički prikaz bude konzistentan, čitljiv i stabilan,
•	tehnička struktura XML-a ostane skrivena od krajnjeg korisnika.
4.6.1	PR-XML-01 – Jednoznačno mapiranje
Svako prikazano polje u korisničkom sučelju mora biti mapirano na točno određeni XML element ili kombinaciju elemenata.
4.6.2	PR-XML-02 – Bez generiranja podataka
Sustav ne smije generirati, izračunavati ili pretpostavljati vrijednosti koje ne postoje u XML dokumentu, osim ako je to izričito definirano pravilom (npr. zbrajanje masa).
4.6.3	PR-XML-03 – Razdvajanje podataka i prikaza
Korisnički prikaz ne smije sadržavati XML oznake, putanje, tehničke nazive elemenata niti druge tehničke detalje.
4.6.4	PR-XML-04 – Grupiranje po poslovnim cjelinama
Podaci se prikazuju u logičkim sekcijama koje odgovaraju uobičajenim teretnim dokumentima:
•	Sudionici prijevoza
•	Relacija i prijevoz
•	Vozilo i oprema
•	Roba
•	Dokumenti i napomene
4.6.5	PR-XML-05 – Redoslijed sekcija
Sekcije se prikazuju redoslijedom koji omogućuje brz i intuitivan pregled, usporediv s papirnatim obrascem (npr. CMR).
4.6.6	PR-XML-06 – Sudionici prijevoza
Nazivi i adrese sudionika mapiraju se iz elemenata <carrier> i <associatedParty>, pri čemu se adresni elementi spajaju u jednu čitljivu adresnu liniju.
4.6.7	PR-XML-07 – Relacija prijevoza
Mjesta utovara i istovara mapiraju se iz elemenata loadingLocation i unloadingLocation te se prikazuju u jedinstvenom tekstualnom formatu.
4.6.8	PR-XML-08 – Vozilo i oprema
Podaci o vozilu i opremi (kamion, prikolica, kontejner) mapiraju se iz odgovarajućih XML elemenata i prikazuju samo ako postoje u XML-u.
4.6.9	PR-XML-09 – Roba
Opis, količina i masa robe mapiraju se iz elemenata consignmentItem. Ako postoji više stavki, primjenjuju se pravila agregacije (npr. zbroj mase).
4.6.10	PR-XML-10 – Opasan teret
Podaci o opasnom teretu prikazuju se isključivo ako u XML-u postoji dangerousGoods element.
4.6.11	PR-XML-11 – Dokumenti i napomene
Dokumenti i napomene prikazuju se samo ako su prisutni u XML-u; u suprotnom se sekcija može sakriti.
4.6.12	PR-XML-12 – Nedostajući podaci
•	Ako XML element ne postoji:
•	sustav ne prikazuje grešku,
•	polje se ne prikazuje ili se označava kao „N/A“,
•	prikaz ostaje stabilan i čitljiv.
4.6.13	PR-XML-13 – Nema gubitka podataka
Svi podaci koji postoje u XML-u i relevantni su za regulativu moraju biti prikazani.

4.7	Poslovna pravila za navigaciju (UX/UI)
4.7.1	PR-NAV-01 Ponašanje gumba "Natrag" u aplikaciji
4.7.2	PR-NAV-02 Ponašanje Back u web pregledniku
4.7.3	PR-NAV-03 Ponašanje Refresh u web pregledniku
4.7.4	PR-NAV-04 Ponašanje aplikacije u više kartica
4.7.5	PR-NAV-05 Ponašanje nakon zatvaranja i ponovnog otvaranja preglednika

4.8	Poslovna pravila za Evidentiranje
4.8.1	PR-AUDIT-01
Pravila evidentiranja uspješnog pristupa podacima
4.8.2	PR-AUDIT-02
Pravila evidentiranja neuspješnog pokušaja pristupa ili greške
4.8.3	PR-AUDIT-03
Pravila evidentiranja pokušaja pristupa bez ovlasti
4.8.4	PR-AUDIT-04
Pravila evidentiranja pokušaja autentikacije (uspješnih i neuspješnih)


.
