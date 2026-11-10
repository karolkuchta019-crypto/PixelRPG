/* ============================================================
   PLAYER.JS – bohater, umiejętności, ekwipunek, zapis, kompani
   ============================================================ */

const Player = {
  d: null,

  base() {
    return {
      hp: 100, maxhp: 100, atk: 15, def: 5,
      crit: 0.15, dodge: 0.1,
      level: 1, xp: 0, potions: 3, pending: 0,
      kills: 0, deaths: 0,
      sk: {}, comps: [],
      /* ekwipunek: id przedmiotu lub null */
      gear: { sword: null, armor: null, shield: null }
    };
  },

  xpNext() { return 30 + this.d.level * 20; },

  gainXp(n) {
    const d = this.d;
    d.xp += n;
    let up = 0;
    while (d.xp >= this.xpNext()) {
      d.xp -= this.xpNext();
      d.level++;
      d.pending++;
      up++;
    }
    return up;
  },

  /* --- ekwipunek: bonusy sumowane do atk/def --- */
  gearBonus(stat) {
    const g = (this.d && this.d.gear) || {};
    let v = 0;
    for (const slot of ['sword', 'armor', 'shield']) {
      const id = g[slot];
      if (!id) continue;
      const it = GEAR.find(x => x.id === id);
      if (it) v += it[stat] || 0;
    }
    return v;
  },

  /* efektywny atak / obrona (baza + gear) */
  atk() { return this.d.atk + this.gearBonus('atk'); },
  def() { return this.d.def + this.gearBonus('def'); },

  /* klucz sprite'a bohatera zależny od założonej zbroi */
  spriteKey() {
    const id = (this.d.gear || {}).armor;
    if (!id) return 'player';
    const it = GEAR.find(x => x.id === id);
    return (it && it.sprite) || 'player';
  },

  /* poziom przedmiotu w jego slocie (kolejność w GEAR = od najsłabszego) */
  tier(it) { return GEAR.filter(x => x.slot === it.slot).findIndex(x => x.id === it.id); },

  /* poziom aktualnie posiadanego przedmiotu w slocie (-1 = brak) */
  ownedTier(slot) {
    const d = this.d, sk = d.sk || {};
    if (slot === 'ranged') return sk.xbow ? 1 : sk.bow ? 0 : -1;
    const id = (d.gear || {})[slot];
    const it = id && GEAR.find(x => x.id === id);
    return it ? this.tier(it) : -1;
  },

  /* v1.0: brak sprzedaży – nowy przedmiot zastępuje stary (zostaje tylko najlepszy), starego nie da się odsprzedać ani cofnąć.
     Nie można kupić przedmiotu słabszego lub równego posiadanemu. */
  canBuy(it) { return this.tier(it) > this.ownedTier(it.slot); },

  equip(id) {
    const it = GEAR.find(x => x.id === id);
    if (!it) return false;
    const d = this.d;
    d.gear = d.gear || { sword: null, armor: null, shield: null };
    d.sk = d.sk || {};
    const cost = it.cost;
    if (!this.canBuy(it)) return false;
    if (!G.dev && d.pending < cost) return false;
    if (!G.dev) d.pending -= cost;
    if (it.slot === 'ranged' && it.skill) {   // broń dystansowa: odblokowuje umiejętność (kusza zastępuje łuk)
      d.sk[it.skill] = 1;
      if (it.skill === 'xbow') d.sk.bow = 1;
      return true;
    }
    d.gear[it.slot] = id;
    return true;
  },

  addComp(d, t) {
    const B = COMPS[t];
    d.comps = d.comps || [];
    const hp = Math.round(d.maxhp * B.hp);
    d.comps.push({
      t, name: B.name, hp, maxhp: hp,
      atk: Math.max(4, Math.round(d.atk * B.atk)),
      def: Math.round(d.def * B.def),
      crit: B.crit, dodge: B.dodge
    });
  },

  cost(k) {
    return k.cost + (k.max > 1 && !k.comp ? Math.floor((this.d.sk[k.id] || 0) / 3) : 0);
  },

  buy(id) {
    const d = this.d;
    const k = SKILLS.find(s => s.id === id);
    const c = this.cost(k);
    d.sk = d.sk || {};
    d.comps = d.comps || [];
    if ((!G.dev && d.pending < c) || (d.sk[id] || 0) >= k.max || (k.comp && d.comps.length >= 3))
      return false;
    if (!G.dev) d.pending -= c;
    d.sk[id] = (d.sk[id] || 0) + 1;
    k.f(d);
    return true;
  }
};

