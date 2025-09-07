const { GoogleGenerativeAI } = require('@google/generative-ai');
const { 
  validateApiKey, 
  checkApiRateLimit, 
  checkUsageLimits, 
  incrementUsage 
} = require('../lib/api-keys');

// Initialize Gemini
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

module.exports = async (req, res) => {
  // Set CORS headers for API access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }
  
  // Extract API key from header
  const apiKey = req.headers['x-api-key'];
  
  // Validate API key
  const { valid, keyData, error } = validateApiKey(apiKey);
  if (!valid) {
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: error 
    });
  }
  
  // Check rate limits
  const rateLimitResult = checkApiRateLimit(apiKey);
  if (!rateLimitResult.allowed) {
    res.setHeader('X-RateLimit-Limit', rateLimitResult.limit);
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
    res.setHeader('Retry-After', rateLimitResult.retryAfter);
    
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: rateLimitResult.error,
      retryAfter: rateLimitResult.retryAfter
    });
  }
  
  // Check monthly usage limits
  const usageResult = checkUsageLimits(apiKey);
  if (!usageResult.allowed) {
    return res.status(429).json({ 
      error: 'Usage limit exceeded',
      message: usageResult.error,
      limit: usageResult.limit,
      used: usageResult.used
    });
  }
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', rateLimitResult.limit);
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
  res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
  res.setHeader('X-Usage-Limit', usageResult.limit);
  res.setHeader('X-Usage-Remaining', usageResult.remaining);
  
  try {
    const { products, options = {} } = req.body;
    
    // Validate request body
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Products array is required'
      });
    }
    
    // Limit batch size based on plan
    const maxBatchSize = {
      free: 5,
      starter: 10,
      professional: 25,
      enterprise: 100
    };
    
    const batchLimit = maxBatchSize[keyData.plan] || 5;
    if (products.length > batchLimit) {
      return res.status(400).json({ 
        error: 'Batch size exceeded',
        message: `Your plan allows up to ${batchLimit} products per request`,
        limit: batchLimit,
        received: products.length
      });
    }
    
    // Check if Gemini is configured
    if (!gemini) {
      return res.status(500).json({ 
        error: 'Service unavailable',
        message: 'AI service is not configured'
      });
    }
    
    // Process products
    const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const results = [];
    const errors = [];
    
    for (const product of products) {
      try {
        // Validate product data
        if (!product.title && !product.name) {
          errors.push({
            product: product,
            error: 'Product title or name is required'
          });
          continue;
        }
        
        const productName = product.title || product.name;
        const category = product.product_type || product.category || 'general';
        const tags = product.tags || [];
        const vendor = product.vendor || product.brand || '';
        const images = product.images || [];
        
        // Build prompt for Gemini
        const prompt = `Generate a professional e-commerce product description for:
        
Product: ${productName}
Category: ${category}
Brand: ${vendor}
Tags: ${tags.join(', ')}
${images.length > 0 ? `Product Images: ${images.slice(0, 3).join(', ')}` : ''}

Requirements:
- Write a compelling 100-150 word product description
- Focus on benefits and features
- Use persuasive but honest language
- Include relevant keywords for SEO
- Make it suitable for ${category} products
${options.tone ? `- Use a ${options.tone} tone` : ''}
${options.targetAudience ? `- Target audience: ${options.targetAudience}` : ''}

Generate 3 variations with different angles and approaches.
Return as JSON array with exactly 3 strings.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse the response
        let descriptions;
        try {
          // Extract JSON from the response
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            descriptions = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: use the text as single description
            descriptions = [text.trim()];
          }
        } catch (e) {
          descriptions = [text.trim()];
        }
        
        results.push({
          product_id: product.id || product.handle || productName.toLowerCase().replace(/\s+/g, '-'),
          title: productName,
          descriptions: descriptions,
          generated_at: new Date().toISOString()
        });
        
      } catch (error) {
        errors.push({
          product: product.title || product.name || 'Unknown',
          error: error.message
        });
      }
    }
    
    // Increment usage counter
    incrementUsage(apiKey);
    
    // Return results
    res.status(200).json({
      success: true,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        total_products: products.length,
        successful: results.length,
        failed: errors.length,
        api_version: 'v1',
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred while processing your request'
    });
  }
};