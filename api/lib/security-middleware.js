const crypto = require('crypto');
const { checkRateLimit } = require('./rate-limiter');

// Security configuration
const SECURITY_CONFIG = {
  // Encryption settings
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  
  // GDPR compliance
  GDPR_ENABLED: process.env.GDPR_ENABLED !== 'false',
  DATA_RETENTION_DAYS: parseInt(process.env.DATA_RETENTION_DAYS || '90'),
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://api.openai.com https://generativelanguage.googleapis.com",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },
  
  // CORS settings
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:3006', 'http://localhost:3007', 'https://productdescriptions.io'],
  
  // Input validation limits
  MAX_INPUT_LENGTH: {
    productName: 200,
    description: 5000,
    features: 1000,
    targetAudience: 500,
    email: 254,
    password: 128
  }
};

// Data encryption functions
function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(SECURITY_CONFIG.ENCRYPTION_KEY.slice(0, 32), 'hex');
  const cipher = crypto.createCipheriv(SECURITY_CONFIG.ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.encrypted) return null;
  
  const key = Buffer.from(SECURITY_CONFIG.ENCRYPTION_KEY.slice(0, 32), 'hex');
  const decipher = crypto.createDecipheriv(
    SECURITY_CONFIG.ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Input sanitization
function sanitizeInput(input, type = 'text') {
  if (!input) return '';
  
  // Convert to string and trim
  let sanitized = String(input).trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Type-specific sanitization
  switch (type) {
    case 'email':
      sanitized = sanitized.toLowerCase();
      sanitized = sanitized.replace(/[^\w@.-]/g, '');
      break;
    
    case 'number':
      sanitized = sanitized.replace(/[^0-9.-]/g, '');
      break;
    
    case 'alphanumeric':
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s-]/g, '');
      break;
    
    case 'html':
      // Basic HTML entity encoding
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
      break;
    
    default:
      // Remove potential script tags and SQL injection attempts
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/gi, '');
  }
  
  return sanitized;
}

// Validate input length
function validateInputLength(input, fieldName) {
  const maxLength = SECURITY_CONFIG.MAX_INPUT_LENGTH[fieldName];
  if (!maxLength) return true;
  
  if (!input) return true;
  
  return String(input).length <= maxLength;
}

// GDPR compliance helpers
function anonymizePersonalData(data) {
  if (!data) return data;
  
  const anonymized = { ...data };
  
  // Anonymize email
  if (anonymized.email) {
    const [local, domain] = anonymized.email.split('@');
    anonymized.email = `${local.slice(0, 2)}***@${domain}`;
  }
  
  // Anonymize name
  if (anonymized.name) {
    anonymized.name = anonymized.name.slice(0, 1) + '***';
  }
  
  // Remove sensitive fields
  delete anonymized.password;
  delete anonymized.creditCard;
  delete anonymized.ssn;
  delete anonymized.phoneNumber;
  
  return anonymized;
}

function pseudonymizeData(data, userId) {
  if (!data) return data;
  
  const pseudonym = crypto
    .createHash('sha256')
    .update(userId + SECURITY_CONFIG.ENCRYPTION_KEY)
    .digest('hex')
    .slice(0, 16);
  
  return {
    ...data,
    userId: pseudonym,
    email: undefined,
    name: undefined,
    originalUserId: undefined
  };
}

// Security middleware
async function securityMiddleware(req, res, options = {}) {
  const {
    requireAuth = false,
    rateLimit = true,
    validateInput = true,
    gdprCompliant = SECURITY_CONFIG.GDPR_ENABLED
  } = options;
  
  // Apply security headers
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
  
  // CORS handling
  const origin = req.headers.origin;
  if (SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }
  
  // Rate limiting
  if (rateLimit) {
    const rateLimitResult = checkRateLimit(req);
    if (!rateLimitResult.allowed) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: rateLimitResult.retryAfter
      });
      return false;
    }
    
    res.setHeader('X-RateLimit-Limit', rateLimitResult.limit || 30);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
  }
  
  // Input validation and sanitization
  if (validateInput && req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      // Check length
      if (!validateInputLength(value, key)) {
        res.status(400).json({
          error: `Input too long for field: ${key}`
        });
        return false;
      }
      
      // Sanitize input
      if (typeof value === 'string') {
        req.body[key] = sanitizeInput(value, key === 'email' ? 'email' : 'text');
      }
    }
  }
  
  // Authentication check
  if (requireAuth) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return false;
    }
    
    // Verify JWT token (implement your JWT verification here)
    const token = authHeader.slice(7);
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production');
      req.user = decoded;
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return false;
    }
  }
  
  // GDPR compliance logging
  if (gdprCompliant) {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.url,
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userId: req.user?.userId,
      purpose: 'service_provision'
    };
    
    // Log data access (implement your logging mechanism)
    console.log('GDPR Data Access Log:', anonymizePersonalData(logData));
  }
  
  return true;
}

// Data retention policy enforcer
function enforceDataRetention(data, createdAt) {
  if (!SECURITY_CONFIG.GDPR_ENABLED) return data;
  
  const retentionPeriod = SECURITY_CONFIG.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const dataAge = Date.now() - new Date(createdAt).getTime();
  
  if (dataAge > retentionPeriod) {
    return anonymizePersonalData(data);
  }
  
  return data;
}

// Export consent manager
function createConsentRecord(userId, consentTypes) {
  return {
    userId,
    consentTypes,
    timestamp: new Date().toISOString(),
    ip: null, // Should be filled from request
    version: '1.0',
    withdrawable: true
  };
}

module.exports = {
  securityMiddleware,
  encrypt,
  decrypt,
  sanitizeInput,
  validateInputLength,
  anonymizePersonalData,
  pseudonymizeData,
  enforceDataRetention,
  createConsentRecord,
  SECURITY_CONFIG
};