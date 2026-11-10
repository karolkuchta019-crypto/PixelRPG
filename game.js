const VERSION='1.1.0';
const MERCHANT_LINES=['Witaj, wojowniku! Mam coś dla ciebie.','Droga daleka... zajrzyj do mojego straganu!','Za twoje punkty mam same cuda!','Hmm! Dobrze wyglądasz. Handlujemy?'];
const SMITH_LINES=['Potrzebujesz solidnej stali?','Miecze, zbroje, tarcze – wybieraj!','Moja kuźnia nigdy nie stygnie.','Za punkty dam ci najlepszy ekwipunek.'];
const WITCH_LINES=['Hehehe… pokonałeś mnie, ale kociołek wciąż bulgocze. Kupisz coś?','Eliksiry, talizmany… na szczęście nikt jeszcze nie narzekał.','Łapka królika? Czterolistna koniczyna? Wybieraj, rycerzu.','Bez urazy za tamtą walkę. Interes to interes!'];
const KONAMI='arrowup,arrowup,arrowdown,arrowdown,arrowleft,arrowright,arrowleft,arrowright,b,a';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const EASE={out:u=>1-Math.pow(1-u,3),in:u=>u*u*u,io:u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2};
const AMB={leaf:{c:'#6ac050',sz:3,vx:-.7,vy:.6,y:()=>Math.random()*60},dust:{c:'#c8a878',sz:2,vx:-1,vy:.05,y:()=>120+Math.random()*180},snow:{c:'#ffffff',sz:3,vx:-.5,vy:1.1,y:()=>-4},
 ember:{c:'#ff8a30',sz:3,vx:.3,vy:-1.1,y:()=>320},spark:{c:'#60e0ff',sz:2,vx:0,vy:.2,y:()=>60+Math.random()*220},glint:{c:'#a0c8ff',sz:2,vx:0,vy:-.2,y:()=>150+Math.random()*150},
 firefly:{c:'#d8ff70',sz:2,vx:.12,vy:-.18,y:()=>130+Math.random()*150}};
const SWING_COL={sword_wood:'#e8d4a0',sword_iron:'#e6ecf8',sword_steel:'#cfe6ff',sword_myth:'#8ffff0'};   // kolor smugi cięcia wg miecza
const COMP_OFF=[[-48,-26],[-48,28],[-92,2]];
const tween=(o,p,ms,ez)=>new Promise(r=>{const f={},e=EASE[ez]||(u=>u);for(const k in p)f[k]=o[k];const t0=performance.now();
 (function s(t){const u=Math.min(1,(t-t0)/ms);for(const k in p)o[k]=f[k]+(p[k]-f[k])*e(u);u<1?requestAnimationFrame(s):r();})(t0);});
