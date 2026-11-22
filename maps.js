/* Mapy i fale jako dane. Dodaj wpis do MAPS/WAVES, aby rozbudować grę. */
/* hpMul (v1.1.1) = mnożnik HP zwykłych przeciwników na tej mapie (bossowie bez zmian). sun = punkt do klikania (easteregg z głową w słońcu).
   tone = jasność świata (1 jasny ... 0 mroczny). link = mapa-łącznik. foes/boss = przeciwnicy w trybie nieskończonym */
const MAPS={
 forest:{sun:{x:508,y:48,r:28},amb:'leaf',name:'Zielony las',src:'assets/maps/forest.png',sky:'#6ec6f0',ground:'#4a9a3a',decor:'#2c6b2c',tone:1,foes:['slime','shroom','dandelion'],boss:'slimeking'},
 village:{amb:'dust',name:'Opuszczona wioska',src:'assets/maps/village.png',sky:'#d89060',ground:'#8a7a50',decor:'#4a3d28',tone:.8,foes:['goblin','elf','dwarf'],boss:'orc'},
 swamp:{amb:'firefly',name:'Moczary',src:'assets/maps/swamp.png',sky:'#8aa88c',ground:'#46583a',decor:'#2a4a32',tone:.5,foes:['drowned','mosquitos','mutmosq','blackcat'],boss:'witch'},
 taiga:{amb:'leaf',name:'Tajga',src:'assets/maps/taiga.png',sky:'#6a9ac0',ground:'#3a4a2a',decor:'#2a3a1a',tone:.7,foes:['bear','beaver','hedgehog','treant'],boss:'leshy'},
 pass:{amb:'snow',name:'Górska ścieżka',src:'assets/maps/pass.png',sky:'#a0d4ee',ground:'#9ab88a',decor:'#4a3d28',tone:.85,link:1},
 ice:{sun:{x:108,y:52,r:28},amb:'snow',name:'Lodowe góry',src:'assets/maps/ice.png',sky:'#b8dcf2',ground:'#e8f0ff',decor:'#9ab8e0',tone:.9,foes:['wolf','goblin','snowman'],boss:'yeti'},
 cavemouth:{amb:'snow',name:'Wejście do jaskini',src:'assets/maps/cavemouth.png',sky:'#8a98ac',ground:'#9aa4b8',decor:'#6a7488',tone:.5,link:1},
 cave:{amb:'glint',name:'Kryształowa jaskinia',src:'assets/maps/cave.png',sky:'#1c1828',ground:'#3a3448',decor:'#2a2438',tone:.3,foes:['spider','imp','bat','silverfish'],boss:'spiderqueen'},
 desert:{sun:{x:500,y:54,r:26},amb:'dust',name:'Pustynia',src:'assets/maps/desert.png',sky:'#f0c878',ground:'#d0b060',decor:'#a89050',tone:.55,foes:['scorpion','mummy'],boss:'sphinx'},
 tunnel:{name:'Stary tunel',src:'assets/maps/tunnel.png',sky:'#22222c',ground:'#3a3a44',decor:'#4a3a2a',tone:.3,link:1},
 plant:{hpMul:1.4,amb:'spark',name:'Stara elektrownia',src:'assets/maps/plant.png',sky:'#2a2630',ground:'#3a3a40',decor:'#2a2a32',tone:.25,foes:['drone','robot','fighter','wreck'],boss:'mech'},
 hotshaft:{amb:'ember',name:'Gorący szyb',src:'assets/maps/hotshaft.png',sky:'#2a1010',ground:'#3a1c1a',decor:'#3a2420',tone:.15,link:1},
 lava:{amb:'ember',name:'Lawowa otchłań',src:'assets/maps/lava.png',sky:'#0a0303',ground:'#241010',decor:'#0e0505',tone:.1,foes:['imp','lavagolem','skeleton','basilisk'],boss:'demon'},
 ruins:{amb:'dust',name:'Mroczne ruiny',src:'assets/maps/ruins.png',sky:'#2a2040',ground:'#3a3550',decor:'#1c1830',tone:.3},
 castle:{name:'Zamek',src:'assets/maps/castle.png',sky:'#3a2a5a',ground:'#6a6070',decor:'#7a6a8a',tone:.6},
 pitch:{name:'Boisko',src:'assets/maps/pitch.png',sky:'#2f7a3a',ground:'#2f7a3a',decor:'#1f4a2a',tone:.25},   // v1.3.0: minigra pong (widok z góry, bez nieba)
 stadium:{hpMul:1.5,name:'Mroczny stadion',src:'assets/maps/stadium.png',sky:'#1a0e18',ground:'#1f4a2a',decor:'#2a2a30',tone:.2},
 volcano:{amb:'ember',name:'Kraina wulkanów',src:'assets/maps/volcano.png',sky:'#8a2a10',ground:'#3a2020',decor:'#2a1210',tone:.2},
};
/* Logiczne połączenia światów: między skrajnie różnymi mapami wchodzi mapa-łącznik. */
const LINKS={'swamp>taiga':[],'taiga>ice':['pass'],'ice>cave':['cavemouth'],'cave>desert':[],'desert>plant':['tunnel'],'plant>lava':['hotshaft']};
function route(a,b){if(a===b)return[];if(LINKS[a+'>'+b])return LINKS[a+'>'+b];
 return Math.abs(MAPS[a].tone-MAPS[b].tone)>.35&&!MAPS[a].link&&!MAPS[b].link?['tunnel']:[];}
