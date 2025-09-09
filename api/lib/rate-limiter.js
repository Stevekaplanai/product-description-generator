// Simple in-memory rate limiter for Vercel serverless functions
const requestCounts = new Map();
const WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS = {
  '/api/generate-description': 10,
  '/api/bulk-generate': 5,
  '/api/analyze-image': 15,
  '/api/generate-video': 3,
  'default': 30
};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > WINDOW_MS * 2) {
      requestCounts.delete(key);
    }
  }
}, 300000);

function getRateLimitKey(req) {
  // Use IP address or a combination of factors for identification
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';
  const endpoint = req.url?.split('?')[0] || 'unknown';
  return `${ip}:${endpoint}`;
}

function checkRateLimit(req, customLimit = null) {
  const key = getRateLimitKey(req);
  const endpoint = req.url?.split('?')[0] || 'default';
  const limit = customLimit || MAX_REQUESTS[endpoint] || MAX_REQUESTS.default;
  const now = Date.now();
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, {
      count: 1,
      windowStart: now
    });
    return { allowed: true, remaining: limit - 1, resetTime: now + WINDOW_MS, limit };
  }
  
  const data = requestCounts.get(key);
  
  // Reset window if expired
  if (now - data.windowStart > WINDOW_MS) {
    data.count = 1;
    data.windowStart = now;
    return { allowed: true, remaining: limit - 1, resetTime: now + WINDOW_MS, limit };
  }
  
  // Check if limit exceeded
  if (data.count >= limit) {
    const resetTime = data.windowStart + WINDOW_MS;
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime,
      retryAfter: Math.ceil((resetTime - now) / 1000),
      limit
    };
  }
  
  // Increment counter
  data.count++;
  return { 
    allowed: true, 
    remaining: limit - data.count,
    resetTime: data.windowStart + WINDOW_MS,
    limit
  };
}

module.exports = { checkRateLimit };