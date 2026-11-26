/* ============================================================
   PONG.JS – MINIGRA NA STADIONIE: PIŁKARSKI HOKEJ POWIETRZNY (v1.4.0 – przepisana; poprzednia wersja była zbugowana)
   Mroczny stadion, fala 6 (zamiast zwykłej walki). Boisko piłkarskie z góry: po lewej bramka gracza, po prawej bramka przeciwnika.
   Zamiast krążków grają dwie postacie: BOHATER (lewa połowa) i BRAMKARZ (prawa połowa), zamiast krążka jest PIŁKA.
   Uderzasz piłkę swoim zawodnikiem (kontakt = kopnięcie) – kto pierwszy zdobędzie 5 goli, wygrywa.
   Sterowanie: MYSZ / DOTYK (zawodnik podąża za kursorem) albo WASD / strzałki (Shift = szybciej).
   Wygrana -> nagroda (G.pongWin) i przejście do fali 7. Porażka -> rewanż (bez kary).
   Logika (Pong.step) jest niezależna od rysowania i od DOM, żeby dało się ją testować w Node (tools/test_pong.js).
   ============================================================ */
const Pong = {
  W: 640, H: 320, L: 16, R: 624, T: 16, B: 304, C: 14, MID: 320, GY0: 112, GY1: 208,   // stół, promień rogów, otwór bramki (y)
  MR: 20, PR: 10, WIN: 5, MAXV: 15, FRIC: .9935, PS: 14, KS: 7.2, AS: 6.0,                // pałka, krążek, limity prędkości
  S: null, mx: 320, my: 160, useMouse: false,

  /* ---------- stan ---------- */
  fresh(keepScore) {
    const o = this.S && keepScore ? this.S : { me: 0, ai: 0, t: 0, hint: 360, shake: 0, flash: 0, last: 'me', final: null, parts: [] };
    const side = o.last;                                                           // krążek trafia na połowę tego, kto stracił gola (na starcie – gracza)
    o.puck = { x: side === 'me' ? 190 : 450, y: 160, vx: 0, vy: 0, rot: 0 };
    o.hero = { x: 90, y: 160, vx: 0, vy: 0, px: 90, py: 160 };
    o.kp = { x: 550, y: 160, vx: 0, vy: 0, px: 550, py: 160 };
    o.ai_ = { mode: 'home', t: 0, aim: 160, react: 0, ty: 160, tx: 550 };
    o.phase = 'serve'; o.timer = 75; o.msg = ''; o.msgT = 0; o.tail = [];
    this.S = o; return o;
  },

  /* ---------- start minigry ---------- */
  start() {
    const p = G.p;
    G.state = 'pong'; G.sel = null; G.nextBub(); G.mark = null; G.actors = []; G.enemies = [];
    p.nobar = 1; p.ox = p.oy = 0; p.alpha = 1; p.pose = ''; p.jumping = 0; p.freeze = null; p.dest = null;
    this.S = null; this.fresh(false); this.onEnd = false; this.useMouse = false; this.mx = 130; this.my = 160;
    this.bind();
    G.banner = { txt: 'Mecz na stadionie!', t: 0 };
    UI.log('MINIGRA: mecz na stadionie! Mysz / dotyk albo WASD / strzałki – ruszasz bohaterem, uderz piłkę do bramki Bramkarza. Kto pierwszy zdobędzie 5 goli?', 'crit');
    UI.hud();
  },
  /* mysz i dotyk: pałka podąża za kursorem (podpinane raz) */
  bind() {
    if (this._bound || typeof G === 'undefined' || !G.cv || !G.cv.addEventListener) return; this._bound = true;
    const at = (cx, cy) => { const r = G.cv.getBoundingClientRect(); this.mx = (cx - r.left) * 640 / r.width; this.my = (cy - r.top) * 320 / r.height; this.useMouse = true; };
    G.cv.addEventListener('mousemove', e => { if (G.state === 'pong') at(e.clientX, e.clientY); });
    const tm = e => { if (G.state === 'pong' && e.touches[0]) { at(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } };
    G.cv.addEventListener('touchstart', tm, { passive: false }); G.cv.addEventListener('touchmove', tm, { passive: false });
  },

  /* ---------- geometria stołu ---------- */
  /* przesuwa okrąg o promieniu r do wnętrza stołu (zaokrąglone rogi); zwraca normalną odbicia albo null */
  confine(o, r) {
    const C = this.C, cxL = this.L + C, cxR = this.R - C, cyT = this.T + C, cyB = this.B - C;
    let cx = null, cy = null;
    if (o.x < cxL && o.y < cyT) { cx = cxL; cy = cyT; } else if (o.x > cxR && o.y < cyT) { cx = cxR; cy = cyT; }
    else if (o.x < cxL && o.y > cyB) { cx = cxL; cy = cyB; } else if (o.x > cxR && o.y > cyB) { cx = cxR; cy = cyB; }
    if (cx !== null) {
      const dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy) || 1, lim = C - r;
      if (d > lim) { const nx = dx / d, ny = dy / d; o.x = cx + nx * lim; o.y = cy + ny * lim; return { nx: -nx, ny: -ny }; }
      return null;
    }
    if (o.y < this.T + r) { o.y = this.T + r; return { nx: 0, ny: 1 }; }
    if (o.y > this.B - r) { o.y = this.B - r; return { nx: 0, ny: -1 }; }
    return null;
  },
  /* pałka: zostaje w swojej połowie i poza bramką */
  confineMallet(m, isHero) {
    const r = this.MR; this.confine(m, r);
    const lo = isHero ? this.L + r : this.MID + r + 3, hi = isHero ? this.MID - r - 3 : this.R - r;
    m.x = Math.max(lo, Math.min(hi, m.x));
    m.y = Math.max(this.T + r, Math.min(this.B - r, m.y));
  },

  /* ---------- logika jednego kroku (60 fps) ---------- */
  step(inp) {
    const S = this.S, h = S.hero; S.t++;
    if (S.hint > 0) S.hint--; if (S.msgT > 0) S.msgT--;
    if (S.shake > 0) S.shake = Math.max(0, S.shake - .5); if (S.flash > 0) S.flash = Math.max(0, S.flash - .035);
    /* --- pałka gracza: myszą (do celu z limitem prędkości) albo klawiaturą --- */
    if (S.phase !== 'end') {
      h.px = h.x; h.py = h.y;
      let tx, ty, sp;
      if (inp.mouse) { tx = inp.tx; ty = inp.ty; sp = this.PS; }
      else { const len = Math.hypot(inp.dx || 0, inp.dy || 0) || 1; tx = h.x + (inp.dx || 0) / len * 40; ty = h.y + (inp.dy || 0) / len * 40; sp = (inp.dx || inp.dy) ? (inp.sprint ? this.KS * 1.35 : this.KS) : 0; }
      const dx = tx - h.x, dy = ty - h.y, d = Math.hypot(dx, dy);
      if (d > 0.01 && sp > 0) { const st = Math.min(sp, d); h.x += dx / d * st; h.y += dy / d * st; }
      this.confineMallet(h, true);
      h.vx = h.x - h.px; h.vy = h.y - h.py;
    }
    this.ai(S);
    if (S.phase === 'serve') { if (--S.timer <= 0) { S.phase = 'play'; S.go = 28; } this.puckPlay(S, false); return; }
    if (S.phase === 'goal') { if (--S.timer <= 0) this.afterGoal(); this.puckPlay(S, true); return; }
    if (S.phase === 'end') return;
    this.puckPlay(S, false);
  },

  /* ruch krążka z podkrokami (bez „tunelowania”) */
  puckPlay(S, free) {
    const b = S.puck, n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) / 4));
    for (let i = 0; i < n; i++) {
      b.x += b.vx / n; b.y += b.vy / n;
      if (free) {                                                                  // po golu: krążek tylko toczy się w bramce i zwalnia
        if (b.x < this.L - 30) { b.x = this.L - 30; b.vx = Math.abs(b.vx) * .3; } if (b.x > this.R + 30) { b.x = this.R + 30; b.vx = -Math.abs(b.vx) * .3; }
        if (b.y < this.GY0 + this.PR) { b.y = this.GY0 + this.PR; b.vy = Math.abs(b.vy) * .3; } if (b.y > this.GY1 - this.PR) { b.y = this.GY1 - this.PR; b.vy = -Math.abs(b.vy) * .3; }
        b.vx *= .985; b.vy *= .985; continue;
      }
      if (S.phase === 'serve') { b.vx = b.vy = 0; continue; }
      /* zaokrąglone rogi i długie bandy */
      const nn = this.confine(b, this.PR); if (nn) this.reflect(b, nn, S);
      /* krótsze boki: gol (w otworze) albo odbicie */
      const inMouth = b.y > this.GY0 + 4 && b.y < this.GY1 - 4, corner = b.y < this.T + this.C || b.y > this.B - this.C;
      if (b.x < this.L + this.PR && !corner) {
        if (inMouth) { if (b.x < this.L - this.PR) return this.goal('ai'); }
        else { b.x = this.L + this.PR; b.vx = Math.abs(b.vx) * .96; this.spark(S, b.x, b.y, '#ffffff', 5); }
      }
      if (b.x > this.R - this.PR && !corner) {
        if (inMouth) { if (b.x > this.R + this.PR) return this.goal('me'); }
        else { b.x = this.R - this.PR; b.vx = -Math.abs(b.vx) * .96; this.spark(S, b.x, b.y, '#d8f0b0', 5); }
      }
      this.hit(S, S.hero, true); this.hit(S, S.kp, false);
    }
    b.rot += (Math.abs(b.vx) + Math.abs(b.vy)) * .04;
    if (S.phase === 'play') {
      b.vx *= this.FRIC; b.vy *= this.FRIC;                                        // lekkie tarcie powietrzne
      const sp = Math.hypot(b.vx, b.vy); if (sp > this.MAXV) { b.vx *= this.MAXV / sp; b.vy *= this.MAXV / sp; }
      if (sp < .05) { b.vx = b.vy = 0; }
      /* krążek leży bez ruchu za długo (np. na połowie gracza) – delikatnie wypychamy go na środek, żeby gra się nie zawieszała */
      if (sp < .3) { S.idle = (S.idle || 0) + 1; if (S.idle > 320) { S.idle = 0; b.vx = (b.x < this.MID ? 1 : -1) * 3.6; b.vy = (Math.random() - .5) * 2.4; S.hint = Math.max(S.hint, 90); } } else S.idle = 0;
    }
    S.tail.push([b.x, b.y]); if (S.tail.length > 12) S.tail.shift();
    if (!isFinite(b.x) || !isFinite(b.y)) { b.x = 320; b.y = 160; b.vx = b.vy = 0; }   // zabezpieczenie przed NaN
  },

  reflect(b, n, S) {
    const vn = b.vx * n.nx + b.vy * n.ny;
    if (vn < 0) { b.vx -= 2 * vn * n.nx; b.vy -= 2 * vn * n.ny; b.vx *= .97; b.vy *= .97; if (-vn > 2.5) this.spark(S, b.x, b.y, '#ffffff', 4); }
  },

  /* zderzenie krążka z pałką (pałka jest „ciężka”: odbicie względem jej prędkości) */
  hit(S, m, isHero) {
    const b = S.puck, rr = this.MR + this.PR, dx = b.x - m.x, dy = b.y - m.y, d = Math.hypot(dx, dy);
    if (d >= rr) return;
    const nx = d > .001 ? dx / d : (isHero ? 1 : -1), ny = d > .001 ? dy / d : 0;
    b.x = m.x + nx * rr; b.y = m.y + ny * rr;
    let vn = (b.vx - m.vx) * nx + (b.vy - m.vy) * ny;
    if (vn < 0) { b.vx -= 1.92 * vn * nx; b.vy -= 1.92 * vn * ny; }
    vn = (b.vx - m.vx) * nx + (b.vy - m.vy) * ny;
    if (vn < 3) { b.vx += nx * (3 - vn); b.vy += ny * (3 - vn); }                  // zawsze odrzuca od pałki
    /* krążek przyparty do bandy: wyślizguje się wzdłuż niej (ku środkowi stołu) zamiast drgać */
    const q = { x: b.x, y: b.y }, wall = this.confine(q, this.PR), inM = b.y > this.GY0 && b.y < this.GY1;
    if (wall || (!inM && (b.x < this.L + this.PR + .5 || b.x > this.R - this.PR - .5))) {
      const tx = -ny, ty = nx, s = (ty * (160 - b.y) + tx * (320 - b.x) * .01 >= 0) ? 1 : -1;
      b.vx += tx * s * 3; b.vy += ty * s * 3;
    }
    const sp = Math.hypot(b.vx, b.vy); if (sp > this.MAXV) { b.vx *= this.MAXV / sp; b.vy *= this.MAXV / sp; }
    S.hitFx = { x: b.x - nx * this.PR, y: b.y - ny * this.PR, c: isHero ? '#4aa3ff' : '#f2e030', p: Math.min(1, sp / 12) }; S.shake = Math.max(S.shake, sp / 6);
    m.kt = S.t;
  },

  /* ---------- przeciwnik (AI) ---------- */
  ai(S) {
    const k = S.kp, b = S.puck, A = S.ai_; k.px = k.x; k.py = k.y;
    if (S.phase === 'end') { k.vx = k.vy = 0; return; }
    let tx = 560, ty = 160, speed = this.AS;
    const onMine = b.x > this.MID + 6, still = Math.hypot(b.vx, b.vy) < 2.4, coming = b.vx > .6 && b.x > this.MID - 80;
    if (S.phase === 'goal') { tx = 560; ty = 160; speed = 3.5; A.mode = 'home'; }
    else if (onMine && (still || b.vx > -1.2) && b.x < this.R - this.PR - this.MR - 6) {
      /* atak: wejdź za krążek (od strony własnej bramki) i uderz w stronę bramki gracza */
      if (A.mode !== 'wind' && A.mode !== 'strike') { A.mode = 'wind'; A.t = 0; A.aim = 160 + (Math.random() - .5) * 190; }
      const gx = this.L - 10, gy = A.aim, ang = Math.atan2(b.y - gy, b.x - gx), off = this.MR + this.PR + 14;
      const bx = Math.min(this.R - this.MR, b.x + Math.cos(ang) * off), by = b.y + Math.sin(ang) * off;
      if (A.mode === 'wind') {
        tx = bx; ty = by; A.t++;
        if (Math.hypot(k.x - bx, k.y - by) < 10 || A.t > 70) { A.mode = 'strike'; A.t = 0; }
      }
      if (A.mode === 'strike') { tx = b.x - Math.cos(ang) * 30; ty = b.y - Math.sin(ang) * 30; speed = this.AS * 1.35; if (++A.t > 14) { A.mode = 'home'; A.t = 0; } }
    } else {
      A.mode = 'home';
      if (--A.react <= 0) {                                                         // obrona: reakcja z opóźnieniem i błędem
        A.react = 7 + (Math.random() * 7 | 0);
        const err = (Math.random() - .5) * 70;
        if (coming && b.x > this.MID + 10) {                                         // przewidywany punkt na linii obrony (z odbiciami od band)
          const lo = this.T + this.PR, hi = this.B - this.PR, w = hi - lo;
          let y = b.y + b.vy * Math.max(0, (560 - b.x) / Math.max(.5, b.vx)), t = (((y - lo) % (2 * w)) + 2 * w) % (2 * w);
          y = lo + (t > w ? 2 * w - t : t);
          A.ty = Math.max(this.GY0 - 12, Math.min(this.GY1 + 12, y + err)); A.tx = 560;
        } else { A.ty = 160 + (b.y - 160) * .55 + err * .4 + Math.sin(S.t / 80) * 8; A.tx = onMine ? 548 : 566; }
      }
      tx = A.tx; ty = A.ty; speed = this.AS * (coming ? 1.0 : .7);
    }
    const dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy);
    if (d > .01) { const st = Math.min(speed, d); k.x += dx / d * st; k.y += dy / d * st; }
    this.confineMallet(k, false);
    k.vx = k.x - k.px; k.vy = k.y - k.py;
  },

  goal(who) {
    const S = this.S; if (S.phase === 'goal' || S.phase === 'end') return;
    S[who]++; S.last = who === 'me' ? 'ai' : 'me'; S.phase = 'goal'; S.timer = 95; S.msgT = 95; S.goalWho = who; S.shake = 9; S.flash = 1; S.cele = 1;
    S.msg = who === 'me' ? 'GOL! Punkt dla ciebie!' : 'Bramkarz zdobywa gola!';
    S.puck.vx *= .35; S.puck.vy *= .35;
    if (S[who] >= this.WIN) S.final = who;
  },
  afterGoal() {
    const S = this.S;
    if (S.final) { S.phase = 'end'; S.timer = 150; S.msgT = 9999; S.msg = S.final === 'me' ? `ZWYCIĘSTWO ${S.me}:${S.ai}!` : `Porażka ${S.me}:${S.ai} – rewanż!`; this.onEnd = false; return; }
    this.fresh(true);
  },

  spark(S, x, y, c, n) { const P = S.parts; for (let i = 0; i < n; i++) P.push({ x, y, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, life: .8, c, sz: 2 }); },

  /* ---------- pętla z gry (klatka po klatce) ---------- */
  tick() {
    const S = this.S; if (!S || G.state !== 'pong' || UI.menuOpen || (UI.overlay && UI.overlay())) return;
    const down = a => G.isDown(a), kx = (down('right') ? 1 : 0) - (down('left') ? 1 : 0), ky = (down('down') ? 1 : 0) - (down('up') ? 1 : 0);
    if (kx || ky) this.useMouse = false;
    const inp = { dx: kx, dy: ky, sprint: down('sprint'), mouse: this.useMouse, tx: this.mx, ty: this.my };
    if (S.phase === 'end') {
      if (--S.timer <= 0 && !this.onEnd) { this.onEnd = true; this.finish(); }
      S.t++; if (S.shake > 0) S.shake -= .5; this.effects(S); return;
    }
    this.step(inp); this.effects(S);
  },

  /* cząsteczki: iskry z uderzeń, konfetti po golu */
  effects(S) {
    const P = S.parts;
    if (S.hitFx) { const f = S.hitFx; S.hitFx = null; for (let i = 0; i < 6 + 8 * f.p; i++) P.push({ x: f.x, y: f.y, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7, life: .8, c: f.c, sz: 2 }); }
    if (S.cele) { S.cele = 0; const cols = ['#4aa3ff', '#f2e030', '#ffffff', '#ff6a5a', '#7aff9a'], gx = S.goalWho === 'me' ? 610 : 30; for (let i = 0; i < 60; i++) P.push({ x: gx, y: 160 + (Math.random() - .5) * 40, vx: (S.goalWho === 'me' ? -1 : 1) * (1 + Math.random() * 5), vy: (Math.random() - .5) * 6, life: 1.2, c: cols[i % cols.length], sz: 3 }); }
    const sp = Math.hypot(S.puck.vx, S.puck.vy); if (sp > 6 && S.t % 2 === 0) P.push({ x: S.puck.x, y: S.puck.y, vx: (Math.random() - .5) * 1.2, vy: (Math.random() - .5) * 1.2, life: .45, c: '#e8f4c8', sz: 2 });
    for (const q of P) { q.x += q.vx; q.y += q.vy; q.vx *= .96; q.vy *= .96; q.life -= .03; }
    S.parts = P.filter(q => q.life > 0).slice(-220);
  },

  /* koniec meczu: wygrana -> fala 7, porażka -> rewanż */
  async finish() {
    const S = this.S;
    if (S.final === 'me') { await G.pongWin(S.me, S.ai); return; }
    UI.log(`Bramkarz wygrał ${S.ai}:${S.me}. Rewanż – nic nie tracisz!`, 'bad');
    S.me = S.ai = 0; S.last = 'me'; S.final = null; S.hint = 220; this.fresh(true);
  },

  /* ---------- rysowanie (piłkarskie boisko, postacie zamiast pałek, piłka zamiast krążka) ---------- */
  ball(c, b) {
    c.save(); c.translate(b.x, b.y + this.PR * .85); c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 0, this.PR * .95, this.PR * .38, 0, 0, 7); c.fill(); c.restore();
    c.save(); c.translate(b.x, b.y); c.rotate(b.rot);
    c.fillStyle = '#fafafa'; c.beginPath(); c.arc(0, 0, this.PR, 0, 7); c.fill();
    c.fillStyle = '#1a1a22'; c.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.2832 - 1.5708; c.lineTo(Math.cos(a) * 4.4, Math.sin(a) * 4.4); } c.closePath(); c.fill();
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.2832 - 1.5708 + .6283; c.beginPath(); c.arc(Math.cos(a) * 8.2, Math.sin(a) * 8.2, 2.3, 0, 7); c.fill(); }
    c.lineWidth = 1.6; c.strokeStyle = '#222233'; c.beginPath(); c.arc(0, 0, this.PR, 0, 7); c.stroke(); c.restore();
  },
  player(c, m, key, face, S) {
    const kick = S.t - (m.kt == null ? -999 : m.kt) < 16, moving = Math.hypot(m.vx, m.vy) > .6, ms = S.t * 16.67;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(m.x, m.y + 15, this.MR * .95, this.MR * .38, 0, 0, 7); c.fill();
    try { Assets.draw(c, key, m.x, m.y + 15, 1.7, ms, face, kick ? (key === 'keeper' ? 'kick' : 'attack') : (moving ? 'walk' : 'idle'), (m.kt || 0) * 16.67); } catch (e) {}
  },
  draw(c) {
    const S = this.S; if (!S) return;
    const L = this.L, R = this.R, T = this.T, B = this.B, M = this.MID, G0 = this.GY0, G1 = this.GY1;
    c.save(); c.clearRect(0, 0, 640, 320);
    if (S.shake > 0) c.translate((Math.random() - .5) * S.shake * .6, (Math.random() - .5) * S.shake * .6);
    const pit = (typeof Assets !== 'undefined' && Assets.maps) ? Assets.maps.pitch : null;
    if (pit) { c.imageSmoothingEnabled = false; c.drawImage(pit, 0, 0, 640, 320); }
    else {   // zapasowe boisko (gdy brak tekstury)
      c.fillStyle = '#2f8a3a'; c.fillRect(0, 0, 640, 320); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(L, T - 2, R - L, B - T + 4);
      c.beginPath(); c.moveTo(M, T); c.lineTo(M, B); c.stroke(); c.beginPath(); c.arc(M, 160, 40, 0, 7); c.stroke(); c.strokeRect(0, G0, L, G1 - G0); c.strokeRect(R, G0, 16, G1 - G0);
    }
    /* błysk siatki po golu */
    if (S.phase === 'goal' && S.msgT > 40) { const gw = S.goalWho === 'me'; c.fillStyle = `rgba(255,255,255,${.25 + .2 * Math.sin(S.t / 2)})`; c.fillRect(gw ? R : 0, G0, 16, G1 - G0); }
    /* postacie i piłka (kolejność wg y) */
    const ents = [{ y: S.hero.y, f: () => this.player(c, S.hero, (typeof Player !== 'undefined' && Player.d) ? Player.spriteKey() : 'player', 1, S) },
      { y: S.kp.y, f: () => this.player(c, S.kp, 'keeper', -1, S) }, { y: S.puck.y, f: () => this.ball(c, S.puck) }].sort((a, b) => a.y - b.y);
    S.tail.forEach((q, i) => { c.globalAlpha = i / S.tail.length * .18; c.fillStyle = '#fff'; c.beginPath(); c.arc(q[0], q[1], this.PR * (.3 + i / S.tail.length * .5), 0, 7); c.fill(); }); c.globalAlpha = 1;
    ents.forEach(e => e.f());
    /* cząsteczki */
    for (const q of S.parts) { c.globalAlpha = Math.max(0, Math.min(1, q.life)); c.fillStyle = q.c; c.fillRect(q.x, q.y, q.sz, q.sz); } c.globalAlpha = 1;
    /* tablica wyników */
    c.fillStyle = '#000'; c.fillRect(244, 18, 152, 34); c.fillStyle = '#0b2a16'; c.fillRect(246, 20, 148, 30); c.fillStyle = '#e8f4c8'; c.fillRect(246, 20, 148, 2); c.fillRect(246, 48, 148, 2);
    c.textAlign = 'center'; c.font = 'bold 26px "Courier New"';
    const pulse = S.phase === 'goal' && S.t % 8 < 4;
    [['' + S.me, 288, '#4aa3ff'], [':', 320, '#fff'], ['' + S.ai, 352, '#f2e030']].forEach(([t, x, col]) => { c.fillStyle = '#000'; c.fillText(t, x + 2, 44); c.fillStyle = pulse ? col : '#fff'; c.fillText(t, x, 42); });
    c.font = 'bold 10px "Courier New"'; c.fillStyle = '#000'; c.fillText(trn('TY'), 231, 40); c.fillText(trn('BRAMKARZ'), 436, 40); c.fillStyle = '#4aa3ff'; c.fillText(trn('TY'), 230, 39); c.fillStyle = '#f2e030'; c.fillText(trn('BRAMKARZ'), 435, 39);
    c.fillStyle = '#e8f4c8'; c.fillText(`${trn('do')} ${this.WIN}`, 320, 62);
    if (S.hint > 0) { c.globalAlpha = Math.min(1, S.hint / 40); c.fillStyle = '#000b'; c.fillRect(60, 276, 520, 26); c.font = 'bold 12px "Courier New"'; c.fillStyle = '#fff'; c.fillText(trn('Mysz / dotyk albo WASD / strzałki – ruch zawodnika · Shift – szybciej'), 320, 293); c.globalAlpha = 1; }
    if (S.phase === 'serve' && S.timer > 0) { const n = Math.ceil(S.timer / 25), ph = (S.timer % 25) / 25; c.globalAlpha = .35 + .65 * ph; c.font = `bold ${(26 + 24 * ph) | 0}px "Courier New"`; c.fillStyle = '#000'; c.fillText(String(n), 322, 122); c.fillStyle = n === 1 ? '#f2e030' : '#fff'; c.fillText(String(n), 320, 120); c.globalAlpha = 1; }
    if (S.go > 0) { S.go--; c.globalAlpha = Math.min(1, S.go / 12); c.font = 'bold 28px "Courier New"'; c.fillStyle = '#000'; c.fillText(trn('GRAMY!'), 322, 122); c.fillStyle = '#fff'; c.fillText(trn('GRAMY!'), 320, 120); c.globalAlpha = 1; }
    if (S.msgT > 0 && S.msg) {
      const sc = Math.min(1, (S.phase === 'end' ? S.t : 95 - S.msgT + 8) / 12), mt = S.msg.match(/\d+:\d+/), txt = trn(S.msg.replace(/\d+:\d+/, '#')).replace('#', mt ? mt[0] : '');
      c.save(); c.translate(320, 160); c.scale(.6 + .4 * sc, .6 + .4 * sc); c.globalAlpha = Math.min(1, S.msgT / 20) * Math.min(1, sc * 1.4); c.font = `bold ${S.phase === 'end' ? 30 : 28}px "Courier New"`;
      c.fillStyle = '#000'; c.fillText(txt, 3, 3); c.fillStyle = S.goalWho === 'ai' || S.final === 'ai' ? '#f2e030' : '#7ac8ff'; c.fillText(txt, 0, 0); c.restore(); c.globalAlpha = 1;
    }
    if (S.flash > 0) { c.fillStyle = `rgba(255,255,255,${S.flash * .25})`; c.fillRect(0, 0, 640, 320); }
    if (G.banner) { const bn = G.banner; bn.t++; const al = Math.min(1, bn.t / 25, (170 - bn.t) / 30); if (al <= 0) G.banner = null; else { c.globalAlpha = al; c.font = 'bold 17px "Courier New"'; c.fillStyle = '#000'; c.fillText(trn(bn.txt), 322, 88); c.fillStyle = '#f2c14e'; c.fillText(trn(bn.txt), 320, 86); c.globalAlpha = 1; } }
    if (S.t < 24) { c.fillStyle = `rgba(0,0,0,${1 - S.t / 24})`; c.fillRect(0, 0, 640, 320); }
    c.restore(); c.globalAlpha = 1;
    if (G.fade > 0) { c.fillStyle = `rgba(0,0,0,${G.fade})`; c.fillRect(0, 0, 640, 320); }
  }
};
if (typeof module !== 'undefined') module.exports = Pong;
