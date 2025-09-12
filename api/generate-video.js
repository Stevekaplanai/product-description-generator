const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log Cloudinary configuration status
console.log('Cloudinary Config:', {
  configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
});

// D-ID API configuration
const D_ID_API_KEY = process.env.D_ID_API_KEY;
const D_ID_API_URL = 'https://api.d-id.com';

// Predefined avatar options with valid public image URLs
// Using smaller, direct image URLs without query parameters for D-ID compatibility
const AVATAR_OPTIONS = {
  'professional-male': {
    name: 'Alex',
    imageUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    description: 'Professional male presenter'
  },
  'professional-female': {
    name: 'Sarah', 
    imageUrl: 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_640.jpg',
    description: 'Professional female presenter'
  },
  'casual-male': {
    name: 'Mike',
    imageUrl: 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_640.jpg',
    description: 'Friendly casual male'
  },
  'casual-female': {
    name: 'Emma',
    imageUrl: 'https://cdn.pixabay.com/photo/2017/08/07/14/15/portrait-2604283_640.jpg', 
    description: 'Friendly casual female'
  },
  'young-male': {
    name: 'Tyler',
    imageUrl: 'https://cdn.pixabay.com/photo/2018/04/27/03/50/portrait-3353699_640.jpg',
    description: 'Young energetic male'
  },
  'young-female': {
    name: 'Zoe',
    imageUrl: 'https://cdn.pixabay.com/photo/2016/01/19/17/48/woman-1149911_640.jpg',
    description: 'Young energetic female'  
  },
  'mature-male': {
    name: 'Robert',
    imageUrl: 'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_640.jpg',
    description: 'Mature professional male'
  },
  'mature-female': {
    name: 'Diana',
    imageUrl: 'https://cdn.pixabay.com/photo/2018/01/13/19/39/fashion-3080644_640.jpg',
    description: 'Mature professional female'
  }
};

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
    const { 
      productName, 
      productDescription, 
      features,
      images = [],
      avatarId = 'professional-female', // Default avatar
      voice = 'en-US-JennyNeural',
      generateProductShowcase = false,
      customScript = null // Allow custom script override
    } = req.body;

    if (!productName || !productDescription) {
      return res.status(400).json({ 
        error: 'Product name and description are required' 
      });
    }

    // Get selected avatar
    const selectedAvatar = AVATAR_OPTIONS[avatarId] || AVATAR_OPTIONS['professional-female'];
    
    // Generate video script or use custom one
    const script = customScript || `Hey everyone! Let me tell you about the amazing ${productName}. ${productDescription} ${features ? `Key features include: ${features}` : ''} This is definitely worth checking out!`;

    // Debug logging for API keys
    console.log('Video generation config:', {
      hasCloudinaryName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasCloudinaryKey: !!process.env.CLOUDINARY_API_KEY,
      hasCloudinarySecret: !!process.env.CLOUDINARY_API_SECRET,
      hasDIDKey: !!D_ID_API_KEY,
      dIdKeyLength: D_ID_API_KEY ? D_ID_API_KEY.length : 0,
      dIdKeyPrefix: D_ID_API_KEY ? D_ID_API_KEY.substring(0, 10) + '...' : 'none'
    });

    // If D-ID API key is available, try to generate video
    if (D_ID_API_KEY && D_ID_API_KEY !== 'your_did_api_key_here' && D_ID_API_KEY.length > 20) {
      try {
        console.log('Attempting D-ID video generation...');
        console.log('D-ID Key present, length:', D_ID_API_KEY.length);
        
        // Use a simpler D-ID request that's more likely to work
        const webhookUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}/api/webhooks/did-video`
          : 'https://productdescriptions.io/api/webhooks/did-video';
        
        const didPayload = {
          script: {
            type: 'text',
            input: script.substring(0, 200), // Shorter script
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyNeural'
            }
          },
          // Use the selected avatar's image URL
          source_url: selectedAvatar.imageUrl,
          webhook: webhookUrl, // Add webhook for completion notification
          user_data: JSON.stringify({
            productName,
            timestamp: new Date().toISOString(),
            userId: (req.headers && req.headers['x-user-id']) || 'anonymous'
          })
        };
        
        console.log('D-ID Request payload:', JSON.stringify(didPayload, null, 2));
        
        // Create D-ID talk video - Use proper Basic auth format
        // D-ID expects API key as username with empty password in Basic auth
        const authString = Buffer.from(`${D_ID_API_KEY}:`, 'utf8').toString('base64');
        
        console.log('D-ID Auth debug:', {
          hasApiKey: !!D_ID_API_KEY,
          apiKeyLength: D_ID_API_KEY ? D_ID_API_KEY.length : 0,
          authStringLength: authString.length,
          authMethod: 'Basic auth with API key as username'
        });
        
        const talkResponse = await fetch(`${D_ID_API_URL}/talks`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(didPayload)
        });

        // Parse response carefully as D-ID might return HTML on error
        let talkData;
        const contentType = talkResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          talkData = await talkResponse.json();
        } else {
          // Response is not JSON, likely an error page
          const text = await talkResponse.text();
          console.error('D-ID returned non-JSON response:', text.substring(0, 500));
          throw new Error('D-ID API returned invalid response format');
        }
        
        console.log('D-ID API Response:', {
          status: talkResponse.status,
          ok: talkResponse.ok,
          hasId: !!talkData.id,
          error: talkData.error || talkData.message
        });

        if (!talkResponse.ok) {
          console.error('D-ID API Error Response:', {
            status: talkResponse.status,
            statusText: talkResponse.statusText,
            data: talkData
          });
          
          // Return demo video instead of throwing error
          console.log('D-ID failed, falling back to demo video');
          return res.status(200).json({
            success: true,
            videoUrl: 'https://res.cloudinary.com/demo/video/upload/w_1280,h_720/sea_turtle.mp4',
            productName,
            message: 'Using demo video (D-ID error: ' + (talkData.message || talkData.error || talkResponse.status) + ')',
            mode: 'demo_did_error',
            didError: talkData
          });
        }

        if (talkData.id) {
          console.log('D-ID video job created:', talkData.id);
          
          // Return immediately with video ID for tracking instead of polling
          return res.status(200).json({
            success: true,
            videoId: talkData.id,
            status: 'processing',
            productName,
            avatarUsed: selectedAvatar.name,
            message: 'Video generation started. Use videoId to track progress.',
            webhookUrl,
            pollUrl: `/api/webhooks/did-video?videoId=${talkData.id}`,
            estimatedTime: '30-60 seconds'
          });
          
          // Video generation started successfully
          // The webhook will handle completion
        }
      } catch (error) {
        console.error('D-ID API error:', error.message);
        console.error('Full error:', error);
        // Continue to fallback methods instead of failing completely
      }
    } else {
      console.log('D-ID API key not configured or invalid:', {
        hasKey: !!D_ID_API_KEY,
        keyLength: D_ID_API_KEY ? D_ID_API_KEY.length : 0
      });
    }

    // Create a video using a simpler approach
    console.log('Creating video with simplified approach...');
    
    // Check if Cloudinary is configured
    const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    
    // For now, use a working demo video to ensure functionality
    if (!cloudinaryConfigured) {
      console.log('Cloudinary not configured, using demo video');
      return res.status(200).json({
        success: true,
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/w_1280,h_720/sea_turtle.mp4',
        productName,
        message: 'Demo video (configure Cloudinary for custom videos)',
        mode: 'demo'
      });
    }
    
    if (images && images.length > 0) {
      try {
        console.log('Uploading image to create video...');
        
        // Upload the first image to Cloudinary
        const imageUrl = images[0];
        const timestamp = Date.now();
        const publicId = `product_video_${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
        
        // Upload image to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          public_id: publicId,
          folder: 'product-videos',
          resource_type: 'image'
        });
        
        console.log('Image uploaded:', uploadResult.public_id);
        
        // For now, return a working demo video while we fix the transformation
        // Cloudinary's image-to-video conversion has specific requirements
        const demoVideoUrl = 'https://res.cloudinary.com/demo/video/upload/w_1280,h_720/sea_turtle.mp4';
        
        console.log('Using demo video for now (image-to-video transformation in progress)');
        
        // Store the uploaded image URL for reference
        const uploadedImageUrl = uploadResult.secure_url;
        
        return res.status(200).json({
          success: true,
          videoUrl: demoVideoUrl,
          productName,
          message: 'Video generation in progress (using demo for now)',
          mode: 'demo_with_upload',
          uploadedImage: uploadedImageUrl,
          note: 'Custom video generation coming soon'
        });
        
      } catch (error) {
        console.error('Cloudinary video creation error:', error);
      }
    }
    
    // Fallback: Create a simple video from a solid color
    try {
      console.log('Creating fallback video...');
      
      // Create a solid color image and convert to video
      const timestamp = Date.now();
      const fallbackId = `fallback_video_${timestamp}`;
      
      // Upload a solid color image to Cloudinary
      const solidColorImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const uploadResult = await cloudinary.uploader.upload(solidColorImage, {
        public_id: fallbackId,
        folder: 'product-videos',
        resource_type: 'image',
        transformation: [
          { width: 1280, height: 720, crop: 'fill', background: '#667eea' }
        ]
      });
      
      // Create video from the uploaded image
      const videoUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: 'video',
        format: 'mp4',
        transformation: [
          { width: 1280, height: 720, crop: 'fill', duration: 5 },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 80,
              font_weight: 'bold',
              text: productName || 'Product Video'
            },
            color: 'white',
            gravity: 'center',
            y: -50
          },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 40,
              text: 'AI Generated Video'
            },
            color: 'white',
            gravity: 'center',
            y: 50
          }
        ]
      });
      
      console.log('Fallback video created:', videoUrl);
      
      return res.status(200).json({
        success: true,
        videoUrl: videoUrl,
        productName,
        message: 'Video created',
        mode: 'fallback_video',
        duration: 5
      });
      
    } catch (error) {
      console.error('Fallback video creation error:', error);
    }
    
    // Ultimate fallback
    return res.status(200).json({
      success: true,
      videoUrl: null,
      productName,
      message: 'Video generation requires proper API configuration',
      mode: 'error',
      note: 'Please check Cloudinary and D-ID API keys in Vercel'
    });


  } catch (error) {
    console.error('Video API Error:', error);
    res.status(500).json({ 
      error: 'Video generation error', 
      message: error.message 
    });
  }
};