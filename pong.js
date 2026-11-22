/* v1.3.0 – MINIGRA PONG: Mroczny stadion, fala 6 (zamiast zwykłej walki).
   Nowa mapa „Boisko” (widok z góry, bez nieba) – bohater porusza się po całym boisku (WASD / strzałki, Shift = sprint).
   Piłka odbija się od bohatera, bramkarza i linii bocznych. Trafienie w bramkę = punkt. Gramy do 5 goli.
   Spacja = mocny strzał (piłka leci od bohatera w kierunku, w którym stoi względem niej).
   Wygrana -> nagroda i przejście do fali 7 (zwykłej). Porażka -> rewanż (bez kary).
   Logika (Pong.step) jest niezależna od rysowania, żeby dało się ją testować w Node (patrz tools/test_pong.js). */
const Pong = {
  W: 640, H: 320, GL: 16, GR: 624, TOP: 14, BOT: 306, GY0: 112, GY1: 208,   // linie bramkowe i boczne, otwór bramki (y)
  WIN: 5, BR: 8, CR: 17, SERVE: 4.6, MAXV: 9.2,
  S: null,

  /* ---------- stan ---------- */
  fresh(keepScore) {
    const o = this.S && keepScore ? this.S : { me: 0, ai: 0, t: 0, hint: 330 };
    o.ball = { x: 320, y: 160, vx: 0, vy: 0, rot: 0 };
    o.hero = { x: 110, y: 184, cd: 0, hit: 0, vx: 0, vy: 0, moving: 0, face: 1 };
    o.kp = { x: 588, y: 184, hit: 0, ty: 160, tx: 588, react: 0, face: -1, moving: 0 };
    o.phase = 'serve'; o.timer = 70; o.msg = ''; o.msgT = 0; o.last = o.last || 'ai'; o.rally = 0;
    this.S = o; return o;
  },

  /* ---------- start minigry ---------- */
  start() {
    const p = G.p;
    G.state = 'pong'; G.sel = null; G.nextBub();
    p.scale = 2.4; p.nobar = 1; p.ox = p.oy = 0; p.alpha = 1; p.pose = ''; p.face = 1; p.jumping = 0; p.freeze = null; p.dest = null; G.mark = null;
    this.kp = { key: 'keeper', name: 'Bramkarz', x: 588, y: 184, ox: 0, oy: 0, alpha: 1, flash: 0, scale: 2.4, face: -1, ph: 1, s: { hp: 1, maxhp: 1 }, nobar: 1 };
    this.S = null; this.fresh(false); this.S.last = 'ai';
    G.actors = []; G.enemies = [];
    G.banner = { txt: 'Boisko – mecz z bramkarzem!', t: 0 };
    UI.log('MINIGRA: pong z bramkarzem! Strzałki/WASD – ruch, Spacja – mocny strzał. Kto pierwszy zdobędzie 5 goli?', 'crit');
    UI.hud();
  },

  /* ---------- logika jednego kroku (60 fps) ---------- */
  step(inp) {
    const S = this.S, b = S.ball, h = S.hero, k = S.kp; S.t++;
    if (S.hint > 0) S.hint--;
    if (S.msgT > 0) S.msgT--;
    h.cd = Math.max(0, h.cd - 1); h.hit = Math.max(0, h.hit - 1); k.hit = Math.max(0, k.hit - 1);
    /* --- ruch bohatera po całym boisku --- */
    if (S.phase !== 'end') {
      let dx = inp.dx || 0, dy = inp.dy || 0; const len = Math.hypot(dx, dy) || 1;
      const sp = inp.sprint ? 4.6 : 3.0;
      h.vx = dx / len * sp * (dx || dy ? 1 : 0); h.vy = dy / len * sp * (dx || dy ? 1 : 0);
      h.x = Math.max(30, Math.min(this.W - 30, h.x + h.vx)); h.y = Math.max(40, Math.min(this.H + 6, h.y + h.vy));
      h.moving = (dx || dy) ? 1 : 0;
    }
    /* --- bramkarz (AI) --- */
    this.keeper(S);
    /* --- fazy gry --- */
    if (S.phase === 'serve') {
      if (--S.timer <= 0) {
        const toward = S.last === 'ai' ? -1 : 1;                       // piłka leci do tego, kto stracił gola (na starcie – do bohatera)
        const ang = (Math.random() - .5) * 1.0;
        b.vx = Math.cos(ang) * this.SERVE * toward; b.vy = Math.sin(ang) * this.SERVE; S.phase = 'play';
      }
      return;
    }
    if (S.phase === 'goal') { if (--S.timer <= 0) this.afterGoal(); this.ballMove(S, true); return; }
    if (S.phase === 'end') { return; }
    /* --- mocny strzał (Spacja) --- */
    if (inp.kick && h.cd === 0) {
      h.cd = 26; h.hit = 14;
      const cx = h.x, cy = h.y - 22, d = Math.hypot(b.x - cx, b.y - cy);
      if (d < this.CR + this.BR + 18) {
        const nx = (b.x - cx) / (d || 1), ny = (b.y - cy) / (d || 1), sp = Math.min(this.MAXV, 7.6 + S.rally * .15);
        b.vx = nx * sp; b.vy = ny * sp; S.rally++; S.kicked = 8;
        if (Math.abs(b.vx) < 2.5) b.vx = Math.sign(b.vx || 1) * 2.5;
      }
    }
    this.ballMove(S, false);
  },

  keeper(S) {
    const k = S.kp, b = S.ball;
    if (S.phase === 'end') { k.moving = 0; return; }
    if (--k.react <= 0) {
      k.react = 7 + (Math.random() * 7 | 0);
      const coming = b.vx > 0.4 && b.x > 300;
      const err = (Math.random() - .5) * 62 + (Math.random() < .14 ? (Math.random() < .5 ? -1 : 1) * 46 : 0);   // błędy oceny toru lotu
      k.ty = coming ? b.y + err : 170 + Math.sin(S.t / 90) * 18;
      k.tx = (coming && b.x > 400) ? Math.max(520, Math.min(590, b.x + 70)) : 588;
    }
    const ty = Math.max(56, Math.min(292, k.ty)), sp = 2.7;
    const mx = Math.max(-sp, Math.min(sp, k.tx - k.x)), my = Math.max(-sp, Math.min(sp, ty - 22 - (k.y - 22)));
    k.x += mx; k.y += my; k.moving = (Math.abs(mx) + Math.abs(my) > .6) ? 1 : 0; k.face = b.x < k.x ? -1 : 1;
  },

  ballMove(S, free) {
    const b = S.ball, n = Math.ceil(Math.hypot(b.vx, b.vy) / 3) || 1;
    for (let i = 0; i < n; i++) {
      b.x += b.vx / n; b.y += b.vy / n;
      if (S.phase === 'goal' || free) { if (b.x < 2 || b.x > this.W - 2) { b.vx *= -.3; b.x = Math.max(2, Math.min(this.W - 2, b.x)); } if (b.y < this.TOP + this.BR || b.y > this.BOT - this.BR) b.vy *= -1; continue; }
      /* linie boczne */
      if (b.y < this.TOP + this.BR) { b.y = this.TOP + this.BR; b.vy = Math.abs(b.vy); }
      if (b.y > this.BOT - this.BR) { b.y = this.BOT - this.BR; b.vy = -Math.abs(b.vy); }
      /* linie końcowe: gol albo odbicie */
      const inMouth = b.y > this.GY0 + 5 && b.y < this.GY1 - 5;
      if (b.x < this.GL + this.BR) {
        if (inMouth) { if (b.x < this.GL - 2) return this.goal('ai'); }
        else { b.x = this.GL + this.BR; b.vx = Math.abs(b.vx); }
      }
      if (b.x > this.GR - this.BR) {
        if (inMouth) { if (b.x > this.GR + 2) return this.goal('me'); }
        else { b.x = this.GR - this.BR; b.vx = -Math.abs(b.vx); }
      }
      /* postaci */
      this.collide(S, S.hero, true); this.collide(S, S.kp, false);
    }
    b.rot += (Math.abs(b.vx) + Math.abs(b.vy)) * .05 * Math.sign(b.vx || 1);
    /* nie dopuszcza do zbyt wolnej piłki / pionowego „wahadła” */
    const sp = Math.hypot(b.vx, b.vy);
    if (!free && S.phase === 'play') {
      if (sp < 3.6 && sp > 0) { b.vx *= 3.6 / sp; b.vy *= 3.6 / sp; }
      if (Math.abs(b.vx) < 1.3) b.vx = (b.vx < 0 ? -1 : 1) * 1.3;
      if (sp > this.MAXV) { b.vx *= this.MAXV / sp; b.vy *= this.MAXV / sp; }
    }
  },

  /* odbicie piłki od postaci (okrąg wokół tułowia) */
  collide(S, c, isHero) {
    const b = S.ball, cx = c.x, cy = c.y - 22, rr = this.CR + this.BR, dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
    if (d >= rr || d === 0) return;
    const nx = dx / d, ny = dy / d;
    b.x = cx + nx * rr; b.y = cy + ny * rr;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny;
      const boost = isHero ? 1.05 : 1.03;
      b.vx = b.vx * boost + (isHero ? c.vx * .55 : 0); b.vy = b.vy * boost + (isHero ? c.vy * .55 : 0);
      S.rally++;
      if (isHero) { c.hit = 10; S.kicked = 6; } else { c.hit = 12; S.saved = 10; }
      if (!isHero && b.vx > -2) b.vx = -2.6;                                                     // bramkarz zawsze wybija w stronę boiska
    }
  },

  goal(who) {
    const S = this.S; if (S.phase === 'goal' || S.phase === 'end') return;
    S[who]++; S.last = who; S.phase = 'goal'; S.timer = 80; S.msgT = 80; S.goalWho = who;
    S.msg = who === 'me' ? 'GOL! Punkt dla ciebie!' : 'Bramkarz zdobywa gola!';
    S.ball.vx *= .4; S.ball.vy *= .4;
    if (S[who] >= this.WIN) { S.phase = 'goal'; S.final = who; }
  },

  afterGoal() {
    const S = this.S;
    if (S.final) { S.phase = 'end'; S.timer = 150; S.msgT = 9999; S.msg = S.final === 'me' ? `ZWYCIĘSTWO ${S.me}:${S.ai}!` : `Porażka ${S.me}:${S.ai} – rewanż!`; this.onEnd = false; return; }
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
      this.sync(S); return;
    }
    this.step(inp);
    if (S.kicked > 0) S.kicked--; if (S.saved > 0) S.saved--;
    this.sync(S);
  },

  /* przenosi stan logiczny na aktorów (do rysowania przez G.drawActor) */
  sync(S) {
    const p = G.p, kp = this.kp, h = S.hero, k = S.kp, b = S.ball;
    p.x = h.x; p.y = h.y; p.walk = h.moving; p.face = b.x < h.x - 6 ? -1 : 1; p.pose = h.hit > 0 ? 'attack' : '';
    kp.x = k.x; kp.y = k.y; kp.walk = k.moving; kp.face = k.face; kp.pose = k.hit > 0 ? 'attack' : '';
    if (S.phase === 'end') { if (S.final === 'me') kp.s.hp = 0; else p.s = p.s; }
    if (S.phase === 'goal' && S.goalWho === 'me' && S.me >= this.WIN) kp.s.hp = 0;
    if (S.phase === 'goal' && S.goalWho === 'ai' && S.ai >= this.WIN) { /* bohater przegrywa mecz – stoi */ }
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
  ball(c, x, y, rot, shadowY) {
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x, shadowY, 9, 3.4, 0, 0, 7); c.fill();
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#14101f'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill(); c.fillStyle = '#f6f6f6'; c.beginPath(); c.arc(0, 0, 7.6, 0, 7); c.fill();
    c.fillStyle = '#2a2a38'; c.beginPath(); for (let i = 0; i < 5; i++) { const q = i * Math.PI * 2 / 5 - Math.PI / 2; c.lineTo(Math.cos(q) * 3.2, Math.sin(q) * 3.2); } c.closePath(); c.fill();
    for (let i = 0; i < 5; i++) { const q = i * Math.PI * 2 / 5 - Math.PI / 2; c.fillRect(Math.cos(q) * 6.4 - 1, Math.sin(q) * 6.4 - 1, 2, 2); }
    c.restore();
  },

  draw(c) {
    const S = this.S; if (!S) return;
    c.save(); c.clearRect(0, 0, 640, 320); G.top = [];
    G.drawMap(c, 'pitch', 0);
    /* aktorzy + piłka posortowani wg y */
    const items = [{ y: G.p.y, f: () => G.drawActor(G.p) }, { y: this.kp.y, f: () => G.drawActor(this.kp) },
      { y: S.ball.y + 14, f: () => this.ball(c, S.ball.x, S.ball.y - 6, S.ball.rot, S.ball.y + 5) }];
    items.sort((a, b) => a.y - b.y).forEach(i => i.f());
    G.top.forEach(f => f(c));
    /* efekty (cząsteczki, napisy) */
    G.fx.forEach(f => { c.globalAlpha = Math.max(0, f.life); if (f.pt) { c.fillStyle = f.c; c.fillRect(f.x, f.y, f.sz, f.sz); } else if (f.txt) { c.font = 'bold 18px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(f.txt, f.x + 2, f.y + 2); c.fillStyle = f.c; c.fillText(f.txt, f.x, f.y); } });
    c.globalAlpha = 1;
    /* tablica wyników */
    c.textAlign = 'center'; c.fillStyle = '#000c'; c.fillRect(190, 14, 260, 34); c.strokeStyle = '#f2c14e'; c.lineWidth = 2; c.strokeRect(191, 15, 258, 32);
    c.font = 'bold 13px "Courier New"'; c.fillStyle = '#9ad4ff'; c.fillText(trn('TY'), 228, 36); c.fillStyle = '#ffb0a0'; c.fillText(trn('BRAMKARZ'), 402, 36);
    c.font = 'bold 24px "Courier New"'; c.fillStyle = '#f2c14e'; c.fillText(`${S.me} : ${S.ai}`, 320, 40);
    c.font = 'bold 10px "Courier New"'; c.fillStyle = '#f3e9d2'; c.fillText(`${trn('do')} ${this.WIN}`, 320, 56);
    /* podpowiedź na starcie */
    if (S.hint > 0) {
      c.globalAlpha = Math.min(1, S.hint / 40); c.fillStyle = '#000b'; c.fillRect(110, 268, 420, 30); c.font = 'bold 12px "Courier New"'; c.fillStyle = '#f3e9d2';
      c.fillText(trn('WASD / strzałki – ruch · Shift – sprint · Spacja – mocny strzał'), 320, 287); c.globalAlpha = 1;
    }
    /* odliczanie przed wznowieniem gry */
    if (S.phase === 'serve' && S.timer > 0) { c.font = 'bold 26px "Courier New"'; c.fillStyle = '#000'; c.fillText(trn('GRAMY!'), 322, 102); c.fillStyle = '#fff'; c.fillText(trn('GRAMY!'), 320, 100); }
    /* komunikat gola / końca */
    if (S.msgT > 0 && S.msg) {
      c.globalAlpha = Math.min(1, S.msgT / 20); c.font = `bold ${S.phase === 'end' ? 30 : 26}px "Courier New"`;
      c.fillStyle = '#000'; c.fillText(trn(S.msg.replace(/\d+:\d+/, '#')).replace('#', S.msg.match(/\d+:\d+/) ? S.msg.match(/\d+:\d+/)[0] : ''), 322, 162);
      c.fillStyle = S.goalWho === 'ai' || S.final === 'ai' ? '#ff8a7a' : '#7aff9a'; c.fillText(trn(S.msg.replace(/\d+:\d+/, '#')).replace('#', S.msg.match(/\d+:\d+/) ? S.msg.match(/\d+:\d+/)[0] : ''), 320, 160); c.globalAlpha = 1;
    }
    /* baner lokacji */
    if (G.banner) { const b = G.banner; b.t++; const al = Math.min(1, b.t / 25, (170 - b.t) / 30); if (al <= 0) G.banner = null; else { c.globalAlpha = al; c.font = 'bold 20px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(trn(b.txt), 322, 92); c.fillStyle = '#f2c14e'; c.fillText(trn(b.txt), 320, 90); c.globalAlpha = 1; } }
    c.restore(); c.globalAlpha = 1;
    if (G.fade > 0) { c.fillStyle = `rgba(0,0,0,${G.fade})`; c.fillRect(0, 0, 640, 320); }
  }
};
if (typeof module !== 'undefined') module.exports = Pong;
