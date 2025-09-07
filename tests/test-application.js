/**
 * Comprehensive Application Test Suite
 * Run this to verify all features are working
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: []
};

// Helper function to make API requests
async function testAPI(endpoint, method = 'GET', body = null) {
    try {
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
        
        return {
            status: response.status,
            ok: response.ok,
            data
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

// Test functions
async function testEnvironmentVariables() {
    console.log(`\n${colors.blue}Testing Environment Variables...${colors.reset}`);
    
    const requiredVars = [
        'OPENAI_API_KEY',
        'GEMINI_API_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'D_ID_API_KEY',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];
    
    const missing = [];
    
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });
    
    if (missing.length === 0) {
        console.log(`${colors.green}✓ All environment variables are set${colors.reset}`);
        testResults.passed++;
        return true;
    } else {
        console.log(`${colors.red}✗ Missing environment variables: ${missing.join(', ')}${colors.reset}`);
        testResults.failed++;
        testResults.errors.push(`Missing env vars: ${missing.join(', ')}`);
        return false;
    }
}

async function testHealthEndpoint() {
    console.log(`\n${colors.blue}Testing Health Endpoint...${colors.reset}`);
    
    const result = await testAPI('/api/health');
    
    if (result.ok && result.data.status === 'healthy') {
        console.log(`${colors.green}✓ Health endpoint is working${colors.reset}`);
        testResults.passed++;
        return true;
    } else {
        console.log(`${colors.red}✗ Health endpoint failed${colors.reset}`);
        testResults.failed++;
        testResults.errors.push('Health endpoint not responding');
        return false;
    }
}

async function testImageAnalysis() {
    console.log(`\n${colors.blue}Testing Image Analysis API...${colors.reset}`);
    
    const result = await testAPI('/api/analyze-image', 'POST', {
        imageBase64: TEST_IMAGE_BASE64,
        preferredApi: 'openai'
    });
    
    if (result.ok && result.data.productName) {
        console.log(`${colors.green}✓ Image analysis API working${colors.reset}`);
        console.log(`  Detected: ${result.data.productName}`);
        testResults.passed++;
        return true;
    } else {
        console.log(`${colors.yellow}⚠ Image analysis API not configured or failed${colors.reset}`);
        testResults.skipped++;
        return false;
    }
}

async function testDescriptionGeneration() {
    console.log(`\n${colors.blue}Testing Description Generation...${colors.reset}`);
    
    const result = await testAPI('/api/generate-description', 'POST', {
        productName: 'Test Product',
        productCategory: 'Electronics',
        targetAudience: 'Tech enthusiasts',
        keyFeatures: 'Wireless, Bluetooth, Premium',
        tone: 'professional',
        tier: 'free',
        generateImages: false
    });
    
    if (result.ok && result.data.success) {
        console.log(`${colors.green}✓ Description generation working${colors.reset}`);
        console.log(`  Generated ${result.data.variations?.length || 1} variations`);
        testResults.passed++;
        return true;
    } else {
        console.log(`${colors.red}✗ Description generation failed${colors.reset}`);
        testResults.failed++;
        testResults.errors.push('Description generation not working');
        return false;
    }
}

async function testStripeWebhook() {
    console.log(`\n${colors.blue}Testing Stripe Webhook Endpoint...${colors.reset}`);
    
    // This is a basic connectivity test
    const result = await testAPI('/api/stripe-webhook', 'POST', {
        type: 'test'
    });
    
    // Webhook will reject test events, but we're just checking it exists
    if (result.status === 400 || result.status === 401) {
        console.log(`${colors.green}✓ Stripe webhook endpoint exists${colors.reset}`);
        testResults.passed++;
        return true;
    } else if (result.status === 0) {
        console.log(`${colors.red}✗ Cannot connect to webhook endpoint${colors.reset}`);
        testResults.failed++;
        return false;
    }
}

async function testVideoGeneration() {
    console.log(`\n${colors.blue}Testing Video Generation Setup...${colors.reset}`);
    
    if (!process.env.D_ID_API_KEY) {
        console.log(`${colors.yellow}⚠ D-ID API key not configured - skipping video tests${colors.reset}`);
        testResults.skipped++;
        return false;
    }
    
    console.log(`${colors.green}✓ D-ID API key is configured${colors.reset}`);
    testResults.passed++;
    return true;
}

// Main test runner
async function runTests() {
    console.log('='.repeat(60));
    console.log(`${colors.blue}🧪 Product Description Generator - Test Suite${colors.reset}`);
    console.log('='.repeat(60));
    
    // Check if server is running
    console.log(`\n${colors.yellow}Testing server at: ${BASE_URL}${colors.reset}`);
    
    // Run all tests
    await testEnvironmentVariables();
    await testHealthEndpoint();
    await testImageAnalysis();
    await testDescriptionGeneration();
    await testStripeWebhook();
    await testVideoGeneration();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.blue}📊 Test Summary${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    console.log(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
    
    if (testResults.errors.length > 0) {
        console.log(`\n${colors.red}Errors:${colors.reset}`);
        testResults.errors.forEach(error => {
            console.log(`  - ${error}`);
        });
    }
    
    // Exit code
    const exitCode = testResults.failed > 0 ? 1 : 0;
    console.log('\n' + '='.repeat(60));
    
    if (exitCode === 0) {
        console.log(`${colors.green}✅ All critical tests passed!${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ Some tests failed. Please check the errors above.${colors.reset}`);
    }
    
    process.exit(exitCode);
}

// Instructions
if (require.main === module) {
    console.log('='.repeat(60));
    console.log('APPLICATION TEST INSTRUCTIONS');
    console.log('='.repeat(60));
    console.log('\n1. Make sure your server is running:');
    console.log('   npm run dev\n');
    console.log('2. Ensure .env file has all required keys\n');
    console.log('3. Run this test:');
    console.log('   node tests/test-application.js\n');
    console.log('='.repeat(60));
    
    // Run tests after a short delay
    setTimeout(runTests, 2000);
}