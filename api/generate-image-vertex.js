const { VertexAI } = require('@google-cloud/vertexai');
const { GoogleAuth } = require('google-auth-library');
const cloudinary = require('cloudinary').v2;

// Initialize Vertex AI
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'rare-result-471417-k0';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generate product images using Vertex AI's Imagen model
 * This uses Google's latest image generation technology
 */
async function generateProductImage(productName, features, category, targetAudience) {
  try {
    // Initialize Vertex AI client
    const vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });

    // Get the Imagen model
    const model = vertexAI.preview.getGenerativeModel({
      model: 'imagegeneration@006', // Latest Imagen model
    });

    // Create optimized product photography prompts
    const prompts = [
      {
        type: 'hero',
        prompt: `A photorealistic product photograph of ${productName}.
        ${features ? `Product features: ${features}` : ''}
        ${category ? `Category: ${category}` : ''}
        
        Technical specifications:
        - Shot type: Hero product shot, 3/4 angle view
        - Lighting: Professional studio lighting with soft box diffusion, key light at 45 degrees
        - Background: Pure white seamless backdrop (#FFFFFF) for e-commerce
        - Camera settings: Shot with Canon 5D Mark IV, 100mm macro lens, f/8, ISO 100
        - Style: Commercial product photography, ultra-high resolution, tack sharp focus
        - Post-processing: Color-corrected, dust removed, subtle shadow for depth
        - Mood: Premium, trustworthy, appealing to ${targetAudience || 'online shoppers'}
        - Composition: Rule of thirds, product occupies 70% of frame
        - Format: Square 1:1 aspect ratio, 1024x1024 pixels
        
        The image should showcase premium quality, highlighting textures, materials, and craftsmanship.`
      },
      {
        type: 'lifestyle',
        prompt: `Generate a photorealistic lifestyle product image of ${productName} in an elegant setting.
        ${category ? `Product category: ${category}` : ''}
        
        Scene details:
        - Setting: Modern, minimalist ${category === 'home' ? 'living space' : 'environment'} with natural elements
        - Lighting: Golden hour natural light through large windows, creating warm ambiance
        - Props: Complementary items that suggest the product's use case and value
        - Camera: Wide angle 35mm lens, f/4, shallow depth of field with product in sharp focus
        - Style: Premium lifestyle photography, magazine quality
        - Color palette: Warm, inviting tones with the product as the focal point
        - Target audience: ${targetAudience || 'aspirational consumers'}
        - Composition: Environmental shot showing product in context of use
        
        The image should tell a story about how the product enhances the customer's lifestyle.`
      },
      {
        type: 'detail',
        prompt: `Create a photorealistic close-up detail shot of ${productName}.
        ${features ? `Highlighting features: ${features}` : ''}
        
        Macro photography specifications:
        - Shot type: Extreme close-up showing texture and quality
        - Lighting: Directional lighting to emphasize texture and materials
        - Focus: Selective focus on key product detail with beautiful bokeh
        - Camera: Macro lens at 1:1 magnification, f/5.6, focus stacking for sharpness
        - Style: Premium product detail photography
        - Emphasis: Material quality, craftsmanship, unique features
        - Background: Soft gradient or completely blurred
        
        The image should communicate premium quality through attention to detail.`
      }
    ];

    const generatedImages = [];

    // Generate images for each prompt type
    for (const { type, prompt } of prompts) {
      try {
        console.log(`Generating ${type} shot for ${productName}...`);
        
        const request = {
          prompt: prompt,
          number_of_images: 1,
          aspect_ratio: '1:1',
          safety_filter_level: 'block_some',
          person_generation: 'allow_adult',
        };

        const result = await model.generateImage(request);
        
        if (result.predictions && result.predictions.length > 0) {
          const imageData = result.predictions[0].bytesBase64Encoded;
          
          // Upload to Cloudinary for permanent storage
          let imageUrl = `data:image/png;base64,${imageData}`;
          
          if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
              const uploadResult = await cloudinary.uploader.upload(imageUrl, {
                folder: 'product-images',
                public_id: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${type}_${Date.now()}`,
                resource_type: 'image',
                transformation: [
                  { width: 1024, height: 1024, crop: 'limit' },
                  { quality: 'auto:best' },
                  { fetch_format: 'auto' }
                ],
                tags: ['product', type, category].filter(Boolean)
              });
              
              imageUrl = uploadResult.secure_url;
              console.log(`${type} image uploaded to Cloudinary:`, imageUrl);
            } catch (uploadError) {
              console.error(`Failed to upload ${type} image to Cloudinary:`, uploadError.message);
              // Keep base64 URL as fallback
            }
          }
          
          generatedImages.push({
            url: imageUrl,
            type: type,
            style: `${type.charAt(0).toUpperCase() + type.slice(1)} Shot`,
            model: 'Vertex AI Imagen',
            prompt: prompt.substring(0, 200) + '...'
          });
        }
      } catch (error) {
        console.error(`Failed to generate ${type} image:`, error.message);
      }
    }

    return generatedImages;
  } catch (error) {
    console.error('Vertex AI Imagen generation error:', error);
    throw error;
  }
}

/**
 * API handler for image generation endpoint
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productName, keyFeatures, productCategory, targetAudience } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    console.log('Generating product images with Vertex AI Imagen for:', productName);
    
    const images = await generateProductImage(
      productName,
      keyFeatures,
      productCategory,
      targetAudience
    );

    if (images.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to generate images',
        message: 'The image generation service is temporarily unavailable. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      product: productName,
      images: images,
      model: 'Vertex AI Imagen',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image generation API error:', error);
    res.status(500).json({
      error: 'Image generation failed',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};