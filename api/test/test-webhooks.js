/**
 * Webhook Handler Test Script
 * Tests the Shopify webhook handlers
 */

const crypto = require('crypto');

// Test webhook secret (in production, this would be from Shopify)
const WEBHOOK_SECRET = 'test_webhook_secret_123';

/**
 * Generate webhook signature like Shopify does
 */
function generateWebhookSignature(body, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
}

/**
 * Create a test webhook payload
 */
function createTestPayload(topic) {
  const payloads = {
    'products/create': {
      id: 123456789,
      title: 'Test Product',
      body_html: '<p>Original description</p>',
      vendor: 'Test Vendor',
      product_type: 'Electronics',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: 'test, demo',
      variants: [
        {
          id: 987654321,
          product_id: 123456789,
          title: 'Default',
          price: '99.99',
          sku: 'TEST-001',
          inventory_quantity: 100
        }
      ],
      images: [
        {
          id: 111111,
          product_id: 123456789,
          src: 'https://example.com/product.jpg'
        }
      ]
    },
    'products/update': {
      id: 123456789,
      title: 'Updated Test Product',
      body_html: '<p>Updated description</p>',
      vendor: 'Test Vendor',
      product_type: 'Electronics',
      updated_at: new Date().toISOString()
    },
    'app/uninstalled': {
      id: 123456789,
      name: 'Test Store',
      email: 'test@example.com',
      domain: 'test-store.myshopify.com'
    }
  };
  
  return payloads[topic] || {};
}

/**
 * Test a webhook endpoint
 */
async function testWebhook(topic) {
  console.log(`\n📬 Testing ${topic} webhook...`);
  
  const payload = createTestPayload(topic);
  const body = JSON.stringify(payload);
  const signature = generateWebhookSignature(body, WEBHOOK_SECRET);
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Signature:', signature);
  
  // Create test request headers
  const headers = {
    'X-Shopify-Topic': topic,
    'X-Shopify-Hmac-Sha256': signature,
    'X-Shopify-Shop-Domain': 'test-store.myshopify.com',
    'X-Shopify-API-Version': '2024-01',
    'Content-Type': 'application/json'
  };
  
  console.log('Headers:', headers);
  
  // Test the webhook handler locally
  try {
    const webhookHandler = require('../v1/webhooks/shopify');
    
    // Mock request and response objects
    const mockReq = {
      headers,
      body: payload,
      query: {},
      method: 'POST'
    };
    
    const mockRes = {
      status: (code) => {
        console.log(`Response Status: ${code}`);
        return mockRes;
      },
      json: (data) => {
        console.log('Response:', data);
        return mockRes;
      },
      send: (data) => {
        console.log('Response:', data);
        return mockRes;
      },
      setHeader: () => mockRes,
      end: () => mockRes
    };
    
    // Call the handler
    await webhookHandler(mockReq, mockRes);
    console.log(`✅ ${topic} webhook test completed`);
    
  } catch (error) {
    console.error(`❌ ${topic} webhook test failed:`, error.message);
  }
}

/**
 * Run all webhook tests
 */
async function runAllTests() {
  console.log('=============================');
  console.log('Shopify Webhook Handler Tests');
  console.log('=============================');
  
  const topics = [
    'products/create',
    'products/update',
    'app/uninstalled'
  ];
  
  for (const topic of topics) {
    await testWebhook(topic);
  }
  
  console.log('\n📋 Test Summary:');
  console.log('- products/create: Triggers AI description generation');
  console.log('- products/update: Updates product if description is empty');
  console.log('- app/uninstalled: Cleans up store data and API keys');
  
  console.log('\n🔧 Integration Notes:');
  console.log('1. Webhooks require valid HMAC signature from Shopify');
  console.log('2. Store must have valid API key in database');
  console.log('3. Webhook URLs must be accessible from internet');
  console.log('4. Use ngrok for local testing: ngrok http 3000');
}

// Run tests
runAllTests().catch(console.error);