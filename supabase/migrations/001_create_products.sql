-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  price BIGINT NOT NULL,
  original_price BIGINT,
  category VARCHAR(100) NOT NULL,
  image VARCHAR(500) NOT NULL,
  rating INTEGER DEFAULT 5,
  reviews INTEGER DEFAULT 0,
  description TEXT,
  material VARCHAR(255),
  care TEXT,
  sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
  colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert initial products
INSERT INTO products (name, slug, price, original_price, category, image, rating, reviews, description, material, care, sizes, colors, in_stock)
VALUES
  (
    'Costume Africain Traditionnel',
    'costume-africain-traditionnel',
    95000,
    110000,
    'ready-to-wear',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=600&fit=crop',
    5,
    24,
    'Un costume africain traditionnel alliant élégance et authenticité. Confectionné avec des tissus premium et des détails raffinés.',
    '100% Coton Premium',
    'Laver à l''eau froide, sécher à l''air libre',
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Noir', 'Or', 'Blanc', 'Bleu Marine'],
    true
  ),
  (
    'Robe de Mariage Élégante',
    'robe-de-mariage-elegante',
    180000,
    220000,
    'custom',
    'https://images.unsplash.com/photo-1595777707802-221b2eef5ffd?w=500&h=600&fit=crop',
    5,
    18,
    'Une robe de mariage élégante et sophistiquée pour votre grand jour.',
    '100% Soie Premium',
    'Nettoyage à sec recommandé',
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Blanc', 'Crème', 'Or', 'Rose'],
    true
  ),
  (
    'Tenue de Ville Chic',
    'tenue-de-ville-chic',
    75000,
    90000,
    'ready-to-wear',
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=600&fit=crop',
    4,
    15,
    'Une tenue de ville chic et moderne pour vos sorties professionnelles.',
    '100% Coton Premium',
    'Laver à l''eau froide, sécher à l''air libre',
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Noir', 'Gris', 'Bleu', 'Marron'],
    true
  ),
  (
    'Robe de Ville Moderne',
    'robe-de-ville-moderne',
    65000,
    80000,
    'ready-to-wear',
    'https://images.unsplash.com/photo-1595777707802-221b2eef5ffd?w=500&h=600&fit=crop',
    5,
    22,
    'Une robe de ville moderne et confortable pour tous les jours.',
    '100% Coton Premium',
    'Laver à l''eau froide, sécher à l''air libre',
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Noir', 'Blanc', 'Bleu', 'Rose'],
    true
  ),
  (
    'Robe de Soirée Luxe',
    'robe-de-soiree-luxe',
    120000,
    150000,
    'custom',
    'https://images.unsplash.com/photo-1595777707802-221b2eef5ffd?w=500&h=600&fit=crop',
    5,
    19,
    'Une robe de soirée luxe et glamour pour vos événements spéciaux.',
    '100% Soie Premium',
    'Nettoyage à sec recommandé',
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Noir', 'Or', 'Argent', 'Bordeaux'],
    true
  );

-- Enable RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON products
  FOR SELECT
  USING (true);
