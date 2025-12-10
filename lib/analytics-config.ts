/**
 * Google Analytics 4 Configuration for NUBIA AURA
 * 
 * Centralized GA4 event tracking configuration
 */

// Check if GA is enabled
export const isGAEnabled = () => {
    return !!(typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
};

/**
 * GA4 Event Names (Standard E-commerce Events)
 */
export const GA4Events = {
    // Page views
    PAGE_VIEW: 'page_view',

    // Product events
    VIEW_ITEM: 'view_item',
    VIEW_ITEM_LIST: 'view_item_list',
    SELECT_ITEM: 'select_item',

    // Cart events
    ADD_TO_CART: 'add_to_cart',
    REMOVE_FROM_CART: 'remove_from_cart',
    VIEW_CART: 'view_cart',

    // Checkout events
    BEGIN_CHECKOUT: 'begin_checkout',
    ADD_SHIPPING_INFO: 'add_shipping_info',
    ADD_PAYMENT_INFO: 'add_payment_info',
    PURCHASE: 'purchase',

    // Search events
    SEARCH: 'search',

    // User events  
    SIGN_UP: 'sign_up',
    LOGIN: 'login',

    // Engagement
    SELECT_PROMOTION: 'select_promotion',
    VIEW_PROMOTION: 'view_promotion',

    // Custom events
    SHARE: 'share',
    FILTER: 'filter_products',
    SORT: 'sort_products',
} as const;

/**
 * Track GA4 event
 */
export function trackGA4Event(eventName: string, params?: Record<string, any>) {
    if (!isGAEnabled()) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[GA4] Event (dev only):', eventName, params);
        }
        return;
    }

    try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', eventName, params);
        }
    } catch (error) {
        console.error('[GA4] Error tracking event:', error);
    }
}

/**
 * Track page view
 */
export function trackPageView(url: string, title?: string) {
    trackGA4Event(GA4Events.PAGE_VIEW, {
        page_title: title || document.title,
        page_location: url,
        page_path: new URL(url).pathname,
    });
}

/**
 * Track product view
 */
export function trackProductView(product: {
    id: string;
    name: string;
    price: number;
    category?: string;
    brand?: string;
}) {
    trackGA4Event(GA4Events.VIEW_ITEM, {
        currency: 'XOF',
        value: product.price,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                item_category: product.category || '',
                item_brand: product.brand || 'NUBIA AURA',
                price: product.price,
            },
        ],
    });
}

/**
 * Track add to cart
 */
export function trackAddToCart(product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
}) {
    trackGA4Event(GA4Events.ADD_TO_CART, {
        currency: 'XOF',
        value: product.price * product.quantity,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                item_category: product.category || '',
                price: product.price,
                quantity: product.quantity,
            },
        ],
    });
}

/**
 * Track remove from cart
 */
export function trackRemoveFromCart(product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
}) {
    trackGA4Event(GA4Events.REMOVE_FROM_CART, {
        currency: 'XOF',
        value: product.price * product.quantity,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                price: product.price,
                quantity: product.quantity,
            },
        ],
    });
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(params: {
    value: number;
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
}) {
    trackGA4Event(GA4Events.BEGIN_CHECKOUT, {
        currency: 'XOF',
        value: params.value,
        items: params.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    });
}

/**
 * Track add shipping info
 */
export function trackAddShippingInfo(params: {
    value: number;
    shipping_tier: string;
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
}) {
    trackGA4Event(GA4Events.ADD_SHIPPING_INFO, {
        currency: 'XOF',
        value: params.value,
        shipping_tier: params.shipping_tier,
        items: params.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    });
}

/**
 * Track add payment info
 */
export function trackAddPaymentInfo(params: {
    value: number;
    payment_type: string;
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
}) {
    trackGA4Event(GA4Events.ADD_PAYMENT_INFO, {
        currency: 'XOF',
        value: params.value,
        payment_type: params.payment_type,
        items: params.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    });
}

/**
 * Track purchase
 */
export function trackPurchase(params: {
    transaction_id: string;
    value: number;
    tax?: number;
    shipping?: number;
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
}) {
    trackGA4Event(GA4Events.PURCHASE, {
        currency: 'XOF',
        transaction_id: params.transaction_id,
        value: params.value,
        tax: params.tax || 0,
        shipping: params.shipping || 0,
        items: params.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string, results?: number) {
    trackGA4Event(GA4Events.SEARCH, {
        search_term: searchTerm,
        ...(results !== undefined && { search_results: results }),
    });
}

/**
 * Track filter
 */
export function trackFilter(filterType: string, filterValue: string) {
    trackGA4Event(GA4Events.FILTER, {
        filter_type: filterType,
        filter_value: filterValue,
    });
}

/**
 * Track sort
 */
export function trackSort(sortType: string) {
    trackGA4Event(GA4Events.SORT, {
        sort_type: sortType,
    });
}

/**
 * Track sign up
 */
export function trackSignUp(method: string = 'email') {
    trackGA4Event(GA4Events.SIGN_UP, {
        method,
    });
}

/**
 * Track login
 */
export function trackLogin(method: string = 'email') {
    trackGA4Event(GA4Events.LOGIN, {
        method,
    });
}

/**
 * Track share
 */
export function trackShare(params: {
    content_type: string;
    item_id: string;
    method: string;
}) {
    trackGA4Event(GA4Events.SHARE, params);
}
