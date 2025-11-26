-- Migration: Fix stock decrement trigger to work with products.stock
-- Description: The previous trigger only updated product_variants.stock, but our products use products.stock
-- Created: 2025-11-26

-- Drop ALL existing triggers that depend on the function
DROP TRIGGER IF EXISTS trigger_decrement_stock_on_finalize ON stock_reservations;
DROP TRIGGER IF EXISTS trg_decrement_stock_on_finalize ON stock_reservations;

-- Drop the old function with CASCADE to remove any remaining dependencies
DROP FUNCTION IF EXISTS decrement_stock_on_finalize() CASCADE;

-- New function to decrement stock in the products table
CREATE OR REPLACE FUNCTION decrement_stock_on_finalize()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Only proceed if finalized_at is being set (was NULL, now has a value)
  IF OLD.finalized_at IS NULL AND NEW.finalized_at IS NOT NULL THEN
    
    -- Get current stock from products table
    SELECT stock INTO current_stock
    FROM products
    WHERE id = NEW.product_id;
    
    -- Check if we have enough stock
    IF current_stock IS NULL OR current_stock < NEW.qty THEN
      RAISE EXCEPTION 'Insufficient stock for product_id %. Required: %, Available: %', 
        NEW.product_id, 
        NEW.qty,
        COALESCE(current_stock, 0);
    END IF;
    
    -- Decrement the stock in products table
    UPDATE products
    SET stock = stock - NEW.qty,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Mark that stock has been decremented to avoid double-decrement
    NEW.stock_decremented = true;
    
    -- Log the stock decrement for debugging
    RAISE NOTICE 'Stock decremented for product_id %: quantity % (new stock: %)', 
      NEW.product_id, 
      NEW.qty,
      current_stock - NEW.qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on stock_reservations table
CREATE TRIGGER trigger_decrement_stock_on_finalize
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_finalize();

-- Add comment for documentation
COMMENT ON FUNCTION decrement_stock_on_finalize() IS 
  'Automatically decrements products.stock when a stock reservation is finalized (finalized_at is set)';

COMMENT ON TRIGGER trigger_decrement_stock_on_finalize ON stock_reservations IS 
  'Decrements stock in products table when finalized_at is set on a reservation';
