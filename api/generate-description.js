const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// Initialize APIs
const gemini = process.env.GOOGLE_GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null;

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
    const { productName, productCategory, targetAudience, keyFeatures, tone } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Generate descriptions using Gemini
    const descriptions = [];
    
    if (gemini) {
      const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompts = [
        `Write a compelling product description for ${productName}. Category: ${productCategory || 'general'}. Target audience: ${targetAudience || 'general consumers'}. Key features: ${keyFeatures || 'high quality'}. Tone: ${tone || 'professional'}. Keep it under 150 words.`,
        `Create an SEO-optimized product description for ${productName} that highlights its benefits. Focus on ${keyFeatures || 'quality and value'}. Target: ${targetAudience || 'online shoppers'}.`,
        `Write a persuasive product description for ${productName} that converts browsers into buyers. Emphasize ${keyFeatures || 'unique selling points'}.`
      ];

      for (const prompt of prompts) {
        try {
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          descriptions.push(text);
        } catch (error) {
          console.error('Gemini generation error:', error);
          descriptions.push(`Premium ${productName} - High quality ${productCategory || 'product'} designed for ${targetAudience || 'discerning customers'}.`);
        }
      }
    } else {
      // Fallback descriptions
      descriptions.push(
        `Introducing ${productName} - The perfect ${productCategory || 'solution'} for ${targetAudience || 'you'}.`,
        `Experience the quality of ${productName}. ${keyFeatures || 'Premium design and exceptional performance'}.`,
        `${productName} - Where ${tone || 'innovation'} meets excellence.`
      );
    }

    // Generate images if OpenAI is available
    const images = [];
    if (openai && req.body.generateImages) {
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Product photography of ${productName}: ${keyFeatures || 'professional, high-quality, commercial style'}`,
          n: 1,
          size: "1024x1024",
        });
        images.push(imageResponse.data[0].url);
      } catch (error) {
        console.error('DALL-E generation error:', error);
      }
    }

    res.status(200).json({
      success: true,
      product: productName,
      descriptions,
      images,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};