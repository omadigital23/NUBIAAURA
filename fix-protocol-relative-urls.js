// Fix protocol-relative URLs in database
// This script finds and fixes any URLs starting with // in the products table

require('dotenv').config({ path: '.env.local', override: true });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

(async () => {
    console.log('Searching for protocol-relative URLs in products table...\n');

    // Fetch all products
    const { data: products, error } = await supabase
        .from('products')
        .select('id, slug, image, image_url, product_images(id, url)');

    if (error) {
        console.error('Error fetching products:', error.message);
        process.exit(1);
    }

    const updates = [];
    const productImageUpdates = [];

    for (const product of products) {
        let needsUpdate = false;
        const update = { id: product.id };

        // Check and fix image field
        if (product.image && product.image.startsWith('//')) {
            update.image = 'https:' + product.image;
            needsUpdate = true;
            console.log(`[${product.slug}] Fixing image: ${product.image} -> ${update.image}`);
        }

        // Check and fix image_url field
        if (product.image_url && product.image_url.startsWith('//')) {
            update.image_url = 'https:' + product.image_url;
            needsUpdate = true;
            console.log(`[${product.slug}] Fixing image_url: ${product.image_url} -> ${update.image_url}`);
        }

        if (needsUpdate) {
            updates.push(update);
        }

        // Check product_images
        if (product.product_images && Array.isArray(product.product_images)) {
            for (const img of product.product_images) {
                if (img.url && img.url.startsWith('//')) {
                    const fixedUrl = 'https:' + img.url;
                    productImageUpdates.push({ id: img.id, url: fixedUrl });
                    console.log(`[${product.slug}] Fixing product_images.url: ${img.url} -> ${fixedUrl}`);
                }
            }
        }
    }

    console.log(`\nFound ${updates.length} products with protocol-relative URLs in image/image_url`);
    console.log(`Found ${productImageUpdates.length} product_images with protocol-relative URLs\n`);

    if (updates.length === 0 && productImageUpdates.length === 0) {
        console.log('No protocol-relative URLs found. Database is clean!');
        process.exit(0);
    }

    // Update products table
    if (updates.length > 0) {
        console.log('Updating products table...');
        for (const update of updates) {
            const { error } = await supabase
                .from('products')
                .update(update)
                .eq('id', update.id);

            if (error) {
                console.error(`Error updating product ${update.id}:`, error.message);
            }
        }
        console.log(`✓ Updated ${updates.length} products`);
    }

    // Update product_images table
    if (productImageUpdates.length > 0) {
        console.log('Updating product_images table...');
        for (const update of productImageUpdates) {
            const { error } = await supabase
                .from('product_images')
                .update({ url: update.url })
                .eq('id', update.id);

            if (error) {
                console.error(`Error updating product_image ${update.id}:`, error.message);
            }
        }
        console.log(`✓ Updated ${productImageUpdates.length} product_images`);
    }

    console.log('\n✓ All protocol-relative URLs have been fixed!');
})();
