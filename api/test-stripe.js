const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test if Stripe is configured
    const hasKey = !!process.env.STRIPE_SECRET_KEY;
    const keyPrefix = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'not set';
    
    // Test configuration
    const config = {
      stripeKeyConfigured: hasKey,
      keyPrefix: keyPrefix,
      keyType: keyPrefix.startsWith('sk_live') ? 'live' : keyPrefix.startsWith('sk_test') ? 'test' : 'invalid',
      singlePriceId: process.env.STRIPE_PRICE_VIDEO_SINGLE || 'price_1QfxqBRrVb92Q7hgKmQNqFkH',
      triplePriceId: process.env.STRIPE_PRICE_VIDEO_TRIPLE || 'price_1QfxqwRrVb92Q7hgXGa9yYMT'
    };

    // Try to retrieve the prices to verify they exist
    if (hasKey) {
      try {
        const singlePrice = await stripe.prices.retrieve(config.singlePriceId);
        const triplePrice = await stripe.prices.retrieve(config.triplePriceId);
        
        config.prices = {
          single: {
            id: singlePrice.id,
            amount: singlePrice.unit_amount / 100,
            currency: singlePrice.currency,
            active: singlePrice.active
          },
          triple: {
            id: triplePrice.id,
            amount: triplePrice.unit_amount / 100,
            currency: triplePrice.currency,
            active: triplePrice.active
          }
        };
        config.pricesValid = true;
      } catch (priceError) {
        config.priceError = priceError.message;
        config.pricesValid = false;
      }
    }

    res.status(200).json({
      status: 'Stripe configuration test',
      config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Stripe test failed',
      message: error.message,
      type: error.type
    });
  }
};