const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const cloudinary = require('cloudinary').v2;

// Initialize APIs
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

// Professional product photography prompt templates
const PROMPT_TEMPLATES = {
  hero: (product, features, category, audience) => ({
    vertex: `A photorealistic product photograph of ${product}. ${features ? `Features: ${features}.` : ''} Professional studio lighting, pure white background, commercial e-commerce photography style, centered composition, sharp focus.`,
    dalle: `Professional product photography of ${product}. ${features ? `Key features: ${features}.` : ''} Studio lighting on seamless white background, commercial e-commerce style, high resolution, sharp focus, ${category ? `${category} product,` : ''} premium quality.`,
    gemini: `Generate a detailed description of a hero product shot for ${product} with features: ${features || 'premium quality'}. Include specific lighting setup, camera settings, and composition details.`
  }),
  
  lifestyle: (product, features, category, audience) => ({
    vertex: `Photorealistic lifestyle image of ${product} in elegant ${category || 'modern'} setting. Natural lighting, showing product in use, premium lifestyle photography for ${audience || 'consumers'}.`,
    dalle: `Lifestyle product photography of ${product} in an elegant, modern setting. ${features ? `Highlighting: ${features}.` : ''} Natural lighting, aspirational environment, showing product in context, magazine quality.`,
    gemini: `Describe a lifestyle product photograph of ${product} showing it in use in a ${category || 'modern'} setting that appeals to ${audience || 'target customers'}.`
  }),
  
  detail: (product, features) => ({
    vertex: `Extreme close-up macro photograph of ${product} showing texture and quality. ${features ? `Focus on: ${features}.` : ''} Professional macro photography with selective focus.`,
    dalle: `Macro detail shot of ${product}. ${features ? `Highlighting: ${features}.` : ''} Extreme close-up showing texture and craftsmanship, shallow depth of field, professional product photography.`,
    gemini: `Describe a macro detail shot of ${product} that showcases ${features || 'quality and craftsmanship'} with specific camera and lighting details.`
  })
};

/**
 * Try to generate image with Vertex AI Imagen
 * @returns {Object|null} Generated image or null if failed
 */
