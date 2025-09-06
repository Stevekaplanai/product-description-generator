// Stripe Configuration
// IMPORTANT: Update these price IDs with your actual Stripe price IDs
// To get these IDs:
// 1. Go to https://dashboard.stripe.com/test/products
// 2. Create products for each tier if they don't exist
// 3. Copy the price ID for each product (starts with price_)

const STRIPE_CONFIG = {
  // Test mode public key (this is correct and can be shared publicly)
  publicKey: 'pk_test_51P9AaXRrVb92Q7hgLRRfCrqlJkjJa8AB6l8UZckgsHSC1RrBBaT7Az1OKK1jvAdsVnalL0n1uhF2TosZPK3O5ZD400GaYSBvSg',
  
  // Price IDs - These are the actual Stripe price IDs from your account
  prices: {
    // Starter Plan - $19/month
    starter: 'price_1S4MT6RrVb92Q7hgzaHZojsJ',
    
    // Professional Plan - $49/month  
    professional: 'price_1S4MTtRrVb92Q7hgw5QpbjTb',
    
    // Enterprise Plan - $149/month
    enterprise: 'price_1S4MUVRrVb92Q7hgTXYQSFpB'
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = STRIPE_CONFIG;
}