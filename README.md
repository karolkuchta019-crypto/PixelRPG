# Monster Waves – jak dodać grafiki
Wrzucaj PNG pod poniższymi nazwami. Nic w kodzie nie trzeba zmieniać. Brak pliku = placeholder.
Wymiary klatki ustawiasz w `assets.js` (domyślnie 32x32). Animacja = poziomy pasek klatek (np. 4 klatki = 128x32).
Sprite'y powinny patrzeć w PRAWO (wrogowie są odbijani automatycznie).

## Postacie (assets/player, assets/enemies)
hero.png (idle), hero_walk.png, hero_attack.png, hero_hurt.png, hero_death.png
to samo dla: slime, goblin, skeleton  (np. enemies/slime_attack.png)
Nowy potwór: dodaj wpis w `ENEMY_DEFS` (enemies.js) i `ASSETS` (assets.js), potem pliki graficzne.

## Mapy (assets/maps)
forest.png, village.png, ruins.png – 640x320 (pełne tło z podłogą od y≈170).

## Efekty (assets/effects)
hit.png, crit.png – pasek klatek 32x32, odtwarzany raz przy trafieniu.

## Interfejs (assets/ui)
pixel.ttf (czcionka), page-bg.png, panel.png (9-slice, rogi 16px), panel-fill.png, portrait-frame.png,
bar-bg.png, bar-hp.png, bar-xp.png, button.png, button-hover.png, log-bg.png, screen-bg.png

## Ikony (assets/items)
icon-attack.png, icon-crit.png, icon-defend.png, potion.png (ok. 22x22)

## Tryby gry
- Kampania: etapy w `CAMPAIGN` (maps.js), każdy z własną mapą i falami; kończy się ekranem zwycięstwa.
- Nieskończony: fale generowane bez końca (`getWave`), kończy się dopiero śmiercią.

## Wygenerowane grafiki
Wszystkie PNG w `assets/` wygenerował `tools/generate_assets.py` (python3 + Pillow). Możesz je nadpisać własnymi plikami
albo edytować skrypt i uruchomić go ponownie. Bossowie (slimeking, orc, demon) mają klatki 48x48.
Dodatkowe mapy: lava (etap 3), cave, volcano (używane w trybie nieskończonym).

## Wygenerowane grafiki
Wszystkie PNG w `assets/` wygenerował `tools/generate_assets.py` (python3 + Pillow). Możesz je nadpisać własnymi plikami
albo edytować skrypt i uruchomić go ponownie. Bossowie (slimeking, orc, demon) mają klatki 48x48.
Dodatkowe mapy: lava (etap 3), cave, volcano (używane w trybie nieskończonym).

## Sklep i przejścia
Po wygranej fali dojdź do prawej krawędzi – mapy płynnie się przesuwają. Między etapami (w trybie nieskończonym co 5. falę) otwiera się sklep kupca: umiejętności kupujesz za punkty poziomu (lista `SKILLS` w player.js). Portret kupca: assets/ui/merchant.png.

## Światy i łączniki
Mapy mają pole `tone` (jasność). Przejście między skrajnie różnymi mapami prowadzi przez mapę-łącznik (`LINKS` w maps.js), np. śnieg → wejście do jaskini → jaskinia → tunel → elektrownia → gorący szyb → lawa.
Kupiec ze straganem (assets/items/stall.png, assets/ui/merchant.png) czeka na mapie po bossie: podejdź i naciśnij E lub kliknij.

## Tryb deweloperski (nieskończone HP)
Włączasz/wyłączasz w trakcie gry: kod Konami (↑ ↑ ↓ ↓ ← → ← → B A) albo 7 kliknięć w portret bohatera w ciągu 3 s. W rogu areny pojawia się napis DEV.

## Fabuła, walka, kompani
- story.js: prolog (porwanie księżniczki), zakończenie dobre (zamek, drzwi, serduszko, THE END) i złe (porażka z bossem finałowym). Klik/spacja = dalej, „Pomiń” = skip.
- Ostateczny boss: Mroczny Trener (fikcyjna postać) – shotgun, szklana butelka z trucizną, przyzywanie piłkarzyków, cios gwizdkiem.
- Trucizna: 3 tury, ikona z liczbą tur; eliksir ją leczy. Sklep: Łuk, Kusza, Zatrute ostrza, Kompani (10 pkt, max 3, walczą do śmierci).
- Punkty umiejętności: +1 za falę, +3 za bossa, +1 za awans. Nowe grafiki: assets/player/princess, comp_*, assets/enemies/coach, kicker, assets/effects/poison.

## Efekty, odporności, dev
- Trucizna: goblin/orc, ludzie, elfy, zwierzęta, yeti. Podpalenie: wszyscy oprócz ognistych (Imp, Lawowy Golem, Demon). Zamrożenie (traci 2 tury): wszyscy oprócz zimowych (Yeti).
- Naziemni są odporni na ataki dystansowe (x0.7), latający (Dron, Imp, Demon) na broń białą (x0.7).
- Kompani pojawiają się po zamknięciu sklepu obok bohatera, podążają za nim i atakują automatycznie co turę (60% statystyk gracza).
- Tryb dev: nieskończone HP + zabijanie jednym atakiem.

