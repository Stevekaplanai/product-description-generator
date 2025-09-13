const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const cloudinary = require('cloudinary').v2;
const { optionalAuth } = require('./middleware/auth');
const { deductCredits, getUserCredits } = require('./lib/db');

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for authentication (optional - allows anonymous with limits)
  await new Promise((resolve) => {
    optionalAuth(req, res, resolve);
  });

  try {
    const {
      productName,
      productCategory,
      targetAudience,
      keyFeatures,
      tone,
      generateImages,
      imagesOnly
    } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Check credits if user is authenticated
    if (req.user) {
      const credits = await getUserCredits(req.user.id);

      // Check if user has enough credits
      const descriptionCost = imagesOnly ? 0 : 1;
      const imageCost = (generateImages || imagesOnly) ? 1 : 0;

      if (credits.descriptions < descriptionCost) {
        return res.status(402).json({
          error: 'Insufficient credits for descriptions',
          creditsNeeded: descriptionCost,
          creditsAvailable: credits.descriptions
        });
      }

      if (credits.images < imageCost) {
        return res.status(402).json({
          error: 'Insufficient credits for images',
          creditsNeeded: imageCost,
          creditsAvailable: credits.images
        });
      }

      // Deduct credits
      if (descriptionCost > 0) {
        const deductResult = await deductCredits(req.user.id, 'descriptions', descriptionCost);
        if (!deductResult.success) {
          return res.status(402).json({ error: deductResult.error });
        }
      }

      if (imageCost > 0) {
        const deductResult = await deductCredits(req.user.id, 'images', imageCost);
        if (!deductResult.success) {
          // Refund description credit if image deduction fails
          if (descriptionCost > 0) {
            await addCredits(req.user.id, 'descriptions', descriptionCost);
          }
          return res.status(402).json({ error: deductResult.error });
        }
      }
    } else {
      // Anonymous users get limited usage (3 per day tracked by IP)
      // This would require implementing IP-based rate limiting
      console.log('Anonymous user - limited to 3 generations per day');
    }

    let descriptions = [];
    let images = [];

    // Generate descriptions (unless images only)
    if (!imagesOnly && gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `Create 3 unique product descriptions for:
Product: ${productName}
Category: ${productCategory || 'General'}
Target Audience: ${targetAudience || 'General consumers'}
Key Features: ${keyFeatures || 'High quality'}
Tone: ${tone || 'Professional'}

Requirements:
- Each description should be 100-150 words
- Use different angles and benefits
- Include SEO-friendly keywords
- Make them compelling and conversion-focused
- Format as JSON array with keys: version, description, focus`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the response
        try {
          const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
          descriptions = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // Fallback if JSON parsing fails
          descriptions = [
            {
              version: 1,
              description: text.substring(0, 500),
              focus: 'general'
            }
          ];
        }
      } catch (error) {
        console.error('Gemini error:', error);
        // Provide fallback descriptions
        descriptions = [
          {
            version: 1,
            description: `Discover the exceptional ${productName}, perfectly designed for ${targetAudience || 'you'}. This premium ${productCategory || 'product'} features ${keyFeatures || 'outstanding quality'}, delivering unmatched value and performance.`,
            focus: 'value'
          },
          {
            version: 2,
            description: `Experience ${productName} - the ideal ${productCategory || 'solution'} that combines innovation with reliability. Crafted with ${keyFeatures || 'attention to detail'}, it's the perfect choice for ${targetAudience || 'discerning customers'}.`,
            focus: 'quality'
          },
          {
            version: 3,
            description: `Transform your experience with ${productName}. This remarkable ${productCategory || 'product'} offers ${keyFeatures || 'exceptional features'} that make it stand out from the competition. Designed for ${targetAudience || 'those who demand the best'}.`,
            focus: 'benefits'
          }
        ];
      }
    }

    // Generate images if requested
    if ((generateImages || imagesOnly) && openai) {
      try {
        const imagePrompts = [
          {
            prompt: `Professional product photography of ${productName}. Clean white background, studio lighting, commercial e-commerce style, high resolution`,
            type: 'hero'
          },
          {
            prompt: `${productName} in lifestyle setting. Natural lighting, real-world context, appealing to ${targetAudience || 'consumers'}`,
            type: 'lifestyle'
          },
          {
            prompt: `Close-up detail shot of ${productName} showing quality and features. Macro photography, sharp focus`,
            type: 'detail'
          }
        ];

        const imageResults = await Promise.all(
          imagePrompts.map(async (imgPrompt) => {
            try {
              const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: imgPrompt.prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard"
              });

              if (response.data && response.data[0]) {
                // Upload to Cloudinary for persistence
                let cloudinaryUrl = response.data[0].url;
                try {
                  const uploadResult = await cloudinary.uploader.upload(response.data[0].url, {
                    folder: 'product-descriptions',
                    public_id: `${productName.replace(/\s+/g, '_')}_${imgPrompt.type}_${Date.now()}`
                  });
                  cloudinaryUrl = uploadResult.secure_url;
                } catch (uploadError) {
                  console.error('Cloudinary upload error:', uploadError);
                }

                return {
                  url: cloudinaryUrl,
                  type: imgPrompt.type,
                  model: 'dall-e-3'
                };
              }
            } catch (error) {
              console.error(`Image generation error for ${imgPrompt.type}:`, error);
              return null;
            }
          })
        );

        images = imageResults.filter(img => img !== null);
      } catch (error) {
        console.error('Image generation error:', error);
      }
    }

    // Get remaining credits if user is authenticated
    let remainingCredits = null;
    if (req.user) {
      remainingCredits = await getUserCredits(req.user.id);
    }

    res.status(200).json({
      success: true,
      product: productName,
      descriptions: descriptions,
      images: images,
      remainingCredits: remainingCredits,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: 'Failed to generate content',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};