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

  // Test 1: Check if API key exists
  results.tests.push({
    name: 'API Key Check',
    passed: !!D_ID_API_KEY,
    details: {
      hasKey: !!D_ID_API_KEY,
      keyLength: D_ID_API_KEY ? D_ID_API_KEY.length : 0,
      keyPrefix: D_ID_API_KEY ? D_ID_API_KEY.substring(0, 8) + '...' : 'none'
    }
  });

  if (!D_ID_API_KEY) {
    return res.status(200).json({
      ...results,
      summary: 'D_ID_API_KEY not found in environment variables'
    });
  }

  // Test 2: Check API key validity with a simple GET request
  try {
    console.log('Testing D-ID API connection...');
    // Test with the credits endpoint which should work for valid API keys
    const testResponse = await fetch(`${D_ID_API_URL}/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`, // D-ID uses Basic auth with username:password format
        'accept': 'application/json'
      }
    });

    const testData = await testResponse.json();
    
    results.tests.push({
      name: 'API Connection Test',
      passed: testResponse.ok || testResponse.status === 404, // 404 is ok, means API is reachable
      details: {
        status: testResponse.status,
        statusText: testResponse.statusText,
        response: testData
      }
    });

    // If we get 401, the API key is invalid
    if (testResponse.status === 401) {
      results.summary = 'API Key is invalid or expired';
      return res.status(200).json(results);
    }

  } catch (error) {
    results.tests.push({
      name: 'API Connection Test',
      passed: false,
      error: error.message
    });
  }

  // Test 3: Try to create a simple talk
  try {
    console.log('Testing D-ID talk creation...');
    
    const talkPayload = {
      script: {
        type: 'text',
        input: 'Hello, this is a test video.',
        provider: {
          type: 'microsoft',
          voice_id: 'en-US-JennyNeural'
        }
      },
      source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_t/image.jpeg'
    };

    const talkResponse = await fetch(`${D_ID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(talkPayload)
    });

    const talkData = await talkResponse.json();
    
    results.tests.push({
      name: 'Talk Creation Test',
      passed: talkResponse.ok,
      details: {
        status: talkResponse.status,
        statusText: talkResponse.statusText,
        response: talkData,
        hasId: !!talkData.id
      }
    });

    // If talk was created, wait a bit and check status
    if (talkData.id) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await fetch(`${D_ID_API_URL}/talks/${talkData.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${D_ID_API_KEY}`,
          'accept': 'application/json'
        }
      });

      const statusData = await statusResponse.json();
      
      results.tests.push({
        name: 'Talk Status Check',
        passed: true,
        details: {
          talkId: talkData.id,
          status: statusData.status,
          hasResultUrl: !!statusData.result_url,
          response: statusData
        }
      });

      if (statusData.result_url) {
        results.videoUrl = statusData.result_url;
      }
    }

  } catch (error) {
    results.tests.push({
      name: 'Talk Creation Test',
      passed: false,
      error: error.message
    });
  }

  // Summary
  const allPassed = results.tests.every(test => test.passed);
  results.summary = allPassed 
    ? 'D-ID API is working correctly!' 
    : 'D-ID API has issues - check test details';

  res.status(200).json(results);
};