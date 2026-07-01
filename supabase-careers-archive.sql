-- Offline carrière: gestopte carrières bewaren voor de ranglijst i.p.v. verwijderen.
-- Run dit in de Supabase SQL editor.

ALTER TABLE careers ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_careers_user_active ON careers(user_id, active);

-- De oude UNIQUE(user_id) constraint stond maar 1 carrière per gebruiker toe.
-- Die moet weg zodat een gebruiker na het stoppen van een carrière een nieuwe
-- kan starten terwijl de oude (gearchiveerd, active=false) bewaard blijft.
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'careers'::regclass AND contype = 'u';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE careers DROP CONSTRAINT %I', con_name);
  END IF;
END $$;
