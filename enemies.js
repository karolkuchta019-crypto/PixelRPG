/* Definicje potworów. behave(e) zwraca tablicę mnożników obrażeń (każdy element = jedno uderzenie). */
const ENEMY_DEFS={
 slime:{name:'Slime',hp:30,atk:9,def:1,dodge:.05,crit:.05,xp:12,scale:2.5,behave:()=>[1]},
 goblin:{name:'Goblin',hp:40,atk:11,def:2,dodge:.2,crit:.1,xp:20,scale:2.8,
  behave:()=>Math.random()<.3?[.6,.6]:[1]},                 // szybki: czasem podwójne uderzenie
 skeleton:{name:'Skeleton Warrior',hp:90,atk:14,def:5,dodge:.05,crit:.1,xp:50,scale:3.6,
  behave:e=>e.turn%3===0?[2]:[.8]},                          // co 3 tura potężny cios
 shroom:{name:'Grzybek',hp:28,atk:9,def:1,dodge:.1,crit:.05,xp:14,scale:2.6,behave:()=>Math.random()<.25?[.6,.6]:[1]},
 elf:{name:'Leśny Elf',hp:38,atk:12,def:2,dodge:.25,crit:.2,xp:24,scale:2.8,behave:()=>Math.random()<.25?[.6,.6]:[1]},
 lavagolem:{name:'Lawowy Golem',hp:80,atk:15,def:6,dodge:.02,crit:.05,xp:45,scale:3.2,behave:e=>e.turn%2===0?[1.6]:[.7]},
 imp:{name:'Imp',hp:35,atk:10,def:2,dodge:.1,crit:.3,xp:22,scale:2.8,behave:()=>[1]},   // często krytykuje
 wolf:{name:'Wilk',hp:34,atk:12,def:1,dodge:.2,crit:.15,xp:22,scale:2.8,behave:()=>Math.random()<.35?[.6,.6]:[1]},
 spider:{name:'Pająk',pois:.4,hp:30,atk:10,def:1,dodge:.15,crit:.1,xp:20,scale:2.6,behave:()=>Math.random()<.5?[.5,.5,.5]:[1]},
 drone:{name:'Dron',hp:28,atk:13,def:3,dodge:.2,crit:.1,xp:28,scale:2.6,behave:()=>[1.1]},
 robot:{name:'Zardzewiały Robot',hp:70,atk:15,def:7,dodge:.02,crit:.05,xp:45,scale:3,behave:e=>e.turn%3===0?[1.9]:[.8]},
 drowned:{name:'Utopiec',hp:55,atk:13,def:3,dodge:.08,crit:.1,xp:28,scale:2.8,behave:e=>e.turn%3===0?[{m:1.9,rng:'trident',magic:1,say:'Utopiec ciska trójzębem!'}]:[1]},   // co 3 tura: RZUT trójzębem (animacja throw)
 mosquitos:{name:'Chmara komarów',pois:.3,hp:24,atk:10,def:0,dodge:.25,crit:.05,xp:16,scale:2.6,behave:()=>Math.random()<.5?[.6,.6,.6]:[.6,.6]},   // wiele małych użądleń, często zatruwają
 bear:{name:'Niedźwiedź brunatny',hp:70,atk:15,def:4,dodge:.05,crit:.12,xp:36,scale:3.0,behave:e=>e.turn%3===0?[{m:1.8,say:'Niedźwiedź drapie pazurami!'}]:[1]},
 beaver:{name:'Bóbr',hp:38,atk:11,def:2,dodge:.15,crit:.1,xp:22,scale:2.6,behave:()=>Math.random()<.35?[.7,.7]:[1]},
 scorpion:{name:'Skorpion',pois:.45,hp:32,atk:12,def:2,dodge:.18,crit:.1,xp:24,scale:2.6,behave:()=>Math.random()<.4?[.6,.6]:[1]},
 mummy:{name:'Mumia',hp:60,atk:13,def:4,dodge:.06,crit:.08,xp:32,scale:2.9,behave:e=>e.turn%3===0?[{m:1.6,say:'Mumia zaciska bandaże!'}]:[1]},
 kicker:{name:'Piłkarz',hp:34,atk:12,def:2,dodge:.15,crit:.12,xp:10,scale:2.5,behave:()=>Math.random()<.35?[.8,.8]:[1.1]},   // v1.0: mocniejszy; ze wsparciem sędziego (haste) atakuje pierwszy i mocniej
 referee:{name:'Sędzia',hp:46,atk:6,def:3,dodge:.08,crit:.05,xp:14,scale:2.5,support:1,behave:()=>[{buff:'haste',say:'Sędzia gwiżdże: „Gramy dalej, szybciej!”'}]},   // SUPPORTER: daje piłkarzom szybkość (but)
 bat:{name:'Nietoperz',hp:30,atk:10,def:1,dodge:.3,crit:.1,xp:20,scale:2.6,drain:.5,behave:()=>Math.random()<.4?[.6,.6]:[1]},   // wysysa życie (leczy się z obrażeń)
 snowman:{name:'Bałwan',hp:58,atk:11,def:3,dodge:.05,crit:.05,xp:30,scale:2.9,freeze:.3,behave:e=>e.turn%3===0?[{m:.9,rng:'snowball',magic:1,freeze:1,say:'Bałwan ciska lodową kulą – zamrożenie!'}]:[1]},
 dwarf:{name:'Krasnolud',hp:62,atk:13,def:6,dodge:.05,crit:.12,xp:30,scale:2.7,behave:e=>e.turn%3===0?[{m:1.8,say:'Krasnolud wali toporem z całej siły!'}]:[1]},
 basilisk:{name:'Bazyliszek',hp:66,atk:13,def:4,dodge:.08,crit:.1,xp:38,scale:3,stone:.1,behave:e=>e.turn%3===0?[{m:.6,stone:1,magic:1,say:'Bazyliszek spogląda w twoje oczy – kamienieje!'}]:[1]},   // spojrzenie: kamień na 2 tury (jak zamrożenie)
 fighter:{name:'Myśliwiec laserowy',hp:34,atk:13,def:3,dodge:.22,crit:.12,xp:30,scale:2.8,behave:()=>Math.random()<.4?[{m:.6,rng:'laser',magic:1,say:'Myśliwiec strzela seriami lasera!'},{m:.6,rng:'laser',magic:1}]:[{m:1.1,rng:'laser',magic:1,say:'Myśliwiec strzela laserem!'}]},
 /* BOSSOWIE – po jednym na etap kampanii, agresywne wzorce ataków */
 slimeking:{name:'Król Slime',boss:1,hp:110,atk:12,def:3,dodge:.03,crit:.1,xp:80,scale:3,line:'„Blub… CAŁY LAS BĘDZIE SLIME!”',behave:e=>e.turn%3===0?[1.8]:[.8,.5]},
 orc:{name:'Orc Berserker',boss:1,hp:130,atk:14,def:4,dodge:.05,crit:.15,xp:120,scale:3,line:'„Ha! Słabiutki człowieczek… pokaż, na co cię stać!”',behave:e=>e.turn%2===0?[1.7]:[1]},
 demon:{name:'Demon Lord',boss:1,hp:150,atk:15,def:5,dodge:.08,crit:.2,xp:200,scale:3,line:'„Płomienie otchłani pożrą twoją duszę!”',behave:e=>e.turn%3===0?[2.2]:[.7,.7,.7]},
 yeti:{name:'Yeti',boss:1,hp:150,atk:16,def:5,dodge:.05,crit:.15,xp:150,scale:3,line:'„RRAAAARGH! Nikt nie przeżywa w tych górach!”',behave:e=>e.turn%2===0?[1.8]:[1]},
 spiderqueen:{name:'Królowa Pająków',boss:1,pois:.6,hp:140,atk:14,def:4,dodge:.12,crit:.15,xp:170,scale:3,line:'„Wplącz się w moją sieć… na zawsze.”',behave:e=>e.turn%3===0?[.6,.6,.6,.6]:[1.1]},
 mech:{name:'Mechaniczny Kolos',boss:1,hp:190,atk:18,def:9,dodge:.02,crit:.1,xp:220,scale:3,line:'„SYSTEM: CEL WYKRYTY. PROTOKOŁ LIKWIDACJI.”',behave:e=>e.turn%3===0?[2.3]:[.9,.9]},
 /* BOSS MOCZARÓW: wiedźma na miotle – pikowanie, zatruta mikstura (butelka), przyzywanie komarów, klątwy */
 witch:{name:'Wiedźma na miotle',boss:1,pois:.5,hp:160,atk:15,def:4,dodge:.1,crit:.15,xp:190,scale:3,line:'„Hehehe… świeże kości na miksturę!”',behave:e=>{const t=e.turn%4;
  if(t===1)return[{m:1.8,say:'Wiedźma pikuje na miotle!'}];
  if(t===2)return[{m:1.1,rng:'bottle',pois:1,p:1,say:'Wiedźma ciska zatrutą miksturą!'}];
  if(t===3)return G.enemies.length<3?[{summon:'mosquitos',n:2}]:[.8,.8];
  return[{m:.7,say:'Wiedźma miota klątwy!'},.7,.7];}},
 /* BOSS TAJGI: Leszy z czaszką jelenia – drapnięcie pazurami i ryk */
 leshy:{name:'Leszy',boss:1,hp:175,atk:16,def:5,dodge:.08,crit:.15,xp:200,scale:2.3,line:'„Las pamięta… a ja jestem jego gniewem.”',behave:e=>{const t=e.turn%3;
  if(t===1)return[{m:1.9,say:'Leszy drapie pazurami!'}];
  if(t===2)return[{m:1.3,say:'Leszy wydaje przerażający ryk!'},.8];
  return[1.1];}},
 /* BOSS PUSTYNI: Sfinks – ataki + efekt piasku (zmniejsza szansę trafienia) */
 sphinx:{name:'Sfinks',boss:1,hp:180,atk:16,def:6,dodge:.1,crit:.12,xp:210,scale:2.3,line:'„Odgadnij zagadkę… albo stań się piaskiem.”',behave:e=>{const t=e.turn%3;
  if(t===1)return[{m:1.7,say:'Sfinks smaga pazurami!'}];
  if(t===2)return[{m:1.0,sand:1,say:'Sfinks wznieca burzę piaskową!'}];
  return[{m:1.2,say:'Sfinks atakuje!'}];}},
 /* OSTATECZNY BOSS (fikcyjny): shotgun, szklana butelka z trucizną, przyzywanie piłkarzyków, cios gwizdkiem.
    behave zwraca liczby (zwykłe uderzenia) albo obiekty: {m:mnożnik,rng:'bullet'|'bottle',pois:1,p:1(cel=gracz),say,summon,n} */
 coach:{name:'Mroczny Trener',boss:1,hp:170,atk:17,def:6,dodge:.06,crit:.15,xp:400,scale:2.6,line:'„Na boisko! Dzisiaj grasz o życie!”',behave:e=>{const t=e.turn%4;
  if(t===1){const n=e.s.hp<e.s.maxhp/2?3:2;return Array.from({length:n},(_,i)=>({m:.75,rng:'bullet',p:1,say:i?'':'Mroczny Trener strzela z shotguna!'}));}
  if(t===2)return[{m:1.1,rng:'bottle',pois:1,p:1,say:'Mroczny Trener rzuca szklaną butelką!'}];
  if(t===3)return G.enemies.length<3?[{summon:'kicker',n:2}]:[{m:.9,rng:'bullet',p:1,say:'Strzał z shotguna!'}];
  return[{m:1.9,say:'Mroczny Trener gwiżdże do ataku!'}];}},
};
function makeEnemy(type,wave,i,boss){   // v1.0
 const d=ENEMY_DEFS[type],k=wave-1,b=1;
 const hp=Math.round(d.hp*(1+.2*k)*b);
 return{key:type,name:d.name,def:d,turn:1,tags:d.tags||[],air:(d.tags||[]).includes('air'),x:390+i*70,y:205+i*12,hx:0,ox:0,oy:0,alpha:1,flash:0,scale:d.scale,face:-1,ph:i,
  xp:Math.round(d.xp*(1+.1*k)),s:{hp,maxhp:hp,atk:Math.round(d.atk*(1+.15*k)*b),def:Math.round(d.def+k*.6),crit:d.crit,dodge:d.dodge}};
}