/* Lista umiejętności w sklepie wieśniaka */
const SKILLS = [
  { id: 'atk',    name: 'Ostrze mistrza',      desc: '+3 ATK',                         cost: 1, max: 10, f: d => d.atk += 3 },
  { id: 'def',    name: 'Żelazna skóra',        desc: '+2 DEF',                         cost: 1, max: 10, f: d => d.def += 2 },
  { id: 'hp',     name: 'Witalność',            desc: '+10 maks. HP',                   cost: 1, max: 10, f: d => { d.maxhp += 10; d.hp += 10; } },
  { id: 'crit',   name: 'Oko sokoła',           desc: '+5% CRIT',                       cost: 1, max: 6,  f: d => d.crit += 0.05 },
  { id: 'dodge',  name: 'Zwinność',             desc: '+3% UNIK',                       cost: 1, max: 6,  f: d => d.dodge += 0.03 },
  { id: 'potion', name: 'Zapas eliksirów',      desc: '+2 eliksiry',                    cost: 1, max: 99, f: d => d.potions += 2 },
  { id: 'vamp',   name: 'Wampiryzm',            desc: 'leczy 20% zadanych obrażeń',     cost: 3, max: 1,  f: () => {} },
  { id: 'herb',   name: 'Ziołolecznictwo',      desc: 'eliksir leczy +20 HP',           cost: 2, max: 1,  f: () => {} },
  { id: 'venom',  name: 'Zatrute ostrza',       desc: 'trucizna 35% (goblin, ludzie, elfy, zwierzęta, yeti)', cost: 3, max: 1, f: () => {} },
  { id: 'flame',  name: 'Płomienne ostrze',     desc: 'podpalenie 35% (oprócz ognistych)', cost: 3, max: 1, f: () => {} },
  { id: 'frost',  name: 'Mroźne ostrze',        desc: 'zamrożenie 30% (oprócz zimowych)', cost: 3, max: 1, f: () => {} },
  { id: 'resist', name: 'Odporność na efekty',  desc: '-25% szans na truciznę/ogień/zamrożenie', cost: 2, max: 3, f: () => {} },
  { id: 'fire',   name: 'Kula ognia',           desc: 'super atak co 3 tury (x4.4 + podpalenie)', cost: 6, max: 1, f: () => {} },
  { id: 'double', name: 'Podwójne uderzenie',   desc: '25% szans na drugi cios przy ataku', cost: 4, max: 1, f: () => {} },
  { id: 'compS',  name: 'Kompan: Giermek',      desc: 'walczy u twego boku aż padnie',  cost: 5, max: 99, comp: 1, f: d => Player.addComp(d, 'squire') },
  { id: 'compA',  name: 'Kompan: Łuczniczka',   desc: 'strzela z dystansu aż padnie',   cost: 5, max: 99, comp: 1, f: d => Player.addComp(d, 'archer') },
];

/* ============================================================
   GEAR – zbrojmistrz sprzedaje miecze, zbroje i tarcze
   slot: 'sword' | 'armor' | 'shield'
   sprite: klucz ASSETS dla zbroi (zmienia wygląd bohatera)
   ============================================================ */
const GEAR = [
  /* miecze – bonus ATK + nakładka wizualna */
  { id: 'sw_wood',   slot: 'sword', name: 'Drewniany miecz',  desc: '+2 ATK',  atk: 2,  def: 0, cost: 1,  overlay: 'sword_wood' },
  { id: 'sw_iron',   slot: 'sword', name: 'Żelazny miecz',    desc: '+5 ATK',  atk: 5,  def: 0, cost: 3,  overlay: 'sword_iron' },
  { id: 'sw_steel',  slot: 'sword', name: 'Stalowy miecz',    desc: '+9 ATK',  atk: 9,  def: 0, cost: 6,  overlay: 'sword_steel' },
  { id: 'sw_myth',   slot: 'sword', name: 'Miecz mithrilowy', desc: '+14 ATK', atk: 14, def: 0, cost: 10, overlay: 'sword_myth' },
  /* zbroje – bonus DEF + zmiana sprite\'a postaci */
  { id: 'ar_leather', slot: 'armor', name: 'Skórzana zbroja',  desc: '+3 DEF',  atk: 0, def: 3,  cost: 2,  sprite: 'hero_leather' },
  { id: 'ar_iron',    slot: 'armor', name: 'Żelazna zbroja',   desc: '+6 DEF',  atk: 0, def: 6,  cost: 4,  sprite: 'hero_iron' },
  { id: 'ar_steel',   slot: 'armor', name: 'Stalowa zbroja',   desc: '+10 DEF', atk: 0, def: 10, cost: 7,  sprite: 'hero_steel' },
  { id: 'ar_myth',    slot: 'armor', name: 'Zbroja mithrilowa',desc: '+15 DEF', atk: 0, def: 15, cost: 12, sprite: 'hero_mythril' },
  /* tarcze – bonus DEF + nakładka wizualna */
  { id: 'sh_wood',  slot: 'shield', name: 'Drewniana tarcza', desc: '+2 DEF',  atk: 0, def: 2,  cost: 1, overlay: 'shield_wood' },
  { id: 'sh_iron',  slot: 'shield', name: 'Żelazna tarcza',   desc: '+4 DEF',  atk: 0, def: 4,  cost: 3, overlay: 'shield_iron' },
  { id: 'sh_steel', slot: 'shield', name: 'Stalowa tarcza',   desc: '+7 DEF',  atk: 0, def: 7,  cost: 5, overlay: 'shield_steel' },
  { id: 'sh_myth',  slot: 'shield', name: 'Tarcza mithrilowa',desc: '+11 DEF', atk: 0, def: 11, cost: 9, overlay: 'shield_myth' },
  /* broń dystansowa – kupowana u zbrojmistrza, odblokowuje akcję Strzał */
  { id: 'bow',  slot: 'ranged', name: 'Łuk',   desc: 'Strzał z dystansu', skill: 'bow',  cost: 3 },
  { id: 'xbow', slot: 'ranged', name: 'Kusza', desc: 'mocniejszy Strzał (x1.6)', skill: 'xbow', cost: 6 },
];

const Save = {
  get(m)  { try { return JSON.parse(localStorage.getItem('mw_' + m)); } catch (e) { return null; } },
  set(m, o) { localStorage.setItem('mw_' + m, JSON.stringify(o)); },
  clear(m)  { localStorage.removeItem('mw_' + m); }
};

const COMPS = {
  squire: { name: 'Giermek',    hp: 0.6,  atk: 0.6, def: 0.7, crit: 0.1, dodge: 0.05 },
  archer: { name: 'Łuczniczka', hp: 0.45, atk: 0.7, def: 0.4, crit: 0.2, dodge: 0.1  }
};