async function tryVertexAI(prompt, productName) {
  // Check if we're in a Google Cloud environment or have ADC configured
  // Vercel/serverless environments won't have local file paths
  const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                        process.env.GOOGLE_CLOUD_PROJECT ||
                        process.env.GCLOUD_PROJECT;

  if (!hasCredentials) {
    console.log('Vertex AI not configured (no Google Cloud project)');
    return null;
  }
  
  try {
    const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
    const { helpers } = require('@google-cloud/aiplatform');

    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'rare-result-471417-k0';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    const model = 'imagegeneration@006';

    console.log(`Attempting Vertex AI with project: ${projectId}, location: ${location}`);
    
    const predictionServiceClient = new PredictionServiceClient({
      apiEndpoint: `${location}-aiplatform.googleapis.com`,
    });
    
    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${model}`;
    
    const promptText = {
      prompt: prompt,
      sampleCount: 1,
    };
    
    const instanceValue = helpers.toValue(promptText);
    const instances = [instanceValue];
    
    const parameter = {
      sampleCount: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'block_some',
      personGeneration: 'allow_adult',
    };
    const parameters = helpers.toValue(parameter);
    
    const request = {
      endpoint,
      instances,
      parameters,
    };
    
    console.log('Attempting Vertex AI image generation...');
    const [response] = await predictionServiceClient.predict(request);
    
    if (response.predictions && response.predictions.length > 0) {
      const prediction = response.predictions[0];
      const imageData = prediction.structValue.fields.bytesBase64Encoded.stringValue;
      
      console.log('✅ Vertex AI image generated successfully');
      return {
        url: `data:image/png;base64,${imageData}`,
        source: 'Vertex AI Imagen',
        model: 'imagegeneration@006'
      };
    }
  } catch (error) {
    console.log('Vertex AI generation failed:', error.message);
  }
  
  return null;
}

/**
 * Try to generate image with DALL-E 3
 * @returns {Object|null} Generated image or null if failed
 */
async function tryDALLE(prompt, productName) {
  if (!openai) {
    console.log('DALL-E not configured (no API key)');
    return null;
  }
  
  try {
    console.log('Attempting DALL-E 3 image generation...');
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });
    
    if (response.data && response.data[0]) {
      console.log('✅ DALL-E image generated successfully');
      return {
        url: response.data[0].url,
        source: 'DALL-E 3',
        model: 'dall-e-3'
      };
    }
  } catch (error) {
    console.log('DALL-E generation failed:', error.message);
  }
  
  return null;
}

/**
 * Try to generate detailed description with Gemini
 * @returns {Object|null} Generated description or null if failed
 */
async function tryGeminiDescription(prompt, productName) {
  if (!gemini) {
    console.log('Gemini not configured (no API key)');
    return null;
  }
  
  try {
    console.log('Generating detailed photography description with Gemini...');
    const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();
    
    console.log('✅ Gemini description generated successfully');
    return {
      description: description,
      source: 'Gemini',
      model: 'gemini-2.0-flash-exp',
      type: 'photography_guide'
    };
  } catch (error) {
    console.log('Gemini generation failed:', error.message);
  }
  
  return null;
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(imageUrl, productName, imageType) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return imageUrl;
  }
  
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
      tags: ['product', imageType, 'hybrid-generation']
    });
    
    console.log('✅ Uploaded to Cloudinary:', uploadResult.secure_url);
    return uploadResult.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed:', error.message);
    return imageUrl;
  }
}

/**
 * Main API handler with fallback logic
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      productName, 
      keyFeatures, 
      productCategory, 
      targetAudience,
      imageTypes = ['hero', 'lifestyle'],
      preferredService = 'auto' // 'vertex', 'dalle', 'auto'
    } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    console.log(`\n🎨 Generating images for: ${productName}`);
    console.log(`Preferred service: ${preferredService}`);
    console.log(`Image types requested: ${imageTypes.join(', ')}`);

    const results = [];
    const stats = {
      attempted: [],
      successful: [],
      failed: []
    };

    // Generate each requested image type
    for (const imageType of imageTypes) {
      console.log(`\n📸 Generating ${imageType} shot...`);
      
      const prompts = PROMPT_TEMPLATES[imageType] 
        ? PROMPT_TEMPLATES[imageType](productName, keyFeatures, productCategory, targetAudience)
        : PROMPT_TEMPLATES.hero(productName, keyFeatures, productCategory, targetAudience);
      
      let imageGenerated = null;
      
      // Try Vertex AI first (if not explicitly set to DALL-E only)
      if (preferredService !== 'dalle') {
        stats.attempted.push('Vertex AI');
        imageGenerated = await tryVertexAI(prompts.vertex, productName);
        if (imageGenerated) {
          stats.successful.push('Vertex AI');
        } else {
          stats.failed.push('Vertex AI');
        }
      }
      
      // Fall back to DALL-E if Vertex failed (or if set to DALL-E only)
      if (!imageGenerated && preferredService !== 'vertex') {
        stats.attempted.push('DALL-E');
        imageGenerated = await tryDALLE(prompts.dalle, productName);
        if (imageGenerated) {
          stats.successful.push('DALL-E');
        } else {
          stats.failed.push('DALL-E');
        }
      }
      
      // If we have an image, process it
      if (imageGenerated) {
        // Upload to Cloudinary if it's not already a URL
        if (imageGenerated.url.startsWith('data:')) {
          imageGenerated.url = await uploadToCloudinary(
            imageGenerated.url, 
            productName, 
            imageType
          );
          imageGenerated.cloudinary = true;
        }
        
        results.push({
          ...imageGenerated,
          type: imageType,
          style: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Shot`,
          prompt: prompts.vertex || prompts.dalle
        });
      } else {
        // Fall back to description if no image could be generated
        console.log(`⚠️ No image generated for ${imageType}, generating description instead`);
        stats.attempted.push('Gemini Description');
        
        const description = await tryGeminiDescription(prompts.gemini, productName);
        if (description) {
          stats.successful.push('Gemini Description');
          results.push({
            ...description,
            type: imageType,
            style: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Shot Description`
          });
        } else {
          stats.failed.push('Gemini Description');
        }
      }
    }

    // Prepare response
    const response = {
      success: results.length > 0,
      product: productName,
      results: results,
      stats: {
        requested: imageTypes.length,
        generated: results.filter(r => r.url).length,
        descriptions: results.filter(r => r.description).length,
        services: stats
      },
      timestamp: new Date().toISOString()
    };

    if (results.length === 0) {
      response.error = 'No images or descriptions could be generated';
      response.suggestion = 'Please check your API keys and try again';
    }

    console.log(`\n✅ Generation complete: ${results.length} results`);
    console.log(`Services used: ${stats.successful.join(', ') || 'None'}`);
    
    res.status(200).json(response);

  } catch (error) {
    console.error('Hybrid generation error:', error);
    res.status(500).json({
      error: 'Image generation failed',
      message: error.message,
      suggestion: 'Please check your API configuration and try again'
    });
  }
};