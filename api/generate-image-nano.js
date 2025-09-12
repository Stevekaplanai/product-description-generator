const { GoogleGenerativeAI } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;

// Initialize Gemini with API key
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Professional product photography prompt templates
 * Based on best practices for Nano Banana / Gemini image generation
 */
const PROMPT_TEMPLATES = {
  hero: (product, features, category, audience) => `
    Generate a photorealistic hero product photograph of ${product}.
    ${features ? `Key features to highlight: ${features}` : ''}
    ${category ? `Product category: ${category}` : ''}
    
    TECHNICAL SPECIFICATIONS:
    • Shot type: Hero product shot at 3/4 angle showing the best view
    • Lighting: Professional studio lighting with soft diffusion, creating subtle gradients
    • Background: Clean white or light grey gradient background for e-commerce (#FFFFFF to #F5F5F5)
    • Camera: Shot with professional DSLR, 85mm lens at f/8 for sharp detail
    • Style: Premium commercial product photography, ultra-sharp focus
    • Composition: Product centered, occupying 70% of frame, slight angle for dimension
    • Mood: Aspirational, premium quality, trustworthy
    • Target audience: ${audience || 'online shoppers looking for quality'}
    • Format: Square 1:1 aspect ratio for maximum versatility
    
    The image should immediately communicate quality and value, making the product irresistible.
  `,
  
  lifestyle: (product, features, category, audience) => `
    Create a photorealistic lifestyle product image of ${product} in an elegant real-world setting.
    ${category ? `Product category: ${category}` : ''}
    
    SCENE COMPOSITION:
    • Setting: Modern, aspirational ${category === 'home' ? 'living space' : category === 'fashion' ? 'outfit setting' : 'lifestyle environment'}
    • Lighting: Natural golden hour light creating warm, inviting atmosphere
    • Context: Show the product being used or displayed in its natural environment
    • Props: Complementary items that enhance but don't distract from the product
    • Camera: 35mm wide angle, f/4, shallow depth keeping product in sharp focus
    • Style: Premium lifestyle photography, magazine editorial quality
    • Color palette: Warm, harmonious tones with product as the clear focal point
    • Audience appeal: ${audience || 'aspirational consumers seeking quality lifestyle products'}
    
    The image should tell a story about how this product enhances the customer's life.
  `,
  
  detail: (product, features) => `
    Generate a photorealistic macro detail shot of ${product}.
    ${features ? `Focus on these features: ${features}` : ''}
    
    MACRO PHOTOGRAPHY SPECS:
    • Shot type: Extreme close-up showing texture, materials, and craftsmanship
    • Lighting: Directional raking light to emphasize texture and quality
    • Focus: Selective focus on the most impressive detail with creamy bokeh
    • Camera: Macro lens, 1:1 magnification, f/5.6 for optimal sharpness
    • Style: Premium product detail photography showcasing quality
    • Emphasis: Material quality, fine details, unique features, craftsmanship
    • Background: Completely blurred or soft gradient
    
    The image should make viewers want to touch and experience the product's premium quality.
  `,
  
  multiAngle: (product, category) => `
    Create a photorealistic multi-angle product showcase of ${product}.
    ${category ? `Category: ${category}` : ''}
    
    MULTI-VIEW SPECIFICATIONS:
    • Layout: Show the product from 3 different angles in one cohesive image
    • Views: Front view, 3/4 angle, and profile/side view
    • Lighting: Consistent professional studio lighting across all angles
    • Background: Clean white background for consistency
    • Style: E-commerce multi-view product photography
    • Purpose: Give customers complete understanding of product form and features
    
    Each angle should reveal different aspects of the product's design and functionality.
  `,
  
  packaging: (product, category, audience) => `
    Generate a photorealistic image of ${product} with its premium packaging.
    ${category ? `Product category: ${category}` : ''}
    
    PACKAGING PHOTOGRAPHY:
    • Focus: Show both the product and its packaging/unboxing experience
    • Arrangement: Elegant composition showing packaging design and product reveal
    • Lighting: Soft studio lighting highlighting packaging materials and finishes
    • Style: Premium unboxing photography, luxury presentation
    • Details: Show packaging textures, logos, and special touches
    • Audience: ${audience || 'customers who value presentation and gift-giving'}
    
    The image should communicate that this is a premium product from packaging to product.
  `
};

/**
 * Generate product images using Gemini (Nano Banana)
 */