/* TYPY: poison działa na goblin/human/elf/animal/yeti, burn na wszystkie bez 'fire', freeze na wszystkie bez 'winter'.
   'air' = lata (odporny na broń białą, x0.7); stworzenia naziemne są odporne na ataki dystansowe (x0.7). Orc liczony jako goblin. */
const TAGS={slime:['slime'],goblin:['goblin'],skeleton:['undead'],shroom:['plant'],elf:['elf'],wolf:['animal'],spider:['animal'],drone:['machine','air'],robot:['machine'],
 imp:['fire','demon','air'],lavagolem:['fire','golem'],kicker:['human'],slimeking:['slime'],orc:['goblin'],yeti:['yeti','winter'],spiderqueen:['animal'],mech:['machine'],demon:['fire','demon','air'],coach:['human'],referee:['human'],bat:['animal','air'],snowman:['winter','snow'],dwarf:['human','dwarf'],basilisk:['animal','reptile'],fighter:['machine','air'],
 drowned:['undead','water'],mosquitos:['animal','air'],witch:['human','air'],
 bear:['animal'],beaver:['animal'],leshy:['plant','spirit'],scorpion:['animal'],mummy:['undead'],sphinx:['beast','spirit']};   // utopiec odporny na truciznę, komary i wiedźma latają (odporność na broń białą x0.7)
