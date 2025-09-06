const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const Stripe = require('stripe');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const axios = require('axios');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');
require('dotenv').config();

// Import email service
const emailService = require('./email-service');

// Import video composer for hybrid UGC videos
const videoComposer = require('./video-composer');

const app = express();

// Initialize APIs with graceful fallback
const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-test-key-replace-with-real-key' 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const gemini = process.env.GOOGLE_GEMINI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY !== 'your-gemini-api-key-here'
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null;

const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_replace_with_real_key'
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// D-ID API configuration
const D_ID_API_KEY = process.env.D_ID_API_KEY || null;
const D_ID_API_URL = 'https://api.d-id.com';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Ensure directories exist
['uploads', 'generated-images', 'generated-videos'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(filePath, folder = 'product-descriptions', tags = [], context = {}) {
  try {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      tags: tags,
      context: context
    };
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      alt: context.alt || ''
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// Helper function to upload video to Cloudinary
async function uploadVideoToCloudinary(videoUrl, folder = 'product-videos', publicId = null) {
  try {
    console.log('Starting Cloudinary video upload from:', videoUrl);
    const uploadOptions = {
      folder: folder,
      resource_type: 'video',
      chunk_size: 6000000, // 6MB chunks for large videos
      timeout: 120000, // 2 minute timeout for video uploads
      eager_async: true, // Process transformations asynchronously
      eager_notification_url: null
    };
    
    if (publicId) {
      uploadOptions.public_id = publicId;
    }
    
    const result = await cloudinary.uploader.upload(videoUrl, uploadOptions);
    
    console.log('Cloudinary video upload successful:', {
      public_id: result.public_id,
      url: result.secure_url,
      duration: result.duration
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      duration: result.duration,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary video upload error:', error.message);
    console.error('Full error:', error);
    return null;
  }
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// CSV upload configuration
const csvUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/generated-images', express.static('generated-images'));
app.use('/generated-videos', express.static('generated-videos'));
app.use('/uploads', express.static('uploads'));

const PRICING_TIERS = {
  basic: { 
    price: 5, 
    features: ['Basic SEO optimization', '150 words', '2 variations', '1 AI image'],
    imageCount: 1,
    variationCount: 2
  },
  standard: { 
    price: 15, 
    features: ['Advanced SEO', '300 words', '3 variations', '3 AI images', 'Image analysis'],
    imageCount: 3,
    variationCount: 3
  },
  premium: { 
    price: 25, 
    features: ['Full SEO suite', '500+ words', '5 variations', '5 AI images', 'Multiple styles', 'Advanced image analysis'],
    imageCount: 5,
    variationCount: 5
  }
};

// Video upsell pricing
const VIDEO_UPSELL = {
  single: {
    price: 29,
    features: ['1 viral UGC video', 'AI-written script', 'Avatar selection', 'Professional voice'],
    videoCount: 1
  },
  triple: {
    price: 69,
    features: ['3 viral UGC videos', 'Multiple scripts', 'Different avatars', 'A/B testing ready'],
    videoCount: 3
  }
};

// Image styles for generation
const IMAGE_STYLES = {
  studio: "professional product photography, studio lighting, white background, high resolution, commercial quality",
  lifestyle: "lifestyle photography, natural setting, in use, authentic, warm lighting",
  infographic: "clean infographic style, modern design, feature callouts, minimalist",
  artistic: "artistic render, creative composition, dramatic lighting, premium feel",
  technical: "technical diagram, detailed view, specifications visible, professional"
};

// Generate product images using DALL-E or fallback
async function generateProductImages(productName, category, features, style = 'studio', count = 1) {
  const images = [];
  
  if (openai) {
    // Use DALL-E 3 for image generation
    try {
      for (let i = 0; i < count; i++) {
        const stylePrompt = IMAGE_STYLES[Object.keys(IMAGE_STYLES)[i % 5]] || IMAGE_STYLES.studio;
        const prompt = `${productName}, ${category} product, ${features}, ${stylePrompt}`;
        
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        const imageUrl = response.data[0].url;
        const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const styleName = Object.keys(IMAGE_STYLES)[i % 5];
        const sanitizedProductName = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const filename = `${sanitizedProductName}_${styleName}_${Date.now()}.png`;
        const filepath = path.join('generated-images', filename);
        
        await sharp(imageData.data)
          .resize(800, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
          .png()
          .toFile(filepath);
        
        // Create meaningful alt text
        const altText = `${productName} - ${category} product with ${styleName} style photography showing ${features.split('\n')[0]}`;
        
        // Upload to Cloudinary with proper naming and alt text
        let cloudinaryData = null;
        try {
          cloudinaryData = await uploadToCloudinary(
            filepath, 
            'generated-products',
            [sanitizedProductName, category, styleName, 'ai-generated'],
            { 
              alt: altText,
              caption: `AI-generated product image of ${productName}`,
              product_name: productName,
              style: styleName
            }
          );
          console.log(`Generated image uploaded to Cloudinary: ${cloudinaryData.url}`);
        } catch (uploadError) {
          console.error('Failed to upload generated image to Cloudinary:', uploadError);
        }
        
        images.push({
          url: `/generated-images/${filename}`,
          cloudinaryUrl: cloudinaryData?.url || null,
          cloudinaryData: cloudinaryData,
          style: styleName,
          altText: altText,
          filename: filename,
          prompt: prompt.substring(0, 100) + '...'
        });
      }
    } catch (error) {
      console.error('DALL-E generation error:', error);
      return generateMockImages(productName, count);
    }
  } else {
    // Generate mock/placeholder images
    return generateMockImages(productName, count);
  }
  
  return images;
}

// Generate mock images for demo mode
async function generateMockImages(productName, count) {
  const images = [];
  const colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444'];
  
  for (let i = 0; i < count; i++) {
    const filename = `mock_${Date.now()}_${i}.png`;
    const filepath = path.join('generated-images', filename);
    
    // Create a gradient placeholder image with product name
    const svg = `
      <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[i % colors.length]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[(i + 1) % colors.length]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="800" fill="url(#grad${i})" />
        <text x="400" y="380" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" font-weight="bold">
          ${productName.substring(0, 20)}
        </text>
        <text x="400" y="440" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.9">
          AI Generated Image ${i + 1}
        </text>
        <text x="400" y="480" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" opacity="0.7">
          Style: ${Object.keys(IMAGE_STYLES)[i % 5]}
        </text>
      </svg>`;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filepath);
    
    // Upload to Cloudinary
    let cloudinaryUrl = null;
    try {
      cloudinaryUrl = await uploadToCloudinary(filepath, 'generated-products-demo');
      console.log(`Demo image uploaded to Cloudinary: ${cloudinaryUrl}`);
    } catch (uploadError) {
      console.error('Failed to upload demo image to Cloudinary:', uploadError);
    }
    
    images.push({
      url: `/generated-images/${filename}`,
      cloudinaryUrl: cloudinaryUrl,
      style: Object.keys(IMAGE_STYLES)[i % 5],
      demo: true
    });
  }
  
  return images;
}

// Analyze image with Gemini Vision
async function analyzeImage(imagePath) {
  if (!gemini) {
    return {
      productType: 'Product',
      features: ['High quality', 'Modern design', 'Durable materials'],
      colors: ['Multiple colors available'],
      suggestedCategory: 'General',
      detectedMaterials: ['Premium materials'],
      suggestedAudience: 'General consumers'
    };
  }

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    
    const prompt = `Analyze this product image and provide:
    1. Product type/name
    2. Key features visible
    3. Colors detected
    4. Suggested category
    5. Materials if identifiable
    6. Target audience suggestion
    Format as JSON.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch {
      return {
        productType: 'Analyzed Product',
        features: text.split('\n').filter(line => line.trim()),
        suggestedCategory: 'General',
        detectedMaterials: [],
        suggestedAudience: 'General consumers'
      };
    }
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return {
      productType: 'Product',
      features: ['Unable to analyze image'],
      suggestedCategory: 'General'
    };
  }
}

// Generate multiple variations
function generateVariations(baseDescription, count, tone) {
  // Safety check for null or undefined baseDescription
  if (!baseDescription) {
    console.error('generateVariations called with null/undefined baseDescription');
    return ['Error: Unable to generate description. Please try again.'];
  }
  
  const tones = {
    professional: ['formal', 'corporate', 'expert', 'authoritative', 'technical'],
    casual: ['friendly', 'conversational', 'relaxed', 'approachable', 'easy-going'],
    luxury: ['exclusive', 'premium', 'sophisticated', 'elegant', 'refined'],
    playful: ['fun', 'energetic', 'vibrant', 'exciting', 'cheerful'],
    technical: ['detailed', 'precise', 'analytical', 'comprehensive', 'thorough']
  };

  const variations = [baseDescription];
  const selectedTones = tones[tone] || tones.professional;
  
  for (let i = 1; i < count; i++) {
    const variationTone = selectedTones[i % selectedTones.length];
    const variation = baseDescription
      .replace(/perfect choice/gi, i % 2 ? 'ideal solution' : 'ultimate selection')
      .replace(/exceptional quality/gi, i % 2 ? 'outstanding craftsmanship' : 'superior excellence')
      .replace(/discover/gi, i % 2 ? 'experience' : 'explore')
      .replace(/remarkable/gi, i % 2 ? 'impressive' : 'extraordinary')
      .replace(/order now/gi, i % 2 ? 'shop today' : 'buy now');
    
    variations.push(`[Variation ${i + 1} - ${variationTone.toUpperCase()} tone]\n\n${variation}`);
  }
  
  return variations;
}

// Enhanced endpoint with image generation
app.post('/api/generate-description', upload.single('productImage'), async (req, res) => {
  try {
    const { 
      productName, 
      category, 
      features, 
      targetAudience, 
      tone,
      tier = 'standard',
      keywords = [],
      generateImages = 'true'
    } = req.body;

    let imageAnalysis = null;
    let enhancedFeatures = features;
    let enhancedCategory = category;
    let enhancedProductName = productName;
    let uploadedImageUrl = null;

    // If image was uploaded, analyze it and upload to Cloudinary
    if (req.file) {
      // Upload to Cloudinary with proper naming and alt text
      try {
        const sanitizedName = (productName || 'product').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const altText = `${productName || 'Product'} - ${category || 'General'} category - User uploaded product image`;
        
        const cloudinaryResult = await uploadToCloudinary(
          req.file.path, 
          'product-uploads',
          [sanitizedName, category || 'general', 'user-upload'],
          {
            alt: altText,
            caption: `User uploaded image for ${productName || 'product'}`,
            original_filename: req.file.originalname
          }
        );
        uploadedImageUrl = cloudinaryResult?.url;
        console.log('Image uploaded to Cloudinary:', uploadedImageUrl);
      } catch (uploadError) {
        console.error('Failed to upload to Cloudinary:', uploadError);
      }
      
      imageAnalysis = await analyzeImage(req.file.path);
      
      if (!productName || productName === '') {
        enhancedProductName = imageAnalysis.productType || 'Product';
      }
      if (!category || category === '') {
        enhancedCategory = imageAnalysis.suggestedCategory || 'General';
      }
      if (!features || features === '') {
        enhancedFeatures = imageAnalysis.features.join('\n');
      }
      
      setTimeout(() => {
        fs.unlinkSync(req.file.path);
      }, 5000);
    }

    // Generate AI images if requested
    let generatedImages = [];
    if (generateImages === 'true' || generateImages === true) {
      const imageCount = PRICING_TIERS[tier].imageCount;
      try {
        generatedImages = await generateProductImages(
          enhancedProductName,
          enhancedCategory,
          enhancedFeatures,
          'studio',
          imageCount
        );
      } catch (imgError) {
        console.error('Image generation error:', imgError);
        // Continue without images if generation fails
        generatedImages = [];
      }
    }

    // Generate description variations
    const variationCount = PRICING_TIERS[tier].variationCount;
    
    // Use real OpenAI API if available, otherwise use demo
    let baseDescription = null;
    let usingDemo = false;
    if (openai) {
      try {
        console.log('Attempting to use OpenAI API...');
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert e-commerce copywriter. Create compelling product descriptions that convert."
            },
            {
              role: "user",
              content: `Create a ${tier === 'basic' ? '150' : tier === 'standard' ? '300' : '500+'} word product description for:
Product: ${enhancedProductName}
Category: ${enhancedCategory}
Features: ${enhancedFeatures}
Target Audience: ${targetAudience}
Tone: ${tone}
${imageAnalysis ? `Image Analysis: ${JSON.stringify(imageAnalysis)}` : ''}

Include SEO keywords naturally. Make it compelling and conversion-focused.`
            }
          ],
          temperature: 0.7,
          max_tokens: tier === 'basic' ? 200 : tier === 'standard' ? 400 : 600
        });
        
        baseDescription = completion.choices[0].message.content;
        console.log('OpenAI API successful!');
      } catch (apiError) {
        console.error('OpenAI API error:', apiError.message);
        console.error('Full error object:', apiError);
        console.error('Status:', apiError.response?.status);
        if (apiError.response?.status === 401) {
          console.log('API Key is invalid or expired. Using demo mode...');
        }
        usingDemo = true;
      }
    }
    
    // If no description was generated (either no OpenAI or API failed), use demo
    if (!baseDescription) {
      usingDemo = true;
      baseDescription = generateDemoDescription({
        productName: enhancedProductName,
        category: enhancedCategory,
        features: enhancedFeatures,
        targetAudience,
        tone,
        tier,
        imageAnalysis
      });
    }

    const variations = generateVariations(baseDescription, variationCount, tone);

    res.json({
      success: true,
      description: variations[0],
      variations: variations,
      generatedImages: generatedImages,
      uploadedImageUrl: uploadedImageUrl,
      imageAnalysis: imageAnalysis,
      usingDemo: usingDemo,
      metadata: {
        wordCount: baseDescription.split(' ').length,
        seoScore: 85,
        readabilityScore: 90,
        tier,
        price: PRICING_TIERS[tier].price,
        variationCount: variations.length,
        imageCount: generatedImages.length,
        mode: usingDemo ? 'demo' : 'live'
      }
    });
  } catch (error) {
    console.error('Error generating description:', error);
    console.error('Full error details:', error.response?.data || error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate description',
      details: error.message,
      fullError: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// Bulk CSV upload with image generation
app.post('/api/bulk-csv-upload', csvUpload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const { tier = 'standard', generateImages = 'true' } = req.body;
    const products = [];
    
    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          products.push({
            productName: row.product_name || row.productName || row['Product Name'] || '',
            category: row.category || row.Category || '',
            features: row.features || row.Features || '',
            targetAudience: row.target_audience || row.targetAudience || row['Target Audience'] || '',
            tone: row.tone || row.Tone || 'professional',
            keywords: row.keywords || row.Keywords || ''
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each product
    const results = [];
    const variationCount = PRICING_TIERS[tier].variationCount;
    const imageCount = PRICING_TIERS[tier].imageCount;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (!product.productName) {
        results.push({
          productName: 'Unknown Product',
          status: 'error',
          error: 'Product name is required'
        });
        continue;
      }

      try {
        // Generate images for each product
        let generatedImages = [];
        if (generateImages === 'true') {
          generatedImages = await generateProductImages(
            product.productName,
            product.category,
            product.features,
            'studio',
            Math.min(imageCount, 2) // Limit bulk generation to 2 images per product
          );
        }

        const baseDescription = generateDemoDescription({
          productName: product.productName,
          category: product.category,
          features: product.features,
          targetAudience: product.targetAudience,
          tone: product.tone,
          tier
        });

        const variations = generateVariations(baseDescription, variationCount, product.tone);
        
        results.push({
          productName: product.productName,
          category: product.category,
          description: variations[0],
          variations: variations,
          generatedImages: generatedImages,
          status: 'success',
          seoScore: 85,
          wordCount: baseDescription.split(' ').length
        });
      } catch (error) {
        results.push({
          productName: product.productName,
          status: 'error',
          error: error.message
        });
      }
    }

    // Generate output CSV with image URLs
    const timestamp = Date.now();
    const outputPath = path.join('uploads', `results_${timestamp}.csv`);
    
    const csvWriter = createCsvWriter({
      path: outputPath,
      header: [
        { id: 'productName', title: 'Product Name' },
        { id: 'category', title: 'Category' },
        { id: 'description', title: 'Description' },
        { id: 'variation2', title: 'Variation 2' },
        { id: 'variation3', title: 'Variation 3' },
        { id: 'image1', title: 'Generated Image 1' },
        { id: 'image2', title: 'Generated Image 2' },
        { id: 'seoScore', title: 'SEO Score' },
        { id: 'wordCount', title: 'Word Count' },
        { id: 'status', title: 'Status' }
      ]
    });

    const csvData = results.map(r => ({
      productName: r.productName,
      category: r.category || '',
      description: r.description || r.error || '',
      variation2: r.variations && r.variations[1] ? r.variations[1] : '',
      variation3: r.variations && r.variations[2] ? r.variations[2] : '',
      image1: r.generatedImages && r.generatedImages[0] ? `http://localhost:3000${r.generatedImages[0].url}` : '',
      image2: r.generatedImages && r.generatedImages[1] ? `http://localhost:3000${r.generatedImages[1].url}` : '',
      seoScore: r.seoScore || 0,
      wordCount: r.wordCount || 0,
      status: r.status
    }));

    await csvWriter.writeRecords(csvData);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      processed: products.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      results: results,
      downloadUrl: `/uploads/results_${timestamp}.csv`,
      totalCost: PRICING_TIERS[tier].price * results.filter(r => r.status === 'success').length
    });

  } catch (error) {
    console.error('CSV processing error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process CSV file',
      details: error.message 
    });
  }
});

