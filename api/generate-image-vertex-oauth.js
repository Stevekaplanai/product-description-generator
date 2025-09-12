const { GoogleAuth } = require('google-auth-library');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generate product images using Vertex AI with OAuth authentication
 * This version uses Application Default Credentials instead of service account keys
 */
async function generateProductImageWithOAuth(productName, features, category, targetAudience) {
  try {
    // Use GoogleAuth to get credentials (will use ADC - Application Default Credentials)
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const projectId = await auth.getProjectId() || process.env.GOOGLE_CLOUD_PROJECT || 'rare-result-471417-k0';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    // Get access token
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Could not obtain access token. Please run: gcloud auth application-default login');
    }

    console.log('✅ OAuth authentication successful');
    console.log(`Project: ${projectId}, Location: ${location}`);

    // Prepare the request to Vertex AI
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`;

    // Create optimized product photography prompts
    const prompts = [
      {
        type: 'hero',
        prompt: `A photorealistic product photograph of ${productName}.
        ${features ? `Product features: ${features}` : ''}
        ${category ? `Category: ${category}` : ''}
        
        Technical specifications:
        - Shot type: Hero product shot, 3/4 angle view
        - Lighting: Professional studio lighting with soft box diffusion
        - Background: Pure white seamless backdrop for e-commerce
        - Camera: Shot with professional DSLR, 100mm macro lens, f/8
        - Style: Commercial product photography, ultra-high resolution
        - Target audience: ${targetAudience || 'online shoppers'}
        - Format: Square 1:1 aspect ratio
        
        The image should showcase premium quality and craftsmanship.`
      },
      {
        type: 'lifestyle',
        prompt: `Generate a photorealistic lifestyle product image of ${productName} in an elegant setting.
        ${category ? `Product category: ${category}` : ''}
        
        Scene details:
        - Setting: Modern, minimalist environment
        - Lighting: Natural golden hour light
        - Style: Premium lifestyle photography
        - Target audience: ${targetAudience || 'aspirational consumers'}
        
        The image should tell a story about the product's value.`
      }
    ];

    const generatedImages = [];

    // Generate images for each prompt type
    for (const { type, prompt } of prompts) {
      try {
        console.log(`Generating ${type} shot for ${productName}...`);
        
        const requestBody = {
          instances: [
            {
              prompt: prompt
            }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_adult'
          }
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Vertex AI error for ${type} shot:`, errorText);
          
          // Check for common errors
          if (response.status === 403) {
            console.log('⚠️ Permission denied. Make sure Vertex AI API is enabled and you have access.');
          } else if (response.status === 404) {
            console.log('⚠️ Model not found. The Imagen model might not be available in your region.');
          }
          continue;
        }

        const result = await response.json();
        
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
              console.log(`✅ ${type} image uploaded to Cloudinary:`, imageUrl);
            } catch (uploadError) {
              console.error(`Failed to upload ${type} image to Cloudinary:`, uploadError.message);
            }
          }
          
          generatedImages.push({
            url: imageUrl,
            type: type,
            style: `${type.charAt(0).toUpperCase() + type.slice(1)} Shot`,
            model: 'Vertex AI Imagen (OAuth)',
            prompt: prompt.substring(0, 200) + '...'
          });
          
          console.log(`✅ ${type} image generated successfully`);
        }
      } catch (error) {
        console.error(`Failed to generate ${type} image:`, error.message);
      }
    }

    return generatedImages;
  } catch (error) {
    console.error('Vertex AI OAuth generation error:', error);
    throw error;
  }
}

/**
 * API handler for image generation endpoint using OAuth
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

    console.log('Generating product images with Vertex AI (OAuth) for:', productName);
    
    const images = await generateProductImageWithOAuth(
      productName,
      keyFeatures,
      productCategory,
      targetAudience
    );

    if (images.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to generate images',
        message: 'The image generation service could not create images. This might be due to authentication or API availability.',
        suggestion: 'Run: gcloud auth application-default login'
      });
    }

    res.status(200).json({
      success: true,
      product: productName,
      images: images,
      model: 'Vertex AI Imagen (OAuth)',
      authMethod: 'Application Default Credentials',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image generation API error:', error);
    
    let suggestion = 'Check your authentication and API configuration';
    if (error.message.includes('Could not obtain access token')) {
      suggestion = 'Run: gcloud auth application-default login';
    } else if (error.message.includes('API not enabled')) {
      suggestion = 'Run: gcloud services enable aiplatform.googleapis.com';
    }
    
    res.status(500).json({
      error: 'Image generation failed',
      message: error.message || 'An unexpected error occurred',
      suggestion: suggestion,
      authMethod: 'Attempted OAuth/ADC authentication'
    });
  }
};