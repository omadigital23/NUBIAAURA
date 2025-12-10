-- Populate product descriptions based on category and name
-- This script adds French and English descriptions to products

UPDATE public.products SET
  description_fr = CASE 
    WHEN category = 'robes' AND name ILIKE '%soiree%longue%' THEN 'Robe de soirée longue élégante, parfaite pour les occasions spéciales. Confectionnée avec des tissus premium pour un confort optimal et une allure sophistiquée.'
    WHEN category = 'robes' AND name ILIKE '%soiree%courte%' THEN 'Robe de soirée courte chic et moderne. Idéale pour les événements cocktail, elle combine style et confort avec des détails raffinés.'
    WHEN category = 'robes' AND name ILIKE '%mariage%longue%' THEN 'Robe de mariage longue majestueuse. Conçue pour votre jour spécial, elle offre élégance et grâce avec des finitions impeccables.'
    WHEN category = 'robes' AND name ILIKE '%mariage%courte%' THEN 'Robe de mariage courte moderne et élégante. Parfaite pour une cérémonie intime ou un mariage civil, elle allie tradition et contemporain.'
    WHEN category = 'robes' AND name ILIKE '%ville%longue%' THEN 'Robe de ville longue sophistiquée pour vos sorties en journée. Confortable et élégante, elle s''adapte à tous les styles de vie urbain.'
    WHEN category = 'robes' AND name ILIKE '%ville%courte%' THEN 'Robe de ville courte pratique et stylée. Parfaite pour le bureau ou les sorties en ville, elle offre confort et élégance.'
    WHEN category = 'robes' AND name ILIKE '%wax%longue%' THEN 'Robe wax longue aux motifs traditionnels africains. Confectionnée dans le tissu wax authentique, elle célèbre la culture africaine avec style.'
    WHEN category = 'robes' AND name ILIKE '%wax%courte%' THEN 'Robe wax courte colorée aux motifs traditionnels. Dynamique et festive, elle apporte une touche d''authenticité à votre garde-robe.'
    WHEN category = 'costumes' AND name ILIKE '%super100%' THEN 'Costume Super 100 haut de gamme confectionné dans une laine premium. Parfait pour les occasions formelles, il offre confort et prestige.'
    WHEN category = 'costumes' AND name ILIKE '%africain%' THEN 'Costume africain traditionnel aux motifs authentiques. Idéal pour célébrer la culture africaine lors d''événements spéciaux.'
    WHEN category = 'chemises' AND name ILIKE '%wax%' THEN 'Chemise wax grande aux motifs traditionnels africains. Polyvalente, elle se porte seule ou en ensemble pour un style unique.'
    ELSE 'Pièce de mode premium de la collection Nubia Aura. Confectionnée avec soin, elle allie style, confort et élégance.'
  END,
  description_en = CASE 
    WHEN category = 'robes' AND name ILIKE '%soiree%longue%' THEN 'Elegant long evening dress, perfect for special occasions. Crafted with premium fabrics for optimal comfort and sophisticated allure.'
    WHEN category = 'robes' AND name ILIKE '%soiree%courte%' THEN 'Chic and modern short evening dress. Ideal for cocktail events, it combines style and comfort with refined details.'
    WHEN category = 'robes' AND name ILIKE '%mariage%longue%' THEN 'Majestic long wedding dress. Designed for your special day, it offers elegance and grace with impeccable finishes.'
    WHEN category = 'robes' AND name ILIKE '%mariage%courte%' THEN 'Modern and elegant short wedding dress. Perfect for an intimate ceremony or civil wedding, it blends tradition and contemporary style.'
    WHEN category = 'robes' AND name ILIKE '%ville%longue%' THEN 'Sophisticated long city dress for your daytime outings. Comfortable and elegant, it adapts to all urban lifestyle styles.'
    WHEN category = 'robes' AND name ILIKE '%ville%courte%' THEN 'Practical and stylish short city dress. Perfect for the office or city outings, it offers comfort and elegance.'
    WHEN category = 'robes' AND name ILIKE '%wax%longue%' THEN 'Long wax dress with traditional African patterns. Crafted in authentic wax fabric, it celebrates African culture with style.'
    WHEN category = 'robes' AND name ILIKE '%wax%courte%' THEN 'Colorful short wax dress with traditional patterns. Dynamic and festive, it brings a touch of authenticity to your wardrobe.'
    WHEN category = 'costumes' AND name ILIKE '%super100%' THEN 'Premium Super 100 suit crafted in high-end wool. Perfect for formal occasions, it offers comfort and prestige.'
    WHEN category = 'costumes' AND name ILIKE '%africain%' THEN 'Traditional African suit with authentic patterns. Ideal for celebrating African culture at special events.'
    WHEN category = 'chemises' AND name ILIKE '%wax%' THEN 'Large wax shirt with traditional African patterns. Versatile, it can be worn alone or as part of an ensemble for a unique style.'
    ELSE 'Premium fashion piece from the Nubia Aura collection. Crafted with care, it combines style, comfort and elegance.'
  END,
  description = CASE 
    WHEN category = 'robes' AND name ILIKE '%soiree%longue%' THEN 'Robe de soirée longue élégante, parfaite pour les occasions spéciales. Confectionnée avec des tissus premium pour un confort optimal et une allure sophistiquée.'
    WHEN category = 'robes' AND name ILIKE '%soiree%courte%' THEN 'Robe de soirée courte chic et moderne. Idéale pour les événements cocktail, elle combine style et confort avec des détails raffinés.'
    WHEN category = 'robes' AND name ILIKE '%mariage%longue%' THEN 'Robe de mariage longue majestueuse. Conçue pour votre jour spécial, elle offre élégance et grâce avec des finitions impeccables.'
    WHEN category = 'robes' AND name ILIKE '%mariage%courte%' THEN 'Robe de mariage courte moderne et élégante. Parfaite pour une cérémonie intime ou un mariage civil, elle allie tradition et contemporain.'
    WHEN category = 'robes' AND name ILIKE '%ville%longue%' THEN 'Robe de ville longue sophistiquée pour vos sorties en journée. Confortable et élégante, elle s''adapte à tous les styles de vie urbain.'
    WHEN category = 'robes' AND name ILIKE '%ville%courte%' THEN 'Robe de ville courte pratique et stylée. Parfaite pour le bureau ou les sorties en ville, elle offre confort et élégance.'
    WHEN category = 'robes' AND name ILIKE '%wax%longue%' THEN 'Robe wax longue aux motifs traditionnels africains. Confectionnée dans le tissu wax authentique, elle célèbre la culture africaine avec style.'
    WHEN category = 'robes' AND name ILIKE '%wax%courte%' THEN 'Robe wax courte colorée aux motifs traditionnels. Dynamique et festive, elle apporte une touche d''authenticité à votre garde-robe.'
    WHEN category = 'costumes' AND name ILIKE '%super100%' THEN 'Costume Super 100 haut de gamme confectionné dans une laine premium. Parfait pour les occasions formelles, il offre confort et prestige.'
    WHEN category = 'costumes' AND name ILIKE '%africain%' THEN 'Costume africain traditionnel aux motifs authentiques. Idéal pour célébrer la culture africaine lors d''événements spéciaux.'
    WHEN category = 'chemises' AND name ILIKE '%wax%' THEN 'Chemise wax grande aux motifs traditionnels africains. Polyvalente, elle se porte seule ou en ensemble pour un style unique.'
    ELSE 'Pièce de mode premium de la collection Nubia Aura. Confectionnée avec soin, elle allie style, confort et élégance.'
  END
