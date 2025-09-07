/**
 * Comprehensive API Testing Suite
 * Tests all APIs: Cloudinary, D-ID, Stripe, OpenAI, Gemini
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import required libraries
const cloudinary = require('cloudinary').v2;
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Stripe = require('stripe');
const axios = require('axios');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

// Test results
let results = {
    passed: [],
    failed: [],
    warnings: []
};

// 1. Test Environment Variables
async function testEnvironmentVariables() {
    console.log(`\n${colors.blue}═══ Testing Environment Variables ═══${colors.reset}`);
    
    const required = {
        'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
        'GEMINI_API_KEY': process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
        'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
        'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
        'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET,
        'D_ID_API_KEY': process.env.D_ID_API_KEY,
        'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
        'STRIPE_PUBLISHABLE_KEY': process.env.STRIPE_PUBLISHABLE_KEY,
        'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
        'STRIPE_PRICE_VIDEO_SINGLE': process.env.STRIPE_PRICE_VIDEO_SINGLE,
        'STRIPE_PRICE_VIDEO_TRIPLE': process.env.STRIPE_PRICE_VIDEO_TRIPLE
    };
    
    let allPresent = true;
    for (const [key, value] of Object.entries(required)) {
        if (value && value !== 'your_' && !value.includes('placeholder')) {
            console.log(`${colors.green}✓${colors.reset} ${key} is configured`);
        } else {
            console.log(`${colors.red}✗${colors.reset} ${key} is missing or placeholder`);
            allPresent = false;
            results.warnings.push(`Missing: ${key}`);
        }
    }
    
    if (allPresent) {
        results.passed.push('Environment Variables');
    } else {
        results.failed.push('Environment Variables - Some keys missing');
    }
    
    return allPresent;
}

// 2. Test Cloudinary API
async function testCloudinary() {
    console.log(`\n${colors.blue}═══ Testing Cloudinary API ═══${colors.reset}`);
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME.includes('your_')) {
        console.log(`${colors.yellow}⚠ Cloudinary not configured - skipping${colors.reset}`);
        results.warnings.push('Cloudinary not configured');
        return false;
    }
    
    try {
        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        // Test by uploading a small test image
        const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        const uploadResult = await cloudinary.uploader.upload(testImageBase64, {
            folder: 'test',
            public_id: 'api_test_' + Date.now()
        });
        
        console.log(`${colors.green}✓ Cloudinary upload successful${colors.reset}`);
        console.log(`  URL: ${uploadResult.secure_url}`);
        
        // Clean up test image
        await cloudinary.uploader.destroy(uploadResult.public_id);
        console.log(`${colors.green}✓ Cloudinary cleanup successful${colors.reset}`);
        
        results.passed.push('Cloudinary API');
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ Cloudinary test failed: ${error.message}${colors.reset}`);
        results.failed.push('Cloudinary API');
        return false;
    }
}

// 3. Test D-ID Video API
async function testDID() {
    console.log(`\n${colors.blue}═══ Testing D-ID Video API ═══${colors.reset}`);
    
    if (!process.env.D_ID_API_KEY || process.env.D_ID_API_KEY.includes('your_')) {
        console.log(`${colors.yellow}⚠ D-ID not configured - skipping${colors.reset}`);
        results.warnings.push('D-ID not configured');
        return false;
    }
    
    try {
        // Test D-ID API authentication
        const response = await axios.get('https://api.d-id.com/avatars', {
            headers: {
                'Authorization': `Basic ${process.env.D_ID_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`${colors.green}✓ D-ID API authentication successful${colors.reset}`);
        console.log(`  Available avatars: ${response.data.avatars?.length || 0}`);
        
        results.passed.push('D-ID API');
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            console.log(`${colors.red}✗ D-ID API key invalid${colors.reset}`);
        } else {
            console.log(`${colors.red}✗ D-ID test failed: ${error.message}${colors.reset}`);
        }
        results.failed.push('D-ID API');
        return false;
    }
}

// 4. Test Stripe API
async function testStripe() {
    console.log(`\n${colors.blue}═══ Testing Stripe API ═══${colors.reset}`);
    
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_')) {
        console.log(`${colors.yellow}⚠ Stripe not configured - skipping${colors.reset}`);
        results.warnings.push('Stripe not configured');
        return false;
    }
    
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        // Test by listing products
        const products = await stripe.products.list({ limit: 1 });
        console.log(`${colors.green}✓ Stripe API connection successful${colors.reset}`);
        console.log(`  Products found: ${products.data.length}`);
        
        // Check for video products
        if (process.env.STRIPE_PRICE_VIDEO_SINGLE && !process.env.STRIPE_PRICE_VIDEO_SINGLE.includes('placeholder')) {
            try {
                const singlePrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_VIDEO_SINGLE);
                console.log(`${colors.green}✓ Single video price found: $${singlePrice.unit_amount / 100}${colors.reset}`);
            } catch (e) {
                console.log(`${colors.yellow}⚠ Single video price ID not valid${colors.reset}`);
                results.warnings.push('Single video price ID invalid');
            }
        }
        
        if (process.env.STRIPE_PRICE_VIDEO_TRIPLE && !process.env.STRIPE_PRICE_VIDEO_TRIPLE.includes('placeholder')) {
            try {
                const triplePrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_VIDEO_TRIPLE);
                console.log(`${colors.green}✓ Triple video price found: $${triplePrice.unit_amount / 100}${colors.reset}`);
            } catch (e) {
                console.log(`${colors.yellow}⚠ Triple video price ID not valid${colors.reset}`);
                results.warnings.push('Triple video price ID invalid');
            }
        }
        
        results.passed.push('Stripe API');
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ Stripe test failed: ${error.message}${colors.reset}`);
        results.failed.push('Stripe API');
        return false;
    }
}

// 5. Test OpenAI API
async function testOpenAI() {
    console.log(`\n${colors.blue}═══ Testing OpenAI API ═══${colors.reset}`);
    
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_')) {
        console.log(`${colors.yellow}⚠ OpenAI not configured - skipping${colors.reset}`);
        results.warnings.push('OpenAI not configured');
        return false;
    }
    
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // Test with a simple completion
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Say "API test successful"' }],
            max_tokens: 10
        });
        
        console.log(`${colors.green}✓ OpenAI API test successful${colors.reset}`);
        console.log(`  Response: ${completion.choices[0].message.content}`);
        
        // Test image generation capability
        try {
            console.log(`  Testing DALL-E 3...`);
            const image = await openai.images.generate({
                model: "dall-e-3",
                prompt: "A simple red dot",
                n: 1,
                size: "1024x1024",
                quality: "standard"
            });
            console.log(`${colors.green}✓ DALL-E 3 image generation working${colors.reset}`);
        } catch (imgError) {
            console.log(`${colors.yellow}⚠ DALL-E 3 not available: ${imgError.message}${colors.reset}`);
            results.warnings.push('DALL-E 3 not available');
        }
        
        results.passed.push('OpenAI API');
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ OpenAI test failed: ${error.message}${colors.reset}`);
        results.failed.push('OpenAI API');
        return false;
    }
}

// 6. Test Google Gemini API
async function testGemini() {
    console.log(`\n${colors.blue}═══ Testing Google Gemini API ═══${colors.reset}`);
    
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!geminiKey || geminiKey.includes('your_')) {
        console.log(`${colors.yellow}⚠ Gemini not configured - skipping${colors.reset}`);
        results.warnings.push('Gemini not configured');
        return false;
    }
    
    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const result = await model.generateContent('Say "API test successful"');
        const response = await result.response;
        const text = response.text();
        
        console.log(`${colors.green}✓ Gemini API test successful${colors.reset}`);
        console.log(`  Response: ${text.substring(0, 50)}...`);
        
        results.passed.push('Gemini API');
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ Gemini test failed: ${error.message}${colors.reset}`);
        results.failed.push('Gemini API');
        return false;
    }
}

// 7. Test API Endpoints
async function testAPIEndpoints() {
    console.log(`\n${colors.blue}═══ Testing API Endpoints ═══${colors.reset}`);
    
    const baseUrl = 'http://localhost:3000';
    const endpoints = [
        { path: '/api/health', method: 'GET', name: 'Health Check' },
        { path: '/api/generate-description', method: 'POST', name: 'Description Generation' },
        { path: '/api/analyze-image', method: 'POST', name: 'Image Analysis' },
        { path: '/api/generate-video', method: 'POST', name: 'Video Generation' }
    ];
    
    console.log(`${colors.yellow}Note: Start your local server first (node server.js)${colors.reset}`);
    
    for (const endpoint of endpoints) {
        try {
            const options = {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            if (endpoint.method === 'POST') {
                // Add minimal test data
                if (endpoint.path.includes('description')) {
                    options.data = { productName: 'Test Product' };
                } else if (endpoint.path.includes('image')) {
                    options.data = { imageBase64: 'test' };
                } else if (endpoint.path.includes('video')) {
                    options.data = { script: 'Test', avatar: 'amy' };
                }
            }
            
            const response = await axios({
                url: baseUrl + endpoint.path,
                ...options,
                validateStatus: () => true // Don't throw on any status
            });
            
            if (response.status < 500) {
                console.log(`${colors.green}✓ ${endpoint.name} endpoint accessible (${response.status})${colors.reset}`);
            } else {
                console.log(`${colors.red}✗ ${endpoint.name} endpoint error (${response.status})${colors.reset}`);
            }
        } catch (error) {
            console.log(`${colors.yellow}⚠ ${endpoint.name} - Server not running${colors.reset}`);
        }
    }
}

// Main test runner
async function runAllTests() {
    console.log('═'.repeat(60));
    console.log(`${colors.magenta}🧪 COMPREHENSIVE API TEST SUITE${colors.reset}`);
    console.log('═'.repeat(60));
    
    // Run all tests
    await testEnvironmentVariables();
    await testCloudinary();
    await testDID();
    await testStripe();
    await testOpenAI();
    await testGemini();
    await testAPIEndpoints();
    
    // Print summary
    console.log('\n' + '═'.repeat(60));
    console.log(`${colors.magenta}📊 TEST SUMMARY${colors.reset}`);
    console.log('═'.repeat(60));
    
    if (results.passed.length > 0) {
        console.log(`\n${colors.green}✅ PASSED (${results.passed.length}):${colors.reset}`);
        results.passed.forEach(test => console.log(`  • ${test}`));
    }
    
    if (results.failed.length > 0) {
        console.log(`\n${colors.red}❌ FAILED (${results.failed.length}):${colors.reset}`);
        results.failed.forEach(test => console.log(`  • ${test}`));
    }
    
    if (results.warnings.length > 0) {
        console.log(`\n${colors.yellow}⚠️  WARNINGS (${results.warnings.length}):${colors.reset}`);
        results.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    // Overall status
    console.log('\n' + '═'.repeat(60));
    if (results.failed.length === 0 && results.warnings.length < 3) {
        console.log(`${colors.green}✅ System is ready for production!${colors.reset}`);
    } else if (results.failed.length === 0) {
        console.log(`${colors.yellow}⚠️  System functional but some APIs not configured${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ Critical issues found - please fix before deploying${colors.reset}`);
    }
    
    console.log('═'.repeat(60));
}

// Run tests
if (require.main === module) {
    runAllTests().catch(console.error);
}