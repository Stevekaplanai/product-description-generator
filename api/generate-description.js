const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const cloudinary = require('cloudinary').v2;
const { checkRateLimit } = require('./lib/rate-limiter');
const { securityMiddleware, sanitizeInput, pseudonymizeData } = require('./lib/security-middleware');

// Initialize APIs - check both possible env var names
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
  // Apply comprehensive security middleware
  const proceed = await securityMiddleware(req, res, {
    requireAuth: false, // Allow anonymous users for now
    rateLimit: true,
    validateInput: true,
    gdprCompliant: true
  });
  
  if (!proceed) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  

  try {
    const { productName, productCategory, targetAudience, keyFeatures, tone, imageAnalysis, hasUploadedImage, imagesOnly, generateImages, category } = req.body;
    const actualCategory = productCategory || category; // Support both field names

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // If images only requested, skip description generation
    if (imagesOnly) {
      console.log('Images-only request received');
      const images = [];
      
      // Generate images with DALL-E if available
      if (openai && process.env.OPENAI_API_KEY) {
        try {
          console.log('Generating image with DALL-E 3 for:', productName);
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Professional product photo of ${productName}. ${keyFeatures || ''}. High quality, clean background, commercial photography style.`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "natural"
          });
          
          if (imageResponse.data && imageResponse.data[0]) {
            images.push({
              url: imageResponse.data[0].url,
              style: 'AI Generated'
            });
          }
        } catch (error) {
          console.error('Image generation error:', error.message);
        }
      }
      
      return res.status(200).json({
        success: true,
        images: images,
        imagesOnly: true
      });
    }

    // Generate descriptions using Gemini
    const descriptions = [];
    
    if (gemini) {
      try {
        console.log('Gemini API key found, attempting to use Gemini');
        // Use gemini-2.0-flash-exp which is the latest model
        const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        console.log('Gemini model initialized successfully');
        
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
          `Write a compelling and detailed product description for ${productName}. Category: ${productCategory || 'general'}. Target audience: ${targetAudience || 'general consumers'}. Key features: ${keyFeatures || 'high quality'}. Tone: ${tone || 'professional'}.${enhancedContext} The description should be engaging, informative, and between 100-150 words. Focus on benefits and value proposition.`,
          
          `Create an SEO-optimized and conversion-focused product description for ${productName}. Highlight the benefits of: ${keyFeatures || 'quality and value'}. Target market: ${targetAudience || 'online shoppers'}. Category: ${productCategory || 'general'}.${enhancedContext} Write 100-150 words that will help customers understand why this product is perfect for them.`,
          
          `Write a persuasive and emotionally engaging product description for ${productName} that converts browsers into buyers. Emphasize: ${keyFeatures || 'unique selling points'}. Appeal to: ${targetAudience || 'discerning customers'}. Style: ${tone || 'professional'}.${enhancedContext} Create a 100-150 word description that tells a story and creates desire.`
        ];

        for (const prompt of prompts) {
          try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            descriptions.push(text);
            console.log(`Generated description ${descriptions.length}: ${text.substring(0, 50)}...`);
          } catch (error) {
            console.error('Gemini generation error for prompt:', error.message);
            // Add a fallback for this specific variation
            descriptions.push(generateFallbackDescription(productName, productCategory, targetAudience, keyFeatures, tone, descriptions.length));
          }
        }
      } catch (apiError) {
        console.error('Gemini API error:', apiError.message || apiError);
        console.error('Full error:', JSON.stringify(apiError));
        // Fall through to enhanced fallback descriptions
      }
    } else {
      console.log('Gemini API not configured - using fallback descriptions');
    }
    
    // If no descriptions were generated or Gemini isn't available, use enhanced fallbacks
    if (descriptions.length === 0) {
      console.log('Using fallback descriptions');
      const features = keyFeatures ? keyFeatures.split(',').map(f => f.trim()) : ['premium quality', 'innovative design', 'exceptional value'];
      const audience = targetAudience || 'discerning customers';
      const category = productCategory || 'product';
      
      descriptions.push(
        // Description 1: Feature-focused
        `Discover the exceptional ${productName}, a premium ${category} designed specifically for ${audience}. ${features.length > 0 ? `Featuring ${features.slice(0, 2).join(' and ')}, this remarkable product delivers unmatched performance and reliability.` : ''} Every detail has been carefully crafted to exceed expectations, from its sophisticated design to its intuitive functionality. Whether you're a professional or an enthusiast, ${productName} provides the perfect combination of quality, innovation, and value that sets it apart from the competition.`,
        
        // Description 2: Benefits-focused
        `Transform your experience with ${productName}, the ultimate ${category} that redefines excellence. ${features.length > 0 ? `Built with ${features.join(', ')}, it's engineered to deliver superior results every time.` : ''} Designed for ${audience} who demand the best, this exceptional product combines cutting-edge technology with timeless elegance. Experience the difference that true quality makes - from enhanced productivity to unparalleled satisfaction. With ${productName}, you're not just buying a product; you're investing in a solution that grows with your needs.`,
        
        // Description 3: Story-driven
        `Meet ${productName} - where innovation meets perfection. Created for ${audience} who refuse to compromise, this outstanding ${category} represents the pinnacle of modern design and engineering. ${features.length > 0 ? `Every feature, from ${features[0]} to ${features[features.length - 1]}, has been meticulously developed to provide an unmatched user experience.` : ''} Join thousands of satisfied customers who have discovered the perfect blend of style, functionality, and durability. ${productName} isn't just a purchase - it's a statement of quality that speaks to your discerning taste and high standards.`
      );
    }

    // Generate images if OpenAI is available and requested
    const images = [];
    if (openai && req.body.generateImages !== false) {
      try {
        console.log('Generating image with DALL-E 3');
        const imagePrompt = `Product photography of ${productName}: ${keyFeatures || 'professional, high-quality, commercial style'}. ${productCategory ? `Category: ${productCategory}.` : ''} Clean, modern, e-commerce style product image on white background.`;
        
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural"
        });
        
        if (imageResponse.data && imageResponse.data[0]) {
          // Upload to Cloudinary if configured
          let finalImageUrl = imageResponse.data[0].url;
          
          if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
              console.log('Uploading DALL-E image to Cloudinary');
              const uploadResult = await cloudinary.uploader.upload(imageResponse.data[0].url, {
                folder: 'product-images',
                public_id: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
                resource_type: 'image',
                transformation: [
                  { width: 1024, height: 1024, crop: 'limit' },
                  { quality: 'auto:good' },
                  { fetch_format: 'auto' }
                ]
              });
              
              finalImageUrl = uploadResult.secure_url;
              console.log('Image uploaded to Cloudinary:', finalImageUrl);
            } catch (uploadError) {
              console.error('Cloudinary upload error:', uploadError.message);
              // Fall back to original DALL-E URL
            }
          }
          
          images.push({
            url: finalImageUrl,
            style: 'AI Generated',
            cloudinary: finalImageUrl.includes('cloudinary')
          });
          console.log('Image generated successfully');
        }
      } catch (error) {
        console.error('DALL-E generation error:', error.message);
        // Continue without images
      }
    }

    res.status(200).json({
      success: true,
      product: productName,
      descriptions: descriptions,
      images: images,
      generatedImages: images, // Include both keys for compatibility
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      details: 'Failed to generate content. Please try again.'
    });
  }
};

// Helper function to generate fallback descriptions
function generateFallbackDescription(productName, category, audience, features, tone, variationIndex) {
  const featuresList = features ? features.split(',').map(f => f.trim()) : ['quality design', 'premium materials'];
  
  const variations = [
    `Experience the remarkable ${productName}, expertly crafted for ${audience || 'you'}. This premium ${category || 'product'} features ${featuresList.join(' and ')}, delivering exceptional value and performance that exceeds expectations.`,
    
    `Introducing ${productName} - the perfect ${category || 'solution'} for ${audience || 'discerning customers'}. With ${featuresList[0] || 'outstanding features'} at its core, this product represents the ideal balance of form and function.`,
    
    `Discover why ${productName} is the preferred choice for ${audience || 'customers like you'}. Combining ${featuresList.join(', ')} with uncompromising quality, it's designed to deliver results that matter.`
  ];
  
  return variations[variationIndex % variations.length];
}