function generateDemoDescription(data) {
  const { productName, category, features, targetAudience, tone, tier, imageAnalysis } = data;
  
  let description = `**${productName}** - The Perfect Choice for ${targetAudience || 'You'}

Discover the exceptional quality and innovation of our ${productName}, designed specifically for ${category || 'modern needs'}. This remarkable product combines cutting-edge technology with user-friendly design to deliver an unparalleled experience.

**Key Features:**
${features ? features.split('\n').map(f => `• ${f}`).join('\n') : '• Premium quality construction\n• Innovative design\n• Exceptional performance'}`;

  if (imageAnalysis) {
    description += `\n\n**What Makes This Special:**\n`;
    if (imageAnalysis.colors && imageAnalysis.colors.length > 0) {
      description += `Available in ${imageAnalysis.colors.join(', ')}, `;
    }
    if (imageAnalysis.detectedMaterials && imageAnalysis.detectedMaterials.length > 0) {
      description += `crafted from ${imageAnalysis.detectedMaterials.join(' and ')}, `;
    }
    description += `perfect for ${imageAnalysis.suggestedAudience || targetAudience || 'discerning customers'}.`;
  }

  description += `\n\nOur ${productName} stands out in the ${category || 'market'} category with its superior build quality and attention to detail. Whether you're a professional or an enthusiast, this product delivers the performance and reliability you demand.

**Why Choose ${productName}?**
When it comes to ${category || 'quality products'}, we understand that you need more than just basic functionality. That's why our ${productName} is engineered to exceed expectations, offering features that make a real difference in your daily life.

The ${tone === 'luxury' ? 'exquisite craftsmanship' : tone === 'technical' ? 'advanced engineering' : 'thoughtful design'} ensures that every interaction with this product is a pleasure. From the moment you unbox it, you'll appreciate the attention to detail that sets our ${productName} apart from the competition.

**Perfect for ${targetAudience || 'Everyone'}**
We've designed this product with ${targetAudience || 'you'} in mind. Every feature, every detail has been carefully considered to ensure it meets your specific needs and exceeds your expectations.

Don't settle for less when you can have the best. Order your ${productName} today and experience the difference quality makes. With our satisfaction guarantee and exceptional customer support, you can purchase with complete confidence.

**Order Now** and join thousands of satisfied customers who have made ${productName} their trusted choice!`;

  return description;
}

