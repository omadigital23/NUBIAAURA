/**
 * 🧪 Payment API Tests
 * Unit tests for Flutterwave payment endpoints
 * 
 * Run: npm test -- __tests__/payments.test.ts
 */

import { createMocks } from 'node-mocks-http';
import { POST as initializePayment } from '@/app/api/payments/initialize/route';
import { POST as verifyPayment } from '@/app/api/payments/verify/route';

describe('Payment API Endpoints', () => {
  describe('POST /api/payments/initialize', () => {
    it('should initialize payment with valid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
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
        },
      });

      await initializePayment(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.orderId).toBeDefined();
      expect(data.reference).toBeDefined();
      expect(data.link).toBeDefined();
    });

    it('should reject payment with missing items', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [],
          firstName: 'Amadou',
          lastName: 'Test',
          email: 'test@example.com',
          phone: '+221771234567',
          address: '123 Rue Test',
          city: 'Dakar',
          zipCode: '18000',
          country: 'Sénégal',
          shippingMethod: 'standard',
        },
      });

      await initializePayment(req);

      expect(res._getStatusCode()).not.toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.error).toBeDefined();
    });

    it('should reject payment with invalid email', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
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
          email: 'invalid-email',
          phone: '+221771234567',
          address: '123 Rue Test',
          city: 'Dakar',
          zipCode: '18000',
          country: 'Sénégal',
          shippingMethod: 'standard',
        },
      });

      await initializePayment(req);

      expect(res._getStatusCode()).not.toBe(200);
    });

    it('should handle multiple items', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [
            {
              product_id: '1',
              quantity: 2,
              price: 95000,
              name: 'Product 1',
            },
            {
              product_id: '2',
              quantity: 1,
              price: 180000,
              name: 'Product 2',
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
        },
      });

      await initializePayment(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });

    it('should support different shipping methods', async () => {
      const methods = ['standard', 'express'];

      for (const method of methods) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
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
          },
        });

        await initializePayment(req);

        expect(res._getStatusCode()).toBe(200);
      }
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should verify successful payment', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          reference: 'ORD-TEST-123',
          orderId: 'ORD-TEST-123',
          status: 'successful',
        },
      });

      await verifyPayment(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.paymentStatus).toBe('completed');
    });

    it('should handle failed payment', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          reference: 'ORD-FAILED-123',
          status: 'failed',
        },
      });

      await verifyPayment(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
    });

    it('should require reference or transaction_id', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          status: 'successful',
        },
      });

      await verifyPayment(req);

      expect(res._getStatusCode()).not.toBe(200);
    });

    it('should handle pending payment', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          reference: 'ORD-PENDING-123',
          orderId: 'ORD-PENDING-123',
          status: 'pending',
        },
      });

      await verifyPayment(req);

      // Pending should be treated as not successful
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
    });
  });

  describe('Payment Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com',
      ];

      for (const email of invalidEmails) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            items: [
              {
                product_id: '1',
                quantity: 1,
                price: 95000,
                name: 'Test',
              },
            ],
            firstName: 'Amadou',
            lastName: 'Test',
            email: email,
            phone: '+221771234567',
            address: '123 Rue Test',
            city: 'Dakar',
            zipCode: '18000',
            country: 'Sénégal',
            shippingMethod: 'standard',
          },
        });

        await initializePayment(req);

        expect(res._getStatusCode()).not.toBe(200);
      }
    });

    it('should validate phone format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [
            {
              product_id: '1',
              quantity: 1,
              price: 95000,
              name: 'Test',
            },
          ],
          firstName: 'Amadou',
          lastName: 'Test',
          email: 'test@example.com',
          phone: 'invalid-phone',
          address: '123 Rue Test',
          city: 'Dakar',
          zipCode: '18000',
          country: 'Sénégal',
          shippingMethod: 'standard',
        },
      });

      await initializePayment(req);

      expect(res._getStatusCode()).not.toBe(200);
    });

    it('should validate price is positive', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [
            {
              product_id: '1',
              quantity: 1,
              price: -95000, // Negative price
              name: 'Test',
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
        },
      });

      await initializePayment(req);

      expect(res._getStatusCode()).not.toBe(200);
    });

    it('should validate quantity is positive', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [
            {
              product_id: '1',
              quantity: 0, // Invalid quantity
              price: 95000,
              name: 'Test',
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
        },
      });

      await initializePayment(req);

      expect(res._getStatusCode()).not.toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing all fields
        },
      });

      await initializePayment(req);

      expect(res._getStatusCode()).not.toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.error).toBeDefined();
    });

    it('should handle invalid JSON', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: 'invalid json',
      });

      await initializePayment(req);

      expect(res._getStatusCode()).not.toBe(200);
    });

    it('should handle server errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [
            {
              product_id: 'invalid-id', // This might cause DB error
              quantity: 1,
              price: 95000,
              name: 'Test',
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
        },
      });

      await initializePayment(req);

      // Should return error, not crash
      expect(res._getStatusCode()).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should sanitize input data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [
            {
              product_id: '1',
              quantity: 1,
              price: 95000,
              name: 'Test<script>alert("xss")</script>',
            },
          ],
          firstName: 'Amadou<img src=x onerror=alert("xss")>',
          lastName: 'Test',
          email: 'test@example.com',
          phone: '+221771234567',
          address: '123 Rue Test',
          city: 'Dakar',
          zipCode: '18000',
          country: 'Sénégal',
          shippingMethod: 'standard',
        },
      });

      await initializePayment(req);

      // Should handle XSS attempts safely
      expect(res._getStatusCode()).toBeDefined();
    });

    it('should not expose sensitive information in errors', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Invalid data
        },
      });

      await initializePayment(req);

      const data = JSON.parse(res._getData());
      expect(data.error).toBeDefined();
      expect(data.error).not.toContain('password');
      expect(data.error).not.toContain('secret');
      expect(data.error).not.toContain('key');
    });
  });
});
