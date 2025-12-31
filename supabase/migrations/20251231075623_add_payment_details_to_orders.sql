-- Add payment_details column to orders table
-- This column stores payment gateway information like tokens, receipt URLs, etc.

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_details IS 'Stores payment gateway details including token, receipt_url, mode, and transaction info';
