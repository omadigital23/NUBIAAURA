-- Migration: Add return_deadline column and automatic calculation
-- Description: Adds return_deadline to orders table with automatic calculation based on country
-- Created: 2025-01-24

-- Add return_deadline column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS return_deadline TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN orders.return_deadline IS 
  'Date limite pour demander un retour (3 jours Sénégal, 14 jours International). Calculée automatiquement à la livraison.';

-- Function to calculate return deadline automatically when order is delivered
CREATE OR REPLACE FUNCTION calculate_return_deadline()
RETURNS TRIGGER AS $$
DECLARE
  country TEXT;
  is_senegal BOOLEAN;
  days_to_add INTEGER;
BEGIN
  -- Only calculate when delivered_at is being set (was NULL, now has a value)
  IF OLD.delivered_at IS NULL AND NEW.delivered_at IS NOT NULL THEN
    -- Extract country from shipping_address JSON
    country := LOWER(TRIM(COALESCE(NEW.shipping_address->>'country', '')));
    
    -- Check if country is Senegal (multiple variations)
    is_senegal := country IN ('senegal', 'sénégal', 'sn', 'sen');
    
    -- Determine days to add based on country
    IF is_senegal THEN
      days_to_add := 3;  -- Sénégal: 3 jours
    ELSE
      days_to_add := 14; -- International: 14 jours
    END IF;
    
    -- Calculate return deadline
    NEW.return_deadline := NEW.delivered_at + (days_to_add || ' days')::INTERVAL;
    
    -- Log for debugging
    RAISE NOTICE 'Return deadline calculated for order %: country=%, days=%, deadline=%', 
      NEW.id, country, days_to_add, NEW.return_deadline;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate return_deadline
DROP TRIGGER IF EXISTS trigger_calculate_return_deadline ON orders;

CREATE TRIGGER trigger_calculate_return_deadline
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_return_deadline();

-- Add comment on function
COMMENT ON FUNCTION calculate_return_deadline() IS 
  'Calcule automatiquement la date limite de retour quand une commande est livrée (delivered_at défini). 3 jours pour Sénégal, 14 jours pour International.';

COMMENT ON TRIGGER trigger_calculate_return_deadline ON orders IS 
  'Calcule return_deadline automatiquement quand delivered_at est défini';

-- Update existing delivered orders to set return_deadline (backfill)
UPDATE orders
SET return_deadline = 
  CASE 
    WHEN LOWER(TRIM(COALESCE(shipping_address->>'country', ''))) IN ('senegal', 'sénégal', 'sn', 'sen')
    THEN delivered_at + INTERVAL '3 days'
    ELSE delivered_at + INTERVAL '14 days'
  END
WHERE delivered_at IS NOT NULL 
  AND return_deadline IS NULL;
