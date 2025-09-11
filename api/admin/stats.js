// Admin stats endpoint
// In production, this should be protected with proper authentication

const { db } = require('../lib/database');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple auth check (implement proper auth in production)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('admin')) {
    // For now, allow access for development
    // return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { period = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get real stats from database
    const dbStats = await db.getStats(period);
    
    // Combine with mock data for missing fields
    const stats = {
      ...generateMockStats(period),
      totalGenerations: dbStats.totalDescriptions || 0,
      totalImages: dbStats.totalImages || 0,
      totalVideos: dbStats.totalVideos || 0,
      recentActivity: dbStats.recentActivity || []
    };
    
    // Track API call
    if (process.env.POSTHOG_KEY) {
      // Track admin dashboard access
      console.log('Admin dashboard accessed:', {
        period,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      ...stats
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({
      error: 'Failed to fetch admin stats',
      message: error.message
    });
  }
};

// Generate mock statistics
function generateMockStats(period) {
  const multiplier = period === 'today' ? 1 : 
                    period === 'week' ? 7 : 
                    period === 'month' ? 30 : 365;
  
  const baseStats = {
    totalGenerations: Math.floor(1800 * multiplier + Math.random() * 500),
    activeUsers: Math.floor(250 * multiplier + Math.random() * 100),
    videosCreated: Math.floor(120 * multiplier + Math.random() * 50),
    revenue: Math.floor(6500 * multiplier + Math.random() * 2000),
    
    // Percentage changes
    generationsChange: (Math.random() * 30 - 5).toFixed(1),
    usersChange: (Math.random() * 25).toFixed(1),
    videosChange: (Math.random() * 35).toFixed(1),
    revenueChange: (Math.random() * 40).toFixed(1),
    
    // Recent activity
    recentActivity: generateRecentActivity(),
    
    // API usage
    apiUsage: {
      gemini: {
        used: Math.floor(Math.random() * 800),
        limit: 1000,
        remaining: 1000 - Math.floor(Math.random() * 800)
      },
      openai: {
        used: Math.floor(Math.random() * 400),
        limit: 500,
        remaining: 500 - Math.floor(Math.random() * 400)
      },
      did: {
        used: Math.floor(Math.random() * 80),
        limit: 100,
        remaining: 100 - Math.floor(Math.random() * 80)
      },
      stripe: {
        status: 'operational',
        lastCheck: new Date().toISOString()
      }
    },
    
    // User breakdown
    usersByPlan: {
      free: Math.floor(Math.random() * 2000 + 1000),
      starter: Math.floor(Math.random() * 500 + 200),
      professional: Math.floor(Math.random() * 200 + 50),
      enterprise: Math.floor(Math.random() * 50 + 10)
    },
    
    // Generation types
    generationTypes: {
      single: Math.floor(Math.random() * 1000 + 500),
      bulk: Math.floor(Math.random() * 200 + 100),
      withImage: Math.floor(Math.random() * 300 + 150),
      withVideo: Math.floor(Math.random() * 100 + 50)
    },
    
    // Hourly distribution (for charts)
    hourlyData: generateHourlyData(),
    
    // Top users
    topUsers: generateTopUsers(),
    
    // Error rate
    errorRate: (Math.random() * 2).toFixed(2),
    
    // Average response times
    avgResponseTimes: {
      description: Math.floor(Math.random() * 500 + 200),
      image: Math.floor(Math.random() * 2000 + 1000),
      video: Math.floor(Math.random() * 30000 + 15000)
    }
  };
  
  return baseStats;
}

// Generate recent activity feed
function generateRecentActivity() {
  const activities = [];
  const types = ['generation', 'video', 'subscription', 'bulk'];
  const emails = [
    'john@example.com', 'sarah@company.io', 'mike@shop.com',
    'jane@brand.co', 'alex@startup.io', 'emma@store.net'
  ];
  
  for (let i = 0; i < 20; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const minutesAgo = Math.floor(Math.random() * 60);
    
    let title;
    switch (type) {
      case 'generation':
        title = 'Product description generated';
        break;
      case 'video':
        title = 'Video created';
        break;
      case 'subscription':
        const plans = ['Starter', 'Professional', 'Enterprise'];
        title = `New ${plans[Math.floor(Math.random() * plans.length)]} subscription`;
        break;
      case 'bulk':
        const count = Math.floor(Math.random() * 100 + 10);
        title = `Bulk processing (${count} products)`;
        break;
    }
    
    activities.push({
      type,
      title,
      user: emails[Math.floor(Math.random() * emails.length)],
      time: minutesAgo === 0 ? 'Just now' : `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`,
      timestamp: new Date(Date.now() - minutesAgo * 60000).toISOString()
    });
  }
  
  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Generate hourly data for charts
function generateHourlyData() {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      hour: i,
      generations: Math.floor(Math.random() * 200 + 50),
      users: Math.floor(Math.random() * 50 + 10),
      revenue: Math.floor(Math.random() * 500 + 100)
    });
  }
  return data;
}

// Generate top users
function generateTopUsers() {
  const users = [];
  const companies = ['TechCorp', 'ShopMax', 'BrandCo', 'StartupIO', 'StorePlus'];
  
  for (let i = 0; i < 10; i++) {
    users.push({
      email: `user${i + 1}@${companies[Math.floor(Math.random() * companies.length)]}.com`,
      plan: ['Free', 'Starter', 'Professional', 'Enterprise'][Math.floor(Math.random() * 4)],
      generations: Math.floor(Math.random() * 500 + 100),
      videos: Math.floor(Math.random() * 50 + 5),
      revenue: Math.floor(Math.random() * 1000 + 100),
      joinedDaysAgo: Math.floor(Math.random() * 365)
    });
  }
  
  return users.sort((a, b) => b.generations - a.generations);
}

// Helper function to track events (now uses database)
module.exports.trackEvent = async function(type, data) {
  const userId = data.userId || 'system';
  
  switch (type) {
    case 'generation':
      await db.trackGeneration(userId, 'description', data);
      break;
    case 'image':
      await db.trackGeneration(userId, 'image', data);
      break;
    case 'video':
      await db.trackGeneration(userId, 'video', data);
      break;
    case 'bulk':
      await db.trackGeneration(userId, 'bulk', data);
      break;
    case 'user':
      // User tracking handled by db.createUser
      break;
    case 'revenue':
      // Revenue tracking would go to payment system
      break;
  }
};