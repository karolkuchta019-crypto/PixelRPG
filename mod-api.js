/* ============================================================
   MOD-API.JS – v1.4.0: MODY (własne kampanie, mapy i przeciwnicy) – na podstawie Kreatora światów ze starej wersji gry.
   Plik .mwmod / wpis w localStorage ('mw_mods') to JSON:
   {
     id, name, author, version,
     maps:    { klucz: { name, sky, ground, decor, tone, amb, bg(dataURL PNG 160x80) } },
     enemies: { klucz: { name, hp, atk, def, dodge, crit, xp, scale, boss, behaveType, move, tags[], pois, burn, freeze,
                         line, fw, fh, color, sprites: { idle, attack, hurt, death } (dataURL PNG) } },
     campaign: [ { name, map, foes[], boss, minigame?, mgWave? } ]
   }
   • map / foes / boss w kampanii mogą wskazywać zarówno własne zasoby moda, jak i WBUDOWANE mapy i przeciwników gry (BUILTIN poniżej).
   • Mod nie zmienia zapisów gry: w czasie gry w modzie zapisy w slotach i osiągnięcia są wyłączone.
   ============================================================ */
const ModAPI = {
  list: [], active: null, STORAGE_KEY: 'mw_mods', _orig: null,
  BUILTIN: {"maps": [["forest", "Zielony las"], ["village", "Opuszczona wioska"], ["swamp", "Moczary"], ["taiga", "Tajga"], ["pass", "Górska ścieżka"], ["ice", "Lodowe góry"], ["cavemouth", "Wejście do jaskini"], ["cave", "Kryształowa jaskinia"], ["desert", "Pustynia"], ["tunnel", "Stary tunel"], ["plant", "Stara elektrownia"], ["hotshaft", "Gorący szyb"], ["lava", "Lawowa otchłań"], ["stadium", "Mroczny stadion"]], "enemies": [["slime", "Slime", 0], ["goblin", "Goblin", 0], ["skeleton", "Skeleton Warrior", 0], ["shroom", "Grzybek", 0], ["elf", "Leśny Elf", 0], ["lavagolem", "Lawowy Golem", 0], ["imp", "Imp", 0], ["wolf", "Wilk", 0], ["spider", "Pająk", 0], ["drone", "Dron", 0], ["robot", "Zardzewiały Robot", 0], ["drowned", "Utopiec", 0], ["mosquitos", "Chmara komarów", 0], ["bear", "Niedźwiedź brunatny", 0], ["beaver", "Bóbr", 0], ["scorpion", "Skorpion", 0], ["mummy", "Mumia", 0], ["kicker", "Piłkarz", 0], ["referee", "Sędzia", 0], ["bat", "Nietoperz", 0], ["snowman", "Bałwan", 0], ["dwarf", "Krasnolud", 0], ["basilisk", "Bazyliszek", 0], ["fighter", "Myśliwiec laserowy", 0], ["flea", "Pchła", 0], ["hedgehog", "Zmutowany jeż", 0], ["dandelion", "Dmuchawiec", 0], ["treant", "Drzewiec", 0], ["blackcat", "Czarny kot", 0], ["silverfish", "Rybik cukrowy", 0], ["wreck", "Zepsute zmutowane auto", 0], ["fan", "Kibic", 0], ["mutmosq", "Zmutowany komar", 0], ["slimeking", "Król Slime", 1], ["orc", "Orc Berserker", 1], ["demon", "Demon Lord", 1], ["yeti", "Yeti", 1], ["spiderqueen", "Królowa Pająków", 1], ["mech", "Mechaniczny Kolos", 1], ["witch", "Wiedźma na miotle", 1], ["leshy", "Leszy", 1], ["sphinx", "Sfinks", 1], ["coach", "Mroczny Trener", 1], ["rudolf", "Rudolf", 0], ["wraith", "Upiór", 0], ["scarab", "Skarabeusz", 0], ["mechhand", "Mechaniczna ręka", 0], ["keeper", "Bramkarz", 0]], "moves": ["ram", "blink", "roll", "scuttle", "pounce", "sway", "hop", "leap", "rush", "slam", "swoop", "dash"]},
  MG_MAP: { dam: 'taiga', maze: 'desert', lava: 'plant', pong: 'rink' },
  BEHAVE: [['normal', 'Zwykły (1 cios)'], ['multi', 'Podwójne uderzenie (czasem)'], ['heavy', 'Ciężki (mocny cios co 3 turę)'], ['boss', 'Boss (mocny cios co 2 turę)'],
           ['ranged', 'Strzelec (strzały z dystansu)'], ['fireball', 'Ognisty (kule ognia, podpalenie)'], ['poison', 'Jadowity (trucizna co 3 turę)']],
  TAGS: [['animal', 'zwierzę'], ['human', 'człowiek'], ['goblin', 'goblin'], ['elf', 'elf'], ['plant', 'roślina (ogień x3)'], ['undead', 'nieumarły'], ['machine', 'maszyna'],
         ['golem', 'golem'], ['fire', 'ognisty (odporny na ogień)'], ['winter', 'zimowy (odporny na mróz)'], ['air', 'latający'], ['reptile', 'gad'], ['demon', 'demon'], ['slime', 'slime'], ['water', 'wodny'], ['spirit', 'duch']],

  loadAll() { try { const raw = localStorage.getItem(this.STORAGE_KEY); this.list = raw ? JSON.parse(raw) : []; } catch (e) { this.list = []; } return this.list; },
  saveAll() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.list)); },
  get(id) { return this.list.find(m => m.id === id); },
  upsert(mod) { const i = this.list.findIndex(m => m.id === mod.id); if (i >= 0) this.list[i] = mod; else this.list.push(mod); this.saveAll(); },
  remove(id) { this.list = this.list.filter(m => m.id !== id); this.saveAll(); if (this.active && this.active.id === id) this.active = null; },

  /* rejestracja map i wrogów moda w silniku gry */
  async activate(mod) {
    this.active = mod;
    for (const [key, m] of Object.entries(mod.maps || {})) {
      MAPS[key] = { name: m.name || key, src: '', sky: m.sky || '#6ec6f0', ground: m.ground || '#4a9a3a', decor: m.decor || '#2c6b2c',
        tone: m.tone != null ? +m.tone : .7, amb: m.amb || null, foes: m.foes || [], boss: m.boss || null, mod: 1 };
      Assets.maps[key] = m.bg ? await this._img(m.bg) : null;
    }
    for (const [key, e] of Object.entries(mod.enemies || {})) {
      ENEMY_DEFS[key] = { name: e.name || key, hp: +e.hp || 30, atk: +e.atk || 10, def: +e.def || 0, dodge: +e.dodge || 0, crit: +e.crit || 0,
        xp: +e.xp || 15, scale: +e.scale || 2.6, boss: e.boss ? 1 : 0, pois: +e.pois || 0, burn: +e.burn || 0, freeze: +e.freeze || 0,
        line: e.line || null, behave: this._makeBehave(e), tags: (e.tags && e.tags.length) ? e.tags.slice() : ['human'], move: e.move || 'dash', mod: 1 };
      const fw = e.fw || 32, fh = e.fh || 32;
      ASSETS[key] = { src: 'mod:' + key, fw, fh, color: e.color || '#8a6a3a' };
      Assets.sheets[key] = {};
      const sp = e.sprites || {};
      const idle = await this._img(sp.idle || sp.sheet);
      Assets.img[key] = idle || Assets._ph(ASSETS[key]);
      for (const anim of ['attack', 'hurt', 'death', 'walk']) if (sp[anim]) Assets.sheets[key][anim] = await this._img(sp[anim]);
    }
    return mod;
  },

  /* etapy kampanii moda w formacie CAMPAIGN gry */
  campaign(mod) {
    return (mod.campaign || []).map(c => {
      const o = { name: c.name || 'Etap', map: c.map, foes: (c.foes && c.foes.length) ? c.foes.slice() : ['slime'], boss: c.boss };
      if (c.minigame && this.MG_MAP[c.minigame]) o.minigame = { kind: c.minigame, wave: Math.max(1, +c.mgWave || 2), map: this.MG_MAP[c.minigame] };
      return o;
    });
  },
  /* sprawdza poprawność moda; zwraca listę błędów */
  validate(mod) {
    const err = [], B = this.BUILTIN, hasMap = k => (mod.maps && mod.maps[k]) || B.maps.some(x => x[0] === k), hasEn = k => (mod.enemies && mod.enemies[k]) || B.enemies.some(x => x[0] === k);
    if (!(mod.campaign && mod.campaign.length)) err.push('Kampania jest pusta – dodaj przynajmniej jeden etap.');
    (mod.campaign || []).forEach((c, i) => {
      if (!hasMap(c.map)) err.push(`Etap ${i + 1}: nieznana mapa.`);
      if (!c.boss || !hasEn(c.boss)) err.push(`Etap ${i + 1}: wybierz bossa.`);
      (c.foes || []).forEach(f => { if (!hasEn(f)) err.push(`Etap ${i + 1}: nieznany przeciwnik „${f}”.`); });
      if (!(c.foes && c.foes.length)) err.push(`Etap ${i + 1}: brak zwykłych przeciwników (użyty zostanie Slime).`);
    });
    return err;
  },
  /* wejście do moda: podmienia zawartość CAMPAIGN (przywracana przez exit) */
  enter(mod) {
    if (!this._orig) this._orig = CAMPAIGN.slice();
    CAMPAIGN.splice(0, CAMPAIGN.length, ...this.campaign(mod));
    G.modRun = true;
  },
  exit() {
    if (this._orig) { CAMPAIGN.splice(0, CAMPAIGN.length, ...this._orig); this._orig = null; }
    if (typeof G !== 'undefined') G.modRun = false;
    this.active = null;
  },

  _img(src) { return new Promise(r => { if (!src) { r(null); return; } const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); },
  _makeBehave(e) {
    switch (e.behaveType) {
      case 'multi': return () => Math.random() < .35 ? [.6, .6] : [1];
      case 'heavy': return en => en.turn % 3 === 0 ? [{ m: 1.8, say: `${e.name || 'Wróg'} uderza z całej siły!` }] : [.9];
      case 'boss': return en => en.turn % 2 === 0 ? [1.7] : [1];
      case 'ranged': return () => [{ m: 1, rng: 'arrow', magic: 1 }];
      case 'fireball': return en => en.turn % 2 === 0 ? [{ m: 1.1, rng: 'fire', magic: 1, burn: 1 }] : [.9];
      case 'poison': return en => en.turn % 3 === 0 ? [{ m: 1.4, pois: 1 }] : [1];
      default: return () => [1];
    }
  },

  exportFile(mod) {
    const blob = new Blob([JSON.stringify(mod, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (mod.id || 'mod') + '.mwmod'; a.click(); URL.revokeObjectURL(a.href);
  },
  importFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => { try { const mod = JSON.parse(r.result); if (!mod.id || !mod.name) throw new Error('Brak id/name'); this.upsert(mod); resolve(mod); } catch (e) { reject(e); } };
      r.onerror = reject; r.readAsText(file);
    });
  },
  template(name) {
    const id = 'mod_' + Date.now().toString(36);
    return { id, name: name || 'Nowy świat', author: '', version: '1.0',
      maps: { [id + '_map']: { name: 'Nowa mapa', sky: '#6ec6f0', ground: '#4a9a3a', decor: '#2c6b2c', tone: .8, amb: 'leaf', bg: null } },
      enemies: {}, campaign: [{ name: name || 'Nowy świat', map: id + '_map', foes: ['slime'], boss: 'slimeking' }] };
  }
};

