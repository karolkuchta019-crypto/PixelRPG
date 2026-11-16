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
];

const Prog = {
  d: { best: 0, ach: {} },
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('mw_prog') || 'null');
      if (s && typeof s === 'object') this.d = { best: s.best | 0, ach: (s.ach && typeof s.ach === 'object') ? s.ach : {} };
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
    if (key === 'slimeking') this.unlock('slimeking');
    if (key === 'yeti') {
      if (!d.yetiDown) { d.yetiDown = 1; UI.log('Yeti pokonany! Kupiec ma teraz nowe, potężne ulepszenia (Atak pioruna, Totem nieśmiertelności).', 'crit'); }
      if (!Player.hasUpgrades()) this.unlock('yetinoup');
    }
  },
  /* kampania ukończona */
  won() {
    this.unlock('win');
    if ((Player.d.deaths || 0) === 0) this.unlock('nodeath');
  }
};
Prog.load();
