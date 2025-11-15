-- Fix RLS policies for orders table to allow admin access

-- Admin policies (bypass RLS for service role)
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE
  USING (true);

-- Also allow admins to insert
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
CREATE POLICY "Admins can insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Admin policies for delivery_tracking
DROP POLICY IF EXISTS "Admins can view all delivery tracking" ON public.delivery_tracking;
CREATE POLICY "Admins can view all delivery tracking" ON public.delivery_tracking
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert delivery tracking" ON public.delivery_tracking;
CREATE POLICY "Admins can insert delivery tracking" ON public.delivery_tracking
  FOR INSERT
  WITH CHECK (true);

SELECT 'RLS policies updated for admin access' as status;
