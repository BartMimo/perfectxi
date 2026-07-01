-- Online Career Mode tables
-- Run this in the Supabase SQL editor

CREATE TABLE online_careers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  owner_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'waiting', -- waiting, drafting, simulating, finished
  current_season int NOT NULL DEFAULT 1,
  max_players int NOT NULL DEFAULT 20,
  reroll_count int NOT NULL DEFAULT 1,
  wissel_count int NOT NULL DEFAULT 2,
  leagues jsonb NOT NULL DEFAULT '[]'::jsonb, -- lege array = alle competities
  same_formation boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false, -- open lobby: zichtbaar in browser, direct joinen zonder goedkeuring
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE online_career_players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid NOT NULL REFERENCES online_careers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  username text NOT NULL,
  team_name text,
  current_division int NOT NULL DEFAULT 10,
  squad jsonb DEFAULT '[]'::jsonb,
  history jsonb DEFAULT '[]'::jsonb,
  championships int NOT NULL DEFAULT 0,
  ready boolean NOT NULL DEFAULT false,
  is_bot boolean NOT NULL DEFAULT false,
  formation_key text,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(career_id, user_id)
);

CREATE INDEX idx_oc_code ON online_careers(code);
CREATE INDEX idx_ocp_career ON online_career_players(career_id);

ALTER TABLE online_careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_career_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read online careers" ON online_careers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert online careers" ON online_careers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update online careers" ON online_careers FOR UPDATE USING (true);

CREATE POLICY "Anyone can read players" ON online_career_players FOR SELECT USING (true);
CREATE POLICY "Anyone can insert players" ON online_career_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON online_career_players FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete players" ON online_career_players FOR DELETE USING (true);

-- Realtime aanzetten zodat spelers elkaars updates live zien.
ALTER PUBLICATION supabase_realtime ADD TABLE online_careers;
ALTER PUBLICATION supabase_realtime ADD TABLE online_career_players;

-- Als de tabellen al bestaan, voer alleen onderstaande regels uit:
-- ALTER TABLE online_career_players ADD COLUMN is_bot boolean NOT NULL DEFAULT false;
-- ALTER PUBLICATION supabase_realtime ADD TABLE online_careers;
-- ALTER PUBLICATION supabase_realtime ADD TABLE online_career_players;

-- Lobby naam + delete policy + acknowledged kolom
-- ALTER TABLE online_careers ADD COLUMN lobby_name text;
-- ALTER TABLE online_career_players ADD COLUMN acknowledged boolean NOT NULL DEFAULT false;
-- ALTER TABLE online_career_players ADD COLUMN pending boolean NOT NULL DEFAULT false;
-- CREATE POLICY "Anyone can delete online careers" ON online_careers FOR DELETE USING (true);

-- Formatie moet bevestigd worden voordat de lobby kan starten
-- ALTER TABLE online_career_players ADD COLUMN formation_confirmed boolean NOT NULL DEFAULT false;

-- Lobby-instellingen: rerolls, wissels, competities, gedeelde formatie
-- ALTER TABLE online_careers ADD COLUMN reroll_count int NOT NULL DEFAULT 1;
-- ALTER TABLE online_careers ADD COLUMN wissel_count int NOT NULL DEFAULT 2;
-- ALTER TABLE online_careers ADD COLUMN leagues jsonb NOT NULL DEFAULT '[]'::jsonb;
-- ALTER TABLE online_careers ADD COLUMN same_formation boolean NOT NULL DEFAULT false;
-- ALTER TABLE online_career_players ADD COLUMN formation_key text;

-- Open lobby's: publiek zichtbaar en direct joinbaar zonder code/goedkeuring
-- ALTER TABLE online_careers ADD COLUMN is_public boolean NOT NULL DEFAULT false;
