// Health check endpoint with API status
module.exports = (req, res) => {
  // Check which APIs are configured
  const apis = {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY),
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
    did: !!process.env.D_ID_API_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY
  };
  
  // Get key prefixes for debugging (first 10 chars only for security)
  const keyInfo = {
    gemini_key: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY set' : 'not set',
    google_gemini_key: process.env.GOOGLE_GEMINI_API_KEY ? 'GOOGLE_GEMINI_API_KEY set' : 'not set'
  };
  
  res.status(200).json({ 
    status: 'healthy', 
    message: 'API is running on Vercel',
    apis: apis,
    keyInfo: keyInfo,
    timestamp: new Date().toISOString()
  });
};