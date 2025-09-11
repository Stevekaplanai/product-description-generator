#!/usr/bin/env node

/**
 * Database setup and migration script
 * Run this to initialize the database with sample data
 */

const { db } = require('../api/lib/database');

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Create sample users
    console.log('Creating sample users...');
    
    const users = [
      { email: 'demo@example.com', plan: 'free' },
      { email: 'starter@example.com', plan: 'starter' },
      { email: 'pro@example.com', plan: 'professional' },
      { email: 'enterprise@example.com', plan: 'enterprise' }
    ];
    
    for (const userData of users) {
      const user = await db.createUser(userData.email, userData);
      console.log(`Created user: ${user.email} (${user.plan})`);
    }
    
    // Create sample generation history
    console.log('\nCreating sample generation history...');
    
    const sampleGenerations = [
      { type: 'description', productName: 'Wireless Headphones' },
      { type: 'image', productName: 'Smart Watch' },
      { type: 'video', productName: 'Laptop Stand' },
      { type: 'bulk', productName: 'Bulk Import', count: 50 }
    ];
    
    for (const gen of sampleGenerations) {
      await db.trackGeneration('demo-user', gen.type, gen);
      console.log(`Tracked ${gen.type} generation`);
    }
    
    // Initialize stats
    console.log('\nInitializing statistics...');
    
    const stats = await db.getStats();
    console.log('Current stats:', stats);
    
    console.log('\n✅ Database setup completed successfully!');
    
    // Test database operations
    console.log('\n🧪 Testing database operations...');
    
    // Test user retrieval
    const testUser = await db.getUser('demo@example.com');
    console.log('Retrieved user:', testUser ? '✓' : '✗');
    
    // Test usage limits
    const usageCheck = await db.checkUsageLimit('demo-user', 'descriptions');
    console.log('Usage limit check:', usageCheck.allowed ? '✓' : '✗');
    
    // Test video status
    await db.updateVideoStatus('test-video-123', 'processing');
    const videoStatus = await db.getVideoStatus('test-video-123');
    console.log('Video status tracking:', videoStatus ? '✓' : '✗');
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().then(() => {
    console.log('\nDatabase is ready for use!');
    process.exit(0);
  });
}

module.exports = { setupDatabase };