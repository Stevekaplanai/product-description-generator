const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const results = {
    timestamp: new Date().toISOString(),
    apis: {}
  };

  // Test Cloudinary
  results.apis.cloudinary = {
    configured: false,
    details: {}
  };

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    results.apis.cloudinary.configured = true;
    results.apis.cloudinary.details = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
    };

    // Try to ping Cloudinary
    try {
      const testUpload = await cloudinary.uploader.upload(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        { 
          public_id: 'test_' + Date.now(),
          folder: 'test',
          tags: ['test']
        }
      );
      
      results.apis.cloudinary.testUpload = {
        success: true,
        url: testUpload.secure_url,
        publicId: testUpload.public_id
      };

      // Try to delete the test upload
      await cloudinary.uploader.destroy(testUpload.public_id);
      results.apis.cloudinary.testCleanup = true;

    } catch (error) {
      results.apis.cloudinary.testUpload = {
        success: false,
        error: error.message
      };
    }
  } else {
    results.apis.cloudinary.details.missing = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) results.apis.cloudinary.details.missing.push('CLOUDINARY_CLOUD_NAME');
    if (!process.env.CLOUDINARY_API_KEY) results.apis.cloudinary.details.missing.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) results.apis.cloudinary.details.missing.push('CLOUDINARY_API_SECRET');
  }

  // Test D-ID
  results.apis.did = {
    configured: false,
    details: {}
  };

  if (process.env.D_ID_API_KEY) {
    results.apis.did.configured = true;
    results.apis.did.details = {
      keyLength: process.env.D_ID_API_KEY.length,
      keyPrefix: process.env.D_ID_API_KEY.substring(0, 10) + '...'
    };

    // Try to ping D-ID API
    try {
      const response = await fetch('https://api.d-id.com/talks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.D_ID_API_KEY}`,
          'accept': 'application/json'
        }
      });

      results.apis.did.testConnection = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };

      if (!response.ok) {
        const errorData = await response.json();
        results.apis.did.testConnection.error = errorData;
      }

    } catch (error) {
      results.apis.did.testConnection = {
        success: false,
        error: error.message
      };
    }
  } else {
    results.apis.did.details.missing = 'D_ID_API_KEY';
  }

  // Test creating a simple video with Cloudinary
  if (results.apis.cloudinary.configured) {
    try {
      // Create a test video URL
      const testVideoUrl = cloudinary.url('sample', {
        resource_type: 'video',
        format: 'mp4',
        transformation: [
          { width: 640, height: 360, crop: 'fill', duration: 3 },
          { 
            overlay: {
              font_family: 'Arial',
              font_size: 40,
              text: 'API Test Video'
            },
            color: 'white',
            gravity: 'center'
          }
        ]
      });

      results.testVideo = {
        url: testVideoUrl,
        note: 'This URL should work if Cloudinary is properly configured'
      };

    } catch (error) {
      results.testVideo = {
        error: error.message
      };
    }
  }

  // Summary
  results.summary = {
    cloudinary: results.apis.cloudinary.configured && results.apis.cloudinary.testUpload?.success ? 'Working' : 'Not Working',
    did: results.apis.did.configured && results.apis.did.testConnection?.success ? 'Working' : 'Not Working',
    readyForVideoGeneration: results.apis.cloudinary.configured
  };

  res.status(200).json(results);
};