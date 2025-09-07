const stripeConfig = require('./config/stripe');
const { sendEmail } = require('./send-email');

// Simple in-memory usage tracking (in production, use a database)
const usageData = new Map();
const warningsSent = new Map(); // Track if we've sent warning emails

// Reset usage monthly (simplified - in production, use cron jobs)
function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email, action, count = 1 } = req.body || req.query;

  if (!email || !action) {
    return res.status(400).json({ error: 'Email and action are required' });
  }

  const monthKey = getMonthKey();
  const userKey = `${email}-${monthKey}`;

  // Get or initialize user usage
  let usage = usageData.get(userKey) || {
    email,
    month: monthKey,
    descriptionsGenerated: 0,
    imagesGenerated: 0,
    videosGenerated: 0,
    bulkUploads: 0,
    apiCalls: 0
  };

  // Update usage based on action
  switch (action) {
    case 'description':
      usage.descriptionsGenerated += count;
      break;
    case 'image':
      usage.imagesGenerated += count;
      break;
    case 'video':
      usage.videosGenerated += count;
      break;
    case 'bulk':
      usage.bulkUploads += count;
      break;
    case 'api':
      usage.apiCalls += count;
      break;
    case 'get':
      // Just return current usage
      return res.status(200).json(usage);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }

  // Save updated usage
  usageData.set(userKey, usage);

  // Check limits based on subscription
  const checkSubscription = await fetch(`${process.env.VERCEL_URL || 'https://productdescriptions.io'}/api/check-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (checkSubscription.ok) {
    const subscription = await checkSubscription.json();
    const limits = subscription.features;

    // Check if user exceeded limits
    const exceeded = [];
    if (limits.descriptionsPerMonth !== -1 && usage.descriptionsGenerated > limits.descriptionsPerMonth) {
      exceeded.push(`descriptions (${usage.descriptionsGenerated}/${limits.descriptionsPerMonth})`);
    }
    if (limits.videosPerMonth !== -1 && usage.videosGenerated > limits.videosPerMonth) {
      exceeded.push(`videos (${usage.videosGenerated}/${limits.videosPerMonth})`);
    }

    if (exceeded.length > 0) {
      return res.status(403).json({
        error: 'Usage limit exceeded',
        exceeded,
        usage,
        limits,
        plan: subscription.plan
      });
    }
    
    // Send warning email at 80% usage
    const warningKey = `${userKey}-warning`;
    if (limits.descriptionsPerMonth !== -1) {
      const percentUsed = (usage.descriptionsGenerated / limits.descriptionsPerMonth) * 100;
      if (percentUsed >= 80 && !warningsSent.get(warningKey)) {
        await sendEmail(email, 'usageLimitWarning', {
          usage: usage.descriptionsGenerated,
          limit: limits.descriptionsPerMonth,
          percentUsed: Math.round(percentUsed),
          plan: subscription.plan
        });
        warningsSent.set(warningKey, true);
      }
    }
  }

  return res.status(200).json({
    success: true,
    usage,
    month: monthKey
  });
};

// Export for use in other modules
module.exports.getUsage = (email) => {
  const monthKey = getMonthKey();
  const userKey = `${email}-${monthKey}`;
  return usageData.get(userKey) || {
    email,
    month: monthKey,
    descriptionsGenerated: 0,
    imagesGenerated: 0,
    videosGenerated: 0,
    bulkUploads: 0,
    apiCalls: 0
  };
};

module.exports.checkLimits = async (email, action, count = 1) => {
  const usage = module.exports.getUsage(email);
  
  // Simulate the increment
  const testUsage = { ...usage };
  switch (action) {
    case 'description':
      testUsage.descriptionsGenerated += count;
      break;
    case 'video':
      testUsage.videosGenerated += count;
      break;
  }

  // Get subscription limits
  try {
    const checkSubscription = await fetch(`${process.env.VERCEL_URL || 'https://productdescriptions.io'}/api/check-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (checkSubscription.ok) {
      const subscription = await checkSubscription.json();
      const limits = subscription.features;

      if (action === 'description' && limits.descriptionsPerMonth !== -1 && testUsage.descriptionsGenerated > limits.descriptionsPerMonth) {
        return { allowed: false, reason: 'Monthly description limit exceeded', limit: limits.descriptionsPerMonth, current: usage.descriptionsGenerated };
      }
      if (action === 'video' && limits.videosPerMonth !== -1 && testUsage.videosGenerated > limits.videosPerMonth) {
        return { allowed: false, reason: 'Monthly video limit exceeded', limit: limits.videosPerMonth, current: usage.videosGenerated };
      }
    }
  } catch (error) {
    console.error('Error checking limits:', error);
  }

  return { allowed: true };
};