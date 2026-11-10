/* Monster Waves – API zapisów + hosting plików gry. Tylko moduły wbudowane (http, fs, path); baza przychodzi z zewnątrz (pool z pg).
   Gracz jest rozpoznawany po losowym UUID z przeglądarki (nagłówek X-Player-Id) – to NIE jest logowanie, tylko rozdzielenie zapisów. */
const http = require('http'), fs = require('fs'), path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8'
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 256 * 1024;       // pojedynczy zapis to kilka KB; 256 KB to hojny limit
const SLOTS = 3;

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject({ code: 413, msg: 'Zapis jest za duży' }); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject({ code: 400, msg: 'Niepoprawny JSON' }); }
    });
    req.on('error', () => reject({ code: 400, msg: 'Błąd odczytu' }));
  });
}

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

/* ---------- API ---------- */
async function api(req, res, pool, url) {
  const pid = req.headers['x-player-id'];
  const parts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean);

  if (parts[0] === 'health') return send(res, 200, { ok: true });
  if (parts[0] !== 'saves') return send(res, 404, { error: 'Nie ma takiego adresu' });
  if (!pid || !UUID.test(pid)) return send(res, 400, { error: 'Brak poprawnego X-Player-Id' });

  try {
    /* GET /api/saves – lista slotów (bez pełnych danych) */
    if (parts.length === 1 && req.method === 'GET') {
      const r = await pool.query('SELECT slot, mode, meta, updated_at FROM saves WHERE player_id = $1 ORDER BY slot', [pid]);
      return send(res, 200, r.rows);
    }
    const slot = Number(parts[1]);
    if (parts.length !== 2 || !Number.isInteger(slot) || slot < 1 || slot > SLOTS)
      return send(res, 400, { error: 'Slot musi być liczbą 1-' + SLOTS });

    if (req.method === 'GET') {
      const r = await pool.query('SELECT slot, mode, meta, data, updated_at FROM saves WHERE player_id = $1 AND slot = $2', [pid, slot]);
      return r.rows.length ? send(res, 200, r.rows[0]) : send(res, 404, { error: 'Slot jest pusty' });
    }
    if (req.method === 'PUT') {
      let b;
      try { b = await readJson(req); } catch (e) { return send(res, e.code || 400, { error: e.msg || 'Błąd' }); }
      if (!isObj(b) || !['campaign', 'endless'].includes(b.mode)) return send(res, 400, { error: 'mode musi być campaign lub endless' });
      if (!isObj(b.data) || !isObj(b.data.player) || b.data.mode !== b.mode) return send(res, 400, { error: 'Niepoprawne dane zapisu' });
      const meta = isObj(b.meta) ? b.meta : {};
      if (JSON.stringify(meta).length > 2000) return send(res, 400, { error: 'meta jest za duże' });
      const r = await pool.query(
        `INSERT INTO saves (player_id, slot, mode, meta, data) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
         ON CONFLICT (player_id, slot) DO UPDATE SET mode = EXCLUDED.mode, meta = EXCLUDED.meta, data = EXCLUDED.data, updated_at = now()
         RETURNING updated_at`,
        [pid, slot, b.mode, JSON.stringify(meta), JSON.stringify(b.data)]);
      return send(res, 200, { ok: true, slot, updated_at: r.rows[0] && r.rows[0].updated_at });
    }
    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM saves WHERE player_id = $1 AND slot = $2', [pid, slot]);
      return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: 'Metoda niedozwolona' });
  } catch (e) {
    console.error('[api]', e && e.message);
    return send(res, 500, { error: 'Błąd bazy danych' });
  }
}

/* ---------- pliki statyczne (z obsługą Range – potrzebne dla muzyki mp3) ---------- */
function serveStatic(req, res, root, url) {
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html';
  const segs = rel.split('/').filter(Boolean);
  /* nie wystawiamy: ukrytych plików (.env, .git), kodu serwera, node_modules, skryptów generujących grafiki */
  if (segs.some(s => s.startsWith('.') || s === '..') || ['server', 'node_modules', 'tools'].includes(segs[0])) { res.writeHead(404); return res.end('Nie znaleziono'); }
  const file = path.join(root, ...segs);
  if (!file.startsWith(root + path.sep)) { res.writeHead(404); return res.end('Nie znaleziono'); }
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) { res.writeHead(404); return res.end('Nie znaleziono'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Nie znaleziono'); }
    const cache = /\.(png|mp3|ttf)$/i.test(file) ? 'public, max-age=3600' : 'no-cache';
    const base = { 'Content-Type': type, 'Cache-Control': cache, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff' };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) {
      let start = m[1] ? parseInt(m[1], 10) : Math.max(0, st.size - parseInt(m[2], 10));
      let end = m[1] && m[2] ? Math.min(parseInt(m[2], 10), st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
      res.writeHead(206, { ...base, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      return req.method === 'HEAD' ? res.end() : fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...base, 'Content-Length': st.size });
    return req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(res);
  });
}

function createHandler(pool, root) {
  root = path.resolve(root);
  return (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return api(req, res, pool, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return serveStatic(req, res, root, url);
  };
}

module.exports = { createHandler, http };