WHERE description IS NULL OR description = '';

-- Add material information
UPDATE public.products SET
  material_fr = CASE 
    WHEN name ILIKE '%wax%' THEN 'Tissu Wax 100% coton'
    WHEN name ILIKE '%super100%' THEN 'Laine Super 100'
    ELSE 'Tissu premium'
  END,
  material_en = CASE 
    WHEN name ILIKE '%wax%' THEN '100% Cotton Wax Fabric'
    WHEN name ILIKE '%super100%' THEN 'Super 100 Wool'
    ELSE 'Premium Fabric'
  END,
  material = CASE 
    WHEN name ILIKE '%wax%' THEN 'Tissu Wax 100% coton'
    WHEN name ILIKE '%super100%' THEN 'Laine Super 100'
    ELSE 'Tissu premium'
  END
WHERE material IS NULL OR material = '';

-- Add care instructions
UPDATE public.products SET
  care_fr = 'Lavage à froid. Repasser à température moyenne. Éviter le sèche-linge.',
  care_en = 'Wash in cold water. Iron at medium temperature. Avoid dryer.',
  care = 'Lavage à froid. Repasser à température moyenne. Éviter le sèche-linge.'
WHERE care IS NULL OR care = '';

-- Verify the updates
SELECT id, slug, name, category, description_fr, description_en FROM public.products LIMIT 5;
