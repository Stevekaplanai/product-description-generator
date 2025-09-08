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
    keyInfo: {
      exists: !!D_ID_API_KEY,
      length: D_ID_API_KEY ? D_ID_API_KEY.length : 0,
      prefix: D_ID_API_KEY ? D_ID_API_KEY.substring(0, 8) + '...' : 'none',
      format: 'unknown'
    },
    authTests: []
  };

  if (!D_ID_API_KEY) {
    return res.status(200).json({
      error: 'D_ID_API_KEY not found in environment variables',
      results
    });
  }

  // Detect key format
  if (D_ID_API_KEY.includes(':')) {
    results.keyInfo.format = 'username:password format detected';
  } else if (D_ID_API_KEY.startsWith('Basic ')) {
    results.keyInfo.format = 'Already has Basic prefix';
  } else if (D_ID_API_KEY.startsWith('Bearer ')) {
    results.keyInfo.format = 'Already has Bearer prefix';
  } else {
    results.keyInfo.format = 'Raw key';
  }

  // Test 1: Try with Basic auth (D-ID documented format - direct username:password)
  try {
    const response1 = await fetch(`${D_ID_API_URL}/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
        'accept': 'application/json'
      }
    });
    
    results.authTests.push({
      method: 'Basic auth (direct)',
      endpoint: '/credits',
      status: response1.status,
      statusText: response1.statusText,
      success: response1.ok,
      response: await response1.text()
    });
  } catch (error) {
    results.authTests.push({
      method: 'Basic auth (direct)',
      endpoint: '/credits',
      error: error.message
    });
  }

  // Test 2: Try with Basic auth (base64 encoded)
  try {
    const encodedKey = Buffer.from(D_ID_API_KEY).toString('base64');
    const response2 = await fetch(`${D_ID_API_URL}/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'accept': 'application/json'
      }
    });
    
    results.authTests.push({
      method: 'Basic auth (base64)',
      endpoint: '/credits',
      status: response2.status,
      statusText: response2.statusText,
      success: response2.ok,
      response: await response2.text()
    });
  } catch (error) {
    results.authTests.push({
      method: 'Basic auth (base64)',
      endpoint: '/credits',
      error: error.message
    });
  }

  // Test 3: Try with Bearer token
  try {
    const response3 = await fetch(`${D_ID_API_URL}/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${D_ID_API_KEY}`,
        'accept': 'application/json'
      }
    });
    
    results.authTests.push({
      method: 'Bearer token',
      endpoint: '/credits',
      status: response3.status,
      statusText: response3.statusText,
      success: response3.ok,
      response: await response3.text()
    });
  } catch (error) {
    results.authTests.push({
      method: 'Bearer token',
      endpoint: '/credits',
      error: error.message
    });
  }

  // Test 4: Try with x-api-key header
  try {
    const response4 = await fetch(`${D_ID_API_URL}/credits`, {
      method: 'GET',
      headers: {
        'x-api-key': D_ID_API_KEY,
        'accept': 'application/json'
      }
    });
    
    results.authTests.push({
      method: 'x-api-key header',
      endpoint: '/credits',
      status: response4.status,
      statusText: response4.statusText,
      success: response4.ok,
      response: await response4.text()
    });
  } catch (error) {
    results.authTests.push({
      method: 'x-api-key header',
      endpoint: '/credits',
      error: error.message
    });
  }

  // Test 5: If key contains colon, try as username:password
  if (D_ID_API_KEY.includes(':')) {
    try {
      const [username, password] = D_ID_API_KEY.split(':');
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      
      const response5 = await fetch(`${D_ID_API_URL}/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'accept': 'application/json'
        }
      });
      
      results.authTests.push({
        method: 'Username:Password Basic auth',
        endpoint: '/credits',
        status: response5.status,
        statusText: response5.statusText,
        success: response5.ok,
        response: await response5.text()
      });
    } catch (error) {
      results.authTests.push({
        method: 'Username:Password Basic auth',
        endpoint: '/credits',
        error: error.message
      });
    }
  }

  // Find working method
  const workingMethod = results.authTests.find(test => test.success);
  if (workingMethod) {
    results.summary = `SUCCESS! Use ${workingMethod.method} for D-ID authentication`;
    results.workingAuth = workingMethod.method;
  } else {
    results.summary = 'No authentication method worked. Check your D-ID API key.';
  }

  res.status(200).json(results);
};