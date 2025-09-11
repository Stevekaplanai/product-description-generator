// Test D-ID API directly - Version 2
require('dotenv').config();
const fetch = require('node-fetch');

const D_ID_API_KEY = process.env.D_ID_API_KEY;
const D_ID_API_URL = 'https://api.d-id.com';

async function testDIDAPI() {
  console.log('Testing D-ID API v2...');
  console.log('API Key configured:', !!D_ID_API_KEY);
  console.log('API Key length:', D_ID_API_KEY ? D_ID_API_KEY.length : 0);
  console.log('API Key format check:', {
    startsWithBasic: D_ID_API_KEY?.startsWith('Basic '),
    startsWithBearer: D_ID_API_KEY?.startsWith('Bearer '),
    containsColon: D_ID_API_KEY?.includes(':'),
    isBase64: /^[A-Za-z0-9+/]+=*$/.test(D_ID_API_KEY)
  });
  
  if (!D_ID_API_KEY) {
    console.error('D_ID_API_KEY not found in environment variables');
    return;
  }

  // If the API key already includes "Basic " prefix, use it as-is
  let authHeader = D_ID_API_KEY;
  
  // If it doesn't have a prefix, try different formats
  if (!D_ID_API_KEY.startsWith('Basic ') && !D_ID_API_KEY.startsWith('Bearer ')) {
    // Test 1: Try as Bearer token (most common for modern APIs)
    console.log('\n--- Test 1: Bearer Token ---');
    try {
      const response = await fetch(`${D_ID_API_URL}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${D_ID_API_KEY}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: 'Hello, this is a test',
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyNeural'
            }
          },
          source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_t/image.jpeg'
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.raw());
      
      const text = await response.text();
      console.log('Response body (first 500 chars):', text.substring(0, 500));
      
      if (response.status === 201 || response.status === 200) {
        console.log('SUCCESS with Bearer token!');
        const data = JSON.parse(text);
        console.log('Video ID:', data.id);
        return;
      }
    } catch (error) {
      console.error('Test 1 Error:', error.message);
    }

    // Test 2: Try Basic auth with base64 encoding
    console.log('\n--- Test 2: Basic Auth with base64(key:) ---');
    try {
      const authString = Buffer.from(`${D_ID_API_KEY}:`).toString('base64');
      
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
            input: 'Hello, this is a test',
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyNeural'
            }
          },
          source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_t/image.jpeg'
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.raw());
      
      const text = await response.text();
      console.log('Response body (first 500 chars):', text.substring(0, 500));
      
      if (response.status === 201 || response.status === 200) {
        console.log('SUCCESS with Basic auth!');
        const data = JSON.parse(text);
        console.log('Video ID:', data.id);
        return;
      }
    } catch (error) {
      console.error('Test 2 Error:', error.message);
    }
  } else {
    // API key already has prefix, use as-is
    console.log('\n--- Using API key as-is (already has prefix) ---');
    try {
      const response = await fetch(`${D_ID_API_URL}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: 'Hello, this is a test',
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
      console.log('Response body:', text);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

testDIDAPI();