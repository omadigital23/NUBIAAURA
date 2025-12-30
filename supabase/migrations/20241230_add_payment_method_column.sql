-- Migration: Add payment_method column to orders table
-- Run this in Supabase SQL Editor

-- Add payment_method column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN orders.payment_method IS 'Payment gateway used: paytech, cod';

-- Optional: Set default value for existing orders
UPDATE orders 
SET payment_method = 'cod' 
WHERE payment_method IS NULL;
