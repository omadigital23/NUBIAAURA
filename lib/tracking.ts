/**
 * Tracking Service
 * Centralized tracking for analytics events
 */

export type TrackingEvent = 
  | 'page_view'
  | 'product_view'
  | 'product_search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'purchase'
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  | 'newsletter_signup'
  | 'contact_form_submit'
  | 'custom_order_submit'
  | 'filter_products'
  | 'sort_products'
  | 'view_order_details'
  | 'initiate_return'
  | 'share_product';

export interface TrackingEventData {
  event: TrackingEvent;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
}

export interface ProductData {
  product_id: string;
  product_name: string;
  product_category?: string;
  product_price: number;
  product_quantity?: number;
  product_image_url?: string;
}

export interface PurchaseData {
  transaction_id: string;
  value: number;
  currency: string;
  tax?: number;
  shipping?: number;
  items: ProductData[];
  payment_method?: string;
  shipping_method?: string;
}

class TrackingService {
  private sessionId: string;
  private userId: string | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
  }

  /**
   * Initialize tracking with user ID
   */
  public init(userId?: string) {
    if (userId) {
      this.userId = userId;
      this.saveUserId(userId);
    }
    this.logDebug('Tracking initialized', { sessionId: this.sessionId, userId: this.userId });
  }

  /**
   * Track a generic event
   */
  public track(eventData: TrackingEventData) {
    if (!this.isEnabled) return;

    const enrichedData: TrackingEventData = {
      ...eventData,
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      timestamp: eventData.timestamp || Date.now(),
    };

    this.logDebug('Event tracked', enrichedData);
    this.sendToAnalytics(enrichedData);
  }

  /**
   * Track page view
   */
  public trackPageView(pagePath: string, pageTitle?: string) {
    this.track({
      event: 'page_view',
      properties: {
        page_path: pagePath,
        page_title: pageTitle || document.title,
      },
    });
  }

  /**
   * Track product view
   */
  public trackProductView(product: ProductData) {
    this.track({
      event: 'product_view',
      properties: product,
    });
  }

  /**
   * Track product search
   */
  public trackProductSearch(searchTerm: string, resultsCount: number) {
    this.track({
      event: 'product_search',
      properties: {
        search_term: searchTerm,
        results_count: resultsCount,
      },
    });
  }

  /**
   * Track add to cart
   */
  public trackAddToCart(product: ProductData) {
    this.track({
      event: 'add_to_cart',
      properties: product,
    });
  }

  /**
   * Track remove from cart
   */
  public trackRemoveFromCart(product: ProductData) {
    this.track({
      event: 'remove_from_cart',
      properties: product,
    });
  }

  /**
   * Track view cart
   */
  public trackViewCart(itemsCount: number, cartValue: number) {
    this.track({
      event: 'view_cart',
      properties: {
        items_count: itemsCount,
        cart_value: cartValue,
      },
    });
  }

  /**
   * Track begin checkout
   */
  public trackBeginCheckout(itemsCount: number, value: number) {
    this.track({
      event: 'begin_checkout',
      properties: {
        items_count: itemsCount,
        value,
      },
    });
  }

  /**
   * Track add shipping info
   */
  public trackAddShippingInfo(shippingMethod: string, shippingCost: number) {
    this.track({
      event: 'add_shipping_info',
      properties: {
        shipping_method: shippingMethod,
        shipping_cost: shippingCost,
      },
    });
  }

  /**
   * Track add payment info
   */
  public trackAddPaymentInfo(paymentMethod: string) {
    this.track({
      event: 'add_payment_info',
      properties: {
        payment_method: paymentMethod,
      },
    });
  }

  /**
   * Track purchase
   */
  public trackPurchase(purchaseData: PurchaseData) {
    this.track({
      event: 'purchase',
      properties: purchaseData,
    });
  }

  /**
   * Track user signup
   */
  public trackUserSignup(email?: string) {
    this.track({
      event: 'user_signup',
      properties: {
        email: email || undefined,
      },
    });
  }

  /**
   * Track user login
   */
  public trackUserLogin(email?: string) {
    this.track({
      event: 'user_login',
      properties: {
        email: email || undefined,
      },
    });
  }

  /**
   * Track user logout
   */
  public trackUserLogout() {
    this.track({
      event: 'user_logout',
    });
  }

  /**
   * Track newsletter signup
   */
  public trackNewsletterSignup(email?: string) {
    this.track({
      event: 'newsletter_signup',
      properties: {
        email: email || undefined,
      },
    });
  }

  /**
   * Track contact form submission
   */
  public trackContactFormSubmit(subject?: string) {
    this.track({
      event: 'contact_form_submit',
      properties: {
        subject: subject || undefined,
      },
    });
  }

  /**
   * Track custom order submission
   */
  public trackCustomOrderSubmit(category?: string) {
    this.track({
      event: 'custom_order_submit',
      properties: {
        category: category || undefined,
      },
    });
  }

  /**
   * Track filter products
   */
  public trackFilterProducts(filters: Record<string, any>) {
    this.track({
      event: 'filter_products',
      properties: filters,
    });
  }

  /**
   * Track sort products
   */
  public trackSortProducts(sortBy: string) {
    this.track({
      event: 'sort_products',
      properties: {
        sort_by: sortBy,
      },
    });
  }

  /**
   * Track view order details
   */
  public trackViewOrderDetails(orderId: string, orderValue: number) {
    this.track({
      event: 'view_order_details',
      properties: {
        order_id: orderId,
        order_value: orderValue,
      },
    });
  }

  /**
   * Track initiate return
   */
  public trackInitiateReturn(orderId: string, reason?: string) {
    this.track({
      event: 'initiate_return',
      properties: {
        order_id: orderId,
        reason: reason || undefined,
      },
    });
  }

  /**
   * Track share product
   */
  public trackShareProduct(productId: string, platform?: string) {
    this.track({
      event: 'share_product',
      properties: {
        product_id: productId,
        platform: platform || 'unknown',
      },
    });
  }

  /**
   * Set user ID
   */
  public setUserId(userId: string) {
    this.userId = userId;
    this.saveUserId(userId);
  }

  /**
   * Clear user ID
   */
  public clearUserId() {
    this.userId = null;
    localStorage.removeItem('tracking_user_id');
  }

  /**
   * Enable/disable tracking
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Get session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get user ID
   */
  public getUserId(): string | null {
    return this.userId;
  }

  // Private methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveUserId(userId: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tracking_user_id', userId);
    }
  }

  private loadUserId() {
    if (typeof window !== 'undefined') {
      this.userId = localStorage.getItem('tracking_user_id');
    }
  }

  private sendToAnalytics(data: TrackingEventData) {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', data.event, {
        ...data.properties,
        session_id: data.sessionId,
        user_id: data.userId,
      });
    }

    // Send to custom backend (optional)
    this.sendToBackend(data);
  }

  private async sendToBackend(data: TrackingEventData) {
    try {
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      this.logDebug('Failed to send tracking to backend', error);
    }
  }

  private logDebug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Tracking] ${message}`, data);
    }
  }
}

// Export singleton instance
export const tracking = new TrackingService();
