const stripeConfig = require('./config/stripe');
const stripe = require('stripe')(stripeConfig.secretKey, stripeConfig.options);

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
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Special override for testing enterprise features
    if (email === 'steve@gtmvp.com') {
      return res.status(200).json({
        hasSubscription: true,
        plan: 'enterprise',
        features: stripeConfig.plans.enterprise.features,
        customerId: 'test_enterprise_customer',
        subscriptionId: 'test_enterprise_subscription',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        isTestOverride: true
      });
    }

    // Search for customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(200).json({
        hasSubscription: false,
        plan: 'free',
        features: stripeConfig.plans.free.features
      });
    }

    const customer = customers.data[0];

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(200).json({
        hasSubscription: false,
        plan: 'free',
        features: stripeConfig.plans.free.features
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    
    // Determine plan based on price ID
    let plan = 'free';
    if (priceId === stripeConfig.prices.starter) {
      plan = 'starter';
    } else if (priceId === stripeConfig.prices.professional) {
      plan = 'professional';
    } else if (priceId === stripeConfig.prices.enterprise) {
      plan = 'enterprise';
    }

    return res.status(200).json({
      hasSubscription: true,
      plan: plan,
      features: stripeConfig.plans[plan].features,
      customerId: customer.id,
      subscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error checking subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to check subscription status',
      message: error.message 
    });
  }
};