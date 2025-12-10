-- Ajouter les colonnes first_name et last_name à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Renommer la colonne name en full_name si elle existe
ALTER TABLE users 
RENAME COLUMN name TO full_name;

-- Ou si la colonne full_name n'existe pas encore
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Mettre à jour full_name depuis les données existantes si nécessaire
UPDATE users 
SET full_name = COALESCE(first_name || ' ' || last_name, full_name, '')
WHERE full_name IS NULL OR full_name = '';

-- Ajouter des commentaires
COMMENT ON COLUMN users.first_name IS 'Prénom de l''utilisateur';
COMMENT ON COLUMN users.last_name IS 'Nom de famille de l''utilisateur';
COMMENT ON COLUMN users.full_name IS 'Nom complet (prénom + nom)';
