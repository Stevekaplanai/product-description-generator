const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const D_ID_API_KEY = process.env.D_ID_API_KEY;
  const D_ID_API_URL = 'https://api.d-id.com';

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Try with the key directly as Authorization header (no Basic prefix)
  try {
    console.log('Testing with direct API key...');
    const response1 = await fetch(`${D_ID_API_URL}/talks`, {
      method: 'GET',
      headers: {
        'Authorization': D_ID_API_KEY,
        'accept': 'application/json'
      }
    });
    
    const data1 = await response1.json();
    results.tests.push({
      method: 'Direct API key (no prefix)',
      endpoint: '/talks GET',
      status: response1.status,
      statusText: response1.statusText,
      success: response1.ok,
      response: data1
    });
  } catch (error) {
    results.tests.push({
      method: 'Direct API key (no prefix)',
      endpoint: '/talks GET',
      error: error.message
    });
  }

  // Test 2: Try creating a talk with direct API key
  try {
    console.log('Testing talk creation with direct key...');
    const talkPayload = {
      script: {
        type: 'text',
        input: 'Hello, this is a test.',
        provider: {
          type: 'microsoft',
          voice_id: 'en-US-JennyNeural'
        }
      },
      source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_t/image.jpeg'
    };

    const response2 = await fetch(`${D_ID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': D_ID_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(talkPayload)
    });

    const data2 = await response2.json();
    results.tests.push({
      method: 'Direct API key POST',
      endpoint: '/talks POST',
      status: response2.status,
      statusText: response2.statusText,
      success: response2.ok,
      response: data2
    });
  } catch (error) {
    results.tests.push({
      method: 'Direct API key POST',
      endpoint: '/talks POST',
      error: error.message
    });
  }

  // Test 3: Try with x-api-key-authorization header
  try {
    console.log('Testing with x-api-key-authorization header...');
    const response3 = await fetch(`${D_ID_API_URL}/talks`, {
      method: 'GET',
      headers: {
        'x-api-key-authorization': D_ID_API_KEY,
        'accept': 'application/json'
      }
    });
    
    const data3 = await response3.json();
    results.tests.push({
      method: 'x-api-key-authorization header',
      endpoint: '/talks GET',
      status: response3.status,
      statusText: response3.statusText,
      success: response3.ok,
      response: data3
    });
  } catch (error) {
    results.tests.push({
      method: 'x-api-key-authorization header',
      endpoint: '/talks GET',
      error: error.message
    });
  }

  // Test 4: Try without any auth to see the error
  try {
    console.log('Testing without auth...');
    const response4 = await fetch(`${D_ID_API_URL}/talks`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    });
    
    const data4 = await response4.json();
    results.tests.push({
      method: 'No auth',
      endpoint: '/talks GET',
      status: response4.status,
      statusText: response4.statusText,
      success: response4.ok,
      response: data4
    });
  } catch (error) {
    results.tests.push({
      method: 'No auth',
      endpoint: '/talks GET',
      error: error.message
    });
  }

  // Summary
  const workingTest = results.tests.find(test => test.success);
  if (workingTest) {
    results.summary = `SUCCESS! Use ${workingTest.method} for D-ID authentication`;
  } else {
    results.summary = 'No authentication method worked';
  }

  res.status(200).json(results);
};