for(const k in ENEMY_DEFS)ENEMY_DEFS[k].tags=TAGS[k]||[];
Object.assign(ENEMY_DEFS.imp,{burn:.3});Object.assign(ENEMY_DEFS.lavagolem,{burn:.4});Object.assign(ENEMY_DEFS.demon,{burn:.4});Object.assign(ENEMY_DEFS.yeti,{freeze:.4});
/* OSTATECZNY BOSS: cykl 4 tur. Przyzywa 2 piłkarzy + sędziego – dopóki żyją, Trener jest NIETYKALNY (trzeba ich pokonać).
   Gdy ma mało HP, leczy się (izotonik). */
ENEMY_DEFS.coach.behave=e=>{const t=e.turn%4,minions=G.enemies.some(x=>x.minion&&x.s.hp>0);
 if(t===1){const n=e.s.hp<e.s.maxhp/2?3:2;return Array.from({length:n},(_,i)=>({m:1,rng:'bullet',p:1,say:i?'':'Mroczny Trener strzela z shotguna!'}));}
 if(t===2)return[{m:1.4,rng:'bottle',pois:1,p:1,say:'Mroczny Trener rzuca szklaną butelką!'}];
 if(t===3)return minions?[{m:1,rng:'bullet',p:1,say:'Strzał z shotguna!'}]:[{summon:['kicker','kicker','referee']}];
 if(e.s.hp<e.s.maxhp*.65)return[{heal:.15,say:'Mroczny Trener pije izotonik i się leczy!'}];
 return[{m:1.9,say:'Mroczny Trener gwiżdże do ataku!'}];};
