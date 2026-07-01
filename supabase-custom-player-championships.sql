-- Profielspeler: aantal kampioenschappen bijhouden (voor de "Mijn Speler" ranglijst).
-- Run dit in de Supabase SQL editor.

ALTER TABLE custom_players ADD COLUMN IF NOT EXISTS championships int NOT NULL DEFAULT 0;
