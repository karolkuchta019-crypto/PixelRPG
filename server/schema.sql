-- Monster Waves 1.1.0 – sloty zapisu (3 na gracza: kampania albo tryb nieskończony)
CREATE TABLE IF NOT EXISTS saves (
  player_id  uuid        NOT NULL,
  slot       smallint    NOT NULL CHECK (slot BETWEEN 1 AND 3),
  mode       text        NOT NULL CHECK (mode IN ('campaign', 'endless')),
  meta       jsonb       NOT NULL DEFAULT '{}'::jsonb,   -- krótki opis do listy slotów
  data       jsonb       NOT NULL,                       -- pełny stan gry
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, slot)
);
