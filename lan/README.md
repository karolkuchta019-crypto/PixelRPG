# Multiplayer LAN (v1.4.0)

Każdy gracz steruje swoją postacią na **swoim komputerze**; wszyscy muszą być w tej samej sieci (Wi-Fi / kabel).

## Gospodarz (jeden komputer)
1. Zainstaluj Node.js, uruchom **`start-lan.bat`** (Windows) lub **`./start-lan.sh`** (Linux/macOS).
   Okno pokaże adresy, np. `http://192.168.0.12:3000`.
2. Otwórz w przeglądarce `http://localhost:3000` → **Multiplayer (LAN…) → 🌐 LAN → Załóż grę (2 lub 3 graczy)**.
3. Przekaż pozostałym kod pokoju (4 litery). Gdy dołączą, kliknij **Start**.

## Pozostali gracze
1. W przeglądarce otwórz adres gospodarza (np. `http://192.168.0.12:3000`) – nie plik z dysku!
2. **Multiplayer → 🌐 LAN → Dołącz do gry** → wybierz pokój albo wpisz kod.

Jeśli łączenie się nie udaje, zezwól Node.js w zaporze systemu Windows (sieć prywatna) na port 3000.

## Zasady
* Tury: gracz wykonuje akcję (Atak, Cios krytyczny, Obrona, Eliksir, Kula ognia…) → po niej wszyscy wrogowie atakują właśnie jego → tura następnego.
* Kliknij wroga na planszy, by go namierzyć (dotyczy gracza, który ma turę). Przyciski akcji są aktywne tylko w Twojej turze.
* Więcej graczy = więcej przeciwników i więcej HP bossów. XP dostają wszyscy żywi, poległy wraca na kolejnej fali z 25% HP.
* Sklepy (kupiec / zbrojmistrz) otwierają się **wszystkim jednocześnie**, kiedy gospodarz podejdzie do NPC i naciśnie E.
* Między falami drużynę prowadzi gospodarz (ruch, E, przejście w prawo). Gospodarz liczy całą grę – jeśli on wyjdzie, gra się kończy.
  Gdy rozłączy się zwykły gracz, jego postać po prostu odpada z walki.
* W trybie sieciowym: bez kompanów, minigier, zapisów w slotach i osiągnięć.
* Serwer LAN nie wymaga bazy danych (`server/server.js` z PostgreSQL też go obsługuje).
