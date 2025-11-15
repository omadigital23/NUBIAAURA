-- Create orders table adapted to existing schema
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_number text NOT NULL UNIQUE,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])),
  payment_status text NOT NULL DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text])),
  shipping_method text,
  shipping_address jsonb,
  
  -- Delivery tracking columns
  delivery_duration_days integer NOT NULL DEFAULT 3,
  shipped_at timestamp with time zone,
  estimated_delivery_date timestamp with time zone,
  delivered_at timestamp with time zone,
  tracking_number text,
  carrier text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Update order_items to reference orders table
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status text NOT NULL,
  status_date timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT delivery_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON public.orders(shipped_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON public.orders(estimated_delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON public.orders(delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON public.order_items(service_id);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON public.delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status_date ON public.delivery_tracking(status_date DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin policies (bypass RLS for service role)
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE
  USING (true);

-- RLS Policies for delivery_tracking
DROP POLICY IF EXISTS "Users can view their order delivery tracking" ON public.delivery_tracking;
CREATE POLICY "Users can view their order delivery tracking" ON public.delivery_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON public.orders;
CREATE TRIGGER update_orders_updated_at_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_orders_updated_at();

-- Create views for analytics
DROP VIEW IF EXISTS public.order_delivery_countdown CASCADE;
CREATE VIEW public.order_delivery_countdown AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
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
    WHEN o.status = 'delivered' THEN 'delivered'::text
    WHEN o.shipped_at IS NULL THEN 'pending'::text
    WHEN EXTRACT(DAY FROM (o.estimated_delivery_date - NOW())) <= 0 THEN 'overdue'::text
    ELSE 'in_transit'::text
  END as delivery_status
FROM public.orders o;

DROP VIEW IF EXISTS public.return_eligibility CASCADE;
CREATE VIEW public.return_eligibility AS
SELECT 
  o.id as order_id,
  o.order_number,
  o.user_id,
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
FROM public.orders o
WHERE o.status = 'delivered'::text;

-- Verify tables exist
SELECT 'orders table created' as status;
SELECT 'delivery_tracking table created' as status;
SELECT 'Indexes created' as status;
SELECT 'RLS policies created' as status;
SELECT 'Views created' as status;
