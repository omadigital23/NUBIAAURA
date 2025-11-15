'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { tracking } from '@/lib/tracking';
import type { TrackingEventData, ProductData, PurchaseData } from '@/lib/tracking';

/**
 * Hook for tracking user interactions
 * Automatically tracks page views and provides methods for custom events
 */
export function useTracking() {
  const pathname = usePathname();

  // Track page views automatically
  useEffect(() => {
    tracking.trackPageView(pathname);
  }, [pathname]);

  return {
    // Generic tracking
    track: (eventData: TrackingEventData) => tracking.track(eventData),

    // Page tracking
    trackPageView: (pagePath: string, pageTitle?: string) =>
      tracking.trackPageView(pagePath, pageTitle),

    // Product tracking
    trackProductView: (product: ProductData) => tracking.trackProductView(product),
    trackProductSearch: (searchTerm: string, resultsCount: number) =>
      tracking.trackProductSearch(searchTerm, resultsCount),
    trackFilterProducts: (filters: Record<string, any>) =>
      tracking.trackFilterProducts(filters),
    trackSortProducts: (sortBy: string) => tracking.trackSortProducts(sortBy),
    trackShareProduct: (productId: string, platform?: string) =>
      tracking.trackShareProduct(productId, platform),

    // Cart tracking
    trackAddToCart: (product: ProductData) => tracking.trackAddToCart(product),
    trackRemoveFromCart: (product: ProductData) => tracking.trackRemoveFromCart(product),
    trackViewCart: (itemsCount: number, cartValue: number) =>
      tracking.trackViewCart(itemsCount, cartValue),

    // Checkout tracking
    trackBeginCheckout: (itemsCount: number, value: number) =>
      tracking.trackBeginCheckout(itemsCount, value),
    trackAddShippingInfo: (shippingMethod: string, shippingCost: number) =>
      tracking.trackAddShippingInfo(shippingMethod, shippingCost),
    trackAddPaymentInfo: (paymentMethod: string) =>
      tracking.trackAddPaymentInfo(paymentMethod),
    trackPurchase: (purchaseData: PurchaseData) => tracking.trackPurchase(purchaseData),

    // User tracking
    trackUserSignup: (email?: string) => tracking.trackUserSignup(email),
    trackUserLogin: (email?: string) => tracking.trackUserLogin(email),
    trackUserLogout: () => tracking.trackUserLogout(),

    // Form tracking
    trackNewsletterSignup: (email?: string) => tracking.trackNewsletterSignup(email),
    trackContactFormSubmit: (subject?: string) => tracking.trackContactFormSubmit(subject),
    trackCustomOrderSubmit: (category?: string) => tracking.trackCustomOrderSubmit(category),

    // Order tracking
    trackViewOrderDetails: (orderId: string, orderValue: number) =>
      tracking.trackViewOrderDetails(orderId, orderValue),
    trackInitiateReturn: (orderId: string, reason?: string) =>
      tracking.trackInitiateReturn(orderId, reason),

    // Session management
    setUserId: (userId: string) => tracking.setUserId(userId),
    clearUserId: () => tracking.clearUserId(),
    getSessionId: () => tracking.getSessionId(),
    getUserId: () => tracking.getUserId(),
  };
}
