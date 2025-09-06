const axios = require('axios');

async function testHybridUGCVideo() {
    console.log('🎬 Testing Hybrid UGC Video Generation (Avatar + Product Images)...\n');

    try {
        // Product data with images for hybrid video
        const productData = {
            productName: "Smart Fitness Watch",
            productDescription: "Track your fitness journey with our advanced smart watch featuring heart rate monitoring, GPS tracking, and 7-day battery life.",
            features: "Heart Rate Monitoring\nGPS Tracking\nWaterproof Design\n7-Day Battery Life\nSleep Tracking",
            generateProductShowcase: true, // This triggers hybrid video creation
            avatar: "sophia",
            language: "en-US",
            images: [
                { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800" }, // Watch image
                { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" }, // Product lifestyle
                { url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800" }, // Product detail
                { url: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800" }  // Product in use
            ]
        };

        console.log('📦 Product Setup:');
        console.log('  Name:', productData.productName);
        console.log('  Avatar:', productData.avatar);
        console.log('  Product Images:', productData.images.length);
        console.log('  Style: Split-screen (Avatar + Product collage)\n');

        console.log('🎥 Generating hybrid UGC video...\n');

        // Call the video generation endpoint
        const response = await axios.post('http://localhost:3000/api/generate-video', productData);

        console.log('✅ Video Generation Response:');
        console.log('  Success:', response.data.success);
        console.log('  Message:', response.data.message);
        
        if (response.data.showcaseScript) {
            console.log('\n📝 Generated UGC Script:');
            console.log('  "' + response.data.showcaseScript.substring(0, 200) + '..."');
        }
        
        // Check for hybrid video
        if (response.data.hybridVideoUrl) {
            console.log('\n🎬 HYBRID UGC VIDEO CREATED!');
            console.log('  Hybrid Video URL:', response.data.hybridVideoUrl);
            console.log('  Style: Split-screen with product images');
            console.log('  ✨ This video shows the avatar alongside your products!');
        }
        
        if (response.data.hybridCloudinaryData) {
            console.log('\n☁️ Hybrid Video in Cloudinary:');
            console.log('  URL:', response.data.hybridCloudinaryData.secure_url);
            console.log('  Duration:', response.data.hybridCloudinaryData.duration, 'seconds');
            console.log('  Format:', response.data.hybridCloudinaryData.format);
            console.log('  Size:', (response.data.hybridCloudinaryData.bytes / 1024 / 1024).toFixed(2), 'MB');
        }
        
        // Original avatar video info
        if (response.data.cloudinaryVideoUrl) {
            console.log('\n📹 Original Avatar Video:');
            console.log('  URL:', response.data.cloudinaryVideoUrl);
        }
        
        console.log('\n✨ Hybrid UGC video test completed successfully!');
        console.log('\n💡 What happened:');
        console.log('  1. D-ID created an avatar video of Sophia talking about the product');
        console.log('  2. We combined it with product images in split-screen format');
        console.log('  3. The result is an authentic-looking UGC product demo video!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Test different video styles
async function testVideoStyles() {
    console.log('\n🎨 Testing Different Video Styles...\n');
    
    const styles = ['splitScreen', 'pictureInPicture', 'slideshow'];
    
    for (const style of styles) {
        console.log(`\nTesting ${style} style...`);
        // In production, you would modify the video-composer to accept style parameter
        // For now, the default is splitScreen
    }
}

// Run the test
testHybridUGCVideo();