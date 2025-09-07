const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// Initialize APIs - check both possible env var names
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

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
    const { productName, productCategory, targetAudience, keyFeatures, tone, imageAnalysis, hasUploadedImage } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Generate descriptions using Gemini
    const descriptions = [];
    
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
        console.log('Using Gemini API for description generation');
      
      // Enhanced prompts if we have image analysis data
      let enhancedContext = '';
      if (imageAnalysis) {
        enhancedContext = `\nAdditional product details from image analysis:
        - Colors: ${imageAnalysis.colors?.join(', ') || 'various'}
        - Materials: ${imageAnalysis.materials?.join(', ') || 'premium materials'}
        - Style: ${imageAnalysis.style || 'modern'}
        - Key selling points: ${imageAnalysis.keySellingPoints?.join(', ') || 'quality and design'}
        - Suggested description: ${imageAnalysis.suggestedDescription || ''}`;
      }
      
      const prompts = [
        `Write a compelling product description for ${productName}. Category: ${productCategory || 'general'}. Target audience: ${targetAudience || 'general consumers'}. Key features: ${keyFeatures || 'high quality'}. Tone: ${tone || 'professional'}.${enhancedContext} Keep it under 150 words.`,
        `Create an SEO-optimized product description for ${productName} that highlights its benefits. Focus on ${keyFeatures || 'quality and value'}. Target: ${targetAudience || 'online shoppers'}.${enhancedContext}`,
        `Write a persuasive product description for ${productName} that converts browsers into buyers. Emphasize ${keyFeatures || 'unique selling points'}.${enhancedContext}`
      ];

      for (const prompt of prompts) {
        try {
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          descriptions.push(text);
        } catch (error) {
          console.error('Gemini generation error:', error);
          // Use enhanced fallback instead of simple one
          const features = keyFeatures ? keyFeatures.split(',').map(f => f.trim()) : ['premium quality'];
          descriptions.push(
            `Discover the exceptional ${productName}, a premium ${productCategory || 'product'} designed for ${targetAudience || 'you'}. ${features.length > 0 ? `Featuring ${features[0]}, this remarkable product delivers outstanding value and performance.` : ''} Experience the perfect combination of quality, innovation, and reliability that sets ${productName} apart from the competition.`
          );
        }
      }
      } catch (apiError) {
        console.error('Gemini API initialization error:', apiError);
        // Fall through to enhanced fallback descriptions
      }
    } else {
      // Enhanced fallback descriptions when Gemini isn't available
      const features = keyFeatures ? keyFeatures.split(',').map(f => f.trim()) : ['premium quality', 'innovative design', 'exceptional value'];
      const audience = targetAudience || 'discerning customers';
      const category = productCategory || 'product';
      
      // Generate three varied, comprehensive descriptions
      descriptions.push(
        // Description 1: Feature-focused
        `Discover the exceptional ${productName}, a premium ${category} designed specifically for ${audience}. ${features.length > 0 ? `Featuring ${features.slice(0, 2).join(' and ')}, this remarkable product delivers unmatched performance and reliability.` : ''} Every detail has been carefully crafted to exceed expectations, from its sophisticated design to its intuitive functionality. Whether you're a professional or an enthusiast, ${productName} provides the perfect combination of quality, innovation, and value that sets it apart from the competition.`,
        
        // Description 2: Benefits-focused
        `Transform your experience with ${productName}, the ultimate ${category} that redefines excellence. ${features.length > 0 ? `Built with ${features.join(', ')}, it's engineered to deliver superior results every time.` : ''} Designed for ${audience} who demand the best, this exceptional product combines cutting-edge technology with timeless elegance. Experience the difference that true quality makes - from enhanced productivity to unparalleled satisfaction. With ${productName}, you're not just buying a product; you're investing in a solution that grows with your needs.`,
        
        // Description 3: Story-driven
        `Meet ${productName} - where innovation meets perfection. Created for ${audience} who refuse to compromise, this outstanding ${category} represents the pinnacle of modern design and engineering. ${features.length > 0 ? `Every feature, from ${features[0]} to ${features[features.length - 1]}, has been meticulously developed to provide an unmatched user experience.` : ''} Join thousands of satisfied customers who have discovered the perfect blend of style, functionality, and durability. ${productName} isn't just a purchase - it's a statement of quality that speaks to your discerning taste and high standards.`
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