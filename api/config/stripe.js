/**
 * Stripe Configuration
 * Handles both test and production modes
 */

const isProduction = process.env.NODE_ENV === 'production';
const useProductionStripe = process.env.STRIPE_MODE === 'live';

module.exports = {
  // Select keys based on environment
  // Support both old (STRIPE_SECRET_KEY) and new (STRIPE_LIVE_SECRET_KEY) formats
  secretKey: useProductionStripe 
    ? (process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY)
    : (process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY),
  
  publishableKey: useProductionStripe
    ? (process.env.STRIPE_LIVE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY)
    : (process.env.STRIPE_TEST_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY),
  
  // Webhook secret (same for test and production)
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Price IDs (different for test and production)
  prices: {
    free: process.env.STRIPE_PRICE_FREE || 'price_free_test',
    starter: process.env.STRIPE_PRICE_STARTER || 'price_1QaTestStarterPrice',
    professional: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_1QaTestProPrice',
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_1QaTestEnterprisePrice',
    videoSingle: process.env.STRIPE_PRICE_VIDEO_SINGLE || 'price_1QaTestVideoSingle',
    videoPack: process.env.STRIPE_PRICE_VIDEO_PACK || 'price_1QaTestVideoPack'
  },
  
  // Subscription features by plan
  plans: {
    free: {
      name: 'Free',
      price: 0,
      features: {
        descriptionsPerMonth: 5,
        imagesPerProduct: 1,
        videosPerMonth: 0,
        bulkUpload: false,
        apiAccess: false,
        prioritySupport: false
      }
    },
    starter: {
      name: 'Starter',
      price: 19,
      features: {
        descriptionsPerMonth: 100,
        imagesPerProduct: 3,
        videosPerMonth: 10,
        bulkUpload: false,
        apiAccess: false,
        prioritySupport: false
      }
    },
    professional: {
      name: 'Professional',
      price: 49,
      features: {
        descriptionsPerMonth: 500,
        imagesPerProduct: -1, // unlimited
        videosPerMonth: 50,
        bulkUpload: true,
        apiAccess: true,
        prioritySupport: true
      }
    },
    enterprise: {
      name: 'Enterprise',
      price: 149,
      features: {
        descriptionsPerMonth: -1, // unlimited
        imagesPerProduct: -1, // unlimited
        videosPerMonth: -1, // unlimited
        bulkUpload: true,
        apiAccess: true,
        prioritySupport: true,
        customIntegrations: true,
        sla: true
      }
    }
  },
  
  // Stripe configuration options
  options: {
    apiVersion: '2023-10-16',
    typescript: false,
    maxNetworkRetries: 2,
    timeout: 30000 // 30 seconds
  },
  
  // URLs for success/cancel redirects
  urls: {
    successUrl: `${process.env.APP_URL || 'https://productdescriptions.io'}/app.html?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env.APP_URL || 'https://productdescriptions.io'}/app.html?subscription=cancelled`,
    portalReturnUrl: `${process.env.APP_URL || 'https://productdescriptions.io'}/app.html`
  },
  
  // Mode indicator for debugging
  mode: useProductionStripe ? 'PRODUCTION' : 'TEST',
  isTestMode: !useProductionStripe,
  
  // Helper to check if Stripe is properly configured
  isConfigured: function() {
    return !!(this.secretKey && this.publishableKey);
  },
  
  // Get status for display
  getStatus: function() {
    return {
      mode: this.mode,
      configured: this.isConfigured(),
      hasWebhookSecret: !!this.webhookSecret,
      environment: isProduction ? 'production' : 'development'
    };
  }
};