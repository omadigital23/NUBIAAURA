-- 007_create_promo_codes.sql
-- Table promo_codes pour les codes de réduction

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value int NOT NULL,
  min_order_amount int,
  max_discount int,
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses int,
  current_uses int DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes (is_active);

-- RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Policy: lecture publique des codes actifs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promo_codes' AND policyname='promo_codes_public_select') THEN
    CREATE POLICY promo_codes_public_select ON public.promo_codes FOR SELECT USING (true);
  END IF;
END $$;

-- Données exemple
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, min_order_amount, is_active) VALUES
('BIENVENUE10', 'Réduction de bienvenue 10%', 'percentage', 10, 20000, true),
('NUBIA20', 'Code fidélité 20%', 'percentage', 20, 50000, true),
('LIVRAISON', 'Livraison offerte (-5000 FCFA)', 'fixed', 5000, 30000, true),
('NOEL2024', 'Offre spéciale Noël 15%', 'percentage', 15, 0, true)
ON CONFLICT (code) DO NOTHING;
