-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  shipping_method TEXT,
  shipping_address JSONB,
  
  -- Delivery tracking columns
  delivery_duration_days INTEGER DEFAULT 3,
  shipped_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  carrier TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status_date ON delivery_tracking(status_date DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for delivery_tracking
CREATE POLICY "Users can view their order delivery tracking" ON delivery_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at_trigger
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- Create views for analytics
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
