/* v1.1.1: etykiety przycisków akcji (tłumaczone przy każdym odświeżeniu HUD) */
const ACT_LABELS = { attack: 'Atak', crit: 'Cios krytyczny', defend: 'Obrona', potion: 'Eliksir', shoot: 'Strzał', fire: 'Kula ognia', skipwave: 'Pomiń falę (DEV)', toboss: 'Do bossa (DEV)', thunder: 'Piorun' };

const UI = {
  $: id => document.getElementById(id),

  /* raw = tekst już przetłumaczony (np. dymek z imieniem) – nie tłumacz drugi raz */
  log(t, c = '', raw = false) {
    const l = this.$('log'), p = document.createElement('p');
    p.textContent = raw ? t : trn(t); p.className = c;
    l.prepend(p);
    while (l.children.length > 40) l.lastChild.remove();
  },

  hud() {
    const d = Player.d, m = MAPS[G.cur().map];
    this.$('wave').textContent = trn(this.waveLabel());
    this.$('mapname').textContent = trn(m.name) + (G.event ? ' · ' + trn(G.event === 'sandstorm' ? 'Burza piaskowa' : 'Fatamorgana') : '');
    this.$('lvl').textContent = 'LVL ' + d.level;
    this.$('xpbar').style.width = 100 * d.xp / Player.xpNext() + '%';
    this.$('hpbar').style.width = 100 * d.hp / d.maxhp + '%';
    const sk = d.sk || {};
    document.querySelector('[data-a=shoot]').classList.toggle('hidden', !(sk.bow || sk.xbow));
    document.querySelector('[data-a=skipwave]').classList.toggle('hidden', !G.dev);   // v1.1: tryb dev – pomijanie fali
    document.querySelector('[data-a=toboss]').classList.toggle('hidden', !G.dev);     // v1.1.1: tryb dev – skok do bossa
    const fb = document.querySelector('[data-a=fire]');
    fb.classList.toggle('hidden', !sk.fire);
    document.querySelectorAll('#actions button').forEach(b => { const L = ACT_LABELS[b.dataset.a]; if (L && b.dataset.a !== 'fire' && b.dataset.a !== 'thunder') b.textContent = trn(L); });
    fb.textContent = Combat.fbCd > 0 ? `${trn('Kula ognia')} (${Combat.fbCd})` : trn('Kula ognia');
    const tb = document.querySelector('[data-a=thunder]');   // v1.2.0: atak pioruna (raz na etap)
    tb.classList.toggle('hidden', !sk.thunder);
    tb.textContent = G.thunderUsed() ? `${trn('Piorun')} (${trn('zużyty')})` : trn('Piorun');
    const atk = Player.atk(), def = Player.def();
    const gAtk = Player.gearBonus('atk'), gDef = Player.gearBonus('def');
    const ptsLabel = G.dev ? '∞' : String(d.pending|0);
    this.$('stats').textContent =
      `HP ${d.hp}/${d.maxhp}  ATK ${atk}${gAtk ? `(+${gAtk})` : ''}  DEF ${def}${gDef ? `(+${gDef})` : ''}  ` +
      `${trn('PUNKTY')} ${ptsLabel}  ${trn('Eliksiry')} ${d.potions|0}  ${trn('KOMPANI')} ${(d.comps || []).length}/3  ` +
      `CRIT ${Math.round((d.crit + Player.luck()) * 100)}%  ${trn('UNIK')} ${Math.round(d.dodge * 100)}%` + (sk.totem ? `  ${trn('TOTEM')} ✓` : '');
  },

  lock(b) {
    document.querySelectorAll('#actions button').forEach(x =>
      x.disabled = b ||
        (x.dataset.a === 'potion' && Player.d.potions < 1) ||
        (x.dataset.a === 'fire' && Combat.fbCd > 0) ||
        (x.dataset.a === 'thunder' && G.thunderUsed())
    );
  },

  screen(title, text, btns, cls) {
    const s = this.$('screen');
    s.innerHTML = '';
    s.className = cls || '';
    const h = document.createElement('h2');
    h.textContent = trn(title);
    s.append(h);
    if (text) {
      const p = document.createElement('p');
      p.textContent = trn(text);
      s.append(p);
    }
    btns.forEach(b => {
      const e = document.createElement('button');
      e.textContent = trn(b.l);
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
      'Wybierz tryb. WASD / strzałki – ruch, Spacja – skok, M – muzyka, Tab – ustawienia, kliknij wroga, by go namierzyć.',
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
    h.textContent = trn(opts.fromDeath ? 'Porażka – Mapa świata' : 'Mapa świata');
    s.append(h);
    const sub = document.createElement('p');
    sub.textContent = trn(opts.fromDeath
      ? 'Wybierz odblokowany etap, by spróbować ponownie.'
      : opts.fromMenu
        ? (canJump ? 'Kliknij odblokowany etap, aby się do niego przenieść (zaczniesz od 1. fali tego etapu).'
                   : 'Podgląd mapy. Przenoszenie między etapami działa w trakcie kampanii (poza walką).')
        : 'Kliknij etap, aby wyruszyć. Niepokonane etapy są zablokowane.') + (!opts.fromDeath && !opts.fromMenu && G.dev ? trn(' [DEV: wszystko odblokowane]') : '');
    s.append(sub);

    const info = document.createElement('div');
    info.className = 'wm-info';
    const defInfo = trn('Najedź na etap, aby zobaczyć przeciwników.');
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
      const tag = trn(i === here ? '● TU JESTEŚ' : done ? '✓ UKOŃCZONY' : unlocked ? '▶ DOSTĘPNY' : '🔒 ZABLOKOWANY');
      node.innerHTML = `<span class="wm-img" style="background-image:url(${MAPS[L.map].src})"></span>` +
        `<span class="wm-num">${i + 1}</span><span class="wm-name">${trn(L.name)}</span>` +
        `<span class="wm-boss">${trn('Boss')}: ${trn(ENEMY_DEFS[L.boss].name)}${Player.d && Player.d.witch && L.boss === 'witch' ? trn(' · 🧙 sklep') : ''}</span><span class="wm-tag">${tag}</span>`;
      const foes = [...new Set(L.foes)].map(f => trn(ENEMY_DEFS[f].name)).join(', ');
      const show = () => { info.textContent = `${trn('Etap')} ${i + 1}: ${trn(L.name)} — ${trn('wrogowie')}: ${foes} · ${trn('boss')}: ${trn(ENEMY_DEFS[L.boss].name)}`; };
      node.onmouseenter = show; node.onfocus = show;
      node.onmouseleave = () => { info.textContent = defInfo; };
      if (unlocked && (!opts.fromMenu || canJump)) {
        node.onclick = () => {
          if (opts.fromMenu) {
            /* v1.1: pokonana wiedźma czeka na Moczarach – klik w bagna = wizyta w jej chatce (poza samymi Moczarami) */
            if (Player.d && Player.d.witch && L.boss === 'witch' && G.level !== i &&
                confirm(trn('Odwiedzić Wiedźmę w chatce na Moczarach?\n\nOK – odwiedź ją (eliksiry i talizmany szczęścia, potem wrócisz tu, gdzie byłeś).\nAnuluj – pokaż inne opcje.'))) {
              G.visitWitch();
              return;
            }
            if (!confirm(trn(`Przenieść się do etapu ${i + 1}: ${L.name}? Postęp w bieżącym etapie zostanie utracony.`))) return;
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
            G.level = i; G.wave = 1; G.waves = buildWaves(i); G.wave = G.stageStart();
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
      retry.textContent = trn('Spróbuj ponownie (ten etap)');
      retry.onclick = () => {
        s.classList.add('hidden');
        Player.d = G.snap ? JSON.parse(G.snap) : Player.base();
        Player.d.gear = Player.d.gear || { sword: null, armor: null, shield: null };
        Player.d.hp = Player.d.maxhp;
        G.level = opts.retryLevel; G.wave = 1; G.waves = buildWaves(opts.retryLevel); G.wave = G.stageStart();
        G.snap = JSON.stringify(Player.d);
        G.newRun();
      };
      rowB.append(retry);
    }
    if (!opts.fromDeath && !opts.fromMenu) {
      const neu = document.createElement('button');
      neu.textContent = trn('Nowa kampania');
      neu.onclick = () => { Save.clear('campaign'); this.worldMap({ start: 1 }); };
      rowB.append(neu);
    }
    const back = document.createElement('button');
    back.textContent = trn(opts.fromDeath ? 'Menu główne' : (opts.fromMenu ? 'Zamknij' : 'Wstecz'));
    back.onclick = () => { if (opts.fromMenu) this.closeMenu(); else this.title(); };
    rowB.append(back);
    s.append(rowB);
  },

  /* --- MENU TAB --- */
  menuOpen: false,
  /* v1.2.0: powiadomienie o osiągnięciu */
  toast(a) {
    const t = document.createElement('div');
    t.className = 'toast';
    const im = document.createElement('img');
    im.src = `assets/achievements/${a.img}.png`;
    const tx = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = trn('Osiągnięcie odblokowane!');
    const n = document.createElement('span');
    n.textContent = trn(a.name);
    tx.append(b, document.createElement('br'), n);
    t.append(im, tx);
    document.body.append(t);
    setTimeout(() => t.remove(), 4800);
  },

  /* v1.2.0: menu (Tab) z zakładkami: Menu | Ustawienia | Osiągnięcia */
  toggleMenu(tab) {
    if (this.menuOpen && tab === undefined) { this.closeMenu(); return; }
    if (tab) this.menuTab = tab;
    this.menuTab = this.menuTab || 'menu';
    this.menuOpen = true;
    const s = this.$('screen');
    s.innerHTML = '';
    s.className = 'tabmenu';
    s.classList.remove('hidden');
    const h = document.createElement('h2');
    h.textContent = trn('Menu (Tab)');
    s.append(h);

    const bar = document.createElement('div');
    bar.className = 'tabbar';
    [['menu', 'Menu'], ['settings', 'Ustawienia'], ['ach', 'Osiągnięcia']].forEach(([id, label]) => {
      const tb = document.createElement('button');
      tb.textContent = trn(label) + (id === 'ach' ? ` ${Prog.count()}/${ACH.length}` : '');
      tb.className = 'tabbtn ghost' + (this.menuTab === id ? ' on' : '');
      tb.onclick = () => this.toggleMenu(id);
      bar.append(tb);
    });
    s.append(bar);

    const mk = (label, locked, fn, tg = s) => {
      const b = document.createElement('button');
      b.textContent = locked ? trn(label) + ' 🔒' : trn(label);
      if (locked) { b.disabled = true; b.classList.add('locked-opt'); }
      else b.onclick = fn;
      tg.append(b);
    };
    const rerender = () => { this.menuOpen = false; this.toggleMenu(); };
    const d = Player.d || {};

    if (this.menuTab === 'menu') {
      const list = document.createElement('div');
      list.className = 'menu-list';
      s.append(list);
      mk('🗺  Mapa świata', false, () => { this.menuOpen = false; this.worldMap({ fromMenu: 1 }); }, list);
      mk('💾  Zapisz grę (3 sloty)', !Slots.canSave(), () => { this.menuOpen = false; this.slots('save', 'menu'); }, list);
      mk('📂  Wczytaj grę', !Slots.canLoad(), () => { this.menuOpen = false; this.slots('load', 'menu'); }, list);
      mk('⚔  Nowa kampania', false, () => this.newGame('campaign'), list);
      mk('♾  Nowy tryb nieskończony', false, () => this.newGame('endless'), list);

      const stats = document.createElement('div');
      stats.className = 'menu-block';
      stats.innerHTML = `<p><b>${trn('Statystyki gracza')}</b></p>
        <p>${trn('Poziom:')} ${d.level || 1} &nbsp;|&nbsp; ${trn('Zabici przeciwnicy:')} ${d.kills || 0}<br>
        ${trn('Liczba śmierci:')} ${d.deaths || 0} &nbsp;|&nbsp; ${trn('Eliksiry:')} ${d.potions || 0}<br>
        <b>${trn('Najdalsza fala (tryb nieskończony):')} ${Prog.d.best || 0}</b></p>`;
      s.append(stats);
    }

    if (this.menuTab === 'settings') {
      /* v1.2.1: ustawienia podzielone na kategorie (lewa kolumna) z wierszami opcji (prawa kolumna) */
      const cats = [['general', '🌐', 'Ogólne'], ['sound', '🔊', 'Dźwięk'], ['gfx', '🖼', 'Grafika'], ['ctrl', '🎮', 'Sterowanie'], ['play', '⚔', 'Rozgrywka'], ['data', '💾', 'Dane']];
      if (G.dev) cats.push(['dev', '🛠', 'Deweloper']);
      if (!cats.some(c => c[0] === this.setCat)) this.setCat = 'general';
      const wrap = document.createElement('div'); wrap.className = 'set-wrap';
      const nav = document.createElement('nav'); nav.className = 'set-nav';
      cats.forEach(([id, ic, label]) => {
        const b = document.createElement('button');
        b.className = 'ghost' + (this.setCat === id ? ' on' : '');
        b.textContent = `${ic}  ${trn(label)}`;
        b.onclick = () => { this.setCat = id; rerender(); };
        nav.append(b);
      });
      const panel = document.createElement('section'); panel.className = 'set-panel';
      const h3 = document.createElement('h3'); h3.textContent = trn(cats.find(c => c[0] === this.setCat)[2]);
      panel.append(h3);
      const row = (label, desc, ctl) => {
        const r = document.createElement('div'); r.className = 'opt-row';
        const i = document.createElement('div'); i.className = 'opt-info';
        const b = document.createElement('b'); b.textContent = trn(label); i.append(b);
        if (desc) { const sp = document.createElement('span'); sp.textContent = trn(desc); i.append(sp); }
        const c = document.createElement('div'); c.className = 'opt-ctl'; c.append(ctl);
        r.append(i, c); panel.append(r);
      };
      const seg = (opts, cur, pick) => {
        const w = document.createElement('span'); w.className = 'seg';
        opts.forEach(([v, l]) => { const b = document.createElement('button'); b.className = 'ghost' + (v === cur ? ' on' : ''); b.textContent = trn(l); b.onclick = () => pick(v); w.append(b); });
        return w;
      };
      const toggle = (on, fn) => { const b = document.createElement('button'); b.className = 'toggle ghost' + (on ? ' on' : ''); b.textContent = trn(on ? 'wł.' : 'wył.'); b.onclick = () => fn(!on); return b; };
      const text = t => { const e = document.createElement('span'); e.className = 'opt-val'; e.textContent = t; e.style.minWidth = '0'; return e; };
      const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = cls; b.textContent = trn(label); b.onclick = fn; return b; };

      if (this.setCat === 'general') {
        row('Język / Language', null, seg(I18N.LANGS, I18N.lang, v => { I18N.set(v); if (Player.d && G.p) this.hud(); rerender(); }));
        row('Wersja gry', null, text('v' + VERSION));
      }
      if (this.setCat === 'sound') {
        row('Muzyka', 'Muzyka w tle w trakcie gry.', toggle(Music.on, () => { Music.toggle(); rerender(); }));
        const vol = document.createElement('input');
        vol.type = 'range'; vol.min = 0; vol.max = 100; vol.value = Math.round((Music.vol || 0.5) * 100);
        const val = document.createElement('span'); val.className = 'opt-val'; val.textContent = vol.value + '%';
        vol.oninput = () => { Music.vol = vol.value / 100; if (Music.cur) Music.cur.volume = Music.vol; val.textContent = vol.value + '%'; };
        const box = document.createElement('span'); box.className = 'opt-ctl'; box.append(vol, val);
        row('Głośność', null, box);
      }
      if (this.setCat === 'gfx') {
        row('Jakość grafiki', ['Mniej efektów, rysowanie co drugą klatkę, słabsze wstrząsy – dla wolniejszych komputerów.', 'Standardowa jakość (zalecana).', 'Ostrzejsza grafika (2× rozdzielczość), więcej cząsteczek i delikatna winieta.'][G.quality],
          seg([[0, 'Niska'], [1, 'Średnia'], [2, 'Wysoka']], G.quality, v => { G.setQuality(v); rerender(); }));
        row('Wstrząsy ekranu', 'Trzęsienie obrazu przy mocnych trafieniach.', toggle(G.opt.shake, v => { G.setOpt('shake', v); rerender(); }));
        row('Cząsteczki otoczenia', 'Pył, iskry i śnieg unoszące się na planszy.', toggle(G.opt.ambient, v => { G.setOpt('ambient', v); rerender(); }));
        row('Paski życia wrogów', 'Pasek HP nad każdą postacią.', toggle(G.opt.hpbars, v => { G.setOpt('hpbars', v); rerender(); }));
      }
      if (this.setCat === 'ctrl') {
        row('Ruch po kliknięciu (żółta otoczka)', 'Klik w ziemię: bohater idzie w to miejsce. Klik we wroga nadal go namierza.', toggle(G.clickMove, v => { G.setClickMove(v); rerender(); }));
        [['WASD / ←↑↓→', 'Ruch'], ['Shift', 'Sprint'], ['Spacja', 'Skok'], ['E', 'Rozmowa z NPC / sklep'], ['M', 'Muzyka'], ['Tab', 'Menu']].forEach(([k, l]) => {
          const kb = document.createElement('kbd'); kb.textContent = k; row(l, null, kb);
        });
      }
      if (this.setCat === 'play') {
        const dis = btn('wkrótce', 'ghost sm', () => {}); dis.disabled = true;
        row('Poziom trudności', 'Wkrótce.', dis);
        row('Najdalsza fala (tryb nieskończony):', null, text(String(Prog.d.best || 0)));
        row('Osiągnięcia', null, text(`${Prog.count()} / ${ACH.length}`));
      }
      if (this.setCat === 'data') {
        row('Identyfikator zapisów', 'Rozdziela zapisy w bazie PostgreSQL między graczy.', text(Slots.pid().slice(0, 8) + '…'));
        row('Resetuj osiągnięcia i rekord', 'Usuwa osiągnięcia oraz najdalszą falę trybu nieskończonego.', btn('Resetuj', 'danger sm', () => {
          if (!confirm(trn('Zresetować wszystkie osiągnięcia i rekord trybu nieskończonego?'))) return;
          Prog.d = { best: 0, ach: {} }; Prog.save(); rerender();
        }));
        row('Przywróć ustawienia domyślne', 'Język, grafika, dźwięk i sterowanie wracają do wartości początkowych.', btn('Przywróć', 'ghost sm', () => {
          if (!confirm(trn('Przywrócić ustawienia domyślne?'))) return;
          I18N.set('pl'); G.setQuality(1); G.resetOpt(); G.setClickMove(false); if (!Music.on) Music.toggle(); Music.vol = 0.5; if (Music.cur) Music.cur.volume = 0.5;
          if (Player.d && G.p) this.hud(); rerender();
        }));
      }
      if (this.setCat === 'dev') {
        row('Etapy zaczynaj od bossa', 'Tryb deweloperski: wejście do etapu od razu walką z bossem.', toggle(G.devBoss, v => { G.devBoss = v; rerender(); }));
        row('Tryb deweloperski', 'Nieskończone HP i punkty (przełączany skrótem).', text(trn('włączony')));
      }
      wrap.append(nav, panel);
      s.append(wrap);
    }

    if (this.menuTab === 'ach') {
      const head = document.createElement('p');
      head.className = 'ach-head';
      head.textContent = `${trn('Odblokowano')}: ${Prog.count()} / ${ACH.length}`;
      s.append(head);
      const list = document.createElement('div');
      list.className = 'ach-list';
      ACH.forEach(a => {
        const on = Prog.has(a.id);
        const tile = document.createElement('div');
        tile.className = 'ach-tile' + (on ? ' on' : '');
        const im = document.createElement('img');
        im.src = `assets/achievements/${a.img}.png`; im.alt = '';
        const tx = document.createElement('div');
        tx.className = 'ach-text';
        const nm = document.createElement('b'); nm.textContent = trn(a.name);
        const ds = document.createElement('span'); ds.textContent = trn(a.desc);
        const st = document.createElement('em');
        st.textContent = on ? `✓ ${trn('Odblokowane')} · ${new Date(Prog.d.ach[a.id]).toLocaleDateString(I18N.locale())}` : `🔒 ${trn('Zablokowane')}`;
        tx.append(nm, ds, st);
        tile.append(im, tx);
        list.append(tile);
      });
      s.append(list);
    }

    const close = document.createElement('button');
    close.textContent = trn('Zamknij (Tab)');
    close.onclick = () => this.closeMenu();
    s.append(close);
  },
  closeMenu() {
    this.menuOpen = false;
    this.menuTab = 'menu';
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
    if (!confirm(trn(txt) + trn('\nNiezapisany postęp zostanie utracony (zapisy w slotach zostają).'))) return;
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
    h.textContent = trn(mode === 'save' ? 'Zapisz grę' : 'Wczytaj grę');
    s.append(h);
    const msg = document.createElement('p');
    msg.className = 'slot-msg';
    msg.textContent = trn(mode === 'save'
      ? 'Wybierz slot (nadpisze poprzedni zapis). Zapisuje bieżącą kampanię albo tryb nieskończony.'
      : 'Wybierz slot. Wczytanie zaczyna bieżącą falę od nowa (albo wraca do sklepów po wygranej fali).');
    s.append(msg);
    const list = document.createElement('div');
    list.className = 'slot-list';
    s.append(list);
    const back = document.createElement('button');
    back.textContent = trn('Wstecz');
    back.onclick = () => { if (from === 'title') this.title(); else this.toggleMenu(); };
    s.append(back);

    const say = (t, bad) => { msg.textContent = trn(t); msg.style.color = bad ? '#ff7a7a' : ''; };
    const render = async () => {
      list.textContent = trn('Łączenie z bazą…');
      let rows;
      try { rows = await Slots.list(); } catch (e) { list.textContent = ''; say(e.message, true); return; }
      list.textContent = '';
      for (let n = 1; n <= Slots.N; n++) {
        const r = rows.find(x => x.slot === n);
        const card = document.createElement('div');
        card.className = 'slot-card' + (r ? '' : ' empty');
        const t = document.createElement('div');
        t.className = 'slot-title';
        t.textContent = `${trn('Slot')} ${n} — ` + trn(r ? (r.mode === 'campaign' ? 'Kampania' : 'Tryb nieskończony') : 'pusty');
        card.append(t);
        if (r) {
          const m = r.meta || {};
          const d = document.createElement('div');
          d.className = 'slot-info';
          d.textContent = `${Slots.label(r)} · LVL ${m.level || '?'} · ${trn('zabici')}: ${m.kills || 0} · ${new Date(r.updated_at).toLocaleString(I18N.locale())}`;
          card.append(d);
        }
        const row = document.createElement('div');
        row.className = 'slot-btns';
        const mk = (label, dis, fn) => { const b = document.createElement('button'); b.textContent = label; b.disabled = !!dis; b.onclick = fn; row.append(b); };
        if (mode === 'save') {
          mk(trn(r ? 'Nadpisz' : 'Zapisz tutaj'), !Slots.canSave(), async () => {
            if (r && !confirm(trn(`Nadpisać slot ${n}?`))) return;
            try { await Slots.save(n); say(`Zapisano w slocie ${n}.`); render(); } catch (e) { say(e.message, true); }
          });
        } else {
          mk(trn('Wczytaj'), !r || !(from === 'title' || Slots.canLoad()), async () => {
            try { await Slots.load(n); } catch (e) { say(e.message, true); }
          });
        }
        if (r) mk(trn('Usuń'), false, async () => {
          if (!confirm(trn(`Usunąć zapis ze slotu ${n}?`))) return;
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
      <h2>${trn('THE END')}</h2>
      <p class="cr-thanks">${trn('Dziękujemy za grę!')}</p>
      <p class="cr-sec">${trn('— MUZYKA —')}</p>
      <p>Music track: <b>Colossal</b> by Aylex<br>
      Source: <a href="https://freetouse.com/music" target="_blank" rel="noopener">https://freetouse.com/music</a><br>
      No Copyright Background Music</p>
      <p>Music track: <b>Gameboy</b> by Walen<br>
      Source: <a href="https://freetouse.com/music" target="_blank" rel="noopener">https://freetouse.com/music</a><br>
      Royalty Free Music for Video (Safe)</p>
      <p class="cr-sec">${trn('— MONSTER WAVES —')}</p>
      <p>${trn('Pixel RPG · Kampania · Bossowie · Mapa świata')}</p>
    `;
    roll.append(wrap);
    s.append(roll);
    const b = document.createElement('button');
    b.className = 'credits-btn';
    b.textContent = trn('Pomiń ▶▶');
    let anim = null;
    b.onclick = () => { if (anim) anim.cancel(); G.state = 'title'; this.title(); };
    s.append(b);
    requestAnimationFrame(() => {
      const H = roll.clientHeight, h = wrap.offsetHeight, speed = 0.045;   // px/ms (~45 px/s)
      anim = wrap.animate(
        [{ transform: `translate(-50%, ${H}px)` }, { transform: `translate(-50%, ${-h}px)` }],
        { duration: (H + h) / speed, easing: 'linear', fill: 'forwards' });
      anim.onfinish = () => { b.textContent = trn('Menu główne'); };
    });
  },

  /* ===== v1.2.1: wspólny układ sklepów – portret + punkty w nagłówku, sekcje (kategorie) z kartami ===== */
  shopFrame(o) {
    const s = this.$('screen'), keep = s.scrollTop;
    s.innerHTML = '';
    s.className = 'shopscreen';
    s.classList.remove('hidden');
    const wrap = document.createElement('div');
    wrap.className = 'shop';

    const head = document.createElement('div');
    head.className = 'shop-head';
    const cv = document.createElement('canvas');
    cv.className = 'shop-portrait'; cv.width = cv.height = 72;
    try { const c2 = cv.getContext('2d'); c2.imageSmoothingEnabled = false; Assets.draw(c2, o.sprite, 36, 70, o.scale || 2, 0); } catch (e) {}
    const tt = document.createElement('div');
    tt.className = 'shop-title';
    const h = document.createElement('h2'); h.textContent = trn(o.title);
    tt.append(h);
    if (o.sub) { const p = document.createElement('p'); p.className = 'shop-sub'; p.textContent = o.sub; tt.append(p); }
    const chips = document.createElement('div');
    chips.className = 'shop-chips';
    (o.chips || []).forEach(c => { const e = document.createElement('span'); e.className = 'chip' + (c.cls ? ' ' + c.cls : ''); e.textContent = c.text; chips.append(e); });
    head.append(cv, tt, chips);
    wrap.append(head);

    o.sections.forEach(sec => {
      const box = document.createElement('div');
      box.className = 'shop-sec';
      const h3 = document.createElement('h3'); h3.textContent = trn(sec.label);
      const grid = document.createElement('div'); grid.className = 'shop-grid';
      sec.items.forEach(it => {
        const b = document.createElement('button');
        b.className = 'shop-card' + (it.owned ? ' owned' : '') + (it.locked ? ' locked' : '') + (it.worse ? ' worse' : '');
        const mk = (cls, txt) => { const e = document.createElement('span'); e.className = cls; e.textContent = txt; return e; };
        b.append(mk('ic', it.icon || '•'), mk('nm', it.name), mk('pr' + (it.pcls ? ' ' + it.pcls : ''), it.price), mk('ds', it.desc || ''));
        b.disabled = !!it.disabled;
        if (!it.disabled) b.onclick = it.onClick;
        grid.append(b);
      });
      box.append(h3, grid);
      wrap.append(box);
    });

    const x = document.createElement('button');
    x.className = 'shop-exit';
    x.textContent = trn('Idź dalej');
    x.onclick = o.onExit;
    wrap.append(x);
    s.append(wrap);
    s.scrollTop = keep;
  },

  /* --- sklep wieśniaka (umiejętności) – przed bossem --- */
  shop(done) {
    const d = Player.d;
    d.sk = d.sk || {};
    const ICON = { atk: '⚔️', def: '🛡️', hp: '❤️', crit: '🎯', dodge: '💨', potion: '🧪', vamp: '🦇', herb: '🌿', venom: '☠️', flame: '🔥', frost: '❄️',
      resist: '🔰', fire: '🔥', fireup: '☄️', thunder: '⚡', totem: '🗿', double: '🗡️', compS: '🛡️', compA: '🏹' };
    const CATS = [['Statystyki', ['atk', 'def', 'hp', 'crit', 'dodge']], ['Przetrwanie', ['potion', 'herb', 'vamp', 'resist', 'totem']],
      ['Walka i magia', ['double', 'venom', 'flame', 'frost', 'fire', 'fireup', 'thunder']], ['Kompani', ['compS', 'compA']]];
    const sections = CATS.map(([label, ids]) => ({
      label,
      items: ids.map(id => SKILLS.find(k => k.id === id)).filter(Boolean).map(k => {
        const own = d.sk[k.id] || 0, c = Player.cost(k);
        const full = k.comp ? (d.comps || []).length >= 3 : own >= k.max;
        const need = k.req && !d.sk[k.req];            // np. moc kuli wymaga kuli ognia
        const lockN = k.need && !d[k.need];            // ulepszenia dostępne po pokonaniu Yeti
        const poor = !G.dev && d.pending < c;
        const cnt = (!k.comp && own && k.max > 1) ? ` ×${own}` : '';
        let price = `${c} ${trn('pkt')}`, pcls = poor ? 'poor' : '';
        if (lockN) { price = '🔒'; pcls = 'lock'; } else if (need) { price = '🔒'; pcls = 'lock'; } else if (full) { price = trn(k.comp ? 'DRUŻYNA PEŁNA' : 'MAX'); pcls = 'tag'; }
        const note = lockN ? ` — ${trn('najpierw pokonaj Yeti')}` : need ? ` — ${trn('najpierw: Kula ognia')}` : '';
        return { icon: ICON[k.id], name: trn(k.name) + cnt, desc: trn(k.desc) + note, price, pcls, owned: full && !k.comp && k.max === 1,
          locked: lockN || need, disabled: full || need || lockN || poor, onClick: () => { Player.buy(k.id); this.hud(); this.shop(done); } };
      })
    })).filter(sec => sec.items.length);
    this.shopFrame({
      sprite: 'merchant', title: 'Wędrowny Kupiec', sections,
      sub: trn('Wymień punkty poziomu na umiejętności.'),
      chips: [{ cls: 'pts', text: `★ ${G.dev ? '∞' : d.pending} ${trn('pkt')}` }, { text: `${trn('Kompani:')} ${(d.comps || []).length}/3` }]
        .concat(d.sk.fire ? [{ text: `${trn('Moc kuli ognia:')} ${Player.fireDmg()}` }] : []),
      onExit: () => { this.$('screen').classList.add('hidden'); G.syncComps(); done(); }
    });
  },

  /* --- sklep wiedźmy (eliksiry + talizmany szczęścia = szansa na cios krytyczny) --- */
  witch(done) {
    const d = Player.d;
    d.wi = d.wi || {};
    const ICON = { w_potion: '🧪', w_vit: '💖', w_rabbit: '🐇', w_clover: '🍀', w_horseshoe: '🌟' };
    const sections = [['potion', 'ELIKSIRY'], ['charm', 'TALIZMANY SZCZĘŚCIA']].map(([kind, label]) => ({
      label,
      items: WITCH.filter(k => k.kind === kind).map(k => {
        const own = d.wi[k.id] || 0, c = Player.wcost(k), full = own >= k.max, poor = !G.dev && d.pending < c;
        return { icon: ICON[k.id], name: trn(k.name) + (own && k.max > 1 ? ` ×${own}` : ''), desc: trn(k.desc),
          price: full ? trn(k.max === 1 ? '✓ POSIADANE' : 'MAX') : `${c} ${trn('pkt')}`, pcls: full ? 'tag' : (poor ? 'poor' : ''),
          owned: full && k.max === 1, disabled: full || poor, onClick: () => { if (Player.buyWitch(k.id)) { this.hud(); this.witch(done); } } };
      })
    }));
    const luck = Math.round((d.crit + Player.luck()) * 100), ch = Math.round(Player.luck() * 100);
    this.shopFrame({
      sprite: 'witch', scale: 1.4, title: 'Wiedźma z Moczarów', sections,
      sub: `${trn('Szczęście (szansa na krytyk):')} ${luck}%  (${trn('w tym talizmany')}: +${ch}%)`,
      chips: [{ cls: 'pts', text: `★ ${G.dev ? '∞' : d.pending} ${trn('pkt')}` }],
      onExit: () => { this.$('screen').classList.add('hidden'); done(); }
    });
  },

  /* --- sklep zbrojmistrza (ekwipunek) – po bossie --- */
  smith(done) {
    const d = Player.d;
    d.gear = d.gear || { sword: null, armor: null, shield: null };
    d.sk = d.sk || {};
    const eqName = slot => { const id = d.gear[slot]; if (!id) return trn('brak'); const it = GEAR.find(x => x.id === id); return it ? trn(it.name) : id; };
    const SLOT_ICON = { sword: '🗡️', armor: '🥋', shield: '🛡️', ranged: '🏹' };
    const SECS = [['sword', 'MIECZE  (atak)'], ['armor', 'ZBROJE  (obrona + wygląd)'], ['shield', 'TARCZE  (obrona)'], ['ranged', 'BROŃ DYSTANSOWA']];
    const sections = SECS.map(([key, label]) => ({
      label,
      items: GEAR.filter(it => it.slot === key).map(it => {
        const own = Player.ownedTier(it.slot), tier = Player.tier(it);
        const owned = tier === own, worse = tier < own, poor = !G.dev && d.pending < it.cost;
        return { icon: SLOT_ICON[key], name: trn(it.name), desc: owned || worse ? trn(it.desc) : trn(it.desc),
          price: owned ? trn('✓ POSIADANE') : worse ? trn('(masz lepszy)') : `${it.cost} ${trn('pkt')}`, pcls: owned ? 'tag' : worse ? 'lock' : (poor ? 'poor' : ''),
          owned, worse, disabled: owned || worse || poor,
          onClick: () => { if (Player.equip(it.id)) { if (G.p) G.p.key = Player.spriteKey(); this.hud(); this.smith(done); } } };
      })
    }));
    const noSq = !Player.hasSquire();   // zbroja giermka tylko, gdy mamy giermka
    sections.push({ label: 'GIERMEK  (zbroja kompana)', items: [{
      icon: '🥋', name: trn(SQ_ARMOR.name), desc: noSq && !d.sqArmor ? `${trn(SQ_ARMOR.desc)} — ${trn('najpierw zatrudnij giermka')}` : trn(SQ_ARMOR.desc),
      price: d.sqArmor ? trn('✓ POSIADANE') : noSq ? '🔒' : `${SQ_ARMOR.cost} ${trn('pkt')}`, pcls: d.sqArmor ? 'tag' : noSq ? 'lock' : ((!G.dev && d.pending < SQ_ARMOR.cost) ? 'poor' : ''),
      owned: !!d.sqArmor, locked: noSq && !d.sqArmor, disabled: !!d.sqArmor || noSq || (!G.dev && d.pending < SQ_ARMOR.cost),
      onClick: () => { if (Player.buySqArmor()) { G.comps.forEach(a => { if (a.s.t === 'squire') a.key = 'comp_squire_leather'; }); this.hud(); this.smith(done); } }
    }] });
    this.shopFrame({
      sprite: 'blacksmith', title: 'Zbrojmistrz', sections,
      sub: trn('Zbrojmistrz nie skupuje towaru. Nowy przedmiot zastępuje stary – zostaje tylko najlepszy, jaki kupiłeś.'),
      chips: [{ cls: 'pts', text: `★ ${G.dev ? '∞' : d.pending} ${trn('pkt')}` },
        { text: `${trn('Miecz:')} ${eqName('sword')}` }, { text: `${trn('Zbroja:')} ${eqName('armor')}` }, { text: `${trn('Tarcza:')} ${eqName('shield')}` },
        { text: `${trn('Dystans:')} ${d.sk.xbow ? trn('Kusza') : d.sk.bow ? trn('Łuk') : trn('brak')}` }],
      onExit: () => { this.$('screen').classList.add('hidden'); if (G.p) G.p.key = Player.spriteKey(); done(); }
    });
  }
};
