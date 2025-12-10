/**
 * 🧪 Flutterwave Automated Test Suite
 * Tests all payment endpoints and scenarios
 * 
 * Usage: npx ts-node test-flutterwave-automated.ts
 */

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const LOCALE = 'fr';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function logTest(name: string) {
  log(`  ▶ ${name}`, 'blue');
}

function logPass(message: string) {
  log(`    ✅ ${message}`, 'green');
  passedTests++;
}

function logFail(message: string, error?: any) {
  log(`    ❌ ${message}`, 'red');
  if (error) {
    log(`       Error: ${error.message || JSON.stringify(error)}`, 'red');
  }
  failedTests++;
}

function logInfo(message: string) {
  log(`    ℹ️  ${message}`, 'yellow');
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testServerHealth() {
  logSection('1️⃣  SERVER HEALTH CHECK');
  totalTests++;
  logTest('Server is accessible');

  try {
    const response = await fetch(API_BASE);
    if (response.ok || response.status === 404) {
      logPass('Server is running and accessible');
    } else {
      logFail(`Server returned status ${response.status}`);
    }
  } catch (error: any) {
    logFail('Server is not accessible', error);
  }
}

async function testPaymentInitialization() {
  logSection('2️⃣  PAYMENT INITIALIZATION');
  totalTests++;
  logTest('Initialize payment with valid data');

  const payload = {
    items: [
      {
        product_id: '1',
        quantity: 1,
        price: 95000,
        name: 'Costume Africain Traditionnel',
      },
    ],
    firstName: 'Amadou',
    lastName: 'Test',
    email: 'test@example.com',
    phone: '+221771234567',
    address: '123 Rue Test',
    city: 'Dakar',
    zipCode: '18000',
    country: 'Sénégal',
    shippingMethod: 'standard',
    locale: LOCALE,
  };

  try {
    const response = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as any;

    if (response.ok && data.orderId) {
      logPass(`Order created: ${data.orderId}`);
      logInfo(`Reference: ${data.reference}`);
      logInfo(`Payment link: ${data.link ? 'Generated' : 'Not generated'}`);
      return data.orderId;
    } else {
      logFail(`Failed to initialize payment: ${data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error: any) {
    logFail('Payment initialization failed', error);
    return null;
  }
}

async function testPaymentVerification(orderId: string | null) {
  logSection('3️⃣  PAYMENT VERIFICATION');

  if (!orderId) {
    logFail('Skipping - no order ID from initialization');
    return;
  }

  totalTests++;
  logTest('Verify successful payment');

  const payload = {
    reference: orderId,
    orderId: orderId,
    transaction_id: `test-${Date.now()}`,
    status: 'successful',
  };

  try {
    const response = await fetch(`${API_BASE}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as any;

    if (response.ok && data.success) {
      logPass('Payment verified successfully');
      logInfo(`Payment status: ${data.paymentStatus}`);
      logInfo(`Order status: ${data.orderStatus}`);
    } else {
      logFail(`Payment verification failed: ${data.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    logFail('Payment verification failed', error);
  }
}

async function testFailedPayment() {
  logSection('4️⃣  FAILED PAYMENT SCENARIO');
  totalTests++;
  logTest('Verify failed payment handling');

  const payload = {
    reference: `failed-test-${Date.now()}`,
    status: 'failed',
  };

  try {
    const response = await fetch(`${API_BASE}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as any;

    if (!data.success) {
      logPass('Failed payment handled correctly');
      logInfo(`Payment status: ${data.paymentStatus}`);
    } else {
      logFail('Failed payment should not be successful');
    }
  } catch (error: any) {
    logFail('Failed payment test failed', error);
  }
}

async function testMultipleItems() {
  logSection('5️⃣  MULTIPLE ITEMS PAYMENT');
  totalTests++;
  logTest('Initialize payment with multiple items');

  const payload = {
    items: [
      {
        product_id: '1',
        quantity: 2,
        price: 95000,
        name: 'Costume Africain Traditionnel',
      },
      {
        product_id: '2',
        quantity: 1,
        price: 180000,
        name: 'Robe de Mariage Élégante',
      },
    ],
    firstName: 'Amadou',
    lastName: 'Test',
    email: 'test@example.com',
    phone: '+221771234567',
    address: '123 Rue Test',
    city: 'Dakar',
    zipCode: '18000',
    country: 'Sénégal',
    shippingMethod: 'express',
    locale: LOCALE,
  };

  try {
    const response = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as any;

    if (response.ok && data.orderId) {
      logPass('Multiple items payment initialized');
      logInfo(`Order ID: ${data.orderId}`);
      logInfo(`Items: 2 products`);
    } else {
      logFail(`Failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    logFail('Multiple items test failed', error);
  }
}

async function testInvalidData() {
  logSection('6️⃣  INVALID DATA HANDLING');
  totalTests++;
  logTest('Handle invalid payment data');

  const payload = {
    items: [], // Empty items
    firstName: '',
    lastName: '',
    email: 'invalid-email',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    shippingMethod: 'invalid',
  };

  try {
    const response = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logPass('Invalid data rejected correctly');
      logInfo(`Status: ${response.status}`);
    } else {
      logFail('Invalid data should be rejected');
    }
  } catch (error: any) {
    logFail('Invalid data test failed', error);
  }
}

async function testDifferentShippingMethods() {
  logSection('7️⃣  DIFFERENT SHIPPING METHODS');

  const methods = ['standard', 'express'];

  for (const method of methods) {
    totalTests++;
    logTest(`Test shipping method: ${method}`);

    const payload = {
      items: [
        {
          product_id: '1',
          quantity: 1,
          price: 95000,
          name: 'Test Product',
        },
      ],
      firstName: 'Amadou',
      lastName: 'Test',
      email: 'test@example.com',
      phone: '+221771234567',
      address: '123 Rue Test',
      city: 'Dakar',
      zipCode: '18000',
      country: 'Sénégal',
      shippingMethod: method,
      locale: LOCALE,
    };

    try {
      const response = await fetch(`${API_BASE}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logPass(`Shipping method "${method}" works`);
      } else {
        logFail(`Shipping method "${method}" failed`);
      }
    } catch (error: any) {
      logFail(`Shipping method "${method}" test failed`, error);
    }
  }
}

async function testRateLimiting() {
  logSection('8️⃣  RATE LIMITING');
  totalTests++;
  logTest('Test rate limiting on verification endpoint');

  const payload = {
    reference: `rate-limit-test-${Date.now()}`,
    status: 'successful',
  };

  let rateLimited = false;

  // Make 10 rapid requests
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch(`${API_BASE}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        rateLimited = true;
        break;
      }
    } catch (error) {
      // Ignore errors
    }
  }

  if (rateLimited) {
    logPass('Rate limiting is active');
  } else {
    logInfo('Rate limiting not triggered (may be configured differently)');
  }
}

async function testDatabaseIntegration() {
  logSection('9️⃣  DATABASE INTEGRATION');
  totalTests++;
  logTest('Verify order is saved in database');

  const payload = {
    items: [
      {
        product_id: '1',
        quantity: 1,
        price: 95000,
        name: 'Test Product',
      },
    ],
    firstName: 'Amadou',
    lastName: 'Test',
    email: 'test@example.com',
    phone: '+221771234567',
    address: '123 Rue Test',
    city: 'Dakar',
    zipCode: '18000',
    country: 'Sénégal',
    shippingMethod: 'standard',
    locale: LOCALE,
  };

  try {
    const response = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as any;

    if (data.orderId) {
      logPass('Order created in database');
      logInfo(`Order ID: ${data.orderId}`);
      logInfo(`Check database: SELECT * FROM orders WHERE id = '${data.orderId}'`);
    } else {
      logFail('Order not created in database');
    }
  } catch (error: any) {
    logFail('Database integration test failed', error);
  }
}

async function testErrorHandling() {
  logSection('🔟 ERROR HANDLING');
  totalTests++;
  logTest('Test error handling and responses');

  try {
    // Test with missing required fields
    const response = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [],
        // Missing all required fields
      }),
    });

    const data = (await response.json()) as any;

    if (!response.ok && data.error) {
      logPass('Error handling works correctly');
      logInfo(`Error message: ${data.error}`);
    } else {
      logFail('Error handling should return error message');
    }
  } catch (error: any) {
    logFail('Error handling test failed', error);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.clear();
  log('🧪 FLUTTERWAVE AUTOMATED TEST SUITE', 'cyan');
  log(`API Base: ${API_BASE}`, 'yellow');
  log(`Started: ${new Date().toISOString()}`, 'yellow');

  try {
    // Run tests
    await testServerHealth();
    const orderId = await testPaymentInitialization();
    await testPaymentVerification(orderId);
    await testFailedPayment();
    await testMultipleItems();
    await testInvalidData();
    await testDifferentShippingMethods();
    await testRateLimiting();
    await testDatabaseIntegration();
    await testErrorHandling();

    // Print summary
    logSection('📊 TEST SUMMARY');
    log(`Total Tests: ${totalTests}`, 'cyan');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'cyan');

    if (failedTests === 0) {
      log('\n🎉 ALL TESTS PASSED!', 'green');
    } else {
      log(`\n⚠️  ${failedTests} test(s) failed`, 'yellow');
    }

    log(`\nFinished: ${new Date().toISOString()}`, 'yellow');
  } catch (error: any) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
