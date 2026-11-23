/* v1.3.0 – ZDARZENIA FABULARNE
   1) BARD W BAGNIE (Moczary, w połowie etapu): bard tonie w błocie. Gracz wybiera: POMÓC albo PRZEJŚĆ OBOK.
      • pomoc  -> animacja wyciągania z bagna, dialogi, zasadzka bagiennych stworów; bard walczy z nami (strzela nutami)
                  i po zwycięstwie zostaje w drużynie na stałe (dodatkowy kompan – nie liczy się do limitu 3),
      • przejście obok -> bard tonie (animacja + dialog), a w następnym etapie (Tajga) przeciwnicy są mocniejsi (BARD_CURSE).
   2) Nagroda za wygraną minigrę pong (stadion, fala 6). */
Object.assign(G, {
  /* czy po wygranej fali ma się pojawić bard (połowa etapu Moczary, jeszcze bez decyzji) */
  bardDue() {
    const d = Player.d;
    return this.mode === 'campaign' && CAMPAIGN[this.level].map === 'swamp' && !d.bard && this.wave === Math.floor(this.waves.length / 2) && !(this.cur() || {}).boss;
  },

  spawnBard() {
    const n = { npc: 1, kind: 'bard', key: 'comp_bard', name: 'Bard', title: 'Bard', x: 470, y: 252, ox: 0, oy: 0, scale: 2.6, depth: 30, flash: 0, alpha: 1, ph: 0, face: -1, s: { hp: 1, maxhp: 1 }, say: 'Pomocy!' };
    this.npcs = [n]; this.actors.push(n);
    UI.log('Z bagna dobiega wołanie o pomoc… ktoś tonie!', 'crit');
    this.text(n, 'POMOCY!', '#ffd24a', 1);
  },

  /* rozmowa + wybór. fromEdge = true, gdy gracz próbował minąć barda, idąc do krawędzi mapy */
  async bardEvent(fromEdge) {
    const n = this.npcs.find(x => x.kind === 'bard'); if (!n || this.state !== 'clear') return;
    const p = this.p; this.state = 'talk'; UI.lock(true);
    p.auto = 1; p.face = 1;
    await tween(p, { x: n.x - 100, y: Math.max(205, Math.min(262, n.y - 8)) }, 900, 'io'); p.auto = 0;
    await this.say(n, '„Ratunku! Tonę! Moja lutnia! Moje buty! Moja ballada o smoku, który bał się zimna!”');
    await this.say(p, '„Trzymaj się! Co ty robisz w środku bagna?!”');
    await this.say(n, '„Szukałem natchnienia… znalazłem błoto po szyję. Pomocy, proszę!”');
    this.state = 'choice';
    UI.screen('', 'Bard tonie w bagnie. Pomóc mu? (wyciągniesz go, ale z bagna wyjdą potwory – za to zyskasz towarzysza) Czy przejść obok? (w następnym etapie przeciwnicy będą mocniejsi)',
      [{ l: '🤝 Pomóż bardowi', f: () => this.bardHelp(n) }, { l: '🚶 Przejdź obok', f: () => this.bardLeave(n, fromEdge) }], 'choice');
  },

  hideScreen() { const s = UI.$('screen'); s.classList.add('hidden'); s.innerHTML = ''; },

  async bardHelp(n) {
    this.hideScreen(); const d = Player.d, p = this.p; this.state = 'talk';
    /* wyciąganie z bagna */
    p.pose = 'attack'; this.text(p, 'Łap rękę!', '#f2c14e'); await sleep(500);
    for (let i = 0; i < 3; i++) { this.shake = 7; this.burst(n.x, n.y - 4, '#5a4a2a', 18); await sleep(230); }
    n.pulled = 1; await tween(n, { depth: 0 }, 1000, 'io');
    this.shake = 14; this.burst(n.x, n.y - 10, '#6a5a34', 34); this.burst(n.x, n.y - 30, '#8a7a4a', 14); p.pose = ''; n.helped = 1;
    await this.say(n, '„Phew! Uratowałeś mi życie… i lutnię! Dziękuję, nieznajomy!”');
    await this.say(p, '„Nie ma za co. Ale chyba nie jesteśmy tu sami…”');
    /* zasadzka: stwory wynurzają się z błota */
    this.shake = 16; UI.log('Z bagna wyłaniają się potwory!', 'bad');
    const pool = ['drowned', 'mosquitos', 'blackcat', 'mutmosq'], kinds = ['drowned', pool[1 + Math.floor(Math.random() * 3)], pool[Math.floor(Math.random() * 3)]];
    const foes = kinds.map((t, i) => { const e = makeEnemy(t, this.diff(), i); e.x = 440 + i * 68; e.y = 208 + i * 10; e.alpha = 0; e.oy = 36; return e; });
    this.enemies = foes; foes.forEach(e => { this.actors.push(e); this.burst(e.x, e.y, '#5a6a2a', 16); tween(e, { alpha: 1, oy: 0 }, 750, 'out'); });
    await sleep(800);
    /* bard dołącza do drużyny */
    Player.addComp(d, 'bard'); d.bard = 'saved';
    this.syncComps();
    const ba = this.comps.find(c => c.s.t === 'bard');
    if (ba) { const tg = this.compPos(this.comps.indexOf(ba), p.x, p.y); ba.x = n.x; ba.y = n.y; ba.face = -1; ba.walk = 1; await tween(ba, tg, 800, 'io'); ba.walk = 0; ba.face = 1; }
    n.kind = 'pool';                                                   // zostaje tylko kałuża błota
    if (ba) await this.say(ba, '„Cicho… to one mnie tu wciągnęły! Pomogę wam, jak potrafię – nutami!”');
    this.ambush = 1; this.xpWave = 0; this.state = 'fight'; Combat.busy = false; Combat.guard = false; Combat.refreshHaste(true);
    UI.log('Bard dołączył do drużyny! Pokonajcie razem bagienne stwory.', 'crit'); UI.hud(); UI.lock(false);
  },

  async bardLeave(n, fromEdge) {
    this.hideScreen(); const d = Player.d, p = this.p; this.state = 'talk';
    await this.say(p, '„Przepraszam… nie mam czasu. Muszę ratować księżniczkę.”');
    await this.say(n, '„Rozumiem… Napiszę o tym… balladę… o bohaterze, który… blub… blub…”');
    n.sinking = 1;
    const sk = tween(n, { depth: 100 }, 2600, 'io');
    for (let i = 0; i < 7; i++) { this.burst(n.x + (Math.random() - .5) * 40, n.y - 4, '#8a7a4a', 6); await sleep(330); }
    await sk;
    d.bard = 'left'; n.kind = 'pool';
    UI.log('Zostawiłeś barda w bagnie… Mówią, że w Tajdze wrogowie będą silniejsi (+30% HP, +25% ATK).', 'bad');
    this.state = 'clear';
    if (fromEdge) this.advance();
  },

  /* po wygranej zasadzce: wdzięczność barda */
  async bardThanks() {
    const ba = this.comps.find(c => c.s.t === 'bard' && c.s.hp > 0);
    if (ba) { await this.say(ba, '„Przysięgam, że nigdy nie śpiewałem piękniej, niż wrzeszcząc w tym błocie! Zostaję z wami – ballada dopiero się zaczyna!”'); UI.log('Bard na stałe dołączył do drużyny (strzela nutami).', 'good'); }
    else UI.log('Bard nie przeżył bagiennej zasadzki…', 'bad');
  },

  /* ---------- rysowanie barda tonącego w bagnie (kałuża, fale, bąble, machające ręce, unosząca się czapka i lutnia) ---------- */
  drawBard(a) {
    const c = this.c, x = a.x + a.ox, y = a.y + a.oy, t = this.t;
    c.globalAlpha = 1;
    c.fillStyle = '#241c12'; c.beginPath(); c.ellipse(x, y + 1, 68, 14, 0, 0, 7); c.fill();
    c.fillStyle = '#4a3c22'; c.beginPath(); c.ellipse(x, y - 1, 60, 11, 0, 0, 7); c.fill();
    c.fillStyle = '#5e4e2c'; c.beginPath(); c.ellipse(x - 8, y - 3, 40, 6, 0, 0, 7); c.fill();
    c.fillStyle = '#6e7a3a'; for (let i = 0; i < 5; i++) { c.fillRect(x - 46 + i * 21 + Math.sin(t / 700 + i) * 3, y - 4 + (i % 2) * 5, 9, 2); }
    for (let i = 0; i < 3; i++) { const ph = ((t / 1000) + i / 3) % 1; c.globalAlpha = (1 - ph) * .45; c.strokeStyle = '#9a8a54'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 12 + ph * 50, 3 + ph * 9, 0, 0, 7); c.stroke(); }
    c.globalAlpha = 1;
    if (a.kind === 'pool') { if (Math.random() < .03) this.fx.push({ x: x + (Math.random() - .5) * 70, y, vx: 0, vy: -.5, g: -.02, dl: .03, life: .8, c: '#8a7a4a', sz: 3, pt: 1 }); return; }
    const d = a.depth;
    if (d < 96) {
      const sc = a.scale, top = y + d - ASSETS.comp_bard.fh * sc;
      c.save(); c.beginPath(); c.rect(x - 90, y - 280, 180, 280 + 5); c.clip();                          // widać tylko to, co nad powierzchnią błota
      Assets.draw(c, 'comp_bard', x, y + d + Math.sin(t / 260) * (a.helped ? 0 : 2), sc, t, 1, a.helped ? 'idle' : 'hurt', 0, 1);
      if (!a.helped) {                                                                                  // ręce machają o pomoc
        const sy = top + ASSETS.comp_bard.fh * sc * .46;
        for (const s of [-1, 1]) {
          const w = Math.sin(t / 130 + (s > 0 ? 0 : 1.7)), ex = x + s * (22 + 10 + w * 8), ey = sy - 30 - Math.cos(t / 130 + (s > 0 ? 0 : 1.7)) * 8;
          c.strokeStyle = '#2a6a5c'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + s * 12, sy); c.lineTo(ex, ey); c.stroke();
          c.fillStyle = '#f0c8a0'; c.beginPath(); c.arc(ex, ey - 2, 5, 0, 7); c.fill(); c.lineCap = 'butt';
        }
      }
      c.restore();
    }
    if (!a.helped) {
      c.fillStyle = '#7a4a22'; c.beginPath(); c.ellipse(x + 56, y - 2 + Math.sin(t / 400) * 1.5, 13, 5, -.25, 0, 7); c.fill();           // unosząca się lutnia
      c.fillStyle = '#c88a4a'; c.fillRect(x + 62, y - 6, 18, 3); c.fillStyle = '#2a140c'; c.beginPath(); c.arc(x + 54, y - 3, 3, 0, 7); c.fill();
      if (d > 50) { c.fillStyle = '#c83a52'; c.beginPath(); c.ellipse(x - 6 + Math.sin(t / 500) * 2, y - 2, 13, 4, 0, 0, 7); c.fill(); c.fillRect(x - 12, y - 9, 12, 7); c.fillStyle = '#f4f4f0'; c.fillRect(x - 2, y - 15, 3, 8); }   // czapka z piórem
    }
    if (Math.random() < (a.sinking ? .08 : .05)) this.fx.push({ x: x + (Math.random() - .5) * 50, y, vx: 0, vy: -.6, g: -.02, dl: .03, life: .8, c: '#a89a5c', sz: 3, pt: 1 });
  },

  /* v1.3.2: po minigrze bohater od razu wraca do normalnego wzrostu i na miejsce startowe (wcześniej zostawał pomniejszony / w pozycji minigry) */
  restoreHero() { const p = this.p; if (!p) return; p.scale = 3; p.nobar = 0; p.x = 110; p.y = 215; p.ox = p.oy = 0; p.pose = ''; p.walk = 0; p.face = 1; p.alpha = 1; p.anim = ''; },

  /* ---------- v1.3.1: wspólne zakończenie minigier (lawowa zagadka, labirynt): nagroda i przejście do następnej fali ---------- */
  async miniWin(title, pts, extra) {
    this.restoreHero();
    const d = Player.d, heal = Math.round(d.maxhp * .3);
    d.hp = Math.min(d.maxhp, d.hp + heal); Player.addPts(pts);
    (d.comps || []).forEach(c => c.hp = Math.min(c.maxhp, c.hp + Math.round(c.maxhp * .3)));
    UI.log(title, 'good'); if (extra) UI.log(extra, 'good');
    UI.log(`Fala pokonana! +0 XP, +${heal} HP, +${pts} pkt umiejętności`, 'good'); UI.hud(); Prog.scan();
    this.state = 'clear'; await sleep(500);
    await this.advance(true);
  },

  /* ---------- nagroda za wygraną minigrę pong ---------- */
  async pongWin(me, ai) {
    this.restoreHero();
    const d = Player.d, heal = Math.round(d.maxhp * .3);
    d.hp = Math.min(d.maxhp, d.hp + heal); Player.addPts(2); d.potions++;
    (d.comps || []).forEach(c => c.hp = Math.min(c.maxhp, c.hp + Math.round(c.maxhp * .3)));
    UI.log(`Mecz wygrany ${me}:${ai}! +${heal} HP, +1 eliksir, +2 pkt umiejętności`, 'good'); UI.hud(); Prog.scan();
    this.state = 'clear'; await sleep(400);
    await this.advance(true);
  }
});
