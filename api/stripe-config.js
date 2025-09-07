const stripeConfig = require('./config/stripe');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return public Stripe configuration
  res.status(200).json({
    publishableKey: stripeConfig.publishableKey,
    mode: stripeConfig.mode,
    prices: stripeConfig.prices,
    plans: stripeConfig.plans,
    isConfigured: stripeConfig.isConfigured()
  });
};