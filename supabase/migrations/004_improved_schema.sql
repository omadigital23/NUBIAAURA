-- ===========================
-- NUBIA AURA - IMPROVED SCHEMA
-- ===========================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- ENUMS
-- ===========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_status') THEN
    CREATE TYPE return_status AS ENUM ('pending', 'approved', 'rejected', 'shipped', 'received', 'refunded');
  END IF;
END$$;

-- ===========================
-- USERS
-- ===========================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer', -- 'admin' | 'customer'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ===========================
-- CATEGORIES
-- ===========================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ===========================
-- TAGS
-- ===========================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT
);

-- ===========================
-- PRODUCTS
-- ===========================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  
  -- Fallbacks (displayed if FR/EN columns are empty)
  name TEXT NOT NULL,
  description TEXT,
  material TEXT,
  care TEXT,
  
  -- FR/EN localization
  name_fr TEXT, name_en TEXT,
  description_fr TEXT, description_en TEXT,
  material_fr TEXT, material_en TEXT,
  care_fr TEXT, care_en TEXT,
  
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,             -- UI
  image_url TEXT,         -- historical joins
  rating DECIMAL(2, 1),
  reviews INTEGER,
  category TEXT NOT NULL, -- business key (translated in UI)
  "originalPrice" DECIMAL(10, 2),
  "inStock" BOOLEAN NOT NULL DEFAULT true,
  sizes JSONB,            -- ["S","M","L"]
  colors JSONB,           -- ["Black","Gold"]
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating);
CREATE INDEX IF NOT EXISTS idx_products_reviews ON public.products(reviews);
CREATE INDEX IF NOT EXISTS idx_products_instock_rating ON public.products("inStock", rating DESC);

-- Sync image_url -> image if image is empty
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
-- PRODUCT CATEGORIES (Many-to-Many)
-- ===========================
CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- ===========================
-- PRODUCT TAGS (Many-to-Many)
-- ===========================
CREATE TABLE IF NOT EXISTS public.product_tags (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- ===========================
-- PRODUCT IMAGES (Gallery)
-- ===========================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- ===========================
-- PRODUCT VARIANTS (Inventory)
-- ===========================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  size TEXT,
  color TEXT,
  price DECIMAL(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- ===========================
-- CARTS (Persistent Cart)
-- ===========================
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

-- ===========================
-- ADDRESSES (Address Book)
-- ===========================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- ===========================
-- ORDERS & ORDER ITEMS
-- ===========================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  total DECIMAL(10, 2) NOT NULL,
  shipping_address JSONB,
  shipping_method TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  customer_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ===========================
-- SHIPMENTS (Shipping & Tracking)
-- ===========================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT DEFAULT 'created',
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);

-- ===========================
-- RETURNS
-- ===========================
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  return_number TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  comments TEXT,
  status return_status NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);

-- ===========================
-- CUSTOM ORDERS (Custom Made)
-- ===========================
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL,
  measurements JSONB,
  preferences JSONB,
  budget DECIMAL(10, 2),
  reference_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_orders_user_id ON public.custom_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);

-- ===========================
-- PRODUCT REVIEWS
-- ===========================
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

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);

-- ===========================
-- WISHLIST
-- ===========================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (wishlist_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);

-- ===========================
-- NEWSLETTER SUBSCRIPTIONS
-- ===========================
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  locale TEXT CHECK (locale IN ('fr', 'en')) DEFAULT 'fr',
  subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ===========================
-- COUPONS
-- ===========================
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

CREATE TABLE IF NOT EXISTS public.order_coupons (
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  PRIMARY KEY (order_id, coupon_id)
);

-- ===========================
-- STOCK RESERVATIONS
-- ===========================
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

