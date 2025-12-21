-- ============================================
-- NUBIA AURA - FIX STOCK DECREMENT
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================

-- 1. Ajouter la colonne stock_decremented si elle n'existe pas
ALTER TABLE stock_reservations 
ADD COLUMN IF NOT EXISTS stock_decremented BOOLEAN DEFAULT FALSE;

-- 2. Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trigger_decrement_stock_on_finalize ON stock_reservations;
DROP TRIGGER IF EXISTS trigger_decrement_stock_on_insert ON stock_reservations;
DROP TRIGGER IF EXISTS trigger_restore_stock_on_release ON stock_reservations;

-- 3. Fonction pour décrementer le stock sur UPDATE (quand finalized_at est défini)
CREATE OR REPLACE FUNCTION decrement_stock_on_finalize()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement si finalized_at est défini (était NULL, maintenant a une valeur)
  -- Et le stock n'a pas déjà été décrémenté
  IF OLD.finalized_at IS NULL AND NEW.finalized_at IS NOT NULL 
     AND (NEW.stock_decremented IS NULL OR NEW.stock_decremented = false) THEN
    
    IF NEW.variant_id IS NOT NULL THEN
      -- Cas 1: Produit avec variantes - décrementer product_variants.stock
      UPDATE product_variants
      SET stock = GREATEST(0, stock - NEW.qty)
      WHERE id = NEW.variant_id;
    ELSE
      -- Cas 2: Pas de variante - décrementer products.stock directement
      UPDATE products
      SET stock = GREATEST(0, stock - NEW.qty)
      WHERE id = NEW.product_id;
    END IF;
    
    -- Marquer comme décrémenté
    NEW.stock_decremented := true;
    
    RAISE NOTICE 'Stock decremented for product_id %, variant_id %, qty %', 
      NEW.product_id, COALESCE(NEW.variant_id::text, 'NULL'), NEW.qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour décrementer le stock sur INSERT (commandes COD immédiatement finalisées)
CREATE OR REPLACE FUNCTION decrement_stock_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement si finalized_at est défini à l'INSERT (finalisation immédiate COD)
  IF NEW.finalized_at IS NOT NULL 
     AND (NEW.stock_decremented IS NULL OR NEW.stock_decremented = false) THEN
    
    IF NEW.variant_id IS NOT NULL THEN
      -- Cas 1: Produit avec variantes
      UPDATE product_variants
      SET stock = GREATEST(0, stock - NEW.qty)
      WHERE id = NEW.variant_id;
    ELSE
      -- Cas 2: Pas de variante
      UPDATE products
      SET stock = GREATEST(0, stock - NEW.qty)
      WHERE id = NEW.product_id;
    END IF;
    
    -- Marquer comme décrémenté
    NEW.stock_decremented := true;
    
    RAISE NOTICE 'Stock decremented on INSERT for product_id %, variant_id %, qty %', 
      NEW.product_id, COALESCE(NEW.variant_id::text, 'NULL'), NEW.qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour restaurer le stock en cas d'annulation
CREATE OR REPLACE FUNCTION restore_stock_on_release()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement si released_at est défini et le stock avait été décrémenté
  IF OLD.released_at IS NULL AND NEW.released_at IS NOT NULL 
     AND NEW.stock_decremented = true THEN
    
    IF NEW.variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET stock = stock + NEW.qty
      WHERE id = NEW.variant_id;
    ELSE
      UPDATE products
      SET stock = stock + NEW.qty
      WHERE id = NEW.product_id;
    END IF;
    
    RAISE NOTICE 'Stock restored for product_id %, variant_id %, qty %', 
      NEW.product_id, COALESCE(NEW.variant_id::text, 'NULL'), NEW.qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer les triggers
CREATE TRIGGER trigger_decrement_stock_on_finalize
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_finalize();

CREATE TRIGGER trigger_decrement_stock_on_insert
  BEFORE INSERT ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_insert();

CREATE TRIGGER trigger_restore_stock_on_release
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_release();

-- 7. Vérifier que les triggers sont bien créés
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'stock_reservations';

-- ============================================
-- FIN DU SCRIPT
-- ============================================
