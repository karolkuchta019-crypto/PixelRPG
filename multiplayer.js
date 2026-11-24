/* ============================================================
   MULTIPLAYER.JS – v1.4.0: LOKALNY MULTIPLAYER (osobna kampania dla 2–3 graczy przy jednym komputerze)
   Zasady:
   • każdy gracz ma własnego bohatera (osobne HP, ekwipunek, umiejętności, punkty, eliksiry); kompanów w tym trybie nie ma,
   • gracze grają po kolei: tura gracza -> po jej wykonaniu WSZYSCY wrogowie atakują właśnie tego gracza -> tura następnego,
   • im więcej graczy, tym więcej przeciwników w fali (a boss ma więcej HP); plansza jest pomniejszona (postacie mniejsze, wrogowie w siatce),
   • XP dostają wszyscy żywi gracze; po fali poległy gracz wraca z 25% HP; po etapie wszyscy wracają z pełnym HP,
   • sklepy otwierają się po kolei dla każdego gracza; minigry etapów są w tym trybie pomijane,
   • zapisy w slotach i osiągnięcia są w tym trybie wyłączone.
   Technicznie: G.mp = { n, cur, players:[Player.d...] }; Player.d i G.p zawsze wskazują gracza, który ma teraz turę.
   ============================================================ */
const MP_SLOTS = { 2: [[104, 218], [140, 266]], 3: [[92, 204], [138, 242], [92, 282]] };
const MP_FOLLOW = [[-48, 28], [-48, -26]];
const MP_COL = ['#4aa3ff', '#ff6a5a', '#7aff9a'];

