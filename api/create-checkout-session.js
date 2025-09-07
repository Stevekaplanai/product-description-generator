const stripeConfig = require('./config/stripe');
const stripe = require('stripe')(stripeConfig.secretKey, stripeConfig.options);

module.exports = async (req, res) => {
  // Enable CORS with proper headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is properly configured
  if (!stripeConfig.isConfigured()) {
    console.error('Stripe not configured properly:', stripeConfig.getStatus());
    return res.status(500).json({ 
      error: 'Payment system not configured',
      message: 'The payment system is not properly configured. Please contact support at hello@gtmvp.com'
    });
  }

  try {
    const { priceId, successUrl, cancelUrl, customerEmail, tierName } = req.body;
    
    console.log('Creating checkout session for:', { priceId, tierName });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || stripeConfig.urls.successUrl,
      cancel_url: cancelUrl || stripeConfig.urls.cancelUrl,
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        productName: 'Product Description Generator Pro'
      }
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
};