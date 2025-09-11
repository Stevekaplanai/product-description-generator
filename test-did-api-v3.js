// Test D-ID API directly - Version 3
require('dotenv').config();
const fetch = require('node-fetch');

const D_ID_API_KEY = process.env.D_ID_API_KEY;
const D_ID_API_URL = 'https://api.d-id.com';

async function testDIDAPI() {
  console.log('Testing D-ID API v3...');
  console.log('API Key configured:', !!D_ID_API_KEY);
  console.log('API Key contains colon:', D_ID_API_KEY?.includes(':'));
  
  if (!D_ID_API_KEY) {
    console.error('D_ID_API_KEY not found in environment variables');
    return;
  }

  // If API key contains colon, it might be username:password format already
  if (D_ID_API_KEY.includes(':')) {
    console.log('\n--- Test: API key appears to be username:password format ---');
    
    // Use it directly as Basic auth
    const authString = Buffer.from(D_ID_API_KEY).toString('base64');
    console.log('Created base64 from full key');
    
    try {
      const response = await fetch(`${D_ID_API_URL}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: 'Hello, this is a test video',
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyNeural'
            }
          },
          source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_t/image.jpeg'
        })
      });

      console.log('Response status:', response.status);
      
      const text = await response.text();
      
      // Try to parse as JSON if possible
      try {
        const data = JSON.parse(text);
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.id) {
          console.log('✅ SUCCESS! Video ID:', data.id);
          console.log('Status:', data.status);
        }
      } catch {
        console.log('Response body (first 500 chars):', text.substring(0, 500));
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  } else {
    // Try as plain API key with different auth methods
    console.log('API key does not contain colon, trying standard formats...');
    
    // Try Bearer
    console.log('\n--- Test: Bearer Token ---');
    try {
      const response = await fetch(`${D_ID_API_URL}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${D_ID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: 'Test',
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyNeural'
            }
          },
          source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_t/image.jpeg'
        })
      });
      
      console.log('Bearer response:', response.status);
      if (response.status === 201) {
        const data = await response.json();
        console.log('✅ SUCCESS with Bearer! Video ID:', data.id);
      }
    } catch (error) {
      console.error('Bearer error:', error.message);
    }
  }
}

testDIDAPI();