Object.assign(G, {
  /* lista aktorów-bohaterów (w singlu – tylko G.p) */
  hl() { return this.heroes && this.heroes.length ? this.heroes : [this.p]; },
  isHero(a) { return !!a && (a === this.p || (!!this.heroes && this.heroes.includes(a))); },
  mpScale() { return !this.mp ? 1 : this.mp.n === 2 ? .86 : .72; },
  maxFoes() { return !this.mp ? 4 : this.mp.n === 2 ? 6 : 8; },
  heroSlot(i) { const L = MP_SLOTS[this.mp.n] || MP_SLOTS[2]; return L[i] || L[0]; },
  mpFollow(k, bx, by) { const o = MP_FOLLOW[k] || MP_FOLLOW[0]; return { x: bx + o[0], y: Math.max(180, Math.min(290, by + o[1])) }; },

  /* ---------- start ---------- */
  startMP(n, lan) {
    ModAPI.exit(); this.netClient = false;
    const sc = UI.$('screen'); sc.classList.add('hidden'); sc.innerHTML = ''; UI.menuOpen = false;
    this.nextBub(); this.hub = null; this.hubReturn = null; Combat.busy = false; Combat.guard = false; Combat.fbCd = 0;
    this.mode = 'campaign'; this.nextHardcore = false;
    const players = Array.from({ length: n }, () => { const d = Player.base(); d.gear = { sword: null, armor: null, shield: null }; d.mp = 1; d._fb = 0; return d; });
    this.mp = { n, cur: 0, players, remote: players.map((_, i) => !!(lan && lan.remote[i])), names: lan ? lan.names : null, lan: !!lan, me: 0 };
    this.heroes = null; this.p = null; this.comps = []; this.npcs = []; this.enemies = []; this.actors = [];
    Player.d = players[0];
    this.level = 0; this.waves = buildWaves(0); this.wave = this.stageStart(); this.snap = null;
    UI.$('log').innerHTML = '';
    UI.log(`Multiplayer: ${n} graczy. Każdy gracz ma swoją turę, po której atakują go wrogowie.`, 'crit');
    this.loadWave();
    this.banner = { txt: CAMPAIGN[0].name, t: 0 };
  },

  /* tworzy aktorów bohaterów wszystkich graczy (wołane z loadWave na początku fali) */
  mpHeroes() {
    const mp = this.mp, mps = this.mpScale();
    mp.players.forEach(d => { d.gear = d.gear || { sword: null, armor: null, shield: null }; d.sk = d.sk || {}; d.comps = d.comps || []; });
    this.heroes = mp.players.map((d, i) => {
      const s = this.heroSlot(i);
      return { key: Player.spriteKey(d), name: 'Gracz ' + (i + 1), pi: i, hero: 1, x: s[0], y: s[1], ox: 0, oy: 0, alpha: d.hp > 0 ? 1 : .4, flash: 0, scale: 3 * mps, face: 1, ph: i, s: d, vy: 0, jumping: 0 };
    });
    this.p = this.heroes[mp.cur];
    Player.d = mp.players[mp.cur];
    Combat.fbCd = Player.d._fb || 0;
  },

  /* ustawia bohaterów na stanowiskach bojowych (początek każdej fali) */
  mpPlace() {
    (this.heroes || []).forEach((h, i) => { const s = this.heroSlot(i); h.x = s[0]; h.y = s[1]; h.ox = h.oy = 0; h.walk = 0; h.face = 1; h.dest = null; h.pose = ''; h.scale = 3 * this.mpScale(); h.key = Player.spriteKey(h.s); h.alpha = h.s.hp > 0 ? 1 : .4; });
  },

  /* skład wrogów: im więcej graczy, tym więcej przeciwników (boss – sam, ale z większym HP – patrz mpLayout) */
  mpList(w) {
    const e = w.e.slice();
    if (w.boss || !e.length) return e;
    const n = this.mp.n, pool = e.filter(t => !(ENEMY_DEFS[t] && ENEMY_DEFS[t].support));
    const target = Math.min(this.maxFoes(), Math.round(e.length * (1 + .6 * (n - 1))));
    while (e.length < target && pool.length) e.push(pool[Math.floor(Math.random() * pool.length)]);
    return e;
  },

  /* rozmieszczenie wrogów w siatce (do 3 w kolumnie), skala i HP bossa */
  mpLayout(w) {
    if (w && w.boss && this.enemies[0]) { const b = this.enemies[0], k = this.mp.n === 2 ? 1.8 : 2.6; b.s.hp = b.s.maxhp = Math.round(b.s.maxhp * k); }
    this.layoutFoes();
  },
  layoutFoes() {
    if (!this.mp) return;
    const E = this.enemies, k = E.length, mps = this.mpScale(), cols = Math.ceil(k / 3), step = this.mp.n === 2 ? 86 : 76;
    E.forEach((e, i) => {
      const c = Math.floor(i / 3), r = i % 3, rows = Math.min(3, k - c * 3);
      e.x = 585 - (cols - 1 - c) * step;
      e.y = rows === 3 ? [205, 243, 281][r] : rows === 2 ? [224, 266][r] : 246;
      e.scale = (ENEMY_DEFS[e.key] ? ENEMY_DEFS[e.key].scale : e.scale) * mps;
    });
  },

  /* ---------- tury ---------- */
  mpSwitch(i) {
    const mp = this.mp;
    Player.d._fb = Combat.fbCd;
    mp.cur = i; this.p = this.heroes[i]; Player.d = mp.players[i];
    Combat.fbCd = Player.d._fb || 0;
    this.sel = null; UI.hud();
  },

  /* następny ŻYWY gracz po aktualnym */
  async mpNext() {
    const mp = this.mp; let j = mp.cur;
    for (let k = 1; k <= mp.n; k++) { const i = (mp.cur + k) % mp.n; if (mp.players[i].hp > 0 && !mp.players[i].gone) { j = i; break; } }
    this.mpSwitch(j);
    UI.log(`--- Tura: Gracz ${j + 1} ---`, 'crit');
    this.text(this.p, `TURA GRACZA ${j + 1}`, MP_COL[j], true);
    await sleep(400);
  },

  /* aktualny gracz padł. Zwraca true, jeśli wszyscy gracze polegli (koniec gry) */
  async mpDown() {
    const mp = this.mp;
    UI.log(`Gracz ${mp.cur + 1} poległ!`, 'bad');
    Player.d.deaths = (Player.d.deaths || 0) + 1;
    if (mp.players.every(d => d.hp <= 0 || d.gone)) {
      this.state = 'over';
      UI.screen('GAME OVER', `Wszyscy gracze polegli na etapie ${this.level + 1}.`, mp.lan ? [{ l: 'Menu', f: () => UI.title() }] : [{ l: 'Zagraj ponownie', f: () => this.startMP(mp.n) }, { l: 'Menu', f: () => UI.title() }]);
      return true;
    }
    return false;
  },
  async heroDead() {
    if (!this.mp) return this.lose();
    if (await this.mpDown()) return;
    await this.mpNext();
    Combat.busy = false; UI.lock(false);
  },

  /* XP dla wszystkich żywych graczy (zabójstwo liczy się graczowi z turą) */
  xpAward(xp) {
    this.xpWave += xp; Player.d.kills = (Player.d.kills || 0) + 1;
    if (this.mp) {
      this.mp.players.forEach((d, i) => { if (d.hp > 0 && Player.gainXp(xp, d)) UI.log(`AWANS! Gracz ${i + 1} osiąga poziom ${d.level}! +1 punkt umiejętności`, 'crit'); });
    } else if (Player.gainXp(xp)) UI.log('AWANS na poziom ' + Player.d.level + '! +1 punkt umiejętności (do wydania u kupca)', 'crit');
    UI.hud();
  },

  /* ---------- koniec fali ---------- */
  async mpWin() {
    const mp = this.mp, boss = !!this.cur().boss, pts = boss ? 3 : 1;
    this.event = null; this.radStack = 0; this.state = 'won'; UI.lock(true);
    let rw = `Fala pokonana! +${this.xpWave} XP dla każdego gracza, +${pts} pkt umiejętności`;
    mp.players.forEach(d => {
      if (d.gone) return;
      if (d.hp <= 0) d.hp = Math.max(1, Math.round(d.maxhp * .25));
      else d.hp = Math.min(d.maxhp, d.hp + Math.round(d.maxhp * .3));
      d.pending += pts; d.earned = (d.earned || 0) + pts;
      if (this.wave % 2 === 0) d.potions++;
    });
    if (this.wave % 2 === 0) rw += ', +1 eliksir dla każdego';
    this.heroes.forEach(h => { h.poison = h.burn = h.freeze = h.sand = null; h.alpha = 1; h.pose = ''; });
    UI.log(rw, 'good'); UI.log('Poległym gracze wracają do walki (25% HP).', 'good'); UI.hud();
    if (boss) {
      const bk = this.cur().e[0];
      mp.players.forEach(d => { d.bd = d.bd || {}; d.bd[bk] = 1; if (bk === 'yeti') d.yetiDown = 1; });
      if (bk === 'spiderqueen') UI.log('Królowa Pająków pokonana! U zbrojmistrza czeka smoczy ekwipunek.', 'crit');
      if (bk === 'yeti') UI.log('Yeti pokonany! Kupiec ma nowe, potężne ulepszenia (Atak pioruna, Totem nieśmiertelności).', 'crit');
    }
    if (this.level >= CAMPAIGN.length - 1 && this.wave >= this.waves.length) {
      await sleep(900);
      this.state = 'over';
      return UI.screen('KAMPANIA UKOŃCZONA!', `Gracze (${mp.n}) pokonali wszystkich bossów. Gratulacje!`, [{ l: 'Menu', f: () => UI.title() }]);
    }
    await sleep(600); this.state = 'clear'; this.clearNpcs();
    if (mp.lan && mp.cur !== 0) this.mpSwitch(0);   // LAN: między falami gospodarz prowadzi drużynę (jego bohater jest sterowany klawiaturą)
    if (typeof Net !== 'undefined') Net.dirty = true;
  },

  /* po etapie wszyscy wracają z pełnym HP (w singlu tylko bohater) */
  stageHeal() {
    if (this.mp) { this.mp.players.forEach(d => { d.hp = d.maxhp; }); return; }
    Player.d.hp = Player.d.maxhp; this.snap = JSON.stringify(Player.d);
  },

  /* sklep otwiera się po kolei dla każdego gracza */
  async mpShop(kind) {
    const mp = this.mp, keep = mp.cur; this.state = 'shop';
    if (mp.lan) {   // LAN: wszyscy robią zakupy jednocześnie, każdy na swoim komputerze
      const jobs = [];
      mp.players.forEach((d, i) => {
        if (mp.remote[i]) jobs.push(Net.remoteShop(i, kind));
        else if (!d.gone) jobs.push(new Promise(res => { this.mpSwitch(i); if (kind === 'smith') UI.smith(res); else UI.shop(res); }));
      });
      await Promise.all(jobs);
    } else for (let i = 0; i < mp.n; i++) {
      this.mpSwitch(i);
      await new Promise(res => { if (kind === 'smith') UI.smith(res); else UI.shop(res); });
    }
    this.mpSwitch(keep); this.state = 'clear'; UI.hud(); if (typeof Net !== 'undefined') Net.dirty = true;
  },

  /* mały pasek HP wszystkich graczy w rogu areny */
  drawMpHud(c) {
    if (!this.mp) return;
    c.save(); c.textAlign = 'left'; c.font = 'bold 10px "Courier New"';
    const lab = i => ((this.mp.names && this.mp.names[i]) ? this.mp.names[i].slice(0, 7) : 'P' + (i + 1)) + (this.mp.lan && i === (this.mp.me || 0) ? '*' : '');
    this.mp.players.forEach((d, i) => {
      const y = 24 + i * 15, cur = i === this.mp.cur, w = 112;
      c.globalAlpha = .85; c.fillStyle = '#000'; c.fillRect(6, y, w + 4, 13);
      c.fillStyle = cur ? '#f2c14e' : '#444'; c.fillRect(7, y + 1, w + 2, 11);
      c.fillStyle = '#1a1426'; c.fillRect(8, y + 2, w, 9);
      c.fillStyle = d.hp > 0 ? MP_COL[i] : '#555'; c.fillRect(8, y + 2, Math.max(0, w * d.hp / d.maxhp), 9);
      c.globalAlpha = 1; c.fillStyle = '#000'; c.fillText(`${lab(i)} ${Math.max(0, d.hp)}/${d.maxhp}  LVL ${d.level}`, 13, y + 10);
      c.fillStyle = '#fff'; c.fillText(`${lab(i)} ${Math.max(0, d.hp)}/${d.maxhp}  LVL ${d.level}`, 12, y + 9);
    });
    c.restore();
  }
});

Object.assign(UI, {
  mpMenu() {
    this.screen('Lokalne multiplayer',
      'Kampania dla 2–3 graczy: przez sieć LAN (każdy steruje swoim bohaterem na swoim komputerze) albo naprzemiennie przy jednym komputerze. Każdy gracz ma własnego bohatera i swoją turę – po niej atakują go wszyscy wrogowie. ' +
      'Im więcej graczy, tym więcej przeciwników, a plansza jest pomniejszona. W tym trybie nie ma kompanów, minigier, zapisów ani osiągnięć.',
      [{ l: '🌐 LAN – każdy na swoim komputerze', f: () => this.lan() }, { l: '👥 Jeden komputer: 2 graczy', f: () => G.startMP(2) }, { l: '👥 Jeden komputer: 3 graczy', f: () => G.startMP(3) }, { l: 'Wstecz', f: () => this.title() }]);
  }
});
