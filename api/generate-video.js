const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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
            'Authorization': `Basic ${D_ID_API_KEY}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({
            source_url: `https://create-images-results.d-id.com/api/images/${avatar}/image.jpeg`,
            script: {
              type: 'text',
              input: script,
              provider: {
                type: 'microsoft',
                voice_id: voice
              }
            },
            config: {
              fluent: true,
              pad_audio: 0.0
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
                'Authorization': `Basic ${D_ID_API_KEY}`
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

    // Fallback: Create a video using Cloudinary with images or a placeholder
    try {
      console.log('Attempting Cloudinary video generation...');
      
      // If we have images, create a video slideshow
      if (images && images.length > 0) {
        console.log(`Creating slideshow with ${images.length} images`);
        
        // Upload the first image to Cloudinary to use as video base
        const firstImage = images[0];
        let videoPublicId;
        
        if (firstImage && firstImage.startsWith('http')) {
          const uploadResult = await cloudinary.uploader.upload(firstImage, {
            folder: 'product-videos',
            resource_type: 'image',
            public_id: `${productName.replace(/\s+/g, '_')}_${Date.now()}`
          });
          videoPublicId = uploadResult.public_id;
        }
        
        if (videoPublicId) {
          // Create a video from the image with text overlay
          const videoUrl = cloudinary.url(videoPublicId, {
            resource_type: 'video',
            transformation: [
              { width: 1280, height: 720, crop: 'fill' },
              { duration: 5 },
              { 
                overlay: {
                  text: productName,
                  font_family: 'Arial',
                  font_size: 80,
                  font_weight: 'bold',
                  text_color: 'white',
                  background: '#000000AA',
                  border_radius: 10
                },
                gravity: 'center',
                y: -200
              },
              {
                overlay: {
                  text: productDescription.substring(0, 100) + '...',
                  font_family: 'Arial', 
                  font_size: 40,
                  text_color: 'white',
                  width: 1000,
                  crop: 'fit'
                },
                gravity: 'center',
                y: 100
              },
              { format: 'mp4' }
            ]
          });
          
          return res.status(200).json({
            success: true,
            videoUrl: videoUrl,
            productName,
            message: 'Product video created using Cloudinary',
            cloudinaryMode: true
          });
        }
      }
      
      // If no images, create a text-based video using Cloudinary
      console.log('Creating text-based video...');
      const textVideoUrl = cloudinary.url('sample', {
        resource_type: 'video',
        transformation: [
          { width: 1280, height: 720, background: 'black', duration: 5 },
          {
            overlay: {
              text: productName,
              font_family: 'Arial',
              font_size: 100,
              font_weight: 'bold',
              text_color: 'white'
            },
            gravity: 'center',
            y: -100
          },
          {
            overlay: {
              text: 'AI Generated Video',
              font_family: 'Arial',
              font_size: 60,
              text_color: '#667eea'
            },
            gravity: 'center',
            y: 50
          },
          { format: 'mp4' }
        ]
      });
      
      return res.status(200).json({
        success: true,
        videoUrl: textVideoUrl,
        productName,
        message: 'Text video created using Cloudinary',
        textMode: true
      });
      
    } catch (error) {
      console.error('Cloudinary video generation error:', error);
    }

    // If all else fails, return demo mode
    res.status(200).json({
      success: true,
      message: 'Video generation requires D-ID API key and/or product images',
      demoMode: true,
      productName,
      script,
      videoUrl: null,
      note: 'Add D-ID API key in Vercel environment variables for full video generation'
    });

  } catch (error) {
    console.error('Video API Error:', error);
    res.status(500).json({ 
      error: 'Video generation error', 
      message: error.message 
    });
  }
};