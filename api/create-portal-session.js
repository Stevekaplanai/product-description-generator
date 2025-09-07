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
    const { customerId, email } = req.body;
    
    let customer;
    
    if (customerId) {
      customer = customerId;
    } else if (email) {
      // Find customer by email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });
      
      if (customers.data.length === 0) {
        return res.status(404).json({ error: 'No subscription found for this email' });
      }
      
      customer = customers.data[0].id;
    } else {
      return res.status(400).json({ error: 'Customer ID or email is required' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer,
      return_url: stripeConfig.urls.portalReturnUrl,
    });

    return res.status(200).json({ 
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ 
      error: 'Failed to create portal session',
      message: error.message 
    });
  }
};