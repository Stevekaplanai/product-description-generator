#!/usr/bin/env node

/**
 * Initialize production Redis database with initial data
 * Run this once after setting up Redis
 */

require('dotenv').config({ path: '.env.local' });
const { db } = require('../api/lib/database');

async function initProductionDatabase() {
  console.log('🚀 Initializing Production Redis Database...');
  
  if (!process.env.REDIS_URL) {
    console.error('❌ REDIS_URL not found in environment variables');
    process.exit(1);
  }
  
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📊 Setting up initial statistics...');
    
    // Initialize counters
    await db.storage?.set?.('stats:description:total', '0');
    await db.storage?.set?.('stats:image:total', '0');
    await db.storage?.set?.('stats:video:total', '0');
    await db.storage?.set?.('stats:bulk:total', '0');
    
    // Create admin user
    console.log('\n👤 Creating admin user...');
    const adminUser = await db.createUser('admin@productdescriptions.io', {
      plan: 'enterprise',
      role: 'admin',
      source: 'system'
    });
    console.log('✅ Admin user created:', adminUser.email);
    
    // Create sample data for demonstration
    console.log('\n📝 Creating sample data...');
    
    // Track some initial generations for stats
    const sampleProducts = [
      'Wireless Headphones',
      'Smart Watch',
      'Laptop Stand',
      'USB Hub',
      'Phone Case'
    ];
    
    for (const product of sampleProducts) {
      await db.trackGeneration('system', 'description', {
        productName: product,
        demo: true
      });
    }
    
    console.log('✅ Sample generation history created');
    
    // Set up rate limit configurations
    console.log('\n⚡ Configuring rate limits...');
    await db.storage?.set?.('config:ratelimit:description', JSON.stringify({
      window: 60000,
      max: 30
    }));
    await db.storage?.set?.('config:ratelimit:bulk', JSON.stringify({
      window: 300000,
      max: 5
    }));
    await db.storage?.set?.('config:ratelimit:video', JSON.stringify({
      window: 3600000,
      max: 10
    }));
    console.log('✅ Rate limits configured');
    
    // Set up system configuration
    console.log('\n⚙️ Setting system configuration...');
    await db.storage?.set?.('config:system', JSON.stringify({
      version: '2.0.0',
      features: {
        videoGeneration: true,
        bulkProcessing: true,
        emailNotifications: true,
        webhooks: true,
        analytics: true
      },
      models: {
        description: 'gemini-2.0-flash-exp',
        image: 'dall-e-3',
        video: 'd-id'
      },
      initialized: new Date().toISOString()
    }));
    console.log('✅ System configuration set');
    
    // Verify setup
    console.log('\n🔍 Verifying setup...');
    const stats = await db.getStats();
    console.log('Current stats:', {
      totalDescriptions: stats.totalDescriptions,
      recentActivity: stats.recentActivity?.length || 0
    });
    
    const systemConfig = await db.storage?.get?.('config:system');
    if (systemConfig) {
      console.log('✅ System config verified');
    }
    
    console.log('\n✨ Production database initialized successfully!');
    console.log('\n📌 Important Next Steps:');
    console.log('1. Update admin password in admin.html');
    console.log('2. Configure D-ID webhook URL in their dashboard');
    console.log('3. Set up email service (Loops.so or SendGrid)');
    console.log('4. Monitor Redis usage in your Redis Cloud dashboard');
    console.log('5. Set up backup strategy for Redis data');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run initialization
initProductionDatabase().then(() => {
  console.log('\n🎉 Production database ready!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});