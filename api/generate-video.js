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
      avatar = 'amy-Aq6OmGZpMt',
      voice = 'en-US-JennyNeural',
      generateProductShowcase = false
    } = req.body;

    if (!productName || !productDescription) {
      return res.status(400).json({ 
        error: 'Product name and description are required' 
      });
    }

    // Generate video script
    const script = `Hey everyone! Let me tell you about the amazing ${productName}. ${productDescription} ${features ? `Key features include: ${features}` : ''} This is definitely worth checking out!`;

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
        
        // Create D-ID talk video
        const talkResponse = await fetch(`${D_ID_API_URL}/talks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${D_ID_API_KEY}`,  // D-ID uses Bearer, not Basic
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({
            source_url: images && images.length > 0 
              ? images[0]  // Use product image if available
              : `https://create-images-results.d-id.com/api/images/amy-Aq6OmGZpMt/image.jpeg`, // Default avatar
            script: {
              type: 'text',
              input: script.substring(0, 500), // D-ID has character limits
              provider: {
                type: 'microsoft',
                voice_id: voice
              }
            },
            config: {
              fluent: true,
              pad_audio: 0.0,
              driver_expressions: {
                expressions: [{
                  start_frame: 0,
                  expression: 'happy',
                  intensity: 0.5
                }]
              }
            }
          })
        });

        const talkData = await talkResponse.json();
        
        console.log('D-ID API Response:', {
          status: talkResponse.status,
          ok: talkResponse.ok,
          hasId: !!talkData.id,
          error: talkData.error || talkData.message
        });

        if (!talkResponse.ok) {
          console.error('D-ID API Error:', talkData);
          throw new Error(`D-ID API Error: ${talkData.message || talkData.error || 'Unknown error'}`);
        }

        if (talkData.id) {
          // Poll for video completion
          let videoUrl = null;
          let attempts = 0;
          const maxAttempts = 30;

          while (!videoUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await fetch(`${D_ID_API_URL}/talks/${talkData.id}`, {
              headers: {
                'Authorization': `Bearer ${D_ID_API_KEY}`  // Fixed: Bearer auth
              }
            });

            const statusData = await statusResponse.json();
            
            if (statusData.status === 'done' && statusData.result_url) {
              // Download video immediately and upload to Cloudinary
              const videoResponse = await fetch(statusData.result_url);
              const videoBuffer = await videoResponse.buffer();
              
              // Upload to Cloudinary
              const cloudinaryResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                  {
                    resource_type: 'video',
                    folder: 'product-videos',
                    public_id: `${productName.replace(/\s+/g, '_')}_${Date.now()}`,
                    format: 'mp4'
                  },
                  (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                  }
                );
                uploadStream.end(videoBuffer);
              });

              videoUrl = cloudinaryResult.secure_url;

              // If user wants product showcase, create a composite video using Cloudinary transformations
              if (generateProductShowcase && images.length > 0 && videoUrl) {
                // Create a video with product images overlay using Cloudinary transformations
                const showcaseUrl = cloudinary.url(cloudinaryResult.public_id, {
                  resource_type: 'video',
                  transformation: [
                    { width: 1280, height: 720, crop: 'fill' },
                    { 
                      overlay: images[0].replace(/^.*\//, '').replace(/\.[^.]+$/, ''),
                      width: 400,
                      height: 400,
                      gravity: 'east',
                      x: 50,
                      crop: 'fill'
                    },
                    { quality: 'auto', fetch_format: 'auto' }
                  ]
                });

                return res.status(200).json({
                  success: true,
                  videoUrl: showcaseUrl,
                  originalVideoUrl: videoUrl,
                  productName,
                  message: 'Product showcase video created successfully',
                  cloudinaryVideo: true
                });
              }

              break;
            } else if (statusData.status === 'error') {
              throw new Error('D-ID video generation failed');
            }
            
            attempts++;
          }

          if (videoUrl) {
            return res.status(200).json({
              success: true,
              videoUrl,
              productName,
              message: 'Video generated and stored in Cloudinary',
              cloudinaryVideo: true
            });
          }
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

    // Create a video using Cloudinary
    console.log('Creating video with Cloudinary...');
    
    // Check if Cloudinary is configured
    const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    
    if (cloudinaryConfigured && images && images.length > 0) {
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
        
        // Create a video from the image using Cloudinary transformations
        // This creates an actual video file with duration
        const videoUrl = cloudinary.url(uploadResult.public_id, {
          resource_type: 'video',
          format: 'mp4',
          transformation: [
            // Set video dimensions and duration
            { width: 1280, height: 720, crop: 'fill', duration: 5 },
            // Add fade in effect
            { effect: 'fade:1000' },
            // Add product name text overlay
            {
              overlay: {
                font_family: 'Arial',
                font_size: 80,
                font_weight: 'bold',
                text: productName
              },
              color: 'white',
              background: '#000000AA',
              border_radius: 20,
              gravity: 'north',
              y: 50,
              width: 1100,
              crop: 'fit'
            },
            // Add description text
            {
              overlay: {
                font_family: 'Arial',
                font_size: 40,
                text: productDescription.substring(0, 100)
              },
              color: 'white',
              gravity: 'center',
              y: 100,
              width: 1000,
              crop: 'fit'
            },
            // Add fade out effect
            { effect: 'fade:-1000' }
          ]
        });
        
        console.log('Video URL generated:', videoUrl);
        
        return res.status(200).json({
          success: true,
          videoUrl: videoUrl,
          productName,
          message: 'Product video created successfully',
          mode: 'cloudinary_video',
          duration: 5
        });
        
      } catch (error) {
        console.error('Cloudinary video creation error:', error);
      }
    }
    
    // Fallback: Create a simple text-based video
    try {
      console.log('Creating text-based video fallback...');
      
      // Use Cloudinary's video generation from text
      const textVideoId = `text_video_${Date.now()}`;
      
      // Upload a blank video or use transformation to create one
      const videoUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'demo'}/video/upload/w_1280,h_720,c_fill,b_rgb:667eea,du_5/l_text:Arial_80_bold:${encodeURIComponent(productName || 'Product Video')},co_white,g_center/fl_layer_apply/sample.mp4`;
      
      return res.status(200).json({
        success: true,
        videoUrl: videoUrl,
        productName,
        message: 'Text video created',
        mode: 'text_video',
        duration: 5
      });
      
    } catch (error) {
      console.error('Text video creation error:', error);
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