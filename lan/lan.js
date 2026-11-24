/* ============================================================
   LAN.JS – v1.4.0: serwer pokoi LAN (WebSocket bez zewnętrznych bibliotek)
   Przekazuje wiadomości między gospodarzem (host) a graczami w tym samym pokoju. Cała logika gry działa u gospodarza –
   serwer jest tylko "pocztą". Użycie:  require('./lan').attach(httpServer)   (ścieżka WebSocket: /lan)
   Protokół (JSON):
     klient -> serwer: {t:'list'} | {t:'host',n,name} | {t:'join',room,name} | {t:'start'} | {t:'leave'}
                       {t:'up',d}                (gracz -> gospodarz)      {t:'down',to:idx|'all',d}  (gospodarz -> gracz/wszyscy)
     serwer -> klient: {t:'rooms',rooms} | {t:'hosted',room,you} | {t:'joined',room,you} | {t:'lobby',...} | {t:'start',n,you}
                       {t:'up',from,d} | {t:'down',d} | {t:'gone',i} | {t:'closed'} | {t:'err',m}
   ============================================================ */
const crypto = require('crypto');
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const rooms = new Map();
const MAX_PAYLOAD = 2 * 1024 * 1024;

function frame(text) {
  const p = Buffer.from(text, 'utf8'), n = p.length;
  let h;
  if (n < 126) h = Buffer.from([0x81, n]);
  else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(n, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([h, p]);
}

class Conn {
  constructor(sock) { this.sock = sock; this.buf = Buffer.alloc(0); this.frag = []; this.room = null; this.idx = -1; this.name = 'Gracz'; this.alive = true; }
  send(o) { if (this.alive && !this.sock.destroyed) try { this.sock.write(frame(JSON.stringify(o))); } catch (e) {} }
  close() { this.alive = false; try { this.sock.end(Buffer.from([0x88, 0])); } catch (e) {} try { this.sock.destroy(); } catch (e) {} }
}

function roomCode() { let c; do { c = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join(''); } while (rooms.has(c)); return c; }
function lobby(r) {
  const players = []; for (let i = 0; i < r.n; i++) players.push(i === 0 ? r.host.name : (r.slots[i] ? r.slots[i].name : null));
  const m = { t: 'lobby', room: r.id, n: r.n, players, started: r.started };
  r.host.send(m); r.slots.forEach(c => c && c.send(m));
}
function leave(c) {
  const r = c.room; if (!r) return;
  c.room = null;
  if (r.host === c) { r.slots.forEach(s => s && (s.room = null, s.send({ t: 'closed' }))); rooms.delete(r.id); return; }
  r.slots[c.idx] = null;
  if (r.started) r.host.send({ t: 'gone', i: c.idx }); else lobby(r);
}

function onMessage(c, text) {
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  switch (m.t) {
    case 'list':
      return c.send({ t: 'rooms', rooms: [...rooms.values()].filter(r => !r.started).map(r => ({ id: r.id, name: r.host.name, n: r.n, count: 1 + r.slots.filter(Boolean).length })) });
    case 'host': {
      leave(c); c.name = String(m.name || 'Gospodarz').slice(0, 16);
      const n = Math.max(2, Math.min(3, +m.n || 2)), r = { id: roomCode(), n, host: c, slots: new Array(n).fill(null), started: false };
      rooms.set(r.id, r); c.room = r; c.idx = 0;
      c.send({ t: 'hosted', room: r.id, you: 0 }); return lobby(r);
    }
    case 'join': {
      leave(c); const r = rooms.get(String(m.room || '').toUpperCase().trim());
      if (!r) return c.send({ t: 'err', m: 'Nie ma takiego pokoju.' });
      if (r.started) return c.send({ t: 'err', m: 'Gra w tym pokoju już się rozpoczęła.' });
      let i = 1; while (i < r.n && r.slots[i]) i++;
      if (i >= r.n) return c.send({ t: 'err', m: 'Pokój jest pełny.' });
      c.name = String(m.name || 'Gracz ' + (i + 1)).slice(0, 16); c.room = r; c.idx = i; r.slots[i] = c;
      c.send({ t: 'joined', room: r.id, you: i }); return lobby(r);
    }
    case 'start': {
      const r = c.room; if (!r || r.host !== c || r.started) return;
      const occ = []; for (let i = 1; i < r.n; i++) if (r.slots[i]) occ.push(r.slots[i]);
      if (!occ.length) return c.send({ t: 'err', m: 'Potrzeba co najmniej 2 graczy.' });
      r.started = true; r.n = 1 + occ.length; r.slots = [null, ...occ];
      occ.forEach((s, k) => { s.idx = k + 1; });
      const names = [r.host.name, ...occ.map(s => s.name)];
      c.send({ t: 'start', n: r.n, you: 0, names });
      occ.forEach(s => s.send({ t: 'start', n: r.n, you: s.idx, names })); return;
    }
    case 'leave': return leave(c);
    case 'up': { const r = c.room; if (r && r.started && r.host !== c) r.host.send({ t: 'up', from: c.idx, d: m.d }); return; }
    case 'down': {
      const r = c.room; if (!r || r.host !== c) return;
      if (m.to === 'all') r.slots.forEach(s => s && s.send({ t: 'down', d: m.d }));
      else { const s = r.slots[m.to]; if (s) s.send({ t: 'down', d: m.d }); }
    }
  }
}

function drop(c) { if (c.left) return; c.left = true; leave(c); c.close(); }
function onData(c, chunk) {
  c.buf = Buffer.concat([c.buf, chunk]);
  for (;;) {
    const b = c.buf; if (b.length < 2) return;
    const fin = !!(b[0] & 0x80), op = b[0] & 0x0f, masked = !!(b[1] & 0x80); let len = b[1] & 0x7f, off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
    if (len > MAX_PAYLOAD) return drop(c);
    const need = off + (masked ? 4 : 0) + len; if (b.length < need) return;
    let p = b.subarray(off + (masked ? 4 : 0), need);
    if (masked) { const k = b.subarray(off, off + 4); p = Buffer.from(p); for (let i = 0; i < p.length; i++) p[i] ^= k[i & 3]; }
    c.buf = b.subarray(need);
    if (op === 8) { drop(c); return; }
    if (op === 9) { try { c.sock.write(Buffer.concat([Buffer.from([0x8a, p.length]), p])); } catch (e) {} continue; }
    if (op === 1 || op === 0) {
      c.frag.push(p);
      if (fin) { const t = Buffer.concat(c.frag).toString('utf8'); c.frag = []; onMessage(c, t); }
    }
  }
}

function attach(server, path = '/lan') {
  server.on('upgrade', (req, sock) => {
    if (req.url.split('?')[0] !== path || !req.headers['sec-websocket-key']) { sock.destroy(); return; }
    const acc = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + GUID).digest('base64');
    sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
    sock.setNoDelay(true);
    const c = new Conn(sock);
    sock.on('data', d => onData(c, d));
    sock.on('close', () => drop(c)); sock.on('error', () => drop(c)); sock.on('end', () => drop(c));
  });
}
module.exports = { attach, rooms };
