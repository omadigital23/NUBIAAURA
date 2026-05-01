"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
  Star,
  Timer,
  WashingMachine,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import WishlistButton from "@/components/WishlistButton";
import { withImageParams } from "@/lib/image-formats";
import { trackAddToCart, trackProductView } from "@/lib/analytics-config";
import OptimizedImage from "@/components/OptimizedImage";
import ProductReviews from "@/components/ProductReviews";

type ProductImage = {
  url: string;
  alt?: string | null;
  position?: number | null;
};

type ProductVariant = {
  id: string;
  size?: string | null;
  color?: string | null;
  price?: number | null;
  stock: number;
  image?: string | null;
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

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const subtleSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
};

function logClientWarning(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, error);
  }
}

export default function ProductDetailsClient({
  product,
  locale,
}: {
  product: Product | null;
  locale: string;
}) {
  const { t } = useTranslation();
  const { addItem, loading: cartLoading, refetchCart } = useCartContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pendingAddToCart = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (product) {
      try {
        const productName = (locale === "fr" ? product.name_fr : product.name_en) || product.name;
        trackProductView({
          id: product.id,
          name: productName,
          price: typeof product.price === "string" ? parseFloat(product.price) : product.price,
          category: product.slug,
        });
      } catch (e) {
        logClientWarning("Analytics tracking failed:", e);
      }
    }
  }, [product, locale]);

  const name = useMemo(() => {
    if (!product) return "";
    return (locale === "fr" ? product.name_fr : product.name_en) || product.name;
  }, [locale, product]);

  const description = useMemo(() => {
    if (!product) return "";
    const descFr = product.description_fr || product.description || "";
    const descEn = product.description_en || "";

    if (locale === "fr") {
      return descFr;
    }

    return descEn || "Premium fashion piece from the Nubia Aura collection. Crafted with care, it combines style, comfort and elegance.";
  }, [locale, product]);

  const material = useMemo(() => {
    if (!product) return "";
    if (locale === "fr") {
      return product.material_fr || product.material || "";
    }
    return product.material_en || "Premium Fabric";
  }, [locale, product]);

  const care = useMemo(() => {
    if (!product) return "";
    if (locale === "fr") {
      return product.care_fr || product.care || "";
    }
    return product.care_en || "Wash in cold water. Iron at medium temperature. Avoid dryer.";
  }, [locale, product]);

  const imageSrc = useMemo(() => {
    if (!product) return "";

    const primaryFromGallery = product.product_images
      ?.filter((image) => Boolean(image.url))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0]?.url;

    return primaryFromGallery || product.image || product.image_url || "";
  }, [product]);

  const variants = useMemo(() => product?.product_variants || [], [product]);

  const sizes = useMemo(() => {
    if (product?.sizes?.length) return product.sizes;
    return Array.from(new Set(variants.map((variant) => variant.size).filter(Boolean))) as string[];
  }, [product, variants]);

  const colors = useMemo(() => {
    if (product?.colors?.length) return product.colors;
    return Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean))) as string[];
  }, [product, variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    if (sizes.length && !selectedSize) return null;
    if (colors.length && !selectedColor) return null;

    const match = variants.find((variant) => {
      const sizeMatches = !selectedSize || variant.size === selectedSize;
      const colorMatches = !selectedColor || variant.color === selectedColor;
      return sizeMatches && colorMatches;
    });

    return match || (sizes.length || colors.length ? null : variants.find((variant) => variant.stock > 0) || variants[0]);
  }, [colors.length, selectedColor, selectedSize, sizes.length, variants]);

  const inStock = variants.length > 0
    ? variants.some((variant) => (variant.stock || 0) > 0)
    : product?.inStock ?? true;

  const availableStock = useMemo(() => {
    if (!product) return 0;
    if (variants.length > 0) {
      if (selectedVariant) {
        return selectedVariant.stock || 0;
      }
      return variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    }

    if (typeof product.stock === "number") {
      return product.stock;
    }

    return inStock ? 10 : 0;
  }, [product, inStock, selectedVariant, variants]);

  useEffect(() => {
    if (availableStock > 0 && quantity > availableStock) {
      setQuantity(availableStock);
    }
  }, [availableStock, quantity]);

  const colorLabel = (raw: string) => {
    const key = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z]/g, "");
    return t(`colors.${key}`, raw);
  };

  const gallery = useMemo(() => {
    const images: string[] = [];
    if (product?.product_images && Array.isArray(product.product_images)) {
      const sorted = [...product.product_images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      sorted.forEach((img) => {
        if (img.url && !images.includes(img.url)) {
          images.push(img.url);
        }
      });
    }
    if (images.length === 0 && imageSrc) {
      images.push(imageSrc);
    }
    return images;
  }, [imageSrc, product]);

  const currentImage = gallery[activeImageIndex] || imageSrc;
  const displayPrice = selectedVariant?.price ?? Number(product?.price || 0);
  const canAdd = Boolean(product)
    && inStock
    && availableStock > 0
    && (!sizes.length || selectedSize)
    && (!colors.length || selectedColor)
    && (!variants.length || Boolean(selectedVariant));

  useEffect(() => {
    if (isAuthenticated && !authLoading && pendingAddToCart.current) {
      pendingAddToCart.current = false;

      const executeAddToCart = async () => {
        if (!product || !canAdd) return;
        if (quantity > availableStock) {
          setAddError(locale === "fr"
            ? `Stock insuffisant. Seulement ${availableStock} articles disponibles.`
            : `Insufficient stock. Only ${availableStock} items available.`
          );
          return;
        }

        try {
          setAdding(true);
          setAddError(null);
          const price = selectedVariant?.price ?? (typeof product.price === "string" ? parseFloat(product.price) : product.price);
          const itemImage = selectedVariant?.image || imageSrc;
          await addItem({
            id: product.id,
            variantId: selectedVariant?.id || null,
            name,
            price,
            quantity,
            image: itemImage,
            size: selectedVariant?.size || selectedSize,
            color: selectedVariant?.color || selectedColor,
          });

          await refetchCart();

          try {
            trackAddToCart({
              id: product.id,
              name,
              price,
              quantity,
            });
          } catch (e) {
            logClientWarning("Analytics tracking failed:", e);
          }

          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
          setAddError(null);
        } catch (err) {
          logClientWarning("Add to cart failed:", err);
          const errorMessage = err instanceof Error ? err.message : t("cart.add.error", "Erreur lors de l'ajout au panier");
          setAddError(errorMessage);
        } finally {
          setAdding(false);
        }
      };

      executeAddToCart();
    }
  }, [isAuthenticated, authLoading, canAdd, quantity, availableStock, locale, product, addItem, name, imageSrc, t, refetchCart, selectedColor, selectedSize, selectedVariant]);

  if (!product) {
    return (
      <div className="py-20 text-center text-nubia-black">{t("product.not_found", "Produit non trouvé")}</div>
    );
  }

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated && !authLoading) {
      setShowAuthModal(true);
      return;
    }

    if (!canAdd) return;

    if (quantity > availableStock) {
      setAddError(locale === "fr"
        ? `Stock insuffisant. Seulement ${availableStock} articles disponibles.`
        : `Insufficient stock. Only ${availableStock} items available.`
      );
      return;
    }

    try {
      setAdding(true);
      setAddError(null);
      const price = selectedVariant?.price ?? (typeof product.price === "string" ? parseFloat(product.price) : product.price);
      const itemImage = selectedVariant?.image || imageSrc;
      await addItem({
        id: product.id,
        variantId: selectedVariant?.id || null,
        name,
        price,
        quantity,
        image: itemImage,
        size: selectedVariant?.size || selectedSize,
        color: selectedVariant?.color || selectedColor,
      });

      try {
        trackAddToCart({
          id: product.id,
          name,
          price,
          quantity,
        });
      } catch (e) {
        logClientWarning("Analytics tracking failed:", e);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setAddError(null);
    } catch (err) {
      logClientWarning("Add to cart failed:", err);

      if (err instanceof Error && err.message.includes("Authentication required")) {
        setShowAuthModal(true);
        setAddError(t("cart.add.auth_required", "Veuillez vous connecter pour ajouter au panier"));
      } else {
        const errorMessage = err instanceof Error ? err.message : t("cart.add.error", "Erreur lors de l'ajout au panier");
        setAddError(errorMessage);
      }
    } finally {
      setAdding(false);
    }
  };

  const ratingValue = Math.max(1, Math.min(5, Math.floor((product.rating as number) || 5)));
  const stockIsLow = availableStock > 0 && availableStock <= 3;
  const stockIsLimited = availableStock > 3 && availableStock <= 10;
  const stockLabel = availableStock > 0
    ? locale === "fr"
      ? `${availableStock} ${availableStock === 1 ? "article restant" : "articles restants"}`
      : `${availableStock} ${availableStock === 1 ? "item left" : "items left"}`
    : locale === "fr"
      ? "Rupture de stock"
      : "Out of stock";
  const detailCards = [
    {
      icon: Sparkles,
      title: locale === "fr" ? "Matière" : "Material",
      content: material,
    },
    {
      icon: WashingMachine,
      title: locale === "fr" ? "Entretien" : "Care Instructions",
      content: care,
    },
  ].filter((item) => Boolean(item.content));

  return (
    <motion.div className="space-y-12">
      <div className="mb-2">
        <Link
          href={`/${locale}/catalogue`}
          className="group inline-flex items-center gap-2 text-sm font-medium text-nubia-gold transition-all duration-300 hover:gap-3 hover:text-nubia-black"
        >
          <ArrowLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
          {t("catalog.back_to_catalog", "Retour au catalogue")}
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] lg:gap-12 xl:gap-16">
        <div className="lg:hidden">
          <p className="mb-2 inline-flex items-center rounded-full border border-nubia-gold/30 bg-nubia-cream/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-nubia-gold">
            Nubia Aura
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-nubia-black">{name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-nubia-gold">
              {Number(displayPrice).toLocaleString("fr-FR")} {t("common.currency", "FCFA")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-nubia-gold px-3 py-1 text-xs font-semibold text-nubia-white">
              {Array.from({ length: ratingValue }).map((_, index) => (
                <Star key={index} size={13} fill="currentColor" />
              ))}
            </span>
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.08 }}
          className="min-w-0"
        >
          <div className="grid gap-3 lg:grid-cols-[88px_minmax(0,1fr)] lg:gap-5">
            {isMounted && gallery.length > 1 && (
              <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
                {gallery.map((img, idx) => (
                  <motion.button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`${locale === "fr" ? "Afficher l'image" : "Show image"} ${idx + 1}`}
                    aria-pressed={activeImageIndex === idx}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    transition={subtleSpring}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-nubia-cream/30 shadow-sm transition-all duration-300 lg:h-24 lg:w-[88px] ${
                      activeImageIndex === idx
                        ? "border-nubia-gold shadow-gold"
                        : "border-nubia-gold/25 opacity-75 hover:border-nubia-gold/70 hover:opacity-100"
                    }`}
                  >
                    <OptimizedImage
                      src={withImageParams("thumbnail", img)}
                      alt={`${name} - ${idx + 1}`}
                      fill
                      sizes="(max-width: 1024px) 80px, 88px"
                      objectFit="cover"
                    />
                    {activeImageIndex === idx && (
                      <span className="absolute inset-x-2 bottom-2 h-0.5 rounded-full bg-nubia-gold" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            <div className="order-1 min-w-0 lg:order-2">
              <motion.div
                layout
                className="relative h-[62vh] min-h-[360px] max-h-[560px] overflow-hidden rounded-lg border border-nubia-gold/15 bg-nubia-cream/45 shadow-[0_24px_70px_rgba(0,0,0,0.08)] lg:h-[min(76vh,760px)] lg:max-h-[760px]"
              >
                <AnimatePresence mode="wait">
                  {currentImage && (
                    <motion.div
                      key={currentImage}
                      initial={{ opacity: 0, scale: 1.025 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.985 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={withImageParams("cover", currentImage)}
                        alt={name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 58vw"
                        priority
                        unoptimized={process.env.NODE_ENV === "development"}
                        style={{ objectFit: "contain" }}
                        className="object-contain"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-nubia-black/45 via-nubia-black/10 to-transparent p-4 text-nubia-white lg:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nubia-gold">
                      {activeImageIndex + 1}/{gallery.length || 1}
                    </p>
                    <p className="mt-1 text-sm font-medium">{name}</p>
                  </div>
                  {gallery.length > 1 && (
                    <div className="hidden rounded-full border border-nubia-white/25 bg-nubia-black/30 px-3 py-1 text-xs backdrop-blur-sm sm:block">
                      {locale === "fr" ? "Angles du produit" : "Product angles"}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.16 }}
          className="lg:sticky lg:top-28"
        >
          <div className="rounded-lg border border-nubia-gold/20 bg-nubia-white/95 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] backdrop-blur sm:p-6 lg:p-7">
            <div className="hidden lg:block">
              <p className="mb-3 inline-flex items-center rounded-full border border-nubia-gold/30 bg-nubia-cream/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-nubia-gold">
                Nubia Aura
              </p>
              <h1 className="font-playfair text-4xl font-bold leading-tight text-nubia-black">{name}</h1>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-bold text-nubia-gold">
                {Number(displayPrice).toLocaleString("fr-FR")} {t("common.currency", "FCFA")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-nubia-gold px-3 py-1 text-xs font-semibold text-nubia-white">
                {Array.from({ length: ratingValue }).map((_, index) => (
                  <Star key={index} size={13} fill="currentColor" />
                ))}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                availableStock <= 0
                  ? "bg-gray-100 text-gray-800"
                  : stockIsLow
                    ? "bg-red-100 text-red-800"
                    : stockIsLimited
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
              }`}>
                {availableStock > 0 ? <CheckCircle2 size={16} /> : <Timer size={16} />}
                {stockLabel}
              </span>
              {stockIsLow && (
                <span className="text-sm font-medium text-red-600">
                  {locale === "fr" ? "Dernières pièces disponibles" : "Last pieces available"}
                </span>
              )}
            </div>

            {description && (
              <p className="mt-6 text-base leading-7 text-nubia-black/75">{description}</p>
            )}

            {!!detailCards.length && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {detailCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      whileHover={{ y: -3 }}
                      transition={subtleSpring}
                      className="rounded-lg border border-nubia-gold/20 bg-nubia-cream/20 p-4"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-nubia-gold/10 text-nubia-gold">
                          <Icon size={18} />
                        </span>
                        <h3 className="text-sm font-semibold text-nubia-black">{item.title}</h3>
                      </div>
                      <p className="text-sm leading-6 text-nubia-black/75">{item.content}</p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {!!sizes.length && (
              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-nubia-black/70">{t("product.size", "Size")}</div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <motion.button
                      key={s}
                      type="button"
                      aria-label={`${locale === "fr" ? "Choisir la taille" : "Choose size"} ${s}`}
                      aria-pressed={selectedSize === s}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={subtleSpring}
                      className={`min-w-12 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                        selectedSize === s
                          ? "border-nubia-gold bg-nubia-gold/10 text-nubia-black shadow-sm"
                          : "border-nubia-gold/30 text-nubia-black/75 hover:border-nubia-gold hover:bg-nubia-gold/5"
                      }`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {!!colors.length && (
              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-nubia-black/70">{t("product.color", "Color")}</div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <motion.button
                      key={c}
                      type="button"
                      aria-label={`${locale === "fr" ? "Choisir la couleur" : "Choose color"} ${colorLabel(c)}`}
                      aria-pressed={selectedColor === c}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={subtleSpring}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                        selectedColor === c
                          ? "border-nubia-gold bg-nubia-gold/10 text-nubia-black shadow-sm"
                          : "border-nubia-gold/30 text-nubia-black/75 hover:border-nubia-gold hover:bg-nubia-gold/5"
                      }`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {colorLabel(c)}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm text-nubia-black/70">
                <span className="font-medium">{t("common.quantity", "Quantité")}</span>
                {availableStock > 0 && (
                  <span className="text-nubia-black/50">
                    {locale === "fr" ? "Max" : "Max"}: {availableStock}
                  </span>
                )}
              </div>
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-nubia-gold/30 bg-nubia-white">
                <motion.button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label={locale === "fr" ? "Diminuer la quantite" : "Decrease quantity"}
                  className="inline-flex h-11 w-11 items-center justify-center text-nubia-black transition-colors hover:bg-nubia-gold/10 disabled:opacity-40"
                  disabled={quantity <= 1}
                  whileTap={{ scale: 0.92 }}
                >
                  <span aria-hidden="true" className="text-xl font-semibold leading-none text-nubia-black">-</span>
                </motion.button>
                <span className="w-14 border-x border-nubia-gold/20 text-center font-semibold text-nubia-black">{quantity}</span>
                <motion.button
                  type="button"
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  disabled={quantity >= availableStock}
                  aria-label={locale === "fr" ? "Augmenter la quantite" : "Increase quantity"}
                  className="inline-flex h-11 w-11 items-center justify-center text-nubia-black transition-colors hover:bg-nubia-gold/10 disabled:opacity-40"
                  whileTap={{ scale: 0.92 }}
                >
                  <span aria-hidden="true" className="text-xl font-semibold leading-none text-nubia-black">+</span>
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4"
                >
                  <p className="flex items-center gap-2 font-semibold text-green-700">
                    <CheckCircle2 size={18} />
                    {quantity} {quantity === 1 ? t("product.item_added", "article ajouté") : t("product.items_added", "articles ajoutés")} au panier
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {addError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <p className="font-semibold text-red-700">{addError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-7 flex flex-col gap-3">
              <motion.button
                type="button"
                disabled={(!isAuthenticated && !authLoading) ? false : (!canAdd || adding || cartLoading || availableStock === 0)}
                onClick={handleAddToCart}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={subtleSpring}
                className="group relative inline-flex flex-1 items-center justify-center overflow-hidden rounded-lg border-2 border-nubia-gold bg-nubia-gold px-6 py-3 font-semibold text-nubia-black shadow-gold transition-all duration-300 hover:bg-nubia-white disabled:opacity-60"
              >
                <span className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-nubia-white/30 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />
                <span className="relative inline-flex items-center gap-2">
                  {!isAuthenticated && !authLoading ? (
                    <>
                      <Lock size={18} />
                      {locale === "fr" ? "Se connecter pour ajouter" : "Login to add to cart"}
                    </>
                  ) : availableStock === 0 ? (
                    locale === "fr" ? "Rupture de stock" : "Out of stock"
                  ) : adding || cartLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t("common.loading", "Chargement...")}
                    </>
                  ) : (
                    t("common.add_to_cart", "Ajouter au panier")
                  )}
                </span>
              </motion.button>

              <WishlistButton
                productId={product.id}
                size={24}
                showText={true}
                onAuthRequired={() => setShowAuthModal(true)}
                className="justify-center rounded-lg border border-nubia-gold/30 bg-nubia-white px-4 py-3 text-nubia-black hover:border-nubia-gold hover:bg-nubia-gold/10"
              />
            </div>

            {!inStock && (
              <span className="mt-3 block px-1 text-sm text-red-600">{t("product.out_of_stock", "Rupture de stock")}</span>
            )}

            <div className="mt-6 grid grid-cols-2 gap-2 border-t border-nubia-gold/15 pt-5 text-xs text-nubia-black/65">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={15} className="text-nubia-gold" />
                {locale === "fr" ? "Paiement sécurisé" : "Secure payment"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Timer size={15} className="text-nubia-gold" />
                {locale === "fr" ? "Stock vérifié" : "Verified stock"}
              </span>
            </div>
          </div>
        </motion.aside>
      </section>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={() => {
          setShowAuthModal(false);
          pendingAddToCart.current = true;
        }}
      />

      <ProductReviews productId={product.id} />
    </motion.div>
  );
}
