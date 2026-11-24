/* ============================================================
   TEAM.JS – v1.4.0: DRUŻYNA (klawisz T)
   Kompani (giermek, łuczniczka, bard…) są albo w DRUŻYNIE (walczą u boku bohatera, maks. TEAM_MAX = 4),
   albo w REZERWIE (nie walczą, nie dostają obrażeń, ale zostają przy bohaterze i można ich w każdej chwili przywołać).
   Flaga rezerwy to pole `res` w obiekcie kompana (zapisuje się razem z bohaterem). Łącznie można mieć COMP_OWN_MAX = 6 kompanów.
   ============================================================ */
Object.assign(Player, {
  active(d) { return (((d || this.d) || {}).comps || []).filter(c => !c.res); },
  reserve(d) { return (((d || this.d) || {}).comps || []).filter(c => c.res); }
});

/* czy jakieś okno (#screen) jest teraz otwarte nad grą – wtedy bohater nie chodzi i nie otwiera sklepów */
UI.overlay = function () { const s = this.$('screen'); return !!s && !s.classList.contains('hidden'); };

Object.assign(G, {
  /* po zmianie składu drużyny: dopasuj aktorów na arenie do Player.active() */
  applyTeam() {
    if (!this.p || !Player.d) return;
    const act = Player.active();
    this.comps = this.comps.filter(a => act.includes(a.s));
    this.actors = this.actors.filter(a => !a.ally || act.includes(a.s));
    act.forEach(c => {
      if (this.comps.some(a => a.s === c)) return;
      const a = this.makeComp(c, this.comps.length);
      this.comps.push(a); this.actors.push(a);
      this.burst(a.x, a.y - 20, '#fff', 12);
    });
    this.comps = act.map(c => this.comps.find(a => a.s === c));
    this.comps.forEach((a, i) => { const q = this.compPos(i, this.p.x, this.p.y); a.x = q.x; a.y = q.y; });
    UI.hud();
  }
});

Object.assign(UI, {
  teamAllowed() {
    return !!(G.p && Player.d && !G.mp && !Combat.busy && ['fight', 'clear'].includes(G.state) && !G.bub);
  },

  /* T: otwiera / zamyka ekran drużyny */
  toggleTeam() {
    const s = this.$('screen');
    if (s.className === 'team' && !s.classList.contains('hidden')) { this.closeTeam(); return; }
    if (this.overlay()) return;                       // inne okno już otwarte
    if (!this.teamAllowed()) {
      if (G.mp) this.log('Drużyna (kompani) nie jest dostępna w multiplayerze – każdy gracz ma swojego bohatera.');
      else if (G.p && Player.d) this.log('Drużynę zmienisz, gdy nic się nie dzieje (poza animacjami, dialogami i minigrami).');
      return;
    }
    this.team();
  },

  closeTeam() {
    const s = this.$('screen');
    s.classList.add('hidden'); s.innerHTML = ''; s.className = 'hidden';
    G.applyTeam();
  },

  team() {
    const d = Player.d, s = this.$('screen');
    d.comps = d.comps || [];
    s.innerHTML = ''; s.className = 'team'; s.classList.remove('hidden');
    const h = document.createElement('h2'); h.textContent = trn('Drużyna (T)'); s.append(h);

    const act = Player.active(), res = Player.reserve();
    const sub = document.createElement('p');
    sub.textContent = `${trn('W drużynie')}: ${act.length}/${TEAM_MAX} · ${trn('W rezerwie')}: ${res.length}. ` +
      trn('Kliknij przycisk na karcie, aby przenieść postać między drużyną a rezerwą. Tylko drużyna walczy.');
    s.append(sub);

    const mkCard = c => {
      const card = document.createElement('div');
      card.className = 'team-card' + (c.res ? ' res' : '');
      const key = c.t === 'archer' ? 'comp_archer' : c.t === 'bard' ? 'comp_bard' : (d.sqArmor ? 'comp_squire_leather' : 'comp_squire');
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; cv.className = 'team-portrait';
      try { const c2 = cv.getContext('2d'); c2.imageSmoothingEnabled = false; Assets.draw(c2, key, 32, 62, 1.8, 0); } catch (e) {}
      const info = document.createElement('div'); info.className = 'team-info';
      const nm = document.createElement('b'); nm.textContent = trn(c.name);
      const st = document.createElement('span');
      st.textContent = `HP ${c.hp}/${c.maxhp} · ATK ${c.atk} · DEF ${c.def}`;
      info.append(nm, st);
      const btn = document.createElement('button');
      const full = !c.res ? false : Player.active().length >= TEAM_MAX;
      btn.textContent = trn(c.res ? '▶ Do drużyny' : '◀ Do rezerwy');
      btn.disabled = full;
      if (full) btn.title = trn('Drużyna jest pełna – najpierw przenieś kogoś do rezerwy.');
      btn.onclick = () => { c.res = c.res ? 0 : 1; G.applyTeam(); this.team(); };
      card.append(cv, info, btn);
      return card;
    };

    const sec = (label, list, empty) => {
      const box = document.createElement('div'); box.className = 'team-sec';
      const h3 = document.createElement('h3'); h3.textContent = trn(label); box.append(h3);
      const grid = document.createElement('div'); grid.className = 'team-grid';
      if (!list.length) { const e = document.createElement('p'); e.className = 'team-empty'; e.textContent = trn(empty); grid.append(e); }
      list.forEach(c => grid.append(mkCard(c)));
      box.append(grid); s.append(box);
    };
    sec(`DRUŻYNA (${act.length}/${TEAM_MAX})`, act, 'Brak kompanów w drużynie. Zatrudnij ich u Wędrownego Kupca.');
    sec(`REZERWA (${res.length})`, res, 'Rezerwa jest pusta.');

    const close = document.createElement('button');
    close.textContent = trn('Zamknij (T)');
    close.onclick = () => this.closeTeam();
    s.append(close);
  }
});
