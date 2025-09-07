// Debug endpoint to check API configuration
module.exports = (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  
  res.status(200).json({
    environment: {
      node_version: process.version,
      vercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION || 'unknown'
    },
    apis: {
      gemini: {
        configured: !!geminiKey,
        key_env: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_GEMINI_API_KEY ? 'GOOGLE_GEMINI_API_KEY' : 'none',
        key_length: geminiKey ? geminiKey.length : 0
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        key_length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
      }
    }
  });
};