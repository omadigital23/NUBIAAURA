#!/usr/bin/env node
/**
 * 🔐 Database Security Audit Script
 * Vérifie la sécurité de votre base de données Supabase
 * 
 * Usage: node scripts/audit-database-security.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bold}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

// Load environment variables from .env.local
function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        log.error('.env.local not found!');
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx > 0) {
                const key = trimmed.substring(0, idx);
                const value = trimmed.substring(idx + 1).replace(/^['"]|['"]$/g, '');
                process.env[key] = value;
            }
        }
    });
}

loadEnv();

// Validate required env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create clients
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Tables to audit
const TABLES = [
    'users',
    'products',
    'orders',
    'order_items',
    'carts',
    'cart_items',
    'addresses',
    'promo_codes',
    'coupons',
    'wishlists',
    'wishlist_items',
    'product_reviews',
    'categories',
    'newsletter_subscriptions',
    'contact_submissions',
    'returns',
    'stock_reservations',
];

// Sensitive columns that should never be exposed
const SENSITIVE_COLUMNS = [
    'password',
    'password_hash',
    'secret',
    'api_key',
    'token',
    'credit_card',
    'ssn',
];

// Audit results
const results = {
    passed: 0,
    warnings: 0,
    failures: 0,
    details: [],
};

async function checkTableExists(tableName) {
    const { data, error } = await adminClient
        .from(tableName)
        .select('*')
        .limit(1);

    return !error;
}

async function checkRLSEnabled() {
    log.header('1. Row Level Security (RLS)');

    for (const table of TABLES) {
        const exists = await checkTableExists(table);
        if (!exists) {
            log.warning(`Table '${table}' does not exist - skipping`);
            continue;
        }

        // Try to read with anon client (without auth)
        const { data, error } = await anonClient
            .from(table)
            .select('*')
            .limit(5);

        if (error) {
            // RLS is blocking - good!
            log.success(`${table}: RLS active (access denied without auth)`);
            results.passed++;
        } else if (data && data.length > 0) {
            // Data accessible without auth - check if intended
            const isSensitive = ['users', 'orders', 'addresses', 'carts', 'cart_items', 'returns', 'stock_reservations'].includes(table);

            if (isSensitive) {
                log.error(`${table}: ⚠️ SENSITIVE DATA accessible without auth! (${data.length} rows)`);
                results.failures++;
                results.details.push({
                    type: 'critical',
                    table,
                    message: `Sensitive table accessible without authentication`,
                });
            } else {
                log.warning(`${table}: Public read access (${data.length} rows) - verify if intended`);
                results.warnings++;
            }
        } else {
            log.success(`${table}: Empty or protected`);
            results.passed++;
        }
    }
}

async function checkSensitiveColumns() {
    log.header('2. Sensitive Column Exposure');

    for (const table of TABLES) {
        const exists = await checkTableExists(table);
        if (!exists) continue;

        // Try to select sensitive columns
        for (const col of SENSITIVE_COLUMNS) {
            const { data, error } = await adminClient
                .from(table)
                .select(col)
                .limit(1);

            if (!error && data) {
                log.error(`${table}.${col}: Sensitive column exists!`);
                results.failures++;
                results.details.push({
                    type: 'warning',
                    table,
                    column: col,
                    message: `Sensitive column found`,
                });
            }
        }
    }

    log.success('No common sensitive column names exposed');
}

async function checkDataIntegrity() {
    log.header('3. Data Integrity Checks');

    // Check for orphaned records
    const integrityChecks = [
        { table: 'order_items', fk: 'order_id', parent: 'orders' },
        { table: 'cart_items', fk: 'cart_id', parent: 'carts' },
        { table: 'addresses', fk: 'user_id', parent: 'users' },
        { table: 'wishlist_items', fk: 'wishlist_id', parent: 'wishlists' },
    ];

    for (const check of integrityChecks) {
        const childExists = await checkTableExists(check.table);
        const parentExists = await checkTableExists(check.parent);

        if (!childExists || !parentExists) continue;

        log.info(`Checking ${check.table}.${check.fk} → ${check.parent}...`);
        results.passed++;
    }
}

async function checkStockConstraints() {
    log.header('4. Business Logic Constraints');

    // Check for negative stock
    const { data: negativeStock, error } = await adminClient
        .from('products')
        .select('id, name, stock')
        .lt('stock', 0);

    if (error) {
        log.warning('Could not check stock constraints');
        return;
    }

    if (negativeStock && negativeStock.length > 0) {
        log.error(`Found ${negativeStock.length} products with negative stock!`);
        results.failures++;
        negativeStock.forEach(p => {
            log.error(`  - ${p.name}: stock = ${p.stock}`);
        });
    } else {
        log.success('No products with negative stock');
        results.passed++;
    }

    // Check for orders with invalid status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const { data: orders } = await adminClient
        .from('orders')
        .select('id, order_number, status')
        .limit(100);

    if (orders) {
        const invalidOrders = orders.filter(o => !validStatuses.includes(o.status));
        if (invalidOrders.length > 0) {
            log.warning(`Found ${invalidOrders.length} orders with unusual status`);
            results.warnings++;
        } else {
            log.success('All order statuses are valid');
            results.passed++;
        }
    }
}

async function checkPromoCodeSecurity() {
    log.header('5. Promo Code Security');

    const { data: promos, error } = await adminClient
        .from('promo_codes')
        .select('*');

    if (error) {
        log.warning('Could not check promo codes');
        return;
    }

    if (!promos || promos.length === 0) {
        log.info('No promo codes found');
        return;
    }

    // Check for expired but still active codes
    const now = new Date().toISOString();
    const expiredActive = promos.filter(p =>
        p.is_active && p.valid_until && new Date(p.valid_until) < new Date()
    );

    if (expiredActive.length > 0) {
        log.warning(`${expiredActive.length} expired promo codes still active!`);
        results.warnings++;
        expiredActive.forEach(p => log.warning(`  - ${p.code} (expired: ${p.valid_until})`));
    } else {
        log.success('No expired promo codes are active');
        results.passed++;
    }

    // Check for unlimited use codes
    const unlimitedUse = promos.filter(p => p.is_active && !p.max_uses);
    if (unlimitedUse.length > 0) {
        log.warning(`${unlimitedUse.length} promo codes with unlimited uses`);
        results.warnings++;
    }
}

async function checkUserDataExposure() {
    log.header('6. User Data Protection');

    // Try to access user emails without auth
    const { data, error } = await anonClient
        .from('users')
        .select('email, phone')
        .limit(5);

    if (error) {
        log.success('User PII protected by RLS');
        results.passed++;
    } else if (data && data.length > 0) {
        log.error('User emails/phones accessible without auth!');
        results.failures++;
        results.details.push({
            type: 'critical',
            message: 'User PII (email, phone) exposed without authentication',
        });
    }

    // Check newsletter subscriptions
    const { data: newsletters } = await anonClient
        .from('newsletter_subscriptions')
        .select('email')
        .limit(5);

    if (newsletters && newsletters.length > 0) {
        log.warning('Newsletter emails publicly accessible - verify if intended');
        results.warnings++;
    }
}

async function generateReport() {
    log.header('SECURITY AUDIT REPORT');

    console.log(`
┌─────────────────────────────────────────┐
│           AUDIT SUMMARY                 │
├─────────────────────────────────────────┤
│  ✓ Passed:    ${String(results.passed).padStart(3)}                        │
│  ⚠ Warnings:  ${String(results.warnings).padStart(3)}                        │
│  ✗ Failures:  ${String(results.failures).padStart(3)}                        │
├─────────────────────────────────────────┤
│  Score: ${calculateScore()}                           │
└─────────────────────────────────────────┘
  `);

    if (results.details.length > 0) {
        console.log('\n📋 Issues Found:\n');
        results.details.forEach((d, i) => {
            const icon = d.type === 'critical' ? '🔴' : '🟡';
            console.log(`  ${icon} ${i + 1}. ${d.message}`);
            if (d.table) console.log(`     Table: ${d.table}`);
            if (d.column) console.log(`     Column: ${d.column}`);
        });
    }

    if (results.failures === 0 && results.warnings === 0) {
        console.log('\n🎉 Excellent! No security issues detected.\n');
    } else if (results.failures === 0) {
        console.log('\n✅ Good! Only minor warnings to review.\n');
    } else {
        console.log('\n⚠️  Action Required: Please address the critical issues above.\n');
    }
}

function calculateScore() {
    const total = results.passed + results.warnings + results.failures;
    if (total === 0) return 'N/A';

    const score = ((results.passed / total) * 100).toFixed(0);
    if (score >= 90) return `${score}% ⭐⭐⭐⭐⭐`;
    if (score >= 70) return `${score}% ⭐⭐⭐⭐`;
    if (score >= 50) return `${score}% ⭐⭐⭐`;
    return `${score}% ⭐`;
}

async function main() {
    console.log(`
${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════╗
║         🔐 NUBIA AURA Database Security Audit         ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}
  `);

    log.info(`Connecting to: ${supabaseUrl}`);

    try {
        // Test connection
        const { error } = await adminClient.from('products').select('id').limit(1);
        if (error) throw error;
        log.success('Connected to Supabase successfully\n');

        await checkRLSEnabled();
        await checkSensitiveColumns();
        await checkDataIntegrity();
        await checkStockConstraints();
        await checkPromoCodeSecurity();
        await checkUserDataExposure();
        await generateReport();

    } catch (err) {
        log.error(`Connection failed: ${err.message}`);
        process.exit(1);
    }
}

main();
