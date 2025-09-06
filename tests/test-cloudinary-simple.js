const axios = require('axios');

async function testCloudinary() {
    console.log('Testing Cloudinary integration...\n');

    try {
        // Test the API endpoint
        const response = await axios.post('http://localhost:3000/api/generate-description', {
            productName: 'Test Headphones',
            category: 'Electronics', 
            features: 'Wireless, Noise cancellation',
            targetAudience: 'Music lovers',
            tone: 'professional',
            tier: 'standard',
            generateImages: 'true'
        });

        console.log('✅ API Response received!');
        console.log('Generated Images Count:', response.data.generatedImages?.length || 0);
        
        if (response.data.generatedImages) {
            response.data.generatedImages.forEach((img, i) => {
                console.log(`\nImage ${i + 1}:`);
                console.log('  Local URL:', img.url);
                console.log('  Cloudinary URL:', img.cloudinaryUrl || 'Not uploaded');
                console.log('  Style:', img.style);
            });
        }

        if (response.data.uploadedImageUrl) {
            console.log('\nUploaded Image URL:', response.data.uploadedImageUrl);
        }

        console.log('\n✨ Cloudinary integration test successful!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testCloudinary();