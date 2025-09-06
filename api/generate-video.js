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
    const { productName, productDescription } = req.body;

    // Since FFmpeg doesn't work on Vercel, return a demo response
    res.status(200).json({
      success: true,
      message: 'Video generation is not available on Vercel deployment. Please use Railway or Render for full video features.',
      demoMode: true,
      productName,
      videoUrl: null,
      avatarUsed: 'sophia',
      voiceUsed: 'en-US-Neural2-F',
      note: 'Video generation requires FFmpeg which is not supported on Vercel serverless functions.'
    });

  } catch (error) {
    console.error('Video API Error:', error);
    res.status(500).json({ 
      error: 'Video generation not available on Vercel', 
      message: error.message 
    });
  }
};