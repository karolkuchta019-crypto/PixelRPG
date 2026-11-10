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
    document.querySelector('[data-a=skipwave]').classList.toggle('hidden', !G.dev);   // v1.1: tryb dev – pomijanie fali
    const fb = document.querySelector('[data-a=fire]');
    fb.classList.toggle('hidden', !sk.fire);
    fb.textContent = Combat.fbCd > 0 ? `Kula ognia (${Combat.fbCd})` : 'Kula ognia';
    const atk = Player.atk(), def = Player.def();
    const gAtk = Player.gearBonus('atk'), gDef = Player.gearBonus('def');
    const ptsLabel = G.dev ? '∞' : String(d.pending|0);
    this.$('stats').textContent =
      `HP ${d.hp}/${d.maxhp}  ATK ${atk}${gAtk ? `(+${gAtk})` : ''}  DEF ${def}${gDef ? `(+${gDef})` : ''}  ` +
      `PUNKTY ${ptsLabel}  Eliksiry ${d.potions|0}  KOMPANI ${(d.comps || []).length}/3  ` +
      `CRIT ${Math.round((d.crit + Player.luck()) * 100)}%  UNIK ${Math.round(d.dodge * 100)}%`;
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
    if (G.hub) return 'Chatka wiedźmy';
    return G.mode === 'campaign'
      ? `Etap ${G.level + 1}, fala ${G.wave}/${G.waves.length}`
      : 'Fala ' + G.wave;
  },

  title() {
    Music.play(null);   // w menu cisza
    this.screen('MONSTER WAVES  v' + VERSION,
      'Wybierz tryb. WASD / strzałki – ruch, Spacja – skok, M – muzyka, kliknij wroga, by go namierzyć.',
      [{ l: 'Kampania', f: () => this.campaign() },
       { l: 'Tryb nieskończony', f: () => this.endless() },
       { l: 'Wczytaj grę (sloty)', f: () => this.slots('load', 'title') }]);
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

  /* --- MAPA ŚWIATA (v1.0) ---
     Siatka 5 kolumn x 2 rzędy "wężykiem" (1-5 w prawo, 6-10 w lewo) – kafelki nigdy na siebie nie nachodzą, a strzałki pokazują kolejność.
     Każdy kafelek ma obrazek świata. W podglądzie z menu (Tab) kliknięcie odblokowanego etapu przenosi do niego. */
  worldMap(opts = {}) {
    const s = this.$('screen');
    s.innerHTML = '';
    s.className = 'worldmap';
    s.classList.remove('hidden');
    const save = Save.get('campaign') || { cleared: 0 };
    const cleared = G.dev ? CAMPAIGN.length : (save.cleared || 0);
    const canJump = !!opts.fromMenu && G.mode === 'campaign' && !!G.p && ['fight', 'clear'].includes(G.state) && !Combat.busy;
    const here = (G.mode === 'campaign' && G.p && !opts.fromDeath) ? G.level : -1;

    const h = document.createElement('h2');
    h.textContent = opts.fromDeath ? 'Porażka – Mapa świata' : 'Mapa świata';
    s.append(h);
    const sub = document.createElement('p');
    sub.textContent = opts.fromDeath
      ? 'Wybierz odblokowany etap, by spróbować ponownie.'
      : opts.fromMenu
        ? (canJump ? 'Kliknij odblokowany etap, aby się do niego przenieść (zaczniesz od 1. fali tego etapu).'
                   : 'Podgląd mapy. Przenoszenie między etapami działa w trakcie kampanii (poza walką).')
        : 'Kliknij etap, aby wyruszyć. Niepokonane etapy są zablokowane.' + (G.dev ? ' [DEV: wszystko odblokowane]' : '');
    s.append(sub);

    const info = document.createElement('div');
    info.className = 'wm-info';
    const defInfo = 'Najedź na etap, aby zobaczyć przeciwników.';
    info.textContent = defInfo;

    const COLS = 5, grid = document.createElement('div');
    grid.className = 'wm-grid';
    CAMPAIGN.forEach((L, i) => {
      const row = Math.floor(i / COLS), col = i % COLS;
      const unlocked = i <= cleared || G.dev, done = i < cleared;
      const cell = document.createElement('div');
      cell.className = 'wm-cell';
      cell.style.gridRow = row + 1;
      cell.style.gridColumn = row % 2 === 0 ? col + 1 : COLS - col;
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'wm-card' + (unlocked ? '' : ' locked') + (done ? ' done' : '') + (i === here ? ' here' : '') +
        (opts.fromMenu && !canJump ? ' preview' : '');
      const tag = i === here ? '● TU JESTEŚ' : done ? '✓ UKOŃCZONY' : unlocked ? '▶ DOSTĘPNY' : '🔒 ZABLOKOWANY';
      node.innerHTML = `<span class="wm-img" style="background-image:url(${MAPS[L.map].src})"></span>` +
        `<span class="wm-num">${i + 1}</span><span class="wm-name">${L.name}</span>` +
        `<span class="wm-boss">Boss: ${ENEMY_DEFS[L.boss].name}${Player.d && Player.d.witch && L.boss === 'witch' ? ' · 🧙 sklep' : ''}</span><span class="wm-tag">${tag}</span>`;
      const foes = L.foes.map(f => ENEMY_DEFS[f].name).join(', ');
      const show = () => { info.textContent = `Etap ${i + 1}: ${L.name} — wrogowie: ${foes} · boss: ${ENEMY_DEFS[L.boss].name}`; };
      node.onmouseenter = show; node.onfocus = show;
      node.onmouseleave = () => { info.textContent = defInfo; };
      if (unlocked && (!opts.fromMenu || canJump)) {
        node.onclick = () => {
          if (opts.fromMenu) {
            /* v1.1: pokonana wiedźma czeka na Moczarach – klik w bagna = wizyta w jej chatce (poza samymi Moczarami) */
            if (Player.d && Player.d.witch && L.boss === 'witch' && G.level !== i &&
                confirm('Odwiedzić Wiedźmę w chatce na Moczarach?\n\nOK – odwiedź ją (eliksiry i talizmany szczęścia, potem wrócisz tu, gdzie byłeś).\nAnuluj – pokaż inne opcje.')) {
              G.visitWitch();
              return;
            }
            if (!confirm(`Przenieść się do etapu ${i + 1}: ${L.name}? Postęp w bieżącym etapie zostanie utracony.`)) return;
            G.jumpToStage(i);
            return;
          }
          s.classList.add('hidden');
          if (opts.fromDeath) {
            /* przywróć stan z snapshota etapu lub zapisanej postaci */
            const snap = G.snap ? JSON.parse(G.snap) : (Save.get('campaign') || {}).p;
            Player.d = snap || Player.base();
            Player.d.gear = Player.d.gear || { sword: null, armor: null, shield: null };
            Player.d.hp = Player.d.maxhp;
            G.mode = 'campaign';
            G.level = i; G.wave = 1; G.waves = buildWaves(i);
            G.snap = JSON.stringify(Player.d);
            G.newRun();
          } else {
            G.startCampaign(i, true);
          }
        };
      } else if (!unlocked) {
        node.setAttribute('aria-disabled', 'true');
      }
      cell.append(node);
      if (i < CAMPAIGN.length - 1) {
        const nextRow = Math.floor((i + 1) / COLS);
        const link = document.createElement('div');
        link.className = 'wm-link ' + (nextRow !== row ? 'd' : row % 2 === 0 ? 'r' : 'l') + (i < cleared || G.dev ? ' open' : '');
        cell.append(link);
      }
      grid.append(cell);
    });
    s.append(grid);
    s.append(info);

    const rowB = document.createElement('div');
    rowB.className = 'wmap-actions';
    if (opts.fromDeath && opts.retryLevel != null && (opts.retryLevel <= cleared || G.dev)) {
      const retry = document.createElement('button');
      retry.textContent = 'Spróbuj ponownie (ten etap)';
      retry.onclick = () => {
        s.classList.add('hidden');
        Player.d = G.snap ? JSON.parse(G.snap) : Player.base();
        Player.d.gear = Player.d.gear || { sword: null, armor: null, shield: null };
        Player.d.hp = Player.d.maxhp;
        G.level = opts.retryLevel; G.wave = 1; G.waves = buildWaves(opts.retryLevel);
        G.snap = JSON.stringify(Player.d);
        G.newRun();
      };
      rowB.append(retry);
    }
    if (!opts.fromDeath && !opts.fromMenu) {
      const neu = document.createElement('button');
      neu.textContent = 'Nowa kampania';
      neu.onclick = () => { Save.clear('campaign'); this.worldMap({ start: 1 }); };
      rowB.append(neu);
    }
    const back = document.createElement('button');
    back.textContent = opts.fromDeath ? 'Menu główne' : (opts.fromMenu ? 'Zamknij' : 'Wstecz');
    back.onclick = () => { if (opts.fromMenu) this.closeMenu(); else this.title(); };
    rowB.append(back);
    s.append(rowB);
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

    /* v1.1: zapis / odczyt (PostgreSQL, 3 sloty) i nowa gra */
    mk('💾  Zapisz grę (3 sloty)', !Slots.canSave(), () => { this.menuOpen = false; this.slots('save', 'menu'); });
    mk('📂  Wczytaj grę', !Slots.canLoad(), () => { this.menuOpen = false; this.slots('load', 'menu'); });
    mk('⚔  Nowa kampania', false, () => this.newGame('campaign'));
    mk('♾  Nowy tryb nieskończony', false, () => this.newGame('endless'));

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

  /* --- v1.1: NOWA GRA z menu (Tab) --- */
  newGame(kind) {
    const txt = kind === 'campaign' ? 'Rozpocząć NOWĄ kampanię?' : 'Rozpocząć NOWY tryb nieskończony?';
    if (!confirm(txt + '\nNiezapisany postęp zostanie utracony (zapisy w slotach zostają).')) return;
    const s = this.$('screen');
    s.classList.add('hidden'); s.innerHTML = ''; this.menuOpen = false;
    G.nextBub(); G.hub = null; Combat.busy = false;
    if (kind === 'endless') { G.startEndless(true); return; }
    Save.clear('campaign');
    G.p = null; G.actors = []; G.enemies = []; G.comps = []; G.npcs = []; G.state = 'title';
    this.worldMap({ start: 1 });
  },

  /* --- v1.1: SLOTY ZAPISU (PostgreSQL przez serwer w server/). mode: 'save' | 'load'; from: 'menu' | 'title' --- */
  slots(mode, from) {
    const s = this.$('screen');
    s.innerHTML = ''; s.className = 'slots'; s.classList.remove('hidden');
    const h = document.createElement('h2');
    h.textContent = mode === 'save' ? 'Zapisz grę' : 'Wczytaj grę';
    s.append(h);
    const msg = document.createElement('p');
    msg.className = 'slot-msg';
    msg.textContent = mode === 'save'
      ? 'Wybierz slot (nadpisze poprzedni zapis). Zapisuje bieżącą kampanię albo tryb nieskończony.'
      : 'Wybierz slot. Wczytanie zaczyna bieżącą falę od nowa (albo wraca do sklepów po wygranej fali).';
    s.append(msg);
    const list = document.createElement('div');
    list.className = 'slot-list';
    s.append(list);
    const back = document.createElement('button');
    back.textContent = 'Wstecz';
    back.onclick = () => { if (from === 'title') this.title(); else this.toggleMenu(); };
    s.append(back);

    const say = (t, bad) => { msg.textContent = t; msg.style.color = bad ? '#ff7a7a' : ''; };
    const render = async () => {
      list.textContent = 'Łączenie z bazą…';
      let rows;
      try { rows = await Slots.list(); } catch (e) { list.textContent = ''; say(e.message, true); return; }
      list.textContent = '';
      for (let n = 1; n <= Slots.N; n++) {
        const r = rows.find(x => x.slot === n);
        const card = document.createElement('div');
        card.className = 'slot-card' + (r ? '' : ' empty');
        const t = document.createElement('div');
        t.className = 'slot-title';
        t.textContent = `Slot ${n} — ` + (r ? (r.mode === 'campaign' ? 'Kampania' : 'Tryb nieskończony') : 'pusty');
        card.append(t);
        if (r) {
          const m = r.meta || {};
          const d = document.createElement('div');
          d.className = 'slot-info';
          d.textContent = `${m.label || ''} · LVL ${m.level || '?'} · zabici: ${m.kills || 0} · ${new Date(r.updated_at).toLocaleString('pl-PL')}`;
          card.append(d);
        }
        const row = document.createElement('div');
        row.className = 'slot-btns';
        const mk = (label, dis, fn) => { const b = document.createElement('button'); b.textContent = label; b.disabled = !!dis; b.onclick = fn; row.append(b); };
        if (mode === 'save') {
          mk(r ? 'Nadpisz' : 'Zapisz tutaj', !Slots.canSave(), async () => {
            if (r && !confirm(`Nadpisać slot ${n}?`)) return;
            try { await Slots.save(n); say(`Zapisano w slocie ${n}.`); render(); } catch (e) { say(e.message, true); }
          });
        } else {
          mk('Wczytaj', !r || !(from === 'title' || Slots.canLoad()), async () => {
            try { await Slots.load(n); } catch (e) { say(e.message, true); }
          });
        }
        if (r) mk('Usuń', false, async () => {
          if (!confirm(`Usunąć zapis ze slotu ${n}?`)) return;
          try { await Slots.del(n); say(`Slot ${n} usunięty.`); render(); } catch (e) { say(e.message, true); }
        });
        card.append(row);
        list.append(card);
      }
      if (mode === 'save' && !Slots.canSave()) say('Zapis jest możliwy w walce (gdy nic się nie animuje) lub po wygranej fali – nie w dialogach, sklepie i chatce wiedźmy.', true);
    };
    render();
  },

  /* --- NAPISY KOŃCOWE (v1.1: przewijane od dołu do góry jak na filmach) --- */
  credits() {
    const s = this.$('screen');
    s.innerHTML = '';
    s.className = 'credits';
    s.classList.remove('hidden');
    const roll = document.createElement('div');
    roll.className = 'credits-roll';
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
    roll.append(wrap);
    s.append(roll);
    const b = document.createElement('button');
    b.className = 'credits-btn';
    b.textContent = 'Pomiń ▶▶';
    let anim = null;
    b.onclick = () => { if (anim) anim.cancel(); G.state = 'title'; this.title(); };
    s.append(b);
    requestAnimationFrame(() => {
      const H = roll.clientHeight, h = wrap.offsetHeight, speed = 0.045;   // px/ms (~45 px/s)
      anim = wrap.animate(
        [{ transform: `translate(-50%, ${H}px)` }, { transform: `translate(-50%, ${-h}px)` }],
        { duration: (H + h) / speed, easing: 'linear', fill: 'forwards' });
      anim.onfinish = () => { b.textContent = 'Menu główne'; };
    });
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
      '   Kompani: ' + (d.comps || []).length + '/3' + (d.sk.fire ? '   Moc kuli ognia: ' + Player.fireDmg() : '');
    s.append(p);
    const g = document.createElement('div');
    g.className = 'trades';
    s.append(g);
    SKILLS.forEach(k => {
      const own = d.sk[k.id] || 0, c = Player.cost(k);
      const b = document.createElement('button');
      const full = k.comp ? (d.comps || []).length >= 3 : own >= k.max;
      const need = k.req && !d.sk[k.req];   // v1.1: np. moc kuli wymaga kuli ognia
      b.textContent = `${k.name}: ${k.desc} [${need ? 'najpierw: Kula ognia' : full ? (k.comp ? 'DRUŻYNA PEŁNA' : 'MAX') : c + ' pkt'}]` +
        (!k.comp && own && k.max > 1 ? ' x' + own : '');
      b.disabled = full || need || (!G.dev && d.pending < c);
      b.onclick = () => { Player.buy(k.id); this.hud(); this.shop(done); };
      g.append(b);
    });
    const x = document.createElement('button');
    x.textContent = 'Idź dalej';
    x.onclick = () => { s.classList.add('hidden'); G.syncComps(); done(); };
    s.append(x);
  },

  /* --- v1.1: sklep wiedźmy (eliksiry + talizmany szczęścia = szansa na cios krytyczny) --- */
  witch(done) {
    const d = Player.d, s = this.$('screen');
    d.wi = d.wi || {};
    s.innerHTML = '';
    s.className = '';
    s.classList.remove('hidden');
    const cv = document.createElement('canvas');
    cv.width = cv.height = 96;
    const cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = false;
    Assets.draw(cx, 'witch', 48, 96, 2, 0);
    s.append(cv);
    const h = document.createElement('h2');
    h.textContent = 'Wiedźma z Moczarów';
    s.append(h);
    const p = document.createElement('p');
    p.innerHTML = `Punkty: <b>${G.dev ? '∞' : d.pending}</b> · Szczęście (szansa na krytyk): <b>${Math.round((d.crit + Player.luck()) * 100)}%</b> (w tym talizmany: +${Math.round(Player.luck() * 100)}%)`;
    s.append(p);
    [['potion', 'ELIKSIRY'], ['charm', 'TALIZMANY SZCZĘŚCIA']].forEach(([kind, label]) => {
      const lab = document.createElement('div');
      lab.textContent = label;
      lab.style.cssText = 'text-align:center;font-weight:bold;color:#f2c14e;font-size:13px;margin:6px 0 4px;letter-spacing:1px;border-bottom:1px solid #5a4a20;padding-bottom:4px;width:100%;max-width:720px';
      s.append(lab);
      const g = document.createElement('div');
      g.className = 'trades';
      WITCH.filter(k => k.kind === kind).forEach(k => {
        const own = d.wi[k.id] || 0, c = Player.wcost(k), full = own >= k.max;
        const b = document.createElement('button');
        b.textContent = `${k.name}: ${k.desc} [${full ? (k.max === 1 ? '✓ POSIADANE' : 'MAX') : c + ' pkt'}]` + (own && k.max > 1 ? ' x' + own : '');
        b.disabled = full || (!G.dev && d.pending < c);
        if (full && k.max === 1) b.style.outline = '2px solid #7aff9a';
        b.onclick = () => { if (Player.buyWitch(k.id)) { this.hud(); this.witch(done); } };
        g.append(b);
      });
      s.append(g);
    });
    const x = document.createElement('button');
    x.textContent = 'Idź dalej';
    x.style.marginTop = '12px';
    x.onclick = () => { s.classList.add('hidden'); done(); };
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
    const note = document.createElement('p');
    note.textContent = 'Zbrojmistrz nie skupuje towaru. Nowy przedmiot zastępuje stary – zostaje tylko najlepszy, jaki kupiłeś.';
    note.style.cssText = 'font-size:11px;opacity:.8;margin:0';
    s.append(note);
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
        const own = Player.ownedTier(it.slot), tr = Player.tier(it);
        const owned = tr === own;            // dokładnie ten przedmiot
        const worse = tr < own;              // mamy już lepszy – słabszego nie kupimy
        b.textContent = owned
          ? `${it.name}  ✓ POSIADANE`
          : worse
            ? `${it.name}  (masz lepszy)`
            : `${it.name}: ${it.desc}  [${it.cost} pkt]`;
        b.disabled = owned || worse || (!G.dev && d.pending < it.cost);
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

    /* v1.1: skórzana zbroja dla giermka */
    {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'width:100%;max-width:720px;margin-top:10px';
      const lab = document.createElement('div');
      lab.textContent = 'GIERMEK  (zbroja kompana)';
      lab.style.cssText = 'text-align:center;font-weight:bold;color:#f2c14e;font-size:13px;margin:6px 0 4px;letter-spacing:1px;border-bottom:1px solid #5a4a20;padding-bottom:4px';
      wrap.append(lab);
      const grid = document.createElement('div');
      grid.className = 'trades';
      const b = document.createElement('button');
      b.textContent = d.sqArmor ? `${SQ_ARMOR.name}  ✓ POSIADANE` : `${SQ_ARMOR.name}: ${SQ_ARMOR.desc}  [${SQ_ARMOR.cost} pkt]`;
      b.disabled = !!d.sqArmor || (!G.dev && d.pending < SQ_ARMOR.cost);
      if (d.sqArmor) b.style.outline = '2px solid #7aff9a';
      b.onclick = () => {
        if (Player.buySqArmor()) {
          G.comps.forEach(a => { if (a.s.t === 'squire') a.key = 'comp_squire_leather'; });
          this.hud(); this.smith(done);
        }
      };
      grid.append(b); wrap.append(grid); s.append(wrap);
    }

    const x = document.createElement('button');
    x.textContent = 'Idź dalej';
    x.style.marginTop = '12px';
    x.onclick = () => { s.classList.add('hidden'); if (G.p) G.p.key = Player.spriteKey(); done(); };
    s.append(x);
  }
};
