/* v1.2.0 – OSIĄGNIĘCIA i trwały postęp gracza (localStorage: mw_prog), niezależny od slotów zapisu.
   Prog.d = { best: najdalsza fala trybu nieskończonego, ach: { id: czas_odblokowania } }.
   Osiągnięcia nie są przyznawane w trybie deweloperskim. Ikony: assets/achievements/<img>.png */
const ACH = [
  { id: 'endless10', img: 'ach_endless10', name: 'Maratończyk',            desc: 'Dojdź do 10. fali (etapu) w trybie nieskończonym.' },
  { id: 'slimeking', img: 'ach_slimeking', name: 'Król galaretki',         desc: 'Pokonaj bossa Króla Slime.' },
  { id: 'win',       img: 'ach_win',       name: 'Bohater królestwa',      desc: 'Przejdź kampanię – pokonaj Mrocznego Trenera.' },
  { id: 'witch',     img: 'ach_witch',     name: 'Klient wiedźmy',         desc: 'Kup cokolwiek u wiedźmy z Moczarów.' },
  { id: 'comps',     img: 'ach_comps',     name: 'Drużyna marzeń',         desc: 'Miej jednocześnie 3 miniony (kompanów).' },
  { id: 'gear',      img: 'ach_gear',      name: 'Mithrilowy wojownik',    desc: 'Miej najlepszy miecz i najlepszą zbroję (mithril).' },
  { id: 'vamp',      img: 'ach_vamp',      name: 'Żądza krwi',             desc: 'Kup umiejętność Wampiryzm.' },
  { id: 'resist',    img: 'ach_resist',    name: 'Niezłomny',              desc: 'Ulepsz Odporność na efekty do maksimum.' },
  { id: 'nodeath',   img: 'ach_nodeath',   name: 'Bez jednej rysy',        desc: 'Przejdź całą kampanię bez ani jednej śmierci.' },
  { id: 'yetinoup',  img: 'ach_yeti',      name: 'Gołymi pięściami',       desc: 'Pokonaj Yeti bez żadnych ulepszeń.' },
  /* v1.2.2: osiągnięcia za pokonanie bossów (w kampanii lub w trybie nieskończonym) */
  { id: 'boss_orc',         img: 'ach_boss_orc',         name: 'Pogromca Orków',        desc: 'Pokonaj bossa Orc Berserker.' },
  { id: 'boss_witch',       img: 'ach_boss_witch',       name: 'Łowca czarownic',       desc: 'Pokonaj bossa Wiedźmę na miotle.' },
  { id: 'boss_leshy',       img: 'ach_boss_leshy',       name: 'Drwal',                 desc: 'Pokonaj bossa Leszego.' },
  { id: 'boss_yeti',        img: 'ach_boss_yeti',        name: 'Śnieżny pogromca',      desc: 'Pokonaj bossa Yeti.' },
  { id: 'boss_spiderqueen', img: 'ach_boss_spiderqueen', name: 'Pogromca pająków',      desc: 'Pokonaj bossa Królową Pająków.' },
  { id: 'boss_sphinx',      img: 'ach_boss_sphinx',      name: 'Rozwiązana zagadka',    desc: 'Pokonaj bossa Sfinksa.' },
  { id: 'boss_mech',        img: 'ach_boss_mech',        name: 'Złomiarz',              desc: 'Pokonaj bossa Mechanicznego Kolosa.' },
  { id: 'boss_demon',       img: 'ach_boss_demon',       name: 'Pogromca demonów',      desc: 'Pokonaj bossa Demon Lorda.' },
  { id: 'allbosses',        img: 'ach_allbosses',        name: 'Pogromca bossów',       desc: 'Pokonaj wszystkich 10 bossów.' },
  { id: 'hardcore',         img: 'ach_hardcore',         name: 'Bez drugiej szansy',    desc: 'Przejdź kampanię w trybie hardcore.' },
];
const BOSS_KEYS = ['slimeking', 'orc', 'witch', 'leshy', 'yeti', 'spiderqueen', 'sphinx', 'mech', 'demon', 'coach'];

