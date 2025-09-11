// Rate limiting middleware
const rateLimit = new Map();

// Configuration for different endpoints
const RATE_LIMITS = {
  '/api/generate-description': {
    window: 60000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many description requests. Please try again in a minute.'
  },
  '/api/bulk-generate': {
    window: 300000, // 5 minutes
    max: 5, // 5 bulk requests per 5 minutes
    message: 'Too many bulk requests. Please wait 5 minutes.'
  },
  '/api/generate-video': {
    window: 3600000, // 1 hour
    max: 10, // 10 videos per hour
    message: 'Video generation limit reached. Please try again later.'
  },
  '/api/analyze-image': {
    window: 60000, // 1 minute
    max: 20, // 20 image analyses per minute
    message: 'Too many image analysis requests. Please slow down.'
  },
  default: {
    window: 60000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Rate limit exceeded. Please try again later.'
  }
};

// Get client identifier (IP or user ID)
function getClientId(req) {
  // Try to get user ID from headers or session
  const userId = req.headers['x-user-id'] || req.headers['x-api-key'];
  if (userId) return `user:${userId}`;
  
  // Fall back to IP address
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';
  return `ip:${ip}`;
}

// Clean up old entries
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimit.entries()) {
    if (now - data.resetTime > 3600000) { // Clean up entries older than 1 hour
      rateLimit.delete(key);
    }
  }
}

// Rate limiting middleware
function rateLimitMiddleware(endpoint) {
  return async (req, res, next) => {
    // Skip rate limiting for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next ? next() : res.status(200).end();
    }
    
    // Get rate limit config for this endpoint
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const clientId = getClientId(req);
    const key = `${clientId}:${endpoint}`;
    const now = Date.now();
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      cleanupOldEntries();
    }
    
    // Get or create rate limit data for this client
    let clientData = rateLimit.get(key);
    
    if (!clientData || now > clientData.resetTime) {
      // Create new window
      clientData = {
        count: 0,
        resetTime: now + config.window,
        firstRequest: now
      };
      rateLimit.set(key, clientData);
    }
    
    // Check if limit exceeded
    if (clientData.count >= config.max) {
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
      res.setHeader('Retry-After', retryAfter);
      
      // Log rate limit hit
      console.log('Rate limit exceeded:', {
        clientId,
        endpoint,
        count: clientData.count,
        resetIn: retryAfter
      });
      
      // Track in analytics
      if (process.env.POSTHOG_KEY) {
        // Track rate limit event
      }
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: config.message,
        retryAfter,
        resetTime: new Date(clientData.resetTime).toISOString()
      });
    }
    
    // Increment counter
    clientData.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', config.max - clientData.count);
    res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
    
    // Continue to next middleware or handler
    if (next) {
      next();
    }
  };
}

// Wrapper for Vercel serverless functions
function withRateLimit(handler, endpoint) {
  const limiter = rateLimitMiddleware(endpoint);
  
  return async (req, res) => {
    return new Promise((resolve) => {
      limiter(req, res, async () => {
        await handler(req, res);
        resolve();
      });
    });
  };
}

// Get current rate limit status for a client
function getRateLimitStatus(clientId, endpoint) {
  const key = `${clientId}:${endpoint}`;
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const clientData = rateLimit.get(key);
  const now = Date.now();
  
  if (!clientData || now > clientData.resetTime) {
    return {
      limit: config.max,
      remaining: config.max,
      reset: new Date(now + config.window).toISOString(),
      used: 0
    };
  }
  
  return {
    limit: config.max,
    remaining: Math.max(0, config.max - clientData.count),
    reset: new Date(clientData.resetTime).toISOString(),
    used: clientData.count
  };
}

// Export for use in other modules
module.exports = {
  rateLimitMiddleware,
  withRateLimit,
  getRateLimitStatus,
  getClientId,
  RATE_LIMITS
};