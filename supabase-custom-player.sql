-- Profielspeler: elk account krijgt één eigen speler die in elke spelmodus
-- als eerste aan de opstelling toegevoegd kan worden.
-- Run dit in de Supabase SQL editor.

CREATE TABLE custom_players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id),
  name text NOT NULL,
  position text NOT NULL, -- PosKey, bv. "CB", "ST"
  extra_positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall int NOT NULL DEFAULT 60,
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  skill_points int NOT NULL DEFAULT 0,
  total_goals int NOT NULL DEFAULT 0,
  total_assists int NOT NULL DEFAULT 0,
  total_clean_sheets int NOT NULL DEFAULT 0,
  seasons_played int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_custom_players_user ON custom_players(user_id);

ALTER TABLE custom_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read custom players" ON custom_players FOR SELECT USING (true);
CREATE POLICY "Anyone can insert custom players" ON custom_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update custom players" ON custom_players FOR UPDATE USING (true);
