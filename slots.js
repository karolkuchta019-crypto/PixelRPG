/* v1.1 – SLOTY ZAPISU w PostgreSQL: 3 sloty na kampanię albo tryb nieskończony.
   Zapis/odczyt idą przez serwer (server/, API /api/saves). Grę otwieraj przez http://localhost:3000 (nie przez file://).
   Gracz = losowe UUID w localStorage (mw_pid) – rozdziela zapisy różnych osób; to nie jest logowanie. */
const Slots = {
  N: 3,
  pid() {
    let id = null;
    try { id = localStorage.getItem('mw_pid'); } catch (e) {}
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
      try { localStorage.setItem('mw_pid', id); } catch (e) {}
    }
    return id;
  },
  async api(method, path, body) {
    let r;
    try {
      r = await fetch('/api/' + path, { method, headers: { 'Content-Type': 'application/json', 'X-Player-Id': this.pid() }, body: body ? JSON.stringify(body) : undefined });
    } catch (e) {
      throw new Error('Brak połączenia z serwerem zapisu. Uruchom go (cd server && npm start) i otwórz grę przez http://localhost:3000');
    }
    if (!r.ok) { let m = ''; try { m = (await r.json()).error; } catch (e) {} throw new Error(m || 'Błąd serwera (' + r.status + ')'); }
    return r.json();
  },
  list() { return this.api('GET', 'saves'); },
  get(n) { return this.api('GET', 'saves/' + n); },
  put(n, rec) { return this.api('PUT', 'saves/' + n, rec); },
  del(n) { return this.api('DELETE', 'saves/' + n); },

  /* zapis możliwy tylko w stabilnym momencie: walka (nic się nie animuje) lub po wygranej fali; nie w chatce wiedźmy */
  canSave() { return !!G.p && !G.hub && ['fight', 'clear'].includes(G.state) && !Combat.busy && !G.bub; },
  canLoad() { return !Combat.busy && ['title', 'fight', 'clear', 'over'].includes(G.state); },

  meta(rec) {
    const d = rec.player, camp = rec.mode === 'campaign';
    return {
      label: (camp ? `Etap ${rec.level + 1}: ${CAMPAIGN[rec.level].name}, fala ${rec.wave}/${rec.waves.length}` : `Fala ${rec.wave}`) + (rec.state === 'clear' ? ' ✓' : ''),
      level: d.level, kills: d.kills || 0, deaths: d.deaths || 0
    };
  },
  async save(n) {
    const rec = G.snapshot();
    await this.put(n, { mode: rec.mode, meta: this.meta(rec), data: rec });
  },

  /* sprawdza, czy zapis z bazy nie rozwali gry (np. ręcznie zmieniony) */
  validate(rec) {
    const num = v => typeof v === 'number' && isFinite(v);
    if (!rec || typeof rec !== 'object' || !rec.player || typeof rec.player !== 'object') return null;
    const d = rec.player;
    if (!['campaign', 'endless'].includes(rec.mode) || !Number.isInteger(rec.wave) || rec.wave < 1) return null;
    if (!num(d.hp) || !num(d.maxhp) || !num(d.atk) || !num(d.def) || !num(d.level) || d.maxhp < 1) return null;
    rec.state = rec.state === 'clear' ? 'clear' : 'fight';
    if (rec.mode === 'campaign') {
      if (!CAMPAIGN[rec.level]) return null;
      const ok = Array.isArray(rec.waves) && rec.waves.length > 0 && rec.wave <= rec.waves.length &&
        rec.waves.every(w => w && Array.isArray(w.e) && w.e.length > 0 && w.e.every(t => ENEMY_DEFS[t]));
      if (!ok) return null;
    }
    d.hp = Math.max(1, Math.min(d.hp, d.maxhp));
    return rec;
  },
  async load(n) {
    const r = await this.get(n);
    const rec = this.validate(r.data);
    if (!rec) throw new Error('Zapis w slocie ' + n + ' jest uszkodzony.');
    /* zsynchronizuj też zwykły autozapis (mapa świata / „Kontynuuj”) */
    if (rec.mode === 'campaign') Save.set('campaign', { p: rec.player, cleared: rec.cleared || 0 });
    else Save.set('endless', { p: rec.player, w: rec.wave + (rec.state === 'clear' ? 1 : 0) });
    G.restore(rec);
  }
};
