-- Stock reservations table for pending and finalized orders
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  finalized_at TIMESTAMP WITH TIME ZONE NULL,
  released_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_res_order ON public.stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_product ON public.stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_variant ON public.stock_reservations(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_expires_at ON public.stock_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_res_finalized ON public.stock_reservations(finalized_at);
CREATE INDEX IF NOT EXISTS idx_stock_res_released ON public.stock_reservations(released_at);

-- Enable RLS
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- Policies (service role bypasses RLS). Users should not directly access reservations.
DROP POLICY IF EXISTS "Reservations are not publicly readable" ON public.stock_reservations;
CREATE POLICY "Reservations are not publicly readable" ON public.stock_reservations
  FOR SELECT USING (false);

DROP POLICY IF EXISTS "Reservations cannot be inserted by anon" ON public.stock_reservations;
CREATE POLICY "Reservations cannot be inserted by anon" ON public.stock_reservations
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Reservations cannot be updated by anon" ON public.stock_reservations;
CREATE POLICY "Reservations cannot be updated by anon" ON public.stock_reservations
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Reservations cannot be deleted by anon" ON public.stock_reservations;
CREATE POLICY "Reservations cannot be deleted by anon" ON public.stock_reservations
  FOR DELETE USING (false);
