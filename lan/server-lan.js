/* Serwer LAN bez bazy danych: node lan/server-lan.js  (albo start-lan.bat / start-lan.sh)
   Udostępnia grę (pliki statyczne) i pokoje multiplayer LAN na porcie 3000 (zmienna PORT). Zapisy w slotach (PostgreSQL) tu nie działają –
   do zwykłej gry z zapisami użyj server/server.js (on także obsługuje LAN). */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { attach } = require('./lan');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.PORT) || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.mwmod': 'application/json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || /[\\/](server|lan)[\\/]/.test(f.slice(ROOT.length))) { res.writeHead(403); return res.end('403'); }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); res.end(d); });
});
attach(srv);
srv.listen(PORT, '0.0.0.0', () => {
  console.log('Monster Waves – serwer LAN działa.\n  Gospodarz:  http://localhost:' + PORT);
  Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).forEach(i => console.log('  Pozostali gracze (ta sama sieć):  http://' + i.address + ':' + PORT));
});
