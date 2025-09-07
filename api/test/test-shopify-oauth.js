/**
 * Shopify OAuth Flow Test Script
 * Run this to test the OAuth installation flow
 */

const config = require('../config/shopify-test');

console.log('=================================');
console.log('Shopify OAuth Flow Test Checklist');
console.log('=================================\n');

console.log('✅ Prerequisites:');
console.log('1. Create a development store at partners.shopify.com');
console.log('2. Create a new app in Partner Dashboard');
console.log('3. Set OAuth redirect URL to:', config.app.redirectUri);
console.log('4. Update api/config/shopify-test.js with your credentials\n');

console.log('📝 Test Steps:');
console.log('1. Visit: https://productdescriptions.io/shopify-install.html');
console.log('2. Enter your test store name (without .myshopify.com)');
console.log('3. Click "Install App"');
console.log('4. You should be redirected to Shopify OAuth consent page');
console.log('5. Click "Install app" on Shopify\'s page');
console.log('6. You should be redirected back with an API key\n');

console.log('🔍 Things to Verify:');
console.log('- [ ] HMAC signature validation works');
console.log('- [ ] Access token exchange succeeds');
console.log('- [ ] Shop data is retrieved correctly');
console.log('- [ ] API key is generated and displayed');
console.log('- [ ] Webhooks are registered');
console.log('- [ ] Redirect to embedded app works\n');

console.log('🧪 Test OAuth URL Generation:');
const testShop = 'test-store.myshopify.com';
const nonce = require('crypto').randomBytes(16).toString('hex');
const authUrl = `https://${testShop}/admin/oauth/authorize?` +
  `client_id=${config.app.apiKey}&` +
  `scope=${config.app.scopes}&` +
  `redirect_uri=${encodeURIComponent(config.app.redirectUri)}&` +
  `state=${nonce}`;

console.log('Generated OAuth URL:');
console.log(authUrl);
console.log('\n');

console.log('🔐 Environment Variables Needed:');
console.log('SHOPIFY_API_KEY=' + config.app.apiKey);
console.log('SHOPIFY_API_SECRET=' + config.app.apiSecret);
console.log('APP_URL=' + config.app.appUrl);
console.log('\n');

// Test HMAC validation
function testHmacValidation() {
  const crypto = require('crypto');
  const query = {
    shop: 'test-store.myshopify.com',
    timestamp: Date.now().toString(),
    code: 'test_code_123'
  };
  
  // Create HMAC
  const message = Object.keys(query)
    .filter(key => key !== 'hmac')
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  const hmac = crypto
    .createHmac('sha256', config.app.apiSecret)
    .update(message)
    .digest('hex');
  
  console.log('📊 HMAC Test:');
  console.log('Query params:', query);
  console.log('Generated HMAC:', hmac);
  console.log('Test URL with HMAC:');
  console.log(`/api/shopify/callback?shop=${query.shop}&timestamp=${query.timestamp}&code=${query.code}&hmac=${hmac}`);
}

testHmacValidation();