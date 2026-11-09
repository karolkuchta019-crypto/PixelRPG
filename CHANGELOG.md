# Changelog – Monster Waves

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
