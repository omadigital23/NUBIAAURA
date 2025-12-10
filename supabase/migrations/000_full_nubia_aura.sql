-- 000_full_nubia_aura.sql

create extension if not exists "uuid-ossp";

-- ===========================
-- ENUMS (création si absent)
-- ===========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('pending','processing','shipped','delivered','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending','completed','failed','refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'return_status') then
    create type return_status as enum ('pending','approved','rejected','shipped','received','refunded');
  end if;
end$$;

-- ===========================
-- USERS & AUTH (profil + rôle)
-- ===========================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  phone text,
  avatar_url text,
  role text not null default 'customer', -- 'admin' | 'customer' (simple)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_role on public.users (role);

-- ===========================
-- PRODUCTS (FR/EN prêt)
-- ===========================
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,

  -- Fallbacks (affichés si colonnes FR/EN vides)
  name text not null,
  description text,
  material text,
  care text,

  -- FR/EN
  name_fr text, name_en text,
  description_fr text, description_en text,
  material_fr text, material_en text,
  care_fr text, care_en text,

  price int not null,
  image text,             -- UI
  image_url text,         -- jointures historiques
  rating int,
  reviews int,
  category text not null, -- clé métier (traduite côté UI)
  "originalPrice" int,
  "inStock" boolean not null default true,
  sizes jsonb,            -- ["S","M","L"]
  colors jsonb,           -- ["Noir","Or"]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_slug on public.products (slug);
create index if not exists idx_products_category on public.products (category);
-- Performance indexes for homepage/featured queries
create index if not exists idx_products_rating on public.products (rating);
create index if not exists idx_products_reviews on public.products (reviews);
create index if not exists idx_products_instock_rating on public.products ("inStock", rating desc);

-- Copie image_url -> image si image vide
create or replace function public.products_sync_image()
returns trigger language plpgsql as $$
begin
  if (new.image is null or new.image = '') and new.image_url is not null then
    new.image := new.image_url;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_products_sync_image on public.products;
create trigger trg_products_sync_image
before insert or update on public.products
for each row execute procedure public.products_sync_image();

-- ===========================
-- CATEGORIES & TAGS (optionnels mais utiles)
-- ===========================
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  name_fr text, name_en text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  name_fr text, name_en text
);

create table if not exists public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (product_id, tag_id)
);

-- ===========================
-- PRODUCT IMAGES (galerie)
-- ===========================
create table if not exists public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  position int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product_id on public.product_images (product_id);

-- ===========================
-- PRODUCT VARIANTS (inventory)
-- ===========================
create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  size text,
  color text,
  price int,
  stock int not null default 0,
  image text,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_variants_product_id on public.product_variants (product_id);
create index if not exists idx_product_variants_sku on public.product_variants (sku);

-- ===========================
-- CARTS (panier persistant)
-- ===========================
create table if not exists public.carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_carts_user_id on public.carts (user_id);

create table if not exists public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  price int not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_cart_items_cart_id on public.cart_items (cart_id);

-- ===========================
-- ADDRESSES (carnet d’adresses)
-- ===========================
create table if not exists public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text,
  full_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_addresses_user_id on public.addresses (user_id);

-- ===========================
-- ORDERS & ORDER ITEMS
-- ===========================
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  order_number text not null unique,
  total int not null,
  shipping_address jsonb,
  shipping_method text,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  customer_name text,
  email text,
  phone text,
  address text,
  city text,
  items jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_payment_status on public.orders (payment_status);
create index if not exists idx_orders_created_at on public.orders (created_at);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  price int not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_order_id on public.order_items (order_id);

-- ===========================
-- SHIPMENTS (expédition & tracking)
-- ===========================
create table if not exists public.shipments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  status text default 'created',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_shipments_order_id on public.shipments (order_id);

-- ===========================
-- RETURNS (retours)
-- ===========================
create table if not exists public.returns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  return_number text not null unique,
  reason text not null,
  comments text,
  status return_status not null default 'pending',
  items jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_returns_user_id on public.returns (user_id);
create index if not exists idx_returns_order_id on public.returns (order_id);
create index if not exists idx_returns_status on public.returns (status);

-- ===========================
-- CUSTOM ORDERS (sur-mesure)
-- ===========================
create table if not exists public.custom_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text not null,
  type text not null,
  measurements jsonb,
  preferences jsonb,
  budget int,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_custom_orders_user_id on public.custom_orders (user_id);
create index if not exists idx_custom_orders_status on public.custom_orders (status);

-- ===========================
-- REVIEWS (avis produits)
-- ===========================
create table if not exists public.product_reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists idx_product_reviews_product_id on public.product_reviews (product_id);
create index if not exists idx_product_reviews_user_id on public.product_reviews (user_id);

-- ===========================
-- WISHLIST (favoris)
-- ===========================
create table if not exists public.wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text default 'default',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists idx_wishlists_user_id on public.wishlists (user_id);

