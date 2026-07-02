-- Account-XP voor het level-systeem (zelfde curve als Mijn Speler).
-- Voer uit in de Supabase SQL editor.

ALTER TABLE users ADD COLUMN IF NOT EXISTS xp int NOT NULL DEFAULT 0;
