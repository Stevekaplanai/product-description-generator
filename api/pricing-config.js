// Stripe Price IDs - Replace with your actual Stripe price IDs
const PRICING = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '5 product descriptions per month',
      'Basic AI descriptions',
      'Standard templates',
      'Community support'
    ],
    limits: {
      descriptionsPerMonth: 5,
      imagesPerProduct: 1,
      videosPerMonth: 0
    }
  },
  starter: {
    name: 'Starter',
    price: 19,
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
    features: [
      '100 product descriptions per month',
      'Advanced AI descriptions',
      'Custom tone & style',
      'Image generation',
      '10 AI videos per month',
      'Email support'
    ],
    limits: {
      descriptionsPerMonth: 100,
      imagesPerProduct: 3,
      videosPerMonth: 10
    }
  },
  professional: {
    name: 'Professional',
    price: 49,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_placeholder',
    features: [
      '500 product descriptions per month',
      'Premium AI descriptions',
      'Multiple languages',
      'Unlimited image generation',
      '50 AI videos per month',
      'Bulk upload',
      'Priority support'
    ],
    limits: {
      descriptionsPerMonth: 500,
      imagesPerProduct: 10,
      videosPerMonth: 50
    },
    popular: true
  },
  enterprise: {
    name: 'Enterprise',
    price: 149,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',
    features: [
      'Unlimited product descriptions',
      'Custom AI training',
      'API access',
      'Unlimited image generation',
      'Unlimited AI videos',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    limits: {
      descriptionsPerMonth: -1, // Unlimited
      imagesPerProduct: -1,
      videosPerMonth: -1
    }
  }
};

module.exports = PRICING;