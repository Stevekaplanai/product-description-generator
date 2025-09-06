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

  try {
    const { sessionId, customerId } = req.body;

    let subscription = null;
    let customer = null;

    if (sessionId) {
      // Verify by session ID (after checkout)
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        customer = await stripe.customers.retrieve(session.customer);
        const subscriptions = await stripe.subscriptions.list({
          customer: session.customer,
          status: 'active',
          limit: 1
        });
        
        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data[0];
        }
      }
    } else if (customerId) {
      // Verify by customer ID (returning user)
      customer = await stripe.customers.retrieve(customerId);
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });
      
      if (subscriptions.data.length > 0) {
        subscription = subscriptions.data[0];
      }
    }

    if (subscription) {
      res.status(200).json({
        active: true,
        customerId: customer.id,
        customerEmail: customer.email,
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        status: subscription.status
      });
    } else {
      res.status(200).json({
        active: false,
        message: 'No active subscription found'
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify subscription',
      message: error.message 
    });
  }
};