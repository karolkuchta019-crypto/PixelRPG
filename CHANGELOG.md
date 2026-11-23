# Changelog – Monster Waves

## [1.3.1]

- **Podpalenie** jest SUPER skuteczne na drzewce/rośliny (Drzewiec, Leszy, grzyby, dmuchawce): 3× obrażeń od płomieni, większa szansa na podpalenie.
- **Hardcore:** „Anuluj” przy rozpoczynaniu kampanii wraca do menu głównego (wcześniej zostawał pusty ekran).
- **Burza śnieżna (Lodowe góry):** co rundę każdy, kto nie jest ze śniegu (wilki, gobliny, bohater i kompani), ma 20% szans na zamrożenie.
- **Punkty zostają po śmierci:** punkty zdobyte w etapie (za fale, minigry, skarb) dopisują się do migawki, z której wczytuje się „Spróbuj ponownie”.
- **Bard:** u zbrojmistrza można kupić „Złotą lutnię” (12 pkt): +60% obrażeń barda i złote nuty. Nuty barda mają teraz własną animację.
- **Stara elektrownia – lawowa zagadka** (połowa etapu, zamiast 5. fali): obracaj sześciokąty z rurami, aż lawa popłynie od źródła do drzwi. Zawsze rozwiązywalna. Nagroda: +2 pkt i +30% HP.
- **Pustynia – labirynt w piramidzie** (połowa etapu, zamiast 5. fali): ciemny labirynt (widać okolicę bohatera, odwiedzone korytarze tylko blado), mały bohater. Cel główny: wyjście; cel poboczny: skarb (+15 pkt) w ślepym rozwidleniu. Nagroda: +2 pkt i +30% HP.
- Techniczne: `minigames.js`, `tools/test_minigames.js`; tłumaczenia EN/ES.

## [1.3.0]

- **Bossowie przywołujący sojuszników są nietykalni**, dopóki żyją przywołani (Yeti, Wiedźma, Mroczny Trener). Kompani też nie atakują nietykalnego bossa.
- **Nowa księżniczka** (na podstawie dostarczonego obrazka): brązowe włosy z jasnymi pasmami, korona z niebieskim kamieniem, gwiazdka we włosach, niebieska suknia z różowym przodem.
- **Wiedźma** nie jest już kupcem na bagnach – ma osobną ikonkę na mapie świata obok Moczarów (klik w trakcie kampanii, poza walką). Po jej pokonaniu etapy niżej niż Moczary dają bardzo mało XP (×0,1). Nowe ulepszenie u wiedźmy: „Eliksir życia+” (10 pkt) – eliksir zawsze leczy 75% maks. HP.
- **Królowa Pająków:** po pokonaniu zbrojmistrz sprzedaje zestaw smoka – zbroja 24 pkt (+22 DEF), miecz 16 pkt (+21 ATK), tarcza 18 pkt (+16 DEF). Etapy niżej niż Lodowe góry dają bardzo mało XP (×0,1).
- **Piorun** zadaje finałowemu bossowi tylko 20% obrażeń (zamiast 50%).
- **Minigra PONG** na stadionie, fala 6: nowa mapa „Boisko” (widok z góry, bez nieba), ruch po całym boisku, gra z bramkarzem do 5 goli. Spacja = mocny strzał. Wygrana: +2 pkt, +1 eliksir, +30% HP i przejście do fali 7; porażka = rewanż bez kary.
- **Nowi przeciwnicy:** Rudolf (Lodowe góry), Upiór (Lawowa otchłań, fale 1–4), Skarabeusz (Pustynia, fale 1–2), Mechaniczna ręka (Stara elektrownia, 3 ostatnie zwykłe fale), Bramkarz (Stadion, od fali 7).
- **Bard w Moczarach** (po 2. fali): tonący bard, animacje, dialogi i wybór „Pomóż / Przejdź obok”. Pomoc = zasadzka bagiennych stworów i bard w drużynie na stałe (dodatkowy kompan poza limitem 3, strzela nutami). Przejście obok = w Tajdze wrogowie mają +30% HP i +25% ATK.
- Techniczne: nowe pliki `pong.js`, `events.js`, generatory grafik `tools/gen130_*.py`, test `tools/test_pong.js`; tłumaczenia EN/ES nowych tekstów.

## [1.2.3]

