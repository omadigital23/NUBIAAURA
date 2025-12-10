/**
 * Types centralisés pour les produits
 */

export interface Product {
  id: string;
  slug: string;
  name: string;
  name_fr: string | null;
  name_en: string | null;
  price: number;
  originalPrice?: number | null;
  category: string;
  image: string;
  image_url?: string | null;
  rating: number;
  reviews?: number | null;
  description?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  material?: string | null;
  material_fr?: string | null;
  material_en?: string | null;
  care?: string | null;
  care_fr?: string | null;
  care_en?: string | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  inStock?: boolean | null;
  stock?: number | null; // ✨ NOUVEAU: Nombre d'articles en stock
  created_at?: string;
  updated_at?: string;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
}

export interface ProductImage {
  id?: string;
  url: string;
  alt?: string | null;
  position?: number | null;
}

export interface ProductVariant {
  id: string;
  size?: string | null;
  color?: string | null;
  price?: number | null;
  stock: number;
  image?: string | null;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  categories?: string[];
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
