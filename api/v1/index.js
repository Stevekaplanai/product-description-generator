// API v1 Documentation Endpoint

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const baseUrl = `https://${req.headers.host}`;
  
  res.status(200).json({
    name: 'ProductDescriptions.io API',
    version: 'v1',
    documentation: 'https://productdescriptions.io/docs/api',
    endpoints: {
      generate: {
        method: 'POST',
        url: `${baseUrl}/api/v1/generate`,
        description: 'Generate product descriptions for one or more products',
        authentication: 'API Key required in X-API-Key header',
        body: {
          products: [
            {
              title: 'Product name (required)',
              product_type: 'Category (optional)',
              vendor: 'Brand name (optional)',
              tags: ['tag1', 'tag2'],
              images: ['image_url1', 'image_url2']
            }
          ],
          options: {
            tone: 'professional|casual|luxury (optional)',
            targetAudience: 'Target demographic (optional)'
          }
        },
        response: {
          success: true,
          results: [
            {
              product_id: 'product-slug',
              title: 'Product Name',
              descriptions: ['Description 1', 'Description 2', 'Description 3'],
              generated_at: '2024-01-20T10:00:00Z'
            }
          ],
          metadata: {
            total_products: 1,
            successful: 1,
            failed: 0,
            api_version: 'v1'
          }
        },
        rate_limits: {
          free: '5 requests/minute, 100/month',
          starter: '10 requests/minute, 1000/month',
          professional: '30 requests/minute, 5000/month',
          enterprise: '100 requests/minute, 50000/month'
        }
      },
      status: {
        method: 'GET',
        url: `${baseUrl}/api/v1/status`,
        description: 'Check API status and your usage',
        authentication: 'API Key required in X-API-Key header'
      },
      webhooks: {
        shopify: {
          method: 'POST',
          url: `${baseUrl}/api/v1/webhooks/shopify`,
          description: 'Webhook endpoint for Shopify product events',
          authentication: 'HMAC validation'
        }
      }
    },
    authentication: {
      type: 'API Key',
      header: 'X-API-Key',
      format: 'prefix_randomstring',
      example: 'demo_test_key_123456789',
      get_key: 'Contact sales@productdescriptions.io for API access'
    },
    errors: {
      401: 'Invalid or missing API key',
      429: 'Rate limit or usage limit exceeded',
      400: 'Invalid request data',
      500: 'Internal server error'
    },
    sdks: {
      node: 'npm install @productdescriptions/node-sdk (coming soon)',
      python: 'pip install productdescriptions (coming soon)',
      php: 'composer require productdescriptions/php-sdk (coming soon)'
    },
    support: {
      email: 'api@productdescriptions.io',
      documentation: 'https://productdescriptions.io/docs/api',
      status_page: 'https://status.productdescriptions.io'
    }
  });
};