- **Hardcore – start od razu:** po kliknięciu „Kampania ☠ HARDCORE” kampania rozpoczyna się natychmiast (bez mapy świata).
- **Kody a osiągnięcia:** po jednorazowym odpaleniu kodów (Konami / 7× portret) osiągnięcia nie są już przyznawane – nawet po wyłączeniu trybu deweloperskiego.
- **Burza śnieżna** w Lodowych górach: działa na tej samej zasadzie co burza piaskowa na pustyni (25% szans poza bossem, niższa celność bohatera i kompanów, chłodny tint + gęsty śnieg).
- **Tajga – łatwiejsi przeciwnicy:** zwykli wrogowie w tajdze mają ok. −15% HP i ATK (boss bez zmian).
- **Przed finałowym bossem:** na fali przed bossem ostatniego etapu pojawiają się zarówno zbrojmistrz, jak i handlarz.
- **Nowe przyciski w menu (zablokowane):** „Lokalne multiplayer” oraz „Własne Poziomy” – na razie niedostępne, do późniejszej implementacji.
- **Zmiana sterowania:** w Ustawienia → Sterowanie można przypisać własne klawisze do ruchu, skoku, sprintu, interakcji i muzyki (zapis w localStorage).
- **Mapa bagien:** przywrócono starą mapę bagien. 

---

## [1.2.2]

- **Oryginalne animacje ataku:** każdy wróg ma własny styl dojścia do celu i powrotu (`ENEMY_DEFS[...].move`): sprint, skok po łuku, podskoki, nurkowanie z góry, taran (cofnięcie i uderzenie), turlanie, miażdżący upadek, przykucnięcie i skok, chwiejny marsz, zniknięcie i pojawienie się, zygzak. 12 stylów; wrogowie czysto dystansowi (np. piłkarz) mają własne animacje pocisków.
- **Promieniowanie w starej elektrowni:** na ok. 30% fal (poza bossem) zielony, migający tint. Co rundę bohater traci 3% maks. HP, a jego ATK i DEF spadają o kolejne 6% (maks. −42%). Eliksir zmniejsza skutki o 3 poziomy. Po fali statystyki wracają do normy.
- **Osiągnięcia za bossów:** 8 nowych (Orc, Wiedźma, Leszy, Yeti, Królowa Pająków, Sfinks, Mechaniczny Kolos, Demon Lord) + „Pogromca bossów” (wszyscy 10) + „Bez drugiej szansy” (kampania w hardcore). Razem 20.
- **Poziomy trudności** (Tab → Ustawienia → Rozgrywka): Łatwy (−25% HP i ATK wrogów, +20% XP), Normalny, Trudny (+30% HP, +25% ATK, −10% XP), Koszmar (+70% HP, +50% ATK, −20% XP). Zmiana działa od następnej fali, wybór jest zapamiętywany.
- **Tryb hardcore:** nowy przycisk „Kampania ☠ HARDCORE” (ekran tytułowy i Menu). Śmierć kończy kampanię – autozapis jest usuwany, zapisy tej kampanii w slotach są kasowane z bazy i nie da się ich wczytać (nawet gdyby kasowanie z bazy się nie udało). Totem nieśmiertelności nadal ratuje.

---

## [1.2.1]

- **Rybik cukrowy:** po zabiciu 25% szans na rozdwojenie – powstają dwa nowe rybiki z 50% maks. HP poprzedniego (połowa XP; do 2 pokoleń, o ile jest miejsce na arenie).
- **Jeden spójny system przycisków:** złota płytka z fazą i efektem wciskania; warianty: ciemny (zakładki/wybór), aktywny, czerwony (niebezpieczne), mały; przełączniki i grupy opcji.
- **Ustawienia przebudowane:** kategorie po lewej (Ogólne, Dźwięk, Grafika, Sterowanie, Rozgrywka, Dane, Deweloper), wiersze opcji po prawej. Nowe opcje: wstrząsy ekranu, cząsteczki otoczenia, paski życia wrogów, reset osiągnięć, przywracanie ustawień domyślnych.
- **Sklepy (handlarz, zbrojmistrz, wiedźma):** nowy układ – portret postaci i punkty w nagłówku, kategorie, karty z ikoną, opisem, ceną i stanem (posiadane / zablokowane / brak punktów).
- **Pustynia – event na falę** (poza bossem): 50% normalnie, 25% **burza piaskowa** (żółty odcień, wiejący piasek, więcej pudeł po stronie bohatera i kompanów), 25% **fatamorgana** (2 miraże, które nie istnieją – trafienie rozwiewa je bez obrażeń; prawdziwi wrogowie mają +30% ATK).

---

## [1.2.0]

