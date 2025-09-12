module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Return configuration (only non-sensitive data)
    const config = {
        posthogKey: process.env.POSTHOG_API_KEY || null,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
        features: {
            vertexAI: !!process.env.GOOGLE_CLOUD_PROJECT,
            dalle: !!process.env.OPENAI_API_KEY,
            gemini: !!process.env.GEMINI_API_KEY,
            cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
            did: !!process.env.D_ID_API_KEY
        },
        limits: {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxBulkItems: 1000,
            maxDescriptionLength: 5000
        }
    };
    
    return res.status(200).json(config);
};