create table if not exists public.wishlist_items (
  id uuid primary key default uuid_generate_v4(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);
create index if not exists idx_wishlist_items_wishlist_id on public.wishlist_items (wishlist_id);

-- ===========================
-- NEWSLETTER (inscriptions)
-- ===========================
create table if not exists public.newsletter_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  locale text check (locale in ('fr','en')) default 'fr',
  subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===========================
-- COUPONS (promos)
-- ===========================
create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value int not null,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.order_coupons (
  order_id uuid not null references public.orders(id) on delete cascade,
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  primary key (order_id, coupon_id)
);

-- ===========================
-- RLS (Activer et politiques)
-- ===========================
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.categories enable row level security;
alter table public.product_categories enable row level security;
alter table public.tags enable row level security;
alter table public.product_tags enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.shipments enable row level security;
alter table public.returns enable row level security;
alter table public.custom_orders enable row level security;
alter table public.product_reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.coupons enable row level security;
alter table public.order_coupons enable row level security;

-- USERS: propriétaire
****************
-- Policies
****************
do $$ begin
  if not exists (select 1 from pg_policies where tablename='users' and policyname='users_select_self') then
    create policy users_select_self on public.users for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='users' and policyname='users_update_self') then
    create policy users_update_self on public.users for update using (auth.uid() = id);
  end if;
end $$;

-- PRODUITS & réf: lecture publique
do $$ begin
  if not exists (select 1 from pg_policies where tablename='products' and policyname='products_public_select') then
    create policy products_public_select on public.products for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='product_images' and policyname='product_images_public_select') then
    create policy product_images_public_select on public.product_images for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='product_variants' and policyname='product_variants_public_select') then
    create policy product_variants_public_select on public.product_variants for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='categories' and policyname='categories_public_select') then
    create policy categories_public_select on public.categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='product_categories' and policyname='product_categories_public_select') then
    create policy product_categories_public_select on public.product_categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='tags' and policyname='tags_public_select') then
    create policy tags_public_select on public.tags for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='product_tags' and policyname='product_tags_public_select') then
    create policy product_tags_public_select on public.product_tags for select using (true);
  end if;
end $$;

-- CART: propriétaire
do $$ begin
  if not exists (select 1 from pg_policies where tablename='carts' and policyname='carts_owner_rw') then
    create policy carts_owner_rw on public.carts
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='cart_items' and policyname='cart_items_owner_rw') then
    create policy cart_items_owner_rw on public.cart_items
      for all using (
        exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
      ) with check (
        exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
      );
  end if;
end $$;

-- ADDRESSES: propriétaire
do $$ begin
  if not exists (select 1 from pg_policies where tablename='addresses' and policyname='addresses_owner_rw') then
    create policy addresses_owner_rw on public.addresses
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- ORDERS / ITEMS / SHIPMENTS: propriétaire
do $$ begin
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='orders_owner_rw') then
    create policy orders_owner_rw on public.orders
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='order_items' and policyname='order_items_owner_r') then
    create policy order_items_owner_r on public.order_items
      for select using (
        exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='shipments' and policyname='shipments_owner_r') then
    create policy shipments_owner_r on public.shipments
      for select using (
        exists (select 1 from public.orders o where o.id = shipments.order_id and o.user_id = auth.uid())
      );
  end if;
end $$;

-- RETURNS: propriétaire (delete seulement pending)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='returns' and policyname='returns_owner_r') then
    create policy returns_owner_r on public.returns for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='returns' and policyname='returns_owner_cu') then
    create policy returns_owner_cu on public.returns for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='returns' and policyname='returns_owner_u') then
    create policy returns_owner_u on public.returns for update using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='returns' and policyname='returns_owner_delete_pending') then
    create policy returns_owner_delete_pending on public.returns for delete using (user_id = auth.uid() and status = 'pending');
  end if;
end $$;

-- CUSTOM ORDERS: insert public, lecture propriétaire
do $$ begin
  if not exists (select 1 from pg_policies where tablename='custom_orders' and policyname='custom_orders_insert_public') then
    create policy custom_orders_insert_public on public.custom_orders for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='custom_orders' and policyname='custom_orders_owner_r') then
    create policy custom_orders_owner_r on public.custom_orders for select using (user_id = auth.uid());
  end if;
end $$;

-- REVIEWS: propriétaire (un avis par produit)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='product_reviews' and policyname='product_reviews_owner_rw') then
    create policy product_reviews_owner_rw on public.product_reviews
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- WISHLIST: propriétaire
do $$ begin
  if not exists (select 1 from pg_policies where tablename='wishlists' and policyname='wishlists_owner_rw') then
    create policy wishlists_owner_rw on public.wishlists
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='wishlist_items' and policyname='wishlist_items_owner_rw') then
    create policy wishlist_items_owner_rw on public.wishlist_items
      for all using (
        exists (select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid())
      ) with check (
        exists (select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid())
      );
  end if;
end $$;

-- NEWSLETTER: insert public
do $$ begin
  if not exists (select 1 from pg_policies where tablename='newsletter_subscriptions' and policyname='newsletter_insert_public') then
    create policy newsletter_insert_public on public.newsletter_subscriptions for insert with check (true);
  end if;
end $$;

-- COUPONS: lecture publique (+ admin via service role)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='coupons' and policyname='coupons_public_select') then
    create policy coupons_public_select on public.coupons for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='order_coupons' and policyname='order_coupons_owner_r') then
    create policy order_coupons_owner_r on public.order_coupons
      for select using (
        exists (select 1 from public.orders o where o.id = order_coupons.order_id and o.user_id = auth.uid())
      );
  end if;
end $$;

-- NOTE: Les routes serveur (webhooks, admin ops) utilisent la Service Role Key et bypassent RLS.
