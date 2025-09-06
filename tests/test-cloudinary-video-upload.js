const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadVideoToCloudinary() {
  try {
    console.log('Uploading video to Cloudinary...');
    
    const result = await cloudinary.uploader.upload(
      'C:\\Claude Code\\product-description-generator\\generated-videos\\test-video.mp4',
      {
        resource_type: 'video',
        folder: 'product-videos',
        public_id: 'test-d-id-video-' + Date.now(),
        chunk_size: 6000000,
        timeout: 120000
      }
    );
    
    console.log('✅ Video uploaded successfully!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('Duration:', result.duration, 'seconds');
    console.log('Format:', result.format);
    console.log('Size:', result.bytes, 'bytes');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('Full error:', error);
  }
}

uploadVideoToCloudinary();