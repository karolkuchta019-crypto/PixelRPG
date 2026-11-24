/* ============================================================
   DAM.JS – v1.4.0: MINIGRA W TAJDZE – BOBRZA TAMA
   Bobry zbudowały tamę na rzece i odcięły wodę wiosce. Wskaźnik przesuwa się po pionowym pasku (czerwone / zielone pole).
   Spacja / Enter / kliknięcie = uderzenie mieczem. Trzeba trafić w ZIELONE trzy razy, by rozwalić tamę (nagroda: 10 pkt od mieszkańców).
   Pudło = miecz się łamie (znika z ekwipunku – kupisz nowy u zbrojmistrza) i tama zostaje.
   ============================================================ */
const Dam = {
  S: null, BX: 586, BY: 46, BW: 26, BH: 224, ZONE: [.26, .20, .15],

  newZone(hits) {
    const size = this.ZONE[Math.min(2, hits)], a = .08 + Math.random() * (1 - size - .16);
    return [a, a + size];
  },

  start() {
    const p = G.p; G.state = 'dam'; G.sel = null; G.nextBub();
    p.alpha = 1; p.nobar = 1; p.scale = 3; p.x = 252; p.y = 266; p.ox = p.oy = 0; p.face = 1; p.pose = ''; p.anim = ''; p.sw = null; p.freeze = null; p.dest = null; p.walk = 0;
    G.mark = null; G.actors = []; G.enemies = [];
    this.S = { phase: 'aim', hits: 0, pos: 0, dir: 1, zone: this.newZone(0), t: 0, hint: 480, flow: 0, broken: false, lost: false, fin: false, shown: 0, flee: 0 };
    G.banner = { txt: 'Tajga – bobrza tama!', t: 0 };
    UI.log('MINIGRA: bobry odcięły wodę wiosce tamą! Spacja / Enter / klik – uderz mieczem, gdy wskaźnik jest na ZIELONYM. Trzeba trafić 3 razy. Pudło łamie miecz!', 'crit');
    UI.hud();
  },

  speed() { return .011 + this.S.hits * .005; },

  tick() {
    const st = this.S; if (!st || G.state !== 'dam' || UI.overlay()) return;
    st.t++; if (st.hint > 0) st.hint--;
    if (st.phase === 'aim') {
      st.pos += st.dir * this.speed();
      if (st.pos >= 1) { st.pos = 1; st.dir = -1; } else if (st.pos <= 0) { st.pos = 0; st.dir = 1; }
    }
    if (st.broken) {
      st.flow = Math.min(1, st.flow + .006); st.flee = Math.min(1, st.flee + .012);
      if (Math.random() < .5) G.fx.push({ x: 300 - st.flow * 190 + Math.random() * 40, y: 270 + Math.random() * 20, vx: -1.4, vy: -Math.random() * 1.2, life: .8, c: Math.random() < .5 ? '#bfe6ff' : '#5aa8e8', sz: 3, pt: 1 });
      if (st.flow >= 1 && !st.fin) { st.fin = true; this.finish(true); }
    }
  },

  press() {
    const st = this.S; if (!st || G.state !== 'dam' || st.phase !== 'aim' || UI.overlay()) return;
    st.phase = 'swing'; st.hint = 0;
    const green = st.pos >= st.zone[0] && st.pos <= st.zone[1];
    const p = G.p; p.pose = 'attack'; p.sw = { t0: G.t, dur: 340, big: false };
    setTimeout(() => this.hit(green), 170);
    setTimeout(() => { if (G.p) { G.p.pose = ''; G.p.sw = null; } }, 360);
  },

  async hit(green) {
    const st = this.S; if (!st || G.state !== 'dam') return;
    const hx = 330;
    if (green) {
      st.hits++; G.shake = 8 + st.hits * 3;
      for (let i = 0; i < 18; i++) G.fx.push({ x: hx + Math.random() * 30, y: 170 + Math.random() * 80, vx: (Math.random() - .3) * 5, vy: -Math.random() * 5, life: 1, c: i % 2 ? '#8a5a2a' : '#c8a05a', sz: 3 + Math.random() * 3, pt: 1 });
      G.text({ x: hx, y: 180, ox: 0, oy: 0, scale: 1, key: 'player' }, st.hits < 3 ? `TRAFIENIE ${st.hits}/3` : 'TAMA PĘKA!', '#7aff9a', true);
      UI.log(`Trafiony! Tama trzeszczy (${st.hits}/3).`, 'good');
      if (st.hits >= 3) {
        st.broken = true; st.phase = 'broken'; G.shake = 22; G.flash = .8;
        UI.log('Tama pęka! Woda rusza do wioski!', 'crit');
        return;
      }
      await sleep(650);
      st.zone = this.newZone(st.hits); st.pos = 0; st.dir = 1; st.phase = 'aim';
    } else {
      st.phase = 'lost'; st.lost = true; G.shake = 10;
      const had = !!(Player.d.gear && Player.d.gear.sword);
      for (let i = 0; i < 16; i++) G.fx.push({ x: 285, y: 235, vx: (Math.random() - .2) * 5, vy: -Math.random() * 4, life: 1, c: i % 2 ? '#cfe6ff' : '#8a8f9c', sz: 3, pt: 1 });
      if (had) {
        const it = GEAR.find(x => x.id === Player.d.gear.sword);
        Player.d.gear.sword = null; Player.spriteKey();
        G.text({ x: 285, y: 230, ox: 0, oy: 0, scale: 1, key: 'player' }, 'MIECZ SIĘ ZŁAMAŁ!', '#ff7a7a', true);
        UI.log(`Pudło! ${it ? it.name : 'Miecz'} łamie się o tamę. Nowy kupisz u zbrojmistrza.`, 'bad');
      } else {
        G.text({ x: 285, y: 230, ox: 0, oy: 0, scale: 1, key: 'player' }, 'PUDŁO!', '#ff7a7a', true);
        UI.log('Pudło! Bez miecza nie udało się rozbić tamy.', 'bad');
      }
      UI.hud();
      await sleep(1300);
      if (!st.fin) { st.fin = true; this.finish(false); }
    }
  },

  async finish(win) {
    if (win) return G.miniWin('Tama rozwalona! Woda wróciła do wioski.', 10, 'Mieszkańcy dziękują: +10 pkt umiejętności!');
    G.restoreHero();
    UI.log('Bobry wygrały tę rundę – wioska nadal bez wody. Idziesz dalej.', 'bad');
    UI.log('Fala zakończona bez nagrody.', '');
    G.state = 'clear'; await sleep(500);
    await G.advance(true);
  },

  /* ---------- rysowanie ---------- */
  draw(c) {
    const st = this.S; if (!st) return;
    const t = G.t, br = st.broken, fl = st.flow;
    c.save(); c.clearRect(0, 0, 640, 320);
    if (G.shake > 0) { c.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake); G.shake *= .85; }
    G.drawMap(c, 'taiga', 0);
    c.fillStyle = 'rgba(10,20,10,.25)'; c.fillRect(0, 0, 640, 320);
    /* wieś po lewej */
    for (let i = 0; i < 3; i++) {
      const hx = 24 + i * 62, hy = 214 + (i % 2) * 6;
      c.fillStyle = '#4a3320'; c.fillRect(hx, hy, 46, 36); c.fillStyle = '#6a4a2a'; c.fillRect(hx + 2, hy + 2, 42, 32);
      c.fillStyle = '#8a2a20'; c.beginPath(); c.moveTo(hx - 5, hy); c.lineTo(hx + 23, hy - 22); c.lineTo(hx + 51, hy); c.closePath(); c.fill();
      c.fillStyle = '#ffd24a'; c.fillRect(hx + 18, hy + 14, 10, 12);
    }
    for (let i = 0; i < 3; i++) {
      const vx = 40 + i * 58, jump = br && fl > .8 ? Math.abs(Math.sin(t / 120 + i)) * 10 : 0;
      Assets.draw(c, 'merchant', vx, 276 - jump, 1.4, t, i % 2 ? -1 : 1);
    }
    /* koryto rzeki: sucha ziemia po lewej, woda po prawej */
    c.fillStyle = '#6a5636'; c.fillRect(0, 268, 330, 52);
    c.fillStyle = '#54432a'; for (let i = 0; i < 14; i++) c.fillRect(i * 24 + (i * 7 % 10), 276 + (i * 5 % 28), 12, 2);
    const poolTop = br ? 172 + fl * 60 : 172;
    c.fillStyle = '#2a6aa8'; c.fillRect(362, poolTop, 278, 320 - poolTop);
    c.fillStyle = '#4a8ad0'; for (let i = 0; i < 9; i++) c.fillRect(366 + i * 32 + Math.sin(t / 300 + i) * 4, poolTop + 8 + (i % 3) * 16, 18, 2);
    c.fillStyle = '#8ac4f0'; c.fillRect(362, poolTop, 278, 3);
    /* woda płynąca do wioski */
    if (br) {
      const x1 = 330 - fl * 310;
      c.fillStyle = '#2a6aa8'; c.fillRect(x1, 270, 330 - x1, 50);
      c.fillStyle = '#7ab8f0'; for (let i = 0; i < 12; i++) c.fillRect(x1 + ((t / 3 + i * 40) % Math.max(10, 330 - x1)), 276 + (i % 4) * 10, 14, 2);
    }
    /* tama */
    const cr = st.hits;
    if (!br || fl < .15) {
      for (let r = 0; r < 8; r++) {
        const y = 156 + r * 14, off = r % 2 ? 6 : 0;
        c.fillStyle = '#4a2e14'; c.fillRect(316 + off, y, 50, 14);
        c.fillStyle = r % 2 ? '#8a5a2a' : '#9a6a32'; c.fillRect(318 + off, y + 1, 46, 11);
        c.fillStyle = '#5a3a18'; c.fillRect(322 + off, y + 5, 10, 2);
      }
      c.fillStyle = '#3a2410'; for (let i = 0; i < 6; i++) c.fillRect(312 + i * 9, 146 + (i % 2) * 6, 3, 14);   // wystające patyki
      c.strokeStyle = '#1a0c04'; c.lineWidth = 2;
      for (let i = 0; i < cr; i++) { c.beginPath(); c.moveTo(325 + i * 12, 160); c.lineTo(332 + i * 12, 190); c.lineTo(324 + i * 12, 215); c.lineTo(334 + i * 12, 250); c.stroke(); }
      if (cr > 0) { c.fillStyle = '#5aa8e8'; for (let i = 0; i < cr * 3; i++) c.fillRect(326 + (i * 9) % 38, 180 + (i * 17) % 80, 2, 8 + (t / 4 + i * 5) % 8); }   // przeciekająca woda
      if (br) { c.globalAlpha = Math.max(0, 1 - fl / .15); }
      c.globalAlpha = 1;
    } else {
      c.fillStyle = '#6a4a22'; for (let i = 0; i < 10; i++) c.fillRect(300 - fl * 190 + i * 16, 250 + Math.sin(t / 200 + i) * 4, 12, 5);   // spływające kłody
    }
    /* bobry */
    const fx = br ? st.flee * 180 : 0, fy = br ? st.flee * 60 : 0;
    Assets.draw(c, 'beaver', 334 + fx, 158 + fy, 2.2, t, -1);
    Assets.draw(c, 'beaver', 356 + fx, 158 + fy + Math.sin(t / 200) * 1.5, 2.0, t, -1);
    Assets.draw(c, 'beaver', 440 + fx * 1.5, 226 + Math.sin(t / 250) * 3, 2.0, t, -1);
    /* bohater */
    const p = G.p; p.pose = p.pose || ''; G.top = []; G.drawActor(p); G.top.forEach(f => f(c));
    G.fx.forEach(f => {
      c.globalAlpha = Math.max(0, f.life);
      if (f.pt) { c.fillStyle = f.c; c.fillRect(f.x, f.y, f.sz, f.sz); }
      else if (f.txt) { c.font = 'bold 18px "Courier New"'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(f.txt, f.x + 2, f.y + 2); c.fillStyle = f.c; c.fillText(f.txt, f.x, f.y); }
    });
    c.globalAlpha = 1;
    /* pasek */
    const bx = this.BX, by = this.BY, bw = this.BW, bh = this.BH;
    c.fillStyle = '#000'; c.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    c.fillStyle = '#c83a3a'; c.fillRect(bx, by, bw, bh);
    c.fillStyle = '#7a1a1a'; for (let i = 0; i < 10; i++) c.fillRect(bx, by + i * bh / 10, bw, 1);
    const z = st.zone; c.fillStyle = '#3ad66a'; c.fillRect(bx, by + z[0] * bh, bw, (z[1] - z[0]) * bh);
    c.fillStyle = '#b8ffcc'; c.fillRect(bx, by + z[0] * bh, bw, 2); c.fillRect(bx, by + z[1] * bh - 2, bw, 2);
    const my = by + st.pos * bh; c.fillStyle = '#000'; c.fillRect(bx - 10, my - 4, bw + 20, 8); c.fillStyle = '#fff'; c.fillRect(bx - 8, my - 2, bw + 16, 4);
    c.fillStyle = '#f2c14e'; c.beginPath(); c.moveTo(bx - 12, my - 7); c.lineTo(bx - 2, my); c.lineTo(bx - 12, my + 7); c.closePath(); c.fill();
    this.txt(c, `${trn('Trafienia')}: ${'●'.repeat(st.hits)}${'○'.repeat(3 - st.hits)}`, 574, 304, st.hits ? '#7aff9a' : '#f3e9d2', 12, 'right');
    this.txt(c, trn('BOBRZA TAMA'), 320, 14, '#ffd24a', 12);
    if (!(Player.d.gear && Player.d.gear.sword) && !st.lost) this.txt(c, trn('Bez miecza! Pudło = koniec próby'), 320, 30, '#ff9a9a', 11);
    if (st.hint > 0) { c.globalAlpha = Math.min(1, st.hint / 40); c.fillStyle = '#000b'; c.fillRect(120, 290, 340, 20); this.txt(c, trn('Spacja / Enter / klik – uderz na ZIELONYM'), 290, 304, '#f3e9d2', 11); c.globalAlpha = 1; }
    if (br && fl > .5) this.txt(c, trn('Woda płynie do wioski!'), 150, 200, '#bfe6ff', 14);
    if (G.banner) { const b = G.banner; b.t++; const al = Math.min(1, b.t / 25, (170 - b.t) / 30); if (al <= 0) G.banner = null; else { c.globalAlpha = al; this.txt(c, trn(b.txt), 320, 50, '#f2c14e', 20); c.globalAlpha = 1; } }
    if (G.flash > .02) { c.fillStyle = `rgba(255,255,230,${G.flash * .7})`; c.fillRect(0, 0, 640, 320); G.flash *= .9; }
    c.restore(); c.globalAlpha = 1;
    if (G.fade > 0) { c.fillStyle = `rgba(0,0,0,${G.fade})`; c.fillRect(0, 0, 640, 320); }
  },

  txt(c, s, x, y, col, size, al) {
    c.font = `bold ${size || 12}px "Courier New"`; c.textAlign = al || 'center';
    c.fillStyle = '#000'; c.fillText(s, x + 1, y + 1); c.fillStyle = col || '#f3e9d2'; c.fillText(s, x, y);
  }
};
