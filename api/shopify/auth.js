const crypto = require('crypto');
const { createApiKey } = require('../lib/api-keys');

// Shopify app credentials (would be in environment variables)
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || 'your_shopify_api_key';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || 'your_shopify_api_secret';
const APP_URL = process.env.APP_URL || 'https://productdescriptions.io';
const SCOPES = 'read_products,write_products';

/**
 * Generate a random nonce for OAuth
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Verify HMAC signature from Shopify
 */
function verifyHmac(query, hmac) {
  const message = Object.keys(query)
    .filter(key => key !== 'hmac' && key !== 'signature')
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
    
  const hash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');
    
  return hash === hmac;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { shop, hmac, code, state, timestamp, host } = req.query;
  
  // Step 1: Install request (no code yet)
  if (shop && !code) {
    // Verify shop domain format
    if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
      return res.status(400).send('Invalid shop domain');
    }
    
    // Generate state parameter for security
    const nonce = generateNonce();
    
    // Store nonce in session/database (in production)
    // For now, we'll include it in the redirect
    
    // Build authorization URL
    const redirectUri = `${APP_URL}/api/shopify/callback`;
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_API_KEY}&` +
      `scope=${SCOPES}&` +
      `redirect_uri=${redirectUri}&` +
      `state=${nonce}`;
    
    // Redirect to Shopify OAuth page
    res.writeHead(302, { Location: authUrl });
    res.end();
    return;
  }
  
  // Step 2: Callback with authorization code
  if (shop && code) {
    // Verify HMAC
    if (!verifyHmac(req.query, hmac)) {
      return res.status(401).send('Invalid HMAC signature');
    }
    
    // Verify state/nonce (in production, check against stored value)
    // For demo, we'll skip this check
    
    try {
      // Exchange code for access token
      const accessTokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code: code,
        }),
      });
      
      const { access_token, scope } = await accessTokenResponse.json();
      
      if (!access_token) {
        throw new Error('Failed to get access token');
      }
      
      // Get shop information
      const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': access_token,
        },
      });
      
      const { shop: shopData } = await shopResponse.json();
      
      // Create API key for this store
      const apiKey = createApiKey({
        id: shop,
        name: shopData.name,
        email: shopData.email,
        plan: 'professional', // Default to professional for Shopify stores
      });
      
      // Store access token and API key (in production, save to database)
      // For now, we'll display them
      
      // Register webhooks
      const webhooks = [
        { topic: 'products/create', address: `${APP_URL}/api/v1/webhooks/shopify` },
        { topic: 'products/update', address: `${APP_URL}/api/v1/webhooks/shopify` },
        { topic: 'app/uninstalled', address: `${APP_URL}/api/v1/webhooks/shopify` },
      ];
      
      for (const webhook of webhooks) {
        await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ webhook }),
        });
      }
      
      // Redirect to success page with embedded app
      const embedUrl = `https://${shop}/admin/apps/${SHOPIFY_API_KEY}`;
      
      // Return success page
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Installation Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #333; }
            .api-key {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              font-family: monospace;
              word-break: break-all;
            }
            .button {
              background: #5c6ac4;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 5px;
              text-decoration: none;
              display: inline-block;
              margin-top: 20px;
              cursor: pointer;
            }
            .button:hover {
              background: #4b5aae;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 10px;
              border-radius: 5px;
              margin-top: 20px;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Installation Successful!</h1>
            <p>ProductDescriptions.io has been installed on <strong>${shopData.name}</strong></p>
            
            <div class="api-key">
              <strong>Your API Key:</strong><br>
              ${apiKey}
            </div>
            
            <div class="warning">
              ⚠️ Save this API key securely. You'll need it to configure the app.
            </div>
            
            <p>Webhooks have been registered for:</p>
            <ul style="text-align: left; display: inline-block;">
              <li>Product creation</li>
              <li>Product updates</li>
              <li>App uninstall</li>
            </ul>
            
            <a href="${embedUrl}" class="button">Open App in Shopify Admin</a>
            
            <script>
              // Auto-redirect to Shopify admin after 5 seconds
              setTimeout(() => {
                window.location.href = '${embedUrl}';
              }, 5000);
            </script>
          </div>
        </body>
        </html>
      `);
      
    } catch (error) {
      console.error('OAuth error:', error);
      res.status(500).send('Installation failed: ' + error.message);
    }
    
    return;
  }
  
  // No valid parameters
  res.status(400).send('Invalid request');
};