async function generateProductImages(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      productName, 
      keyFeatures, 
      productCategory, 
      targetAudience,
      imageTypes = ['hero', 'lifestyle'], // Default to hero and lifestyle shots
      numberOfImages = 2
    } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    if (!gemini) {
      return res.status(500).json({ 
        error: 'Image generation not configured',
        message: 'Gemini API key is not set. Please configure GEMINI_API_KEY in environment variables.'
      });
    }

    console.log(`Generating ${numberOfImages} product images with Nano Banana for:`, productName);
    
    // Use the latest Gemini model with image generation capabilities
    const model = gemini.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    const generatedImages = [];
    const imagesToGenerate = Math.min(numberOfImages, imageTypes.length);

    // Generate each requested image type
    for (let i = 0; i < imagesToGenerate; i++) {
      const imageType = imageTypes[i];
      const promptFunction = PROMPT_TEMPLATES[imageType] || PROMPT_TEMPLATES.hero;
      
      try {
        console.log(`Generating ${imageType} shot...`);
        
        const prompt = promptFunction(
          productName,
          keyFeatures,
          productCategory,
          targetAudience
        );

        const result = await model.generateContent({
          contents: [{ 
            role: 'user', 
            parts: [{ text: prompt }] 
          }],
          generationConfig: {
            responseMimeType: 'image/png'
          }
        });

        const response = await result.response;
        
        // Check if the response contains image data
        if (response.candidates && response.candidates[0]) {
          const candidate = response.candidates[0];
          
          // Handle different response formats
          let imageData = null;
          let mimeType = 'image/png';
          
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData) {
                imageData = part.inlineData.data;
                mimeType = part.inlineData.mimeType || 'image/png';
                break;
              } else if (part.fileData) {
                // Handle file-based response
                generatedImages.push({
                  url: part.fileData.fileUri,
                  type: imageType,
                  style: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Shot`,
                  model: 'Nano Banana (Gemini 2.0)',
                  cloudinary: false
                });
                console.log(`${imageType} image generated (file URI)`);
                continue;
              }
            }
          }
          
          if (imageData) {
            // Create base64 data URL
            let imageUrl = `data:${mimeType};base64,${imageData}`;
            let isCloudinary = false;
            
            // Upload to Cloudinary if configured
            if (process.env.CLOUDINARY_CLOUD_NAME) {
              try {
                console.log(`Uploading ${imageType} image to Cloudinary...`);
                const uploadResult = await cloudinary.uploader.upload(imageUrl, {
                  folder: 'product-images',
                  public_id: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${imageType}_${Date.now()}`,
                  resource_type: 'image',
                  transformation: [
                    { width: 1024, height: 1024, crop: 'limit' },
                    { quality: 'auto:best' },
                    { fetch_format: 'auto' }
                  ],
                  tags: ['product', imageType, productCategory].filter(Boolean)
                });
                
                imageUrl = uploadResult.secure_url;
                isCloudinary = true;
                console.log(`${imageType} image uploaded to Cloudinary:`, imageUrl);
              } catch (uploadError) {
                console.error(`Failed to upload ${imageType} image to Cloudinary:`, uploadError.message);
                // Keep base64 URL as fallback
              }
            }
            
            generatedImages.push({
              url: imageUrl,
              type: imageType,
              style: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Shot`,
              model: 'Nano Banana (Gemini 2.0)',
              cloudinary: isCloudinary
            });
            
            console.log(`${imageType} image generated successfully`);
          }
        }
      } catch (error) {
        console.error(`Failed to generate ${imageType} image:`, error.message);
        // Continue with other images even if one fails
      }
    }

    if (generatedImages.length === 0) {
      // If no images were generated, try a simpler text-based approach
      console.log('Falling back to text-based image description generation');
      
      const fallbackPrompt = `Describe in detail what a professional product photograph of ${productName} would look like. Include specific details about lighting, composition, background, and styling that would make it perfect for e-commerce.`;
      
      try {
        const result = await model.generateContent(fallbackPrompt);
        const response = await result.response;
        const description = response.text();
        
        return res.status(200).json({
          success: true,
          product: productName,
          images: [],
          imageDescription: description,
          message: 'Image generation is currently in text mode. Visual generation will be available soon.',
          model: 'Nano Banana (Gemini 2.0)'
        });
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError.message);
      }
    }

    // Return generated images
    res.status(200).json({
      success: true,
      product: productName,
      images: generatedImages,
      totalGenerated: generatedImages.length,
      model: 'Nano Banana (Gemini 2.0)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Nano Banana image generation error:', error);
    res.status(500).json({
      error: 'Image generation failed',
      message: error.message || 'An unexpected error occurred',
      details: 'The image generation service encountered an error. Please try again or contact support.',
      suggestion: 'Try reducing the number of images or simplifying the product description.'
    });
  }
}

module.exports = generateProductImages;