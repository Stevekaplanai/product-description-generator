const { GoogleGenerativeAI } = require('@google/generative-ai');
const { withRateLimit } = require('./middleware/rate-limit');
const { sendEmail } = require('./send-email');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY);

const bulkGenerateHandler = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limit (5 requests per minute for bulk)
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    res.setHeader('X-RateLimit-Limit', '5');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
    res.setHeader('Retry-After', rateLimitResult.retryAfter);
    
    return res.status(429).json({ 
      success: false,
      error: 'Too many bulk requests', 
      details: `Please wait ${rateLimitResult.retryAfter} seconds before trying again`,
      retryAfter: rateLimitResult.retryAfter
    });
  }

  try {
    const { products, email, notifyOnComplete = true } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products data' });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Please configure GEMINI_API_KEY in environment variables'
      });
    }

    // Process products in batches to avoid rate limits
    const results = [];
    const startTime = Date.now();
    
    // Send start notification if email provided
    if (email && notifyOnComplete) {
      await sendEmail(email, 'bulkProcessingStarted', {
        productCount: products.length,
        estimatedTime: `${Math.ceil(products.length * 2 / 60)} minutes`
      });
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    for (const product of products) {
      try {
        // Build the prompt based on product data
        const prompt = `Generate a compelling product description for an e-commerce listing.

Product Name: ${product.product_name || 'Unknown Product'}
Category: ${product.category || 'General'}
Features: ${product.features || 'High quality product'}
Target Audience: ${product.target_audience || 'General consumers'}
Tone: ${product.tone || 'professional'}

Create a product description that:
1. Starts with an engaging hook
2. Highlights the key features and benefits
3. Addresses the target audience's needs
4. Uses a ${product.tone || 'professional'} tone
5. Includes a call to action
6. Is between 100-150 words

Format the response as plain text without any markdown or special formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const description = response.text();
        
        results.push({
          product_name: product.product_name,
          description: description.trim(),
          success: true
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error generating description for ${product.product_name}:`, error);
        results.push({
          product_name: product.product_name,
          description: '',
          success: false,
          error: error.message
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    
    // Send completion notification
    if (email && notifyOnComplete) {
      await sendEmail(email, 'bulkProcessingComplete', {
        productCount: products.length,
        successCount: successful,
        failedCount: results.length - successful,
        processingTime: `${processingTime} seconds`,
        downloadUrl: `/api/bulk-download?id=${Date.now()}` // Implement download endpoint
      });
    }
    
    res.status(200).json({ 
      success: true,
      results,
      processed: results.length,
      successful,
      processingTime
    });
    
  } catch (error) {
    console.error('Bulk generation error:', error);
    
    // Send failure notification
    if (email && notifyOnComplete) {
      await sendEmail(email, 'bulkProcessingFailed', {
        error: error.message,
        productCount: products?.length || 0
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process bulk generation',
      message: error.message
    });
  }
};

// Export with rate limiting
module.exports = withRateLimit(bulkGenerateHandler, '/api/bulk-generate');