## Aktualizacja
- Shift = sprint. Sklep: Odporność na efekty (2 pkt, do x3, -25% szans każda), Kula ognia (6 pkt, nowy przycisk, odnawia się co 3 tury), kompani po 5 pkt.
- Przejście między mapami: łagodny start/koniec, mgła i mieszanie kolorów na styku, smugi prędkości, winieta, nazwa nowej lokacji, klimatyczne cząsteczki (liście, śnieg, iskry, żar).
- Mroczny Trener: nowy, bardziej realistyczny sprite 64x64 (oryginalny projekt fikcyjnej postaci).

## Skróty i easter egg
- Klik w „Idź w prawo ▶” w prawym górnym rogu = natychmiastowe przejście na kolejną mapę.
- Klik w słońce (las, lodowe góry) podmienia je na alternatywne słońce w okularach (assets/effects/sun_alt.png – można podmienić na własną grafikę 36x36).
- Zły koniec: Mroczny Trener celuje z shotguna i strzela do księżniczki (huk, błysk, wstrząs ekranu).

## Aktualizacja v8.2
### Fale i etapy (kampania)
- Liczba fal rośnie z etapem: etap 1 = 3 fale, etap 2 = 4, etap 3 = 5 ... (wzór `stageWaveCount` w maps.js). Ostatnia fala etapu to zawsze boss.
- Liczba przeciwników w każdej fali jest losowana (`rollFoeCount`), ale z każdą falą rośnie – każda fala ma więcej wrogów niż poprzednia, aż do limitu `MAX_FOES` (4 – tyle mieści się na arenie).
- Etapy to teraz dane: `CAMPAIGN` w maps.js ma `{name,map,foes,boss}`. Fale generuje `buildWaves(i)` przy wejściu na etap (i przy ponownej próbie po porażce).
- Trudność wrogów (`G.diff()`) rośnie wolniej z numerem fali, bo etapy są dłuższe.

### Nowy etap: Moczary (między Opuszczoną wioską a Lodowymi górami)
- Mapa `swamp` (bagna, chatka wiedźmy na kurzych nogach, mangrowce w oddali, świetliki). Do Lodowych gór prowadzi mapa-łącznik `pass`.
- Przeciwnicy: Utopiec z trójzębem (`drowned`), Chmara komarów (`mosquitos`, zatruwa), boss Wiedźma na miotle (`witch`: pikowanie, zatruta mikstura, przyzywa komary, klątwy). Komary i wiedźma latają (odporność na broń białą x0.7), utopiec jest odporny na truciznę.
- Grafiki: tools/generate_swamp.py (osobny skrypt – nie rusza reszty assetów). Uruchom `python3 tools/generate_swamp.py`, albo podmień PNG własnymi.
- Tryb nieskończony też przechodzi przez Moczary (`PATH` w maps.js).

### Muzyka
- Domyślnie wyłączona. Włączasz klawiszem **M** albo przyciskiem megafonu w prawym górnym rogu.
- Pod każdy świat podkładasz plik `assets/music/<klucz-mapy>.mp3` (forest, village, swamp, ice, cave, plant, lava, stadium; opcjonalnie castle). Pełna lista: assets/music/README.txt. Brak pliku = cisza.
- Kod: music.js (zapętlanie, crossfade przy zmianie świata, cisza w menu).

### Cięcie mieczem (swing)
- Gdy bohater ma założony miecz, ostrze obraca się wokół dłoni: zamach do tyłu -> szybkie cięcie łukiem -> powrót. Za ostrzem ciągnie się smuga (kolor zależy od miecza), a trafienie przypada na środek cięcia.
- Cios krytyczny = większy zamach i złota, szersza smuga. Ślad cięcia w miejscu trafienia to teraz smukły półksiężyc.
- Kod: `swingBlade` / `swingAng` w game.js, start animacji w `Combat.strike` (combat.js).

## Wersja 1.0.0
Pełna lista zmian w CHANGELOG.md. Najważniejsze:
- Dialogi bossów (dymki), brak sprzedaży ekwipunku (zostaje najlepszy przedmiot), nowa mapa świata z teleportem z menu (Tab).
- Przerysowane tła i potwory; nowi wrogowie: nietoperz, bałwan, krasnolud, bazyliszek (kamień), myśliwiec laserowy; utopiec rzuca trójzębem.
- Finałowy boss: sędzia + mocniejsi piłkarze (szybkość = but), nietykalność podczas przywołania, leczenie.
- Grafiki: `cd tools && python3 generate_v1.py` (Pillow + numpy). Bohater/ekwipunek/Trener: `tools/legacy/generate_assets_v9.py`.
- Nowy wróg: wpis w `ENEMY_DEFS` (enemies.js), `ASSETS` (assets.js), pliki w assets/enemies/; dialogi bossa: `DLG`.
- Dodatkowe animacje (np. `drowned_throw.png`): pole `extra` w ASSETS; efekt rzutu: `rng:'trident'|'laser'|'snowball'` w `behave`.
