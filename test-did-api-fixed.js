// Test D-ID API with valid public image URL
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const D_ID_API_KEY = process.env.D_ID_API_KEY;
const D_ID_API_URL = 'https://api.d-id.com';

async function testDIDAPIWithValidImage() {
  console.log('Testing D-ID API with valid public image...');
  console.log('API Key configured:', !!D_ID_API_KEY);
  
  if (!D_ID_API_KEY) {
    console.error('D_ID_API_KEY not found in environment variables');
    return;
  }

  // List of valid public images to test
  const testImages = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop', // Professional male
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=512&h=512&fit=crop', // Professional female
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=512&h=512&fit=crop' // Alternative
  ];

  for (const imageUrl of testImages) {
    console.log(`\n--- Testing with image: ${imageUrl.substring(0, 50)}... ---`);
    
    try {
      // D-ID expects API key in username:password format for Basic auth
      let authString;
      
      if (D_ID_API_KEY.includes(':')) {
        // Already in username:password format
        authString = Buffer.from(D_ID_API_KEY).toString('base64');
        console.log('Using API key as-is for Basic auth');
      } else {
        // Try as API key with empty password
        authString = Buffer.from(`${D_ID_API_KEY}:`).toString('base64');
        console.log('Using API key with empty password for Basic auth');
      }
      
      const payload = {
        script: {
          type: 'text',
          input: 'Hello! This is a test of the D-ID API with a valid public image.',
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-JennyNeural'
          }
        },
        source_url: imageUrl
      };
      
      console.log('Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${D_ID_API_URL}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('Response data:', JSON.stringify(responseData, null, 2));
        
        if (responseData.id) {
          console.log('✅ SUCCESS! Video job created with ID:', responseData.id);
          console.log('Status:', responseData.status);
          
          // Wait a moment then check status
          console.log('\nWaiting 5 seconds before checking status...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const statusResponse = await fetch(`${D_ID_API_URL}/talks/${responseData.id}`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'accept': 'application/json'
            }
          });
          
          const statusData = await statusResponse.json();
          console.log('Video status:', statusData.status);
          if (statusData.result_url) {
            console.log('Video URL:', statusData.result_url);
          }
          
          // Found working configuration, can stop testing
          console.log('\n✅ WORKING CONFIGURATION FOUND!');
          console.log('Image URL:', imageUrl);
          return;
        } else if (responseData.error || responseData.message) {
          console.log('❌ Error:', responseData.error || responseData.message);
          if (responseData.kind === 'BadRequestError' && responseData.description) {
            console.log('Details:', responseData.description);
          }
        }
      } else {
        const text = await response.text();
        console.log('Non-JSON response (first 500 chars):', text.substring(0, 500));
      }
      
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  }
  
  console.log('\n--- Testing complete ---');
}

testDIDAPIWithValidImage().catch(console.error);