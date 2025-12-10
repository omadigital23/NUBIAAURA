import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
const BUCKET = 'products';
const BASE_PATH = 'images';

async function listRecursive(path = '', depth = 0, maxDepth = 15) {
  if (depth > maxDepth) return [];
  
  try {
    const { data, error } = await supabase.storage.from(BUCKET).list(path, { limit: 1000 });
    if (error) {
      console.error(`Error listing ${path}:`, error.message);
      return [];
    }

    const results = [];
    const items = data || [];

    for (const item of items) {
      if (!item.name) continue;
      
      const itemPath = path ? `${path}/${item.name}` : item.name;
      const isFile = (item.metadata?.size || 0) > 0;
      
      if (isFile) {
        results.push({
          type: 'file',
          path: itemPath,
          name: item.name,
          size: item.metadata?.size || 0,
        });
      } else {
        // It's a folder
        results.push({
          type: 'folder',
          path: itemPath,
          name: item.name,
        });
        
        // Recurse into folder
        const subResults = await listRecursive(itemPath, depth + 1, maxDepth);
        results.push(...subResults);
      }
    }
    
    return results;
  } catch (e) {
    console.error(`Exception listing ${path}:`, e.message);
    return [];
  }
}

async function run() {
  console.log(`\n📂 Mapping bucket '${BUCKET}' starting from '${BASE_PATH}'...\n`);
  
  const allItems = await listRecursive(BASE_PATH);
  
  // Group by product folder
  const productFolders = new Map();
  
  for (const item of allItems) {
    if (item.type === 'file') {
      // Extract product folder from path
      // Path: images/robes/soiree/longues/robe-soiree-longue-rouge-classique/petite/01-main.jpg
      const parts = item.path.split('/').filter(Boolean);
      
      // Find product folder (before variant like petite/moyenne/grande)
      const variantNames = ['petite', 'moyenne', 'grande', 'small', 'medium', 'large'];
      let productFolderIdx = parts.length - 2;
      if (!variantNames.includes(parts[parts.length - 2])) {
        productFolderIdx = parts.length - 1;
      }
      
      const productFolder = parts.slice(0, productFolderIdx + 1).join('/');
      const category = parts[1];
      const productName = parts[productFolderIdx];
      const variant = parts[productFolderIdx + 1] || 'default';
      
      if (!productFolders.has(productFolder)) {
        productFolders.set(productFolder, {
          category,
          productName,
          variants: new Map(),
        });
      }
      
      const product = productFolders.get(productFolder);
      if (!product.variants.has(variant)) {
        product.variants.set(variant, []);
      }
      product.variants.get(variant).push({
        file: item.name,
        path: item.path,
        size: item.size,
      });
    }
  }
  
  // Display summary
  console.log(`📊 BUCKET MAPPING SUMMARY\n`);
  console.log(`Total product folders: ${productFolders.size}\n`);
  
  const categoryMap = new Map();
  for (const [folder, product] of productFolders) {
    if (!categoryMap.has(product.category)) {
      categoryMap.set(product.category, []);
    }
    categoryMap.get(product.category).push(product);
  }
  
  for (const [category, products] of categoryMap) {
    console.log(`\n🏷️  CATEGORY: ${category}`);
    console.log(`   Products: ${products.length}`);
    
    for (const product of products.slice(0, 3)) { // Show first 3 products per category
      console.log(`\n   📦 ${product.productName}`);
      for (const [variant, files] of product.variants) {
        console.log(`      └─ Variant: ${variant}`);
        for (const file of files) {
          console.log(`         • ${file.file}`);
        }
      }
    }
    
    if (products.length > 3) {
      console.log(`\n   ... and ${products.length - 3} more products`);
    }
  }
  
  // Statistics
  console.log(`\n\n📈 STATISTICS\n`);
  console.log(`Categories: ${categoryMap.size}`);
  console.log(`Total products: ${productFolders.size}`);
  
  let totalVariants = 0;
  let totalFiles = 0;
  let filesBy01 = 0, filesBy02 = 0, filesBy03 = 0, filesOther = 0;
  
  for (const [, product] of productFolders) {
    totalVariants += product.variants.size;
    for (const [, files] of product.variants) {
      totalFiles += files.length;
      for (const file of files) {
        if (file.file.match(/^01-/)) filesBy01++;
        else if (file.file.match(/^02-/)) filesBy02++;
        else if (file.file.match(/^03-/)) filesBy03++;
        else filesOther++;
      }
    }
  }
  
  console.log(`Total variants: ${totalVariants}`);
  console.log(`Total files: ${totalFiles}`);
  console.log(`  - 01-main.*: ${filesBy01}`);
  console.log(`  - 02-back.*: ${filesBy02}`);
  console.log(`  - 03-detail.*: ${filesBy03}`);
  console.log(`  - Other: ${filesOther}`);
  
  console.log(`\n✅ Mapping complete!\n`);
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
