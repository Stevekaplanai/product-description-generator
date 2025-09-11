// Test D-ID API directly
require('dotenv').config();
const fetch = require('node-fetch');

const D_ID_API_KEY = process.env.D_ID_API_KEY;
const D_ID_API_URL = 'https://api.d-id.com';

async function testDIDAPI() {
  console.log('Testing D-ID API...');
  console.log('API Key configured:', !!D_ID_API_KEY);
  console.log('API Key length:', D_ID_API_KEY ? D_ID_API_KEY.length : 0);
  
  if (!D_ID_API_KEY) {
    console.error('D_ID_API_KEY not found in environment variables');
    return;
  }

  // Test 1: Try with Basic auth (API key as username, empty password)
  console.log('\n--- Test 1: Basic Auth with base64(key:) ---');
  try {
    const authString = Buffer.from(`${D_ID_API_KEY}:`).toString('base64');
    console.log('Auth string length:', authString.length);
    console.log('Auth string preview:', authString.substring(0, 20) + '...');
    
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

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Test 1 Error:', error.message);
  }

  // Test 2: Try with Bearer token
  console.log('\n--- Test 2: Bearer Token ---');
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

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Test 2 Error:', error.message);
  }

  // Test 3: Try with just the API key as Basic
  console.log('\n--- Test 3: Basic with just API key ---');
  try {
    const response = await fetch(`${D_ID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
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

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Test 3 Error:', error.message);
  }
}

testDIDAPI();