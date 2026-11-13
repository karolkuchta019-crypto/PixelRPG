# Changelog – Monster Waves

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
