// Public configuration endpoint
// Returns non-sensitive configuration that frontend needs

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Cache for 1 hour to reduce API calls
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return public configuration
  res.status(200).json({
    // PostHog analytics key (safe to expose - it's meant to be public)
    posthogKey: process.env.POSTHOG_API_KEY || null,
    
    // Google OAuth Client ID (safe to expose - it's meant to be public)
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    
    // Stripe Publishable Key (safe to expose)
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    
    // Feature flags
    features: {
      videoUpsell: true,
      bulkUpload: true,
      imageAnalysis: true,
      googleAuth: true,
      guestMode: true
    },
    
    // Public pricing info
    pricing: {
      singleVideo: 29,
      tripleVideo: 69
    },
    
    // Environment
    environment: process.env.NODE_ENV || 'production'
  });
};