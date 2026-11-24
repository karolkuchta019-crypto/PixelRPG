/* MUZYKA – domyślnie WYŁĄCZONA. Włączasz ją klawiszem M albo przyciskiem megafonu w prawym górnym rogu.
   Pod każdy świat podkładasz plik: assets/music/<klucz-mapy>.mp3  (np. forest.mp3, village.mp3, swamp.mp3, ice.mp3 ...).
   Klucz to nazwa mapy z MAPS (maps.js). Brak pliku = cisza (w dzienniku pojawi się informacja, którego pliku brakuje).
   Utwór zapętla się i płynnie przechodzi (crossfade) przy zmianie świata. Mapy-łączniki (pass, cavemouth, tunnel, hotshaft)
   nie mają własnej muzyki – gra dalej utwór poprzedniego świata. Cutscenki grają utwór swojej mapy (castle.mp3, stadium.mp3). */
const Music={on:false,id:null,cur:null,cache:{},warned:{},vol:.5,
 init(){this.btn=document.getElementById('music');
  if(this.btn)this.btn.onclick=()=>{this.toggle();this.btn.blur();};   // blur: spacja (skok) nie przełącza przycisku
  this.sync();},
 file(id){return `assets/music/${id}.mp3`;},
 get(id){let a=this.cache[id];if(a)return a;
  a=new Audio(this.file(id));a.loop=true;a.preload='auto';a.volume=0;
  a.addEventListener('error',()=>{a.bad=true;if(this.on&&this.id===id&&!this.warned[id]){this.warned[id]=1;UI.log(`Brak pliku muzyki: ${this.file(id)}`);}});
  return this.cache[id]=a;},
 fade(a,to,done){clearInterval(a._f);a._f=setInterval(()=>{const d=to-a.volume;
  if(Math.abs(d)<=.04){a.volume=to;clearInterval(a._f);if(done)done();}else a.volume=Math.max(0,Math.min(1,a.volume+Math.sign(d)*.04));},50);},
 /* ustaw utwór świata (null = cisza). Przy wyłączonej muzyce tylko zapamiętuje, co zagrać po włączeniu. */
 play(id){if(id&&MAPS[id]&&MAPS[id].mod)id=MAPS[id].music||null;   // v1.4.0: mapy z modów nie mają plików muzyki
  this.id=id||null;this.apply();},
 /* v1.3.2: informacja o bieżącym utworze (lewy górny róg) – włączana w Ustawieniach */
 showNow(){const el=document.getElementById('nowplaying');if(!el)return;
  if(!(G.opt&&G.opt.nowPlaying)){el.classList.add('hidden');return;}
  const cv=document.getElementById('cv');if(cv){el.style.left=(cv.offsetLeft+10)+'px';el.style.top=(cv.offsetTop+8)+'px';}
  const nm=this.id&&((MAPS[this.id]||{}).name||(this.id==='castle'?'Zamek':''));
  let t;if(!this.id)t=trn('♪ cisza – brak utworu dla tego miejsca');else if(!this.on)t=`♪ ${this.id}.mp3 (${trn('muzyka wyłączona – M')})`;
  else if(this.cur&&this.cur.bad)t=`♪ ${this.id}.mp3 (${trn('brak pliku')})`;else t=`♪ ${this.id}.mp3`+(nm?` · ${trn(nm)}`:'');
  el.textContent=t;el.classList.remove('hidden');},
 apply(){this.showNow();const want=this.on&&this.id?this.get(this.id):null;
  if(this.cur&&this.cur!==want){const o=this.cur;this.fade(o,0,()=>o.pause());}
  this.cur=want;
  if(want&&!want.bad){const p=want.play();if(p&&p.catch)p.catch(()=>{});this.fade(want,this.vol);}
  else if(want&&want.bad&&!this.warned[this.id]){this.warned[this.id]=1;UI.log(`Brak pliku muzyki: ${this.file(this.id)}`);}},
 toggle(){this.on=!this.on;this.apply();this.sync();UI.log('Muzyka: '+(this.on?'włączona':'wyłączona')+' (M)','crit');},
 sync(){if(!this.btn)return;this.btn.classList.toggle('off',!this.on);this.btn.setAttribute('aria-pressed',this.on);
  this.btn.title=trn(this.on?'Muzyka włączona – kliknij lub naciśnij M, aby wyłączyć':'Muzyka wyłączona – kliknij lub naciśnij M, aby włączyć');this.btn.setAttribute('aria-label',trn('Muzyka')+' (M)');}
};
