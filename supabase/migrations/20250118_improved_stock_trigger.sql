-- Migration: Improved stock decrement trigger for both products and variants
-- Description: Decrements product_variants.stock OR products.stock based on variant_id
-- Created: 2025-01-18

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_decrement_stock_on_finalize ON stock_reservations;

-- Improved function to handle both cases
CREATE OR REPLACE FUNCTION decrement_stock_on_finalize()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if finalized_at is being set (was NULL, now has a value)
  -- And stock hasn't already been decremented
  IF OLD.finalized_at IS NULL AND NEW.finalized_at IS NOT NULL 
     AND (NEW.stock_decremented IS NULL OR NEW.stock_decremented = false) THEN
    
    IF NEW.variant_id IS NOT NULL THEN
      -- Case 1: Product has variants - decrement product_variants.stock
      UPDATE product_variants
      SET stock = stock - NEW.qty
      WHERE id = NEW.variant_id
        AND stock >= NEW.qty;
      
      IF NOT FOUND THEN
        RAISE WARNING 'Insufficient stock for variant_id %: Required %, checking product stock as fallback', 
          NEW.variant_id, NEW.qty;
        -- Fallback: try to decrement any variant of this product
        UPDATE product_variants
        SET stock = stock - NEW.qty
        WHERE product_id = NEW.product_id
          AND stock >= NEW.qty
        LIMIT 1;
      END IF;
      
    ELSE
      -- Case 2: No variant - decrement products.stock directly
      UPDATE products
      SET stock = stock - NEW.qty
      WHERE id = NEW.product_id
        AND stock >= NEW.qty;
      
      IF NOT FOUND THEN
        RAISE WARNING 'Insufficient stock for product_id %: Required %', 
          NEW.product_id, NEW.qty;
      END IF;
    END IF;
    
    -- Mark as decremented to prevent double decrement
    NEW.stock_decremented := true;
    
    RAISE NOTICE 'Stock decremented for product_id %, variant_id %: quantity %', 
      NEW.product_id, COALESCE(NEW.variant_id::text, 'NULL'), NEW.qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on stock_reservations table
CREATE TRIGGER trigger_decrement_stock_on_finalize
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_finalize();

-- Also handle INSERT with finalized_at already set (COD orders)
CREATE OR REPLACE FUNCTION decrement_stock_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if finalized_at is set on INSERT (immediate finalization like COD)
  IF NEW.finalized_at IS NOT NULL 
     AND (NEW.stock_decremented IS NULL OR NEW.stock_decremented = false) THEN
    
    IF NEW.variant_id IS NOT NULL THEN
      -- Case 1: Product has variants
      UPDATE product_variants
      SET stock = stock - NEW.qty
      WHERE id = NEW.variant_id
        AND stock >= NEW.qty;
      
      IF NOT FOUND THEN
        -- Fallback: try any variant of this product
        UPDATE product_variants
        SET stock = stock - NEW.qty
        WHERE product_id = NEW.product_id
          AND stock >= NEW.qty
        LIMIT 1;
      END IF;
    ELSE
      -- Case 2: No variant - decrement products.stock
      UPDATE products
      SET stock = stock - NEW.qty
      WHERE id = NEW.product_id
        AND stock >= NEW.qty;
    END IF;
    
    -- Mark as decremented
    NEW.stock_decremented := true;
    
    RAISE NOTICE 'Stock decremented on INSERT for product_id %, variant_id %: quantity %', 
      NEW.product_id, COALESCE(NEW.variant_id::text, 'NULL'), NEW.qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT (COD orders that finalize immediately)
DROP TRIGGER IF EXISTS trigger_decrement_stock_on_insert ON stock_reservations;
CREATE TRIGGER trigger_decrement_stock_on_insert
  BEFORE INSERT ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_insert();

-- Function to restore stock when reservation is released (order cancelled)
CREATE OR REPLACE FUNCTION restore_stock_on_release()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if released_at is being set and stock was previously decremented
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
    
    RAISE NOTICE 'Stock restored for product_id %, variant_id %: quantity %', 
      NEW.product_id, COALESCE(NEW.variant_id::text, 'NULL'), NEW.qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for releasing stock
DROP TRIGGER IF EXISTS trigger_restore_stock_on_release ON stock_reservations;
CREATE TRIGGER trigger_restore_stock_on_release
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_release();

-- Comments
COMMENT ON FUNCTION decrement_stock_on_finalize() IS 
  'Decrements stock when reservation is finalized. Handles both product_variants and products table.';

COMMENT ON FUNCTION decrement_stock_on_insert() IS 
  'Decrements stock when reservation is created with finalized_at already set (COD orders).';

COMMENT ON FUNCTION restore_stock_on_release() IS 
  'Restores stock when reservation is released (order cancelled).';
