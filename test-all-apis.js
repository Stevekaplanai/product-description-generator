#!/usr/bin/env node

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:3006';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, endpoint, body = null) {
  try {
    log(`\nTesting: ${name}`, 'blue');
    log(`Endpoint: ${method} ${endpoint}`, 'yellow');
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Success: ${response.status}`, 'green');
      console.log('Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return { success: true, data };
    } else {
      log(`❌ Failed: ${response.status}`, 'red');
      console.log('Error:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🚀 Starting API Test Suite', 'blue');
  log('=' .repeat(50), 'blue');
  
  const results = [];
  
  // 1. Health Check
  results.push(await testEndpoint(
    'Health Check',
    'GET',
    '/api/health'
  ));
  
  // 2. Debug Info
  results.push(await testEndpoint(
    'Debug Configuration',
    'GET',
    '/api/debug'
  ));
  
  // 3. Config Endpoint
  results.push(await testEndpoint(
    'Client Configuration',
    'GET',
    '/api/config'
  ));
  
  // 4. Generate Description
  results.push(await testEndpoint(
    'Generate Product Description',
    'POST',
    '/api/generate-description',
    {
      productName: 'Test Wireless Headphones',
      category: 'electronics',
      targetAudience: 'music lovers',
      features: 'Noise cancellation, 30-hour battery',
      tone: 'professional'
    }
  ));
  
  // 5. Bulk Generate (limited test)
  results.push(await testEndpoint(
    'Bulk Generate Descriptions',
    'POST',
    '/api/bulk-generate',
    {
      products: [
        {
          productName: 'Product 1',
          category: 'electronics',
          features: 'Feature 1',
          targetAudience: 'Tech users',
          tone: 'professional'
        },
        {
          productName: 'Product 2',
          category: 'fashion',
          features: 'Feature 2',
          targetAudience: 'Fashion lovers',
          tone: 'casual'
        }
      ]
    }
  ));
  
  // 6. Image Analysis (with base64 image)
  // This is a valid 1x1 red pixel PNG image in base64
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  results.push(await testEndpoint(
    'Analyze Image',
    'POST',
    '/api/analyze-image',
    {
      imageBase64: testImageBase64
    }
  ));
  
  // 7. Video Generation Test (will likely fail without proper credits)
  results.push(await testEndpoint(
    'Generate Video',
    'POST',
    '/api/generate-video',
    {
      productName: 'Test Product',
      productDescription: 'Amazing test product',
      script: 'This is a test script for video generation'
    }
  ));
  
  // 8. Stripe Config
  results.push(await testEndpoint(
    'Stripe Configuration',
    'GET',
    '/api/stripe-config'
  ));
  
  // 9. Pricing Config
  results.push(await testEndpoint(
    'Pricing Configuration',
    'GET',
    '/api/get-pricing'
  ));
  
  // Summary
  log('\n' + '=' .repeat(50), 'blue');
  log('📊 Test Summary', 'blue');
  log('=' .repeat(50), 'blue');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log(`Total Tests: ${results.length}`, 'yellow');
  log(`✅ Successful: ${successful}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  
  if (failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the logs above for details.', 'yellow');
  }
  
  // Check critical APIs
  log('\n🔑 Critical API Status:', 'blue');
  const healthCheck = results[0];
  if (healthCheck.success && healthCheck.data.apis) {
    const apis = healthCheck.data.apis;
    log(`  OpenAI: ${apis.openai ? '✅' : '❌'}`, apis.openai ? 'green' : 'red');
    log(`  Gemini: ${apis.gemini ? '✅' : '❌'}`, apis.gemini ? 'green' : 'red');
    log(`  Cloudinary: ${apis.cloudinary ? '✅' : '❌'}`, apis.cloudinary ? 'green' : 'red');
    log(`  D-ID: ${apis.did ? '✅' : '❌'}`, apis.did ? 'green' : 'red');
    log(`  Stripe: ${apis.stripe ? '✅' : '❌'}`, apis.stripe ? 'green' : 'red');
  }
}

// Run the tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});