### Tryb nieskończony (bardziej grywalny)
- Łagodny start: fale 1-2 to tylko jeden najsłabszy wróg mapy; liczba wrogów rośnie powoli (1 → 4).
- Trudność rośnie wolniej niż dawniej (fala 10 ≈ 5, 20 ≈ 9,5, 30 ≈ 17,5; wcześniej: równa numerowi fali), a XP wrogów ma premię ×1,5.
- Mapa zmienia się co 5 fal, a 5. fala każdej mapy to jej boss.
- W statystykach (Tab → Menu) jest **najdalsza fala** w trybie nieskończonym.

### Osiągnięcia (Tab → zakładka Osiągnięcia)
10 osiągnięć w prostokątnych kafelkach jeden pod drugim (ikona + opis + stan); powiadomienie w rogu ekranu po odblokowaniu. Postęp zapisuje się w przeglądarce (`mw_prog`), osiągnięć nie przyznaje tryb deweloperski.

### Nowi przeciwnicy
Dmuchawiec (las), Zmutowany jeż i Drzewiec (tajga), Czarny kot (bagna), Rybik cukrowy (jaskinia), Zepsute zmutowane auto (stara elektrownia). **Z Yeti wychodzą pchły** (co 4. turę, po 2).

### Nowe ulepszenia u handlarza (po pokonaniu Yeti)
- **Atak pioruna – 18 pkt:** czarna chmura nadlatuje i razi wybranego wroga (50% jego maks. życia); raz na etap.
- **Totem nieśmiertelności – 25 pkt:** zamiast śmierci odradzasz się z 50% HP (totem się zużywa, można kupić kolejny).

### Inne
- Zbroję dla giermka kupisz tylko, gdy masz giermka.
- **Ustawienia graficzne** (Tab → Ustawienia): jakość Niska / Średnia / Wysoka.
- Menu (Tab) ma zakładki: Menu | Ustawienia | Osiągnięcia.
- Licznik śmierci przeżywa „Spróbuj ponownie”.
- Nowe grafiki: 7 przeciwników, 10 ikon osiągnięć (generator: `tools/generate_v120.py`).

---

## [1.1.1]

### Przeciwnicy i etapy
- **Sędzia** pojawia się też na wcześniejszych falach ostatniego etapu (najwyżej 1 na falę, nigdy sam); piłkarze dostają jego szybkość od początku fali.
- Nowy przeciwnik na stadionie: **Kibic** – kij baseballowy, co 3. turę **rzuca racą** (animacja rzutu, lecąca raca, podpalenie).
- Nowy przeciwnik na bagnach: **Zmutowany komar** – lata, zatruwa i wysysa życie.
- **Stara elektrownia: wrogowie mają 1,4× HP, Mroczny stadion: 1,5× HP** (zwykli przeciwnicy; bossowie bez zmian). Stałe: `hpMul` w `maps.js`.
- **Demon Lord (Lawowa otchłań) mocniejszy**: HP 150→240, ATK 15→19, DEF 5→7, nowy 4-turowy wzorzec z ogniem otchłani (podpalenie).

### Ustawienia (Tab)
- **Język**: polski / English / Español (zapamiętywany). Tłumaczone: menu, HUD, sklepy, przedmioty, nazwy wrogów i map, komunikaty walki, dymki bossów, fabuła, napisy końcowe.
- **Ruch po kliknięciu** (domyślnie wyłączony): klik w ziemię = żółta otoczka i bohater idzie w to miejsce; klik we wroga nadal go namierza.
- Tryb dev: przycisk **Do bossa** + opcja „Etapy zaczynaj od bossa”.

### Inne
- **Pustynia**: easteregg z głową w słońcu działa jak w lesie.
- **Stoisko wiedźmy** narysowane od nowa (nowa grafika `witchstall.png`, bulgoczący kocioł, wiedźma lewituje nad ladą).
- Nowe grafiki: `fan*.png`, `mutmosq*.png`, `witchstall.png` (generator: `tools/generate_v111.py`).

---

## [1.1.0] – 2026-11-10

### Zapis w PostgreSQL (3 sloty)
- Nowy serwer `server/` (Node + `pg`): API `/api/saves` + hosting gry. Tabela `saves` tworzy się sama (`server/schema.sql`).
- **3 sloty** na kampanię albo tryb nieskończony. Menu **Tab**: *Zapisz grę*, *Wczytaj grę*, *Nowa kampania*, *Nowy tryb nieskończony*; „Wczytaj grę” jest też na ekranie tytułowym.
- Zapis w walce = wczytanie zaczyna tę falę od nowa; zapis po wygranej fali = wracasz do sklepów. Zapisu nie ma w dialogach, sklepie i chatce wiedźmy.
- Start: `cd server && npm install && npm start` → http://localhost:3000 (`DATABASE_URL`, domyślnie `postgres://postgres:postgres@localhost:5432/pixelrpg`).

