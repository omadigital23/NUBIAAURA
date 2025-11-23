-- Add delivery tracking columns to custom_orders table
ALTER TABLE custom_orders
ADD COLUMN IF NOT EXISTS delivery_duration_days INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS finalization_notified_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for custom_orders delivery tracking
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_estimated_delivery ON custom_orders(estimated_delivery_date);
CREATE INDEX IF NOT EXISTS idx_custom_orders_shipped_at ON custom_orders(shipped_at DESC);
