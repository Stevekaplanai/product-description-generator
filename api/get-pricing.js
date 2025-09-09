const PRICING = require('./pricing-config');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return pricing configuration
    return res.status(200).json({
      success: true,
      pricing: PRICING,
      currency: 'USD',
      billingCycle: 'monthly'
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing configuration'
    });
  }
};