### Kula ognia
- Kosztuje **10 pkt** (było 6) i ma **własną moc** (70, niezależną od ATK/miecza); ulepszasz ją osobno: *Moc kuli ognia* (+15, do 10×).
- **Jedna** kula przelatuje przez wszystkich wrogów: 100% → 50% → 25%…, maleje z każdym trafieniem. Odnowa **5 tur**.

### Sklepy i NPC
- Kowal: **skórzana zbroja giermka** (3 pkt, +4 DEF każdemu giermkowi, nowy wygląd).
- Tryb nieskończony: po **każdej** fali obok siebie zbrojmistrz i handlarz.
- **Wiedźma** (kampania): po pokonaniu zostaje NPC na Moczarach (sklep tuż po bossie). Z mapy świata (Tab) klik w Moczary = wizyta w jej chatce, gdy jesteś gdzie indziej. Sprzedaje eliksiry i talizmany szczęścia (Łapka królika +5%, Koniczyna +8%, Podkowa +12% szansy na krytyk).

### Inne
- Tryb deweloperski: przycisk **Pomiń falę**.
- Piłkarze **kopią piłkę** (animacja kopnięcia + lecąca piłka).
- Napisy końcowe przewijają się od dołu jak w filmie.
- Nowe grafiki: `comp_squire_leather*.png`, `kicker_kick.png`.

---
## [1.0.0] – 2026-11-10  (pierwsze wydanie stabilne)

### Dialogi bossów
- Każdy boss ma teraz prawdziwe **dymki dialogowe** (klik / Spacja / Enter = dalej): na początku walki **obraża bohatera**, przy śmierci **życzy mu niepowodzeń**, a gdy zabije gracza – **go wyśmiewa**. Teksty w `DLG` (enemies.js).
- Walka rusza dopiero po zakończeniu rozmowy (stan `talk`).

### Ekwipunek
- Usunięto „sprzedaż” (zwrot połowy kosztu starego przedmiotu). Nowy przedmiot zastępuje stary – zostaje **tylko najlepszy kupiony** w danym slocie (miecz / zbroja / tarcza / dystans). Słabszego przedmiotu nie da się kupić („masz lepszy”).

### Mapa świata
- Nowy układ: siatka „wężykiem” 5×2, kafelki **z obrazkami światów**, nazwą, bossem i stanem (ukończony / dostępny / zablokowany / tu jesteś); strzałki pokazują kolejność, nic się nie nakłada. Najechanie pokazuje przeciwników etapu.
- **Podgląd mapy w menu (Tab)**: kliknięcie odblokowanego etapu **przenosi do niego** (z potwierdzeniem).

### Grafika
- Wszystkie tła etapów narysowane od nowa (głębia, warstwy, światło): las, wioska, moczary, **tajga** (góry, świerki, mgła), przełęcz, lodowe góry, wejście do jaskini, jaskinia z kryształami, **pustynia** (piramidy z Gizy, oaza, ruiny, wydmy), tunel, elektrownia, szyb, otchłań, stadion.
- Wszyscy przeciwnicy przerysowani (cieniowanie, kontury, animacje ataku 3-klatkowe).
- **Leszy** jak z Wiedźmina (czaszka jelenia z porożem, kora, korzenie, mech, wrona) – 64×64.
- **Sfinks** jak z Egiptu (nemes, uraeus, broda, kołnierz usekh, ślady pazurów) – 64×64.
- Nowe ikony efektów: but (szybkość), kamień.
- Generatory: `tools/generate_v1.py` (+ `art.py`, `gen_*.py`); stare skrypty w `tools/legacy/`.

### Nowi przeciwnicy
- **Jaskinia – Nietoperz** (latający, wysysa życie).
- **Lodowe góry – Bałwan** (zimowy; co 3. tura ciska lodową kulą = zamrożenie, plus szansa przy ciosach).
- **Opuszczona wioska – Krasnolud** (twardy, mocny cios toporem co 3. tura).
- **Lawowa otchłań – Bazyliszek** (spojrzenie zamienia w **kamień na 2 rundy** – działa jak zamrożenie; odporność na efekty działa; skamieniały nie płonie i nie zamarza).
- **Stara elektrownia – Myśliwiec laserowy** (latający, strzela laserem; oryginalny projekt w stylu TIE).
- **Utopiec** ma animację **rzutu trójzębem** (co 3. tura) – trójząb leci łukiem w bohatera.

