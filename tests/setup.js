// Test setup and configuration
require('dotenv').config({ path: '.env.test' });

// Mock environment variables for testing
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-gemini-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
process.env.D_ID_API_KEY = process.env.D_ID_API_KEY || 'test-did-key';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'test-stripe-key';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-cloudinary-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-cloudinary-secret';

// Global test utilities
global.testUtils = {
  generateMockProduct: () => ({
    productName: 'Test Product',
    category: 'electronics',
    features: 'High quality, durable, innovative',
    targetAudience: 'Tech enthusiasts',
    tone: 'professional'
  }),
  
  generateMockUser: () => ({
    email: 'test@example.com',
    userId: 'test-user-123',
    plan: 'starter'
  }),
  
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after tests
afterAll(() => {
  // Close any open connections
});