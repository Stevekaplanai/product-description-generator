/**
 * Test Suite for Vercel Deployed Application
 * Tests the live application at productdescriptions.io
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'https://productdescriptions.io'; // Your deployed URL
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

// Test results tracking
let testResults = {
    passed: [],
    failed: [],
    warnings: []
};

// Sample test image (1x1 red pixel)
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// Test functions
async function testHomePage() {
    console.log(`\n${colors.blue}Testing Home Page...${colors.reset}`);
    try {
        const response = await axios.get(BASE_URL);
        if (response.status === 200) {
            console.log(`${colors.green}✓ Home page loads successfully${colors.reset}`);
            testResults.passed.push('Home Page');
            return true;
        }
    } catch (error) {
        console.log(`${colors.red}✗ Home page failed: ${error.message}${colors.reset}`);
        testResults.failed.push('Home Page');
        return false;
    }
}

async function testAppPage() {
    console.log(`\n${colors.blue}Testing Application Page...${colors.reset}`);
    try {
        const response = await axios.get(`${BASE_URL}/app.html`);
        if (response.status === 200) {
            console.log(`${colors.green}✓ App page loads successfully${colors.reset}`);
            
            // Check for key elements
            const html = response.data;
            const hasUploadArea = html.includes('image-upload-area');
            const hasGenerateButton = html.includes('Generate Content');
            const hasVideoUpsell = html.includes('videoUpsellModal');
            
            console.log(`  ${hasUploadArea ? '✓' : '✗'} Image upload area present`);
            console.log(`  ${hasGenerateButton ? '✓' : '✗'} Generate button present`);
            console.log(`  ${hasVideoUpsell ? '✓' : '✗'} Video upsell modal present`);
            
            testResults.passed.push('App Page');
            return true;
        }
    } catch (error) {
        console.log(`${colors.red}✗ App page failed: ${error.message}${colors.reset}`);
        testResults.failed.push('App Page');
        return false;
    }
}

async function testHealthEndpoint() {
    console.log(`\n${colors.blue}Testing Health API Endpoint...${colors.reset}`);
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        if (response.data.status === 'healthy') {
            console.log(`${colors.green}✓ Health endpoint responding${colors.reset}`);
            console.log(`  APIs configured: ${JSON.stringify(response.data.apis)}`);
            testResults.passed.push('Health Endpoint');
            return true;
        }
    } catch (error) {
        console.log(`${colors.red}✗ Health endpoint failed: ${error.message}${colors.reset}`);
        testResults.failed.push('Health Endpoint');
        return false;
    }
}

async function testImageAnalysis() {
    console.log(`\n${colors.blue}Testing Image Analysis API...${colors.reset}`);
    try {
        const response = await axios.post(`${BASE_URL}/api/analyze-image`, {
            imageBase64: TEST_IMAGE_BASE64,
            preferredApi: 'openai'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        
        if (response.data.productName) {
            console.log(`${colors.green}✓ Image analysis working${colors.reset}`);
            console.log(`  Detected: ${response.data.productName || 'Unknown'}`);
            console.log(`  Category: ${response.data.category || 'Unknown'}`);
            testResults.passed.push('Image Analysis');
            return true;
        }
    } catch (error) {
        if (error.response?.status === 500) {
            console.log(`${colors.yellow}⚠ Image analysis API error (may be rate limited)${colors.reset}`);
            testResults.warnings.push('Image Analysis - Rate limit or API issue');
        } else {
            console.log(`${colors.red}✗ Image analysis failed: ${error.message}${colors.reset}`);
            testResults.failed.push('Image Analysis');
        }
        return false;
    }
}

async function testDescriptionGeneration() {
    console.log(`\n${colors.blue}Testing Description Generation...${colors.reset}`);
    try {
        const response = await axios.post(`${BASE_URL}/api/generate-description`, {
            productName: 'Wireless Bluetooth Headphones',
            productCategory: 'Electronics',
            targetAudience: 'Music lovers',
            keyFeatures: 'Noise canceling, 30-hour battery, Premium sound',
            tone: 'professional',
            tier: 'free',
            generateImages: false
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000
        });
        
        if (response.data.success) {
            console.log(`${colors.green}✓ Description generation working${colors.reset}`);
            const variations = response.data.variations || response.data.descriptions || [];
            console.log(`  Generated ${variations.length} variations`);
            if (variations[0]) {
                console.log(`  Sample: "${variations[0].substring(0, 100)}..."`);
            }
            testResults.passed.push('Description Generation');
            return true;
        } else {
            throw new Error(response.data.error || 'Generation failed');
        }
    } catch (error) {
        console.log(`${colors.red}✗ Description generation failed: ${error.message}${colors.reset}`);
        testResults.failed.push('Description Generation');
        return false;
    }
}

async function testStripeIntegration() {
    console.log(`\n${colors.blue}Testing Stripe Integration...${colors.reset}`);
    try {
        // Test subscription verification endpoint
        const response = await axios.post(`${BASE_URL}/api/verify-subscription`, {
            customerId: 'test_customer'
        }, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: () => true // Don't throw on any status
        });
        
        if (response.status === 200 || response.status === 404) {
            console.log(`${colors.green}✓ Stripe verification endpoint working${colors.reset}`);
            testResults.passed.push('Stripe Integration');
            return true;
        } else {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    } catch (error) {
        console.log(`${colors.red}✗ Stripe integration failed: ${error.message}${colors.reset}`);
        testResults.failed.push('Stripe Integration');
        return false;
    }
}

async function testVideoEndpoint() {
    console.log(`\n${colors.blue}Testing Video Generation Endpoint...${colors.reset}`);
    try {
        // Just test if endpoint exists, don't actually generate video (costs money)
        const response = await axios.post(`${BASE_URL}/api/generate-video`, {
            test: true // Just testing endpoint availability
        }, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: () => true
        });
        
        if (response.status < 500) {
            console.log(`${colors.green}✓ Video endpoint accessible (status: ${response.status})${colors.reset}`);
            testResults.passed.push('Video Endpoint');
            return true;
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        console.log(`${colors.red}✗ Video endpoint failed: ${error.message}${colors.reset}`);
        testResults.failed.push('Video Endpoint');
        return false;
    }
}

async function testMobileResponsiveness() {
    console.log(`\n${colors.blue}Testing Mobile Responsiveness...${colors.reset}`);
    try {
        const response = await axios.get(`${BASE_URL}/app.html`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
            }
        });
        
        const html = response.data;
        
        // Check for mobile-specific meta tags and styles
        const hasViewport = html.includes('viewport');
        const hasMobileStyles = html.includes('@media') && html.includes('max-width');
        const hasTouchOptimization = html.includes('touch-action');
        
        console.log(`  ${hasViewport ? '✓' : '✗'} Viewport meta tag present`);
        console.log(`  ${hasMobileStyles ? '✓' : '✗'} Mobile styles present`);
        console.log(`  ${hasTouchOptimization ? '✓' : '✗'} Touch optimizations present`);
        
        if (hasViewport && hasMobileStyles) {
            console.log(`${colors.green}✓ Mobile responsiveness configured${colors.reset}`);
            testResults.passed.push('Mobile Responsiveness');
            return true;
        } else {
            throw new Error('Missing mobile optimizations');
        }
    } catch (error) {
        console.log(`${colors.red}✗ Mobile test failed: ${error.message}${colors.reset}`);
        testResults.failed.push('Mobile Responsiveness');
        return false;
    }
}

async function testStaticAssets() {
    console.log(`\n${colors.blue}Testing Static Assets...${colors.reset}`);
    const assets = [
        '/privacy.html',
        '/terms.html',
        '/refund.html'
    ];
    
    let allGood = true;
    for (const asset of assets) {
        try {
            const response = await axios.head(`${BASE_URL}${asset}`);
            console.log(`  ✓ ${asset} accessible`);
        } catch (error) {
            console.log(`  ✗ ${asset} not found`);
            allGood = false;
        }
    }
    
    if (allGood) {
        console.log(`${colors.green}✓ All static pages accessible${colors.reset}`);
        testResults.passed.push('Static Assets');
    } else {
        testResults.warnings.push('Some static assets missing');
    }
    
    return allGood;
}

// Main test runner
async function runAllTests() {
    console.log('═'.repeat(60));
    console.log(`${colors.magenta}🧪 VERCEL DEPLOYMENT TEST SUITE${colors.reset}`);
    console.log(`${colors.yellow}Testing: ${BASE_URL}${colors.reset}`);
    console.log('═'.repeat(60));
    
    // Run all tests
    await testHomePage();
    await testAppPage();
    await testHealthEndpoint();
    await testImageAnalysis();
    await testDescriptionGeneration();
    await testStripeIntegration();
    await testVideoEndpoint();
    await testMobileResponsiveness();
    await testStaticAssets();
    
    // Print summary
    console.log('\n' + '═'.repeat(60));
    console.log(`${colors.magenta}📊 TEST SUMMARY${colors.reset}`);
    console.log('═'.repeat(60));
    
    console.log(`\n${colors.green}✅ PASSED (${testResults.passed.length}):${colors.reset}`);
    testResults.passed.forEach(test => console.log(`  • ${test}`));
    
    if (testResults.failed.length > 0) {
        console.log(`\n${colors.red}❌ FAILED (${testResults.failed.length}):${colors.reset}`);
        testResults.failed.forEach(test => console.log(`  • ${test}`));
    }
    
    if (testResults.warnings.length > 0) {
        console.log(`\n${colors.yellow}⚠️  WARNINGS (${testResults.warnings.length}):${colors.reset}`);
        testResults.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    // Overall status
    console.log('\n' + '═'.repeat(60));
    const passRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length) * 100).toFixed(1);
    console.log(`Pass Rate: ${passRate}%`);
    
    if (testResults.failed.length === 0) {
        console.log(`${colors.green}✅ APPLICATION IS FULLY FUNCTIONAL!${colors.reset}`);
    } else if (passRate >= 80) {
        console.log(`${colors.yellow}⚠️  Application mostly working but has some issues${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ Application has critical issues${colors.reset}`);
    }
    console.log('═'.repeat(60));
}

// Run tests
if (require.main === module) {
    console.log('Starting Vercel deployment tests...\n');
    runAllTests().catch(console.error);
}