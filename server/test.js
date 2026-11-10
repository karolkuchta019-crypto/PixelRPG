/* Test API zapisów na atrapie bazy (bez PostgreSQL): node test.js */
const assert = require('assert'), path = require('path');
const { createHandler, http } = require('./app');

const rows = new Map();   // "pid|slot" -> wiersz
const pool = { async query(sql, p = []) {
  if (/^SELECT slot, mode, meta, updated_at/.test(sql.trim())) return { rows: [...rows.values()].filter(r => r.player_id === p[0]).sort((a, b) => a.slot - b.slot).map(({ slot, mode, meta, updated_at }) => ({ slot, mode, meta, updated_at })) };
  if (/^SELECT slot, mode, meta, data/.test(sql.trim())) { const r = rows.get(p[0] + '|' + p[1]); return { rows: r ? [r] : [] }; }
  if (/^INSERT INTO saves/.test(sql.trim())) { const r = { player_id: p[0], slot: p[1], mode: p[2], meta: JSON.parse(p[3]), data: JSON.parse(p[4]), updated_at: new Date().toISOString() }; rows.set(p[0] + '|' + p[1], r); return { rows: [{ updated_at: r.updated_at }] }; }
  if (/^DELETE FROM saves/.test(sql.trim())) { rows.delete(p[0] + '|' + p[1]); return { rows: [] }; }
  throw new Error('nieznane zapytanie: ' + sql);
} };

const srv = http.createServer(createHandler(pool, path.join(__dirname, '..')));
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const call = async (m, u, pid, body) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json', ...(pid ? { 'X-Player-Id': pid } : {}) }, body: body && JSON.stringify(body) }); let j = null; try { j = await r.json(); } catch (e) {} return { s: r.status, j }; };
  const rec = { v: 1, mode: 'campaign', state: 'fight', wave: 2, level: 2, player: { hp: 50, maxhp: 100 } };
  try {
    assert.strictEqual((await call('GET', '/api/health')).s, 200);
    assert.strictEqual((await call('GET', '/api/saves')).s, 400, 'bez ID gracza = 400');
    assert.strictEqual((await call('GET', '/api/saves', 'nie-uuid')).s, 400);
    assert.deepStrictEqual((await call('GET', '/api/saves', A)).j, [], 'pusta lista');
    assert.strictEqual((await call('GET', '/api/saves/1', A)).s, 404, 'pusty slot = 404');
    // zapis do slotów 1 i 3
    assert.strictEqual((await call('PUT', '/api/saves/1', A, { mode: 'campaign', meta: { label: 'Etap 3' }, data: rec })).s, 200);
    assert.strictEqual((await call('PUT', '/api/saves/3', A, { mode: 'endless', meta: { label: 'Fala 7' }, data: { ...rec, mode: 'endless' } })).s, 200);
    let l = (await call('GET', '/api/saves', A)).j;
    assert.deepStrictEqual(l.map(x => x.slot), [1, 3]); assert.strictEqual(l[0].meta.label, 'Etap 3'); assert.ok(!('data' in l[0]), 'lista bez pełnych danych');
    // odczyt, nadpisanie
    assert.strictEqual((await call('GET', '/api/saves/1', A)).j.data.player.hp, 50);
    await call('PUT', '/api/saves/1', A, { mode: 'campaign', meta: {}, data: { ...rec, player: { hp: 99 } } });
    assert.strictEqual((await call('GET', '/api/saves/1', A)).j.data.player.hp, 99, 'nadpisanie');
    // izolacja graczy
    assert.deepStrictEqual((await call('GET', '/api/saves', B)).j, [], 'inny gracz nie widzi cudzych zapisów');
    // walidacja
    assert.strictEqual((await call('PUT', '/api/saves/4', A, { mode: 'campaign', data: rec })).s, 400, 'slot 4');
    assert.strictEqual((await call('PUT', '/api/saves/0', A, { mode: 'campaign', data: rec })).s, 400, 'slot 0');
    assert.strictEqual((await call('PUT', '/api/saves/2', A, { mode: 'hack', data: rec })).s, 400, 'zły tryb');
    assert.strictEqual((await call('PUT', '/api/saves/2', A, { mode: 'campaign', data: { mode: 'endless', player: {} } })).s, 400, 'tryb != data.mode');
    assert.strictEqual((await call('PUT', '/api/saves/2', A, { mode: 'campaign', data: 5 })).s, 400, 'data nie obiekt');
    const big = await call('PUT', '/api/saves/2', A, { mode: 'campaign', data: { mode: 'campaign', player: { x: 'a'.repeat(300000) } } });
    assert.ok(big.s === 413 || big.s === 0, 'limit rozmiaru, jest ' + big.s);
  } catch (e) { if (!/fetch failed|ECONNRESET|socket/.test(String(e && (e.cause && e.cause.code || e.message)))) throw e; }   // przy 413 serwer zrywa połączenie – to też poprawna odpowiedź
  // usuwanie
  assert.strictEqual((await call('DELETE', '/api/saves/1', A)).s, 200);
  assert.strictEqual((await call('GET', '/api/saves/1', A)).s, 404);
  // pliki statyczne: gra tak, kod serwera i ukryte nie
  const get = async u => (await fetch(base + u)).status;
  assert.strictEqual(await get('/'), 200, 'index.html');
  assert.strictEqual(await get('/game.js'), 200);
  assert.strictEqual(await get('/server/app.js'), 404, 'kod serwera ukryty');
  assert.strictEqual(await get('/server/.env'), 404);
  assert.strictEqual(await get('/%2e%2e/etc/passwd'), 404);
  assert.strictEqual(await get('/..%2fserver%2fapp.js'), 404);
  assert.strictEqual(await get('/tools/generate_assets.py'), 404);
  const rg = await fetch(base + '/assets/music/forest.mp3', { headers: { Range: 'bytes=0-99' } });
  assert.strictEqual(rg.status, 206); assert.strictEqual((await rg.arrayBuffer()).byteLength, 100, 'Range dla mp3');
  console.log('SERVER TESTS: OK'); srv.close();
});
