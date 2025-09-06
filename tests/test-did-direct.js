const axios = require('axios');
require('dotenv').config();

async function testDIDDirectly() {
    console.log('🎬 Testing D-ID API Directly...\n');
    
    const D_ID_API_KEY = process.env.D_ID_API_KEY;
    console.log('D-ID API Key:', D_ID_API_KEY ? `Found (${D_ID_API_KEY.substring(0, 10)}...)` : 'NOT FOUND');
    
    if (!D_ID_API_KEY) {
        console.error('❌ D-ID API key not found in environment variables');
        return;
    }
    
    try {
        // Simple test with minimal script
        const talkData = {
            script: {
                type: 'text',
                input: 'Hello! Check out this amazing product that will change your life!',
                provider: {
                    type: 'microsoft',
                    voice_id: 'en-US-JennyNeural'
                }
            },
            source_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
            config: {
                fluent: true,
                pad_audio: 0.0,
                stitch: true
            }
        };
        
        console.log('📡 Calling D-ID API...');
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
        
        console.log('✅ D-ID Talk Created!');
        console.log('  Talk ID:', response.data.id);
        console.log('  Status:', response.data.status);
        console.log('  Created at:', response.data.created_at);
        
        // Poll for completion
        console.log('\n⏳ Waiting for video generation...');
        const talkId = response.data.id;
        let attempts = 0;
        let videoUrl = null;
        
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
            
            console.log(`  Attempt ${attempts + 1}: ${statusResponse.data.status}`);
            
            if (statusResponse.data.status === 'done') {
                videoUrl = statusResponse.data.result_url;
                console.log('\n✅ Video Generated Successfully!');
                console.log('  Video URL:', videoUrl);
                console.log('  Duration:', statusResponse.data.duration, 'seconds');
                break;
            } else if (statusResponse.data.status === 'error') {
                console.error('❌ Video generation failed:', statusResponse.data.error);
                break;
            }
            
            attempts++;
        }
        
        if (!videoUrl && attempts >= 30) {
            console.log('⏱️ Timeout: Video generation took too long');
        }
        
    } catch (error) {
        console.error('\n❌ D-ID API Error:');
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Message:', error.response.data?.message || error.response.statusText);
            console.error('  Details:', JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 402) {
                console.error('\n💳 Payment Required - You may be out of D-ID credits');
            } else if (error.response.status === 401) {
                console.error('\n🔐 Authentication Failed - Check your D-ID API key');
            }
        } else {
            console.error('  Error:', error.message);
        }
    }
}

// Run the test
testDIDDirectly();