CREATE INDEX IF NOT EXISTS idx_stock_res_order ON public.stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_product ON public.stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_variant ON public.stock_reservations(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_expires_at ON public.stock_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_res_finalized ON public.stock_reservations(finalized_at);
CREATE INDEX IF NOT EXISTS idx_stock_res_released ON public.stock_reservations(released_at);

-- ===========================
-- RLS (Row Level Security)
-- ===========================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- ===========================
-- RLS POLICIES
-- ===========================

-- USERS: Owner access only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='users_select_self') THEN
    CREATE POLICY users_select_self ON public.users FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='users_update_self') THEN
    CREATE POLICY users_update_self ON public.users FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- PRODUCTS & References: Public read access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='products_public_select') THEN
    CREATE POLICY products_public_select ON public.products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_images' AND policyname='product_images_public_select') THEN
    CREATE POLICY product_images_public_select ON public.product_images FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_variants' AND policyname='product_variants_public_select') THEN
    CREATE POLICY product_variants_public_select ON public.product_variants FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='categories_public_select') THEN
    CREATE POLICY categories_public_select ON public.categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_categories' AND policyname='product_categories_public_select') THEN
    CREATE POLICY product_categories_public_select ON public.product_categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tags' AND policyname='tags_public_select') THEN
    CREATE POLICY tags_public_select ON public.tags FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_tags' AND policyname='product_tags_public_select') THEN
    CREATE POLICY product_tags_public_select ON public.product_tags FOR SELECT USING (true);
  END IF;
END $$;

-- CART: Owner access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='carts' AND policyname='carts_owner_rw') THEN
    CREATE POLICY carts_owner_rw ON public.carts
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cart_items' AND policyname='cart_items_owner_rw') THEN
    CREATE POLICY cart_items_owner_rw ON public.cart_items
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
      ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
      );
  END IF;
END $$;

-- ADDRESSES: Owner access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='addresses' AND policyname='addresses_owner_rw') THEN
    CREATE POLICY addresses_owner_rw ON public.addresses
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ORDERS / ITEMS / SHIPMENTS: Owner access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_owner_rw') THEN
    CREATE POLICY orders_owner_rw ON public.orders
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='order_items_owner_r') THEN
    CREATE POLICY order_items_owner_r ON public.order_items
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shipments' AND policyname='shipments_owner_r') THEN
    CREATE POLICY shipments_owner_r ON public.shipments
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = shipments.order_id AND o.user_id = auth.uid())
      );
  END IF;
END $$;

-- RETURNS: Owner access (delete only when pending)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='returns' AND policyname='returns_owner_r') THEN
    CREATE POLICY returns_owner_r ON public.returns FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='returns' AND policyname='returns_owner_cu') THEN
    CREATE POLICY returns_owner_cu ON public.returns FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='returns' AND policyname='returns_owner_u') THEN
    CREATE POLICY returns_owner_u ON public.returns FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='returns' AND policyname='returns_owner_delete_pending') THEN
    CREATE POLICY returns_owner_delete_pending ON public.returns FOR DELETE USING (user_id = auth.uid() AND status = 'pending');
  END IF;
END $$;

-- CUSTOM ORDERS: Public insert, owner read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='custom_orders' AND policyname='custom_orders_insert_public') THEN
    CREATE POLICY custom_orders_insert_public ON public.custom_orders FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='custom_orders' AND policyname='custom_orders_owner_r') THEN
    CREATE POLICY custom_orders_owner_r ON public.custom_orders FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- REVIEWS: Owner access (one review per product)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_reviews' AND policyname='product_reviews_owner_rw') THEN
    CREATE POLICY product_reviews_owner_rw ON public.product_reviews
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- WISHLIST: Owner access
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

-- NEWSLETTER: Public insert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_subscriptions' AND policyname='newsletter_insert_public') THEN
    CREATE POLICY newsletter_insert_public ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- COUPONS: Public read (+ admin via service role)
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

-- STOCK RESERVATIONS: Service role only (not accessible by users)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_reservations' AND policyname='stock_reservations_service_only') THEN
    CREATE POLICY stock_reservations_service_only ON public.stock_reservations
      FOR ALL USING (false) WITH CHECK (false);
  END IF;
END $$;

-- ===========================
-- NOTES
-- ===========================
-- IMPORTANT: Server routes (webhooks, admin operations) use the Service Role Key and bypass RLS.
-- The schema is designed to be incrementally deployable with IF NOT EXISTS checks.