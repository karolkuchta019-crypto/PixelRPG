/* Walka turowa: gracz -> kompani (automatycznie) -> wrogowie -> efekty (trucizna/podpalenie).
   Zamrożony traci turę, nie atakuje i nie unika. Nie można mieć burn+freeze jednocześnie.
   Kula ognia (o.fire) nigdy nie nakłada zamrożenia.
   Opcje strike: rng ('arrow'|'bullet'|'bottle'|'fire'), pois, burn, magic, fire, say, nocrit. */
const POISONABLE=['goblin','human','elf','animal','yeti'],NAMES={poison:'truciznę',burn:'podpalenie',freeze:'zamrożenie',sand:'piasek',stone:'zamianę w kamień'};
const Combat={busy:false,guard:false,fbCd:0,
 roll(a,d,mult,acc,force,nocrit,target,actor,flat){
  /* efekt piasku na atakującym: obniża celność */
  if(actor&&actor.sand)acc*=.55;
  if((G.event==='sandstorm'||G.event==='snowstorm')&&actor&&(actor===G.p||actor.ally))acc*=.7;   // v1.2.1 / v1.2.3: burza piaskowa / śnieżna – więcej pudeł po stronie bohatera
  if(target&&target.freeze){/* zamrożony nie unika */}else if(Math.random()>acc)return{miss:1};
  else if(Math.random()<d.dodge)return{dodge:1};
  const crit=!nocrit&&(force||Math.random()<a.crit+(a===Player.d?Player.luck():0));   // v1.1: + szczęście z talizmanów wiedźmy
  const atk=(flat!=null?flat:(a===Player.d?Player.atk():a.atk)),def=   /* flat = własna moc kuli ognia, bez ATK */(d===Player.d?Player.def():d.def);return{crit,dmg:Math.max(1,Math.round(atk*mult*(crit?1.8:1)*(.9+Math.random()*.2)-def))};},
 /* efekty: gracz i kompani = 'human'. Odporności wg tagów (enemies.js) */
 status(t,kind,src,fromFire=false){const tg=t.tags||['human'];
  if(kind==='sand'){t.sand={t:3};G.text(t,'PIASEK','#e8d090');UI.log(`${t.name} jest oślepiony piaskiem (niższa celność, 3 tury)!`,'bad');return;}
  const imm=kind==='poison'?!tg.some(x=>POISONABLE.includes(x)):kind==='burn'?tg.includes('fire'):kind==='stone'?(tg.includes('golem')||tg.includes('reptile')||tg.includes('machine')):tg.includes('winter');
  if(imm){G.text(t,'ODPORNY','#ccc');UI.log(`${t.name} jest odporny na ${NAMES[kind]}!`);return;}
  if((t===G.p||t.ally)&&Math.random()<.25*((Player.d.sk||{}).resist||0)){G.text(t,'ODPARTE!','#fff');UI.log(`${t.name} opiera się efektowi (odporność)!`,'good');return;}
  /* v1.0: KAMIEŃ (bazyliszek) działa jak zamrożenie: 2 tury bez ruchu, brak uników; zamieniony nie płonie i nie zamarza */
  if(t.freeze&&t.freeze.stone&&(kind==='freeze'||kind==='burn'||kind==='stone'))return;
  if(kind==='stone'){t.burn=null;t.freeze={t:2,stone:1};G.text(t,'KAMIEŃ','#b8bcc8');UI.log(`${t.name} zamienia się w kamień (traci 2 tury)!`,'bad');return;}
  /* kula ognia nigdy nie zamraża */
  if(kind==='freeze'&&fromFire)return;
  /* nie można być jednocześnie podpalonym i zamrożonym */
  if(kind==='burn'&&t.freeze){t.freeze=null;UI.log(`${t.name}: zamrożenie znika w ogniu!`,'good');}
  if(kind==='freeze'&&t.burn){t.burn=null;UI.log(`${t.name}: ogień gaśnie od mrozu!`,'good');}
  if(kind==='freeze'){t.freeze={t:2};G.text(t,'ZAMROŻONY','#8ae0ff');UI.log(`${t.name} zostaje zamrożony (traci 2 tury)!`,'bad');return;}
  const b=kind==='burn',dm=Math.max(b?3:2,Math.round(src.atk*(b?.35:.3)));t[kind]={t:3,d:dm};
  G.text(t,b?'PODPALONY':'TRUCIZNA',b?'#ff9a40':'#7aff6a');UI.log(`${t.name} ${b?'płonie':'zostaje zatruty'} (3 tury, ${dm} HP/turę)!`,'bad');},
 async strike(a,t,mult,acc,force,name,o={}){
  if(t.phantom){await this.dispel(t);return;}   // v1.2.1: miraż
  if(o.say)UI.log(o.say,'bad');
  a.anim=o.rng==='bullet'?'shoot':(o.rng==='bottle'||o.rng==='trident'||o.rng==='flare')?'throw':o.rng==='ball'?'kick':'';   // wybór animacji ataku (jeśli postać ją ma)
  const dir=Math.sign(t.x-a.x)||1,sk=Player.d.sk||{},df=a.def||{};
  if(o.pass){/* v1.1: pocisk (kula ognia) leci osobno przez wszystkich wrogów – tu tylko trafienie */}else if(o.rng)await G.shoot(a,t,o.rng);else await G.approach(a,t,(a.def&&typeof a.def==='object'&&a.def.move)||'dash');   // v1.2.2: styl ataku wroga
  if(!o.pass)a.pose='attack';
  if(!o.rng&&a===G.p&&Player.d.gear&&Player.d.gear.sword){a.sw={t0:G.t,dur:force?400:340,big:!!force};await sleep(force?170:150);}   // SWING: trafienie przypada na środek cięcia
  else await sleep(o.rng?60:90);
  let res=0;if(!o.magic){if(o.rng&&!t.air){mult*=.7;res=1;}else if(!o.rng&&t.air){mult*=.7;res=1;}}if(o.fire&&(t.tags||[]).includes('fire')){mult*=.5;res=1;}   // naziemni vs dystans, latający vs broń biała
  const one=G.dev&&(a===G.p||a.ally)&&!t.ally&&t!==G.p;   // tryb dev: zabicie jednym atakiem
  const r=one?{dmg:t.s.hp,crit:1}:this.roll(a.s,t.s,mult,acc,force,o.nocrit,t,a,o.flat);
  if(r.miss){G.text(t,'PUDŁO','#ccc');UI.log(`${name} pudłuje.`);}
  else if(r.dodge){G.text(t,'UNIK','#9cf');UI.log(`${t.name} unika ataku!`);}
  else{if(t===G.p&&this.guard)r.dmg=Math.max(1,Math.round(r.dmg*.4));
   t.s.hp=Math.max(0,t.s.hp-r.dmg);t.flash=1;G.text(t,one?'ZABITY!':(r.crit?'KRYT! ':'')+r.dmg,r.crit?'#f2c14e':'#fff',r.crit);
   if(a===G.p&&sk.vamp){const v=Math.max(1,Math.round(r.dmg*.2));a.s.hp=Math.min(a.s.maxhp,a.s.hp+v);G.text(a,'+'+v,'#7aff9a');}
   G.hitfx(t,o.rng==='bottle'&&Assets.fx.bottle?'bottle':r.crit?'crit':'hit');G.burst(t.x,t.y-30,o.rng==='bottle'?'#5ad07a':o.rng==='flare'?'#ff7a30':r.crit?'#f2c14e':'#fff',r.crit?24:10);if(r.crit)G.shake=10;
   if(!o.rng)G.slash(t,dir);await sleep(60);if(t.s.hp>0)G.knock(t,dir);   // hit-stop + odrzut
   UI.log(`${name} zadaje ${r.dmg} obrażeń${r.crit?' (KRYTYK!)':''}${res?' (odporność)':''}.`,r.crit?'crit':(t===G.p?'bad':''));
   const k=[];if(o.pois||(df.pois&&Math.random()<df.pois)||(a===G.p&&sk.venom&&Math.random()<.35))k.push('poison');
   if((df.burn&&Math.random()<df.burn)||(a===G.p&&sk.flame&&Math.random()<.35)||(o.burn&&Math.random()<.6))k.push('burn');
   if(!o.fire&&!o.burn&&((df.freeze&&Math.random()<df.freeze)||(a===G.p&&sk.frost&&Math.random()<.3)))k.push('freeze');
   if(o.sand)k.push('sand');if(o.freeze&&!k.includes('freeze'))k.push('freeze');if(o.stone||(df.stone&&Math.random()<df.stone))k.push('stone');
   if(df.drain&&a.s.hp>0){const v=Math.max(1,Math.round(r.dmg*df.drain));a.s.hp=Math.min(a.s.maxhp,a.s.hp+v);G.text(a,'+'+v,'#d890e8');UI.log(`${a.name} wysysa życie (+${v} HP).`,'bad');}
   if(t.s.hp>0)k.forEach(x=>this.status(t,x,a.s,!!o.fire));}
  if(G.dev&&t===G.p)t.s.hp=t.s.maxhp;
  UI.hud();await sleep(150);if(!o.pass){a.pose='';a.anim='';a.sw=null;}if(!o.rng)await G.retreat(a,(a.def&&typeof a.def==='object'&&a.def.move)||'dash');
  if(t.s.hp<=0)await this.kill(t);},
 async kill(t){if(t===G.p&&((Player.d.sk||{}).totem>0)&&!G.dev){await this.totem();return;}   // v1.2.0: totem zamiast śmierci
  UI.log(`${t.name} ginie.`,t===G.p?'bad':'good');G.burst(t.x,t.y-30,'#ff8040',30);
  /* v1.0: boss przed śmiercią życzy bohaterowi niepowodzeń */
  const dd=t.def;if(t!==G.p&&!t.ally&&dd&&dd.boss&&dd.dlg&&dd.dlg.death){t.last=1;await G.say(t,dd.dlg.death);t.last=0;}
  /* poprawiona animacja śmierci: najpierw sheet death, potem fade */
  t.pose='death';t.st='death';t.at=G.t;
  if(Assets.sheets[t.key]&&Assets.sheets[t.key].death)await sleep(480);
  else await tween(t,{rot:-(t.face||1)*1.35,oy:t.oy+10},380,'in');
  if(t===G.p){const bs=G.enemies.find(e=>e.def&&e.def.boss&&e.def.dlg&&e.s.hp>0);if(bs)await G.say(bs,bs.def.dlg.win);}   // boss wyśmiewa pokonanego bohatera
  await tween(t,{alpha:0},420,'in');
  if(t===G.p)return;
  G.actors=G.actors.filter(e=>e!==t);
  if(t.ally){G.comps=G.comps.filter(c=>c!==t);Player.d.comps=Player.d.comps.filter(c=>c!==t.s);return;}   // kompan ginie na zawsze
  G.enemies=G.enemies.filter(e=>e!==t);this.refreshHaste();G.xpWave+=t.xp;Player.d.kills=(Player.d.kills||0)+1;
  if(Player.gainXp(t.xp))UI.log('AWANS na poziom '+Player.d.level+'! +1 punkt umiejętności (do wydania u kupca)','crit');UI.hud();
  await this.split(t);
  if(G.enemies.length&&!G.enemies.some(e=>!e.phantom)){G.enemies.forEach(p=>G.burst(p.x,p.y-30,'#ffe9a0',12));G.actors=G.actors.filter(a=>!a.phantom);G.enemies=[];G.sel=null;}},   // v1.2.1: po prawdziwych wrogach znikają też miraże
 /* v1.2.1: RYBIK CUKROWY – po zabiciu 25% szans na rozdwojenie: dwa nowe rybiki z 50% maks. HP poprzedniego (do 2 pokoleń, o ile jest miejsce na arenie) */
 async split(t){
  if(t.key!=='silverfish'||t.phantom||(t.gen||0)>=2||Math.random()>=.25)return;
  const free=MAX_FOES-G.enemies.length;if(free<=0)return;
  UI.log('Rybik cukrowy rozdwaja się!','crit');G.text(t,'ROZDWOJENIE!','#cfe8ff');
  const hp=Math.max(1,Math.round(t.s.maxhp*.5)),jobs=[];
  for(let i=0;i<Math.min(2,free);i++){const k=makeEnemy('silverfish',G.diff(),G.enemies.length);k.gen=(t.gen||0)+1;k.minion=1;k.s.hp=k.s.maxhp=hp;k.xp=Math.round(t.xp*.5);
   k.x=Math.max(380,Math.min(610,t.x+(i?34:-34)));k.y=t.y;k.alpha=0;k.ox=i?-24:24;G.enemies.push(k);G.actors.push(k);G.burst(t.x,t.y-24,'#cfe8ff',10);jobs.push(tween(k,{alpha:1,ox:0},380,'out'));}
  await Promise.all(jobs);},
 /* v1.2.1: FATAMORGANA – trafiony miraż rozpływa się w powietrzu (bez obrażeń i bez nagrody) */
 async dispel(t){UI.log('To tylko fatamorgana! Wróg rozpływa się w powietrzu.','crit');G.text(t,'MIRAŻ!','#ffe070');G.burst(t.x,t.y-30,'#ffe9a0',18);
  await tween(t,{alpha:0},380,'in');G.enemies=G.enemies.filter(e=>e!==t);G.actors=G.actors.filter(e=>e!==t);if(G.sel===t)G.sel=null;},
 async summon(e,type,n,msg,txt){UI.log(msg||`${e.name} przywołuje pomocników!`,'bad');G.text(e,txt||'DO MNIE!','#f2c14e');e.anim='jump';e.pose='attack';
  const list=Array.isArray(type)?type:Array.from({length:n||2},()=>type);
  for(const ty of list){if(G.enemies.length>=4)break;const k=makeEnemy(ty,G.diff(),G.enemies.length);k.minion=1;k.alpha=0;k.ox=80;G.enemies.push(k);G.actors.push(k);G.burst(k.x,k.y-20,'#fff',10);await tween(k,{alpha:1,ox:0},400,'out');}
  e.pose='';e.anim='';this.refreshHaste(true);},
 /* SZYBKOŚĆ (but): dopóki żyje sędzia, piłkarze mają efekt haste – atakują jako pierwsi (przed ruchem gracza) i o 40% mocniej */
 refreshHaste(say){const ref=G.enemies.some(x=>x.def&&x.def.support&&x.s.hp>0);
  for(const e of G.enemies){if(e.key!=='kicker')continue;
   if(ref&&!e.haste){e.haste={t:''};if(say){G.text(e,'SZYBKOŚĆ','#ffd24a');G.burst(e.x,e.y-20,'#ffd24a',8);}}
   else if(!ref&&e.haste){e.haste=null;if(e.s.hp>0)G.text(e,'KONIEC SZYBKOŚCI','#ccc');}}},
 async whistle(e,m){if(m.say)UI.log(m.say,'bad');e.pose='attack';G.text(e,'FIU FIU!','#ffd24a');await sleep(450);this.refreshHaste(true);
  for(const k of G.enemies)if(k.haste)G.text(k,'SZYBKOŚĆ','#ffd24a');e.pose='';await sleep(300);},
 async healSelf(e,m){if(m.say)UI.log(m.say,'bad');e.pose='attack';await sleep(300);const h=Math.max(0,Math.min(Math.round(e.s.maxhp*m.heal),e.s.maxhp-e.s.hp));e.s.hp+=h;
  G.text(e,'+'+h,'#7aff9a');G.burst(e.x,e.y-40,'#7aff9a',18);UI.log(`${e.name} odzyskuje ${h} HP.`,'bad');e.pose='';UI.hud();await sleep(450);},
 /* jedna tura wroga (używana w fazie początkowej dla szybkich i w zwykłej fazie wrogów) */
 async enemyAct(e){if(e.s.hp<=0||Player.d.hp<=0||e.phantom)return;
  if(e.freeze){await this.thaw(e);return;}
  for(const m of e.def.behave(e)){if(Player.d.hp<=0)break;
   if(m.summon){await this.summon(e,m.summon,m.n||2,m.say,m.txt);continue;}
   if(m.heal){await this.healSelf(e,m);continue;}
   if(m.buff){await this.whistle(e,m);continue;}
   const o=typeof m==='number'?{m}:m,pool=[G.p,...G.comps.filter(c=>c.s.hp>0)],tg=o.p?G.p:pool[Math.floor(Math.random()*pool.length)];   // wróg bije gracza albo kompana
   await this.strike(e,tg,o.m*(e.haste?1.4:1),.9,false,e.name,{rng:o.rng,pois:o.pois,say:o.say,sand:o.sand,stone:o.stone,freeze:o.freeze,magic:o.magic,burn:o.burn});}
  e.turn++;},
 async initiative(){for(const e of [...G.enemies]){if(!e.haste||e.s.hp<=0||Player.d.hp<=0)continue;
   UI.log(`${e.name} (szybkość) atakuje jako pierwszy!`,'bad');G.text(e,'PIERWSZY!','#ffd24a');await this.enemyAct(e);e.acted=1;}},
 /* co rundę: trucizna i podpalenie odbierają HP (ikona z liczbą tur nad paskiem życia) */
 async tick(){for(const a of [G.p,...G.comps,...G.enemies]){
   if(a.sand){if(--a.sand.t<=0)a.sand=null;}
   for(const n of['poison','burn']){const q=a[n];if(!q||a.s.hp<=0)continue;
   a.s.hp=Math.max(0,a.s.hp-q.d);a.flash=.6;G.text(a,'-'+q.d,n==='burn'?'#ff9a40':'#7aff6a');UI.log(`${a.name} cierpi od ${n==='burn'?'ognia':'trucizny'} (-${q.d}).`,'bad');
   if(--q.t<=0)a[n]=null;if(G.dev&&a===G.p)a.s.hp=a.s.maxhp;UI.hud();await sleep(350);if(a.s.hp<=0){await this.kill(a);break;}}}},
 async thaw(a){const st=a.freeze.stone;UI.log(`${a.name} jest ${st?'skamieniały':'zamrożony'} i traci turę!`,'bad');G.text(a,st?'KAMIEŃ':'ZAMROŻONY',st?'#b8bcc8':'#8ae0ff');if(--a.freeze.t<=0)a.freeze=null;await sleep(500);},
 /* v1.1 (tryb deweloperski): pomija bieżącą falę – wrogowie znikają, fala liczy się jako wygrana (nagrody, sklepy i fabuła działają normalnie) */
 async skipWave(){if(!G.dev||this.busy||G.state!=='fight')return;this.busy=true;UI.lock(true);
  UI.log('[DEV] Fala pominięta.','crit');G.enemies.forEach(e=>G.burst(e.x,e.y-30,'#f2c14e',14));
  G.actors=G.actors.filter(a=>!G.enemies.includes(a));G.enemies=[];this.busy=false;return G.win();},
 /* v1.2.2: PROMIENIOWANIE (elektrownia) – co rundę bohater traci 3% maks. HP, a jego ATK i DEF spadają o kolejne 6% (do −42%); po fali wracają do normy */
 async radiate(){G.radStack=Math.min(7,(G.radStack||0)+1);const d=Player.d,dmg=Math.max(2,Math.round(d.maxhp*.03));d.hp=Math.max(0,d.hp-dmg);
  G.text(G.p,'☢ -'+dmg,'#7aff6a');G.p.flash=.6;UI.log(`Promieniowanie rani bohatera (-${dmg} HP, statystyki -${G.radStack*6}%).`,'bad');UI.hud();
  if(d.hp<=0)await this.kill(G.p);},
 /* v1.2.0: PIORUN – zabiera 50% maks. życia celu; bez uników, pancerza i krytyków */
 async thunderHit(t){if(t.phantom){await this.dispel(t);return;}const fin=t.key==='coach',frac=fin?.2:.5,dmg=Math.max(1,Math.round(t.s.maxhp*frac));t.s.hp=Math.max(0,t.s.hp-dmg);   // v1.3.0: finałowy boss dostaje tylko 20%
  G.shake=18;G.flash=1;G.text(t,'-'+dmg,'#fff27a',1);t.flash=1;G.burst(t.x,t.y-30,'#fff27a',26);
  UI.log(`Piorun razi ${t.name} i zadaje ${dmg} obrażeń (${fin?20:50}% życia).`,'crit');UI.hud();
  if(t.s.hp<=0)await this.kill(t);},
 /* v1.2.0: TOTEM NIEŚMIERTELNOŚCI – zamiast śmierci bohater odradza się z 50% HP (totem się zużywa) */
 async totem(){const d=Player.d,p=G.p;d.sk.totem--;d.hp=Math.max(1,Math.ceil(d.maxhp*.5));p.poison=p.burn=p.freeze=p.sand=null;p.pose='';p.anim='';p.alpha=1;p.rot=0;
  UI.log('TOTEM NIEŚMIERTELNOŚCI! Bohater powstaje z martwych z 50% HP.','crit');G.text(p,'TOTEM!','#ffd24a',1);G.totemFx(p);UI.hud();await sleep(1100);},
 async act(kind){
  if(kind==='skipwave')return this.skipWave();
  if(kind==='toboss')return G.jumpToBoss();   // v1.1.1 (dev)
  if(this.busy||G.state!=='fight')return;
  const p=G.p,t=G.target(),sk=Player.d.sk||{};if(!t)return;
  if(!p.freeze){if(kind==='potion'&&Player.d.potions<1){UI.log('Brak eliksirów!');return;}if(kind==='shoot'&&!(sk.bow||sk.xbow))return;if(kind==='fire'&&(!sk.fire||this.fbCd>0))return;if(kind==='thunder'&&(!sk.thunder||G.thunderUsed()))return;}
  this.busy=true;UI.lock(true);this.guard=false;
  if(G.enemies.some(e=>e.haste&&e.s.hp>0)){await this.initiative();if(Player.d.hp<=0){this.busy=false;return G.lose();}}   // v1.0: szybcy atakują pierwsi
  if(p.freeze)await this.thaw(p);
  else{
   if(kind==='attack'){
     await this.strike(p,t,1,.95,false,'Bohater');
     /* Podwójne uderzenie: 25% szans na drugi cios */
     if(sk.double&&t.s.hp>0&&Math.random()<.25){
       UI.log('Podwójne uderzenie!','crit');
       await this.strike(p,t,1,.9,false,'Bohater (2. cios)');
     }
   }
   if(kind==='crit'){
     await this.strike(p,t,2,.65,true,'Bohater (cios krytyczny)');
     if(sk.double&&t.s.hp>0&&Math.random()<.25){
       UI.log('Podwójne uderzenie!','crit');
       await this.strike(p,t,1,.9,false,'Bohater (2. cios)');
     }
   }
   if(kind==='fire'){this.fbCd=FIRE.cd;   // v1.1: odnowa 5 tur (FIRE w player.js)
    const foes=[...G.enemies].filter(e=>e.s.hp>0&&!G.invuln(e)).sort((a,b)=>a.x-b.x);   // od najbliższego bohatera
    if(foes.length){UI.log('Bohater rzuca KULĘ OGNIA – jedna kula przeleci przez wszystkich wrogów!','crit');
     /* jedna kula; pierwszy wróg dostaje 100% mocy, każdy następny 50% poprzedniego (1, .5, .25, ...). Moc = Player.fireDmg() (bez ATK) */
     await G.fireThrough(p,foes,(foe,i)=>this.strike(p,foe,Math.pow(.5,i),.95,false,i?'Kula ognia':'Bohater (KULA OGNIA)',{rng:'fire',magic:1,fire:1,nocrit:1,burn:1,pass:1,flat:Player.fireDmg()}));}
   }
   if(kind==='thunder'){G.markThunder();UI.log('Nad areną gromadzi się czarna chmura…','crit');   // v1.2.0: raz na etap
    await G.thunderStrike(t,()=>this.thunderHit(t));}
   if(kind==='shoot')await this.strike(p,t,sk.xbow?1.6:1.1,.85,false,sk.xbow?'Bohater (kusza)':'Bohater (łuk)',{rng:'arrow'});
   if(kind==='defend'){this.guard=true;UI.log('Bohater przyjmuje postawę obronną.');G.burst(p.x,p.y-30,'#4aa3ff',12);await sleep(400);}
   if(kind==='potion'){const d=Player.d,h=Math.min(Player.potionHeal(),d.maxhp-d.hp);d.potions--;d.hp+=h;G.text(p,'+'+h,'#7aff9a');
    if(p.poison||p.burn){p.poison=p.burn=null;UI.log('Eliksir gasi ogień i neutralizuje truciznę.','good');}
    if(G.event==='radiation'&&G.radStack>0){G.radStack=Math.max(0,G.radStack-3);UI.log('Eliksir łagodzi skutki promieniowania.','good');}   // v1.2.2
    G.burst(p.x,p.y-30,'#7aff9a',16);UI.log(`Eliksir leczy ${h} HP.`,'good');UI.hud();await sleep(500);}}
  if(kind!=='fire'&&this.fbCd>0)this.fbCd--;UI.hud();
  await this.rounds();},
 async rounds(){
  const end=()=>{this.busy=false;};
  if(!G.enemies.length){end();return G.win();}
  for(const c of [...G.comps]){if(!G.enemies.length)break;if(c.s.hp<=0)continue;   // kompani atakują automatycznie
   if(c.freeze){await this.thaw(c);continue;}
   {const tg=G.enemies.filter(e=>!G.invuln(e));if(!tg.length)break;   // v1.3.0: kompani nie biją nietykalnego bossa
   await this.strike(c,tg[Math.floor(Math.random()*tg.length)],1,.9,false,c.name,c.s.t==='archer'?{rng:'arrow'}:c.s.t==='bard'?{rng:'note',magic:1}:{});}}
  if(!G.enemies.length){end();return G.win();}
  for(const e of [...G.enemies]){if(e.s.hp<=0||Player.d.hp<=0)break;if(e.acted){e.acted=0;continue;}await this.enemyAct(e);}
  if(Player.d.hp>0)await this.tick();
  if(Player.d.hp>0&&G.event==='radiation'&&G.enemies.length)await this.radiate();   // v1.2.2
  if(Player.d.hp<=0){end();return G.lose();}
  if(!G.enemies.length){end();return G.win();}
  this.guard=false;end();UI.lock(false);}
};
