// Test script for video generation with avatars
const fetch = require('node-fetch');

// Test configuration
const API_BASE_URL = 'https://productdescriptions.io'; // Production URL
const TEST_DATA = {
    productName: 'Test Product',
    productDescription: 'This is a test product for video generation',
    features: 'High quality, Fast shipping, Eco-friendly',
    avatarId: 'professional-female', // Testing with default avatar
    voice: 'en-US-JennyNeural',
    customScript: null
};

async function testGetAvatars() {
    console.log('\n📋 Testing GET /api/get-avatars...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-avatars`);
        const data = await response.json();

        if (data.success) {
            console.log('✅ Avatar endpoint working');
            console.log(`   - Found ${data.avatars.length} avatars`);
            console.log(`   - Found ${data.voices.length} voices`);
            console.log(`   - Default avatar: ${data.defaultAvatar}`);
            console.log(`   - Default voice: ${data.defaultVoice}`);

            // Display avatar categories
            console.log('\n   Avatar categories:');
            Object.keys(data.avatarsByCategory).forEach(category => {
                console.log(`     • ${category}: ${data.avatarsByCategory[category].length} avatars`);
            });

            return true;
        } else {
            console.error('❌ Avatar endpoint failed:', data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Avatar endpoint error:', error.message);
        return false;
    }
}

async function testGenerateVideo() {
    console.log('\n🎬 Testing POST /api/generate-video...');
    console.log('   Request data:', JSON.stringify(TEST_DATA, null, 2));

    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(TEST_DATA)
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Video generation request accepted');
            console.log(`   - Status: ${data.status || 'unknown'}`);
            if (data.videoId) {
                console.log(`   - Video ID: ${data.videoId}`);
            }
            if (data.avatarUsed) {
                console.log(`   - Avatar used: ${data.avatarUsed}`);
            }
            if (data.scriptUsed) {
                console.log(`   - Script generated: ${data.scriptUsed.substring(0, 100)}...`);
            }
            if (data.videoUrl) {
                console.log(`   - Video URL: ${data.videoUrl}`);
            }
            if (data.message) {
                console.log(`   - Message: ${data.message}`);
            }
            return true;
        } else {
            console.error('❌ Video generation failed:', data.error || data.message);
            if (data.details) {
                console.error('   Details:', data.details);
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Video generation error:', error.message);
        return false;
    }
}

async function checkD_IDApiKey() {
    console.log('\n🔑 Checking D-ID API configuration...');

    // This would normally check if the API key is set in environment
    // For now, we'll just make a note
    console.log('   Note: D-ID API key should be set in Vercel environment variables');
    console.log('   Variable name: D_ID_API_KEY');

    return true;
}

async function runTests() {
    console.log('🧪 Starting Video Generation Tests');
    console.log('=' .repeat(50));

    let allTestsPassed = true;

    // Test 1: Check D-ID configuration
    await checkD_IDApiKey();

    // Test 2: Get avatars
    const avatarsWork = await testGetAvatars();
    allTestsPassed = allTestsPassed && avatarsWork;

    // Test 3: Generate video
    if (avatarsWork) {
        const videoWorks = await testGenerateVideo();
        allTestsPassed = allTestsPassed && videoWorks;
    } else {
        console.log('\n⚠️  Skipping video generation test due to avatar endpoint failure');
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    if (allTestsPassed) {
        console.log('✅ All tests passed successfully!');
    } else {
        console.log('❌ Some tests failed. Please check the errors above.');
    }

    console.log('\n📝 Next steps:');
    console.log('   1. Ensure D_ID_API_KEY is set in Vercel environment');
    console.log('   2. Test with production URL: https://productdescriptions.io');
    console.log('   3. Check webhook endpoint at /api/webhooks/did-video');
    console.log('   4. Monitor Vercel function logs for any errors');
}

// Run tests
runTests().catch(console.error);