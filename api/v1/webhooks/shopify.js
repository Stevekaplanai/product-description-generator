const crypto = require('crypto');
const { validateApiKey, incrementUsage } = require('../../lib/api-keys');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

/**
 * Verify Shopify webhook signature
 */
function verifyWebhookSignature(rawBody, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
  
  return hash === signature;
}

/**
 * Store mapping between Shopify stores and API keys
 * In production, this would be in a database
 */
const storeApiKeys = new Map([
  // Example mapping
  ['example-store.myshopify.com', 'prod_key_shopify_abc123xyz']
]);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Topic, X-Shopify-Hmac-Sha256, X-Shopify-Shop-Domain');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get Shopify headers
    const topic = req.headers['x-shopify-topic'];
    const signature = req.headers['x-shopify-hmac-sha256'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    // Verify webhook (if secret is configured)
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      // Note: In production, you need the raw body for verification
      // Vercel provides it via req.body if you configure it properly
      // For now, we'll skip verification in this example
      // const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      // if (!isValid) {
      //   return res.status(401).json({ error: 'Invalid webhook signature' });
      // }
    }
    
    // Get API key for this store
    const apiKey = storeApiKeys.get(shopDomain) || req.headers['x-api-key'];
    if (!apiKey) {
      console.log(`No API key found for store: ${shopDomain}`);
      return res.status(401).json({ error: 'Store not registered' });
    }
    
    // Validate API key
    const { valid, keyData, error } = validateApiKey(apiKey);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Handle different webhook topics
    switch (topic) {
      case 'products/create':
      case 'products/update':
        return handleProductWebhook(req.body, keyData, res);
      
      case 'app/uninstalled':
        return handleUninstall(shopDomain, res);
      
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
        return res.status(200).json({ received: true });
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handle product create/update webhooks
 */
async function handleProductWebhook(product, keyData, res) {
  try {
    // Check if product needs description
    if (product.body_html && product.body_html.length > 100) {
      // Product already has a description
      return res.status(200).json({ 
        message: 'Product already has description',
        skipped: true 
      });
    }
    
    // Check if Gemini is configured
    if (!gemini) {
      return res.status(500).json({ error: 'AI service not configured' });
    }
    
    // Generate description using our AI
    const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Generate a professional e-commerce product description for:
    
Product: ${product.title}
Type: ${product.product_type || 'General'}
Vendor: ${product.vendor || 'Unknown'}
Tags: ${product.tags || 'None'}
Variants: ${product.variants?.length || 1} variant(s)
Price: ${product.variants?.[0]?.price ? `$${product.variants[0].price}` : 'Price varies'}

Requirements:
- Write a compelling 100-150 word product description
- Focus on benefits and features
- Use persuasive but honest language
- Include relevant keywords for SEO
- Format with HTML tags for Shopify (use <p>, <strong>, <ul>, <li> tags)

Generate a single, well-formatted description.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();
    
    // Increment usage
    incrementUsage(keyData.id);
    
    // In a real app, you would update the product in Shopify here
    // using the Shopify Admin API
    
    res.status(200).json({
      success: true,
      product_id: product.id,
      title: product.title,
      description: description,
      message: 'Description generated successfully',
      action_required: 'Update product in Shopify admin'
    });
    
  } catch (error) {
    console.error('Product webhook error:', error);
    res.status(500).json({ error: 'Failed to generate description' });
  }
}

/**
 * Handle app uninstall
 */
async function handleUninstall(shopDomain, res) {
  console.log(`App uninstalled from: ${shopDomain}`);
  
  // In production, you would:
  // 1. Remove store from database
  // 2. Cancel any subscriptions
  // 3. Clean up stored data
  
  storeApiKeys.delete(shopDomain);
  
  res.status(200).json({ 
    message: 'Uninstall processed',
    shop: shopDomain 
  });
}