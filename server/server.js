/* Start: cd server && npm install && npm start  →  http://localhost:3000
   Wymaga PostgreSQL. Połączenie: zmienna DATABASE_URL (domyślnie postgres://postgres:postgres@localhost:5432/pixelrpg).
   Baza musi istnieć:  createdb pixelrpg   – tabelę `saves` serwer utworzy sam przy starcie (schema.sql). */
const fs = require('fs'), path = require('path');
const { Pool } = require('pg');
const { createHandler, http } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pixelrpg' });
pool.on('error', e => console.error('[pg]', e.message));

(async () => {
  try {
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  } catch (e) {
    console.error('Nie można połączyć się z PostgreSQL / utworzyć tabeli:', e.message);
    console.error('Sprawdź DATABASE_URL i czy baza istnieje (createdb pixelrpg).');
    process.exit(1);
  }
  http.createServer(createHandler(pool, path.join(__dirname, '..'))).listen(PORT, () =>
    console.log(`Monster Waves: http://localhost:${PORT}  (zapisy: PostgreSQL)`));
})();