/* ---------- integracja z grą (nie wykonuje się w edytorze) ---------- */
if (typeof G !== 'undefined' && typeof UI !== 'undefined') {
  Object.assign(G, {
    async startMod(id) {
      ModAPI.loadAll(); const mod = ModAPI.get(id); if (!mod) return UI.title();
      const err = ModAPI.validate(mod).filter(x => !/brak zwykłych/.test(x));
      if (err.length) { UI.screen('Mod ma błędy', err.join('\n'), [{ l: 'Wstecz', f: () => UI.mods() }]); return; }
      ModAPI.exit(); this.mp = null; this.heroes = null;
      await ModAPI.activate(mod); ModAPI.enter(mod);
      this.mode = 'campaign'; this.modCleared = 0; this.nextHardcore = false;
      Player.d = Player.base(); Player.d.gear = { sword: null, armor: null, shield: null };
      this.p = null; this.actors = []; this.enemies = []; this.comps = []; this.npcs = []; this.state = 'title';
      this.level = 0; this.wave = 1; this.waves = buildWaves(0); this.snap = JSON.stringify(Player.d);
      UI.worldMap({ start: 1 });
    },
    modEnd() {
      const nm = (ModAPI.active && ModAPI.active.name) || 'mod';
      this.state = 'over';
      return UI.screen('MOD UKOŃCZONY!', `Świat „${nm}” pokonany!`, [{ l: 'Menu', f: () => UI.title() }]);
    }
  });

  Object.assign(UI, {
    mods() {
      ModAPI.loadAll();
      const s = this.$('screen'); s.innerHTML = ''; s.className = 'mods'; s.classList.remove('hidden');
      const h = document.createElement('h2'); h.textContent = trn('Mody – własne kampanie'); s.append(h);
      const p = document.createElement('p');
      p.textContent = trn('Zagraj w kampanię stworzoną w Kreatorze modów (własne mapy, przeciwnicy i bossowie) albo zaimportuj plik .mwmod. W modach nie działają zapisy w slotach ani osiągnięcia.');
      s.append(p);
      const list = document.createElement('div'); list.className = 'mod-list'; s.append(list);
      if (!ModAPI.list.length) { const e = document.createElement('p'); e.className = 'team-empty'; e.textContent = trn('Brak modów. Utwórz własny w Kreatorze albo zaimportuj plik .mwmod.'); list.append(e); }
      ModAPI.list.forEach(m => {
        const card = document.createElement('div'); card.className = 'mod-card';
        const info = document.createElement('div'); info.className = 'mod-info';
        const b = document.createElement('b'); b.textContent = m.name;
        const sp = document.createElement('span');
        sp.textContent = `${m.author ? m.author + ' · ' : ''}v${m.version || '1.0'} · ${(m.campaign || []).length} ${trn('etapów')} · ${Object.keys(m.enemies || {}).length} ${trn('wrogów')} · ${Object.keys(m.maps || {}).length} ${trn('map')}`;
        info.append(b, sp);
        const row = document.createElement('div'); row.className = 'slot-btns';
        const mk = (l, f) => { const x = document.createElement('button'); x.textContent = trn(l); x.onclick = f; row.append(x); };
        mk('▶ Graj', () => G.startMod(m.id));
        mk('Eksportuj', () => ModAPI.exportFile(m));
        mk('Usuń', () => { if (confirm(trn(`Usunąć mod „${m.name}”?`))) { ModAPI.remove(m.id); this.mods(); } });
        card.append(info, row); list.append(card);
      });
      const bar = document.createElement('div'); bar.className = 'wmap-actions';
      const imp = document.createElement('input'); imp.type = 'file'; imp.accept = '.mwmod,.json'; imp.hidden = true;
      imp.onchange = async () => { if (!imp.files[0]) return; try { await ModAPI.importFile(imp.files[0]); this.mods(); } catch (e) { alert(trn('Nie udało się zaimportować moda: ') + e.message); } };
      const bi = document.createElement('button'); bi.textContent = trn('Importuj plik .mwmod'); bi.onclick = () => imp.click();
      const be = document.createElement('button'); be.textContent = trn('🛠 Kreator modów'); be.onclick = () => window.open('editor/editor.html', '_blank');
      const bb = document.createElement('button'); bb.textContent = trn('Wstecz'); bb.onclick = () => this.title();
      bar.append(bi, be, bb, imp); s.append(bar);
    }
  });
}
