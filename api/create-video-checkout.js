const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Video price IDs - use environment variables (they override the defaults)
const VIDEO_PRICES = {
  single: process.env.STRIPE_PRICE_VIDEO_SINGLE || 'price_1S4X3ERrVb92Q7hgEGJQNVDh', // $29 single video
  triple: process.env.STRIPE_PRICE_VIDEO_TRIPLE || 'price_1S4X4BRrVb92Q7hg460AjSu4'  // $69 triple pack
};

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

  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ 
      error: 'Payment system not configured',
      message: 'Stripe API key is missing'
    });
  }

  try {
    const { videoType, customerEmail, productName, productDescription } = req.body;
    
    // Determine price based on video type
    const priceId = videoType === 'triple' ? VIDEO_PRICES.triple : VIDEO_PRICES.single;
    const packageName = videoType === 'triple' ? 'Triple Video Pack' : 'Single AI Video';
    
    console.log('Creating video checkout for:', { videoType, priceId, packageName });

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment, not subscription
      success_url: `${req.headers.origin || 'https://productdescriptions.io'}/video-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://productdescriptions.io'}/app.html`,
      customer_email: customerEmail,
      metadata: {
        videoType: videoType,
        packageName: packageName,
        productName: productName || 'Product',
        productDescription: productDescription || ''
      }
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
      raw: error.raw
    });
    
    // Check for specific Stripe errors
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Authentication with payment provider failed',
        message: 'Invalid API key configuration'
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid request to payment provider',
        message: error.message,
        details: 'Check if price IDs are correct'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message,
      type: error.type || 'Unknown error'
    });
  }
};