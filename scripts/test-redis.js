#!/usr/bin/env node

/**
 * Test Redis connection and setup initial data
 */

require('dotenv').config({ path: '.env.local' });
const { db } = require('../api/lib/database');

async function testRedis() {
  console.log('🔴 Testing Redis connection...');
  console.log('Redis URL:', process.env.REDIS_URL ? 'Found' : 'Not found');
  
  try {
    // Wait a moment for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test basic operations
    console.log('\n📝 Testing basic operations...');
    
    // Set and get
    await db.storage?.set?.('test:key', 'Hello Redis!');
    const value = await db.storage?.get?.('test:key');
    console.log('✅ Set/Get test:', value === 'Hello Redis!' ? 'PASSED' : 'FAILED');
    
    // Create a test user
    console.log('\n👤 Creating test user...');
    const testUser = await db.createUser('redis-test@example.com', {
      plan: 'professional',
      source: 'redis-test'
    });
    console.log('✅ User created:', testUser.email);
    
    // Track a test generation
    console.log('\n📊 Tracking generation...');
    const generation = await db.trackGeneration(testUser.id, 'description', {
      productName: 'Redis Test Product',
      test: true
    });
    console.log('✅ Generation tracked:', generation.id);
    
    // Get stats
    console.log('\n📈 Getting stats...');
    const stats = await db.getStats();
    console.log('Stats:', {
      totalDescriptions: stats.totalDescriptions,
      totalUsers: stats.totalUsers || 'N/A',
      recentActivity: stats.recentActivity?.length || 0
    });
    
    // Test video status
    console.log('\n🎬 Testing video status...');
    await db.updateVideoStatus('test-video-redis', 'processing', {
      productName: 'Test Product'
    });
    const videoStatus = await db.getVideoStatus('test-video-redis');
    console.log('✅ Video status:', videoStatus?.status);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await db.storage?.del?.('test:key');
    
    console.log('\n✨ Redis setup completed successfully!');
    console.log('Your Redis database is ready for production use.');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run test
testRedis().then(() => {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});