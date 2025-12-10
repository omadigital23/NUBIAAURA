-- Migration: Add trigger to decrement stock when reservation is finalized
-- Description: Automatically decrements product_variants.stock when stock_reservations.finalized_at is set
-- Created: 2025-01-24

-- Function to decrement stock when reservation is finalized
CREATE OR REPLACE FUNCTION decrement_stock_on_finalize()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if finalized_at is being set (was NULL, now has a value)
  IF OLD.finalized_at IS NULL AND NEW.finalized_at IS NOT NULL THEN
    -- Decrement the stock in product_variants
    UPDATE product_variants
    SET stock = stock - NEW.quantity
    WHERE product_id = NEW.product_id
      AND stock >= NEW.quantity; -- Only decrement if enough stock available
    
    -- Check if the update affected any rows
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product_id % (variant). Required: %, Available: %', 
        NEW.product_id, 
        NEW.quantity,
        (SELECT stock FROM product_variants WHERE product_id = NEW.product_id);
    END IF;
    
    -- Log the stock decrement for debugging
    RAISE NOTICE 'Stock decremented for product_id %: quantity %', NEW.product_id, NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on stock_reservations table
DROP TRIGGER IF EXISTS trigger_decrement_stock_on_finalize ON stock_reservations;

CREATE TRIGGER trigger_decrement_stock_on_finalize
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_finalize();

-- Add comment for documentation
COMMENT ON FUNCTION decrement_stock_on_finalize() IS 
  'Automatically decrements product_variants.stock when a stock reservation is finalized (finalized_at is set)';

COMMENT ON TRIGGER trigger_decrement_stock_on_finalize ON stock_reservations IS 
  'Decrements stock in product_variants when finalized_at is set on a reservation';
