const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const { products, customerEmail } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ 
        error: 'Invalid products data',
        message: 'Please provide an array of products'
      });
    }

    const videoCount = Math.min(products.length, 10); // Max 10 videos per bundle
    
    // Use the environment variable for bulk video price
    const BULK_VIDEO_PRICE = process.env.STRIPE_PRICE_BULK_VIDEO || 'price_1S4akoRrVb92Q7hgOLGjeHiH';

    console.log('Creating bulk video checkout for:', { 
      videoCount, 
      products: products.length,
      email: customerEmail,
      priceId: BULK_VIDEO_PRICE
    });

    // Create Stripe checkout session for bulk video purchase
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: BULK_VIDEO_PRICE,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://productdescriptions.io'}/bulk-video-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://productdescriptions.io'}/bulk.html`,
      customer_email: customerEmail,
      metadata: {
        type: 'bulk_video',
        videoCount: videoCount.toString(),
        productIds: products.slice(0, 10).map(p => p.product_name || p.id).join(',')
      }
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url,
      videoCount,
      totalPrice: 199
    });
  } catch (error) {
    console.error('Bulk video checkout error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode
    });
    
    res.status(500).json({ 
      error: 'Failed to create bulk video checkout',
      message: error.message,
      type: error.type || 'Unknown error'
    });
  }
};