/**
 * Database abstraction layer
 * Uses Redis for production or in-memory storage for development
 */

let storage;

// Check if Redis is available
if (process.env.REDIS_URL) {
  // Use Redis in production
  const redis = require('redis');
  const client = redis.createClient({
    url: process.env.REDIS_URL
  });
  
  client.on('error', (err) => console.error('Redis Client Error', err));
  client.connect().then(() => {
    console.log('Connected to Redis successfully');
  });
  
  // Wrap Redis client to match our storage interface
  storage = {
    async get(key) {
      return await client.get(key);
    },
    async set(key, value, options = {}) {
      if (options.ex) {
        return await client.set(key, value, { EX: options.ex });
      }
      return await client.set(key, value);
    },
    async del(key) {
      return await client.del(key);
    },
    async incr(key) {
      return await client.incr(key);
    },
    async expire(key, seconds) {
      return await client.expire(key, seconds);
    },
    async hset(key, field, value) {
      return await client.hSet(key, field, value);
    },
    async hget(key, field) {
      return await client.hGet(key, field);
    },
    async hgetall(key) {
      return await client.hGetAll(key);
    },
    async lpush(key, ...values) {
      return await client.lPush(key, values);
    },
    async lrange(key, start, stop) {
      return await client.lRange(key, start, stop);
    },
    async zadd(key, score, member) {
      return await client.zAdd(key, { score, value: member });
    },
    async zrange(key, start, stop) {
      return await client.zRange(key, start, stop);
    }
  };
} else if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  // Fallback to Vercel KV if available
  const { createClient } = require('@vercel/kv');
  storage = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
} else {
  // Use in-memory storage for development
  console.log('Using in-memory storage (configure Redis or Vercel KV for production)');
  
  const memoryStore = new Map();
  
  storage = {
    async get(key) {
      return memoryStore.get(key);
    },
    
    async set(key, value, options = {}) {
      memoryStore.set(key, value);
      
      // Handle TTL if provided
      if (options.ex) {
        setTimeout(() => {
          memoryStore.delete(key);
        }, options.ex * 1000);
      }
      
      return 'OK';
    },
    
    async del(key) {
      return memoryStore.delete(key) ? 1 : 0;
    },
    
    async incr(key) {
      const current = memoryStore.get(key) || 0;
      const newValue = current + 1;
      memoryStore.set(key, newValue);
      return newValue;
    },
    
    async expire(key, seconds) {
      setTimeout(() => {
        memoryStore.delete(key);
      }, seconds * 1000);
      return 1;
    },
    
    async hset(key, field, value) {
      const hash = memoryStore.get(key) || {};
      hash[field] = value;
      memoryStore.set(key, hash);
      return 1;
    },
    
    async hget(key, field) {
      const hash = memoryStore.get(key) || {};
      return hash[field];
    },
    
    async hgetall(key) {
      return memoryStore.get(key) || {};
    },
    
    async lpush(key, ...values) {
      const list = memoryStore.get(key) || [];
      list.unshift(...values);
      memoryStore.set(key, list);
      return list.length;
    },
    
    async lrange(key, start, stop) {
      const list = memoryStore.get(key) || [];
      const end = stop === -1 ? list.length : stop + 1;
      return list.slice(start, end);
    },
    
    async zadd(key, score, member) {
      const zset = memoryStore.get(key) || [];
      zset.push({ score, member });
      zset.sort((a, b) => a.score - b.score);
      memoryStore.set(key, zset);
      return 1;
    },
    
    async zrange(key, start, stop) {
      const zset = memoryStore.get(key) || [];
      const end = stop === -1 ? zset.length : stop + 1;
      return zset.slice(start, end).map(item => item.member);
    }
  };
}

