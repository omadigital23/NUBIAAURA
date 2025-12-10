-- ===========================
-- FIX TABLES ET RLS POUR FORMULAIRES
-- ===========================

-- 1. CRÉER OU RECRÉER LA TABLE CONTACT_SUBMISSIONS
-- ===========================

DROP TABLE IF EXISTS public.contact_submissions CASCADE;

CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour contact_submissions
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Activer RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut insérer (pour le formulaire public)
DROP POLICY IF EXISTS contact_submissions_insert_public ON public.contact_submissions;
CREATE POLICY contact_submissions_insert_public 
  ON public.contact_submissions 
  FOR INSERT 
  WITH CHECK (true);

-- Politique: Lecture pour tous (temporaire pour debug)
DROP POLICY IF EXISTS contact_submissions_select_all ON public.contact_submissions;
CREATE POLICY contact_submissions_select_all 
  ON public.contact_submissions 
  FOR SELECT 
  USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON public.contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();


-- 2. VÉRIFIER ET CORRIGER LA TABLE CUSTOM_ORDERS
-- ===========================

-- Vérifier si la table existe, sinon la créer
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL,
  measurements TEXT NOT NULL,
  preferences TEXT NOT NULL,
  budget NUMERIC(10, 2),
  reference_image_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour custom_orders
CREATE INDEX IF NOT EXISTS idx_custom_orders_user_id ON public.custom_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_email ON public.custom_orders(email);

-- Activer RLS
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut insérer (pour le formulaire public)
DROP POLICY IF EXISTS custom_orders_insert_public ON public.custom_orders;
CREATE POLICY custom_orders_insert_public 
  ON public.custom_orders 
  FOR INSERT 
  WITH CHECK (true);

-- Politique: Lecture pour tous (temporaire pour debug)
DROP POLICY IF EXISTS custom_orders_select_all ON public.custom_orders;
CREATE POLICY custom_orders_select_all 
  ON public.custom_orders 
  FOR SELECT 
  USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_custom_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_orders_updated_at ON public.custom_orders;
CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON public.custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_orders_updated_at();


-- 3. VÉRIFIER LA TABLE NEWSLETTER_SUBSCRIPTIONS
-- ===========================

-- S'assurer que la table existe
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  locale TEXT DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(email);

-- Activer RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut insérer
DROP POLICY IF EXISTS newsletter_insert_public ON public.newsletter_subscriptions;
CREATE POLICY newsletter_insert_public 
  ON public.newsletter_subscriptions 
  FOR INSERT 
  WITH CHECK (true);

-- Politique: Lecture pour tous (temporaire pour debug)
DROP POLICY IF EXISTS newsletter_select_all ON public.newsletter_subscriptions;
CREATE POLICY newsletter_select_all 
  ON public.newsletter_subscriptions 
  FOR SELECT 
  USING (true);


-- ===========================
-- VÉRIFICATION
-- ===========================

-- Afficher les tables créées
SELECT 
  tablename, 
  schemaname 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('contact_submissions', 'custom_orders', 'newsletter_subscriptions')
ORDER BY tablename;

-- Afficher les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('contact_submissions', 'custom_orders', 'newsletter_subscriptions')
ORDER BY tablename, policyname;
