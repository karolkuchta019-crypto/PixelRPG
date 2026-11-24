/* ============================================================
   NET.JS – v1.4.0: MULTIPLAYER LAN (każdy gracz steruje swoją postacią na SWOIM komputerze)
   Architektura: jeden komputer (GOSPODARZ) uruchamia serwer LAN (lan/server-lan.js lub start-lan.bat) i liczy całą grę.
   Pozostali gracze otwierają http://<adres gospodarza>:3000 i dołączają kodem pokoju. Serwer tylko przekazuje wiadomości.
   • gospodarz -> gracze: ~25 razy/s migawka sceny (aktorzy, efekty, tura…), logi walki, otwarcie sklepu, ekrany końcowe,
   • gracz -> gospodarz: wybrane akcje (Atak, Eliksir…), wybrany cel, zakończone zakupy (stan jego bohatera).
   Tury, XP, sklepy i reszta zasad są takie same jak w multiplayerze na jednym komputerze (multiplayer.js).
   Między falami (klawisze ruchu, wejście do sklepu, przejście dalej) prowadzi gospodarz; sklepy otwierają się wszystkim naraz.
   ============================================================ */
const Net = {
  ws: null, role: null, me: 0, room: null, n: 2, names: [], lobbyInfo: null, idc: 0, tick: 0, timer: null,
  shopWait: {}, sent: false, shopping: false, lastLock: null, dirty: true, _raw: 0, rooms: [],

  url() { return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/lan'; },
  available() { return /^https?:$/.test(location.protocol) && !!location.host && typeof WebSocket !== 'undefined'; },

  connect() {
    return new Promise((res, rej) => {
      if (this.ws && this.ws.readyState === 1) return res();
      if (!this.available()) return rej(new Error('Tryb LAN wymaga uruchomienia gry przez serwer LAN (start-lan.bat / start-lan.sh) i otwarcia adresu http://…:3000 w przeglądarce.'));
      let ws; try { ws = new WebSocket(this.url()); } catch (e) { return rej(e); }
      this.ws = ws;
      ws.onopen = () => res();
      ws.onerror = () => rej(new Error('Nie można połączyć się z serwerem LAN. Czy serwer działa (start-lan.bat)?'));
      ws.onmessage = e => { try { this.onmsg(JSON.parse(e.data)); } catch (err) { console.error('[net]', err); } };
      ws.onclose = () => { if (this.ws === ws) this.dropped(); };
    });
  },
  send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); },
  up(d) { this.send({ t: 'up', d }); },               // gracz -> gospodarz
  down(to, d) { this.send({ t: 'down', to, d }); },    // gospodarz -> gracz / wszyscy
  name() { try { return localStorage.getItem('mw_name') || ''; } catch (e) { return ''; } },

  /* wyjście z pokoju / gry sieciowej */
  leave() {
    clearInterval(this.timer); this.timer = null;
    if (this.ws) { const w = this.ws; this.ws = null; try { w.send(JSON.stringify({ t: 'leave' })); w.close(); } catch (e) {} }
    this.role = null; this.room = null; this.lobbyInfo = null; this.shopWait = {}; this.sent = false; this.shopping = false; this.lastLock = null;
    if (typeof G !== 'undefined') { G.netClient = false; }
  },
  dropped() {
    const was = this.role; this.leave();
    if (was && G.mp) { alert(trn('Utracono połączenie z serwerem LAN.')); UI.title(); }
  },

  onmsg(m) {
    switch (m.t) {
      case 'rooms': this.rooms = m.rooms; if (UI.lanRooms) UI.lanRooms(m.rooms); break;
      case 'hosted': this.role = 'host'; this.room = m.room; this.me = 0; UI.lanLobby(); break;
      case 'joined': this.role = 'client'; this.room = m.room; this.me = m.you; UI.lanLobby(); break;
      case 'lobby': this.lobbyInfo = m; this.n = m.n; if (!G.mp) UI.lanLobby(); break;
      case 'err': alert(trn(m.m)); break;
      case 'start': this.begin(m); break;
      case 'up': this.hostRecv(m.from, m.d); break;
      case 'down': this.clientRecv(m.d); break;
      case 'gone': this.hostGone(m.i); break;
      case 'closed': { const was = this.role; this.leave(); if (G.mp || was) { alert(trn('Gospodarz zakończył grę.')); UI.title(); } break; }
    }
  },

  begin(m) {
    this.n = m.n; this.names = m.names; this.me = m.you;
    if (this.role === 'host') {
      G.startMP(m.n, { remote: m.names.map((_, i) => i > 0), names: m.names });
      clearInterval(this.timer); this.timer = setInterval(() => this.hostTick(), 40);
    } else G.startNetClient(m);
  },

  /* ===================== GOSPODARZ ===================== */
  hostRecv(i, d) {
    if (this.role !== 'host' || !G.mp || !d) return;
    const mp = G.mp;
    if (d.t === 'sel') { if (mp.cur === i) G.sel = G.enemies[d.i] || null; }
    else if (d.t === 'act') {
      if (mp.cur === i && G.state === 'fight' && !Combat.busy && typeof d.kind === 'string' && /^[a-z]+$/.test(d.kind) && !['skipwave', 'toboss'].includes(d.kind)) Combat.act(d.kind);
    } else if (d.t === 'shopDone') {
      Object.assign(mp.players[i], d.d); this.dirty = true;
      const w = this.shopWait[i]; if (w) { delete this.shopWait[i]; w(); }
    }
  },
  /* otwiera sklep u zdalnego gracza i czeka na jego powrót */
  remoteShop(i, kind) {
    return new Promise(res => {
      if (G.mp.players[i].gone) return res();
      this.shopWait[i] = res; UI.log(`Gracz ${i + 1} (${(G.mp.names || [])[i] || ''}) robi zakupy…`);
      this.down(i, { t: 'shop', kind, d: G.mp.players[i] });
    });
  },
  async hostGone(i) {
    const mp = G.mp; if (this.role !== 'host' || !mp || !mp.players[i] || mp.players[i].gone) return;
    const d = mp.players[i]; d.gone = 1; d.hp = 0;
    UI.log(`Gracz ${i + 1} rozłączył się.`, 'bad');
    if (this.shopWait[i]) { const w = this.shopWait[i]; delete this.shopWait[i]; w(); }
    if (mp.players.every(x => x.hp <= 0 || x.gone)) { if (await G.mpDown()) return; }
    if (mp.cur === i && G.state === 'fight' && !Combat.busy) { await G.mpNext(); UI.lock(false); }
    this.dirty = true;
  },

  /* serializacja aktora: tylko proste pola (bez referencji) */
  ser(a) {
    if (!a._id) a._id = ++this.idc;
    const o = {};
    for (const k in a) {
      const v = a[k];
      if (k === 's') { o.s = {}; for (const q in v) { const x = v[q]; if (x === null || ['number', 'string', 'boolean'].includes(typeof x)) o.s[q] = x; else if (x && typeof x === 'object' && !Array.isArray(x) && (q === 'gear' || q === 'sk')) o.s[q] = x; } continue; }
      if (typeof v === 'function' || k === 'target' || k === 'owner') continue;
      if (v === null || ['number', 'string', 'boolean'].includes(typeof v)) o[k] = v;
      else if (v && typeof v === 'object' && !Array.isArray(v)) { const p = {}; for (const q in v) { const x = v[q]; if (x === null || ['number', 'string', 'boolean'].includes(typeof x)) p[q] = x; } o[k] = p; }
    }
    return o;
  },
  prim(f) { const o = {}; for (const k in f) { const v = f[k]; if (v === null || ['number', 'string', 'boolean'].includes(typeof v)) o[k] = v; } return o; },

  hostTick() {
    if (this.role !== 'host' || !G.mp || !G.heroes) return;
    this.tick++;
    const mp = G.mp, full = this.dirty || this.tick % 25 === 0; this.dirty = false;
    const cw = G.waves && G.waves[G.wave - 1] ? G.waves[G.wave - 1] : null;
    const bub = G.bub ? { id: G.bub.a && G.bub.a._id, txt: G.bub.txt } : null;
    const S = {
      t: 'snap', gt: G.t, st: G.state, lv: G.level, wv: G.wave, nw: G.waves.length, cw, cur: mp.cur, busy: !!Combat.busy, fb: Combat.fbCd,
      ev: G.event, fl: G.flash, fd: G.fade, sh: G.shake, ban: G.banner ? { txt: G.banner.txt } : null, hub: !!G.hub,
      hs: G.heroes.map(a => this.ser(a)), es: G.enemies.map(a => this.ser(a)), ns: (G.npcs || []).map(a => this.ser(a)),
      sel: G.enemies.indexOf(G.sel), proj: G.proj ? this.prim(G.proj) : null, cloud: G.cloud ? this.prim(G.cloud) : null, totem: G.fxTotem ? this.prim(G.fxTotem) : null,
      mark: G.mark ? this.prim(G.mark) : null, bg: G.bg ? { path: G.bg.path, x: G.bg.x } : null, bub,
      fx: G.fx.slice(-90).map(f => this.prim(f)), ph: mp.players.map(d => ({ hp: d.hp, maxhp: d.maxhp, level: d.level, gone: d.gone || 0 }))
    };
    if (full) S.pl = mp.players;
    this.down('all', S);
  },

  /* ===================== GRACZ (klient) ===================== */
  clientRecv(d) {
    if (this.role !== 'client' || !d) return;
    switch (d.t) {
      case 'snap': this.applySnap(d); break;
      case 'log': UI.log(d.m, d.c, d.x); break;
      case 'shop': this.clientShop(d); break;
      case 'screen': G.state = 'over'; UI.screen(d.title, d.text, [{ l: 'Menu', f: () => UI.title() }]); break;
    }
  },

  clientShop(d) {
    const mp = G.mp; Object.assign(mp.players[this.me], d.d);
    this.shopping = true; G.state = 'shop';
    const done = () => { this.shopping = false; G.state = 'fight'; this.up({ t: 'shopDone', d: JSON.parse(JSON.stringify(Player.d)) }); UI.hud(); };
    if (d.kind === 'smith') UI.smith(done); else UI.shop(done);
  },

  applySnap(S) {
    const mp = G.mp; if (!mp) return;
    G.state = this.shopping ? 'shop' : S.st; G.level = S.lv; G.wave = S.wv;
    G.waves = Array.from({ length: S.nw }, () => ({})); if (S.cw) G.waves[S.wv - 1] = S.cw;
    G.event = S.ev; G.hub = S.hub ? {} : null; mp.cur = S.cur;
    /* czas gospodarza (animacje opierają się o G.t) */
    const off = S.gt - this._raw; G.tOff = (G.tOff == null || Math.abs(off - G.tOff) > 200) ? off : G.tOff + (off - G.tOff) * .15;
    if ((S.fl || 0) > (G.flash || 0)) G.flash = S.fl; G.fade = S.fd || 0; if ((S.sh || 0) > (G.shake || 0) + 1) G.shake = S.sh;
    if (S.ban && (!G.banner || G.banner.txt !== S.ban.txt)) G.banner = { txt: S.ban.txt, t: 0 };
    if (!S.ban) G.banner = G.banner && G.banner.t > 1 ? G.banner : null;
    /* dane graczy */
    if (S.pl) S.pl.forEach((d, i) => { if (i === this.me && this.shopping) return; Object.assign(mp.players[i], d); });
    S.ph.forEach((q, i) => { if (i === this.me && this.shopping) return; Object.assign(mp.players[i], q); });
    Player.d = mp.players[this.me];
    Combat.fbCd = S.cur === this.me ? S.fb : (Player.d._fb || 0);
    /* aktorzy */
    const sync = (list, map, hero) => {
      const seen = new Set();
      list.forEach(s => {
        seen.add(s._id); let a = map.get(s._id);
        if (!a) { a = {}; map.set(s._id, a); Object.assign(a, s); }
        else for (const k in s) {
          const v = s[k];
          if ((k === 'x' || k === 'y' || k === 'ox' || k === 'oy') && typeof v === 'number') a[k] = Math.abs(v - a[k]) > 70 ? v : a[k] + (v - a[k]) * .5;
          else if (k !== 's') a[k] = v;
        }
        if (hero) a.s = mp.players[a.pi]; else a.s = s.s;
        for (const k in a) if (!(k in s) && !['s', '_id'].includes(k) && typeof a[k] !== 'function') delete a[k];
        a._id = s._id;
      });
      for (const id of [...map.keys()]) if (!seen.has(id)) map.delete(id);
      return list.map(s => map.get(s._id));
    };
    this.mH = this.mH || new Map(); this.mE = this.mE || new Map(); this.mN = this.mN || new Map();
    G.heroes = sync(S.hs, this.mH, true); G.enemies = sync(S.es, this.mE, false); G.npcs = sync(S.ns, this.mN, false); G.comps = [];
    G.p = G.heroes.find(h => h.pi === this.me) || G.heroes[0];
    G.actors = [...G.heroes, ...G.enemies, ...G.npcs];
    G.sel = S.sel >= 0 ? G.enemies[S.sel] : null;
    G.proj = S.proj; G.cloud = S.cloud; G.fxTotem = S.totem; G.mark = S.mark; G.bg = S.bg; G.fx = S.fx;
    if (S.bub) { if (!G.bub || G.bub.txt !== S.bub.txt) G.bub = { a: G.actors.find(a => a._id === S.bub.id) || G.p, txt: S.bub.txt, t0: performance.now() }; } else G.bub = null;
    /* blokada przycisków: aktywne tylko w mojej turze */
    if (S.busy || S.cur !== this.me) this.sent = false;
    const lock = this.shopping || this.sent || !(S.cur === this.me && S.st === 'fight' && !S.busy && Player.d.hp > 0);
    const key = lock + '|' + S.cur + '|' + Player.d.potions + '|' + S.fb + '|' + Player.d.hp + '|' + Player.d.level + '|' + S.wv + '|' + S.lv;
    if (key !== this.lastLock) { this.lastLock = key; UI.hud(); UI.lock(lock); }
  }
};

