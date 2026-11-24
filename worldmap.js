/* ============================================================
   WORLDMAP.JS – v1.4.0: NOWA MAPA ŚWIATA – mała wersja świata
   Ciągły ląd z biomami-wyspami połączonymi ścieżkami (zamek i zielony las → ścieżka → wioska → moczary → most nad rzeką → tajga → …),
   rozmieszczenie "wężykiem" jak dawniej (1–5 w prawo, 6–10 w lewo). Po lądzie chodzi mała wersja bohatera (WASD / strzałki, Shift = szybciej);
   poza lądem i ścieżkami (morze, rzeka poza mostami) przejść się nie da. Gdy staniesz na biomie, pojawia się pytanie o przeniesienie do etapu
   (tylko jeśli poprzednie etapy są pokonane). Chatka wiedźmy pojawia się na moczarach po jej pokonaniu. Kamera podąża za bohaterem.
   ============================================================ */
Object.assign(UI, {
  clearedCount() {
    if (G.dev) return CAMPAIGN.length;
    if (G.modRun) return G.modCleared || 0;
    return (Save.get('campaign') || { cleared: 0 }).cleared || 0;
  },

  /* ---------- układ świata: bloby-biomy, ścieżki, rzeka z mostami ---------- */
  worldLayout(N) {
    const main = N === 10, COLS = 5;
    const xs = main ? [230, 680, 1130, 1800, 2250] : [230, 680, 1130, 1580, 2030];
    const ROWY = [240, 650], W = (main ? 2500 : 2300), H = 880;
    const R = main ? [[190, 105], [120, 98], [150, 125], [125, 115], [125, 110]] : [[170, 105], [130, 100], [150, 120], [130, 110], [130, 105]];
    const blobs = [];
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / COLS); let col = i % COLS; if (row % 2) col = COLS - 1 - col;
      const rr = R[col] || [140, 105], cx = xs[col], cy = ROWY[row % 2] + Math.floor(row / 2) * 410;
      const amp3 = i === 1 ? .2 : .07, ph = [i * 1.7 + .3, i * 2.3 + 1.1, i * .9 + 2.2];
      const poly = [];
      for (let k = 0; k < 56; k++) {
        const th = k / 56 * Math.PI * 2, f = 1 + amp3 * Math.sin(3 * th + ph[0]) + .06 * Math.sin(5 * th + ph[1]) + .035 * Math.sin(8 * th + ph[2]);
        poly.push([cx + Math.cos(th) * rr[0] * f, cy + Math.sin(th) * rr[1] * f]);
      }
      blobs.push({ i, cx, cy, rx: rr[0], ry: rr[1], poly });
    }
    const paths = [], riverX = main ? 1470 : null;
    for (let i = 0; i < N - 1; i++) {
      const A = blobs[i], B = blobs[i + 1], pts = [];
      const bend = (i % 2 ? -1 : 1) * 26 * (A.cy === B.cy ? 1 : 0);
      for (let k = 0; k <= 14; k++) { const u = k / 14, x = A.cx + (B.cx - A.cx) * u, y = A.cy + (B.cy - A.cy) * u + Math.sin(u * Math.PI) * bend; pts.push([x, y]); }
      paths.push({ a: i, b: i + 1, pts });
    }
    const bridges = [];
    if (riverX != null) paths.forEach(p => {
      for (let k = 0; k < p.pts.length - 1; k++) {
        const [x1, y1] = p.pts[k], [x2, y2] = p.pts[k + 1];
        if ((x1 - riverX) * (x2 - riverX) < 0) { const u = (riverX - x1) / (x2 - x1); bridges.push({ x: riverX, y: y1 + (y2 - y1) * u }); }
      }
    });
    const riverAt = y => riverX + 26 * Math.sin(y / 95) + 12 * Math.sin(y / 41);
    return { W, H, blobs, paths, bridges, riverX, riverAt };
  },
  _inPoly(poly, x, y) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; },
  _segDist(px, py, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1; let u = ((px - x1) * dx + (py - y1) * dy) / l; u = Math.max(0, Math.min(1, u)); return Math.hypot(px - (x1 + dx * u), py - (y1 + dy * u)); },
  worldWalkable(Wd, x, y) {
    if (x < 8 || y < 8 || x > Wd.W - 8 || y > Wd.H - 8) return false;
    if (Wd.riverX != null && Math.abs(x - Wd.riverAt(y)) < 26 && !Wd.bridges.some(b => Math.abs(y - b.y) < 22)) return false;
    for (const b of Wd.blobs) if (x > b.cx - b.rx * 1.3 && x < b.cx + b.rx * 1.3 && y > b.cy - b.ry * 1.3 && y < b.cy + b.ry * 1.3 && this._inPoly(b.poly, x, y)) return true;
    for (const p of Wd.paths) for (let k = 0; k < p.pts.length - 1; k++) if (this._segDist(x, y, p.pts[k][0], p.pts[k][1], p.pts[k + 1][0], p.pts[k + 1][1]) < 16) return true;
    return false;
  },

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
    const prompt = document.createElement('div'); prompt.className = 'wm2-prompt hidden'; s.append(prompt);

    const tiles = CAMPAIGN.map((L, i) => ({ i, L, ...Wd.blobs[i], unlocked: i <= cleared || G.dev, done: i < cleared }));
    const sw = tiles.find(t => t.L.boss === 'witch');
    let hut = null;
    if (sw && Player.d && Player.d.witch) {   /* chatka na moczarach – gdzieś w głębi lądu, na południe od środka */
      let hx = sw.cx + sw.rx * .42, hy = sw.cy + sw.ry * .5;
      for (let k = 0; k < 12 && !this._inPoly(sw.poly, hx, hy); k++) { hx += (sw.cx - hx) * .15; hy += (sw.cy - hy) * .15; }
      hut = { x: hx, y: hy };
    }
    const st0 = tiles[Math.max(0, Math.min(N - 1, here >= 0 ? here : Math.min(cleared, N - 1)))];
    const me = { x: st0.cx, y: st0.cy + st0.ry * .25, face: 1, walk: 0 };
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
      if (near.hut) {
        if (canJump) { p.textContent = trn('Chatka Wiedźmy – odwiedzić? (po wizycie wrócisz tam, gdzie byłeś)'); mk('Odwiedź (Enter)', () => { stop(); G.visitWitch(); }); mk('Zostań', () => { dismissed = near.key; showPrompt(); }, 'ghost'); }
        else p.textContent = trn('Chatka Wiedźmy: eliksiry, talizmany szczęścia i ulepszenie eliksiru (zawsze leczy 75% HP). Odwiedzisz ją w trakcie kampanii.');
        return;
      }
      const t = near.t;
      if (!t.unlocked) { p.textContent = `🔒 ${trn('Etap')} ${t.i + 1}: ${trn(t.L.name)} — ${trn('najpierw pokonaj poprzednie etapy.')}`; return; }
      if (opts.fromMenu && !canJump) { p.textContent = `${trn('Etap')} ${t.i + 1}: ${trn(t.L.name)} — ${trn('podgląd (przenoszenie działa w trakcie kampanii, poza walką).')}`; return; }
      p.textContent = `${trn('Etap')} ${t.i + 1}: ${trn(t.L.name)} — ${trn(opts.fromDeath ? 'spróbować tutaj ponownie?' : opts.fromMenu ? 'przenieść się do tego etapu?' : 'wyruszyć do tego etapu?')}`;
      mk(opts.fromMenu ? 'Przenieś się (Enter)' : 'Wyrusz (Enter)', () => enter(t.i));
      mk('Zostań', () => { dismissed = near.key; showPrompt(); }, 'ghost');
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
      for (const q of tiles) if (this._inPoly(q.poly, me.x, me.y)) { n = { key: 't' + q.i, t: q }; break; }
      if (!n && hut && Math.hypot(me.x - hut.x, me.y - hut.y) < 34) n = { key: 'hut', hut: 1 };
      if ((n && n.key) !== (near && near.key)) {
        near = n; if (!n) dismissed = null;
        else if (dismissed && dismissed !== n.key) dismissed = null;
        showPrompt();
        if (n && n.t) { const q = n.t, foes = [...new Set(allFoes(q.L))].map(f => trn((ENEMY_DEFS[f] || { name: f }).name)).join(', '); info.textContent = `${trn('Etap')} ${q.i + 1}: ${trn(q.L.name)} — ${trn('wrogowie')}: ${foes} · ${trn('boss')}: ${trn((ENEMY_DEFS[q.L.boss] || { name: q.L.boss }).name)}`; }
        else if (n && n.hut) info.textContent = trn('Chatka Wiedźmy: eliksiry, talizmany szczęścia i ulepszenie eliksiru (zawsze leczy 75% HP).');
        else info.textContent = defInfo;
      }
      this.drawWorld(c, { VW, VH, Wd, tiles, hut, me, here, t, cleared, N });
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

  /* rysowanie świata (z kamerą podążającą za bohaterem) */
  drawWorld(c, o) {
    const { VW, VH, Wd, tiles, hut, me, here, t, cleared } = o;
    const camX = Math.max(0, Math.min(Wd.W - VW, me.x - VW / 2)), camY = Math.max(0, Math.min(Wd.H - VH, me.y - VH / 2));
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    /* morze */
    const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#1f3f66'); g.addColorStop(1, '#162c4c'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
    c.translate(-Math.round(camX), -Math.round(camY));
    c.fillStyle = 'rgba(255,255,255,.07)';
    for (let i = 0; i < 160; i++) { const x = (i * 211) % Wd.W, y = (i * 137) % Wd.H, w = 10 + (i % 4) * 6 + Math.sin(t / 700 + i) * 3; c.fillRect(x, y, w, 2); }
    /* ścieżki (pod lądem) */
    const road = (w, col) => { c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = w; c.strokeStyle = col; Wd.paths.forEach(p => { c.beginPath(); p.pts.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); }); };
    road(38, '#0c0814');
    Wd.paths.forEach(p => { const open = p.a < cleared || G.dev; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 30; c.strokeStyle = open ? '#b8904a' : '#6a5a6a'; c.beginPath(); p.pts.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); });
    c.setLineDash([8, 10]); Wd.paths.forEach(p => { const open = p.a < cleared || G.dev; c.lineWidth = 2; c.strokeStyle = open ? '#e8d090' : '#7a6a7a'; c.beginPath(); p.pts.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); }); c.setLineDash([]);
    /* rzeka + mosty */
    if (Wd.riverX != null) {
      const river = (w, col) => { c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'butt'; c.beginPath(); for (let y = -10; y <= Wd.H + 10; y += 12) { const x = Wd.riverAt(y); y === -10 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); };
      river(56, '#0c0814'); river(48, '#2f6fd0'); river(30, '#4a8af0');
      c.lineWidth = 2; c.strokeStyle = 'rgba(200,225,255,.7)'; for (let k = 0; k < 18; k++) { const y0 = (k * 53 + t / 18) % (Wd.H + 40) - 20; c.beginPath(); c.moveTo(Wd.riverAt(y0) - 8, y0); c.lineTo(Wd.riverAt(y0 + 14) + 6, y0 + 14); c.stroke(); }
      Wd.bridges.forEach(b => { const x = Wd.riverAt(b.y); c.fillStyle = '#0c0814'; c.fillRect(x - 40, b.y - 22, 80, 44); c.fillStyle = '#8a5a2a'; c.fillRect(x - 38, b.y - 20, 76, 40); c.fillStyle = '#5a3a18'; for (let k = -36; k < 38; k += 9) c.fillRect(x + k, b.y - 20, 2, 40); c.fillStyle = '#3a2410'; c.fillRect(x - 38, b.y - 22, 76, 4); c.fillRect(x - 38, b.y + 18, 76, 4); });
    }
    /* biomy: ląd wypełniony obrazem mapy etapu */
    c.textAlign = 'center';
    for (const q of tiles) {
      if (q.cx + q.rx * 1.4 < camX || q.cx - q.rx * 1.4 > camX + VW || q.cy + q.ry * 1.4 < camY || q.cy - q.ry * 1.4 > camY + VH) continue;
      const im = Assets.maps[q.L.map], pth = () => { c.beginPath(); q.poly.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
      pth(); c.lineJoin = 'round'; c.lineWidth = 12; c.strokeStyle = '#0c0814'; c.stroke();
      c.save(); pth(); c.clip(); c.imageSmoothingEnabled = false;
      const bx = q.cx - q.rx * 1.2, by = q.cy - q.ry * 1.25, bw = q.rx * 2.4, bh = q.ry * 2.5;
      if (im) c.drawImage(im, 0, 0, im.width, im.height, bx, by, bw, bh); else { c.fillStyle = (MAPS[q.L.map] || {}).ground || '#444'; c.fillRect(bx, by, bw, bh); }
      if (!q.unlocked) { c.fillStyle = 'rgba(8,6,16,.62)'; c.fillRect(bx, by, bw, bh); }
      c.restore();
      pth(); c.lineWidth = 4; c.strokeStyle = q.i === here ? '#4aa3ff' : q.done ? '#4ad66a' : q.unlocked ? '#f2c14e' : '#666'; c.stroke();
      c.font = 'bold 12px "Courier New"'; const nm = `${q.i + 1}. ${trn(q.L.name)}`, w = c.measureText(nm).width + 14, ty = q.cy - q.ry - 6;
      c.fillStyle = 'rgba(0,0,0,.82)'; c.fillRect(q.cx - w / 2, ty - 15, w, 20); c.fillStyle = q.unlocked ? '#f3e9d2' : '#999'; c.fillText(nm, q.cx, ty);
      if (!q.unlocked) { c.font = 'bold 30px "Courier New"'; c.fillStyle = '#ccc'; c.fillText('🔒', q.cx, q.cy + 10); }
      if (q.done) { c.font = 'bold 18px "Courier New"'; c.fillStyle = '#4ad66a'; c.fillText('✓', q.cx + q.rx * .8, q.cy - q.ry * .55); }
      if (q.i === here) { c.font = 'bold 11px "Courier New"'; c.fillStyle = '#4aa3ff'; c.fillText(trn('TU JESTEŚ'), q.cx, ty - 22); }
    }
    /* chatka wiedźmy */
    if (hut) {
      c.save(); c.translate(hut.x, hut.y);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 4, 30, 7, 0, 0, 7); c.fill();
      c.fillStyle = '#3a2814'; c.fillRect(-20, -26, 40, 28); c.fillStyle = '#5a4020'; c.fillRect(-18, -24, 36, 24);
      c.fillStyle = '#5a2a7a'; c.beginPath(); c.moveTo(-28, -24); c.lineTo(0, -52); c.lineTo(28, -24); c.closePath(); c.fill();
      c.fillStyle = '#7a4aa0'; c.beginPath(); c.moveTo(-22, -26); c.lineTo(0, -46); c.lineTo(8, -26); c.closePath(); c.fill();
      c.fillStyle = '#ffd24a'; c.fillRect(-4, -18, 8, 10); c.fillStyle = '#6aff6a'; c.globalAlpha = .6 + .3 * Math.sin(t / 240); c.fillRect(12, -14, 6, 6); c.globalAlpha = 1;
      c.restore();
    }
    /* mały bohater */
    const key = (typeof Player !== 'undefined' && Player.d) ? Player.spriteKey() : 'player';
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(me.x, me.y, 12, 4, 0, 0, 7); c.fill();
    Assets.draw(c, key, me.x, me.y + 2, 1.6, t, me.face, me.walk ? 'walk' : 'idle', 0);
    c.font = 'bold 9px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('▼', me.x + 1, me.y - 50); c.fillStyle = '#f2c14e'; c.fillText('▼', me.x, me.y - 51);
    c.restore();
  }
});
