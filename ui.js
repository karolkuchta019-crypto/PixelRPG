const UI = {
  $: id => document.getElementById(id),

  log(t, c = '') {
    const l = this.$('log'), p = document.createElement('p');
    p.textContent = t; p.className = c;
    l.prepend(p);
    while (l.children.length > 40) l.lastChild.remove();
  },

  hud() {
    const d = Player.d, m = MAPS[G.cur().map];
    this.$('wave').textContent = this.waveLabel();
    this.$('mapname').textContent = m.name;
    this.$('lvl').textContent = 'LVL ' + d.level;
    this.$('xpbar').style.width = 100 * d.xp / Player.xpNext() + '%';
    this.$('hpbar').style.width = 100 * d.hp / d.maxhp + '%';
    const sk = d.sk || {};
    document.querySelector('[data-a=shoot]').classList.toggle('hidden', !(sk.bow || sk.xbow));
    const fb = document.querySelector('[data-a=fire]');
    fb.classList.toggle('hidden', !sk.fire);
    fb.textContent = Combat.fbCd > 0 ? `Kula ognia (${Combat.fbCd})` : 'Kula ognia';
    const atk = Player.atk(), def = Player.def();
    const gAtk = Player.gearBonus('atk'), gDef = Player.gearBonus('def');
    const ptsLabel = G.dev ? '∞' : String(d.pending|0);
    this.$('stats').textContent =
      `HP ${d.hp}/${d.maxhp}  ATK ${atk}${gAtk ? `(+${gAtk})` : ''}  DEF ${def}${gDef ? `(+${gDef})` : ''}  ` +
      `PUNKTY ${ptsLabel}  Eliksiry ${d.potions|0}  KOMPANI ${(d.comps || []).length}/3  ` +
      `CRIT ${Math.round(d.crit * 100)}%  UNIK ${Math.round(d.dodge * 100)}%`;
  },

  lock(b) {
    document.querySelectorAll('#actions button').forEach(x =>
      x.disabled = b ||
        (x.dataset.a === 'potion' && Player.d.potions < 1) ||
        (x.dataset.a === 'fire' && Combat.fbCd > 0)
    );
  },

  screen(title, text, btns, cls) {
    const s = this.$('screen');
    s.innerHTML = '';
    s.className = cls || '';
    const h = document.createElement('h2');
    h.textContent = title;
    s.append(h);
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      s.append(p);
    }
    btns.forEach(b => {
      const e = document.createElement('button');
      e.textContent = b.l;
      e.onclick = () => { s.classList.add('hidden'); b.f(); };
      s.append(e);
    });
  },

  waveLabel() {
    return G.mode === 'campaign'
      ? `Etap ${G.level + 1}, fala ${G.wave}/${G.waves.length}`
      : 'Fala ' + G.wave;
  },

  title() {
    Music.play(null);   // w menu cisza
    this.screen('MONSTER WAVES',
      'Wybierz tryb. WASD / strzałki – ruch, Spacja – skok, M – muzyka, kliknij wroga, by go namierzyć.',
      [{ l: 'Kampania', f: () => this.campaign() },
       { l: 'Tryb nieskończony', f: () => this.endless() }]);
  },

  endless() {
    const b = [{ l: 'Nowa gra', f: () => G.startEndless(true) }];
    if (Save.get('endless'))
      b.push({ l: 'Kontynuuj (fala ' + Save.get('endless').w + ')', f: () => G.startEndless(false) });
    b.push({ l: 'Wstecz', f: () => this.title() });
    this.screen('Tryb nieskończony', 'Przetrwaj jak najwięcej fal.', b);
  },

  campaign() {
    /* mapa świata na start kampanii */
    this.worldMap({ start: 1 });
  },

  /* --- MAPA ŚWIATA --- */
  worldMap(opts = {}) {
    const s = this.$('screen');
    s.innerHTML = '';
    s.className = 'worldmap';
    s.classList.remove('hidden');
    const save = Save.get('campaign') || { cleared: 0 };
    const cleared = G.dev ? CAMPAIGN.length : (save.cleared || 0);
    const h = document.createElement('h2');
    h.textContent = opts.fromDeath ? 'Porażka – Mapa świata' : 'Mapa świata';
    s.append(h);
    const sub = document.createElement('p');
    sub.textContent = opts.fromDeath
      ? 'Wybierz odblokowany etap, by spróbować ponownie. Zablokowane etapy są niedostępne.'
      : opts.fromMenu
        ? 'Podgląd mapy (Tab). Kliknij Zamknij, by wrócić.'
        : 'Kliknij etap, aby wyruszyć. Niepokonane etapy są zablokowane.' + (G.dev ? ' [DEV: wszystko odblokowane]' : '');
    s.append(sub);

    const map = document.createElement('div');
    map.className = 'wmap';
    /* pozycje kafelków (procentowo w obszarze mapy) – ścieżka lewo→prawo, lekko falująca */
    const POS = [
      [8, 28], [22, 42], [36, 30], [48, 48], [60, 32],
      [70, 50], [78, 34], [86, 52], [90, 70], [78, 82]
    ];
    const COLORS = {
      forest: '#3a8a3a', village: '#b87840', swamp: '#4a6a4a', taiga: '#2a5a3a',
      ice: '#80b0d0', cave: '#4a3a6a', desert: '#d0a050', plant: '#5a5a6a',
      lava: '#a03020', stadium: '#3a1a3a'
    };
    CAMPAIGN.forEach((L, i) => {
      const node = document.createElement('button');
      const unlocked = i <= cleared || G.dev;
      const done = i < cleared;
      node.className = 'wmap-node' + (unlocked ? '' : ' locked') + (done ? ' done' : '');
      const [px, py] = POS[i] || [10 + i * 9, 40];
      node.style.left = px + '%';
      node.style.top = py + '%';
      node.style.background = COLORS[L.map] || '#5a4a6a';
      node.innerHTML = `<span class="wn-num">${i + 1}</span><span class="wn-name">${L.name}</span>` +
        (done ? '<span class="wn-tag">✓</span>' : unlocked ? '' : '<span class="wn-tag">🔒</span>');
      if (unlocked && !opts.fromMenu) {
        node.onclick = () => {
          s.classList.add('hidden');
          if (opts.fromDeath) {
            /* przywróć stan z snapshota etapu lub zapisanej postaci */
            const snap = G.snap ? JSON.parse(G.snap) : (Save.get('campaign') || {}).p;
            if (snap) Player.d = snap;
            else Player.d = Player.base();
            Player.d.gear = Player.d.gear || { sword: null, armor: null, shield: null };
            Player.d.hp = Player.d.maxhp;
            G.mode = 'campaign';
            G.level = i;
            G.wave = 1;
            G.waves = buildWaves(i);
            G.snap = JSON.stringify(Player.d);
            G.newRun();
          } else {
            G.startCampaign(i, true);
          }
        };
      } else {
        node.disabled = true;
      }
      map.append(node);
      /* ścieżka do następnego */
      if (i < CAMPAIGN.length - 1) {
        const [nx, ny] = POS[i + 1] || [px + 10, py];
        const path = document.createElement('div');
        path.className = 'wmap-path' + (i < cleared || G.dev ? ' open' : '');
        const x1 = px + 4, y1 = py + 3, x2 = nx + 4, y2 = ny + 3;
        const len = Math.hypot(x2 - x1, y2 - y1);
        const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        path.style.left = x1 + '%';
        path.style.top = y1 + '%';
        path.style.width = len + '%';
        path.style.transform = `rotate(${ang}deg)`;
        map.append(path);
      }
    });
    s.append(map);

    const row = document.createElement('div');
    row.className = 'wmap-actions';
    if (opts.fromDeath && opts.retryLevel != null && (opts.retryLevel <= cleared || G.dev)) {
      const retry = document.createElement('button');
      retry.textContent = 'Spróbuj ponownie (ten etap)';
      retry.onclick = () => {
        s.classList.add('hidden');
        Player.d = G.snap ? JSON.parse(G.snap) : Player.base();
        Player.d.gear = Player.d.gear || { sword: null, armor: null, shield: null };
        Player.d.hp = Player.d.maxhp;
        G.level = opts.retryLevel;
        G.wave = 1;
        G.waves = buildWaves(opts.retryLevel);
        G.snap = JSON.stringify(Player.d);
        G.newRun();
      };
      row.append(retry);
    }
    if (!opts.fromDeath) {
      const neu = document.createElement('button');
      neu.textContent = 'Nowa kampania';
      neu.onclick = () => { Save.clear('campaign'); this.worldMap({ start: 1 }); };
      row.append(neu);
    }
    const back = document.createElement('button');
    back.textContent = opts.fromDeath ? 'Menu główne' : (opts.fromMenu ? 'Zamknij' : 'Wstecz');
    back.onclick = () => { if (opts.fromMenu) this.closeMenu(); else this.title(); };
    row.append(back);
    s.append(row);
  },

  /* --- MENU TAB --- */
  menuOpen: false,
  toggleMenu() {
    if (this.menuOpen) { this.closeMenu(); return; }
    if (['title', 'cutscene'].includes(G.state) && !G.p) {
      /* w menu tytułowym też można otworzyć, ale bez mapy walki */
    }
    this.menuOpen = true;
    const s = this.$('screen');
    s.innerHTML = '';
    s.className = 'tabmenu';
    s.classList.remove('hidden');
    const h = document.createElement('h2');
    h.textContent = 'Menu (Tab)';
    s.append(h);

    const mk = (label, locked, fn) => {
      const b = document.createElement('button');
      b.textContent = locked ? label + ' 🔒' : label;
      if (locked) { b.disabled = true; b.classList.add('locked-opt'); }
      else b.onclick = fn;
      s.append(b);
    };

    mk('🗺  Mapa świata', false, () => {
      this.menuOpen = false;
      this.worldMap({ fromMenu: 1 });
    });

    /* muzyka */
    const musicBox = document.createElement('div');
    musicBox.className = 'menu-block';
    musicBox.innerHTML = `<p><b>Muzyka</b>: ${Music.on ? 'włączona' : 'wyłączona'}</p>`;
    const tog = document.createElement('button');
    tog.textContent = Music.on ? 'Wyłącz muzykę' : 'Włącz muzykę';
    tog.onclick = () => { Music.toggle(); tog.textContent = Music.on ? 'Wyłącz muzykę' : 'Włącz muzykę'; };
    musicBox.append(tog);
    const volL = document.createElement('label');
    volL.textContent = ' Głośność: ';
    const vol = document.createElement('input');
    vol.type = 'range'; vol.min = 0; vol.max = 100; vol.value = Math.round((Music.vol || 0.5) * 100);
    vol.oninput = () => {
      Music.vol = vol.value / 100;
      if (Music.cur) Music.cur.volume = Music.vol;
    };
    volL.append(vol);
    musicBox.append(volL);
    s.append(musicBox);

    /* statystyki */
    const d = Player.d || {};
    const stats = document.createElement('div');
    stats.className = 'menu-block';
    stats.innerHTML = `<p><b>Statystyki gracza</b></p>
      <p>Poziom: ${d.level || 1} &nbsp;|&nbsp; Zabici przeciwnicy: ${d.kills || 0}<br>
      Liczba śmierci: ${d.deaths || 0} &nbsp;|&nbsp; Eliksiry: ${d.potions || 0}</p>`;
    s.append(stats);

    mk('⚙  Poziom trudności (wkrótce)', true, null);
    mk('🖼  Ustawienia graficzne (wkrótce)', true, null);

    const close = document.createElement('button');
    close.textContent = 'Zamknij (Tab)';
    close.onclick = () => this.closeMenu();
    s.append(close);
  },
  closeMenu() {
    this.menuOpen = false;
    const s = this.$('screen');
    /* nie chowaj ekranu jeśli jesteśmy w sklepie / tytule – tylko gdy menu było nad grą */
    if (G.state === 'fight' || G.state === 'clear' || G.state === 'over' || G.state === 'won' || G.state === 'moving') {
      s.classList.add('hidden');
      s.innerHTML = '';
    } else if (G.state === 'title' || !G.p) {
      this.title();
    } else {
      s.classList.add('hidden');
    }
  },

  /* --- NAPISY KOŃCOWE --- */
  credits() {
    const s = this.$('screen');
    s.innerHTML = '';
    s.className = 'credits';
    s.classList.remove('hidden');
    const wrap = document.createElement('div');
    wrap.className = 'credits-scroll';
    wrap.innerHTML = `
      <h2>THE END</h2>
      <p class="cr-thanks">Dziękujemy za grę!</p>
      <p class="cr-sec">— MUZYKA —</p>
      <p>Music track: <b>Colossal</b> by Aylex<br>
      Source: <a href="https://freetouse.com/music" target="_blank" rel="noopener">https://freetouse.com/music</a><br>
      No Copyright Background Music</p>
      <p>Music track: <b>Gameboy</b> by Walen<br>
      Source: <a href="https://freetouse.com/music" target="_blank" rel="noopener">https://freetouse.com/music</a><br>
      Royalty Free Music for Video (Safe)</p>
      <p class="cr-sec">— MONSTER WAVES —</p>
      <p>Pixel RPG · Kampania · Bossowie · Mapa świata</p>
    `;
    s.append(wrap);
    const b = document.createElement('button');
    b.textContent = 'Menu główne';
    b.style.marginTop = '16px';
    b.onclick = () => { G.state = 'title'; this.title(); };
    s.append(b);
  },

  /* --- sklep wieśniaka (umiejętności) – przed bossem --- */
  shop(done) {
    const d = Player.d, s = this.$('screen');
    d.sk = d.sk || {};
    s.innerHTML = '';
    s.classList.remove('hidden');
    const im = document.createElement('img');
    im.src = 'assets/ui/merchant.png';
    im.width = im.height = 96;
    im.onerror = () => im.remove();
    s.append(im);
    const h = document.createElement('h2');
    h.textContent = 'Wędrowny Kupiec';
    s.append(h);
    const p = document.createElement('p');
    p.textContent = 'Wymień punkty poziomu na umiejętności. Twoje punkty: ' + (G.dev ? '∞' : d.pending) +
      '   Kompani: ' + (d.comps || []).length + '/3';
    s.append(p);
    const g = document.createElement('div');
    g.className = 'trades';
    s.append(g);
    SKILLS.forEach(k => {
      const own = d.sk[k.id] || 0, c = Player.cost(k);
      const b = document.createElement('button');
      const full = k.comp ? (d.comps || []).length >= 3 : own >= k.max;
      b.textContent = `${k.name}: ${k.desc} [${full ? (k.comp ? 'DRUŻYNA PEŁNA' : 'MAX') : c + ' pkt'}]` +
        (!k.comp && own && k.max > 1 ? ' x' + own : '');
      b.disabled = full || (!G.dev && d.pending < c);
      b.onclick = () => { Player.buy(k.id); this.hud(); this.shop(done); };
      g.append(b);
    });
    const x = document.createElement('button');
    x.textContent = 'Idź dalej';
    x.onclick = () => { s.classList.add('hidden'); G.syncComps(); done(); };
    s.append(x);
  },

  /* --- sklep zbrojmistrza (ekwipunek) – po bossie --- */
  smith(done) {
    const d = Player.d, s = this.$('screen');
    d.gear = d.gear || { sword: null, armor: null, shield: null };
    s.innerHTML = '';
    s.classList.remove('hidden');

    const im = document.createElement('img');
    im.src = 'assets/ui/blacksmith.png';
    im.width = im.height = 96;
    im.style.imageRendering = 'pixelated';
    im.onerror = () => im.remove();
    s.append(im);

    const h = document.createElement('h2');
    h.textContent = 'Zbrojmistrz';
    s.append(h);

    const eqName = (slot) => {
      const id = d.gear[slot];
      if (!id) return 'brak';
      const it = GEAR.find(x => x.id === id);
      return it ? it.name : id;
    };
    const info = document.createElement('p');
    info.innerHTML = `Punkty: <b>${G.dev ? '∞' : d.pending}</b><br>Miecz: ${eqName('sword')} · Zbroja: ${eqName('armor')} · Tarcza: ${eqName('shield')}` +
      `<br>Dystans: ${d.sk && d.sk.xbow ? 'Kusza' : d.sk && d.sk.bow ? 'Łuk' : 'brak'}`;
    s.append(info);

    /* osobna sekcja na każdą kategorię – nagłówek pełnej szerokości + siatka przedmiotów */
    const sections = [
      { key: 'sword',  label: 'MIECZE  (atak)' },
      { key: 'armor',  label: 'ZBROJE  (obrona + wygląd)' },
      { key: 'shield', label: 'TARCZE  (obrona)' },
      { key: 'ranged', label: 'BROŃ DYSTANSOWA' }
    ];
    sections.forEach(sec => {
      const wrap = document.createElement('div');
      wrap.className = 'smith-section';
      wrap.style.cssText = 'width:100%;max-width:720px;margin-top:10px';

      const lab = document.createElement('div');
      lab.textContent = sec.label;
      lab.style.cssText = 'text-align:center;font-weight:bold;color:#f2c14e;font-size:13px;margin:6px 0 4px;letter-spacing:1px;border-bottom:1px solid #5a4a20;padding-bottom:4px';
      wrap.append(lab);

      const grid = document.createElement('div');
      grid.className = 'trades';
      GEAR.filter(it => it.slot === sec.key).forEach(it => {
        const b = document.createElement('button');
        d.sk = d.sk || {};
        const owned = it.skill ? !!d.sk[it.skill] : d.gear[it.slot] === it.id;
        b.textContent = owned
          ? `${it.name}  ✓ ZAŁOŻONE`
          : `${it.name}: ${it.desc}  [${it.cost} pkt]`;
        b.disabled = owned || (!G.dev && d.pending < it.cost);
        if (owned) b.style.outline = '2px solid #7aff9a';
        b.onclick = () => {
          if (Player.equip(it.id)) {
            if (G.p) G.p.key = Player.spriteKey();
            this.hud();
            this.smith(done);
          }
        };
        grid.append(b);
      });
      wrap.append(grid);
      s.append(wrap);
    });

    const x = document.createElement('button');
    x.textContent = 'Idź dalej';
    x.style.marginTop = '12px';
    x.onclick = () => { s.classList.add('hidden'); if (G.p) G.p.key = Player.spriteKey(); done(); };
    s.append(x);
  }
};