/* ---------- włączanie sieci w grze ---------- */
(function () {
  /* log i ekrany gospodarza trafiają też do graczy */
  const log0 = UI.log;
  UI.log = function (t, c, raw) { log0.call(this, t, c, raw); if (Net.role === 'host' && G.mp) Net.down('all', { t: 'log', m: t, c, x: raw }); };
  const scr0 = UI.screen;
  UI.screen = function (title, text, btns, cls) { if (Net.role === 'host' && G.mp) Net.down('all', { t: 'screen', title, text }); return scr0.call(this, title, text, btns, cls); };
  /* przyciski akcji zablokowane, gdy turę ma zdalny gracz */
  const lock0 = UI.lock;
  UI.lock = function (b) { lock0.call(this, b || G.remoteTurn()); };
})();

Object.assign(G, {
  remoteTurn() { return !!(this.mp && this.mp.remote && this.mp.remote[this.mp.cur] && !this.netClient); },

  /* start gry u gracza (klienta): scena pochodzi z migawek gospodarza */
  startNetClient(m) {
    ModAPI.exit();
    const sc = UI.$('screen'); sc.classList.add('hidden'); sc.innerHTML = ''; UI.menuOpen = false;
    this.nextBub(); this.hub = null; Combat.busy = false; Combat.fbCd = 0;
    this.mode = 'campaign'; this.netClient = true; this.nextHardcore = false; this.dev = false;
    const players = Array.from({ length: m.n }, () => { const d = Player.base(); d.gear = { sword: null, armor: null, shield: null }; d.mp = 1; return d; });
    this.mp = { n: m.n, cur: 0, players, remote: m.names.map((_, i) => i !== m.you), names: m.names, lan: true, me: m.you };
    Player.d = players[m.you]; this.level = 0; this.wave = 1; this.waves = [{}]; this.heroes = []; this.enemies = []; this.npcs = []; this.comps = []; this.actors = []; this.p = null;
    this.state = 'fight'; this.tOff = null; Net.mH = Net.mE = Net.mN = null; Net.lastLock = null; Net.sent = false; Net.shopping = false;
    UI.$('log').innerHTML = ''; UI.log(`Dołączyłeś do gry LAN jako Gracz ${m.you + 1}. Akcje wykonujesz w swojej turze.`, 'crit');
    UI.lock(true);
  },
  netUpdate() { /* klient nie liczy gry – tylko wyświetla migawki gospodarza */ }
});

