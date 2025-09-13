const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const cloudinary = require('cloudinary').v2;
const { withRateLimit } = require('./middleware/rate-limit');
const { securityMiddleware, sanitizeInput, pseudonymizeData } = require('./lib/security-middleware');
const { db } = require('./lib/database');

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

const generateDescriptionHandler = async (req, res) => {
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

      // Skip Gemini for image generation as it's a text-only model
      // Go directly to DALL-E for actual image generation
      console.log('Note: Gemini 2.0 Flash is a text-only model. Using DALL-E for image generation.');

      // Use OpenAI DALL-E for image generation
      if (openai) {
        try {
          console.log('Using DALL-E for image generation');
          console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);

          const imagePrompts = [
            {
              prompt: `Professional product photography of ${productName}. ${keyFeatures ? `Features: ${keyFeatures}.` : ''} Clean white background, studio lighting, hero shot, commercial e-commerce style, high resolution, photorealistic`,
              style: 'hero',
              size: '1024x1024'
            },
            {
              prompt: `${productName} in a lifestyle setting being used. ${actualCategory ? `Category: ${actualCategory}.` : ''} Natural lighting, real-world context, appealing to ${targetAudience || 'consumers'}, photorealistic`,
              style: 'lifestyle',
              size: '1024x1024'
            },
            {
              prompt: `Close-up detail shot of ${productName} showing quality and features. ${keyFeatures ? `Highlighting: ${keyFeatures}.` : ''} Macro photography, sharp focus, premium quality feel, photorealistic`,
              style: 'detail',
              size: '1024x1024'
            }
          ];

          // Generate images in parallel
          const imageGenerationPromises = imagePrompts.map(async (imgPrompt) => {
            try {
              const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: imgPrompt.prompt,
                n: 1,
                size: imgPrompt.size,
                quality: "standard",
                style: "natural"
              });

              if (response.data && response.data[0]) {
                return {
                  url: response.data[0].url,
                  type: imgPrompt.style,
                  model: 'dall-e-3'
                };
              }
            } catch (error) {
              console.error(`DALL-E generation error for ${imgPrompt.style}:`, error.message);
              console.error('Full error details:', error);
              // Check for specific error types
              if (error.code === 'insufficient_quota') {
                console.error('OpenAI API quota exceeded. Please check your billing.');
              }
              return null;
            }
          });

          const generatedImages = await Promise.all(imageGenerationPromises);

          // Filter out any failed generations
          generatedImages.forEach(img => {
            if (img) images.push(img);
          });

          console.log(`Generated ${images.length} images with DALL-E`);

        } catch (error) {
          console.error('DALL-E image generation error:', error.message);
        }
      } else {
        console.log('OpenAI client not initialized. API key missing or invalid.');
        console.log('Environment check - OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
      }

      // Always return a properly structured response
      if (images.length === 0) {
        console.log('No images generated. Returning empty array with success false.');
        console.log('OpenAI client initialized:', !!openai);
        console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);

        let errorMessage = 'Image generation is currently unavailable.';
        if (!openai) {
          errorMessage = 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.';
        }

        return res.status(200).json({
          success: false,
          error: errorMessage,
          images: [], // Always return an array
          imagesOnly: true
        });
      }

      // Ensure images array is properly formatted
      const formattedImages = images.map(img => ({
        url: img.url || '',
        type: img.type || 'product',
        model: img.model || 'unknown'
      }));

      console.log(`Returning ${formattedImages.length} formatted images`);
      return res.status(200).json({
        success: true,
        images: formattedImages,
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

    // Generate images with Nano Banana (Gemini) if requested
    const images = [];
    if (gemini && req.body.generateImages !== false) {
      try {
        console.log('Generating image with Nano Banana (Gemini)');
        const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        // Create professional product photography prompts
        const imagePrompts = [
          // Hero shot
          `A photorealistic hero product shot of ${productName}. ${keyFeatures ? `Highlighting: ${keyFeatures}.` : ''}
          Professional studio lighting with soft gradients, shot on white seamless background.
          Camera: DSLR with 85mm lens at f/5.6, emphasizing product details and textures.
          Style: Premium e-commerce photography, ultra-sharp focus, commercial quality.
          Mood: Aspirational and trustworthy for ${targetAudience || 'online shoppers'}.
          Composition: Centered with subtle depth, 1:1 aspect ratio.`,
          
          // Lifestyle context shot
          `Generate a photorealistic lifestyle product image of ${productName} in use.
          ${actualCategory ? `Product category: ${actualCategory}.` : ''}
          Setting: Modern, clean environment that appeals to ${targetAudience || 'target customers'}.
          Lighting: Natural daylight with soft shadows, creating warmth and authenticity.
          Camera: Wide-angle lens showing product in context, shallow depth of field.
          Style: Premium lifestyle photography that shows the product's value and use case.
          Format: High-resolution, suitable for marketing materials.`
        ];
        
        // Try to generate multiple angles/styles
        for (let i = 0; i < Math.min(imagePrompts.length, 2); i++) {
          try {
            const result = await model.generateContent(imagePrompts[i]);
            const response = await result.response;
            
            // Extract image from response
            if (response.candidates && response.candidates[0]) {
              const candidate = response.candidates[0];
              if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                  if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    // Note: In production, you'd want to upload this to Cloudinary
                    // For now, we'll use the base64 data URL
                    images.push({
                      url: imageUrl,
                      style: i === 0 ? 'Hero Shot' : 'Lifestyle',
                      model: 'Nano Banana (Gemini 2.0)'
                    });
                    console.log(`Nano Banana image ${i + 1} generated successfully`);
                    break;
                  }
                }
              }
            }
          } catch (imgError) {
            console.error(`Failed to generate image ${i + 1}:`, imgError.message);
          }
        }
        
        // Upload base64 images to Cloudinary if configured and we have images
        if (process.env.CLOUDINARY_CLOUD_NAME && images.length > 0) {
          for (let idx = 0; idx < images.length; idx++) {
            const img = images[idx];
            if (img.url.startsWith('data:')) {
              try {
                console.log(`Uploading Nano Banana image ${idx + 1} to Cloudinary`);
                const uploadResult = await cloudinary.uploader.upload(img.url, {
                  folder: 'product-images',
                  public_id: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${idx}`,
                  resource_type: 'image',
                  transformation: [
                    { width: 1024, height: 1024, crop: 'limit' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                  ]
                });
                
                images[idx].url = uploadResult.secure_url;
                images[idx].cloudinary = true;
                console.log(`Image ${idx + 1} uploaded to Cloudinary:`, uploadResult.secure_url);
              } catch (uploadError) {
                console.error(`Cloudinary upload error for image ${idx + 1}:`, uploadError.message);
                // Keep the base64 URL as fallback
              }
            }
          }
        }
        
        console.log(`Generated ${images.length} product images with Nano Banana`);
      } catch (error) {
        console.error('Nano Banana generation error:', error.message);
        // Continue without images
      }
    }

    // Track generation in database
    const userId = req.headers['x-user-id'] || req.headers['x-api-key'] || 'anonymous';
    try {
      await db.trackGeneration(userId, 'description', {
        productName,
        category,
        hasImages: images.length > 0,
        descriptionsCount: descriptions.length
      });
      
      // Track image generation if applicable
      if (images.length > 0) {
        await db.trackGeneration(userId, 'image', {
          productName,
          imageCount: images.length
        });
      }
    } catch (dbError) {
      console.error('Database tracking error:', dbError);
      // Continue even if tracking fails
    }
    
    // Ensure images array is always properly formatted
    const formattedImages = (images || []).map(img => ({
      url: img.url || '',
      type: img.type || img.style || 'product',
      model: img.model || 'unknown'
    }));

    res.status(200).json({
      success: true,
      product: productName,
      descriptions: descriptions,
      images: formattedImages, // Always return a properly formatted array
      generatedImages: formattedImages, // Include both keys for compatibility
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

// Export with rate limiting
module.exports = withRateLimit(generateDescriptionHandler, '/api/generate-description');