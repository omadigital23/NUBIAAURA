-- Migration: Add country field to custom_orders table
-- Description: Adds country field to custom_orders for location-based delivery calculations
-- Created: 2025-01-24

-- Add country column to custom_orders table
ALTER TABLE custom_orders
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add comment for documentation
COMMENT ON COLUMN custom_orders.country IS 
  'Pays de livraison pour la commande sur-mesure (utilisé pour calculer les délais de livraison et de retour)';

-- Add return_deadline column to custom_orders table (same as orders)
ALTER TABLE custom_orders
ADD COLUMN IF NOT EXISTS return_deadline TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN custom_orders.return_deadline IS 
  'Date limite pour demander un retour (3 jours Sénégal, 14 jours International)';

-- Function to calculate return deadline for custom orders
CREATE OR REPLACE FUNCTION calculate_custom_order_return_deadline()
RETURNS TRIGGER AS $$
DECLARE
  normalized_country TEXT;
  is_senegal BOOLEAN;
  days_to_add INTEGER;
BEGIN
  -- Only calculate when delivered_at is being set (was NULL, now has a value)
  IF OLD.delivered_at IS NULL AND NEW.delivered_at IS NOT NULL THEN
    -- Normalize country
    normalized_country := LOWER(TRIM(COALESCE(NEW.country, '')));
    
    -- Check if country is Senegal
    is_senegal := normalized_country IN ('senegal', 'sénégal', 'sn', 'sen');
    
    -- Determine days to add
    IF is_senegal THEN
      days_to_add := 3;  -- Sénégal: 3 jours
    ELSE
      days_to_add := 14; -- International: 14 jours
    END IF;
    
    -- Calculate return deadline
    NEW.return_deadline := NEW.delivered_at + (days_to_add || ' days')::INTERVAL;
    
    -- Log for debugging
    RAISE NOTICE 'Custom order return deadline calculated: country=%, days=%, deadline=%', 
      normalized_country, days_to_add, NEW.return_deadline;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for custom orders
DROP TRIGGER IF EXISTS trigger_calculate_custom_order_return_deadline ON custom_orders;

CREATE TRIGGER trigger_calculate_custom_order_return_deadline
  BEFORE UPDATE ON custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_custom_order_return_deadline();

-- Add comments
COMMENT ON FUNCTION calculate_custom_order_return_deadline() IS 
  'Calcule automatiquement la date limite de retour pour les commandes sur-mesure quand delivered_at est défini';

COMMENT ON TRIGGER trigger_calculate_custom_order_return_deadline ON custom_orders IS 
  'Calcule return_deadline automatiquement pour les commandes sur-mesure';

-- Backfill existing delivered custom orders
UPDATE custom_orders
SET return_deadline = 
  CASE 
    WHEN LOWER(TRIM(COALESCE(country, ''))) IN ('senegal', 'sénégal', 'sn', 'sen')
    THEN delivered_at + INTERVAL '3 days'
    ELSE delivered_at + INTERVAL '14 days'
  END
WHERE delivered_at IS NOT NULL 
  AND return_deadline IS NULL;