Object.assign(UI, {
  /* ---------- ekrany sieciowe ---------- */
  _lan(title, cls) {
    const s = this.$('screen'); s.innerHTML = ''; s.className = cls || 'mods'; s.classList.remove('hidden');
    const h = document.createElement('h2'); h.textContent = trn(title); s.append(h); return s;
  },
  _lanP(s, text, cls) { const p = document.createElement('p'); p.textContent = text; if (cls) p.className = cls; s.append(p); return p; },
  _lanBtn(bar, label, fn, cls) { const b = document.createElement('button'); b.textContent = trn(label); b.onclick = fn; if (cls) b.className = cls; bar.append(b); return b; },

  lan() {
    Net.leave();
    const s = this._lan('Multiplayer LAN');
    this._lanP(s, trn('Każdy gracz steruje swoją postacią na swoim komputerze (ta sama sieć). Jeden z graczy (gospodarz) uruchamia serwer LAN – start-lan.bat / start-lan.sh – i zakłada pokój, pozostali otwierają jego adres w przeglądarce i dołączają kodem.'));
    if (!Net.available()) this._lanP(s, trn('Ta strona nie została otwarta przez serwer LAN, więc połączenie nie jest możliwe. Uruchom start-lan.bat (Windows) albo start-lan.sh i wejdź na adres http://… podany w oknie serwera.'), 'team-empty');
    const nm = document.createElement('input'); nm.type = 'text'; nm.maxLength = 16; nm.placeholder = trn('Twój nick'); nm.value = Net.name(); nm.className = 'lan-input';
    nm.oninput = () => { try { localStorage.setItem('mw_name', nm.value); } catch (e) {} }; s.append(nm);
    const bar = document.createElement('div'); bar.className = 'wmap-actions'; s.append(bar);
    const go = async (fn) => { try { await Net.connect(); fn(); } catch (e) { alert(trn(e.message)); } };
    this._lanBtn(bar, 'Załóż grę (2 graczy)', () => go(() => Net.send({ t: 'host', n: 2, name: nm.value || 'Gospodarz' })));
    this._lanBtn(bar, 'Załóż grę (3 graczy)', () => go(() => Net.send({ t: 'host', n: 3, name: nm.value || 'Gospodarz' })));
    this._lanBtn(bar, 'Dołącz do gry', () => go(() => this.lanJoin(nm)));
    this._lanBtn(bar, 'Wstecz', () => this.mpMenu(), 'ghost');
  },

  lanJoin(nm) {
    const s = this._lan('Dołącz do gry LAN');
    this._lanP(s, trn('Wybierz pokój z listy albo wpisz jego kod (pokazuje go gospodarz).'));
    const list = document.createElement('div'); list.className = 'mod-list'; list.id = 'lan-rooms'; s.append(list);
    const code = document.createElement('input'); code.type = 'text'; code.maxLength = 4; code.placeholder = 'KOD'; code.className = 'lan-input'; s.append(code);
    const bar = document.createElement('div'); bar.className = 'wmap-actions'; s.append(bar);
    const join = id => Net.send({ t: 'join', room: id, name: (nm && nm.value) || Net.name() || 'Gracz' });
    this._lanBtn(bar, 'Dołącz kodem', () => join(code.value));
    this._lanBtn(bar, 'Odśwież', () => Net.send({ t: 'list' }));
    this._lanBtn(bar, 'Wstecz', () => this.lan(), 'ghost');
    this._join = join; Net.send({ t: 'list' });
    clearInterval(this._rt); this._rt = setInterval(() => { if (document.getElementById('lan-rooms')) Net.send({ t: 'list' }); else clearInterval(this._rt); }, 2000);
  },
  lanRooms(rooms) {
    const box = document.getElementById('lan-rooms'); if (!box) return; box.innerHTML = '';
    if (!rooms.length) { const e = document.createElement('p'); e.className = 'team-empty'; e.textContent = trn('Brak otwartych pokoi.'); box.append(e); return; }
    rooms.forEach(r => {
      const c = document.createElement('div'); c.className = 'mod-card';
      const i = document.createElement('div'); i.className = 'mod-info';
      const b = document.createElement('b'); b.textContent = `${r.name} · ${r.id}`; const sp = document.createElement('span'); sp.textContent = `${r.count}/${r.n} ${trn('graczy')}`; i.append(b, sp);
      const bt = document.createElement('button'); bt.textContent = trn('Dołącz'); bt.onclick = () => this._join(r.id);
      c.append(i, bt); box.append(c);
    });
  },

  lanLobby() {
    clearInterval(this._rt);
    const L = Net.lobbyInfo, s = this._lan(Net.role === 'host' ? 'Twój pokój LAN' : 'Poczekalnia LAN');
    const big = document.createElement('div'); big.className = 'lan-code'; big.textContent = Net.room || '…'; s.append(big);
    this._lanP(s, trn(Net.role === 'host' ? 'Pozostali gracze wpisują ten kod (lub wybierają Twój pokój z listy). Gdy wszyscy dołączą, kliknij Start.' : 'Czekaj, aż gospodarz rozpocznie grę.'));
    const list = document.createElement('div'); list.className = 'mod-list'; s.append(list);
    const players = L ? L.players : [];
    for (let i = 0; i < (L ? L.n : Net.n); i++) {
      const c = document.createElement('div'); c.className = 'mod-card';
      const b = document.createElement('b'); b.textContent = `${i === 0 ? '👑 ' : '👤 '}${trn('Gracz')} ${i + 1}: ${players[i] || '— ' + trn('czeka na gracza') + ' —'}${i === Net.me ? ' (' + trn('Ty') + ')' : ''}`;
      c.append(b); list.append(c);
    }
    const bar = document.createElement('div'); bar.className = 'wmap-actions'; s.append(bar);
    if (Net.role === 'host') { const joined = players.filter(Boolean).length; const st = this._lanBtn(bar, 'Start', () => Net.send({ t: 'start' })); st.disabled = joined < 2; }
    this._lanBtn(bar, 'Wyjdź', () => this.lan(), 'ghost');
  }
});
