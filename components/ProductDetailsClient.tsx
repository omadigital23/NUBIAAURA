"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import { withImageParams, sizesFor } from "@/lib/image-formats";

type ProductImage = {
  url: string;
  alt?: string | null;
  position?: number | null;
};

type ProductVariant = {
  id: string;
  size?: string | null;
  color?: string | null;
  stock: number;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  name_fr?: string | null;
  name_en?: string | null;
  image?: string | null;
  image_url?: string | null;
  price: number;
  rating?: number | null;
  reviews?: number | null;
  inStock?: boolean | null;
  stock?: number | null;
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
  product_images?: ProductImage[] | null;
  product_variants?: ProductVariant[] | null;
};

export default function ProductDetailsClient({ product, locale }: { product: Product | null; locale: string }) {
  const { t } = useTranslation();
  const { addItem, loading: cartLoading } = useCartContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="py-20 text-center text-nubia-black">{t("product.not_found", "Produit non trouvé")}</div>
    );
  }

  const name = useMemo(() => {
    return (locale === "fr" ? product.name_fr : product.name_en) || product.name;
  }, [locale, product]);

  const description = useMemo(() => {
    const desc_fr = product.description_fr || product.description || '';
    const desc_en = product.description_en || '';
    
    if (locale === "fr") {
      return desc_fr;
    } else {
      return desc_en || 'Premium fashion piece from the Nubia Aura collection. Crafted with care, it combines style, comfort and elegance.';
    }
  }, [locale, product]);

  const material = useMemo(() => {
    if (locale === "fr") {
      return product.material_fr || product.material || '';
    } else {
      return product.material_en || 'Premium Fabric';
    }
  }, [locale, product]);

  const care = useMemo(() => {
    if (locale === "fr") {
      return product.care_fr || product.care || '';
    } else {
      return product.care_en || 'Wash in cold water. Iron at medium temperature. Avoid dryer.';
    }
  }, [locale, product]);

  const imageSrc = product.image || product.image_url || "";
  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const inStock = product.inStock ?? true;

  // Calculer le stock disponible
  const availableStock = useMemo(() => {
    // Priorité 1: Utiliser la colonne stock si elle existe
    if (typeof product.stock === 'number') {
      return product.stock;
    }
    
    // Priorité 2: Calculer depuis les variants
    if (product.product_variants && product.product_variants.length > 0) {
      const totalStock = product.product_variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
      return totalStock;
    }
    
    // Priorité 3: Fallback sur inStock
    return inStock ? 10 : 0;
  }, [product.stock, product.product_variants, inStock]);

  const colorLabel = (raw: string) => {
    const key = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z]/g, '');
    return t(`colors.${key}`, raw);
  };

  // Build gallery: main image first, then product_images sorted by position
  const gallery = useMemo(() => {
    const images: string[] = [];
    if (imageSrc) images.push(imageSrc);
    if (product.product_images && Array.isArray(product.product_images)) {
      const sorted = [...product.product_images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      sorted.forEach((img) => {
        if (img.url && !images.includes(img.url)) {
          images.push(img.url);
        }
      });
    }
    return images;
  }, [imageSrc, product.product_images]);

  const currentImage = gallery[activeImageIndex] || imageSrc;
  const canAdd = inStock && (!sizes.length || selectedSize) && (!colors.length || selectedColor);

  const handleAddToCart = async () => {
    // ✅ VÉRIFICATION OBLIGATOIRE: Bloquer si non authentifié
    if (!isAuthenticated && !authLoading) {
      setShowAuthModal(true);
      return;
    }

    // Vérifier que l'utilisateur peut ajouter (taille, couleur, stock)
    if (!canAdd) return;
    
    // Vérifier le stock disponible
    if (quantity > availableStock) {
      setAddError(locale === 'fr' 
        ? `Stock insuffisant. Seulement ${availableStock} articles disponibles.`
        : `Insufficient stock. Only ${availableStock} items available.`
      );
      return;
    }

    try {
      setAdding(true);
      setAddError(null);
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      await addItem({
        id: product.id,
        name,
        price,
        quantity,
        image: imageSrc,
      });
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setAddError(null);
    } catch (err) {
      console.error('Error adding to cart:', err);
      
      // Si erreur AUTH_REQUIRED de l'API, afficher le modal
      if (err instanceof Error && err.message.includes('Authentication required')) {
        setShowAuthModal(true);
        setAddError(t('cart.add.auth_required', 'Veuillez vous connecter pour ajouter au panier'));
      } else {
        // Afficher l'erreur
        const errorMessage = err instanceof Error ? err.message : t('cart.add.error', 'Erreur lors de l\'ajout au panier');
        setAddError(errorMessage);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/catalogue`} className="text-nubia-gold hover:underline">
          {t("catalog.back_to_catalog", "Retour au catalogue")}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 tablet:grid-cols-2 gap-6 md:gap-10">
        {/* Image Gallery */}
        <div className="md:col-span-2 tablet:col-span-1">
          {/* Mobile thumbnails - Horizontal */}
          {gallery.length > 1 && (
            <div className="flex md:hidden gap-2 mb-4 overflow-x-auto pb-2">
              {gallery.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImageIndex === idx ? 'border-nubia-gold' : 'border-nubia-gold/30'
                  }`}
                >
                  <Image
                    src={withImageParams('thumbnail', img)}
                    alt={`${name} - ${idx + 1}`}
                    fill
                    sizes={sizesFor('thumbnail')}
                    quality={60}
                    loading="lazy"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 md:gap-4">
            {/* Thumbnails - Vertical on the left */}
            {gallery.length > 1 && (
              <div className="hidden md:flex flex-col gap-2 order-first">
                {gallery.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIndex === idx ? 'border-nubia-gold' : 'border-nubia-gold/30'
                    }`}
                  >
                    <Image
                      src={withImageParams('thumbnail', img)}
                      alt={`${name} - ${idx + 1}`}
                      fill
                      sizes={sizesFor('thumbnail')}
                      quality={60}
                      loading="lazy"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1">
              <div className="relative w-full aspect-[4/5] md:aspect-[3/4] tablet:aspect-[4/5] bg-nubia-cream/30 rounded-lg overflow-hidden">
                {currentImage && (
                  <Image
                    src={withImageParams('cover', currentImage)}
                    alt={name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw"
                    quality={80}
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-4">{name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-nubia-gold">
              {Number(product.price).toLocaleString("fr-FR")} {t("common.currency", "FCFA")}
            </span>
            <span className="text-sm text-nubia-white bg-nubia-gold px-3 py-1 rounded-full">
              {"⭐".repeat(Math.max(1, Math.min(5, Math.floor((product.rating as number) || 5))))}
            </span>
          </div>

          {/* Stock disponible */}
          <div className="mb-6">
            {availableStock > 0 ? (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  availableStock <= 3 
                    ? 'bg-red-100 text-red-800' 
                    : availableStock <= 10 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {availableStock <= 3 && '⚠️ '}
                  {locale === 'fr' 
                    ? `${availableStock} ${availableStock === 1 ? 'article restant' : 'articles restants'}`
                    : `${availableStock} ${availableStock === 1 ? 'item left' : 'items left'}`
                  }
                </span>
                {availableStock <= 3 && (
                  <span className="text-xs text-red-600 font-medium">
                    {locale === 'fr' ? 'Dépêchez-vous!' : 'Hurry up!'}
                  </span>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {locale === 'fr' ? '❌ Rupture de stock' : '❌ Out of stock'}
              </span>
            )}
          </div>

          {description && (
            <p className="text-nubia-black/80 leading-relaxed mb-6">{description}</p>
          )}

          {/* Material Section */}
          {material && (
            <div className="mb-6 p-4 bg-nubia-cream/20 rounded-lg border border-nubia-gold/20">
              <h3 className="text-sm font-semibold text-nubia-black mb-2">
                {locale === "fr" ? "Matière" : "Material"}
              </h3>
              <p className="text-sm text-nubia-black/80">{material}</p>
            </div>
          )}

          {/* Care Section */}
          {care && (
            <div className="mb-6 p-4 bg-nubia-cream/20 rounded-lg border border-nubia-gold/20">
              <h3 className="text-sm font-semibold text-nubia-black mb-2">
                {locale === "fr" ? "Entretien" : "Care Instructions"}
              </h3>
              <p className="text-sm text-nubia-black/80">{care}</p>
            </div>
          )}

          {!!sizes.length && (
            <div className="mb-6">
              <div className="mb-2 text-sm text-nubia-black/70">{t("product.size", "Size")}</div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`px-3 py-2 border rounded-lg ${
                      selectedSize === s ? "border-nubia-gold bg-nubia-gold/10" : "border-nubia-gold/30"
                    }`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!!colors.length && (
            <div className="mb-6">
              <div className="mb-2 text-sm text-nubia-black/70">{t("product.color", "Color")}</div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`px-3 py-2 border rounded-lg ${
                      selectedColor === c ? "border-nubia-gold bg-nubia-gold/10" : "border-nubia-gold/30"
                    }`}
                    onClick={() => setSelectedColor(c)}
                  >
                    {colorLabel(c)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <div className="mb-2 text-sm text-nubia-black/70">
              {t("common.quantity", "Quantité")}
              {availableStock > 0 && (
                <span className="ml-2 text-xs text-nubia-black/50">
                  ({locale === 'fr' ? 'Max' : 'Max'}: {availableStock})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="w-12 text-center font-semibold text-nubia-black">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                disabled={quantity >= availableStock}
                className="px-3 py-2 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-green-700 font-semibold">
                ✓ {quantity} {quantity === 1 ? t("product.item_added", "article ajouté") : t("product.items_added", "articles ajoutés")} au panier !
              </p>
            </div>
          )}

          {/* Error Message */}
          {addError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-red-700 font-semibold">
                ✕ {addError}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              disabled={(!isAuthenticated && !authLoading) ? false : (!canAdd || adding || cartLoading || availableStock === 0)}
              onClick={handleAddToCart}
              className="inline-flex items-center justify-center px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 disabled:opacity-60"
            >
              {!isAuthenticated && !authLoading ? (
                <>
                  🔒 {locale === 'fr' ? 'Se connecter pour ajouter' : 'Login to add to cart'}
                </>
              ) : availableStock === 0 ? (
                locale === 'fr' ? 'Rupture de stock' : 'Out of stock'
              ) : adding || cartLoading ? (
                t("common.loading", "Chargement...")
              ) : (
                t("common.add_to_cart", "Ajouter au panier")
              )}
            </button>
            {!inStock && (
              <span className="px-4 py-3 text-sm text-red-600">{t("product.out_of_stock", "Rupture de stock")}</span>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={() => {
          setShowAuthModal(false);
          // Ajouter automatiquement au panier après connexion
          handleAddToCart();
        }}
      />
    </div>
  );
}
