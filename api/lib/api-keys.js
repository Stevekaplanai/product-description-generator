// API Key Management System
const crypto = require('crypto');

// In production, these would be stored in a database
// For now, we'll use in-memory storage with some demo keys
const apiKeys = new Map([
  // Demo key for testing
  ['demo_test_key_123456789', {
    id: 'demo_account',
    name: 'Demo Account',
    email: 'demo@example.com',
    plan: 'free',
    created: new Date('2024-01-01'),
    limits: {
      requestsPerMonth: 100,
      requestsPerMinute: 5
    },
    usage: {
      currentMonth: 0,
      lastReset: new Date().toISOString()
    }
  }],
  // Example paid tier key
  ['prod_key_shopify_abc123xyz', {
    id: 'shopify_store_001',
    name: 'Example Shopify Store',
    email: 'store@example.com',
    plan: 'professional',
    created: new Date('2024-01-15'),
    limits: {
      requestsPerMonth: 5000,
      requestsPerMinute: 30
    },
    usage: {
      currentMonth: 0,
      lastReset: new Date().toISOString()
    }
  }]
]);

// Track rate limits per API key
const rateLimits = new Map();

/**
 * Generate a new API key
 */
function generateApiKey(prefix = 'pk') {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${randomBytes}`;
}

/**
 * Validate an API key
 */
function validateApiKey(apiKey) {
  if (!apiKey) {
    return { valid: false, error: 'API key is required' };
  }
  
  const keyData = apiKeys.get(apiKey);
  if (!keyData) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  return { valid: true, keyData };
}

/**
 * Check rate limits for an API key
 */
function checkApiRateLimit(apiKey) {
  const { valid, keyData, error } = validateApiKey(apiKey);
  if (!valid) {
    return { allowed: false, error };
  }
  
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const limit = keyData.limits.requestsPerMinute;
  
  // Get or create rate limit entry
  const rateLimitKey = `${apiKey}:rate`;
  if (!rateLimits.has(rateLimitKey)) {
    rateLimits.set(rateLimitKey, {
      count: 1,
      windowStart: now
    });
    return { 
      allowed: true, 
      remaining: limit - 1,
      limit,
      resetTime: now + windowMs
    };
  }
  
  const rateLimit = rateLimits.get(rateLimitKey);
  
  // Reset window if expired
  if (now - rateLimit.windowStart > windowMs) {
    rateLimit.count = 1;
    rateLimit.windowStart = now;
    return { 
      allowed: true, 
      remaining: limit - 1,
      limit,
      resetTime: now + windowMs
    };
  }
  
  // Check if limit exceeded
  if (rateLimit.count >= limit) {
    const resetTime = rateLimit.windowStart + windowMs;
    return { 
      allowed: false, 
      remaining: 0,
      limit,
      resetTime,
      retryAfter: Math.ceil((resetTime - now) / 1000),
      error: `Rate limit exceeded. Try again in ${Math.ceil((resetTime - now) / 1000)} seconds`
    };
  }
  
  // Increment counter
  rateLimit.count++;
  return { 
    allowed: true, 
    remaining: limit - rateLimit.count,
    limit,
    resetTime: rateLimit.windowStart + windowMs
  };
}

/**
 * Check monthly usage limits
 */
function checkUsageLimits(apiKey) {
  const { valid, keyData, error } = validateApiKey(apiKey);
  if (!valid) {
    return { allowed: false, error };
  }
  
  // Reset monthly usage if needed
  const now = new Date();
  const lastReset = new Date(keyData.usage.lastReset);
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    keyData.usage.currentMonth = 0;
    keyData.usage.lastReset = now.toISOString();
  }
  
  // Check monthly limit
  if (keyData.usage.currentMonth >= keyData.limits.requestsPerMonth) {
    return { 
      allowed: false, 
      error: `Monthly limit of ${keyData.limits.requestsPerMonth} requests exceeded`,
      limit: keyData.limits.requestsPerMonth,
      used: keyData.usage.currentMonth
    };
  }
  
  return { 
    allowed: true,
    remaining: keyData.limits.requestsPerMonth - keyData.usage.currentMonth,
    limit: keyData.limits.requestsPerMonth,
    used: keyData.usage.currentMonth
  };
}

/**
 * Increment usage counter
 */
function incrementUsage(apiKey) {
  const keyData = apiKeys.get(apiKey);
  if (keyData) {
    keyData.usage.currentMonth++;
    return keyData.usage.currentMonth;
  }
  return 0;
}

/**
 * Create a new API key for a customer
 */
function createApiKey(customerData) {
  const apiKey = generateApiKey(customerData.plan === 'free' ? 'demo' : 'prod');
  
  const limits = {
    free: { requestsPerMonth: 100, requestsPerMinute: 5 },
    starter: { requestsPerMonth: 1000, requestsPerMinute: 10 },
    professional: { requestsPerMonth: 5000, requestsPerMinute: 30 },
    enterprise: { requestsPerMonth: 50000, requestsPerMinute: 100 }
  };
  
  apiKeys.set(apiKey, {
    id: customerData.id || crypto.randomBytes(8).toString('hex'),
    name: customerData.name,
    email: customerData.email,
    plan: customerData.plan || 'free',
    created: new Date(),
    limits: limits[customerData.plan] || limits.free,
    usage: {
      currentMonth: 0,
      lastReset: new Date().toISOString()
    }
  });
  
  return apiKey;
}

/**
 * List all API keys (admin function)
 */
function listApiKeys() {
  const keys = [];
  for (const [key, data] of apiKeys.entries()) {
    keys.push({
      key: key.substring(0, 10) + '...', // Partially hidden
      ...data
    });
  }
  return keys;
}

module.exports = {
  generateApiKey,
  validateApiKey,
  checkApiRateLimit,
  checkUsageLimits,
  incrementUsage,
  createApiKey,
  listApiKeys
};