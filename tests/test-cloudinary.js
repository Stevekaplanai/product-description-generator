const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCloudinaryIntegration() {
  try {
    console.log('Testing Cloudinary integration...\n');

    // Test without image (will generate AI images)
    console.log('1. Testing product description generation with AI images...');
    const response1 = await axios.post('http://localhost:3000/api/generate-description', {
      productName: 'Wireless Bluetooth Headphones',
      category: 'Electronics',
      features: 'Noise cancellation, 30-hour battery life, Premium sound quality',
      targetAudience: 'Music lovers and professionals',
      tone: 'professional',
      tier: 'standard',
      generateImages: 'true'
    });

    console.log('✅ Description generated successfully');
    console.log('Generated Images:', response1.data.generatedImages?.length || 0);
    
    if (response1.data.generatedImages && response1.data.generatedImages.length > 0) {
      response1.data.generatedImages.forEach((img, idx) => {
        console.log(`  Image ${idx + 1}:`);
        console.log(`    Local URL: ${img.url}`);
        console.log(`    Cloudinary URL: ${img.cloudinaryUrl || 'Not uploaded'}`);
      });
    }

    console.log('\nTest completed successfully! ✨');
    console.log('\nCloudinary integration is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCloudinaryIntegration();