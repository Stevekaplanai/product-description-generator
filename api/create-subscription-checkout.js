const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Subscription price IDs - these should be set in Vercel environment variables
const SUBSCRIPTION_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_test', // $49/month
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_test', // $99/month
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_test' // $299/month
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
    const { plan, customerEmail } = req.body;
    
    if (!plan || !SUBSCRIPTION_PRICES[plan]) {
      return res.status(400).json({ 
        error: 'Invalid subscription plan',
        message: 'Please select a valid plan'
      });
    }
    
    // For enterprise, return contact form instead
    if (plan === 'enterprise') {
      return res.status(200).json({
        contactSales: true,
        message: 'Please contact sales for enterprise pricing',
        email: 'sales@productdescriptions.io'
      });
    }
    
    const priceId = SUBSCRIPTION_PRICES[plan];
    const planDetails = {
      starter: { name: 'Starter Plan', description: '100 products/month' },
      professional: { name: 'Professional Plan', description: '500 products/month + 5 videos' }
    };
    
    console.log('Creating subscription checkout for:', { plan, priceId });

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Subscription mode, not one-time payment
      success_url: `${req.headers.origin || 'https://productdescriptions.io'}/subscription-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://productdescriptions.io'}/bulk.html`,
      customer_email: customerEmail,
      metadata: {
        plan: plan,
        planName: planDetails[plan].name,
        planDescription: planDetails[plan].description
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          plan: plan
        }
      }
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode
    });
    
    res.status(500).json({ 
      error: 'Failed to create subscription checkout',
      message: error.message,
      type: error.type || 'Unknown error'
    });
  }
};