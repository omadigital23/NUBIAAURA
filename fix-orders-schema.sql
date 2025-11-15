-- Fix: Add missing delivery columns to orders table

-- Check if columns exist, if not add them
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_duration_days integer NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS carrier text;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('delivery_duration_days', 'shipped_at', 'estimated_delivery_date', 'delivered_at', 'tracking_number', 'carrier')
ORDER BY column_name;

SELECT 'Orders table schema updated successfully' as status;
