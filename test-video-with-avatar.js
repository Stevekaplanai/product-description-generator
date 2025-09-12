// Test video generation with avatar selection
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testVideoGeneration() {
    console.log('Testing video generation with avatar selection...\n');
    
    const testData = {
        productName: 'Eco-Friendly Water Bottle',
        productDescription: 'Stay hydrated sustainably with our premium stainless steel water bottle.',
        features: 'BPA-free, keeps drinks cold for 24 hours, leak-proof design',
        avatarId: 'professional-female', // Using Sarah avatar
        voice: 'en-US-JennyNeural',
        customScript: null // Let it auto-generate
    };
    
    console.log('Test configuration:');
    console.log('- Product:', testData.productName);
    console.log('- Avatar:', testData.avatarId);
    console.log('- Voice:', testData.voice);
    console.log('\nSending request to generate-video API...\n');
    
    // Import the generate-video module directly
    const generateVideo = require('./api/generate-video');
    
    // Mock request and response objects
    const mockReq = {
        method: 'POST',
        body: testData,
        headers: {
            'x-user-id': 'test-user-123'
        }
    };
    
    const mockRes = {
        headers: {},
        setHeader: function(key, value) {
            this.headers[key] = value;
        },
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log('Response Status:', this.statusCode || 200);
            console.log('Response Data:', JSON.stringify(data, null, 2));
            
            if (data.success) {
                console.log('\n✅ SUCCESS!');
                if (data.videoId) {
                    console.log('Video ID:', data.videoId);
                    console.log('Status:', data.status);
                    console.log('Avatar Used:', data.avatarUsed);
                    console.log('\nVideo is being processed. Check status at:');
                    console.log(data.pollUrl);
                } else if (data.videoUrl) {
                    console.log('Video URL:', data.videoUrl);
                }
            } else {
                console.log('\n❌ FAILED');
                console.log('Error:', data.error || data.message);
            }
        },
        end: function() {
            console.log('Response ended');
        }
    };
    
    try {
        await generateVideo(mockReq, mockRes);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testVideoGeneration().catch(console.error);