// Shopify Test Store Configuration
// To test the OAuth flow, you'll need to:
// 1. Create a development store at partners.shopify.com
// 2. Create a new app in your Partner dashboard
// 3. Fill in these values with your test app credentials

module.exports = {
  // Test Store Configuration
  testStore: {
    domain: 'your-test-store.myshopify.com', // Replace with your test store domain
    email: 'test@example.com'
  },
  
  // App Credentials (from Partner Dashboard)
  app: {
    apiKey: process.env.SHOPIFY_API_KEY || 'test_api_key_here',
    apiSecret: process.env.SHOPIFY_API_SECRET || 'test_api_secret_here',
    scopes: 'read_products,write_products',
    appUrl: process.env.APP_URL || 'https://productdescriptions.io',
    redirectUri: process.env.REDIRECT_URI || 'https://productdescriptions.io/api/shopify/callback'
  },
  
  // Webhook Configuration
  webhooks: [
    {
      topic: 'products/create',
      address: '/api/v1/webhooks/shopify',
      format: 'json'
    },
    {
      topic: 'products/update', 
      address: '/api/v1/webhooks/shopify',
      format: 'json'
    },
    {
      topic: 'app/uninstalled',
      address: '/api/v1/webhooks/shopify',
      format: 'json'
    }
  ],
  
  // API Version
  apiVersion: '2024-01',
  
  // Test Mode Settings
  testMode: true,
  debugMode: true,
  
  // Mock Data for Testing
  mockProduct: {
    title: 'Test Product',
    body_html: '<p>Test description</p>',
    vendor: 'Test Vendor',
    product_type: 'Test Type',
    tags: ['test', 'demo'],
    variants: [
      {
        price: '29.99',
        sku: 'TEST-001'
      }
    ]
  }
};