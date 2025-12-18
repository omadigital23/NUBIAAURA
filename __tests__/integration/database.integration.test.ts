/**
 * 🧪 Database Integration Tests
 * Tests the real Supabase database schema and operations
 * 
 * Run: npm run test:integration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
function loadEnvFile() {
    const envPath = path.resolve(__dirname, '../../.env.local');
    if (!fs.existsSync(envPath)) {
        console.warn('Warning: .env.local not found at', envPath);
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmed.substring(0, equalIndex);
                const value = trimmed.substring(equalIndex + 1).replace(/^['"]|['"]$/g, '');
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    });
}

// Load env at module level
loadEnvFile();

// Get Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if no Supabase config
const canRunTests = supabaseUrl && supabaseServiceKey &&
    supabaseUrl !== 'https://test.supabase.co' &&
    supabaseServiceKey !== 'test-service-role-key';

// Create admin client (bypasses RLS)
let supabaseAdmin: SupabaseClient | null = null;
if (canRunTests) {
    supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

const TEST_PREFIX = 'TEST_INT_';

// Conditionally run tests
const describeIfSupabase = canRunTests ? describe : describe.skip;

describeIfSupabase('🧪 Database Integration Tests', () => {

    describe('Schema Validation', () => {

        it('should connect to Supabase', async () => {
            const { error } = await supabaseAdmin!
                .from('products')
                .select('id')
                .limit(1);

            expect(error).toBeNull();
        });

        it('should have products table with all required columns', async () => {
            const { data, error } = await supabaseAdmin!
                .from('products')
                .select('id, slug, name, price, category, stock, image, inStock, name_fr, name_en')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should have orders table with required columns', async () => {
            const { data, error } = await supabaseAdmin!
                .from('orders')
                .select('id, order_number, user_id, total, status, payment_status')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should have users table with required columns', async () => {
            const { data, error } = await supabaseAdmin!
                .from('users')
                .select('id, email, full_name, first_name, last_name, phone')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should have carts table', async () => {
            const { data, error } = await supabaseAdmin!
                .from('carts')
                .select('id, user_id')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should have promo_codes table', async () => {
            const { data, error } = await supabaseAdmin!
                .from('promo_codes')
                .select('id, code, discount_type, discount_value, is_active')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should have categories table', async () => {
            const { data, error } = await supabaseAdmin!
                .from('categories')
                .select('id, slug, name')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should have product_reviews table', async () => {
            const { data, error } = await supabaseAdmin!
                .from('product_reviews')
                .select('id, product_id, user_id, rating')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should have wishlists table', async () => {
            const { data, error } = await supabaseAdmin!
                .from('wishlists')
                .select('id, user_id')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should have addresses table', async () => {
            const { data, error } = await supabaseAdmin!
                .from('addresses')
                .select('id, user_id, city, country')
                .limit(1);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });
    });

    describe('Product Operations', () => {
        let testProductId: string;

        afterAll(async () => {
            // Cleanup test products
            if (supabaseAdmin) {
                await supabaseAdmin
                    .from('products')
                    .delete()
                    .ilike('name', `${TEST_PREFIX}%`);
            }
        });

        it('should create a product', async () => {
            const { data: product, error } = await supabaseAdmin!
                .from('products')
                .insert({
                    name: `${TEST_PREFIX}Product_${Date.now()}`,
                    slug: `test-product-${Date.now()}`,
                    price: 75000,
                    category: 'test',
                    stock: 5,
                    image: 'https://placehold.co/400',
                    inStock: true,
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(product).toBeDefined();
            expect(product.price).toBe(75000);
            expect(product.stock).toBe(5);

            testProductId = product.id;
        });

        it('should read a product', async () => {
            expect(testProductId).toBeDefined();

            const { data: product, error } = await supabaseAdmin!
                .from('products')
                .select('*')
                .eq('id', testProductId)
                .single();

            expect(error).toBeNull();
            expect(product.id).toBe(testProductId);
        });

        it('should update a product', async () => {
            expect(testProductId).toBeDefined();

            const { data: product, error } = await supabaseAdmin!
                .from('products')
                .update({ price: 80000 })
                .eq('id', testProductId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(product.price).toBe(80000);
        });

        it('should delete a product', async () => {
            expect(testProductId).toBeDefined();

            const { error } = await supabaseAdmin!
                .from('products')
                .delete()
                .eq('id', testProductId);

            expect(error).toBeNull();

            // Verify deletion
            const { data } = await supabaseAdmin!
                .from('products')
                .select('id')
                .eq('id', testProductId)
                .single();

            expect(data).toBeNull();
        });

        it('should reject negative stock', async () => {
            const { error } = await supabaseAdmin!
                .from('products')
                .insert({
                    name: `${TEST_PREFIX}BadStock`,
                    slug: `test-bad-stock-${Date.now()}`,
                    price: 1000,
                    category: 'test',
                    stock: -5, // Invalid
                    image: 'https://placehold.co/400',
                });

            expect(error).not.toBeNull();
        });
    });

    describe('Order Queries', () => {
        it('should fetch orders with items', async () => {
            const { data, error } = await supabaseAdmin!
                .from('orders')
                .select(`
          id,
          order_number,
          total,
          status,
          order_items (
            id,
            product_id,
            quantity,
            price
          )
        `)
                .limit(3);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should filter orders by status', async () => {
            const { data, error } = await supabaseAdmin!
                .from('orders')
                .select('*')
                .eq('status', 'pending')
                .limit(5);

            expect(error).toBeNull();
            if (data && data.length > 0) {
                expect(data.every(o => o.status === 'pending')).toBe(true);
            }
        });
    });

    describe('Promo Code Operations', () => {
        let testPromoId: string;

        afterAll(async () => {
            if (supabaseAdmin) {
                await supabaseAdmin
                    .from('promo_codes')
                    .delete()
                    .ilike('code', `${TEST_PREFIX}%`);
            }
        });

        it('should create a promo code', async () => {
            const { data: promo, error } = await supabaseAdmin!
                .from('promo_codes')
                .insert({
                    code: `${TEST_PREFIX}CODE_${Date.now()}`,
                    discount_type: 'percentage',
                    discount_value: 15,
                    is_active: true,
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(promo.discount_value).toBe(15);
            testPromoId = promo.id;
        });

        it('should validate unique code constraint', async () => {
            const code = `${TEST_PREFIX}UNIQUE_${Date.now()}`;

            // First insert
            await supabaseAdmin!
                .from('promo_codes')
                .insert({ code, discount_type: 'fixed', discount_value: 1000, is_active: true });

            // Duplicate should fail
            const { error } = await supabaseAdmin!
                .from('promo_codes')
                .insert({ code, discount_type: 'fixed', discount_value: 1000, is_active: true });

            expect(error).not.toBeNull();
        });

        it('should reject negative discount', async () => {
            const { error } = await supabaseAdmin!
                .from('promo_codes')
                .insert({
                    code: `${TEST_PREFIX}NEG_${Date.now()}`,
                    discount_type: 'percentage',
                    discount_value: -10, // Invalid
                    is_active: true,
                });

            expect(error).not.toBeNull();
        });
    });
});

// Fallback test when Supabase is not configured
if (!canRunTests) {
    describe('Integration Tests Skipped', () => {
        it('should skip when Supabase is not configured', () => {
            console.log('⚠️ Integration tests skipped: Real Supabase credentials required');
            console.log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
            expect(true).toBe(true);
        });
    });
}
