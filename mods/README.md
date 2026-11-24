# Mody – własne kampanie (v1.4.0)

## Jak stworzyć mod
1. W menu głównym wybierz **Mody (własne kampanie) → 🛠 Kreator modów** (albo otwórz `editor/editor.html`).
2. Ustaw nazwę moda, narysuj **mapy** (tło 160×80 px) i **wrogów** (sprite 32×32, boss 48×48 – klatki idle / attack / hurt / death, wróg patrzy w PRAWO).
3. Dla wroga ustaw statystyki, **zachowanie w walce** (zwykły, podwójny cios, ciężki, boss, strzelec, ognisty, jadowity),
   **animację ataku**, **typ** (odporności: roślina = ogień x3, zimowy = odporny na mróz itd.) oraz szanse zatrucia / podpalenia / zamrożenia.
4. W panelu **Kampania moda** dodaj etapy: dla każdego wybierz mapę, zwykłych wrogów i bossa. Możesz używać zarówno własnych, jak i **wbudowanych** map oraz wrogów gry,
   a także dodać minigrę (bobrza tama, labirynt, lawowa zagadka, pong) w wybranej fali.
5. **Zapisz** (localStorage) albo **Eksportuj .mwmod** (plik do udostępnienia).

## Jak grać
Menu główne → **Mody (własne kampanie)** → ▶ Graj (lub **Importuj plik .mwmod**).
W modach działa ta sama walka, sklepy, drużyna (T) i mapa świata. Zapisy w slotach i osiągnięcia są wyłączone.
Etap numer *i* (od 0) ma *i + 3* fale – ostatnia to boss.

Przykład: `mods/przyklad.mwmod` (zaimportuj go w menu Modów).

## Format pliku `.mwmod`
JSON: `id, name, author, version, maps, enemies, campaign` – patrz komentarz na początku `mod-api.js`.
