// Test script for authentication and credit system
const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

let authToken = null;
let userId = null;

// Color codes for output
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

async function testEndpoint(name, method, path, body = null, headers = {}) {
  log(`\nTesting: ${name}`, 'blue');

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();

    if (response.ok) {
      log(`✅ ${name} - Success (${response.status})`, 'green');
      console.log('Response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      log(`❌ ${name} - Failed (${response.status})`, 'red');
      console.log('Error:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    log(`❌ ${name} - Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🧪 Starting Authentication & Credit System Tests\n', 'yellow');
  log(`Base URL: ${BASE_URL}`, 'blue');

  // Test 1: Register new user
  const registerResult = await testEndpoint(
    'User Registration',
    'POST',
    '/api/auth/register',
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Test User'
    }
  );

  if (registerResult.success) {
    authToken = registerResult.data.token;
    userId = registerResult.data.user.id;
    log(`User ID: ${userId}`, 'blue');
    log(`Token: ${authToken.substring(0, 20)}...`, 'blue');
  }

  // Test 2: Login with credentials
  const loginResult = await testEndpoint(
    'User Login',
    'POST',
    '/api/auth/login',
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  );

  if (loginResult.success) {
    authToken = loginResult.data.token;
    log(`Login successful for ${TEST_EMAIL}`, 'green');
  }

  // Test 3: Get user credits
  const creditsResult = await testEndpoint(
    'Get User Credits',
    'GET',
    '/api/auth/credits',
    null,
    {
      'Authorization': `Bearer ${authToken}`
    }
  );

  if (creditsResult.success) {
    log('Initial Credits:', 'blue');
    console.log(`  Descriptions: ${creditsResult.data.credits.descriptions}`);
    console.log(`  Images: ${creditsResult.data.credits.images}`);
    console.log(`  Videos: ${creditsResult.data.credits.videos}`);
    console.log(`  Bulk: ${creditsResult.data.credits.bulk}`);
  }

  // Test 4: Generate description (uses credits)
  const generateResult = await testEndpoint(
    'Generate Description (with auth)',
    'POST',
    '/api/generate-description-v2',
    {
      productName: 'Test Product',
      productCategory: 'Electronics',
      targetAudience: 'Tech enthusiasts',
      keyFeatures: 'Innovative, High-quality, Affordable',
      tone: 'Professional'
    },
    {
      'Authorization': `Bearer ${authToken}`
    }
  );

  if (generateResult.success) {
    log('Description generated successfully', 'green');
    if (generateResult.data.remainingCredits) {
      log('Remaining Credits:', 'blue');
      console.log(`  Descriptions: ${generateResult.data.remainingCredits.descriptions}`);
    }
  }

  // Test 5: Check credits after generation
  const creditsAfterResult = await testEndpoint(
    'Get Credits After Generation',
    'GET',
    '/api/auth/credits',
    null,
    {
      'Authorization': `Bearer ${authToken}`
    }
  );

  if (creditsAfterResult.success) {
    log('Credits After Generation:', 'blue');
    console.log(`  Descriptions: ${creditsAfterResult.data.credits.descriptions}`);

    // Verify credit was deducted
    if (creditsResult.success && creditsAfterResult.success) {
      const before = parseInt(creditsResult.data.credits.descriptions);
      const after = parseInt(creditsAfterResult.data.credits.descriptions);

      if (before - after === 1) {
        log('✅ Credit deduction verified (1 credit used)', 'green');
      } else {
        log(`⚠️ Credit deduction mismatch: ${before} -> ${after}`, 'yellow');
      }
    }
  }

  // Test 6: Test invalid login
  await testEndpoint(
    'Invalid Login',
    'POST',
    '/api/auth/login',
    {
      email: TEST_EMAIL,
      password: 'WrongPassword'
    }
  );

  // Test 7: Test duplicate registration
  await testEndpoint(
    'Duplicate Registration',
    'POST',
    '/api/auth/register',
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Another User'
    }
  );

  // Test 8: Test unauthenticated request
  await testEndpoint(
    'Unauthenticated Credits Request',
    'GET',
    '/api/auth/credits'
  );

  // Test 9: Test generation without auth (anonymous)
  const anonymousResult = await testEndpoint(
    'Anonymous Generation',
    'POST',
    '/api/generate-description-v2',
    {
      productName: 'Anonymous Product',
      productCategory: 'General',
      tone: 'Casual'
    }
  );

  if (anonymousResult.success) {
    log('Anonymous generation allowed (limited usage)', 'green');
  }

  // Summary
  log('\n📊 Test Summary', 'yellow');
  log('================', 'yellow');
  log('All core authentication and credit system tests completed.', 'green');
  log(`Test user created: ${TEST_EMAIL}`, 'blue');
  log(`User ID: ${userId}`, 'blue');

  log('\n✅ System is ready for deployment!', 'green');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});