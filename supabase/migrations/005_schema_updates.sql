-- ===========================
-- NUBIA AURA - SCHEMA UPDATES
-- ===========================

-- This migration updates the existing schema to match the improved version
-- It should be run after the initial schema is deployed

-- ===========================
-- UPDATE EXISTING TABLES
-- ===========================

-- Update products table to use DECIMAL for prices
ALTER TABLE public.products 
ALTER COLUMN price TYPE DECIMAL(10, 2);

ALTER TABLE public.products 
ALTER COLUMN "originalPrice" TYPE DECIMAL(10, 2);

-- Update orders table to use DECIMAL for totals
ALTER TABLE public.orders 
ALTER COLUMN total TYPE DECIMAL(10, 2);

-- Update order_items table to use DECIMAL for prices
ALTER TABLE public.order_items 
ALTER COLUMN price TYPE DECIMAL(10, 2);

-- Update custom_orders table to use DECIMAL for budget
ALTER TABLE public.custom_orders 
ALTER COLUMN budget TYPE DECIMAL(10, 2);

-- Update returns table to add refund_amount column
ALTER TABLE public.returns 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);

-- Update custom_orders table to add reference_image_url column
ALTER TABLE public.custom_orders 
ADD COLUMN IF NOT EXISTS reference_image_url TEXT;

-- ===========================
-- ADD MISSING TABLES
-- ===========================

-- Create categories table if not exists
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create product_categories table if not exists
CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Create tags table if not exists
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT
);

-- Create product_tags table if not exists
CREATE TABLE IF NOT EXISTS public.product_tags (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Create product_reviews table if not exists
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

-- Create wishlists table if not exists
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Create wishlist_items table if not exists
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (wishlist_id, product_id)
);

-- Create newsletter_subscriptions table if not exists
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  locale TEXT CHECK (locale IN ('fr', 'en')) DEFAULT 'fr',
  subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create coupons table if not exists
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create order_coupons table if not exists
CREATE TABLE IF NOT EXISTS public.order_coupons (
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  PRIMARY KEY (order_id, coupon_id)
);

-- ===========================
-- ADD MISSING INDEXES
-- ===========================

-- Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON public.product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON public.product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON public.product_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(active);
CREATE INDEX IF NOT EXISTS idx_order_coupons_order_id ON public.order_coupons(order_id);
CREATE INDEX IF NOT EXISTS idx_order_coupons_coupon_id ON public.order_coupons(coupon_id);

-- Add missing indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_user_id ON public.custom_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);

-- ===========================
-- UPDATE RLS POLICIES
-- ===========================

-- Enable RLS for new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_coupons ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for new tables
-- Categories: Public read access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='categories_public_select') THEN
    CREATE POLICY categories_public_select ON public.categories FOR SELECT USING (true);
  END IF;
END $$;

-- Product categories: Public read access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_categories' AND policyname='product_categories_public_select') THEN
    CREATE POLICY product_categories_public_select ON public.product_categories FOR SELECT USING (true);
  END IF;
END $$;

-- Tags: Public read access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tags' AND policyname='tags_public_select') THEN
    CREATE POLICY tags_public_select ON public.tags FOR SELECT USING (true);
  END IF;
END $$;

-- Product tags: Public read access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_tags' AND policyname='product_tags_public_select') THEN
    CREATE POLICY product_tags_public_select ON public.product_tags FOR SELECT USING (true);
  END IF;
END $$;

-- Product reviews: Owner access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_reviews' AND policyname='product_reviews_owner_rw') THEN
    CREATE POLICY product_reviews_owner_rw ON public.product_reviews
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Wishlists: Owner access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlists' AND policyname='wishlists_owner_rw') THEN
    CREATE POLICY wishlists_owner_rw ON public.wishlists
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlist_items' AND policyname='wishlist_items_owner_rw') THEN
    CREATE POLICY wishlist_items_owner_rw ON public.wishlist_items
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_items.wishlist_id AND w.user_id = auth.uid())
      ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_items.wishlist_id AND w.user_id = auth.uid())
      );
  END IF;
END $$;

-- Newsletter: Public insert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_subscriptions' AND policyname='newsletter_insert_public') THEN
    CREATE POLICY newsletter_insert_public ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Coupons: Public read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='coupons_public_select') THEN
    CREATE POLICY coupons_public_select ON public.coupons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_coupons' AND policyname='order_coupons_owner_r') THEN
    CREATE POLICY order_coupons_owner_r ON public.order_coupons
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_coupons.order_id AND o.user_id = auth.uid())
      );
  END IF;
END $$;

-- ===========================
-- TRIGGERS
-- ===========================

-- Ensure the products sync image trigger exists
CREATE OR REPLACE FUNCTION public.products_sync_image()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.image IS NULL OR NEW.image = '') AND NEW.image_url IS NOT NULL THEN
    NEW.image := NEW.image_url;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_sync_image ON public.products;
CREATE TRIGGER trg_products_sync_image
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE PROCEDURE public.products_sync_image();

-- ===========================
-- NOTES
-- ===========================
-- This migration updates the existing schema to include all improvements
-- It is designed to be safe to run multiple times
-- No data will be lost during this migration