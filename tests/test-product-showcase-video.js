const axios = require('axios');

async function testProductShowcaseVideo() {
    console.log('🎬 Testing Product Showcase Video Generation...\n');

    try {
        // First, let's assume we have some product data
        const productData = {
            productName: "Premium Wireless Headphones",
            productDescription: "Experience crystal clear audio with our premium wireless headphones featuring active noise cancellation and 30-hour battery life.",
            features: "Active Noise Cancellation\n30-Hour Battery Life\nHi-Res Audio Quality\nComfortable Memory Foam Ear Cushions\nBluetooth 5.0 Connection",
            generateProductShowcase: true,
            avatar: "anna",
            language: "en-US",
            images: [
                { url: "https://example.com/headphones-image1.jpg" },
                { url: "https://example.com/headphones-image2.jpg" }
            ]
        };

        console.log('📦 Product Information:');
        console.log('  Name:', productData.productName);
        console.log('  Description:', productData.productDescription);
        console.log('  Features:', productData.features.split('\n').length, 'features');
        console.log('  Avatar:', productData.avatar);
        console.log('  Images:', productData.images.length, 'product images\n');

        // Test the video generation endpoint
        const response = await axios.post('http://localhost:3000/api/generate-video', productData);

        console.log('✅ Video Generation Response:');
        console.log('  Success:', response.data.success);
        console.log('  Is Product Showcase:', response.data.isProductShowcase);
        console.log('  Message:', response.data.message);
        
        if (response.data.error) {
            console.log('  Error:', response.data.error);
        }
        if (response.data.debugInfo) {
            console.log('  Debug Info:', JSON.stringify(response.data.debugInfo, null, 2));
        }
        
        if (response.data.showcaseScript) {
            console.log('\n📝 Generated Showcase Script:');
            console.log('  "' + response.data.showcaseScript + '"');
        }
        
        if (response.data.videoUrl) {
            console.log('\n📹 Video URLs:');
            console.log('  Main URL:', response.data.videoUrl);
            console.log('  Cloudinary URL:', response.data.cloudinaryVideoUrl || 'Processing...');
            console.log('  Local URL:', response.data.localVideoUrl || 'Not saved locally');
        }
        
        if (response.data.cloudinaryVideoData) {
            console.log('\n☁️ Cloudinary Video Details:');
            console.log('  Public ID:', response.data.cloudinaryVideoData.public_id);
            console.log('  Duration:', response.data.cloudinaryVideoData.duration, 'seconds');
            console.log('  Size:', (response.data.cloudinaryVideoData.bytes / 1024 / 1024).toFixed(2), 'MB');
        }
        
        if (response.data.productImages && response.data.productImages.length > 0) {
            console.log('\n🖼️ Product Images Referenced:', response.data.productImages.length);
        }
        
        console.log('\n✨ Product showcase video test completed successfully!');
        console.log('💡 Note: D-ID creates a talking avatar video. To combine with product images,');
        console.log('   you would need a video editing service to create a composite video.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

// Alternative test with custom script
async function testCustomProductVideo() {
    console.log('\n🎭 Testing Custom Product Video Script...\n');
    
    try {
        const customData = {
            script: "Check out this amazing product that will change your life! It's innovative, affordable, and exactly what you've been looking for.",
            productName: "Smart Home Assistant",
            generateProductShowcase: true, // This will enhance the script
            avatar: "sophia",
            language: "en-US"
        };
        
        const response = await axios.post('http://localhost:3000/api/generate-video', customData);
        
        console.log('✅ Custom Video Response:');
        console.log('  Success:', response.data.success);
        console.log('  Enhanced Script Used:', response.data.showcaseScript ? 'Yes' : 'No');
        if (response.data.showcaseScript) {
            console.log('  Script:', response.data.showcaseScript.substring(0, 100) + '...');
        }
        console.log('  Video URL:', response.data.videoUrl ? 'Generated' : 'Failed');
        
    } catch (error) {
        console.error('❌ Custom video error:', error.message);
    }
}

// Run both tests
async function runTests() {
    await testProductShowcaseVideo();
    await testCustomProductVideo();
}

// Execute tests
runTests();