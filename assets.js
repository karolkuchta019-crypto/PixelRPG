/* src = nazwa bazowa. Pliki: <src>.png (idle), <src>_walk.png, _attack.png, _hurt.png, _death.png
   Opcjonalnie w ASSETS: ax (kotwica stóp w px klatki), extra (dodatkowe animacje, np. run/shoot/throw/jump), ms (czas klatki walk/run), muz (wylot pocisku w px od kotwicy).
   Każdy to poziomy pasek klatek fw x fh. Brakujący plik = fallback do idle / placeholdera. */
/* Centralna konfiguracja grafik. Podmień plik PNG (fw x fh na klatkę; poziomy sprite sheet = animacja idle).
   Brak pliku => automatyczny placeholder. */
const ASSETS={
 player:{src:'assets/player/hero',fw:32,fh:32,color:'#4aa3ff'},
 hero_leather:{src:'assets/player/hero_leather',fw:32,fh:32,color:'#8a5a2a'},
 hero_iron:{src:'assets/player/hero_iron',fw:32,fh:32,color:'#9aa0b0'},
 hero_steel:{src:'assets/player/hero_steel',fw:32,fh:32,color:'#6a8ab0'},
 hero_mythril:{src:'assets/player/hero_mythril',fw:32,fh:32,color:'#50b0a8'},
 slime:{src:'assets/enemies/slime',fw:32,fh:32,color:'#5ccf5c'},
 goblin:{src:'assets/enemies/goblin',fw:32,fh:32,color:'#9ac43a'},
 skeleton:{src:'assets/enemies/skeleton',fw:32,fh:32,color:'#d9d9c3'},
 shroom:{src:'assets/enemies/shroom',fw:32,fh:32,color:'#d04a4a'},
 elf:{src:'assets/enemies/elf',fw:32,fh:32,color:'#3a7a4a'},
 lavagolem:{src:'assets/enemies/lavagolem',fw:32,fh:32,color:'#ff7a20'},
 imp:{src:'assets/enemies/imp',fw:32,fh:32,color:'#d04a3a'},
 wolf:{src:'assets/enemies/wolf',fw:32,fh:32,color:'#9aa0b0'},
 spider:{src:'assets/enemies/spider',fw:32,fh:32,color:'#4a2a6a'},
 drone:{src:'assets/enemies/drone',fw:32,fh:32,color:'#8a96a8'},
 robot:{src:'assets/enemies/robot',fw:32,fh:32,color:'#7a7a88'},
 drowned:{src:'assets/enemies/drowned',fw:32,fh:32,color:'#5a8a78',extra:['throw'],muz:{trident:10}},      // moczary: utopiec z trójzębem
 mosquitos:{src:'assets/enemies/mosquitos',fw:32,fh:32,color:'#3a3a44'}, // moczary: chmara komarów
 witch:{src:'assets/enemies/witch',fw:48,fh:48,color:'#5a2a7a'},           // boss moczarów: wiedźma na miotle
 bear:{src:'assets/enemies/bear',fw:32,fh:32,color:'#6a3a1a'},             // tajga: niedźwiedź
 beaver:{src:'assets/enemies/beaver',fw:32,fh:32,color:'#8a6a3a'},         // tajga: bóbr
 leshy:{src:'assets/enemies/leshy',fw:64,fh:64,color:'#3a5a2a'},           // boss tajgi: leszy
 scorpion:{src:'assets/enemies/scorpion',fw:32,fh:32,color:'#8a5a1a'},     // pustynia: skorpion
 mummy:{src:'assets/enemies/mummy',fw:32,fh:32,color:'#d8d0b0'},           // pustynia: mumia
 sphinx:{src:'assets/enemies/sphinx',fw:64,fh:64,color:'#c8a050'},         // boss pustyni: sfinks
 yeti:{src:'assets/enemies/yeti',fw:48,fh:48,color:'#e8f0ff'},               // boss lodowych gór
 spiderqueen:{src:'assets/enemies/spiderqueen',fw:48,fh:48,color:'#4a2a6a'}, // boss jaskini
 mech:{src:'assets/enemies/mech',fw:48,fh:48,color:'#6a6a78'},               // boss elektrowni
 merchant:{src:'assets/ui/merchant',fw:32,fh:32,color:'#8a6a3a'},
 blacksmith:{src:'assets/ui/blacksmith',fw:32,fh:32,color:'#8a4030'},
 stall:{src:'assets/items/stall',fw:64,fh:48,color:'#8a5a2a'},
 anvil:{src:'assets/items/anvil',fw:64,fh:48,color:'#5a5a6a'},
 coach:{src:'assets/enemies/coach',fw:72,fh:56,ax:27,color:'#8a2030',extra:['run','shoot','throw','jump'],ms:{walk:90,run:70},muz:{bullet:31,bottle:17}},               // OSTATECZNY BOSS: Mroczny Trener
 kicker:{src:'assets/enemies/kicker',fw:32,fh:32,color:'#d64545',extra:['kick']},   // kick = animacja kopnięcia (piłkę rysuje gra)
 referee:{src:'assets/enemies/referee',fw:32,fh:32,color:'#2c2c38'},        // sędzia (supporter piłkarzy)
 bat:{src:'assets/enemies/bat',fw:32,fh:32,color:'#5a3f70'},                // jaskinia: nietoperz
 snowman:{src:'assets/enemies/snowman',fw:32,fh:32,color:'#f3f8ff'},        // lodowe góry: bałwan
 dwarf:{src:'assets/enemies/dwarf',fw:32,fh:32,color:'#d6652a'},            // opuszczona wioska: krasnolud
 basilisk:{src:'assets/enemies/basilisk',fw:32,fh:32,color:'#5fa84a',muz:{gaze:8}},   // otchłań: bazyliszek
 fighter:{src:'assets/enemies/fighter',fw:32,fh:32,color:'#5a6474',muz:{laser:11}},   // elektrownia: myśliwiec laserowy
 princess:{src:'assets/player/princess',fw:32,fh:32,color:'#e060a0'},
 comp_squire:{src:'assets/player/comp_squire',fw:32,fh:32,color:'#8a5a2a'},
 comp_squire_leather:{src:'assets/player/comp_squire_leather',fw:32,fh:32,color:'#8a5a2a'},   // giermek w skórzanej zbroi (kowal)
 comp_archer:{src:'assets/player/comp_archer',fw:32,fh:32,color:'#2a7a4a'},
 slimeking:{src:'assets/enemies/slimeking',fw:48,fh:48,color:'#4fb04a'},   // boss etapu 1
 orc:{src:'assets/enemies/orc',fw:48,fh:48,color:'#5a8a4a'},               // boss etapu 2
 demon:{src:'assets/enemies/demon',fw:48,fh:48,color:'#a02828'},           // boss etapu 3
};
const EFFECTS={sword_wood:'assets/items/sword_wood.png',sword_iron:'assets/items/sword_iron.png',sword_steel:'assets/items/sword_steel.png',sword_myth:'assets/items/sword_myth.png',sword_wood_attack:'assets/items/sword_wood_attack.png',sword_iron_attack:'assets/items/sword_iron_attack.png',sword_steel_attack:'assets/items/sword_steel_attack.png',sword_myth_attack:'assets/items/sword_myth_attack.png',shield_wood:'assets/items/shield_wood.png',shield_iron:'assets/items/shield_iron.png',shield_steel:'assets/items/shield_steel.png',shield_myth:'assets/items/shield_myth.png',sword_icon:'assets/items/sword_icon.png',shield_icon:'assets/items/shield_icon.png',armor_icon:'assets/items/armor_icon.png',bottle:'assets/effects/bottle.png',bottleproj:'assets/effects/bottle_proj.png',haste:'assets/effects/haste.png',stone:'assets/effects/stone.png',poison:'assets/effects/poison.png',sun_alt:'assets/effects/sun_alt.png',burn:'assets/effects/burn.png',freeze:'assets/effects/freeze.png',sand:'assets/effects/sand.png',hit:'assets/effects/hit.png',crit:'assets/effects/crit.png'}; // paski klatek 32x32 (opcjonalne)
const Assets={img:{},sheets:{},fx:{},maps:{},
 _load(src,fb){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(fb);i.src=src;});},
 _ph(a){const c=document.createElement('canvas');c.width=a.fw;c.height=a.fh;const x=c.getContext('2d');
  x.fillStyle='#000';x.fillRect(6,8,20,22);x.fillStyle=a.color;x.fillRect(8,10,16,18);
  x.fillStyle='#fff';x.fillRect(11,15,4,4);x.fillRect(18,15,4,4);x.fillStyle='#000';x.fillRect(13,17,2,2);x.fillRect(20,17,2,2);return c;},
 async load(){
  await Promise.all(Object.entries(ASSETS).map(async([k,a])=>{this.img[k]=await this._load(a.src+'.png',this._ph(a));this.sheets[k]={};
   for(const st of['walk','attack','hurt','death',...(a.extra||[])])this.sheets[k][st]=await this._load(`${a.src}_${st}.png`,null);}));
  await Promise.all(Object.entries(EFFECTS).map(async([k,p])=>{this.fx[k]=await this._load(p,null);}));
  await Promise.all(Object.entries(MAPS).map(async([k,m])=>{this.maps[k]=await this._load(m.src,null);}));
 },
 draw(c,key,x,y,scale,t,face=1,st='idle',t0=0,sq=1){const a=ASSETS[key],sh=this.sheets[key][st],im=sh||this.img[key],
  n=Math.max(1,Math.floor(im.width/a.fw)),f=(!sh||st==='walk'||st==='run')?Math.floor(t/((a.ms&&a.ms[st])||200))%n:Math.min(n-1,Math.floor((t-t0)/110));
  c.save();c.translate(x,y);c.scale(face*scale/sq,scale*sq);c.drawImage(im,f*a.fw,0,a.fw,a.fh,-(a.ax||a.fw/2),-a.fh,a.fw,a.fh);c.restore();}
};
