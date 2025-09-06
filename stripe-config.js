// Stripe Configuration
// IMPORTANT: Update these price IDs with your actual Stripe price IDs
// To get these IDs:
// 1. Go to https://dashboard.stripe.com/test/products
// 2. Create products for each tier if they don't exist
// 3. Copy the price ID for each product (starts with price_)

const STRIPE_CONFIG = {
  // Test mode public key (this is correct and can be shared publicly)
  publicKey: 'pk_test_51PvWE9033zrJmRoAqJPelFPJnQBaUo51KRhEfJCRc3RXEQ8VGJYRxkNfvEzUo8Q1Y8Y9qwbNNRj6cQEh0hnHqZOg00cxrfKqTU',
  
  // Price IDs - UPDATE THESE WITH YOUR ACTUAL STRIPE PRICE IDs
  prices: {
    // Starter Plan - $19/month
    starter: 'price_REPLACE_WITH_YOUR_STARTER_PRICE_ID',
    
    // Professional Plan - $49/month  
    professional: 'price_REPLACE_WITH_YOUR_PROFESSIONAL_PRICE_ID',
    
    // Enterprise Plan - $149/month
    enterprise: 'price_REPLACE_WITH_YOUR_ENTERPRISE_PRICE_ID'
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = STRIPE_CONFIG;
}