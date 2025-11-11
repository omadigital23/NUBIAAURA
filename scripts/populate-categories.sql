-- Peupler la table categories avec les 7 catégories mappées du bucket Supabase
INSERT INTO public.categories (slug, name, name_fr, name_en) VALUES
  ('chemises-wax', 'Chemises Wax', 'Chemises Wax', 'Wax Shirts'),
  ('costumes-africains', 'Costumes Africains', 'Costumes Africains', 'African Costumes'),
  ('robes-mariage', 'Robes de Mariage', 'Robes de Mariage', 'Wedding Dresses'),
  ('robes-soiree', 'Robes de Soirée', 'Robes de Soirée', 'Evening Dresses'),
  ('robes-ville', 'Robes de Ville', 'Robes de Ville', 'City Dresses'),
  ('robes-wax', 'Robes Wax', 'Robes Wax', 'Wax Dresses'),
  ('super100', 'Super 100', 'Super 100', 'Super 100')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en;

-- Vérifier que les catégories ont été insérées
SELECT * FROM public.categories ORDER BY name_fr;
