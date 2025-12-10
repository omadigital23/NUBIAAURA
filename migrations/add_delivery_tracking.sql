-- Add delivery tracking columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_duration_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT;

-- Create delivery_tracking table for history
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status_date ON delivery_tracking(status_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery_date);

-- Enable RLS
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_tracking
CREATE POLICY "Users can view their order delivery tracking" ON delivery_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Create a view for delivery countdown
CREATE OR REPLACE VIEW order_delivery_countdown AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.shipped_at,
  o.estimated_delivery_date,
  o.delivered_at,
  o.delivery_duration_days,
  CASE 
    WHEN o.status = 'delivered' THEN 0
    WHEN o.shipped_at IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM (o.estimated_delivery_date - NOW()))::INTEGER
  END as days_remaining,
  CASE 
    WHEN o.status = 'delivered' THEN 'delivered'
    WHEN o.shipped_at IS NULL THEN 'pending'
    WHEN EXTRACT(DAY FROM (o.estimated_delivery_date - NOW())) <= 0 THEN 'overdue'
    ELSE 'in_transit'
  END as delivery_status
FROM orders o;

-- Create a view for return eligibility
CREATE OR REPLACE VIEW return_eligibility AS
SELECT 
  o.id as order_id,
  o.order_number,
  o.delivered_at,
  EXTRACT(HOUR FROM (NOW() - o.delivered_at))::INTEGER as hours_since_delivery,
  CASE 
    WHEN o.delivered_at IS NULL THEN false
    WHEN EXTRACT(HOUR FROM (NOW() - o.delivered_at)) < 72 THEN true
    ELSE false
  END as is_returnable,
  CASE 
    WHEN o.delivered_at IS NULL THEN NULL
    ELSE (o.delivered_at + INTERVAL '72 hours')
  END as return_deadline
FROM orders o
WHERE o.status = 'delivered';
