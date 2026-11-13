/* Mapy i fale jako dane. Dodaj wpis do MAPS/WAVES, aby rozbudować grę. */
/* hpMul (v1.1.1) = mnożnik HP zwykłych przeciwników na tej mapie (bossowie bez zmian). sun = punkt do klikania (easteregg z głową w słońcu).
   tone = jasność świata (1 jasny ... 0 mroczny). link = mapa-łącznik. foes/boss = przeciwnicy w trybie nieskończonym */
const MAPS={
 forest:{sun:{x:508,y:48,r:28},amb:'leaf',name:'Zielony las',src:'assets/maps/forest.png',sky:'#6ec6f0',ground:'#4a9a3a',decor:'#2c6b2c',tone:1,foes:['slime','shroom'],boss:'slimeking'},
 village:{amb:'dust',name:'Opuszczona wioska',src:'assets/maps/village.png',sky:'#d89060',ground:'#8a7a50',decor:'#4a3d28',tone:.8,foes:['goblin','elf','dwarf'],boss:'orc'},
 swamp:{amb:'firefly',name:'Moczary',src:'assets/maps/swamp.png',sky:'#8aa88c',ground:'#46583a',decor:'#2a4a32',tone:.5,foes:['drowned','mosquitos','mutmosq'],boss:'witch'},
 taiga:{amb:'leaf',name:'Tajga',src:'assets/maps/taiga.png',sky:'#6a9ac0',ground:'#3a4a2a',decor:'#2a3a1a',tone:.7,foes:['bear','beaver'],boss:'leshy'},
 pass:{amb:'snow',name:'Górska ścieżka',src:'assets/maps/pass.png',sky:'#a0d4ee',ground:'#9ab88a',decor:'#4a3d28',tone:.85,link:1},
 ice:{sun:{x:108,y:52,r:28},amb:'snow',name:'Lodowe góry',src:'assets/maps/ice.png',sky:'#b8dcf2',ground:'#e8f0ff',decor:'#9ab8e0',tone:.9,foes:['wolf','goblin','snowman'],boss:'yeti'},
 cavemouth:{amb:'snow',name:'Wejście do jaskini',src:'assets/maps/cavemouth.png',sky:'#8a98ac',ground:'#9aa4b8',decor:'#6a7488',tone:.5,link:1},
 cave:{amb:'glint',name:'Kryształowa jaskinia',src:'assets/maps/cave.png',sky:'#1c1828',ground:'#3a3448',decor:'#2a2438',tone:.3,foes:['spider','imp','bat'],boss:'spiderqueen'},
 desert:{sun:{x:500,y:54,r:26},amb:'dust',name:'Pustynia',src:'assets/maps/desert.png',sky:'#f0c878',ground:'#d0b060',decor:'#a89050',tone:.55,foes:['scorpion','mummy'],boss:'sphinx'},
 tunnel:{name:'Stary tunel',src:'assets/maps/tunnel.png',sky:'#22222c',ground:'#3a3a44',decor:'#4a3a2a',tone:.3,link:1},
 plant:{hpMul:1.4,amb:'spark',name:'Stara elektrownia',src:'assets/maps/plant.png',sky:'#2a2630',ground:'#3a3a40',decor:'#2a2a32',tone:.25,foes:['drone','robot','fighter'],boss:'mech'},
 hotshaft:{amb:'ember',name:'Gorący szyb',src:'assets/maps/hotshaft.png',sky:'#2a1010',ground:'#3a1c1a',decor:'#3a2420',tone:.15,link:1},
 lava:{amb:'ember',name:'Lawowa otchłań',src:'assets/maps/lava.png',sky:'#0a0303',ground:'#241010',decor:'#0e0505',tone:.1,foes:['imp','lavagolem','skeleton','basilisk'],boss:'demon'},
 ruins:{amb:'dust',name:'Mroczne ruiny',src:'assets/maps/ruins.png',sky:'#2a2040',ground:'#3a3550',decor:'#1c1830',tone:.3},
 castle:{name:'Zamek',src:'assets/maps/castle.png',sky:'#3a2a5a',ground:'#6a6070',decor:'#7a6a8a',tone:.6},
 stadium:{hpMul:1.5,name:'Mroczny stadion',src:'assets/maps/stadium.png',sky:'#1a0e18',ground:'#1f4a2a',decor:'#2a2a30',tone:.2},
 volcano:{amb:'ember',name:'Kraina wulkanów',src:'assets/maps/volcano.png',sky:'#8a2a10',ground:'#3a2020',decor:'#2a1210',tone:.2},
};
/* Logiczne połączenia światów: między skrajnie różnymi mapami wchodzi mapa-łącznik. */
const LINKS={'swamp>taiga':[],'taiga>ice':['pass'],'ice>cave':['cavemouth'],'cave>desert':[],'desert>plant':['tunnel'],'plant>lava':['hotshaft']};
function route(a,b){if(a===b)return[];if(LINKS[a+'>'+b])return LINKS[a+'>'+b];
 return Math.abs(MAPS[a].tone-MAPS[b].tone)>.35&&!MAPS[a].link&&!MAPS[b].link?['tunnel']:[];}
