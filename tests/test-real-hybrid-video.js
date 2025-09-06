const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

// Import video composer
const videoComposer = require('./video-composer');

async function createRealHybridUGCVideo() {
    console.log('🎬 Creating REAL Hybrid UGC Video with D-ID + Product Images...\n');
    
    const D_ID_API_KEY = process.env.D_ID_API_KEY;
    
    if (!D_ID_API_KEY) {
        console.error('❌ D-ID API key not found');
        return;
    }
    
    console.log('✅ D-ID API Key found');
    console.log('📦 Product: Premium Wireless Headphones\n');
    
    try {
        // Step 1: Create D-ID avatar video
        console.log('Step 1: Creating D-ID avatar video...');
        
        const script = `Hey everyone! I just got these amazing wireless headphones and I'm absolutely in love! 
        The sound quality is incredible, the noise cancellation is next level, and the battery lasts forever! 
        Seriously, if you're looking for headphones that will change your music experience, these are it!`;
        
        const talkData = {
            script: {
                type: 'text',
                input: script,
                provider: {
                    type: 'microsoft',
                    voice_id: 'en-US-AriaNeural'  // Female voice
                }
            },
            source_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
            config: {
                fluent: true,
                pad_audio: 0.0,
                stitch: true
            }
        };
        
        const response = await axios.post(
            'https://api.d-id.com/talks',
            talkData,
            {
                headers: {
                    'Authorization': `Basic ${D_ID_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        
        const talkId = response.data.id;
        console.log('  Talk ID:', talkId);
        
        // Poll for completion
        console.log('  Waiting for video generation...');
        let videoUrl = null;
        let attempts = 0;
        
        while (attempts < 30 && !videoUrl) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await axios.get(
                `https://api.d-id.com/talks/${talkId}`,
                {
                    headers: {
                        'Authorization': `Basic ${D_ID_API_KEY}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (statusResponse.data.status === 'done') {
                videoUrl = statusResponse.data.result_url;
                console.log('  ✅ Avatar video created!\n');
                break;
            } else if (statusResponse.data.status === 'error') {
                throw new Error('Video generation failed');
            }
            
            attempts++;
        }
        
        if (!videoUrl) {
            throw new Error('Video generation timeout');
        }
        
        // Step 2: Download the D-ID video
        console.log('Step 2: Downloading avatar video...');
        const videoResponse = await fetch(videoUrl);
        const videoBuffer = await videoResponse.buffer();
        
        const avatarVideoPath = path.join('generated-videos', `avatar_${Date.now()}.mp4`);
        fs.writeFileSync(avatarVideoPath, videoBuffer);
        console.log('  ✅ Avatar video saved:', avatarVideoPath, '\n');
        
        // Step 3: Create hybrid video with product images
        console.log('Step 3: Creating hybrid UGC video with product images...');
        
        const productImages = [
            { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
            { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800' },
            { url: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800' },
            { url: 'https://images.unsplash.com/photo-1481207727306-1a9f151fca7d?w=800' }
        ];
        
        const hybridVideoPath = path.join('generated-videos', `hybrid_ugc_${Date.now()}.mp4`);
        
        const hybridResult = await videoComposer.createHybridUGCVideo({
            avatarVideoPath: avatarVideoPath,
            productImages: productImages,
            outputPath: hybridVideoPath,
            style: 'splitScreen',
            productName: 'Premium Wireless Headphones',
            duration: 30
        });
        
        console.log('  ✅ Hybrid video created:', hybridVideoPath);
        
        // Step 4: Summary
        console.log('\n🎉 SUCCESS! Real Hybrid UGC Video Created!');
        console.log('📁 Files Generated:');
        console.log('  1. Avatar Video:', avatarVideoPath);
        console.log('  2. Hybrid UGC Video:', hybridVideoPath);
        console.log('\n💡 The hybrid video shows:');
        console.log('  - Left side: D-ID avatar enthusiastically talking about the product');
        console.log('  - Right side: Product images in an attractive collage');
        console.log('  - Result: Authentic-looking UGC product demonstration!');
        console.log('\n💳 D-ID Credits Used: 1');
        console.log('   Remaining Credits: ~2-3');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Details:', error.response.data);
        }
    }
}

// Run the test
createRealHybridUGCVideo();