-- Instellingen voor offline carrière (formatie, rerolls, wissels, competities).
-- De "careers" tabel bestaat al; voer alleen onderstaande ALTER TABLE-regels uit.

ALTER TABLE careers ADD COLUMN IF NOT EXISTS formation_key text NOT NULL DEFAULT '433';
ALTER TABLE careers ADD COLUMN IF NOT EXISTS reroll_count int NOT NULL DEFAULT 1;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS wissel_count int NOT NULL DEFAULT 2;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS leagues jsonb NOT NULL DEFAULT '[]'::jsonb;
