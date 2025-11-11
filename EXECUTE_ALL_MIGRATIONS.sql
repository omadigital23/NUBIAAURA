-- ============================================
-- TOUTES LES MIGRATIONS À EXÉCUTER
-- Copiez-collez ce fichier dans Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. AJOUTER LA COLONNE STOCK
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;

UPDATE products 
SET stock = 10 
WHERE stock IS NULL;

-- Ajouter la contrainte seulement si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stock_non_negative' 
    AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

COMMENT ON COLUMN products.stock IS 'Nombre d''articles disponibles en stock';


-- ============================================
-- 2. AJOUTER FIRST_NAME ET LAST_NAME
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Mettre à jour full_name depuis les données existantes
UPDATE users 
SET full_name = COALESCE(first_name || ' ' || last_name, full_name, '')
WHERE full_name IS NULL OR full_name = '';

COMMENT ON COLUMN users.first_name IS 'Prénom de l''utilisateur';
COMMENT ON COLUMN users.last_name IS 'Nom de famille de l''utilisateur';
COMMENT ON COLUMN users.full_name IS 'Nom complet (prénom + nom)';


-- ============================================
-- 3. CORRIGER LA FONCTION PRODUCTS_SYNC_IMAGE
-- ============================================

-- Supprimer TOUS les triggers possibles (anciens et nouveaux noms)
DROP TRIGGER IF EXISTS products_sync_image_trigger ON products;
DROP TRIGGER IF EXISTS trg_products_sync_image ON products;

-- Supprimer la fonction avec CASCADE pour forcer la suppression
DROP FUNCTION IF EXISTS public.products_sync_image() CASCADE;

-- Recréer la fonction avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.products_sync_image()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.image IS NULL OR NEW.image = '' THEN
    NEW.image := NEW.image_url;
  END IF;
  
  IF NEW.image_url IS NULL OR NEW.image_url = '' THEN
    NEW.image_url := NEW.image;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER products_sync_image_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION public.products_sync_image();

COMMENT ON FUNCTION public.products_sync_image() IS 'Synchronizes image and image_url fields. Uses secure search_path to prevent SQL injection.';


-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Vérifier que la colonne stock existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'stock';

-- Vérifier que first_name et last_name existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('first_name', 'last_name', 'full_name');

-- Vérifier que la fonction est sécurisée
SELECT routine_name, security_type, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'products_sync_image';


-- ============================================
-- FIN DES MIGRATIONS
-- ============================================
