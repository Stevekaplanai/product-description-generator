const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY);

module.exports = async (req, res) => {
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

  try {
    const { products } = req.body;
    
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
    
    res.status(200).json({ 
      success: true,
      results,
      processed: results.length,
      successful: results.filter(r => r.success).length
    });
    
  } catch (error) {
    console.error('Bulk generation error:', error);
    res.status(500).json({ 
      error: 'Failed to process bulk generation',
      message: error.message
    });
  }
};