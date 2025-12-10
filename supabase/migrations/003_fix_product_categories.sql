-- Fix product categories to match the categories table
-- Map old categories to new ones

-- Update products with category 'ready-to-wear' to 'robes-ville'
UPDATE public.products 
SET category = 'robes-ville'
WHERE category = 'ready-to-wear';

-- Update products with category 'custom' to 'robes-mariage'
UPDATE public.products 
SET category = 'robes-mariage'
WHERE category = 'custom';

-- Verify the changes
SELECT category, COUNT(*) as count FROM public.products GROUP BY category ORDER BY category;