/* DIALOGI BOSSÓW (v1.0): intro = obraza bohatera na początku walki, death = życzenie niepowodzeń przy śmierci, win = wyśmianie, gdy zabije gracza */
const DLG={
 slimeking:{intro:['„Blub! Kolejny „bohater”… Wyglądasz jak śniadanie!”','„Zrobię z ciebie galaretkę, przybłędo!”'],death:'„Blub… Obyś potknął się o własny miecz i wpadł do bagna… blub…”',win:'„Blub-blub! Pokonany przez galaretkę! Wracaj do mamusi!”'},
 orc:{intro:['„Ha! Słabiutki człowieczek. Moja babcia bije mocniej, a ma 200 lat!”','„Pokaż, na co cię stać… tylko nie płacz!”'],death:'„Argh… Obyś zgubił miecz, tarczę i resztki godności! Zwykły goblin cię pokona!”',win:'„Hahaha! Leżysz w błocie! Następnym razem przyślij kogoś, kto umie walczyć!”'},
 witch:{intro:['„Hehehe… Świeże kości na miksturę! Patrzcie, jaki żałosny rycerzyk!”','„Nawet komary mają więcej odwagi niż ty!”'],death:'„Niech cię komary pożrą, a każdy eliksir ci się wyleje, zarozumialcze!”',win:'„Hihihi! Do kociołka z tobą! Chudy, ale na zupę wystarczy!”'},
 leshy:{intro:['„Człowieku… Wlazłeś do mojego lasu z tym zardzewiałym żelastwem? Śmieszne.”','„Korzenie zjedzą twoje kości, a wrony wydziobią resztę.”'],death:'„Niech cię las wodzi w kółko, a pochodnie gasną… aż zgnijesz, bohaterze…”',win:'„Las przyjmie twoje ciało. Przynajmniej na coś się przydasz – jako nawóz.”'},
 yeti:{intro:['„RRAAARGH! Ty mały mięczaku! Zimna się boisz, co?!”','„Zrobię z ciebie bałwana – tylko bez marchewki!”'],death:'„Rrr… Niech ci nos odpadnie od mrozu… i żeby ci zawsze brakowało czapki…”',win:'„Haha! Zamarzłeś jak lody! Ale ty słaby!”'},
 spiderqueen:{intro:['„Sss… Mała muszka wleciała w moją sieć. Taka drobna… i taka głupia.”','„Nawet nie warto owijać cię w kokon.”'],death:'„Sss… Obyś zawsze wpadał twarzą w pajęczyny i spadał z każdej drabiny…”',win:'„Ssss… Zbyt łatwo. Do kokonu z tobą, muszko!”'},
 sphinx:{intro:['„Kolejny śmiertelnik, który wierzy w swój rozum? Nie rozwiążesz nawet najprostszej zagadki.”','„Pyłek na wietrze… tym właśnie jesteś, wędrowcze!”'],death:'„Niech piasek zasypie twoje ścieżki, a każda droga prowadzi donikąd… Zagadko… nierozwiązana…”',win:'„Odpowiedź brzmiała: „nie dasz rady”. Piasek zatrze twoje imię!”'},
 mech:{intro:['„SYSTEM: SŁABY ORGANIZM WYKRYTY. SZANSE NA PRZEŻYCIE: 0,3%.”','„Moje zardzewiałe kolano ma więcej klasy niż ty. ROZPOCZYNAM LIKWIDACJĘ.”'],death:'„KRYTYCZNY BŁĄD… Obyś do końca życia dostawał komunikat „brak sygnału”… bzzzt…”',win:'„LIKWIDACJA ZAKOŃCZONA. OCENA WALKI: ŻAŁOSNA. RESTART.”'},
 demon:{intro:['„Człowieczku… Przyszedłeś do piekła w TAKIEJ zbroi? Zaraz zobaczysz, jak ładnie płoniesz!”','„Twoja dusza smakuje jak zeszłotygodniowy chleb!”'],death:'„Aaargh! Niech ci wszystkie zapałki zamokną, a każde ognisko zgaśnie… PRZEKLĘTY BOHATERZE!”',win:'„Hahaha! Spłonąłeś szybciej niż papier! Zapraszam na wieczność w kotle!”'},
 coach:{intro:['„No proszę, nasz bohater! Wyglądasz jak ktoś, kto nigdy nie strzelił gola. Rezerwowy!”','„Na boisko! Dzisiaj grasz o życie – a ja jestem trenerem, kapitanem i sędzią!”'],death:'„Gwiżdżę koniec… Obyś już nigdy nie wygrał żadnego meczu i zawsze trafiał w słupek, bohaterze…”',win:'„Gwizdek końcowy! Pokonany w pierwszej połowie! Zejdź z boiska, ławko rezerwowych!”'},
};
for(const k in DLG)ENEMY_DEFS[k].dlg=DLG[k];