/* v1.3.0: wrogowie „okienkowi” – pojawiają się tylko w wybranych falach etapu (k = numer zwykłej fali, n = liczba zwykłych fal).
   to:N = tylko pierwsze N fal · last:N = N ostatnich zwykłych fal · from:N = od fali N w górę · bez pola = zwykła pula etapu.
   Wróg z oknem jest gwarantowany co najmniej raz w każdej fali okna. */
const EXTRA={ice:[{t:'rudolf'}],desert:[{t:'scarab',to:2}],plant:[{t:'mechhand',last:3}],lava:[{t:'wraith',to:4}],stadium:[{t:'keeper',from:7}]};
function extraFor(map,k,n){const pool=[],must=[];
 for(const x of EXTRA[map]||[]){if((x.to!=null&&k>x.to)||(x.from!=null&&k<x.from)||(x.last!=null&&k<=n-x.last))continue;
  pool.push(x.t);if(x.to!=null||x.from!=null||x.last!=null)must.push(x.t);}
 return{pool,must};}
const allFoes=L=>L.foes.concat((EXTRA[L.map]||[]).map(x=>x.t));
const PATH=['forest','village','swamp','taiga','ice','cave','desert','plant','lava'];   // kolejność światów w trybie nieskończonym
const WAVES=[];   // ręcznie zdefiniowane fale (puste od 1.2.0 – wszystko generuje getWave)
/* v1.2.0: TRYB NIESKOŃCZONY – łagodny start i stopniowo rosnąca trudność.
   Mapa zmienia się co 5 fal, a 5. fala każdej mapy to jej boss. Liczba wrogów rośnie powoli (1 -> 4), a ich siła rośnie wolniej niż dawniej (G.diff). */
function endlessCount(n){
 if(n<=2)return 1;
 if(n<=4)return 1+(Math.random()<.4?1:0);
 if(n<=9)return 2;
 if(n<=14)return 2+(Math.random()<.5?1:0);
 if(n<=24)return 3;
 return 3+(Math.random()<.5?1:0);
}
function getWave(n){
 if(WAVES[n-1])return WAVES[n-1];
 const id=PATH[Math.floor((n-1)/5)%PATH.length],M=MAPS[id];
 if(n%5===0)return{map:id,e:[M.boss],boss:1};
 const cnt=Math.min(MAX_FOES,endlessCount(n)),X=n<=2?{pool:[],must:[]}:extraFor(id,((n-1)%5)+1,4),pool=(n<=2?[M.foes[0]]:M.foes).concat(X.pool);   // pierwsze fale: tylko najsłabszy wróg mapy
 const arr=Array.from({length:cnt},()=>pool[Math.floor(Math.random()*pool.length)]);X.must.forEach(t=>{if(!arr.includes(t))arr[Math.floor(Math.random()*arr.length)]=t;});
 return{map:id,e:fixSupport(arr,{foes:pool})};
}

/* KAMPANIA: każdy etap = osobna mapa i kilka fal. Dodaj kolejny obiekt, aby dodać etap. */
/* KAMPANIA: każdy etap = osobna mapa. Liczba fal rośnie z etapem: etap 1 = 3 fale, etap 2 = 4 fale, ... (n+2).
   Ostatnia fala etapu to zawsze boss. Liczba przeciwników w każdej fali jest losowana, ale z każdą falą rośnie.
   Dodaj kolejny obiekt (map, foes, boss), aby dodać etap – fale zostaną wygenerowane automatycznie. */
const CAMPAIGN=[
 {name:'Zielony las',map:'forest',foes:['slime','shroom','dandelion'],boss:'slimeking'},
 {name:'Opuszczona wioska',map:'village',foes:['goblin','elf','dwarf'],boss:'orc'},
 {name:'Moczary',map:'swamp',foes:['drowned','mosquitos','mutmosq','blackcat'],boss:'witch'},
 {name:'Tajga',map:'taiga',foes:['bear','beaver','hedgehog','treant'],boss:'leshy'},
 {name:'Lodowe góry',map:'ice',foes:['wolf','goblin','snowman'],boss:'yeti'},
 {name:'Kryształowa jaskinia',map:'cave',foes:['spider','imp','bat','silverfish'],boss:'spiderqueen'},
 {name:'Pustynia',map:'desert',foes:['scorpion','mummy'],boss:'sphinx'},
 {name:'Stara elektrownia',map:'plant',foes:['drone','robot','fighter','wreck'],boss:'mech'},
 {name:'Lawowa otchłań',map:'lava',foes:['imp','lavagolem','skeleton','basilisk'],boss:'demon'},
 {name:'Mroczny stadion',map:'stadium',foes:['kicker','kicker','kicker','fan','fan','referee'],boss:'coach',minigame:{kind:'pong',wave:6,map:'pitch'}},   // v1.1.1: sędzia i kibic też na wcześniejszych falach
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
 for(let k=1;k<n;k++){
  if(L.minigame&&L.minigame.wave===k){w.push({e:[],map:L.minigame.map,minigame:L.minigame.kind});continue;}   // v1.3.0: minigra zamiast walki
  prev=rollFoeCount(k,prev);const X=extraFor(L.map,k,n-1),pool=L.foes.concat(X.pool);
  const arr=Array.from({length:prev},()=>pool[Math.floor(Math.random()*pool.length)]);
  X.must.forEach(t=>{if(!arr.includes(t))arr[Math.floor(Math.random()*arr.length)]=t;});
  w.push({e:fixSupport(arr,{foes:pool})});}
 w.push({e:[L.boss],boss:1});return w;}