// Database operations
const db = {
  // User operations
  async createUser(email, data = {}) {
    const userId = `user:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const userData = {
      id: userId,
      email,
      createdAt: new Date().toISOString(),
      plan: 'free',
      ...data
    };
    
    await storage.hset('users', email, JSON.stringify(userData));
    await storage.set(`user:${userId}`, JSON.stringify(userData));
    
    return userData;
  },
  
  async getUser(identifier) {
    // Try by email first
    const userByEmail = await storage.hget('users', identifier);
    if (userByEmail) {
      return JSON.parse(userByEmail);
    }
    
    // Try by user ID
    const userById = await storage.get(`user:${identifier}`);
    if (userById) {
      return JSON.parse(userById);
    }
    
    return null;
  },
  
  async updateUser(identifier, updates) {
    const user = await db.getUser(identifier);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    
    await storage.hset('users', user.email, JSON.stringify(updatedUser));
    await storage.set(`user:${user.id}`, JSON.stringify(updatedUser));
    
    return updatedUser;
  },
  
  // Generation tracking
  async trackGeneration(userId, type, data = {}) {
    const generation = {
      id: `gen:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type, // 'description', 'image', 'video', 'bulk'
      timestamp: new Date().toISOString(),
      ...data
    };
    
    // Store generation
    await storage.lpush(`generations:${userId}`, JSON.stringify(generation));
    await storage.lpush('generations:all', JSON.stringify(generation));
    
    // Update counters
    await storage.incr(`stats:${type}:total`);
    await storage.incr(`stats:${type}:${new Date().toISOString().split('T')[0]}`);
    
    // Update user stats
    await storage.incr(`user:${userId}:${type}:count`);
    
    return generation;
  },
  
  async getGenerations(userId, limit = 10) {
    const generations = await storage.lrange(`generations:${userId}`, 0, limit - 1);
    return generations.map(g => JSON.parse(g));
  },
  
  // Video status tracking
  async updateVideoStatus(videoId, status, data = {}) {
    const videoData = {
      id: videoId,
      status,
      updatedAt: new Date().toISOString(),
      ...data
    };
    
    await storage.set(`video:${videoId}`, JSON.stringify(videoData), { ex: 86400 }); // Expire after 24 hours
    return videoData;
  },
  
  async getVideoStatus(videoId) {
    const data = await storage.get(`video:${videoId}`);
    return data ? JSON.parse(data) : null;
  },
  
  // Subscription management
  async createSubscription(userId, plan, stripeData = {}) {
    const subscription = {
      userId,
      plan,
      status: 'active',
      createdAt: new Date().toISOString(),
      ...stripeData
    };
    
    await storage.set(`subscription:${userId}`, JSON.stringify(subscription));
    await db.updateUser(userId, { plan, subscriptionId: stripeData.subscriptionId });
    
    return subscription;
  },
  
  async getSubscription(userId) {
    const data = await storage.get(`subscription:${userId}`);
    return data ? JSON.parse(data) : null;
  },
  
  // Usage limits
  async checkUsageLimit(userId, resource) {
    const user = await db.getUser(userId);
    if (!user) return { allowed: false, reason: 'User not found' };
    
    const limits = {
      free: { descriptions: 5, images: 0, videos: 0, bulk: 0 },
      starter: { descriptions: 100, images: 20, videos: 5, bulk: 100 },
      professional: { descriptions: 500, images: 100, videos: 20, bulk: 500 },
      enterprise: { descriptions: -1, images: -1, videos: -1, bulk: -1 } // Unlimited
    };
    
    const userLimits = limits[user.plan] || limits.free;
    const limit = userLimits[resource];
    
    if (limit === -1) return { allowed: true, remaining: 'unlimited' };
    
    const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageKey = `usage:${userId}:${resource}:${monthKey}`;
    const currentUsage = await storage.get(usageKey) || 0;
    
    if (currentUsage >= limit) {
      return { 
        allowed: false, 
        reason: 'Monthly limit reached',
        limit,
        used: currentUsage
      };
    }
    
    // Increment usage
    await storage.incr(usageKey);
    await storage.expire(usageKey, 30 * 24 * 60 * 60); // Expire after 30 days
    
    return { 
      allowed: true, 
      remaining: limit - currentUsage - 1,
      limit,
      used: currentUsage + 1
    };
  },
  
  // Analytics
  async getStats(period = 'day') {
    const stats = {};
    const date = new Date().toISOString().split('T')[0];
    
    // Get daily stats
    stats.descriptions = await storage.get(`stats:description:${date}`) || 0;
    stats.images = await storage.get(`stats:image:${date}`) || 0;
    stats.videos = await storage.get(`stats:video:${date}`) || 0;
    stats.bulk = await storage.get(`stats:bulk:${date}`) || 0;
    
    // Get totals
    stats.totalDescriptions = await storage.get('stats:description:total') || 0;
    stats.totalImages = await storage.get('stats:image:total') || 0;
    stats.totalVideos = await storage.get('stats:video:total') || 0;
    stats.totalBulk = await storage.get('stats:bulk:total') || 0;
    
    // Get recent activity
    const recentGenerations = await storage.lrange('generations:all', 0, 19);
    stats.recentActivity = recentGenerations.map(g => JSON.parse(g));
    
    return stats;
  },
  
  // Rate limiting with database
  async checkRateLimit(clientId, endpoint, limits) {
    const key = `ratelimit:${clientId}:${endpoint}`;
    const current = await storage.get(key) || 0;
    
    if (current >= limits.max) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: await storage.get(`${key}:reset`)
      };
    }
    
    // Increment counter
    const newCount = await storage.incr(key);
    
    // Set expiry on first request
    if (newCount === 1) {
      await storage.expire(key, Math.ceil(limits.window / 1000));
      await storage.set(`${key}:reset`, Date.now() + limits.window, { 
        ex: Math.ceil(limits.window / 1000) 
      });
    }
    
    return { 
      allowed: true, 
      remaining: limits.max - newCount,
      resetTime: await storage.get(`${key}:reset`)
    };
  },
  
  // Session management
  async createSession(userId, data = {}) {
    const sessionId = `session:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const sessionData = {
      id: sessionId,
      userId,
      createdAt: new Date().toISOString(),
      ...data
    };
    
    await storage.set(sessionId, JSON.stringify(sessionData), { ex: 86400 }); // 24 hour sessions
    return sessionData;
  },
  
  async getSession(sessionId) {
    const data = await storage.get(sessionId);
    return data ? JSON.parse(data) : null;
  },
  
  // Cleanup old data
  async cleanup() {
    // This would be run as a scheduled job
    console.log('Database cleanup completed');
  }
};

module.exports = { db, storage };