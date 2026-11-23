/* v1.3.1 – MINIGRY ETAPÓW
   1) LAWOWA ZAGADKA (Stara elektrownia, połowa etapu): obracamy sześciokąty z rurami, aż lawa popłynie od źródła do drzwi.
   2) LABIRYNT W PIRAMIDZIE (Pustynia, połowa etapu): ciemny labirynt, widać tylko okolicę bohatera. Cel główny: wyjście na drugą stronę.
      Cel poboczny: skarb (15 pkt) w jednym z ślepych rozwidleń.
   Logika generatorów (Lava.gen, Maze.gen) nie zależy od rysowania – można ją testować w Node (tools/test_minigames.js). */

/* wspólne: cząsteczki i napisy z G.fx (ta sama pętla co w Pong.draw) */
function mgFx(c) {
  G.fx.forEach(f => {
    c.globalAlpha = Math.max(0, f.life);
    if (f.pt) { c.fillStyle = f.c; c.fillRect(f.x, f.y, f.sz, f.sz); }
    else if (f.txt) { c.font = 'bold 18px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(f.txt, f.x + 2, f.y + 2); c.fillStyle = f.c; c.fillText(f.txt, f.x, f.y); }
  });
  c.globalAlpha = 1;
}
function mgBanner(c, y) {
  const b = G.banner; if (!b) return;
  b.t++; const al = Math.min(1, b.t / 25, (170 - b.t) / 30);
  if (al <= 0) { G.banner = null; return; }
  c.globalAlpha = al; c.font = 'bold 20px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(trn(b.txt), 322, y + 2); c.fillStyle = '#f2c14e'; c.fillText(trn(b.txt), 320, y); c.globalAlpha = 1;
}
function mgText(c, txt, x, y, col, size, align) {
  c.font = `bold ${size || 12}px "Courier New"`; c.textAlign = align || 'center'; c.fillStyle = '#000'; c.fillText(txt, x + 1, y + 1); c.fillStyle = col || '#f3e9d2'; c.fillText(txt, x, y);
}

/* ====================================================================================================================
   LAWOWA ZAGADKA – sześciokąty z rurami (kierunki 0..5 zgodnie z ruchem wskazówek zegara od wschodu: E, SE, SW, W, NW, NE)
   ==================================================================================================================== */
const Lava = {
  COLS: 7, ROWS: 5, R: 31, S: null, _kd: {},

  /* sąsiad komórki (q,r) w kierunku d – układ „odd-r” (nieparzyste rzędy przesunięte w prawo) */
  nb(q, r, d) {
    const odd = r & 1, O = odd
      ? [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]]
      : [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
    return [q + O[d][0], r + O[d][1]];
  },
  inside(q, r) { return q >= 0 && r >= 0 && q < this.COLS && r < this.ROWS; },
  has(c, d) { return !!(c.mask & (1 << (((d - c.rot) % 6 + 6) % 6))); },        // czy rura po obrocie ma wyjście w kierunku d

  /* generator: losowa ścieżka źródło -> odpływ (Dijkstra z losowymi wagami), pasujące elementy na ścieżce, losowe „zmyłki”, losowe obroty */
  gen() {
    const C = this.COLS, Rr = this.ROWS, rs = 1 + (Math.random() * 3 | 0), rd = 1 + (Math.random() * 3 | 0);
    const w = {}, key = (q, r) => q + ',' + r;
    for (let q = 0; q < C; q++) for (let r = 0; r < Rr; r++) w[key(q, r)] = 1 + Math.random() * 3.2;
    const dist = {}, prev = {}, open = [[0, rs]]; dist[key(0, rs)] = 0;
    while (open.length) {
      open.sort((a, b) => dist[key(...a)] - dist[key(...b)]);
      const [q, r] = open.shift();
      if (q === C - 1 && r === rd) break;
      for (let d = 0; d < 6; d++) {
        const [nq, nr] = this.nb(q, r, d); if (!this.inside(nq, nr)) continue;
        const nd = dist[key(q, r)] + w[key(nq, nr)];
        if (dist[key(nq, nr)] === undefined || nd < dist[key(nq, nr)]) { dist[key(nq, nr)] = nd; prev[key(nq, nr)] = [q, r, d]; open.push([nq, nr]); }
      }
    }
    const path = []; let cur = [C - 1, rd];
    while (cur) { path.unshift(cur); const p = prev[key(...cur)]; cur = p ? [p[0], p[1]] : null; }
    const grid = [];
    for (let r = 0; r < Rr; r++) { grid[r] = []; for (let q = 0; q < C; q++) grid[r][q] = { q, r, mask: 0, rot: 0, a: 0, onPath: false }; }
    for (let i = 0; i < path.length; i++) {
      const [q, r] = path[i]; let inD, outD;
      if (i === 0) inD = 3; else { const p = prev[key(q, r)]; inD = (p[2] + 3) % 6; }
      if (i === path.length - 1) outD = 0; else { const n = prev[key(...path[i + 1])]; outD = n[2]; }
      grid[r][q].mask = (1 << inD) | (1 << outD); grid[r][q].onPath = true;
    }
    const SH = [0b001001, 0b000101, 0b000101, 0b010101, 0b000011];                 // prosta, zakręt 120°, zakręt 120°, trójnik, ostry zakręt 60°
    for (let r = 0; r < Rr; r++) for (let q = 0; q < C; q++) if (!grid[r][q].onPath) grid[r][q].mask = SH[Math.random() * SH.length | 0];
    const st = { grid, rs, rd, path, moves: 0, done: false, flow: 0, door: 0, sel: [Math.floor(C / 2), rs], t: 0, hint: 420, end: 0 };
    let tries = 0;
    do { for (const row of grid) for (const c of row) { c.rot = Math.random() * 6 | 0; c.a = c.rot * Math.PI / 3; } tries++; } while (this.solved(st) && tries < 50);
    return st;
  },

  /* przepływ lawy: BFS od źródła przez dopasowane krawędzie; zwraca {dist, win} */
  flowOf(st) {
    const g = st.grid, dist = {}, k = (q, r) => q + ',' + r; let win = false;
    const s = g[st.rs][0]; if (!this.has(s, 3)) return { dist, win };
    dist[k(0, st.rs)] = 0; const queue = [[0, st.rs]];
    while (queue.length) {
      const [q, r] = queue.shift(), c = g[r][q];
      if (q === this.COLS - 1 && r === st.rd && this.has(c, 0)) win = true;
      for (let d = 0; d < 6; d++) {
        if (!this.has(c, d)) continue;
        const [nq, nr] = this.nb(q, r, d); if (!this.inside(nq, nr) || dist[k(nq, nr)] !== undefined) continue;
        if (this.has(g[nr][nq], (d + 3) % 6)) { dist[k(nq, nr)] = dist[k(q, r)] + 1; queue.push([nq, nr]); }
      }
    }
    return { dist, win };
  },
  solved(st) { return this.flowOf(st).win; },

  /* ---------- układ na ekranie ---------- */
  cx(q, r) { const w = Math.sqrt(3) * this.R; return 150 + w / 2 + w * (q + ((r & 1) ? .5 : 0)); },
  cy(r) { return 88 + 1.5 * this.R * r; },
  hit(x, y) {
    let best = null;
    for (let r = 0; r < this.ROWS; r++) for (let q = 0; q < this.COLS; q++) {
      const d = Math.hypot(x - this.cx(q, r), y - this.cy(r)); if (d < this.R * .9 && (!best || d < best.d)) best = { q, r, d };
    }
    return best;
  },

  start() {
    const p = G.p; G.state = 'lava'; G.sel = null; G.nextBub();
    p.alpha = 1; p.nobar = 1; G.actors = []; G.enemies = [];
    this.S = this.gen(); this.mouse = null;
    if (!this._mm) { this._mm = true; G.cv.addEventListener('mousemove', e => { const r = G.cv.getBoundingClientRect(); this.mouse = { x: (e.clientX - r.left) * 640 / r.width, y: (e.clientY - r.top) * 320 / r.height }; }); }
    G.banner = { txt: 'Stara elektrownia – lawowa zagadka!', t: 0 };
    UI.log('MINIGRA: lawowa zagadka! Klikaj sześciokąty (lub strzałki + Spacja), aby obracać rury – połącz źródło lawy z drzwiami.', 'crit');
    UI.hud();
  },

  rotate(q, r) {
    const st = this.S; if (!st || st.done) return;
    const c = st.grid[r][q]; c.rot = (c.rot + 1) % 6; c.ta = (c.ta === undefined ? c.a : c.ta) + Math.PI / 3; st.moves++; st.hint = 0;
    G.burst(this.cx(q, r), this.cy(r), '#9aa0b0', 5);
    if (this.solved(st)) { st.done = true; st.flow = 0; st.door = 0; st.end = 0; UI.log('Lawa płynie! Drzwi zaczynają się otwierać…', 'good'); }
  },

  click(x, y) {
    const h = this.hit(x, y); if (!h) return;
    this.S.sel = [h.q, h.r]; this.rotate(h.q, h.r);
  },

  tick() {
    const st = this.S; if (!st || G.state !== 'lava' || UI.menuOpen) return;
    st.t++; if (st.hint > 0) st.hint--;
    const fl = this.flowOf(st); st.D = fl.dist;
    const front = 1e9;
    for (const row of st.grid) for (const c of row) {
      /* sprężysty obrót (lekkie „przestrzelenie” i wahnięcie) */
      const target = c.ta !== undefined ? c.ta : c.a; c.va = (c.va || 0) + (target - c.a) * .24; c.va *= .72; c.a += c.va;
      if (Math.abs(target - c.a) < .004 && Math.abs(c.va) < .004) { c.a = target; c.va = 0; }
      /* lawa wpływa do rury stopniowo (z opóźnieniem wg odległości od źródła) i wycofuje się z sykiem pary */
      const k = c.q + ',' + c.r, d = st.D[k], was = c.f || 0;
      if (d !== undefined && d <= front) { if (c.rt === undefined) c.rt = st.t; if (st.t - c.rt >= d * 5) c.f = Math.min(1, was + .07); }
      else { c.rt = undefined; c.f = Math.max(0, was - .12); if (was > .5 && (c.f || 0) <= .5) for (let i = 0; i < 6; i++) G.fx.push({ x: this.cx(c.q, c.r) + (Math.random() - .5) * 20, y: this.cy(c.r), vx: (Math.random() - .5), vy: -.8 - Math.random(), g: -.02, dl: .03, life: .8, c: '#d8dce8', sz: 3, pt: 1 }); }
    }
    if (Math.random() < .06) G.fx.push({ x: 40 + Math.random() * 70, y: this.cy(st.rs) - 20, vx: (Math.random() - .5), vy: -1.4 - Math.random(), g: .06, life: .8, c: '#ffb040', sz: 3, pt: 1 });   // pluski lawy w źródle
    /* sterowanie klawiaturą: strzałki przesuwają kursor, Spacja/Enter obraca */
    const dn = a => G.isDown(a), edge = (n, v) => { const r = v && !this._kd[n]; this._kd[n] = v; return r; };
    if (!st.done) {
      let [q, r] = st.sel;
      if (edge('l', dn('left'))) q = Math.max(0, q - 1); if (edge('r', dn('right'))) q = Math.min(this.COLS - 1, q + 1);
      if (edge('u', dn('up'))) r = Math.max(0, r - 1); if (edge('d', dn('down'))) r = Math.min(this.ROWS - 1, r + 1);
      st.sel = [q, r];
      if (edge('k', dn('jump') || dn('interact'))) this.rotate(q, r);
    } else {
      st.flow = Math.min(1, st.flow + .012);
      const last = st.grid[st.rd][this.COLS - 1];
      if ((last.f || 0) >= .99) { st.door = Math.min(1, st.door + .02); if (st.door < 1 && Math.random() < .5) G.fx.push({ x: this.cx(this.COLS - 1, st.rd) + 58 + (Math.random() - .5) * 40, y: this.cy(st.rd) - 52 + Math.random() * 12, vx: (Math.random() - .5) * 2, vy: -1 - Math.random(), g: .05, life: .7, c: '#ffd890', sz: 2, pt: 1 }); }
      if (st.door >= 1 && ++st.end > 70 && !st.fin) { st.fin = true; G.miniWin('Lawa otworzyła drzwi elektrowni!', 2, 'Zagadka rozwiązana w ' + st.moves + ' ruchach.'); }
      if (Math.random() < .3) G.fx.push({ x: this.cx(this.COLS - 1, st.rd) + 30 + Math.random() * 20, y: this.cy(st.rd) + (Math.random() - .5) * 40, vx: 1 + Math.random(), vy: -1.2, life: .8, c: '#ffb040', sz: 3, pt: 1 });
    }
  },

  /* ---------- rysowanie ---------- */
  hexPath(c, x, y, R) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } c.closePath(); },
  draw(c) {
    const st = this.S; if (!st) return; const R = this.R, t = G.t || 0;
    c.save(); c.clearRect(0, 0, 640, 320);
    /* tło: hala elektrowni */
    const bg = c.createLinearGradient(0, 0, 0, 320); bg.addColorStop(0, '#1b1a24'); bg.addColorStop(1, '#2c2a36'); c.fillStyle = bg; c.fillRect(0, 0, 640, 320);
    c.fillStyle = '#22212c'; for (let x = 0; x < 640; x += 64) c.fillRect(x, 0, 2, 320); for (let y = 30; y < 320; y += 64) c.fillRect(0, y, 640, 2);
    c.fillStyle = '#3a3846'; c.fillRect(0, 0, 640, 26); c.fillStyle = '#ffd24a'; for (let x = 0; x < 640; x += 40) c.fillRect(x, 22, 20, 4);   // pasy ostrzegawcze
    const D = st.D || {};
    /* źródło lawy (po lewej) */
    const sy = this.cy(st.rs), sx = this.cx(0, st.rs) - Math.sqrt(3) * R / 2;
    const lg = c.createLinearGradient(40, 0, 130, 0); lg.addColorStop(0, '#ff7a20'); lg.addColorStop(1, '#ffd24a');
    c.fillStyle = '#14101a'; c.fillRect(20, sy - 34, 96, 68); c.fillStyle = lg; c.fillRect(24, sy - 30, 88, 60);
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(255,240,160,${.4 + .3 * Math.sin(t / 200 + i)})`; c.beginPath(); c.arc(34 + i * 14, sy - 16 + Math.sin(t / 300 + i * 2) * 10 + (i % 2) * 18, 4 + (i % 3), 0, 7); c.fill(); }
    mgText(c, trn('ŹRÓDŁO LAWY'), 68, sy - 40, '#ffb060', 10);
    c.strokeStyle = '#4a4a58'; c.lineWidth = 12; c.lineCap = 'butt'; c.beginPath(); c.moveTo(114, sy); c.lineTo(sx, sy); c.stroke();
    c.strokeStyle = D['0,' + st.rs] !== undefined ? '#ff9a30' : '#201c24'; c.lineWidth = 6; c.beginPath(); c.moveTo(114, sy); c.lineTo(sx, sy); c.stroke();
    /* kafelki */
    for (let r = 0; r < this.ROWS; r++) for (let q = 0; q < this.COLS; q++) {
      const cell = st.grid[r][q], x = this.cx(q, r), y = this.cy(r), sel = st.sel[0] === q && st.sel[1] === r, hov = this.mouse && (() => { const h = this.hit(this.mouse.x, this.mouse.y); return h && h.q === q && h.r === r; })();
      this.hexPath(c, x, y, R - 1); c.fillStyle = sel || hov ? '#4c4a5c' : '#383646'; c.fill();
      this.hexPath(c, x, y, R - 1); c.lineWidth = 2; c.strokeStyle = sel ? '#f2c14e' : '#14121a'; c.stroke();
      this.hexPath(c, x, y, R - 6); c.lineWidth = 1; c.strokeStyle = '#46445a'; c.stroke();
      const lf = cell.f || 0, lava = lf > .02, pop = Math.min(1, Math.max(0, (st.t - (q + r) * 3) / 16));
      if (pop <= 0) continue;
      c.save(); c.translate(x, y); const ps = pop < 1 ? .3 + .7 * (1 - Math.pow(1 - pop, 3)) : 1; c.scale(ps, ps); c.translate(-x, -y);
      for (let d = 0; d < 6; d++) {
        if (!(cell.mask & (1 << d))) continue;
        const ang = d * Math.PI / 3 + cell.a, L = Math.sqrt(3) * R / 2, ex = x + Math.cos(ang) * L, ey = y + Math.sin(ang) * L;
        c.lineCap = 'round'; c.strokeStyle = '#5a5a6c'; c.lineWidth = 12; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
        c.strokeStyle = '#1c1a22'; c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
        if (lava) { const fx = x + (ex - x) * lf, fy = y + (ey - y) * lf; c.strokeStyle = `rgb(255,${150 + 40 * Math.sin(t / 150 + q + r) | 0},40)`; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(fx, fy); c.stroke(); c.strokeStyle = '#ffe9a0'; c.lineWidth = 1.5; c.stroke(); }
      }
      c.fillStyle = lava ? '#ffb040' : '#5a5a6c'; c.beginPath(); c.arc(x, y, 6.5, 0, 7); c.fill(); c.fillStyle = lava ? '#ffe9a0' : '#2a2832'; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill();
      c.lineCap = 'butt'; c.restore();
    }
    /* drzwi (po prawej) */
    const dy = this.cy(st.rd), dx = this.cx(this.COLS - 1, st.rd) + Math.sqrt(3) * R / 2;
    c.strokeStyle = '#4a4a58'; c.lineWidth = 12; c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + 30, dy); c.stroke();
    const wl = (st.grid[st.rd][this.COLS - 1].f || 0) >= .99;
    c.strokeStyle = wl ? '#ff9a30' : '#201c24'; c.lineWidth = 6; c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + 30, dy); c.stroke();
    c.fillStyle = '#0c0a10'; c.fillRect(dx + 30, dy - 52, 52, 104);                                          // wnęka
    const open = st.door * 96;
    if (st.door > 0) { const gg = c.createLinearGradient(dx + 30, 0, dx + 82, 0); gg.addColorStop(0, '#ffd890'); gg.addColorStop(1, '#fff6d0'); c.fillStyle = gg; c.fillRect(dx + 32, dy - 50, 48, 100); }
    c.save(); if (st.door > 0 && st.door < 1) c.translate((Math.random() - .5) * 1.6, 0); c.beginPath(); c.rect(dx + 28, dy - 52, 56, 104); c.clip();
    c.fillStyle = '#5a5668'; c.fillRect(dx + 32, dy - 50 - open, 48, 100); c.fillStyle = '#6e6a80'; c.fillRect(dx + 32, dy - 50 - open, 48, 6);
    c.fillStyle = '#3c394a'; for (let i = 0; i < 5; i++) c.fillRect(dx + 32, dy - 40 - open + i * 20, 48, 3);
    c.fillStyle = st.door >= 1 ? '#5aff7a' : wl ? '#ff9a30' : (t % 800 < 400 ? '#7a1a1a' : '#3a0c0c'); c.beginPath(); c.arc(dx + 56, dy - open, 8, 0, 7); c.fill();       // lampka
    c.restore();
    mgText(c, trn(st.door >= 1 ? 'OTWARTE' : 'DRZWI'), dx + 56, dy - 60, st.door >= 1 ? '#7aff9a' : '#ffb060', 10);
    /* teksty */
    mgText(c, trn('LAWOWA ZAGADKA – obracaj rury, by lawa dopłynęła do drzwi'), 320, 16, '#ffd24a', 12);
    mgText(c, `${trn('Ruchy')}: ${st.moves}`, 600, 312, '#f3e9d2', 11, 'right');
    if (st.hint > 0) { c.globalAlpha = Math.min(1, st.hint / 40); c.fillStyle = '#000b'; c.fillRect(110, 292, 420, 22); mgText(c, trn('Klik w sześciokąt = obrót o 60° · strzałki + Spacja – to samo z klawiatury'), 320, 307, '#f3e9d2', 11); c.globalAlpha = 1; }
    mgFx(c); mgBanner(c, 62);
    c.restore(); c.globalAlpha = 1;
    if (G.fade > 0) { c.fillStyle = `rgba(0,0,0,${G.fade})`; c.fillRect(0, 0, 640, 320); }
  }
};

/* ====================================================================================================================
   LABIRYNT W PIRAMIDZIE
   ==================================================================================================================== */
const Maze = {
  CW: 15, CH: 7, T: 18, VIS: 60, S: null,

  /* generator: „recursive backtracker” na komórkach; kafelki 2*CW+1 x 2*CH+1. Zwraca siatkę, wejście, wyjście, ścieżkę i skarb */
  gen() {
    const CW = this.CW, CH = this.CH, W = 2 * CW + 1, H = 2 * CH + 1, g = [];
    for (let y = 0; y < H; y++) g.push(new Array(W).fill(1));
    const seen = {}, k = (x, y) => x + ',' + y, stack = [[0, CH >> 1]]; seen[k(0, CH >> 1)] = 1; g[2 * (CH >> 1) + 1][1] = 0;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const nbs = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < CW && ny < CH && !seen[k(nx, ny)]);
      if (!nbs.length) { stack.pop(); continue; }
      const [nx, ny, dx, dy] = nbs[Math.random() * nbs.length | 0];
      seen[k(nx, ny)] = 1; g[2 * ny + 1][2 * nx + 1] = 0; g[2 * y + 1 + dy][2 * x + 1 + dx] = 0; stack.push([nx, ny]);
    }
    const sy = CH >> 1, ey = Math.random() * CH | 0;
    g[2 * sy + 1][0] = 0; g[2 * ey + 1][W - 1] = 0;                                                  // wejście z lewej, wyjście z prawej
    /* ścieżka rozwiązania (BFS po komórkach) */
    const open = (x, y, dx, dy) => g[2 * y + 1 + dy][2 * x + 1 + dx] === 0;
    const prev = {}, q = [[0, sy]]; prev[k(0, sy)] = null;
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= CW || ny >= CH || prev[k(nx, ny)] !== undefined || !open(x, y, dx, dy)) continue;
        prev[k(nx, ny)] = [x, y]; q.push([nx, ny]);
      }
    }
    const path = []; let cur = [CW - 1, ey]; while (cur) { path.unshift(cur); cur = prev[k(...cur)]; }
    const onPath = {}; path.forEach(p => onPath[k(...p)] = 1);
    /* skarb: ślepy zaułek z dala od ścieżki głównej (w jednym z rozwidleń) */
    const dist = {}, q2 = path.map(p => { dist[k(...p)] = 0; return p; });
    while (q2.length) {
      const [x, y] = q2.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= CW || ny >= CH || dist[k(nx, ny)] !== undefined || !open(x, y, dx, dy)) continue;
        dist[k(nx, ny)] = dist[k(x, y)] + 1; q2.push([nx, ny]);
      }
    }
    const deg = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < CW && ny < CH && open(x, y, dx, dy); }).length;
    let cands = [];
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (!onPath[k(x, y)] && deg(x, y) === 1 && dist[k(x, y)] >= 3) cands.push([x, y, dist[k(x, y)]]);
    if (!cands.length) for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (!onPath[k(x, y)] && dist[k(x, y)] >= 1) cands.push([x, y, dist[k(x, y)]]);
    cands.sort((a, b) => b[2] - a[2]); const top = cands.slice(0, Math.min(5, cands.length)), tr = top[Math.random() * top.length | 0];
    return { g, W, H, sy, ey, path, treasure: tr ? [tr[0], tr[1]] : null };
  },

  start() {
    const p = G.p; G.state = 'maze'; G.sel = null; G.nextBub();
    const M = this.gen(), T = this.T;
    this.ox = Math.round((640 - M.W * T) / 2); this.oy = Math.round((320 - M.H * T) / 2);
    this.S = { M, x: this.ox + T / 2, y: this.oy + (2 * M.sy + 1) * T + T / 2, face: 1, walk: 0, got: false, found: false, t: 0, exit: 0, hint: 420, seen: {}, step: 0, chest: 0 };
    p.alpha = 1; p.nobar = 1; p.scale = .5; p.pose = ''; p.ox = p.oy = 0; p.freeze = null; p.dest = null; G.mark = null; G.actors = []; G.enemies = [];
    if (!this.dark) { this.dark = document.createElement('canvas'); this.dark.width = 640; this.dark.height = 320; }
    G.banner = { txt: 'Piramida – labirynt w ciemności!', t: 0 };
    UI.log('MINIGRA: labirynt w piramidzie! WASD/strzałki – ruch. Znajdź wyjście na drugą stronę. Poboczny cel: skarb (15 pkt) w jednym ze ślepych rozwidleń.', 'crit');
    UI.hud();
  },

  wall(px, py) {
    const M = this.S.M, tx = Math.floor((px - this.ox) / this.T), ty = Math.floor((py - this.oy) / this.T);
    if (tx < 0 || ty < 0 || tx >= M.W || ty >= M.H) return true;
    return M.g[ty][tx] === 1;
  },
  blocked(x, y) { const h = 5; return this.wall(x - h, y - h) || this.wall(x + h, y - h) || this.wall(x - h, y + h) || this.wall(x + h, y + h); },

  tick() {
    const st = this.S; if (!st || G.state !== 'maze' || UI.menuOpen) return;
    st.t++; if (st.hint > 0) st.hint--;
    const M = st.M, T = this.T;
    if (st.exit > 0) { st.exit++; if (st.exit === 40 && !st.fin) { st.fin = true; G.miniWin(st.got ? 'Wyszedłeś z piramidy ze skarbem!' : 'Wyszedłeś z piramidy.', 2, st.got ? 'Skarb: +15 pkt!' : 'Skarbu nie znalazłeś – może następnym razem?'); } return; }
    const d = a => G.isDown(a); let dx = (d('right') ? 1 : 0) - (d('left') ? 1 : 0), dy = (d('down') ? 1 : 0) - (d('up') ? 1 : 0);
    const sp = d('sprint') ? 2.4 : 1.6, len = Math.hypot(dx, dy) || 1; dx = dx / len * sp; dy = dy / len * sp;
    if (dx && !this.blocked(st.x + dx, st.y)) st.x += dx;
    if (dy && !this.blocked(st.x, st.y + dy)) st.y += dy;
    st.walk = (dx || dy) ? 1 : 0; if (dx) st.face = dx > 0 ? 1 : -1;
    /* odkryte kafelki (blada pamięć) */
    const tx = Math.floor((st.x - this.ox) / T), ty = Math.floor((st.y - this.oy) / T), R = Math.ceil(this.VIS / T);
    for (let yy = ty - R; yy <= ty + R; yy++) for (let xx = tx - R; xx <= tx + R; xx++) if (Math.hypot((xx + .5) * T - (st.x - this.ox), (yy + .5) * T - (st.y - this.oy)) < this.VIS - 6) st.seen[xx + ',' + yy] = 1;
    /* kurz spod stóp */
    if ((dx || dy) && ++st.step % 9 === 0) G.fx.push({ x: st.x - st.face * 3 + (Math.random() - .5) * 3, y: st.y + 6, vx: -st.face * .3, vy: -.25, g: -.005, dl: .05, life: .7, c: '#8a6a38', sz: 2, pt: 1 });
    if (st.got && st.chest < 60) st.chest++;
    /* skarb */
    if (M.treasure && !st.got) {
      const cx = this.ox + (2 * M.treasure[0] + 1) * T + T / 2, cy = this.oy + (2 * M.treasure[1] + 1) * T + T / 2;
      if (Math.hypot(st.x - cx, st.y - cy) < 11) {
        st.got = true; Player.addPts(15); UI.hud();
        G.text({ x: cx, y: cy, ox: 0, oy: 0, scale: 1, key: 'hero' }, '+15 pkt!', '#ffd24a', true);
        for (let i = 0; i < 26; i++) G.fx.push({ x: cx, y: cy, vx: (Math.random() - .5) * 5, vy: -Math.random() * 4, life: 1, c: i % 2 ? '#ffd24a' : '#fff0a0', sz: 3, pt: 1 });
        UI.log('Znalazłeś SKARB! +15 pkt umiejętności.', 'good');
      }
    }
    /* wyjście: prawa krawędź w rzędzie wyjścia */
    if (tx >= M.W - 1 && ty === 2 * M.ey + 1) { st.exit = 1; G.text({ x: st.x, y: st.y, ox: 0, oy: 0, scale: 1, key: 'hero' }, 'WYJŚCIE!', '#7aff9a', true); }
    if (Math.random() < .05) G.fx.push({ x: st.x + (Math.random() - .5) * 30, y: st.y + (Math.random() - .5) * 20, vx: 0, vy: -.3, g: -.01, dl: .03, life: .7, c: '#ffcc66', sz: 1, pt: 1 });   // pyłek w świetle pochodni
  },

  draw(c) {
    const st = this.S; if (!st) return; const M = st.M, T = this.T, ox = this.ox, oy = this.oy;
    c.save(); c.clearRect(0, 0, 640, 320);
    c.fillStyle = '#0a0806'; c.fillRect(0, 0, 640, 320);
    /* kafelki: ściany z piaskowca i podłoga */
    for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) {
      const px = ox + x * T, py = oy + y * T;
      if (M.g[y][x] === 1) {
        c.fillStyle = '#a07a34'; c.fillRect(px, py, T, T); c.fillStyle = '#c8a05a'; c.fillRect(px, py, T, 2); c.fillRect(px, py, 2, T);
        c.fillStyle = '#6a4e20'; c.fillRect(px, py + T - 2, T, 2); c.fillRect(px + T - 2, py, 2, T);
        if ((x + y) % 3 === 0) { c.fillStyle = '#8a6528'; c.fillRect(px + 4, py + 6, 8, 2); }
      } else {
        c.fillStyle = (x + y) % 2 ? '#43341c' : '#3b2d18'; c.fillRect(px, py, T, T);
        if ((x * 7 + y * 3) % 5 === 0) { c.fillStyle = '#54421f'; c.fillRect(px + 5, py + 5, 3, 2); }
      }
    }
    /* wejście i wyjście */
    const ex = ox + (M.W - 1) * T, ey = oy + (2 * M.ey + 1) * T;
    const eg = c.createLinearGradient(ex, 0, ex + T, 0); eg.addColorStop(0, '#ffe9a0'); eg.addColorStop(1, '#fff8dc'); c.fillStyle = eg; c.fillRect(ex, ey, T, T);
    c.globalAlpha = .35 + .15 * Math.sin(st.t / 12); c.fillStyle = '#fff8dc'; c.fillRect(ex - 22, ey - 4, 22, T + 8); c.globalAlpha = 1;   // wiązka światła z wyjścia
    mgText(c, '►', ex + 8, ey + 12, '#7a4a10', 12);
    mgText(c, '►', ox + 8, oy + (2 * M.sy + 1) * T + 12, '#c8a05a', 10);
    /* skarb */
    if (M.treasure) {                                                              // skrzynia: po zebraniu otwiera się wieko i leci złoto
      const cx = ox + (2 * M.treasure[0] + 1) * T + T / 2, cy = oy + (2 * M.treasure[1] + 1) * T + T / 2, bob = st.got ? 0 : Math.sin(st.t / 15) * 1, op = st.got ? Math.min(1, st.chest / 14) : 0;
      c.fillStyle = '#5a3412'; c.fillRect(cx - 6, cy - 3 + bob, 12, 8); c.fillStyle = '#ffd24a'; c.fillRect(cx - 6, cy + 1 + bob, 12, 1);
      if (st.got) { c.fillStyle = '#ffd24a'; c.fillRect(cx - 5, cy - 3, 10, 2); c.fillStyle = '#fff0a0'; c.fillRect(cx - 3, cy - 4, 2, 1); c.fillRect(cx + 1, cy - 4, 2, 1); }
      c.save(); c.translate(cx - 6, cy - 3 + bob); c.rotate(-op * 1.4); c.fillStyle = '#8a5a22'; c.fillRect(0, -2, 12, 3); c.fillStyle = '#ffd24a'; c.fillRect(5, -1, 2, 3); c.restore();
      if (!st.got && st.t % 40 < 8) { c.fillStyle = '#fff'; c.fillRect(cx + 4, cy - 7, 2, 2); }
      if (st.got && st.chest < 40) { const g = c.createRadialGradient(cx, cy, 2, cx, cy, 30); g.addColorStop(0, `rgba(255,230,120,${.5 * (1 - st.chest / 40)})`); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.fillRect(cx - 30, cy - 30, 60, 60); }
    }
    /* bohater (pomniejszona wersja) */
    const p = G.p; p.x = st.x; p.y = st.y + 7; p.ox = p.oy = 0; p.scale = .5; p.face = st.face; p.walk = st.walk;
    G.top = []; G.drawActor(p); G.top.forEach(f => f(c));
    mgFx(c);   // cząsteczki rysujemy PRZED ciemnością – poza światłem nie widać nic
    /* CIEMNOŚĆ: widać tylko okolicę bohatera (płomień pochodni lekko migocze); odwiedzone kafelki tylko blado */
    const d = this.dark.getContext('2d'); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, 640, 320); d.fillStyle = 'rgba(4,3,2,.985)'; d.fillRect(0, 0, 640, 320);
    d.globalCompositeOperation = 'destination-out';
    d.fillStyle = 'rgba(0,0,0,.30)';
    for (const key in st.seen) { const [xx, yy] = key.split(',').map(Number); d.fillRect(ox + xx * T, oy + yy * T, T, T); }
    const fl = this.VIS + Math.sin(st.t / 7) * 2 + Math.sin(st.t / 3.1) * 1.2, gr = d.createRadialGradient(st.x, st.y, 4, st.x, st.y, fl);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(0,0,0,.92)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.beginPath(); d.arc(st.x, st.y, fl, 0, 7); d.fill();
    c.drawImage(this.dark, 0, 0);
    c.globalCompositeOperation = 'lighter'; const wg = c.createRadialGradient(st.x, st.y, 2, st.x, st.y, fl); wg.addColorStop(0, 'rgba(255,170,70,.20)'); wg.addColorStop(1, 'rgba(255,120,30,0)'); c.fillStyle = wg; c.beginPath(); c.arc(st.x, st.y, fl, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
    /* interfejs */
    mgText(c, trn('PIRAMIDA – znajdź wyjście na drugą stronę'), 320, 12, '#ffd24a', 11);
    mgText(c, `${trn('Skarb')} (15 ${trn('pkt')}): ${st.got ? '✓' : '?'}`, 632, 316, st.got ? '#7aff9a' : '#c8a05a', 11, 'right');
    if (st.hint > 0) { c.globalAlpha = Math.min(1, st.hint / 40); c.fillStyle = '#000b'; c.fillRect(150, 296, 340, 18); mgText(c, trn('WASD / strzałki – ruch · Shift – szybciej'), 320, 309, '#f3e9d2', 11); c.globalAlpha = 1; }
    mgBanner(c, 40);
    if (st.t < 30) { c.fillStyle = `rgba(0,0,0,${1 - st.t / 30})`; c.fillRect(0, 0, 640, 320); }   // płynne wejście do piramidy
    if (st.exit > 0) { c.fillStyle = `rgba(255,248,220,${Math.min(1, st.exit / 40)})`; c.fillRect(0, 0, 640, 320); }
    c.restore(); c.globalAlpha = 1;
    if (G.fade > 0) { c.fillStyle = `rgba(0,0,0,${G.fade})`; c.fillRect(0, 0, 640, 320); }
  }
};
if (typeof module !== 'undefined') module.exports = { Lava, Maze };
