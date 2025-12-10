'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductFilters } from '@/lib/types';

type SortOption = ProductFilters['sort'];

export function useProductsFromDB(options?: { category?: string; categories?: string[]; search?: string; sort?: SortOption; priceMin?: number; priceMax?: number; excludeCategories?: string[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('products')
          .select(`
            id, slug, name, name_fr, name_en, image, image_url, price, rating, reviews, inStock, stock, created_at, description, description_fr, description_en, material, material_fr, material_en, care, care_fr, care_en, sizes, colors, category,
            product_images(url, alt, position),
            product_variants(id, size, color, price, stock, image)
          `);

        if (options?.category) {
          query = query.eq('category', options.category);
        }

        if (options?.categories && options.categories.length > 0) {
          query = query.in('category', options.categories);
        }

        // Exclure les catégories spécifiées
        if (options?.excludeCategories && options.excludeCategories.length > 0) {
          query = query.not('category', 'in', `(${options.excludeCategories.map(c => `"${c}"`).join(',')})`);
        }

        if (options?.search && options.search.trim().length > 0) {
          const term = `%${options.search.trim()}%`;
          query = query.or(
            `name.ilike.${term},name_fr.ilike.${term},name_en.ilike.${term}`
          );
        }

        if (typeof options?.priceMin === 'number') {
          query = query.gte('price', options.priceMin);
        }

        if (typeof options?.priceMax === 'number') {
          query = query.lte('price', options.priceMax);
        }

        // Sorting
        switch (options?.sort) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'rating':
          default:
            query = query.order('rating', { ascending: false, nullsFirst: false }).order('reviews', { ascending: false, nullsFirst: false });
            break;
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        setProducts((data as Product[]) || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement des produits';
        setError(message);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [options?.category, JSON.stringify(options?.categories || []), options?.search, options?.sort, options?.priceMin, options?.priceMax, JSON.stringify(options?.excludeCategories || [])]);

  return { products, loading, error };
}

export function useProductBySlug(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('products')
          .select(`
            id, slug, name, name_fr, name_en, image, image_url, price, rating, reviews, inStock, stock, description, description_fr, description_en, sizes, colors, category,
            product_images(url, alt, position),
            product_variants(id, size, color, price, stock, image)
          `)
          .eq('slug', slug)
          .single();

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        setProduct((data as Product) || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Produit non trouvé';
        setError(message);
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  return { product, loading, error };
}

