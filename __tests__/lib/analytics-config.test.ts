/**
 * @jest-environment jsdom
 */
import { trackProductView, trackAddToCart, trackPurchase, trackBeginCheckout } from '@/lib/analytics-config';

// Mock window.gtag
const mockGtag = jest.fn();
(global as any).window = {
    gtag: mockGtag,
};

describe('analytics-config', () => {
    beforeEach(() => {
        mockGtag.mockClear();
        process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123';
    });

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    });

    describe('trackProductView', () => {
        it('should track product view event with correct parameters', () => {
            const product = {
                id: 'prod-123',
                name: 'Test Product',
                price: 50000,
                category: 'clothing',
            };

            trackProductView(product);

            expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', {
                currency: 'XOF',
                value: 50000,
                items: [
                    {
                        item_id: 'prod-123',
                        item_name: 'Test Product',
                        item_category: 'clothing',
                        item_brand: 'NUBIA AURA',
                        price: 50000,
                    },
                ],
            });
        });

        it('should handle optional fields', () => {
            const product = {
                id: 'prod-456',
                name: 'Another Product',
                price: 25000,
            };

            trackProductView(product);

            expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', {
                currency: 'XOF',
                value: 25000,
                items: [
                    expect.objectContaining({
                        item_id: 'prod-456',
                        item_name: 'Another Product',
                        item_category: '',
                        price: 25000,
                    }),
                ],
            });
        });
    });

    describe('trackAddToCart', () => {
        it('should track add to cart event with correct parameters', () => {
            const product = {
                id: 'prod-789',
                name: 'Cart Product',
                price: 75000,
                quantity: 2,
                category: 'accessories',
            };

            trackAddToCart(product);

            expect(mockGtag).toHaveBeenCalledWith('event', 'add_to_cart', {
                currency: 'XOF',
                value: 150000, // price * quantity
                items: [
                    {
                        item_id: 'prod-789',
                        item_name: 'Cart Product',
                        item_category: 'accessories',
                        price: 75000,
                        quantity: 2,
                    },
                ],
            });
        });
    });

    describe('trackBeginCheckout', () => {
        it('should track begin checkout event with multiple items', () => {
            const items = [
                { id: 'prod-1', name: 'Item 1', price: 10000, quantity: 1 },
                { id: 'prod-2', name: 'Item 2', price: 20000, quantity: 2 },
            ];

            trackBeginCheckout({
                value: 50000,
                items,
            });

            expect(mockGtag).toHaveBeenCalledWith('event', 'begin_checkout', {
                currency: 'XOF',
                value: 50000,
                items: [
                    { item_id: 'prod-1', item_name: 'Item 1', price: 10000, quantity: 1 },
                    { item_id: 'prod-2', item_name: 'Item 2', price: 20000, quantity: 2 },
                ],
            });
        });
    });

    describe('trackPurchase', () => {
        it('should track purchase event with transaction details', () => {
            const items = [
                { id: 'prod-1', name: 'Item 1', price: 30000, quantity: 1 },
            ];

            trackPurchase({
                transaction_id: 'ORDER-123',
                value: 40000,
                tax: 5000,
                shipping: 5000,
                items,
            });

            expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
                currency: 'XOF',
                transaction_id: 'ORDER-123',
                value: 40000,
                tax: 5000,
                shipping: 5000,
                items: [
                    { item_id: 'prod-1', item_name: 'Item 1', price: 30000, quantity: 1 },
                ],
            });
        });
    });

    describe('when GA is not configured', () => {
        beforeEach(() => {
            delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
            mockGtag.mockClear();
        });

        it('should not call gtag when GA is disabled', () => {
            trackProductView({
                id: 'prod-test',
                name: 'Test',
                price: 1000,
            });

            expect(mockGtag).not.toHaveBeenCalled();
        });
    });
});