// Generate viral UGC script endpoint
app.post('/api/generate-viral-script', async (req, res) => {
  try {
    const { productName, description, features, targetAudience } = req.body;
    
    // Generate viral UGC script templates
    const scriptTemplates = [
      {
        style: 'Problem-Solution',
        script: `OMG, I can't believe I finally found the solution! 😱 I've been struggling with [problem] for months, and then I discovered ${productName}. ${description.substring(0, 150)}... The results? Absolutely incredible! If you're dealing with the same issue, you NEED to try this. Link in bio! 🔥`
      },
      {
        style: 'Transformation Story',
        script: `Day 1 vs Day 30 using ${productName}! 🤯 I was skeptical at first, but wow... ${description.substring(0, 100)}. Here's what changed: ${features ? features.split('\n')[0] : 'Amazing results'}. My ${targetAudience || 'friends'} can't believe the difference! This is not sponsored, just genuinely obsessed! 💯`
      },
      {
        style: 'Unboxing Excitement',
        script: `It's here! My ${productName} just arrived and I'm SO excited! 📦✨ Let me show you why everyone's talking about this... ${description.substring(0, 120)}. The quality is insane! Stay tuned for my full review, but first impressions? 10/10! 🙌`
      },
      {
        style: 'Expert Review',
        script: `As someone who's tried everything, let me tell you about ${productName}. ${description.substring(0, 150)}... What sets it apart? The attention to detail and quality. If you're serious about [benefit], this is the one. Trust me on this! 💪`
      },
      {
        style: 'FOMO Creator',
        script: `PSA: ${productName} is BACK IN STOCK! 🚨 I know so many of you have been waiting for this... ${description.substring(0, 100)}. Last time it sold out in 2 days! Don't sleep on this - your future self will thank you! 🏃‍♀️💨`
      }
    ];

    res.json({
      success: true,
      scripts: scriptTemplates,
      defaultScript: scriptTemplates[0].script,
      tip: 'Choose a script style that matches your brand voice. These are optimized for viral potential!'
    });
    
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate scripts',
      details: error.message
    });
  }
});

