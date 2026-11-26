/* ============================================================
   WORLDMAP.JS – v1.4.0: NOWA MAPA ŚWIATA – mała wersja świata
   Jedna ciągła KRAINA podzielona na biomy (jak na Twoim szkicu): zamek i zielony las → ścieżka → wioska → moczary → rzeka z mostem → tajga → …
   Biomy stykają się ze sobą (różne kolory podłoża i dekoracje, miękkie granice), kraina ma klify od strony morza, a w środku zatokę
   i rzekę z mostami. Rozmieszczenie "wężykiem" jak dawniej (1–5 w prawo, 6–10 w lewo, połączenie na prawym brzegu).
   Po krainie chodzi mała wersja bohatera (WASD / strzałki, Shift = szybciej); w morze i rzekę (poza mostami) wejść się nie da.
   Wejście na etap = zamek z numerem (pytanie o przeniesienie, jeśli poprzednie pokonane). Przy zamku 1. etapu stoją Handlarz
   i Zbrojmistrz (zakupy prosto z mapy), a po pokonaniu wiedźmy jej stanowisko pojawia się osobno obok wejścia na Moczary.
   ============================================================ */
Object.assign(UI, {
  clearedCount() {
    if (G.dev) return CAMPAIGN.length;
    if (G.modRun) return G.modCleared || 0;
    return (Save.get('campaign') || { cleared: 0 }).cleared || 0;
  },

  /* ---------- układ świata: jedna kraina, biomy-regiony, ścieżki, rzeka z mostami ---------- */
  worldLayout(N) {
    /* v1.4.0 (poprawka): mniejsze biomy i prawie cały świat to ląd – woda to tylko rzeka z mostami i jezioro między rzędami */
    const main = N === 10, COLS = 5, K = .62;
    const xs = (main ? [330, 800, 1270, 1900, 2380] : [330, 800, 1270, 1740, 2210]).map(v => v * K);
    const RX = (main ? [260, 250, 320, 310, 240] : [260, 250, 280, 280, 240]).map(v => v * K), RY = [135, 120, 135, 130, 125].map(v => v * K);
    const rows = Math.ceil(N / COLS), GAP = 420 * K, ROW0 = 175, W = Math.round(xs[COLS - 1] + RX[COLS - 1] * .5 + 120), H = Math.round(ROW0 + (rows - 1) * GAP + 175);
    const blobs = [];
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / COLS); let col = i % COLS; if (row % 2) col = COLS - 1 - col;
      const b = { i, cx: xs[col], cy: ROW0 + row * GAP, rx: RX[col], ry: RY[col] };
      b.ent = { x: b.cx, y: b.cy - b.ry * .1 }; blobs.push(b);
    }
    /* jeziora między rzędami (z lądowym przejściem na jednym końcu: prawy brzeg dla parzystych przerw, lewy dla nieparzystych) */
    const lakes = [];
    for (let r = 0; r < rows - 1; r++) {
      const y = ROW0 + r * GAP + GAP / 2, even = r % 2 === 0, x0 = even ? 70 : xs[0] + 105, x1 = even ? xs[COLS - 1] - 105 : W - 70;
      lakes.push({ cx: (x0 + x1) / 2, cy: y, rx: (x1 - x0) / 2, ry: 44 });
    }
    const paths = [];
    for (let i = 0; i < N - 1; i++) {
      const A = blobs[i].ent, B = blobs[i + 1].ent, pts = [], bend = (i % 2 ? -1 : 1) * 20 * (A.y === B.y ? 1 : 0);
      for (let k = 0; k <= 16; k++) { const u = k / 16, x = A.x + (B.x - A.x) * u, y = A.y + (B.y - A.y) * u + Math.sin(u * Math.PI) * bend; pts.push([x, y]); }
      paths.push({ a: i, b: i + 1, pts });
    }
    const riverX = main ? (xs[2] + xs[3]) / 2 + 6 : null, riverAt = y => riverX + 14 * Math.sin(y / 70) + 7 * Math.sin(y / 31);
    const bridges = [];
    if (riverX != null) paths.forEach(p => {
      for (let k = 0; k < p.pts.length - 1; k++) {
        const [x1, y1] = p.pts[k], [x2, y2] = p.pts[k + 1], d1 = x1 - riverAt(y1), d2 = x2 - riverAt(y2);
        if (d1 * d2 < 0) { const u = d1 / (d1 - d2); bridges.push({ x: x1 + (x2 - x1) * u, y: y1 + (y2 - y1) * u }); }
      }
    });
    const nz = (x, y, i) => .08 * Math.sin(x * .02 + i * 1.3) + .08 * Math.sin(y * .03 + i * 2.1) + .06 * Math.sin((x - y) * .017 + i) + .05 * Math.sin(x * .045 + y * .04 + i);
    const Wd = { W, H, blobs, lakes, paths, bridges, riverX, riverAt, N };
    Wd.inWater = (x, y) => {
      if (riverX != null && Math.abs(x - riverAt(y)) < 18) return true;
      for (let k = 0; k < lakes.length; k++) { const q = lakes[k], dx = (x - q.cx) / q.rx, dy = (y - q.cy) / q.ry; if ((dx * dx + dy * dy) * (1 + nz(x, y, 60 + k)) < 1) return true; }
      return false;
    };
    Wd.inLand = (x, y) => x >= 6 && y >= 6 && x <= W - 6 && y <= H - 6 && !Wd.inWater(x, y);
    Wd.onBridge = (x, y) => bridges.some(b => Math.abs(y - b.y) < 17 && Math.abs(x - riverAt(b.y)) < 50);
    Wd.region = (x, y) => { let best = 0, bd = 1e9; const west = riverX != null ? x < riverAt(y) : null; for (const b of blobs) { if (west !== null && (b.cx < riverX) !== west) continue; const dx = (x - b.cx) / b.rx, dy = (y - b.cy) / b.ry, d = (dx * dx + dy * dy) * (1 + .12 * Math.sin(x * .016 + y * .012 + b.i * 2)); if (d < bd) { bd = d; best = b.i; } } return best; };
    return Wd;
  },
  _segDist(px, py, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1; let u = ((px - x1) * dx + (py - y1) * dy) / l; u = Math.max(0, Math.min(1, u)); return Math.hypot(px - (x1 + dx * u), py - (y1 + dy * u)); },
  worldWalkable(Wd, x, y) { return Wd.inLand(x, y) || Wd.onBridge(x, y); },

  worldMap(opts = {}) {
    const s = this.$('screen');
    s.innerHTML = ''; s.className = 'worldmap'; s.classList.remove('hidden');
    const cleared = this.clearedCount();
    const canJump = !!opts.fromMenu && G.mode === 'campaign' && !G.mp && !!G.p && ['fight', 'clear'].includes(G.state) && !Combat.busy;
    const here = (G.mode === 'campaign' && G.p && !opts.fromDeath) ? G.level : -1;
    const N = CAMPAIGN.length, VW = 800, VH = 420;
    const Wd = this.worldLayout(N);

    const h = document.createElement('h2');
    h.textContent = trn(opts.fromDeath ? 'Porażka – Mapa świata' : 'Mapa świata'); s.append(h);
    const sub = document.createElement('p');
    sub.textContent = trn(opts.fromDeath ? 'Wybierz odblokowany etap, by spróbować ponownie.' :
      opts.fromMenu ? (canJump ? 'Chodź bohaterem po świecie. Stań na odblokowanym biomie, aby przenieść się do etapu (zaczniesz od 1. fali).' : 'Podgląd mapy. Przenoszenie między etapami działa w trakcie kampanii (poza walką).') :
      'Chodź bohaterem (WASD / strzałki) po świecie. Stań na odblokowanym biomie, aby wyruszyć do etapu.') + (G.dev ? trn(' [DEV: wszystko odblokowane]') : '');
    s.append(sub);

    const wrap = document.createElement('div'); wrap.className = 'wm2-wrap';
    const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH; cv.className = 'wm2-canvas';
    wrap.append(cv); s.append(wrap);
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;

    const info = document.createElement('div'); info.className = 'wm-info';
    const defInfo = trn('Podejdź bohaterem do biomu, aby zobaczyć przeciwników.');
    info.textContent = defInfo; s.append(info);
    const prompt = document.createElement('div'); prompt.className = 'wm2-prompt hidden'; wrap.append(prompt);   // pytanie leży NA mapie (nie przesuwa układu ekranu)

    const tiles = CAMPAIGN.map((L, i) => ({ i, L, ...Wd.blobs[i], unlocked: i <= cleared || G.dev, done: i < cleared }));
    const saved = !G.modRun && !G.mp ? Save.get('campaign') : null;
    const pdata = () => Player.d || (saved && saved.p) || null;
    /* stanowiska: Handlarz i Zbrojmistrz przy zamku 1. etapu; stanowisko wiedźmy (po jej pokonaniu) osobno obok wejścia na Moczary */
    const inside = (q, x, y) => { for (let k = 0; k < 16 && !Wd.inLand(x, y); k++) { x += (q.ent.x - x) * .15; y += (q.ent.y - y) * .15; } return { x, y }; };
    const stalls = [];
    if (tiles[0]) { const t0 = tiles[0]; stalls.push({ kind: 'merchant', key: 'st_merchant', ...inside(t0, t0.ent.x - 86, t0.ent.y + 40) }, { kind: 'smith', key: 'st_smith', ...inside(t0, t0.ent.x + 86, t0.ent.y + 40) }); }
    const sw = tiles.find(t => t.L.boss === 'witch');
    const wd = pdata();
    if (sw && wd && wd.witch) stalls.push({ kind: 'witch', key: 'st_witch', ...inside(sw, sw.ent.x + 92, sw.ent.y + 36) });
    const st0 = tiles[Math.max(0, Math.min(N - 1, here >= 0 ? here : Math.min(cleared, N - 1)))];
    const me = opts._pos ? { ...opts._pos, walk: 0 } : { x: st0.ent.x, y: st0.ent.y + 44, face: 1, walk: 0 };
    const layer = this.buildWorldLayers(Wd, tiles, stalls, cleared, here);
    let near = null, dismissed = null;

    const enter = i => {
      const L = CAMPAIGN[i];
      if (opts.fromMenu) {
        if (!confirm(trn(`Przenieść się do etapu ${i + 1}: ${L.name}? Postęp w bieżącym etapie zostanie utracony.`))) return;
        stop(); G.jumpToStage(i); return;
      }
      stop(); s.classList.add('hidden');
      if (opts.fromDeath) {
        const snap = G.snap ? JSON.parse(G.snap) : (G.modRun ? null : (Save.get('campaign') || {}).p);
        Player.d = snap || Player.base();
        Player.d.gear = Player.d.gear || { sword: null, armor: null, shield: null };
        Player.d.hp = Player.d.maxhp;
        G.mode = 'campaign'; G.level = i; G.wave = 1; G.waves = buildWaves(i); G.wave = G.stageStart();
        G.snap = JSON.stringify(Player.d); G.newRun();
      } else if (G.modRun) G.jumpToStage(i);
      else G.startCampaign(i, true);
    };

    const showPrompt = () => {
      prompt.innerHTML = '';
      if (!near || dismissed === near.key) { prompt.classList.add('hidden'); return; }
      prompt.classList.remove('hidden');
      const p = document.createElement('p'); prompt.append(p);
      const mk = (label, fn, cls) => { const b = document.createElement('button'); b.textContent = trn(label); if (cls) b.className = cls; b.onclick = fn; prompt.append(b); };
      if (near.stall) {
        const k = near.stall.kind, stay = () => { dismissed = near.key; showPrompt(); };
        if (k === 'witch') {
          if (canJump) { p.textContent = trn('Stanowisko Wiedźmy – odwiedzić? (po wizycie wrócisz tam, gdzie byłeś)'); mk('Odwiedź (Enter)', () => { stop(); G.visitWitch(); }); mk('Zostań', stay, 'ghost'); }
          else p.textContent = trn('Stanowisko Wiedźmy: eliksiry, talizmany szczęścia i ulepszenie eliksiru (zawsze leczy 75% HP). Odwiedzisz je w trakcie kampanii.');
        } else if (!pdata()) p.textContent = trn(k === 'merchant' ? 'Handlarz – zakupy będą dostępne, gdy zaczniesz kampanię.' : 'Zbrojmistrz – zakupy będą dostępne, gdy zaczniesz kampanię.');
        else { p.textContent = trn(k === 'merchant' ? 'Handlarz – otworzyć sklep? (umiejętności, eliksiry, kompani)' : 'Zbrojmistrz – otworzyć kuźnię? (miecze, zbroje, tarcze)'); mk('Otwórz (Enter)', () => openShop(k)); mk('Zostań', stay, 'ghost'); }
        return;
      }
      const t = near.t;
      if (!t.unlocked) { p.textContent = `🔒 ${trn('Etap')} ${t.i + 1}: ${trn(t.L.name)} — ${trn('najpierw pokonaj poprzednie etapy.')}`; return; }
      if (opts.fromMenu && !canJump) { p.textContent = `${trn('Etap')} ${t.i + 1}: ${trn(t.L.name)} — ${trn('podgląd (przenoszenie działa w trakcie kampanii, poza walką).')}`; return; }
      p.textContent = `${trn('Etap')} ${t.i + 1}: ${trn(t.L.name)} — ${trn(opts.fromDeath ? 'spróbować tutaj ponownie?' : opts.fromMenu ? 'przenieść się do tego etapu?' : 'wyruszyć do tego etapu?')}`;
      mk(opts.fromMenu ? 'Przenieś się (Enter)' : 'Wyrusz (Enter)', () => enter(t.i));
      mk('Zostań', () => { dismissed = near.key; showPrompt(); }, 'ghost');
    };

    /* zakupy prosto z mapy (u zamku): po zamknięciu wracamy na mapę w to samo miejsce */
    const openShop = kind => {
      Player.d = pdata(); if (!Player.d) return;
      Player.d.gear = Player.d.gear || { sword: null, armor: null, shield: null };
      const pos = { x: me.x, y: me.y, face: me.face }; stop();
      const noP = !G.p, sync0 = G.syncComps; if (noP) G.syncComps = () => {};
      const back = () => {
        if (noP) G.syncComps = sync0;
        if (saved && !G.modRun) Save.set('campaign', { ...saved, p: Player.d });
        if (G.snap) G.snap = JSON.stringify(Player.d);
        if (G.p) UI.hud();
        UI.worldMap({ ...opts, _pos: pos });
      };
      if (kind === 'smith') UI.smith(back); else UI.shop(back);
    };
    const onKey = e => {
      const k = e.key.toLowerCase();
      if (!alive() || e.repeat) return;
      if ((k === 'enter' || G.isDown('interact')) && near && dismissed !== near.key && !prompt.classList.contains('hidden')) {
        const b = prompt.querySelector('button:not(.ghost)'); if (b) b.click();
      }
    };
    addEventListener('keydown', onKey);
    const alive = () => cv.isConnected && s.className === 'worldmap' && !s.classList.contains('hidden');
    let stopped = false;
    const stop = () => { stopped = true; removeEventListener('keydown', onKey); };

    const frame = t => {
      if (stopped) return;
      if (!alive()) { stop(); return; }
      const sp = G.isDown('sprint') ? 5 : 3;
      let dx = (G.isDown('right') ? 1 : 0) - (G.isDown('left') ? 1 : 0), dy = (G.isDown('down') ? 1 : 0) - (G.isDown('up') ? 1 : 0);
      if (dx && dy) { dx *= .72; dy *= .72; }
      me.walk = (dx || dy) ? 1 : 0; if (dx) me.face = dx > 0 ? 1 : -1;
      const nx = me.x + dx * sp, ny = me.y + dy * sp;   // ruch z "ślizganiem" po krawędzi lądu
      if (this.worldWalkable(Wd, nx, ny)) { me.x = nx; me.y = ny; }
      else { if (dx && this.worldWalkable(Wd, nx, me.y)) me.x = nx; else if (dy && this.worldWalkable(Wd, me.x, ny)) me.y = ny; else me.walk = 0; }
      let n = null;
      for (const q of tiles) if (Math.hypot(me.x - q.ent.x, me.y - q.ent.y) < 40) { n = { key: 't' + q.i, t: q }; break; }
      if (!n) for (const sl of stalls) if (Math.hypot(me.x - sl.x, me.y - sl.y) < 38) { n = { key: sl.key, stall: sl }; break; }
      if ((n && n.key) !== (near && near.key)) {
        near = n; if (!n) dismissed = null;
        else if (dismissed && dismissed !== n.key) dismissed = null;
        showPrompt();
        if (n && n.t) { const q = n.t, foes = [...new Set(allFoes(q.L))].map(f => trn((ENEMY_DEFS[f] || { name: f }).name)).join(', '); info.textContent = `${trn('Etap')} ${q.i + 1}: ${trn(q.L.name)} — ${trn('wrogowie')}: ${foes} · ${trn('boss')}: ${trn((ENEMY_DEFS[q.L.boss] || { name: q.L.boss }).name)}`; }
        else if (n && n.stall) info.textContent = trn(n.stall.kind === 'witch' ? 'Stanowisko Wiedźmy: eliksiry, talizmany szczęścia i ulepszenie eliksiru (zawsze leczy 75% HP).' : n.stall.kind === 'merchant' ? 'Handlarz: umiejętności, eliksiry i kompani.' : 'Zbrojmistrz: miecze, zbroje i tarcze.');
        else info.textContent = defInfo;
      }
      this.drawWorld(c, { VW, VH, Wd, tiles, stalls, me, here, t, cleared, N, layer });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    const rowB = document.createElement('div'); rowB.className = 'wmap-actions';
    if (opts.fromDeath && opts.retryLevel != null && (opts.retryLevel <= cleared || G.dev)) {
      const retry = document.createElement('button'); retry.textContent = trn('Spróbuj ponownie (ten etap)');
      retry.onclick = () => {
        stop(); s.classList.add('hidden');
        Player.d = G.snap ? JSON.parse(G.snap) : Player.base();
        Player.d.gear = Player.d.gear || { sword: null, armor: null, shield: null };
        Player.d.hp = Player.d.maxhp;
        G.level = opts.retryLevel; G.wave = 1; G.waves = buildWaves(opts.retryLevel); G.wave = G.stageStart();
        G.snap = JSON.stringify(Player.d); G.newRun();
      };
      rowB.append(retry);
    }
    if (!opts.fromDeath && !opts.fromMenu && !G.modRun) {
      const neu = document.createElement('button'); neu.textContent = trn('Nowa kampania');
      neu.onclick = () => { stop(); Save.clear('campaign'); this.worldMap({ start: 1 }); };
      rowB.append(neu);
    }
    const back = document.createElement('button');
    back.textContent = trn(opts.fromDeath ? 'Menu główne' : (opts.fromMenu ? 'Zamknij' : 'Wstecz'));
    back.onclick = () => { stop(); if (opts.fromMenu) this.closeMenu(); else this.title(); };
    rowB.append(back);
    s.append(rowB);
  },

  /* ---------- wygląd: wyspy z klifami, morze, chmury ---------- */
  WSTYLE: {
    forest: { top: '#6cc43a', rim: '#a4e854', cliff: '#c4572d', deco: 'tree' }, village: { top: '#98c452', rim: '#c0dc64', cliff: '#b0602c', deco: 'hut' },
    swamp: { top: '#548c50', rim: '#78b06a', cliff: '#6a5230', deco: 'deadtree' }, taiga: { top: '#62a878', rim: '#96d4a0', cliff: '#74604a', deco: 'pine' },
    ice: { top: '#e4f2ff', rim: '#ffffff', cliff: '#7aa4cc', deco: 'iceberg' }, cave: { top: '#948fb0', rim: '#b4b0d4', cliff: '#4e4a68', deco: 'crystal' },
    desert: { top: '#f2b44c', rim: '#ffd884', cliff: '#c4602a', deco: 'dune' }, plant: { top: '#8c9ca8', rim: '#b0c0cc', cliff: '#4c5864', deco: 'box' },
    lava: { top: '#823c32', rim: '#b06048', cliff: '#3e1c1a', deco: 'lava' }, stadium: { top: '#4cb252', rim: '#86d676', cliff: '#6c6c7c', deco: 'pitch' }
  },
  _rng(seed) { let x = seed * 9301 + 49297; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; },
  _mix(a, b, u) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); },
  _rgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); },

  /* warstwy statyczne w połowie rozdzielczości (pikselowy wygląd): morze + kraina (podłoże biomów, klify, ścieżki, mosty, dekoracje, zamki) */
  buildWorldLayers(Wd, tiles, stalls, cleared, here) {
    const w = Math.ceil(Wd.W / 2), h = Math.ceil(Wd.H / 2), D = 14;
    const mk = () => { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; };
    const sea = mk(), land = mk(), sc = sea.getContext('2d'), lc = land.getContext('2d');
    /* morze z "łuskowym" wzorem fal */
    sc.fillStyle = '#1d6f8e'; sc.fillRect(0, 0, w, h); sc.strokeStyle = 'rgba(10,60,90,.55)'; sc.lineWidth = 1;
    for (let y = 3, r = 0; y < h; y += 6, r++) for (let x = (r % 2) * 5; x < w; x += 10) { sc.beginPath(); sc.arc(x, y, 3.2, .15 * Math.PI, .85 * Math.PI); sc.stroke(); }
    /* maska lądu i właściciel (biom) każdego piksela */
    const inm = new Uint8Array(w * h), reg = new Int8Array(w * h).fill(-1);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x * 2 + 1, Y = y * 2 + 1; if (Wd.inLand(X, Y)) { inm[y * w + x] = 1; reg[y * w + x] = Wd.region(X, Y); } }
    const st = tiles.map(q => { const t = this.WSTYLE[q.L.map] || { top: (MAPS[q.L.map] || {}).ground || '#6a9a4a', rim: '#a0d070', cliff: '#a0522d', deco: 'tree' }, lk = !q.unlocked, f = c => this._rgb(lk ? this._mix(c, '#3a3a4a', .5) : c); return { top: f(t.top), rim: f(t.rim), cl: f(t.cliff), deco: t.deco, lock: lk }; });
    const img = lc.createImageData(w, h), px = img.data, lastIn = new Int32Array(w).fill(-9999), lastReg = new Int8Array(w);
    const put = (p, c, a) => { px[p * 4] = c[0]; px[p * 4 + 1] = c[1]; px[p * 4 + 2] = c[2]; px[p * 4 + 3] = a == null ? 255 : a; };
    const mixc = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (inm[p]) {
        const r = reg[p], S = st[r]; lastIn[x] = y; lastReg[x] = r;
        let col = S.top; const tex = ((x * 7 + y * 13) % 5) - 2; col = [col[0] + tex, col[1] + tex, col[2] + tex];
        const ed = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && !inm[yy * w + xx];
        if (ed(x, y - 2) || ed(x - 2, y) || ed(x + 2, y)) col = S.rim;
        else if ((x + 1 < w && reg[p + 1] !== r && inm[p + 1]) || (y + 1 < h && reg[p + w] !== r && inm[p + w])) col = mixc(col, [20, 20, 30], .28);   // miękka granica biomów
        put(p, col);
      } else {
        const k = y - lastIn[x];
        if (k >= 1 && k <= D) { const S = st[lastReg[x]]; let c = mixc(S.cl, [0, 0, 0], .1 + .5 * k / D); if (((x >> 1) % 3) === 0) c = mixc(c, [0, 0, 0], .14); put(p, c); }
        else if (k > D && k <= D + 5) put(p, [0, 25, 45], 90);
      }
    }
    lc.putImageData(img, 0, 0);
    /* maska (do przycinania ścieżek do lądu) */
    const mc = mk(), mctx = mc.getContext('2d'), mimg = mctx.createImageData(w, h);
    for (let p = 0; p < w * h; p++) mimg.data[p * 4 + 3] = inm[p] ? 255 : 0;
    mctx.putImageData(mimg, 0, 0);
    /* ścieżki na lądzie: piaskowe, z kropkami-węzłami; przycięte do lądu */
    const pc = mk(), pctx = pc.getContext('2d'); pctx.scale(.5, .5);
    Wd.paths.forEach(p => {
      const open = p.a < cleared || G.dev, line = () => { pctx.beginPath(); p.pts.forEach((z, k) => k ? pctx.lineTo(z[0], z[1]) : pctx.moveTo(z[0], z[1])); };
      pctx.lineCap = 'round'; pctx.lineJoin = 'round'; pctx.lineWidth = 28; pctx.strokeStyle = open ? '#c9a45a' : '#7a7080'; line(); pctx.stroke();
      pctx.lineWidth = 21; pctx.strokeStyle = open ? '#f0d68c' : '#a098a8'; line(); pctx.stroke();
      let acc = 0; for (let k = 1; k < p.pts.length; k++) { acc += Math.hypot(p.pts[k][0] - p.pts[k - 1][0], p.pts[k][1] - p.pts[k - 1][1]); if (acc > 76) { acc = 0; pctx.fillStyle = open ? '#ff9a1a' : '#6a6070'; pctx.beginPath(); pctx.arc(p.pts[k][0], p.pts[k][1], 7, 0, 7); pctx.fill(); pctx.fillStyle = open ? '#ffd83a' : '#8a8090'; pctx.beginPath(); pctx.arc(p.pts[k][0], p.pts[k][1], 5, 0, 7); pctx.fill(); } }
    });
    pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.globalCompositeOperation = 'destination-in'; pctx.drawImage(mc, 0, 0);
    lc.drawImage(pc, 0, 0);
    /* mosty (nad rzeką) */
    lc.save(); lc.scale(.5, .5);
    Wd.bridges.forEach(b => {
      const x = Wd.riverAt(b.y), open = true;
      lc.fillStyle = 'rgba(0,30,50,.35)'; lc.fillRect(x - 40, b.y - 12, 80, 34);
      lc.fillStyle = '#4a2410'; lc.fillRect(x - 38, b.y - 18, 76, 36); lc.fillStyle = open ? '#b86a30' : '#7a5a48'; lc.fillRect(x - 36, b.y - 14, 72, 28);
      lc.fillStyle = '#7a3e1a'; for (let k = -32; k < 34; k += 8) lc.fillRect(x + k, b.y - 14, 2, 28);
      lc.fillStyle = '#3a1a0a'; lc.fillRect(x - 38, b.y - 18, 76, 4); lc.fillRect(x - 38, b.y + 14, 76, 4);
    });
    /* dekoracje biomów + zamki (wejścia) */
    const dist2path = (x, y) => { let m = 1e9; Wd.paths.forEach(p => { for (let k = 0; k < p.pts.length - 1; k++) m = Math.min(m, this._segDist(x, y, p.pts[k][0], p.pts[k][1], p.pts[k + 1][0], p.pts[k + 1][1])); }); return m; };
    tiles.forEach(q => {
      const R = this._rng(q.i + 3), n = Math.round(q.rx * q.ry / 520), keep = [{ x: q.ent.x, y: q.ent.y, r: 56 }, ...stalls.map(s => ({ x: s.x, y: s.y, r: 44 }))];
      const dec = []; for (let tries = 0; tries < n * 16 && dec.length < n; tries++) {
        const x = q.cx + (R() * 2 - 1) * q.rx, y = q.cy + (R() * 2 - 1) * q.ry;
        if (!Wd.inLand(x, y) || !Wd.inLand(x - 14, y + 10) || !Wd.inLand(x + 14, y + 10) || Wd.region(x, y) !== q.i) continue;
        if (dist2path(x, y) < 28 || keep.some(k => Math.hypot(x - k.x, y - k.y) < k.r)) continue; dec.push([x, y, .85 + R() * .5]);
      }
      dec.sort((a, b) => a[1] - b[1]).forEach(([x, y, sz]) => this._deco(lc, st[q.i].deco, x, y, sz, st[q.i].lock));
    });
    tiles.forEach(q => this._castle(lc, q.ent.x, q.ent.y, q.i + 1, !q.unlocked, q.i < cleared, q.L.map));
    lc.restore();
    return { sea, land };
  },

  _deco(c, kind, x, y, s, lock) {
    const g = col => lock ? this._mix(col, '#3a3a48', .55) : col;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(2, 2, 11, 4, 0, 0, 7); c.fill();
    switch (kind) {
      case 'tree': c.fillStyle = g('#5a3a1a'); c.fillRect(-2, -8, 4, 9); c.fillStyle = g('#1f7a3a'); c.beginPath(); c.arc(0, -16, 11, 0, 7); c.fill(); c.fillStyle = g('#2fa04a'); c.beginPath(); c.arc(-3, -19, 6, 0, 7); c.fill(); c.fillStyle = g('#16572a'); c.fillRect(-3, -14, 2, 2); c.fillRect(2, -14, 2, 2); break;
      case 'hut': c.fillStyle = g('#6a4a2a'); c.fillRect(-9, -12, 18, 12); c.fillStyle = g('#b0402a'); c.beginPath(); c.moveTo(-12, -12); c.lineTo(0, -22); c.lineTo(12, -12); c.fill(); c.fillStyle = g('#2a1a0a'); c.fillRect(-2, -7, 4, 7); break;
      case 'deadtree': c.strokeStyle = g('#2a2218'); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -18); c.moveTo(0, -10); c.lineTo(-7, -17); c.moveTo(0, -13); c.lineTo(6, -20); c.stroke(); c.fillStyle = g('#2e6a58'); c.beginPath(); c.ellipse(12, 3, 9, 3, 0, 0, 7); c.fill(); break;
      case 'pine': c.fillStyle = g('#4a3418'); c.fillRect(-2, -6, 4, 7); [['#1d5a3a', 0, 13], ['#2a7a4a', -7, 10], ['#348a56', -13, 7]].forEach(([col, dy, w]) => { c.fillStyle = g(col); c.beginPath(); c.moveTo(-w, dy - 4); c.lineTo(0, dy - 18); c.lineTo(w, dy - 4); c.fill(); }); break;
      case 'iceberg': c.fillStyle = g('#a8d4f4'); c.beginPath(); c.moveTo(-10, 0); c.lineTo(-3, -18); c.lineTo(4, -8); c.lineTo(9, -15); c.lineTo(12, 0); c.fill(); c.fillStyle = g('#ffffff'); c.beginPath(); c.moveTo(-3, -18); c.lineTo(0, -4); c.lineTo(4, -8); c.fill(); break;
      case 'crystal': c.fillStyle = g('#8a5ad8'); c.beginPath(); c.moveTo(-8, 0); c.lineTo(-4, -16); c.lineTo(0, 0); c.fill(); c.fillStyle = g('#58d0e8'); c.beginPath(); c.moveTo(-1, 0); c.lineTo(5, -22); c.lineTo(10, 0); c.fill(); break;
      case 'dune': c.fillStyle = g('#d4781e'); c.beginPath(); c.moveTo(-13, 0); c.lineTo(-2, -16); c.lineTo(13, 0); c.fill(); c.fillStyle = g('#f09838'); c.beginPath(); c.moveTo(-2, -16); c.lineTo(2, 0); c.lineTo(13, 0); c.fill(); break;
      case 'box': c.fillStyle = g('#5a6874'); c.fillRect(-9, -12, 18, 12); c.fillStyle = g('#7a8a96'); c.fillRect(-9, -12, 18, 4); c.fillStyle = g('#ffd23a'); c.fillRect(-2, -7, 4, 3); break;
      case 'lava': c.fillStyle = g('#ff6a1a'); c.beginPath(); c.ellipse(0, -2, 13, 6, 0, 0, 7); c.fill(); c.fillStyle = g('#ffd23a'); c.beginPath(); c.ellipse(-2, -3, 7, 3, 0, 0, 7); c.fill(); break;
      case 'pitch': c.fillStyle = g('#7ee06a'); c.fillRect(-12, -9, 24, 12); c.strokeStyle = g('#ffffff'); c.lineWidth = 1.5; c.strokeRect(-12, -9, 24, 12); c.beginPath(); c.moveTo(0, -9); c.lineTo(0, 3); c.stroke(); break;
    }
    c.restore();
  },

  _castle(c, x, y, num, lock, done, map) {
    c.save(); c.translate(x, y);
    const g = col => lock ? this._mix(col, '#3a3a48', .6) : col;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(2, 6, 22, 7, 0, 0, 7); c.fill();
    c.fillStyle = g('#8a8f9c'); c.fillRect(-14, -30, 28, 34); c.fillStyle = g('#b4bac8'); c.fillRect(-14, -30, 28, 6);
    for (let k = -14; k < 14; k += 8) { c.fillStyle = g('#b4bac8'); c.fillRect(k, -36, 5, 7); }
    c.fillStyle = g('#2a2638'); c.fillRect(-5, -12, 10, 16); c.beginPath(); c.arc(0, -12, 5, Math.PI, 0); c.fill();
    c.fillStyle = g('#6a7080'); c.fillRect(-10, -22, 4, 6); c.fillRect(6, -22, 4, 6);
    c.fillStyle = '#3a2a1a'; c.fillRect(-1, -52, 2, 17); c.fillStyle = lock ? '#6a6a76' : done ? '#4ad66a' : '#e8503a'; c.beginPath(); c.moveTo(1, -52); c.lineTo(14, -47); c.lineTo(1, -42); c.fill();
    /* tabliczka z numerem */
    c.fillStyle = '#5a3a1a'; c.fillRect(24, -14, 3, 20); c.fillStyle = '#f4ecd0'; c.fillRect(14, -26, 24, 16); c.strokeStyle = '#3a2a1a'; c.lineWidth = 2; c.strokeRect(14, -26, 24, 16);
    c.font = 'bold 13px "Courier New"'; c.textAlign = 'center'; c.fillStyle = lock ? '#6a6a76' : '#3a2a1a'; c.fillText(String(num), 26, -13);
    if (lock) { c.font = 'bold 16px "Courier New"'; c.fillStyle = '#e0e0e8'; c.fillText('🔒', 0, -38); }
    if (done) { c.font = 'bold 16px "Courier New"'; c.fillStyle = '#4ad66a'; c.fillText('✓', 0, -58); }
    c.restore();
  },

  _stall(c, st, t) {
    const x = st.x, y = st.y;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 3, 28, 8, 0, 0, 7); c.fill();
    const key = st.kind === 'merchant' ? 'merchant' : st.kind === 'smith' ? 'blacksmith' : 'witchstall';
    c.fillStyle = '#6a4a2a'; c.fillRect(x - 24, y - 24, 4, 26); c.fillRect(x + 20, y - 24, 4, 26);
    const aw = st.kind === 'witch' ? ['#6a3a9a', '#a070d8'] : st.kind === 'smith' ? ['#6a6a76', '#aab0bc'] : ['#c8402a', '#f4ecd0'];
    for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? aw[1] : aw[0]; c.fillRect(x - 27 + k * 9, y - 38, 9, 12); }
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 27, y - 27, 54, 2);
    try { Assets.draw(c, key, x, y + 1, st.kind === 'witch' ? 1.3 : 1.5, t, 1, 'idle', 0); } catch (e) {}
    c.font = 'bold 10px "Courier New"'; c.textAlign = 'center'; const nm = trn(st.kind === 'merchant' ? 'Handlarz' : st.kind === 'smith' ? 'Zbrojmistrz' : 'Wiedźma'), w = c.measureText(nm).width + 10;
    c.fillStyle = 'rgba(0,0,0,.8)'; c.fillRect(x - w / 2, y - 54, w, 14); c.fillStyle = '#f2c14e'; c.fillText(nm, x, y - 43);
  },

  /* rysowanie świata (z kamerą podążającą za bohaterem) */
  drawWorld(c, o) {
    const { VW, VH, Wd, tiles, stalls, me, here, t, layer } = o;
    const camX = 2 * Math.round(Math.max(0, Math.min(Wd.W - VW, me.x - VW / 2)) / 2), camY = 2 * Math.round(Math.max(0, Math.min(Wd.H - VH, me.y - VH / 2)) / 2);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
    c.drawImage(layer.sea, camX / 2, camY / 2, VW / 2, VH / 2, 0, 0, VW, VH);
    c.drawImage(layer.land, camX / 2, camY / 2, VW / 2, VH / 2, 0, 0, VW, VH);
    c.translate(-camX, -camY);
    /* nurt rzeki */
    if (Wd.riverX != null) { c.strokeStyle = 'rgba(210,235,255,.75)'; c.lineWidth = 2; for (let k = 0; k < 24; k++) { const y0 = (k * 29 + t / 16) % (Wd.H + 40) - 20; if (y0 < camY - 20 || y0 > camY + VH + 20) continue; c.beginPath(); c.moveTo(Wd.riverAt(y0) - 6, y0); c.lineTo(Wd.riverAt(y0 + 12) + 5, y0 + 12); c.stroke(); } }
    c.textAlign = 'center';
    tiles.forEach(q => { if (q.i === here) { c.font = 'bold 11px "Courier New"'; c.fillStyle = 'rgba(0,0,0,.8)'; c.fillRect(q.ent.x - 36, q.ent.y - 84, 72, 15); c.fillStyle = '#4aa3ff'; c.fillText(trn('TU JESTEŚ'), q.ent.x, q.ent.y - 72); } });
    tiles.forEach(q => { c.font = 'bold 11px "Courier New"'; const nm = trn(q.L.name), w = c.measureText(nm).width + 10; c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(q.ent.x - w / 2, q.ent.y + 8, w, 15); c.fillStyle = q.unlocked ? '#f3e9d2' : '#9a9aa6'; c.fillText(nm, q.ent.x, q.ent.y + 19); });
    stalls.forEach(st => this._stall(c, st, t));
    const key = (typeof Player !== 'undefined' && Player.d) ? Player.spriteKey() : 'player';
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(me.x, me.y, 12, 4, 0, 0, 7); c.fill();
    Assets.draw(c, key, me.x, me.y + 2, 1.6, t, me.face, me.walk ? 'walk' : 'idle', 0);
    c.font = 'bold 9px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('▼', me.x + 1, me.y - 50); c.fillStyle = '#f2c14e'; c.fillText('▼', me.x, me.y - 51);
    c.restore();
  }
});
