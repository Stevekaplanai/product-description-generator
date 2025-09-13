const { getUserCredits, getUsageHistory } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate the request
  await new Promise((resolve, reject) => {
    authenticateToken(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch(() => {
    // Response already sent by authenticateToken
    return;
  });

  if (!req.user) {
    return; // Response already sent
  }

  try {
    // Get user credits
    const credits = await getUserCredits(req.user.id);

    // Get usage history for the last 7 days
    const usage = await getUsageHistory(req.user.id, 7);

    res.status(200).json({
      success: true,
      credits,
      usage,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        plan: req.user.plan
      }
    });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({
      error: 'Failed to retrieve credits'
    });
  }
};