const G={sunAlt:false,npcs:[],hub:null,hubReturn:null,waves:[],top:[],comps:[],state:'title',mode:'endless',level:0,wave:1,p:null,actors:[],enemies:[],fx:[],keys:{},shake:0,fade:0,t:0,sel:null,xpWave:0,
 init(){this.cv=UI.$('cv');this.c=this.cv.getContext('2d');this.c.imageSmoothingEnabled=false;Music.init();
  addEventListener('keydown',e=>{this.keys[e.key.toLowerCase()]=1;if(e.key.toLowerCase()==='e')this.interact();if(e.key.toLowerCase()==='m'&&!e.repeat)Music.toggle();
   if(e.key==='Tab'&&!e.repeat){e.preventDefault();UI.toggleMenu();return;}
   if(this.state==='cutscene'&&(e.key===' '||e.key==='Enter'))Cut.next();
   if(this.bub&&(e.key===' '||e.key==='Enter'))this.skipBub();
   this.kseq=(this.kseq||[]).concat(e.key.toLowerCase()).slice(-10);if(this.kseq.join()===KONAMI)this.toggleDev();if(e.key.startsWith('Arrow'))e.preventDefault();});
  addEventListener('keyup',e=>delete this.keys[e.key.toLowerCase()]);
  this.cv.onclick=e=>{if(this.state==='cutscene')return Cut.next();if(this.bub)return this.skipBub();const r=this.cv.getBoundingClientRect(),x=(e.clientX-r.left)*640/r.width,y=(e.clientY-r.top)*320/r.height;
   if(this.state==='clear'&&x>380&&y<46)return this.advance(true);   // klik w strzałkę w rogu = natychmiastowe przejście
   const sn=(MAPS[this.cur().map]||{}).sun;if(sn&&(this.state==='fight'||this.state==='clear')&&Math.hypot(x-sn.x,y-sn.y)<sn.r+10){this.sunAlt=!this.sunAlt;this.burst(sn.x,sn.y,'#ffe070',24);return;}   // klik w słońce
   if(this.state==='clear'){const n=this.nearNpc();if(n&&Math.abs(x-n.x)<90)return this.interact(n);}   // v1.1: kilku NPC naraz
   if(!Combat.busy){this.sel=this.enemies.reduce((b,n)=>!b||Math.abs(n.x-x)<Math.abs(b.x-x)?n:b,null);
    if(this.invuln(this.sel)){this.text(this.sel,'NIETYKALNY!','#8ae0ff');UI.log('Mroczny Trener jest nietykalny – najpierw pokonaj piłkarzy i sędziego!','crit');}}};
  document.querySelectorAll('#actions button').forEach(b=>b.onclick=()=>Combat.act(b.dataset.a));
  const pc=UI.$('portrait').getContext('2d');pc.imageSmoothingEnabled=false;Assets.draw(pc,'player',16,32,1,0);
  /* sekret nr 2: 7 kliknięć w portret bohatera w ciągu 3 s */
  UI.$('skip').onclick=()=>Cut.doSkip();
  this.pclk=[];UI.$('portrait').onclick=()=>{const n=Date.now();this.pclk=this.pclk.filter(t=>n-t<3000).concat(n);if(this.pclk.length>=7){this.pclk=[];this.toggleDev();}};
  UI.title();requestAnimationFrame(t=>this.loop(t));},
 startEndless(nw){this.mode='endless';if(nw)Save.clear('endless');const s=Save.get('endless');
  Player.d=s?s.p:Player.base();Player.d.gear=Player.d.gear||{sword:null,armor:null,shield:null};this.wave=s?s.w:1;Player.d.hp=Math.max(Player.d.hp,1);this.newRun();},
 async startCampaign(i,skipMap){this.mode='campaign';const s=Save.get('campaign');Player.d=s?s.p:Player.base();Player.d.gear=Player.d.gear||{sword:null,armor:null,shield:null};Player.d.hp=Player.d.maxhp;
  Player.d.kills=Player.d.kills||0;Player.d.deaths=Player.d.deaths||0;
  this.level=i;this.wave=1;this.waves=buildWaves(i);this.snap=JSON.stringify(Player.d);
  if(i===0&&!(s&&s.cleared))await Story.intro();
  if(!skipMap){UI.worldMap({start:1,pick:i});return;}
  this.newRun();},
 newRun(){UI.$('log').innerHTML='';this.hub=null;this.loadWave();},
 cur(){if(this.mode==='campaign'){const L=CAMPAIGN[this.level];return{map:L.map,...this.waves[this.wave-1]};}return getWave(this.wave);},
 /* trudność: wolniej rośnie z numerem fali (etapy mają teraz więcej fal), mocniej z numerem etapu */
 diff(){return this.mode==='campaign'?Math.max(1,Math.round(this.level*1.2+this.wave*.5)):this.wave;},
 loadWave(travel,D,quiet){const w=this.cur();this.xpWave=0;this.sel=null;
  if(!travel){Player.d.gear=Player.d.gear||{sword:null,armor:null,shield:null};this.p={key:Player.spriteKey(),name:'Bohater',x:110,y:215,ox:0,oy:0,alpha:1,flash:0,scale:3,face:1,ph:0,s:Player.d,vy:0,jumping:0};}
  if(!travel){
   /* kula ognia: odnawia się tylko przy nowym etapie (wave 1) lub walce z bossem – nie przy każdej fali */
   const ww=this.cur();if(ww.boss||this.wave===1)Combat.fbCd=0;
   Player.d.comps=Player.d.comps||[];Player.d.sk=Player.d.sk||{};this.comps=Player.d.comps.map((c,i)=>this.makeComp(c,i));
  }
  this.enemies=w.e.map((t,i)=>makeEnemy(t,this.diff(),i,w.boss&&i===0));
  if(travel)this.enemies.forEach(e=>e.ox=D||640);   // wrogowie wjeżdżą razem z nową mapą
  this.actors=[this.p,...this.comps,...this.enemies,...(travel?this.npcs:[])];if(!travel){this.npcs=[];if(!quiet)this.begin(w);}},
 begin(w){Music.play(w.map);Combat.busy=false;Combat.guard=false;
  UI.log(`--- ${UI.waveLabel()}: ${MAPS[w.map].name} ---`,'crit');
  if(w.boss){const b=this.enemies[0];UI.log('UWAGA! BOSS: '+b.name,'bad');this.shake=14;this.state='talk';UI.hud();UI.lock(true);this.bossIntro(b);}   // v1.0: boss najpierw obraża bohatera
  else{this.state='fight';UI.hud();UI.lock(false);}},
 async bossIntro(b){await sleep(700);const L=(b.def.dlg&&b.def.dlg.intro)||(b.def.line?[b.def.line]:[]);for(const l of L)await this.say(b,l);this.state='fight';UI.hud();UI.lock(false);},
 /* DYMKI DIALOGOWE: say() zwraca obietnicę rozwiązywaną po czasie albo po kliknięciu / spacji / Enter */
 say(a,txt){UI.log(`${a.name}: ${txt}`,'bad');return new Promise(res=>{this.nextBub();const b={a,txt,res,t0:performance.now()};b.to=setTimeout(()=>{if(this.bub===b)this.nextBub();},Math.max(2400,txt.length*62));this.bub=b;});},
 nextBub(){const b=this.bub;if(!b)return;clearTimeout(b.to);this.bub=null;b.res();},
 skipBub(){if(this.bub&&performance.now()-this.bub.t0>450)this.nextBub();},
 drawSpeech(c){const b=this.bub;if(!b)return;const a=b.a,x=a.x+a.ox,h=ASSETS[a.key].fh*a.scale+(a.air?20:0);
  c.save();c.font='bold 12px "Courier New"';c.textAlign='left';const maxW=290,lines=[];let ln='';
  for(const w of b.txt.split(' ')){if(c.measureText(ln+w).width>maxW){lines.push(ln.trim());ln='';}ln+=w+' ';}lines.push(ln.trim());
  const bw=Math.min(maxW,Math.max(...lines.map(l=>c.measureText(l).width),c.measureText(a.name).width))+20,bh=lines.length*15+28,
   bx=Math.max(4,Math.min(636-bw,x-bw/2)),by=Math.max(4,a.y+a.oy-h-34-bh),tx=Math.max(bx+10,Math.min(bx+bw-10,x));
  c.globalAlpha=1;c.fillStyle='#000';c.fillRect(bx-2,by-2,bw+4,bh+4);c.fillStyle='#f3e9d2';c.fillRect(bx,by,bw,bh);
  c.fillStyle='#000';c.fillRect(tx-6,by+bh,12,8);c.fillStyle='#f3e9d2';c.fillRect(tx-4,by+bh-1,8,8);
  c.fillStyle='#a02828';c.fillText(a.name.toUpperCase(),bx+10,by+16);c.fillStyle='#14101f';lines.forEach((l,i)=>c.fillText(l,bx+10,by+32+i*15));
  c.fillStyle='#8a6a1c';c.textAlign='right';c.fillText('▼',bx+bw-6,by+bh-5);c.restore();},
 compPos(i,bx,by){const o=COMP_OFF[i];return{x:(bx||110)+o[0],y:(by||215)+o[1]};},
 makeComp(c,i){return{key:c.t==='archer'?'comp_archer':(Player.d&&Player.d.sqArmor?'comp_squire_leather':'comp_squire'),name:c.name,...this.compPos(i,this.p.x,this.p.y),ox:0,oy:0,alpha:1,flash:0,scale:2.3,face:1,ph:i+1,ally:1,s:c};},
 /* Mroczny Trener jest nietykalny, dopóki żyją przywołani piłkarze lub sędzia */
 invuln(e){return !!e&&e.key==='coach'&&this.enemies.some(x=>x!==e&&x.minion&&x.s.hp>0);},
 target(){const ok=this.enemies.filter(e=>!this.invuln(e));return ok.includes(this.sel)?this.sel:ok[0];},
 async dash(a,t){const dir=Math.sign(t.x-a.x)||1,dx=t.x-a.x-dir*70;a.run=1;await tween(a,{ox:-dir*14},110,'out');await tween(a,{ox:dx,oy:t.y-a.y},150,'in');a.run=0;},   // zamach + szarża
 back(a){return tween(a,{ox:0,oy:0},240,'io');},
 knock(t,dir){const o=t.ox;tween(t,{ox:o+dir*12},70,'out').then(()=>tween(t,{ox:o},170,'io'));},
 slash(t,dir){this.fx.push({slash:1,x:t.x+t.ox,y:t.y+t.oy-t.scale*16,d:dir,life:1});},
 syncComps(){Player.d.comps.forEach(c=>{if(this.comps.some(a=>a.s===c))return;const a=this.makeComp(c,this.comps.length);a.alpha=0;this.comps.push(a);this.actors.push(a);
   this.burst(a.x,a.y-20,'#fff',16);this.text(a,'DOŁĄCZA!','#f2c14e');tween(a,{alpha:1},700);});},
 text(a,txt,col,big){this.fx.push({txt,x:a.x+a.ox,y:a.y+a.oy-a.scale*32-10,c:col,life:1,big});},
 hitfx(a,k){this.fx.push({spr:k,x:a.x+a.ox,y:a.y+a.oy-a.scale*14,life:1});},
 burst(x,y,c,n){for(let i=0;i<n;i++)this.fx.push({x,y,vx:(Math.random()-.5)*6,vy:-Math.random()*5,life:1,c,sz:2+Math.random()*3,pt:1});},
 async win(){this.state='won';UI.lock(true);const d=Player.d,heal=Math.round(d.maxhp*.3);d.hp=Math.min(d.maxhp,d.hp+heal);
  let rw=`Fala pokonana! +${this.xpWave} XP, +${heal} HP`;if(this.wave%2===0){d.potions++;rw+=', +1 eliksir';}
  const pts=this.cur().boss?3:1;d.pending+=pts;rw+=`, +${pts} pkt umiejętności`;
  (d.comps||[]).forEach(c=>c.hp=Math.min(c.maxhp,c.hp+Math.round(c.maxhp*.3)));[this.p,...this.comps].forEach(x=>{x.poison=x.burn=x.freeze=x.sand=null;});
  UI.log(rw,'good');UI.hud();if(this.mode==='endless')Save.set('endless',{p:d,w:this.wave+1});
  {const wv=this.cur();if(this.mode==='campaign'&&wv.boss&&wv.e[0]==='witch'&&!d.witch){d.witch=1;UI.log('Wiedźma przeżyła i osiadła w chatce na Moczarach – możesz ją odwiedzić (mapa świata, Tab).','crit');}}   // v1.1
  if(this.mode==='campaign'&&this.level>=CAMPAIGN.length-1&&this.wave>=this.waves.length){this.saveC();await sleep(900);return Story.good();}
  await sleep(600);this.state='clear';this.clearNpcs();},
 saveC(){const s=Save.get('campaign')||{cleared:0};Save.set('campaign',{p:Player.d,cleared:Math.min(CAMPAIGN.length,Math.max(s.cleared,this.level+1))});},
 /* gracz dochodzi do prawej krawędzi -> (sklep) -> płynne przejście na kolejną mapę */
 async advance(fast){if(this.state!=='clear')return;if(this.hub)return this.leaveHub();this.state='moving';
  const camp=this.mode==='campaign',end=camp&&this.wave>=this.waves.length;
  if(end&&this.level>=CAMPAIGN.length-1){this.saveC();return UI.screen('KAMPANIA UKOŃCZONA!','Pokonałeś wszystkich bossów. Gratulacje!',[{l:'Menu',f:()=>UI.title()}]);}
  await (fast?this.instant:this.travel).call(this,()=>{if(end){this.saveC();this.level++;this.wave=1;this.waves=buildWaves(this.level);Player.d.hp=Player.d.maxhp;this.snap=JSON.stringify(Player.d);}
   else{this.wave++;if(!camp)Save.set('endless',{p:Player.d,w:this.wave});}});},
 async instant(setup){await tween(this,{fade:1},220);setup();this.npcs=[];this.loadWave();this.banner={txt:MAPS[this.cur().map].name,t:0};await tween(this,{fade:0},260);},
 async travel(setup){const from=this.cur().map;setup();const to=this.cur().map;Music.play(to);const path=[from,...route(from,to),to],segs=path.length-1,D=640*segs,T=1800*segs+600;
  this.bg={path,x:0};this.banner={txt:MAPS[to].name,t:0};this.loadWave(true,D);
  const p=this.p,w=this.cur();p.auto=1;p.face=1;
  await Promise.all([tween(this.bg,{x:D},T,'io'),tween(p,{x:130,y:215},T,'io'),...this.comps.map((c,i)=>{c.walk=1;return tween(c,this.compPos(i,130,215),T,'io');}),...this.enemies.map(e=>tween(e,{ox:0},T,'io')),...this.npcs.map(n=>tween(n,{ox:-D},T,'io'))]);
  this.bg=null;p.auto=0;this.comps.forEach(c=>c.walk=0);this.npcs=[];this.actors=this.actors.filter(a=>!a.npc);this.begin(w);},
 drawMap(c,id,ox){const m=MAPS[id],im=Assets.maps[id];c.save();c.translate(ox,0);
  if(im)c.drawImage(im,0,0,640,320);else{c.fillStyle=m.sky;c.fillRect(0,0,640,170);c.fillStyle=m.ground;c.fillRect(0,170,640,150);
   c.fillStyle=m.decor;for(let i=0;i<9;i++)c.fillRect(i*80+20,150+(i*37%20),24,20+(i*13%25));}
  if(this.sunAlt&&m.sun&&Assets.fx.sun_alt){c.imageSmoothingEnabled=false;c.drawImage(Assets.fx.sun_alt,m.sun.x-36,m.sun.y-36,72,72);}c.restore();},
 /* dwie mapy przesuwają się obok siebie, a na szwie jest płynny gradient kolorów nieba i ziemi */
 drawTravel(c){const b=this.bg,P=b.path,u=b.x/(640*(P.length-1)),k=Math.sin(Math.PI*u);P.forEach((id,i)=>this.drawMap(c,id,i*640-b.x));
  const hx=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;};
  for(let i=1;i<P.length;i++){const sx=i*640-b.x;if(sx<-140||sx>780)continue;const f=MAPS[P[i-1]],t=MAPS[P[i]];
   const band=(y,h,a,z)=>{const gr=c.createLinearGradient(sx-130,0,sx+130,0);gr.addColorStop(0,hx(a,0));gr.addColorStop(.4,hx(a,.85));gr.addColorStop(.6,hx(z,.85));gr.addColorStop(1,hx(z,0));c.fillStyle=gr;c.fillRect(sx-130,y,260,h);};
   band(0,170,f.sky,t.sky);band(170,150,f.ground,t.ground);
   const mg=c.createLinearGradient(sx-130,0,sx+130,0);mg.addColorStop(0,'rgba(255,255,255,0)');mg.addColorStop(.5,'rgba(255,255,255,.18)');mg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=mg;c.fillRect(sx-130,70,260,200);}   // mgła na styku światów
  c.fillStyle=`rgba(255,255,255,${.13*k})`;for(let i=0;i<9;i++)c.fillRect(640-((this.t*(.6+i%3*.3)+i*97)%760)+60,60+i*28,70,2);   // smugi prędkości
  const vg=c.createRadialGradient(320,160,120,320,160,420);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,`rgba(0,0,0,${.45*k})`);c.fillStyle=vg;c.fillRect(0,0,640,320);},
 /* --- NPC: wieśniak PRZED bossem, zbrojmistrz PO bossie --- */
 /* Czy właśnie wygraliśmy falę przed bossem? (następna fala to boss) */
 preBoss(){
  if(this.mode==='campaign'){
   return this.wave<this.waves.length && this.waves[this.wave] && this.waves[this.wave].boss;
  }
  return this.wave%5===4;   // po fali 4,9,14... następna jest bossem
 },
 /* Czy właśnie wygraliśmy bossa? */
 postBoss(){return !!this.cur().boss;},
 /* v1.1: kilku NPC naraz. Tryb nieskończony: zbrojmistrz + handlarz obok siebie po KAŻDEJ fali.
    Kampania: wieśniak przed bossem, zbrojmistrz po bossie (na Moczarach dodatkowo wiedźma – jeśli ją pokonano). */
 spawnNpcs(kinds){const X=kinds.length>1?[395,555]:[500],
   T={merchant:{key:'merchant',title:'Kupiec',lines:MERCHANT_LINES},smith:{key:'blacksmith',title:'Zbrojmistrz',lines:SMITH_LINES},witch:{key:'witch',title:'Wiedźma',lines:WITCH_LINES}};
  this.npcs=kinds.map((k,i)=>({npc:1,key:T[k].key,kind:k,title:T[k].title,x:X[i],y:240,ox:300,oy:0,say:T[k].lines[Math.floor(Math.random()*T[k].lines.length)]}));
  this.npcs.forEach(n=>{this.actors.push(n);tween(n,{ox:0},1400);});
 },
 spawnMerchant(){this.spawnNpcs(['merchant']);},
 spawnSmith(){this.spawnNpcs(['smith']);},
 /* kto czeka po wygranej fali */
 clearNpcs(){
  if(this.mode==='endless')return this.spawnNpcs(['smith','merchant']);
  if(this.postBoss())return this.spawnNpcs(this.witchHere()?['smith','witch']:['smith']);
  if(this.preBoss())this.spawnNpcs(['merchant']);
 },
 witchHere(){return this.mode==='campaign'&&!!Player.d.witch&&CAMPAIGN[this.level].boss==='witch';},
 /* najbliższy NPC w zasięgu bohatera (null = żaden) */
 nearNpc(){if(!this.p)return null;let b=null,bd=130;for(const n of this.npcs){if(n.ox>5)continue;const d=Math.abs(this.p.x-n.x);if(d<bd){bd=d;b=n;}}return b;},
 interact(n){
  if(this.state!=='clear')return;n=n||this.nearNpc();if(!n||n.ox>5)return;
  this.state='shop';const back=()=>{this.state='clear';};
  if(n.kind==='smith')UI.smith(back);else if(n.kind==='witch')UI.witch(back);else UI.shop(back);
 },
 /* ===== v1.1: stan gry do zapisu w slocie (PostgreSQL) i jego odtworzenie ===== */
 snapshot(){const camp=this.mode==='campaign',rec={v:1,mode:this.mode,state:this.state==='clear'?'clear':'fight',wave:this.wave,fbCd:Combat.fbCd,player:Player.d};
  if(camp){rec.level=this.level;rec.waves=this.waves;rec.snap=this.snap||null;rec.cleared=(Save.get('campaign')||{}).cleared||0;}
  return rec;},
 /* 'fight' = wczytanie zaczyna bieżącą falę od nowa (z zapisanym bohaterem); 'clear' = fala wygrana, wracasz do sklepów przed przejściem dalej */
 restore(rec){const sc=UI.$('screen');sc.classList.add('hidden');sc.innerHTML='';UI.menuOpen=false;this.nextBub();
  this.npcs=[];this.bg=null;this.banner=null;this.hub=null;this.proj=null;Combat.busy=false;Combat.guard=false;
  const d=Player.d=rec.player;d.gear=d.gear||{sword:null,armor:null,shield:null};d.comps=d.comps||[];d.sk=d.sk||{};
  this.mode=rec.mode;this.wave=rec.wave;this.level=rec.mode==='campaign'?rec.level:0;this.waves=rec.mode==='campaign'?rec.waves:[];this.snap=rec.snap||null;
  if(rec.state==='clear')this.loadClear();else this.newRun();
  Combat.fbCd=rec.fbCd||0;UI.hud();if(this.state==='fight'||this.state==='clear')UI.lock(false);},
 /* arena po wygranej fali (bez wrogów) – ze sklepami */
 loadClear(){UI.$('log').innerHTML='';this.loadWave(false,0,true);this.enemies=[];this.actors=[this.p,...this.comps];this.xpWave=0;
  Music.play(this.cur().map);Combat.busy=false;Combat.guard=false;this.state='clear';
  UI.log(`--- ${UI.waveLabel()}: ${MAPS[this.cur().map].name} (wczytano) ---`,'crit');UI.hud();UI.lock(false);this.clearNpcs();},
 /* ===== v1.1: chatka wiedźmy – po jej pokonaniu zostaje NPC na Moczarach; wejście z mapy świata (Tab), gdy opuściłeś bagna ===== */
 async visitWitch(){const keep=this.snapshot(),sc=UI.$('screen');sc.classList.add('hidden');sc.innerHTML='';UI.menuOpen=false;this.nextBub();this.state='moving';
  await tween(this,{fade:1},220);
  this.hubReturn=keep;this.mode='campaign';this.level=CAMPAIGN.findIndex(l=>l.boss==='witch');this.waves=[{e:[]}];this.wave=1;
  this.loadWave(false,0,true);this.enemies=[];this.actors=[this.p,...this.comps];this.npcs=[];this.hub='witch';
  Music.play('swamp');Combat.busy=false;this.state='clear';this.spawnNpcs(['witch']);
  UI.log('--- Chatka wiedźmy na Moczarach ---','crit');UI.hud();UI.lock(false);this.banner={txt:MAPS.swamp.name,t:0};
  await tween(this,{fade:0},260);},
 async leaveHub(){this.state='moving';await tween(this,{fade:1},220);const r=this.hubReturn;this.hubReturn=null;this.restore(r);
  this.banner={txt:CAMPAIGN[r.level].name,t:0};await tween(this,{fade:0},260);},
 async shoot(a,t,kind){const ball=kind==='ball',dir=Math.sign(t.x-a.x)||1,mz=(ASSETS[a.key].muz||{})[kind],
   ax=ball?a.x+a.ox+dir*8.5*a.scale:a.x+a.ox+Math.sign(t.x-a.x)*(mz?mz*a.scale:20),                                   // piłka leży tuż przy stopie piłkarza
   ay=ball?a.y+a.oy-6*a.scale:a.y+a.oy-ASSETS[a.key].fh*a.scale*.5-(a.air?18:0),bx=t.x+t.ox,by=t.y+t.oy-ASSETS[t.key].fh*t.scale*.5;
  if((kind==='bottle'||kind==='trident')&&a.anim==='throw'){a.pose='attack';await sleep(330);}   // zamach, potem puszczenie butelki
  if(ball){this.proj={ax,ay,bx,by,u:0,kind};a.pose='attack';await sleep(190);}                    // v1.1: zamach nogą (animacja kopnięcia), kopnięcie w 2. klatce
  this.proj={ax,ay,bx,by,u:0,kind};a.pose='attack';await tween(this.proj,{u:1},kind==='bottle'?550:kind==='ball'?430:kind==='trident'||kind==='snowball'?460:kind==='fire'?380:kind==='bullet'?200:kind==='laser'?170:280);this.proj=null;},
 /* v1.1: JEDNA kula ognia przelatuje przez wszystkich wrogów (od najbliższego). onHit(wróg,i) odpala trafienie w chwili, gdy kula do niego doleci;
    kula maleje z każdym trafieniem (tak samo jak obrażenia: 100% -> 50% -> 25% ...) i na końcu wylatuje poza arenę. */
 async fireThrough(a,foes,onHit){
  const mz=(ASSETS[a.key].muz||{}).fire,ax=a.x+a.ox+(mz?mz*a.scale:26),ay=a.y+a.oy-ASSETS[a.key].fh*a.scale*.5;
  a.pose='attack';await sleep(230);   // rzut
  const P=this.proj={ax,ay,bx:ax,by:ay,u:0,kind:'fire',k:1},hits=[];let cx=ax,cy=ay;
  for(let i=0;i<foes.length;i++){const t=foes[i],tx=t.x+t.ox,ty=t.y+t.oy-ASSETS[t.key].fh*t.scale*.5;
   Object.assign(P,{ax:cx,ay:cy,bx:tx,by:ty,u:0});await tween(P,{u:1},Math.max(140,Math.hypot(tx-cx,ty-cy)*1.3));
   cx=tx;cy=ty;hits.push(onHit(t,i));P.k=Math.max(.55,P.k*.82);}
  Object.assign(P,{ax:cx,ay:cy,bx:700,by:cy,u:0});await tween(P,{u:1},Math.max(160,(700-cx)*.9));   // wylot za ostatniego wroga
  this.proj=null;a.pose='';await Promise.all(hits);},
 drawProj(c){const p=this.proj;if(!p)return;const d=Math.sign(p.bx-p.ax)||1,x=p.ax+(p.bx-p.ax)*p.u,y=p.ay+(p.by-p.ay)*p.u-(({bottle:80,trident:34,snowball:56,ball:46})[p.kind]||0)*Math.sin(Math.PI*p.u);
  if(p.kind==='arrow'){c.fillStyle='#8a5a2a';c.fillRect(Math.min(x,x-16*d),y-1,16,2);c.fillStyle='#dfe6f0';c.fillRect(x-(d<0?0:4),y-2,4,4);}
  else if(p.kind==='trident'){const ang=Math.atan2(p.by-p.ay-34*Math.PI*Math.cos(Math.PI*p.u),p.bx-p.ax);c.save();c.translate(x,y);c.rotate(ang);c.scale(1.7,1.7);
   c.fillStyle='#5a4630';c.fillRect(-14,-1,22,2);c.fillStyle='#c8d4e0';c.fillRect(8,-4,2,8);c.fillRect(8,-4,7,1.5);c.fillRect(8,2.5,7,1.5);c.fillRect(8,-.8,9,1.6);c.restore();}
  else if(p.kind==='laser'){c.save();c.translate(x,y);c.rotate(Math.atan2(p.by-p.ay,p.bx-p.ax));c.fillStyle='rgba(255,60,60,.35)';c.fillRect(-16,-4,32,8);c.fillStyle='#ff4a4a';c.fillRect(-13,-1.6,26,3.2);c.fillStyle='#fff0f0';c.fillRect(-10,-.6,20,1.2);c.restore();}
  else if(p.kind==='snowball'){c.fillStyle='#9ad4f4';c.beginPath();c.arc(x,y,10,0,7);c.fill();c.fillStyle='#ffffff';c.beginPath();c.arc(x-2,y-2,8,0,7);c.fill();}
  else if(p.kind==='bullet'){c.fillStyle='#ffe070';for(let i=-1;i<=1;i++)c.fillRect(x-d*5*Math.abs(i),y+i*7*p.u,5,4);}
  else if(p.kind==='fire'){const k=p.k||1;   // k: kula maleje z każdym trafionym wrogiem
   for(let i=0;i<5;i++){c.globalAlpha=.5-i*.09;c.fillStyle=i%2?'#ffd060':'#ff7a20';c.beginPath();c.arc(x-d*i*9*k,y+Math.sin(i+p.u*20)*3,(11-i*1.6)*k,0,7);c.fill();}
   c.globalAlpha=1;c.fillStyle='#ffe070';c.beginPath();c.arc(x,y,8*k,0,7);c.fill();c.fillStyle='#ff5a10';c.beginPath();c.arc(x,y,5*k,0,7);c.fill();}
  else if(p.kind==='ball'){c.save();c.translate(x,y);c.rotate(p.u*16*d);c.fillStyle='#14101f';c.beginPath();c.arc(0,0,8.5,0,7);c.fill();c.fillStyle='#f6f6f6';c.beginPath();c.arc(0,0,7,0,7);c.fill();   // piłka nożna
   c.fillStyle='#2a2a38';c.beginPath();for(let i=0;i<5;i++){const q=i*Math.PI*2/5-Math.PI/2;c.lineTo(Math.cos(q)*3,Math.sin(q)*3);}c.closePath();c.fill();
   for(let i=0;i<5;i++){const q=i*Math.PI*2/5-Math.PI/2;c.fillRect(Math.cos(q)*6-1,Math.sin(q)*6-1,2,2);}c.restore();}
  else if(Assets.fx.bottleproj){const im=Assets.fx.bottleproj;c.save();c.translate(x,y);c.scale(d,1);c.rotate(p.u*14);c.drawImage(im,-im.width,-im.height,im.width*2,im.height*2);c.restore();}
  else{c.save();c.translate(x,y);c.rotate(p.u*14);c.fillStyle='#3a9a5a';c.fillRect(-4,-8,8,15);c.fillStyle='#8ae0a0';c.fillRect(-2,-13,4,6);c.restore();}},
 drawNpc(a){const c=this.c,x=a.x+a.ox,y=a.y+a.oy,t=this.t;c.globalAlpha=1;c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(x,y,70,9,0,0,7);c.fill();
  const isSmith=a.kind==='smith'||a.key==='blacksmith';
  if(a.kind==='witch'){
    /* v1.1: wiedźma lewituje nad kociołkiem (po pokonaniu osiadła w chatce na Moczarach) */
    const cx=x+50;
    c.fillStyle='#14101f';c.fillRect(cx-22,y-8,6,10);c.fillRect(cx+16,y-8,6,10);                 // nóżki kociołka
    c.fillStyle='#2a2a36';c.beginPath();c.ellipse(cx,y-22,24,18,0,0,7);c.fill();                  // brzuch
    c.fillStyle='#3a3a4a';c.fillRect(cx-26,y-40,52,6);                                            // rant
    c.globalAlpha=.75+.2*Math.sin(t/260);c.fillStyle='#6aff6a';c.beginPath();c.ellipse(cx,y-40,22,4,0,0,7);c.fill();c.globalAlpha=1;   // wywar
    for(let i=0;i<3;i++){const u=((t/900)+i/3)%1;c.fillStyle='#b8ffb8';c.fillRect(cx-12+i*12+Math.sin(t/200+i)*3,y-44-u*26,3,3);}      // bąbelki
    Assets.draw(c,'witch',x-14,y-26+Math.sin(t/330)*3,2,t,-1);
  }else if(isSmith){
    /* kowal za kowadłem – jak wieśniak za straganem */
    Assets.draw(c,'blacksmith',x,y-16+Math.sin(t/400)*1.5,2.6,t,-1);
    Assets.draw(c,'anvil',x,y,2.2,t,1);
  }else{
    Assets.draw(c,'merchant',x,y-16+Math.sin(t/400)*1.5,2.6,t,-1);
    Assets.draw(c,'stall',x,y,2.6,t,1);
  }},
 drawBubble(c){if(this.state==='moving'||this.state==='shop'||!this.npcs.length)return;
  const dual=this.npcs.length>1,nr=this.nearNpc();c.font='bold 12px "Courier New"';
  for(const m of this.npcs){if(m.ox>5)continue;const isN=m===nr,
    txt=dual?(isN?'[E] lub klik: '+m.title:m.title):(isN?'Chcesz zobaczyć towar? [E] lub klik':m.say);   // przy dwóch NPC krótkie podpisy, żeby się nie nakładały
   const w=c.measureText(txt).width+16,x=Math.max(w/2+4,Math.min(636-w/2,m.x)),y=m.y-152;
   c.fillStyle='#000';c.fillRect(x-w/2-2,y-2,w+4,28);c.fillStyle='#f3e9d2';c.fillRect(x-w/2,y,w,24);
   c.fillStyle='#14101f';c.textAlign='center';c.fillText(txt,x,y+16);c.fillStyle='#f3e9d2';c.fillRect(m.x-4,y+24,8,6);}},
 /* v1.0: przeniesienie do odblokowanego etapu z podglądu mapy (Tab) */
 jumpToStage(i){const s=UI.$('screen');s.classList.add('hidden');s.innerHTML='';UI.menuOpen=false;this.nextBub();
  const d=Player.d;d.hp=d.maxhp;(d.comps||[]).forEach(c=>c.hp=c.maxhp);
  this.mode='campaign';this.level=i;this.wave=1;this.waves=buildWaves(i);this.snap=JSON.stringify(d);this.npcs=[];this.bg=null;this.banner=null;Combat.busy=false;this.newRun();
  this.banner={txt:CAMPAIGN[i].name,t:0};},
 async lose(){this.state='over';Player.d.deaths=(Player.d.deaths||0)+1;
  if(this.mode==='campaign'&&this.level>=CAMPAIGN.length-1)await Story.bad();
  if(this.mode==='campaign'){
    /* po śmierci – mapa świata (cofnięcie do odblokowanych etapów) */
    return UI.worldMap({fromDeath:1,retryLevel:this.level});
  }
  Save.clear('endless');UI.screen('GAME OVER',`Pokonane fale: ${this.wave-1}. Poziom: ${Player.d.level}.`,
   [{l:'Zagraj ponownie',f:()=>this.startEndless(true)},{l:'Menu',f:()=>UI.title()}]);},
 loop(t){const dt=t-this.t;this.t=t;this.update();this.draw();requestAnimationFrame(x=>this.loop(x));},
 toggleDev(){this.dev=!this.dev;if(Player.d&&this.p){Player.d.hp=Player.d.maxhp;UI.hud();}
  UI.log('Tryb deweloperski: '+(this.dev?'WŁĄCZONY (nieskończone HP)':'wyłączony'),'crit');},
 update(){const p=this.p;if(!p)return;if(this.dev)Player.d.hp=Player.d.maxhp;p.walk=p.auto?1:0;
  const clr=this.state==='clear';
  /* zamrożony gracz nie może się ruszać */
  const canMove=((this.state==='fight'&&!Combat.busy)||clr)&&!p.freeze;
  if(canMove){const k=this.keys,sp=k.shift?4.2:2.2;   // Shift = sprint
   let dx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),dy=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);
   /* SKOK – Spacja */
   if((k[' ']||k.space)&&!p.jumping){p.jumping=1;p.vy=-7.2;p.walk=0;}
   if(p.jumping){p.oy+=p.vy;p.vy+=.45;if(p.oy>=0){p.oy=0;p.vy=0;p.jumping=0;}}
   if(dx||dy){p.x=Math.max(40,Math.min(clr?626:560,p.x+dx*sp));p.y=Math.max(180,Math.min(290,p.y+dy*sp));if(!p.jumping)p.walk=1;if(dx)p.face=dx>0?1:-1;}
   if(clr&&p.x>=600)this.advance();}
  const mid=this.bg?this.bg.path[Math.min(this.bg.path.length-1,Math.round(this.bg.x/640))]:this.cur().map,amb=MAPS[mid]&&AMB[MAPS[mid].amb];   // klimat mapy: liście, śnieg, iskry...
  if(amb&&Math.random()<.35)this.fx.push({x:Math.random()*660,y:amb.y(),vx:amb.vx+(this.bg?-7:0),vy:amb.vy,g:0,dl:.006,life:1.2,c:amb.c,sz:amb.sz,pt:1});
  for(const a of this.actors)if(a.burn&&Math.random()<.3)this.fx.push({x:a.x+a.ox+(Math.random()-.5)*20,y:a.y+a.oy-20-Math.random()*30,vx:0,vy:-1.5,life:.8,c:'#ff9a40',sz:3,pt:1});
  if(!Combat.busy&&(this.state==='fight'||this.state==='clear'))this.comps.forEach((c,i)=>{if(c.s.hp<=0||c.alpha<1)return;const o=COMP_OFF[i],tx=p.x+o[0],ty=p.y+o[1];c.x+=(tx-c.x)*.1;c.y+=(ty-c.y)*.1;c.walk=Math.hypot(tx-c.x,ty-c.y)>6?1:0;});
  this.fx=this.fx.filter(f=>{if(f.pt){f.x+=f.vx;f.y+=f.vy;f.vy+=f.g===undefined?.25:f.g;f.life-=f.dl||.025;}else if(f.spr||f.slash){f.life-=f.slash?.08:.05;}else{f.y-=.8;f.life-=.015;}return f.life>0;});},
 draw(){if(this.state==='cutscene')return Cut.draw(this.c);const c=this.c,w=this.cur(),m=MAPS[w.map];c.save();c.clearRect(0,0,640,320);this.top=[];
  if(this.shake>0){c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);this.shake*=.85;}
  if(this.bg)this.drawTravel(c);else this.drawMap(c,w.map,0);
  [...this.actors].sort((a,b)=>a.y-b.y).forEach(a=>this.drawActor(a));this.top.forEach(f=>f(c));this.drawBubble(c);this.drawProj(c);this.drawSpeech(c);
  this.fx.forEach(f=>{c.globalAlpha=Math.max(0,f.life);if(f.spr){const im=Assets.fx[f.spr];if(im){const n=Math.max(1,Math.floor(im.width/32));c.drawImage(im,Math.min(n-1,Math.floor((1-f.life)*n))*32,0,32,im.height,f.x-48,f.y-48,96,96);}}else if(f.slash){const e=1-f.life,R=34+e*14,cx=-16+R*Math.cos(1.15),sy=R*Math.sin(1.15);c.save();c.translate(f.x,f.y);c.scale(f.d,1);c.rotate(-.35);c.fillStyle='#fff';
    c.beginPath();c.arc(-16,0,R,-1.15,1.15);c.quadraticCurveTo(-16+R*(.9+.3*e),0,cx,-sy);c.closePath();c.fill();c.restore();}   // smukły półksiężyc, który gaśnie i rozszerza się
   else if(f.pt){c.fillStyle=f.c;c.fillRect(f.x,f.y,f.sz,f.sz);}
   else{c.font=`bold ${Math.round((f.big?26:18)*(f.life>.85?1+(f.life-.85)*5:1))}px "Courier New"`;c.textAlign='center';c.fillStyle='#000';c.fillText(f.txt,f.x+2,f.y+2);c.fillStyle=f.c;c.fillText(f.txt,f.x,f.y);}});
  if(this.state==='clear'){c.globalAlpha=.6+.4*Math.sin(this.t/200);c.font='bold 16px "Courier New"';c.textAlign='right';c.fillStyle='#000';c.fillText((this.hub?'Wróć na szlak ▶ (lub kliknij)':'Idź w prawo ▶ (lub kliknij)'),634,32);c.fillStyle='#f2c14e';c.fillText((this.hub?'Wróć na szlak ▶ (lub kliknij)':'Idź w prawo ▶ (lub kliknij)'),632,30);c.globalAlpha=1;}
  if(this.banner){const b=this.banner;b.t++;const al=Math.min(1,b.t/25,(170-b.t)/30);if(al<=0)this.banner=null;else{c.globalAlpha=al;c.font='bold 22px "Courier New"';c.textAlign='center';c.fillStyle='#000';c.fillText(b.txt,322,72);c.fillStyle='#f2c14e';c.fillText(b.txt,320,70);c.globalAlpha=1;}}
  if(this.dev){c.font='bold 12px "Courier New"';c.textAlign='left';c.fillStyle='#000';c.fillText('DEV ∞HP',9,17);c.fillStyle='#7aff9a';c.fillText('DEV ∞HP',8,16);}
  c.restore();c.globalAlpha=1;if(this.fade>0){c.fillStyle=`rgba(0,0,0,${this.fade})`;c.fillRect(0,0,640,320);}},
 /* ===== SWING: ostrze obraca się wokół dłoni (zamach do tyłu -> szybkie cięcie łukiem -> powrót), a za nim ciągnie się smuga ===== */
 SW_HAND:[[24,10.5],[27,15],[24,14.5]],   // gdzie jest pięść w kolejnych klatkach ataku bohatera (px klatki 32x32)
 swingAng(u,big){const A0=-(big?105:80)*Math.PI/180,A1=(big?135:112)*Math.PI/180;   // kąt od pionu, w prawo = dodatni
  if(u<.25)return A0*EASE.out(u/.25);                                // zamach
  if(u<.6)return A0+(A1-A0)*EASE.io((u-.25)/.35);                    // cięcie (najszybciej w momencie trafienia)
  return A1*(1-EASE.io((u-.6)/.4));},                                // powrót do pozycji spoczynkowej
 swingBlade(a,it,o){const sw=a.sw,im=Assets.fx[it.overlay];if(!im)return;
  const u=Math.max(0,Math.min(1,(o.t-sw.t0)/sw.dur)),big=!!sw.big,ang=this.swingAng(u,big),fi=Math.min(2,Math.floor((o.t-sw.t0)/110)),hd=this.SW_HAND[fi],
   k=Math.max(0,Math.min(1,Math.min((o.t-sw.t0)/60,(1-u)/.12))),   // płynne przejście: pozycja spoczynkowa <-> dłoń
   px=25+(hd[0]-25)*k,py=20.5+(hd[1]-20.5)*k,col=big?'#ffe38a':(SWING_COL[it.overlay]||'#fff'),al=a.alpha;
  this.top.push(c=>{c.save();c.globalAlpha=al;c.translate(o.x,o.y);c.scale(o.face*o.s/o.sq,o.s*o.sq);c.translate(px-16,py-32);
   if(u>.22&&u<.82){const N=10,span=big?.2:.16,R0=5,R1=big?25:22;   // smuga: wycinki pierścienia za ostrzem, coraz bledsze
    c.fillStyle=col;
    for(let i=0;i<N;i++){const u0=u-span*(i+1)/N,u1=u-span*i/N;if(u0<.23)break;const a0=this.swingAng(u0,big),a1=this.swingAng(u1,big);
     const fa=al*Math.pow(1-i/N,1.4),seg=(r0,r1)=>{c.beginPath();c.moveTo(r0*Math.sin(a0),-r0*Math.cos(a0));c.lineTo(r1*Math.sin(a0),-r1*Math.cos(a0));c.lineTo(r1*Math.sin(a1),-r1*Math.cos(a1));c.lineTo(r0*Math.sin(a1),-r0*Math.cos(a1));c.closePath();c.fill();};
     c.fillStyle=col;c.globalAlpha=fa*(big?.8:.75);seg(R0,R1);                       // szeroka smuga w kolorze miecza
     if(i<5){c.fillStyle='#fff';c.globalAlpha=fa*.85;seg(R1-9,R1);}}                // jasny rdzeń przy czubku tuż za ostrzem
    c.globalAlpha=al;}
   c.rotate(ang);c.drawImage(im,0,0,32,32,-23,-20.5,32,32);c.restore();});},
 drawActor(a){if(a.npc)return this.drawNpc(a);const c=this.c,t=this.t,s=a.scale*(a.pose==='attack'?1.15:1),bob=Math.sin(t/1000*(a.walk?14:3)+a.ph)*(a.walk?2:1.5),
   x=a.x+a.ox,y=a.y+a.oy,h=ASSETS[a.key].fh*a.scale+(a.air?20:0);
  c.globalAlpha=a.alpha;c.fillStyle='rgba(0,0,0,.3)';const shS=a.jumping?.55:1;c.beginPath();c.ellipse(x,y,ASSETS[a.key].fw*a.scale*.3*shS,a.scale*3*shS,0,0,7);c.fill();
  if(a.flash>0){c.filter='brightness(3)';a.flash-=.05;}
  const st=(a.s.hp<=0&&!a.last)?'death':(a.flash>0||a.last)?'hurt':a.pose==='attack'?((a.anim&&Assets.sheets[a.key][a.anim])?a.anim:'attack'):a.jumping?(Assets.sheets[a.key].jump?'jump':'walk'):a.run?'run':a.walk?'walk':'idle';
  if(a.st!==st){a.st=st;a.at=t;}
  const air=a.air?(-18+Math.sin(t/260+a.ph)*4):0,sq=a.pose==='attack'?.88:a.jumping?(a.vy<0?.92:1.08):(st==='idle'?1+.03*Math.sin(t/300+a.ph):1);   // oddychanie / rozciągnięcie przy ataku/skoku
  if(a.freeze&&a.flash<=0)c.filter=a.freeze.stone?'grayscale(1) brightness(.85) contrast(1.2)':'hue-rotate(170deg) brightness(1.3)';
  if(a.rot){c.save();c.translate(x,y);c.rotate(a.rot);c.translate(-x,-y);}
  /* warstwy: ciało → tarcza z boku (osłania, nie zasłania) → miecz */
  const gear=((a===this.p||a.hero)&&Player.d)?(Player.d.gear||{}):null;
  const face=a.face||1;
  /* 1) ciało */
  Assets.draw(c,a.key,x,y+bob+air,s,t,a.face,st,a.at,sq);
  /* 2) tarcza – zasłania lewą rękę (przesunięta w prawo, ręka niewidoczna) */
  if(gear&&gear.shield){
    const it=GEAR.find(x=>x.id===gear.shield);
    const im=it&&it.overlay&&Assets.fx[it.overlay];
    if(im){
      c.save();
      c.translate(x,y+bob+air);
      c.scale(face*s/sq,s*sq);
      c.drawImage(im,0,0,32,32,-18,-24,18,18);
      c.restore();
    }
  }
  /* 3) miecz – z prawej, animacja przy ataku */
  if(gear&&gear.sword){
    const it=GEAR.find(x=>x.id===gear.sword);
    if(it&&it.overlay){
      const atk=st==='attack';
      const im=atk&&Assets.fx[it.overlay+'_attack']?Assets.fx[it.overlay+'_attack']:Assets.fx[it.overlay];
      if(a.sw&&atk)this.swingBlade(a,it,{x,y:y+bob+air,s,sq,face,t});   // cięcie: miecz rysowany na warstwie nad aktorami
      else if(im){
        const fw=32,n=Math.max(1,Math.floor(im.width/fw));
        const fr=atk?Math.min(n-1,Math.floor((t-(a.at||0))/110)):0;
        c.save();
        c.translate(x,y+bob+air);
        c.scale(face*s/sq,s*sq);
        c.drawImage(im,fr*fw,0,fw,32,-14,-32,32,32);
        c.restore();
      }
    }
  }
  if(a.rot)c.restore();c.filter='none';
  if(this.invuln(a)){c.globalAlpha=.4+.15*Math.sin(t/180);c.strokeStyle='#8ae0ff';c.lineWidth=3;c.beginPath();c.ellipse(x,y-h*.45,ASSETS[a.key].fw*a.scale*.4,h*.55,0,0,7);c.stroke();c.globalAlpha=.1;c.fillStyle='#8ae0ff';c.fill();c.globalAlpha=a.alpha;}   // tarcza ochronna
  if(a.s.hp>0&&!a.nobar){c.fillStyle='#000';c.fillRect(x-22,y-h-14,44,7);c.fillStyle=(a===this.p||a.ally)?'#4ad66a':this.invuln(a)?'#8a93a8':'#d64545';c.fillRect(x-20,y-h-12,40*a.s.hp/a.s.maxhp,3);
   if(a===this.target()&&a!==this.p&&!a.ally){c.fillStyle='#f2c14e';c.fillRect(x-4,y-h-24,8,6);}}
  if(a.s.hp>0&&!a.nobar){let k=0;for(const[n,col]of[['poison','#7aff6a'],['burn','#ff9a40'],['freeze','#8ae0ff'],['sand','#e8d090'],['haste','#ffd24a']]){const q=a[n];if(!q)continue;const ix=x-22+k*30,ic=Assets.fx[n==='freeze'&&q.stone?'stone':n];
   if(ic)c.drawImage(ic,ix,y-h-32,16,16);else{c.fillStyle=col;c.fillRect(ix,y-h-30,10,10);}
   c.font='bold 11px "Courier New"';c.textAlign='left';c.fillStyle='#000';c.fillText(q.t,ix+17,y-h-18);c.fillStyle=col;c.fillText(q.t,ix+16,y-h-19);k++;}}
  if(this.invuln(a)&&a.s.hp>0){c.font='bold 10px "Courier New"';c.textAlign='center';c.fillStyle='#000';c.fillText('NIETYKALNY',x+1,y-h-35);c.fillStyle='#8ae0ff';c.fillText('NIETYKALNY',x,y-h-36);}
  c.globalAlpha=1;}
};
