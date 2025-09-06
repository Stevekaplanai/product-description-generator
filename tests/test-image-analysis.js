const fs = require('fs');
const path = require('path');

// Test the image analysis API endpoint locally
async function testImageAnalysis() {
    console.log('Testing Image Analysis API...\n');
    
    // Sample base64 image (1x1 red pixel for testing)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    const testCases = [
        {
            name: 'OpenAI Vision Test',
            preferredApi: 'openai'
        },
        {
            name: 'Gemini Vision Test',
            preferredApi: 'gemini'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n${testCase.name}:`);
        console.log('=' .repeat(50));
        
        try {
            const response = await fetch('http://localhost:3000/api/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageBase64: testImageBase64,
                    preferredApi: testCase.preferredApi
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log('Analysis Result:');
            console.log(JSON.stringify(data, null, 2));
            
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }
}

// Instructions for testing
console.log('='.repeat(60));
console.log('IMAGE ANALYSIS TEST INSTRUCTIONS');
console.log('='.repeat(60));
console.log('\n1. Make sure your server is running locally:');
console.log('   npm run dev\n');
console.log('2. Ensure you have API keys set in .env:');
console.log('   - OPENAI_API_KEY');
console.log('   - GEMINI_API_KEY\n');
console.log('3. Run this test:');
console.log('   node tests/test-image-analysis.js\n');
console.log('='.repeat(60));

// Only run if called directly
if (require.main === module) {
    testImageAnalysis();
}