### Piłkarze i Mroczny Trener
- Piłkarze mocniejsi (34 HP, ATK 12, DEF 2, unik 15%, czasem podwójne kopnięcie).
- Trener przywołuje **2 piłkarzy + Sędziego** (supporter). Dopóki żyje sędzia, piłkarze mają efekt **Szybkości (ikona buta)**: **atakują jako pierwsi** (przed ruchem gracza) i **o 40% mocniej**. Sędzia nie atakuje – gwiżdże i podtrzymuje szybkość.
- Trener jest **nietykalny** (niebieska tarcza, napis NIETYKALNY), dopóki żyją piłkarze lub sędzia – trzeba ich najpierw pokonać. Kula ognia omija nietykalnego.
- Trener **leczy się** (15% HP, izotonik), gdy ma mniej niż 65% zdrowia.

### Naprawione
- `story.js`: urwane `(500);` w prologu zamiast `await c.wait(500)`.
- Pociski wrogów latających startują z poprawnej wysokości.
- Wersja gry widoczna na ekranie tytułowym.

---

## [9.2] – 2026-11-09

### Naprawione
- **HUD**: poprawione wyświetlanie punktów umiejętności i eliksirów (kolejność i wartości).

### Dodane
- Umiejętność **Podwójne uderzenie** (u wieśniaka, 4 pkt) – 25% szans na drugi cios przy ataku / krytyku.
- **Łuk** i **Kusza** przeniesione do sklepu **zbrojmistrza** (sekcja Broń dystansowa).
- W trybie deweloperskim **nieskończone punkty** umiejętności (∞ w HUD i darmowe zakupy).
- **Napisy końcowe** po uratowaniu księżniczki z kredytem muzyki:
  - Colossal by Aylex (freetouse.com)
  - Gameboy by Walen (freetouse.com)

### Pliki
- `ui.js`, `player.js`, `combat.js`, `story.js`, `style.css`, `CHANGELOG.md`

---

## [9.1] – 2026-11-09

### Dodane
- **Mapa świata** – wyświetlana na starcie kampanii oraz po śmierci gracza.
  - Kafelki etapów połączone ścieżką; kliknięcie odblokowanego etapu przenosi do niego.
  - Niepokonane etapy są zablokowane (🔒).
  - W trybie deweloperskim (Konami) wszystkie etapy odblokowane od razu.
- **Menu Tab** (klawisz Tab):
  - Podgląd mapy świata
  - Włączanie/wyłączanie muzyki + suwak głośności
  - Statystyki gracza (zabici przeciwnicy, liczba śmierci, poziom, eliksiry)
  - Poziom trudności – zablokowane (wkrótce)
  - Ustawienia graficzne – zablokowane (wkrótce)
- **Dialogi bossów** – każdy boss ma unikalną kwestię przy wejściu do walki.
- Śledzenie statystyk: `kills` (zabici) i `deaths` (śmierci) zapisywane z postacią.

### Zmienione
- **Kula ognia**:
  - Zadaje obrażenia **wszystkim** przeciwnikom na arenie.
  - Każdy kolejny cel otrzymuje **połowę** obrażeń poprzedniego.
  - Cooldown: 3 tury (nie odnawia się automatycznie przy przejściu do kolejnej fali).
  - Odnawia się w pełni przy wejściu w **nowy etap** lub **walkę z bossem**.

### Pliki
- `ui.js` – mapa świata, menu Tab
- `game.js` – integracja mapy, Tab, logika odnowy kuli ognia, dialogi
- `combat.js` – AoE kuli ognia, licznik zabójstw
- `enemies.js` – linie dialogowe bossów
- `player.js` – pola kills/deaths
- `style.css` – style mapy i menu
- `assets/ui/worldmap.png` – tło mapy

---

## [8.3] – 2026-11-09

### Dodane
- Etap **Tajga** (między Moczarami a Lodowymi górami): niedźwiedź brunatny, bóbr, boss Leszy (drapnięcie + ryk).
- Etap **Pustynia** (między Jaskinią pająków a Starą elektrownią): skorpion, mumia, boss Sfinks (efekt Piasek – obniża celność).
- Generatory assetów: `tools/generate_taiga.py`, `tools/generate_desert.py`.

---

## [8.2] – wcześniejsza wersja bazowa
- Kampania, tryb nieskończony, zbrojmistrz, kupiec, moczary, bossowie, muzyka, swing miecza.
