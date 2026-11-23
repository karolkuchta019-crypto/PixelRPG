/* v1.3.0 – MINIGRA PONG, v1.3.2 – przerobiona na „ice hockey” (ale z piłką): Mroczny stadion, fala 6 (zamiast zwykłej walki).
   Lodowisko (widok z góry, bez nieba, zaokrąglone bandy). Postacie ŚLIZGAJĄ SIĘ po lodzie (przyspieszenie + poślizg), piłka odbija się
   od band, rogów, bohatera i bramkarza. Trafienie w bramkę = punkt. Gramy do 5 goli.
   Sterowanie: WASD / strzałki (Shift = sprint), Spacja = mocny strzał (piłka leci od bohatera w kierunku, w którym stoi względem niej).
   Wygrana -> nagroda i przejście do fali 7 (zwykłej). Porażka -> rewanż (bez kary).
   Logika (Pong.step) jest niezależna od rysowania, żeby dało się ją testować w Node (tools/test_pong.js). */
const Pong = {
  W: 640, H: 320, GL: 16, GR: 624, TOP: 28, BOT: 296, CORNER: 44, GY0: 112, GY1: 208,   // linie końcowe i boczne tafli, promień rogów, otwór bramki (y)
  WIN: 5, BR: 8, CR: 15, BODY: 18, SERVE: 4.6, MAXV: 9.4, ICE: .955,
  S: null,

  /* ---------- stan ---------- */
  fresh(keepScore) {
    const o = this.S && keepScore ? this.S : { me: 0, ai: 0, t: 0, hint: 330, shake: 0, flash: 0 };
    o.ball = { x: 320, y: 160, vx: 0, vy: 0, rot: 0, sq: 0 };
    o.hero = { x: 110, y: 190, cd: 0, hit: 0, vx: 0, vy: 0, moving: 0, face: 1 };
    o.kp = { x: 588, y: 190, hit: 0, ty: 160, tx: 588, react: 0, face: -1, moving: 0, vx: 0, vy: 0 };
    o.phase = 'serve'; o.timer = 120; o.msg = ''; o.msgT = 0; o.last = o.last || 'ai'; o.rally = 0; o.tail = [];
    this.S = o; return o;
  },

  /* ---------- start minigry ---------- */
  start() {
    const p = G.p;
    G.state = 'pong'; G.sel = null; G.nextBub();
    p.scale = 2.1; p.nobar = 1; p.ox = p.oy = 0; p.alpha = 1; p.pose = ''; p.face = 1; p.jumping = 0; p.freeze = null; p.dest = null; G.mark = null;
    this.kp = { key: 'keeper', name: 'Bramkarz', x: 588, y: 190, ox: 0, oy: 0, alpha: 1, flash: 0, scale: 2.1, face: -1, ph: 1, s: { hp: 1, maxhp: 1 }, nobar: 1 };
    this.S = null; this.fresh(false); this.S.last = 'ai';
    this.trail = null; this.parts = [];
    G.actors = []; G.enemies = [];
    G.banner = { txt: 'Lodowisko – hokej z piłką przeciwko bramkarzowi!', t: 0 };
    UI.log('MINIGRA: hokej na lodzie… z piłką! Ślizgasz się po lodzie: strzałki/WASD – ruch, Shift – sprint, Spacja – mocny strzał. Kto pierwszy zdobędzie 5 goli?', 'crit');
    UI.hud();
  },

  /* korekta położenia okręgu o promieniu r do wnętrza tafli z zaokrąglonymi rogami; zwraca normalną odbicia lub null */
  confine(o, r) {
    const T = this.TOP + r, B = this.BOT - r, C = this.CORNER;
    const cxL = this.GL + C, cxR = this.GR - C, cyT = this.TOP + C, cyB = this.BOT - C;
    let cx = null, cy = null;
    if (o.x < cxL && o.y < cyT) { cx = cxL; cy = cyT; } else if (o.x > cxR && o.y < cyT) { cx = cxR; cy = cyT; }
    else if (o.x < cxL && o.y > cyB) { cx = cxL; cy = cyB; } else if (o.x > cxR && o.y > cyB) { cx = cxR; cy = cyB; }
    if (cx !== null) {
      const dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy) || 1, lim = C - r;
      if (d > lim) { const nx = dx / d, ny = dy / d; o.x = cx + nx * lim; o.y = cy + ny * lim; return { nx: -nx, ny: -ny }; }
      return null;
    }
    if (o.y < T) { o.y = T; return { nx: 0, ny: 1 }; }
    if (o.y > B) { o.y = B; return { nx: 0, ny: -1 }; }
    return null;
  },

  /* ---------- logika jednego kroku (60 fps) ---------- */
  step(inp) {
    const S = this.S, b = S.ball, h = S.hero, k = S.kp; S.t++;
    if (S.hint > 0) S.hint--;
    if (S.msgT > 0) S.msgT--;
    if (S.shake > 0) S.shake = Math.max(0, S.shake - .6);
    if (S.flash > 0) S.flash = Math.max(0, S.flash - .04);
    h.cd = Math.max(0, h.cd - 1); h.hit = Math.max(0, h.hit - 1); k.hit = Math.max(0, k.hit - 1); b.sq = Math.max(0, b.sq - .08);
    /* --- ślizg bohatera po lodzie: przyspieszenie + poślizg --- */
    if (S.phase !== 'end') {
      const dx = inp.dx || 0, dy = inp.dy || 0, len = Math.hypot(dx, dy) || 1, A = .3 * (inp.sprint ? 1.5 : 1), maxv = inp.sprint ? 5.4 : 3.8;
      if (dx || dy) { h.vx += dx / len * A; h.vy += dy / len * A; }
      h.vx *= this.ICE; h.vy *= this.ICE;
      const sp = Math.hypot(h.vx, h.vy); if (sp > maxv) { h.vx *= maxv / sp; h.vy *= maxv / sp; }
      h.x += h.vx; h.y += h.vy;
      this.confineChar(h);
      h.moving = Math.hypot(h.vx, h.vy) > .45 ? 1 : 0;
    }
    /* --- bramkarz (AI) --- */
    this.keeper(S);
    /* --- fazy gry --- */
    if (S.phase === 'serve') {
      this.ballMove(S, true);
      if (--S.timer <= 0) {
        const toward = S.last === 'ai' ? -1 : 1;                       // piłka leci do tego, kto stracił gola (na starcie – do bohatera)
        const ang = (Math.random() - .5) * 1.0;
        b.vx = Math.cos(ang) * this.SERVE * toward; b.vy = Math.sin(ang) * this.SERVE; S.phase = 'play'; S.whistle = 20;
      }
      return;
    }
    if (S.phase === 'goal') { if (--S.timer <= 0) this.afterGoal(); this.ballMove(S, true); return; }
    if (S.phase === 'end') { return; }
    /* --- mocny strzał (Spacja) --- */
    if (inp.kick && h.cd === 0) {
      h.cd = 26; h.hit = 14;
      const cx = h.x, cy = h.y - this.BODY, d = Math.hypot(b.x - cx, b.y - cy);
      if (d < this.CR + this.BR + 18) {
        const nx = (b.x - cx) / (d || 1), ny = (b.y - cy) / (d || 1), sp = Math.min(this.MAXV, 7.6 + S.rally * .15);
        b.vx = nx * sp; b.vy = ny * sp; S.rally++; S.kicked = 8; b.sq = 1; S.kick = { x: b.x, y: b.y };
        if (Math.abs(b.vx) < 2.5) b.vx = Math.sign(b.vx || 1) * 2.5;
      }
    }
    this.ballMove(S, false);
  },

  confineChar(c) {
    const r = this.CR, o = { x: c.x, y: c.y - this.BODY }, n = this.confine(o, r);
    if (n) { c.vx *= .6; c.vy *= .6; }
    const R = this.GR - r, L = this.GL + r;
    if (o.x < L) { o.x = L; c.vx = Math.abs(c.vx) * .3; } if (o.x > R) { o.x = R; c.vx = -Math.abs(c.vx) * .3; }
    c.x = o.x; c.y = o.y + this.BODY;
  },

  keeper(S) {
    const k = S.kp, b = S.ball;
    if (S.phase === 'end') { k.moving = 0; return; }
    if (--k.react <= 0) {
      k.react = 7 + (Math.random() * 7 | 0);
      const coming = b.vx > 0.4 && b.x > 300;
      const err = (Math.random() - .5) * 78 + (Math.random() < .2 ? (Math.random() < .5 ? -1 : 1) * 46 : 0);   // błędy oceny toru lotu
      k.ty = coming ? b.y + err : 170 + Math.sin(S.t / 90) * 18;
      k.tx = (coming && b.x > 400) ? Math.max(520, Math.min(590, b.x + 70)) : 588;
    }
    const ty = Math.max(70, Math.min(284, k.ty)), sp = 2.15;
    /* bramkarz też ślizga się po lodzie: pożądana prędkość -> płynne przyspieszanie */
    const wx = Math.max(-sp, Math.min(sp, (k.tx - k.x) * .12)), wy = Math.max(-sp, Math.min(sp, (ty - k.y) * .12));
    k.vx += (wx - k.vx) * .16; k.vy += (wy - k.vy) * .16; k.x += k.vx; k.y += k.vy;
    this.confineChar(k);
    k.moving = (Math.abs(k.vx) + Math.abs(k.vy) > .6) ? 1 : 0; k.face = b.x < k.x ? -1 : 1;
  },

  ballMove(S, free) {
    const b = S.ball, n = Math.ceil(Math.hypot(b.vx, b.vy) / 3) || 1;
    for (let i = 0; i < n; i++) {
      b.x += b.vx / n; b.y += b.vy / n;
      if (S.phase === 'goal' || free) {                                           // poza grą: piłka tylko się toczy w bandach i siatce
        if (b.x < 2 || b.x > this.W - 2) { b.vx *= -.3; b.x = Math.max(2, Math.min(this.W - 2, b.x)); }
        if (b.y < this.TOP + this.BR || b.y > this.BOT - this.BR) { b.vy *= -1; b.y = Math.max(this.TOP + this.BR, Math.min(this.BOT - this.BR, b.y)); }
        continue;
      }
      /* zaokrąglone narożniki i linie boczne */
      const nn = this.confine(b, this.BR); if (nn) this.reflect(b, nn, S);
      /* linie końcowe: gol albo odbicie (poza otworem bramki) */
      const inMouth = b.y > this.GY0 + 5 && b.y < this.GY1 - 5, corner = b.y < this.TOP + this.CORNER || b.y > this.BOT - this.CORNER;
      if (b.x < this.GL + this.BR && !corner) {
        if (inMouth) { if (b.x < this.GL - 2) return this.goal('ai'); }
        else { b.x = this.GL + this.BR; b.vx = Math.abs(b.vx); this.boardFx(S, b); }
      }
      if (b.x > this.GR - this.BR && !corner) {
        if (inMouth) { if (b.x > this.GR + 2) return this.goal('me'); }
        else { b.x = this.GR - this.BR; b.vx = -Math.abs(b.vx); this.boardFx(S, b); }
      }
      /* postaci */
      this.collide(S, S.hero, true); this.collide(S, S.kp, false);
    }
    b.rot += (Math.abs(b.vx) + Math.abs(b.vy)) * .05 * Math.sign(b.vx || 1);
    if (!free && S.phase === 'play') {
      b.vx *= .9988; b.vy *= .9988;                                               // lekkie tarcie piłki o lód
      const sp = Math.hypot(b.vx, b.vy);
      if (sp < 3.6 && sp > 0) { b.vx *= 3.6 / sp; b.vy *= 3.6 / sp; }
      if (Math.abs(b.vx) < 1.3) b.vx = (b.vx < 0 ? -1 : 1) * 1.3;
      if (sp > this.MAXV) { b.vx *= this.MAXV / sp; b.vy *= this.MAXV / sp; }
    }
    S.tail.push([b.x, b.y]); if (S.tail.length > 9) S.tail.shift();
  },

  reflect(b, n, S) {
    const vn = b.vx * n.nx + b.vy * n.ny;
    if (vn < 0) { b.vx -= 2 * vn * n.nx; b.vy -= 2 * vn * n.ny; this.boardFx(S, b); }
  },
  boardFx(S, b) { if (Math.hypot(b.vx, b.vy) > 3) { S.bump = { x: b.x, y: b.y, n: 6 }; S.shake = Math.max(S.shake, 1.6); b.sq = .7; } },

  /* odbicie piłki od postaci (okrąg wokół tułowia) */
  collide(S, c, isHero) {
    const b = S.ball, cx = c.x, cy = c.y - this.BODY, rr = this.CR + this.BR, dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
    if (d >= rr || d === 0) return;
    const nx = dx / d, ny = dy / d;
    b.x = cx + nx * rr; b.y = cy + ny * rr;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny;
      const boost = isHero ? 1.05 : 1.03;
      b.vx = b.vx * boost + (isHero ? c.vx * .55 : 0); b.vy = b.vy * boost + (isHero ? c.vy * .55 : 0);
      S.rally++; b.sq = 1; S.kick = { x: b.x, y: b.y };
      if (isHero) { c.hit = 10; S.kicked = 6; } else { c.hit = 12; S.saved = 10; }
      if (!isHero && b.vx > -2) b.vx = -2.6;                                                     // bramkarz zawsze wybija w stronę lodowiska
    }
  },

  goal(who) {
    const S = this.S; if (S.phase === 'goal' || S.phase === 'end') return;
    S[who]++; S.last = who; S.phase = 'goal'; S.timer = 95; S.msgT = 95; S.goalWho = who; S.shake = 9; S.flash = 1; S.cele = 1;
    S.msg = who === 'me' ? 'GOL! Punkt dla ciebie!' : 'Bramkarz zdobywa gola!';
    S.ball.vx *= .4; S.ball.vy *= .4;
    if (S[who] >= this.WIN) { S.phase = 'goal'; S.final = who; }
  },

  afterGoal() {
    const S = this.S;
    if (S.final) { S.phase = 'end'; S.timer = 160; S.msgT = 9999; S.msg = S.final === 'me' ? `ZWYCIĘSTWO ${S.me}:${S.ai}!` : `Porażka ${S.me}:${S.ai} – rewanż!`; this.onEnd = false; return; }
    this.fresh(true);
  },

  /* ---------- pętla z gry (klatka po klatce) ---------- */
  tick() {
    const S = this.S; if (!S || G.state !== 'pong' || UI.menuOpen) return;
    const down = a => G.isDown(a), now = down('jump'), inp = {
      dx: (down('right') ? 1 : 0) - (down('left') ? 1 : 0), dy: (down('down') ? 1 : 0) - (down('up') ? 1 : 0), sprint: down('sprint'),
      kick: now && !this._kd };
    this._kd = now;
    if (S.phase === 'end') {
      if (--S.timer <= 0 && !this.onEnd) { this.onEnd = true; this.finish(); }
      S.t++; if (S.shake > 0) S.shake -= .5; this.sync(S); this.effects(S); return;
    }
    this.step(inp);
    if (S.kicked > 0) S.kicked--; if (S.saved > 0) S.saved--;
    this.sync(S); this.effects(S);
  },

  /* cząsteczki: lodowy pył spod łyżew, iskry z band, konfetti po golu */
  effects(S) {
    const P = this.parts || (this.parts = []), h = S.hero, k = S.kp;
    const spray = (c, col) => { const sp = Math.hypot(c.vx || 0, c.vy || 0); if (sp > 2.4 && S.t % 2 === 0) P.push({ x: c.x - 4 + Math.random() * 8, y: c.y - 2, vx: -(c.vx || 0) * .25 + (Math.random() - .5), vy: -(c.vy || 0) * .25 - Math.random() * .6, life: .8, c: col, sz: 2 }); };
    spray(h, '#ffffff'); spray(k, '#e8f4ff');
    if (S.bump) { for (let i = 0; i < S.bump.n; i++) P.push({ x: S.bump.x, y: S.bump.y, vx: (Math.random() - .5) * 4, vy: (Math.random() - .5) * 4, life: .7, c: '#ffffff', sz: 2 }); S.bump = null; }
    if (S.kick) { for (let i = 0; i < 8; i++) P.push({ x: S.kick.x, y: S.kick.y, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, life: .6, c: i % 2 ? '#ffd24a' : '#ffffff', sz: 2 }); S.kick = null; }
    if (S.cele) {
      S.cele = 0; const cols = ['#ff5a5a', '#ffd24a', '#5ab4ff', '#7aff9a', '#ff9af0', '#ffffff'], gx = S.goalWho === 'me' ? 600 : 40;
      for (let i = 0; i < 70; i++) P.push({ x: gx, y: 160 + (Math.random() - .5) * 40, vx: (S.goalWho === 'me' ? -1 : 1) * (1 + Math.random() * 5), vy: (Math.random() - .8) * 5, g: .12, life: 1.3, c: cols[i % cols.length], sz: 3, conf: 1 });
    }
    for (const q of P) { q.x += q.vx; q.y += q.vy; q.vy += q.g === undefined ? .02 : q.g; q.vx *= .98; q.life -= q.conf ? .012 : .035; }
    this.parts = P.filter(q => q.life > 0);
    if (S.phase === 'goal' && S.t % 10 === 0 && S.msgT > 20) for (let i = 0; i < 6; i++) this.parts.push({ x: 320 + (Math.random() - .5) * 400, y: 30, vx: (Math.random() - .5) * 2, vy: 1 + Math.random() * 2, g: .05, life: 1.2, c: ['#ffd24a', '#ff5a5a', '#5ab4ff'][i % 3], sz: 3, conf: 1 });
  },

  /* przenosi stan logiczny na aktorów (do rysowania przez G.drawActor) */
  sync(S) {
    const p = G.p, kp = this.kp, h = S.hero, k = S.kp, b = S.ball;
    p.x = h.x; p.y = h.y; p.walk = h.moving; p.face = b.x < h.x - 6 ? -1 : 1; p.pose = h.hit > 0 ? 'attack' : '';
    kp.x = k.x; kp.y = k.y; kp.walk = k.moving; kp.face = k.face; kp.pose = k.hit > 0 ? 'attack' : '';
    if (S.phase === 'end') { if (S.final === 'me') kp.s.hp = 0; }
    if (S.phase === 'goal' && S.goalWho === 'me' && S.me >= this.WIN) kp.s.hp = 0;
  },

  /* koniec meczu: wygrana -> fala 7, porażka -> rewanż */
  async finish() {
    const S = this.S;
    if (S.final === 'me') { await G.pongWin(S.me, S.ai); return; }
    UI.log(`Bramkarz wygrał ${S.ai}:${S.me}. Rewanż – nic nie tracisz!`, 'bad');
    this.kp.s.hp = 1; this.kp.alpha = 1; this.S.me = this.S.ai = 0; this.S.last = 'ai'; this.S.final = null; this.fresh(true);
    this.S.hint = 200;
  },

  /* ---------- rysowanie ---------- */
  ball(c, x, y, rot, shadowY, sq) {
    const k = 1 + (sq || 0) * .28;
    c.fillStyle = 'rgba(40,70,110,.28)'; c.beginPath(); c.ellipse(x, shadowY, 9 * k, 3.4, 0, 0, 7); c.fill();
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, 2 - k);
    c.fillStyle = '#14101f'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill(); c.fillStyle = '#f6f6f6'; c.beginPath(); c.arc(0, 0, 7.6, 0, 7); c.fill();
    c.fillStyle = '#2a2a38'; c.beginPath(); for (let i = 0; i < 5; i++) { const q = i * Math.PI * 2 / 5 - Math.PI / 2; c.lineTo(Math.cos(q) * 3.2, Math.sin(q) * 3.2); } c.closePath(); c.fill();
    for (let i = 0; i < 5; i++) { const q = i * Math.PI * 2 / 5 - Math.PI / 2; c.fillRect(Math.cos(q) * 6.4 - 1, Math.sin(q) * 6.4 - 1, 2, 2); }
    c.restore();
  },

  /* ślady łyżew zostają na lodzie i powoli znikają */
  trailLayer(S) {
    if (!this.trail) { this.trail = document.createElement('canvas'); this.trail.width = 640; this.trail.height = 320; this._last = {}; }
    const t = this.trail.getContext('2d');
    if (S.t % 5 === 0) { t.globalCompositeOperation = 'destination-out'; t.fillStyle = 'rgba(0,0,0,.07)'; t.fillRect(0, 0, 640, 320); t.globalCompositeOperation = 'source-over'; }
    const mark = (id, x, y, sp, col) => {
      const l = this._last[id]; this._last[id] = [x, y];
      if (!l || sp < 1.2 || Math.hypot(x - l[0], y - l[1]) > 30) return;
      t.strokeStyle = col; t.lineWidth = 1.4; t.lineCap = 'round';
      for (const o of [-3, 3]) { t.beginPath(); t.moveTo(l[0] + o, l[1] - 1); t.lineTo(x + o, y - 1); t.stroke(); }
    };
    mark('h', S.hero.x, S.hero.y, Math.hypot(S.hero.vx, S.hero.vy), 'rgba(90,120,170,.45)'); mark('k', S.kp.x, S.kp.y, Math.hypot(S.kp.vx, S.kp.vy), 'rgba(90,120,170,.4)');
    mark('b', S.ball.x, S.ball.y + 4, Math.hypot(S.ball.vx, S.ball.vy) * .6, 'rgba(120,150,190,.35)');
  },

  draw(c) {
    const S = this.S; if (!S) return;
    c.save(); c.clearRect(0, 0, 640, 320); G.top = [];
    if (S.shake > 0) c.translate((Math.random() - .5) * S.shake, (Math.random() - .5) * S.shake);
    G.drawMap(c, 'rink', 0);
    this.trailLayer(S); c.drawImage(this.trail, 0, 0);
    /* siatka bramki faluje po golu */
    if (S.phase === 'goal' && S.msgT > 40) { c.fillStyle = `rgba(255,255,255,${.18 + .12 * Math.sin(S.t / 2)})`; c.fillRect(S.goalWho === 'me' ? 624 : 0, 112, 16, 96); }
    /* aktorzy + piłka posortowani wg y */
    const bl = S.ball;
    const items = [{ y: G.p.y, f: () => G.drawActor(G.p) }, { y: this.kp.y, f: () => G.drawActor(this.kp) },
      { y: bl.y + 14, f: () => { S.tail.forEach((q, i) => { c.globalAlpha = i / S.tail.length * .25; c.fillStyle = '#fff'; c.beginPath(); c.arc(q[0], q[1] - 6, 4 + i * .3, 0, 7); c.fill(); }); c.globalAlpha = 1; this.ball(c, bl.x, bl.y - 6, bl.rot, bl.y + 5, bl.sq); } }];
    items.sort((a, b) => a.y - b.y).forEach(i => i.f());
    G.top.forEach(f => f(c));
    /* cząsteczki */
    for (const q of this.parts || []) { c.globalAlpha = Math.max(0, Math.min(1, q.life)); c.fillStyle = q.c; c.fillRect(q.x, q.y, q.sz, q.sz); }
    c.globalAlpha = 1;
    G.fx.forEach(f => { if (f.txt) { c.globalAlpha = Math.max(0, f.life); c.font = 'bold 18px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(f.txt, f.x + 2, f.y + 2); c.fillStyle = f.c; c.fillText(f.txt, f.x, f.y); } });
    c.globalAlpha = 1;
    /* tablica wyników jak na hali: miga po golu */
    c.textAlign = 'center'; c.fillStyle = '#0a1226ee'; c.fillRect(190, 2, 260, 38); c.strokeStyle = S.phase === 'goal' && S.t % 8 < 4 ? '#ffffff' : '#f2c14e'; c.lineWidth = 2; c.strokeRect(191, 3, 258, 36);
    c.font = 'bold 13px "Courier New"'; c.fillStyle = '#9ad4ff'; c.fillText(trn('TY'), 228, 26); c.fillStyle = '#ffb0a0'; c.fillText(trn('BRAMKARZ'), 402, 26);
    c.font = 'bold 24px "Courier New"'; c.fillStyle = '#f2c14e'; c.fillText(`${S.me} : ${S.ai}`, 320, 29);
    c.font = 'bold 9px "Courier New"'; c.fillStyle = '#c8d8f0'; c.fillText(`${trn('do')} ${this.WIN}`, 320, 38);
    /* podpowiedź na starcie */
    if (S.hint > 0) {
      c.globalAlpha = Math.min(1, S.hint / 40); c.fillStyle = '#000b'; c.fillRect(100, 268, 440, 30); c.font = 'bold 12px "Courier New"'; c.fillStyle = '#f3e9d2';
      c.fillText(trn('WASD / strzałki – ślizg · Shift – sprint · Spacja – mocny strzał'), 320, 287); c.globalAlpha = 1;
    }
    /* odliczanie 3-2-1 przed wznowieniem gry (pulsująca cyfra) */
    if (S.phase === 'serve' && S.timer > 0) {
      const n = Math.ceil(S.timer / 40), ph = (S.timer % 40) / 40, sz = 26 + 26 * ph;
      c.globalAlpha = .35 + .65 * ph; c.font = `bold ${sz | 0}px "Courier New"`; c.fillStyle = '#0a1226'; c.fillText(String(n), 322, 112); c.fillStyle = n === 1 ? '#2aa84a' : '#d63c46'; c.fillText(String(n), 320, 110); c.globalAlpha = 1;
    }
    if (S.whistle > 0) { S.whistle--; c.globalAlpha = Math.min(1, S.whistle / 12); c.font = 'bold 28px "Courier New"'; c.fillStyle = '#0a1226'; c.fillText(trn('GRAMY!'), 322, 112); c.fillStyle = '#d63c46'; c.fillText(trn('GRAMY!'), 320, 110); c.globalAlpha = 1; }
    /* komunikat gola / końca (wjeżdża z powiększeniem) */
    if (S.msgT > 0 && S.msg) {
      const sc = Math.min(1, (S.phase === 'end' ? S.t : 95 - S.msgT + 8) / 12), txt = trn(S.msg.replace(/\d+:\d+/, '#')).replace('#', S.msg.match(/\d+:\d+/) ? S.msg.match(/\d+:\d+/)[0] : '');
      c.save(); c.translate(320, 160); c.scale(.6 + .4 * sc, .6 + .4 * sc); c.globalAlpha = Math.min(1, S.msgT / 20) * Math.min(1, sc * 1.4); c.font = `bold ${S.phase === 'end' ? 32 : 28}px "Courier New"`;
      c.fillStyle = '#0a1226'; c.fillText(txt, 3, 3); c.fillStyle = S.goalWho === 'ai' || S.final === 'ai' ? '#ff6a5a' : '#2aa84a'; c.fillText(txt, 0, 0); c.restore(); c.globalAlpha = 1;
    }
    if (S.flash > 0) { c.fillStyle = `rgba(255,255,255,${S.flash * .35})`; c.fillRect(0, 0, 640, 320); }
    /* baner lokacji */
    if (G.banner) { const b = G.banner; b.t++; const al = Math.min(1, b.t / 25, (170 - b.t) / 30); if (al <= 0) G.banner = null; else { c.globalAlpha = al; c.font = 'bold 17px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#0a1226'; c.fillText(trn(b.txt), 322, 82); c.fillStyle = '#f2c14e'; c.fillText(trn(b.txt), 320, 80); c.globalAlpha = 1; } }
    /* wejście: ekran rozjaśnia się z czerni */
    if (S.t < 24) { c.fillStyle = `rgba(0,0,0,${1 - S.t / 24})`; c.fillRect(0, 0, 640, 320); }
    c.restore(); c.globalAlpha = 1;
    if (G.fade > 0) { c.fillStyle = `rgba(0,0,0,${G.fade})`; c.fillRect(0, 0, 640, 320); }
  }
};
if (typeof module !== 'undefined') module.exports = Pong;