// Video generation endpoint
app.post('/api/generate-video', async (req, res) => {
  try {
    const { 
      script, 
      avatar = 'anna', // Default avatar name
      language = 'en-US',
      speed = '1',
      duration = '60',
      images = [],
      productName,
      productDescription,
      features,
      generateProductShowcase = false // New option to create product showcase
    } = req.body;
    
    // If product showcase is requested, enhance the script
    let finalScript = script || '';
    if (generateProductShowcase && productName) {
      // Create authentic pitch scripts (presenting, not claiming personal use)
      const showcaseIntro = [
        `Check this out - the ${productName} is getting crazy reviews!`,
        `Everyone's talking about the ${productName} - here's what makes it special`,
        `So I've been looking into the ${productName} and the features are insane`,
        `The ${productName} is trending right now, let me show you why`
      ][Math.floor(Math.random() * 4)];
      
      const productHighlight = productDescription ? 
        `${productDescription.substring(0, 200)}` : 
        `This incredible product will transform your experience.`;
      
      const featuresList = features ? 
        features.split('\n').filter(f => f.trim()).slice(0, 3).map(f => `• ${f.trim()}`).join(' ') : 
        '';
      
      const callToAction = [
        `The reviews speak for themselves - link in bio!`,
        `People are saying this is a game-changer`,
        `Honestly, the specs are impressive for the price`,
        `If you're in the market, definitely check this one out`
      ][Math.floor(Math.random() * 4)];
      
      finalScript = `${showcaseIntro} ${productHighlight} ${featuresList ? `Here's what makes it special: ${featuresList}` : ''} ${callToAction}`;
      
      // Store product data for potential video composition
      if (images && images.length > 0) {
        console.log(`Product showcase will feature ${images.length} product images`);
        // Images will be referenced in the video metadata
      }
    }

    // Check if we should use demo mode or real D-ID
    const useDemoMode = false; // Using real D-ID API
    console.log('D-ID API Key status:', D_ID_API_KEY ? 'Found' : 'Not found');
    
    if (useDemoMode || !D_ID_API_KEY) {
      // Return mock video data for demo
      const demoVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // Sample video
      
      // Upload demo video to Cloudinary
      let cloudinaryVideoData = null;
      try {
        cloudinaryVideoData = await uploadVideoToCloudinary(demoVideoUrl, `product-videos-demo/${productName || 'demo'}`);
        console.log('Demo video uploaded to Cloudinary:', cloudinaryVideoData.url);
      } catch (uploadError) {
        console.error('Failed to upload demo video to Cloudinary:', uploadError);
      }
      
      return res.json({
        success: true,
        videoUrl: demoVideoUrl,
        cloudinaryVideoUrl: cloudinaryVideoData?.url || null,
        cloudinaryVideoData: cloudinaryVideoData,
        thumbnailUrl: images && images.length > 0 ? images[0].url : '/generated-images/placeholder.jpg',
        duration: cloudinaryVideoData?.duration || parseInt(duration),
        avatarUsed: avatar,
        language: language,
        speed: speed,
        demo: true,
        message: 'Demo mode: Video generation simulated successfully'
      });
    }

    // D-ID API Integration
    try {
      // Map avatar names to D-ID presenter IDs or image URLs
      const avatarMap = {
        'anna': 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
        'james': 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/james.jpg', 
        'sophia': 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/sophia.jpg',
        'michael': 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/michael.jpg'
      };

      // Get the presenter URL or use default
      const presenterUrl = avatarMap[avatar] || avatarMap['anna'];

      // Map language to voice IDs
      const voiceMap = {
        'en-US': 'en-US-JennyNeural',
        'en-GB': 'en-GB-SoniaNeural',
        'es-ES': 'es-ES-ElviraNeural',
        'fr-FR': 'fr-FR-DeniseNeural',
        'de-DE': 'de-DE-KatjaNeural',
        'it-IT': 'it-IT-ElsaNeural',
        'pt-BR': 'pt-BR-FranciscaNeural',
        'zh-CN': 'zh-CN-XiaoxiaoNeural',
        'ja-JP': 'ja-JP-NanamiNeural'
      };

      const voiceId = voiceMap[language] || voiceMap['en-US'];

      console.log('Creating D-ID video with:', {
        presenter: presenterUrl,
        voice: voiceId,
        scriptLength: finalScript ? finalScript.length : 0
      });

      // Create talk with D-ID API
      const talkResponse = await axios.post(
        `${D_ID_API_URL}/talks`,
        {
          script: {
            type: 'text',
            input: finalScript.substring(0, 1000), // Use finalScript instead of script
            provider: {
              type: 'microsoft',
              voice_id: voiceId
            }
          },
          source_url: presenterUrl,
          config: {
            fluent: true,
            pad_audio: 0.0,
            stitch: true
          }
        },
        {
          headers: {
            'Authorization': `Basic ${D_ID_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      const talkId = talkResponse.data.id;
      console.log('D-ID Talk created with ID:', talkId);

      // Poll for video completion
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max wait

      while (!videoUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const statusResponse = await axios.get(
          `${D_ID_API_URL}/talks/${talkId}`,
          {
            headers: {
              'Authorization': `Basic ${D_ID_API_KEY}`,
              'Accept': 'application/json'
            }
          }
        );

        console.log(`Checking video status (attempt ${attempts + 1}):`, statusResponse.data.status);

        if (statusResponse.data.status === 'done') {
          videoUrl = statusResponse.data.result_url;
          break;
        } else if (statusResponse.data.status === 'error' || statusResponse.data.status === 'rejected') {
          throw new Error(`Video generation failed: ${statusResponse.data.error?.message || 'Unknown error'}`);
        }
        
        attempts++;
      }

      if (!videoUrl) {
        throw new Error('Video generation timed out after 2 minutes');
      }

      console.log('Video generated successfully:', videoUrl);

      // Download video immediately before it expires using node-fetch
      let cloudinaryVideoData = null;
      let localVideoPath = null;
      
      try {
        console.log('Downloading video from D-ID using node-fetch...');
        // Download the video using node-fetch which handles redirects better
        const videoResponse = await fetch(videoUrl);
        
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
        }
        
        const videoBuffer = await videoResponse.buffer();
        
        const sanitizedProductName = (productName || 'video').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const videoFilename = `${sanitizedProductName}_${avatar}_${Date.now()}.mp4`;
        localVideoPath = path.join('generated-videos', videoFilename);
        
        // Save video locally
        fs.writeFileSync(localVideoPath, videoBuffer);
        console.log('Video saved locally:', localVideoPath);
        
        // Create hybrid UGC video if product images are provided
        let hybridVideoPath = null;
        let hybridCloudinaryData = null;
        
        if (generateProductShowcase && images && images.length > 0) {
          try {
            console.log('Creating hybrid UGC video with product images...');
            const hybridFilename = `hybrid_${sanitizedProductName}_${Date.now()}.mp4`;
            hybridVideoPath = path.join('generated-videos', hybridFilename);
            
            // Create hybrid video with split-screen style by default
            const hybridResult = await videoComposer.createHybridUGCVideo({
              avatarVideoPath: localVideoPath,
              productImages: images,
              outputPath: hybridVideoPath,
              style: 'splitScreen', // Can be: splitScreen, pictureInPicture, slideshow
              productName: productName || 'Product',
              duration: parseInt(duration) || 30
            });
            
            console.log('Hybrid video created:', hybridResult);
            
            // Upload hybrid video to Cloudinary
            if (hybridResult.success) {
              hybridCloudinaryData = await uploadVideoToCloudinary(
                hybridVideoPath,
                'hybrid-ugc-videos',
                `hybrid_${sanitizedProductName}_${Date.now()}`
              );
              console.log('Hybrid video uploaded to Cloudinary:', hybridCloudinaryData?.url);
            }
          } catch (hybridError) {
            console.error('Failed to create hybrid video:', hybridError);
          }
        }
        
        // Upload original to Cloudinary from local file
        const publicId = `${sanitizedProductName}_${avatar}_${Date.now()}`;
        cloudinaryVideoData = await uploadVideoToCloudinary(
          localVideoPath, 
          'product-videos',
          publicId
        );
        
        if (cloudinaryVideoData) {
          console.log('Video uploaded to Cloudinary successfully:', cloudinaryVideoData.url);
        } else {
          console.log('Video upload to Cloudinary failed - using local file');
        }
        
        // Keep local file for 24 hours then clean up
        setTimeout(() => {
          if (fs.existsSync(localVideoPath)) {
            fs.unlinkSync(localVideoPath);
            console.log('Cleaned up local video file:', localVideoPath);
          }
        }, 24 * 60 * 60 * 1000); // 24 hours
        
      } catch (uploadError) {
        console.error('Failed to download/upload video:', uploadError.message);
        console.error('Will return D-ID URL only');
      }

      // Return the video URLs
      res.json({
        success: true,
        videoUrl: hybridCloudinaryData?.url || cloudinaryVideoData?.url || (localVideoPath ? `/generated-videos/${path.basename(localVideoPath)}` : videoUrl),
        localVideoUrl: localVideoPath ? `/generated-videos/${path.basename(localVideoPath)}` : null,
        cloudinaryVideoUrl: cloudinaryVideoData?.url || null,
        cloudinaryVideoData: cloudinaryVideoData,
        hybridVideoUrl: hybridCloudinaryData?.url || (hybridVideoPath ? `/generated-videos/${path.basename(hybridVideoPath)}` : null),
        hybridCloudinaryData: hybridCloudinaryData,
        d_id_url: videoUrl, // Original D-ID URL for reference
        thumbnailUrl: images && images.length > 0 ? images[0].url : presenterUrl,
        productImages: images || [], // Include product images for reference
        isProductShowcase: generateProductShowcase || false,
        showcaseScript: generateProductShowcase ? finalScript : null,
        duration: cloudinaryVideoData?.duration || parseInt(duration),
        avatarUsed: avatar,
        language: language,
        voiceUsed: voiceId,
        talkId: talkId,
        demo: false,
        message: generateProductShowcase && hybridCloudinaryData ? 
          '🎬 Hybrid UGC video created! Avatar + product images combined for authentic product demonstration.' :
          generateProductShowcase ? 
          'Product showcase video generated successfully! The avatar will present your product enthusiastically.' : 
          'Video generated successfully with D-ID and stored in Cloudinary'
      });

    } catch (didError) {
      console.error('D-ID API Error Details:');
      console.error('Status:', didError.response?.status);
      console.error('Data:', didError.response?.data);
      console.error('Message:', didError.message);
      console.error('Full error:', JSON.stringify(didError.response?.data || didError.message, null, 2));
      
      // Fallback to demo mode if D-ID fails
      const demoVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
      return res.json({
        success: true,
        videoUrl: demoVideoUrl,
        thumbnailUrl: images && images.length > 0 ? images[0].url : '/generated-images/placeholder.jpg',
        duration: parseInt(duration),
        avatarUsed: avatar,
        language: language,
        speed: speed,
        demo: true,
        message: 'D-ID unavailable, using demo video',
        error: didError.response?.data?.details || didError.message,
        debugInfo: {
          status: didError.response?.status,
          errorData: didError.response?.data
        }
      });
    }

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate video',
      details: error.message
    });
  }
});

// D-ID Webhook endpoint to receive video generation callbacks
app.post('/api/webhook/d-id', async (req, res) => {
  try {
    const { id, status, result_url, error } = req.body;
    
    console.log('D-ID Webhook received:', {
      id: id,
      status: status,
      result_url: result_url,
      error: error
    });
    
    // Handle successful video generation
    if (status === 'done' && result_url) {
      console.log('D-ID video ready:', result_url);
      
      // You could store this in a database or cache
      // For now, just log it
      
      // Optionally trigger Cloudinary upload here
      // This would be better than polling
    }
    
    // Handle errors
    if (status === 'error' || status === 'rejected') {
      console.error('D-ID video generation failed:', error);
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(200).json({ received: true, error: error.message });
  }
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.json({
        clientSecret: 'demo_secret_' + Date.now(),
        amount: PRICING_TIERS[req.body.tier || 'standard'].price,
        demo: true
      });
    }
    const { tier, quantity = 1 } = req.body;
    const amount = PRICING_TIERS[tier].price * quantity * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { tier, quantity }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

function calculateSEOScore(text, keywords) {
  let score = 60;
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      score += 10;
    }
  });
  
  if (text.length > 150) score += 10;
  if (text.includes('•') || text.includes('-')) score += 10;
  
  return Math.min(100, score);
}

function calculateReadabilityScore(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/);
  const avgWordsPerSentence = words.length / sentences.length;
  
  if (avgWordsPerSentence < 20) return 90;
  if (avgWordsPerSentence < 25) return 75;
  return 60;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Product Description Generator with AI Image Generation`);
  console.log(`📍 Running on port ${PORT}`);
  console.log(`✨ Features:`);
  console.log(`   - Multiple description variations`);
  console.log(`   - AI image generation (DALL-E 3 / Mock)`);
  console.log(`   - Image analysis with Google Gemini`);
  console.log(`   - CSV bulk upload with batch image generation`);
  console.log(`   - Multiple image styles per product`);
});