const PATH=['forest','village','swamp','taiga','ice','cave','desert','plant','lava'];   // kolejność światów w trybie nieskończonym
const WAVES=[
 {map:'forest',e:['slime']},
 {map:'forest',e:['slime','shroom']},
];
/* Fale poza listą generowane są automatycznie (nieskończona gra). */
function getWave(n){
 if(WAVES[n-1])return WAVES[n-1];
 const id=PATH[Math.floor((n-1)/3)%PATH.length],M=MAPS[id],cnt=Math.min(3,1+Math.floor(n/4));
 if(n%5===0)return{map:id,e:[M.boss],boss:1};
 return{map:id,e:Array.from({length:cnt},()=>M.foes[Math.floor(Math.random()*M.foes.length)])};
}

/* KAMPANIA: każdy etap = osobna mapa i kilka fal. Dodaj kolejny obiekt, aby dodać etap. */
/* KAMPANIA: każdy etap = osobna mapa. Liczba fal rośnie z etapem: etap 1 = 3 fale, etap 2 = 4 fale, ... (n+2).
   Ostatnia fala etapu to zawsze boss. Liczba przeciwników w każdej fali jest losowana, ale z każdą falą rośnie.
   Dodaj kolejny obiekt (map, foes, boss), aby dodać etap – fale zostaną wygenerowane automatycznie. */
const CAMPAIGN=[
 {name:'Zielony las',map:'forest',foes:['slime','shroom'],boss:'slimeking'},
 {name:'Opuszczona wioska',map:'village',foes:['goblin','elf','dwarf'],boss:'orc'},
 {name:'Moczary',map:'swamp',foes:['drowned','mosquitos','mutmosq'],boss:'witch'},
 {name:'Tajga',map:'taiga',foes:['bear','beaver'],boss:'leshy'},
 {name:'Lodowe góry',map:'ice',foes:['wolf','goblin','snowman'],boss:'yeti'},
 {name:'Kryształowa jaskinia',map:'cave',foes:['spider','imp','bat'],boss:'spiderqueen'},
 {name:'Pustynia',map:'desert',foes:['scorpion','mummy'],boss:'sphinx'},
 {name:'Stara elektrownia',map:'plant',foes:['drone','robot','fighter'],boss:'mech'},
 {name:'Lawowa otchłań',map:'lava',foes:['imp','lavagolem','skeleton','basilisk'],boss:'demon'},
 {name:'Mroczny stadion',map:'stadium',foes:['kicker','kicker','kicker','fan','fan','referee'],boss:'coach'},   // v1.1.1: sędzia i kibic też na wcześniejszych falach
];
const MAX_FOES=4;                                   // tyle potworów mieści się na arenie
const stageWaveCount=i=>i+3;                        // etap 0 -> 3 fale, etap 1 -> 4 fale, ...
/* Losowa liczba przeciwników w k-tej fali: dolna granica rośnie z falą, a każda fala ma więcej wrogów niż poprzednia (do limitu areny). */
function rollFoeCount(k,prev){const lo=Math.min(3,k),hi=Math.min(MAX_FOES,k+1);
 const n=lo+Math.floor(Math.random()*(hi-lo+1));return Math.min(MAX_FOES,Math.max(n,prev+1));}
/* v1.1.1: wsparcie (sędzia) – najwyżej 1 na falę i nigdy samo (musi mieć kogo wspierać) */
function fixSupport(arr,L){const sup=t=>!!(ENEMY_DEFS[t]&&ENEMY_DEFS[t].support),base=L.foes.find(t=>!sup(t))||arr[0];let seen=0;
 const out=arr.map(t=>sup(t)&&seen++>0?base:t);if(out.every(sup))out[0]=base;return out;}
function buildWaves(i){const L=CAMPAIGN[i],n=stageWaveCount(i),w=[];let prev=0;
 for(let k=1;k<n;k++){prev=rollFoeCount(k,prev);w.push({e:fixSupport(Array.from({length:prev},()=>L.foes[Math.floor(Math.random()*L.foes.length)]),L)});}
 w.push({e:[L.boss],boss:1});return w;}
