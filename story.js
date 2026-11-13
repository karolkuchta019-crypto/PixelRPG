/* Cutscenki: silnik (Cut) + scenariusze (Story). Klik / spacja = dalej, przycisk "Pomiń" = skip. */
const Cut={bg:'castle',acts:[],box:null,waiter:null,skip:false,carry:null,shake:0,shot:null,hx:552,hy:210,door:0,heart:0,fadeA:0,flash:0,title:null,sub:null,
 async play(bg,fn){G.state='cutscene';Music.play(bg);Object.assign(this,{bg,acts:[],box:null,waiter:null,skip:false,door:0,heart:0,fadeA:0,flash:0,title:null,sub:null});
  UI.$('screen').classList.add('hidden');UI.$('skip').classList.remove('hidden');await fn(this);UI.$('skip').classList.add('hidden');},
 actor(key,x,y,o){const a=Object.assign({key,x,y,ox:0,oy:0,alpha:1,flash:0,scale:3,face:1,ph:Math.random()*6,s:{hp:1,maxhp:1},nobar:1},o);this.acts.push(a);return a;},
 wait(ms){return this.skip?Promise.resolve():sleep(ms);},
 to(o,p,ms,ez){if(this.skip){Object.assign(o,p);return Promise.resolve();}return tween(o,p,ms,ez);},
 shoot(x0,y0,x1,y1,ms){this.shot={x0,y0,x1,y1,u:0};return this.to(this.shot,{u:1},ms).then(()=>{this.shot=null;});},
 fade(v,ms){return this.to(this,{fadeA:v},ms);},
 async blink(){this.flash=1;await this.to(this,{flash:0},600);},
 async walk(a,x,y,ms){a.walk=1;await this.to(a,{x,y},ms);a.walk=0;},
 say(who,txt){this.box={who,txt};return new Promise(r=>{this.waiter=r;if(this.skip)this.next();});},
 next(){if(this.waiter){const r=this.waiter;this.waiter=null;this.box=null;r();}},
 doSkip(){this.skip=true;this.next();},
 draw(c){c.save();c.clearRect(0,0,640,320);if(this.shake>0){c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);this.shake*=.9;if(this.shake<.4)this.shake=0;}G.drawMap(c,this.bg,0);
  if(this.shot){const q=this.shot,x=q.x0+(q.x1-q.x0)*q.u,y=q.y0+(q.y1-q.y0)*q.u;c.fillStyle='#ffe070';for(let i=-1;i<=1;i++)c.fillRect(x-6*Math.abs(i),y+i*6*q.u,5,4);}   // śrut
  if(this.heart>0){const H=['.##.##.','#######','#######','.#####.','..###..','...#...'],s=14*this.heart*(1+.08*Math.sin(G.t/200)),x0=this.hx-3.5*s,y0=this.hy-3*s;   // rysowane PRZED drzwiami = wychodzi zza nich
   H.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='#'){c.fillStyle=(i===1&&j===1)?'#ff9aa8':'#e0304a';c.fillRect(x0+i*s,y0+j*s,s+.5,s+.5);}}));}
  if(this.door>0){const w=40*this.door;for(const[x0,x1]of[[512,512+w],[592-w,592]]){c.fillStyle='#5a3a1a';c.fillRect(x0,128,x1-x0,104);c.fillStyle='#8a5a2a';for(let y=136;y<232;y+=12)c.fillRect(x0,y,x1-x0,2);c.fillStyle='#2a2a30';c.fillRect(x0,150,x1-x0,6);c.fillRect(x0,206,x1-x0,6);}}
  if(this.carry){const[p,v]=this.carry;p.x=v.x;p.y=v.y-92;p.sortY=v.y+1;p.face=v.face;p.rot=(v.face>0?-1:1)*(1.45+.1*Math.sin(G.t/70));}   // zarzucona na ramię, wierzga
  [...this.acts].sort((a,b)=>(a.sortY||a.y)-(b.sortY||b.y)).forEach(a=>G.drawActor(a));
  if(this.box){const b=this.box;c.fillStyle='#000';c.fillRect(20,240,600,72);c.fillStyle='#2a2140';c.fillRect(24,244,592,64);c.strokeStyle='#f2c14e';c.lineWidth=2;c.strokeRect(26,246,588,60);
   c.textAlign='left';c.font='bold 13px "Courier New"';c.fillStyle='#f2c14e';c.fillText(trn(b.who),36,263);c.font='13px "Courier New"';c.fillStyle='#f3e9d2';
   let line='',y=280;for(const w of trn(b.txt).split(' ')){if(c.measureText(line+w).width>560){c.fillText(line,36,y);y+=16;line='';}line+=w+' ';}c.fillText(line,36,y);
   c.fillStyle='#f2c14e';c.textAlign='right';c.fillText('▼',608,302);}
  if(this.flash>0){c.fillStyle=`rgba(255,255,255,${this.flash})`;c.fillRect(0,0,640,320);}
  if(this.fadeA>0){c.fillStyle=`rgba(0,0,0,${this.fadeA})`;c.fillRect(0,0,640,320);}
  if(this.title){const ti=trn(this.title),su=trn(this.sub);c.textAlign='center';c.font=`bold ${this.heart?44:22}px "Courier New"`;const y=this.heart?250:150;c.fillStyle='#000';c.fillText(ti,322,y+2);c.fillStyle='#f2c14e';c.fillText(ti,320,y);
   if(this.sub){c.font='14px "Courier New"';c.fillStyle='#f3e9d2';c.fillText(su,320,y+34);}}
  c.restore();}
};
const Story={
 /* bohater w cutscence: aktualna zbroja + flag hero (miecz/tarcza z ekwipunku) */
 _hero(c,x,y,o={}){
  const key=(typeof Player!=='undefined'&&Player.spriteKey)?Player.spriteKey():'player';
  return c.actor(key,x,y,Object.assign({hero:1},o));
 },

 /* PROLOG: bardziej dynamiczne porwanie */
 async intro(){await Cut.play('castle',async c=>{
  const h=this._hero(c,80,205),p=c.actor('princess',360,210,{face:-1}),v=c.actor('coach',760,205,{face:-1,scale:2.6});
  c.fadeA=1;await c.fade(0,700);
  /* spokojny spacer po dziedzińcu */
  await Promise.all([c.walk(h,160,205,1200),c.walk(p,320,210,1000)]);
  await c.say('Księżniczka','Zachód słońca nad zamkiem... Dziękuję, że czuwasz, rycerzu.');
  await c.say('Bohater','To mój obowiązek, Wasza Wysokość. Dopóki tu stoję, nic wam nie grozi.');
  /* trzęsienie / wejście trenera */
  c.shake=10;await c.wait(400);
  v.anim='run';await c.walk(v,500,205,900);v.anim='';v.walk=0;
  await c.say('Mroczny Trener','Spokój? Nie znoszę spokoju. Ustawiam ten zamek... na własny wynik!');
  h.face=1;await c.walk(h,220,205,500);
  await c.say('Bohater','Stój! Kim jesteś?!');
  await c.say('Mroczny Trener','Byłem wielkim selekcjonerem. Odebrali mi drużynę, więc zbiorę nową. Księżniczka będzie moim kapitanem!');
  v.anim='jump';await c.walk(v,400,208,600);v.anim='';
  await c.say('Księżniczka','Puść mnie! Rycerzu, pomocy!');
  c.carry=[p,v];c.blink();c.shake=8;
  h.pose='attack';await c.walk(h,300,205,500);h.pose='';
  await c.say('Mroczny Trener','Za wolno, rycerzu! Mecz rozstrzyga się w pierwszej minucie.');
  await c.wait(500);v.face=1;v.anim='run';
  await Promise.all([c.walk(v,820,205,2200),c.walk(h,480,205,1600)]);
  v.anim='';h.walk=0;
  await c.say('Bohater','Księżniczko! Dorwę go, choćby na końcu świata!');
  await c.fade(1,700);});},

 /* ZAKOŃCZENIE DOBRE – bohater w pełnym ekwipunku */
 async good(){await Cut.play('castle',async c=>{
  const h=this._hero(c,90,205),p=c.actor('princess',50,215);
  c.fadeA=1;await c.fade(0,900);
  await c.say('Bohater','Mroczny Trener pokonany. Już po wszystkim, Wasza Wysokość.');
  await c.say('Księżniczka','Wiedziałam, że po mnie przyjdziesz. Wracajmy do domu.');
  await Promise.all([c.walk(h,525,205,2800),c.walk(p,490,215,2800)]);
  await Promise.all([c.to(h,{alpha:0},500),c.to(p,{alpha:0},500)]);
  await c.wait(400);await c.to(c,{door:1},1000);
  await c.wait(700);c.heart=.5;await c.to(c,{heart:1,hy:70},2200);
  c.title='THE END';await c.wait(2600);});
  UI.credits();},

 /* ZAKOŃCZENIE ZŁE – bohater w ekwipunku, leży pokonany */
 async bad(){await Cut.play('stadium',async c=>{
  const h=this._hero(c,200,205,{alpha:.7}),v=c.actor('coach',370,205,{face:-1,scale:2.6}),p=c.actor('princess',500,215,{face:-1});
  h.s.hp=0;
  c.fadeA=1;await c.fade(0,700);await c.wait(900);
  await c.say('Mroczny Trener','Koniec meczu, rycerzu. Nie dotrwałeś nawet do dogrywki.');
  await c.say('Księżniczka','Nie... proszę, nie rób tego!');
  await c.say('Mroczny Trener','Nikt już nie zagra w tej drużynie. Gwizdek kończący.');
  v.face=1;await c.wait(500);
  v.pose='attack';await c.wait(700);
  c.flash=.9;c.to(c,{flash:0},500);c.shake=16;await c.shoot(v.x+75,v.y-62,p.x,p.y-60,220);
  p.flash=1;p.s.hp=0;c.shake=10;await c.to(p,{rot:1.35,ox:36},520,'in');
  v.pose='';await c.wait(1500);
  await c.fade(1,900);c.title='Księżniczka nie przeżyła...';c.sub='Zamek już nigdy nie usłyszał jej śmiechu.';await c.wait(3000);});}
};
