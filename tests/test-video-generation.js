const axios = require('axios');

async function testVideoGeneration() {
    console.log('Testing Video Generation with D-ID API...\n');

    try {
        // Test the video generation endpoint
        const response = await axios.post('http://localhost:3000/api/generate-video', {
            script: "Welcome to our amazing wireless headphones! These premium headphones feature active noise cancellation, incredible 30-hour battery life, and crystal clear audio quality. Perfect for music lovers who demand the best. Get yours today and experience audio like never before!",
            productName: "wireless-headphones-test",
            avatar: "anna",
            language: "en-US",
            duration: "30",
            images: []
        });

        console.log('✅ Video Generation Response:');
        console.log('Success:', response.data.success);
        console.log('Demo Mode:', response.data.demo);
        console.log('Message:', response.data.message);
        
        if (response.data.videoUrl) {
            console.log('\n📹 Video URLs:');
            console.log('  Main URL:', response.data.videoUrl);
            console.log('  Local URL:', response.data.localVideoUrl || 'Not saved locally');
            console.log('  Cloudinary URL:', response.data.cloudinaryVideoUrl || 'Not uploaded');
            console.log('  D-ID Original:', response.data.d_id_url || 'Not available');
        }
        
        if (response.data.cloudinaryVideoData) {
            console.log('\n☁️ Cloudinary Video Data:');
            console.log('  Public ID:', response.data.cloudinaryVideoData.public_id);
            console.log('  Duration:', response.data.cloudinaryVideoData.duration, 'seconds');
            console.log('  Format:', response.data.cloudinaryVideoData.format);
            console.log('  Size:', response.data.cloudinaryVideoData.size, 'bytes');
        }
        
        console.log('\n🎭 Avatar Used:', response.data.avatarUsed);
        console.log('🗣️ Voice Used:', response.data.voiceUsed || response.data.language);
        
        if (response.data.talkId) {
            console.log('🆔 D-ID Talk ID:', response.data.talkId);
        }
        
        // Check if we can access the video
        if (response.data.localVideoUrl) {
            console.log('\n📂 Local video should be available at: http://localhost:3000' + response.data.localVideoUrl);
        }
        
        console.log('\n✨ Video generation test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

// Run the test
testVideoGeneration();