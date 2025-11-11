-- Ajouter la colonne stock à la table products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;

-- Mettre à jour les produits existants avec un stock par défaut
UPDATE products 
SET stock = 10 
WHERE stock IS NULL;

-- Ajouter un commentaire
COMMENT ON COLUMN products.stock IS 'Nombre d''articles disponibles en stock';

-- Créer un index pour les requêtes de stock
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Optionnel: Ajouter une contrainte pour éviter les stocks négatifs
ALTER TABLE products 
ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);