const Prog = {
  d: { best: 0, ach: {}, bosses: {}, dead: {} },   // bosses: pokonani bossowie; dead: zakończone śmiercią kampanie hardcore (runId)
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('mw_prog') || 'null');
      const o = v => (v && typeof v === 'object') ? v : {};
      if (s && typeof s === 'object') this.d = { best: s.best | 0, ach: o(s.ach), bosses: o(s.bosses), dead: o(s.dead) };
    } catch (e) {}
  },
  save() { try { localStorage.setItem('mw_prog', JSON.stringify(this.d)); } catch (e) {} },
  has(id) { return !!this.d.ach[id]; },
  count() { return ACH.filter(a => this.has(a.id)).length; },
  unlock(id) {
    if (G.dev || this.d.ach[id]) return false;
    const a = ACH.find(x => x.id === id);
    if (!a) return false;
    this.d.ach[id] = Date.now(); this.save();
    UI.toast(a);
    return true;
  },
  /* tryb nieskończony: gracz wszedł na falę n (rekord + osiągnięcie 10. fali) */
  reach(n) {
    if (G.dev) return;
    if (n > this.d.best) { this.d.best = n; this.save(); }
    if (n >= 10) this.unlock('endless10');
  },
  /* osiągnięcia zależne od stanu bohatera – sprawdzane po zakupach, wczytaniu gry itd. */
  scan() {
    const d = Player.d;
    if (!d) return;
    if ((d.comps || []).length >= 3) this.unlock('comps');
    if (d.gear && d.gear.sword === 'sw_myth' && d.gear.armor === 'ar_myth') this.unlock('gear');
    if ((d.sk || {}).vamp) this.unlock('vamp');
    const r = SKILLS.find(s => s.id === 'resist');
    if (r && (d.sk || {}).resist >= r.max) this.unlock('resist');
    if (Object.values(d.wi || {}).some(v => v > 0)) this.unlock('witch');
  },
  /* boss pokonany (wywoływane z G.win) */
  bossDown(key) {
    const d = Player.d;
    if (!G.dev && BOSS_KEYS.includes(key)) {   // v1.2.2: rejestr pokonanych bossów + osiągnięcia za każdego z nich
      this.d.bosses = this.d.bosses || {};
      this.d.bosses[key] = 1; this.save();
      if (ACH.some(a => a.id === 'boss_' + key)) this.unlock('boss_' + key);
      if (BOSS_KEYS.every(k => this.d.bosses[k])) this.unlock('allbosses');
    }
    if (key === 'slimeking') this.unlock('slimeking');
    if (key === 'yeti') {
      if (!d.yetiDown) { d.yetiDown = 1; UI.log('Yeti pokonany! Kupiec ma teraz nowe, potężne ulepszenia (Atak pioruna, Totem nieśmiertelności).', 'crit'); }
      if (!Player.hasUpgrades()) this.unlock('yetinoup');
    }
  },
  /* kampania ukończona */
  /* v1.2.2: hardcore – kampania zakończona śmiercią (runId) nie może być wznowiona */
  markDead(run) { if (run) { this.d.dead = this.d.dead || {}; this.d.dead[run] = 1; this.save(); } },
  isDead(run) { return !!(run && this.d.dead && this.d.dead[run]); },
  /* reset osiągnięć i rekordu – lista martwych kampanii zostaje (nie da się „wskrzesić” zapisu hardcore) */
  resetProgress() { this.d = { best: 0, ach: {}, bosses: {}, dead: this.d.dead || {} }; this.save(); },
  won() {
    this.unlock('win');
    if (Player.d.hardcore) this.unlock('hardcore');
    if ((Player.d.deaths || 0) === 0) this.unlock('nodeath');
  }
};
Prog.load();
