const { validateApiKey, checkUsageLimits } = require('../lib/api-keys');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests'
    });
  }
  
  // Extract API key
  const apiKey = req.headers['x-api-key'];
  
  // If no API key, return general status
  if (!apiKey) {
    return res.status(200).json({
      status: 'operational',
      message: 'API is running',
      version: 'v1',
      timestamp: new Date().toISOString(),
      endpoints: {
        documentation: '/api/v1',
        generate: '/api/v1/generate',
        status: '/api/v1/status'
      }
    });
  }
  
  // Validate API key
  const { valid, keyData, error } = validateApiKey(apiKey);
  if (!valid) {
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: error 
    });
  }
  
  // Check usage
  const usage = checkUsageLimits(apiKey);
  
  // Return detailed status for authenticated user
  res.status(200).json({
    status: 'operational',
    account: {
      name: keyData.name,
      plan: keyData.plan,
      created: keyData.created
    },
    usage: {
      current_month: keyData.usage.currentMonth,
      monthly_limit: keyData.limits.requestsPerMonth,
      remaining: usage.remaining,
      percentage_used: Math.round((keyData.usage.currentMonth / keyData.limits.requestsPerMonth) * 100),
      reset_date: getMonthlyResetDate()
    },
    rate_limits: {
      requests_per_minute: keyData.limits.requestsPerMinute
    },
    api_version: 'v1',
    timestamp: new Date().toISOString()
  });
};

function getMonthlyResetDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}